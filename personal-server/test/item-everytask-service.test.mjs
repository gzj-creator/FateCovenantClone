import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createEveryTaskService, EVERY_TASK_MODULE } from '../game/every-task-service.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const FIXED_NOW = Date.UTC(2026, 10, 7, 4, 0, 0);
const CREATED_AT = Math.floor(FIXED_NOW / 1000) - 3600;

function setup(t, options = {}) {
  let clock = options.now ?? FIXED_NOW;
  let everyTables = options.tables ?? tables;
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-every-task-',
    seed: { createdAt: options.createdAt ?? CREATED_AT },
    serverOpenedAt: Math.floor(FIXED_NOW / 1000),
    ...options.fixture
  });
  let store = fixture.store;
  let service = createEveryTaskService({ store, codec, tables: everyTables, now: () => clock });
  return {
    get store() { return store; },
    get service() { return service; },
    setClock(value) { clock = value; },
    setTables(value) {
      everyTables = value;
      service = createEveryTaskService({ store, codec, tables: everyTables, now: () => clock });
    },
    reopen() {
      store = fixture.open();
      service = createEveryTaskService({ store, codec, tables: everyTables, now: () => clock });
    }
  };
}

function moduleSlot(store, index) {
  return new Map(store.state().modules.value).get(EVERY_TASK_MODULE).value[index];
}

function dailyState(store) {
  return codec.unpack('pb_daily_task', rawBinary(moduleSlot(store, 0)));
}

function mainState(store) {
  return codec.unpack('pb_main_task', rawBinary(moduleSlot(store, 1)));
}

function weeklyState(store) {
  return codec.unpack('pb_weekly_task', rawBinary(moduleSlot(store, 2)));
}

function setStatistics(store, statisticsType, expandId, total) {
  store.transaction(model => {
    const rows = [...tables.CountStatistics.values()]
      .filter(row => !row.custom_login && Number(row.type) === 0);
    const index = rows.findIndex(row => Number(row.tid) === Number(statisticsType));
    if (index < 0) throw new Error(`missing statistics type ${statisticsType}`);
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    while (module.value.length <= index + 1) module.value.push(serializedBinary(Buffer.alloc(0)));
    const current = rawBinary(module.value[index + 1]);
    const data = current.length ? codec.unpack('pb_count_statics_data', current) : { list: [] };
    data.list ??= [];
    const id = String(expandId), row = data.list.find(entry => String(entry.id) === id);
    if (row) row.total = String(total);
    else data.list.push({ count_list: [], snapshot_list: [], id, total: String(total), mod_day: '0' });
    module.value[index + 1] = serializedBinary(codec.pack('pb_count_statics_data', data));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function setMission(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const mission = codec.unpack('pb_mission', rawBinary(modules.get(8).value[0]));
    mission.mission_id = String(missionId);
    modules.get(8).value[0] = serializedBinary(codec.pack('pb_mission', mission));
    model.state.modules.value = [...modules];
  });
}

function setDestiny(store, stage) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(107, serializedBinary(codec.pack('pb_destiny_data', { cur_stage: stage, slot_state: Buffer.alloc(13) })));
    model.state.modules.value = [...modules];
  });
}

