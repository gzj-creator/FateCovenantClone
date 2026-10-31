import { readGeneratedTables } from '../config/hero-tables.mjs';

export const FANTASY_ACTIVITY_FUNC = 74;
export const FANTASY_ACTIVITY_TIDS = Object.freeze([74001, 74002, 74003, 74004, 74005]);
export const FANTASY_ACT_VERSIONS = Object.freeze([1, 2, 3, 4, 5]);
export const DEMIGOD_ACTIVITY_FUNC = 102;
export const DEMIGOD_ACTIVITY_TIDS = Object.freeze(Array.from({ length: 38 }, (_, index) => 102001 + index));
export const DEMIGOD_ACT_VERSIONS = Object.freeze(Array.from({ length: 38 }, (_, index) => index + 1));
// func=98 is the older ticket-draw family (98001..98009). It is intentionally
// excluded: its version cardinality and names do not match the 38-version
// DemigodAct contract and routing it here would merge two activity families.
export const LEGACY_TICKET_ACTIVITY_FUNC = 98;

const activityTableUrl = new URL(
  '../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/' +
  'assets__Android__script__lua__64_lua_project.bundle/bytecode/ActivityTable.data.lua.json',
  import.meta.url
);
const fantasyTableUrl = new URL(
  '../../analysis/work/relic-divine-activities/tables/FantasyEquipActTable.data.json',
  import.meta.url
);
const miniGameTableUrl = new URL(
  '../../analysis/work/relic-divine-activities/MiniGameTable.data.json',
  import.meta.url
);
const demigodTableUrl = new URL(
  '../../analysis/work/relic-divine-activities/tables/DemigodActTable.data.json',
  import.meta.url
);

const fantasyTableNames = Object.freeze([
  'Task', 'DrawWish', 'Draw', 'DrawShow', 'Gift', 'GiftRelease', 'Pre', 'PreShow',
  'FantasyEquipTrialDamage', 'FantasyEquipTrialBless', 'FantasyEquipTrialStar',
  'FantasyEquipTrialLevel', 'FantasyEquipTrial'
]);
const demigodTableNames = Object.freeze([
  'Shop', 'Show', 'DrawWish', 'Draw', 'DrawFantasy', 'DrawAward', 'Gift', 'DemigodAct',
  'DemigodTrialDamage', 'DemigodTrialBless', 'DemigodTrialStar', 'DemigodTrialLevel', 'DemigodTrial'
]);

function requireMap(tables, name) {
  const value = tables?.[name];
  if (!(value instanceof Map)) throw new Error(`Fantasy activity table ${name} is missing`);
  return value;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Invalid ${field}`);
  return number;
}

function assertExactKeys(map, expected, label) {
  const actual = [...map.keys()].map(Number).sort((left, right) => left - right);
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} must contain exactly ${expected.join(', ')}`);
  }
}

function validateAwardRows(rows, field) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`Missing ${field}`);
  for (const entry of rows) {
    if (!Array.isArray(entry) || entry.length < 2) throw new Error(`Invalid ${field}`);
    positiveInteger(entry[0], `${field} tid`);
    positiveInteger(entry[1], `${field} quantity`);
  }
}

