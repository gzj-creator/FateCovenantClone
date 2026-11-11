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
const NOW = Date.UTC(2026, 10, 7, 4, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const ACTOR = 100001;
const PEER = 10047;
const WORLD = 10100001;

test('MsgCmd 10501-10511 are dispatched over the temporary handshake with real ETF/PB types', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-message-gateway-'));
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
  const etfRequest = async (type, seq, value) => request(type, seq, await encodeEtf(value));
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  assert.ok((await decodeEtf(payloadOf(login)))[2].value.length > 0);

  const joined = await etfRequest(10507, 2, [1, []]);
  assert.equal(joined.err, undefined);
  const joinedBody = codec.unpack('pb_msg_range_list_with_role_info', payloadOf(joined));
  assert.equal(joinedBody.channel_id, String(WORLD));
  assert.deepEqual(joinedBody.msg_list, []);

  const sent = await request(10501, 3, codec.pack('pb_req_send_msg', {
    channel_id: String(WORLD),
    content_bin: Buffer.from('gateway hello', 'utf8')
  }));
  assert.equal(sent.err, undefined);
  assert.equal(payloadOf(sent).length, 0);

  const range = await etfRequest(10506, 4, [WORLD, 1, 10]);
  assert.equal(range.err, undefined);
  const rangeBody = codec.unpack('pb_msg_range_list_with_role_info', payloadOf(range));
  assert.equal(rangeBody.msg_list.length, 1);
  assert.equal(Buffer.from(rangeBody.msg_list[0].content, 'base64').toString('utf8'), 'gateway hello');
  assert.equal(rangeBody.role_info_list[0].role_id, String(ACTOR));

  const info = await etfRequest(10504, 5, ACTOR);
  assert.equal(info.err, undefined);
  assert.equal(codec.unpack('pb_msg_role_info', payloadOf(info)).role_id, String(ACTOR));

  const infos = await etfRequest(10505, 6, [ACTOR, PEER]);
  assert.equal(infos.err, undefined);
  assert.deepEqual(
    codec.unpack('pb_msg_role_info_list', payloadOf(infos)).role_info_list.map(row => row.role_id),
    [String(ACTOR)]
  );

  const left = await etfRequest(10503, 7, WORLD);
  assert.equal(left.err, undefined);
  assert.equal(payloadOf(left).length, 0);

  const reentered = await etfRequest(10502, 8, WORLD);
  assert.equal(reentered.err, undefined);
  assert.equal(codec.unpack('pb_msg_range_list_with_role_info', payloadOf(reentered)).msg_list.length, 1);

  const privateJoined = await etfRequest(10507, 9, [3, [PEER]]);
  assert.equal(privateJoined.err, undefined);
  assert.equal(codec.unpack('pb_msg_range_list_with_role_info', payloadOf(privateJoined)).channel_id, '10310047');

  const localServer = await etfRequest(10507, 13, [12, []]);
  assert.equal(localServer.err, undefined);
  assert.equal(codec.unpack('pb_msg_range_list_with_role_info', payloadOf(localServer)).channel_id, '11200001');

  const logged = await request(10510, 10, codec.pack('pb_req_send_msg', {
    channel_id: String(WORLD),
    content_bin: Buffer.from('log only', 'utf8')
  }));
  assert.equal(logged.err, undefined);
  assert.equal(payloadOf(logged).length, 0);

  const cross = await etfRequest(10509, 11, []);
  assert.equal(Number(cross.err?.err ?? cross.err), 5);
  const tips = await etfRequest(10511, 12, [ACTOR]);
  assert.equal(Number(tips.err?.err ?? tips.err), 5);

  const stored = game.store.inspect(db => ({
    history: Number(db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(WORLD).count),
    logs: Number(db.prepare('SELECT COUNT(*) AS count FROM message_logs').get().count),
    members: db.prepare('SELECT channel_id FROM message_members WHERE role_id=? ORDER BY channel_id').all(ACTOR).map(row => Number(row.channel_id))
  }));
  assert.equal(stored.history, 1);
  assert.equal(stored.logs, 1);
  assert.deepEqual(stored.members, [WORLD, 10310047, 11200001]);
  assert.equal(Number(game.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(10310047).count)), 0);
});
