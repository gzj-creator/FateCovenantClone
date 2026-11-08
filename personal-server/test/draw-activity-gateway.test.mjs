import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const openedAt = 1792789200;

test('draw activities complete over temporary TCP and persist against SQLite', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-draw-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: openedAt,
    now: () => (openedAt + 3600) * 1000,
    random: () => 0.5
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  game.store.transaction(model => grantResources(model, [[820202, 50]], tables));

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

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  let response = await request(104501, 2, codec.pack('pb_request_thousand_draw', { type: 1 }));
  assert.equal(response.err, undefined);
  const thousand = codec.unpack('pb_response_thousand_draw', Buffer.from(response.data, 'base64'));
  assert.equal(thousand.role_info.round, '1');
  assert.ok(thousand.role_info.type_info_list[0].award_list.length > 0);

  response = await request(104502, 3, codec.pack('pb_request_thousand_award', { type: 1 }));
  assert.equal(response.err, undefined);
  const claimedThousand = codec.unpack('pb_response_thousand_award', Buffer.from(response.data, 'base64'));
  assert.equal(claimedThousand.res.changes.length, 1);

  response = await request(109101, 4, codec.pack('pb_flop_card_act_flop_req', { activity_id: 1, flop_type: 1 }));
  assert.equal(response.err, undefined);
  const flop = codec.unpack('pb_flop_card_act_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(flop.act_info.total_count, 1);
  assert.equal(flop.res.changes.find(change => change.tid === '820202').diff_num, '-3');

  response = await request(109102, 5, codec.pack('pb_flop_card_act_get_reward_req', { activity_id: 1 }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_flop_card_act_rsp', Buffer.from(response.data, 'base64')).res.changes.length > 0);

  response = await request(105502, 6, codec.pack('pb_cashback_draw_get_times_req', { activity_id: 1 }));
  assert.equal(response.err?.err, 5);
  assert.equal(game.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM draw_activity_state WHERE module='flop_card'").get().n), 1);
});
