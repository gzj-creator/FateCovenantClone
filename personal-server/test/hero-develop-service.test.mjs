import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readHeroDevelopTables } from '../config/hero-develop-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createHeroDevelopService } from '../game/hero-develop-service.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const developTables = readHeroDevelopTables();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = Date.UTC(2026, 0, 2, 0, 0) / 1000;
// Fixture ownership: 2010101 cell 1, 2010201 cell 2, 1020601 cell 3,
// 2020601 cell 4 (level 8 / break 1), 4030801 and 1020301 unassigned.
const CELL_HERO = 2020601;
const BUMPED_HERO = 2010101;
const SPARE_HERO = 4030801;
const QUALITY40_HERO = 2020601;
const CHIP_HERO = 1020601;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Hero Develop Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-develop-'));
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
    service(useCodec = codec) {
      return createHeroDevelopService({ store, codec: useCodec, tables, heroTables, developTables, now: () => now });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function grant(env, awards) {
  env.store.transaction(model => grantResources(model, awards, tables));
}

function resource(env, tid) {
  return BigInt(env.store.read().resources.get(String(tid))?.num ?? 0);
}

function hero(env, tid) {
  return env.store.read().heroInfo.hero_list.find(entry => Number(entry.tid) === tid);
}

function fighters(env) {
  const lineup = env.store.read().lineups;
  const current = Number(lineup.cur_pre_index ?? 0);
  const preset = (lineup.pre_lineups ?? []).find(entry => Number(entry.index) === current) ?? lineup.pre_lineups[0];
  return preset.lineup.fighter_list;
}

function trialSlot(env) {
  const module = new Map(env.store.state().modules.value).get(10);
  const bytes = rawBinary(module.value[6]);
  return bytes.length ? codec.unpack('pb_role_hero_trial', bytes) : { hero_trial: [] };
}

test('637 assigns a hero to an open cell, exchanges an occupied one and keeps the cell invariant', async t => {
  const env = setup(t);
  const service = env.service();

  const result = service.execute(637, { hero_tid: CELL_HERO, cell_index: 1 });
  assert.equal(result.schema, 'pb_hero_submit_ret');
  assert.equal(result.value.cell_list.length, 6);
  const changed = result.value.change_hero_list.map(entry => Number(entry.tid)).sort((left, right) => left - right);
  assert.deepEqual(changed, [BUMPED_HERO, CELL_HERO]);
  assert.equal(Number(result.value.cur_pre_lineup.index), 1);
  // The two heroes exchanged cells, so the levels follow the cells.
  assert.equal(hero(env, CELL_HERO).level, 1);
  assert.equal(hero(env, BUMPED_HERO).level, 8);
  assert.equal(hero(env, BUMPED_HERO).breakthrough_level, 1);
  const moved = fighters(env).find(fighter => Number(fighter.hero_id) === CELL_HERO);
  assert.equal(Number(moved.index), 1);
  const exchanged = fighters(env).find(fighter => Number(fighter.hero_id) === BUMPED_HERO);
  assert.equal(Number(exchanged.index), 4);

  // An unassigned hero takes a free cell and inherits its level.
  const added = service.execute(637, { hero_tid: SPARE_HERO, cell_index: 5 });
  assert.equal(added.value.change_hero_list.length, 0);
  const placed = fighters(env).find(fighter => Number(fighter.hero_id) === SPARE_HERO);
  assert.equal(Number(placed.index), 5);
  // The requested battle position was taken, so the client-style free position
  // is used instead and every position stays unique.
  const positions = fighters(env).map(fighter => Number(fighter.loc));
  assert.equal(new Set(positions).size, positions.length);
  assert.ok(positions.every(position => position >= 1 && position <= 6));

  env.reopen();
  const persisted = fighters(env).find(fighter => Number(fighter.hero_id) === SPARE_HERO);
  assert.equal(Number(persisted.index), 5);
  assert.equal(hero(env, BUMPED_HERO).level, 8);
});

test('637 rejects an invalid cell, an unowned hero and a locked cell', t => {
  const env = setup(t);
  const service = env.service();
  assert.throws(() => service.execute(637, { hero_tid: SPARE_HERO, cell_index: 7 }), error => error.code === 1);
  assert.throws(() => service.execute(637, { hero_tid: SPARE_HERO, cell_index: 0 }), error => error.code === 1);
  assert.throws(() => service.execute(637, { hero_tid: SPARE_HERO, lineup_pos: 9, cell_index: 1 }), error => error.code === 1);
  assert.throws(() => service.execute(637, { hero_tid: 9999999, cell_index: 1 }), error => error.code === 3001);
  env.store.transaction(model => { model.heroInfo.cell_list = model.heroInfo.cell_list.filter(cell => Number(cell.index) !== 6); });
  assert.throws(() => service.execute(637, { hero_tid: SPARE_HERO, cell_index: 6 }), error => error.code === 305);
  assert.equal(hero(env, SPARE_HERO).level, 1);
});

test('656 batches submissions in one transaction and rejects the whole batch on a bad entry', t => {
  const env = setup(t);
  const service = env.service();
  const applied = service.execute(656, {
    hero_list: [
      { hero_tid: SPARE_HERO, cell_index: 5 },
      { hero_tid: 1020301, cell_index: 6 }
    ]
  });
  assert.equal(applied.schema, 'pb_hero_submit_ret');
  assert.deepEqual(fighters(env).map(fighter => Number(fighter.index)).sort((left, right) => left - right), [1, 2, 3, 4, 5, 6]);
  assert.equal(fighters(env).filter(fighter => Number(fighter.hero_id) === 1020301).length, 1);

  assert.throws(() => service.execute(656, {
    hero_list: [{ hero_tid: SPARE_HERO, cell_index: 1 }, { hero_tid: SPARE_HERO, cell_index: 2 }]
  }), error => error.code === 1);
  assert.throws(() => service.execute(656, {
    hero_list: [{ hero_tid: BUMPED_HERO, cell_index: 5 }, { hero_tid: 9999999, cell_index: 6 }]
  }), error => error.code === 3001);
  // The failed batch left the previous assignments untouched.
  assert.equal(Number(fighters(env).find(fighter => Number(fighter.hero_id) === BUMPED_HERO).index), 1);
  assert.throws(() => service.execute(656, { hero_list: [] }), error => error.code === 1);
});

test('641 trail raises the quality and star and consumes trial chips plus awakening stones', t => {
  const env = setup(t);
  const service = env.service();
  const chipTid = Number(heroTables.Hero.get(QUALITY40_HERO).chip);
  const stoneTid = 652002;
  env.store.transaction(model => {
    const entry = model.heroInfo.hero_list.find(row => Number(row.tid) === QUALITY40_HERO);
    entry.star = 5;
    entry.star_progress = 0;
  });
  grant(env, [[chipTid, 240], [stoneTid, 2]]);
  const chipBefore = resource(env, chipTid), stoneBefore = resource(env, stoneTid);

  const result = service.execute(641, { hero_tid: QUALITY40_HERO, res: [{ tid: stoneTid, num: 0 }] });
  assert.equal(result.schema, 'pb_hero_trial_ret');
  assert.equal(Number(result.value.new_quality), 50);
  assert.equal(Number(result.value.new_star), 6);
  assert.equal(result.value.res.changes.find(change => Number(change.tid) === chipTid).diff_num, '-240');
  assert.equal(result.value.res.changes.find(change => Number(change.tid) === stoneTid).diff_num, '-2');
  const stored = hero(env, QUALITY40_HERO);
  assert.equal(stored.quality, 50);
  assert.equal(stored.star, 6);
  assert.equal(stored.star_progress, 0);
  assert.equal(resource(env, chipTid), chipBefore - 240n);
  assert.equal(resource(env, stoneTid), stoneBefore - 2n);
  assert.equal(Number(result.value.trial.hero_tid), QUALITY40_HERO);
  const slot = trialSlot(env);
  assert.equal(slot.hero_trial.length, 1);
  assert.equal(Number(slot.hero_trial[0].hero_tid), QUALITY40_HERO);
  assert.deepEqual(slot.hero_trial[0].task_progress.map(entry => [Number(entry.type), Number(entry.progress)]), [[6702, 5]]);

  // Leaving the first star maximum closes the trail.
  assert.throws(() => service.execute(641, { hero_tid: QUALITY40_HERO, res: [{ tid: stoneTid, num: 0 }] }), error => error.code === 5);
  // A hero below five stars cannot trail.
  assert.throws(() => service.execute(641, { hero_tid: SPARE_HERO, res: [] }), error => error.code === 5);
});

test('641 reports missing chips, missing stones and a wrong stone', t => {
  const env = setup(t);
  const service = env.service();
  const config = heroTables.Hero.get(CHIP_HERO);
  const chipTid = Number(config.chip);
  // 1020601 is camp 1 quality 40, so UpStarStone[1040] allows 649002, 651002
  // and 22002; 652002 belongs to camp 2.
  const stoneTid = 651002;
  const foreignStone = 652002;
  env.store.transaction(model => {
    const entry = model.heroInfo.hero_list.find(row => Number(row.tid) === CHIP_HERO);
    entry.star = 5;
  });
  assert.throws(() => service.execute(641, { hero_tid: CHIP_HERO, res: [] }), error => error.code === 3006);
  grant(env, [[chipTid, 240]]);
  assert.throws(() => service.execute(641, { hero_tid: CHIP_HERO, res: [{ tid: foreignStone, num: 0 }] }), error => error.code === 1);
  assert.throws(() => service.execute(641, { hero_tid: CHIP_HERO, res: [{ tid: stoneTid, num: 0 }] }), error => error.code === 301);
  grant(env, [[stoneTid, 2]]);
  const applied = service.execute(641, { hero_tid: CHIP_HERO, res: [{ tid: stoneTid, num: 2 }] });
  assert.equal(Number(applied.value.new_quality), 50);
  assert.equal(hero(env, CHIP_HERO).star, 6);
});

test('666 one key upgrades every hero up to the trail gate and reports the failures', t => {
  const env = setup(t);
  const service = env.service();
  const chipTid = Number(heroTables.Hero.get(CHIP_HERO).chip);
  // Stars 0-4 for a quality 40 hero cost (10+10+15+20+30) chips each star.
  grant(env, [[chipTid, 510]]);
  const chipBefore = resource(env, chipTid);

  const result = service.execute(666, { hero_tid_list: [] });
  assert.equal(result.schema, 'pb_hero_one_key_up_rsp');
  const success = result.value.success_hero_list.map(entry => [Number(entry.hero_tid), Number(entry.before_star), Number(entry.after_star)]);
  assert.deepEqual(success, [[CHIP_HERO, 0, 5]]);
  assert.equal(Number(result.value.failed_hero_list[0].success), 0);
  assert.equal(result.value.failed_hero_list.length, 5);
  assert.equal(result.value.change_hero_list.length, 1);
  assert.equal(Number(result.value.change_hero_list[0].star), 5);
  assert.equal(hero(env, CHIP_HERO).star, 5);
  assert.equal(resource(env, chipTid), chipBefore - 510n);

  // The trail gate stops the one key request, and an unaffordable hero reports
  // a failure instead of an error.
  const second = service.execute(666, { hero_tid_list: [CHIP_HERO] });
  assert.equal(second.value.success_hero_list.length, 0);
  assert.equal(second.value.failed_hero_list.length, 1);
  assert.throws(() => service.execute(666, { hero_tid_list: [CHIP_HERO, CHIP_HERO] }), error => error.code === 1);
  assert.throws(() => service.execute(666, { hero_tid_list: [9999999] }), error => error.code === 3001);
});

test('666 awakens past the first maximum for a hero without a trail row', t => {
  const env = setup(t);
  const service = env.service();
  // A hero that already passed its trail is quality 60, where TrialTask has no
  // row, so the one key request may awaken it past five stars.
  const tid = SPARE_HERO;
  const config = heroTables.Hero.get(tid);
  assert.equal(developTables.TrialTask.has(tid * 100 + 60), false);
  env.store.transaction(model => {
    const entry = model.heroInfo.hero_list.find(row => Number(row.tid) === tid);
    entry.star = 5;
    entry.quality = 60;
  });
  const stoneRow = heroTables.UpStarStone.get(Number(config.camp) * 1000 + 60);
  const stoneTid = Number(stoneRow.item[0]);
  grant(env, [[Number(config.chip), 160], [stoneTid, 2]]);
  const stoneBefore = resource(env, stoneTid);
  const result = service.execute(666, { hero_tid_list: [tid] });
  assert.deepEqual(result.value.success_hero_list.map(entry => [Number(entry.before_star), Number(entry.after_star)]), [[5, 6]]);
  assert.equal(hero(env, tid).star, 6);
  assert.equal(resource(env, stoneTid), stoneBefore - 2n);
  const stored = hero(env, tid).up_star_high_consume ?? [];
  assert.equal(stored.length, 1);
  assert.equal(Number(stored[0].star), 6);
});

test('decode reads the four request schemas and encoding failures roll back', async t => {
  const env = setup(t);
  const service = env.service();
  const submit = await service.decode(637, codec.pack('pb_hero_submit_req', { hero_tid: SPARE_HERO, cell_index: 5, lineup_pos: 0 }), {
    unpack: (schema, data) => codec.unpack(schema, data)
  });
  assert.equal(Number(submit.hero_tid), SPARE_HERO);
  assert.equal(Number(submit.cell_index), 5);
  const trial = await service.decode(641, codec.pack('pb_hero_wake_req', { hero_tid: QUALITY40_HERO, res: [{ tid: 651002, num: 0 }] }), {
    unpack: (schema, data) => codec.unpack(schema, data)
  });
  assert.equal(Number(trial.hero_tid), QUALITY40_HERO);
  assert.equal(Number(trial.res[0].tid), 651002);
  const batch = await service.decode(656, codec.pack('pb_hero_batch_submit_req', { hero_list: [{ hero_tid: SPARE_HERO, cell_index: 5 }] }), {
    unpack: (schema, data) => codec.unpack(schema, data)
  });
  assert.equal(batch.hero_list.length, 1);
  const oneKey = await service.decode(666, codec.pack('pb_hero_one_key_up_req', { hero_tid_list: [SPARE_HERO] }), {
    unpack: (schema, data) => codec.unpack(schema, data)
  });
  assert.deepEqual(oneKey.hero_tid_list.map(Number), [SPARE_HERO]);

  const broken = Object.assign(Object.create(codec), {
    pack(schema, value) {
      if (schema === 'pb_hero_submit_ret') throw new Error('encode failure');
      return codec.pack(schema, value);
    }
  });
  assert.throws(() => env.service(broken).execute(637, { hero_tid: SPARE_HERO, cell_index: 5 }), /encode failure/);
  assert.equal(fighters(env).some(fighter => Number(fighter.hero_id) === SPARE_HERO), false);
});

test('ensureLoginState opens the ungated cells and repairs hero levels', t => {
  const env = setup(t);
  const service = env.service();
  env.store.transaction(model => {
    model.heroInfo.cell_list = model.heroInfo.cell_list.filter(cell => Number(cell.index) > 3);
    model.heroInfo.hero_list.find(row => Number(row.tid) === BUMPED_HERO).level = 40;
  });
  const repaired = service.ensureLoginState();
  assert.deepEqual(repaired.opened.sort((left, right) => left - right), [1, 2, 3]);
  const indexes = env.store.read().heroInfo.cell_list.map(cell => Number(cell.index)).sort((left, right) => left - right);
  assert.deepEqual(indexes, [1, 2, 3, 4, 5, 6]);
  assert.equal(hero(env, BUMPED_HERO).level, 1);
  const again = service.ensureLoginState();
  assert.deepEqual(again.opened, []);
  assert.equal(again.heroes, 0);
});
