import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  classifyCommandAccess,
  extractFunOpenConstants,
  findCommandSendSites,
  findFunOpenGateSites
} from '../../tools/extract-command-fun-open-gates.mjs';
import { loadCommandCatalog, loadCommandGateRules } from '../game/command-registry.mjs';

function prototype(index, constants, instructions, numbers = []) {
  return { index, constants, numbers, instructions: instructions.map((instruction, pc) => ({ pc, ...instruction })) };
}

test('extracts FunOpen constants from the table initializer register flow', () => {
  const parsed = {
    rootPrototype: 0,
    prototypes: [prototype(0, [
      { type: 'string', value: 'TID_FIRST' },
      { type: 'string', value: 'TID_SECOND' }
    ], [
      { name: 'TNEW', a: 0, b: 0, c: 0, d: 0 },
      { name: 'GSET', a: 0, b: 0, c: 0, d: 0 },
      { name: 'KSHORT', a: 3, b: 0, c: 0, d: 1001 },
      { name: 'TSETS', a: 3, b: 0, c: 0, d: 0 },
      { name: 'KSTR', a: 3, b: 0, c: 1, d: 1 },
      { name: 'KSHORT', a: 4, b: 0, c: 0, d: 1002 },
      { name: 'TSETV', a: 4, b: 0, c: 3, d: 3 }
    ])]
  };
  const constants = extractFunOpenConstants(parsed);
  assert.equal(constants.get('TID_FIRST'), 1001);
  assert.equal(constants.get('TID_SECOND'), 1002);
});

test('finds an exact FunOpenMgr IsOpen argument and command send call', () => {
  const parsed = {
    prototypes: [prototype(3, [
      { type: 'string', value: 'FunOpenMgr' },
      { type: 'string', value: 'IsOpen' },
      { type: 'string', value: 'FunOpenTable' },
      { type: 'string', value: 'TID_FEATURE' },
      { type: 'string', value: 'HeroCmd' },
      { type: 'string', value: 'req_hero_diff' }
    ], [
      { name: 'GGET', a: 2, b: 0, c: 0, d: 0 },
      { name: 'TGETS', a: 2, b: 2, c: 1, d: 257 },
      { name: 'GGET', a: 4, b: 0, c: 0, d: 2 },
      { name: 'TGETS', a: 4, b: 4, c: 3, d: 771 },
      { name: 'CALL', a: 2, b: 1, c: 2, d: 514 },
      { name: 'GGET', a: 5, b: 0, c: 0, d: 4 },
      { name: 'TGETS', a: 5, b: 5, c: 5, d: 1285 },
      { name: 'CALL', a: 5, b: 1, c: 1, d: 257 }
    ])]
  };
  const gates = findFunOpenGateSites(parsed, new Map([['TID_FEATURE', 1321]]));
  assert.deepEqual(gates, [{
    prototype: 3,
    pc: 4,
    funIds: [1321],
    constants: ['TID_FEATURE'],
    unmappedConstants: []
  }]);
  const sends = findCommandSendSites(parsed, new Set(['req_hero_diff']));
  assert.deepEqual(sends, [{ prototype: 3, tgetsPc: 6, callPc: 7, module: 'HeroCmd', name: 'req_hero_diff' }]);
});

test('access audit gives strong setters precedence over read suffixes', () => {
  assert.equal(classifyCommandAccess({ name: 'req_change_base_info' }), 'write');
  assert.equal(classifyCommandAccess({ name: 'req_martial_club_set_team_info' }), 'write');
  assert.equal(classifyCommandAccess({ name: 'req_guild_info' }), 'read');
  assert.equal(classifyCommandAccess({ name: 'fight_start' }), 'write');
});

test('shipped command gate evidence is valid and excludes generic false positives', () => {
  const catalog = loadCommandCatalog();
  const rules = loadCommandGateRules();
  const funOpen = JSON.parse(fs.readFileSync(new URL('../config/fun-open-rules.json', import.meta.url), 'utf8'));
  const commandByType = new Map(catalog.commands.map(command => [command.type, command]));
  const funIds = new Set(funOpen.rules.map(rule => rule.funId));
  const ruleTypes = new Set();
  let direct = 0;
  let fileUnique = 0;
  for (const rule of rules) {
    assert.equal(commandByType.has(rule.type), true, `unknown command ${rule.type}`);
    assert.equal(ruleTypes.has(rule.type), false, `duplicate command rule ${rule.type}`);
    ruleTypes.add(rule.type);
    for (const funId of rule.requires ?? []) assert.equal(funIds.has(funId), true, `unknown fun id ${funId}`);
    if (rule.evidence?.scope === 'same_prototype') direct += 1;
    if (rule.evidence?.scope === 'same_file_unique') fileUnique += 1;
  }
  assert.equal(rules.length, 185);
  assert.equal(direct, 14);
  assert.equal(fileUnique, 171);
  assert.equal(commandByType.get(21008).access, 'write');
  assert.equal(commandByType.get(84410).access, 'write');
  for (const type of [151, 201, 202, 503, 666, 21023]) assert.equal(ruleTypes.has(type), false);
  assert.deepEqual(rules.find(rule => rule.type === 661).requires, [1321]);
  assert.deepEqual(rules.find(rule => rule.type === 1312).requires, [1051]);
  assert.deepEqual(rules.find(rule => rule.type === 16001).requires, [1590]);
});
