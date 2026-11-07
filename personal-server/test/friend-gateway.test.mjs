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
const NOW = Date.UTC(2026, 9, 26, 0, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const ACTOR = 100001;

function profile(level, name) {
  return JSON.stringify(codec.unpack('to_client_role_info', codec.pack('to_client_role_info', {
    level,
    nick_name: Buffer.from(name, 'utf8')
  })));
}

test('FriendCmd 20001-20013 are dispatched over the temporary handshake with real ETF/PB types', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-friend-gateway-'));
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

  for (const [roleId, level, name] of [[100002, 9, 'Peer Two'], [100003, 55, 'Peer Three'], [100004, 75, 'Peer Four']]) {
    game.store.inspect(db => db.prepare('INSERT INTO roles VALUES (?,?,?,?,?)')
      .run(roleId, 1, 1700000000, profile(level, name), JSON.stringify({})));
  }

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
  // An empty protobuf message is omitted from pb_s2c; treat it as zero bytes.
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const decodedLogin = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.ok(decodedLogin[2].value.length > 0);

  const applied = await etfRequest(20001, 2, [100002]);
  assert.equal(applied.err, undefined);
  const applyReply = codec.unpack('res_apply_friends', payloadOf(applied));
  assert.deepEqual(applyReply.friend_list, []);
  assert.deepEqual(applyReply.err_list, []);
  assert.equal(game.store.read() !== undefined, true);
  assert.equal(Number(game.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM friend_applies').get().count)), 1);

  const selfApply = await etfRequest(20001, 3, [ACTOR]);
  assert.deepEqual(codec.unpack('res_apply_friends', payloadOf(selfApply)).err_list, ['5']);

  // The peer's own session writes the inverse application row.
  game.store.inspect(db => db.prepare('INSERT OR IGNORE INTO friend_applies VALUES (?,?,?)')
    .run(ACTOR, 100002, new Date(NOW).toISOString()));
  const agreed = await etfRequest(20003, 4, [100002]);
  const agreeReply = codec.unpack('res_agree_applies', payloadOf(agreed));
  assert.deepEqual(agreeReply.success_list, ['100002']);
  assert.deepEqual(agreeReply.err_list, []);

  const presented = await etfRequest(20007, 5, [100002]);
  const presentReply = codec.unpack('res_friendship_change', payloadOf(presented));
  assert.deepEqual(presentReply.friendship.present_today, ['100002']);
  assert.deepEqual(presentReply.res.changes, []);
  assert.deepEqual(presentReply.friend_list.map(row => row.id), ['100002']);

  const duplicated = await etfRequest(20007, 6, [100002]);
  assert.equal(duplicated.err.err, 310);

  const query = await etfRequest(20009, 7, '100003');
  const queryReply = codec.unpack('res_query_friend_player', payloadOf(query));
  assert.deepEqual(queryReply.player_info_list.map(row => row.role_id), ['100003']);

  const recommend = await etfRequest(20010, 8, []);
  const recommendReply = codec.unpack('res_query_friend_player', payloadOf(recommend));
  assert.deepEqual(recommendReply.player_info_list.map(row => row.role_id), ['100003', '100004']);

  const blacklisted = await etfRequest(20005, 9, [100003]);
  assert.equal(blacklisted.err, undefined);
  assert.equal(payloadOf(blacklisted).length, 0);
  const blacklistReply = await etfRequest(20006, 10, [100003]);
  assert.equal(blacklistReply.err, undefined);

  const report = await etfRequest(20013, 11, [100002, 'spam']);
  assert.equal(report.err, undefined);
  assert.equal(Number(game.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM friend_reports').get().count)), 1);

  const refused = await etfRequest(20004, 12, [100004]);
  assert.equal(refused.err.err, 5);

  const oneKey = await etfRequest(20011, 13, [[100008], []]);
  assert.equal(oneKey.err.err, 5);

  const removed = await etfRequest(20002, 14, [100002]);
  assert.equal(removed.err, undefined);
  assert.equal(payloadOf(removed).length, 0);
  assert.equal(Number(game.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM friend_links').get().count)), 0);

  const unknownRecommendTypes = await etfRequest(20012, 15, [1]);
  const typesReply = codec.unpack('res_query_friend_player', payloadOf(unknownRecommendTypes));
  assert.deepEqual(typesReply.player_info_list, []);
});
