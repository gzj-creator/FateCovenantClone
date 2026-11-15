import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readFavourIntimacyTables } from '../config/favour-intimacy-tables.mjs';
import { createHeroIntimacyService, FAVOUR_INTIMACY_COMMANDS } from '../game/hero-intimacy-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const intimacyTables = readFavourIntimacyTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = 1792789200;
const HERO_TID = 4040301;
const HERO_CHIP = heroTables.Hero.get(HERO_TID).chip;
const SMALL_ITEM = 830502;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Hero Intimacy Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-intimacy-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  let now = GAME_AT;
  store.transaction(model => {
    const hero = model.heroInfo.hero_list[0];
    hero.tid = String(HERO_TID);
    hero.uid = String(HERO_TID);
  });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    legacyStatePath,
    get store() { return store; },
    get now() { return now; },
    setNow(value) { now = value; },
    service(useCodec = codec) {
      return createHeroIntimacyService({
        store, codec: useCodec, heroTables, tables, intimacyTables, now: () => now
      });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function storedState(env) {
  const module = new Map(env.store.state().modules.value).get(10);
  const target = module.value[11];
  return target ? codec.unpack('pb_hero_favour_intimacy', rawBinary(target)) : {};
}

function writeState(env, state) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(10);
    while (module.value.length <= 11) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[11] = serializedBinary(codec.pack('pb_hero_favour_intimacy', state));
    model.state.modules.value = [...modules];
  });
}

function heroRow(overrides = {}) {
  return {
    hero_tid: HERO_TID,
    intimacy_value: 0,
    intimacy_level: 1,
    story_got_bin: '',
    cycle_date_times: 0,
    total_date_times: 0,
    last_date_time: 0,
    ...overrides
  };
}

function grant(env, awards) {
  env.store.transaction(model => grantResources(model, awards, tables));
}

function amount(env, tid) {
  return Number(env.store.read().resources.get(String(tid))?.num ?? 0);
}

const rejected = action => assert.throws(action, error => error.code === 5);

test('configuration is entirely backed by the generated HeroTable rows', () => {
  assert.deepEqual([...FAVOUR_INTIMACY_COMMANDS], [667, 670, 671]);
  assert.deepEqual(intimacyTables.counts, {
    FavourIntimacyBase: 16,
    FavourIntimacyItem: 4,
    FavourIntimacyLevel: 50,
    FavourIntimacyConst: 1,
    FavourIntimacyCycle: 2,
    FavourIntimacyCharm: 30,
    StoryChapter: 16,
    StoryChapterPage: 86,
    StoryChapterChoice: 80,
    StoryChapterPageShow: 202
  });
  assert.equal(intimacyTables.FavourIntimacyBase.size, 16);
  assert.equal(intimacyTables.FavourIntimacyItem.size, 4);
  assert.equal(intimacyTables.FavourIntimacyLevel.size, 50);
  assert.equal(intimacyTables.FavourIntimacyItem.get(SMALL_ITEM).add_intimacy, 1);
  assert.equal(intimacyTables.FavourIntimacyConst.get(1).user_date_cycle, 2);
  assert.equal(intimacyTables.FavourIntimacyConst.get(1).hero_date_cycle, 1);
  assert.deepEqual(heroTables.Hero.get(HERO_TID).chip, HERO_CHIP);
  assert.equal(intimacyTables.storyForHero(HERO_TID), 1);
  assert.equal(intimacyTables.choiceForStoryIndex(1, 2).tid, 2);
  assert.equal(intimacyTables.pageStory.get(2), 1);
});

test('667 consumes configured gifts and advances only the independent intimacy state', t => {
  const env = setup(t), service = env.service();
  grant(env, [[SMALL_ITEM, 700]]);
  const reply = codec.unpack('pb_hero_intimacy_add_rsp', service.execute(667, {
    hero_tid: HERO_TID,
    items: [{ tid: SMALL_ITEM, num: 400 }, { tid: SMALL_ITEM, num: 300 }]
  }).data);
  assert.equal(reply.hero_data.hero_tid, HERO_TID);
  assert.equal(reply.hero_data.intimacy_level, 2);
  assert.equal(reply.hero_data.intimacy_value ?? 0, 0);
  assert.equal(reply.all_data.total_intimacy, 700);
  assert.deepEqual(reply.res_change.changes.map(change => [change.tid, change.diff_num]), [[String(SMALL_ITEM), '-700']]);
  assert.equal(amount(env, SMALL_ITEM), 0);
  assert.deepEqual(storedState(env).hero_list, [reply.hero_data]);
});

