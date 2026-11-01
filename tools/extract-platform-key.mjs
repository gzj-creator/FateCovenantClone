import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/GameTable.data.lua.json');
const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = json.prototypes.find(p => p.constants.some(c => c.type === 'table' && c.hash.some(([k]) => k === 'sign_to_platform')));
const row = p.constants.find(c => c.type === 'table' && c.hash.some(([k]) => k === 'sign_to_platform'));
const vals = p.constants.find(c => c.type === 'table' && typeof c.array[2] === 'string');

console.log('Platform fields:', Object.fromEntries(row.hash.map(([k, i]) => [k, vals.array[i]])));
