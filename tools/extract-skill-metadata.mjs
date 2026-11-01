#!/usr/bin/env node

/**
 * Extract skill metadata from MethodTable.data.lua.json
 *
 * This tool reads the MethodTable and extracts skill information for all heroes,
 * building a structured database of skill effects, targets, and parameters.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METHOD_TABLE_PATH = path.join(__dirname, '../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MethodTable.data.lua.json');
const HERO_TABLE_PATH = path.join(__dirname, '../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/HeroTable.data.lua.json');
const CATALOG_PATH = path.join(__dirname, '../docs/character-skill-catalog.md');

function readMethodTable() {
  console.log('Reading MethodTable...');
  const data = fs.readFileSync(METHOD_TABLE_PATH, 'utf8');
  return JSON.parse(data);
}

function readHeroTable() {
  console.log('Reading HeroTable...');
  const data = fs.readFileSync(HERO_TABLE_PATH, 'utf8');
  return JSON.parse(data);
}

function readHeroCatalog() {
  console.log('Reading character skill catalog...');
  const data = fs.readFileSync(CATALOG_PATH, 'utf8');
  return data;
}

/**
 * Parse MethodTable data structure
 * The table contains skill definitions with IDs, parameters, and effect scripts
 */
function parseMethodTable(methodTable) {
  const skillMap = new Map();

  // The MethodTable is a complex Lua bytecode structure
  // We need to extract the actual skill data from it
  // This is a placeholder for the actual parsing logic

  console.log('MethodTable structure:', Object.keys(methodTable).slice(0, 10));

  // TODO: Implement actual parsing based on the structure
  // The structure likely contains:
  // - skillId -> skill metadata
  // - effect parameters
  // - target selection rules
  // - damage/healing formulas

  return skillMap;
}

/**
 * Parse HeroTable to get hero -> skill mappings
 */
function parseHeroTable(heroTable) {
  const heroSkillMap = new Map();

  // Extract hero entries and their skill IDs
  // TODO: Implement based on actual structure

  console.log('HeroTable structure:', Object.keys(heroTable).slice(0, 10));

  return heroSkillMap;
}

/**
 * Parse catalog markdown to get skill descriptions
 */
