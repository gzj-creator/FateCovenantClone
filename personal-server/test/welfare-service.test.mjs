import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createWelfareService } from '../game/welfare-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const fixedNow = 1793300000000; // 2026-10-29 UTC+8; day 5 of the fixture's 7-day activity

function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-welfare-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec });
  const make = () => {
    const wallet = createWalletService({ store, codec, tables });
    return { wallet, service: createWelfareService({ store, codec, tables, wallet, now: () => fixedNow }) };
  };
  let api = make();
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get wallet() { return api.wallet; },
    get service() { return api.service; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec });
      api = make();
    }
  };
}

const moduleValue = (store, id) => new Map(store.state().modules.value).get(id);
const run = (service, type, schema, value, seq = 1) => service.execute(type, codec.pack(schema, value), { connection: 'test-connection', seq });

test('multi-login claims set MSB bits once and grant all configured inventory rewards', async t => {
  const e = setup(t);
  const claim = award_tid => run(e.service, 82101, 'pb_multi_login_award_req', { act_id: 53037, req_item_list: [{ award_tid }] });
  let result = await claim(3701);
  assert.equal(result.value.res.changes.find(x => x.tid === '71200').diff_num, '20');
  await assert.rejects(() => claim(3701), x => x.code === 310);
  await claim(3702);
  result = await claim(3703);
  assert.equal(result.value.res.changes.find(x => x.tid === '101500').diff_num, '1188');
  await assert.rejects(() => claim(3707), x => x.code === 311);

  const activity = codec.unpack('pb_act_login', rawBinary(moduleValue(e.store, 92)));
  const loginData = activity.act_list.find(x => x.state_data.act_id === 53037).module_login_data;
  const decoded = await decodeEtf(Buffer.from(loginData, 'base64'));
  assert.deepEqual([...decoded.value], [0x70]);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 3);
  assert.equal(e.store.read().resources.get('71200').num, '40');
  e.reopen();
  await assert.rejects(() => claim(3701), x => x.code === 310);
});

test('princess noon and night energy rewards use module 126 and reject duplicates', async t => {
  const e = setup(t);
  let result = await run(e.service, 84601, 'pb_princess_req', { req_list: [{ type_tid: 2, param: 1 }] });
  assert.equal(result.value.res.changes.find(x => x.tid === '122702').diff_num, '3');
  assert.equal(result.value.energy_back.last_noon_day, '20755');
  await assert.rejects(() => run(e.service, 84601, 'pb_princess_req', { req_list: [{ type_tid: 2, param: 1 }] }), x => x.code === 310);
  result = await run(e.service, 84601, 'pb_princess_req', { req_list: [{ type_tid: 2, param: 2 }] });
  assert.equal(result.value.energy_back.last_night_day, '20755');
  await assert.rejects(() => run(e.service, 84601, 'pb_princess_req', { req_list: [{ type_tid: 1, param: 1 }] }), x => x.code === 5);
  assert.deepEqual(codec.unpack('pb_princess', rawBinary(moduleValue(e.store, 126))), { energy: { last_noon_day: '20755', last_night_day: '20755' } });
});

test('daily discount selection persists and updates in place', async t => {
  const e = setup(t);
  const select = (select_tid) => run(e.service, 99300, 'pb_daily_discount_select_req', { recharge_tid: 40008, select_tid, day_index: '20753' });
  let result = await select(1);
  assert.equal(result.value.recharge_tid, 40008);
  assert.equal(result.value.select_tid, 1);
  let all = codec.unpack('pb_daily_discount_all', rawBinary(moduleValue(e.store, 108)));
  assert.deepEqual(all.select_list, [{ recharge_tid: 40008, select_tid: 1, day_index: '20753' }]);
  result = await select(2);
  assert.equal(result.value.select_tid, 2);
  all = codec.unpack('pb_daily_discount_all', rawBinary(moduleValue(e.store, 108)));
  assert.equal(all.select_list.length, 1);
  assert.equal(all.select_list[0].select_tid, 2);
  e.reopen();
  all = codec.unpack('pb_daily_discount_all', rawBinary(moduleValue(e.store, 108)));
  assert.equal(all.select_list[0].select_tid, 2);
  await assert.rejects(() => run(e.service, 99300, 'pb_daily_discount_select_req', { recharge_tid: 40006, select_tid: 1, day_index: '20753' }), x => x.code === 5);
});

test('gift purchase grants free and paid rewards, enforces limits and records module 19', async t => {
  const e = setup(t);
  const buy = (recharge_id, seq) => run(e.service, 16005, 'pb_recharge_buy_or_rev_req', { recharge_id, extra_param: '[[false,0,0]]', buy_num: 1 }, seq);
  let result = await buy(40006, 1);
  assert.equal(result.value.res.changes.find(x => x.tid === '101500').diff_num, '30');
  await assert.rejects(() => buy(40006, 2), x => x.code === 307);
  await assert.rejects(() => buy(40008, 3), x => x.code === 301);
  assert.equal(e.wallet.credit({ account_id: 'local-1', amount_cents: 5000, request_id: 'welfare-credit' }).balance_cents, 5000);
  result = await buy(40008, 4);
  assert.equal(result.value.res.changes.find(x => x.tid === '101500').diff_num, '300');
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, 2000);
  result = await buy(40009, 5);
  assert.equal(result.value.res.changes.find(x => x.tid === '122702').diff_num, '6');
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, 1400);
  const login = codec.unpack('res_recharge_login', rawBinary(moduleValue(e.store, 19)));
  const record = codec.unpack('pb_buy_gift_record_list', Buffer.from(login.buy_gift_record, 'base64'));
  assert.deepEqual(record.record_list.map(x => x.recharge_tid), [40006, 40008, 40009]);
  e.reopen();
  await assert.rejects(() => buy(40006, 6), x => x.code === 307);
  await assert.rejects(() => e.service.execute(16005, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 11, buy_num: 1 }), { connection: 'test', seq: 7 }), x => x.code === 5);
});

test('real gateway routes welfare claims and gift purchase without LOCAL_NOT_IMPLEMENTED', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-welfare-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    localWallet: true,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
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

  let response = await request(82101, 20, codec.pack('pb_multi_login_award_req', { act_id: 53037, req_item_list: [{ award_tid: 3701 }] }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes.find(x => x.tid === '71200').diff_num, '20');
  response = await request(84601, 21, codec.pack('pb_princess_req', { req_list: [{ type_tid: 2, param: 1 }] }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_princess_back', Buffer.from(response.data, 'base64')).res.changes.find(x => x.tid === '122702').diff_num, '3');
  response = await request(99300, 22, codec.pack('pb_daily_discount_select_req', { recharge_tid: 40008, select_tid: 1, day_index: '20753' }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_daily_discount_select_info', Buffer.from(response.data, 'base64')).select_tid, 1);
  response = await request(16005, 23, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 40006, extra_param: '[[false,0,0]]', buy_num: 1 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64')).res.changes.find(x => x.tid === '101500').diff_num, '30');
  response = await request(16005, 24, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 40008, buy_num: 1 }));
  assert.equal(response.err.err, 301);
  response = await request(117005, 25, codec.pack('pb_hundred_draw_act_marquee_req', { act_id: 1102010, start_range: 1, end_range: 10 }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_hundred_draw_act_marquee_rsp', Buffer.from(response.data, 'base64')).data.data, []);
});
