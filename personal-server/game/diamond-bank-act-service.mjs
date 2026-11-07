import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import {
  readDiamondBankActTables,
  diamondBankLiveTasksForVersion,
  diamondBankGiftsForVersion,
  diamondBankVerForVersion,
  TASK_DAILY
} from '../config/diamond-bank-act-tables.mjs';
import { activityWindow, dayZero } from './activity-calendar.mjs';
import { GameError } from './hero-progression.mjs';
import {
  consumeResources,
  grantResources,
  partitionGrantableResources,
  releaseGrantablePendingRewards
} from './resources.mjs';

const ACTIVITY_LOGIN_MODULE = 92;
const RUNNING_STATE_ID = 50;
const DAY_SECONDS = 86400;
// TaskTable.TaskType.progress_type=2 rows read a CountStatistics slot out of the
// module-21 statistics block, exactly like the linear/common task services.
const STATISTICS_MODULE = 21;
const ROLE_STATISTICS_TYPE = 0;
const TASK_TYPE = 110201;
const AWARD_TYPE = 110202;
const BUY_TYPE = 110203;
const SOURCE_PREFIX = 'diamond_bank_act:';
// ActFrameTable rows of this activity family reference DiamondBankActMgr through
// ActFrameType.lua_module; ActFrameTable.TID_DIAMOND_BANK_ACT resolves to 1069 in
// the shipped client table.
const ACTIVITY_MANAGER = 'DiamondBankActMgr';

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function toInteger(value) {
  if (value == null) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : Number.NaN;
}

// ActivityMgr.DecodeErl unwraps module_login_data as ETF before handing the
// payload to DiamondBankActMgr.EnterState, so the protobuf is ETF-wrapped here.
function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Diamond bank activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

// LiveTask.award and Ver.open_use_item are [[tid, count], ...] arrays.
function parseResourceList(list, label) {
  if (!Array.isArray(list) || !list.length) throw new GameError(5, 'Diamond bank ' + label + ' is missing');
  return list.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Diamond bank ' + label + ' is invalid');
    const tid = Number(entry[0]), count = Number(entry[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new GameError(5, 'Diamond bank ' + label + ' is invalid');
    }
    return [tid, count];
  });
}

function parseClaims(text) {
  try {
    const value = JSON.parse(text ?? '[]');
    if (!Array.isArray(value)) return [];
    return value
      .map(entry => ({ tid: toInteger(entry?.tid), get_time: toInteger(entry?.get_time) }))
      .filter(entry => Number.isSafeInteger(entry.tid) && entry.tid > 0
        && Number.isSafeInteger(entry.get_time) && entry.get_time > 0);
  } catch {
    return [];
  }
}

