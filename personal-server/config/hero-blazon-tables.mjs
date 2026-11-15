import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

// HeroBlazonTable ships only as a LuaJIT bytecode bundle. The committed asset is
// the prototype dump produced by tools/dump-table-prototypes.mjs from
// 8647623730521538000-HeroBlazonTable.data.lua.bin (source SHA256
// D0077B02FAB8422FBD584AEC4F6E5E1CC824C756EC7D29DF206331A7AFE278C9).
const defaultPath = tableAsset('HeroBlazonTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze([
  'Param', 'Quality', 'TalentUp', 'Talent', 'TalentReset', 'ScoreBox', 'Attr',
  'Skill', 'Level', 'AngerSkillType', 'AngerSkillDes', 'Chapter', 'BondAttr',
  'BondItemNeed', 'BondGroup', 'EmbedGroup', 'EmbedCell'
]);

const EXPECTED_COUNTS = Object.freeze({
  Param: 1,
  Quality: 4,
  TalentUp: 27,
  Talent: 8,
  TalentReset: 5,
  ScoreBox: 6,
  Attr: 720,
  Skill: 88,
  Level: 26,
  AngerSkillType: 3,
  AngerSkillDes: 48,
  Chapter: 4,
  BondAttr: 3200,
  BondItemNeed: 492,
  BondGroup: 128,
  EmbedGroup: 110,
  EmbedCell: 414
});

const SKILL_INDEX_SCALE = 10;
const BOND_GROUP_SCALE = 100;

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid HeroBlazon ${label}: ${value}`);
  }
  return number;
}

function freezeRows(table, label, expected) {
  if (!(table instanceof Map)) throw new Error(`HeroBlazon ${label} is missing`);
  if (table.size !== expected) {
    throw new Error(`HeroBlazon ${label} has ${table.size} rows; expected ${expected}`);
  }
  const rows = new Map();
  for (const [key, value] of table) {
    const tid = integer(value?.tid ?? key, `${label}.tid`, { min: 0 });
    if (rows.has(tid)) throw new Error(`HeroBlazon ${label} has duplicate tid ${tid}`);
    rows.set(tid, Object.freeze({ ...value, tid }));
  }
  return rows;
}

function itemPair(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`Invalid HeroBlazon ${label}`);
  const pair = Array.isArray(value[0]) ? value[0] : value;
  if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid HeroBlazon ${label}`);
  return [integer(pair[0], `${label}.item`, { min: 1 }), integer(pair[1], `${label}.count`, { min: 0 })];
}

