import { serverDayNumber } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';
import { binary, encodeEtf } from '../protocol/game-codec.mjs';
import { readFriendTables } from '../config/friend-tables.mjs';

// FriendCmd 20001-20013 (see agent/workflow/gameplay-completion/SOC-FRIEND).
// Requests are ETF; responses are the protobuf messages in
// personal-server/assets/protobuf/friend.net.proto.bin. Pushes 2200-2203 are
// declared by the static catalog; only 2201 and 2203 payload shapes are
// recovered (FriendMgr prototype 55 decodes 2203 as
// [pb_friendship, pb_friend_data] inside ETF).
export const FRIEND_COMMANDS = Object.freeze({
  apply: 20001,
  remove: 20002,
  agree: 20003,
  refuse: 20004,
  addBlacklist: 20005,
  removeBlacklist: 20006,
  present: 20007,
  receive: 20008,
  query: 20009,
  recommend: 20010,
  oneKeyPresentAndReceive: 20011,
  recommendTypes: 20012,
  saveReport: 20013
});

export const FRIEND_PUSH_TYPES = Object.freeze({
  append: 2200,
  reduce: 2201,
  applyAppend: 2202,
  friendshipChange: 2203
});

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const CODE_DUPLICATE = 310;
// FriendMgr.CONST_MAX_RECOMMEND_COUNT is hardcoded 10 and truncates the reply
// on the client (prototype 87). Param.recommend_count=5 has no recovered
// consumer, so it is reported in configuration but not used as a server cap.
const CONST_MAX_RECOMMEND_COUNT = 10;
const MAX_REQUEST_IDS = 200;

function fail(code, message) {
  throw new GameError(code, message);
}

