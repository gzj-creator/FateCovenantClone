import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { readHelpUpActTables } from '../config/help-up-act-tables.mjs';
import { currentTaskProgress } from './task-service.mjs';
import { dayZero } from './activity-calendar.mjs';

const reads = new Map([
  [117005, ['pb_hundred_draw_act_marquee_rsp', { data: {} }]]
]);

const refused = new Map();

// HelpUpActCmd is owned by ActFrameTable.Act 1096001 (type 1096, version 1,
// "助力升超凡活动"). Every request carries act_id, and HelpUpActMgr guards the
// forms with IsRunning, so the commands only answer while the window is open.
const HELP_UP_ACT_TYPE = 1096;
const HELP_UP_TYPES = new Set([116001, 116002, 116003, 116004]);
// HelpUpActData splits the returned tid maps by HelpUpActTable.Task.cycle_type
// against Constants.CYCLE_DAILY; the shipped rows only use cycle_type 1.
const HELP_UP_DAILY_CYCLE = 1;
// Calendar.ACT_STATE_RUNNING: the activity entry the login block publishes.
const RUNNING_STATE_ID = 50;

const DEFAULT_STATE_BLOCK = Buffer.from([0]).toString('base64');
const FISHING_ACT_FIRST = 1074001;
const FISHING_ACT_LAST = 1074011;
// FishingActTable.FISH_TYPE_FISH / FISH_TYPE_BOX; only ordinary fish enter the codex.
const FISH_TYPE_FISH = 0;
// FishingActTable.FISH_VALUE_TYPE_HIGH marks the special fish whose sizes feed
// pb_fishing_act_role_data.high_size ("特殊鱼总尺寸") and the up-rank threshold.
const FISH_VALUE_TYPE_HIGH = 1;
const FISHING_MUTATIONS = [110301, 110302, 110303, 110304, 110305, 110306, 110307, 110308, 110309, 110310, 110311];

function parseJsonList(value) {
  const parsed = JSON.parse(value || '[]');
  if (!Array.isArray(parsed)) throw new Error('Fishing state list is not an array');
  return parsed;
}

