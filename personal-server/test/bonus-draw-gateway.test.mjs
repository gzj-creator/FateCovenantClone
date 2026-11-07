import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const NOW = Date.UTC(2026, 10, 8, 4, 0, 0);
const COST = 660002;

function connect(address) {
  const socket = net.connect(address.port, '127.0.0.1');
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
  return { socket, next, send: payload => socket.write(encodeGameFrame(payload)) };
}

async function handshake(session) {
  session.send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await session.next()), key = 'ClientKey1234567';
  session.send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
}

test('BonusDrawCmd 101901/101902/101904 run over the real handshake and survive a reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-bonus-draw-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const boot = () => createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    now: () => NOW,
    random: () => 0.999999
  });
  let game = boot(), session;
  t.after(async () => { session?.socket.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  game.store.transaction(model => grantResources(model, [[COST, 10]], game.tables));
  const address = await game.listen(0);
  session = connect(address);
  await once(session.socket, 'connect');
  await handshake(session);
  const request = async (type, seq, data) => {
    session.send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await session.next());
  };
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const draw = await request(101901, 2, codec.pack('pb_bonus_draw_req', { id: 1, num: 2, stop: false }));
  assert.equal(draw.err, undefined);
  const drawn = codec.unpack('pb_bonus_draw_back', payloadOf(draw));
  assert.equal(drawn.bonus_draw.id, 1);
  assert.equal(drawn.bonus_draw.cur_pool, 1);
  assert.deepEqual(drawn.bonus_draw.pool_list[0].award_list, ['8', '7']);
  assert.equal(drawn.res.changes.find(row => row.tid === String(COST)).diff_num, '-2');

  const switched = await request(101902, 3, await encodeEtf(1));
  assert.equal(switched.err, undefined);
  const switchValue = await decodeEtf(payloadOf(switched));
  const switchMap = switchValue.value;
  const entry = [...switchMap.entries()].find(([key]) => String(key.value) === 'cur_pool');
  assert.ok(entry, 'switch reply map is missing cur_pool');
  assert.equal(Number(entry[1].value ?? entry[1]), 2);

  const chosen = await request(101904, 4, codec.pack('pb_bonus_draw_choose_pool', { version: 1, pool_id: 5 }));
  assert.equal(chosen.err, undefined);
  const chosenBody = codec.unpack('pb_bonus_draw', payloadOf(chosen));
  assert.equal(chosenBody.id, 1);
  assert.equal(chosenBody.cur_pool, 5);

  const duplicate = await request(101904, 5, codec.pack('pb_bonus_draw_choose_pool', { version: 1, pool_id: 5 }));
  assert.equal(Number(duplicate.err?.err), 310);

  session.socket.destroy();
  await game.close();
  game = boot();
  const reopened = await game.listen(0);
  session = connect(reopened);
  await once(session.socket, 'connect');
  await handshake(session);
  const relogin = async (type, seq, data) => {
    session.send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await session.next());
  };
  assert.equal((await relogin(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }))).err, undefined);
  const afterReopen = await relogin(101901, 2, codec.pack('pb_bonus_draw_req', { id: 1, num: 1, stop: false }));
  assert.equal(afterReopen.err, undefined);
  const reopenedBody = codec.unpack('pb_bonus_draw_back', Buffer.from(afterReopen.data ?? '', 'base64'));
  assert.equal(reopenedBody.bonus_draw.cur_pool, 5);
  assert.equal(reopenedBody.bonus_draw.pool_list[4].award_list.length, 1);
  assert.equal(reopenedBody.bonus_draw.pool_list[0].award_list.length, 2);
});

