import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
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

// Guild membership is module 24 (pb_res_guild_login); the local server keeps
// one guild, so the dragon land guild answers read the same block.
function seedGuild(store, guildId = '900001') {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const block = { guildId, guild: { guild_id: guildId, name: 'Local Guild', level: '1', member_list: [{ role_id: String(model.state.roleId) }] } };
    modules.set(24, serializedBinary(codec.pack('pb_res_guild_login', block)));
    model.state.modules.value = [...modules];
  });
}

function claimTrial(service, ids, actId = ACT_ID) {
  const data = codec.pack('pb_dragon_land_trial_award_req', {
    activity_id: String(actId),
    id_list: ids.map(String)
  });
  const result = service.execute(107702, data);
  return { result, value: codec.unpack('pb_dragon_land_trial_award_rsp', result.data) };
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

test('DragonLandActCmd 107702 pays only the hp_per tiers the boss has reached', t => {
  const harness = setup(t);
  seedGuild(harness.store);
  const service = harness.service;
  assert.equal(service.guildId(), '900001');

  // Boss 1 has 3000 hp; no fight has been recorded yet, so nothing is claimable.
  assert.throws(() => claimTrial(service, [10101]), error => error instanceof GameError && error.code === 311);

  harness.setTime(DAY_ONE + 60);
  service.recordBossDamage({ actId: ACT_ID, guildId: '900001', damage: 900, wayTid: 1, piece: 6 });
  assert.throws(() => claimTrial(service, [10102]), error => error instanceof GameError && error.code === 311);
  const tier = claimTrial(service, [10101]);
  assert.deepEqual(
    tier.value.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[101500, 10]]
  );
  assert.deepEqual(tier.value.act_info.boss_award_list, ['10101']);

  // Already claimed tiers are acknowledged without a second grant, even when a
  // batch mixes a fresh tier into the same request.
  const duplicate = claimTrial(service, [10101]);
  assert.equal(duplicate.value.res.changes.length, 0);
  harness.setTime(DAY_ONE + 120);
  harness.service.recordBossDamage({ actId: ACT_ID, guildId: '900001', damage: 1500, wayTid: 1, piece: 4 });
  const batch = claimTrial(harness.service, [10101, 10102, 10103]);
  assert.deepEqual(
    batch.value.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[101500, 70]]
  );
  assert.deepEqual(batch.value.act_info.boss_award_list, ['10101', '10102', '10103']);

  // Defeating the boss opens the hp_per 0 tier and advances the guild level.
  harness.setTime(DAY_ONE + 180);
  const progress = harness.service.recordBossDamage({ actId: ACT_ID, guildId: '900001', damage: 3000, wayTid: 1, piece: 2 });
  assert.equal(progress.level, 2);
  assert.equal(progress.lostHp, 0);
  const cleared = claimTrial(harness.service, [10104]);
  assert.deepEqual(
    cleared.value.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    [[101500, 100], [201500, 5000]]
  );
  // The next boss starts undamaged, so its tiers stay locked.
  assert.throws(() => claimTrial(harness.service, [10201]), error => error instanceof GameError && error.code === 311);

  assert.equal(entryPayload(harness.store, ACT_ID).boss_award_list.length, 4);
});

test('DragonLandActCmd 107702 validates ids, guild and the persisted claim list', t => {
  const harness = setup(t);
  seedGuild(harness.store);
  // 20101 is a BossAward row of version 2, so version 1 must not accept it.
  assert.throws(() => claimTrial(harness.service, [20101]), error => error instanceof GameError && error.code === 5);
  assert.throws(() => claimTrial(harness.service, [999999]), error => error instanceof GameError && error.code === 5);
  assert.throws(() => claimTrial(harness.service, []), error => error instanceof GameError && error.code === 1);
  assert.throws(() => claimTrial(harness.service, [0]), error => error instanceof GameError && error.code === 1);
  assert.throws(
    () => harness.service.execute(107702, Buffer.from([0xff, 0xff, 0xff])),
    error => error instanceof GameError && error.code === 1
  );

  harness.service.recordBossDamage({ actId: ACT_ID, guildId: '900001', damage: 3000, wayTid: 1, piece: 1 });
  assert.equal(claimTrial(harness.service, [10104]).value.res.changes.length, 2);
  harness.reopen();
  const reopened = harness.service;
  assert.equal(claimTrial(reopened, [10104]).value.res.changes.length, 0);

  // Without guild membership the boss progress is not authoritative locally.
  const lonely = setup(t);
  assert.throws(() => claimTrial(lonely.service, [10101]), error => error instanceof GameError && error.code === 311);
});

