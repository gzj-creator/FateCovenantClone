import { readJsonAsset, tableAsset } from '../assets.mjs';

// Arena family client configuration. Every file below is extracted from the
// shipped table bundle by tools/extract-arena-tables.mjs, which records the
// field map and rows of each generated sub table:
//
//   assets/tables/SwapArenaTable.data.lua.json.gz    (SwapArenaCmd 4031-4040)
//   assets/tables/ArenaContestTable.data.lua.json.gz (ArenaContestCmd 83301-83315)
//   assets/tables/HunterArenaTable.data.lua.json.gz  (HunterArenaCmd 84001-84011)
//   assets/tables/PlayMatchTable.data.lua.json.gz    (PlayMatchCmd 98900-98901)
//   assets/tables/OverallMatchTable.data.lua.json.gz (OverallMatchCmd 120001)
//
// Rows keep the client field names, so every rule below can be traced back to
// the table row it came from.

const swapArenaPath = tableAsset('SwapArenaTable.data.lua.json');
const arenaContestPath = tableAsset('ArenaContestTable.data.lua.json');
const hunterArenaPath = tableAsset('HunterArenaTable.data.lua.json');
const playMatchPath = tableAsset('PlayMatchTable.data.lua.json');
const overallMatchPath = tableAsset('OverallMatchTable.data.lua.json');

const cache = new Map();

function table(dump, name) {
  const entry = dump.tables?.[name];
  if (!entry || !Array.isArray(entry.rows)) throw new Error('Missing arena table: ' + name);
  return { fields: entry.fields ?? [], rows: entry.rows };
}

function byTid(entry) {
  const map = new Map();
  for (const row of entry.rows) {
    const tid = Number(row.tid);
    if (Number.isSafeInteger(tid) && tid > 0) map.set(tid, row);
  }
  return map;
}

function load(file, key) {
  if (cache.has(key)) return cache.get(key);
  const dump = readJsonAsset(file);
  cache.set(key, dump);
  return dump;
}

