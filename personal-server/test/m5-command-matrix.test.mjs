import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createDemigodActService } from '../game/demigod-act-service.mjs';
import { createFantasyEquipActService } from '../game/fantasy-equip-act-service.mjs';
import { loadFantasyActTables } from '../game/fantasy-act-tables.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const fantasyTables = loadFantasyActTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const openedAt = 1792789200;
const modules = () => structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
const alwaysOpen = () => true;
const syntheticTasks = () => new Map([[1, { tid: 1, type: 101, count: 1, param: 7, award: [[101500, 100]] }]]);

function createHarness(t, kind, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `fc-m5-${kind}-`));
  const databasePath = path.join(directory, 'game.sqlite');
  let store, service, closed = false;
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt, modules: modules(),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  });
  function open() {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    const shared = {
      store, codec, tables, fantasyTables, assertOpen: alwaysOpen,
      activityTid: kind === 'demigod' ? 102001 : 74001,
      marblesRandom: () => 0, taskDefinitions: syntheticTasks(), ...options
    };
    service = kind === 'fantasy'
      ? createFantasyEquipActService(shared)
      : createDemigodActService(shared);
    closed = false;
  }
  open();
  t.after(() => {
    try { if (!closed) store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  return {
    directory, databasePath,
    get store() { return store; },
    get service() { return service; },
    reopen() { if (!closed) { store.close(); closed = true; } open(); },
    close() { if (!closed) { store.close(); closed = true; } }
  };
}

function addBareEquipment(f, tid, options = {}) {
  return f.store.transaction(model => {
    const current = f.service.inventory.read(model);
    const value = f.service.inventory.create(current, tid, options);
    f.service.inventory.save(model, current);
    return value;
  });
}

function ensureState(f) {
  return f.service.ensureLoginState();
}

function stateKind(f, kind) {
  return f.store.state().fantasyActState?.kinds?.[kind];
}

function clearInventory(f) {
  f.store.transaction(model => {
    const current = f.service.inventory.read(model);
    current.data.equips = [];
    f.service.inventory.save(model, current);
  });
}

function dailyLimitReached(f, kind) {
  ensureState(f);
  f.store.transaction(model => {
    const state = model.state.fantasyActState.kinds[kind];
    state.daily.last_marbles_claim_day = -1;
    state.daily.marbles.award_count = 12;
  });
}

function bigThresholdMissing(f, kind) {
  ensureState(f);
  f.store.transaction(model => {
    model.state.fantasyActState.kinds[kind].daily.marbles.award_count = 11;
  });
}

function recordDraw(f, count = 10) {
  f.store.transaction(model => f.service.recordDraw(model, { count }));
}

function recordDamage(f, tid = 1, value = 500000) {
  f.store.transaction(model => f.service.recordTrialDamage(model, tid, value));
}

function prepareWear(f) {
  const equipment = addBareEquipment(f, 1200119, { star: 5 });
  return { equipment, input: { tid: 1, fantasy_id: { uid: equipment.uid, tid: equipment.tid } } };
}

function prepareBless(f) {
  const { equipment: main, input: wearInput } = prepareWear(f);
  f.service.execute(f.service.supports(88929) ? 88929 : 98304, wearInput);
  const bless = addBareEquipment(f, 1120119);
  return {
    main, bless,
    input: { tid: 1, bless_list: [{ bless_fantasy_id: { uid: bless.uid, tid: bless.tid }, pos: 1 }] }
  };
}

const definitions = [
  {
    type: 98301, kind: 'demigod', name: 'demigod daily marbles', schema: 'pb_res_to_client',
    input: () => ({ award_count: 999, award: [[999999, 999]] }),
    verify: f => assert.notEqual(stateKind(f, 'demigod').daily.last_marbles_claim_day, -1),
    invalid: f => assert.throws(() => f.service.execute(98303, { tid: 1, receive_tid: 0 }), /Invalid/),
    insufficient: f => { dailyLimitReached(f, 'demigod'); assert.throws(() => f.service.execute(98301, null), /limit reached/); },
    repeatError: /already claimed/
  },
  {
    type: 98302, kind: 'demigod', name: 'demigod big marbles', schema: 'pb_res_to_client',
    prepare: f => { ensureState(f); f.store.transaction(model => { model.state.fantasyActState.kinds.demigod.daily.marbles.award_count = 12; }); },
    input: () => ({ award: [999999], award_index: 999 }),
    verify: f => assert.equal(stateKind(f, 'demigod').daily.marbles.big_award, true),
    invalid: f => assert.throws(() => f.service.execute(98304, { tid: 0, fantasy_id: {} }), /Invalid/),
    insufficient: f => { bigThresholdMissing(f, 'demigod'); assert.throws(() => f.service.execute(98302, null), /threshold/); },
    repeatError: /already claimed/
  },
  {
    type: 98303, kind: 'demigod', name: 'demigod trial reward', schema: 'pb_res_to_client',
    prepare: f => recordDamage(f),
    input: () => ({ tid: 1, receive_tid: 1001 }),
    verify: f => assert.deepEqual(stateKind(f, 'demigod').trials['1'].receive_list, [1001]),
    invalid: f => assert.throws(() => f.service.execute(98303, { tid: 1, receive_tid: 0 }), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(98303, { tid: 1, receive_tid: 1001 }), /threshold/),
    repeatError: /already claimed/
  },
  {
    type: 98304, kind: 'demigod', name: 'demigod wear', schema: 'pb_demigod_act_wear_back',
    prepare: prepareWear,
    input: context => context.input,
    verify: f => assert.notEqual(Number(stateKind(f, 'demigod').trials['1'].fantasy_equip), 0),
    invalid: f => assert.throws(() => f.service.execute(98304, { tid: 1 }), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(98304, { tid: 1, fantasy_id: { uid: 999999, tid: 1200119 } }), /does not exist/),
    repeatError: null
  },
  {
    type: 98305, kind: 'demigod', name: 'demigod bless', schema: 'pb_demigod_act_wear_bless_back',
    prepare: prepareBless,
    input: context => context.input,
    verify: f => assert.equal(stateKind(f, 'demigod').trials['1'].bless_list.length, 1),
    invalid: f => assert.throws(() => f.service.execute(98305, { tid: 1 }), /not selected/),
    insufficient: f => assert.throws(() => f.service.execute(98305, { tid: 1, bless_list: [] }), /not selected/),
    repeatError: null
  },
  {
    type: 98306, kind: 'demigod', name: 'demigod copy', schema: 'pb_demigod_act_trial',
    prepare: f => addBareEquipment(f, 1200119),
    input: () => 1,
    verify: f => assert.notEqual(Number(stateKind(f, 'demigod').trials['1'].fantasy_equip), 0),
    invalid: f => assert.throws(() => f.service.execute(98306, {}), /Invalid/),
    insufficient: f => { clearInventory(f); assert.throws(() => f.service.execute(98306, 1), /No source/); },
    repeatError: /already selected/
  },
  {
    type: 98307, kind: 'demigod', name: 'demigod draw award', schema: 'pb_demigod_act_draw_award_back',
    prepare: f => recordDraw(f),
    input: () => ({ draw_num: 999999, award: [[999999, 1]] }),
    verify: f => assert.deepEqual(stateKind(f, 'demigod').draw.draw_awards, [1001]),
    invalid: f => assert.throws(() => f.service.execute(98304, { tid: 1 }), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(98307, null), /No demigod draw award/),
    repeatError: /No demigod draw award/
  },
  {
    type: 98308, kind: 'demigod', name: 'demigod wish', schema: 'etf',
    input: () => 1,
    verify: f => assert.equal(stateKind(f, 'demigod').draw.wish_tid, '1'),
    invalid: f => assert.throws(() => f.service.execute(98308, undefined), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(98308, 999999999), /Unknown fantasy wish/),
    repeatError: null
  },
  {
    type: 88922, kind: 'fantasy', name: 'fantasy daily marbles', schema: 'pb_res_to_client',
    input: () => ({ award_count: 999, award: [[999999, 999]] }),
    verify: f => assert.notEqual(stateKind(f, 'fantasy').daily.last_marbles_claim_day, -1),
    invalid: f => assert.throws(() => f.service.execute(88924, undefined), /Invalid/),
    insufficient: f => { dailyLimitReached(f, 'fantasy'); assert.throws(() => f.service.execute(88922, null), /limit reached/); },
    repeatError: /already claimed/
  },
  {
    type: 88924, kind: 'fantasy', name: 'fantasy wish', schema: 'etf',
    input: () => 1001,
    verify: f => assert.equal(stateKind(f, 'fantasy').draw.wish_tid, '1001'),
    invalid: f => assert.throws(() => f.service.execute(88924, {}), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(88924, 2001), /current version/),
    repeatError: null
  },
  {
    type: 88927, kind: 'fantasy', name: 'fantasy vote', schema: 'pb_res_to_client',
    input: () => ({ fantasy_equip: 1200119, index: 99, award: [[999999, 1]] }),
    verify: f => assert.equal(stateKind(f, 'fantasy').pre_choose_fantasy, '1200519'),
    invalid: f => {
      const result = f.service.execute(88927, { fantasy_equip: 999999, index: -1 });
      assert.equal(result.schema, 'pb_res_to_client');
      assert.equal(stateKind(f, 'fantasy').pre_choose_fantasy, '1200519');
    },
    insufficient: f => {
      assert.equal(f.service.execute(88927, null).schema, 'pb_res_to_client');
      assert.throws(() => f.service.execute(88927, null), /already claimed/);
    },
    repeatError: /already claimed/
  },
  {
    type: 88928, kind: 'fantasy', name: 'fantasy trial reward', schema: 'pb_res_to_client',
    prepare: f => recordDamage(f),
    input: () => ({ tid: 1, receive_tid: 1001 }),
    verify: f => assert.deepEqual(stateKind(f, 'fantasy').trials['1'].receive_list, [1001]),
    invalid: f => assert.throws(() => f.service.execute(88928, { tid: 1, receive_tid: 0 }), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(88928, { tid: 1, receive_tid: 1001 }), /threshold/),
    repeatError: /already claimed/
  },
  {
    type: 88929, kind: 'fantasy', name: 'fantasy wear', schema: 'pb_fantasy_act_wear_back',
    prepare: prepareWear,
    input: context => context.input,
    verify: f => assert.notEqual(Number(stateKind(f, 'fantasy').trials['1'].fantasy_equip), 0),
    invalid: f => assert.throws(() => f.service.execute(88929, { tid: 1 }), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(88929, { tid: 1, fantasy_id: { uid: 999999, tid: 1200119 } }), /does not exist/),
    repeatError: null
  },
  {
    type: 88930, kind: 'fantasy', name: 'fantasy bless', schema: 'pb_fantasy_act_wear_bless_back',
    prepare: prepareBless,
    input: context => context.input,
    verify: f => assert.equal(stateKind(f, 'fantasy').trials['1'].bless_list.length, 1),
    invalid: f => assert.throws(() => f.service.execute(88930, { tid: 1 }), /not selected/),
    insufficient: f => assert.throws(() => f.service.execute(88930, { tid: 1, bless_list: [] }), /not selected/),
    repeatError: null
  },
  {
    type: 88931, kind: 'fantasy', name: 'fantasy copy', schema: 'pb_fantasy_equip_act_trial',
    prepare: f => addBareEquipment(f, 1200119),
    input: () => 1,
    verify: f => assert.notEqual(Number(stateKind(f, 'fantasy').trials['1'].fantasy_equip), 0),
    invalid: f => assert.throws(() => f.service.execute(88931, {}), /Invalid/),
    insufficient: f => { clearInventory(f); assert.throws(() => f.service.execute(88931, 1), /No source/); },
    repeatError: /already selected/
  },
  {
    type: 88932, kind: 'fantasy', name: 'fantasy task', schema: 'pb_fantasy_act_task_reward_rev',
    prepare: f => f.store.transaction(model => f.service.recordTaskEvent(model, { type: 101, param: 7, count: 1 })),
    input: () => ({ task_id: 1, task_records: Buffer.from('forged') }),
    verify: f => assert.deepEqual(stateKind(f, 'fantasy').tasks.claimed, [1]),
    invalid: f => assert.throws(() => f.service.execute(88932, {}), /Invalid/),
    insufficient: f => assert.throws(() => f.service.execute(88932, { task_id: 1 }), /not complete/),
    repeatError: /already claimed/
  }
];

function runDefinition(f, definition) {
  const context = definition.prepare?.(f) ?? {};
  const input = definition.input ? definition.input(context) : null;
  return { result: f.service.execute(definition.type, input), context, input };
}

test('table-driven M5 matrix: every command returns its normal response schema', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    const { result } = runDefinition(f, definition);
    assert.equal(result.schema, definition.schema, definition.name);
    assert.ok(result.data.length > 0, definition.name);
  }
});

