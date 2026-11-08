import { GameError } from './hero-progression.mjs';
import { setBit } from './bit-block.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, weekKey, dayKey,
  toSeconds, resOf, grantAwards, spendResources, asInteger, optionalInteger, etfArgs,
  decodeCoopRequest, lineupPower, damageFromPower
} from './guild-coop-shared.mjs';

// GuildBossCmd 91301-91312 (agent/workflow/gameplay-completion/E2-SOCIAL-COOP).
//
// Authority: one guild-wide boss document (stage, HP, weekly members and their
// accumulated damage) plus one per-role document (join time, skill cooldowns,
// claim markers, boxes, purchases). Damage comes from the actor's real lineup
// power; every claim is recorded in guild_coop_claims so a reconnect or a
// database restart cannot pay twice.
export const GUILD_BOSS_COMMANDS = Object.freeze({
  enterMap: 91301,
  leaveMap: 91302,
  useSkill: 91303,
  claimDamageAward: 91304,
  batchClaimAward: 91305,
  claimSkillAward: 91306,
  claimDailySkillItem: 91307,
  claimBox: 91308,
  join: 91309,
  claimOnlineAward: 91310,
  buyItem: 91311,
  guildInfo: 91312
});

const SCOPE = 'guild_boss';

const REQUEST_SCHEMAS = {
  91303: 'pb_guild_boss_use_skill_req',
  91304: 'pb_req_claim_boss_dmg_award',
  91305: 'pb_req_batch_claim_boss_award'
};

