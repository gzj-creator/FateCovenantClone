import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, rosterScores,
  toSeconds, resOf, grantAwards, asInteger, etfArgs, decodeCoopRequest, lineupPower, damageFromPower
} from './guild-coop-shared.mjs';

// GuildJointCmd 91601-91625 (GVE: guild joint exploration and resource
// contention). The guild document owns the shared map (monster HP, doors,
// lodes, score, pioneers); each role document owns personal progress, boxes,
// reports and the optional single-player run. Damage comes from the actor's
// real lineup power, and the ranked board is computed from recorded events.
export const GUILD_JOINT_COMMANDS = Object.freeze({
  pickBox: 91601, pickMonster: 91602, pickDoor: 91603, pickLode: 91604, task: 91605,
  revLode: 91606, roleRank: 91607, setPioneer: 91608, cancelDoor: 91609, setFocus: 91610,
  fightReport: 91611, getInfo: 91612, singleMonster: 91613, singleBox: 91614, singleDoor: 91615,
  calcDoor: 91616, settleRank: 91617, enterSingle: 91618, singleSettle: 91619, singleCancel: 91620,
  share: 91621, cancelMonster: 91622, calcMonster: 91623, setAuto: 91624, oneGet: 91625
});

const SCOPE = 'guild_joint';
const REQUEST_SCHEMAS = { 91608: 'pb_guild_j_set_pioneer_req', 91625: 'pb_guild_joint_rev_one_get_req' };

