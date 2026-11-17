import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readTriMatchTables } from '../config/trimatch-tables.mjs';
import { createTriMatchService } from '../game/trimatch-service.mjs';
import { createTriMatchFightService } from '../game/trimatch-fight-service.mjs';
import { createTriMatchPvpService } from '../game/trimatch-pvp-service.mjs';
import { createTriMatchTowerService } from '../game/trimatch-tower-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameError } from '../game/hero-progression.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const triTables = readTriMatchTables();
const HERO_TIDS = [...triTables.heroes.keys()].slice(0, 4);
const FIXED_NOW = 1700000000123;
const FIRST_LONG_UID = '9007199254740992';
const SECOND_LONG_UID = '9007199254740993';
const INT64_MAX = '9223372036854775807';

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-trimatch-int64-', now: () => FIXED_NOW });
  fixture.store.transaction((model, db) => grantResources(
    model, HERO_TIDS.map(tid => [tid, 1]), gameTables, { codec, db, now: () => FIXED_NOW }
  ));

  const make = () => {
    const lineup = createTriMatchService({
      store: fixture.store, codec, tables: triTables, gameTables, now: () => FIXED_NOW
    });
    const fight = createTriMatchFightService({
      store: fixture.store, codec, tables: triTables, gameTables, now: () => FIXED_NOW
    });
    const pvp = createTriMatchPvpService({
      store: fixture.store, codec, tables: triTables, gameTables, now: () => FIXED_NOW
    });
    const tower = createTriMatchTowerService({
      store: fixture.store, codec, tables: triTables, gameTables, now: () => FIXED_NOW
    });
    return { lineup, fight, pvp, tower };
  };

  let services = make();
  const roleId = fixture.store.state().roleId;
  services.lineup.loginPayload(roleId);
  return {
    get store() { return fixture.store; },
    get services() { return services; },
    roleId,
    reopen() {
      fixture.open();
      services = make();
      return services;
    }
  };
}

function copyFight(db, roleId, fromUid, toUid) {
  const inserted = db.prepare(`INSERT INTO trimatch_fight
    SELECT role_id, ?, fight_tid, fight_type, is_pve, lineup_type, board_tid, board_json, red_team_json,
      blue_team_json, atk_power, def_power, atk_role_id, def_role_id, result, attempt, round_id, phase_id,
      remaining_ms, status, created_at, updated_at
    FROM trimatch_fight WHERE role_id=? AND fight_uid=?`).run(toUid, roleId, fromUid);
  assert.equal(inserted.changes, 1);
  db.prepare(`INSERT INTO trimatch_fight_action
    SELECT role_id, ?, seq, action_type, payload FROM trimatch_fight_action
    WHERE role_id=? AND fight_uid=?`).run(toUid, roleId, fromUid);
}

