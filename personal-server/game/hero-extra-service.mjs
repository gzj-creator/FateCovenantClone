import { rawBinary, serializedBinary, encodeEtfBinaryList } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';

// HeroCmd 614 (use_hero_chip), 647 (req_hero_visit) and the reforge trio
// 663/664/665. Everything else in the HERO-HERO card stays explicit.
const COMMAND_USE_CHIP = 614;
const COMMAND_VISIT = 647;
const COMMAND_REFORGE = 663;
const COMMAND_REFORGE_SAVE = 664;
const COMMAND_REFORGE_CANCEL = 665;
const SUPPORTED = [COMMAND_USE_CHIP, COMMAND_VISIT, COMMAND_REFORGE, COMMAND_REFORGE_SAVE, COMMAND_REFORGE_CANCEL];

const HERO_MODULE_ID = 10;
// HeroDataMgr.LoginParse decodes zero-based slot 5 (Lua login[6]) as
// pb_role_hero_visit. Slot 4 belongs to the favour module and stays untouched.
const VISIT_SLOT = 5;
const DAY_SECONDS = 86400;
const MAX_UINT32 = 0xffffffff;
const PENDING_TABLE = 'hero_reforge_pending';
// ReforgeConst.lock_price_ratio is scaled into hundred-thousandths.
const LOCK_RATIO_SCALE = 100000;

const CODE_INVALID = 1;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;
const CODE_LOCKED = 305;
const CODE_CONTENT = 3001;

const fail = (code, message) => { throw new GameError(code, message); };

function uint32(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > MAX_UINT32) fail(CODE_STATE, 'Invalid hero ' + field);
  return number;
}

function positiveTid(value, field) {
  const tid = Number(value);
  if (!Number.isSafeInteger(tid) || tid <= 0 || tid > MAX_UINT32) fail(CODE_INVALID, 'Invalid hero ' + field);
  return tid;
}

function dayIndex(seconds) {
  return gameDayIndex(seconds);
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS ' + PENDING_TABLE + ' ('
    + 'role_id INTEGER NOT NULL,'
    + 'hero_tid INTEGER NOT NULL,'
    + 'attr_list TEXT NOT NULL,'
    + 'random_attr_list TEXT NOT NULL,'
    + 'cost_tid INTEGER NOT NULL,'
    + 'cost_num INTEGER NOT NULL,'
    + 'updated_at TEXT NOT NULL,'
    + 'PRIMARY KEY(role_id, hero_tid))');
}

function attrList(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({ key: Number(row?.key ?? 0), value: String(row?.value ?? '0') }));
}

