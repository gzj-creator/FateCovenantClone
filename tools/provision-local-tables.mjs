import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readTextAssets } from './unityfs-read.mjs';
import { buildPrototypeDump } from './dump-table-prototypes.mjs';

// The personal server reads its game configuration from Lua prototype dumps
// generated out of the shipped client bundles. Those dumps live under analysis/
// (local evidence, never committed), so a fresh checkout or a cleaned analysis
// tree leaves config/*.mjs pointing at files that do not exist. This tool
// rebuilds every dump the server reads from the bundles in the APK.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DECODED = 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded';
const PROJECT = `${DECODED}/assets__Android__script__lua__64_lua_project.bundle`;
const CORE = `${DECODED}/assets__Android__script__lua__64_lua_core.bundle`;
const GENERAL = `${DECODED}/assets__Android__script__lua__64_lua_general.bundle`;

const BUNDLE_FILES = {
  project: '64_lua_project.bundle',
  core: '64_lua_core.bundle',
  general: '64_lua_general.bundle'
};

// `dump` entries are LuaJIT bytecode turned into the prototype-dump JSON shape
// readGeneratedTables() understands; `raw` entries are copied verbatim because
// the reader parses the bytecode directly.
const TABLES = [
  { bundle: 'project', asset: 'HeroTable.data.lua', dump: `${PROJECT}/bytecode/HeroTable.data.lua.json` },
  { bundle: 'project', asset: 'MissionTable.data.lua', dump: `${PROJECT}/bytecode/MissionTable.data.lua.json` },
  { bundle: 'project', asset: 'ItemTable.data.lua', dump: `${PROJECT}/bytecode/ItemTable.data.lua.json` },
  { bundle: 'project', asset: 'DrawTable.data.lua', dump: `${PROJECT}/bytecode/DrawTable.data.lua.json` },
  { bundle: 'project', asset: 'RechargeTable.data.lua', dump: `${PROJECT}/bytecode/RechargeTable.data.lua.json` },
  { bundle: 'project', asset: 'OpenServerSprintTable.data.lua', dump: `${PROJECT}/bytecode/OpenServerSprintTable.data.lua.json` },
  { bundle: 'project', asset: 'MonthPermitTable.data.lua', dump: `${PROJECT}/bytecode/MonthPermitTable.data.lua.json` },
  { bundle: 'project', asset: 'ActFrameTable.data.lua', dump: `${PROJECT}/bytecode/ActFrameTable.data.lua.json` },
  { bundle: 'project', asset: 'AccRechargeActTable.data.lua', dump: `${PROJECT}/bytecode/AccRechargeActTable.data.lua.json` },
  { bundle: 'project', asset: 'HundredAccTable.data.lua', dump: `${PROJECT}/bytecode/HundredAccTable.data.lua.json` },
  { bundle: 'project', asset: 'ActivityTable.data.lua', dump: `${PROJECT}/bytecode/ActivityTable.data.lua.json` },
  { bundle: 'project', asset: 'MultiLoginTable.data.lua', dump: `${PROJECT}/bytecode/MultiLoginTable.data.lua.json` },
  { bundle: 'project', asset: 'PrincessTable.data.lua', dump: `${PROJECT}/bytecode/PrincessTable.data.lua.json` },
  { bundle: 'project', asset: 'DailyDiscountTable.data.lua', dump: `${PROJECT}/bytecode/DailyDiscountTable.data.lua.json` },
  { bundle: 'project', asset: 'CountStatisticsTable.data.lua', dump: `${PROJECT}/bytecode/CountStatisticsTable.data.lua.json` },
  { bundle: 'project', asset: 'TaskTable.data.lua', dump: `${PROJECT}/bytecode/TaskTable.data.lua.json` },
  { bundle: 'project', asset: 'RoleTable.data.lua', dump: `${PROJECT}/bytecode/RoleTable.data.lua.json` },
  { bundle: 'core', asset: 'GameTable.data.lua', dump: `${CORE}/bytecode/GameTable.data.lua.json` },
  { bundle: 'general', asset: 'ModuleTable.data.lua', dump: `${GENERAL}/bytecode/ModuleTable.data.lua.json` },
  { bundle: 'project', asset: 'LineupTable.data.lua', raw: `${PROJECT}/textassets/8897179132838841000-LineupTable.data.lua.bin` },
  { bundle: 'project', asset: 'MagicCircleTable.data.lua', raw: `${PROJECT}/textassets/15935513698146724000-MagicCircleTable.data.lua.bin` },
  { bundle: 'project', asset: 'GuildInfoForm.lua', raw: `${PROJECT}/textassets/6925042128488278000-GuildInfoForm.lua.bin` },
  { bundle: 'project', asset: 'GuildMgr.lua', raw: `${PROJECT}/textassets/17742175181654671000-GuildMgr.lua.bin` },
  // Tables the server keeps outside the shared bytecode directory.
  { bundle: 'project', asset: 'FantasyEquipTable.data.lua', dump: 'analysis/recruitment-debug/bytecode/FantasyEquipTable.data.json' },
  { bundle: 'project', asset: 'LeaderEquipTable.data.lua', dump: 'analysis/recruitment-debug/bytecode/LeaderEquipTable.data.lua.json' },
  { bundle: 'project', asset: 'EquipTable.data.lua', dump: 'analysis/tmp/equipment-decompiled/EquipTable.data.lua.json' },
  { bundle: 'project', asset: 'DestinyTable.data.lua', dump: 'analysis/tmp/endgame-fixes/DestinyTable.data.json' },
  { bundle: 'project', asset: 'PermitTable.data.lua', dump: 'analysis/tmp/PermitTable.data.bytecode.json' },
  { bundle: 'project', asset: 'FishingActTable.data.lua', dump: 'analysis/tmp/FishingActTable.data.lua.json' },
  { bundle: 'project', asset: 'WeekHuntTable.data.lua', dump: 'analysis/tmp/WeekHuntTable.data.bytecode.json' },
  { bundle: 'project', asset: 'PetActivityTable.data.lua', dump: 'analysis/tmp/activity-decompiled/PetActivityTable.data.lua.json' },
  { bundle: 'project', asset: 'HeroDrawActTable.data.lua', dump: 'analysis/tmp/activity-decompiled/HeroDrawActTable.data.lua.json' },
  { bundle: 'project', asset: 'ShopTable.data.lua', dump: 'analysis/tmp/activity-decompiled/ShopTable.data.lua.json' },
  { bundle: 'project', asset: 'FirstRechargeTable.data.lua', dump: 'analysis/tmp/recharge-remaining-plan/7289607387164353000-FirstRechargeTable.data.json' },
  { bundle: 'project', asset: 'RechargeBonusTable.data.lua', dump: 'analysis/tmp/recharge-remaining-plan/14863431925290164000-RechargeBonusTable.data.json' },
  { bundle: 'project', asset: 'RechargeRebateResetTable.data.lua', dump: 'analysis/tmp/recharge-remaining-plan/7806056895365336000-RechargeRebateResetTable.data.json' },
  { bundle: 'project', asset: 'LineFirstRechargeTable.data.lua', dump: 'analysis/tmp/recharge-remaining-plan/LineFirstRechargeTable.data.json' },
  { bundle: 'project', asset: 'ArtifactDrawActTable.data.lua', dump: 'analysis/work/relic-divine-activities/tables/ArtifactDrawActTable.data.json' },
  { bundle: 'project', asset: 'DemigodActTable.data.lua', dump: 'analysis/work/relic-divine-activities/tables/DemigodActTable.data.json' },
  { bundle: 'project', asset: 'FantasyEquipActTable.data.lua', dump: 'analysis/work/relic-divine-activities/tables/FantasyEquipActTable.data.json' },
  { bundle: 'project', asset: 'MiniGameTable.data.lua', dump: 'analysis/work/relic-divine-activities/MiniGameTable.data.json' }
];

