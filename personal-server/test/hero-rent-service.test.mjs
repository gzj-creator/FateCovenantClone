import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createHeroRentService } from '../game/hero-rent-service.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = Date.UTC(2026, 0, 2, 0, 0) / 1000;
const ROLE_ID = 100001;
// Rent row 2 is the only shipped rent activity: min_star 5, cache_flush_time 60.
const RENT_TID = 2;
const RENT_HERO = 1030101;
const OTHER_HERO = 2010101;

function fixture() {
  return {
    version: 1,
    roleId: ROLE_ID,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 40, nick_name: Buffer.from('Hero Rent Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-rent-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  let now = GAME_AT;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    setNow(value) { now = value; },
    service(useCodec = codec) {
      return createHeroRentService({ store, codec: useCodec, tables, heroTables, now: () => now });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function addHero(env, tid, { star = 5, level = 20 } = {}) {
  env.store.transaction(model => {
    const existing = model.heroInfo.hero_list.find(hero => Number(hero.tid) === tid);
    if (existing) {
      existing.star = star;
      existing.level = level;
      return;
    }
    const config = heroTables.Hero.get(tid);
    model.heroInfo.hero_list.push({
      tid: String(tid), uid: String(tid), count: 1, level, star,
      star_progress: 0, breakthrough_level: 0, quality: Number(config.quality ?? 0),
      relic: [], up_star_high_consume: [], source_point_list: [], pendant_select_list: []
    });
  });
}

function rentOutRows(env) {
  return env.store.inspect(db => db.prepare('SELECT role_id,rent_tid,valid_time FROM hero_rent_out_state').all());
}

test('627 lists an owned hero for rent, rejects duplicates and keeps the listing after reopen', async t => {
  const env = setup(t);
  addHero(env, RENT_HERO);
  const service = env.service();
  const result = service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [1] });
  assert.equal(result.schema, 'pb_req_rent_out_back');
  const packed = codec.unpack('pb_req_rent_out_back', result.data);
  assert.equal(packed.rent_out_one.rent_tid, RENT_TID);
  assert.equal(packed.rent_out_one.rent_out_hero_list.length, 1);
  const listed = packed.rent_out_one.rent_out_hero_list[0];
  assert.equal(String(listed.hero_uid), String(RENT_HERO));
  assert.equal(listed.index, 1);
  assert.equal(listed.hero.tid, String(RENT_HERO));
  assert.equal(listed.hero.star, 5);
  assert.ok(Number(listed.power) > 0, 'compatibility power is reported');
  assert.equal(Number(packed.rent_out_one.valid_time), GAME_AT + 3600);
  assert.equal(rentOutRows(env).length, 1);

  assert.throws(() => service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [1] }), error => error.code === 5);
  assert.throws(() => service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [999999], hero_index_list: [1] }), error => error.code === 3001);
  assert.throws(() => service.execute(627, { rent_tid: 99, hero_uid_list: [RENT_HERO], hero_index_list: [1] }), error => error.code === 3001);
  assert.throws(() => service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [99] }), error => error.code === 1);
  assert.throws(() => service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [], hero_index_list: [] }), error => error.code === 1);

  env.reopen();
  const reopened = env.service();
  const flushed = codec.unpack('pb_rent_flush_ret', reopened.execute(631, {}).data);
  assert.equal(flushed.rent_out_one.rent_out_hero_list.length, 1);
  assert.equal(String(flushed.rent_out_one.rent_out_hero_list[0].hero_uid), String(RENT_HERO));
  assert.deepEqual(flushed.rent_in_one.rent_hero_list, []);
});

test('627 rejects a hero below the configured star gate', async t => {
  const env = setup(t);
  addHero(env, OTHER_HERO, { star: 1, level: 20 });
  const service = env.service();
  assert.throws(() => service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [OTHER_HERO], hero_index_list: [1] }), error => error.code === 305);
  assert.equal(rentOutRows(env).length, 0);
});

