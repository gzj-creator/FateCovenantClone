import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const NOW = Date.UTC(2026, 10, 7, 4, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const ACTOR = 10046;
const PEER = 10047;
const WORLD = 10100001;
const PRIVATE = 10310047;

test('ChatCmd 11000, 11002, 11010, 11012 and 11014 are dispatched over the temporary handshake', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-chat-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  // The production-shaped role ids are five digits (Uid.Compose keeps the
  // private channel tail below 100000). Seed a 10046 actor before opening the
  // gateway so the peer row 10047 does not become SELECT * FROM roles LIMIT 1.
  const seeding = createGameStore({
    databasePath,
    seed: () => createSeed(codec, { roleId: ACTOR }),
    codec,
    serverOpenedAt: OPENED_AT
  });
  seeding.close();
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    now: () => NOW
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  // Private chat validates that the peer role exists before writing history.
  game.store.inspect(db => db.prepare('INSERT INTO roles VALUES (?,?,?,?,?)').run(
    PEER, 1, 1700000000,
    JSON.stringify(codec.unpack('to_client_role_info', codec.pack('to_client_role_info', {
      level: 9, nick_name: Buffer.from('Peer Two', 'utf8')
    }))),
    JSON.stringify({})
  ));

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const nextFrame = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await nextFrame()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));

  const pushes = [];
  const nextPush = async () => {
    if (pushes.length) return pushes.shift();
    for (;;) {
      const message = codec.unpack('pb_s2c', await nextFrame());
      if (Number.isSafeInteger(Number(message.type))) return message;
    }
  };
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const message = codec.unpack('pb_s2c', await nextFrame());
      if (message.seq === seq) return message;
      if (Number.isSafeInteger(Number(message.type))) pushes.push(message);
    }
  };
  const etfRequest = async (type, seq, value) => request(type, seq, await encodeEtf(value));
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');
  const errorCode = reply => Number(reply.err?.err ?? reply.err);

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const joinedWorld = await etfRequest(10507, 2, [1, []]);
  assert.equal(joinedWorld.err, undefined);
  assert.equal(codec.unpack('pb_msg_range_list_with_role_info', payloadOf(joinedWorld)).channel_id, String(WORLD));

  const sentWorld = await request(11000, 3, codec.pack('pb_chat_msg_content', {
    text_content: 'gateway chat', msg_type: 1, link_params: [], be_reply_content: ''
  }));
  assert.equal(sentWorld.err, undefined);
  assert.equal(payloadOf(sentWorld).length, 0);
  const worldPush = await nextPush();
  assert.equal(Number(worldPush.type), 1400);
  const worldBody = codec.unpack('pb_res_new_msg', payloadOf(worldPush));
  assert.equal(worldBody.channel_id, String(WORLD));
  assert.equal(worldBody.msg.sender, String(ACTOR));
  assert.equal(Number(worldBody.msg.idx), 1);
  assert.equal(Number(worldBody.msg.time), Math.floor(NOW / 1000));
  assert.equal(Number(worldBody.msg.type), 1);
  const worldContent = codec.unpack('pb_chat_msg_content', Buffer.from(worldBody.msg.content, 'base64'));
  assert.equal(worldContent.text_content, 'gateway chat');

  const joinedPrivate = await etfRequest(10507, 4, [3, [PEER]]);
  assert.equal(joinedPrivate.err, undefined);
  assert.equal(codec.unpack('pb_msg_range_list_with_role_info', payloadOf(joinedPrivate)).channel_id, String(PRIVATE));

  const sentPrivate = await request(11002, 5, codec.pack('pb_req_send_msg_to_role', {
    target_role_id: String(PEER),
    content: { text_content: 'gateway private', msg_type: 0, link_params: [], be_reply_content: '' }
  }));
  assert.equal(sentPrivate.err, undefined);
  const privatePush = await nextPush();
  assert.equal(Number(privatePush.type), 1400);
  const privateBody = codec.unpack('pb_res_new_msg', payloadOf(privatePush));
  assert.equal(privateBody.channel_id, String(PRIVATE));
  assert.equal(privateBody.msg.sender, String(ACTOR));
  const privateExtra = await decodeEtf(Buffer.from(privateBody.extra_bin, 'base64'));
  assert.equal(Number(privateExtra), ACTOR);

  const settingBlob = await encodeEtf([1, 2, 3]);
  const changed = await request(11010, 6, settingBlob);
  assert.equal(changed.err, undefined);
  assert.equal(payloadOf(changed).length, 0);
  const storedSetting = game.store.inspect(db => db.prepare('SELECT settings_blob FROM chat_settings').get());
  assert.equal(Buffer.from(storedSetting.settings_blob).equals(settingBlob), true);

  const removed = await request(11012, 7, await encodeEtf(PEER));
  assert.equal(removed.err, undefined);
  const memberships = game.store.inspect(db => db.prepare('SELECT channel_id FROM message_members WHERE role_id=? ORDER BY channel_id').all(ACTOR).map(row => Number(row.channel_id)));
  assert.deepEqual(memberships, [WORLD]);

  const like = await request(11014, 8, codec.pack('pb_msg_like_req', { channel_id: String(WORLD), index: '1' }));
  assert.equal(errorCode(like), 5);
  const guild = await request(11001, 9, codec.pack('pb_chat_msg_content', {
    text_content: 'guild chat', link_params: [], be_reply_content: ''
  }));
  assert.equal(errorCode(guild), 5);

  const stored = game.store.inspect(db => ({
    world: Number(db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(WORLD).count),
    private: Number(db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(PRIVATE).count)
  }));
  assert.equal(stored.world, 1);
  assert.equal(stored.private, 1);
});
