import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroBondTables } from '../config/hero-bond-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createHeroBondService } from '../game/hero-bond-service.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const bondTables = readHeroBondTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = Date.UTC(2026, 0, 2, 0, 0) / 1000;

// Fetter 1040101 gather_args[0] = [1030501], [1] = [1030301], [2] = [1030401],
// [3] = [4030401] with gather_condition all 101 (own the listed hero).
const FETTER_HERO = 1040101;
const FETTER_GATHER_HEROES = [1030501, 1030301, 1030401, 4030401];
const DIFF_HERO = 1010101;
const DIFF_ITEM = 533002;
const PENDANT_HERO = 5040701;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 12, nick_name: Buffer.from('Hero Bond Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-bond-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  let now = GAME_AT;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    directory,
    get store() { return store; },
    service(useCodec = codec) {
      return createHeroBondService({ store, codec: useCodec, tables, heroTables, bondTables, now: () => now * 1000 });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function grant(env, awards) {
  env.store.transaction(model => grantResources(model, awards, tables));
}

function addHero(env, tid, overrides = {}) {
  env.store.transaction(model => {
    const config = heroTables.Hero.get(tid);
    model.heroInfo.hero_list.push({
      tid: String(tid), uid: String(tid), count: 1, level: 1,
      star: Number(config.star ?? 0), star_progress: 0, breakthrough_level: 0,
      quality: Number(config.quality ?? 0), relic: [], up_star_high_consume: [],
      source_point_list: [], pendant_select_list: [], ...overrides
    });
  });
}

function resource(env, tid) {
  return BigInt(env.store.read().resources.get(String(tid))?.num ?? 0);
}

function hero(env, tid) {
  return env.store.read().heroInfo.hero_list.find(entry => Number(entry.tid) === tid) ?? null;
}

function drawInfo(env) {
  const modules = new Map(env.store.state().modules.value);
  const module = modules.get(10);
  const bytes = module.value[2] ? rawBinary(module.value[2]) : Buffer.alloc(0);
  return { info: bytes.length ? codec.unpack('pb_hero_draw_info', bytes) : { recruit_list: [], achieve_list: [] }, modules, module };
}

function setDrawCount(env, drawCount, extra = {}) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(10);
    const bytes = module.value[2] ? rawBinary(module.value[2]) : Buffer.alloc(0);
    const info = bytes.length ? codec.unpack('pb_hero_draw_info', bytes) : { recruit_list: [], achieve_list: [] };
    info.recruit_list ??= [];
    info.achieve_list ??= [];
    let record = info.recruit_list.find(entry => Number(entry.tid) === 2 || Number(entry.draw_lib) === 2);
    if (!record) {
      record = { tid: 2, draw_lib: '2', custom_choose_index: 0 };
      info.recruit_list.push(record);
    }
    record.draw_count = drawCount;
    Object.assign(record, extra);
    module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', info));
    model.state.modules.value = [...modules];
  });
}

function serializedBinary(value) {
  return { value: Buffer.from(value).toJSON(), bits: 8 };
}

const helpers = {
  unpack: (schema, data) => codec.unpack(schema, data ?? Buffer.alloc(0)),
  etf: async data => {
    const decoded = await decodeEtf(data);
    return decoded?.value ?? decoded;
  },
  singleId: async (data, message) => {
    const decoded = await decodeEtf(data);
    const value = decoded?.value ?? decoded;
    const candidate = Array.isArray(value) ? (value.length === 1 ? value[0] : undefined) : value;
    const id = Number(candidate);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(message);
    return id;
  }
};

async function call(service, type, raw) {
  const input = await service.decode(type, raw, helpers);
  return service.execute(type, input);
}

function codeOf(fn) {
  try {
    fn();
  } catch (error) {
    return error.code ?? error.message;
  }
  return null;
}

async function asyncCodeOf(promise) {
  try {
    await promise;
  } catch (error) {
    return error.code ?? error.message;
  }
  return null;
}

test('602 records the school choice in the quality draw record and survives a reopen', async t => {
  const env = setup(t);
  const service = env.service();
  assert.equal(service.supports(602), true);
  assert.equal(service.supports(661), true);
  assert.equal(service.supports(636), false);

  await assert.rejects(call(service, 602, await encodeEtf([2])), error => error.code === 5);
  setDrawCount(env, 7);
  await assert.rejects(call(service, 602, await encodeEtf([2])), error => error.code === 5);
  setDrawCount(env, 8);

  const result = await call(service, 602, await encodeEtf([2]));
  assert.equal(result.schema, 'pb_hero_recruit');
  assert.equal(Number(result.value.custom_choose_index), 2);
  const stored = drawInfo(env).info.recruit_list.find(entry => Number(entry.tid) === 2);
  assert.equal(Number(stored.custom_choose_index), 2);
  assert.equal(Number(stored.draw_count), 8);
  assert.deepEqual(codec.unpack('pb_hero_recruit', result.data).custom_choose_index, 2);
  await assert.rejects(call(service, 602, await encodeEtf([3])), error => error.code === 5);

  env.reopen();
  const reopened = env.service();
  await assert.rejects(call(reopened, 602, await encodeEtf([1])), error => error.code === 5);
  const afterReopen = drawInfo(env).info.recruit_list.find(entry => Number(entry.tid) === 2);
  assert.equal(Number(afterReopen.custom_choose_index), 2);
});

