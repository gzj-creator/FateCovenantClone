import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMinigameActTables } from '../config/minigame-act-tables.mjs';
import { readGeneratedTables } from '../config/hero-tables.mjs';
import { tableAsset } from '../assets.mjs';
import { createMinigameActService } from '../game/minigame-act-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const baseTables = readGameTables();
const minigameTables = readMinigameActTables();

// The exploration block reads the same HomelandActTable dump through the
// prototype reader, so a row-level dump has to stay readable for both.
test('row-level table dumps feed the prototype reader used by other blocks', () => {
  const families = ['Task', 'Furniture', 'Const', 'Version', 'Happiness', 'RankUpAward', 'Module'];
  const tables = readGeneratedTables(tableAsset('HomelandActTable.data.lua.json.gz'), families);
  assert.equal(tables.Task.size, 72);
  assert.deepEqual(tables.Furniture.get(2).suit.slice(0, 3), [1, 2, 3]);
  assert.equal(tables.Version.size, 9);
});
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
  // Creating the service installs the mini-game tables. Tests that seed state
  // before the first command need those tables to be present already.
  void make();
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

function seedCurrency(store, tid, num) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(5);
    const data = codec.unpack('pb_currency_data', rawBinary(module));
    data.res_list ??= [];
    let entry = data.res_list.find(candidate => String(candidate.tid) === String(tid));
    if (!entry) {
      entry = { tid: String(tid), num: '0' };
      data.res_list.push(entry);
    }
    entry.num = String(num);
    modules.set(5, serializedBinary(codec.pack('pb_currency_data', data)));
    model.state.modules.value = [...modules];
    model.resources.set(String(tid), { ...entry, location: [5, null, data.res_list.indexOf(entry)] });
  });
}

function module92(store) {
  return new Map(store.state().modules.value).get(92);
}

