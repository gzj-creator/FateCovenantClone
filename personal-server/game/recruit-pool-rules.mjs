export const RECRUIT_RULE_VERSION = 2;
export const NEW_HERO_EXCLUSIVE_GROUP = 'newHeroExclusive';

// Client DrawTable.LibWeight rows retain their top-level weights, but every
// referenced DrawTable.Group row is empty in the shipped data. Keep the local
// compatibility matrix explicit and fail closed instead of falling back to all
// heroes whenever a pool entry is missing.
export const RECRUIT_POOL_RULES = Object.freeze({
  1: Object.freeze({
    lib: 1,
    name: 'adventure',
    qualityWeights: Object.freeze([[30, 5000], [40, 3000], [50, 1500], [60, 500]]),
    eligibleGetWays: Object.freeze([32, 33, 34]),
    excludedHeroGroups: Object.freeze([NEW_HERO_EXCLUSIVE_GROUP]),
    guaranteeSpecial: 1,
    guaranteeQualities: Object.freeze([50, 60]),
    qualityAvailability: Object.freeze({ 60: Object.freeze({ scope: 'total', minCompletedDraws: 100 }) }),
    unlock: null,
    wish: Object.freeze({
      unlockScope: 'total',
      minCompletedDraws: 100,
      fields: Object.freeze(['wish_hero_list', 'extra_wish_list']),
      maxByQuality: Object.freeze([[50, 3]]),
      candidateSlotTypes: Object.freeze([1]),
      targetedPity: false
    })
  }),
  2: Object.freeze({
    lib: 2,
    name: 'elite',
    qualityWeights: Object.freeze([[30, 3500], [40, 4500], [50, 1850], [60, 150]]),
    eligibleGetWays: Object.freeze([32, 33, 34]),
    excludedHeroGroups: Object.freeze([NEW_HERO_EXCLUSIVE_GROUP]),
    guaranteeSpecial: 2,
    guaranteeQualities: Object.freeze([50, 60]),
    qualityAvailability: Object.freeze({ 60: Object.freeze({ scope: 'total', minCompletedDraws: 100 }) }),
    unlock: Object.freeze({ scope: 'adventure', minCompletedDraws: 30, allowExistingPoolProgress: true }),
    wish: Object.freeze({
      unlockScope: 'total',
      minCompletedDraws: 100,
      fields: Object.freeze(['wish_hero_list', 'extra_wish_list']),
      maxByQuality: Object.freeze([[50, 2], [60, 1]]),
      candidateSlotTypes: Object.freeze([1, 2]),
      targetedPity: true
    })
  }),
  3: Object.freeze({
    lib: 3,
    name: 'friendship',
    qualityWeights: Object.freeze([[30, 6200], [40, 2900], [50, 900]]),
    eligibleGetWays: Object.freeze([32, 33, 34]),
    excludedHeroGroups: Object.freeze([NEW_HERO_EXCLUSIVE_GROUP]),
    guaranteeSpecial: 0,
    guaranteeQualities: Object.freeze([50]),
    qualityAvailability: Object.freeze({}),
    unlock: null,
    wish: null
  }),
  10: Object.freeze({
    lib: 10,
    name: 'new-hero-limit',
    qualityWeights: Object.freeze([[30, 3800], [40, 3400], [50, 2500], [60, 300]]),
    eligibleGetWays: Object.freeze([32, 33, 34, 77, 91, 100, 502]),
    excludedHeroGroups: Object.freeze([]),
    guaranteeSpecial: 0,
    guaranteeQualities: Object.freeze([50, 60]),
    qualityAvailability: Object.freeze({ 60: Object.freeze({ scope: 'total', minCompletedDraws: 100 }) }),
    unlock: null,
    wish: null
  })
});

export const SUPPORTED_RECRUIT_LIBS = Object.freeze(Object.keys(RECRUIT_POOL_RULES).map(Number));

function drawCount(value) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function randomUnit(random) {
  const value = Number(random());
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999999, value)) : 0;
}

export function completedDrawCounts(byLib) {
  let total = 0;
  let adventure = 0;
  for (const [lib, info] of byLib) {
    const count = drawCount(info?.draw_count);
    total = Math.min(Number.MAX_SAFE_INTEGER, total + count);
    if (Number(lib) === 1) adventure = count;
  }
  return Object.freeze({ total, adventure });
}

export function qualityAvailable(rule, quality, progress) {
  const ruleForQuality = rule.qualityAvailability?.[quality];
  if (!ruleForQuality) return true;
  return Number(progress?.[ruleForQuality.scope] ?? 0) >= Number(ruleForQuality.minCompletedDraws);
}

export function availableQualityWeights(rule, progress) {
  const entries = rule.qualityWeights.filter(([quality]) => qualityAvailable(rule, quality, progress));
  if (!entries.length) throw new Error('Recruitment pool has no quality available for the current progress');
  return entries;
}

export function isPoolUnlocked(rule, info, progress) {
  if (!rule.unlock) return true;
  if (Number(progress?.[rule.unlock.scope] ?? 0) >= Number(rule.unlock.minCompletedDraws)) return true;
  return Boolean(rule.unlock.allowExistingPoolProgress && drawCount(info?.draw_count) > 0);
}

export function isWishUnlocked(rule, progress) {
  if (!rule.wish) return false;
  return Number(progress?.[rule.wish.unlockScope] ?? 0) >= Number(rule.wish.minCompletedDraws);
}

