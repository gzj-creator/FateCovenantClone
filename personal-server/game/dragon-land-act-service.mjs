import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  readDragonLandTables,
  dragonLandBossesForVersion,
  dragonLandConfigForVersion
} from '../config/dragon-land-tables.mjs';
import { activityWindow, dayZero } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources, partitionGrantableResources, releaseGrantablePendingRewards } from './resources.mjs';

const ACTIVITY_LOGIN_MODULE = 92;
const RUNNING_STATE_ID = 50;
const DAY_SECONDS = 86400;
const DAILY_AWARD_TYPE = 107701;
const TRIAL_AWARD_TYPE = 107702;
const GUILD_DATA_TYPE = 107703;
const SOURCE_PREFIX = 'dragon_land_act:';
const GUILD_MODULE_ID = 24;
// ActFrameTable.ActType 1036/1037/1044/1045/1046 all point at
// lua_module=DragonLandActMgr + lua_entity=DragonLandActData, so they are the
// only activity types whose ActFrameTable.Act rows belong to this service.
const DRAGON_LAND_ACT_TYPES = new Set([1036, 1037, 1044, 1045, 1046]);

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

// The captured module 92 act entries store module_login_data as an ETF binary
// (0x83 0x6d + 4 byte length), the same envelope group buy uses for its
// pb_group_buy_act_role payload.
function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Dragon land activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

function parseAwardList(list) {
  if (!Array.isArray(list) || !list.length) throw new GameError(5, 'Dragon land award configuration is missing');
  return list.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Dragon land award configuration is invalid');
    const tid = Number(entry[0]), count = Number(entry[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, 'Dragon land award configuration is invalid');
    }
    return [tid, count];
  });
}

