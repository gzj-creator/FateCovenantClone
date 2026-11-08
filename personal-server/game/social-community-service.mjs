import { GameError } from './hero-progression.mjs';
import { serverDayNumber } from './activity-calendar.mjs';

// E1 community commands: SupportCmd 46001-46002, RealtimeMapCmd 75001-75005,
// CommentCmd 76601-76605, RelationshipCmd 77501-77503, AdventureCmd 77601,
// StrategyCmd 79201 and DanmakuCmd 84701.
//
// Every reply uses the shipped schema named by the static interface catalog; the
// commands whose reply has no protobuf schema answer with an empty payload, which
// is what the client already tolerates for the same ETF fallback path used by
// ChatCmd (see agent/workflow/gameplay-completion/SOC-CHAT).
export const COMMUNITY_COMMANDS = Object.freeze({
  supportPlayer: 46001,
  getSupported: 46002,
  mapEnter: 75001,
  mapLeave: 75002,
  mapBackBorn: 75003,
  mapMove: 75004,
  mapTeleport: 75005,
  commentInitHero: 76601,
  commentLike: 76602,
  commentAdd: 76603,
  commentSetScore: 76604,
  commentRoleScoreInfo: 76605,
  relationMark: 77501,
  relationUnmark: 77502,
  relationSetNoNotify: 77503,
  adventureRoleList: 77601,
  heroStrategyRanks: 79201,
  likeDanmaku: 84701
});

export const COMMUNITY_REQUEST_SCHEMAS = Object.freeze({
  75001: 'pb_realtime_enter_map_req',
  75002: 'pb_realtime_leave_map_req',
  75004: 'pb_realtime_map_role_move_req',
  76602: 'pb_req_add_like_count',
  76603: 'pb_hero_comment_insert_req',
  76604: 'pb_hero_comment_set_score_req',
  77501: 'pb_relation_mark_req',
  77502: 'pb_relation_un_mark_req',
  84701: 'pb_req_like_danmaku'
});

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;

