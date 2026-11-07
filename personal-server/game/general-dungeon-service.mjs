import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  generalDungeonBoxAwards,
  generalDungeonEventKind,
  generalDungeonEventsForLevel,
  generalDungeonLevelScenes,
  generalDungeonNextEvents,
  readGeneralDungeonTables
} from '../config/general-dungeon-tables.mjs';

// GeneralDungeonCmd.lua maps these eight client methods onto seven numeric
// commands. 78102/104/107 use ETF scalar arguments; the others use protobuf.
const COMMAND_EXECUTE_EVENT = 78101;
const COMMAND_GET_DATA = 78102;
const COMMAND_ENTER_LEVEL = 78103;
const COMMAND_CLOSE_LEVEL = 78104;
const COMMAND_ACTIVATE_EVENTS = 78105;
const COMMAND_SYNC_MAP = 78106;
const COMMAND_USE_PROP = 78107;
const SUPPORTED = [
  COMMAND_EXECUTE_EVENT,
  COMMAND_GET_DATA,
  COMMAND_ENTER_LEVEL,
  COMMAND_CLOSE_LEVEL,
  COMMAND_ACTIVATE_EVENTS,
  COMMAND_SYNC_MAP,
  COMMAND_USE_PROP
];

const CODE_INVALID = 1;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;
const DEFAULT_DUNGEON_ID = 1;

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function scalar(input, label) {
  const value = Array.isArray(input) ? input[0] : input;
  return integer(value, 1, Number.MAX_SAFE_INTEGER, label);
}

