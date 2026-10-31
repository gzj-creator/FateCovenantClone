import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import {
  createGameCodec,
  decodeEtf,
  encodeEtf,
  rawBinary,
  serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createFantasyEquipmentService } from '../game/fantasy-equipment-service.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;
const MODULE_ID = 518;

const NORMAL_Q30 = 1100119;
const NORMAL_Q40 = 1110119;
const NORMAL_Q50 = 1120119;
const UNIQUE_MATCH_4030801 = 1200619;
const UNIQUE_MATCH_2020601 = 1201219;
const SP_Q60 = 1202919;
const SP_Q70 = 1203419;
const HERO_2010201 = 2010201;
const HERO_2010101 = 2010101;
const HERO_4030801 = 4030801;
const HERO_2020601 = 2020601;

function seed() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: openedAt,
    modules,
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-equipment-service-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let store, service, closed = false;

  function open() {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    service = createFantasyEquipmentService({ store, codec, tables });
    closed = false;
  }

  open();
  t.after(() => {
    if (!closed) store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    get store() { return store; },
    get service() { return service; },
    reopen() {
      if (!closed) store.close();
      open();
    }
  };
}

function moduleBlocks(f) {
  const module = new Map(f.store.state().modules.value).get(MODULE_ID);
  return module ? module.value.map(value => Buffer.from(rawBinary(value))) : null;
}

function inventoryData(f) {
  const bytes = moduleBlocks(f)?.[0];
  return bytes?.length
    ? codec.unpack('pb_fantasy_equip_res', bytes)
    : { equips: [], raw_equips: [], max_equip_id: 0 };
}

function formationData(f) {
  const bytes = moduleBlocks(f)?.[1];
  return bytes?.length
    ? codec.unpack('pb_fantasy_formation_list', bytes)
    : { formation_list: [] };
}

function customFantasyEntries(f, lineupType = 1) {
  const lineup = f.store.read().playLineups.find(value => Number(value.type) === Number(lineupType));
  const attr = lineup?.custom_attr?.find(value => Number(value.type) === 4);
  return attr?.value
    ? codec.unpack('pb_lineup_custom_fantasy_info', Buffer.from(attr.value, 'base64')).fantasy_list ?? []
    : [];
}

function setModuleBlocks(f, { inventory, formation, draw }) {
  f.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(MODULE_ID);
    if (!module) module = { value: [], improper: false };
    while (module.value.length <= 2) module.value.push(serializedBinary(Buffer.alloc(0)));
    if (inventory !== undefined) module.value[0] = serializedBinary(inventory);
    if (formation !== undefined) module.value[1] = serializedBinary(formation);
    if (draw !== undefined) module.value[2] = serializedBinary(draw);
    modules.set(MODULE_ID, module);
    model.state.modules.value = [...modules];
  });
}

function setHeroUid(f, heroTid, uid) {
  f.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(value => Number(value.tid) === Number(heroTid));
    assert.ok(hero, `missing fixture hero ${heroTid}`);
    hero.uid = String(uid);
  });
}

function grantEquipment(f, tid, options) {
  return f.store.transaction(model => f.service.grantEquipment(model, tid, options));
}

function grantRawEquipment(f, tid, amount = 1) {
  return f.store.transaction(model => f.service.grantRawEquipment(model, tid, amount));
}

function addResources(f, rows) {
  f.store.transaction(model => grantResources(model, rows, tables));
}

function resourceNumber(f, tid) {
  return Number(f.store.read().resources.get(String(tid))?.num ?? 0);
}

function runPb(f, type, schema, input) {
  const request = codec.unpack(schema, codec.pack(schema, input));
  return f.service.execute(type, request);
}

async function runEtf(f, type, value) {
  const request = await decodeEtf(await encodeEtf(value));
  return f.service.execute(type, request);
}

function decodeResponse(result, schema) {
  assert.ok(Buffer.isBuffer(result.data), 'PB response must be a Buffer');
  assert.ok(result.data.length > 0, 'PB response must not be empty');
  return codec.unpack(schema, result.data);
}

function expectCode(code) {
  return error => error?.code === code;
}

function snapshot(f) {
  const model = f.store.read();
  return {
    blocks: moduleBlocks(f)?.map(value => Buffer.from(value)) ?? null,
    resources: [...model.resources].map(([tid, value]) => [tid, String(value.num)]).sort(),
    heroes: structuredClone(model.heroInfo.hero_list),
    playLineups: structuredClone(model.playLineups)
  };
}

function assertSnapshot(f, before) {
  assert.deepEqual(snapshot(f), before);
}

function equipIds(...equips) {
  return equips.map(equip => ({ uid: equip.uid, tid: equip.tid }));
}

