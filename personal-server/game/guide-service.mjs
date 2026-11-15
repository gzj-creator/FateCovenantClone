import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGuideTables } from '../config/guide-tables.mjs';
import { setBit, hasBit } from './bit-block.mjs';
import { openFeatureIds } from './feature-service.mjs';

// Guide progress is one authority: 8000 req_save_guide_process stores
// key_id -> process_id in the guides table, and the award path reads the same
// rows. GuideMgr.InitGuideProcess reads is_over as isAllFinish for the whole
// process, so saving an intermediate key must not finish the entire guide.
export const GUIDE_CLAIM_TYPE = 'guide_award';
export const GUIDE_LOGIN_MODULE_ID = 16;

const AWARD_ID_KEYS = ['award_tid', 'awardTid', 'award_id', 'awardId'];
const MODULE_KEYS = ['module', 'module_id', 'moduleId', 'guide_module', 'guideModule'];

export function guideProcessIsOver(processId, keyId, tables = readGuideTables()) {
  const keys = tables.Process.get(Number(processId))?.keys;
  return !!keys?.length && Number(keys.at(-1)) === Number(keyId);
}

function readLogin(model, codec) {
  const modules = new Map(model.state.modules.value);
  const entry = modules.get(GUIDE_LOGIN_MODULE_ID);
  return { modules, login: entry == null ? { process_list: [], award: '' } : codec.unpack('pb_guide', binaryBytes(entry)) };
}

function asInteger(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value === 'bigint' || typeof value === 'string' && /^[0-9]+$/.test(value.trim())) {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
  }
  return null;
}

function pickKeyed(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Map) return null;
  for (const key of keys) {
    const found = asInteger(value[key]);
    if (found !== null && found > 0) return found;
  }
  return null;
}

// GuideCmd:req_guide_award encodes its arguments as an Erlang term instead of a
// protobuf schema, so the argument positions are the only stable anchor. The
// client module passes the guide data together with the award tid, and the
// decoded term may arrive as a scalar, an argument list or a keyed map.
export function awardTidOf(value) {
  const keyed = pickKeyed(value, AWARD_ID_KEYS);
  if (keyed !== null) return keyed;
  const scalar = asInteger(value);
  if (scalar !== null && scalar > 0) return scalar;
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const candidate = asInteger(value[index]);
      if (candidate !== null && candidate > 0) return candidate;
    }
  }
  if (value instanceof Map) {
    for (const key of AWARD_ID_KEYS) {
      const found = asInteger(value.get(key));
      if (found !== null && found > 0) return found;
    }
  }
  return null;
}

export function guideModuleOf(value) {
  const keyed = pickKeyed(value, MODULE_KEYS);
  if (keyed !== null) return keyed;
  const scalar = asInteger(value);
  return scalar !== null && scalar > 0 ? scalar : null;
}

function binaryBytes(entry) {
  const value = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value?.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data);
  throw new TypeError('Guide login module is not a binary value');
}

// req_save_guide_process is the durable write path for guide progress. Its rows
// live in the guides table, while module 16 is the snapshot the client consumes
// on login. Project the saved rows into that snapshot without discarding older
// fixture-backed history, which is still present on established characters.
export function projectGuideLoginModule({ entry, guides = {}, codec, guideTables = readGuideTables() }) {
  if (typeof codec?.pack !== 'function' || typeof codec?.unpack !== 'function') {
    throw new TypeError('codec is required');
  }

  const current = entry == null
    ? { process_list: [], award: '' }
    : codec.unpack('pb_guide', binaryBytes(entry));
  const rows = new Map();
  const merge = (row, fromSaved = false) => {
    const processId = asInteger(row?.process_id);
    const keyId = asInteger(row?.key_id);
    if (processId === null || processId <= 0 || keyId === null || keyId <= 0) return false;
    const keys = guideTables.Process.get(processId)?.keys;
    const index = keys?.indexOf(keyId);
    const existing = rows.get(String(processId));
    const previous = keys?.indexOf(Number(existing?.key_id));
    // Persisted intermediate keys from the old always-is_over implementation
    // must not skip the remaining steps. Keep the latest actual key instead.
    if (existing && keys?.length && (index < 0 || previous > index)) return false;
    rows.set(String(processId), { process_id: processId, key_id: keyId,
      is_over: keys?.length ? guideProcessIsOver(processId, keyId, guideTables)
        : !fromSaved && row.is_over === true });
    return true;
  };
  for (const row of current.process_list ?? []) merge(row);

  let added = 0;
  let overridden = 0;
  for (const [key, value] of Object.entries(guides ?? {})) {
    const processId = asInteger(value);
    const keyId = asInteger(key);
    if (processId === null || processId <= 0 || keyId === null || keyId <= 0) continue;
    const rowKey = String(processId);
    const existed = rows.has(rowKey);
    if (!merge({ process_id: processId, key_id: keyId }, true)) continue;
    if (existed) overridden += 1;
    else added += 1;
  }

  return {
    data: codec.pack('pb_guide', {
      process_list: [...rows.values()],
      award: current.award ?? ''
    }),
    added,
    overridden,
    total: rows.size
  };
}

