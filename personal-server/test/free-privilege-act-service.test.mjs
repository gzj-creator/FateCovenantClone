import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readFreePrivilegeActTables } from '../config/free-privilege-act-tables.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { createFreePrivilegeActService } from '../game/free-privilege-act-service.mjs';
import { createMonthlyCardService } from '../game/monthly-card-service.mjs';
import { rechargeDayIndex } from '../game/recharge-rules.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const freePrivilegeTables = readFreePrivilegeActTables();
const SERVER_OPENED_AT = 1792789200;
const ACT_ID = 1060003;
const VERSION = 1;
const PERMANENT_DAY = 30;
const DAY_SECONDS = 86400;
const ACTIVE_TYPE = 110601;
const ACTIVE_MONTH_TYPE = 110602;
const actWindow = activityWindow(tables.ActFrameAct.get(ACT_ID), SERVER_OPENED_AT);
const DAY_ONE = actWindow.start + 3600;

function setup(t, { nowSeconds = DAY_ONE, serviceCodec = codec, running = () => true, tableSet = freePrivilegeTables } = {}) {
  let clock = nowSeconds;
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-free-privilege-',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => clock * 1000
  });
  const monthlyCard = createMonthlyCardService({ codec: serviceCodec, tables, now: () => clock * 1000 });
  const make = () => createFreePrivilegeActService({
    store: fixture.store,
    codec: serviceCodec,
    tables,
    freePrivilegeTables: tableSet,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode: 'all-open', isActivityRunning: running },
    monthlyCard,
    now: () => clock * 1000,
    logger: () => {}
  });
  return {
    fixture,
    monthlyCard,
    get store() { return fixture.store; },
    get service() { return make(); },
    setTime(value) { clock = value; },
    reopen() { return fixture.open(); }
  };
}

function activityOf(store) {
  const module = new Map(store.state().modules.value).get(92);
  return codec.unpack('pb_act_login', rawBinary(module));
}

function entryPayload(store, actId = ACT_ID) {
  const entry = (activityOf(store).act_list ?? []).find(item => Number(item.state_data?.act_id) === actId);
  assert.ok(entry, 'free privilege login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return codec.unpack('pb_free_privilege_act_act_role_data', raw.subarray(6));
}

function permanentInfo(store) {
  const module = new Map(store.state().modules.value).get(62);
  assert.ok(module, 'permanent card login module is missing');
  return codec.unpack('pb_permanent_card', rawBinary(module));
}

function monthlyInfo(store) {
  const module = new Map(store.state().modules.value).get(20);
  assert.ok(module, 'monthly card login module is missing');
  return codec.unpack('pb_monthly_card_info', rawBinary(module));
}

function stateRow(store) {
  return store.inspect(db => db.prepare('SELECT * FROM free_privilege_role_state WHERE act_id=?').get(ACT_ID));
}

function activate(service, actId = ACT_ID) {
  const result = service.execute(ACTIVE_TYPE, null, actId);
  return { result, value: codec.unpack('pb_free_privilege_act_activate_back', result.data) };
}

function activateMonth(service, actId = ACT_ID) {
  const result = service.execute(ACTIVE_MONTH_TYPE, null, actId);
  return { result, value: codec.unpack('pb_free_privilege_act_activate_month_back', result.data) };
}

test('FreePrivilegeActTable extraction exposes both activity versions', () => {
  assert.equal(freePrivilegeTables.versions.size, 2);
  assert.equal(freePrivilegeTables.shows.size, 2);
  assert.deepEqual(freePrivilegeTables.versions.get(1), {
    tid: 1, privilege_day: PERMANENT_DAY, is_month_card: true, month_card: 1
  });
  assert.deepEqual(freePrivilegeTables.versions.get(2), {
    tid: 2, privilege_day: PERMANENT_DAY, is_month_card: true, month_card: 1
  });
  const act = tables.ActFrameAct.get(ACT_ID);
  assert.equal(Number(act.type), 1072);
  assert.equal(Number(act.version), VERSION);
  assert.equal(tables.ActFrameType.get(1072).lua_module.reference, 'FreePrivilegeActMgr');
});

test('login sync publishes the free privilege role data inside module 92', t => {
  const harness = setup(t);
  const store = harness.store;
  const service = harness.service;
  const activity = activityOf(store);
  const synced = service.synchronizeLogin(activity, DAY_ONE);
  // all-open keeps both configured instances runnable and prefers the newest.
  const currentActId = service.currentActivity(DAY_ONE).actId;
  assert.equal(synced.actId, currentActId);
  assert.equal(synced.version, Number(tables.ActFrameAct.get(currentActId).version));
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === currentActId);
  assert.ok(entry);
  assert.equal(Number(entry.state_data.cur_state_id), 50);
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  const payload = codec.unpack('pb_free_privilege_act_act_role_data', raw.subarray(6));
  assert.equal(Number(payload.act_id), currentActId);
  assert.equal(Number(payload.active_time ?? 0), 0);
  assert.equal(Number(payload.monthly_card_active_time ?? 0), 0);
});

