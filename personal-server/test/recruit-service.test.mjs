import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readFantasyEquipTables, readHeroTables, readLeaderEquipTables } from '../config/hero-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createRecruitService } from '../game/recruit-service.mjs';
import { createLineupService } from '../game/lineup-service.mjs';
import {
  RECRUIT_POOL_RULES,
  availableQualityWeights,
  buildRecruitPoolCatalog,
  completedDrawCounts
} from '../game/recruit-pool-rules.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const heroTables = readHeroTables();
const fantasyEquipTables = readFantasyEquipTables();
const leaderEquipTables = readLeaderEquipTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const now = () => Date.UTC(2026, 9, 29, 12, 0, 0) / 1000;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30, nick_name: Buffer.from('Recruitment Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t, random = () => 0) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-recruit-'));
  const databasePath = path.join(directory, 'game.sqlite'), legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  const make = (override = {}) => createRecruitService({ store, codec, tables, heroTables, fantasyEquipTables, leaderEquipTables, random, now, ...override });
  let service = make();
  service.ensureLoginState();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    directory,
    databasePath,
    legacyStatePath,
    get store() { return store; },
    get service() { return service; },
    make,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, legacyStatePath, codec });
      service = make();
      service.ensureLoginState();
    },
    seed(id, amount = 100000) {
      store.transaction(model => {
        if (model.resources.has(String(id))) model.resources.get(String(id)).num = String(amount);
        else grantResources(model, [[id, amount]], tables);
      });
    }
  };
}

function recruitInfo(env, lib) {
  const module = new Map(env.store.state().modules.value).get(10);
  return codec.unpack('pb_hero_draw_info', rawBinary(module.value[2])).recruit_list.find(info => Number(info.draw_lib) === lib);
}

function drawInfo(env) {
  const module = new Map(env.store.state().modules.value).get(10);
  return codec.unpack('pb_hero_draw_info', rawBinary(module.value[2]));
}

function loginItem(env, tid) {
  const module = new Map(env.store.state().modules.value).get(6);
  return module.value.flatMap(group => Array.isArray(group.value) ? group.value.map(item => codec.unpack('pb_res_obj', rawBinary(item))) : [])
    .find(item => Number(item.tid) === tid);
}

const roleStatistics = [...tables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function statisticsData(env, statTid) {
  const slot = roleStatistics.findIndex(row => Number(row.tid) === statTid) + 1;
  const module = new Map(env.store.state().modules.value).get(21);
  return codec.unpack('pb_count_statics_data', rawBinary(module.value[slot]));
}

async function decodeHeroExtra(bytes) {
  const list = await decodeEtf(Buffer.from(bytes, 'base64'));
  assert.equal(list.value.length, 1);
  return codec.unpack('hero', Buffer.from(list.value[0].value));
}

async function customStatistics(env) {
  const decoded = await decodeEtf(env.service.execute(77901, [env.store.read().state.roleId]).data);
  return decoded.value.map(item => codec.unpack('pb_count_statics_data', Buffer.from(item.value)));
}

function statisticsTid75(data) {
  const customTids = [...tables.CountStatistics.values()].filter(row => row.custom_login).map(row => Number(row.tid));
  return data[customTids.indexOf(75)];
}

function setPity(env, lib, value) {
  updateRecruitInfo(env, lib, info => { info.guaranteed_count = value; });
}

function updateRecruitInfo(env, lib, update) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(10);
    const info = codec.unpack('pb_hero_draw_info', rawBinary(module.value[2]));
    update(info.recruit_list.find(entry => Number(entry.draw_lib) === lib));
    module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', info));
    model.state.modules.value = [...modules];
  });
}

function setDrawCounts(env, counts) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(10);
    const info = codec.unpack('pb_hero_draw_info', rawBinary(module.value[2]));
    for (const [lib, count] of Object.entries(counts)) {
      info.recruit_list.find(entry => Number(entry.draw_lib) === Number(lib)).draw_count = count;
    }
    module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', info));
    model.state.modules.value = [...modules];
  });
}

function demigodModule(env) {
  return new Map(env.store.state().modules.value).get(518);
}

function demigodDraw(env) {
  return codec.unpack('pb_fantasy_draw', rawBinary(demigodModule(env).value[2]));
}

function demigodEquips(env) {
  return codec.unpack('pb_fantasy_equip_res', rawBinary(demigodModule(env).value[0]));
}