test('667 applies level awards and the hero-chip column when a new level is reached', t => {
  const env = setup(t), service = env.service();
  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({ intimacy_value: 799, intimacy_level: 2 })],
    cycle_date_times: 0,
    last_date_time: 0
  });
  grant(env, [[SMALL_ITEM, 1]]);
  const reply = codec.unpack('pb_hero_intimacy_add_rsp', service.execute(667, {
    hero_tid: HERO_TID, items: [{ tid: SMALL_ITEM, num: 1 }]
  }).data);
  assert.equal(reply.hero_data.intimacy_level, 3);
  assert.equal(amount(env, 101500), 300);
  assert.equal(amount(env, 22002), 1);

  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({
      intimacy_value: intimacyTables.FavourIntimacyLevel.get(19).need_intimacy - 1,
      intimacy_level: 19
    })],
    cycle_date_times: 0,
    last_date_time: 0
  });
  grant(env, [[SMALL_ITEM, 1]]);
  const beforeChip = amount(env, HERO_CHIP);
  env.service().execute(667, { hero_tid: HERO_TID, items: [{ tid: SMALL_ITEM, num: 1 }] });
  assert.equal(storedState(env).hero_list[0].intimacy_level, 20);
  assert.equal(amount(env, HERO_CHIP), beforeChip + intimacyTables.FavourIntimacyLevel.get(20).chip_num);
});

test('670 enforces the hero daily row and grants the current level date award', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  let reply = codec.unpack('pb_hero_intimacy_date_rsp', service.execute(670, { hero_tid: HERO_TID }).data);
  assert.equal(reply.all_data.hero_list[0].cycle_date_times, 1);
  assert.equal(reply.all_data.hero_list[0].total_date_times, 1);
  assert.equal(reply.all_data.cycle_date_times, 1);
  assert.deepEqual(reply.award.changes.map(change => [change.tid, change.diff_num]), [
    ['101500', '50'],
    ['830602', '1']
  ]);
  const before = env.store.state();
  rejected(() => service.execute(670, { hero_tid: HERO_TID }));
  assert.deepEqual(env.store.state(), before);
  assert.equal(amount(env, 101500), 50);
});

test('670 resets the hero daily counter and the global weekly counter at business boundaries', t => {
  const env = setup(t), service = env.service();
  const monday = Date.UTC(2026, 9, 19, 0, 0) / 1000;
  env.setNow(monday);
  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({ cycle_date_times: 1, total_date_times: 1, last_date_time: monday })],
    cycle_date_times: 1,
    last_date_time: monday
  });
  rejected(() => service.execute(670, { hero_tid: HERO_TID }));
  env.setNow(monday + 86400);
  let reply = codec.unpack('pb_hero_intimacy_date_rsp', service.execute(670, { hero_tid: HERO_TID }).data);
  assert.equal(reply.all_data.hero_list[0].cycle_date_times, 1);
  assert.equal(reply.all_data.cycle_date_times, 2);
  env.setNow(monday + 7 * 86400);
  reply = codec.unpack('pb_hero_intimacy_date_rsp', service.execute(670, { hero_tid: HERO_TID }).data);
  assert.equal(reply.all_data.hero_list[0].cycle_date_times, 1);
  assert.equal(reply.all_data.cycle_date_times, 1);
});

test('date limits reject before awards or counters mutate and survive SQLite reopen', t => {
  const env = setup(t), service = env.service();
  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({ cycle_date_times: 0, intimacy_level: 15 })],
    cycle_date_times: 29,
    last_date_time: GAME_AT
  });
  service.execute(670, { hero_tid: HERO_TID });
  const afterFirst = storedState(env);
  const beforeDiamond = amount(env, 101500);
  rejected(() => service.execute(670, { hero_tid: HERO_TID }));
  assert.deepEqual(storedState(env), afterFirst);
  assert.equal(amount(env, 101500), beforeDiamond);
  env.reopen();
  const reopened = env.service();
  assert.equal(reopened.ensureLoginState().weekDateTimes, 30);
  rejected(() => reopened.execute(670, { hero_tid: HERO_TID }));
});