test('87601/87603 use the hero TID, permit an unrelated hero UID, and keep repeated wear stable', t => {
  const f = fixture(t);
  const runtimeUid = 9000201;
  setHeroUid(f, HERO_2010201, runtimeUid);
  const equip = grantEquipment(f, SP_Q60);

  const put = decodeResponse(
    runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
      hero_tid: HERO_2010201,
      equip: { uid: equip.uid, tid: equip.tid }
    }),
    'pb_fantasy_equip_put_on_rsp'
  );
  assert.equal(put.changed_hero.length, 1);
  assert.equal(Number(put.changed_hero[0].uid), runtimeUid);
  assert.equal(Number(put.changed_hero[0].tid), HERO_2010201);
  assert.equal(Number(put.changed_hero[0].fantasy_equip), Number(equip.uid));
  assert.equal(Number(put.put_on_equip.uid), Number(equip.uid));
  assert.deepEqual(formationData(f).formation_list.map(row => Number(row.uid)), [Number(equip.uid)]);

  const afterWear = snapshot(f);
  assert.throws(
    () => runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
      hero_tid: runtimeUid,
      equip: { uid: equip.uid, tid: equip.tid }
    }),
    expectCode(1)
  );
  assertSnapshot(f, afterWear);

  const repeated = decodeResponse(
    runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
      hero_tid: HERO_2010201,
      equip: { uid: equip.uid, tid: equip.tid }
    }),
    'pb_fantasy_equip_put_on_rsp'
  );
  assert.equal(repeated.changed_hero.length, 0);
  assert.deepEqual(formationData(f).formation_list.map(row => Number(row.uid)), [Number(equip.uid)]);

  const takeOff = decodeResponse(
    runPb(f, 87603, 'pb_fantasy_equip_take_off_req', { hero_tid: HERO_2010201 }),
    'pb_fantasy_equip_take_off_rsp'
  );
  assert.equal(Number(takeOff.changed_equip[0].uid), Number(equip.uid));
  assert.equal(Number(takeOff.hero.fantasy_equip ?? 0), 0);
  assert.deepEqual(formationData(f).formation_list, []);

  const noOp = decodeResponse(
    runPb(f, 87603, 'pb_fantasy_equip_take_off_req', { hero_tid: HERO_2010201 }),
    'pb_fantasy_equip_take_off_rsp'
  );
  assert.deepEqual(noOp.changed_equip, []);
  const beforeInvalidHero = snapshot(f);
  assert.throws(
    () => runPb(f, 87603, 'pb_fantasy_equip_take_off_req', { hero_tid: 999999999 }),
    expectCode(1)
  );
  assertSnapshot(f, beforeInvalidHero);
});

test('87601 reports both owners on cross-hero replacement and does not duplicate formation rows', t => {
  const f = fixture(t);
  const first = grantEquipment(f, SP_Q60);
  const second = grantEquipment(f, SP_Q60);

  runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
    hero_tid: HERO_2010201,
    equip: { uid: first.uid, tid: first.tid }
  });
  runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
    hero_tid: HERO_2010101,
    equip: { uid: second.uid, tid: second.tid }
  });
  const replaced = decodeResponse(
    runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
      hero_tid: HERO_2010101,
      equip: { uid: first.uid, tid: first.tid }
    }),
    'pb_fantasy_equip_put_on_rsp'
  );

  const changed = new Map(replaced.changed_hero.map(hero => [Number(hero.tid), hero]));
  assert.equal(changed.size, 2);
  assert.equal(Number(changed.get(HERO_2010201).fantasy_equip ?? 0), 0);
  assert.equal(Number(changed.get(HERO_2010101).fantasy_equip), Number(first.uid));
  assert.equal(Number(replaced.take_off_equip.uid), Number(second.uid));
  assert.equal(Number(replaced.put_on_equip.uid), Number(first.uid));
  assert.deepEqual(formationData(f).formation_list.map(row => Number(row.uid)), [Number(first.uid)]);
});

test('87605 breakthrough consumes the configured resource and insufficient resource rolls back fully', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, NORMAL_Q30, { level: 20, break_level: 1 });
  addResources(f, [[433002, 10]]);

  const response = decodeResponse(
    runPb(f, 87605, 'pb_fantasy_equip_id', { uid: equip.uid, tid: equip.tid }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.break_level), 2);
  assert.equal(resourceNumber(f, 433002), 0);
  assert.equal(Number(inventoryData(f).equips[0].break_level), 2);

  const afterSuccess = snapshot(f);
  assert.throws(
    () => runPb(f, 87605, 'pb_fantasy_equip_id', { uid: equip.uid, tid: NORMAL_Q40 }),
    expectCode(306)
  );
  assertSnapshot(f, afterSuccess);

  const insufficient = grantEquipment(f, NORMAL_Q30, { level: 20, break_level: 1 });
  addResources(f, [[433002, 9]]);
  const beforeFailure = snapshot(f);
  assert.throws(
    () => runPb(f, 87605, 'pb_fantasy_equip_id', { uid: insufficient.uid, tid: insufficient.tid }),
    expectCode(301)
  );
  assertSnapshot(f, beforeFailure);
});