function updateDemigodDraw(env, update) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(518);
    const draw = module.value[2].value.data.length
      ? codec.unpack('pb_fantasy_draw', rawBinary(module.value[2]))
      : {};
    update(draw);
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', draw));
    model.state.modules.value = [...modules];
  });
}

function decodeDemigodEquipExtra(value) {
  return codec.unpack('pb_fantasy_equip', Buffer.from(value, 'base64'));
}

function leaderEquipData(env) {
  const module = new Map(env.store.state().modules.value).get(175);
  return codec.unpack('pb_leader_equips_data', rawBinary(module));
}

const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('ticket purchases deduct diamonds, persist limits and reject insufficient funds', t => {
  const env = setup(t);
  env.seed(101500, 10000);
  const normal = codec.unpack('pb_draw_normal_buy_ret', env.service.execute(600, 2).data);
  assert.deepEqual(normal.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '-500'], ['2002', '2']]);
  assert.deepEqual(
    codec.unpack('pb_res_obj', Buffer.from(normal.res.changes.find(change => change.tid === '2002').new_bin, 'base64')),
    { tid: '2002', num: '2' }
  );
  assert.equal(normal.buy_info.buy_max_num, 1198);
  const magic = codec.unpack('pb_draw_normal_buy_ret', env.service.execute(599, 2).data);
  assert.deepEqual(magic.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '-1600'], ['4002', '2']]);
  assert.deepEqual(
    codec.unpack('pb_res_obj', Buffer.from(magic.res.changes.find(change => change.tid === '4002').new_bin, 'base64')),
    { tid: '4002', num: '2' }
  );
  assert.equal(magic.buy_info.buy_max_num, 58);
  env.reopen();
  assert.equal(env.store.read().resources.get('2002').num, '2');
  assert.equal(env.store.read().resources.get('4002').num, '2');
  assert.equal(env.store.read().resources.has('3002'), false);
  env.seed(101500, 100);
  rejected(() => env.service.execute(600, 1), 301);
  env.store.transaction(model => { model.state.recruitPurchases.normal.daily = 1200; });
  rejected(() => env.service.execute(600, 1), 305);
});

test('special ticket purchases feed the special draw library end to end', t => {
  const env = setup(t);
  env.seed(101500, 10000);
  const purchase = codec.unpack('pb_draw_normal_buy_ret', env.service.execute(599, 2).data);
  assert.deepEqual(purchase.res.changes.map(change => [change.tid, change.diff_num]), [
    ['101500', '-1600'],
    ['4002', '2']
  ]);
  assert.equal(loginItem(env, 4002).num, '2');

  const drawResult = env.service.execute(601, { draw_lib: 10, point_draw_num: 1 });
  const draw = codec.unpack('hero_draw_back', drawResult.data);
  assert.equal(draw.recruit_info.draw_lib, '10');
  assert.equal(draw.recruit_info.draw_count, 1);
  assert.equal(draw.res.changes.find(change => change.tid === '4002').diff_num, '-1');
  assert.equal(draw.res.changes.some(change => change.tid === '3002'), false);

  env.reopen();
  assert.equal(env.store.read().resources.get('4002').num, '1');
  assert.equal(loginItem(env, 4002).num, '1');
  assert.equal(env.store.read().resources.has('3002'), false);
  assert.equal(recruitInfo(env, 10).draw_count, 1);
});

test('special recruit uses the client record tid and updates its thirty-draw pity counter', t => {
  const env = setup(t, () => 0);
  env.seed(4002, 3);
  const response = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 10, point_draw_num: 3 }).data);
  assert.equal(Number(response.recruit_info.tid), 1011);
  assert.equal(Number(response.recruit_info.draw_lib), 10);
  assert.equal(Number(response.recruit_info.guaranteed_count), 3);
  assert.equal(Number(recruitInfo(env, 10).tid), 1011);
  assert.equal(Number(recruitInfo(env, 10).guaranteed_count), 3);
});

test('special ticket purchase encoding failure rolls back diamonds and tickets', t => {
  const env = setup(t);
  env.seed(101500, 10000);
  const before = env.store.state();
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_draw_normal_buy_ret') throw new Error('Injected purchase encoding failure');
      return codec.pack(name, value);
    }
  };
  const service = env.make({ codec: failing });
  assert.throws(() => service.execute(599, 2), /Injected purchase encoding failure/);
  assert.deepEqual(env.store.state(), before);
});

