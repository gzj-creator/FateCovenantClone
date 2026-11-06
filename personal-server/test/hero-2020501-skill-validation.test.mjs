import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 2020501;
const EXPECTED_IDS = [
  'normal-profession-3', '322050171', '322050172', '322050173', '322050174', '322050175',
  '120001028', '120000032', '120000034', '120000037', '120000042', '120000044', '120001003', '6910001026',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 630, maxHp: 630, attack: 95, defense: 60, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('2020501 炎拳 加载全部 14 个技能', () => {
  assert.equal(skills.length, 14);
  assert.deepEqual(skills.map((s) => s.id).sort(), EXPECTED_IDS);
  assertAllSkillsExecutable(skills);
});

test('普攻 normal-profession-3 是单体物理伤害', () => {
  assert.equal(skill('normal-profession-3').implementation.effectType, 'damage');
  assert.equal(effectOf(skill('normal-profession-3')).type, 'damage');
  assert.equal(effectOf(skill('normal-profession-3')).damageType, 'physical');
});

test('不屈 / 健壮 / 超群技艺 提供战斗开始的永久属性', () => {
  const unyielding = skill('322050171').implementation;
  assert.equal(effectOf(skill('322050171')).statType, 'damage-reduction');
  assert.equal(effectOf(skill('322050171')).magnitude, 0.05);
  assert.equal(unyielding.triggers[0].triggerType, 'on-round-start');
  assert.equal(unyielding.triggers[0].oncePerBattle, true);

  assert.equal(effectOf(skill('322050172')).statType, 'max-hp-percent');
  assert.equal(effectOf(skill('322050172')).magnitude, 0.05);

  const mastery = skill('322050173').implementation;
  assert.deepEqual(mastery.effects.map((e) => e.effect.statType), ['status-hit', 'status-resist']);
  assert.deepEqual(mastery.effects.map((e) => e.effect.magnitude), [0.1, 0.1]);
  assert.equal(mastery.triggers.length, 2);
});

test('无间囚笼 322050174 以 30% 概率施加 2 回合锁链', () => {
  const impl = skill('322050174').implementation;
  assert.equal(impl.requiresInvestigation, true);
  assert.equal(impl.effectType, 'status');
  assert.equal(effectOf(skill('322050174')).statusType, 'chain');
  assert.equal(effectOf(skill('322050174')).duration, 2);
  assert.equal(skill('322050174').implementation.effects[0].duration.rounds, 2);
  assert.equal(skill('322050174').implementation.effects[0].chance, 0.3);
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
  for (const trigger of impl.triggers) {
    assert.equal(trigger.effect.chance, 0.3);
    assert.equal(trigger.effect.effect.statusType, 'chain');
  }
});

test('锢魂之咒 322050175 近似为对受击目标降低 5% 暴击与 5% 闪避', () => {
  const impl = skill('322050175').implementation;
  assert.equal(impl.requiresInvestigation, true);
  assert.match(impl.notes, /chain/i);
  assert.equal(impl.effectType, 'stat-modifier');
  assert.equal(impl.targetType, 'single');
  assert.deepEqual(impl.effects.map((e) => e.effect.statType), ['crit-rate', 'evasion']);
  assert.deepEqual(impl.effects.map((e) => e.effect.magnitude), [-0.05, -0.05]);
  assert.equal(impl.effects[0].duration.durationType, 'timed');
  assert.equal(impl.effects[0].duration.rounds, 2);
  assert.equal(impl.triggers.length, 2);
  assert.deepEqual(impl.triggers.map((t) => t.triggerType).sort(), ['on-attack', 'on-skill-use']);
  for (const trigger of impl.triggers) {
    assert.equal(trigger.conditionKey, 'target-has-debuff');
    assert.equal(trigger.effect.target.targetType, 'single');
  }
});

test('突破6 / 反弹 / 铁甲 / 亢奋 / 暴怒 / 奋激 / 生命护盾 的数值', () => {
  const breakthrough = skill('120001028').implementation;
  assert.equal(breakthrough.triggers.length, 2);
  for (const trigger of breakthrough.triggers) {
    assert.equal(trigger.effect.effect.type, 'energy');
    assert.equal(trigger.effect.effect.magnitude, 50);
  }

  assert.equal(effectOf(skill('120000032')).statType, 'rebound-rate');
  assert.equal(effectOf(skill('120000032')).magnitude, 0.1);
  assert.equal(skill('120000032').implementation.triggers[0].triggerType, 'on-being-hit');

  assert.equal(skill('120000034').implementation.triggers[0].conditionKey, 'hp-above-50');
  assert.equal(effectOf(skill('120000034')).statType, 'anti-crit');
  assert.equal(effectOf(skill('120000034')).magnitude, 0.2);

  assert.equal(skill('120000037').implementation.triggers[0].triggerType, 'on-kill');
  assert.equal(effectOf(skill('120000037')).magnitude, 100);

  assert.equal(skill('120000042').implementation.triggers[0].triggerType, 'on-skill-use');
  assert.equal(effectOf(skill('120000042')).statType, 'crit-damage');
  assert.equal(effectOf(skill('120000042')).magnitude, 0.3);

  assert.equal(skill('120000044').implementation.triggers[0].oncePerBattle, true);
  assert.equal(effectOf(skill('120000044')).magnitude, 0.2);

  const shield = skill('120001003').implementation;
  assert.equal(effectOf(skill('120001003')).shieldType, 'percent-defense');
  assert.equal(effectOf(skill('120001003')).multiplier, 0.8);
  assert.equal(shield.triggers[0].conditionKey, 'hp-below-70');
  assert.equal(shield.triggers[0].maxTriggers, 1);
});

test('战斗开始时注册全部 16 条被动/专精触发', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 16);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-being-hit', 'on-kill', 'on-hp-threshold', 'on-ultimate-use']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、能量、护盾、状态与减益', () => {
  const exec = createExecutor();
  const unit = hero();
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-3')), unit, foe);
  assert.equal(damage.type, 'damage');
  assert.ok(damage.value >= 1 && damage.value < 100);

  const energy = exec.executeEffect(effectOf(skill('120001028')), unit, unit);
  assert.equal(energy.newEnergy, 50);

  const shield = exec.executeEffect(effectOf(skill('120001003')), unit, unit);
  assert.equal(shield.value, Math.floor(60 * 0.8));

  const chainTarget = enemy();
  const chain = exec.executeEffect(effectOf(skill('322050174')), unit, chainTarget);
  assert.equal(chain.type, 'status');
  assert.equal(chain.statusType, 'chain');
  assert.equal(chainTarget.debuffs[0].type, 'chain');

  const cursed = enemy();
  exec.executeEffect(effectOf(skill('322050175')), unit, cursed);
  assert.equal(cursed.debuffs.length, 1);
  assert.equal(cursed.debuffs[0].statType, 'crit-rate');
  assert.equal(cursed.debuffs[0].magnitude, -0.05);
  assert.equal(cursed.buffs.length, 0, '负面属性应进入 debuffs');
});

