import { decodeEtf } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { wrapEtfBinary } from './etf-binary.mjs';

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

// Several shipped family tables store a parallel `item`/`count` pair instead
// of the usual [tid, count] rows. Fold both layouts into one award list.
function pairsOf(items, counts) {
  if (!Array.isArray(items) || !Array.isArray(counts)) return [];
  return items.map((item, index) => [Number(item), Number(counts[index])])
    .filter(([tid, count]) => Number.isSafeInteger(tid) && tid > 0 && Number.isSafeInteger(count) && count > 0);
}

// Login/battle blobs are opaque to the client, but keeping the claim keys as
// UTF-8 text preserves IDs above one byte and remains stable across reopen.
function idBytes(value) {
  return Buffer.from(listOf(value).map(item => String(item)).join(','), 'utf8');
}

function binaryOf(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value == null) return Buffer.alloc(0);
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  return Buffer.from(value);
}

function argAt(request, index, keys = []) {
  if (Array.isArray(request)) return plainOf(request[index]);
  if (request && typeof request === 'object') {
    for (const key of keys) if (request[key] !== undefined) return plainOf(request[key]);
    const values = Object.values(request);
    return plainOf(values[index]);
  }
  return index === 0 ? plainOf(request) : undefined;
}

function numberArg(request, index, keys = [], fallback = 0) {
  const value = Number(argAt(request, index, keys));
  return Number.isSafeInteger(value) ? value : fallback;
}

function pairListOf(value) {
  return listOf(value).map(entry => {
    const pair = plainOf(entry);
    return Array.isArray(pair) ? [Number(pair[0]), Number(pair[1])] : null;
  }).filter(pair => pair && Number.isSafeInteger(pair[0]) && pair[0] > 0 && Number.isSafeInteger(pair[1]));
}

function requireAwards(list, message) {
  if (!list.length) throw new GameError(5, message);
  return list;
}

function resOf(granted) {
  return { changes: granted.changes, is_overflow: false };
}

