import { consumeResources, grantResources } from './resources.mjs';
import {
  assertFantasyDrawSync,
  equipmentRewardChanges,
  fantasyDrawFail,
  fantasyDrawRecruitInfo,
  normalizeFantasyDrawRequest,
  readFantasyDrawPoolState,
  recordFantasyDraw,
  rollFantasyGroupReward,
  rollFantasyWeightedGroup
} from './fantasy-shared-draw-service.mjs';

const POOL_NAME = 'demigod';

function positiveConfig(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) {
    fantasyDrawFail(5, `Invalid demigod draw configuration: ${field}`);
  }
  return number;
}

function groupIds(weightConfig) {
  return [...new Set([
    ...(weightConfig?.weight_group ?? []).map(entry => Number(entry?.[1])),
    ...(weightConfig?.guaranteed_group ?? []).map(Number)
  ].filter(Number.isSafeInteger))];
}

function gateIsOpen(result) {
  if (result === false) return false;
  if (result && typeof result === 'object') {
    return result.open !== false && result.allowed !== false && result.closed !== true;
  }
  return true;
}

/**
 * Standard draw type 601 for DemigodDraw. Several draw_lib values are reused
 * by different activity versions, so a caller must provide resolveVersion when
 * the static table is ambiguous. The former, permissive default is rejected.
 */
