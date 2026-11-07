import { decodeEtf, encodeEtf, encodeEtfIntegerTuple, binary, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { decodeBitBlock, encodeBitBlock, setBit } from './bit-block.mjs';
import { createMissionFightService } from './mission-fight-service.mjs';

// Mission commands around the ordinary journey fight path: free meal stamina
// (504), stamina exchange (505), one-key chapter rewards (509), manual stamina
// purchase (510), chapter pass bookkeeping (511) and boss awards (512).
// Table and wire evidence: agent/workflow/gameplay-completion/ITEM-MISSION/.
const MISSION_MODULE = 8;
const MEAL_CLAIM_TABLE = 'mission_meal_claims';
const ENERGY_EXCHANGE_TABLE = 'mission_energy_exchanges';
const ENERGY_BUY_TABLE = 'mission_energy_buys';
const CHAPTER_CLAIM_TYPE = 'mission_chapter_pass';
const BOSS_CLEAR_TYPE = 'mission_boss_clear';
const BOSS_AWARD_TYPE = 'mission_boss_award';
const DAY_SECONDS = 86400;
// Module 6 container group that stores plain ItemBase style resources.
const STAMINA_GROUP = 1;

// These tables belong to this service and are created idempotently. The shared
// game store keeps its own schema version untouched.
const EXTRA_TABLES = [
  'CREATE TABLE IF NOT EXISTS ' + MEAL_CLAIM_TABLE + ' (',
  '  role_id INTEGER NOT NULL, day_key TEXT NOT NULL, meal_tid INTEGER NOT NULL CHECK(meal_tid>0),',
  '  claimed_at TEXT NOT NULL, PRIMARY KEY(role_id,day_key,meal_tid));',
  'CREATE TABLE IF NOT EXISTS ' + ENERGY_EXCHANGE_TABLE + ' (',
  '  role_id INTEGER NOT NULL, day_key TEXT NOT NULL, energy_tid INTEGER NOT NULL CHECK(energy_tid>0),',
  '  exchange_num INTEGER NOT NULL CHECK(exchange_num>0), energy_num INTEGER NOT NULL CHECK(energy_num>0),',
  '  updated_at TEXT NOT NULL, PRIMARY KEY(role_id,day_key,energy_tid));',
  'CREATE TABLE IF NOT EXISTS ' + ENERGY_BUY_TABLE + ' (',
  '  role_id INTEGER NOT NULL, day_key TEXT NOT NULL, energy_tid INTEGER NOT NULL CHECK(energy_tid>0),',
  '  buy_num INTEGER NOT NULL CHECK(buy_num>0),',
  '  updated_at TEXT NOT NULL, PRIMARY KEY(role_id,day_key,energy_tid));'
].join('\n');

function pad2(value) {
  return String(value).padStart(2, '0');
}

// Daily resets follow the server's local calendar day, the same tick the client
// uses for meal windows and manual stamina purchases.
export function localDayKey(milliseconds) {
  const date = new Date(milliseconds);
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

export function localMidnightSeconds(milliseconds) {
  const date = new Date(milliseconds);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

function localHour(milliseconds) {
  return new Date(milliseconds).getHours();
}

function serverDayIndex(openedAtMilliseconds, milliseconds) {
  const start = localMidnightSeconds(openedAtMilliseconds);
  const current = localMidnightSeconds(milliseconds);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(current)) return 0;
  return Math.floor((current - start) / DAY_SECONDS) + 1;
}

function mergeChanges(...groups) {
  const changes = new Map();
  for (const change of groups.flat()) {
    const tid = String(change.tid);
    const current = changes.get(tid);
    if (current) {
      current.new_num = String(change.new_num);
      current.diff_num = (BigInt(current.diff_num) + BigInt(change.diff_num)).toString();
    } else {
      changes.set(tid, { tid, new_num: String(change.new_num), diff_num: String(change.diff_num) });
    }
  }
  return [...changes.values()];
}

function configuredAwards(awards, label) {
  const rows = Array.isArray(awards) ? awards : [];
  return rows.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, label + ' reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, label + ' reward configuration is invalid');
    }
    return [tid, count];
  });
}

