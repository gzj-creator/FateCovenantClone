import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createItemBoxService } from '../game/item-box-service.mjs';

// Suit box (ItemCmd.use_selected_suit_box, type 155) evidence:
// textassets/13517926679985600000-ItemSuitBox.lua.bin sends {tid, index},
// textassets/1063512598223554800-ItemSuitBoxSelectUseForm.lua.bin stores the
// node awardIndex in _curSelectIndex, and
// textassets/13508732289462840000-ItemSuitBoxSelectNode.lua.bin resolves
// OptionalSuitRes[OptionalSuitBox[tid].range[awardIndex]] for display.

const backup = new URL('./fixtures/wallet-admin.sqlite', import.meta.url);
const codec = createGameCodec(), tables = readGameTables();

function setup(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-suitbox-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  let store = createGameStore({ databasePath: file, codec });
  const serviceTables = { ...tables, ...overrides };
  const make = () => createItemBoxService({ store, codec, tables: serviceTables });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    service: make(),
    reopen() { store.close(); store = createGameStore({ databasePath: file, codec }); }
  };
}

function addBox(env, tid, num, group = 1) {
  env.store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, group, entry] });
  });
}

test('suit box configuration maps the selected index to one fixed award list', t => {
  const env = setup(t);
  const options = env.service.suitBoxOptions(1071200);
  assert.deepEqual(options.map(option => option.suitId), [201, 202]);
  assert.deepEqual(options[0].awards, [[6007109, 1], [6007209, 1], [6007309, 1], [6007409, 1]]);
  assert.throws(() => env.service.suitBoxOptions(19002), error => error.code === 5);
});

test('non-selective use of a suit box is rejected instead of consuming it', t => {
  const env = setup(t);
  addBox(env, 1071200, 1);
  assert.throws(() => env.service.open([{ tid: 1071200, num: 1 }]), error => error.code === 5 && /Suit box requires a selection request/.test(error.message));
  assert.equal(env.store.read().resources.get('1071200').num, '1');
});

test('a suit whose award family has a reward handler is granted and the box is consumed', t => {
  const env = setup(t);
  addBox(env, 1071200, 1);
  // The shipped rows award relic items (ItemTable.Type 9 / Relic), which are now
  // stored in module 50 pb_relic_list through the relic handler.
  const result = env.service.openSuitBox([1071200, 1]);
  const decoded = codec.unpack('pb_res_to_client', result.data);
  assert.equal(decoded.changes.find(change => change.tid === '1071200').diff_num, '-1');
  assert.equal(env.store.read().resources.get('1071200').num, '0');
});

test('a granted suit award is consumed once, granted once and survives reopen', t => {
  // Award rows are swapped for a grantable inventory item so the selection flow
  // itself is exercised without inventing relic storage.
  const env = setup(t, {
    OptionalSuitBox: new Map([[1071200, { tid: 1071200, range: [901] }]]),
    OptionalSuitRes: new Map([[901, { tid: 901, award_list: [[19002, 3]] }]])
  });
  addBox(env, 1071200, 2);
  const before = BigInt(env.store.read().resources.get('19002')?.num ?? 0);
  const result = env.service.openSuitBox([1071200, 1]);
  const decoded = codec.unpack('pb_res_to_client', result.data);
  assert.equal(decoded.changes.find(change => change.tid === '1071200').diff_num, '-1');
  assert.equal(decoded.changes.find(change => change.tid === '19002').diff_num, '3');
  assert.equal(env.store.read().resources.get('1071200').num, '1');
  assert.equal(BigInt(env.store.read().resources.get('19002').num), before + 3n);
  env.reopen();
  assert.equal(env.store.read().resources.get('1071200').num, '1');
  assert.equal(BigInt(env.store.read().resources.get('19002').num), before + 3n);
});

test('an out-of-range selection index is rejected before anything is consumed', t => {
  const env = setup(t, {
    OptionalSuitBox: new Map([[1071200, { tid: 1071200, range: [901] }]]),
    OptionalSuitRes: new Map([[901, { tid: 901, award_list: [[19002, 1]] }]])
  });
  addBox(env, 1071200, 1);
  assert.throws(() => env.service.openSuitBox([1071200, 0]), error => error.code === 1);
  assert.throws(() => env.service.openSuitBox([1071200, 2]), error => error.code === 1);
  assert.throws(() => env.service.openSuitBox([19002, 1]), error => error.code === 5);
  assert.equal(env.store.read().resources.get('1071200').num, '1');
});

