import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

// Tables for the G2 exploration / mini-game block. Every file is rebuilt from
// the shipped client bundles with tools/extract-lua-table-rows.mjs and stored
// under assets/tables. Row counts are pinned: a different client build fails
// the read instead of letting a command run against a half-extracted table.
const SOURCES = Object.freeze({
  puzzle: ['PuzzleActTable', { Task: 72, Puzzle: 72, Version: 8, Progress: 32 }],
  tileSwap: ['TileSwapTable', { Tile: 1, BoardGroup: 22, Board: 44, Version: 2, Turn: 18 }],
  mushroom: ['MushroomMonsterTable', { MushroomMonster: 1, ActAward: 3, ActSpeed: 5, ActDisplay: 1 }],
  gopher: ['BeatGopherActTable', { BeatGopherRankAward: 8, BeatGopherScoreAward: 3, BeatGopherNode: 3, BeatGopherVersion: 1 }],
  tower: ['TowerActTable', { TowerAct: 7, Task: 49, Award: 48, Const: 1, TurnChoose: 14, Gift: 53 }],
  spirit: ['SpiritCourtyardTable', {
    Const: 1, Land: 16, Crop: 18, CropOutput: 50, CropOutputLib: 50, CropOutFruitLib: 63,
    FruitMerge: 3, FruitMergeLib: 6, MergeNumAddW: 2, EntrustOrder: 50, EntrustOrderLib: 35,
    EntrustQuality: 5, EntrustRefreshCost: 7, Intimacy: 20, IntimacyTask: 131, Item: 2,
    GuildBanquet: 6, GuildBanquetOrder: 4, GuildBanquetProReward: 12, GuildBanquet_fruit: 28,
    LandType: 2, Vip: 2, ItemStage: 17, ItemStageType: 5, Bubble: 2
  }],
  tripleMatch: ['TripleMatchTable', {
    AccAward: 1122, Act: 21, Cheat: 3, FightLevel: 105, Game: 21, Gate: 3,
    RankAccumulatedAward: 168, RankSingleAward: 168, Rule: 2, RuleScore: 20, Score: 15,
    Tile: 84, TileLib: 3, TileSubType: 4, TileType: 14, Type: 2
  }],
  matchingGame: ['MatchingGameActTable', { CardType: 110, Award: 55, MatchingGameAct: 11, ScoreAward: 263 }],
  monopoly: ['MonopolyActTable', {
    Frim: 1, Art: 2, RoleRank: 104, EventType: 9, Event: 138, GuildTask: 182, GuildRank: 78,
    Const: 1, RecordType: 4, Popup: 13, Ver: 13, Map: 364, LiveTask: 6, Supply: 64,
    TotolTask: 434, PvpTeam: 4
  }],
  dreamTrial: ['DreamTrialActTable', {
    PersonAward: 30, GuildAward: 0, Damage: 60, AwardShow: 50, Const: 1, Monster: 18,
    Award: 60, Rank: 5, ActiveScore: 4, Version: 6
  }],
  diamondVein: ['DiamondVeinActTable', { Rank: 70, Const: 1, Build: 102, PowerMerit: 19, BuyAttack: 6, Version: 10, HighRateDraw: 7 }],
  sourcePoint: ['SourcePointTable', { ElevateType: 2, Elevate: 6, Quality: 3, Slot: 6, SourcePoint: 47, Trial: 30 }],
  homeland: ['HomelandTable', {
    FurnitureSuitAlbum: 10, FurnitureAlbum: 121, FurnitureType: 12, FurnitureQuality: 4,
    FurnitureBigType: 4, FurnitureSuit: 10, Furniture: 121, Const: 1, Room: 30,
    HouseStyle: 1, House: 5, Task: 2, Level: 40
  }],
  homelandAct: ['HomelandActTable', {
    Task: 72, VersionShow: 5, RoleActionType: 4, RoleAction: 10, RoleActionStyle: 16,
    RankUpAward: 203, Furniture: 9, Const: 1, Module: 5, Happiness: 44, Version: 9
  }],
  baking: ['BakingActTable', {
    EventShow: 2, Cheat: 2, Global: 1, Area: 2, DailyRankAward: 16, DailyRankVersion: 10,
    FirecrackerActBubbleMsg: 12, Version: 2, CakeItem: 8, Vip: 1, SpecialEvent: 5, Lv: 102,
    RankAward: 16, Order: 241, ItemType: 4, ItemShow: 5
  }]
});

function readFamily(file, name, expected) {
  const parsed = readJsonAsset(tableAsset(file + '.data.lua.json.gz'));
  const rows = parsed?.tables?.[name] ?? readPrototypeFamily(parsed, name);
  if (!Array.isArray(rows)) throw new Error('Missing ' + file + '.' + name);
  if (rows.length !== expected) {
    throw new Error(file + '.' + name + ' has ' + rows.length + ' rows, expected ' + expected);
  }
  return { rows, byTid: new Map(rows.map(row => [Number(row.tid), row])) };
}

// The same client table can also be stored as compiled Lua prototypes, which
// the shared interpreter turns into the same {tid, ...} rows.
function readPrototypeFamily(parsed, name) {
  if (!parsed?.prototypes) return undefined;
  const family = readGeneratedDump(parsed, [name])[name];
  return [...family].map(([key, row]) => (row && row.tid === undefined ? { tid: Number(key), ...row } : row));
}

let cached;

export function readMinigameActTables() {
  if (cached) return cached;
  const result = {};
  for (const [key, [file, families]] of Object.entries(SOURCES)) {
    const loaded = {};
    for (const [name, expected] of Object.entries(families)) loaded[name] = readFamily(file, name, expected);
    result[key] = loaded;
  }
  cached = result;
  return cached;
}

// Award columns ship either as [[tid, count], ...] or as a single [tid, count]
// row. Zero-count rows are placeholders in the client table and are dropped.
export function awardPairs(value, label) {
  if (!Array.isArray(value)) throw new Error('Missing award list: ' + label);
  if (!value.length) return [];
  const rows = Array.isArray(value[0]) ? value : [value];
  const pairs = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) throw new Error('Invalid award entry: ' + label);
    const tid = Number(row[0]), count = Number(row[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new Error('Invalid award tid: ' + label);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid award count: ' + label);
    if (count > 0) pairs.push([tid, count]);
  }
  return pairs;
}

// Rows carry a weight column; a zero or missing weight is unselectable.
export function weightedPick(rows, { weightField = 'weight', random = Math.random, label = 'row' } = {}) {
  const candidates = rows
    .map(row => ({ row, weight: Number(row[weightField]) }))
    .filter(entry => Number.isSafeInteger(entry.weight) && entry.weight > 0);
  if (!candidates.length) throw new Error('No weighted rows for ' + label);
  const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
  const sample = Number(random());
  let roll = (Number.isFinite(sample) ? Math.min(Math.max(sample, 0), 1 - Number.EPSILON) : 0) * total;
  for (const entry of candidates) {
    roll -= entry.weight;
    if (roll < 0) return entry.row;
  }
  return candidates[candidates.length - 1].row;
}

export function rowsOfVersion(family, version) {
  return family.rows.filter(row => Number(row.version ?? row.ver ?? row.belonging_version ?? row.belong_version) === Number(version));
}
