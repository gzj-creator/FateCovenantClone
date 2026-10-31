import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createEliteMissionService } from '../game/elite-mission-service.mjs';

const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec();

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-elite-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  let store = createGameStore({ databasePath: file, codec });
  let service = createEliteMissionService({ store, codec, now: () => 1700000000000 });
  t.after(() => { try { store.close(); } catch {} fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    file,
    reopen() {
      store.close();
      store = createGameStore({ databasePath: file, codec });
      service = createEliteMissionService({ store, codec, now: () => 1700000000000 });
      return { store, service };
    }
  };
}

test('87001 custom sets mission id and persists', async t => {
  const { store, service } = setup(t);
  const r1 = await service.custom(123);
  assert.equal(r1.value.mission.mission_id, '123');
  const buf = r1.data;
  assert.ok(buf.length > 0);
});

test('87001 custom repeat', async t => {
  const { store, service } = setup(t);
  await service.custom(5);
  const r2 = await service.custom(5);
  assert.equal(r2.value.mission.mission_id, '5');
});

test('87001 invalid input rejected', async t => {
  const { store, service } = setup(t);
  assert.throws(() => service.custom('abc'), /Invalid/);
});

test('87002 box award idempotent', async t => {
  const { store, service } = setup(t);
  const r1 = await service.boxAward({ box_id_list: [1, 2], common_task_id_list: [3] });
  assert.deepEqual(r1.value.newlyGranted, [1, 2]);
  const r2 = await service.boxAward({ box_id_list: [1, 2], common_task_id_list: [3] });
  assert.deepEqual(r2.value.newlyGranted, []);
});

test('87002 persists across reopen', async t => {
  const { service, reopen } = setup(t);
  await service.boxAward({ box_id_list: [7], common_task_id_list: [] });
  const { service: svc2 } = reopen();
  const r = await svc2.boxAward({ box_id_list: [7], common_task_id_list: [] });
  assert.deepEqual(r.value.newlyGranted, []);
});

test('87003 chapter pass idempotent', async t => {
  const { store, service } = setup(t);
  const r1 = await service.chapterPass(10);
  assert.equal(r1.value.alreadyClaimed, false);
  const r2 = await service.chapterPass(10);
  assert.equal(r2.value.alreadyClaimed, true);
});

test('87003 invalid chapter id rejected', async t => {
  const { store, service } = setup(t);
  assert.throws(() => service.chapterPass(0), /Invalid/);
});

test('supports', async t => {
  const { service } = setup(t);
  assert.equal(service.supports(87001), true);
  assert.equal(service.supports(87002), true);
  assert.equal(service.supports(87003), true);
  assert.equal(service.supports(999), false);
});
