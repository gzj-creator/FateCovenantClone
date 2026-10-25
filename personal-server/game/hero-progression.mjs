export class GameError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(1, 'Invalid progression value');
  return value;
};
function heroByUid(model, uid) {
  const hero = model.heroInfo.hero_list.find(hero => String(hero.uid) === String(uid));
  if (!hero) fail(3001, 'Hero does not exist');
  return hero;
}
function cellHeroes(model, index, uid) {
  integer(index, 1, 100);
  const cell = model.heroInfo.cell_list.find(cell => cell.index === index);
  if (!cell) fail(3029, 'Hero cell does not exist');
  const fighters = (model.lineups.pre_lineups ?? []).flatMap(pre => pre.lineup?.fighter_list ?? []).filter(fighter => fighter.index === index);
  const ids = new Set(fighters.map(fighter => String(fighter.hero_id)));
  if (!ids.size || (uid !== undefined && !ids.has(String(uid)))) fail(3001, 'Hero is not assigned to this cell');
  return { cell, heroes: [...ids].map(id => heroByUid(model, id)) };
}
function consume(model, costs, insufficientCode = 301) {
  const totals = new Map();
  for (const [tid, count] of costs) {
    if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count < 0) fail(5, 'Invalid progression cost configuration');
    totals.set(String(tid), (totals.get(String(tid)) ?? 0n) + BigInt(count));
  }
  for (const [tid, count] of totals) if (BigInt(model.resources.get(tid)?.num ?? 0) < count) fail(insufficientCode, 'Insufficient progression material');
  const changes = [];
  for (const [tid, count] of totals) {
    if (count === 0n) continue;
    const resource = model.resources.get(tid);
    resource.num = (BigInt(resource.num) - count).toString();
    changes.push({ tid, new_num: resource.num, diff_num: (-count).toString() });
  }
  return { changes };
}
export function createHeroProgression({ store, codec, tables }) {
  function upgrade(model, request) {
    const count = integer(request.up_lv_count, 1, 299);
    const { cell, heroes } = cellHeroes(model, request.cell_index, request.hero_uid);
    const level = cell.level ?? 1, target = level + count;
    if (target > 300) fail(3010, 'Hero is at maximum level');
    if (target > model.role.level * tables.DevelopConst.get(1).hero_lv_rate) fail(3023, 'Hero level exceeds role level');
    const stage = tables.UpStage.get(cell.break_level ?? 0);
    if (stage && target > stage.need_hero_lv) fail(331, 'Hero breakthrough required');
    const costs = [];
    for (let current = level; current < target; current++) {
      const config = tables.UpLevel.get(current);
      if (!config) fail(5, 'Hero level configuration missing');
      costs.push(...config.cost_item);
    }
    const res = consume(model, costs);
    cell.level = target;
    for (const hero of heroes) hero.level = target;
    return { schema: 'pb_hero_up_lv_ret', value: { res, new_lv: target, change_hero_list: heroes } };
  }
  function breakthrough(model, index) {
    const { cell, heroes } = cellHeroes(model, index);
    const current = cell.break_level ?? 0, config = tables.UpStage.get(current);
    if (!config) fail(3024, 'Hero breakthrough limit reached');
    if ((cell.level ?? 1) < config.need_hero_lv) fail(3025, 'Hero level is too low for breakthrough');
    const res = consume(model, config.cost_item);
    cell.break_level = current + 1;
    for (const hero of heroes) hero.breakthrough_level = cell.break_level;
    return { schema: 'pb_hero_break_ret', value: { res, new_break_lv: cell.break_level, change_hero_list: heroes } };
  }
  function star(model, request) {
    if (!Array.isArray(request) || request.length !== 2) fail(1, 'Invalid hero star request');
    const [uid, requested] = request, count = integer(requested, 1, 6);
    const hero = heroByUid(model, uid), config = tables.Hero.get(Number(hero.tid));
    if (!config) fail(5, 'Hero configuration missing');
    const current = hero.star ?? 0, progress = hero.star_progress ?? 0;
    if (current >= config.max_star) fail(305, 'Hero star limit reached');
    // Five-star trials use separate commands and cannot be skipped by this request.
    if (current >= 5) fail(3021, 'Hero star trial required');
    if (progress < 0 || progress >= 6 || count > 6 - progress) fail(3004, 'Invalid hero star progress');
    const cost = tables.UpStarCost.get(config.quality * 100 + current);
    if (!cost || !config.chip) fail(5, 'Hero star cost missing');
    const res = consume(model, [[config.chip, cost.piece_num * count]], 3006);
    hero.star = current + Math.floor((progress + count) / 6);
    hero.star_progress = (progress + count) % 6;
    return { schema: 'pb_hero_up_star_ret', value: { res, new_hero: hero } };
  }
  return {
    supports: type => [636, 638, 639].includes(type),
    execute(type, request) {
      return store.transaction(model => {
        const response = type === 636 ? upgrade(model, request) : type === 638 ? breakthrough(model, request) : type === 639 ? star(model, request) : fail(1, 'Invalid hero command');
        // Encoding must succeed before the transaction commits.
        return { ...response, data: codec.pack(response.schema, response.value) };
      });
    }
  };
}
