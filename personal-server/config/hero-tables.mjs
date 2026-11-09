import { readJsonAsset, tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('HeroTable.data.lua.json');
const defaultFantasyEquipPath = tableAsset('FantasyEquipTable.data.json');
const defaultLeaderEquipPath = tableAsset('LeaderEquipTable.data.lua.json');
let defaultCache;
let defaultFantasyEquipCache;
let defaultLeaderEquipCache;

// Interpret generated, straight-line table constructors without executing Lua.
export function readHeroTables(file = defaultPath) {
  const names = [
    'Hero', 'UpLevel', 'UpStage', 'UpStarCost', 'UpStarStone', 'Star',
    'DevelopConst', 'AbilityLevel', 'UpStageTalent', 'Ability', 'Npc', 'Npc_Ability', 'Draw', 'DrawConst',
    'DrawNumLimit', 'Guaranteed', 'Quality', 'DrawAchievementAward',
    'DrawExchangeHero',
    'DrawAchievementLib', 'NormalDrawExchangeLineup', 'HandbookConstant',
    'TeamSuggest', 'TeamSuggestAward', 'TeamSuggestType', 'TeamSuggestTeamType',
    // TeamGenreMgr stores each current cycle and its claimed-award bitmap in
    // HeroDataMgr login slot 8. The current rules use TeamGenreCycle/Award;
    // retain the pre-split tables so local servers created from older clients
    // still receive valid rows.
    'TeamGenre', 'TeamGenreType', 'TeamGenreCycle', 'TeamGenreAward',
    'TeamGenreCycleOld', 'TeamGenreAwardOld', 'TeamGenreConst', 'TeamGenreShow',
    'StrategyTeamGenre',
    // Hero favour/"training" (HeroFavorMgr): the login module stores the
    // player's accumulated favour while these tables own gift values, level
    // thresholds, rewards, break caps and playground eligibility.
    'AllFavourLevel', 'FavourConst', 'FavourGift', 'FavourBreak',
    'FavourLevel', 'PlaygroundUnlock', 'PlaygroundAward',
    // Hero visit (HeroFavorMgr roleVisitData / HeroCmd 647): VisitConst owns
    // the daily count, VisitUnlock gates heroes and Visit owns the chip reward.
    'VisitConst', 'Visit', 'VisitUnlock',
    // Hero reforge (HeroCmd 663/664/665): Reforge owns per-hero availability and
    // skill milestones, ReforgeAttr the weighted attribute pool and
    // ReforgeConst the base cost/lock ratios/attribute count.
    'Reforge', 'ReforgeAttr', 'ReforgeConst',
    // Hero mastery ("专精"): Mastery maps a hero tid to its mastery group,
    // MasteryGroup indexes the level/break rows, MasteryLevel/MasteryBreak own
    // the costs and attribute grants, and MasteryConst holds the unlock star.
    'Mastery', 'MasteryGroup', 'MasteryLevel', 'MasteryBreak', 'MasteryConst', 'MasteryMat'
  ];
  if (file === defaultPath) return defaultCache ??= readGeneratedTables(file, names);
  return readGeneratedTables(file, names);
}

export function readFantasyEquipTables(file = defaultFantasyEquipPath) {
  if (file === defaultFantasyEquipPath && defaultFantasyEquipCache) return defaultFantasyEquipCache;
  const tables = readGeneratedTables(file, ['DrawNormal', 'DrawNormalWish', 'DrawUnlock', 'FantasyEquip']);
  if (file === defaultFantasyEquipPath) defaultFantasyEquipCache = tables;
  return tables;
}

export function readLeaderEquipTables(file = defaultLeaderEquipPath) {
  if (file === defaultLeaderEquipPath && defaultLeaderEquipCache) return defaultLeaderEquipCache;
  const tables = readGeneratedTables(file, ['LeaderEquip', 'Grade']);
  if (file === defaultLeaderEquipPath) defaultLeaderEquipCache = tables;
  return tables;
}

export function readGeneratedTables(file, names) {
  const parsed = readJsonAsset(file);
  return readGeneratedDump(parsed, names);
}

// Some extracted table families only ship as LuaJIT bytecode. Keep the
// interpreter reusable so callers can parse a dump in memory instead of
// requiring a generated JSON copy beside it.
export function readGeneratedDump(parsed, names) {
  // Row-level dumps written by tools/extract-lua-table-rows.mjs hold decoded
  // rows instead of Lua prototypes. Serve them through the same map shape so
  // one table file works for readers built around either dump format.
  if (parsed && !parsed.prototypes && parsed.tables && typeof parsed.tables === 'object') {
    const tables = {};
    for (const name of names) {
      const source = parsed.tables[name];
      const rows = Array.isArray(source) ? source : source?.rows;
      if (!Array.isArray(rows)) throw new Error('Missing generated configuration: ' + name);
      const fields = Array.isArray(source?.fields) ? source.fields : null;
      tables[name] = new Map(rows.map((row, index) => {
        const value = fields && Array.isArray(row)
          ? Object.fromEntries(fields.map((field, position) => [field, row[position]]))
          : row;
        return [Number(value?.tid ?? index + 1), value];
      }));
    }
    return tables;
  }
  const root = parsed.prototypes[parsed.rootPrototype];
  const constructors = new Map();
  for (let n = 0; n < root.instructions.length - 1; n++) {
    const i = root.instructions[n], next = root.instructions[n + 1];
    if (i.name === 'KSTR' && next.name === 'FNEW') constructors.set(root.constants[i.d].value, root.constants[next.d].prototype);
  }
  const tables = {};
  for (const name of names) {
    const p = name === '$root' ? root : parsed.prototypes[constructors.get(name)];
    if (!p) throw new Error('Missing generated configuration: ' + name);
    const r = [];
    const literal = c => new Map([...c.array.map((v, i) => [i, v]), ...c.hash].filter(([, v]) => v !== null));
    let result;
    for (const i of p.instructions) {
      const { a, b, c, d } = i;
      switch (i.name) {
        case 'TDUP': r[a] = literal(p.constants[d]); break;
        case 'TNEW': r[a] = new Map(); break;
        case 'GGET': {
          const global = p.constants[d].value;
          if (global === 'setmetatable') r[a] = (row, meta) => { row.fieldIndices = meta.fieldIndices; return row; };
          else if (global === 'rawget') r[a] = 'rawget';
          else if (global === 'TableEmpty') r[a] = new Map();
          else r[a] = { reference: global };
          break;
        }
      // Draw/lottery activity tables read a few engine values through upvalues.
      // Those values never carry server rules, so keep them as inert references,
      // matching the GGET fallback above.
        case 'UGET': r[a] = { reference: 'upvalue' + d }; break;
        case 'FNEW': r[a] = { fieldIndices: r[0] }; break;
        case 'TSETS':
          if (p.constants[c].value !== '__index') throw new Error('Unsupported configuration member');
          r[b].fieldIndices = r[a].fieldIndices; break;
        case 'TSETB': r[b].set(c, r[a]); break;
        case 'TSETV': r[b].set(r[c], r[a]); break;
        case 'TSETM': {
          // LuaJIT uses TSETM to append the result range from the preceding
          // call to the table in A-1. Generated table files mostly use it for
          // engine values such as Vector3 that are irrelevant to server rules;
          // retain any ordinary array result and leave external references as
          // unsupported values instead of rejecting the whole table family.
          const target = r[a - 1];
          const source = r[a];
          if (!(target instanceof Map)) throw new Error('Invalid TSETM destination');
          const values = source instanceof Map
            ? [...source].filter(([key]) => Number.isInteger(key) && key > 0).sort(([left], [right]) => left - right).map(([, value]) => value)
            : Array.isArray(source) ? source : [];
          const start = Number(d) > 0 ? Number(d) : 1;
          for (let offset = 0; offset < values.length; offset++) target.set(start + offset, values[offset]);
          break;
        }
        case 'TGETB': r[a] = r[b].get(c); break;
        case 'TGETS': r[a] = r[b] instanceof Map ? r[b].get(p.constants[c].value) : { reference: String(r[b]?.reference ?? '') + '.' + p.constants[c].value }; break;
        case 'TGETV': r[a] = r[b] instanceof Map ? r[b].get(r[c]) : { reference: String(r[b]?.reference ?? '') + '.' + String(r[c]) }; break;
        case 'MOV': r[a] = r[d]; break;
        case 'KSHORT': r[a] = d >= 32768 ? d - 65536 : d; break;
        case 'KNUM': r[a] = p.numbers[d]; break;
        case 'KPRI': r[a] = [null, false, true][d]; break;
        case 'KSTR': r[a] = p.constants[d].value; break;
        case 'CALL':
          if (typeof r[a] === 'function' && b === 2 && c === 3) r[a] = r[a](r[a + 2], r[a + 3]);
          // Generated table files also wrap rows in lazy-registration helpers. The wrapper only
          // stores the row prototype for later table construction, so nothing is needed here.
          else r[a] = undefined;
          break;
        case 'UCLO': break;
        case 'RET1': result = r[a]; break;
        default: throw new Error('Unsupported configuration instruction: ' + i.name);
      }
    }
    const convert = value => {
      if (!(value instanceof Map)) return value;
      if (value.fieldIndices) return Object.fromEntries([...value.fieldIndices].map(([field, index]) => [field, convert(value.get(index))]));
      if ([...value.keys()].every(k => Number.isInteger(k) && k >= 0)) return [...value].filter(([k]) => k > 0).sort(([a], [b]) => a - b).map(([, v]) => convert(v));
      return Object.fromEntries([...value].map(([k, v]) => [k, convert(v)]));
    };
    tables[name] = new Map([...result].map(([key, value]) => [key, value instanceof Map && !value.fieldIndices ? Object.fromEntries([...r[0]].map(([field, index]) => [field, convert(value.get(index))])) : convert(value)]));
  }
  return tables;
}
