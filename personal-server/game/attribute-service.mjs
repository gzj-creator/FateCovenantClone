import { GameError } from './hero-progression.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { buildHeroSkillLoadout } from './hero-skill-loadout.mjs';

// Attribute values are stored as fixed-point integers in HeroTable: growth rows
// use 1/10000 steps (BaseAttrNew.hp_grow = 396000 means +39.6 HP per level) and
// every "sum_add" column is a percentage with 10000 = 100%. AttrType.show_factor
// carries the same 10000 scale for value_type=1 rows, which is why the same
// divisor is applied to percentages assembled from AttrType.
export const ATTR_SCALE = 10000;

// Fight attribute keys follow AttrType.fight_attr. The physical/magic defense
// pair is proven by AttrType 24->8 / 25->13 together with the paired percentage
// rows 26->9 / 27->14; crit and crit damage are the only visible percentage
// attributes on the hero panel (AttrType 11->29, 12->30).
export const FIGHT_ATTR = Object.freeze({
  HP: 24,
  HP_RATE: 25,
  ATTACK: 2,
  ATTACK_RATE: 3,
  PHYSICAL_DEFENSE: 8,
  PHYSICAL_DEFENSE_RATE: 9,
  MAGIC_DEFENSE: 13,
  MAGIC_DEFENSE_RATE: 14,
  CRIT_RATE: 29,
  CRIT_HARM: 30
});

// Display attribute ids used by BaseAttrNew/StarAddAttr/BreakAddAttr columns.
// They are resolved through AttrType so the mapping stays configuration driven.
const DISPLAY_ATTR = Object.freeze({
  hp: 1, attack: 2, physical_def: 24, magic_def: 25,
  crit: 11, crit_harm: 12,
  hp_rate: 5, attack_rate: 6, physical_def_rate: 26, magic_def_rate: 27
});

// Power is NOT recovered. HeroTable.BaseAttrNew.power is 0 for every shipped
// row and no weight table was found, so this local coefficient set is an
// explicit compatibility rule shared by the attribute query, the rank screen
// and the battle report. Keeping it in one place means a later evidence-backed
// formula only has to change here. Crit values are percentages (500 = 5%) and
// are deliberately excluded from the weight sum until a source is recovered.
export const POWER_WEIGHTS = Object.freeze({ hp: 1, attack: 10, physicalDefense: 2, magicDefense: 2 });

const HERO_LEVEL_LIMIT = 300;
const STAR_LIMIT = 10;

const fail = (code, message) => { throw new GameError(code, message); };

export function configuredHero(heroTables, tid) {
  const hero = heroTables?.Hero?.get(Number(tid));
  if (!hero) fail(5, 'Hero attribute configuration missing');
  return hero;
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

const baseRowCache = new WeakMap();

// BaseAttrNew is keyed <heroTid * 100 + quality>. A quality tier can be missing
// for one hero while neighbouring tiers exist, so resolve to the exact tier and
// otherwise the closest tier that does not exceed it (then the nearest above).
function baseAttributeRow(tables, tid, quality) {
  const rows = tables?.BaseAttrNew;
  if (!rows) fail(5, 'Attribute configuration missing');
  let index = baseRowCache.get(rows);
  if (!index) {
    index = new Map();
    for (const [key, row] of rows) {
      const numeric = Number(key);
      const hero = Math.floor(numeric / 100), tier = numeric % 100;
      if (!index.has(hero)) index.set(hero, new Map());
      index.get(hero).set(tier, row);
    }
    baseRowCache.set(rows, index);
  }
  const tiers = index.get(Number(tid));
  if (!tiers || tiers.size === 0) fail(5, 'Hero base attribute configuration missing');
  const exact = tiers.get(Number(quality));
  if (exact) return { row: exact, quality: Number(quality), exact: true };
  const below = [...tiers.keys()].filter(tier => tier <= Number(quality)).sort((a, b) => b - a)[0];
  const above = [...tiers.keys()].filter(tier => tier > Number(quality)).sort((a, b) => a - b)[0];
  const tier = below ?? above;
  if (tier === undefined) fail(5, 'Hero base attribute configuration missing');
  return { row: tiers.get(tier), quality: tier, exact: false };
}

export function resolveFightAttr(tables, displayKey) {
  const row = tables?.AttrType?.get(Number(displayKey));
  const fightKey = Number(row?.fight_attr ?? 0);
  if (!row || fightKey <= 0) fail(5, 'Fight attribute mapping missing for ' + displayKey);
  return { key: fightKey, rate: Number(row.value_type) === 1, factor: Number(row.show_factor) || ATTR_SCALE };
}

function addSource(sources, flat, rate, tables, play, displayKey, value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric === 0) return;
  const mapping = resolveFightAttr(tables, displayKey);
  const target = mapping.rate ? rate : flat;
  target.set(mapping.key, (target.get(mapping.key) ?? 0) + numeric);
  sources.push({ play, displayAttr: Number(displayKey), key: mapping.key, value: numeric, kind: mapping.rate ? 'rate' : 'flat' });
}

