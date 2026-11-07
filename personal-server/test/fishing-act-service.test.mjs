import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createActivityReadService } from '../game/activity-read-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const SERVER_OPENED_AT = 1792789200;
const DAY = 86400;
// ActFrameAct 1074003 -> FishingVersion 3 (island library 2, level library 2,
// codex library 1, rod library 1). Progress rows are keyed by the version tid,
// so this activity claims progress 301-305 and levels 201-253.
const ACT = 1074003;
const MAP = 201;
const LEVEL_FIRST = 201;
const LEVEL_SECOND = 202;
const PROGRESS_FIRST = 301;
const PROGRESS_SECOND = 302;
const CODEX_FISH = [...tables.FishingFish.values()]
  .filter(fish => Number(fish.version) === 1 && Number(fish.type) === 0)
  .map(fish => Number(fish.tid))
  .sort((left, right) => left - right);

function setup(t, randomValues = [0.5]) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-fishing-award-', serverOpenedAt: SERVER_OPENED_AT });
  let nowSeconds = SERVER_OPENED_AT + 3600;
  let cursor = 0;
  let store = fixture.store;
  const calendar = createActivityCalendar({ tables, serverOpenedAt: SERVER_OPENED_AT, now: () => nowSeconds * 1000 });
  const random = () => randomValues[cursor++ % randomValues.length];
  const make = (overrideCodec) => createActivityReadService({
    codec: overrideCodec ?? codec, store, tables, calendar, now: () => nowSeconds * 1000, random
  });
  let service = make();
  return {
    get store() { return store; },
    get service() { return service; },
    calendar,
    nowMs: () => nowSeconds * 1000,
    setNow(seconds) { nowSeconds = seconds; },
    withCodec(overrideCodec) { return make(overrideCodec); },
    reopen() {
      store = fixture.open();
      service = make();
    }
  };
}

function ready(t, randomValues) {
  const env = setup(t, randomValues);
  env.service.ensureActiveFishingBenefits();
  env.service.execute(110305, codec.pack('pb_fishing_act_common_req', { act_id: ACT, value: MAP }));
  return env;
}

function stateRow(env) {
  return env.store.inspect(db => db.prepare('SELECT * FROM fishing_activity_state WHERE act_id=?').get(ACT));
}

function sql(env, statement, ...parameters) {
  return env.store.inspect(db => db.prepare(statement).run(...parameters));
}

function resource(env, tid) {
  return BigInt(env.store.read().resources.get(String(tid))?.num ?? 0);
}

function addResource(env, tid, num, group = 1) {
  env.store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, group, entry] });
  });
}

function collectCatch(env) {
  const casted = env.service.execute(110301, codec.pack('pb_fishing_act_rod_req', { act_id: ACT, map_id: MAP }));
  const collected = env.service.execute(110302, codec.pack('pb_fishing_act_get_req', { act_id: ACT, is_get: true }));
  return {
    cast: codec.unpack('pb_fishing_act_role_data', casted.data),
    result: codec.unpack('pb_fishing_act_get_rsp', collected.data)
  };
}

function claimBook(service, ids) {
  return service.execute(110304, codec.pack('pb_fishing_act_common_list_req', { act_id: ACT, value: ids }));
}

function claimLevel(service, levelTid) {
  return service.execute(110307, codec.pack('pb_fishing_act_common_req', { act_id: ACT, value: levelTid }));
}

function claimProgress(service, ids) {
  return service.execute(110310, codec.pack('pb_fishing_act_common_list_req', { act_id: ACT, value: ids }));
}

function changeRod(service, rodTid) {
  return service.execute(110306, codec.pack('pb_fishing_act_common_req', { act_id: ACT, value: rodTid }));
}

