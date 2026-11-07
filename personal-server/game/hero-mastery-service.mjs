import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';

// HeroTable Mastery* families own the whole "专精" ruleset:
//   Mastery[hero tid]          -> { mastery_group }
//   MasteryGroup[group]        -> { level_range, break_range } (MasteryLevel/MasteryBreak tids)
//   MasteryLevel[tid]          -> { chip, cost_res, attr } for one level
//   MasteryBreak[tid]          -> { chip, cost_res, attr, mastery_break, mastery_level_limit }
//   MasteryConst[1].unlock_star -> hero star required before mastery opens
// The hero row itself stores the authoritative progress in
// hero.mastery_level / hero.mastery_break (hero.db.proto master=16/17), and the
// login module 10 payload is re-encoded from that roster on every commit.
const LEVEL_UP_TYPE = 659;
const BREAK_TYPE = 660;
const MAX_UINT32 = 0xffffffff;

const fail = (code, message) => { throw new GameError(code, message); };

function uint32(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > MAX_UINT32) fail(5, 'Invalid hero mastery ' + field);
  return number;
}

// The Lua client (HeroMasteryMgr) sends { tid = hero.tid } to both commands.
// Accept the bare id, an ETF list and the table shapes so the handler is not
// tied to one argon/table encoding.
export function masteryRequestTid(request) {
  // decodeEtf wraps argon lists as { value: [...], improper }, and a Lua table
  // arrives as a plain object, so unwrap the list before reading the field.
  const unwrapped = request && typeof request === 'object' && !Array.isArray(request) && Array.isArray(request.value)
    ? request.value
    : request;
  const candidate = Array.isArray(unwrapped)
    ? unwrapped.length === 1 ? unwrapped[0] : undefined
    : unwrapped && typeof unwrapped === 'object'
      ? unwrapped.tid ?? unwrapped.hero_tid ?? unwrapped.heroTid
      : unwrapped;
  const tid = Number(candidate);
  if (!Number.isSafeInteger(tid) || tid <= 0) fail(1, 'Invalid hero mastery hero tid');
  return tid;
}

function costList(value) {
  if (!Array.isArray(value)) fail(5, 'Hero mastery cost configuration is missing');
  return value.map(entry => {
    const tid = Number(entry?.[0] ?? entry?.tid ?? 0);
    const count = Number(entry?.[1] ?? entry?.num ?? 0);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count < 0) {
      fail(5, 'Hero mastery cost configuration is invalid');
    }
    return [tid, count];
  });
}

// Read-only view for battle/skill wiring: the unlocked mastery state plus the
// hero's configured mastery ability id. Callers that build a battle unit can
// use 'unlocked/level/break' to decide whether the Mastery-type skill applies.
export function heroMasteryView(hero, heroTables) {
  const tid = Number(hero?.tid ?? 0);
  const groupRow = heroTables?.Mastery?.get(tid) ?? null;
  const group = groupRow ? heroTables?.MasteryGroup?.get(Number(groupRow.mastery_group)) ?? null : null;
  const breakRows = (group?.break_range ?? []).map(tidValue => heroTables?.MasteryBreak?.get(Number(tidValue))).filter(Boolean);
  const unlockStar = Number(heroTables?.MasteryConst?.get(1)?.unlock_star ?? 0);
  const level = Number(hero?.mastery_level ?? 0);
  const masteryBreak = Number(hero?.mastery_break ?? 0);
  let limit = 0;
  let attr = [];
  for (const row of breakRows) {
    if (Number(row.mastery_break) <= masteryBreak) {
      limit = Number(row.mastery_level_limit ?? 0);
      attr = row.attr ?? [];
    }
  }
  const ability = heroTables?.Ability?.get(tid) ?? null;
  return {
    configured: Boolean(group),
    group: group ? Number(group.tid) : null,
    unlocked: Boolean(group) && Number(hero?.star ?? 0) >= unlockStar,
    unlock_star: unlockStar,
    level,
    break: masteryBreak,
    level_limit: limit,
    max_break: breakRows.length,
    mastery_ability: ability ? Number(ability.mastery_ability ?? 0) : 0,
    break_attr: attr
  };
}

