import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readTowerDefenseTables, rewardPairs } from '../config/dungeon-activity-tables.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import {
  CODE_INVALID, CODE_LIMIT, CODE_STATE, ensureTables, fail, integer, isoSeconds, optionalInteger,
  readActivityState, recordClaim, resPacket, snapshot, unixSeconds, writeActivityState, claimed
} from './dungeon-activity-shared.mjs';

// TowerDefenseCmd 97601-97605. Only 97601 carries protobuf on the request
// envelope; the remaining four are ETF messages.
export const TOWER_DEFENSE_COMMANDS = [97601, 97602, 97603, 97604, 97605];
const ACTIVITY = 'tower_defense';
const CLAIM_AWARD = 'tower_defense_award';
const CLAIM_TASK = 'tower_defense_task';

function towerDefaults(tid, nowMs) {
  return {
    tid,
    ackTurns: 0,
    ackTime: unixSeconds(nowMs),
    waitAwards: [],
    defense: [],
    accTurnsNum: 0,
    lastAwardTime: 0,
    turnsAwardBits: ''
  };
}

function stateDefaults(nowMs) {
  return { towers: {} };
}

export function createTowerDefenseService({
  store, codec, tables = readTowerDefenseTables(), gameTables = null, now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  if (!tables?.types?.size) throw new Error('Tower defense configuration is unavailable');
  const turnRows = [...tables.turns.entries()].sort((a, b) => a[0] - b[0]);

  function stateOf(db, roleId, nowMs) {
    const raw = readActivityState(db, roleId, ACTIVITY, stateDefaults(nowMs));
    if (!raw.towers || typeof raw.towers !== 'object') raw.towers = {};
    return raw;
  }

  function towerOf(state, tid, nowMs) {
    const key = String(tid);
    if (!state.towers[key]) state.towers[key] = towerDefaults(tid, nowMs);
    const tower = state.towers[key];
    if (!Array.isArray(tower.waitAwards)) tower.waitAwards = [];
    if (!Array.isArray(tower.defense)) tower.defense = [];
    return tower;
  }

  function bitsOf(tower) {
    return tower.turnsAwardBits ? Buffer.from(tower.turnsAwardBits, 'hex') : Buffer.alloc(0);
  }

  function packetOf(tower) {
    return {
      tower_defense_tid: tower.tid,
      version: 0,
      version_defense_time: tower.ackTime,
      ack_turns: tower.ackTurns,
      ack_time: tower.ackTime,
      turns_hp: 0,
      wait_turns: tower.waitAwards.length,
      receive_award_turns: tower.lastAwardTime,
      wait_award_turns: tower.waitAwards.map(entry => ({
        turns: entry.turns,
        defense_time: entry.defenseTime,
        awards: entry.awards.map(([tid, count]) => ({ tid: String(tid), num: String(count) }))
      })),
      last_award_time: tower.lastAwardTime,
      defense_obj: tower.defense.map(entry => ({
        tid: entry.index, ack_tid: entry.garrisonTid, defense_time: entry.defenseTime, ack: 0
      })),
      acc_turns_num: tower.accTurnsNum,
      turns_award_bin: bitsOf(tower),
      is_pass_version: false,
      harm_sc: 0,
      fun_open_time: 0
    };
  }

  function supports(type) { return TOWER_DEFENSE_COMMANDS.includes(type); }

  function towerTidOf(input) {
    const raw = typeof input === 'object' && input !== null ? input.tid : input;
    return integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid tower defense id');
  }

  async function garrison(input) {
    const tid = towerTidOf(input);
    if (!tables.types.has(tid)) fail(CODE_STATE, 'Tower defense configuration is missing');
    const list = Array.isArray(input?.garrison_list) ? input.garrison_list : [];
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const tower = towerOf(state, tid, nowMs);
      const seen = new Set();
      const defense = [];
      for (const entry of list) {
        const garrisonTid = integer(entry?.garrison_tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid tower defense garrison id');
        // proto3 drops a zero-valued int32 on the wire, so the first slot
        // arrives without an explicit index field.
        const index = entry?.index === undefined ? 0 : integer(entry.index, 0, 99, 'Invalid tower defense garrison index');
        if (seen.has(index)) fail(CODE_INVALID, 'Duplicate tower defense garrison index');
        seen.add(index);
        defense.push({ garrisonTid, index, defenseTime: unixSeconds(nowMs) });
      }
      if (!defense.length) fail(CODE_INVALID, 'Tower defense garrison list is empty');
      tower.defense = defense;
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'tower_defense_garrison_committed', tid, count: defense.length });
      return { value: { tid, count: defense.length }, data: codec.pack('pb_tower_defense', packetOf(tower)) };
    });
  }

  // One wave per call. Rewards of a wave are the kill rewards of the shipped
  // Monster rows; they stay pending until 97603 claims them.
  async function turnOver(input) {
    const tid = optionalInteger(input, 1, Number.MAX_SAFE_INTEGER, 'Invalid tower defense id') ?? Math.min(...tables.types.keys());
    if (!tables.types.has(tid)) fail(CODE_STATE, 'Tower defense configuration is missing');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const tower = towerOf(state, tid, nowMs);
      if (!tower.defense.length) fail(CODE_STATE, 'Tower defense garrison is not configured');
      const next = turnRows.find(([rowTid]) => rowTid > tower.ackTurns) ??
        turnRows[tower.ackTurns % turnRows.length];
      const [turnTid, row] = next;
      const types = Array.isArray(row.monster_type) ? row.monster_type.map(Number) : [];
      const counts = Array.isArray(row.monster_num) ? row.monster_num.map(Number) : [];
      if (types.length !== counts.length || !types.length) fail(CODE_STATE, 'Tower defense wave configuration is invalid');
      const awards = [];
      for (let index = 0; index < types.length; index += 1) {
        const monster = tables.monsters.get(types[index]);
        const itemTid = Number(monster?.award_item ?? 0), itemNum = Number(monster?.award_num ?? 0);
        const amount = itemNum * counts[index];
        if (!Number.isSafeInteger(itemTid) || itemTid <= 0 || !Number.isSafeInteger(amount) || amount <= 0) {
          fail(CODE_STATE, 'Tower defense monster reward configuration is missing');
        }
        awards.push([itemTid, amount]);
      }
      tower.ackTurns = turnTid;
      tower.ackTime = unixSeconds(nowMs);
      tower.waitAwards = [...tower.waitAwards.filter(entry => entry.turns !== turnTid),
        { turns: turnTid, defenseTime: unixSeconds(nowMs), awards }];
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'tower_defense_turn_over_committed', tid, turns: turnTid });
      return { value: { tid, turns: turnTid, pending: tower.waitAwards.length }, data: codec.pack('pb_tower_defense', packetOf(tower)) };
    });
  }

  // 97603 settles every pending idle award; each wave can only be claimed once.
  async function award(input) {
    const tid = optionalInteger(input, 1, Number.MAX_SAFE_INTEGER, 'Invalid tower defense id') ?? Math.min(...tables.types.keys());
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const tower = towerOf(state, tid, nowMs);
      const pending = tower.waitAwards.filter(entry => !claimed(db, model.state.roleId, ACTIVITY, CLAIM_AWARD, String(entry.turns)));
      if (!pending.length) fail(CODE_LIMIT, 'Tower defense award is already received');
      const awards = pending.flatMap(entry => entry.awards);
      const reward = grantResources(model, awards, resourceTables());
      for (const entry of pending) recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_AWARD, String(entry.turns), isoSeconds(nowMs));
      tower.waitAwards = tower.waitAwards.filter(entry => !pending.includes(entry));
      tower.accTurnsNum += pending.length;
      tower.lastAwardTime = unixSeconds(nowMs);
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'tower_defense_award_committed', tid, turns: pending.map(entry => entry.turns), changes: reward.changes.length });
      return {
        value: { tid, turns: pending.map(entry => entry.turns), changes: reward.changes },
        data: codec.pack('pb_tower_defense_award_rsp', { tower_defense: packetOf(tower), res_changes: resPacket(reward.changes) })
      };
    });
  }

  // 97604 claims the cumulative wave tasks from TowerDefenseTable.Task.
  async function turnsAward(input) {
    const tid = optionalInteger(input, 1, Number.MAX_SAFE_INTEGER, 'Invalid tower defense id') ?? Math.min(...tables.types.keys());
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const tower = towerOf(state, tid, nowMs);
      let bits = bitsOf(tower);
      const granted = [];
      for (const task of tables.tasks.values()) {
        const taskTid = Number(task.tid);
        if (Number(task.belong_type) !== tid) continue;
        if (tower.accTurnsNum < Number(task.target_count ?? 0)) continue;
        if (hasBit(bits, taskTid)) continue;
        if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_TASK, String(taskTid))) continue;
        const awards = rewardPairs(task.award_list, 'Tower defense task');
        if (!awards.length) fail(CODE_STATE, 'Tower defense task reward configuration is empty');
        granted.push({ taskTid, awards });
        bits = setBit(bits, taskTid);
      }
      if (!granted.length) fail(CODE_LIMIT, 'Tower defense wave awards are not claimable');
      const reward = grantResources(model, granted.flatMap(entry => entry.awards), resourceTables());
      for (const entry of granted) recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_TASK, String(entry.taskTid), isoSeconds(nowMs));
      tower.turnsAwardBits = bits.toString('hex');
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'tower_defense_turns_award_committed', tid, tasks: granted.map(entry => entry.taskTid) });
      return {
        value: { tid, tasks: granted.map(entry => entry.taskTid), changes: reward.changes },
        data: codec.pack('pb_tower_defense_award_rsp', { tower_defense: packetOf(tower), res_changes: resPacket(reward.changes) })
      };
    });
  }

  async function lookAward(input) {
    const tid = optionalInteger(input, 1, Number.MAX_SAFE_INTEGER, 'Invalid tower defense id') ?? Math.min(...tables.types.keys());
    const summary = store.transaction((model, db) => {
      ensureTables(db);
      const tower = towerOf(stateOf(db, model.state.roleId, now()), tid, now());
      return { tower: snapshot(tower) };
    });
    return {
      value: { tid, pending: summary.tower.waitAwards.length, accTurns: summary.tower.accTurnsNum },
      data: codec.pack('pb_tower_defense_look_rsp', {
        wait_award_turns: summary.tower.waitAwards.map(entry => ({
          turns: entry.turns,
          defense_time: entry.defenseTime,
          awards: entry.awards.map(([awardTid, count]) => ({ tid: String(awardTid), num: String(count) }))
        })),
        acc_turns_num: summary.tower.accTurnsNum
      })
    };
  }

  async function execute(type, input) {
    if (type === 97601) return garrison(input);
    if (type === 97602) return turnOver(input);
    if (type === 97603) return award(input);
    if (type === 97604) return turnsAward(input);
    if (type === 97605) return lookAward(input);
    fail(CODE_INVALID, 'Unsupported tower defense command');
  }

  function state(roleId) {
    return store.inspect(db => { ensureTables(db); return stateOf(db, roleId, now()); });
  }

  return { supports, execute, garrison, turnOver, award, turnsAward, lookAward, state };
}
