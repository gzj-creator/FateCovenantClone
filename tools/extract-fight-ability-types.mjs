import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { readFightShard } from './read-fight-shard.mjs';

const input = path.resolve(process.argv[2] ?? 'analysis/scratchpad/time-temple-20261108/project');
const output = path.resolve(process.argv[3] ?? 'personal-server/assets/tables/FightAbilityTypes.data.json.gz');
const names = fs.readdirSync(input).filter(name => /-FightTable\.Ability\.\d+\.data\.lua\.bin$/.test(name)).sort();
assert.equal(names.length, 8, 'complete original ability shard set');
const rows = new Map();
const sources = names.map(name => {
  const bytes = fs.readFileSync(path.join(input, name));
  const shard = readFightShard(parseLuaJit(bytes));
  for (const [tid, { type, run_type: runType }] of shard) {
    assert.ok(!rows.has(tid), `duplicate FightTable.Ability row ${tid}`);
    assert.ok([tid, type, runType].every(Number.isSafeInteger), `invalid dispatch metadata ${tid}`);
    rows.set(tid, [tid, type, runType]);
  }
  return { name, sha256: createHash('sha256').update(bytes).digest('hex'), rows: shard.size };
});
assert.equal(rows.size, 10466, 'complete original FightTable.Ability row inventory');
const data = { fields: ['tid', 'type', 'run_type'], sources, rows: [...rows.values()].sort(([left], [right]) => left - right) };
const bytes = gzipSync(JSON.stringify(data));
fs.writeFileSync(output, bytes);
console.log(JSON.stringify({ output, rows: rows.size, sha256: createHash('sha256').update(bytes).digest('hex') }));
