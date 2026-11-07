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
import { readGameTables } from '../config/game-tables.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const NOW = Date.UTC(2026, 9, 26, 0, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);

test('GrowthRoadCmd 69001/69002 use the temporary handshake and login module 53696', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-growth-road-gateway-'));
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
  assert.ok(modules.has(53696), `login module ids: ${[...modules.keys()].join(',')}`);
  const growthModule = modules.get(53696);
  const loginInfo = codec.unpack(
    'pb_growth_road_master',
    Buffer.isBuffer(growthModule.value) ? growthModule.value : rawBinary(growthModule)
  );
  assert.equal(loginInfo.data_list.length, 1);
  assert.equal(Number(loginInfo.data_list[0].version), 1);
  assert.equal(Number(loginInfo.data_list[0].progress_value ?? 0), 0);

  const roleStatistics = [...gameTables.CountStatistics.values()].filter(row => !row.custom_login && Number(row.type) === 0);
  const index = roleStatistics.findIndex(row => Number(row.tid) === 2);
  game.store.transaction(model => {
    const current = new Map(model.state.modules.value), statistics = current.get(21);
    statistics.value[index + 1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: [{ id: '23005', total: '1' }]
    }));
    current.set(21, statistics);
    model.state.modules.value = [...current];
  });

  const claimed = await request(69002, 2, await encodeEtf([1001]));
  assert.equal(claimed.err, undefined);
  const response = codec.unpack('pb_growth_road_back', Buffer.from(claimed.data, 'base64'));
  assert.equal(Number(response.info.progress_value), 20);
  assert.ok(Buffer.from(response.info.task_award ?? '', 'base64').length > 0);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '100');

  const repeated = await request(69002, 3, await encodeEtf([1001]));
  assert.equal(repeated.err.err, 310);
  const gated = await request(69001, 4, await encodeEtf([101]));
  assert.equal(gated.err.err, 5);
  const unknown = await request(69002, 5, await encodeEtf([999999]));
  assert.equal(unknown.err.err, 1);
});
