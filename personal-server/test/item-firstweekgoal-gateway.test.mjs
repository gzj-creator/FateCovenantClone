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

const codec = createGameCodec();
const NOW = Date.UTC(2026, 9, 26, 0, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);

test('FirstWeekGoalCmd 67004 and 67005 use the temporary handshake and login module 59015', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-first-week-goal-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    now: () => NOW
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
  const decodedLogin = await decodeEtf(Buffer.from(login.data, 'base64'));
  const modules = new Map(decodedLogin[2].value.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
  assert.ok(modules.has(59015), `login module ids: ${[...modules.keys()].join(',')}`);
  const module59015 = modules.get(59015);
  const loginInfo = codec.unpack('pb_first_week_goal', Buffer.isBuffer(module59015.value) ? module59015.value : rawBinary(module59015));
  assert.equal(Buffer.from(loginInfo.task_award ?? '', 'base64').length, 0);

  game.store.transaction(model => {
    const current = new Map(model.state.modules.value), statistics = current.get(21);
    statistics.value[1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: [{ id: '1', total: '20' }]
    }));
    current.set(21, statistics);
    model.state.modules.value = [...current];
  });

  const claimed = await request(67005, 2, await encodeEtf([1103]));
  assert.equal(claimed.err, undefined);
  const response = codec.unpack('pb_first_week_goal_back', Buffer.from(claimed.data, 'base64'));
  assert.ok(Buffer.from(response.info.task_award ?? '', 'base64').length > 0);
  assert.equal(response.res.changes.find(row => row.tid === '101800').diff_num, '18000');

  const repeated = await request(67005, 3, await encodeEtf([1103]));
  assert.equal(repeated.err.err, 310);
  const gated = await request(67004, 4, await encodeEtf([501]));
  assert.equal(gated.err.err, 5);
});
