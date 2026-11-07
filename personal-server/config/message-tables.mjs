import { readJsonAsset, tableAsset } from '../assets.mjs';

// MsgTable.ChannelType ships inside MsgTable.data.lua of client 1.55.090365 and
// is recovered read-only by tools/extract-msg-channel-table.mjs (see
// agent/workflow/gameplay-completion/SOC-MSG/implementation.md). The extracted
// asset keeps the columns the personal server interprets; the client
// lua_module/localisation columns are rendering data and stay out of the server
// configuration.
const defaultPath = tableAsset('MsgTable.ChannelType.json.gz');
let defaultCache;

const EXPECTED_COUNT = 17;

// MsgChannel.RESERVED_CHANNEL_TYPE = 100 (prototype 13, source line 50).
// MsgChannel.StaticFixedChannelId(type,id) builds
//   channelId = Uid.Compose(RESERVED_CHANNEL_TYPE + type, id)
//             = (100 + type) * 100000 + id
// because Uid.Compose(uid,serverId) = uid * 100000 + serverId.
export const RESERVED_CHANNEL_TYPE = 100;
export const CHANNEL_ID_MULTIPLIER = 100000;

export const CHANNEL_TYPES = Object.freeze({
  world: 1,
  guild: 2,
  private: 3,
  crossPrivate: 4,
  system: 5,
  cross: 15,
  battleCross: 16
});

function integer(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Invalid MsgTable.ChannelType ' + label);
  return number;
}

function boolean(value, label) {
  if (typeof value !== 'boolean') throw new Error('Invalid MsgTable.ChannelType ' + label);
  return value;
}

function readRow(row) {
  return Object.freeze({
    tid: integer(row.tid, 'tid'),
    forbid_msg_sync: boolean(row.forbid_msg_sync, 'forbid_msg_sync'),
    default_in_channel: boolean(row.default_in_channel, 'default_in_channel'),
    is_cross: boolean(row.is_cross, 'is_cross'),
    need_log: boolean(row.need_log, 'need_log'),
    is_chat: boolean(row.is_chat, 'is_chat'),
    word_leagle_source: integer(row.word_leagle_source, 'word_leagle_source')
  });
}

export function channelTypeOf(channelId) {
  // MsgChannel.StaticGetChannelType = Uid.ExtractInfix(channelId, RESERVED_CHANNEL_TYPE)
  // and Uid.ExtractInfix(uid,n) = floor(uid / 100000) % n.
  const value = Number(channelId);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return Math.floor(value / CHANNEL_ID_MULTIPLIER) % RESERVED_CHANNEL_TYPE;
}

export function channelIdFor(type, targetId) {
  const channelType = Number(type);
  const target = Number(targetId);
  if (!Number.isSafeInteger(channelType) || channelType <= 0 || channelType >= RESERVED_CHANNEL_TYPE) return null;
  if (!Number.isSafeInteger(target) || target < 0 || target >= CHANNEL_ID_MULTIPLIER) return null;
  return (RESERVED_CHANNEL_TYPE + channelType) * CHANNEL_ID_MULTIPLIER + target;
}

// A recomposed id only round-trips when the infix was written with the reserved
// prefix; this rejects free-form ids that merely happen to extract to the same
// type.
export function isCanonicalChannelId(channelId) {
  const value = Number(channelId);
  const type = channelTypeOf(value);
  if (type == null) return false;
  const target = value % CHANNEL_ID_MULTIPLIER;
  return channelIdFor(type, target) === value;
}

export function channelTargetOf(channelId) {
  const value = Number(channelId);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value % CHANNEL_ID_MULTIPLIER;
}

export function readMessageTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const asset = readJsonAsset(file);
  if (!Array.isArray(asset?.rows) || asset.rows.length !== EXPECTED_COUNT) {
    throw new Error('MsgTable.ChannelType has an unexpected row count');
  }
  const rows = asset.rows.map(readRow).sort((left, right) => left.tid - right.tid);
  const byType = new Map(rows.map((row) => [row.tid, row]));
  if (byType.size !== rows.length) throw new Error('MsgTable.ChannelType has duplicate tids');
  const tables = Object.freeze({
    source: Object.freeze({ ...(asset.source ? { file: asset.source } : {}), rows: rows.length }),
    channelTypes: Object.freeze(rows),
    byType,
    get(type) {
      return byType.get(Number(type)) ?? null;
    },
    channelTypeOf,
    channelIdFor,
    channelTargetOf,
    isCanonicalChannelId
  });
  if (file === defaultPath) defaultCache = tables;
  return tables;
}
