import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

// Ordinary mall shops (ShopCmd type 1201-1208).
//
// Evidence used by this service:
//   * personal-server/assets/protobuf/shop.net.proto.bin  (request/response messages + field comments)
//   * personal-server/assets/protobuf/shop.db.proto.bin   (pb_shop_info / pb_shop_auto_refresh / pb_shop_quick)
//   * ShopTable.data -> ShopMain / ShopItem / ShopPeriod / ShopAutoRefresh (game-tables.mjs)
//   * agent/workflow/interface-catalog/shop-1208.md       (1208 ETF request + pb_manual_refresh_shop_back)
//
// ShopTable.ShopItem rows are keyed by a composite tid: floor(tid / 1e7) is the shop id and the
// remaining digits address the cell. Each row carries the awarded item, its amount per purchase,
// the currency tid, a price tier list [volume, unit price] and a per-cycle purchase limit.
const DAY_SECONDS = 86400;
const MAX_PURCHASE_COUNT = 999;
const PET_SHOP_IDS = new Set([5070005]);

function requestKey(prefix, context) {
  const value = String(context?.requestId ?? `${prefix}:${context?.connection ?? 'direct'}:${context?.seq ?? 0}`);
  if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(value)) throw new GameError(1, 'Invalid shop request ID');
  return value;
}

function mergeChanges(changes) {
  const merged = new Map();
  for (const change of changes) {
    const existing = merged.get(String(change.tid));
    if (existing) {
      existing.new_num = String(change.new_num);
      existing.diff_num = String(BigInt(existing.diff_num) + BigInt(change.diff_num));
    } else {
      merged.set(String(change.tid), { ...change });
    }
  }
  return [...merged.values()];
}

// ETF payloads for 1202-1205/1207/1208 carry one undecoded client register. Accept the shapes the
// client can produce (scalar id, [id, count], [shop, cell, item, count], table, list of tables) and
// normalise them; anything else is a business error instead of a silent success.
function toRecord(entry) {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'number' || typeof entry === 'string') {
    const id = Number(entry);
    return Number.isSafeInteger(id) && id > 0 ? { shopItemId: id } : null;
  }
  if (typeof entry === 'object' && !Array.isArray(entry)) {
    const shopItemId = Number(entry.shop_item_id ?? entry.shopItemId ?? entry.tid ?? entry.id);
    const count = Number(entry.count ?? entry.num ?? 1);
    const shopId = Number(entry.shop_id ?? entry.shopId ?? 0);
    const record = { count };
    if (Number.isSafeInteger(shopItemId) && shopItemId > 0) record.shopItemId = shopItemId;
    if (Number.isSafeInteger(shopId) && shopId > 0) record.shopId = shopId;
    const cellIndex = Number(entry.cell_index ?? entry.cellIndex ?? 0);
    if (Number.isSafeInteger(cellIndex) && cellIndex > 0) record.cellIndex = cellIndex;
    return record.shopItemId || record.shopId ? record : null;
  }
  return null;
}

function toRecords(value) {
  if (Array.isArray(value)) {
    if (!value.length) throw new GameError(1, 'Empty shop request');
    if (value.every(entry => entry && typeof entry === 'object' && !Array.isArray(entry))) {
      return value.map(toRecord).filter(Boolean);
    }
    if (value.length >= 4 && value.slice(0, 4).every(entry => Number.isSafeInteger(Number(entry)))) {
      return [{
        shopId: Number(value[0]), cellIndex: Number(value[1]),
        shopItemId: Number(value[2]), count: Number(value[3])
      }];
    }
    const [first] = value;
    if (value.length === 1) return toRecords(first);
    if (value.length === 2 && Number.isSafeInteger(Number(first))) {
      return [{ shopItemId: Number(first), count: Number(value[1]) }];
    }
    if (value.every(entry => Number.isSafeInteger(Number(entry)))) {
      return value.map(entry => ({ shopItemId: Number(entry), count: 1 }));
    }
  }
  const record = toRecord(value);
  if (!record) throw new GameError(1, 'Invalid shop request payload');
  return [record];
}

