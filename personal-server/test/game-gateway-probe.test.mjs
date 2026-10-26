import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import { createCipheriv, createDecipheriv } from 'node:crypto';
import { once } from 'node:events';
import { setImmediate as nextTick } from 'node:timers/promises';
import protobuf from 'protobufjs';
import test from 'node:test';
import { GameFrameDecoder, encodeGameFrame } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE } from '../game-handshake.mjs';
import { createGameGatewayProbe } from '../game-gateway-probe.mjs';

const profile = LOCAL_AES_PROFILE;
const expectedApplicationVersion = '1.55.090365';
const flags = { encryptC2S: false, encryptS2C: false, signature: false };
const config = { profile, expectedApplicationVersion, flags };
const testRoot = new protobuf.Root();
for (const name of ['channel_push.db.proto', 'login.net.proto', 'net.net.proto']) {
  protobuf.parse(fs.readFileSync(new URL('../../analysis/reports/private-client-16448/lua-bundles/login-protos/' + name, import.meta.url), 'utf8'), testRoot, { keepCase: true });
}
testRoot.resolveAll();

async function openSocket(address) {
  const socket = net.createConnection({ host: address.host, port: address.port });
  socket.on('error', () => {});
  socket.setNoDelay(true);
  await once(socket, 'connect');
  return socket;
}

function firstFrame(socket) {
  const decoder = new GameFrameDecoder();
  return new Promise((resolve, reject) => {
    const onClose = () => { cleanup(); reject(new Error('Socket closed before challenge')); };
    const onData = chunk => {
      try {
        const frames = decoder.push(chunk);
        if (frames.length) { cleanup(); resolve(frames[0]); }
      } catch (error) { cleanup(); reject(error); }
    };
    function cleanup() { socket.off('data', onData); socket.off('close', onClose); }
    socket.on('data', onData);
    socket.once('close', onClose);
  });
}

async function writeFragments(socket, bytes) {
  for (const byte of bytes) {
    socket.write(Buffer.from([byte]));
    await nextTick();
  }
}

function replyFor(challenge) {
  assert.equal(challenge.length, 99);
  const decipher = createDecipheriv('aes-128-cbc', challenge.subarray(0, 16), Buffer.from(HANDSHAKE_FIXED_IV));
  assert.deepEqual(Buffer.concat([decipher.update(challenge.subarray(16, 48)), decipher.final()]), challenge.subarray(48, 64));
  const clientKey = 'ClientKey1234567';
  const cipher = createCipheriv('aes-128-cbc', Buffer.from(clientKey), Buffer.from(HANDSHAKE_FIXED_IV));
  const early = cipher.update(challenge.subarray(64, 80));
  cipher.final();
  return Buffer.concat([Buffer.from(clientKey), early, challenge.subarray(96, 99), Buffer.from(expectedApplicationVersion)]);
}

function loginPacket() {
  const type = testRoot.lookupType('login');
  const data = type.encode(type.create({ channel_id: 'local', channel_uid: 'secret-user-id', verify_code: 'secret-token',
    server_id: 1, device: { device_label: 'secret-device-label' } })).finish();
  const outer = testRoot.lookupType('pb_c2s');
  return Buffer.from(outer.encode(outer.create({ seq: 1, type: 909103, data, time_ms: 12 })).finish());
}

async function acceptHandshake(socket) {
  const challengePromise = firstFrame(socket);
  socket.write(encodeGameFrame(Buffer.from('verify')));
  socket.write(encodeGameFrame(replyFor(await challengePromise)));
}

test('probe handles fragmented handshake plus coalesced reply/login, captures redacted protobuf then closes', { timeout: 5000 }, async () => {
  const events = [];
  const probe = createGameGatewayProbe({ ...config, logger: event => events.push(event) });
  const address = await probe.listen(0);
  const socket = await openSocket(address);
  try {
    const challengePromise = firstFrame(socket);
    await writeFragments(socket, encodeGameFrame(Buffer.from('verify')));
    const reply = encodeGameFrame(replyFor(await challengePromise));
    await writeFragments(socket, reply.subarray(0, reply.length - 1));
    const closed = once(socket, 'close');
    socket.end(Buffer.concat([reply.subarray(reply.length - 1), encodeGameFrame(loginPacket())]));
    await closed;
    assert(events.some(event => event.event === 'gateway_handshake_reply' && event.status === 'matched_local_profile'));
    const login = events.find(event => event.event === 'gateway_login_sdk_capture');
    assert.equal(login.seq, 1);
    assert.equal(login.type, 909103);
    assert.equal(login.status, 'protobuf_decoded_no_login_response');
    assert(events.some(event => event.event === 'gateway_probe_stop' && event.reason === 'login_sdk_captured_no_response'));
    const log = JSON.stringify(events);
    for (const secret of ['secret-user-id', 'secret-token', 'secret-device-label', 'ClientKey1234567']) assert.equal(log.includes(secret), false);
  } finally { socket.destroy(); await probe.close(); }
});

