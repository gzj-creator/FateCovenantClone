import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { buildFantasyChipIndexes, readGameTables } from '../config/game-tables.mjs';
import {
  createFantasyEquipmentInventory,
  FANTASY_EQUIP_MODULE_ID,
  FANTASY_EQUIP_TYPE_SP_GOD,
  FANTASY_EQUIP_TYPE_UNIQUE
} from '../game/fantasy-equipment-inventory.mjs';
import { consumeResources, grantResources } from '../game/resources.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;
const normalTid = 1100119, uniqueTid = 1200119, spTid = 1202919, chipTid = 434002;

function seed() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt, modules,
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  };
}

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-inventory-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let store, closed = false;
  const inventoryOptions = {
    codec: options.inventoryCodec ?? codec,
    tables: options.inventoryTables ?? tables,
    ...(options.maxEquipCount === undefined ? {} : { maxEquipCount: options.maxEquipCount }),
    ...(options.maxRawTypeCount === undefined ? {} : { maxRawTypeCount: options.maxRawTypeCount })
  };
  const inventory = createFantasyEquipmentInventory(inventoryOptions);
  function open() {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    closed = false;
  }
  open();
  t.after(() => {
    if (!closed) store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    inventory,
    get store() { return store; },
    reopen() { if (!closed) store.close(); open(); },
    close() { if (!closed) store.close(); closed = true; },
    open() { open(); }
  };
}

function moduleBytes(store) {
  const module = new Map(store.state().modules.value).get(FANTASY_EQUIP_MODULE_ID);
  return module ? module.value.map(rawBinary) : null;
}

function persistedInventory(store) {
  const block = moduleBytes(store)?.[0];
  return block?.length ? codec.unpack('pb_fantasy_equip_res', block) : { equips: [], raw_equips: [], max_equip_id: 0 };
}

function setInventory(store, data) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(FANTASY_EQUIP_MODULE_ID);
    if (!module) module = { value: [], improper: false };
    while (module.value.length <= 2) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[0] = serializedBinary(codec.pack('pb_fantasy_equip_res', data));
    modules.set(FANTASY_EQUIP_MODULE_ID, module);
    model.state.modules.value = [...modules];
  });
}

function decodeCodeError(action, code) {
  return error => error?.code === code;
}

test('ItemTable.Chip builds the 32-row type-223 point_item index and rejects conflicts', () => {
  assert.equal(tables.Item.get(uniqueTid).type, 223);
  assert.equal(tables.FantasyChipByPointItem.size, 32);
  assert.equal(tables.FantasyChipByTid.size, 32);
  assert.deepEqual(tables.FantasyChipByPointItem.get(uniqueTid), { tid: chipTid, point_item: uniqueTid, need_num: 60 });
  assert.deepEqual(tables.FantasyChipByPointItem.get(spTid), { tid: 6008002, point_item: spTid, need_num: 80 });

  const duplicate = new Map([
    [chipTid, { tid: chipTid, type: 223, point_item: uniqueTid, need_num: 60 }],
    [435002, { tid: 435002, type: 223, point_item: uniqueTid, need_num: 60 }]
  ]);
  assert.throws(() => buildFantasyChipIndexes(duplicate, tables.FantasyEquip, tables.Item), /Duplicate fantasy chip mapping/);
  const invalidTarget = new Map([[chipTid, { tid: chipTid, type: 223, point_item: 999999999, need_num: 60 }]]);
  assert.throws(() => buildFantasyChipIndexes(invalidTarget, tables.FantasyEquip, tables.Item), /invalid point_item/);
});

test('type predicates and material values follow configuration rather than forged quality', () => {
  const inventory = createFantasyEquipmentInventory({ codec, tables });
  assert.equal(inventory.isUnique({ tid: uniqueTid, quality: 1 }), true);
  assert.equal(inventory.isUnique({ tid: normalTid, quality: 70 }), false);
  assert.equal(inventory.isSpGod({ tid: spTid, quality: 1 }), true);
  assert.equal(inventory.isSpGod({ tid: uniqueTid, quality: 70 }), false);

  const definitions = new Map(tables.FantasyEquip);
  definitions.set(normalTid, { ...definitions.get(normalTid), type: FANTASY_EQUIP_TYPE_UNIQUE, hero: 3030501 });
  definitions.set(uniqueTid, { ...definitions.get(uniqueTid), type: FANTASY_EQUIP_TYPE_SP_GOD });
  const changed = createFantasyEquipmentInventory({ codec, tables: { ...tables, FantasyEquip: definitions } });
  assert.equal(changed.isUnique({ tid: normalTid, quality: 30 }), true);
  assert.equal(changed.isSpGod({ tid: uniqueTid, quality: 50 }), true);

  assert.equal(inventory.itemValue(normalTid), 50);
  assert.equal(inventory.materialExp(142002), 2000);
  assert.equal(inventory.equipmentMaterialValue({ tid: normalTid, quality: 30, star: 0 }), 1);
  assert.equal(inventory.equipmentMaterialValue({ tid: normalTid, quality: 30, star: 1 }), 3);
  assert.equal(inventory.equipmentMaterialValue({ tid: uniqueTid, quality: 50, star: 0 }), 0);
  assert.equal(inventory.equipmentMaterialValue({ tid: spTid, quality: 60, star: 5 }), 0);
  assert.deepEqual(inventory.materialRequirement({ tid: 1120119, quality: 50, star: 0 }), {
    config: tables.FantasyStarUp.get(50000),
    tier: tables.FantasyStarUp.get(40002),
    count: 3,
    unit_value: 54,
    total_value: 162
  });
  assert.deepEqual(inventory.chipRequirement(uniqueTid), { tid: chipTid, point_item: uniqueTid, need_num: 60 });
  assert.deepEqual(inventory.chipRequirement(spTid), { tid: 6008002, point_item: spTid, need_num: 80 });
  assert.throws(() => inventory.equipmentMaterialValue(999999999), decodeCodeError('unknown', 306));
});

