import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
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

// Handoff backup intentionally has no optional-box stock. Inject a stack in the
// same module-6 layout the live store uses, before exercising the service.
function addBox(env, tid, num, group = 1) {
  env.store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, group, entry] });
  });
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
  // A whole-hero selector has no ItemTable award and needs a hero-creation handler;
  // pay and non-box items also keep an explicit refusal.
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

test('optional hero-chip box consumes one box and grants the selected 1-based range entry', t => {
  const env = setup(t);
  addBox(env, 71200, 2);
  const before = BigInt(env.store.read().resources.get('21300104')?.num ?? 0);
  const result = env.service.openSelected({ tid: 71200, num: 1, selected: [{ index: 1, num: 1 }] });
  const box = result.value.changes.find(change => change.tid === '71200');
  const chip = result.value.changes.find(change => change.tid === '21300104');
  assert.equal(box.diff_num, '-1');
  assert.equal(box.new_num, '1');
  assert.equal(chip.diff_num, '1');
  const stored = env.store.read().resources.get('21300104');
  assert.equal(BigInt(stored.num), before + 1n);
  assert.deepEqual(stored.location.slice(0, 2), [6, 2]);
  assert.equal(env.store.read().resources.get('71200').num, '1');
  const decoded = codec.unpack('pb_res_to_client', result.data);
  assert.notEqual(decoded.is_overflow, true);
  assert.equal(decoded.changes.length, 2);
});

test('optional box handles multiple openings and duplicate selected indexes', t => {
  const env = setup(t);
  addBox(env, 71200, 4);
  const result = env.service.openSelected({
    tid: 71200, num: 2,
    selected: [{ index: 1, num: 1 }, { index: 2, num: 1 }]
  });
  assert.equal(result.value.changes.find(change => change.tid === '71200').diff_num, '-2');
  assert.equal(result.value.changes.find(change => change.tid === '21300104').diff_num, '1');
  assert.equal(result.value.changes.find(change => change.tid === '21300204').diff_num, '1');
  const duplicate = env.service.openSelected({ tid: 71200, num: 2, selected: [{ index: 3, num: 1 }, { index: 3, num: 1 }] });
  assert.equal(duplicate.value.changes.find(change => change.tid === '21300304').diff_num, '2');
  assert.equal(env.store.read().resources.get('71200').num, '0');
});

test('optional box rejects invalid selections, wrong totals, non-optional and missing stock atomically', t => {
  const env = setup(t);
  addBox(env, 71200, 2);
  const before = env.store.state();
  const rejected = (fn, code = 1) => assert.throws(fn, error => error.code === code);
  rejected(() => env.service.openSelected({ tid: 71200, num: 1, selected: [] }));
  rejected(() => env.service.openSelected({ tid: 71200, num: 2, selected: [{ index: 1, num: 1 }] }));
  rejected(() => env.service.openSelected({ tid: 71200, num: 1, selected: [{ index: 0, num: 1 }] }));
  rejected(() => env.service.openSelected({ tid: 71200, num: 1, selected: [{ index: 28, num: 1 }] }));
  rejected(() => env.service.openSelected({ tid: 71200, num: 1, selected: [{ index: 1, num: 0 }] }));
  rejected(() => env.service.openSelected({ tid: 71200, num: 3, selected: [{ index: 1, num: 3 }] }));
  rejected(() => env.service.openSelected({ tid: 2261200, num: 1, selected: [{ index: 1, num: 1 }] }), 5);
  rejected(() => env.service.open([{ tid: 71200, num: 1 }]), 5);
  assert.deepEqual(env.store.state(), before);
});

test('box transaction rolls back when award encoding fails', t => {
  const env = setup(t);
  const before = env.store.state();
  const broken = createItemBoxService({ store: env.store, codec: { ...codec, pack: (name, object) => { if (name === 'pb_res_to_client') throw new Error('encode fail'); return codec.pack(name, object); } }, tables, random: () => 0 });
  assert.throws(() => broken.open([{ tid: 2261200, num: 1 }]), /encode fail/);
  assert.deepEqual(env.store.state(), before);
});

test('optional box transaction rolls back when award encoding fails', t => {
  const env = setup(t);
  addBox(env, 71200, 1);
  const before = env.store.state();
  const broken = createItemBoxService({ store: env.store, codec: { ...codec, pack: (name, object) => { if (name === 'pb_res_to_client') throw new Error('encode fail'); return codec.pack(name, object); } }, tables, random: () => 0 });
  assert.throws(() => broken.openSelected({ tid: 71200, num: 1, selected: [{ index: 1, num: 1 }] }), /encode fail/);
  assert.deepEqual(env.store.state(), before);
});