test('demigod five draw buys and consumes tickets, emits real equips and survives reopen', t => {
  const env = setup(t);
  const formationBefore = structuredClone(demigodModule(env).value[1]);
  env.seed(101500, 5000);
  const result = env.service.execute(87618, [5]);
  const response = codec.unpack('pb_fantasy_equip_draw_buy_rsp', result.data);
  assert.deepEqual(response.res.changes.filter(change => !change.extra).map(change => [change.tid, change.diff_num ?? '0']), [
    ['101500', '-2000'],
    ['808002', '0']
  ]);
  const ticketAfterFive = codec.unpack('pb_res_obj', Buffer.from(response.res.changes.find(change => change.tid === '808002').new_bin, 'base64'));
  assert.equal(ticketAfterFive.tid, '808002');
  assert.equal(Number(ticketAfterFive.num ?? 0), 0);
  const equipChanges = response.res.changes.filter(change => change.extra);
  assert.equal(equipChanges.length, 5);
  assert.deepEqual(equipChanges.map(change => change.diff_num), ['1', '1', '1', '1', '1']);
  const drawn = equipChanges.map(change => decodeDemigodEquipExtra(change.extra));
  assert.deepEqual(drawn.map(equip => equip.uid), ['1', '2', '3', '4', '5']);
  assert.equal(new Set(drawn.map(equip => equip.uid)).size, 5);
  assert.equal(response.draw.total_draw_times, '5');
  assert.equal(response.draw.left_buy_times, 5);
  assert.equal(result.pushes, undefined);
  assert.equal(Number(env.store.read().resources.get('808002').num), 0);

  const persisted = demigodEquips(env);
  assert.equal(persisted.equips.length, 5);
  assert.equal(persisted.max_equip_id, 5);
  assert.deepEqual(persisted.equips.map(equip => equip.uid), ['1', '2', '3', '4', '5']);
  assert.deepEqual(demigodModule(env).value[1], formationBefore);

  env.reopen();
  assert.equal(demigodDraw(env).total_draw_times, '5');
  assert.equal(demigodDraw(env).left_buy_times, 5);
  assert.equal(demigodEquips(env).equips.length, 5);
  assert.deepEqual(demigodModule(env).value[1], formationBefore);
});

test('demigod single draw purchases one ticket while an owned five-ticket draw spends no diamonds', t => {
  const single = setup(t);
  single.seed(101500, 1000);
  let response = codec.unpack('pb_fantasy_equip_draw_buy_rsp', single.service.execute(87618, [1]).data);
  assert.deepEqual(response.res.changes.filter(change => !change.extra).map(change => [change.tid, change.diff_num ?? '0']), [
    ['101500', '-400'],
    ['808002', '0']
  ]);
  const ticketAfterOne = codec.unpack('pb_res_obj', Buffer.from(response.res.changes.find(change => change.tid === '808002').new_bin, 'base64'));
  assert.equal(ticketAfterOne.tid, '808002');
  assert.equal(Number(ticketAfterOne.num ?? 0), 0);
  assert.equal(response.draw.total_draw_times, '1');
  assert.equal(response.draw.left_buy_times, 9);
  assert.equal(demigodEquips(single).equips.length, 1);

  const multi = setup(t);
  multi.seed(808002, 5);
  response = codec.unpack('pb_fantasy_equip_draw_buy_rsp', multi.service.execute(87618, [0]).data);
  assert.deepEqual(response.res.changes.filter(change => !change.extra).map(change => [change.tid, change.diff_num]), [
    ['808002', '-5']
  ]);
  assert.equal(response.draw.total_draw_times, '5');
  assert.equal(demigodDraw(multi).left_buy_times, 10);
  rejected(() => multi.service.execute(87618, [0]), 301);
});

