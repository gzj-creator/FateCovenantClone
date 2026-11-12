import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  WISH_TREASURE_GLOBAL,
  parseWishTreasureAwardId,
  wishTreasureReward,
  wishTreasureTypeForGift
} from '../config/wish-treasure-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';

export const WISH_TREASURE_MODULE = 172;
const CLAIM_TYPE = 'wish_treasure';
const dayIndex = milliseconds => gameDayIndex(Math.floor(milliseconds / 1000));

function emptyInfo() {
  return { data_list: [] };
}

export function createWishTreasureService({ store, codec, tables, calendar, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const openedDay = () => dayIndex(Number(calendar?.serverOpenedAt ?? now() / 1000) * 1000);
  const readInfo = modules => {
    const raw = modules.get(WISH_TREASURE_MODULE);
    return raw ? codec.unpack('pb_wish_treasure', rawBinary(raw)) : emptyInfo();
  };
  const writeInfo = (modules, info) => {
    const data = codec.pack('pb_wish_treasure', info);
    modules.set(WISH_TREASURE_MODULE, serializedBinary(data));
    return data;
  };
  const ensureType = (info, type, at) => {
    info.data_list ??= [];
    let row = info.data_list.find(entry => Number(entry.type) === type);
    if (!row) {
      row = { type, open_day: Math.max(0, Math.min(openedDay(), dayIndex(at))), buy_day_list: [], rev_list: [] };
      info.data_list.push(row);
    }
    row.type = Number(row.type);
    row.open_day = Number(row.open_day ?? 0);
    row.buy_day_list = [...new Set((row.buy_day_list ?? []).map(Number).filter(Number.isSafeInteger))].sort((a, b) => a - b);
    row.rev_list = [...new Set((row.rev_list ?? []).map(Number).filter(Number.isSafeInteger))].sort((a, b) => a - b);
    return row;
  };

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      if (modules.has(WISH_TREASURE_MODULE)) return false;
      const at = now();
      const info = emptyInfo();
      for (let type = 1; type <= WISH_TREASURE_GLOBAL.open_award_num; type++) ensureType(info, type, at);
      writeInfo(modules, info);
      model.state.modules.value = [...modules];
      return true;
    });
  }

  function recordPurchase({ modules, productId, at = now() }) {
    const type = wishTreasureTypeForGift(productId);
    if (!type) return { item_list: [], data: null };
    const info = readInfo(modules);
    const row = ensureType(info, type, at);
    const day = dayIndex(at);
    if (!row.buy_day_list.includes(day)) row.buy_day_list.push(day);
    row.buy_day_list.sort((a, b) => a - b);
    const data = writeInfo(modules, info);
    return { item_list: [{ type, add_day: day }], data };
  }

  function claim(value) {
    const award = parseWishTreasureAwardId(value);
    if (!award) throw new GameError(1, 'Invalid wish-treasure award');
    const at = now(), today = dayIndex(at), reward = wishTreasureReward(award.type, award.phase);
    if (!reward || !tables.Item.has(reward.tid)) throw new GameError(5, 'Wish-treasure reward is not configured');
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value), info = readInfo(modules);
      const row = ensureType(info, award.type, at);
      if (today < row.open_day) throw new GameError(311, 'Wish-treasure award has not opened');
      const currentPhase = Math.floor((today - row.open_day) / WISH_TREASURE_GLOBAL.one_award_day) + 1;
      if (award.phase > Math.min(currentPhase, WISH_TREASURE_GLOBAL.max_phase)) throw new GameError(311, 'Wish-treasure phase has not opened');
      const windowStart = row.open_day + (award.phase - 1) * WISH_TREASURE_GLOBAL.one_award_day;
      const windowEnd = Math.min(today, windowStart + WISH_TREASURE_GLOBAL.one_award_day - 1);
      if (!row.buy_day_list.some(day => day >= windowStart && day <= windowEnd)) {
        throw new GameError(311, 'No eligible purchase exists in this wish-treasure phase');
      }
      if (row.rev_list.includes(award.awardId)) throw new GameError(310, 'Wish-treasure award already claimed');
      if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, CLAIM_TYPE, String(award.awardId))) {
        throw new GameError(310, 'Wish-treasure award already claimed');
      }
      const granted = grantResources(model, [[reward.tid, reward.count]], tables, { codec });
      row.rev_list.push(award.awardId);
      row.rev_list.sort((a, b) => a - b);
      // grantResources owns its own module map for dedicated resource
      // families. Re-read that result before applying module 172.
      const updatedModules = new Map(model.state.modules.value);
      writeInfo(updatedModules, info);
      model.state.modules.value = [...updatedModules];
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, CLAIM_TYPE, String(award.awardId), new Date(at).toISOString());
      const res = { changes: granted.changes, is_overflow: false };
      const data = { data: row, res };
      log({ event: 'wish_treasure_claimed', type: award.type, phase: award.phase, awardId: award.awardId, itemTid: reward.tid });
      return { value: data, data: codec.pack('pb_wish_treasure_rev_back', data) };
    });
  }

  return {
    ensureLoginState,
    recordPurchase,
    claim,
    supports: type => Number(type) === 97101
  };
}