export function createGuildJointService({ store, codec, tables, heroTables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.joint;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_JOINT_COMMANDS));

  function taskView(person) {
    const claimed = person.task?.claimed ?? [];
    const rows = config.taskAwards.map(row => ({ tid: row.tid, progress: Math.min(Number(person.task?.kills ?? 0), row.need), need: row.need, claimed: claimed.includes(row.tid) }));
    return { guild_glory_task: Buffer.from(JSON.stringify(rows)), person_glory_task: Buffer.from(JSON.stringify({ kills: Number(person.task?.kills ?? 0), claimed })) };
  }

  function periodWindow(at) {
    const start = Math.floor(at / config.periodSeconds) * config.periodSeconds;
    return { version: Math.floor(start / config.periodSeconds), start, end: start + config.periodSeconds };
  }

  function freshGuild(at) {
    const window = periodWindow(at);
    return {
      version: window.version, start: window.start, end: window.end, nextStart: window.end,
      score: 0, focus: 0, refreshTime: window.start, kills: 0, lastAuto: at,
      monsters: config.nodes.map(node => ({ node: node.node, maxHp: node.maxHp, nowHp: node.maxHp, dead: false, healTime: 0 })),
      doors: [{ node: 99, hp: config.doorHp }],
      lodes: config.nodes.map(node => ({ node: node.node, leftNum: 3, recoverStamp: window.start, updateStamp: window.start, endStamp: window.end, roles: [] })),
      pioneers: [], autoRoles: []
    };
  }

  function guildDoc(db, guildId, at) {
    const existing = readDoc(db, SCOPE, guildId, '0', 'state');
    const window = periodWindow(at);
    if (existing && Number(existing.version) === window.version) return existing;
    const doc = freshGuild(at);
    if (existing) appendEvent(db, { scope: SCOPE, guildId, kind: 'joint_period_reset', details: { version: window.version, previous: existing.version }, at });
    return writeDoc(db, SCOPE, guildId, '0', 'state', doc, at);
  }

  function personDoc(db, guildId, roleId, at) {
    const existing = readDoc(db, SCOPE, guildId, roleId, 'state');
    if (existing) return existing;
    return writeDoc(db, SCOPE, guildId, roleId, 'state', {
      joinTime: at, score: 0, atkCount: 0, boxes: [], task: { claimed: [], kills: 0 }, nowNode: 0,
      single: null, reports: [], shares: [], lode: null, lastRefresh: at
    }, at);
  }

  function monsterView(monster) {
    return { map_node_id: monster.node, histories: [], is_death: Boolean(monster.dead), now_hp: monster.nowHp, max_hp: monster.maxHp, kick_list: [], heal_time: Number(monster.healTime ?? 0) };
  }

  function mapView(doc) {
    return {
      monster_list: doc.monsters.map(monsterView),
      door_list: doc.doors.map(door => ({ map_node_id: door.node, kick_list: [], door_hp: door.hp })),
      lode_list: doc.lodes.map(lode => ({
        map_node_id: lode.node, roles: (lode.roles ?? []).map(role => ({ role_id: role.roleId, end_time_sec: role.endTime, is_end: Boolean(role.isEnd), calc_stamp: role.calcStamp })),
        recover_stamp: lode.recoverStamp, left_num: lode.leftNum, update_stamp: lode.updateStamp, end_stamp: lode.endStamp
      }))
    };
  }

  function personView(person) {
    const lode = person.lode;
    return {
      refresh_time: Number(person.lastRefresh ?? 0),
      box_list: (person.boxes ?? []).map(Number),
      task_data: taskView(person),
      pioneer_count: Number(person.pioneerCount ?? 0),
      has_lode_time: lode ? Math.max(0, Number(lode.endTime ?? 0) - Number(person.lastRefresh ?? 0)) : 0,
      lode_stage_time: lode ? Number(lode.startTime ?? 0) : 0,
      lode_map_id: lode ? Number(lode.node ?? 0) : 0,
      lode_start_time: lode ? Number(lode.startTime ?? 0) : 0,
      report_list: (person.reports ?? []).map(report => ({ role_id: report.roleId, result: report.result, enemy_id: report.enemyId, duct_hp: report.ductHp, fight_time: report.fightTime, report_id: report.reportId })),
      now_node: Number(person.nowNode ?? 0),
      share_list: (person.shares ?? []).map(share => ({ map_node_id: share.node, time: share.time })),
      limit_lode_award_info: { refresh_time: Number(person.lastRefresh ?? 0), limit_award_list: [], limit_stone_count: 0 }
    };
  }

  function guildEntryView(doc) {
    return {
      score: Number(doc.score ?? 0),
      pioneer_list: (doc.pioneers ?? []).map(pioneer => ({ index: pioneer.index, role_id: pioneer.roleId })),
      focus: Number(doc.focus ?? 0),
      refresh_time: Number(doc.refreshTime ?? 0),
      stat_data: {},
      auto_role_list: (doc.autoRoles ?? []).map(Number)
    };
  }

  function periodView(doc) {
    return { version: Number(doc.version), start_time: Number(doc.start), end_time: Number(doc.end), next_start_time: Number(doc.nextStart), settle_version: Number(doc.settledVersion ?? 0), day_power: [], ref_day: 0 };
  }

  function roleMapView(person, doc) {
    const single = person.single;
    if (!single) return { monster: [], rev_box: [], door: [], is_finish: false };
    const monster = doc.monsters.find(entry => entry.node === single.node);
    return {
      monster: monster ? [{ map_node_id: monster.node, histories: [], is_death: Boolean(monster.dead), now_hp: String(Math.max(0n, BigInt(monster.nowHp) - BigInt(single.damage ?? 0))), max_hp: monster.maxHp, kick_list: [], heal_time: 0 }] : [],
      rev_box: Array.from({ length: Number(single.boxes ?? 0) }, (_, index) => index + 1),
      door: [{ map_node_id: 99, kick_list: [], door_hp: String(Math.max(0n, BigInt(doc.doors[0]?.hp ?? 0) - BigInt(single.doorDamage ?? 0))) }],
      is_finish: false
    };
  }

  function entryPayload(model, context, doc, person) {
    return {
      role_data: personView(person), map: mapView(doc), guild_data: guildEntryView(doc), period: periodView(doc),
      res: resOf([]), single_map: roleMapView(person, doc)
    };
  }

  function addScore(db, guildId, roleId, person, doc, amount, at) {
    person.score = Number(person.score ?? 0) + amount;
    doc.score = Number(doc.score ?? 0) + amount;
    appendEvent(db, { scope: SCOPE, guildId, roleId, kind: 'joint_score', amount, details: { score: person.score }, at });
  }

  function killMonster(db, guildId, roleId, doc, person, monster, at) {
    monster.dead = true;
    monster.nowHp = '0';
    monster.healTime = at;
    doc.kills = Number(doc.kills ?? 0) + 1;
    person.task.kills = Number(person.task?.kills ?? 0) + 1;
    person.boxes = [...(person.boxes ?? []), ...Array.from({ length: config.boxesPerKill }, (_, index) => index + 1)];
    addScore(db, guildId, roleId, person, doc, 10, at);
    person.reports = [{ roleId, result: 1, enemyId: monster.node, ductHp: 0, fightTime: at, reportId: Number(person.reports?.length ?? 0) + 1 }, ...(person.reports ?? [])].slice(0, 20);
    appendEvent(db, { scope: SCOPE, guildId, roleId, kind: 'joint_kill', amount: 1, details: { node: monster.node }, at });
  }

  function getInfo(input) {
    if (etfArgs(input).length) throw new GameError(1, 'Get info takes no parameters');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      person.lastRefresh = at;
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_enter_map_back', entryPayload(model, context, doc, person)), value: { score: person.score, kills: person.task?.kills ?? 0 } };
    });
  }

  function pickMonster(input) {
    const node = asInteger(etfArgs(input)[0], 'map node', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const monster = doc.monsters.find(entry => entry.node === node);
      if (!monster) throw new GameError(1, 'Joint monster does not exist');
      if (monster.dead) throw new GameError(5, 'Joint monster is already defeated');
      const damage = damageFromPower(lineupPower(model, heroTables), config.attackPercent);
      const applied = BigInt(damage) < BigInt(monster.nowHp) ? BigInt(damage) : BigInt(monster.nowHp);
      monster.nowHp = (BigInt(monster.nowHp) - applied).toString();
      person.nowNode = node;
      person.atkCount = Number(person.atkCount ?? 0) + 1;
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'joint_damage', amount: Number(applied), details: { node }, at });
      if (monster.nowHp === '0') killMonster(db, context.guildId, context.roleId, doc, person, monster, at);
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      const data = codec.pack('pb_guild_joint_atk_monster', { monster: monsterView(monster), res: resOf([]), person: personView(person), hurt: applied.toString() });
      return { data, value: { node, damage: applied.toString(), killed: monster.dead } };
    });
  }

  function pickBox() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (!(person.boxes ?? []).length) throw new GameError(5, 'No joint box is available');
      person.boxes.splice(0, 1);
      const changes = grantAwards(model, tables, config.boxAwards);
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'joint_box', amount: 1, details: {}, at });
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { remaining: person.boxes.length } };
    });
  }

  function pickDoor(input) {
    const node = asInteger(etfArgs(input)[0] ?? 99, 'door node', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const door = doc.doors.find(entry => entry.node === node);
      if (!door) throw new GameError(1, 'Joint door does not exist');
      if (BigInt(door.hp) <= 0n) throw new GameError(5, 'Joint door is already broken');
      const damage = damageFromPower(lineupPower(model, heroTables), config.attackPercent);
      door.hp = (BigInt(door.hp) - BigInt(damage) > 0n ? BigInt(door.hp) - BigInt(damage) : 0n).toString();
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'joint_door_damage', amount: Number(damage), details: { node }, at });
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: Buffer.alloc(0), value: { node, doorHp: door.hp } };
    });
  }

  function claimTask(db, model, context, doc, person, tid, at) {
    const row = config.taskAwards.find(entry => entry.tid === tid);
    if (!row) throw new GameError(1, 'Joint task does not exist');
    const progress = Number(person.task?.kills ?? 0);
    if (progress < row.need) throw new GameError(5, 'Joint task progress is not reached');
    if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'task:' + tid, period: 'v' + doc.version, at })) {
      throw new GameError(310, 'Joint task already claimed');
    }
    person.task.claimed = [...(person.task.claimed ?? []), tid];
    return grantAwards(model, tables, row.items);
  }

  function pickLode(input) {
    const node = asInteger(etfArgs(input)[0], 'lode node', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const lode = doc.lodes.find(entry => entry.node === node);
      if (!lode) throw new GameError(1, 'Joint lode does not exist');
      if (Number(lode.leftNum) <= 0) throw new GameError(5, 'Joint lode has no remaining slot');
      if (person.lode && Number(person.lode.endTime) > at) throw new GameError(5, 'A lode is already occupied');
      lode.leftNum = Number(lode.leftNum) - 1;
      lode.updateStamp = at;
      lode.roles = (lode.roles ?? []).concat([{ roleId: context.roleId, endTime: at + config.lodeSeconds, calcStamp: at, isEnd: false }]);
      person.lode = { node, startTime: at, endTime: at + config.lodeSeconds };
      person.lodeStageTime = at;
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      const data = codec.pack('pb_guild_joint_pick_lode_rsp', {
        lode_info: { map_node_id: lode.node, roles: lode.roles.map(role => ({ role_id: role.roleId, end_time_sec: role.endTime, is_end: false, calc_stamp: role.calcStamp })), recover_stamp: lode.recoverStamp, left_num: lode.leftNum, update_stamp: lode.updateStamp, end_stamp: lode.endStamp },
        res: resOf([]), person: personView(person)
      });
      return { data, value: { node, endTime: person.lode.endTime } };
    });
  }

  function revLode() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (!person.lode) throw new GameError(5, 'No joint lode is occupied');
      if (at < Number(person.lode.endTime)) throw new GameError(5, 'Joint lode is still producing');
      const lode = doc.lodes.find(entry => entry.node === Number(person.lode.node));
      const key = 'lode:' + person.lode.node + ':' + person.lode.startTime;
      if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key, period: 'v' + doc.version, at })) {
        throw new GameError(310, 'Joint lode already collected');
      }
      if (lode) {
        lode.leftNum = Number(lode.leftNum) + 1;
        lode.updateStamp = at;
        lode.roles = (lode.roles ?? []).map(role => String(role.roleId) === context.roleId ? { ...role, isEnd: true } : role);
      }
      addScore(db, context.guildId, context.roleId, person, doc, 5, at);
      person.lode = null;
      const changes = grantAwards(model, tables, config.lodeAwards);
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_rev_lode_rsp', { res: resOf(changes), person: personView(person) }), value: { collected: true, score: person.score } };
    });
  }

  function task(input) {
    const tid = asInteger(etfArgs(input)[0], 'task tid', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const changes = claimTask(db, model, context, doc, person, tid, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_rev_task_rsp', { task_data: taskView(person), res: resOf(changes) }), value: { task: tid } };
    });
  }

  function roleRank() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const rows = rosterScores(db, { scope: SCOPE, guildId: context.guildId, kind: 'joint_score', members: context.members });
      const show = rows.map(row => ({ role_id: row.role_id, score: row.score, have_times: String(row.role_id) === context.roleId ? Number(personDoc(db, context.guildId, context.roleId, at).atkCount ?? 0) : 0 }));
      return { data: codec.pack('pb_guild_role_rank_show_list', { show_list: show }), value: { rows: show.length } };
    });
  }

  function setPioneer(input) {
    const index = asInteger(input?.index, 'pioneer index', { min: 1, max: config.pioneerSlots });
    const roleId = String(input?.role_id ?? '').trim();
    if (!/^[0-9]+$/.test(roleId) || roleId === '0') throw new GameError(1, 'Invalid pioneer role id');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      if (!context.members.some(member => String(member.role_id) === roleId)) throw new GameError(5, 'Pioneer role is not a guild member');
      doc.pioneers = (doc.pioneers ?? []).filter(pioneer => pioneer.index !== index);
      doc.pioneers.push({ index, roleId });
      doc.pioneers.sort((left, right) => left.index - right.index);
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: codec.pack('pb_guild_j_pioneer_rsp', { pioneer_list: doc.pioneers.map(pioneer => ({ index: pioneer.index, role_id: pioneer.roleId })) }), value: { index, roleId } };
    });
  }

  function cancelDoor() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      person.single = null;
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: Buffer.alloc(0), value: { cancelled: true, doorHp: doc.doors[0]?.hp ?? '0' } };
    });
  }

  function setFocus(input) {
    const node = asInteger(etfArgs(input)[0], 'focus node', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      if (!doc.monsters.some(monster => monster.node === node)) throw new GameError(1, 'Focus node does not exist');
      doc.focus = node;
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: Buffer.alloc(0), value: { focus: node } };
    });
  }

  function fightReport() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const list = personView(person).report_list;
      return { data: codec.pack('pb_guild_j_report_rsp', { report_list: list }), value: { reports: list.length } };
    });
  }

  function ensureSingle(person, node, at) {
    person.single = { node, damage: '0', doorDamage: '0', boxes: 0, start: at };
    return person.single;
  }

  function singleMonster(input) {
    const node = asInteger(etfArgs(input)[0], 'single node', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const monster = doc.monsters.find(entry => entry.node === node);
      if (!monster) throw new GameError(1, 'Joint monster does not exist');
      if (monster.dead) throw new GameError(5, 'Joint monster is already defeated');
      if (!person.single || Number(person.single.node) !== node) ensureSingle(person, node, at);
      const damage = damageFromPower(lineupPower(model, heroTables), config.attackPercent);
      person.single.damage = (BigInt(person.single.damage ?? 0) + BigInt(damage)).toString();
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_role_map', roleMapView(person, doc)), value: { node, damage: person.single.damage } };
    });
  }

  function singleSettle() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const single = person.single;
      if (!single) throw new GameError(5, 'No single-run session is active');
      const monster = doc.monsters.find(entry => entry.node === Number(single.node));
      if (!monster || monster.dead) throw new GameError(5, 'Single-run monster is unavailable');
      const applied = BigInt(single.damage ?? 0) < BigInt(monster.nowHp) ? BigInt(single.damage ?? 0) : BigInt(monster.nowHp);
      monster.nowHp = (BigInt(monster.nowHp) - applied).toString();
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'joint_damage', amount: Number(applied), details: { node: monster.node, single: true }, at });
      if (monster.nowHp === '0') killMonster(db, context.guildId, context.roleId, doc, person, monster, at);
      person.single = null;
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_role_map', roleMapView(person, doc)), value: { damage: applied.toString(), killed: monster.dead } };
    });
  }

  function singleCancel() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      person.single = null;
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_role_map', roleMapView(person, doc)), value: { cancelled: true } };
    });
  }

  function singleBox() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (!(person.boxes ?? []).length) throw new GameError(5, 'No joint box is available');
      person.boxes.splice(0, 1);
      const changes = grantAwards(model, tables, config.boxAwards);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { remaining: person.boxes.length } };
    });
  }

  function singleDoor(input) {
    const node = asInteger(etfArgs(input)[0] ?? 99, 'door node', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (!person.single) ensureSingle(person, doc.monsters.find(monster => !monster.dead)?.node ?? config.nodes[0].node, at);
      const damage = damageFromPower(lineupPower(model, heroTables), config.attackPercent);
      person.single.doorDamage = (BigInt(person.single.doorDamage ?? 0) + BigInt(damage)).toString();
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_role_map', roleMapView(person, doc)), value: { node, damage: person.single.doorDamage } };
    });
  }

  function calcDoor() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (person.single?.doorDamage) {
        person.single.doorDamage = '0';
        writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      }
      return { data: Buffer.alloc(0), value: { settled: true } };
    });
  }

  function settleRank() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const rows = rosterScores(db, { scope: SCOPE, guildId: context.guildId, kind: 'joint_score', members: context.members });
      const rank = rows.findIndex(row => row.role_id === context.roleId) + 1;
      const award = config.rankAwards.find(row => row.rank === rank);
      let changes = [];
      if (award && claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'rank', period: 'v' + doc.version, at })) {
        changes = grantAwards(model, tables, award.items);
      }
      doc.settledVersion = doc.version;
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: Buffer.alloc(0), value: { rank, award: Boolean(award), settledVersion: doc.version } };
    });
  }

  function enterSingle(input) {
    const args = etfArgs(input);
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const node = args.length ? asInteger(args[0], 'single node', { min: 1 }) : (doc.monsters.find(monster => !monster.dead)?.node ?? config.nodes[0].node);
      if (!doc.monsters.some(monster => monster.node === node && !monster.dead)) throw new GameError(5, 'No joint monster is available');
      ensureSingle(person, node, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_enter_map_back', entryPayload(model, context, doc, person)), value: { node } };
    });
  }

  function share(input) {
    const args = etfArgs(input);
    const node = args.length ? asInteger(args[0], 'share node', { min: 1 }) : 0;
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      person.shares = [...(person.shares ?? []), { node, time: at }].slice(-20);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: Buffer.alloc(0), value: { node } };
    });
  }

  function cancelMonster() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      person.nowNode = 0;
      person.single = null;
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: Buffer.alloc(0), value: { cancelled: true } };
    });
  }

  function calcMonster() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const elapsed = Math.max(0, at - Number(doc.lastAuto ?? at));
      const ticks = Math.floor(elapsed / 60);
      let damage = 0;
      if (ticks > 0 && (doc.autoRoles ?? []).length) {
        const perTick = damageFromPower(lineupPower(model, heroTables), Math.max(1, Math.floor(config.attackPercent / 3)));
        for (const roleId of doc.autoRoles) {
          for (let tick = 0; tick < ticks; tick += 1) {
            const monster = doc.monsters.find(entry => !entry.dead);
            if (!monster) break;
            const applied = BigInt(perTick) < BigInt(monster.nowHp) ? BigInt(perTick) : BigInt(monster.nowHp);
            monster.nowHp = (BigInt(monster.nowHp) - applied).toString();
            damage += Number(applied);
            appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId, kind: 'joint_damage', amount: Number(applied), details: { node: monster.node, auto: true }, at });
            if (monster.nowHp === '0') {
              const person = personDoc(db, context.guildId, String(roleId), at);
              killMonster(db, context.guildId, String(roleId), doc, person, monster, at);
              writeDoc(db, SCOPE, context.guildId, String(roleId), 'state', person, at);
            }
          }
        }
        doc.lastAuto = at;
        writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      }
      return { data: Buffer.alloc(0), value: { ticks, damage } };
    });
  }

  function setAuto(input) {
    const args = etfArgs(input);
    const enabled = args.length ? Boolean(args[0]) : true;
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const roles = new Set(doc.autoRoles ?? []);
      if (enabled) roles.add(context.roleId); else roles.delete(context.roleId);
      doc.autoRoles = [...roles];
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: codec.pack('pb_guild_joint_guild', guildEntryView(doc)), value: { auto: enabled, roles: doc.autoRoles.length } };
    });
  }

  function oneGet(input) {
    const tasks = Array.isArray(input?.get_task_list) ? input.get_task_list : [];
    const boxes = Array.isArray(input?.map_list) ? input.map_list : [];
    if (!tasks.length && !boxes.length) throw new GameError(1, 'One-get list is empty');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = guildDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const changes = [];
      for (const entry of tasks) {
        const tid = asInteger(entry?.task_tid, 'task tid', { min: 1 });
        changes.push(...claimTask(db, model, context, doc, person, tid, at));
      }
      const picks = Math.min(boxes.length, (person.boxes ?? []).length);
      for (let index = 0; index < picks; index += 1) {
        person.boxes.splice(0, 1);
        changes.push(...grantAwards(model, tables, config.boxAwards));
      }
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_guild_joint_rev_task_rsp', { task_data: taskView(person), res: resOf(changes) }), value: { tasks: tasks.length, boxes: picks } };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown guild joint command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const handler = handlers[command];
    const result = handler(input);
    log({ event: 'guild_joint_command', type: command, ...result.value });
    return result;
  }

  const handlers = {
    91601: pickBox,
    91602: pickMonster,
    91603: pickDoor,
    91604: pickLode,
    91605: task,
    91606: revLode,
    91607: roleRank,
    91608: setPioneer,
    91609: cancelDoor,
    91610: setFocus,
    91611: fightReport,
    91612: getInfo,
    91613: singleMonster,
    91614: singleBox,
    91615: singleDoor,
    91616: calcDoor,
    91617: settleRank,
    91618: enterSingle,
    91619: singleSettle,
    91620: singleCancel,
    91621: share,
    91622: cancelMonster,
    91623: calcMonster,
    91624: setAuto,
    91625: oneGet
  };
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_JOINT_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
