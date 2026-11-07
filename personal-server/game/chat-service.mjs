import { GameError } from './hero-progression.mjs';
import { CHANNEL_TYPES, channelIdFor, readMessageTables } from '../config/message-tables.mjs';
import { readChatTables } from '../config/chat-tables.mjs';
import { E, decodeEtf, encodeEtfInteger } from '../protocol/game-codec.mjs';

// ChatCmd 11000-11014 (see agent/workflow/gameplay-completion/SOC-CHAT).
//
// Request encodings come from ChatCmd.lua:
//   * 11000 req_send_chat_msg_to_world, 11001 ..._to_guild and
//     11003 req_send_multi_server_msg carry protobuf pb_chat_msg_content.
//   * 11002 req_send_chat_msg_to_role carries pb_req_send_msg_to_role.
//   * 11006 req_cancel_ban, 11010 req_change_chat_setting,
//     11012 req_remove_private_target and 11013 req_chat_report are ETF
//     because ChatCmd wraps them in Codec.EncodeErl.
//   * 11008 req_banned_self carries pb_req_ban_self.
//   * 11014 req_chat_msg_like carries pb_msg_like_req and answers
//     pb_msg_like_rsp.
// The 1.55.090365 client build only calls 11006/11008/11010/11012/11013/11014
// from ChatMgr/ChatTopUpMsgMgr; 11000-11003 have no call site in the bundle and
// retain their ChatCmd encodings for older revisions.
export const CHAT_COMMANDS = Object.freeze({
  sendWorld: 11000,
  sendGuild: 11001,
  sendRole: 11002,
  sendMultiServer: 11003,
  cancelBan: 11006,
  bannedSelf: 11008,
  changeSetting: 11010,
  removePrivateTarget: 11012,
  chatReport: 11013,
  msgLike: 11014
});

// Local reply codes. The client MsgErr numeric contract was not recovered, so
// these numbers are this server's explicit contract and are documented as a
// local extension instead of being presented as captured server codes.
export const CHAT_CODES = Object.freeze({
  invalid: 1,
  unavailable: 5,
  duplicate: 6,
  limit: 7,
  notMember: 8,
  targetMissing: 9
});

export const CHAT_PUSH_TYPES = Object.freeze({ newMessage: 1400 });

const MAX_TEXT_CODE_POINTS = 2000;
const MAX_REPORT_REASON_CODE_POINTS = 100;

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
CREATE TABLE IF NOT EXISTS chat_settings (
  role_id INTEGER PRIMARY KEY,
  settings_blob BLOB NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  target_role_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  created_seconds INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_reports_role_target_idx
  ON chat_reports(role_id,target_role_id,created_seconds);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function isoString(milliseconds) {
  return new Date(milliseconds).toISOString();
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CHAT_CODES.invalid, 'Invalid ' + label);
  return number;
}

function codePointLength(text) {
  return [...text].length;
}

function etfList(value) {
  // Erlang.js encodes a JS array as SMALL_TUPLE_EXT and decodes tuples back to
  // plain arrays; OtpErlangList is accepted for clients that send real lists.
  if (Array.isArray(value)) return value;
  if (value instanceof E.OtpErlangList) {
    if (value.improper !== false) return null;
    return value.value;
  }
  return null;
}

function scalarText(value) {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value instanceof E.OtpErlangBinary) return Buffer.from(value.value?.data ?? value.value).toString('utf8');
  return null;
}