function eachDisplayStat(tables, sources, flat, rate, play, row, columns) {
  if (!row) return;
  for (const [column, displayKey] of columns) addSource(sources, flat, rate, tables, play, displayKey, row[column]);
}

function finalStat(flat, rate, key, rateKey, min, fallback) {
  const base = flat.get(key) ?? fallback;
  const percent = rate.get(rateKey) ?? 0;
  const scaled = base * (1 + percent / ATTR_SCALE);
  return Math.max(min, Math.round(scaled));
}

// Local compatibility only: no shipped row maps profession to base speed, so the
// previous mission heuristic is preserved verbatim here to keep battle pacing
// stable until a speed source is recovered.
export function compatibilitySpeed(heroConfig) {
  const profession = Number(heroConfig?.profession ?? 0);
  const base = profession === 3 ? 112 : profession === 4 ? 104 : profession === 2 ? 98 : profession === 5 ? 92 : 88;
  return base + (Number(heroConfig?.index ?? 0) % 7);
}

export function statsFromFightAttrs(fightAttrs, { speed = 0 } = {}) {
  return {
    hp: Math.max(1, Math.round(Number(fightAttrs?.[FIGHT_ATTR.HP] ?? 1))),
    attack: Math.max(1, Math.round(Number(fightAttrs?.[FIGHT_ATTR.ATTACK] ?? 1))),
    physicalDefense: Math.max(0, Math.round(Number(fightAttrs?.[FIGHT_ATTR.PHYSICAL_DEFENSE] ?? 0))),
    magicDefense: Math.max(0, Math.round(Number(fightAttrs?.[FIGHT_ATTR.MAGIC_DEFENSE] ?? 0))),
    critRate: Math.max(0, Math.round(Number(fightAttrs?.[FIGHT_ATTR.CRIT_RATE] ?? 0))),
    critHarm: Math.max(0, Math.round(Number(fightAttrs?.[FIGHT_ATTR.CRIT_HARM] ?? 0))),
    speed: Math.max(0, Math.round(Number(speed ?? 0)))
  };
}

// Compatibility power rule. See POWER_WEIGHTS above: not an original formula.
export function powerFromStats(stats) {
  const value = Number(stats?.hp ?? 0) * POWER_WEIGHTS.hp
    + Number(stats?.attack ?? 0) * POWER_WEIGHTS.attack
    + Number(stats?.physicalDefense ?? 0) * POWER_WEIGHTS.physicalDefense
    + Number(stats?.magicDefense ?? 0) * POWER_WEIGHTS.magicDefense;
  return Math.max(0, Math.round(value));
}

