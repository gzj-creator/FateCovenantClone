import { decodeEtf } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

// G1 (#151-#162): exploration and home activities.
//
// Every command below is declared by the shipped client bundle; request and
// response schemas come from the *.proto.bin assets. Handlers the recovered
// table data cannot describe yet refuse with an explicit code instead of
// inventing rewards, so the client never sees a fabricated success.

const RESET_SECONDS = 5 * 3600;
const DAY_SECONDS = 86400;

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function dayOf(at) {
  return Math.floor((at + RESET_SECONDS) / DAY_SECONDS);
}

function plainOf(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(plainOf);
  if (typeof value === 'object' && 'value' in value) {
    const inner = value.value;
    if (inner == null && typeof value.improper === 'boolean') return [];
    return plainOf(inner);
  }
  return value;
}

function listOf(value) {
  const raw = plainOf(value);
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function idOf(value, message) {
  const id = Number(plainOf(value));
  if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, message);
  return id;
}

function idListOf(value, message) {
  const list = listOf(value).map(entry => Number(plainOf(entry)));
  if (!list.length || list.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new GameError(1, message);
  return list;
}

function awardsOf(row, field) {
  const list = row?.[field];
  if (!Array.isArray(list)) return [];
  return list.map(entry => [Number(entry?.[0]), Number(entry?.[1])])
    .filter(([tid, count]) => Number.isSafeInteger(tid) && tid > 0 && Number.isSafeInteger(count) && count > 0);
}

function requireAwards(list, message) {
  if (!list.length) throw new GameError(5, message);
  return list;
}

function resOf(granted) {
  return { changes: granted.changes, is_overflow: false };
}

export function createExplorationActService({
  store, codec, tables, explorationTables,
  now = Date.now, random = Math.random, logger = () => {}
}) {
  if (!store?.transaction) throw new Error('Exploration activity store is unavailable');
  if (!explorationTables) throw new Error('Exploration activity tables are unavailable');
  const log = event => { try { logger(event); } catch {} };
  const at = () => seconds(now());

  store.inspect(db => {
    db.exec(`CREATE TABLE IF NOT EXISTS exploration_act_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      module TEXT NOT NULL,
      act_id INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (role_id, module, act_id)
    )`);
  });

  function readState(db, roleId, module, actId, fallback) {
    const row = db.prepare('SELECT payload FROM exploration_act_state WHERE role_id=? AND module=? AND act_id=?')
      .get(roleId, module, Number(actId));
    if (!row) return structuredClone(fallback);
    try { return JSON.parse(row.payload); } catch { throw new GameError(5, 'Exploration activity state is unreadable'); }
  }

  function writeState(db, roleId, module, actId, value) {
    const stamp = new Date(at() * 1000).toISOString();
    db.prepare(`INSERT INTO exploration_act_state (role_id, module, act_id, payload, created_at, updated_at)
      VALUES (?,?,?,?,?,?) ON CONFLICT(role_id, module, act_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`)
      .run(roleId, module, Number(actId), JSON.stringify(value), stamp, stamp);
  }

  function hasClaim(db, roleId, claimType, key) {
    return Boolean(db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(roleId, claimType, String(key)));
  }

  function markClaim(db, roleId, claimType, key) {
    db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)')
      .run(roleId, claimType, String(key), new Date(at() * 1000).toISOString());
  }

  function gap(module, command) {
    throw new GameError(5, 'Rule is not recovered: ' + module + '.' + command);
  }

  // ---- PLAY-EXPERIENCEACT: 93801 go / 93802 award -----------------------
  const experienceLevels = explorationTables.experienceAct?.Level ?? new Map();

  function experienceState() { return { acts: {} }; }

  function experienceAct(state, actTid) {
    state.acts ??= {};
    state.acts[String(actTid)] ??= { act_tid: actTid, go_count: 0, areas: {} };
    return state.acts[String(actTid)];
  }

  function experienceAreas(act) {
    return Object.values(act.areas ?? {}).map(area => ({
      tid: Number(area.tid),
      go_time: Number(area.go_time ?? 0),
      finish_time_list: (area.finish_time_list ?? []).map(Number),
      is_get_ex_reward: Boolean(area.is_get_ex_reward)
    })).sort((left, right) => left.tid - right.tid);
  }

  function experienceGo(request) {
    const actTid = idOf(request.act_tid, 'Invalid experience activity id');
    const units = Array.isArray(request.area_unit_list) ? request.area_unit_list : [];
    if (!units.length) throw new GameError(1, 'Experience start requires an area');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'experience_act', actTid, experienceState());
      const act = experienceAct(state, actTid);
      const time = at();
      for (const unit of units) {
        const areaTid = idOf(unit?.tid, 'Invalid experience area id');
        const row = experienceLevels.get(areaTid);
        if (!row) throw new GameError(5, 'Experience area is not configured');
        const existing = act.areas[String(areaTid)];
        const need = Number(row.need_time ?? 0);
        if (existing && time < Number(existing.go_time ?? 0) + need) throw new GameError(311, 'Experience area is still running');
        act.areas[String(areaTid)] = {
          tid: areaTid, go_time: time,
          finish_time_list: existing ? existing.finish_time_list ?? [] : [],
          is_get_ex_reward: false
        };
        act.go_count = Number(act.go_count ?? 0) + 1;
      }
      writeState(db, roleId, 'experience_act', actTid, state);
      log({ event: 'experience_go', actTid, areas: Object.keys(act.areas).length });
      return { value: { actTid }, data: codec.pack('pb_experience_go_rsp', { area_info: experienceAreas(act) }) };
    });
  }

  function experienceAward(request) {
    const actTid = idOf(request.act_tid, 'Invalid experience activity id');
    const indexes = (request.award_list ?? []).map(Number).filter(Number.isSafeInteger);
    if (!indexes.length) throw new GameError(1, 'Experience award list is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'experience_act', actTid, experienceState());
      const act = experienceAct(state, actTid);
      const time = at();
      const grants = [];
      for (const index of indexes) {
        const area = act.areas[String(index)];
        const row = experienceLevels.get(index);
        if (!area || !row) throw new GameError(311, 'Experience area has not started');
        if (time < Number(area.go_time ?? 0) + Number(row.need_time ?? 0)) throw new GameError(311, 'Experience area is still running');
        if (hasClaim(db, roleId, 'experience_act', actTid + ':' + index)) throw new GameError(310, 'Experience award already claimed');
        grants.push(...requireAwards(awardsOf(row, 'award'), 'Experience award is not configured'));
        area.finish_time_list = [...new Set([...(area.finish_time_list ?? []).map(Number), index])];
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => time });
      for (const index of indexes) markClaim(db, roleId, 'experience_act', actTid + ':' + index);
      writeState(db, roleId, 'experience_act', actTid, state);
      log({ event: 'experience_award', actTid, changes: granted.changes.length });
      return {
        value: { actTid },
        data: codec.pack('pb_experience_award_rsp', {
          act_tid: actTid, res_change: resOf(granted), area_info: experienceAreas(act)
        })
      };
    });
  }

  // ---- PLAY-RADISHFARM: 90801-90806 -------------------------------------
  const radishActivities = explorationTables.radishFarm?.Activity ?? new Map();
  const radishGifts = explorationTables.radishFarm?.Gift ?? new Map();

  function radishState() {
    return { cells: {}, help_times: 0, help_day: 0, harvest_num: 0, gifts: {}, visit_id: 0 };
  }

  function radishConfig(actTid) {
    const row = radishActivities.get(Number(actTid));
    if (!row) throw new GameError(5, 'Radish farm activity is not configured');
    return row;
  }

  function radishCells(state, actTid) {
    return Object.values(state.cells ?? {})
      .filter(cell => Number(cell.act_tid) === Number(actTid))
      .sort((left, right) => Number(left.id) - Number(right.id))
      .map(cell => ({
        id: Number(cell.id),
        start_time: Number(cell.start_time ?? 0),
        event_finish_state: Buffer.from(cell.event_finish_state ?? '', 'base64'),
        speed_up_sec: Number(cell.speed_up_sec ?? 0),
        is_harvest: Boolean(cell.is_harvest)
      }));
  }

  function radishStart(request) {
    const actTid = idOf(request.act_tid ?? 1, 'Invalid radish farm activity id');
    const ids = idListOf(request.id, 'Invalid radish farm cell id');
    const config = radishConfig(actTid);
    const maxCell = Number(config.cell_max_index ?? config.max_event_cell ?? 0);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'radish_farm', actTid, radishState());
      const time = at();
      for (const id of ids) {
        if (maxCell > 0 && id > maxCell) throw new GameError(1, 'Radish farm cell is out of range');
        const cell = state.cells[String(id)];
        if (cell && !cell.is_harvest && time < Number(cell.start_time ?? 0) + Number(config.finish_sec ?? 0)) {
          throw new GameError(311, 'Radish farm cell is already growing');
        }
        state.cells[String(id)] = { id, act_tid: actTid, start_time: time, event_finish_state: '', speed_up_sec: 0, is_harvest: false };
      }
      writeState(db, roleId, 'radish_farm', actTid, state);
      log({ event: 'radish_start', actTid, cells: ids });
      return { value: { actTid }, data: codec.pack('pb_radish_farm_normal_rsp', { cells: radishCells(state, actTid) }) };
    });
  }

  function radishEvent(request) {
    const actTid = idOf(request.act_tid ?? 1, 'Invalid radish farm activity id');
    const ids = idListOf(request.id, 'Invalid radish farm cell id');
    radishConfig(actTid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'radish_farm', actTid, radishState());
      for (const id of ids) {
        const cell = state.cells[String(id)];
        if (!cell || Number(cell.act_tid) !== actTid) throw new GameError(311, 'Radish farm cell has not started');
        cell.event_finish_state = 'AQ==';
      }
      writeState(db, roleId, 'radish_farm', actTid, state);
      return { value: { actTid }, data: codec.pack('pb_radish_farm_normal_rsp', { cells: radishCells(state, actTid) }) };
    });
  }

  function radishCellAward(request) {
    const actTid = idOf(request.act_tid ?? 1, 'Invalid radish farm activity id');
    const ids = idListOf(request.id, 'Invalid radish farm cell id');
    const config = radishConfig(actTid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'radish_farm', actTid, radishState());
      const time = at();
      const grants = [], multipliers = [];
      for (const id of ids) {
        const cell = state.cells[String(id)];
        if (!cell || Number(cell.act_tid) !== actTid) throw new GameError(311, 'Radish farm cell has not started');
        if (cell.is_harvest) throw new GameError(310, 'Radish farm cell is already harvested');
        if (time < Number(cell.start_time ?? 0) + Number(config.finish_sec ?? 0)) throw new GameError(311, 'Radish farm cell is still growing');
        grants.push(...requireAwards(awardsOf(config, 'award'), 'Radish farm award is not configured'));
        multipliers.push({ cell_index: id, multiplier: 1 });
        cell.is_harvest = true;
        state.harvest_num = Number(state.harvest_num ?? 0) + 1;
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => time });
      writeState(db, roleId, 'radish_farm', actTid, state);
      log({ event: 'radish_award', actTid, changes: granted.changes.length });
      return {
        value: { actTid },
        data: codec.pack('pb_radish_farm_reward_rsp', {
          cells: radishCells(state, actTid), res: resOf(granted), multipliers
        })
      };
    });
  }

  function radishVisit(request) {
    const actTid = idOf(request.act_tid ?? 1, 'Invalid radish farm activity id');
    radishConfig(actTid);
    const target = Number(plainOf(request.role_id) ?? 0);
    const roleId = store.state().roleId;
    if (Number.isSafeInteger(target) && target > 0 && target !== Number(roleId)) {
      throw new GameError(5, 'Only the local role farm is available');
    }
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'radish_farm', actTid, radishState());
      state.visit_id = Number(roleId);
      writeState(db, roleId, 'radish_farm', actTid, state);
      return { value: { actTid }, data: codec.pack('pb_radish_farm_visit_rsp', { role_id: String(roleId), cells: radishCells(state, actTid) }) };
    });
  }

  function radishHelp(request) {
    const actTid = idOf(request.act_tid ?? 1, 'Invalid radish farm activity id');
    const config = radishConfig(actTid);
    const cellId = idOf(request.cell_id, 'Invalid radish farm cell id');
    const target = Number(plainOf(request.role_id) ?? 0);
    const roleId = store.state().roleId;
    if (Number.isSafeInteger(target) && target > 0 && target !== Number(roleId)) {
      throw new GameError(5, 'Only the local role farm is available');
    }
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'radish_farm', actTid, radishState());
      const today = dayOf(at());
      if (Number(state.help_day ?? 0) !== today) { state.help_day = today; state.help_times = 0; }
      const limit = Number(config.day_help_times ?? 0);
      if (limit > 0 && Number(state.help_times ?? 0) >= limit) throw new GameError(307, 'Radish farm help limit reached');
      const cell = state.cells[String(cellId)];
      if (!cell || Number(cell.act_tid) !== actTid) throw new GameError(311, 'Radish farm cell has not started');
      const granted = grantResources(model, requireAwards(awardsOf(config, 'help_award'), 'Radish farm help award is not configured'), tables, { codec });
      state.help_times = Number(state.help_times ?? 0) + 1;
      writeState(db, roleId, 'radish_farm', actTid, state);
      return {
        value: { actTid },
        data: codec.pack('pb_radish_farm_help_rsp', {
          cell: radishCells(state, actTid).find(entry => entry.id === cellId), award: resOf(granted)
        })
      };
    });
  }

  function radishGiftSelect(request) {
    const actTid = idOf(request.act_tid ?? 1, 'Invalid radish farm activity id');
    const giftTid = idOf(request.gift_tid, 'Invalid radish farm gift id');
    const config = radishConfig(actTid);
    const configured = [...radishGifts.values()].find(row => Number(row.recharge_tid) === giftTid || Number(row.tid) === giftTid);
    if (!configured) throw new GameError(5, 'Radish farm gift is not configured');
    const indexes = (request.select_idx ?? []).map(Number).filter(Number.isSafeInteger);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'radish_farm', actTid, radishState());
      const pool = requireAwards(awardsOf(config, 'exchange_award'), 'Radish farm gift award is not configured');
      const chosen = indexes.length ? indexes.map(index => pool[index]).filter(Boolean) : pool;
      if (!chosen.length) throw new GameError(1, 'Radish farm gift selection is out of range');
      const granted = grantResources(model, chosen, tables, { codec });
      state.gifts ??= {};
      const times = Number(state.gifts[String(giftTid)]?.times ?? 0) + 1;
      state.gifts[String(giftTid)] = { gift_tid: giftTid, times, select: indexes };
      writeState(db, roleId, 'radish_farm', actTid, state);
      return {
        value: { giftTid },
        data: codec.pack('pb_radish_farm_gift', { gift_tid: giftTid, times, role_select: { res: resOf(granted) } })
      };
    });
  }

  // ---- PLAY-MINIGAME: 83701-83704 ---------------------------------------
  const miniGames = explorationTables.miniGame?.MiniGame ?? new Map();
  const slotConfig = explorationTables.miniGame?.SlotMachine?.get(1) ?? null;

  function miniRow(tid) {
    const row = miniGames.get(Number(tid));
    if (!row) throw new GameError(5, 'Mini game is not configured');
    return row;
  }

  function miniEnter(request) {
    const tid = idOf(request.tid, 'Invalid mini game id');
    miniRow(tid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'mini_game', tid, { enters: 0 });
      state.enters = Number(state.enters ?? 0) + 1;
      writeState(db, roleId, 'mini_game', tid, state);
      return { value: { tid }, data: codec.pack('pb_mini_game_enter_rsp', { res_change: { changes: [], is_overflow: false }, custom_bin: Buffer.alloc(0) }) };
    });
  }

  function miniHandle(request) {
    const tid = idOf(request.tid, 'Invalid mini game id');
    miniRow(tid);
    return {
      value: { tid },
      data: codec.pack('pb_mini_game_handle_rsp', {
        res_change: { changes: [], is_overflow: false },
        custom_bin: Buffer.from(request.custom_bin ?? Buffer.alloc(0))
      })
    };
  }

  function miniSettle(request) {
    const tid = idOf(request.tid, 'Invalid mini game id');
    const row = miniRow(tid);
    if (row.settle_bin && row.settle_bin !== 'none') {
      throw new GameError(5, 'Mini game settle rule is not recovered: ' + row.settle_bin);
    }
    return {
      value: { tid },
      data: codec.pack('pb_mini_game_settle_rsp', {
        res_change: { changes: [], is_overflow: false },
        custom_bin: Buffer.alloc(0), game: { tid, custom_bin: Buffer.alloc(0) }
      })
    };
  }

  function miniSlotRetry() {
    const config = slotConfig;
    if (!config) throw new GameError(5, 'Mini game slot machine is not configured');
    const items = (config.item ?? []).map(Number);
    const counts = (config.count ?? []).map(Number);
    const weights = (config.weight ?? []).map(Number);
    if (!items.length || items.length !== weights.length) throw new GameError(5, 'Mini game slot machine award is invalid');
    const total = weights.reduce((sum, weight) => sum + (weight > 0 ? weight : 0), 0);
    if (!(total > 0)) throw new GameError(5, 'Mini game slot machine has no weighted award');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'mini_game', 1, { used: 0 });
      const limit = Number(config.retry_n ?? 0);
      if (limit > 0 && Number(state.used ?? 0) >= limit) throw new GameError(307, 'Mini game retry limit reached');
      let roll = Math.min(Math.max(Number(random()), 0), 1 - Number.EPSILON) * total;
      let pick = items.length - 1;
      for (let index = 0; index < items.length; index += 1) {
        roll -= weights[index] > 0 ? weights[index] : 0;
        if (roll < 0) { pick = index; break; }
      }
      const granted = grantResources(model, [[items[pick], Number(counts[pick] ?? 1) || 1]], tables, { codec });
      state.used = Number(state.used ?? 0) + 1;
      writeState(db, roleId, 'mini_game', 1, state);
      log({ event: 'mini_slot_retry', item: items[pick], used: state.used });
      return {
        value: { used: state.used },
        data: codec.pack('pb_mini_game_slot_machine', { award: granted.changes.map(change => ({ tid: change.tid, num: String(change.new_num) })), left_retry_times: Math.max(0, limit - state.used) })
      };
    });
  }

  // ---- PLAY-HOMEPUZZLEACT: 11408-11420 ----------------------------------
  const puzzleTables = explorationTables.homePuzzle ?? {};
  const puzzleVersions = puzzleTables.Version ?? new Map();
  const puzzlePieces = puzzleTables.Piece ?? new Map();
  const puzzleDecomposeAwards = puzzleTables.DecomposeAward ?? new Map();
  const puzzleProgress = puzzleTables.ProgressAward ?? new Map();
  const puzzleTasks = puzzleTables.Task ?? new Map();
  const puzzleSocial = puzzleTables.SocialConf ?? new Map();

  function puzzleVersion(actTid) {
    const row = [...puzzleVersions.values()].find(entry => Number(entry.tid) === Number(actTid));
    if (!row) throw new GameError(5, 'Home puzzle activity version is not configured');
    return row;
  }

  function puzzleState(actTid) {
    return {
      act_tid: actTid, themes: {}, fragments: {}, daily_gift_count: 0, daily_request_count: 0,
      daily_task_list: [], weekly_task_list: [], shop_bought: {}, my_requests: {}, received_process_list: [],
      get_gifts: [], my_gifts: [], day: 0, gift_uid: 0
    };
  }

  function puzzleActData(state) {
    return {
      act_tid: Number(state.act_tid),
      themes: Object.values(state.themes ?? {}).map(theme => ({
        theme_tid: Number(theme.theme_tid),
        collected_bitmap: Buffer.from(theme.collected_bitmap ?? '', 'base64'),
        reward_claimed: Boolean(theme.reward_claimed)
      })),
      fragments: Object.values(state.fragments ?? {})
        .filter(fragment => Number(fragment.count) > 0)
        .map(fragment => ({ piece_tid: Number(fragment.piece_tid), count: Number(fragment.count) })),
      daily_gift_count: Number(state.daily_gift_count ?? 0),
      daily_request_count: Number(state.daily_request_count ?? 0),
      daily_reset_second: 0,
      weekly_reset_second: 0,
      daily_task_list: (state.daily_task_list ?? []).map(Number),
      weekly_task_list: (state.weekly_task_list ?? []).map(Number),
      shop_bought: Object.values(state.shop_bought ?? {}).map(row => ({ shop_item_id: Number(row.shop_item_id), bought_count: Number(row.bought_count) })),
      my_requests: Object.values(state.my_requests ?? {}).map(row => ({ piece_tid: Number(row.piece_tid), request_time: Number(row.request_time) })),
      received_process_list: (state.received_process_list ?? []).map(Number),
      get_gifts: (state.get_gifts ?? []).map(row => ({
        gift_role_id: Number(row.gift_role_id), gift_time: Number(row.gift_time), piece_tid: Number(row.piece_tid),
        gift_uid: Number(row.gift_uid), is_finish: Boolean(row.is_finish)
      })),
      my_gifts: (state.my_gifts ?? []).map(row => ({
        gift_role_id: Number(row.gift_role_id), gift_time: Number(row.gift_time), piece_tid: Number(row.piece_tid),
        gift_uid: Number(row.gift_uid), is_finish: Boolean(row.is_finish)
      }))
    };
  }

  function puzzleRun(actTid, schema, mutate) {
    const version = puzzleVersion(actTid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'home_puzzle', actTid, puzzleState(actTid));
      const time = at(), today = dayOf(time);
      if (Number(state.day ?? 0) !== today) {
        state.day = today;
        state.daily_gift_count = 0;
        state.daily_request_count = 0;
        state.daily_task_list = [];
      }
      const extra = mutate({ model, db, state, version, time, roleId }) ?? {};
      writeState(db, roleId, 'home_puzzle', actTid, state);
      return {
        value: { actTid },
        data: codec.pack(schema, {
          act_data: puzzleActData(state),
          ...(extra.res ? { res: extra.res } : {}),
          ...(extra.extra ?? {})
        })
      };
    });
  }

  function puzzleRequest(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const pieceTid = idOf(request.piece_tid, 'Invalid home puzzle piece id');
    return puzzleRun(actTid, 'pb_home_puzzle_request_rsp', ({ state, version, time }) => {
      const piece = puzzlePieces.get(pieceTid);
      if (!piece || Number(piece.version) !== Number(version.tid)) throw new GameError(5, 'Home puzzle piece is not configured');
      if (!piece.can_request) throw new GameError(5, 'Home puzzle piece cannot be requested');
      const conf = [...puzzleSocial.values()].find(row => Number(row.version) === Number(version.tid));
      const limit = Number(conf?.request_limit ?? 0);
      if (limit > 0 && Number(state.daily_request_count ?? 0) >= limit) throw new GameError(307, 'Home puzzle request limit reached');
      if (state.my_requests[String(pieceTid)]) throw new GameError(310, 'Home puzzle piece is already requested');
      state.my_requests[String(pieceTid)] = { piece_tid: pieceTid, request_time: time };
      state.daily_request_count = Number(state.daily_request_count ?? 0) + 1;
    });
  }

  function puzzleCancel(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const pieceTid = idOf(request.piece_tid, 'Invalid home puzzle piece id');
    return puzzleRun(actTid, 'pb_home_puzzle_cancel_request_rsp', ({ state }) => {
      if (!state.my_requests[String(pieceTid)]) throw new GameError(311, 'Home puzzle piece was not requested');
      delete state.my_requests[String(pieceTid)];
    });
  }

  function puzzleGifts(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const pieceTid = idOf(request.piece_tid, 'Invalid home puzzle piece id');
    const friend = Number(plainOf(request.friend_role_id) ?? 0);
    return puzzleRun(actTid, 'pb_home_puzzle_gift_rsp', ({ model, state, version, time, roleId }) => {
      if (friend && friend !== Number(roleId)) throw new GameError(5, 'Only the local role gift target is available');
      const piece = puzzlePieces.get(pieceTid);
      if (!piece || !piece.can_gift) throw new GameError(5, 'Home puzzle piece cannot be gifted');
      const conf = [...puzzleSocial.values()].find(row => Number(row.version) === Number(version.tid));
      const limit = Number(conf?.gift_limit ?? 0);
      if (limit > 0 && Number(state.daily_gift_count ?? 0) >= limit) throw new GameError(307, 'Home puzzle gift limit reached');
      const fragment = state.fragments[String(pieceTid)];
      if (!fragment || Number(fragment.count) <= 0) throw new GameError(301, 'Home puzzle piece is insufficient');
      fragment.count = Number(fragment.count) - 1;
      state.gift_uid = Number(state.gift_uid ?? 0) + 1;
      const gift = { gift_role_id: Number(roleId), gift_time: time, piece_tid: pieceTid, gift_uid: state.gift_uid, is_finish: false };
      state.my_gifts.push(gift);
      state.get_gifts.push({ ...gift });
      state.daily_gift_count = Number(state.daily_gift_count ?? 0) + 1;
      return { res: { changes: [], is_overflow: false } };
    });
  }

  function puzzleReceive(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const giftUid = Number(plainOf(request.gift_uid) ?? 0);
    return puzzleRun(actTid, 'pb_home_puzzle_rec_gift_piece_rsp', ({ model, state, time }) => {
      const gift = state.get_gifts.find(entry => Number(entry.gift_uid) === giftUid);
      if (!gift) throw new GameError(311, 'Home puzzle gift does not exist');
      if (gift.is_finish) throw new GameError(310, 'Home puzzle gift is already received');
      const piece = puzzlePieces.get(Number(gift.piece_tid));
      if (!piece) throw new GameError(5, 'Home puzzle piece is not configured');
      const reward = requireAwards(awardsOf(piece, 'gift_get_award'), 'Home puzzle gift award is not configured');
      grantResources(model, reward, tables, { codec, now: () => time });
      gift.is_finish = true;
      const key = String(gift.piece_tid);
      state.fragments[key] ??= { piece_tid: Number(gift.piece_tid), count: 0 };
      state.fragments[key].count = Number(state.fragments[key].count) + 1;
    });
  }

  function puzzleFriendRequests(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    puzzleVersion(actTid);
    // The local server hosts a single role, so no foreign request rows exist.
    return { value: { actTid }, data: codec.pack('pb_home_puzzle_get_friend_request_data_rsp', { request_data_list: [] }) };
  }

  function puzzleOpenPack(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const packTid = idOf(request.pack_tid, 'Invalid home puzzle pack id');
    const count = Math.max(1, Number(request.num ?? 1) || 1);
    return puzzleRun(actTid, 'pb_home_puzzle_open_pack_rsp', ({ model, state, version, time, roleId }) => {
      const packs = [version.normal_pack_item, version.high_pack_item, version.universal_pack_item].map(Number);
      if (!packs.includes(packTid)) throw new GameError(5, 'Home puzzle pack is not configured for this version');
      consumeResources(model, [[packTid, count]], 301, { codec, now: () => time });
      const candidates = [...puzzlePieces.values()].filter(piece => Number(piece.version) === Number(version.tid));
      if (!candidates.length) throw new GameError(5, 'Home puzzle pieces are not configured');
      const got = new Map();
      for (let index = 0; index < count; index += 1) {
        const piece = candidates[Math.min(candidates.length - 1, Math.floor(Number(random()) * candidates.length))];
        const key = String(piece.tid);
        state.fragments[key] ??= { piece_tid: Number(piece.tid), count: 0 };
        state.fragments[key].count = Number(state.fragments[key].count) + 1;
        got.set(key, (got.get(key) ?? 0) + 1);
      }
      return {
        res: { changes: [], is_overflow: false },
        extra: { get_piece_list: [...got].map(([piece, amount]) => ({ piece_tid: Number(piece), count: amount })) }
      };
    });
  }

  function puzzleDecompose(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const rows = Array.isArray(request.decompose_piece) ? request.decompose_piece : [];
    if (!rows.length) throw new GameError(1, 'Home puzzle decompose list is empty');
    return puzzleRun(actTid, 'pb_home_puzzle_decompose_rsp', ({ model, state, time }) => {
      const grants = [];
      for (const row of rows) {
        const pieceTid = idOf(row?.piece_tid, 'Invalid home puzzle piece id');
        const amount = Number(row?.count ?? 0);
        const piece = puzzlePieces.get(pieceTid);
        if (!piece || !piece.can_decompose) throw new GameError(5, 'Home puzzle piece cannot be decomposed');
        const fragment = state.fragments[String(pieceTid)];
        if (!fragment || Number(fragment.count) < amount || amount <= 0) throw new GameError(301, 'Home puzzle piece is insufficient');
        const award = [...puzzleDecomposeAwards.values()].find(entry => Number(entry.rarity) === Number(piece.rarity) && Number(entry.version) === Number(piece.version));
        if (!award) throw new GameError(5, 'Home puzzle decompose award is not configured');
        grants.push([Number(award.award_item), Number(award.award_num) * amount]);
        fragment.count = Number(fragment.count) - amount;
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => time });
      return { res: resOf(granted) };
    });
  }

  function puzzleTaskReward(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const taskIds = (request.task_id_list ?? []).map(Number).filter(Number.isSafeInteger);
    if (!taskIds.length) throw new GameError(1, 'Home puzzle task list is empty');
    return puzzleRun(actTid, 'pb_home_puzzle_task_reward_rsp', ({ model, db, state, time, roleId }) => {
      const grants = [];
      for (const taskId of taskIds) {
        const task = puzzleTasks.get(taskId);
        if (!task) throw new GameError(5, 'Home puzzle task is not configured');
        const weekly = Number(task.cycle_type) !== 1;
        const list = weekly ? state.weekly_task_list : state.daily_task_list;
        if (list.includes(taskId) || hasClaim(db, roleId, 'home_puzzle_task', actTid + ':' + taskId)) {
          throw new GameError(310, 'Home puzzle task award already claimed');
        }
        grants.push(...requireAwards(awardsOf(task, 'award'), 'Home puzzle task award is not configured'));
        list.push(taskId);
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => time });
      for (const taskId of taskIds) markClaim(db, roleId, 'home_puzzle_task', actTid + ':' + taskId);
      return { res: resOf(granted) };
    });
  }

  function puzzleProcessAward(request) {
    const actTid = idOf(request.activity_id, 'Invalid home puzzle activity id');
    const ids = (request.process_tid_list ?? []).map(Number).filter(Number.isSafeInteger);
    if (!ids.length) throw new GameError(1, 'Home puzzle process list is empty');
    return puzzleRun(actTid, 'pb_home_puzzle_rec_process_award_rsp', ({ model, db, state, version, time, roleId }) => {
      const collected = Object.values(state.fragments).reduce((sum, fragment) => sum + Number(fragment.count ?? 0), 0);
      const grants = [];
      for (const id of ids) {
        const row = [...puzzleProgress.values()].find(entry => Number(entry.tid) === id && Number(entry.version) === Number(version.tid));
        if (!row) throw new GameError(5, 'Home puzzle progress award is not configured');
        if (state.received_process_list.includes(id) || hasClaim(db, roleId, 'home_puzzle_progress', actTid + ':' + id)) {
          throw new GameError(310, 'Home puzzle progress award already claimed');
        }
        if (collected < Number(row.need_count ?? 0)) throw new GameError(311, 'Home puzzle progress has not reached this award');
        grants.push(...requireAwards(awardsOf(row, 'award'), 'Home puzzle progress award is not configured'));
        state.received_process_list.push(id);
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => time });
      for (const id of ids) markClaim(db, roleId, 'home_puzzle_progress', actTid + ':' + id);
      return { res: resOf(granted) };
    });
  }

  // ---- PLAY-GRANDTOURER: 87801 daily token, remaining rules not recovered
  const tourerConst = [...(explorationTables.grandTourer?.Const ?? new Map()).values()][0] ?? null;

  function tourerToken(request) {
    if (!tourerConst) throw new GameError(5, 'Grand tourer constants are not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'grand_tourer', 1, { day: 0 });
      const today = dayOf(at());
      if (Number(state.day ?? 0) === today) throw new GameError(310, 'Grand tourer token already claimed today');
      const item = Number(tourerConst.award_item);
      const range = Array.isArray(tourerConst.award_num_range) ? tourerConst.award_num_range.map(Number) : [];
      const low = Number(range[0] ?? 0), high = Number(range[1] ?? low);
      if (!Number.isSafeInteger(item) || item <= 0 || !(high >= low) || low <= 0) throw new GameError(5, 'Grand tourer token award is invalid');
      const amount = low + Math.floor(Number(random()) * (high - low + 1));
      const granted = grantResources(model, [[item, amount]], tables, { codec });
      state.day = today;
      writeState(db, roleId, 'grand_tourer', 1, state);
      log({ event: 'grand_tourer_token', item, amount });
      return { value: { amount }, data: codec.pack('pb_res_to_client', resOf(granted)) };
    });
  }

  // ---- Command registry (#151-#162) -------------------------------------
  const commands = new Map();
  function define(type, module, card, name, requestSchema, responseSchema, run = null) {
    commands.set(Number(type), { type: Number(type), module, card, name, requestSchema, responseSchema, run });
  }

  // PLAY-HOMEPUZZLEACT (#151)
  define(11408, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'task_reward', 'pb_home_puzzle_task_reward_req', 'pb_home_puzzle_task_reward_rsp', puzzleTaskReward);
  define(11409, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'gift', 'pb_home_puzzle_gift_req', 'pb_home_puzzle_gift_rsp', puzzleGifts);
  define(11410, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'request', 'pb_home_puzzle_request_req', 'pb_home_puzzle_request_rsp', puzzleRequest);
  define(11413, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'decompose', 'pb_home_puzzle_decompose_req', 'pb_home_puzzle_decompose_rsp', puzzleDecompose);
  define(11416, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'process_award', 'pb_home_puzzle_rec_process_award_req', 'pb_home_puzzle_rec_process_award_rsp', puzzleProcessAward);
  define(11417, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'friend_request_data', 'pb_home_puzzle_get_friend_request_data_req', 'pb_home_puzzle_get_friend_request_data_rsp', puzzleFriendRequests);
  define(11418, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'rec_gift_piece', 'pb_home_puzzle_rec_gift_piece_req', 'pb_home_puzzle_rec_gift_piece_rsp', puzzleReceive);
  define(11419, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'open_pack', 'pb_home_puzzle_open_pack_req', 'pb_home_puzzle_open_pack_rsp', puzzleOpenPack);
  define(11420, 'home_puzzle_act', 'PLAY-HOMEPUZZLEACT', 'cancel_request', 'pb_home_puzzle_cancel_request_req', 'pb_home_puzzle_cancel_request_rsp', puzzleCancel);

  // PLAY-HOMELANDACT (#152)
  define(11501, 'homeland_act', 'PLAY-HOMELANDACT', 'select_hero', 'pb_homeland_act_select_hero_req', 'pb_homeland_act_select_hero_rsp');
  define(11502, 'homeland_act', 'PLAY-HOMELANDACT', 'task_award', 'pb_homeland_act_task_award_req', 'pb_homeland_act_task_award_rsp');
  define(11503, 'homeland_act', 'PLAY-HOMELANDACT', 'decorate', 'pb_homeland_act_decorate_req', 'pb_homeland_act_decorate_rsp');
  define(11505, 'homeland_act', 'PLAY-HOMELANDACT', 'clear_room', 'pb_homeland_act_clear_room_req', 'pb_homeland_act_clear_room_rsp');

  // PLAY-CARNIVAL (#153)
  for (const [type, name, schema] of [
    [43003, 'use_item'], [43006, 'throw_dice'], [43008, 'touch_event'], [43009, 'finish_event'],
    [43010, 'auto_flush_dice'], [43014, 'buy_dice'], [43016, 'latest_data'], [43017, 'achieve_award'],
    [43018, 'build'], [43019, 'build_up_level'], [43020, 'build_award'], [43021, 'develop_tech'], [43023, 'box_award']
  ]) define(type, 'carnival', 'PLAY-CARNIVAL', name, null, schema);
  define(43022, 'carnival', 'PLAY-CARNIVAL', 'build_dispatch', 'pb_mono_dispatch_req', 'pb_mono_build_data');
  define(43024, 'carnival', 'PLAY-CARNIVAL', 'build_extra', 'pb_mono_build_handle_req', 'pb_mono_build_handle_back');

  // PLAY-THEMETREASURE (#154)
  for (const [type, name, schema] of [
    [76501, 'hunt', 'pb_theme_treasure_hunt_req'], [76502, 'challenge', 'pb_theme_treasure_challenge_req'],
    [76504, 'exchange', 'pb_theme_treasure_exchange_req'], [76505, 'challenge_turn', 'pb_theme_treasure_challenge_turn_req']
  ]) define(type, 'theme_treasure', 'PLAY-THEMETREASURE', name, schema, null);
  for (const [type, name] of [
    [76503, 'server_challenge'], [76506, 'target'], [76507, 'task_award'], [76508, 'turn_award'],
    [76509, 'server_award'], [76510, 'special_award'], [76511, 'daily_award'], [76512, 'server']
  ]) define(type, 'theme_treasure', 'PLAY-THEMETREASURE', name, null, null);

  // PLAY-MINIGAME (#155)
  define(83701, 'mini_game', 'PLAY-MINIGAME', 'settle', 'pb_mini_game_settle_req', 'pb_mini_game_settle_rsp', miniSettle);
  define(83702, 'mini_game', 'PLAY-MINIGAME', 'enter', 'pb_mini_game_enter_req', 'pb_mini_game_enter_rsp', miniEnter);
  define(83703, 'mini_game', 'PLAY-MINIGAME', 'slot_machine_retry', null, 'pb_mini_game_slot_machine', miniSlotRetry);
  define(83704, 'mini_game', 'PLAY-MINIGAME', 'handle', 'pb_mini_game_handle_req', 'pb_mini_game_handle_rsp', miniHandle);

  // PLAY-TREASUREHUNT (#156)
  for (const [type, name] of [
    [85601, 'hunt'], [85605, 'buy_shovel'], [85607, 'auto_compose'], [85608, 'delete_shovel'], [85610, 'refresh']
  ]) define(type, 'treasure_hunt', 'PLAY-TREASUREHUNT', name, null, null);
  define(85606, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'compose', 'pb_treasure_hunt_compose_req', null);
  define(85609, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'exchange_shovel', 'pb_treasure_hunt_exchange_req', null);

  // PLAY-GRANDTOURER (#157)
  define(87801, 'grand_tourer', 'PLAY-GRANDTOURER', 'get_token', null, 'pb_res_to_client', tourerToken);
  for (const [type, name, schema] of [
    [87802, 'task_award', 'pb_grand_tourer_task_back'], [87803, 'exchange_token', 'pb_res_to_client'],
    [87804, 'distance_award', 'pb_res_to_client'], [87805, 'enhance', 'pb_res_to_client']
  ]) define(type, 'grand_tourer', 'PLAY-GRANDTOURER', name, null, schema);

  // PLAY-DREAM (#158)
  define(88001, 'dream', 'PLAY-DREAM', 'finish_event', 'pb_dream_finish_event_req', 'pb_dream_fight_event_rsp');
  for (const [type, name, schema] of [
    [88002, 'day_award', 'pb_dream_award_rsp'], [88003, 'week_finish_award', 'pb_dream_award_rsp'],
    [88004, 'all_finish_award', 'pb_dream_award_rsp'], [88005, 'finish_task', 'pb_dream_award_rsp'],
    [88006, 'collect_award', 'pb_dream_award_rsp'], [88007, 'box_award', 'pb_dream_award_rsp'],
    [88008, 'npc_lineup', 'pb_dream_npc_lineup_rsp'], [88009, 'single_collect_award', 'pb_dream_award_rsp'],
    [88010, 'refresh_event', 'pb_dream_refresh_event_rsp']
  ]) define(type, 'dream', 'PLAY-DREAM', name, null, schema);

  // PLAY-MAGICALJOURNEY (#159)
  for (const [type, name, schema] of [
    [89901, 'sword', 'pb_magical_journey_sword_req'], [89903, 'country_sub_active', 'pb_magical_journey_country_sub_active_req'],
    [89906, 'activate_normal_collect', 'pb_magical_journey_collect_activate_req'],
    [89907, 'activate_season_collect', 'pb_magical_journey_collect_activate_req'],
    [89910, 'mission_multi_fight', 'pb_magical_journey_mission_fight_req'],
    [89911, 'boss_multi_fight', 'pb_magical_journey_boss_fight_req']
  ]) define(type, 'magical_journey', 'PLAY-MAGICALJOURNEY', name, schema, null);
  for (const [type, name] of [
    [89902, 'country_main_up'], [89904, 'country_sub_up'], [89905, 'sword_record'],
    [89908, 'mission_star_award'], [89909, 'mission_task_award'], [89912, 'chapter_progress_award'],
    [89913, 'node_rank_award'], [89914, 'mission_pass_info'], [89915, 'star_skill_active'],
    [89916, 'power'], [89917, 'login_after']
  ]) define(type, 'magical_journey', 'PLAY-MAGICALJOURNEY', name, null, null);

  // PLAY-PETACTIVITY (#160)
  for (const [type, name, schema] of [
    [90501, 'select_pet', 'pb_req_pet_act_select_pet'], [90502, 'claim_fight_rewards', 'pb_req_pet_act_daily_reward'],
    [90503, 'claim_likability_rewards', 'pb_req_pet_act_claim_likability_rewards'], [90504, 'cure', 'pb_req_pet_act_cure'],
    [90505, 'finish_cure', 'pb_req_pet_act_cure']
  ]) define(type, 'pet_activity', 'PLAY-PETACTIVITY', name, schema, null);
  for (const [type, name] of [[90506, 'daily_vitality_rewards'], [90507, 'exchange']]) {
    define(type, 'pet_activity', 'PLAY-PETACTIVITY', name, null, null);
  }

  // PLAY-RADISHFARM (#161)
  define(90801, 'radish_farm', 'PLAY-RADISHFARM', 'start', 'pb_radish_farm_normal_req', 'pb_radish_farm_normal_rsp', radishStart);
  define(90802, 'radish_farm', 'PLAY-RADISHFARM', 'event', 'pb_radish_farm_normal_req', 'pb_radish_farm_normal_rsp', radishEvent);
  define(90803, 'radish_farm', 'PLAY-RADISHFARM', 'cell_award', 'pb_radish_farm_normal_req', 'pb_radish_farm_reward_rsp', radishCellAward);
  define(90804, 'radish_farm', 'PLAY-RADISHFARM', 'visit', null, 'pb_radish_farm_visit_rsp', radishVisit);
  define(90805, 'radish_farm', 'PLAY-RADISHFARM', 'help', 'pb_radish_farm_help_req', 'pb_radish_farm_help_rsp', radishHelp);
  define(90806, 'radish_farm', 'PLAY-RADISHFARM', 'select_gift', 'pb_radish_farm_gift_select_req', 'pb_radish_farm_gift', radishGiftSelect);

  // PLAY-EXPERIENCEACT (#162)
  define(93801, 'experience_act', 'PLAY-EXPERIENCEACT', 'go', 'pb_experience_go_req', 'pb_experience_go_rsp', experienceGo);
  define(93802, 'experience_act', 'PLAY-EXPERIENCEACT', 'award', 'pb_experience_award_req', 'pb_experience_award_rsp', experienceAward);

  return {
    moduleId: 'G1',
    commands,
    supports: type => commands.has(Number(type)),
    implemented: type => Boolean(commands.get(Number(type))?.run),
    async execute(type, data) {
      const spec = commands.get(Number(type));
      if (!spec) throw new GameError(1, 'Unknown exploration command');
      let request = null;
      if (spec.requestSchema) {
        try {
          request = codec.unpack(spec.requestSchema, data ?? Buffer.alloc(0));
        } catch {
          throw new GameError(1, 'Invalid protobuf request for ' + spec.requestSchema);
        }
      } else if (data && data.length) {
        request = plainOf(await decodeEtf(data));
      }
      if (!spec.run) throw new GameError(5, 'Rule is not recovered: ' + spec.card + ' ' + spec.name);
      const result = spec.run(request);
      log({ event: 'exploration_command_committed', type: Number(type), module: spec.module, command: spec.name });
      return result;
    }
  };
}
