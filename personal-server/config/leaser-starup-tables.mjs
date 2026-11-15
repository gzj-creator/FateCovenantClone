import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('LeaserStarUpTable.data.json.gz');
let defaultCache;

const TABLE_NAMES = Object.freeze([
  'Type', 'TypeInfo', 'Const', 'Hero', 'Artifact', 'Pet', 'Elves',
  'HeroStar', 'ArtifactStar', 'PetStar', 'ElvesStar', 'Reset'
]);

const EXPECTED_COUNTS = Object.freeze({
  Type: 4,
  TypeInfo: 4,
  Const: 1,
  Hero: 65,
  Artifact: 12,
  Pet: 9,
  Elves: 9,
  HeroStar: 727,
  ArtifactStar: 124,
  PetStar: 88,
  ElvesStar: 88,
  Reset: 60
});

const COST_ITEMS = Object.freeze({
  Hero: 7401900,
  Artifact: 7501900,
  Pet: 7601900,
  Elves: 7701900
});

const DEFINITIONS = Object.freeze([
  Object.freeze({ type: 1, name: 'Hero', configName: 'Hero', developField: 'hero', starName: 'HeroStar', leaseKind: 'hero' }),
  Object.freeze({ type: 2, name: 'Artifact', configName: 'Artifact', developField: 'artifact', starName: 'ArtifactStar', leaseKind: 'artifact' }),
  Object.freeze({ type: 3, name: 'Pet', configName: 'Pet', developField: 'pet', starName: 'PetStar', leaseKind: 'pet' }),
  Object.freeze({ type: 4, name: 'Elves', configName: 'Elves', developField: 'elves', starName: 'ElvesStar', leaseKind: 'elves' })
]);

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new Error(`Invalid LeaserStarUp table ${label}`);
  return number;
}

function freezeRows(table, label, expected) {
  if (!(table instanceof Map)) throw new Error(`LeaserStarUp table ${label} is missing`);
  if (table.size !== expected) throw new Error(`LeaserStarUp table ${label} has ${table.size} rows; expected ${expected}`);
  const rows = new Map([...table].map(([key, value]) => [Number(key), Object.freeze({ ...value, tid: integer(value?.tid ?? key, `${label}.tid`, { min: 1 }) })]));
  if (rows.size !== expected) throw new Error(`LeaserStarUp table ${label} has duplicate tids`);
  return rows;
}

function starKey(developTid, quality, star) {
  const value = Number(developTid) * 10000 + Number(quality) * 1000 + Number(star);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid LeaserStarUp object key input');
  return value;
}

function starParts(key) {
  const value = integer(key, 'star key', { min: 10000 });
  const configTid = Math.floor(value / 10000);
  const remainder = value - configTid * 10000;
  return { configTid, quality: Math.floor(remainder / 1000), star: remainder % 1000 };
}

