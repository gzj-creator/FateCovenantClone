import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createMonthPermitService } from '../game/month-permit-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const ACT_ID = 1004012;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function monthPermitInfo(store) {
  const moduleValue = new Map(store.state().modules.value).get(183);
  for (const element of moduleValue.value) {
    const login = codec.unpack('pb_act_role_login', rawBinary(element));
    for (const entry of login.data_list ?? []) {
      if (typeof entry.module_login_data !== 'string') continue;
      const wrapped = Buffer.from(entry.module_login_data, 'base64');
      if (wrapped.length < 6 || wrapped[0] !== 0x83 || wrapped[1] !== 0x6d) continue;
      const message = codec.unpack('pb_month_permit_login_back', wrapped.subarray(6));
      const info = message.month_permit_data?.month_permit_list?.find(row => Number(row.id) === ACT_ID);
      if (info) return info;
    }
  }
  throw new Error('Active month permit fixture not found');
}

async function gatewaySetup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-month-permit-task-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    activityMode: 'all-open',
    verifySession: (uid, code) => uid === 'permit-user' && code === 'permit-session',
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const frame of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(frame);
      else queue.push(frame);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(frame => { clearTimeout(timer); resolve(frame); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'permit-user', verify_code: 'permit-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginPayload = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.ok(new Map(loginPayload[2].value).has(183));

  return { game, events, request };
}

test('gateway routes 105804 over real TCP and returns a decodable task claim response', async t => {
  const e = await gatewaySetup(t);

  const response = await e.request(105804, 3, codec.pack('pb_month_permit_task_req', { activity_id: ACT_ID, task_id_list: [101] }));
  assert.equal(response.err, undefined);
  assert.ok(response.data);

  const value = codec.unpack('pb_month_permit_task_back', Buffer.from(response.data, 'base64'));
  assert.equal(value.month_permit_info.id, String(ACT_ID));
  assert.ok(value.month_permit_info.task_get.length > 0);
  assert.ok(value.res.changes.length >= 0);

  assert.ok(e.events.some(event => event.event === 'month_permit_task_reward_committed' && event.seq === 3));
});
