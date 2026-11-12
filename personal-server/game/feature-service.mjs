import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { evaluateFunOpen } from './feature-rules.mjs';

// Client FunOpenMgr splits IDs at 1000; observed BitBlock bytes are MSB-first.
const splitId = id => [Math.floor(id / 1000), id % 1000];
function updateBits(login, ids) {
  login.target_list ??= [];
  const targets = new Map(login.target_list.map(target => [Number(target.target_tid), target]));
  for (const id of ids) {
    const [targetId, index] = splitId(id);
    let target = targets.get(targetId);
    if (!target) { target = { target_tid: targetId, fun_open_state: '' }; targets.set(targetId, target); }
    const original = Buffer.from(target.fun_open_state ?? '', 'base64');
    const bytes = Buffer.alloc(Math.max(original.length, Math.floor(index / 8) + 1));
    original.copy(bytes); bytes[Math.floor(index / 8)] |= 128 >> (index % 8);
    target.fun_open_state = bytes.toString('base64');
  }
  login.target_list = [...targets.values()];
}

function clearBits(login, ids) {
  const targets = new Map((login?.target_list ?? []).map(target => [Number(target.target_tid), target]));
  for (const id of ids) {
    const [targetId, index] = splitId(id);
    const target = targets.get(targetId);
    if (!target) continue;
    const bytes = Buffer.from(target.fun_open_state ?? '', 'base64');
    if (bytes.length <= Math.floor(index / 8)) continue;
    bytes[Math.floor(index / 8)] &= ~(128 >> (index % 8));
    target.fun_open_state = bytes.toString('base64');
  }
}

export function openFeatureIds(login) {
  const result = new Set();
  for (const target of login?.target_list ?? []) {
    const bytes = Buffer.from(target?.fun_open_state ?? '', 'base64');
    for (let index = 0; index < bytes.length * 8; index += 1) {
      if (bytes[Math.floor(index / 8)] & (128 >> (index % 8))) {
        result.add(Number(target.target_tid) * 1000 + index);
      }
    }
  }
  return result;
}

