import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { rechargeDayIndex, rechargeDayStart, rechargeServerDayNumber } from './recharge-rules.mjs';

export const ONLINE_GIFT_MODULE_ID = 134;
export const ONLINE_GIFT_COMMAND = 37010;
export const ONLINE_GIFT_CANT_RECEIVE = 53901;
export const ONLINE_GIFT_RECEIVED_ALL = 53902;

function seconds(value) {
  return Math.floor(Number(value) / 1000);
}

function infoOf(row) {
  return {
    open: Boolean(row.open),
    last_receive_id: Number(row.last_receive_id),
    receive_time: Number(row.receive_time),
    acc_sec: Number(row.acc_sec),
    period: Number(row.period),
    open_day_index: Number(row.open_day_index)
  };
}

export function createOnlineGiftService({ store, codec, tables, gameTables, serverOpenedAt, now = Date.now, logger = () => {} }) {
  if (!tables?.giftsByPeriod) throw new Error('Online gift configuration is required');
  if (!gameTables?.Item) throw new Error('Game reward tables are required');
  const log = event => { try { logger(event); } catch {} };
  const openedAt = Number.isSafeInteger(Number(serverOpenedAt)) && Number(serverOpenedAt) > 0
    ? Number(serverOpenedAt)
    : Number(store.serverOpenedAt);
  if (!Number.isSafeInteger(openedAt) || openedAt <= 0) throw new Error('Server opening time is required for online gift');
  store.inspect(db => db.exec(`CREATE TABLE IF NOT EXISTS online_gift_state (
    role_id INTEGER PRIMARY KEY REFERENCES roles(role_id),
    period INTEGER NOT NULL CHECK(period>=1), last_receive_id INTEGER NOT NULL DEFAULT 0 CHECK(last_receive_id>=0),
    receive_time INTEGER NOT NULL DEFAULT 0 CHECK(receive_time>=0), acc_sec INTEGER NOT NULL DEFAULT 0 CHECK(acc_sec>=0),
    open_day_index INTEGER NOT NULL CHECK(open_day_index>=1), day_index INTEGER NOT NULL,
    session_open INTEGER NOT NULL DEFAULT 0 CHECK(session_open IN (0,1)),
    session_started_at INTEGER NOT NULL DEFAULT 0 CHECK(session_started_at>=0), updated_at TEXT NOT NULL
  )`));
  const sessions = new Map();

  function ensureRow(model, db, at) {
    let row = db.prepare('SELECT * FROM online_gift_state WHERE role_id=?').get(model.state.roleId);
    if (!row) {
      const dayIndex = rechargeDayIndex(at);
      const serverDay = rechargeServerDayNumber(openedAt, at);
      db.prepare(`INSERT INTO online_gift_state
        (role_id,period,last_receive_id,receive_time,acc_sec,open_day_index,day_index,session_open,session_started_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        model.state.roleId, Math.min(serverDay, tables.lastConfiguredPeriod), 0, 0, 0, serverDay,
        dayIndex, 0, 0, new Date(at * 1000).toISOString()
      );
      row = db.prepare('SELECT * FROM online_gift_state WHERE role_id=?').get(model.state.roleId);
    }
    return row;
  }

  function synchronizeDay(model, db, row, at) {
    const dayIndex = rechargeDayIndex(at);
    const serverDay = rechargeServerDayNumber(openedAt, at);
    if (Number(row.day_index) !== dayIndex) {
      row.day_index = dayIndex;
      row.period = Math.min(serverDay, tables.lastConfiguredPeriod);
      row.open_day_index = serverDay;
      row.last_receive_id = 0;
      row.receive_time = 0;
      row.acc_sec = 0;
    } else if (Number(row.open_day_index) !== serverDay) {
      row.open_day_index = serverDay;
      row.period = Math.min(serverDay, tables.lastConfiguredPeriod);
    }
    row.open = 1;
    return row;
  }

  function accrue(row, at) {
    if (!Number(row.session_open) || !row.session_started_at) return;
    const start = Math.min(Number(row.session_started_at), at);
    const activeStart = Math.max(start, rechargeDayStart(at));
    const elapsed = Math.max(0, Math.min(86400, at - activeStart));
    row.acc_sec = Number(row.acc_sec) + elapsed;
    row.session_started_at = at;
  }

  function persistRow(db, row, at) {
    db.prepare(`UPDATE online_gift_state SET
      period=?,last_receive_id=?,receive_time=?,acc_sec=?,open_day_index=?,day_index=?,
      session_open=?,session_started_at=?,updated_at=? WHERE role_id=?`).run(
      Number(row.period), Number(row.last_receive_id), Number(row.receive_time), Number(row.acc_sec),
      Number(row.open_day_index), Number(row.day_index), Number(row.session_open), Number(row.session_started_at),
      new Date(at * 1000).toISOString(), Number(row.role_id)
    );
  }

  function writeLoginModule(model, info) {
    const modules = new Map(model.state.modules.value);
    modules.set(ONLINE_GIFT_MODULE_ID, serializedBinary(codec.pack('pb_online_gift_info', info)));
    model.state.modules.value = [...modules];
  }

  function currentRows(row) {
    return tables.giftsByPeriod.get(Number(row.period)) ?? [];
  }

  function currentInfo(row) {
    return infoOf({ ...row, open: true });
  }

  function synchronizeSession() {
    const at = seconds(now());
    return store.transaction((model, db) => {
      const row = synchronizeDay(model, db, ensureRow(model, db, at), at);
      row.session_open = 1;
      row.session_started_at = at;
      persistRow(db, row, at);
      const info = currentInfo(row);
      writeLoginModule(model, info);
      return info;
    });
  }

  function refreshActiveSession() {
    const at = seconds(now());
    return store.transaction((model, db) => {
      const row = synchronizeDay(model, db, ensureRow(model, db, at), at);
      accrue(row, at);
      persistRow(db, row, at);
      const info = currentInfo(row);
      writeLoginModule(model, info);
      return info;
    });
  }

  function beginSession() {
    const roleId = Number(store.state().roleId);
    const existing = sessions.get(roleId);
    if (existing) {
      existing.count += 1;
      return refreshActiveSession();
    }
    const info = synchronizeSession();
    sessions.set(roleId, { count: 1, startedAt: seconds(now()) });
    log({ event: 'online_gift_session_opened', roleId, period: info.period });
    return info;
  }

  function endSession() {
    const roleId = Number(store.state().roleId);
    const session = sessions.get(roleId);
    if (!session) return;
    session.count -= 1;
    if (session.count > 0) return;
    const at = seconds(now());
    store.transaction((model, db) => {
      const row = synchronizeDay(model, db, ensureRow(model, db, at), at);
      accrue(row, at);
      row.session_open = 0;
      row.session_started_at = 0;
      persistRow(db, row, at);
      writeLoginModule(model, currentInfo(row));
    });
    sessions.delete(roleId);
    log({ event: 'online_gift_session_closed', roleId, onlineSeconds: store.inspect(db => db.prepare('SELECT acc_sec FROM online_gift_state WHERE role_id=?').get(roleId)?.acc_sec ?? 0) });
  }

  function execute(type, input) {
    if (type !== ONLINE_GIFT_COMMAND) throw new GameError(1, 'Unsupported online gift command');
    const value = input?.value ?? input;
    if (value !== undefined && value !== null && value !== ''
      && !(Array.isArray(value) && value.length === 0)) {
      throw new GameError(1, 'Online gift award takes no parameters');
    }
    const at = seconds(now());
    const response = store.transaction((model, db) => {
      const row = synchronizeDay(model, db, ensureRow(model, db, at), at);
      accrue(row, at);
      const rows = currentRows(row);
      if (!rows.length) throw new GameError(ONLINE_GIFT_RECEIVED_ALL, 'Online gift period is not configured');
      let nextIndex = rows.findIndex(entry => Number(entry.tid) === Number(row.last_receive_id)) + 1;
      if (Number(row.last_receive_id) === 0 || nextIndex === 0) nextIndex = 0;
      const gift = rows[nextIndex];
      if (!gift) throw new GameError(ONLINE_GIFT_RECEIVED_ALL, 'All online gifts are received');
      const required = Number(gift.time);
      if (Number(row.acc_sec) < required) throw new GameError(ONLINE_GIFT_CANT_RECEIVE, 'Online gift time has not been reached');

      const res = grantResources(model, [[Number(gift.item), Number(gift.count)]], gameTables, { codec });
      row.last_receive_id = Number(gift.tid);
      row.receive_time = at;
      persistRow(db, row, at);
      const onlineGift = currentInfo(row);
      writeLoginModule(model, onlineGift);
      const responseValue = { online_gift: onlineGift, res };
      return { value: responseValue, data: codec.pack('pb_online_gift_back', responseValue) };
    });
    const session = sessions.get(Number(store.state().roleId));
    if (session) session.startedAt = at;
    log({ event: 'online_gift_claimed', giftTid: response.value.online_gift.last_receive_id, period: response.value.online_gift.period, changes: response.value.res.changes.length });
    return response;
  }

  return {
    supports: type => Number(type) === ONLINE_GIFT_COMMAND,
    moduleId: ONLINE_GIFT_MODULE_ID,
    beginSession,
    endSession,
    execute
  };
}
