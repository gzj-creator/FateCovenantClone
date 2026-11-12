import { GameError } from './hero-progression.mjs';
import { grantResources, consumeResources } from './resources.mjs';
import { DEFAULT_RESET_HOUR, DEFAULT_TIMEZONE_OFFSET_SECONDS } from './time.mjs';
import {
  createFantasyEquipmentInventory,
  FANTASY_EQUIP_ITEM_TYPE
} from './fantasy-equipment-inventory.mjs';

const INT32_MAX = 2147483647;
const DAY_SECONDS = 86400;
const DEFAULT_RESET_OFFSET_SECONDS = DEFAULT_TIMEZONE_OFFSET_SECONDS - DEFAULT_RESET_HOUR * 3600;
const DEFAULT_MAX_TASK_IDS = 100;
const DEFAULT_MAX_CELLS = 10000;
const ARTIFACT_DRAW_STATE_VERSION = 1;
const ARTIFACT_DRAW_STATE_KEY = 'artifactDrawActs';
export const ARTIFACT_DRAW_FUNC_ID = 159;
export const ARTIFACT_DRAW_TASK_MULTI = 1000;
const TASK_DAILY = 0;
const TASK_PERIOD = 1;

export const ARTIFACT_DRAW_ACT_COMMANDS = Object.freeze({
  101801: { request: 'pb_req_artifact_trials_daily_reward_req', response: 'pb_res_to_client' },
  101802: { request: 'pb_artifact_draw_task_award_req', response: 'pb_artifact_draw_task_award_rsp' },
  101803: { request: 'pb_artifact_fragments_draw_req', response: 'pb_artifact_fragments_draw_rsp' },
  101804: { request: 'pb_artifact_fragments_new_turn_req', response: 'pb_fragments_draw_info' },
  101805: { request: 'pb_artifact_fragments_claim_req', response: 'pb_artifact_fragments_claim_rsp' },
  101806: { request: 'pb_artifact_fragments_synthesis_req', response: 'pb_artifact_fragments_synthesis_rsp' }
});

const fail = (code, message) => { throw new GameError(code, message); };

function integer(value, field, { min = 0, max = INT32_MAX } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, `Invalid artifact activity ${field}`);
  return number;
}

function configInteger(value, field, { min = 0, max = INT32_MAX } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(5, `Invalid artifact activity configuration: ${field}`);
  return number;
}

function safeUnsigned(value, field) {
  const text = String(value ?? 0);
  if (!/^\d+$/.test(text)) fail(5, `Invalid artifact activity ${field}`);
  const number = BigInt(text);
  if (number > 18446744073709551615n) fail(5, `Artifact activity ${field} is too large`);
  return number;
}

function addUnsigned(value, amount, field) {
  const result = safeUnsigned(value, field) + BigInt(amount);
  if (result > 18446744073709551615n) fail(5, `Artifact activity ${field} overflow`);
  return result.toString();
}

function dayIndex(seconds, resetOffsetSeconds) {
  return Math.floor((seconds + resetOffsetSeconds) / DAY_SECONDS);
}

function dayStart(seconds, resetOffsetSeconds) {
  return Math.max(0, dayIndex(seconds, resetOffsetSeconds) * DAY_SECONDS - resetOffsetSeconds);
}

function uniqueIds(values, field, max = DEFAULT_MAX_TASK_IDS) {
  if (!Array.isArray(values) || values.length < 1 || values.length > max) fail(1, `Invalid artifact activity ${field}`);
  const result = values.map(value => integer(value, field, { min: 1 }));
  if (new Set(result).size !== result.length) fail(1, `Duplicate artifact activity ${field}`);
  return result;
}

function normalizeAwards(awards, field = 'award') {
  if (!Array.isArray(awards) || awards.length < 1) fail(5, `Invalid artifact activity ${field} configuration`);
  return awards.map(pair => {
    if (!Array.isArray(pair) || pair.length < 2) fail(5, `Invalid artifact activity ${field} configuration`);
    return [configInteger(pair[0], `${field} tid`, { min: 1 }), configInteger(pair[1], `${field} quantity`, { min: 1 })];
  });
}

function normalizeRevealed(row, index) {
  const tid = integer(row?.tid, 'revealed reward tid', { min: 1 });
  const num = integer(row?.num, 'revealed reward quantity', { min: 1 });
  const cell = integer(row?.index ?? index, 'revealed reward index', { min: 1 });
  return { tid, num, index: cell };
}

function bitset(indices) {
  if (!Array.isArray(indices) || !indices.length) return Buffer.alloc(0);
  const maximum = Math.max(...indices.map(value => integer(value, 'bit index', { min: 1 })));
  const bytes = Buffer.alloc(Math.floor(maximum / 8) + 1);
  for (const index of indices) bytes[Math.floor(index / 8)] |= 1 << (index % 8);
  return bytes;
}

function emptyCounters() {
  return { special_draws: 0, fragment_draws: 0, trial_fights: 0, synthesis_count: 0, recharge_value: 0 };
}

