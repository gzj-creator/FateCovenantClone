import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createFantasyEquipmentInventory } from '../game/fantasy-equipment-inventory.mjs';
import { createFantasyDrawService } from '../game/fantasy-draw-service.mjs';
import { createFantasySharedDrawService } from '../game/fantasy-shared-draw-service.mjs';
import { createArtifactDrawPool } from '../game/artifact-draw-pool.mjs';
import { createDemigodDrawPool } from '../game/demigod-draw-pool.mjs';
import { createResidentFantasyDrawPool } from '../game/resident-fantasy-draw-pool.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const heroTables = readHeroTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;
const seededResources = [
  670002, 677002, 149002, 808002, 101500,
  300610, 429002, 425002, 427002, 428002, 426002, 423002, 424002, 391002, 392002
];

function seed() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt, modules,
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  };
}

function allGroupIdsFor(draws) {
  const ids = new Set();
  for (const draw of draws) {
    const weight = tables.DrawLibWeight.get(Number(draw.group_weight));
    for (const entry of weight?.weight_group ?? []) ids.add(Number(entry[1]));
    for (const value of weight?.guaranteed_group ?? []) ids.add(Number(value));
  }
  return [...ids];
}

function equipmentGroups(ids, tid = 1200119, quantity = 1) {
  return new Map(ids.map(id => [id, [[1, tid, quantity]]]));
}

const demigodGroupIds = allGroupIdsFor([...heroTables.Draw.values()]);
const residentGroupIds = allGroupIdsFor([heroTables.Draw.get(226)]);

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-shared-draw-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const clock = { seconds: 1793409600 };
  const activeCodec = options.codec ?? codec;
  const randomQueue = [];
  const random = () => randomQueue.length ? randomQueue.shift() : 0.99;
  const demigodGroups = options.demigodGroups ?? equipmentGroups(demigodGroupIds, options.demigodEquipmentTid ?? 1200119);
  const residentGroups = options.residentGroups === false
    ? null
    : (options.residentGroups ?? equipmentGroups(residentGroupIds, options.residentEquipmentTid ?? 1200819));
  const inventory = createFantasyEquipmentInventory({ codec: activeCodec, tables });
  const artifactPool = createArtifactDrawPool({
    tables,
    heroTables,
    random,
    resolveGroup: options.artifactResolveGroup,
    resolveVersion: options.artifactVersionResolver,
    assertOpen: options.artifactAssertOpen
  });
  const demigodPool = createDemigodDrawPool({
    tables,
    heroTables,
    inventory,
    codec: activeCodec,
    random,
    resolveVersion: options.demigodVersionResolver,
    resolveGroup: demigodGroups
      ? id => demigodGroups.get(Number(id)) ?? tables.DrawGroup.get(Number(id))
      : null,
    assertOpen: options.demigodAssertOpen
  });
  const residentPool = createResidentFantasyDrawPool({
    tables,
    heroTables,
    inventory,
    codec: activeCodec,
    random,
    resolveGroup: residentGroups
      ? id => residentGroups.get(Number(id)) ?? tables.DrawGroup.get(Number(id))
      : null,
    pickWish: options.residentPickWish,
    assertOpen: options.residentAssertOpen
  });
  let store, service, fantasyDraw;

  function open() {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    service = createFantasySharedDrawService({
      store,
      codec: activeCodec,
      pools: [artifactPool, demigodPool, residentPool],
      now: () => clock.seconds,
      onDraw: options.onDraw ?? null,
      maxDrawCount: options.maxDrawCount
    });
    fantasyDraw = createFantasyDrawService({ store, codec: activeCodec, tables, now: () => clock.seconds });
  }

  open();
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    clock,
    databasePath,
    inventory,
    artifactPool,
    demigodPool,
    residentPool,
    random,
    setRandom(values) { randomQueue.splice(0, randomQueue.length, ...values); },
    get store() { return store; },
    get service() { return service; },
    get fantasyDraw() { return fantasyDraw; },
    reopen() { store.close(); open(); }
  };
}

