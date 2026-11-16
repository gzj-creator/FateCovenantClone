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
  function commit(ids, denied = []) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const raw = modules.get(3) ?? Buffer.alloc(0);
      const login = codec.unpack('res_fun_open_login', rawBinary(raw));
      updateBits(login, ids);
      modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
      model.state.modules.value = [...modules];
      const value = { target_list: login.target_list, fail_id_list: denied };
      return { schema: 'res_fun_open', value, data: codec.pack('res_fun_open', value) };
    });
  }

  function modelContext(model) {
    const extra = typeof context === 'function' ? context({ model, store }) : context;
    return extra && typeof extra === 'object' ? extra : {};
  }

  function roleForEvaluation(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(8);
    const raw = Array.isArray(module?.value) ? module.value[0] : module;
    let missionId = 0;
    if (raw != null) {
      try {
        const mission = codec.unpack('pb_mission', rawBinary(raw));
        const parsed = Number(mission?.mission_id ?? 0);
        if (Number.isSafeInteger(parsed) && parsed >= 0) missionId = parsed;
      } catch (error) {
        log({ event: 'fun_open_mission_parse_failed', message: error?.message ?? String(error) });
      }
    }
    return {
      ...model.role,
      missionId,
      guides: model.guides,
      heroInfo: model.heroInfo
    };
  }

  // Local test policy: the already visible sprint banners can open their detail UI.
  // Leader-equipment draw 1348 must also be open or HeroDrawForm resolves an empty
  // current library and falls back to the ordinary adventure library.
  if (sprintPreview) {
    if (store.empty && !store.hasRoles()) return {
      supports: type => type === 7000,
      execute() { throw new GameError(5, 'No player role exists yet'); },
      reconcile() { return []; },
      reconcileModel() { return []; },
      onlineNotificationsForIds() { return []; }
    };
    const login = codec.unpack('res_fun_open_login', rawBinary(new Map(store.state().modules.value).get(3) ?? Buffer.alloc(0)));
    const current = openFeatureIds(login);
    const forced = overridesFor(store.state().serverId);
    const ids = [1039, 1322, 1348, 1537].filter(id => !current.has(id) && forced.get(id) !== 'force_close');
    if (ids.length) commit(ids);
  }

  function reconcileModel(model) {
    const modules = new Map(model.state.modules.value);
    const login = codec.unpack('res_fun_open_login', rawBinary(modules.get(3) ?? Buffer.alloc(0)));
    const current = openFeatureIds(login);
    const forced = overridesFor(model.state.serverId);
    let add, remove = [];
    if (!ruleList.length) {
      add = [...forced].filter(([id, mode]) => mode === 'force_open' && !current.has(id)).map(([id]) => id);
    } else {
      const evaluation = evaluateFunOpen(roleForEvaluation(model), ruleList, modelContext(model));
      const visible = new Set([...evaluation.open].filter(id => forced.get(id) !== 'force_close'));
      for (const [id, mode] of forced) if (mode === 'force_open') visible.add(id);
      add = [...visible].filter(id => !current.has(id));
      // A ready rule is authoritative when it evaluates false. Remove only
      // that stale bitmap. Evidence gaps and unknown rules remain untouched,
      // and force_open always wins over the computed rule.
      remove = ruleList
        .filter(rule => rule.status === 'ready' && Number.isSafeInteger(Number(rule.funId)))
        .map(rule => Number(rule.funId))
        .filter(id => current.has(id) && !evaluation.open.has(id) && forced.get(id) !== 'force_open');
      if (evaluation.denied.length) log({ event: 'fun_open_rule_denied', denied: evaluation.denied });
    }
    if (add.length || remove.length) {
      updateBits(login, add);
      clearBits(login, remove);
      modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
      model.state.modules.value = [...modules];
    }
    if (remove.length) log({ event: 'fun_open_stale_ready_removed', ids: remove });
    return add;
  }

  // FunOpenMgr.RevFunOpenNotify passes {target_tid} directly to
  // OpenFunAndNotify, which expects full function IDs and sets their bits.
  // Unlike the login/7000 target_list, 7201 therefore names one function (1001),
  // not its target group (1). extra_ret_list carries custom function data, not
  // the target bitmap. Do not invent such data or enable times.
  function onlineNotificationsForIds(ids, model = store.read()) {
    const wanted = new Set((ids ?? []).map(Number).filter(Number.isSafeInteger));
    if (!wanted.size) return [];
    const login = codec.unpack('res_fun_open_login', rawBinary(new Map(model.state.modules.value).get(3) ?? Buffer.alloc(0)));
    const open = openFeatureIds(login);
    const notifications = [];
    for (const funId of [...wanted].sort((a, b) => a - b)) {
      if (!open.has(funId)) throw new GameError(5, `FunOpen ${funId} is missing after reconciliation`);
      notifications.push({
        type: 7201,
        targetTid: funId,
        funId,
        data: codec.pack('res_notify_fun_open', {
          target_tid: funId,
          extra_ret_list: []
        })
      });
    }
    return notifications;
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
      const overrideMap = overridesFor(model.state.serverId);
      // E9-1 recovered FunOpenTable semantics: type 7000 only accepts target 1,
      // whose rows declare client_req_to_open=true. The client has already run
      // the condition and asks the server to commit the successful result.
      // Recheck rules whose original conditions are recovered. Continue to
      // acknowledge client-only expressions (notably 1054), whose incomplete
      // server evaluator must not leave the lobby waiting. A denied recovered
      // condition is returned in fail_id_list, as the original callback expects.
      // Target 2 remains server-owned through reconciliation above.
      const readyRules = new Map(ruleList.filter(rule => rule.status === 'ready').map(rule => [Number(rule.funId), rule]));
      const evaluated = evaluateFunOpen(roleForEvaluation(model), ruleList, modelContext(model));
      const denied = unique.filter(id => overrideMap.get(id) === 'force_close'
        || (overrideMap.get(id) !== 'force_open' && readyRules.has(id) && !evaluated.open.has(id)));
      const deniedSet = new Set(denied);
      const allowed = unique.filter(id => !deniedSet.has(id));
      if (denied.length) log({
        event: 'fun_open_denied',
        ids: denied,
        denied: denied.map(funId => ({ funId, type: overrideMap.get(funId) === 'force_close' ? 'override' : 'rule', reason: overrideMap.get(funId) === 'force_close' ? 'force_close' : 'condition_not_met' }))
      });
      log({ event: 'feature_request', ids: unique, allowed });
      return commit(allowed, denied);
    },
    reconcile() { return store.transaction(model => reconcileModel(model)); },
    reconcileModel,
    onlineNotificationsForIds,
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
