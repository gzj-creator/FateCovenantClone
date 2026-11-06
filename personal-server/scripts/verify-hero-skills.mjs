import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DAMAGE_TYPES, HEAL_TYPES, SHIELD_TYPES, STAT_TYPES, ENERGY_TYPES,
  STATUS_TYPES, TARGET_TYPES, DURATION_TYPES, TRIGGER_TYPES,
} from '../game/effects/effect-types.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../config/skill-database.json');
const args = process.argv.slice(2);
const heroFilter = args.find(arg => arg.startsWith('--hero='))?.split('=')[1];
const asJson = args.includes('--json');

const values = object => new Set(Object.values(object));
const EFFECT_TYPES = new Set(['damage', 'heal', 'shield', 'stat-modifier', 'energy', 'status', 'dispel']);
const TARGETS = values(TARGET_TYPES);
const DURATIONS = values(DURATION_TYPES);
const TRIGGERS = values(TRIGGER_TYPES);

function checkEffect(effectWrapper, where, problems) {
  if (!effectWrapper || typeof effectWrapper !== 'object') {
    problems.push(`${where}: effect entry is not an object`);
    return;
  }
  const target = effectWrapper.target;
  if (!target || !TARGETS.has(target.targetType)) {
    problems.push(`${where}: invalid target.targetType ${String(target && target.targetType)}`);
  }
  const duration = effectWrapper.duration;
  if (!duration || !DURATIONS.has(duration.durationType)) {
    problems.push(`${where}: invalid duration.durationType ${String(duration && duration.durationType)}`);
  }
  if (duration && duration.durationType === 'timed' && !(duration.rounds > 0)) {
    problems.push(`${where}: timed duration needs rounds > 0`);
  }
  if (effectWrapper.chance !== undefined && !(effectWrapper.chance > 0 && effectWrapper.chance <= 1)) {
    problems.push(`${where}: chance must be in (0,1]`);
  }
  const effect = effectWrapper.effect;
  if (!effect || !EFFECT_TYPES.has(effect.type)) {
    problems.push(`${where}: invalid effect.type ${String(effect && effect.type)}`);
    return;
  }
  switch (effect.type) {
    case 'damage':
      if (!values(DAMAGE_TYPES).has(effect.damageType)) problems.push(`${where}: invalid damageType ${String(effect.damageType)}`);
      if (!(effect.multiplier > 0) && !(effect.magnitude > 0)) problems.push(`${where}: damage needs multiplier or magnitude > 0`);
      break;
    case 'heal':
      if (!values(HEAL_TYPES).has(effect.healType)) problems.push(`${where}: invalid healType ${String(effect.healType)}`);
      if (!(effect.multiplier > 0) && !(effect.magnitude > 0)) problems.push(`${where}: heal needs multiplier or magnitude > 0`);
      break;
    case 'shield':
      if (!values(SHIELD_TYPES).has(effect.shieldType)) problems.push(`${where}: invalid shieldType ${String(effect.shieldType)}`);
      if (!(effect.multiplier > 0) && !(effect.magnitude > 0)) problems.push(`${where}: shield needs multiplier or magnitude > 0`);
      break;
    case 'stat-modifier':
      if (!values(STAT_TYPES).has(effect.statType)) problems.push(`${where}: invalid statType ${String(effect.statType)}`);
      if (typeof effect.magnitude !== 'number' || !Number.isFinite(effect.magnitude) || effect.magnitude === 0) {
        problems.push(`${where}: stat-modifier needs non-zero magnitude`);
      }
      if (typeof effect.isPercentage !== 'boolean') problems.push(`${where}: stat-modifier needs boolean isPercentage`);
      break;
    case 'energy':
      if (!values(ENERGY_TYPES).has(effect.energyType)) problems.push(`${where}: invalid energyType ${String(effect.energyType)}`);
      if (typeof effect.magnitude !== 'number' || !(effect.magnitude > 0)) problems.push(`${where}: energy needs magnitude > 0`);
      break;
    case 'status':
      if (!values(STATUS_TYPES).has(effect.statusType)) problems.push(`${where}: invalid statusType ${String(effect.statusType)}`);
      break;
    case 'dispel':
      break;
  }
}

function checkTrigger(trigger, where, problems) {
  if (!trigger || typeof trigger !== 'object') {
    problems.push(`${where}: trigger is not an object`);
    return;
  }
  if (!TRIGGERS.has(trigger.triggerType)) problems.push(`${where}: invalid triggerType ${String(trigger.triggerType)}`);
  checkEffect(trigger.effect, `${where} effect`, problems);
  if (trigger.oncePerBattle && trigger.oncePerRound) problems.push(`${where}: oncePerBattle and oncePerRound are both true`);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const report = [];

for (const hero of db.heroes) {
  if (heroFilter && String(hero.id) !== heroFilter) continue;
  const problems = [];
  for (const skill of hero.skills) {
    const where = `${hero.id}/${skill.id} ${skill.name || ''}`.trim();
    const impl = skill.implementation;
    if (!impl || typeof impl !== 'object') {
      problems.push(`${where}: missing implementation`);
      continue;
    }
    if (!impl.effectType) problems.push(`${where}: missing effectType`);
    if (!Array.isArray(impl.effects) || impl.effects.length === 0) problems.push(`${where}: missing effects[]`);
    else impl.effects.forEach((entry, index) => checkEffect(entry, `${where} effects[${index}]`, problems));
    if (Array.isArray(impl.triggers)) impl.triggers.forEach((trigger, index) => checkTrigger(trigger, `${where} triggers[${index}]`, problems));
    if (skill.type === 'Normal') {
      const hasDamage = (impl.effects || []).some(entry => entry.effect && entry.effect.type === 'damage');
      if (!hasDamage) problems.push(`${where}: normal attack has no damage effect`);
    }
  }
  report.push({ heroId: hero.id, name: hero.name, skills: hero.skills.length, problems });
}

const failing = report.filter(entry => entry.problems.length > 0);
if (asJson) {
  console.log(JSON.stringify({ heroes: report.length, failing: failing.length, report }, null, 2));
} else {
  for (const entry of report) {
    if (entry.problems.length === 0) continue;
    console.log(`\n${entry.heroId} ${entry.name} (${entry.problems.length} problems)`);
    for (const problem of entry.problems) console.log(`  - ${problem}`);
  }
  console.log(`\n${report.length - failing.length}/${report.length} heroes clean, ${failing.length} failing`);
}
process.exit(failing.length ? 1 : 0);