test('table-driven M5 matrix: every command rejects invalid activity tid with 306', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind, { activityTid: 999 });
    assert.throws(() => f.service.execute(definition.type, null), error => error.code === 306, definition.name);
  }
});

test('table-driven M5 matrix: required and forged parameters fail closed per command', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    definition.invalid(f);
  }
});

test('table-driven M5 matrix: reward qualification or resource insufficiency is server enforced', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    definition.insufficient(f);
  }
});

test('table-driven M5 matrix: closed activity blocks every command before state creation', () => {
  for (const definition of definitions) {
    const calls = [];
    const f = createHarness(test, definition.kind, {
      assertOpen: context => { calls.push(context); return false; }
    });
    assert.throws(() => f.service.execute(definition.type, null), error => error.code === 305, definition.name);
    assert.equal(f.store.state().fantasyActState, undefined, definition.name);
    assert.equal(calls.length, 1, definition.name);
  }
});

test('table-driven M5 matrix: repeated commands persist once or remain idempotent', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    const { context, input } = runDefinition(f, definition);
    if (definition.repeatError) {
      assert.throws(() => f.service.execute(definition.type, input), definition.repeatError, definition.name);
    } else {
      assert.equal(f.service.execute(definition.type, input).schema, definition.schema, definition.name);
    }
    definition.verify(f);
    void context;
  }
});

