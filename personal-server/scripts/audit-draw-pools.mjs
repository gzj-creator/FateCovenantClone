import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { readAssetBytes, tableAsset } from '../assets.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { loadFantasyActTables } from '../game/fantasy-act-tables.mjs';
import { auditProductionDrawPools } from '../game/draw-pool-audit.mjs';

const assets = [
  'DrawTable.data.lua.json', 'HeroTable.data.lua.json',
  'ArtifactDrawActTable.data.json', 'DemigodActTable.data.json',
  'FantasyEquipTable.data.json', 'FantasyEquipActTable.data.json',
  'ActivityTable.data.lua.json'
];
const evidence = assets.map(name => {
  const bytes = readAssetBytes(tableAsset(name));
  return { name, uncompressedBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
const audit = auditProductionDrawPools({
  tables: { ...readGameTables(), ...loadFantasyActTables() },
  heroTables: readHeroTables()
});
const { values } = parseArgs({ options: { output: { type: 'string' } } });
const output = JSON.stringify({ ...audit, evidence }, null, 2) + '\n';
if (values.output) {
  const destination = path.resolve(values.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output, 'utf8');
} else {
  process.stdout.write(output);
}
