import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';

const reads = new Map([
  [110308, ['pb_fishing_act_get_record_rsp', { record_list: [] }]],
  [110303, ['pb_fishing_act_get_top_rsp', { high_score_list: [] }]],
  [116004, ['pb_help_up_get_times_rsp', { times: 0 }]],
  [117005, ['pb_hundred_draw_act_marquee_rsp', { data: {} }]]
]);

const refused = new Map([
  [110304, 'Fishing codex awards are not implemented'],
  [110306, 'Fishing rod change is not implemented'],
  [110307, 'Fishing level awards are not implemented'],
  [110309, 'Fishing rank awards are not implemented'],
  [110310, 'Fishing progress awards are not implemented'],
  [116001, 'Help-up task rewards are not implemented'],
  [116002, 'Help-up stage awards are not implemented'],
  [116003, 'Help-up requests are not implemented']
]);

const DEFAULT_STATE_BLOCK = Buffer.from([0]).toString('base64');
const FISHING_ACT_FIRST = 1074001;
const FISHING_ACT_LAST = 1074011;

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
    const actId = calendar.activeFishingActivityId(currentSeconds(), storedActivity());
    if (!actId) return { actId: null, changes: [] };
    const { version } = fishingConfiguration(actId);
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
      let haveRods = parseJsonList(state.have_rod_list_json).map(Number);
      if (state.rod && !haveRods.includes(Number(state.rod))) haveRods = [...haveRods, Number(state.rod)].sort((a, b) => a - b);
      state.have_rod_list_json = JSON.stringify(haveRods);
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
    state.high_size = (BigInt(state.high_size) > BigInt(generated.size) ? BigInt(state.high_size) : BigInt(generated.size)).toString();
    if (Number(fish.value_type) === 1) state.get_money_num = (BigInt(state.get_money_num) + BigInt(Number(fish.obtained_money) || 0)).toString();
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
      }
      consumeResources(model, [[Number(version.ticket_item), count * (Number(map.cost_num) || 1)]], 301);
      const res = grantResources(model, awards, tables);
      state.wait_fish_json = '{}';
      state.updated_at = nowIso();
      saveState(db, roleId, state);
      const value = { data: roleData(state), fish_list: fishList, res: { changes: res.changes, is_overflow: false }, fish_qte_list: qteList };
      return { value, data: codec.pack('pb_fishing_act_batch_get_rsp', value), count, changes: res.changes.length };
    });
    result.valueForLog = { actId, mapId, count: result.count, changes: result.changes };
    return result;
  }

  return {
    supports: type => reads.has(type) || refused.has(type) || [110301, 110302, 110305, 110311].includes(type),
    ensureActiveFishingBenefits,
    execute(type, data) {
      if (type === 110301) return castRod(data);
      if (type === 110302) return collectFish(data);
      if (type === 110305) return unlockFishingMap(data);
      if (type === 110311) return batchFish(data);
      if (refused.has(type)) throw new GameError(5, refused.get(type));
      const [schema, value] = reads.get(type);
      log({ event: 'activity_read_sent', type, schema });
      return { value, data: codec.pack(schema, value) };
    }
  };
}