// Client award cells are [itemTid, count] pairs. A malformed cell must stop the
// caller instead of silently granting a partial reward list.
export function arenaAwardPairs(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(label + ' reward configuration is invalid');
  const pairs = [];
  for (const cell of value) {
    if (!Array.isArray(cell) || cell.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(cell[0]), count = Number(cell[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    pairs.push([tid, count]);
  }
  return pairs;
}

export function arenaRange(value, label) {
  if (!Array.isArray(value) || value.length !== 2) throw new Error(label + ' range configuration is invalid');
  const from = Number(value[0]), to = Number(value[1]);
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from <= 0 || to < from) {
    throw new Error(label + ' range configuration is invalid');
  }
  return [from, to];
}

export function readSwapArenaTables(file = swapArenaPath) {
  const dump = load(file, 'swap');
  const base = table(dump, 'Base').rows[0];
  if (!base) throw new Error('SwapArenaTable.Base is empty');
  const result = {
    source: dump.source ?? null,
    base,
    cost: byTid(table(dump, 'Cost')),
    match: byTid(table(dump, 'Match')),
    rankAward: table(dump, 'RankAward').rows,
    firstRankAward: table(dump, 'FirstRankAward').rows,
    awardLib: table(dump, 'AwardLib').rows,
    robot: table(dump, 'Robot').rows,
    robotDetail: byTid(table(dump, 'RobotDetail')),
    rankStage: table(dump, 'RankStage').rows,
    fightId: table(dump, 'FightId').rows
  };
  return result;
}

export function readArenaContestTables(file = arenaContestPath) {
  const dump = load(file, 'contest');
  const constant = table(dump, 'Const').rows[0];
  if (!constant) throw new Error('ArenaContestTable.Const is empty');
  return {
    source: dump.source ?? null,
    const: constant,
    round: byTid(table(dump, 'Round')),
    state: table(dump, 'State').rows,
    stateEnum: byTid(table(dump, 'StateEnum')),
    roundState: byTid(table(dump, 'RoundState')),
    timer: table(dump, 'Timer').rows,
    rankAward: table(dump, 'RankAward').rows,
    guessAward: byTid(table(dump, 'GuessAward')),
    watchAward: byTid(table(dump, 'WatchAward')),
    congratulateAward: byTid(table(dump, 'CongratulateAward')),
    showAward: byTid(table(dump, 'ShowAward')),
    bigState: byTid(table(dump, 'BigState')),
    arenaDailyTask: table(dump, 'ArenaDailyTask').rows
  };
}

export function readHunterArenaTables(file = hunterArenaPath) {
  const dump = load(file, 'hunter');
  const constant = table(dump, 'Const').rows[0];
  if (!constant) throw new Error('HunterArenaTable.Const is empty');
  return {
    source: dump.source ?? null,
    const: constant,
    rank: table(dump, 'Rank').rows,
    doubleRank: table(dump, 'DoubleRank').rows,
    level: table(dump, 'Level').rows,
    dayTask: table(dump, 'DayTask').rows,
    state: table(dump, 'State').rows,
    serverType: byTid(table(dump, 'ServerType')),
    botConst: table(dump, 'BotConst').rows[0] ?? null,
    botMatch: table(dump, 'BotMatch').rows,
    botLib: byTid(table(dump, 'BotLib'))
  };
}

export function readPlayMatchTables(file = playMatchPath) {
  const dump = load(file, 'play');
  return {
    source: dump.source ?? null,
    play: byTid(table(dump, 'Play')),
    robot: table(dump, 'Robot').rows,
    playStateType: byTid(table(dump, 'PlayStateType')),
    playStateLib: byTid(table(dump, 'PlayStateLib'))
  };
}

export function readOverallMatchTables(file = overallMatchPath) {
  const dump = load(file, 'overall');
  return {
    source: dump.source ?? null,
    type: byTid(table(dump, 'Type')),
    rule: byTid(table(dump, 'Rule'))
  };
}

// SwapArenaTable.Match buckets the current rank into the ladder segment the
// client uses for the opponent list and for the robot figure.
export function swapArenaMatchBucket(tables, rank) {
  const value = Number(rank);
  for (const row of tables.match.values()) {
    const [from, to] = arenaRange(row.rank_rang, 'Swap arena match');
    if (value >= from && value <= to) return row;
  }
  return null;
}

export function swapArenaLadderFloor(tables, rank) {
  const row = swapArenaMatchBucket(tables, rank);
  return row ? arenaRange(row.rank_rang, 'Swap arena match')[0] : null;
}

// The cross stage of the local ladder advances once per ranked season. The
// stage length itself is not part of SwapArenaTable, so the caller passes the
// server open time and the interval it has evidence for.
export function swapArenaRankAwardRow(tables, tid) {
  return tables.rankAward.find(row => Number(row.tid) === Number(tid)) ?? null;
}

export function swapArenaOwnedRobots(tables, robotTid) {
  return tables.robotDetail.get(Number(robotTid)) ?? null;
}

export function swapArenaFightId(tables, crossStage) {
  for (const row of tables.fightId) {
    if (Number(row.tid) === Number(crossStage)) return row;
  }
  return tables.fightId[0] ?? null;
}

export function hunterArenaRankRow(tables, rank) {
  const value = Number(rank);
  for (const row of tables.rank) {
    const [from, to] = arenaRange(row.rank_range, 'Hunter arena rank');
    if (value >= from && value <= to) return row;
  }
  return null;
}

export function hunterArenaDoubleRankRow(tables, rank) {
  const value = Number(rank);
  for (const row of tables.doubleRank) {
    const [from, to] = arenaRange(row.rank_range, 'Hunter arena double rank');
    if (value >= from && value <= to) return row;
  }
  return null;
}

export function hunterArenaLevelRow(tables, score) {
  const value = Number(score);
  let current = null;
  for (const row of tables.level) {
    if (Number(row.integral) <= value && (!current || Number(row.integral) > Number(current.integral))) current = row;
  }
  return current ?? tables.level[0] ?? null;
}

export function arenaContestStateAt(tables, secondsOfDay) {
  const value = Number(secondsOfDay);
  for (const row of tables.state) {
    if (value >= Number(row.start_time) && value < Number(row.end_time)) return row;
  }
  return null;
}

export function arenaContestRankAwardRow(tables, crossStage) {
  return tables.rankAward.filter(row => Number(row.cross_stage) === Number(crossStage));
}