test('110601 activates a 30 day free permanent-card trial and persists it', t => {
  const harness = setup(t);
  const service = harness.service;
  const { value } = activate(service);
  const freeEndTime = DAY_ONE + PERMANENT_DAY * DAY_SECONDS;
  assert.equal(Number(value.act_data.act_id), ACT_ID);
  assert.equal(Number(value.act_data.active_time), DAY_ONE);
  assert.equal(Number(value.act_data.monthly_card_active_time ?? 0), 0);
  assert.equal(Number(value.permanent_card.free_endtime), freeEndTime);
  assert.deepEqual(value.permanent_card.element_list, []);
  assert.equal(Number(permanentInfo(harness.store).free_endtime), freeEndTime);
  assert.equal(Number(entryPayload(harness.store).active_time), DAY_ONE);
  assert.equal(Number(stateRow(harness.store).active_time), DAY_ONE);

  // A repeated activation acknowledges the stored window instead of extending it.
  harness.setTime(DAY_ONE + DAY_SECONDS);
  const again = activate(service);
  assert.equal(Number(again.value.act_data.active_time), DAY_ONE);
  assert.equal(Number(again.value.permanent_card.free_endtime), freeEndTime);
  assert.equal(Number(stateRow(harness.store).active_time), DAY_ONE);

  harness.reopen();
  assert.equal(Number(entryPayload(harness.store).active_time), DAY_ONE);
  const afterReopen = activate(harness.service);
  assert.equal(Number(afterReopen.value.permanent_card.free_endtime), freeEndTime);
});

test('110602 activates the configured free month card inside module 20', t => {
  const harness = setup(t);
  const service = harness.service;
  const { value } = activateMonth(service);
  assert.equal(Number(value.act_data.monthly_card_active_time), DAY_ONE);
  assert.equal(Number(value.act_data.active_time ?? 0), 0);
  const cards = value.monthly_card.card_list ?? [];
  assert.equal(cards.length, 1);
  assert.equal(Number(cards[0].id), 1);
  assert.equal(Number(cards[0].start_day), rechargeDayIndex(DAY_ONE));
  assert.equal(Number(cards[0].got_count ?? 0), 0);
  assert.deepEqual(value.res.changes, []);

  const stored = monthlyInfo(harness.store);
  assert.equal(stored.card_list.length, 1);
  assert.equal(Number(stored.card_list[0].id), 1);
  assert.equal(Number(entryPayload(harness.store).monthly_card_active_time), DAY_ONE);
  assert.equal(Number(stateRow(harness.store).monthly_card_active_time), DAY_ONE);

  // The same command after the card would have expired must not restart it.
  harness.setTime(DAY_ONE + 40 * DAY_SECONDS);
  const again = activateMonth(service);
  assert.equal(Number(again.value.act_data.monthly_card_active_time), DAY_ONE);
  assert.equal(Number(again.value.monthly_card.card_list[0].start_day), rechargeDayIndex(DAY_ONE));
  assert.equal(monthlyInfo(harness.store).card_list.length, 1);

  harness.reopen();
  assert.equal(Number(monthlyInfo(harness.store).card_list[0].start_day), rechargeDayIndex(DAY_ONE));
  assert.equal(Number(entryPayload(harness.store).monthly_card_active_time), DAY_ONE);
});

test('the activated free month card is claimable through the monthly card command', t => {
  const harness = setup(t);
  const service = harness.service;
  activateMonth(service);
  const claim = harness.store.transaction(model => harness.monthlyCard.claim({
    model,
    request: { card_list: [{ card_id: 1, day: [1] }] },
    at: DAY_ONE
  }));
  assert.deepEqual(claim.claims, [{ cardId: 1, day: 1 }]);
  assert.ok(claim.changes > 0);
  const stored = monthlyInfo(harness.store).card_list[0];
  assert.equal(Number(stored.got_count), 1);
});

