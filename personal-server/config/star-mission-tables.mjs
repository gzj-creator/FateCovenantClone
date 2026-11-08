import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readJsonAsset, tableAsset } from '../assets.mjs';

// StarMissionTable reader.
//
// The star mission activity rows ship inside the client Lua project bundle and
// have not been extracted into personal-server/assets/tables yet. The reader
// therefore reports availability; the service fails closed per command instead
// of guessing chapter star thresholds, award ids or skill costs.
const defaultPath = tableAsset('StarMissionTable.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing star mission table: ' + name);
  return table.rows;
}

function awardPairs(row, label) {
  const pairs = Array.isArray(row?.award) ? row.award : [];
  return pairs.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

function activityOf(row) {
  const tid = Number(row.tid);
  const chapters = (Array.isArray(row.chapters) ? row.chapters : []).map(chapter => {
    const value = Number(chapter.chapter ?? chapter.tid);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Star mission chapter row is invalid');
    return {
      chapter: value,
      awardTid: Number(chapter.award_tid ?? chapter.tid),
      needStar: Number(chapter.need_star ?? 0),
      award: awardPairs(chapter, 'Star mission chapter')
    };
  });
  const skills = new Map();
  for (const row of Array.isArray(row.skills) ? row.skills : []) {
    const skillTid = Number(row.tid);
    if (!Number.isSafeInteger(skillTid) || skillTid <= 0) throw new Error('Star mission skill row is invalid');
    skills.set(skillTid, { tid: skillTid, cost: Number(row.cost ?? 0), maxLevel: Number(row.max_level ?? 0) });
  }
  return { tid, chapters, skills };
}

export function readStarMissionTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const resolved = file instanceof URL ? fileURLToPath(file) : String(file);
  if (!fs.existsSync(resolved) && !fs.existsSync(resolved + '.gz')) {
    const empty = { source: null, available: false, activities: new Map() };
    if (file === defaultPath) defaultCache = empty;
    return empty;
  }
  const dump = readJsonAsset(file);
  const activities = new Map();
  for (const row of rowsOf(dump, 'StarMissionAct')) {
    const activity = activityOf(row);
    activities.set(activity.tid, activity);
  }
  const result = { source: dump.source ?? null, available: true, activities };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function starMissionActivity(tables, actId) {
  if (!tables?.available) return null;
  return tables.activities.get(Number(actId)) ?? null;
}
