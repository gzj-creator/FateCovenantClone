import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createAccRechargeService } from '../game/acc-recharge-service.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const WINDOW = activityWindow(tables.ActFrameAct.get(106036), SERVER_OPENED_AT);
const dayIndex = timestampSeconds => Math.floor((timestampSeconds + 10800) / 86400);
const startDay = dayIndex(WINDOW.start);
const endDay = dayIndex(WINDOW.end);

function setRechargeRecords(store, records, total = records.reduce((sum, row) => sum + row.amount, 0)) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const raw = modules.get(19) ? rawBinary(modules.get(19)) : Buffer.alloc(0);
    const login = raw.length ? codec.unpack('res_recharge_login', raw) : {};
    login.total_amount = total;
    login.recharge_record = { recent_record: records, total_day: records.length };
    modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
    model.state.modules.value = [...modules];
  });
}

function setAwardState(store, actId, bytes) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const data = codec.unpack('pb_acc_recharge_list', rawBinary(modules.get(106)));
    const row = data.list.find(entry => Number(entry.act_id) === actId);
    row.award_state = bytes.toString('base64');
    modules.set(106, serializedBinary(codec.pack('pb_acc_recharge_list', data)));
    model.state.modules.value = [...modules];
  });
}

function setup(t, serviceTables = tables) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-acc-recharge-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
  const calendar = { serverOpenedAt: SERVER_OPENED_AT };
  const make = () => createAccRechargeService({ store, codec, tables: serviceTables, calendar });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    setRechargeRecords: (records, total) => setRechargeRecords(store, records, total),
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
      service = make();
    }
  };
}

const claim = (service, awardTid = 36001101) => service.execute(
  codec.pack('pb_acc_recharge_award_req', { act_id: 106036, award_tid: awardTid })
);

test('cumulative recharge claims persist award slots and grant configured rewards', t => {
  const e = setup(t);
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  let result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(x => x.tid === '807002').diff_num, '10');
  assert.throws(() => claim(e.service, 36001101), x => x.code === 310);
  result = claim(e.service, 36001102);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(x => x.tid === '807002').diff_num, '10');
  result = claim(e.service, 36001103);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(x => x.tid === '807002').diff_num, '15');
  assert.throws(() => claim(e.service, 36001104), x => x.code === 311);

  let module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  let row = module.list.find(x => Number(x.act_id) === 106036);
  let state = Buffer.from(row.award_state, 'base64');
  assert.deepEqual([...state.subarray(0, 4)], [0x70, 0, 0, 0]);
  assert.equal(hasBit(state, 1), true);
  assert.equal(hasBit(state, 2), true);
  assert.equal(hasBit(state, 3), true);
  assert.equal(hasBit(state, 4), false);
  assert.equal(state.length, 100);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 3);

  e.reopen();
  assert.throws(() => claim(e.service, 36001101), x => x.code === 310);
  module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  row = module.list.find(x => Number(x.act_id) === 106036);
  assert.equal(hasBit(Buffer.from(row.award_state, 'base64'), 3), true);
});

test('cumulative recharge compares cent thresholds without a second conversion', t => {
  const e = setup(t);
  assert.equal(tables.AccRechargeAward.get(36001101).acc_cnt, 6800);

  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 6799 }]);
  assert.throws(() => claim(e.service, 36001101), error => error.code === 311);

  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 6800 }]);
  const result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '807002').diff_num, '10');
});

