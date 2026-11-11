import { rawBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeHandleForType } from './recharge-rules.mjs';
import {
  decodeModuleLoginBlocks,
  encodeModuleLoginBlock,
  RELIC_ACTIVITY_LOGIN_MODULE_ID
} from './relic-divine-login.mjs';
import { activityWindow } from './activity-calendar.mjs';

const PREMIUM_ACTIVITY_TYPE = 184;
const PREMIUM_RECHARGE_TYPE = 128;
const ONE_YEAR_SECONDS = 365 * 86400;

function int(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : 0;
}

/**
 * ActFrame type 184 is PremiumActMgr's paid gift mall. The client's
 * PremiumActData parses a pb_premium_act block from the activity entry's
 * module_login_data. Without that block the activity row exists but
 * GetShowGiftList has no actData and the mall renders empty.
 */
export function createPremiumActService({
  store, codec, tables, premiumTables, calendar,
  now = Date.now, logger = () => {}
}) {
  if (!premiumTables?.Version || !premiumTables?.Config) {
    throw new Error('PremiumAct tables are required');
  }
  const rechargeHandle = rechargeHandleForType(tables, PREMIUM_RECHARGE_TYPE);
  if (!Number.isSafeInteger(rechargeHandle) || rechargeHandle < 1) {
    throw new Error('RechargeTable has no PremiumActMgr handle for type 128');
  }
  const currentSeconds = () => Math.floor(Number(now()) / 1000);
  const activityReferenceOpenedAt = calendar?.activityReferenceOpenedAt ?? null;
  const log = event => { try { logger(event); } catch {} };
  let loginActivityIds = [];
  let loginDeadlines = new Map();
  let loginWindows = new Map();

  function activityConfig(actId) {
    return tables.ActFrameAct?.get(Number(actId)) ?? tables.Activity?.get(Number(actId)) ?? null;
  }

  function isPremiumActConfig(config) {
    return config != null
      && Number(config.type) === PREMIUM_ACTIVITY_TYPE
      && premiumTables.Version.has(Number(config.version));
  }

  function versionOf(actId) {
    return Number(activityConfig(actId)?.version);
  }

  function giftRowsFor(actId) {
    return premiumTables.configsByVersion?.get(versionOf(actId)) ?? [];
  }

  function activityOpen(actId, at = currentSeconds(), serverRow = null) {
    const config = activityConfig(actId);
    if (!isPremiumActConfig(config) || !giftRowsFor(actId).length) return false;
    if (calendar?.mode === 'all-open') return true;
    const window = activityWindow(config, calendar?.serverOpenedAt, activityReferenceOpenedAt);
    if (window && at >= window.start && at < window.end) {
      return calendar?.isActivityRunning
        ? calendar.isActivityRunning(Number(actId), null, null, at)
        : true;
    }
    const start = int(serverRow?.start_time);
    const end = int(serverRow?.end_time);
    if (start > 0 && end > start) return at >= start && at < end;
    const cached = loginWindows.get(Number(actId));
    if (cached && at >= cached.start && at < cached.end) return true;
    if (window) {
      return calendar?.isActivityRunning
        ? calendar.isActivityRunning(Number(actId), null, null, at)
        : false;
    }
    return calendar?.isActivityRunning?.(Number(actId), null, null, at) ?? true;
  }

  function readStoredActFrame() {
    let entry;
    try {
      const modules = new Map(store.state().modules.value);
      entry = modules.get(RELIC_ACTIVITY_LOGIN_MODULE_ID);
    } catch { return null; }
    const values = Array.isArray(entry?.value) ? entry.value : [];
    if (values.length < 2) return null;
    try {
      const player = values[0]?.length ? codec.unpack('pb_act_role_login', rawBinary(values[0])) : { data_list: [] };
      const server = values[1]?.length ? codec.unpack('pb_act_server_data', rawBinary(values[1])) : { act_stage_list: [] };
      player.data_list ??= [];
      server.act_stage_list ??= [];
      return { player, server };
    } catch {
      return null;
    }
  }

  function openActivityIds(at = currentSeconds()) {
    const ids = new Set(loginActivityIds.map(Number));
    const stored = readStoredActFrame();
    const rows = new Map();
    for (const row of stored?.server?.act_stage_list ?? []) {
      const actId = int(row.act_id);
      rows.set(actId, row);
      if (activityOpen(actId, at, row)) ids.add(actId);
    }
    return [...ids].filter(actId => activityOpen(actId, at, rows.get(actId) ?? null));
  }

  function activityDeadline(actId, at = currentSeconds(), serverRow = null) {
    if (calendar?.mode === 'all-open') return at + ONE_YEAR_SECONDS;
    const window = activityWindow(activityConfig(actId), calendar?.serverOpenedAt, activityReferenceOpenedAt);
    if (window && at >= window.start && at < window.end) return window.end;
    const stored = serverRow ? null : readStoredActFrame();
    const row = serverRow ?? stored?.server?.act_stage_list?.find(value => int(value.act_id) === Number(actId));
    const storedEnd = int(row?.end_time);
    if (storedEnd > at) return storedEnd;
    if (window) return window.end;
    const cached = int(loginDeadlines.get(Number(actId)));
    if (cached > at) return cached;
    return at + 86400;
  }

  function giftBuyCounts(activityId, db = null) {
    if (!db) return store.inspect(database => giftBuyCounts(activityId, database));
    const roleId = store.state().roleId;
    const sql = 'SELECT product_id,sum(buy_num) AS n FROM activity_purchases '
      + "WHERE role_id=? AND activity_id=? AND kind='gift' GROUP BY product_id";
    return new Map(db.prepare(sql).all(roleId, Number(activityId))
      .map(row => [Number(row.product_id), Number(row.n)]));
  }

  function rechargeInfo(activityId, db = null, refreshTime = null) {
    const deadline = int(refreshTime) > 0 ? int(refreshTime) : activityDeadline(activityId);
    const counts = giftBuyCounts(activityId, db);
    return {
      refresh_time: deadline,
      buy_num_list: [...counts.entries()]
        .filter(([, count]) => count > 0)
        .map(([rechargeId, buyNum]) => ({
          recharge_id: rechargeId,
          buy_num: buyNum,
          refresh_time: deadline,
          used_extra_times: 0
        }))
    };
  }

  function giftConfig(productId, activityId = null) {
    const id = int(productId);
    const product = tables.Recharge?.get(id);
    if (!product || Number(product.type) !== PREMIUM_RECHARGE_TYPE) return null;
    const rows = premiumTables.configsByGift?.get(id) ?? [];
    if (!rows.length) return null;
    const requestedActivityId = activityId === undefined || activityId === null ? 0 : int(activityId);
    const openIds = new Set(openActivityIds());
    const candidates = requestedActivityId > 0 ? [requestedActivityId] : [...openIds];
    const matches = [];
    for (const actId of candidates) {
      if (!openIds.has(actId)) continue;
      const version = versionOf(actId);
      const row = rows.find(value => Number(value.version) === version);
      if (row) matches.push({ activityId: actId, version, config: row, product });
    }
    // Several seasonal malls can share one RechargeTable sku. Without the
    // client's activity id, assigning the purchase to either one would corrupt
    // both stores' limits, so only an unambiguous fallback is accepted.
    return matches.length === 1 ? matches[0] : null;
  }

  function isConfiguredGift(productId) {
    const product = tables.Recharge?.get(int(productId));
    if (!product || Number(product.type) !== PREMIUM_RECHARGE_TYPE) return false;
    return (premiumTables.configsByGift?.get(int(productId)) ?? [])
      .some(row => premiumTables.Version.has(Number(row.version)));
  }

  function isGiftRunning(productId) {
    const id = int(productId);
    if (!isConfiguredGift(id)) return false;
    const openVersions = new Set(openActivityIds().map(versionOf));
    return (premiumTables.configsByGift?.get(id) ?? [])
      .some(row => openVersions.has(Number(row.version)));
  }

  function assertGiftAvailable(productId, activityId = null) {
    const gift = giftConfig(productId, activityId);
    if (!gift) throw new GameError(309, 'Premium activity gift is not running');
    return gift;
  }

  function giftPurchaseCount(productId, db = null, activityId = null) {
    const gift = giftConfig(productId, activityId);
    if (!gift) return 0;
    return giftBuyCounts(gift.activityId, db).get(int(productId)) ?? 0;
  }

  function recordGiftPurchase({
    model, db, activityId, productId, buyNum,
    priceItemTid, priceAmount, requestId, payload
  }) {
    db.prepare('INSERT INTO activity_purchases '
      + '(role_id,activity_id,kind,product_id,buy_num,price_item_tid,price_amount,request_id,payload_json,created_at) '
      + 'VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      model.state.roleId, Number(activityId), 'gift', Number(productId), Number(buyNum),
      Number(priceItemTid ?? 0), Number(priceAmount ?? 0), requestId, JSON.stringify(payload),
      new Date(currentSeconds() * 1000).toISOString()
    );
  }

  function rechargeExtra(activityId, db = null) {
    return {
      flag: rechargeHandle,
      data: codec.pack('pb_recharge_limit_info', rechargeInfo(activityId, db))
    };
  }

  function updatePlayerRow(row, actId, refreshTime, db = null) {
    let blocks;
    try {
      blocks = decodeModuleLoginBlocks(row.module_login_data);
    } catch {
      throw new GameError(5, 'Premium activity login data is corrupt');
    }
    const output = [];
    let found = false;
    for (const block of blocks) {
      let value;
      try {
        value = codec.unpack('pb_premium_act', block);
      } catch {
        output.push(block);
        continue;
      }
      value.recharge_list ??= [];
      const info = value.recharge_list.find(entry => int(entry.act_tid) === Number(actId));
      if (!info) {
        output.push(codec.pack('pb_premium_act', value));
        continue;
      }
      info.recharge_info = rechargeInfo(actId, db, refreshTime);
      output.push(codec.pack('pb_premium_act', value));
      found = true;
    }
    if (!found) {
      output.push(codec.pack('pb_premium_act', {
        recharge_list: [{
          act_tid: Number(actId),
          recharge_info: rechargeInfo(actId, db, refreshTime),
          free_get_list: []
        }]
      }));
    }
    row.module_login_data = Buffer.concat(output.map(encodeModuleLoginBlock));
  }

  function synchronizeLogin({ player, server }, at = currentSeconds()) {
    player.data_list ??= [];
    server.act_stage_list ??= [];
    const ids = [];
    const deadlines = new Map();
    const windows = new Map();
    for (const serverRow of server.act_stage_list) {
      const actId = int(serverRow.act_id);
      if (!activityOpen(actId, at, serverRow)) continue;
      let playerRow = player.data_list.find(row => int(row.act_stage?.act_id) === actId);
      if (!playerRow) {
        playerRow = {
          act_stage: {
            act_id: actId,
            start_time: String(serverRow.start_time ?? ''),
            end_time: String(serverRow.end_time ?? ''),
            cur_stage_id: 50,
            history_time: []
          },
          module_login_data: Buffer.alloc(0)
        };
        player.data_list.push(playerRow);
      }
      const deadline = activityDeadline(actId, at, serverRow);
      updatePlayerRow(playerRow, actId, deadline);
      ids.push(actId);
      deadlines.set(actId, deadline);
      windows.set(actId, { start: int(serverRow.start_time), end: deadline });
    }
    loginActivityIds = ids;
    loginDeadlines = deadlines;
    loginWindows = windows;
    if (ids.length) {
      log({
        event: 'premium_act_login_synced',
        actIds: ids,
        gifts: Object.fromEntries(ids.map(id => [id, giftRowsFor(id).map(row => int(row.gift))]))
      });
    }
    return {
      activityIds: ids,
      giftIds: Object.fromEntries(ids.map(id => [id, giftRowsFor(id).map(row => int(row.gift))]))
    };
  }

  return {
    rechargeHandle,
    isConfiguredGift,
    isGiftRunning,
    giftConfig,
    assertGiftAvailable,
    giftPurchaseCount,
    recordGiftPurchase,
    rechargeInfo,
    rechargeExtra,
    synchronizeLogin,
    openActivityIds
  };
}
