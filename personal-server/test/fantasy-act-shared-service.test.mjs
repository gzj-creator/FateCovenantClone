import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  createFantasyActSharedService,
  normalizeEtfScalar,
  serverDay
} from '../game/fantasy-act-shared-service.mjs';
import { loadFantasyActTables } from '../game/fantasy-act-tables.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const m5Tables = loadFantasyActTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const openedAt = 1792789200;
const alwaysOpen = () => true;

export function fixture(t, extra = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-act-shared-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let store, service, closed = false;
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  });
  function open() {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    service = createFantasyActSharedService({
      store, codec, tables, fantasyTables: m5Tables, demigodActTid: 102001, fantasyActTid: 74001,
      assertOpen: alwaysOpen, marblesRandom: () => 0, ...extra
    });
    closed = false;
  }
  open();
  t.after(() => { if (!closed) store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, get service() { return service; },
    reopen() { if (!closed) store.close(); open(); }
  };
}

export function giveEquip(f, tid, options = {}) {
  return f.store.transaction(model => {
    const current = f.service.inventory.read(model);
    const equip = f.service.inventory.create(current, tid, options);
    f.service.inventory.save(model, current);
    return equip;
  });
}

export function damage(f, kind, tid, value) {
  f.store.transaction(model => f.service.recordTrialDamage(model, kind, tid, value));
}

export function state(f) {
  return f.store.state().fantasyActState;
}

test('ETF scalar normalization accepts all wire encodings and rejects forged values', () => {
  assert.equal(normalizeEtfScalar(7), 7n);
  assert.equal(normalizeEtfScalar('7'), 7n);
  assert.equal(normalizeEtfScalar([7]), 7n);
  assert.equal(normalizeEtfScalar({ value: '7' }), 7n);
  assert.equal(normalizeEtfScalar({ low: 7, high: 0 }), 7n);
  assert.throws(() => normalizeEtfScalar(-1), /Invalid/);
  assert.throws(() => normalizeEtfScalar([1, 2]), /Invalid/);
});

test('server day uses the five oclock Asia/Shanghai reset', () => {
  assert.equal(serverDay(0), 0);
  assert.equal(serverDay(75599), 0);
  assert.equal(serverDay(75600), 1);
});

test('trial reward requires recorded damage, is not repeated, and survives restart', () => {
  const f = fixture(test);
  assert.throws(() => f.service.claimTrialReward('demigod', { tid: 1, receive_tid: 1001 }), /threshold/);
  damage(f, 'demigod', 1, 500000);
  const result = f.service.claimTrialReward('demigod', { tid: 1, receive_tid: 1001 });
  assert.equal(result.schema, 'pb_res_to_client');
  assert.ok(result.data.length > 0);
  assert.throws(() => f.service.claimTrialReward('demigod', { tid: 1, receive_tid: 1001 }), /already claimed/);
  assert.throws(() => f.service.claimTrialReward('demigod', { tid: 2, receive_tid: 1001 }), /Unknown/);
  f.reopen();
  assert.deepEqual(state(f).kinds.demigod.trials['1'].receive_list, [1001]);
});

test('daily marbles can be claimed once per day and big award requires its threshold', () => {
  let seconds = 1792789200;
  const f = fixture(test, { now: () => seconds });
  const first = f.service.claimDailyMarbles('demigod');
  assert.equal(first.schema, 'pb_res_to_client');
  assert.throws(() => f.service.claimDailyMarbles('demigod'), /already claimed/);
  assert.throws(() => f.service.claimBigMarbles('demigod'), /threshold/);
  seconds += 86400;
  assert.equal(f.service.claimDailyMarbles('demigod').marbles.award_count, 2);
  assert.equal(state(f).kinds.demigod.daily.marbles.award_count, 2);
});

test('wish is server validated and persisted as a decimal u64', () => {
  const f = fixture(test);
  const row = [...tables.DemigodDrawWish.values()][0];
  const result = f.service.setWish('demigod', { low: Number(row.tid ?? row.tid_ ?? 0), high: 0 });
  assert.equal(result.schema, 'etf');
  assert.throws(() => f.service.setWish('demigod', 999999999), /Unknown/);
});

test('draw progress comes from the M3 event count, never from client values', () => {
  const f = fixture(test);
  f.store.transaction(model => f.service.recordDraw(model, 'demigod', { count: 3, awards: [] }));
  assert.equal(state(f).kinds.demigod.draw.version_draw_num, '3');
  assert.throws(() => f.store.transaction(model => f.service.recordDraw(model, 'demigod', { count: 0 })), /invalid/);
});