test('87606 level-up returns PB state, rejects forged materials, and rolls back insufficient resource', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, NORMAL_Q30);
  addResources(f, [[142002, 1]]);

  const response = decodeResponse(
    runPb(f, 87606, 'pb_fantasy_equip_level_up_req', {
      id: { uid: equip.uid, tid: equip.tid },
      costs: [{ tid: 142002, num: 1 }]
    }),
    'pb_fantasy_equip_level_up_rsp'
  );
  assert.ok(Number(response.new_equip.level) > 1);
  assert.equal(resourceNumber(f, 142002), 0);

  const beforeForged = snapshot(f);
  assert.throws(
    () => runPb(f, 87606, 'pb_fantasy_equip_level_up_req', {
      id: { uid: equip.uid, tid: equip.tid },
      costs: [{ tid: 999999999, num: 1 }]
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeForged);
  assert.throws(
    () => runPb(f, 87606, 'pb_fantasy_equip_level_up_req', {
      id: { uid: equip.uid, tid: equip.tid },
      costs: [{ tid: 142002, num: 0 }]
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeForged);

  assert.throws(
    () => runPb(f, 87606, 'pb_fantasy_equip_level_up_req', {
      id: { uid: equip.uid, tid: equip.tid },
      costs: [{ tid: 142002, num: 1 }]
    }),
    expectCode(301)
  );
  assertSnapshot(f, beforeForged);
});

test('87607 supports free star-up, persists excess material value, and enforces the max-star boundary', t => {
  const f = fixture(t);
  const free = grantEquipment(f, NORMAL_Q30);
  const freeResponse = decodeResponse(
    runPb(f, 87607, 'pb_fantasy_equip_composite_req', {
      id: { uid: free.uid, tid: free.tid },
      materials: [],
      raw_materials: []
    }),
    'pb_fantasy_equip_composite_rsp'
  );
  assert.equal(Number(freeResponse.new_equip.star), 1);
  assert.equal(Number(freeResponse.over_value ?? 0), 0);

  const beforeMaxReject = snapshot(f);
  assert.throws(
    () => runPb(f, 87607, 'pb_fantasy_equip_composite_req', {
      id: { uid: free.uid, tid: free.tid },
      materials: [],
      raw_materials: []
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeMaxReject);

  const overflow = grantEquipment(f, NORMAL_Q40);
  grantRawEquipment(f, NORMAL_Q40, 1);
  const overflowResponse = decodeResponse(
    runPb(f, 87607, 'pb_fantasy_equip_composite_req', {
      id: { uid: overflow.uid, tid: overflow.tid },
      materials: [],
      raw_materials: [{ tid: NORMAL_Q40, num: 1 }]
    }),
    'pb_fantasy_equip_composite_rsp'
  );
  assert.equal(Number(overflowResponse.new_equip.star), 1);
  assert.equal(Number(overflowResponse.over_value), 3);
  assert.deepEqual(inventoryData(f).raw_equips.map(row => [Number(row.tid), Number(row.num)]), [[NORMAL_Q30, 3]]);

  const overflowState = snapshot(f);
  f.reopen();
  assertSnapshot(f, overflowState);

  grantRawEquipment(f, UNIQUE_MATCH_4030801, 1);
  const beforeForged = snapshot(f);
  assert.throws(
    () => runPb(f, 87607, 'pb_fantasy_equip_composite_req', {
      id: { uid: overflow.uid, tid: overflow.tid },
      materials: [],
      raw_materials: [{ tid: UNIQUE_MATCH_4030801, num: 1 }]
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeForged);
});

test('87608 advances unique equipment through the SP star table with times=0 as one server step', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, UNIQUE_MATCH_4030801);
  const chip = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_4030801);
  const row = tables.FantasySpStarUp.get(50000);
  const chipCost = Number(row.cost_num);
  addResources(f, [[chip.tid, chipCost]]);

  const response = decodeResponse(
    runPb(f, 87608, 'pb_fantasy_equip_dev_req', {
      id: { uid: equip.uid, tid: equip.tid },
      times: 0,
      args: []
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.star ?? 0), 0);
  assert.equal(Number(response.new_equip.star_node), 1);
  assert.equal(resourceNumber(f, chip.tid), 0);
});

test('87608 rejects a repeated request at max star without charging chip or stone again', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, UNIQUE_MATCH_4030801, { star: 5 });
  const chip = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_4030801);
  const row = tables.FantasySpStarUp.get(50005);
  const equipConfig = tables.FantasyEquip.get(UNIQUE_MATCH_4030801);
  // HeroTable.Hero overrides the legacy generic table in game-tables; use the
  // same hero camp selection as FantasyEquipMgr when the equipment is unique.
  const hero = tables.Hero.get(Number(equipConfig.hero));
  const camp = Number(hero?.camp ?? equipConfig.profession);
  const campStones = tables.FantasyStarStoneTid.get(camp).item;
  addResources(f, [
    [chip.tid, Number(row.cost_num) * 2],
    ...campStones.map(tid => [tid, Number(row.stone_num) * 2])
  ]);
  const resourceBefore = new Map([[chip.tid, resourceNumber(f, chip.tid)]]);
  for (const tid of campStones) resourceBefore.set(tid, resourceNumber(f, tid));

  const response = decodeResponse(
    runPb(f, 87608, 'pb_fantasy_equip_dev_req', {
      id: { uid: equip.uid, tid: equip.tid },
      times: 0,
      args: []
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.star), 5);
  assert.equal(Number(response.new_equip.star_node), 1);
  assert.equal(resourceNumber(f, chip.tid), resourceBefore.get(chip.tid) - Number(row.cost_num));
  for (const tid of campStones) {
    assert.equal(resourceNumber(f, tid), resourceBefore.get(tid) - Number(row.stone_num));
  }
  assert.equal(resourceNumber(f, row.stone_tid), resourceBefore.get(row.stone_tid) - Number(row.stone_num));

  const atCap = snapshot(f);
  assert.throws(
    () => runPb(f, 87608, 'pb_fantasy_equip_dev_req', {
      id: { uid: equip.uid, tid: equip.tid },
      times: 0,
      args: []
    }),
    expectCode(308)
  );
  assertSnapshot(f, atCap);
});

test('87608 advances SP equipment with the SP chip and god-stone costs', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, SP_Q60, { star: 5 });
  const chip = tables.FantasyChipByPointItem.get(SP_Q60);
  const row = tables.FantasySpStarUp.get(60005);
  addResources(f, [
    [chip.tid, Number(row.ur_cost_num)],
    [row.sp_god_stone_tid, Number(row.sp_god_stone_num)]
  ]);

  const beforeInvalidTimes = snapshot(f);
  assert.throws(
    () => runPb(f, 87608, 'pb_fantasy_equip_dev_req', {
      id: { uid: equip.uid, tid: equip.tid },
      times: 101,
      args: []
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeInvalidTimes);

  const response = decodeResponse(
    runPb(f, 87608, 'pb_fantasy_equip_dev_req', {
      id: { uid: equip.uid, tid: equip.tid },
      times: 0,
      args: []
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.star), 6);
  assert.equal(Number(response.new_equip.star_node ?? 0), 0);
  assert.equal(resourceNumber(f, chip.tid), 0);
  assert.equal(resourceNumber(f, row.sp_god_stone_tid), 0);
});

test('87608 charges only the SP god stone even when the unique stone column repeats its tid', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, SP_Q60, { star: 6 });
  const chip = tables.FantasyChipByPointItem.get(SP_Q60);
  const row = tables.FantasySpStarUp.get(60006);
  assert.equal(Number(row.stone_tid), Number(row.sp_god_stone_tid));
  addResources(f, [
    [chip.tid, Number(row.ur_cost_num)],
    [row.sp_god_stone_tid, Number(row.sp_god_stone_num)]
  ]);

  const response = decodeResponse(
    runPb(f, 87608, 'pb_fantasy_equip_dev_req', {
      id: { uid: equip.uid, tid: equip.tid },
      times: 0,
      args: []
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.star), 7);
  assert.equal(Number(response.new_equip.star_node ?? 0), 0);
  assert.equal(resourceNumber(f, chip.tid), 0);
  assert.equal(resourceNumber(f, row.sp_god_stone_tid), 0);
  for (const tid of tables.FantasyStarStoneTid.get(Number(tables.FantasyEquip.get(SP_Q60).profession)).item) {
    if (Number(tid) === Number(row.sp_god_stone_tid)) continue;
    assert.equal(resourceNumber(f, tid), 0);
  }
});

test('87609 quality-up replaces the target item, resets star, and rejects a non-max equipment', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, NORMAL_Q30, { star: 1 });
  grantRawEquipment(f, NORMAL_Q30, 2);

  const response = decodeResponse(
    runPb(f, 87609, 'pb_fantasy_equip_composite_req', {
      id: { uid: equip.uid, tid: equip.tid },
      materials: [],
      raw_materials: [{ tid: NORMAL_Q30, num: 2 }]
    }),
    'pb_fantasy_equip_composite_rsp'
  );
  assert.equal(Number(response.new_equip.tid), NORMAL_Q40);
  assert.equal(Number(response.new_equip.quality), 40);
  assert.equal(Number(response.new_equip.star ?? 0), 0);
  assert.deepEqual(inventoryData(f).raw_equips, []);

  const notMax = grantEquipment(f, NORMAL_Q30);
  const beforeReject = snapshot(f);
  assert.throws(
    () => runPb(f, 87609, 'pb_fantasy_equip_composite_req', {
      id: { uid: notMax.uid, tid: notMax.tid },
      materials: [],
      raw_materials: []
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeReject);
});

test('87610 consumes ItemTable.Chip stock from resources before creating the target equipment', async t => {
  const f = fixture(t);
  const chip = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_4030801);
  addResources(f, [[chip.tid, chip.need_num * 2]]);

  const result = await runEtf(f, 87610, UNIQUE_MATCH_4030801);
  const response = decodeResponse(result, 'pb_res_to_client');
  assert.equal(response.changes.length, 1);
  assert.equal(Number(response.changes[0].tid), Number(chip.tid));
  assert.equal(resourceNumber(f, chip.tid), chip.need_num);
  assert.deepEqual(inventoryData(f).equips.map(equip => Number(equip.tid)), [UNIQUE_MATCH_4030801]);
});

test('87610 batch failure rolls back every chip and created equipment while accepting the ETF list shape', async t => {
  const f = fixture(t);
  const first = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_4030801);
  const second = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_2020601);
  addResources(f, [[first.tid, first.need_num], [second.tid, second.need_num - 1]]);
  const before = snapshot(f);

  assert.equal(await decodeEtf(await encodeEtf([UNIQUE_MATCH_4030801, UNIQUE_MATCH_2020601])).then(value => Array.isArray(value)), true);
  await assert.rejects(
    async () => runEtf(f, 87610, [UNIQUE_MATCH_4030801, UNIQUE_MATCH_2020601]),
    expectCode(301)
  );
  assertSnapshot(f, before);
});

