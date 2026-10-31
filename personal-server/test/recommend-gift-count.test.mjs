import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, binary, rawBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);

test('recommend gift list reports stored purchase counts so limited offers stop looking buyable', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-recommend-gift-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, activityMode: 'all-open', verifySession: (uid, code) => uid === 'local-user' && code === 'test-session' });
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

  game.store.transaction((model, db) => {
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,role_id) VALUES (?,?)').run('local-1', model.state.roleId);
    db.prepare('INSERT OR REPLACE INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged) VALUES (?,?,?,?,?,?,?,?)').run('test-order-40008', 'local-1', 'test-request-40008', 40008, 3000, '{}', new Date().toISOString(), 1);
  });

  const response = await request(85901, 2, codec.pack('pb_recommend_gift_active_req', { actives: [{ act_tid: 13016, gift_id: [40008, 46003] }] }));
  assert.equal(response.err, undefined);
  const rsp = codec.unpack('pb_recommend_gift_active_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(rsp.gift_list.map(gift => gift.act_tid), [13016]);
  // protobuf omits default zero values on the wire, so an unbought offer decodes as undefined
  assert.deepEqual(rsp.gift_list[0].buy_list.map(buy => [buy.recharge_tid, buy.buy_times ?? 0]), [[40008, 1], [46003, 0]]);
});

test('repeat voucher purchase at the limit returns a protocol error instead of waiting for 1900', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-recharge-repeat-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, localWallet: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session' });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  game.store.transaction((model, db) => {
    grantResources(model, [[701500, 3000]], tables);
    const modules = new Map(model.state.modules.value);
    const info = codec.unpack('pb_daily_discount_all', rawBinary(modules.get(108)));
    const row = info.daily_discount_list.find(value => value.recharge_tid === 4);
    row.buy_times = 1;
    row.buy_additionally = 0;
    modules.set(108, { value: codec.pack('pb_daily_discount_all', info).toJSON(), bits: 8 });
    model.state.modules.value = [...modules];
    db.prepare('INSERT OR IGNORE INTO local_wallets(account_id,role_id) VALUES (?,?)').run('local-1', model.state.roleId);
    db.prepare('INSERT OR REPLACE INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged) VALUES (?,?,?,?,?,?,?,?)').run('existing-40008', 'local-1', 'existing-request', 40008, 3000, '{}', new Date().toISOString(), 1);
  });
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

  const response = await request(16004, 2, await encodeEtf([40008, binary(Buffer.from('[]')), 701500]));
  assert.equal(response.err.err, 307);
  game.store.inspect(db => {
    const count = db.prepare("SELECT count(*) n FROM recharge_orders WHERE product_id=40008").get().n;
    assert.equal(count, 1);
  });
});

test('type-46 purchase pushes the daily-discount protobuf and persists its purchase count', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-daily-discount-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const logs = [];
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, localWallet: true, now: () => Date.parse('2026-10-31T04:00:00Z'), verifySession: (uid, code) => uid === 'local-user' && code === 'test-session', logger: event => logs.push(event) });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  game.store.transaction(model => grantResources(model, [[701500, 3000]], tables));
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

  send(codec.pack('pb_c2s', { type: 16004, seq: 2, data: await encodeEtf([40010, binary(Buffer.from('[]')), 701500]) }));
  const frames = [];
  while (!frames.some(frame => frame.seq === 2)) frames.push(codec.unpack('pb_s2c', await next()));
  assert.equal(frames.find(frame => frame.seq === 2)?.err, undefined);
  const notification = frames.find(frame => frame.type === 1900);
  assert.ok(notification);
  const push = codec.unpack('res_recharge_success', Buffer.from(notification.data, 'base64'));
  const extra = push.extra_ret_list.find(entry => entry.flag === 40);
  assert.ok(extra);
  const info = codec.unpack('pb_daily_discount_all', Buffer.from(extra.data, 'base64'));
  assert.equal(info.daily_discount_list.find(row => row.recharge_tid === 3).buy_times, 1);
  assert.equal(codec.unpack('pb_daily_discount_all', rawBinary(new Map(game.store.state().modules.value).get(108))).daily_discount_list.find(row => row.recharge_tid === 3).buy_times, 1);

  const week = codec.unpack('pb_week_hunt', rawBinary(new Map(game.store.state().modules.value).get(533))).week_period_info[0];
  const makeupDay = week.start_day + 5;
  const options = JSON.stringify([{ ipv4: '10.0.2.15', channel_extra_cfg: '', channel_id: '160092', mac_address: '' }, [true, week.version, makeupDay]]);
  send(codec.pack('pb_c2s', { type: 16004, seq: 3, data: await encodeEtf([40010, binary(Buffer.from(options)), 701500]) }));
  const additionalFrames = [];
  while (!additionalFrames.some(frame => frame.seq === 3)) additionalFrames.push(codec.unpack('pb_s2c', await next()));
  assert.equal(additionalFrames.find(frame => frame.seq === 3)?.err, undefined);
  const additionalNotification = additionalFrames.find(frame => frame.type === 1900);
  assert.ok(additionalNotification);
  const additionalPush = codec.unpack('res_recharge_success', Buffer.from(additionalNotification.data, 'base64'));
  const additionalInfo = codec.unpack('pb_daily_discount_all', Buffer.from(additionalPush.extra_ret_list.find(entry => entry.flag === 40).data, 'base64'));
  const additionalRow = additionalInfo.daily_discount_list.find(row => row.recharge_tid === 3);
  assert.equal(additionalRow.buy_times, 1);
  assert.equal(additionalRow.buy_additionally, 5);
  const extraParams = await decodeEtf(Buffer.from(additionalPush.extra_params, 'base64'));
  assert.deepEqual(extraParams.value[0].value, [true, week.version, makeupDay]);
  assert.equal(additionalPush.res.changes.find(row => String(row.tid) === '5971200').diff_num, '10');
  assert.equal(logs.find(event => event.event === 'voucher_recharge_committed' && event.seq === 3)?.extraBuy, true);
  game.store.inspect(db => {
    const order = db.prepare('SELECT payload_json FROM recharge_orders WHERE product_id=? ORDER BY rowid DESC LIMIT 1').get(40010);
    const payload = JSON.parse(order.payload_json);
    assert.equal(payload.daily_discount_additional, true);
    assert.equal(payload.requested_extra_buy, true);
  });

  send(codec.pack('pb_c2s', { type: 16004, seq: 4, data: await encodeEtf([40008, binary(Buffer.from('[]')), 701500]) }));
  const eliteFrames = [];
  while (!eliteFrames.some(frame => frame.seq === 4)) eliteFrames.push(codec.unpack('pb_s2c', await next()));
  assert.equal(eliteFrames.find(frame => frame.seq === 4)?.err, undefined);
  const elite = codec.unpack('res_recharge_success', Buffer.from(eliteFrames.find(frame => frame.type === 1900).data, 'base64'));
  assert.equal(elite.res.changes.find(row => String(row.tid) === '5971200').diff_num, '25');
  const eliteParams = await decodeEtf(Buffer.from(elite.extra_params, 'base64'));
  assert.deepEqual(eliteParams.value[0].value, [false, week.version, week.start_day + 4]);
  const acknowledged = await request(16003, 5, await encodeEtf(binary(elite.order)));
  assert.equal(acknowledged.err, undefined);
  const relogin = await request(909103, 6, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  const reloginData = await decodeEtf(Buffer.from(relogin.data, 'base64'));
  const returnedModules = new Map(reloginData[2].value);
  const returnedWeek = codec.unpack('pb_week_hunt', Buffer.from(returnedModules.get(533).value));
  assert.equal(returnedWeek.week_period_info[0].start_day, week.start_day);
  assert.equal(returnedWeek.week_period_info[0].upgrade_list.some(row => row.day_index === week.start_day + 4 && row.recharge_id === 40008), true);
});