test('demigod draw awards are sequential, threshold gated, idempotent and transactional', () => {
  const f = fixture(test);
  assert.throws(() => f.service.claimDemoGodDrawAward(), /No demigod draw award/);
  f.store.transaction(model => f.service.recordDraw(model, 'demigod', { count: 10 }));
  const result = f.service.claimDemoGodDrawAward();
  assert.equal(result.value.draw_award_id, 1001);
  assert.equal(result.schema, 'pb_demigod_act_draw_award_back');
  assert.throws(() => f.service.claimDemoGodDrawAward(), /No demigod draw award/);
});

test('invalid trial ids and receive ids are rejected', () => {
  const f = fixture(test);
  assert.throws(() => f.service.claimTrialReward('demigod', { tid: 0, receive_tid: 1001 }), /Invalid/);
  damage(f, 'demigod', 1, 999999);
  assert.throws(() => f.service.claimTrialReward('demigod', { tid: 1, receive_tid: 99999 }), /Unknown/);
  assert.throws(() => f.service.wearTrialEquipment('demigod', {
    tid: 1, fantasy_id: { uid: 999999, tid: 1200119 }
  }), /does not exist/);
});

test('unknown activity tid fails closed and version switching preserves lifetime only', () => {
  const closed = fixture(test, { demigodActTid: 999 });
  assert.throws(() => closed.service.ensureState('demigod'), /Public demigod act_tid/);

  const f = fixture(test);
  f.store.transaction(model => f.service.recordDraw(model, 'demigod', { count: 2 }));
  assert.throws(() => f.service.ensureState('demigod', 2), /Public demigod act_tid/);
  f.store.transaction(model => f.service.recordDraw(model, 'demigod', { count: 3 }, 2));
  const internalSwitch = f.service.ensureState('demigod', 102002);
  assert.equal(internalSwitch.act_tid, '102002');
  assert.equal(internalSwitch.business_version, 2);
  assert.equal(internalSwitch.draw.version_draw_num, '3');
  assert.equal(internalSwitch.lifetime.draw_num, '5');
  const switched = f.service.ensureState('demigod', 102002);
  assert.equal(switched.act_tid, '102002');
  assert.equal(switched.business_version, 2);
  assert.equal(switched.draw.version_draw_num, '3');
  assert.equal(switched.lifetime.draw_num, '5');
  const back = f.service.ensureState('demigod', 102001);
  assert.equal(back.act_tid, '102001');
  assert.equal(back.business_version, 1);
  assert.equal(back.draw.version_draw_num, '0');
  assert.equal(back.lifetime.draw_num, '5');
});

test('public commands reject internal business versions while server events map them', () => {
  const f = fixture(test);
  for (const [kind, version, activityTid] of [
    ['fantasy', 1, 74001], ['fantasy', 5, 74005],
    ['demigod', 1, 102001], ['demigod', 38, 102038]
  ]) {
    assert.throws(() => f.service.ensureState(kind, version), /Public .* act_tid/);
    const eventState = f.store.transaction(model => {
      f.service.recordDraw(model, kind, { count: 1 }, version);
      return model.state.fantasyActState.kinds[kind];
    });
    assert.equal(eventState.act_tid, String(activityTid));
    assert.equal(eventState.business_version, version);
  }
});

test('closed activity blocks server events and login serialization before state creation', () => {
  const operations = [
    ['recordDraw', f => f.store.transaction(model => f.service.recordDraw(model, 'fantasy', { count: 1 }))],
    ['recordTrialDamage', f => f.store.transaction(model => f.service.recordTrialDamage(model, 'fantasy', 1, 1))],
    ['recordTaskEvent', f => f.store.transaction(model => f.service.recordTaskEvent(model, 'fantasy', { type: 1, param: 1, count: 1 }))],
    ['ensureState', f => f.service.ensureState('fantasy')],
    ['serializeLoginBlocks', f => f.service.serializeLoginBlocks('fantasy')]
  ];
  for (const [name, operation] of operations) {
    const calls = [];
    const f = fixture(test, { assertOpen: context => { calls.push(context); return false; } });
    assert.throws(() => operation(f), error => error.code === 305, name);
    assert.equal(f.store.state().fantasyActState, undefined, name);
    assert.equal(calls.length, 1, name);
    assert.equal(calls[0].event, name === 'recordDraw' ? 'record_draw'
      : name === 'recordTrialDamage' ? 'record_trial_damage'
        : name === 'recordTaskEvent' ? 'record_task_event'
          : name === 'serializeLoginBlocks' ? 'serialize_login_blocks' : 'ensure_state');
  }
});

test('response encoding failure rolls back trial reward state completely', () => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_res_to_client') throw new Error('intentional response encoding failure');
      return codec.pack(name, value);
    }
  };
  const f = fixture(test, { codec: failingCodec });
  damage(f, 'demigod', 1, 500000);
  assert.throws(() => f.service.claimTrialReward('demigod', { tid: 1, receive_tid: 1001 }), /intentional/);
  assert.deepEqual(state(f).kinds.demigod.trials['1'].receive_list, []);
});