test('87610 rejects duplicate ids and a repeated request does not deduct the chip twice', async t => {
  const f = fixture(t);
  const chip = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_4030801);
  addResources(f, [[chip.tid, chip.need_num]]);
  const before = snapshot(f);

  await assert.rejects(
    async () => runEtf(f, 87610, [UNIQUE_MATCH_4030801, UNIQUE_MATCH_4030801]),
    expectCode(1)
  );
  assertSnapshot(f, before);

  await runEtf(f, 87610, [UNIQUE_MATCH_4030801]);
  const afterFirst = snapshot(f);
  assert.equal(resourceNumber(f, chip.tid), 0);
  assert.equal(inventoryData(f).equips.length, 1);

  await assert.rejects(
    async () => runEtf(f, 87610, [UNIQUE_MATCH_4030801]),
    expectCode(301)
  );
  assertSnapshot(f, afterFirst);
});

test('87610 serializes concurrent chip deductions so only one of two requests succeeds', async t => {
  const f = fixture(t);
  const chip = tables.FantasyChipByPointItem.get(UNIQUE_MATCH_4030801);
  addResources(f, [[chip.tid, chip.need_num]]);

  const workerSource = String.raw`
    import { parentPort, workerData } from 'node:worker_threads';
    const [{ createGameStore }, { createGameCodec, decodeEtf, encodeEtf }, { readGameTables }, { createFantasyEquipmentService }] = await Promise.all([
      import(workerData.storeUrl), import(workerData.codecUrl), import(workerData.tablesUrl), import(workerData.serviceUrl)
    ]);
    const codec = createGameCodec();
    const store = createGameStore({ databasePath: workerData.databasePath, codec, serverOpenedAt: workerData.openedAt });
    const service = createFantasyEquipmentService({ store, codec, tables: readGameTables() });
    try {
      const request = await decodeEtf(await encodeEtf([workerData.tid]));
      const result = service.execute(87610, request);
      parentPort.postMessage({ ok: true, bytes: result.data.length });
    } catch (error) {
      parentPort.postMessage({ ok: false, code: error?.code ?? null, message: String(error?.message ?? error) });
    } finally {
      store.close();
    }
  `;
  const workerUrl = new URL('data:text/javascript,' + encodeURIComponent(workerSource));
  const urls = {
    storeUrl: new URL('../storage/game-store.mjs', import.meta.url).href,
    codecUrl: new URL('../protocol/game-codec.mjs', import.meta.url).href,
    tablesUrl: new URL('../config/game-tables.mjs', import.meta.url).href,
    serviceUrl: new URL('../game/fantasy-equipment-service.mjs', import.meta.url).href
  };
  const run = () => new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, {
      workerData: { ...urls, databasePath: f.databasePath, openedAt, tid: UNIQUE_MATCH_4030801 }
    });
    worker.once('message', resolve);
    worker.once('error', reject);
  });

  const results = await Promise.all([run(), run()]);
  const failures = results.filter(result => !result.ok);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].code, 301);

  const inventory = inventoryData(f);
  assert.equal(inventory.equips.length, 1);
  assert.equal(Number(inventory.equips[0].tid), UNIQUE_MATCH_4030801);
  assert.equal(resourceNumber(f, chip.tid), 0);
});

