import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readHunterArenaTables } from '../config/arena-tables.mjs';
import { readOverallPvpTables } from '../config/overall-pvp-tables.mjs';
import { createHunterArenaService } from '../game/hunter-arena-service.mjs';
import { createOverallPvpService } from '../game/overall-pvp-service.mjs';
import { readSwapArenaTables } from '../config/arena-tables.mjs';
import { createSwapArenaService } from '../game/swap-arena-service.mjs';

const codec = createGameCodec();
const NOW_SECONDS = 1794756200;
const NOW_MS = NOW_SECONDS * 1000;
const FIRST_LONG_UID = '9007199254740992';
const SECOND_LONG_UID = '9007199254740993';

test('Hunter arena reports keep adjacent UIDs exact through login, lock and reopen', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-hunter-int64-', now: () => NOW_MS });
  const make = () => createHunterArenaService({
    store: fixture.store,
    codec,
    tables: readHunterArenaTables(),
    serverOpenedAt: NOW_SECONDS - 8 * 86400,
    now: () => NOW_MS
  });
  let service = make();
  const roleId = fixture.store.state().roleId;
  service.loginPayload();
  fixture.store.inspect(db => {
    const insert = db.prepare(`INSERT INTO hunter_arena_reports
      (role_id,fight_uid,score_change,fight_stamp,enemy_id,is_atk,is_win,locked,old_score,new_score)
      VALUES(?,?,?,?,?,?,?,?,?,?)`);
    insert.run(roleId, FIRST_LONG_UID, 1, NOW_SECONDS - 2, '9007199254740994', 1, 1, 0, 1100, 1101);
    insert.run(roleId, SECOND_LONG_UID, -1, NOW_SECONDS - 1, '9007199254740995', 0, 0, 0, 1101, 1100);
  });

  let login = codec.unpack('pb_hunter_arena_login', service.loginPayload());
  assert.deepEqual(login.hunter_arena.fight_reports.map(row => row.fight_uid), [SECOND_LONG_UID, FIRST_LONG_UID]);
  assert.deepEqual(login.hunter_arena.fight_reports.map(row => row.enemy), ['9007199254740995', '9007199254740994']);

  const locked = await service.execute(84009, { fight_uid: SECOND_LONG_UID, lock: true });
  assert.equal(String(locked.value.fightUid), SECOND_LONG_UID);
  assert.deepEqual(fixture.store.inspect(db => db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid, locked
    FROM hunter_arena_reports WHERE role_id=? ORDER BY fight_uid`).all(roleId).map(row => [row.fight_uid, row.locked])), [
    [FIRST_LONG_UID, 0],
    [SECOND_LONG_UID, 1]
  ]);

  fixture.open();
  service = make();
  login = codec.unpack('pb_hunter_arena_login', service.loginPayload());
  assert.deepEqual(login.hunter_arena.fight_reports.map(row => [row.fight_uid, Boolean(row.locked)]), [
    [SECOND_LONG_UID, true],
    [FIRST_LONG_UID, false]
  ]);
});

test('Overall PvP reports keep adjacent UIDs exact through encoding and reopen', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-overall-pvp-int64-', now: () => NOW_MS });
  const tables = readOverallPvpTables();
  const make = () => createOverallPvpService({
    store: fixture.store,
    codec,
    tables,
    now: () => NOW_MS
  });
  let service = make();
  for (const [fightUid, fightTime] of [[FIRST_LONG_UID, NOW_SECONDS - 2], [SECOND_LONG_UID, NOW_SECONDS - 1]]) {
    const result = service.recordReport({
      fightUid,
      fightTime,
      stage: 2,
      atkRoleId: '100001',
      defRoleId: '100002',
      result: 1,
      atkBefore: 100,
      atkAfter: 101,
      defBefore: 101,
      defAfter: 100,
      defIsBot: false,
      otherData: Buffer.alloc(0)
    });
    assert.equal(String(result.fightUid), String(fightUid));
  }

  let response = await service.execute(101112);
  assert.deepEqual(codec.unpack('pb_overall_pvp_report_obj', response.data).report_list.map(row => row.fight_uid), [
    SECOND_LONG_UID,
    FIRST_LONG_UID
  ]);

  fixture.open();
  service = make();
  response = await service.execute(101112);
  assert.deepEqual(codec.unpack('pb_overall_pvp_report_obj', response.data).report_list.map(row => row.fight_uid), [
    SECOND_LONG_UID,
    FIRST_LONG_UID
  ]);
});

test('Swap arena reports keep adjacent uint64 IDs exact through encoding and reopen', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-swap-arena-int64-', now: () => NOW_MS });
  const make = () => createSwapArenaService({
    store: fixture.store,
    codec,
    tables: readSwapArenaTables(),
    serverOpenedAt: NOW_SECONDS - 8 * 86400,
    now: () => NOW_MS
  });
  let service = make();
  const roleId = fixture.store.state().roleId;
  service.loginPayload();
  fixture.store.inspect(db => {
    const insert = db.prepare(`INSERT INTO swap_arena_reports
      (role_id,fight_id,before_rank,after_rank,fight_time,attack_role_id,def_role_id,self_fight_result,enemy_rank)
      VALUES(?,?,?,?,?,?,?,?,?)`);
    insert.run(roleId, FIRST_LONG_UID, 10, 9, NOW_SECONDS - 2, FIRST_LONG_UID, '9007199254740994', 1, 9);
    insert.run(roleId, SECOND_LONG_UID, 9, 8, NOW_SECONDS - 1, '9007199254740995', SECOND_LONG_UID, 0, 8);
  });

  const assertReports = raw => {
    const reports = codec.unpack('pb_swap_arena_fight_report_data', raw).fight_report_list;
    assert.deepEqual(reports.map(row => [row.fight_id, row.time, row.attack_role_id, row.def_role_id]), [
      [SECOND_LONG_UID, String(NOW_SECONDS - 1), '9007199254740995', SECOND_LONG_UID],
      [FIRST_LONG_UID, String(NOW_SECONDS - 2), FIRST_LONG_UID, '9007199254740994']
    ]);
  };

  let response = await service.execute(4035);
  assertReports(response.data);

  fixture.open();
  service = make();
  response = await service.execute(4035);
  assertReports(response.data);
});
