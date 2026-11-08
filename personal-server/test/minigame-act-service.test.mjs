import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMinigameActTables } from '../config/minigame-act-tables.mjs';
import { createMinigameActService } from '../game/minigame-act-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const baseTables = readGameTables();
const minigameTables = readMinigameActTables();
const SERVER_OPENED_AT = 1792789200;
const NOW = SERVER_OPENED_AT + 4000;
const DIAMOND = 101500;
const MUSHROOM_AWARD_ITEM = 678002;

const ACTS = {
  tower: 2000176,
  monopoly: 2001033,
  baking: 2001101
};

function tableSet(entries) {
  const ActFrameAct = new Map(baseTables.ActFrameAct ?? []);
  for (const [actId, row] of Object.entries(entries)) ActFrameAct.set(Number(actId), row);
  return { ...baseTables, ActFrameAct };
}

function setup(t, { nowSeconds = NOW, running = () => true, extraActs = {} } = {}) {
  let clock = nowSeconds;
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-minigame-',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => clock * 1000
  });
  const tables = tableSet({
    [ACTS.tower]: { type: 176, version: 1 },
    [ACTS.monopoly]: { type: 1033, version: 1 },
    [ACTS.baking]: { type: 1101, version: 1 },
    ...extraActs
  });
  const make = () => createMinigameActService({
    store: fixture.store,
    codec,
    tables,
    minigameTables,
    calendar: { serverOpenedAt: SERVER_OPENED_AT, mode: 'all-open', isActivityRunning: running },
    now: () => clock * 1000,
    random: () => 0.25
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return make(); },
    setTime(value) { clock = value; },
    reopen() { return fixture.open(); }
  };
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function seed(store, awards) {
  store.transaction(model => grantResources(model, awards, baseTables));
}

function module92(store) {
  return new Map(store.state().modules.value).get(92);
}

function call(service, type, payload = Buffer.alloc(0)) {
  return service.execute(type, service.decodeSync ? service.decodeSync(type, payload) : {});
}

test('puzzle cells pay the version award and refuse a repeated cell', async t => {
  const world = setup(t);
  const service = world.service;
  const before = resource(world.store, 8301900);
  const request = await service.decode(102001, codec.pack('pb_puzzle_act_req', { act_id: '1', tid: 101 }));
  const result = service.execute(102001, request);
  const decoded = codec.unpack('pb_puzzle_act_back', result.data);
  assert.equal(decoded.puzzle_act.act_id, '1');
  assert.ok(decoded.res.changes.length >= 1);
  assert.equal(resource(world.store, 8301900), before + 50n);

  const again = await service.decode(102001, codec.pack('pb_puzzle_act_req', { act_id: '1', tid: 101 }));
  assert.throws(() => world.service.execute(102001, again), error => error instanceof GameError && error.code === 311);
});

test('puzzle progress award needs two finished cells and cannot be claimed twice', async t => {
  const world = setup(t);
  for (const tid of [101, 102]) {
    const request = await world.service.decode(102001, codec.pack('pb_puzzle_act_req', { act_id: '1', tid }));
    world.service.execute(102001, request);
  }
  const before = resource(world.store, 8301900);
  const claim = await world.service.decode(102002, codec.pack('pb_puzzle_act_req', { act_id: '1', tid: 101 }));
  const result = world.service.execute(102002, claim);
  assert.ok(codec.unpack('pb_res_to_client', result.data).changes.length >= 1);
  assert.equal(resource(world.store, 8301900), before + 200n);
  const again = await world.service.decode(102002, codec.pack('pb_puzzle_act_req', { act_id: '1', tid: 101 }));
  assert.throws(() => world.service.execute(102002, again), error => error instanceof GameError && error.code === 311);
});

test('tile swap rotates through the configured turn list', async t => {
  const world = setup(t);
  const first = world.service.execute(102501, await world.service.decode(102501, Buffer.alloc(0)));
  const decoded = codec.unpack('pb_tile_swap', first.data);
  assert.equal(Number(decoded.version), 1);
  assert.equal(Number(decoded.cur_turn), 101);
  assert.deepEqual(decoded.group_list.map(Number), [1, 2, 3]);
  const second = world.service.execute(102501, await world.service.decode(102501, Buffer.alloc(0)));
  assert.equal(Number(codec.unpack('pb_tile_swap', second.data).cur_turn), 102);
});