function readGuildData(service, actId = ACT_ID) {
  const data = codec.pack('pb_dragon_land_guild_data_req', { activity_id: String(actId) });
  const result = service.execute(107703, data);
  return { result, value: codec.unpack('pb_dragon_land_guild_data_rsp', result.data) };
}

test('DragonLandActCmd 107703 answers with the local guild boss and contribution rows', t => {
  const harness = setup(t);
  seedGuild(harness.store);
  const service = harness.service;

  const empty = readGuildData(service).value.guild_info;
  assert.equal(empty.version, String(VERSION));
  assert.equal(empty.level, '1');
  assert.equal(empty.boss_id, '1');
  // proto3 leaves zero valued int64 fields out of the wire form.
  assert.equal(Number(empty.lost_hp ?? 0), 0);
  assert.equal(Number(empty.piece ?? 0), 0);
  assert.deepEqual(empty.piece_list, []);
  assert.deepEqual(empty.display_list, []);

  harness.setTime(DAY_ONE + 60);
  service.recordBossDamage({ actId: ACT_ID, guildId: '900001', damage: 900, wayTid: 1, piece: 6 });
  harness.setTime(DAY_ONE + 120);
  harness.service.recordBossDamage({ actId: ACT_ID, guildId: '900001', damage: 150, wayTid: 3, piece: 4 });

  const info = readGuildData(harness.service).value.guild_info;
  assert.equal(info.lost_hp, '1050');
  assert.equal(info.piece, '10');
  assert.equal(info.piece_list.length, 1);
  const member = info.piece_list[0];
  assert.equal(member.rid, String(harness.store.state().roleId));
  assert.equal(member.damage, '1050');
  assert.deepEqual(
    member.display_list.map(item => [Number(item.tid), Number(item.piece), Number(item.day_index)]),
    [[1, 6, 1], [3, 4, 1]]
  );
  assert.deepEqual(
    info.display_list.map(item => [Number(item.tid), Number(item.piece), Number(item.day_index)]),
    [[1, 6, 1], [3, 4, 1]]
  );

  // The next day keeps yesterday's rows on the member record but clears the
  // today-only display list, matching the day_index field of pb_dragon_land_display.
  harness.setTime(DAY_TWO);
  const nextDay = readGuildData(harness.service).value.guild_info;
  assert.equal(nextDay.piece_list[0].display_list.length, 2);
  assert.deepEqual(nextDay.display_list, []);

  // Survivors of a reopen read the same rows.
  harness.reopen();
  assert.equal(readGuildData(harness.service).value.guild_info.piece, '10');
});

test('DragonLandActCmd 107703 rejects requests without guild authority', t => {
  const harness = setup(t);
  assert.throws(() => readGuildData(harness.service), error => error instanceof GameError && error.code === 5);
  assert.throws(() => readGuildData(harness.service, 62001), error => error instanceof GameError && error.code === 1);
  assert.throws(
    () => harness.service.execute(107703, Buffer.from([0xff, 0xff, 0xff])),
    error => error instanceof GameError && error.code === 1
  );
});

test('DragonLandActCmd 107703 acknowledges closed activity reads without a popup error', t => {
  const stopped = setup(t, { mode: 'schedule', running: () => false });
  const closed = readGuildData(stopped.service);
  assert.equal(closed.result.closed, true);
  assert.equal(closed.value.guild_info.version, String(VERSION));
  assert.equal(closed.value.guild_info.level, '1');
  assert.equal(closed.value.guild_info.boss_id, '1');
  assert.equal(Number(closed.value.guild_info.lost_hp ?? 0), 0);
  assert.deepEqual(closed.value.guild_info.piece_list, []);
  assert.deepEqual(closed.value.guild_info.display_list, []);
});
