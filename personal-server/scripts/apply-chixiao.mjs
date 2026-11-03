import fs from 'node:fs';
import path from 'node:path';

const DB = 'F:/projects/FateCovenantClone/personal-server/config/skill-database.json';
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const hero = db.heroes.find(h => h.id === 2040101);
if (!hero) { console.error('hero not found'); process.exit(1); }

function oldImpl(id) { return hero.skills.find(s => s.id === id).implementation; }
function base(id) {
  const impl = oldImpl(id);
  return {
    source: impl.source,
    resolvedAbility: impl.resolvedAbility,
    resolvedDescription: impl.resolvedDescription,
    ability: impl.ability,
    abilityDes: impl.abilityDes,
    catalogTypeMatch: impl.catalogTypeMatch,
  };
}
function eff(targetType, effect, duration = { durationType: 'instant', rounds: 0 }, chance = 1) {
  return { target: { targetType }, effect, duration, chance };
}
function sm(statType, magnitude, isPercentage = true) {
  return { type: 'stat-modifier', statType, magnitude, isPercentage };
}
function dmg(damageType, multiplier, canCrit = true) {
  return { type: 'damage', damageType, multiplier, canCrit };
}
function energy(energyType, magnitude) {
  return { type: 'energy', energyType, magnitude };
}
function status(statusType, maxStacks = 0, duration = { durationType: 'timed', rounds: 99 }) {
  return { type: 'status', statusType, maxStacks, duration };
}
function trig(triggerType, effect, opts = {}) {
  return {
    triggerType,
    condition: null,
    conditionKey: opts.conditionKey || null,
    cooldown: opts.cooldown || 0,
    maxTriggers: opts.maxTriggers || 0,
    oncePerBattle: !!opts.oncePerBattle,
    oncePerRound: !!opts.oncePerRound,
    effect: { target: effect.target, effect: effect.effect, duration: effect.duration, chance: effect.chance },
    priority: opts.priority || 0,
    chance: opts.chance || 1,
  };
}
// helper to build effect object with target
function E(targetType, effect, duration, chance = 1) {
  return { target: { targetType }, effect, duration, chance };
}

const impls = {};

// normal fallback
impls['normal-profession-2'] = {
  fallback: true,
  source: 'project-fallback',
  resolvedAbility: false,
  resolvedDescription: false,
  ability: null,
  abilityDes: null,
  effectType: 'damage',
  targetType: 'single',
  energyCost: 0,
  effects: [E('single', dmg('physical', 1, true), { durationType: 'instant', rounds: 0 })],
  triggers: [],
  notes: 'Project fallback basic attack.',
};

// Ultimate: 罪业尽销
impls['2204010123'] = {
  ...base('2204010123'),
  effectType: 'damage',
  targetType: 'all-enemies',
  energyCost: 0,
  effects: [
    E('all-enemies', dmg('magical', 1.3, true), { durationType: 'instant', rounds: 0 }),
  ],
  triggers: [],
  requiresInvestigation: true,
  notes: 'Ultimate: consumes 3 Tianji (not modeled), 130% magical damage to all enemies; if target has 噬炎 (flame), adds true damage = 30% of damage taken during 噬炎 (cap 180% atk) and removes 噬炎; on kill permanently -3% atk/def per target (max 3) and +1% atk/def to all allies (max 5 battles); otherwise restores 150 energy to all allies. 噬炎 tracking, Tianji, kill branching require engine integration (requiresInvestigation).',
};

// 龙行 324010171
{
  const b = base('324010171');
  const e1 = E('self', sm('damage-bonus', 0.05), { durationType: 'permanent', rounds: 0 });
  const e2 = E('self', sm('damage-bonus', 0.60), { durationType: 'timed', rounds: 0 });
  impls['324010171'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [e1],
    triggers: [
      trig('on-round-start', e1, { oncePerBattle: true, maxTriggers: 1 }),
      trig('on-ultimate-use', e2, { maxTriggers: 2 }),
    ],
    requiresInvestigation: true,
    notes: 'Mastery: first 2 ultimates per round guaranteed crit and +60% final damage (crit guarantee not modeled; approximated as damage-bonus 0.60, maxTriggers 2); battle start final damage bonus +5%.',
  };
}

