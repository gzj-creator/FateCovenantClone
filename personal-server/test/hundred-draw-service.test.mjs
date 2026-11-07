import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createHundredDrawService } from '../game/hundred-draw-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const fixedNow = 1793300000000;

function setup(t, random = () => 0.999999, serviceCodec = codec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-draw-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Hundred Draw Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec });
  let service = createHundredDrawService({ store, codec: serviceCodec, tables, now: () => fixedNow, random });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen(nextRandom = random) {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec });
      service = createHundredDrawService({ store, codec, tables, now: () => fixedNow, random: nextRandom });
    }
  };
}

const run = (service, type, value) => service.execute(type, value);

test('117001 consumes the pool item, records cumulative draws and persists the result', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  const result = run(e.service, 117001, { act_id: 1102001, times: 10 });
  assert.equal(result.value.act_data.cumulative_draw_times, '10');
  assert.equal(result.value.act_data.received_process_tid_list.length, 0);
  assert.equal(e.store.read().resources.get('835802').num, '990');
  e.reopen();
  const after = run(e.service, 117001, { act_id: 1102001, times: 1 });
  assert.equal(after.value.act_data.cumulative_draw_times, '11');
  assert.equal(e.store.read().resources.get('835802').num, '989');
});

test('117002 enforces the draw threshold, grants once and survives a reopen', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  assert.throws(() => run(e.service, 117002, { act_id: 1102001, tid_list: [10101] }), error => error.code === 311);
  run(e.service, 117001, { act_id: 1102001, times: 50 });
  const claimed = run(e.service, 117002, { act_id: 1102001, tid_list: [10101] });
  assert.equal(claimed.value.act_data.received_process_tid_list[0], '10101');
  assert.equal(claimed.value.res.changes.find(row => row.tid === '101500').diff_num, '500');
  assert.throws(() => run(e.service, 117002, { act_id: 1102001, tid_list: [10101] }), error => error.code === 310);
  e.reopen();
  assert.throws(() => run(e.service, 117002, { act_id: 1102001, tid_list: [10101] }), error => error.code === 310);
});

test('117003 selects a devolve target and 117005 reads the recorded marquee', async t => {
  const e = setup(t, () => 0);
  e.store.transaction(model => grantResources(model, [[835802, 10], [836302, 10]], tables));
  const selected = run(e.service, 117003, { act_id: 1102009, target_tid: 5040701 });
  assert.equal(selected.value.act_data.select_target_tid, '5040701');
  assert.throws(() => run(e.service, 117003, { act_id: 1102009, target_tid: 123 }), error => error.code === 1);
  run(e.service, 117001, { act_id: 1102001, times: 1 });
  const marquee = run(e.service, 117005, { act_id: 1102001, start_range: 1, end_range: 10 });
  assert.equal(marquee.value.data.data.length, 1);
  assert.equal(marquee.value.data.data[0].target_tid, '5040701');
});

test('117004 claims a hero star award once when the owned hero meets the target star', async t => {
  const e = setup(t);
  e.store.transaction(model => {
    model.heroInfo.hero_list.push({ tid: '5040701', uid: '5040701', level: 1, star: 10, star_progress: 0, breakthrough_level: 0, quality: 70 });
  });
  const result = run(e.service, 117004, { act_id: 1102001, tid_list: [10104] });
  assert.equal(result.value.act_data.received_star_tid_list[0], '10104');
  assert.equal(result.value.res.changes.find(row => row.tid === '6031200').diff_num, '2');
  assert.throws(() => run(e.service, 117004, { act_id: 1102001, tid_list: [10104] }), error => error.code === 310);
});

test('117004 rejects a star award before the target hero reaches the configured star', async t => {
  const e = setup(t);
  e.store.transaction(model => {
    model.heroInfo.hero_list.push({ tid: '5040701', uid: '5040701', level: 1, star: 5, star_progress: 0, breakthrough_level: 0, quality: 70 });
  });
  assert.throws(() => run(e.service, 117004, { act_id: 1102001, tid_list: [10104] }), error => error.code === 311);
});

test('117001 rolls costs and state back when response encoding fails', async t => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_hundred_act_draw_rsp') throw new Error('forced hundred-draw response failure');
      return codec.pack(name, value);
    }
  };
  const e = setup(t, () => 0.999999, failingCodec);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  assert.throws(
    () => run(e.service, 117001, { act_id: 1102001, times: 1 }),
    /forced hundred-draw response failure/
  );
  assert.equal(e.store.read().resources.get('835802').num, '1000');
  e.reopen();
  assert.equal(run(e.service, 117001, { act_id: 1102001, times: 1 }).value.act_data.cumulative_draw_times, '1');
});

test('117001 rolls costs and state back when SQLite rejects the state write', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  e.store.inspect(db => db.exec(`
    CREATE TRIGGER hundred_draw_state_abort
    BEFORE INSERT ON hundred_draw_act_state
    BEGIN SELECT RAISE(ABORT, 'forced hundred-draw state failure'); END;
  `));
  assert.throws(
    () => run(e.service, 117001, { act_id: 1102001, times: 1 }),
    /forced hundred-draw state failure/
  );
  assert.equal(e.store.read().resources.get('835802').num, '1000');
  e.store.inspect(db => db.exec('DROP TRIGGER hundred_draw_state_abort'));
  assert.equal(run(e.service, 117001, { act_id: 1102001, times: 1 }).value.act_data.cumulative_draw_times, '1');
});
