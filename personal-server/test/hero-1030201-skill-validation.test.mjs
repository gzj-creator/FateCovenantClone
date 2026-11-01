import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';
import { STATUS_TYPES } from '../game/effects/effect-types.mjs';

const HERO_ID = 1030201;

test('hero 1030201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.equal(skills.length, 14, 'expected 14 skills for 银爵艾伦');
});

test('passive triggers count is at least 10', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 190, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.ok(unit.triggers.length >= 10, 'expected >=10 triggers, got ' + unit.triggers.length);
});

test('all trigger effects are non-null and have a type', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 190, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [] };
  registerPassiveTriggers(unit, db, { seed: 1 });
  for (const t of unit.triggers) {
    assert.ok(t.effect, 'trigger ' + t.id + ' has no effect');
    assert.ok(t.effect.effect && t.effect.effect.type, 'trigger ' + t.id + ' effect has no type');
  }
});

test('frightened is registered in STATUS_TYPES', () => {
  assert.equal(STATUS_TYPES.FRIGHTENED, 'frightened');
});

test('frightened status adds to target debuffs', () => {
  const executor = new EffectExecutor({ seed: 1, random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 190, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: 2, team: 2, loc: 1, hp: 600, maxHp: 600, attack: 100, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const effect = { type: 'status', statusType: 'frightened', duration: 2, maxStacks: 0, dispellable: true, sourceSkill: '313020174' };
  const result = executor.executeStatus(effect, actor, target);
  assert.equal(result.type, 'status');
  assert.equal(target.debuffs.length, 1);
  assert.equal(target.debuffs[0].type, 'frightened');
  assert.equal(target.debuffs[0].duration, 2);
});

test('慑魂奇招 (313020174) registers on-attack and on-skill-use status frightened', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313020174');
  assert.equal(skill.implementation.triggers.length, 2);
  const types = skill.implementation.triggers.map(t => t.triggerType).sort();
  assert.deepEqual(types, ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.effect.type, 'status');
    assert.equal(t.effect.effect.statusType, 'frightened');
    assert.equal(t.effect.effect.duration, 2);
  }
});

test('定制策略 (313020175) registers on-ultimate-use status frightened', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '313020175');
  assert.equal(skill.implementation.triggers.length, 1);
  const trig = skill.implementation.triggers[0];
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(trig.effect.effect.type, 'status');
  assert.equal(trig.effect.effect.statusType, 'frightened');
  assert.equal(trig.effect.target.targetType, 'front-row-highest-attack');
});