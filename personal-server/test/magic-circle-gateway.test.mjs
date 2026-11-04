import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { MAGIC_CIRCLE_MODULE } from '../game/magic-circle-service.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);

function addResource(store, tid, num) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value), groups = modules.get(6).value;
    if (!groups[0]) groups[0] = { value: [], improper: false };
    const entry = groups[0].value.length;
    groups[0].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, 0, entry] });
    model.state.modules.value = [...modules];
  });
}

function setCircle(store, circle, id = 1) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(MAGIC_CIRCLE_MODULE);
    const role = module?.value?.length ? codec.unpack('pb_magic_circle_role', rawBinary(module.value[0])) : { magic_circle: [] };
    const rows = [1, 2, 3, 4, 5].map(tid => tid === id
      ? { id, level: 0, star: 0, break_level: 0, points: [], last_reset_time: 0, ...circle }
      : (role.magic_circle ?? []).find(row => Number(row.id) === tid) ?? { id: tid, level: 0, star: 0, break_level: 0, points: [], last_reset_time: 0 });
    modules.set(MAGIC_CIRCLE_MODULE, { value: [serializedBinary(codec.pack('pb_magic_circle_role', { magic_circle: rows }))], improper: false });
    model.state.modules.value = [...modules];
  });
}

test('temporary TCP gateway routes 90401-90405 and keeps unknown commands explicit', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-magic-circle-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    activityMode: 'all-open',
    verifySession: (uid, code) => uid === 'magic-user' && code === 'magic-session',
    now: () => 1700000000000
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const frame of decoder.push(chunk)) { if (waiters.length) waiters.shift()(frame); else queue.push(frame); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(frame => { clearTimeout(timer); resolve(frame); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'magic-user', verify_code: 'magic-session', channel_extra: '' }));
  assert.equal(login.err, undefined);
  const loginPayload = await decodeEtf(Buffer.from(login.data, 'base64'));
  const loginModule = new Map(loginPayload[2].value).get(MAGIC_CIRCLE_MODULE);
  assert.equal(Array.isArray(loginModule.value), true);
  assert.equal(loginModule.value.length, 1);
  assert.deepEqual(codec.unpack('pb_magic_circle_role', Buffer.from(loginModule.value[0].value)).magic_circle.map(row => Number(row.id)), [1, 2, 3, 4, 5]);

  addResource(game.store, 331002, 1000);
  addResource(game.store, 332002, 1000);
  addResource(game.store, 333002, 100);
  let response = await request(90402, 2, codec.pack('pb_magic_circle_level_up_req', { id: 1, target_level: 1 }));
  assert.equal(response.err, undefined);
  let value = codec.unpack('pb_magic_circle_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(value.magic_circles[0].level, 1);
  assert.deepEqual(value.res_change.changes, [{ tid: '332002', new_num: '970', diff_num: '-30' }]);

  response = await request(90401, 3, await encodeEtf(1));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_magic_circle_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(value.magic_circles[0].star, 1);
  assert.deepEqual(value.res_change.changes, [{ tid: '333002', new_num: '99', diff_num: '-1' }]);

  setCircle(game.store, { level: 10, star: 1 });
  response = await request(90403, 4, await encodeEtf(1));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_magic_circle_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(value.magic_circles[0].break_level, 1);
  assert.deepEqual(value.res_change.changes, [{ tid: '332002', new_num: '940', diff_num: '-30' }]);

  response = await request(90404, 5, codec.pack('pb_magic_circle_active_point_req', { id: 1, points: [1] }));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_magic_circle_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.magic_circles[0].points, [1]);
  assert.deepEqual(value.res_change.changes, [{ tid: '331002', new_num: '900', diff_num: '-100' }]);

  response = await request(90405, 6, await encodeEtf(1));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_magic_circle_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.magic_circles[0].points, []);
  assert.equal(Number(value.magic_circles[0].last_reset_time), 1700000000);
  assert.deepEqual(value.res_change.changes, []);

  const saved = codec.unpack('pb_magic_circle_role', rawBinary(new Map(game.store.state().modules.value).get(MAGIC_CIRCLE_MODULE).value[0]));
  assert.equal(saved.magic_circle[0].level, 10);
  assert.equal(saved.magic_circle[0].star, 1);
  assert.equal(saved.magic_circle[0].break_level, 1);
  assert.deepEqual(saved.magic_circle[0].points, []);

  response = await request(90406, 7, await encodeEtf(1));
  assert.equal(response.err.err, -1);
  assert.match(response.err.stacktrace, /LOCAL_NOT_IMPLEMENTED:90406/);
});
