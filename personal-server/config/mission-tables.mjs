import { readGeneratedTables, readHeroTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';
import { readJourneyFightTables } from './journey-fight-tables.mjs';

const defaultPath = tableAsset('MissionTable.data.lua.json');
let defaultCache;

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

export function missionBattleConfig(missionId, file = defaultPath, fightTables = readJourneyFightTables()) {
  const tables = readMissionTables(file);
  const mission = tables.sections.get(Number(missionId));
  if (!mission) return null;
  // Section.enemy owns the map preview. Actual combat always follows the
  // section's Fight -> Team references, including boss and fixed ally teams.
  const fight = fightTables.Fight.get(Number(mission.fight));
  if (!fight || !Array.isArray(fight.def_team) || !fight.def_team.length) return null;
  return { mission, fight, fightTables, tables };
}