function parseCatalog(catalogMd) {
  const heroes = [];
  // Normalize line endings
  const lines = catalogMd.replace(/\r\n/g, '\n').split('\n');
  let currentHero = null;

  console.log(`Parsing ${lines.length} lines from catalog`);

  for (const line of lines) {
    // Match hero header: ## Hero Name (heroId)
    const heroMatch = line.match(/^## (.+) \((\d+)\)$/);
    if (heroMatch) {
      if (currentHero) heroes.push(currentHero);
      currentHero = {
        name: heroMatch[1],
        id: parseInt(heroMatch[2], 10),
        role: null,
        stats: {},
        skills: []
      };
      continue;
    }

    // Only parse skills if we have a current hero
    if (!currentHero) continue;

    // Match role line: Role: Ranger | HP 630 | ATK 95 | DEF 60 | SPD 105
    const roleMatch = line.match(/^Role: (\w+) \| HP (\d+) \| ATK (\d+) \| DEF (\d+) \| SPD (\d+)$/);
    if (roleMatch && currentHero) {
      currentHero.role = roleMatch[1];
      currentHero.stats = {
        hp: parseInt(roleMatch[2], 10),
        atk: parseInt(roleMatch[3], 10),
        def: parseInt(roleMatch[4], 10),
        spd: parseInt(roleMatch[5], 10)
      };
      continue;
    }

    // Match skill line: - **Skill Name** (`skillId`, Type, Status, category)
    if (line.startsWith('- **') && line.includes('**') && currentHero) {
      const nameMatch = line.match(/^- \*\*(.+)\*\*/);
      if (nameMatch) {
        const skillName = nameMatch[1];
        // Find the last parenthesized section (which contains the params)
        const lastParenStart = line.lastIndexOf('(');
        const parenContent = line.substring(lastParenStart + 1, line.length - 1);
        // Parse paren content: id, Type, Status, category
        const params = parenContent.split(',').map(p => p.trim());
        if (params.length === 4) {
          currentHero.skills.push({
            name: skillName,
            id: params[0].replace(/`/g, ''), // Remove backticks from id
            type: params[1],
            status: params[2],
            category: params[3],
            description: ''
          });
        }
      }
      continue;
    }

    // Match skill description line (indented with 2 spaces)
    const descMatch = line.match(/^  - (.+)$/);
    if (descMatch && currentHero && currentHero.skills.length > 0) {
      const lastSkill = currentHero.skills[currentHero.skills.length - 1];
      if (!lastSkill.description) {
        lastSkill.description = descMatch[1];
      } else {
        lastSkill.description += ' ' + descMatch[1];
      }
    }
  }

  if (currentHero) heroes.push(currentHero);

  return heroes;
}

/**
 * Cross-reference catalog with MethodTable to identify discrepancies
 */
function crossReferenceSkills(catalogHeroes, methodSkills, heroSkills) {
  const discrepancies = [];

  for (const hero of catalogHeroes) {
    for (const skill of hero.skills) {
      // Check if skill ID exists in MethodTable
      if (!methodSkills.has(skill.id)) {
        discrepancies.push({
          hero: hero.name,
          heroId: hero.id,
          skill: skill.name,
          skillId: skill.id,
          issue: 'MISSING_FROM_METHOD_TABLE',
          message: `Skill ${skill.id} not found in MethodTable`
        });
      }

      // Check skill type consistency
      // e.g., if catalog says "treatment" but skill is damage type
      if (skill.description.includes('治疗') || skill.description.includes('恢复') || skill.description.includes('回复')) {
        discrepancies.push({
          hero: hero.name,
          heroId: hero.id,
          skill: skill.name,
          skillId: skill.id,
          issue: 'POSSIBLE_TYPE_MISMATCH',
          message: `Skill description mentions healing/treatment, verify implementation type`
        });
      }
    }
  }

  return discrepancies;
}

/**
 * Generate skill database JSON
 */
function generateSkillDatabase(catalogHeroes, methodSkills) {
  const database = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    heroes: catalogHeroes.map(hero => ({
      id: hero.id,
      name: hero.name,
      role: hero.role,
      stats: hero.stats,
      skills: hero.skills.map(skill => ({
        id: skill.id,
        name: skill.name,
        type: skill.type,
        status: skill.status,
        category: skill.category,
        description: skill.description,
        // Additional fields to be filled from MethodTable
        implementation: methodSkills.get(skill.id) || null
      }))
    }))
  };

  return database;
}

function main() {
  console.log('Skill Metadata Extraction Tool');
  console.log('================================\n');

  // Read all data sources
  const methodTable = readMethodTable();
  const heroTable = readHeroTable();
  const catalogMd = readHeroCatalog();

  // Parse data
  const methodSkills = parseMethodTable(methodTable);
  const heroSkills = parseHeroTable(heroTable);
  const catalogHeroes = parseCatalog(catalogMd);

  console.log(`\nParsed ${catalogHeroes.length} heroes from catalog`);
  console.log(`Total skills in catalog: ${catalogHeroes.reduce((sum, h) => sum + h.skills.length, 0)}`);

  // Cross-reference
  const discrepancies = crossReferenceSkills(catalogHeroes, methodSkills, heroSkills);

  console.log(`\nFound ${discrepancies.length} discrepancies`);
  if (discrepancies.length > 0) {
    console.log('\nTop 10 discrepancies:');
    discrepancies.slice(0, 10).forEach(d => {
      console.log(`  [${d.issue}] ${d.hero} - ${d.skill}: ${d.message}`);
    });
  }

  // Generate database
  const database = generateSkillDatabase(catalogHeroes, methodSkills);

  // Write output
  const outputPath = path.join(__dirname, '../personal-server/config/skill-database.json');
  fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));
  console.log(`\nSkill database written to: ${outputPath}`);

  // Write discrepancies report
  const reportPath = path.join(__dirname, '../analysis/reports/skill-discrepancies.json');
  fs.writeFileSync(reportPath, JSON.stringify(discrepancies, null, 2));
  console.log(`Discrepancies report written to: ${reportPath}`);
}

main();
