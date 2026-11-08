import { readGeneratedTables, readHeroTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('MissionTable.data.lua.json');
let defaultCache;

// These fight rows are not shipped in the client's lua project bundle. Missions 30204,
// 40203 and 40210 are still playable journey nodes, so keep their local battles
// deterministic by reusing the immediately preceding section until the missing fight
// tables become available. 40203 is the chapter-four mid-boss node (monster_type=1,
// enemy=[]); its surrounding ordinary nodes use 9003300 x2. Fallbacks are exposed to
// the battle service for logging and must remain labelled as local compatibility data,
// not as original server facts.
const LOCAL_ENEMY_FALLBACKS = new Map([
  [30204, { sourceMissionId: 30203 }],
  [40203, { sourceMissionId: 40202 }],
  [40210, { sourceMissionId: 40209 }]
]);

export function readMissionTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedTables(file, [
    'Section', 'Box', 'Sweep', 'SweepConst', 'EnergyConst', 'EnergyMax',
    // MealAward owns the free lunch/dinner stamina parcels, Chapter owns
    // pass_chapter_type and Boss owns the server-wide boss award rows. All
    // three are required by the mission extra commands, so they are loaded
    // together with the journey tables instead of being read ad hoc.
    'MealAward', 'Chapter', 'Boss'
  ]);
  const result = {
    sections: tables.Section,
    boxes: tables.Box,
    sweeps: tables.Sweep,
    sweepConst: tables.SweepConst,
    energyConst: tables.EnergyConst,
    energyMax: tables.EnergyMax,
    meals: tables.MealAward,
    chapters: tables.Chapter,
    bosses: tables.Boss,
    heroes: readHeroTables()
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function missionBattleConfig(missionId, file = defaultPath) {
  const tables = readMissionTables(file);
  const mission = tables.sections.get(Number(missionId));
  if (!mission) return null;
  let enemies = Array.isArray(mission.enemy) ? mission.enemy.map(Number) : [];
  const fallback = enemies.length ? null : LOCAL_ENEMY_FALLBACKS.get(Number(missionId));
  if (fallback) {
    const source = tables.sections.get(fallback.sourceMissionId);
    enemies = Array.isArray(source?.enemy) ? source.enemy.map(Number) : [];
  }
  if (!enemies.length) return null;
  if (enemies.length > 6 || enemies.some(tid => !Number.isSafeInteger(tid) || tid <= 0)) return null;
  return { mission, enemies, tables, fallback };
}