export function createHeroExtraService({ store, codec, tables, heroTables, now = () => Date.now(), random = Math.random, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const visitConst = heroTables.VisitConst?.get(1);
  if (!visitConst) throw new Error('Hero visit configuration is missing');
  const reforgeConst = heroTables.ReforgeConst?.get(1);
  if (!reforgeConst) throw new Error('Hero reforge configuration is missing');
  if (!heroTables.ReforgeAttr?.size) throw new Error('Hero reforge attribute pool is missing');
  store.inspect(db => ensureTables(db));

  function currentSeconds() {
    const value = Number(now());
    if (!Number.isFinite(value)) fail(CODE_STATE, 'Hero extra clock is invalid');
    return value > 100000000000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  function ownedHero(model, tid) {
    const hero = (model.heroInfo.hero_list ?? []).find(row => Number(row.tid) === tid);
    if (!hero) fail(CODE_CONTENT, 'Hero is not owned');
    return hero;
  }

  function heroConfig(tid) {
    const config = heroTables.Hero?.get(tid);
    if (!config) fail(CODE_STATE, 'Hero configuration is missing');
    return config;
  }

  function readVisitState(model, at) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE_ID);
    if (!module || !Array.isArray(module.value)) fail(CODE_STATE, 'Hero login module is missing');
    const bytes = module.value[VISIT_SLOT] ? rawBinary(module.value[VISIT_SLOT]) : Buffer.alloc(0);
    const previous = bytes.length ? codec.unpack('pb_role_hero_visit', bytes) : {};
    const last = uint32(previous.last_refresh_time, 'visit last_refresh_time');
    const sameDay = last !== 0 && dayIndex(last) === dayIndex(at);
    const visited = sameDay ? (previous.visited_heroes ?? []).map(value => uint32(value, 'visited hero')) : [];
    return {
      modules,
      module,
      state: {
        visited_heroes: visited,
        last_refresh_time: sameDay ? last : at,
        used_meet_times: sameDay ? uint32(previous.used_meet_times, 'used_meet_times') : 0,
        yesterday_visited_heroes: sameDay
          ? (previous.yesterday_visited_heroes ?? []).map(value => uint32(value, 'yesterday visited hero'))
          : (previous.visited_heroes ?? []).map(value => uint32(value, 'yesterday visited hero')),
        // The client owns this field; there is no authoritative local recovery
        // timer for it, so the stored value is returned unchanged.
        continue_meet_s: uint32(previous.continue_meet_s, 'continue_meet_s')
      }
    };
  }

  function writeVisitState(model, modules, module, state) {
    while (module.value.length <= VISIT_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[VISIT_SLOT] = serializedBinary(codec.pack('pb_role_hero_visit', state));
    model.state.modules.value = [...modules];
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const at = currentSeconds();
      const { modules, module, state } = readVisitState(model, at);
      writeVisitState(model, modules, module, state);
      return { visited: state.visited_heroes.length, remaining: Math.max(0, Number(visitConst.day_times ?? 0) - state.visited_heroes.length) };
    });
  }

  function visit(heroTidInput) {
    const heroTid = positiveTid(heroTidInput, 'visit hero tid');
    return store.transaction(model => {
      const at = currentSeconds();
      const { modules, module, state } = readVisitState(model, at);
      ownedHero(model, heroTid);
      const config = heroConfig(heroTid);
      const unlock = heroTables.VisitUnlock?.get(heroTid);
      if (!unlock) fail(CODE_LOCKED, 'Hero visit is not unlocked');
      const playerLevel = Number(model.role.level ?? 0);
      if (Number(unlock.unlock_player_lv ?? 0) > playerLevel) fail(CODE_LOCKED, 'Hero visit requires a higher role level');
      if (state.visited_heroes.includes(heroTid)) fail(CODE_STATE, 'Hero has already been visited today');
      const limit = Number(visitConst.day_times ?? 0);
      if (!Number.isSafeInteger(limit) || limit <= 0) fail(CODE_STATE, 'Hero visit daily limit is missing');
      if (state.visited_heroes.length >= limit) fail(CODE_STATE, 'Hero visit daily limit reached');
      // Visit is keyed by hero quality and Visit.chip_num owns the chip amount.
      // The client Lua never reads Visit; the quality keying is recorded as an
      // evidence gap in the implementation note.
      const visitRow = heroTables.Visit?.get(Number(config.quality));
      const chipTid = Number(config.chip ?? 0);
      const chipNum = Number(visitRow?.chip_num ?? 0);
      if (!chipTid || !Number.isSafeInteger(chipNum) || chipNum <= 0) fail(CODE_STATE, 'Hero visit reward configuration is missing');
      const granted = grantResources(model, [[chipTid, chipNum]], tables);
      state.visited_heroes = [...state.visited_heroes, heroTid].sort((left, right) => left - right);
      state.used_meet_times = Math.min(MAX_UINT32, state.used_meet_times + 1);
      writeVisitState(model, modules, module, state);
      const response = { schema: 'pb_hero_visit_rsp', value: { res_change: granted, hero_visit: state } };
      const data = codec.pack(response.schema, response.value);
      log({ event: 'hero_visit_committed', heroTid, chipTid, chipNum, visited: state.visited_heroes.length });
      return { ...response, data, valueForLog: { heroTid, chipTid, chipNum } };
    });
  }

  function useChip(input) {
    const chipTid = positiveTid(input?.tid, 'chip tid');
    const requested = Number(input?.num);
    if (!Number.isSafeInteger(requested) || requested <= 0) fail(CODE_INVALID, 'Invalid hero chip quantity');
    const customTid = Number(input?.custom_tid ?? 0);
    if (customTid !== 0) fail(CODE_STATE, 'Custom hero chips are not supported by the local server');
    const config = tables.Chip?.get(chipTid);
    if (!config) fail(CODE_CONTENT, 'Hero chip configuration is missing');
    const heroTid = Number(config.point_item ?? 0);
    const need = Number(config.need_num ?? 0);
    if (!heroTid || !Number.isSafeInteger(need) || need <= 0) fail(CODE_STATE, 'Hero chip composition configuration is missing');
    return store.transaction(model => {
      const existing = (model.heroInfo.hero_list ?? []).find(hero => Number(hero.tid) === heroTid);
      if (existing) fail(CODE_STATE, 'Hero is already owned and cannot be composed');
      if (requested < need) fail(CODE_STATE, 'Hero chip quantity is insufficient');
      const spent = consumeResources(model, [[chipTid, need]], CODE_INSUFFICIENT);
      const heroCfg = heroConfig(heroTid);
      const hero = {
        tid: String(heroTid), uid: String(heroTid), count: 1, level: 1,
        star: Number(heroCfg.star ?? 0), star_progress: 0, breakthrough_level: 0,
        quality: Number(heroCfg.quality ?? 0), source: Number(config.type ?? 0),
        relic: [], up_star_high_consume: [], source_point_list: [], pendant_select_list: []
      };
      model.heroInfo.hero_list.push(hero);
      const change = spent.changes.find(entry => Number(entry.tid) === chipTid);
      // HeroRes.ResChange reads change.extra as an ETF list of hero protobufs,
      // which is how the shipped client learns about a composed hero.
      if (change) change.extra = encodeEtfBinaryList([codec.pack('hero', hero)]);
      const value = { changes: spent.changes, is_overflow: false };
      const data = codec.pack('pb_res_to_client', value);
      log({ event: 'hero_chip_used', chipTid, heroTid, consumed: need });
      return { schema: 'pb_res_to_client', value, data, valueForLog: { chipTid, heroTid, consumed: need } };
    });
  }

  function weightedPick(rows, weightOf) {
    const total = rows.reduce((sum, row) => sum + Math.max(0, Number(weightOf(row) ?? 0)), 0);
    if (!(total > 0)) fail(CODE_STATE, 'Hero reforge weight configuration is missing');
    let roll = random() * total;
    for (const row of rows) {
      roll -= Math.max(0, Number(weightOf(row) ?? 0));
      if (roll < 0) return row;
    }
    return rows[rows.length - 1];
  }

  function rollAttr(attributeKey) {
    const pool = heroTables.ReforgeAttr.get(attributeKey);
    if (!pool) fail(CODE_STATE, 'Hero reforge attribute configuration is missing');
    const ranges = Array.isArray(pool.val_range) ? pool.val_range : [];
    const bucket = weightedPick(ranges, row => Array.isArray(row) ? row[0] : row?.weight);
    const range = Array.isArray(bucket) ? bucket[1] : null;
    const min = Number(range?.[0] ?? 0), max = Number(range?.[1] ?? min);
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) fail(CODE_STATE, 'Hero reforge value range is invalid');
    const value = min + Math.floor(random() * (max - min + 1));
    return { key: Number(attributeKey), value: String(Math.min(max, value)) };
  }

  function rollAttrs(count) {
    const keys = [...heroTables.ReforgeAttr.keys()].map(Number).filter(key => Number.isSafeInteger(key) && key > 0);
    if (!keys.length) fail(CODE_STATE, 'Hero reforge attribute pool is empty');
    const remaining = [...keys], picked = [];
    while (picked.length < count && remaining.length) {
      const key = Number(weightedPick(remaining, candidate => heroTables.ReforgeAttr.get(candidate)?.weight));
      picked.push(key);
      remaining.splice(remaining.indexOf(key), 1);
    }
    if (picked.length !== count) fail(CODE_STATE, 'Hero reforge attribute count exceeds the pool');
    return picked.map(rollAttr);
  }

  function reforgeCost(useCurrency, lockCount) {
    const baseTid = Number(useCurrency ? reforgeConst.cost_currency_item : reforgeConst.cost_item);
    const baseNum = Number(useCurrency ? reforgeConst.cost_currency_num : reforgeConst.cost_num);
    if (!baseTid || !Number.isSafeInteger(baseNum) || baseNum <= 0) fail(CODE_STATE, 'Hero reforge cost configuration is missing');
    if (!lockCount) return { tid: baseTid, num: baseNum };
    const ratios = Array.isArray(reforgeConst.lock_price_ratio) ? reforgeConst.lock_price_ratio : [];
    if (!ratios.length) fail(CODE_STATE, 'Hero reforge lock cost configuration is missing');
    // Inference: one ratio per lock tier, and extra locks reuse the last tier.
    const ratio = Number(ratios[Math.min(lockCount - 1, ratios.length - 1)] ?? 0);
    if (!Number.isSafeInteger(ratio) || ratio < 0) fail(CODE_STATE, 'Hero reforge lock ratio is invalid');
    return { tid: baseTid, num: baseNum + Math.ceil(baseNum * ratio / LOCK_RATIO_SCALE) };
  }

  function pendingRow(model, db, heroTid) {
    return db.prepare('SELECT hero_tid,attr_list,random_attr_list,cost_tid,cost_num FROM ' + PENDING_TABLE + ' WHERE role_id=? AND hero_tid=?')
      .get(model.state.roleId, heroTid) ?? null;
  }

  function deletePending(model, db, heroTid) {
    db.prepare('DELETE FROM ' + PENDING_TABLE + ' WHERE role_id=? AND hero_tid=?').run(model.state.roleId, heroTid);
  }

  function currentReforge(hero) {
    const value = hero.reforge ?? {};
    return { attr_list: attrList(value.attr_list), random_attr_list: attrList(value.random_attr_list) };
  }

  function reforge(input) {
    const heroTid = positiveTid(input?.hero_tid, 'reforge hero tid');
    const useCurrency = Boolean(input?.use_currency);
    const locks = Array.isArray(input?.lock_idx_list) ? input.lock_idx_list.map(value => Number(value)) : [];
    const attrCount = Number(reforgeConst.attr_count ?? 0);
    if (!Number.isSafeInteger(attrCount) || attrCount <= 0) fail(CODE_STATE, 'Hero reforge attribute count is missing');
    if (new Set(locks).size !== locks.length) fail(CODE_INVALID, 'Duplicate hero reforge lock');
    for (const lock of locks) {
      if (!Number.isSafeInteger(lock) || lock < 0 || lock >= attrCount) fail(CODE_INVALID, 'Invalid hero reforge lock index');
    }
    const minQuality = Number(reforgeConst.reforge_quality ?? 0);
    return store.transaction((model, db) => {
      const hero = ownedHero(model, heroTid);
      const config = heroConfig(heroTid);
      if (!heroTables.Reforge?.has(heroTid)) fail(CODE_LOCKED, 'Hero reforge is not available for this hero');
      if (Number(hero.quality ?? config.quality ?? 0) < minQuality) fail(CODE_LOCKED, 'Hero reforge requires a higher quality');
      if (pendingRow(model, db, heroTid)) fail(CODE_STATE, 'A hero reforge result is already waiting for save or cancel');
      const cost = reforgeCost(useCurrency, locks.length);
      const spent = consumeResources(model, [[cost.tid, cost.num]], CODE_INSUFFICIENT);
      const rolled = rollAttrs(attrCount);
      const previous = currentReforge(hero);
      const candidate = rolled.map((entry, index) => locks.includes(index) && previous.attr_list[index]
        ? { key: previous.attr_list[index].key, value: previous.attr_list[index].value }
        : entry);
      db.prepare('INSERT INTO ' + PENDING_TABLE + '(role_id,hero_tid,attr_list,random_attr_list,cost_tid,cost_num,updated_at) VALUES(?,?,?,?,?,?,?)')
        .run(model.state.roleId, heroTid, JSON.stringify(candidate), JSON.stringify(rolled), cost.tid, cost.num, new Date(currentSeconds() * 1000).toISOString());
      const value = { reforge: { attr_list: candidate, random_attr_list: rolled }, res: { changes: spent.changes, is_overflow: false } };
      const data = codec.pack('pb_hero_reforge_back', value);
      log({ event: 'hero_reforge_rolled', heroTid, costTid: cost.tid, costNum: cost.num, locks: locks.length });
      return { schema: 'pb_hero_reforge_back', value, data, valueForLog: { heroTid, locks: locks.length } };
    });
  }

  function saveReforge(heroTidInput) {
    const heroTid = positiveTid(heroTidInput, 'reforge hero tid');
    return store.transaction((model, db) => {
      ownedHero(model, heroTid);
      const pending = pendingRow(model, db, heroTid);
      if (!pending) fail(CODE_STATE, 'No hero reforge result is waiting for save');
      const value = { attr_list: attrList(JSON.parse(pending.attr_list)), random_attr_list: attrList(JSON.parse(pending.random_attr_list)) };
      const hero = ownedHero(model, heroTid);
      hero.reforge = value;
      deletePending(model, db, heroTid);
      const data = codec.pack('pb_hero_reforge', value);
      log({ event: 'hero_reforge_saved', heroTid });
      return { schema: 'pb_hero_reforge', value, data, valueForLog: { heroTid } };
    });
  }

  function cancelReforge(heroTidInput) {
    const heroTid = positiveTid(heroTidInput, 'reforge hero tid');
    return store.transaction((model, db) => {
      const hero = ownedHero(model, heroTid);
      const pending = pendingRow(model, db, heroTid);
      // The cost is charged by 663. Cancelling discards the candidate only and
      // never refunds, matching the client give-up path.
      if (pending) deletePending(model, db, heroTid);
      const value = currentReforge(hero);
      const data = codec.pack('pb_hero_reforge', value);
      log({ event: 'hero_reforge_cancelled', heroTid, discarded: Boolean(pending) });
      return { schema: 'pb_hero_reforge', value, data, valueForLog: { heroTid, discarded: Boolean(pending) } };
    });
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    ensureLoginState,
    execute(type, input) {
      switch (Number(type)) {
        case COMMAND_USE_CHIP: return useChip(input);
        case COMMAND_VISIT: return visit(input);
        case COMMAND_REFORGE: return reforge(input);
        case COMMAND_REFORGE_SAVE: return saveReforge(input);
        case COMMAND_REFORGE_CANCEL: return cancelReforge(input);
        default: return fail(CODE_INVALID, 'Invalid hero command');
      }
    }
  };
}
