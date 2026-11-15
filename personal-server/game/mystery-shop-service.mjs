import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readMysteryShopTables } from '../config/mystery-shop-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

export const MYSTERY_SHOP_COMMANDS = Object.freeze({ autoRefresh: 91501, manualRefresh: 91502, buy: 91503 });
export const MYSTERY_SHOP_MODULE_ID = 162;
export const MYSTERY_SHOP_DECISION_ID = 'R1-ITEM-MYSTERYSHOP-20261115';

// R1 requires code 5 for failure branches whose original server error code is
// unavailable.  Keep malformed ETF and invalid cell ids on the same boundary.
const CODE_INVALID = 5;
const CODE_UNAVAILABLE = 5;
const fail = (code, message) => { throw new GameError(code, `${message} decisionId=${MYSTERY_SHOP_DECISION_ID}`); };

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function scalarBytes(module) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
    fail(CODE_UNAVAILABLE, 'Mystery shop login module is not a scalar binary payload');
  }
  try { return rawBinary(module); }
  catch { fail(CODE_UNAVAILABLE, 'Mystery shop login module is malformed'); }
}

function lowerInteger(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) fail(CODE_UNAVAILABLE, `Mystery shop ${label} is invalid`);
  return number;
}

function normalizeState(state) {
  if (!state || typeof state !== 'object' || !Array.isArray(state.discount_items)) {
    fail(CODE_UNAVAILABLE, 'Mystery shop login data is invalid');
  }
  const seen = new Set();
  const discountItems = state.discount_items.map(row => {
    const cellId = positiveInteger(row?.cell_id, 'mystery shop cell id');
    if (seen.has(cellId)) fail(CODE_UNAVAILABLE, `Mystery shop cell ${cellId} is duplicated`);
    seen.add(cellId);
    return {
      cell_id: cellId,
      discount_item_tid: String(positiveInteger(row?.discount_item_tid, 'mystery shop item tid')),
      discount_price_index: String(positiveInteger(row?.discount_price_index, 'mystery shop discount tid')),
      is_bought: Boolean(row?.is_bought)
    };
  }).sort((left, right) => left.cell_id - right.cell_id);
  return {
    ...state,
    next_auto_refresh_time: String(lowerInteger(state.next_auto_refresh_time, 'next auto refresh time')),
    last_manual_refresh_time: String(lowerInteger(state.last_manual_refresh_time, 'last manual refresh time')),
    manual_refresh_count: lowerInteger(state.manual_refresh_count, 'manual refresh count'),
    buy_times: String(lowerInteger(state.buy_times, 'buy times')),
    customize_auto_refresh_times: lowerInteger(state.customize_auto_refresh_times, 'customized auto refresh times'),
    all_times_data: Array.isArray(state.all_times_data) ? state.all_times_data : [],
    discount_items: discountItems
  };
}

function requestKey(context, cellId) {
  const raw = context?.requestId ?? `mystery-shop:${context?.connection ?? 'direct'}:${context?.seq ?? cellId}`;
  const value = String(raw);
  if (!/^[A-Za-z0-9_.:-]{1,160}$/.test(value)) fail(CODE_INVALID, 'Invalid mystery shop request ID');
  return value;
}

