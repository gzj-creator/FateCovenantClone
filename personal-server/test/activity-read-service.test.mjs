import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createActivityReadService } from '../game/activity-read-service.mjs';

const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec();
const tables = readGameTables();
const SERVER_OPENED_AT = 1792789200;
const DAY = 86400;

function setup(t, initialSeconds = SERVER_OPENED_AT + 3600) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fishing-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  // The handoff database is also used for manual acceptance and can carry a
  // later server-opening timestamp. Normalize the disposable fixture so this
  // test remains deterministic without changing the shared evidence file.
  const fixture = new DatabaseSync(file);
  const update = fixture.prepare('UPDATE roles SET metadata_json=? WHERE role_id=?');
  for (const row of fixture.prepare('SELECT role_id,metadata_json FROM roles').all()) {
    const metadata = JSON.parse(row.metadata_json);
    metadata.serverOpenedAt = SERVER_OPENED_AT;
    update.run(JSON.stringify(metadata), row.role_id);
  }
  fixture.close();
  let nowSeconds = initialSeconds;
  const openStore = () => {
    const opened = createGameStore({ databasePath: file, codec, serverOpenedAt: SERVER_OPENED_AT });
    // The saved fixture is already schema v8, so pin its persisted opening time
    // instead of relying on the one-time v7 migration to replace the value.
    opened.transaction(model => { model.state.serverOpenedAt = SERVER_OPENED_AT; });
    return opened;
  };
  let store = openStore();
  const calendar = createActivityCalendar({ tables, serverOpenedAt: SERVER_OPENED_AT, now: () => nowSeconds * 1000 });
  const make = () => createActivityReadService({
    codec,
    store,
    tables,
    calendar,
    now: () => nowSeconds * 1000,
    random: () => 0.5
  });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    setNow(seconds) { nowSeconds = seconds; },
    reopen() {
      store.close();
      store = openStore();
      service = make();
    }
  };
}

function unlock(service, actId, mapId) {
  return service.execute(110305, codec.pack('pb_fishing_act_common_req', { act_id: actId, value: mapId }));
}

function cast(service, actId = 1074003, mapId = 201) {
  return service.execute(110301, codec.pack('pb_fishing_act_rod_req', { act_id: actId, map_id: mapId }));
}