test('table-driven M5 matrix: SQLite write failure rolls back every command', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    const context = definition.prepare?.(f) ?? {};
    const input = definition.input ? definition.input(context) : null;
    const before = f.store.state();
    f.store.inspect(db => db.exec(`
      CREATE TRIGGER m5_fail_roles BEFORE INSERT ON roles
      BEGIN SELECT RAISE(ABORT, 'intentional sqlite failure'); END;
    `));
    assert.throws(() => f.service.execute(definition.type, input), /intentional sqlite failure/, definition.name);
    assert.deepEqual(f.store.state(), before, definition.name);
  }
});

test('table-driven M5 matrix: every command result survives restart', () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    runDefinition(f, definition);
    f.reopen();
    definition.verify(f);
  }
});

const workerSource = `
  const { parentPort, workerData } = require('node:worker_threads');
  Promise.all([
    import(workerData.storeUrl), import(workerData.codecUrl), import(workerData.tablesUrl),
    import(workerData.demigodUrl), import(workerData.fantasyUrl), import(workerData.fantasyTablesUrl)
  ]).then(([{ createGameStore }, { createGameCodec }, { readGameTables }, demigodModule, fantasyModule, tableModule]) => {
    const barrier = new Int32Array(workerData.barrier);
    Atomics.add(barrier, 0, 1);
    Atomics.notify(barrier, 0);
    while (Atomics.load(barrier, 0) < 2) Atomics.wait(barrier, 0, 0, 5000);
    if (workerData.workerIndex === 1) {
      while (Atomics.load(barrier, 1) < 1) Atomics.wait(barrier, 1, 0, 5000);
    }
    const codec = createGameCodec(), tables = readGameTables();
    const seed = () => ({ version: 1, roleId: 100001, serverId: 1, createdAt: workerData.openedAt,
      modules: workerData.modules, rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'),
      guides: {}, lineups: null });
    const store = createGameStore({ databasePath: workerData.databasePath, seed, codec, serverOpenedAt: workerData.openedAt });
    Atomics.add(barrier, 1, 1);
    Atomics.notify(barrier, 1);
    while (Atomics.load(barrier, 1) < 2) Atomics.wait(barrier, 1, 0, 5000);
    try {
      const common = {
        store, codec, tables, fantasyTables: tableModule.loadFantasyActTables(),
        activityTid: workerData.activityTid, assertOpen: () => true, marblesRandom: () => 0,
        taskDefinitions: new Map([[1, { tid: 1, type: 101, count: 1, param: 7, award: [[101500, 100]] }]])
      };
      const service = workerData.kind === 'fantasy'
        ? fantasyModule.createFantasyEquipActService(common)
        : demigodModule.createDemigodActService(common);
      const result = service.execute(workerData.type, workerData.input);
      parentPort.postMessage({ ok: true, schema: result.schema });
    } catch (error) {
      parentPort.postMessage({ ok: false, code: error.code, message: error.message });
    } finally { store.close(); }
  }).catch(error => parentPort.postMessage({ ok: false, message: error.stack }));
`;

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: data });
    let message = null, settled = false;
    worker.once('message', value => { message = value; });
    worker.once('error', reject);
    worker.once('exit', code => {
      if (settled) return;
      settled = true;
      if (message) resolve(message);
      else reject(new Error(`M5 worker exited without a result: ${code}`));
    });
  });
}

