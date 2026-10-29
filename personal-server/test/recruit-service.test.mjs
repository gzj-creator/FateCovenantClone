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
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(10);
    const info = codec.unpack('pb_hero_draw_info', rawBinary(module.value[2]));
    info.recruit_list.find(entry => Number(entry.draw_lib) === lib).guaranteed_count = value;
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

test('new heroes persist, duplicate heroes convert to chips and avoid duplicate hero extras', async t => {
  const env = setup(t);
  env.seed(2002, 10);
  const before = env.store.read().heroInfo.hero_list.length;
  const first = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const newChange = first.res.changes.find(change => change.tid === '21100104');
  assert.equal(newChange.diff_num, '1');
  assert.equal(await decodeEtf(Buffer.from(newChange.extra, 'base64')), 1010101);
  assert.equal(env.store.read().heroInfo.hero_list.length, before + 1);
  const loginHeroes = codec.unpack('pb_hero_info', rawBinary(new Map(env.store.state().modules.value).get(10).value[0]));
  assert.ok(loginHeroes.hero_list.some(hero => Number(hero.tid) === 1010101));
  env.reopen();
  const second = codec.unpack('hero_draw_back', env.service.execute(601, { draw_lib: 1, point_draw_num: 1 }).data);
  const duplicate = second.res.changes.find(change => change.tid === '21100104');
  assert.equal(duplicate.diff_num, '10');
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

test('wish selection, removal, support reads and marquee reads use their exact response schemas', t => {
  const env = setup(t);
  let response = codec.unpack('pb_hero_recruit', env.service.execute(642, { draw_lib: 1, choose_item_list: [{ index: 0, hero_tid: 1010101 }] }).data);
  assert.equal(response.wish_hero_list[0].tid, '1010101');
  response = codec.unpack('pb_hero_recruit', env.service.execute(643, [1, 0]).data);
  assert.equal(response.wish_hero_list.length, 0);
  response = codec.unpack('pb_hero_recruit', env.service.execute(657, { draw_lib: 1, choose_item_list: [{ index: 1, hero_tid: 1010201 }] }).data);
  assert.equal(response.extra_wish_list[0].tid, '1010201');
  response = codec.unpack('pb_hero_recruit', env.service.execute(658, [1, 1]).data);
  assert.equal(response.extra_wish_list.length, 0);
  const support = codec.unpack('pb_draw_support_back', env.service.execute(652, [1]).data);
  assert.deepEqual(support.role_support.support_list, []);
  assert.deepEqual(support.server_support.support_list, []);
  const marquee = codec.unpack('pb_draw_marquee_rsp', env.service.execute(673, { draw_lib: 1 }).data);
  assert.ok(marquee.data === undefined || marquee.data === '');
});
