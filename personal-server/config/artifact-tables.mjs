import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

// ArtifactCmd 37060-37075 reads a single authority table family:
//   ArtifactTable.data.lua         -> Artifact/StarNode/BreakUp/Forge/FlyUp/Fetter/...
//   ArtifactTable.LevelUp.<q>.data -> level rows keyed quality*10000+level
// Both copies are rebuilt by tools/extract-artifact-table.mjs from the client
// LuaJIT assets; *_ValueIndex tables are computed indexes and stay out of the
// server configuration because readGeneratedTables does not support them.
const defaultTablePath = tableAsset('ArtifactTable.data.lua.json.gz');
const defaultLevelPath = tableAsset('ArtifactLevelUp.data.json.gz');
let defaultCache;

export const ARTIFACT_QUALITIES = Object.freeze([30, 40, 50, 60, 70]);

// ItemTable.TID_ARTIFACT_UPURSTAR_STONE is assigned by ItemTable.lua at bytecode
// pc 482 (KNUM 339002 -> TSETS TID_ARTIFACT_UPURSTAR_STONE). ReqUpURStar checks
// this resource against StarNode.stone_num for UR star nodes.
export const UR_STAR_STONE_TID = 339002;

const TABLE_NAMES = Object.freeze([
  'Artifact', 'Quality', 'QualityNode', 'QualityAddition',
  'StarNode', 'StarAddition', 'StarAttrType',
  'BreakUp', 'Forge', 'ForgeType', 'FlyUp', 'Fetter',
  'HandbookPageConfig', 'HandbookAddition', 'LevelUp'
]);

const EXPECTED = Object.freeze({
  Artifact: 18, Quality: 5, QualityNode: 6, QualityAddition: 6,
  StarNode: 55, StarAddition: 135, StarAttrType: 3,
  BreakUp: 155, Forge: 72, ForgeType: 3, FlyUp: 11, Fetter: 130,
  HandbookPageConfig: 18, HandbookAddition: 30, LevelUp: 5
});

// Artifact.GetCurQuality derives the quality tier from the artifact tid prefix:
// 1xxxxx=30, 2xxxxx=40, 3xxxxx=50, 4xxxxx=60, 5xxxxx=70. This is also why
// QualityNode keys exist only for the upgrades the shipped artifacts can make.
export function artifactQualityOf(tid) {
  const value = Number(tid);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  const quality = 20 + 10 * Math.floor(value / 100000);
  return ARTIFACT_QUALITIES.includes(quality) ? quality : null;
}

function requireRows(name, table) {
  if (!(table instanceof Map)) throw new Error('ArtifactTable.' + name + ' is missing');
  const expected = EXPECTED[name];
  if (expected !== undefined && table.size !== expected) {
    throw new Error('ArtifactTable.' + name + ' has ' + table.size + ' rows, expected ' + expected);
  }
  return table;
}

function readLevelRows(file) {
  const asset = readJsonAsset(file);
  if (!Array.isArray(asset?.rows)) throw new Error('ArtifactLevelUp rows are missing');
  const byKey = new Map();
  const byQuality = new Map(ARTIFACT_QUALITIES.map(quality => [quality, new Map()]));
  for (const raw of asset.rows) {
    const quality = Number(raw.quality);
    const level = Number(raw.level);
    const tid = Number(raw.tid);
    if (!byQuality.has(quality)) throw new Error('ArtifactLevelUp has an unexpected quality ' + raw.quality);
    if (!Number.isSafeInteger(level) || level < 0) throw new Error('ArtifactLevelUp has an invalid level');
    if (tid !== quality * 10000 + level) throw new Error('ArtifactLevelUp row ' + tid + ' does not match quality*10000+level');
    const row = Object.freeze({
      tid,
      quality,
      level,
      cost_type: Number(raw.cost_type) || 0,
      cost_num: Number(raw.cost_num) || 0,
      attr: Object.freeze((raw.attr ?? []).map(entry => Object.freeze([Number(entry[0]) || 0, Number(entry[1]) || 0])))
    });
    if (byKey.has(tid)) throw new Error('ArtifactLevelUp duplicate row ' + tid);
    byKey.set(tid, row);
    byQuality.get(quality).set(level, row);
  }
  return { byKey, byQuality, count: asset.rows.length, source: asset.source ?? null };
}

