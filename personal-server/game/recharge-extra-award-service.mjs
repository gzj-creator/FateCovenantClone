import { rawBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeDayIndex } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';

const RECHARGE_HANDLE = 1;
const MAX_AWARD_NUM = 99;
const DIAMOND_RECHARGE_TYPE = 1;
const DRAGON_CRYSTAL_RECHARGE_TYPE = 81;

function normalizeInfo(value) {
  const info = value ?? {};
  info.flush_day = Number(info.flush_day ?? 0);
  info.buy_num_list = Array.isArray(info.buy_num_list) ? info.buy_num_list : [];
  return info;
}

function readExtraInfo(login, codec) {
  const bytes = login.recharge_extra_award_info ? Buffer.from(login.recharge_extra_award_info, 'base64') : Buffer.alloc(0);
  return bytes.length ? normalizeInfo(codec.unpack('pb_recharge_extra_award_info', bytes)) : normalizeInfo({ flush_day: 0, buy_num_list: [] });
}

function extraConfig(tables, product, count) {
  const index = Math.min(count + 1, MAX_AWARD_NUM);
  return tables.ExtraReward?.get(Number(product.tid) * 100 + index)
    ?? tables.ExtraFixReward?.get(Number(product.tid))
    ?? null;
}

export function createRechargeExtraAwardService({ codec, tables, logger = () => {} }) {
  if (!tables.ExtraRewardConst || !tables.ExtraReward || !tables.ExtraFixReward) throw new Error('Recharge extra-award configuration is missing');
  const flushDays = Number(tables.ExtraRewardConst.get(1)?.flush_day ?? 0);
  if (!Number.isSafeInteger(flushDays) || flushDays <= 0) throw new Error('Recharge extra-award reset interval is invalid');
  const log = event => { try { logger(event); } catch {} };

  function supportsProduct(product) {
    return [DIAMOND_RECHARGE_TYPE, DRAGON_CRYSTAL_RECHARGE_TYPE].includes(Number(product?.type));
  }

  function recordRecharge({ model, login, product, at }) {
    if (!supportsProduct(product)) return { changed: false, changes: [], extraRetList: [] };
    const info = readExtraInfo(login, codec);
    const currentDay = rechargeDayIndex(at);
    const storedDay = Number(info.flush_day ?? 0);
    let changed = false;
    if (!storedDay || currentDay < storedDay || currentDay - storedDay >= flushDays) {
      info.flush_day = currentDay;
      info.buy_num_list = [];
      changed = true;
    }
    let row = info.buy_num_list.find(entry => Number(entry.key) === Number(product.tid));
    if (!row) {
      row = { key: product.tid, value: 0 };
      info.buy_num_list.push(row);
      changed = true;
    }
    const previousCount = Number(row.value ?? 0);
    if (!Number.isSafeInteger(previousCount) || previousCount < 0) throw new GameError(5, 'Recharge extra-award count is invalid');
    const award = extraConfig(tables, product, previousCount);
    let res = { changes: [], is_overflow: false };
    if (award) {
      if (!Array.isArray(award.reward)) throw new GameError(5, 'Recharge extra award is invalid');
      res = grantResources(model, award.reward.map(([tid, count]) => [Number(tid), Number(count)]), tables, { codec });
    }
    row.value = previousCount + 1;
    changed = true;
    const data = codec.pack('pb_recharge_extra_award_info', info);
    login.recharge_extra_award_info = data;
    log({
      event: 'recharge_extra_award_recorded', productId: Number(product.tid), previousCount,
      nextCount: row.value, rewardApplied: Boolean(award), changes: res.changes.length
    });
    return {
      changed,
      info,
      res,
      changes: res.changes,
      extraRetList: [{ flag: RECHARGE_HANDLE, data }]
    };
  }

  function read(login) { return readExtraInfo(login, codec); }

  return { recordRecharge, read, supportsProduct, flushDays, handle: RECHARGE_HANDLE };
}
