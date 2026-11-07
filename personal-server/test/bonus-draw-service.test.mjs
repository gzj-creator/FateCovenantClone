import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readBonusDrawTables } from '../config/bonus-draw-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createBonusDrawService, BONUS_DRAW_COMMANDS } from '../game/bonus-draw-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const bonusTables = readBonusDrawTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const fixedNow = 1793400000000;

// BonusDraw 1 uses cost item 660002 and pools 1..7 (BonusDrawTable).
const DRAW = 1;
const COST = 660002;

function setup(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-bonus-draw-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Bonus Draw Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec });
  let service = createBonusDrawService({
    store, codec: options.codec ?? codec, tables, bonusTables,
    now: () => fixedNow, random: options.random ?? (() => 0.999999)
  });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen(next = {}) {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec });
      service = createBonusDrawService({
        store, codec: options.codec ?? codec, tables, bonusTables,
        now: () => fixedNow, random: next.random ?? options.random ?? (() => 0.999999)
      });
    },
    addCost(amount) {
      store.transaction(model => grantResources(model, [[COST, amount]], tables));
    },
    cost() {
      return BigInt(store.read().resources.get(String(COST))?.num ?? 0);
    },
    awards(drawTid = DRAW) {
      return store.inspect(db => db.prepare(
        'SELECT pool_index, pool_tid, lib_tid FROM bonus_draw_pool_awards WHERE draw_tid=? ORDER BY id'
      ).all(drawTid));
    },
    state(drawTid = DRAW) {
      return store.inspect(db => db.prepare('SELECT * FROM bonus_draw_state WHERE draw_tid=?').get(drawTid));
    }
  };
}

test('101901 draws from the configured pool, spends the cost item and records the awards', t => {
  const env = setup(t);
  env.addCost(10);
  const result = env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 2, stop: false });
  const body = codec.unpack('pb_bonus_draw_back', result.data);
  assert.equal(body.bonus_draw.id, DRAW);
  assert.equal(body.bonus_draw.cur_pool, 1);
  assert.equal(body.bonus_draw.pool_list.length, 7);
  assert.deepEqual(body.bonus_draw.pool_list[0].award_list, ['8', '7']);
  assert.deepEqual(env.awards().map(row => row.lib_tid), [8, 7]);
  assert.equal(env.state().cur_pool_index, 1);
  assert.equal(env.cost(), 8n);
  const changes = body.res.changes;
  assert.equal(changes.find(row => row.tid === '660002').diff_num, '-2');
  assert.equal(changes.some(row => row.tid === '18002' && row.diff_num === '50'), true);
  assert.equal(changes.some(row => row.tid === '101500' && row.diff_num === '100'), true);
});

test('101901 persists the pool record across a database reopen and keeps counting', t => {
  const env = setup(t);
  env.addCost(10);
  env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 2, stop: false });
  env.reopen();
  const after = env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1, stop: false });
  const body = codec.unpack('pb_bonus_draw_back', after.data);
  assert.deepEqual(body.bonus_draw.pool_list[0].award_list, ['8', '7', '6']);
  assert.equal(env.cost(), 7n);
});

test('101901 stops on the big award when stop is set and charges only the draws made', t => {
  const env = setup(t, { random: () => 0 });
  env.addCost(10);
  const result = env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 5, stop: true });
  assert.equal(result.value.bonus_draw.pool_list[0].award_list.length, 1);
  // Lib 1 is the pool's BIG award (type 2) and 2091200 x30 is its payload.
  assert.equal(result.value.bonus_draw.pool_list[0].award_list[0], 1);
  assert.equal(result.value.res.changes.find(row => row.tid === '2091200').diff_num, '30');
  assert.equal(env.cost(), 9n);
});

test('101901 rejects unknown draws, over-max batches, missing cost items and short pools', t => {
  const env = setup(t);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: 99, num: 1 }), error => error.code === 5);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 0 }), error => error.code === 1);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 6 }), error => error.code === 1);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1 }), error => error.code === 301);
  assert.equal(env.awards().length, 0);
  env.addCost(100);
  env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 5, stop: false });
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 5, stop: false }), error => error.code === 313);
  env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 3, stop: false });
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1, stop: false }), error => error.code === 312);
  assert.equal(env.awards().length, 8);
});