export function createMysteryShopService({
  store,
  codec,
  tables = readMysteryShopTables(),
  gameTables,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Mystery shop store is unavailable');
  if (!gameTables?.Item?.size) throw new Error('Mystery shop resource tables are unavailable');
  const log = event => { try { logger(event); } catch {} };

  store.inspect(db => db.exec(`
    CREATE TABLE IF NOT EXISTS mystery_shop_purchases (
      role_id INTEGER NOT NULL,
      request_id TEXT NOT NULL,
      cell_id INTEGER NOT NULL,
      discount_item_tid INTEGER NOT NULL,
      discount_price_index INTEGER NOT NULL,
      cost_item INTEGER NOT NULL,
      price INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(role_id, request_id)
    );
  `));

  function readState(model, { require = true } = {}) {
    const modules = new Map(model.state.modules.value);
    const bytes = scalarBytes(modules.get(MYSTERY_SHOP_MODULE_ID));
    if (!bytes.length) {
      if (require) fail(CODE_UNAVAILABLE, 'Mystery shop has no authoritative login state');
      return { modules, state: null };
    }
    let decoded;
    try { decoded = codec.unpack('pb_mystery_shop', bytes); }
    catch { fail(CODE_UNAVAILABLE, 'Mystery shop login data is invalid'); }
    return { modules, state: normalizeState(decoded) };
  }

  function writeState(model, modules, state) {
    modules.set(MYSTERY_SHOP_MODULE_ID, serializedBinary(codec.pack('pb_mystery_shop', state)));
    model.state.modules.value = [...modules];
  }

  function resolvedOffer(state, cellId) {
    const offer = state.discount_items.find(row => Number(row.cell_id) === cellId);
    if (!offer) fail(CODE_UNAVAILABLE, `Mystery shop cell ${cellId} is not present in authoritative state`);
    if (offer.is_bought) fail(CODE_UNAVAILABLE, `Mystery shop cell ${cellId} was already bought`);
    const cell = tables.cell(cellId);
    const item = tables.item(offer.discount_item_tid);
    const discount = tables.discount(offer.discount_price_index);
    if (!cell) fail(CODE_UNAVAILABLE, `Mystery shop cell ${cellId} is missing from configuration`);
    if (!item) fail(CODE_UNAVAILABLE, `Mystery shop item ${offer.discount_item_tid} is missing from configuration`);
    if (!discount) fail(CODE_UNAVAILABLE, `Mystery shop discount ${offer.discount_price_index} is missing from configuration`);
    if (cell.pre_condition !== undefined || item.pre_condition !== undefined) {
      fail(
        CODE_UNAVAILABLE,
        `Mystery shop eligibility pre_condition for cell ${cellId} and item ${item.tid} is not recovered`
      );
    }
    const itemLibraryType = Math.floor(Number(item.tid) / 10000000);
    if (itemLibraryType !== Number(cell.cell_lib_type) || Number(discount.discount_lib_type) !== Number(cell.cell_lib_type)) {
      fail(CODE_UNAVAILABLE, `Mystery shop cell ${cellId} has mismatched item and discount families`);
    }
    const basePrice = Number(item.discount_price[Number(discount.discount_idx)]);
    if (!Number.isSafeInteger(basePrice) || basePrice <= 0) {
      fail(CODE_UNAVAILABLE, `Mystery shop item ${item.tid} has no price at discount index ${discount.discount_idx}`);
    }
    const numerator = BigInt(basePrice) * BigInt(discount.discount);
    if (numerator % 100n !== 0n) {
      fail(
        CODE_UNAVAILABLE,
        `Mystery shop price rounding for item ${item.tid}, discount ${discount.tid}, base ${basePrice} is not recovered`
      );
    }
    const price = Number(numerator / 100n);
    if (!Number.isSafeInteger(price) || price <= 0) fail(CODE_UNAVAILABLE, 'Mystery shop purchase price is invalid');
    return { offer, cell, item, discount, price };
  }

  function buy(input, context = {}) {
    const raw = input && typeof input === 'object' && !Array.isArray(input) ? (input.value ?? input.cell_id ?? input.cellId) : input;
    const cellId = positiveInteger(raw, 'mystery shop cell id');
    const key = requestKey(context, cellId);
    return store.transaction((model, db) => {
      const previous = db.prepare('SELECT payload_json FROM mystery_shop_purchases WHERE role_id=? AND request_id=?')
        .get(model.state.roleId, key);
      if (previous) {
        const previousValue = JSON.parse(previous.payload_json);
        return {
          schema: 'pb_res_to_client',
          value: previousValue,
          data: codec.pack('pb_res_to_client', previousValue),
          duplicate: true,
          cellId
        };
      }

      const { modules, state } = readState(model);
      const offer = resolvedOffer(state, cellId);
      const consumed = consumeResources(model, [[Number(offer.item.cost_item), offer.price]], CODE_UNAVAILABLE, { codec, now });
      const granted = grantResources(model, [[Number(offer.item.item), Number(offer.item.count)]], gameTables, { codec });
      const value = { changes: [...consumed.changes, ...granted.changes], is_overflow: false };

      const index = state.discount_items.findIndex(row => Number(row.cell_id) === cellId);
      state.discount_items[index].is_bought = true;
      state.buy_times = String(BigInt(state.buy_times) + 1n);
      writeState(model, modules, state);
      const data = codec.pack('pb_res_to_client', value);
      db.prepare(`INSERT INTO mystery_shop_purchases
        (role_id,request_id,cell_id,discount_item_tid,discount_price_index,cost_item,price,payload_json,created_at)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(
        model.state.roleId,
        key,
        cellId,
        Number(offer.offer.discount_item_tid),
        Number(offer.offer.discount_price_index),
        Number(offer.item.cost_item),
        offer.price,
        JSON.stringify(value),
        new Date(Number(now())).toISOString()
      );
      log({
        event: 'mystery_shop_purchase_committed',
        roleId: model.state.roleId,
        cellId,
        itemTid: Number(offer.item.item),
        count: Number(offer.item.count),
        costItem: Number(offer.item.cost_item),
        price: offer.price
      });
      return { schema: 'pb_res_to_client', value, data, duplicate: false, cellId };
    });
  }

  async function decode(type, data, { etf } = {}) {
    const commandType = Number(type);
    if (!Object.values(MYSTERY_SHOP_COMMANDS).includes(commandType)) fail(CODE_INVALID, 'Unsupported mystery shop command');
    if (typeof etf !== 'function') fail(CODE_UNAVAILABLE, 'Mystery shop ETF decoder is unavailable');
    const bytes = Buffer.from(data ?? Buffer.alloc(0));
    if (!bytes.length) fail(CODE_INVALID, 'Mystery shop request is empty');
    let decoded;
    try { decoded = await etf(bytes); }
    catch { fail(CODE_INVALID, 'Mystery shop request is not valid ETF'); }
    return decoded?.value ?? decoded;
  }

  function execute(type, input, context) {
    const commandType = Number(type);
    if (commandType === MYSTERY_SHOP_COMMANDS.buy) return buy(input, context);
    if (commandType === MYSTERY_SHOP_COMMANDS.autoRefresh) {
      fail(CODE_UNAVAILABLE, 'ITEM-MYSTERYSHOP-AUTO-REFRESH: candidate selection from ItemLib, all_times_data and auto refresh weights is not recovered');
    }
    if (commandType === MYSTERY_SHOP_COMMANDS.manualRefresh) {
      fail(CODE_UNAVAILABLE, 'ITEM-MYSTERYSHOP-MANUAL-REFRESH: candidate selection, manual_refresh_cw consumption and state replacement are not recovered');
    }
    fail(CODE_INVALID, 'Unsupported mystery shop command');
  }

  function loginPayload() {
    return store.transaction(model => {
      const { state } = readState(model, { require: false });
      return state ? { present: true, data: codec.pack('pb_mystery_shop', state) } : { present: false, data: Buffer.alloc(0) };
    });
  }

  return {
    // 91501/91502 remain owned by the shared R1 refusal table until their
    // candidate/refresh chain is recovered. Their execute branches stay here
    // as a defensive boundary for direct service tests.
    supports: type => Number(type) === MYSTERY_SHOP_COMMANDS.buy,
    isEtfRequest: type => Number(type) === MYSTERY_SHOP_COMMANDS.buy,
    requestSchema: type => Number(type) === MYSTERY_SHOP_COMMANDS.buy ? 'etf_integer_cell_id' : null,
    responseSchema: type => Number(type) === MYSTERY_SHOP_COMMANDS.buy ? 'pb_res_to_client'
      : Number(type) === MYSTERY_SHOP_COMMANDS.manualRefresh ? 'pb_mystery_shop_manual_refresh_back'
        : Number(type) === MYSTERY_SHOP_COMMANDS.autoRefresh ? 'pb_mystery_shop' : null,
    decode,
    execute,
    loginPayload,
    moduleId: MYSTERY_SHOP_MODULE_ID
  };
}
