import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 1030501;
const EXPECTED_IDS = [
  'normal-profession-4', '313050171', '313050172', '313050173', '313050174', '313050175',
  '120001027', '120000046', '120000051', '120000054', '120000055', '120000059', '120001003',
  '6103030103', '6910001007',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 900, maxHp: 900, attack: 180, defense: 60, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('1030501 灾祸双子 加载全部 15 个技能', () => {
  assert.equal(skills.length, 15);
  assert.deepEqual(skills.map((s) => s.id).sort(), EXPECTED_IDS);
  assertAllSkillsExecutable(skills);
});

test('普攻 normal-profession-4 是单体物理伤害', () => {
  assert.equal(skill('normal-profession-4').implementation.effectType, 'damage');
  assert.equal(effectOf(skill('normal-profession-4')).type, 'damage');
  assert.equal(effectOf(skill('normal-profession-4')).damageType, 'physical');
});

test('不屈 / 健壮 / 泰然自若 提供战斗开始的永久属性', () => {
  assert.equal(effectOf(skill('313050171')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('313050171')).magnitude, 0.05);
  assert.equal(skill('313050171').implementation.triggers[0].oncePerBattle, true);

  assert.equal(effectOf(skill('313050172')).statType, 'max-hp-percent');
  assert.equal(effectOf(skill('313050172')).magnitude, 0.05);

  const composed = skill('313050173').implementation;
  assert.deepEqual(composed.effects.map((e) => e.effect.statType), ['crit-resist', 'crit-damage-reduction']);
  assert.equal(composed.triggers.length, 2);
});

test('影佑誓言 313050174 以 30% 概率追加 5% 最大生命护盾', () => {
  const impl = skill('313050174').implementation;
  assert.equal(impl.effectType, 'shield');
  assert.equal(effectOf(skill('313050174')).shieldType, 'percent-max-hp');
  assert.equal(effectOf(skill('313050174')).multiplier, 0.05);
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
  for (const trigger of impl.triggers) {
    assert.equal(trigger.effect.chance, 0.3);
  }
});

test('重重诡影 313050175 在持有护盾时提供 8% 减伤', () => {
  const impl = skill('313050175').implementation;
  assert.equal(impl.triggers[0].conditionKey, 'has-shield');
  assert.equal(effectOf(skill('313050175')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('313050175')).magnitude, 0.08);
  assert.equal(impl.triggers[0].effect.effect.magnitude, 0.08);
});

test('稀有终结技 6103030103 在受击时为全队提供 10% 最大生命护盾', () => {
  const impl = skill('6103030103').implementation;
  assert.equal(impl.effectType, 'shield');
  assert.equal(impl.targetType, 'all-allies');
  assert.equal(impl.energyCost, 100);
  assert.equal(effectOf(skill('6103030103')).shieldType, 'percent-max-hp');
  assert.equal(effectOf(skill('6103030103')).multiplier, 0.1);
  assert.equal(impl.effects[0].duration.durationType, 'timed');
  assert.equal(impl.effects[0].duration.rounds, 2);
  assert.equal(impl.triggers.length, 1);
  assert.equal(impl.triggers[0].triggerType, 'on-being-hit');
  assert.equal(impl.triggers[0].maxTriggersPerRound, 3);
  assert.equal(impl.triggers[0].round3Double, true);
  assert.equal(impl.requiresInvestigation, true, '同排能量效果与控制抗性尚未建模');
  assert.match(impl.notes, /same-row/i);
});

test('共享被动数值与触发条件符合目录描述', () => {
  assert.equal(effectOf(skill('120001027')).magnitude, 150);
  assert.equal(effectOf(skill('120000046')).magnitude, 0.1);
  assert.equal(skill('120000046').implementation.triggers[0].conditionKey, 'has-debuff');
  assert.equal(effectOf(skill('120000051')).magnitude, 0.15);
  assert.equal(skill('120000051').implementation.triggers[0].conditionKey, 'hp-below-50');
  assert.equal(effectOf(skill('120000054')).magnitude, 25);
  assert.equal(effectOf(skill('120000055')).magnitude, 0.3);
  assert.equal(effectOf(skill('120000059')).statType, 'heal-bonus');
  assert.equal(skill('120000059').implementation.effects[0].duration.rounds, 2, '祝福持续 2 回合');
  assert.equal(skill('120000059').implementation.triggers[0].oncePerBattle, true, '祝福整场只触发一次');

  const shield = skill('120001003').implementation;
  assert.equal(effectOf(skill('120001003')).shieldType, 'percent-defense');
  assert.equal(effectOf(skill('120001003')).multiplier, 0.8);
  assert.equal(shield.triggers[0].conditionKey, 'hp-below-70');
});

test('战斗开始时注册 15 条被动/专精触发（终结技触发随技能定义执行）', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 15);
  assert.equal(skill('6103030103').implementation.triggers.length, 1);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-being-hit', 'on-hp-threshold']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、护盾、能量与属性增益', () => {
  const exec = createExecutor();
  const unit = hero();
  const ally = hero({ id: 2 });
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-4')), unit, foe);
  assert.equal(damage.type, 'damage');
  assert.ok(damage.value >= 1 && damage.value < 200);

  const masteryShield = exec.executeEffect(effectOf(skill('313050174')), unit, unit);
  assert.equal(masteryShield.value, Math.floor(900 * 0.05));

  const rareShield = exec.executeEffect(effectOf(skill('6103030103')), unit, ally);
  assert.equal(rareShield.value, Math.floor(ally.maxHp * 0.1));

  const passiveShield = exec.executeEffect(effectOf(skill('120001003')), unit, unit);
  assert.equal(passiveShield.value, Math.floor(60 * 0.8));

  const energy = exec.executeEffect(effectOf(skill('120001027')), unit, unit);
  assert.equal(energy.newEnergy, 150);

  const buffed = hero();
  exec.executeEffect(effectOf(skill('313050171')), unit, buffed);
  assert.equal(buffed.buffs[0].statType, 'damage-reduction');
});