test('demigod wishes replace results, reset failure progress and expose the forty-draw guarantee', t => {
  const sequence = [0.99, 0.99, 0, 0.99, 0, 0, 0, 0];
  let randomIndex = 0;
  const env = setup(t, () => sequence[randomIndex++] ?? 0);
  updateDemigodDraw(env, draw => { draw.total_draw_times = 100; });
  const wishList = [1200819, 1200919, 1201019, 1201719];
  assert.deepEqual(
    codec.unpack('pb_fantasy_draw', env.service.execute(87617, { wish_list: wishList }).data).wish_list,
    wishList
  );
  rejected(() => env.service.execute(87617, { wish_list: [1200119] }), 5);
  rejected(() => env.service.execute(87617, { wish_list: [wishList[0], wishList[0]] }), 5);
  rejected(() => env.service.execute(87617, { wish_list: [999999999] }), 5);

  updateDemigodDraw(env, draw => { draw.total_draw_times = 39; draw.wish_list = []; });
  env.seed(808002, 5);
  const result = env.service.execute(87618, [0]);
  const response = codec.unpack('pb_fantasy_equip_draw_buy_rsp', result.data);
  assert.equal(response.draw.total_draw_times, '44');
  assert.equal(result.valueForLog.results.filter(row => row.guaranteed).length, 1);

  updateDemigodDraw(env, draw => {
    draw.total_draw_times = 100;
    draw.wish_list = wishList;
    draw.wish_fail_times = 0;
  });
  sequence.splice(0, sequence.length, 0.99, 0.99, 0, 0.99, 0, 0, 0.99, 0);
  randomIndex = 0;
  env.seed(808002, 5);
  const wishedResult = env.service.execute(87618, [0]);
  const wished = codec.unpack('pb_fantasy_equip_draw_buy_rsp', wishedResult.data);
  const tids = wished.res.changes.filter(change => change.extra).map(change => Number(decodeDemigodEquipExtra(change.extra).tid));
  assert.deepEqual(tids, [1202819, 1200819, 1200719, 1200819, 1200719]);
  assert.equal(wished.draw.wish_fail_times, '1');
});

test('demigod state migrates from metadata into module 518 and encoding failure rolls back', t => {
  const env = setup(t);
  const formationBefore = structuredClone(demigodModule(env).value[1]);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(518);
    module.value[2] = serializedBinary(Buffer.alloc(0));
    model.state.demigodDraw = { wish_list: [], total_draw_times: 100, wish_fail_times: 2, refresh_stamp: now(), left_buy_times: 10 };
    model.state.modules.value = [...modules];
  });
  env.service.ensureLoginState();
  assert.equal(demigodDraw(env).total_draw_times, '100');
  assert.deepEqual(demigodModule(env).value[1], formationBefore);

  env.seed(101500, 5000);
  const before = env.store.state();
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_fantasy_equip') throw new Error('Injected demigod result encoding failure');
      return codec.pack(name, value);
    }
  };
  const service = env.make({ codec: failing });
  assert.throws(() => service.execute(87618, [1]), /Injected demigod result encoding failure/);
  assert.deepEqual(env.store.state(), before);
});

test('all four local draw libraries consume configured prices and return recruit state', t => {
  const env = setup(t);
  setDrawCounts(env, { 1: 30 });
  assert.equal(Number(recruitInfo(env, 2).daily_can_draw_num), 1000000);
  assert.equal(Number(recruitInfo(env, 10).daily_can_draw_num), 10000);
  for (const id of [2002, 3002, 4002, 401900]) env.seed(id, 10000);
  const cases = [[1, 2, 2002, '-2'], [2, 2, 3002, '-2'], [3, 2, 401900, '-200'], [10, 2, 4002, '-2']];
  for (const [lib, count, cost, expected] of cases) {
    const response = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: lib, point_draw_num: count }).data);
    assert.equal(response.res.changes[0].tid, String(cost));
    assert.equal(response.res.changes[0].diff_num, expected);
    assert.equal(Number(response.recruit_info.draw_lib), lib);
    if (lib === 2) assert.equal(Number(response.recruit_info.daily_can_draw_num), 999998);
    if (lib === 10) assert.equal(Number(response.recruit_info.daily_can_draw_num), 9998);
    assert.equal(response.recruit_info.wish_hero_list.length, 0);
  }
  const multi = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, draw_type: 1 }).data);
  assert.equal(multi.res.changes[0].diff_num, '-10');
  rejected(() => env.service.execute(601, { draw_lib: 99, draw_type: 0 }), 5);
  rejected(() => env.service.execute(601, { draw_lib: 1, point_draw_num: 11 }), 1);
});