test('login ensure preserves blocks 1 and 2 byte-for-byte and initializes a missing module', t => {
  const f = fixture(t);
  const formation = codec.pack('pb_fantasy_formation_list', { formation_list: [] });
  const draw = codec.pack('pb_fantasy_draw', { wish_list: [1200119], total_draw_times: '9', left_buy_times: 7 });
  f.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(FANTASY_EQUIP_MODULE_ID);
    module.value[0] = serializedBinary(Buffer.alloc(0));
    module.value[1] = serializedBinary(formation);
    module.value[2] = serializedBinary(draw);
  });
  const before = moduleBytes(f.store);
  f.store.transaction(model => f.inventory.ensure(model));
  const after = moduleBytes(f.store);
  assert.deepEqual(after[1], before[1]);
  assert.deepEqual(after[2], before[2]);
  assert.deepEqual(persistedInventory(f.store), { equips: [], raw_equips: [], max_equip_id: 0 });
  f.reopen();
  f.store.transaction(model => f.inventory.ensure(model));
  assert.deepEqual(moduleBytes(f.store)[1], before[1]);
  assert.deepEqual(moduleBytes(f.store)[2], before[2]);

  f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    f.inventory.create(current, normalTid, { level: 3, level_exp: 7 });
  }));
  const existing = moduleBytes(f.store);
  f.store.transaction(model => f.inventory.ensure(model));
  const ensured = moduleBytes(f.store);
  assert.deepEqual(ensured[0], existing[0]);
  assert.deepEqual(ensured[1], existing[1]);
  assert.deepEqual(ensured[2], existing[2]);

  f.store.inspect(db => db.prepare('DELETE FROM login_modules WHERE role_id=(SELECT role_id FROM roles LIMIT 1) AND module_id=?').run(FANTASY_EQUIP_MODULE_ID));
  f.store.transaction(model => f.inventory.ensure(model));
  const created = new Map(f.store.state().modules.value).get(FANTASY_EQUIP_MODULE_ID);
  assert.equal(created.value.length, 1);
  assert.equal(rawBinary(created.value[0]).length, 0);
});

test('create fills defaults, increments the UID watermark, and survives restart', t => {
  const f = fixture(t);
  const result = f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    const normal = f.inventory.create(current, normalTid);
    const unique = f.inventory.create(current, uniqueTid);
    const sp = f.inventory.create(current, spTid);
    return { current, normal, unique, sp };
  }));
  const { normal, unique, sp, current } = result.result;
  assert.deepEqual(normal, {
    tid: normalTid, uid: 1, level: 1, star: 0, star_node: 0, break_level: 0,
    quality: 30, bless: [], level_exp: 0
  });
  assert.equal(unique.quality, 50);
  assert.equal(sp.star, 5);
  assert.equal(current.data.max_equip_id, 3);
  assert.equal(result.changes.length, 3);
  assert.deepEqual(result.after, current.data);

  f.reopen();
  const restored = f.store.transaction(model => f.inventory.read(model).data);
  assert.deepEqual(restored.equips.map(equip => equip.uid), [1, 2, 3]);
  assert.equal(restored.max_equip_id, 3);
  const nextUid = f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    return f.inventory.create(current, normalTid).uid;
  })).result;
  assert.equal(nextUid, 4);
  assert.equal(persistedInventory(f.store).max_equip_id, 4);
});