export function pickWeighted(entries, random, weightOf = entry => entry[1]) {
  const total = entries.reduce((sum, entry) => sum + Number(weightOf(entry) ?? 0), 0);
  if (!(total > 0)) throw new Error('Recruitment weights are invalid');
  let point = randomUnit(random) * total;
  for (const entry of entries) {
    point -= Number(weightOf(entry) ?? 0);
    if (point < 0) return entry;
  }
  return entries.at(-1);
}

export function pickQuality(rule, progress, guaranteed, random) {
  let entries = availableQualityWeights(rule, progress);
  if (guaranteed) {
    const allowed = new Set(rule.guaranteeQualities);
    entries = entries.filter(([quality]) => allowed.has(quality));
  }
  if (!entries.length) throw new Error('Recruitment guarantee has no eligible quality');
  return pickWeighted(entries, random)[0];
}

export function buildRecruitPoolCatalog(heroTables, {
  rules = RECRUIT_POOL_RULES,
  excludedHeroGroups = new Map()
} = {}) {
  const catalog = new Map();
  for (const [rawLib, rule] of Object.entries(rules)) {
    const lib = Number(rawLib);
    if (!Number.isSafeInteger(lib) || rule.lib !== lib) throw new Error('Recruitment pool library is invalid');
    const seenQualities = new Set();
    for (const [quality, weight] of rule.qualityWeights) {
      if (!Number.isSafeInteger(quality) || !(Number(weight) > 0) || seenQualities.has(quality)) {
        throw new Error(`Recruitment pool ${lib} has invalid quality weights`);
      }
      seenQualities.add(quality);
    }
    if (!seenQualities.has(50)) throw new Error(`Recruitment pool ${lib} cannot provide its guarantee quality`);
    if (rule.guaranteeQualities.some(quality => !seenQualities.has(quality))) {
      throw new Error(`Recruitment pool ${lib} has a guarantee outside its quality weights`);
    }

    const acceptedGetWays = new Set(rule.eligibleGetWays ?? []);
    const excludedHeroes = new Set();
    for (const groupName of rule.excludedHeroGroups ?? []) {
      const group = excludedHeroGroups.get(groupName);
      if (!(group instanceof Set) || group.size === 0) {
        throw new Error(`Recruitment exclusion group is missing or empty: ${groupName}`);
      }
      for (const rawTid of group) excludedHeroes.add(Number(rawTid));
    }
    const byQuality = new Map(rule.qualityWeights.map(([quality]) => [quality, []]));
    for (const [rawTid, hero] of [...heroTables.Hero.entries()].sort(([a], [b]) => Number(a) - Number(b))) {
      const tid = Number(rawTid);
      const quality = Number(hero.quality);
      if (!byQuality.has(quality) || !(Number(hero.chip) > 0)) continue;
      if (acceptedGetWays.size && !acceptedGetWays.has(Number(hero.get_way))) continue;
      if (excludedHeroes.has(tid)) continue;
      byQuality.get(quality).push({ tid, chip: Number(hero.chip), quality });
    }
    const qualityWeights = rule.qualityWeights.filter(([quality]) => byQuality.get(quality).length > 0);
    if (!qualityWeights.some(([quality]) => quality === 50)) {
      throw new Error(`Recruitment pool ${lib} has no quality-50 heroes`);
    }
    const effectiveRule = Object.freeze({
      ...rule,
      qualityWeights: Object.freeze(qualityWeights)
    });
    const heroes = [...byQuality.values()].flat();
    const wishRows = heroTables.DrawExchangeHero;
    const wishByTid = new Map();
    if (rule.wish) {
      if (!(wishRows instanceof Map) || wishRows.size === 0) {
        throw new Error(`Recruitment wish candidate table is missing for library ${lib}`);
      }
      const acceptedSlotTypes = new Set(rule.wish.candidateSlotTypes ?? []);
      if (acceptedSlotTypes.size === 0) {
        throw new Error(`Recruitment wish candidate slot types are missing for library ${lib}`);
      }
      const allowedQualities = new Set(rule.wish.maxByQuality.map(([quality]) => quality));
      for (const [rawTid, row] of [...wishRows.entries()].sort(([a], [b]) => Number(a) - Number(b))) {
        if (!acceptedSlotTypes.has(Number(row?.slot_type))) continue;
        const tid = Number(rawTid);
        const hero = heroTables.Hero.get(tid);
        const quality = Number(hero?.quality);
        if (!hero || !allowedQualities.has(quality) || !(Number(hero.chip) > 0)) continue;
        wishByTid.set(tid, { tid, chip: Number(hero.chip), quality });
      }
      for (const quality of allowedQualities) {
        if (![...wishByTid.values()].some(hero => hero.quality === quality)) {
          throw new Error(`Recruitment wish candidates have no quality-${quality} hero for library ${lib}`);
        }
      }
    }
    catalog.set(lib, {
      rule: effectiveRule,
      byQuality,
      heroes,
      byTid: new Map(heroes.map(hero => [hero.tid, hero])),
      wishHeroes: [...wishByTid.values()],
      wishByTid,
      excludedHeroTids: Object.freeze([...excludedHeroes])
    });
  }
  return catalog;
}

export function choosePoolHero(pool, quality, random, candidates = null) {
  const entries = candidates?.length ? candidates : pool.byQuality.get(quality);
  if (!entries?.length) throw new Error(`Recruitment quality pool ${quality} is empty`);
  return pickWeighted(entries, random, entry => entry.weight ?? 1);
}
