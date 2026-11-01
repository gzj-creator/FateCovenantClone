#!/usr/bin/env node
/**
 * parse-method-table.mjs
 *
 * Parse MethodTable.data.lua.json and cross-reference skill implementation
 * details against the character skill catalog.
 *
 * MethodTable structure
 * ---------------------
 * MethodTable.data.lua.json is a LuaJIT bytecode dump (decoded to JSON) with
 * the standard { flags, chunk, rootPrototype, prototypes } shape. Its root
 * prototype (index 5) builds three constructors:
 *
 *   Method           -> prototype 1  (260 condition/method entries)
 *   DynamicArgs      -> prototype 3  (308 dynamic-argument entries)
 *   DynamicArgs_List -> prototype 4  (helper, upvalue-backed)
 *
 * `Method` maps an integer tid (1..260) to a reference string of the form
 * "Manager.MethodName" (e.g. "MethodUtil.DefaultValid", "FightPlayingKit.IsDefeated").
 * These are UI/guide/condition predicates, NOT skill definitions.
 *
 * `DynamicArgs` maps an integer tid (1..308) to { tid, lua_interface, change_event }
 * where lua_interface is a "Manager.MethodName" reference and change_event is an
 * array of event references. These describe how a UI value is computed and which
 * events refresh it. Again, NOT skill data.
 *
 * IMPORTANT FINDING: MethodTable does NOT contain skill implementation details.
 * Skill implementation data lives in:
 *   - FightTable.Ability.*.data.lua.json      (dmg_type, effect_type, type, run_type, tid)
 *   - FightTable.AbilityDes.*.data.lua.json   (type_des, show_name, skill_icon, text, detail_text, tid)
 *
 * This tool therefore:
 *   1. Parses MethodTable (Method + DynamicArgs) and reports its structure.
 *   2. With --skills, builds a skill-implementation map from FightTable.Ability
 *      and FightTable.AbilityDes (the real skill source) and can update
 *      personal-server/config/skill-database.json + skill-discrepancies.json.
 *
 * Usage
 * -----
 *   node tools/parse-method-table.mjs
 *       Parse MethodTable and print a structure summary.
 *
 *   node tools/parse-method-table.mjs --json
 *       Print the parsed Method + DynamicArgs as JSON.
 *
 *   node tools/parse-method-table.mjs --skills --update
 *       Build skill implementation map from FightTable data and update
 *       personal-server/config/skill-database.json and
 *       analysis/reports/skill-discrepancies.json.
 *
 *   node tools/parse-method-table.mjs --method-table <path> --ability-dir <dir>
 *       Override input locations.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readGeneratedDump } from "../personal-server/config/hero-tables.mjs";
import { extractGroups } from "./extract-battle-tables.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const DEFAULT_METHOD_TABLE = path.join(
  PROJECT_ROOT,
  "analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MethodTable.data.lua.json"
);
const DEFAULT_ABILITY_DIR = path.join(
  PROJECT_ROOT,
  "analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode"
);
const DEFAULT_SKILL_DB = path.join(PROJECT_ROOT, "personal-server/config/skill-database.json");
const DEFAULT_DISCREPANCIES = path.join(PROJECT_ROOT, "analysis/reports/skill-discrepancies.json");

function parseArgs(argv) {
  const opts = {
    methodTable: DEFAULT_METHOD_TABLE,
    abilityDir: DEFAULT_ABILITY_DIR,
    skillDb: DEFAULT_SKILL_DB,
    discrepancies: DEFAULT_DISCREPANCIES,
    skills: false,
    update: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--method-table") opts.methodTable = path.resolve(argv[++i]);
    else if (a === "--ability-dir") opts.abilityDir = path.resolve(argv[++i]);
    else if (a === "--skill-db") opts.skillDb = path.resolve(argv[++i]);
    else if (a === "--discrepancies") opts.discrepancies = path.resolve(argv[++i]);
    else if (a === "--skills") opts.skills = true;
    else if (a === "--update") opts.update = true;
    else if (a === "--json") opts.json = true;
    else throw new Error("Unknown argument: " + a);
  }
  return opts;
}

export function parseMethodTable(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const tables = readGeneratedDump(parsed, ["Method", "DynamicArgs"]);
  return {
    Method: tables.Method,
    DynamicArgs: tables.DynamicArgs,
    meta: {
      flags: parsed.flags,
      chunk: parsed.chunk,
      rootPrototype: parsed.rootPrototype,
      prototypeCount: parsed.prototypes.length,
    },
  };
}

export function parseSkillImplementation(abilityDir) {
  const abFiles = fs.readdirSync(abilityDir).filter((f) => /^FightTable\.Ability\.\d+\.data\.lua\.json$/.test(f));
  const desFiles = fs.readdirSync(abilityDir).filter((f) => /^FightTable\.AbilityDes\.\d+\.data\.lua\.json$/.test(f));

  const abilityRows = [];
  for (const f of abFiles) {
    const j = JSON.parse(fs.readFileSync(path.join(abilityDir, f), "utf8"));
    for (const g of extractGroups(j)) for (const r of g.rows) abilityRows.push(r);
  }
  const desRows = [];
  for (const f of desFiles) {
    const j = JSON.parse(fs.readFileSync(path.join(abilityDir, f), "utf8"));
    for (const g of extractGroups(j)) for (const r of g.rows) desRows.push(r);
  }

  const abilityMap = new Map(abilityRows.map((r) => [String(r.tid), r]));
  const desMap = new Map(desRows.map((r) => [String(r.tid), r]));

  const implMap = new Map();
  const allIds = new Set([...abilityMap.keys(), ...desMap.keys()]);
  for (const id of allIds) {
    const a = abilityMap.get(id) || null;
    const d = desMap.get(id) || null;
    implMap.set(id, {
      source: "FightTable.Ability + FightTable.AbilityDes",
      resolvedAbility: Boolean(a),
      resolvedDescription: Boolean(d),
      ability: a
        ? { tid: a.tid, type: a.type, dmg_type: a.dmg_type, effect_type: a.effect_type, run_type: a.run_type }
        : null,
      abilityDes: d
        ? {
            tid: d.tid,
            type_des: d.type_des,
            show_name: d.show_name,
            skill_icon: d.skill_icon,
            text: d.text,
            detail_text: d.detail_text,
          }
        : null,
    });
  }
  return { implMap, abilityMap, desMap, abilityRows, desRows };
}

function skillType(code) {
  if (code === 1) return "Normal";
  if (code === 2) return "Passive";
  if (code === 3) return "Ultimate";
  if (code === 4) return "Transcendent";
  if (code === 5) return "Demigod";
  if (code === 6) return "Envoy";
  if (code === 7) return "Relic";
  if (code === 8) return "Attribute";
  if (code === 9) return "Mastery";
  if (code === 10) return "CrystalCore";
  if (code === 11) return "Exclusive";
  if (code === 12) return "UltimateTechnique";
  if (code === 13) return "MainBattle";
  if (code === 14) return "Support";
  if (code === 15 || code === 16) return "Transcendent";
  return "Passive";
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  const mt = parseMethodTable(opts.methodTable);
  console.log("MethodTable parsed:", opts.methodTable);
  console.log("  Method entries:", mt.Method.size);
  console.log("  DynamicArgs entries:", mt.DynamicArgs.size);
  console.log("  prototypes:", mt.meta.prototypeCount, "root:", mt.meta.rootPrototype);

  if (opts.json) {
    const out = {
      meta: mt.meta,
      Method: Object.fromEntries([...mt.Method.entries()].map(([k, v]) => [k, v])),
      DynamicArgs: Object.fromEntries([...mt.DynamicArgs.entries()].map(([k, v]) => [k, v])),
    };
    console.log(JSON.stringify(out, null, 2));
  }

  if (!opts.skills) return;

  const { implMap, abilityMap, desMap } = parseSkillImplementation(opts.abilityDir);
  console.log("\nSkill implementation source: FightTable.Ability + AbilityDes");
  console.log("  Ability rows:", abilityMap.size);
  console.log("  AbilityDes rows:", desMap.size);
  console.log("  Unique skill ids:", implMap.size);

  if (!opts.update) return;

  const db = JSON.parse(fs.readFileSync(opts.skillDb, "utf8"));
  let updated = 0;
  for (const hero of Object.values(db.heroes)) {
    for (const skill of hero.skills) {
      if (skill.id.startsWith("normal-profession-")) {
        skill.implementation = { fallback: true, source: "project-fallback", resolvedAbility: false, resolvedDescription: false, ability: null, abilityDes: null };
        updated++;
        continue;
      }
      const impl = implMap.get(String(skill.id));
      if (impl) {
        if (impl.abilityDes) {
          impl.catalogTypeMatch = skillType(impl.abilityDes.type_des) === skill.type;
        } else {
          impl.catalogTypeMatch = null;
        }
        skill.implementation = impl;
        updated++;
      } else {
        skill.implementation = null;
      }
    }
  }
  db.generatedAt = new Date().toISOString();
  fs.writeFileSync(opts.skillDb, JSON.stringify(db, null, 2));
  console.log("\nUpdated skill database:", opts.skillDb, "skills:", updated);

  const discrepancies = [];
  for (const hero of Object.values(db.heroes)) {
    for (const skill of hero.skills) {
      const ab = abilityMap.has(String(skill.id));
      const des = desMap.has(String(skill.id));
      if (!ab && !skill.id.startsWith("normal-profession-")) {
        discrepancies.push({
          hero: hero.name,
          heroId: hero.id,
          skill: skill.name,
          skillId: skill.id,
          issue: "MISSING_ABILITY_ROW",
          severity: "high",
          message: "Skill " + skill.id + " not found in FightTable.Ability",
        });
      }
      if (ab && !des) {
        discrepancies.push({
          hero: hero.name,
          heroId: hero.id,
          skill: skill.name,
          skillId: skill.id,
          issue: "MISSING_ABILITY_DESCRIPTION",
          severity: "medium",
          message: "Skill " + skill.id + " has an Ability row but no AbilityDes (localized description missing)",
        });
      }
      if (skill.implementation && skill.implementation.catalogTypeMatch === false) {
        discrepancies.push({
          hero: hero.name,
          heroId: hero.id,
          skill: skill.name,
          skillId: skill.id,
          issue: "TYPE_MISMATCH",
          severity: "high",
          message: "Catalog type " + skill.type + " does not match AbilityDes type_des " + skill.implementation.abilityDes.type_des + " (" + skillType(skill.implementation.abilityDes.type_des) + ")",
        });
      }
    }
  }
  const report = {
    generatedAt: new Date().toISOString(),
    note: "MethodTable.data.lua.json contains no skill entries (it holds UI/guide condition methods and dynamic args). Skill implementation data comes from FightTable.Ability + FightTable.AbilityDes. Discrepancies below are refined against those tables.",
    summary: {
      totalSkillReferences: Object.values(db.heroes).reduce((s, h) => s + h.skills.length, 0),
      uniqueSkillIds: new Set(Object.values(db.heroes).flatMap((h) => h.skills.map((s) => s.id))).size,
      missingAbilityRows: discrepancies.filter((d) => d.issue === "MISSING_ABILITY_ROW").length,
      missingDescriptions: discrepancies.filter((d) => d.issue === "MISSING_ABILITY_DESCRIPTION").length,
      typeMismatches: discrepancies.filter((d) => d.issue === "TYPE_MISMATCH").length,
    },
    discrepancies,
  };
  fs.writeFileSync(opts.discrepancies, JSON.stringify(report, null, 2));
  console.log("Updated discrepancies:", opts.discrepancies, "count:", discrepancies.length);
  console.log("Summary:", JSON.stringify(report.summary));
}

main();