test('invalid tid, duplicate uid, negative raw quantity, watermark regression, and unknown configuration are rejected', t => {
  const f = fixture(t);
  assert.throws(() => f.store.transaction(model => f.inventory.create(f.inventory.read(model), 999999999)), decodeCodeError('invalid tid', 306));
  assert.deepEqual(persistedInventory(f.store), { equips: [], raw_equips: [], max_equip_id: 0 });

  assert.throws(() => f.inventory.validate({ equips: [
    { tid: normalTid, uid: 7 },
    { tid: normalTid, uid: 7 }
  ], raw_equips: [], max_equip_id: 7 }), decodeCodeError('duplicate uid', 5));
  assert.throws(() => f.inventory.validate({ equips: [{ tid: normalTid, uid: 7 }], raw_equips: [], max_equip_id: 6 }), decodeCodeError('watermark', 5));
  assert.throws(() => f.inventory.validate({ equips: [], raw_equips: [{ tid: normalTid, num: -1 }], max_equip_id: 0 }), decodeCodeError('negative raw', 5));
  assert.throws(() => f.inventory.validate({ equips: [], raw_equips: [{ tid: 999999999, num: 1 }], max_equip_id: 0 }), decodeCodeError('unknown raw', 306));

  const capacity = fixture(t, { maxEquipCount: 0 });
  assert.throws(() => capacity.store.transaction(model => capacity.inventory.mutate(model, (_data, current) => capacity.inventory.create(current, normalTid))), decodeCodeError('capacity', 307));
  assert.deepEqual(persistedInventory(capacity.store), { equips: [], raw_equips: [], max_equip_id: 0 });

  setInventory(f.store, { equips: [], raw_equips: [], max_equip_id: 2147483647 });
  assert.throws(() => f.store.transaction(model => f.inventory.create(f.inventory.read(model), normalTid)), decodeCodeError('int32 uid', 307));
  assert.equal(persistedInventory(f.store).max_equip_id, 2147483647);
});

test('raw add, consume-to-zero, insufficient rollback, and restart preserve exact state', t => {
  const f = fixture(t);
  const added = f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    const change = f.inventory.addRaw(current, uniqueTid, 3);
    return change;
  }));
  assert.deepEqual(added.result, { tid: uniqueTid, num: 3, before_num: 0, diff_num: 3 });
  f.reopen();
  assert.deepEqual(persistedInventory(f.store).raw_equips, [{ tid: uniqueTid, num: 3 }]);

  const partial = f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    return f.inventory.consumeRaw(current, uniqueTid, 2);
  }));
  assert.deepEqual(partial.result, { tid: uniqueTid, num: 1, before_num: 3, diff_num: -2, removed: false });
  assert.deepEqual(persistedInventory(f.store).raw_equips, [{ tid: uniqueTid, num: 1 }]);

  const beforeFailure = persistedInventory(f.store);
  assert.throws(() => f.store.transaction(model => {
    const current = f.inventory.read(model);
    f.inventory.consumeRaw(current, uniqueTid, 2);
  }), decodeCodeError('insufficient raw', 301));
  assert.deepEqual(persistedInventory(f.store), beforeFailure);

  const zero = f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    return f.inventory.consumeRaw(current, uniqueTid, 1);
  }));
  assert.equal(zero.result.removed, true);
  assert.deepEqual(persistedInventory(f.store).raw_equips, []);
  f.reopen();
  assert.deepEqual(persistedInventory(f.store).raw_equips, []);
});

test('clone allocates a distinct UID, remove honors blessing references, and external references are discoverable', t => {
  const f = fixture(t);
  const ids = f.store.transaction(model => f.inventory.mutate(model, (_data, current) => {
    const first = f.inventory.create(current, normalTid, { level: 4, level_exp: 9 });
    const second = f.inventory.create(current, normalTid);
    const created = f.inventory.clone(current, first, { level: 5 });
    first.bless = [second.uid];
    return { first: first.uid, second: second.uid, cloned: created.uid, created: structuredClone(created) };
  })).result;
  assert.deepEqual([ids.first, ids.second, ids.cloned], [1, 2, 3]);
  assert.equal(ids.created.uid, 3);
  assert.equal(ids.created.level, 5);
  assert.equal(ids.created.level_exp, 9);

  assert.throws(() => f.store.transaction(model => {
    const current = f.inventory.read(model);
    f.inventory.remove(current, ids.second);
  }), decodeCodeError('blessed material', 5));

  f.store.transaction(model => {
    const current = f.inventory.read(model);
    model.heroInfo.hero_list[0].fantasy_equip = ids.cloned;
    assert.deepEqual(f.inventory.referenceDetails(model, current, ids.cloned).map(value => value.kind), ['hero']);
    assert.throws(() => f.inventory.assertCanRemove(model, current, ids.cloned), decodeCodeError('referenced', 308));
    f.inventory.save(model, current);
  });
});

