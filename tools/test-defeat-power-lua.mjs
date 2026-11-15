import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { patchDefeatPowerLua } from './patch-defeat-power-lua.mjs';

// Execute only this small result-form function's instructions against inert UI
// and calculator stubs. This validates branch/call-register behavior for both
// shipped call ABIs; it is not a client runtime or visual acceptance test.
function run(bytes, architecture, { staticPower, reportPower, multiplier = 1, battles } = {}) {
  const prototype = parseLuaJit(bytes).prototypes[16];
  const registers = [];
  const actualBattles = battles ?? [{ atk_power: 123, ...(reportPower === undefined ? {} : { def_power: reportPower }) }];
  const field = (value, key) => Array.isArray(value) ? value[Number(key) - 1] : value[key];
  const calls = [];
  const node = { SetTeamIndex(self, index) { assert.equal(self, node); calls.push(['team', index]); } };
  registers[0] = { _ndPower: { LuaModule: node }, _resultObj: { fightReport: { tid: 201, battle_list: actualBattles } } };
  const globals = {
    CombatPowerCalculator: { GetDefTeamPower(tid, team) { calls.push(['lookup', tid, team]); return staticPower; } },
    MissionInterfaceMgr: { GetMissionIF() { return mission; } },
    FightResultUIMgr: { ShowPowerWithCustom(atk, def, ui) { assert.equal(ui, node); calls.push(['show', atk, def]); } }
  };
  const mission = { CountMulPower(self, power) { assert.equal(self, mission); calls.push(['mul', power]); return power * multiplier; } };
  const truthy = value => value !== undefined && value !== null && value !== false;
  let pc = 0, steps = 0;
  while (pc < prototype.instructions.length) {
    assert.ok(++steps < 150, 'Function must terminate');
    const instruction = prototype.instructions[pc++];
    const { a, b, c, d, name } = instruction;
    switch (name) {
      case 'TGETS': registers[a] = field(registers[b], prototype.constants[c].value); break;
      case 'TGETV': registers[a] = field(registers[b], registers[c]); break;
      case 'LEN': registers[a] = registers[d].length; break;
      case 'GGET': registers[a] = globals[prototype.constants[d].value]; break;
      case 'MOV': registers[a] = registers[d]; break;
      case 'KSHORT': registers[a] = d << 16 >> 16; break;
      case 'ISLT': if (!(registers[a] < registers[d])) pc++; break;
      case 'ISGE': if (!(registers[a] >= registers[d])) pc++; break;
      case 'ISF': if (truthy(registers[d])) pc++; break;
      case 'JMP': pc += d - 32768; break;
      case 'CALL': {
        const first = a + (architecture === '64' ? 2 : 1);
        const args = registers.slice(first, first + c - 1);
        const value = registers[a](...args);
        if (b === 2) registers[a] = value;
        else assert.equal(b, 1, 'Only zero/one-result calls are expected');
        break;
      }
      case 'RET0': return calls;
      default: throw new Error('Unexpected result-form opcode: ' + name);
    }
  }
  throw new Error('Missing RET0');
}

const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error('Usage: test-defeat-power-lua.mjs <32-original.lua.bin> <64-original.lua.bin>');
let tests = 0;
const report = [];
for (const input of inputs) {
  const source = fs.readFileSync(input);
  const result = patchDefeatPowerLua(source);
  const { architecture } = result.report;
  const scenarios = [
    { name: 'zero table uses first team report', input: { staticPower: 0, reportPower: 1872, multiplier: 4 }, power: 1872, mul: false },
    { name: 'positive table keeps original difficulty multiplier', input: { staticPower: 915, reportPower: 9999, multiplier: 2 }, power: 1830, mul: true },
    { name: 'missing report power remains zero', input: { staticPower: 0 }, power: 0, mul: false },
    { name: 'zero report remains zero', input: { staticPower: 0, reportPower: 0 }, power: 0, mul: false },
    { name: 'negative report is rejected', input: { staticPower: 0, reportPower: -1 }, power: 0, mul: false },
    { name: 'uint64 report stays exact', input: { staticPower: 0, reportPower: 9007199254740993n }, power: 9007199254740993n, mul: false },
    { name: 'final team comes from final battle', input: { staticPower: 0, battles: [{ atk_power: 111, def_power: 456 }, { atk_power: 333, def_power: 789 }] }, power: 789, atk: 333, team: 2, mul: false },
    { name: 'positive table does not require report power', input: { staticPower: 17, multiplier: 3 }, power: 51, mul: true }
  ];
  for (const scenario of scenarios) {
    const calls = run(result.bytes, architecture, scenario.input);
    assert.deepEqual(calls.find(call => call[0] === 'show'), ['show', scenario.atk ?? 123, scenario.power], scenario.name);
    assert.deepEqual(calls.find(call => call[0] === 'team'), ['team', scenario.team ?? 1], scenario.name);
    assert.deepEqual(calls.find(call => call[0] === 'lookup'), ['lookup', 201, scenario.team ?? 1], scenario.name);
    assert.equal(calls.some(call => call[0] === 'mul'), scenario.mul, scenario.name);
    if (scenario.input.staticPower > 0) assert.deepEqual(calls, run(source, architecture, scenario.input), 'Original positive path must match');
    tests++;
  }
  assert.throws(() => patchDefeatPowerLua(result.bytes), /Unexpected .* SHA256/);
  tests++;
  report.push(result.report);
}
console.log(JSON.stringify({ tests, passed: tests, failed: 0, reports: report, validation: 'offline instruction interpreter; no runtime, APK install or visual acceptance' }, null, 2));