test('leader-equipment ten draw consumes tickets, returns real equipment and survives reopen', t => {
  const env = setup(t);
  env.seed(2002, 10);
  const before = leaderEquipData(env);
  const result = env.service.execute(601, { draw_lib: 116, point_draw_num: 10 });
  const response = codec.unpack('hero_draw_back', result.data);
  assert.equal(Number(response.recruit_info.draw_lib), 116);
  assert.deepEqual(response.decompose_args, []);
  assert.deepEqual(response.res.changes[0] && [response.res.changes[0].tid, response.res.changes[0].diff_num], ['2002', '-10']);

  const equipChanges = response.res.changes.slice(1);
  assert.equal(equipChanges.length, 10);
  const decoded = equipChanges.map(change => {
    assert.equal(change.diff_num, '1');
    assert.equal(change.new_num, '1');
    assert.equal(change.new_bin, change.extra);
    const equip = codec.unpack('pb_leader_equip', Buffer.from(change.new_bin, 'base64'));
    assert.equal(change.tid, equip.tid);
    assert.equal(equip.level, 1);
    // proto3 omits scalar zero values on the wire; the client treats an absent
    // star field as zero.
    assert.equal(equip.star ?? 0, 0);
    assert.equal(leaderEquipTables.LeaderEquip.get(Number(equip.tid)).grade, 1);
    return equip;
  });
  assert.equal(new Set(decoded.map(equip => equip.uid)).size, 10);
  assert.deepEqual(result.valueForLog.results.map(entry => entry.tid), decoded.map(equip => Number(equip.tid)));

  const persisted = leaderEquipData(env);
  assert.equal(persisted.equip_list.length, before.equip_list.length + 10);
  assert.deepEqual(persisted.equip_list.slice(-10), decoded);
  assert.equal(persisted.max_uid, decoded.at(-1).uid);
  assert.equal(persisted.draw_info.lv, 1);
  env.reopen();
  assert.deepEqual(leaderEquipData(env), persisted);
});

test('draw statistics backfill historical counts and publish both draw and achievement totals', async t => {
  const env = setup(t);
  setDrawCounts(env, { 1: 5, 2: 61 });
  env.service.ensureLoginState();
  let statistics = statisticsData(env, 1);
  assert.equal(Number(statistics.list.find(row => Number(row.id) === 1).total), 5);
  assert.equal(Number(statistics.list.find(row => Number(row.id) === 2).total), 61);

  env.seed(2002, 10);
  const result = env.service.execute(601, { draw_lib: 1, point_draw_num: 2 });
  assert.equal(result.pushes.length, 2);
  assert.equal(result.pushes[0].type, 2000);
  const pushed = codec.unpack('pb_count_statics_send_list', result.pushes[0].data).data_list[0];
  assert.equal(pushed.stat_tid, 1);
  assert.deepEqual(pushed.expand_id_list, ['1']);
  assert.equal(Number(pushed.data.list.find(row => Number(row.id) === 1).total), 7);
  const achievementPush = codec.unpack('pb_count_statics_send_list', result.pushes[1].data).data_list[0];
  assert.equal(achievementPush.stat_tid, 75);
  assert.equal(achievementPush.data.list.reduce((sum, row) => sum + Number(row.total), 0), 68);
  assert.equal(Number(statisticsTid75(await customStatistics(env)).list[0].total), 68);

  env.reopen();
  statistics = statisticsData(env, 1);
  assert.equal(Number(statistics.list.find(row => Number(row.id) === 1).total), 7);
  assert.equal(Number(statistics.list.find(row => Number(row.id) === 2).total), 61);
  assert.equal(Number(statisticsTid75(await customStatistics(env)).list[0].total), 68);
});

test('draw achievement awards validate progress, persist their bit state and reject duplicate claims', t => {
  const env = setup(t);
  setDrawCounts(env, { 1: 20 });
  rejected(() => env.service.execute(662, [2002]), 305);
  let response = codec.unpack('pb_res_to_client', env.service.execute(662, [2001]).data);
  assert.deepEqual(response.changes.map(change => [change.tid, change.diff_num]), [['391002', '400']]);
  let achievement = drawInfo(env).achieve_list.find(row => Number(row.tid) === 2);
  assert.deepEqual([...Buffer.from(achievement.award_state, 'base64')], [0x80]);

  setDrawCounts(env, { 1: 40 });
  response = codec.unpack('pb_res_to_client', env.service.execute(662, [2002]).data);
  assert.deepEqual(response.changes.map(change => [change.tid, change.diff_num]), [['392002', '10']]);
  achievement = drawInfo(env).achieve_list.find(row => Number(row.tid) === 2);
  assert.deepEqual([...Buffer.from(achievement.award_state, 'base64')], [0xc0]);
  rejected(() => env.service.execute(662, [2001]), 305);
  rejected(() => env.service.execute(662, [9999]), 5);

  env.reopen();
  achievement = drawInfo(env).achieve_list.find(row => Number(row.tid) === 2);
  assert.deepEqual([...Buffer.from(achievement.award_state, 'base64')], [0xc0]);
  rejected(() => env.service.execute(662, [2002]), 305);
});