function emptyActivity(actTid, versionId, seconds, resetOffsetSeconds) {
  return {
    act_tid: actTid,
    version: versionId,
    created_at: seconds,
    daily_time: dayStart(seconds, resetOffsetSeconds),
    daily: { claims: [], counters: emptyCounters() },
    period: { claims: [], counters: emptyCounters() },
    fight_record: {
      mission_tid: 0,
      last_fight_time_sec: 0,
      acc_dmg: '0',
      max_dmg: '0',
      claimed_tasks: []
    },
    fragments: {
      turn: 1,
      turn_over: false,
      draw_times: 0,
      free_draws_used: 0,
      bomb_pos: [],
      jackpot_pos: [],
      custom_list: [],
      claimed_list: [],
      unclaimed_list: []
    },
    server: { cur_turn: 1, settle_turn: [] },
    is_synthesis: false,
    is_get_supply: false,
    recharge_info: { refresh_time: 0, buy_num_list: [] },
    normal_award_count: 0
  };
}

function validateActivity(state, actTid, versionId) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) fail(5, 'Artifact activity persistent state is invalid');
  if (Number(state.act_tid) !== actTid || Number(state.version) !== versionId) fail(5, 'Artifact activity identity is invalid');
  if (!Array.isArray(state.daily?.claims) || !Array.isArray(state.period?.claims)) fail(5, 'Artifact activity claim state is invalid');
  if (!state.fragments || !Array.isArray(state.fragments.unclaimed_list) || !Array.isArray(state.fragments.claimed_list)) fail(5, 'Artifact fragment state is invalid');
  if (!state.server || !Array.isArray(state.server.settle_turn)) fail(5, 'Artifact server turn state is invalid');
  for (const value of [state.fragments.turn, state.fragments.draw_times, state.fragments.free_draws_used]) integer(value, 'fragment counter');
  safeUnsigned(state.fight_record?.acc_dmg, 'trial accumulated damage');
  safeUnsigned(state.fight_record?.max_dmg, 'trial maximum damage');
  return state;
}