function bundlePath(name, directory) {
  return path.join(directory, BUNDLE_FILES[name]);
}

export function provisionTables({ bundleDirectory, check = false, logger = () => {} } = {}) {
  const directory = path.resolve(ROOT, bundleDirectory ?? 'analysis/tmp/lua-bundles');
  const assets = new Map();
  for (const name of Object.keys(BUNDLE_FILES)) {
    const file = bundlePath(name, directory);
    if (!fs.existsSync(file)) throw new Error(`Missing client bundle ${file}`);
    const list = readTextAssets(fs.readFileSync(file));
    const byName = new Map();
    for (const asset of list) if (!byName.has(asset.name)) byName.set(asset.name, asset);
    assets.set(name, byName);
    logger({ event: 'bundle_read', bundle: BUNDLE_FILES[name], assets: list.length });
  }

  const missing = [];
  const written = [];
  for (const entry of TABLES) {
    const asset = assets.get(entry.bundle)?.get(entry.asset);
    if (!asset) { missing.push(`${entry.bundle}:${entry.asset}`); continue; }
    const target = path.resolve(ROOT, entry.raw ?? entry.dump);
    if (check) { if (fs.existsSync(target)) written.push(entry.raw ?? entry.dump); continue; }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (entry.raw) fs.writeFileSync(target, asset.bytes);
    else fs.writeFileSync(target, JSON.stringify(buildPrototypeDump(asset.bytes)));
    written.push(entry.raw ?? entry.dump);
    logger({ event: 'table_written', target: entry.raw ?? entry.dump, bytes: fs.statSync(target).size });
  }
  if (missing.length) throw new Error(`Client bundles do not contain: ${missing.join(', ')}`);
  return { written };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  const result = provisionTables({
    bundleDirectory: flag('--bundles'),
    check: args.includes('--check'),
    logger: args.includes('--quiet') ? () => {} : event => console.log(JSON.stringify(event))
  });
  console.log(JSON.stringify({ count: result.written.length }, null, 1));
}
