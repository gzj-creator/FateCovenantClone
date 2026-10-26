import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';

// Temp database copied from the consistent handoff backup: never the running server database.
const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec();

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fight-'));
  const file = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, file);
  let store = createGameStore({ databasePath: file, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, service: createMissionFightService({ store, codec, playbackEnabled: true }),
    playbackDisabled: () => createMissionFightService({ store, codec }),
    reopen() { store.close(); store = createGameStore({ databasePath: file, codec }); }
  };
}

const missionModule = store => codec.unpack('pb_mission', rawBinary(new Map(store.state().modules.value).get(8).value[0]));
const fightRequest = (mission, extra = {}) => codec.pack('pb_fight_request', {
  fight_tid: 301, stm_type: 1,
  req: codec.pack('mission_fight_req', { mission_id: mission }),
  loc: [{ team_id: 1, loc: [
    { hero_id: '2010101', loc: 6 },
    { hero_id: '2010201', loc: 4 },
    { hero_id: '1020601', loc: 2 },
    { hero_id: '2020601', loc: 5 }
  ] }],
  ...extra
});

const actions = report => report.battle_list[0].action_list.map(bytes => codec.unpack('pb_generic', Buffer.from(bytes, 'base64')));

test('ordinary mission fight settles once, advances the mission module and replays settlement', t => {
  const env = setup(t);
  assert.equal(missionModule(env.store).mission_id, '20205');
  const next = 30201;
  const result = env.service.execute(201, fightRequest(next));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.final_result, 1);
  assert.equal(response.report.finish, true);
  assert.equal(response.report.tid, '301');
  assert.equal(response.report.battle_list.length, 1);
  const battle = response.report.battle_list[0];
  assert.equal(battle.fighter_list.length, 6);
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 1).map(unit => unit.role), ['2010101', '2010201', '1020601', '2020601']);
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 2).map(unit => unit.role), ['9002100', '9002600']);
  assert.deepEqual(battle.atk_brief_lineup.team_list[0].fighter_list.map(unit => unit.tid), ['2010101', '2010201', '1020601', '2020601']);
  assert.deepEqual(battle.def_brief_lineup.team_list[0].fighter_list.map(unit => unit.tid), ['9002100', '9002600']);
  assert.equal(battle.action_list.length, 3);
  const actionMessages = actions(response.report);
  assert.deepEqual(actionMessages.map(value => value.proto), [107, 112, 104]);
  assert.equal(codec.unpack('pb_fat_round_ready', Buffer.from(actionMessages[0].bin, 'base64')).round, 1);
  assert.equal(codec.unpack('pb_fat_round_over', Buffer.from(actionMessages[1].bin, 'base64')).round, 1);
  assert.equal(codec.unpack('pb_fat_battle_over', Buffer.from(actionMessages[2].bin, 'base64')).why, 1);
  assert.equal(response.stm.result, 1);
  assert.notEqual(response.stm.exception, true);
  const settlement = codec.unpack('mission_to_client', Buffer.from(response.stm.stm_data, 'base64'));
  assert.equal(settlement.mission.mission_id, String(next));
  assert.equal(settlement.fight_result, '1');
  assert.equal(settlement.res.changes.length, 0);
  assert.equal(missionModule(env.store).mission_id, String(next));
  env.reopen();
  assert.equal(missionModule(env.store).mission_id, String(next));
  const replay = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  const settlementResponse = codec.unpack('pb_fight_settlement_response', replay.data);
  assert.equal(settlementResponse.stm.result, 1);
  assert.deepEqual(Buffer.from(settlementResponse.stm.stm_data, 'base64'), Buffer.from(response.stm.stm_data, 'base64'));
  // The settled fight is single-use: a second settlement request has nothing pending.
  assert.throws(() => env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 })), error => error.code === 1);
});

test('fight exit acknowledges, report read returns the settled report and progress never regresses', t => {
  const env = setup(t);
  const before = Number(missionModule(env.store).mission_id);
  const result = env.service.execute(201, fightRequest(20201, { loc: [] }));
  assert.equal(codec.unpack('pb_fight_response', result.data).report.finish, true);
  assert.equal(Number(missionModule(env.store).mission_id), before, 'an older mission must not roll progress back');
  const reports = env.service.execute(203, codec.pack('pb_get_fight_report', { fight_id: [] }));
  assert.equal(codec.unpack('pb_fight_report_res', reports.data).report.length, 1);
  assert.equal(env.service.execute(202, codec.pack('pb_fight_exit', { fight_type: 1, is_force: true })).data.length, 0);
});

test('non-mission fights are refused without touching saved state', t => {
  const env = setup(t);
  const before = env.store.state();
  assert.throws(() => env.service.execute(201, fightRequest(30201, { req: Buffer.from([1, 2, 3, 4]) })), error => error.code === 5);
  assert.throws(() => env.service.execute(201, fightRequest(30201, { req: codec.pack('mission_fight_req', {}) })), error => error.code === 5);
  // BOSS/story rows without a configured ordinary enemy list remain refused before state changes.
  assert.throws(() => env.service.execute(201, fightRequest(20205)), error => error.code === 5);
  assert.throws(() => env.service.execute(207, Buffer.alloc(0)), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);
});

test('the real MissionUIMgr encoder only sends mission_id (and auto-fight state)', t => {
  const env = setup(t);
  const next = 30201;
  // Wire shape produced by MissionUIMgr: chapter_tid/section_idx stay at protobuf defaults.
  const wire = (extra = {}) => codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 0,
    req: codec.pack('mission_fight_req', { mission_id: next, ...extra })
  });
  assert.throws(() => env.service.execute(201, wire({ is_assistant: true, boss_tid: 5 })), error => error.code === 5);
  const result = env.service.execute(201, wire({ is_assistant: true }));
  assert.equal(codec.unpack('pb_fight_response', result.data).report.finish, true);
  assert.equal(missionModule(env.store).mission_id, String(next));
});

test('mission fight playback stays disabled until a real action stream exists', t => {
  const env = setup(t);
  const before = env.store.state();
  const next = 30201;
  const wire = codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 0,
    req: codec.pack('mission_fight_req', { mission_id: next })
  });
  assert.throws(() => env.playbackDisabled().execute(201, wire), error => error.code === 5);
  assert.deepEqual(env.store.state(), before);
});
