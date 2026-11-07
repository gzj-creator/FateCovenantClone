import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readDragonLandTables, dragonLandConfigForVersion } from '../config/dragon-land-tables.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { createDragonLandActService } from '../game/dragon-land-act-service.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const dragonLandTables = readDragonLandTables();
const SERVER_OPENED_AT = 1792789200;
const ACT_ID = 1036001;
const VERSION = 1;
const actWindow = activityWindow(tables.ActFrameAct.get(ACT_ID), SERVER_OPENED_AT);
const DAY_ONE = actWindow.start + 3600;
const DAY_TWO = DAY_ONE + 86400;
const awardDay = dragonLandConfigForVersion(dragonLandTables, VERSION).award_day;

function dragonLandEntries(store) {
  const module = new Map(store.state().modules.value).get(92);
  const value = codec.unpack('pb_act_login', rawBinary(module));
  return value.act_list ?? [];
}

function entryPayload(store, actId) {
  const entry = dragonLandEntries(store).find(item => Number(item.state_data?.act_id) === actId);
  assert.ok(entry, 'dragon land login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  // module_login_data is an ETF binary envelope (0x83 0x6d + length).
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return codec.unpack('pb_dragon_land_role_data', raw.subarray(6));
}

function setup(t, { nowSeconds = DAY_ONE, mode = 'all-open', running = () => true } = {}) {
  let clock = nowSeconds;
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-dragon-land-',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => clock * 1000
  });
  const make = () => createDragonLandActService({
    store: fixture.store,
    codec,
    tables,
    dragonLandTables,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode, isActivityRunning: running },
    now: () => clock * 1000,
    logger: () => {}
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return make(); },
    setTime(value) { clock = value; },
    reopen() { return fixture.open(); }
  };
}

function claimDaily(service, actId = ACT_ID) {
  const data = codec.pack('pb_dragon_land_daily_award_req', { activity_id: String(actId) });
  const result = service.execute(107701, data);
  return { result, value: codec.unpack('pb_dragon_land_daily_award_rsp', result.data) };
}

test('DragonLandActCmd 107701 grants the configured daily award once per activity day', t => {
  const harness = setup(t);
  const service = harness.service;

  const first = claimDaily(service);
  assert.equal(first.value.act_info.version, String(VERSION));
  assert.equal(first.value.act_info.daily_award, true);
  assert.deepEqual(
    first.value.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    awardDay.map(entry => [Number(entry[0]), Number(entry[1])])
  );
  assert.equal(entryPayload(harness.store, ACT_ID).daily_award, true);

  // A second request on the same activity day is acknowledged without a grant.
  const duplicate = claimDaily(service);
  assert.equal(duplicate.value.res.changes.length, 0);
  assert.equal(duplicate.value.act_info.daily_award, true);

  // The next activity day re-opens the claim.
  harness.setTime(DAY_TWO);
  const second = claimDaily(harness.service);
  assert.equal(second.value.res.changes.length, awardDay.length);
  assert.equal(entryPayload(harness.store, ACT_ID).daily_award, true);

  // A relogin still reports the award from the committed day marker.
  const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
  const sync = harness.service.synchronizeLogin(activity);
  assert.equal(sync.actId, ACT_ID);
  const synced = activity.act_list.find(entry => Number(entry.state_data.act_id) === ACT_ID);
  assert.ok(synced);
  const payload = codec.unpack('pb_dragon_land_role_data', Buffer.from(synced.module_login_data, 'base64').subarray(6));
  assert.equal(payload.daily_award, true);
  assert.equal(payload.version, String(VERSION));
});

test('DragonLandActCmd 107701 keeps the claim slot across a SQLite reopen', t => {
  const harness = setup(t);
  claimDaily(harness.service);
  harness.reopen();
  const reopened = harness.service;
  const duplicate = claimDaily(reopened);
  assert.equal(duplicate.value.res.changes.length, 0);
  assert.equal(duplicate.value.act_info.daily_award, true);
  harness.setTime(DAY_TWO);
  assert.equal(claimDaily(harness.service).value.res.changes.length, awardDay.length);
});

test('DragonLandActCmd 107701 rejects unknown, unconfigured and stopped activities', t => {
  const harness = setup(t);
  assert.throws(() => claimDaily(harness.service, 1036), error => error instanceof GameError && error.code === 1);
  // 62001 is a configured ActFrameTable row of an unrelated activity type.
  assert.throws(() => claimDaily(harness.service, 62001), error => error instanceof GameError && error.code === 1);
  const stopped = setup(t, { mode: 'schedule', running: () => false });
  assert.throws(() => claimDaily(stopped.service), error => error instanceof GameError && error.code === 309);
  assert.throws(
    () => harness.service.execute(107701, Buffer.from([0xff, 0xff, 0xff])),
    error => error instanceof GameError && error.code === 1
  );
});

test('DragonLandActCmd 107701 persists resources and the day marker in one transaction', t => {
  const harness = setup(t);
  const amounts = () => harness.store.inspect(db => new Map(
    db.prepare('SELECT tid, amount FROM resources WHERE role_id=?').all(harness.store.state().roleId)
      .map(row => [String(row.tid), Number(row.amount)])
  ));
  const before = amounts();
  const first = claimDaily(harness.service);
  const after = amounts();
  const row = harness.store.inspect(db => db.prepare('SELECT * FROM dragon_land_role_state WHERE role_id=? AND act_id=?').get(harness.store.state().roleId, ACT_ID));
  assert.ok(row, 'dragon land role state row is missing');
  assert.equal(Number(row.daily_award_day), 1);
  for (const change of first.value.res.changes) {
    const tid = String(change.tid);
    const delta = (after.get(tid) ?? 0) - (before.get(tid) ?? 0);
    assert.equal(delta, Number(change.diff_num), `resource ${tid} was not committed`);
  }
});
