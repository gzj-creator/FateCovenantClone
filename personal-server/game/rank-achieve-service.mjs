import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { setBit } from './bit-block.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readRankAchieveTables } from '../config/rank-achieve-tables.mjs';

const COMMAND_AWARD = 43101;
const PUSH_FINISH = 8601;
const LOGIN_MODULE = 170;
const MAX_CLAIM_BATCH = 200;
const CODE_INVALID = 1;
const CODE_NOT_FINISHED = 5;
const CODE_ALREADY_CLAIMED = 310;

function fail(code, message) {
  throw new GameError(code, message);
}

function epochSeconds(now, value = now()) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('Invalid rank achieve clock');
  return Math.floor(number >= 100_000_000_000 ? number / 1000 : number);
}

function positiveInteger(value, message) {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, message);
  return number;
}

function requestIds(input) {
  const source = Array.isArray(input) ? input : input?.tid_list;
  if (!Array.isArray(source) || source.length === 0 || source.length > MAX_CLAIM_BATCH) {
    fail(CODE_INVALID, 'Invalid rank achievement id list');
  }
  const ids = source.map(value => positiveInteger(value, 'Invalid rank achievement id'));
  if (new Set(ids).size !== ids.length) fail(CODE_INVALID, 'Duplicate rank achievement id');
  return ids;
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rank_achieve_finish (
      role_id INTEGER NOT NULL,
      tid INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      completed_at INTEGER NOT NULL,
      PRIMARY KEY(role_id, tid)
    );
    CREATE TABLE IF NOT EXISTS rank_achieve_claims (
      role_id INTEGER NOT NULL,
      tid INTEGER NOT NULL,
      claimed_at INTEGER NOT NULL,
      PRIMARY KEY(role_id, tid)
    );
  `);
}

function peakTowerLayer(db, roleId) {
  const table = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='peak_tower_state'").get();
  if (!table) return 0;
  return Math.max(0, Number(db.prepare('SELECT max_layer FROM peak_tower_state WHERE role_id=?').get(roleId)?.max_layer ?? 0));
}

function configuredHeroIds(achievement, heroTables) {
  const converted = Array.isArray(achievement.event_param_convert)
    ? achievement.event_param_convert
    : [achievement.event_param_convert];
  const nickNames = new Set(converted.map(Number).filter(id => Number.isSafeInteger(id) && id > 0));
  if (nickNames.size === 0) return null;
  const ids = new Set();
  for (const hero of heroTables.Hero.values()) {
    if (nickNames.has(Number(hero.nick_name))) ids.add(Number(hero.tid));
  }
  return ids.size ? ids : null;
}

function conditionHolds(value, rule, threshold) {
  if (rule === 1) return value >= threshold;
  if (rule === 2) return value <= threshold;
  if (rule === 3) return value === threshold;
  return Boolean(value);
}

function qualification(achievement, eventType, model, db, heroTables) {
  const threshold = Number(achievement.event_param);
  if (achievement.event_type === 6) {
    const value = peakTowerLayer(db, model.state.roleId);
    return conditionHolds(value, eventType.compare_rule, threshold);
  }
  if (achievement.event_type === 17 || achievement.event_type === 53) {
    const expected = configuredHeroIds(achievement, heroTables);
    if (!expected) return false;
    const owned = model.heroInfo.hero_list.find(hero => expected.has(Number(hero.tid)));
    return Boolean(owned);
  }
  return false;
}

function claimedRows(db, roleId) {
  return db.prepare('SELECT tid FROM rank_achieve_claims WHERE role_id=? ORDER BY tid').all(roleId)
    .map(row => Number(row.tid));
}

function trimBitBlock(bits) {
  let end = bits.length;
  while (end > 0 && bits[end - 1] === 0) end -= 1;
  return end === bits.length ? bits : bits.subarray(0, end);
}

function roleState(db, roleId) {
  const groups = new Map();
  for (const tid of claimedRows(db, roleId)) {
    const type = Math.floor(tid / 1000), bit = tid % 1000;
    groups.set(type, trimBitBlock(setBit(groups.get(type) ?? Buffer.alloc(0), bit)));
  }
  return {
    got_award: [...groups].sort(([left], [right]) => left - right)
      .map(([type, bits]) => ({ type: String(type), got_award: bits }))
  };
}

function persistedFinishes(db, roleId) {
  return db.prepare('SELECT tid,unit_id,completed_at FROM rank_achieve_finish WHERE role_id=? ORDER BY tid').all(roleId)
    .map(row => ({ tid: String(row.tid), unit_id: String(row.unit_id), time: String(row.completed_at) }));
}

export function createRankAchieveService({
  store,
  codec,
  tables = readRankAchieveTables(),
  heroTables = readHeroTables(),
  resourceTables = readGameTables(),
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Rank achievement store is unavailable');
  store.inspect(ensureTables);
  const log = event => { try { logger(event); } catch {} };

  function synchronize(model, db) {
    const roleId = model.state.roleId, completedAt = epochSeconds(now);
    const existing = db.prepare('SELECT 1 FROM rank_achieve_finish WHERE role_id=? AND tid=?');
    const insert = db.prepare('INSERT OR IGNORE INTO rank_achieve_finish (role_id,tid,unit_id,completed_at) VALUES (?,?,?,?)');
    let added = 0;
    for (const achievement of [...tables.achievements.values()].sort((left, right) => left.tid - right.tid)) {
      if (existing.get(roleId, achievement.tid)) continue;
      const eventType = tables.eventTypes.get(achievement.event_type);
      if (!eventType || eventType.unit !== 0) continue;
      if (!qualification(achievement, eventType, model, db, heroTables)) continue;
      const result = insert.run(roleId, achievement.tid, roleId, completedAt);
      if (Number(result.changes) === 1) added += 1;
    }
    return added;
  }

  function execute(input) {
    const ids = requestIds(input);
    for (const tid of ids) {
      if (!tables.achievements.has(tid)) fail(CODE_INVALID, `Unknown rank achievement ${tid}`);
    }
    return store.transaction((model, db) => {
      const roleId = model.state.roleId, completedAt = epochSeconds(now);
      const claimed = db.prepare('SELECT tid FROM rank_achieve_claims WHERE role_id=? AND tid=?');
      for (const tid of ids) {
        if (claimed.get(roleId, tid)) fail(CODE_ALREADY_CLAIMED, `Rank achievement ${tid} was already claimed`);
      }

      const completed = db.prepare('SELECT unit_id FROM rank_achieve_finish WHERE role_id=? AND tid=?');
      const insertFinish = db.prepare(`INSERT INTO rank_achieve_finish
        (role_id, tid, unit_id, completed_at) VALUES (?,?,?,?)`);
      const newFinishes = [];
      for (const tid of ids) {
        if (completed.get(roleId, tid)) continue;
        const achievement = tables.achievements.get(tid);
        const eventType = tables.eventTypes.get(achievement.event_type);
        const finished = qualification(achievement, eventType, model, db, heroTables);
        if (!finished || eventType.unit !== 0) fail(CODE_NOT_FINISHED, `Rank achievement ${tid} is not finished`);
        const unitId = roleId;
        const inserted = insertFinish.run(roleId, tid, unitId, completedAt);
        if (Number(inserted.changes) === 1) {
          newFinishes.push({ tid: String(tid), unit_id: String(unitId), finish_id: String(unitId) });
        }
      }

      const insertClaim = db.prepare('INSERT INTO rank_achieve_claims (role_id, tid, claimed_at) VALUES (?,?,?)');
      for (const tid of ids) {
        const inserted = insertClaim.run(roleId, tid, completedAt);
        if (Number(inserted.changes) !== 1) fail(CODE_ALREADY_CLAIMED, `Rank achievement ${tid} was already claimed`);
      }
      const awards = ids.flatMap(tid => tables.achievements.get(tid).award);
      const res = awards.length ? grantResources(model, awards, resourceTables, { codec }) : { changes: [] };
      const newAchieve = roleState(db, roleId);
      const data = codec.pack('pb_rank_achieve_award_rsp', { res_change: res, new_achieve: newAchieve });
      const pushes = newFinishes.map(finish => ({
        type: PUSH_FINISH,
        value: { tid: finish.tid, finish_id: finish.finish_id },
        data: codec.pack('pb_rank_achieve_rev', { tid: finish.tid, finish_id: finish.finish_id })
      }));
      log({ event: 'rank_achieve_claimed', roleId, tids: ids, changes: res.changes.length, newFinishes: newFinishes.length });
      return {
        data,
        pushes,
        value: { tids: ids, changes: res.changes.length, newFinishCount: newFinishes.length, claimedCount: claimedRows(db, roleId).length }
      };
    });
  }

  return {
    supports: type => type === COMMAND_AWARD,
    execute,
    ensureLoginState() {
      return store.transaction((model, db) => {
        const added = synchronize(model, db);
        if (added) log({ event: 'rank_achieve_login_synchronized', roleId: model.state.roleId, added });
        return added;
      });
    },
    loginPayload() {
      const roleId = store.read().state.roleId;
      return store.inspect(db => ({
        person: codec.pack('pb_rank_achieve_role', roleState(db, roleId)),
        server: codec.pack('pb_rank_achieve_server', { finish_info: persistedFinishes(db, roleId), backup_guild: [] }),
        cross: codec.pack('pb_rank_achieve_cross', { finish_info: [], backup_guild: [] })
      }));
    },
    moduleId: LOGIN_MODULE,
    state(roleId = store.read().state.roleId) {
      return store.inspect(db => roleState(db, Number(roleId)));
    }
  };
}