export function createShopService({
  store,
  codec,
  tables,
  now = Date.now,
  logger = () => {},
  fallbackShopInfo = shopId => ({ id: Number(shopId), version: 0, items_groups: [] }),
  refreshRules = null
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => Math.floor(Number(now()) / 1000);
  const dayKey = seconds => Math.floor(seconds / DAY_SECONDS) * DAY_SECONDS;

  store.inspect(db => db.exec(`
    CREATE TABLE IF NOT EXISTS shop_cells (
      role_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, cell_index INTEGER NOT NULL,
      shop_item_id INTEGER NOT NULL, turn INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
      PRIMARY KEY(role_id, shop_id, cell_index));
    CREATE TABLE IF NOT EXISTS shop_shelf_state (
      role_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, turn INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, PRIMARY KEY(role_id, shop_id));
    CREATE TABLE IF NOT EXISTS shop_purchases (
      role_id INTEGER NOT NULL, request_id TEXT NOT NULL, shop_id INTEGER NOT NULL,
      shop_item_id INTEGER NOT NULL, day INTEGER NOT NULL, count INTEGER NOT NULL,
      unit_price INTEGER NOT NULL, currency_tid INTEGER NOT NULL, source TEXT NOT NULL,
      payload_json TEXT NOT NULL, settled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
      PRIMARY KEY(role_id, request_id, shop_id, shop_item_id));
    CREATE TABLE IF NOT EXISTS shop_buy_totals (
      role_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, shop_item_id INTEGER NOT NULL,
      day INTEGER NOT NULL, buy_count INTEGER NOT NULL, PRIMARY KEY(role_id, shop_id, shop_item_id, day));
    CREATE TABLE IF NOT EXISTS shop_refresh_state (
      role_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, all_refresh_count INTEGER NOT NULL DEFAULT 0,
      free_refresh_count INTEGER NOT NULL DEFAULT 0, pay_refresh_count INTEGER NOT NULL DEFAULT 0,
      last_refresh_time INTEGER NOT NULL DEFAULT 0, next_free_count_time INTEGER NOT NULL DEFAULT 0,
      last_auto_refresh_time INTEGER NOT NULL DEFAULT 0, privilege_used_times INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(role_id, shop_id));
    CREATE TABLE IF NOT EXISTS shop_settlements (
      role_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, period INTEGER NOT NULL,
      settled_at TEXT NOT NULL, PRIMARY KEY(role_id, shop_id, period));
    CREATE INDEX IF NOT EXISTS shop_purchases_shop_idx ON shop_purchases(role_id, shop_id, day);
  `));

  // shop id -> rows in configured order
  const catalogue = new Map();
  for (const [, row] of tables.ShopItem ?? []) {
    const tid = Number(row?.tid);
    if (!Number.isSafeInteger(tid) || tid <= 0) continue;
    const shopId = Math.floor(tid / 10000000);
    if (!catalogue.has(shopId)) catalogue.set(shopId, []);
    catalogue.get(shopId).push(row);
  }
  for (const rows of catalogue.values()) {
    rows.sort((left, right) => (Number(left.sort_weight ?? 0) - Number(right.sort_weight ?? 0)) || (Number(left.tid) - Number(right.tid)));
  }

  function configRow(shopId) {
    return {
      auto: tables.ShopAutoRefresh?.get(Number(shopId)) ?? null,
      period: tables.ShopPeriod?.get(Number(shopId)) ?? null,
      main: tables.ShopMain?.get(Number(shopId)) ?? null
    };
  }

  function isOrdinaryShop(shopId) {
    const id = Number(shopId);
    if (!Number.isSafeInteger(id) || id <= 0) return false;
    return catalogue.has(id) && !PET_SHOP_IDS.has(id);
  }

  function rowsOf(shopId) {
    return catalogue.get(Number(shopId)) ?? [];
  }

  function rowOf(shopItemId) {
    const id = Number(shopItemId);
    const rows = rowsOf(Math.floor(id / 10000000));
    return rows.find(row => Number(row.tid) === id) ?? null;
  }

  function versionOf(shopId) {
    const { auto, period } = configRow(shopId);
    return Number(period?.version ?? auto?.version ?? 0) || 0;
  }

  // Price tiers are [volume, unit price] pairs. The request count picks the highest tier whose
  // volume does not exceed it; rows with a negative unit price are recharge-only goods.
  function unitPriceFor(row, count) {
    const tiers = (Array.isArray(row.price) ? row.price : [])
      .map(entry => ({ volume: Number(entry?.[0] ?? 0), price: Number(entry?.[1] ?? 0) }))
      .filter(entry => Number.isSafeInteger(entry.volume) && entry.volume > 0 && Number.isSafeInteger(entry.price))
      .sort((left, right) => left.volume - right.volume);
    if (!tiers.length) throw new GameError(5, 'Shop item price is missing from configuration');
    let chosen = tiers[0];
    for (const tier of tiers) if (tier.volume <= count) chosen = tier;
    if (chosen.price < 0) throw new GameError(5, 'Shop item requires a recharge purchase path');
    return chosen.price;
  }

  function buyCounts(shopId, day, db = null) {
    const roleId = store.read().state.roleId;
    const run = database => new Map(database.prepare(
      'SELECT shop_item_id,buy_count FROM shop_buy_totals WHERE role_id=? AND shop_id=? AND day=?'
    ).all(roleId, Number(shopId), Number(day)).map(row => [Number(row.shop_item_id), Number(row.buy_count)]));
    return db ? run(db) : store.inspect(run);
  }

  function historyBought(shopId, db = null) {
    const roleId = store.read().state.roleId;
    const run = database => database.prepare(
      `SELECT shop_item_id,day,sum(count) AS buy_count FROM shop_purchases
       WHERE role_id=? AND shop_id=? GROUP BY shop_item_id,day ORDER BY day,shop_item_id`
    ).all(roleId, Number(shopId)).map(row => ({ shop_item_id: Number(row.shop_item_id), day: Number(row.day), buy_count: Number(row.buy_count) }));
    return db ? run(db) : store.inspect(run);
  }

  function shelfOf(shopId, db = null) {
    const roleId = store.read().state.roleId;
    const run = database => database.prepare(
      'SELECT cell_index,shop_item_id,turn FROM shop_cells WHERE role_id=? AND shop_id=? ORDER BY cell_index'
    ).all(roleId, Number(shopId));
    return db ? run(db) : store.inspect(run);
  }

  // A persisted shelf may legitimately be empty (every cell sold out), so the shelf snapshot
  // marker - not the row count - decides whether configuration or SQLite is authoritative.
  function hasShelf(shopId, db) {
    const roleId = store.read().state.roleId;
    return Boolean(db.prepare('SELECT 1 AS present FROM shop_shelf_state WHERE role_id=? AND shop_id=?').get(roleId, Number(shopId)));
  }

  function saveShelf(shopId, rows, turn, db) {
    const roleId = store.read().state.roleId;
    const now = new Date(currentSeconds() * 1000).toISOString();
    db.prepare('DELETE FROM shop_cells WHERE role_id=? AND shop_id=?').run(roleId, Number(shopId));
    const insert = db.prepare('INSERT INTO shop_cells (role_id,shop_id,cell_index,shop_item_id,turn,created_at) VALUES (?,?,?,?,?,?)');
    rows.forEach((row, index) => insert.run(roleId, Number(shopId), index + 1, Number(row.tid), turn, now));
    db.prepare(`INSERT INTO shop_shelf_state (role_id,shop_id,turn,created_at) VALUES (?,?,?,?)
      ON CONFLICT(role_id,shop_id) DO UPDATE SET turn=excluded.turn, created_at=excluded.created_at`)
      .run(roleId, Number(shopId), turn, now);
  }

  function groupData(shopId, db) {
    const { auto } = configRow(shopId);
    if (!auto) return Buffer.alloc(0);
    const day = dayKey(currentSeconds());
    const counts = buyCounts(shopId, day, db);
    const limitTotal = [...counts.values()].reduce((sum, value) => sum + value, 0);
    const history = historyBought(shopId, db).map(row => ({ buy_count: row.buy_count, day: row.day }));
    return codec.pack('pb_shop_auto_refresh', {
      next_refresh_time: day + DAY_SECONDS,
      limit_bought_count: limitTotal,
      items_history_bought: history
    });
  }

  function shopInfo(shopId, db = null) {
    const id = Number(shopId);
    const day = dayKey(currentSeconds());
    const run = database => {
      const counts = buyCounts(id, day, database);
      const shelves = shelfOf(id, database);
      const configured = rowsOf(id);
      const cells = hasShelf(id, database)
        ? shelves.map(cell => configured.find(row => Number(row.tid) === Number(cell.shop_item_id))).filter(Boolean)
        : configured;
      return {
        id,
        version: versionOf(id),
        items_groups: [{
          item_list: cells.map(row => ({ tid: Number(row.tid), buy_count: counts.get(Number(row.tid)) ?? 0 })),
          group_data_bin: groupData(id, database)
        }]
      };
    };
    return db ? run(db) : store.inspect(run);
  }

  function queryShops(shopIds) {
    const ids = Array.isArray(shopIds) ? shopIds : [shopIds];
    return ids.map(id => isOrdinaryShop(id) ? shopInfo(id) : fallbackShopInfo(id));
  }

  function resolveRequest(record) {
    const count = Number(record.count ?? 1);
    if (!Number.isSafeInteger(count) || count <= 0 || count > MAX_PURCHASE_COUNT) throw new GameError(1, 'Invalid shop purchase count');
    let shopItemId = Number(record.shopItemId ?? 0);
    let shopId = Number(record.shopId ?? 0);
    if (!shopItemId && shopId) {
      const rows = rowsOf(shopId);
      const cell = Number(record.cellIndex ?? 0);
      const row = rows[cell > 0 ? cell - 1 : 0];
      if (!row) throw new GameError(1, 'Shop cell is empty');
      shopItemId = Number(row.tid);
    }
    if (!Number.isSafeInteger(shopItemId) || shopItemId <= 0) throw new GameError(1, 'Shop item is missing');
    const row = rowOf(shopItemId);
    if (!row) throw new GameError(1, 'Shop item does not exist in configuration');
    const ownerShop = Math.floor(shopItemId / 10000000);
    if (shopId && shopId !== ownerShop) throw new GameError(1, 'Shop item does not belong to this shop');
    if (!isOrdinaryShop(ownerShop)) throw new GameError(1, 'Shop is not an ordinary mall shop');
    const cellRows = rowsOf(ownerShop);
    const cellIndex = cellRows.findIndex(entry => Number(entry.tid) === shopItemId) + 1;
    if (record.cellIndex && Number(record.cellIndex) !== cellIndex) throw new GameError(1, 'Shop cell does not match its item');
    const limit = Number(row.purchase_limit ?? 0);
    const itemCount = Number(row.count ?? 1);
    if (!Number.isSafeInteger(itemCount) || itemCount <= 0) throw new GameError(5, 'Shop item amount is invalid');
    if (!Number.isSafeInteger(Number(row.item)) || !Number.isSafeInteger(Number(row.currency_type))) {
      throw new GameError(5, 'Shop item configuration is incomplete');
    }
    return { shopId: ownerShop, shopItemId, cellIndex, count, row, itemCount, limit, unitPrice: unitPriceFor(row, count) };
  }

  function packRes(value) { return codec.pack('pb_res_to_client', value); }

  function purchase(records, { type, context, source = 'buy', day: requestedDay = null }) {
    if (!Array.isArray(records) || !records.length) throw new GameError(1, 'Empty shop purchase');
    const requests = records.map(resolveRequest);
    const key = requestKey('shop' + type, context);
    const day = Number.isSafeInteger(Number(requestedDay)) && Number(requestedDay) > 0 ? Number(requestedDay) : dayKey(currentSeconds());
    const result = store.transaction((model, db) => {
      const previous = db.prepare(
        'SELECT shop_id,shop_item_id,payload_json FROM shop_purchases WHERE role_id=? AND request_id=? ORDER BY rowid LIMIT 1'
      ).get(model.state.roleId, key);
      if (previous) {
        const stored = JSON.parse(previous.payload_json);
        return { ...stored, duplicate: true, data: packRes(stored.value) };
      }
      const consumed = new Map(), totals = new Map();
      let totalCost = 0;
      const stored = [];
      for (const request of requests) {
        const totalKey = request.shopId + ':' + request.shopItemId;
        const boughtSoFar = totals.get(totalKey) ?? (buyCounts(request.shopId, day, db).get(request.shopItemId) ?? 0);
        if (request.limit > 0 && boughtSoFar + request.count > request.limit) throw new GameError(307, 'Shop purchase limit reached');
        totals.set(totalKey, boughtSoFar + request.count);
        const currency = String(request.row.currency_type);
        consumed.set(currency, (consumed.get(currency) ?? 0) + request.unitPrice * request.count);
        totalCost += request.unitPrice * request.count;
        stored.push(request);
      }
      const deduct = consumeResources(model, [...consumed.entries()].map(([tid, amount]) => [Number(tid), amount]));
      const awards = [];
      for (const request of stored) {
        awards.push(...grantResources(model, [[Number(request.row.item), request.itemCount * request.count]], tables).changes);
      }
      const consolidated = mergeChanges([...deduct.changes, ...awards]);
      const value = { changes: consolidated, is_overflow: false };
      const inserted = [];
      const insertTotal = db.prepare(`INSERT INTO shop_buy_totals (role_id,shop_id,shop_item_id,day,buy_count) VALUES (?,?,?,?,?)
        ON CONFLICT(role_id,shop_id,shop_item_id,day) DO UPDATE SET buy_count=buy_count+excluded.buy_count`);
      for (const request of stored) {
        insertTotal.run(model.state.roleId, request.shopId, request.shopItemId, day, request.count);
        inserted.push({ shopId: request.shopId, shopItemId: request.shopItemId });
      }
      const purchaseInsert = db.prepare(`INSERT INTO shop_purchases
        (role_id,request_id,shop_id,shop_item_id,day,count,unit_price,currency_tid,source,payload_json,settled,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,0,?)`);
      for (const request of stored) {
        purchaseInsert.run(model.state.roleId, key, request.shopId, request.shopItemId, day, request.count,
          request.unitPrice, Number(request.row.currency_type), source,
          JSON.stringify({ value, records: inserted }), new Date(currentSeconds() * 1000).toISOString());
      }
      return { value, data: packRes(value), duplicate: false, items: inserted, totalCost };
    });
    log({ event: 'shop_purchase_committed', type, items: result.items, duplicate: result.duplicate, cost: result.totalCost });
    return result;
  }

  function buyHistoryItem(request) {
    const shopId = Number(request?.shop_id ?? 0);
    const shopItemId = Number(request?.shop_item_id ?? 0);
    const count = Number(request?.count ?? 1);
    const day = Number(request?.day ?? 0);
    if (!isOrdinaryShop(shopId)) throw new GameError(1, 'Shop is not an ordinary mall shop');
    const { auto } = configRow(shopId);
    if (!auto || !Number(auto.buy_history_item)) throw new GameError(5, 'This shop has no buy-back history');
    if (Number(auto.buy_history_item) !== shopItemId) throw new GameError(5, 'This item is not the shop buy-back item');
    if (!Number.isSafeInteger(day) || day <= 0 || day % DAY_SECONDS !== 0) throw new GameError(1, 'Invalid shop history day');
    const today = dayKey(currentSeconds());
    const turns = Number(auto.buy_history_turn ?? 0);
    if (!turns || day >= today || day < today - turns * DAY_SECONDS) throw new GameError(309, 'Shop history day is outside the buy-back window');
    const row = rowOf(shopItemId);
    if (!row) throw new GameError(1, 'Shop item does not exist in configuration');
    const unitPrice = unitPriceFor(row, Number.isSafeInteger(count) && count > 0 ? count : 1);
    const requestRecord = { shopItemId, count };
    // The buy-back purchase counts against the historical day it restores, so its limit is the
    // limit that applied on that day rather than today's.
    const purchased = purchase([requestRecord], { type: 1206, context: request?.context ?? {}, source: 'history', day });
    const history = store.inspect(db => historyBought(shopId, db)
      .filter(entry => entry.shop_item_id === shopItemId)
      .map(entry => ({ buy_count: entry.buy_count, day: entry.day })));
    const value = { shop_id: shopId, items_history_bought: history, res: { changes: purchased.value.changes, is_overflow: false } };
    log({ event: 'shop_buy_history_committed', shopId, shopItemId, day, unitPrice });
    return { value, data: codec.pack('pb_rev_buy_history_item', value), duplicate: purchased.duplicate };
  }

  function refreshShop(shopId, { type = 1208, context = {} } = {}) {
    const id = Number(shopId);
    if (!isOrdinaryShop(id)) throw new GameError(1, 'Shop is not an ordinary mall shop');
    const { auto } = configRow(id);
    if (!auto) throw new GameError(5, 'Shop does not support manual refresh');
    const result = store.transaction((model, db) => {
      const seconds = currentSeconds();
      const state = db.prepare('SELECT * FROM shop_refresh_state WHERE role_id=? AND shop_id=?').get(model.state.roleId, id)
        ?? { all_refresh_count: 0, free_refresh_count: 0, pay_refresh_count: 0, last_refresh_time: 0, next_free_count_time: 0, last_auto_refresh_time: 0, privilege_used_times: 0 };
      const free = Number(state.free_refresh_count) > 0;
      const cost = refreshRules?.costFor ? refreshRules.costFor(id, { freeCount: Number(state.free_refresh_count), payCount: Number(state.pay_refresh_count) }) : [];
      const deducted = cost?.length ? consumeResources(model, cost.map(entry => [Number(entry.tid), Number(entry.amount)])) : { changes: [] };
      const turn = Number(state.all_refresh_count) + 1;
      db.prepare(`INSERT INTO shop_refresh_state
        (role_id,shop_id,all_refresh_count,free_refresh_count,pay_refresh_count,last_refresh_time,next_free_count_time,last_auto_refresh_time,privilege_used_times)
        VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(role_id,shop_id) DO UPDATE SET
        all_refresh_count=excluded.all_refresh_count, free_refresh_count=excluded.free_refresh_count,
        pay_refresh_count=excluded.pay_refresh_count, last_refresh_time=excluded.last_refresh_time`)
        .run(model.state.roleId, id, turn, free ? Number(state.free_refresh_count) - 1 : Number(state.free_refresh_count),
          free ? Number(state.pay_refresh_count) : Number(state.pay_refresh_count) + 1, seconds,
          Number(state.next_free_count_time ?? 0), seconds, Number(state.privilege_used_times ?? 0));
      // A refresh rebuilds the shelf order; it never re-enables a limit that was already consumed today.
      saveShelf(id, rowsOf(id), turn, db);
      const res = { changes: deducted.changes, is_overflow: false };
      const info = shopInfo(id, db);
      return { value: { shop: info, res }, data: codec.pack('pb_manual_refresh_shop_back', { shop: info, res }) };
    });
    log({ event: 'shop_refreshed', type, shopId: id });
    return result;
  }

  function wipeExhausted(shopId, { context = {} } = {}) {
    const id = Number(shopId);
    if (!isOrdinaryShop(id)) throw new GameError(1, 'Shop is not an ordinary mall shop');
    const info = store.transaction((model, db) => {
      const day = dayKey(currentSeconds());
      const counts = buyCounts(id, day, db);
      const kept = rowsOf(id).filter(row => {
        const limit = Number(row.purchase_limit ?? 0);
        return limit <= 0 || (counts.get(Number(row.tid)) ?? 0) < limit;
      });
      saveShelf(id, kept, 0, db);
      return shopInfo(id, db);
    });
    log({ event: 'shop_wipe_butt_committed', shopId: id, owner: requestKey('wipe', context) });
    return { value: info, data: codec.pack('pb_shop_info', info) };
  }

  function settle(shopId) {
    const id = Number(shopId);
    if (!isOrdinaryShop(id)) throw new GameError(1, 'Shop is not an ordinary mall shop');
    return store.transaction((model, db) => {
      const pending = db.prepare(
        'SELECT day,sum(count) AS n FROM shop_purchases WHERE role_id=? AND shop_id=? AND settled=0 GROUP BY day ORDER BY day'
      ).all(model.state.roleId, id);
      const settleList = pending.map(row => ({ period: Math.floor(Number(row.day) / DAY_SECONDS), settleData: Buffer.alloc(0) }));
      const mark = db.prepare('UPDATE shop_purchases SET settled=1 WHERE role_id=? AND shop_id=? AND day=?');
      const record = db.prepare('INSERT OR IGNORE INTO shop_settlements (role_id,shop_id,period,settled_at) VALUES (?,?,?,?)');
      const settledAt = new Date(currentSeconds() * 1000).toISOString();
      for (const row of pending) {
        mark.run(model.state.roleId, id, Number(row.day));
        record.run(model.state.roleId, id, Math.floor(Number(row.day) / DAY_SECONDS), settledAt);
      }
      const info = shopInfo(id, db);
      const value = { shop: info, settle_list: settleList };
      return { value, data: codec.pack('pb_shop_settle_back', value) };
    });
  }

  function execute(type, input, context = {}) {
    if (type === 1201) {
      // Ordinary mall goods use the canonical buy command; pet-activity shops stay on the legacy
      // handler below, so an unknown shop id falls through instead of being rejected here.
      if (!isOrdinaryShop(input?.shop_id)) return null;
      return purchase([{ shopId: Number(input.shop_id), cellIndex: Number(input.cell_index ?? 0), shopItemId: Number(input.shop_item_id), count: Number(input.count ?? 1) }], { type, context });
    }
    if (type === 1202) {
      const raw = Array.isArray(input) ? input : input == null ? [] : [input];
      const ids = raw.map(Number).filter(id => Number.isSafeInteger(id) && id > 0).slice(0, 32);
      if (!ids.some(isOrdinaryShop)) return null;
      const shops = ids.map(id => isOrdinaryShop(id) ? shopInfo(id) : fallbackShopInfo(id));
      log({ event: 'shop_info_sent', type, shopCount: shops.length, ordinary: ids.filter(isOrdinaryShop) });
      return { value: { shops }, data: codec.pack('pb_query_shops_back', { shops }) };
    }
    if (type === 1203 || type === 1207) {
      const records = toRecords(input);
      return purchase(records, { type, context });
    }
    if (type === 1204) {
      const shopId = Number(Array.isArray(input) ? input[0] : input?.shop_id ?? input?.shopId ?? input);
      if (!Number.isSafeInteger(shopId) || shopId <= 0) throw new GameError(1, 'Invalid shop settle payload');
      return settle(shopId);
    }
    if (type === 1205) {
      const shopId = Number(Array.isArray(input) ? input[0] : input?.shop_id ?? input?.shopId ?? input);
      if (!Number.isSafeInteger(shopId) || shopId <= 0) throw new GameError(1, 'Invalid shop wipe payload');
      return wipeExhausted(shopId, { context });
    }
    if (type === 1206) {
      const request = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
      return buyHistoryItem({ ...request, context });
    }
    if (type === 1208) {
      const shopId = Number(Array.isArray(input) ? input[0] : input?.shop_id ?? input?.shopId ?? input);
      if (!Number.isSafeInteger(shopId) || shopId <= 0) throw new GameError(1, 'Invalid shop refresh payload');
      return refreshShop(shopId, { type, context });
    }
    throw new GameError(1, 'Unsupported shop command');
  }

  return {
    supports: type => [1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208].includes(type),
    execute,
    queryShops,
    shopInfo,
    isOrdinaryShop,
    purchase,
    settle,
    refreshShop,
    wipeExhausted,
    resolveRequest,
    toRecords,
    catalogue
  };
}
