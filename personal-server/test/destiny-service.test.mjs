import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readDestinyTables } from '../config/destiny-tables.mjs';
import { createDestinyService } from '../game/destiny-service.mjs';

const codec = createGameCodec(), tables = readDestinyTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-destiny-test-'));
  const databasePath = path.join(directory, 'game.sqlite'), legacyStatePath = path.join(directory, 'legacy.json');
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  fs.writeFileSync(legacyStatePath, JSON.stringify({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000, modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  }));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    service: (useCodec = codec) => createDestinyService({ store, codec: useCodec, tables }),
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

const rejected = (action, code) => assert.throws(action, error => error.code === code);
const storedDestiny = env => codec.unpack('pb_destiny_data', rawBinary(new Map(env.store.state().modules.value).get(100)));

test('login initializes the destiny module with stage one and an empty 13-byte slot block', t => {
  const env = setup(t);
  assert.equal(new Map(env.store.state().modules.value).has(100), false);
  const result = env.service().ensureLoginState();
  assert.deepEqual(result, { curStage: 1, slotBytes: 13 });
  const destiny = storedDestiny(env);
  assert.equal(destiny.cur_stage, 1);
  const slots = Buffer.from(destiny.slot_state, 'base64');
  assert.equal(slots.length, 13);
  assert.ok(slots.every(byte => byte === 0));
  const reloaded = env.service().ensureLoginState();
  assert.deepEqual(reloaded, { curStage: 1, slotBytes: 13 });
});

test('lighting aggregates costs, persists the MSB-first bits and rejects repeats and other stages', async t => {
  const env = setup(t), before = env.store.read().resources.get('25002').num;
  const destiny = env.service();
  destiny.ensureLoginState();
  const response = codec.unpack('pb_destiny_up_back', (await destiny.execute(82601, await encodeEtf([101, 102]))).data);
  assert.equal(response.destiny.cur_stage, 1);
  assert.equal(Buffer.from(response.destiny.slot_state, 'base64')[0], 96);
  assert.deepEqual(response.res_client.changes, [{ tid: '25002', new_num: String(BigInt(before) - 2n), diff_num: '-2' }]);
  assert.equal(env.store.read().resources.get('25002').num, String(BigInt(before) - 2n));
  env.reopen();
  assert.equal(Buffer.from(storedDestiny(env).slot_state, 'base64')[0], 96);

  const current = env.store.state();
  const duplicate = await encodeEtf([101]), otherStage = await encodeEtf([201]), empty = Buffer.from([131, 106, 0]);
  await assert.rejects(() => env.service().execute(82601, empty), /unparsed data/);
  await assert.rejects(() => env.service().execute(82601, duplicate), error => error.code === 310);
  await assert.rejects(() => env.service().execute(82601, otherStage), error => error.code === 5);
  assert.deepEqual(env.store.state(), current);
});

test('insufficient destiny material leaves the node and resource state unchanged', async t => {
  const env = setup(t), destiny = env.service();
  destiny.ensureLoginState();
  env.store.transaction(model => { model.resources.get('25002').num = '0'; });
  const request = await encodeEtf([101]);
  const before = env.store.state();
  await assert.rejects(() => destiny.execute(82601, request), error => error.code === 301);
  assert.deepEqual(env.store.state(), before);
});

test('lighting every node advances one stage, clears the slot block and survives reopen', async t => {
  const env = setup(t), destiny = env.service();
  env.store.transaction(model => { model.resources.get('25002').num = '100'; });
  destiny.ensureLoginState();
  const allNodes = await encodeEtf([101, 102, 103, 104, 105, 106]);
  const response = codec.unpack('pb_destiny_up_back', (await destiny.execute(82601, allNodes)).data);
  assert.equal(response.destiny.cur_stage, 2);
  assert.ok(Buffer.from(response.destiny.slot_state, 'base64').every(byte => byte === 0));
  assert.equal(env.store.read().resources.get('25002').num, '94');
  env.reopen();
  const saved = storedDestiny(env);
  assert.equal(saved.cur_stage, 2);
  assert.deepEqual(Buffer.from(saved.slot_state, 'base64'), Buffer.alloc(13));
});

test('response encoding failure rolls back material and node state', async t => {
  const env = setup(t), normal = env.service();
  normal.ensureLoginState();
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_destiny_up_back') throw new Error('Injected encoding failure');
      return codec.pack(name, value);
    }
  };
  const broken = env.service(brokenCodec);
  const request = await encodeEtf([101]);
  await assert.rejects(() => broken.execute(82601, request), /Injected encoding failure/);
  assert.deepEqual(env.store.state(), before);
});
