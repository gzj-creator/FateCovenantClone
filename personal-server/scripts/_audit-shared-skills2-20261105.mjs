/**
 * Read-only audit #2: semantic comparison of shared skill ids across heroes.
 * Canonicalises each implementation (ignoring notes/metadata/cosmetic keys) and
 * reports groups where the semantics actually differ.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/skill-database.json'), 'utf8'));
const EXCLUDED = new Set(['1020401','1020501','1030101','1030301','1030501','1030601','2020501','2020601','3020101','3020301','3020401','2030201','2040201','3020201','3030201','5040301','5040601','5040701','4030101','4030601']);

const num = v => (typeof v === 'number' ? v : undefined);
function canonEffect(effect) {
  if (!effect) return null;
  const out = { type: effect.type };
  for (const key of ['damageType', 'statType', 'healType', 'shieldType', 'energyType', 'statusType']) {
    if (effect[key] !== undefined) out[key] = effect[key];
  }
  for (const key of ['magnitude', 'multiplier', 'isPercentage', 'count', 'removeType', 'tickInterval']) {
    if (effect[key] !== undefined) out[key] = effect[key];
  }
  return out;
}
function canonWrap(wrap) {
  if (!wrap) return null;
  return {
    target: wrap.target && wrap.target.targetType,
    duration: wrap.duration && wrap.duration.durationType,
    rounds: wrap.duration ? num(wrap.duration.rounds) : undefined,
    chance: wrap.chance === undefined ? 1 : wrap.chance,
    effect: canonEffect(wrap.effect),
  };
}
function canonImpl(impl) {
  if (!impl) return 'none';
  return JSON.stringify({
    effectType: impl.effectType,
    targetType: impl.targetType,
    energyCost: impl.energyCost,
    effects: (impl.effects || []).map(canonWrap),
    triggers: (impl.triggers || []).map(t => ({
      triggerType: t.triggerType,
      conditionKey: t.conditionKey || null,
      maxTriggers: t.maxTriggers || 0,
      oncePerBattle: !!t.oncePerBattle,
      oncePerRound: !!t.oncePerRound,
      cooldown: t.cooldown || 0,
      effect: canonWrap(t.effect),
    })),
  });
}

const groups = new Map();
for (const hero of db.heroes) {
  for (const skill of hero.skills) {
    if (!groups.has(skill.id)) groups.set(skill.id, []);
    groups.get(skill.id).push({ heroId: String(hero.id), hero: hero.name, skill });
  }
}

let count = 0;
for (const [id, entries] of groups) {
  if (entries.length < 2) continue;
  const variants = new Map();
  for (const e of entries) {
    const key = canonImpl(e.skill.implementation);
    if (!variants.has(key)) variants.set(key, []);
    variants.get(key).push(e.heroId);
  }
  if (variants.size === 1) continue;
  count++;
  const scoped = entries.filter(e => !EXCLUDED.has(e.heroId)).map(e => e.heroId);
  const excl = entries.filter(e => EXCLUDED.has(e.heroId)).map(e => e.heroId);
  console.log('\n### ' + id + ' ' + entries[0].skill.name + ' | desc: ' + (entries[0].skill.description || '').slice(0, 80));
  console.log('    in-scope: ' + scoped.join(','), excl.length ? '| excluded: ' + excl.join(',') : '');
  let i = 0;
  for (const [key, heroes] of variants) {
    console.log('    v' + (i++) + ' [' + heroes.join(',') + '] ' + key);
  }
}
console.log('\nsemantic divergence groups: ' + count);
