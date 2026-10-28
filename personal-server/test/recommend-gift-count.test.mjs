import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, binary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
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