test('draw achievement encoding failure rolls back reward and claim state', t => {
  const env = setup(t);
  setDrawCounts(env, { 1: 20 });
  const before = env.store.state();
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_res_to_client') throw new Error('Injected achievement response failure');
      return codec.pack(name, value);
    }
  };
  assert.throws(() => env.make({ codec: failing }).execute(662, [2001]), /Injected achievement response failure/);
  assert.deepEqual(env.store.state(), before);
});

test('single draws merge into the legacy default-key draw counter', t => {
  const env = setup(t);
  setDrawCounts(env, { 1: 30 });
  updateRecruitInfo(env, 2, info => {
    info.draw_num_kv_list = [{ key: 1, value: '60' }, { value: '1' }];
  });
  env.seed(3002, 10);
  env.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  const rows = recruitInfo(env, 2).draw_num_kv_list;
  assert.equal(rows.find(row => Number(row.key ?? 0) === 1)?.value, '60');
  assert.equal(rows.find(row => Number(row.key ?? 0) === 0)?.value, '2');
});

test('pool rules use different weights, lock quality 60 before 100 draws and never expose quality 70', () => {
  const catalog = buildRecruitPoolCatalog(heroTables);
  const signatures = new Set();
  for (const lib of [1, 2, 3, 10]) {
    const pool = catalog.get(lib);
    assert.ok(pool);
    assert.equal(pool.rule.qualityWeights.some(([quality]) => quality === 70), false);
    assert.equal(pool.heroes.some(hero => hero.quality === 70), false);
    signatures.add(JSON.stringify(pool.rule.qualityWeights));
  }
  assert.equal(signatures.size, 4);
  assert.equal(catalog.get(3).rule.qualityWeights.some(([quality]) => quality === 60), false);

  const at99 = completedDrawCounts(new Map([[1, { draw_count: 50 }], [2, { draw_count: 49 }], [3, { draw_count: 0 }], [10, { draw_count: 0 }]]));
  const at100 = completedDrawCounts(new Map([[1, { draw_count: 50 }], [2, { draw_count: 50 }], [3, { draw_count: 0 }], [10, { draw_count: 0 }]]));
  assert.equal(at99.total, 99);
  assert.equal(at100.total, 100);
  for (const lib of [1, 2, 10]) {
    assert.equal(availableQualityWeights(catalog.get(lib).rule, at99).some(([quality]) => quality === 60), false);
    assert.equal(availableQualityWeights(catalog.get(lib).rule, at100).some(([quality]) => quality === 60), true);
  }
});

test('elite draw excludes quality 70 and opens quality 60 only after 100 completed draws', t => {
  const env = setup(t, () => 0.999999999999);
  setDrawCounts(env, { 1: 60, 2: 39, 3: 0, 10: 0 });
  setPity(env, 2, 0);
  env.seed(3002, 10);
  let result = env.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  assert.equal(result.valueForLog.results[0].quality, 50);
  setDrawCounts(env, { 1: 60, 2: 38 });
  setPity(env, 2, 29);
  result = env.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  assert.equal(result.valueForLog.results[0].quality, 50);
  assert.equal(result.valueForLog.results[0].guaranteed, true);
  setDrawCounts(env, { 1: 60, 2: 40 });
  setPity(env, 2, 0);
  result = env.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  assert.equal(result.valueForLog.results[0].quality, 60);
  assert.equal(result.valueForLog.results.some(draw => draw.quality === 70), false);
});

test('elite unlock is enforced for new state and preserves existing progressed pools', t => {
  const fresh = setup(t);
  setDrawCounts(fresh, { 1: 0, 2: 0 });
  fresh.seed(3002, 10);
  rejected(() => fresh.service.execute(601, { draw_lib: 2, point_draw_num: 1 }), 305);
  setDrawCounts(fresh, { 1: 30 });
  const response = fresh.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  assert.equal(response.value.recruit_info.daily_draw_count, 1);

  const legacy = setup(t);
  setDrawCounts(legacy, { 1: 0, 2: 1 });
  legacy.seed(3002, 10);
  assert.doesNotThrow(() => legacy.service.execute(601, { draw_lib: 2, point_draw_num: 1 }));
});

