import { GameError } from './hero-progression.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';

// ActShopMgr owns one ActShopData entity for every ActFrame type whose
// ActFrameType.big_type is 6. Each entity stores an ETF-wrapped
// pb_act_shop_db_info in module_login_data. 104801 is a read command; buying a
// good (104802) and claiming a MultiLevel award (104803) have separate state
// transitions and remain fail-closed until those transitions are fully known.
export const ACT_SHOP_MODULE_ID = 92;
export const ACT_SHOP_BIG_TYPE = 6;
export const ACT_SHOP_READ_COMMAND = 104801;

const ETF_VERSION = 0x83;
const ETF_BINARY_EXT = 0x6d;

function bytesOf(value) {
  if (value == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  if (value.value?.type === 'Buffer') return Buffer.from(value.value.data);
  if (value.value?.data && typeof value.value.data !== 'object') return Buffer.from(value.value.data);
  if (Buffer.isBuffer(value.value)) return Buffer.from(value.value);
  if (value.data?.type === 'Buffer') return Buffer.from(value.data.data);
  if (Array.isArray(value.value)) return Buffer.from(value.value);
  return Buffer.alloc(0);
}

function unwrapEtfBinary(value) {
  const bytes = bytesOf(value);
  if (bytes.length >= 2 && bytes[0] === ETF_VERSION && bytes[1] === ETF_BINARY_EXT) {
    if (bytes.length < 6) throw new GameError(5, 'ActShop login data ETF header is truncated');
    const length = bytes.readUInt32BE(2);
    if (6 + length > bytes.length) throw new GameError(5, 'ActShop login data ETF payload is truncated');
    return bytes.subarray(6, 6 + length);
  }
  return bytes;
}

function positive(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new GameError(5, label + ' is invalid');
  return number;
}

function nonNegative(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new GameError(5, label + ' is invalid');
  return number;
}

function stateEntry(actId) {
  return {
    act_tid: String(actId),
    goods_list: [],
    history_tid: '0',
    claimed_tid_list: []
  };
}

export function createActShopService({ store, codec, tables, actShopTables, calendar, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => Math.floor(Number(now()) / 1000);

  function activityEntry(activity, actId) {
    return (activity.act_list ?? []).find(entry => Number(entry?.state_data?.act_id) === Number(actId)) ?? null;
  }

  function runningFrames(activity, at) {
    const rows = [];
    for (const [actIdValue, frame] of tables?.ActFrameAct ?? []) {
      const actId = positive(actIdValue, 'ActFrame act_id');
      const type = tables?.ActFrameType?.get?.(Number(frame?.type));
      if (!type || Number(type.big_type) !== ACT_SHOP_BIG_TYPE) continue;
      // The delivered ActFrameType rows for 182/187/189 bind both the module and
      // entity to ActShop. Requiring those references keeps an unrelated future
      // big-type-6 handler from being decoded as a shop.
      if (String(type.lua_module?.reference ?? '') !== 'ActShopMgr') continue;
      if (String(type.lua_entity?.reference ?? '') !== 'ActShopData') continue;
      const version = positive(frame.version, 'ActFrame ' + actId + ' version');
      const entry = activityEntry(activity, actId);
      if (!calendar.isActivityRunning(actId, entry?.state_data ?? null, activity, at)) continue;
      rows.push({ actId, version, frame, entry });
    }
    rows.sort((left, right) => left.actId - right.actId);
    return rows;
  }

  function configuration(version) {
    const shop = actShopTables?.shopsByVersion?.get(Number(version));
    const goods = actShopTables?.goodsByVersion?.get(Number(version)) ?? [];
    const levels = actShopTables?.multiLevelByVersion?.get(Number(version)) ?? [];
    return { shop, goods, levels, complete: Boolean(shop && goods.length) };
  }

  function decodeState(entry, actId, version) {
    const inner = unwrapEtfBinary(entry?.module_login_data);
    if (!inner.length) return stateEntry(actId);
    let state;
    try {
      state = codec.unpack('pb_act_shop_db_info', inner);
    } catch (error) {
      throw new GameError(5, 'ActShop login data is invalid for activity ' + actId + ': ' + error.message);
    }
    if (state.goods_list != null && !Array.isArray(state.goods_list)) {
      throw new GameError(5, 'ActShop goods_list is invalid for activity ' + actId);
    }
    if (state.claimed_tid_list != null && !Array.isArray(state.claimed_tid_list)) {
      throw new GameError(5, 'ActShop claimed_tid_list is invalid for activity ' + actId);
    }
    state.act_tid = String(actId);
    state.goods_list ??= [];
    state.history_tid = String(nonNegative(state.history_tid ?? 0, 'ActShop ' + actId + ' history_tid'));
    state.claimed_tid_list ??= [];
    for (const row of state.goods_list) {
      const goodsId = positive(row?.goods_id, 'ActShop ' + actId + ' goods_id');
      const goods = actShopTables?.goodsById?.get(goodsId);
      if (!goods || goods.version !== version) {
        throw new GameError(5, 'ActShop activity ' + actId + ' references unknown goods_id ' + goodsId);
      }
      positive(row.goods_tid, 'ActShop ' + actId + ' goods_tid');
      positive(row.count, 'ActShop ' + actId + ' goods count');
      nonNegative(row.times, 'ActShop ' + actId + ' goods times');
    }
    const levelIds = new Set((actShopTables?.multiLevelByVersion?.get(version) ?? []).map(row => row.tid));
    if (Number(state.history_tid) !== 0 && !levelIds.has(Number(state.history_tid))) {
      throw new GameError(5, 'ActShop activity ' + actId + ' has an out-of-version history_tid');
    }
    for (const value of state.claimed_tid_list) {
      const levelId = positive(value, 'ActShop ' + actId + ' claimed level tid');
      if (!levelIds.has(levelId)) {
        throw new GameError(5, 'ActShop activity ' + actId + ' has an out-of-version claimed level ' + levelId);
      }
    }
    return state;
  }

  function encodeState(entry, state) {
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_act_shop_db_info', state)).toString('base64');
  }

  function ensureEntry(activity, frame, created) {
    let entry = frame.entry;
    if (!entry) {
      entry = { state_data: { act_id: frame.actId }, module_login_data: '' };
      activity.act_list.push(entry);
      created.push(frame.actId);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = frame.actId;
    const state = decodeState(entry, frame.actId, frame.version);
    encodeState(entry, state);
    return state;
  }

  // ActShopData._ParseDataImpl decodes pb_act_shop_db_info from each running
  // frame's module_login_data. The login snapshot used by this server has no
  // shop rows, so create an empty player state for every open, configured frame
  // while preserving any existing purchases, history and level claims.
  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    activity.act_list ??= [];
    const created = [];
    const activityIds = [];
    const missingConfiguration = [];
    for (const frame of runningFrames(activity, at)) {
      const config = configuration(frame.version);
      if (!config.complete) {
        missingConfiguration.push({ actId: frame.actId, version: frame.version });
        continue;
      }
      ensureEntry(activity, frame, created);
      activityIds.push(frame.actId);
    }
    return { activityIds, created, missingConfiguration };
  }

  function readActivityFrom(modules) {
    const module = modules.get(ACT_SHOP_MODULE_ID);
    if (!module) throw new GameError(5, 'Activity login data is unavailable');
    try {
      return codec.unpack('pb_act_login', rawBinary(module));
    } catch {
      throw new GameError(5, 'Activity login data is invalid');
    }
  }

  function shopInfo(version) {
    const requestedVersion = Number(version);
    if (!Number.isSafeInteger(requestedVersion) || requestedVersion <= 0) {
      throw new GameError(1, 'Invalid ActShop version');
    }
    const at = currentSeconds();
    const result = store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const activity = readActivityFrom(modules);
      activity.act_list ??= [];
      const frames = runningFrames(activity, at).filter(frame => frame.version === requestedVersion);
      if (!frames.length) return { shopList: [], isActOpen: false, activityIds: [], created: [] };
      for (const frame of frames) {
        const config = configuration(frame.version);
        if (!config.complete) {
          throw new GameError(5, 'ActShop activity ' + frame.actId + ' version ' + frame.version + ' has no complete ActShopTable configuration');
        }
      }
      const created = [];
      const shopList = frames.map(frame => ensureEntry(activity, frame, created));
      if (created.length) {
        const packed = codec.pack('pb_act_login', activity);
        modules.set(ACT_SHOP_MODULE_ID, serializedBinary(packed));
        model.state.modules.value = [...modules];
      }
      return { shopList, isActOpen: true, activityIds: frames.map(frame => frame.actId), created };
    });
    if (result.created.length) {
      log({ event: 'act_shop_login_state_created_on_read', activityIds: result.created });
    }
    return {
      value: {
        version: requestedVersion,
        isActOpen: result.isActOpen,
        activityIds: result.activityIds,
        shops: result.shopList.length,
        created: result.created
      },
      data: codec.pack('pb_act_shop_info_rsp', {
        shop_list: result.shopList,
        is_act_open: result.isActOpen
      })
    };
  }

  return {
    supports: type => Number(type) === ACT_SHOP_READ_COMMAND,
    command: ACT_SHOP_READ_COMMAND,
    synchronizeLogin,
    shopInfo,
    execute(type, input) {
      if (Number(type) !== ACT_SHOP_READ_COMMAND) throw new GameError(1, 'Unsupported ActShop command');
      return shopInfo(input?.version);
    }
  };
}
