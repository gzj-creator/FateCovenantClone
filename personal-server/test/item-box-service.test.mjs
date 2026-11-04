import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createItemBoxService } from '../game/item-box-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec(), tables = readGameTables();

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-itembox-' });
  let store = fixture.store;
  const make = () => createItemBoxService({ store, codec, tables, random: options.random ?? (() => 0) });
  let service = make();
  return {
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store = fixture.open();
      service = make();
    }
  };
}

// Inject optional-box stock in the same module-6 layout the live store uses.
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

test('designated emoji box consumes each box and grants its complete fixed award list', t => {
  const env = setup(t);
  addBox(env, 1501200, 2);
  const rule = env.service.rule(1501200);
  assert.equal(rule.kind, 'designated');
  assert.deepEqual(rule.awards, [[381002, 1], [389002, 1]]);

  const result = env.service.open([{ tid: 1501200, num: 2 }]);
  const changes = codec.unpack('pb_res_to_client', result.data).changes;
  assert.equal(changes.find(change => change.tid === '1501200').diff_num, '-2');
  assert.equal(changes.find(change => change.tid === '381002').diff_num, '2');
  assert.equal(changes.find(change => change.tid === '389002').diff_num, '2');
  assert.equal(env.store.read().resources.get('1501200').num, '0');
  assert.equal(env.store.read().resources.get('381002').num, '2');
  assert.equal(env.store.read().resources.get('389002').num, '2');
  assert.deepEqual(env.store.read().resources.get('381002').location.slice(0, 2), [6, 0]);
  assert.deepEqual(env.store.read().resources.get('389002').location.slice(0, 2), [6, 0]);

  env.reopen();
  assert.equal(env.store.read().resources.get('1501200').num, '0');
  assert.equal(env.store.read().resources.get('381002').num, '2');
  assert.equal(env.store.read().resources.get('389002').num, '2');
});

test('designated boxes take precedence over optional rows and reject selection use', t => {
  const env = setup(t);
  addBox(env, 1501200, 1);
  assert.equal(env.service.rule(1501200).kind, 'designated');
  assert.equal(env.service.rule(1151200).kind, 'designated');
  const before = env.store.state();
  assert.throws(
    () => env.service.openSelected({ tid: 1501200, num: 1, selected: [{ index: 1, num: 1 }] }),
    error => error.code === 5
  );
  assert.throws(
    () => env.service.openSelected({ tid: 1151200, num: 1, selected: [{ index: 1, num: 1 }] }),
    error => error.code === 5
  );
  assert.deepEqual(env.store.state(), before);
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

test('designated box transaction rolls back when award encoding fails', t => {
  const env = setup(t);
  addBox(env, 1501200, 1);
  const before = env.store.state();
  const broken = createItemBoxService({ store: env.store, codec: { ...codec, pack: (name, object) => { if (name === 'pb_res_to_client') throw new Error('encode fail'); return codec.pack(name, object); } }, tables, random: () => 0 });
  assert.throws(() => broken.open([{ tid: 1501200, num: 1 }]), /encode fail/);
  assert.deepEqual(env.store.state(), before);
});

test('guaranteed random box forces its configured group at the threshold and persists counters', t => {
  const env = setup(t, { random: () => 0.99 });
  addBox(env, 3501200, 8);
  const before = BigInt(env.store.read().resources.get('3002')?.num ?? 0);
  for (let index = 0; index < 6; index++) env.service.open([{ tid: 3501200, num: 1 }]);
  let guarantee = env.store.read().state.boxGuarantees?.['3501200'];
  assert.equal(guarantee.noGuaranteeCount, 6);
  assert.equal(guarantee.openCount, 6);
  assert.equal(guarantee.openTotalCount, 6);
  assert.equal(guarantee.counterGuaranteeCount, 0);

  const seventh = env.service.open([{ tid: 3501200, num: 1 }]);
  const award = seventh.value.changes.find(change => change.tid === '3002');
  assert.equal(award.diff_num, '10');
  guarantee = env.store.read().state.boxGuarantees['3501200'];
  assert.equal(guarantee.noGuaranteeCount, 0);
  assert.equal(guarantee.openCount, 7);
  assert.equal(guarantee.openTotalCount, 7);
  assert.equal(guarantee.counterGuaranteeCount, 1);
  assert.equal(BigInt(env.store.read().resources.get('3002').num), before + 10n);

  env.reopen();
  assert.deepEqual(env.store.read().state.boxGuarantees['3501200'], guarantee);
});

test('guaranteed random box counters and stock roll back when award encoding fails', t => {
  const env = setup(t, { random: () => 0.99 });
  addBox(env, 3501200, 2);
  const before = env.store.state();
  const broken = createItemBoxService({
    store: env.store,
    codec: { ...codec, pack: (name, object) => { if (name === 'pb_res_to_client') throw new Error('encode fail'); return codec.pack(name, object); } },
    tables,
    random: () => 0.99
  });
  assert.throws(() => broken.open([{ tid: 3501200, num: 2 }]), /encode fail/);
  assert.deepEqual(env.store.state(), before);
});
