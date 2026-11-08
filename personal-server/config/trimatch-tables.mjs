import { readJsonAsset, tableAsset } from '../assets.mjs';

// Tables are extracted from the shipped LuaJIT table bytecode by
// tools/extract-trimatch-tables.mjs. See
// agent/workflow/gameplay-completion/BATTLE-TRIPLEMATCHFIGHT/implementation.md
// for the extraction record and the recovered field meanings.
const defaultPath = tableAsset('TripleMatchTable.data.lua.json');
const fightPath = tableAsset('TripleMatchFightTable.data.lua.json');
const heroPath = tableAsset('BattleTriMatchHeroTable.data.lua.json');
const equipPath = tableAsset('BattleTriMatchEquipTable.data.lua.json');
const lineupPath = tableAsset('BattleTriMatchLineupTable.data.lua.json');
const pvpPath = tableAsset('TriMatchPvpTable.data.lua.json');
const towerPath = tableAsset('TriMatchTowerTable.data.lua.json');
// TripleMatchFightTable.NpcAttr is shipped as 31 separate data shards; the
// extractor merges them into one dump so Team.attr can be resolved.
const npcAttrPath = tableAsset('TripleMatchFightNpcAttr.data.lua.json');
let defaultCache;

function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  // TripleMatchTable is shared with the mini-game block, which stores plain
  // row arrays; the tri-match extractor stores { fields, rows }. Accept both so
  // one shipped asset can serve both readers.
  const rows = Array.isArray(table) ? table : table?.rows;
  if (!Array.isArray(rows)) throw new Error('Missing triple match table: ' + name);
  return rows;
}

function byTid(rows) {
  const map = new Map();
  for (const row of rows) {
    const tid = Number(row.tid);
    if (Number.isSafeInteger(tid) && tid > 0) map.set(tid, row);
  }
  return map;
}

// Rows that carry a lib column are grouped by it, matching the client table
// access pattern <Table>.Tile_List[lib].
function groupByLib(rows) {
  const map = new Map();
  for (const row of rows) {
    const lib = Number(row.lib);
    if (!Number.isSafeInteger(lib)) continue;
    if (!map.has(lib)) map.set(lib, []);
    map.get(lib).push(row);
  }
  return map;
}