export function createHeroMasteryService({ store, codec, heroTables }) {
  const mastery = heroTables?.Mastery;
  const groups = heroTables?.MasteryGroup;
  const levels = heroTables?.MasteryLevel;
  const breaks = heroTables?.MasteryBreak;
  const constant = heroTables?.MasteryConst?.get(1);
  if (!mastery?.size || !groups?.size || !levels?.size || !breaks?.size || !constant) throw new Error('Hero mastery configuration is missing');
  const unlockStar = Number(constant.unlock_star ?? 0);

  function groupOf(heroTid) {
    const row = mastery.get(heroTid);
    if (!row) return null;
    return groups.get(Number(row.mastery_group)) ?? null;
  }

  function breakRowsOf(group) {
    return (group?.break_range ?? []).map(tidValue => breaks.get(Number(tidValue))).filter(Boolean);
  }

  // MasteryBreak.mastery_level_limit is the level cap a break opens (the client
  // shows the difference as HERO_MASTERY_BREAK_LIMIT_ADD). An unbroken hero is
  // therefore capped at 0 and must break first, which matches the state machine
  // behind HeroMasteryMgr.GetCurShowState's BREAK/LEVEL states.
  function levelLimitOf(group, masteryBreak) {
    let limit = 0;
    for (const row of breakRowsOf(group)) if (Number(row.mastery_break) <= masteryBreak) limit = Number(row.mastery_level_limit ?? 0);
    return limit;
  }

  function levelCostOf(group, level) {
    const rowTid = group?.level_range?.[level - 1];
    const row = rowTid === undefined ? null : levels.get(Number(rowTid));
    if (!row) fail(3014, 'Hero mastery level configuration is missing');
    return row;
  }

  function resolveHero(model, request) {
    const tid = masteryRequestTid(request);
    const hero = (model.heroInfo.hero_list ?? []).find(row => Number(row.tid) === tid);
    if (!hero) fail(3001, 'Hero does not exist');
    const group = groupOf(tid);
    if (!group) fail(3008, 'Hero has no mastery configuration');
    const heroConfig = heroTables.Hero?.get(tid);
    if (!heroConfig) fail(5, 'Hero configuration missing');
    if (Number(hero.star ?? 0) < unlockStar) fail(3019, 'Hero mastery is locked');
    return { hero, group, heroConfig };
  }

  function spendCosts(model, row, heroConfig, label) {
    const costs = costList(row.cost_res);
    const chipCount = Number(row.chip ?? 0);
    if (chipCount > 0) {
      const chipTid = Number(heroConfig.chip ?? 0);
      if (!Number.isSafeInteger(chipTid) || chipTid <= 0) fail(3014, 'Hero chip configuration is missing for mastery');
      costs.push([chipTid, chipCount]);
    }
    if (!costs.length) fail(5, 'Hero mastery ' + label + ' cost configuration is missing');
    return consumeResources(model, costs, 301);
  }

  function levelUp(model, request) {
    const { hero, group, heroConfig } = resolveHero(model, request);
    const current = uint32(hero.mastery_level, 'mastery_level');
    const masteryBreak = uint32(hero.mastery_break, 'mastery_break');
    const limit = levelLimitOf(group, masteryBreak);
    if (limit <= 0) fail(3015, 'Hero mastery breakthrough is required before levelling');
    if (current >= limit) fail(3011, 'Hero mastery level limit reached');
    const row = levelCostOf(group, current + 1);
    const res = spendCosts(model, row, heroConfig, 'level');
    hero.mastery_level = current + 1;
    return { schema: 'pb_hero_mastery_level_up_rsp', value: { hero, res: { changes: res.changes, is_overflow: false } } };
  }

  function breakthrough(model, request) {
    const { hero, group, heroConfig } = resolveHero(model, request);
    const current = uint32(hero.mastery_break, 'mastery_break');
    const row = breakRowsOf(group).find(candidate => Number(candidate.mastery_break) === current + 1);
    if (!row) fail(3012, 'Hero mastery breakthrough limit reached');
    const res = spendCosts(model, row, heroConfig, 'break');
    hero.mastery_break = current + 1;
    return { schema: 'pb_hero_mastery_break_rsp', value: { hero, res: { changes: res.changes, is_overflow: false } } };
  }

  return {
    supports: type => type === LEVEL_UP_TYPE || type === BREAK_TYPE,
    heroMasteryView: hero => heroMasteryView(hero, heroTables),
    execute(type, request) {
      return store.transaction(model => {
        const response = type === LEVEL_UP_TYPE ? levelUp(model, request)
          : type === BREAK_TYPE ? breakthrough(model, request)
            : fail(1, 'Invalid hero mastery command');
        // Encoding must succeed before the transaction commits.
        return { ...response, data: codec.pack(response.schema, response.value) };
      });
    }
  };
}