test('unknown, closed and unowned heroes reject with err5 before mutation', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const before = env.store.state();
  const item = intimacyTables.FavourIntimacyItem.get(SMALL_ITEM);
  grant(env, [[item.item_tid, 1]]);
  const funded = env.store.state();
  rejected(() => service.execute(667, { hero_tid: 999999, items: [{ tid: item.item_tid, num: 1 }] }));
  rejected(() => service.execute(667, { hero_tid: HERO_TID, items: [{ tid: 999999, num: 1 }] }));
  assert.throws(
    () => service.execute(667, { hero_tid: HERO_TID, items: [{ tid: item.item_tid, num: 2 }] }),
    error => error.code === 301
  );
  assert.deepEqual(env.store.state(), funded);
  assert.notDeepEqual(before, funded);
});

test('671 grants each terminal story page once, enforces intimacy and story ownership, and survives reopen', t => {
  const env = setup(t), service = env.service();
  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({ intimacy_level: 1 })],
    cycle_date_times: 0,
    last_date_time: 0
  });
  const beforeDiamond = amount(env, 101500);
  const beforeLocked = env.store.state();
  rejected(() => service.execute(671, { hero_tid: HERO_TID, page_id: 2 }));
  rejected(() => service.execute(671, { hero_tid: HERO_TID, page_id: 6 }));
  rejected(() => service.execute(671, { hero_tid: HERO_TID, page_id: 17 }));
  assert.deepEqual(env.store.state(), beforeLocked);

  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({ intimacy_level: 2 })],
    cycle_date_times: 0,
    last_date_time: 0
  });
  const result = service.execute(671, { hero_tid: HERO_TID, page_id: 2 });
  assert.equal(result.schema, 'pb_hero_intimacy_story_rsp');
  const reply = codec.unpack('pb_hero_intimacy_story_rsp', result.data);
  assert.equal(Number(reply.hero_tid), HERO_TID);
  assert.equal(amount(env, 101500), beforeDiamond + 400);
  assert.deepEqual(reply.award.changes.map(change => [change.tid, change.diff_num]), [['101500', '400']]);
  assert.equal(hasBit(Buffer.from(reply.hero_data.story_got_bin, 'base64'), 2), true);
  assert.equal(hasBit(Buffer.from(reply.hero_data.story_got_bin, 'base64'), 1), false);

  const after = env.store.state();
  rejected(() => service.execute(671, { hero_tid: HERO_TID, page_id: 2 }));
  assert.deepEqual(env.store.state(), after);
  env.reopen();
  assert.equal(hasBit(Buffer.from(storedState(env).hero_list[0].story_got_bin, 'base64'), 2), true);
});

test('671 response encoding failure rolls back story bits and rewards', t => {
  const env = setup(t);
  writeState(env, {
    charm_level: 1,
    total_intimacy: 0,
    charm_got_bin: '',
    hero_list: [heroRow({ intimacy_level: 1 })],
    cycle_date_times: 0,
    last_date_time: 0
  });
  const beforeDiamond = amount(env, 101500), before = env.store.state();
  const broken = Object.create(codec);
  broken.pack = (name, value) => {
    if (name === 'pb_hero_intimacy_story_rsp') throw new Error('story response encoding failed');
    return codec.pack(name, value);
  };
  assert.throws(
    () => env.service(broken).execute(671, { hero_tid: HERO_TID, page_id: 1 }),
    /story response encoding failed/
  );
  assert.deepEqual(env.store.state(), before);
  assert.equal(amount(env, 101500), beforeDiamond);
});

test('request decoding uses the direct PB schemas and encoding failure rolls back', t => {
  const env = setup(t);
  const request = codec.pack('pb_hero_intimacy_add_req', {
    hero_tid: HERO_TID, items: [{ tid: SMALL_ITEM, num: 1 }]
  });
  assert.equal(env.service().decode(667, request).hero_tid, HERO_TID);
  assert.deepEqual(env.service().decode(671, codec.pack('pb_hero_intimacy_story_req', {
    hero_tid: HERO_TID, page_id: 1
  })), { hero_tid: HERO_TID, page_id: 1 });
  grant(env, [[SMALL_ITEM, 1]]);
  const before = env.store.state();
  const broken = Object.create(codec);
  broken.pack = (name, value) => {
    if (name === 'pb_hero_favour_intimacy') throw new Error('Injected intimacy state encoding failure');
    return codec.pack(name, value);
  };
  assert.throws(
    () => env.service(broken).execute(667, { hero_tid: HERO_TID, items: [{ tid: SMALL_ITEM, num: 1 }] }),
    /Injected intimacy state encoding failure/
  );
  assert.deepEqual(env.store.state(), before);
  assert.equal(amount(env, SMALL_ITEM), 1);
});