test('native 16004 batch offer updates all limited rows, rejects components and acknowledges through 16003', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-daily-batch-tcp-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const logs = [];
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, localWallet: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session', logger: event => logs.push(event) });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  game.store.transaction(model => grantResources(model, [[701500, 9]], tables));
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
  const ordersBefore = game.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n);

  send(codec.pack('pb_c2s', { type: 16004, seq: 2, data: await encodeEtf([46003, binary(Buffer.from('[]')), 701500]) }));
  const frames = [];
  while (!frames.some(frame => frame.seq === 2)) frames.push(codec.unpack('pb_s2c', await next()));
  const notification = frames.find(frame => frame.type === 1900);
  assert.ok(notification);
  assert.equal(frames.find(frame => frame.seq === 2)?.err, undefined);
  const purchase = codec.unpack('res_recharge_success', Buffer.from(notification.data, 'base64'));
  const pushed = codec.unpack('pb_daily_discount_all', Buffer.from(purchase.extra_ret_list.find(entry => entry.flag === 40).data, 'base64'));
  assert.deepEqual([6, 2, 5].map(tid => pushed.daily_discount_list.find(row => row.recharge_tid === tid)?.buy_times ?? 0), [1, 1, 1]);

  for (const [seq, productId] of [[3, 40009], [4, 46002], [5, 46003]]) {
    const response = await request(16004, seq, await encodeEtf([productId, binary(Buffer.from('[]')), 701500]));
    assert.equal(response.err.err, 307);
    assert.equal(game.store.inspect(db => db.prepare('SELECT count(*) n FROM recharge_orders').get().n), ordersBefore + 1);
  }
  assert.equal(logs.filter(event => event.event === 'voucher_recharge_rejected' && event.code === 307).length, 3);

  const acknowledged = await request(16003, 6, await encodeEtf(binary(purchase.order)));
  assert.equal(acknowledged.err, undefined);
  assert.equal(game.store.inspect(db => db.prepare('SELECT acknowledged FROM recharge_orders WHERE order_id=?').get(purchase.order).acknowledged), 1);
});

test('native 16004 uses available vouchers up to the order price and charges the remainder', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-partial-voucher-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, localWallet: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session' });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  game.store.transaction(model => grantResources(model, [[701500, 4]], tables));
  game.wallet.credit({ account_id: 'local-1', amount_cents: 200, request_id: 'partial-voucher-credit' });
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

  send(codec.pack('pb_c2s', { type: 16004, seq: 2, data: await encodeEtf([40009, binary(Buffer.from('[]')), 701500]) }));
  const frames = [codec.unpack('pb_s2c', await next()), codec.unpack('pb_s2c', await next())];
  const notification = frames.find(frame => frame.type === 1900);
  assert.ok(notification);
  const pushed = codec.unpack('res_recharge_success', Buffer.from(notification.data, 'base64'));
  assert.equal(pushed.recharge_id, 40009);
  assert.equal(pushed.get_token, true);
  assert.equal(pushed.is_use_token, true);
  assert.equal(Number(pushed.use_item_tid), 701500);
  const order = game.wallet.snapshot().orders.find(value => value.product_id === 40009);
  assert.equal(order.voucher_quantity, 4);
  assert.equal(order.voucher_amount_cents, 400);
  assert.equal(order.balance_paid_cents, 200);
  assert.equal(game.voucher.balance().quantity, 0);
  assert.equal(game.wallet.snapshot().accounts[0].balance_cents, 0);
  assert.equal(frames.find(frame => frame.type !== 1900)?.err, undefined);
});
