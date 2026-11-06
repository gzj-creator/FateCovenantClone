import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';

const HERO_ID = 1030201;

test('hero 1030201 skills are loaded from skill database', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.ok(Array.isArray(skills) && skills.length > 0, 'skills should load');
  assert.ok(skills.length >= 10, 'expected at least 10 skills for 银爵艾伦');
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

test('6910001004 ultimate has a damage effect', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  const skill = skills.find(s => s.id === '6910001004');
  if (skill && skill.implementation && skill.implementation.effects && skill.implementation.effects.length > 0) {
    assert.equal(skill.implementation.effects[0].effect.type, 'damage');
  } else {
    assert.ok(true, 'ultimate skill may not have implementation yet');
  }
});

// ---------------------------------------------------------------------------
// 特色技能（Mastery）实现细节
// 期望值全部取自 personal-server/config/skill-database.json 当前数据
// ---------------------------------------------------------------------------

test('hero 1030201 exposes exactly 14 skills including 5 mastery skills', () => {
  const db = loadSkillDatabase();
  const skills = getHeroSkills(HERO_ID, db);
  assert.equal(skills.length, 14);
  const mastery = skills.filter(s => s.type === 'Mastery');
  assert.equal(mastery.length, 5);
  assert.deepEqual(mastery.map(s => s.id), ['313020171', '313020172', '313020173', '313020174', '313020175']);
});

test('不屈 (313020171) registers on-round-start damage-reduction 0.05', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '313020171');
  const eff = skill.implementation.effects[0];
  const trig = skill.implementation.triggers[0];
  assert.equal(eff.target.targetType, 'self');
  assert.equal(eff.effect.type, 'stat-modifier');
  assert.equal(eff.effect.statType, 'damage-reduction');
  assert.equal(eff.effect.magnitude, 0.05);
  assert.equal(eff.duration.durationType, 'permanent');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'damage-reduction');
});

test('健壮 (313020172) registers on-round-start max-hp-percent 0.05', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '313020172');
  const trig = skill.implementation.triggers[0];
  assert.equal(skill.implementation.effects[0].target.targetType, 'self');
  assert.equal(trig.triggerType, 'on-round-start');
  assert.equal(trig.oncePerBattle, true);
  assert.equal(trig.effect.effect.statType, 'max-hp-percent');
  assert.equal(trig.effect.effect.magnitude, 0.05);
});

test('超群技艺 (313020173) registers status-hit and status-resist 0.10', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '313020173');
  assert.equal(skill.implementation.effects.length, 2);
  assert.equal(skill.implementation.triggers.length, 2);
  assert.deepEqual(skill.implementation.effects.map(e => e.effect.statType), ['status-hit', 'status-resist']);
  assert.deepEqual(skill.implementation.effects.map(e => e.effect.magnitude), [0.1, 0.1]);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.triggerType, 'on-round-start');
    assert.equal(t.oncePerBattle, true);
  }
});

test('慑魂奇招 (313020174) applies frightened for 2 rounds after normal/skill', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '313020174');
  const eff = skill.implementation.effects[0];
  assert.equal(eff.target.targetType, 'single');
  assert.equal(eff.effect.type, 'status');
  assert.equal(eff.effect.statusType, 'frightened');
  assert.equal(eff.effect.duration, 2);
  assert.equal(eff.duration.durationType, 'timed');
  assert.equal(eff.duration.rounds, 2);
  assert.deepEqual(skill.implementation.triggers.map(t => t.triggerType), ['on-attack', 'on-skill-use']);
  for (const t of skill.implementation.triggers) {
    assert.equal(t.effect.chance, 1);
    assert.equal(t.effect.effect.statusType, 'frightened');
  }
});

test('定制策略 (313020175) applies frightened on ultimate use and is marked requiresInvestigation', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '313020175');
  const eff = skill.implementation.effects[0];
  const trig = skill.implementation.triggers[0];
  assert.equal(skill.implementation.requiresInvestigation, true);
  assert.equal(trig.triggerType, 'on-ultimate-use');
  assert.equal(eff.effect.type, 'status');
  assert.equal(eff.effect.statusType, 'frightened');
  assert.equal(eff.effect.sourceSkill, '313020175');
  assert.equal(eff.duration.rounds, 2);
  // 数据库把“敌方前排攻击最高单位”近似为单个目标（前排最前一名），此处如实断言该近似值
  assert.equal(eff.target.targetType, 'single');
});

test('mastery skills contribute 7 of the 15 registered triggers for hero 1030201', () => {
  const db = loadSkillDatabase();
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 190, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  registerPassiveTriggers(unit, db, { seed: 1 });
  assert.equal(unit.triggers.length, 15);
  const mastery = unit.triggers.filter(t => t.sourceSkill.startsWith('313'));
  assert.equal(mastery.length, 7);
  assert.deepEqual(
    [...new Set(mastery.map(t => t.sourceSkill))].sort(),
    ['313020171', '313020172', '313020173', '313020174', '313020175']
  );
});

test('frightened from 慑魂奇招 is stored as a 2-round debuff by EffectExecutor', () => {
  const db = loadSkillDatabase();
  const effect = getHeroSkills(HERO_ID, db).find(s => s.id === '313020174').implementation.effects[0].effect;
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 190, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const target = { id: 9201, team: 2, loc: 1, hp: 900, maxHp: 900, attack: 150, defense: 50, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const result = executor.executeStatus(effect, actor, target);
  assert.equal(result.type, 'status');
  assert.equal(result.statusType, 'frightened');
  assert.equal(result.duration, 2);
  assert.equal(target.debuffs.length, 1);
  assert.equal(target.debuffs[0].type, 'frightened');
  assert.equal(target.debuffs[0].sourceSkill, '313020174');
  assert.equal(target.buffs.length, 0);
});

test('健壮 max-hp-percent is applied as a self buff by EffectExecutor', () => {
  const db = loadSkillDatabase();
  const effect = getHeroSkills(HERO_ID, db).find(s => s.id === '313020172').implementation.effects[0].effect;
  const executor = new EffectExecutor({ random: () => 0.5 });
  const unit = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 190, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
  const result = executor.executeStatModifier(effect, unit, unit);
  assert.equal(result.statType, 'max-hp-percent');
  assert.equal(unit.buffs.length, 1);
  assert.equal(unit.buffs[0].statType, 'max-hp-percent');
  assert.equal(unit.buffs[0].magnitude, 0.05);
  assert.equal(unit.debuffs.length, 0);
});

test('ultimate 6910001004 is marked requiresInvestigation and deals 2x attack damage', () => {
  const db = loadSkillDatabase();
  const skill = getHeroSkills(HERO_ID, db).find(s => s.id === '6910001004');
  const effect = skill.implementation.effects[0].effect;
  assert.equal(skill.implementation.requiresInvestigation, true);
  assert.equal(effect.type, 'damage');
  assert.equal(effect.multiplier, 2);
  const executor = new EffectExecutor({ random: () => 0.5 });
  const actor = { id: HERO_ID, team: 1, loc: 1, hp: 1260, maxHp: 1260, attack: 200, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, critChance: 0 };
  const target = { id: 9202, team: 2, loc: 1, hp: 1000, maxHp: 1000, attack: 100, defense: 100, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0, energy: 0 };
  const result = executor.executeDamage(effect, actor, target);
  assert.equal(result.crit, false);
  assert.equal(result.value, 355, 'attack 200 * 2 minus defense 100 * 0.45 at neutral variance');
  assert.equal(result.newHp, 645);
});
