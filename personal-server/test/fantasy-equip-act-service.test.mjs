import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createFantasyEquipActService } from '../game/fantasy-equip-act-service.mjs';
import {
  buildFantasyActTables, loadFantasyActTables,
  resolveDemigodActVersion, resolveFantasyActVersion
} from '../game/fantasy-act-tables.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const fantasyTables = loadFantasyActTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;
const alwaysOpen = () => true;

function rawTables(tableBundle = fantasyTables) {
  return {
    activity: new Map([...tableBundle.FantasyActSchedule, ...tableBundle.DemigodActSchedule]),
    fantasy: {
      Task: tableBundle.Task,
      DrawWish: tableBundle.DrawWish,
      Draw: tableBundle.FantasyEquipActDraw,
      DrawShow: tableBundle.FantasyEquipActDrawShow,
      Gift: tableBundle.FantasyEquipActGift,
      GiftRelease: tableBundle.FantasyEquipActGiftRelease,
      Pre: tableBundle.FantasyEquipActPre,
      PreShow: tableBundle.FantasyEquipActPreShow,
      FantasyEquipTrialDamage: tableBundle.FantasyEquipTrialDamage,
      FantasyEquipTrialBless: tableBundle.FantasyEquipTrialBless,
      FantasyEquipTrialStar: tableBundle.FantasyEquipTrialStar,
      FantasyEquipTrialLevel: tableBundle.FantasyEquipTrialLevel,
      FantasyEquipTrial: tableBundle.FantasyEquipTrial
    },
    miniGame: { MarblesConst: tableBundle.MarblesConst, Marbles: tableBundle.Marbles },
    demigod: {
      Shop: tableBundle.DemigodShop,
      Show: tableBundle.DemigodShow,
      DrawWish: tableBundle.DemigodDrawWish,
      Draw: tableBundle.DemigodDraw,
      DrawFantasy: tableBundle.DemigodDrawFantasy,
      DrawAward: tableBundle.DemigodDrawAward,
      Gift: tableBundle.DemigodGift,
      DemigodAct: tableBundle.DemigodAct,
      DemigodTrialDamage: tableBundle.DemigodTrialDamage,
      DemigodTrialBless: tableBundle.DemigodTrialBless,
      DemigodTrialStar: tableBundle.DemigodTrialStar,
      DemigodTrialLevel: tableBundle.DemigodTrialLevel,
      DemigodTrial: tableBundle.DemigodTrial
    }
  };
}

