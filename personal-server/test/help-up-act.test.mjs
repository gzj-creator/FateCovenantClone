import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createActivityReadService } from '../game/activity-read-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

// HelpUpActCmd 116001-116004 against ActFrameTable.Act 1096001 (type 1096) and
// HelpUpActTable version 1: cost_item 834102, cost_item_max 10, help_times 1,
// Task 101-104 (award [[834102,5]]), Stage 101-103 (stage_num 5M/10M/15M).
const codec = createGameCodec();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const DAY = 86400;
const ACT_ID = 1096001;
const MODULE_ENTRY_ID = 92144;
const HELP_SCROLL = '834102';
const STAGE_ONE_TOTAL = 5000000;

function publishCustomWindow(store) {
  // The shipped Act 1096001 window (world_time 1788642000 + 34 days) does not
  // cover the test clock, so the activity entry carries a custom window the
  // calendar already understands instead of bypassing the schedule.
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const entry = modules.get(92);
    const activity = entry
      ? codec.unpack('pb_act_login', rawBinary(entry))
      : { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    activity.act_custom_list ??= [];
    if (!activity.act_custom_list.some(row => Number(row.act_id) === ACT_ID)) {
      activity.act_custom_list.push({ act_id: ACT_ID, fun_id: 0, start_time: 0, end_time: 0 });
    }
    // filterLoginActivity only keeps custom windows whose activity is still in
    // act_list, so the running entry is stored beside the window.
    activity.act_list ??= [];
    if (!activity.act_list.some(row => Number(row.state_data?.act_id) === ACT_ID)) {
      activity.act_list.push({
        state_data: {
          act_id: ACT_ID, cur_state_id: 50,
          history_time: [{ state_id: 50, enter_time: String(SERVER_OPENED_AT) }]
        },
        module_login_data: Buffer.alloc(0)
      });
    }
    modules.set(92, serializedBinary(codec.pack('pb_act_login', activity)));
    model.state.modules.value = [...modules];
  });
}

function setup(t, initialSeconds = SERVER_OPENED_AT + 3600, { customWindow = true } = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-helpup-', serverOpenedAt: SERVER_OPENED_AT });
  let nowSeconds = initialSeconds;
  let store = fixture.store;
  if (customWindow) publishCustomWindow(store);
  const calendar = createActivityCalendar({ tables, serverOpenedAt: SERVER_OPENED_AT, now: () => nowSeconds * 1000 });
  const make = () => createActivityReadService({ codec, store, tables, calendar, now: () => nowSeconds * 1000, random: () => 0.5 });
  let service = make();
  return {
    get store() { return store; },
    get service() { return service; },
    setNow(seconds) { nowSeconds = seconds; },
    reopen() {
      store = fixture.open();
      service = make();
    }
  };
}

function grantScrolls(store, num) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= 1) groups.push({ value: [], improper: false });
    const entry = groups[1].value.length;
    groups[1].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(HELP_SCROLL, { tid: Number(HELP_SCROLL), num: String(num), location: [6, 1, entry] });
  });
}

function statisticSlot(tid) {
  const rows = [...tables.CountStatistics.values()].filter(row => !row.custom_login && Number(row.type) === 0);
  const index = rows.findIndex(row => Number(row.tid) === Number(tid));
  assert.ok(index >= 0, 'statistics row ' + tid + ' is configured');
  return index + 1;
}

function setStatistic(store, tid, entries) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    assert.ok(module && Array.isArray(module.value), 'module 21 is present');
    const slot = statisticSlot(tid);
    while (module.value.length <= slot) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[slot] = serializedBinary(codec.pack('pb_count_statics_data', { list: entries }));
    model.state.modules.value = [...modules];
  });
}

function setRunningTotal(store, total) {
  store.inspect(db => {
    db.prepare('UPDATE help_up_act_state SET overall_help_times=? WHERE act_id=?').run(String(total), ACT_ID);
  });
}

const helpTimes = (service, actId = ACT_ID) => Number(codec.unpack(
  'pb_help_up_get_times_rsp',
  service.execute(116004, codec.pack('pb_help_up_get_times_req', { act_id: actId })).data
).times ?? 0);

const help = (service, times, actId = ACT_ID) => service.execute(116003, codec.pack('pb_help_up_help_req', { act_id: actId, times }));

const taskReward = (service, tids, actId = ACT_ID) => service.execute(116001, codec.pack('pb_help_up_task_reward_req', {
  act_id: actId, task_id_list: tids.map(String)
}));

const stageAward = (service, tids, actId = ACT_ID) => service.execute(116002, codec.pack('pb_help_up_stage_award_req', {
  act_id: actId, stage_tid_list: tids.map(String)
}));

const scrollBalance = store => BigInt(store.read().resources.get(HELP_SCROLL)?.num ?? 0);

// pb_s2c.err is a pb_net_err message; an absent field means success.
const errorCode = response => Number(response.err?.err ?? 0);