export function createDiamondBankActService({
  store,
  codec,
  tables,
  diamondBankTables = readDiamondBankActTables(),
  calendar,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(typeof now === 'function' ? now() : now);
  const serverOpenedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
  const nowIso = () => new Date(currentSeconds() * 1000).toISOString();

  // ActFrameTable.TID_DIAMOND_BANK_ACT is not shipped as a plain constant, but
  // ActFrameType pairs every activity type with the manager that owns it, so the
  // service claims exactly the types whose manager is DiamondBankActMgr.
  const activityTypes = new Set([...(tables?.ActFrameType?.values?.() ?? [])]
    .filter(row => String(row?.lua_module?.reference ?? '') === ACTIVITY_MANAGER)
    .map(row => Number(row.tid))
    .filter(type => Number.isSafeInteger(type)));

  function configFor(act) {
    const config = diamondBankVerForVersion(diamondBankTables, act.version);
    if (!config) throw new GameError(5, 'Diamond bank activity version is not configured');
    return config;
  }

  function actConfig(actId) {
    const row = tables?.ActFrameAct?.get(Number(actId));
    if (!row || !activityTypes.has(Number(row.type))) return null;
    const version = Number(row.version);
    if (!Number.isSafeInteger(version) || !diamondBankVerForVersion(diamondBankTables, version)) return null;
    return { actId: Number(actId), config: row, version };
  }

  function withWindow(act) {
    return { ...act, window: activityWindow(act.config, serverOpenedAt) };
  }

  function started(act, at) {
    const start = Number(act.window?.start);
    return Number.isSafeInteger(start) && start <= at;
  }

  // The client scans ActFrameTable for its own running window, so prefer the
  // newest period whose configured window already started rather than the first
  // table row; all-open mode keeps every configured act visible.
  function selectActivity(activity = null, at = currentSeconds()) {
    const candidates = [...(tables?.ActFrameAct?.values?.() ?? [])]
      .map(row => actConfig(row.tid))
      .filter(Boolean)
      .map(withWindow);
    if (!candidates.length) return null;
    if (calendar?.mode === 'all-open') {
      const startedActs = candidates
        .filter(act => started(act, at))
        .sort((left, right) => right.actId - left.actId);
      const pick = startedActs[0] ?? candidates.sort((left, right) => right.actId - left.actId)[0];
      return { ...pick, start: Number(pick.window?.start ?? serverOpenedAt) };
    }
    if (!calendar?.isActivityRunning) throw new GameError(5, 'Diamond bank activity calendar is unavailable');
    const running = candidates
      .filter(act => calendar.isActivityRunning(act.actId, null, activity, at))
      .sort((left, right) => right.actId - left.actId);
    if (!running.length) return null;
    return { ...running[0], start: Number(running[0].window?.start ?? serverOpenedAt) };
  }

  function requestActivity(actId, at = currentSeconds()) {
    const act = actConfig(actId);
    if (!act) throw new GameError(1, 'Unknown diamond bank activity');
    const resolved = withWindow(act);
    if (calendar?.isActivityRunning && !calendar.isActivityRunning(resolved.actId, null, null, at)) {
      throw new GameError(309, 'Diamond bank activity is not running');
    }
    return { ...resolved, start: Number(resolved.window?.start ?? serverOpenedAt) };
  }

  function loadActivity() {
    const module = new Map(store.state().modules.value).get(ACTIVITY_LOGIN_MODULE);
    if (!module) return null;
    const bytes = rawBinary(module);
    if (!bytes.length) return null;
    try {
      return codec.unpack('pb_act_login', bytes);
    } catch {
      throw new GameError(5, 'Activity login data is invalid');
    }
  }

  function ensureDiamondBankTables(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS diamond_bank_role_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id),
      act_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_buy INTEGER NOT NULL DEFAULT 0,
      is_get INTEGER NOT NULL DEFAULT 0,
      task_get_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (role_id, act_id)
    )`);
  }

  if (store?.inspect) store.inspect(ensureDiamondBankTables);

  function roleState(db, roleId, act) {
    const row = db.prepare('SELECT * FROM diamond_bank_role_state WHERE role_id=? AND act_id=?').get(roleId, act.actId);
    if (row) return { ...row, is_buy: Number(row.is_buy) === 1, is_get: Number(row.is_get) === 1 };
    const timestamp = nowIso();
    return {
      role_id: Number(roleId), act_id: act.actId, version: act.version,
      is_buy: false, is_get: false, task_get_json: '[]',
      created_at: timestamp, updated_at: timestamp
    };
  }

  function saveRoleState(db, state) {
    state.updated_at = nowIso();
    db.prepare(`INSERT INTO diamond_bank_role_state (
      role_id, act_id, version, is_buy, is_get, task_get_json, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(role_id,act_id) DO UPDATE SET
      version=excluded.version,
      is_buy=excluded.is_buy,
      is_get=excluded.is_get,
      task_get_json=excluded.task_get_json,
      updated_at=excluded.updated_at`).run(
      state.role_id, state.act_id, state.version,
      state.is_buy ? 1 : 0, state.is_get ? 1 : 0, state.task_get_json ?? '[]',
      state.created_at, state.updated_at
    );
  }

  function hasTable(db, name) {
    return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));
  }

  // DiamondBankActMgr.GetNormalGiftList expands Ver.gift through the VerRecharge
  // rows of that version. buy_times mirrors RechargeMgr.GetDailyDiscountData and
  // is derived from the local wallet's paid orders so the gift form's
  // can_buy_times check and the server agree.
  function dailyDiscountList(db, roleId, act) {
    const gifts = diamondBankGiftsForVersion(diamondBankTables, act.version);
    if (!gifts.length) return [];
    if (!hasTable(db, 'recharge_orders') || !hasTable(db, 'local_wallets')) return [];
    const products = gifts.map(row => Number(row.recharge_id));
    const placeholders = products.map(() => '?').join(',');
    const rows = db.prepare(`SELECT o.product_id AS product_id, COUNT(*) AS buy_times
      FROM recharge_orders o JOIN local_wallets w ON w.account_id=o.account_id
      WHERE w.role_id=? AND o.product_id IN (${placeholders})
      GROUP BY o.product_id`).all(Number(roleId), ...products);
    const counts = new Map(rows.map(row => [Number(row.product_id), Number(row.buy_times) || 0]));
    return gifts.map(row => ({
      recharge_tid: Number(row.recharge_id),
      buy_times: counts.get(Number(row.recharge_id)) ?? 0
    }));
  }

  function rolePayload(db, roleId, act) {
    const state = roleState(db, roleId, act);
    return {
      act_tid: String(act.actId),
      task_get: parseClaims(state.task_get_json).map(entry => ({
        tid: String(entry.tid), get_time: String(entry.get_time)
      })),
      is_buy: state.is_buy,
      is_get: state.is_get,
      daily_discount_list: dailyDiscountList(db, roleId, act)
    };
  }

  function rolePayloadOf(db, roleId, act, state) {
    return {
      act_tid: String(act.actId),
      task_get: parseClaims(state.task_get_json).map(entry => ({
        tid: String(entry.tid), get_time: String(entry.get_time)
      })),
      is_buy: state.is_buy,
      is_get: state.is_get,
      daily_discount_list: dailyDiscountList(db, roleId, act)
    };
  }

  function applyLoginEntry(activity, act, rolePb) {
    activity.act_list ??= [];
    activity.act_parallel_list ??= [];
    activity.act_list = activity.act_list.filter(entry => Number(entry?.state_data?.act_id) !== act.actId);
    activity.act_parallel_list = activity.act_parallel_list.flatMap(group => {
      const states = (group.states_data ?? []).filter(state => Number(state?.act_id) !== act.actId);
      return states.length ? [{ ...group, states_data: states }] : [];
    });
    const entry = { state_data: { act_id: act.actId }, module_login_data: '' };
    entry.state_data.cur_state_id = RUNNING_STATE_ID;
    entry.state_data.history_time = [{ state_id: RUNNING_STATE_ID, enter_time: Number(act.start ?? currentSeconds()) }];
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_diamond_bank_act_role_data', rolePb)).toString('base64');
    activity.act_list.push(entry);
    return entry;
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    const act = selectActivity(activity, at);
    if (!act) return { actId: null, version: null, start: null };
    const roleId = store.state().roleId;
    const rolePb = store.inspect(db => rolePayload(db, roleId, act));
    applyLoginEntry(activity, act, rolePb);
    log({ event: 'diamond_bank_login_synchronized', actId: act.actId, version: act.version, start: act.start });
    return { actId: act.actId, version: act.version, start: act.start };
  }

  function refreshStoredLogin(model, db, act, roleId) {
    const modules = new Map(model.state.modules.value);
    const stored = modules.get(ACTIVITY_LOGIN_MODULE);
    if (!stored) return;
    const bytes = rawBinary(stored);
    if (!bytes.length) return;
    try {
      const activity = codec.unpack('pb_act_login', bytes);
      applyLoginEntry(activity, act, rolePayload(db, roleId, act));
      modules.set(ACTIVITY_LOGIN_MODULE, serializedBinary(codec.pack('pb_act_login', activity)));
      model.state.modules.value = [...modules];
    } catch (error) {
      log({ event: 'diamond_bank_login_refresh_skipped', actId: act.actId, error: error?.message ?? String(error) });
    }
  }

  function activatePendingRewards() {
    const roleId = store.state().roleId;
    const hasPending = store.inspect(db => Boolean(db.prepare(
      "SELECT 1 FROM pending_rewards WHERE role_id=? AND status='pending' AND source_key LIKE 'diamond_bank_act:%' LIMIT 1"
    ).get(roleId)));
    if (!hasPending) return;
    try {
      const result = store.transaction((model, db) => releaseGrantablePendingRewards(model, db, tables, { sourcePrefix: SOURCE_PREFIX }));
      if (result.released.length) log({ event: 'diamond_bank_pending_rewards_released', released: result.released });
    } catch (error) {
      log({ event: 'diamond_bank_pending_rewards_release_failed', error: error?.message ?? String(error) });
    }
  }

  activatePendingRewards();

  // TaskTable.TaskType.progress_type=2 rows can be rebuilt from the module-21
  // statistics block. The remaining rows rely on client progress_fun callbacks
  // (464/463/13) that the personal server has no authoritative producer for, so
  // their claims stay unavailable instead of being credited from guessed values.
  function taskProgress(model, task) {
    const typeConfig = tables?.TaskType?.get(Number(task.type));
    if (!typeConfig) throw new GameError(5, 'Diamond bank task type is not configured');
    if (Number(typeConfig.progress_type) !== 2 || !Array.isArray(typeConfig.stat_expand)) {
      throw new GameError(5, `Diamond bank task progress_fun ${typeConfig.progress_fun ?? 0} is unavailable`);
    }
    const statisticsType = Number(typeConfig.data);
    // custom_login statistics rows are pushed through a dedicated reply instead
    // of the module-21 block, so their value cannot be rebuilt here.
    const statisticsRow = tables?.CountStatistics?.get?.(statisticsType);
    if (!statisticsRow) throw new GameError(5, 'Diamond bank statistics slot is not configured');
    if (statisticsRow.custom_login) {
      throw new GameError(5, `Diamond bank custom statistics slot ${statisticsType} is unavailable`);
    }
    const roleStatistics = [...(tables.CountStatistics?.values?.() ?? [])]
      .filter(row => !row.custom_login && Number(row.type) === ROLE_STATISTICS_TYPE);
    const index = roleStatistics.findIndex(row => Number(row.tid) === statisticsType);
    if (index < 0) throw new GameError(5, 'Diamond bank statistics slot is not configured');
    const module = new Map(model.state.modules.value).get(STATISTICS_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Statistics login module is missing');
    const payload = module.value[index + 1];
    if (payload == null) return 0;
    let data;
    try {
      data = codec.unpack('pb_count_statics_data', rawBinary(payload));
    } catch {
      throw new GameError(5, 'Diamond bank statistics payload is invalid');
    }
    const ids = new Set(typeConfig.stat_expand.map(String));
    let total = 0n;
    for (const row of data.list ?? []) {
      if (!ids.has(String(row.id))) continue;
      const value = BigInt(row.total ?? 0);
      if (value < 0n) throw new GameError(5, 'Diamond bank statistics payload is invalid');
      total += value;
    }
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new GameError(5, 'Diamond bank statistics overflow');
    return Number(total);
  }

  // DiamondBankActData:IsTaskTaked keeps daily rows only for the current flush
  // day and treats every other keep_type as once per activity.
  function isTaked(claims, task, at) {
    const dayBegin = dayZero(at);
    return claims.some(entry => {
      if (Number(entry.tid) !== Number(task.tid)) return false;
      if (Number(task.keep_type) === TASK_DAILY) return dayBegin <= Number(entry.get_time);
      return true;
    });
  }

  function requestTaskIds(request) {
    const actId = toInteger(request.act_id);
    if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid diamond bank activity id');
    const values = Array.isArray(request.value) ? request.value : [];
    const ids = values.map(toInteger);
    if (!ids.length) throw new GameError(1, 'Diamond bank task list is empty');
    for (const tid of ids) {
      if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid diamond bank task id');
    }
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) throw new GameError(1, 'Diamond bank task list has duplicates');
    return { actId, ids: unique.sort((left, right) => left - right) };
  }

  function claimTasks(data) {
    let request;
    try {
      request = codec.unpack('pb_diamond_bank_act_base_req', data ?? Buffer.alloc(0));
    } catch {
      throw new GameError(1, 'Invalid diamond bank task request');
    }
    const { actId, ids } = requestTaskIds(request);
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const rows = ids.map(tid => {
      const row = diamondBankTables.liveTasks.get(tid);
      if (!row || Number(row.ver) !== act.version) throw new GameError(5, 'Diamond bank task is not configured');
      const target = Number(row.target_count);
      if (!Number.isSafeInteger(target) || target <= 0) throw new GameError(5, 'Diamond bank task configuration is invalid');
      return { row, tid, target, award: parseResourceList(row.award, 'task award') };
    });
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      if (!state.is_buy) throw new GameError(311, 'Diamond bank must be opened before its tasks can be claimed');
      const claims = parseClaims(state.task_get_json);
      const claimed = [];
      for (const { row, tid, target, award } of rows) {
        if (isTaked(claims, row, at)) continue;
        const progress = taskProgress(model, row);
        if (progress < target) throw new GameError(311, 'Diamond bank task has not been completed');
        claimed.push({ tid, award });
      }
      if (!claimed.length) {
        const res = { changes: [] };
        log({ event: 'diamond_bank_task_duplicate_acknowledged', actId, ids });
        const value = { role_data: rolePayloadOf(db, roleId, act, state), res };
        return { value, data: codec.pack('pb_diamond_bank_act_task_rsp', value) };
      }
      // Each task keeps its own partition so a reward without a server handler
      // is recorded once under that task's source key instead of once per
      // claimed task; the grantable rows still share one grantResources call.
      const partitioned = claimed.map(entry => ({
        tid: entry.tid,
        ...partitionGrantableResources(entry.award, tables)
      }));
      const res = grantResources(model, partitioned.flatMap(entry => entry.grantable), tables);
      const createdAt = new Date(at * 1000).toISOString();
      const insertPending = db.prepare(
        'INSERT INTO pending_rewards(role_id,source_key,item_tid,quantity,res_type,reason,status,created_at) VALUES (?,?,?,?,?,?,\'pending\',?)'
      );
      for (const entry of partitioned) {
        claims.push({ tid: entry.tid, get_time: at });
        const sourceKey = [SOURCE_PREFIX.slice(0, -1), actId, 'task', entry.tid, at].join(':');
        for (const reward of entry.pending) {
          insertPending.run(
            roleId, sourceKey, reward.tid, reward.quantity, reward.resType,
            reward.resType === null ? reward.reason : `${reward.reason}:${reward.resType}`, createdAt
          );
        }
      }
      state.task_get_json = JSON.stringify(claims.sort((left, right) => left.get_time - right.get_time || left.tid - right.tid));
      saveRoleState(db, state);
      refreshStoredLogin(model, db, act, roleId);
      log({
        event: 'diamond_bank_task_committed', actId, ids: partitioned.map(entry => entry.tid),
        changes: res.changes.length,
        pending: partitioned.flatMap(entry => entry.pending.map(reward => [entry.tid, reward.tid, reward.quantity]))
      });
      const value = { role_data: rolePayloadOf(db, roleId, act, state), res };
      // Encoding stays inside the transaction so a serialisation failure rolls
      // the grant and the claim marker back together.
      return { value, data: codec.pack('pb_diamond_bank_act_task_rsp', value) };
    });
    return { value: result.value, data: result.data, actId };
  }

  function openBank(actId) {
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const config = configFor(act);
    const cost = parseResourceList(config.open_use_item, 'open cost');
    const addNum = Number(config.open_add_num);
    const actItem = Number(config.act_item);
    if (!Number.isSafeInteger(addNum) || addNum < 0) throw new GameError(5, 'Diamond bank open award is invalid');
    if (!Number.isSafeInteger(actItem) || actItem <= 0) throw new GameError(5, 'Diamond bank deposit item is not configured');
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      if (state.is_buy) {
        const res = { changes: [] };
        log({ event: 'diamond_bank_open_duplicate_acknowledged', actId });
        return { value: res, data: codec.pack('pb_res_to_client', res) };
      }
      const spent = consumeResources(model, cost, 301, { codec, now: () => at });
      // Ver.open_add_num is not read by the client: it is the deposit the bank
      // holds after opening. Minting it into Ver.act_item keeps the displayed
      // "saved diamonds" (MainForm._RefreshSaveDiamond reads the owned count)
      // equal to the configured opening deposit.
      const granted = addNum > 0 ? grantResources(model, [[actItem, addNum]], tables, { codec }) : { changes: [] };
      state.is_buy = true;
      saveRoleState(db, state);
      refreshStoredLogin(model, db, act, roleId);
      const res = { changes: [...spent.changes, ...granted.changes] };
      log({
        event: 'diamond_bank_open_committed', actId,
        spent: spent.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
        deposit: addNum
      });
      return { value: res, data: codec.pack('pb_res_to_client', res) };
    });
    return { value: result.value, data: result.data, actId };
  }

  function awardBank(actId) {
    const at = currentSeconds();
    const act = requestActivity(actId, at);
    const config = configFor(act);
    const actItem = Number(config.act_item), addItem = Number(config.add_item);
    const maxLimit = Number(config.max_limit), rage = Number(config.rage);
    if (!Number.isSafeInteger(actItem) || actItem <= 0) throw new GameError(5, 'Diamond bank deposit item is not configured');
    if (!Number.isSafeInteger(addItem) || addItem <= 0) throw new GameError(5, 'Diamond bank payout item is not configured');
    if (!Number.isSafeInteger(maxLimit) || maxLimit <= 0) throw new GameError(5, 'Diamond bank payout limit is not configured');
    if (!Number.isSafeInteger(rage) || rage <= 0) throw new GameError(5, 'Diamond bank payout rate is not configured');
    const roleId = store.state().roleId;
    const result = store.transaction((model, db) => {
      const state = roleState(db, roleId, act);
      if (!state.is_buy) throw new GameError(311, 'Diamond bank must be opened before it can be claimed');
      if (state.is_get) {
        const res = { changes: [] };
        log({ event: 'diamond_bank_award_duplicate_acknowledged', actId });
        return { value: res, data: codec.pack('pb_res_to_client', res) };
      }
      const deposit = Number(BigInt(model.resources.get(String(actItem))?.num ?? 0));
      if (!Number.isSafeInteger(deposit) || deposit < 0) throw new GameError(5, 'Diamond bank deposit is invalid');
      if (deposit <= 0) throw new GameError(311, 'Diamond bank has no deposit to claim');
      const capped = Math.min(deposit, maxLimit);
      const payout = Math.floor(capped * rage / 10000);
      const spent = consumeResources(model, [[actItem, capped]], 311, { codec, now: () => at });
      const granted = payout > 0 ? grantResources(model, [[addItem, payout]], tables, { codec }) : { changes: [] };
      state.is_get = true;
      saveRoleState(db, state);
      refreshStoredLogin(model, db, act, roleId);
      const res = { changes: [...spent.changes, ...granted.changes] };
      log({
        event: 'diamond_bank_award_committed', actId,
        deposit, capped, payout, rage,
        changes: res.changes.length
      });
      return { value: res, data: codec.pack('pb_res_to_client', res) };
    });
    return { value: result.value, data: result.data, actId };
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE,
    supports: type => [TASK_TYPE, AWARD_TYPE, BUY_TYPE].includes(Number(type)),
    currentActivity: (at = currentSeconds()) => selectActivity(loadActivity(), at),
    synchronizeLogin,
    execute(type, data, argument = null) {
      switch (Number(type)) {
        case TASK_TYPE: return claimTasks(data);
        case AWARD_TYPE: {
          const actId = toInteger(argument);
          if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid diamond bank activity id');
          return awardBank(actId);
        }
        case BUY_TYPE: {
          const actId = toInteger(argument);
          if (!Number.isSafeInteger(actId) || actId <= 0) throw new GameError(1, 'Invalid diamond bank activity id');
          return openBank(actId);
        }
        default: throw new GameError(5, 'Diamond bank command is not implemented');
      }
    }
  };
}

