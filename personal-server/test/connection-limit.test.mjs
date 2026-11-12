import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { GameFrameDecoder, encodeGameFrame } from '../game-framing.mjs';
import { createLocalGame } from '../local-game.mjs';

const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);

function gameOptions(directory, overrides = {}) {
  return {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'state.json'),
    capturePath,
    ...overrides
  };
}

async function connectAndReadChallenge(port) {
  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  await once(socket, 'connect');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const challenge = new Promise((resolve, reject) => {
    socket.on('data', chunk => {
      const frames = decoder.push(chunk);
      if (frames.length) resolve(frames[0]);
    });
    socket.once('close', () => reject(new Error('connection closed before challenge')));
  });
  socket.write(encodeGameFrame(Buffer.from('verify')));
  await challenge;
  return socket;
}

test('gateway rejects invalid connection limits', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-connection-limit-invalid-'));
  try {
    for (const value of [0, -1, 1.5, NaN, Infinity, '2']) {
      assert.throws(() => createLocalGame(gameOptions(directory, { maxConnections: value })), /maxConnections must be a positive integer/);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('gateway admits exactly the configured limit and reuses released capacity', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-connection-limit-'));
  const game = createLocalGame(gameOptions(directory, { maxConnections: 2 }));
  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const address = await game.listen(0);

  sockets.push(await connectAndReadChallenge(address.port));
  sockets.push(await connectAndReadChallenge(address.port));

  const rejected = net.connect(address.port, '127.0.0.1');
  rejected.on('error', () => {});
  await once(rejected, 'connect');
  await once(rejected, 'close');

  sockets[0].destroy();
  await once(sockets[0], 'close');
  sockets.push(await connectAndReadChallenge(address.port));
  assert.equal(sockets.filter(socket => !socket.destroyed).length, 2);
});