export function readLeaserStarUpTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const raw = readGeneratedTables(file, TABLE_NAMES);
  const tables = {};
  for (const name of TABLE_NAMES) tables[name] = freezeRows(raw[name], name, EXPECTED_COUNTS[name]);

  const constant = [...tables.Const.values()][0];
  if (Number(constant.leaser_func) !== 1 || Number(constant.hero_leaser_func) !== 7) {
    throw new Error('LeaserStarUp lease function ids do not match the recovered client contract');
  }
  if (constant.reset_custom_limit !== undefined && constant.reset_custom_limit !== null && constant.reset_custom_limit !== '') {
    throw new Error('LeaserStarUp reset_custom_limit has executable semantics that are not implemented');
  }
  const typeInfoByType = new Map([...tables.TypeInfo.values()].map(row => [integer(row.type, 'TypeInfo.type', { min: 1 }), row]));
  if (typeInfoByType.size !== 4 || DEFINITIONS.some(definition => !typeInfoByType.has(definition.type))) {
    throw new Error('LeaserStarUp TypeInfo does not cover all four development kinds');
  }

  const definitionsByType = new Map();
  const definitionsByDevelopTid = new Map();
  const starRowsByDefinition = new Map();
  for (const definition of DEFINITIONS) {
    const configRows = tables[definition.configName];
    const starRows = tables[definition.starName];
    const starsByConfigTid = new Map();
    for (const [key, row] of starRows) {
      const parts = starParts(key);
      if (key !== starKey(parts.configTid, parts.quality, parts.star)) throw new Error(`Invalid ${definition.starName} key ${key}`);
      if (!starsByConfigTid.has(parts.configTid)) starsByConfigTid.set(parts.configTid, []);
      starsByConfigTid.get(parts.configTid).push(Object.freeze({
        key,
        ...parts,
        costNum: integer(row.cost_num, `${definition.starName}.${key}.cost_num`),
        row
      }));
    }
    for (const rows of starsByConfigTid.values()) rows.sort((left, right) => left.key - right.key);
    if (starsByConfigTid.size !== configRows.size) {
      throw new Error(`LeaserStarUp ${definition.starName} does not cover every ${definition.configName} row`);
    }

    const definitionsByConfigTid = new Map();
    for (const row of configRows.values()) {
      const developTid = integer(row[definition.developField], `${definition.configName}.${row.tid}.${definition.developField}`, { min: 1 });
      if (Number(row.version) !== 1) throw new Error(`LeaserStarUp ${definition.configName}.${row.tid} has an unexpected version`);
      const costItem = integer(row.cost_item, `${definition.configName}.${row.tid}.cost_item`, { min: 1 });
      if (costItem !== COST_ITEMS[definition.configName]) throw new Error(`LeaserStarUp ${definition.configName} cost item changed unexpectedly`);
      if (!starsByConfigTid.has(row.tid)) throw new Error(`LeaserStarUp ${definition.starName} is missing config tid ${row.tid}`);
      if (definitionsByDevelopTid.has(developTid)) throw new Error(`LeaserStarUp develop tid ${developTid} is duplicated`);
      const normalized = Object.freeze({
        ...definition,
        configTid: row.tid,
        version: Number(row.version),
        developTid,
        costItem,
        unlockCondition: row.unlock_condition ?? null,
        starRows: Object.freeze(starsByConfigTid.get(row.tid))
      });
      definitionsByConfigTid.set(row.tid, normalized);
      definitionsByDevelopTid.set(developTid, normalized);
    }
    definitionsByType.set(definition.type, definitionsByConfigTid);
    starRowsByDefinition.set(definition.type, starsByConfigTid);
  }

  const resetRows = [...tables.Reset.values()].sort((left, right) => left.tid - right.tid);
  if (resetRows.some(row => Number(row.version) !== 1)) throw new Error('LeaserStarUp Reset has an unsupported version');
  const resetByVersion = new Map([[1, Object.freeze(resetRows.map(row => Object.freeze({
    tid: row.tid,
    version: Number(row.version),
    cost: integer(row.cost, `Reset.${row.tid}.cost`),
    costNum: integer(row.cost_num, `Reset.${row.tid}.cost_num`)
  })))]]);
  const freeTimes = resetRows.filter(row => Number(row.cost) === 0).length;

  const result = Object.freeze({
    source: file instanceof URL ? file.pathname.split('/').pop() : String(file),
    counts: Object.freeze(Object.fromEntries(Object.entries(EXPECTED_COUNTS))),
    leaserFunc: Number(constant.leaser_func),
    heroLeaserFunc: Number(constant.hero_leaser_func),
    resetCustomLimit: constant.reset_custom_limit ?? null,
    definitionsByType,
    definitionsByDevelopTid,
    starRowsByDefinition,
    resetByVersion,
    freeTimes,
    starKey,
    starParts,
    definitionForDevelopTid(tid) { return definitionsByDevelopTid.get(Number(tid)) ?? null; },
    definitionForConfigTid(type, tid) { return definitionsByType.get(Number(type))?.get(Number(tid)) ?? null; }
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}
