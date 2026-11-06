import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createItemBoxService } from '../game/item-box-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec(), tables = readGameTables(), heroTables = readHeroTables();
const FIXED_NOW = () => Date.parse('2026-11-07T00:00:00Z');

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-item-item-' });
  let store = fixture.store;
  const make = () => createItemBoxService({
    store,
    codec: options.codec ?? codec,
    tables,
    heroTables,
    random: options.random ?? (() => 0),
    now: options.now ?? FIXED_NOW
  });
  let service = make();
  return {
    fixture,
    get store() { return store; },
    get service() { return service; },
    reopen() { store = fixture.open(); service = make(); }
  };
}

function addResource(store, tid, num, group = 0) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, group, entry] });
  });
}

test('chip compose spends Chip.need_num chips, grants the target and persists its count', t => {
  const env = setup(t);
  // ItemTable.Chip[21300104]: point_item 1030101, need_num 60, type 21 (HeroChip).
  addResource(env.store, 21300104, 120, 2);
  const result = env.service.composeChip({ tid: 21300104, num: 1 });
  const spent = result.value.changes.find(change => change.tid === '21300104');
  assert.equal(spent.diff_num, '-60');
  assert.equal(spent.new_num, '60');
  const granted = result.value.changes.find(change => change.tid === '1030101');
  assert.equal(granted.diff_num, '1');
  const heroes = env.store.read().heroInfo.hero_list.filter(hero => Number(hero.tid) === 1030101);
  assert.equal(heroes.length, 1);
  assert.equal(heroes[0].count, 1);
  assert.equal(env.service.composeCount(21300104), 1);
  const decoded = codec.unpack('pb_res_to_client', result.data);
  assert.notEqual(decoded.is_overflow, true);
  assert.equal(decoded.changes.length, 2);
  env.reopen();
  assert.equal(env.store.read().resources.get('21300104').num, '60');
  assert.equal(env.service.composeCount(21300104), 1);
});

test('chip compose rejects unknown chips, bad quantities and short stock without touching state', t => {
  const env = setup(t);
  addResource(env.store, 21300104, 30, 2);
  const before = env.store.state();
  assert.throws(() => env.service.composeChip({ tid: 21300104, num: 1 }), error => error.code === 301);
  // MatchHeroChip 10014700 points at 10014600, which has no reward handler in this build.
  assert.throws(() => env.service.composeChip({ tid: 10014700, num: 1 }),
    error => error.code === 5 && /reward handler/.test(error.message));
  assert.throws(() => env.service.composeChip({ tid: 2261200, num: 1 }), error => error.code === 5);
  assert.throws(() => env.service.composeChip({ tid: 21300104, num: 0 }), error => error.code === 1);
  assert.throws(() => env.service.composeChip({ tid: 21300104, num: 1000 }), error => error.code === 1);
  assert.throws(() => env.service.composeChip(null), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);
  assert.equal(env.service.composeCount(21300104), 0);
});

test('one-key chip compose skips unaffordable families and fails when nothing is affordable', t => {
  const env = setup(t);
  addResource(env.store, 21300104, 120, 2);
  addResource(env.store, 21200104, 10, 2);
  const result = env.service.composeChips([{ tid: 21300104, num: 1 }, { tid: 21200104, num: 1 }]);
  assert.deepEqual(result.composed, [21300104]);
  assert.deepEqual(result.skipped, [21200104]);
  assert.equal(result.value.changes.find(change => change.tid === '21300104').diff_num, '-60');
  assert.equal(result.value.changes.find(change => change.tid === '21200104'), undefined);
  assert.equal(env.store.read().resources.get('21200104').num, '10');
  const before = env.store.state();
  assert.throws(() => env.service.composeChips([{ tid: 21200104, num: 1 }]), error => error.code === 301);
  assert.deepEqual(env.store.state(), before);
  assert.equal(env.service.composeCount(21200104), 0);
});

test('one-key chip compose aggregates duplicate chip entries', t => {
  const env = setup(t);
  addResource(env.store, 21300104, 120, 2);
  const result = env.service.composeChips([{ tid: 21300104, num: 1 }, { tid: 21300104, num: 1 }]);
  assert.deepEqual(result.composed, [21300104]);
  assert.equal(result.value.changes.find(change => change.tid === '21300104').diff_num, '-120');
  assert.equal(env.store.read().resources.get('21300104').num, '0');
  assert.equal(env.service.composeCount(21300104), 2);
});

