import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { hasBit, setBit } from './bit-block.mjs';

const ACTIVITY_MODULE = 92;
const ACTIVITY_ID = 117001;
const ACTIVITY_FUNC = 117;
const RECHARGE_HANDLE = 92;
const LOGIN_STATE_RUNNING = 50;
const STATISTICS_MODULE = 21;
const ROLE_STATISTICS_TYPE = 0;
const TID_COUNT_DRAW = 1;
// HeroDrawUILogic.GetPersonalDrawCount sums normal, quality and magic draws.
const PERSONAL_DRAW_LIBRARIES = new Set([1, 2, 10]);
const DAY_SECONDS = 86400;
const RESET_OFFSET_SECONDS = 10800;

const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max, message) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, message);
  return number;
};
const nonNegative = (value, fallback = 0) => {
  const number = Number(value ?? fallback);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
};
const timeSeconds = value => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number >= 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
};

function emptyActivity() {
  return { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
}

function stateList(activity) {
  const result = [];
  for (const entry of activity.act_list ?? []) if (entry?.state_data) result.push({ entry, state: entry.state_data });
  for (const group of activity.act_parallel_list ?? []) {
    for (const state of group.states_data ?? []) result.push({ entry: group, state });
  }
  return result;
}

function stateFor(activity, actId) {
  return stateList(activity).find(item => Number(item.state.act_id) === Number(actId))?.state ?? null;
}

function runningEnterTime(state) {
  const row = (state?.history_time ?? []).find(item => Number(item.state_id) === LOGIN_STATE_RUNNING);
  return timeSeconds(row?.enter_time);
}

// The activity snapshot is serialized as ETF(BINARY(protobuf)).  Transactions
// in game-store are synchronous, so this tiny wire wrapper cannot use encodeEtf.
function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

function unwrapEtfBinary(bytes) {
  if (!bytes.length) return Buffer.alloc(0);
  if (bytes[0] === 0x83 && bytes[1] === 0x6d) {
    if (bytes.length < 6) fail(5, 'Activity payload is truncated');
    const length = bytes.readUInt32BE(2);
    if (bytes.length !== length + 6) fail(5, 'Activity payload length is invalid');
    return bytes.subarray(6);
  }
  // Accept a raw protobuf payload for recovery from an older local snapshot.
  return bytes;
}

function localDay(seconds) {
  return Math.floor((seconds + RESET_OFFSET_SECONDS) / DAY_SECONDS);
}

function nextLocalDay(seconds) {
  return (localDay(seconds) + 1) * DAY_SECONDS - RESET_OFFSET_SECONDS;
}

function startOfLocalWeek(seconds) {
  const day = localDay(seconds);
  // Day zero, 1970-01-01, was Thursday. Move back to Monday.
  return (day - ((day + 3) % 7)) * DAY_SECONDS - RESET_OFFSET_SECONDS;
}

function nextLocalWeek(seconds) {
  return startOfLocalWeek(seconds) + 7 * DAY_SECONDS;
}

function startOfLocalMonth(seconds) {
  const local = new Date((seconds + RESET_OFFSET_SECONDS) * 1000);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) / 1000 - RESET_OFFSET_SECONDS;
}

function nextLocalMonth(seconds) {
  const local = new Date((seconds + RESET_OFFSET_SECONDS) * 1000);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) / 1000 - RESET_OFFSET_SECONDS;
}

