import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

// Client FunOpenMgr splits IDs at 1000; observed BitBlock bytes are MSB-first.
const splitId = id => [Math.floor(id / 1000), id % 1000];
function updateBits(login, ids) {
  const targets = new Map(login.target_list.map(target => [target.target_tid, target]));
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

export function createFeatureService({ store, codec, sprintPreview = false }) {
  function commit(ids) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const login = codec.unpack('res_fun_open_login', rawBinary(modules.get(3)));
      updateBits(login, ids);
      modules.set(3, serializedBinary(codec.pack('res_fun_open_login', login)));
      model.state.modules.value = [...modules];
      const value = { target_list: login.target_list };
      return { schema: 'res_fun_open', value, data: codec.pack('res_fun_open', value) };
    });
  }
  // Local test policy: the already visible sprint banners can open their detail UI.
  // Leader-equipment draw 1348 must also be open or HeroDrawForm resolves an empty
  // current library and falls back to the ordinary adventure library.
  if (sprintPreview) {
    const login = codec.unpack('res_fun_open_login', rawBinary(new Map(store.state().modules.value).get(3)));
    const ids = [1039, 1322, 1348, 1537].filter(id => {
      const [targetId, index] = splitId(id);
      const target = login.target_list.find(target => target.target_tid === targetId);
      return !(Buffer.from(target?.fun_open_state ?? '', 'base64')[Math.floor(index / 8)] & (128 >> (index % 8)));
    });
    if (ids.length) commit(ids);
  }
  return {
    supports: type => type === 7000,
    execute(type, input) {
      const ids = Array.isArray(input) ? input : input?.value;
      if (type !== 7000 || !Array.isArray(ids) || ids.length > 200 || ids.some(id => !Number.isSafeInteger(id) || id < 1001 || id >= 2000)) throw new GameError(1, 'Invalid client-validated feature IDs');
      // Target 1 is explicitly client_req_to_open=true. The local server trusts
      // this client's successful condition checks; other target types stay server-owned.
      return commit([...new Set(ids)]);
    }
  };
}
