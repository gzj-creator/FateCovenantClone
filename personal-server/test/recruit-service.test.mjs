import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createRecruitService } from '../game/recruit-service.mjs';
import {
  RECRUIT_POOL_RULES,
  availableQualityWeights,
  buildRecruitPoolCatalog,
  completedDrawCounts
} from '../game/recruit-pool-rules.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const heroTables = readHeroTables();
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
  const make = (override = {}) => createRecruitService({ store, codec, tables, heroTables, random, now, ...override });
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

const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('ticket purchases deduct diamonds, persist limits and reject insufficient funds', t => {
  const env = setup(t);
  env.seed(101500, 10000);
  const normal = codec.unpack('pb_draw_normal_buy_ret', env.service.execute(600, 2).data);
  assert.deepEqual(normal.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '-500'], ['2002', '2']]);
  assert.equal(normal.buy_info.buy_max_num, 1198);
  const magic = codec.unpack('pb_draw_normal_buy_ret', env.service.execute(599, 2).data);
  assert.deepEqual(magic.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '-1600'], ['3002', '2']]);
  assert.equal(magic.buy_info.buy_max_num, 58);
  env.reopen();
  assert.equal(env.store.read().resources.get('2002').num, '2');
  assert.equal(env.store.read().resources.get('3002').num, '2');
  env.seed(101500, 100);
  rejected(() => env.service.execute(600, 1), 301);
  env.store.transaction(model => { model.state.recruitPurchases.normal.daily = 1200; });
  rejected(() => env.service.execute(600, 1), 305);
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
  assert.deepEqual(first.decompose_args, []);
  assert.equal(await decodeEtf(Buffer.from(newChange.extra, 'base64')), 1010101);
  assert.equal(env.store.read().heroInfo.hero_list.length, before + 1);
  const loginHeroes = codec.unpack('pb_hero_info', rawBinary(new Map(env.store.state().modules.value).get(10).value[0]));
  const recruited = loginHeroes.hero_list.find(hero => Number(hero.tid) === 1010101);
  assert.ok(recruited);
  assert.equal(recruited.uid, recruited.tid);
  assert.equal(recruited.uid, '1010101');
  env.reopen();
  const second = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const duplicate = second.res.changes.find(change => change.tid === '21100104');
  assert.equal(duplicate.diff_num, String(convertCount));
  assert.deepEqual(second.decompose_args, []);
  assert.equal(duplicate.extra, undefined);
  assert.equal(env.store.read().heroInfo.hero_list.length, before + 1);
});

test('pity persists across reopen and forces a quality-five hero at the configured threshold', async t => {
  const env = setup(t, () => 0);
  env.seed(2002, 10);
  setPity(env, 1, 49);
  const response = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const heroChange = response.res.changes.find(change => change.extra);
  const heroTid = await decodeEtf(Buffer.from(heroChange.extra, 'base64'));
  assert.ok(heroTables.Hero.get(heroTid).quality >= 50);
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