test('manual conversion spends the configured source and grants its fixed award', t => {
  const env = setup(t);
  // ItemTable.Convert[157002].convert_list = [[201500,2]].
  addResource(env.store, 157002, 3, 0);
  const currencyBefore = BigInt(env.store.read().resources.get('201500')?.num ?? 0);
  const first = env.service.manualConvert(157002);
  assert.equal(first.value.changes.find(change => change.tid === '157002').diff_num, '-1');
  assert.equal(first.value.changes.find(change => change.tid === '201500').diff_num, '2');
  const second = env.service.manualConvert([157002, 2]);
  assert.equal(second.value.changes.find(change => change.tid === '157002').diff_num, '-2');
  assert.equal(second.value.changes.find(change => change.tid === '201500').diff_num, '4');
  assert.equal(env.store.read().resources.get('157002').num, '0');
  assert.equal(BigInt(env.store.read().resources.get('201500').num), currencyBefore + 6n);
  const before = env.store.state();
  assert.throws(() => env.service.manualConvert(157002), error => error.code === 301);
  assert.throws(() => env.service.manualConvert(2261200), error => error.code === 5);
  assert.throws(() => env.service.manualConvert('x'), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);
});

test('a repeated request scope replays the stored response and rejects a different payload', t => {
  const env = setup(t);
  addResource(env.store, 21300104, 180, 2);
  const context = { connection: 'conn-a', seq: 42, type: 156 };
  const first = env.service.composeChip({ tid: 21300104, num: 1 }, context);
  assert.equal(first.duplicate, false);
  assert.equal(env.store.read().resources.get('21300104').num, '120');
  const replay = env.service.composeChip({ tid: 21300104, num: 1 }, context);
  assert.equal(replay.duplicate, true);
  assert.deepEqual(replay.value, first.value);
  assert.equal(env.store.read().resources.get('21300104').num, '120');
  const bytes = codec.unpack('pb_res_to_client', replay.data);
  assert.equal(bytes.changes.find(change => change.tid === '21300104').diff_num, '-60');
  assert.throws(() => env.service.composeChip({ tid: 21300104, num: 2 }, context), error => error.code === 1);
  assert.equal(env.store.read().resources.get('21300104').num, '120');
  env.reopen();
  const afterReopen = env.service.composeChip({ tid: 21300104, num: 1 }, context);
  assert.equal(afterReopen.duplicate, true);
  assert.equal(env.store.read().resources.get('21300104').num, '120');
  assert.equal(env.service.composeCount(21300104), 1);
});

test('unreachable repeat boxes, undefined lottery rewards and uncountable sources are refused', t => {
  const env = setup(t);
  addResource(env.store, 124808, 1, 0);
  const before = env.store.state();
  assert.throws(() => env.service.openRepeat(2261200),
    error => error.code === 5 && /not configured/.test(error.message));
  assert.throws(() => env.service.openRepeat('x'), error => error.code === 1);
  assert.throws(() => env.service.openLottery([{ tid: 100013400, num: 1 }]),
    error => error.code === 5 && /not defined/.test(error.message));
  assert.throws(() => env.service.openLottery([{ tid: 2261200, num: 1 }]),
    error => error.code === 5 && /not a lottery box/.test(error.message));
  assert.throws(() => env.service.openLottery([]), error => error.code === 1);
  // ItemTable.Convert[124808] exists, but ItemFigure sources are one-off unlocks.
  assert.throws(() => env.service.manualConvert(124808),
    error => error.code === 5 && /countable/.test(error.message));
  assert.deepEqual(env.store.state(), before);
});

test('random box guarantees persist in sqlite and encode a pb_box_guarantee_list payload', t => {
  const env = setup(t, { random: () => 0.99 });
  addResource(env.store, 3501200, 2, 1);
  env.service.open([{ tid: 3501200, num: 1 }]);
  env.service.open([{ tid: 3501200, num: 1 }]);
  const decoded = codec.unpack('pb_box_guarantee_list', env.service.loginGuaranteePayload().data);
  const row = decoded.guarantee_list.find(entry => Number(entry.tid) === 3501200);
  assert.equal(row.no_guarantee_count, 2);
  assert.equal(row.open_count, 2);
  assert.equal(Number(row.open_total_count), 2);
  env.reopen();
  const afterReopen = codec.unpack('pb_box_guarantee_list', env.service.loginGuaranteePayload().data);
  assert.equal(afterReopen.guarantee_list.find(entry => Number(entry.tid) === 3501200).open_count, 2);
});

test('chip compose rolls back stock and counters when the response cannot be encoded', t => {
  const env = setup(t);
  addResource(env.store, 21300104, 60, 2);
  const before = env.store.state();
  const broken = createItemBoxService({
    store: env.store,
    codec: { ...codec, pack: (name, object) => { if (name === 'pb_res_to_client') throw new Error('encode fail'); return codec.pack(name, object); } },
    tables,
    heroTables,
    now: FIXED_NOW
  });
  assert.throws(() => broken.composeChip({ tid: 21300104, num: 1 }), /encode fail/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(broken.composeCount(21300104), 0);
});