function pairs(value, label) {
  if (!Array.isArray(value)) return [];
  return value.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

export function readTriMatchTables(file = defaultPath, paths = {}) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const fight = readJsonAsset(paths.fight ?? fightPath);
  const hero = readJsonAsset(paths.hero ?? heroPath);
  const equip = readJsonAsset(paths.equip ?? equipPath);
  const lineup = readJsonAsset(paths.lineup ?? lineupPath);
  const pvp = readJsonAsset(paths.pvp ?? pvpPath);
  const tower = readJsonAsset(paths.tower ?? towerPath);
  const npcAttr = readJsonAsset(paths.npcAttr ?? npcAttrPath);

  const tileRows = rowsOf(dump, 'Tile');
  const tilesByLib = new Map();
  for (const row of tileRows) {
    const lib = Number(row.lib);
    if (!Number.isSafeInteger(lib)) continue;
    if (!tilesByLib.has(lib)) tilesByLib.set(lib, []);
    tilesByLib.get(lib).push(row);
  }

  const heroLevels = byTid(rowsOf(hero, 'UpLevel'));
  const equipLevels = byTid(rowsOf(equip, 'UpLevel'));
  const equipLevelsByType = new Map();
  for (const row of equipLevels.values()) {
    const type = Number(row.equip_type);
    if (!Number.isSafeInteger(type)) continue;
    if (!equipLevelsByType.has(type)) equipLevelsByType.set(type, []);
    equipLevelsByType.get(type).push(row);
  }
  for (const list of equipLevelsByType.values()) list.sort((left, right) => Number(left.level) - Number(right.level));

  const starRows = rowsOf(hero, 'UpStar');
  const starByHero = new Map();
  for (const row of starRows) {
    const heroTid = Number(row.hero);
    if (!Number.isSafeInteger(heroTid)) continue;
    if (!starByHero.has(heroTid)) starByHero.set(heroTid, []);
    starByHero.get(heroTid).push(row);
  }
  for (const list of starByHero.values()) list.sort((left, right) => Number(left.star) - Number(right.star));

  const attrRows = rowsOf(hero, 'Attr');
  const attrByTemplateLevel = new Map();
  for (const row of attrRows) {
    const key = Number(row.template) + ':' + Number(row.level_tid);
    attrByTemplateLevel.set(key, row);
  }

  const result = {
    source: dump.source ?? null,
    fields: { TripleMatchTable: dump.tables, TripleMatchFightTable: fight.tables, BattleTriMatchHeroTable: hero.tables, BattleTriMatchEquipTable: equip.tables, BattleTriMatchLineupTable: lineup.tables, TriMatchPvpTable: pvp.tables, TriMatchTowerTable: tower.tables, TripleMatchFightNpcAttr: npcAttr.tables },
    gate: byTid(rowsOf(dump, 'Gate')),
    game: byTid(rowsOf(dump, 'Game')),
    tiles: byTid(tileRows),
    tilesByLib,
    tileTypes: byTid(rowsOf(dump, 'TileType')),
    fightLevels: byTid(rowsOf(dump, 'FightLevel')),
    scoreRows: byTid(rowsOf(dump, 'Score')),
    fightTypes: byTid(rowsOf(fight, 'Type')),
    fightConst: rowsOf(fight, 'Const')[0] ?? null,
    fightNpcs: byTid(rowsOf(fight, 'Npc')),
    fightAttrs: byTid(rowsOf(fight, 'Attr')),
    fightRows: byTid(rowsOf(fight, 'TripleMatchFight')),
    fightTeams: byTid(rowsOf(fight, 'Team')),
    fightBoards: byTid(rowsOf(fight, 'Board')),
    fightTiles: byTid(rowsOf(fight, 'Tile')),
    fightTilesByLib: groupByLib(rowsOf(fight, 'Tile')),
    fightNpcAbilities: byTid(rowsOf(fight, 'NpcAbility')),
    fightActionTypes: byTid(rowsOf(fight, 'ActionType')),
    fightSpeeds: byTid(rowsOf(fight, 'Speed')),
    fightScenes: byTid(rowsOf(fight, 'Scene')),
    npcAttrs: byTid(rowsOf(npcAttr, 'NpcAttr')),
    heroes: byTid(rowsOf(hero, 'Hero')),
    heroLevels,
    heroAttrByTemplateLevel: attrByTemplateLevel,
    heroStarByHero: starByHero,
    heroConst: rowsOf(hero, 'Const')[0] ?? null,
    powerConst: rowsOf(hero, 'BattleTriMatchPowerConst')[0] ?? null,
    professions: byTid(rowsOf(hero, 'Profession')),
    equipTypes: byTid(rowsOf(equip, 'Type')),
    equipLevels,
    equipLevelsByType,
    lineupConst: rowsOf(lineup, 'Const')[0] ?? null,
    lineupTypes: byTid(rowsOf(lineup, 'Type')),
    lineupSuggest: rowsOf(lineup, 'Suggest'),
    pvpVersion: rowsOf(pvp, 'Version')[0] ?? null,
    pvpGrades: byTid(rowsOf(pvp, 'ActGrade')),
    pvpTasks: byTid(rowsOf(pvp, 'ActTask')),
    pvpRankAwards: byTid(rowsOf(pvp, 'ActRankAward')),
    pvpRobotConst: rowsOf(pvp, 'ActRobotConst')[0] ?? null,
    pvpRobots: byTid(rowsOf(pvp, 'ActRobot')),
    towerVersion: rowsOf(tower, 'Version')[0] ?? null,
    towerMissions: byTid(rowsOf(tower, 'Mission')),
    towerProAwards: byTid(rowsOf(tower, 'ProAward')),
    towerBuffs: byTid(rowsOf(tower, 'Buff'))
  };
  if (file === defaultPath) defaultCache = result;
  return result;
}

