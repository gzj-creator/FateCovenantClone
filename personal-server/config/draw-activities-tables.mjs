import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// Draw / lottery activity configuration shipped as LuaJIT bytecode tables.
// tools/extract-draw-activity-tables.mjs rebuilds the dumps from the client
// bundle, so a checkout only needs the generated files under assets/tables.
const TABLES = Object.freeze([
  'MagicDrawTable', 'PyramidTable', 'ThreeAdmonitionTable', 'HundredBonusTable',
  'RaffleTicketTable', 'HeroBlazonDrawTable', 'LotteryActTable', 'MysteryWishTable',
  'LotteryTable', 'FlipCardTable', 'TicketDrawTable', 'FruitDrawActTable',
  'ElvesActTable', 'CapsuleToyTable', 'ChildPuzzleActTable', 'HoardWheelActTable',
  'ThousandDrawTable', 'PrayActTable', 'CashbackDrawTable', 'TurntableActTable',
  'FlopCardActTable', 'ChessTable', 'ChessRevertTable', 'WishTreeTable'
]);

export const DRAW_ACTIVITY_TABLE_NAMES = TABLES;

const cache = new Map();

// Enumerate the sub-tables a generated dump defines. The dump root keeps one
// KSTR/FNEW pair per table constructor, mirroring the client's loader.
export function listActivityConstructors(parsed) {
  const root = parsed.prototypes[parsed.rootPrototype];
  const names = [];
  for (let index = 0; index < root.instructions.length - 1; index++) {
    const current = root.instructions[index];
    const next = root.instructions[index + 1];
    if (current.name === 'KSTR' && next.name === 'FNEW') names.push(root.constants[current.d].value);
  }
  return names;
}

// Load every sub-table of one activity dump. Sub-tables the interpreter cannot
// read are reported in `missing` instead of failing the whole family, so a
// single exotic row (engine references, empty indexes) cannot disable an
// unrelated command.
export function readActivityTables(name, file = tableAsset(name + '.data.lua.json.gz')) {
  const key = name + '|' + file;
  if (cache.has(key)) return cache.get(key);
  const parsed = readJsonAsset(file);
  const rows = {};
  const missing = [];
  for (const table of listActivityConstructors(parsed)) {
    try {
      rows[table] = readGeneratedDump(parsed, [table])[table];
    } catch (error) {
      missing.push({ table, message: error.message });
    }
  }
  const value = Object.freeze({ name, rows, missing, tables: Object.keys(rows).sort() });
  cache.set(key, value);
  return value;
}

// Convenience accessor used by tests and tooling: the row Map of one sub-table.
export function activityRows(activity, table) {
  const value = activity?.rows?.[table];
  return value instanceof Map ? value : new Map();
}

