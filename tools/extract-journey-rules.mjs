import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { readFightShard } from './read-fight-shard.mjs';
import { readGeneratedDump } from '../personal-server/config/hero-tables.mjs';

const input = path.resolve(process.argv[2] ?? 'analysis/scratchpad/time-temple-20261108/project');
const output = path.resolve(process.argv[3] ?? 'personal-server/assets/tables');
const files = fs.readdirSync(input);
const source = name => {
  const bytes = fs.readFileSync(path.join(input, name));
  return { name, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes };
};
function write(name, value) {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, name + '.json.gz'), zlib.gzipSync(JSON.stringify(value)));
}
const all = { Fight: new Map(), Team: new Map(), Fighter: new Map(), AttrAbility: new Map() };
const sources = [];
// Journey uses fight ids below 100000. Load only their Fight shards; Team and
// Fighter shards are selected from their actual references, including 91102.
function append(family, names) {
  for (const name of names) {
    const item = source(name);
    const rows = readFightShard(parseLuaJit(item.bytes));
    for (const [tid, row] of rows) {
      if (all[family].has(tid)) throw new Error('Duplicate ' + family + ':' + tid);
      all[family].set(tid, row);
    }
    sources.push({ name, sha256: item.sha256, rows: rows.size });
  }
}
append('Fight', files.filter(name => /-FightTable\.Fight\.[0-9]+\.data\.lua\.bin$/.test(name)
  && Number(name.match(/\.Fight\.([0-9]+)/)[1]) < 10));
const teamShards = new Set([...all.Fight.values()].flatMap(row => [...row.atk_team, ...row.def_team])
  .filter(tid => tid > 0).map(tid => Math.floor(tid / 10000)));
append('Team', files.filter(name => /-FightTable\.Team\.[0-9]+\.data\.lua\.bin$/.test(name)
  && teamShards.has(Number(name.match(/\.Team\.([0-9]+)/)[1]))));
// FightKit.GetTeamFighters adds the location VALUE from pairs(team.loc).
// 105 has its boss at location 5, so its presentation row is 10505.
const fighterShards = new Set([...all.Team.values()].flatMap(row => row.loc.map(loc => row.tid * 100 + loc))
  .map(tid => Math.floor(tid / 10000000)));
append('Fighter', files.filter(name => /-FightTable\.Fighter\.[0-9]+\.data\.lua\.bin$/.test(name)
  && fighterShards.has(Number(name.match(/\.Fighter\.([0-9]+)/)[1]))));
append('AttrAbility', files.filter(name => /-FightTable\.AttrAbility\.[0-9]+\.data\.lua\.bin$/.test(name)));
write('JourneyFightTable.data', {
  generatedBy: 'tools/extract-journey-rules.mjs', sources,
  tables: Object.fromEntries(Object.entries(all).map(([family, rows]) => [family, {
    rows: [...rows.values()].sort((left, right) => left.tid - right.tid)
  }]))
});
const guideName = files.find(name => /-GuideTable\.data\.lua\.bin$/.test(name));
if (!guideName) throw new Error('GuideTable source is missing');
const guideSource = source(guideName);
const guide = readGeneratedDump(parseLuaJit(guideSource.bytes), ['Process', 'Step', 'Award', 'Const', 'ProcessExclusion']);
write('GuideTable.data', {
  generatedBy: 'tools/extract-journey-rules.mjs',
  sources: [{ name: guideName, sha256: guideSource.sha256 }],
  tables: Object.fromEntries(Object.entries(guide).map(([family, rows]) => [family, { rows: [...rows.values()] }]))
});
console.log(JSON.stringify({ output, fight: Object.fromEntries(Object.entries(all).map(([family, rows]) => [family, rows.size])),
  guide: Object.fromEntries(Object.entries(guide).map(([family, rows]) => [family, rows.size])) }));
