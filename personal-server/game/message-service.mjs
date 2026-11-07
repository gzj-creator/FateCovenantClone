import { GameError } from './hero-progression.mjs';
import { readMessageTables, CHANNEL_TYPES, channelTargetOf, channelTypeOf } from '../config/message-tables.mjs';
import { encodeEtfInteger } from '../protocol/game-codec.mjs';

// MsgCmd 10501-10511 (see agent/workflow/gameplay-completion/SOC-MSG).
//
// Request encodings are split by command:
//   * 10501 req_send_msg and 10510 req_log_send_msg carry protobuf
//     pb_req_send_msg (channel_id/content_bin/extra_param).
//   * Every other request is ETF, encoded by MsgCmd through
//     Connection.EncodeErl.
// Responses reuse the reply sequence of the request:
//   * 10502/10506/10507 answer pb_msg_range_list_with_role_info.
//   * 10504 answers pb_msg_role_info and 10505 answers pb_msg_role_info_list.
//   * 10503 is confirmed empty by eight captured request/response pairs
//     (protocol-2026-10-25 and -r2a, codec=empty, dataBytes=0).
//   * 10508 is the server-initiated login container payload (pb_res_msg_login).
export const MESSAGE_COMMANDS = Object.freeze({
  send: 10501,
  enter: 10502,
  leave: 10503,
  roleInfo: 10504,
  roleInfoList: 10505,
  range: 10506,
  getChannelIdAndEnter: 10507,
  login: 10508,
  crossData: 10509,
  logSend: 10510,
  tipsLookPlayer: 10511
});

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;

// Local transport guard. ChatMgr.MAX_MSG_COUNT = ChatTable.Param.max_msg_count
// (ChatMgr prototype 92, source line 0 -> TSETS pc 27), but the Param row has
// not been recovered from ChatTable.data.lua and no runtime value is observed,
// so the server bounds a single reply instead of claiming the client limit.
const MAX_REPLY_MESSAGES = 200;
const MAX_ROLE_IDS = 200;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS message_channels (
  channel_id INTEGER PRIMARY KEY,
  channel_type INTEGER NOT NULL CHECK(channel_type>0),
  target_id INTEGER NOT NULL,
  extra_blob BLOB,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS message_members (
  role_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  joined_at TEXT NOT NULL,
  PRIMARY KEY(role_id,channel_id)
);
CREATE TABLE IF NOT EXISTS message_history (
  channel_id INTEGER NOT NULL,
  idx INTEGER NOT NULL CHECK(idx>0),
  sender INTEGER NOT NULL,
  time INTEGER NOT NULL,
  type INTEGER NOT NULL DEFAULT 0,
  content BLOB NOT NULL,
  extra BLOB,
  created_at TEXT NOT NULL,
  PRIMARY KEY(channel_id,idx)
);
CREATE INDEX IF NOT EXISTS message_history_channel_idx
  ON message_history(channel_id,idx);
CREATE TABLE IF NOT EXISTS message_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  time INTEGER NOT NULL,
  content BLOB NOT NULL,
  extra BLOB,
  created_at TEXT NOT NULL
);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function isoString(milliseconds) {
  return new Date(milliseconds).toISOString();
}

function toBuffer(value) {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') {
    // protobufjs returns bytes as base64 strings for unpack(); an empty string
    // is a genuinely empty payload.
    return Buffer.from(value, 'base64');
  }
  return null;
}

function integerOf(value, label) {
  if (Array.isArray(value) && value.length === 1) [value] = value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    value = value.channel_id ?? value.channelId ?? value.id ?? value.role_id ?? value.roleId ?? value.tid;
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, 'Invalid message ' + label);
  return number;
}