function collect(service, actId = 1074003, isGet = true) {
  return service.execute(110302, codec.pack('pb_fishing_act_get_req', { act_id: actId, is_get: isGet }));
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('unverified fishing and help-up mutations remain refused', t => {
  const env = setup(t);
  for (const type of [110304, 110306, 110307, 110309, 110310, 116001, 116002, 116003]) {
    assert.equal(env.service.supports(type), true);
    assert.throws(() => env.service.execute(type, Buffer.alloc(0)), error => error.code === 5);
  }
  assert.equal(env.service.supports(110301), true);
  assert.equal(env.service.supports(110302), true);
  assert.equal(env.service.supports(110311), true);
  assert.equal(env.service.supports(201), false);
  assert.equal(env.service.supports(110312), false);
});

test('activity read endpoints answer with empty evidenced lists', t => {
  const env = setup(t);
  const record = env.service.execute(110308, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_fishing_act_get_record_rsp', record.data), { record_list: [] });
  const top = env.service.execute(110303, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_fishing_act_get_top_rsp', top.data), { high_score_list: [] });
  const times = env.service.execute(116004, codec.pack('pb_help_up_get_times_req', { act_id: 92144 }));
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', times.data).times ?? 0), 0);
});

test('grants version bait once, unlocks the correct first island and persists', t => {
  const env = setup(t);
  const baitBefore = resource(env.store, 821202);
  const benefit = env.service.ensureActiveFishingBenefits();
  assert.equal(benefit.actId, 1074003);
  assert.equal(benefit.changes.find(change => change.tid === '821202').diff_num, '25');
  assert.equal(resource(env.store, 821202), baitBefore + 25n);
  assert.deepEqual(env.service.ensureActiveFishingBenefits().changes, []);

  const beforeDiamond = resource(env.store, 101500), beforeItem = resource(env.store, 830902);
  const result = unlock(env.service, 1074003, 201);
  const response = codec.unpack('pb_fishing_act_data_res', result.data);
  assert.equal(response.data.act_id, '1074003');
  assert.deepEqual(response.data.unlock_map_list, ['201']);
  assert.deepEqual(response.data.high_size_list, []);
  assert.deepEqual(response.data.weather_list, []);
  assert.deepEqual(response.data.have_rod_list, ['1']);
  assert.equal(response.data.rod, '1');
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
  assert.equal(stored.act_id, 1074003);
  assert.deepEqual(JSON.parse(stored.unlock_map_list_json), [201]);
  assert.equal(stored.rod, '1');

  const repeated = codec.unpack('pb_fishing_act_data_res', unlock(env.service, 1074003, 201).data);
  assert.deepEqual(repeated.data.unlock_map_list, ['201']);
  assert.deepEqual(repeated.res.changes, []);
  assert.equal(resource(env.store, 101500), beforeDiamond + 500n);

  env.reopen();
  const reopened = codec.unpack('pb_fishing_act_data_res', unlock(env.service, 1074003, 201).data);
  assert.deepEqual(reopened.data.unlock_map_list, ['201']);
  assert.deepEqual(reopened.res.changes, []);
  assert.equal(env.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 9);
  assert.ok(env.store.inspect(db => db.prepare('SELECT name FROM migrations WHERE name=?').get('fishing-activity-state-v6')));
  assert.ok(env.store.inspect(db => db.prepare('SELECT name FROM migrations WHERE name=?').get('activity-calendar-server-open-v7')));
  assert.ok(env.store.inspect(db => db.prepare('SELECT name FROM migrations WHERE name=?').get('pet-activity-commerce-v8')));
  assert.ok(env.store.inspect(db => db.prepare('SELECT name FROM migrations WHERE name=?').get('hero-identity-v9')));
  assert.equal(env.store.read().state.serverOpenedAt, SERVER_OPENED_AT);
});

test('batch fishing consumes available bait and records every catch atomically', t => {
  const env = setup(t);
  env.service.ensureActiveFishingBenefits();
  unlock(env.service, 1074003, 201);
  env.store.inspect(db => db.prepare('UPDATE fishing_activity_state SET get_num=20 WHERE act_id=1074003').run());
  env.store.transaction(model => { model.resources.get('821202').num = '10'; });
  const batch = env.service.execute(110311, codec.pack('pb_fishing_act_batch_get_req', {
    act_id: 1074003,
    map_id: 201,
    is_jump_qte: true
  }));
  const response = codec.unpack('pb_fishing_act_batch_get_rsp', batch.data);
  assert.equal(batch.count, 10);
  assert.equal(response.fish_list.length, 10);
  assert.equal(response.data.get_num, '30');
  assert.equal(response.fish_qte_list.every(Boolean), true);
  assert.equal(resource(env.store, 821202), 0n);
  assert.throws(
    () => env.service.execute(110311, codec.pack('pb_fishing_act_batch_get_req', { act_id: 1074003, map_id: 201 })),
    error => error.code === 301
  );
});

test('rejects closed, cross-version, locked and unsupported-reward requests atomically', t => {
  const env = setup(t);
  const rejects = (fn, code) => assert.throws(fn, error => error.code === code);
  rejects(() => unlock(env.service, 89001, 201), 1);
  rejects(() => unlock(env.service, 1074003, 999), 1);
  rejects(() => unlock(env.service, 1074003, 1), 1);
  rejects(() => unlock(env.service, 1074003, 202), 311);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM fishing_activity_state').get().n), 0);

  unlock(env.service, 1074003, 201);
  env.store.inspect(db => db.prepare('UPDATE fishing_activity_state SET score=100000 WHERE act_id=1074003').run());
  rejects(() => unlock(env.service, 1074003, 204), 5);
  const row = env.store.inspect(db => db.prepare('SELECT unlock_map_list_json,score FROM fishing_activity_state WHERE act_id=1074003').get());
  assert.deepEqual(JSON.parse(row.unlock_map_list_json), [201]);
  assert.equal(row.score, '100000');
  assert.equal(env.store.read().resources.has('4040301'), false);

  env.setNow(SERVER_OPENED_AT + 7 * DAY);
  rejects(() => unlock(env.service, 1074003, 201), 309);
  assert.equal(env.service.ensureActiveFishingBenefits().actId, null);
});

test('casts once, collects deterministically and survives reopen', t => {
  const env = setup(t);
  env.service.ensureActiveFishingBenefits();
  unlock(env.service, 1074003, 201);
  const baitBefore = resource(env.store, 821202);

  const castResult = cast(env.service);
  assert.equal(castResult.duplicate, false);
  const waiting = codec.unpack('pb_fishing_act_role_data', castResult.data);
  assert.ok(Number(waiting.wait_fish.fish_id) > 0);
  assert.equal(String(waiting.wait_fish.map_id), '201');
  assert.equal(waiting.weather_list.at(-1).map_id, '201');
  assert.equal(resource(env.store, 821202), baitBefore - 1n);

  const duplicate = cast(env.service);
  assert.equal(duplicate.duplicate, true);
  assert.equal(Number(codec.unpack('pb_fishing_act_role_data', duplicate.data).wait_fish.fish_id), Number(waiting.wait_fish.fish_id));
  assert.equal(resource(env.store, 821202), baitBefore - 1n);

  const collected = codec.unpack('pb_fishing_act_get_rsp', collect(env.service).data);
  assert.equal(collected.data.get_num, '1');
  assert.deepEqual(collected.data.wait_fish, {});
  assert.ok(Number(collected.fish_id) > 0);
  assert.ok(BigInt(collected.score) > 0n);
  assert.throws(() => collect(env.service), error => error.code === 309);

  env.reopen();
  const persisted = env.store.inspect(db => db.prepare('SELECT get_num,wait_fish_json FROM fishing_activity_state WHERE act_id=1074003').get());
  assert.equal(persisted.get_num, '1');
  assert.deepEqual(JSON.parse(persisted.wait_fish_json), {});
  assert.throws(() => collect(env.service), error => error.code === 309);
});