export function artifactDrawTaskBitIndex(taskId) {
  return integer(taskId, 'task bit index', { min: 1 }) % ARTIFACT_DRAW_TASK_MULTI;
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

function counterProgress(activity, taskType, useDaily) {
  const counters = useDaily ? activity.daily.counters : activity.period.counters;
  switch (Number(taskType)) {
    // Static task rows do not carry human-readable names. These mappings are
    // explicit production assumptions backed by the four action families.
    case 1402: return Number(counters.special_draws ?? 0);
    case 1002: return Number(counters.fragment_draws ?? 0);
    case 7002: return Number(counters.fragment_draws ?? 0);
    case 6508: return Number(counters.trial_fights ?? 0);
    case 8302: return Number(counters.recharge_value ?? 0);
    case 12401: return Number(counters.synthesis_count ?? 0);
    default: return 0;
  }
}

function rewardKey(award) {
  return `${award.tid}:${award.num}:${award.index}`;
}

export function createArtifactDrawActService({
  store,
  codec,
  tables,
  heroTables = null,
  inventory = null,
  now = () => Math.floor(Date.now() / 1000),
  random = Math.random,
  resetOffsetSeconds = DEFAULT_RESET_OFFSET_SECONDS,
  maxTaskIds = DEFAULT_MAX_TASK_IDS,
  maxCells = DEFAULT_MAX_CELLS,
  assertOpen = null,
  assertChallengeOpen = null,
  bombPlanner = null,
  resolveNormalAward = null,
  logger = () => {}
} = {}) {
  if (!store || typeof store.transaction !== 'function') throw new Error('Artifact activity store is required');
  if (!codec || typeof codec.pack !== 'function' || typeof codec.unpack !== 'function') throw new Error('Artifact activity codec is required');
  for (const name of ['Activity', 'ArtifactDrawVersion', 'ArtifactDrawRate', 'ArtifactDrawRound', 'ArtifactDrawTask', 'TrialsTask', 'TrialsChallenge', 'Item']) {
    if (!(tables?.[name] instanceof Map)) throw new Error(`Artifact activity table is missing: ${name}`);
  }
  const resetOffset = configInteger(resetOffsetSeconds, 'reset offset', { min: 0, max: DAY_SECONDS - 1 });
  const taskLimit = configInteger(maxTaskIds, 'maximum task ids', { min: 1, max: 10000 });
  const cellLimit = configInteger(maxCells, 'maximum board cells', { min: 1, max: 100000 });
  const equipmentInventory = inventory ?? createFantasyEquipmentInventory({ codec, tables });

  // ActivityTable rows are the authoritative business activity ids. In the
  // current client data these are 159001..159014; their `version` values map to
  // ArtifactDrawVersion.tid 1..14. Version ids are accepted only by the internal
  // M3 callback and must resolve to exactly one real activity id.
  const artifactActivities = new Map();
  const actTidsByVersion = new Map();
  for (const row of tables.Activity.values()) {
    if (Number(row?.func) !== ARTIFACT_DRAW_FUNC_ID) continue;
    const actTid = configInteger(row.tid, 'activity tid', { min: 1 });
    const versionId = configInteger(row.version, 'activity version', { min: 1 });
    if (artifactActivities.has(actTid)) fail(5, `Duplicate artifact activity id ${actTid}`);
    artifactActivities.set(actTid, row);
    const actTids = actTidsByVersion.get(versionId) ?? [];
    actTids.push(actTid);
    actTidsByVersion.set(versionId, actTids);
  }

  const log = event => { try { logger(event); } catch {} };
  const secondsNow = () => integer(now(), 'server time', { min: 0, max: INT32_MAX });
  const sample = () => {
    const value = Number(random());
    if (!(value >= 0 && value < 1)) fail(5, 'Artifact activity random source returned an invalid value');
    return value;
  };

  function versionFor(actTidValue) {
    const actTid = integer(actTidValue, 'activity id', { min: 1 });
    const activityRow = artifactActivities.get(actTid);
    if (!activityRow) fail(1, 'Unknown artifact activity id');
    const versionId = Number(activityRow.version);
    const version = tables.ArtifactDrawVersion.get(versionId);
    if (!version) fail(1, 'Unknown artifact activity id');
    if (Number(version.tid) !== versionId) fail(5, 'Artifact activity version identity is invalid');
    return { actTid, versionId, version, activityRow };
  }

  function actTidForVersion(versionIdValue) {
    const versionId = integer(versionIdValue, 'activity version', { min: 1 });
    if (!tables.ArtifactDrawVersion.has(versionId)) fail(1, 'Unknown artifact activity version');
    const actTids = actTidsByVersion.get(versionId) ?? [];
    if (actTids.length !== 1) fail(5, `Artifact activity version ${versionId} must resolve to exactly one activity id`);
    const actTid = actTids[0];
    return { actTid, versionId };
  }

  function gateIsOpen(result) {
    if (result === false) return false;
    if (result && typeof result === 'object') return result.open !== false && result.allowed !== false && result.closed !== true;
    return true;
  }

  function assertActivityOpen(model, actTid, version, seconds) {
    if (typeof assertOpen !== 'function') return;
    const result = assertOpen({ model, actTid, version, seconds });
    if (result && typeof result.then === 'function') fail(5, 'Artifact activity gate must be synchronous');
    if (!gateIsOpen(result)) fail(305, 'Artifact activity is not open');
  }

  function root(model) {
    model.state[ARTIFACT_DRAW_STATE_KEY] ??= { version: ARTIFACT_DRAW_STATE_VERSION, activities: {} };
    const state = model.state[ARTIFACT_DRAW_STATE_KEY];
    if (!state || state.version !== ARTIFACT_DRAW_STATE_VERSION || !state.activities || typeof state.activities !== 'object' || Array.isArray(state.activities)) {
      fail(5, 'Artifact activity persistent registry is invalid');
    }
    return state.activities;
  }

  function refreshDaily(activity, seconds) {
    const currentDay = dayIndex(seconds, resetOffset);
    if (dayIndex(Number(activity.daily_time), resetOffset) >= currentDay) return false;
    activity.daily_time = dayStart(seconds, resetOffset);
    activity.daily = { claims: [], counters: emptyCounters() };
    // Trial tasks are daily. Damage and award bits reset with the same server day.
    activity.fight_record.acc_dmg = '0';
    activity.fight_record.max_dmg = '0';
    activity.fight_record.claimed_tasks = [];
    return true;
  }

  function activityFor(model, actTid, seconds) {
    const { versionId, version } = versionFor(actTid);
    const activities = root(model);
    const key = String(actTid);
    let activity = activities[key];
    if (!activity) {
      activity = emptyActivity(actTid, versionId, seconds, resetOffset);
      activities[key] = activity;
    }
    validateActivity(activity, actTid, versionId);
    const changed = refreshDaily(activity, seconds);
    return { activity, versionId, version, refreshed: changed };
  }

  function fragmentCells(version) {
    if (!Array.isArray(version.board_shape) || version.board_shape.length < 2) fail(5, 'Artifact board shape is missing');
    const width = configInteger(version.board_shape[0], 'board width', { min: 1 });
    const height = configInteger(version.board_shape[1], 'board height', { min: 1 });
    const size = width * height;
    if (!Number.isSafeInteger(size) || size > cellLimit) fail(5, 'Artifact board is too large');
    return size;
  }

  function roundFor(version, turn) {
    for (const row of tables.ArtifactDrawRound.values()) {
      if (Number(row.version) === Number(version.tid) && Number(row.turn) === turn) return row;
    }
    fail(305, 'Artifact fragment round is not configured');
  }

  function maxTurnFor(versionId) {
    const turns = [...tables.ArtifactDrawRound.values()]
      .filter(row => Number(row.version) === Number(versionId))
      .map(row => Number(row.turn));
    const maximum = Math.max(...turns);
    if (!Number.isSafeInteger(maximum) || maximum < 1) fail(5, 'Artifact fragment turn configuration is missing');
    return maximum;
  }

  function flopIsOver(activity) {
    const fragments = activity.fragments;
    if (!fragments.turn_over || fragments.unclaimed_list.length) return false;
    return Number(fragments.turn) >= maxTurnFor(activity.version) || fragments.jackpot_pos.length > 0;
  }

  function taskRows(versionId) {
    return [...tables.ArtifactDrawTask.values()].filter(row => Number(row.version) === versionId);
  }

  function trialTasks(versionId) {
    return [...tables.TrialsTask.values()].filter(row => Number(row.level_tid) === versionId);
  }

  function claimStateBytes(activity, kind) {
    const claims = kind === 'daily' ? activity.daily.claims : kind === 'period' ? activity.period.claims : activity.fight_record.claimed_tasks;
    // ArtifactDrawActMgr.GetTaskIndex(task_id) is task_id % 1000. Daily,
    // period, and trial states are separate bit blocks and must not share bits.
    return bitset(claims.map(taskId => artifactDrawTaskBitIndex(taskId)));
  }

  function fragmentsInfo(activity) {
    const value = activity.fragments;
    return {
      turn: Number(value.turn),
      turn_over: Boolean(value.turn_over),
      draw_times: Number(value.draw_times),
      bomb_pos: value.bomb_pos.map(Number),
      jackpot_pos: value.jackpot_pos.map(Number),
      custom_list: value.custom_list.map(row => ({ index: Number(row.index), tid: Number(row.tid) })),
      claimed_list: value.claimed_list.map(row => ({ tid: Number(row.tid), num: Number(row.num), index: Number(row.index) })),
      unclaimed_list: value.unclaimed_list.map(row => ({ tid: Number(row.tid), num: Number(row.num), index: Number(row.index) }))
    };
  }

  function playerPb(activity) {
    return {
      act_tid: activity.act_tid,
      is_synthesis: Boolean(activity.is_synthesis),
      daily_time: activity.daily_time,
      daily_award_state: claimStateBytes(activity, 'daily'),
      period_award_state: claimStateBytes(activity, 'period'),
      recharge_info: { refresh_time: Number(activity.recharge_info?.refresh_time ?? 0), buy_num_list: [] },
      fragments_draw_info: fragmentsInfo(activity),
      fight_record: {
        mission_tid: Number(activity.fight_record.mission_tid),
        last_fight_time_sec: Number(activity.fight_record.last_fight_time_sec),
        acc_dmg: String(activity.fight_record.acc_dmg),
        max_dmg: String(activity.fight_record.max_dmg),
        award_state: claimStateBytes(activity, 'trials')
      },
      is_get_supply: Boolean(activity.is_get_supply)
    };
  }

  function serverPb(activity) {
    return { act_tid: activity.act_tid, cur_turn: Number(activity.server.cur_turn), settle_turn: activity.server.settle_turn.map(Number) };
  }

  function packNestedSafeReward(model, tid, num) {
    const item = tables.Item.get(tid);
    if (!item) fail(5, 'Artifact reward item is not configured');
    if (Number(item.type) !== FANTASY_EQUIP_ITEM_TYPE) return null;
    return { tid, num };
  }

  function grantAwards(model, awards) {
    if (!Array.isArray(awards) || awards.length === 0) return { changes: [] };
    const resourceAwards = [], equipmentAwards = [];
    for (const award of awards) {
      const pair = Array.isArray(award) ? award : [award.tid, award.num];
      const tid = configInteger(pair[0], 'reward tid', { min: 1 });
      const num = configInteger(pair[1], 'reward quantity', { min: 1 });
      const equipment = packNestedSafeReward(model, tid, num);
      if (equipment) equipmentAwards.push(equipment); else resourceAwards.push([tid, num]);
    }
    const changes = [];
    if (resourceAwards.length) changes.push(...grantResources(model, resourceAwards, tables).changes);
    if (equipmentAwards.length) {
      if (!equipmentInventory || typeof equipmentInventory.read !== 'function') fail(5, 'Fantasy equipment inventory is required for this reward');
      const current = equipmentInventory.read(model);
      for (const award of equipmentAwards) {
        for (let i = 0; i < award.num; i++) {
          const equip = equipmentInventory.create(current, award.tid);
          changes.push({
            tid: String(award.tid),
            new_num: String(i + 1),
            diff_num: '1',
            extra: codec.pack('pb_fantasy_equip', equip)
          });
        }
      }
      equipmentInventory.save(model, current);
    }
    return { changes };
  }

  function normalAward({ model, version, cell, drawTimes, seconds }) {
    if (typeof resolveNormalAward === 'function') {
      const value = resolveNormalAward({ model, version, cell, drawTimes, seconds, random: sample });
      if (value && typeof value.then === 'function') fail(5, 'Artifact normal award resolver must be synchronous');
      if (!value) fail(5, 'Artifact normal award resolver returned no reward');
      return normalizeRevealed(value, cell);
    }
    const draw = heroTables?.Draw?.get(Number(version.draw_lib));
    const weight = draw && tables.DrawLibWeight?.get(Number(draw.group_weight));
    if (!draw || !weight || !Array.isArray(weight.weight_group) || !weight.weight_group.length) {
      fail(5, 'Artifact normal award configuration is missing');
    }
    let total = 0;
    const groups = weight.weight_group.map(entry => {
      if (!Array.isArray(entry) || entry.length < 2) fail(5, 'Artifact group weight configuration is invalid');
      const entryWeight = configInteger(entry[0], 'group weight');
      total += entryWeight;
      return { weight: entryWeight, group: configInteger(entry[1], 'group id', { min: 1 }) };
    });
    if (total <= 0) fail(5, 'Artifact group weight configuration is empty');
    let cursor = sample() * total, selected = groups[groups.length - 1].group;
    for (const group of groups) { cursor -= group.weight; if (cursor < 0) { selected = group.group; break; } }
    const rows = tables.DrawGroup?.get(selected)?.lib_range;
    if (!Array.isArray(rows) || !rows.length) fail(5, 'Artifact draw group is empty');
    total = 0;
    const rewards = rows.map(row => {
      if (!Array.isArray(row) || row.length < 3) fail(5, 'Artifact draw group reward is invalid');
      const rowWeight = configInteger(row[0], 'award weight');
      total += rowWeight;
      return { weight: rowWeight, tid: configInteger(row[1], 'award tid', { min: 1 }), num: configInteger(row[2], 'award quantity', { min: 1 }) };
    });
    if (total <= 0) fail(5, 'Artifact draw group weight is empty');
    cursor = sample() * total;
    for (const row of rewards) { cursor -= row.weight; if (cursor < 0) return { tid: row.tid, num: row.num, index: cell }; }
    const last = rewards[rewards.length - 1];
    return { tid: last.tid, num: last.num, index: cell };
  }

  function jackpotWon(round, drawTimes) {
    const rateIds = Array.isArray(round.jackpot_rate) ? round.jackpot_rate : [];
    const rate = rateIds.map(id => tables.ArtifactDrawRate.get(Number(id))).find(row => Number(row?.draw_times) === drawTimes);
    if (!rate) fail(5, 'Artifact jackpot rate is missing');
    const weight = configInteger(rate.weight, 'jackpot weight', { min: 0, max: 10000 });
    return sample() * 10000 < weight;
  }

  function assertTaskBatch(versionId, ids, source) {
    const tasks = source === 'trials' ? trialTasks(versionId) : taskRows(versionId);
    const byId = new Map(tasks.map(row => [Number(row.tid), row]));
    const rows = ids.map(id => byId.get(Number(id)));
    if (rows.some(row => !row)) fail(1, 'Artifact task does not belong to this activity');
    return rows;
  }

  function markClaim(list, taskId) {
    addUnique(list, taskId);
  }

  function execute101801(request) {
    const actTid = integer(request?.act_tid, 'activity id', { min: 1 });
    const challengeTid = integer(request?.challenge_tid, 'challenge id', { min: 1 });
    const taskIds = uniqueIds(request?.task_id, 'trial task ids', taskLimit);
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version, versionId } = activityFor(model, actTid, seconds);
      assertActivityOpen(model, actTid, version, seconds);
      const challenge = tables.TrialsChallenge.get(challengeTid);
      if (!challenge || Number(challenge.version) !== versionId) fail(1, 'Unknown artifact trial challenge');
      if (typeof assertChallengeOpen === 'function') {
        const result = assertChallengeOpen({ model, activity, version, challenge, seconds });
        if (result && typeof result.then === 'function') fail(5, 'Artifact challenge gate must be synchronous');
        if (!gateIsOpen(result)) fail(305, 'Artifact trial challenge is not open');
      }
      if (Number(activity.fight_record.mission_tid) !== Number(challenge.fight_tid)) fail(308, 'Artifact trial fight record is missing');
      const rows = assertTaskBatch(versionId, taskIds, 'trials');
      const claimed = new Set(activity.fight_record.claimed_tasks.map(Number));
      const allClaimed = rows.every(row => claimed.has(Number(row.tid)));
      if (allClaimed) {
        const value = { changes: [], is_overflow: false };
        return { value, data: codec.pack('pb_res_to_client', value) };
      }
      if (rows.some(row => claimed.has(Number(row.tid)))) fail(310, 'Artifact trial task is partially claimed');
      for (const row of rows) {
        const progress = Number(row.task_type) === 1803
          ? Number(activity.daily.counters.trial_fights)
          : Number(activity.fight_record.acc_dmg);
        if (progress < Number(row.task_count)) fail(308, 'Artifact trial task is not complete');
      }
      const awards = rows.flatMap(row => normalizeAwards(row.award, 'trial task award'));
      const granted = grantAwards(model, awards);
      for (const row of rows) markClaim(activity.fight_record.claimed_tasks, Number(row.tid));
      const value = { changes: granted.changes, is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
  }

  function execute101802(request) {
    const actTid = integer(request?.act_tid, 'activity id', { min: 1 });
    const taskIds = uniqueIds(request?.task_ids, 'task ids', taskLimit);
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version, versionId } = activityFor(model, actTid, seconds);
      assertActivityOpen(model, actTid, version, seconds);
      const rows = assertTaskBatch(versionId, taskIds, 'draw');
      const awards = [];
      for (const row of rows) {
        const useDaily = Number(row.keep_type) === TASK_DAILY;
        const claims = useDaily ? activity.daily.claims : activity.period.claims;
        if (claims.map(Number).includes(Number(row.tid))) fail(310, 'Artifact task reward already claimed');
        const progress = counterProgress(activity, row.task_type, useDaily);
        if (progress < Number(row.task_count)) fail(308, 'Artifact task is not complete');
        awards.push(...normalizeAwards(row.award, 'artifact task award'));
      }
      const granted = grantAwards(model, awards);
      for (const row of rows) {
        const useDaily = Number(row.keep_type) === TASK_DAILY;
        markClaim(useDaily ? activity.daily.claims : activity.period.claims, Number(row.tid));
      }
      const value = {
        res: { changes: granted.changes, is_overflow: false },
        daily_award_state: claimStateBytes(activity, 'daily'),
        period_award_state: claimStateBytes(activity, 'period')
      };
      return { value, data: codec.pack('pb_artifact_draw_task_award_rsp', value) };
    });
  }

  function execute101803(request) {
    const actTid = integer(request?.act_tid, 'activity id', { min: 1 });
    const index = integer(request?.index, 'fragment index', { min: 1 });
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version } = activityFor(model, actTid, seconds);
      assertActivityOpen(model, actTid, version, seconds);
      const boardSize = fragmentCells(version);
      if (index > boardSize) fail(1, 'Artifact fragment index is outside the board');
      const fragments = activity.fragments;
      if (fragments.turn_over) fail(308, 'Artifact fragment turn is already over');
      if (fragments.draw_times >= 30) fail(308, 'Artifact fragment draw limit reached');
      const occupied = new Set([
        ...fragments.unclaimed_list.map(row => Number(row.index)),
        ...fragments.claimed_list.map(row => Number(row.index)),
        ...fragments.bomb_pos.map(Number),
        ...fragments.jackpot_pos.map(Number)
      ]);
      if (occupied.has(index)) fail(1, 'Artifact fragment cell has already been drawn');
      const freeUsed = Number(fragments.free_draws_used), freeLimit = Number(version.free_draw_before_num ?? 0);
      const freeTid = Number(version.free_draw_before_item ?? 0), paidTid = Number(version.draw_before_item ?? 0);
      let costTid = paidTid;
      if (freeUsed < freeLimit && freeTid > 0 && BigInt(model.resources.get(String(freeTid))?.num ?? 0) >= 1n) costTid = freeTid;
      if (!costTid) fail(5, 'Artifact fragment draw cost is missing');
      const cost = consumeResources(model, [[costTid, 1]], 301);
      if (costTid === freeTid) fragments.free_draws_used = freeUsed + 1;
      const nextTimes = Number(fragments.draw_times) + 1;
      const round = roundFor(version, Number(fragments.turn));
      const bomb = typeof bombPlanner === 'function'
        ? Boolean(bombPlanner({ model, activity, version, round, turn: fragments.turn, drawTimes: nextTimes, cell: index, seconds }))
        : false;
      let awards = [];
      let gotSpecial = false;
      if (bomb) {
        fragments.bomb_pos.push(index);
        fragments.turn_over = true;
      } else if (jackpotWon(round, nextTimes)) {
        gotSpecial = true;
        const award = normalizeRevealed({ tid: round.jackpot_tid, num: round.jackpot_num, index }, index);
        awards.push(award);
        fragments.jackpot_pos.push(index);
        fragments.turn_over = true;
      } else {
        awards.push(normalAward({ model, version, cell: index, drawTimes: nextTimes, seconds }));
      }
      fragments.draw_times = nextTimes;
      if (fragments.draw_times >= 30) fragments.turn_over = true;
      for (const award of awards) addUnique(fragments.unclaimed_list, award);
      if (awards.length) activity.normal_award_count = Number(activity.normal_award_count ?? 0) + (gotSpecial ? 0 : 1);
      activity.period.counters.fragment_draws = Number(activity.period.counters.fragment_draws) + 1;
      activity.daily.counters.fragment_draws = Number(activity.daily.counters.fragment_draws) + 1;
      const value = {
        got_special: gotSpecial,
        bomb,
        awards: awards.map(row => ({ ...row })),
        res_changes: { changes: cost.changes, is_overflow: false },
        draw_times: nextTimes
      };
      return { value, data: codec.pack('pb_artifact_fragments_draw_rsp', value) };
    });
  }

  function execute101804(request) {
    const actTid = integer(request?.act_tid, 'activity id', { min: 1 });
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version, versionId } = activityFor(model, actTid, seconds);
      assertActivityOpen(model, actTid, version, seconds);
      const fragments = activity.fragments;
      if (!fragments.turn_over) fail(308, 'Artifact fragment turn is not settled');
      if (fragments.unclaimed_list.length) fail(308, 'Artifact fragment rewards are still unclaimed');
      const maxTurn = maxTurnFor(versionId);
      if (Number(fragments.turn) >= maxTurn) fail(308, 'Artifact fragment activity is complete');
      addUnique(activity.server.settle_turn, Number(fragments.turn));
      fragments.turn = Number(fragments.turn) + 1;
      activity.server.cur_turn = Number(fragments.turn);
      fragments.turn_over = false;
      fragments.draw_times = 0;
      fragments.free_draws_used = 0;
      fragments.bomb_pos = [];
      fragments.jackpot_pos = [];
      fragments.custom_list = [];
      fragments.claimed_list = [];
      fragments.unclaimed_list = [];
      const value = fragmentsInfo(activity);
      return { value, data: codec.pack('pb_fragments_draw_info', value) };
    });
  }

  function execute101805(request) {
    const actTid = integer(request?.act_tid, 'activity id', { min: 1 });
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version } = activityFor(model, actTid, seconds);
      assertActivityOpen(model, actTid, version, seconds);
      const fragments = activity.fragments;
      if (!fragments.unclaimed_list.length) fail(308, 'Artifact fragment rewards are already claimed');
      const rows = fragments.unclaimed_list.map((row, index) => normalizeRevealed(row, index + 1));
      const granted = grantAwards(model, rows);
      fragments.claimed_list.push(...rows);
      fragments.unclaimed_list = [];
      const value = { awards: rows.map(row => ({ ...row })), res_changes: { changes: granted.changes, is_overflow: false } };
      return { value, data: codec.pack('pb_artifact_fragments_claim_rsp', value) };
    });
  }

  function execute101806(request) {
    const actTid = integer(request?.act_tid, 'activity id', { min: 1 });
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version } = activityFor(model, actTid, seconds);
      assertActivityOpen(model, actTid, version, seconds);
      if (activity.is_synthesis) fail(310, 'Artifact synthesis is already complete');
      if (!flopIsOver(activity)) fail(308, 'Artifact fragment activity is not complete');
      const chipTid = configInteger(version.special_chip ?? version.clear_item, 'synthesis chip', { min: 1 });
      const awardTid = configInteger(version.special_award ?? version.open_artifact, 'synthesis award', { min: 1 });
      if (BigInt(model.resources.get(String(chipTid))?.num ?? 0) < 1n) fail(301, 'Insufficient artifact synthesis fragments');
      const spent = consumeResources(model, [[chipTid, 1]], 301);
      const granted = grantAwards(model, [[awardTid, 1]]);
      activity.is_synthesis = true;
      activity.period.counters.synthesis_count = Number(activity.period.counters.synthesis_count) + 1;
      activity.daily.counters.synthesis_count = Number(activity.daily.counters.synthesis_count) + 1;
      const value = { res_changes: { changes: [...spent.changes, ...granted.changes], is_overflow: false } };
      return { value, data: codec.pack('pb_artifact_fragments_synthesis_rsp', value) };
    });
  }

  const handlers = { 101801: execute101801, 101802: execute101802, 101803: execute101803, 101804: execute101804, 101805: execute101805, 101806: execute101806 };

  function supports(command) { return Object.hasOwn(handlers, Number(command)); }
  function supports101801() { return true; }
  function supports101802() { return true; }
  function supports101803() { return true; }
  function supports101804() { return true; }
  function supports101805() { return true; }
  function supports101806() { return true; }

  function execute(command, request) {
    log({ event: 'artifact_draw_execute_entry', command, request });
    const id = Number(command);
    if (!supports(id)) fail(5, 'Artifact activity command is not implemented');
    const result = handlers[id](request);
    log({ event: 'artifact_draw_act_command', command: id, act_tid: Number(request?.act_tid ?? 0), bytes: result.data?.length ?? 0 });
    return { command: id, schema: ARTIFACT_DRAW_ACT_COMMANDS[id].response, ...result };
  }

  // M3 can call this inside its existing transaction. No nested transaction is started.
  function onFantasyDraw(model, detail) {
    if (!detail || detail.pool !== 'artifact' || !(Number(detail.count) > 0)) return null;
    let actTid;
    let expectedVersionId = null;
    if (detail.act_tid !== undefined && detail.act_tid !== null) {
      const resolved = versionFor(detail.act_tid);
      actTid = resolved.actTid;
      expectedVersionId = resolved.versionId;
      const rawVersion = detail.version ?? detail.event?.version;
      if (rawVersion !== undefined && rawVersion !== null) {
        const suppliedVersionId = integer(rawVersion, 'artifact activity version', { min: 1 });
        if (suppliedVersionId !== expectedVersionId) fail(5, 'Artifact activity version does not match its activity id');
      }
    } else {
      const rawVersion = detail.version ?? detail.event?.version;
      const resolved = actTidForVersion(rawVersion);
      actTid = resolved.actTid;
      expectedVersionId = resolved.versionId;
    }
    const seconds = integer(detail.seconds ?? secondsNow(), 'server time', { min: 0, max: INT32_MAX });
    const { activity, version, versionId } = activityFor(model, actTid, seconds);
    if (expectedVersionId !== null && Number(expectedVersionId) !== Number(versionId)) {
      fail(5, 'Artifact activity version does not match its activity id');
    }
    assertActivityOpen(model, actTid, version, seconds);
    activity.period.counters.special_draws = Number(activity.period.counters.special_draws) + Number(detail.count);
    activity.daily.counters.special_draws = Number(activity.daily.counters.special_draws) + Number(detail.count);
    return { act_tid: actTid, version: versionId, count: Number(detail.count) };
  }

  function recordArtifactDraw(actTid, count = 1) {
    log({ event: 'artifact_draw_recordArtifactDraw_entry', actTid, count });
    const id = integer(actTid, 'activity id', { min: 1 });
    const amount = integer(count, 'draw count', { min: 1, max: 100000 });
    return store.transaction(model => onFantasyDraw(model, { pool: 'artifact', act_tid: id, count: amount, seconds: secondsNow() }));
  }

  function recordTrialFight(actTid, challengeTid, damage, { cleared = true } = {}) {
    log({ event: 'artifact_draw_recordTrialFight_entry', actTid, challengeTid, damage, cleared });
    const id = integer(actTid, 'activity id', { min: 1 });
    const challengeId = integer(challengeTid, 'challenge id', { min: 1 });
    const dealt = BigInt(integer(damage, 'trial damage', { min: 0, max: Number.MAX_SAFE_INTEGER }));
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version, versionId } = activityFor(model, id, seconds);
      assertActivityOpen(model, id, version, seconds);
      const challenge = tables.TrialsChallenge.get(challengeId);
      if (!challenge || Number(challenge.version) !== versionId) fail(1, 'Unknown artifact trial challenge');
      activity.fight_record.mission_tid = Number(challenge.fight_tid);
      activity.fight_record.last_fight_time_sec = seconds;
      activity.fight_record.acc_dmg = addUnsigned(activity.fight_record.acc_dmg, dealt, 'trial accumulated damage');
      if (dealt > safeUnsigned(activity.fight_record.max_dmg, 'trial maximum damage')) activity.fight_record.max_dmg = dealt.toString();
      activity.daily.counters.trial_fights = Number(activity.daily.counters.trial_fights) + (cleared ? 1 : 0);
      return playerPb(activity).fight_record;
    });
  }

  function recordRecharge(actTid, value) {
    log({ event: 'artifact_draw_recordRecharge_entry', actTid, value });
    const id = integer(actTid, 'activity id', { min: 1 });
    const amount = integer(value, 'recharge value', { min: 1 });
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity, version } = activityFor(model, id, seconds);
      assertActivityOpen(model, id, version, seconds);
      activity.daily.counters.recharge_value = Number(activity.daily.counters.recharge_value) + amount;
      activity.period.counters.recharge_value = Number(activity.period.counters.recharge_value) + amount;
      return { recharge_value: activity.period.counters.recharge_value };
    });
  }

  function loginPayloads({ actTids = null } = {}) {
    log({ event: 'artifact_draw_loginPayloads_entry', actTids });
    return store.transaction(model => {
      const seconds = secondsNow();
      const activities = root(model);
      const ids = actTids ? uniqueIds(actTids.map(Number), 'activity ids', 100) : Object.keys(activities).map(Number).sort((a, b) => a - b);
      const players = [], servers = [];
      for (const id of ids) {
        const { activity } = activityFor(model, id, seconds);
        players.push(playerPb(activity));
        servers.push(serverPb(activity));
      }
      const playerValue = { act_data_list: players };
      const serverValue = { act_data_list: servers };
      return {
        playerList: { value: playerValue, data: codec.pack('pb_artifact_draw_player_list', playerValue) },
        serverList: { value: serverValue, data: codec.pack('pb_artifact_draw_server_list', serverValue) },
        // Module 183 is the verified pb_act_role_login container. M4 exposes
        // only the inner schemas; M6 owns the outer 0x836d + uint32 length
        // wrapper and must not overwrite unrelated activity entries.
        moduleId: 183,
        blockOrder: [],
        entrySchema: 'pb_act_role_login',
        payloadWrapper: { prefix: '836d', length: 'uint32be', headerBytes: 6 }
      };
    });
  }

  function inspect(actTid) {
    const id = integer(actTid, 'activity id', { min: 1 });
    return store.transaction(model => {
      const seconds = secondsNow();
      const { activity } = activityFor(model, id, seconds);
      return { player: playerPb(activity), server: serverPb(activity), state: structuredClone(activity) };
    });
  }

  return {
    commandSchemas: ARTIFACT_DRAW_ACT_COMMANDS,
    supports,
    supports101801, supports101802, supports101803, supports101804, supports101805, supports101806,
    execute,
    execute101801: request => execute(101801, request),
    execute101802: request => execute(101802, request),
    execute101803: request => execute(101803, request),
    execute101804: request => execute(101804, request),
    execute101805: request => execute(101805, request),
    execute101806: request => execute(101806, request),
    onFantasyDraw,
    recordArtifactDraw,
    recordTrialFight,
    recordRecharge,
    loginPayloads,
    inspect
  };
}
