import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readDestinyTables } from '../config/destiny-tables.mjs';
import { createDestinyService } from '../game/destiny-service.mjs';
import { setBit } from '../game/bit-block.mjs';
import { createLocalGame } from '../local-game.mjs';

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
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); },
    setState(value, moduleId = 107) {
      store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        modules.set(moduleId, serializedBinary(codec.pack('pb_destiny_data', value)));
        model.state.modules.value = [...modules];
      });
    }
  };
}

const storedDestiny = env => codec.unpack('pb_destiny_data', rawBinary(new Map(env.store.state().modules.value).get(107)));
const response = result => codec.unpack('pb_destiny_up_back', result.data);
const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('login initializes the destiny module with stage one and an empty 13-byte slot block', t => {
  const env = setup(t);
  assert.equal(new Map(env.store.state().modules.value).has(100), false);
  assert.equal(rawBinary(new Map(env.store.state().modules.value).get(107)).length, 0);
  assert.deepEqual(env.service().ensureLoginState(), { curStage: 1, slotBytes: 13 });
  const destiny = storedDestiny(env);
  assert.equal(destiny.cur_stage, 1);
  assert.deepEqual(Buffer.from(destiny.slot_state, 'base64'), Buffer.alloc(13));
  assert.deepEqual(env.service().ensureLoginState(), { curStage: 1, slotBytes: 13 });
});

test('login migrates legacy module 100 into the client module and preserves second-stage progress', async t => {
  const env = setup(t), bits = Buffer.alloc(13);
  for (const id of [201, 202, 203]) setBit(bits, id % 100);
  env.setState({ cur_stage: 2, slot_state: bits }, 100);
  env.store.transaction(model => { model.resources.get('25002').num = '10'; });
  const legacy = new Map(env.store.state().modules.value).get(100);

  assert.deepEqual(env.service().ensureLoginState(), { curStage: 2, slotBytes: 13 });
  assert.deepEqual(storedDestiny(env), { cur_stage: 2, slot_state: bits.toString('base64') });
  assert.deepEqual(new Map(env.store.state().modules.value).get(100), legacy);
  env.reopen();
  const destiny = env.service();
  assert.deepEqual(destiny.ensureLoginState(), { curStage: 2, slotBytes: 13 });
  let reply = response(await destiny.execute(82601, await encodeEtf([101, 201, 202, 203])));
  assert.deepEqual(reply.res_client.changes, []);
  assert.deepEqual(reply.destiny, storedDestiny(env));
  assert.equal(env.store.read().resources.get('25002').num, '10');

  reply = response(await destiny.execute(82601, await encodeEtf([204])));
  assert.equal(reply.destiny.cur_stage, 2);
  assert.equal(Buffer.from(reply.destiny.slot_state, 'base64')[0], 120);
  assert.deepEqual(reply.res_client.changes, [{ tid: '25002', new_num: '9', diff_num: '-1' }]);
  env.reopen();
  assert.deepEqual(env.service().ensureLoginState(), { curStage: 2, slotBytes: 13 });
  assert.deepEqual(storedDestiny(env), reply.destiny);
  assert.deepEqual(new Map(env.store.state().modules.value).get(100), legacy);
});

test('existing client module wins over a stale legacy module', t => {
  const env = setup(t), oldBits = Buffer.alloc(13), currentBits = Buffer.alloc(13);
  setBit(oldBits, 1);
  for (const id of [1, 2, 3]) setBit(currentBits, id);
  env.setState({ cur_stage: 1, slot_state: oldBits }, 100);
  env.setState({ cur_stage: 2, slot_state: currentBits });
  assert.deepEqual(env.service().ensureLoginState(), { curStage: 2, slotBytes: 13 });
  assert.deepEqual(storedDestiny(env), { cur_stage: 2, slot_state: currentBits.toString('base64') });
});

test('invalid client module fails login without overwriting either saved payload', t => {
  const env = setup(t);
  env.setState({ cur_stage: 2, slot_state: Buffer.alloc(13, 0x70) }, 100);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(107, serializedBinary(Buffer.from([0xff])));
    model.state.modules.value = [...modules];
  });
  const before = env.store.state();
  assert.throws(() => env.service().ensureLoginState());
  assert.deepEqual(env.store.state(), before);
});

