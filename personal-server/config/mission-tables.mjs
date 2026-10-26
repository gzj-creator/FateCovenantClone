import { readGeneratedTables, readHeroTables } from './hero-tables.mjs';

const defaultPath = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MissionTable.data.lua.json', import.meta.url);
let defaultCache;

export function readMissionTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const sections = readGeneratedTables(file, ['Section']).Section;
  const result = { sections, heroes: readHeroTables() };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function missionBattleConfig(missionId, file = defaultPath) {
  const tables = readMissionTables(file);
  const mission = tables.sections.get(Number(missionId));
  if (!mission || !Array.isArray(mission.enemy) || !mission.enemy.length) return null;
  const enemies = mission.enemy.map(Number);
  if (enemies.length > 6 || enemies.some(tid => !Number.isSafeInteger(tid) || tid <= 0)) return null;
  return { mission, enemies, tables };
}
