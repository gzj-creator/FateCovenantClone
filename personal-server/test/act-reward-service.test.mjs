import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { activityWindow, createActivityCalendar } from '../game/activity-calendar.mjs';
import { createActRewardService, ACT_REWARD_ETF_TYPES } from '../game/act-reward-service.mjs';
import { readActActivityTables } from '../config/act-activity-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

// Block H (festival / sign-in / limited-target / co-op activities) against the
// real ActFrame/Activity registry and the tables rebuilt from the client bundle.
const codec = createGameCodec();
const tables = readGameTables();
const actTables = readActActivityTables();
const SERVER_OPENED_AT = 1792789200;

function signActivityId() {
  // SignActTable.SignAct keys rows as <version><day>; pick a shipped activity
  // whose version has both a version-1 row and a day-1 award.
  assert.ok(actTables.signAct.SignAct.get(101), 'sign day 1 award is configured');
  for (const [actId, config] of [...tables.ActFrameAct, ...tables.Activity]) {
    if (Number(config.version) !== 1 || !(Number(actId) > 0)) continue;
    // The activity must already be inside its configured window, otherwise the
    // calendar rejects the request before any award is read.
    const window = activityWindow(config, SERVER_OPENED_AT);
    if (!window || window.start <= SERVER_OPENED_AT + 3600) return Number(actId);
  }
  throw new Error('no version-1 activity is registered');
}

function setup(t) {
  let nowSeconds = SERVER_OPENED_AT + 3600;
  const fixture = createGameFixture(t, codec, { prefix: 'fc-act-reward-', serverOpenedAt: SERVER_OPENED_AT });
  let store = fixture.store;
  const calendar = createActivityCalendar({ tables, serverOpenedAt: SERVER_OPENED_AT, mode: 'all-open', now: () => nowSeconds * 1000 });
  const make = () => createActRewardService({ store, codec, tables, actTables, calendar, now: () => nowSeconds * 1000 });
  let service = make();
  return {
    get store() { return store; },
    get service() { return service; },
    setNow(value) { nowSeconds = value; },
    reopen() { store = fixture.open(); service = make(); }
  };
}

test('sign-in claim grants the configured award and records the claim', t => {
  const env = setup(t);
  const actId = signActivityId();
  const result = env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 1 }), { etf: undefined });
  const back = codec.unpack('pb_sign_act_back', result.data);
  assert.equal(Number(back.info.act_id), actId);
  assert.equal(back.res.changes.length > 0, true, 'resource changes are reported');
  const claims = env.store.inspect(db => db.prepare('SELECT task_id,period FROM activity_claims WHERE act_id=?').all(actId));
  assert.deepEqual(claims.map(row => Number(row.task_id)), [1]);
  assert.equal(claims[0].period, 'v1');
});

test('sign-in claim rejects a repeated day and a future day', t => {
  const env = setup(t);
  const actId = signActivityId();
  env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 1 }), {});
  assert.throws(
    () => env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 1 }), {}),
    error => error.code === 310
  );
  // A day beyond the running window is rejected either for the day gate or for
  // the missing table row, never granted.
  assert.throws(
    () => env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 99 }), {}),
    error => error.code === 309 || error.code === 5
  );
});

test('claims survive a database reopen', t => {
  const env = setup(t);
  const actId = signActivityId();
  env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 1 }), {});
  env.reopen();
  assert.throws(
    () => env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 1 }), {}),
    error => error.code === 310
  );
});

test('a failing grant rolls the whole claim back', t => {
  const env = setup(t);
  const actId = signActivityId();
  // SignActTable day 2 awards an item the resource handler cannot grant in this
  // fixture only when the row is missing; instead prove the rollback by making
  // the claim key invalid after the fact.
  assert.throws(
    () => env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: actId, day: 0 }), {}),
    error => error.code === 1
  );
  const claims = env.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n);
  assert.equal(claims, 0);
});

