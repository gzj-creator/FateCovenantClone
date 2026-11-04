import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../config/skill-database.json', import.meta.url));
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const hero = db.heroes.find(h => h.id === 2040201);
if (!hero) { console.error('hero not found'); process.exit(1); }

const eff = (targetType, type, extra = {}, duration = { durationType: 'instant', rounds: 0 }) => ({
  target: { targetType },
  effect: Object.assign({ type }, extra),
  duration,
  chance: 1,
});

const trig = (triggerType, effectObj, opts = {}) => ({
  triggerType,
  condition: null,
  conditionKey: opts.conditionKey || null,
  cooldown: 0,
  maxTriggers: opts.maxTriggers || 0,
  oncePerBattle: !!opts.oncePerBattle,
  oncePerRound: !!opts.oncePerRound,
  effect: JSON.parse(JSON.stringify(effectObj)),
  priority: 0,
  chance: opts.chance !== undefined ? opts.chance : 1,
});

function setSkill(id, patch) {
  const s = hero.skills.find(x => x.id === id);
  if (!s) { console.warn('skill not found', id); return; }
  Object.assign(s.implementation, patch);
}

// normal attack fallback
{
  const e = eff('single', 'damage', { damageType: 'physical', multiplier: 1, variance: 1, canCrit: true });
  setSkill('normal-profession-2', {
    effectType: 'damage', targetType: 'single', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [],
    notes: 'Project fallback basic attack (damage 1.0x single).',
  });
}

// Ultimate 捣蛋到底
{
  const e1 = eff('all-enemies', 'damage', { damageType: 'magical', multiplier: 1.3, canCrit: true });
  const e2 = eff('random', 'damage', { damageType: 'magical', multiplier: 0.6, canCrit: true });
  setSkill('2204020123', {
    effectType: 'damage', targetType: 'all-enemies', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e1)), JSON.parse(JSON.stringify(e2))],
    triggers: [],
    requiresInvestigation: true,
    notes: 'Ultimate: 130% magical damage to all enemies; consume all candy layers, each dealing 60% magical damage to a random unit. Candy (给了糖也捣蛋) layer scaling and per-layer application require engine integration (requiresInvestigation). Tianji cost 3.',
  });
}

// 324020171 糖果礼花
{
  const eCandy = eff('all-enemies', 'damage', { damageType: 'magical', damageType2: 'percent-max-hp' }, { durationType: 'instant', rounds: 0 });
  // use percent-max-hp via damageType field expected by executor: damageType='percent-max-hp'
  const e1 = { target: { targetType: 'all-enemies' }, effect: { type: 'damage', damageType: 'percent-max-hp', magnitude: 0.04, canCrit: true }, duration: { durationType: 'instant', rounds: 0 }, chance: 1 };
  const e2 = eff('self', 'energy', { energyType: 'gain', magnitude: 400 });
  const t1 = trig('on-ultimate-use', e1, { oncePerBattle: false });
  const t2 = trig('on-attack', e2, { oncePerBattle: false });
  setSkill('324020171', {
    effectType: 'damage', targetType: 'all-enemies', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e1)), JSON.parse(JSON.stringify(e2))],
    triggers: [t1, t2],
    requiresInvestigation: true,
    notes: 'Mastery: on ultimate, each candy deals extra 4% target max HP magical damage (cap 80% attack, not enforced); after self normal, +400 energy. Candy count scaling requires investigation.',
  });
}

// 324020172 活力全开
{
  const eTianji = eff('random', 'energy', { energyType: 'loss', magnitude: 100 });
  const eDmg = eff('self', 'stat-modifier', { statType: 'damage-bonus', magnitude: 0.10, isPercentage: true }, { durationType: 'timed', rounds: 1 });
  // add maxStacks to stat-modifier effect
  eDmg.effect.maxStacks = 3;
  const t1 = trig('on-ultimate-use', eTianji, { oncePerRound: true, maxTriggers: 1 });
  const t2 = trig('on-ultimate-use', eDmg, { oncePerRound: false, maxTriggers: 0 });
  setSkill('324020172', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(eTianji)), JSON.parse(JSON.stringify(eDmg))],
    triggers: [t1, t2],
    requiresInvestigation: true,
    notes: 'Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approx -100 energy); after self ultimate +10% final damage (max +30%), removed end of round. Tianji mapping requires investigation.',
  });
}

// 324020173 送别礼物
{
  setSkill('324020173', {
    effectType: 'damage', targetType: 'all-enemies', energyCost: 0,
    effects: [],
    triggers: [],
    requiresInvestigation: true,
    notes: 'Mastery: after self action round ends, extra ultimate once, and before that ultimate destroy 20% shield of all enemies. Extra action + shield destroy require engine integration (requiresInvestigation).',
  });
}