export function triMatchCellCount(tables) {
  const value = Number(tables.heroConst?.cell_count ?? 0);
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

export function triMatchMaxPreset(tables) {
  const value = Number(tables.lineupConst?.max_preset ?? 0);
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

export function heroLevelRow(tables, levelTid) {
  return tables.heroLevels.get(Number(levelTid)) ?? null;
}

// The first configured level of a table holds the initial training tier: the
// client's UpLevel rows are ordered by level and row 1 has no cost.
export function firstHeroLevelTid(tables) {
  let best = null;
  for (const row of tables.heroLevels.values()) {
    const level = Number(row.level);
    if (!Number.isSafeInteger(level)) continue;
    if (!best || level < Number(best.level) || (level === Number(best.level) && Number(row.tid) < Number(best.tid))) best = row;
  }
  return best ? Number(best.tid) : null;
}

export function heroLevelAwards(row) {
  return pairs(row?.cost_item, 'Triple match hero level');
}

export function heroStarRow(tables, heroTid, star) {
  const rows = tables.heroStarByHero.get(Number(heroTid)) ?? [];
  return rows.find(row => Number(row.star) === Number(star)) ?? null;
}

export function heroStarCost(row) {
  return pairs(row?.cost_item, 'Triple match hero star');
}

export function heroStarAttr(row) {
  if (!Array.isArray(row?.attr)) return [];
  return row.attr.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error('Triple match hero star attribute is invalid');
    return [Number(entry[0]), Number(entry[1])];
  });
}

export function heroBaseAttr(tables, template, levelTid) {
  const row = tables.heroAttrByTemplateLevel.get(Number(template) + ':' + Number(levelTid));
  if (!row) return null;
  return row.attr;
}

export function equipLevelRow(tables, levelTid) {
  return tables.equipLevels.get(Number(levelTid)) ?? null;
}

export function firstEquipLevelTid(tables, equipType) {
  const list = tables.equipLevelsByType.get(Number(equipType)) ?? [];
  if (!list.length) return null;
  return Number(list[0].tid);
}

export function equipNextLevelRow(tables, currentLevelTid) {
  const row = tables.equipLevels.get(Number(currentLevelTid));
  if (!row) return null;
  const list = tables.equipLevelsByType.get(Number(row.equip_type)) ?? [];
  const index = list.findIndex(candidate => Number(candidate.tid) === Number(currentLevelTid));
  if (index < 0) return null;
  return list[index + 1] ?? null;
}

export function equipCost(row) {
  return pairs(row?.cost_item, 'Triple match equip level');
}

export function tileOf(tables, tid) {
  return tables.tiles.get(Number(tid)) ?? null;
}

export function tilesForLib(tables, lib) {
  const list = tables.tilesByLib.get(Number(lib));
  if (!list || !list.length) throw new Error('Triple match tile library ' + lib + ' is not configured');
  return list;
}

export function fightTypeRow(tables, type) {
  return tables.fightTypes.get(Number(type)) ?? null;
}

export function towerMissionByFightTid(tables, fightTid) {
  for (const row of tables.towerMissions.values()) if (Number(row.fight_tid) === Number(fightTid)) return row;
  return null;
}

export function towerMissionRow(tables, tid) {
  return tables.towerMissions.get(Number(tid)) ?? null;
}

export function towerProAwardRow(tables, tid) {
  return tables.towerProAwards.get(Number(tid)) ?? null;
}

export function pvpRobotByFightTid(tables, fightTid) {
  for (const row of tables.pvpRobots.values()) if (Number(row.fight) === Number(fightTid)) return row;
  return null;
}
