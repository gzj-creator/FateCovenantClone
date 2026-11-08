import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readJsonAsset, tableAsset } from '../assets.mjs';

// StarMissionTable reader for the shipped client table.
//
// Source: analysis/tmp/a1-assets/StarMissionTable.data.lua (LuaJIT dump from
// 64_lua_project.bundle), converted by tools/extract-shipped-table.mjs.
//
// The real table holds seven sub tables: StarMission, Attr, Constant, Skill,
// Chapter, ChapterAward and Hero. Every mission/skill/award row carries a
// "version" column, not an activity id, and the shipped table covers versions
// 1..34. The client groups rows once per version
// (StarMissionMgr._InitLevelLData -> StarMissionTable.StarMissionValueIndex and
// ChapterAwardValueIndex) and reads the version off the running activity
// (StarMissionMgr.GetVision(actTid) = actData[actTid]:Version()). An activity id
// is therefore only a pointer into a version; the rows themselves carry the
// chapters, star thresholds, awards and skill costs.
//
// Nothing here is synthesised. Missing rows fail closed and malformed rows throw
// so the service rejects the command instead of guessing a reward.
const defaultPath = tableAsset('StarMissionTable.data.lua.json');
let defaultCache;

// Star mission activities are the "SP新英雄活动副本" copies in ActivityTable.
// That family is the only one whose rows cover exactly versions 1..34, the
// version range of StarMissionTable, and its leased heroes match the quality 60
// SP heroes listed in StarMissionTable.Hero.
export const STAR_MISSION_ACTIVITY_FUNC = 81;

// StarMissionChapter constants: eight levels per chapter, three star rules per
// level (so a chapter tops out at 24 stars).
export const CHAPTER_LEVEL_COUNT = 8;
export const LEVEL_STAR_COUNT = 3;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing star mission table: ' + name);
  return table.rows;
}

function positiveInt(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(label + ' is invalid');
  return number;
}

function nonNegativeInt(value, label, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(label + ' is invalid');
  return number;
}

function awardPairs(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(label + ' is invalid');
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' is invalid');
    return [positiveInt(pair[0], label), positiveInt(pair[1], label)];
  });
}

function intList(value, label) {
  if (value === undefined || value === null || !Array.isArray(value)) return [];
  return value.map(item => positiveInt(item, label));
}

// star_rule holds the star rule ids for one level; rule 0 is a real row
// ("no extra condition"), so the list allows zero.
function nonNegativeList(value, label) {
  if (value === undefined || value === null || !Array.isArray(value)) return [];
  return value.map(item => nonNegativeInt(item, label));
}

function missionOf(row) {
  return {
    tid: positiveInt(row.tid, 'Star mission row id'),
    chapter: positiveInt(row.chapter, 'Star mission chapter'),
    fightTid: positiveInt(row.fight_tid, 'Star mission fight id'),
    starRules: nonNegativeList(row.star_rule, 'Star mission star rule'),
    awardIds: intList(row.award_id, 'Star mission award item'),
    awardNums: intList(row.award_num, 'Star mission award count')
  };
}

function skillOf(row) {
  // Root skills ship parent_node as an empty table ({global:"TableEmpty"});
  // dependent skills ship an array of parent skill tids.
  const parents = Array.isArray(row.parent_node)
    ? row.parent_node.map(tid => positiveInt(tid, 'Star mission skill parent'))
    : [];
  return {
    tid: positiveInt(row.tid, 'Star mission skill id'),
    maxLevel: positiveInt(row.times, 'Star mission skill level cap'),
    costId: positiveInt(row.cost_id, 'Star mission skill cost item'),
    costNum: positiveInt(row.cost_num, 'Star mission skill cost amount'),
    parents,
    spStar: nonNegativeInt(row.sp_star, 'Star mission skill sp_star')
  };
}

function tierOf(row, boxIndex) {
  return {
    tid: positiveInt(row.tid, 'Star mission chapter award id'),
    chapter: positiveInt(row.chapter, 'Star mission chapter award chapter'),
    star: positiveInt(row.star, 'Star mission chapter award threshold'),
    award: awardPairs(row.award, 'Star mission chapter award reward'),
    // The award bit block is indexed by the tier order inside the chapter
    // (StarMissionChapter.GetCurCanChapterAwardTid returns the position that the
    // claim request then sends back as award_tid).
    boxIndex
  };
}

function push(map, key, value) {
  if (!map.has(key)) map.set(key, new Map());
  map.get(key).set(Number(value.tid), value);
}

