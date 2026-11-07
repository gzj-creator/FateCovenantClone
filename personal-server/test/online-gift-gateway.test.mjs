import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const BASE_MS = Date.parse('2026-11-01T00:00:00Z');

test('37010 works over the actual handshake, login, ETF request, and response path', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-online-gift-gateway-'));
  let now = BASE_MS;
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: Math.floor(BASE_MS / 1000),
    now: () => now
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
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
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
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
  const modules = new Map(game.store.state().modules.value);
  const initialInfo = codec.unpack('pb_online_gift_info', rawBinary(modules.get(134)));
  assert.equal(initialInfo.open, true);
  assert.equal(Number(initialInfo.period ?? 0), 1);
  assert.equal(Number(initialInfo.acc_sec ?? 0), 0);

  now += 180000;
  const claimed = await request(37010, 2, await encodeEtf([]));
  assert.equal(claimed.err, undefined);
  const response = codec.unpack('pb_online_gift_back', Buffer.from(claimed.data, 'base64'));
  assert.equal(Number(response.online_gift.last_receive_id), 1);
  assert.equal(Number(response.online_gift.acc_sec), 180);
  assert.equal(response.res.changes.find(row => row.tid === '2002').diff_num, '1');

  const malformed = await request(37010, 3, await encodeEtf([123]));
  assert.equal(malformed.err.err, 1);
});
