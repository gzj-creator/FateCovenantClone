import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/skill-database.json'), 'utf8'));
const heroId = Number(process.argv[2]);
const hero = db.heroes.find(candidate => candidate.id === heroId);
if (!hero) {
  console.error(`hero ${heroId} not found`);
  process.exit(1);
}
console.log(JSON.stringify(hero, null, 2));