test('login ETF delivers migrated stage two progress through module 107 after restart', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-destiny-login-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'legacy.json'),
    capturePath,
    activityMode: 'all-open',
    verifySession: () => true
  };
  let game = createLocalGame(options);
  await game.listen(0);
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const bits = Buffer.alloc(13);
  for (const id of [201, 202, 203]) setBit(bits, id % 100);
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(100, serializedBinary(codec.pack('pb_destiny_data', { cur_stage: 2, slot_state: bits })));
    model.state.modules.value = [...modules];
  });

  for (let login = 0; login < 2; login++) {
    const payload = await decodeEtf(await game.loginPayload());
    const modules = new Map(payload[2].value);
    const value = codec.unpack('pb_destiny_data', Buffer.from(modules.get(107).value));
    assert.deepEqual(value, { cur_stage: 2, slot_state: bits.toString('base64') });
    if (login === 0) {
      await game.close();
      game = createLocalGame(options);
      await game.listen(0);
    }
  }
});

test('current-stage activation is idempotent and writes MSB-first bits', async t => {
  const env = setup(t), destiny = env.service();
  destiny.ensureLoginState();
  env.store.transaction(model => { model.resources.get('25002').num = '100'; });

  let reply = response(await destiny.execute(82601, await encodeEtf([101, 102])));
  assert.equal(reply.destiny.cur_stage, 1);
  assert.equal(Buffer.from(reply.destiny.slot_state, 'base64')[0], 96);
  assert.deepEqual(reply.res_client.changes, [{ tid: '25002', new_num: '98', diff_num: '-2' }]);

  const before = env.store.state();
  reply = response(await destiny.execute(82601, await encodeEtf([101, 102])));
  assert.deepEqual(reply.destiny, storedDestiny(env));
  assert.deepEqual(reply.res_client.changes, []);
  assert.deepEqual(env.store.state(), before);

  reply = response(await destiny.execute(82601, await encodeEtf([101, 103])));
  assert.equal(Buffer.from(reply.destiny.slot_state, 'base64')[0], 112);
  assert.deepEqual(reply.res_client.changes, [{ tid: '25002', new_num: '97', diff_num: '-1' }]);
  env.reopen();
  assert.equal(Buffer.from(storedDestiny(env).slot_state, 'base64')[0], 112);
});

test('invalid, duplicate, future and malformed activations leave state unchanged', async t => {
  const env = setup(t), destiny = env.service();
  destiny.ensureLoginState();
  const before = env.store.state();
  const future = await encodeEtf([201]);
  const duplicate = await encodeEtf([101, 101]);
  const unknown = await encodeEtf([999]);
  const crossed = await encodeEtf([101, 201]);
  await assert.rejects(() => destiny.execute(82601, Buffer.from([131, 106, 0])), /unparsed data/);
  await assert.rejects(() => destiny.execute(82601, future), error => error.code === 5);
  await assert.rejects(() => destiny.execute(82601, duplicate), error => error.code === 1);
  await assert.rejects(() => destiny.execute(82601, unknown), error => error.code === 5);
  await assert.rejects(() => destiny.execute(82601, crossed), error => error.code === 5);
  assert.deepEqual(env.store.state(), before);
});

test('insufficient destiny material leaves the node and resource state unchanged', async t => {
  const env = setup(t), destiny = env.service();
  destiny.ensureLoginState();
  env.store.transaction(model => { model.resources.get('25002').num = '0'; });
  const before = env.store.state();
  const request = await encodeEtf([101]);
  await assert.rejects(() => destiny.execute(82601, request), error => error.code === 301);
  assert.deepEqual(env.store.state(), before);
});

test('completing a stage advances once, clears its bitmap and survives reopen', async t => {
  const env = setup(t), destiny = env.service();
  env.store.transaction(model => { model.resources.get('25002').num = '100'; });
  destiny.ensureLoginState();
  const reply = response(await destiny.execute(82601, await encodeEtf([101, 102, 103, 104, 105, 106])));
  assert.equal(reply.destiny.cur_stage, 2);
  assert.deepEqual(Buffer.from(reply.destiny.slot_state, 'base64'), Buffer.alloc(13));
  assert.equal(env.store.read().resources.get('25002').num, '94');
  env.reopen();
  const saved = storedDestiny(env);
  assert.equal(saved.cur_stage, 2);
  assert.deepEqual(Buffer.from(saved.slot_state, 'base64'), Buffer.alloc(13));
});

