import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createPermitService } from '../game/permit-service.mjs';
import { createNewAccountModules } from '../game/new-account-state.mjs';
import { gameDayIndex } from '../game/time.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url), 'utf8'));
const PERMIT_ID = 1401;
const PERMIT_PRODUCT = 2000001;
const NOW_SECONDS = Math.floor(Date.UTC(2026, 10, 17, 6, 0, 0) / 1000);

function fixtureModules() {
  return structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]);
}

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: fixtureModules(),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t, { permitTables = tables, prefix = 'fc-permit-repair-' } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const databasePath = path.join(directory, 'game.sqlite');
  let store = createGameStore({ databasePath, seed: fixture, codec });
  const service = createPermitService({ codec, tables: permitTables, now: () => NOW_SECONDS });
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    store,
    service,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed: fixture, codec });
      return store;
    }
  };
}

function permitInfo(store, permitId = PERMIT_ID) {
  const moduleValue = new Map(store.state().modules.value).get(38);
  for (const element of moduleValue.value) {
    const data = codec.unpack('pb_permit_data', rawBinary(element));
    const info = (data.permit_list ?? []).find(row => Number(row.id) === permitId);
    if (info) return info;
  }
  throw new Error(`Permit ${permitId} is missing`);
}

function updatePermitInfo(store, permitId, update) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const moduleValue = modules.get(38);
    if (!moduleValue || !Array.isArray(moduleValue.value)) throw new Error('Permit module is unavailable');
    for (let index = 0; index < moduleValue.value.length; index++) {
      let data;
      try {
        data = codec.unpack('pb_permit_data', rawBinary(moduleValue.value[index]));
      } catch {
        continue;
      }
      const info = (data.permit_list ?? []).find(row => Number(row.id) === permitId);
      if (!info) continue;
      update(info, data);
      moduleValue.value[index] = serializedBinary(codec.pack('pb_permit_data', data));
      modules.set(38, moduleValue);
      model.state.modules.value = [...modules];
      return;
    }
    throw new Error(`Permit ${permitId} is missing from login data`);
  });
}

function tablesWithEmptyAwards(permitId) {
  const levels = new Map(tables.PermitLevel);
  for (const [tid, row] of levels) {
    if (Math.floor(Number(tid) / 1000) !== permitId) continue;
    levels.set(tid, { ...row, free_award: [], permit_award: [] });
  }
  return { ...tables, PermitLevel: levels };
}

test('dynamic open-day experience follows client GetExp by adding persisted buy_exp', t => {
  const env = setup(t, { prefix: 'fc-permit-dynamic-exp-' });
  const currentDay = gameDayIndex(NOW_SECONDS);
  updatePermitInfo(env.store, PERMIT_ID, info => {
    info.open_day = String(currentDay);
    info.buy_exp = '6';
  });

  const result = env.store.transaction(model => env.service.claimFree({ model, permitId: PERMIT_ID }));
  assert.equal(result.experience, 7);
  assert.equal(result.level, 7);
  assert.deepEqual(result.levels.map(row => [Number(row.level), row.receive_free]), [
    [1, true], [2, true], [3, true], [4, true], [5, true], [6, true], [7, true]
  ]);
});

test('resource-backed experience also adds persisted buy_exp before level calculation', t => {
  const permitId = 6701;
  const experienceItem = 811600;
  const env = setup(t, { prefix: 'fc-permit-resource-exp-' });
  updatePermitInfo(env.store, permitId, info => {
    info.buy_exp = '120';
  });

  const result = env.store.transaction(model => {
    model.resources.set(String(experienceItem), {
      tid: String(experienceItem), num: '50', location: [6, 0, 0]
    });
    return env.service.claimFree({ model, permitId });
  });
  assert.equal(result.experience, 170);
  assert.equal(result.level, 1);
  assert.deepEqual(result.levels.map(row => [Number(row.level), row.receive_free]), [[1, true]]);
});

test('empty free and paid reward rows still commit both claim flags and persist', t => {
  const env = setup(t, {
    permitTables: tablesWithEmptyAwards(PERMIT_ID),
    prefix: 'fc-permit-empty-award-'
  });
  updatePermitInfo(env.store, PERMIT_ID, info => {
    info.open_day = String(gameDayIndex(NOW_SECONDS));
  });
  env.store.transaction(model => env.service.purchase({ model, product: tables.Recharge.get(PERMIT_PRODUCT) }));

  const result = env.store.transaction(model => env.service.claimAll({ model, permitId: PERMIT_ID }));
  assert.deepEqual(result.levels.map(row => [Number(row.level), row.receive_free, row.receive_permit]), [[1, true, true]]);
  assert.deepEqual(result.response.levels, result.levels);
  assert.deepEqual(result.response.res.changes, []);
  assert.deepEqual(result.response.permit.levels.map(row => [
    Number(row.level), row.receive_free, row.receive_permit
  ]), [[1, true, true]]);
  assert.throws(
    () => env.store.transaction(model => env.service.claimAll({ model, permitId: PERMIT_ID })),
    error => error.code === 25003
  );

  const reopened = env.reopen();
  const persisted = permitInfo(reopened);
  assert.equal(persisted.levels[0].receive_free, true);
  assert.equal(persisted.levels[0].receive_permit, true);
});

test('new-account permit state resets every account-owned field and compensation marker', () => {
  const modules = new Map(fixtureModules().value);
  const moduleValue = modules.get(38);
  let seeded = false;
  for (let index = 0; index < moduleValue.value.length; index++) {
    let data;
    try {
      data = codec.unpack('pb_permit_data', rawBinary(moduleValue.value[index]));
    } catch {
      continue;
    }
    const info = (data.permit_list ?? []).find(row => Number(row.id) === PERMIT_ID);
    if (!info) continue;
    Object.assign(info, {
      period: 4,
      is_pay: true,
      buy_num: 9,
      is_settle: true,
      levels: [{ level: 7, receive_free: true, receive_permit: true }],
      buy_exp: '1234',
      award_idx: 5,
      is_choose: true,
      is_join_compensate: true
    });
    data.compensate_day = '88';
    data.new_compensate_day = '99';
    moduleValue.value[index] = serializedBinary(codec.pack('pb_permit_data', data));
    seeded = true;
    break;
  }
  assert.equal(seeded, true);

  const fresh = createNewAccountModules({
    modules,
    codec,
    roleName: 'Fresh Permit Account',
    now: NOW_SECONDS * 1000
  });
  const resetEntry = fresh.modules.get(38);
  const expectedOpenDay = String(gameDayIndex(NOW_SECONDS));
  let sawTarget = false;
  for (const element of resetEntry.value) {
    if (rawBinary(element).length === 0) continue;
    const data = codec.unpack('pb_permit_data', rawBinary(element));
    assert.equal(Number(data.compensate_day ?? 0), 0);
    assert.equal(Number(data.new_compensate_day ?? 0), 0);
    for (const info of data.permit_list ?? []) {
      assert.equal(Number(info.period ?? 0), 0);
      assert.equal(String(info.open_day), expectedOpenDay);
      assert.equal(Boolean(info.is_pay), false);
      assert.equal(Number(info.buy_num ?? 0), 0);
      assert.equal(Boolean(info.is_settle), false);
      assert.deepEqual(info.levels, []);
      assert.equal(Number(info.buy_exp ?? 0), 0);
      assert.equal(Number(info.award_idx ?? 0), 0);
      assert.equal(Boolean(info.is_choose), false);
      assert.equal(Boolean(info.is_join_compensate), false);
      if (Number(info.id) === PERMIT_ID) sawTarget = true;
    }
  }
  assert.equal(sawTarget, true);
});