function isoString(milliseconds) {
  return new Date(milliseconds).toISOString();
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS friend_links (
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  friend_role_id INTEGER NOT NULL REFERENCES roles(role_id),
  favors INTEGER NOT NULL DEFAULT 0 CHECK(favors>=0),
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id,friend_role_id),
  CHECK(role_id<>friend_role_id)
);
CREATE TABLE IF NOT EXISTS friend_applies (
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  applicant_role_id INTEGER NOT NULL REFERENCES roles(role_id),
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id,applicant_role_id),
  CHECK(role_id<>applicant_role_id)
);
CREATE TABLE IF NOT EXISTS friend_blacklist (
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  blocked_role_id INTEGER NOT NULL REFERENCES roles(role_id),
  created_at TEXT NOT NULL,
  PRIMARY KEY(role_id,blocked_role_id),
  CHECK(role_id<>blocked_role_id)
);
CREATE TABLE IF NOT EXISTS friend_friendship (
  role_id INTEGER PRIMARY KEY REFERENCES roles(role_id),
  day INTEGER NOT NULL CHECK(day>=0),
  flower INTEGER NOT NULL DEFAULT 0 CHECK(flower>=0),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS friend_gifts (
  day INTEGER NOT NULL CHECK(day>=0),
  giver_role_id INTEGER NOT NULL REFERENCES roles(role_id),
  receiver_role_id INTEGER NOT NULL REFERENCES roles(role_id),
  created_at TEXT NOT NULL,
  received_at TEXT,
  PRIMARY KEY(day,giver_role_id,receiver_role_id),
  CHECK(giver_role_id<>receiver_role_id)
);
CREATE INDEX IF NOT EXISTS friend_gifts_receiver_idx
  ON friend_gifts(receiver_role_id,day,received_at);
CREATE INDEX IF NOT EXISTS friend_applies_sender_idx
  ON friend_applies(applicant_role_id);
CREATE TABLE IF NOT EXISTS friend_reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  target_role_id INTEGER NOT NULL,
  day INTEGER NOT NULL CHECK(day>=0),
  arguments_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(role_id,day,arguments_json)
);
`;

function ensureTables(db) {
  db.exec(SCHEMA);
}

function roleIdOf(value, label) {
  let raw = value;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && !Buffer.isBuffer(raw)) {
    raw = raw.role_id ?? raw.roleId ?? raw.id ?? raw.tid;
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) fail(CODE_INVALID, 'Invalid friend ' + label + ' role id');
  return id;
}

function idList(input, label) {
  if (input == null) fail(CODE_INVALID, 'Friend ' + label + ' payload is required');
  const raw = Array.isArray(input) ? input : [input];
  if (!raw.length) fail(CODE_INVALID, 'Friend ' + label + ' payload is empty');
  if (raw.length > MAX_REQUEST_IDS) fail(CODE_INVALID, 'Friend ' + label + ' payload is too large');
  const ids = [];
  for (const entry of raw) {
    const id = roleIdOf(entry, label);
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function optionalIdList(input, label) {
  if (input == null) return [];
  if (Array.isArray(input) && input.length === 0) return [];
  return idList(input, label);
}

// ETF strings arrive either as text or as binary payloads depending on the
// client encoder, so the search path accepts both.
function textOf(value) {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  if (value && typeof value === 'object' && value.value instanceof Uint8Array) {
    return Buffer.from(value.value).toString('utf8');
  }
  if (value && typeof value === 'object' && value.value && Array.isArray(value.value.data)) {
    return Buffer.from(value.value.data).toString('utf8');
  }
  if (Array.isArray(value) && value.length && value.every(entry => Number.isInteger(entry) && entry >= 0 && entry <= 0x10ffff)) {
    return String.fromCodePoint(...value);
  }
  return null;
}

export function createFriendService({
  store,
  codec,
  tables = readFriendTables(),
  serverOpenedAt,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect || !store?.read) throw new Error('Friend store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => ensureTables(db));

  function clockMilliseconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(CODE_UNAVAILABLE, 'Friend clock is invalid');
    return Math.floor(value);
  }

  // FlushTime.NowDay is not recovered; this follows the repository server-day
  // convention used by login day_count and first-week-goal (serverDayNumber).
  function dayFor(milliseconds) {
    if (!Number(openedAt) || !Number.isFinite(Number(openedAt))) {
      fail(CODE_UNAVAILABLE, 'Friend server open time is unavailable');
    }
    const day = serverDayNumber(openedAt, milliseconds);
    if (!Number.isSafeInteger(day) || day < 0) fail(CODE_UNAVAILABLE, 'Friend server day is invalid');
    return day;
  }

  function actorOf(model) {
    const roleId = Number(model.state.roleId);
    if (!Number.isSafeInteger(roleId) || roleId <= 0) fail(CODE_UNAVAILABLE, 'Friend actor role is unavailable');
    return { roleId, level: Number(model.role?.level ?? 0) };
  }

  // Only roles present in the authoritative save are valid targets. The
  // production save currently has a single role, so cross-role targets are
  // rejected rather than synthesized.
  function roleIndex(db) {
    const index = new Map();
    for (const row of db.prepare('SELECT role_id, profile_json FROM roles ORDER BY role_id').all()) {
      let profile = {};
      try { profile = JSON.parse(row.profile_json ?? '{}'); } catch { profile = {}; }
      const nick = typeof profile.nick_name === 'string' ? Buffer.from(profile.nick_name, 'base64').toString('utf8') : '';
      index.set(Number(row.role_id), { roleId: Number(row.role_id), level: Number(profile.level ?? 0), name: nick });
    }
    return index;
  }

  const friendIds = (db, roleId) => db
    .prepare('SELECT friend_role_id FROM friend_links WHERE role_id=? ORDER BY friend_role_id').all(roleId)
    .map(row => Number(row.friend_role_id));
  const applyIds = (db, roleId) => db
    .prepare('SELECT applicant_role_id FROM friend_applies WHERE role_id=? ORDER BY applicant_role_id').all(roleId)
    .map(row => Number(row.applicant_role_id));
  const blacklistIds = (db, roleId) => db
    .prepare('SELECT blocked_role_id FROM friend_blacklist WHERE role_id=? ORDER BY blocked_role_id').all(roleId)
    .map(row => Number(row.blocked_role_id));
  const presentIds = (db, roleId, day) => db
    .prepare('SELECT receiver_role_id FROM friend_gifts WHERE giver_role_id=? AND day=? ORDER BY receiver_role_id').all(roleId, day)
    .map(row => Number(row.receiver_role_id));
  const toReceiveIds = (db, roleId, day) => db
    .prepare('SELECT giver_role_id FROM friend_gifts WHERE receiver_role_id=? AND day=? AND received_at IS NULL ORDER BY giver_role_id').all(roleId, day)
    .map(row => Number(row.giver_role_id));
  const receivedTodayIds = (db, roleId, day) => db
    .prepare('SELECT giver_role_id FROM friend_gifts WHERE receiver_role_id=? AND day=? AND received_at IS NOT NULL ORDER BY received_at, giver_role_id').all(roleId, day)
    .map(row => Number(row.giver_role_id));
  const receivedCount = (db, roleId, day) => Number(db
    .prepare('SELECT COUNT(*) AS count FROM friend_gifts WHERE receiver_role_id=? AND day=? AND received_at IS NOT NULL').get(roleId, day).count);
  const friendCount = (db, roleId) => Number(db
    .prepare('SELECT COUNT(*) AS count FROM friend_links WHERE role_id=?').get(roleId).count);
  const isFriend = (db, roleId, other) => Boolean(db
    .prepare('SELECT 1 AS hit FROM friend_links WHERE role_id=? AND friend_role_id=?').get(roleId, other));
  const isBlocked = (db, roleId, other) => Boolean(db
    .prepare('SELECT 1 AS hit FROM friend_blacklist WHERE role_id=? AND blocked_role_id=?').get(roleId, other));
  const hasApply = (db, roleId, applicant) => Boolean(db
    .prepare('SELECT 1 AS hit FROM friend_applies WHERE role_id=? AND applicant_role_id=?').get(roleId, applicant));
  const outgoingApplies = (db, roleId) => new Set(db
    .prepare('SELECT role_id FROM friend_applies WHERE applicant_role_id=?').all(roleId)
    .map(row => Number(row.role_id)));

  function favorsOf(db, roleId, other) {
    const row = db.prepare('SELECT favors FROM friend_links WHERE role_id=? AND friend_role_id=?').get(roleId, other);
    return Number(row?.favors ?? 0);
  }

  function flowerOf(db, roleId) {
    const row = db.prepare('SELECT flower FROM friend_friendship WHERE role_id=?').get(roleId);
    return String(row?.flower ?? 0);
  }

  function friendshipData(db, roleId, day) {
    return {
      day,
      present_today: presentIds(db, roleId, day).map(String),
      to_receive_today: toReceiveIds(db, roleId, day).map(String),
      received_count_today: receivedCount(db, roleId, day),
      received_today: receivedTodayIds(db, roleId, day).map(String),
      flower: flowerOf(db, roleId)
    };
  }

  function friendData(db, roleId) {
    return {
      friends: [],
      applies: applyIds(db, roleId).map(String),
      blacklist: blacklistIds(db, roleId).map(String),
      friend_list: friendIds(db, roleId).map(id => ({ id: String(id), favors: favorsOf(db, roleId, id) }))
    };
  }

  function touchFriendship(db, roleId, day, milliseconds) {
    db.prepare(`
      INSERT INTO friend_friendship (role_id,day,flower,updated_at) VALUES (?,?,0,?)
      ON CONFLICT(role_id) DO UPDATE SET day=excluded.day, updated_at=excluded.updated_at
    `).run(roleId, day, isoString(milliseconds));
  }

  function capacityOf(role) {
    return tables.limitForLevel(role?.level ?? 0).max_friend_count;
  }

  function linkFriends(db, left, right, roles, stamp) {
    for (const self of [left, right]) {
      if (friendCount(db, self) >= capacityOf(roles.get(self))) fail(CODE_UNAVAILABLE, 'Friend list is full');
    }
    db.prepare('INSERT OR IGNORE INTO friend_links VALUES (?,?,0,?)').run(left, right, stamp);
    db.prepare('INSERT OR IGNORE INTO friend_links VALUES (?,?,0,?)').run(right, left, stamp);
  }

  function dropApply(db, roleId, applicant) {
    db.prepare('DELETE FROM friend_applies WHERE (role_id=? AND applicant_role_id=?) OR (role_id=? AND applicant_role_id=?)')
      .run(roleId, applicant, applicant, roleId);
  }

  function applyCommand(input, milliseconds, day) {
    const ids = idList(input, 'apply');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const roles = roleIndex(db);
      const stamp = isoString(milliseconds);
      const friends = new Set(friendIds(db, actor.roleId));
      const blocked = new Set(blacklistIds(db, actor.roleId));
      const applied = [], newFriends = [], errors = [];
      let pendingOut = outgoingApplies(db, actor.roleId).size;
      for (const id of ids) {
        if (id === actor.roleId || !roles.has(id)) { errors.push(CODE_UNAVAILABLE); continue; }
        if (friends.has(id)) { errors.push(CODE_DUPLICATE); continue; }
        if (blocked.has(id) || isBlocked(db, id, actor.roleId)) { errors.push(CODE_UNAVAILABLE); continue; }
        if (applied.includes(id) || hasApply(db, id, actor.roleId)) { errors.push(CODE_DUPLICATE); continue; }
        if (hasApply(db, actor.roleId, id)) {
          // The target already applied to this role; applying back completes the pair.
          linkFriends(db, actor.roleId, id, roles, stamp);
          dropApply(db, actor.roleId, id);
          friends.add(id);
          newFriends.push(id);
          continue;
        }
        if (pendingOut >= tables.param.max_apply_count) { errors.push(CODE_UNAVAILABLE); continue; }
        db.prepare('INSERT INTO friend_applies VALUES (?,?,?)').run(id, actor.roleId, stamp);
        pendingOut += 1;
        applied.push(id);
      }
      touchFriendship(db, actor.roleId, day, milliseconds);
      const data = codec.pack('res_apply_friends', {
        friend_list: newFriends.map(String),
        err_list: errors
      });
      const pushes = [...applied, ...newFriends]
        .map(id => ({ pushType: newFriends.includes(id) ? FRIEND_PUSH_TYPES.append : FRIEND_PUSH_TYPES.applyAppend, roleId: id }));
      log({
        event: 'friend_apply_committed', roleId: actor.roleId,
        applied: applied.length, friends: newFriends.length, errors: errors.length
      });
      return { data, value: { applied: applied.length, friends: newFriends.length, errors: errors.length, pushes } };
    });
  }

  function removeCommand(input) {
    const ids = idList(input, 'remove');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      for (const id of ids) {
        if (!isFriend(db, actor.roleId, id)) fail(CODE_UNAVAILABLE, 'Role ' + id + ' is not a friend');
      }
      const stamp = isoString(clockMilliseconds());
      for (const id of ids) {
        db.prepare('DELETE FROM friend_links WHERE (role_id=? AND friend_role_id=?) OR (role_id=? AND friend_role_id=?)')
          .run(actor.roleId, id, id, actor.roleId);
        db.prepare('DELETE FROM friend_gifts WHERE giver_role_id IN (?,?) AND receiver_role_id IN (?,?) AND received_at IS NULL')
          .run(actor.roleId, id, actor.roleId, id);
      }
      log({ event: 'friend_remove_committed', roleId: actor.roleId, removed: ids.length, at: stamp });
      return {
        data: Buffer.alloc(0),
        value: { removed: ids.length, pushes: ids.map(id => ({ pushType: FRIEND_PUSH_TYPES.reduce, roleId: id })) }
      };
    });
  }

  function agreeCommand(input, milliseconds, day) {
    const ids = idList(input, 'agree');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const roles = roleIndex(db);
      const stamp = isoString(milliseconds);
      const success = [], errors = [];
      for (const id of ids) {
        if (id === actor.roleId || !roles.has(id) || !hasApply(db, actor.roleId, id)) {
          errors.push(CODE_UNAVAILABLE);
          continue;
        }
        if (isFriend(db, actor.roleId, id)) { errors.push(CODE_DUPLICATE); continue; }
        linkFriends(db, actor.roleId, id, roles, stamp);
        dropApply(db, actor.roleId, id);
        success.push(id);
      }
      touchFriendship(db, actor.roleId, day, milliseconds);
      const data = codec.pack('res_agree_applies', { success_list: success.map(String), err_list: errors });
      log({ event: 'friend_agree_committed', roleId: actor.roleId, success: success.length, errors: errors.length });
      return {
        data,
        value: {
          success: success.length,
          errors: errors.length,
          pushes: success.map(id => ({ pushType: FRIEND_PUSH_TYPES.append, roleId: id }))
        }
      };
    });
  }

  function refuseCommand(input) {
    const ids = idList(input, 'refuse');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      for (const id of ids) {
        if (!hasApply(db, actor.roleId, id)) fail(CODE_UNAVAILABLE, 'Friend application ' + id + ' does not exist');
      }
      for (const id of ids) {
        db.prepare('DELETE FROM friend_applies WHERE role_id=? AND applicant_role_id=?').run(actor.roleId, id);
      }
      log({ event: 'friend_refuse_committed', roleId: actor.roleId, refused: ids.length });
      return { data: Buffer.alloc(0), value: { refused: ids.length } };
    });
  }

  function blacklistAddCommand(input, milliseconds) {
    const ids = idList(input, 'blacklist');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const roles = roleIndex(db);
      const stamp = isoString(milliseconds);
      let count = blacklistIds(db, actor.roleId).length;
      for (const id of ids) {
        if (id === actor.roleId || !roles.has(id)) fail(CODE_UNAVAILABLE, 'Role ' + id + ' does not exist');
        if (isBlocked(db, actor.roleId, id)) fail(CODE_DUPLICATE, 'Role ' + id + ' is already in the blacklist');
        if (count >= tables.param.max_black_list_count) fail(CODE_UNAVAILABLE, 'Blacklist limit is reached');
        db.prepare('INSERT INTO friend_blacklist VALUES (?,?,?)').run(actor.roleId, id, stamp);
        count += 1;
      }
      log({ event: 'friend_blacklist_add_committed', roleId: actor.roleId, added: ids.length });
      return { data: Buffer.alloc(0), value: { added: ids.length, total: count } };
    });
  }

  function blacklistRemoveCommand(input) {
    const ids = idList(input, 'blacklist');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      for (const id of ids) {
        if (!isBlocked(db, actor.roleId, id)) fail(CODE_DUPLICATE, 'Role ' + id + ' is not in the blacklist');
      }
      for (const id of ids) {
        db.prepare('DELETE FROM friend_blacklist WHERE role_id=? AND blocked_role_id=?').run(actor.roleId, id);
      }
      log({ event: 'friend_blacklist_remove_committed', roleId: actor.roleId, removed: ids.length });
      return { data: Buffer.alloc(0), value: { removed: ids.length } };
    });
  }

  function presentCore(db, actor, day, ids, stamp) {
    const friends = new Set(friendIds(db, actor.roleId));
    const presented = new Set(presentIds(db, actor.roleId, day));
    let total = presented.size;
    const changed = [];
    for (const id of ids) {
      if (!friends.has(id)) fail(CODE_UNAVAILABLE, 'Role ' + id + ' is not a friend');
      if (presented.has(id)) fail(CODE_DUPLICATE, 'Role ' + id + ' was already presented today');
      if (total >= tables.param.max_present_friendship_count) {
        fail(CODE_UNAVAILABLE, 'Daily present friend limit is reached');
      }
      db.prepare('INSERT INTO friend_gifts VALUES (?,?,?,?,NULL)').run(day, actor.roleId, id, stamp);
      presented.add(id);
      total += 1;
      changed.push(id);
    }
    return changed;
  }

  function receiveCore(db, actor, day, ids, stamp) {
    const limit = tables.limitForLevel(actor.level).max_receive_friendship_count;
    let received = receivedCount(db, actor.roleId, day);
    const changed = [];
    for (const id of ids) {
      const row = db.prepare(
        'SELECT created_at FROM friend_gifts WHERE day=? AND giver_role_id=? AND receiver_role_id=? AND received_at IS NULL'
      ).get(day, id, actor.roleId);
      if (!row) fail(CODE_DUPLICATE, 'Role ' + id + ' has no friendship to receive today');
      if (received >= limit) fail(CODE_UNAVAILABLE, 'Daily friendship receive limit is reached');
      db.prepare('UPDATE friend_gifts SET received_at=? WHERE day=? AND giver_role_id=? AND receiver_role_id=?')
        .run(stamp, day, id, actor.roleId);
      received += 1;
      changed.push(id);
    }
    return changed;
  }

  function friendshipChangeData(db, roleId, day, changedIds) {
    return {
      friendship: friendshipData(db, roleId, day),
      // FriendMgr parses res through AwardKit and looks for ItemTable.TID_FRIENDSHIP.
      // The present/rev award trigger is not recovered, so no resource delta is
      // emitted instead of inventing friendship-point grants.
      res: { changes: [] },
      friend_list: changedIds.map(id => ({ id: String(id), favors: favorsOf(db, roleId, id) }))
    };
  }

  function presentCommand(input, milliseconds, day) {
    const ids = idList(input, 'present');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const changed = presentCore(db, actor, day, ids, isoString(milliseconds));
      touchFriendship(db, actor.roleId, day, milliseconds);
      const data = codec.pack('res_friendship_change', friendshipChangeData(db, actor.roleId, day, changed));
      log({ event: 'friend_present_committed', roleId: actor.roleId, day, presented: changed.length });
      return {
        data,
        value: {
          day,
          presented: changed.length,
          pushes: changed.map(id => ({ pushType: FRIEND_PUSH_TYPES.friendshipChange, roleId: id }))
        }
      };
    });
  }

  function receiveCommand(input, milliseconds, day) {
    const ids = idList(input, 'receive');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const changed = receiveCore(db, actor, day, ids, isoString(milliseconds));
      touchFriendship(db, actor.roleId, day, milliseconds);
      const data = codec.pack('res_friendship_change', friendshipChangeData(db, actor.roleId, day, changed));
      log({ event: 'friend_receive_committed', roleId: actor.roleId, day, received: changed.length });
      return {
        data,
        value: {
          day,
          received: changed.length,
          pushes: changed.map(id => ({ pushType: FRIEND_PUSH_TYPES.friendshipChange, roleId: id }))
        }
      };
    });
  }

  function oneKeyCommand(input, milliseconds, day) {
    if (!Array.isArray(input) || input.length !== 2) {
      fail(CODE_INVALID, 'Friend one-key payload expects [present_ids, receive_ids]');
    }
    const presentList = optionalIdList(input[0], 'present');
    const receiveList = optionalIdList(input[1], 'receive');
    if (!presentList.length && !receiveList.length) fail(CODE_INVALID, 'Friend one-key payload is empty');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      const stamp = isoString(milliseconds);
      const presented = presentCore(db, actor, day, presentList, stamp);
      const received = receiveCore(db, actor, day, receiveList, stamp);
      touchFriendship(db, actor.roleId, day, milliseconds);
      const changedIds = [...new Set([...presented, ...received])];
      const data = codec.pack('res_friendship_change', friendshipChangeData(db, actor.roleId, day, changedIds));
      log({
        event: 'friend_one_key_committed', roleId: actor.roleId, day,
        presented: presented.length, received: received.length
      });
      return {
        data,
        value: {
          day,
          presented: presented.length,
          received: received.length,
          pushes: changedIds.map(id => ({ pushType: FRIEND_PUSH_TYPES.friendshipChange, roleId: id }))
        }
      };
    });
  }

  function queryCommand(input) {
    let candidate = input;
    if (Array.isArray(candidate)) {
      if (candidate.length !== 1) fail(CODE_INVALID, 'Friend query expects one id or name');
      [candidate] = candidate;
    }
    if (candidate == null) fail(CODE_INVALID, 'Friend query payload is required');
    const actorRoleId = Number(store.read().state.roleId);
    const text = textOf(candidate);
    const trimmed = text == null ? null : text.trim();
    const numeric = trimmed != null && /^[0-9]+$/.test(trimmed) ? Number(trimmed) : null;
    if (trimmed == null) {
      const value = Number(candidate);
      if (!Number.isSafeInteger(value) || value <= 0) fail(CODE_INVALID, 'Friend query expects one id or name');
    } else if (!trimmed) {
      fail(CODE_INVALID, 'Friend query is empty');
    }
    return store.inspect(db => {
      ensureTables(db);
      const roles = roleIndex(db);
      const results = [];
      for (const role of roles.values()) {
        if (role.roleId === actorRoleId) continue;
        const hit = numeric != null ? role.roleId === numeric : role.name === trimmed;
        if (hit) results.push(role);
        if (results.length >= tables.param.max_search_count) break;
      }
      const data = codec.pack('res_query_friend_player', {
        player_info_list: results.map(role => ({ role_id: String(role.roleId), recommend_types: [] }))
      });
      log({ event: 'friend_query', roleId: actorRoleId, mode: numeric != null ? 'role_id' : 'nick_name', results: results.length });
      return { data, value: { mode: numeric != null ? 'role_id' : 'nick_name', results: results.length } };
    });
  }

  // Recommendation type labels (FriendTable Recommend: GENRE=1, GUILD=2,
  // FIGHT=3, RANK=4) need cross-role genre/guild/battle/rank evidence that the
  // single-role save does not carry, so no label is invented here.
  function recommendTypesFor() {
    return [];
  }

  function recommendCandidates(db, actorRoleId) {
    const roles = roleIndex(db);
    const friends = new Set(friendIds(db, actorRoleId));
    const blocked = new Set(blacklistIds(db, actorRoleId));
    const incoming = new Set(applyIds(db, actorRoleId));
    const outgoing = outgoingApplies(db, actorRoleId);
    const candidates = [];
    for (const role of roles.values()) {
      if (role.roleId === actorRoleId) continue;
      if (friends.has(role.roleId)) continue;
      if (blocked.has(role.roleId) || isBlocked(db, role.roleId, actorRoleId)) continue;
      if (incoming.has(role.roleId) || outgoing.has(role.roleId)) continue;
      candidates.push(role);
    }
    return candidates.sort((left, right) => left.roleId - right.roleId);
  }

  function playerInfoList(roles) {
    return roles.map(role => ({ role_id: String(role.roleId), recommend_types: recommendTypesFor(role) }));
  }

  function recommendCommand() {
    const actorRoleId = Number(store.read().state.roleId);
    return store.inspect(db => {
      ensureTables(db);
      const list = recommendCandidates(db, actorRoleId).slice(0, CONST_MAX_RECOMMEND_COUNT);
      const data = codec.pack('res_query_friend_player', { player_info_list: playerInfoList(list) });
      log({ event: 'friend_recommend', roleId: actorRoleId, results: list.length });
      return { data, value: { results: list.length, cap: CONST_MAX_RECOMMEND_COUNT } };
    });
  }

  function recommendTypesCommand(input) {
    const raw = input == null ? [] : (Array.isArray(input) ? input : [input]);
    const requested = new Set();
    for (const entry of raw) {
      const value = Number(entry);
      if (!Number.isSafeInteger(value) || value <= 0) fail(CODE_INVALID, 'Invalid friend recommend type');
      requested.add(value);
    }
    const actorRoleId = Number(store.read().state.roleId);
    return store.inspect(db => {
      ensureTables(db);
      const list = recommendCandidates(db, actorRoleId)
        .filter(role => recommendTypesFor(role).some(type => requested.has(type)))
        .slice(0, CONST_MAX_RECOMMEND_COUNT);
      const data = codec.pack('res_query_friend_player', { player_info_list: playerInfoList(list) });
      log({
        event: 'friend_recommend_types', roleId: actorRoleId,
        requested: [...requested], results: list.length,
        gap: 'recommend type classification is not recovered'
      });
      return { data, value: { results: list.length, types: [...requested] } };
    });
  }

  function reportCommand(input, milliseconds, day) {
    const args = Array.isArray(input) ? input : [input];
    if (args.length < 2) fail(CODE_INVALID, 'Friend report expects [role_id, content]');
    const targetRoleId = roleIdOf(args[0], 'report');
    const content = textOf(args[1]);
    if (content == null) fail(CODE_INVALID, 'Friend report content is invalid');
    const trimmed = content.trim();
    if (!trimmed) fail(CODE_INVALID, 'Friend report content is empty');
    if (trimmed.length > tables.param.accuss_count) fail(CODE_INVALID, 'Friend report content is too long');
    return store.transaction((model, db) => {
      ensureTables(db);
      const actor = actorOf(model);
      if (!roleIndex(db).has(targetRoleId)) fail(CODE_UNAVAILABLE, 'Role ' + targetRoleId + ' does not exist');
      db.prepare('INSERT OR IGNORE INTO friend_reports (role_id,target_role_id,day,arguments_json,created_at) VALUES (?,?,?,?,?)')
        .run(actor.roleId, targetRoleId, day, JSON.stringify(args.map(value => textOf(value) ?? value)), isoString(milliseconds));
      log({ event: 'friend_report_committed', roleId: actor.roleId, targetRoleId, day });
      return { data: Buffer.alloc(0), value: { targetRoleId, day } };
    });
  }

  function execute(type, input) {
    const milliseconds = clockMilliseconds();
    const day = dayFor(milliseconds);
    switch (Number(type)) {
      case FRIEND_COMMANDS.apply: return applyCommand(input, milliseconds, day);
      case FRIEND_COMMANDS.remove: return removeCommand(input);
      case FRIEND_COMMANDS.agree: return agreeCommand(input, milliseconds, day);
      case FRIEND_COMMANDS.refuse: return refuseCommand(input);
      case FRIEND_COMMANDS.addBlacklist: return blacklistAddCommand(input, milliseconds);
      case FRIEND_COMMANDS.removeBlacklist: return blacklistRemoveCommand(input);
      case FRIEND_COMMANDS.present: return presentCommand(input, milliseconds, day);
      case FRIEND_COMMANDS.receive: return receiveCommand(input, milliseconds, day);
      case FRIEND_COMMANDS.query: return queryCommand(input);
      case FRIEND_COMMANDS.recommend: return recommendCommand();
      case FRIEND_COMMANDS.oneKeyPresentAndReceive: return oneKeyCommand(input, milliseconds, day);
      case FRIEND_COMMANDS.recommendTypes: return recommendTypesCommand(input);
      case FRIEND_COMMANDS.saveReport: return reportCommand(input, milliseconds, day);
      default: fail(CODE_INVALID, 'Unknown friend command');
    }
  }

  // res_friend_login payload for the login container. The numeric login module
  // slot for FriendMgr was not recovered, so the caller chooses it.
  function loginPayload(loginAt = now()) {
    const milliseconds = Number(loginAt);
    if (!Number.isFinite(milliseconds) || milliseconds < 0) fail(CODE_UNAVAILABLE, 'Friend clock is invalid');
    const at = Math.floor(milliseconds);
    const day = dayFor(at);
    const roleId = Number(store.read().state.roleId);
    return store.inspect(db => {
      ensureTables(db);
      db.prepare('INSERT OR IGNORE INTO friend_friendship VALUES (?,?,0,?)').run(roleId, day, isoString(at));
      return codec.pack('res_friend_login', {
        friend_data: friendData(db, roleId),
        friendship_data: friendshipData(db, roleId, day)
      });
    });
  }

  function ensureLoginState(loginAt = now()) {
    const milliseconds = Number(loginAt);
    if (!Number.isFinite(milliseconds) || milliseconds < 0) fail(CODE_UNAVAILABLE, 'Friend clock is invalid');
    const at = Math.floor(milliseconds);
    const day = dayFor(at);
    const roleId = Number(store.read().state.roleId);
    return store.inspect(db => {
      ensureTables(db);
      db.prepare('INSERT OR IGNORE INTO friend_friendship VALUES (?,?,0,?)').run(roleId, day, isoString(at));
      return { day, friends: friendIds(db, roleId).length, applies: applyIds(db, roleId).length };
    });
  }

  // Push payload builders. Only 2201 and 2203 shapes are evidenced; 2200 and
  // 2202 have names in the static catalog but no recovered payload.
  const pushPayload = Object.freeze({
    reduce(friendRoleId) {
      return codec.pack('res_friend_reduce', { friend_role_id: String(roleIdOf(friendRoleId, 'push')) });
    },
    async friendshipChange(friendship, friend) {
      if (!friendship || typeof friendship !== 'object') fail(CODE_INVALID, 'Friend push friendship is required');
      if (!friend || typeof friend !== 'object') fail(CODE_INVALID, 'Friend push friend data is required');
      return encodeEtf([
        binary(codec.pack('pb_friendship', friendship)),
        binary(codec.pack('pb_friend_data', friend))
      ]);
    },
    append() {
      fail(CODE_UNAVAILABLE, 'res_friend_append payload is not recovered');
    },
    applyAppend() {
      fail(CODE_UNAVAILABLE, 'res_friend_apply_append payload is not recovered');
    }
  });

  return {
    supports: type => Object.values(FRIEND_COMMANDS).includes(Number(type)),
    execute,
    loginPayload,
    ensureLoginState,
    pushPayload,
    commands: FRIEND_COMMANDS,
    pushTypes: FRIEND_PUSH_TYPES,
    tables
  };
}