test('110601 and 110602 reject unknown activity ids', t => {
  const harness = setup(t);
  const service = harness.service;
  assert.throws(() => activate(service, 9999999), error => error.code === 1);
  assert.throws(() => activateMonth(service, 9999999), error => error.code === 1);
  assert.equal(harness.store.inspect(db => Number(
    db.prepare('SELECT COUNT(*) AS count FROM free_privilege_role_state').get().count
  )), 0);
});

test('commands fail closed when the activity window is closed', t => {
  const harness = setup(t, { running: () => false });
  const service = harness.service;
  const closed = createFreePrivilegeActService({
    store: harness.store,
    codec,
    tables,
    freePrivilegeTables,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode: 'schedule', isActivityRunning: () => false },
    monthlyCard: harness.monthlyCard,
    now: () => DAY_ONE * 1000,
    logger: () => {}
  });
  assert.throws(() => activate(closed), error => error.code === 309);
  assert.throws(() => activateMonth(closed), error => error.code === 309);
  assert.equal(harness.store.inspect(db => Number(
    db.prepare('SELECT COUNT(*) AS count FROM free_privilege_role_state').get().count
  )), 0);
  assert.equal(service.supports(ACTIVE_TYPE), true);
});

test('missing version or month-card configuration is refused instead of guessed', t => {
  const harness = setup(t, { tableSet: { versions: new Map(), shows: new Map(), versionRows: [], showRows: [] } });
  const service = harness.service;
  assert.equal(service.currentActivity(), null);
  assert.throws(() => activate(service), error => error.code === 1);
  const emptyVersions = { versions: new Map([[1, { tid: 1, privilege_day: 0, is_month_card: false, month_card: 0 }]]), shows: new Map(), versionRows: [], showRows: [] };
  const noTrial = setup(t, { tableSet: emptyVersions }).service;
  assert.throws(() => activate(noTrial), error => error.code === 5);
  const noMonth = setup(t, { tableSet: { versions: new Map([[1, { tid: 1, privilege_day: 30, is_month_card: false, month_card: 0 }]]), shows: new Map(), versionRows: [], showRows: [] } }).service;
  assert.throws(() => activateMonth(noMonth), error => error.code === 5);
});

test('PB encoding failure rolls the permanent and month activation back', t => {
  const failingCodec = {
    ...codec,
    pack: (name, value) => {
      if (name === 'pb_free_privilege_act_activate_back' || name === 'pb_free_privilege_act_activate_month_back') {
        throw new Error('encode failure');
      }
      return codec.pack(name, value);
    }
  };
  const harness = setup(t, { serviceCodec: failingCodec });
  assert.throws(() => harness.service.execute(ACTIVE_TYPE, null, ACT_ID), /encode failure/);
  assert.equal(Number(permanentInfo(harness.store).free_endtime ?? 0), 0);
  assert.equal(stateRow(harness.store), undefined);

  const monthlyHarness = setup(t, { serviceCodec: failingCodec });
  assert.throws(() => monthlyHarness.service.execute(ACTIVE_MONTH_TYPE, null, ACT_ID), /encode failure/);
  assert.deepEqual(monthlyInfo(monthlyHarness.store).card_list, []);
  assert.equal(stateRow(monthlyHarness.store), undefined);
});

test('SQLite write failure rolls the month-card module and login sync back', t => {
  const harness = setup(t);
  const service = harness.service;
  harness.store.inspect(db => db.exec(
    "CREATE TRIGGER reject_free_privilege_state BEFORE INSERT ON free_privilege_role_state BEGIN SELECT RAISE(ABORT, 'Injected free privilege storage failure'); END"
  ));
  assert.throws(() => activateMonth(service), /Injected free privilege storage failure/);
  assert.deepEqual(monthlyInfo(harness.store).card_list, []);
  const rolledBack = (activityOf(harness.store).act_list ?? [])
    .filter(item => [1060003, 1060013].includes(Number(item.state_data?.act_id)));
  assert.deepEqual(rolledBack, []);
  assert.equal(harness.store.inspect(db => Number(
    db.prepare('SELECT COUNT(*) AS count FROM free_privilege_role_state').get().count
  )), 0);
});