test('resource-first failure and inventory encoding failure roll back the whole transaction', t => {
  const f = fixture(t);
  f.store.transaction(model => {
    grantResources(model, [[101500, 100]], tables);
    const current = f.inventory.read(model);
    f.inventory.addRaw(current, uniqueTid, 1);
    f.inventory.save(model, current);
  });
  const before = { resources: f.store.read().resources.get('101500').num, inventory: persistedInventory(f.store) };
  assert.throws(() => f.store.transaction(model => {
    consumeResources(model, [[101500, 10]]);
    const current = f.inventory.read(model);
    f.inventory.consumeRaw(current, uniqueTid, 2);
  }), decodeCodeError('raw failure', 301));
  assert.equal(f.store.read().resources.get('101500').num, before.resources);
  assert.deepEqual(persistedInventory(f.store), before.inventory);

  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === 'pb_fantasy_equip_res') throw new Error('forced inventory encode failure');
      return codec.pack(name, value);
    }
  };
  const encoding = fixture(t, { inventoryCodec: brokenCodec });
  encoding.store.transaction(model => grantResources(model, [[101500, 100]], tables));
  const encodingBefore = { resources: encoding.store.read().resources.get('101500').num, inventory: persistedInventory(encoding.store) };
  assert.throws(() => encoding.store.transaction(model => {
    consumeResources(model, [[101500, 10]]);
    encoding.inventory.mutate(model, (_data, current) => encoding.inventory.create(current, normalTid));
  }), /forced inventory encode failure/);
  assert.equal(encoding.store.read().resources.get('101500').num, encodingBefore.resources);
  assert.deepEqual(persistedInventory(encoding.store), encodingBefore.inventory);
});

test('SQLite write failure rolls back resource and module-518 changes', t => {
  const f = fixture(t);
  f.store.transaction(model => grantResources(model, [[101500, 100]], tables));
  const before = { resources: f.store.read().resources.get('101500').num, inventory: persistedInventory(f.store) };
  f.store.inspect(db => db.exec("CREATE TRIGGER fail_fantasy_module BEFORE INSERT ON login_modules WHEN NEW.module_id=518 BEGIN SELECT RAISE(ABORT, 'forced module write failure'); END;"));
  try {
    assert.throws(() => f.store.transaction(model => {
      consumeResources(model, [[101500, 25]]);
      f.inventory.mutate(model, (_data, current) => f.inventory.create(current, normalTid));
    }), /forced module write failure/);
  } finally {
    f.store.inspect(db => db.exec('DROP TRIGGER fail_fantasy_module'));
  }
  assert.equal(f.store.read().resources.get('101500').num, before.resources);
  assert.deepEqual(persistedInventory(f.store), before.inventory);
});

test('concurrent SQLite transactions serialize the UID watermark', async t => {
  const f = fixture(t);
  const databasePath = f.databasePath;
  const workerSource = String.raw`
    import { parentPort, workerData } from 'node:worker_threads';
    const [{ createGameStore }, { createGameCodec }, { readGameTables }, { createFantasyEquipmentInventory }] = await Promise.all([
      import(workerData.storeUrl), import(workerData.codecUrl), import(workerData.tablesUrl), import(workerData.inventoryUrl)
    ]);
    const store = createGameStore({ databasePath: workerData.databasePath, codec: createGameCodec(), serverOpenedAt: workerData.openedAt });
    const inventory = createFantasyEquipmentInventory({ codec: createGameCodec(), tables: readGameTables() });
    try {
      const uid = store.transaction(model => {
        const current = inventory.read(model);
        const equip = inventory.create(current, 1100119);
        inventory.save(model, current);
        return equip.uid;
      });
      parentPort.postMessage({ uid });
    } catch (error) {
      parentPort.postMessage({ error: String(error?.stack ?? error) });
    } finally {
      store.close();
    }
  `;
  const workerUrl = new URL('data:text/javascript,' + encodeURIComponent(workerSource));
  const urls = {
    storeUrl: new URL('../storage/game-store.mjs', import.meta.url).href,
    codecUrl: new URL('../protocol/game-codec.mjs', import.meta.url).href,
    tablesUrl: new URL('../config/game-tables.mjs', import.meta.url).href,
    inventoryUrl: new URL('../game/fantasy-equipment-inventory.mjs', import.meta.url).href
  };
  const run = () => new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { workerData: { ...urls, databasePath, openedAt } });
    worker.once('message', value => value.error ? reject(new Error(value.error)) : resolve(value.uid));
    worker.once('error', reject);
  });
  const uids = await Promise.all([run(), run()]);
  assert.deepEqual([...uids].sort((a, b) => a - b), [1, 2]);
  const restored = persistedInventory(f.store);
  assert.deepEqual(restored.equips.map(equip => Number(equip.uid)).sort((a, b) => a - b), [1, 2]);
  assert.equal(restored.max_equip_id, 2);
});
