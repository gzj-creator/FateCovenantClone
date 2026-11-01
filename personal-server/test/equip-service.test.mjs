import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readEquipTables } from '../config/equip-tables.mjs';
import { createEquipService } from '../game/equip-service.mjs';
import { createGameStore } from '../storage/game-store.mjs';

const codec = createGameCodec();
const tables = readEquipTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const fixtureModules = () => structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-equip-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify({
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: fixtureModules(),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Equip Test') }).toString('base64'),
    guides: {},
    lineups: null
  }));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    directory,
    databasePath,
    legacyStatePath,
    get store() { return store; },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); return store; }
  };
}

function roleEquipData(env) {
  const modules = new Map(env.store.state().modules.value);
  return codec.unpack('pb_role_equip', rawBinary(modules.get(26)));
}

test('1001 levels up an existing equip and persists', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });
  const before = roleEquipData(env).equips.find(e => Number(e.id) === 1001);
  assert.ok(before, 'seed equip 1001 exists');
  const beforeLevel = Number(before.level ?? 0);

  const result = service.execute(1001, { equips: [{ id: 1001, add_level: 2 }] });
  const response = codec.unpack('pb_equip_level_up_rsp', result.data);
  assert.equal(response.equips.length, 1);
  assert.equal(Number(response.equips[0].id), 1001);
  assert.equal(Number(response.equips[0].level), beforeLevel + 2);

  const after = roleEquipData(env).equips.find(e => Number(e.id) === 1001);
  assert.equal(Number(after.level), beforeLevel + 2);

  const reopened = env.reopen();
  const reopenedService = createEquipService({ store: reopened, codec, tables });
  const reopenedEquip = codec.unpack('pb_role_equip', rawBinary(new Map(reopened.state().modules.value).get(26))).equips.find(e => Number(e.id) === 1001);
  assert.equal(Number(reopenedEquip.level), beforeLevel + 2);
});

test('1002 forges new equips into the bag', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });

  const result = service.execute(1002, { equips: [{ index: 0, equip_id: 10103, times: 1 }], is_one_key: true });
  const response = codec.unpack('pb_equip_forge_rsp', result.data);
  assert.equal(response.equip.length, 1);
  assert.equal(Number(response.equip[0].tid), 10103);

  const modules = new Map(env.store.state().modules.value);
  const bag = codec.unpack('pb_role_equip', rawBinary(modules.get(16)));
  assert.ok(bag.equips.some(e => Number(e.tid) === 10103), 'forged equip persisted in bag');
});

test('1006 wears an equip', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });

  const result = service.execute(1006, { wears: [{ index: 0, id: 777, tid: 10103 }] });
  const response = codec.unpack('pb_equip_wear_rsp', result.data);
  assert.equal(response.equips.length, 1);
  assert.equal(Number(response.equips[0].id), 777);
  assert.equal(Number(response.equips[0].tid), 10103);
});

test('unsupported type throws', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });
  assert.throws(() => service.execute(9999, {}), err => err.code !== undefined);
});

test('1003 refines an equip (ETF input)', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });
  const before = roleEquipData(env).equips.find(e => Number(e.id) === 1001);
  const beforeRefine = Number(before.refine ?? 0);

  const result = service.execute(1003, 1001);
  const response = codec.unpack('pb_equip_refine_rsp', result.data);
  assert.equal(Number(response.equip.id), 1001);
  assert.equal(Number(response.equip.refine), beforeRefine + 1);
  assert.equal(Number(response.multi), 1);
  assert.ok(response.res_change);

  const after = roleEquipData(env).equips.find(e => Number(e.id) === 1001);
  assert.equal(Number(after.refine), beforeRefine + 1);
});

test('1004 one-key refines to target level', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });
  const before = roleEquipData(env).equips.find(e => Number(e.id) === 1001);
  const beforeRefine = Number(before.refine ?? 0);

  const result = service.execute(1004, { equip_id: 1001, target_level: beforeRefine + 3 });
  const response = codec.unpack('pb_equip_refine_one_key_rsp', result.data);
  assert.equal(Number(response.equip.id), 1001);
  assert.equal(Number(response.equip.refine), beforeRefine + 3);
  assert.equal(Number(response.times), 3);
  assert.equal(response.multi.length, 3);
});

test('1005 inscribes an equip', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });

  const result = service.execute(1005, { equip_id: 1001, target_level: 2 });
  const response = codec.unpack('pb_equip_inscription_rsp', result.data);
  assert.equal(Number(response.equip.id), 1001);
  assert.equal(Number(response.equip.inscription), 2);
  assert.ok(response.res_change);

  const after = roleEquipData(env).equips.find(e => Number(e.id) === 1001);
  assert.equal(Number(after.inscription), 2);
});
