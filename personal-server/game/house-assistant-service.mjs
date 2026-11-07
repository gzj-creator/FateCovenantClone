import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import {
  DEFAULT_HOUSE_ASSISTANT_TID,
  DEFAULT_HOUSE_BACKGROUND_TID,
  HOUSE_ASSISTANT_ITEM_TYPE,
  HOUSE_BACKGROUND_ITEM_TYPE
} from '../config/house-assistant-tables.mjs';

export const HOUSE_ASSISTANT_MODULE_ID = 148;
export const HOUSE_ASSISTANT_COMMANDS = Object.freeze({
  CHOOSE_BACKGROUND: 88201,
  CHOOSE_ASSISTANT: 88202,
  START_TRIAL: 88203,
  CANCEL_TRIAL: 88204
});

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(1, message);
  return number;
}

function nonNegativeIntegerString(value, message) {
  let number;
  try { number = BigInt(value); }
  catch { fail(5, message); }
  if (number < 0n) fail(5, message);
  return number.toString();
}

function modulePayloadBytes(module) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value)) {
    if (module.value.length !== 1) fail(5, 'House-assistant login module has an unexpected number of slots');
    return rawBinary(module.value[0]);
  }
  return rawBinary(module);
}

function cloneUse(rows) {
  return rows.map(row => ({ ...row }));
}

function itemKind(itemTid, gameTables) {
  const item = gameTables.Item?.get(itemTid);
  if (!item) fail(5, `House-assistant item configuration is missing: ${itemTid}`);
  const type = gameTables.Type?.get(Number(item.type));
  const objectClass = typeof type?.obj_class === 'string' ? type.obj_class : type?.obj_class?.reference;
  if (objectClass !== 'HouseAssistantItem') {
    fail(5, `House-assistant item type is invalid: ${itemTid}`);
  }
  if (Number(item.type) === HOUSE_ASSISTANT_ITEM_TYPE) return 'assistant';
  if (Number(item.type) === HOUSE_BACKGROUND_ITEM_TYPE) return 'background';
  fail(5, `Unsupported house-assistant item type: ${itemTid}`);
}