function parseJsonList(text) {
  try {
    const value = JSON.parse(text ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function createDragonLandActService({
  store,
  codec,
  tables,
  dragonLandTables = readDragonLandTables(),
  calendar,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const serverOpenedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
  const nowIso = () => new Date(currentSeconds() * 1000).toISOString();

  // Every dragon land activity version owns its own DragonLandActTable row, so a
  // request that names an unconfigured version must fail instead of reusing
  // another version's reward list.
  function configFor(act) {
    const config = dragonLandConfigForVersion(dragonLandTables, act.version);
    if (!config) throw new GameError(5, 'Dragon land activity version is not configured');
    return config;
  }

  function actConfig(actId) {
    const row = tables?.ActFrameAct?.get(Number(actId));
    if (!row || !DRAGON_LAND_ACT_TYPES.has(Number(row.type))) return null;
    const version = Number(row.version);
    if (!Number.isSafeInteger(version) || !dragonLandTables.versions.has(version)) return null;
    return { actId: Number(actId), config: row, version };
  }

  function withWindow(act) {
    return { ...act, window: activityWindow(act.config, serverOpenedAt) };
  }

  function started(act, at) {
    const start = Number(act.window?.start);
    return Number.isSafeInteger(start) && start <= at;
  }

  // The client scans ActFrameTable for its own running window, so prefer the
  // newest period whose configured window already started rather than the first
  // table row; all-open mode keeps every configured act visible.
  function selectActivity(activity = null, at = currentSeconds()) {
    const candidates = [...(tables?.ActFrameAct ?? [])]
      .map(([actId]) => actConfig(actId))
      .filter(Boolean)
      .map(withWindow);
    if (!candidates.length) return null;
    if (calendar?.mode === 'all-open') {
      const startedActs = candidates
        .filter(act => started(act, at))
        .sort((left, right) => right.actId - left.actId);
      const pick = startedActs[0] ?? candidates.sort((left, right) => right.actId - left.actId)[0];
      return { ...pick, start: Number(pick.window?.start ?? serverOpenedAt) };
    }
    if (!calendar?.isActivityRunning) throw new GameError(5, 'Dragon land activity calendar is unavailable');
    const running = candidates
      .filter(act => calendar.isActivityRunning(act.actId, null, activity, at))
      .sort((left, right) => right.actId - left.actId);
    if (!running.length) return null;
    return { ...running[0], start: Number(running[0].window?.start ?? serverOpenedAt) };
  }

  function requestActivity(actId, at = currentSeconds()) {
    const act = actConfig(actId);
    if (!act) throw new GameError(1, 'Unknown dragon land activity');
    const resolved = withWindow(act);
    if (calendar?.isActivityRunning && !calendar.isActivityRunning(resolved.actId, null, null, at)) {
      throw new GameError(309, 'Dragon land activity is not running');
    }
    return { ...resolved, start: Number(resolved.window?.start ?? serverOpenedAt) };
  }

  // Day 1 is the calendar day the configured window opens; the client flushes
  // its dragon land red dots and contribution grouping on the same 08:00 reset
  // that FlushTime.GetDayBegin uses.
  function dayIndex(act, at) {
    const start = Number(act.start ?? act.window?.start);
    if (!Number.isSafeInteger(start)) throw new GameError(5, 'Dragon land activity window is not configured');
    return Math.floor((dayZero(at) - dayZero(start)) / DAY_SECONDS) + 1;
  }

  function ensureDragonLandTables(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS dragon_land_role_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      piece INTEGER NOT NULL DEFAULT 0,
      seize_score INTEGER NOT NULL DEFAULT 0,
      daily_award_day INTEGER NOT NULL DEFAULT 0,
      boss_award_list_json TEXT NOT NULL DEFAULT '[]',
      challenge_times INTEGER NOT NULL DEFAULT 0,
      last_challenge_time INTEGER NOT NULL DEFAULT 0,
      max_damage INTEGER NOT NULL DEFAULT 0,
      way_list_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (role_id, act_id)
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS dragon_land_guild_state (
      guild_id TEXT NOT NULL,
      act_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      boss_id INTEGER NOT NULL DEFAULT 0,
      lost_hp INTEGER NOT NULL DEFAULT 0,
      piece INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, act_id)
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS dragon_land_contribution (
      guild_id TEXT NOT NULL,
      act_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      way_tid INTEGER NOT NULL,
      day_index INTEGER NOT NULL,
      piece INTEGER NOT NULL DEFAULT 0,
      damage INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, act_id, role_id, way_tid, day_index)
    )`);
  }

  if (store?.inspect) store.inspect(ensureDragonLandTables);

  function roleState(db, roleId, act) {
    const row = db.prepare('SELECT * FROM dragon_land_role_state WHERE role_id=? AND act_id=?').get(roleId, act.actId);
    if (row) return { ...row };
    const timestamp = nowIso();
    return {
      role_id: Number(roleId), act_id: act.actId, version: act.version,
      piece: 0, seize_score: 0, daily_award_day: 0, boss_award_list_json: '[]',
      challenge_times: 0, last_challenge_time: 0, max_damage: 0, way_list_json: '[]',
      created_at: timestamp, updated_at: timestamp
    };
  }

  function saveRoleState(db, state) {
    state.updated_at = nowIso();
    db.prepare(`INSERT INTO dragon_land_role_state (
      role_id, act_id, version, piece, seize_score, daily_award_day, boss_award_list_json,
      challenge_times, last_challenge_time, max_damage, way_list_json, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(role_id,act_id) DO UPDATE SET
      version=excluded.version,
      piece=excluded.piece,
      seize_score=excluded.seize_score,
      daily_award_day=excluded.daily_award_day,
      boss_award_list_json=excluded.boss_award_list_json,
      challenge_times=excluded.challenge_times,
      last_challenge_time=excluded.last_challenge_time,
      max_damage=excluded.max_damage,
      way_list_json=excluded.way_list_json,
      updated_at=excluded.updated_at`).run(
      state.role_id, state.act_id, state.version, Number(state.piece) || 0, Number(state.seize_score) || 0,
      Number(state.daily_award_day) || 0, state.boss_award_list_json ?? '[]',
      Number(state.challenge_times) || 0, Number(state.last_challenge_time) || 0,
      Number(state.max_damage) || 0, state.way_list_json ?? '[]', state.created_at, state.updated_at
    );
  }

  function rolePayload(state, act, at) {
    const claimed = Number(state.daily_award_day) === dayIndex(act, at);
    const payload = {
      version: String(act.version),
      piece: String(Number(state.piece) || 0),
      seize_score: String(Number(state.seize_score) || 0),
      daily_award: claimed,
      boss_award_list: parseJsonList(state.boss_award_list_json).map(String),
      challenge_times: String(Number(state.challenge_times) || 0),
      last_challenge_time: String(Number(state.last_challenge_time) || 0),
      max_damage: String(Number(state.max_damage) || 0),
      way_list: parseJsonList(state.way_list_json).map(String)
    };
    return payload;
  }

  function applyLoginEntry(activity, act, payload, at) {
    activity.act_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === act.actId);
    if (!entry) {
      entry = { state_data: { act_id: act.actId }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = act.actId;
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    if (running) running.enter_time = Number(act.start ?? at);
    else entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: Number(act.start ?? at) });
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_dragon_land_role_data', payload)).toString('base64');
    return entry;
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    const act = selectActivity(activity, at);
    if (!act) return { actId: null, version: null, start: null };
    const roleId = store.state().roleId;
    const payload = store.inspect(db => rolePayload(roleState(db, roleId, act), act, at));
    applyLoginEntry(activity, act, payload, at);
    log({ event: 'dragon_land_login_synchronized', actId: act.actId, version: act.version, start: act.start });
    return { actId: act.actId, version: act.version, start: act.start };
  }

  function refreshStoredLogin(model, db, act, roleId, at) {
    const modules = new Map(model.state.modules.value);
    const stored = modules.get(ACTIVITY_LOGIN_MODULE);
    if (!stored) return;
    const bytes = rawBinary(stored);
    if (!bytes.length) return;
    try {
      const activity = codec.unpack('pb_act_login', bytes);
      applyLoginEntry(activity, act, rolePayload(roleState(db, roleId, act), act, at), at);
      modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
      model.state.modules.value = [...modules];
    } catch (error) {
      log({ event: 'dragon_land_login_refresh_skipped', actId: act.actId, error: error?.message ?? String(error) });
    }
  }

  function activatePendingRewards() {
    const roleId = store.state().roleId;
    const hasPending = store.inspect(db => Boolean(db.prepare(
      "SELECT 1 FROM pending_rewards WHERE role_id=? AND status='pending' AND source_key LIKE 'dragon_land_act:%' LIMIT 1"
    ).get(roleId)));
    if (!hasPending) return;
    try {
      const result = store.transaction((model, db) => releaseGrantablePendingRewards(model, db, tables, { sourcePrefix: SOURCE_PREFIX }));
      if (result.released.length) log({ event: 'dragon_land_pending_rewards_released', released: result.released });
    } catch (error) {
      log({ event: 'dragon_land_pending_rewards_release_failed', error: error?.message ?? String(error) });
    }
  }

  activatePendingRewards();

  function guildIdOf(state) {
    const module = new Map(state.modules.value).get(GUILD_MODULE_ID);
    if (!module) throw new GameError(5, 'Guild login state is missing');
    let login;
    try { login = codec.unpack('pb_res_guild_login', rawBinary(module)); }
    catch { throw new GameError(5, 'Guild login state is invalid'); }
    const text = String(login.guildId ?? '0').trim();
    if (!/^[0-9]+$/.test(text)) throw new GameError(5, 'Guild login id is invalid');
    return BigInt(text) === 0n ? null : text;
  }

  function bossFor(version, level) {
    const tid = dragonLandTables.bossTidByVersionLevel.get(Number(version))?.get(Number(level));
    if (!tid) return null;
    return dragonLandTables.bosses.get(Number(tid)) ?? null;
  }

  function firstBossOf(version) {
    const rows = dragonLandBossesForVersion(dragonLandTables, version);
    if (!rows.length) return null;
    return rows.reduce((left, right) => (Number(left.level) <= Number(right.level) ? left : right));
  }

  function guildProgress(db, guildId, act) {
    const stored = db.prepare('SELECT * FROM dragon_land_guild_state WHERE guild_id=? AND act_id=?').get(guildId, act.actId);
    if (stored) return { ...stored };
    const first = firstBossOf(act.version);
    if (!first) throw new GameError(5, 'Dragon land boss configuration is missing');
    return {
      guild_id: guildId, act_id: act.actId, version: act.version,
      level: Number(first.level), boss_id: Number(first.tid), lost_hp: 0, piece: 0
    };
  }

  function saveGuildProgress(db, progress) {
    db.prepare(`INSERT INTO dragon_land_guild_state (guild_id, act_id, version, level, boss_id, lost_hp, piece, updated_at)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(guild_id,act_id) DO UPDATE SET
      version=excluded.version, level=excluded.level, boss_id=excluded.boss_id,
      lost_hp=excluded.lost_hp, piece=excluded.piece, updated_at=excluded.updated_at`).run(
      progress.guild_id, progress.act_id, progress.version, Number(progress.level) || 0,
      Number(progress.boss_id) || 0, Number(progress.lost_hp) || 0, Number(progress.piece) || 0, nowIso()
    );
  }

  // DragonLandActData:GetBossHpPercent keeps whole remaining percent with
  // ceil((hp-lost)/hp*100), and the hp_per tiers of BossAward are exactly that
  // scale (75/50/25/0), so the claim gate reuses it instead of a new ratio.
  function bossHpPercent(progress) {
    const boss = dragonLandTables.bosses.get(Number(progress.boss_id));
    if (!boss) throw new GameError(5, 'Dragon land boss configuration is missing');
    const hp = Number(boss.hp);
    if (!Number.isSafeInteger(hp) || hp <= 0) throw new GameError(5, 'Dragon land boss hit points are invalid');
    const lost = Math.max(0, Number(progress.lost_hp) || 0);
    if (lost >= hp) return 0;
    if (lost <= 0) return 100;
    return Math.ceil((hp - lost) / hp * 100);
  }

  function trialAwardReached(progress, percent, row) {
    const current = Number(progress.level);
    if (row.level < current) return true;
    if (row.level > current) return false;
    return percent <= row.hpPer;
  }

  // The dragon land fight settlement (pb_dragon_land_fight_req/rsp) is the only
  // production source of boss damage. It is not routed yet, so this hook keeps
  // the authoritative guild progress in one place instead of letting callers
  // write lost_hp directly. Recorded contributions feed the guild data reply.
  function recordBossDamage({ actId, guildId, damage, roleId = store.state().roleId, wayTid = null, piece = 0, at = currentSeconds() } = {}) {
    const amount = Number(damage);
    if (!Number.isSafeInteger(amount) || amount < 0) throw new GameError(1, 'Invalid dragon land damage');
    const guild = String(guildId ?? '').trim();
    if (!/^[0-9]+$/.test(guild) || BigInt(guild) === 0n) throw new GameError(5, 'Dragon land damage requires a guild');
    const act = requestActivity(actId, at);
    const way = wayTid === null ? null : Number(wayTid);
    if (wayTid !== null && (!Number.isSafeInteger(way) || !dragonLandTables.ways.has(way))) {
      throw new GameError(5, 'Dragon land piece source is not configured');
    }
    const gainedPiece = Number(piece) || 0;
    if (gainedPiece < 0) throw new GameError(1, 'Invalid dragon land piece amount');
    return store.transaction((model, db) => {
      const progress = guildProgress(db, guild, act);
      const boss = dragonLandTables.bosses.get(Number(progress.boss_id));
      if (!boss) throw new GameError(5, 'Dragon land boss configuration is missing');
      const hp = Number(boss.hp);
      const lost = Math.max(0, Number(progress.lost_hp) || 0);
      // One settlement applies to the current boss; damage beyond its remaining
      // hit points clears the level instead of overflowing into the next boss.
      progress.lost_hp = Math.min(hp, lost + amount);
      if (progress.lost_hp >= hp) {
        const next = bossFor(act.version, Number(progress.level) + 1);
        if (next) {
          progress.level = Number(progress.level) + 1;
          progress.boss_id = Number(next.tid);
          progress.lost_hp = 0;
        }
      }
      if (way !== null && gainedPiece > 0) {
        const day = dayIndex(act, at);
        db.prepare(`INSERT INTO dragon_land_contribution (guild_id, act_id, role_id, way_tid, day_index, piece, damage, updated_at)
        VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(guild_id,act_id,role_id,way_tid,day_index) DO UPDATE SET
          piece=piece+excluded.piece, damage=damage+excluded.damage, updated_at=excluded.updated_at`).run(
          guild, act.actId, Number(roleId), way, day, gainedPiece, amount, nowIso()
        );
      }
      saveGuildProgress(db, progress);
      return { level: Number(progress.level), bossId: Number(progress.boss_id), lostHp: Number(progress.lost_hp) };
    });
  }

  function trialAward(data) {
    let request;
    try { request = codec.unpack('pb_dragon_land_trial_award_req', data ?? Buffer.alloc(0)); }
    catch { throw new GameError(1, 'Invalid dragon land trial award request'); }
    const actId = Number(request.activity_id);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid dragon land activity id');
    const requested = (request.id_list ?? []).map(Number);
    if (!requested.length) throw new GameError(1, 'Dragon land trial award list is empty');
    for (const tid of requested) {
      if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid dragon land trial award id');
    }
    const ids = [...new Set(requested)].sort((left, right) => left - right);
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const roleId = store.state().roleId;
    const guildId = guildIdOf(store.state());
    if (!guildId) throw new GameError(311, 'Dragon land trial awards require a guild');
    const rows = ids.map(tid => {
      const row = dragonLandTables.awards.get(tid);
      if (!row || Number(row.version) !== act.version) throw new GameError(5, 'Dragon land trial award is not configured');
      const level = Number(row.level), hpPer = Number(row.hp_per);
      if (!Number.isSafeInteger(level) || level <= 0 || !Number.isSafeInteger(hpPer) || hpPer < 0 || hpPer > 100) {
        throw new GameError(5, 'Dragon land trial award configuration is invalid');
      }
      return { tid, level, hpPer, award: parseAwardList(row.award) };
    });
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      const claimed = new Set(parseJsonList(state.boss_award_list_json).map(Number));
      const progress = guildProgress(db, guildId, act);
      const percent = bossHpPercent(progress);
      const granted = [];
      for (const row of rows) {
        if (claimed.has(row.tid)) continue;
        if (!trialAwardReached(progress, percent, row)) throw new GameError(311, 'Dragon land trial award has not been reached');
        granted.push(row);
      }
      if (!granted.length) {
        const res = { changes: [] };
        log({ event: 'dragon_land_trial_award_duplicate_acknowledged', actId, ids });
        const value = { act_info: rolePayload(state, act, at), res };
        return { value, data: codec.pack('pb_dragon_land_trial_award_rsp', value) };
      }
      const awards = granted.flatMap(row => row.award);
      const partitioned = partitionGrantableResources(awards, tables);
      const res = grantResources(model, partitioned.grantable, tables);
      const createdAt = new Date(at * 1000).toISOString();
      const insertPending = db.prepare(
        'INSERT INTO pending_rewards(role_id,source_key,item_tid,quantity,res_type,reason,status,created_at) VALUES (?,?,?,?,?,?,\'pending\',?)'
      );
      for (const row of granted) {
        const sourceKey = [SOURCE_PREFIX.slice(0, -1), actId, 'trial', row.tid].join(':');
        for (const reward of partitioned.pending) {
          insertPending.run(
            roleId, sourceKey, reward.tid, reward.quantity, reward.resType,
            reward.resType === null ? reward.reason : `${reward.reason}:${reward.resType}`, createdAt
          );
        }
        claimed.add(row.tid);
      }
      state.boss_award_list_json = JSON.stringify([...claimed].sort((left, right) => left - right));
      saveRoleState(db, state);
      refreshStoredLogin(model, db, act, roleId, at);
      log({
        event: 'dragon_land_trial_award_committed', actId, ids: granted.map(row => row.tid),
        level: Number(progress.level), percent, changes: res.changes.length,
        pending: partitioned.pending.map(reward => reward.tid)
      });
      const value = { act_info: rolePayload(state, act, at), res };
      return { value, data: codec.pack('pb_dragon_land_trial_award_rsp', value) };
    });
    return { value: result.value, data: result.data, actId };
  }

  function guildData(data) {
    let request;
    try { request = codec.unpack('pb_dragon_land_guild_data_req', data ?? Buffer.alloc(0)); }
    catch { throw new GameError(1, 'Invalid dragon land guild data request'); }
    const actId = Number(request.activity_id);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid dragon land activity id');
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const state = store.state();
    const guildId = guildIdOf(state);
    if (!guildId) throw new GameError(5, 'Guild does not exist');
    const day = dayIndex(act, at);
    const value = store.inspect(db => {
      const progress = guildProgress(db, guildId, act);
      const contributions = db.prepare(
        'SELECT role_id,way_tid,day_index,piece,damage FROM dragon_land_contribution WHERE guild_id=? AND act_id=? ORDER BY role_id,way_tid,day_index'
      ).all(guildId, act.actId);
      const byRole = new Map();
      const todayByWay = new Map();
      let piece = 0;
      for (const row of contributions) {
        const roleKey = Number(row.role_id);
        const rowPiece = Number(row.piece) || 0;
        piece += rowPiece;
        if (!byRole.has(roleKey)) byRole.set(roleKey, { rid: roleKey, damage: 0, display: [] });
        const entry = byRole.get(roleKey);
        entry.damage += Number(row.damage) || 0;
        entry.display.push({ tid: Number(row.way_tid), piece: rowPiece, day: Number(row.day_index) });
        if (Number(row.day_index) === day) {
          const way = Number(row.way_tid);
          todayByWay.set(way, (todayByWay.get(way) ?? 0) + rowPiece);
        }
      }
      return {
        guild_info: {
          version: String(act.version),
          level: String(progress.level),
          piece_list: [...byRole.values()]
            .sort((left, right) => left.rid - right.rid)
            .map(entry => ({
              rid: String(entry.rid),
              damage: String(entry.damage),
              display_list: entry.display.map(item => ({
                tid: String(item.tid), piece: String(item.piece), day_index: String(item.day)
              }))
            })),
          boss_id: String(progress.boss_id),
          lost_hp: String(progress.lost_hp),
          piece: String(piece),
          display_list: [...todayByWay.entries()]
            .sort((left, right) => left[0] - right[0])
            .map(([tid, todayPiece]) => ({ tid: String(tid), piece: String(todayPiece), day_index: String(day) }))
        }
      };
    });
    log({
      event: 'dragon_land_guild_data_sent', actId, guildId,
      level: value.guild_info.level, members: value.guild_info.piece_list.length
    });
    return { value, data: codec.pack('pb_dragon_land_guild_data_rsp', value), actId, guildId };
  }

  function dailyAward(data) {
    let request;
    try { request = codec.unpack('pb_dragon_land_daily_award_req', data ?? Buffer.alloc(0)); }
    catch { throw new GameError(1, 'Invalid dragon land daily award request'); }
    const actId = Number(request.activity_id);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid dragon land activity id');
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const config = configFor(act);
    const awards = parseAwardList(config.award_day);
    const day = dayIndex(act, at);
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      if (Number(state.daily_award_day) === day) {
        const res = { changes: [] };
        log({ event: 'dragon_land_daily_award_duplicate_acknowledged', actId, day });
        const value = { act_info: rolePayload(state, act, at), res };
        return { value, data: codec.pack('pb_dragon_land_daily_award_rsp', value) };
      }
      const partitioned = partitionGrantableResources(awards, tables);
      const res = grantResources(model, partitioned.grantable, tables);
      const createdAt = new Date(at * 1000).toISOString();
      const sourceKey = [SOURCE_PREFIX.slice(0, -1), actId, 'daily', day].join(':');
      const insertPending = db.prepare(
        'INSERT INTO pending_rewards(role_id,source_key,item_tid,quantity,res_type,reason,status,created_at) VALUES (?,?,?,?,?,?,\'pending\',?)'
      );
      for (const reward of partitioned.pending) {
        insertPending.run(
          roleId, sourceKey, reward.tid, reward.quantity, reward.resType,
          reward.resType === null ? reward.reason : `${reward.reason}:${reward.resType}`, createdAt
        );
      }
      state.daily_award_day = day;
      saveRoleState(db, state);
      refreshStoredLogin(model, db, act, roleId, at);
      log({
        event: 'dragon_land_daily_award_committed', actId, day,
        changes: res.changes.length, pending: partitioned.pending.map(reward => reward.tid)
      });
      const value = { act_info: rolePayload(state, act, at), res };
      // Encoding stays inside the transaction so a serialisation failure rolls
      // the grant and the day marker back together.
      return { value, data: codec.pack('pb_dragon_land_daily_award_rsp', value) };
    });
    return { value: result.value, data: result.data, actId, day };
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE,
    supports: type => [DAILY_AWARD_TYPE, TRIAL_AWARD_TYPE, GUILD_DATA_TYPE].includes(Number(type)),
    currentActivity: (at = currentSeconds()) => selectActivity(null, at),
    dayIndex,
    synchronizeLogin,
    recordBossDamage,
    guildId: () => guildIdOf(store.state()),
    execute(type, data) {
      switch (Number(type)) {
        case DAILY_AWARD_TYPE: return dailyAward(data);
        case TRIAL_AWARD_TYPE: return trialAward(data);
        case GUILD_DATA_TYPE: return guildData(data);
        default: throw new GameError(5, 'Dragon land command is not implemented');
      }
    }
  };
}
