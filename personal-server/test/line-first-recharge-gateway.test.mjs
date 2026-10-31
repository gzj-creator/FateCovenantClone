import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { binary, createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const FIXED_NOW = Date.parse('2026-10-31T10:30:00Z');

test('linear first-recharge purchase synchronizes module 547 and exposes both activity commands', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-line-first-recharge-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let clockNow = FIXED_NOW;
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    localWallet: true,
    now: () => clockNow,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  game.store.transaction((model, db) => {
    db.prepare('UPDATE local_wallets SET balance_cents=5000 WHERE account_id=?').run('local-1');
  });
  const rechargeBefore = Number(codec.unpack('res_recharge_login', rawBinary(new Map(game.store.state().modules.value).get(19))).total_amount ?? 0);

  send(codec.pack('pb_c2s', { type: 16004, seq: 2, data: await encodeEtf([600078, binary(Buffer.from('[]')), 0]) }));
  const purchaseFrames = [];
  while (!purchaseFrames.some(frame => frame.seq === 2)) purchaseFrames.push(codec.unpack('pb_s2c', await next()));
  assert.equal(purchaseFrames.find(frame => frame.seq === 2)?.err, undefined);
  const notification = purchaseFrames.find(frame => frame.type === 1900);
  assert.ok(notification);
  const purchased = codec.unpack('res_recharge_success', Buffer.from(notification.data, 'base64'));
  assert.equal(purchased.recharge_id, 600078);
  assert.equal(purchased.res.changes.find(change => String(change.tid) === '5040201').diff_num, '1');
  const lineInfo = codec.unpack('pb_line_first_recharge', Buffer.from(purchased.extra_ret_list.find(entry => entry.flag === 99).data, 'base64'));
  assert.equal(String(lineInfo.tid), '32');
  assert.equal(String(lineInfo.choose_tid), '3102');
  assert.deepEqual(lineInfo.buy_list.map(entry => String(entry.tid)), ['31']);

  const storedLineInfo = codec.unpack('pb_line_first_recharge', rawBinary(new Map(game.store.state().modules.value).get(547)));
  assert.deepEqual(storedLineInfo.buy_list.map(entry => String(entry.tid)), ['31']);
  assert.equal(String(storedLineInfo.tid), '32');
  const rechargeAfter = Number(codec.unpack('res_recharge_login', rawBinary(new Map(game.store.state().modules.value).get(19))).total_amount ?? 0);
  assert.equal(rechargeAfter - rechargeBefore, 600);

  const choose = await request(102101, 3, await encodeEtf([3102]));
  assert.equal(choose.err, undefined);
  const chosen = codec.unpack('pb_line_first_recharge', Buffer.from(choose.data, 'base64'));
  assert.equal(String(chosen.choose_tid), '3102');

  // Simulate an order from before purchase-state synchronization was deployed.
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const stale = codec.unpack('pb_line_first_recharge', rawBinary(modules.get(547)));
    stale.tid = 31;
    stale.choose_tid = 3101;
    stale.buy_list = [];
    modules.set(547, serializedBinary(codec.pack('pb_line_first_recharge', stale)));
    model.state.modules.value = [...modules];
  });
  const relogin = await request(909103, 4, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const reloginPayload = await decodeEtf(Buffer.from(relogin.data, 'base64'));
  const restoredModule = new Map(reloginPayload[2].value).get(547);
  const restored = codec.unpack('pb_line_first_recharge', Buffer.from(restoredModule.value));
  assert.equal(String(restored.tid), '32');
  assert.deepEqual(restored.buy_list.map(entry => String(entry.tid)), ['31']);

  clockNow += 86400000;
  const claimed = await request(102102, 5, await encodeEtf([31, 1]));
  assert.equal(claimed.err, undefined);
  const claimResponse = codec.unpack('pb_line_first_recharge_rev_back', Buffer.from(claimed.data, 'base64'));
  assert.ok(hasBit(Buffer.from(claimResponse.buy_info.rev_bin, 'base64'), 1));

  const balanceBeforeRetry = game.store.inspect(db => db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get('local-1').balance_cents);
  const repeated = await request(16004, 6, await encodeEtf([600078, binary(Buffer.from('[]')), 0]));
  assert.equal(repeated.err.err, 5);
  game.store.inspect(db => {
    assert.equal(db.prepare('SELECT count(*) n FROM recharge_orders WHERE product_id=600078').get().n, 1);
    assert.equal(db.prepare('SELECT balance_cents FROM local_wallets WHERE account_id=?').get('local-1').balance_cents, balanceBeforeRetry);
  });
});
