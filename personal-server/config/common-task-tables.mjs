import { parseLuaJit } from '../protocol/lua-jit-dump.mjs';
import { readAssetBytes, tableAsset } from '../assets.mjs';
import { readGameTables } from './game-tables.mjs';

// TaskTable.data.lua only stores TaskTable.CommonTask.<type> as a file name, so the
// four group tables ship as separate LuaJIT data chunks. They follow the generated
// table idiom used by the magic-circle/lineup families: every row is a literal array
// plus a shared field-name map, so read them with a targeted reader instead of running
// Lua. Row shape: tid, type, target_count, award, award_n, effect, show_award, show_award_n.
const GROUP_FILES = new Map([
  [1201, { file: 'TaskTable.CommonTask.1201.data.lua.bin', rows: 565 }],
  [1202, { file: 'TaskTable.CommonTask.1202.data.lua.bin', rows: 179 }],
  [1602, { file: 'TaskTable.CommonTask.1602.data.lua.bin', rows: 1800 }],
  [9001, { file: 'TaskTable.CommonTask.9001.data.lua.bin', rows: 230 }]
]);

const FIELDS = ['tid', 'type', 'target_count', 'award', 'award_n', 'effect', 'show_award', 'show_award_n'];

let cached;

function readGroupRows(bytes, type) {
  const parsed = parseLuaJit(bytes);
  const prototype = parsed.prototypes[parsed.rootPrototype];
  if (!prototype) throw new Error('Common task configuration ' + type + ' has no root prototype');

  let fieldNames = new Map();
  for (const constant of prototype.constants) {
    if (constant.type !== 'table' || !constant.hash?.length) continue;
    const names = new Map(constant.hash.map(([name, index]) => [Number(index), String(name)]));
    if (names.size > fieldNames.size) fieldNames = names;
  }
  if (fieldNames.size !== FIELDS.length) throw new Error('Common task configuration ' + type + ' has no field map');
  for (const [index, name] of fieldNames) {
    if (FIELDS[index - 1] !== name) throw new Error('Common task configuration ' + type + ' has an unexpected field ' + name);
  }

  const rows = new Map();
  for (const constant of prototype.constants) {
    if (constant.type !== 'table' || !Array.isArray(constant.array)) continue;
    const array = constant.array;
    if (!Number.isSafeInteger(array[1]) || Number(array[2]) !== type) continue;
    const row = {};
    for (const [index, name] of fieldNames) row[name] = array[index] ?? null;
    if (!Number.isSafeInteger(Number(row.tid)) || !Number.isSafeInteger(Number(row.target_count))) {
      throw new Error('Common task configuration ' + type + ' has an invalid row');
    }
    if (rows.has(Number(row.tid))) throw new Error('Common task configuration ' + type + ' has a duplicate row');
    rows.set(Number(row.tid), {
      tid: Number(row.tid),
      type,
      target_count: Number(row.target_count),
      award: row.award ?? null,
      award_n: row.award_n ?? null,
      effect: row.effect ?? null,
      show_award: row.show_award ?? 0,
      show_award_n: row.show_award_n ?? 0
    });
  }
  return rows;
}

// CommonTaskMgr.LoginParse walks TaskTable.CommonTaskGlobalCount and reads one module 90
// slot per group, so each group owns one contiguous login slot from slot 0; the captured
// login payload for module 90 carries five empty slots (four common groups plus the linear
// group that MainLinearTaskMgr parses afterwards). TaskTable.CommonTaskGlobal is keyed
// 1/3/4/5 (tid 2 is absent), and the generated *_List accessor is ordered by tid, so the
// slot is the group's rank in that order.
export function commonTaskGroupSlots(gameTables) {
  const globals = [...gameTables.CommonTaskGlobal.values()]
    .map(row => ({ tid: Number(row.tid), type: Number(row.type) }))
    .sort((left, right) => left.tid - right.tid);
  if (!globals.length) throw new Error('Common task groups are not configured');
  return new Map(globals.map((row, index) => [row.type, index]));
}

export function readCommonTaskTables() {
  if (cached) return cached;
  const groups = new Map();
  for (const [type, entry] of GROUP_FILES) {
    const rows = readGroupRows(readAssetBytes(tableAsset(entry.file)), type);
    if (rows.size !== entry.rows) throw new Error('Common task configuration ' + type + ' has ' + rows.size + ' rows, expected ' + entry.rows);
    const first = type * 10000 + 1;
    for (const tid of rows.keys()) {
      if (tid < first || tid >= first + entry.rows) throw new Error('Common task configuration ' + type + ' has an out-of-range tid ' + tid);
    }
    groups.set(type, rows);
  }
  const gameTables = readGameTables();
  const slots = commonTaskGroupSlots(gameTables);
  for (const type of groups.keys()) {
    if (!slots.has(type)) throw new Error('Common task group ' + type + ' is not registered in CommonTaskGlobal');
  }
  cached = { groups, slots, types: gameTables.TaskType };
  return cached;
}
