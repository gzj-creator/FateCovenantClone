import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;

function moduleData(login, moduleId) {
  const entry = login[2].value.find(value => Number(value[0]) === moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  assert.ok(Array.isArray(entry[1].value), `login module ${moduleId} uses the observed list shape`);
  assert.equal(entry[1].value.length, 1, `login module ${moduleId} has one data slot`);
  return Buffer.from(entry[1].value[0].value);
}

async function connectAndLogin(game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
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
  send(codec.pack('pb_c2s', {
    type: 909103,
    seq: 1,
    data: codec.pack('login', {
      server_id: 1,
      channel_uid: 'local-user',
      verify_code: 'test-session',
      channel_extra: ''
    })
  }));
  const response = codec.unpack('pb_s2c', await next());
  assert.equal(response.err, undefined);
  const login = await decodeEtf(Buffer.from(response.data, 'base64'));
  return { socket, next, login };
}

test('time temple login module and 7801 draw push use the captured schemas', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-time-temple-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  };
  let game = createLocalGame(options);
  let socket;
  t.after(async () => {
    socket?.destroy();
    if (game) await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  // Reproduce an account created before module 159 initialization existed.
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.delete(159);
    model.state.modules.value = [...modules];
  });

  let connection = await connectAndLogin(game);
  socket = connection.socket;
  let bytes = moduleData(connection.login, 159);
  assert.equal(bytes.length, 0);
  assert.deepEqual(codec.unpack('pb_time_temple_data', bytes), {
    bond_data: [],
    runes_data: [],
    god_data: [],
    select_runes: []
  });
  assert.deepEqual(game.timeTemple.snapshot().counts, {
    bonds: 0,
    runes: 0,
    gods: 0,
    selectedRunes: 0
  });

  const draw = { season_id: 7, draw_num: 2, award_phase_num: 3, award_state: Buffer.from([1, 2, 3]) };
  const encoded = game.timeTemple.createDrawPush(draw);
  assert.equal(encoded.type, 7801);
  assert.equal(encoded.schema, 'pb_time_temple_draw');
  game.timeTemple.publishDraw(draw);
  const pushed = codec.unpack('pb_s2c', await connection.next());
  assert.equal(pushed.type, 7801);
  const pushedDraw = codec.unpack('pb_time_temple_draw', Buffer.from(pushed.data, 'base64'));
  assert.equal(Number(pushedDraw.season_id), 7);
  assert.equal(Number(pushedDraw.draw_num), 2);
  assert.equal(Number(pushedDraw.award_phase_num), 3);
  assert.equal(pushedDraw.award_state, 'AQID');
  assert.throws(() => game.timeTemple.publishDraw({ ...draw, season_id: -1 }), error => error.code === 5);
  assert.throws(() => game.timeTemple.publishDraw({ ...draw, award_state: 'not-bytes' }), error => error.code === 5);

  // Reopen the same SQLite database and prove the initialized module survives.
  socket.destroy(); socket = undefined;
  await game.close(); game = undefined;
  game = createLocalGame(options);
  connection = await connectAndLogin(game);
  socket = connection.socket;
  bytes = moduleData(connection.login, 159);
  assert.equal(bytes.length, 0);
  assert.deepEqual(codec.unpack('pb_time_temple_data', bytes).select_runes, []);
});