function seedResources(store, amount = 1000000, ids = seededResources) {
  store.transaction(model => {
    let index = 0;
    for (const tid of ids) {
      const key = String(tid);
      const existing = model.resources.get(key);
      if (existing) existing.num = String(BigInt(existing.num) + BigInt(amount));
      else model.resources.set(key, { tid: key, num: String(amount), location: [5, null, index++] });
    }
  });
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function artifactCount(store, tid) {
  const module = new Map(store.state().modules.value).get(50);
  const bytes = module ? Buffer.from(rawBinary(module.value?.[0])) : Buffer.alloc(0);
  const data = bytes.length
    ? codec.unpack('pb_artifact_info', bytes)
    : { artifact_list: [], skill_list: [] };
  const row = (data.artifact_list ?? []).find(value => Number(value.tid) === Number(tid));
  return BigInt(row?.num ?? 0);
}

function moduleBlocks(store) {
  const module = new Map(store.state().modules.value).get(518);
  return module?.value.map(rawBinary) ?? [];
}

function drawInfo(store) {
  const bytes = moduleBlocks(store)[2] ?? Buffer.alloc(0);
  return bytes.length ? codec.unpack('pb_fantasy_draw', bytes) : null;
}

function equipmentInfo(store) {
  const bytes = moduleBlocks(store)[0] ?? Buffer.alloc(0);
  return bytes.length ? codec.unpack('pb_fantasy_equip_res', bytes) : { equips: [], raw_equips: [], max_equip_id: 0 };
}

function setDrawModule(store, values = {}) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(518);
    if (!module) module = { value: [], improper: false };
    while (module.value.length < 3) module.value.push(serializedBinary(Buffer.alloc(0)));
    const previous = module.value[2].length ? codec.unpack('pb_fantasy_draw', rawBinary(module.value[2])) : {};
    const draw = {
      wish_list: [], total_draw_times: '0', wish_fail_times: '0',
      refresh_stamp: 1793409600, left_buy_times: 10,
      ...previous,
      ...values
    };
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', draw));
    modules.set(518, module);
    model.state.modules.value = [...modules];
  });
}

function pbResult(result) {
  return codec.unpack('hero_draw_back', result.data);
}

test('601 registration is unique and routes only configured libraries', t => {
  const f = fixture(t);
  assert.equal(f.service.supports601(181), true);
  assert.equal(f.service.supports601(80), true);
  assert.equal(f.service.supports601(226), true);
  assert.equal(f.service.supports601(999), false);
  assert.throws(() => f.service.execute601({ draw_lib: 999 }), error => error.code === 5);
  assert.throws(() => createFantasySharedDrawService({
    store: f.store, codec, pools: [f.artifactPool, f.artifactPool]
  }), /Duplicate fantasy draw library registration: 181/);
});

test('artifact request costs are server-selected and forged cost tids do not mutate state', t => {
  const f = fixture(t);
  seedResources(f.store);
  const beforeFirst = resource(f.store, 670002), beforeSecond = resource(f.store, 677002);
  f.setRandom([0.99, 0]);
  const paidSecond = f.service.execute601({ draw_lib: 181, point_draw_num: 1, specify_item_tid: 677002 });
  assert.equal(resource(f.store, 670002), beforeFirst);
  assert.equal(resource(f.store, 677002), beforeSecond - 1n);
  assert.equal(pbResult(paidSecond).recruit_info.draw_lib, '181');
  assert.equal(pbResult(paidSecond).recruit_info.draw_count, 1);

  const currentFirst = resource(f.store, 670002), currentSecond = resource(f.store, 677002);
  f.setRandom([0, 0]);
  f.service.execute601({ draw_lib: 181 });
  assert.equal(resource(f.store, 670002), currentFirst - 1n);
  assert.equal(resource(f.store, 677002), currentSecond);

  const stableFirst = resource(f.store, 670002), stableSecond = resource(f.store, 677002);
  assert.throws(() => f.service.execute601({ draw_lib: 181, specify_item_tid: 999999 }), error => error.code === 1);
  assert.equal(resource(f.store, 670002), stableFirst);
  assert.equal(resource(f.store, 677002), stableSecond);
});

test('artifact draw validates draw counts and persists ten-draw and guarantee state', t => {
  const f = fixture(t);
  seedResources(f.store, 100000);
  assert.throws(() => f.service.execute601({ draw_lib: 181, point_draw_num: -1 }), error => error.code === 1);
  assert.throws(() => f.service.execute601({ draw_lib: 181, point_draw_num: 1001 }), error => error.code === 1);

  f.setRandom([]);
  const ten = f.service.execute601({ draw_lib: 181, draw_type: 1 });
  assert.equal(pbResult(ten).recruit_info.draw_count, 10);
  assert.equal(ten.valueForLog.draw_count, 10);
  assert.equal(f.store.read().state.fantasyDrawPools.pools['artifact:1:181'].guaranteed_count, '10');

  const beforeGuarantee = artifactCount(f.store, 300610);
  f.setRandom([]);
  f.service.execute601({ draw_lib: 181, point_draw_num: 29 });
  assert.equal(f.store.read().state.fantasyDrawPools.pools['artifact:1:181'].guaranteed_count, '39');
  f.setRandom([0, 0]);
  const fortieth = f.service.execute601({ draw_lib: 181, point_draw_num: 1 });
  assert.equal(fortieth.valueForLog.group_ids[0], 901);
  assert.deepEqual(fortieth.valueForLog.awards, [{ tid: 300610, num: 1 }]);
  assert.equal(artifactCount(f.store, 300610), beforeGuarantee + 1n);
  assert.equal(f.store.read().state.fantasyDrawPools.pools['artifact:1:181'].guaranteed_count, '0');
});

