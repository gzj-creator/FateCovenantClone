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
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session' });
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

test('repeat voucher purchase at the limit is acknowledged without a client error', async t => {
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
  assert.equal(response.err, undefined);
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
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, localWallet: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session', logger: event => logs.push(event) });
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
  const frames = [codec.unpack('pb_s2c', await next()), codec.unpack('pb_s2c', await next())];
  const notification = frames.find(frame => frame.type === 1900);
  assert.ok(notification);
  const push = codec.unpack('res_recharge_success', Buffer.from(notification.data, 'base64'));
  const extra = push.extra_ret_list.find(entry => entry.flag === 40);
  assert.ok(extra);
  const info = codec.unpack('pb_daily_discount_all', Buffer.from(extra.data, 'base64'));
  assert.equal(info.daily_discount_list.find(row => row.recharge_tid === 3).buy_times, 1);
  assert.equal(codec.unpack('pb_daily_discount_all', rawBinary(new Map(game.store.state().modules.value).get(108))).daily_discount_list.find(row => row.recharge_tid === 3).buy_times, 1);

  const options = JSON.stringify([{ ipv4: '10.0.2.15', channel_extra_cfg: '', channel_id: '160092', mac_address: '' }, [true, 1, 20754]]);
  send(codec.pack('pb_c2s', { type: 16004, seq: 3, data: await encodeEtf([40010, binary(Buffer.from(options)), 701500]) }));
  const additionalFrames = [codec.unpack('pb_s2c', await next()), codec.unpack('pb_s2c', await next())];
  const additionalNotification = additionalFrames.find(frame => frame.type === 1900);
  assert.ok(additionalNotification);
  const additionalPush = codec.unpack('res_recharge_success', Buffer.from(additionalNotification.data, 'base64'));
  const additionalInfo = codec.unpack('pb_daily_discount_all', Buffer.from(additionalPush.extra_ret_list.find(entry => entry.flag === 40).data, 'base64'));
  const additionalRow = additionalInfo.daily_discount_list.find(row => row.recharge_tid === 3);
  assert.equal(additionalRow.buy_times, 1);
  assert.equal(additionalRow.buy_additionally, 5);
  assert.equal(logs.find(event => event.event === 'voucher_recharge_committed' && event.seq === 3)?.extraBuy, true);
  game.store.inspect(db => {
    const order = db.prepare('SELECT payload_json FROM recharge_orders WHERE product_id=? ORDER BY rowid DESC LIMIT 1').get(40010);
    const payload = JSON.parse(order.payload_json);
    assert.equal(payload.daily_discount_additional, true);
    assert.equal(payload.requested_extra_buy, true);
  });
});
