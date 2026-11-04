import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readLeaderEquipTables } from '../config/hero-tables.mjs';
import { createLeaderEquipService } from '../game/leader-equip-service.mjs';
import { createGameStore } from '../storage/game-store.mjs';

const codec = createGameCodec();
const tables = readLeaderEquipTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));

function fixture() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Leader Equip Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-leader-equip-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(175, serializedBinary(codec.pack('pb_leader_equips_data', {
      slots: [], equip_list: [], max_uid: '0', draw_info: { lv: 1 }, dismiss: ''
    })));
    model.state.modules.value = [...modules];
  });
  return {
    directory,
    databasePath,
    legacyStatePath,
    get store() { return store; },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function leaderData(env) {
  return codec.unpack('pb_leader_equips_data', rawBinary(new Map(env.store.state().modules.value).get(175)));
}

function addEquip(env, equip) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const data = codec.unpack('pb_leader_equips_data', rawBinary(modules.get(175)));
    data.equip_list.push(structuredClone(equip));
    modules.set(175, serializedBinary(codec.pack('pb_leader_equips_data', data)));
    model.state.modules.value = [...modules];
  });
}

function equip(tid, uid) {
  return { tid: String(tid), uid: String(uid), star: 0, level: 1, intensify_info: { intensify_level: 0, intensify_times: 0 } };
}

const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('wears one leader equipment, removes it from the bag and survives reopen', t => {
  const env = setup(t), service = createLeaderEquipService({ store: env.store, codec, tables });
  addEquip(env, equip(2001018, 101));
  const before = leaderData(env);

  const result = service.execute(98401, { wear_list: [{ uid: '101', type: 1 }] });
  const response = codec.unpack('pb_leader_equip_wear_back', result.data);
  assert.equal(response.slots.length, 1);
  assert.equal(response.slots[0].type, 1);
  assert.equal(response.slots[0].level, 1);
  assert.equal(response.slots[0].equip.uid, '101');
  assert.equal(response.slots[0].equip.tid, '2001018');
  assert.deepEqual(response.sub_equip_list.map(value => value.uid), ['101']);
  assert.deepEqual(response.add_equip_list, []);

  const after = leaderData(env);
  assert.equal(after.equip_list.length, 0);
  assert.deepEqual(after.slots, response.slots);
  assert.equal(after.max_uid, before.max_uid);
  assert.deepEqual(after.draw_info, before.draw_info);

  env.reopen();
  assert.deepEqual(leaderData(env), after);
});

test('replacement returns the previous equipment to the bag and preserves slot level', t => {
  const env = setup(t), service = createLeaderEquipService({ store: env.store, codec, tables });
  addEquip(env, equip(2001018, 101));
  addEquip(env, equip(2007018, 102));
  service.execute(98401, { wear_list: [{ uid: '101', type: 1 }] });
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const data = codec.unpack('pb_leader_equips_data', rawBinary(modules.get(175)));
    data.slots.find(slot => Number(slot.type) === 1).level = 7;
    modules.set(175, serializedBinary(codec.pack('pb_leader_equips_data', data)));
    model.state.modules.value = [...modules];
  });

  const response = codec.unpack('pb_leader_equip_wear_back', service.execute(98401, { wear_list: [{ uid: '102', type: 1 }] }).data);
  assert.equal(response.slots[0].level, 7);
  assert.equal(response.slots[0].equip.uid, '102');
  assert.deepEqual(response.sub_equip_list.map(value => value.uid), ['102']);
  assert.deepEqual(response.add_equip_list.map(value => value.uid), ['101']);

  const data = leaderData(env);
  assert.equal(data.slots.find(slot => Number(slot.type) === 1).equip.uid, '102');
  assert.deepEqual(data.equip_list.map(value => value.uid), ['101']);
});

test('wears a batch atomically and rejects duplicate or mismatched requests', t => {
  const env = setup(t), service = createLeaderEquipService({ store: env.store, codec, tables });
  addEquip(env, equip(2001018, 101));
  addEquip(env, equip(2002018, 102));
  addEquip(env, equip(2007018, 103));

  const response = codec.unpack('pb_leader_equip_wear_back', service.execute(98401, {
    wear_list: [{ uid: '101', type: 1 }, { uid: '102', type: 2 }]
  }).data);
  assert.deepEqual(response.slots.map(slot => [slot.type, slot.equip.uid]), [[1, '101'], [2, '102']]);
  assert.deepEqual(response.sub_equip_list.map(value => value.uid), ['101', '102']);
  assert.deepEqual(leaderData(env).equip_list.map(value => value.uid), ['103']);

  const snapshot = leaderData(env);
  rejected(() => service.execute(98401, { wear_list: [] }), 1);
  rejected(() => service.execute(98401, { wear_list: [{ uid: '999', type: 1 }] }), 1);
  rejected(() => service.execute(98401, { wear_list: [{ uid: '103', type: 2 }] }), 1);
  rejected(() => service.execute(98401, { wear_list: [{ uid: '103', type: 1 }, { uid: '103', type: 2 }] }), 1);
  rejected(() => service.execute(98401, { wear_list: [{ uid: '101', type: 2 }] }), 1);
  rejected(() => service.execute(98401, { wear_list: [{ uid: 'not-a-uid', type: 1 }] }), 1);
  assert.deepEqual(leaderData(env), snapshot);
});

test('repeating a successful wear is idempotent', t => {
  const env = setup(t), service = createLeaderEquipService({ store: env.store, codec, tables });
  addEquip(env, equip(2001018, 101));
  service.execute(98401, { wear_list: [{ uid: '101', type: 1 }] });
  const before = leaderData(env);

  const response = codec.unpack('pb_leader_equip_wear_back', service.execute(98401, { wear_list: [{ uid: '101', type: 1 }] }).data);
  assert.deepEqual(response.slots, before.slots);
  assert.deepEqual(response.add_equip_list, []);
  assert.deepEqual(response.sub_equip_list, []);
  assert.deepEqual(leaderData(env), before);
});

test('rolls back the module when response or state encoding fails', t => {
  const env = setup(t);
  addEquip(env, equip(2001018, 101));
  const before = leaderData(env);
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_leader_equips_data') throw new Error('forced leader-equipment encode failure');
      return codec.pack(name, value);
    }
  };
  const service = createLeaderEquipService({ store: env.store, codec: brokenCodec, tables });
  assert.throws(() => service.execute(98401, { wear_list: [{ uid: '101', type: 1 }] }), /forced leader-equipment encode failure/);
  assert.deepEqual(leaderData(env), before);
});
