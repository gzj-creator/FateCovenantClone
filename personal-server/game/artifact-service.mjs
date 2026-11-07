import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';
import { readArtifactTables, UR_STAR_STONE_TID } from '../config/artifact-tables.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

// ArtifactCmd 37060-37075 (see agent/workflow/gameplay-completion/EQUIP-ARTIFACT).
//
// Request encodings recovered from ArtifactCmd.lua:
//   37060 pb_artifact_star_up_req{tid,times}
//   37061 pb_req_artifact_forge{tid,forge_list:[{type,forge_count}]}
//   37062 ETF tid
//   37068 ETF tid
//   37069 ETF tid
//   37070 pb_artifact_level_up_req{tid,times}
//   37071 ETF tid
//   37072 ETF variadic (semantics not recovered)
//   37073 pb_artifact_handbook_level_up_req{tid,times}
//   37074 ETF tid
//   37075 ETF tid (artifact skin semantics not recovered)
//
// Authoritative state is the login module 50 slot 0 pb_artifact_info that
// grantArtifact() in resources.mjs already writes, so every mutation is also
// the login payload.
export const ARTIFACT_COMMANDS = Object.freeze({
  synthesis: 37060,
  strength: 37061,
  quality: 37062,
  forgePromote: 37068,
  fetter: 37069,
  levelUp: 37070,
  breakLevelUp: 37071,
  inject: 37072,
  handbookLevelUp: 37073,
  flyUp: 37074,
  changeSkin: 37075
});

const ARTIFACT_MODULE_ID = 50;
const ARTIFACT_SLOT = 0;
const ARTIFACT_SCHEMA = 'pb_artifact_info';
const INVALID = 1;
const UNAVAILABLE = 5;
const INSUFFICIENT = 301;
const FORGE_TYPES = 3;

function fail(code, message) { throw new GameError(code, message); }

function positiveInteger(value, label, maximum = Number.MAX_SAFE_INTEGER) {
  const candidate = Array.isArray(value) && value.length === 1 ? value[0] : value;
  const number = Number(candidate);
  if (!Number.isSafeInteger(number) || number <= 0 || number > maximum) fail(INVALID, 'Invalid artifact ' + label);
  return number;
}

function scalarId(input, label) {
  let value = input;
  if (Array.isArray(value) && value.length === 1) [value] = value;
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) value = value.tid ?? value.id;
  return positiveInteger(value, label);
}

function emptyInfo() {
  return {
    artifact_list: [], skill_list: [], lineup_list: [],
    fetter_list: [], inject_list: [], handbook_list: []
  };
}

function arenaRow(row) {
  return {
    tid: String(row.tid ?? 0),
    num: Number(row.num ?? 0),
    star: Number(row.star ?? 0),
    star_node: Number(row.star_node ?? 0),
    forge_list: Array.from({ length: FORGE_TYPES }, (_, index) => Number(row.forge_list?.[index] ?? 0)),
    stage: Number(row.stage ?? 0),
    quality: Number(row.quality ?? 0),
    level: Number(row.level ?? 0),
    break_level: Number(row.break_level ?? 0),
    is_fly_up: Boolean(row.is_fly_up),
    artifact_skin: Number(row.artifact_skin ?? 0)
  };
}