// 神罚 324010172
{
  const b = base('324010172');
  const eAtk = E('self', sm('attack-percent', 0.05), { durationType: 'permanent', rounds: 0 });
  const eEnergyLoss = E('random', energy('loss', 100), { durationType: 'instant', rounds: 0 });
  const eBurn = E('all-enemies', status('burn', 20, { durationType: 'timed', rounds: 99 }), { durationType: 'timed', rounds: 99 });
  impls['324010172'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [eAtk],
    triggers: [
      trig('on-round-start', eAtk, { oncePerBattle: true, maxTriggers: 1 }),
      trig('on-ultimate-use', eEnergyLoss, { oncePerRound: true }),
      trig('on-ultimate-use', eBurn, {}),
    ],
    requiresInvestigation: true,
    notes: 'Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approximated energy loss 100); after ultimate applies 1 layer of 噬炎 (approximated as burn status, max 20 stacks) to all enemies; battle start attack +5%. {0}/噬炎 identity and Tianji require investigation.',
  };
}

// 罪伞 324010173
{
  const b = base('324010173');
  const eCritRate = E('self', sm('crit-rate', 0.05), { durationType: 'permanent', rounds: 0 });
  const eCritDmg = E('self', sm('crit-damage', 0.10), { durationType: 'permanent', rounds: 0 });
  const eUltDmg = E('self', sm('damage-bonus', 0.60), { durationType: 'timed', rounds: 0 });
  const eUltCrit = E('self', sm('crit-rate', 1.0), { durationType: 'timed', rounds: 0 });
  impls['324010173'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [eCritRate, eCritDmg],
    triggers: [
      trig('on-round-start', eCritRate, { oncePerBattle: true, maxTriggers: 1 }),
      trig('on-round-start', eCritDmg, { oncePerBattle: true, maxTriggers: 1 }),
      trig('on-ultimate-use', eUltDmg, {}),
      trig('on-ultimate-use', eUltCrit, {}),
    ],
    requiresInvestigation: true,
    notes: 'Mastery: all ultimates/Tianji guaranteed crit and +60% final damage with no usage limit (crit guarantee approximated as crit-rate +1.0 and damage-bonus 0.60 on ultimate use); battle start crit-rate +5% and crit-damage +10%.',
  };
}

// 神降 324010174
{
  const b = base('324010174');
  const eEnergy = E('self', energy('gain', 100), { durationType: 'instant', rounds: 0 });
  const eTeamUltDmg = E('all-allies', sm('damage-bonus', 0.40), { durationType: 'permanent', rounds: 0 });
  const eNextUlt = E('self', sm('damage-bonus', 0.15), { durationType: 'timed', rounds: 2 });
  impls['324010174'] = {
    ...b,
    effectType: 'energy',
    targetType: 'self',
    energyCost: 0,
    effects: [eEnergy, eTeamUltDmg, eNextUlt],
    triggers: [
      trig('on-attack', eEnergy, {}),
      trig('on-skill-use', eEnergy, {}),
      trig('on-round-start', eTeamUltDmg, { oncePerBattle: true, maxTriggers: 1 }),
      trig('on-attack', eNextUlt, {}),
      trig('on-skill-use', eNextUlt, {}),
    ],
    requiresInvestigation: true,
    notes: 'Mastery: after normal/skill gain 1 Tianji (approx energy +100); all allies ultimate damage +40% (permanent); after normal/skill next ultimate damage +15% (approximated 2 rounds). Tianji conversion requires investigation.',
  };
}

// 业火 324010175
{
  const b = base('324010175');
  const eCritRate = E('self', sm('crit-rate', 0.10), { durationType: 'timed', rounds: 0 });
  const eCritDmg = E('self', sm('crit-damage', 0.15), { durationType: 'timed', rounds: 0 });
  impls['324010175'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [eCritRate, eCritDmg],
    triggers: [
      trig('on-ultimate-use', eCritRate, {}),
      trig('on-ultimate-use', eCritDmg, {}),
    ],
    requiresInvestigation: true,
    notes: 'Mastery: each 10% crit-rate grants +10% crit-damage and +3% ignore-defense (cap +100% crit-damage/+30% ignore-defense) requires engine scaling (requiresInvestigation); on ultimate use +10% crit-rate and +15% crit-damage.',
  };
}

