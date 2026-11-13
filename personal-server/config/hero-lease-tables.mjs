import { readJsonAsset, tableAsset } from '../assets.mjs';
import { readGeneratedDump } from './hero-tables.mjs';

const defaultHeroLeasePath = tableAsset('HeroLeaseTable.data.lua.json.gz');
const defaultLeasePath = tableAsset('LeaseTable.data.lua.json.gz');
let defaultCache;

const EXPECTED_COUNTS = Object.freeze({
  HeroLease: 7,
  Hook: 3,
  HeroLineup: 31,
  Func: 1,
  Extra: 0,
  Unit: 4,
  LeaseLineup: 4
});

function rowsOf(dump, name) {
  const table = dump?.[name];
  if (!table || typeof table !== 'object') throw new Error(`Hero lease table ${name} is missing`);
  const source = table instanceof Map ? [...table.values()] : Object.values(table);
  const rows = source.sort((left, right) => Number(left.tid) - Number(right.tid));
  return rows;
}

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new Error(`Invalid hero lease ${label}`);
  return number;
}

function normalizeHeroLease(row) {
  const luaModule = row.lua_module && typeof row.lua_module === 'object' ? row.lua_module.global : null;
  return Object.freeze({
    tid: integer(row.tid, 'tid', { min: 1 }),
    max_lease_num: integer(row.max_lease_num, 'max lease count'),
    max_place_num: integer(row.max_place_num, 'max place count'),
    cache_flush_time: integer(row.cache_flush_time, 'cache flush time'),
    day_refresh: Boolean(row.day_refresh),
    lua_module: luaModule === null ? null : String(luaModule),
    lease_award_id: integer(row.lease_award_id, 'lease award id'),
    lease_award_num: integer(row.lease_award_num, 'lease award count'),
    lease_award_max: integer(row.lease_award_max, 'lease award maximum')
  });
}

function validate(hd, lease) {
  const heroRows = rowsOf(hd, 'HeroLease');
  const hooks = rowsOf(hd, 'Hook');
  const heroLineups = rowsOf(hd, 'Lineup');
  const funcs = rowsOf(lease, 'Func');
  const extras = rowsOf(lease, 'Extra');
  const units = rowsOf(lease, 'Unit');
  const leaseLineups = rowsOf(lease, 'Lineup');
  const actual = {
    HeroLease: heroRows.length,
    Hook: hooks.length,
    HeroLineup: heroLineups.length,
    Func: funcs.length,
    Extra: extras.length,
    Unit: units.length,
    LeaseLineup: leaseLineups.length
  };
  for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (actual[name] !== expected) throw new Error(`Hero lease table ${name} has ${actual[name]} rows; expected ${expected}`);
  }

  const heroLease = heroRows.map(normalizeHeroLease);
  const active = heroLease.filter(row => row.max_lease_num > 0 || row.max_place_num > 0);
  if (active.length !== 1 || active[0].tid !== 1) throw new Error('Hero lease active function must be func_tid 1');
  if (active[0].lua_module !== 'GuildEmployMgr') throw new Error('Hero lease client manager is not GuildEmployMgr');
  if (active[0].max_lease_num !== 3 || active[0].max_place_num !== 3 || active[0].day_refresh !== true) {
    throw new Error('Hero lease limits or daily refresh configuration changed unexpectedly');
  }

  const normalizedHooks = hooks.map(row => Object.freeze({
    tid: integer(row.tid, 'hook tid', { min: 1 }),
    lease: integer(row.lease, 'hook lease tid', { min: 1 }),
    index: integer(row.index, 'hook index', { min: 1, max: 3 })
  })).sort((left, right) => left.index - right.index);
  if (normalizedHooks.map(row => row.tid).join(',') !== '17,18,19'
      || normalizedHooks.some(row => row.lease !== 1 || row.tid !== row.index + 16)) {
    throw new Error('Hero lease guild placement hooks changed unexpectedly');
  }

  const unitByPb = new Map(units.map(row => [String(row.pb), Object.freeze({
    tid: integer(row.tid, 'lease unit tid', { min: 1 }), pb: String(row.pb)
  })]));
  if (unitByPb.get('pb_lease_hero')?.tid !== 1) throw new Error('Hero lease unit mapping is missing pb_lease_hero');
  const func = funcs[0];
  if (integer(func.tid, 'lease func tid', { min: 1 }) !== 1) throw new Error('Lease function configuration is missing func 1');

  return Object.freeze({
    heroLease: Object.freeze(heroLease),
    hooks: Object.freeze(normalizedHooks),
    heroLineups: Object.freeze(heroLineups),
    funcs: Object.freeze(funcs),
    extras: Object.freeze(extras),
    units: Object.freeze(units),
    leaseLineups: Object.freeze(leaseLineups),
    unitByPb,
    active: active[0],
    slotForFunc(funcTid) {
      const index = heroLease.findIndex(row => row.tid === Number(funcTid));
      return index < 0 ? null : index;
    },
    placementIndexes: new Set(normalizedHooks.filter(row => row.lease === 1).map(row => row.index))
  });
}

export function readHeroLeaseTables(heroLeaseFile = defaultHeroLeasePath, leaseFile = defaultLeasePath) {
  if (heroLeaseFile === defaultHeroLeasePath && leaseFile === defaultLeasePath && defaultCache) return defaultCache;
  const heroDump = readGeneratedDump(readJsonAsset(heroLeaseFile), ['HeroLease', 'Hook', 'Lineup']);
  const leaseDump = readGeneratedDump(readJsonAsset(leaseFile), ['Func', 'Extra', 'Unit', 'Lineup']);
  const tables = validate(heroDump, leaseDump);
  if (heroLeaseFile === defaultHeroLeasePath && leaseFile === defaultLeasePath) defaultCache = tables;
  return tables;
}

