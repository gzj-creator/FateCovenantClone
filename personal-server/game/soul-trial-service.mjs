import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readSoulTrialTables } from '../config/dungeon-activity-tables.mjs';
import {
  CODE_INVALID, CODE_LIMIT, CODE_STATE, dayKey, ensureTables, fail, integer, isoSeconds,
  readActivityState, recordClaim, resPacket, snapshot, unixSeconds, writeActivityState, claimed
} from './dungeon-activity-shared.mjs';

// SoulTrialCmd 87104 draw_award and 87105 rev_draw_award. Both request
// envelopes are ETF (EncodeErl in SoulTrialCmd.lua).
export const SOUL_TRIAL_COMMANDS = [87104, 87105];
const ACTIVITY = 'soul_trial';
const CLAIM_DRAW = 'soul_trial_draw';
const CLAIM_REV = 'soul_trial_rev';

export function createSoulTrialService({
  store, codec, tables = readSoulTrialTables(), gameTables = null, now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  const config = tables.drawCards.get(1);
  if (!config) throw new Error('Soul trial draw card configuration is unavailable');
  const cardCount = Math.max(1, Number(config.card_count ?? 0));
  const freeDraws = Math.max(0, Number(config.poker_day_free_times ?? 0));
  const revCount = Math.max(1, Number(config.rev_count ?? 1));
  const itemTid = Number(config.award_item ?? 0), itemNum = Number(config.award_num ?? 0);
  if (!Number.isSafeInteger(itemTid) || itemTid <= 0 || !Number.isSafeInteger(itemNum) || itemNum <= 0) {
    throw new Error('Soul trial draw reward configuration is invalid');
  }

  function defaults(nowMs) {
    return { day: dayKey(nowMs), draws: [], drawCount: 0, revDay: 0, revLocList: [] };
  }

  function stateOf(db, roleId, nowMs) {
    const state = readActivityState(db, roleId, ACTIVITY, defaults(nowMs));
    const today = dayKey(nowMs);
    if (state.day !== today) Object.assign(state, defaults(nowMs));
    if (!Array.isArray(state.draws)) state.draws = [];
    if (!Array.isArray(state.revLocList)) state.revLocList = [];
    return state;
  }

  function refreshTime(nowMs) {
    const date = new Date(nowMs);
    return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1) / 1000);
  }

  function supports(type) { return SOUL_TRIAL_COMMANDS.includes(type); }

  // 87104 reveals one card. Paid draws depend on consume_item/consume_num
  // semantics that are not recovered, so only the configured free draws are
  // served and anything beyond them is rejected instead of guessed.
  async function drawAward(input) {
    const loc = integer(typeof input === 'object' && input !== null ? (input.loc ?? input.pos ?? input.tid) : input, 1, cardCount, 'Invalid soul trial card location');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      if (state.draws.some(entry => entry.loc === loc)) fail(CODE_LIMIT, 'Soul trial card was already revealed');
      if (state.drawCount >= freeDraws) fail(CODE_LIMIT, 'Soul trial paid draw cost semantics are not recovered');
      const claimKey = dayKey(nowMs) + ':' + loc;
      if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_DRAW, claimKey)) fail(CODE_LIMIT, 'Soul trial card was already revealed');
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_DRAW, claimKey, isoSeconds(nowMs));
      state.draws = [...state.draws, { loc, itemTid, itemNum, claimed: false }];
      state.drawCount += 1;
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'soul_trial_draw_committed', loc, drawCount: state.drawCount });
      return {
        value: { loc, itemTid, itemNum, drawCount: state.drawCount },
        data: codec.pack('pb_soul_trial_draw_back', {
          look: { loc, item_tid: itemTid, item_num: itemNum },
          ensure_times: Math.max(0, cardCount - state.drawCount),
          refresh_time: refreshTime(nowMs),
          res_changes: resPacket([])
        })
      };
    });
  }

  // 87105 grants every revealed-but-unclaimed card once per daily batch.
  async function revDrawAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = stateOf(db, model.state.roleId, nowMs);
      const pending = state.draws.filter(entry => !entry.claimed);
      if (!pending.length) fail(CODE_LIMIT, 'Soul trial draw reward is not claimable');
      if (state.revDay >= revCount) fail(CODE_LIMIT, 'Soul trial draw reward was already received for this cycle');
      const claimKey = dayKey(nowMs) + ':' + (state.revDay + 1);
      if (claimed(db, model.state.roleId, ACTIVITY, CLAIM_REV, claimKey)) fail(CODE_LIMIT, 'Soul trial draw reward was already received');
      const reward = grantResources(model, pending.map(entry => [entry.itemTid, entry.itemNum]), resourceTables());
      recordClaim(db, model.state.roleId, ACTIVITY, CLAIM_REV, claimKey, isoSeconds(nowMs));
      state.revDay += 1;
      state.revLocList = [...new Set([...state.revLocList, ...pending.map(entry => entry.loc)])];
      state.draws = state.draws.map(entry => ({ ...entry, claimed: true }));
      writeActivityState(db, model.state.roleId, ACTIVITY, state, nowMs);
      log({ event: 'soul_trial_rev_committed', locs: pending.map(entry => entry.loc), changes: reward.changes.length });
      return {
        value: { revDay: state.revDay, locs: snapshot(state.revLocList), changes: reward.changes },
        data: codec.pack('pb_soul_trial_rev_draw_back', {
          refresh_time: refreshTime(nowMs),
          rev_day: state.revDay,
          rev_loc_list: state.revLocList,
          res_changes: resPacket(reward.changes)
        })
      };
    });
  }

  async function execute(type, input) {
    if (type === 87104) return drawAward(input);
    if (type === 87105) return revDrawAward();
    fail(CODE_INVALID, 'Unsupported soul trial command');
  }

  function state(roleId) {
    return store.inspect(db => { ensureTables(db); return stateOf(db, roleId, now()); });
  }

  return { supports, execute, drawAward, revDrawAward, state };
}
