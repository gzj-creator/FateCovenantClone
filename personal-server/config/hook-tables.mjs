import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// HookTable ships as a client Lua table bundle. The row-level dump beside it is
// produced by tools/extract-lua-table-rows.mjs from the same-version
// HookTable.data.lua.bin; the asset here preserves all six families so the
// still-unimplemented produce/gather chain can be closed without re-extracting.
const defaultPath = tableAsset('HookTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze(['FastHookType', 'FastItem', 'StyleStatus', 'Type', 'Stage', 'RandomAward']);
const EXPECTED_COUNTS = Object.freeze({
  FastHookType: 3,
  FastItem: 61,
  StyleStatus: 2,
  Type: 12,
  Stage: 5593,
  RandomAward: 60
});

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid Hook table ${label}: ${value}`);
  }
  return number;
}

function awardList(value, label) {
  if (!Array.isArray(value)) throw new Error(`Invalid Hook table ${label}`);
  return value.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid Hook table ${label}[${index}]`);
    integer(pair[0], `${label}[${index}].tid`, { min: 1 });
    integer(pair[1], `${label}[${index}].num`, { min: 0 });
    return [Number(pair[0]), Number(pair[1])];
  });
}

function randomAwardIds(value, label) {
  if (!Array.isArray(value)) throw new Error(`Invalid Hook table ${label}`);
  return value.map((tid, index) => integer(tid, `${label}[${index}]`, { min: 1 }));
}

function freezeRows(rows, label, expected) {
  if (!Array.isArray(rows)) throw new Error(`Hook table ${label} is missing`);
  if (rows.length !== expected) throw new Error(`Hook table ${label} has ${rows.length} rows; expected ${expected}`);
  const map = new Map();
  for (const row of rows) {
    const tid = integer(row?.tid, `${label}.tid`, { min: 1 });
    if (map.has(tid)) throw new Error(`Hook table ${label} has duplicate tid ${tid}`);
    map.set(tid, Object.freeze({ ...row, tid }));
  }
  return map;
}

export function readHookTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;

  const parsed = readJsonAsset(file);
  const raw = readGeneratedDump(parsed && !parsed.tables && !parsed.prototypes ? { tables: parsed } : parsed, FAMILIES);
  const rows = {};
  for (const name of FAMILIES) rows[name] = freezeRows([...raw[name].values()], name, EXPECTED_COUNTS[name]);

  for (const type of rows.Type.values()) {
    integer(type.produce_period, `Type ${type.tid} produce_period`, { min: 1 });
    integer(type.max_fixed_period, `Type ${type.tid} max_fixed_period`, { min: 0 });
    integer(type.fast_gather_type, `Type ${type.tid} fast_gather_type`, { min: 0 });
    awardList(type.init_award ?? [], `Type ${type.tid} init_award`);
  }

  const fastHookTypeIds = new Set(rows.FastHookType.keys());
  for (const fast of rows.FastHookType.values()) {
    if (!Array.isArray(fast.hook_type) || fast.hook_type.length === 0) {
      throw new Error(`Hook FastHookType ${fast.tid} has no hook_type list`);
    }
    for (const type of fast.hook_type) {
      if (!rows.Type.has(integer(type, `FastHookType ${fast.tid} hook_type`, { min: 1 }))) {
        throw new Error(`Hook FastHookType ${fast.tid} references unknown type ${type}`);
      }
    }
    integer(fast.fast_gather_time, `FastHookType ${fast.tid} fast_gather_time`, { min: 0 });
    if (!Array.isArray(fast.fast_gather_price)) throw new Error(`Hook FastHookType ${fast.tid} price list is invalid`);
    fast.fast_gather_price.forEach((price, index) => integer(price, `FastHookType ${fast.tid} price[${index}]`, { min: 0 }));
    if (!Array.isArray(fast.fast_gather_n) || fast.fast_gather_n.length !== 2) {
      throw new Error(`Hook FastHookType ${fast.tid} fast_gather_n is invalid`);
    }
  }

  for (const item of rows.FastItem.values()) {
    if (!fastHookTypeIds.has(integer(item.hook_type, `FastItem ${item.tid} hook_type`, { min: 1 }))) {
      throw new Error(`Hook FastItem ${item.tid} references unknown FastHookType ${item.hook_type}`);
    }
    integer(item.sec, `FastItem ${item.tid} sec`, { min: 0 });
    if (!Array.isArray(item.item) || item.item.length === 0) throw new Error(`Hook FastItem ${item.tid} has no item list`);
    item.item.forEach((tid, index) => integer(tid, `FastItem ${item.tid} item[${index}]`, { min: 1 }));
  }

  const stagesByType = new Map();
  for (const stage of rows.Stage.values()) {
    awardList(stage.fixed_award ?? [], `Stage ${stage.tid} fixed_award`);
    const randomAwardIdsForStage = randomAwardIds(stage.random_award ?? [], `Stage ${stage.tid} random_award`);
    for (const randomAwardId of randomAwardIdsForStage) {
      if (!rows.RandomAward.has(randomAwardId)) {
        throw new Error(`Hook Stage ${stage.tid} references unknown RandomAward ${randomAwardId}`);
      }
    }
    const belong = integer(stage.belong_hook_type, `Stage ${stage.tid} belong_hook_type`, { min: 0 });
    if (belong !== 0 && !rows.Type.has(belong)) {
      throw new Error(`Hook Stage ${stage.tid} references unknown belong_hook_type ${belong}`);
    }
    if (!stagesByType.has(belong)) stagesByType.set(belong, []);
    stagesByType.get(belong).push(stage.tid);
  }
  for (const list of stagesByType.values()) list.sort((left, right) => left - right);

  for (const random of rows.RandomAward.values()) {
    integer(random.random_produce, `RandomAward ${random.tid} random_produce`, { min: 0 });
    integer(random.short_period_rate, `RandomAward ${random.tid} short_period_rate`, { min: 0 });
  }

  const frozen = Object.freeze({
    counts: EXPECTED_COUNTS,
    rows,
    typeForTid: tid => rows.Type.get(Number(tid)) ?? null,
    stageForTid: tid => rows.Stage.get(Number(tid)) ?? null,
    randomAwardForTid: tid => rows.RandomAward.get(Number(tid)) ?? null,
    fastHookTypeForTid: tid => rows.FastHookType.get(Number(tid)) ?? null,
    fastItemForTid: tid => rows.FastItem.get(Number(tid)) ?? null,
    stageTidsForType: (type, includeShared = false) => {
      const list = [...(stagesByType.get(Number(type)) ?? [])];
      if (includeShared) list.push(...(stagesByType.get(0) ?? []));
      return list.sort((left, right) => left - right);
    }
  });

  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}