function seedStatistic(store, taskType, total) {
  const config = baseTables.TaskType.get(Number(taskType));
  if (!config) throw new Error('Unknown task type ' + taskType);
  const rows = [...baseTables.CountStatistics.values()].filter(row => !row.custom_login && Number(row.type) === 0);
  const index = rows.findIndex(row => Number(row.tid) === Number(config.data));
  if (index < 0) throw new Error('Missing statistics row for task type ' + taskType);
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    const data = module.value[index + 1]
      ? codec.unpack('pb_count_statics_data', rawBinary(module.value[index + 1]))
      : { list: [] };
    data.list ??= [];
    const id = String(config.stat_expand[0]);
    const item = data.list.find(row => String(row.id) === id);
    if (item) item.total = String(total);
    else data.list.push({ id, total: String(total) });
    module.value[index + 1] = serializedBinary(codec.pack('pb_count_statics_data', data));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

function setMiniState(store, actKey, data) {
  store.transaction((model, db) => {
    db.prepare('INSERT INTO minigame_act_state (role_id, act_key, kind, data, updated_at) VALUES (?,?,?,?,?)' +
      ' ON CONFLICT(role_id,act_key,kind) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
      .run(Number(model.state.roleId), actKey, 'main', JSON.stringify(data), new Date().toISOString());
  });
}

function setHero(store, tid, values) {
  store.transaction(model => {
    const hero = (model.heroInfo.hero_list ?? []).find(candidate => Number(candidate.tid) === Number(tid));
    if (!hero) throw new Error('Hero is not owned: ' + tid);
    Object.assign(hero, values);
  });
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

test('tower only-state task can be claimed once', async t => {
  const world = setup(t);
  const request = await world.service.decode(104303, codec.pack('pb_tower_act_task_req', { act_tid: String(ACTS.tower), task_id: [101] }));
  const before = resource(world.store, 800002);
  const result = world.service.execute(104303, request);
  const decoded = codec.unpack('pb_tower_act_task_rsp', result.data);
  assert.ok(decoded.act_data.got_task_award.length >= 1);
  assert.equal(resource(world.store, 800002), before + 5n);
  const again = await world.service.decode(104303, codec.pack('pb_tower_act_task_req', { act_tid: String(ACTS.tower), task_id: [101] }));
  assert.throws(() => world.service.execute(104303, again), error => error instanceof GameError && error.code === 311);
});

test('tower statistic task checks the shared counter before paying', async t => {
  const world = setup(t);
  const request = await world.service.decode(104303, codec.pack('pb_tower_act_task_req', { act_tid: String(ACTS.tower), task_id: [102] }));
  assert.throws(() => world.service.execute(104303, request), error => error instanceof GameError && error.code === 311);
  seedStatistic(world.store, 1002, 50);
  const before = resource(world.store, 800002);
  const claim = await world.service.decode(104303, codec.pack('pb_tower_act_task_req', { act_tid: String(ACTS.tower), task_id: [102] }));
  world.service.execute(104303, claim);
  assert.equal(resource(world.store, 800002), before + 5n);
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

test('source point change moves owned instances between heroes', async t => {
  const world = setup(t);
  seed(world.store, [[1040101, 1], [1040201, 1]]);
  setMiniState(world.store, 'source_point:1', {
    max_uid: 3,
    source_point_list: [{ tid: 100014300, uid: 1 }, { tid: 100014300, uid: 2 }, { tid: 100024300, uid: 3 }],
    hero_task_claims: []
  });
  setHero(world.store, 1040101, { source_point_list: ['1', '2'] });
  setHero(world.store, 1040201, { source_point_list: ['3'] });
  const request = await world.service.decode(110101, codec.pack('pb_source_point_change_req', {
    change_list: [{ hero_uid: '1040101', changes: [3] }]
  }));
  const result = world.service.execute(110101, request);
  const decoded = codec.unpack('pb_source_point_change_rsp', result.data);
  assert.ok(decoded.hero_list.some(hero => String(hero.uid) === '1040101' && hero.source_point_list.map(Number).includes(3)));
  const first = world.store.read().heroInfo.hero_list.find(hero => String(hero.uid) === '1040101');
  const second = world.store.read().heroInfo.hero_list.find(hero => String(hero.uid) === '1040201');
  assert.deepEqual(first.source_point_list.map(Number), [3]);
  assert.deepEqual(second.source_point_list, []);
});

test('source point rewards allocate persistent depot instances with client binaries', t => {
  const world = setup(t);
  assert.equal(world.service.isSourcePointReward(100334300), true);
  assert.equal(world.service.isSourcePointReward(DIAMOND), false);

  const result = world.store.transaction((model, db) => world.service.grantSourcePointRewards({
    model,
    db,
    awards: [[100334300, 2], [100344300, 1]],
    at: NOW
  }));
  assert.deepEqual(result.changes.map(change => [change.tid, change.diff_num]), [
    ['100334300', '1'],
    ['100334300', '1'],
    ['100344300', '1']
  ]);
  assert.deepEqual(
    result.changes.map(change => codec.unpack('pb_source_point', Buffer.from(change.new_bin, 'base64'))),
    [
      { tid: '100334300', uid: '1' },
      { tid: '100334300', uid: '2' },
      { tid: '100344300', uid: '3' }
    ]
  );

  const readState = store => JSON.parse(store.transaction((model, db) =>
    db.prepare('SELECT data FROM minigame_act_state WHERE act_key=?').get('source_point:1').data
  ));
  assert.deepEqual(readState(world.store), {
    max_uid: 3,
    source_point_list: [
      { tid: 100334300, uid: 1 },
      { tid: 100334300, uid: 2 },
      { tid: 100344300, uid: 3 }
    ],
    hero_task_claims: []
  });
  world.reopen();
  assert.deepEqual(readState(world.store).source_point_list, [
    { tid: 100334300, uid: 1 },
    { tid: 100334300, uid: 2 },
    { tid: 100344300, uid: 3 }
  ]);
});

test('source point combine consumes matching instances and creates the elevated instance', async t => {
  const world = setup(t);
  seed(world.store, [[1040101, 1]]);
  seedCurrency(world.store, 2, 1);
  setMiniState(world.store, 'source_point:1', {
    max_uid: 5,
    source_point_list: [1, 2, 3, 4, 5].map(uid => ({ tid: 100314300, uid })),
    hero_task_claims: []
  });
  setHero(world.store, 1040101, { source_point_list: ['1', '2', '3', '4', '5'] });
  const before = resource(world.store, 2);
  const request = await world.service.decode(110102, codec.pack('pb_source_point_combine_req', {
    tid: 100334300, source_point_list: [1, 2, 3, 4, 5]
  }));
  world.service.execute(110102, request);
  assert.equal(resource(world.store, 2), before - 1n);
  const hero = world.store.read().heroInfo.hero_list.find(candidate => String(candidate.uid) === '1040101');
  assert.deepEqual(hero.source_point_list, []);
  const stateRows = world.store.transaction((model, db) => db.prepare('SELECT data FROM minigame_act_state WHERE act_key=?').get('source_point:1'));
  const state = JSON.parse(stateRows.data);
  assert.ok(state.source_point_list.some(entry => Number(entry.tid) === 100334300 && Number(entry.uid) === 6));
});

test('source point trial uses hero star and mastery progress and records the claim bit', async t => {
  const world = setup(t);
  seed(world.store, [[1040101, 1]]);
  setHero(world.store, 1040101, { star: 10, mastery_break: 3 });
  setMiniState(world.store, 'source_point:1', { max_uid: 0, source_point_list: [], hero_task_claims: [] });
  const first = await world.service.decode(110103, codec.pack('pb_source_point_task_req', { tid: 101 }));
  const result = world.service.execute(110103, first);
  const decoded = codec.unpack('pb_source_point_task_rsp', result.data);
  assert.ok(decoded.hero_tasks.length > 0);
  const second = await world.service.decode(110103, codec.pack('pb_source_point_task_req', { tid: 102 }));
  world.service.execute(110103, second);
  const duplicate = await world.service.decode(110103, codec.pack('pb_source_point_task_req', { tid: 101 }));
  assert.throws(() => world.service.execute(110103, duplicate), error => error instanceof GameError && error.code === 311);
  const rows = world.store.transaction((model, db) => db.prepare('SELECT data FROM minigame_act_state WHERE act_key=?').get('source_point:1'));
  const state = JSON.parse(rows.data);
  assert.deepEqual(state.hero_task_claims, [101, 102]);
  assert.ok(state.source_point_list.some(entry => Number(entry.tid) === 100264300));
});

test('login synchronisation writes module 92 payloads for running activities', async t => {
  const world = setup(t);
  setMiniState(world.store, 'monopoly:' + ACTS.monopoly, {
    cur_index: 0, event_uid: 0, events: [], score: 12, next_multiple: 1,
    role_total_award_gets: [], role_live_award_gets: [], role_guild_task_award_gets: [],
    guild_count_stats: {
      1006: {
        stat_tid: 1006,
        expand_id_list: ['8490028303'],
        data: { list: [{ id: '8490028303', total: '100' }] }
      }
    }
  });
  const activity = { act_list: [] };
  const synced = world.service.synchronizeLogin(activity, NOW);
  for (const actId of [ACTS.tower, ACTS.monopoly, ACTS.baking]) assert.ok(synced.includes(actId), 'missing login entry for ' + actId);
  const entry = activity.act_list.find(item => Number(item.state_data.act_id) === ACTS.tower);
  const raw = Buffer.from(entry.module_login_data, 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  assert.equal(Number(codec.unpack('pb_tower_act_role', raw.subarray(6)).act_tid), ACTS.tower);
  const monopolyEntry = activity.act_list.find(item => Number(item.state_data.act_id) === ACTS.monopoly);
  const monopolyRaw = Buffer.from(monopolyEntry.module_login_data, 'base64');
  const monopolyPayload = codec.unpack('pb_monopoly_act_login', monopolyRaw.subarray(6));
  assert.equal(Number(monopolyPayload.act_role_data.score), 12);
  assert.equal(Number(monopolyPayload.guild_data.score), 12);
  assert.equal(Number(monopolyPayload.guild_count_statics_send.stat_tid), 1006);
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

test('homeland daily tasks pay once per completed task', async t => {
  const world = setup(t);
  seedStatistic(world.store, 1307, 1);
  seedStatistic(world.store, 100817, 5);
  const before = resource(world.store, DIAMOND);
  const first = world.service.execute(110904, {});
  const decoded = codec.unpack('pb_homeland_task_finish_rsp', first.data);
  assert.deepEqual(decoded.task_tid_list.map(Number), [1, 2]);
  assert.equal(resource(world.store, DIAMOND), before + 200n);
  const again = world.service.execute(110904, {});
  assert.deepEqual(codec.unpack('pb_homeland_task_finish_rsp', again.data).task_tid_list, []);
});

test('diamond vein action-point purchase follows the table formula', async t => {
  const diamondAct = 2002001;
  const world = setup(t, { extraActs: { [diamondAct]: { type: 1051, version: 1 } } });
  setMiniState(world.store, 'diamond:' + diamondAct, { action_point: 50, attack_point: 30, merit: 0, maps: [] });
  seed(world.store, [[DIAMOND, 1000]]);
  const request = await world.service.decode(109005, codec.pack('pb_diamond_vein_act_base_req', { act_id: String(diamondAct), value: 50 }));
  const result = world.service.execute(109005, request);
  const decoded = codec.unpack('pb_diamond_vein_act_role_res_rsp', result.data);
  assert.equal(Number(decoded.role_data.action_point), 100);
  assert.equal(resource(world.store, DIAMOND), 950n);
  const over = await world.service.decode(109005, codec.pack('pb_diamond_vein_act_base_req', { act_id: String(diamondAct), value: 1 }));
  assert.throws(() => world.service.execute(109005, over), error => error instanceof GameError && error.code === 311);
});

test('monopoly fight event completes once and pays its score', async t => {
  const world = setup(t);
  setMiniState(world.store, 'monopoly:' + ACTS.monopoly, {
    cur_index: 5, event_uid: 1, events: [{ tid: 105, uid: 1, finish_stage: 0, param: 10501 }],
    score: 0, next_multiple: 1, role_total_award_gets: [], role_live_award_gets: [], role_guild_task_award_gets: []
  });
  const request = await world.service.decode(107802, codec.pack('pb_monopoly_act_base_req', { act_tid: String(ACTS.monopoly), tid: 1 }));
  const result = world.service.execute(107802, request);
  const decoded = codec.unpack('pb_monopoly_act_base_back', result.data);
  assert.equal(Number(decoded.act_role_data.score), 2000);
  assert.equal(Number(decoded.act_role_data.event_list[0].finish_stage), 2);
  const again = await world.service.decode(107802, codec.pack('pb_monopoly_act_base_req', { act_tid: String(ACTS.monopoly), tid: 1 }));
  assert.throws(() => world.service.execute(107802, again), error => error instanceof GameError && error.code === 311);
});

test('monopoly guild task uses its task counter and records the claim', async t => {
  const world = setup(t);
  setMiniState(world.store, 'monopoly:' + ACTS.monopoly, {
    cur_index: 0, event_uid: 0, events: [], score: 0, next_multiple: 1,
    role_total_award_gets: [], role_live_award_gets: [], role_guild_task_award_gets: [],
    guild_count_stats: {
      1006: {
        stat_tid: 1006,
        expand_id_list: ['8490028303'],
        data: { list: [{ id: '8490028303', total: '100' }] }
      }
    }
  });
  const request = await world.service.decode(107804, codec.pack('pb_monopoly_act_get_reward_req', { act_tid: String(ACTS.monopoly), tid_list: [101] }));
  const result = world.service.execute(107804, request);
  assert.ok(codec.unpack('pb_res_to_client', result.data).changes.length >= 2);
  const again = await world.service.decode(107804, codec.pack('pb_monopoly_act_get_reward_req', { act_tid: String(ACTS.monopoly), tid_list: [101] }));
  assert.throws(() => world.service.execute(107804, again), error => error instanceof GameError && error.code === 311);
});

test('monopoly guild score task compares the accumulated score with target_count', async t => {
  const world = setup(t);
  setMiniState(world.store, 'monopoly:' + ACTS.monopoly, {
    cur_index: 0, event_uid: 0, events: [], score: 1400000, next_multiple: 1,
    role_total_award_gets: [], role_live_award_gets: [], role_guild_task_award_gets: []
  });
  const request = await world.service.decode(107804, codec.pack('pb_monopoly_act_get_reward_req', { act_tid: String(ACTS.monopoly), tid_list: [110] }));
  const result = world.service.execute(107804, request);
  assert.ok(codec.unpack('pb_res_to_client', result.data).changes.length >= 2);
  const rows = world.store.transaction((model, db) => db.prepare('SELECT data FROM minigame_act_state WHERE act_key=?').get('monopoly:' + ACTS.monopoly));
  assert.ok(JSON.parse(rows.data).role_guild_task_award_gets.includes(110));
});

test('monopoly guild task rejects malformed persisted statistics', async t => {
  const world = setup(t);
  setMiniState(world.store, 'monopoly:' + ACTS.monopoly, {
    cur_index: 0, event_uid: 0, events: [], score: 0, next_multiple: 1,
    role_total_award_gets: [], role_live_award_gets: [], role_guild_task_award_gets: [],
    guild_count_stats: {
      1006: { stat_tid: 1006, data: { list: [{ id: '8490028303', total: 'not-a-number' }] } }
    }
  });
  const request = await world.service.decode(107804, codec.pack('pb_monopoly_act_get_reward_req', { act_tid: String(ACTS.monopoly), tid_list: [101] }));
  assert.throws(() => world.service.execute(107804, request), error => error instanceof GameError && error.code === 5);
});

test('baking swap moves and swaps board cells', async t => {
  const world = setup(t);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0, grid: [
      { x: 3, y: 3, type: 1, cake_type: 1, lv: 1, clicks: 0 },
      { x: 4, y: 3, type: 1, cake_type: 2, lv: 1, clicks: 0 }
    ], received_lv: [], batch_model: 0
  });
  const request = await world.service.decode(111002, codec.pack('pb_baking_swap_req', { act_id: String(ACTS.baking), x1: 3, y1: 3, x2: 5, y2: 3 }));
  const result = world.service.execute(111002, request);
  const cells = codec.unpack('pb_baking_swap_rsp', result.data).act_data.grids;
  assert.ok(cells.some(cell => Number(cell.x) === 5 && Number(cell.y) === 3 && Number(cell.cake_type_tid) === 1));
});

test('baking synthesis and batch synthesis merge matching cakes', async t => {
  const world = setup(t);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0, grid: [
      { x: 3, y: 3, type: 1, cake_type: 1, lv: 1, clicks: 0 },
      { x: 4, y: 3, type: 1, cake_type: 1, lv: 1, clicks: 0 }
    ], received_lv: [], batch_model: 0
  });
  const synth = await world.service.decode(111003, codec.pack('pb_baking_synthesize_req', { act_id: String(ACTS.baking), x1: 3, y1: 3, x2: 4, y2: 3 }));
  const synthResult = world.service.execute(111003, synth);
  const merged = codec.unpack('pb_baking_synthesize_rsp', synthResult.data).act_data.grids;
  assert.equal(merged.length, 1);
  assert.equal(Number(merged[0].cake_lv), 2);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0, grid: [
      { x: 3, y: 3, type: 1, cake_type: 1, lv: 1, clicks: 0 },
      { x: 4, y: 3, type: 1, cake_type: 1, lv: 1, clicks: 0 },
      { x: 3, y: 4, type: 1, cake_type: 1, lv: 1, clicks: 0 },
      { x: 4, y: 4, type: 1, cake_type: 1, lv: 1, clicks: 0 }
    ], received_lv: [], batch_model: 0
  });
  const batch = await world.service.decode(111004, codec.pack('pb_baking_batch_synthesize_req', { act_id: String(ACTS.baking) }));
  const batchResult = world.service.execute(111004, batch);
  const batchData = codec.unpack('pb_baking_batch_synthesize_rsp', batchResult.data);
  assert.ok(batchData.synthesizes.length >= 2);
  assert.equal(Number(batchData.min_lv), 1);
});

test('baking make cake fills multiple open cells and charges each cake', async t => {
  const world = setup(t);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0, grid: [], received_lv: [], batch_model: 0
  });
  const request = await world.service.decode(111005, codec.pack('pb_baking_make_cake_req', { act_id: String(ACTS.baking), num: 3 }));
  const result = world.service.execute(111005, request);
  const data = codec.unpack('pb_baking_make_cake_rsp', result.data).act_data;
  assert.equal(data.grids.length, 3);
  assert.equal(Number(data.res.stamina), 47);
});

