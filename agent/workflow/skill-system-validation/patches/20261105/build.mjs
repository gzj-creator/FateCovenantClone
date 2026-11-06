/**
 * Builds per-hero skill patches for the 2026-11-05 skill validation round (group A).
 *
 * Reads skill-database.json read-only and writes <heroId>.json patch files that are
 * applied with: node scripts/apply-hero-skill-patch.mjs <patch.json>  (cwd personal-server)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../../../../personal-server/config/skill-database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const clone = (value) => JSON.parse(JSON.stringify(value));
const heroById = (id) => db.heroes.find((hero) => hero.id === id);

const NORMAL_ATTACK_EFFECT = () => ({
  target: { targetType: 'single' },
  effect: { type: 'damage', damageType: 'physical', canCrit: true, multiplier: 1 },
  duration: { durationType: 'instant', rounds: 0 },
  chance: 1,
});

function normalizeDuration(duration) {
  const next = { ...(duration || { durationType: 'instant' }) };
  if (next.rounds === undefined) next.rounds = 0;
  return next;
}

function normalizeEffectWrapper(wrapper) {
  const next = clone(wrapper);
  next.duration = normalizeDuration(next.duration);
  if (next.chance === undefined) next.chance = 1;
  return next;
}

/** Effects are the baseline definitions; triggers reuse the same wrappers. */
function effectsFromTriggers(triggers) {
  const out = [];
  const seen = new Set();
  for (const trigger of triggers || []) {
    const wrapper = normalizeEffectWrapper(trigger.effect);
    const key = JSON.stringify([wrapper.target, wrapper.effect, wrapper.duration]);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(wrapper);
  }
  return out;
}

// --- shared trigger repairs (keep hero-specific ability/abilityDes untouched) ---
function repairTriggers(skillId, triggers) {
  const next = clone(triggers || []);
  for (const trigger of next) {
    trigger.effect = normalizeEffectWrapper(trigger.effect);
    if (trigger.condition === undefined) trigger.condition = null;
    if (trigger.conditionKey === undefined) trigger.conditionKey = null;
    if (trigger.cooldown === undefined) trigger.cooldown = 0;
    if (trigger.maxTriggers === undefined) trigger.maxTriggers = 0;
    if (trigger.priority === undefined) trigger.priority = 0;

    // 鼓舞: the owner gains 25 energy when a friendly unit attacks (template convention).
    if (skillId === '120000054' && trigger.triggerType === 'on-attack') {
      trigger.effect.target = { targetType: 'self' };
    }

    // 蛰伏: once per battle, mirror the catalog template's explicit cap.
    if (skillId === '120000051') {
      trigger.maxTriggers = 1;
    }

    // 生命护盾: shield lasts 2 rounds and is granted only above the first 70% crossing.
    if (skillId === '120001003') {
      trigger.maxTriggers = 1;
      trigger.conditionKey = 'hp-below-70';
      trigger.effect.effect.duration = 2;
      trigger.effect.duration = { durationType: 'timed', rounds: 2 };
    }
  }
  return next;
}