export function createGuildBossService({ store, codec, tables, heroTables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.boss;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_BOSS_COMMANDS));

  function freshGuildDoc(week, at) {
    const stageIndex = 0;
    const stage = config.stages[stageIndex];
    return {
      week,
      stageIndex,
      bossTid: stage.tid,
      maxHp: stage.maxHp,
      curHp: stage.maxHp,
      lastRefresh: at,
      lastAtkTime: 0,
      lastSettle: at,
      members: {},
      mapRoles: [],
      buffs: [],
      kills: 0
    };
  }

  function freshPersonDoc(at) {
    return { joinTime: 0, skills: {}, awards: {}, boxes: [], dailyItemDay: '', itemBuys: {}, lastRefresh: at };
  }

  function bossDoc(db, guildId, at) {
    const week = weekKey(at);
    const existing = readDoc(db, SCOPE, guildId, '0', 'state');
    if (existing && existing.week === week) return existing;
    const doc = freshGuildDoc(week, at);
    if (existing) {
      // Weekly rotation advances the local boss ladder instead of replaying the
      // same stage forever; the previous week's damage is archived in the log.
      const nextIndex = (Number(existing.stageIndex ?? 0) + 1) % config.stages.length;
      const stage = config.stages[nextIndex];
      doc.stageIndex = nextIndex;
      doc.bossTid = stage.tid;
      doc.maxHp = stage.maxHp;
      doc.curHp = stage.maxHp;
      appendEvent(db, { scope: SCOPE, guildId, kind: 'boss_week_reset', details: { week, previousStage: existing.bossTid, stage: stage.tid }, at });
    }
    return writeDoc(db, SCOPE, guildId, '0', 'state', doc, at);
  }

  function personDoc(db, guildId, roleId, at) {
    const existing = readDoc(db, SCOPE, guildId, roleId, 'state');
    if (existing) return existing;
    return writeDoc(db, SCOPE, guildId, roleId, 'state', freshPersonDoc(at), at);
  }

  function memberRow(doc, roleId) {
    const member = doc.members[roleId] ?? {};
    return {
      id: roleId,
      acc_damage: String(member.accDamage ?? 0),
      last_damage: String(member.lastDamage ?? 0),
      last_atk_time: Number(member.lastAtkTime ?? 0),
      cur_atk_count: Number(member.atkCount ?? 0),
      ice_time: Number(member.iceTime ?? 0),
      activity: Number(member.activity ?? 0),
      last_base_damage: Number(member.lastBaseDamage ?? 0)
    };
  }

  function guildView(doc, context, power) {
    const memberIds = new Set([...Object.keys(doc.members), ...(context.members ?? []).map(entry => String(entry.role_id))]);
    return {
      guild_id: context.guildId,
      cur_boss: { tid: doc.bossTid, cur_hp: doc.curHp, max_hp: doc.maxHp, auto_atk_damage: power },
      member_list: [...memberIds].map(roleId => memberRow(doc, roleId)),
      last_atk_time: doc.lastAtkTime,
      last_refresh_time: doc.lastRefresh,
      last_hp_list: [],
      map_role_list: doc.mapRoles.map(roleId => roleId),
      last_settle_time: doc.lastSettle,
      last_member_list: [],
      buff_skill_info_list: doc.buffs.map(buff => ({ skill_tid: buff.tid, start_time: buff.start, end_time: buff.end }))
    };
  }

  function skillStateBits(skillAwards, awardRows, useSkillAwards) {
    let bits = Buffer.alloc(0);
    for (const row of awardRows) if (skillAwards.includes(row.idx)) bits = setBit(bits, row.idx);
    for (const row of useSkillAwards) bits = setBit(bits, row.idx);
    return bits;
  }

  function personView(person, doc, context) {
    const skillIds = Object.keys(person.skills).map(Number).sort((a, b) => a - b);
    const skillList = (skillIds.length ? skillIds : [Number(config.dailyFreeSkillItem.tid)]).map(tid => {
      const entry = person.skills[tid] ?? {};
      return { tid, last_enter_cd_time: Number(entry.lastEnterCdTime ?? 0), cur_cd_count: Number(entry.count ?? 0), last_use_time: Number(entry.lastUse ?? 0) };
    });
    const itemBuys = Object.entries(person.itemBuys ?? {}).map(([itemTid, buyCount]) => ({ item_tid: Number(itemTid), buy_count: Number(buyCount) }));
    return {
      role_id: context.roleId,
      last_refresh_time: Number(person.lastRefresh ?? 0),
      up_hurt_end: 0,
      pb_guild_boss_dmg_award_list: [{ boss_tid: doc.bossTid, dmg_award_state_list: (person.awards?.damageIdx ?? []).map(idx => ({ idx, rev_state: Buffer.alloc(0) })) }],
      use_skill_award_list: (person.awards?.skillIdx ?? []).map(Number),
      use_skill_award_state: skillStateBits(person.awards?.skillIdx ?? [], config.skillUseAwards, []),
      skill_list: skillList,
      last_rev_daily_skill_item_time: Number(person.lastDailyItem ?? 0),
      award_box_list: (person.boxes ?? []).map((idx, position) => ({ box_type: idx, extra: Buffer.alloc(0), award_tid_list: (config.boxes.find(row => row.idx === idx)?.items ?? []).map(([tid]) => Number(tid)) })),
      award_box_state: Buffer.alloc(0),
      join_time: Number(person.joinTime ?? 0),
      online_awards: (person.awards?.onlineIdx ?? []).map(Number),
      online_awards_state: (person.awards?.onlineIdx ?? []).reduce((bits, idx) => setBit(bits, idx), Buffer.alloc(0)),
      skill_item_buy_info_list: itemBuys,
      last_clean_skill_item: Number(person.lastClean ?? 0)
    };
  }

  function joinTime(person) {
    return Number(person.joinTime ?? 0);
  }

  function addDamage(doc, roleId, damage, at) {
    const member = doc.members[roleId] ?? { accDamage: '0', lastDamage: '0', lastAtkTime: 0, atkCount: 0, activity: 0 };
    const applied = BigInt(damage) < BigInt(doc.curHp) ? BigInt(damage) : BigInt(doc.curHp);
    member.accDamage = (BigInt(member.accDamage ?? 0) + applied).toString();
    member.lastDamage = applied.toString();
    member.lastAtkTime = at;
    member.atkCount = Number(member.atkCount ?? 0) + 1;
    member.activity = Number(member.activity ?? 0) + 1;
    doc.members[roleId] = member;
    doc.curHp = (BigInt(doc.curHp) - applied).toString();
    doc.lastAtkTime = at;
    return applied;
  }

  function progressStage(db, doc, person, guildId, roleId, at) {
    doc.kills = Number(doc.kills ?? 0) + 1;
    doc.stageIndex = (Number(doc.stageIndex ?? 0) + 1) % config.stages.length;
    const stage = config.stages[doc.stageIndex];
    doc.bossTid = stage.tid;
    doc.maxHp = stage.maxHp;
    doc.curHp = stage.maxHp;
    doc.lastRefresh = at;
    const box = config.boxes[doc.kills % config.boxes.length];
    person.boxes = [...(person.boxes ?? []), box.idx];
    appendEvent(db, { scope: SCOPE, guildId, roleId, kind: 'boss_kill', amount: 1, details: { stage: stage.tid, box: box.idx }, at });
  }

  function availableDamageAwards(person, member, doc) {
    const claimed = new Set(person.awards?.damageIdx ?? []);
    const own = BigInt(member?.accDamage ?? 0);
    return config.damageAwards.filter(row => !claimed.has(row.idx) && own >= BigInt(row.damage)).map(row => row.idx);
  }

  function claimDamageAwards(db, model, context, doc, person, idxList, at) {
    const member = doc.members[context.roleId];
    const claimed = [];
    const items = [];
    const week = doc.week;
    for (const rawIdx of idxList) {
      const idx = asInteger(rawIdx, 'damage award index', { min: 1 });
      const row = config.damageAwards.find(entry => entry.idx === idx);
      if (!row) throw new GameError(1, 'Damage award does not exist');
      if (BigInt(member?.accDamage ?? 0) < BigInt(row.damage)) throw new GameError(5, 'Damage threshold is not reached');
      if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'dmg:' + idx, period: week, at })) {
        throw new GameError(310, 'Damage award already claimed');
      }
      person.awards = person.awards ?? {};
      person.awards.damageIdx = [...(person.awards.damageIdx ?? []), idx];
      items.push(...row.items);
      claimed.push(idx);
    }
    return { claimed, changes: grantAwards(model, tables, items) };
  }

  function claimSkillAwards(db, model, context, person, idxList, at) {
    const uses = Object.values(person.skills ?? {})
      .reduce((sum, entry) => sum + Number(entry.count ?? 0), 0);
    const claimed = [];
    const items = [];
    for (const rawIdx of idxList) {
      const idx = asInteger(rawIdx, 'skill award index', { min: 1 });
      const row = config.skillUseAwards.find(entry => entry.idx === idx);
      if (!row) throw new GameError(1, 'Skill award does not exist');
      if (uses < row.uses) throw new GameError(5, 'Skill use count is not reached');
      if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'skill:' + idx, period: 'season', at })) {
        throw new GameError(310, 'Skill award already claimed');
      }
      person.awards = person.awards ?? {};
      person.awards.skillIdx = [...(person.awards.skillIdx ?? []), idx];
      items.push(...row.items);
      claimed.push(idx);
    }
    return { claimed, changes: grantAwards(model, tables, items) };
  }

  function enterMap(input) {
    if (etfArgs(input).length > 1) throw new GameError(1, 'Enter map takes at most one parameter');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (!doc.mapRoles.includes(context.roleId)) doc.mapRoles = [...doc.mapRoles, context.roleId];
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      const power = lineupPower(model, heroTables);
      const view = guildView(doc, context, power);
      return { data: codec.pack('pb_guild_boss_guild', view), value: { stage: doc.bossTid, mapRoles: doc.mapRoles.length, joined: joinTime(person) > 0 } };
    });
  }

  function leaveMap() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      doc.mapRoles = doc.mapRoles.filter(roleId => roleId !== context.roleId);
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: Buffer.alloc(0), value: { mapRoles: doc.mapRoles.length } };
    });
  }

  function join() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      let cost = [];
      if (!joinTime(person)) {
        person.joinTime = at;
        person.lastRefresh = at;
        appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'boss_join', amount: 1, details: { stage: doc.bossTid }, at });
      }
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      const data = codec.pack('pb_res_join_guild_boss', { person: personView(person, doc, context), res: resOf(cost) });
      return { data, value: { joinTime: person.joinTime } };
    });
  }

  function useSkill(input) {
    const skillId = asInteger(input?.skill_id, 'skill id', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      if (!joinTime(person)) throw new GameError(5, 'Join the guild boss first');
      if (BigInt(doc.curHp) <= 0n) throw new GameError(5, 'Guild boss is not alive');
      const entry = person.skills[String(skillId)] ?? { count: 0, lastUse: 0 };
      const lastUse = Number(entry.lastUse ?? 0);
      if (lastUse && at - lastUse < config.skillCooldown) throw new GameError(5, 'Skill is cooling down');
      const power = lineupPower(model, heroTables);
      const damage = damageFromPower(power, config.skillPercent);
      const applied = addDamage(doc, context.roleId, damage, at);
      person.skills[String(skillId)] = { count: Number(entry.count ?? 0) + 1, lastUse: at, lastEnterCdTime: lastUse, tid: skillId };
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'boss_damage', amount: Number(applied), details: { skillId, stage: doc.bossTid }, at });
      let boxes = 0;
      if (BigInt(doc.curHp) <= 0n) {
        const before = (person.boxes ?? []).length;
        progressStage(db, doc, person, context.guildId, context.roleId, at);
        boxes = (person.boxes ?? []).length - before;
      }
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      const member = doc.members[context.roleId];
      const ready = availableDamageAwards(person, member, doc);
      const data = codec.pack('pb_guild_boss_use_skill_back', {
        damage: applied.toString(),
        award_list: ready,
        res: resOf([]),
        use_skill_msg_push: { skill_id: skillId, use_guild_name: '', use_role_name: '', target_guild_name: '', target_role_name: '', use_guild_id: context.guildId, use_role_id: context.roleId },
        use_skill_push: { skill_id: skillId, src_role_id: context.roleId }
      });
      return { data, value: { damage: applied.toString(), stage: doc.bossTid, boxes, awards: ready.length } };
    });
  }

  function claimDamage(input) {
    const bossTid = optionalInteger(input?.boss_tid, 'boss tid', { min: 0 });
    const idxList = Array.isArray(input?.award_idx_list) ? input.award_idx_list : [];
    if (!idxList.length) throw new GameError(1, 'Damage award list is empty');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      if (bossTid !== null && Number(bossTid) !== Number(doc.bossTid)) throw new GameError(1, 'Boss stage does not match');
      const person = personDoc(db, context.guildId, context.roleId, at);
      const result = claimDamageAwards(db, model, context, doc, person, idxList, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(result.changes)), value: { claimed: result.claimed } };
    });
  }

  function batchClaim(input) {
    const damageReqs = Array.isArray(input?.dmg_award_req_list) ? input.dmg_award_req_list : [];
    const skillIdx = Array.isArray(input?.use_skill_award_idx_list) ? input.use_skill_award_idx_list : [];
    if (!damageReqs.length && !skillIdx.length) throw new GameError(1, 'Batch claim list is empty');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const changes = [];
      const claimed = [];
      for (const req of damageReqs) {
        const bossTid = optionalInteger(req?.boss_tid, 'boss tid', { min: 0 });
        if (bossTid !== null && Number(bossTid) !== Number(doc.bossTid)) throw new GameError(1, 'Boss stage does not match');
        const list = Array.isArray(req?.award_idx_list) ? req.award_idx_list : [];
        if (!list.length) continue;
        const result = claimDamageAwards(db, model, context, doc, person, list, at);
        changes.push(...result.changes);
        claimed.push(...result.claimed);
      }
      if (skillIdx.length) {
        const result = claimSkillAwards(db, model, context, person, skillIdx, at);
        changes.push(...result.changes);
        claimed.push(...result.claimed.map(idx => 'skill:' + idx));
      }
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { claimed } };
    });
  }

  function claimSkill(input) {
    const idx = asInteger(etfArgs(input)[0], 'skill award index', { min: 1 });
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const result = claimSkillAwards(db, model, context, person, [idx], at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(result.changes)), value: { claimed: result.claimed } };
    });
  }

  function claimDailySkillItem() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const day = dayKey(at);
      if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'daily_skill_item', period: day, at })) {
        throw new GameError(310, 'Daily skill item already claimed');
      }
      const changes = grantAwards(model, tables, [[config.dailyFreeSkillItem.tid, config.dailyFreeSkillItem.count]]);
      person.dailyItemDay = day;
      person.lastDailyItem = at;
      const skillKey = String(config.dailyFreeSkillItem.tid);
      person.skills[skillKey] = { ...(person.skills[skillKey] ?? { count: 0, lastUse: 0 }), count: Number(person.skills[skillKey]?.count ?? 0) };
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { day } };
    });
  }

  function claimBox(input) {
    const args = etfArgs(input);
    const idx = args.length ? asInteger(args[0], 'box index', { min: 1 }) : null;
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const boxes = person.boxes ?? [];
      if (!boxes.length) throw new GameError(5, 'No guild boss box is available');
      const target = idx ?? boxes[0];
      const position = boxes.indexOf(target);
      if (position < 0) throw new GameError(5, 'Guild boss box does not exist');
      const row = config.boxes.find(entry => entry.idx === target);
      if (!row) throw new GameError(1, 'Guild boss box is not configured');
      boxes.splice(position, 1);
      person.boxes = boxes;
      const changes = grantAwards(model, tables, row.items);
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'boss_box', amount: 1, details: { box: target }, at });
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { box: target, remaining: boxes.length, stage: doc.bossTid } };
    });
  }

  function claimOnlineAward(input) {
    const args = etfArgs(input);
    const idx = args.length ? asInteger(args[0], 'online award index', { min: 1 }) : null;
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const joined = joinTime(person);
      if (!joined) throw new GameError(5, 'Join the guild boss first');
      const elapsed = at - joined;
      const rows = idx === null ? config.onlineAwards : config.onlineAwards.filter(row => row.idx === idx);
      const target = rows.find(row => elapsed >= row.seconds);
      if (!target) throw new GameError(5, 'Online award is not reachable yet');
      if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'online:' + target.idx, period: 'season', at })) {
        throw new GameError(310, 'Online award already claimed');
      }
      person.awards = person.awards ?? {};
      person.awards.onlineIdx = [...(person.awards.onlineIdx ?? []), target.idx];
      const changes = grantAwards(model, tables, target.items);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { award: target.idx, elapsed } };
    });
  }

  function buyItem(input) {
    const args = etfArgs(input);
    const itemTid = args.length ? asInteger(args[0], 'item tid', { min: 1 }) : config.dailyFreeSkillItem.tid;
    const count = args.length > 1 ? asInteger(args[1], 'item count', { min: 1, max: 99 }) : 1;
    const row = config.skillItems[itemTid];
    if (!row) throw new GameError(5, 'Guild boss item is not sold');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      bossDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      const changes = [];
      changes.push(...spendResources(model, [[101500, row.price * count]]));
      changes.push(...grantAwards(model, tables, [[itemTid, row.count * count]]));
      person.itemBuys = { ...(person.itemBuys ?? {}) };
      person.itemBuys[itemTid] = Number(person.itemBuys[itemTid] ?? 0) + count;
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { itemTid, count } };
    });
  }

  function guildInfo() {
    // 91312 declares no response schema in the static catalog, so the frame is
    // an empty acknowledgement; the client reads the map state through 91301.
    const state = store.state();
    const context = guildContext({ state }, codec);
    return { data: Buffer.alloc(0), value: { guildId: context.guildId } };
  }

  const handlers = {
    91301: enterMap,
    91302: leaveMap,
    91303: useSkill,
    91304: claimDamage,
    91305: batchClaim,
    91306: claimSkill,
    91307: claimDailySkillItem,
    91308: claimBox,
    91309: join,
    91310: claimOnlineAward,
    91311: buyItem,
    91312: guildInfo
  };

  async function execute(type, bytes) {
    const command = Number(type);
    const handler = handlers[command];
    if (!handler) throw new GameError(1, 'Unknown guild boss command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handler(input);
    log({ event: 'guild_boss_command', type: command, ...result.value });
    return result;
  }

  return {
    supports: type => supported.has(Number(type)),
    execute,
    requestSchemas: REQUEST_SCHEMAS,
    commands: GUILD_BOSS_COMMANDS,
    guildViewForTest() {
      return store.inspect(db => {
        ensureCoopTables(db);
        return readDoc(db, SCOPE, '900001', '0', 'state');
      });
    }
  };
}
