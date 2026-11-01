import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MonthPermitTable.data.lua.json');
const content = fs.readFileSync(filePath, 'utf8');
const json = JSON.parse(content);

// Get constructor names (table names)
const root = json.prototypes[json.rootPrototype];
const constructors = new Map();
for (let n = 0; n < root.instructions.length - 1; n++) {
  const i = root.instructions[n], next = root.instructions[n + 1];
  if (i.name === 'KSTR' && next.name === 'FNEW') constructors.set(root.constants[i.d].value, root.constants[next.d].prototype);
}

console.log('Available tables in MonthPermitTable:');
console.log(Array.from(constructors.keys()).join(', '));

// Try to read Gear table directly
const gearProto = json.prototypes[constructors.get('Gear')];
if (gearProto) {
  console.log('\nGear prototype index:', constructors.get('Gear'));
  console.log('Gear instructions count:', gearProto.instructions.length);
  console.log('Gear constants count:', gearProto.constants.length);
}