test('codex award pays first_award once per recorded fish and survives reopen', t => {
  const env = ready(t, [0.5]);
  sql(env, 'UPDATE fishing_activity_state SET get_num=20 WHERE act_id=?', ACT);
  addResource(env, 821202, 10, 0);
  env.service.execute(110311, codec.pack('pb_fishing_act_batch_get_req', { act_id: ACT, map_id: MAP, is_jump_qte: true }));
  const recorded = JSON.parse(stateRow(env).high_size_list_json).map(row => Number(row.fish_id));
  assert.ok(recorded.length > 0);
  const fishId = recorded[0];
  const missing = CODEX_FISH.find(tid => !recorded.includes(tid));
  assert.ok(missing, 'a codex fish outside the recorded set exists');

  const before = resource(env, 101500);
  const claimed = claimBook(env.service, [fishId]);
  const response = codec.unpack('pb_fishing_act_data_res', claimed.data);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '10']]);
  assert.equal(resource(env, 101500), before + 10n);
  assert.deepEqual(claimed.tids, [fishId]);
  const bookState = Buffer.from(response.data.book_state, 'base64');
  assert.equal((bookState[Math.floor(fishId / 8)] & (0x80 >> (fishId % 8))) !== 0, true);

  assert.throws(() => claimBook(env.service, [fishId]), error => error.code === 310);
  assert.throws(() => claimBook(env.service, [missing]), error => error.code === 311);
  assert.throws(() => claimBook(env.service, [999999]), error => error.code === 1);
  assert.equal(resource(env, 101500), before + 10n);

  env.reopen();
  assert.throws(() => claimBook(env.service, [fishId]), error => error.code === 310);
  assert.equal(resource(env, 101500), before + 10n);
});

test('level award follows the score level and pays Level.unlock_reward once', t => {
  const env = ready(t, [0.5]);
  sql(env, 'UPDATE fishing_activity_state SET score=2000 WHERE act_id=?', ACT);
  const diamond = resource(env, 101500), item = resource(env, 830902);
  const awarded = claimLevel(env.service, LEVEL_FIRST);
  const response = codec.unpack('pb_fishing_act_data_res', awarded.data);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [['830902', '200'], ['101500', '300']]);
  assert.equal(resource(env, 101500), diamond + 300n);
  assert.equal(resource(env, 830902), item + 200n);
  assert.equal(awarded.level, 1);
  assert.equal(awarded.current, 1);

  assert.throws(() => claimLevel(env.service, LEVEL_SECOND), error => error.code === 311);
  assert.throws(() => claimLevel(env.service, LEVEL_FIRST), error => error.code === 310);
  assert.throws(() => claimLevel(env.service, 301), error => error.code === 1);
  assert.equal(resource(env, 101500), diamond + 300n);

  env.reopen();
  assert.throws(() => claimLevel(env.service, LEVEL_FIRST), error => error.code === 310);
  const levelState = Buffer.from(stateRow(env).level_state, 'base64');
  assert.notEqual(levelState[Math.floor(LEVEL_FIRST / 8)] & (0x80 >> (LEVEL_FIRST % 8)), 0);
});

test('progress award counts unlocked codex fish and keeps its claim bits', t => {
  const env = ready(t, [0.5]);
  const five = CODEX_FISH.slice(0, 5).map(tid => ({ fish_id: String(tid), size: '100', score: '200' }));
  sql(env, 'UPDATE fishing_activity_state SET high_size_list_json=? WHERE act_id=?', JSON.stringify(five), ACT);
  const diamond = resource(env, 101500);
  const awarded = claimProgress(env.service, [PROGRESS_FIRST]);
  const response = codec.unpack('pb_fishing_act_data_res', awarded.data);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '1000']]);
  assert.equal(resource(env, 101500), diamond + 1000n);
  assert.equal(awarded.unlockedCount, 5);

  assert.throws(() => claimProgress(env.service, [PROGRESS_SECOND]), error => error.code === 311);
  assert.throws(() => claimProgress(env.service, [PROGRESS_FIRST]), error => error.code === 310);
  assert.throws(() => claimProgress(env.service, [201]), error => error.code === 1);

  env.reopen();
  assert.throws(() => claimProgress(env.service, [PROGRESS_FIRST]), error => error.code === 310);
  assert.equal(resource(env, 101500), diamond + 1000n);
});