test('602 rejects unknown school indexes and malformed payloads', async t => {
  const env = setup(t);
  const service = env.service();
  setDrawCount(env, 8);
  await assert.rejects(call(service, 602, await encodeEtf([9])), error => error.code === 3001);
  await assert.rejects(call(service, 602, await encodeEtf([0])), error => error.code === 1);
  await assert.rejects(call(service, 602, await encodeEtf(['x'])), error => error.code === 1);
  await assert.rejects(call(service, 602, Buffer.from([131, 96])), error => error.code === 1);
  assert.equal(Number(drawInfo(env).info.recruit_list.find(entry => Number(entry.tid) === 2).custom_choose_index ?? 0), 0);
});

test('602 rolls back when the protobuf encoder rejects the recruit record', async t => {
  const env = setup(t);
  setDrawCount(env, 8);
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_hero_recruit') throw new Error('encode failure');
      return codec.pack(name, value);
    }
  };
  const service = env.service(failingCodec);
  await assert.rejects(call(service, 602, await encodeEtf([2])), /encode failure/);
  assert.equal(Number(drawInfo(env).info.recruit_list.find(entry => Number(entry.tid) === 2).custom_choose_index ?? 0), 0);
});

test('654 activates a gather fetter, rejects repeats and keeps the record after a reopen', async t => {
  const env = setup(t);
  const service = env.service();
  addHero(env, FETTER_HERO);
  const request = codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 1 });

  await assert.rejects(call(service, 654, request), error => error.code === 5);
  addHero(env, FETTER_GATHER_HEROES[0]);
  const result = await call(service, 654, request);
  assert.equal(result.schema, null);
  assert.deepEqual(result.data, Buffer.alloc(0));
  assert.equal(result.value.gather_heroes.length, 1);
  await assert.rejects(call(service, 654, request), error => error.code === 5);

  env.reopen();
  const reopened = env.service();
  await assert.rejects(call(reopened, 654, request), error => error.code === 5);
  const second = codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 2 });
  await assert.rejects(call(reopened, 654, second), error => error.code === 5);
  addHero(env, FETTER_GATHER_HEROES[1]);
  const activated = await call(reopened, 654, second);
  assert.equal(activated.value.fetter_idx, 2);
  assert.deepEqual(activated.value.gather_heroes, [FETTER_GATHER_HEROES[1]]);
});

test('654 rejects unowned heroes, unknown fetters and out-of-range indexes', async t => {
  const env = setup(t);
  const service = env.service();
  for (const tid of FETTER_GATHER_HEROES) addHero(env, tid);
  await assert.rejects(call(service, 654, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 1 })),
    error => error.code === 3001);
  addHero(env, FETTER_HERO);
  const noFetterHero = [...heroTables.Hero.keys()].map(Number).find(tid => !bondTables.Fetter.has(tid));
  assert.ok(noFetterHero, 'the dump contains a hero without a Fetter row');
  addHero(env, noFetterHero);
  await assert.rejects(call(service, 654, codec.pack('pb_active_fetter_req', { hero_tid: noFetterHero, fetter_idx: 1 })),
    error => error.code === 305);
  await assert.rejects(call(service, 654, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 9 })),
    error => error.code === 3001);
  await assert.rejects(call(service, 654, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 0 })),
    error => error.code === 1);
});

test('661 consumes diff items, writes the hero marker and rejects repeats', async t => {
  const env = setup(t);
  const service = env.service();
  addHero(env, DIFF_HERO);
  grant(env, [[DIFF_ITEM, 10]]);

  const result = await call(service, 661, await encodeEtf([DIFF_HERO]));
  assert.equal(result.schema, 'pb_hero_diff_back');
  assert.equal(resource(env, DIFF_ITEM), 0n);
  assert.equal(result.value.res.changes.find(change => Number(change.tid) === DIFF_ITEM).diff_num, '-10');
  assert.equal(Number(hero(env, DIFF_HERO).diff), 1);
  assert.equal(Number(codec.unpack('pb_hero_diff_back', result.data).new_hero.diff), 1);
  await assert.rejects(call(service, 661, await encodeEtf([DIFF_HERO])), error => error.code === 5);

  env.reopen();
  const reopened = env.service();
  assert.equal(Number(hero(env, DIFF_HERO).diff), 1);
  await assert.rejects(call(reopened, 661, await encodeEtf([DIFF_HERO])), error => error.code === 5);
});