export function createFeatureService({
  store, codec, sprintPreview = false, rules = [], context = () => ({}),
  overrides = () => [], logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const ruleList = Array.isArray(rules) ? rules : [];
  const overridesFor = serverId => {
    let rows;
    try { rows = typeof overrides === 'function' ? overrides(serverId) : overrides; } catch (error) {
      log({ event: 'fun_open_override_read_failed', message: error.message });
      rows = [];
    }
    // activeFor returns newest first. The first row for a function wins, so a
    // later force_open can supersede an older force_close without deleting the
    // historical audit row.
    const map = new Map();
    for (const row of rows ?? []) {
      const id = Number(row.fun_id ?? row.funId);
      if (!Number.isSafeInteger(id) || id <= 0 || map.has(id)) continue;
      map.set(id, String(row.mode));
    }
    return map;
  };
  function commit(ids) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const raw = modules.get(3) ?? Buffer.alloc(0);
      const login = codec.unpack('res_fun_open_login', rawBinary(raw));
      updateBits(login, ids);
      modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
      model.state.modules.value = [...modules];
      const value = { target_list: login.target_list };
      return { schema: 'res_fun_open', value, data: codec.pack('res_fun_open', value) };
    });
  }

  function modelContext(model) {
    const extra = typeof context === 'function' ? context({ model, store }) : context;
    return extra && typeof extra === 'object' ? extra : {};
  }

  // Local test policy: the already visible sprint banners can open their detail UI.
  // Leader-equipment draw 1348 must also be open or HeroDrawForm resolves an empty
  // current library and falls back to the ordinary adventure library.
  if (sprintPreview) {
    if (store.empty && !store.hasRoles()) return {
      supports: type => type === 7000,
      execute() { throw new GameError(5, 'No player role exists yet'); },
      reconcile() { return []; }
    };
    const login = codec.unpack('res_fun_open_login', rawBinary(new Map(store.state().modules.value).get(3) ?? Buffer.alloc(0)));
    const current = openFeatureIds(login);
    const forced = overridesFor(store.state().serverId);
    const ids = [1039, 1322, 1348, 1537].filter(id => !current.has(id) && forced.get(id) !== 'force_close');
    if (ids.length) commit(ids);
  }

  return {
    supports: type => type === 7000,
    execute(type, input) {
      log({
        event: 'feature_execute_entry', type, input,
        inputHex: Buffer.isBuffer(input) || input instanceof Uint8Array ? Buffer.from(input).toString('base64') : undefined
      });
      const ids = Array.isArray(input) ? input : input?.value;
      if (type !== 7000 || !Array.isArray(ids) || ids.length > 200 || ids.some(id => !Number.isSafeInteger(id) || id < 1001 || id >= 2000)) throw new GameError(1, 'Invalid client-validated feature IDs');
      const unique = [...new Set(ids)];
      if (!ruleList.length) {
        // Compatibility fallback for an installation without the extracted
        // rule asset. Record every application instead of inventing conditions.
        log({ event: 'feature_request_unruled', ids: unique });
        return commit(unique);
      }
      const model = store.read();
      const evaluation = evaluateFunOpen({
        ...model.role,
        guides: model.guides,
        heroInfo: model.heroInfo
      }, ruleList, modelContext(model));
      const overrideMap = overridesFor(model.state.serverId);
      const isAllowed = id => overrideMap.get(id) === 'force_open'
        || (overrideMap.get(id) !== 'force_close' && evaluation.open.has(id));
      const allowed = unique.filter(isAllowed);
      const denied = unique.filter(id => !isAllowed(id));
      if (denied.length) log({ event: 'fun_open_denied', ids: denied, denied: evaluation.denied });
      log({ event: 'feature_request', ids: unique, allowed });
      return commit(allowed);
    },
    reconcile() {
      if (!ruleList.length) {
        const login = codec.unpack('res_fun_open_login', rawBinary(new Map(store.state().modules.value).get(3) ?? Buffer.alloc(0)));
        const current = openFeatureIds(login);
        const forced = overridesFor(store.state().serverId);
        const ids = [...forced].filter(([id, mode]) => mode === 'force_open' && !current.has(id)).map(([id]) => id);
        if (ids.length) commit(ids);
        return ids;
      }
      return store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        const login = codec.unpack('res_fun_open_login', rawBinary(modules.get(3) ?? Buffer.alloc(0)));
        const current = openFeatureIds(login);
        const evaluation = evaluateFunOpen({
          ...model.role,
          guides: model.guides,
          heroInfo: model.heroInfo
        }, ruleList, modelContext(model));
        const forced = overridesFor(model.state.serverId);
        const visible = new Set([...evaluation.open].filter(id => forced.get(id) !== 'force_close'));
        for (const [id, mode] of forced) if (mode === 'force_open') visible.add(id);
        const add = [...visible].filter(id => !current.has(id));
        if (add.length) {
          updateBits(login, add);
          modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
          model.state.modules.value = [...modules];
        }
        if (evaluation.denied.length) log({ event: 'fun_open_rule_denied', denied: evaluation.denied });
        return add;
      });
    },
    // force_close must not rewrite the role bitmap. Mask the outgoing module 3
    // copy instead so revoking the override restores the prior bitmap exactly.
    maskLogin(modules) {
      const serverId = store.state().serverId;
      const closed = [...overridesFor(serverId)].filter(([, mode]) => mode === 'force_close').map(([id]) => id);
      if (!closed.length || !modules?.has(3)) return closed;
      const login = codec.unpack('res_fun_open_login', rawBinary(modules.get(3) ?? Buffer.alloc(0)));
      const current = openFeatureIds(login);
      const present = closed.filter(id => current.has(id));
      if (!present.length) return closed;
      clearBits(login, present);
      modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
      return closed;
    },
    overrideMode(funId) {
      return overridesFor(store.state().serverId).get(Number(funId)) ?? null;
    },
    openIds() {
      const login = codec.unpack('res_fun_open_login', rawBinary(new Map(store.state().modules.value).get(3) ?? Buffer.alloc(0)));
      const open = openFeatureIds(login);
      for (const [id, mode] of overridesFor(store.state().serverId)) {
        if (mode === 'force_open') open.add(id);
        else if (mode === 'force_close') open.delete(id);
      }
      return open;
    }
  };
}
