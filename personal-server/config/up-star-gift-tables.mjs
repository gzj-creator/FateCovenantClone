import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// UpStarGiftTable.data.lua is shipped inside 64_lua_project.bundle. The row
// dump beside the other local tables is the only runtime dependency; the
// source bytecode hash and extraction command are recorded in
// agent/workflow/fixes/up-star-gift-20261111.md.
const defaultPath = tableAsset('UpStarGiftTable.data.lua.json');
let defaultCache;

const EXPECTED_ROWS = Object.freeze({
  UpStarOneKeyGift: 1,
  Show: 109,
  UpStarGift: 538,
  Const: 1,
  HeroShow: 88
});

function rowsOf(dump, name) {
  const table = dump?.[name];
  if (!(table instanceof Map)) throw new Error('Missing UpStarGift table: ' + name);
  const expected = EXPECTED_ROWS[name];
  if (expected !== undefined && table.size !== expected) {
    throw new Error('UpStarGift table ' + name + ' has ' + table.size + ' rows, expected ' + expected);
  }
  return table;
}

function positive(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(label + ' is invalid');
  return number;
}

function nonNegative(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(label + ' is invalid');
  return number;
}

function awardPairs(value, label) {
  // An empty award column is either an empty Lua table or the global
  // TableEmpty marker. Both mean that this row has no claimable reward.
  if (value == null || (typeof value === 'object' && !Array.isArray(value))) return [];
  if (!Array.isArray(value)) throw new Error(label + ' award is invalid');
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length < 2) throw new Error(label + ' award is invalid');
    return [positive(pair[0], label + ' award tid'), positive(pair[1], label + ' award count')];
  });
}

function normalizeGift(row) {
  const tid = positive(row.tid, 'UpStarGift tid');
  return {
    tid,
    type: positive(row.type, 'UpStarGift ' + tid + ' type'),
    version: positive(row.version, 'UpStarGift ' + tid + ' version'),
    targetCount: nonNegative(row.target_count, 'UpStarGift ' + tid + ' target_count'),
    starUnlock: nonNegative(row.star_unLock, 'UpStarGift ' + tid + ' star_unLock'),
    taskParam: positive(row.task_param, 'UpStarGift ' + tid + ' task_param'),
    gift: nonNegative(row.gift, 'UpStarGift ' + tid + ' gift'),
    award: awardPairs(row.award, 'UpStarGift ' + tid),
    oneKey: nonNegative(row.one_key, 'UpStarGift ' + tid + ' one_key'),
    ignoreRedDot: Boolean(row.ignore_red_dot),
    isSpecialShow: Boolean(row.is_special_show)
  };
}

function normalizeShow(row) {
  const tid = positive(row.tid, 'Show tid');
  return {
    tid,
    showStyle: positive(row.show_style, 'Show ' + tid + ' show_style'),
    hero: positive(row.hero, 'Show ' + tid + ' hero'),
    isChoose: Boolean(row.is_choose),
    uiStyleIdx: nonNegative(row.ui_style_idx, 'Show ' + tid + ' ui_style_idx'),
    mainJumpVersion: nonNegative(row.main_jump_version, 'Show ' + tid + ' main_jump_version')
  };
}

export function readUpStarGiftTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readGeneratedDump(readJsonAsset(file), [
    'UpStarOneKeyGift', 'Show', 'UpStarGift', 'Const', 'HeroShow'
  ]);
  const UpStarOneKeyGift = rowsOf(dump, 'UpStarOneKeyGift');
  const Show = rowsOf(dump, 'Show');
  const UpStarGift = rowsOf(dump, 'UpStarGift');
  const Const = rowsOf(dump, 'Const');
  const HeroShow = rowsOf(dump, 'HeroShow');

  const giftsById = new Map();
  const giftsByVersion = new Map();
  const giftBitByVersion = new Map();
  for (const row of UpStarGift.values()) {
    const gift = normalizeGift(row);
    if (giftsById.has(gift.tid)) throw new Error('UpStarGift has duplicate tid ' + gift.tid);
    // The client encodes both the period and the bit in tid:
    // version = floor(tid / 100), BitBlock index = tid % 100.
    if (Math.floor(gift.tid / 100) !== gift.version || gift.tid % 100 > 99) {
      throw new Error('UpStarGift tid ' + gift.tid + ' does not encode version ' + gift.version);
    }
    let bits = giftBitByVersion.get(gift.version);
    if (!bits) giftBitByVersion.set(gift.version, (bits = new Set()));
    const bit = gift.tid % 100;
    if (bits.has(bit)) throw new Error('UpStarGift version ' + gift.version + ' has duplicate award bit ' + bit);
    bits.add(bit);
    giftsById.set(gift.tid, gift);
    if (!giftsByVersion.has(gift.version)) giftsByVersion.set(gift.version, []);
    giftsByVersion.get(gift.version).push(gift);
  }
  for (const rows of giftsByVersion.values()) rows.sort((left, right) => left.tid - right.tid);

  const showsByVersion = new Map();
  for (const row of Show.values()) {
    const show = normalizeShow(row);
    if (showsByVersion.has(show.tid)) throw new Error('Show has duplicate tid ' + show.tid);
    showsByVersion.set(show.tid, show);
  }

  // Every gift version must have a Show row. This catches a truncated table
  // where the client would render an empty page for a configured activity.
  for (const version of giftsByVersion.keys()) {
    if (!showsByVersion.has(version)) throw new Error('UpStarGift version ' + version + ' has no Show row');
  }

  const oneKeyByVersion = new Map();
  for (const row of UpStarOneKeyGift.values()) {
    const version = positive(row.version, 'UpStarOneKeyGift version');
    if (oneKeyByVersion.has(version)) throw new Error('UpStarOneKeyGift has duplicate version ' + version);
    oneKeyByVersion.set(version, {
      tid: positive(row.tid, 'UpStarOneKeyGift tid'),
      version,
      type: positive(row.type, 'UpStarOneKeyGift type'),
      targetCount: nonNegative(row.target_count, 'UpStarOneKeyGift target_count'),
      taskParam: positive(row.task_param, 'UpStarOneKeyGift task_param'),
      gift: positive(row.gift, 'UpStarOneKeyGift gift'),
      asserts: row.asserts == null ? null : String(row.asserts)
    });
  }

  const result = {
    UpStarOneKeyGift,
    Show,
    UpStarGift,
    Const,
    HeroShow,
    giftsById,
    giftsByVersion,
    giftBitByVersion,
    showsByVersion,
    oneKeyByVersion
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function upStarGiftsForVersion(tables, version) {
  return tables?.giftsByVersion?.get(Number(version)) ?? [];
}
