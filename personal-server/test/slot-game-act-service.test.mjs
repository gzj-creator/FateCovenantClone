import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readSlotGameActTables } from '../config/slot-game-act-tables.mjs';
import { createSlotGameActService } from '../game/slot-game-act-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const slotTables = readSlotGameActTables();
const SERVER_OPENED_AT = 1792789200;
const ACT_ID = 1095003;
const TICKET = 6921900;
const DIAMOND = 101500;
const GO_TYPE = 110801;
const DRAW_TYPE = 110802;
const NOW = SERVER_OPENED_AT + 90000;
// proto3 omits default (zero) scalars, so a missing int64 field decodes as 0.
const int = value => Number(value ?? 0);

function setup(t, { nowSeconds = NOW, running = id => Number(id) === ACT_ID, sample = 0 } = {}) {
  let clock = nowSeconds;
  let randomValue = sample;
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-slot-game-',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => clock * 1000
  });
  const make = (overrides = {}) => createSlotGameActService({
    store: fixture.store,
    codec,
    tables,
    slotGameTables: slotTables,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode: 'all-open', isActivityRunning: running },
    now: () => clock * 1000,
    random: () => randomValue,
    logger: () => {},
    ...overrides
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return make(); },
    newService: overrides => make(overrides),
    setSample(value) { randomValue = value; },
    setTime(value) { clock = value; },
    reopen() { return fixture.open(); }
  };
}

function seedTickets(store, amount = 3) {
  store.transaction(model => grantResources(model, [[TICKET, amount]], tables));
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function activityOf(store) {
  const module = new Map(store.state().modules.value).get(92);
  return codec.unpack('pb_act_login', rawBinary(module));
}

function entryPayload(store, actId = ACT_ID) {
  const entry = (activityOf(store).act_list ?? []).find(item => Number(item.state_data?.act_id) === actId);
  assert.ok(entry, 'slot game login entry is missing');
  return payloadOf(entry);
}

function payloadOf(entry) {
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  return codec.unpack('pb_slot_game_act_role_data', raw.subarray(6));
}

function go(service, item = TICKET, actId = ACT_ID) {
  const data = codec.pack('pb_slot_game_act_go_req', { act_tid: String(actId), item_tid: String(item) });
  const request = service.decode(GO_TYPE, data);
  const result = service.execute(GO_TYPE, request);
  return { result, value: codec.unpack('pb_slot_game_act_role_data', result.data) };
}

function draw(service, { challenge = false, actId = ACT_ID } = {}) {
  const data = codec.pack('pb_slot_game_act_draw_req', {
    act_tid: String(actId), challenge_multiplier: challenge
  });
  const request = service.decode(DRAW_TYPE, data);
  const result = service.execute(DRAW_TYPE, request);
  return { result, value: codec.unpack('pb_slot_game_act_draw_rsp', result.data) };
}

test('SlotGameActTable extraction exposes the shipped slot activity family', () => {
  assert.equal(slotTables.versions.size, 1);
  assert.equal(slotTables.awardMapLib.size, 1);
  assert.equal(slotTables.awardLib.size, 3);
  assert.equal(slotTables.multiplierLib.size, 3);
  assert.equal(slotTables.multiplierLibDraw.size, 19);

  assert.deepEqual(slotTables.versions.get(1), { tid: 1, award_map_lib: 1, multiplier_lib: 1, help_id: 294 });
  assert.deepEqual(slotTables.awardMapLib.get(101), { tid: 101, lib: 1, item: TICKET, award_lib: 1 });
  assert.deepEqual(slotTables.awardLib.get(101), { tid: 101, lib: 1, weight: 100, award: [[DIAMOND, 300]] });
  assert.equal(slotTables.awardLib.get(102).weight, 0);
  assert.equal(slotTables.awardLib.get(103).weight, 0);
  assert.deepEqual(
    [101, 102, 103].map(tid => {
      const row = slotTables.multiplierLib.get(tid);
      return [row.num, row.draw_lib];
    }),
    [[0, 1], [1, 2], [30, 3]]
  );
  assert.equal(slotTables.multiplierLibDraw.get(101).multiplier, 120);
  assert.equal(slotTables.multiplierLibDraw.get(105).multiplier, 300);
  assert.equal(slotTables.multiplierLibDraw.get(207).weight, 5);
  assert.equal(slotTables.multiplierLibDraw.get(307).multiplier, 300);
});

test('login sync publishes the slot game role data inside module 92', t => {
  const harness = setup(t);
  const service = harness.service;
  const activity = activityOf(harness.store);
  const synced = service.synchronizeLogin(activity, NOW);
  assert.deepEqual(synced, [ACT_ID]);
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === ACT_ID);
  assert.ok(entry);
  assert.equal(Number(entry.state_data.cur_state_id), 50);
  const payload = payloadOf(entry);
  assert.equal(int(payload.act_id), ACT_ID);
  assert.equal(int(payload.draw_num), 0);
  assert.equal(int(payload.award_lib_tid), 0);
  // Login state is materialised in SQLite, not only in the module blob.
  assert.equal(harness.store.inspect(db => Number(db.prepare(
    'SELECT COUNT(*) AS count FROM slot_game_act_role_state WHERE act_id=?'
  ).get(ACT_ID).count)), 1);
});

