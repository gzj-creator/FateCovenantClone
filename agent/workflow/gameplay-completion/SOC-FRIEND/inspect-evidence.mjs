import fs from 'node:fs';
import { parseLuaJit } from 'file:///F:/projects/FateCovenantClone/tools/luajit-bytecode-parse.mjs';
import { describePrototypes } from 'file:///F:/projects/FateCovenantClone/tools/dump-luajit-prototypes.mjs';
import { readGeneratedDump } from 'file:///F:/projects/FateCovenantClone/personal-server/config/hero-tables.mjs';

const root = 'F:/projects/FateCovenantClone/.worktree/recruit-20261101/.scratch/out/luaproject/';
const [file = 'FriendMgr.lua', filter = 'req_'] = process.argv.slice(2);
let parser = parseLuaJit;
if (file === 'FriendMgr.lua') {
  const source = fs.readFileSync('F:/projects/FateCovenantClone/tools/luajit-bytecode-parse.mjs', 'utf8')
    .replace('let supported = attempts.filter(attempt => attempt.uv >= requiredUv);', `let supported = attempts.filter(attempt => attempt.uv >= requiredUv && proto.instructions.every(i => {
      if (['KSTR','GGET','GSET'].includes(i.name)) return attempt.constants[i.d]?.type === 'string';
      if (['TGETS','TSETS','USETS'].includes(i.name)) return attempt.constants[i.name === 'USETS' ? i.d : i.c]?.type === 'string';
      if (i.name === 'FNEW') return attempt.constants[i.d]?.type === 'child';
      if (i.name === 'TDUP') return attempt.constants[i.d]?.type === 'table';
      return true;
    }));`)
    .replace('if (supported.length > 1) supported = supported.filter(attempt => attempt.uv === requiredUv);', 'if (supported.length > 1 && supported.some(attempt => attempt.uv === requiredUv)) supported = supported.filter(attempt => attempt.uv === requiredUv);')
    .replace('if (supported.length > 1) supported = supported.filter(attempt => attempt.uv === proto.upvalueCount);', 'if (supported.length > 1 && supported.some(attempt => attempt.uv === proto.upvalueCount)) supported = supported.filter(attempt => attempt.uv === proto.upvalueCount);')
    .replace('if (supported.length > 1) supported = [supported.reduce((min, attempt) => attempt.uv < min.uv ? attempt : min)];', '');
  parser = (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).parseLuaJit;
}
const parsed = parser(fs.readFileSync(root + file));
if (filter === '__dump') {
  fs.writeFileSync(process.argv[4], JSON.stringify(parsed));
  console.log(JSON.stringify({file, rootPrototype: parsed.rootPrototype, prototypes: parsed.prototypes.length}));
  process.exit(0);
}
if (file === 'FriendTable.data.lua') {
  const output = process.argv[4];
  const text = JSON.stringify(readGeneratedDump(parsed, ['Limit', 'Param', 'Recommend']), (_, value) => value instanceof Map ? Object.fromEntries(value) : value, 2);
  if (output) fs.writeFileSync(output, text + '\n');
  else console.log(text);
}
else for (const prototype of describePrototypes(parsed)) {
  if (filter.startsWith('__brief:')) {
    if (!filter.slice(8).split(',').map(Number).includes(prototype.index)) continue;
    console.log('prototype ' + prototype.index + ' source line ' + prototype.firstLine);
    for (const i of prototype.instructions) console.log([i.pc, i.name, 'a='+i.a, 'b='+i.b, 'c='+i.c, 'd='+i.d, i.resolved === undefined ? '' : JSON.stringify(i.resolved)].join(' '));
    continue;
  }
  if (filter === '__summary') console.log(JSON.stringify({ index: prototype.index, firstLine: prototype.firstLine, strings: prototype.strings, numbers: prototype.numbers }));
  else if (filter === '__reqtail' && prototype.strings.some(text => text.startsWith('req_'))) console.log(JSON.stringify({...prototype, instructions: prototype.instructions.slice(-20)}));
  else {
    if (filter && !JSON.stringify(prototype).includes(filter)) continue;
    console.log(JSON.stringify(prototype));
  }
}