test('stale earlier-stage replay returns the authoritative state without charging again', async t => {
  const env = setup(t), destiny = env.service();
  env.store.transaction(model => { model.resources.get('25002').num = '100'; });
  destiny.ensureLoginState();
  await destiny.execute(82601, await encodeEtf([101, 102, 103, 104, 105, 106]));

  for (const ids of [[101], [101, 102, 103], [101, 102, 103, 104, 105, 106]]) {
    const reply = response(await destiny.execute(82601, await encodeEtf(ids)));
    assert.equal(reply.destiny.cur_stage, 2);
    assert.deepEqual(Buffer.from(reply.destiny.slot_state, 'base64'), Buffer.alloc(13));
    assert.deepEqual(reply.res_client.changes, []);
  }
  assert.equal(env.store.read().resources.get('25002').num, '94');
});

test('next-stage activation starts from the clean stage and advances only when complete', async t => {
  const env = setup(t), destiny = env.service();
  env.store.transaction(model => { model.resources.get('25002').num = '100'; });
  destiny.ensureLoginState();
  await destiny.execute(82601, await encodeEtf([101, 102, 103, 104, 105, 106]));
  let reply = response(await destiny.execute(82601, await encodeEtf([201, 202, 203])));
  assert.equal(reply.destiny.cur_stage, 2);
  assert.equal(Buffer.from(reply.destiny.slot_state, 'base64')[0], 112);
  assert.deepEqual(reply.res_client.changes, [{ tid: '25002', new_num: '91', diff_num: '-3' }]);
  reply = response(await destiny.execute(82601, await encodeEtf([204, 205, 206])));
  assert.equal(reply.destiny.cur_stage, 3);
  assert.deepEqual(Buffer.from(reply.destiny.slot_state, 'base64'), Buffer.alloc(13));
  env.reopen();
  assert.deepEqual(env.service().ensureLoginState(), { curStage: 3, slotBytes: 13 });
  assert.deepEqual(storedDestiny(env), reply.destiny);
});

test('login repairs a legacy fully-lit stage without double charging', t => {
  const env = setup(t), destiny = env.service();
  const bits = Buffer.alloc(13);
  for (const id of [101, 102, 103, 104, 105, 106]) setBit(bits, id % 100);
  env.setState({ cur_stage: 1, slot_state: bits });
  env.store.transaction(model => { model.resources.get('25002').num = '7'; });
  assert.deepEqual(destiny.ensureLoginState(), { curStage: 2, slotBytes: 13 });
  assert.equal(storedDestiny(env).cur_stage, 2);
  assert.deepEqual(Buffer.from(storedDestiny(env).slot_state, 'base64'), Buffer.alloc(13));
  assert.equal(env.store.read().resources.get('25002').num, '7');
});

test('the final stage remains fully lit and repeated activation is harmless', async t => {
  const stage = tables.stages.size, ids = [...tables.up.keys()].filter(id => Math.floor(id / 100) === stage);
  const env = setup(t), destiny = env.service(), bits = Buffer.alloc(13);
  for (const id of ids) setBit(bits, id % 100);
  env.setState({ cur_stage: stage, slot_state: bits });
  env.store.transaction(model => { model.resources.get('25002').num = '10'; });
  assert.equal(destiny.ensureLoginState().curStage, stage);
  const reply = response(await destiny.execute(82601, await encodeEtf(ids)));
  assert.equal(reply.destiny.cur_stage, stage);
  assert.deepEqual(Buffer.from(reply.destiny.slot_state, 'base64'), bits);
  assert.deepEqual(reply.res_client.changes, []);
  assert.equal(env.store.read().resources.get('25002').num, '10');
});

test('response encoding failure rolls back material and node state', async t => {
  const env = setup(t), normal = env.service();
  normal.ensureLoginState();
  env.store.transaction(model => { model.resources.get('25002').num = '10'; });
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_destiny_up_back') throw new Error('Injected encoding failure');
      return codec.pack(name, value);
    }
  };
  const request = await encodeEtf([101]);
  await assert.rejects(() => env.service(brokenCodec).execute(82601, request), /Injected encoding failure/);
  assert.deepEqual(env.store.state(), before);
});
