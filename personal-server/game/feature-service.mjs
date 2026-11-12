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

export function createFeatureService({ store, codec, sprintPreview = false, rules = [], context = () => ({}), logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const ruleList = Array.isArray(rules) ? rules : [];
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
    const ids = [1039, 1322, 1348, 1537].filter(id => !current.has(id));
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
        // Evidence gap E9-1: the client FunOpen table has not been exported yet.
        // Keep the existing acknowledgement path but record every application so
        // its ids can be compared with the future rule asset.
        log({ event: 'feature_request_unruled', ids: unique });
        return commit(unique);
      }
      const model = store.read();
      const evaluation = evaluateFunOpen({
        ...model.role,
        guides: model.guides,
        heroInfo: model.heroInfo
      }, ruleList, modelContext(model));
      const allowed = unique.filter(id => evaluation.open.has(id));
      const denied = unique.filter(id => !evaluation.open.has(id));
      if (denied.length) log({ event: 'fun_open_denied', ids: denied, denied: evaluation.denied });
      log({ event: 'feature_request', ids: unique, allowed });
      return commit(allowed);
    },
    reconcile() {
      if (!ruleList.length) return [];
      return store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        const login = codec.unpack('res_fun_open_login', rawBinary(modules.get(3) ?? Buffer.alloc(0)));
        const current = openFeatureIds(login);
        const evaluation = evaluateFunOpen({
          ...model.role,
          guides: model.guides,
          heroInfo: model.heroInfo
        }, ruleList, modelContext(model));
        const add = [...evaluation.open].filter(id => !current.has(id));
        if (add.length) {
          updateBits(login, add);
          modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
          model.state.modules.value = [...modules];
        }
        if (evaluation.denied.length) log({ event: 'fun_open_rule_denied', denied: evaluation.denied });
        return add;
      });
    }
  };
}
