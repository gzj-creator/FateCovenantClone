import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 1030601;
const EXPECTED_IDS = [
  'normal-profession-4', '313060171', '313060172', '313060173', '313060174', '313060175',
  '120001027', '120000046', '120000051', '120000054', '120000055', '120000059', '120001003', '6910001008',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 780, maxHp: 780, attack: 95, defense: 65, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('1030601 梦魅 加载全部 14 个技能', () => {
  assert.equal(skills.length, 14);
  assert.deepEqual(skills.map((s) => s.id).sort(), EXPECTED_IDS);
  assertAllSkillsExecutable(skills);
});

test('普攻 normal-profession-4 是单体物理伤害', () => {
  assert.equal(skill('normal-profession-4').implementation.effectType, 'damage');
  assert.equal(effectOf(skill('normal-profession-4')).type, 'damage');
  assert.equal(effectOf(skill('normal-profession-4')).damageType, 'physical');
  assert.equal(effectOf(skill('normal-profession-4')).multiplier, 1);
});

test('不屈 / 健壮 / 一晌贪欢 提供战斗开始的永久属性', () => {
  assert.equal(effectOf(skill('313060171')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('313060171')).magnitude, 0.05);
  assert.equal(skill('313060171').implementation.triggers[0].oncePerBattle, true);

  assert.equal(effectOf(skill('313060172')).statType, 'max-hp-percent');
  assert.equal(effectOf(skill('313060172')).magnitude, 0.05);

  const composed = skill('313060173').implementation;
  assert.deepEqual(composed.effects.map((e) => e.effect.statType), ['crit-resist', 'crit-damage-reduction']);
  assert.deepEqual(composed.effects.map((e) => e.effect.magnitude), [0.05, 0.1]);
  assert.equal(composed.triggers.length, 2);
  for (const trigger of composed.triggers) {
    assert.equal(trigger.triggerType, 'on-round-start');
    assert.equal(trigger.oncePerBattle, true);
  }
});

test('如梦初醒 313060174 普攻/绝招后提升 15% 终结技伤害', () => {
  const impl = skill('313060174').implementation;
  assert.equal(impl.requiresInvestigation, true, '下一次终结技限定无法精确表达');
  assert.equal(effectOf(skill('313060174')).statType, 'damage-bonus');
  assert.equal(effectOf(skill('313060174')).magnitude, 0.15);
  assert.equal(impl.effects[0].duration.durationType, 'timed');
  assert.equal(impl.effects[0].duration.rounds, 1);
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
});

test('坠入深渊 313060175 在终结技时附加暴击率与暴击伤害', () => {
  const impl = skill('313060175').implementation;
  assert.deepEqual(impl.effects.map((e) => e.effect.statType), ['crit-rate', 'crit-damage']);
  assert.deepEqual(impl.effects.map((e) => e.effect.magnitude), [0.1, 0.15]);
  assert.equal(impl.triggers.length, 2);
  for (const trigger of impl.triggers) {
    assert.equal(trigger.triggerType, 'on-ultimate-use');
    assert.equal(trigger.effect.effect.magnitude > 0, true);
  }
});

test('共享被动数值与触发条件符合目录描述', () => {
  assert.equal(effectOf(skill('120001027')).magnitude, 150);
  assert.equal(skill('120001027').implementation.triggers[0].triggerType, 'on-being-hit');

  assert.equal(effectOf(skill('120000046')).magnitude, 0.1);
  assert.equal(skill('120000046').implementation.triggers[0].conditionKey, 'has-debuff');

  assert.equal(effectOf(skill('120000051')).magnitude, 0.15);
  assert.equal(skill('120000051').implementation.triggers[0].conditionKey, 'hp-below-50');

  assert.equal(effectOf(skill('120000054')).magnitude, 25);
  assert.equal(skill('120000054').implementation.triggers[0].effect.target.targetType, 'self');

  assert.equal(effectOf(skill('120000055')).statType, 'crit-rate');
  assert.equal(effectOf(skill('120000055')).magnitude, 0.3);
  assert.equal(skill('120000055').implementation.triggers[0].conditionKey, 'target-hp-above-self');

  assert.equal(effectOf(skill('120000059')).statType, 'heal-bonus');
  assert.equal(skill('120000059').implementation.effects[0].duration.rounds, 2);

  const shield = skill('120001003').implementation;
  assert.equal(effectOf(skill('120001003')).shieldType, 'percent-defense');
  assert.equal(effectOf(skill('120001003')).multiplier, 0.8);
  assert.equal(shield.effects[0].duration.rounds, 2);
  assert.equal(shield.triggers[0].conditionKey, 'hp-below-70');
});

test('战斗开始时注册全部 16 条被动/专精触发', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 16);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-ultimate-use', 'on-being-hit', 'on-hp-threshold']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、护盾、能量与属性增益', () => {
  const exec = createExecutor();
  const unit = hero();
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-4')), unit, foe);
  assert.equal(damage.type, 'damage');
  assert.ok(damage.value >= 1 && damage.value < 100);

  const shield = exec.executeEffect(effectOf(skill('120001003')), unit, unit);
  assert.equal(shield.value, Math.floor(65 * 0.8));

  const energy = exec.executeEffect(effectOf(skill('120001027')), unit, unit);
  assert.equal(energy.newEnergy, 150);

  const buffed = hero();
  exec.executeEffect(effectOf(skill('313060171')), unit, buffed);
  assert.equal(buffed.buffs[0].statType, 'damage-reduction');
  assert.equal(buffed.buffs[0].magnitude, 0.05);

  const debuffed = enemy();
  exec.executeEffect(effectOf(skill('313060173'), 1), unit, debuffed);
  assert.equal(debuffed.buffs[0].statType, 'crit-damage-reduction');
});