test('87604 applies existing blessing material and returns the main plus blessing equipment in PB', t => {
  const f = fixture(t);
  const main = grantEquipment(f, NORMAL_Q50, { star: 5 });
  const first = grantEquipment(f, NORMAL_Q50);
  const second = grantEquipment(f, NORMAL_Q50);

  const response = decodeResponse(
    runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
      equip: { uid: main.uid, tid: main.tid },
      bless_material: [
        { equip: { uid: first.uid, tid: first.tid } },
        { equip: { uid: second.uid, tid: second.tid } }
      ]
    }),
    'pb_fantasy_equip_bless_rsp'
  );
  assert.equal(response.equips.length, 3);
  assert.deepEqual(response.equips[0].bless.map(Number), [Number(first.uid), Number(second.uid)]);
  assert.deepEqual(
    inventoryData(f).equips.find(equip => Number(equip.uid) === Number(main.uid)).bless.map(Number),
    [Number(first.uid), Number(second.uid)]
  );
});

test('87604 composes blessing material atomically and rejects forged target quality or star', t => {
  const f = fixture(t);
  const main = grantEquipment(f, NORMAL_Q50, { star: 5 });
  grantRawEquipment(f, NORMAL_Q50, 1);
  const submittedStarRow = tables.FantasyStarUp.get(50000);
  const requiredTierRow = tables.FantasyStarUp.get(Number(submittedStarRow.need_mat));
  const requiredValue = Number(submittedStarRow.need_cost) * Number(requiredTierRow.value);
  const submittedEquipmentValue = Number(submittedStarRow.value);
  const expectedOver = submittedEquipmentValue - requiredValue;

  const response = decodeResponse(
    runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
      equip: { uid: main.uid, tid: main.tid },
      bless_material: [{
        composite_req: {
          tid: NORMAL_Q50,
          target_quality: 50,
          target_star: 0,
          materials: [],
          raw_materials: [{ tid: NORMAL_Q50, num: 1 }]
        }
      }]
    }),
    'pb_fantasy_equip_bless_rsp'
  );
  assert.equal(response.equips.length, 2);
  assert.equal(Number(response.over_value), expectedOver);
  assert.deepEqual(inventoryData(f).raw_equips.map(row => [Number(row.tid), Number(row.num)]), [[NORMAL_Q30, expectedOver]]);

  grantRawEquipment(f, NORMAL_Q50, 1);
  for (const [targetQuality, targetStar] of [[60, 0], [50, 1]]) {
    const beforeForged = snapshot(f);
    assert.throws(
      () => runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
        equip: { uid: main.uid, tid: main.tid },
        bless_material: [{
          composite_req: {
            tid: NORMAL_Q50,
            target_quality: targetQuality,
            target_star: targetStar,
            materials: [],
            raw_materials: [{ tid: NORMAL_Q50, num: 1 }]
          }
        }]
      }),
      expectCode(1)
    );
    assertSnapshot(f, beforeForged);
  }
});

test('87604 rejects locked slots, self/duplicate material, and over-count without changing 518', t => {
  const f = fixture(t);
  const locked = grantEquipment(f, NORMAL_Q50, { star: 2 });
  const candidate = grantEquipment(f, NORMAL_Q50);
  const beforeLocked = snapshot(f);
  assert.throws(
    () => runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
      equip: { uid: locked.uid, tid: locked.tid },
      bless_material: [{ equip: { uid: candidate.uid, tid: candidate.tid } }]
    }),
    expectCode(305)
  );
  assertSnapshot(f, beforeLocked);

  const main = grantEquipment(f, NORMAL_Q50, { star: 3 });
  const beforeSelf = snapshot(f);
  assert.throws(
    () => runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
      equip: { uid: main.uid, tid: main.tid },
      bless_material: [{ equip: { uid: main.uid, tid: main.tid } }]
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeSelf);

  const second = grantEquipment(f, NORMAL_Q50);
  const beforeOverCount = snapshot(f);
  assert.throws(
    () => runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
      equip: { uid: main.uid, tid: main.tid },
      bless_material: [
        { equip: { uid: candidate.uid, tid: candidate.tid } },
        { equip: { uid: second.uid, tid: second.tid } }
      ]
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeOverCount);
});

test('87611 round-trips custom fantasy PB and rejects bad hero, lineup, and equipment identities', t => {
  const f = fixture(t);
  const main = grantEquipment(f, UNIQUE_MATCH_4030801, { star: 5 });
  const blessing = grantEquipment(f, NORMAL_Q50);

  const response = decodeResponse(
    runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
      hero_tid: HERO_4030801,
      equip: { uid: main.uid, tid: main.tid },
      bless_equip: equipIds(blessing),
      lineup_type: 1
    }),
    'pb_fantasy_equip_lineup_custom_rsp'
  );
  const attr = response.lineup.custom_attr.find(value => Number(value.type) === 4);
  assert.ok(attr);
  const custom = codec.unpack('pb_lineup_custom_fantasy_info', Buffer.from(attr.value, 'base64'));
  assert.equal(custom.fantasy_list.length, 1);
  assert.equal(Number(custom.fantasy_list[0].hero_tid), HERO_4030801);
  assert.equal(Number(custom.fantasy_list[0].fantasy_uid), Number(main.uid));
  assert.deepEqual(custom.fantasy_list[0].bless_fantasy.map(Number), [Number(blessing.uid)]);

  const beforeInvalid = snapshot(f);
  assert.throws(
    () => runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
      hero_tid: HERO_2010201,
      equip: { uid: main.uid, tid: main.tid },
      bless_equip: [],
      lineup_type: 1
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeInvalid);
  assert.throws(
    () => runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
      hero_tid: HERO_4030801,
      equip: { uid: main.uid, tid: main.tid },
      bless_equip: [],
      lineup_type: 999
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeInvalid);
  assert.throws(
    () => runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
      hero_tid: HERO_4030801,
      equip: { uid: main.uid, tid: NORMAL_Q50 },
      bless_equip: [],
      lineup_type: 1
    }),
    expectCode(306)
  );
  assertSnapshot(f, beforeInvalid);
});