function claimCount(store) {
  return store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM every_task_claims').get().n);
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function syntheticDailyTables({ vitality = 100 } = {}) {
  const daily = new Map([
    [2001, { tid: 2001, type: 1002, target_count: 10, vitality, award: [[101500, 10]], day_range: [1, 999999], compensate_group_id: 1, sortOrder: 2 }],
    [2002, { tid: 2002, type: 1002, target_count: 10, vitality, award: [[101500, 20]], day_range: [1, 999999], compensate_group_id: 1, sortOrder: 1 }],
    [2003, { tid: 2003, type: 1002, target_count: 999, vitality, award: [[101500, 30]], day_range: [1, 999999], compensate_group_id: 1, sortOrder: 3 }]
  ]);
  return {
    ...tables,
    DailyTask: daily,
    DailyTaskVitality: new Map([[1, {
      tid: 1, open_day: 1, value: [vitality],
      award_1: [2002], award_1_n: [1], award_2: [], award_2_n: [],
      award_3: [], award_3_n: [], award_4: [], award_4_n: []
    }]])
  };
}

test('daily claim rejects unfinished work, then pays once and survives reopen', t => {
  const env = setup(t);
  setStatistics(env.store, 1, 1, 9);
  let before = env.store.state();
  assert.throws(() => env.service.execute(9000, 3), error => error.code === 5 && /not complete/.test(error.message));
  assert.deepEqual(env.store.state(), before);

  setStatistics(env.store, 1, 1, 10);
  const rewarded = resource(env.store, 101500);
  const result = env.service.execute(9000, 3);
  const response = codec.unpack('daily_receive_back', result.data);
  assert.equal(hasBit(Buffer.from(response.daily_task.finish_tid_list, 'base64'), 3), true);
  assert.equal(response.daily_task.vitality, 20);
  assert.deepEqual(response.normal_res_list, [{ tid: '101500', num: '10' }]);
  assert.equal(resource(env.store, 101500), rewarded + 10n);
  assert.equal(claimCount(env.store), 1);
  assert.throws(() => env.service.execute(9000, 3), error => error.code === 310);

  env.reopen();
  assert.equal(hasBit(Buffer.from(dailyState(env.store).finish_tid_list, 'base64'), 3), true);
  assert.equal(resource(env.store, 101500), rewarded + 10n);
  assert.throws(() => env.service.execute(9000, 3), error => error.code === 310);
});

test('weekly and all-time main tasks use separate periods and configured progress sources', t => {
  const env = setup(t);
  setStatistics(env.store, 29, 1, 300);
  const weeklyResult = env.service.execute(9008, 1);
  const weekly = codec.unpack('weekly_receive_back', weeklyResult.data).weekly_task;
  assert.equal(hasBit(Buffer.from(weekly.finish_tid_list, 'base64'), 1), true);
  assert.ok(Number(weekly.refresh_time) > FIXED_NOW / 1000);

  setMission(env.store, 60203);
  const missionResult = env.service.execute(9002, 12010001);
  const mission = codec.unpack('main_receive_back', missionResult.data).main_task;
  assert.deepEqual(mission.task_list, [{ task_type: 1201, tid: 12010001 }]);

  setDestiny(env.store, 2);
  env.service.execute(9002, 59010001);
  assert.deepEqual(mainState(env.store).task_list, [
    { task_type: 1201, tid: 12010001 },
    { task_type: 5901, tid: 59010001 }
  ]);
  assert.equal(claimCount(env.store), 3);
});

test('one-key daily claim follows table order and keeps complete rewards when another task is incomplete', t => {
  const env = setup(t);
  setStatistics(env.store, 62, 1, 20);
  setStatistics(env.store, 1, 1, 10);
  const before = resource(env.store, 101500);
  const result = env.service.execute(9006);
  assert.deepEqual(result.value.claimed.map(row => row.taskId), [2, 3]);
  assert.ok(result.value.skipped.some(row => row.taskId === 1));
  assert.ok(result.value.skipped.some(row => row.taskId === 4 && row.reason === 'incomplete'));
  assert.equal(resource(env.store, 101500), before + 20n);
  const state = dailyState(env.store);
  assert.equal(hasBit(Buffer.from(state.finish_tid_list, 'base64'), 2), true);
  assert.equal(hasBit(Buffer.from(state.finish_tid_list, 'base64'), 3), true);
  assert.equal(hasBit(Buffer.from(state.finish_tid_list, 'base64'), 4), false);
  assert.equal(state.vitality, 40);
});

test('daily activity reward enforces its threshold, grants its table reward and prevents duplicate stages', t => {
  const env = setup(t, { tables: syntheticDailyTables({ vitality: 100 }) });
  setStatistics(env.store, 1, 1, 10);
  assert.throws(() => env.service.execute(9003, 1), error => error.code === 5);
  env.service.execute(9006);
  const before = resource(env.store, 2002);
  const result = env.service.execute(9003, 1);
  const response = codec.unpack('daily_receive_back', result.data);
  assert.equal(hasBit(Buffer.from(response.daily_task.vitality_stage, 'base64'), 1), true);
  assert.equal(resource(env.store, 2002), before + 1n);
  assert.throws(() => env.service.execute(9003, 1), error => error.code === 310);
  assert.throws(() => env.service.execute(9003, 5), error => error.code === 1);
});

test('daily and weekly rewards become claimable again in a later period while main stays one-time', t => {
  const env = setup(t, { tables: syntheticDailyTables({ vitality: 20 }) });
  setStatistics(env.store, 1, 1, 10);
  env.service.execute(9006);
  assert.equal(claimCount(env.store), 2);
  env.setClock(FIXED_NOW + 86400 * 1000 + 60_000);
  const again = env.service.execute(9006);
  assert.deepEqual(again.value.claimed.map(row => row.taskId), [2002, 2001]);
  assert.equal(claimCount(env.store), 4);

  setStatistics(env.store, 29, 1, 500);
  env.service.execute(9008, 2);
  env.setClock(FIXED_NOW + 8 * 86400 * 1000);
  env.service.execute(9008, 2);
  assert.equal(claimCount(env.store), 6);

  setMission(env.store, 60203);
  env.service.execute(9007);
  env.setClock(FIXED_NOW + 30 * 86400 * 1000);
  assert.throws(() => env.service.execute(9002, 12010001), error => error.code === 310);
});

test('rejects unknown task ids and malformed one-key parameters without mutation', t => {
  const env = setup(t);
  const before = env.store.state();
  assert.throws(() => env.service.execute(9000, 999999), error => error.code === 1);
  assert.throws(() => env.service.execute(9008, 0), error => error.code === 1);
  assert.throws(() => env.service.execute(9006, [1, 2]), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);
});

test('rolls back claims, resources and task bits when response encoding or SQLite insertion fails', t => {
  const env = setup(t);
  setStatistics(env.store, 1, 1, 10);
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'daily_receive_back') throw new Error('encode fail');
      return codec.pack(name, value);
    }
  };
  const broken = createEveryTaskService({ store: env.store, codec: brokenCodec, tables, now: () => FIXED_NOW });
  assert.throws(() => broken.execute(9000, 3), /encode fail/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);

  env.store.inspect(db => db.exec("CREATE TRIGGER reject_every_task BEFORE INSERT ON every_task_claims BEGIN SELECT RAISE(ABORT, 'deny every task'); END"));
  assert.throws(() => env.service.execute(9000, 3), /deny every task/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(claimCount(env.store), 0);
});