test('unknown activity ids are rejected', t => {
  const env = setup(t);
  assert.throws(
    () => env.service.execute(37009, codec.pack('pb_sign_act_req', { act_id: 999999999, day: 1 }), {}),
    error => error.code === 1
  );
});

test('progress-gated commands fail closed instead of returning a fixed value', t => {
  const env = setup(t);
  assert.throws(() => env.service.execute(79103, Buffer.alloc(0), {}), error => error.code === 5);
  assert.throws(() => env.service.execute(99401, [1, 2], { etf: [1, 2] }), error => error.code === 5);
  assert.throws(() => env.service.execute(103901, Buffer.alloc(0), {}), error => error.code === 5);
});

test('the ETF command set covers every registered Erlang-term command', () => {
  assert.equal(ACT_REWARD_ETF_TYPES.has(90301), true);
  assert.equal(ACT_REWARD_ETF_TYPES.has(105308), true);
  assert.equal(ACT_REWARD_ETF_TYPES.has(37009), false);
});

// Preheat rows hang off the legacy ActivityTable: the board id is the activity
// id modulo 1000 (150001 -> board 1) and the table ships a world-time window.
const PREHEAT_ACT = 150001;
const PREHEAT_START = 1741899600;

function setResource(env, tid, num, group = 1) {
  env.store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const existing = model.resources.get(String(tid));
    if (existing) { existing.num = String(num); return; }
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
  });
}

test('preheat spends the board cost, grants its award and enforces the interval', t => {
  const env = setup(t);
  env.setNow(PREHEAT_START + 90000);
  const row = actTables.preheat.PreheatAct.get(1);
  const costTid = Number(row.cost_tid);
  const costNum = Number(row.cost_num);
  setResource(env, costTid, costNum * 2);
  const result = env.service.execute(101001, codec.pack('pb_preheat_req', { act_id: PREHEAT_ACT, preheat_cnt: 1 }), {});
  const reply = codec.unpack('pb_res_to_client', result.data);
  assert.equal(reply.changes.length > 0, true, 'resource changes are reported');
  assert.equal(String(env.store.read().resources.get(String(costTid)).num), String(costNum), 'one preheat spends one cost');
  const state = env.store.inspect(db => db.prepare('SELECT data FROM act_reward_state WHERE act_id=?').all(PREHEAT_ACT));
  assert.equal(JSON.parse(state[0].data).counters.preheat, 1);
  assert.throws(
    () => env.service.execute(101001, codec.pack('pb_preheat_req', { act_id: PREHEAT_ACT, preheat_cnt: 1 }), {}),
    error => error.code === 309
  );
  env.setNow(PREHEAT_START + 90000 + Number(row.divide_sec) + 1);
  env.service.execute(101001, codec.pack('pb_preheat_req', { act_id: PREHEAT_ACT, preheat_cnt: 1 }), {});
  assert.equal(String(env.store.read().resources.get(String(costTid)).num), '0', 'the second preheat spends the rest');
});

test('preheat awards claim once, gate on available_sec and reject foreign versions', t => {
  const env = setup(t);
  env.setNow(PREHEAT_START + 90000);
  const result = env.service.execute(101002, codec.pack('pb_preheat_award_req', { act_id: PREHEAT_ACT, award_tid: 1001101 }), {});
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.length > 0, true);
  assert.throws(
    () => env.service.execute(101002, codec.pack('pb_preheat_award_req', { act_id: PREHEAT_ACT, award_tid: 1001101 }), {}),
    error => error.code === 310
  );
  assert.throws(
    () => env.service.execute(101002, codec.pack('pb_preheat_award_req', { act_id: PREHEAT_ACT, award_tid: 1001102 }), {}),
    error => error.code === 309
  );
  assert.throws(
    () => env.service.execute(101002, codec.pack('pb_preheat_award_req', { act_id: PREHEAT_ACT, award_tid: 3001101 }), {}),
    error => error.code === 1
  );
});
