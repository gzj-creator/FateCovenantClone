import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createMonthPermitService } from '../game/month-permit-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const ACT_ID = 1004012;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function monthPermitInfo(store) {
  const moduleValue = new Map(store.state().modules.value).get(183);
  for (const element of moduleValue.value) {
    const login = codec.unpack('pb_act_role_login', rawBinary(element));
    for (const entry of login.data_list ?? []) {
      if (typeof entry.module_login_data !== 'string') continue;
      const wrapped = Buffer.from(entry.module_login_data, 'base64');
      if (wrapped.length < 6 || wrapped[0] !== 0x83 || wrapped[1] !== 0x6d) continue;
      const message = codec.unpack('pb_month_permit_login_back', wrapped.subarray(6));
      const info = message.month_permit_data?.month_permit_list?.find(row => Number(row.id) === ACT_ID);
      if (info) return info;
    }
  }
  throw new Error('Active month permit fixture not found');
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-month-permit-task-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  const store = createGameStore({ databasePath, seed, codec });
  const service = createMonthPermitService({ codec, tables });
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { store, service };
}

test('claiming a month permit task adds it to task_get with timestamp and grants exp', t => {
  const { store, service } = setup(t);

  // Use a task ID that exists in MonthPermitTask table
  const taskId = '101';
  const result = store.transaction(model => service.claimTask({
    model,
    request: { activity_id: ACT_ID, task_id_list: [taskId] }
  }));

  assert.equal(result.actId, String(ACT_ID));
  assert.deepEqual(result.claimedTasks, [taskId]);
  assert.ok(result.expGain > 0, 'Should have exp gain');
  assert.equal(result.response.month_permit_info.id, String(ACT_ID));

  const info = monthPermitInfo(store);
  assert.ok(info.task_get.length > 0, 'task_get should not be empty');
  const claimedTask = info.task_get.find(t => String(t.tid) === taskId);
  assert.ok(claimedTask, 'Claimed task should be in task_get');
  assert.ok(claimedTask.get_time > 0, 'get_time should be set');
  assert.ok(BigInt(info.buy_exp_num) > 0n, 'buy_exp_num should increase');
});

test('claiming multiple tasks adds all to task_get', t => {
  const { store, service } = setup(t);

  const taskIds = ['101', '102'];
  const result = store.transaction(model => service.claimTask({
    model,
    request: { activity_id: ACT_ID, task_id_list: taskIds }
  }));

  assert.equal(result.claimedTasks.length, 2);
  assert.deepEqual(result.claimedTasks, taskIds);

  const info = monthPermitInfo(store);
  assert.equal(info.task_get.length, 2);
});

test('claiming an already claimed task throws error 310', t => {
  const { store, service } = setup(t);

  const taskId = '101';
  store.transaction(model => service.claimTask({
    model,
    request: { activity_id: ACT_ID, task_id_list: [taskId] }
  }));

  assert.throws(
    () => store.transaction(model => service.claimTask({
      model,
      request: { activity_id: ACT_ID, task_id_list: [taskId] }
    })),
    { code: 310 }
  );
});

test('claiming with empty task list throws error 1', t => {
  const { store, service } = setup(t);

  assert.throws(
    () => store.transaction(model => service.claimTask({
      model,
      request: { activity_id: ACT_ID, task_id_list: [] }
    })),
    { code: 1 }
  );
});

test('task_get persists across database reopen', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-month-permit-task-persist-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  let service = createMonthPermitService({ codec, tables });

  const taskId = '101';
  store.transaction(model => service.claimTask({
    model,
    request: { activity_id: ACT_ID, task_id_list: [taskId] }
  }));

  const infoBefore = monthPermitInfo(store);
  assert.equal(infoBefore.task_get.length, 1);

  store.close();
  store = createGameStore({ databasePath, seed, codec });
  service = createMonthPermitService({ codec, tables });

  const infoAfter = monthPermitInfo(store);
  assert.equal(infoAfter.task_get.length, 1);
  assert.equal(String(infoAfter.task_get[0].tid), taskId);

  store.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