// Called inside the gateway's store.transaction, so validation, module 16 and
// the durable guides rows either commit together or roll back together.
export function saveGuideProcesses({ model, codec, reqList, guideTables = readGuideTables() }) {
  if (!Array.isArray(reqList) || reqList.length > 256) throw new GameError(1, 'Invalid guide progress list');
  const requested = reqList.map(row => {
    const processId = asInteger(row?.process_id), keyId = asInteger(row?.key_id);
    const keys = guideTables.Process.get(processId)?.keys;
    if (!keys?.length || !keys.includes(keyId)) throw new GameError(1, 'Invalid guide process or key');
    return { processId, keyId };
  });
  const { modules } = readLogin(model, codec);
  const before = projectGuideLoginModule({ entry: modules.get(GUIDE_LOGIN_MODULE_ID), guides: model.state.guides, codec, guideTables });
  const login = codec.unpack('pb_guide', before.data);
  const rows = new Map(login.process_list.map(row => [Number(row.process_id), row]));
  model.state.guides ??= {};
  for (const { processId, keyId } of requested) {
    const keys = guideTables.Process.get(processId).keys;
    const existing = rows.get(processId);
    const latestKey = keys.indexOf(Number(existing?.key_id)) > keys.indexOf(keyId) ? Number(existing.key_id) : keyId;
    rows.set(processId, { process_id: processId, key_id: latestKey,
      is_over: guideProcessIsOver(processId, latestKey, guideTables) });
    model.state.guides[String(latestKey)] = processId;
  }
  login.process_list = [...rows.values()];
  modules.set(GUIDE_LOGIN_MODULE_ID, serializedBinary(codec.pack('pb_guide', login)));
  model.state.modules.value = [...modules];
  return { process_list: [...new Set(requested.map(row => row.processId))].map(processId => rows.get(processId)) };
}

