import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readEquipTables } from '../config/equip-tables.mjs';
import { createEquipService } from '../game/equip-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const BAG_MODULE = 16;
const ROLE_EQUIP_MODULE = 26;
const codec = createGameCodec();
const tables = readEquipTables();

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-equip-' });
  return {
    get store() { return fixture.store; },
    reopen() { return fixture.open(); }
  };
}

function addResource(store, tid, num, group = 1) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
  });
}

function addEquip(store, equip, moduleId = BAG_MODULE, index = null) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(moduleId);
    const data = codec.unpack('pb_role_equip', rawBinary(module));
    data.equips ??= [];
    if (index === null) data.equips.push(structuredClone(equip));
    else data.equips[index] = structuredClone(equip);
    modules.set(moduleId, serializedBinary(codec.pack('pb_role_equip', data)));
    model.state.modules.value = [...modules];
  });
}

function equipData(store, moduleId) {
  return codec.unpack('pb_role_equip', rawBinary(new Map(store.state().modules.value).get(moduleId)));
}

function configuredEquip(id = 777) {
  return {
    id,
    tid: 10103,
    level: 1,
    level_exp: 0,
    inscription: 0,
    refine: 0,
    refine_exp: 0,
    random_develop_cost: []
  };
}

function fundDevelopment(store) {
  addResource(store, 201500, 100000);
  addResource(store, 157002, 100000);
  addResource(store, 17002, 100000);
  addResource(store, 18002, 100000);
}

test('1001 consumes configured level costs and enforces the template level cap', t => {
  const env = setup(t);
  fundDevelopment(env.store);
  addEquip(env.store, configuredEquip());
  const service = createEquipService({ store: env.store, codec, tables });

  const result = service.execute(1001, { equips: [{ id: 777, add_level: 2 }] });
  const response = codec.unpack('pb_equip_level_up_rsp', result.data);
  assert.equal(response.equips.length, 1);
  assert.equal(Number(response.equips[0].id), 777);
  assert.equal(Number(response.equips[0].level), 3);
  assert.deepEqual(response.res_change.changes.map(change => change.tid), ['201500']);
  assert.equal(Number(equipData(env.store, BAG_MODULE).equips.find(row => Number(row.id) === 777).level), 3);

  assert.throws(() => service.execute(1001, { equips: [{ id: 777, add_level: 1000 }] }), error => error.code === 305);
  const reopened = env.reopen();
  assert.equal(Number(equipData(reopened, BAG_MODULE).equips.find(row => Number(row.id) === 777).level), 3);
});

test('1002 validates configuration and forges the requested quantity with configured costs', t => {
  const env = setup(t);
  fundDevelopment(env.store);
  const service = createEquipService({ store: env.store, codec, tables });

  const before = env.store.state();
  assert.throws(() => service.execute(1002, { equips: [{ index: 0, equip_id: 99999999, times: 1 }] }), error => error.code === 5);
  assert.deepEqual(env.store.state(), before);

  const result = service.execute(1002, { equips: [{ index: 0, equip_id: 10103, times: 2 }], is_one_key: true });
  const response = codec.unpack('pb_equip_forge_rsp', result.data);
  assert.equal(response.equip.length, 2);
  assert.ok(response.equip.every(row => Number(row.tid) === 10103));
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '157002', diff_num: '-3000' },
    { tid: '201500', diff_num: '-2400' }
  ]);
  assert.equal(equipData(env.store, BAG_MODULE).equips.filter(row => Number(row.tid) === 10103).length, 2);
});

test('1006 moves an owned configured equip from the bag to the requested role slot', t => {
  const env = setup(t);
  addEquip(env.store, configuredEquip());
  const service = createEquipService({ store: env.store, codec, tables });

  const result = service.execute(1006, { wears: [{ index: 2, id: 777, tid: 10103 }] });
  const response = codec.unpack('pb_equip_wear_rsp', result.data);
  assert.equal(Number(response.equips.find(row => Number(row.id) === 777).tid), 10103);
  assert.equal(equipData(env.store, BAG_MODULE).equips.some(row => Number(row.id) === 777), false);
  assert.equal(Number(equipData(env.store, ROLE_EQUIP_MODULE).equips[2].id), 777);

  const before = env.store.state();
  assert.throws(() => service.execute(1006, { wears: [{ index: 2, id: 7654321, tid: 10103 }] }), error => error.code === 5);
  assert.deepEqual(env.store.state(), before);
});

test('1003 refines through the configured cost', t => {
  const env = setup(t);
  fundDevelopment(env.store);
  addEquip(env.store, configuredEquip());
  const service = createEquipService({ store: env.store, codec, tables });

  const result = service.execute(1003, 777);
  const response = codec.unpack('pb_equip_refine_rsp', result.data);
  assert.equal(Number(response.equip.refine), 1);
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '17002', diff_num: '-16' }
  ]);
  assert.equal(Number(equipData(env.store, BAG_MODULE).equips.find(row => Number(row.id) === 777).refine), 1);
});

test('1004 one-key refine clamps to the configured limit and returns every successful step', t => {
  const env = setup(t);
  fundDevelopment(env.store);
  addEquip(env.store, configuredEquip());
  const service = createEquipService({ store: env.store, codec, tables });
  const limit = Number(tables.Equip.get(10103).refine_limit_lv);
  assert.ok(limit > 0);

  const response = codec.unpack('pb_equip_refine_one_key_rsp', service.execute(1004, { equip_id: 777, target_level: limit + 100 }).data);
  assert.equal(Number(response.equip.refine), limit);
  assert.equal(Number(response.times), limit);
  assert.equal(response.multi.length, limit);
  assert.ok(response.res_change.changes.every(change => change.tid === '17002'));
});

test('1005 inscribes through the configured cost', t => {
  const env = setup(t);
  fundDevelopment(env.store);
  addEquip(env.store, configuredEquip());
  const service = createEquipService({ store: env.store, codec, tables });

  const response = codec.unpack('pb_equip_inscription_rsp', service.execute(1005, { equip_id: 777, target_level: 1 }).data);
  assert.equal(Number(response.equip.inscription), 1);
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '18002', diff_num: '-8' }
  ]);
});

test('unsupported equip commands fail explicitly', t => {
  const env = setup(t);
  const service = createEquipService({ store: env.store, codec, tables });
  assert.throws(() => service.execute(9999, {}), error => error.code !== undefined);
});
