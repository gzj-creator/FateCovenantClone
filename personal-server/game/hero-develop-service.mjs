import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';
import { readHeroDevelopTables } from '../config/hero-develop-tables.mjs';

// HeroCmd 637 (req_develop_submit_hero), 641 (req_develop_hero_trial), 656
// (req_develop_batch_submit_hero) and 666 (req_one_key_develop). The dispatch in
// gateway.mjs is shared: this module owns the request decoding and the business
// rules for its own type list.
// Contract: agent/workflow/gameplay-completion/HERO-HERO-B/service-contract.md
const COMMAND_SUBMIT_HERO = 637;
const COMMAND_HERO_TRIAL = 641;
const COMMAND_BATCH_SUBMIT_HERO = 656;
const COMMAND_ONE_KEY_UP = 666;
const SUPPORTED = [COMMAND_SUBMIT_HERO, COMMAND_HERO_TRIAL, COMMAND_BATCH_SUBMIT_HERO, COMMAND_ONE_KEY_UP];

const HERO_MODULE_ID = 10;
// pb_lineup_login module: owns pre_lineup and the saved custom presets.
const LINEUP_MODULE_ID = 9;
// HeroDataMgr.LoginParse decodes module 10 zero-based; slot 6 is Lua login[7]
// and holds pb_role_hero_trial.
const TRIAL_SLOT = 6;
// HeroDataMgr.HERO_CELL_MAX_INDEX = 6 (HeroDevelopMgr:HERO_CELL_MAX_INDEX).
const CELL_MAX_INDEX = 6;
// HeroRisingStarMgr.FIRST_STAGE_STAR_C = 5 and MAX_PROGRESS = 6.
const FIRST_MAX_STAR = 5;
const STAR_PROGRESS_MAX = 6;
// DevelopConst.keep_trial_type = [6702]: the hero trail task type.
const TRIAL_TASK_TYPE = 6702;
const DEFAULT_MAX_STAR = 10;

const CODE_INVALID = 1;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;
const CODE_LOCKED = 305;
const CODE_CONTENT = 3001;
const CODE_CHIP_INSUFFICIENT = 3006;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveTid(value, field) {
  const tid = Number(value ?? 0);
  if (!Number.isSafeInteger(tid) || tid <= 0) fail(CODE_INVALID, 'Invalid hero ' + field);
  return tid;
}

function cellIndexValue(value, field) {
  const index = Number(value ?? 0);
  if (!Number.isSafeInteger(index) || index < 1 || index > CELL_MAX_INDEX) fail(CODE_INVALID, 'Invalid hero ' + field);
  return index;
}

function lineupPositionValue(value, field) {
  const position = Number(value ?? 0);
  if (!Number.isSafeInteger(position) || position < 0 || position > CELL_MAX_INDEX) fail(CODE_INVALID, 'Invalid hero ' + field);
  return position;
}

function hasEnough(model, tid, count) {
  return BigInt(model.resources.get(String(tid))?.num ?? 0) >= BigInt(count);
}

