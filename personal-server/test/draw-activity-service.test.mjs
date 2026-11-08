import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createDrawActivityService, DRAW_ACTIVITY_COMMANDS } from '../game/draw-activity-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const fixedNow = 1793400000000;

function setup(t, random = () => 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-draw-activity-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Draw Activity Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec });
  let service = createDrawActivityService({ store, codec, tables, now: () => fixedNow, random });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen(nextRandom = random) {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec });
      service = createDrawActivityService({ store, codec, tables, now: () => fixedNow, random: nextRandom });
    }
  };
}

test('107901 spends the configured turntable price and grants the drawn award', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[6881900, 5]], tables));
  const result = e.service.execute(DRAW_ACTIVITY_COMMANDS.turntableGo, {});
  assert.equal(result.value.draw_tid, '101');
  assert.equal(e.store.read().resources.get('6881900').num, '4');
  assert.equal(e.store.read().resources.get('22002').num, '1');
  assert.equal(result.value.act_data.spins, '1');
  e.reopen();
  const next = e.service.execute(DRAW_ACTIVITY_COMMANDS.turntableGo, {});
  assert.equal(next.value.act_data.spins, '2');
  assert.equal(e.service.stateOf(100001, 'turntable', 1).counters.spins, 2);
});

test('107901 fails closed when the spin price is not affordable and keeps state intact', async t => {
  const e = setup(t);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.turntableGo, {}),
    error => error.code === 301
  );
  assert.equal(e.service.stateOf(100001, 'turntable', 1).counters.spins, undefined);
  assert.equal(e.store.read().resources.get('22002'), undefined);
});

test('102301 draws from the configured pool, grants the toy and enforces the draw limit', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[707002, 40]], tables));
  const first = e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyDraw, {});
  assert.equal(first.value.draw_count, '1');
  assert.deepEqual(first.value.draw_list, [{ toy: '683002', num: '3' }]);
  assert.equal(e.store.read().resources.get('683002').num, '3');
  assert.equal(e.store.read().resources.get('707002').num, '39');
  e.reopen();
  const second = e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyDraw, {});
  assert.equal(second.value.draw_count, '2');
  assert.equal(e.service.stateOf(100001, 'capsule_toy', 1).counters.draw_count, 2);
});

test('88965 charges the extra-draw item, adds attempts and rejects over-cap requests', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[3401900, 100]], tables));
  const result = e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount, { times: 2 });
  assert.equal(result.value.changes.find(row => row.tid === '3401900').diff_num, '-30');
  assert.equal(e.service.stateOf(100001, 'three_admonition', 1).counters.draw_count, 2);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount, { times: 15 }),
    error => error.code === 311
  );
  assert.equal(e.service.stateOf(100001, 'three_admonition', 1).counters.draw_count, 2);
  assert.equal(e.store.read().resources.get('3401900').num, '70');
});