test('SlotGameActCmd 110801 charges one ticket and assigns the weighted award library', t => {
  const harness = setup(t);
  seedTickets(harness.store, 3);
  const { value } = go(harness.service);
  assert.equal(int(value.act_id), ACT_ID);
  assert.equal(int(value.draw_num), 0);
  assert.equal(int(value.award_lib_tid), 101);
  assert.equal(Number(resource(harness.store, TICKET)), 2);
  assert.equal(int(entryPayload(harness.store).award_lib_tid), 101);

  // Zero-weight libraries stay unselectable even at the top of the sample
  // range, because AwardLib 102/103 carry weight 0 in the shipped table.
  harness.setSample(1 - Number.EPSILON);
  const first = harness.newService();
  harness.store.transaction(model => { model.resources.get(String(TICKET)).num = '3'; });
  harness.store.inspect(db => db.exec('DELETE FROM slot_game_act_role_state'));
  const { value: again } = go(first);
  assert.equal(int(again.award_lib_tid), 101);

  // Repeating go while a library is armed acknowledges without a second charge.
  const repeat = go(first);
  assert.equal(int(repeat.value.award_lib_tid), 101);
  assert.equal(Number(resource(harness.store, TICKET)), 2);
});

test('SlotGameActCmd 110801 fails closed without the configured ticket', t => {
  const harness = setup(t);
  assert.throws(() => go(harness.service), error => error.code === 301);
  assert.equal(Number(resource(harness.store, TICKET)), 0);
  assert.equal(harness.store.inspect(db => Number(db.prepare(
    'SELECT COUNT(*) AS count FROM slot_game_act_role_state'
  ).get().count)), 0);

  seedTickets(harness.store, 1);
  assert.throws(() => go(harness.service, 999999), error => error.code === 5);
  assert.equal(Number(resource(harness.store, TICKET)), 1);
});

test('SlotGameActCmd 110802 grants the scaled award and resets the award library', t => {
  const harness = setup(t, { sample: 0 });
  seedTickets(harness.store, 2);
  go(harness.service);
  const { value } = draw(harness.service);
  // First draw uses MultiplierLib num=0 -> draw lib 1; sample 0 picks tid 101
  // (weight 20, multiplier 120) and the base award is 300 diamonds.
  assert.equal(int(value.multiplier), 120);
  assert.equal(int(value.act_data?.draw_num), 1);
  assert.equal(int(value.act_data?.award_lib_tid), 0);
  assert.deepEqual(
    value.res.changes.map(change => [Number(change.tid), Number(change.diff_num), Number(change.new_num)]),
    [[DIAMOND, 360, 360]]
  );
  assert.equal(Number(resource(harness.store, DIAMOND)), 360);
  assert.equal(int(entryPayload(harness.store).draw_num), 1);
  const log = harness.store.inspect(db => db.prepare(
    'SELECT stage_tid, draw_lib, multiplier_tid, multiplier, award_lib_tid FROM slot_game_act_draws WHERE role_id=? AND act_id=?'
  ).get(harness.store.state().roleId, ACT_ID));
  assert.deepEqual({ ...log }, {
    stage_tid: 101, draw_lib: 1, multiplier_tid: 101, multiplier: 120, award_lib_tid: 101
  });
});

test('SlotGameActCmd 110802 requires a freshly assigned award library', t => {
  const harness = setup(t);
  assert.throws(() => draw(harness.service), error => error.code === 311);
  seedTickets(harness.store, 1);
  go(harness.service);
  draw(harness.service);
  assert.throws(() => draw(harness.service), error => error.code === 311);
  assert.equal(Number(resource(harness.store, DIAMOND)), 360);
});