function fixture(t, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-act-'));
  const databasePath = path.join(dir, 'game.sqlite');
  let store, service, closed = false;
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  });
  const open = () => {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    service = createFantasyEquipActService({
      store, codec, tables, fantasyTables, activityTid: 74001,
      assertOpen: alwaysOpen, marblesRandom: () => 0, ...extra
    });
    closed = false;
  };
  open();
  t.after(() => { if (!closed) store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { get store() { return store; }, get service() { return service; }, reopen() { if (!closed) store.close(); open(); } };
}

function equip(f, tid, options = {}) {
  return f.store.transaction(model => {
    const current = f.service.inventory.read(model);
    const value = f.service.inventory.create(current, tid, options);
    f.service.inventory.save(model, current);
    return value;
  });
}

function damage(f, tid, value) {
  f.store.transaction(model => f.service.recordTrialDamage(model, tid, value));
}

test('M5 production loader recovers func=74 versions and required fantasy tables', () => {
  assert.deepEqual([...fantasyTables.FantasyActVersionByActivityTid], [
    [74001, 1], [74002, 2], [74003, 3], [74004, 4], [74005, 5]
  ]);
  assert.deepEqual([...fantasyTables.FantasyActActivityTidByVersion], [
    [1, 74001], [2, 74002], [3, 74003], [4, 74004], [5, 74005]
  ]);
  assert.equal(fantasyTables.FantasyEquipActTask.size, 0);
  assert.equal(fantasyTables.DrawWish.size, 42);
  assert.equal(fantasyTables.FantasyEquipActDraw.size, 5);
  assert.equal(fantasyTables.FantasyEquipActPre.size, 5);
  assert.equal(fantasyTables.FantasyEquipTrial.size, 12);
  assert.equal(fantasyTables.FantasyEquipTrialDamage.size, 72);
  assert.equal(fantasyTables.MarblesConst.get(1).max_run_time, 12);
  assert.deepEqual([...fantasyTables.DemigodActVersionByActivityTid], Array.from(
    { length: 38 }, (_, index) => [102001 + index, index + 1]
  ));
  assert.deepEqual([...fantasyTables.DemigodActActivityTidByVersion], Array.from(
    { length: 38 }, (_, index) => [index + 1, 102001 + index]
  ));
  assert.equal(fantasyTables.DemigodActVersionByActivityTid.has(98001), false);
  assert.equal(resolveFantasyActVersion(fantasyTables, 74003), 3);
  assert.equal(resolveFantasyActVersion(fantasyTables, 3), 3);
  assert.equal(resolveFantasyActVersion(fantasyTables, 6), null);
  assert.equal(resolveDemigodActVersion(fantasyTables, 102038), 38);
  assert.equal(resolveDemigodActVersion(fantasyTables, 38), 38);
  assert.equal(resolveDemigodActVersion(fantasyTables, 39), null);
  for (const version of [1, 2, 3, 4, 5]) {
    assert.equal(fantasyTables.FantasyEquipActDraw.get(version).tid, version);
    assert.equal(fantasyTables.FantasyEquipActPre.get(version).tid, version);
  }
});

test('M5 production loader fails closed on missing or conflicting version tables', () => {
  const missingDraw = rawTables();
  missingDraw.fantasy.Draw = new Map(missingDraw.fantasy.Draw);
  missingDraw.fantasy.Draw.delete(5);
  assert.throws(() => buildFantasyActTables(missingDraw), /Draw must contain exactly/);

  const conflictingPre = rawTables();
  conflictingPre.fantasy.Pre = new Map(conflictingPre.fantasy.Pre);
  conflictingPre.fantasy.Pre.set(1, { ...conflictingPre.fantasy.Pre.get(1), tid: 2 });
  assert.throws(() => buildFantasyActTables(conflictingPre), /does not match/);
});

test('adapter advertises exactly the eight fantasy activity commands', () => {
  const f = fixture(test);
  for (const type of [88922, 88924, 88927, 88928, 88929, 88930, 88931, 88932]) assert.equal(f.service.supports(type), true);
  assert.equal(f.service.supports(88923), false);
  assert.throws(() => f.service.execute(88923, null), /Unsupported/);
});

test('fantasy PB and ETF commands use production tables and persist their state', () => {
  const f = fixture(test);
  assert.equal(f.service.execute(88922, null).schema, 'pb_res_to_client');
  assert.equal(f.service.execute(88924, 1001).schema, 'etf');
  const vote = f.service.execute(88927, { fantasy_equip: 1200119, index: 2 });
  assert.equal(vote.schema, 'pb_res_to_client');
  assert.equal(vote.value.changes.length, 3);
  damage(f, 1, 500000);
  assert.equal(f.service.execute(88928, { tid: 1, receive_tid: 1001 }).schema, 'pb_res_to_client');
  assert.throws(() => f.service.execute(88932, { task_id: 1 }), /Unknown fantasy activity task/);
  f.reopen();
  const state = f.store.state().fantasyActState.kinds.fantasy;
  assert.equal(state.draw.wish_tid, '1001');
  assert.equal(state.pre_choose_fantasy, '1200519');
  assert.deepEqual(state.trials['1'].receive_list, [1001]);
});

test('module-183 payload exposes fantasy blocks and the persisted pre-choice', () => {
  const f = fixture(test);
  f.service.execute(88927, null);
  const payload = f.service.serializeLoginBlocks();
  assert.deepEqual(payload.blocks.map(block => block.schema), [
    'pb_fantasy_equip_act', 'pb_fantasy_equip_act_trial_data', 'pb_marbles_award_info'
  ]);
  assert.ok(payload.blocks[0].data.length > 0);
  for (const block of payload.blocks) assert.ok(Buffer.isBuffer(block.data));
  const state = codec.unpack('pb_fantasy_equip_act', payload.blocks[0].data);
  assert.equal(state.act_tid, 74001);
  assert.equal(state.pre_choose_fantasy, 1200519);
});

test('fantasy wishes and trials are gated by the active Draw version', () => {
  const v1 = fixture(test);
  assert.equal(v1.service.execute(88924, 1001).schema, 'etf');
  assert.throws(() => v1.service.execute(88924, 2001), /current version/);
  assert.throws(() => v1.store.transaction(model => v1.service.recordTrialDamage(model, 7, 1)), /current version/);

  const v3 = fixture(test, { activityTid: 74003 });
  assert.equal(v3.service.execute(88924, 3001).schema, 'etf');
  assert.throws(() => v3.service.execute(88924, 1001), /current version/);
  assert.equal(v3.store.transaction(model => v3.service.recordTrialDamage(model, 7, 1)).tid, 7);
});

test('fantasy wear and bless use real equipment identity and reject cross references', () => {
  const f = fixture(test);
  const main = equip(f, 1200119, { star: 5 });
  const bless = equip(f, 1120119);
  assert.equal(f.service.execute(88929, { tid: 1, fantasy_id: { uid: main.uid, tid: main.tid } }).schema, 'pb_fantasy_act_wear_back');
  const result = f.service.execute(88930, {
    tid: 1, bless_list: [{ bless_fantasy_id: { uid: bless.uid, tid: bless.tid }, pos: 1 }]
  });
  assert.equal(result.schema, 'pb_fantasy_act_wear_bless_back');
  assert.deepEqual(result.trial.bless_list, [String(bless.uid)]);
  assert.throws(() => f.service.execute(88930, {
    tid: 1, bless_list: [{ bless_fantasy_id: { uid: main.uid, tid: main.tid }, pos: 2 }]
  }), /itself|locked/);
});

test('fantasy copy creates a distinct uid and rejects a second active trial copy', () => {
  const f = fixture(test);
  const source = equip(f, 1200119);
  const copy = f.service.execute(88931, 1);
  assert.equal(copy.schema, 'pb_fantasy_equip_act_trial');
  assert.notEqual(copy.equipment.uid, source.uid);
  assert.throws(() => f.service.execute(88931, 1), /already selected/);
});

test('empty production task table fails closed as unknown instead of missing configuration', () => {
  const f = fixture(test);
  f.store.transaction(model => f.service.recordDraw(model, { count: 100 }));
  assert.throws(() => f.service.execute(88932, { task_id: 1 }), error => error.code === 306 && /Unknown fantasy activity task/.test(error.message));
  assert.throws(() => f.service.execute(88932, { task_id: 1, task_records: Buffer.from('forged') }), /Unknown/);
});

test('88927 ignores client values and uses weighted current-version PreShow selection', () => {
  const first = fixture(test, { marblesRandom: () => 0 });
  first.service.execute(88927, { index: 99, fantasy_equip: 1200119 });
  assert.equal(first.store.state().fantasyActState.kinds.fantasy.pre_choose_fantasy, '1200519');

  const last = fixture(test, { marblesRandom: () => 0.999999 });
  last.service.execute(88927, null);
  assert.equal(last.store.state().fantasyActState.kinds.fantasy.pre_choose_fantasy, '1200319');

  const invalid = fixture(test, { marblesRandom: () => 1 });
  assert.throws(() => invalid.service.execute(88927, null), /Invalid activity random value/);
  assert.equal(invalid.store.state().fantasyActState, undefined);
});

test('assertOpen receives the real activity row and a closed result creates no state', () => {
  const calls = [];
  const f = fixture(test, { assertOpen: context => { calls.push(context); return false; } });
  assert.throws(() => f.service.execute(88922, null), error => error.code === 305 && /closed/.test(error.message));
  assert.equal(f.store.state().fantasyActState, undefined);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].event, 'claim_daily_marbles');
  assert.equal(calls[0].actTid, 74001);
  assert.equal(calls[0].activityTid, 74001);
  assert.equal(calls[0].businessVersion, 1);
  assert.equal(calls[0].row.tid, 74001);
});

test('response encoding failure rolls back fantasy state completely', () => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_res_to_client') throw new Error('intentional response encoding failure');
      return codec.pack(name, value);
    }
  };
  const f = fixture(test, { codec: failingCodec });
  damage(f, 1, 500000);
  assert.throws(() => f.service.execute(88928, { tid: 1, receive_tid: 1001 }), /intentional/);
  assert.deepEqual(f.store.state().fantasyActState.kinds.fantasy.trials['1'].receive_list, []);
});
