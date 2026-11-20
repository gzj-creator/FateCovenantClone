import { GameError } from './hero-progression.mjs';
import { heroMasteryView } from './hero-mastery-service.mjs';
import { loadSkillDatabase } from './effects/skill-integration.mjs';
import { isTianjiAbility, readFightAbilityTypes, readHeroNormalSkills } from '../config/fight-ability-types.mjs';
import { readHeroMutantSkills } from '../config/hero-tables.mjs';

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

function cloneWithGate(skill, { level, source, levelKnown = true }) {
  return { ...skill, level, levelKnown, skillSource: source };
}

function sourcedNormal(id, compatibility) {
  const row = readHeroNormalSkills().get(id);
  if (!row) return null;
  const variance = compatibility?.implementation?.effects?.[0]?.effect?.variance;
  return {
    id: String(id), name: row.name, type: 'Normal', status: 'Executable', category: 'description-inferred',
    implementation: {
      source: 'FightTable.AbilityDes', abilityDes: { tid: id, text: row.textKey }, tianjiGain: row.tianjiGain,
      effects: [{ target: { targetType: 'single' }, effect: {
        type: 'damage', damageType: row.damageType, multiplier: row.multiplier, variance,
      } }],
    },
  };
}

export function selectFightActionIds(abilityIds) {
  const types = readFightAbilityTypes();
  const abilityId = abilityIds.find(id => types.get(id)?.type === 1);
  const activeAbilityId = abilityIds.find(id => types.get(id)?.type === 2 && !isTianjiAbility(id)) ?? null;
  const tianjiAbilityId = abilityIds.find(isTianjiAbility) ?? null;
  if (!abilityId) fail(5, 'Battle normal action configuration missing');
  return { abilityId, activeAbilityId, tianjiAbilityId };
}

// HeroTable.AbilityLevel.level is indexed over Ability.ability. HeroDevelopMgr
// resolves it through CalAbilityLvCfgTid and GetRaiseStarUnlockSkill. Index 0 is
// the normal action and index 1 is the active action. A zero removes that raw
// slot before a battle starts.
export function abilityLevelRow(hero, heroTables) {
  const tid = Number(hero?.tid ?? 0);
  const config = heroTables?.Hero?.get(tid);
  if (!config) fail(5, 'Hero skill configuration missing');
  const quality = positiveInteger(hero?.quality, positiveInteger(config.quality, 0));
  // Star 0 is the persisted first attribute tier. The UI presents it as one
  // star, but AbilityLevel keeps a distinct 5000 row for it; coercing it to 1
  // silently unlocks the 5001 skill-level row.
  const star = nonNegativeInteger(hero?.star, nonNegativeInteger(config.star, 0));
  const key = quality * 100 + star;
  const row = heroTables?.AbilityLevel?.get(key);
  if (!row || !Array.isArray(row.level)) fail(5, 'Hero ability level configuration missing: ' + key);
  return { key, quality, star, levels: row.level.map(Number) };
}

// UpStageTalent is keyed by heroTid*100 + breakthrough. Rows at or below the
// persisted breakthrough_level unlock their potential skill. This is the source
// for the generic Passive entries in the skill catalog.
export function breakthroughPassiveIds(hero, heroTables) {
  const tid = Number(hero?.tid ?? 0);
  const breakthrough = Math.min(99, nonNegativeInteger(hero?.breakthrough_level, 0));
  const result = new Set();
  for (let stage = 1; stage <= breakthrough; stage++) {
    const row = heroTables?.UpStageTalent?.get(tid * 100 + stage);
    for (const id of [row?.skill, row?.potential_skill]) {
      const numeric = Number(id ?? 0);
      if (Number.isSafeInteger(numeric) && numeric > 0) result.add(numeric);
    }
  }
  return [...result];
}