function parseJsonObject(value) {
  const parsed = JSON.parse(value || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Fishing state object is invalid');
  return parsed;
}

function roleData(state) {
  return {
    act_id: String(state.act_id),
    get_num: String(state.get_num),
    high_size_list: parseJsonList(state.high_size_list_json),
    score: String(state.score),
    base_score: String(state.base_score),
    high_size: String(state.high_size),
    rod: String(state.rod),
    weather_list: parseJsonList(state.weather_list_json),
    book_state: Buffer.from(state.book_state || DEFAULT_STATE_BLOCK, 'base64'),
    unlock_map_list: parseJsonList(state.unlock_map_list_json).map(Number),
    level_state: Buffer.from(state.level_state || DEFAULT_STATE_BLOCK, 'base64'),
    go_rank_reward: Boolean(state.go_rank_reward),
    have_rod_list: parseJsonList(state.have_rod_list_json).map(Number),
    get_money_num: String(state.get_money_num),
    wait_fish: parseJsonObject(state.wait_fish_json),
    buy_limit_info: parseJsonObject(state.buy_limit_info_json),
    progress_state: Buffer.from(state.progress_state || DEFAULT_STATE_BLOCK, 'base64')
  };
}

function fishingLevel(score, islandVersion, levels) {
  const scoreValue = BigInt(String(score));
  let level = 0;
  for (const row of levels?.values() ?? []) {
    if (Number(row.belonging_version) === islandVersion && scoreValue >= BigInt(row.score)) level = Math.max(level, Number(row.level));
  }
  return level;
}

// pb_fishing_act_new_fish_record.name carries the catching role's display name.
// The store keeps to_client_role_info bytes as base64 text, so accept both forms.
function roleDisplayName(role) {
  const raw = role?.nick_name ?? role?.name ?? '';
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (typeof raw !== 'string' || !raw) return '';
  const decoded = Buffer.from(raw, 'base64');
  if (!decoded.length) return raw;
  const padding = '='.repeat((4 - (raw.length % 4)) % 4);
  return decoded.toString('base64') === raw + padding ? decoded.toString('utf8') : raw;
}

function newState(actId, timestamp) {
  return {
    act_id: actId,
    get_num: '0',
    high_size_list_json: '[]',
    score: '0',
    base_score: '0',
    high_size: '0',
    rod: '0',
    weather_list_json: '[]',
    book_state: DEFAULT_STATE_BLOCK,
    unlock_map_list_json: '[]',
    level_state: DEFAULT_STATE_BLOCK,
    go_rank_reward: 0,
    have_rod_list_json: '[]',
    get_money_num: '0',
    wait_fish_json: '{}',
    buy_limit_info_json: '{}',
    progress_state: DEFAULT_STATE_BLOCK,
    created_at: timestamp,
    updated_at: timestamp
  };
}

function weightedPick(rows, weightOf, sampler = Math.random) {
  const populated = [...rows].map(row => [row, Number(weightOf(row)) || 0]).filter(([, weight]) => weight > 0);
  if (!populated.length) return rows[0] ?? null;
  const total = populated.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = sampler() * total;
  for (const [row, weight] of populated) {
    roll -= weight;
    if (roll < 0) return row;
  }
  return populated.at(-1)[0];
}

export function createActivityReadService({ codec, store, tables, calendar, logger = () => {}, now = Date.now, random = Math.random }) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => Math.floor(Number(now()) / 1000);
  const nowIso = () => new Date(currentSeconds() * 1000).toISOString();
  const sample = () => Math.max(0, Math.min(1 - Number.EPSILON, Number(random()) || 0));

  function storedActivity() {
    const module = new Map(store.state().modules.value).get(92);
    if (!module) return null;
    try {
      return codec.unpack('pb_act_login', rawBinary(module));
    } catch {
      return null;
    }
  }

  function fishingConfiguration(actId) {
    if (!Number.isSafeInteger(actId) || actId < FISHING_ACT_FIRST || actId > FISHING_ACT_LAST) {
      throw new GameError(1, 'Unknown fishing activity');
    }
    const act = tables?.ActFrameAct?.get(actId);
    if (!act) throw new GameError(1, 'Unknown fishing activity');
    const version = tables?.FishingVersion?.get(Number(act.version));
    if (!version) throw new GameError(5, 'Fishing activity version is not configured');
    return { act, version };
  }

  function assertRunning(actId) {
    if (!calendar?.isActivityRunning(actId, null, storedActivity(), currentSeconds())) throw new GameError(309, 'Activity is not running');
  }

  function existingState(db, roleId, actId) {
    return db.prepare('SELECT * FROM fishing_activity_state WHERE role_id=? AND act_id=?').get(roleId, actId) ?? null;
  }

  function saveState(db, roleId, state) {
    db.prepare(`INSERT INTO fishing_activity_state (
      role_id, act_id, get_num, high_size_list_json, score, base_score, high_size, rod,
      weather_list_json, book_state, unlock_map_list_json, level_state, go_rank_reward,
      have_rod_list_json, get_money_num, wait_fish_json, buy_limit_info_json, progress_state,
      created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(role_id,act_id) DO UPDATE SET
      get_num=excluded.get_num, high_size_list_json=excluded.high_size_list_json,
      score=excluded.score, base_score=excluded.base_score, high_size=excluded.high_size,
      rod=excluded.rod, weather_list_json=excluded.weather_list_json,
      book_state=excluded.book_state, unlock_map_list_json=excluded.unlock_map_list_json,
      level_state=excluded.level_state, go_rank_reward=excluded.go_rank_reward,
      have_rod_list_json=excluded.have_rod_list_json, get_money_num=excluded.get_money_num,
      wait_fish_json=excluded.wait_fish_json, buy_limit_info_json=excluded.buy_limit_info_json,
      progress_state=excluded.progress_state, updated_at=excluded.updated_at`).run(
      roleId, state.act_id, state.get_num, state.high_size_list_json, state.score, state.base_score,
      state.high_size, state.rod, state.weather_list_json, state.book_state,
      state.unlock_map_list_json, state.level_state, state.go_rank_reward,
      state.have_rod_list_json, state.get_money_num, state.wait_fish_json,
      state.buy_limit_info_json, state.progress_state, state.created_at, state.updated_at
    );
  }

  // Catches are the authority for 110303 (per-fish top three) and 110308
  // (recent catches); both responses are built from rows this service writes
  // inside the collecting transaction.
  function ensureCatchTable(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS fishing_act_catches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      fish_id INTEGER NOT NULL,
      size INTEGER NOT NULL,
      score TEXT NOT NULL,
      map_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      caught_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS fishing_act_catches_pool_idx ON fishing_act_catches(act_id,fish_id,size);
    CREATE INDEX IF NOT EXISTS fishing_act_catches_recent_idx ON fishing_act_catches(act_id,id);`);
  }

  if (store?.inspect) store.inspect(ensureCatchTable);

  // FishingActRodChangeNode opens CommonGetWayNewForm(FishingRod.item) for rods
  // missing from have_rod_list, so owning the rod item activates it. Rods that
  // were granted by another path are never dropped from the stored list.
  function syncRodLibrary(model, state, version) {
    const activated = new Set(parseJsonList(state.have_rod_list_json).map(Number).filter(value => value > 0));
    for (const rod of tables.FishingRod?.values() ?? []) {
      if (Number(rod.ver) !== Number(version.fishing_rod_library)) continue;
      if (rod.is_free || model.resources.has(String(rod.item))) activated.add(Number(rod.tid));
    }
    const sorted = [...activated].sort((left, right) => left - right);
    state.have_rod_list_json = JSON.stringify(sorted);
    return sorted;
  }

  function codexFish(version) {
    const library = Number(version.illustrated_guide_version_library);
    return [...(tables.FishingFish?.values() ?? [])]
      .filter(fish => Number(fish.version) === library && Number(fish.type) === FISH_TYPE_FISH)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function unlockedFishIdSet(state) {
    return new Set(parseJsonList(state.high_size_list_json).map(row => Number(row.fish_id)));
  }

  function levelRows(version) {
    const library = Number(version.level_library);
    return [...(tables.FishingLevel?.values() ?? [])]
      .filter(row => Number(row.belonging_version) === library)
      .sort((left, right) => Number(left.level) - Number(right.level));
  }

  function progressRows(version) {
    return [...(tables.FishingProgress?.values() ?? [])]
      .filter(row => Number(row.version) === Number(version.tid))
      .sort((left, right) => Number(left.progress) - Number(right.progress));
  }

  function insertCatch(db, model, state, fishId, generated, mapId) {
    db.prepare(`INSERT INTO fishing_act_catches
      (role_id,act_id,fish_id,size,score,map_id,name,caught_at) VALUES (?,?,?,?,?,?,?,?)`).run(
      model.state.roleId, state.act_id, Number(fishId), Number(generated.size),
      String(generated.score), Number(mapId), roleDisplayName(model.role), currentSeconds()
    );
  }

  function ensureDefaultRod(state, version) {
    if (Number(state.rod) > 0) return;
    const freeRod = [...(tables.FishingRod?.values() ?? [])]
      .filter(row => Number(row.ver) === Number(version.fishing_rod_library) && row.is_free)
      .sort((a, b) => Number(a.tid) - Number(b.tid))[0];
    if (freeRod) state.rod = String(freeRod.tid);
  }

  function ensureFreeBait(model, db, actId, version) {
    const claimType = 'fishing_free_bait';
    const claimKey = 'v' + version.tid;
    if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, claimType, claimKey)) {
      return { changes: [] };
    }
    const res = grantResources(model, [[Number(version.ticket_item), Number(version.free_item_num)]], tables);
    db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, claimType, claimKey, nowIso());
    return { changes: res.changes };
  }

  function ensureActiveFishingBenefits() {
    log({ event: 'activity_read_ensureActiveFishingBenefits_entry' });
    const actId = calendar.activeFishingActivityId(currentSeconds(), storedActivity());
    if (!actId) return { actId: null, changes: [] };
    const { version } = fishingConfiguration(actId);
    log({ event: 'activity_read_ensureActiveFishingBenefits_config', actId, version });
    const result = store.transaction((model, db) => ({ changes: ensureFreeBait(model, db, actId, version).changes }));
    if (result.changes.length) log({ event: 'fishing_free_bait_granted', actId, ticketItem: Number(version.ticket_item), amount: Number(version.free_item_num) });
    return { actId, ...result };
  }

  function unlockFishingMap(data) {
    let request;
    try { request = codec.unpack('pb_fishing_act_common_req', data); }
    catch { throw new GameError(1, 'Invalid fishing unlock request'); }
    const actId = Number(request.act_id), mapId = Number(request.value);
    if (!Number.isSafeInteger(actId) || actId <= 0 || !Number.isSafeInteger(mapId) || mapId <= 0) throw new GameError(1, 'Invalid fishing activity or map');
    assertRunning(actId);
    const { version } = fishingConfiguration(actId);
    const islandVersion = Number(version.island_version);
    const island = tables.FishingIsland?.get(mapId);
    if (!island) throw new GameError(1, 'Unknown fishing map');
    if (Number(island.belonging_version) !== islandVersion) throw new GameError(1, 'Fishing map does not belong to this activity');

    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const stored = existingState(db, roleId, actId);
      const state = stored ?? newState(actId, nowIso());
      ensureDefaultRod(state, version);
      const bait = ensureFreeBait(model, db, actId, version);
      const unlocked = parseJsonList(state.unlock_map_list_json).map(Number);
      let firstUnlock = false;
      let unlockRewards = { changes: [] };
      if (!unlocked.includes(mapId)) {
        const level = fishingLevel(state.score, islandVersion, tables.FishingLevel);
        if (level < Number(island.unlock_level_condition)) throw new GameError(311, 'Fishing level is too low to unlock this map');
        unlockRewards = grantResources(model, island.unlock_reward ?? [], tables);
        unlocked.push(mapId);
        state.unlock_map_list_json = JSON.stringify(unlocked);
        firstUnlock = true;
      }
      state.updated_at = nowIso();
      syncRodLibrary(model, state, version);
      saveState(db, roleId, state);
      const changes = [...bait.changes, ...unlockRewards.changes];
      const value = { data: roleData(state), res: { changes, is_overflow: false } };
      return { value, data: codec.pack('pb_fishing_act_data_res', value), firstUnlock, changes: changes.length };
    });
    result.valueForLog = { actId, mapId, firstUnlock: result.firstUnlock, changes: result.changes };
    return result;
  }

  function fishingVersionAndState(db, roleId, actId) {
    assertRunning(actId);
    const { act, version } = fishingConfiguration(actId);
    const stored = existingState(db, roleId, actId);
    if (!stored) throw new GameError(309, 'Fishing activity is not initialized');
    ensureDefaultRod(stored, version);
    return { act, version, state: stored };
  }

  function mapConfig(mapId, version) {
    const map = tables.FishingIsland?.get(Number(mapId));
    if (!map || Number(map.belonging_version) !== Number(version.island_version)) throw new GameError(1, 'Fishing map does not belong to this activity');
    return map;
  }

  function chooseWeather(map, state, version) {
    const weather = weightedPick(map.weather_weight ?? [], row => row[1], sample)?.[0] ?? Number(version.default_weather);
    const weatherConfig = tables.FishingWeather?.get(Number(weather));
    const count = Math.max(1, Number(tables.FishingConst?.get(1)?.weather_num) || 1);
    const row = { weather_id: String(weather), last_num: String(count), map_id: String(map.tid), weather_num: String(count) };
    state.weather_list_json = JSON.stringify([row]);
    return { id: Number(weather), bonus: Number(weatherConfig?.score_bonus) || 0 };
  }

  function chooseFish(map, weatherId) {
    const band = tables.FishingIslandWeight?.get(Number(map.quality_weight));
    const qualityRow = band
      ? weightedPick((band.quality_type ?? []).map((type, index) => ({ type, weight: band.generation_weight?.[index] })), row => row.weight, sample)
      : null;
    const quality = qualityRow ? Number(qualityRow.type) : null;
    const allMapFish = [...(tables.FishingIslandFish?.values() ?? [])].filter(row => Number(row.island) === Number(map.tid));
    const candidates = allMapFish.filter(row => {
      const fish = tables.FishingFish?.get(Number(row.fish_type));
      return quality === null || Number(fish?.quality) === quality;
    });
    const rows = candidates.length ? candidates : allMapFish;
    const selected = weightedPick(rows, row => {
      const pair = (row.werther_weight ?? []).find(([weather]) => Number(weather) === weatherId);
      return Number(pair?.[1] ?? row.weight) || 0;
    }, sample);
    if (!selected) throw new GameError(5, 'Fishing island has no configured fish');
    const fish = tables.FishingFish?.get(Number(selected.fish_type));
    if (!fish) throw new GameError(5, 'Fishing fish configuration is missing');
    return fish;
  }

  function generateCatch(fish, rod, weatherBonus) {
    const min = Math.max(1, Number(fish.initialmin_point) || 1);
    const max = Math.max(min, Number(fish.initialmax_point) || min);
    const size = min + Math.floor(sample() * (max - min + 1));
    const bonusRate = Number(rod?.score_bonus ?? 0) + Number(weatherBonus ?? 0);
    const base = Math.max(Number(tables.FishingConst?.get(1)?.base_score) || 1, Number(fish.init_point) || 1);
    const score = Math.max(1, Math.floor((base + size) * (10000 + bonusRate) / 10000));
    return { fish_id: String(fish.tid), size: String(size), score: String(score), base: String(base + size), bonusRate };
  }

  function fishAwards(fish, version, generated) {
    const awards = [...(fish.obtained_item ?? [])];
    if (Number(fish.value_type) === 1 && Number(fish.obtained_money) > 0) awards.push([Number(version.money), Number(fish.obtained_money)]);
    if (generated.bonusRate > 0 && Number(version.score_item) > 0) {
      const amount = Math.floor(generated.bonusRate * Number(generated.size) / 10000);
      if (amount > 0) awards.push([Number(version.score_item), amount]);
    }
    return awards;
  }

  function recordCatch(state, fish, generated) {
    const high = parseJsonList(state.high_size_list_json);
    const previous = high.find(row => Number(row.fish_id) === Number(generated.fish_id));
    if (!previous || BigInt(generated.size) > BigInt(previous.size ?? 0)) {
      const next = { fish_id: generated.fish_id, size: generated.size, score: generated.score };
      if (previous) Object.assign(previous, next); else high.push(next);
    }
    state.high_size_list_json = JSON.stringify(high);
    state.get_num = (BigInt(state.get_num) + 1n).toString();
    state.base_score = (BigInt(state.base_score) + BigInt(generated.base)).toString();
    state.score = (BigInt(state.score) + BigInt(generated.score)).toString();
    // pb_fishing_act_role_data.high_size is the accumulated size of the special
    // fish ("特殊鱼总尺寸") that FishingActVersion.rank_need_score gates for the
    // up-rank award; ordinary catches only feed score/base_score.
    if (Number(fish.value_type) === FISH_VALUE_TYPE_HIGH) {
      state.high_size = (BigInt(state.high_size) + BigInt(generated.size)).toString();
      state.get_money_num = (BigInt(state.get_money_num) + BigInt(Number(fish.obtained_money) || 0)).toString();
    }
    state.wait_fish_json = '{}';
    state.updated_at = nowIso();
  }

  function castRod(data) {
    let request;
    try { request = codec.unpack('pb_fishing_act_rod_req', data); }
    catch { throw new GameError(1, 'Invalid fishing cast request'); }
    const actId = Number(request.act_id), mapId = Number(request.map_id);
    if (!Number.isSafeInteger(actId) || !Number.isSafeInteger(mapId)) throw new GameError(1, 'Invalid fishing cast request');
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const { version, state } = fishingVersionAndState(db, roleId, actId);
      syncRodLibrary(model, state, version);
      const map = mapConfig(mapId, version);
      if (!parseJsonList(state.unlock_map_list_json).map(Number).includes(mapId)) throw new GameError(311, 'Fishing map is not unlocked');
      const bait = ensureFreeBait(model, db, actId, version);
      const waiting = parseJsonObject(state.wait_fish_json);
      if (Number(waiting.fish_id) > 0) {
        if (Number(waiting.map_id) !== mapId) throw new GameError(309, 'Fishing is already in progress');
        const current = roleData(state);
        return { value: current, data: codec.pack('pb_fishing_act_role_data', current), duplicate: true, changes: bait.changes.length, fishId: Number(waiting.fish_id) };
      }
      const weather = chooseWeather(map, state, version);
      const rod = tables.FishingRod?.get(Number(state.rod));
      const fish = chooseFish(map, weather.id);
      const cost = consumeResources(model, [[Number(version.ticket_item), Number(map.cost_num) || 1]], 301);
      state.wait_fish_json = JSON.stringify({ fish_id: String(fish.tid), map_id: String(mapId) });
      state.updated_at = nowIso();
      saveState(db, roleId, state);
      const current = roleData(state);
      return { value: current, data: codec.pack('pb_fishing_act_role_data', current), duplicate: false, changes: bait.changes.length + cost.changes.length, fishId: Number(fish.tid), rod: Number(rod?.tid ?? state.rod) };
    });
    result.valueForLog = { actId, mapId, fishId: result.fishId, duplicate: result.duplicate, changes: result.changes };
    return result;
  }

  function collectFish(data) {
    let request;
    try { request = codec.unpack('pb_fishing_act_get_req', data); }
    catch { throw new GameError(1, 'Invalid fishing collect request'); }
    const actId = Number(request.act_id);
    if (!Number.isSafeInteger(actId) || typeof request.is_get !== 'boolean') throw new GameError(1, 'Invalid fishing collect request');
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const { version, state } = fishingVersionAndState(db, roleId, actId);
      const waiting = parseJsonObject(state.wait_fish_json);
      if (!Number(waiting.fish_id)) throw new GameError(309, 'There is no fish waiting');
      if (!request.is_get) {
        state.wait_fish_json = '{}';
        state.updated_at = nowIso();
        saveState(db, roleId, state);
        const value = { data: roleData(state), fish_id: '0', size: '0', score: '0', res: { changes: [], is_overflow: false } };
        return { value, data: codec.pack('pb_fishing_act_get_rsp', value), fishId: 0, changes: 0, missed: true };
      }
      const fish = tables.FishingFish?.get(Number(waiting.fish_id));
      const map = mapConfig(Number(waiting.map_id), version);
      if (!fish) throw new GameError(5, 'Waiting fish configuration is missing');
      const weatherId = Number(parseJsonList(state.weather_list_json).at(-1)?.weather_id ?? version.default_weather);
      const weatherBonus = Number(tables.FishingWeather?.get(weatherId)?.score_bonus) || 0;
      const rod = tables.FishingRod?.get(Number(state.rod));
      const generated = generateCatch(fish, rod, weatherBonus);
      const awards = fishAwards(fish, version, generated);
      const res = grantResources(model, awards, tables);
      recordCatch(state, fish, generated);
      insertCatch(db, model, state, generated.fish_id, generated, waiting.map_id);
      saveState(db, roleId, state);
      const value = { data: roleData(state), fish_id: generated.fish_id, size: generated.size, score: generated.score, res: { changes: res.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_fishing_act_get_rsp', value), fishId: Number(generated.fish_id), mapId: Number(map.tid), changes: res.changes.length };
    });
    result.valueForLog = { actId, fishId: result.fishId, mapId: result.mapId, missed: Boolean(result.missed), changes: result.changes };
    return result;
  }

  function batchFish(data) {
    let request;
    try { request = codec.unpack('pb_fishing_act_batch_get_req', data); }
    catch { throw new GameError(1, 'Invalid fishing batch request'); }
    const actId = Number(request.act_id), mapId = Number(request.map_id);
    if (!Number.isSafeInteger(actId) || !Number.isSafeInteger(mapId)) throw new GameError(1, 'Invalid fishing batch request');
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const { version, state } = fishingVersionAndState(db, roleId, actId);
      const map = mapConfig(mapId, version);
      if (!parseJsonList(state.unlock_map_list_json).map(Number).includes(mapId)) throw new GameError(311, 'Fishing map is not unlocked');
      const constCfg = tables.FishingConst?.get(1) ?? {};
      if (BigInt(state.get_num) < BigInt(constCfg.unlock_auto_num ?? 20)) throw new GameError(311, 'Batch fishing has not been unlocked');
      const baitCount = BigInt(model.resources.get(String(version.ticket_item))?.num ?? 0);
      const cost = BigInt(Number(map.cost_num) || 1);
      const available = baitCount / cost;
      const count = Number(available > BigInt(constCfg.max_fish_num ?? 50) ? BigInt(constCfg.max_fish_num ?? 50) : available);
      if (count < 1) throw new GameError(301, 'Insufficient fishing bait');
      const weather = chooseWeather(map, state, version);
      const rod = tables.FishingRod?.get(Number(state.rod));
      const fishList = [], qteList = [], awards = [];
      for (let index = 0; index < count; index++) {
        const fish = chooseFish(map, weather.id);
        const generated = generateCatch(fish, rod, weather.bonus);
        fishList.push({ fish_id: generated.fish_id, size: generated.size, score: generated.score });
        qteList.push(Boolean(request.is_jump_qte || rod?.auto_qte_success || Number(fish.qte_num) === 0));
        awards.push(...fishAwards(fish, version, generated));
        recordCatch(state, fish, generated);
        insertCatch(db, model, state, generated.fish_id, generated, mapId);
      }
      const spent = consumeResources(model, [[Number(version.ticket_item), count * (Number(map.cost_num) || 1)]], 301);
      const earned = grantResources(model, awards, tables);
      state.wait_fish_json = '{}';
      state.updated_at = nowIso();
      saveState(db, roleId, state);
      const changes = [...spent.changes, ...earned.changes];
      const value = { data: roleData(state), fish_list: fishList, res: { changes, is_overflow: false }, fish_qte_list: qteList };
      return { value, data: codec.pack('pb_fishing_act_batch_get_rsp', value), count, changes: changes.length };
    });
    result.valueForLog = { actId, mapId, count: result.count, changes: result.changes };
    return result;
  }

  function unpackCommon(data, message) {
    let request;
    try { request = codec.unpack('pb_fishing_act_common_req', data ?? Buffer.alloc(0)); }
    catch { throw new GameError(1, message); }
    const actId = Number(request.act_id), value = Number(request.value);
    if (!Number.isSafeInteger(actId) || actId <= 0 || !Number.isSafeInteger(value) || value <= 0) throw new GameError(1, message);
    fishingConfiguration(actId);
    return { actId, value };
  }

  function unpackCommonList(data, message) {
    let request;
    try { request = codec.unpack('pb_fishing_act_common_list_req', data ?? Buffer.alloc(0)); }
    catch { throw new GameError(1, message); }
    const actId = Number(request.act_id);
    const ids = [...new Set((request.value ?? []).map(Number))];
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, message);
    if (!ids.length || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new GameError(1, message);
    fishingConfiguration(actId);
    return { actId, ids };
  }

  // 110303/110308/110309 send an ETF integer argument. The gateway decodes it
  // and passes it as options.etfValue; without an argument the currently running
  // fishing activity is used, which keeps the login-time empty read working.
  function readActId(options, { allowInactive = false } = {}) {
    const requested = options?.etfValue;
    if (requested === null || requested === undefined) {
      const actId = calendar.activeFishingActivityId(currentSeconds(), storedActivity());
      // The login initialization reads these lists without an argument; keep
      // returning empty lists when no fishing cycle is scheduled.
      if (!actId) {
        if (allowInactive) return null;
        throw new GameError(309, 'Activity is not running');
      }
      fishingConfiguration(actId);
      assertRunning(actId);
      return actId;
    }
    const candidate = Array.isArray(requested) ? (requested.length === 1 ? requested[0] : null) : requested;
    if (candidate === null || typeof candidate === 'object') throw new GameError(1, 'Invalid fishing activity payload');
    const actId = Number(candidate);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid fishing activity payload');
    fishingConfiguration(actId);
    assertRunning(actId);
    return actId;
  }

  // pb_fishing_act_fish_record keeps the top three catches per fish with the
  // catching role id; on a single-role deployment only that role's real catches
  // can be listed.
  function fishTopRead(options) {
    const actId = readActId(options, { allowInactive: true });
    if (actId === null) {
      const value = { high_score_list: [] };
      return { value, data: codec.pack('pb_fishing_act_get_top_rsp', value), actId, fishCount: 0 };
    }
    const rows = store.inspect(db => db.prepare(
      'SELECT fish_id,size,score,role_id FROM fishing_act_catches WHERE act_id=? ORDER BY fish_id,size DESC,id'
    ).all(actId));
    const grouped = new Map();
    for (const row of rows) {
      const fishId = Number(row.fish_id);
      const entry = grouped.get(fishId) ?? { fish_id: String(fishId), data_list: [] };
      if (entry.data_list.length >= 3) continue;
      entry.data_list.push({ size: String(row.size), score: String(row.score), role_id: String(row.role_id) });
      grouped.set(fishId, entry);
    }
    const value = { high_score_list: [...grouped.values()] };
    return { value, data: codec.pack('pb_fishing_act_get_top_rsp', value), actId, fishCount: grouped.size };
  }

  function recordRead(options) {
    const actId = readActId(options, { allowInactive: true });
    if (actId === null) {
      const value = { record_list: [] };
      return { value, data: codec.pack('pb_fishing_act_get_record_rsp', value), actId, count: 0 };
    }
    const rows = store.inspect(db => db.prepare(
      'SELECT fish_id,size,score,map_id,name FROM fishing_act_catches WHERE act_id=? ORDER BY id DESC'
    ).all(actId));
    const value = {
      record_list: rows.map(row => ({
        fish_id: String(row.fish_id), size: String(row.size), score: String(row.score),
        name: row.name, map_id: String(row.map_id)
      }))
    };
    return { value, data: codec.pack('pb_fishing_act_get_record_rsp', value), actId, count: rows.length };
  }

  // FishingActTable.Fish.first_award is the codex award shown by
  // FishingActCodexNode; book_state holds one bit per claimed fish tid.
  function bookAward(data) {
    const request = unpackCommonList(data, 'Invalid fishing codex award request');
    const actId = request.actId;
    assertRunning(actId);
    const { version } = fishingConfiguration(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = existingState(db, roleId, actId);
      if (!state) throw new GameError(309, 'Fishing activity is not initialized');
      const byTid = new Map(codexFish(version).map(fish => [Number(fish.tid), fish]));
      const unlocked = unlockedFishIdSet(state);
      let bits = Buffer.from(state.book_state || DEFAULT_STATE_BLOCK, 'base64');
      const awards = [];
      for (const tid of request.ids) {
        const fish = byTid.get(tid);
        if (!fish) throw new GameError(1, 'Fish is not configured for this fishing codex');
        if (!unlocked.has(tid)) throw new GameError(311, 'Fish is not recorded in the fishing codex yet');
        if (hasBit(bits, tid)) throw new GameError(310, 'Fishing codex award is already claimed');
        awards.push(...(fish.first_award ?? []));
        bits = setBit(bits, tid);
      }
      const res = grantResources(model, awards, tables);
      state.book_state = bits.toString('base64');
      state.updated_at = nowIso();
      syncRodLibrary(model, state, version);
      saveState(db, roleId, state);
      const value = { data: roleData(state), res: { changes: res.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_fishing_act_data_res', value), changes: res.changes.length, tids: request.ids };
    });
    result.valueForLog = { actId, tids: result.tids, changes: result.changes };
    return result;
  }

  // FishingActTable.Level.unlock_reward is the level award; level_state holds one
  // bit per claimed level tid and the gate is the activity level from score.
  function levelAward(data) {
    const request = unpackCommon(data, 'Invalid fishing level award request');
    const actId = request.actId, levelTid = request.value;
    assertRunning(actId);
    const { version } = fishingConfiguration(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = existingState(db, roleId, actId);
      if (!state) throw new GameError(309, 'Fishing activity is not initialized');
      const level = tables.FishingLevel?.get(levelTid);
      if (!level || Number(level.belonging_version) !== Number(version.level_library)) throw new GameError(1, 'Level is not configured for this fishing activity');
      const current = fishingLevel(state.score, Number(version.level_library), tables.FishingLevel);
      if (current < Number(level.level)) throw new GameError(311, 'Fishing level has not been reached');
      const bits = Buffer.from(state.level_state || DEFAULT_STATE_BLOCK, 'base64');
      if (hasBit(bits, levelTid)) throw new GameError(310, 'Fishing level award is already claimed');
      const res = grantResources(model, level.unlock_reward ?? [], tables);
      state.level_state = setBit(bits, levelTid).toString('base64');
      state.updated_at = nowIso();
      syncRodLibrary(model, state, version);
      saveState(db, roleId, state);
      const value = { data: roleData(state), res: { changes: res.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_fishing_act_data_res', value), changes: res.changes.length, level: Number(level.level), current };
    });
    result.valueForLog = { actId, levelTid, level: result.level, current: result.current, changes: result.changes };
    return result;
  }

  // FishingActTable.Progress.progress counts unlocked codex fish; progress_state
  // holds one bit per claimed progress tid and the award is Progress.award.
  function progressAward(data) {
    const request = unpackCommonList(data, 'Invalid fishing progress award request');
    const actId = request.actId;
    assertRunning(actId);
    const { version } = fishingConfiguration(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = existingState(db, roleId, actId);
      if (!state) throw new GameError(309, 'Fishing activity is not initialized');
      const configured = new Map(progressRows(version).map(row => [Number(row.tid), row]));
      const unlockedCount = codexFish(version).filter(fish => unlockedFishIdSet(state).has(Number(fish.tid))).length;
      let bits = Buffer.from(state.progress_state || DEFAULT_STATE_BLOCK, 'base64');
      const awards = [];
      for (const tid of request.ids) {
        const row = configured.get(tid);
        if (!row) throw new GameError(1, 'Progress award is not configured for this fishing activity');
        if (unlockedCount < Number(row.progress)) throw new GameError(311, 'Fishing codex has not reached this progress tier');
        if (hasBit(bits, tid)) throw new GameError(310, 'Fishing progress award is already claimed');
        awards.push(...(row.award ?? []));
        bits = setBit(bits, tid);
      }
      const res = grantResources(model, awards, tables);
      state.progress_state = bits.toString('base64');
      state.updated_at = nowIso();
      syncRodLibrary(model, state, version);
      saveState(db, roleId, state);
      const value = { data: roleData(state), res: { changes: res.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_fishing_act_data_res', value), changes: res.changes.length, tids: request.ids, unlockedCount };
    });
    result.valueForLog = { actId, tids: result.tids, unlockedCount: result.unlockedCount, changes: result.changes };
    return result;
  }

  // FishingVersion.up_rank_award pays once when the special-fish total size
  // reaches rank_need_score; go_rank_reward is the claim flag the client reads.
  function upRankAward(options) {
    const actId = readActId(options);
    const { version } = fishingConfiguration(actId);
    const threshold = BigInt(Number(version.rank_need_score) || 0);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = existingState(db, roleId, actId);
      if (!state) throw new GameError(309, 'Fishing activity is not initialized');
      if (Number(state.go_rank_reward)) throw new GameError(310, 'Fishing rank award is already claimed');
      if (BigInt(state.high_size) < threshold) throw new GameError(311, 'Fishing high score has not reached the rank threshold');
      const res = grantResources(model, version.up_rank_award ?? [], tables);
      state.go_rank_reward = 1;
      state.updated_at = nowIso();
      syncRodLibrary(model, state, version);
      saveState(db, roleId, state);
      const value = { data: roleData(state), res: { changes: res.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_fishing_act_data_res', value), changes: res.changes.length, highSize: state.high_size };
    });
    result.valueForLog = { actId, highSize: result.highSize, threshold: threshold.toString(), changes: result.changes };
    return result;
  }

  // 110306 only switches the equipped rod. FishingActMgr.ReqChangeRod refreshes
  // local state and fires EVT_ROD_CHANGED, and the client command carries no
  // recovered response schema, so the reply body stays empty.
  function changeRod(data) {
    const request = unpackCommon(data, 'Invalid fishing rod change request');
    const actId = request.actId, rodTid = request.value;
    assertRunning(actId);
    const { version } = fishingConfiguration(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = existingState(db, roleId, actId);
      if (!state) throw new GameError(309, 'Fishing activity is not initialized');
      const rod = tables.FishingRod?.get(rodTid);
      if (!rod || Number(rod.ver) !== Number(version.fishing_rod_library)) throw new GameError(1, 'Fishing rod is not configured for this fishing activity');
      const activated = syncRodLibrary(model, state, version);
      if (!activated.includes(rodTid)) throw new GameError(311, 'Fishing rod is not activated');
      state.rod = String(rodTid);
      state.updated_at = nowIso();
      saveState(db, roleId, state);
      return { data: Buffer.alloc(0), value: { rod: String(rodTid) }, rod: rodTid, activated };
    });
    result.valueForLog = { actId, rod: result.rod };
    return result;
  }

  // --- HelpUpActCmd 116001-116004 ----------------------------------------
  // Configuration: ActFrameTable.Act 1096001 (type 1096) resolves
  // HelpUpActTable.Version 1: cost_item 834102 (助力手卷), cost_item_max 10
  // per request, help_times 1 per item, task_library 1, stage_library 1 and
  // award_group 1. Task rows gate on TaskTable.Type statistics and pay
  // [[834102,5]]; Stage rows gate on the running help total (stage_num) and pay
  // their envelope award. HelpUpActData keeps the received tid maps (they are
  // claim records), so pb_help_up_act_data must echo the stored lists.
  function helpUpTables() {
    return readHelpUpActTables();
  }

  function helpUpActId(request) {
    const actId = Number(request?.act_id ?? 0);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid help-up activity payload');
    return actId;
  }

  function helpUpConfiguration(actId) {
    const act = tables?.ActFrameAct?.get(actId);
    if (!act || Number(act.type) !== HELP_UP_ACT_TYPE) throw new GameError(1, 'Unknown help-up activity');
    const version = helpUpTables().Version?.get(Number(act.version));
    if (!version) throw new GameError(5, 'Help-up activity version is not configured');
    return { act, version };
  }

  function unpackHelpUp(data, schema, message) {
    try { return codec.unpack(schema, data ?? Buffer.alloc(0)); }
    catch { throw new GameError(1, message); }
  }

  function helpUpTaskRows(version) {
    const library = Number(version.task_library);
    return [...(helpUpTables().Task?.values() ?? [])]
      .filter(row => Number(row.belonging_version) === library)
      .sort((left, right) => Number(left.sort) - Number(right.sort) || Number(left.tid) - Number(right.tid));
  }

  function helpUpStageRows(version) {
    const library = Number(version.stage_library);
    return [...(helpUpTables().Stage?.values() ?? [])]
      .filter(row => Number(row.belonging_version) === library)
      .sort((left, right) => Number(left.stage) - Number(right.stage) || Number(left.tid) - Number(right.tid));
  }

  // Version.award_group selects the envelope pool a single help draws from.
  function helpUpAwardRows(version) {
    const group = Number(version.award_group);
    return [...(helpUpTables().Award?.values() ?? [])]
      .filter(row => Number(row.group) === group && Number(row.weight) > 0)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function ensureHelpUpTable(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS help_up_act_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      overall_help_times TEXT NOT NULL DEFAULT '0',
      last_update_time INTEGER NOT NULL DEFAULT 0,
      last_rec_time INTEGER NOT NULL DEFAULT 0,
      stage_tid_list_json TEXT NOT NULL DEFAULT '[]',
      daily_task_tid_list_json TEXT NOT NULL DEFAULT '[]',
      weekly_task_tid_list_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (role_id, act_id)
    )`);
  }

  if (store?.inspect) store.inspect(ensureHelpUpTable);

  // HelpUpActData compares last_update_time with TimeKit.IsSameDay/IsSameWeek to
  // decide the daily and weekly claim windows. The weekly boundary reuses the
  // 08:00 reset day and starts on Monday.
  function helpUpWeekStart(at) {
    const day = dayZero(at);
    const weekday = new Date((day + 8 * 3600) * 1000).getUTCDay();
    return day - ((weekday + 6) % 7) * 86400;
  }

  function normalizeHelpUpCycles(state, at) {
    const last = Number(state.last_update_time) || 0;
    const dayChanged = last === 0 || dayZero(last) !== dayZero(at);
    const weekChanged = last === 0 || helpUpWeekStart(last) !== helpUpWeekStart(at);
    if (dayChanged) state.daily_task_tid_list_json = '[]';
    if (weekChanged) state.weekly_task_tid_list_json = '[]';
    state.last_update_time = at;
    return dayChanged || weekChanged;
  }

  function helpUpStateRow(db, roleId, actId, at) {
    const row = db.prepare('SELECT * FROM help_up_act_state WHERE role_id=? AND act_id=?').get(roleId, actId);
    if (!row) return null;
    const state = { ...row };
    normalizeHelpUpCycles(state, at);
    return state;
  }

  function helpUpWritableState(db, roleId, actId, at) {
    const stored = helpUpStateRow(db, roleId, actId, at);
    if (stored) return stored;
    const timestamp = nowIso();
    return {
      role_id: Number(roleId), act_id: Number(actId), overall_help_times: '0',
      last_update_time: at, last_rec_time: 0,
      stage_tid_list_json: '[]', daily_task_tid_list_json: '[]', weekly_task_tid_list_json: '[]',
      created_at: timestamp, updated_at: timestamp
    };
  }

  function saveHelpUpState(db, state) {
    db.prepare(`INSERT INTO help_up_act_state (
      role_id, act_id, overall_help_times, last_update_time, last_rec_time,
      stage_tid_list_json, daily_task_tid_list_json, weekly_task_tid_list_json,
      created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(role_id,act_id) DO UPDATE SET
      overall_help_times=excluded.overall_help_times,
      last_update_time=excluded.last_update_time,
      last_rec_time=excluded.last_rec_time,
      stage_tid_list_json=excluded.stage_tid_list_json,
      daily_task_tid_list_json=excluded.daily_task_tid_list_json,
      weekly_task_tid_list_json=excluded.weekly_task_tid_list_json,
      updated_at=excluded.updated_at`).run(
      Number(state.role_id), Number(state.act_id), String(state.overall_help_times),
      Number(state.last_update_time), Number(state.last_rec_time),
      state.stage_tid_list_json, state.daily_task_tid_list_json, state.weekly_task_tid_list_json,
      state.created_at, nowIso()
    );
  }

  function helpUpActData(state) {
    return {
      act_id: String(state.act_id),
      daily_task_tid_list: parseJsonList(state.daily_task_tid_list_json).map(String),
      weekly_task_tid_list: parseJsonList(state.weekly_task_tid_list_json).map(String),
      last_update_time: String(state.last_update_time),
      stage_tid_list: parseJsonList(state.stage_tid_list_json).map(String),
      last_rec_time: String(state.last_rec_time ?? 0)
    };
  }

  function helpUpClaimedTids(state, dailyCycle) {
    const field = dailyCycle ? 'daily_task_tid_list_json' : 'weekly_task_tid_list_json';
    return new Set(parseJsonList(state[field]).map(Number));
  }

  // HelpUpActMgr.ReqOverallHelpTimes feeds pb_help_up_get_times_rsp.times into
  // HelpUpActData:RefreshOverallHelpTimes, so "times" is the running help total
  // (全服). A single-role deployment stores that total on the only stored role.
  function helpUpTimes(data) {
    const request = unpackHelpUp(data, 'pb_help_up_get_times_req', 'Invalid help-up times request');
    const actId = helpUpActId(request);
    helpUpConfiguration(actId);
    assertRunning(actId);
    const roleId = store.state().roleId;
    const at = currentSeconds();
    const state = store.inspect(db => helpUpWritableState(db, roleId, actId, at));
    const value = { times: String(state.overall_help_times) };
    return { value, data: codec.pack('pb_help_up_get_times_rsp', value), actId, times: value.times };
  }

  // ReqHelp: each help spends one Version.cost_item (助力手卷) and adds
  // Version.help_times to the running total; the reply carries pb_res_to_client
  // with the drawn envelope awards and the new total in help_times.
  function helpUpHelp(data) {
    const request = unpackHelpUp(data, 'pb_help_up_help_req', 'Invalid help-up request');
    const actId = helpUpActId(request);
    const times = Number(request.times ?? 0);
    const { version } = helpUpConfiguration(actId);
    assertRunning(actId);
    const limit = Number(version.cost_item_max) || 0;
    if (!Number.isSafeInteger(times) || times < 1 || times > limit) throw new GameError(1, 'Invalid help-up request');
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const at = currentSeconds();
      const state = helpUpWritableState(db, roleId, actId, at);
      const spent = consumeResources(model, [[Number(version.cost_item), times]], 301);
      const pool = helpUpAwardRows(version);
      if (!pool.length) throw new GameError(5, 'Help-up award configuration is missing');
      const awards = [];
      for (let index = 0; index < times; index++) {
        const row = weightedPick(pool, entry => entry.weight, sample);
        awards.push(...(row.award ?? []));
      }
      const gained = grantResources(model, awards, tables);
      const gain = BigInt(times) * BigInt(Number(version.help_times) || 1);
      state.overall_help_times = (BigInt(state.overall_help_times) + gain).toString();
      saveHelpUpState(db, state);
      const changes = [...spent.changes, ...gained.changes];
      const value = { res: { changes, is_overflow: false }, help_times: state.overall_help_times };
      return {
        value, data: codec.pack('pb_help_up_help_rsp', value),
        helpTimes: state.overall_help_times, changes: changes.length, times
      };
    });
    result.valueForLog = { actId, times: result.times, helpTimes: result.helpTimes, changes: result.changes };
    return result;
  }

  // ReqTaskAward: HelpUpActMgr.IsTaskFinishCommon compares the task statistics
  // (TaskTable.Type) against Task.target_count; the claimed tid is stored in
  // the daily or weekly list, which the client reads back as the receive maps.
  function helpUpTaskReward(data) {
    const request = unpackHelpUp(data, 'pb_help_up_task_reward_req', 'Invalid help-up task reward request');
    const actId = helpUpActId(request);
    const tids = [...new Set((request.task_id_list ?? []).map(Number))];
    if (!tids.length || tids.some(tid => !Number.isSafeInteger(tid) || tid <= 0)) {
      throw new GameError(1, 'Invalid help-up task reward request');
    }
    const { version } = helpUpConfiguration(actId);
    assertRunning(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const at = currentSeconds();
      const state = helpUpWritableState(db, roleId, actId, at);
      const configured = new Map(helpUpTaskRows(version).map(row => [Number(row.tid), row]));
      const daily = helpUpClaimedTids(state, true);
      const weekly = helpUpClaimedTids(state, false);
      const awards = [];
      for (const tid of tids) {
        const row = configured.get(tid);
        if (!row) throw new GameError(1, 'Task is not configured for this help-up activity');
        const dailyCycle = Number(row.cycle_type) === HELP_UP_DAILY_CYCLE;
        const claimed = dailyCycle ? daily : weekly;
        if (claimed.has(tid)) throw new GameError(310, 'Help-up task reward is already claimed');
        const progress = currentTaskProgress(model, { task_type: Number(row.task_type) }, codec, tables);
        if (progress < Number(row.target_count)) throw new GameError(311, 'Help-up task is not complete');
        awards.push(...(row.award ?? []));
        claimed.add(tid);
      }
      const res = grantResources(model, awards, tables);
      state.daily_task_tid_list_json = JSON.stringify([...daily].sort((left, right) => left - right));
      state.weekly_task_tid_list_json = JSON.stringify([...weekly].sort((left, right) => left - right));
      state.last_rec_time = at;
      saveHelpUpState(db, state);
      const value = { act_data: helpUpActData(state), res: { changes: res.changes, is_overflow: false } };
      return {
        value, data: codec.pack('pb_help_up_task_reward_rsp', value),
        tids, changes: res.changes.length
      };
    });
    result.valueForLog = { actId, tids: result.tids, changes: result.changes };
    return result;
  }

  // ReqStageAward: Stage.stage_num is the running help total a stage needs; the
  // claimed tid is stored in stage_tid_list (HelpUpActData._stageReceivedTidMap).
  function helpUpStageAward(data) {
    const request = unpackHelpUp(data, 'pb_help_up_stage_award_req', 'Invalid help-up stage award request');
    const actId = helpUpActId(request);
    const tids = [...new Set((request.stage_tid_list ?? []).map(Number))];
    if (!tids.length || tids.some(tid => !Number.isSafeInteger(tid) || tid <= 0)) {
      throw new GameError(1, 'Invalid help-up stage award request');
    }
    const { version } = helpUpConfiguration(actId);
    assertRunning(actId);
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const at = currentSeconds();
      const state = helpUpWritableState(db, roleId, actId, at);
      const configured = new Map(helpUpStageRows(version).map(row => [Number(row.tid), row]));
      const claimed = new Set(parseJsonList(state.stage_tid_list_json).map(Number));
      const overall = BigInt(state.overall_help_times);
      const awards = [];
      for (const tid of tids) {
        const row = configured.get(tid);
        if (!row) throw new GameError(1, 'Stage award is not configured for this help-up activity');
        if (claimed.has(tid)) throw new GameError(310, 'Help-up stage award is already claimed');
        if (overall < BigInt(Number(row.stage_num))) throw new GameError(311, 'Help-up stage is not reached');
        awards.push(...(row.award ?? []));
        claimed.add(tid);
      }
      const res = grantResources(model, awards, tables);
      state.stage_tid_list_json = JSON.stringify([...claimed].sort((left, right) => left - right));
      state.last_rec_time = at;
      saveHelpUpState(db, state);
      const value = { act_data: helpUpActData(state), res: { changes: res.changes, is_overflow: false } };
      return {
        value, data: codec.pack('pb_help_up_stage_award_rsp', value),
        tids, changes: res.changes.length, helpTimes: state.overall_help_times
      };
    });
    result.valueForLog = { actId, tids: result.tids, helpTimes: result.helpTimes, changes: result.changes };
    return result;
  }

  function runningHelpUpIds(activity, at) {
    const ids = [];
    for (const [actId, act] of tables?.ActFrameAct ?? []) {
      if (Number(act.type) !== HELP_UP_ACT_TYPE) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(actId, null, activity, at)) continue;
      ids.push(Number(actId));
    }
    return ids.sort((left, right) => left - right);
  }

  // HelpUpActData._ParseDataImpl decodes pb_help_up_act_login_data from the
  // activity entry's module_login_data, so the block rides inside module 92
  // instead of a separate numeric login slot (none has been captured).
  function helpUpLoginPayload(actId, at = currentSeconds()) {
    const block = store.transaction((model, db) => {
      const state = helpUpWritableState(db, model.state.roleId, actId, at);
      saveHelpUpState(db, state);
      return { value: { actData: helpUpActData(state), helpTimes: String(state.overall_help_times) } };
    }).value;
    return codec.pack('pb_help_up_act_login_data', { act_data: block.actData, help_times: block.helpTimes });
  }

  function synchronizeHelpUpLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    activity.act_list ??= [];
    const synced = [];
    for (const actId of runningHelpUpIds(activity, at)) {
      helpUpConfiguration(actId);
      let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === actId);
      if (!entry) {
        entry = { state_data: { act_id: actId }, module_login_data: Buffer.alloc(0) };
        activity.act_list.push(entry);
      }
      entry.state_data ??= {};
      entry.state_data.act_id = actId;
      entry.state_data.cur_state_id = RUNNING_STATE_ID;
      entry.state_data.history_time ??= [];
      if (!Array.isArray(entry.state_data.history_time)) entry.state_data.history_time = [];
      if (!entry.state_data.history_time.some(item => Number(item?.state_id) === RUNNING_STATE_ID)) {
        entry.state_data.history_time.push({ state_id: RUNNING_STATE_ID, enter_time: String(at) });
      }
      entry.module_login_data = helpUpLoginPayload(actId, at);
      synced.push(actId);
    }
    return synced;
  }

  return {
    supports: type => reads.has(type) || refused.has(type) || FISHING_MUTATIONS.includes(type) || HELP_UP_TYPES.has(type),
    ensureActiveFishingBenefits,
    synchronizeHelpUpLogin,
    helpUpLoginPayload,
    execute(type, data, options = {}) {
      log({
        event: 'activity_read_execute_entry', type, dataLength: data?.length,
        dataHex: Buffer.isBuffer(data) || data instanceof Uint8Array ? Buffer.from(data).toString('base64') : undefined
      });
      if (type === 110301) return castRod(data);
      if (type === 110302) return collectFish(data);
      if (type === 110303) return fishTopRead(options);
      if (type === 110304) return bookAward(data);
      if (type === 110305) return unlockFishingMap(data);
      if (type === 110306) return changeRod(data);
      if (type === 110307) return levelAward(data);
      if (type === 110308) return recordRead(options);
      if (type === 110309) return upRankAward(options);
      if (type === 110310) return progressAward(data);
      if (type === 110311) return batchFish(data);
      if (type === 116001) return helpUpTaskReward(data);
      if (type === 116002) return helpUpStageAward(data);
      if (type === 116003) return helpUpHelp(data);
      if (type === 116004) return helpUpTimes(data);
      if (refused.has(type)) throw new GameError(5, refused.get(type));
      const [schema, value] = reads.get(type);
      log({ event: 'activity_read_sent', type, schema, value });
      return { value, data: codec.pack(schema, value) };
    }
  };
}
