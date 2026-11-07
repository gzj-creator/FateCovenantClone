import { GameError } from './hero-progression.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';
import { readRankTables, RANK_IDS } from '../config/rank-tables.mjs';

const SUPPORTED_TYPES = new Set([2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011]);
const MAX_RANK_IDS = 100;
const MAX_BUBBLE_LENGTH = 56;
const DEFAULT_PERIOD = 'persistent';
const DEFAULT_SCOPE = 'server:1';

function invalid(message) {
  throw new GameError(1, message);
}

function listValue(value) {
  return Array.isArray(value) ? value : value?.value ?? value;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) invalid(`Invalid ${label}`);
  return value;
}

function positivePair(request, labels) {
  if (!Array.isArray(request) || request.length !== 2) invalid(`Invalid ${labels[0]}/${labels[1]} request`);
  return request.map((value, index) => positiveInteger(value, labels[index]));
}

function rankIds(value, { allowEmpty = false } = {}) {
  const ids = listValue(value);
  if (!Array.isArray(ids) || ids.length > MAX_RANK_IDS || (!allowEmpty && ids.length === 0)) invalid('Invalid ranking list');
  for (const id of ids) positiveInteger(id, 'rank ID');
  return [...new Set(ids)];
}

function singleRankId(value) {
  const ids = rankIds(value);
  if (ids.length !== 1) invalid('Invalid ranking list');
  return ids[0];
}

function int64(value, label) {
  const text = typeof value === 'number' ? String(value) : String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) invalid(`Invalid ${label}`);
  const number = BigInt(text);
  if (number > 0xffffffffffffffffn) invalid(`Invalid ${label}`);
  return number.toString();
}

function valueText(value, label = 'rank value') {
  if (typeof value === 'bigint') {
    if (value < 0n || value > 0xffffffffffffffffn) invalid(`Invalid ${label}`);
    return value.toString();
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) invalid(`Invalid ${label}`);
    return String(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) return int64(value, label);
  invalid(`Invalid ${label}`);
}

function isoSeconds(milliseconds) {
  return Math.floor(milliseconds / 1000);
}

function safeJson(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
}

function ensureTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rank_entries (
      rank_id INTEGER NOT NULL,
      scope_key TEXT NOT NULL,
      period_key TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      server_id INTEGER NOT NULL,
      value TEXT NOT NULL,
      extra BLOB NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(rank_id,scope_key,period_key,participant_id)
    );
    CREATE INDEX IF NOT EXISTS rank_entries_order_idx
      ON rank_entries(rank_id,scope_key,period_key,server_id);
    CREATE TABLE IF NOT EXISTS rank_backups (
      backup_id INTEGER PRIMARY KEY AUTOINCREMENT,
      rank_id INTEGER NOT NULL,
      scope_key TEXT NOT NULL,
      period_key TEXT NOT NULL,
      reason TEXT NOT NULL,
      entries_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rank_backups_latest_idx
      ON rank_backups(rank_id,scope_key,period_key,backup_id DESC);
  `);
}

function configFor(tables, rankId) {
  const config = tables?.configs?.get?.(rankId);
  if (!config) invalid('Ranking is not configured');
  const type = tables?.typeConfigs?.get?.(rankId);
  return {
    config,
    type,
    reverse: Boolean(type?.is_reverse_rank),
    minValue: BigInt(Math.max(0, Number(type?.min_rank_value ?? 0))),
    showCount: Math.max(1, Math.min(1000, Number(type?.show_rank_num ?? 100))),
    maxRank: Math.max(1, Math.min(1000000, Number(type?.max_rank ?? 5000)))
  };
}

function primaryLineup(model) {
  return model.playLineups?.find(lineup => Number(lineup.type) === 1) ?? model.playLineups?.[0] ?? null;
}

function missionId(model, codec) {
  const module = new Map(model.state.modules.value).get(8);
  if (!module?.value?.[0]) return 0;
  try {
    return Number(codec.unpack('pb_mission', rawBinary(module.value[0])).mission_id ?? 0);
  } catch {
    return 0;
  }
}

function peakTowerMaxLayer(db, roleId) {
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='peak_tower_state'").get()) return 0;
    return Number(db.prepare('SELECT max_layer FROM peak_tower_state WHERE role_id=?').get(roleId)?.max_layer ?? 0);
  } catch {
    return 0;
  }
}

function heroStarCount(model) {
  return model.heroInfo.hero_list.reduce((sum, hero) => sum + Math.max(0, Number(hero.star ?? 0)), 0);
}

// CORE-ATTR is not complete yet. This is the same local-server combat-power
// approximation already used by mission battle reports: the sum of the primary
// lineup's authoritative max-HP values, derived only from persisted state.
function localCombatPower(model) {
  const lineup = primaryLineup(model);
  if (!lineup) return 0;
  const heroes = new Map(model.heroInfo.hero_list.map(hero => [String(hero.uid), hero]));
  let power = 0;
  for (const team of lineup.team_list ?? []) {
    for (const fighter of team.fighter_list ?? []) {
      const hero = heroes.get(String(fighter.hero_id));
      if (!hero) continue;
      const level = Math.max(1, Number(hero.level ?? 1));
      const quality = Math.max(0, Number(hero.quality ?? 1));
      power += 1000 + level * 100 + quality * 10;
    }
  }
  return power;
}

export function createRankService({ codec, store, tables = readRankTables(), now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  if (store?.inspect) store.inspect(ensureTables);

  function bubbles() {
    const bubble = store?.read?.()?.state?.rankBubble;
    return bubble?.notice ? [{ id: String(bubble.id), notice: bubble.notice }] : [];
  }

  function playerExtra(model) {
    const role = model.role ?? {};
    return codec.pack('pb_player_info', {
      id: String(model.state.roleId),
      server_id: Number(model.state.serverId ?? 1),
      name: Buffer.isBuffer(role.nick_name) ? role.nick_name : Buffer.from(String(role.nick_name ?? role.name ?? '')),
      level: Number(role.level ?? 1),
      figure_simple_info: role.figure_simple_info ?? {},
      vip: Number(role.vip ?? 0),
      is_robot: false,
      server_name: Buffer.alloc(0),
      cross_stage: Number(role.cross_stage ?? 0)
    });
  }

  function authoritativeScores(model, db) {
    const scores = new Map();
    const level = Number(model.role?.level ?? 0);
    if (Number.isSafeInteger(level) && level > 0) scores.set(RANK_IDS.ROLE_LEVEL, BigInt(level));
    const cleared = missionId(model, codec);
    if (Number.isSafeInteger(cleared) && cleared > 0) scores.set(RANK_IDS.MISSION, BigInt(cleared));
    const stars = heroStarCount(model);
    if (Number.isSafeInteger(stars) && stars > 0) scores.set(RANK_IDS.HERO_STAR_COUNT, BigInt(stars));
    const power = localCombatPower(model);
    if (Number.isSafeInteger(power) && power > 0) scores.set(RANK_IDS.POWER, BigInt(power));
    const tower = peakTowerMaxLayer(db, model.state.roleId);
    if (Number.isSafeInteger(tower) && tower > 0) scores.set(RANK_IDS.PEAK_TOWER, BigInt(tower));
    return scores;
  }

  function captureBackup(db, rankId, scopeKey, periodKey, reason, timestamp) {
    const rows = db.prepare(`SELECT participant_id,server_id,value,extra FROM rank_entries
      WHERE rank_id=? AND scope_key=? AND period_key=? ORDER BY participant_id`).all(rankId, scopeKey, periodKey);
    if (!rows.length) return false;
    const entries = rows.map(row => ({
      participantId: String(row.participant_id), serverId: Number(row.server_id),
      value: String(row.value), extra: Buffer.from(row.extra).toString('base64')
    }));
    db.prepare(`INSERT INTO rank_backups
      (rank_id,scope_key,period_key,reason,entries_json,created_at) VALUES (?,?,?,?,?,?)`)
      .run(rankId, scopeKey, periodKey, reason, safeJson(entries), timestamp);
    return true;
  }

  function writeEntry(db, {
    rankId, participantId, value, extra = Buffer.alloc(0), serverId = 1,
    scopeKey = DEFAULT_SCOPE, periodKey = DEFAULT_PERIOD,
    reason = 'score-updated', timestamp = isoSeconds(now())
  }) {
    configFor(tables, rankId);
    const participant = int64(participantId, 'participant ID');
    const canonicalValue = valueText(value);
    const normalizedServer = positiveInteger(Number(serverId), 'server ID');
    const bytes = Buffer.from(extra ?? []);
    const previous = db.prepare(`SELECT value,extra,server_id FROM rank_entries
      WHERE rank_id=? AND scope_key=? AND period_key=? AND participant_id=?`)
      .get(rankId, scopeKey, periodKey, participant);
    if (previous && String(previous.value) === canonicalValue
        && Number(previous.server_id) === normalizedServer && Buffer.from(previous.extra).equals(bytes)) return false;
    if (previous) captureBackup(db, rankId, scopeKey, periodKey, reason, timestamp);
    db.prepare(`INSERT INTO rank_entries
      (rank_id,scope_key,period_key,participant_id,server_id,value,extra,updated_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(rank_id,scope_key,period_key,participant_id) DO UPDATE SET
        server_id=excluded.server_id,value=excluded.value,extra=excluded.extra,updated_at=excluded.updated_at`)
      .run(rankId, scopeKey, periodKey, participant, normalizedServer, canonicalValue, bytes, timestamp);
    return true;
  }

  function synchronizeInTransaction(model, db) {
    const scopeKey = `server:${Number(model.state.serverId ?? 1)}`;
    const extra = playerExtra(model);
    let changed = 0;
    for (const [rankId, value] of authoritativeScores(model, db)) {
      if (writeEntry(db, {
        rankId, participantId: model.state.roleId, value, extra,
        serverId: model.state.serverId ?? 1, scopeKey, reason: 'authoritative-state-sync'
      })) changed += 1;
    }
    return changed;
  }

  function currentRows(db, rankId, scopeKey = DEFAULT_SCOPE, periodKey = DEFAULT_PERIOD) {
    return db.prepare(`SELECT participant_id,server_id,value,extra FROM rank_entries
      WHERE rank_id=? AND scope_key=? AND period_key=?`).all(rankId, scopeKey, periodKey);
  }

  function rankSorted(rows, rules) {
    return rows
      .filter(row => BigInt(String(row.value)) >= rules.minValue)
      .sort((left, right) => {
        const a = BigInt(String(left.value)), b = BigInt(String(right.value));
        if (a !== b) return rules.reverse ? (a < b ? -1 : 1) : (a > b ? -1 : 1);
        const leftId = BigInt(String(left.participant_id)), rightId = BigInt(String(right.participant_id));
        return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
      });
  }

  function rowInfo(row, rankId, rank) {
    return { id: String(row.participant_id), rank_id: String(rankId), rank, value: String(row.value), extra: Buffer.from(row.extra) };
  }

  function boardValue(rows, rankId, { limit, selfRoleId, rules }) {
    const all = rankSorted(rows, rules), ordered = all.slice(0, Math.min(limit, rules.maxRank));
    const selfIndex = ordered.findIndex(row => String(row.participant_id) === String(selfRoleId));
    const self = selfIndex >= 0 ? ordered[selfIndex] : rows.find(row => String(row.participant_id) === String(selfRoleId));
    return {
      rank_id: String(rankId), self_rank: selfIndex >= 0 ? selfIndex + 1 : 0,
      self_value: self ? String(self.value) : '0',
      rank_list: ordered.map(row => codec.pack('pb_rank_obj', {
        id: String(row.participant_id), value: String(row.value), extra: Buffer.from(row.extra)
      })),
      extra: Buffer.alloc(0), bubbles: bubbles(), total: String(all.length)
    };
  }

  function backupRows(db, rankId, scopeKey = DEFAULT_SCOPE, periodKey = DEFAULT_PERIOD) {
    const row = db.prepare(`SELECT entries_json FROM rank_backups
      WHERE rank_id=? AND scope_key=? AND period_key=? ORDER BY backup_id DESC LIMIT 1`)
      .get(rankId, scopeKey, periodKey);
    if (!row) return null;
    return JSON.parse(row.entries_json).map(entry => ({
      participant_id: entry.participantId, server_id: entry.serverId, value: entry.value,
      extra: Buffer.from(entry.extra, 'base64')
    }));
  }

  function rankInfo(db, rankId, participantId, scopeKey = DEFAULT_SCOPE, periodKey = DEFAULT_PERIOD) {
    const rules = configFor(tables, rankId), rows = rankSorted(currentRows(db, rankId, scopeKey, periodKey), rules);
    const index = rows.findIndex(row => String(row.participant_id) === String(participantId));
    if (index < 0) return { id: String(participantId), rank_id: String(rankId), rank: 0, value: '0', extra: Buffer.alloc(0) };
    return rowInfo(rows[index], rankId, index + 1);
  }

  function packed(schema, value) {
    return { schema, value, data: codec.pack(schema, value) };
  }

  function withRankTransaction(action) {
    if (!store?.transaction) return action(null, null);
    return store.transaction((model, db) => {
      ensureTables(db);
      synchronizeInTransaction(model, db);
      return action(model, db);
    });
  }

  function execute(type, input) {
    if (type === 2009) {
      const request = listValue(input);
      if (typeof request !== 'string') invalid('Invalid rank bubble');
      const notice = request.trim();
      if (!notice || Array.from(notice).length > MAX_BUBBLE_LENGTH) invalid('Invalid rank bubble');
      store?.transaction?.(model => { model.state.rankBubble = { id: String(model.state.roleId), notice }; });
      return { schema: 'etf-fallback', value: { id: String(store?.read?.()?.state?.roleId ?? ''), notice }, data: Buffer.alloc(0) };
    }
    const request = listValue(input);
    return withRankTransaction((model, db) => {
      const roleId = model?.state?.roleId ?? 0;
      const scopeKey = `server:${Number(model?.state?.serverId ?? 1)}`;
      if (type === 2000) {
        const rankId = singleRankId(request), rules = configFor(tables, rankId);
        return packed('rank_to_client', boardValue(currentRows(db, rankId, scopeKey), rankId, { limit: rules.showCount, selfRoleId: roleId, rules }));
      }
      if (type === 2001 || type === 2007) {
        const [rankId, participantId] = positivePair(request, ['rank ID', 'role ID']);
        configFor(tables, rankId);
        return packed('rank_info', rankInfo(db, rankId, participantId, scopeKey));
      }
      if (type === 2002) {
        const [rankId, topCount] = positivePair(request, ['rank ID', 'top count']);
        const rules = configFor(tables, rankId);
        return packed('rank_to_client', boardValue(currentRows(db, rankId, scopeKey), rankId, {
          limit: Math.min(topCount, rules.showCount), selfRoleId: roleId, rules
        }));
      }
      if (type === 2003 || type === 2010) {
        let participantId = roleId, ids;
        if (type === 2003 && Array.isArray(request) && Array.isArray(request[1])) {
          participantId = positiveInteger(request[0], 'role ID'); ids = rankIds(request[1]);
        } else if (type === 2010) {
          if (!Array.isArray(request) || request.length !== 2) invalid('Invalid batch rank info request');
          participantId = positiveInteger(request[0], 'role ID'); ids = rankIds(request[1]);
        } else ids = rankIds(request);
        return packed('pb_rev_rank', { id: String(participantId), infos: ids.map(id => rankInfo(db, id, participantId, scopeKey)) });
      }
      if (type === 2004) {
        if (!request || !Array.isArray(request.seq_ranks) || request.seq_ranks.length > MAX_RANK_IDS) invalid('Invalid batch hero rank request');
        const revRanks = request.seq_ranks.map(entry => {
          const participantId = int64(entry?.id, 'role ID');
          const ids = [...new Set((entry?.rank_id_list ?? []).map(value => Number(int64(value, 'rank ID'))))];
          if (!ids.length || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) invalid('Invalid batch hero rank request');
          return { id: participantId, infos: ids.map(id => rankInfo(db, id, participantId, scopeKey)) };
        });
        return packed('pb_batch_rev_rank', { rev_ranks: revRanks });
      }
      if (type === 2005) {
        const pair = positivePair(request, ['cross rank ID', 'rank ID']);
        const rankId = tables.configs.get(pair[1]) ? pair[1] : pair[0], rules = configFor(tables, rankId);
        const grouped = new Map();
        for (const row of rankSorted(currentRows(db, rankId, scopeKey), rules).slice(0, rules.showCount)) {
          const serverId = String(row.server_id);
          if (!grouped.has(serverId)) grouped.set(serverId, []);
          grouped.get(serverId).push(rowInfo(row, rankId, grouped.get(serverId).length + 1));
        }
        return packed('pb_rank_cross_group_top', { top_list: [...grouped].map(([serverId, rankList]) => ({ server_id: serverId, rank_list: rankList })) });
      }
      if (type === 2006) {
        const ids = rankIds(request), rankId = ids[0], rules = configFor(tables, rankId);
        return packed('rank_to_client', boardValue(currentRows(db, rankId, scopeKey), rankId, { limit: 1, selfRoleId: roleId, rules }));
      }
      if (type === 2008 || type === 2011) {
        const ids = type === 2008 ? [positiveInteger(request, 'rank ID')] : rankIds(request, { allowEmpty: true });
        const values = ids.map(rankId => {
          const rules = configFor(tables, rankId);
          const rows = backupRows(db, rankId, scopeKey) ?? currentRows(db, rankId, scopeKey);
          return boardValue(rows, rankId, { limit: rules.showCount, selfRoleId: roleId, rules });
        });
        return type === 2008 ? packed('rank_to_client', values[0]) : packed('rank_to_client_list', { client_list: values });
      }
      invalid('Unsupported ranking command');
    });
  }

  return {
    supports: type => SUPPORTED_TYPES.has(type),
    execute,
    synchronize() {
      if (!store?.transaction) return 0;
      return store.transaction((model, db) => { ensureTables(db); return synchronizeInTransaction(model, db); });
    },
    recordScore(entry) {
      if (!store?.transaction) invalid('Ranking store is unavailable');
      return store.transaction((model, db) => {
        ensureTables(db);
        const scopeKey = entry.scopeKey ?? `server:${Number(model.state.serverId ?? 1)}`;
        return writeEntry(db, { ...entry, scopeKey });
      });
    }
  };
}