function positive(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new GameError(5, label);
  return number;
}

function nonNegative(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new GameError(5, label);
  return number;
}

// ETF payloads for these commands are either absent or a single integer tid.
async function optionalEtfInteger(bytes, message) {
  if (!bytes || !bytes.length) return null;
  let decoded;
  try {
    decoded = await decodeEtf(bytes);
  } catch {
    throw new GameError(1, message);
  }
  const value = decoded && decoded.value !== undefined ? decoded.value : decoded;
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
  const id = Number(candidate);
  if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, message);
  return id;
}

export function createMissionExtraService({
  store,
  codec,
  missionFight,
  gameTables = readGameTables(),
  missionTables = readMissionTables(),
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const fight = missionFight ?? createMissionFightService({ store, codec, gameTables, missionTables, now, logger });
  const initialised = new WeakSet();
  const ensureTables = db => { db.exec(EXTRA_TABLES); };
  if (!initialised.has(store)) {
    store.inspect(db => ensureTables(db));
    initialised.add(store);
  }

  function missionModule(model) {
    const module = new Map(model.state.modules.value).get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Mission login module is missing');
    return module;
  }

  function writeMissionModule(model, mission) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Mission login module is missing');
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    modules.set(MISSION_MODULE, module);
    model.state.modules.value = [...modules];
  }

  function readMission(model) {
    const module = missionModule(model);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    const section = missionTables.sections.get(Number(mission.mission_id));
    if (!section) throw new GameError(5, 'Current mission configuration is missing');
    return { mission, section };
  }

  // Read-only view of the saved mission state for pre-checks that must run
  // before the write transaction opens.
  function snapshot() {
    const state = store.state();
    const module = new Map(state.modules.value).get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Mission login module is missing');
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    const section = missionTables.sections.get(Number(mission.mission_id));
    if (!section) throw new GameError(5, 'Current mission configuration is missing');
    return {
      state,
      mission,
      section,
      openedAt: Number(state.serverOpenedAt ?? state.createdAt),
      ...chapterState(mission, section)
    };
  }

  // Chapter progress derived from the authoritative mission cursor: the cursor
  // always names the first unpassed chapter section, so a chapter is complete
  // once every configured section of it sits before the cursor.
  function chapterState(mission, section) {
    const currentChapter = Number(section.belong_chapter), currentIndex = Number(section.index);
    const byChapter = new Map();
    for (const row of missionTables.sections.values()) {
      const chapter = Number(row.belong_chapter), index = Number(row.index);
      if (!Number.isSafeInteger(chapter) || !Number.isSafeInteger(index)) continue;
      const entry = byChapter.get(chapter) ?? { chapter, total: 0, passed: 0 };
      entry.total += 1;
      if (chapter < currentChapter || (chapter === currentChapter && index < currentIndex)) entry.passed += 1;
      byChapter.set(chapter, entry);
    }
    const passedChapters = [...byChapter.values()]
      .filter(entry => entry.total > 0 && entry.passed === entry.total)
      .map(entry => entry.chapter)
      .sort((left, right) => left - right);
    return {
      currentChapter,
      currentIndex,
      passedChapters,
      highestPassedChapter: passedChapters.length ? passedChapters[passedChapters.length - 1] : 0
    };
  }

  function mealForWindow(hour) {
    const open = [...missionTables.meals.values()]
      .filter(row => {
        const window = Array.isArray(row.free_time) ? row.free_time.map(Number) : [];
        return window.length === 2 && hour >= window[0] && hour <= window[1];
      })
      .map(row => Number(row.tid))
      .sort((left, right) => left - right);
    if (!open.length) throw new GameError(5, 'Mission meal award is not open');
    return open[0];
  }

  // 504 mission_meal: one free stamina parcel per MealAward window per local
  // day. The response carries pb_role_mission_meal.last_refresh_stamp plus the
  // claimed-tid BitBlock so the client can grey out a claimed window.
  async function claimMeal(bytes) {
    const requested = await optionalEtfInteger(bytes, 'Invalid mission meal payload');
    const clock = Number(now());
    if (!Number.isSafeInteger(clock)) throw new GameError(5, 'Server clock is invalid');
    const dayKey = localDayKey(clock), stamp = localMidnightSeconds(clock), hour = localHour(clock);
    const mealTid = requested ?? mealForWindow(hour);
    const meal = missionTables.meals.get(mealTid);
    if (!meal) throw new GameError(5, 'Mission meal configuration is missing');
    const window = Array.isArray(meal.free_time) ? meal.free_time.map(Number) : [];
    if (window.length !== 2 || !Number.isSafeInteger(window[0]) || !Number.isSafeInteger(window[1]) || window[0] > window[1]) {
      throw new GameError(5, 'Mission meal window configuration is invalid');
    }
    if (hour < window[0] || hour > window[1]) throw new GameError(5, 'Mission meal award is not open');
    const awards = configuredAwards(meal.award, 'Mission meal');
    if (!awards.length) throw new GameError(5, 'Mission meal has no configured reward');

    const roleId = store.state().roleId;
    const claimed = store.inspect(db => db
      .prepare('SELECT meal_tid FROM ' + MEAL_CLAIM_TABLE + ' WHERE role_id=? AND day_key=? ORDER BY meal_tid')
      .all(roleId, dayKey)
      .map(row => Number(row.meal_tid)));
    if (claimed.includes(mealTid)) throw new GameError(310, 'Mission meal award already claimed');
    let bits = Buffer.alloc(0);
    for (const tid of [...claimed, mealTid]) bits = setBit(bits, tid);
    const gotAward = (await encodeEtf(binary(bits))).toString('base64');
    const createdAt = new Date(clock).toISOString();

    return store.transaction((model, db) => {
      ensureTables(db);
      const fresh = db.prepare('SELECT meal_tid FROM ' + MEAL_CLAIM_TABLE + ' WHERE role_id=? AND day_key=? ORDER BY meal_tid')
        .all(model.state.roleId, dayKey)
        .map(row => Number(row.meal_tid));
      if (fresh.length !== claimed.length || fresh.some((tid, index) => tid !== claimed[index])) {
        throw new GameError(1, 'Mission meal state changed; retry claim');
      }
      db.prepare('INSERT INTO ' + MEAL_CLAIM_TABLE + ' VALUES (?,?,?,?)').run(model.state.roleId, dayKey, mealTid, createdAt);
      const reward = grantResources(model, awards, gameTables);
      const value = {
        meal: { last_refresh_stamp: stamp, got_award: gotAward },
        res_change: { changes: reward.changes, is_overflow: false }
      };
      log({ event: 'mission_meal_claimed', mealTid, dayKey, changes: reward.changes.length });
      return { value, data: codec.pack('pb_mission_meal_rsp', value) };
    });
  }

  // EnergyConst describes the stamina family: src is the consumable item, rate
  // is the stamina granted per item, limit is the daily stamina cap from
  // exchanges and max is the stamina ceiling. The client may address a row by
  // its stamina tid or by the source item tid; both resolve here.
  function energyEntry(tid) {
    const direct = missionTables.energyConst.get(Number(tid));
    if (direct) return direct;
    for (const row of missionTables.energyConst.values()) if (Number(row.src) === Number(tid)) return row;
    return null;
  }

  // Stamina (100012900-style tid, item res_type 2900) is not an inventory item,
  // so grantResources cannot move it. The saved game keeps the balance in the
  // resources table (the sweeps in 503 spend it there) and mirrors it into login
  // module 8 slot 2 (pb_role_energy_res) for the login payload. Both are kept in
  // sync; a missing resources row is created so later 503 sweeps still resolve.
  function staminaEntry(model, tid) {
    const module = new Map(model.state.modules.value).get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value) || !module.value[2]) return null;
    let data;
    try {
      data = codec.unpack('pb_role_energy_res', rawBinary(module.value[2]));
    } catch {
      return null;
    }
    return (data.res ?? []).find(row => Number(row.tid) === Number(tid)) ?? null;
  }

  function staminaBalance(model, tid) {
    const row = model.resources.get(String(tid));
    if (row) return BigInt(row.num ?? 0);
    const entry = staminaEntry(model, tid);
    return entry ? BigInt(entry.num ?? 0) : 0n;
  }

  function applyStamina(model, tid, delta) {
    const current = staminaBalance(model, tid);
    const next = current + BigInt(delta);
    if (next < 0n) throw new GameError(301, 'Insufficient stamina');
    if (next > 9223372036854775807n) throw new GameError(1, 'Stamina limit reached');
    let row = model.resources.get(String(tid));
    if (!row) {
      const groups = new Map(model.state.modules.value).get(6).value;
      while (groups.length <= STAMINA_GROUP) groups.push({ value: [], improper: false });
      const slot = groups[STAMINA_GROUP].value.length;
      groups[STAMINA_GROUP].value.push(serializedBinary(Buffer.alloc(0)));
      row = { tid: String(tid), num: '0', location: [6, STAMINA_GROUP, slot] };
      model.resources.set(String(tid), row);
    }
    row.num = next.toString();
    const entry = staminaEntry(model, tid);
    if (entry) {
      const modules = new Map(model.state.modules.value);
      const module = modules.get(MISSION_MODULE);
      const data = codec.unpack('pb_role_energy_res', rawBinary(module.value[2]));
      const target = (data.res ?? []).find(item => Number(item.tid) === Number(tid));
      if (target) {
        target.num = next.toString();
        module.value[2] = serializedBinary(codec.pack('pb_role_energy_res', data));
        modules.set(MISSION_MODULE, module);
        model.state.modules.value = [...modules];
      }
    }
    return { tid: String(tid), new_num: next.toString(), diff_num: String(delta) };
  }

  // 505 mission_energy_exchange: consume one source item and grant the
  // configured stamina amount, subject to EnergyConst.limit and EnergyConst.max.
  async function exchangeEnergy(bytes) {
    const tid = await optionalEtfInteger(bytes, 'Invalid energy exchange payload');
    if (tid === null) throw new GameError(1, 'Invalid energy exchange payload');
    const entry = energyEntry(tid);
    if (!entry) throw new GameError(5, 'Energy exchange configuration is missing');
    const energyTid = positive(entry.tid, 'Energy exchange configuration is invalid');
    const src = positive(entry.src, 'Energy exchange source is not configured');
    const rate = positive(entry.rate, 'Energy exchange rate is not configured');
    const limit = nonNegative(entry.limit, 'Energy exchange limit is not configured');
    const maximum = nonNegative(entry.max, 'Energy exchange maximum is not configured');
    const clock = Number(now());
    const dayKey = localDayKey(clock), updatedAt = new Date(clock).toISOString();

    return store.transaction((model, db) => {
      ensureTables(db);
      const row = db.prepare('SELECT exchange_num,energy_num FROM ' + ENERGY_EXCHANGE_TABLE + ' WHERE role_id=? AND day_key=? AND energy_tid=?')
        .get(model.state.roleId, dayKey, energyTid);
      const exchangeNum = Number(row?.exchange_num ?? 0), energyNum = Number(row?.energy_num ?? 0);
      if (!Number.isSafeInteger(exchangeNum) || !Number.isSafeInteger(energyNum)) throw new GameError(5, 'Energy exchange record is invalid');
      if (limit > 0 && energyNum + rate > limit) throw new GameError(5, 'Energy exchange daily limit reached');
      const current = staminaBalance(model, energyTid);
      if (maximum > 0 && current + BigInt(rate) > BigInt(maximum)) throw new GameError(5, 'Energy is already at its maximum');
      const spent = consumeResources(model, [[src, 1]]);
      const gained = applyStamina(model, energyTid, rate);
      if (row) {
        db.prepare('UPDATE ' + ENERGY_EXCHANGE_TABLE + ' SET exchange_num=?,energy_num=?,updated_at=? WHERE role_id=? AND day_key=? AND energy_tid=?')
          .run(exchangeNum + 1, energyNum + rate, updatedAt, model.state.roleId, dayKey, energyTid);
      } else {
        db.prepare('INSERT INTO ' + ENERGY_EXCHANGE_TABLE + ' VALUES (?,?,?,?,?,?)')
          .run(model.state.roleId, dayKey, energyTid, 1, rate, updatedAt);
      }
      const value = { changes: mergeChanges(spent.changes, [gained]), is_overflow: false };
      log({ event: 'mission_energy_exchanged', energyTid, src, rate, exchangeNum: exchangeNum + 1, dayKey });
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
  }

  // 510 energy_energy_buy: the client's EnergyBuyForm purchases the configured
  // shop item. ShopItem supplies the tiered diamond price ladder and the daily
  // purchase_limit, EnergyConst supplies the matching shop_item row.
  async function buyEnergy(bytes) {
    const tid = await optionalEtfInteger(bytes, 'Invalid energy purchase payload');
    if (tid === null) throw new GameError(1, 'Invalid energy purchase payload');
    const entry = energyEntry(tid)
      ?? [...missionTables.energyConst.values()].find(row => Number(row.shop_item) === Number(tid))
      ?? null;
    if (!entry) throw new GameError(5, 'Energy purchase configuration is missing');
    const energyTid = positive(entry.tid, 'Energy purchase configuration is invalid');
    const shopTid = positive(entry.shop_item, 'Energy shop item is not configured');
    const shop = gameTables.ShopItem?.get(shopTid);
    if (!shop) throw new GameError(5, 'Energy shop item is missing');
    const itemTid = positive(shop.item, 'Energy shop item reward is not configured');
    const itemCount = positive(shop.count, 'Energy shop item count is not configured');
    const currencyTid = positive(shop.currency_type, 'Energy shop currency is not configured');
    const purchaseLimit = positive(shop.purchase_limit, 'Energy shop purchase limit is not configured');
    const prices = (Array.isArray(shop.price) ? shop.price : []).map(pair => {
      if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, 'Energy shop price configuration is invalid');
      const tier = Number(pair[0]), price = Number(pair[1]);
      if (!Number.isSafeInteger(tier) || tier <= 0 || !Number.isSafeInteger(price) || price < 0) {
        throw new GameError(5, 'Energy shop price configuration is invalid');
      }
      return { tier, price };
    }).sort((left, right) => left.tier - right.tier);
    if (!prices.length) throw new GameError(5, 'Energy shop has no configured price');
    const clock = Number(now());
    const dayKey = localDayKey(clock), updatedAt = new Date(clock).toISOString();

    return store.transaction((model, db) => {
      ensureTables(db);
      const row = db.prepare('SELECT buy_num FROM ' + ENERGY_BUY_TABLE + ' WHERE role_id=? AND day_key=? AND energy_tid=?')
        .get(model.state.roleId, dayKey, energyTid);
      const bought = Number(row?.buy_num ?? 0);
      if (!Number.isSafeInteger(bought) || bought < 0) throw new GameError(5, 'Energy purchase record is invalid');
      if (bought >= purchaseLimit) throw new GameError(310, 'Energy purchase limit reached');
      const tier = prices.find(value => value.tier === bought + 1) ?? prices[prices.length - 1];
      const spent = tier.price > 0 ? consumeResources(model, [[currencyTid, tier.price]]) : { changes: [] };
      const reward = grantResources(model, [[itemTid, itemCount]], gameTables);
      if (row) {
        db.prepare('UPDATE ' + ENERGY_BUY_TABLE + ' SET buy_num=?,updated_at=? WHERE role_id=? AND day_key=? AND energy_tid=?')
          .run(bought + 1, updatedAt, model.state.roleId, dayKey, energyTid);
      } else {
        db.prepare('INSERT INTO ' + ENERGY_BUY_TABLE + ' VALUES (?,?,?,?,?)')
          .run(model.state.roleId, dayKey, energyTid, 1, updatedAt);
      }
      const value = {
        res: { changes: mergeChanges(spent.changes, reward.changes), is_overflow: false },
        buy: { tid: energyTid, num: bought + 1, time: Math.floor(clock / 1000) }
      };
      log({ event: 'mission_energy_bought', energyTid, shopTid, tier: tier.tier, price: tier.price, buyNum: bought + 1, dayKey });
      return { value, data: codec.pack('pb_energy_manual_buy_rsp', value) };
    });
  }

  // 509 req_one_key_chapter: protobuf pb_mission_one_key_reward_req. Box claims
  // reuse the 506 chapter-box bitmap and reward_claims rows inside one
  // transaction. Common tasks (pb_common_task.receive_list) have no local
  // progress source yet, so a request naming them is refused before any
  // mutation instead of reporting a partial success.
  async function oneKeyReward(bytes) {
    let request;
    try {
      request = codec.unpack('pb_mission_one_key_reward_req', bytes ?? Buffer.alloc(0));
    } catch {
      throw new GameError(1, 'Invalid mission one-key payload');
    }
    const boxTids = (request.box_tids ?? []).map(Number);
    const taskTids = (request.common_task_tids ?? []).map(Number);
    if (boxTids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new GameError(1, 'Invalid mission box id');
    if (taskTids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new GameError(1, 'Invalid mission task id');
    if (taskTids.length) throw new GameError(5, 'Mission common-task rewards are not implemented');
    if (!boxTids.length) throw new GameError(1, 'Invalid mission one-key payload');
    const preparedBoxes = await fight.prepareBoxClaim(boxTids);

    return store.transaction((model, db) => {
      ensureTables(db);
      const claimed = fight.applyBoxClaim(model, db, preparedBoxes);
      const value = {
        common_task: { receive_list: [] },
        mission: claimed.mission,
        res_change: claimed.res_change
      };
      log({ event: 'mission_one_key_committed', boxTids: claimed.newlyGranted, changes: claimed.res_change.changes.length });
      return { value, data: codec.pack('pb_mission_one_key_reward_rsp', value) };
    });
  }

  // 511 req_mission_chapter_pass: the client reports a finished chapter. The
  // server derives completion from the mission cursor instead of trusting the
  // client, records the pass once and answers with the same ETF tuple the elite
  // mission chapter pass uses, [chapterId, alreadyPassed].
  async function passChapter(bytes) {
    const requested = await optionalEtfInteger(bytes, 'Invalid mission chapter payload');
    const { passedChapters } = snapshot();
    const chapterId = requested ?? (passedChapters.length ? passedChapters[passedChapters.length - 1] : null);
    if (!Number.isSafeInteger(chapterId) || chapterId <= 0) throw new GameError(5, 'Mission chapter is not complete');
    if (!missionTables.chapters.get(chapterId)) throw new GameError(5, 'Mission chapter configuration is missing');
    if (!passedChapters.includes(chapterId)) throw new GameError(5, 'Mission chapter is not complete');
    const createdAt = new Date(Number(now())).toISOString();

    return store.transaction((model, db) => {
      ensureTables(db);
      readMission(model);
      const key = String(chapterId);
      const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
        .get(model.state.roleId, CHAPTER_CLAIM_TYPE, key);
      if (!exists) db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, CHAPTER_CLAIM_TYPE, key, createdAt);
      log({ event: 'mission_chapter_pass_committed', chapterId, alreadyPassed: Boolean(exists) });
      return { value: { chapterId, alreadyPassed: Boolean(exists) }, data: encodeEtfIntegerTuple([chapterId, exists ? 1 : 0]) };
    });
  }

  // 512 req_mission_boss_pass_award: Boss rows gate on open_chapter (fully
  // passed chapters), open_server_day (server day index) and a recorded boss
  // clear. Nothing in the local server can clear a boss fight yet, so the clear
  // record is an explicit precondition instead of a self-reported client flag.
  async function bossAward(bytes) {
    const tid = await optionalEtfInteger(bytes, 'Invalid mission boss payload');
    if (tid === null) throw new GameError(1, 'Invalid mission boss payload');
    const boss = missionTables.bosses.get(tid);
    if (!boss) throw new GameError(5, 'Mission boss configuration is missing');
    const awards = configuredAwards(boss.award, 'Mission boss');
    if (!awards.length) throw new GameError(5, 'Mission boss has no configured reward');
    const openChapter = nonNegative(boss.open_chapter, 'Mission boss chapter gate is not configured');
    const openServerDay = nonNegative(boss.open_server_day, 'Mission boss server-day gate is not configured');
    const { highestPassedChapter, openedAt, mission: snapshotMission } = snapshot();
    if (openChapter > highestPassedChapter) throw new GameError(5, 'Mission boss is not open');
    if (!Number.isSafeInteger(openedAt) || openedAt <= 0) throw new GameError(5, 'Server opening time is missing');
    if (serverDayIndex(openedAt * 1000, Number(now())) < openServerDay) throw new GameError(5, 'Mission boss is not open');
    const createdAt = new Date(Number(now())).toISOString();
    // pb_mission.boss_bin is the documented "Boss通关领奖数据" BitBlock, encoded
    // the same way as the chapter box bitmap so the client can read it.
    const expectedBossBin = snapshotMission.boss_bin ?? '';
    const currentBossBits = await decodeBitBlock(Buffer.from(expectedBossBin, 'base64'));
    const nextBossBin = (await encodeBitBlock(setBit(currentBossBits, tid))).toString('base64');

    return store.transaction((model, db) => {
      ensureTables(db);
      const key = String(tid);
      const cleared = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
        .get(model.state.roleId, BOSS_CLEAR_TYPE, key);
      if (!cleared) throw new GameError(5, 'Mission boss clear record is missing');
      const exists = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
        .get(model.state.roleId, BOSS_AWARD_TYPE, key);
      if (exists) throw new GameError(310, 'Mission boss award already claimed');
      const { mission } = readMission(model);
      if ((mission.boss_bin ?? '') !== expectedBossBin) throw new GameError(1, 'Mission boss data changed; retry claim');
      mission.boss_bin = nextBossBin;
      writeMissionModule(model, mission);
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, BOSS_AWARD_TYPE, key, createdAt);
      const reward = grantResources(model, awards, gameTables);
      const value = { changes: reward.changes, is_overflow: false };
      log({ event: 'mission_boss_award_committed', bossTid: tid, changes: reward.changes.length });
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
  }

  return {
    supports: type => [504, 505, 509, 510, 511, 512].includes(type),
    claimMeal,
    exchangeEnergy,
    buyEnergy,
    oneKeyReward,
    passChapter,
    bossAward,
    execute(type, bytes) {
      if (type === 504) return claimMeal(bytes);
      if (type === 505) return exchangeEnergy(bytes);
      if (type === 509) return oneKeyReward(bytes);
      if (type === 510) return buyEnergy(bytes);
      if (type === 511) return passChapter(bytes);
      if (type === 512) return bossAward(bytes);
      throw new GameError(5, 'Mission command is not implemented');
    }
  };
}