export function createHouseAssistantService({ store, codec, gameTables, tables, now = Date.now }) {
  function normalizeResources(rows) {
    if (!Array.isArray(rows)) fail(5, 'House-assistant resource list is invalid');
    const byTid = new Map();
    for (const row of rows) {
      const tid = positiveInteger(row?.tid, 'House-assistant resource tid is invalid');
      const amount = BigInt(nonNegativeIntegerString(row?.num ?? '0', 'House-assistant resource amount is invalid'));
      byTid.set(tid, (byTid.get(tid) ?? 0n) + amount);
    }
    return [...byTid.entries()]
      .sort(([left], [right]) => left - right)
      .map(([tid, num]) => ({ tid: String(tid), num: num.toString() }));
  }

  function normalizeUse(rows, label) {
    if (rows == null) return [];
    if (!Array.isArray(rows)) fail(5, `${label} is invalid`);
    const seen = new Set(), result = [];
    for (const row of rows) {
      const sceneTid = positiveInteger(row?.scene_tid, `${label} scene is invalid`);
      if (!tables.scenes.has(sceneTid)) fail(5, `${label} scene is not configured`);
      if (seen.has(sceneTid)) fail(5, `${label} contains a duplicate scene`);
      seen.add(sceneTid);
      const useBg = row?.use_bg == null || String(row.use_bg) === '0'
        ? '0'
        : String(positiveInteger(row.use_bg, `${label} background is invalid`));
      const useAssistant = row?.use_assistant == null || String(row.use_assistant) === '0'
        ? '0'
        : String(positiveInteger(row.use_assistant, `${label} assistant is invalid`));
      result.push({ scene_tid: String(sceneTid), use_bg: useBg, use_assistant: useAssistant });
    }
    return result.sort((left, right) => Number(left.scene_tid) - Number(right.scene_tid));
  }

  function normalizeTrials(rows) {
    if (rows == null) return [];
    if (!Array.isArray(rows)) fail(5, 'House-assistant trial list is invalid');
    const seen = new Set(), result = [];
    for (const row of rows) {
      const id = positiveInteger(row?.id, 'House-assistant trial id is invalid');
      if (!tables.trials.has(id)) fail(5, `House-assistant trial is not configured: ${id}`);
      if (seen.has(id)) fail(5, 'House-assistant trial list contains a duplicate id');
      const deadline = positiveInteger(row?.deadline, 'House-assistant trial deadline is invalid');
      seen.add(id);
      result.push({ id: String(id), deadline: String(deadline) });
    }
    return result.sort((left, right) => Number(left.id) - Number(right.id));
  }

  function readState(modules) {
    const module = modules.get(HOUSE_ASSISTANT_MODULE_ID);
    let bytes;
    try { bytes = modulePayloadBytes(module); }
    catch { fail(5, 'House-assistant login module is invalid'); }
    let value = { res: [], use: [], trial: [], last_use: [] };
    if (bytes.length) {
      try { value = codec.unpack('pb_house_assistant_info', bytes); }
      catch { fail(5, 'House-assistant login payload cannot be decoded'); }
    }
    return {
      res: normalizeResources(value.res),
      use: normalizeUse(value.use, 'House-assistant current selection'),
      trial: normalizeTrials(value.trial),
      last_use: normalizeUse(value.last_use, 'House-assistant previous selection')
    };
  }

  function ensureDefaults(state) {
    const added = [];
    for (const tid of [DEFAULT_HOUSE_ASSISTANT_TID, DEFAULT_HOUSE_BACKGROUND_TID]) {
      if (state.res.some(row => Number(row.tid) === tid)) continue;
      itemKind(tid, gameTables);
      state.res.push({ tid: String(tid), num: '1' });
      added.push(tid);
    }
    state.res.sort((left, right) => Number(left.tid) - Number(right.tid));
    return added;
  }

  function owns(state, tid) {
    return BigInt(state.res.find(row => Number(row.tid) === tid)?.num ?? 0) > 0n;
  }

  function toPb(state) {
    return {
      res: state.res.map(row => ({ ...row })),
      use: cloneUse(state.use),
      trial: state.trial.map(row => ({ ...row })),
      last_use: cloneUse(state.last_use)
    };
  }

  function writeState(model, modules, state) {
    const bytes = codec.pack('pb_house_assistant_info', toPb(state));
    modules.set(HOUSE_ASSISTANT_MODULE_ID, {
      value: [serializedBinary(bytes)],
      improper: false
    });
    model.state.modules.value = [...modules];
  }

  function cleanupExpired(state, nowSeconds) {
    const expired = state.trial.filter(row => Number(row.deadline) <= nowSeconds).map(row => Number(row.id));
    if (!expired.length) return { expired, restored: false };
    state.trial = state.trial.filter(row => Number(row.deadline) > nowSeconds);
    let restored = false;
    if (state.trial.length === 0 && state.last_use.length) {
      state.use = cloneUse(state.last_use);
      state.last_use = [];
      restored = true;
    }
    return { expired, restored };
  }

  function parseRequests(value, { allowRepeatedScene = false } = {}) {
    const requests = value?.req;
    if (!Array.isArray(requests) || requests.length === 0) fail(1, 'House-assistant selection list is empty');
    if (requests.length > tables.scenes.size * 2 + 8) fail(1, 'House-assistant selection list is too large');
    const seenScenes = new Set(), result = [];
    for (const request of requests) {
      const sceneTid = positiveInteger(request?.scene_tid, 'House-assistant scene is invalid');
      if (!tables.scenes.has(sceneTid)) fail(1, 'House-assistant scene does not exist');
      if (!allowRepeatedScene && seenScenes.has(sceneTid)) fail(1, 'House-assistant selection contains a duplicate scene');
      seenScenes.add(sceneTid);
      const itemTid = positiveInteger(request?.assistant_tid, 'House-assistant item is invalid');
      result.push({ sceneTid, itemTid });
    }
    return result;
  }

  function parseTrialIds(value, label = 'House-assistant trial selection') {
    const ids = value?.trial_id_list;
    if (!Array.isArray(ids) || ids.length === 0) fail(1, `${label} is empty`);
    if (ids.length > tables.trials.size) fail(1, `${label} is too large`);
    const seen = new Set(), result = [];
    for (const raw of ids) {
      const id = positiveInteger(raw, 'House-assistant trial id is invalid');
      if (!tables.trials.has(id)) fail(1, `House-assistant trial does not exist: ${id}`);
      if (seen.has(id)) fail(1, 'House-assistant trial selection contains a duplicate id');
      seen.add(id);
      result.push(id);
    }
    return result;
  }

  function useRow(state, sceneTid) {
    let row = state.use.find(value => Number(value.scene_tid) === sceneTid);
    if (!row) {
      row = { scene_tid: String(sceneTid), use_bg: '0', use_assistant: '0' };
      state.use.push(row);
      state.use.sort((left, right) => Number(left.scene_tid) - Number(right.scene_tid));
    }
    return row;
  }

  function choose(state, value, kind) {
    if (state.trial.length) fail(1, 'House-assistant selection is locked during a trial');
    const requests = parseRequests(value);
    for (const request of requests) {
      const actual = itemKind(request.itemTid, gameTables);
      if (actual !== kind) fail(1, `House-assistant ${kind} selection has the wrong item type`);
      if (!owns(state, request.itemTid)) fail(1, `House-assistant ${kind} is not owned`);
    }
    for (const request of requests) useRow(state, request.sceneTid)[kind === 'background' ? 'use_bg' : 'use_assistant'] = String(request.itemTid);
    return requests;
  }

  function startTrial(state, value, nowSeconds) {
    const ids = parseTrialIds(value);
    for (const id of ids) {
      if (state.trial.some(row => Number(row.id) === id)) fail(1, `House-assistant trial is already active: ${id}`);
    }
    const requests = parseRequests(value, { allowRepeatedScene: true });
    const allowedItems = new Set(ids.map(id => tables.trials.get(id).itemTid));
    const requestedItems = new Set(), selections = new Map();
    for (const request of requests) {
      if (!allowedItems.has(request.itemTid)) fail(1, 'House-assistant trial request contains an item outside the selected trial');
      const kind = itemKind(request.itemTid, gameTables);
      let selection = selections.get(request.sceneTid);
      if (!selection) {
        selection = {};
        selections.set(request.sceneTid, selection);
      }
      if (selection[kind] !== undefined && selection[kind] !== request.itemTid) {
        fail(1, `House-assistant trial contains conflicting ${kind} selections`);
      }
      selection[kind] = request.itemTid;
      requestedItems.add(request.itemTid);
    }
    for (const itemTid of allowedItems) {
      if (!requestedItems.has(itemTid)) fail(1, `House-assistant trial request is missing item ${itemTid}`);
    }
    if (state.trial.length === 0) state.last_use = cloneUse(state.use);
    for (const [sceneTid, selection] of selections) {
      const row = useRow(state, sceneTid);
      if (selection.background !== undefined) row.use_bg = String(selection.background);
      if (selection.assistant !== undefined) row.use_assistant = String(selection.assistant);
    }
    for (const id of ids) {
      const config = tables.trials.get(id);
      state.trial.push({ id: String(id), deadline: String(nowSeconds + config.durationSeconds) });
    }
    state.trial.sort((left, right) => Number(left.id) - Number(right.id));
    return ids;
  }

  function cancelTrials(state, value) {
    const ids = parseTrialIds(value, 'House-assistant trial cancellation');
    const requested = new Set(ids);
    state.trial = state.trial.filter(row => !requested.has(Number(row.id)));
    let restored = false;
    if (state.trial.length === 0 && state.last_use.length) {
      state.use = cloneUse(state.last_use);
      state.last_use = [];
      restored = true;
    }
    return { ids, restored };
  }

  function stateResponse(state, valueForLog) {
    const value = { info: toPb(state) };
    return {
      schema: 'pb_house_assistant_trial_rsp',
      value,
      data: codec.pack('pb_house_assistant_trial_rsp', value),
      valueForLog
    };
  }

  function useResponse(state, valueForLog) {
    const value = { use: cloneUse(state.use) };
    return {
      schema: 'pb_house_assistant_use_rsp',
      value,
      data: codec.pack('pb_house_assistant_use_rsp', value),
      valueForLog
    };
  }

  return {
    supports: type => Object.values(HOUSE_ASSISTANT_COMMANDS).includes(type),
    ensureLoginState() {
      return store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        const state = readState(modules);
        const defaults = ensureDefaults(state);
        const cleanup = cleanupExpired(state, Math.floor(now() / 1000));
        writeState(model, modules, state);
        return { defaults, ...cleanup, use: cloneUse(state.use), trial: state.trial.map(row => Number(row.id)) };
      });
    },
    loginPayload() {
      const module = new Map(store.state().modules.value).get(HOUSE_ASSISTANT_MODULE_ID);
      return modulePayloadBytes(module);
    },
    execute(type, value) {
      return store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        const state = readState(modules);
        ensureDefaults(state);
        const nowSeconds = Math.floor(now() / 1000);
        const cleanup = cleanupExpired(state, nowSeconds);
        let result;
        if (type === HOUSE_ASSISTANT_COMMANDS.CHOOSE_BACKGROUND || type === HOUSE_ASSISTANT_COMMANDS.CHOOSE_ASSISTANT) {
          const kind = type === HOUSE_ASSISTANT_COMMANDS.CHOOSE_BACKGROUND ? 'background' : 'assistant';
          const requests = choose(state, value, kind);
          result = useResponse(state, {
            action: type,
            kind,
            scenes: requests.map(request => request.sceneTid),
            items: requests.map(request => request.itemTid),
            expired: cleanup.expired,
            restored: cleanup.restored
          });
        } else if (type === HOUSE_ASSISTANT_COMMANDS.START_TRIAL) {
          const trials = startTrial(state, value, nowSeconds);
          result = stateResponse(state, {
            action: type,
            trials,
            expired: cleanup.expired,
            restored: cleanup.restored,
            useScenes: state.use.map(row => Number(row.scene_tid))
          });
        } else if (type === HOUSE_ASSISTANT_COMMANDS.CANCEL_TRIAL) {
          const cancellation = cancelTrials(state, value);
          result = stateResponse(state, {
            action: type,
            trials: cancellation.ids,
            expired: cleanup.expired,
            restored: cleanup.restored || cancellation.restored
          });
        } else {
          fail(1, 'Invalid house-assistant command');
        }
        writeState(model, modules, state);
        return result;
      });
    }
  };
}