export function readHeroBlazonTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;

  const raw = readGeneratedTables(file, FAMILIES);
  const tables = {};
  for (const name of FAMILIES) tables[name] = freezeRows(raw[name], name, EXPECTED_COUNTS[name]);

  const param = tables.Param.get(1);
  if (!param) throw new Error('HeroBlazon Param row 1 is missing');
  integer(param.skill_count, 'Param.skill_count', { min: 1 });
  integer(param.skill_max_star, 'Param.skill_max_star', { min: 1, max: 10 });
  integer(param.normal_quality_lim, 'Param.normal_quality_lim', { min: 1 });

  const chapterByCampus = new Map();
  for (const chapter of tables.Chapter.values()) {
    const campus = integer(chapter.campus, `Chapter ${chapter.tid} campus`, { min: 1, max: 4 });
    integer(chapter.tid, `Chapter ${chapter.tid} id`, { min: 1, max: 4 });
    if (chapterByCampus.has(campus)) throw new Error(`HeroBlazon Chapter campus ${campus} is duplicated`);
    chapterByCampus.set(campus, chapter);
  }
  if (chapterByCampus.size !== 4) throw new Error('HeroBlazon requires four distinct chapter campuses');

  const bondGroupsByCampus = new Map();
  for (const group of tables.BondGroup.values()) {
    const campus = integer(group.campus, `BondGroup ${group.tid} campus`, { min: 1, max: 4 });
    if (!chapterByCampus.has(campus)) throw new Error(`BondGroup ${group.tid} uses unknown campus ${campus}`);
    if (!bondGroupsByCampus.has(campus)) bondGroupsByCampus.set(campus, []);
    bondGroupsByCampus.get(campus).push(group.tid);
  }

  const bondNeedsByGroup = new Map();
  for (const need of tables.BondItemNeed.values()) {
    const group = integer(need.group, `BondItemNeed ${need.tid} group`, { min: 1 });
    if (!tables.BondGroup.has(group)) throw new Error(`BondItemNeed ${need.tid} uses unknown group ${group}`);
    integer(need.index, `BondItemNeed ${need.tid} index`, { min: 1 });
    integer(need.special_item, `BondItemNeed ${need.tid} item`, { min: 1 });
    if (!bondNeedsByGroup.has(group)) bondNeedsByGroup.set(group, []);
    bondNeedsByGroup.get(group).push(need);
  }
  for (const [group, rows] of bondNeedsByGroup) {
    const indexes = new Set();
    for (const row of rows) {
      if (indexes.has(row.index)) throw new Error(`BondItemNeed group ${group} has duplicate index ${row.index}`);
      indexes.add(row.index);
    }
    rows.sort((left, right) => left.index - right.index);
  }

  const bondStarsByGroup = new Map();
  for (const attr of tables.BondAttr.values()) {
    const group = Math.floor(attr.tid / BOND_GROUP_SCALE);
    const star = attr.tid % BOND_GROUP_SCALE;
    if (!tables.BondGroup.has(group)) throw new Error(`BondAttr ${attr.tid} uses unknown group ${group}`);
    if (star < 1) throw new Error(`BondAttr ${attr.tid} has an invalid star`);
    if (!bondStarsByGroup.has(group)) bondStarsByGroup.set(group, []);
    bondStarsByGroup.get(group).push(star);
    const chart = integer(attr.chart_value, `BondAttr ${attr.tid} chart_value`, { min: 0 });
    void chart;
  }
  for (const [group, stars] of bondStarsByGroup) {
    stars.sort((left, right) => left - right);
    stars.forEach((star, index) => {
      if (star !== index + 1) throw new Error(`BondAttr group ${group} stars are not contiguous from 1`);
    });
  }

  const skillsBySource = new Map();
  for (const skill of tables.Skill.values()) {
    const source = Math.floor(skill.tid / SKILL_INDEX_SCALE);
    const star = skill.tid % SKILL_INDEX_SCALE;
    integer(skill.blazon_campus, `Skill ${skill.tid} campus`, { min: 1, max: 4 });
    integer(skill.active_chart_value, `Skill ${skill.tid} active_chart_value`, { min: 0 });
    const cost = itemPair(skill.active_item, `Skill ${skill.tid} active_item`);
    if (!skillsBySource.has(source)) skillsBySource.set(source, []);
    skillsBySource.get(source).push({ star, cost, row: skill });
  }
  for (const [source, entries] of skillsBySource) {
    entries.sort((left, right) => left.star - right.star);
    entries.forEach((entry, index) => {
      if (entry.star !== index) throw new Error(`Skill source ${source} stars are not contiguous from 0`);
    });
  }

  const frozen = Object.freeze({
    source: Object.freeze({ file: '8647623730521538000-HeroBlazonTable.data.lua.bin', sha256: 'D0077B02FAB8422FBD584AEC4F6E5E1CC824C756EC7D29DF206331A7AFE278C9' }),
    counts: EXPECTED_COUNTS,
    param,
    chapterByCampus,
    bondGroupsByCampus,
    bondNeedsByGroup,
    bondStarsByGroup,
    skillsBySource,
    rows: tables,
    chapterForCampus: campus => chapterByCampus.get(Number(campus)) ?? null,
    bondGroupForTid: tid => tables.BondGroup.get(Math.floor(Number(tid) / BOND_GROUP_SCALE)) ?? null,
    bondAttrForTid: tid => tables.BondAttr.get(Number(tid)) ?? null,
    bondStar: tid => Number(tid) % BOND_GROUP_SCALE,
    bondMaxStar: group => (bondStarsByGroup.get(Number(group))?.at(-1) ?? 0),
    bondNeedsForGroup: group => bondNeedsByGroup.get(Number(group)) ?? [],
    skillForTid: tid => tables.Skill.get(Number(tid)) ?? null,
    skillSource: tid => Math.floor(Number(tid) / SKILL_INDEX_SCALE),
    skillStar: tid => Number(tid) % SKILL_INDEX_SCALE,
    skillStarsForSource: source => (skillsBySource.get(Number(source)) ?? []).map(entry => entry.star),
    // HeroBlazonMgr.GetChartValueByChapterTid delegates to HeroBlazonBondMgr, so
    // the chapter chart value is the sum of the owned bond rows' chart_value.
    chartValuesFromBonds(bondTids) {
      const values = new Map([[1, 0], [2, 0], [3, 0], [4, 0]]);
      const seenGroups = new Map();
      for (const rawTid of bondTids) {
        const tid = integer(rawTid, 'owned bond tid', { min: 1 });
        const attr = tables.BondAttr.get(tid);
        const group = tables.BondGroup.get(Math.floor(tid / BOND_GROUP_SCALE));
        if (!attr || !group) throw new Error(`Owned bond ${tid} is not configured`);
        const previous = seenGroups.get(group.tid);
        if (previous !== undefined && previous !== tid) {
          throw new Error(`Bond group ${group.tid} contains multiple owned rows`);
        }
        seenGroups.set(group.tid, tid);
        values.set(group.campus, values.get(group.campus) + Number(attr.chart_value));
      }
      return values;
    }
  });

  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