export function createHeroDevelopService({
  store, codec, tables, heroTables, developTables = readHeroDevelopTables(),
  now = () => Date.now(), random = Math.random, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  void now; void random; void tables;
  const cellTable = developTables.Cell;
  const trialTaskTable = developTables.TrialTask;
  if (!cellTable?.size) throw new Error('Hero cell configuration is missing');
  if (!trialTaskTable?.size) throw new Error('Hero trail task configuration is missing');
  if (!heroTables.Hero?.size) throw new Error('Hero configuration is missing');
  if (!heroTables.Quality?.size) throw new Error('Hero quality configuration is missing');
  if (!heroTables.UpStarCost?.size) throw new Error('Hero star cost configuration is missing');

  function heroConfig(tid) {
    const config = heroTables.Hero.get(tid);
    if (!config) fail(CODE_STATE, 'Hero configuration is missing');
    return config;
  }

  function ownedHero(model, tid) {
    const hero = (model.heroInfo.hero_list ?? []).find(entry => Number(entry.tid) === tid);
    if (!hero) fail(CODE_CONTENT, 'Hero is not owned');
    return hero;
  }

  function cellList(model) {
    model.heroInfo.cell_list ??= [];
    return model.heroInfo.cell_list;
  }

  function openCell(model, index) {
    return cellList(model).find(entry => Number(entry.index) === index) ?? null;
  }

  function currentPreLineup(model) {
    const presets = model.lineups?.pre_lineups ?? [];
    if (!presets.length) fail(CODE_STATE, 'Hero pre lineup is missing');
    const current = Number(model.lineups?.cur_pre_index ?? 0);
    return presets.find(preset => Number(preset.index) === current) ?? presets[0];
  }

  function fighterList(preset) {
    preset.lineup ??= {};
    preset.lineup.fighter_list ??= [];
    return preset.lineup.fighter_list;
  }

  // pb_single_hero documents that a hero copies the cell level/breakthrough
  // level while it sits in a cell and returns to level 1 / break 0 otherwise.
  // pb_lineup_fighter.index is the develop cell of that hero, so the authoritative
  // hero level is always derived from the cell it is assigned to.
  function heroCellMap(model) {
    const map = new Map();
    const assign = list => {
      for (const fighter of list ?? []) {
        const tid = Number(fighter?.hero_id ?? 0);
        const index = Number(fighter?.index ?? 0);
        if (tid > 0 && index > 0) map.set(tid, index);
      }
    };
    for (const lineup of model.playLineups ?? []) for (const team of lineup.team_list ?? []) assign(team.fighter_list);
    // Saved custom presets (pb_custom_lineup_role nested in the lineup login
    // module) also carry the cell of every hero they hold.
    try {
      const lineupModule = new Map(model.state.modules.value).get(LINEUP_MODULE_ID);
      const lineupBytes = lineupModule ? rawBinary(lineupModule) : Buffer.alloc(0);
      if (lineupBytes.length) {
        const login = codec.unpack('pb_lineup_login', lineupBytes);
        const custom = login.custom_pre_lineup
          ? codec.unpack('pb_custom_lineup_role', Buffer.from(login.custom_pre_lineup, 'base64'))
          : null;
        for (const item of custom?.custom_pre_lineups ?? []) assign(item?.lineup?.fighter_list);
      }
    } catch { /* a malformed preset must not block the develop commands */ }
    for (const preset of model.lineups?.pre_lineups ?? []) {
      if (Number(preset?.index) === Number(model.lineups?.cur_pre_index ?? 0)) continue;
      assign(preset?.lineup?.fighter_list);
    }
    // The current preset wins so a hero borrowed by another preset still reads
    // the cell it occupies on the screen the player is looking at.
    assign((model.lineups?.pre_lineups ?? []).find(preset => Number(preset?.index) === Number(model.lineups?.cur_pre_index ?? 0))?.lineup?.fighter_list);
    return map;
  }

  function syncHeroCellState(model) {
    const map = heroCellMap(model);
    const changed = [];
    for (const hero of model.heroInfo.hero_list ?? []) {
      const cell = openCell(model, map.get(Number(hero.tid)) ?? 0);
      const level = cell ? Number(cell.level ?? 1) : 1;
      const breakLevel = cell ? Number(cell.break_level ?? 0) : 0;
      if (Number(hero.level ?? 1) === level && Number(hero.breakthrough_level ?? 0) === breakLevel) continue;
      hero.level = level;
      hero.breakthrough_level = breakLevel;
      changed.push(hero);
    }
    return changed;
  }

  function heroLevels(model) {
    return new Map((model.heroInfo.hero_list ?? []).map(hero => [Number(hero.tid), {
      level: Number(hero.level ?? 1),
      breakLevel: Number(hero.breakthrough_level ?? 0)
    }]));
  }

  function levelsChangedSince(model, before) {
    return (model.heroInfo.hero_list ?? []).filter(hero => {
      const previous = before.get(Number(hero.tid));
      if (!previous) return false;
      return previous.level !== Number(hero.level ?? 1) || previous.breakLevel !== Number(hero.breakthrough_level ?? 0);
    });
  }

  // Battle positions are unique inside a preset. The client keeps them unique
  // itself (PreLineupUtils exchanges loc), so only reclaim a position that is
  // already taken.
  function freePosition(fighters, except) {
    const used = new Set(fighters.filter(fighter => fighter !== except).map(fighter => Number(fighter.loc ?? 0)));
    let candidate = 1;
    while (candidate <= CELL_MAX_INDEX && used.has(candidate)) candidate++;
    return candidate <= CELL_MAX_INDEX ? candidate : 0;
  }

  // Moves one fighter onto an explicit battle position. The previous owner of
  // that position (if any) is pushed onto the position the fighter vacates, or
  // onto the first free one when the fighter is entering the lineup for the
  // first time. PreLineupUtils treats lineup_pos as authoritative, so the
  // server may not silently renumber the whole lineup. The guard below only
  // repairs duplicates left by older saves.
  function normalisePositions(fighters) {
    const used = new Set();
    for (const fighter of fighters) {
      const position = Number(fighter.loc ?? 0);
      if (position > 0 && position <= CELL_MAX_INDEX && !used.has(position)) {
        used.add(position);
        continue;
      }
      let free = 1;
      while (free <= CELL_MAX_INDEX && used.has(free)) free++;
      if (free > CELL_MAX_INDEX) continue;
      fighter.loc = free;
      used.add(free);
    }
  }

  function assignPosition(fighters, fighter, position) {
    const current = Number(fighter.loc ?? 0);
    const occupant = fighters.find(other => other !== fighter && Number(other.loc ?? 0) === position) ?? null;
    if (occupant && occupant !== fighter) {
      // Swap into the position the moving fighter leaves behind, falling back
      // to the first free slot when the fighter had none.
      const replacement = current > 0 && current <= CELL_MAX_INDEX && current !== position
        ? current
        : freePosition(fighters, occupant);
      if (replacement) occupant.loc = replacement;
    }
    fighter.loc = position;
  }

  function placeHero(fighters, heroTid, cellIndex, position) {
    const previous = fighters.find(fighter => Number(fighter.hero_id) === heroTid) ?? null;
    const occupant = fighters.find(fighter => Number(fighter.index) === cellIndex && Number(fighter.hero_id) !== heroTid) ?? null;
    if (previous && occupant) {
      // Both cells are taken: exchange them so neither hero loses its cell.
      const previousIndex = Number(previous.index ?? 0);
      const previousPosition = Number(previous.loc ?? 0) || previousIndex;
      previous.index = cellIndex;
      assignPosition(fighters, previous, position);
      occupant.index = previousIndex || cellIndex;
      if (Number(occupant.loc ?? 0) !== previousPosition) occupant.loc = previousPosition || freePosition(fighters, occupant);
    } else if (previous) {
      previous.index = cellIndex;
      assignPosition(fighters, previous, position);
    } else {
      // The occupant is replaced and returns to the roster; syncHeroCellState
      // resets its level to the unassigned values.
      if (occupant) fighters.splice(fighters.indexOf(occupant), 1);
      const added = { hero_id: String(heroTid), index: cellIndex, loc: position, equip_ids: [], relic_ids: [] };
      fighters.push(added);
      assignPosition(fighters, added, position);
    }
    normalisePositions(fighters);
  }

  function applySubmit(model, request) {
    const heroTid = positiveTid(request?.hero_tid, 'submit hero tid');
    const cellIndex = cellIndexValue(request?.cell_index, 'cell index');
    const position = lineupPositionValue(request?.lineup_pos, 'lineup position') || cellIndex;
    ownedHero(model, heroTid);
    heroConfig(heroTid);
    if (!openCell(model, cellIndex)) fail(CODE_LOCKED, 'Hero cell is locked');
    const preset = currentPreLineup(model);
    placeHero(fighterList(preset), heroTid, cellIndex, position);
    return { heroTid, cellIndex, position, preset };
  }

  function submitHero(request) {
    return store.transaction(model => {
      const before = heroLevels(model);
      const applied = applySubmit(model, request);
      syncHeroCellState(model);
      const value = {
        cell_list: cellList(model),
        change_hero_list: levelsChangedSince(model, before),
        // The client rebuilds the played lineup locally (PreLineupUtils) and
        // only reads cell_list/change_hero_list from this reply.
        change_lineup: [],
        cur_pre_lineup: applied.preset
      };
      const data = codec.pack('pb_hero_submit_ret', value);
      log({ event: 'hero_submit_committed', heroTid: applied.heroTid, cellIndex: applied.cellIndex, position: applied.position });
      return { schema: 'pb_hero_submit_ret', value, data, valueForLog: { heroTid: applied.heroTid, cellIndex: applied.cellIndex } };
    });
  }

  function batchSubmitHero(request) {
    const list = Array.isArray(request?.hero_list) ? request.hero_list : [];
    if (!list.length) fail(CODE_INVALID, 'Hero submit list is empty');
    return store.transaction(model => {
      const before = heroLevels(model);
      const seen = new Set();
      // Validate the whole batch before the first mutation so an invalid entry
      // leaves the save untouched.
      for (const entry of list) {
        const heroTid = positiveTid(entry?.hero_tid, 'submit hero tid');
        if (seen.has(heroTid)) fail(CODE_INVALID, 'Duplicate hero in submit list');
        seen.add(heroTid);
        cellIndexValue(entry?.cell_index, 'cell index');
        lineupPositionValue(entry?.lineup_pos, 'lineup position');
        ownedHero(model, heroTid);
        if (!openCell(model, cellIndexValue(entry?.cell_index, 'cell index'))) fail(CODE_LOCKED, 'Hero cell is locked');
      }
      let preset = currentPreLineup(model);
      const applied = [];
      for (const entry of list) applied.push(applySubmit(model, entry));
      preset = currentPreLineup(model);
      syncHeroCellState(model);
      const value = {
        cell_list: cellList(model),
        change_hero_list: levelsChangedSince(model, before),
        change_lineup: [],
        cur_pre_lineup: preset
      };
      const data = codec.pack('pb_hero_submit_ret', value);
      log({ event: 'hero_batch_submit_committed', heroes: applied.length });
      return { schema: 'pb_hero_submit_ret', value, data, valueForLog: { heroes: applied.map(entry => entry.heroTid) } };
    });
  }

  function qualityOf(hero, config) {
    return Number(hero.quality ?? config.quality ?? 0);
  }

  function nextQuality(quality) {
    const values = [...heroTables.Quality.keys()].map(Number).sort((left, right) => left - right);
    return values.find(value => value > quality) ?? 0;
  }

  function trialTasksOf(row) {
    const raw = Array.isArray(row?.task) ? row.task : [];
    return raw.map(entry => {
      const list = Array.isArray(entry) ? entry : [entry, 0];
      return { type: Number(list[0] ?? 0), target: Number(list[1] ?? 0) };
    }).filter(task => task.type > 0 && task.target > 0);
  }

  function trialBaseline(model, heroTid) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE_ID);
    const bytes = module?.value?.[TRIAL_SLOT] ? rawBinary(module.value[TRIAL_SLOT]) : Buffer.alloc(0);
    if (!bytes.length) return 0;
    let data;
    try { data = codec.unpack('pb_role_hero_trial', bytes); } catch { return 0; }
    const record = (data.hero_trial ?? []).find(entry => Number(entry?.hero_tid) === heroTid);
    const progress = (record?.task_progress ?? []).find(entry => Number(entry?.type) === TRIAL_TASK_TYPE);
    return Number(progress?.progress ?? 0);
  }

  function writeTrialProgress(model, heroTid, progress) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(CODE_STATE, 'Hero login module is missing');
    const bytes = module.value[TRIAL_SLOT] ? rawBinary(module.value[TRIAL_SLOT]) : Buffer.alloc(0);
    const data = bytes.length ? codec.unpack('pb_role_hero_trial', bytes) : { hero_trial: [] };
    data.hero_trial ??= [];
    let record = data.hero_trial.find(entry => Number(entry?.hero_tid) === heroTid);
    if (!record) {
      record = { hero_tid: heroTid, task_progress: [] };
      data.hero_trial.push(record);
    }
    record.task_progress ??= [];
    const existing = record.task_progress.find(entry => Number(entry?.type) === TRIAL_TASK_TYPE);
    if (existing) existing.progress = progress;
    else record.task_progress.push({ type: TRIAL_TASK_TYPE, progress });
    while (module.value.length <= TRIAL_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[TRIAL_SLOT] = serializedBinary(codec.pack('pb_role_hero_trial', data));
    model.state.modules.value = [...modules];
    return { hero_tid: heroTid, task_progress: [{ type: TRIAL_TASK_TYPE, progress }] };
  }

  function allowedStones(config, quality) {
    const row = heroTables.UpStarStone?.get(Number(config.camp ?? 0) * 1000 + quality);
    return (row?.item ?? []).map(Number).filter(tid => Number.isSafeInteger(tid) && tid > 0);
  }

  // Validates the optional stone selection and returns the requested tid, or 0
  // when the caller left the choice to the server.
  function parseStoneSelection(selections, stones, count) {
    if (!stones.length) fail(CODE_STATE, 'Hero awakening stone configuration is missing');
    if (!selections.length) return 0;
    const totals = new Map();
    for (const entry of selections) {
      const tid = Number(entry?.tid ?? 0);
      if (!Number.isSafeInteger(tid) || tid <= 0 || !stones.includes(tid)) fail(CODE_INVALID, 'Invalid awakening stone');
      if (totals.has(tid)) fail(CODE_INVALID, 'Duplicate awakening stone type');
      const requested = BigInt(entry?.num ?? 0);
      // The client sends the stone type and leaves pb_res_obj.num at its
      // protobuf default; the authoritative quantity is UpStarCost.stone_num.
      if (requested !== 0n && requested !== BigInt(count)) fail(CODE_INVALID, 'Invalid awakening stone quantity');
      totals.set(tid, count);
    }
    if (totals.size !== 1) fail(CODE_INVALID, 'Exactly one awakening stone type must be selected');
    return [...totals.keys()][0];
  }

  // Trail shortcuts that carry no stone take the first allowed stone the save
  // can pay with.
  function pickStone(model, requested, stones, count) {
    if (requested) return requested;
    const chosen = stones.find(tid => hasEnough(model, tid, count));
    if (!chosen) fail(CODE_INSUFFICIENT, 'Insufficient awakening stone');
    return chosen;
  }

  // HeroTrailMgr.GetNextQualityAttr finds the next QualityList row and indexes
  // HighStarAddAttr with star + 1, so one trail advances both the quality and
  // the star. HeroDevelopMgr applies rsp.new_quality/new_star verbatim.
  function applyTrialOutcome(hero, quality, star) {
    hero.quality = quality;
    hero.star = star + 1;
    hero.star_progress = 0;
    return { quality: hero.quality, star: hero.star };
  }

  function heroTrial(request) {
    const heroTid = positiveTid(request?.hero_tid, 'trial hero tid');
    const selections = Array.isArray(request?.res) ? request.res : [];
    return store.transaction(model => {
      const hero = ownedHero(model, heroTid);
      const config = heroConfig(heroTid);
      const quality = qualityOf(hero, config);
      const star = Number(hero.star ?? 0);
      if (star !== FIRST_MAX_STAR) fail(CODE_STATE, 'Hero is not at the trail star stage');
      const row = trialTaskTable.get(heroTid * 100 + quality);
      if (!row) fail(CODE_LOCKED, 'Hero trail is not available for this quality');
      const tasks = trialTasksOf(row);
      if (!tasks.length) fail(CODE_STATE, 'Hero trail task configuration is missing');
      // TaskTable.Type[6702] counts the hero star total, so the trail is ready
      // once the hero reached the target star. The local server has no task
      // subsystem for 6702 and uses the star total minus the login slot 6
      // baseline as the progress proxy; a missing baseline counts from zero.
      const progress = Math.max(0, star - trialBaseline(model, heroTid));
      for (const task of tasks) if (progress < task.target) fail(CODE_STATE, 'Hero trail task is not finished');
      const qualityRow = heroTables.Quality.get(quality);
      const chipTid = Number(config.chip ?? 0);
      const cost = heroTables.UpStarCost.get(quality * 100 + star);
      // HeroRisingStarMgr.GetElevateHeroStarChipCount prices the trail with
      // Quality.trial_piece_num; the awakening stones follow the same
      // UpStarCost[quality * 100 + 5] row that command 640 also uses.
      const chipCount = Number(qualityRow?.trial_piece_num ?? 0);
      if (!chipTid || !Number.isSafeInteger(chipCount) || chipCount <= 0) fail(CODE_STATE, 'Hero trail chip cost is missing');
      const stoneCount = Number(cost?.stone_num ?? 0);
      if (!cost || !Number.isSafeInteger(stoneCount) || stoneCount <= 0) fail(CODE_STATE, 'Hero trail stone cost is missing');
      const stones = allowedStones(config, quality);
      const requestedStone = parseStoneSelection(selections, stones, stoneCount);
      const upgraded = nextQuality(quality);
      if (!upgraded) fail(CODE_LOCKED, 'Hero trail has no next quality');
      const chips = consumeResources(model, [[chipTid, chipCount]], CODE_CHIP_INSUFFICIENT);
      const stoneTid = pickStone(model, requestedStone, stones, stoneCount);
      const stoneChanges = consumeResources(model, [[stoneTid, stoneCount]], CODE_INSUFFICIENT).changes;
      const outcome = applyTrialOutcome(hero, upgraded, star);
      const trial = writeTrialProgress(model, heroTid, progress);
      const value = {
        res: { changes: [...chips.changes, ...stoneChanges], is_overflow: false },
        new_quality: outcome.quality,
        new_star: outcome.star,
        trial
      };
      const data = codec.pack('pb_hero_trial_ret', value);
      log({ event: 'hero_trial_committed', heroTid, fromQuality: quality, toQuality: outcome.quality, star: outcome.star });
      return { schema: 'pb_hero_trial_ret', value, data, valueForLog: { heroTid, quality: outcome.quality, star: outcome.star } };
    });
  }

  function upgradeToLimit(model, hero, config) {
    const changes = [];
    const maxStar = Number(config.max_star ?? DEFAULT_MAX_STAR);
    const chipTid = Number(config.chip ?? 0);
    for (let step = 0; step < 2 * DEFAULT_MAX_STAR; step++) {
      const quality = qualityOf(hero, config);
      const star = Number(hero.star ?? 0);
      if (star >= maxStar) break;
      const cost = heroTables.UpStarCost.get(quality * 100 + star);
      if (!cost) break;
      const progress = Number(hero.star_progress ?? 0);
      if (star < FIRST_MAX_STAR) {
        const count = STAR_PROGRESS_MAX - Math.min(Math.max(progress, 0), STAR_PROGRESS_MAX - 1);
        const need = Number(cost.piece_num ?? 0) * count;
        if (!chipTid || !Number.isSafeInteger(need) || need <= 0) break;
        if (!hasEnough(model, chipTid, need)) break;
        changes.push(...consumeResources(model, [[chipTid, need]], CODE_CHIP_INSUFFICIENT).changes);
        hero.star = star + 1;
        hero.star_progress = 0;
        continue;
      }
      // From the first star maximum the manual trail gate (641) takes over; a
      // one-key request never skips the TrialTask and stone prompt.
      if (star === FIRST_MAX_STAR && trialTaskTable.has(Number(hero.tid) * 100 + quality)) break;
      // Unrivaled qualities (>= TID_QA_WHITE) spend the high-star cost and
      // stones for every further star.
      const stoneCount = Number(cost.stone_num ?? 0);
      const chips = Number(cost.piece_num ?? 0);
      if (!Number.isSafeInteger(stoneCount) || stoneCount <= 0) break;
      if (!chipTid || !Number.isSafeInteger(chips) || chips <= 0) break;
      const stoneTid = allowedStones(config, quality).find(tid => hasEnough(model, tid, stoneCount));
      if (!stoneTid || !hasEnough(model, chipTid, chips)) break;
      const spent = consumeResources(model, [[chipTid, chips], [stoneTid, stoneCount]], CODE_INSUFFICIENT);
      changes.push(...spent.changes);
      hero.star = star + 1;
      hero.star_progress = 0;
      hero.up_star_high_consume = [...(hero.up_star_high_consume ?? []), {
        star: hero.star,
        up_star_high_consume_list: spent.changes.map(change => ({ tid: String(change.tid), num: String(-BigInt(change.diff_num)) }))
      }];
    }
    return { changes };
  }

  function oneKeyUpStar(request) {
    const requested = Array.isArray(request?.hero_tid_list) ? request.hero_tid_list.map(value => Number(value)) : [];
    return store.transaction(model => {
      const owned = new Map((model.heroInfo.hero_list ?? []).map(hero => [Number(hero.tid), hero]));
      let targets;
      if (requested.length) {
        const seen = new Set();
        for (const tid of requested) {
          positiveTid(tid, 'one key tid');
          if (seen.has(tid)) fail(CODE_INVALID, 'Duplicate hero in one key request');
          seen.add(tid);
          if (!owned.has(tid)) fail(CODE_CONTENT, 'Hero is not owned');
        }
        targets = requested;
      } else {
        // BagpackMgr sends req_one_key_develop without a list, so the request
        // means every owned hero.
        targets = [...owned.keys()].sort((left, right) => left - right);
      }
      const success = [], failed = [], changedHeroes = [], changes = [];
      for (const tid of targets) {
        const hero = owned.get(tid);
        const config = heroConfig(tid);
        const beforeStar = Number(hero.star ?? 0);
        const beforeQuality = qualityOf(hero, config);
        changes.push(...upgradeToLimit(model, hero, config).changes);
        const afterStar = Number(hero.star ?? 0);
        const afterQuality = qualityOf(hero, config);
        const change = {
          hero_tid: tid, before_star: beforeStar, after_star: afterStar,
          before_quality: beforeQuality, after_quality: afterQuality, success: afterStar > beforeStar
        };
        if (change.success) {
          success.push(change);
          changedHeroes.push(hero);
        } else failed.push(change);
      }
      const value = {
        res: { changes, is_overflow: false },
        success_hero_list: success,
        failed_hero_list: failed,
        change_hero_list: changedHeroes
      };
      const data = codec.pack('pb_hero_one_key_up_rsp', value);
      log({ event: 'hero_one_key_up_committed', success: success.length, failed: failed.length });
      return { schema: 'pb_hero_one_key_up_rsp', value, data, valueForLog: { success: success.length, failed: failed.length } };
    });
  }

  // Login repair: open the cells that carry no MethodScript gate, keep the
  // trial module slot well formed and re-derive every hero level from the cell
  // it occupies.
  function ensureLoginState() {
    return store.transaction(model => {
      const opened = [];
      const cells = cellList(model);
      for (const [key, row] of [...cellTable].sort((left, right) => Number(left[0]) - Number(right[0]))) {
        const index = Number(key);
        if (!Number.isSafeInteger(index) || index < 1 || index > CELL_MAX_INDEX) continue;
        // Rows 4-6 gate on a MethodScript assert that the local server cannot
        // evaluate; they stay closed until the client opens them.
        if (row?.assert) continue;
        if (cells.some(cell => Number(cell.index) === index)) continue;
        cells.push({ index, level: 1, break_level: 0 });
        opened.push(index);
      }
      cells.sort((left, right) => Number(left.index) - Number(right.index));
      const modules = new Map(model.state.modules.value);
      const module = modules.get(HERO_MODULE_ID);
      let trialSlot = false;
      if (module && Array.isArray(module.value)) {
        while (module.value.length <= TRIAL_SLOT) {
          module.value.push(serializedBinary(Buffer.alloc(0)));
          trialSlot = true;
        }
        if (trialSlot) model.state.modules.value = [...modules];
      }
      const repaired = syncHeroCellState(model);
      if (opened.length || repaired.length) log({ event: 'hero_develop_login_state', opened, heroes: repaired.length });
      return { opened, heroes: repaired.length, trialSlot };
    });
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    async decode(type, raw, helpers) {
      const command = Number(type);
      if (command === COMMAND_SUBMIT_HERO) return helpers.unpack('pb_hero_submit_req', raw);
      if (command === COMMAND_HERO_TRIAL) return helpers.unpack('pb_hero_wake_req', raw);
      if (command === COMMAND_BATCH_SUBMIT_HERO) return helpers.unpack('pb_hero_batch_submit_req', raw);
      if (command === COMMAND_ONE_KEY_UP) return helpers.unpack('pb_hero_one_key_up_req', raw);
      return fail(CODE_INVALID, 'Invalid hero develop command');
    },
    ensureLoginState,
    execute(type, input) {
      switch (Number(type)) {
        case COMMAND_SUBMIT_HERO: return submitHero(input);
        case COMMAND_HERO_TRIAL: return heroTrial(input);
        case COMMAND_BATCH_SUBMIT_HERO: return batchSubmitHero(input);
        case COMMAND_ONE_KEY_UP: return oneKeyUpStar(input);
        default: return fail(CODE_INVALID, 'Invalid hero develop command');
      }
    }
  };
}