// Assemble one persisted hero into final fight attributes. Every contribution is
// recorded in sources so an operator can explain a single number end to end.
export function assembleHeroAttributes({ hero, heroTables, attributeTables = readAttributeTables(), overrides = {} }) {
  if (!hero) fail(5, 'Hero state missing');
  const tid = Number(hero.tid);
  const config = configuredHero(heroTables, tid);
  const level = clampInteger(overrides.level ?? hero.level, 1, HERO_LEVEL_LIMIT, 1);
  // pb_single_hero documents 1 star as the default for every hero, so a stored
  // 0 is treated as that default rather than as a separate tier.
  const star = clampInteger(overrides.star ?? hero.star, 1, STAR_LIMIT, 1);
  const breakLevel = clampInteger(overrides.breakLevel ?? hero.breakthrough_level, 0, 50, 0);
  // pb_single_hero does not persist a quality field; the configured Hero.quality
  // tier is used until a quality-upgrade system stores the current tier. An
  // explicit override keeps the assembler ready for that state.
  const quality = Number(overrides.quality ?? config.quality ?? 0);
  const camp = Number(config.camp ?? 0);
  const flat = new Map(), rate = new Map(), sources = [], notes = [];

  const base = baseAttributeRow(attributeTables, tid, quality);
  if (!base.exact) notes.push('base-quality-fallback:' + quality + '->' + base.quality);
  const baseRow = base.row;
  const perLevel = Math.max(0, level - 1);
  const grown = (value, grow) => Number(value ?? 0) + Number(grow ?? 0) * perLevel / ATTR_SCALE;
  eachDisplayStat(attributeTables, sources, flat, rate, 'base', {
    hp: grown(baseRow.hp, baseRow.hp_grow),
    attack: grown(baseRow.attack, baseRow.attack_grow),
    physical_def: grown(baseRow.physical_def, baseRow.physical_def_grow),
    magic_def: grown(baseRow.magic_def, baseRow.magic_def_grow),
    crit: baseRow.crit,
    crit_harm: baseRow.crit_harm
  }, [
    ['hp', DISPLAY_ATTR.hp], ['attack', DISPLAY_ATTR.attack],
    ['physical_def', DISPLAY_ATTR.physical_def], ['magic_def', DISPLAY_ATTR.magic_def],
    ['crit', DISPLAY_ATTR.crit], ['crit_harm', DISPLAY_ATTR.crit_harm]
  ]);

  for (let step = 0; step <= Math.min(star, 5); step++) {
    const key = camp * 10000 + quality * 100 + step;
    const row = attributeTables.StarAddAttr?.get(key);
    if (!row) { notes.push('star-attr-missing:' + key); continue; }
    eachDisplayStat(attributeTables, sources, flat, rate, 'star:' + step, row, [
      ['hp', DISPLAY_ATTR.hp], ['attack', DISPLAY_ATTR.attack],
      ['physical_def', DISPLAY_ATTR.physical_def], ['magic_def', DISPLAY_ATTR.magic_def],
      ['hp_sum_add', DISPLAY_ATTR.hp_rate], ['attack_sum_add', DISPLAY_ATTR.attack_rate],
      ['physical_def_sum_add', DISPLAY_ATTR.physical_def_rate], ['magic_def_sum_add', DISPLAY_ATTR.magic_def_rate]
    ]);
  }
  for (let step = 6; step <= star; step++) {
    const row = attributeTables.HighStarAddAttr?.get(tid * 100 + step);
    if (!row) { notes.push('high-star-attr-missing:' + (tid * 100 + step)); continue; }
    eachDisplayStat(attributeTables, sources, flat, rate, 'high-star:' + step, row, [
      ['hp', DISPLAY_ATTR.hp], ['attack', DISPLAY_ATTR.attack],
      ['physical_def', DISPLAY_ATTR.physical_def], ['magic_def', DISPLAY_ATTR.magic_def]
    ]);
  }
  eachDisplayStat(attributeTables, sources, flat, rate, 'break', attributeTables.BreakAddAttr?.get(breakLevel), [
    ['hp', DISPLAY_ATTR.hp], ['attack', DISPLAY_ATTR.attack],
    ['physical_def', DISPLAY_ATTR.physical_def], ['magic_def', DISPLAY_ATTR.magic_def]
  ]);
  // BattleAttr stores display attribute pairs ([[1,900],[2,150],[24,45],[25,45]]).
  const battleRow = attributeTables.BattleAttr?.get(tid);
  for (const pair of battleRow?.attr ?? []) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    addSource(sources, flat, rate, attributeTables, 'battle', pair[0], pair[1]);
  }

  const fightAttrs = {
    [FIGHT_ATTR.HP]: finalStat(flat, rate, FIGHT_ATTR.HP, FIGHT_ATTR.HP_RATE, 1, 0),
    [FIGHT_ATTR.ATTACK]: finalStat(flat, rate, FIGHT_ATTR.ATTACK, FIGHT_ATTR.ATTACK_RATE, 1, 0),
    [FIGHT_ATTR.PHYSICAL_DEFENSE]: finalStat(flat, rate, FIGHT_ATTR.PHYSICAL_DEFENSE, FIGHT_ATTR.PHYSICAL_DEFENSE_RATE, 0, 0),
    [FIGHT_ATTR.MAGIC_DEFENSE]: finalStat(flat, rate, FIGHT_ATTR.MAGIC_DEFENSE, FIGHT_ATTR.MAGIC_DEFENSE_RATE, 0, 0),
    [FIGHT_ATTR.CRIT_RATE]: Math.max(0, Math.round(rate.get(FIGHT_ATTR.CRIT_RATE) ?? 0)),
    [FIGHT_ATTR.CRIT_HARM]: Math.max(0, Math.round(rate.get(FIGHT_ATTR.CRIT_HARM) ?? 0))
  };
  const stats = statsFromFightAttrs(fightAttrs, { speed: compatibilitySpeed(config) });
  return {
    uid: hero.uid === undefined ? null : String(hero.uid),
    tid, level, star, breakLevel, quality: base.quality, configuredQuality: quality, camp,
    profession: Number(config.profession ?? 0),
    fightAttrs, stats, sources, notes,
    power: powerFromStats(stats)
  };
}

// NPC rows reuse the same fight-attribute mapping. NpcAttr itself only stores
// references to HeroTable.NpcAttr.<n>.data.lua, which are not shipped, so the
// base numbers still come from the compatible caller baseline. The shipped
// NpcAttrRatio and NpcFightCustom.elite_scale are applied here.
export function npcAttributeScale(attributeTables, tid, { elite = false } = {}) {
  const ratios = new Map();
  for (const pair of attributeTables.NpcAttrRatio?.get(Number(tid))?.attr_list ?? []) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const mapping = resolveFightAttr(attributeTables, pair[0]);
    ratios.set(mapping.key, (ratios.get(mapping.key) ?? 0) + Number(pair[1] ?? 0));
  }
  const eliteRow = attributeTables.NpcFightCustom?.get(1);
  const eliteScale = elite && Number(eliteRow?.elite_scale) > 0 ? Number(eliteRow.elite_scale) : 1;
  return { ratios, eliteScale };
}

