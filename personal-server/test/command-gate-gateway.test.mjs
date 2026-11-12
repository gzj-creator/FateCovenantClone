import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createLocalGame, decodeEtf } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));

function fixture() {
  return {
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9 }).toString('base64'), guides: {}, lineups: null
  };
}

test('gateway denies unopened write commands and empties read commands', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-gate-test-'));
  const statePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(statePath, JSON.stringify(fixture()));
  const rulesPath = path.join(directory, 'gate-rules.json');
  fs.writeFileSync(rulesPath, JSON.stringify({ rules: [
    { type: 636, requires: [1999], access: 'write' },
    { type: 106, requires: [1999], access: 'read' }
  ] }));
  const previous = process.env.FC_COMMAND_GATE_RULES_PATH;
  process.env.FC_COMMAND_GATE_RULES_PATH = rulesPath;
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'), statePath, capturePath,
    activityMode: 'all-open', localWallet: true,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    logger: event => events.push(event)
  });
  t.after(async () => {
    if (previous == null) delete process.env.FC_COMMAND_GATE_RULES_PATH;
    else process.env.FC_COMMAND_GATE_RULES_PATH = previous;
    await game.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  t.after(() => socket.destroy());
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
  const response = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  const login = await decodeEtf(Buffer.from(response.data, 'base64'));
  assert.equal(login[0], 1);

  const read = await request(106, 2, Buffer.alloc(0));
  assert.equal(read.err, undefined);
  assert.equal(Buffer.from(read.data ?? '', 'base64').length, 0);
  const write = await request(636, 3, codec.pack('pb_hero_up_lv_req', { hero_uid: '2020601', cell_index: 4, up_lv_count: 1 }));
  assert.equal(write.err.err, 309);
  assert.equal(events.some(event => event.event === 'fun_open_command_denied' && event.type === 636 && event.access === 'write'), true);
});