test('101902 switches to the next configured pool, wraps and persists', t => {
  const env = setup(t);
  const first = env.service.execute(BONUS_DRAW_COMMANDS.switch, DRAW);
  assert.equal(first.value.cur_pool, 2);
  assert.equal(env.state().cur_pool_index, 2);
  env.reopen();
  const second = env.service.execute(BONUS_DRAW_COMMANDS.switch, DRAW);
  assert.equal(second.value.cur_pool, 3);
  for (let index = 0; index < 5; index += 1) env.service.execute(BONUS_DRAW_COMMANDS.switch, DRAW);
  assert.equal(env.state().cur_pool_index, 1);
});

test('101902 records draws against the pool it was made in', t => {
  const env = setup(t);
  env.addCost(10);
  env.service.execute(BONUS_DRAW_COMMANDS.switch, DRAW);
  const result = env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1, stop: false });
  assert.equal(result.value.bonus_draw.cur_pool, 2);
  assert.equal(result.value.bonus_draw.pool_list[0].award_list.length, 0);
  assert.equal(result.value.bonus_draw.pool_list[1].award_list.length, 1);
  assert.equal(env.awards()[0].pool_index, 2);
  assert.equal(env.awards()[0].pool_tid, 2);
});

test('101904 selects a configured pool and rejects unknown or repeated choices', t => {
  const env = setup(t);
  const selected = env.service.execute(BONUS_DRAW_COMMANDS.choosePool, { version: DRAW, pool_id: 5 });
  const body = codec.unpack('pb_bonus_draw', selected.data);
  assert.equal(body.id, DRAW);
  assert.equal(body.cur_pool, 5);
  assert.equal(env.state().cur_pool_index, 5);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.choosePool, { version: DRAW, pool_id: 5 }), error => error.code === 310);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.choosePool, { version: DRAW, pool_id: 999 }), error => error.code === 1);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.choosePool, { version: DRAW, pool_id: 8 }), error => error.code === 1);
  env.reopen();
  assert.equal(env.state().cur_pool_index, 5);
});

test('PB encoding failure rolls the whole draw back', t => {
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_bonus_draw_back') throw new Error('bonus draw encode failure');
      return codec.pack(name, value);
    }
  };
  const env = setup(t, { codec: failing });
  env.addCost(10);
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1 }), /bonus draw encode failure/);
  assert.equal(env.cost(), 10n);
  assert.equal(env.awards().length, 0);
});

test('SQLite write rejection rolls the whole draw back', t => {
  const env = setup(t);
  env.addCost(10);
  env.store.inspect(db => db.exec(
    "CREATE TRIGGER bonus_draw_award_reject BEFORE INSERT ON bonus_draw_pool_awards BEGIN SELECT RAISE(ABORT,'bonus_draw_write_rejected'); END;"
  ));
  assert.throws(() => env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1 }), /bonus_draw_write_rejected/);
  env.store.inspect(db => db.exec('DROP TRIGGER bonus_draw_award_reject'));
  assert.equal(env.cost(), 10n);
  assert.equal(env.awards().length, 0);
  assert.equal(env.state(), undefined);
});

test('loginPayload reports one record per configured draw with the recorded pools', t => {
  const env = setup(t);
  env.addCost(10);
  env.service.execute(BONUS_DRAW_COMMANDS.draw, { id: DRAW, num: 1, stop: false });
  const body = codec.unpack('pb_bonus_draw_all', env.service.loginPayload());
  assert.equal(body.list.length, 8);
  const entry = body.list.find(row => Number(row.id) === DRAW);
  assert.equal(entry.cur_pool, 1);
  assert.equal(entry.pool_list.length, 7);
  assert.equal(entry.pool_list[0].award_list.length, 1);
  assert.equal(entry.pool_list[1].award_list.length, 0);
});