test('help-up resolves only the configured activity and requires the running window', t => {
  const env = setup(t);
  for (const type of [116001, 116002, 116003, 116004]) assert.equal(env.service.supports(type), true);
  // 92144 is the module-92 entry for the activity, not the act tid.
  assert.throws(() => helpTimes(env.service, MODULE_ENTRY_ID), error => error.code === 1);
  assert.throws(() => help(env.service, 1, MODULE_ENTRY_ID), error => error.code === 1);
  assert.equal(helpTimes(env.service), 0);

  const closed = setup(t, SERVER_OPENED_AT + 3600, { customWindow: false });
  assert.throws(() => helpTimes(closed.service), error => error.code === 309);
  assert.throws(() => help(closed.service, 1), error => error.code === 309);
});

test('help spends one 助力手卷 per help, raises the running total and pays an envelope', t => {
  const env = setup(t);
  grantScrolls(env.store, 3);
  const result = help(env.service, 2);
  const response = codec.unpack('pb_help_up_help_rsp', result.data);
  assert.equal(response.help_times, '2');
  assert.equal(scrollBalance(env.store), 1n);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [
    [HELP_SCROLL, '-2'],
    ['493002', '16']
  ]);
  assert.equal(helpTimes(env.service), 2);
  const stored = env.store.inspect(db => db.prepare('SELECT * FROM help_up_act_state WHERE act_id=?').get(ACT_ID));
  assert.equal(stored.overall_help_times, '2');

  // Version.cost_item_max caps a single request at ten helps.
  assert.throws(() => help(env.service, 11), error => error.code === 1);
  assert.throws(() => help(env.service, 0), error => error.code === 1);
  // Insufficient scrolls roll the whole transaction back.
  assert.throws(() => help(env.service, 5), error => error.code === 301);
  assert.equal(scrollBalance(env.store), 1n);
  assert.equal(helpTimes(env.service), 2);
});

test('task reward pays the configured scroll award once the statistics progress is met', t => {
  const env = setup(t);
  // Task 101: task_type 100816 -> statistics row 82 / dimension 10017, target 1.
  setStatistic(env.store, 82, [{ id: 10017, total: 1 }]);
  const result = taskReward(env.service, [101]);
  const response = codec.unpack('pb_help_up_task_reward_rsp', result.data);
  assert.equal(response.act_data.act_id, String(ACT_ID));
  assert.deepEqual(response.act_data.daily_task_tid_list, ['101']);
  assert.deepEqual(response.act_data.stage_tid_list, []);
  assert.ok(Number(response.act_data.last_rec_time) > 0);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [[HELP_SCROLL, '5']]);
  assert.equal(scrollBalance(env.store), 5n);

  assert.throws(() => taskReward(env.service, [101]), error => error.code === 310);
  // Task 103 needs 100 statistics units (task_type 4701 -> row 29 / dimension 1).
  assert.throws(() => taskReward(env.service, [103]), error => error.code === 311);
  assert.throws(() => taskReward(env.service, [999]), error => error.code === 1);

  env.reopen();
  assert.throws(() => taskReward(env.service, [101]), error => error.code === 310);
  const reopened = env.store.inspect(db => db.prepare('SELECT * FROM help_up_act_state WHERE act_id=?').get(ACT_ID));
  assert.deepEqual(JSON.parse(reopened.daily_task_tid_list_json), [101]);
  assert.deepEqual(JSON.parse(reopened.stage_tid_list_json), []);
  assert.equal(reopened.overall_help_times, '0');
});

test('stage award unlocks at Stage.stage_num and keeps the claim across a reopen', t => {
  const env = setup(t);
  assert.throws(() => stageAward(env.service, [101]), error => error.code === 311);
  grantScrolls(env.store, 1);
  help(env.service, 1);
  // The stage gate is the running help total; seed the counter to the shipped
  // 5,000,000 threshold instead of buying five million scrolls.
  setRunningTotal(env.store, STAGE_ONE_TOTAL);
  const result = stageAward(env.service, [101]);
  const response = codec.unpack('pb_help_up_stage_award_rsp', result.data);
  assert.deepEqual(response.act_data.stage_tid_list, ['101']);
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]).sort(), [
    ['3401200', '1'],
    ['5111200', '5']
  ]);
  assert.throws(() => stageAward(env.service, [101]), error => error.code === 310);
  assert.throws(() => stageAward(env.service, [102]), error => error.code === 311);

  env.reopen();
  assert.throws(() => stageAward(env.service, [101]), error => error.code === 310);
  assert.equal(helpTimes(env.service), STAGE_ONE_TOTAL);
});

test('help-up claims roll back as a batch when a later id is rejected', t => {
  const env = setup(t);
  setStatistic(env.store, 82, [{ id: 10017, total: 1 }]);
  assert.throws(() => taskReward(env.service, [101, 999]), error => error.code === 1);
  assert.equal(scrollBalance(env.store), 0n);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS rows FROM help_up_act_state').get()).rows, 0);
  // The same request without the unknown id still pays, proving the earlier
  // attempt left no claim behind.
  const response = codec.unpack('pb_help_up_task_reward_rsp', taskReward(env.service, [101]).data);
  assert.deepEqual(response.act_data.daily_task_tid_list, ['101']);
  assert.equal(scrollBalance(env.store), 5n);
});