/** Builds and validates the M5-owned table bundle from recovered production data. */
export function buildFantasyActTables({ activity, fantasy, miniGame, demigod }) {
  const activityRows = requireMap({ Activity: activity }, 'Activity');
  const schedule = new Map();
  const versionByActivityTid = new Map();
  const activityTidByVersion = new Map();
  const seenActivityTids = new Set();

  for (const [key, row] of activityRows) {
    if (Number(row?.func) !== FANTASY_ACTIVITY_FUNC) continue;
    const activityTid = positiveInteger(row.tid ?? key, 'fantasy activity tid');
    if (!FANTASY_ACTIVITY_TIDS.includes(activityTid)) {
      throw new Error(`Unexpected func=${FANTASY_ACTIVITY_FUNC} activity ${activityTid}`);
    }
    if (seenActivityTids.has(activityTid)) throw new Error(`Duplicate fantasy activity ${activityTid}`);
    seenActivityTids.add(activityTid);
    const expectedVersion = activityTid - 74000;
    const version = positiveInteger(row.version, `activity ${activityTid} version`);
    if (version !== expectedVersion) throw new Error(`Activity ${activityTid} maps to unexpected version ${version}`);
    if (versionByActivityTid.has(activityTid) || activityTidByVersion.has(version)) {
      throw new Error(`Duplicate fantasy activity version mapping ${activityTid}->${version}`);
    }
    schedule.set(activityTid, row);
    versionByActivityTid.set(activityTid, version);
    activityTidByVersion.set(version, activityTid);
  }
  assertExactKeys(versionByActivityTid, FANTASY_ACTIVITY_TIDS, 'func=74 activity mapping');
  assertExactKeys(activityTidByVersion, FANTASY_ACT_VERSIONS, 'fantasy version mapping');

  const demigodSchedule = new Map();
  const demigodVersionByActivityTid = new Map();
  const demigodActivityTidByVersion = new Map();
  for (const [key, row] of activityRows) {
    if (Number(row?.func) !== DEMIGOD_ACTIVITY_FUNC) continue;
    const activityTid = positiveInteger(row.tid ?? key, 'demigod activity tid');
    if (!DEMIGOD_ACTIVITY_TIDS.includes(activityTid)) {
      throw new Error(`Unexpected func=${DEMIGOD_ACTIVITY_FUNC} activity ${activityTid}`);
    }
    const expectedVersion = activityTid - 102000;
    const version = positiveInteger(row.version, `demigod activity ${activityTid} version`);
    if (version !== expectedVersion) throw new Error(`Demigod activity ${activityTid} maps to unexpected version ${version}`);
    if (demigodVersionByActivityTid.has(activityTid) || demigodActivityTidByVersion.has(version)) {
      throw new Error(`Duplicate demigod activity version mapping ${activityTid}->${version}`);
    }
    demigodSchedule.set(activityTid, row);
    demigodVersionByActivityTid.set(activityTid, version);
    demigodActivityTidByVersion.set(version, activityTid);
  }
  assertExactKeys(demigodVersionByActivityTid, DEMIGOD_ACTIVITY_TIDS, 'func=102 activity mapping');
  assertExactKeys(demigodActivityTidByVersion, DEMIGOD_ACT_VERSIONS, 'demigod version mapping');

  const tables = Object.fromEntries(fantasyTableNames.map(name => [name, requireMap(fantasy, name)]));
  assertExactKeys(tables.Draw, FANTASY_ACT_VERSIONS, 'FantasyEquipActTable.Draw');
  assertExactKeys(tables.Pre, FANTASY_ACT_VERSIONS, 'FantasyEquipActTable.Pre');
  for (const version of FANTASY_ACT_VERSIONS) {
    const draw = tables.Draw.get(version);
    const pre = tables.Pre.get(version);
    if (Number(draw?.tid ?? version) !== version || !Array.isArray(draw?.range) || draw.range.length === 0) {
      throw new Error(`Draw(${version}) is invalid`);
    }
    if (draw.range.some(tid => !Number.isSafeInteger(Number(tid)) || Number(tid) < 1)) {
      throw new Error(`Draw(${version}) has an invalid trial range`);
    }
    if (!Array.isArray(draw.draw_wish) || draw.draw_wish.length === 0) {
      throw new Error(`Draw(${version}) has no wish candidates`);
    }
    for (const wish of draw.draw_wish) {
      if (!tables.DrawWish.has(Number(wish))) throw new Error(`Draw(${version}) references unknown wish ${wish}`);
    }
    if (Number(pre?.tid ?? version) !== version) throw new Error(`Pre(${version}) does not match Draw(${version})`);
    validateAwardRows(pre.choose_award, `Pre(${version}).choose_award`);
  }

  const marblesConst = requireMap(miniGame, 'MarblesConst');
  const marbles = requireMap(miniGame, 'Marbles');
  if (marblesConst.size !== 1) throw new Error('MarblesConst must contain exactly one row');
  const marblesConfig = [...marblesConst.values()][0];
  positiveInteger(marblesConfig.tid, 'MarblesConst.tid');
  positiveInteger(marblesConfig.max_run_time, 'MarblesConst.max_run_time');
  positiveInteger(marblesConfig.award_threshold, 'MarblesConst.award_threshold');
  if (!Array.isArray(marblesConfig.award) || marblesConfig.award.length === 0) {
    throw new Error('MarblesConst has no big award equipment candidates');
  }
  marblesConfig.award.forEach((tid, index) => positiveInteger(tid, `MarblesConst.award[${index}]`));
  for (const version of FANTASY_ACT_VERSIONS) {
    if (![...marbles.values()].some(row => Number(row.version) === version)) {
      throw new Error(`Marbles rewards for fantasy version ${version} are missing`);
    }
  }

  const demigodTables = Object.fromEntries(demigodTableNames.map(name => [name, requireMap(demigod, name)]));
  assertExactKeys(demigodTables.DemigodAct, DEMIGOD_ACT_VERSIONS, 'DemigodActTable.DemigodAct');
  assertExactKeys(demigodTables.Draw, DEMIGOD_ACT_VERSIONS, 'DemigodActTable.Draw');
  for (const version of DEMIGOD_ACT_VERSIONS) {
    const draw = demigodTables.Draw.get(version);
    if (Number(draw?.tid ?? version) !== version || !Array.isArray(draw?.range)) {
      throw new Error(`Demigod Draw(${version}) is invalid`);
    }
  }

  return {
    ...tables,
    Task: tables.Task,
    DrawWish: tables.DrawWish,
    FantasyEquipActDraw: tables.Draw,
    FantasyEquipActDrawShow: tables.DrawShow,
    FantasyEquipActGift: tables.Gift,
    FantasyEquipActGiftRelease: tables.GiftRelease,
    FantasyEquipActPre: tables.Pre,
    FantasyEquipActPreShow: tables.PreShow,
    FantasyEquipActTask: tables.Task,
    MarblesConst: marblesConst,
    Marbles: marbles,
    FantasyActSchedule: schedule,
    FantasyActVersionByActivityTid: versionByActivityTid,
    FantasyActActivityTidByVersion: activityTidByVersion,
    DemigodShop: demigodTables.Shop,
    DemigodShow: demigodTables.Show,
    DemigodDrawWish: demigodTables.DrawWish,
    DemigodDraw: demigodTables.Draw,
    DemigodDrawFantasy: demigodTables.DrawFantasy,
    DemigodDrawAward: demigodTables.DrawAward,
    DemigodGift: demigodTables.Gift,
    DemigodAct: demigodTables.DemigodAct,
    DemigodTrialDamage: demigodTables.DemigodTrialDamage,
    DemigodTrialBless: demigodTables.DemigodTrialBless,
    DemigodTrialStar: demigodTables.DemigodTrialStar,
    DemigodTrialLevel: demigodTables.DemigodTrialLevel,
    DemigodTrial: demigodTables.DemigodTrial,
    DemigodActSchedule: demigodSchedule,
    DemigodActVersionByActivityTid: demigodVersionByActivityTid,
    DemigodActActivityTidByVersion: demigodActivityTidByVersion
  };
}