test('equipment held by one activity cannot be worn by another', () => {
  const f = fixture(test, { fantasyActTid: 74001 });
  const equip = giveEquip(f, 1200119, { star: 5 });
  f.service.wearTrialEquipment('demigod', { tid: 1, fantasy_id: { uid: equip.uid, tid: equip.tid } });
  assert.equal(state(f).kinds.demigod.trials['1'].fantasy_equip, String(equip.uid));
  assert.equal(f.service.activityReferences(f.store.read()).some(ref => ref.uid === equip.uid), true);
  assert.throws(() => f.service.wearTrialEquipment('fantasy', {
    tid: 1, fantasy_id: { uid: equip.uid, tid: equip.tid }
  }), /still referenced/);
});

test('concurrent duplicate trial rewards commit exactly once', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-act-concurrent-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  });
  let mainStore = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
  const mainService = createFantasyActSharedService({
    store: mainStore, codec, tables, fantasyTables: m5Tables,
    demigodActTid: 102001, fantasyActTid: 74001, assertOpen: alwaysOpen
  });
  mainStore.transaction(model => mainService.recordTrialDamage(model, 'demigod', 1, 500000));
  mainStore.close();

  const workerSource = `
    const { parentPort, workerData } = require('node:worker_threads');
    Promise.all([
      import(workerData.storeUrl), import(workerData.codecUrl),
      import(workerData.tablesUrl), import(workerData.serviceUrl), import(workerData.fantasyTablesUrl)
    ]).then(([{ createGameStore }, { createGameCodec }, { readGameTables }, { createFantasyActSharedService }, { loadFantasyActTables }]) => {
      const barrier = new Int32Array(workerData.barrier);
      const codec = createGameCodec();
      const data = workerData;
      let store;
      let initialized = false;
      try {
        if (data.workerIndex === 1) {
          if (Atomics.wait(barrier, 0, 0, 10000) === 'timed-out') throw new Error('Timed out waiting for database initialization');
          if (Atomics.load(barrier, 0) !== 1) throw new Error('Database initialization failed in the first worker');
        }
        store = createGameStore({ databasePath: data.databasePath, codec, serverOpenedAt: data.openedAt,
          seed: () => ({ version: 1, roleId: 100001, serverId: 1, createdAt: data.openedAt,
            modules: data.modules, rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'),
            guides: {}, lineups: null }) });
        if (data.workerIndex === 0) {
          Atomics.store(barrier, 0, 1);
          Atomics.notify(barrier, 0);
        }
        initialized = true;
        const service = createFantasyActSharedService({
          store, codec, tables: readGameTables(), fantasyTables: loadFantasyActTables(),
          demigodActTid: 102001, fantasyActTid: 74001, assertOpen: () => true
        });
        Atomics.add(barrier, 1, 1);
        Atomics.notify(barrier, 1);
        if (Atomics.wait(barrier, 1, 1, 10000) === 'timed-out') throw new Error('Timed out waiting for concurrent claim barrier');
        service.claimTrialReward('demigod', { tid: 1, receive_tid: 1001 });
        parentPort.postMessage({ ok: true, workerIndex: data.workerIndex });
      } catch (error) {
        if (!initialized && data.workerIndex === 0 && Atomics.load(barrier, 0) === 0) {
          Atomics.store(barrier, 0, -1);
          Atomics.notify(barrier, 0);
        }
        parentPort.postMessage({ ok: false, workerIndex: data.workerIndex, code: error.code, message: error.message });
      } finally { store?.close(); }
    }).catch(error => parentPort.postMessage({ ok: false, message: error.stack }));
  `;
  const barrier = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
  const run = workerIndex => new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: {
      databasePath, openedAt, barrier, workerIndex,
      modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
      storeUrl: new URL('../storage/game-store.mjs', import.meta.url).href,
      codecUrl: new URL('../protocol/game-codec.mjs', import.meta.url).href,
      tablesUrl: new URL('../config/game-tables.mjs', import.meta.url).href,
      serviceUrl: new URL('../game/fantasy-act-shared-service.mjs', import.meta.url).href,
      fantasyTablesUrl: new URL('../game/fantasy-act-tables.mjs', import.meta.url).href
    }});
    let message = null, settled = false;
    worker.once('message', value => { message = value; });
    worker.once('error', reject);
    worker.once('exit', code => {
      if (settled) return;
      settled = true;
      if (message) resolve(message);
      else reject(new Error('Concurrency worker exited without a result: ' + code));
    });
  });
  try {
    const results = await Promise.all([run(0), run(1)]);
    assert.equal(results.filter(result => result.ok).length, 1, JSON.stringify(results));
    assert.equal(results.filter(result => result.code === 307).length, 1, JSON.stringify(results));
    mainStore = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    const stored = mainStore.state().fantasyActState.kinds.demigod.trials['1'].receive_list;
    assert.deepEqual(stored, [1001]);
  } finally {
    try { mainStore?.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