export function createExplorationActService({
  store, codec, tables, explorationTables, calendar,
  now = Date.now, random = Math.random, logger = () => {}
}) {
  if (!store?.transaction) throw new Error('Exploration activity store is unavailable');
  if (!explorationTables) throw new Error('Exploration activity tables are unavailable');
  const log = event => { try { logger(event); } catch {} };
  const at = () => seconds(now());

  // Runtime activity ids (1080001, 63001, 84001...) point at a table version
  // through ActFrameTable or ActivityTable. The row families below are keyed by
  // that version, while state rows stay keyed by the runtime id so two open
  // generations never share progress.
  function configKeyOf(actTid) {
    const direct = Number(actTid);
    const row = tables?.ActFrameAct?.get?.(direct) ?? tables?.Activity?.get?.(direct);
    const version = Number(row?.version);
    return Number.isSafeInteger(version) && version > 0 ? version : direct;
  }

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
    const row = radishActivities.get(configKeyOf(actTid));
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
    const actTid = idOf(request?.act_tid ?? 1, 'Invalid radish farm activity id');
    radishConfig(actTid);
    const target = Number(plainOf(request?.role_id) ?? 0);
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
        custom_bin: binaryOf(request.custom_bin)
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
    const version = configKeyOf(actTid);
    const row = [...puzzleVersions.values()].find(entry => Number(entry.tid) === version);
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

  // ---- PLAY-HOMELANDACT: 11501-11505 --------------------------------
  const homelandTables = explorationTables.homeland ?? {};
  const homelandVersions = homelandTables.Version ?? new Map();
  const homelandTasks = homelandTables.Task ?? new Map();
  const homelandFurniture = homelandTables.Furniture ?? new Map();
  const homelandConst = [...(homelandTables.Const ?? new Map()).values()][0] ?? null;

  function homelandVersion(actTid) {
    const row = homelandVersions.get(configKeyOf(actTid));
    if (!row) throw new GameError(5, 'Homeland activity is not configured');
    return row;
  }

  function homelandState() {
    return {
      selected_hero_tid: 0, finish_tasks: [], decorate_list: [], is_cleaned: false,
      clear_count: 0, hero_select_count: 0, task_score: 0
    };
  }

  function homelandActInfo(state, actTid) {
    return {
      act_id: actTid,
      selected_hero_tid: Number(state.selected_hero_tid ?? 0),
      task_score: Number(state.task_score ?? 0),
      finish_tasks: (state.finish_tasks ?? []).map(row => ({
        task_tid: Number(row.task_tid), finish_time: Number(row.finish_time ?? 0)
      })),
      settled_stages: [], stage_history: [],
      decorate_list: (state.decorate_list ?? []).map(row => ({
        furniture_tid: Number(row.furniture_tid), x: Number(row.x), y: Number(row.y),
        furniture_type: Number(row.furniture_type ?? 0)
      })),
      is_cleaned: Boolean(state.is_cleaned),
      favour_intimacy: Number(state.favour_intimacy ?? 0),
      hero_records: [], happiness_detail: []
    };
  }

  function homelandProgress(state, task) {
    switch (Number(task.task_type)) {
      case 1803: return state.selected_hero_tid ? 1 : 0;
      case 2407: return Number(state.hero_select_count ?? 0);
      case 1805: return (state.decorate_list ?? []).length;
      case 6901: return Number(state.clear_count ?? 0);
      case 1: return Number(state.task_score ?? 0);
      default: return null;
    }
  }

  function homelandSelectHero(request) {
    const actTid = idOf(request.activity_id, 'Invalid homeland activity id');
    const heroTid = idOf(request.hero_tid, 'Invalid homeland hero id');
    const version = homelandVersion(actTid);
    const heroes = listOf(version.rank_up_hero).map(Number);
    if (!heroes.includes(heroTid)) throw new GameError(1, 'Homeland hero is not available in this version');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'homeland_act', actTid, homelandState());
      if (Number(state.selected_hero_tid) && Number(state.selected_hero_tid) !== heroTid) {
        throw new GameError(311, 'Homeland hero is already selected');
      }
      if (!Number(state.selected_hero_tid)) {
        state.selected_hero_tid = heroTid;
        state.hero_select_count = Number(state.hero_select_count ?? 0) + 1;
        state.task_score = Number(state.task_score ?? 0) + Number(version.change_happiness ?? 0);
      }
      writeState(db, roleId, 'homeland_act', actTid, state);
      log({ event: 'homeland_select_hero', actTid, heroTid });
      return { value: { actTid }, data: codec.pack('pb_homeland_act_select_hero_rsp', { act_info: homelandActInfo(state, actTid) }) };
    });
  }

  function homelandTaskAward(request) {
    const actTid = idOf(request.activity_id, 'Invalid homeland activity id');
    const taskTid = idOf(request.task_tid, 'Invalid homeland task id');
    const version = homelandVersion(actTid);
    const task = homelandTasks.get(taskTid);
    if (!task || Number(task.version) !== Number(version.tid)) throw new GameError(5, 'Homeland task is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'homeland_act', actTid, homelandState());
      if (hasClaim(db, roleId, 'homeland_task', actTid + ':' + taskTid)) throw new GameError(310, 'Homeland task already claimed');
      const progress = homelandProgress(state, task);
      if (progress == null) throw new GameError(5, 'Homeland task progress rule is not recovered');
      if (progress < Number(task.task_count ?? 0)) throw new GameError(311, 'Homeland task is not finished');
      const granted = grantResources(model, requireAwards(awardsOf(task, 'award'), 'Homeland task award is not configured'),
        tables, { codec, now: () => at() });
      markClaim(db, roleId, 'homeland_task', actTid + ':' + taskTid);
      state.finish_tasks = [...(state.finish_tasks ?? []), { task_tid: taskTid, finish_time: at() }];
      writeState(db, roleId, 'homeland_act', actTid, state);
      log({ event: 'homeland_task_award', actTid, taskTid });
      return { value: { actTid }, data: codec.pack('pb_homeland_act_task_award_rsp', {
        act_info: homelandActInfo(state, actTid), res: resOf(granted)
      }) };
    });
  }

  function homelandDecorate(request) {
    const actTid = idOf(request.activity_id, 'Invalid homeland activity id');
    const version = homelandVersion(actTid);
    const furnitureRow = homelandFurniture.get(Number(version.tid));
    if (!furnitureRow) throw new GameError(5, 'Homeland furniture is not configured');
    const allowed = new Set(listOf(furnitureRow.furniture).map(Number));
    const cells = listOf(homelandConst?.cell_num).map(Number);
    const width = Number(cells[0] ?? 0), height = Number(cells[1] ?? 0);
    const layers = Number(homelandConst?.layer_count ?? 0);
    const incoming = listOf(request.furniture_list).map(row => ({
      furniture_tid: Number(plainOf(row?.furniture_tid)),
      x: Number(plainOf(row?.x)), y: Number(plainOf(row?.y)),
      furniture_type: Number(plainOf(row?.furniture_type ?? 0))
    }));
    if (!incoming.length) throw new GameError(1, 'Homeland decoration list is empty');
    const positions = new Set();
    for (const row of incoming) {
      if (!allowed.has(row.furniture_tid)) throw new GameError(5, 'Homeland furniture is not available in this version');
      if (!Number.isSafeInteger(row.x) || !Number.isSafeInteger(row.y) || row.x < 0 || row.y < 0
        || (width > 0 && row.x >= width) || (height > 0 && row.y >= height)) {
        throw new GameError(1, 'Homeland decoration position is out of range');
      }
      if (Number.isSafeInteger(row.furniture_type) && layers > 0 && (row.furniture_type < 0 || row.furniture_type >= layers)) {
        throw new GameError(1, 'Homeland decoration layer is out of range');
      }
      const key = row.x + ',' + row.y + ',' + row.furniture_type;
      if (positions.has(key)) throw new GameError(1, 'Homeland decoration positions overlap');
      positions.add(key);
    }
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'homeland_act', actTid, homelandState());
      state.decorate_list = incoming;
      state.is_cleaned = false;
      state.task_score = Number(state.task_score ?? 0) + incoming.length * Number(version.change_happiness ?? 0);
      writeState(db, roleId, 'homeland_act', actTid, state);
      log({ event: 'homeland_decorate', actTid, count: incoming.length });
      return { value: { actTid }, data: codec.pack('pb_homeland_act_decorate_rsp', { act_info: homelandActInfo(state, actTid) }) };
    });
  }

  function homelandClearRoom(request) {
    const actTid = idOf(request.activity_id, 'Invalid homeland activity id');
    const version = homelandVersion(actTid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'homeland_act', actTid, homelandState());
      if (state.is_cleaned) throw new GameError(311, 'Homeland room is already cleared');
      state.decorate_list = [];
      state.is_cleaned = true;
      state.clear_count = Number(state.clear_count ?? 0) + 1;
      state.task_score = Number(state.task_score ?? 0) + Number(version.change_happiness ?? 0);
      writeState(db, roleId, 'homeland_act', actTid, state);
      log({ event: 'homeland_clear_room', actTid });
      return { value: { actTid }, data: codec.pack('pb_homeland_act_clear_room_rsp', { act_info: homelandActInfo(state, actTid) }) };
    });
  }

  // ---- PLAY-PETACTIVITY: 90501-90507 --------------------------------
  const petTables = explorationTables.petActivity ?? {};
  const petChallenges = petTables.Challenge ?? new Map();
  const petChallengeTasks = petTables.ChallengeTask ?? new Map();
  const petCures = petTables.Cure ?? new Map();
  const petWounds = petTables.CureWound ?? new Map();
  const petFavors = petTables.CureFavor ?? new Map();
  const petExchanges = petTables.Exchange ?? new Map();
  const petVitality = tables.DailyTaskVitality ?? new Map();

  function petConfig(actTid) {
    const row = tables.PetActivity?.get(Number(actTid));
    if (!row) throw new GameError(5, 'Pet activity is not configured');
    return row;
  }

  function petState() {
    return {
      selected_pet_tid: 0, fight_acc_dmg: 0, fight_max_dmg: 0, fight_mission_tid: 0,
      wounds: {}, favor: 0, favor_claims: [], challenge_claims: [], daily_time: 0,
      daily_claims: [], rev_daily_award_num: 0, vitality_award_state: []
    };
  }

  function petPlayer(state, actTid) {
    return {
      act_tid: actTid,
      fight_record: {
        mission_tid: Number(state.fight_mission_tid ?? 0),
        last_fight_time_sec: Number(state.last_fight_time_sec ?? 0),
        acc_dmg: String(state.fight_acc_dmg ?? 0), max_dmg: String(state.fight_max_dmg ?? 0),
        award_state: idBytes(state.challenge_claims ?? [])
      },
      wounds: Object.values(state.wounds ?? {}).map(wound => ({
        wound_tid: Number(wound.wound_tid), last_cure_time_sec: Number(wound.last_cure_time_sec ?? 0),
        cure_times: Number(wound.cure_times ?? 0), today_finish: Boolean(wound.today_finish)
      })),
      selected_pet_tid: Number(state.selected_pet_tid ?? 0),
      likability_award_state: idBytes(state.favor_claims ?? []),
      rev_daily_award_num: Number(state.rev_daily_award_num ?? 0),
      daily_time: Number(state.daily_time ?? 0),
      vitality_award_state: idBytes(state.daily_claims ?? [])
    };
  }

  function petFlush(state, actTid, granted) {
    return {
      act_player_list: { act_data_list: [petPlayer(state, actTid)] },
      res: granted ? resOf(granted) : { changes: [], is_overflow: false }
    };
  }

  function petSelect(request) {
    const actTid = idOf(request.act_tid, 'Invalid pet activity id');
    const petTid = idOf(request.pet_tid, 'Invalid pet activity pet id');
    const config = petConfig(actTid);
    if (!listOf(config.pet).map(Number).includes(petTid)) throw new GameError(1, 'Pet is not available in this activity');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'pet_activity', actTid, petState());
      state.selected_pet_tid = petTid;
      writeState(db, roleId, 'pet_activity', actTid, state);
      log({ event: 'pet_select', actTid, petTid });
      return { value: { actTid }, data: codec.pack('pb_pet_act_player', petPlayer(state, actTid)) };
    });
  }

  function petClaimFight(request) {
    const actTid = idOf(request.act_tid, 'Invalid pet activity id');
    const challengeTid = idOf(request.challenge_tid, 'Invalid pet challenge id');
    const taskIds = (request.task_id ?? []).map(Number).filter(Number.isSafeInteger);
    if (!taskIds.length) throw new GameError(1, 'Pet challenge task list is empty');
    const config = petConfig(actTid);
    const challenge = petChallenges.get(challengeTid);
    if (!challenge || Number(challenge.version) !== Number(config.challenge)) throw new GameError(5, 'Pet challenge is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'pet_activity', actTid, petState());
      const grants = [];
      for (const taskId of taskIds) {
        const task = petChallengeTasks.get(taskId);
        if (!task || Number(task.level_tid) !== challengeTid) throw new GameError(5, 'Pet challenge task is not configured');
        const key = actTid + ':' + challengeTid + ':' + taskId;
        if (state.challenge_claims.includes(key) || hasClaim(db, roleId, 'pet_challenge', key)) throw new GameError(310, 'Pet challenge task already claimed');
        let progress;
        if (Number(task.task_type) === 1803) progress = state.selected_pet_tid ? 1 : 0;
        else if (Number(task.task_type) === 13101) progress = Number(state.fight_acc_dmg ?? 0);
        else throw new GameError(5, 'Pet challenge task rule is not recovered');
        if (progress < Number(task.task_count ?? 0)) throw new GameError(311, 'Pet challenge task is not finished');
        grants.push(...requireAwards(awardsOf(task, 'award'), 'Pet challenge task award is not configured'));
        state.challenge_claims.push(key);
        markClaim(db, roleId, 'pet_challenge', key);
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => at() });
      state.rev_daily_award_num = Number(state.rev_daily_award_num ?? 0) + taskIds.length;
      writeState(db, roleId, 'pet_activity', actTid, state);
      log({ event: 'pet_claim_fight', actTid, challengeTid, tasks: taskIds });
      return { value: { actTid }, data: codec.pack('pb_pet_act_flush', petFlush(state, actTid, granted)) };
    });
  }

  function petClaimFavor(request) {
    const actTid = idOf(request.act_tid, 'Invalid pet activity id');
    const favorTid = idOf(request.favor_tid, 'Invalid pet favor tier id');
    const config = petConfig(actTid);
    const favor = petFavors.get(favorTid);
    if (!favor || Number(favor.version) !== Number(config.cure)) throw new GameError(5, 'Pet favor tier is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'pet_activity', actTid, petState());
      const key = actTid + ':' + favorTid;
      if (state.favor_claims.includes(key) || hasClaim(db, roleId, 'pet_favor', key)) throw new GameError(310, 'Pet favor tier already claimed');
      if (Number(state.favor ?? 0) < Number(favor.favor_num ?? 0)) throw new GameError(311, 'Pet favor has not reached this tier');
      const granted = grantResources(model, requireAwards(awardsOf(favor, 'award'), 'Pet favor award is not configured'),
        tables, { codec, now: () => at() });
      state.favor_claims.push(key);
      markClaim(db, roleId, 'pet_favor', key);
      writeState(db, roleId, 'pet_activity', actTid, state);
      log({ event: 'pet_claim_favor', actTid, favorTid });
      return { value: { actTid }, data: codec.pack('pb_pet_act_flush', petFlush(state, actTid, granted)) };
    });
  }

  function petCure(request, finish) {
    const actTid = idOf(request.act_tid, 'Invalid pet activity id');
    const woundTid = idOf(request.wound_tid, 'Invalid pet wound id');
    const config = petConfig(actTid);
    const woundConfig = petWounds.get(woundTid);
    if (!woundConfig || Number(woundConfig.version) !== Number(config.cure)) throw new GameError(5, 'Pet wound is not configured');
    const cureConfig = petCures.get(Number(config.cure));
    if (!cureConfig) throw new GameError(5, 'Pet cure activity is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'pet_activity', actTid, petState());
      const wound = state.wounds[String(woundTid)] ?? {
        wound_tid: woundTid, last_cure_time_sec: 0, cure_times: 0, today_finish: false
      };
      const time = at();
      if (!finish) {
        if (wound.last_cure_time_sec && time < Number(wound.last_cure_time_sec) + Number(woundConfig.effect_time ?? 0)) {
          throw new GameError(311, 'Pet wound is still healing');
        }
        state.wounds[String(woundTid)] = wound;
        const costs = pairListOf(woundConfig.cure_item);
        if (!costs.length) throw new GameError(5, 'Pet wound cure cost is not configured');
        consumeResources(model, costs, 301, { codec, now: () => time });
        wound.last_cure_time_sec = time;
        wound.today_finish = false;
        writeState(db, roleId, 'pet_activity', actTid, state);
        log({ event: 'pet_cure_start', actTid, woundTid });
        return { value: { actTid }, data: codec.pack('pb_res_pet_act_cure', {
          wound: { wound_tid: woundTid, last_cure_time_sec: time, cure_times: Number(wound.cure_times ?? 0), today_finish: false },
          res: { changes: [], is_overflow: false }
        }) };
      }
      if (!wound.last_cure_time_sec) throw new GameError(311, 'Pet wound has not started healing');
      if (time < Number(wound.last_cure_time_sec) + Number(woundConfig.effect_time ?? 0)) throw new GameError(311, 'Pet wound is still healing');
      if (wound.today_finish) throw new GameError(310, 'Pet wound already finished today');
      const granted = grantResources(model, requireAwards(awardsOf(cureConfig, 'finish_award'), 'Pet cure award is not configured'),
        tables, { codec, now: () => time });
      wound.today_finish = true;
      wound.cure_times = Number(wound.cure_times ?? 0) + 1;
      state.favor = Number(state.favor ?? 0) + Number(cureConfig.favor_num ?? 0);
      state.wounds[String(woundTid)] = wound;
      writeState(db, roleId, 'pet_activity', actTid, state);
      log({ event: 'pet_cure_finish', actTid, woundTid, favor: state.favor });
      return { value: { actTid }, data: codec.pack('pb_res_pet_act_cure', {
        wound: { wound_tid: woundTid, last_cure_time_sec: Number(wound.last_cure_time_sec), cure_times: wound.cure_times, today_finish: true },
        res: resOf(granted)
      }) };
    });
  }

  function petDailyVitality(request) {
    const actTid = idOf(argAt(request, 0, ['act_tid', 'actId']), 'Invalid pet activity id');
    const config = petConfig(actTid);
    const rows = [...petVitality.values()].sort((left, right) => Number(left.open_day) - Number(right.open_day));
    if (!rows.length) throw new GameError(5, 'Pet daily vitality table is not configured');
    const day = dayOf(at());
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'pet_activity', actTid, petState());
      if (Number(state.daily_time ?? 0) === day) throw new GameError(310, 'Pet daily vitality award already claimed today');
      const row = rows[rows.length - 1];
      const items = listOf(row.award_1).map(Number);
      const counts = listOf(row.award_1_n).map(Number);
      const grants = pairsOf(items, counts);
      const granted = grantResources(model, requireAwards(grants, 'Pet daily vitality award is not configured'),
        tables, { codec, now: () => at() });
      state.daily_time = day;
      state.daily_claims.push(String(day));
      state.vitality_award_state = [...(state.vitality_award_state ?? []), day];
      writeState(db, roleId, 'pet_activity', actTid, state);
      log({ event: 'pet_daily_vitality', actTid, day, cure: config.cure });
      return { value: { actTid }, data: codec.pack('pb_rev_pet_vitality_award_ret', petFlush(state, actTid, granted)) };
    });
  }

  function petExchange(request) {
    const petTid = idOf(argAt(request, 0, ['pet_tid', 'tid']), 'Invalid pet exchange id');
    const exchange = [...petExchanges.values()][0];
    if (!exchange) throw new GameError(5, 'Pet exchange is not configured');
    if (!listOf(exchange.exchange_pet).map(Number).includes(petTid)) throw new GameError(1, 'Pet is not available in the exchange');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'pet_activity', 1, petState());
      const key = 'exchange:' + petTid;
      if (state.favor_claims.includes(key)) throw new GameError(310, 'Pet exchange already claimed');
      consumeResources(model, [[Number(exchange.exchange_item), 1]], 301, { codec, now: () => at() });
      const granted = grantResources(model, [[petTid, 1]], tables, { codec, now: () => at() });
      state.favor_claims.push(key);
      writeState(db, roleId, 'pet_activity', 1, state);
      log({ event: 'pet_exchange', petTid });
      return { value: { petTid }, data: codec.pack('pb_pet_exchange_ret', { res: resOf(granted) }) };
    });
  }

  // ---- PLAY-THEMETREASURE: 76501-76512 ------------------------------
  const themeTables = explorationTables.themeTreasure ?? {};
  const themeHunts = themeTables.Hunt ?? new Map();
  const themeConsts = themeTables.Const ?? new Map();
  const themeBoxes = themeTables.MapBox ?? new Map();
  const themeCustomBoxes = themeTables.CustomBox ?? new Map();
  const themeExchanges = themeTables.Exchange ?? new Map();
  const themeTasks = themeTables.ChallengeTask ?? new Map();
  const themeBoxIndex = new Map();
  for (const row of themeBoxes.values()) {
    const key = Number(row.version) + ':' + Number(row.step_number);
    if (!themeBoxIndex.has(key)) themeBoxIndex.set(key, []);
    themeBoxIndex.get(key).push(Number(row.tid));
  }

  function themeConfig(actTid) {
    const version = configKeyOf(actTid);
    const hunt = themeHunts.get(version);
    const config = themeConsts.get(version);
    if (!hunt || !config) throw new GameError(5, 'Theme treasure activity is not configured');
    return { hunt, config };
  }

  function themeState() {
    return { step: 0, free_times: 0, day: 0, boxes: [], claims: [], exchange: {}, version_award: [], dice_seq: [] };
  }

  function themeExchangeView(state, config) {
    return {
      exchange: Object.entries(state.exchange ?? {}).map(([tid, times]) => ({ tid: Number(tid), times: Number(times) })),
      cost: Number(config.res_exchange ?? 0)
    };
  }

  function themeHunt(request) {
    const actTid = idOf(request.activity_id, 'Invalid theme treasure activity id');
    const version = configKeyOf(actTid);
    const requested = Math.max(0, Number(request.step ?? 0));
    const { hunt, config } = themeConfig(actTid);
    if (!Number.isSafeInteger(requested) || requested > Number(config.multiple_open ?? 50)) throw new GameError(1, 'Theme treasure step count is invalid');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'theme_treasure', actTid, themeState());
      const steps = requested || 1;
      const maxStep = Number(config.max_step ?? 100);
      const loopStep = Number(config.loop_step ?? maxStep);
      const customBox = themeCustomBoxes.get(Number(hunt.custom_info));
      const costId = Number(hunt.cost_id), costCount = Number(hunt.cost_count ?? 1);
      if (!Number.isSafeInteger(costId) || costId <= 0 || !Number.isSafeInteger(costCount) || costCount <= 0) {
        throw new GameError(5, 'Theme treasure hunt cost is not configured');
      }
      const time = at();
      consumeResources(model, [[costId, costCount * steps]], 301, { codec, now: () => time });
      const awards = [];
      const stepRows = [];
      let step = Number(state.step ?? 0);
      for (let index = 0; index < steps; index++) {
        step++;
        if (step > maxStep) step = ((step - 1) % Math.max(1, loopStep)) + 1;
        const boxIds = themeBoxIndex.get(version + ':' + step) ?? [];
        let boxAward = [];
        if (boxIds.length) {
          if (customBox) boxAward = awardsOf(customBox, 'award');
          if (boxAward.length) awards.push(...boxAward);
          state.boxes.push({ step, tid: boxIds[0] });
        }
        stepRows.push({ step, box_award: boxAward, dice: [] });
      }
      const granted = grantResources(model, awards, tables, { codec, now: () => time });
      state.step = step;
      state.free_times = 0;
      writeState(db, roleId, 'theme_treasure', actTid, state);
      log({ event: 'theme_treasure_hunt', actTid, steps, step });
      return { value: { actTid, step }, data: codec.pack('pb_theme_treasure_hunt_rsp', {
        steps: stepRows.map(row => ({
          res_changes: resOf(granted),
          step: row.step,
          box_award: row.box_award.map(([tid, count]) => ({ tid: String(tid), num: String(count) })),
          dice: row.dice
        })),
        free_times: 0,
        new_award_list: awards.map(([tid, count]) => ({ tid: String(tid), num: String(count) }))
      }) };
    });
  }

  function themeChallenge(request, turn = false) {
    const actTid = idOf(request.activity_id ?? argAt(request, 0, ['activity_id']), 'Invalid theme treasure activity id');
    const version = configKeyOf(actTid);
    const { config } = themeConfig(actTid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'theme_treasure', actTid, themeState());
      const progress = turn
        ? Math.floor(Number(state.step ?? 0) / Math.max(1, Number(config.personal_challenge_turn ?? 1)))
        : Number(state.step ?? 0);
      let taskTid = Number(request.tid ?? request.task_tid ?? 0);
      if (!taskTid) {
        const candidates = [...themeTasks.values()]
          .filter(row => Number(row.version) === version && Number(row.type ?? 0) === 0
            && Number(row.target ?? 0) <= progress)
          .sort((left, right) => Number(left.target) - Number(right.target));
        taskTid = Number(candidates.find(row => !state.claims.includes((turn ? 'turn:' : 'challenge:') + row.tid))?.tid ?? 0);
      }
      if (!taskTid) throw new GameError(311, 'Theme treasure has no claimable challenge');
      const task = themeTasks.get(taskTid);
      if (!task || Number(task.version) !== version) throw new GameError(5, 'Theme treasure challenge task is not configured');
      if (Number(task.type ?? 0) !== 0) throw new GameError(5, 'Theme treasure server challenge is not available locally');
      const key = (turn ? 'turn:' : 'challenge:') + taskTid;
      if (state.claims.includes(key) || hasClaim(db, roleId, turn ? 'theme_treasure_turn' : 'theme_treasure_challenge', actTid + ':' + taskTid)) {
        throw new GameError(310, 'Theme treasure challenge already claimed');
      }
      if (progress < Number(task.target ?? 0)) throw new GameError(311, 'Theme treasure challenge is not finished');
      const grants = pairsOf(task.award, task.count);
      const granted = grantResources(model, requireAwards(grants, 'Theme treasure challenge award is not configured'),
        tables, { codec, now: () => at() });
      state.claims.push(key);
      markClaim(db, roleId, turn ? 'theme_treasure_turn' : 'theme_treasure_challenge', actTid + ':' + taskTid);
      writeState(db, roleId, 'theme_treasure', actTid, state);
      log({ event: turn ? 'theme_treasure_turn' : 'theme_treasure_challenge', actTid, taskTid });
      // ThemeTreasureMgr / ThemeTreasureTaskMgr consume every task award with
      // the shared pb_res_to_client body; the older *_challenge_rsp wrappers
      // are not referenced by the shipped Lua.
      return { value: { actTid }, data: codec.pack('pb_res_to_client', resOf(granted)) };
    });
  }

  function themeExchange(request) {
    const actTid = idOf(request.activity_id, 'Invalid theme treasure activity id');
    const tid = idOf(request.tid, 'Invalid theme treasure exchange id');
    const count = Math.max(1, Number(request.exchange_num ?? 1));
    const { config } = themeConfig(actTid);
    const row = themeExchanges.get(tid);
    if (!row) throw new GameError(5, 'Theme treasure exchange item is not configured');
    if (!Number.isSafeInteger(count) || count > 999) throw new GameError(1, 'Theme treasure exchange count is invalid');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'theme_treasure', actTid, themeState());
      const used = Number(state.exchange[String(tid)] ?? 0);
      const limit = Number(row.limit_count ?? 0);
      if (limit > 0 && used + count > limit) throw new GameError(311, 'Theme treasure exchange limit reached');
      const price = Number(row.price ?? 0), currency = Number(row.currency ?? 0);
      if (!Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(currency) || currency <= 0) {
        throw new GameError(5, 'Theme treasure exchange cost is not configured');
      }
      const time = at();
      consumeResources(model, [[currency, price * count]], 301, { codec, now: () => time });
      const granted = grantResources(model, [[Number(row.item), Number(row.count) * count]], tables, { codec, now: () => time });
      state.exchange[String(tid)] = used + count;
      writeState(db, roleId, 'theme_treasure', actTid, state);
      log({ event: 'theme_treasure_exchange', actTid, tid, count });
      return { value: { actTid }, data: codec.pack('pb_theme_treasure_exchange_rsp', {
        res_changes: resOf(granted), exchange: themeExchangeView(state, config)
      }) };
    });
  }

  function themeServerQuery(request, responseType = 'pb_theme_treasure_server_rsp') {
    const actTid = idOf(argAt(request, 0, ['activity_id']), 'Invalid theme treasure activity id');
    themeConfig(actTid);
    const roleId = store.state().roleId;
    const state = store.inspect(db => readState(db, roleId, 'theme_treasure', actTid, themeState()));
    return { value: { actTid }, data: codec.pack(responseType, { server_step: Number(state.step ?? 0), stats: [] }) };
  }

  function themeEtfRequest(request) {
    const values = listOf(request).map(value => Number(plainOf(value)));
    return values.length >= 2
      ? { activity_id: values[0], tid: values[1] }
      : { activity_id: 1, tid: values[0] };
  }

  // 76509 theme_treasure_server_award_req is an ETF task id (the client sends
  // [activity_id, task_id] whenever it already knows the running generation).
  // Server challenges are the type=1 ChallengeTask rows; in this single-role
  // server the aggregate server step equals the local hunt step.
  function themeServerAward(request) {
    const values = listOf(request).map(value => Number(plainOf(value)));
    let actTid = values.length >= 2 ? Number(values[0]) : 0;
    const taskTid = Number(values.length >= 2 ? values[1] : values[0]);
    const task = themeTasks.get(taskTid);
    if (!task || Number(task.type ?? 0) !== 1) throw new GameError(5, 'Theme treasure server challenge is not configured');
    if (!actTid) {
      const version = Number(task.version);
      actTid = Number([...(tables?.Activity ?? new Map()).entries()]
        .find(([, row]) => Number(row.func) === 63 && Number(row.version) === version)?.[0] ?? 0);
    }
    if (!actTid) throw new GameError(5, 'Theme treasure activity is not configured');
    const version = configKeyOf(actTid);
    if (Number(task.version) !== version) throw new GameError(5, 'Theme treasure server challenge is not configured');
    themeConfig(actTid);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'theme_treasure', actTid, themeState());
      const key = 'server:' + task.tid;
      if (state.claims.includes(key) || hasClaim(db, roleId, 'theme_treasure_server', actTid + ':' + task.tid)) {
        throw new GameError(310, 'Theme treasure server challenge already claimed');
      }
      if (Number(state.step ?? 0) < Number(task.target ?? 0)) throw new GameError(311, 'Theme treasure server challenge is not finished');
      const granted = grantResources(model, requireAwards(pairsOf(task.award, task.count), 'Theme treasure server challenge award is not configured'),
        tables, { codec, now: () => at() });
      state.claims.push(key);
      markClaim(db, roleId, 'theme_treasure_server', actTid + ':' + task.tid);
      writeState(db, roleId, 'theme_treasure', actTid, state);
      log({ event: 'theme_treasure_server_award', actTid, taskTid: task.tid });
      return { value: { actTid, taskTid: task.tid }, data: codec.pack('pb_res_to_client', resOf(granted)) };
    });
  }

  // ---- PLAY-TREASUREHUNT: 85601-85610 --------------------------------
  const huntTables = explorationTables.treasureHunt ?? {};
  const huntConst = [...(huntTables.Const ?? new Map()).values()][0] ?? null;
  const huntAwardConst = [...(huntTables.AwardConst ?? new Map()).values()][0] ?? null;
  const huntShovelLevels = huntTables.ShovelLevel ?? new Map();
  const huntGridLevels = huntTables.MapGridLevel ?? new Map();
  const huntMaxFloors = huntTables.MapMaxFloor ?? new Map();
  const huntHighAwards = huntTables.HighAward ?? new Map();

  function huntState() {
    return {
      shovels: [], next_index: 1, map: null, refresh_time: 0, box_award_num: 0,
      normal_award_num: 0, all_award_list: [], box_award_list: [], last_award_coin_time: 0,
      award_num_list: [], collection_flush_num: 0, daily: { day: 0, count: 0 }, claims: []
    };
  }

  // The shipped table describes 18 columns with a maximum floor and an 8-row
  // style ladder. The exact server board generator is not in the bundle, so
  // this local reconstruction is deterministic and uses only those rows.
  function huntMap(state) {
    if (state.map) return state.map;
    const floorRows = [...huntMaxFloors.values()].sort((a, b) => Number(a.tid) - Number(b.tid));
    const styleRows = [...huntGridLevels.values()].sort((a, b) => Number(a.tid) - Number(b.tid));
    const awards = [...huntHighAwards.values()].sort((a, b) => Number(a.tid) - Number(b.tid));
    const gridList = [];
    for (let index = 1; index <= floorRows.length; index++) {
      const floor = Number(floorRows[index - 1].grid_max_floor ?? 1);
      const style = styleRows[(index - 1) % Math.max(1, styleRows.length)];
      const award = awards[(index - 1) % Math.max(1, awards.length)];
      gridList.push({
        level: Number(style?.grid_level ?? 1), res_tid: String(award?.res ?? 0),
        index, res_num: Number(award?.num ?? 0), hp: Math.max(1, floor)
      });
    }
    state.map = { grid_list: gridList, refresh_time: Number(state.refresh_time ?? 0), collection_flush_num: 0, mission_index: 0 };
    return state.map;
  }

  function huntRole(state) {
    return {
      res: { shovel_list: (state.shovels ?? []).map(shovel => ({
        tid: Number(shovel.tid), level: Number(shovel.tid), index: Number(shovel.index), hp: Number(shovel.hp)
      })) },
      award_num_list: state.award_num_list ?? [], box_award_num: Number(state.box_award_num ?? 0),
      last_award_coin_time: Number(state.last_award_coin_time ?? 0),
      all_award_list: (state.all_award_list ?? []).map(([tid, count]) => ({ tid: String(tid), num: String(count) })),
      daily_flush_time: Number(state.refresh_time ?? 0),
      daily_deleted_time: Number(state.daily?.count ?? 0),
      normal_award_num: Number(state.normal_award_num ?? 0),
      box_award_list: (state.box_award_list ?? []).map(([tid, count]) => ({ tid: String(tid), num: String(count) }))
    };
  }

  function huntRet(state, granted, awards = []) {
    return {
      res: granted ? resOf(granted) : { changes: [], is_overflow: false },
      map: huntMap(state),
      award_list: awards.map(row => ({
        index: Number(row.index),
        award_list: row.award_list.map(([tid, count]) => ({ tid: String(tid), num: String(count) }))
      })),
      new_box_num_list: [], box_award_list: [],
      all_award_list: (state.all_award_list ?? []).map(([tid, count]) => ({ tid: String(tid), num: String(count) })),
      new_box_award_list: []
    };
  }

  function huntShovel(state, index) {
    const list = (state.shovels ?? []).slice().sort((a, b) => Number(a.hp) - Number(b.hp) || Number(a.tid) - Number(b.tid));
    if (index != null) {
      const exact = list.find(shovel => Number(shovel.index) === Number(index));
      if (exact) return exact;
    }
    return list[0] ?? null;
  }

  function huntAddShovel(state, level, index = null) {
    const resolved = index == null ? Number(state.next_index ?? 1) : Number(index);
    state.next_index = Math.max(Number(state.next_index ?? 1), resolved + 1);
    state.shovels.push({ tid: Number(level), index: resolved, hp: Number(level) });
  }

  function treasureHunt(request) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'treasure_hunt', 1, huntState());
      const map = huntMap(state);
      const gridIndex = numberArg(request, 0, ['index', 'grid_index']);
      const shovelIndex = numberArg(request, 1, ['src_index', 'shovel_index']) || null;
      const grid = map.grid_list.find(row => Number(row.index) === Number(gridIndex || map.grid_list.find(entry => Number(entry.hp) > 0)?.index));
      if (!grid) throw new GameError(5, 'Treasure hunt grid is not configured');
      if (Number(grid.hp) <= 0) throw new GameError(311, 'Treasure hunt grid is already cleared');
      const shovel = huntShovel(state, shovelIndex);
      if (!shovel) throw new GameError(301, 'Treasure hunt shovel is not available');
      const awards = [];
      grid.hp = Math.max(0, Number(grid.hp) - Number(shovel.tid));
      shovel.hp = Math.max(0, Number(shovel.hp) - 1);
      if (Number(shovel.hp) <= 0) state.shovels = state.shovels.filter(entry => entry !== shovel);
      let granted = null;
      if (Number(grid.hp) <= 0) {
        const pair = [[Number(grid.res_tid), Number(grid.res_num)]];
        if (pair[0][0] > 0 && pair[0][1] > 0) {
          granted = grantResources(model, pair, tables, { codec, now: () => at() });
          state.all_award_list.push(...pair);
          state.normal_award_num = Number(state.normal_award_num ?? 0) + 1;
          awards.push({ index: grid.index, award_list: pair });
        }
      }
      writeState(db, roleId, 'treasure_hunt', 1, state);
      log({ event: 'treasure_hunt_dig', grid: grid.index, shovel: shovel.index, cleared: Number(grid.hp) <= 0 });
      return { value: { grid: grid.index }, data: codec.pack('pb_treasure_hunt_ret_all', huntRet(state, granted, awards)) };
    });
  }

  function treasureHuntBuy(request) {
    const count = Math.max(1, Math.min(10, numberArg(request, 0, ['count', 'num'], 1)));
    const level = huntShovelLevels.get(1);
    if (!huntConst || !huntAwardConst || !level) throw new GameError(5, 'Treasure hunt shovel config is not configured');
    const payItem = Number(huntConst.pay_item);
    const price = Number(level.price ?? 0);
    if (!Number.isSafeInteger(payItem) || payItem <= 0 || !Number.isSafeInteger(price) || price <= 0) {
      throw new GameError(5, 'Treasure hunt shovel price is not configured');
    }
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'treasure_hunt', 1, huntState());
      consumeResources(model, [[payItem, price * count]], 301, { codec, now: () => at() });
      for (let index = 0; index < count; index++) huntAddShovel(state, 1);
      writeState(db, roleId, 'treasure_hunt', 1, state);
      log({ event: 'treasure_hunt_buy_shovel', count });
      return { value: { count }, data: codec.pack('pb_treasure_hunt_ret_all', huntRet(state, null)) };
    });
  }

  function treasureHuntCompose(request, automatic = false) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'treasure_hunt', 1, huntState());
      const groups = [];
      const compose = (srcIndex, tarIndex) => {
        const src = state.shovels.find(entry => Number(entry.index) === Number(srcIndex));
        const tar = state.shovels.find(entry => Number(entry.index) === Number(tarIndex));
        if (!src || !tar || src === tar) throw new GameError(311, 'Treasure hunt shovels are not available');
        if (Number(src.tid) !== Number(tar.tid)) throw new GameError(311, 'Treasure hunt shovels have different levels');
        const level = Number(src.tid) + 1;
        if (!huntShovelLevels.has(level)) throw new GameError(311, 'Treasure hunt shovel is already at max level');
        state.shovels = state.shovels.filter(entry => entry !== src && entry !== tar);
        huntAddShovel(state, level, tar.index);
        groups.push([Number(srcIndex), Number(tarIndex), Number(tar.index)]);
      };
      if (automatic) {
        for (;;) {
          const byLevel = new Map();
          let found = null;
          for (const shovel of [...state.shovels].sort((a, b) => Number(a.index) - Number(b.index))) {
            const list = byLevel.get(Number(shovel.tid)) ?? [];
            list.push(shovel);
            byLevel.set(Number(shovel.tid), list);
            if (list.length === 2) { found = list; break; }
          }
          if (!found) break;
          compose(found[0].index, found[1].index);
        }
      } else {
        compose(request.src_index, request.tar_index);
      }
      writeState(db, roleId, 'treasure_hunt', 1, state);
      log({ event: 'treasure_hunt_compose', groups: groups.length });
      return { value: { groups: groups.length }, data: codec.pack('pb_treasure_hunt_compose_ret', {
        hunt_res: huntRole(state).res,
        all_compose_list: groups.map(indexes => ({ all_compose_indexes: indexes }))
      }) };
    });
  }

  function treasureHuntExchange(request) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'treasure_hunt', 1, huntState());
      const src = state.shovels.find(entry => Number(entry.index) === Number(request.src_index));
      const tar = state.shovels.find(entry => Number(entry.index) === Number(request.tar_index));
      if (!src || !tar || src === tar) throw new GameError(311, 'Treasure hunt shovels are not available');
      const srcHp = src.hp;
      src.hp = tar.hp; tar.hp = srcHp;
      writeState(db, roleId, 'treasure_hunt', 1, state);
      log({ event: 'treasure_hunt_exchange', src: src.index, tar: tar.index });
      return { value: {}, data: codec.pack('pb_treasure_hunt_ret_all', huntRet(state, null)) };
    });
  }

  function treasureHuntDelete(request) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'treasure_hunt', 1, huntState());
      const day = dayOf(at());
      state.daily ??= { day: 0, count: 0 };
      if (Number(state.daily.day) !== day) state.daily = { day, count: 0 };
      const max = Number(huntConst?.daily_max_delete_time ?? 0);
      if (max > 0 && Number(state.daily.count) >= max) throw new GameError(311, 'Treasure hunt daily delete limit reached');
      const index = numberArg(request, 0, ['index']);
      const shovel = index ? state.shovels.find(entry => Number(entry.index) === index) : state.shovels[0];
      if (!shovel) throw new GameError(311, 'Treasure hunt shovel is not available');
      state.shovels = state.shovels.filter(entry => entry !== shovel);
      state.daily.count = Number(state.daily.count ?? 0) + 1;
      writeState(db, roleId, 'treasure_hunt', 1, state);
      log({ event: 'treasure_hunt_delete', count: state.daily.count });
      return { value: {}, data: codec.pack('pb_treasure_hunt_delete_ret', {
        res: { changes: [], is_overflow: false }, deleted_index_list: [Number(shovel.index)],
        daily_time: Number(state.daily.day), delete_num: Number(state.daily.count)
      }) };
    });
  }

  function treasureHuntRefresh() {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'treasure_hunt', 1, huntState());
      state.map = null;
      state.refresh_time = at();
      huntMap(state);
      writeState(db, roleId, 'treasure_hunt', 1, state);
      log({ event: 'treasure_hunt_refresh' });
      return { value: {}, data: codec.pack('pb_treasure_hunt_refresh_ret', {
        role_data: huntRole(state), res: { changes: [], is_overflow: false }
      }) };
    });
  }

  // ---- PLAY-DREAM: 88001-88010 --------------------------------------
  const dreamTables = explorationTables.dream ?? {};
  const dreamEvents = dreamTables.Event ?? new Map();
  const dreamEventAwards = dreamTables.EventAward ?? new Map();
  const dreamEventAwardsNew = dreamTables.EventAwardNew ?? new Map();
  const dreamWeekAwards = dreamTables.WeekAward ?? new Map();
  const dreamWeekAwardsNew = dreamTables.WeekAwardNew ?? new Map();
  const dreamMonthAwards = dreamTables.MonthAward ?? new Map();
  const dreamMonthAwardsNew = dreamTables.MonthAwardNew ?? new Map();
  const dreamFixAwards = dreamTables.FixAward ?? new Map();
  const dreamFixAwardsNew = dreamTables.FixAwardNew ?? new Map();
  const dreamAwardSplit = [...(dreamTables.AwardSplit ?? new Map()).values()][0] ?? null;
  const dreamCollectAwards = dreamTables.CollectAward ?? new Map();
  const dreamCollect = dreamTables.Collect ?? new Map();
  const dreamGroups = dreamTables.Group ?? new Map();
  const dreamGroupSeq = dreamTables.GroupSeq ?? new Map();
  const dreamConst = [...(dreamTables.Const ?? new Map()).values()][0] ?? null;

  function dreamState() {
    return {
      start_stamp: at(), week_finish_event: 0, month_finish_event: 0, got_day_award_stamp: 0,
      group: 1, group_index: 0, group_events: [], collect: [], got_week: [], got_month: [],
      got_collect: [], got_single_collect: [], day_refresh: { day: 0, count: 0 },
      finish_event_history: [], tasks: [], buffs: [], week: 1, period: 1
    };
  }

  // DreamTableUtil.IsNewAward switches the whole reward family once the server
  // has been open for the configured split and has entered a later week.
  function dreamIsNewAward(state) {
    if (!dreamAwardSplit) return false;
    const openedAt = Number(store.serverOpenedAt ?? calendar?.serverOpenedAt ?? 0);
    const splitTime = Number(dreamAwardSplit.server_open_time ?? 0);
    if (!openedAt || splitTime > openedAt) return false;
    const openDay = Math.floor((at() - openedAt) / DAY_SECONDS) + 1;
    if (openDay < Number(dreamAwardSplit.server_open_day ?? 0)) return false;
    const weekStart = Number(state.start_stamp ?? 0) + (Math.max(1, Number(state.week ?? 1)) - 1) * 7 * DAY_SECONDS;
    if (weekStart < splitTime) return false;
    const gapDay = dayOf(weekStart) - dayOf(splitTime);
    return gapDay + 1 <= Number(dreamAwardSplit.server_open_day ?? 0);
  }

  function dreamFixAwardRow(state) {
    const source = dreamIsNewAward(state) ? dreamFixAwardsNew : dreamFixAwards;
    const row = source.get(1) ?? [...source.values()][0];
    if (!row) throw new GameError(5, 'Dream day award is not configured');
    return row;
  }

  function dreamGroupOrder() {
    const sequence = listOf([...dreamGroupSeq.values()][0]?.group).map(Number);
    return sequence.length ? sequence : [...dreamGroups.keys()].map(Number).sort((a, b) => a - b);
  }

  function dreamEventRow(type) {
    return dreamEvents.get(Number(type)) ?? null;
  }

  function dreamEventPayload(type) {
    switch (Number(type)) {
      case 1: case 2: case 3: return codec.pack('pb_dream_event_fight', { enemies: [], refresh_times: 0 });
      case 5: return codec.pack('pb_dream_event_buff', { buffs: [] });
      case 7: return codec.pack('pb_dream_event_award', { num: 1, boxes: [] });
      default: return Buffer.alloc(0);
    }
  }

  function dreamGroupEvents(state) {
    const order = dreamGroupOrder();
    const groupTid = order[(Number(state.group ?? 1) - 1) % Math.max(1, order.length)];
    const row = dreamGroups.get(groupTid);
    if (!row) return [];
    return listOf(row.event).map((type, index) => ({
      type: Number(type), data: dreamEventPayload(type), index
    }));
  }

  function dreamRole(state) {
    return {
      start_stamp: Number(state.start_stamp ?? 0),
      week_finish_event: Number(state.week_finish_event ?? 0),
      month_finish_event: Number(state.month_finish_event ?? 0),
      tasks: state.tasks ?? [], buffs: state.buffs ?? [],
      got_day_award_stamp: Number(state.got_day_award_stamp ?? 0),
      group: Number(state.group ?? 1), group_events: dreamGroupEvents(state),
      collect: Buffer.alloc(0), got_week_event_award: idBytes(state.got_week ?? []),
      got_month_event_award: idBytes(state.got_month ?? []),
      got_collect_award: idBytes(state.got_collect ?? []),
      story: { choices: [] }, week: Number(state.week ?? 1), fight_index: [], period: Number(state.period ?? 1),
      last_task_uid: 0, finish_event_history: (state.finish_event_history ?? []).map(Number),
      got_single_collect_award: idBytes(state.got_single_collect ?? []),
      day_refresh_event_times: { count: Number(state.day_refresh?.count ?? 0), flush_time: Number(state.day_refresh?.day ?? 0) },
      data_version: 1
    };
  }

  function dreamFightResponse(state, granted) {
    return {
      week_finish_event: Number(state.week_finish_event ?? 0),
      month_finish_event: Number(state.month_finish_event ?? 0),
      tasks: state.tasks ?? [], buffs: [], group: Number(state.group ?? 1),
      group_events: dreamGroupEvents(state),
      res_change: granted ? resOf(granted) : { changes: [], is_overflow: false },
      collect: Buffer.alloc(0), story: { choices: [] }
    };
  }

  function dreamAwardResponse(state, granted) {
    return codec.pack('pb_dream_award_rsp', {
      res_change: resOf(granted),
      got_day_award_stamp: Number(state.got_day_award_stamp ?? 0),
      got_week_event_award: idBytes(state.got_week ?? []),
      got_month_event_award: idBytes(state.got_month ?? []),
      got_collect_award: idBytes(state.got_collect ?? []),
      tasks: state.tasks ?? [],
      group_events: dreamGroupEvents(state),
      got_single_collect_award: idBytes(state.got_single_collect ?? [])
    });
  }

  function dreamFinishEvent(request) {
    let event;
    try { event = codec.unpack('pb_dream_event', binaryOf(request?.param)); }
    catch { throw new GameError(1, 'Invalid dream event payload'); }
    const type = Number(event?.type ?? 0);
    if (!dreamEventRow(type)) throw new GameError(5, 'Dream event type is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      const awardRow = (dreamIsNewAward(state) ? dreamEventAwardsNew : dreamEventAwards).get(type);
      const grants = awardsOf(awardRow, 'award');
      const granted = grantResources(model, grants, tables, { codec, now: () => at() });
      state.week_finish_event = Number(state.week_finish_event ?? 0) + 1;
      state.month_finish_event = Number(state.month_finish_event ?? 0) + 1;
      state.finish_event_history.push(type);
      state.group_index = Number(state.group_index ?? 0) + 1;
      const groupSize = dreamGroupEvents(state).length;
      if (groupSize > 0 && state.group_index >= groupSize) {
        state.group = Number(state.group ?? 1) + 1;
        state.group_index = 0;
      }
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_finish_event', type, week: state.week_finish_event, month: state.month_finish_event });
      return { value: { type }, data: codec.pack('pb_dream_fight_event_rsp', dreamFightResponse(state, granted)) };
    });
  }

  function dreamDayAward() {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      const lastStamp = Number(state.got_day_award_stamp ?? 0);
      if (lastStamp > 0 && dayOf(lastStamp) === dayOf(at())) {
        throw new GameError(310, 'Dream day award already claimed');
      }
      const row = dreamFixAwardRow(state);
      const granted = grantResources(model, requireAwards(awardsOf(row, 'award'), 'Dream day award is not configured'),
        tables, { codec, now: () => at() });
      state.got_day_award_stamp = at();
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_day_award', stamp: state.got_day_award_stamp });
      return { value: { stamp: state.got_day_award_stamp }, data: dreamAwardResponse(state, granted) };
    });
  }

  function dreamWeekAward(request) {
    const index = Math.max(1, numberArg(request, 0, ['index', 'tid'], 1));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      const row = (dreamIsNewAward(state) ? dreamWeekAwardsNew : dreamWeekAwards).get(index);
      if (!row) throw new GameError(5, 'Dream week award is not configured');
      if (state.got_week.includes(index) || hasClaim(db, roleId, 'dream_week', '1:' + index)) throw new GameError(310, 'Dream week award already claimed');
      if (Number(state.week_finish_event ?? 0) < Number(row.count ?? 0)) throw new GameError(311, 'Dream week progress is not enough');
      const granted = grantResources(model, requireAwards(awardsOf(row, 'award'), 'Dream week award is not configured'),
        tables, { codec, now: () => at() });
      state.got_week.push(index);
      markClaim(db, roleId, 'dream_week', '1:' + index);
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_week_award', index });
      return { value: { index }, data: codec.pack('pb_dream_award_rsp', {
        res_change: resOf(granted), got_week_event_award: idBytes(state.got_week),
        got_month_event_award: idBytes(state.got_month ?? []),
        got_collect_award: idBytes(state.got_collect ?? []),
        tasks: state.tasks ?? [], group_events: dreamGroupEvents(state),
        got_single_collect_award: idBytes(state.got_single_collect ?? [])
      }) };
    });
  }

  function dreamMonthAward(request) {
    const index = Math.max(1, numberArg(request, 0, ['index', 'tid'], 1));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      const row = (dreamIsNewAward(state) ? dreamMonthAwardsNew : dreamMonthAwards).get(index);
      if (!row) throw new GameError(5, 'Dream month award is not configured');
      if (state.got_month.includes(index) || hasClaim(db, roleId, 'dream_month', '1:' + index)) throw new GameError(310, 'Dream month award already claimed');
      if (Number(state.month_finish_event ?? 0) < Number(row.count ?? 0)) throw new GameError(311, 'Dream month progress is not enough');
      const granted = grantResources(model, requireAwards(awardsOf(row, 'award'), 'Dream month award is not configured'),
        tables, { codec, now: () => at() });
      state.got_month.push(index);
      markClaim(db, roleId, 'dream_month', '1:' + index);
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_month_award', index });
      return { value: { index }, data: codec.pack('pb_dream_award_rsp', {
        res_change: resOf(granted), got_week_event_award: idBytes(state.got_week ?? []),
        got_month_event_award: idBytes(state.got_month),
        got_collect_award: idBytes(state.got_collect ?? []),
        tasks: state.tasks ?? [], group_events: dreamGroupEvents(state),
        got_single_collect_award: idBytes(state.got_single_collect ?? [])
      }) };
    });
  }

  function dreamCollectAward(request) {
    const index = Math.max(1, numberArg(request, 0, ['index', 'tid'], 1));
    const row = dreamCollectAwards.get(index);
    if (!row) throw new GameError(5, 'Dream collect award is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      if (state.got_collect.includes(index) || hasClaim(db, roleId, 'dream_collect', '1:' + index)) throw new GameError(310, 'Dream collect award already claimed');
      if (state.got_single_collect.length < Number(row.need ?? 0)) throw new GameError(311, 'Dream collect progress is not enough');
      const granted = grantResources(model, requireAwards(awardsOf(row, 'award'), 'Dream collect award is not configured'),
        tables, { codec, now: () => at() });
      state.got_collect.push(index);
      markClaim(db, roleId, 'dream_collect', '1:' + index);
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_collect_award', index });
      return { value: { index }, data: codec.pack('pb_dream_award_rsp', {
        res_change: resOf(granted), got_week_event_award: idBytes(state.got_week ?? []),
        got_month_event_award: idBytes(state.got_month ?? []),
        got_collect_award: idBytes(state.got_collect),
        tasks: state.tasks ?? [], group_events: dreamGroupEvents(state),
        got_single_collect_award: idBytes(state.got_single_collect ?? [])
      }) };
    });
  }

  function dreamSingleCollect(request) {
    const tid = Math.max(1, numberArg(request, 0, ['tid', 'index'], 1));
    const row = dreamCollect.get(tid);
    if (!row) throw new GameError(5, 'Dream collect record is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      if (state.got_single_collect.includes(tid) || hasClaim(db, roleId, 'dream_single_collect', '1:' + tid)) {
        throw new GameError(310, 'Dream collect record already claimed');
      }
      const granted = grantResources(model, requireAwards(awardsOf(row, 'split_award'), 'Dream collect record award is not configured'),
        tables, { codec, now: () => at() });
      state.got_single_collect.push(tid);
      markClaim(db, roleId, 'dream_single_collect', '1:' + tid);
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_single_collect', tid });
      return { value: { tid }, data: codec.pack('pb_dream_award_rsp', {
        res_change: resOf(granted), got_week_event_award: idBytes(state.got_week ?? []),
        got_month_event_award: idBytes(state.got_month ?? []),
        got_collect_award: idBytes(state.got_collect ?? []),
        tasks: state.tasks ?? [], group_events: dreamGroupEvents(state),
        got_single_collect_award: idBytes(state.got_single_collect)
      }) };
    });
  }

  function dreamRefreshEvent() {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'dream', 1, dreamState());
      state.day_refresh ??= { day: 0, count: 0 };
      const day = dayOf(at());
      if (Number(state.day_refresh.day) !== day) state.day_refresh = { day, count: 0 };
      const tiers = listOf(dreamConst?.day_event_refresh_cost).map(pair => listOf(pair).map(Number));
      const tier = tiers[Math.min(Number(state.day_refresh.count), Math.max(0, tiers.length - 1))] ?? [0, 0];
      const count = Number(tier[1] ?? 0);
      const item = Number(dreamConst?.event_refresh_cost_items ?? 0);
      if (count > 0 && item > 0) consumeResources(model, [[item, count]], 301, { codec, now: () => at() });
      state.day_refresh.count = Number(state.day_refresh.count ?? 0) + 1;
      const events = dreamGroupEvents(state);
      const event = events[Math.min(Number(state.group_index ?? 0), Math.max(0, events.length - 1))] ?? { type: 3, data: Buffer.alloc(0) };
      writeState(db, roleId, 'dream', 1, state);
      log({ event: 'dream_refresh_event', count: state.day_refresh.count });
      return { value: {}, data: codec.pack('pb_dream_refresh_event_rsp', {
        event: { type: Number(event.type), data: event.data },
        res: { changes: [], is_overflow: false },
        day_refresh_event_times: { count: state.day_refresh.count, flush_time: state.day_refresh.day }
      }) };
    });
  }

  function dreamNpcLineup() {
    return { value: {}, data: codec.pack('pb_dream_npc_lineup_rsp', { npc_lineups: [] }) };
  }

  // ---- PLAY-CARNIVAL: 43003-43024 -----------------------------------
  const carnivalTables = explorationTables.carnival ?? {};
  const carnivalConst = [...(carnivalTables.Const ?? new Map()).values()][0] ?? null;
  const carnivalBuilds = carnivalTables.MonopolyBuild ?? new Map();
  const carnivalBuildLevels = carnivalTables.MonopolyBuildLevel ?? new Map();
  const carnivalEvents = carnivalTables.MonopolyEvent ?? new Map();
  const carnivalEventAwards = carnivalTables.MonopolyEventAward ?? new Map();
  const carnivalPaths = carnivalTables.MonopolyPath ?? new Map();
  const carnivalPathVersions = carnivalTables.MonopolyPathVersion ?? new Map();
  const carnivalTechs = carnivalTables.MonopolyTech ?? new Map();
  const carnivalAwardLibs = carnivalTables.AwardLib ?? new Map();
  const carnivalAwards = carnivalTables.Award ?? new Map();
  const carnivalLevels = carnivalTables.Level ?? new Map();

  function carnivalState() {
    return {
      open_time: at(), dice: Number(carnivalConst?.init_dice_count ?? 10),
      last_dice_flush: at(), daily_buy: 0, last_daily_flush: dayOf(at()),
      total_throw: 0, cur_index: 0, events: {}, builds: [], next_build_id: 1,
      techs: [], achievements: [], boxes_earned: 0, boxes_left: 0, use_items: [], version: 1
    };
  }

  function carnivalPath(version = 1) {
    return [...carnivalPaths.values()].filter(row => Number(row.belong_version) === Number(version))
      .sort((left, right) => Number(right.cell_id) - Number(left.cell_id));
  }

  function carnivalEventList(state) {
    const events = Object.values(state.events ?? {}).sort((left, right) => Number(left.index) - Number(right.index));
    return events.map(event => ({
      tid: Number(event.tid), index: Number(event.index), is_finish: Boolean(event.is_finish),
      param: Number(event.param ?? 0), ext_data: { res_list: [] }
    }));
  }

  function carnivalBuildList(state) {
    return (state.builds ?? []).map(build => {
      const config = carnivalBuilds.get(Number(build.tid));
      const level = carnivalBuildLevels.get(Number(build.tid));
      const output = Number(level?.output?.[Math.max(0, Number(build.level) - 1)] ?? 0);
      return {
        id: Number(build.id), tid: Number(build.tid), level: Number(build.level), output,
        extra_award_args: [], output_acc: [], dispatch_hero: build.dispatch_hero ?? { heroes: [] },
        extra_info: Buffer.alloc(0), _last_collect: Number(build.last_collect ?? at()),
        _output_res: Number(config?.output_res ?? 0), _yield: Number(level?.yield ?? 100000)
      };
    });
  }

  function carnivalMonopoly(state) {
    const path = carnivalPath(state.version);
    return {
      open_time: Number(state.open_time ?? 0), use_item_list: state.use_items ?? [],
      last_dice_flush_time: Number(state.last_dice_flush ?? 0),
      last_daily_flush_time: Number(state.last_daily_flush ?? 0),
      daily_dice_buy_num: Number(state.daily_buy ?? 0), total_throw_dice_num: Number(state.total_throw ?? 0),
      reset_time: Number(state.open_time ?? 0) + Number(carnivalConst?.act_duration ?? 0),
      map_data: {
        cur_index: Number(state.cur_index ?? 0), event_list: carnivalEventList(state),
        is_custom: false, normal_events: path.map(row => Number(row.cell_id))
      },
      build_data: { builds: carnivalBuildList(state) },
      achieve_data: { week_throw_dice_num: Number(state.total_throw ?? 0), achieve_rev_states: idBytes(state.achievements ?? []) },
      tech_list: (state.techs ?? []).map(tech => ({ tid: Number(tech.tid), start_time: Number(tech.start_time ?? 0) })),
      box_award_num: Number(state.boxes_earned ?? 0), left_box_num: Number(state.boxes_left ?? 0),
      version: Number(state.version ?? 1)
    };
  }

  function carnivalRefreshDice(state) {
    const day = dayOf(at());
    if (Number(state.last_daily_flush ?? 0) !== day) {
      state.last_daily_flush = day;
      state.daily_buy = 0;
    }
    const flush = Number(carnivalConst?.dice_flush_time ?? 86400);
    if (!state.last_dice_flush || at() >= Number(state.last_dice_flush) + flush) {
      state.dice = Math.max(Number(state.dice ?? 0), Number(carnivalConst?.init_dice_count ?? 10));
      state.last_dice_flush = at();
    }
  }

  function carnivalLatest() {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      carnivalRefreshDice(state);
      writeState(db, roleId, 'carnival', 1, state);
      return { value: {}, data: codec.pack('pb_mono_req_data_back', {
        res: { changes: [], is_overflow: false }, monopoly: carnivalMonopoly(state)
      }) };
    });
  }

  function carnivalThrow(request) {
    const count = Math.max(1, Math.min(10, numberArg(request, 0, ['count', 'dice_count'], 1)));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      carnivalRefreshDice(state);
      if (Number(state.dice ?? 0) < count) throw new GameError(301, 'Carnival dice is not enough');
      const path = carnivalPath(state.version);
      if (!path.length) throw new GameError(5, 'Carnival path is not configured');
      const eventIds = [...carnivalEvents.keys()].map(Number).sort((a, b) => a - b);
      let curIndex = Number(state.cur_index ?? 0);
      state.events = {};
      for (let index = 0; index < count; index++) {
        const roll = 1 + Math.floor(Number(random()) * 6);
        curIndex = ((curIndex + roll - 1) % path.length) + 1;
        const eventTid = eventIds[(curIndex - 1) % eventIds.length];
        state.events[String(curIndex)] = { tid: eventTid, index: curIndex, is_finish: false, param: roll };
      }
      state.cur_index = curIndex;
      state.dice = Number(state.dice ?? 0) - count;
      state.total_throw = Number(state.total_throw ?? 0) + count;
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_throw_dice', count, curIndex });
      return { value: { count }, data: codec.pack('pb_mono_throw_dice_back', {
        res: { changes: [], is_overflow: false }, monopoly: carnivalMonopoly(state),
        is_flush_map: false, dice_count: count, cur_index: curIndex,
        build_data_before_magnet: { builds: [] }
      }) };
    });
  }

  function carnivalTouch(request) {
    const index = numberArg(request, 0, ['index', 'event_index']);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      const event = state.events[String(index)];
      if (!event) throw new GameError(311, 'Carnival event is not on the current cell');
      writeState(db, roleId, 'carnival', 1, state);
      return { value: {}, data: codec.pack('pb_mono_finish_ev_back', {
        res: { changes: [], is_overflow: false }, use_item_list: state.use_items ?? []
      }) };
    });
  }

  function carnivalFinishEvent(request) {
    const index = numberArg(request, 0, ['index', 'event_index']);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      const event = state.events[String(index)];
      if (!event) throw new GameError(311, 'Carnival event is not on the current cell');
      if (event.is_finish) throw new GameError(310, 'Carnival event already finished');
      const award = carnivalEventAwards.get(Number(event.tid));
      const grants = [];
      if (award) {
        const values = Array.isArray(award.awards) ? award.awards.map(Number) : [];
        const amount = values[0] ?? 0;
        if (amount > 0) grants.push([Number(award.res), amount]);
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => at() });
      event.is_finish = true;
      if (Number(event.tid) === 11) { state.boxes_earned = Number(state.boxes_earned ?? 0) + 1; state.boxes_left = Number(state.boxes_left ?? 0) + 1; }
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_finish_event', index, tid: event.tid });
      return { value: {}, data: codec.pack('pb_mono_finish_ev_back', {
        res: resOf(granted), use_item_list: state.use_items ?? []
      }) };
    });
  }

  function carnivalUseItem(request) {
    const tid = numberArg(request, 0, ['tid', 'item_tid']);
    if (!tid) throw new GameError(1, 'Carnival item id is missing');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      const row = (state.use_items ?? []).find(item => Number(item.tid) === tid);
      if (row) row.effect_num = Number(row.effect_num ?? 0) + 1;
      else state.use_items.push({ tid, effect_num: 1 });
      writeState(db, roleId, 'carnival', 1, state);
      return { value: { tid }, data: codec.pack('pb_mono_use_item_back', {
        res: { changes: [], is_overflow: false }, use_item: { tid, effect_num: 1 }
      }) };
    });
  }

  function carnivalAutoFlush() {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      carnivalRefreshDice(state);
      writeState(db, roleId, 'carnival', 1, state);
      return { value: {}, data: codec.pack('pb_mono_auto_flush_dice_back', {
        res: { changes: [], is_overflow: false }, dice_flush_time: Number(state.last_dice_flush ?? 0)
      }) };
    });
  }

  function carnivalBuyDice(request) {
    const count = Math.max(1, Math.min(10, numberArg(request, 0, ['count', 'num'], 1)));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      carnivalRefreshDice(state);
      const max = Number(carnivalConst?.buy_dice_max_num ?? 5);
      if (Number(state.daily_buy ?? 0) + count > max) throw new GameError(311, 'Carnival daily dice purchase limit reached');
      const level = [...carnivalLevels.values()].sort((a, b) => Number(a.tid) - Number(b.tid))[0];
      const costItem = Number(level?.item?.[0] ?? 0);
      const costNum = Number(level?.num?.[0] ?? 0);
      const gain = Number(level?.num?.[1] ?? 1);
      if (costItem > 0 && costNum > 0) consumeResources(model, [[costItem, costNum * count]], 301, { codec, now: () => at() });
      state.dice = Math.min(Number(carnivalConst?.dice_max_count ?? 60), Number(state.dice ?? 0) + gain * count);
      state.daily_buy = Number(state.daily_buy ?? 0) + count;
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_buy_dice', count });
      return { value: { count }, data: codec.pack('pb_mono_buy_dice_back', {
        res: { changes: [], is_overflow: false }, daily_flush_time: Number(state.last_daily_flush ?? 0),
        today_buy_num: Number(state.daily_buy ?? 0)
      }) };
    });
  }

  function carnivalAchieveAward(request) {
    const index = Math.max(1, numberArg(request, 0, ['index', 'tid'], 1));
    const row = [...carnivalLevels.values()].sort((a, b) => Number(a.tid) - Number(b.tid))[index - 1];
    if (!row) throw new GameError(5, 'Carnival achievement level is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      if (state.achievements.includes(index) || hasClaim(db, roleId, 'carnival_achieve', '1:' + index)) throw new GameError(310, 'Carnival achievement already claimed');
      if (Number(state.total_throw ?? 0) < Number(row.num?.[0] ?? 0)) throw new GameError(311, 'Carnival achievement progress is not enough');
      const grants = pairsOf(row.item, [row.num?.[1] ?? 1]);
      const granted = grantResources(model, requireAwards(grants, 'Carnival achievement award is not configured'),
        tables, { codec, now: () => at() });
      state.achievements.push(index);
      markClaim(db, roleId, 'carnival_achieve', '1:' + index);
      writeState(db, roleId, 'carnival', 1, state);
      return { value: { index }, data: codec.pack('pb_mono_rev_achieve_back', {
        res: resOf(granted), achieve_data: { week_throw_dice_num: Number(state.total_throw ?? 0), achieve_rev_states: idBytes(state.achievements) }
      }) };
    });
  }

  function carnivalBuild(request, upgrade = false) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      if (upgrade) {
        const buildId = numberArg(request, 0, ['build_id', 'id']);
        const build = (state.builds ?? []).find(row => Number(row.id) === buildId);
        if (!build) throw new GameError(311, 'Carnival build is not found');
        const config = carnivalBuilds.get(Number(build.tid));
        if (!config || Number(build.level) >= Number(config.max_lv)) throw new GameError(311, 'Carnival build is already at max level');
        build.level = Number(build.level) + 1;
        writeState(db, roleId, 'carnival', 1, state);
        return { value: { buildId }, data: codec.pack('pb_mono_build_handle_back', {
          res: { changes: [], is_overflow: false },
          one_build: carnivalBuildList(state).find(row => Number(row.id) === buildId)
        }) };
      }
      const tid = numberArg(request, 0, ['tid', 'build_tid']);
      const config = carnivalBuilds.get(tid);
      if (!config || !config.construct) throw new GameError(5, 'Carnival build is not configured');
      const same = (state.builds ?? []).filter(row => Number(row.tid) === tid).length;
      if (same >= Number(config.max_count ?? 0)) throw new GameError(311, 'Carnival build count limit reached');
      const build = { id: Number(state.next_build_id ?? 1), tid, level: 1, last_collect: at(), dispatch_hero: { heroes: [] } };
      state.next_build_id = Number(state.next_build_id ?? 1) + 1;
      state.builds.push(build);
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_build', tid, id: build.id });
      return { value: { buildId: build.id }, data: codec.pack('pb_mono_build_handle_back', {
        res: { changes: [], is_overflow: false },
        one_build: carnivalBuildList(state).find(row => Number(row.id) === build.id)
      }) };
    });
  }

  function carnivalBuildAward(request) {
    const buildId = numberArg(request, 0, ['build_id', 'id']);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      const build = (state.builds ?? []).find(row => Number(row.id) === buildId);
      if (!build) throw new GameError(311, 'Carnival build is not found');
      const view = carnivalBuildList(state).find(row => Number(row.id) === buildId);
      const elapsed = Math.max(0, at() - Number(build.last_collect ?? at()));
      const amount = Math.floor(elapsed * view.output / Math.max(1, view._yield));
      if (amount <= 0) throw new GameError(311, 'Carnival build has no output yet');
      const granted = grantResources(model, [[view._output_res, amount]], tables, { codec, now: () => at() });
      build.last_collect = at();
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_build_award', buildId, amount });
      return { value: { buildId, amount }, data: codec.pack('pb_mono_build_handle_back', {
        res: resOf(granted), one_build: carnivalBuildList(state).find(row => Number(row.id) === buildId)
      }) };
    });
  }

  function carnivalDevelopTech(request) {
    const tid = numberArg(request, 0, ['tid', 'tech_tid']);
    const tech = carnivalTechs.get(tid);
    if (!tech) throw new GameError(5, 'Carnival tech is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      if ((state.techs ?? []).some(row => Number(row.tid) === tid)) throw new GameError(310, 'Carnival tech already developed');
      const week = Math.floor((at() - Number(state.open_time ?? at())) / 604800) + 1;
      if (week < Number(tech.unlock_week ?? 1)) throw new GameError(311, 'Carnival tech is not unlocked yet');
      state.techs.push({ tid, start_time: at() });
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_develop_tech', tid });
      return { value: { tid }, data: codec.pack('pb_mono_req_data_back', {
        res: { changes: [], is_overflow: false }, monopoly: carnivalMonopoly(state)
      }) };
    });
  }

  function carnivalBoxAward(request) {
    const count = Math.max(1, Math.min(10, numberArg(request, 0, ['count', 'num'], 1)));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      if (Number(state.boxes_left ?? 0) < count) throw new GameError(311, 'Carnival box count is not enough');
      const libs = [...carnivalAwardLibs.values()].sort((a, b) => Number(a.tid) - Number(b.tid));
      if (!libs.length) throw new GameError(5, 'Carnival award library is not configured');
      const lib = libs[0];
      const weights = listOf(lib.num).map(Number);
      const awards = listOf(lib.award).map(Number);
      if (!weights.length || weights.length !== awards.length) throw new GameError(5, 'Carnival award library is invalid');
      const total = weights.reduce((sum, value) => sum + Math.max(0, value), 0);
      const grants = [];
      for (let index = 0; index < count; index++) {
        let roll = Number(random()) * total;
        let picked = awards[0];
        for (let slot = 0; slot < weights.length; slot++) {
          roll -= Math.max(0, weights[slot]);
          if (roll < 0) { picked = awards[slot]; break; }
        }
        const award = carnivalAwards.get(Number(picked));
        if (award && Number(award.item) > 0) grants.push([Number(award.item), 1]);
      }
      const granted = grantResources(model, grants, tables, { codec, now: () => at() });
      state.boxes_left = Number(state.boxes_left ?? 0) - count;
      writeState(db, roleId, 'carnival', 1, state);
      log({ event: 'carnival_box_award', count });
      return { value: { count }, data: codec.pack('pb_mono_req_data_back', {
        res: resOf(granted), monopoly: carnivalMonopoly(state)
      }) };
    });
  }

  function carnivalDispatch(request) {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      for (const row of request?.dispatch ?? []) {
        const build = (state.builds ?? []).find(entry => Number(entry.id) === Number(row.index) || Number(entry.tid) === Number(row.index));
        if (build) build.dispatch_hero = { heroes: row.one_dispatch?.heroes ?? [] };
      }
      writeState(db, roleId, 'carnival', 1, state);
      return { value: {}, data: codec.pack('pb_mono_build_data', { builds: carnivalBuildList(state) }) };
    });
  }

  function carnivalBuildExtra(request) {
    const buildId = Number(request?.build_id ?? 0);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'carnival', 1, carnivalState());
      const build = carnivalBuildList(state).find(row => Number(row.id) === buildId);
      if (!build) throw new GameError(311, 'Carnival build is not found');
      return { value: {}, data: codec.pack('pb_mono_build_handle_back', {
        res: { changes: [], is_overflow: false }, one_build: build
      }) };
    });
  }

  // ---- PLAY-MAGICALJOURNEY: 89901-89917 ------------------------------
  const journeyTables = explorationTables.magicalJourney ?? {};
  const journeyConst = [...(journeyTables.Const ?? new Map()).values()][0] ?? null;
  const journeySwordConfig = [...(journeyTables.Sword ?? new Map()).values()][0] ?? null;
  const journeySwordAttrs = journeyTables.SwordAttr ?? new Map();
  const journeyCountries = journeyTables.Country ?? new Map();
  const journeySubs = journeyTables.CountrySub ?? new Map();
  const journeyStars = journeyTables.CountryStar ?? new Map();
  const journeyNormalCollect = journeyTables.NormalCollect ?? new Map();
  const journeySeasonCollect = journeyTables.SeasonCollect ?? new Map();
  const journeyMissions = journeyTables.Mission ?? new Map();
  const journeyBoss = [...(journeyTables.Boss ?? new Map()).values()][0] ?? null;
  const journeyBossDays = journeyTables.BossDay ?? new Map();
  const journeyBossAwards = journeyTables.BossFightAward ?? new Map();
  const journeyChapterTasks = journeyTables.ChapterTask ?? new Map();
  const journeyEliteMissions = tables.EliteMission ?? new Map();

  // CountrySub keys are 1_000_000 + type * 100_000 + index * 10_000 + level.
  // The recovered rows run 1110001..1440015, so a type/index pair owns 15 levels.
  function journeySubTid(type, index, level) {
    return 1000000 + Number(type) * 100000 + Number(index) * 10000 + Number(level);
  }

  function journeyState() {
    return {
      main_level: 1, subs: {}, star_skills: [], sword: { use_free_times: 0, today_zero_stamp: 0, exp: 0, day_exp: 0, day: 0 },
      collect: { normal: { items: [], exp: 0, level: 1 }, season: { items: [] } },
      passed: {}, task_claims: [], star_awards: [], boss: { day: 0, fights: 0, score: 0 }
    };
  }

  function journeyPower(state) {
    let power = 0;
    const main = journeyCountries.get(10000 + Number(state.main_level ?? 1));
    for (const pair of main?.attrs ?? []) power += Number(pair?.[1] ?? 0);
    for (const [key, level] of Object.entries(state.subs ?? {})) {
      const [type, index] = key.split(':').map(Number);
      const tid = journeySubTid(type, index, level);
      const row = journeySubs.get(tid);
      for (const pair of row?.attrs ?? []) power += Number(pair?.[1] ?? 0);
    }
    return Math.max(0, power);
  }

  function journeySwordLevel(exp) {
    const rows = [...journeySwordAttrs.values()].sort((a, b) => Number(a.exp) - Number(b.exp));
    let level = 1;
    for (const row of rows) if (Number(exp) >= Number(row.exp)) level = Number(row.tid);
    return level;
  }

  function journeyPassList(state) {
    const chapters = new Map();
    for (const [key, value] of Object.entries(state.passed ?? {})) {
      const [chapter, mission] = key.split(':').map(Number);
      if (!chapters.has(chapter)) chapters.set(chapter, []);
      chapters.get(chapter).push({ mission, number: Number(value.number ?? 0), role_id_list: [] });
    }
    return [...chapters.entries()].sort((a, b) => a[0] - b[0])
      .map(([chapter, missionList]) => ({ chapter, mission_list: missionList.sort((a, b) => a.mission - b.mission) }));
  }

  function journeySubState(state, type, index) {
    state.subs ??= {};
    const key = Number(type) + ':' + Number(index);
    state.subs[key] ??= 0;
    return { key, level: Number(state.subs[key]) };
  }

  function journeySubInfo(state, type, index) {
    const sub = journeySubState(state, type, index);
    return { type: Number(type), level: sub.level, active: Buffer.alloc(0) };
  }

  function journeySword(request) {
    if (!journeySwordConfig) throw new GameError(5, 'Magical journey sword is not configured');
    const costs = pairListOf(request?.cost);
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      state.sword ??= { use_free_times: 0, today_zero_stamp: 0, exp: 0, day_exp: 0, day: 0 };
      const day = dayOf(at());
      if (Number(state.sword.day) !== day) {
        state.sword.day = day; state.sword.use_free_times = 0; state.sword.day_exp = 0;
      }
      if (Number(state.sword.use_free_times ?? 0) >= Number(journeySwordConfig.day_times ?? 0)) throw new GameError(311, 'Magical journey sword daily times reached');
      const exp = Number(journeySwordConfig.exp ?? 0);
      if (Number(state.sword.day_exp ?? 0) + exp > Number(journeySwordConfig.day_max ?? 200000)) throw new GameError(311, 'Magical journey sword exp limit reached');
      if (costs.length) consumeResources(model, costs, 301, { codec, now: () => at() });
      const granted = grantResources(model, requireAwards(awardsOf(journeySwordConfig, 'award'), 'Magical journey sword award is not configured'),
        tables, { codec, now: () => at() });
      state.sword.use_free_times = Number(state.sword.use_free_times ?? 0) + 1;
      state.sword.exp = Number(state.sword.exp ?? 0) + exp;
      state.sword.day_exp = Number(state.sword.day_exp ?? 0) + exp;
      state.sword.today_zero_stamp = day * 86400;
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_sword', exp, total: state.sword.exp });
      return { value: { exp }, data: codec.pack('pb_magical_journey_sword_rsp', {
        res: resOf(granted),
        sword: { use_free_times: state.sword.use_free_times, today_zero_stamp: state.sword.today_zero_stamp, exp_contributed: Number(state.sword.day_exp) },
        cross_sword: { sword_exp: Number(state.sword.exp), sword_level: journeySwordLevel(state.sword.exp), last_refresh_stamp: state.sword.today_zero_stamp, day_exp: Number(state.sword.day_exp) }
      }) };
    });
  }

  function journeyMainUp() {
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      const next = journeyCountries.get(10000 + Number(state.main_level ?? 1) + 1);
      if (!next) throw new GameError(311, 'Magical journey country is at max level');
      const cost = pairListOf(next.cost);
      if (cost.length) consumeResources(model, cost, 301, { codec, now: () => at() });
      state.main_level = Number(state.main_level ?? 1) + 1;
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_main_up', level: state.main_level });
      return { value: {}, data: codec.pack('pb_magical_journey_main_up_rsp', {
        journey_power: journeyPower(state), res: { changes: [], is_overflow: false }
      }) };
    });
  }

  function journeySubActive(request) {
    const type = Number(request.type ?? 0), index = Number(request.index ?? 0);
    if (type < 1 || type > 4 || index < 1 || index > 4) throw new GameError(1, 'Magical journey country sub is invalid');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      const sub = journeySubState(state, type, index);
      if (sub.level > 0) throw new GameError(310, 'Magical journey country sub already active');
      const row = journeySubs.get(journeySubTid(type, index, 1));
      if (!row) throw new GameError(5, 'Magical journey country sub is not configured');
      const cost = pairListOf(row.cost);
      if (cost.length) consumeResources(model, cost, 301, { codec, now: () => at() });
      state.subs[sub.key] = 1;
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_sub_active', type, index });
      return { value: {}, data: codec.pack('pb_magical_journey_country_sub_active_rsp', {
        res: { changes: [], is_overflow: false }, sub_info: journeySubInfo(state, type, index), journey_power: journeyPower(state)
      }) };
    });
  }

  function journeySubUp(request) {
    const type = Number(argAt(request, 0, ['type']) ?? 0), index = Number(argAt(request, 1, ['index']) ?? 0);
    if (type < 1 || type > 4 || index < 1 || index > 4) throw new GameError(1, 'Magical journey country sub is invalid');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      const sub = journeySubState(state, type, index);
      if (sub.level <= 0) throw new GameError(311, 'Magical journey country sub is not active');
      const row = journeySubs.get(journeySubTid(type, index, sub.level + 1));
      if (!row) throw new GameError(311, 'Magical journey country sub is at max level');
      const cost = pairListOf(row.cost);
      if (cost.length) consumeResources(model, cost, 301, { codec, now: () => at() });
      state.subs[sub.key] = sub.level + 1;
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_sub_up', type, index, level: sub.level + 1 });
      return { value: {}, data: codec.pack('pb_magical_journey_sub_up_rsp', {
        journey_power: journeyPower(state), res: { changes: [], is_overflow: false }, sub_info: journeySubInfo(state, type, index)
      }) };
    });
  }

  function journeySwordRecord() {
    const roleId = store.state().roleId;
    const state = store.inspect(db => readState(db, roleId, 'magical_journey', 1, journeyState()));
    return { value: {}, data: codec.pack('pb_magical_journey_sword_record_info', {
      record_list: [{ role_name: 'Local Adventurer', sword_exp: Number(state.sword?.exp ?? 0), type: 1 }]
    }) };
  }

  function journeyCollect(request, season) {
    const items = listOf(request?.items).map(row => ({ tid: Number(plainOf(row?.tid)), star: Number(plainOf(row?.star ?? 0)) }));
    if (!items.length) throw new GameError(1, 'Magical journey collect list is empty');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      state.collect ??= { normal: { items: [], exp: 0, level: 1 }, season: { items: [] } };
      if (season) {
        for (const item of items) {
          const row = journeySeasonCollect.get(item.tid);
          if (!row) throw new GameError(5, 'Magical journey season collect is not configured');
          if (!state.collect.season.items.some(entry => Number(entry.tid) === item.tid)) {
            state.collect.season.items.push({ tid: item.tid, star: item.star || 1 });
          }
        }
      } else {
        for (const item of items) {
          const row = journeyNormalCollect.get(item.tid);
          if (!row) throw new GameError(5, 'Magical journey normal collect is not configured');
          const existing = state.collect.normal.items.find(entry => Number(entry.tid) === item.tid);
          const previousStar = Number(existing?.star ?? 0);
          const nextStar = Math.max(previousStar, item.star || 1);
          if (existing) existing.star = nextStar;
          else state.collect.normal.items.push({ tid: item.tid, star: nextStar });
          if (!existing || nextStar > previousStar) {
            state.collect.normal.exp = Number(state.collect.normal.exp ?? 0) + Number(row.exp ?? 0);
          }
        }
        state.collect.normal.level = 1 + Math.floor(Number(state.collect.normal.exp ?? 0) / 100);
      }
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: season ? 'magical_journey_season_collect' : 'magical_journey_normal_collect', items: items.length });
      return { value: {}, data: codec.pack('pb_magical_journey_collect_activate_normal_rsp', {
        exp: Number(state.collect.normal.exp ?? 0), level: Number(state.collect.normal.level ?? 1), journey_power: journeyPower(state)
      }) };
    });
  }

  function journeyMissionFight(request) {
    const chapter = Number(request.chapter ?? 0), mission = Number(request.mission ?? 0);
    const tid = chapter * 10000 + mission;
    const row = journeyMissions.get(tid);
    if (!row) throw new GameError(5, 'Magical journey mission is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      const granted = grantResources(model, requireAwards(awardsOf(row, 'award'), 'Magical journey mission award is not configured'),
        tables, { codec, now: () => at() });
      const key = chapter + ':' + mission;
      state.passed[key] ??= { number: 1, role_id_list: [] };
      state.passed[key].number = Math.max(1, Number(state.passed[key].number ?? 1));
      state.passed[key].role_id_list = [];
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_mission_fight', chapter, mission });
      const missionPass = { mission, number: state.passed[key].number, role_id_list: [] };
      return { value: { chapter, mission }, data: codec.pack('pb_magical_journey_mission_multi_fight_back', {
        fight_info: {
          mission_info: {
            chapter, mission, elite_star_bin: Buffer.alloc(0), task_award_bin: Buffer.alloc(0),
            pass_stamp: at(), settle_rank: 0, task_progress: { settle_chapter_tid: 0, note_bin: Buffer.alloc(0) }
          },
          res: resOf(granted), normal_award: [], elite_award: [], mission_pass: missionPass
        },
        report_list: []
      }) };
    });
  }

  function journeyStarAward(request) {
    const missionTid = Number(argAt(request, 0, ['mission', 'mission_tid']) ?? 0);
    const row = journeyMissions.get(missionTid);
    if (!row) throw new GameError(5, 'Magical journey mission is not configured');
    if (!Number(row.elite_mission)) throw new GameError(5, 'Magical journey mission has no elite stage');
    const key = String(missionTid);
    const missionIndex = Number(missionTid) % 10000;
    const passedKey = Number(row.chapter) + ':' + missionIndex;
    const passed = store.inspect(db => readState(db, store.state().roleId, 'magical_journey', 1, journeyState()).passed[passedKey]);
    if (!passed || Number(passed.number ?? 0) <= 0) throw new GameError(311, 'Magical journey elite mission is not passed');
    const elite = journeyEliteMissions.get(Number(row.elite_mission));
    if (!elite) throw new GameError(5, 'Magical journey elite mission award is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      if (state.star_awards.includes(key) || hasClaim(db, roleId, 'magical_journey_star', key)) throw new GameError(310, 'Magical journey elite star award already claimed');
      const granted = grantResources(model, requireAwards(awardsOf(elite, 'award'), 'Magical journey elite award is not configured'),
        tables, { codec, now: () => at() });
      state.star_awards.push(key);
      markClaim(db, roleId, 'magical_journey_star', key);
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_star_award', missionTid });
      return { value: { missionTid }, data: codec.pack('pb_magical_journey_task_rev_back', {
        task_award_bin: Buffer.alloc(0), res: resOf(granted)
      }) };
    });
  }

  function journeyChapterTaskProgress(state, task) {
    const chapter = Number(task.belong_chapter ?? 0);
    const passed = Object.entries(state.passed ?? {}).filter(([key]) => Number(key.split(':')[0]) === chapter).length;
    switch (Number(task.task_type)) {
      case 12801: return passed;
      case 12808: return Object.keys(state.passed ?? {}).length;
      case 12806: return state.star_awards.length;
      default: return null;
    }
  }

  function journeyTaskAward(request, progressResponse = false) {
    const taskTid = Number(argAt(request, 0, ['task_tid', 'tid']) ?? 0);
    const task = journeyChapterTasks.get(taskTid);
    if (!task) throw new GameError(5, 'Magical journey chapter task is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      const key = String(taskTid);
      if (state.task_claims.includes(key) || hasClaim(db, roleId, 'magical_journey_task', key)) throw new GameError(310, 'Magical journey chapter task already claimed');
      const progress = journeyChapterTaskProgress(state, task);
      if (progress == null) throw new GameError(5, 'Magical journey chapter task rule is not recovered');
      if (progress < Number(task.task_count ?? 0)) throw new GameError(311, 'Magical journey chapter task is not finished');
      const granted = grantResources(model, requireAwards(awardsOf(task, 'award'), 'Magical journey chapter task award is not configured'),
        tables, { codec, now: () => at() });
      state.task_claims.push(key);
      markClaim(db, roleId, 'magical_journey_task', key);
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_task_award', taskTid });
      return { value: { taskTid }, data: codec.pack(progressResponse ? 'pb_magical_journey_progress_rev_back' : 'pb_magical_journey_task_rev_back', progressResponse
        ? { progress_award_bin: Buffer.alloc(0), res: resOf(granted) }
        : { task_award_bin: Buffer.alloc(0), res: resOf(granted) }) };
    });
  }

  function journeyBossFight(request) {
    const fightTid = Number(request.fight_tid ?? 0), times = Math.max(1, Math.min(8, Number(request.times ?? 1)));
    const row = journeyBossDays.get(fightTid)
      ?? [...journeyBossDays.values()].find(candidate => Number(candidate.fight_tid) === fightTid);
    if (!row) throw new GameError(5, 'Magical journey boss is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      state.boss ??= { day: 0, fights: 0, score: 0 };
      const day = dayOf(at());
      if (Number(state.boss.day) !== day) state.boss = { day, fights: 0, score: 0 };
      const maxTimes = Number(journeyBoss?.day_times ?? 8);
      if (Number(state.boss.fights ?? 0) + times > maxTimes) throw new GameError(311, 'Magical journey boss daily times reached');
      const score = times * 1000 * Math.max(1, journeySwordLevel(state.sword?.exp ?? 0));
      const awardRow = [...journeyBossAwards.values()].find(candidate => {
        const range = listOf(candidate.score_range).map(Number);
        return score >= Number(range[0] ?? 0) && score <= Number(range[1] ?? Number.MAX_SAFE_INTEGER);
      });
      const grants = awardsOf(awardRow, 'award').map(([tid, count]) => [tid, count * times]);
      const granted = grantResources(model, grants, tables, { codec, now: () => at() });
      state.boss.fights = Number(state.boss.fights ?? 0) + times;
      state.boss.score = Number(state.boss.score ?? 0) + score;
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_boss_fight', fightTid, times, score });
      return { value: { fightTid }, data: codec.pack('pb_magical_journey_boss_fight_back', {
        boss_info: { fight_times: state.boss.fights, refresh_time: day * 86400, score: state.boss.score },
        res: resOf(granted), this_score: score, rank: 0
      }) };
    });
  }

  function journeyStarSkill(request) {
    const tid = Number(argAt(request, 0, ['tid', 'star_tid']) ?? 0);
    const row = journeyStars.get(tid);
    if (!row) throw new GameError(5, 'Magical journey star skill is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'magical_journey', 1, journeyState());
      if (state.star_skills.includes(tid)) throw new GameError(310, 'Magical journey star skill already active');
      consumeResources(model, [[Number(row.cost_id), Number(row.cost_num)]], 301, { codec, now: () => at() });
      state.star_skills.push(tid);
      writeState(db, roleId, 'magical_journey', 1, state);
      log({ event: 'magical_journey_star_skill', tid });
      return { value: { tid }, data: codec.pack('pb_magical_journey_star_activate_rsp', {
        res: { changes: [], is_overflow: false }, journey_power: journeyPower(state),
        skill_info: { page: Number(row.page ?? 1), active: Buffer.from([1]) }
      }) };
    });
  }

  function journeyLoginAfter() {
    const roleId = store.state().roleId;
    const state = store.inspect(db => readState(db, roleId, 'magical_journey', 1, journeyState()));
    return { value: {}, data: codec.pack('pb_magical_journey_login_after_back', {
      simple_pass_list: journeyPassList(state)
    }) };
  }

  function journeyPowerInfo() {
    const roleId = store.state().roleId;
    const state = store.inspect(db => readState(db, roleId, 'magical_journey', 1, journeyState()));
    return { value: {}, data: codec.pack('pb_magical_journey_open_handle', {
      season_info: { season: 1, season_start_time: 0, season_end_time: 0, settle_boss_time: 0 },
      mission_info: { chapter: 0, mission: 0, elite_star_bin: Buffer.alloc(0), task_award_bin: Buffer.alloc(0), pass_stamp: 0, settle_rank: 0, task_progress: { settle_chapter_tid: 0, note_bin: Buffer.alloc(0) } },
      country_info: { main_level: Number(state.main_level ?? 1), sub: Object.keys(state.subs ?? {}).map(key => journeySubInfo(state, ...key.split(':').map(Number))), star_skill_active: [] }
    }) };
  }

  function journeyLogin(state) {
    return {
      season_info: { season: 1, season_start_time: 0, season_end_time: 0, settle_boss_time: 0 },
      mission_info: {
        chapter: 0, mission: 0, elite_star_bin: Buffer.alloc(0),
        task_award_bin: idBytes(state.task_claims ?? []), pass_stamp: 0, settle_rank: 0,
        task_progress: { settle_chapter_tid: 0, note_bin: Buffer.alloc(0) }
      },
      country_info: {
        main_level: Number(state.main_level ?? 1),
        sub: Object.keys(state.subs ?? {}).map(key => journeySubInfo(state, ...key.split(':').map(Number))),
        star_skill_active: (state.star_skills ?? []).map(tid => ({
          page: Number(journeyStars.get(Number(tid))?.page ?? 1), active: Buffer.from([1])
        }))
      },
      role_season_info: { season: 1, settled: false }
    };
  }

  // ---- PLAY-GRANDTOURER: 87801-87805 --------------------------------
  const tourerConst = [...(explorationTables.grandTourer?.Const ?? new Map()).values()][0] ?? null;
  const weekendConst = [...(explorationTables.weekendBonus?.Const ?? new Map()).values()][0] ?? null;
  const weekendTasks = explorationTables.weekendBonus?.WeekendBonus ?? new Map();
  const tourerProgressAwards = explorationTables.weekendBonus?.ProgressAward ?? new Map();

  function tourerState() {
    return { day: 0, play_times: 0, task_claims: [], progress_claims: [], speed: Number(tourerConst?.default_speed ?? 20) };
  }

  function tourerToken(request) {
    if (!tourerConst) throw new GameError(5, 'Grand tourer constants are not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'grand_tourer', 1, tourerState());
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

  function tourerTaskAward(request) {
    const index = Math.max(1, numberArg(request, 0, ['tid', 'index'], 1));
    const row = weekendTasks.get(index);
    if (!row) throw new GameError(5, 'Grand tourer task is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'grand_tourer', 1, tourerState());
      const key = String(index);
      if (state.task_claims.includes(key) || hasClaim(db, roleId, 'grand_tourer_task', key)) throw new GameError(310, 'Grand tourer task already claimed');
      const grants = pairsOf(row.award, row.count);
      const granted = grantResources(model, requireAwards(grants, 'Grand tourer task award is not configured'),
        tables, { codec, now: () => at() });
      state.task_claims.push(key);
      markClaim(db, roleId, 'grand_tourer_task', key);
      writeState(db, roleId, 'grand_tourer', 1, state);
      log({ event: 'grand_tourer_task', index });
      return { value: { index }, data: codec.pack('pb_grand_tourer_task_back', {
        res: resOf(granted), task_bin: idBytes(state.task_claims),
        task_award_time: at(), online_day_index: 1
      }) };
    });
  }

  function tourerExchange(request) {
    const count = Math.max(1, Math.min(99, numberArg(request, 0, ['count', 'num'], 1)));
    const costItem = Number(weekendConst?.exchange_cost ?? 0);
    const rewardItem = Number(weekendConst?.award_item ?? tourerConst?.award_item ?? 0);
    const rewardCount = Number(weekendConst?.award_num ?? 0);
    if (!costItem || !rewardItem || !rewardCount) throw new GameError(5, 'Grand tourer exchange is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      consumeResources(model, [[costItem, count]], 301, { codec, now: () => at() });
      const granted = grantResources(model, [[rewardItem, rewardCount * count]], tables, { codec, now: () => at() });
      log({ event: 'grand_tourer_exchange', count });
      return { value: { count }, data: codec.pack('pb_res_to_client', resOf(granted)) };
    });
  }

  function tourerDistanceAward(request) {
    const progress = Math.max(1, numberArg(request, 0, ['progress', 'index'], 1));
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'grand_tourer', 1, tourerState());
      state.play_times = Math.max(Number(state.play_times ?? 0), progress);
      const rows = [...tourerProgressAwards.values()].sort((a, b) => Number(a.need_progress) - Number(b.need_progress));
      const grants = [];
      const claimed = [];
      for (const row of rows) {
        const key = String(row.tid);
        if (state.progress_claims.includes(key) || hasClaim(db, roleId, 'grand_tourer_progress', key)) continue;
        if (Number(state.play_times) < Number(row.need_progress ?? 0)) continue;
        grants.push([Number(row.item), Number(row.count)]);
        claimed.push(key);
      }
      if (!claimed.length) {
        const next = rows.find(row => !state.progress_claims.includes(String(row.tid))
          && !hasClaim(db, roleId, 'grand_tourer_progress', String(row.tid))
          && Number(state.play_times) < Number(row.need_progress ?? 0));
        if (next) throw new GameError(311, 'Grand tourer distance progress is not enough');
        throw new GameError(310, 'Grand tourer distance award already claimed');
      }
      const granted = grantResources(model, requireAwards(grants, 'Grand tourer distance award is not configured'),
        tables, { codec, now: () => at() });
      for (const key of claimed) {
        state.progress_claims.push(key);
        markClaim(db, roleId, 'grand_tourer_progress', key);
      }
      writeState(db, roleId, 'grand_tourer', 1, state);
      log({ event: 'grand_tourer_distance_award', progress: state.play_times, tiers: claimed.length });
      return { value: { progress: state.play_times }, data: codec.pack('pb_res_to_client', resOf(granted)) };
    });
  }

  function tourerEnhance(request) {
    const count = Math.max(1, Math.min(20, numberArg(request, 0, ['count', 'num'], 1)));
    const item = Number(tourerConst?.award_item ?? weekendConst?.award_item ?? 0);
    const cost = Number(weekendConst?.award_num ?? 0);
    const add = Number(tourerConst?.speed_add ?? 5);
    const max = Number(tourerConst?.max_speed ?? 100);
    if (!item || !cost) throw new GameError(5, 'Grand tourer enhance is not configured');
    const roleId = store.state().roleId;
    return store.transaction((model, db) => {
      const state = readState(db, roleId, 'grand_tourer', 1, tourerState());
      const current = Number(state.speed ?? tourerConst?.default_speed ?? 20);
      const allowed = Math.max(0, Math.min(count, Math.floor((max - current) / Math.max(1, add))));
      if (allowed <= 0) throw new GameError(311, 'Grand tourer speed is already at max');
      consumeResources(model, [[item, cost * allowed]], 301, { codec, now: () => at() });
      state.speed = current + add * allowed;
      writeState(db, roleId, 'grand_tourer', 1, state);
      log({ event: 'grand_tourer_enhance', speed: state.speed });
      return { value: { speed: state.speed }, data: codec.pack('pb_res_to_client', { changes: [], is_overflow: false }) };
    });
  }

  // ---- Login synchronization -------------------------------------------
  // HomePuzzle, Homeland, ThemeTreasure, RadishFarm and ExperienceAct ride in
  // module 92 entries; the remaining G1 families own dedicated modules. Every
  // builder below publishes only state this service already persists for the
  // implemented commands, so a restart never fabricates progress.
  function applyLoginEntry(activity, actId, payload, loginAt) {
    activity.act_list ??= [];
    let entry = activity.act_list.find(candidate => Number(candidate?.state_data?.act_id) === Number(actId));
    if (!entry) {
      entry = { state_data: { act_id: Number(actId) }, module_login_data: '' };
      activity.act_list.push(entry);
    }
    entry.state_data ??= {};
    entry.state_data.act_id = Number(actId);
    entry.state_data.cur_state_id = 50;
    entry.state_data.history_time = Array.isArray(entry.state_data.history_time) ? entry.state_data.history_time : [];
    const running = entry.state_data.history_time.find(item => Number(item?.state_id) === 50);
    if (running) running.enter_time = String(loginAt);
    else entry.state_data.history_time.push({ state_id: 50, enter_time: String(loginAt) });
    entry.module_login_data = wrapEtfBinary(payload).toString('base64');
  }

  function runningActFrameIds(types, activity, loginAt) {
    const result = [];
    for (const [actId, row] of tables?.ActFrameAct ?? []) {
      if (!types.includes(Number(row.type))) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(Number(actId), null, activity, loginAt)) continue;
      result.push(Number(actId));
    }
    return result.sort((left, right) => left - right);
  }

  function runningActivityIds(func, activity, loginAt) {
    const result = [];
    for (const [actId, row] of tables?.Activity ?? []) {
      if (Number(row.func) !== Number(func)) continue;
      if (calendar?.isActivityRunning && !calendar.isActivityRunning(Number(actId), null, activity, loginAt)) continue;
      result.push(Number(actId));
    }
    return result.sort((left, right) => left - right);
  }

  function themeLogin(state, actTid) {
    const { config } = themeConfig(actTid);
    const claimIds = prefix => (state.claims ?? [])
      .filter(claim => String(claim).startsWith(prefix))
      .map(claim => Number(String(claim).slice(prefix.length)))
      .filter(Number.isSafeInteger);
    return {
      theme_treasure: {
        free_times: Number(state.free_times ?? 0),
        step: Number(state.step ?? 0),
        challenge: {
          award_personal_tasks: idBytes(claimIds('challenge:')),
          award_server_tasks: idBytes(claimIds('server:')),
          award_turn: idBytes(claimIds('turn:'))
        },
        buy_limit_info: { refresh_time: 0, buy_num_list: [] },
        time_stamp: 0,
        day_award: idBytes(state.day_award ?? []),
        exchange: themeExchangeView(state, config),
        award_list: [],
        dice_seq: (state.dice_seq ?? []).map(Number),
        dice_group: 0,
        box_num: (state.boxes ?? []).length,
        normal_num: 0,
        version_award: idBytes(state.version_award ?? []),
        last_login_day: Number(state.last_login_day ?? 0)
      },
      server_step: Number(state.step ?? 0)
    };
  }

  function radishRole(state, actTid) {
    return {
      cells: radishCells(state, actTid),
      last_refresh_stamp: Number(state.help_day ?? 0) * DAY_SECONDS,
      help_times: Number(state.help_times ?? 0),
      gifts: Object.values(state.gifts ?? {}).map(gift => ({
        gift_tid: Number(gift.gift_tid), times: Number(gift.times ?? 0),
        role_select: { recharge_id: Number(gift.gift_tid), select_idx: 0 }
      })),
      harvest_num: Number(state.harvest_num ?? 0),
      visit_id: Number(state.visit_id ?? 0),
      day_help_roles: []
    };
  }

  function experienceLogin(state, actTid) {
    const act = experienceAct(state, actTid);
    return {
      area_list: [{
        act_tid: Number(actTid), area_list: experienceAreas(act),
        begin_time: 0, end_time: 0, go_count: Number(act.go_count ?? 0)
      }]
    };
  }

  function synchronizeLogin(activity, loginAt = at()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    activity.act_list ??= [];
    const stamp = seconds(loginAt);
    const roleId = Number(store.state().roleId);
    const activityIds = [];
    const modules = new Map();
    const syncActivity = (actId, schema, build) => {
      const payload = store.inspect(db => codec.pack(schema, build(db)));
      applyLoginEntry(activity, actId, payload, stamp);
      activityIds.push(actId);
    };

    for (const actId of runningActFrameIds([1080, 1090], activity, stamp)) {
      syncActivity(actId, 'pb_home_puzzle_act_data', db =>
        puzzleActData(readState(db, roleId, 'home_puzzle', actId, puzzleState(actId))));
    }
    for (const actId of runningActFrameIds([1085, 1086, 1087], activity, stamp)) {
      syncActivity(actId, 'pb_homeland_act_role_data', db =>
        homelandActInfo(readState(db, roleId, 'homeland_act', actId, homelandState()), actId));
    }
    for (const actId of runningActivityIds(63, activity, stamp)) {
      syncActivity(actId, 'pb_theme_treasure_hunt_login', db =>
        themeLogin(readState(db, roleId, 'theme_treasure', actId, themeState()), actId));
    }
    for (const actId of runningActivityIds(84, activity, stamp)) {
      syncActivity(actId, 'pb_radish_farm_role', db =>
        radishRole(readState(db, roleId, 'radish_farm', actId, radishState()), actId));
    }
    for (const actId of runningActivityIds(100, activity, stamp)) {
      syncActivity(actId, 'pb_experience_act_data', db =>
        experienceLogin(readState(db, roleId, 'experience_act', actId, experienceState()), actId));
    }

    const built = store.transaction((model, db) => {
      const hunt = readState(db, roleId, 'treasure_hunt', 1, huntState());
      const huntPayload = codec.pack('pb_treasure_hunt_fun_open_ret', {
        role_data: huntRole(hunt), map_data: huntMap(hunt)
      });
      writeState(db, roleId, 'treasure_hunt', 1, hunt);

      const tourer = readState(db, roleId, 'grand_tourer', 1, tourerState());
      const funcRows = [...(explorationTables.weekendBonus?.Func ?? new Map()).values()]
        .sort((left, right) => Number(left.tid) - Number(right.tid));
      const weekend = codec.pack('pb_weekend_bonus', {
        rev_day: dayOf(stamp), seq_num: 1, func_tid: 2, end_time: stamp + 7 * DAY_SECONDS,
        total_play_count: Number(tourer.play_times ?? 0), today_play_count: 0, play_ref_time: 0,
        reward_bin: idBytes(tourer.task_claims ?? []), active_progress: 0, active_ref_time: 0
      });
      const funcPayloads = funcRows.map(row => Number(row.tid) === 2
        ? codec.pack('pb_grand_tourer', {
          task_award: idBytes(tourer.task_claims ?? []),
          distance_award: idBytes(tourer.progress_claims ?? []),
          max_distance: Number(tourer.play_times ?? 0), online_day_index: 1, version: 1
        })
        : codec.pack(row.func_pb, {}));

      const journey = readState(db, roleId, 'magical_journey', 1, journeyState());
      const journeyPayload = codec.pack('pb_magical_journey_login', journeyLogin(journey));

      const carnival = readState(db, roleId, 'carnival', 1, carnivalState());
      carnivalRefreshDice(carnival);
      writeState(db, roleId, 'carnival', 1, carnival);
      const carnivalPayload = codec.pack('pb_monopoly', carnivalMonopoly(carnival));

      const dream = readState(db, roleId, 'dream', 1, dreamState());
      const dreamPayload = codec.pack('pb_dream_role', dreamRole(dream));

      return { huntPayload, weekend, funcPayloads, journeyPayload, carnivalPayload, dreamPayload };
    });
    modules.set(136, built.huntPayload);
    modules.set(145, [built.weekend, ...built.funcPayloads]);
    modules.set(155, built.journeyPayload);
    modules.set(168, built.carnivalPayload);
    modules.set(519, built.dreamPayload);

    if (activityIds.length || modules.size) {
      log({ event: 'exploration_login_synchronized', actIds: activityIds, modules: [...modules.keys()] });
    }
    return { activityIds, modules };
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
  define(11501, 'homeland_act', 'PLAY-HOMELANDACT', 'select_hero', 'pb_homeland_act_select_hero_req', 'pb_homeland_act_select_hero_rsp', homelandSelectHero);
  define(11502, 'homeland_act', 'PLAY-HOMELANDACT', 'task_award', 'pb_homeland_act_task_award_req', 'pb_homeland_act_task_award_rsp', homelandTaskAward);
  define(11503, 'homeland_act', 'PLAY-HOMELANDACT', 'decorate', 'pb_homeland_act_decorate_req', 'pb_homeland_act_decorate_rsp', homelandDecorate);
  define(11505, 'homeland_act', 'PLAY-HOMELANDACT', 'clear_room', 'pb_homeland_act_clear_room_req', 'pb_homeland_act_clear_room_rsp', homelandClearRoom);

  // PLAY-CARNIVAL (#153)
  define(43003, 'carnival', 'PLAY-CARNIVAL', 'use_item', null, 'pb_mono_use_item_back', carnivalUseItem);
  define(43006, 'carnival', 'PLAY-CARNIVAL', 'throw_dice', null, 'pb_mono_throw_dice_back', carnivalThrow);
  define(43008, 'carnival', 'PLAY-CARNIVAL', 'touch_event', null, 'pb_mono_finish_ev_back', carnivalTouch);
  define(43009, 'carnival', 'PLAY-CARNIVAL', 'finish_event', null, 'pb_mono_finish_ev_back', carnivalFinishEvent);
  define(43010, 'carnival', 'PLAY-CARNIVAL', 'auto_flush_dice', null, 'pb_mono_auto_flush_dice_back', carnivalAutoFlush);
  define(43014, 'carnival', 'PLAY-CARNIVAL', 'buy_dice', null, 'pb_mono_buy_dice_back', carnivalBuyDice);
  define(43016, 'carnival', 'PLAY-CARNIVAL', 'latest_data', null, 'pb_mono_req_data_back', carnivalLatest);
  define(43017, 'carnival', 'PLAY-CARNIVAL', 'achieve_award', null, 'pb_mono_rev_achieve_back', carnivalAchieveAward);
  define(43018, 'carnival', 'PLAY-CARNIVAL', 'build', null, 'pb_mono_build_handle_back', request => carnivalBuild(request, false));
  define(43019, 'carnival', 'PLAY-CARNIVAL', 'build_up_level', null, 'pb_mono_build_handle_back', request => carnivalBuild(request, true));
  define(43020, 'carnival', 'PLAY-CARNIVAL', 'build_award', null, 'pb_mono_build_handle_back', carnivalBuildAward);
  define(43021, 'carnival', 'PLAY-CARNIVAL', 'develop_tech', null, 'pb_mono_req_data_back', carnivalDevelopTech);
  define(43022, 'carnival', 'PLAY-CARNIVAL', 'build_dispatch', 'pb_mono_dispatch_req', 'pb_mono_build_data', carnivalDispatch);
  define(43023, 'carnival', 'PLAY-CARNIVAL', 'box_award', null, 'pb_mono_req_data_back', carnivalBoxAward);
  define(43024, 'carnival', 'PLAY-CARNIVAL', 'build_extra', 'pb_mono_build_handle_req', 'pb_mono_build_handle_back', carnivalBuildExtra);

  // PLAY-THEMETREASURE (#154)
  define(76501, 'theme_treasure', 'PLAY-THEMETREASURE', 'hunt', 'pb_theme_treasure_hunt_req', 'pb_theme_treasure_hunt_rsp', themeHunt);
  define(76502, 'theme_treasure', 'PLAY-THEMETREASURE', 'challenge', 'pb_theme_treasure_challenge_req', 'pb_res_to_client', request => themeChallenge(request, false));
  define(76503, 'theme_treasure', 'PLAY-THEMETREASURE', 'server_challenge', null, 'pb_theme_treasure_server_rsp', request => themeServerQuery(request));
  define(76504, 'theme_treasure', 'PLAY-THEMETREASURE', 'exchange', 'pb_theme_treasure_exchange_req', 'pb_theme_treasure_exchange_rsp', themeExchange);
  define(76505, 'theme_treasure', 'PLAY-THEMETREASURE', 'challenge_turn', 'pb_theme_treasure_challenge_turn_req', 'pb_res_to_client', request => themeChallenge(request, true));
  define(76506, 'theme_treasure', 'PLAY-THEMETREASURE', 'target', null, 'pb_theme_treasure_server_rsp', request => themeServerQuery(request));
  define(76507, 'theme_treasure', 'PLAY-THEMETREASURE', 'task_award', null, 'pb_res_to_client', request => themeChallenge(themeEtfRequest(request), false));
  define(76508, 'theme_treasure', 'PLAY-THEMETREASURE', 'turn_award', null, 'pb_res_to_client', request => themeChallenge(themeEtfRequest(request), true));
  define(76509, 'theme_treasure', 'PLAY-THEMETREASURE', 'server_award', null, 'pb_res_to_client', themeServerAward);
  define(76510, 'theme_treasure', 'PLAY-THEMETREASURE', 'special_award', null, null);
  define(76511, 'theme_treasure', 'PLAY-THEMETREASURE', 'daily_award', null, null);
  define(76512, 'theme_treasure', 'PLAY-THEMETREASURE', 'server', null, 'pb_theme_treasure_server_rsp', request => themeServerQuery(request));

  // PLAY-MINIGAME (#155)
  define(83701, 'mini_game', 'PLAY-MINIGAME', 'settle', 'pb_mini_game_settle_req', 'pb_mini_game_settle_rsp', miniSettle);
  define(83702, 'mini_game', 'PLAY-MINIGAME', 'enter', 'pb_mini_game_enter_req', 'pb_mini_game_enter_rsp', miniEnter);
  define(83703, 'mini_game', 'PLAY-MINIGAME', 'slot_machine_retry', null, 'pb_mini_game_slot_machine', miniSlotRetry);
  define(83704, 'mini_game', 'PLAY-MINIGAME', 'handle', 'pb_mini_game_handle_req', 'pb_mini_game_handle_rsp', miniHandle);

  // PLAY-TREASUREHUNT (#156)
  define(85601, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'hunt', null, 'pb_treasure_hunt_ret_all', treasureHunt);
  define(85605, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'buy_shovel', null, 'pb_treasure_hunt_ret_all', treasureHuntBuy);
  define(85606, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'compose', 'pb_treasure_hunt_compose_req', 'pb_treasure_hunt_compose_ret', request => treasureHuntCompose(request, false));
  define(85607, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'auto_compose', null, 'pb_treasure_hunt_compose_ret', request => treasureHuntCompose(request, true));
  define(85608, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'delete_shovel', null, 'pb_treasure_hunt_delete_ret', treasureHuntDelete);
  define(85609, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'exchange_shovel', 'pb_treasure_hunt_exchange_req', 'pb_treasure_hunt_ret_all', treasureHuntExchange);
  define(85610, 'treasure_hunt', 'PLAY-TREASUREHUNT', 'refresh', null, 'pb_treasure_hunt_refresh_ret', treasureHuntRefresh);

  // PLAY-GRANDTOURER (#157)
  define(87801, 'grand_tourer', 'PLAY-GRANDTOURER', 'get_token', null, 'pb_res_to_client', tourerToken);
  define(87802, 'grand_tourer', 'PLAY-GRANDTOURER', 'task_award', null, 'pb_grand_tourer_task_back', tourerTaskAward);
  define(87803, 'grand_tourer', 'PLAY-GRANDTOURER', 'exchange_token', null, 'pb_res_to_client', tourerExchange);
  define(87804, 'grand_tourer', 'PLAY-GRANDTOURER', 'distance_award', null, 'pb_res_to_client', tourerDistanceAward);
  define(87805, 'grand_tourer', 'PLAY-GRANDTOURER', 'enhance', null, 'pb_res_to_client', tourerEnhance);

  // PLAY-DREAM (#158)
  define(88001, 'dream', 'PLAY-DREAM', 'finish_event', 'pb_dream_finish_event_req', 'pb_dream_fight_event_rsp', dreamFinishEvent);
  define(88002, 'dream', 'PLAY-DREAM', 'day_award', null, 'pb_dream_award_rsp', dreamDayAward);
  define(88003, 'dream', 'PLAY-DREAM', 'week_finish_award', null, 'pb_dream_award_rsp', dreamWeekAward);
  define(88004, 'dream', 'PLAY-DREAM', 'all_finish_award', null, 'pb_dream_award_rsp', dreamMonthAward);
  define(88005, 'dream', 'PLAY-DREAM', 'finish_task', null, 'pb_dream_award_rsp');
  define(88006, 'dream', 'PLAY-DREAM', 'collect_award', null, 'pb_dream_award_rsp', dreamCollectAward);
  define(88007, 'dream', 'PLAY-DREAM', 'box_award', null, 'pb_dream_award_rsp');
  define(88008, 'dream', 'PLAY-DREAM', 'npc_lineup', null, 'pb_dream_npc_lineup_rsp', dreamNpcLineup);
  define(88009, 'dream', 'PLAY-DREAM', 'single_collect_award', null, 'pb_dream_award_rsp', dreamSingleCollect);
  define(88010, 'dream', 'PLAY-DREAM', 'refresh_event', null, 'pb_dream_refresh_event_rsp', dreamRefreshEvent);

  // PLAY-MAGICALJOURNEY (#159)
  define(89901, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'sword', 'pb_magical_journey_sword_req', 'pb_magical_journey_sword_rsp', journeySword);
  define(89902, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'country_main_up', null, 'pb_magical_journey_main_up_rsp', journeyMainUp);
  define(89903, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'country_sub_active', 'pb_magical_journey_country_sub_active_req', 'pb_magical_journey_country_sub_active_rsp', journeySubActive);
  define(89904, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'country_sub_up', null, 'pb_magical_journey_sub_up_rsp', journeySubUp);
  define(89905, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'sword_record', null, 'pb_magical_journey_sword_record_info', journeySwordRecord);
  define(89906, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'activate_normal_collect', 'pb_magical_journey_collect_activate_req', 'pb_magical_journey_collect_activate_normal_rsp', request => journeyCollect(request, false));
  define(89907, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'activate_season_collect', 'pb_magical_journey_collect_activate_req', 'pb_magical_journey_collect_activate_normal_rsp', request => journeyCollect(request, true));
  define(89908, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'mission_star_award', null, 'pb_magical_journey_task_rev_back', journeyStarAward);
  define(89909, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'mission_task_award', null, 'pb_magical_journey_task_rev_back', request => journeyTaskAward(request, false));
  define(89910, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'mission_multi_fight', 'pb_magical_journey_mission_fight_req', 'pb_magical_journey_mission_multi_fight_back', journeyMissionFight);
  define(89911, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'boss_multi_fight', 'pb_magical_journey_boss_fight_req', 'pb_magical_journey_boss_fight_back', journeyBossFight);
  define(89912, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'chapter_progress_award', null, 'pb_magical_journey_progress_rev_back', request => journeyTaskAward(request, true));
  define(89913, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'node_rank_award', null, null);
  define(89914, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'mission_pass_info', null, 'pb_magical_journey_login_after_back', journeyLoginAfter);
  define(89915, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'star_skill_active', null, 'pb_magical_journey_star_activate_rsp', journeyStarSkill);
  define(89916, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'power', null, 'pb_magical_journey_open_handle', journeyPowerInfo);
  define(89917, 'magical_journey', 'PLAY-MAGICALJOURNEY', 'login_after', null, 'pb_magical_journey_login_after_back', journeyLoginAfter);

  // PLAY-PETACTIVITY (#160)
  define(90501, 'pet_activity', 'PLAY-PETACTIVITY', 'select_pet', 'pb_req_pet_act_select_pet', 'pb_pet_act_player', petSelect);
  define(90502, 'pet_activity', 'PLAY-PETACTIVITY', 'claim_fight_rewards', 'pb_req_pet_act_daily_reward', 'pb_pet_act_flush', petClaimFight);
  define(90503, 'pet_activity', 'PLAY-PETACTIVITY', 'claim_likability_rewards', 'pb_req_pet_act_claim_likability_rewards', 'pb_pet_act_flush', petClaimFavor);
  define(90504, 'pet_activity', 'PLAY-PETACTIVITY', 'cure', 'pb_req_pet_act_cure', 'pb_res_pet_act_cure', request => petCure(request, false));
  define(90505, 'pet_activity', 'PLAY-PETACTIVITY', 'finish_cure', 'pb_req_pet_act_cure', 'pb_res_pet_act_cure', request => petCure(request, true));
  define(90506, 'pet_activity', 'PLAY-PETACTIVITY', 'daily_vitality_rewards', null, 'pb_rev_pet_vitality_award_ret', petDailyVitality);
  define(90507, 'pet_activity', 'PLAY-PETACTIVITY', 'exchange', null, 'pb_pet_exchange_ret', petExchange);

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
    synchronizeLogin,
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
