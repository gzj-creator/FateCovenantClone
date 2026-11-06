/**
 * Read-only audit for hero skill database (2026-11-05 review).
 * Prints structural problems grouped by category. Does not write anything.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGET_TYPES, DURATION_TYPES, TRIGGER_TYPES, STAT_TYPES } from '../game/effects/effect-types.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/skill-database.json'), 'utf8'));

const EXCLUDED = new Set(['1020401','1020501','1030101','1030301','1030501','1030601','2020501','2020601','3020101','3020301','3020401','2030201','2040201','3020201','3030201','5040301','5040601','5040701','4030101','4030601']);
const TARGETS = new Set(Object.values(TARGET_TYPES));
const DURATIONS = new Set(Object.values(DURATION_TYPES));
const TRIGGERS = new Set(Object.values(TRIGGER_TYPES));
const STATS = new Set(Object.values(STAT_TYPES));
const EFFECT_TYPES = new Set(['damage','heal','shield','stat-modifier','energy','status','dispel']);

const findings = { tidMismatch: [], noEffectType: [], emptyEffects: [], noImplementation: [], badTarget: [], badDuration: [], badTrigger: [], badStat: [], normalNoDamage: [], missingFields: [], triggerTypeMismatch: [] };

const onlyScoped = !process.argv.includes('--all');

for (const hero of db.heroes) {
  const heroId = String(hero.id);
  const excluded = EXCLUDED.has(heroId);
  if (onlyScoped && excluded) continue;
  for (const skill of hero.skills) {
    const impl = skill.implementation;
    const where = { heroId, hero: hero.name, skillId: skill.id, name: skill.name, type: skill.type, excluded };
    if (!impl) { findings.noImplementation.push(where); continue; }
    if (/^\d+$/.test(String(skill.id))) {
      if (impl.ability && impl.ability.tid !== undefined && String(impl.ability.tid) !== String(skill.id)) {
        findings.tidMismatch.push({ ...where, field: 'ability.tid', got: impl.ability.tid });
      }
      if (impl.abilityDes && impl.abilityDes.tid !== undefined && String(impl.abilityDes.tid) !== String(skill.id)) {
        findings.tidMismatch.push({ ...where, field: 'abilityDes.tid', got: impl.abilityDes.tid });
      }
    }
    const effects = impl.effects;
    if (!impl.effectType && Array.isArray(effects) && effects.length > 0) findings.noEffectType.push(where);
    if (!Array.isArray(effects) || effects.length === 0) findings.emptyEffects.push({ ...where, has: Array.isArray(effects) ? 0 : 'missing' });
    if (impl.effectType && Array.isArray(effects) && effects.length > 0 && effects[0]?.effect?.type && impl.effectType !== effects[0].effect.type) {
      findings.missingFields.push({ ...where, field: 'effectType!=effects[0].type', got: impl.effectType + '/' + effects[0].effect.type });
    }
    const checkWrap = (wrap, label) => {
      if (!wrap) return;
      const t = wrap.target && wrap.target.targetType;
      if (!TARGETS.has(t)) findings.badTarget.push({ ...where, label, targetType: t });
      const d = wrap.duration;
      if (d && !DURATIONS.has(d.durationType)) findings.badDuration.push({ ...where, label, durationType: d.durationType });
      if (d && d.durationType === 'timed' && !(d.rounds > 0)) findings.badDuration.push({ ...where, label, note: 'timed rounds<=0', rounds: d.rounds });
      const e = wrap.effect;
      if (e && !EFFECT_TYPES.has(e.type)) findings.badTrigger.push({ ...where, label, note: 'bad effect.type', got: e.type });
      if (e && e.type === 'stat-modifier' && !STATS.has(e.statType)) findings.badStat.push({ ...where, label, statType: e.statType });
    };
    if (Array.isArray(effects)) effects.forEach((w, i) => checkWrap(w, 'effects[' + i + ']'));
    if (Array.isArray(impl.triggers)) impl.triggers.forEach((t, i) => {
      if (!TRIGGERS.has(t.triggerType)) findings.badTrigger.push({ ...where, label: 'triggers[' + i + ']', note: 'bad triggerType', got: t.triggerType });
      checkWrap(t.effect, 'triggers[' + i + ']');
    });
    if (skill.type === 'Normal' && Array.isArray(effects) && !effects.some(w => w.effect && w.effect.type === 'damage')) findings.normalNoDamage.push(where);
  }
}

for (const [k, v] of Object.entries(findings)) {
  console.log('## ' + k + ' : ' + v.length);
  for (const item of v) {
    const extra = Object.entries(item).filter(([kk]) => !['heroId','hero','skillId','name','type','excluded','label'].includes(kk)).map(([kk, vv]) => kk + '=' + JSON.stringify(vv)).join(' ');
    console.log('   ' + item.heroId + '/' + item.skillId + ' ' + (item.name||'') + (item.label ? ' ' + item.label : '') + ' ' + extra);
  }
}