// 324020174 闪亮登场
{
  const eEnergy1 = eff('self', 'energy', { energyType: 'gain', magnitude: 100 });
  const eEnergy2 = eff('self', 'energy', { energyType: 'gain', magnitude: 100 });
  const eDebuff = eff('single', 'stat-modifier', { statType: 'damage-reduction', magnitude: -0.15, isPercentage: true }, { durationType: 'timed', rounds: 2 });
  eDebuff.effect.maxStacks = 4;
  const t1 = trig('on-attack', eEnergy1, {});
  const t2 = trig('on-skill-use', eEnergy2, {});
  const t3 = trig('on-ultimate-use', eDebuff, {});
  setSkill('324020174', {
    effectType: 'energy', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(eEnergy1)), JSON.parse(JSON.stringify(eEnergy2)), JSON.parse(JSON.stringify(eDebuff))],
    triggers: [t1, t2, t3],
    requiresInvestigation: true,
    notes: 'Mastery: every round normal/skill grants +1 Tianji (approx +100 energy); after self ultimate, target final damage reduction -15% (max -60%), 2 rounds. Tianji mapping requires investigation.',
  });
}

// 324020175 完美恶作剧
{
  const eCrit = eff('self', 'stat-modifier', { statType: 'crit-rate', magnitude: 0.60, isPercentage: true }, { durationType: 'timed', rounds: 1 });
  const eIgnore = eff('self', 'stat-modifier', { statType: 'ignore-defense', magnitude: 0.60, isPercentage: true }, { durationType: 'timed', rounds: 1 });
  const t1 = trig('on-ultimate-use', eCrit, { oncePerRound: true, maxTriggers: 1 });
  const t2 = trig('on-ultimate-use', eIgnore, { oncePerRound: true, maxTriggers: 1 });
  setSkill('324020175', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(eCrit)), JSON.parse(JSON.stringify(eIgnore))],
    triggers: [t1, t2],
    requiresInvestigation: true,
    notes: 'Mastery: first ultimate and first Tianji each round: +60% final crit and ignore 60% defense. First-use-per-round tracking requires investigation.',
  });
}

// 120001026 突破4
{
  const e = eff('self', 'energy', { energyType: 'gain', magnitude: 600 });
  const t = trig('on-round-start', e, { oncePerBattle: true, maxTriggers: 1 });
  setSkill('120001026', {
    effectType: 'energy', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t],
    notes: 'Passive: initial energy +600.',
  });
}

// 120000001 狂怒
{
  const e = eff('self', 'stat-modifier', { statType: 'crit-rate', magnitude: 0.15, isPercentage: true }, { durationType: 'permanent', rounds: 0 });
  const t = trig('on-ultimate-use', e, {});
  setSkill('120000001', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t],
    notes: 'Passive: on ultimate, crit rate +15%.',
  });
}

// 120000006 勃发
{
  const e = eff('self', 'stat-modifier', { statType: 'crit-damage', magnitude: 0.20, isPercentage: true }, { durationType: 'permanent', rounds: 0 });
  const t = trig('on-round-start', e, { conditionKey: 'hp-above-50', oncePerBattle: false, maxTriggers: 0 });
  setSkill('120000006', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t],
    notes: 'Passive: when HP > 50%, crit damage +20%.',
  });
}

// 120000009 鼓舞
{
  const e = eff('self', 'energy', { energyType: 'gain', magnitude: 25 });
  const t1 = trig('on-attack', e, {});
  const t2 = trig('on-skill-use', e, {});
  setSkill('120000009', {
    effectType: 'energy', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t1, t2],
    notes: 'Passive: on ally normal/skill, self +25 energy (approximated as self trigger; ally condition requires investigation).',
    requiresInvestigation: true,
  });
}

// 120000014 格挡
{
  const e = eff('self', 'stat-modifier', { statType: 'damage-reduction', magnitude: 0.20, isPercentage: true }, { durationType: 'permanent', rounds: 0 });
  const t = trig('on-round-start', e, { oncePerBattle: true, maxTriggers: 1 });
  setSkill('120000014', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t],
    notes: 'Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction).',
    requiresInvestigation: true,
  });
}

// 120000015 标记
{
  const e = eff('self', 'stat-modifier', { statType: 'crit-rate', magnitude: 0.25, isPercentage: true }, { durationType: 'permanent', rounds: 0 });
  const t = trig('on-attack', e, { conditionKey: 'target-has-debuff' });
  setSkill('120000015', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t],
    notes: 'Passive: attacking debuffed target, crit rate +25%.',
  });
}

// 120001004 爆裂一击
{
  const e = eff('self', 'stat-modifier', { statType: 'crit-rate', magnitude: 1.0, isPercentage: true }, { durationType: 'permanent', rounds: 0 });
  const t = trig('on-ultimate-use', e, { oncePerBattle: true, maxTriggers: 1 });
  setSkill('120001004', {
    effectType: 'stat-modifier', targetType: 'self', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [t],
    notes: 'Passive: first ultimate, crit rate +100%.',
  });
}

// 6910001100 metadata fallback
{
  const e = eff('single', 'damage', { damageType: 'physical', multiplier: 2.0, canCrit: true });
  setSkill('6910001100', {
    effectType: 'damage', targetType: 'single', energyCost: 0,
    effects: [JSON.parse(JSON.stringify(e))],
    triggers: [],
    requiresInvestigation: true,
    notes: 'Ultimate metadata fallback: damage 2.0x single (requiresInvestigation).',
  });
}

// candy mechanic note appended to ultimate? Already in notes. Also add a passive-style trigger? none.

fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log('done');
