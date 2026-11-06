import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameStore } from '../../storage/game-store.mjs';

const capturePath = new URL('../../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
const loginFlow = capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103');

if (!loginFlow) throw new Error('Login-module fixture is missing its captured game flow');

export function fixtureModules() {
  return structuredClone(loginFlow.decoded[2]);
}

export function createSeed(codec, options = {}) {
  return {
    version: 1,
    roleId: options.roleId ?? 100001,
    serverId: options.serverId ?? 1,
    createdAt: options.createdAt ?? 1700000000,
    modules: options.modules ? structuredClone(options.modules) : fixtureModules(),
    rolePb: codec.pack('to_client_role_info', options.role ?? {
      level: 9,
      nick_name: Buffer.from('Local Test')
    }).toString('base64'),
    guides: structuredClone(options.guides ?? {}),
    lineups: options.lineups ?? null
  };
}

export function createGameFixture(t, codec, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), options.prefix ?? 'fc-test-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => createSeed(codec, options.seed);
  let store = createGameStore({
    databasePath,
    seed,
    codec,
    serverOpenedAt: options.serverOpenedAt,
    now: options.now
  });

  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  return {
    directory,
    databasePath,
    get store() { return store; },
    open() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: options.serverOpenedAt, now: options.now });
      return store;
    }
  };
}
