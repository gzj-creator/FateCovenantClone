import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createWelfareService } from '../game/welfare-service.mjs';
import { grantResources } from '../game/resources.mjs';
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
  let currentTime = fixedNow;
  const make = () => {
    const wallet = createWalletService({ store, codec, tables, now: () => Math.floor(currentTime / 1000) });
    return { wallet, service: createWelfareService({ store, codec, tables, wallet, now: () => currentTime }) };
  };
  let api = make();
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get wallet() { return api.wallet; },
    get service() { return api.service; },
    setTime(value) { currentTime = value; },
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

test('gift purchase records the purchase without adding it to recharge totals', async t => {
  const e = setup(t);
  const buy = (recharge_id, seq) => run(e.service, 16005, 'pb_recharge_buy_or_rev_req', { recharge_id, extra_param: '[[false,0,0]]', buy_num: 1 }, seq);
  let result = await buy(40006, 1);
  assert.equal(result.value.res.changes.find(x => x.tid === '101500').diff_num, '30');
  const dailyExtra = result.value.extra_ret_list.find(entry => entry.flag === 40);
  assert.ok(dailyExtra);
  const daily = codec.unpack('pb_daily_discount_all', dailyExtra.data);
  assert.equal(daily.daily_discount_list.find(row => row.recharge_tid === 1).buy_times, 1);
  assert.deepEqual(codec.unpack('pb_daily_discount_all', rawBinary(moduleValue(e.store, 108))), daily);
  const payload = e.store.inspect(db => JSON.parse(db.prepare('SELECT payload_json FROM recharge_orders WHERE product_id=40006').get().payload_json));
  assert.equal(payload.daily_discount_purchase, true);
  assert.equal(payload.daily_discount_additional, false);
  const afterFirst = e.store.state();
  const replay = await buy(40006, 1);
  assert.deepEqual(replay.data, result.data);
  assert.deepEqual(e.store.state(), afterFirst);
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
  assert.equal(login.total_amount ?? 0, 0);
  assert.deepEqual(login.recharge_record?.recent_record ?? [], []);
  e.reopen();
  await assert.rejects(() => buy(40006, 6), x => x.code === 307);
  await assert.rejects(() => e.service.execute(16005, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 999999999, buy_num: 1 }), { connection: 'test', seq: 7 }), x => x.code === 5);
});

test('16005 monthly card purchase ignores unrelated UI context in extra_param', async t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'monthly-card-16005' });
  const result = await run(e.service, 16005, 'pb_recharge_buy_or_rev_req', {
    recharge_id: 140002,
    extra_param: '{"from":"monthly-card","tab":1}',
    buy_num: 1
  });
  const event = result.value.extra_ret_list.find(entry => Number(entry.flag) === 5);
  assert.ok(event);
  const monthly = codec.unpack('pb_monthly_card_info', event.data);
  assert.deepEqual(monthly.card_list.map(row => Number(row.id)), [2]);
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, 4000);
});

test('16005 passes fund, permanent card and both permit purchases through their specific handlers', async t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'payment-classes-16005' });
  const products = [
    [155001, 76],
    [490002, 73],
    [2000001, 9],
    [1300071, 116]
  ];
  for (const [seq, [recharge_id, flag]] of products.entries()) {
    const result = await run(e.service, 16005, 'pb_recharge_buy_or_rev_req', {
      recharge_id,
      extra_param: '{"from":"locked-apk","unrelated":true}',
      buy_num: 1
    }, seq + 1);
    assert.ok(result.value.extra_ret_list.some(entry => Number(entry.flag) === flag), `product ${recharge_id} did not return flag ${flag}`);
  }
  assert.equal(e.wallet.snapshot().orders.length, products.length);
  assert.equal(new Map(e.store.state().modules.value).has(532), true);
  assert.equal(new Map(e.store.state().modules.value).has(62), true);
});