export function createArtifactService({ store, codec, tables = readArtifactTables(), logger = () => {} }) {
  if (!store?.transaction || !store?.inspect) throw new Error('Artifact store is unavailable');
  const log = event => { try { logger(event); } catch {} };

  function readInfo(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(ARTIFACT_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(UNAVAILABLE, 'Artifact login module is unavailable');
    const target = module.value[ARTIFACT_SLOT];
    const bytes = target ? rawBinary(target) : Buffer.alloc(0);
    const info = bytes.length ? codec.unpack(ARTIFACT_SCHEMA, bytes) : emptyInfo();
    for (const key of Object.keys(emptyInfo())) info[key] ??= [];
    return { modules, info };
  }

  function writeInfo(model, modules, info) {
    const module = modules.get(ARTIFACT_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(UNAVAILABLE, 'Artifact login module is unavailable');
    while (module.value.length <= ARTIFACT_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[ARTIFACT_SLOT] = serializedBinary(codec.pack(ARTIFACT_SCHEMA, info));
    model.state.modules.value = [...modules];
  }

  // Artifact rows arrive from grantArtifact() as {tid,num}. The artifact
  // manager supplies the remaining defaults locally from ArtifactTable;
  // the server persists them so every later command and the login payload
  // agree on the same authoritative state.
  function ownedRow(info, tid) {
    const config = tables.artifact(tid);
    if (!config) fail(UNAVAILABLE, 'Unknown artifact ' + tid);
    const row = (info.artifact_list ?? []).find(entry => Number(entry.tid) === tid);
    if (!row) fail(UNAVAILABLE, 'Artifact ' + tid + ' is not owned');
    const before = JSON.stringify(arenaRow(row));
    const normalized = arenaRow(row);
    if (!normalized.quality) normalized.quality = tables.qualityOf(tid) ?? 0;
    if (!normalized.quality) fail(UNAVAILABLE, 'Artifact quality is not recovered for ' + tid);
    if (row.star === undefined || row.star === null) normalized.star = Number(config.init_star ?? 0);
    if (row.stage === undefined || row.stage === null) normalized.stage = 0;
    if (row.level === undefined || row.level === null) normalized.level = 0;
    if (row.break_level === undefined || row.break_level === null) normalized.break_level = 0;
    Object.assign(row, normalized);
    return { row, config, changed: before !== JSON.stringify(normalized) };
  }

  function levelLimit(row) {
    const config = tables.breakUp(row.quality, row.break_level);
    return config ? Number(config.up_level_limit ?? 0) : null;
  }

  function synthesis(input) {
    const tid = positiveInteger(input?.tid, 'tid');
    const times = positiveInteger(input?.times, 'star count', 100);
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      const { row, config } = ownedRow(info, tid);
      const maxStar = tables.maxStarOf(tid);
      if (maxStar == null) fail(UNAVAILABLE, 'Artifact star limit is unavailable');
      if (row.star >= maxStar) fail(UNAVAILABLE, 'Artifact ' + tid + ' is already at max star');
      const nodeConfig = tables.starNode(row.quality, row.star);
      if (!nodeConfig) fail(UNAVAILABLE, 'Artifact star node config is missing');
      const nodeCount = Number(nodeConfig.node_num);
      if (!Number.isSafeInteger(nodeCount) || nodeCount <= 0) fail(UNAVAILABLE, 'Artifact star node count is missing');
      const available = nodeCount - row.star_node;
      if (times > available) fail(INVALID, 'Artifact star node request exceeds the current star progress');
      const costs = [];
      const chip = Number(config.chip);
      if (!Number.isSafeInteger(chip) || chip <= 0) fail(UNAVAILABLE, 'Artifact chip is not configured');
      costs.push([chip, Number(nodeConfig.cost_num) * times]);
      const stone = Number(nodeConfig.stone_num ?? 0) * times;
      if (stone > 0) {
        // Artifact.CanUpURStar requires ItemTable.TID_ARTIFACT_UPURSTAR_STONE
        // (339002, ItemTable.lua bytecode pc 482) for every UR star node.
        costs.push([UR_STAR_STONE_TID, stone]);
      }
      const consumed = consumeResources(model, costs, INSUFFICIENT, { codec });
      row.star_node += times;
      while (row.star_node >= nodeCount) {
        row.star += 1;
        row.star_node -= nodeCount;
      }
      writeInfo(model, modules, info);
      log({ event: 'artifact_star_up', tid, times, star: row.star, starNode: row.star_node });
      return { data: codec.pack('pb_artifact_back', { res: resOf(consumed), artifact: row }), valueForLog: { tid, times, star: row.star } };
    });
  }

  function strength(input) {
    const tid = positiveInteger(input?.tid, 'tid');
    const requests = input?.forge_list;
    if (!Array.isArray(requests) || requests.length === 0) fail(INVALID, 'Artifact forge list is empty');
    if (requests.length > FORGE_TYPES) fail(INVALID, 'Artifact forge list is too large');
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      const { row } = ownedRow(info, tid);
      const stageConfig = tables.forge(tid, row.stage);
      if (!stageConfig) fail(UNAVAILABLE, 'Artifact forge stage config is missing');
      const requirements = new Map((stageConfig.forge_count ?? []).map(entry => [Number(entry[0]), Number(entry[1])]));
      const requested = new Map();
      for (const entry of requests) {
        const type = positiveInteger(entry?.type, 'forge type', FORGE_TYPES);
        const count = positiveInteger(entry?.forge_count, 'forge count', 1000000);
        requested.set(type, (requested.get(type) ?? 0) + count);
      }
      const costs = new Map();
      for (const [type, count] of requested) {
        const requirement = requirements.get(type);
        if (requirement === undefined) fail(INVALID, 'Artifact forge type ' + type + ' is not required by this stage');
        if (row.forge_list[type - 1] + count > requirement) fail(INVALID, 'Artifact forge count exceeds the current stage requirement');
        const typeConfig = tables.forgeType(type);
        if (!typeConfig) fail(UNAVAILABLE, 'Artifact forge material is not configured for type ' + type);
        const material = Number(typeConfig.cost_type);
        const amount = Number(typeConfig.cost_num) * count;
        if (!Number.isSafeInteger(material) || material <= 0) fail(UNAVAILABLE, 'Artifact forge material tid is invalid');
        costs.set(material, (costs.get(material) ?? 0) + amount);
      }
      const consumed = consumeResources(model, [...costs], INSUFFICIENT, { codec });
      for (const [type, count] of requested) row.forge_list[type - 1] += count;
      writeInfo(model, modules, info);
      log({ event: 'artifact_forge', tid, stage: row.stage, forgeList: row.forge_list });
      return { data: codec.pack('pb_artifact_back', { res: resOf(consumed), artifact: row }), valueForLog: { tid, stage: row.stage } };
    });
  }

  function forgePromote(input) {
    const tid = scalarId(input, 'tid');
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      const { row } = ownedRow(info, tid);
      const stageConfig = tables.forge(tid, row.stage);
      if (!stageConfig) fail(UNAVAILABLE, 'Artifact forge stage config is missing');
      if (!tables.forge(tid, row.stage + 1)) fail(UNAVAILABLE, 'Artifact is already at the last forge stage');
      for (const [type, requirement] of stageConfig.forge_count ?? []) {
        if (row.forge_list[Number(type) - 1] < Number(requirement)) {
          fail(UNAVAILABLE, 'Artifact forge stage requirements are not met');
        }
      }
      row.stage += 1;
      writeInfo(model, modules, info);
      log({ event: 'artifact_forge_promoted', tid, stage: row.stage });
      return { data: codec.pack('pb_artifact', row), valueForLog: { tid, stage: row.stage } };
    });
  }

  function fetter(input) {
    const tid = scalarId(input, 'tid');
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      ownedRow(info, tid);
      const activated = new Set((info.fetter_list ?? []).map(Number));
      const newly = [];
      for (const { id, row } of tables.fettersForArtifact(tid)) {
        if (activated.has(id)) continue;
        const met = (row.artifact ?? []).every(entry => {
          const artifactTid = Number(entry?.[0]);
          const requiredStar = Number(entry?.[1] ?? 0);
          const owned = (info.artifact_list ?? []).find(candidate => Number(candidate.tid) === artifactTid);
          if (!owned) return false;
          const star = owned.star === undefined || owned.star === null
            ? Number(tables.artifact(artifactTid)?.init_star ?? 0)
            : Number(owned.star);
          return star >= requiredStar;
        });
        if (met) newly.push(id);
      }
      if (newly.length) {
        info.fetter_list = [...new Set([...(info.fetter_list ?? []).map(Number), ...newly])].sort((left, right) => left - right);
        writeInfo(model, modules, info);
      }
      log({ event: 'artifact_fetter_activated', tid, activated: newly });
      return { data: codec.pack('pb_artifact_fetter', { fetter_list: newly }), valueForLog: { tid, activated: newly.length } };
    });
  }

  function levelUp(input) {
    const tid = positiveInteger(input?.tid, 'tid');
    const times = positiveInteger(input?.times, 'level count', 1000);
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      const { row } = ownedRow(info, tid);
      const limit = levelLimit(row);
      if (limit != null && row.level + times > limit) fail(UNAVAILABLE, 'Artifact level requires a breakthrough before ' + limit);
      const costs = new Map();
      for (let offset = 1; offset <= times; offset++) {
        const config = tables.levelUp(row.quality, row.level + offset);
        if (!config) fail(UNAVAILABLE, 'Artifact level config is missing for level ' + (row.level + offset));
        const material = Number(config.cost_type);
        if (!Number.isSafeInteger(material) || material <= 0) fail(UNAVAILABLE, 'Artifact level cost type is invalid');
        costs.set(material, (costs.get(material) ?? 0) + Number(config.cost_num));
      }
      const consumed = consumeResources(model, [...costs], INSUFFICIENT, { codec });
      row.level += times;
      writeInfo(model, modules, info);
      log({ event: 'artifact_level_up', tid, times, level: row.level });
      return { data: codec.pack('pb_artifact_level_up_rsp', { res_change: resOf(consumed), artifact: row }), valueForLog: { tid, times, level: row.level } };
    });
  }

  function breakLevelUp(input) {
    const tid = scalarId(input, 'tid');
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      const { row } = ownedRow(info, tid);
      const next = tables.breakUp(row.quality, row.break_level + 1);
      if (!next) fail(UNAVAILABLE, 'Artifact is already at the last breakthrough');
      const roleLevel = Number(model.role?.level ?? 0);
      if (roleLevel < Number(next.unlock_role_level ?? 0)) fail(UNAVAILABLE, 'Artifact breakthrough requires role level ' + next.unlock_role_level);
      const limit = levelLimit(row);
      if (limit != null && row.level < limit) fail(UNAVAILABLE, 'Artifact must reach level ' + limit + ' before breakthrough');
      const material = Number(next.cost_type);
      const amount = Number(next.cost_num);
      if (!Number.isSafeInteger(material) || material <= 0) fail(UNAVAILABLE, 'Artifact breakthrough cost type is invalid');
      const consumed = consumeResources(model, [[material, amount]], INSUFFICIENT, { codec });
      row.break_level += 1;
      writeInfo(model, modules, info);
      log({ event: 'artifact_break_level_up', tid, breakLevel: row.break_level });
      return { data: codec.pack('pb_artifact_break_level_up_rsp', { res_change: resOf(consumed), artifact: row }), valueForLog: { tid, breakLevel: row.break_level } };
    });
  }

  function flyUp(input) {
    const tid = scalarId(input, 'tid');
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      const { row } = ownedRow(info, tid);
      const config = tables.flyUp(tid);
      if (!config) fail(UNAVAILABLE, 'Artifact fly-up config is missing');
      if (row.is_fly_up) fail(UNAVAILABLE, 'Artifact is already flown up');
      const maxStar = tables.maxStarOf(tid) ?? 0;
      const starLimit = Number(config.star_limit ?? 0);
      if (starLimit > maxStar) fail(UNAVAILABLE, 'Artifact fly-up star limit ' + starLimit + ' exceeds the configured max star ' + maxStar);
      if (row.star < starLimit) fail(UNAVAILABLE, 'Artifact must reach star ' + starLimit + ' before fly-up');
      const costs = (config.cost ?? []).map(entry => [Number(entry[0]), Number(entry[1])]);
      if (!costs.length) fail(UNAVAILABLE, 'Artifact fly-up cost is not configured');
      const consumed = consumeResources(model, costs, INSUFFICIENT, { codec });
      row.is_fly_up = true;
      writeInfo(model, modules, info);
      log({ event: 'artifact_fly_up', tid });
      return { data: codec.pack('pb_artifact_back', { res: resOf(consumed), artifact: row }), valueForLog: { tid } };
    });
  }

  function resOf(consumed) {
    return { changes: consumed.changes, is_overflow: false };
  }

  const unsupported = (message) => () => fail(UNAVAILABLE, message);

  function ensureLoginState() {
    return store.transaction(model => {
      const { modules, info } = readInfo(model);
      let changed = false;
      for (const row of info.artifact_list ?? []) {
        const tid = Number(row.tid);
        if (!Number.isSafeInteger(tid) || !tables.artifact(tid)) continue;
        const result = ownedRow(info, tid);
        changed = changed || result.changed;
      }
      if (changed) writeInfo(model, modules, info);
      return { artifacts: (info.artifact_list ?? []).length, changed };
    });
  }

  function execute(type, input) {
    switch (Number(type)) {
      case ARTIFACT_COMMANDS.synthesis: return synthesis(input);
      case ARTIFACT_COMMANDS.strength: return strength(input);
      case ARTIFACT_COMMANDS.quality: return unsupported('Artifact quality upgrade semantics are not recovered')(input);
      case ARTIFACT_COMMANDS.forgePromote: return forgePromote(input);
      case ARTIFACT_COMMANDS.fetter: return fetter(input);
      case ARTIFACT_COMMANDS.levelUp: return levelUp(input);
      case ARTIFACT_COMMANDS.breakLevelUp: return breakLevelUp(input);
      case ARTIFACT_COMMANDS.inject: return unsupported('Artifact inject semantics are not recovered')(input);
      case ARTIFACT_COMMANDS.handbookLevelUp: return unsupported('Artifact handbook level is not recovered')(input);
      case ARTIFACT_COMMANDS.flyUp: return flyUp(input);
      case ARTIFACT_COMMANDS.changeSkin: return unsupported('Artifact skin table is not recovered')(input);
      default: return fail(INVALID, 'Unknown artifact command');
    }
  }

  function decode(type, bytes) {
    const schema = ({
      [ARTIFACT_COMMANDS.synthesis]: 'pb_artifact_star_up_req',
      [ARTIFACT_COMMANDS.strength]: 'pb_req_artifact_forge',
      [ARTIFACT_COMMANDS.levelUp]: 'pb_artifact_level_up_req',
      [ARTIFACT_COMMANDS.handbookLevelUp]: 'pb_artifact_handbook_level_up_req'
    })[Number(type)];
    if (!schema) fail(INVALID, 'Unknown protobuf artifact command');
    if (!bytes?.length) fail(INVALID, 'Artifact protobuf payload is empty');
    try {
      return codec.unpack(schema, bytes);
    } catch {
      fail(INVALID, 'Invalid ' + schema + ' payload');
    }
  }

  return {
    supports: type => Object.values(ARTIFACT_COMMANDS).includes(Number(type)),
    isProtobufRequest: type => [ARTIFACT_COMMANDS.synthesis, ARTIFACT_COMMANDS.strength, ARTIFACT_COMMANDS.levelUp, ARTIFACT_COMMANDS.handbookLevelUp].includes(Number(type)),
    decode,
    execute,
    ensureLoginState,
    commands: ARTIFACT_COMMANDS,
    tables
  };
}