test('661 rejects missing heroes, insufficient items and heroes without diff rows', async t => {
  const env = setup(t);
  const service = env.service();
  await assert.rejects(call(service, 661, await encodeEtf([DIFF_HERO])), error => error.code === 3001);
  addHero(env, DIFF_HERO);
  grant(env, [[DIFF_ITEM, 9]]);
  await assert.rejects(call(service, 661, await encodeEtf([DIFF_HERO])), error => error.code === 301);
  assert.equal(resource(env, DIFF_ITEM), 9n);
  assert.equal(hero(env, DIFF_HERO).diff ?? 0, 0);
  const heroWithoutDiff = [...heroTables.Hero.keys()].map(Number).find(tid => !bondTables.Diff.has(tid));
  assert.ok(heroWithoutDiff, 'the dump contains a hero without a Diff row');
  addHero(env, heroWithoutDiff);
  await assert.rejects(call(service, 661, await encodeEtf([heroWithoutDiff])), error => error.code === 305);
  await assert.rejects(call(service, 661, await encodeEtf([0])), error => error.code === 1);
  await assert.rejects(call(service, 661, await encodeEtf([DIFF_HERO, DIFF_HERO])), error => error.code === 1);
});

test('661 rolls back the item cost when encoding fails', async t => {
  const env = setup(t);
  addHero(env, DIFF_HERO);
  grant(env, [[DIFF_ITEM, 10]]);
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_hero_diff_back') throw new Error('encode failure');
      return codec.pack(name, value);
    }
  };
  const service = env.service(failingCodec);
  await assert.rejects(call(service, 661, await encodeEtf([DIFF_HERO])), /encode failure/);
  assert.equal(resource(env, DIFF_ITEM), 10n);
  assert.equal(hero(env, DIFF_HERO).diff ?? 0, 0);
});

test('672 stores the star pendant selection, validates unlocks and survives a reopen', async t => {
  const env = setup(t);
  const service = env.service();
  addHero(env, PENDANT_HERO, { star: 6 });

  const result = await call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO),
    pendants: [{ index: 1, pendant_tid: '1' }]
  }));
  assert.equal(result.schema, 'pb_hero_select_pendant_rsp');
  assert.deepEqual(result.value.pendants, [{ index: 1, pendant_tid: '1' }]);
  assert.deepEqual(hero(env, PENDANT_HERO).pendant_select_list, [{ index: 1, pendant_tid: '1' }]);

  const locked = await asyncCodeOf(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO),
    pendants: [{ index: 1, pendant_tid: '2' }]
  })));
  assert.equal(locked, 305);

  env.store.transaction(model => {
    model.heroInfo.hero_list.find(entry => Number(entry.tid) === PENDANT_HERO).star = 8;
  });
  const upgraded = await call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO),
    pendants: [{ index: 1, pendant_tid: '2' }]
  }));
  assert.deepEqual(upgraded.value.pendants, [{ index: 1, pendant_tid: '2' }]);

  env.reopen();
  const reopened = env.service();
  const cleared = await call(reopened, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO),
    pendants: [{ index: 1, pendant_tid: '0' }]
  }));
  assert.deepEqual(cleared.value.pendants, []);
  assert.deepEqual(hero(env, PENDANT_HERO).pendant_select_list, []);
});

test('672 rejects unknown parts, mismatched pendants, duplicates and empty requests', async t => {
  const env = setup(t);
  const service = env.service();
  addHero(env, PENDANT_HERO, { star: 8 });
  await assert.rejects(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(9999999), pendants: [{ index: 1, pendant_tid: '1' }]
  })), error => error.code === 3001);
  await assert.rejects(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO), pendants: []
  })), error => error.code === 1);
  await assert.rejects(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO), pendants: [{ index: 2, pendant_tid: '1' }]
  })), error => error.code === 3001);
  await assert.rejects(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO), pendants: [{ index: 1, pendant_tid: '1' }, { index: 1, pendant_tid: '2' }]
  })), error => error.code === 1);
  await assert.rejects(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO), pendants: [{ index: 1, pendant_tid: '999' }]
  })), error => error.code === 3001);
  assert.deepEqual(hero(env, PENDANT_HERO).pendant_select_list, []);
});

test('672 keeps the stored selection when encoding fails', async t => {
  const env = setup(t);
  addHero(env, PENDANT_HERO, { star: 8 });
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_hero_select_pendant_rsp') throw new Error('encode failure');
      return codec.pack(name, value);
    }
  };
  const service = env.service(failingCodec);
  await assert.rejects(call(service, 672, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: String(PENDANT_HERO), pendants: [{ index: 1, pendant_tid: '2' }]
  })), /encode failure/);
  assert.deepEqual(hero(env, PENDANT_HERO).pendant_select_list, []);
});

test('the service rejects unknown command types', async t => {
  const env = setup(t);
  const service = env.service();
  assert.equal(codeOf(() => service.execute(636, {})), 1);
  assert.equal(await asyncCodeOf(service.decode(636, Buffer.alloc(0), helpers)), 1);
});
