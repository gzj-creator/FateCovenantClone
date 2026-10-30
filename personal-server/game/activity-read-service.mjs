import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

// Activity endpoints with schema evidence. Read-only lists return honest empty data for a local
// account with no records; 110305 is the one config-backed mutation implemented here. Other
// mutations are refused explicitly instead of inventing fish, probabilities or award states.
const reads = new Map([
  // FishingActCmd.req_fishing_act_get_record: marquee/first-three records per fish.
  [110308, ['pb_fishing_act_get_record_rsp', { record_list: [] }]],
  // FishingActCmd.req_fishing_act_get_fish_top: per-fish high score list.
  [110303, ['pb_fishing_act_get_top_rsp', { high_score_list: [] }]],
  // HelpUpActCmd.req_help_up_get_times: current help-up attempt count.
  [116004, ['pb_help_up_get_times_rsp', { times: 0 }]],
  // HundredDrawActCmd.req_hundred_draw_act_marquee: opening the welfare
  // activity asks for marquee records. An empty record set is valid before
  // the local account has drawn.
  [117005, ['pb_hundred_draw_act_marquee_rsp', { data: {} }]]
]);

const refused = new Map([
  [110301, 'Fishing catch rules are not implemented'],
  [110302, 'Fishing catch rules are not implemented'],
  [110311, 'Fishing batch catch rules are not implemented'],
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

function parseInteger(value, message) {
  const text = String(value ?? '');
  if (!/^-?\d+$/.test(text)) throw new GameError(1, message);
  return BigInt(text);
}

function parseJsonList(value) {
  const parsed = JSON.parse(value ?? '[]');
  if (!Array.isArray(parsed)) throw new Error('Fishing state list is not an array');
  return parsed;
}

function parseJsonObject(value) {
  const parsed = JSON.parse(value ?? '{}');
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
  const scoreValue = parseInteger(score, 'Invalid fishing score');
  let level = 0;
  for (const row of levels?.values() ?? []) {
    if (Number(row.belonging_version) === islandVersion && scoreValue >= BigInt(row.score)) level = Math.max(level, Number(row.level));
  }
  return level;
}

function newState(actId, now) {
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
    created_at: now,
    updated_at: now
  };
}

export function createActivityReadService({ codec, store, tables, logger = () => {}, now = Date.now }) {
  const log = event => { try { logger(event); } catch {} };

  function unlockFishingMap(data) {
    if (!store || !tables?.ActFrameAct || !tables?.FishingVersion || !tables?.FishingIsland || !tables?.FishingLevel) {
      throw new GameError(5, 'Fishing activity storage is not configured');
    }

    let request;
    try { request = codec.unpack('pb_fishing_act_common_req', data); }
    catch { throw new GameError(1, 'Invalid fishing unlock request'); }
    const actId = Number(request.act_id), mapId = Number(request.value);
    if (!Number.isSafeInteger(actId) || actId <= 0 || !Number.isSafeInteger(mapId) || mapId <= 0) throw new GameError(1, 'Invalid fishing activity or map');

    const act = tables.ActFrameAct.get(actId);
    if (!act || actId < 1074001 || actId > 1074011) throw new GameError(1, 'Unknown fishing activity');
    const version = tables.FishingVersion.get(Number(act.version));
    if (!version) throw new GameError(5, 'Fishing activity version is not configured');
    const islandVersion = Number(version.island_version);
    const island = tables.FishingIsland.get(mapId);
    if (!island) throw new GameError(1, 'Unknown fishing map');
    if (Number(island.belonging_version) !== islandVersion) throw new GameError(1, 'Fishing map does not belong to this activity');

    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const existing = db.prepare('SELECT * FROM fishing_activity_state WHERE role_id=? AND act_id=?').get(roleId, actId);
      const state = existing ?? newState(actId, new Date(now()).toISOString());
      const unlocked = parseJsonList(state.unlock_map_list_json).map(Number);
      let firstUnlock = false;
      let res = { changes: [] };

      if (!unlocked.includes(mapId)) {
        const level = fishingLevel(state.score, islandVersion, tables.FishingLevel);
        if (level < Number(island.unlock_level_condition)) {
          throw new GameError(311, 'Fishing level is too low to unlock this map');
        }
        res = grantResources(model, island.unlock_reward ?? [], tables);
        unlocked.push(mapId);
        state.unlock_map_list_json = JSON.stringify(unlocked);
        state.updated_at = new Date(now()).toISOString();
        firstUnlock = true;
      }

      const updated = roleData(state);
      const value = { data: updated, res: { changes: res.changes, is_overflow: false } };
      if (existing) {
        if (firstUnlock) db.prepare('UPDATE fishing_activity_state SET unlock_map_list_json=?, updated_at=? WHERE role_id=? AND act_id=?').run(state.unlock_map_list_json, state.updated_at, roleId, actId);
      } else {
        db.prepare(`INSERT INTO fishing_activity_state (
          role_id, act_id, get_num, high_size_list_json, score, base_score, high_size, rod,
          weather_list_json, book_state, unlock_map_list_json, level_state, go_rank_reward,
          have_rod_list_json, get_money_num, wait_fish_json, buy_limit_info_json, progress_state,
          created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
          roleId, actId, state.get_num, state.high_size_list_json, state.score, state.base_score,
          state.high_size, state.rod, state.weather_list_json, state.book_state,
          state.unlock_map_list_json, state.level_state, state.go_rank_reward,
          state.have_rod_list_json, state.get_money_num, state.wait_fish_json,
          state.buy_limit_info_json, state.progress_state, state.created_at, state.updated_at
        );
      }
      return {
        value,
        data: codec.pack('pb_fishing_act_data_res', value),
        valueForLog: { actId, mapId, firstUnlock, changes: res.changes.length }
      };
    });
  }

  return {
    supports: type => reads.has(type) || refused.has(type) || type === 110305,
    execute(type, data) {
      if (type === 110305) return unlockFishingMap(data);
      if (refused.has(type)) throw new GameError(5, refused.get(type));
      const [schema, value] = reads.get(type);
      log({ event: 'activity_read_sent', type, schema });
      return { value, data: codec.pack(schema, value) };
    }
  };
}
