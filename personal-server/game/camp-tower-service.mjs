import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readCampTowerTables, rewardPairs } from '../config/dungeon-activity-tables.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import {
  CODE_INVALID, CODE_LIMIT, CODE_STATE, ensureTables, fail, integer, isoSeconds, readActivityState,
  recordClaim, resPacket, unixSeconds, writeActivityState, claimed, battleWon
} from './dungeon-activity-shared.mjs';

// CampTowerCmd 93601 cross_award (PB), 93602 first_award (PB), 93603
// get_first_pass_list (ETF).
export const CAMP_TOWER_COMMANDS = [93601, 93602, 93603];
const ACTIVITY = 'camp_tower';
const CLAIM_FIRST = 'camp_tower_first_award';
const CLAIM_CROSS = 'camp_tower_cross_award';

function defaults(nowMs) { return { passes: {}, firstBits: '', crossBits: '', openTime: unixSeconds(nowMs) }; }

export function createCampTowerService({
  store, codec, tables = readCampTowerTables(), gameTables = null, now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  if (!tables?.firstPass?.size) throw new Error('Camp tower configuration is unavailable');

  function stateOf(db, roleId, nowMs) {
    const state = readActivityState(db, roleId, ACTIVITY, defaults(nowMs));
    if (!state.passes || typeof state.passes !== 'object') state.passes = {};
    return state;
  }

  function bitsOf(value) { return value ? Buffer.from(value, 'hex') : Buffer.alloc(0); }

  function infoOf(state) {
    return {
      first_award: bitsOf(state.firstBits),
      cross_server_award: bitsOf(state.crossBits),
      open_time: state.openTime
    };
  }

  function supports(type) { return CAMP_TOWER_COMMANDS.includes(type); }

  // Seam for the shared fight pipeline: only a real winning simulation can
  // record first-pass progress for a tower.
  async function recordPass({ firstTid, level, simulation }) {
    const tid = integer(firstTid, 1, Number.MAX_SAFE_INTEGER, 'Invalid camp tower first pass id');
    const row = tables.firstPass.get(tid);
    if (!row) fail(CODE_STATE, 'Camp tower first pass configuration is missing');
    const won = battleWon(simulation);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      if (!won) return { value: { firstTid: tid, won: false } };
      const current = state.passes[String(tid)] ?? { level: 0, passTime: 0, power: 0 };
      state.passes[String(tid)] = {
        level: Math.max(current.level, integer(level, 0, Number(row.level), 'Invalid camp tower level')),
        passTime: current.passTime || unixSeconds(nowMs),
        power: 0
      };
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'camp_tower_pass_recorded', firstTid: tid, level: state.passes[String(tid)].level });
      return { value: { firstTid: tid, won: true, level: state.passes[String(tid)].level } };
    });
  }

  function awardRow(tid) {
    const row = tables.firstPass.get(tid);
    if (!row) fail(CODE_STATE, 'Camp tower first pass configuration is missing');
    return row;
  }

  async function crossAward(input) {
    const tid = integer(input?.first_tid ?? input?.tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid camp tower cross award id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const row = awardRow(tid);
      const cleared = Number(state.passes[String(tid)]?.level ?? 0);
      if (cleared < Number(row.level)) fail(CODE_STATE, 'Camp tower cross award level is not reached');
      let bits = bitsOf(state.crossBits);
      if (hasBit(bits, tid) || claimed(db, model.state.roleId, ACTIVITY, CLAIM_CROSS, String(tid))) {
        fail(CODE_LIMIT, 'Camp tower cross award was already received');
      }
      const awards = rewardPairs(row.all_award, 'Camp tower cross');
      if (!awards.length) fail(CODE_STATE, 'Camp tower cross award configuration is empty');
      const reward = grantResources(model, awards, resourceTables());
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_CROSS, String(tid), isoSeconds(nowMs));
      bits = setBit(bits, tid);
      state.crossBits = bits.toString('hex');
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'camp_tower_cross_award_committed', firstTid: tid, changes: reward.changes.length });
      return {
        value: { firstTid: tid, changes: reward.changes },
        data: codec.pack('pb_camp_tower_cross_award_rsp', { res_change: resPacket(reward.changes), camp_tower_data: infoOf(state) })
      };
    });
  }

  async function firstAward(input) {
    const tid = integer(input?.first_tid ?? input?.tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid camp tower first award id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const row = awardRow(tid);
      const cleared = Number(state.passes[String(tid)]?.level ?? 0);
      if (cleared < Number(row.level)) fail(CODE_STATE, 'Camp tower first award level is not reached');
      let bits = bitsOf(state.firstBits);
      if (hasBit(bits, tid) || claimed(db, model.state.roleId, ACTIVITY, CLAIM_FIRST, String(tid))) {
        fail(CODE_LIMIT, 'Camp tower first award was already received');
      }
      const awards = rewardPairs(row.first_pass_award, 'Camp tower first');
      if (!awards.length) fail(CODE_STATE, 'Camp tower first award configuration is empty');
      const reward = grantResources(model, awards, resourceTables());
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_FIRST, String(tid), isoSeconds(nowMs));
      bits = setBit(bits, tid);
      state.firstBits = bits.toString('hex');
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'camp_tower_first_award_committed', firstTid: tid, changes: reward.changes.length });
      return {
        value: { firstTid: tid, changes: reward.changes },
        data: codec.pack('pb_camp_tower_first_award_rsp', { res_change: resPacket(reward.changes), camp_tower_data: infoOf(state) })
      };
    });
  }

  async function firstPassList() {
    const rows = store.inspect(db => {
      ensureTables(db);
      const entries = [];
      const all = db.prepare("SELECT role_id, state_json FROM dungeon_activity_state WHERE activity='camp_tower'").all();
      for (const row of all) {
        let parsed;
        try { parsed = JSON.parse(row.state_json); } catch { continue; }
        for (const [tid, pass] of Object.entries(parsed?.passes ?? {})) {
          entries.push({ id: Number(tid), total_level: Number(pass.level ?? 0), pass_time: pass.passTime ?? 0, pass_power: pass.power ?? 0, role_id: Number(row.role_id) });
        }
      }
      return entries.sort((a, b) => a.pass_time - b.pass_time);
    });
    log({ event: 'camp_tower_first_pass_list_read', count: rows.length });
    return { value: { count: rows.length }, data: codec.pack('pb_camp_tower_get_first_pass_list_rsp', { pb_camp_tower_pass_list: rows }) };
  }

  async function execute(type, input) {
    if (type === 93601) return crossAward(input);
    if (type === 93602) return firstAward(input);
    if (type === 93603) return firstPassList();
    fail(CODE_INVALID, 'Unsupported camp tower command');
  }

  function state(roleId) { return store.inspect(db => { ensureTables(db); return stateOf(db, roleId, now()); }); }

  return { supports, execute, crossAward, firstAward, firstPassList, recordPass, state };
}
