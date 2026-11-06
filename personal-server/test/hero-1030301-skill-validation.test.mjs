import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 1030301;
const EXPECTED_IDS = [
  'normal-profession-1', '313030171', '313030172', '313030173', '313030174', '313030175',
  '120001031', '120000001', '120000006', '120000009', '120000014', '120000015', '120001002', '6910001005',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 880, maxHp: 880, attack: 220, defense: 55, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('1030301 观星者 加载全部 14 个技能', () => {
  assert.equal(skills.length, 14);
  assert.deepEqual(skills.map((s) => s.id).sort(), EXPECTED_IDS);
  assertAllSkillsExecutable(skills);
});

test('普攻 normal-profession-1 是单体物理伤害', () => {
  assert.equal(skill('normal-profession-1').implementation.effectType, 'damage');
  assert.equal(effectOf(skill('normal-profession-1')).type, 'damage');
  assert.equal(effectOf(skill('normal-profession-1')).damageType, 'physical');
});

test('重击 / 无畏 / 直击要害 提供战斗开始的永久属性', () => {
  assert.equal(effectOf(skill('313030171')).statType, 'damage-bonus');
  assert.equal(effectOf(skill('313030171')).magnitude, 0.05);
  assert.equal(skill('313030171').implementation.triggers[0].oncePerBattle, true);

  assert.equal(effectOf(skill('313030172')).statType, 'attack-percent');
  assert.equal(effectOf(skill('313030172')).magnitude, 0.05);

  const crit = skill('313030173').implementation;
  assert.deepEqual(crit.effects.map((e) => e.effect.statType), ['crit-rate', 'crit-damage']);
  assert.deepEqual(crit.effects.map((e) => e.effect.magnitude), [0.05, 0.1]);
  assert.equal(crit.triggers.length, 2);
});

test('迎头痛击 313030174 在普攻/绝招后驱散 1 个增益', () => {
  const impl = skill('313030174').implementation;
  assert.equal(impl.effectType, 'dispel');
  assert.equal(impl.targetType, 'single');
  assert.equal(effectOf(skill('313030174')).type, 'dispel');
  assert.equal(effectOf(skill('313030174')).count, 1);
  assert.equal(effectOf(skill('313030174')).removeType, 'buff');
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
  for (const trigger of impl.triggers) {
    assert.equal(trigger.effect.effect.type, 'dispel');
    assert.equal(trigger.effect.effect.removeType, 'buff');
  }
});

test('星爆陨灭 313030175 在终结技时附加暴击率与暴击伤害', () => {
  const impl = skill('313030175').implementation;
  assert.deepEqual(impl.effects.map((e) => e.effect.statType), ['crit-rate', 'crit-damage']);
  assert.deepEqual(impl.effects.map((e) => e.effect.magnitude), [0.1, 0.15]);
  assert.equal(impl.triggers.length, 2);
  for (const trigger of impl.triggers) {
    assert.equal(trigger.triggerType, 'on-ultimate-use');
  }
});

test('突破9 / 狂怒 / 勃发 / 鼓舞 的数值与条件', () => {
  const breakthrough = skill('120001031').implementation;
  assert.equal(breakthrough.triggers.length, 2);
  for (const trigger of breakthrough.triggers) {
    assert.equal(trigger.effect.effect.type, 'energy');
    assert.equal(trigger.effect.effect.magnitude, 200);
  }

  assert.equal(effectOf(skill('120000001')).statType, 'crit-rate');
  assert.equal(effectOf(skill('120000001')).magnitude, 0.15);
  assert.equal(skill('120000001').implementation.triggers[0].triggerType, 'on-ultimate-use');

  assert.equal(effectOf(skill('120000006')).statType, 'crit-damage');
  assert.equal(effectOf(skill('120000006')).magnitude, 0.2);
  assert.equal(skill('120000006').implementation.triggers[0].conditionKey, 'hp-above-50');

  assert.equal(effectOf(skill('120000009')).type, 'energy');
  assert.equal(effectOf(skill('120000009')).magnitude, 25);
});

test('格挡 / 标记 / 生命偷取的触发与数值', () => {
  const block = skill('120000014').implementation;
  assert.equal(block.triggers[0].oncePerBattle, true);
  assert.equal(effectOf(skill('120000014')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('120000014')).magnitude, 0.2);

  assert.equal(skill('120000015').implementation.triggers[0].conditionKey, 'target-has-debuff');
  assert.equal(effectOf(skill('120000015')).statType, 'crit-rate');
  assert.equal(effectOf(skill('120000015')).magnitude, 0.25);

  const lifesteal = skill('120001002').implementation;
  assert.equal(lifesteal.triggers[0].triggerType, 'on-ultimate-use');
  assert.equal(effectOf(skill('120001002')).type, 'heal');
  assert.equal(effectOf(skill('120001002')).healType, 'percent-attack');
  assert.equal(effectOf(skill('120001002')).multiplier, 0.2);
});

test('战斗开始时注册全部 17 条被动/专精触发', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 17);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-ultimate-use']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、治疗、能量、驱散与属性增益', () => {
  const exec = createExecutor();
  const unit = hero();
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-1')), unit, foe);
  assert.equal(damage.type, 'damage');
  assert.ok(damage.value >= 1 && damage.value < 200);

  const heal = exec.executeEffect(effectOf(skill('120001002')), unit, unit);
  assert.equal(heal.type, 'heal');
  assert.equal(heal.value, Math.floor(220 * 0.2));

  const energy = exec.executeEffect(effectOf(skill('120001031')), unit, unit);
  assert.equal(energy.newEnergy, 200);

  const buffed = enemy({ buffs: [{ type: 'strengthened', dispellable: true }] });
  const dispel = exec.executeEffect(effectOf(skill('313030174')), unit, buffed);
  assert.equal(dispel.count, 1);
  assert.equal(buffed.buffs.length, 0);

  const buffTarget = hero();
  exec.executeEffect(effectOf(skill('313030172')), unit, buffTarget);
  assert.equal(buffTarget.buffs[0].statType, 'attack-percent');
  assert.equal(buffTarget.buffs[0].magnitude, 0.05);
});

