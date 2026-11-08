import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const NOW = Date.UTC(2026, 9, 26, 0, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const ACTOR = 100001;

function profile(level, name) {
  return JSON.stringify(codec.unpack('to_client_role_info', codec.pack('to_client_role_info', {
    level, nick_name: Buffer.from(name, 'utf8')
  })));
}

test('guild society and community commands dispatch over the temporary handshake', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-guild-gateway-'));
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

  game.store.inspect(db => db.prepare('INSERT INTO roles VALUES (?,?,?,?,?)')
    .run(100002, 1, 1700000000, profile(12, 'Peer Two'), JSON.stringify({})));
  game.store.inspect(db => db.prepare('INSERT INTO guild_directory (guild_id,name,badge,level,active,audit_type,level_limit,power_limit,leader_role_id,member_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(900002, 'Rival', 1, 2, 7, 1, 1, 0, 200002, 4, '2026-01-01', '2026-01-01'));

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
  const pbRequest = async (type, seq, schema, value) => request(type, seq, codec.pack(schema, value));
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const decodedLogin = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.ok(decodedLogin[2].value.length > 0);

  const search = await etfRequest(21012, 2, ['name', 'Riv']);
  assert.equal(search.err, undefined);
  assert.deepEqual(codec.unpack('pb_res_recommends', payloadOf(search)).guild_infos.map(row => row.name), ['Rival']);

  // The captured login already seeds the actor as president of guild 900001.
  const contributed = await etfRequest(21016, 3, []);
  assert.equal(contributed.err, undefined);
  const snapshot = codec.unpack('pb_res_guild_info', payloadOf(contributed));
  assert.equal(snapshot.guild.name, 'Local Covenant');
  assert.ok(snapshot.contribute_info.count_info.count_list[0] >= 1);

  const renamed = await pbRequest(21021, 4, 'pb_guild_rename_req', { name: 'Renamed' });
  assert.equal(renamed.err, undefined);
  assert.equal(codec.unpack('pb_guild_rename_back', payloadOf(renamed)).name, 'Renamed');
  const stored = codec.unpack('pb_res_guild_login', rawBinary(new Map(game.store.state().modules.value).get(24)));
  assert.equal(stored.guild.name, 'Renamed');

  const logs = await etfRequest(21019, 5, []);
  assert.equal(logs.err, undefined);
  assert.ok(codec.unpack('pb_guild_log_data', Buffer.from(payloadOf(logs)).subarray(6)).log_list.length >= 1);

  const active = await etfRequest(85502, 6, []);
  assert.equal(active.err, undefined);
  assert.ok(Number(codec.unpack('pb_guild_active_info', payloadOf(active)).active_refresh_day) >= 1);

  // Fail closed: 171 needs an unmapped GuildDataTable block and 21001 is a duplicate.
  const gapped = await pbRequest(171, 7, 'pb_function_cache_req', {});
  assert.equal(gapped.err.err, 5);
  const duplicate = await pbRequest(21001, 8, 'pb_req_create_guild', { name: 'New' });
  assert.equal(duplicate.err.err, 310);

  const supported = await etfRequest(46001, 9, [1, 100002]);
  assert.equal(supported.err, undefined);
  assert.equal(String(codec.unpack('support_to_client', payloadOf(supported)).info.support_list[0].support[0].role_id), '100002');

  const fetchJoin = await etfRequest(83108, 10, []);
  assert.equal(fetchJoin.err, undefined);
});