test('triple match fight UID allocation, retry, give-up and report stay exact above 2^53', async t => {
  const env = setup(t);
  const first = await env.services.fight.execute(115001, { fight_tid: '1', enemy_id: '0' });
  assert.equal(String(first.value.fightUid), '1');
  env.store.inspect(db => copyFight(db, env.roleId, '1', FIRST_LONG_UID));

  const next = await env.services.fight.execute(115001, { fight_tid: '1', enemy_id: '0' });
  assert.equal(String(next.value.fightUid), SECOND_LONG_UID);
  assert.equal(codec.unpack('pb_triple_match_fight_response', next.data).id, SECOND_LONG_UID);

  const record = await env.services.fight.execute(115006, [FIRST_LONG_UID]);
  assert.equal(String(record.value.fightUid), FIRST_LONG_UID);
  assert.equal(codec.unpack('pb_triple_match_fight_report', record.data).fight_id, FIRST_LONG_UID);

  const retried = await env.services.fight.execute(115003, [FIRST_LONG_UID]);
  assert.equal(String(retried.value.fightUid), FIRST_LONG_UID);
  assert.equal(codec.unpack('pb_triple_match_fight_response', retried.data).id, FIRST_LONG_UID);

  const giveUp = await env.services.fight.execute(115005, [FIRST_LONG_UID]);
  assert.equal(String(giveUp.value.fightUid), FIRST_LONG_UID);
  const expected = [[FIRST_LONG_UID, 'given_up'], ['1', 'running'], [SECOND_LONG_UID, 'running']]
    .sort((left, right) => BigInt(left[0]) < BigInt(right[0]) ? -1 : 1);
  assert.deepEqual(
    env.store.inspect(db => db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid, status
      FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid`).all(env.roleId)
      .map(row => [row.fight_uid, row.status])),
    expected
  );

  env.reopen();
  assert.deepEqual(
    env.services.fight.state(env.roleId).map(row => [String(row.fight_uid), row.status]),
    expected
  );

  env.store.inspect(db => copyFight(db, env.roleId, '1', INT64_MAX));
  const before = env.store.inspect(db => ({
    count: db.prepare('SELECT COUNT(*) AS total FROM trimatch_fight WHERE role_id=?').get(env.roleId).total,
    max: db.prepare('SELECT CAST(MAX(fight_uid) AS TEXT) AS uid FROM trimatch_fight WHERE role_id=?').get(env.roleId).uid
  }));
  await assert.rejects(
    () => env.services.fight.execute(115001, { fight_tid: '1', enemy_id: '0' }),
    error => error instanceof GameError && error.code === 305
  );
  assert.deepEqual(env.store.inspect(db => ({
    count: db.prepare('SELECT COUNT(*) AS total FROM trimatch_fight WHERE role_id=?').get(env.roleId).total,
    max: db.prepare('SELECT CAST(MAX(fight_uid) AS TEXT) AS uid FROM trimatch_fight WHERE role_id=?').get(env.roleId).uid
  })), before);
});

test('triple match PVP keeps adjacent fight IDs and last settlement ID exact after reopen', async t => {
  const env = setup(t);
  const actId = 1304001;
  for (const fightUid of [FIRST_LONG_UID, SECOND_LONG_UID]) {
    env.store.transaction((model, db) => env.services.pvp.recordFight(model, db, {
      actId, fightUid, fightTid: '1', result: 1, atkScoreChange: 1,
      atkRoleId: env.roleId, defRoleId: 0, atkPower: 1, defPower: 1
    }));
  }

  const reports = async service => codec.unpack(
    'pb_tri_match_pvp_get_report_list_rsp',
    (await service.execute(121003, { act_id: actId })).data
  );
  let decoded = await reports(env.services.pvp);
  assert.deepEqual(decoded.report_list.map(row => row.fight_uid), [SECOND_LONG_UID, FIRST_LONG_UID]);

  env.reopen();
  decoded = await reports(env.services.pvp);
  assert.deepEqual(decoded.report_list.map(row => row.fight_uid), [SECOND_LONG_UID, FIRST_LONG_UID]);
  assert.equal(
    String(env.services.pvp.state(env.roleId).find(row => row.act_id === actId).last_settlement_fight_id),
    SECOND_LONG_UID
  );
});

test('triple match tower settlement stores fight IDs beyond 2^53 exactly across reopen', async t => {
  const env = setup(t);
  const missions = [...triTables.towerMissions.values()].sort((left, right) => Number(left.index) - Number(right.index));
  assert.ok(missions.length >= 2);
  for (const [index, fightUid] of [FIRST_LONG_UID, SECOND_LONG_UID].entries()) {
    const result = env.store.transaction((model, db) => env.services.tower.settle(model, db, {
      fightUid, fightTid: missions[index].fight_tid, fightType: missions[index].fight_tid,
      result: 1, powers: '1', fighters: []
    }));
    assert.equal(result.won, true);
  }

  env.reopen();
  const state = env.services.tower.state(env.roleId).find(row => row.act_id === 1302001);
  assert.equal(String(state.last_settlement_fight_id), SECOND_LONG_UID);
  assert.deepEqual(
    env.store.inspect(db => db.prepare(`SELECT CAST(fight_uid AS TEXT) AS fight_uid
      FROM trimatch_tower_clear WHERE role_id=? ORDER BY tower`).all(env.roleId).map(row => row.fight_uid)),
    [FIRST_LONG_UID, SECOND_LONG_UID]
  );
});