test('87611 rejects blessing equipment already owned by another main equipment', t => {
  const f = fixture(t);
  const owner = grantEquipment(f, NORMAL_Q50, { star: 5 });
  const candidate = grantEquipment(f, NORMAL_Q50);
  runPb(f, 87604, 'pb_fantasy_equip_bless_req', {
    equip: { uid: owner.uid, tid: owner.tid },
    bless_material: [{ equip: { uid: candidate.uid, tid: candidate.tid } }]
  });
  const otherMain = grantEquipment(f, UNIQUE_MATCH_4030801, { star: 5 });
  const before = snapshot(f);

  assert.throws(
    () => runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
      hero_tid: HERO_4030801,
      equip: { uid: otherMain.uid, tid: otherMain.tid },
      bless_equip: equipIds(candidate),
      lineup_type: 1
    }),
    expectCode(308)
  );
  assertSnapshot(f, before);
});

test('87611 rejects a blessing request when the main equipment has not unlocked the slot', t => {
  const f = fixture(t);
  const main = grantEquipment(f, UNIQUE_MATCH_4030801);
  const candidate = grantEquipment(f, NORMAL_Q50);
  const before = snapshot(f);

  assert.throws(
    () => runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
      hero_tid: HERO_4030801,
      equip: { uid: main.uid, tid: main.tid },
      bless_equip: equipIds(candidate),
      lineup_type: 1
    }),
    expectCode(305)
  );
  assertSnapshot(f, before);
});

test('87613 applies a one-key custom lineup and rolls the whole PB request back on one bad equip', t => {
  const f = fixture(t);
  const first = grantEquipment(f, UNIQUE_MATCH_4030801);
  const second = grantEquipment(f, UNIQUE_MATCH_2020601);

  const response = decodeResponse(
    runPb(f, 87613, 'pb_fantasy_equip_lineup_one_key_req', {
      lineup_type: 1,
      equip_reqs: [
        { hero_tid: HERO_4030801, equip: { uid: first.uid, tid: first.tid }, bless_equip: [] },
        { hero_tid: HERO_2020601, equip: { uid: second.uid, tid: second.tid }, bless_equip: [] }
      ]
    }),
    'pb_fantasy_equip_lineup_one_key_rsp'
  );
  assert.equal(response.lineup.length, 1);
  const attr = response.lineup[0].custom_attr.find(value => Number(value.type) === 4);
  const custom = codec.unpack('pb_lineup_custom_fantasy_info', Buffer.from(attr.value, 'base64'));
  assert.equal(custom.fantasy_list.length, 2);

  const beforeFailure = snapshot(f);
  assert.throws(
    () => runPb(f, 87613, 'pb_fantasy_equip_lineup_one_key_req', {
      lineup_type: 1,
      equip_reqs: [
        { hero_tid: HERO_4030801, equip: { uid: first.uid, tid: first.tid }, bless_equip: [] },
        { hero_tid: HERO_2020601, equip: { uid: second.uid, tid: NORMAL_Q50 }, bless_equip: [] }
      ]
    }),
    expectCode(306)
  );
  assertSnapshot(f, beforeFailure);
});

test('87611 and 87613 custom lineups survive a SQLite restart with their blessing ids', t => {
  const f = fixture(t);
  const main = grantEquipment(f, UNIQUE_MATCH_4030801, { star: 5 });
  const blessing = grantEquipment(f, NORMAL_Q50);
  runPb(f, 87611, 'pb_fantasy_equip_lineup_custom_req', {
    hero_tid: HERO_4030801,
    equip: { uid: main.uid, tid: main.tid },
    bless_equip: equipIds(blessing),
    lineup_type: 1
  });

  const second = grantEquipment(f, UNIQUE_MATCH_2020601, { star: 5 });
  const secondBlessing = grantEquipment(f, NORMAL_Q50);
  runPb(f, 87613, 'pb_fantasy_equip_lineup_one_key_req', {
    lineup_type: 1,
    equip_reqs: [{
      hero_tid: HERO_2020601,
      equip: { uid: second.uid, tid: second.tid },
      bless_equip: equipIds(secondBlessing)
    }]
  });

  const beforeLineups = structuredClone(f.store.read().playLineups);
  const entries = customFantasyEntries(f);
  assert.deepEqual(entries.map(row => [
    Number(row.hero_tid),
    Number(row.fantasy_uid),
    (row.bless_fantasy ?? []).map(Number)
  ]), [
    [HERO_4030801, Number(main.uid), [Number(blessing.uid)]],
    [HERO_2020601, Number(second.uid), [Number(secondBlessing.uid)]]
  ]);

  f.reopen();
  assert.deepEqual(f.store.read().playLineups, beforeLineups);
  assert.deepEqual(customFantasyEntries(f), entries);
});

