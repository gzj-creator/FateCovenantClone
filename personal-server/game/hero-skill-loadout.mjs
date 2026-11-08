import { GameError } from './hero-progression.mjs';
import { heroMasteryView } from './hero-mastery-service.mjs';
import { loadSkillDatabase } from './effects/skill-integration.mjs';

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

function evidenceBackedUltimate(skills, excludedId = 0) {
  return skills.find(skill => {
    if (skill.type !== 'Ultimate') return false;
    if (String(skill.id) === String(excludedId)) return false;
    const implementation = skill.implementation;
    if (!implementation) return false;
    const metadataFallback = skill.category === 'metadata fallback'
      || implementation.category === 'metadata fallback'
      || (implementation.requiresInvestigation === true
        && implementation.resolvedDescription === false
        && implementation.catalogTypeMatch !== true);
    return !metadataFallback && (implementation.category === 'description-inferred'
      || implementation.resolvedDescription === true
      || implementation.catalogTypeMatch === true);
  }) ?? null;
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
  const breakthrough = Math.max(0, Number(hero?.breakthrough_level ?? 0));
  const result = [];
  const table = heroTables?.UpStageTalent;
  if (!table) return result;
  for (const [key, row] of table) {
    const numericKey = Number(key);
    const stage = numericKey % 100;
    if (Math.floor(numericKey / 100) !== tid || stage > breakthrough) continue;
    for (const id of [row?.potential_skill, row?.skill]) {
      const numeric = Number(id ?? 0);
      if (Number.isSafeInteger(numeric) && numeric > 0 && !result.includes(numeric)) result.push(numeric);
    }
  }
  return result;
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
  const selected = new Map();
  const warnings = [];

  const add = (skill, descriptor, priority) => {
    if (!skill) return;
    const key = String(skill.id);
    const previous = selected.get(key);
    if (previous && previous.priority >= priority) return;
    selected.set(key, { priority, skill: cloneWithGate(skill, descriptor) });
  };

  const rawAbilityIds = ability.ability.map(Number);
  const unlockedRawIds = rawAbilityIds.filter((_, index) => Number(levels.levels[index] ?? 0) > 0);
  const soulId = Number(ability.soul_ability ?? 0);
  const soul = soulId > 0 ? byId.get(String(soulId)) ?? null : null;
  const rare = Boolean(hero?.rare);
  if (rare && soulId > 0 && unlockedRawIds.length > 1) unlockedRawIds[1] = soulId;
  const normal = catalog.find(skill => skill.type === 'Normal') ?? null;
  add(normal, { level: levels.levels[0] ?? 0, source: 'ability-level:normal' }, 10);
  if (rare && soul) {
    add(soul, { level: levels.levels[1] || 1, source: 'soul-replacement' }, 50);
  } else {
    const ultimate = evidenceBackedUltimate(catalog, soulId);
    if (ultimate) add(ultimate, { level: levels.levels[1] || 1, source: 'ability-level:active' }, 20);
    if (rare && !soul) warnings.push('rare-soul-skill-missing:' + tid);
  }

  // UpStageTalent exposes breakthrough milestones, but the shipped catalog has
  // not yet supplied the raw Ability-to-catalog join. Keep its ids as evidence
  // metadata and retain catalog passives until that join is recovered.
  const breakthroughIds = breakthroughPassiveIds(hero, heroTables);
  for (const skill of catalog) {
    if (skill.type !== 'Passive') continue;
    add(skill, { level: 1, source: 'catalog-passive-unmapped', levelKnown: false }, 30);
  }
  if (breakthroughIds.length) warnings.push('breakthrough-passive-join-unresolved');

  const mastery = heroMasteryView(hero, heroTables);
  const masteryId = Number(ability.mastery_ability ?? 0);
  const masteryLevel = Math.max(0, Number(hero?.mastery_level ?? 0));
  if (mastery.unlocked && masteryLevel > 0 && masteryId > 0) {
    const skill = byId.get(String(masteryId));
    if (skill) {
      add(skill, { level: masteryLevel, source: 'mastery-selection' }, 40);
      if (!unlockedRawIds.includes(masteryId)) unlockedRawIds.push(masteryId);
    } else {
      warnings.push('mastery-skill-not-in-catalog:' + masteryId);
    }
  }

  const skills = [...selected.values()].map(entry => entry.skill);
  return {
    tid,
    quality: levels.quality,
    star: levels.star,
    abilityLevelKey: levels.key,
    abilityLevels: levels.levels,
    // Raw ids remain the client/replay contract; catalog ids are only available
    // where HeroTable carries an exact reference (soul and mastery rows).
    abilityIds: unlockedRawIds,
    catalogSkillIds: skills.map(skill => skill.id),
    skills,
    mastery: {
      selected: masteryId > 0 ? masteryId : null,
      unlocked: mastery.unlocked,
      level: masteryLevel,
      break: Math.max(0, Number(hero?.mastery_break ?? 0))
    },
    breakthroughPassiveIds: breakthroughIds,
    replacement: rare && soul ? { to: soulId } : null,
    warnings
  };
}