test('real TCP request updates the response and module-91 login state', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-every-task-tcp-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: Math.floor(FIXED_NOW / 1000),
    now: () => FIXED_NOW
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  game.store.transaction(model => { model.state.createdAt = CREATED_AT; });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const loginData = codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' });
  const login = await request(909103, 1, loginData);
  assert.equal(login.err, undefined);

  setStatistics(game.store, 29, 1, 300);
  const response = await request(9008, 2, await encodeEtf(1));
  assert.equal(response.seq, 2);
  assert.equal(response.err, undefined);
  const weekly = codec.unpack('weekly_receive_back', Buffer.from(response.data, 'base64')).weekly_task;
  assert.equal(hasBit(Buffer.from(weekly.finish_tid_list, 'base64'), 1), true);

  const relogin = await request(909103, 3, loginData);
  const loginValue = await decodeEtf(Buffer.from(relogin.data, 'base64'));
  const module = loginValue[2].value.find(entry => Number(entry[0]) === EVERY_TASK_MODULE);
  assert.ok(module, 'login module 91 is present');
  const persistedWeekly = codec.unpack('pb_weekly_task', Buffer.from(module[1].value[2].value));
  assert.equal(hasBit(Buffer.from(persistedWeekly.finish_tid_list, 'base64'), 1), true);
});
