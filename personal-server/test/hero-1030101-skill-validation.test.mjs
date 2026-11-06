import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 1030101;
const EXPECTED_IDS = [
  'normal-profession-4', '313010171', '313010172', '313010173', '313010174', '313010175',
  '120001027', '120000051', '120000054', '120000055', '120000059', '120001003', '120001019',
  '6103010109', '6910001003',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 720, maxHp: 720, attack: 85, defense: 70, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('1030101 露奈尔 加载全部 15 个技能', () => {
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
  assert.equal(effectOf(skill('313010171')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('313010171')).magnitude, 0.05);
  assert.equal(effectOf(skill('313010172')).statType, 'max-hp-percent');
  assert.equal(effectOf(skill('313010172')).magnitude, 0.05);

  const composed = skill('313010173').implementation;
  assert.deepEqual(composed.effects.map((e) => e.effect.statType), ['crit-resist', 'crit-damage-reduction']);
  assert.deepEqual(composed.effects.map((e) => e.effect.magnitude), [0.05, 0.1]);
  assert.equal(composed.triggers.length, 2);
});

test('盘石之固 313010174 近似为下一次受伤减免 15%', () => {
  const impl = skill('313010174').implementation;
  assert.equal(impl.requiresInvestigation, true);
  assert.equal(effectOf(skill('313010174')).magnitude, 0.15);
  assert.equal(impl.effects[0].duration.rounds, 1);
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
});

test('赤红攻势 313010175 前 3 回合减伤并在第 3 回合结束回血', () => {
  const impl = skill('313010175').implementation;
  assert.equal(impl.effects.length, 2);
  assert.equal(impl.effects[0].effect.statType, 'damage-reduction');
  assert.equal(impl.effects[0].effect.magnitude, 0.08);
  assert.equal(impl.effects[1].effect.type, 'heal');
  assert.equal(impl.effects[1].effect.multiplier, 0.05);
  const reduction = impl.triggers.find((t) => t.effect.effect.type === 'stat-modifier');
  const heal = impl.triggers.find((t) => t.effect.effect.type === 'heal');
  assert.equal(reduction.maxTriggers, 3);
  assert.equal(heal.conditionKey, 'round-3');
  assert.equal(heal.oncePerBattle, true);
});

test('防护加持 120001019 以首次终结技触发 20% 减伤', () => {
  const impl = skill('120001019').implementation;
  assert.equal(impl.requiresInvestigation, true);
  assert.equal(effectOf(skill('120001019')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('120001019')).magnitude, 0.2);
  assert.equal(impl.triggers.length, 1);
  assert.equal(impl.triggers[0].triggerType, 'on-ultimate-use');
  assert.equal(impl.triggers[0].oncePerBattle, true);
});

test('稀有终结技 6103010109 在回合结束为全队提供 5% 最大生命护盾', () => {
  const impl = skill('6103010109').implementation;
  assert.equal(impl.effectType, 'shield');
  assert.equal(impl.targetType, 'all-allies');
  assert.equal(impl.energyCost, 100);
  assert.equal(effectOf(skill('6103010109')).shieldType, 'percent-max-hp');
  assert.equal(effectOf(skill('6103010109')).multiplier, 0.05);
  assert.equal(impl.effects[0].duration.rounds, 1);
  assert.equal(impl.triggers.length, 1);
  assert.equal(impl.triggers[0].triggerType, 'on-round-end');
  assert.equal(impl.triggers[0].effect.target.targetType, 'all-allies');
  assert.equal(impl.requiresInvestigation, true, '极夜翻倍与 {0} 状态层尚未建模');
  assert.match(impl.notes, /polar-night/i);
});

test('共享被动数值与触发条件符合目录描述', () => {
  assert.equal(effectOf(skill('120001027')).magnitude, 150);
  assert.equal(effectOf(skill('120000051')).magnitude, 0.15);
  assert.equal(skill('120000051').implementation.triggers[0].conditionKey, 'hp-below-50');
  assert.equal(effectOf(skill('120000054')).magnitude, 25);
  assert.equal(effectOf(skill('120000055')).magnitude, 0.3);
  assert.equal(effectOf(skill('120000059')).statType, 'heal-bonus');
  assert.equal(skill('120000059').implementation.effects[0].duration.rounds, 2);

  const shield = skill('120001003').implementation;
  assert.equal(effectOf(skill('120001003')).shieldType, 'percent-defense');
  assert.equal(effectOf(skill('120001003')).multiplier, 0.8);
  assert.equal(shield.triggers[0].conditionKey, 'hp-below-70');
  assert.equal(shield.triggers[0].maxTriggers, 1);
});

test('战斗开始时注册 16 条被动/专精触发（终结技触发随技能定义执行）', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  // 6103010109 is an Ultimate; registerPassiveTriggers only binds Passive/Mastery skills.
  assert.equal(unit.triggers.length, 16);
  assert.equal(skill('6103010109').implementation.triggers.length, 1);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-being-hit', 'on-hp-threshold', 'on-round-end', 'on-ultimate-use']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、治疗、护盾、能量与属性增益', () => {
  const exec = createExecutor();
  const unit = hero();
  const ally = hero({ id: 2 });
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-4')), unit, foe);
  assert.ok(damage.value >= 1 && damage.value < 100);

  const heal = exec.executeEffect(effectOf(skill('313010175'), 1), unit, unit);
  assert.equal(heal.value, Math.floor(720 * 0.05));

  const shield = exec.executeEffect(effectOf(skill('6103010109')), unit, ally);
  assert.equal(shield.type, 'shield');
  assert.equal(shield.value, Math.floor(720 * 0.05));

  const energy = exec.executeEffect(effectOf(skill('120001027')), unit, unit);
  assert.equal(energy.newEnergy, 150);

  const buffed = hero();
  exec.executeEffect(effectOf(skill('313010171')), unit, buffed);
  assert.equal(buffed.buffs[0].statType, 'damage-reduction');
});

