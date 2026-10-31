import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = new URL('../../analysis/tmp/endgame-fixes/DestinyTable.data.json', import.meta.url);
let defaultCache;

export function readDestinyTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const tables = readGeneratedTables(file, ['Up', 'Const', 'Stage']);
  const result = { up: tables.Up, constants: tables.Const, stages: tables.Stage };
  if (file === defaultPath) defaultCache = result;
  return result;
}
