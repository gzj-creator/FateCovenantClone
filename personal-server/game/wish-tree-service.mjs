import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  wishTreeDefaultAwardTids,
  wishTreeTables,
  wishTreeTypeForGift
} from '../config/wish-tree-tables.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

export const WISH_TREE_MODULE = 165;
const AWARD_BIT_DELTA = 1000;
const DAY_OFFSET_SECONDS = 10800;
const COMMANDS = new Set([91701, 91702, 91703, 91704]);

const dayIndex = milliseconds => Math.floor((Math.floor(Number(milliseconds) / 1000) + DAY_OFFSET_SECONDS) / 86400);
const integer = (value, fallback = 0) => Number.isSafeInteger(Number(value)) ? Number(value) : fallback;
const nonNegative = value => Math.max(0, integer(value));
const u64 = value => String(nonNegative(value));
const bitsOf = value => Buffer.from(typeof value === 'string' ? value : '', 'base64');

function countBits(bits) {
  let count = 0;
  for (const byte of bits) count += byte.toString(2).replaceAll('0', '').length;
  return count;
}

function emptyInfo(today) {
  return {
    data_list: [...wishTreeTables.WishTreeType.keys()].map(type => ({
      type: String(type),
      normal_bin: '',
      draw_sec: '0',
      normal_times: '0',
      normal_idx_list: wishTreeDefaultAwardTids(type),
      accrue_day: String(today),
      today_wish_count: '0',
      select_list: [],
      buy_day_list: [],
      can_wish_count: '0'
    }))
  };
}

function normalizeRow(row, type, today) {
  let changed = false;
  const set = (key, value, { implicitZero = false } = {}) => {
    const current = row[key];
    if (current === undefined && implicitZero && String(value) === '0') {
      row[key] = value;
      return;
    }
    if (current === undefined || String(current) !== String(value)) {
      row[key] = value;
      changed = true;
    } else {
      row[key] = value;
    }
  };
  set('type', String(type));
  const normalBin = typeof row.normal_bin === 'string' ? row.normal_bin : '';
  if (row.normal_bin === undefined && normalBin === '') row.normal_bin = normalBin;
  else set('normal_bin', normalBin);
  set('draw_sec', u64(row.draw_sec), { implicitZero: true });
  set('normal_times', u64(row.normal_times), { implicitZero: true });
  const defaultIds = wishTreeDefaultAwardTids(type);
  const idx = Array.isArray(row.normal_idx_list)
    ? row.normal_idx_list.map(value => integer(value)).filter(value => value > 0)
    : [];
  const normalIds = idx.length ? idx : defaultIds;
  if (JSON.stringify(row.normal_idx_list) !== JSON.stringify(normalIds)) {
    row.normal_idx_list = normalIds;
    changed = true;
  }
  set('accrue_day', u64(integer(row.accrue_day) || today));
  set('today_wish_count', u64(row.today_wish_count), { implicitZero: true });
  const selections = Array.isArray(row.select_list) ? row.select_list.map(entry => ({
    award_tid: u64(entry?.award_tid),
    select_tid: u64(entry?.select_tid)
  })) : [];
  if (row.select_list === undefined && selections.length === 0) row.select_list = selections;
  else if (JSON.stringify(row.select_list) !== JSON.stringify(selections)) {
    row.select_list = selections;
    changed = true;
  }
  const days = Array.isArray(row.buy_day_list)
    ? [...new Set(row.buy_day_list.map(value => u64(value)).filter(value => value !== '0'))].sort((a, b) => Number(a) - Number(b))
    : [];
  if (row.buy_day_list === undefined && days.length === 0) row.buy_day_list = days;
  else if (JSON.stringify(row.buy_day_list) !== JSON.stringify(days)) {
    row.buy_day_list = days;
    changed = true;
  }
  set('can_wish_count', u64(row.can_wish_count), { implicitZero: true });
  // normal_times is authoritative for the draw sequence, while normal_bin is
  // authoritative for already-granted awards. Repair a partially imported row
  // without moving it backwards.
  const claimed = countBits(bitsOf(row.normal_bin));
  if (claimed > Number(row.normal_times)) set('normal_times', u64(claimed));
  return changed;
}

function ensureRows(info, today) {
  let changed = false;
  if (!Array.isArray(info.data_list)) { info.data_list = []; changed = true; }
  const rows = [];
  const seen = new Set();
  for (const row of info.data_list) {
    const type = integer(row?.type);
    if (!wishTreeTables.WishTreeType.has(type) || seen.has(type)) { changed = true; continue; }
    seen.add(type);
    changed = normalizeRow(row, type, today) || changed;
    rows.push(row);
  }
  for (const type of wishTreeTables.WishTreeType.keys()) {
    if (seen.has(type)) continue;
    rows.push(emptyInfo(today).data_list.find(row => Number(row.type) === type));
    changed = true;
  }
  rows.sort((a, b) => a.type - b.type);
  info.data_list = rows;
  return { changed, rows };
}