test('elite wish selections persist per library and replace matching SSR and UR draws', t => {
  const env = setup(t, () => 0.9);
  setDrawCounts(env, { 1: 50, 2: 50 });
  setPity(env, 2, 0);
  env.service.execute(642, {
    draw_lib: 2,
    choose_item_list: [
      { index: 0, hero_tid: 1030101 },
      { index: 2, hero_tid: 1040101 }
    ]
  });
  env.seed(3002, 10);
  let result = env.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  assert.deepEqual(result.valueForLog.results[0], {
    tid: 1030101,
    quality: 50,
    guaranteed: false,
    wishHero: true
  });

  const urEnv = setup(t, () => 0.999999999999);
  setDrawCounts(urEnv, { 1: 50, 2: 50 });
  setPity(urEnv, 2, 0);
  urEnv.service.execute(642, {
    draw_lib: 2,
    choose_item_list: [{ index: 2, hero_tid: 1040101 }]
  });
  urEnv.seed(3002, 10);
  result = urEnv.service.execute(601, { draw_lib: 2, point_draw_num: 1 });
  assert.equal(result.valueForLog.results[0].tid, 1040101);
  assert.equal(result.valueForLog.results[0].quality, 60);
  assert.equal(result.valueForLog.results[0].wishHero, true);
});

test('new heroes persist, duplicate heroes convert to chips and avoid duplicate hero extras', async t => {
  const env = setup(t);
  env.seed(2002, 10);
  const before = env.store.read().heroInfo.hero_list.length;
  const first = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const newChange = first.res.changes.find(change => change.tid === '21100104');
  const quality = Number(heroTables.Hero.get(1010101).quality);
  const convertCount = Number(heroTables.Quality.get(quality).convert_piece_new);
  assert.equal(newChange.diff_num, String(convertCount));
  // HeroDrawUILogic.FilterAwards renders floor(diff_num / convert_piece_new) cards.
  assert.equal(Number(newChange.diff_num) / convertCount, 1);
  // A first unlock is already represented by the full-chip resource change
  // below. HeroDrawUILogic converts that change to one card; a decompose entry
  // would add a second card for the same pull.
  assert.deepEqual(first.decompose_args, []);
  const syncedHero = await decodeHeroExtra(newChange.extra);
  assert.equal(syncedHero.tid, '1010101');
  assert.equal(syncedHero.uid, '1010101');
  assert.equal(env.store.read().heroInfo.hero_list.length, before + 1);
  const loginHeroes = codec.unpack('pb_hero_info', rawBinary(new Map(env.store.state().modules.value).get(10).value[0]));
  const recruited = loginHeroes.hero_list.find(hero => Number(hero.tid) === 1010101);
  assert.ok(recruited);
  assert.equal(recruited.uid, recruited.tid);
  assert.equal(recruited.uid, '1010101');
  // A newly unlocked hero must be usable for the next squad edit without
  // relogging: the model has already received the same hero through ResChange.
  const lineupService = createLineupService({ store: env.store, codec });
  const preset = structuredClone(env.store.read().lineups.pre_lineups[0]);
  preset.lineup.fighter_list.push({ loc: 1, index: 5, hero_id: recruited.uid });
  const lineupResponse = codec.unpack('pb_edit_pre_lineup_rsp', lineupService.execute(209, {
    pre_lineup_list: [preset],
    handle_types: []
  }).data);
  assert.ok(lineupResponse.role_lineup.pre_lineups[0].lineup.fighter_list.some(fighter => fighter.hero_id === recruited.uid));
  env.reopen();
  assert.equal(env.store.read().heroInfo.hero_list.find(hero => hero.tid === recruited.tid)?.uid, recruited.uid);
  assert.ok(env.store.read().lineups.pre_lineups[0].lineup.fighter_list.some(fighter => fighter.hero_id === recruited.uid));
  const second = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const duplicate = second.res.changes.find(change => change.tid === '21100104');
  assert.equal(duplicate.diff_num, String(convertCount));
  assert.deepEqual(second.decompose_args, []);
  assert.equal(duplicate.extra, undefined);
  assert.equal(env.store.read().heroInfo.hero_list.length, before + 1);
});