function iso(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function fogToBase64(value) {
  if (value === undefined || value === null || value.length === 0) return '';
  // GameCodec materializes protobuf bytes as base64 strings; direct service
  // callers may pass a Buffer. Keep those two representations distinct.
  if (typeof value === 'string') return value;
  return Buffer.from(value).toString('base64');
}

function fogFromBase64(value) {
  return value ? Buffer.from(value, 'base64') : Buffer.alloc(0);
}

function emptyState() {
  return { curLevel: 0, levels: {} };
}

function ensureTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS general_dungeon_state (
    role_id INTEGER NOT NULL,
    dungeon_id INTEGER NOT NULL,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, dungeon_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS general_dungeon_claims (
    role_id INTEGER NOT NULL,
    dungeon_id INTEGER NOT NULL,
    level_tid INTEGER NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, dungeon_id, level_tid, claim_type, claim_key)
  )`);
}

function readState(db, roleId, dungeonId) {
  const row = db.prepare('SELECT state_json FROM general_dungeon_state WHERE role_id=? AND dungeon_id=?').get(roleId, dungeonId);
  if (!row) return emptyState();
  const parsed = JSON.parse(row.state_json);
  if (!Number.isSafeInteger(Number(parsed?.curLevel)) || !parsed?.levels || typeof parsed.levels !== 'object') {
    fail(CODE_STATE, 'General dungeon state is corrupt');
  }
  return parsed;
}

function writeState(db, roleId, dungeonId, state, nowMs) {
  db.prepare(`INSERT INTO general_dungeon_state(role_id,dungeon_id,state_json,updated_at)
    VALUES(?,?,?,?) ON CONFLICT(role_id,dungeon_id) DO UPDATE SET
      state_json=excluded.state_json, updated_at=excluded.updated_at`)
    .run(roleId, dungeonId, JSON.stringify(state), iso(nowMs));
}

function saidClaim(db, roleId, dungeonId, levelTid, type, key) {
  return !!db.prepare(`SELECT 1 FROM general_dungeon_claims
    WHERE role_id=? AND dungeon_id=? AND level_tid=? AND claim_type=? AND claim_key=?`)
    .get(roleId, dungeonId, levelTid, type, key);
}

function recordClaim(db, roleId, dungeonId, levelTid, type, key, nowMs) {
  db.prepare('INSERT INTO general_dungeon_claims VALUES(?,?,?,?,?,?)')
    .run(roleId, dungeonId, levelTid, type, key, iso(nowMs));
}

export function createGeneralDungeonService({
  store,
  codec,
  tables = readGeneralDungeonTables(),
  gameTables = null,
  now = Date.now,
  logger = () => {}
}) {
  if (!tables?.levels?.size) throw new Error('General dungeon configuration is unavailable');
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();
  store.inspect(db => ensureTables(db));

  function levelConfig(levelTid) {
    const row = tables.levels.get(Number(levelTid));
    if (!row) fail(CODE_STATE, 'General dungeon level is not configured');
    return row;
  }

  function eventConfig(eventId) {
    const row = tables.events.get(Number(eventId));
    if (!row) fail(CODE_STATE, 'General dungeon event is not configured');
    return row;
  }

  function activeLevel(state, levelTid) {
    const level = state.levels[String(levelTid)];
    if (!level) fail(CODE_STATE, 'General dungeon level is not initialized');
    return level;
  }

  function activeScene(level) {
    const scene = level.scenes[String(level.curScene)] ?? level.scenes[String(Number(level.curScene) || 0)];
    if (!scene) fail(CODE_STATE, 'General dungeon scene is not initialized');
    return scene;
  }

  function initializedLevel(levelTid) {
    const config = levelConfig(levelTid);
    const configuredScenes = generalDungeonLevelScenes(config);
    const events = generalDungeonEventsForLevel(tables, levelTid);
    const scenes = {};
    for (const scene of configuredScenes) {
      scenes[String(scene.index)] = {
        index: scene.index,
        pos: scene.pos,
        fog: '',
        events: Object.fromEntries(events.map(event => [String(event.tid), { active: false, result: 0 }]))
      };
    }
    return { levelTid, curScene: configuredScenes[0]?.index ?? 1, scenes, buffList: [], propList: [] };
  }

  function levelPb(level, includeInactive = false) {
    return {
      level_tid: Number(level.levelTid),
      cur_scene: Number(level.curScene),
      scene: Object.values(level.scenes).sort((left, right) => Number(left.index) - Number(right.index)).map(scene => ({
        index: Number(scene.index),
        fog: fogFromBase64(scene.fog),
        pos: Number(scene.pos ?? 0),
        events: Object.entries(scene.events ?? {})
          .sort(([left], [right]) => Number(left) - Number(right))
          .filter(([, value]) => includeInactive || value.active || Number(value.result) > 0)
          .map(([eventId, value]) => ({ event_id: Number(eventId), result: Number(value.result ?? 0) }))
      })),
      buff_list: (level.buffList ?? []).map(Number),
      prop_list: (level.propList ?? []).map(Number)
    };
  }

  function statusPb(state) {
    return {
      cur_level: Number(state.curLevel ?? 0),
      level_data: Object.values(state.levels).map(level => levelPb(level))
    };
  }

  function levelChange(state, levels) {
    return { cur_level: Number(state.curLevel ?? 0), level_list: levels };
  }

  function requireActiveEvent(level, eventId) {
    const scene = activeScene(level);
    const event = scene.events[String(eventId)];
    if (!event) fail(CODE_STATE, 'General dungeon event is not part of the active scene');
    if (!event.active && Number(event.result) === 0) fail(CODE_STATE, 'General dungeon event is not active');
    return event;
  }

  function updateMap(level, pos, fog, sceneId = null) {
    const scene = sceneId === null ? activeScene(level) : level.scenes[String(sceneId)];
    if (!scene) fail(CODE_STATE, 'General dungeon scene does not exist');
    if (pos !== undefined && pos !== null) scene.pos = Number(pos);
    if (fog !== undefined && fog !== null) scene.fog = fogToBase64(fog);
    return scene;
  }

  function activateEvents(level, eventIds) {
    const scene = activeScene(level);
    const result = [];
    for (const raw of eventIds ?? []) {
      const id = integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid general dungeon event id');
      const state = scene.events[String(id)];
      if (!state) fail(CODE_STATE, 'General dungeon event is not part of the active scene');
      if (Number(state.result) === 0) state.active = true;
      result.push({ event_id: id, result: Number(state.result ?? 0) });
    }
    return result;
  }

  function getData(input) {
    const dungeonId = scalar(input, 'Invalid general dungeon id');
    if (!tables.dungeonTypes.has(dungeonId)) fail(CODE_STATE, 'General dungeon type is not configured');
    const roleId = store.state().roleId;
    const state = store.inspect(db => { ensureTables(db); return readState(db, roleId, dungeonId); });
    return { value: { dungeonId }, data: codec.pack('pb_general_dungeon', statusPb(state)) };
  }

  function enterLevel(input) {
    const request = input ?? {};
    const levelTid = integer(request.enter_level, 1, Number.MAX_SAFE_INTEGER, 'Invalid general dungeon level id');
    levelConfig(levelTid);
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now(), dungeonId = DEFAULT_DUNGEON_ID;
      const state = readState(db, model.state.roleId, dungeonId);
      if (!state.levels[String(levelTid)]) state.levels[String(levelTid)] = initializedLevel(levelTid);
      state.curLevel = levelTid;
      writeState(db, model.state.roleId, dungeonId, state, nowMs);
      const value = levelChange(state, [levelPb(state.levels[String(levelTid)])]);
      const data = codec.pack('pb_dungeon_level_change', value);
      log({ event: 'general_dungeon_level_entered', levelTid });
      return { value: { levelTid }, data };
    });
  }

  function closeLevel(input) {
    const levelTid = scalar(input, 'Invalid general dungeon level id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now(), dungeonId = DEFAULT_DUNGEON_ID;
      const state = readState(db, model.state.roleId, dungeonId);
      activeLevel(state, levelTid);
      delete state.levels[String(levelTid)];
      if (Number(state.curLevel) === levelTid) state.curLevel = 0;
      writeState(db, model.state.roleId, dungeonId, state, nowMs);
      const value = levelChange(state, [{ level_tid: levelTid, cur_scene: 0, scene: [], buff_list: [], prop_list: [] }]);
      const data = codec.pack('pb_dungeon_level_change', value);
      log({ event: 'general_dungeon_level_closed', levelTid });
      return { value: { levelTid }, data };
    });
  }

  function activate(input) {
    const request = input ?? {};
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now(), dungeonId = DEFAULT_DUNGEON_ID;
      const state = readState(db, model.state.roleId, dungeonId);
      const level = activeLevel(state, state.curLevel);
      updateMap(level, request.pos, request.fog);
      const events = activateEvents(level, request.active_event);
      writeState(db, model.state.roleId, dungeonId, state, nowMs);
      const data = codec.pack('pb_dungeon_event_list', { events });
      log({ event: 'general_dungeon_events_activated', count: events.length });
      return { value: { events: events.map(event => event.event_id) }, data };
    });
  }

  function syncMap(input) {
    const request = input ?? {};
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now(), dungeonId = DEFAULT_DUNGEON_ID;
      const state = readState(db, model.state.roleId, dungeonId);
      const level = activeLevel(state, state.curLevel);
      const sceneId = integer(request.scene_id, 1, Number.MAX_SAFE_INTEGER, 'Invalid general dungeon scene id');
      updateMap(level, request.pos, request.fog, sceneId);
      writeState(db, model.state.roleId, dungeonId, state, nowMs);
      log({ event: 'general_dungeon_map_synced', sceneId });
      return { value: { sceneId }, data: null, noReply: true };
    });
  }

  function executeGeneralEvent(input) {
    const request = input ?? {};
    const eventId = integer(request.execute_event, 1, Number.MAX_SAFE_INTEGER, 'Invalid general dungeon event id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now(), dungeonId = DEFAULT_DUNGEON_ID;
      const state = readState(db, model.state.roleId, dungeonId);
      const level = activeLevel(state, state.curLevel);
      const config = eventConfig(eventId);
      const expectedLevel = Math.floor(Number(config.event_body) / 1000);
      if (expectedLevel !== Number(level.levelTid)) fail(CODE_STATE, 'General dungeon event belongs to another level');
      if (request.active_event?.length) activateEvents(level, request.active_event);
      updateMap(level, request.pos, request.fog);
      const event = requireActiveEvent(level, eventId);
      if (Number(event.result) > 0 || saidClaim(db, model.state.roleId, dungeonId, level.levelTid, 'event', String(eventId))) {
        fail(CODE_STATE, 'General dungeon event was already executed');
      }
      const kind = generalDungeonEventKind(config), bodyTid = Number(config.event_body);
      let changes = [];
      if (kind === 2) {
        if (!tables.boxes.has(bodyTid)) fail(CODE_STATE, 'General dungeon box configuration is missing');
        const awards = generalDungeonBoxAwards(tables, bodyTid);
        if (awards.length) changes = grantResources(model, awards, resourceTables(), { codec }).changes;
      } else if (kind === 8) {
        const prop = Number(tables.propAdds.get(bodyTid)?.prop);
        if (!Number.isSafeInteger(prop) || prop <= 0 || !tables.propDefinitions.has(prop)) fail(CODE_STATE, 'General dungeon prop event configuration is invalid');
        const limit = Number(tables.dungeonTypes.get(dungeonId)?.max_prop ?? 3);
        if ((level.propList ?? []).length >= limit) fail(CODE_STATE, 'General dungeon prop capacity is full');
        level.propList.push(prop);
      } else {
        const label = ['fight', 'box', 'buff', 'talk', 'draw', 'task', 'cure', 'prop', 'model', 'fog', 'condition', 'record', 'reserved', 'follower', 'effect', 'animate', 'lock', 'close'][kind - 1] ?? ('type-' + kind);
        fail(CODE_STATE, `General dungeon ${label} event requires unimplemented server rules`);
      }
      event.result = 1;
      event.active = true;
      recordClaim(db, model.state.roleId, dungeonId, level.levelTid, 'event', String(eventId), nowMs);
      if (kind === 2) recordClaim(db, model.state.roleId, dungeonId, level.levelTid, 'event_box', String(eventId), nowMs);
      const changedEvents = [{ event_id: eventId, result: 1 }];
      for (const nextId of generalDungeonNextEvents(config)) {
        if (!tables.events.has(nextId)) fail(CODE_STATE, 'General dungeon next event is not configured');
        const next = sceneEvents(level, nextId);
        // Some configured chains intentionally point into a level that has not
        // been entered yet. They remain dormant until that level is initialized.
        if (!next || Number(next.result ?? 0) > 0) continue;
        next.active = true;
        changedEvents.push({ event_id: nextId, result: Number(next.result ?? 0) });
      }
      writeState(db, model.state.roleId, dungeonId, state, nowMs);
      const boxCount = Number(db.prepare(`SELECT COUNT(*) AS count FROM general_dungeon_claims
        WHERE role_id=? AND dungeon_id=? AND level_tid=? AND claim_type='event_box'`)
        .get(model.state.roleId, dungeonId, level.levelTid).count);
      const value = {
        events: changedEvents,
        target_evt: eventId,
        res: { changes, is_overflow: false },
        box_count: boxCount,
        extra_data: Buffer.alloc(0)
      };
      const data = codec.pack('pb_dungeon_event_res', value);
      log({ event: 'general_dungeon_event_executed', eventId, kind, changes: changes.length });
      return { value: { eventId, kind, next: changedEvents.slice(1).map(entry => entry.event_id), changes }, data };
    });
  }

  function sceneEvents(level, eventId) {
    const scene = activeScene(level);
    const direct = scene.events[String(eventId)];
    if (direct) return direct;
    for (const candidate of Object.values(level.scenes ?? {})) {
      if (candidate.events?.[String(eventId)]) return candidate.events[String(eventId)];
    }
    return null;
  }

  function useProp(input) {
    const propId = scalar(input, 'Invalid general dungeon prop id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now(), dungeonId = DEFAULT_DUNGEON_ID;
      const state = readState(db, model.state.roleId, dungeonId);
      const level = activeLevel(state, state.curLevel);
      const index = (level.propList ?? []).findIndex(value => Number(value) === propId);
      if (index < 0) fail(CODE_INSUFFICIENT, 'General dungeon prop is not available');
      if (!tables.propDefinitions.has(propId)) fail(CODE_STATE, 'General dungeon prop is not configured');
      level.propList.splice(index, 1);
      writeState(db, model.state.roleId, dungeonId, state, nowMs);
      const value = { changes: [], is_overflow: false };
      const data = codec.pack('pb_res_to_client', value);
      log({ event: 'general_dungeon_prop_used', propId });
      return { value: { propId }, data };
    });
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    switch (Number(type)) {
      case COMMAND_GET_DATA: return getData(input);
      case COMMAND_ENTER_LEVEL: return enterLevel(input);
      case COMMAND_CLOSE_LEVEL: return closeLevel(input);
      case COMMAND_ACTIVATE_EVENTS: return activate(input);
      case COMMAND_SYNC_MAP: return syncMap(input);
      case COMMAND_EXECUTE_EVENT: return executeGeneralEvent(input);
      case COMMAND_USE_PROP: return useProp(input);
      default: fail(CODE_INVALID, 'Unsupported general dungeon command');
    }
  }

  function state(roleId = store.state().roleId) {
    return store.inspect(db => {
      ensureTables(db);
      return readState(db, roleId, DEFAULT_DUNGEON_ID);
    });
  }

  return { supports, execute, getData, enterLevel, closeLevel, activate, syncMap, executeEvent: executeGeneralEvent, useProp, state };
}
