import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityReadService } from '../game/activity-read-service.mjs';

const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec(), tables = readGameTables();

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fishing-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  let store = createGameStore({ databasePath: file, codec });
  const make = () => createActivityReadService({ codec, store, tables, now: () => 1793300000000 });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath: file, codec });
      service = make();
    }
  };
}

function unlock(service, actId, mapId) {
  return service.execute(110305, codec.pack('pb_fishing_act_common_req', { act_id: actId, value: mapId }));
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('activity read endpoints answer with empty evidenced lists', t => {
  const env = setup(t);
  const record = env.service.execute(110308, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_fishing_act_get_record_rsp', record.data), { record_list: [] });
  const top = env.service.execute(110303, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_fishing_act_get_top_rsp', top.data), { high_score_list: [] });
  const times = env.service.execute(116004, codec.pack('pb_help_up_get_times_req', { act_id: 92144 }));
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', times.data).times ?? 0), 0);
});

test('unlocks a configured fishing island, grants its first reward and persists', t => {
  const env = setup(t);
  const beforeDiamond = resource(env.store, 101500), beforeItem = resource(env.store, 830902);

  const result = unlock(env.service, 1074001, 1);
  const response = codec.unpack('pb_fishing_act_data_res', result.data);
  assert.equal(response.data.act_id, '1074001');
  assert.deepEqual(response.data.unlock_map_list, ['1']);
  assert.deepEqual(response.data.high_size_list, []);
  assert.deepEqual(response.data.weather_list, []);
  assert.deepEqual(response.data.have_rod_list, []);
  assert.equal(response.data.book_state, 'AA==');
  assert.equal(response.data.level_state, 'AA==');
  assert.equal(response.data.progress_state, 'AA==');
  assert.deepEqual(response.res.changes.map(change => [change.tid, change.diff_num]), [
    ['830902', '500'],
    ['101500', '500']
  ]);
  assert.equal(resource(env.store, 101500), beforeDiamond + 500n);
  assert.equal(resource(env.store, 830902), beforeItem + 500n);

  const stored = env.store.inspect(db => db.prepare('SELECT * FROM fishing_activity_state').get());
  assert.equal(stored.act_id, 1074001);
  assert.deepEqual(JSON.parse(stored.unlock_map_list_json), [1]);

  const repeated = codec.unpack('pb_fishing_act_data_res', unlock(env.service, 1074001, 1).data);
  assert.deepEqual(repeated.data.unlock_map_list, ['1']);
  assert.deepEqual(repeated.res.changes, []);
  assert.equal(resource(env.store, 101500), beforeDiamond + 500n);
  assert.equal(resource(env.store, 830902), beforeItem + 500n);

  // Version 11 reuses island version 6, so its first map is 601 rather than 1.
  const latestBeforeDiamond = resource(env.store, 101500);
  const latest = codec.unpack('pb_fishing_act_data_res', unlock(env.service, 1074011, 601).data);
  assert.deepEqual(latest.data.unlock_map_list, ['601']);
  assert.equal(latest.res.changes.find(change => change.tid === '101500').diff_num, '500');
  assert.equal(resource(env.store, 101500), latestBeforeDiamond + 500n);

  env.reopen();
  const reopened = codec.unpack('pb_fishing_act_data_res', unlock(env.service, 1074001, 1).data);
  assert.deepEqual(reopened.data.unlock_map_list, ['1']);
  assert.deepEqual(reopened.res.changes, []);
  assert.equal(resource(env.store, 101500), beforeDiamond + 1000n);
  assert.equal(env.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 7);
  assert.ok(env.store.inspect(db => db.prepare('SELECT name FROM migrations WHERE name=?').get('fishing-activity-state-v6')));
});

test('rejects invalid, wrong-version, locked and unsupported-reward unlocks atomically', t => {
  const env = setup(t);
  const rejects = (fn, code) => assert.throws(fn, error => error.code === code);
  rejects(() => unlock(env.service, 89001, 1), 1);
  rejects(() => unlock(env.service, 1074001, 999), 1);
  rejects(() => unlock(env.service, 1074001, 201), 1);
  rejects(() => unlock(env.service, 1074001, 2), 311);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM fishing_activity_state').get().n), 0);

  // Version 2, map 204 has a hero reward that the generic resource granter cannot
  // represent. The whole unlock must fail instead of marking the island unlocked.
  unlock(env.service, 1074002, 201);
  env.store.inspect(db => db.prepare("UPDATE fishing_activity_state SET score='100000' WHERE act_id=1074002").run());
  rejects(() => unlock(env.service, 1074002, 204), 5);
  const row = env.store.inspect(db => db.prepare('SELECT unlock_map_list_json,score FROM fishing_activity_state WHERE act_id=1074002').get());
  assert.deepEqual(JSON.parse(row.unlock_map_list_json), [201]);
  assert.equal(row.score, '100000');
  assert.equal(env.store.read().resources.has('4040301'), false);
});

test('unverified fishing and help-up mutations remain refused', t => {
  const env = setup(t);
  for (const type of [110301, 110302, 110311, 110304, 110306, 110307, 110309, 110310, 116001, 116002, 116003]) {
    assert.equal(env.service.supports(type), true);
    assert.throws(() => env.service.execute(type, Buffer.alloc(0)), error => error.code === 5);
  }
  assert.equal(env.service.supports(201), false);
  assert.equal(env.service.supports(110312), false);
});