export function createMessageService({
  store,
  codec,
  tables = readMessageTables(),
  serverOpenedAt,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect || !store?.read) throw new Error('Message store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function clockMilliseconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(CODE_UNAVAILABLE, 'Message clock is invalid');
    return Math.floor(value);
  }

  function actorOf(model) {
    const roleId = Number(model.state.roleId);
    if (!Number.isSafeInteger(roleId) || roleId <= 0) fail(CODE_UNAVAILABLE, 'Message actor role is unavailable');
    return { roleId, serverId: Number(model.state.serverId ?? 0), role: model.role ?? {} };
  }

  const ensureTables = db => db.exec(SCHEMA);

  // ---- channel identity -------------------------------------------------
  // MsgChannel.StaticGetChannelType(channelId) and StaticFixedChannelId(type,id)
  // fix the wire id as (100+type)*100000+id; the client never sends an id that
  // omits the reserved 100 prefix.
  function resolveChannel(channelId, actor) {
    const value = Number(channelId);
    if (!Number.isSafeInteger(value) || value <= 0) fail(CODE_INVALID, 'Invalid message channel id');
    // StaticGetChannelType only reads the infix, so the server accepts any id
    // whose infix names a known channel type. The trailing slot is not
    // recovered for every channel type; ids it assigns itself always use
    // channelIdFor, which the client round-trips unchanged.
    const type = channelTypeOf(value);
    if (type == null || type <= 0) fail(CODE_INVALID, 'Invalid message channel id');
    const cfg = tables.get(type);
    if (!cfg) fail(CODE_UNAVAILABLE, 'Unsupported message channel type ' + type);
    if (cfg.is_cross) fail(CODE_UNAVAILABLE, 'Cross-server message channels are not implemented');
    return { channelId: value, type, targetId: channelTargetOf(value), cfg };
  }

  // 10507 assigns the channel id for a channel type. MsgCmd hands the type and
  // an extra ETF table to the server, which owns the id; only the ids whose
  // target is authoritative on this server are produced here.
  function channelForType(type, extra, actor) {
    const channelType = Number(type);
    const cfg = tables.get(channelType);
    if (!cfg) fail(CODE_UNAVAILABLE, 'Unsupported message channel type ' + channelType);
    if (cfg.is_cross) fail(CODE_UNAVAILABLE, 'Cross-server message channels are not implemented');
    if (channelType === CHANNEL_TYPES.world) {
      return resolveChannel(tables.channelIdFor(channelType, actor.serverId), actor);
    }
    if (channelType === CHANNEL_TYPES.system) {
      return resolveChannel(tables.channelIdFor(channelType, actor.roleId), actor);
    }
    if (channelType === CHANNEL_TYPES.private) {
      const targetId = privateTargetOf(extra);
      if (targetId === actor.roleId) fail(CODE_INVALID, 'Private channel target must be another role');
      return resolveChannel(tables.channelIdFor(channelType, targetId), actor);
    }
    fail(CODE_UNAVAILABLE, 'Channel type ' + channelType + ' is not available on the local server');
  }

  // PrivateChatChannel.ParseExtraData decodes the channel extra as ETF and keeps
  // the peer role id, so the local server accepts the same encoding shape.
  function privateTargetOf(extra) {
    let value = extra;
    if (value && typeof value === 'object' && !Array.isArray(value) && !Buffer.isBuffer(value)) {
      value = value.role_id ?? value.roleId ?? value.target_role_id ?? value.targetRoleId ?? value.id;
    }
    if (Array.isArray(value)) value = value[0];
    const target = Number(value);
    if (!Number.isSafeInteger(target) || target <= 0) fail(CODE_INVALID, 'Private channel target role is required');
    return target;
  }

  // ---- durable state ----------------------------------------------------
  function ensureChannel(db, channel, stamp, extra = null) {
    db.prepare(`
      INSERT INTO message_channels (channel_id,channel_type,target_id,extra_blob,created_at)
      VALUES (?,?,?,?,?)
      ON CONFLICT(channel_id) DO NOTHING
    `).run(channel.channelId, channel.type, channel.targetId, extra, stamp);
  }

  function join(db, roleId, channel, stamp) {
    db.prepare('INSERT OR IGNORE INTO message_members (role_id,channel_id,joined_at) VALUES (?,?,?)')
      .run(roleId, channel.channelId, stamp);
  }

  function leave(db, roleId, channelId) {
    db.prepare('DELETE FROM message_members WHERE role_id=? AND channel_id=?').run(roleId, channelId);
  }

  function isMember(db, roleId, channelId) {
    return Boolean(db.prepare('SELECT 1 AS hit FROM message_members WHERE role_id=? AND channel_id=?').get(roleId, channelId));
  }

  function extraBlobFor(db, channel) {
    const row = db.prepare('SELECT extra_blob FROM message_channels WHERE channel_id=?').get(channel.channelId);
    return toBuffer(row?.extra_blob);
  }

  // PrivateChatChannel.ParseExtraData decodes extra_data with Codec.DecodeErl
  // and keeps it as targetRoleId when it equals the local role id, so a private
  // channel answers with the recipient's own id encoded as an ETF integer.
  function extraDataFor(db, channel, actor) {
    if (channel.type !== CHANNEL_TYPES.private) return extraBlobFor(db, channel);
    return encodeEtfInteger(actor.roleId);
  }

  function messagesInRange(db, channelId, startIdx, endIdx, limit = MAX_REPLY_MESSAGES) {
    const rows = db.prepare(`
      SELECT idx,sender,time,type,content,extra FROM message_history
      WHERE channel_id=? AND idx>=? AND idx<=?
      ORDER BY idx ASC LIMIT ?
    `).all(channelId, startIdx, endIdx, limit);
    return rows.map(row => ({
      sender: String(row.sender),
      time: Number(row.time),
      idx: Number(row.idx),
      content: toBuffer(row.content) ?? Buffer.alloc(0),
      type: Number(row.type ?? 0)
    }));
  }

  function latestMessages(db, channelId, limit = MAX_REPLY_MESSAGES) {
    const rows = db.prepare(`
      SELECT idx,sender,time,type,content,extra FROM message_history
      WHERE channel_id=? ORDER BY idx DESC LIMIT ?
    `).all(channelId, limit);
    rows.reverse();
    return rows.map(row => ({
      sender: String(row.sender),
      time: Number(row.time),
      idx: Number(row.idx),
      content: toBuffer(row.content) ?? Buffer.alloc(0),
      type: Number(row.type ?? 0)
    }));
  }

  function maxIdxOf(db, channelId) {
    const row = db.prepare('SELECT COALESCE(MAX(idx),0) AS maxIdx FROM message_history WHERE channel_id=?').get(channelId);
    return Number(row?.maxIdx ?? 0);
  }

  function appendMessage(db, channelId, sender, milliseconds, content, type, extra) {
    const idx = maxIdxOf(db, channelId) + 1;
    db.prepare(`
      INSERT INTO message_history (channel_id,idx,sender,time,type,content,extra,created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(channelId, idx, sender, Math.floor(milliseconds / 1000), Number(type) || 0, content, extra, isoString(milliseconds));
    return idx;
  }

  // ---- role information -------------------------------------------------
  function profileOf(db, roleId, actor) {
    let profile = null;
    let serverId = actor.serverId;
    if (roleId === actor.roleId) {
      profile = actor.role;
    } else {
      const row = db.prepare('SELECT server_id,profile_json FROM roles WHERE role_id=?').get(roleId);
      if (!row) return null;
      serverId = Number(row.server_id ?? 0);
      try { profile = JSON.parse(row.profile_json ?? '{}'); } catch { profile = {}; }
    }
    const name = toBuffer(profile?.nick_name) ?? Buffer.alloc(0);
    return {
      role_id: String(roleId),
      player_info: {
        id: String(roleId),
        server_id: serverId,
        name,
        level: Number(profile?.level ?? 0),
        // vip/server_name/cross_stage/figure_simple_info are copied when the
        // local save carries them; protobuf defaults cover the rest.
        figure_simple_info: profile?.figure_simple_info ?? undefined,
        vip: Number(profile?.vip ?? 0),
        is_robot: false,
        server_name: '',
        cross_stage: 0
      }
    };
  }

  function roleInfos(db, roleIds, actor) {
    const seen = new Set();
    const list = [];
    for (const roleId of roleIds) {
      if (seen.has(roleId)) continue;
      seen.add(roleId);
      const info = profileOf(db, roleId, actor);
      if (info) list.push(info);
    }
    return list;
  }

  function rangePayload(db, channel, messages, actor, extraData) {
    return {
      channel_id: String(channel.channelId),
      msg_list: messages,
      role_info_list: roleInfos(db, messages.map(message => Number(message.sender)), actor),
      extraData: extraData ?? undefined
    };
  }

  // ---- commands ---------------------------------------------------------
  function enterCommand(input) {
    const channelId = integerOf(input, 'channel id');
    const milliseconds = clockMilliseconds();
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const channel = resolveChannel(channelId, actor);
      const stamp = isoString(milliseconds);
      ensureChannel(db, channel, stamp);
      join(db, actor.roleId, channel, stamp);
      const messages = latestMessages(db, channel.channelId);
      const data = codec.pack('pb_msg_range_list_with_role_info', rangePayload(db, channel, messages, actor, extraDataFor(db, channel, actor)));
      log({ event: 'message_channel_entered', roleId: actor.roleId, channelId: channel.channelId, type: channel.type, messages: messages.length });
      return { data, value: { roleId: actor.roleId, channelId: channel.channelId, type: channel.type, messages: messages.length } };
    });
  }

  function leaveCommand(input) {
    const channelId = integerOf(input, 'channel id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      leave(db, actor.roleId, channelId);
      // Confirmed empty reply: eight captured 10503 pairs carry codec=empty.
      log({ event: 'message_channel_left', roleId: actor.roleId, channelId });
      return { data: Buffer.alloc(0), value: { roleId: actor.roleId, channelId } };
    });
  }

  function rangeCommand(input) {
    if (!Array.isArray(input) || input.length < 3) fail(CODE_INVALID, 'Message range expects channel, start and end index');
    const channelId = integerOf(input[0], 'channel id');
    const startIdx = Number(input[1]);
    const endIdx = Number(input[2]);
    if (!Number.isSafeInteger(startIdx) || !Number.isSafeInteger(endIdx) || startIdx < 0 || endIdx < startIdx) {
      fail(CODE_INVALID, 'Invalid message range');
    }
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const channel = resolveChannel(channelId, actor);
      const messages = messagesInRange(db, channel.channelId, Math.max(1, startIdx), endIdx);
      const data = codec.pack('pb_msg_range_list_with_role_info', rangePayload(db, channel, messages, actor, extraDataFor(db, channel, actor)));
      log({ event: 'message_range_read', roleId: actor.roleId, channelId: channel.channelId, startIdx, endIdx, messages: messages.length });
      return { data, value: { roleId: actor.roleId, channelId: channel.channelId, messages: messages.length } };
    });
  }

  function getChannelIdAndEnterCommand(input) {
    if (!Array.isArray(input) || input.length < 1) fail(CODE_INVALID, 'Channel request expects a channel type');
    const type = Number(input[0]);
    const extra = input.length > 1 ? input[1] : undefined;
    const milliseconds = clockMilliseconds();
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const channel = channelForType(type, extra, actor);
      const stamp = isoString(milliseconds);
      ensureChannel(db, channel, stamp);
      join(db, actor.roleId, channel, stamp);
      const messages = latestMessages(db, channel.channelId);
      const data = codec.pack('pb_msg_range_list_with_role_info', rangePayload(db, channel, messages, actor, extraDataFor(db, channel, actor)));
      log({ event: 'message_channel_joined', roleId: actor.roleId, channelId: channel.channelId, type: channel.type, messages: messages.length });
      return { data, value: { roleId: actor.roleId, channelId: channel.channelId, type: channel.type, messages: messages.length } };
    });
  }

  function roleInfoCommand(input) {
    const roleId = integerOf(input, 'role id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const info = profileOf(db, roleId, actor);
      if (!info) fail(CODE_UNAVAILABLE, 'Role ' + roleId + ' does not exist');
      const data = codec.pack('pb_msg_role_info', info);
      log({ event: 'message_role_info_sent', roleId: actor.roleId, target: roleId });
      return { data, value: { roleId, target: roleId } };
    });
  }

  function roleInfoListCommand(input) {
    const raw = Array.isArray(input) ? input : [input];
    if (!raw.length) fail(CODE_INVALID, 'Role info list payload is empty');
    if (raw.length > MAX_ROLE_IDS) fail(CODE_INVALID, 'Role info list payload is too large');
    const ids = raw.map(entry => integerOf(entry, 'role id'));
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const list = roleInfos(db, ids, actor);
      const data = codec.pack('pb_msg_role_info_list', { role_info_list: list });
      log({ event: 'message_role_info_list_sent', roleId: actor.roleId, requested: ids.length, found: list.length });
      return { data, value: { roleId: actor.roleId, requested: ids.length, found: list.length } };
    });
  }

  // 10501. The request is protobuf, the reply carries no dedicated response
  // schema, and the capture set never observed a manual chat send, so the
  // server persists the message and acknowledges with an empty payload. The new
  // message push (pb_res_new_msg exists in msg.net.proto) still needs its wire
  // type, which the catalog has not recovered.
  function sendCommand(bytes, { logOnly = false } = {}) {
    if (!bytes?.length) fail(CODE_INVALID, 'Message send payload is empty');
    let request;
    try {
      request = codec.unpack('pb_req_send_msg', bytes);
    } catch {
      fail(CODE_INVALID, 'Invalid message send payload');
    }
    const channelId = Number(request.channel_id);
    const content = toBuffer(request.content_bin);
    if (content == null || content.length === 0) fail(CODE_INVALID, 'Message content is required');
    const extra = toBuffer(request.extra_param);
    const milliseconds = clockMilliseconds();
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const channel = resolveChannel(channelId, actor);
      const stamp = isoString(milliseconds);
      ensureChannel(db, channel, stamp);
      join(db, actor.roleId, channel, stamp);
      if (logOnly) {
        db.prepare(`
          INSERT INTO message_logs (role_id,channel_id,time,content,extra,created_at)
          VALUES (?,?,?,?,?,?)
        `).run(actor.roleId, channel.channelId, Math.floor(milliseconds / 1000), content, extra, stamp);
        log({ event: 'message_log_recorded', roleId: actor.roleId, channelId: channel.channelId, bytes: content.length });
        return { data: Buffer.alloc(0), value: { roleId: actor.roleId, channelId: channel.channelId, logged: true } };
      }
      const idx = appendMessage(db, channel.channelId, actor.roleId, milliseconds, content, 0, extra);
      log({ event: 'message_sent', roleId: actor.roleId, channelId: channel.channelId, idx, bytes: content.length });
      return { data: Buffer.alloc(0), value: { roleId: actor.roleId, channelId: channel.channelId, idx } };
    });
  }

  function loginPayload() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const rows = db.prepare('SELECT channel_id FROM message_members WHERE role_id=? ORDER BY channel_id').all(actor.roleId);
      const channelMsgList = [];
      const senders = new Set();
      for (const row of rows) {
        const channelId = Number(row.channel_id);
        const messages = latestMessages(db, channelId);
        for (const message of messages) senders.add(Number(message.sender));
        const meta = db.prepare('SELECT channel_type,target_id FROM message_channels WHERE channel_id=?').get(channelId);
        const channel = { channelId, type: Number(meta?.channel_type ?? 0), targetId: Number(meta?.target_id ?? 0) };
        channelMsgList.push({
          channel_id: String(channelId),
          msg_list: messages,
          extra_data: extraDataFor(db, channel, actor) ?? undefined
        });
      }
      return codec.pack('pb_res_msg_login', {
        channel_msg_list: channelMsgList,
        role_info_list: roleInfos(db, [...senders], actor)
      });
    });
  }

  function execute(type, input) {
    switch (Number(type)) {
      case MESSAGE_COMMANDS.enter: return enterCommand(input);
      case MESSAGE_COMMANDS.leave: return leaveCommand(input);
      case MESSAGE_COMMANDS.roleInfo: return roleInfoCommand(input);
      case MESSAGE_COMMANDS.roleInfoList: return roleInfoListCommand(input);
      case MESSAGE_COMMANDS.range: return rangeCommand(input);
      case MESSAGE_COMMANDS.getChannelIdAndEnter: return getChannelIdAndEnterCommand(input);
      case MESSAGE_COMMANDS.crossData: return fail(CODE_UNAVAILABLE, 'Cross-server message data is not implemented');
      case MESSAGE_COMMANDS.tipsLookPlayer: return fail(CODE_UNAVAILABLE, 'req_tips_look_player semantics are not recovered');
      case MESSAGE_COMMANDS.send: return fail(CODE_INVALID, '10501 uses a protobuf payload');
      case MESSAGE_COMMANDS.logSend: return fail(CODE_INVALID, '10510 uses a protobuf payload');
      default: return fail(CODE_INVALID, 'Unknown message command');
    }
  }

  return {
    supports: type => Object.values(MESSAGE_COMMANDS).includes(Number(type)),
    isProtobufRequest: type => [MESSAGE_COMMANDS.send, MESSAGE_COMMANDS.logSend].includes(Number(type)),
    executeBinary(type, bytes) {
      if (Number(type) === MESSAGE_COMMANDS.send) return sendCommand(bytes);
      if (Number(type) === MESSAGE_COMMANDS.logSend) return sendCommand(bytes, { logOnly: true });
      return fail(CODE_INVALID, 'Unknown protobuf message command');
    },
    execute,
    loginPayload,
    commands: MESSAGE_COMMANDS,
    tables
  };
}