test('628 takes the hero off the listing once and reports it in take_off_list', async t => {
  const env = setup(t);
  addHero(env, RENT_HERO);
  const service = env.service();
  service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [2] });
  const off = codec.unpack('pb_req_rent_out_back', service.execute(628, {}).data);
  assert.deepEqual(off.rent_out_one.rent_out_hero_list, []);
  assert.equal(Number(off.rent_out_one.valid_time ?? 0), 0);
  assert.equal(off.rent_out_one.take_off_list.length, 1);
  assert.equal(String(off.rent_out_one.take_off_list[0].uid), String(RENT_HERO));
  assert.throws(() => service.execute(628, {}), error => error.code === 5);
});

test('629 refuses a cross-role rent-in and clears the local list on an explicit clear', async t => {
  const env = setup(t);
  addHero(env, RENT_HERO);
  const service = env.service();
  assert.throws(() => service.execute(629, {
    rent_tid: RENT_TID, dest_rent_tid: RENT_TID, is_clear_cur: true,
    rent_req_list: [{ dest_role_id: 200002, rent_hero_uid_list: [RENT_HERO], index_list: [1] }]
  }), error => error.code === 3001);
  const cleared = codec.unpack('pb_req_rent_back', service.execute(629, { rent_tid: RENT_TID, is_clear_cur: true, rent_req_list: [] }).data);
  assert.deepEqual(cleared.rent_data.rent_hero_list, []);
  assert.throws(() => service.execute(629, { rent_tid: RENT_TID, rent_req_list: [] }), error => error.code === 5);
  assert.throws(() => service.execute(629, { rent_tid: 99, is_clear_cur: true, rent_req_list: [] }), error => error.code === 3001);
});

test('630 answers only for this role and refuses another player', async t => {
  const env = setup(t);
  addHero(env, RENT_HERO);
  const service = env.service();
  assert.throws(() => service.execute(630, {}), error => error.code === 5);
  service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [1] });
  const own = codec.unpack('pb_req_query_rent_hero_ret', service.execute(630, { value: [ROLE_ID] }).data);
  assert.equal(own.role_rent_out_list.length, 1);
  assert.equal(String(own.role_rent_out_list[0].role_id), String(ROLE_ID));
  assert.equal(String(own.role_rent_out_list[0].rent_out.rent_out_hero_list[0].hero_uid), String(RENT_HERO));
  assert.throws(() => service.execute(630, { value: [200002] }), error => error.code === 3001);
});

test('634 returns this role cache content and refuses another role', async t => {
  const env = setup(t);
  const service = env.service();
  const empty = codec.unpack('pb_hero_share_req_back', service.execute(634, { req_list: [{ role_id: ROLE_ID, uid_list: [RENT_HERO], share_tid: 1 }] }).data);
  assert.equal(empty.req_back_list.length, 1);
  assert.deepEqual(empty.req_back_list[0].hero_share_list, []);

  const payload = codec.pack('pb_hero_share_info', {
    hero_uid: RENT_HERO, share_list: [{ share_type: 1, data: Buffer.from([1, 2, 3]) }]
  }).toString('base64');
  env.store.inspect(db => db.prepare('INSERT INTO hero_share_cache(role_id,hero_uid,share_tid,payload,updated_at) VALUES(?,?,?,?,?)')
    .run(String(ROLE_ID), String(RENT_HERO), 1, payload, new Date(GAME_AT * 1000).toISOString()));
  const shared = codec.unpack('pb_hero_share_req_back', service.execute(634, { req_list: [{ role_id: ROLE_ID, uid_list: [RENT_HERO], share_tid: 1 }] }).data);
  assert.equal(shared.req_back_list[0].hero_share_list.length, 1);
  assert.equal(String(shared.req_back_list[0].hero_share_list[0].hero_uid), String(RENT_HERO));
  assert.equal(shared.req_back_list[0].hero_share_list[0].share_list[0].share_type, 1);

  assert.throws(() => service.execute(634, { req_list: [{ role_id: 200002, uid_list: [RENT_HERO], share_tid: 1 }] }), error => error.code === 3001);
  assert.throws(() => service.execute(634, { req_list: [] }), error => error.code === 1);
});

test('627 rolls the listing back when the response cannot be encoded', async t => {
  const env = setup(t);
  addHero(env, RENT_HERO);
  const brokenCodec = { ...codec, pack() { throw new Error('encode failed'); } };
  const service = env.service(brokenCodec);
  assert.throws(() => service.execute(627, { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [1] }), /encode failed/);
  assert.equal(rentOutRows(env).length, 0);
});

