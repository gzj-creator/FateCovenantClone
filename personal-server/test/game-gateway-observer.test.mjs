import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import { encodeGameFrame } from '../game-framing.mjs';
import { createGameGatewayObserver } from '../game-gateway-observer.mjs';

async function connect(address, payload) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(address.port, address.host);
    const chunks = [];
    socket.once('connect', () => socket.end(encodeGameFrame(payload)));
    socket.on('data', chunk => chunks.push(chunk));
    socket.once('error', reject);
    socket.once('close', () => resolve(Buffer.concat(chunks)));
  });
}

test('loopback observer records the exact initial verify and stops before challenge', async () => {
  const events = [];
  const observer = createGameGatewayObserver({ logger: event => events.push(event) });
  const address = await observer.listen();
  try {
    assert.deepEqual(await connect(address, Buffer.from('verify')), Buffer.alloc(0));
    assert(events.some(event => event.event === 'gateway_first_frame' && event.status === 'initial_verify_received' && event.payloadBytes === 6));
    assert(events.some(event => event.event === 'gateway_experiment_stop' && event.reason === 'challenge_not_implemented'));
  } finally {
    await observer.close();
  }
});

test('unexpected first frame is summarized without retaining its payload', async () => {
  const events = [];
  const secretLikePayload = Buffer.from('do-not-log-this-token');
  const observer = createGameGatewayObserver({ logger: event => events.push(event) });
  const address = await observer.listen();
  try {
    await connect(address, secretLikePayload);
    const frameEvent = events.find(event => event.event === 'gateway_first_frame');
    assert.equal(frameEvent.status, 'unexpected_payload');
    assert.equal(frameEvent.payloadBytes, secretLikePayload.length);
    assert.equal(JSON.stringify(events).includes(secretLikePayload.toString()), false);
  } finally {
    await observer.close();
  }
});

test('observer binds only loopback and validates options', async () => {
  assert.throws(() => createGameGatewayObserver({ port: -1 }), TypeError);
  assert.throws(() => createGameGatewayObserver({ timeoutMs: 0 }), TypeError);
  const observer = createGameGatewayObserver({ logger() {} });
  const address = await observer.listen();
  try {
    assert.equal(address.host, '127.0.0.1');
  } finally {
    await observer.close();
  }
});