// Local policies: SupportMgr/CommentErr/RelationshipTable rows are not
// extracted, so these numbers are server placeholders, not recovered rules.
const POLICY = Object.freeze({
  SUPPORT_TYPES: 1,
  DAILY_SUPPORT_TIMES: 10,
  COMMENT_MAX_LENGTH: 200,
  COMMENT_LIST_LIMIT: 200,
  DAILY_COMMENT_LIKES: 10,
  SCORE_MIN: 1,
  SCORE_MAX: 5,
  DAILY_SCORE_MODIFY: 3,
  RELATION_CUSTOM_MAX: 64
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS community_support (
  role_id INTEGER NOT NULL,
  day INTEGER NOT NULL CHECK(day>=0),
  type INTEGER NOT NULL CHECK(type>=0),
  target_role_id INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK(count>0),
  PRIMARY KEY(role_id,day,type,target_role_id)
);
CREATE TABLE IF NOT EXISTS community_supported (
  role_id INTEGER NOT NULL,
  type INTEGER NOT NULL CHECK(type>=0),
  count INTEGER NOT NULL CHECK(count>=0),
  PRIMARY KEY(role_id,type)
);
CREATE TABLE IF NOT EXISTS community_comments (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  hero_tid INTEGER NOT NULL CHECK(hero_tid>0),
  role_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0 CHECK(like_count>=0),
  create_time INTEGER NOT NULL,
  is_shield INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS community_comments_hero_idx
  ON community_comments(hero_tid, comment_id DESC);
CREATE TABLE IF NOT EXISTS community_scores (
  role_id INTEGER NOT NULL,
  hero_tid INTEGER NOT NULL CHECK(hero_tid>0),
  score INTEGER NOT NULL,
  modify_count INTEGER NOT NULL DEFAULT 0,
  day INTEGER NOT NULL DEFAULT 0,
  time INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(role_id,hero_tid)
);
CREATE TABLE IF NOT EXISTS community_comment_likes (
  role_id INTEGER NOT NULL,
  day INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(role_id,day,comment_id)
);
CREATE TABLE IF NOT EXISTS community_relations (
  role_id INTEGER NOT NULL,
  tid INTEGER NOT NULL,
  dst INTEGER NOT NULL,
  custom BLOB,
  no_notify INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(role_id,tid,dst),
  CHECK(role_id<>dst)
);
CREATE TABLE IF NOT EXISTS community_danmaku_likes (
  channel_id INTEGER NOT NULL,
  msg_idx INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK(count>=0),
  PRIMARY KEY(channel_id,msg_idx)
);
CREATE TABLE IF NOT EXISTS community_map_presence (
  map_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  loc_index INTEGER NOT NULL DEFAULT 0,
  style_id INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(map_id,role_id)
);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function textOf(value) {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  if (value && typeof value === 'object' && value.value instanceof Uint8Array) return Buffer.from(value.value).toString('utf8');
  if (value && typeof value === 'object' && value.value && Array.isArray(value.value.data)) return Buffer.from(value.value.data).toString('utf8');
  if (Array.isArray(value) && value.length && value.every(entry => Number.isInteger(entry) && entry >= 0 && entry <= 0x10ffff)) return String.fromCodePoint(...value);
  return null;
}

function number(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) fail(CODE_INVALID, 'Invalid ' + label);
  return parsed;
}

export function createSocialCommunityService({
  store,
  codec,
  serverOpenedAt,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Community store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function clockMilliseconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(CODE_UNAVAILABLE, 'Community clock is invalid');
    return Math.floor(value);
  }

  const nowSeconds = () => Math.trunc(clockMilliseconds() / 1000);
  const today = () => serverDayNumber(openedAt, clockMilliseconds());

  function actorOf(model) {
    return String((model.state ?? model).roleId);
  }

  function roleName(db, roleId) {
    const row = db.prepare('SELECT profile_json FROM roles WHERE role_id=?').get(Number(roleId));
    if (!row) return '';
    let profile;
    try {
      profile = JSON.parse(row.profile_json);
    } catch {
      return '';
    }
    const raw = profile?.nick_name;
    if (typeof raw !== 'string' || !raw) return typeof raw === 'string' ? raw : '';
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(raw) && raw.length % 4 === 0) {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      if (decoded && !/[\u0000-\u0008\u000e-\u001f]/.test(decoded)) return decoded;
    }
    return raw;
  }

  function supportInfoRows(db, roleId, day, type) {
    const rows = db.prepare('SELECT type,SUM(count) AS total FROM community_support WHERE role_id=? AND day=? GROUP BY type ORDER BY type').all(Number(roleId), day);
    const targetRows = db.prepare('SELECT type,target_role_id,count FROM community_support WHERE role_id=? AND day=? ORDER BY type,target_role_id').all(Number(roleId), day);
    return (type === undefined ? rows : rows.filter(row => Number(row.type) === Number(type))).map(row => ({
      type: Number(row.type),
      times: Number(row.total),
      support: targetRows.filter(entry => Number(entry.type) === Number(row.type)).map(entry => ({
        role_id: String(entry.target_role_id),
        count: Number(entry.count)
      }))
    }));
  }

  function supportedRows(db, roleId) {
    return db.prepare('SELECT type,count FROM community_supported WHERE role_id=? ORDER BY type').all(Number(roleId))
      .map(row => ({ type: Number(row.type), count: Number(row.count) }));
  }

  function supportPlayer(model, db, input) {
    const actor = actorOf(model);
    const values = Array.isArray(input) ? input : (input && typeof input === 'object' && !Buffer.isBuffer(input) ? null : [input]);
    let type = 1;
    let target;
    if (values) {
      if (values.length >= 2) { type = number(values[0], 'support type', { min: 1, max: 99 }); target = values[1]; }
      else if (values.length === 1) target = values[0];
    } else {
      type = number(input.type ?? 1, 'support type', { min: 1, max: 99 });
      target = input.role_id ?? input.target_role_id ?? input.id;
    }
    const targetId = number(target, 'support target role id', { min: 1 });
    if (String(targetId) === actor) fail(CODE_INVALID, 'Cannot support the current role');
    if (!db.prepare('SELECT 1 AS id FROM roles WHERE role_id=?').get(targetId)) fail(CODE_UNAVAILABLE, 'Support target role does not exist');
    const day = today();
    const used = db.prepare('SELECT COALESCE(SUM(count),0) AS total FROM community_support WHERE role_id=? AND day=? AND type=?').get(Number(actor), day, type);
    if (Number(used.total) >= POLICY.DAILY_SUPPORT_TIMES) fail(CODE_UNAVAILABLE, 'Daily support limit reached');
    db.prepare('INSERT INTO community_support(role_id,day,type,target_role_id,count) VALUES (?,?,?,?,1) ON CONFLICT(role_id,day,type,target_role_id) DO UPDATE SET count=count+1')
      .run(Number(actor), day, type, targetId);
    db.prepare('INSERT INTO community_supported(role_id,type,count) VALUES (?,?,1) ON CONFLICT(role_id,type) DO UPDATE SET count=count+1')
      .run(targetId, type);
    const value = {
      info: { support_day: day, support_list: supportInfoRows(db, actor, day) },
      supported: { supported: supportedRows(db, targetId), last_notify: nowSeconds() },
      res: { changes: [] }
    };
    return { data: codec.pack('support_to_client', value), value: { type, target: targetId, times: Number(used.total) + 1 } };
  }

  function getSupported(model) {
    const actor = actorOf(model);
    // No protobuf schema exists for 46002 (static catalog: ETF fallback) and the
    // ETF shape is not recovered, so the reply stays empty; the counters are still
    // returned by 46001 and persisted.
    return { data: Buffer.alloc(0), value: { roleId: actor, gap: 'supported ETF shape unknown' } };
  }

  function enterMap(model, db, input) {
    const actor = actorOf(model);
    const mapId = number(input?.map_id, 'map id', { min: 1 });
    const dest = input?.dest_loc === undefined ? 0 : Number(input.dest_loc) || 0;
    const style = 0;
    db.prepare('INSERT INTO community_map_presence(map_id,role_id,loc_index,style_id,state,updated_at) VALUES (?,?,?,?,1,?) ON CONFLICT(map_id,role_id) DO UPDATE SET loc_index=excluded.loc_index,updated_at=excluded.updated_at')
      .run(mapId, Number(actor), dest, style, nowSeconds());
    const nodes = db.prepare('SELECT role_id,loc_index,style_id,state FROM community_map_presence WHERE map_id=? ORDER BY role_id').all(mapId)
      .map(row => ({
        id: String(row.role_id),
        style_id: Number(row.style_id),
        loc_index: Number(row.loc_index),
        state: Number(row.state),
        type: 1
      }));
    const value = { id: String(mapId), role_list: nodes, func_data: Buffer.alloc(0) };
    return { data: codec.pack('pb_realtime_enter_map_back', value), value: { mapId, nodes: nodes.length } };
  }

  function leaveMap(model, db, input) {
    const actor = actorOf(model);
    const mapId = number(input?.map_id, 'map id', { min: 1 });
    db.prepare('DELETE FROM community_map_presence WHERE map_id=? AND role_id=?').run(mapId, Number(actor));
    return { data: Buffer.alloc(0), value: { mapId } };
  }

  function moveOnMap(model, db, input) {
    const actor = actorOf(model);
    const mapId = number(input?.map_id ?? (Array.isArray(input) ? input[0] : input), 'map id', { min: 1 });
    const dest = Number(input?.dest_loc ?? (Array.isArray(input) ? input[1] : 0)) || 0;
    const row = db.prepare('SELECT 1 AS id FROM community_map_presence WHERE map_id=? AND role_id=?').get(mapId, Number(actor));
    if (!row) fail(CODE_UNAVAILABLE, 'Current role is not on that map');
    db.prepare('UPDATE community_map_presence SET loc_index=?,updated_at=? WHERE map_id=? AND role_id=?').run(dest, nowSeconds(), mapId, Number(actor));
    return { data: Buffer.alloc(0), value: { mapId, dest_loc: dest } };
  }

  function backBorn(model, db) {
    const actor = actorOf(model);
    db.prepare('UPDATE community_map_presence SET loc_index=0,updated_at=? WHERE role_id=?').run(nowSeconds(), Number(actor));
    return { data: Buffer.alloc(0), value: { loc_index: 0 } };
  }

  function heroComments(db, heroTid) {
    const rows = db.prepare('SELECT * FROM community_comments WHERE hero_tid=? AND is_shield=0 ORDER BY comment_id DESC LIMIT ?')
      .all(heroTid, POLICY.COMMENT_LIST_LIMIT);
    return {
      cur_max_id: rows.length ? Number(rows[0].comment_id) : 0,
      comments: rows.map(row => ({
        uid: Number(row.comment_id),
        role_id: String(row.role_id),
        like_count: Number(row.like_count),
        content: row.content,
        name: row.name,
        score: Number(row.score),
        create_time: Number(row.create_time),
        is_shield: Boolean(row.is_shield)
      }))
    };
  }

  function heroScore(db, heroTid) {
    const row = db.prepare('SELECT COALESCE(SUM(score),0) AS score, COUNT(*) AS count FROM community_scores WHERE hero_tid=?').get(heroTid);
    return { score: Number(row.score), count: Number(row.count) };
  }

  function roleCommentInfo(db, roleId) {
    const day = today();
    const likes = db.prepare('SELECT COUNT(*) AS count FROM community_comment_likes WHERE role_id=? AND day=?').get(Number(roleId), day);
    const records = db.prepare('SELECT hero_tid,score,modify_count,time FROM community_scores WHERE role_id=? ORDER BY hero_tid').all(Number(roleId));
    return {
      remind_like_count: Math.max(0, POLICY.DAILY_COMMENT_LIKES - Number(likes.count)),
      remind_like_count_time: nowSeconds(),
      all_record: records.map(row => ({
        tid: Number(row.hero_tid),
        score: Number(row.score),
        modify_count: Number(row.modify_count),
        time: Number(row.time)
      }))
    };
  }

  function commentInitHero(db, input) {
    const heroTid = number(Array.isArray(input) ? input[0] : (input && typeof input === 'object' ? (input.hero_tid ?? input.tid) : input), 'hero tid', { min: 1 });
    const value = {
      score_info: codec.pack('pb_hero_comment_all_score', heroScore(db, heroTid)),
      comments: codec.pack('pb_hero_comments', heroComments(db, heroTid)),
      hero_tid: heroTid
    };
    return { data: codec.pack('pb_hero_comment_info', value), value: { heroTid } };
  }

  function commentLike(model, db, input) {
    const actor = actorOf(model);
    const commentId = number(input?.uid ?? input?.comment_id, 'comment id', { min: 1 });
    const heroTid = number(input?.hero_tid, 'hero tid', { min: 1 });
    const day = today();
    const used = db.prepare('SELECT COUNT(*) AS count FROM community_comment_likes WHERE role_id=? AND day=?').get(Number(actor), day);
    if (Number(used.count) >= POLICY.DAILY_COMMENT_LIKES) fail(CODE_UNAVAILABLE, 'Daily comment like limit reached');
    const comment = db.prepare('SELECT comment_id,hero_tid FROM community_comments WHERE comment_id=?').get(commentId);
    if (!comment) fail(CODE_UNAVAILABLE, 'Comment does not exist');
    if (Number(comment.hero_tid) !== heroTid) fail(CODE_INVALID, 'Comment does not belong to that hero');
    if (db.prepare('SELECT 1 AS id FROM community_comment_likes WHERE role_id=? AND day=? AND comment_id=?').get(Number(actor), day, commentId)) {
      fail(CODE_UNAVAILABLE, 'Comment was already liked today');
    }
    db.prepare('INSERT INTO community_comment_likes(role_id,day,comment_id,created_at) VALUES (?,?,?,?)')
      .run(Number(actor), day, commentId, nowSeconds());
    db.prepare('UPDATE community_comments SET like_count=like_count+1 WHERE comment_id=?').run(commentId);
    const value = roleCommentInfo(db, actor);
    return { data: codec.pack('pb_role_comment_info', value), value: { heroTid, commentId, like_count: Number(used.count) + 1 } };
  }

  function commentAdd(model, db, input) {
    const actor = actorOf(model);
    const heroTid = number(input?.hero_tid, 'hero tid', { min: 1 });
    const content = (textOf(input?.content) ?? '').trim();
    if (!content) fail(CODE_INVALID, 'Comment content is required');
    if (content.length > POLICY.COMMENT_MAX_LENGTH) fail(CODE_INVALID, 'Comment content is too long');
    const name = roleName(db, actor);
    const scoreRow = db.prepare('SELECT score FROM community_scores WHERE role_id=? AND hero_tid=?').get(Number(actor), heroTid);
    db.prepare('INSERT INTO community_comments(hero_tid,role_id,name,content,score,like_count,create_time,is_shield) VALUES (?,?,?,?,?,0,?,0)')
      .run(heroTid, Number(actor), name, content, Number(scoreRow?.score ?? 0), nowSeconds());
    const value = heroComments(db, heroTid);
    return { data: codec.pack('pb_hero_comments', value), value: { heroTid, contentLength: content.length } };
  }

  function commentSetScore(model, db, input) {
    const actor = actorOf(model);
    const heroTid = number(input?.hero_tid, 'hero tid', { min: 1 });
    const score = number(input?.score, 'score', { min: POLICY.SCORE_MIN, max: POLICY.SCORE_MAX });
    const day = today();
    const existing = db.prepare('SELECT score,modify_count,day FROM community_scores WHERE role_id=? AND hero_tid=?').get(Number(actor), heroTid);
    const sameDay = Number(existing?.day ?? 0) === day;
    const modifyCount = sameDay ? Number(existing.modify_count ?? 0) : 0;
    if (modifyCount >= POLICY.DAILY_SCORE_MODIFY) fail(CODE_UNAVAILABLE, 'Daily score change limit reached');
    db.prepare(`INSERT INTO community_scores(role_id,hero_tid,score,modify_count,day,time) VALUES (?,?,?,?,?,?)
      ON CONFLICT(role_id,hero_tid) DO UPDATE SET score=excluded.score,modify_count=excluded.modify_count,day=excluded.day,time=excluded.time`)
      .run(Number(actor), heroTid, score, modifyCount + 1, day, nowSeconds());
    const value = roleCommentInfo(db, actor);
    return { data: codec.pack('pb_role_comment_info', value), value: { heroTid, score, modifyCount: modifyCount + 1 } };
  }

  function commentRoleScoreInfo(model, db) {
    const value = roleCommentInfo(db, actorOf(model));
    return { data: codec.pack('pb_role_comment_info', value), value: { records: value.all_record.length } };
  }

  function relationMark(model, db, input, unmark = false) {
    const actor = actorOf(model);
    const tid = number(input?.tid, 'relation tid', { min: 1 });
    const dst = number(input?.dst, 'relation target role id', { min: 1 });
    if (String(dst) === actor) fail(CODE_INVALID, 'Cannot mark the current role');
    const customRaw = input?.custom;
    const custom = customRaw ? (Buffer.isBuffer(customRaw) ? customRaw : Buffer.from(String(customRaw), 'base64')) : Buffer.alloc(0);
    if (custom.length > POLICY.RELATION_CUSTOM_MAX) fail(CODE_INVALID, 'Relation payload is too large');
    if (unmark) {
      const removed = db.prepare('DELETE FROM community_relations WHERE role_id=? AND tid=? AND dst=?').run(Number(actor), tid, dst);
      if (!Number(removed.changes)) fail(CODE_UNAVAILABLE, 'Relation mark does not exist');
      return { data: codec.pack('pb_relation_un_mark_rsp', { custom, res_changes: { changes: [] } }), value: { tid, dst, removed: true } };
    }
    db.prepare('INSERT INTO community_relations(role_id,tid,dst,custom,no_notify,created_at) VALUES (?,?,?,?,0,?) ON CONFLICT(role_id,tid,dst) DO UPDATE SET custom=excluded.custom')
      .run(Number(actor), tid, dst, custom, nowSeconds());
    return { data: codec.pack('pb_relation_mark_rsp', { custom, res_changes: { changes: [] } }), value: { tid, dst, marked: true } };
  }

  function relationSetNoNotify(model, db, input) {
    const actor = actorOf(model);
    const values = Array.isArray(input) ? input : [];
    const tid = number(values[0] ?? input?.tid, 'relation tid', { min: 1 });
    const dst = number(values[1] ?? input?.dst, 'relation target role id', { min: 1 });
    const flag = values.length > 2 ? Boolean(Number(values[2])) : Boolean(input?.no_notify ?? true);
    const updated = db.prepare('UPDATE community_relations SET no_notify=? WHERE role_id=? AND tid=? AND dst=?')
      .run(flag ? 1 : 0, Number(actor), tid, dst);
    if (!Number(updated.changes)) fail(CODE_UNAVAILABLE, 'Relation mark does not exist');
    return { data: Buffer.alloc(0), value: { tid, dst, no_notify: flag } };
  }

  function likeDanmaku(model, db, input) {
    const channelId = number(input?.channel_id, 'danmaku channel id', { min: 0 });
    const msgIdx = number(input?.msg_idx, 'danmaku message index', { min: 0 });
    db.prepare('INSERT INTO community_danmaku_likes(channel_id,msg_idx,count) VALUES (?,?,1) ON CONFLICT(channel_id,msg_idx) DO UPDATE SET count=count+1')
      .run(channelId, msgIdx);
    const row = db.prepare('SELECT count FROM community_danmaku_likes WHERE channel_id=? AND msg_idx=?').get(channelId, msgIdx);
    return { data: Buffer.alloc(0), value: { channelId, msgIdx, count: Number(row?.count ?? 0) } };
  }

  // 77601 and 79201 answer with ETF lists whose element shape is not recovered;
  // they return an empty list rather than invented rows and stay registered as
  // evidence gaps.
  function emptyEtfList(model) {
    return { data: Buffer.from([131, 106]), value: { roleId: actorOf(model), gap: 'ETF list element shape unknown' } };
  }

  const SUPPORTED = new Set(Object.values(COMMUNITY_COMMANDS));

  return {
    supports: type => SUPPORTED.has(Number(type)),
    requestSchema: type => COMMUNITY_REQUEST_SCHEMAS[Number(type)] ?? null,
    execute(type, input) {
      const command = Number(type);
      return store.transaction((model, db) => {
        switch (command) {
          case 46001: return supportPlayer(model, db, input);
          case 46002: return getSupported(model);
          case 75001: return enterMap(model, db, input);
          case 75002: return leaveMap(model, db, input);
          case 75003: return backBorn(model, db);
          case 75004: return moveOnMap(model, db, input);
          case 75005: return moveOnMap(model, db, input);
          case 76601: return commentInitHero(db, input);
          case 76602: return commentLike(model, db, input);
          case 76603: return commentAdd(model, db, input);
          case 76604: return commentSetScore(model, db, input);
          case 76605: return commentRoleScoreInfo(model, db);
          case 77501: return relationMark(model, db, input, false);
          case 77502: return relationMark(model, db, input, true);
          case 77503: return relationSetNoNotify(model, db, input);
          case 77601: return emptyEtfList(model);
          case 79201: return emptyEtfList(model);
          case 84701: return likeDanmaku(model, db, input);
          default: fail(CODE_UNAVAILABLE, 'Community command is not implemented');
        }
      });
    }
  };
}