// Build the authoritative battle loadout from persisted hero progression. The
// catalog contains many definitions for a hero; this function is the gate that
// decides which definitions are part of the current fight.
export function buildHeroSkillLoadout({ hero, heroTables, skillDatabase = loadSkillDatabase() }) {
  const tid = Number(hero?.tid ?? 0);
  const config = heroTables?.Hero?.get(tid);
  if (!config) fail(5, 'Hero skill configuration missing');
  const ability = heroTables?.Ability?.get(tid);
  if (!ability || !Array.isArray(ability.ability)) fail(5, 'Hero ability configuration missing');
  const levels = abilityLevelRow(hero, heroTables);
  const catalog = skillDatabase?.heroes?.find(row => String(row.id) === String(tid))?.skills ?? [];
  const byId = new Map(catalog.map(skill => [String(skill.id), skill]));
  const types = readFightAbilityTypes();
  const selected = new Map();
  const abilityIds = new Set();
  const warnings = [];

  const add = (skill, descriptor, priority) => {
    if (!skill) return;
    const key = String(skill.id);
    const previous = selected.get(key);
    if (previous && previous.priority >= priority) return;
    selected.set(key, { priority, skill: cloneWithGate(skill, descriptor) });
  };

  const addPassiveReference = (id, source, level = 1) => {
    if (!(id > 0) || abilityIds.has(id)) return;
    abilityIds.add(id);
    if (types.get(id)?.type !== 3) return;
    const skill = byId.get(String(id));
    if (skill && skill.category !== 'metadata fallback' && skill.implementation?.category !== 'metadata fallback') {
      add({ ...skill, type: 'Passive' }, { level, source }, 30);
    }
    else warnings.push('passive-effect-unresolved:' + id);
  };

  const slotIds = ability.ability.map((id, index) => {
    const level = levels.levels[index] ?? 0;
    return id > 0 && level > 0 ? Math.floor(id / 10) * 10 + level : 0;
  });
  const activeSlot = slotIds.findIndex(id => types.get(id)?.type === 2 && !isTianjiAbility(id));
  const tianjiId = Number(ability.soul_ability ?? 0);
  const rare = Boolean(hero?.rare);
  if ((config.quality === 60 || config.quality === 70) && tianjiId > 0 && isTianjiAbility(tianjiId)) {
    abilityIds.add(tianjiId);
    const tianji = byId.get(String(tianjiId));
    if (tianji && tianji.category !== 'metadata fallback' && tianji.implementation?.category !== 'metadata fallback') {
      add(tianji, { level: 1, source: 'hero-tianji' }, 50);
    } else {
      warnings.push('tianji-effect-unresolved:' + tianjiId);
    }
  }
  addPassiveReference(Number(ability.hide_ability ?? 0), 'hero-hidden');
  for (const [index, id] of slotIds.entries()) {
    addPassiveReference(id, 'ability-level:slot', levels.levels[index]);
  }
  if (slotIds[0]) {
    const fallback = catalog.find(skill => skill.type === 'Normal' && skill.implementation?.fallback === true);
    const normal = byId.get(String(slotIds[0])) ?? sourcedNormal(slotIds[0], fallback);
    if (!normal) warnings.push('normal-effect-unresolved:' + slotIds[0]);
    add(normal ?? fallback, { level: levels.levels[0], source: 'ability-level:normal' }, 10);
  }
  const ultimate = byId.get(String(slotIds[activeSlot]));
  if (activeSlot >= 0 && ultimate?.type === 'Ultimate' && ultimate.category !== 'metadata fallback') {
    add(ultimate, { level: levels.levels[activeSlot], source: 'ability-level:active' }, 20);
  } else if (activeSlot >= 0) {
    warnings.push('ordinary-active-effect-unresolved:' + slotIds[activeSlot]);
  }

  const breakthroughIds = breakthroughPassiveIds(hero, heroTables);
  for (const id of breakthroughIds) addPassiveReference(id, 'breakthrough');
  for (const id of heroTables?.Profession?.get(Number(config.profession))?.ability ?? []) {
    addPassiveReference(Number(id), 'profession');
  }

  const mutantId = positiveInteger(hero?.mutant, 0);
  const mutant = mutantId > 0 ? readHeroMutantSkills().get(mutantId) : null;
  const isMutant = mutant?.belong_hero === tid;
  if (isMutant) addPassiveReference(mutant.extra_skill, 'hero-mutant');
  const mastery = heroMasteryView(hero, heroTables);
  const masteryBase = positiveInteger(ability.mastery_ability, 0);
  const masteryLevel = nonNegativeInteger(mastery.level, 0);
  const masteryBreak = nonNegativeInteger(mastery.break, 0);
  const masteryId = mastery.unlocked && masteryBase && masteryBreak > 0 && masteryBreak <= mastery.max_break
    ? masteryBase + masteryBreak - 1 : null;
  if (masteryId && types.has(masteryId)) {
    abilityIds.add(masteryId);
    const skill = byId.get(String(masteryId));
    if (skill) {
      add(skill, { level: masteryLevel, source: 'mastery-selection' }, 40);
    } else {
      warnings.push('mastery-skill-not-in-catalog:' + masteryId);
    }
  }
  if (Number(hero?.diff ?? 0) > 0) addPassiveReference(Number(heroTables?.Diff?.get(tid)?.skill ?? 0), 'hero-diff');
  if (rare) addPassiveReference(Number(heroTables?.Rare?.get(tid)?.skill ?? 0), 'hero-rare');

  const skills = [...selected.values()].map(entry => entry.skill);
  return {
    tid,
    quality: levels.quality,
    star: levels.star,
    abilityLevelKey: levels.key,
    abilityLevels: levels.levels,
    isMutant,
    abilityIds: [...abilityIds],
    catalogSkillIds: skills.map(skill => skill.id),
    skills,
    mastery: {
      selected: masteryId,
      unlocked: mastery.unlocked,
      level: masteryLevel,
      break: masteryBreak
    },
    breakthroughPassiveIds: breakthroughIds,
    warnings
  };
}
