import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;

test('hero draw support commands answer through the real gateway', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-support-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_NOW
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
  const request = async (type, seq, data = Buffer.alloc(0)) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal(login.err, undefined);
  const loginValue = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.ok(loginValue[2].value.find(entry => Number(entry[0]) === 10), 'login carries the hero module');

  let response = await request(652, 2);
  assert.equal(response.err, undefined);
  let value = codec.unpack('pb_draw_support_back', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.role_support.support_list, []);
  assert.deepEqual(value.server_support.support_list, []);

  response = await request(651, 3, await encodeEtf([2, 3]));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_draw_support_back', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.role_support.support_list, [{ lineup_type: '3', support_num: 1 }]);
  assert.deepEqual(value.server_support.support_list, [{ lineup_type: '3', support_num: 1 }]);

  response = await request(652, 4, await encodeEtf([2]));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_draw_support_back', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.server_support.support_list, [{ lineup_type: '3', support_num: 1 }]);

  const stored = game.store.inspect(db => db.prepare('SELECT role_id,draw_lib,lineup_type FROM hero_draw_support').all());
  assert.equal(stored.length, 1);
  assert.equal(Number(stored[0].lineup_type), 3);

  response = await request(635, 5, await encodeEtf([1]));
  assert.equal(response.err.err, 3001);

  response = await request(673, 6, codec.pack('pb_draw_marquee_req', { draw_lib: 2, param: Buffer.alloc(0) }));
  assert.equal(response.err, undefined);
  assert.ok(response.data === undefined || response.data === '');
  const marquee = codec.unpack('pb_draw_marquee_rsp', Buffer.from(response.data ?? '', 'base64'));
  assert.ok(marquee.data === undefined || marquee.data === '' || marquee.data === null);
});