const NOTES = {
  '1020401:312040171': 'Mastery: battle-start final damage reduction +5% (permanent self buff).',
  '1020401:312040172': 'Mastery: battle-start max HP +5% (max-hp-percent, catalog stat type).',
  '1020401:312040173': 'Mastery: battle-start crit resistance +5% and crit damage reduction +10%.',
  '1020401:312040174': 'Mastery: after normal/skill hit, dispel 1 buff from the target.',
  '1020401:312040175': 'Mastery: rounds 1-3 gain 8% damage reduction (maxTriggers 3, 1 round refresh); heal 5% max HP at end of round 3.',
  '1020401:120001027': 'Shared passive: gain 150 energy when hit by normal or skill.',
  '1020401:120000046': 'Shared passive: while holding a debuff, gain 10% damage reduction (checked each round start).',
  '1020401:120000051': 'Shared passive: once per battle below 50% HP, gain 15% damage reduction.',
  '1020401:120000054': 'Shared passive: gain 25 energy when a friendly unit attacks.',
  '1020401:120000055': 'Shared passive: attacking a target whose HP% is above self grants 30% crit rate for 1 round.',
  '1020401:120000059': 'Shared passive: heal-bonus +20% for the first 2 rounds.',
  '1020401:120001005': 'Shared passive: at round start below 30% HP, heal 30% of ATK.',

  '1020501:312050171': 'Mastery: battle-start final damage reduction +5% (permanent self buff).',
  '1020501:312050172': 'Mastery: battle-start max HP +5% (max-hp-percent, catalog stat type).',
  '1020501:312050173': 'Mastery: battle-start crit resistance +5% and crit damage reduction +10%.',
  '1020501:312050174': 'Approximation: "next incoming damage -15%" is modelled as 15% damage reduction for 1 round after normal/skill use; single-hit consumption is not representable. requiresInvestigation.',
  '1020501:312050175': 'Mastery: on ultimate use gain a shield equal to 5% max HP.',
  '1020501:120001027': 'Shared passive: gain 150 energy when hit by normal or skill.',
  '1020501:120000046': 'Shared passive: while holding a debuff, gain 10% damage reduction (checked each round start).',
  '1020501:120000051': 'Shared passive: once per battle below 50% HP, gain 15% damage reduction.',
  '1020501:120000054': 'Shared passive: gain 25 energy when a friendly unit attacks.',
  '1020501:120000055': 'Shared passive: attacking a target whose HP% is above self grants 30% crit rate for 1 round.',
  '1020501:120000059': 'Shared passive: heal-bonus +20% for the first 2 rounds.',
  '1020501:120001003': 'Shared passive: first time HP drops below 70%, gain 80% DEF shield for 2 rounds.',

  '1030101:313010171': 'Mastery: battle-start final damage reduction +5% (permanent self buff).',
  '1030101:313010172': 'Mastery: battle-start max HP +5% (max-hp-percent, catalog stat type).',
  '1030101:313010173': 'Mastery: battle-start crit resistance +5% and crit damage reduction +10%.',
  '1030101:313010174': 'Approximation: "next incoming damage -15%" is modelled as 15% damage reduction for 1 round after normal/skill use; single-hit consumption is not representable. requiresInvestigation.',
  '1030101:313010175': 'Mastery: rounds 1-3 gain 8% damage reduction (maxTriggers 3, 1 round refresh); heal 5% max HP at end of round 3.',
  '1030101:120001027': 'Shared passive: gain 150 energy when hit by normal or skill.',
  '1030101:120000051': 'Shared passive: once per battle below 50% HP, gain 15% damage reduction.',
  '1030101:120000054': 'Shared passive: gain 25 energy when a friendly unit attacks.',
  '1030101:120000055': 'Shared passive: attacking a target whose HP% is above self grants 30% crit rate for 1 round.',
  '1030101:120000059': 'Shared passive: heal-bonus +20% for the first 2 rounds.',
  '1030101:120001003': 'Shared passive: first time HP drops below 70%, gain 80% DEF shield for 2 rounds.',
  '1030101:120001019': 'Approximation: "before the first ultimate" damage reduction is modelled as 20% for 2 rounds from the first ultimate-use trigger; the pre-ultimate window itself is not representable. requiresInvestigation.',
  '1030101:6103010109': 'Rare ultimate: at round end shield all allies for 5% of Lunair max HP (1 round). Polar-night doubling and the {0} status layer are not modelled. requiresInvestigation.',

  '1030301:313030174': 'Mastery: after normal/skill hit, dispel 1 buff from the target.',

  '1030501:6103030103': 'Rare ultimate: when hit, shield the lowest-HP allies for 10% of Hesser max HP for 2 rounds (doubled from round 3, max 3 per round). Same-row energy resistance/speed buffs and shield-conditional control/energy/status resistance are not modelled (target types unavailable). requiresInvestigation.',

  '2020501:322050175': 'Approximation: chain is not modelled as a stacked status with per-layer stats, so the enhancement is expressed as -5% crit rate and -5% evasion on the attacked target for 2 rounds, gated on the target already carrying a debuff. requiresInvestigation.',
  '2020601:6202060112': 'Approximation: unlimited ultimate follow-ups are not modelled; one extra 50% ATK physical follow-up is applied on ultimate use as a conservative stand-in. requiresInvestigation.',
};

const NORMAL_SKILLS = new Set(['normal-profession-1', 'normal-profession-2', 'normal-profession-3', 'normal-profession-4']);