export function createChatService({
  store,
  codec,
  messageTables = readMessageTables(),
  chatTables = readChatTables(),
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect || !store?.read) throw new Error('Chat store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  const ensureTables = db => db.exec(SCHEMA);
  store.inspect(ensureTables);

  const param = chatTables.param;
  const reportConst = chatTables.report;
  // ChatTable.MsgType ships one row (tid=1, ChatMsg); 0 is the protobuf default
  // used by plain text. Any other value is rejected until its renderer and
  // server payload are recovered.
  const allowedMessageTypes = new Set([0, 1]);

  function clockMilliseconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(CHAT_CODES.unavailable, 'Chat clock is invalid');
    return Math.floor(value);
  }

  function actorOf(model) {
    const roleId = Number(model.state.roleId);
    const serverId = Number(model.state.serverId ?? 0);
    if (!Number.isSafeInteger(roleId) || roleId <= 0) fail(CHAT_CODES.unavailable, 'Chat actor role is unavailable');
    return { roleId, serverId, role: model.role ?? {} };
  }

  function roleExists(db, roleId) {
    return Boolean(db.prepare('SELECT 1 AS hit FROM roles WHERE role_id=?').get(roleId));
  }

  function isMember(db, roleId, channelId) {
    return Boolean(db.prepare('SELECT 1 AS hit FROM message_members WHERE role_id=? AND channel_id=?').get(roleId, channelId));
  }

  function ensureChannel(db, channelId, type, targetId, stamp) {
    db.prepare(`
      INSERT INTO message_channels (channel_id,channel_type,target_id,extra_blob,created_at)
      VALUES (?,?,?,?,?) ON CONFLICT(channel_id) DO NOTHING
    `).run(channelId, type, targetId, null, stamp);
  }

  function nextIndex(db, channelId) {
    const row = db.prepare('SELECT COALESCE(MAX(idx),0) AS maxIdx FROM message_history WHERE channel_id=?').get(channelId);
    return Number(row?.maxIdx ?? 0) + 1;
  }

  function appendMessage(db, channelId, sender, seconds, type, content) {
    const idx = nextIndex(db, channelId);
    db.prepare(`
      INSERT INTO message_history (channel_id,idx,sender,time,type,content,extra,created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(channelId, idx, sender, seconds, type, content, null, isoString(seconds * 1000));
    return idx;
  }

  function validateContent(content) {
    if (!content || typeof content !== 'object') fail(CHAT_CODES.invalid, 'Chat message content is required');
    const text = typeof content.text_content === 'string' ? content.text_content : '';
    if (text.trim().length === 0) fail(CHAT_CODES.invalid, 'Chat message text is empty');
    if (codePointLength(text) > param.chat_word_count_limit || codePointLength(text) > MAX_TEXT_CODE_POINTS) {
      fail(CHAT_CODES.invalid, 'Chat message text is too long');
    }
    const type = Number(content.msg_type ?? 0);
    if (!allowedMessageTypes.has(type)) fail(CHAT_CODES.invalid, 'Unsupported chat message type');
    return { text, type };
  }

  function contentBytes(content) {
    return codec.pack('pb_chat_msg_content', {
      text_content: content.text_content ?? '',
      link_params: Array.isArray(content.link_params) ? content.link_params : [],
      share_param: content.share_param,
      msg_type: Number(content.msg_type ?? 0),
      be_reply_content: content.be_reply_content ?? ''
    });
  }

  function pushFor(channelId, actorRoleId, seconds, idx, type, content, extraBin) {
    return codec.pack('pb_res_new_msg', {
      channel_id: String(channelId),
      msg: { sender: String(actorRoleId), time: seconds, idx, content, type },
      sender_bin: Buffer.alloc(0),
      extra_bin: extraBin ?? undefined
    });
  }

  function sendToChannel({ channelId, type, targetId, content, extraBin }) {
    const milliseconds = clockMilliseconds();
    const seconds = Math.floor(milliseconds / 1000);
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      if (type === CHANNEL_TYPES.private) {
        if (!roleExists(db, targetId)) fail(CHAT_CODES.targetMissing, 'Private chat target does not exist');
        if (targetId === actor.roleId) fail(CHAT_CODES.invalid, 'Private chat target must be another role');
      }
      if (!isMember(db, actor.roleId, channelId)) fail(CHAT_CODES.notMember, 'Chat channel is not joined');
      ensureChannel(db, channelId, type, targetId, isoString(milliseconds));
      const idx = appendMessage(db, channelId, actor.roleId, seconds, content.type, content.bytes);
      const data = pushFor(channelId, actor.roleId, seconds, idx, content.type, content.bytes, extraBin);
      log({ event: 'chat_message_sent', roleId: actor.roleId, channelId, type, idx, msgType: content.type, bytes: content.bytes.length });
      return {
        data: Buffer.alloc(0),
        pushes: [{ type: CHAT_PUSH_TYPES.newMessage, data }],
        value: { roleId: actor.roleId, channelId, idx, msgType: content.type }
      };
    });
  }

  function worldChannelId(actor) {
    if (!Number.isSafeInteger(actor.serverId) || actor.serverId < 0) fail(CHAT_CODES.unavailable, 'World chat server id is unavailable');
    const channelId = channelIdFor(CHANNEL_TYPES.world, actor.serverId);
    if (!channelId) fail(CHAT_CODES.unavailable, 'World chat channel is unavailable');
    return channelId;
  }

  function sendWorld(bytes) {
    if (!bytes?.length) fail(CHAT_CODES.invalid, 'World chat payload is empty');
    let content;
    try {
      content = codec.unpack('pb_chat_msg_content', bytes);
    } catch {
      fail(CHAT_CODES.invalid, 'Invalid world chat payload');
    }
    const validated = validateContent(content);
    const model = store.read();
    const actor = actorOf(model);
    const channelId = worldChannelId(actor);
    return sendToChannel({
      channelId,
      type: CHANNEL_TYPES.world,
      targetId: actor.serverId,
      content: { ...validated, bytes: contentBytes(content) }
    });
  }

  function sendRole(bytes) {
    if (!bytes?.length) fail(CHAT_CODES.invalid, 'Private chat payload is empty');
    let request;
    try {
      request = codec.unpack('pb_req_send_msg_to_role', bytes);
    } catch {
      fail(CHAT_CODES.invalid, 'Invalid private chat payload');
    }
    const targetRoleId = positiveInteger(request.target_role_id, 'private chat target');
    const validated = validateContent(request.content);
    const channelId = channelIdFor(CHANNEL_TYPES.private, targetRoleId);
    if (!channelId) fail(CHAT_CODES.invalid, 'Invalid private chat target');
    const content = { ...validated, bytes: contentBytes(request.content) };
    return sendToChannel({
      channelId,
      type: CHANNEL_TYPES.private,
      targetId: targetRoleId,
      content,
      extraBin: encodeEtfInteger(store.read().state.roleId)
    });
  }

  async function decodeRequest(bytes, label) {
    if (!bytes?.length) fail(CHAT_CODES.invalid, label + ' payload is empty');
    try {
      return { value: await decodeEtf(bytes) };
    } catch {
      fail(CHAT_CODES.invalid, 'Invalid ' + label + ' ETF payload');
    }
  }

  async function removePrivateTarget(bytes) {
    const decoded = await decodeRequest(bytes, 'remove private target');
    let target = decoded.value;
    const list = etfList(target);
    if (list && list.length === 1) [target] = list;
    const targetRoleId = positiveInteger(target, 'private chat target');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      if (targetRoleId === actor.roleId) fail(CHAT_CODES.invalid, 'Private chat target must be another role');
      if (!roleExists(db, targetRoleId)) fail(CHAT_CODES.targetMissing, 'Private chat target does not exist');
      const channelId = channelIdFor(CHANNEL_TYPES.private, targetRoleId);
      const removed = db.prepare('DELETE FROM message_members WHERE role_id=? AND channel_id=?').run(actor.roleId, channelId).changes;
      log({ event: 'chat_private_target_removed', roleId: actor.roleId, targetRoleId, channelId, removed: Number(removed) });
      return { data: Buffer.alloc(0), value: { roleId: actor.roleId, targetRoleId, removed: Number(removed) } };
    });
  }

  async function changeSetting(bytes) {
    const decoded = await decodeRequest(bytes, 'chat setting');
    const value = decoded.value;
    const list = etfList(value);
    const isBinary = value instanceof E.OtpErlangBinary;
    const isInteger = typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
    const isBitBlock = list !== null && list.length > 0 && list.every(entry => typeof entry === 'number' && Number.isSafeInteger(entry) && entry >= 0);
    if (!isBinary && !isInteger && !isBitBlock) {
      // ChatCmd only proves EncodeErl; the concrete tips_setting shape has no
      // call site in 1.55.090365. Accept the BitBlock-compatible shapes above
      // and reject everything else instead of inventing a record layout.
      fail(CHAT_CODES.unavailable, 'Chat setting payload shape is not recovered');
    }
    const milliseconds = clockMilliseconds();
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      db.prepare(`
        INSERT INTO chat_settings (role_id,settings_blob,updated_at) VALUES (?,?,?)
        ON CONFLICT(role_id) DO UPDATE SET settings_blob=excluded.settings_blob, updated_at=excluded.updated_at
      `).run(actor.roleId, bytes, isoString(milliseconds));
      log({ event: 'chat_setting_saved', roleId: actor.roleId, bytes: bytes.length });
      return { data: Buffer.alloc(0), value: { roleId: actor.roleId, bytes: bytes.length } };
    });
  }

  async function chatReport(bytes) {
    const decoded = await decodeRequest(bytes, 'chat report');
    const value = decoded.value;
    const list = etfList(value);
    if (!list || list.length !== 3) fail(CHAT_CODES.unavailable, 'Chat report ETF shape is not recovered');
    const targetRoleId = positiveInteger(list[0], 'chat report target');
    const reason = scalarText(list[1]);
    const content = scalarText(list[2]);
    if (reason === null || content === null) fail(CHAT_CODES.unavailable, 'Chat report ETF values are not recovered');
    if (codePointLength(reason) > MAX_REPORT_REASON_CODE_POINTS || codePointLength(content) > param.chat_word_count_limit) {
      fail(CHAT_CODES.invalid, 'Chat report text is too long');
    }
    const milliseconds = clockMilliseconds();
    const seconds = Math.floor(milliseconds / 1000);
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      if (targetRoleId === actor.roleId) fail(CHAT_CODES.invalid, 'Cannot report self');
      if (!roleExists(db, targetRoleId)) fail(CHAT_CODES.targetMissing, 'Reported role does not exist');
      const duplicate = db.prepare(`
        SELECT 1 AS hit FROM chat_reports WHERE role_id=? AND target_role_id=? AND created_seconds>?
      `).get(actor.roleId, targetRoleId, seconds - reportConst.report_msg_valid_time);
      if (duplicate) fail(CHAT_CODES.duplicate, 'Role already reported in the valid window');
      const daily = db.prepare('SELECT COUNT(*) AS count FROM chat_reports WHERE role_id=? AND created_seconds>?').get(actor.roleId, seconds - 86400);
      if (Number(daily.count) >= reportConst.day_times) fail(CHAT_CODES.limit, 'Daily chat report limit reached');
      db.prepare(`
        INSERT INTO chat_reports (role_id,target_role_id,reason,content,created_seconds,created_at)
        VALUES (?,?,?,?,?,?)
      `).run(actor.roleId, targetRoleId, reason, content, seconds, isoString(milliseconds));
      const reported = db.prepare(`
        SELECT DISTINCT target_role_id FROM chat_reports WHERE role_id=? AND created_seconds>? ORDER BY target_role_id
      `).all(actor.roleId, seconds - reportConst.report_msg_valid_time).map(row => String(row.target_role_id));
      const data = codec.pack('pb_role_chat_report', { time_stamp: String(seconds), reported });
      log({ event: 'chat_report_recorded', roleId: actor.roleId, targetRoleId, reported: reported.length });
      return { data, value: { roleId: actor.roleId, targetRoleId, reported: reported.length } };
    });
  }

  function settingsPayload() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const row = db.prepare('SELECT settings_blob FROM chat_settings WHERE role_id=?').get(actor.roleId);
      const tipsSetting = row ? Buffer.from(row.settings_blob) : Buffer.alloc(0);
      return codec.pack('pb_res_chat_login', {
        ban_state: { is_banned: false, auto_cancel_time: '0', is_all_banned: false, cancel_all_banned_time: '0', proof_list: [] },
        cancel_ban_time: 0,
        tips_setting: tipsSetting
      });
    });
  }

  function settingsOf(roleId = null) {
    return store.inspect(db => {
      ensureTables(db);
      const id = roleId ?? store.read().state.roleId;
      const row = db.prepare('SELECT settings_blob FROM chat_settings WHERE role_id=?').get(id);
      return row ? Buffer.from(row.settings_blob) : null;
    });
  }

  async function execute(type, bytes) {
    switch (Number(type)) {
      case CHAT_COMMANDS.sendWorld: return sendWorld(bytes);
      case CHAT_COMMANDS.sendGuild: fail(CHAT_CODES.unavailable, 'Guild chat requires guild authority');
      case CHAT_COMMANDS.sendRole: return sendRole(bytes);
      case CHAT_COMMANDS.sendMultiServer: fail(CHAT_CODES.unavailable, 'Multi-server chat aggregation is not recovered');
      case CHAT_COMMANDS.cancelBan: {
        const decoded = await decodeRequest(bytes, 'cancel ban');
        const list = etfList(decoded.value);
        if (!(list && list.length === 0) && decoded.value != null) fail(CHAT_CODES.invalid, 'Cancel ban takes no parameters');
        fail(CHAT_CODES.unavailable, 'Ban state is not tracked by the local server');
      }
      case CHAT_COMMANDS.bannedSelf:
        try { codec.unpack('pb_req_ban_self', bytes); } catch { fail(CHAT_CODES.invalid, 'Invalid ban proof payload'); }
        fail(CHAT_CODES.unavailable, 'Automatic ban policy is not recovered');
      case CHAT_COMMANDS.changeSetting: return changeSetting(bytes);
      case CHAT_COMMANDS.removePrivateTarget: return removePrivateTarget(bytes);
      case CHAT_COMMANDS.chatReport: return chatReport(bytes);
      case CHAT_COMMANDS.msgLike:
        try { codec.unpack('pb_msg_like_req', bytes ?? Buffer.alloc(0)); } catch { fail(CHAT_CODES.invalid, 'Invalid message-like payload'); }
        fail(CHAT_CODES.unavailable, 'Message-like award rules are not recovered');
      default: fail(CHAT_CODES.invalid, 'Unknown chat command');
    }
  }

  return {
    supports: type => Object.values(CHAT_COMMANDS).includes(Number(type)),
    isProtobufRequest: type => [
      CHAT_COMMANDS.sendWorld, CHAT_COMMANDS.sendGuild, CHAT_COMMANDS.sendRole,
      CHAT_COMMANDS.sendMultiServer, CHAT_COMMANDS.bannedSelf, CHAT_COMMANDS.msgLike
    ].includes(Number(type)),
    execute,
    settingsPayload,
    settingsOf,
    commands: CHAT_COMMANDS,
    codes: CHAT_CODES,
    messageTables,
    chatTables
  };
}
