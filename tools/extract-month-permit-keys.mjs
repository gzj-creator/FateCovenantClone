import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readGeneratedDump } from '../personal-server/config/hero-tables.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MonthPermitTable.data.lua.json');
const content = fs.readFileSync(filePath, 'utf8');
const json = JSON.parse(content);

// Read all tables with their raw data
const allTables = readGeneratedDump(json, [
  'Gear', 'Cycle', 'UpLv', 'BuyExp'
]);

for (const [name, data] of Object.entries(allTables)) {
  console.log(`${name}: ${Array.isArray(data) ? data.length : 'not an array'} rows`);
  if (Array.isArray(data) && data.length > 0 && data.length < 10) {
    console.log(`  Sample:`, JSON.stringify(data[0], null, 2));
  }
}