test('free daily gift ignores previous-day orders, resets at 05:00 and rebuilds the current-day limit', async t => {
  const e = setup(t);
  e.store.transaction((model, db) => {
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at) VALUES (?,?,?,?,?,?,?)')
      .run('legacy-free-gift', 'local-1', 'legacy-free-gift', 40006, 0, '{}', new Date(fixedNow - 86400000).toISOString());
  });
  e.reopen();
  const buy = seq => run(e.service, 16005, 'pb_recharge_buy_or_rev_req', {
    recharge_id: 40006, extra_param: '[[false,0,0]]', buy_num: 1
  }, seq);
  const before = BigInt(e.store.read().resources.get('101500')?.num ?? 0);
  await assert.rejects(() => run(e.service, 16005, 'pb_recharge_buy_or_rev_req', { recharge_id: 40006, buy_num: 2 }, 1), x => x.code === 307);
  assert.equal(e.wallet.snapshot().orders.length, 1);
  await buy(2);
  assert.equal(BigInt(e.store.read().resources.get('101500').num), before + 30n);
  await assert.rejects(() => buy(3), x => x.code === 307);
  e.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.delete(108);
    model.state.modules.value = [...modules];
  });
  e.reopen();
  const rebuilt = codec.unpack('pb_daily_discount_all', rawBinary(moduleValue(e.store, 108)));
  assert.equal(rebuilt.daily_discount_list.find(row => row.recharge_tid === 1).buy_times, 1);
  await assert.rejects(() => buy(4), x => x.code === 307);
  const resetAt = Number(rebuilt.refresh_time) * 1000;
  e.setTime(resetAt - 1000);
  await assert.rejects(() => buy(5), x => x.code === 307);
  e.setTime(resetAt);
  await buy(6);
  assert.equal(BigInt(e.store.read().resources.get('101500').num), before + 60n);
  assert.equal(e.wallet.snapshot().orders.length, 3);
  const refreshed = codec.unpack('pb_daily_discount_all', rawBinary(moduleValue(e.store, 108)));
  assert.equal(refreshed.daily_discount_list.find(row => row.recharge_tid === 1).buy_times, 1);
  assert.equal(Number(refreshed.refresh_time), resetAt / 1000 + 86400);
  e.reopen();
  await assert.rejects(() => buy(7), x => x.code === 307);
  assert.equal(e.wallet.snapshot().orders.length, 3);
});

test('ordinary resource-priced 16005 gifts use the same order, cycle and restart path', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[401500, 5000]], tables));
  const buy = seq => run(e.service, 16005, 'pb_recharge_buy_or_rev_req', {
    recharge_id: 111003,
    extra_param: '[[false,0,0]]',
    buy_num: 1
  }, seq);
  const result = await buy(1);
  assert.equal(result.value.res.changes.find(change => change.tid === '401500').diff_num, '-800');
  assert.equal(result.value.res.changes.find(change => change.tid === '181200').diff_num, '6');
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents, 0);
  assert.equal(e.wallet.snapshot().orders[0].price_cents, 0);
  await assert.rejects(() => buy(2), error => error.code === 307);
  e.reopen();
  await assert.rejects(() => buy(3), error => error.code === 307);
});

test('real gateway routes welfare claims and gift purchase without LOCAL_NOT_IMPLEMENTED', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-welfare-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    localWallet: true,
    now: () => fixedNow,
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
  const gift = codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64'));
  assert.equal(gift.res.changes.find(x => x.tid === '101500').diff_num, '30');
  const daily = codec.unpack('pb_daily_discount_all', Buffer.from(gift.extra_ret_list.find(entry => entry.flag === 40).data, 'base64'));
  assert.equal(daily.daily_discount_list.find(row => row.recharge_tid === 1).buy_times, 1);
  response = await request(16005, 28, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 40006, buy_num: 1 }));
  assert.equal(response.err.err, 16016);
  response = await request(16005, 24, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 140002, buy_num: 1 }));
  assert.equal(response.err.err, 301);
  response = await request(97101, 25, await encodeEtf([1013]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_wish_treasure_rev_back', Buffer.from(response.data, 'base64')).res.changes.find(change => change.tid === '134817').diff_num, '1');
  response = await request(97101, 26, await encodeEtf([1013]));
  assert.equal(response.err.err, 310);
  response = await request(117005, 27, codec.pack('pb_hundred_draw_act_marquee_req', { act_id: 1102010, start_range: 1, end_range: 10 }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_hundred_draw_act_marquee_rsp', Buffer.from(response.data, 'base64')).data.data, []);
});