test('daily task claims reset on the next day while the running total persists', t => {
  const env = setup(t);
  setStatistic(env.store, 82, [{ id: 10017, total: 1 }]);
  grantScrolls(env.store, 1);
  const first = codec.unpack('pb_help_up_task_reward_rsp', taskReward(env.service, [101]).data);
  assert.deepEqual(first.act_data.daily_task_tid_list, ['101']);
  help(env.service, 1);
  assert.throws(() => taskReward(env.service, [101]), error => error.code === 310);

  env.setNow(SERVER_OPENED_AT + 3600 + DAY);
  const second = codec.unpack('pb_help_up_task_reward_rsp', taskReward(env.service, [101]).data);
  assert.deepEqual(second.act_data.daily_task_tid_list, ['101']);
  // The reset re-opens the claim, so the second day pays another five scrolls.
  assert.equal(scrollBalance(env.store), 10n);
  assert.equal(helpTimes(env.service), 1);
});

test('login publishes the help-up activity entry with a pb_help_up_act_login_data block', t => {
  const env = setup(t);
  grantScrolls(env.store, 1);
  help(env.service, 1);
  const activity = codec.unpack('pb_act_login', rawBinary(new Map(env.store.state().modules.value).get(92)));
  const synced = env.service.synchronizeHelpUpLogin(activity, SERVER_OPENED_AT + 3600);
  assert.deepEqual(synced, [ACT_ID]);
  const entry = activity.act_list.find(candidate => Number(candidate.state_data?.act_id) === ACT_ID);
  assert.ok(entry, 'activity entry is published');
  assert.equal(Number(entry.state_data.cur_state_id), 50);
  const block = codec.unpack('pb_help_up_act_login_data', Buffer.from(entry.module_login_data));
  assert.equal(block.act_data.act_id, String(ACT_ID));
  assert.equal(block.help_times, '1');
  assert.deepEqual(block.act_data.daily_task_tid_list, []);
  const payload = codec.unpack('pb_help_up_act_login_data', env.service.helpUpLoginPayload(ACT_ID, SERVER_OPENED_AT + 3600));
  assert.equal(payload.help_times, '1');
});

test('gateway answers the real help-up types on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-helpup-tcp-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const gameNow = (SERVER_OPENED_AT + 3600) * 1000;
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => gameNow,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  publishCustomWindow(game.store);
  grantScrolls(game.store, 2);
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const loginFlow = await decodeEtf(Buffer.from(login.data, 'base64'));
  const activityEntry = loginFlow[2].value.find(value => Number(value[0]) === 92);
  const activity = codec.unpack('pb_act_login', Buffer.from(activityEntry[1].value));
  const helpUpEntry = activity.act_list.find(entry => Number(entry.state_data?.act_id) === ACT_ID);
  assert.ok(helpUpEntry, 'login carries the help-up activity entry');
  const loginBlock = codec.unpack('pb_help_up_act_login_data', Buffer.from(helpUpEntry.module_login_data, 'base64'));
  assert.equal(loginBlock.act_data.act_id, String(ACT_ID));

  const times = await request(116004, 2, codec.pack('pb_help_up_get_times_req', { act_id: ACT_ID }));
  assert.equal(errorCode(times), 0);
  // A zero total serialises to an empty body: proto3 drops the default value.
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', Buffer.from(times.data ?? '', 'base64')).times ?? 0), 0);

  const helped = await request(116003, 3, codec.pack('pb_help_up_help_req', { act_id: ACT_ID, times: 1 }));
  assert.equal(errorCode(helped), 0);
  const helpBody = codec.unpack('pb_help_up_help_rsp', Buffer.from(helped.data, 'base64'));
  assert.equal(helpBody.help_times, '1');
  assert.equal(helpBody.res.changes.find(change => change.tid === HELP_SCROLL).diff_num, '-1');

  const after = await request(116004, 4, codec.pack('pb_help_up_get_times_req', { act_id: ACT_ID }));
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', Buffer.from(after.data, 'base64')).times), 1);

  const task = await request(116001, 5, codec.pack('pb_help_up_task_reward_req', { act_id: ACT_ID, task_id_list: ['101'] }));
  assert.equal(errorCode(task), 311);
  const stage = await request(116002, 6, codec.pack('pb_help_up_stage_award_req', { act_id: ACT_ID, stage_tid_list: ['101'] }));
  assert.equal(errorCode(stage), 311);

  // Unlocking the task statistics over the same session makes the claim succeed.
  setStatistic(game.store, 82, [{ id: 10017, total: 1 }]);
  const claimed = await request(116001, 7, codec.pack('pb_help_up_task_reward_req', { act_id: ACT_ID, task_id_list: ['101'] }));
  assert.equal(errorCode(claimed), 0);
  const claimBody = codec.unpack('pb_help_up_task_reward_rsp', Buffer.from(claimed.data, 'base64'));
  assert.deepEqual(claimBody.act_data.daily_task_tid_list, ['101']);
  const reopened = await request(116001, 8, codec.pack('pb_help_up_task_reward_req', { act_id: ACT_ID, task_id_list: ['101'] }));
  assert.equal(errorCode(reopened), 310);
});
