import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { createExecutor, skillFinder, makeUnit, assertAllSkillsExecutable, effectOf } from './skill-validation-helpers.mjs';

const HERO_ID = 2020601;
const EXPECTED_IDS = [
  'normal-profession-2', '322060171', '322060172', '322060173', '322060174', '322060175',
  '120001026', '120000019', '120000023', '120000025', '120000028', '120001004', '120001011', '6202060112',
].sort();

const db = loadSkillDatabase();
const skills = getHeroSkills(HERO_ID, db);
const skill = skillFinder(skills);
const hero = (over = {}) => makeUnit({ id: HERO_ID, hp: 600, maxHp: 600, attack: 95, defense: 50, ...over });
const enemy = (over = {}) => makeUnit({ id: 900, team: 2, hp: 1000, maxHp: 1000, attack: 100, defense: 50, ...over });

test('2020601 影之菖蒲 加载全部 14 个技能', () => {
  assert.equal(skills.length, 14);
  assert.deepEqual(skills.map((s) => s.id).sort(), EXPECTED_IDS);
  assertAllSkillsExecutable(skills);
});

test('普攻 normal-profession-2 是单体物理伤害', () => {
  assert.equal(skill('normal-profession-2').implementation.effectType, 'damage');
  assert.equal(effectOf(skill('normal-profession-2')).type, 'damage');
  assert.equal(effectOf(skill('normal-profession-2')).damageType, 'physical');
});

test('重击 / 无畏 / 弱点洞悉 提供战斗开始的永久属性', () => {
  assert.equal(effectOf(skill('322060171')).statType, 'damage-bonus');
  assert.equal(effectOf(skill('322060171')).magnitude, 0.05);
  assert.equal(skill('322060171').implementation.triggers[0].oncePerBattle, true);

  assert.equal(effectOf(skill('322060172')).statType, 'attack-percent');
  assert.equal(effectOf(skill('322060172')).magnitude, 0.05);

  const insight = skill('322060173').implementation;
  assert.deepEqual(insight.effects.map((e) => e.effect.statType), ['ignore-defense', 'hit-rate']);
  assert.deepEqual(insight.effects.map((e) => e.effect.magnitude), [0.05, 0.1]);
  assert.equal(insight.triggers.length, 2);
});

test('会心一击 / 割魂厄鬼 的触发次数与数值', () => {
  const precision = skill('322060174').implementation;
  assert.deepEqual(precision.effects.map((e) => e.effect.statType), ['ignore-defense', 'damage-bonus']);
  assert.deepEqual(precision.effects.map((e) => e.effect.magnitude), [0.05, 0.05]);
  assert.equal(precision.triggers.length, 4, '普攻与绝招各两条');
  assert.equal(precision.triggers.every((t) => t.effect.effect.magnitude === 0.05), true);

  const reaper = skill('322060175').implementation;
  assert.deepEqual(reaper.effects.map((e) => e.effect.statType), ['crit-rate', 'crit-damage']);
  assert.deepEqual(reaper.effects.map((e) => e.effect.magnitude), [0.15, 0.2]);
  assert.equal(reaper.triggers.length, 2);
  for (const trigger of reaper.triggers) {
    assert.equal(trigger.triggerType, 'on-ultimate-use');
    assert.equal(trigger.maxTriggers, 3, '前 3 次终结技');
  }
});

test('无限瞬杀 6202060112 以一次 50% 攻击力的追击近似', () => {
  const impl = skill('6202060112').implementation;
  assert.equal(impl.requiresInvestigation, true);
  assert.match(impl.notes, /unlimited/i);
  assert.equal(impl.effectType, 'damage');
  assert.equal(impl.targetType, 'single');
  assert.equal(effectOf(skill('6202060112')).type, 'damage');
  assert.equal(effectOf(skill('6202060112')).damageType, 'physical');
  assert.equal(effectOf(skill('6202060112')).multiplier, 0.5);
  assert.equal(impl.triggers.length, 1);
  assert.equal(impl.triggers[0].triggerType, 'on-ultimate-use');
  assert.equal(impl.triggers[0].effect.effect.multiplier, 0.5);
});

test('共享被动数值与触发条件符合目录描述', () => {
  assert.equal(effectOf(skill('120001026')).type, 'energy');
  assert.equal(effectOf(skill('120001026')).magnitude, 600);
  assert.equal(skill('120001026').implementation.triggers[0].triggerType, 'on-round-start');

  assert.equal(effectOf(skill('120000019')).statType, 'damage-bonus');
  assert.equal(effectOf(skill('120000019')).magnitude, 0.3);

  const rage = skill('120000023').implementation;
  assert.equal(rage.triggers.length, 2);
  for (const trigger of rage.triggers) {
    assert.equal(trigger.effect.effect.magnitude, 100);
  }

  const guard = skill('120000025').implementation;
  assert.equal(effectOf(skill('120000025')).statType, 'crit-resistance');
  assert.equal(effectOf(skill('120000025')).magnitude, 0.3);
  assert.ok(guard.triggers.some((t) => t.triggerType === 'on-buff-gain'));

  assert.equal(skill('120000028').implementation.triggers[0].conditionKey, 'hp-above-50');
  assert.equal(effectOf(skill('120000028')).statType, 'hit-rate');
  assert.equal(effectOf(skill('120000028')).magnitude, 0.15);

  assert.equal(skill('120001004').implementation.triggers[0].oncePerBattle, true);
  assert.equal(effectOf(skill('120001004')).statType, 'crit-rate');
  assert.equal(effectOf(skill('120001004')).magnitude, 1);

  assert.equal(skill('120001011').implementation.triggers[0].conditionKey, 'hp-above-70');
  assert.equal(effectOf(skill('120001011')).statType, 'attack-percent');
  assert.equal(effectOf(skill('120001011')).magnitude, 0.05);
});

test('战斗开始时注册全部 20 条被动/专精触发', () => {
  const unit = hero();
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 20);
  const kinds = new Set(unit.triggers.map((t) => t.triggerType));
  for (const expected of ['on-round-start', 'on-attack', 'on-skill-use', 'on-ultimate-use', 'on-buff-gain']) {
    assert.ok(kinds.has(expected), `missing trigger kind ${expected}`);
  }
});

test('EffectExecutor 实际执行伤害、追击、能量与属性增益', () => {
  const exec = createExecutor();
  const unit = hero();
  const foe = enemy();

  const damage = exec.executeEffect(effectOf(skill('normal-profession-2')), unit, foe);
  assert.equal(damage.type, 'damage');
  assert.ok(damage.value >= 1 && damage.value < 100);

  const followUpTarget = enemy();
  const followUp = exec.executeEffect(effectOf(skill('6202060112')), unit, followUpTarget);
  assert.equal(followUp.type, 'damage');
  assert.ok(followUp.value >= 1, 'follow-up damage should still be meaningful');

  const energy = exec.executeEffect(effectOf(skill('120001026')), unit, unit);
  assert.equal(energy.newEnergy, 600);

  const buffed = hero();
  exec.executeEffect(effectOf(skill('322060172')), unit, buffed);
  assert.equal(buffed.buffs[0].statType, 'attack-percent');
  assert.equal(buffed.buffs[0].magnitude, 0.05);

  const guardTarget = hero();
  exec.executeEffect(effectOf(skill('120000025')), unit, guardTarget);
  assert.equal(guardTarget.buffs[0].statType, 'crit-resistance');
});