function listPush(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

// activityTable is the ActivityTable "Activity" map (tid -> row) used by the
// rest of the server. Returns the StarMissionTable version for a running star
// mission activity, or null when the id is not a star mission activity.
export function starMissionActivityVersion(activityTable, actId) {
  const id = Number(actId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  let row = null;
  if (activityTable instanceof Map) row = activityTable.get(id) ?? null;
  else if (Array.isArray(activityTable)) row = activityTable.find(entry => Number(entry?.tid) === id) ?? null;
  else if (activityTable && typeof activityTable === 'object') row = activityTable[id] ?? null;
  if (!row) return null;
  if (Number(row.func) !== STAR_MISSION_ACTIVITY_FUNC) return null;
  const version = Number(row.version);
  if (!Number.isSafeInteger(version) || version <= 0) return null;
  return version;
}

export function readStarMissionTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const resolved = file instanceof URL ? fileURLToPath(file) : String(file);
  if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.gz')) {
    const empty = { source: null, available: false, versions: new Map() };
    if (file === defaultPath) defaultCache = empty;
    return empty;
  }
  const dump = readJsonAsset(file);
  const chapterIds = new Set(rowsOf(dump, 'Chapter').map(row => positiveInt(row.tid, 'Star mission chapter')));

  const missions = new Map();
  const tiers = new Map();
  const skills = new Map();
  const leases = new Map();
  const constants = new Map();
  const attributes = new Map();

  for (const row of rowsOf(dump, 'StarMission')) {
    const mission = missionOf(row);
    const version = positiveInt(row.version, 'Star mission version');
    if (!chapterIds.has(mission.chapter)) throw new Error('Star mission chapter is not declared: ' + mission.chapter);
    if (mission.starRules.length !== LEVEL_STAR_COUNT) {
      throw new Error('Star mission row ' + mission.tid + ' must declare ' + LEVEL_STAR_COUNT + ' star rules');
    }
    if (mission.awardIds.length !== mission.awardNums.length) {
      throw new Error('Star mission row ' + mission.tid + ' award ids and counts differ in length');
    }
    listPush(missions, version, mission);
  }

  // ChapterAward rows are keyed by their own tid; the box index is the position
  // inside the chapter in ascending star order (9 / 15 / 24 for a full chapter).
  const tierRows = rowsOf(dump, 'ChapterAward')
    .map(row => ({ ...tierOf(row, 0), version: positiveInt(row.version, 'Star mission chapter award version') }))
    .sort((a, b) => (a.version - b.version) || (a.chapter - b.chapter) || (a.star - b.star) || (a.tid - b.tid));
  const tierCounts = new Map();
  for (const tier of tierRows) {
    const key = tier.version + ':' + tier.chapter;
    const index = (tierCounts.get(key) ?? 0) + 1;
    tierCounts.set(key, index);
    if (!tiers.has(tier.version)) tiers.set(tier.version, new Map());
    const chapterTiers = tiers.get(tier.version);
    if (!chapterTiers.has(tier.chapter)) chapterTiers.set(tier.chapter, []);
    const list = chapterTiers.get(tier.chapter);
    if (list.some(entry => entry.star === tier.star)) throw new Error('Duplicate star mission chapter threshold: ' + tier.tid);
    list.push({ ...tier, boxIndex: index });
  }

  for (const row of rowsOf(dump, 'Skill')) {
    const version = positiveInt(row.version, 'Star mission skill version');
    push(skills, version, skillOf(row));
  }

  for (const row of rowsOf(dump, 'Hero')) {
    const version = positiveInt(row.version, 'Star mission lease hero version');
    listPush(leases, version, {
      heroTid: positiveInt(row.hero_tid, 'Star mission lease hero'),
      star: positiveInt(row.star, 'Star mission lease hero star'),
      level: positiveInt(row.level, 'Star mission lease hero level')
    });
  }

  for (const row of rowsOf(dump, 'Constant')) {
    constants.set(positiveInt(row.tid, 'Star mission constant id'), {
      leaseTid: nonNegativeInt(row.lease_tid, 'Star mission lease id'),
      talk: nonNegativeInt(row.talk, 'Star mission talk id')
    });
  }

  for (const row of rowsOf(dump, 'Attr')) {
    attributes.set(positiveInt(row.tid, 'Star mission attribute id'), {
      level: positiveInt(row.level, 'Star mission attribute level'),
      breakLevel: positiveInt(row.break_level, 'Star mission attribute break level')
    });
  }

  const versions = new Map();
  for (const version of missions.keys()) {
    const chapterMissions = new Map();
    for (const mission of missions.get(version)) {
      if (!chapterMissions.has(mission.chapter)) chapterMissions.set(mission.chapter, []);
      chapterMissions.get(mission.chapter).push(mission);
    }
    const versionTiers = tiers.get(version) ?? new Map();
    const versionSkills = skills.get(version) ?? new Map();
    const chapters = new Map();
    for (const [chapter, chapterMissionsList] of [...chapterMissions].sort((a, b) => a[0] - b[0])) {
      chapterMissionsList.sort((a, b) => a.tid - b.tid);
      const chapterTierList = versionTiers.get(chapter) ?? [];
      const maxStars = chapterMissionsList.length * LEVEL_STAR_COUNT;
      for (const tier of chapterTierList) {
        if (tier.star > maxStars) {
          throw new Error('Star mission chapter award ' + tier.tid + ' needs more stars than the chapter can reach');
        }
      }
      chapters.set(chapter, { chapter, missions: chapterMissionsList, tiers: chapterTierList, maxStars });
    }
    if (!chapters.size) continue;
    for (const skill of versionSkills.values()) {
      for (const parent of skill.parents) {
        if (!versionSkills.has(parent)) throw new Error('Star mission skill ' + skill.tid + ' has a missing parent ' + parent);
      }
    }
    versions.set(version, {
      version,
      chapters,
      skills: versionSkills,
      leases: (leases.get(version) ?? []).slice(),
      constants: constants.get(version) ?? null,
      attributes: attributes.get(version) ?? null
    });
  }

  const result = { source: dump.source ?? null, available: true, versions };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function starMissionActivity(tables, version) {
  if (!tables?.available) return null;
  return tables.versions.get(Number(version)) ?? null;
}

export function starMissionTier(activity, awardTid) {
  if (!activity) return null;
  for (const chapter of activity.chapters.values()) {
    const tier = chapter.tiers.find(entry => entry.tid === Number(awardTid));
    if (tier) return tier;
  }
  return null;
}