function orderDaysByType(db) {
  const result = new Map([...wishTreeTables.WishTreeType.keys()].map(type => [type, new Set()]));
  let rows;
  try {
    rows = db.prepare('SELECT product_id,created_at FROM recharge_orders ORDER BY rowid').all();
  } catch {
    return result;
  }
  for (const row of rows) {
    const type = wishTreeTypeForGift(row.product_id);
    if (!type) continue;
    const milliseconds = Date.parse(row.created_at);
    if (!Number.isFinite(milliseconds)) continue;
    result.get(type).add(dayIndex(milliseconds));
  }
  return result;
}

export function createWishTreeService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const readInfo = modules => {
    const raw = modules.get(WISH_TREE_MODULE);
    if (!raw) return emptyInfo(dayIndex(now()));
    const bytes = rawBinary(raw);
    return bytes.length ? codec.unpack('pb_wish_tree_new', bytes) : emptyInfo(dayIndex(now()));
  };
  const writeInfo = (modules, info) => {
    const data = codec.pack('pb_wish_tree_new', info);
    modules.set(WISH_TREE_MODULE, serializedBinary(data));
    return data;
  };
  const rowFor = (info, type) => info.data_list.find(row => integer(row.type) === type) ?? null;

  function ensureLoginState() {
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const today = dayIndex(now());
      const info = readInfo(modules);
      const shape = ensureRows(info, today);
      let changed = shape.changed || !modules.has(WISH_TREE_MODULE);
      const orders = orderDaysByType(db);
      for (const row of info.data_list) {
        const accrueDay = Number(row.accrue_day);
        const cycleEnd = accrueDay + Number(wishTreeTables.WishTreeGlobal.max_accrue_day) - 1;
        const inCycle = day => day >= accrueDay && day <= Math.min(today, cycleEnd);
        const days = new Set(row.buy_day_list.filter(day => inCycle(Number(day))));
        for (const day of orders.get(Number(row.type)) ?? []) if (inCycle(day)) days.add(String(day));
        const normalizedDays = [...days].sort((a, b) => Number(a) - Number(b));
        if (normalizedDays.length !== row.buy_day_list.length || normalizedDays.some((day, index) => day !== row.buy_day_list[index])) {
          row.buy_day_list = normalizedDays;
          changed = true;
        }
        const claimable = Math.max(0, normalizedDays.length - row.normal_times);
        if (Number(row.can_wish_count) < claimable) {
          row.can_wish_count = String(claimable);
          changed = true;
        }
      }
      if (changed) {
        writeInfo(modules, info);
        model.state.modules.value = [...modules];
        log({ event: 'wish_tree_login_synchronized', rows: info.data_list.length, orders: [...orders.values()].reduce((sum, days) => sum + days.size, 0) });
      }
      return changed;
    });
  }

  function recordPurchase({ modules, productId, day, at = now() }) {
    const type = wishTreeTypeForGift(productId);
    if (!type) return { type: 0, changed: false };
    const today = dayIndex(at);
    const info = readInfo(modules);
    const shape = ensureRows(info, today);
    const row = rowFor(info, type);
    if (!row) return { type, changed: false };
    const purchaseDay = Number.isSafeInteger(Number(day)) && Number(day) > 0 ? Number(day) : today;
    const cycleEnd = Number(row.accrue_day) + Number(wishTreeTables.WishTreeGlobal.max_accrue_day) - 1;
    if (purchaseDay < Number(row.accrue_day) || purchaseDay > cycleEnd) {
      throw new GameError(310, 'Wish-tree rebate cycle is closed');
    }
    let changed = !modules.has(WISH_TREE_MODULE) || shape.changed;
    if (!row.buy_day_list.includes(String(purchaseDay))) {
      row.buy_day_list.push(String(purchaseDay));
      row.buy_day_list.sort((a, b) => Number(a) - Number(b));
      row.can_wish_count = String(Number(row.can_wish_count) + 1);
      changed = true;
      log({ event: 'wish_tree_purchase_recorded', type, day: purchaseDay, canWishCount: row.can_wish_count });
    }
    if (changed) writeInfo(modules, info);
    return { type, day: purchaseDay, changed, canWishCount: Number(row.can_wish_count) };
  }

  function draw(type) {
    const giftType = integer(type);
    if (!wishTreeTables.WishTreeType.has(giftType)) throw new GameError(1, 'Invalid wish-tree type');
    const at = Number(now()), today = dayIndex(at);
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const info = readInfo(modules);
      const shape = ensureRows(info, today);
      const row = rowFor(info, giftType);
      if (!row) throw new GameError(5, 'Wish-tree type is not configured');
      if (today < row.accrue_day) throw new GameError(311, 'Wish-tree draw has not opened');
      if (Number(row.can_wish_count) <= 0) throw new GameError(310, 'No wish-tree draw is available');
      const list = row.normal_idx_list.map(value => integer(value)).filter(value => value > 0);
      if (!list.length) throw new GameError(5, 'Wish-tree award list is empty');
      const bits = bitsOf(row.normal_bin);
      let index = nonNegative(row.normal_times);
      if (index >= list.length || hasBit(bits, list[index] % AWARD_BIT_DELTA)) {
        index = list.findIndex(tid => !hasBit(bits, tid % AWARD_BIT_DELTA));
        if (index < 0) throw new GameError(310, 'All wish-tree awards are claimed');
      }
      const awardTid = list[index];
      const award = wishTreeTables.WishTreeAward.get(awardTid);
      if (!award) throw new GameError(5, 'Wish-tree award is not configured');
      const rewards = [[award.item, award.count]];
      if (award.extra_item && award.extra_count) rewards.push([award.extra_item, award.extra_count]);
      const granted = grantResources(model, rewards, tables, { codec });
      row.normal_bin = setBit(bits, awardTid % AWARD_BIT_DELTA).toString('base64');
      row.normal_times = String(Math.max(Number(row.normal_times), index + 1));
      row.can_wish_count = String(Math.max(0, Number(row.can_wish_count) - 1));
      row.today_wish_count = String(Number(row.today_wish_count) + 1);
      row.draw_sec = String(Math.floor(at / 1000));
      const updatedModules = new Map(model.state.modules.value);
      writeInfo(updatedModules, info);
      model.state.modules.value = [...updatedModules];
      const data = {
        tree_data: row,
        award_tid: awardTid,
        res: { changes: granted.changes, is_overflow: false },
        is_last_draw: countBits(bitsOf(row.normal_bin)) >= new Set(list.map(tid => tid % AWARD_BIT_DELTA)).size
      };
      log({ event: 'wish_tree_draw_committed', type: giftType, awardTid, index, changes: granted.changes.length, shapeChanged: shape.changed });
      return { value: data, data: codec.pack('pb_wish_tree_draw_back', data) };
    });
  }

  function chooseTheme(type) {
    const giftType = integer(type);
    if (!wishTreeTables.WishTreeType.has(giftType)) throw new GameError(1, 'Invalid wish-tree type');
    // The client owns the current-tab selection. The server still validates the
    // type so an unknown tab cannot silently succeed.
    return { value: { type: giftType }, data: Buffer.alloc(0) };
  }

  function select(request) {
    const giftType = integer(request?.type);
    const awardTid = integer(request?.award_tid);
    const selectTid = integer(request?.select_tid);
    if (!wishTreeTables.WishTreeType.has(giftType) || awardTid <= 0 || selectTid <= 0) {
      throw new GameError(1, 'Invalid wish-tree selection');
    }
    const options = wishTreeTables.WishTreeSelectAward.get(awardTid);
    if (!options?.includes(selectTid)) throw new GameError(5, 'Wish-tree selection is not configured');
    const at = Number(now()), today = dayIndex(at);
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const info = readInfo(modules);
      const shape = ensureRows(info, today);
      const row = rowFor(info, giftType);
      if (!row) throw new GameError(5, 'Wish-tree type is not configured');
      const bits = bitsOf(row.normal_bin);
      if (hasBit(bits, awardTid % AWARD_BIT_DELTA)) throw new GameError(310, 'Wish-tree award is already claimed');
      const existing = row.select_list.find(entry => Number(entry.award_tid) === awardTid);
      if (existing) {
        if (Number(existing.select_tid) !== selectTid) existing.select_tid = String(selectTid);
        if (Number(existing.select_tid) === selectTid || shape.changed) {
          writeInfo(modules, info);
          model.state.modules.value = [...modules];
        }
      } else {
        row.select_list.push({ award_tid: String(awardTid), select_tid: String(selectTid) });
        writeInfo(modules, info);
        model.state.modules.value = [...modules];
      }
      const data = { type: String(giftType), select_info: { award_tid: String(awardTid), select_tid: String(selectTid) } };
      log({ event: 'wish_tree_select_committed', type: giftType, awardTid, selectTid, shapeChanged: shape.changed });
      return { value: data, data: codec.pack('pb_wish_tree_select_back', data) };
    });
  }

  function revTreasure() {
    throw new GameError(5, 'Wish-tree treasure claim is not implemented');
  }

  return {
    moduleId: WISH_TREE_MODULE,
    supports: type => COMMANDS.has(Number(type)),
    supportsProduct: productId => Boolean(wishTreeTypeForGift(productId)),
    ensureLoginState,
    recordPurchase,
    draw,
    chooseTheme,
    select,
    revTreasure,
    execute(type, value) {
      switch (Number(type)) {
        case 91701: return draw(value);
        case 91702: return chooseTheme(value);
        case 91703: return revTreasure(value);
        case 91704: return select(value);
        default: throw new GameError(5, 'Unsupported wish-tree command');
      }
    }
  };
}