test('artifact guarantee, count and reward counters survive restart', t => {
  const f = fixture(t);
  seedResources(f.store);
  f.setRandom([]);
  f.service.execute601({ draw_lib: 181, point_draw_num: 7 });
  const poolBefore = structuredClone(f.store.read().state.fantasyDrawPools.pools['artifact:1:181']);
  const costBefore = resource(f.store, 670002);
  f.reopen();
  assert.deepEqual(f.store.read().state.fantasyDrawPools.pools['artifact:1:181'], poolBefore);
  assert.equal(resource(f.store, 670002), costBefore);
  f.setRandom([0.99, 0]);
  const next = f.service.execute601({ draw_lib: 181 });
  assert.equal(pbResult(next).recruit_info.draw_count, 8);
  assert.equal(pbResult(next).recruit_info.guaranteed_count, 8);
});

test('demigod draw libraries shared by several versions require an explicit version', t => {
  const f = fixture(t);
  seedResources(f.store);
  const costBefore = resource(f.store, 149002);
  assert.throws(() => f.service.execute601({ draw_lib: 81 }), error => error.code === 305);
  assert.equal(resource(f.store, 149002), costBefore);
  assert.throws(() => createFantasySharedDrawService({
    store: f.store,
    codec,
    pools: [createDemigodDrawPool({
      tables, heroTables, inventory: f.inventory, codec,
      resolveVersion: () => 1,
      resolveGroup: id => equipmentGroups(demigodGroupIds, 1200719).get(Number(id))
    })],
    now: () => f.clock.seconds
  }).execute601({ draw_lib: 81 }), error => error.code === 305);
  assert.equal(resource(f.store, 149002), costBefore);

  const groups = equipmentGroups(demigodGroupIds, 1200719);
  const versionTwo = createFantasySharedDrawService({
    store: f.store,
    codec,
    pools: [createDemigodDrawPool({
      tables, heroTables, inventory: f.inventory, codec,
      resolveVersion: ({ drawLib }) => drawLib === 81 ? 2 : 0,
      resolveGroup: id => groups.get(Number(id))
    })],
    now: () => f.clock.seconds
  });
  f.setRandom([]);
  const success = versionTwo.execute601({ draw_lib: 81 });
  assert.equal(success.value.recruit_info.draw_lib, '81');
  assert.equal(equipmentInfo(f.store).equips[0].tid, '1200719');
  assert.equal(resource(f.store, 149002), costBefore - 1n);
});

test('demigod draw creates five unique fantasy instances and round-trips pb_res_change.extra', t => {
  const f = fixture(t, { demigodVersionResolver: ({ drawLib }) => drawLib === 80 ? 1 : 0 });
  seedResources(f.store);
  const before = resource(f.store, 149002);
  f.setRandom([]);
  const result = f.service.execute601({ draw_lib: 80, draw_type: 1 });
  const response = pbResult(result);
  assert.equal(response.recruit_info.draw_lib, '80');
  assert.equal(response.recruit_info.draw_count, 5);
  assert.equal(resource(f.store, 149002), before - 5n);
  assert.equal(response.decompose_args.length, 0);
  const equipChanges = response.res.changes.filter(change => change.extra?.length);
  assert.equal(equipChanges.length, 5);
  for (const change of equipChanges) {
    const equip = codec.unpack('pb_fantasy_equip', Buffer.from(change.extra, 'base64'));
    assert.equal(equip.tid, '1200119');
    assert.equal(change.diff_num, '1');
  }
  const info = equipmentInfo(f.store);
  assert.equal(info.equips.length, 5);
  assert.equal(new Set(info.equips.map(value => value.uid)).size, 5);
  assert.equal(info.max_equip_id, Math.max(...info.equips.map(value => value.uid)));
});

test('closed demigod activity rejects before consuming resources or assigning equipment', t => {
  const closed = () => false;
  const f = fixture(t, {
    demigodVersionResolver: () => 1,
    demigodAssertOpen: closed
  });
  seedResources(f.store);
  const costBefore = resource(f.store, 149002);
  assert.throws(() => f.service.execute601({ draw_lib: 80 }), error => error.code === 305);
  assert.equal(resource(f.store, 149002), costBefore);
  assert.equal(equipmentInfo(f.store).equips.length, 0);
});