/** M6 can pass alternate URLs or a reader for fixtures while production stays explicit. */
export function loadFantasyActTables({
  readTables = readGeneratedTables,
  activityUrl = activityTableUrl,
  fantasyUrl = fantasyTableUrl,
  miniGameUrl = miniGameTableUrl,
  demigodUrl = demigodTableUrl
} = {}) {
  if (typeof readTables !== 'function') throw new Error('A generated-table reader is required');
  const activity = readTables(activityUrl, ['Activity']).Activity;
  const fantasy = readTables(fantasyUrl, fantasyTableNames);
  const miniGame = readTables(miniGameUrl, ['MarblesConst', 'Marbles']);
  const demigod = readTables(demigodUrl, demigodTableNames);
  return buildFantasyActTables({ activity, fantasy, miniGame, demigod });
}

export function resolveFantasyActVersion(tables, value) {
  const requested = positiveInteger(value, 'fantasy activity tid');
  const version = tables?.FantasyActVersionByActivityTid?.get(requested) ?? requested;
  if (!FANTASY_ACT_VERSIONS.includes(version)) return null;
  if (!tables?.FantasyEquipActDraw?.has(version) || !tables?.FantasyEquipActPre?.has(version)) return null;
  return version;
}

export function resolveDemigodActVersion(tables, value) {
  const requested = positiveInteger(value, 'demigod activity tid');
  const version = tables?.DemigodActVersionByActivityTid?.get(requested) ?? requested;
  if (!DEMIGOD_ACT_VERSIONS.includes(version)) return null;
  if (!tables?.DemigodAct?.has(version) || !tables?.DemigodDraw?.has(version)) return null;
  return version;
}
