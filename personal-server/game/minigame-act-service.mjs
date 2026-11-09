import { decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { awardPairs, readMinigameActTables, rowsOfVersion, weightedPick } from '../config/minigame-act-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { currentTaskProgress } from './task-service.mjs';
import { setBit } from './bit-block.mjs';

// G2 exploration / mini-game block. Commands keep authoritative state in
// SQLite, spend and grant through resources.mjs, and answer with the response
// schema the client parses. Rules the shipped client does not expose (board
// simulation, guild social data, shared task counters) fail closed with code 5
// instead of inventing an outcome.
const LOGIN_MODULE = 92;
const RUNNING_STATE_ID = 50;
const DAY_SECONDS = 86400;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function wrapEtfBinary(bytes) {
  const payload = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(payload.length, 2);
  return Buffer.concat([header, payload]);
}

function resOf(granted) {
  return { changes: granted?.changes ?? [], is_overflow: false };
}

function bitmask(indices, size) {
  const bytes = Buffer.alloc(Math.max(1, Math.ceil(size / 8)));
  for (const value of indices ?? []) {
    const index = Number(value);
    if (!Number.isSafeInteger(index) || index < 0 || index >= size) continue;
    bytes[index >> 3] |= 1 << (index & 7);
  }
  return bytes;
}

export function createMinigameActService({
  store,
  codec,
  tables,
  minigameTables = readMinigameActTables(),
  calendar,
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Mini-game store is unavailable');
  const t = minigameTables;
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const iso = at => new Date(at * 1000).toISOString();

  function taskProgress(ctx, config) {
    const typeConfig = tables.TaskType?.get(Number(config.task_type));
    if (typeConfig?.progress_type === 0) return 1;
    return currentTaskProgress(ctx.model, config, codec, tables);
  }

  store.inspect(db => {
    db.exec('CREATE TABLE IF NOT EXISTS minigame_act_state (' +
      'role_id INTEGER NOT NULL REFERENCES roles(role_id),' +
      'act_key TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL,' +
      'updated_at TEXT NOT NULL, PRIMARY KEY (role_id, act_key, kind))');
    db.exec('CREATE TABLE IF NOT EXISTS minigame_act_claims (' +
      'role_id INTEGER NOT NULL REFERENCES roles(role_id),' +
      'act_key TEXT NOT NULL, claim_key TEXT NOT NULL, created_at TEXT NOT NULL,' +
      'PRIMARY KEY (role_id, act_key, claim_key))');
    db.exec('CREATE TABLE IF NOT EXISTS minigame_act_records (' +
      'role_id INTEGER NOT NULL REFERENCES roles(role_id),' +
      'act_key TEXT NOT NULL, record_key TEXT NOT NULL, data TEXT NOT NULL,' +
      'created_at TEXT NOT NULL, PRIMARY KEY (role_id, act_key, record_key))');
  });

  function loadState(db, roleId, actKey, kind = 'main') {
    const row = db.prepare('SELECT data FROM minigame_act_state WHERE role_id=? AND act_key=? AND kind=?')
      .get(Number(roleId), actKey, kind);
    if (!row) return {};
    try {
      const value = JSON.parse(row.data);
      return value && typeof value === 'object' ? value : {};
    } catch {
      throw new GameError(5, 'Mini-game state is corrupt: ' + actKey);
    }
  }

  function saveState(db, roleId, actKey, state, at, kind = 'main') {
    db.prepare('INSERT INTO minigame_act_state (role_id, act_key, kind, data, updated_at)' +
      ' VALUES (?,?,?,?,?) ON CONFLICT(role_id,act_key,kind) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
      .run(Number(roleId), actKey, kind, JSON.stringify(state), iso(at));
  }

  function saveRecord(db, roleId, actKey, recordKey, data, at) {
    db.prepare('INSERT INTO minigame_act_records (role_id, act_key, record_key, data, created_at)' +
      ' VALUES (?,?,?,?,?) ON CONFLICT(role_id,act_key,record_key) DO NOTHING')
      .run(Number(roleId), actKey, recordKey, JSON.stringify(data), iso(at));
  }

  function isClaimed(db, roleId, actKey, claimKey) {
    return Boolean(db.prepare('SELECT 1 FROM minigame_act_claims WHERE role_id=? AND act_key=? AND claim_key=?')
      .get(Number(roleId), actKey, claimKey));
  }

  function markClaimed(db, roleId, actKey, claimKey, at) {
    db.prepare('INSERT INTO minigame_act_claims (role_id, act_key, claim_key, created_at) VALUES (?,?,?,?)')
      .run(Number(roleId), actKey, claimKey, iso(at));
  }

  function awardsOf(value, label) {
    try {
      return awardPairs(value, label);
    } catch (error) {
      throw new GameError(5, error.message);
    }
  }

  function requireRow(family, tid, label) {
    const row = family?.byTid?.get(Number(tid));
    if (!row) throw new GameError(5, (label || 'Row') + ' is not configured: ' + tid);
    return row;
  }

  function assertActivity(actId, allowed, label) {
    const id = Number(actId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, 'Invalid ' + label + ' activity id');
    const act = tables?.ActFrameAct?.get(id);
    if (!act) throw new GameError(1, 'Unknown ' + label + ' activity: ' + id);
    if (!allowed.includes(Number(act.type))) throw new GameError(1, 'Activity ' + id + ' is not a ' + label + ' activity');
    return { actId: id, act, version: Number(act.version) };
  }

  function assertRunning(actId, at, label) {
    if (!calendar?.isActivityRunning) throw new GameError(5, label + ' activity calendar is unavailable');
    if (!calendar.isActivityRunning(Number(actId), null, null, at)) {
      throw new GameError(309, label + ' activity is not running');
    }
  }

  function unpackPb(schema, bytes) {
    try {
      return codec.unpack(schema, bytes ?? Buffer.alloc(0));
    } catch {
      throw new GameError(1, 'Invalid mini-game request');
    }
  }

  function normalizeEtf(decoded) {
    const raw = decoded && typeof decoded === 'object' && 'value' in decoded ? decoded.value : decoded;
    if (typeof raw === 'number') return { value: raw };
    if (typeof raw === 'string') return { value: raw };
    if (Array.isArray(raw)) return { value: Number(raw[0]), values: raw };
    if (raw && typeof raw === 'object') {
      const fields = {};
      for (const [key, value] of Object.entries(raw)) {
        const number = Number(value && typeof value === 'object' && 'value' in value ? value.value : value);
        fields[key] = Number.isFinite(number) ? number : value;
      }
      const first = fields.value ?? fields.act_id ?? fields.act_tid ?? fields.tid;
      return { fields, value: Number.isFinite(Number(first)) ? Number(first) : undefined };
    }
    return {};
  }

  async function etfRequest(bytes) {
    const buffer = bytes ?? Buffer.alloc(0);
    if (!buffer.length) return {};
    let decoded;
    try {
      decoded = await decodeEtf(buffer);
    } catch {
      throw new GameError(1, 'Invalid mini-game request payload');
    }
    return normalizeEtf(decoded);
  }

  const openedAt = () => Number(calendar?.serverOpenedAt ?? 0);
  function dayIndex(at) {
    const opened = openedAt();
    if (!Number.isFinite(opened) || opened <= 0) return Math.floor(at / DAY_SECONDS);
    return Math.max(0, Math.floor((at - opened) / DAY_SECONDS));
  }

  function run(key, handler) {
    return store.transaction((model, db) => {
      const at = currentSeconds();
      const ctx = { model, db, at, roleId: Number(store.state().roleId), day: dayIndex(at) };
      const outcome = handler(ctx);
      if (!outcome || typeof outcome !== 'object' || !('schema' in outcome)) {
        throw new GameError(5, 'Mini-game command produced no response');
      }
      return {
        value: outcome.value ?? {},
        data: outcome.schema ? codec.pack(outcome.schema, outcome.value ?? {}) : Buffer.alloc(0),
        actKey: outcome.actKey ?? key,
        ...(outcome.meta ?? {})
      };
    });
  }

  function grant(ctx, awards, label) {
    if (!awards.length) return { changes: [] };
    try {
      return grantResources(ctx.model, awards, tables, { codec, now: () => ctx.at });
    } catch (error) {
      if (error instanceof GameError) throw error;
      throw new GameError(5, (label || 'Mini-game') + ' reward is not grantable: ' + error.message);
    }
  }

  function spend(ctx, costs, label) {
    if (!costs.length) return { changes: [] };
    try {
      return consumeResources(ctx.model, costs, 301, { codec, now: () => ctx.at });
    } catch (error) {
      if (error instanceof GameError) throw error;
      throw new GameError(5, (label || 'Mini-game') + ' cost is not spendable: ' + error.message);
    }
  }

  function grantClaim(ctx, actKey, claimKey, awards, label) {
    if (isClaimed(ctx.db, ctx.roleId, actKey, claimKey)) return null;
    const granted = grant(ctx, awards, label);
    markClaimed(ctx.db, ctx.roleId, actKey, claimKey, ctx.at);
    return granted;
  }

  function applyLoginEntry(activity, actId, payload, at) {
    activity.act_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === Number(actId));
    if (!entry) {
      entry = { state_data: { act_id: Number(actId) }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = Number(actId);
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === RUNNING_STATE_ID);
    if (running) running.enter_time = String(at);
    else entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: String(at) });
    entry.module_login_data = wrapEtfBinary(payload).toString('base64');
    return entry;
  }

  function refreshStoredLogin(ctx, actId, builder) {
    const modules = new Map(ctx.model.state.modules.value);
    const stored = modules.get(LOGIN_MODULE);
    if (!stored) return;
    const bytes = rawBinary(stored);
    if (!bytes.length) return;
    try {
      const activity = codec.unpack('pb_act_login', bytes);
      applyLoginEntry(activity, actId, builder(), ctx.at);
      modules.set(LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
      ctx.model.state.modules.value = [...modules];
    } catch (error) {
      log({ event: 'minigame_login_refresh_skipped', actId, error: error?.message ?? String(error) });
    }
  }

  function runningActIds(types, at) {
    const result = [];
    for (const [actId, act] of tables?.ActFrameAct ?? []) {
      if (!types.includes(Number(act.type))) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(Number(actId), null, null, at)) continue;
      result.push(Number(actId));
    }
    return result.sort((left, right) => left - right);
  }

  const commands = new Map();
  function register(type, spec) {
    const id = Number(type);
    if (commands.has(id)) throw new Error('Duplicate mini-game command: ' + id);
    const handler = spec.handler;
    commands.set(id, {
      type: id,
      card: spec.card,
      encoding: spec.encoding ?? 'pb',
      request: spec.request ?? null,
      handler
    });
  }

  // ---- PLAY-PUZZLEACT (102001/102002) -------------------------------------
  function puzzleKey(versionId) { return 'puzzle:' + versionId; }
  function puzzleRole(state, versionId) {
    const tasks = t.puzzle.Task.rows.filter(row => Number(row.version) === Number(versionId));
    const progressRows = t.puzzle.Progress.rows.filter(row => Number(row.version) === Number(versionId));
    const done = Object.keys(state.tasks ?? {}).map(Number)
      .filter(tid => tasks.some(task => Number(task.tid) === tid));
    const taskBits = done.map(tid => tasks.findIndex(task => Number(task.tid) === tid));
    const progressBits = (state.claimed_progress ?? []).map(tid => progressRows.findIndex(row => Number(row.tid) === Number(tid)));
    return {
      act_id: String(versionId),
      task_state: bitmask(taskBits, Math.max(1, tasks.length)),
      puzzle_state: bitmask(taskBits, Math.max(1, tasks.length)),
      progress_state: bitmask(progressBits, Math.max(1, progressRows.length))
    };
  }

  register(102001, {
    card: 'PLAY-PUZZLEACT', encoding: 'pb', request: 'pb_puzzle_act_req',
    handler: request => run('puzzle', ctx => {
      const versionId = Number(request.act_id);
      const version = requireRow(t.puzzle.Version, versionId, 'Puzzle activity');
      const task = requireRow(t.puzzle.Task, request.tid, 'Puzzle task');
      if (Number(task.version) !== versionId) throw new GameError(1, 'Puzzle task does not belong to this activity');
      const key = puzzleKey(versionId);
      const state = loadState(ctx.db, ctx.roleId, key);
      state.tasks = state.tasks && typeof state.tasks === 'object' ? state.tasks : {};
      if (state.tasks[task.tid]) throw new GameError(311, 'Puzzle cell is already finished');
      state.tasks[task.tid] = ctx.at;
      // Every finished puzzle cell pays the version award; the client table has
      // no per-cell award column, so Version.award * Version.award_cnt is the
      // only configured payout for a cell.
      const granted = grant(ctx, awardsOf([[Number(version.award), Number(version.award_cnt)]], 'PuzzleAct Version.award'), 'Puzzle');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_puzzle_act_back', actKey: key, value: { res: resOf(granted), puzzle_act: puzzleRole(state, versionId) } };
    })
  });

  register(102002, {
    card: 'PLAY-PUZZLEACT', encoding: 'pb', request: 'pb_puzzle_act_req',
    handler: request => run('puzzle', ctx => {
      const versionId = Number(request.act_id);
      requireRow(t.puzzle.Version, versionId, 'Puzzle activity');
      const row = requireRow(t.puzzle.Progress, request.tid, 'Puzzle progress award');
      if (Number(row.version) !== versionId) throw new GameError(1, 'Puzzle progress award does not belong to this activity');
      const key = puzzleKey(versionId);
      const state = loadState(ctx.db, ctx.roleId, key);
      state.tasks = state.tasks ?? {};
      state.claimed_progress = Array.isArray(state.claimed_progress) ? state.claimed_progress : [];
      if (Object.keys(state.tasks).length < Number(row.progress)) throw new GameError(311, 'Puzzle progress is not reached');
      if (state.claimed_progress.includes(Number(row.tid))) throw new GameError(311, 'Puzzle progress award is already claimed');
      const granted = grantClaim(ctx, key, 'progress:' + row.tid, awardsOf(row.award, 'PuzzleAct Progress.award'), 'Puzzle progress');
      state.claimed_progress.push(Number(row.tid));
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_res_to_client', actKey: key, value: resOf(granted) };
    })
  });

  // ---- PLAY-TILESWAP (102501) ---------------------------------------------
  register(102501, {
    card: 'PLAY-TILESWAP', encoding: 'etf',
    handler: request => run('tile_swap', ctx => {
      const version = Number(request.fields?.version ?? 1);
      requireRow(t.tileSwap.Version, version, 'TileSwap version');
      const turns = rowsOfVersion(t.tileSwap.Turn, version).sort((left, right) => Number(left.tid) - Number(right.tid));
      if (!turns.length) throw new GameError(5, 'TileSwap turn list is not configured');
      const key = 'tile_swap:' + version;
      const state = loadState(ctx.db, ctx.roleId, key);
      state.groups = Array.isArray(state.groups) ? state.groups : [];
      const index = turns.findIndex(row => Number(row.tid) === Number(state.cur_turn));
      const next = turns[(index + 1) % turns.length];
      state.cur_turn = Number(next.tid);
      for (const group of next.group ?? []) state.groups.push(Number(group));
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_tile_swap', actKey: key,
        value: { version, cur_turn: Number(next.tid), group_list: state.groups.slice(-64) },
        meta: { version, curTurn: Number(next.tid) }
      };
    })
  });

  // ---- PLAY-MUSHROOMMONSTER (102601/102602/102603) ------------------------
  const MUSHROOM_KEY = 'mushroom:1';
  function mushroomVersion() {
    return requireRow(t.mushroom.MushroomMonster, 1, 'Mushroom monster version');
  }
  function mushroomDaily(state, day, at) {
    if (Number(state.day) === Number(day)) return;
    state.day = Number(day);
    state.cur_day_times = 0;
    state.best_day_times = 0;
    state.day_start = Math.floor(at / DAY_SECONDS) * DAY_SECONDS;
  }
  function mushroomRole(state) {
    return {
      max_score: String(Number(state.max_score ?? 0)),
      cur_day_times: Number(state.cur_day_times ?? 0),
      award_state: bitmask((state.claims ?? []).map(Number).map(tid => t.mushroom.ActAward.rows.findIndex(row => Number(row.tid) === tid)), t.mushroom.ActAward.rows.length),
      start_hit_time: String(Number(state.start_hit_time ?? 0)),
      last_refresh_time: String(Number(state.day_start ?? 0)),
      game_times: Number(state.game_times ?? 0)
    };
  }

  register(102601, {
    card: 'PLAY-MUSHROOMMONSTER', encoding: 'etf',
    handler: () => run('mushroom', ctx => {
      const version = mushroomVersion();
      const state = loadState(ctx.db, ctx.roleId, MUSHROOM_KEY);
      mushroomDaily(state, ctx.day, ctx.at);
      if (Number(state.start_hit_time ?? 0) > 0) throw new GameError(311, 'Mushroom run is already in progress');
      if (Number(state.cur_day_times ?? 0) >= Number(version.fight_count)) throw new GameError(311, 'Mushroom daily attempts are exhausted');
      state.start_hit_time = ctx.at;
      state.cur_day_times = Number(state.cur_day_times ?? 0) + 1;
      state.best_day_times = Math.max(Number(state.best_day_times ?? 0), Number(state.cur_day_times));
      state.game_times = Number(state.game_times ?? 0) + 1;
      state.claims = Array.isArray(state.claims) ? state.claims : [];
      saveState(ctx.db, ctx.roleId, MUSHROOM_KEY, state, ctx.at);
      return { schema: 'pb_mushroom_monster', actKey: MUSHROOM_KEY, value: mushroomRole(state) };
    })
  });

  register(102602, {
    card: 'PLAY-MUSHROOMMONSTER', encoding: 'etf',
    handler: request => run('mushroom', ctx => {
      const version = mushroomVersion();
      const state = loadState(ctx.db, ctx.roleId, MUSHROOM_KEY);
      mushroomDaily(state, ctx.day, ctx.at);
      if (!Number(state.start_hit_time ?? 0)) throw new GameError(311, 'Mushroom run has not started');
      const score = Number(request.value);
      if (!Number.isSafeInteger(score) || score < 0) throw new GameError(5, 'Mushroom score payload is not recovered');
      // The client table carries no per-run upper bound; the run score is the
      // only client-reported value, so it is stored as the role best score.
      state.max_score = Math.max(Number(state.max_score ?? 0), score);
      state.start_hit_time = 0;
      saveState(ctx.db, ctx.roleId, MUSHROOM_KEY, state, ctx.at);
      return {
        schema: 'pb_mushroom_monster_end_rev', actKey: MUSHROOM_KEY,
        value: { monster_data: mushroomRole(state), rank_id: 0 },
        meta: { score }
      };
    })
  });

  register(102603, {
    card: 'PLAY-MUSHROOMMONSTER', encoding: 'etf',
    handler: request => run('mushroom', ctx => {
      const row = requireRow(t.mushroom.ActAward, request.value ?? 1, 'Mushroom award');
      const state = loadState(ctx.db, ctx.roleId, MUSHROOM_KEY);
      mushroomDaily(state, ctx.day, ctx.at);
      state.claims = Array.isArray(state.claims) ? state.claims : [];
      if (Number(state.best_day_times ?? 0) < Number(row.need_times)) throw new GameError(311, 'Mushroom award attempts are not reached');
      if (state.claims.includes(Number(row.tid))) throw new GameError(311, 'Mushroom award is already claimed');
      const granted = grant(ctx, [[Number(row.award_item), Number(row.award_count)]], 'Mushroom');
      state.claims.push(Number(row.tid));
      state.max_score = Math.max(Number(state.max_score ?? 0), Number(row.daily_act_val) * 0);
      saveState(ctx.db, ctx.roleId, MUSHROOM_KEY, state, ctx.at);
      return { schema: 'pb_mushroom_monster_award_rev', actKey: MUSHROOM_KEY, value: { monster_data: mushroomRole(state), res: resOf(granted) } };
    })
  });

  // ---- PLAY-GOPHERACT (103201) -------------------------------------------
  function gopherState(ctx, versionId) {
    const key = 'gopher:' + versionId;
    const state = loadState(ctx.db, ctx.roleId, key);
    if (Number(state.day) !== Number(ctx.day)) {
      state.day = Number(ctx.day);
      state.day_awards = [];
    }
    state.start_time = Number(state.start_time ?? ctx.at);
    state.awards = Array.isArray(state.awards) ? state.awards : [];
    return { key, state };
  }
  function gopherPerson(state, versionId) {
    return {
      version: versionId,
      score: Number(state.score ?? 0),
      start_time: String(Number(state.start_time ?? 0)),
      award_list: [{ day_index: Number(state.day ?? 0), award_id_list: (state.day_awards ?? []).map(Number) }]
    };
  }

  register(103201, {
    card: 'PLAY-GOPHERACT', encoding: 'auto', request: 'pb_beat_gopher_req',
    handler: request => run('gopher', ctx => {
      const versionId = Number(request.version ?? request.fields?.version ?? 1);
      const version = requireRow(t.gopher.BeatGopherVersion, versionId, 'Gopher version');
      const score = Number(request.score ?? request.fields?.score);
      if (!Number.isSafeInteger(score) || score < Number(version.score_min) || score > Number(version.score_max)) {
        throw new GameError(1, 'Invalid gopher score');
      }
      const { key, state } = gopherState(ctx, versionId);
      state.score = Math.max(Number(state.score ?? 0), score);
      const awards = [];
      for (const row of t.gopher.BeatGopherScoreAward.rows) {
        if (Number(row.version) !== versionId) continue;
        if (score < Number(row.score)) continue;
        if (state.day_awards.includes(Number(row.tid))) continue;
        awards.push(...awardsOf(row.award_list, 'Gopher score award'));
        state.day_awards.push(Number(row.tid));
      }
      const granted = grant(ctx, awards, 'Gopher');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_beat_gopher_back', actKey: key,
        value: { person: gopherPerson(state, versionId), rank: 0, res: resOf(granted) },
        meta: { score, awards: awards.length }
      };
    })
  });

  // ---- PLAY-TOWERACT (104301/104302/104303) ------------------------------
  const TOWER_TYPES = [176];
  function towerConfig(actId) { return assertActivity(actId, TOWER_TYPES, 'tower'); }
  function towerStateFor(ctx, actId) {
    const key = 'tower:' + actId;
    const state = loadState(ctx.db, ctx.roleId, key);
    state.step = Number(state.step ?? 0);
    state.award_group = Number(state.award_group ?? 1);
    state.turn = Number(state.turn ?? 1);
    state.task_claims = Array.isArray(state.task_claims) ? state.task_claims.map(Number) : [];
    return { key, state };
  }
  function towerRole(state, actId) {
    return {
      act_tid: actId,
      step: Number(state.step ?? 0),
      award_list: [],
      got_task_award: towerTaskBits(state),
      award_group: Number(state.award_group ?? 1),
      turn: Number(state.turn ?? 1)
    };
  }
  function towerTaskBits(state) {
    let bits = Buffer.alloc(0);
    for (const tid of state.task_claims ?? []) bits = setBit(bits, Number(tid) % 100);
    return bits;
  }
  function towerRatio(stepRatio, index) {
    let start = 0;
    for (const entry of stepRatio ?? []) {
      const limit = Number(entry[0]);
      const value = Number(entry[1]);
      if (index < start + limit) return value;
      start += limit;
    }
    return 1;
  }

  register(104301, {
    card: 'PLAY-TOWERACT', encoding: 'pb', request: 'pb_tower_act_step_req',
    handler: request => run('tower', ctx => {
      const { actId, version } = towerConfig(request.act_tid);
      const config = requireRow(t.tower.TowerAct, version, 'TowerAct version');
      assertRunning(actId, ctx.at, 'Tower');
      const requested = Number(request.step) || 1;
      if (!Number.isSafeInteger(requested) || requested <= 0) throw new GameError(1, 'Invalid tower step');
      const { key, state } = towerStateFor(ctx, actId);
      const from = Number(state.step);
      const to = Math.min(Number(config.max_step), from + requested);
      if (to <= from) throw new GameError(311, 'Tower step limit is reached');
      const costs = new Map();
      for (let index = from; index < to; index += 1) {
        const ratio = towerRatio(config.step_ratio, index);
        costs.set(Number(config.step_cost), (costs.get(Number(config.step_cost)) ?? 0) + ratio);
      }
      const spent = spend(ctx, [...costs], 'Tower');
      const awards = [];
      for (const row of t.tower.Award.rows) {
        const step = Number(row.step);
        if (step <= from || step > to) continue;
        if (Number(row.group) !== Number(state.award_group)) continue;
        if (isClaimed(ctx.db, ctx.roleId, key, 'award:' + row.tid)) continue;
        awards.push(...awardsOf([[Number(row.award_id), Number(row.award_num)]], 'Tower award'));
        markClaimed(ctx.db, ctx.roleId, key, 'award:' + row.tid, ctx.at);
      }
      const granted = grant(ctx, awards, 'Tower');
      state.step = to;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_tower_act_role', towerRole(state, actId)));
      return {
        schema: 'pb_tower_act_slot_rsp', actKey: key,
        value: {
          act_data: towerRole(state, actId),
          res_change: resOf({ changes: [...(spent.changes ?? []), ...(granted.changes ?? [])] }),
          steps: [requested]
        },
        meta: { from, to }
      };
    })
  });

  register(104302, {
    card: 'PLAY-TOWERACT', encoding: 'pb', request: 'pb_tower_act_switch_req',
    handler: request => run('tower', ctx => {
      const { actId, version } = towerConfig(request.act_tid);
      assertRunning(actId, ctx.at, 'Tower');
      const group = Number(request.group);
      const choices = rowsOfVersion(t.tower.TurnChoose, version);
      if (!choices.length) throw new GameError(5, 'Tower turn choices are not configured');
      const { key, state } = towerStateFor(ctx, actId);
      const turn = Number(state.turn);
      const choice = choices
        .filter(row => Number(row.turn_range) >= turn)
        .sort((left, right) => Number(left.turn_range) - Number(right.turn_range))[0];
      if (!choice) throw new GameError(311, 'Tower turn is out of range');
      if (!(choice.group_lib ?? []).map(Number).includes(group)) throw new GameError(1, 'Tower award group is not offered this turn');
      state.award_group = group;
      state.turn = turn + 1;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_tower_act_role', towerRole(state, actId)));
      return { schema: 'pb_tower_act_role', actKey: key, value: towerRole(state, actId) };
    })
  });

  register(104303, {
    card: 'PLAY-TOWERACT', encoding: 'pb', request: 'pb_tower_act_task_req',
    handler: request => run('tower', ctx => {
      const { actId, version } = towerConfig(request.act_tid);
      assertRunning(actId, ctx.at, 'Tower');
      const ids = (request.task_id ?? []).map(Number);
      if (!ids.length) throw new GameError(1, 'Tower task list is empty');
      if (new Set(ids).size !== ids.length) throw new GameError(1, 'Tower task list contains duplicates');
      const { key, state } = towerStateFor(ctx, actId);
      const awards = [];
      for (const tid of ids) {
        const row = requireRow(t.tower.Task, tid, 'Tower task');
        if (Number(row.version) !== version) throw new GameError(1, 'Tower task does not belong to this version');
        if (state.task_claims.includes(Number(row.tid))) throw new GameError(311, 'Tower task is already claimed');
        const progress = taskProgress(ctx, row);
        if (progress < Number(row.task_count)) throw new GameError(311, 'Tower task is not complete');
        awards.push(...awardsOf(row.award, 'Tower task award'));
        state.task_claims.push(Number(row.tid));
      }
      const granted = grant(ctx, awards, 'Tower task');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_tower_act_role', towerRole(state, actId)));
      return {
        schema: 'pb_tower_act_task_rsp', actKey: key,
        value: { act_data: towerRole(state, actId), res_change: resOf(granted) }
      };
    })
  });

  // ---- PLAY-SPIRITCOURTYARD (105001-105016) ------------------------------
  const SPIRIT_KEY = 'spirit:1';
  function spiritState(ctx) {
    const state = loadState(ctx.db, ctx.roleId, SPIRIT_KEY);
    state.intimacy = Number(state.intimacy ?? 0);
    state.intimacy_lv = Number(state.intimacy_lv ?? 1);
    state.lands = Array.isArray(state.lands) && state.lands.length ? state.lands : [{ id: 1, crop_tid: 0, update_time: 0, mature_time: 0 }];
    state.entrusts = Array.isArray(state.entrusts) ? state.entrusts : [];
    state.task_claims = Array.isArray(state.task_claims) ? state.task_claims : [];
    state.publish_count = Number(state.publish_count ?? 0);
    return state;
  }
  function spiritLand(land) {
    return {
      id: Number(land.id),
      crop_tid: Number(land.crop_tid ?? 0),
      update_time: String(Number(land.update_time ?? 0)),
      mature_time: String(Number(land.mature_time ?? 0)),
      fix_award_list: []
    };
  }
  function spiritEntrust(entrust) {
    return {
      uid: String(Number(entrust.uid ?? 0)),
      tid: Number(entrust.tid ?? 0),
      lib_tid_list: (entrust.lib ?? []).map(Number),
      is_public: Boolean(entrust.is_public),
      is_finish: Boolean(entrust.is_finish),
      role_id: String(Number(entrust.role_id ?? 0)),
      assist_role_id: String(Number(entrust.assist_role_id ?? 0))
    };
  }
  function spiritRole(state) {
    return {
      intimacy: Number(state.intimacy ?? 0),
      intimacy_lv: Number(state.intimacy_lv ?? 1),
      land_list: state.lands.map(spiritLand),
      entrust_times: Number(state.entrust_count ?? 0),
      entrust_task_list: state.entrusts.map(spiritEntrust),
      assist_times: Number(state.assist_times ?? 0),
      is_get_task_rewards: bitmask(state.task_claims, t.spirit.IntimacyTask.rows.length)
    };
  }
  function spiritGuild() {
    return { entrust_task_list: [], banquet_total_score: 0, banquet_role_list: [], update_time: '0', reward_type: 0, fruit_lib_types: [], order_id: 0 };
  }
  function spiritOutputFor(crop) {
    return t.spirit.CropOutput.rows.find(row => Number(row.belong) === Number(crop.type))
      ?? t.spirit.CropOutput.rows[0];
  }

  register(105001, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_tree_plant',
    handler: request => run('spirit', ctx => {
      const list = Array.isArray(request.plant_list) ? request.plant_list : [];
      if (!list.length) throw new GameError(1, 'Spirit courtyard plant list is empty');
      const state = spiritState(ctx);
      for (const item of list) {
        const land = state.lands.find(candidate => Number(candidate.id) === Number(item.id));
        if (!land) throw new GameError(311, 'Spirit courtyard land is not unlocked');
        if (Number(land.crop_tid)) throw new GameError(311, 'Spirit courtyard land is occupied');
        const crop = requireRow(t.spirit.Crop, item.tree_tid, 'Spirit courtyard crop');
        const output = spiritOutputFor(crop);
        land.crop_tid = Number(crop.tid);
        land.update_time = ctx.at;
        land.mature_time = ctx.at + Number(output?.total_duration ?? 3600);
      }
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_rsp_spirit_courtyard_tree_plant', actKey: SPIRIT_KEY, value: { land: state.lands.map(spiritLand), res: resOf({ changes: [] }) } };
    })
  });

  register(105002, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'etf',
    handler: () => run('spirit', ctx => {
      const state = spiritState(ctx);
      const awards = [];
      for (const land of state.lands) {
        if (!Number(land.crop_tid)) continue;
        if (Number(land.mature_time) > ctx.at) continue;
        const crop = requireRow(t.spirit.Crop, land.crop_tid, 'Spirit courtyard crop');
        const output = spiritOutputFor(crop);
        for (const [libTid, count] of output.award ?? []) {
          const lib = requireRow(t.spirit.CropOutputLib, libTid, 'Spirit courtyard crop output');
          for (let index = 0; index < Number(count); index += 1) awards.push(...awardsOf(lib.award, 'Spirit courtyard crop reward'));
        }
        land.crop_tid = 0;
        land.update_time = ctx.at;
        land.mature_time = 0;
      }
      const granted = grant(ctx, awards, 'Spirit courtyard');
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return {
        schema: 'pb_rsp_spirit_courtyard_tree_get', actKey: SPIRIT_KEY,
        value: { land: state.lands.map(spiritLand), res: resOf(granted), show_res: [] }
      };
    })
  });

  register(105003, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'etf',
    handler: () => run('spirit', ctx => {
      const state = spiritState(ctx);
      const next = t.spirit.Land.rows.find(row => !state.lands.some(land => Number(land.id) === Number(row.tid)));
      if (!next) throw new GameError(311, 'Spirit courtyard land list is complete');
      if (Number(state.intimacy_lv) < Number(next.intimacy_level)) throw new GameError(311, 'Spirit courtyard intimacy level is not reached');
      state.lands.push({ id: Number(next.tid), crop_tid: 0, update_time: 0, mature_time: 0 });
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_rsp_spirit_courtyard_tree_get', actKey: SPIRIT_KEY, value: { land: state.lands.map(spiritLand), res: resOf({ changes: [] }), show_res: [] } };
    })
  });

  register(105004, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'etf',
    handler: request => run('spirit', ctx => {
      const state = spiritState(ctx);
      const land = state.lands.find(candidate => Number(candidate.id) === Number(request.value));
      if (!land) throw new GameError(1, 'Unknown spirit courtyard land');
      if (!Number(land.crop_tid)) throw new GameError(311, 'Spirit courtyard land is empty');
      land.crop_tid = 0;
      land.update_time = ctx.at;
      land.mature_time = 0;
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_rsp_spirit_courtyard_tree_plant', actKey: SPIRIT_KEY, value: { land: state.lands.map(spiritLand), res: resOf({ changes: [] }) } };
    })
  });

  register(105005, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_submit_entrust',
    handler: request => run('spirit', ctx => {
      const state = spiritState(ctx);
      const entrust = state.entrusts.find(candidate => Number(candidate.uid) === Number(request.uid));
      if (!entrust) throw new GameError(1, 'Unknown spirit courtyard entrust');
      if (entrust.is_finish) throw new GameError(311, 'Spirit courtyard entrust is already finished');
      const order = requireRow(t.spirit.EntrustOrder, entrust.tid, 'Spirit courtyard entrust order');
      const costs = new Map();
      for (const libTid of entrust.lib ?? []) {
        const lib = requireRow(t.spirit.EntrustOrderLib, libTid, 'Spirit courtyard entrust item');
        costs.set(Number(lib.fruit), (costs.get(Number(lib.fruit)) ?? 0) + Number(lib.fruit_num));
      }
      const spent = spend(ctx, [...costs], 'Spirit courtyard entrust');
      const granted = grant(ctx, awardsOf(order.award, 'Spirit courtyard entrust award'), 'Spirit courtyard entrust');
      entrust.is_finish = true;
      state.entrust_count = Number(state.entrust_count ?? 0) + 1;
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return {
        schema: 'pb_res_spirit_courtyard_submit_entrust', actKey: SPIRIT_KEY,
        value: {
          role_info: spiritRole(state), guild_info: spiritGuild(),
          res: resOf({ changes: [...(spent.changes ?? []), ...(granted.changes ?? [])] })
        }
      };
    })
  });

  register(105006, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'etf',
    handler: () => run('spirit', ctx => {
      const state = spiritState(ctx);
      const costs = t.spirit.EntrustRefreshCost.rows;
      const row = costs[Math.min(Number(state.refresh_times ?? 0), costs.length - 1)];
      spend(ctx, awardsOf(row.cost_list, 'Spirit courtyard refresh cost'), 'Spirit courtyard');
      state.refresh_times = Number(state.refresh_times ?? 0) + 1;
      state.entrusts = [];
      const orders = t.spirit.EntrustOrder.rows.filter(order => Number(order.quality) >= 10);
      for (let index = 0; index < 3; index += 1) {
        const order = weightedPick(orders, { label: 'Spirit courtyard entrust' });
        const libs = [];
        for (let pick = 0; pick < Number(order.num); pick += 1) {
          const libRows = t.spirit.EntrustOrderLib.rows.filter(candidate => Number(candidate.lib) === Number(order.lib));
          libs.push(Number(weightedPick(libRows, { label: 'Spirit courtyard entrust lib' }).tid));
        }
        state.entrusts.push({ uid: index + 1, tid: Number(order.tid), lib: libs, is_public: false, is_finish: false, role_id: ctx.roleId });
      }
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_res_spirit_courtyard_update_task', actKey: SPIRIT_KEY, value: { role_info: spiritRole(state), res: resOf({ changes: [] }) } };
    })
  });

  register(105007, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_publish_collaboration',
    handler: request => run('spirit', ctx => {
      const state = spiritState(ctx);
      const entrust = state.entrusts.find(candidate => Number(candidate.uid) === Number(request.uid));
      if (!entrust) throw new GameError(1, 'Unknown spirit courtyard entrust');
      if (entrust.is_public) throw new GameError(311, 'Spirit courtyard entrust is already published');
      const limit = Number(requireRow(t.spirit.Const, 1, 'Spirit courtyard constants').publish_entrust_times);
      if (Number(state.publish_count ?? 0) >= limit) throw new GameError(311, 'Spirit courtyard publish limit is reached');
      entrust.is_public = true;
      state.publish_count = Number(state.publish_count ?? 0) + 1;
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_res_spirit_courtyard_publish_collaboration', actKey: SPIRIT_KEY, value: { entrust_info: spiritEntrust(entrust) } };
    })
  });

  register(105008, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_assist_entrust',
    handler: () => run('spirit', () => {
      throw new GameError(5, 'Spirit courtyard assist needs another role on the same guild server; single-role social data is not modeled');
    })
  });

  register(105009, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_finish_banquet',
    handler: () => run('spirit', () => {
      throw new GameError(5, 'Spirit courtyard guild banquet needs guild membership and donation records that are not modeled');
    })
  });

  register(105010, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_fruit_merge',
    handler: request => run('spirit', ctx => {
      const items = Array.isArray(request.item_list) ? request.item_list : [];
      if (!items.length) throw new GameError(1, 'Spirit courtyard merge list is empty');
      let total = 0;
      const costs = [];
      for (const entry of items) {
        const tid = Number(entry.key ?? entry.tid);
        const count = Number(entry.value ?? entry.num);
        if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) throw new GameError(1, 'Invalid spirit courtyard merge entry');
        total += count;
        costs.push([tid, count]);
      }
      const stage = [...t.spirit.FruitMerge.rows].sort((left, right) => Number(left.level) - Number(right.level))
        .filter(row => Number(row.level) <= total).at(-1);
      if (!stage) throw new GameError(311, 'Spirit courtyard merge stage is not reached');
      spend(ctx, costs, 'Spirit courtyard');
      const granted = grant(ctx, [[Number(stage.result), 1]], 'Spirit courtyard');
      return { schema: 'pb_res_to_client', actKey: SPIRIT_KEY, value: resOf(granted) };
    })
  });

  register(105011, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_tree_plant',
    handler: request => run('spirit', ctx => {
      const list = Array.isArray(request.plant_list) ? request.plant_list : [];
      if (!list.length) throw new GameError(1, 'Spirit courtyard plant list is empty');
      const state = spiritState(ctx);
      for (const item of list) {
        const land = state.lands.find(candidate => Number(candidate.id) === Number(item.id));
        if (!land) throw new GameError(311, 'Spirit courtyard land is not unlocked');
        const crop = requireRow(t.spirit.Crop, item.tree_tid, 'Spirit courtyard crop');
        const output = spiritOutputFor(crop);
        land.crop_tid = Number(crop.tid);
        land.update_time = ctx.at;
        land.mature_time = ctx.at + Number(output?.total_duration ?? 3600);
      }
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_rsp_spirit_courtyard_tree_get', actKey: SPIRIT_KEY, value: { land: state.lands.map(spiritLand), res: resOf({ changes: [] }), show_res: [] } };
    })
  });

  register(105012, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_refresh_role_info',
    handler: () => run('spirit', ctx => {
      const state = spiritState(ctx);
      return { schema: 'pb_res_spirit_courtyard_refresh_role_info', actKey: SPIRIT_KEY, value: { role_info: spiritRole(state), guild_info: spiritGuild() } };
    })
  });

  register(105013, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_cancel_collaboration',
    handler: request => run('spirit', ctx => {
      const state = spiritState(ctx);
      const entrust = state.entrusts.find(candidate => Number(candidate.uid) === Number(request.uid));
      if (!entrust) throw new GameError(1, 'Unknown spirit courtyard entrust');
      if (!entrust.is_public) throw new GameError(311, 'Spirit courtyard entrust is not published');
      entrust.is_public = false;
      state.publish_count = Math.max(0, Number(state.publish_count ?? 0) - 1);
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return {
        schema: 'pb_res_spirit_courtyard_cancel_collaboration', actKey: SPIRIT_KEY,
        value: { entrust_info: spiritEntrust(entrust), role_info: spiritRole(state), guild_info: spiritGuild() }
      };
    })
  });

  register(105014, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'etf',
    handler: request => run('spirit', ctx => {
      const row = requireRow(t.spirit.IntimacyTask, request.value, 'Spirit courtyard intimacy task');
      const state = spiritState(ctx);
      if (state.task_claims.includes(Number(row.tid))) throw new GameError(311, 'Spirit courtyard intimacy task is already claimed');
      if (Number(state.intimacy) < Number(row.target_count)) throw new GameError(311, 'Spirit courtyard intimacy task is not reached');
      const granted = grant(ctx, awardsOf([[Number(row.add_value), 1]], 'Spirit courtyard intimacy task'), 'Spirit courtyard');
      state.task_claims.push(Number(row.tid));
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_spirit_courtyard_in_task_res', actKey: SPIRIT_KEY, value: { role_info: spiritRole(state) }, meta: { granted: granted.changes.length } };
    })
  });

  register(105015, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'etf',
    handler: () => run('spirit', () => {
      throw new GameError(5, 'Spirit courtyard banquet awards require guild banquet progress that is not modeled');
    })
  });

  register(105016, {
    card: 'PLAY-SPIRITCOURTYARD', encoding: 'pb', request: 'pb_req_spirit_courtyard_use_item',
    handler: request => run('spirit', ctx => {
      const itemTid = Number(request.item_tid);
      const useNum = Math.max(1, Number(request.use_num) || 1);
      const item = t.spirit.Item.rows.find(row => Number(row.speed_item) === itemTid);
      if (!item) throw new GameError(5, 'Spirit courtyard speed item is not configured');
      const state = spiritState(ctx);
      const land = state.lands.find(candidate => Number(candidate.id) === Number(request.land_tid));
      if (!land || !Number(land.crop_tid)) throw new GameError(311, 'Spirit courtyard land has no growing crop');
      spend(ctx, [[itemTid, useNum]], 'Spirit courtyard');
      land.mature_time = Math.max(ctx.at, Number(land.mature_time) - Number(item.value) * useNum);
      saveState(ctx.db, ctx.roleId, SPIRIT_KEY, state, ctx.at);
      return { schema: 'pb_rsp_spirit_courtyard_tree_get', actKey: SPIRIT_KEY, value: { land: state.lands.map(spiritLand), res: resOf({ changes: [] }), show_res: [] } };
    })
  });

  // ---- PLAY-TRIPLEMATCH (106001-106005) ----------------------------------
  const TRIPLE_TYPES = [1007, 1017, 1091];
  function tripleGame(ctx, actId) {
    const { version } = assertActivity(actId, TRIPLE_TYPES, 'triple match');
    const game = t.tripleMatch.Game.byTid.get(version) ?? t.tripleMatch.Game.rows[0];
    const key = 'triple:' + actId;
    const state = loadState(ctx.db, ctx.roleId, key);
    state.stamina = Number(state.stamina ?? game.init_stamina);
    state.stamina_time = Number(state.stamina_time ?? ctx.at);
    state.score = Number(state.score ?? 0);
    state.get_list = Array.isArray(state.get_list) ? state.get_list : [];
    state.received_pass_stage = Array.isArray(state.received_pass_stage) ? state.received_pass_stage : [];
    state.round_index = Number(state.round_index ?? 1);
    if (Number(game.recover_time) > 0) {
      const elapsed = ctx.at - state.stamina_time;
      if (elapsed >= Number(game.recover_time)) {
        const ticks = Math.floor(elapsed / Number(game.recover_time));
        state.stamina = Math.min(Number(game.max_stamina), state.stamina + ticks * Number(game.recover_num));
        state.stamina_time += ticks * Number(game.recover_time);
      }
    }
    return { key, state, game, version };
  }
  function tripleInfo(state, version) {
    return {
      version,
      stamina: state.stamina,
      last_update_time: String(state.stamina_time),
      score: state.score,
      map: { param_score: 0, tile_list: [], is_dead: false },
      get_list: state.get_list.map(Number),
      cur_score: 0,
      max_cur_score: Number(state.max_cur_score ?? 0),
      extra_score: 0,
      extra_cur_score: 0,
      round_index: state.round_index,
      received_pass_stage: state.received_pass_stage.map(Number)
    };
  }

  register(106001, {
    card: 'PLAY-TRIPLEMATCH', encoding: 'pb', request: 'pb_triple_match_swap_tile_req',
    handler: request => run('triple_match', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Triple match');
      const { key, state, game, version } = tripleGame(ctx, actId);
      const cost = Number(game.swap_cost_stamina) || 1;
      if (state.stamina < cost) throw new GameError(311, 'Triple match stamina is exhausted');
      state.stamina -= cost;
      // The board and match cascade are simulated by the client; the server
      // keeps the stamina ledger and the score the client claims against.
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_triple_match_swap_tile_rsp', actKey: key,
        value: { action_list: [], res: resOf({ changes: [] }), act_info: tripleInfo(state, version) }
      };
    })
  });

  register(106002, {
    card: 'PLAY-TRIPLEMATCH', encoding: 'pb', request: 'pb_triple_match_restart_req',
    handler: request => run('triple_match', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Triple match');
      const { key, state, game, version } = tripleGame(ctx, actId);
      if (request.use_item) spend(ctx, [[Number(game.item), 1]], 'Triple match');
      state.round_index += 1;
      state.max_cur_score = Math.max(Number(state.max_cur_score ?? 0), Number(state.cur_score ?? 0));
      state.cur_score = 0;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_triple_match_swap_tile_rsp', actKey: key,
        value: { action_list: [], res: resOf({ changes: [] }), act_info: tripleInfo(state, version) }
      };
    })
  });

  register(106003, {
    card: 'PLAY-TRIPLEMATCH', encoding: 'pb', request: 'pb_triple_match_score_award_req',
    handler: request => run('triple_match', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Triple match');
      const { key, state, version } = tripleGame(ctx, actId);
      const ids = (request.id_list ?? []).map(Number);
      if (!ids.length) throw new GameError(1, 'Triple match award list is empty');
      const awards = [];
      for (const tid of ids) {
        const row = requireRow(t.tripleMatch.AccAward, tid, 'Triple match score award');
        if (Number(row.version) !== version) throw new GameError(1, 'Triple match award does not belong to this version');
        if (state.get_list.includes(Number(row.tid))) throw new GameError(311, 'Triple match award is already claimed');
        if (state.score < Number(row.condition)) throw new GameError(311, 'Triple match score is not reached');
        awards.push(...awardsOf(row.award, 'Triple match score award'));
        state.get_list.push(Number(row.tid));
      }
      const granted = grant(ctx, awards, 'Triple match');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_triple_match_score_award_rsp', actKey: key, value: { res: resOf(granted), act_info: tripleInfo(state, version) } };
    })
  });

  register(106004, {
    card: 'PLAY-TRIPLEMATCH', encoding: 'pb', request: 'pb_triple_match_use_item_req',
    handler: request => run('triple_match', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Triple match');
      const { key, state, game, version } = tripleGame(ctx, actId);
      const num = Math.max(1, Number(request.num) || 1);
      spend(ctx, [[Number(game.item), num]], 'Triple match');
      state.stamina = Math.min(Number(game.max_stamina), state.stamina + Number(game.item_recover) * num);
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_triple_match_use_item_rsp', actKey: key, value: { res: resOf({ changes: [] }), act_info: tripleInfo(state, version) } };
    })
  });

  register(106005, {
    card: 'PLAY-TRIPLEMATCH', encoding: 'pb', request: 'pb_triple_match_rec_pass_stage_award_req',
    handler: request => run('triple_match', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Triple match');
      throw new GameError(5, 'Triple match stage-pass progress is reported by the client board simulation and is not recovered');
    })
  });

  // ---- PLAY-MATCHINGGAMEACT (107501-107503) ------------------------------
  const MATCHING_TYPES = [1021];
  function matchingState(ctx, actId) {
    const { version } = assertActivity(actId, MATCHING_TYPES, 'matching game');
    const key = 'matching:' + actId;
    const state = loadState(ctx.db, ctx.roleId, key);
    state.card_list = Array.isArray(state.card_list) ? state.card_list.map(Number) : [];
    state.score = Number(state.score ?? 0);
    state.reward_tid_list = Array.isArray(state.reward_tid_list) ? state.reward_tid_list.map(Number) : [];
    state.luck_card = Number(state.luck_card ?? 0);
    return { key, state, version };
  }
  function matchingInfo(state, actId) {
    return {
      luck_card: state.luck_card,
      card_list: state.card_list.map(Number),
      score: state.score,
      act_id: actId,
      reward_tid_list: state.reward_tid_list.map(Number)
    };
  }
  function matchingSettle(ctx, state, version) {
    const awards = [];
    const settled = [];
    const byType = new Map();
    for (const tid of state.card_list) {
      const card = requireRow(t.matchingGame.CardType, tid, 'Matching game card');
      const type = Number(card.type);
      if (!byType.has(type)) byType.set(type, []);
      byType.get(type).push(Number(tid));
    }
    for (const [type, tids] of byType) {
      if (tids.length < 2) continue;
      const award = t.matchingGame.Award.rows.find(row => Number(row.version) === version && Number(row.type) === type);
      if (!award) continue;
      while (byType.get(type).length >= 2) {
        const pair = byType.get(type).splice(0, 2);
        settled.push(...pair);
        state.card_list = state.card_list.filter(tid => !pair.includes(tid));
        state.score += Number(award.score);
        awards.push(...awardsOf(award.award, 'Matching game pair award'));
      }
    }
    return { awards, settled };
  }

  register(107501, {
    card: 'PLAY-MATCHINGGAMEACT', encoding: 'pb', request: 'pb_matching_game_act_luck_req',
    handler: request => run('matching_game', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Matching game');
      const { key, state, version } = matchingState(ctx, actId);
      const cards = rowsOfVersion(t.matchingGame.CardType, version);
      if (!cards.length) throw new GameError(5, 'Matching game card list is not configured for this version');
      const picked = cards[Math.floor(Math.min(Math.max(Number(random()), 0), 0.999999) * cards.length)];
      state.card_list.push(Number(picked.tid));
      state.luck_card = Number(picked.tid);
      const settled = matchingSettle(ctx, state, version);
      const granted = grant(ctx, settled.awards, 'Matching game');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_role_matching_game_act_info', matchingInfo(state, actId)));
      return {
        schema: 'pb_role_matching_game_act_info', actKey: key,
        value: matchingInfo(state, actId),
        meta: { settled: settled.settled.length, changes: granted.changes.length }
      };
    })
  });

  register(107502, {
    card: 'PLAY-MATCHINGGAMEACT', encoding: 'etf',
    handler: request => run('matching_game', ctx => {
      const actId = Number(request.fields?.act_id ?? request.value ?? 0);
      const resolved = actId > 0 ? actId : runningActIds(MATCHING_TYPES, ctx.at).at(-1);
      if (!resolved) throw new GameError(309, 'Matching game activity is not running');
      assertRunning(resolved, ctx.at, 'Matching game');
      const { key, state, version } = matchingState(ctx, resolved);
      const settled = matchingSettle(ctx, state, version);
      const granted = grant(ctx, settled.awards, 'Matching game');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, resolved, () => codec.pack('pb_role_matching_game_act_info', matchingInfo(state, resolved)));
      return {
        schema: 'pb_matching_game_act_use_card_rsp', actKey: key,
        value: {
          res_change: resOf(granted),
          info: matchingInfo(state, resolved),
          settle_card_list: settled.settled,
          get_card_list: [],
          big_award_count: 0
        }
      };
    })
  });

  register(107503, {
    card: 'PLAY-MATCHINGGAMEACT', encoding: 'pb', request: 'pb_matching_game_act_score_award_req',
    handler: request => run('matching_game', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Matching game');
      const { key, state, version } = matchingState(ctx, actId);
      const row = requireRow(t.matchingGame.ScoreAward, request.tid, 'Matching game score award');
      if (Number(row.version) !== version) throw new GameError(1, 'Matching game award does not belong to this activity version');
      if (state.reward_tid_list.includes(Number(row.tid))) throw new GameError(311, 'Matching game award is already claimed');
      if (state.score < Number(row.need_score)) throw new GameError(311, 'Matching game score is not reached');
      const granted = grant(ctx, awardsOf(row.award, 'Matching game score award'), 'Matching game');
      state.reward_tid_list.push(Number(row.tid));
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_role_matching_game_act_info', matchingInfo(state, actId)));
      return { schema: 'pb_matching_game_act_score_award_rsp', actKey: key, value: { res_change: resOf(granted), reward_tid_list: state.reward_tid_list } };
    })
  });

  // ---- PLAY-MONOPOLYACT (107801-107811) ----------------------------------
  const MONOPOLY_TYPES = [1033, 1039, 1066];
  function monopolyCtx(ctx, actId) {
    const { version } = assertActivity(actId, MONOPOLY_TYPES, 'monopoly');
    const ver = t.monopoly.Ver.byTid.get(version) ?? t.monopoly.Ver.rows[0];
    const key = 'monopoly:' + actId;
    const state = loadState(ctx.db, ctx.roleId, key);
    if (Number(state.day) !== Number(ctx.day)) {
      state.day = Number(ctx.day);
      state.day_help_num = 0;
      state.day_free_used = 0;
    }
    state.cur_index = Number(state.cur_index ?? 0);
    state.event_uid = Number(state.event_uid ?? 0);
    state.events = Array.isArray(state.events) ? state.events : [];
    state.score = Number(state.score ?? 0);
    state.day_help_num = Number(state.day_help_num ?? 0);
    state.day_free_used = Number(state.day_free_used ?? 0);
    state.role_total_award_gets = Array.isArray(state.role_total_award_gets) ? state.role_total_award_gets : [];
    state.role_live_award_gets = Array.isArray(state.role_live_award_gets) ? state.role_live_award_gets : [];
    state.role_guild_task_award_gets = Array.isArray(state.role_guild_task_award_gets) ? state.role_guild_task_award_gets : [];
    state.guild_count_stats = state.guild_count_stats && typeof state.guild_count_stats === 'object'
      ? state.guild_count_stats : {};
    state.next_multiple = Number(state.next_multiple ?? 1) || 1;
    state.firm_money = Number(state.firm_money ?? 0);
    state.firm_save_num = Number(state.firm_save_num ?? 0);
    return { key, state, ver, version };
  }
  function monopolyGuildStatistic(state, typeConfig, statistic) {
    const all = state.guild_count_stats;
    let send = all[String(statistic.tid)] ?? all[statistic.tid];
    if (!send && Array.isArray(all)) send = all.find(row => Number(row.stat_tid) === Number(statistic.tid));
    if (!send) throw new GameError(5, 'Monopoly guild statistics are unavailable');
    if (Number(send.stat_tid ?? statistic.tid) !== Number(statistic.tid)) {
      throw new GameError(5, 'Monopoly guild statistics do not match the task type');
    }
    const ids = new Set((typeConfig.stat_expand ?? []).map(String));
    if (!ids.size) throw new GameError(5, 'Monopoly guild task statistics are not configured');
    const rows = send.data?.list;
    if (!Array.isArray(rows)) throw new GameError(5, 'Monopoly guild statistics are invalid');
    let total = 0n;
    for (const entry of rows) {
      if (!entry || typeof entry !== 'object') throw new GameError(5, 'Monopoly guild statistics are invalid');
      if (!ids.has(String(entry.id))) continue;
      const raw = entry.total ?? 0;
      let value;
      try {
        if (typeof raw === 'number' && !Number.isSafeInteger(raw)) throw new RangeError();
        const text = typeof raw === 'number' ? String(raw) : raw;
        if (typeof text !== 'string' || !/^[0-9]+$/.test(text)) throw new RangeError();
        value = BigInt(text);
      } catch {
        throw new GameError(5, 'Monopoly guild statistics are invalid');
      }
      total += value;
    }
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new GameError(5, 'Monopoly guild statistics are invalid');
    return Number(total);
  }
  // GuildTask.task_type=0 compares the guild's accumulated score with
  // target_count. Other guild tasks use task_count and either a custom guild
  // statistics slot or the normal task counter. This single-role server treats
  // its local score as the guild total because no other guild members exist.
  function monopolyGuildTaskProgress(ctx, state, row) {
    const taskType = Number(row.task_type);
    if (taskType === 0) {
      return { progress: Number(state.score ?? 0), target: Number(row.target_count) };
    }
    const typeConfig = tables.TaskType?.get(taskType);
    if (!typeConfig) throw new GameError(5, 'Monopoly guild task type is not configured');
    if (typeConfig.progress_type === 2) {
      const statistic = tables.CountStatistics?.get(Number(typeConfig.data));
      if (statistic?.custom_login) {
        return {
          progress: monopolyGuildStatistic(state, typeConfig, statistic),
          target: Number(row.task_count)
        };
      }
    }
    return { progress: taskProgress(ctx, row), target: Number(row.task_count) };
  }
  function monopolyGuildStatisticsSend(state) {
    const send = state.guild_count_stats['1006'];
    if (!send) return {};
    return {
      stat_tid: Number(send.stat_tid ?? 1006),
      expand_id_list: (send.expand_id_list ?? []).map(String),
      data: {
        list: (send.data?.list ?? []).map(row => ({ id: String(row.id), total: String(row.total ?? 0) }))
      }
    };
  }
  function monopolyGuildData(state, version, roleId) {
    return {
      version,
      score: state.score,
      supply_list: [],
      order_list: [],
      day_record_list: [],
      last_record_list: [],
      score_record_list: [],
      role_score_list: [{ role_id: String(roleId), score: state.score }]
    };
  }
  function monopolyRole(state, version) {
    return {
      cur_index: state.cur_index,
      event_list: state.events.map(event => ({ tid: event.tid, uid: String(event.uid), finish_stage: event.finish_stage, param: String(event.param ?? 0) })),
      next_multiple: state.next_multiple,
      role_total_award_gets: state.role_total_award_gets.map(Number),
      guild_total_award_gets: state.role_guild_task_award_gets.map(Number),
      role_live_award_gets: state.role_live_award_gets.map(Number),
      version,
      score: state.score,
      event_uid_index: String(state.event_uid),
      pvp_match_list: [],
      day_help_num: state.day_help_num,
      day_update_time: String(0),
      pvp_keep_win_num: 0,
      pvp_keep_lose_num: 0,
      firm_money: state.firm_money,
      firm_save_num: state.firm_save_num
    };
  }

  register(107801, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_go_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const { key, state, ver, version } = monopolyCtx(ctx, actId);
      const isHigh = Boolean(request.is_high);
      const needPoint = Number(request.need_point ?? 0);
      let dice;
      if (isHigh && needPoint > 0) {
        if (needPoint < 1 || needPoint > 6) throw new GameError(1, 'Monopoly point must be between 1 and 6');
        dice = needPoint;
      } else {
        dice = 1 + Math.floor(Math.min(Math.max(Number(random()), 0), 0.999999) * 6);
      }
      const cost = awardsOf(isHigh ? ver.high_use_item : ver.base_use_item, 'Monopoly dice cost');
      const free = awardsOf(ver.free_item, 'Monopoly free dice');
      let changes = [];
      if (!isHigh && state.day_free_used < Number(free[0]?.[1] ?? 0)) {
        state.day_free_used += 1;
      } else {
        changes = spend(ctx, cost, 'Monopoly').changes ?? [];
      }
      const mapRows = t.monopoly.Map.rows.filter(row => Number(row.ver ?? row.version) === Number(version))
        .sort((left, right) => Number(left.index) - Number(right.index));
      if (!mapRows.length) throw new GameError(5, 'Monopoly map is not configured');
      state.cur_index = ((state.cur_index + dice - 1) % mapRows.length) + 1;
      const square = mapRows[state.cur_index - 1];
      state.event_uid += 1;
      state.events.push({ tid: Number(square.tid), uid: state.event_uid, finish_stage: 0, param: Number(square.event ?? 0) });
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_monopoly_act_role_info', { act_data_list: [monopolyRole(state, version)] }));
      return {
        schema: 'pb_monopoly_act_go_back', actKey: key,
        value: { res: resOf({ changes }), throw_dice_num: dice },
        meta: { dice, index: state.cur_index }
      };
    })
  });

  register(107802, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_base_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const { key, state, version } = monopolyCtx(ctx, actId);
      const id = Number(request.tid);
      let event = state.events.find(candidate => Number(candidate.uid) === id);
      if (!event) event = state.events.find(candidate => Number(candidate.tid) === id);
      if (!event) event = state.events.find(candidate => Number(candidate.param) === id);
      if (!event) throw new GameError(1, 'Monopoly event is not present');
      if (Number(event.finish_stage) !== 0) throw new GameError(311, 'Monopoly event is already finished');
      const eventRow = requireRow(t.monopoly.Event, event.param, 'Monopoly event');
      const eventType = requireRow(t.monopoly.EventType, eventRow.type, 'Monopoly event type');
      if (!eventType.must_finish) throw new GameError(1, 'Monopoly event is not a fight event');
      const awards = Array.isArray(eventRow.award) ? awardsOf(eventRow.award, 'Monopoly event award') : [];
      if (eventRow.item_double) {
        for (const award of awards) award[1] *= 2;
      }
      const granted = grant(ctx, awards, 'Monopoly event');
      const multiplier = Number(eventRow.score_double) ? 2 : 1;
      state.score += Number(eventRow.score ?? 0) * multiplier * Number(state.next_multiple);
      state.next_multiple = 1;
      event.finish_stage = 2;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_monopoly_act_role_info', { act_data_list: [monopolyRole(state, version)] }));
      return {
        schema: 'pb_monopoly_act_base_back', actKey: key,
        value: {
          res: resOf(granted), act_role_data: monopolyRole(state, version),
          guild_data: monopolyGuildData(state, version, ctx.roleId),
          act_tid: String(actId), event_uid: String(event.uid), ower_event_role: '0'
        }
      };
    })
  });

  function monopolyRewardList(ctx, actId, request, family, label, field) {
    const { key, state, version } = monopolyCtx(ctx, actId);
    state[field] = Array.isArray(state[field]) ? state[field] : [];
    const ids = (request.tid_list ?? []).map(Number);
    if (!ids.length) throw new GameError(1, label + ' list is empty');
    const awards = [];
    for (const tid of ids) {
      const row = requireRow(family, tid, label);
      if (Number(row.version ?? row.ver) !== version) throw new GameError(1, label + ' does not belong to this version');
      if (state[field].includes(Number(row.tid))) throw new GameError(311, label + ' is already claimed');
      const condition = Number(row.condition ?? row.target_count);
      if (state.score < condition) throw new GameError(311, label + ' threshold is not reached');
      awards.push(...awardsOf(row.award, label));
      state[field].push(Number(row.tid));
    }
    const granted = grant(ctx, awards, label);
    saveState(ctx.db, ctx.roleId, key, state, ctx.at);
    return { key, state, version, granted };
  }

  register(107803, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_get_reward_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const outcome = monopolyRewardList(ctx, actId, request, t.monopoly.LiveTask, 'Monopoly live award', 'role_live_award_gets');
      return { schema: 'pb_res_to_client', actKey: outcome.key, value: resOf(outcome.granted) };
    })
  });

  register(107804, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_get_reward_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const { key, state, version } = monopolyCtx(ctx, actId);
      const ids = (request.tid_list ?? []).map(Number);
      if (!ids.length) throw new GameError(1, 'Monopoly guild task list is empty');
      if (new Set(ids).size !== ids.length) throw new GameError(1, 'Monopoly guild task list contains duplicates');
      const awards = [];
      for (const tid of ids) {
        const row = requireRow(t.monopoly.GuildTask, tid, 'Monopoly guild task');
        if (Number(row.ver) !== version) throw new GameError(1, 'Monopoly guild task does not belong to this version');
        if (state.role_guild_task_award_gets.includes(Number(row.tid))) throw new GameError(311, 'Monopoly guild task is already claimed');
        const condition = monopolyGuildTaskProgress(ctx, state, row);
        if (condition.progress < condition.target) throw new GameError(311, 'Monopoly guild task is not complete');
        awards.push(...awardsOf(row.award, 'Monopoly guild task award'));
        state.role_guild_task_award_gets.push(Number(row.tid));
      }
      const granted = grant(ctx, awards, 'Monopoly guild task');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_monopoly_act_role_info', { act_data_list: [monopolyRole(state, version)] }));
      return { schema: 'pb_res_to_client', actKey: key, value: resOf(granted) };
    })
  });

  register(107805, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_get_reward_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const outcome = monopolyRewardList(ctx, actId, request, t.monopoly.TotolTask, 'Monopoly total award', 'role_total_award_gets');
      return { schema: 'pb_res_to_client', actKey: outcome.key, value: resOf(outcome.granted) };
    })
  });

  register(107806, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_get_reward_req',
    handler: () => run('monopoly', () => {
      throw new GameError(5, 'Monopoly supply drops are created by other roles and are not modeled');
    })
  });

  register(107807, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_base_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const { key, state, ver } = monopolyCtx(ctx, actId);
      if (state.day_help_num >= Number(ver.max_help_num)) throw new GameError(311, 'Monopoly help limit is reached');
      state.day_help_num += 1;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_monopoly_act_send_order_back', actKey: key, value: {} };
    })
  });

  register(107808, {
    card: 'PLAY-MONOPOLYACT', encoding: 'etf',
    handler: () => run('monopoly', ctx => {
      const actId = runningActIds(MONOPOLY_TYPES, ctx.at).at(-1);
      if (!actId) throw new GameError(309, 'Monopoly activity is not running');
      const { key, state } = monopolyCtx(ctx, actId);
      return {
        schema: 'pb_monopoly_act_get_guild_back', actKey: key,
        value: { order_list: [], supply_list: [], score_record_list: [], role_score_list: [{ role_id: String(ctx.roleId), score: state.score }] }
      };
    })
  });

  register(107809, {
    card: 'PLAY-MONOPOLYACT', encoding: 'etf',
    handler: () => run('monopoly', ctx => {
      const actId = runningActIds(MONOPOLY_TYPES, ctx.at).at(-1);
      if (!actId) throw new GameError(309, 'Monopoly activity is not running');
      const { key, state, ver } = monopolyCtx(ctx, actId);
      const granted = grantClaim(ctx, key, 'day:' + ctx.day, awardsOf(ver.day_item, 'Monopoly day award'), 'Monopoly day award');
      if (!granted) throw new GameError(311, 'Monopoly daily award is already claimed');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_res_to_client', actKey: key, value: resOf(granted) };
    })
  });

  register(107810, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_fight_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const { key, state } = monopolyCtx(ctx, actId);
      const jumpItem = Number(requireRow(t.monopoly.Const, 1, 'Monopoly constants').jump_item);
      const spent = spend(ctx, [[jumpItem, 1]], 'Monopoly jump');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_monopoly_act_base_back', actKey: key,
        value: { res: resOf(spent), act_tid: String(actId), event_uid: String(request.event_uid ?? 0), ower_event_role: String(request.ower_event_role ?? 0) }
      };
    })
  });

  register(107811, {
    card: 'PLAY-MONOPOLYACT', encoding: 'pb', request: 'pb_monopoly_act_finish_firm_req',
    handler: request => run('monopoly', ctx => {
      const actId = Number(request.act_tid);
      assertRunning(actId, ctx.at, 'Monopoly');
      const { key, state } = monopolyCtx(ctx, actId);
      const firm = requireRow(t.monopoly.Frim, 1, 'Monopoly firm');
      if (request.is_get) {
        if (state.firm_save_num >= Number(firm.firm_save_max)) throw new GameError(311, 'Monopoly firm save limit is reached');
        state.firm_save_num += 1;
        state.firm_money = 0;
      }
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_monopoly_act_finish_order_back', actKey: key, value: { res: resOf({ changes: [] }) } };
    })
  });

  // ---- PLAY-DREAMTRIALACT (108001-108002) --------------------------------
  const DREAM_TYPES = [1034, 1038, 1041, 1042, 1043];
  register(108001, {
    card: 'PLAY-DREAMTRIALACT', encoding: 'pb', request: 'pb_dream_trial_query_rob_req',
    handler: request => run('dream_trial', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Dream trial');
      const { version } = assertActivity(actId, DREAM_TYPES, 'dream trial');
      const rows = ctx.db.prepare("SELECT role_id, data FROM minigame_act_state WHERE act_key LIKE 'dream:%' AND role_id<>?").all(ctx.roleId);
      const robInfos = [];
      for (const row of rows) {
        let data;
        try { data = JSON.parse(row.data); } catch { continue; }
        if (Number(data.version) !== version) continue;
        robInfos.push({ rid: String(Number(row.role_id)), rank: 0, score: Number(data.seize_score ?? 0) });
      }
      return { schema: 'pb_dream_trial_query_rob_rsp', actKey: 'dream:' + actId, value: { rob_infos: robInfos } };
    })
  });

  register(108002, {
    card: 'PLAY-DREAMTRIALACT', encoding: 'pb', request: 'pb_dream_trial_guild_info_req',
    handler: request => run('dream_trial', ctx => {
      const actId = Number(request.activity_id);
      assertRunning(actId, ctx.at, 'Dream trial');
      const { version } = assertActivity(actId, DREAM_TYPES, 'dream trial');
      const key = 'dream:' + actId;
      const state = loadState(ctx.db, ctx.roleId, key);
      state.version = version;
      state.seize_score = Number(state.seize_score ?? 0);
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      const bosses = t.dreamTrial.Monster.rows.map(row => ({
        boss_id: String(Number(row.tid)),
        damage: 0
      }));
      return {
        schema: 'pb_dream_trial_guild_info_rsp', actKey: key,
        value: {
          server_info: { version, boss_list: bosses },
          rank_list: [],
          report_list: []
        }
      };
    })
  });

  // ---- PLAY-DIAMONDVEINACT (109001-109009) -------------------------------
  const DIAMOND_TYPES = [1051, 1052, 1053, 1054, 1063, 1088];
  function diamondCtx(ctx, actId) {
    const { version } = assertActivity(actId, DIAMOND_TYPES, 'diamond vein');
    const consts = requireRow(t.diamondVein.Const, 1, 'Diamond vein constants');
    const key = 'diamond:' + actId;
    const state = loadState(ctx.db, ctx.roleId, key);
    state.action_point = Number(state.action_point ?? consts.energy_max);
    state.attack_point = Number(state.attack_point ?? consts.attack_order_initial);
    state.merit = Number(state.merit ?? 0);
    state.map_id = Number(state.map_id ?? 0);
    state.day_buy_attack = Number(state.day ?? ctx.day) === Number(ctx.day) ? Number(state.day_buy_attack ?? 0) : 0;
    state.day = Number(ctx.day);
    state.focus_map_id = Number(state.focus_map_id ?? 0);
    state.reports = Array.isArray(state.reports) ? state.reports : [];
    return { key, state, consts, version };
  }
  function diamondRole(state, actId) {
    return {
      act_tid: actId,
      action_point: state.action_point,
      action_point_update_time: String(0),
      attack_point: state.attack_point,
      move_point: 0,
      move_point_update_time: String(0),
      day_update_time: String(0),
      reports: state.reports,
      map_id: state.map_id,
      keep_kill_num: 0,
      merit: state.merit,
      day_buy_attack: state.day_buy_attack,
      has_counted: false
    };
  }
  function diamondMap(state) {
    return { map_id: state.map_id, role_list: [], owner_guild_id: 0, high_day_index: 0, high_rate: 0 };
  }

  register(109001, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'pb', request: 'pb_diamond_vein_act_base_req',
    handler: request => run('diamond_vein', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Diamond vein');
      const { key, state } = diamondCtx(ctx, actId);
      return { schema: 'pb_diamond_vein_act_map_data', actKey: key, value: diamondMap(state) };
    })
  });

  register(109002, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'pb', request: 'pb_diamond_vein_act_base_req',
    handler: request => run('diamond_vein', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Diamond vein');
      const { key, state } = diamondCtx(ctx, actId);
      const mapId = Number(request.value);
      if (!Number.isSafeInteger(mapId) || mapId <= 0) throw new GameError(1, 'Invalid diamond vein map id');
      if (state.action_point <= 0) throw new GameError(311, 'Diamond vein action point is exhausted');
      state.map_id = mapId;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_diamond_vein_act_enter_rsp', actKey: key,
        value: { map_data: diamondMap(state), role_data: diamondRole(state, actId) }
      };
    })
  });

  register(109003, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'pb', request: 'pb_diamond_vein_act_base_req',
    handler: request => run('diamond_vein', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Diamond vein');
      const { key, state, consts } = diamondCtx(ctx, actId);
      const interval = Number(consts.energy_plaque_time);
      if (!(interval > 0)) throw new GameError(5, 'Diamond vein plaque interval is not configured');
      state.plaque_time = Number(state.plaque_time ?? ctx.at);
      let gained = 0;
      while (ctx.at - state.plaque_time >= interval && state.action_point < Number(consts.energy_plaque_max)) {
        state.plaque_time += interval;
        state.action_point += Number(consts.energy_plaque_num);
        gained += Number(consts.energy_plaque_num);
      }
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_diamond_vein_act_get_award_rsp', actKey: key,
        value: { res: resOf({ changes: [] }), role_data: diamondRole(state, actId), award_time: String(state.plaque_time) },
        meta: { gained }
      };
    })
  });

  register(109004, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'pb', request: 'pb_diamond_vein_act_base_req',
    handler: request => run('diamond_vein', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Diamond vein');
      const { key, state, consts } = diamondCtx(ctx, actId);
      if (state.day_buy_attack >= Number(consts.attack_order_buy_num)) throw new GameError(311, 'Diamond vein attack purchase limit is reached');
      const spent = spend(ctx, [[Number(consts.attack_order_buy_cost), Number(consts.attack_order_buy_cost_num)]], 'Diamond vein attack');
      state.attack_point += Number(consts.attack_order_buy_num);
      state.day_buy_attack += 1;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_diamond_vein_act_role_res_rsp', actKey: key, value: { res: resOf(spent), role_data: diamondRole(state, actId) } };
    })
  });

  register(109005, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'pb', request: 'pb_diamond_vein_act_base_req',
    handler: request => run('diamond_vein', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Diamond vein');
      const { key, state, consts } = diamondCtx(ctx, actId);
      const points = Number(request.value);
      if (!Number.isSafeInteger(points) || points <= 0) throw new GameError(1, 'Invalid diamond vein action-point amount');
      if (state.action_point + points > Number(consts.energy_max)) throw new GameError(311, 'Diamond vein action point is already full');
      const cost = Math.max(
        Number(consts.energy_buy_min_cost),
        Math.floor(Number(consts.energy_buy_basic_cost) * points / Number(consts.energy_max))
      );
      const spent = spend(ctx, [[Number(consts.energy_buy_item), cost]], 'Diamond vein action point');
      state.action_point += points;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      refreshStoredLogin(ctx, actId, () => codec.pack('pb_diamond_vein_act_login', {
        role_data: diamondRole(state, actId),
        server_data: { act_tid: actId, map_list: [], handle_high_day_index: 0, is_settle: false },
        guild_data: { act_tid: actId, focus_map_id: state.focus_map_id, merit_total: state.merit, merit_list: [] }
      }));
      return {
        schema: 'pb_diamond_vein_act_role_res_rsp', actKey: key,
        value: { res: resOf(spent), role_data: diamondRole(state, actId) }
      };
    })
  });

  register(109006, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'pb', request: 'pb_diamond_vein_act_guild_focus_req',
    handler: request => run('diamond_vein', ctx => {
      const actId = Number(request.act_id);
      assertRunning(actId, ctx.at, 'Diamond vein');
      const { key, state } = diamondCtx(ctx, actId);
      state.focus_map_id = Number(request.map_id);
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_diamond_vein_act_guild_rsp', actKey: key, value: { guild_data: { act_tid: actId, focus_map_id: state.focus_map_id, merit_total: state.merit, merit_list: [] } } };
    })
  });

  register(109007, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'etf',
    handler: () => run('diamond_vein', ctx => {
      const actId = runningActIds(DIAMOND_TYPES, ctx.at).at(-1);
      if (!actId) throw new GameError(309, 'Diamond vein activity is not running');
      const { key, state } = diamondCtx(ctx, actId);
      return { schema: 'pb_diamond_vein_act_guild_rank_player_info', actKey: key, value: { player_info_list: [], my_guild_rank: 0, my_guild_merit: state.merit } };
    })
  });

  register(109008, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'etf',
    handler: () => run('diamond_vein', ctx => {
      const actId = runningActIds(DIAMOND_TYPES, ctx.at).at(-1);
      if (!actId) throw new GameError(309, 'Diamond vein activity is not running');
      const { key, state } = diamondCtx(ctx, actId);
      return { schema: 'pb_diamond_vein_act_fight_reports_rsp', actKey: key, value: { reports: state.reports } };
    })
  });

  register(109009, {
    card: 'PLAY-DIAMONDVEINACT', encoding: 'etf',
    handler: () => run('diamond_vein', ctx => {
      const actId = runningActIds(DIAMOND_TYPES, ctx.at).at(-1);
      if (!actId) throw new GameError(309, 'Diamond vein activity is not running');
      const { key, state } = diamondCtx(ctx, actId);
      return { schema: 'pb_diamond_vein_act_guild_data', actKey: key, value: { act_tid: actId, focus_map_id: state.focus_map_id, merit_total: state.merit, merit_list: [] } };
    })
  });

  // ---- PLAY-SOURCEPOINT (110101-110103) ----------------------------------
  const SOURCE_POINT_KEY = 'source_point:1';
  function sourcePointState(ctx) {
    const state = loadState(ctx.db, ctx.roleId, SOURCE_POINT_KEY);
    state.source_point_list = (Array.isArray(state.source_point_list) ? state.source_point_list : [])
      .map(entry => ({ tid: Number(entry.tid), uid: Number(entry.uid) }))
      .filter(entry => Number.isSafeInteger(entry.tid) && entry.tid > 0 && Number.isSafeInteger(entry.uid) && entry.uid > 0);
    state.max_uid = Math.max(Number(state.max_uid ?? 0), ...state.source_point_list.map(entry => entry.uid), 0);
    state.hero_task_claims = Array.isArray(state.hero_task_claims) ? state.hero_task_claims.map(Number) : [];
    return state;
  }
  function sourcePointHero(ctx, uid) {
    return (ctx.model.heroInfo?.hero_list ?? []).find(hero => String(hero.uid) === String(uid));
  }
  function sourcePointHeroByTid(ctx, tid) {
    return (ctx.model.heroInfo?.hero_list ?? []).find(hero => String(hero.tid) === String(tid));
  }
  function sourcePointInstance(state, uid) {
    return state.source_point_list.find(entry => Number(entry.uid) === Number(uid));
  }
  function sourcePointAdd(state, tid, count) {
    for (let index = 0; index < Number(count); index += 1) {
      state.max_uid += 1;
      state.source_point_list.push({ tid: Number(tid), uid: state.max_uid });
    }
  }
  function isSourcePointReward(tid) {
    return t.sourcePoint.SourcePoint.byTid.has(Number(tid));
  }
  // Source points are instances in the SourcePointMgr depot, not ordinary bag
  // rows. The recharge result still carries a normal resource change, with
  // new_bin holding the newly allocated pb_source_point so the client can add
  // the exact uid without waiting for a relogin.
  function grantSourcePointRewards({ model, db, awards, at = currentSeconds() }) {
    if (!model?.state || !db) throw new GameError(5, 'Source point reward context is unavailable');
    const totals = new Map();
    for (const entry of Array.isArray(awards) ? awards : []) {
      const tid = Number(entry?.[0]);
      const count = Number(entry?.[1]);
      if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(5, 'Source point reward tid is invalid');
      if (!Number.isSafeInteger(count) || count <= 0) throw new GameError(5, 'Source point reward count is invalid');
      requireRow(t.sourcePoint.SourcePoint, tid, 'Source point reward');
      totals.set(tid, (totals.get(tid) ?? 0) + count);
    }
    if (!totals.size) return { changes: [] };

    const roleId = Number(model.state.roleId);
    const state = sourcePointState({ db, roleId });
    const changes = [];
    for (const [tid, count] of totals) {
      let newNum = state.source_point_list.filter(entry => Number(entry.tid) === tid).length;
      for (let index = 0; index < count; index += 1) {
        sourcePointAdd(state, tid, 1);
        newNum += 1;
        changes.push({
          tid: String(tid), new_num: String(newNum), diff_num: '1',
          new_bin: codec.pack('pb_source_point', { tid: String(tid), uid: String(state.max_uid) })
        });
      }
    }
    saveState(db, roleId, SOURCE_POINT_KEY, state, at);
    return { changes };
  }
  function sourcePointTaskBytes(state) {
    let bits = Buffer.alloc(0);
    for (const tid of state.hero_task_claims) bits = setBit(bits, Number(tid));
    // The protobuf field carries an ETF binary and encoding must stay inside
    // the synchronous command transaction. encodeBitBlock is async.
    return wrapEtfBinary(bits);
  }
  function sourcePointChangeList(heroes) {
    return heroes.map(hero => ({
      hero_uid: String(hero.uid),
      changes: (hero.source_point_list ?? []).map(Number)
    }));
  }
  function sourcePointRemoveFromHeroes(ctx, ids) {
    const removed = new Set(ids.map(Number));
    const changed = new Set();
    for (const hero of ctx.model.heroInfo?.hero_list ?? []) {
      const current = (hero.source_point_list ?? []).map(String);
      const next = current.filter(uid => !removed.has(Number(uid)));
      if (next.length === current.length) continue;
      hero.source_point_list = next;
      changed.add(hero);
    }
    return [...changed];
  }

  register(110101, {
    card: 'PLAY-SOURCEPOINT', encoding: 'pb', request: 'pb_source_point_change_req',
    handler: request => run('source_point', ctx => {
      const state = sourcePointState(ctx);
      const changes = Array.isArray(request.change_list) ? request.change_list : [];
      if (!changes.length) throw new GameError(1, 'Source point change list is empty');
      const seen = new Set();
      const targets = new Map();
      for (const entry of changes) {
        const hero = sourcePointHero(ctx, entry.hero_uid);
        if (!hero) throw new GameError(1, 'Source point hero is not owned');
        const ids = (entry.changes ?? []).map(Number);
        for (const uid of ids) {
          if (!sourcePointInstance(state, uid)) throw new GameError(1, 'Source point instance is not owned: ' + uid);
          if (seen.has(uid)) throw new GameError(1, 'Source point instance is assigned twice: ' + uid);
          seen.add(uid);
        }
        targets.set(String(hero.uid), ids.map(String));
      }
      const changed = new Set(sourcePointRemoveFromHeroes(ctx, [...seen]));
      for (const [uid, ids] of targets) {
        const hero = sourcePointHero(ctx, uid);
        hero.source_point_list = ids;
        changed.add(hero);
      }
      saveState(ctx.db, ctx.roleId, SOURCE_POINT_KEY, state, ctx.at);
      return {
        schema: 'pb_source_point_change_rsp', actKey: SOURCE_POINT_KEY,
        value: {
          hero_list: [...changed], lineup_list: ctx.model.playLineups ?? [],
          role_lineup: ctx.model.lineups ?? {}
        }
      };
    })
  });
  register(110102, {
    card: 'PLAY-SOURCEPOINT', encoding: 'pb', request: 'pb_source_point_combine_req',
    handler: request => run('source_point', ctx => {
      const target = requireRow(t.sourcePoint.Elevate, request.tid, 'Source point elevate');
      const state = sourcePointState(ctx);
      const ids = (request.source_point_list ?? []).map(Number);
      if (new Set(ids).size !== ids.length) throw new GameError(1, 'Source point combine list contains duplicates');
      const instances = ids.map(uid => sourcePointInstance(state, uid));
      if (instances.some(instance => !instance)) throw new GameError(1, 'Source point instance is not owned');
      const required = new Map();
      const costs = new Map();
      for (const entry of target.cost_list ?? []) {
        const type = Number(entry[0]), tid = Number(entry[1]), count = Number(entry[2]);
        if (type === 2) required.set(tid, (required.get(tid) ?? 0) + count);
        else if (type === 1) costs.set(tid, (costs.get(tid) ?? 0) + count);
        else throw new GameError(5, 'Source point elevate cost type is not supported: ' + type);
      }
      const actual = new Map();
      for (const instance of instances) actual.set(instance.tid, (actual.get(instance.tid) ?? 0) + 1);
      if (actual.size !== required.size || [...required].some(([tid, count]) => actual.get(tid) !== count)) {
        throw new GameError(311, 'Source point combine materials do not match the configuration');
      }
      const spent = spend(ctx, [...costs], 'Source point combine');
      const changed = new Set(sourcePointRemoveFromHeroes(ctx, ids));
      state.source_point_list = state.source_point_list.filter(entry => !ids.includes(Number(entry.uid)));
      sourcePointAdd(state, target.tid, 1);
      saveState(ctx.db, ctx.roleId, SOURCE_POINT_KEY, state, ctx.at);
      return {
        schema: 'pb_source_point_combine_rsp', actKey: SOURCE_POINT_KEY,
        value: { res: resOf(spent), change_list: sourcePointChangeList([...changed]) }
      };
    })
  });
  register(110103, {
    card: 'PLAY-SOURCEPOINT', encoding: 'pb', request: 'pb_source_point_task_req',
    handler: request => run('source_point', ctx => {
      const trial = requireRow(t.sourcePoint.Trial, request.tid, 'Source point trial');
      const state = sourcePointState(ctx);
      if (state.hero_task_claims.includes(Number(trial.tid))) throw new GameError(311, 'Source point trial is already claimed');
      if (!sourcePointHeroByTid(ctx, trial.hero)) throw new GameError(311, 'Source point trial hero is not owned');
      const progress = taskProgress(ctx, { task_type: trial.type, task_param: trial.task_param, target_count: trial.target_count });
      if (progress < Number(trial.target_count)) throw new GameError(311, 'Source point trial is not complete');
      const awards = awardsOf(trial.award, 'Source point trial award');
      const normal = [];
      for (const [tid, count] of awards) {
        if (t.sourcePoint.SourcePoint.byTid.has(Number(tid))) sourcePointAdd(state, tid, count);
        else normal.push([tid, count]);
      }
      const granted = grant(ctx, normal, 'Source point trial');
      state.hero_task_claims.push(Number(trial.tid));
      saveState(ctx.db, ctx.roleId, SOURCE_POINT_KEY, state, ctx.at);
      return {
        schema: 'pb_source_point_task_rsp', actKey: SOURCE_POINT_KEY,
        value: { res: resOf(granted), hero_tasks: sourcePointTaskBytes(state) }
      };
    })
  });

  // ---- PLAY-ALBUM (110401-110403) ----------------------------------------
  const ALBUM_KEY = 'album:1';
  function albumState(ctx) {
    const state = loadState(ctx.db, ctx.roleId, ALBUM_KEY);
    state.furniture = Array.isArray(state.furniture) ? state.furniture.map(Number) : [];
    state.suits = Array.isArray(state.suits) ? state.suits.map(Number) : [];
    state.awards = Array.isArray(state.awards) ? state.awards.map(Number) : [];
    return state;
  }
  function albumRole(state) {
    return {
      furniture_list: state.furniture.map(Number),
      furniture_suit_list: state.suits.map(Number),
      furniture_suit_award_list: state.awards.map(Number)
    };
  }
  // Furniture ownership lives in the homeland depot, not in a grantable
  // resource family, so the album asks the depot instead of an item container.
  function ownedFurniture(ctx, tid) {
    const plaza = homelandState(ctx);
    return Object.values(plaza.furniture).some(entry => Number(entry.tid) === Number(tid));
  }

  register(110401, {
    card: 'PLAY-ALBUM', encoding: 'etf',
    handler: request => run('album', ctx => {
      const tid = Number(request.value ?? request.fields?.tid);
      requireRow(t.homeland.FurnitureAlbum, tid, 'Furniture album entry');
      requireRow(t.homeland.Furniture, tid, 'Furniture');
      if (!ownedFurniture(ctx, tid)) throw new GameError(311, 'Furniture album entry needs the owned furniture');
      const state = albumState(ctx);
      if (state.furniture.includes(tid)) throw new GameError(311, 'Furniture album entry is already active');
      state.furniture.push(tid);
      saveState(ctx.db, ctx.roleId, ALBUM_KEY, state, ctx.at);
      return { schema: 'pb_homeland_album_role', actKey: ALBUM_KEY, value: albumRole(state) };
    })
  });

  register(110402, {
    card: 'PLAY-ALBUM', encoding: 'etf',
    handler: request => run('album', ctx => {
      const suit = Number(request.value ?? request.fields?.tid);
      requireRow(t.homeland.FurnitureSuit, suit, 'Furniture suit');
      const members = t.homeland.Furniture.rows.filter(row => Number(row.suit) === suit).map(row => Number(row.tid));
      if (!members.length) throw new GameError(5, 'Furniture suit has no members');
      const state = albumState(ctx);
      if (state.suits.includes(suit)) throw new GameError(311, 'Furniture suit is already active');
      const missing = members.filter(tid => !state.furniture.includes(tid));
      if (missing.length) throw new GameError(311, 'Furniture suit is incomplete: ' + missing.slice(0, 5).join(','));
      state.suits.push(suit);
      saveState(ctx.db, ctx.roleId, ALBUM_KEY, state, ctx.at);
      return { schema: 'pb_homeland_album_role', actKey: ALBUM_KEY, value: albumRole(state) };
    })
  });

  register(110403, {
    card: 'PLAY-ALBUM', encoding: 'etf',
    handler: request => run('album', ctx => {
      const suit = Number(request.value ?? request.fields?.tid);
      const row = requireRow(t.homeland.FurnitureSuitAlbum, suit, 'Furniture suit album');
      const state = albumState(ctx);
      if (!state.suits.includes(suit)) throw new GameError(311, 'Furniture suit is not active');
      if (state.awards.includes(suit)) throw new GameError(311, 'Furniture suit album award is already claimed');
      const granted = grant(ctx, awardsOf(row.award, 'Furniture suit album'), 'Furniture album');
      state.awards.push(suit);
      saveState(ctx.db, ctx.roleId, ALBUM_KEY, state, ctx.at);
      return { schema: 'pb_res_to_client', actKey: ALBUM_KEY, value: resOf(granted) };
    })
  });

  // ---- PLAY-HOMELAND (110904-110913) -------------------------------------
  const HOMELAND_KEY = 'homeland:1';
  function homelandState(ctx) {
    const state = loadState(ctx.db, ctx.roleId, HOMELAND_KEY);
    if (Number(state.day) !== Number(ctx.day)) {
      state.day = Number(ctx.day);
      state.today_likes = [];
      state.today_visits = [];
    }
    state.level = Number(state.level ?? 1);
    state.prosperity = Number(state.prosperity ?? 0);
    state.today_likes = Array.isArray(state.today_likes) ? state.today_likes : [];
    state.today_visits = Array.isArray(state.today_visits) ? state.today_visits : [];
    state.rooms = state.rooms && typeof state.rooms === 'object' ? state.rooms : {};
    state.furniture = state.furniture && typeof state.furniture === 'object' ? state.furniture : {};
    state.total_like_count = Number(state.total_like_count ?? 0);
    state.finish_tasks = Array.isArray(state.finish_tasks) ? state.finish_tasks.map(Number) : [];
    return state;
  }
  function homelandDepot(state) {
    return {
      max_uid: 0,
      furniture_list: Object.entries(state.furniture).map(([uid, entry]) => ({
        tid: Number(entry.tid), uid: Number(uid), room_tid: Number(entry.room_tid ?? 0)
      })),
      level: state.level,
      prosperity: state.prosperity,
      house_list: [],
      finish_tasks: state.finish_tasks.map(Number),
      today_like_role_ids: state.today_likes.map(Number),
      today_visit_role_ids: state.today_visits.map(Number),
      today_visit_record_list: [],
      today_like_record_list: [],
      total_like_count: state.total_like_count,
      refresh_time: String(0)
    };
  }

  register(110904, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: () => run('homeland', ctx => {
      const state = homelandState(ctx);
      const finished = [];
      const awards = [];
      for (const row of t.homeland.Task.rows) {
        if (state.finish_tasks.includes(Number(row.tid))) continue;
        const progress = taskProgress(ctx, row);
        if (progress < Number(row.task_count)) continue;
        awards.push(...awardsOf(row.award, 'Homeland task award'));
        state.finish_tasks.push(Number(row.tid));
        finished.push(Number(row.tid));
      }
      const granted = grant(ctx, awards, 'Homeland task');
      saveState(ctx.db, ctx.roleId, HOMELAND_KEY, state, ctx.at);
      return {
        schema: 'pb_homeland_task_finish_rsp', actKey: HOMELAND_KEY,
        value: { task_tid_list: finished, res: resOf(granted) }
      };
    })
  });

  register(110905, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: () => run('homeland', ctx => {
      homelandState(ctx);
      return { schema: 'pb_homeland_familiar_info_rsp', actKey: HOMELAND_KEY, value: { familiar_role_list: [] } };
    })
  });

  register(110906, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: () => run('homeland', ctx => {
      homelandState(ctx);
      return { schema: 'pb_homeland_visit_record_list_rsp', actKey: HOMELAND_KEY, value: { today_visit_record_list: [], today_like_record_list: [] } };
    })
  });

  register(110907, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: request => run('homeland', ctx => {
      const target = Number(request.value ?? request.fields?.role_id ?? ctx.roleId);
      const state = homelandState(ctx);
      const limit = Number(requireRow(t.homeland.Const, 1, 'Homeland constants').day_support_time);
      if (!state.today_visits.includes(target) && state.today_visits.length >= limit) throw new GameError(311, 'Homeland visit limit is reached');
      if (!state.today_visits.includes(target)) state.today_visits.push(target);
      saveState(ctx.db, ctx.roleId, HOMELAND_KEY, state, ctx.at);
      return {
        schema: 'pb_homeland_visit_record_rsp', actKey: HOMELAND_KEY,
        value: { level: state.level, prosperity: state.prosperity, house_list: [], total_like_count: state.total_like_count, today_visit_role_ids: state.today_visits }
      };
    })
  });

  register(110908, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: request => run('homeland', ctx => {
      const target = Number(request.value ?? request.fields?.role_id ?? ctx.roleId);
      const state = homelandState(ctx);
      if (state.today_likes.includes(target)) throw new GameError(311, 'Homeland target is already liked today');
      const awarded = grant(ctx, awardsOf(requireRow(t.homeland.Const, 1, 'Homeland constants').like_award, 'Homeland like award'), 'Homeland');
      state.today_likes.push(target);
      state.total_like_count += 1;
      saveState(ctx.db, ctx.roleId, HOMELAND_KEY, state, ctx.at);
      return { schema: 'pb_homeland_like_rsp', actKey: HOMELAND_KEY, value: { today_like_role_ids: state.today_likes, res: resOf(awarded) } };
    })
  });

  register(110911, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: () => run('homeland', ctx => {
      const state = homelandState(ctx);
      const nextLevel = state.level + 1;
      const row = t.homeland.Level.rows.find(candidate => Number(candidate.tid) === nextLevel)
        ?? t.homeland.Level.rows.find(candidate => Number(candidate.level ?? candidate.tid) === nextLevel);
      if (!row) throw new GameError(311, 'Homeland level is already at the cap');
      const spent = spend(ctx, awardsOf(row.cost_item, 'Homeland level cost'), 'Homeland');
      state.level = nextLevel;
      state.prosperity += Number(row.prosperity_num ?? 0);
      saveState(ctx.db, ctx.roleId, HOMELAND_KEY, state, ctx.at);
      return {
        schema: 'pb_homeland_level_up_rsp', actKey: HOMELAND_KEY,
        value: { homeland: homelandDepot(state), res: resOf({ changes: spent.changes ?? [] }) }
      };
    })
  });

  register(110912, {
    card: 'PLAY-HOMELAND', encoding: 'etf',
    handler: request => run('homeland', ctx => {
      const room = Number(request.value ?? request.fields?.room_tid ?? 0);
      const state = homelandState(ctx);
      state.rooms[String(room)] = { cleaned_at: ctx.at };
      saveState(ctx.db, ctx.roleId, HOMELAND_KEY, state, ctx.at);
      return { schema: '', actKey: HOMELAND_KEY, value: {} };
    })
  });

  register(110913, {
    card: 'PLAY-HOMELAND', encoding: 'pb', request: 'pb_homeland_replace_req',
    handler: request => run('homeland', ctx => {
      const state = homelandState(ctx);
      for (const house of request.house_list ?? []) {
        for (const room of house.room_list ?? []) {
          for (const item of room.furniture_list ?? []) {
            const uid = Number(item.furniture_uid);
            const tid = Number(item.furniture_tid);
            if (!Number.isSafeInteger(uid) || uid <= 0) throw new GameError(1, 'Invalid homeland furniture uid');
            if (!t.homeland.Furniture.byTid.has(tid)) throw new GameError(5, 'Homeland furniture is not configured: ' + tid);
            state.furniture[String(uid)] = { tid, room_tid: Number(room.room_tid ?? 0) };
          }
        }
      }
      saveState(ctx.db, ctx.roleId, HOMELAND_KEY, state, ctx.at);
      return { schema: 'pb_homeland_depot', actKey: HOMELAND_KEY, value: homelandDepot(state) };
    })
  });

  // ---- PLAY-BAKINGACT (111001-111015) ------------------------------------
  const BAKING_TYPES = [1101, 1103];
  function bakingCtx(ctx, actId) {
    const resolved = Number(actId) > 0 ? Number(actId) : runningActIds(BAKING_TYPES, ctx.at).at(-1);
    if (!resolved) throw new GameError(309, 'Baking activity is not running');
    assertRunning(resolved, ctx.at, 'Baking');
    const { version } = assertActivity(resolved, BAKING_TYPES, 'baking');
    const config = t.baking.Version.byTid.get(version) ?? t.baking.Version.rows[0];
    const key = 'baking:' + resolved;
    const state = loadState(ctx.db, ctx.roleId, key);
    state.act_id = resolved;
    state.version = version;
    state.lv = Number(state.lv ?? 1);
    state.stamina = Number(state.stamina ?? config.init_stamina);
    state.stamina_time = Number(state.stamina_time ?? ctx.at);
    state.score = Number(state.score ?? 0);
    state.daily_score = Number(state.day) === Number(ctx.day) ? Number(state.daily_score ?? 0) : 0;
    state.day = Number(ctx.day);
    state.grid = Array.isArray(state.grid) ? state.grid : [];
    state.received_lv = Array.isArray(state.received_lv) ? state.received_lv : [];
    state.batch_model = Number(state.batch_model ?? 0);
    state.updated = Number(state.updated ?? ctx.at);
    state.order_tid = Number(state.order_tid ?? 0);
    state.order_time = Number(state.order_time ?? 0);
    state.order_end = Number(state.order_end ?? 0);
    state.finish_times = Number(state.finish_times ?? 0);
    state.continuous = Number(state.continuous ?? 0);
    state.give_up_list = Array.isArray(state.give_up_list) ? state.give_up_list : [];
    const interval = Number(config.recover_time);
    if (interval > 0 && ctx.at - state.stamina_time >= interval) {
      const ticks = Math.floor((ctx.at - state.stamina_time) / interval);
      state.stamina = Math.min(Number(config.max_stamina), state.stamina + ticks * Number(config.recover_num));
      state.stamina_time += ticks * interval;
    }
    if (!state.order_tid) bakingGenerateOrder(state, version, ctx.at);
    return { key, state, config, version };
  }
  function bakingGrids(state) {
    return state.grid.map(cell => ({
      x: Number(cell.x), y: Number(cell.y), grid_type: Number(cell.type ?? 1),
      cake_type_tid: Number(cell.cake_type ?? 0), cake_lv: Number(cell.lv ?? 0),
      can_click_times: Number(cell.clicks ?? 0)
    }));
  }
  function bakingData(state) {
    return {
      act_id: state.act_id,
      lv: state.lv,
      received_lv_tid_list: state.received_lv.map(Number),
      grids: bakingGrids(state),
      order: {
        cur_order_tid: Number(state.order_tid ?? 0), order_gen_time: String(Number(state.order_time ?? 0)),
        order_end_time: String(Number(state.order_end ?? 0)), finish_order_times: Number(state.finish_times ?? 0),
        continuous_common_order_times: Number(state.continuous ?? 0),
        give_up_order_list: (state.give_up_list ?? []).map(entry => ({
          order_tid: Number(entry.order_tid ?? 0), remain_times: Number(entry.remain_times ?? 0)
        }))
      },
      res: {
        score: state.score, stamina: state.stamina, stamina_last_update_time: String(state.stamina_time),
        daily_score: state.daily_score, last_update_time: String(ctxTimestamp(state))
      },
      buy_limit_info: {},
      batch_synthesize_model: state.batch_model
    };
  }
  function ctxTimestamp(state) { return Number(state.updated ?? 0); }
  function bakingLv(state, version) {
    return t.baking.Lv.rows.find(row => Number(row.belonging_version) === Number(version) && Number(row.level) === Number(state.lv))
      ?? t.baking.Lv.rows.find(row => Number(row.level) === Number(state.lv));
  }
  function bakingSize(config) {
    const [width, height] = config.grid_size ?? [7, 8];
    return { width: Number(width), height: Number(height) };
  }
  function bakingKey(x, y) { return Number(x) + ',' + Number(y); }
  function bakingCell(state, x, y) {
    return state.grid.find(cell => Number(cell.x) === Number(x) && Number(cell.y) === Number(y));
  }
  function bakingOpenCells(state, config) {
    const { width, height } = bakingSize(config);
    const cakeCount = state.grid.filter(cell => Number(cell.type) === 1).length;
    const open = new Set();
    for (const area of t.baking.Area.rows.filter(row => Number(row.belonging_version) === Number(state.version))) {
      if (cakeCount < Number(area.need_cake_num)) continue;
      const [sx, sy] = area.grid_start_range ?? [0, 0];
      const [ex, ey] = area.grid_end_range ?? [width - 1, height - 1];
      for (let x = Math.max(0, Number(sx)); x <= Math.min(width - 1, Number(ex)); x += 1) {
        for (let y = Math.max(0, Number(sy)); y <= Math.min(height - 1, Number(ey)); y += 1) open.add(bakingKey(x, y));
      }
    }
    return open;
  }
  function bakingOrderRow(tid) { return t.baking.Order.byTid.get(Number(tid)); }
  function bakingGenerateOrder(state, version, at, { forceTimed = false } = {}) {
    const level = bakingLv(state, version);
    const entries = (level?.order_weight_list ?? []).map(entry => ({ weight: Number(entry[0]), group: Number(entry[1]) }));
    const timed = entries.filter(entry => t.baking.Order.rows.some(row => Number(row.group) === entry.group && Number(row.expire_time) > 0));
    const pool = forceTimed && timed.length ? timed : entries;
    if (!pool.length) throw new GameError(5, 'Baking order weights are not configured');
    const group = Number(weightedPick(pool.map(entry => ({ weight: entry.weight, group: entry.group })), { label: 'Baking order group' }).group);
    const rows = t.baking.Order.rows.filter(row => Number(row.group) === group);
    if (!rows.length) throw new GameError(5, 'Baking order group is empty: ' + group);
    const order = weightedPick(rows, { label: 'Baking order' });
    state.order_tid = Number(order.tid);
    state.order_time = Number(at);
    state.order_end = Number(order.expire_time) > 0 ? Number(at) + Number(order.expire_time) : 0;
    return order;
  }
  function bakingCellAtRequest(request, state, config) {
    const { width, height } = bakingSize(config);
    const x = Number(request.x ?? request.x1), y = Number(request.y ?? request.y1);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x < 0 || y < 0 || x >= width || y >= height) {
      throw new GameError(1, 'Baking position is outside the board');
    }
    if (!bakingOpenCells(state, config).has(bakingKey(x, y))) throw new GameError(311, 'Baking position is not unlocked');
    return { x, y, cell: bakingCell(state, x, y) };
  }

  register(111010, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_get_new_act_data_req',
    handler: request => run('baking', ctx => {
      const { key, state } = bakingCtx(ctx, request.act_id);
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_get_new_act_data_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111001, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_rec_lv_award_req',
    handler: request => run('baking', ctx => {
      const { key, state, version } = bakingCtx(ctx, request.act_id);
      const ids = (request.lv_tid_list ?? (request.tid ? [request.tid] : [])).map(Number);
      if (!ids.length) throw new GameError(1, 'Baking level award list is empty');
      if (new Set(ids).size !== ids.length) throw new GameError(1, 'Baking level award list contains duplicates');
      const awards = [];
      for (const tid of ids) {
        const row = requireRow(t.baking.Lv, tid, 'Baking level');
        if (Number(row.belonging_version) !== version) throw new GameError(1, 'Baking level does not belong to this version');
        if (Number(row.level) > Number(state.lv)) throw new GameError(311, 'Baking level is not reached');
        if (state.received_lv.includes(Number(row.tid))) throw new GameError(311, 'Baking level award is already claimed');
        awards.push(...awardsOf(row.award, 'Baking level award'));
        state.received_lv.push(Number(row.tid));
      }
      const granted = grant(ctx, awards, 'Baking');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_rec_lv_award_rsp', actKey: key, value: { act_data: bakingData(state), res: resOf(granted) } };
    })
  });

  register(111002, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_swap_req',
    handler: request => run('baking', ctx => {
      const { key, state, config } = bakingCtx(ctx, request.act_id);
      const first = bakingCellAtRequest({ x: request.x1, y: request.y1 }, state, config);
      const second = bakingCellAtRequest({ x: request.x2, y: request.y2 }, state, config);
      if (first.x === second.x && first.y === second.y) throw new GameError(1, 'Baking swap positions are identical');
      if (!first.cell) throw new GameError(1, 'Baking swap source is empty');
      const firstX = first.x, firstY = first.y, secondX = second.x, secondY = second.y;
      if (second.cell) {
        first.cell.x = secondX; first.cell.y = secondY;
        second.cell.x = firstX; second.cell.y = firstY;
      } else {
        first.cell.x = secondX; first.cell.y = secondY;
      }
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_swap_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111003, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_synthesize_req',
    handler: request => run('baking', ctx => {
      const { key, state, config } = bakingCtx(ctx, request.act_id);
      const first = bakingCellAtRequest({ x: request.x1, y: request.y1 }, state, config);
      const second = bakingCellAtRequest({ x: request.x2, y: request.y2 }, state, config);
      if (Math.abs(first.x - second.x) + Math.abs(first.y - second.y) !== 1) throw new GameError(1, 'Baking synthesis positions are not adjacent');
      if (!first.cell || !second.cell) throw new GameError(311, 'Baking synthesis needs two cakes');
      if (Number(first.cell.type) !== 1 || Number(second.cell.type) !== 1) throw new GameError(311, 'Baking synthesis needs two cakes');
      if (Number(first.cell.cake_type) !== Number(second.cell.cake_type) || Number(first.cell.lv) !== Number(second.cell.lv)) {
        throw new GameError(311, 'Baking synthesis cakes do not match');
      }
      const maxLevel = Number(t.baking.Global.rows[0]?.level_max ?? 8);
      if (Number(first.cell.lv) >= maxLevel) throw new GameError(311, 'Baking cake is already at max level');
      const type = Number(first.cell.cake_type), level = Number(first.cell.lv);
      state.grid = state.grid.filter(cell => cell !== first.cell && cell !== second.cell);
      state.grid.push({ x: second.x, y: second.y, type: 1, cake_type: type, lv: level + 1, clicks: 0 });
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_synthesize_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111004, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_batch_synthesize_req',
    handler: request => run('baking', ctx => {
      const { key, state, config } = bakingCtx(ctx, request.act_id);
      const maxLevel = Number(t.baking.Global.rows[0]?.level_max ?? 8);
      const synthesizes = [];
      let minLv = 0;
      for (let guard = 0; guard < 1000; guard += 1) {
        const pairs = [];
        for (const cell of state.grid) {
          if (Number(cell.type) !== 1) continue;
          for (const [dx, dy] of [[1, 0], [0, 1]]) {
            const other = bakingCell(state, Number(cell.x) + dx, Number(cell.y) + dy);
            if (!other || Number(other.type) !== 1) continue;
            if (Number(other.cake_type) !== Number(cell.cake_type) || Number(other.lv) !== Number(cell.lv)) continue;
            if (Number(cell.lv) >= maxLevel) continue;
            pairs.push([cell, other]);
          }
        }
        if (!pairs.length) break;
        pairs.sort((left, right) => (Number(left[0].lv) - Number(right[0].lv))
          || (Number(left[1].y) - Number(right[1].y)) || (Number(left[1].x) - Number(right[1].x)));
        const [first, second] = pairs[0];
        const type = Number(first.cake_type), level = Number(first.lv);
        state.grid = state.grid.filter(cell => cell !== first && cell !== second);
        state.grid.push({ x: Number(second.x), y: Number(second.y), type: 1, cake_type: type, lv: level + 1, clicks: 0 });
        minLv = minLv === 0 ? level : Math.min(minLv, level);
        synthesizes.push({ grid: bakingGrids(state), sort: synthesizes.length });
      }
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return {
        schema: 'pb_baking_batch_synthesize_rsp', actKey: key,
        value: { act_data: bakingData(state), synthesizes, min_lv: minLv }
      };
    })
  });

  register(111005, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_make_cake_req',
    handler: request => run('baking', ctx => {
      const { key, state, config, version } = bakingCtx(ctx, request.act_id);
      const cost = Number(config.make_cost_stamina) || 1;
      if (state.stamina < cost) throw new GameError(311, 'Baking stamina is exhausted');
      const level = bakingLv(state, version);
      const open = bakingOpenCells(state, config);
      const occupied = state.grid.filter(cell => open.has(bakingKey(cell.x, cell.y))).length;
      const free = Math.max(0, open.size - occupied);
      const maxMake = Number(t.baking.Global.rows[0]?.make_num ?? 10);
      const requested = request.num === undefined ? 1 : Number(request.num);
      if (!Number.isSafeInteger(requested) || requested <= 0) throw new GameError(1, 'Invalid baking make count');
      const count = Math.min(requested, Math.floor(state.stamina / cost), free, maxMake);
      if (count <= 0) throw new GameError(311, 'Baking board or stamina cannot fit another cake');
      const weights = (level?.cake_weight_list ?? []).map(entry => ({ weight: Number(entry[0]), value: Number(entry[1]) }));
      const levels = (level?.cake_lv_list ?? []).map((value, index) => ({
        weight: Number((level?.cake_lv_weight_list ?? [])[index] ?? 0), value: Number(value)
      })).filter(entry => entry.weight > 0);
      const slots = [...open].map(key => key.split(',').map(Number))
        .filter(([x, y]) => !state.grid.some(cell => Number(cell.x) === x && Number(cell.y) === y))
        .sort((left, right) => (left[1] - right[1]) || (left[0] - right[0]));
      for (let index = 0; index < count; index += 1) {
        const cake = weights.length ? Number(weightedPick(weights, { label: 'Baking cake' }).value) : 1;
        const cakeLv = levels.length ? Number(weightedPick(levels, { label: 'Baking cake level' }).value) : 1;
        const [x, y] = slots[index];
        state.grid.push({ x, y, type: 1, cake_type: cake, lv: cakeLv, clicks: 0 });
      }
      state.stamina -= cost * count;
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_make_cake_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111006, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_give_up_order_req',
    handler: request => run('baking', ctx => {
      const { key, state, config, version } = bakingCtx(ctx, request.act_id);
      const order = bakingOrderRow(state.order_tid);
      if (!order) throw new GameError(311, 'Baking has no current order');
      const spent = spend(ctx, [[Number(config.abandon_item), Number(config.abandon_item_num)]], 'Baking give up order');
      state.give_up_list.push({
        order_tid: Number(state.order_tid),
        remain_times: Number(order.expire_time) > 0 ? Math.max(0, Number(state.order_end) - ctx.at) : 0
      });
      state.continuous = 0;
      bakingGenerateOrder(state, version, ctx.at);
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_give_up_order_rsp', actKey: key, value: { act_data: bakingData(state), res: resOf(spent) } };
    })
  });

  register(111007, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_use_item_req',
    handler: request => run('baking', ctx => {
      const { key, state } = bakingCtx(ctx, request.act_id);
      const tid = Number(request.item_tid ?? request.tid);
      const num = Math.max(1, Number(request.num ?? request.use_num) || 1);
      if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid baking item');
      const spent = spend(ctx, [[tid, num]], 'Baking');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_use_item_rsp', actKey: key, value: { act_data: bakingData(state), res: resOf(spent) } };
    })
  });

  register(111008, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_use_cheat_item_req',
    handler: request => run('baking', ctx => {
      const { key, state } = bakingCtx(ctx, request.act_id);
      const row = requireRow(t.baking.Cheat, request.tid, 'Baking cheat item');
      spend(ctx, [[Number(row.cost_item), Number(row.cost_item_num)]], 'Baking cheat');
      const awards = Number(row.item) > 0 ? [[Number(row.item), Number(row.effect_value)]] : [];
      const granted = grant(ctx, awards, 'Baking cheat');
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_use_cheat_item_rsp', actKey: key, value: { act_data: bakingData(state), res: resOf(granted) } };
    })
  });

  register(111009, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_yeast_click_req',
    handler: request => run('baking', ctx => {
      const { key, state } = bakingCtx(ctx, request.act_id);
      const x = Number(request.x ?? 0), y = Number(request.y ?? 0);
      const cell = state.grid.find(entry => Number(entry.x) === x && Number(entry.y) === y && Number(entry.type) === 2);
      if (!cell) throw new GameError(311, 'Baking yeast cell is not present');
      if (Number(cell.clicks ?? 0) <= 0) throw new GameError(311, 'Baking yeast cell has no clicks left');
      cell.clicks = Number(cell.clicks) - 1;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_yeast_click_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111011, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_handle_event_req',
    handler: request => run('baking', ctx => {
      const { key, state, config } = bakingCtx(ctx, request.act_id);
      const position = bakingCellAtRequest({ x: request.x, y: request.y }, state, config);
      if (!position.cell || Number(position.cell.type) !== 4) throw new GameError(311, 'Baking event cell is not present');
      const events = t.baking.SpecialEvent.rows.filter(row => Number(row.item) === Number(position.cell.cake_type));
      const event = events.find(row => Number(row.reward_version) === Number(position.cell.lv)) ?? events[0];
      if (!event) throw new GameError(5, 'Baking event is not configured');
      const param = Number(request.param1);
      const award = param === 1 ? event.award1 : param === 2 ? event.award2 : null;
      if (award === null) throw new GameError(1, 'Invalid baking event choice');
      const awards = Array.isArray(award) ? awardsOf(award, 'Baking event award') : [];
      const granted = grant(ctx, awards, 'Baking event');
      state.grid = state.grid.filter(cell => cell !== position.cell);
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_handle_event_rsp', actKey: key, value: { act_data: bakingData(state), res: resOf(granted) } };
    })
  });

  register(111012, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_submit_order_req',
    handler: request => run('baking', ctx => {
      const { key, state, config, version } = bakingCtx(ctx, request.act_id);
      const order = bakingOrderRow(state.order_tid);
      if (!order) throw new GameError(311, 'Baking has no current order');
      if (Number(state.order_end) > 0 && ctx.at > Number(state.order_end)) throw new GameError(311, 'Baking order has expired');
      const positions = Array.isArray(request.pos) ? request.pos : [];
      if (!positions.length) throw new GameError(1, 'Baking order submit list is empty');
      const open = bakingOpenCells(state, config);
      const seen = new Set();
      const cells = [];
      for (const position of positions) {
        const x = Number(position.x), y = Number(position.y);
        const keyPos = bakingKey(x, y);
        if (seen.has(keyPos)) throw new GameError(1, 'Baking order submit contains duplicate positions');
        seen.add(keyPos);
        if (!open.has(keyPos)) throw new GameError(311, 'Baking order position is not unlocked');
        const cell = bakingCell(state, x, y);
        if (!cell || Number(cell.type) !== 1) throw new GameError(311, 'Baking order position has no cake');
        cells.push(cell);
      }
      const required = new Map();
      for (const entry of order.cake_list ?? []) {
        const cakeType = Number(entry[0]), cakeLv = Number(entry[1]), num = Number(entry[2]);
        const keyCake = cakeType + ':' + cakeLv;
        required.set(keyCake, (required.get(keyCake) ?? 0) + num);
      }
      for (const cell of cells) {
        const keyCake = Number(cell.cake_type) + ':' + Number(cell.lv);
        if (!required.has(keyCake)) throw new GameError(311, 'Baking order contains an unexpected cake');
        required.set(keyCake, required.get(keyCake) - 1);
        if (required.get(keyCake) < 0) throw new GameError(311, 'Baking order contains too many cakes');
      }
      if ([...required.values()].some(value => value !== 0)) throw new GameError(311, 'Baking order is not complete');
      state.grid = state.grid.filter(cell => !cells.includes(cell));
      const scoreRate = Number(t.baking.Global.rows[0]?.score_rate ?? 1) || 1;
      const addScore = Number(order.add_score ?? 0) * scoreRate;
      state.score += addScore;
      state.daily_score += addScore;
      state.finish_times += 1;
      if (Number(order.expire_time) > 0) state.continuous = 0;
      else state.continuous += 1;
      const awards = Array.isArray(order.award) ? awardsOf(order.award, 'Baking order award') : [];
      const granted = grant(ctx, awards, 'Baking order');
      bakingGenerateOrder(state, version, ctx.at);
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_submit_order_rsp', actKey: key, value: { act_data: bakingData(state), res: resOf(granted) } };
    })
  });

  register(111013, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_refresh_time_limit_order_req',
    handler: request => run('baking', ctx => {
      const { key, state, version } = bakingCtx(ctx, request.act_id);
      const order = bakingOrderRow(state.order_tid);
      if (!order) throw new GameError(311, 'Baking has no current order');
      if (Number(order.expire_time) <= 0) throw new GameError(311, 'Baking current order is not timed');
      bakingGenerateOrder(state, version, ctx.at, { forceTimed: true });
      state.updated = ctx.at;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_refresh_time_limit_order_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111014, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_one_key_sort_req',
    handler: request => run('baking', ctx => {
      const { key, state } = bakingCtx(ctx, request.act_id);
      state.grid.sort((left, right) => (Number(left.type) - Number(right.type)) || (Number(left.cake_type ?? 0) - Number(right.cake_type ?? 0)));
      state.grid = state.grid.map((cell, index) => ({ ...cell, x: index % 7, y: Math.floor(index / 7) }));
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_one_key_sort_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  register(111015, {
    card: 'PLAY-BAKINGACT', encoding: 'pb', request: 'pb_baking_select_batch_synthesize_model_req',
    handler: request => run('baking', ctx => {
      const { key, state } = bakingCtx(ctx, request.act_id);
      const model = Number(request.model ?? request.batch_synthesize_model);
      if (model !== 0 && model !== 1) throw new GameError(1, 'Baking batch model must be 0 or 1');
      state.batch_model = model;
      saveState(ctx.db, ctx.roleId, key, state, ctx.at);
      return { schema: 'pb_baking_select_batch_synthesize_model_rsp', actKey: key, value: { act_data: bakingData(state) } };
    })
  });

  // ---- login synchronisation ---------------------------------------------
  function dreamRoleData(state) {
    return {
      version: Number(state.version ?? 0),
      challenge_score: Number(state.challenge_score ?? 0),
      seize_score: Number(state.seize_score ?? 0),
      challenge_times: Number(state.challenge_times ?? 0),
      last_challenge_time: String(0),
      raided_times: Number(state.raided_times ?? 0),
      last_update_time: String(0),
      rob_times: Number(state.rob_times ?? 0),
      last_rob_time: String(0),
      enemy_list: [],
      report_list: [],
      damage_list: []
    };
  }

  const LOGIN_CARDS = [
    {
      types: TOWER_TYPES,
      login: (ctx, actId) => {
        const { state } = towerStateFor(ctx, actId);
        saveState(ctx.db, ctx.roleId, 'tower:' + actId, state, ctx.at);
        return codec.pack('pb_tower_act_role', towerRole(state, actId));
      }
    },
    {
      types: [170],
      login: (ctx, actId) => {
        const version = Number(tables.ActFrameAct.get(actId)?.version ?? 1);
        const { key, state } = gopherState(ctx, version);
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        return codec.pack('pb_beat_gopher_person_list', { person_list: [gopherPerson(state, version)] });
      }
    },
    {
      types: TRIPLE_TYPES,
      login: (ctx, actId) => {
        const { key, state, version } = tripleGame(ctx, actId);
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        return codec.pack('pb_triple_match_act_info', tripleInfo(state, version));
      }
    },
    {
      types: MATCHING_TYPES,
      login: (ctx, actId) => {
        const { key, state } = matchingState(ctx, actId);
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        return codec.pack('pb_role_matching_game_act_info', matchingInfo(state, actId));
      }
    },
    {
      types: MONOPOLY_TYPES,
      login: (ctx, actId) => {
        const { key, state } = monopolyCtx(ctx, actId);
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        const version = Number(tables.ActFrameAct.get(actId)?.version ?? 1);
        return codec.pack('pb_monopoly_act_login', {
          act_role_data: monopolyRole(state, version),
          guild_data: monopolyGuildData(state, version, ctx.roleId),
          res: resOf({ changes: [] }),
          guild_count_statics_send: monopolyGuildStatisticsSend(state)
        });
      }
    },
    {
      types: DREAM_TYPES,
      login: (ctx, actId) => {
        const key = 'dream:' + actId;
        const state = loadState(ctx.db, ctx.roleId, key);
        state.version = Number(tables.ActFrameAct.get(actId)?.version ?? state.version ?? 0);
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        return codec.pack('pb_dream_trial_role_data', dreamRoleData(state));
      }
    },
    {
      types: DIAMOND_TYPES,
      login: (ctx, actId) => {
        const { key, state } = diamondCtx(ctx, actId);
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        return codec.pack('pb_diamond_vein_act_login', {
          role_data: diamondRole(state, actId),
          server_data: { act_tid: actId, map_list: [], handle_high_day_index: 0, is_settle: false },
          guild_data: { act_tid: actId, focus_map_id: state.focus_map_id, merit_total: state.merit, merit_list: [] }
        });
      }
    },
    {
      types: BAKING_TYPES,
      login: (ctx, actId) => {
        const { key, state } = bakingCtx(ctx, actId);
        state.updated = ctx.at;
        saveState(ctx.db, ctx.roleId, key, state, ctx.at);
        return codec.pack('pb_baking_act_data', bakingData(state));
      }
    }
  ];

  async function decode(type, bytes) {
    const spec = commands.get(Number(type));
    if (!spec) throw new GameError(1, 'Unknown mini-game command');
    if (spec.encoding === 'pb') return unpackPb(spec.request, bytes);
    if (spec.encoding === 'etf') return etfRequest(bytes);
    const buffer = bytes ?? Buffer.alloc(0);
    if (!buffer.length) return {};
    try {
      const value = codec.unpack(spec.request, buffer);
      if (value && (value.version !== undefined || value.score !== undefined)) return value;
    } catch {}
    return etfRequest(buffer);
  }

  function execute(type, request) {
    const spec = commands.get(Number(type));
    if (!spec) throw new GameError(1, 'Unknown mini-game command');
    const result = spec.handler(request ?? {});
    log({ event: 'minigame_command_committed', type: Number(type), card: spec.card, actKey: result.actKey });
    return result;
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    activity.act_list ??= [];
    const roleId = Number(store.state().roleId);
    const synced = [];
    for (const card of LOGIN_CARDS) {
      for (const actId of runningActIds(card.types, at)) {
        const payload = store.transaction((model, db) => {
          const ctx = { model, db, at, roleId, day: dayIndex(at) };
          return card.login(ctx, actId);
        });
        applyLoginEntry(activity, actId, payload, at);
        synced.push(actId);
      }
    }
    if (synced.length) log({ event: 'minigame_login_synchronized', actIds: synced });
    return synced;
  }

  return {
    moduleId: LOGIN_MODULE,
    supports: type => commands.has(Number(type)),
    commandTypes: () => [...commands.keys()].sort((left, right) => left - right),
    commandCard: type => commands.get(Number(type))?.card ?? null,
    isSourcePointReward,
    grantSourcePointRewards,
    decode,
    execute,
    synchronizeLogin,
    runningActIds
  };
}

