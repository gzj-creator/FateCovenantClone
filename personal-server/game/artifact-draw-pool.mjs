import { consumeResources, grantResources } from './resources.mjs';
import {
  assertFantasyDrawSync,
  fantasyDrawFail,
  fantasyDrawRecruitInfo,
  normalizeFantasyDrawRequest,
  readFantasyDrawPoolState,
  recordFantasyDraw,
  rollFantasyGroupReward,
  rollFantasyWeightedGroup
} from './fantasy-shared-draw-service.mjs';

const POOL_NAME = 'artifact';

function positiveConfig(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) {
    fantasyDrawFail(5, `Invalid artifact draw configuration: ${field}`);
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
 * Standard draw type 601 for ArtifactDrawVersion rows. The version table owns
 * the draw_lib mapping; activity membership/windows are deliberately injected
 * by M4/M6 because the static version table does not contain a time window.
 */
export function createArtifactDrawPool({
  tables,
  heroTables,
  random = Math.random,
  resolveVersion = null,
  resolveGroup = null,
  assertOpen = null
} = {}) {
  if (!(tables?.ArtifactDrawVersion instanceof Map) || !(tables?.DrawLibWeight instanceof Map) || !(tables?.DrawGroup instanceof Map)) {
    throw new Error('Artifact draw tables are missing');
  }
  if (!(heroTables?.Draw instanceof Map) || !(heroTables?.Guaranteed instanceof Map)) {
    throw new Error('Artifact hero draw tables are missing');
  }

  const versionsById = new Map();
  const versionsByLib = new Map();
  for (const row of tables.ArtifactDrawVersion.values()) {
    const version = positiveConfig(row?.tid, 'version tid');
    const drawLib = positiveConfig(row?.draw_lib, 'draw library');
    if (versionsById.has(version)) throw new Error(`Duplicate artifact draw version: ${version}`);
    const normalized = { ...row, tid: version, draw_lib: drawLib };
    versionsById.set(version, normalized);
    const list = versionsByLib.get(drawLib) ?? [];
    list.push(normalized);
    versionsByLib.set(drawLib, list);
  }
  for (const [drawLib, list] of versionsByLib) {
    if (list.length !== 1) throw new Error(`Artifact draw library is ambiguous: ${drawLib}`);
  }
  const drawLibs = [...versionsByLib.keys()].sort((a, b) => a - b);
  if (!drawLibs.length) throw new Error('Artifact draw configuration is empty');

  const groupResolver = drawLib => typeof resolveGroup === 'function'
    ? resolveGroup(drawLib)
    : tables.DrawGroup.get(drawLib);

  function versionFor(drawLib, model, seconds) {
    let selected;
    if (typeof resolveVersion === 'function') {
      selected = assertFantasyDrawSync(resolveVersion({ drawLib, model, seconds }), 'Artifact draw version resolver');
    } else {
      const candidates = versionsByLib.get(drawLib) ?? [];
      if (candidates.length !== 1) fantasyDrawFail(305, 'Artifact draw version is not uniquely resolved');
      selected = candidates[0];
    }
    const versionTid = Number(selected?.tid ?? selected);
    const version = versionsById.get(versionTid);
    if (!version || version.draw_lib !== drawLib) fantasyDrawFail(305, 'Artifact draw version is not open');
    return version;
  }

  function assertGroups(weightConfig) {
    for (const drawLib of groupIds(weightConfig)) {
      const row = groupResolver(drawLib);
      const rewards = Array.isArray(row) ? row : row?.lib_range;
      if (!Array.isArray(rewards) || !rewards.length) {
        fantasyDrawFail(5, `Artifact draw group ${drawLib} has no configured rewards`);
      }
    }
  }

  function supports(drawLibValue) {
    return versionsByLib.has(Number(drawLibValue));
  }

  function execute(model, request, { seconds, maxDrawCount }) {
    const drawLib = Number(request?.draw_lib);
    if (!versionsByLib.has(drawLib)) fantasyDrawFail(5, 'Artifact draw library is not registered');
    const version = versionFor(drawLib, model, seconds);
    if (typeof assertOpen === 'function') {
      const gate = assertFantasyDrawSync(assertOpen({ model, version, drawLib, seconds }), 'Artifact draw activity gate');
      if (!gateIsOpen(gate)) fantasyDrawFail(305, 'Artifact draw activity is not open');
    }

    const drawConfig = heroTables.Draw.get(drawLib);
    const guaranteeConfig = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
    const weightConfig = tables.DrawLibWeight.get(Number(drawConfig?.group_weight));
    const guaranteeThreshold = positiveConfig(guaranteeConfig?.guaranteed_num, 'guarantee threshold');
    if (!drawConfig || !weightConfig) fantasyDrawFail(5, 'Artifact draw configuration is missing');
    const normalized = normalizeFantasyDrawRequest(request, drawConfig, { maxDrawCount });
    assertGroups(weightConfig);

    const poolKey = `artifact:${version.tid}:${drawLib}`;
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
      awards.push(reward);
      selectedGroups.push(group.groupId);
      state.guaranteed_count = group.resetGuarantee ? '0' : String(nextGuarantee);
    }

    const reward = grantResources(model, awards.map(value => [value.tid, value.num]), tables);
    recordFantasyDraw(state, { count: normalized.count, groups: selectedGroups, seconds });
    const recruitInfo = fantasyDrawRecruitInfo(state, seconds);
    const value = {
      res: { changes: [...cost.changes, ...reward.changes], is_overflow: false },
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
