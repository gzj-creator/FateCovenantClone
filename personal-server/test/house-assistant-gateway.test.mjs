import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const NOW = Date.parse('2026-11-08T08:00:00.000Z');

function moduleBytes(login, moduleId) {
  const entry = login[2].value.find(value => Number(value[0]) === moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  const module = entry[1];
  if (Buffer.isBuffer(module)) return module;
  if (Array.isArray(module)) {
    const slot = module[0];
    return Buffer.from(Buffer.isBuffer(slot) ? slot : slot.value);
  }
  if (Array.isArray(module.value)) return Buffer.from(module.value[0].value);
  return Buffer.from(module.value ?? module);
}

function grantHouseAssistant(store, tid) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(148);
    const bytes = rawBinary(Array.isArray(module.value) ? module.value[0] : module);
    const value = codec.unpack('pb_house_assistant_info', bytes);
    value.res ??= [];
    if (!value.res.some(row => Number(row.tid) === tid)) value.res.push({ tid: String(tid), num: '1' });
    modules.set(148, { value: [serializedBinary(codec.pack('pb_house_assistant_info', value))], improper: false });
    model.state.modules.value = [...modules];
  });
}

test('gateway implements 88201-88204 over real framing without falling back to LOCAL_NOT_IMPLEMENTED', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-house-assistant-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => NOW,
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  grantHouseAssistant(game.store, 10063200);

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

  const loginResponse = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  assert.equal(loginResponse.err, undefined);
  const login = await decodeEtf(Buffer.from(loginResponse.data, 'base64'));
  const loginHouse = codec.unpack('pb_house_assistant_info', moduleBytes(login, 148));
  assert.equal(loginHouse.res.some(row => Number(row.tid) === 10063200), true);
  assert.equal(loginHouse.res.some(row => Number(row.tid) === 20013200), true);

  let response = await request(88202, 2, codec.pack('pb_house_assistant_use_req_list', {
    req: [{ scene_tid: 1, assistant_tid: 10063200 }]
  }));
  assert.equal(response.err, undefined);
  assert.equal(Number(codec.unpack('pb_house_assistant_use_rsp', Buffer.from(response.data, 'base64')).use[0].use_assistant), 10063200);

  response = await request(88201, 3, codec.pack('pb_house_assistant_use_req_list', {
    req: [{ scene_tid: 1, assistant_tid: 20013200 }]
  }));
  assert.equal(response.err, undefined);
  assert.equal(Number(codec.unpack('pb_house_assistant_use_rsp', Buffer.from(response.data, 'base64')).use[0].use_bg), 20013200);

  response = await request(88203, 4, codec.pack('pb_house_assistant_trial_req', {
    trial_id_list: [1, 2],
    req: [
      { scene_tid: 1, assistant_tid: 10163200 },
      { scene_tid: 1, assistant_tid: 20133200 }
    ]
  }));
  assert.equal(response.err, undefined);
  let info = codec.unpack('pb_house_assistant_trial_rsp', Buffer.from(response.data, 'base64')).info;
  assert.deepEqual(info.trial.map(row => Number(row.id)), [1, 2]);
  assert.equal(Number(info.use[0].use_assistant), 10163200);
  assert.equal(Number(info.use[0].use_bg), 20133200);

  response = await request(88204, 5, codec.pack('pb_house_assistant_trial_cancel_req', {
    trial_id_list: [1, 2]
  }));
  assert.equal(response.err, undefined);
  info = codec.unpack('pb_house_assistant_trial_rsp', Buffer.from(response.data, 'base64')).info;
  assert.deepEqual(info.trial, []);
  assert.equal(Number(info.use[0].use_assistant), 10063200);
  assert.equal(Number(info.use[0].use_bg), 20013200);

  assert.equal(events.some(event => event.event === 'unsupported_command' && [88201, 88202, 88203, 88204].includes(event.type)), false);
  assert.deepEqual(events.filter(event => event.event === 'house_assistant_committed').map(event => event.type), [88202, 88201, 88203, 88204]);
});