test('baking order submit matches cakes and advances the order', async t => {
  const world = setup(t);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0,
    order_tid: 10001, order_time: NOW, order_end: 0, finish_times: 0, continuous: 0, give_up_list: [],
    grid: [{ x: 3, y: 3, type: 1, cake_type: 3, lv: 4, clicks: 0 }], received_lv: [], batch_model: 0
  });
  const request = await world.service.decode(111012, codec.pack('pb_baking_submit_order_req', { act_id: String(ACTS.baking), pos: [{ x: 3, y: 3 }] }));
  const result = world.service.execute(111012, request);
  const data = codec.unpack('pb_baking_submit_order_rsp', result.data).act_data;
  assert.equal(Number(data.res.score), 80);
  assert.equal(data.grids.length, 0);
  assert.notEqual(Number(data.order.cur_order_tid), 10001);
});

test('baking give up order records the order and spends the abandon item', async t => {
  const world = setup(t);
  seed(world.store, [[834702, 1]]);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0,
    order_tid: 10001, order_time: NOW, order_end: 0, finish_times: 0, continuous: 0, give_up_list: [],
    grid: [], received_lv: [], batch_model: 0
  });
  const result = world.service.execute(111006, { act_id: ACTS.baking });
  const data = codec.unpack('pb_baking_give_up_order_rsp', result.data).act_data;
  assert.equal(data.order.give_up_order_list.length, 1);
  assert.equal(Number(data.order.give_up_order_list[0].order_tid), 10001);
  assert.equal(resource(world.store, 834702), 0n);
});

