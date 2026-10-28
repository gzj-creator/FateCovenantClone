import { readGeneratedTables, readHeroTables } from './hero-tables.mjs';

const defaultPath = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MissionTable.data.lua.json', import.meta.url);
let defaultCache;

// FightTable.304 is not shipped in the client's lua project bundle. Mission 30204 is
// still the first playable node after 30203, so keep its local battle deterministic by
// reusing the pursuers from the immediately preceding section until server-side fight
// tables become available. This fallback is exposed to the battle service for logging.
const LOCAL_ENEMY_FALLBACKS = new Map([
  [30204, { sourceMissionId: 30203 }]
]);

export function readMissionTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedTables(file, ['Section', 'Box']);
  const result = { sections: tables.Section, boxes: tables.Box, heroes: readHeroTables() };
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