test('SlotGameActCmd 110802 follows the MultiplierLib draw-count stages', t => {
  const harness = setup(t, { sample: 1 - Number.EPSILON });
  seedTickets(harness.store, 4);
  const service = harness.service;

  go(service);
  const first = draw(service).value;
  assert.equal(int(first.multiplier), 300);
  go(service);
  const second = draw(service).value;
  assert.equal(int(second.multiplier), 300);

  const stageRows = harness.store.inspect(db => db.prepare(
    'SELECT draw_index, stage_tid, draw_lib FROM slot_game_act_draws WHERE role_id=? AND act_id=? ORDER BY draw_index'
  ).all(harness.store.state().roleId, ACT_ID).map(row => ({ ...row })));
  assert.deepEqual(stageRows, [
    { draw_index: 1, stage_tid: 101, draw_lib: 1 },
    { draw_index: 2, stage_tid: 102, draw_lib: 2 }
  ]);

  // draw_num 30 crosses into stage 103 (draw_lib 3).
  harness.store.inspect(db => db.prepare(
    'UPDATE slot_game_act_role_state SET draw_num=30, award_lib_tid=101 WHERE role_id=? AND act_id=?'
  ).run(harness.store.state().roleId, ACT_ID));
  const third = draw(service).value;
  assert.equal(int(third.multiplier), 300);
  assert.deepEqual(harness.store.inspect(db => db.prepare(
    'SELECT stage_tid, draw_lib, draw_index FROM slot_game_act_draws WHERE role_id=? AND act_id=? ORDER BY draw_index'
  ).all(harness.store.state().roleId, ACT_ID).map(row => [row.stage_tid, row.draw_lib, row.draw_index])), [
    [101, 1, 1], [102, 2, 2], [103, 3, 31]
  ]);
});

test('SlotGameActCmd 110802 fails closed on the unrecovered challenge multiplier', t => {
  const harness = setup(t);
  seedTickets(harness.store, 1);
  go(harness.service);
  assert.throws(
    () => draw(harness.service, { challenge: true }),
    error => error.code === 5 && /challenge multiplier/.test(error.message)
  );
  assert.equal(Number(resource(harness.store, DIAMOND)), 0);
  assert.equal(int(entryPayload(harness.store).award_lib_tid), 101);
});

test('PB encoding failure rolls the draw back', t => {
  const harness = setup(t);
  seedTickets(harness.store, 1);
  go(harness.service);
  const failingCodec = {
    ...codec,
    pack: (name, value) => {
      if (name === 'pb_slot_game_act_draw_rsp') throw new Error('slot encode failure');
      return codec.pack(name, value);
    }
  };
  const failing = harness.newService({ codec: failingCodec });
  assert.throws(() => draw(failing), /slot encode failure/);
  assert.equal(Number(resource(harness.store, DIAMOND)), 0);
  assert.equal(int(entryPayload(harness.store).draw_num), 0);
  assert.equal(int(entryPayload(harness.store).award_lib_tid), 101);
  assert.equal(harness.store.inspect(db => Number(db.prepare(
    'SELECT COUNT(*) AS count FROM slot_game_act_draws'
  ).get().count)), 0);
});

test('SQLite write failure rolls the draw back', t => {
  const harness = setup(t);
  seedTickets(harness.store, 1);
  go(harness.service);
  harness.store.inspect(db => db.exec(
    "CREATE TRIGGER reject_slot_game_draw BEFORE INSERT ON slot_game_act_draws BEGIN SELECT RAISE(ABORT, 'Injected slot game storage failure'); END"
  ));
  assert.throws(() => draw(harness.service), /Injected slot game storage failure/);
  assert.equal(Number(resource(harness.store, DIAMOND)), 0);
  assert.equal(int(entryPayload(harness.store).draw_num), 0);
  assert.equal(int(entryPayload(harness.store).award_lib_tid), 101);
});

test('slot game state survives a database reopen and keeps its guards', t => {
  const harness = setup(t);
  seedTickets(harness.store, 2);
  go(harness.service);
  draw(harness.service);
  harness.reopen();
  const service = harness.newService();
  const activity = activityOf(harness.store);
  service.synchronizeLogin(activity, NOW);
  const payload = entryPayload(harness.store);
  assert.equal(int(payload.draw_num), 1);
  assert.equal(int(payload.award_lib_tid), 0);
  assert.throws(() => draw(service), error => error.code === 311);
  go(service);
  assert.equal(int(entryPayload(harness.store).award_lib_tid), 101);
});

test('the configured activity window and activity ids gate both commands', t => {
  const harness = setup(t, { running: () => false });
  seedTickets(harness.store, 2);
  assert.throws(() => go(harness.service), error => error.code === 309);
  assert.throws(() => draw(harness.service), error => error.code === 309);
  assert.throws(() => go(harness.service, TICKET, 1036001), error => error.code === 1);
  assert.throws(() => draw(harness.service, { actId: 1036001 }), error => error.code === 1);
  assert.equal(Number(resource(harness.store, TICKET)), 2);
});