test('mushroom run charges a daily attempt, records the score and pays the award once', async t => {
  const world = setup(t);
  const start = world.service.execute(102601, {});
  assert.equal(Number(codec.unpack('pb_mushroom_monster', start.data).cur_day_times), 1);
  assert.throws(() => world.service.execute(102601, {}), error => error instanceof GameError && error.code === 311);

  const end = world.service.execute(102602, { value: 4200 });
  assert.equal(Number(codec.unpack('pb_mushroom_monster_end_rev', end.data).monster_data.max_score), 4200);

  const before = resource(world.store, MUSHROOM_AWARD_ITEM);
  world.service.execute(102603, { value: 1001 });
  assert.equal(resource(world.store, MUSHROOM_AWARD_ITEM), before + 300n);
  assert.throws(() => world.service.execute(102603, { value: 1001 }), error => error instanceof GameError && error.code === 311);
});

test('gopher score award is paid once per day and rejects out-of-range scores', async t => {
  const world = setup(t);
  const before = resource(world.store, 709002);
  const request = await world.service.decode(103201, codec.pack('pb_beat_gopher_req', { version: 1, score: 5500 }));
  const result = world.service.execute(103201, request);
  assert.equal(Number(codec.unpack('pb_beat_gopher_back', result.data).person.score), 5500);
  assert.equal(resource(world.store, 709002), before + 45n);

  const repeat = await world.service.decode(103201, codec.pack('pb_beat_gopher_req', { version: 1, score: 5600 }));
  world.service.execute(103201, repeat);
  assert.equal(resource(world.store, 709002), before + 45n);

  const invalid = await world.service.decode(103201, codec.pack('pb_beat_gopher_req', { version: 1, score: 999999 }));
  assert.throws(() => world.service.execute(103201, invalid), error => error instanceof GameError && error.code === 1);
});

test('tower step charges the step cost and pays the step award', async t => {
  const world = setup(t);
  seed(world.store, [[800002, 2000]]);
  const request = await world.service.decode(104301, codec.pack('pb_tower_act_step_req', { act_tid: String(ACTS.tower), step: 30 }));
  const result = world.service.execute(104301, request);
  const decoded = codec.unpack('pb_tower_act_slot_rsp', result.data);
  assert.equal(Number(decoded.act_data.step), 30);
  assert.equal(resource(world.store, 800002), 2000n - 30n);
  assert.equal(resource(world.store, 391002), 1000n);
});

test('tower step without step currency fails closed', async t => {
  const world = setup(t);
  const request = await world.service.decode(104301, codec.pack('pb_tower_act_step_req', { act_tid: String(ACTS.tower), step: 2 }));
  assert.throws(() => world.service.execute(104301, request), error => error instanceof GameError && error.code === 301);
});

test('tower task command reports the missing evidence instead of inventing progress', async t => {
  const world = setup(t);
  const request = await world.service.decode(104303, codec.pack('pb_tower_act_task_req', { act_tid: String(ACTS.tower), task_id: [101] }));
  assert.throws(() => world.service.execute(104303, request), error => error instanceof GameError && error.code === 5);
});