test('87614 persists the PB formation report, returns ETF fallback, and rejects duplicate or missing ids', async t => {
  const f = fixture(t);
  const first = grantEquipment(f, SP_Q60);
  const second = grantEquipment(f, SP_Q60);

  const result = runPb(f, 87614, 'pb_fantasy_formation_list', {
    formation_list: [
      { uid: first.uid, slot_index: 1 },
      { uid: second.uid, slot_index: 2 }
    ]
  });
  assert.equal(await decodeEtf(result.data), 1);
  assert.deepEqual(
    formationData(f).formation_list.map(row => [Number(row.uid), Number(row.slot_index)]),
    [[Number(first.uid), 1], [Number(second.uid), 2]]
  );

  const beforeFailure = snapshot(f);
  assert.throws(
    () => runPb(f, 87614, 'pb_fantasy_formation_list', {
      formation_list: [
        { uid: first.uid, slot_index: 1 },
        { uid: first.uid, slot_index: 2 }
      ]
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeFailure);
  assert.throws(
    () => runPb(f, 87614, 'pb_fantasy_formation_list', {
      formation_list: [{ uid: 999999999, slot_index: 1 }]
    }),
    expectCode(306)
  );
  assertSnapshot(f, beforeFailure);
});

test('87615 raises q60 SP equipment to q70 star 5, persists, and rejects forged or repeated cost lists', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, SP_Q60, { star: 10 });
  const chip = tables.FantasyChipByPointItem.get(SP_Q60);
  const target = tables.FantasySpStarUp.get(70005);
  const correctCosts = [
    { tid: chip.tid, num: Number(target.ur_cost_num) },
    { tid: target.sp_god_stone_tid, num: Number(target.sp_god_stone_num) }
  ];
  addResources(f, correctCosts.map(row => [row.tid, row.num]));

  const beforeForged = snapshot(f);
  assert.throws(
    () => runPb(f, 87615, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: [{ tid: correctCosts[0].tid, num: 1 }]
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeForged);

  const response = decodeResponse(
    runPb(f, 87615, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: correctCosts
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.quality), 70);
  assert.equal(Number(response.new_equip.star), 5);
  assert.equal(resourceNumber(f, chip.tid), 0);
  assert.equal(resourceNumber(f, target.sp_god_stone_tid), 0);

  const afterQualityUp = snapshot(f);
  f.reopen();
  assertSnapshot(f, afterQualityUp);
  const restored = inventoryData(f).equips.find(value => Number(value.uid) === Number(equip.uid));
  assert.equal(Number(restored.quality), 70);
  assert.equal(Number(restored.star), 5);

  addResources(f, [[chip.tid, 999], [target.sp_god_stone_tid, 999]]);
  const beforeRepeat = snapshot(f);
  assert.throws(
    () => runPb(f, 87615, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: correctCosts
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeRepeat);
});

test('q60 quality-up keeps its equipment tid and can continue through 87616 after restart', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, SP_Q60, { star: 10 });
  const chip = tables.FantasyChipByPointItem.get(SP_Q60);
  const row = tables.FantasySpStarUp.get(70005);
  const costList = [
    { tid: chip.tid, num: Number(row.ur_cost_num) },
    { tid: row.sp_god_stone_tid, num: Number(row.sp_god_stone_num) }
  ];
  addResources(f, costList.map(value => [value.tid, value.num * 2]));

  const qualityUp = decodeResponse(
    runPb(f, 87615, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: costList
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(qualityUp.new_equip.tid), SP_Q60);
  assert.equal(Number(qualityUp.new_equip.quality), 70);
  assert.equal(Number(qualityUp.new_equip.star), 5);

  f.reopen();
  const starUp = decodeResponse(
    runPb(f, 87616, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: costList
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(starUp.new_equip.tid), SP_Q60);
  assert.equal(Number(starUp.new_equip.quality), 70);
  assert.equal(Number(starUp.new_equip.star), 6);
  assert.equal(Number(starUp.new_equip.star_node ?? 0), 0);
  assert.equal(resourceNumber(f, chip.tid), 0);
  assert.equal(resourceNumber(f, row.sp_god_stone_tid), 0);

  f.reopen();
  const restored = inventoryData(f).equips.find(value => Number(value.uid) === Number(equip.uid));
  assert.equal(Number(restored.tid), SP_Q60);
  assert.equal(Number(restored.quality), 70);
  assert.equal(Number(restored.star), 6);
});

test('87616 advances q70 SP star to max, persists, and rejects the wrong quality or forged cost list', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, SP_Q70, { star: 5 });
  const chip = tables.FantasyChipByPointItem.get(SP_Q70);
  const row = tables.FantasySpStarUp.get(70005);
  const correctCosts = [
    { tid: chip.tid, num: Number(row.ur_cost_num) },
    { tid: row.sp_god_stone_tid, num: Number(row.sp_god_stone_num) }
  ];
  addResources(f, correctCosts.map(value => [value.tid, value.num]));

  const q60 = grantEquipment(f, SP_Q60, { star: 5 });
  const beforeWrongQuality = snapshot(f);
  assert.throws(
    () => runPb(f, 87616, 'pb_fantasy_awakening_req', {
      equip: { uid: q60.uid, tid: q60.tid },
      cost_list: []
    }),
    expectCode(308)
  );
  assertSnapshot(f, beforeWrongQuality);
  assert.throws(
    () => runPb(f, 87616, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: [{ tid: correctCosts[0].tid, num: 1 }]
    }),
    expectCode(1)
  );
  assertSnapshot(f, beforeWrongQuality);

  const response = decodeResponse(
    runPb(f, 87616, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: correctCosts
    }),
    'pb_fantasy_equip_dev_rsp'
  );
  assert.equal(Number(response.new_equip.star), 6);
  assert.equal(resourceNumber(f, chip.tid), 0);
  assert.equal(resourceNumber(f, row.sp_god_stone_tid), 0);

  const afterFirstStar = snapshot(f);
  f.reopen();
  assertSnapshot(f, afterFirstStar);
  assert.equal(
    Number(inventoryData(f).equips.find(value => Number(value.uid) === Number(equip.uid)).star),
    6
  );

  const campStones = tables.FantasyStarStoneTid.get(3).item;
  addResources(f, [
    [chip.tid, 10000],
    ...campStones.map(tid => [tid, 1000])
  ]);
  for (let star = 6; star < 10; star += 1) {
    const advanced = decodeResponse(
      runPb(f, 87616, 'pb_fantasy_awakening_req', {
        equip: { uid: equip.uid, tid: equip.tid },
        cost_list: []
      }),
      'pb_fantasy_equip_dev_rsp'
    );
    assert.equal(Number(advanced.new_equip.star), star + 1);
    assert.equal(Number(advanced.new_equip.star_node ?? 0), 0);
  }

  const atCap = snapshot(f);
  assert.throws(
    () => runPb(f, 87616, 'pb_fantasy_awakening_req', {
      equip: { uid: equip.uid, tid: equip.tid },
      cost_list: []
    }),
    expectCode(308)
  );
  assertSnapshot(f, atCap);

  f.reopen();
  assertSnapshot(f, atCap);
});

