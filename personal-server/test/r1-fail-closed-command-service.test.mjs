import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { createR1FailClosedCommandService, R1_FAIL_CLOSED_COMMAND_TYPES } from '../game/r1-fail-closed-command-service.mjs';

const codec = createGameCodec();

test('all 25 unresolved R1 commands fail closed before any state change', () => {
  const logged = [];
  const service = createR1FailClosedCommandService({ logger: event => logged.push(event) });
  assert.equal(R1_FAIL_CLOSED_COMMAND_TYPES.length, 25);
  assert.equal(new Set(R1_FAIL_CLOSED_COMMAND_TYPES).size, 25);
  for (const type of R1_FAIL_CLOSED_COMMAND_TYPES) {
    assert.equal(service.supports(type), true);
    assert.throws(
      () => service.execute(type, Buffer.from([0xff])),
      error => error.code === 5 && error.message.startsWith(`R1 command ${type} is fail-closed:`)
    );
  }
  assert.equal(logged.length, 25);
  assert.ok(logged.every(event => event.event === 'r1_command_refused'));
  for (const type of [69006, 69007, 69101, 69102, 85804, 88957, 91503]) assert.equal(service.supports(type), false);
});

test('gateway returns an explicit R1 business refusal and no state change for every unresolved type', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-r1-fail-closed-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => 1792792800000,
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const response = codec.unpack('pb_s2c', await next());
      if (response.seq === seq) return response;
    }
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const stateBefore = JSON.stringify(game.store.read());
  const requested = [...R1_FAIL_CLOSED_COMMAND_TYPES].sort((left, right) => left - right);
  for (const [offset, type] of requested.entries()) {
    const response = await request(type, offset + 2, Buffer.from([0xff]));
    assert.equal(response.err.err, 5, `type ${type} must return business error 5`);
    assert.equal(response.data ?? '', '', `type ${type} must not return a business payload`);
  }
  assert.equal(JSON.stringify(game.store.read()), stateBefore, 'fail-closed commands must not mutate persisted state');
  assert.equal(events.some(event => event.event === 'unsupported_command' && requested.includes(Number(event.type))), false);
  assert.deepEqual(
    [...new Set(events.filter(event => event.event === 'r1_command_refused').map(event => Number(event.type)))].sort((a, b) => a - b),
    requested
  );
});
