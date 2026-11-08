import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { readTextAssets } from "./unityfs-read.mjs";
import { buildPrototypeDump } from "./dump-table-prototypes.mjs";

// Rebuild the activity-table prototype dumps that the personal server reads for
// the festival / sign-in / limited-target activity commands. Input is the
// client Lua project bundle; each table ships as LuaJIT bytecode and the
// server interprets the straight-line constructors with config/hero-tables.mjs
// readGeneratedDump(). Values are never executed as Lua.
//
// Usage: node tools/extract-act-tables.mjs <64_lua_project.bundle> [output-directory]
const [input, outputDirectory = "personal-server/assets/tables"] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node tools/extract-act-tables.mjs <64_lua_project.bundle> [output-directory]");
  process.exit(2);
}

const TABLES = [
  "SignActTable", "LoginRewardActTable", "CommonSignTable", "FestivalSignActTable",
  "HeroSignActTable", "CollectExchangeActTable", "PreheatActTable", "StockUpActTable",
  "ChristmasActTable", "SpringFestivalActTable", "QiXiActTable", "FiveDayBossActTable",
  "FirecrackerActTable", "VoteActTable", "QuestionActTable", "AnniversaryBanquetActTable",
  "AnniversaryGameActTable", "OnesRewardTable", "InviteActTable", "InviteOldActTable",
  "RoleBackTable", "ChoiceStoryTable", "QuestionnaireTable", "EnjoyBlessingActTable",
  "FestivalMonsterActTable", "ValentineDayActTable", "SummerActTable"
];

const assets = readTextAssets(fs.readFileSync(input));
const byName = new Map(assets.map(asset => [asset.name, asset.bytes]));
fs.mkdirSync(outputDirectory, { recursive: true });
const report = {};
for (const base of TABLES) {
  const name = base + ".data.lua";
  const bytes = byName.get(name);
  if (!bytes) throw new Error("Bundle is missing " + name);
  const dump = buildPrototypeDump(bytes);
  const target = path.join(outputDirectory, base + ".data.lua.json.gz");
  fs.writeFileSync(target, zlib.gzipSync(Buffer.from(JSON.stringify(dump))));
  report[base] = fs.statSync(target).size;
}
console.log(JSON.stringify({ tables: Object.keys(report).length, report }, null, 1));