test('resident pool rejects the recovered empty DrawGroup rows without charging', t => {
  const f = fixture(t, { residentGroups: false });
  seedResources(f.store);
  f.fantasyDraw.ensureLoginState();
  const before = resource(f.store, 808002);
  assert.throws(() => f.service.execute601({ draw_lib: 226 }), error => error.code === 5);
  assert.equal(resource(f.store, 808002), before);
  assert.equal(equipmentInfo(f.store).equips.length, 0);
});

test('resident five-draw updates only block 0 and block 2 while preserving formation and wish data', t => {
  const f = fixture(t, { residentPickWish: ({ wishList }) => wishList[0] });
  seedResources(f.store);
  f.fantasyDraw.ensureLoginState();
  setDrawModule(f.store, { total_draw_times: '200', wish_list: [1200719, 1200819], wish_fail_times: '3' });
  f.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(518);
    module.value[1] = serializedBinary(codec.pack('pb_fantasy_formation_list', {
      formation_list: [{ uid: 7, slot_index: 3 }]
    }));
    const current = f.inventory.read(model);
    f.inventory.create(current, 1200719, { level: 4, level_exp: 9 });
    f.inventory.save(model, current);
  });
  const formationBefore = moduleBlocks(f.store)[1];
  const before = resource(f.store, 808002);
  f.setRandom([]);
  const result = f.service.execute601({ draw_lib: 226, draw_type: 1 });
  assert.equal(pbResult(result).recruit_info.draw_count, 205);
  assert.equal(resource(f.store, 808002), before - 5n);
  assert.deepEqual(moduleBlocks(f.store)[1], formationBefore);
  const info = equipmentInfo(f.store);
  assert.equal(info.equips.length, 6);
  assert.equal(new Set(info.equips.map(value => value.uid)).size, 6);
  assert.deepEqual(drawInfo(f.store).wish_list, [1200719, 1200819]);
  assert.equal(drawInfo(f.store).total_draw_times, '205');
  assert.equal(drawInfo(f.store).left_buy_times, 10);
  assert.equal(result.pushEvents[0].kind, 'fantasy_draw_normal_update');
  assert.equal(result.pushEvents[0].pushType, 10101);
  assert.deepEqual(codec.unpack('pb_fantasy_draw', result.pushEvents[0].data), drawInfo(f.store));
});

test('resident fortieth draw uses the guaranteed group and resets pity', t => {
  const f = fixture(t);
  seedResources(f.store);
  f.fantasyDraw.ensureLoginState();
  f.setRandom([0.99, 0]);
  f.service.execute601({ draw_lib: 226 });
  f.store.transaction(model => {
    const pool = model.state.fantasyDrawPools.pools['resident:226'];
    pool.draw_count = '39';
    pool.total_draw_count = '39';
    pool.guaranteed_count = '39';
    const modules = new Map(model.state.modules.value), module = modules.get(518);
    const draw = codec.unpack('pb_fantasy_draw', rawBinary(module.value[2]));
    draw.total_draw_times = '39';
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', draw));
    model.state.modules.value = [...modules];
  });
  f.setRandom([0, 0]);
  const result = f.service.execute601({ draw_lib: 226 });
  assert.deepEqual(result.valueForLog.group_ids, [60101]);
  assert.equal(result.valueForLog.total_draw_times, '40');
  assert.equal(f.store.read().state.fantasyDrawPools.pools['resident:226'].guaranteed_count, '0');
  assert.equal(drawInfo(f.store).total_draw_times, '40');
});

test('resident wish follows 50 percent failure then 100 percent success and resets the counter', t => {
  const f = fixture(t, { residentEquipmentTid: 1200819 });
  seedResources(f.store);
  f.fantasyDraw.ensureLoginState();
  setDrawModule(f.store, { total_draw_times: '200', wish_list: [1200719], wish_fail_times: '0' });
  f.setRandom([0.5, 0, 0.75]);
  const first = f.service.execute601({ draw_lib: 226 });
  assert.equal(first.valueForLog.wish_hits, 0);
  assert.equal(first.valueForLog.awards[0].tid, 1200819);
  assert.equal(drawInfo(f.store).wish_fail_times, '1');

  f.setRandom([0.5, 0, 0.9999]);
  const second = f.service.execute601({ draw_lib: 226 });
  assert.equal(second.valueForLog.wish_hits, 1);
  assert.equal(second.valueForLog.awards[0].tid, 1200719);
  assert.equal(drawInfo(f.store).wish_fail_times ?? '0', '0');
  const info = equipmentInfo(f.store);
  assert.deepEqual(info.equips.map(value => value.tid), ['1200819', '1200719']);
});