test('invalid client authentication closes before accepting any application payload', { timeout: 5000 }, async () => {
  const events = [];
  const probe = createGameGatewayProbe({ ...config, logger: event => events.push(event) });
  const address = await probe.listen(0);
  const socket = await openSocket(address);
  try {
    const challengePromise = firstFrame(socket);
    socket.write(encodeGameFrame(Buffer.from('verify')));
    const reply = replyFor(await challengePromise);
    reply[16] ^= 1;
    const closed = once(socket, 'close');
    socket.end(Buffer.concat([encodeGameFrame(reply), encodeGameFrame(loginPacket())]));
    await closed;
    assert(events.some(event => event.event === 'gateway_handshake_reply' && event.status === 'rejected' && event.reason === 'client_verify'));
    assert.equal(events.some(event => event.event === 'gateway_login_sdk_capture'), false);
  } finally { socket.destroy(); await probe.close(); }
});

test('unknown first frame is summarized and receives no challenge', { timeout: 5000 }, async () => {
  const events = [];
  const received = [];
  const probe = createGameGatewayProbe({ ...config, logger: event => events.push(event) });
  const address = await probe.listen(0);
  const socket = await openSocket(address);
  try {
    socket.on('data', bytes => received.push(bytes));
    const closed = once(socket, 'close');
    socket.end(encodeGameFrame(Buffer.from('secret-unknown-frame')));
    await closed;
    assert.equal(Buffer.concat(received).length, 0);
    assert(events.some(event => event.event === 'gateway_initial_frame' && event.status === 'unexpected' && event.payloadBytes === 20));
    assert.equal(JSON.stringify(events).includes('secret-unknown-frame'), false);
  } finally { socket.destroy(); await probe.close(); }
});

test('unknown application commands and malformed protobuf fail explicitly without success bytes', { timeout: 5000 }, async () => {
  const outer = testRoot.lookupType('pb_c2s');
  const cases = [
    [Buffer.from(outer.encode(outer.create({ seq: 1, type: 42, data: Buffer.from('secret-unsupported') })).finish()), 'unsupported_application_command'],
    [Buffer.from([0x1a, 0x80]), 'invalid_application_envelope'],
    [Buffer.from(outer.encode(outer.create({ seq: 1, type: 909103, data: Buffer.from([0x0a, 0x80]) })).finish()), 'invalid_login_protobuf']
  ];
  for (const [payload, reason] of cases) {
    const events = [];
    const probe = createGameGatewayProbe({ ...config, logger: event => events.push(event) });
    const address = await probe.listen(0);
    const socket = await openSocket(address);
    try {
      await acceptHandshake(socket);
      const received = [];
      socket.on('data', bytes => received.push(bytes));
      const closed = once(socket, 'close');
      socket.end(encodeGameFrame(payload));
      await closed;
      assert.equal(Buffer.concat(received).length, 0);
      assert(events.some(event => event.event === 'gateway_probe_stop' && event.reason === reason));
      assert.equal(events.some(event => event.event === 'gateway_login_sdk_capture'), false);
      assert.equal(JSON.stringify(events).includes('secret-unsupported'), false);
    } finally { socket.destroy(); await probe.close(); }
  }
});

test('truncated, oversized and idle connections terminate within the configured bounds', { timeout: 5000 }, async () => {
  for (const [bytes, reason] of [
    [Buffer.from([0, 0]), 'truncated_frame'],
    [Buffer.from([0, 0, 1, 0]), 'frame_too_large'],
    [null, 'idle_timeout']
  ]) {
    const events = [];
    const probe = createGameGatewayProbe({ ...config, timeoutMs: 50, maxPayloadBytes: 128, logger: event => events.push(event) });
    const address = await probe.listen(0);
    const socket = await openSocket(address);
    try {
      const closed = once(socket, 'close');
      if (bytes) socket.end(bytes);
      await closed;
      assert(events.some(event => event.event === 'gateway_probe_stop' && event.reason === reason));
    } finally { socket.destroy(); await probe.close(); }
  }
});

test('close destroys idle sessions and releases the loopback listener', { timeout: 5000 }, async () => {
  const probe = createGameGatewayProbe({ ...config, logger() {} });
  const address = await probe.listen(0);
  assert.equal(address.host, '127.0.0.1');
  const socket = await openSocket(address);
  const closed = once(socket, 'close');
  await probe.close();
  await closed;
  await probe.close();
  await assert.rejects(probe.listen(0));
  const replacement = net.createServer();
  try {
    replacement.listen(address.port, address.host);
    await once(replacement, 'listening');
  } finally { await new Promise(resolve => replacement.close(resolve)); }
});

test('probe requires explicit profile/flags/version/port and refuses unimplemented packet encryption', async () => {
  assert.throws(() => createGameGatewayProbe({ flags, expectedApplicationVersion }), TypeError);
  assert.throws(() => createGameGatewayProbe({ ...config, flags: { ...flags, encryptC2S: true } }), TypeError);
  const probe = createGameGatewayProbe({ ...config, logger() {} });
  await assert.rejects(probe.listen(), TypeError);
  await probe.close();
});