const SPECIAL = {
  // 锢魂之咒: chain enhancement, approximated as debuffs applied to the struck target.
  '2020501:322050175': () => ({
    effectType: 'stat-modifier',
    targetType: 'single',
    energyCost: 0,
    effects: [
      {
        target: { targetType: 'single' },
        effect: { type: 'stat-modifier', statType: 'crit-rate', magnitude: -0.05, isPercentage: true },
        duration: { durationType: 'timed', rounds: 2 },
        chance: 1,
      },
      {
        target: { targetType: 'single' },
        effect: { type: 'stat-modifier', statType: 'evasion', magnitude: -0.05, isPercentage: true },
        duration: { durationType: 'timed', rounds: 2 },
        chance: 1,
      },
    ],
    triggers: [
      {
        triggerType: 'on-attack',
        condition: null,
        conditionKey: 'target-has-debuff',
        cooldown: 0,
        maxTriggers: 0,
        oncePerBattle: false,
        oncePerRound: false,
        effect: {
          target: { targetType: 'single' },
          effect: { type: 'stat-modifier', statType: 'crit-rate', magnitude: -0.05, isPercentage: true },
          duration: { durationType: 'timed', rounds: 2 },
          chance: 1,
        },
        priority: 0,
      },
      {
        triggerType: 'on-skill-use',
        condition: null,
        conditionKey: 'target-has-debuff',
        cooldown: 0,
        maxTriggers: 0,
        oncePerBattle: false,
        oncePerRound: false,
        effect: {
          target: { targetType: 'single' },
          effect: { type: 'stat-modifier', statType: 'evasion', magnitude: -0.05, isPercentage: true },
          duration: { durationType: 'timed', rounds: 2 },
          chance: 1,
        },
        priority: 0,
      },
    ],
    requiresInvestigation: true,
  }),
  // 无限瞬杀: infinite follow-ups approximated by one extra 50% ATK follow-up.
  '2020601:6202060112': () => ({
    effectType: 'damage',
    targetType: 'single',
    energyCost: 0,
    effects: [
      {
        target: { targetType: 'single' },
        effect: { type: 'damage', damageType: 'physical', multiplier: 0.5, canCrit: true },
        duration: { durationType: 'instant', rounds: 0 },
        chance: 1,
      },
    ],
    triggers: [
      {
        triggerType: 'on-ultimate-use',
        condition: null,
        conditionKey: null,
        cooldown: 0,
        maxTriggers: 0,
        oncePerBattle: false,
        oncePerRound: false,
        effect: {
          target: { targetType: 'single' },
          effect: { type: 'damage', damageType: 'physical', multiplier: 0.5, canCrit: true },
          duration: { durationType: 'instant', rounds: 0 },
          chance: 1,
        },
        priority: 0,
      },
    ],
    requiresInvestigation: true,
  }),
};

const PLAN = {
  1020401: ['normal-profession-4', '312040171', '312040172', '312040173', '312040174', '312040175',
    '120001027', '120000046', '120000051', '120000054', '120000055', '120000059', '120001005'],
  1020501: ['normal-profession-4', '312050171', '312050172', '312050173', '312050174', '312050175',
    '120001027', '120000046', '120000051', '120000054', '120000055', '120000059', '120001003'],
  1030101: ['normal-profession-4', '313010171', '313010172', '313010173', '313010174', '313010175',
    '120001027', '120000051', '120000054', '120000055', '120000059', '120001003', '120001019', '6103010109'],
  1030301: ['313030174'],
  1030501: ['normal-profession-4', '6103030103'],
  1030601: ['normal-profession-4'],
  2020501: ['322050175'],
  2020601: ['6202060112'],
};

const REVIEW_FLAGS = new Set([
  '1020501:312050174', '1030101:313010174', '1030101:120001019', '1030101:6103010109',
  '1030501:6103030103', '2020501:322050175', '2020601:6202060112',
]);

for (const [heroIdText, skillIds] of Object.entries(PLAN)) {
  const heroId = Number(heroIdText);
  const hero = heroById(heroId);
  if (!hero) throw new Error(`hero ${heroId} missing`);

  const skills = skillIds.map((skillId) => {
    const skill = hero.skills.find((candidate) => candidate.id === skillId);
    if (!skill) throw new Error(`hero ${heroId} has no skill ${skillId}`);
    const key = `${heroId}:${skillId}`;
    const notes = NOTES[key];

    const implementation = clone(skill.implementation || {});

    if (NORMAL_SKILLS.has(skillId)) {
      implementation.fallback = true;
      implementation.source = implementation.source || 'project-fallback';
      implementation.effectType = 'damage';
      implementation.targetType = 'single';
      implementation.energyCost = 0;
      implementation.effects = [NORMAL_ATTACK_EFFECT()];
      implementation.triggers = [];
      implementation.notes = 'Project-defined fallback basic attack: 1.0x physical damage to a single target.';
      return { id: skillId, implementation };
    }

    const special = SPECIAL[key];
    if (special) {
      if (!notes) throw new Error(`missing notes for ${key}`);
      const built = special();
      Object.assign(implementation, built);
      implementation.notes = notes;
      return { id: skillId, implementation };
    }

    if (!notes) throw new Error(`missing notes for ${key}`);
    implementation.triggers = repairTriggers(skillId, implementation.triggers);
    implementation.effects = effectsFromTriggers(implementation.triggers);
    if (implementation.effects.length === 0) throw new Error(`${key} produced no effects`);
    implementation.effectType = implementation.effects[0].effect.type;
    implementation.targetType = implementation.effects[0].target.targetType;
    implementation.energyCost = implementation.energyCost || 0;
    implementation.requiresInvestigation = REVIEW_FLAGS.has(key);
    implementation.notes = notes;
    return { id: skillId, implementation };
  });

  const file = path.join(__dirname, `hero-${heroId}.json`);
  fs.writeFileSync(file, `${JSON.stringify({ heroId, skills }, null, 2)}\n`, 'utf8');
  console.log(`wrote ${path.basename(file)} (${skills.length} skills)`);
}