test('ten draws never add duplicate result cards for newly unlocked heroes', t => {
  const env = setup(t);
  env.seed(2002, 10);
  const result = env.service.execute(601, { draw_lib: 1, point_draw_num: 10 });
  const response = codec.unpack('hero_draw_back', result.data);
  const cardChanges = response.res.changes.filter(change => Number(change.diff_num) > 0 && Number(change.tid) !== 2002);
  assert.equal(cardChanges.length, 10);
  const renderedCards = cardChanges.reduce((sum, change, index) => {
    const convertCount = Number(heroTables.Quality.get(result.valueForLog.results[index].quality)?.convert_piece_new ?? 0);
    return sum + (convertCount > 0 ? Math.floor(Number(change.diff_num) / convertCount) : 0);
  }, response.decompose_args.length);
  assert.equal(renderedCards, 10);
  assert.deepEqual(response.decompose_args, []);
});

test('pity persists across reopen and forces a quality-five hero at the configured threshold', async t => {
  const env = setup(t, () => 0);
  env.seed(2002, 10);
  setPity(env, 1, 49);
  const response = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const heroChange = response.res.changes.find(change => change.extra);
  const hero = await decodeHeroExtra(heroChange.extra);
  assert.ok(heroTables.Hero.get(Number(hero.tid)).quality >= 50);
  assert.equal(Number(response.recruit_info.guaranteed_count ?? 0), 0);
  env.reopen();
  assert.equal(Number(recruitInfo(env, 1).guaranteed_count ?? 0), 0);
});

test('draw encoding failure rolls back costs, heroes and recruit state', t => {
  const env = setup(t);
  env.seed(2002, 10);
  const before = env.store.state();
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'hero_draw_back') throw new Error('Injected recruit encoding failure');
      return codec.pack(name, value);
    }
  };
  const service = env.make({ codec: failing });
  assert.throws(() => service.execute(601, { draw_lib: 1, point_draw_num: 1 }), /Injected recruit encoding failure/);
  assert.deepEqual(env.store.state(), before);
});

test('statistics push encoding failure rolls back the entire draw', t => {
  const env = setup(t);
  env.seed(2002, 10);
  const before = env.store.state();
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_count_statics_send_list') throw new Error('Injected statistics push failure');
      return codec.pack(name, value);
    }
  };
  const service = env.make({ codec: failing });
  assert.throws(() => service.execute(601, { draw_lib: 1, point_draw_num: 1 }), /Injected statistics push failure/);
  assert.deepEqual(env.store.state(), before);
});

test('wish selection enforces progress, quality quotas and the elite library', t => {
  const env = setup(t);
  rejected(() => env.service.execute(642, { draw_lib: 2, choose_item_list: [{ index: 0, hero_tid: 1030101 }] }), 305);
  rejected(() => env.service.execute(642, { draw_lib: 1, choose_item_list: [{ index: 0, hero_tid: 1030101 }] }), 5);
  setDrawCounts(env, { 1: 50, 2: 50 });
  let response = codec.unpack('pb_hero_recruit', env.service.execute(642, {
    draw_lib: 2,
    choose_item_list: [
      { index: 0, hero_tid: 1030101 },
      { index: 1, hero_tid: 1030201 },
      { index: 2, hero_tid: 1040101 }
    ]
  }).data);
  assert.deepEqual(response.wish_hero_list.map(item => item.tid), ['1030101', '1030201', '1040101']);
  rejected(() => env.service.execute(642, {
    draw_lib: 2,
    choose_item_list: [
      { index: 0, hero_tid: 1030101 },
      { index: 1, hero_tid: 1030201 },
      { index: 2, hero_tid: 1030301 }
    ]
  }), 5);
  rejected(() => env.service.execute(642, {
    draw_lib: 2,
    choose_item_list: [{ index: 0, hero_tid: 5040601 }]
  }), 5);
  response = codec.unpack('pb_hero_recruit', env.service.execute(657, {
    draw_lib: 2,
    choose_item_list: [{ index: 1, hero_tid: 2030101 }]
  }).data);
  assert.equal(response.extra_wish_list[0].tid, '2030101');
  response = codec.unpack('pb_hero_recruit', env.service.execute(643, [2, 0]).data);
  assert.deepEqual(response.wish_hero_list.map(item => item.tid), ['1030201', '1040101']);
  response = codec.unpack('pb_hero_recruit', env.service.execute(658, [2, 1]).data);
  assert.equal(response.extra_wish_list.length, 0);
  const support = codec.unpack('pb_draw_support_back', env.service.execute(652, [1]).data);
  assert.deepEqual(support.role_support.support_list, []);
  assert.deepEqual(support.server_support.support_list, []);
  const marquee = codec.unpack('pb_draw_marquee_rsp', env.service.execute(673, { draw_lib: 1 }).data);
  assert.ok(marquee.data === undefined || marquee.data === '');
});
