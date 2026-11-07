import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createHeroExtraService } from '../game/hero-extra-service.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = Date.UTC(2026, 0, 2, 0, 0) / 1000;
const CHIP_TID = 21300104;
const CHIP_HERO_TID = 1030101;
const VIP_REFORGE_HERO = 1040301;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Hero Extra Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-extra-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  let now = GAME_AT;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get now() { return now; },
    setNow(value) { now = value; },
    service(useCodec = codec, useRandom = () => 0.42) {
      return createHeroExtraService({ store, codec: useCodec, tables, heroTables, now: () => now, random: useRandom });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function grant(env, awards) {
  env.store.transaction(model => grantResources(model, awards, tables));
}

function addHero(env, tid) {
  env.store.transaction(model => {
    const config = heroTables.Hero.get(tid);
    model.heroInfo.hero_list.push({
      tid: String(tid), uid: String(tid), count: 1, level: 1,
      star: Number(config.star ?? 0), star_progress: 0, breakthrough_level: 0,
      quality: Number(config.quality ?? 0), relic: [], up_star_high_consume: [],
      source_point_list: [], pendant_select_list: []
    });
  });
}

function resource(env, tid) {
  return BigInt(env.store.read().resources.get(String(tid))?.num ?? 0);
}

function visitState(env) {
  return codec.unpack('pb_role_hero_visit', rawBinary(new Map(env.store.state().modules.value).get(10).value[5]));
}

test('614 composes an unowned hero from chips, rejects repeats and survives a reopen', async t => {
  const env = setup(t);
  const service = env.service();
  grant(env, [[CHIP_TID, 90]]);
  assert.equal(env.store.read().heroInfo.hero_list.some(hero => Number(hero.tid) === CHIP_HERO_TID), false);

  const result = service.execute(614, { tid: CHIP_TID, num: 90 });
  assert.equal(result.schema, 'pb_res_to_client');
  assert.equal(result.value.changes.find(change => Number(change.tid) === CHIP_TID).diff_num, '-60');
  const hero = env.store.read().heroInfo.hero_list.find(entry => Number(entry.tid) === CHIP_HERO_TID);
  assert.ok(hero);
  const extra = await decodeEtf(Buffer.from(result.value.changes[0].extra, 'base64'));
  assert.equal(extra.value.length, 1);
  assert.equal(Number(codec.unpack('hero', Buffer.from(extra.value[0].value)).tid), CHIP_HERO_TID);
  assert.equal(resource(env, CHIP_TID), 30n);

  assert.throws(() => service.execute(614, { tid: CHIP_TID, num: 20 }), error => error.code === 5);
  env.reopen();
  assert.equal(env.store.read().heroInfo.hero_list.some(entry => Number(entry.tid) === CHIP_HERO_TID), true);
});

test('614 rejects insufficient chips and rolls back when response encoding fails', t => {
  const env = setup(t);
  const service = env.service();
  grant(env, [[CHIP_TID, 59]]);
  assert.throws(() => service.execute(614, { tid: CHIP_TID, num: 59 }), error => error.code === 5);
  grant(env, [[CHIP_TID, 1]]);
  const broken = Object.assign(Object.create(codec), {
    pack(schema, value) {
      if (schema === 'pb_res_to_client') throw new Error('encode failure');
      return codec.pack(schema, value);
    }
  });
  assert.throws(() => env.service(broken).execute(614, { tid: CHIP_TID, num: 60 }), /encode failure/);
  assert.equal(resource(env, CHIP_TID), 60n);
  assert.equal(env.store.read().heroInfo.hero_list.some(hero => Number(hero.tid) === CHIP_HERO_TID), false);
});

test('647 visits grant the configured hero chip, enforce the daily limit and reset at 05:00', t => {
  const env = setup(t);
  const service = env.service();
  const first = service.execute(647, 2010101);
  assert.equal(first.schema, 'pb_hero_visit_rsp');
  assert.equal(first.value.res_change.changes.find(change => Number(change.tid) === 22100104).diff_num, '10');
  assert.deepEqual(first.value.hero_visit.visited_heroes, [2010101]);
  assert.equal(first.value.hero_visit.used_meet_times, 1);

  assert.throws(() => service.execute(647, 2010101), error => error.code === 5);
  service.execute(647, 2010201);
  service.execute(647, 4030801);
  assert.equal(visitState(env).visited_heroes.length, 3);
  assert.throws(() => service.execute(647, 1020601), error => error.code === 5);

  env.setNow(GAME_AT + 86400);
  service.ensureLoginState();
  const reset = visitState(env);
  assert.deepEqual(reset.visited_heroes, []);
  assert.deepEqual([...reset.yesterday_visited_heroes].sort((a, b) => a - b), [2010101, 2010201, 4030801]);
  assert.equal(reset.used_meet_times ?? 0, 0);
  assert.equal(service.execute(647, 2010101).value.res_change.changes.length, 1);
});

test('647 rejects heroes that are not owned or not in VisitUnlock', t => {
  const env = setup(t);
  const service = env.service();
  assert.throws(() => service.execute(647, VIP_REFORGE_HERO), error => error.code === 3001);
  addHero(env, VIP_REFORGE_HERO);
  assert.throws(() => service.execute(647, VIP_REFORGE_HERO), error => error.code === 305);
});

test('663/664 charge configured reforge cost, save the rolled attributes and persist', t => {
  const env = setup(t);
  addHero(env, VIP_REFORGE_HERO);
  grant(env, [[710002, 10]]);
  let service = env.service();
  const rolled = service.execute(663, { hero_tid: VIP_REFORGE_HERO, use_currency: false, lock_idx_list: [] });
  assert.equal(rolled.schema, 'pb_hero_reforge_back');
  assert.equal(rolled.value.reforge.attr_list.length, 4);
  assert.equal(rolled.value.reforge.random_attr_list.length, 4);
  for (const entry of rolled.value.reforge.random_attr_list) assert.ok(heroTables.ReforgeAttr.has(Number(entry.key)));
  assert.equal(rolled.value.res.changes.find(change => Number(change.tid) === 710002).diff_num, '-10');
  assert.equal(resource(env, 710002), 0n);
  assert.throws(() => service.execute(663, { hero_tid: VIP_REFORGE_HERO, use_currency: false, lock_idx_list: [] }), error => error.code === 5);
  assert.throws(() => service.execute(663, { hero_tid: VIP_REFORGE_HERO, use_currency: false, lock_idx_list: [] }), error => error.code === 5);

  env.reopen();
  service = env.service();
  const saved = service.execute(664, VIP_REFORGE_HERO);
  assert.equal(saved.schema, 'pb_hero_reforge');
  assert.equal(saved.value.attr_list.length, 4);
  const hero = env.store.read().heroInfo.hero_list.find(entry => Number(entry.tid) === VIP_REFORGE_HERO);
  assert.deepEqual(hero.reforge.attr_list, saved.value.attr_list);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM hero_reforge_pending').get().n), 0);
  assert.throws(() => service.execute(664, VIP_REFORGE_HERO), error => error.code === 5);
});

test('663 pays the currency variant, keeps saved locks and 665 discards without refund', t => {
  const env = setup(t);
  addHero(env, VIP_REFORGE_HERO);
  env.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(entry => Number(entry.tid) === VIP_REFORGE_HERO);
    hero.reforge = {
      attr_list: [{ key: 5, value: '1000' }, { key: 6, value: '1100' }, { key: 17, value: '800' }, { key: 18, value: '700' }],
      random_attr_list: []
    };
  });
  grant(env, [[401500, 260]]);
  const service = env.service();
  const rolled = service.execute(663, { hero_tid: VIP_REFORGE_HERO, use_currency: true, lock_idx_list: [0, 1] });
  assert.equal(rolled.value.res.changes.find(change => Number(change.tid) === 401500).diff_num, '-160');
  assert.deepEqual(rolled.value.reforge.attr_list.slice(0, 2), [{ key: 5, value: '1000' }, { key: 6, value: '1100' }]);
  const cancelled = service.execute(665, VIP_REFORGE_HERO);
  assert.deepEqual(cancelled.value.attr_list.slice(0, 2), [{ key: 5, value: '1000' }, { key: 6, value: '1100' }]);
  assert.equal(resource(env, 401500), 100n);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM hero_reforge_pending').get().n), 0);
});

test('663 rejects wrong lock indices and rolls back when encoding fails', t => {
  const env = setup(t);
  addHero(env, VIP_REFORGE_HERO);
  grant(env, [[710002, 10]]);
  const service = env.service();
  assert.throws(() => service.execute(663, { hero_tid: VIP_REFORGE_HERO, lock_idx_list: [0, 0] }), error => error.code === 1);
  assert.throws(() => service.execute(663, { hero_tid: VIP_REFORGE_HERO, lock_idx_list: [4] }), error => error.code === 1);
  const broken = Object.assign(Object.create(codec), {
    pack(schema, value) {
      if (schema === 'pb_hero_reforge_back') throw new Error('encode failure');
      return codec.pack(schema, value);
    }
  });
  assert.throws(() => env.service(broken).execute(663, { hero_tid: VIP_REFORGE_HERO, lock_idx_list: [] }), /encode failure/);
  assert.equal(resource(env, 710002), 10n);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM hero_reforge_pending').get().n), 0);
});

test('663 refuses heroes below the configured reforge quality', t => {
  const env = setup(t);
  grant(env, [[710002, 10]]);
  assert.throws(() => env.service().execute(663, { hero_tid: 2010101, lock_idx_list: [] }), error => error.code === 305);
});