export function createDemigodDrawPool({
  tables,
  heroTables,
  inventory,
  codec,
  random = Math.random,
  resolveVersion = null,
  resolveGroup = null,
  assertOpen = null
} = {}) {
  if (!(tables?.DemigodDraw instanceof Map) || !(tables?.DemigodDrawFantasy instanceof Map) || !(tables?.DrawLibWeight instanceof Map) || !(tables?.DrawGroup instanceof Map)) {
    throw new Error('Demigod draw tables are missing');
  }
  if (!(heroTables?.Draw instanceof Map) || !(heroTables?.Guaranteed instanceof Map)) {
    throw new Error('Demigod hero draw tables are missing');
  }
  if (!inventory || typeof inventory.read !== 'function' || typeof inventory.save !== 'function' || !codec || typeof codec.pack !== 'function') {
    throw new Error('Demigod draw equipment dependencies are missing');
  }

  const versionsById = new Map();
  const versionsByLib = new Map();
  for (const row of tables.DemigodDraw.values()) {
    const version = positiveConfig(row?.tid, 'version tid');
    const drawLib = positiveConfig(row?.draw_lib, 'draw library');
    if (versionsById.has(version)) throw new Error(`Duplicate demigod draw version: ${version}`);
    const normalized = { ...row, tid: version, draw_lib: drawLib };
    versionsById.set(version, normalized);
    const list = versionsByLib.get(drawLib) ?? [];
    list.push(normalized);
    versionsByLib.set(drawLib, list);
  }
  const drawLibs = [...versionsByLib.keys()].sort((a, b) => a - b);
  if (!drawLibs.length) throw new Error('Demigod draw configuration is empty');

  const groupResolver = drawLib => typeof resolveGroup === 'function'
    ? resolveGroup(drawLib)
    : tables.DrawGroup.get(drawLib);

  function versionFor(drawLib, model, seconds) {
    let selected;
    if (typeof resolveVersion === 'function') {
      selected = assertFantasyDrawSync(resolveVersion({ drawLib, model, seconds }), 'Demigod draw version resolver');
    } else {
      const candidates = versionsByLib.get(drawLib) ?? [];
      if (candidates.length !== 1) fantasyDrawFail(305, 'Demigod draw version is ambiguous for this draw library');
      selected = candidates[0];
    }
    const versionTid = Number(selected?.tid ?? selected);
    const version = versionsById.get(versionTid);
    if (!version || version.draw_lib !== drawLib) fantasyDrawFail(305, 'Demigod draw version is not open');
    return version;
  }

  function assertGroups(weightConfig) {
    for (const drawLib of groupIds(weightConfig)) {
      const row = groupResolver(drawLib);
      const rewards = Array.isArray(row) ? row : row?.lib_range;
      if (!Array.isArray(rewards) || !rewards.length) {
        fantasyDrawFail(5, `Demigod draw group ${drawLib} has no configured rewards`);
      }
    }
  }

  function supports(drawLibValue) {
    return versionsByLib.has(Number(drawLibValue));
  }

  function execute(model, request, { seconds, maxDrawCount }) {
    const drawLib = Number(request?.draw_lib);
    if (!versionsByLib.has(drawLib)) fantasyDrawFail(5, 'Demigod draw library is not registered');
    const version = versionFor(drawLib, model, seconds);
    if (typeof assertOpen === 'function') {
      const gate = assertFantasyDrawSync(assertOpen({ model, version, drawLib, seconds }), 'Demigod draw activity gate');
      if (!gateIsOpen(gate)) fantasyDrawFail(305, 'Demigod draw activity is not open');
    }

    const drawConfig = heroTables.Draw.get(drawLib);
    const guaranteeConfig = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
    const weightConfig = tables.DrawLibWeight.get(Number(drawConfig?.group_weight));
    const guaranteeThreshold = positiveConfig(guaranteeConfig?.guaranteed_num, 'guarantee threshold');
    if (!drawConfig || !weightConfig) fantasyDrawFail(5, 'Demigod draw configuration is missing');
    const normalized = normalizeFantasyDrawRequest(request, drawConfig, { maxDrawCount });
    assertGroups(weightConfig);

    const fantasyRow = tables.DemigodDrawFantasy.get(version.tid);
    const candidateTids = Array.isArray(fantasyRow?.draw_fantasy) ? fantasyRow.draw_fantasy.map(Number) : [];
    if (!candidateTids.length) fantasyDrawFail(5, `Demigod draw version ${version.tid} has no fantasy candidates`);
    const candidateSet = new Set(candidateTids);

    const current = inventory.read(model);
    const poolKey = `demigod:${version.tid}:${drawLib}`;
    const { state } = readFantasyDrawPoolState(model, poolKey, { drawLib, version: version.tid, seconds });
    const cost = consumeResources(model, normalized.costs, 301);
    const awards = [], selectedGroups = [];

    for (let index = 0; index < normalized.count; index++) {
      const nextGuarantee = Number(state.guaranteed_count) + 1;
      const forced = nextGuarantee >= guaranteeThreshold;
      const group = rollFantasyWeightedGroup({
        weightConfig,
        guaranteed: forced,
        resolveGroup: groupResolver,
        random
      });
      const reward = rollFantasyGroupReward(group, random);
      if (tables.FantasyEquip.has(reward.tid) && !candidateSet.has(reward.tid)) {
        fantasyDrawFail(5, `Demigod draw reward ${reward.tid} is not a candidate for version ${version.tid}`);
      }
      awards.push(reward);
      selectedGroups.push(group.groupId);
      state.guaranteed_count = group.resetGuarantee ? '0' : String(nextGuarantee);
    }

    const equipmentAwards = awards.filter(value => tables.FantasyEquip.has(value.tid));
    const resourceAwards = awards.filter(value => !tables.FantasyEquip.has(value.tid));
    const reward = resourceAwards.length
      ? grantResources(model, resourceAwards.map(value => [value.tid, value.num]), tables)
      : { changes: [] };
    const equipmentChanges = equipmentAwards.length
      ? equipmentRewardChanges({ inventory, current, awards: equipmentAwards, codec, maxInstances: maxDrawCount })
      : [];
    if (equipmentAwards.length) inventory.save(model, current);

    recordFantasyDraw(state, { count: normalized.count, groups: selectedGroups, seconds });
    const recruitInfo = fantasyDrawRecruitInfo(state, seconds);
    const value = {
      res: { changes: [...cost.changes, ...reward.changes, ...equipmentChanges], is_overflow: false },
      recruit_info: recruitInfo,
      decompose_args: [],
      pre_args: []
    };

    return {
      value,
      count: normalized.count,
      poolState: state,
      event: {
        kind: 'fantasy_draw',
        pool: POOL_NAME,
        drawLib,
        version: version.tid,
        count: normalized.count,
        groups: selectedGroups,
        awards,
        totalDrawCount: state.total_draw_count
      },
      valueForLog: {
        pool: POOL_NAME,
        draw_lib: drawLib,
        version: version.tid,
        draw_count: normalized.count,
        group_ids: selectedGroups,
        awards
      },
      pushEvents: []
    };
  }

  return { name: POOL_NAME, drawLibs, supports, execute, versionsById, versionsByLib };
}
