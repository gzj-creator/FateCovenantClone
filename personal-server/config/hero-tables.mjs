import fs from 'node:fs';

const defaultPath = new URL('../../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/HeroTable.data.lua.json', import.meta.url);
const defaultFantasyEquipPath = new URL('../../analysis/recruitment-debug/bytecode/FantasyEquipTable.data.json', import.meta.url);
const defaultLeaderEquipPath = new URL('../../analysis/recruitment-debug/bytecode/LeaderEquipTable.data.lua.json', import.meta.url);
let defaultCache;
let defaultFantasyEquipCache;
let defaultLeaderEquipCache;

// Interpret generated, straight-line table constructors without executing Lua.
export function readHeroTables(file = defaultPath) {
  const names = [
    'Hero', 'UpLevel', 'UpStage', 'UpStarCost', 'UpStarStone', 'Star',
    'DevelopConst', 'Ability', 'Npc', 'Npc_Ability', 'Draw', 'DrawConst',
    'DrawNumLimit', 'Guaranteed', 'Quality', 'DrawAchievementAward',
    'DrawAchievementLib', 'NormalDrawExchangeLineup', 'TeamSuggest',
    'TeamSuggestAward', 'TeamSuggestType', 'TeamSuggestTeamType'
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
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const root = parsed.prototypes[parsed.rootPrototype];
  const constructors = new Map();
  for (let n = 0; n < root.instructions.length - 1; n++) {
    const i = root.instructions[n], next = root.instructions[n + 1];
    if (i.name === 'KSTR' && next.name === 'FNEW') constructors.set(root.constants[i.d].value, root.constants[next.d].prototype);
  }
  const tables = {};
  for (const name of names) {
    const p = parsed.prototypes[constructors.get(name)];
    if (!p) throw new Error('Missing hero configuration: ' + name);
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
        case 'FNEW': r[a] = { fieldIndices: r[0] }; break;
        case 'TSETS':
          if (p.constants[c].value !== '__index') throw new Error('Unsupported configuration member');
          r[b].fieldIndices = r[a].fieldIndices; break;
        case 'TSETB': r[b].set(c, r[a]); break;
        case 'TSETV': r[b].set(r[c], r[a]); break;
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
