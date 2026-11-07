import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createGeneralDungeonService } from '../game/general-dungeon-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readGeneralDungeonTables } from '../config/general-dungeon-tables.mjs';

const codec = createGameCodec();
const tables = readGeneralDungeonTables();
const gameTables = readGameTables();
const FIXED_NOW = 1792792800000;
const BOX_EVENT = 10100101;
const PROP_EVENT = 25100101;

function setup(t, overrides = {}) {
  const fixture = createGameFixture(t, codec, { now: () => FIXED_NOW });
  const make = (store = fixture.store) => createGeneralDungeonService({
    store, codec, tables, gameTables, now: () => FIXED_NOW, ...overrides
  });
  return { fixture, service: make(), make };
}

async function enter(service) {
  const response = await service.execute(78103, { enter_level: 101, extraData: Buffer.alloc(0) });
  return codec.unpack('pb_dungeon_level_change', response.data);
}

async function activate(service, eventId, pos = 2004) {
  const response = await service.execute(78105, { active_event: [eventId], pos, fog: Buffer.from([1, 2, 3]) });
  return codec.unpack('pb_dungeon_event_list', response.data);
}

test('78102/103/105/106 forms a persistent map and event lifecycle', async t => {
  const { fixture, service } = setup(t);
  const initial = await service.execute(78102, [1]);
  const initialPb = codec.unpack('pb_general_dungeon', initial.data);
  assert.equal(Number(initialPb.cur_level ?? 0), 0);
  assert.deepEqual(initialPb.level_data, []);

  const entered = await enter(service);
  assert.equal(entered.cur_level, 101);
  assert.equal(entered.level_list[0].level_tid, 101);
  assert.equal(entered.level_list[0].cur_scene, 1);
  assert.equal(entered.level_list[0].scene[0].events.length, 0);

  const activated = await activate(service, BOX_EVENT);
  assert.deepEqual(activated.events.map(event => [event.event_id, Number(event.result ?? 0)]), [[BOX_EVENT, 0]]);
  const synced = await service.execute(78106, { scene_id: 1, pos: 2005, fog: Buffer.from([9, 8]) });
  assert.equal(synced.noReply, true);
  assert.equal(synced.data, null);

  const reopenedStore = fixture.open();
  const reopened = createGeneralDungeonService({
    store: reopenedStore, codec, tables, gameTables, now: () => FIXED_NOW
  });
  const persisted = codec.unpack('pb_general_dungeon', (await reopened.execute(78102, 1)).data);
  const scene = persisted.level_data[0].scene[0];
  assert.equal(scene.pos, 2005);
  assert.equal(Buffer.from(scene.fog, 'base64').toString('hex'), '0908');
  assert.deepEqual(scene.events.map(event => [event.event_id, Number(event.result ?? 0)]), [[BOX_EVENT, 0]]);

  await reopened.execute(78104, 101);
  assert.equal(reopened.state().curLevel, 0);
  assert.equal(reopened.state().levels['101'], undefined);
});

test('78101 executes an activated configured box once and grants its real rewards', async t => {
  const { service } = setup(t);
  await enter(service);
  await assert.rejects(service.execute(78101, { execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0 }), /not active/);
  await activate(service, BOX_EVENT);
  const response = await service.execute(78101, {
    execute_event: BOX_EVENT, pos: 2004, fog: Buffer.from([1]), active_event: [], req_data: 0
  });
  const result = codec.unpack('pb_dungeon_event_res', response.data);
  assert.equal(result.target_evt, BOX_EVENT);
  assert.equal(result.box_count, 1);
  assert.equal(result.events[0].event_id, BOX_EVENT);
  assert.equal(result.events[0].result, 1);
  assert.ok(result.res.changes.length > 0);
  await assert.rejects(service.execute(78101, {
    execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }), /already executed/);
});

test('78101 rejects unknown and non-executable event types instead of reporting success', async t => {
  const { service } = setup(t);
  await enter(service);
  await assert.rejects(service.execute(78101, {
    execute_event: 999999999, pos: 3004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }), /not configured/);
  await activate(service, 1100101, 3004);
  await assert.rejects(service.execute(78101, {
    execute_event: 1100101, pos: 3004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }), /fight event requires unimplemented/);
});

test('78101 prop events update authoritative bag state and 78107 consumes it', async t => {
  const { service } = setup(t);
  await enter(service);
  await activate(service, PROP_EVENT, 3010);
  const executed = await service.execute(78101, {
    execute_event: PROP_EVENT, pos: 3010, fog: Buffer.alloc(0), active_event: [], req_data: 0
  });
  assert.deepEqual(executed.value.changes, []);
  assert.deepEqual(service.state().levels['101'].propList, [1]);
  const used = await service.execute(78107, 1);
  assert.deepEqual(codec.unpack('pb_res_to_client', used.data).changes, []);
  assert.deepEqual(service.state().levels['101'].propList, []);
  await assert.rejects(service.execute(78107, 1), /not available/);
});

function amount(store, tid) {
  return Number(store.inspect(db => db.prepare('SELECT amount FROM resources WHERE role_id=? AND tid=?').get(100001, String(tid))?.amount ?? 0));
}

test('a claim insert failure rolls back box resources and event state', async t => {
  const { fixture, service } = setup(t);
  await enter(service);
  await activate(service, BOX_EVENT);
  const before = amount(fixture.store, 201500);
  fixture.store.inspect(db => db.exec(`CREATE TRIGGER general_dungeon_claim_boom BEFORE INSERT ON general_dungeon_claims
    WHEN NEW.claim_type='event_box' BEGIN SELECT RAISE(ABORT, 'boom'); END`));
  await assert.rejects(service.execute(78101, {
    execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }), /boom/);
  assert.equal(amount(fixture.store, 201500), before);
  assert.equal(service.state().levels['101'].scenes['1'].events[String(BOX_EVENT)].result, 0);
  fixture.store.inspect(db => db.exec('DROP TRIGGER general_dungeon_claim_boom'));
  await service.execute(78101, { execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0 });
  assert.ok(amount(fixture.store, 201500) > before);
});

test('an encoding failure rolls back box resources and claim state', async t => {
  const fixture = createGameFixture(t, codec, { now: () => FIXED_NOW });
  const failingCodec = {
    pack(schema, value) {
      if (schema === 'pb_dungeon_event_res') throw new Error('encode failed');
      return codec.pack(schema, value);
    },
    unpack: (schema, bytes) => codec.unpack(schema, bytes)
  };
  const service = createGeneralDungeonService({ store: fixture.store, codec: failingCodec, tables, gameTables, now: () => FIXED_NOW });
  await enter(service);
  await activate(service, BOX_EVENT);
  const before = amount(fixture.store, 201500);
  await assert.rejects(service.execute(78101, {
    execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }), /encode failed/);
  assert.equal(amount(fixture.store, 201500), before);
  assert.equal(service.state().levels['101'].scenes['1'].events[String(BOX_EVENT)].result, 0);
  const claims = fixture.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM general_dungeon_claims').get());
  assert.equal(Number(claims.count), 0);
});