test('up-rank award needs the configured special-fish high score', t => {
  const env = ready(t, [0.5]);
  const version = tables.FishingVersion.get(Number(tables.ActFrameAct.get(ACT).version));
  assert.equal(Number(version.rank_need_score), 80000);
  assert.throws(() => env.service.execute(110309, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 311);
  sql(env, 'UPDATE fishing_activity_state SET high_size=79999 WHERE act_id=?', ACT);
  assert.throws(() => env.service.execute(110309, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 311);
  sql(env, 'UPDATE fishing_activity_state SET high_size=80000 WHERE act_id=?', ACT);

  const before = resource(env, 101500);
  const claimed = env.service.execute(110309, Buffer.alloc(0), { etfValue: ACT });
  const response = codec.unpack('pb_fishing_act_data_res', claimed.data);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [
    ['101500', '2000'], ['392002', '80'], ['391002', '2000']
  ]);
  assert.equal(response.data.go_rank_reward, true);
  assert.equal(resource(env, 101500), before + 2000n);
  assert.equal(stateRow(env).go_rank_reward, 1);

  assert.throws(() => env.service.execute(110309, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 310);

  env.reopen();
  assert.throws(() => env.service.execute(110309, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 310);
  assert.equal(resource(env, 101500), before + 2000n);
});

test('rod change requires an activated rod and persists the equipped rod', t => {
  const env = ready(t, [0.5]);
  assert.equal(stateRow(env).rod, '1');
  assert.deepEqual(JSON.parse(stateRow(env).have_rod_list_json), [1]);
  assert.throws(() => changeRod(env.service, 3), error => error.code === 311);
  assert.throws(() => changeRod(env.service, 999), error => error.code === 1);
  assert.equal(stateRow(env).rod, '1');

  addResource(env, 100034500, 1, 0);
  const changed = changeRod(env.service, 3);
  assert.equal(changed.data.length, 0);
  assert.equal(changed.rod, 3);
  assert.equal(stateRow(env).rod, '3');
  assert.deepEqual(JSON.parse(stateRow(env).have_rod_list_json), [1, 3]);
  const casted = env.service.execute(110301, codec.pack('pb_fishing_act_rod_req', { act_id: ACT, map_id: MAP }));
  assert.equal(codec.unpack('pb_fishing_act_role_data', casted.data).rod, '3');

  env.reopen();
  assert.equal(stateRow(env).rod, '3');
  assert.deepEqual(JSON.parse(stateRow(env).have_rod_list_json), [1, 3]);
});

test('per-fish top three and recent records come from stored catches', t => {
  const env = ready(t, [0.05, 0.95, 0.5, 0.2, 0.8]);
  for (let index = 0; index < 4; index++) collectCatch(env);
  const stored = env.store.inspect(db => db.prepare(
    'SELECT fish_id,size,score,map_id,name,role_id FROM fishing_act_catches WHERE act_id=? ORDER BY id DESC'
  ).all(ACT));
  assert.equal(stored.length, 4);

  const records = codec.unpack('pb_fishing_act_get_record_rsp', env.service.execute(110308, Buffer.alloc(0), { etfValue: ACT }).data).record_list;
  assert.equal(records.length, 4);
  assert.deepEqual(records.map(row => [row.fish_id, row.size, row.map_id]),
    stored.map(row => [String(row.fish_id), String(row.size), String(row.map_id)]));
  assert.deepEqual([...new Set(records.map(row => row.name))], ['Local Test']);

  const top = codec.unpack('pb_fishing_act_get_top_rsp', env.service.execute(110303, Buffer.alloc(0), { etfValue: ACT }).data).high_score_list;
  const expected = new Map();
  for (const row of [...stored].sort((left, right) => right.size - left.size)) {
    const entry = expected.get(row.fish_id) ?? [];
    if (entry.length < 3) entry.push(String(row.size));
    expected.set(row.fish_id, entry);
  }
  assert.deepEqual(top.map(fish => fish.fish_id).sort(), [...expected.keys()].map(String).sort());
  for (const fish of top) {
    assert.deepEqual(fish.data_list.map(row => row.size), expected.get(Number(fish.fish_id)));
    assert.equal(fish.data_list.every(row => Number(row.role_id) === 100001), true);
  }

  // Records stay scoped to their activity cycle.
  sql(env, 'INSERT INTO fishing_act_catches (role_id,act_id,fish_id,size,score,map_id,name,caught_at) VALUES (?,?,?,?,?,?,?,?)',
    100001, 1074004, 101, 1234, '1244', 201, 'Local Test', 1792789200);
  assert.equal(codec.unpack('pb_fishing_act_get_record_rsp', env.service.execute(110308, Buffer.alloc(0), { etfValue: ACT }).data).record_list.length, 4);
  assert.throws(() => env.service.execute(110308, Buffer.alloc(0), { etfValue: 89001 }), error => error.code === 1);
});

test('encoding failure rolls the whole award transaction back', t => {
  const env = ready(t, [0.5]);
  sql(env, 'UPDATE fishing_activity_state SET score=2000 WHERE act_id=?', ACT);
  const before = resource(env, 101500), stateBefore = stateRow(env).level_state;
  const broken = env.withCodec({
    ...codec,
    pack(name, value) {
      if (name === 'pb_fishing_act_data_res') throw new Error('encode fail');
      return codec.pack(name, value);
    }
  });
  assert.throws(() => claimLevel(broken, LEVEL_FIRST), /encode fail/);
  assert.equal(resource(env, 101500), before);
  assert.equal(stateRow(env).level_state, stateBefore);
  const claimed = claimLevel(env.service, LEVEL_FIRST);
  assert.equal(codec.unpack('pb_fishing_act_data_res', claimed.data).res.changes.length, 2);
});

test('closed or unknown fishing activities reject awards without state change', t => {
  const env = ready(t, [0.5]);
  sql(env, 'UPDATE fishing_activity_state SET score=2000, high_size=90000 WHERE act_id=?', ACT);
  const before = stateRow(env);
  assert.throws(() => env.service.execute(110303, Buffer.alloc(0), { etfValue: 89001 }), error => error.code === 1);
  assert.throws(() => claimBook(env.service, [101]), error => error.code === 311);
  assert.throws(() => claimBook(env.service, [999999]), error => error.code === 1);
  assert.throws(() => claimProgress(env.service, [PROGRESS_FIRST]), error => error.code === 311);

  env.setNow(SERVER_OPENED_AT + 30 * DAY);
  assert.throws(() => env.service.execute(110303, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 309);
  assert.throws(() => env.service.execute(110308, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 309);
  assert.throws(() => env.service.execute(110309, Buffer.alloc(0), { etfValue: ACT }), error => error.code === 309);
  // Login initialization reads both lists without an argument and must keep
  // getting empty lists while no fishing cycle is scheduled.
  assert.deepEqual(codec.unpack('pb_fishing_act_get_top_rsp', env.service.execute(110303, Buffer.alloc(0)).data).high_score_list, []);
  assert.deepEqual(codec.unpack('pb_fishing_act_get_record_rsp', env.service.execute(110308, Buffer.alloc(0)).data).record_list, []);
  assert.throws(() => claimLevel(env.service, LEVEL_FIRST), error => error.code === 309);
  assert.throws(() => changeRod(env.service, 1), error => error.code === 309);
  assert.equal(stateRow(env).level_state, before.level_state);
  assert.equal(stateRow(env).go_rank_reward, 0);
});
