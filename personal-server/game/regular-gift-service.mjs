import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { rechargeCycleKey, rechargeDayIndex } from './recharge-rules.mjs';

export const REGULAR_GIFT_MODULE_ID = 26;
export const REGULAR_GIFT_HANDLE = 7;

const DAY_SECONDS = 86400;
const RECHARGE_RESET_OFFSET_SECONDS = 3 * 3600;
const REFRESH_DAILY = 1;
const REFRESH_WEEKLY = 2;
const REFRESH_PERIOD = 4;
const REFRESH_LIFETIME = 6;

function parsePayload(json) {
  try { return JSON.parse(json ?? '{}'); } catch { return {}; }
}
function nextDailyRefresh(at) {
  return (rechargeDayIndex(at) + 1) * DAY_SECONDS - RECHARGE_RESET_OFFSET_SECONDS;
}

function nextWeeklyRefresh(at) {
  const currentWeek = Math.floor((rechargeDayIndex(at) + 3) / 7);
  const nextWeekDay = (currentWeek + 1) * 7 - 3;
  return nextWeekDay * DAY_SECONDS - RECHARGE_RESET_OFFSET_SECONDS;
}

function refreshTimeFor(refreshType, at) {
  if (Number(refreshType) === REFRESH_DAILY) return nextDailyRefresh(at);
  if (Number(refreshType) === REFRESH_WEEKLY) return nextWeeklyRefresh(at);
  // These mall rows are lifetime/no-reset or activity-period products. The
  // currently shipped activity-period type has no groups and therefore no
  // purchase counter that can expire in the client.
  if ([0, REFRESH_PERIOD, REFRESH_LIFETIME].includes(Number(refreshType))) return 0;
  throw new Error('Unsupported RegularGift refresh type ' + refreshType);
}

function refreshMatchesCycle(refreshType, product) {
  const cycle = Number(product?.buy_cycle_limit ?? 0);
  if (Number(refreshType) === REFRESH_DAILY) return cycle === 1;
  if (Number(refreshType) === REFRESH_WEEKLY) return cycle === 2 || cycle === 3;
  if (Number(refreshType) === REFRESH_PERIOD) return [4, 5, 7].includes(cycle);
  if (Number(refreshType) === REFRESH_LIFETIME) return cycle === 6;
  return cycle === 0 || cycle === 6;
}

function integerId(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`Invalid RegularGift ${label}`);
  return number;
}