test('table-driven M5 matrix: two concurrent commands preserve each command invariant', async () => {
  for (const definition of definitions) {
    const f = createHarness(test, definition.kind);
    const context = definition.prepare?.(f) ?? {};
    const input = definition.input ? definition.input(context) : null;
    f.close();
    const data = {
      kind: definition.kind, type: definition.type, input,
      activityTid: definition.kind === 'demigod' ? 102001 : 74001,
      databasePath: f.databasePath, openedAt,
      modules: modules(),
      storeUrl: new URL('../storage/game-store.mjs', import.meta.url).href,
      codecUrl: new URL('../protocol/game-codec.mjs', import.meta.url).href,
      tablesUrl: new URL('../config/game-tables.mjs', import.meta.url).href,
      demigodUrl: new URL('../game/demigod-act-service.mjs', import.meta.url).href,
      fantasyUrl: new URL('../game/fantasy-equip-act-service.mjs', import.meta.url).href,
      fantasyTablesUrl: new URL('../game/fantasy-act-tables.mjs', import.meta.url).href
    };
    const barrier = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    const results = await Promise.all([
      runWorker({ ...data, barrier, workerIndex: 0 }),
      runWorker({ ...data, barrier, workerIndex: 1 })
    ]);
    if (definition.repeatError) {
      assert.equal(results.filter(result => result.ok).length, 1, `${definition.name}: ${JSON.stringify(results)}`);
      assert.equal(results.filter(result => !result.ok).length, 1, `${definition.name}: ${JSON.stringify(results)}`);
    } else {
      assert.equal(results.every(result => result.ok), true, `${definition.name}: ${JSON.stringify(results)}`);
    }
    f.reopen();
    definition.verify(f);
  }
});