export function createHeroDrawActivityService({
  store,
  codec,
  tables,
  heroTables,
  calendar,
  now = () => Math.floor(Date.now() / 1000),
  logger = () => {}
}) {
  if (!tables.HeroDrawActGenreRank || !tables.HeroDrawActTask || !tables.HeroDrawActGift) {
    throw new Error('Hundred schools activity configuration is missing');
  }
  const genreRanks = tables.HeroDrawActGenreRank;
  const tasks = tables.HeroDrawActTask;
  const giftIds = new Set((tables.HeroDrawActGift.get(1)?.gift ?? []).map(Number));
  if (!giftIds.size) throw new Error('Hundred schools gift configuration is empty');
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => timeSeconds(now());

  function activityConfig(actId = ACTIVITY_ID) {
    const config = tables.Activity?.get(Number(actId));
    return config?.func === ACTIVITY_FUNC ? config : null;
  }

  function readActivity() {
    const raw = new Map(store.state().modules.value).get(ACTIVITY_MODULE);
    if (!raw) return emptyActivity();
    return codec.unpack('pb_act_login', rawBinary(raw));
  }

  function openActivity(activity = readActivity(), at = currentSeconds()) {
    const paused = new Set((activity.act_pause_list ?? []).map(Number));
    const candidates = stateList(activity)
      .filter(item => activityConfig(Number(item.state.act_id)))
      .filter(item => !paused.has(Number(item.state.act_id)))
      .filter(item => Number(item.state.cur_state_id) === LOGIN_STATE_RUNNING)
      .filter(item => !calendar || calendar.isActivityRunning(Number(item.state.act_id), item.state, activity, at))
      .sort((left, right) => Number(right.state.act_id) - Number(left.state.act_id));
    if (!candidates.length) return null;
    const selected = candidates[0];
    return {
      actId: Number(selected.state.act_id),
      activity,
      entry: selected.entry,
      state: selected.state,
      config: activityConfig(Number(selected.state.act_id))
    };
  }

  function deadline(context, at) {
    const customEnd = Number((context.activity?.act_custom_list ?? []).find(row => Number(row.act_id) === context.actId)?.end_time ?? 0);
    if (customEnd > at) return customEnd;
    const enter = runningEnterTime(context.state);
    const configuredEnd = enter + Math.max(1, Number(context.config.duration_day ?? 1)) * DAY_SECONDS;
    return configuredEnd > at ? configuredEnd : at + 365 * DAY_SECONDS;
  }

  function drawFromEntry(entry) {
    let bytes = Buffer.from(entry.module_login_data ?? '', 'base64');
    bytes = unwrapEtfBinary(bytes);
    if (!bytes.length) return { role_data: {}, server_draw_count: 0 };
    try { return codec.unpack('pb_hero_draw_act_data', bytes); }
    catch (error) { fail(5, 'Hundred schools activity data is invalid: ' + error.message); }
  }

  function normalizeDrawData(data, context) {
    data ??= {};
    data.role_data ??= {};
    const role = data.role_data;
    role.draw_count = nonNegative(role.draw_count);
    role.draw_exchange_id = genreRanks.has(Number(role.draw_exchange_id)) ? Number(role.draw_exchange_id) : 0;
    let rewardBytes;
    try { rewardBytes = Buffer.from(role.reward_bytes ?? '', 'base64'); }
    catch { rewardBytes = Buffer.alloc(0); }
    role.reward_bytes = rewardBytes;
    role.is_mail_reward = Boolean(role.is_mail_reward);
    role.recharge_limit_info ??= { refresh_time: '0', buy_num_list: [] };
    role.recharge_limit_info.buy_num_list ??= [];
    data.server_draw_count = nonNegative(data.server_draw_count);
    data.__context = context;
    return data;
  }

  function writeDrawData(entry, data) {
    const value = {
      role_data: data.role_data,
      server_draw_count: data.server_draw_count
    };
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_hero_draw_act_data', value)).toString('base64');
  }

  function giftCycle(product, at, context) {
    const cycle = Number(product.buy_cycle_limit ?? 0);
    const activityStart = runningEnterTime(context.state) || Number(calendar?.serverOpenedAt ?? 0) || at;
    let start = activityStart, refresh = deadline(context, at);
    if (cycle === 1) { start = Math.max(activityStart, at - ((at + RESET_OFFSET_SECONDS) % DAY_SECONDS)); refresh = nextLocalDay(at); }
    else if (cycle === 2 || cycle === 3) { start = Math.max(activityStart, startOfLocalWeek(at)); refresh = nextLocalWeek(at); }
    // BuyCycleLimit 4, 5 and 7 are activity-period limits. ID 6 is the
    // account-wide lifetime limit and must survive every future activity run.
    else if (cycle === 6) start = 0;
    return { start: Math.min(start, at), refresh };
  }

  function countsFromDb(db, roleId, context, at) {
    const counts = new Map();
    const rows = db.prepare(`SELECT product_id,buy_num,created_at FROM activity_purchases
      WHERE role_id=? AND activity_id=? AND kind='gift' ORDER BY rowid`).all(roleId, context.actId);
    for (const row of rows) {
      const product = tables.Recharge?.get(Number(row.product_id));
      if (!product) continue;
      const cycle = giftCycle(product, at, context);
      const created = Date.parse(row.created_at);
      if (Number.isFinite(created) && Math.floor(created / 1000) < cycle.start) continue;
      counts.set(Number(row.product_id), (counts.get(Number(row.product_id)) ?? 0) + Number(row.buy_num));
    }
    return counts;
  }

  function applyRechargeInfo(data, context, roleId, db, at) {
    const counts = countsFromDb(db, roleId, context, at);
    data.role_data.recharge_limit_info = {
      refresh_time: String(deadline(context, at)),
      buy_num_list: [...counts.entries()].filter(([, count]) => count > 0).map(([rechargeId, count]) => ({
        recharge_id: rechargeId,
        buy_num: count,
        refresh_time: String(giftCycle(tables.Recharge.get(rechargeId), at, context).refresh),
        used_extra_times: 0
      }))
    };
    return data;
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    log({ event: 'hero_draw_activity_synchronizeLogin_entry', activity, at });
    const context = openActivity(activity, at);
    if (!context) return null;
    const data = normalizeDrawData(drawFromEntry(context.entry), context);
    return store.inspect(db => {
      const roleId = store.read().state.roleId;
      applyRechargeInfo(data, context, roleId, db, at);
      context.entry.module_login_data = wrapEtfBinary(codec.pack('pb_hero_draw_act_data', {
        role_data: data.role_data,
        server_draw_count: data.server_draw_count
      })).toString('base64');
      log({ event: 'hero_draw_activity_login_synchronized', actId: context.actId, drawCount: data.role_data.draw_count, serverDrawCount: data.server_draw_count, genreId: data.role_data.draw_exchange_id, gifts: data.role_data.recharge_limit_info.buy_num_list.length });
      return { actId: context.actId, drawData: data };
    });
  }

  function currentContextFromModel(model, at) {
    const module = new Map(model.state.modules.value).get(ACTIVITY_MODULE);
    if (!module) return null;
    const activity = codec.unpack('pb_act_login', rawBinary(module));
    return openActivity(activity, at);
  }

  function writeModule(model, bytes) {
    const modules = new Map(model.state.modules.value);
    modules.set(ACTIVITY_MODULE, serializedBinary(bytes));
    model.state.modules.value = [...modules];
  }

  function selectGenre(drawExchangeId, at = currentSeconds()) {
    log({ event: 'hero_draw_activity_selectGenre_entry', drawExchangeId, at });
    const id = integer(drawExchangeId, 1, 2147483647, 'Invalid hero draw genre');
    return store.transaction(model => {
      const context = currentContextFromModel(model, at);
      if (!context) fail(309, 'Hundred schools activity is not running');
      if (!genreRanks.has(id)) fail(1, 'Hero draw genre does not exist');
      const data = normalizeDrawData(drawFromEntry(context.entry), context);
      data.role_data.draw_exchange_id = id;
      writeDrawData(context.entry, data);
      writeModule(model, codec.pack('pb_act_login', context.activity));
      return { value: { drawExchangeId: id }, data: Buffer.alloc(0) };
    });
  }

  function coreHeroStarCount(model, context, data) {
    if (!genreRanks.has(Number(data.role_data.draw_exchange_id))) return 0;
    // HeroDrawActMgr.GetCoreHeroStarCount indexes the lineup table with the
    // selected draw_exchange_id. GenreRank.genre_team is only the client's
    // display grouping and does not key NormalDrawExchangeLineup.
    const lineup = heroTables.NormalDrawExchangeLineup?.get(Number(data.role_data.draw_exchange_id));
    const ids = (lineup?.hero ?? []).map(Number);
    return ids.reduce((sum, tid) => sum + (model.heroInfo.hero_list.find(hero => Number(hero.tid) === tid)?.star ?? 0), 0);
  }

  function personalDrawCount(model) {
    const roleStatistics = [...tables.CountStatistics.values()]
      .filter(row => !row.custom_login && Number(row.type) === ROLE_STATISTICS_TYPE);
    const statisticsIndex = roleStatistics.findIndex(row => Number(row.tid) === TID_COUNT_DRAW);
    const module = new Map(model.state.modules.value).get(STATISTICS_MODULE);
    if (statisticsIndex < 0 || !module || !Array.isArray(module.value)) {
      fail(5, 'Hero draw statistics module is missing');
    }
    const payload = module.value[statisticsIndex + 1];
    if (payload == null) return 0;

    let statistics;
    try {
      statistics = codec.unpack('pb_count_statics_data', rawBinary(payload));
    } catch {
      fail(5, 'Hero draw statistics are invalid');
    }
    let total = 0n;
    for (const row of statistics.list ?? []) {
      if (!PERSONAL_DRAW_LIBRARIES.has(Number(row.id))) continue;
      const value = BigInt(row.total ?? 0);
      if (value < 0n) fail(5, 'Hero draw statistics are invalid');
      total += value;
    }
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) fail(5, 'Hero draw statistics are invalid');
    return Number(total);
  }

  function taskProgress(model, context, data, task) {
    switch (Number(task.task_type)) {
      case 1: return personalDrawCount(model);
      case 2: return nonNegative(data.server_draw_count);
      case 3: return coreHeroStarCount(model, context, data);
      default: fail(5, 'Hundred schools task type is not configured');
    }
  }

  function claimPeriod(context) {
    return `hero-draw-v${Number(context.config.version)}:${runningEnterTime(context.state) || 0}`;
  }

  function claimTask(taskId, at = currentSeconds()) {
    log({ event: 'hero_draw_activity_claimTask_entry', taskId, at });
    const id = integer(taskId, 1, 2147483647, 'Invalid hero draw activity task');
    return store.transaction((model, db) => {
      const context = currentContextFromModel(model, at);
      if (!context) fail(309, 'Hundred schools activity is not running');
      const task = tasks.get(id);
      if (!task) fail(1, 'Hero draw activity task does not exist');
      if (Number(task.version) !== Number(context.config.version)) fail(1, 'Hero draw activity task version mismatch');
      const data = normalizeDrawData(drawFromEntry(context.entry), context);
      const progress = taskProgress(model, context, data, task);
      if (progress < Number(task.task_value)) fail(311, 'Hero draw activity task is not complete');
      const bits = Buffer.from(data.role_data.reward_bytes ?? []);
      if (hasBit(bits, id)) fail(310, 'Hero draw activity reward was already claimed');
      const period = claimPeriod(context);
      if (db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?').get(model.state.roleId, context.actId, id, period)) {
        fail(310, 'Hero draw activity reward was already claimed');
      }
      const res = grantResources(model, (task.award_list ?? []).map(([tid, count]) => [Number(tid), Number(count)]), tables);
      let nextBits = Buffer.alloc(Math.max(bits.length, Math.floor(id / 8) + 1));
      bits.copy(nextBits);
      nextBits = setBit(nextBits, id);
      data.role_data.reward_bytes = nextBits;
      writeDrawData(context.entry, data);
      writeModule(model, codec.pack('pb_act_login', context.activity));
      db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(model.state.roleId, context.actId, id, period, new Date(at * 1000).toISOString());
      const value = { reward_bytes: nextBits, res: { ...res, is_overflow: false } };
      return { value, data: codec.pack('pb_hero_draw_act_task_reward_back', value), valueForLog: { taskId: id, taskType: Number(task.task_type), progress, changes: res.changes.length } };
    });
  }

  function recordDraw(model, { lib, count = 1, seconds = currentSeconds() } = {}) {
    const drawLib = Number(lib), drawCount = Number(count);
    if (![1, 2, 3].includes(drawLib) || !Number.isSafeInteger(drawCount) || drawCount <= 0) return null;
    const context = currentContextFromModel(model, seconds);
    if (!context) return null;
    const data = normalizeDrawData(drawFromEntry(context.entry), context);
    data.role_data.draw_count = Math.min(2147483647, data.role_data.draw_count + drawCount);
    data.server_draw_count = Math.min(2147483647, data.server_draw_count + drawCount);
    writeDrawData(context.entry, data);
    writeModule(model, codec.pack('pb_act_login', context.activity));
    return { drawCount: data.role_data.draw_count, serverDrawCount: data.server_draw_count };
  }

  function giftConfig(productId, at = currentSeconds()) {
    const id = Number(productId);
    if (!giftIds.has(id)) return null;
    const context = openActivity(readActivity(), at);
    return context ? { activityId: context.actId, config: context.config, productId: id, product: tables.Recharge?.get(id) } : null;
  }

  function assertGiftAvailable(productId, at = currentSeconds()) {
    const gift = giftConfig(productId, at);
    if (!gift?.product) fail(309, 'Hundred schools activity gift is not running');
    return gift;
  }

  function giftPurchaseCount(productId, db = null, at = currentSeconds()) {
    const gift = giftConfig(productId, at);
    if (!gift) return 0;
    const read = database => {
      const context = openActivity(readActivity(), at);
      if (!context) return 0;
      const roleId = store.read().state.roleId;
      return countsFromDb(database, roleId, context, at).get(Number(productId)) ?? 0;
    };
    return db ? read(db) : store.inspect(read);
  }

  function giftPurchaseAllowed(productId, buyNum = 1, db = null, at = currentSeconds()) {
    const gift = assertGiftAvailable(productId, at);
    const limit = nonNegative(gift.product?.can_buy_times);
    if (!limit) return true;
    return giftPurchaseCount(productId, db, at) + Number(buyNum) <= limit;
  }

  function recordGiftPurchase({ model, db, activityId, productId, buyNum, priceItemTid = 0, priceAmount = 0, requestId, payload = {} }) {
    if (Number(activityId) !== ACTIVITY_ID) fail(5, 'Hundred schools gift activity mismatch');
    db.prepare(`INSERT INTO activity_purchases
      (role_id,activity_id,kind,product_id,buy_num,price_item_tid,price_amount,request_id,payload_json,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      model.state.roleId, ACTIVITY_ID, 'gift', Number(productId), Number(buyNum),
      Number(priceItemTid), Number(priceAmount), String(requestId), JSON.stringify(payload),
      new Date(currentSeconds() * 1000).toISOString()
    );
  }

  function rechargeExtra(activityId, db = null) {
    if (Number(activityId) !== ACTIVITY_ID) fail(5, 'Hundred schools gift activity mismatch');
    const at = currentSeconds();
    const read = database => {
      const activity = readActivity();
      const context = openActivity(activity, at);
      if (!context || context.actId !== ACTIVITY_ID) fail(309, 'Hundred schools activity is not running');
      const data = normalizeDrawData(drawFromEntry(context.entry), context);
      applyRechargeInfo(data, context, store.read().state.roleId, database, at);
      return { flag: RECHARGE_HANDLE, data: codec.pack('pb_hero_draw_act_role', data.role_data) };
    };
    return db ? read(db) : store.inspect(read);
  }

  return {
    activityId: ACTIVITY_ID,
    moduleId: ACTIVITY_MODULE,
    rechargeHandle: RECHARGE_HANDLE,
    rankIds: [...new Set([...genreRanks.values()].map(row => Number(row.rank_id)))],
    giftIds: () => [...giftIds],
    isActivityOpen: (at = currentSeconds()) => Boolean(openActivity(readActivity(), at)),
    findOpenActivity: (activity = readActivity(), at = currentSeconds()) => openActivity(activity, at),
    synchronizeLogin,
    selectGenre,
    claimTask,
    recordDraw,
    giftConfig,
    assertGiftAvailable,
    giftPurchaseCount,
    giftPurchaseAllowed,
    recordGiftPurchase,
    rechargeExtra,
    supports: type => type === 100301 || type === 100302
  };
}