// 突破6 120001028 (shared)
{
  const b = base('120001028');
  const e = E('self', energy('gain', 50), { durationType: 'instant', rounds: 0 });
  impls['120001028'] = {
    ...b,
    effectType: 'energy',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [
      trig('on-attack', e, {}),
      trig('on-skill-use', e, {}),
    ],
    requiresInvestigation: false,
    notes: 'Passive: when ally uses normal/skill, self gains 50 energy.',
  };
}

// 破盾 120000018
{
  const b = base('120000018');
  const e = E('self', sm('damage-bonus', 0.15), { durationType: 'permanent', rounds: 0 });
  impls['120000018'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [trig('on-round-start', e, { oncePerBattle: true, maxTriggers: 1 })],
    requiresInvestigation: true,
    notes: 'Passive: +15% damage to defense-type adventurers (target condition not enforced; approximated as permanent damage-bonus).',
  };
}

// 锋刃 120000019
{
  const b = base('120000019');
  const e = E('self', sm('damage-bonus', 0.30), { durationType: 'permanent', rounds: 0 });
  impls['120000019'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [trig('on-round-start', e, { oncePerBattle: true, maxTriggers: 1 })],
    requiresInvestigation: false,
    notes: 'Passive: normal/skill damage +30%.',
  };
}

// 激怒 120000023
{
  const b = base('120000023');
  const e = E('self', energy('gain', 100), { durationType: 'instant', rounds: 0 });
  impls['120000023'] = {
    ...b,
    effectType: 'energy',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [
      trig('on-attack', e, {}),
      trig('on-skill-use', e, {}),
    ],
    requiresInvestigation: false,
    notes: 'Passive: normal/skill grants +100 energy.',
  };
}

// 戒备 120000025
{
  const b = base('120000025');
  const e = E('self', sm('crit-resistance', 0.30), { durationType: 'permanent', rounds: 0 });
  impls['120000025'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [
      trig('on-round-start', e, { oncePerBattle: true, maxTriggers: 1 }),
      trig('on-buff-gain', e, {}),
    ],
    requiresInvestigation: true,
    notes: 'Passive: when self has buff, crit-resistance +30% (buff-presence condition approximated).',
  };
}

// 鹰眼 120000028
{
  const b = base('120000028');
  const e = E('self', sm('hit-rate', 0.15), { durationType: 'permanent', rounds: 0 });
  impls['120000028'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [trig('on-round-start', e, { oncePerBattle: true, maxTriggers: 1, conditionKey: 'hp-above-50' })],
    requiresInvestigation: false,
    notes: 'Passive: when HP > 50%, hit-rate +15%.',
  };
}

// 穿刺一击 120001009
{
  const b = base('120001009');
  const e = E('self', sm('ignore-defense', 0.30), { durationType: 'permanent', rounds: 0 });
  impls['120001009'] = {
    ...b,
    effectType: 'stat-modifier',
    targetType: 'self',
    energyCost: 0,
    effects: [e],
    triggers: [trig('on-ultimate-use', e, { oncePerBattle: true, maxTriggers: 1 })],
    requiresInvestigation: false,
    notes: 'Passive: first ultimate ignores 30% of enemy defense.',
  };
}

// 6910001062 metadata fallback
impls['6910001062'] = {
  ...base('6910001062'),
  effectType: 'damage',
  targetType: 'single',
  energyCost: 0,
  effects: [E('single', dmg('physical', 2, true), { durationType: 'instant', rounds: 0 })],
  triggers: [],
  requiresInvestigation: true,
  notes: 'Ultimate: metadata fallback -> 2.0x physical damage single (requiresInvestigation).',
};

// Apply
for (const skill of hero.skills) {
  if (impls[skill.id]) {
    skill.implementation = impls[skill.id];
  }
}

fs.writeFileSync(DB, JSON.stringify(db, null, 2));
console.log('done');
"