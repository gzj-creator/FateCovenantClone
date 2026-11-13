import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

// Guide progress is one authority: 8000 req_save_guide_process stores
// key_id -> process_id in the guides table, and the award path reads the same
// rows. pb_guide_process (assets/protobuf/guide.db.proto.bin) carries
// process_id/key_id/is_over, so a step counts as passed once its key is saved
// under the process the client is running.
export const GUIDE_CLAIM_TYPE = 'guide_award';
export const GUIDE_LOGIN_MODULE_ID = 16;

const AWARD_ID_KEYS = ['award_tid', 'awardTid', 'award_id', 'awardId'];
const MODULE_KEYS = ['module', 'module_id', 'moduleId', 'guide_module', 'guideModule'];

function asInteger(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && /^[0-9]+$/.test(value.trim())) return Number(value.trim());
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
export function projectGuideLoginModule({ entry, guides = {}, codec }) {
  if (typeof codec?.pack !== 'function' || typeof codec?.unpack !== 'function') {
    throw new TypeError('codec is required');
  }

  const current = entry == null
    ? { process_list: [], award: '' }
    : codec.unpack('pb_guide', binaryBytes(entry));
  const rows = new Map();
  for (const row of current.process_list ?? []) {
    const processId = asInteger(row?.process_id);
    const keyId = asInteger(row?.key_id);
    if (processId === null || processId <= 0 || keyId === null || keyId <= 0) continue;
    rows.set(String(keyId), { process_id: processId, key_id: keyId, is_over: row.is_over === true });
  }

  let added = 0;
  let overridden = 0;
  for (const [key, value] of Object.entries(guides ?? {})) {
    const processId = asInteger(value);
    const keyId = asInteger(key);
    if (processId === null || processId <= 0 || keyId === null || keyId <= 0) continue;
    const rowKey = String(keyId);
    if (rows.has(rowKey)) overridden += 1;
    else added += 1;
    rows.set(rowKey, { process_id: processId, key_id: keyId, is_over: true });
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

export function createGuideService({ store, codec, tables, awards = {}, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set([8001, 8002]);

  function awardRow(awardTid) {
    const row = awardTid === null ? null : awards?.[awardTid] ?? awards?.get?.(awardTid) ?? null;
    if (!row) return null;
    const processId = asInteger(row.processId ?? row.process_id);
    const keyId = asInteger(row.keyId ?? row.key_id);
    const items = Array.isArray(row.items) ? row.items : [];
    if (processId === null || keyId === null || !items.length) throw new GameError(5, 'Guide award row is malformed');
    return { processId, keyId, items };
  }

  function award(input) {
    const awardTid = awardTidOf(input);
    if (awardTid === null) throw new GameError(1, 'Invalid guide award request');
    const row = awardRow(awardTid);
    if (!row) {
      // No GuideTable.Award export exists in the repository yet, so an unknown
      // award tid is rejected instead of granting an invented reward.
      log({ event: 'guide_award_unconfigured', awardTid });
      throw new GameError(5, 'Guide award is not configured');
    }
    const claimKey = row.processId + ':' + row.keyId + ':' + awardTid;
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const saved = asInteger(model.state.guides?.[String(row.keyId)]);
      if (saved !== row.processId) throw new GameError(1, 'Guide step is not completed');
      const claimed = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(roleId, GUIDE_CLAIM_TYPE, claimKey);
      if (claimed) throw new GameError(310, 'Reward already claimed');
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(roleId, GUIDE_CLAIM_TYPE, claimKey, new Date(now()).toISOString());
      const granted = grantResources(model, row.items, tables);
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