test('every configured award tier in the active cumulative-recharge version uses cents', t => {
  // Replace reward payloads so this test isolates threshold calculation from
  // resource families whose dedicated inventory handlers are not implemented.
  const thresholdTables = {
    ...tables,
    AccRechargeAward: new Map([...tables.AccRechargeAward].map(([awardTid, award]) => [
      awardTid,
      { ...award, award: [[807002, 1]] }
    ]))
  };
  const e = setup(t, thresholdTables);
  const awards = [...tables.AccRechargeAward.values()]
    .filter(award => Number(award.version) === 36)
    .sort((a, b) => Number(a.tid) - Number(b.tid));
  const maximum = Math.max(...awards.map(award => Number(award.acc_cnt)));
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: maximum }]);

  for (const award of awards) claim(e.service, award.tid);

  const module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  const state = Buffer.from(module.list.find(row => Number(row.act_id) === 106036).award_state, 'base64');
  assert.equal(state.length, 100);
  for (const award of awards) assert.equal(hasBit(state, Number(award.tid) % 100), true);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), awards.length);
});

test('cumulative recharge uses inclusive activity-window records instead of lifetime total', t => {
  const e = setup(t);
  e.setRechargeRecords([
    { day_index: startDay - 1, recharge_ids: [11], amount: 20000 },
    { day_index: startDay, recharge_ids: [11], amount: 3400 },
    { day_index: endDay, recharge_ids: [11], amount: 3399 },
    { day_index: endDay + 1, recharge_ids: [11], amount: 20000 }
  ], 50000);
  assert.throws(() => claim(e.service, 36001101), error => error.code === 311);

  e.setRechargeRecords([
    { day_index: startDay - 1, recharge_ids: [11], amount: 20000 },
    { day_index: startDay, recharge_ids: [11], amount: 3400 },
    { day_index: endDay, recharge_ids: [11], amount: 3400 },
    { day_index: endDay + 1, recharge_ids: [11], amount: 20000 }
  ], 50000);
  const result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '807002').diff_num, '10');
});

test('wallet purchases accumulate in the 98620 activity day range', t => {
  const e = setup(t);
  const wallet = createWalletService({ store: e.store, codec, tables, now: () => WINDOW.start });
  wallet.credit({ account_id: 'local-1', amount_cents: 6800, request_id: 'acc-range-fund' });
  const purchase = wallet.buy({ account_id: 'local-1', product_id: 113, request_id: 'acc-range-buy' });
  assert.equal(purchase.price_cents, 6800);

  const login = codec.unpack('res_recharge_login', rawBinary(new Map(e.store.state().modules.value).get(19)));
  assert.equal(login.total_amount, 6800);
  assert.deepEqual(login.recharge_record.recent_record, [{ recharge_ids: [113], day_index: startDay, amount: 6800 }]);

  const result = claim(e.service, 36001101);
  assert.equal(codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '807002').diff_num, '10');
});

test('repairs legacy byte-index award states from persisted claims', t => {
  const e = setup(t);
  e.setRechargeRecords([{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  claim(e.service, 36001101);
  claim(e.service, 36001102);
  claim(e.service, 36001103);

  const legacy = Buffer.alloc(100);
  legacy[0] = 1;
  legacy[1] = 1;
  legacy[2] = 1;
  setAwardState(e.store, 106036, legacy);

  e.reopen();
  const module = codec.unpack('pb_acc_recharge_list', rawBinary(new Map(e.store.state().modules.value).get(106)));
  const row = module.list.find(x => Number(x.act_id) === 106036);
  const state = Buffer.from(row.award_state, 'base64');
  assert.deepEqual([...state.subarray(0, 4)], [0x70, 0, 0, 0]);
  assert.equal(hasBit(state, 1), true);
  assert.equal(hasBit(state, 2), true);
  assert.equal(hasBit(state, 3), true);
  assert.throws(() => claim(e.service, 36001101), x => x.code === 310);
});

test('real gateway routes 98620 instead of returning LOCAL_NOT_IMPLEMENTED', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-acc-recharge-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    localWallet: true,
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => (WINDOW.start + 3600) * 1000,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  setRechargeRecords(game.store, [{ day_index: startDay, recharge_ids: [11], amount: 20400 }]);
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
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
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  const response = await request(98620, 2, codec.pack('pb_acc_recharge_award_req', { act_id: 106036, award_tid: 36001101 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes.find(x => x.tid === '807002').diff_num, '10');
});