test('SQLite login-module write failure rolls back equipment, resources, heroes, and formation', t => {
  const f = fixture(t);
  const equip = grantEquipment(f, NORMAL_Q30);
  addResources(f, [[142002, 1]]);
  const before = snapshot(f);
  f.store.inspect(db => db.exec(`
    CREATE TRIGGER fail_fantasy_module_518
    BEFORE INSERT ON login_modules
    WHEN NEW.module_id = 518
    BEGIN
      SELECT RAISE(ABORT, 'forced fantasy module write failure');
    END;
  `));
  try {
    assert.throws(
      () => runPb(f, 87606, 'pb_fantasy_equip_level_up_req', {
        id: { uid: equip.uid, tid: equip.tid },
        costs: [{ tid: 142002, num: 1 }]
      }),
      /forced fantasy module write failure/
    );
  } finally {
    f.store.inspect(db => db.exec('DROP TRIGGER fail_fantasy_module_518'));
  }
  assertSnapshot(f, before);
});

test('module 518 keeps blocks 0, 1, and 2 independent through a mutation and SQLite restart', t => {
  const f = fixture(t);
  const emptyFormation = codec.pack('pb_fantasy_formation_list', { formation_list: [] });
  const draw = codec.pack('pb_fantasy_draw', {
    wish_list: [UNIQUE_MATCH_4030801, UNIQUE_MATCH_2020601],
    total_draw_times: '19',
    left_buy_times: 7
  });
  setModuleBlocks(f, { inventory: Buffer.alloc(0), formation: emptyFormation, draw });
  const initialDraw = Buffer.from(draw);

  f.service.ensureLoginState();
  assert.deepEqual(moduleBlocks(f)[1], Buffer.from(emptyFormation));
  assert.deepEqual(moduleBlocks(f)[2], initialDraw);

  const equip = grantEquipment(f, SP_Q60);
  assert.deepEqual(moduleBlocks(f)[1], Buffer.from(emptyFormation));
  assert.deepEqual(moduleBlocks(f)[2], initialDraw);

  runPb(f, 87601, 'pb_fantasy_equip_put_on_req', {
    hero_tid: HERO_2010201,
    equip: { uid: equip.uid, tid: equip.tid }
  });
  assert.deepEqual(moduleBlocks(f)[2], initialDraw);
  const beforeRestart = moduleBlocks(f).map(value => Buffer.from(value));

  f.reopen();
  const afterRestart = moduleBlocks(f);
  assert.deepEqual(afterRestart, beforeRestart);
  assert.deepEqual(afterRestart[2], initialDraw);
  assert.equal(Number(inventoryData(f).max_equip_id), Number(equip.uid));
  assert.deepEqual(formationData(f).formation_list.map(row => Number(row.uid)), [Number(equip.uid)]);
  assert.equal(Number(f.store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === HERO_2010201).fantasy_equip), Number(equip.uid));
});

test('login repairs legacy self, missing, and duplicate fantasy blessings without dropping equipment', t => {
  const f = fixture(t);
  const created = Array.from({ length: 5 }, () => grantEquipment(f, NORMAL_Q50));
  const data = inventoryData(f);
  const [first, second, third, fourth] = created;
  data.equips.find(equip => Number(equip.uid) === Number(first.uid)).bless = [first.uid, 99999, second.uid, second.uid];
  data.equips.find(equip => Number(equip.uid) === Number(third.uid)).bless = [second.uid, third.uid, fourth.uid];
  data.equips.find(equip => Number(equip.uid) === Number(fourth.uid)).bless = [fourth.uid, created[4].uid];
  setModuleBlocks(f, { inventory: codec.pack('pb_fantasy_equip_res', data) });

  const before = data.equips.map(({ bless, ...equip }) => structuredClone(equip));
  const repairs = f.service.ensureLoginState();
  assert.equal(repairs.changed, true);
  assert.equal(repairs.removed, 6);
  assert.equal(repairs.self.length, 3);
  assert.equal(repairs.missing.length, 1);
  assert.equal(repairs.duplicate.length, 2);
  assert.equal(repairs.invalid.length, 0);

  const expectedBless = new Map([
    [Number(first.uid), [Number(second.uid)]],
    [Number(third.uid), [Number(fourth.uid)]],
    [Number(fourth.uid), [Number(created[4].uid)]]
  ]);
  const repaired = inventoryData(f);
  assert.deepEqual(repaired.equips.map(({ bless, ...equip }) => equip), before);
  assert.deepEqual(repaired.equips.map(equip => [equip.uid, equip.bless]), repaired.equips.map(equip => [
    equip.uid,
    expectedBless.get(Number(equip.uid)) ?? []
  ]));
  assert.equal(Number(repaired.max_equip_id), Number(created[4].uid));

  f.reopen();
  const repeated = f.service.ensureLoginState();
  assert.equal(repeated.changed, false);
  assert.equal(repeated.removed, 0);
  assert.deepEqual(inventoryData(f), repaired);
});