export function createRegularGiftService({ codec, tables, accountId = 'local-1' }) {
  if (!(tables?.RegularGiftType instanceof Map)
    || !(tables?.RegularGiftGroup instanceof Map)
    || !(tables?.RegularGift instanceof Map)
    || !(tables?.Recharge instanceof Map)) {
    throw new Error('RegularGift configuration is missing');
  }

  const activeTypes = [...tables.RegularGiftType.values()]
    .filter(row => row.forbid !== true)
    .map(row => integerId(row.tid, 'type'))
    .sort((left, right) => left - right);
  const activeTypeSet = new Set(activeTypes);
  const configByType = new Map();
  const configByProduct = new Map();

  for (const config of tables.RegularGift.values()) {
    const type = integerId(config.type, 'type');
    if (!activeTypeSet.has(type)) continue;
    if (configByType.has(type)) throw new Error('Duplicate RegularGift type ' + type);
    const products = [];
    const seen = new Set();
    for (const groupId of config.groups ?? []) {
      const group = tables.RegularGiftGroup.get(integerId(groupId, 'group'));
      if (!group) throw new Error('Missing RegularGift group ' + groupId);
      for (const rawProductId of group.gifts ?? []) {
        const productId = integerId(rawProductId, 'product');
        if (seen.has(productId)) continue;
        const product = tables.Recharge.get(productId);
        if (!product) throw new Error('Missing RegularGift recharge product ' + productId);
        if (!refreshMatchesCycle(config.refresh_type, product)) {
          throw new Error(`RegularGift type ${type} refresh does not match product ${productId} cycle`);
        }
        const previous = configByProduct.get(productId);
        if (previous && Number(previous.config.type) !== type) {
          throw new Error('RegularGift product belongs to multiple types: ' + productId);
        }
        seen.add(productId);
        products.push(product);
        if (!previous) configByProduct.set(productId, { config, groupId: Number(group.tid) });
      }
    }
    configByType.set(type, {
      tid: integerId(config.tid, 'row tid'),
      type,
      refreshType: Number(config.refresh_type),
      products
    });
  }

  const configuredProductIds = [...configByProduct.keys()].sort((left, right) => left - right);
  const limitedProductIds = configuredProductIds.filter(productId => {
    return Number(tables.Recharge.get(productId)?.can_buy_times ?? 0) > 0;
  });

  function existingRows(modules) {
    const raw = modules?.get?.(REGULAR_GIFT_MODULE_ID);
    if (!raw) return new Map();
    try {
      const info = codec.unpack('pb_regular_gift_info', rawBinary(raw));
      return new Map((info.gift_list ?? []).map(row => [Number(row.type), row]));
    } catch {
      return new Map();
    }
  }

  function purchaseCounts(rows, at) {
    const wanted = new Map();
    for (const [productId, config] of configByProduct) {
      const product = tables.Recharge.get(productId);
      wanted.set(productId, rechargeCycleKey(product, at));
    }
    const counts = new Map();
    for (const row of rows ?? []) {
      const product = tables.Recharge.get(Number(row.product_id));
      if (!product || !configByProduct.has(Number(row.product_id))) continue;
      const purchasedAt = Math.floor(Date.parse(row.created_at) / 1000);
      if (!Number.isSafeInteger(purchasedAt)) continue;
      const payload = parsePayload(row.payload_json);
      let cycleKey;
      try {
        cycleKey = rechargeCycleKey(product, purchasedAt, {
          period: Number.isSafeInteger(Number(payload.period)) ? Number(payload.period) : 0
        });
      } catch {
        continue;
      }
      if (cycleKey !== wanted.get(Number(row.product_id))) continue;
      const quantity = Number(payload.buy_num ?? 1);
      const normalized = Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1;
      counts.set(Number(row.product_id), (counts.get(Number(row.product_id)) ?? 0) + normalized);
    }
    return counts;
  }

  function buildInfo({ modules, rows, at }) {
    if (!Number.isSafeInteger(at) || at <= 0) throw new Error('Invalid RegularGift snapshot time');
    const previous = existingRows(modules);
    const counts = purchaseCounts(rows, at);
    const giftList = activeTypes.map(type => {
      const config = configByType.get(type);
      if (!config) return previous.get(type) ?? { type, tid: 0, buy_limit_info: { refresh_time: 0, buy_num_list: [] } };
      const refreshTime = refreshTimeFor(config.refreshType, at);
      return {
        tid: config.tid,
        type,
        buy_limit_info: {
          refresh_time: refreshTime,
          buy_num_list: config.products.map(product => ({
            recharge_id: Number(product.tid),
            buy_num: counts.get(Number(product.tid)) ?? 0,
            refresh_time: refreshTime,
            used_extra_times: 0
          }))
        }
      };
    });
    return { gift_list: giftList };
  }

  function writeSnapshot(modules, rows, at) {
    const info = buildInfo({ modules, rows, at });
    const data = codec.pack('pb_regular_gift_info', info);
    const current = modules.get(REGULAR_GIFT_MODULE_ID);
    let changed = true;
    if (current) {
      try { changed = !rawBinary(current).equals(data); } catch {}
    }
    if (changed) modules.set(REGULAR_GIFT_MODULE_ID, serializedBinary(data));
    return { changed, data, info };
  }

  return {
    activeTypes: [...activeTypes],
    configuredProductIds,
    limitedProductIds,
    supportsProduct(productId) {
      return configByProduct.has(Number(productId));
    },
    typeForProduct(productId) {
      return Number(configByProduct.get(Number(productId))?.config.type ?? 0);
    },
    groupIdForProduct(productId) {
      return Number(configByProduct.get(Number(productId))?.groupId ?? 0);
    },
    buildInfo({ modules = new Map(), rows = [], at }) {
      return buildInfo({ modules, rows, at });
    },
    restoreFromOrders({ modules, rows, at }) {
      return writeSnapshot(modules, rows, at).changed;
    },
    purchaseExtra({ modules, db, at }) {
      const rows = db.prepare('SELECT product_id,created_at,payload_json FROM recharge_orders WHERE account_id=? ORDER BY rowid').all(accountId);
      return writeSnapshot(modules, rows, at).data;
    }
  };
}