function freezeMap(map) {
  return new Map([...map].map(([key, value]) => [key, Object.freeze(value)]));
}

export function readArtifactTables(tableFile = defaultTablePath, levelFile = defaultLevelPath) {
  if (tableFile === defaultTablePath && levelFile === defaultLevelPath && defaultCache) return defaultCache;
  const raw = readGeneratedTables(tableFile, TABLE_NAMES);
  const rows = {};
  for (const name of TABLE_NAMES) rows[name] = freezeMap(requireRows(name, raw[name]));
  const levels = readLevelRows(levelFile);
  if (levels.count !== 3005) throw new Error('ArtifactLevelUp has ' + levels.count + ' rows, expected 3005');

  const forgeTypes = new Map([...rows.ForgeType].sort((left, right) => Number(left[0]) - Number(right[0])));
  const fetterByArtifact = new Map();
  for (const [id, row] of rows.Fetter) {
    for (const entry of row.artifact ?? []) {
      const tid = Number(entry?.[0]);
      if (!Number.isSafeInteger(tid) || tid <= 0) continue;
      if (!fetterByArtifact.has(tid)) fetterByArtifact.set(tid, []);
      fetterByArtifact.get(tid).push({ id: Number(id), row });
    }
  }
  for (const [tid, list] of fetterByArtifact) list.sort((left, right) => left.id - right.id);

  const tables = Object.freeze({
    source: Object.freeze({
      table: tableFile instanceof URL ? tableFile.pathname.split('/').pop() : String(tableFile),
      level: levelFile instanceof URL ? levelFile.pathname.split('/').pop() : String(levelFile),
      rows: Object.freeze(Object.fromEntries(TABLE_NAMES.map(name => [name, rows[name].size]))),
      levelRows: levels.count
    }),
    artifacts: rows.Artifact,
    quality: rows.Quality,
    qualityNodes: rows.QualityNode,
    starNodes: rows.StarNode,
    breakUps: rows.BreakUp,
    forges: rows.Forge,
    forgeTypes,
    flyUps: rows.FlyUp,
    fetters: rows.Fetter,
    handbookPages: rows.HandbookPageConfig,
    handbookAdditions: rows.HandbookAddition,
    levelUpNames: rows.LevelUp,
    levels: levels.byQuality,
    artifact(tid) { return rows.Artifact.get(Number(tid)) ?? null; },
    // Artifact.GetCostChipCfg reads ArtifactTable.StarNode[quality*100+star+1].
    starNode(quality, star) { return rows.StarNode.get(Number(quality) * 100 + Number(star) + 1) ?? null; },
    // Artifact.GetBreakLvCfg reads ArtifactTable.BreakUp[quality*100+breakLv].
    breakUp(quality, breakLevel) { return rows.BreakUp.get(Number(quality) * 100 + Number(breakLevel)) ?? null; },
    // Artifact.GetForgeId builds artifactTid*100+forgeStage.
    forge(tid, stage) { return rows.Forge.get(Number(tid) * 100 + Number(stage)) ?? null; },
    flyUp(tid) { return rows.FlyUp.get(Number(tid)) ?? null; },
    levelUp(quality, level) { return levels.byQuality.get(Number(quality))?.get(Number(level)) ?? null; },
    fettersForArtifact(tid) { return fetterByArtifact.get(Number(tid)) ?? []; },
    qualityOf: artifactQualityOf,
    forgeType(type) { return forgeTypes.get(Number(type)) ?? null; },
    maxStarOf(tid) {
      const artifact = rows.Artifact.get(Number(tid));
      if (!artifact) return null;
      return Number(artifact.init_star) + Number(artifact.max_star);
    }
  });
  if (tableFile === defaultTablePath && levelFile === defaultLevelPath) defaultCache = tables;
  return tables;
}