import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createItemBoxService } from '../game/item-box-service.mjs';

// Temp database copied from the consistent handoff backup: never the running server database.
const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec(), tables = readGameTables();

function setup(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-itembox-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  let store = createGameStore({ databasePath: file, codec });
  const make = () => createItemBoxService({ store, codec, tables, random: options.random ?? (() => 0) });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { get store() { return store; }, service: make(), reopen() { store.close(); store = createGameStore({ databasePath: file, codec }); } };
}

test('ordinary configured box is consumed, awards configured draw results and persists', t => {
  const env = setup(t);
  const held = Number(env.store.read().resources.get('2261200')?.num ?? 0);
  assert.ok(held >= 1, 'handoff backup must hold the ordinary box 2261200');
  const rule = env.service.rule(2261200);
  assert.equal(rule.kind, 'random');
  const result = env.service.open([{ tid: 2261200, num: 1 }]);
  const consumed = result.value.changes.find(change => change.tid === '2261200');
  assert.equal(consumed.diff_num, '-1');
  assert.equal(consumed.new_num, String(held - 1));
  // Injected deterministic roll: first group of draw library 472 is group 49034 -> first range entry.
  const awarded = result.value.changes.find(change => change.tid === '22002');
  assert.equal(awarded.diff_num, '1');
  assert.equal(env.store.read().resources.get('2261200').num, String(held - 1));
  env.reopen();
  assert.equal(env.store.read().resources.get('2261200').num, String(held - 1));
  const decoded = codec.unpack('pb_res_to_client', result.data);
  assert.notEqual(decoded.is_overflow, true);
  assert.equal(decoded.changes.length, 2);
});

test('box use refuses unverified rules, missing stock and over-use without touching state', t => {
  const env = setup(t);
  const before = env.store.state();
  const rejected = (fn, code) => assert.throws(fn, error => error.code === code);
  // Optional (selection), pay and non-box items all keep an explicit refusal.
  rejected(() => env.service.open([{ tid: 11200, num: 1 }]), 5);
  rejected(() => env.service.open([{ tid: 100223, num: 1 }]), 5);
  rejected(() => env.service.open([{ tid: 101500, num: 1 }]), 5);
  rejected(() => env.service.open([{ tid: 99999999, num: 1 }]), 5);
  // Stock checks: 2261200 holds a small count, so a large request must fail as a whole.
  rejected(() => env.service.open([{ tid: 2261200, num: 900 }]), 1);
  rejected(() => env.service.open([{ tid: 2261200, num: 0 }]), 1);
  rejected(() => env.service.open([]), 1);
  assert.deepEqual(env.store.state(), before);
});

test('box transaction rolls back when award encoding fails', t => {
  const env = setup(t);
  const before = env.store.state();
  const broken = createItemBoxService({ store: env.store, codec: { ...codec, pack: (name, object) => { if (name === 'pb_res_to_client') throw new Error('encode fail'); return codec.pack(name, object); } }, tables, random: () => 0 });
  assert.throws(() => broken.open([{ tid: 2261200, num: 1 }]), /encode fail/);
  assert.deepEqual(env.store.state(), before);
});
