import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 1020401;
const EXPECTED_IDS = [
  'normal-profession-4', '312040171', '312040172', '312040173', '312040174', '312040175',
  '120001027', '120000046', '120000051', '120000054', '120000055', '120000059', '120001005', '6910001012',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 660, maxHp: 660, attack: 90, defense: 60, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('1020401 通灵女巫 加载全部 14 个技能', () => {
  assert.equal(skills.length, 14);
  assert.deepEqual(skills.map((s) => s.id).sort(), EXPECTED_IDS);
  assertAllSkillsExecutable(skills);
});

test('普攻 normal-profession-4 是单体物理伤害', () => {
  const impl = skill('normal-profession-4').implementation;
  assert.equal(impl.effectType, 'damage');
  assert.equal(impl.targetType, 'single');
  assert.equal(effectOf(skill('normal-profession-4')).type, 'damage');
  assert.equal(effectOf(skill('normal-profession-4')).damageType, 'physical');
  assert.equal(effectOf(skill('normal-profession-4')).multiplier, 1);
});

test('不屈 / 健壮 / 泰然自若 提供战斗开始的永久属性', () => {
  assert.equal(effectOf(skill('312040171')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('312040171')).magnitude, 0.05);
  assert.equal(skill('312040171').implementation.effects[0].duration.durationType, 'permanent');

  assert.equal(effectOf(skill('312040172')).statType, 'max-hp-percent');
  assert.equal(effectOf(skill('312040172')).magnitude, 0.05);

  const composed = skill('312040173').implementation;
  assert.equal(composed.effects.length, 2);
  assert.deepEqual(composed.effects.map((e) => e.effect.statType), ['crit-resist', 'crit-damage-reduction']);
  assert.deepEqual(composed.effects.map((e) => e.effect.magnitude), [0.05, 0.1]);
  assert.equal(composed.triggers.length, 2);
  for (const trigger of composed.triggers) {
    assert.equal(trigger.triggerType, 'on-round-start');
    assert.equal(trigger.oncePerBattle, true);
  }
});

test('迎头痛击 312040174 在普攻/绝招后驱散 1 个增益', () => {
  const impl = skill('312040174').implementation;
  assert.equal(impl.effectType, 'dispel');
  assert.equal(effectOf(skill('312040174')).count, 1);
  assert.equal(effectOf(skill('312040174')).removeType, 'buff');
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
});

test('傀儡咒术 312040175 前 3 回合减伤并在第 3 回合结束回血', () => {
  const impl = skill('312040175').implementation;
  assert.equal(impl.effects.length, 2);
  assert.equal(impl.effects[0].effect.statType, 'damage-reduction');
  assert.equal(impl.effects[0].effect.magnitude, 0.08);
  assert.equal(impl.effects[0].duration.durationType, 'timed');
  assert.equal(impl.effects[1].effect.type, 'heal');
  assert.equal(impl.effects[1].effect.healType, 'percent-max-hp');
  assert.equal(impl.effects[1].effect.multiplier, 0.05);

  const reduction = impl.triggers.find((t) => t.effect.effect.type === 'stat-modifier');
  const heal = impl.triggers.find((t) => t.effect.effect.type === 'heal');
  assert.equal(reduction.triggerType, 'on-round-start');
  assert.equal(reduction.maxTriggers, 3);
  assert.equal(heal.triggerType, 'on-round-end');
  assert.equal(heal.conditionKey, 'round-3');
  assert.equal(heal.oncePerBattle, true);
});

test('共享被动数值与触发条件符合目录描述', () => {
  assert.equal(effectOf(skill('120001027')).magnitude, 150);
  assert.equal(skill('120001027').implementation.triggers[0].triggerType, 'on-being-hit');

  assert.equal(effectOf(skill('120000046')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('120000046')).magnitude, 0.1);
  assert.equal(skill('120000046').implementation.triggers[0].conditionKey, 'has-debuff');

  assert.equal(effectOf(skill('120000051')).magnitude, 0.15);
  assert.equal(skill('120000051').implementation.triggers[0].conditionKey, 'hp-below-50');
  assert.equal(skill('120000051').implementation.triggers[0].oncePerBattle, true);
  assert.equal(skill('120000051').implementation.triggers[0].maxTriggers, 1);

  assert.equal(effectOf(skill('120000054')).type, 'energy');
  assert.equal(effectOf(skill('120000054')).magnitude, 25);
  assert.equal(skill('120000054').implementation.triggers[0].effect.target.targetType, 'self');

  assert.equal(effectOf(skill('120000055')).statType, 'crit-rate');
  assert.equal(effectOf(skill('120000055')).magnitude, 0.3);
  assert.equal(skill('120000055').implementation.triggers[0].conditionKey, 'target-hp-above-self');

  assert.equal(effectOf(skill('120000059')).statType, 'heal-bonus');
  assert.equal(effectOf(skill('120000059')).magnitude, 0.2);
  assert.equal(skill('120000059').implementation.effects[0].duration.rounds, 2);

  assert.equal(effectOf(skill('120001005')).healType, 'percent-attack');
  assert.equal(effectOf(skill('120001005')).multiplier, 0.3);
  assert.equal(skill('120001005').implementation.triggers[0].conditionKey, 'hp-below-30');
});

test('战斗开始时注册全部 16 条被动/专精触发', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 16);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-being-hit', 'on-hp-threshold', 'on-round-end']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、治疗、能量与驱散', () => {
  const exec = createExecutor();
  const unit = hero({ hp: 100 });
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-4')), unit, foe);
  assert.equal(damage.type, 'damage');
  assert.ok(damage.value >= 1 && damage.value < 100, `unexpected damage ${damage.value}`);
  assert.equal(damage.crit, false);

  const healed = exec.executeEffect(effectOf(skill('120001005')), unit, unit);
  assert.equal(healed.value, Math.floor(90 * 0.3));
  assert.equal(healed.newHp, 127);

  const energy = exec.executeEffect(effectOf(skill('120001027')), unit, unit);
  assert.equal(energy.newEnergy, 150);

  const buffed = enemy({ buffs: [{ type: 'strengthened', dispellable: true }] });
  const dispel = exec.executeEffect(effectOf(skill('312040174')), unit, buffed);
  assert.equal(dispel.type, 'dispel');
  assert.equal(dispel.count, 1);
  assert.equal(buffed.buffs.length, 0);
});

test('EffectExecutor 把 max-hp-percent 专精属性归为增益', () => {
  const exec = createExecutor();
  const unit = hero();
  exec.executeEffect(effectOf(skill('312040172')), unit, unit);
  assert.equal(unit.buffs.length, 1);
  assert.equal(unit.debuffs.length, 0);
  assert.equal(unit.buffs[0].statType, 'max-hp-percent');
  assert.equal(unit.buffs[0].magnitude, 0.05);
});

