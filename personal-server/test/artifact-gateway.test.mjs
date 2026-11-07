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
const NOW = Date.UTC(2026, 10, 8, 4, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const LOW_ARTIFACT = 200110;
const LOW_PEER = 200210;
const FORGE_ARTIFACT = 300610;
const UR_ARTIFACT = 400110;
const CHIP_LOW = 423002;
const CHIP_UR = 7001002;
const UR_STONE = 339002;
const FORGE_LOW = 13002;
const BREAK_ITEM = 392002;
const FLY_UP_ITEM = 647002;

function artifactRow(tid, overrides = {}) {
  return {
    tid: String(tid), num: 1, star: 0, star_node: 0, forge_list: [0, 0, 0], stage: 0,
    quality: tid === UR_ARTIFACT ? 60 : 40, level: 0, break_level: 0,
    is_fly_up: false, artifact_skin: 0, ...overrides
  };
}

function seedArtifacts(game) {
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(50);
    const bytes = rawBinary(module.value[0]);
    const info = bytes.length
      ? codec.unpack('pb_artifact_info', bytes)
      : { artifact_list: [], skill_list: [], lineup_list: [], fetter_list: [], inject_list: [], handbook_list: [] };
    info.artifact_list = [
      artifactRow(LOW_ARTIFACT, { level: 20 }),
      artifactRow(LOW_PEER, { quality: 40 }),
      artifactRow(FORGE_ARTIFACT, { quality: 50 }),
      artifactRow(UR_ARTIFACT, { star: 6 })
    ];
    module.value[0] = serializedBinary(codec.pack('pb_artifact_info', info));
    model.state.modules.value = [...modules];
    const groups = modules.get(6).value;
    while (groups.length <= 0) groups.push({ value: [], improper: false });
    const add = (tid, num) => {
      const entry = groups[0].value.length;
      groups[0].value.push(serializedBinary(Buffer.alloc(0)));
      model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, 0, entry] });
    };
    for (const [tid, num] of [[CHIP_LOW, 1000], [CHIP_UR, 1000], [UR_STONE, 5], [FORGE_LOW, 100], [BREAK_ITEM, 100], [FLY_UP_ITEM, 20]]) add(tid, num);
  });
}

function loginModule(infoModules, moduleId) {
  const list = Array.isArray(infoModules) ? infoModules : infoModules.value;
  const entry = list.find(item => Number((Array.isArray(item) ? item : item.value)[0]) === moduleId);
  assert.ok(entry, 'login container carries module ' + moduleId);
  const fields = Array.isArray(entry) ? entry : entry.value;
  const slotContainer = fields[1];
  const slots = Array.isArray(slotContainer) ? slotContainer : slotContainer.value;
  const slot = slots[0];
  if (Buffer.isBuffer(slot)) return slot;
  if (Buffer.isBuffer(slot?.value)) return slot.value;
  return rawBinary(slot);
}

test('ArtifactCmd 37060/37061/37069/37071/37074 are dispatched over the temporary handshake', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-artifact-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    now: () => NOW
  });
  seedArtifacts(game);
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
  const etfRequest = async (type, seq, value) => request(type, seq, await encodeEtf(value));
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginModules = (await decodeEtf(payloadOf(login)))[2];
  const artifactLogin = codec.unpack('pb_artifact_info', loginModule(loginModules, 50));
  assert.deepEqual(artifactLogin.artifact_list.map(row => Number(row.tid)).sort((a, b) => a - b), [LOW_ARTIFACT, LOW_PEER, FORGE_ARTIFACT, UR_ARTIFACT].sort((a, b) => a - b));
  assert.equal(Number(artifactLogin.artifact_list.find(row => Number(row.tid) === UR_ARTIFACT).star), 6);

  const starUp = await request(37060, 2, codec.pack('pb_artifact_star_up_req', { tid: LOW_ARTIFACT, times: 6 }));
  assert.equal(starUp.err, undefined);
  const starBack = codec.unpack('pb_artifact_back', payloadOf(starUp));
  assert.equal(Number(starBack.artifact.star), 1);
  assert.deepEqual(starBack.res.changes.map(change => [change.tid, change.diff_num]), [[String(CHIP_LOW), '-60']]);

  const forged = await request(37061, 3, codec.pack('pb_req_artifact_forge', {
    tid: String(FORGE_ARTIFACT), forge_list: [{ type: 1, forge_count: 62 }]
  }));
  assert.equal(forged.err, undefined);
  assert.equal(Number(codec.unpack('pb_artifact_back', payloadOf(forged)).artifact.forge_list[0]), 62);

  const fetter = await etfRequest(37069, 4, LOW_ARTIFACT);
  assert.equal(fetter.err, undefined);
  assert.ok(codec.unpack('pb_artifact_fetter', payloadOf(fetter)).fetter_list.includes(1));

  const breakthrough = await etfRequest(37071, 5, LOW_ARTIFACT);
  assert.equal(breakthrough.err, undefined);
  assert.equal(Number(codec.unpack('pb_artifact_break_level_up_rsp', payloadOf(breakthrough)).artifact.break_level), 1);

  const flyUp = await etfRequest(37074, 6, UR_ARTIFACT);
  assert.equal(flyUp.err, undefined);
  assert.equal(codec.unpack('pb_artifact_back', payloadOf(flyUp)).artifact.is_fly_up, true);

  const quality = await etfRequest(37062, 7, LOW_ARTIFACT);
  assert.equal(Number(quality.err?.err ?? quality.err), 5);

  const stored = game.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(50);
    return codec.unpack('pb_artifact_info', rawBinary(module.value[0]));
  });
  assert.equal(Number(stored.artifact_list.find(row => Number(row.tid) === LOW_ARTIFACT).star), 1);
  const chip = game.store.transaction(model => model.resources.get(String(CHIP_LOW))?.num);
  assert.equal(Number(chip), 940);
});