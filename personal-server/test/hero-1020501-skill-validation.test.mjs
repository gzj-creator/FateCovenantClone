import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 1020501;
const EXPECTED_IDS = [
  'normal-profession-4', '312050171', '312050172', '312050173', '312050174', '312050175',
  '120001027', '120000046', '120000051', '120000054', '120000055', '120000059', '120001003', '6910001013',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 700, maxHp: 700, attack: 80, defense: 60, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('1020501 影盾骑士 加载全部 14 个技能', () => {
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

test('不屈 / 健壮 / 泰然自若 提供战斗开始的永久属性', () => {
  const unyielding = skill('312050171').implementation;
  assert.equal(effectOf(skill('312050171')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('312050171')).magnitude, 0.05);
  assert.equal(unyielding.targetType, 'self');
  assert.equal(unyielding.energyCost, 0);
  assert.equal(unyielding.triggers[0].triggerType, 'on-round-start');
  assert.equal(unyielding.triggers[0].oncePerBattle, true);

  assert.equal(effectOf(skill('312050172')).statType, 'max-hp-percent');
  assert.equal(effectOf(skill('312050172')).magnitude, 0.05);

  const composed = skill('312050173').implementation;
  assert.deepEqual(composed.effects.map((e) => e.effect.statType), ['crit-resist', 'crit-damage-reduction']);
  assert.deepEqual(composed.effects.map((e) => e.effect.magnitude), [0.05, 0.1]);
  assert.equal(composed.triggers.length, 2);
});

test('盘石之固 312050174 近似为下一次受伤减免 15%', () => {
  const impl = skill('312050174').implementation;
  assert.equal(impl.requiresInvestigation, true);
  assert.match(impl.notes, /next incoming damage/i);
  assert.equal(effectOf(skill('312050174')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('312050174')).magnitude, 0.15);
  assert.equal(impl.effects[0].duration.durationType, 'timed');
  assert.equal(impl.effects[0].duration.rounds, 1);
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
});

test('铁骨铮铮 312050175 在终结技时获得 5% 最大生命护盾', () => {
  const impl = skill('312050175').implementation;
  assert.equal(impl.effectType, 'shield');
  assert.equal(effectOf(skill('312050175')).shieldType, 'percent-max-hp');
  assert.equal(effectOf(skill('312050175')).multiplier, 0.05);
  assert.equal(impl.triggers.length, 1);
  assert.equal(impl.triggers[0].triggerType, 'on-ultimate-use');
  assert.equal(impl.triggers[0].effect.target.targetType, 'self');
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
  assert.equal(effectOf(skill('120001003')).duration, 2);
  assert.equal(shield.effects[0].duration.rounds, 2);
  assert.equal(shield.triggers[0].conditionKey, 'hp-below-70');
  assert.equal(shield.triggers[0].oncePerBattle, true);
  assert.equal(shield.triggers[0].maxTriggers, 1);
});

test('战斗开始时注册全部 15 条被动/专精触发', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 15);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-being-hit', 'on-hp-threshold', 'on-ultimate-use']) {
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

  const selfShield = exec.executeEffect(effectOf(skill('312050175')), unit, unit);
  assert.equal(selfShield.type, 'shield');
  assert.equal(selfShield.value, Math.floor(700 * 0.05));

  const triggeredShield = exec.executeEffect(effectOf(skill('120001003')), unit, unit);
  assert.equal(triggeredShield.value, Math.floor(60 * 0.8));

  const energy = exec.executeEffect(effectOf(skill('120001027')), unit, unit);
  assert.equal(energy.newEnergy, 150);

  const buffed = hero();
  exec.executeEffect(effectOf(skill('312050171')), unit, buffed);
  assert.equal(buffed.buffs.length, 1);
  assert.equal(buffed.buffs[0].statType, 'damage-reduction');
  assert.equal(buffed.buffs[0].magnitude, 0.05);

  const weakened = enemy({ buffs: [{ type: 'strengthened', dispellable: true }] });
  const dispel = exec.executeEffect({ type: 'dispel', count: 1, removeType: 'buff' }, unit, weakened);
  assert.equal(dispel.count, 1);
});