test('resident draw, inventory uid watermark and wish counters recover after restart', t => {
  const f = fixture(t);
  seedResources(f.store);
  f.fantasyDraw.ensureLoginState();
  setDrawModule(f.store, { total_draw_times: '200', wish_list: [1200719], wish_fail_times: '0' });
  f.setRandom([0.5, 0, 0.75]);
  f.service.execute601({ draw_lib: 226 });
  const beforeInfo = equipmentInfo(f.store);
  const beforeDraw = drawInfo(f.store);
  assert.equal(beforeDraw.wish_fail_times, '1');
  f.reopen();
  assert.deepEqual(equipmentInfo(f.store), beforeInfo);
  assert.deepEqual(drawInfo(f.store), beforeDraw);
  assert.equal(f.store.read().state.fantasyDrawPools.pools['resident:226'].total_draw_count, '201');
  f.setRandom([0.5, 0, 0.9999]);
  f.service.execute601({ draw_lib: 226 });
  const afterInfo = equipmentInfo(f.store);
  assert.equal(afterInfo.equips.length, beforeInfo.equips.length + 1);
  assert.equal(new Set(afterInfo.equips.map(value => value.uid)).size, afterInfo.equips.length);
  assert.equal(drawInfo(f.store).total_draw_times, '202');
});

test('shared activity callback receives committed cumulative draw events and push descriptors', t => {
  const events = [];
  const f = fixture(t, {
    onDraw(model, event) {
      events.push(structuredClone(event));
      model.state.testDrawTotal = Number(model.state.testDrawTotal ?? 0) + Number(event.count);
      return {
        changes: [],
        pushEvents: [{ kind: 'test.activity.task_progress', total: model.state.testDrawTotal }]
      };
    }
  });
  seedResources(f.store);
  const result = f.service.execute601({ draw_lib: 181, point_draw_num: 2 });
  assert.equal(events.length, 1);
  assert.equal(events[0].pool, 'artifact');
  assert.equal(events[0].count, 2);
  assert.equal(events[0].event.totalDrawCount, '2');
  assert.equal(result.pushEvents[0].kind, 'test.activity.task_progress');
});

test('encoding failure rolls back cost, draw counters and equipment uid allocation', t => {
  const failingCodec = {
    pack(schema, value) {
      if (schema === 'hero_draw_back') throw new Error('injected hero_draw_back encode failure');
      return codec.pack(schema, value);
    },
    unpack: codec.unpack.bind(codec)
  };
  const f = fixture(t, { codec: failingCodec });
  seedResources(f.store);
  const before = resource(f.store, 670002);
  f.setRandom([0, 0]);
  assert.throws(() => f.service.execute601({ draw_lib: 181 }), /injected hero_draw_back encode failure/);
  assert.equal(resource(f.store, 670002), before);
  assert.equal(f.store.read().state.fantasyDrawPools, undefined);
});

test('SQLite write failure rolls back resource and module changes', t => {
  const f = fixture(t);
  seedResources(f.store);
  const before = resource(f.store, 670002);
  f.store.inspect(db => db.exec("CREATE TRIGGER fail_fantasy_draw_resource BEFORE INSERT ON resources WHEN NEW.tid='670002' BEGIN SELECT RAISE(ABORT,'injected sqlite write failure'); END"));
  try {
    f.setRandom([0, 0]);
    assert.throws(() => f.service.execute601({ draw_lib: 181 }), /injected sqlite write failure/);
  } finally {
    f.store.inspect(db => db.exec('DROP TRIGGER fail_fantasy_draw_resource'));
  }
  assert.equal(resource(f.store, 670002), before);
  assert.equal(f.store.read().state.fantasyDrawPools, undefined);
});

test('serialized 601 calls cannot overspend a single affordable draw', t => {
  const f = fixture(t);
  f.store.transaction(model => {
    const tid = '670002';
    model.resources.set(tid, { tid, num: '1', location: [5, null, 0] });
  });
  f.setRandom([0, 0, 0, 0]);
  f.service.execute601({ draw_lib: 181 });
  assert.equal(resource(f.store, 670002), 0n);
  assert.throws(() => f.service.execute601({ draw_lib: 181 }), error => error.code === 301);
  assert.equal(resource(f.store, 670002), 0n);
  assert.equal(f.store.read().state.fantasyDrawPools.pools['artifact:1:181'].total_draw_count, '1');
});