test('baking timed order refresh replaces a timed order', async t => {
  const world = setup(t);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 2, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0,
    order_tid: 20003, order_time: NOW, order_end: NOW + 900, finish_times: 0, continuous: 0, give_up_list: [],
    grid: [], received_lv: [], batch_model: 0
  });
  const result = world.service.execute(111013, { act_id: ACTS.baking });
  const data = codec.unpack('pb_baking_refresh_time_limit_order_rsp', result.data).act_data;
  assert.notEqual(Number(data.order.cur_order_tid), 20003);
  assert.ok(Number(data.order.order_end_time) > Number(data.order.order_gen_time));
});

test('baking board event pays the selected special award', async t => {
  const world = setup(t);
  setMiniState(world.store, 'baking:' + ACTS.baking, {
    lv: 1, stamina: 50, stamina_time: NOW, score: 0, daily_score: 0, day: 0,
    grid: [{ x: 3, y: 3, type: 4, cake_type: 8, lv: 1, clicks: 0 }], received_lv: [], batch_model: 0
  });
  const before = resource(world.store, 4371200);
  const request = await world.service.decode(111011, codec.pack('pb_baking_handle_event_req', { act_id: String(ACTS.baking), x: 3, y: 3, param1: 1 }));
  const result = world.service.execute(111011, request);
  const data = codec.unpack('pb_baking_handle_event_rsp', result.data).act_data;
  assert.equal(data.grids.length, 0);
  assert.equal(resource(world.store, 4371200), before + 5n);
});