export function createGuideService({ store, codec, tables, awards = {}, guideTables = readGuideTables(), now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set([8001, 8002]);

  function awardRow(awardTid) {
    const row = awardTid === null ? null : awards?.[awardTid] ?? awards?.get?.(awardTid) ?? null;
    if (!row) return null;
    const processId = asInteger(row.processId ?? row.process_id);
    const keyId = asInteger(row.keyId ?? row.key_id);
    const items = Array.isArray(row.items) ? row.items : [];
    if (!items.length) throw new GameError(5, 'Guide award row is malformed');
    return { ...row, processId, keyId, items };
  }

  function award(input) {
    const awardTid = awardTidOf(input);
    if (awardTid === null) throw new GameError(1, 'Invalid guide award request');
    const row = awardRow(awardTid);
    if (!row) {
      log({ event: 'guide_award_unconfigured', awardTid });
      throw new GameError(5, 'Guide award is not configured');
    }
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const { login } = readLogin(model, codec);
      const bits = Buffer.from(login.award ?? '', 'base64');
      // awardBin is a raw Core.BitBlock (the captured pb_guide.award is 0x60),
      // unlike mission box bitmaps which carry an ETF binary wrapper.
      const claims = db.prepare('SELECT claim_key FROM reward_claims WHERE role_id=? AND claim_type=?').all(roleId, GUIDE_CLAIM_TYPE);
      if (hasBit(bits, awardTid) || claims.some(claim => Number(claim.claim_key.split(':').at(-1)) === awardTid)) {
        throw new GameError(310, 'Reward already claimed');
      }
      const paths = row.paths ?? [{ processId: row.processId, keyId: row.keyId }];
      if (!paths.length) throw new GameError(5, 'Guide award eligibility evidence is missing');
      const projected = codec.unpack('pb_guide', projectGuideLoginModule({
        entry: codec.pack('pb_guide', login), guides: model.state.guides, codec, guideTables
      }).data);
      const progressByProcess = new Map(projected.process_list.map(progress => [Number(progress.process_id), progress]));
      const modules = new Map(model.state.modules.value);
      const mission = modules.get(8);
      const passed = mission?.value?.[0]
        ? Number(codec.unpack('pb_mission', rawBinary(mission.value[0])).mission_id ?? 0) : 0;
      const featureLogin = modules.has(3) ? codec.unpack('res_fun_open_login', rawBinary(modules.get(3))) : null;
      const open = openFeatureIds(featureLogin);
      const eligible = (row.minMission == null || passed >= Number(row.minMission)) && paths.some(path => {
        const processId = Number(path.processId), keyId = Number(path.keyId);
        const keys = guideTables.Process.get(processId)?.keys;
        const index = keys?.indexOf(keyId) ?? -1;
        if ((path.openFeatures ?? []).some(id => !open.has(Number(id)))) return false;
        if ((path.completedGuides ?? []).some(id => {
          const progress = progressByProcess.get(Number(id));
          return !progress || !guideProcessIsOver(id, progress.key_id, guideTables);
        })) return false;
        if (index === 0) {
          // The first reward key cannot already be saved: GuideAwardStep sends
          // 8001 before HandleOver. Its recovered trigger is the prerequisite.
          return row.minMission != null || !!path.openFeatures?.length || !!path.completedGuides?.length;
        }
        const required = index > 0 ? Number(keys[index - 1]) : keyId;
        const progress = progressByProcess.get(processId);
        return !!progress && (keys?.length
          ? keys.indexOf(Number(progress.key_id)) >= keys.indexOf(required)
          : Number(progress.key_id) === required);
      });
      if (!eligible) throw new GameError(1, 'Guide step is not completed');
      const claimKey = row.processId + ':' + row.keyId + ':' + awardTid;
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(roleId, GUIDE_CLAIM_TYPE, claimKey, new Date(now()).toISOString());
      const granted = grantResources(model, row.items, tables, { codec, db });
      // Write after grantResources, which also updates the module container.
      const updated = readLogin(model, codec);
      updated.login.award = setBit(bits, awardTid).toString('base64');
      updated.modules.set(GUIDE_LOGIN_MODULE_ID, serializedBinary(codec.pack('pb_guide', updated.login)));
      model.state.modules.value = [...updated.modules];
      const res = { changes: granted.changes, is_overflow: false };
      return {
        value: { awardTid, processId: row.processId, keyId: row.keyId, res, claimKey },
        data: codec.pack('pb_res_to_client', res)
      };
    });
  }

  function checkNet(input) {
    // GuideCmd:req_check_guide_net has no response schema and no c2s_back
    // registration; GuideMgr only uses its callback for NET_CONNECT_ERR, so the
    // command is a fire-and-forget connectivity probe. Nothing is stored and no
    // frame is written back.
    const module = guideModuleOf(input);
    log({ event: 'guide_net_checked', module });
    return null;
  }

  async function execute(type, input) {
    if (Number(type) === 8001) return award(input);
    if (Number(type) === 8002) return checkNet(input);
    throw new GameError(1, 'Unsupported guide command');
  }

  return { supports: type => supported.has(Number(type)), execute, award, checkNet };
}
