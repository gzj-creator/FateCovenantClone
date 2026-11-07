import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

export const RELIC_ACTIVITY_LOGIN_MODULE_ID = 183;

const fail = (message) => { throw new GameError(5, message); };

function bytesField(value, field) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') {
    const decoded = Buffer.from(value, 'base64');
    if (decoded.toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) {
      fail('Invalid ' + field + ' base64 data');
    }
    return decoded;
  }
  if (value == null) return Buffer.alloc(0);
  if (value?.value instanceof Uint8Array) return Buffer.from(value.value);
  if (value?.data instanceof Uint8Array) return Buffer.from(value.data);
  fail('Invalid ' + field + ' bytes');
}

/** The client stores each nested protobuf as an ETF BINARY_EXT record. */
export function encodeModuleLoginBlock(data) {
  if (!Buffer.isBuffer(data) || data.length > 0xffffffff) {
    fail('Invalid module-183 protobuf block');
  }
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(data.length, 2);
  return Buffer.concat([header, data]);
}

/** Splits one activity's concatenated ETF BINARY_EXT records without guessing. */
export function decodeModuleLoginBlocks(value, field = 'module_login_data') {
  const bytes = bytesField(value, field);
  const blocks = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 6 > bytes.length || bytes[offset] !== 0x83 || bytes[offset + 1] !== 0x6d) {
      fail('Corrupt ' + field + ' ETF wrapper');
    }
    const length = bytes.readUInt32BE(offset + 2);
    const start = offset + 6;
    const end = start + length;
    if (end > bytes.length) fail('Corrupt ' + field + ' protobuf length');
    blocks.push(bytes.subarray(start, end));
    offset = end;
  }
  return blocks;
}

function moduleValues(entry) {
  if (entry == null) return [];
  if (!Array.isArray(entry.value) || entry.improper === true) {
    fail('Module 183 must be an ETF list of binary blocks');
  }
  return entry.value.map((value, index) => {
    try {
      return Buffer.from(rawBinary(value));
    } catch {
      fail('Module 183 value ' + index + ' is not an ETF binary');
    }
  });
}

function uniqueRows(rows, label) {
  const result = new Map();
  for (const row of rows ?? []) {
    const actTid = Number(row?.act_stage?.act_id ?? row?.act_id ?? row?.act_tid);
    if (!Number.isSafeInteger(actTid) || actTid < 1) fail('Invalid ' + label + ' activity id');
    if (result.has(actTid)) fail('Duplicate ' + label + ' activity ' + actTid);
    result.set(actTid, row);
  }
  return result;
}

function normalizeActivity(activity) {
  const actTid = Number(activity?.actTid);
  if (!Number.isSafeInteger(actTid) || actTid < 1) fail('Invalid module-183 activity id');
  const start = Number(activity.startTime);
  const end = Number(activity.endTime);
  if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(end) || end <= start) {
    fail('Invalid activity window for ' + actTid);
  }
  if (!Array.isArray(activity.blocks) || !activity.blocks.length) {
    fail('Activity ' + actTid + ' has no module-183 blocks');
  }
  const blocks = activity.blocks.map((value, index) => {
    const data = Buffer.isBuffer(value) ? value : value?.data;
    if (!Buffer.isBuffer(data)) {
      fail('Activity ' + actTid + ' module-183 block ' + index + ' is invalid');
    }
    return encodeModuleLoginBlock(data);
  });
  return { actTid, start, end, data: Buffer.concat(blocks) };
}

/**
 * Preserves every existing activity in module 183 and replaces only the exact
 * activities supplied by M4/M5. Entry 2 is pb_act_server_data, matching the
 * client's ActLogin parser; artifact server turn rows are service state and are
 * not part of this root. Extra module values are retained byte-for-byte.
 */
export function mergeRelicLoginContainer({ codec, entry = null, activities = [], normalize = null }) {
  if (!codec || typeof codec.pack !== 'function' || typeof codec.unpack !== 'function') {
    fail('Game codec is required for module 183');
  }
  const values = moduleValues(entry);
  while (values.length < 2) values.push(Buffer.alloc(0));
  let player;
  let server;
  try {
    player = values[0].length ? codec.unpack('pb_act_role_login', values[0]) : { data_list: [] };
    server = values[1].length ? codec.unpack('pb_act_server_data', values[1]) : { act_stage_list: [] };
  } catch {
    fail('Module 183 root payload cannot be decoded');
  }
  player.data_list ??= [];
  server.act_stage_list ??= [];
  if (!Array.isArray(player.data_list) || !Array.isArray(server.act_stage_list)) {
    fail('Module 183 root payload has invalid repeated fields');
  }

  const playerByTid = uniqueRows(player.data_list, 'module-183 player');
  for (const row of player.data_list) {
    decodeModuleLoginBlocks(row.module_login_data);
  }
  const serverByTid = uniqueRows(server.act_stage_list, 'module-183 server');

  const incoming = new Map();
  for (const raw of activities) {
    const activity = normalizeActivity(raw);
    if (incoming.has(activity.actTid)) fail('Duplicate incoming module-183 activity ' + activity.actTid);
    incoming.set(activity.actTid, activity);
  }

  for (const activity of incoming.values()) {
    const existing = playerByTid.get(activity.actTid);
    const existingServer = serverByTid.get(activity.actTid);
    const row = {
      act_stage: {
        history_time: Array.isArray(existing?.act_stage?.history_time) ? existing.act_stage.history_time : [],
        act_id: activity.actTid,
        start_time: String(activity.start),
        end_time: String(activity.end),
        cur_stage_id: 50
      },
      module_login_data: activity.data
    };
    if (existing) Object.assign(existing, row);
    else {
      player.data_list.push(row);
      playerByTid.set(activity.actTid, row);
    }
    const serverRow = existingServer ?? {
      act_id: activity.actTid,
      type: 0,
      start_time: '',
      end_time: '',
      cur_stage_id: 50,
      is_pause: false,
      ignore_fix_time: false,
      loop_count: 0,
      stage_time_list: []
    };
    Object.assign(serverRow, {
      act_id: activity.actTid,
      start_time: String(activity.start),
      end_time: String(activity.end),
      cur_stage_id: 50,
      is_pause: false,
      loop_count: 0,
      stage_time_list: [{
        stage_id: 50,
        start_time: String(activity.start),
        end_time: String(activity.end)
      }]
    });
    if (existingServer) Object.assign(existingServer, serverRow);
    else {
      server.act_stage_list.push(serverRow);
      serverByTid.set(activity.actTid, serverRow);
    }
  }

  const normalization = typeof normalize === 'function'
    ? normalize({ player, server, playerByTid, serverByTid })
    : null;

  let playerData;
  let serverData;
  try {
    playerData = codec.pack('pb_act_role_login', player);
    serverData = codec.pack('pb_act_server_data', server);
  } catch {
    fail('Module 183 payload cannot be encoded');
  }
  values[0] = playerData;
  values[1] = serverData;
  return {
    values: values.map(serializedBinary),
    player,
    server,
    normalization,
    activities: new Set(incoming.keys())
  };
}