test('album activation requires the owned furniture and pays the suit award once', async t => {
  const world = setup(t);
  const furniture = minigameTables.homeland.Furniture.rows.find(row => Number(row.suit) === 1);
  const suit = Number(furniture.suit);
  const members = minigameTables.homeland.Furniture.rows.filter(row => Number(row.suit) === suit);
  assert.throws(
    () => world.service.execute(110401, { value: Number(furniture.tid) }),
    error => error instanceof GameError && error.code === 311
  );
  world.service.execute(110913, await world.service.decode(110913, codec.pack('pb_homeland_replace_req', {
    house_list: [{
      house_tid: 1,
      room_list: [{ room_tid: 1, furniture_list: members.map((row, index) => ({ furniture_uid: index + 1, furniture_tid: Number(row.tid), x: 0, y: 0 })) }]
    }]
  })));
  for (const member of members) world.service.execute(110401, { value: Number(member.tid) });
  const active = world.service.execute(110402, { value: suit });
  assert.ok(codec.unpack('pb_homeland_album_role', active.data).furniture_suit_list.map(Number).includes(suit));
  const before = resource(world.store, DIAMOND);
  const award = world.service.execute(110403, { value: suit });
  assert.ok(codec.unpack('pb_res_to_client', award.data).changes.length >= 1);
  assert.equal(resource(world.store, DIAMOND), before + 1000n);
  assert.throws(() => world.service.execute(110403, { value: suit }), error => error instanceof GameError && error.code === 311);
});

test('homeland level up spends the level cost and adds prosperity', async t => {
  const world = setup(t);
  seed(world.store, [[41002, 5]]);
  const result = world.service.execute(110911, {});
  const decoded = codec.unpack('pb_homeland_level_up_rsp', result.data);
  assert.equal(Number(decoded.homeland.level), 2);
  assert.equal(Number(decoded.homeland.prosperity), 100);
  assert.equal(resource(world.store, 41002), 3n);
});

test('homeland like pays the configured award once per role per day', async t => {
  const world = setup(t);
  const before = resource(world.store, 201500);
  world.service.execute(110908, { value: 900001 });
  assert.equal(resource(world.store, 201500), before + 1000n);
  assert.throws(() => world.service.execute(110908, { value: 900001 }), error => error instanceof GameError && error.code === 311);
});

test('monopoly day award is paid once per day', async t => {
  const world = setup(t);
  const before = resource(world.store, DIAMOND);
  world.service.execute(107809, {});
  assert.equal(resource(world.store, DIAMOND), before + 50n);
  assert.throws(() => world.service.execute(107809, {}), error => error instanceof GameError && error.code === 311);
});

test('baking make cake spends stamina and adds a board cell', async t => {
  const world = setup(t);
  const result = world.service.execute(111005, {});
  const decoded = codec.unpack('pb_baking_make_cake_rsp', result.data);
  assert.equal(Number(decoded.act_data.res.stamina), 49);
  assert.equal(decoded.act_data.grids.length, 1);
  assert.equal(Number(decoded.act_data.grids[0].grid_type), 1);
});

test('source point commands refuse with the missing instance evidence', async t => {
  const world = setup(t);
  const request = await world.service.decode(110102, codec.pack('pb_source_point_combine_req', { tid: 1, source_point_list: [1] }));
  assert.throws(() => world.service.execute(110102, request), error => error instanceof GameError && error.code === 5);
});

test('login synchronisation writes module 92 payloads for running activities', async t => {
  const world = setup(t);
  const activity = { act_list: [] };
  const synced = world.service.synchronizeLogin(activity, NOW);
  for (const actId of [ACTS.tower, ACTS.monopoly, ACTS.baking]) assert.ok(synced.includes(actId), 'missing login entry for ' + actId);
  const entry = activity.act_list.find(item => Number(item.state_data.act_id) === ACTS.tower);
  const raw = Buffer.from(entry.module_login_data, 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  assert.equal(Number(codec.unpack('pb_tower_act_role', raw.subarray(6)).act_tid), ACTS.tower);
});

test('state survives a database reopen and an encoding failure rolls back', async t => {
  const world = setup(t);
  const request = await world.service.decode(102001, codec.pack('pb_puzzle_act_req', { act_id: '1', tid: 101 }));
  world.service.execute(102001, request);
  world.reopen();
  const before = resource(world.store, 8301900);
  assert.throws(() => world.service.execute(102001, {}), error => error instanceof GameError);
  assert.equal(resource(world.store, 8301900), before);
  const again = await world.service.decode(102001, codec.pack('pb_puzzle_act_req', { act_id: '1', tid: 101 }));
  assert.throws(() => world.service.execute(102001, again), error => error instanceof GameError && error.code === 311);
});

