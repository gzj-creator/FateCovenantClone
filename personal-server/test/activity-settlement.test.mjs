import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createMailService } from '../game/mail-service.mjs';
import { createActivityStore } from '../game/activity-store.mjs';
import { createActivityRuntime } from '../game/activity-runtime.mjs';
import { createActivitySettlementService } from '../game/activity-settlement-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const ROLE_ID = 100001;
const START = 1_000_000;
const WINDOW = Object.freeze({ start: 1_000_100, end: 1_000_200 });

function seed() {
  return {
    version: 1, roleId: ROLE_ID, serverId: 1, createdAt: START,
    modules: structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Settlement Test') }).toString('base64'),
    guides: {}, lineups: null
  };
}

function activityTables() {
  return { ActFrameAct: new Map([[1, { type: 'fixture', duration_day: 1, refer_day: 1, end_time: 0, state: [50], state_end_day: [1] }]]), Activity: new Map() };
}

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-activity-settle-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let clock = 1_000_150;
  let store;
  const pushes = [];

  function open() {
    store = createGameStore({ databasePath, seed, codec, now: () => clock * 1000 });
    const activityStore = createActivityStore({ store, now: () => clock * 1000 });
    const activity = activityTables();
    const calendar = {
      serverOpenedAt: START, activityReferenceOpenedAt: null,
      windowFor: () => ({ ...WINDOW })
    };
    const mail = createMailService({
      store, codec, tables, publish: (type, data, roleId) => pushes.push({ type, data, roleId }),
      now: () => clock, logger: () => {}
    });
    return { activityStore, activity, calendar, mail };
  }

  let services = open();
  t.after(() => {
    try { store?.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory, databasePath, pushes, tables: activityTables(),
    get store() { return store; },
    get activityStore() { return services.activityStore; },
    get calendar() { return services.calendar; },
    get mail() { return services.mail; },
    setClock(value) { clock = value; },
    reopen() { store.close(); services = open(); },
    runtime(handler, { onSettle = null } = {}) {
      const settlement = handler === null ? null : createActivitySettlementService({
        store, activityStore: services.activityStore, mail: services.mail,
        families: handler ? [handler] : [], now: () => clock * 1000
      });
      const runtime = createActivityRuntime({
        store, calendar: services.calendar, tables: activityTables(),
        activityStore: services.activityStore, now: () => clock * 1000,
        onSettle: onSettle ?? (handler ? change => settlement.settle(change) : null),
        onStageChanged: change => settlement?.onStageChanged(change)
      });
      return { runtime, settlement };
    }
  };
}

function handler({ failFreeze = false } = {}) {
  return {
    id: 'fixture', matches: instance => instance.family === 'fixture', currencyPolicy: 'clear_on_settle',
    settle(ctx) {
      ctx.globalStep('rank_snapshot', tx => tx.snapshotRanking('score', [
        { rankNo: 1, roleId: ROLE_ID, score: '42', payload: { source: 'authoritative-state' } }
      ]));
      const roles = ctx.inspect(db => db.prepare('SELECT role_id FROM roles ORDER BY role_id').all()).map(row => Number(row.role_id));
      for (const roleId of roles) {
        ctx.roleStep(roleId, 'pending_mail', tx => {
          tx.personalState();
          tx.savePersonalState({ counters: { draws: 2 }, cumulative: { season: 9 }, claims: { daily: 1 }, currency: { token: 5 } });
          return tx.enqueueMail({ tag: 'pending', awards: [{ tid: 101500, count: 10 }] });
        });
      }
      ctx.globalStep('freeze', () => {
        if (failFreeze) throw new Error('injected crash after mail commit');
      });
    }
  };
}

test('T8 settlement freezes ranks, mails pending rewards, clears declared currency and runs once', t => {
  const e = fixture(t);
  const settlement = createActivitySettlementService({
    store: e.store, activityStore: e.activityStore, mail: e.mail,
    families: [handler()], now: () => 1_000_150_000
  });
  const runtime = createActivityRuntime({
    store: e.store, calendar: e.calendar, tables: activityTables(), activityStore: e.activityStore,
    now: () => 1_000_150_000, onSettle: change => settlement.settle(change)
  });
  runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  e.activityStore.setStage(1, 1, 1, 'running');
  e.setClock(1_000_250);
  runtime.tick(1_000_250);
  assert.equal(e.activityStore.instance(1, 1, 1).stage, 'closed');
  assert.equal(runtime.gate(1, 'operate', 1_000_250), false);
  assert.equal(e.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM game_mails').get().n), 1);
  assert.equal(e.pushes.filter(row => row.type === 900 && row.roleId === ROLE_ID).length, 1);
  const rank = e.activityStore.listRankSnapshot(1, 1, 1, 'score');
  assert.deepEqual(rank.map(row => [row.rank_no, row.role_id, row.score]), [[1, ROLE_ID, '42']]);
  const state = e.activityStore.personalState(1, 1, 1, ROLE_ID);
  assert.deepEqual(state.currency, {});
  assert.ok(state.archived_at);
  runtime.tick(1_000_260);
  assert.equal(e.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM game_mails').get().n), 1);
});

test('T9 restart resumes after the last committed settlement step without duplicate mail', t => {
  const e = fixture(t);
  const { runtime } = e.runtime(handler({ failFreeze: true }));
  runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  e.activityStore.setStage(1, 1, 1, 'running');
  e.setClock(1_000_250);
  runtime.tick(1_000_250);
  assert.equal(e.activityStore.instance(1, 1, 1).stage, 'running');
  assert.equal(e.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM game_mails').get().n), 1);

  e.reopen();
  const resumed = e.runtime(handler());
  resumed.runtime.tick(1_000_260);
  assert.equal(e.activityStore.instance(1, 1, 1).stage, 'closed');
  assert.equal(e.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM game_mails').get().n), 1);
  assert.equal(e.activityStore.settlementDone(1, 1, 1, ROLE_ID, 'pending_mail'), true);
  assert.equal(e.activityStore.settlementDone(1, 1, 1, 0, 'freeze'), true);
});

test('T10 an extend keeps the period, running stage, gate and personal progress', t => {
  const e = fixture(t);
  const { runtime } = e.runtime(null);
  runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  e.activityStore.ensurePersonalState({ serverId: 1, actId: 1, periodNo: 1, roleId: ROLE_ID });
  e.activityStore.savePersonalState({ serverId: 1, actId: 1, periodNo: 1, roleId: ROLE_ID, counters: { progress: 7 }, cumulative: { season: 3 } });
  e.setClock(1_000_250);
  e.activityStore.recordOverride({ serverId: 1, actId: 1, kind: 'extend', endAt: 1_000_400, operator: 'test', reason: 'T10' });
  const result = runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_250);
  assert.deepEqual(result.map(row => [row.actId, row.periodNo, row.stage]), [[1, 1, 'running']]);
  const instance = e.activityStore.instance(1, 1, 1);
  assert.equal(instance.period_no, 1);
  assert.equal(instance.stage, 'running');
  assert.equal(instance.show_until, 1_000_400);
  assert.equal(runtime.gate(1, 'operate', 1_000_300), true);
  assert.deepEqual(e.activityStore.personalState(1, 1, 1, ROLE_ID).counters, { progress: 7 });
});

test('T13 a new period resets counters and carries only explicitly declared cumulative keys', t => {
  const e = fixture(t);
  e.activityStore.ensurePersonalState({ serverId: 1, actId: 1, periodNo: 1, roleId: ROLE_ID });
  e.activityStore.savePersonalState({
    serverId: 1, actId: 1, periodNo: 1, roleId: ROLE_ID,
    counters: { daily: 3 }, cumulative: { season: 7, temporary: 9 },
    claims: { first: 1 }, currency: { token: 4 }
  });
  const state = e.activityStore.ensurePersonalState({
    serverId: 1, actId: 1, periodNo: 2, roleId: ROLE_ID, carryCumulativeKeys: ['season']
  });
  assert.deepEqual(state.counters, {});
  assert.deepEqual(state.cumulative, { season: 7 });
  assert.deepEqual(state.claims, {});
  assert.deepEqual(state.currency, {});
});

test('an activity without a proven family handler remains running and emits no reward', t => {
  const e = fixture(t);
  const { runtime, settlement } = e.runtime(null);
  runtime.synchronizeLogin({ act_list: [{ state_data: { act_id: 1 } }] }, 1_000_150);
  e.activityStore.setStage(1, 1, 1, 'running');
  e.setClock(1_000_250);
  const strict = createActivitySettlementService({ store: e.store, activityStore: e.activityStore, mail: e.mail, families: [], now: () => 1_000_250_000 });
  const strictRuntime = createActivityRuntime({
    store: e.store, calendar: e.calendar, tables: activityTables(), activityStore: e.activityStore,
    now: () => 1_000_250_000, onSettle: change => strict.settle(change)
  });
  strictRuntime.tick(1_000_250);
  assert.equal(e.activityStore.instance(1, 1, 1).stage, 'running');
  assert.equal(strictRuntime.gate(1, 'operate', 1_000_250), false);
  assert.equal(e.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM game_mails').get().n), 0);
});