export function applyNpcScaling(stats, scale) {
  const factor = key => ((scale?.ratios?.get(key) ?? ATTR_SCALE) / ATTR_SCALE) * Number(scale?.eliteScale ?? 1);
  return {
    hp: Math.max(1, Math.round(Number(stats.hp ?? 1) * factor(FIGHT_ATTR.HP))),
    attack: Math.max(1, Math.round(Number(stats.attack ?? 1) * factor(FIGHT_ATTR.ATTACK))),
    physicalDefense: Math.max(0, Math.round(Number(stats.physicalDefense ?? 0) * factor(FIGHT_ATTR.PHYSICAL_DEFENSE))),
    magicDefense: Math.max(0, Math.round(Number(stats.magicDefense ?? 0) * factor(FIGHT_ATTR.MAGIC_DEFENSE))),
    critRate: Math.max(0, Math.round(Number(stats.critRate ?? 0))),
    critHarm: Math.max(0, Math.round(Number(stats.critHarm ?? 0))),
    speed: Math.max(0, Math.round(Number(stats.speed ?? 0)))
  };
}

export function primaryLineup(model, lineupType = 1) {
  const lineups = model?.playLineups ?? [];
  return lineups.find(lineup => Number(lineup?.type) === Number(lineupType))
    ?? lineups.find(lineup => (lineup?.team_list ?? []).some(team => (team?.fighter_list ?? []).length > 0))
    ?? null;
}

export function lineupFighters(model, lineup) {
  const heroes = new Map((model?.heroInfo?.hero_list ?? []).map(hero => [String(hero.uid), hero]));
  const result = [];
  for (const team of lineup?.team_list ?? []) {
    for (const fighter of team?.fighter_list ?? []) {
      const hero = heroes.get(String(fighter.hero_id));
      if (hero) result.push({ hero, teamId: Number(team.team_id ?? 1), loc: Number(fighter.loc ?? 0) });
    }
  }
  return result;
}

export function assembleLineup({ model, lineupType = 1, heroTables, attributeTables = readAttributeTables(), lineup = null }) {
  const target = lineup ?? primaryLineup(model, lineupType);
  if (!target) fail(5, 'Lineup state missing');
  const entries = lineupFighters(model, target).map(({ hero, teamId, loc }) => ({
    ...assembleHeroAttributes({ hero, heroTables, attributeTables }),
    hero, teamId, loc
  }));
  const totalPower = entries.reduce((sum, entry) => sum + entry.power, 0);
  const teamPowers = new Map();
  for (const entry of entries) teamPowers.set(entry.teamId, (teamPowers.get(entry.teamId) ?? 0) + entry.power);
  return { lineupType: Number(target.type ?? lineupType), entries, totalPower, teamPowers, notes: ['power-formula-compatibility'] };
}

// pb_attr_lineup_all_info payload for req_role_attr_info (1316). The raw
// pb_attr_obj list stays empty because the play_type taxonomy is not recovered;
// the final per-entity attributes, skills and lineup power are authoritative.
export function buildLineupAttrInfo({ model, lineupType = 1, heroTables, attributeTables = readAttributeTables() }) {
  const assembled = assembleLineup({ model, lineupType, heroTables, attributeTables });
  const attrList = assembled.entries.map(entry => {
    const loadout = buildHeroSkillLoadout({ hero: entry.hero, heroTables });
    return {
      tid: entry.uid ?? String(entry.tid),
      fight_attr_list: Object.entries(entry.fightAttrs).map(([key, value]) => ({ key: Number(key), value: String(Math.max(0, Math.round(Number(value)))) })),
      skills: loadout.abilityIds,
      team_attrs: [],
      base_attr_list: [
        { key: FIGHT_ATTR.HP, value: String(entry.stats.hp) },
        { key: FIGHT_ATTR.ATTACK, value: String(entry.stats.attack) },
        { key: FIGHT_ATTR.PHYSICAL_DEFENSE, value: String(entry.stats.physicalDefense) },
        { key: FIGHT_ATTR.MAGIC_DEFENSE, value: String(entry.stats.magicDefense) }
      ]
    };
  });
  return {
    attr_list: [],
    lineup_attr: {
      lineup_type: assembled.lineupType,
      attr_list: attrList,
      lineup_power: String(assembled.totalPower),
      team_power_list: [...assembled.teamPowers].map(([teamId, power]) => ({ team_id: teamId, power: String(power) }))
    }
  };
}