test('spirit courtyard entrust submit consumes fruit and pays the order award', async t => {
  const world = setup(t);
  seed(world.store, [[20014100, 15]]);
  setMiniState(world.store, 'spirit:1', {
    intimacy: 0, intimacy_lv: 1, lands: [{ id: 1, crop_tid: 0, update_time: 0, mature_time: 0 }],
    entrusts: [{ uid: 1, tid: 101, lib: [101], is_public: false, is_finish: false, role_id: 100001 }],
    task_claims: [], publish_count: 0
  });
  const request = await world.service.decode(105005, codec.pack('pb_req_spirit_courtyard_submit_entrust', { uid: 1 }));
  const result = world.service.execute(105005, request);
  const decoded = codec.unpack('pb_res_spirit_courtyard_submit_entrust', result.data);
  assert.equal(decoded.role_info.entrust_task_list[0].is_finish, true);
  assert.equal(resource(world.store, 20014100), 0n);
  assert.equal(resource(world.store, 2002), 1n);
  assert.equal(resource(world.store, 101500), 50n);
});

test('spirit assist, banquet and banquet award remain explicit evidence gaps', async t => {
  const world = setup(t);
  assert.throws(() => world.service.execute(105008, { uid: 1, role_id: 2 }), error => error instanceof GameError && error.code === 5);
  assert.throws(() => world.service.execute(105009, { fruit_list: [] }), error => error instanceof GameError && error.code === 5);
  assert.throws(() => world.service.execute(105015, {}), error => error instanceof GameError && error.code === 5);
});

