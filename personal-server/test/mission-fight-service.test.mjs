import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
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

test('ordinary mission fight commits at start and 207 replays without duplicate progress', t => {
  const env = setup(t);
  assert.equal(missionModule(env.store).mission_id, '20205');
  const passCount = Number(missionModule(env.store).pass_count?.count ?? 0);
  const next = 30201;
  const result = env.service.execute(201, fightRequest(next));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.final_result, 1);
  assert.equal(response.report.finish, true);
  assert.equal(response.report.tid, '301');
  // TID_FIGHT_TYPE_MISSION = 1. Type 3 is TID_FIGHT_TYPE_PEAK_TOWER and turns on
  // the client's four-team / five-battle multi-fight layout.
  assert.equal(Number(response.report.type), 1);
  assert.equal(response.report.battle_list.length, 1);
  const battle = response.report.battle_list[0];
  assert.equal(battle.fighter_list.length, 7);
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 1).map(unit => unit.role ?? '0'), ['0', '2010101', '2010201', '1020601', '2020601']);
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 2).map(unit => unit.role), ['9002100', '9002600']);
  assert.equal(Number(battle.atk_team_index), 1);
  assert.equal(Number(battle.def_team_index), 1);
  assert.ok(battle.fighter_list.every(unit => Number(unit.team_index) === 1));
  assert.equal(Number(battle.atk_brief_lineup.team_list[0].team_index), 1);
  assert.equal(Number(battle.def_brief_lineup.team_list[0].team_index), 1);
  // role_type 3 is CaptainFighter (an artifact-based VirtualFighter), not a
  // player hero. Ordinary heroes stay 1 and NPCs stay 2.
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 1).map(unit => Number(unit.role_type)), [3, 1, 1, 1, 1]);
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 2).map(unit => Number(unit.role_type)), [2, 2]);
  assert.deepEqual(battle.fighter_list.filter(unit => unit.team === 1 && Number(unit.role_type) === 3).map(unit => unit.ability_list.length), [0]);
  assert.ok(battle.fighter_list.filter(unit => unit.team === 1 && Number(unit.role_type) === 1).every(unit => unit.ability_list.length > 0));
  assert.ok(battle.fighter_list.filter(unit => Number(unit.role_type) !== 3).every(unit => {
    const attrs = new Map(unit.init_attr.map(attr => [Number(attr.type), Number(attr.value)]));
    return attrs.get(67) === 500 && attrs.get(180) === 1000;
  }));
  assert.equal(Number(battle.fighter_list.find(unit => Number(unit.role_type) === 3).style), Number(battle.fighter_list.find(unit => Number(unit.role_type) === 1).style));
  assert.deepEqual(battle.atk_brief_lineup.team_list[0].fighter_list.map(unit => unit.tid), ['2010101', '2010201', '1020601', '2020601']);
  assert.deepEqual(battle.def_brief_lineup.team_list[0].fighter_list.map(unit => unit.tid), ['9002100', '9002600']);
  assert.ok(battle.over_round >= 1);
  assert.ok(battle.action_list.length > 3);
  const actionMessages = actions(response.report);
  assert.deepEqual(actionMessages.slice(0, 5).map(value => value.proto), [107, 101, 106, 116, 102]);
  assert.equal(actionMessages.at(-1).proto, 104);
  const decodeAction = (index, schema) => codec.unpack(schema, Buffer.from(actionMessages[index].bin, 'base64'));
  const attackers = battle.fighter_list.filter(unit => unit.team === 1 && Number(unit.role_type) === 1);
  const defenders = battle.fighter_list.filter(unit => unit.team === 2);
  const beforeActions = actionMessages.map((value, index) => value.proto === 101 ? decodeAction(index, 'pb_fat_action_before') : null).filter(Boolean);
  assert.deepEqual(
    [...new Set(beforeActions.filter(value => attackers.some(unit => Number(unit.id) === value.src_id)).map(value => value.src_id))].sort((a, b) => a - b),
    attackers.map(unit => Number(unit.id)).sort((a, b) => a - b)
  );
  assert.ok(beforeActions.every(value => value.id > 0));
  assert.ok(beforeActions.every(value => value.aim_list.length > 0));
  assert.ok(beforeActions.every(value => value.ab_tid !== '0'));
  assert.ok(beforeActions.every(value => value.type === 1 || value.type === 2));
  assert.ok(beforeActions.some(value => value.type === 2));
  assert.ok(beforeActions.filter(value => value.type === 1).every(value => String(value.ab_tid).startsWith('1')));
  assert.ok(beforeActions.filter(value => value.type === 2).every(value => String(value.ab_tid).startsWith('2')));
  assert.ok(beforeActions.filter(value => value.type === 2).every(value => {
    const unit = battle.fighter_list.find(candidate => Number(candidate.id) === value.src_id);
    return unit && unit.ability_list.map(Number).includes(Number(value.ab_tid));
  }));
  const graceActive = beforeActions.find(value => value.src_id === 103 && value.type === 2);
  assert.ok(graceActive, 'TID_GRACE must reach her active skill');
  assert.deepEqual([...graceActive.aim_list], defenders.map(unit => Number(unit.id)));
  const graceDamage = actionMessages
    .map((value, index) => value.proto === 106 ? decodeAction(index, 'pb_fat_harm') : null)
    .filter(Boolean)
    .find(value => value.id === graceActive.id);
  assert.deepEqual(graceDamage.harm_list.map(value => Number(value.aim_id)), defenders.map(unit => Number(unit.id)));
  assert.ok(beforeActions.some(value => value.assist_list.length > 0));
  const angerSyncs = actionMessages.map((value, index) => value.proto === 116 ? decodeAction(index, 'pb_fat_attr_sync') : null).filter(Boolean);
  assert.ok(angerSyncs.length >= beforeActions.length);
  assert.ok(angerSyncs.every(value => value.attr_list.length > 0 && value.attr_list.every(attr => Number(attr.attr_type) === 67)));
  const finalHit = actionMessages.map((value, index) => value.proto === 106 ? decodeAction(index, 'pb_fat_harm') : null).filter(Boolean).at(-1);
  assert.ok(finalHit.harm_list.length > 0);
  assert.deepEqual(defenders.map(unit => Number(unit.final_hp ?? 0)), defenders.map(() => 0));
  const deaths = actionMessages.map((value, index) => value.proto === 105 ? decodeAction(index, 'pb_fat_fighter_die') : null).filter(Boolean);
  assert.deepEqual(
    [...new Set(deaths.map(value => value.aim_id).filter(id => defenders.some(unit => Number(unit.id) === id)))].sort((a, b) => a - b),
    defenders.map(unit => Number(unit.id)).sort((a, b) => a - b)
  );
  const roundReady = actionMessages.map((value, index) => value.proto === 107 ? decodeAction(index, 'pb_fat_round_ready') : null).filter(Boolean);
  assert.deepEqual(roundReady.map(value => value.round), Array.from({ length: battle.over_round }, (_, index) => index + 1));
  const roundOver = actionMessages.map((value, index) => value.proto === 112 ? decodeAction(index, 'pb_fat_round_over') : null).filter(Boolean);
  assert.deepEqual(roundOver.map(value => value.round), roundReady.map(value => value.round));
  assert.equal(response.stm.result, 1);
  assert.notEqual(response.stm.exception, true);
  const settlement = codec.unpack('mission_to_client', Buffer.from(response.stm.stm_data, 'base64'));
  const advanced = 30202;
  assert.equal(settlement.mission.mission_id, String(advanced));
  assert.equal(settlement.fight_result, '1');
  assert.equal(settlement.res.changes.length, 0);
  assert.equal(missionModule(env.store).mission_id, String(advanced));
  assert.equal(Number(missionModule(env.store).pass_count?.count ?? 0), passCount + 1);
  const replay = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  const settlementResponse = codec.unpack('pb_fight_settlement_response', replay.data);
  assert.equal(settlementResponse.stm.result, 1);
  assert.deepEqual(Buffer.from(settlementResponse.stm.stm_data, 'base64'), Buffer.from(response.stm.stm_data, 'base64'));
  assert.equal(missionModule(env.store).mission_id, String(advanced));
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
  // A repeated delivery of the same 207 must return the same settlement without incrementing twice.
  const duplicate = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.deepEqual(duplicate.data, replay.data);
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
  env.reopen();
  assert.equal(missionModule(env.store).mission_id, String(advanced));
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
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

test('mission progress committed at start survives the confirmation exit', t => {
  const env = setup(t);
  env.service.execute(201, fightRequest(30201));
  assert.equal(Number(missionModule(env.store).mission_id), 30202);
  assert.equal(env.service.execute(202, codec.pack('pb_fight_exit', { fight_type: 1, is_force: false })).data.length, 0);
  assert.equal(Number(missionModule(env.store).mission_id), 30202);
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
  assert.equal(missionModule(env.store).mission_id, '30202');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '30202');
});

test('30204 uses the documented local pursuer fallback and commits on start', t => {
  const env = setup(t);
  const result = env.service.execute(201, fightRequest(30204, { fight_tid: 304 }));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.tid, '304');
  assert.deepEqual(response.report.battle_list[0].fighter_list.filter(unit => unit.team === 2).map(unit => unit.role), ['9002600', '9002600']);
  assert.equal(missionModule(env.store).mission_id, '30205');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '30205');
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

test('story mission 30205 advances the mission module through req_mission_custom', t => {
  const env = setup(t);
  // Reach the chapter-3 story node through the real fight path so the
  // story-pass precondition is the same one the client has in game.
  for (const mission of [30201, 30202, 30203, 30204]) {
    env.service.execute(201, fightRequest(mission, { fight_tid: 300 + (mission % 100) }));
    env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  }
  assert.equal(missionModule(env.store).mission_id, '30205');
  const passCount = Number(missionModule(env.store).pass_count?.count ?? 0);
  const result = env.service.passStory(30205);
  const response = codec.unpack('pb_mission_rsp', result.data);
  assert.equal(response.mission.mission_id, '40201');
  assert.equal(Number(response.mission.pass_count.count), passCount);
  assert.equal(response.res_change.changes.length, 0);
  assert.ok(!response.res_change.is_overflow);
  assert.equal(missionModule(env.store).mission_id, '40201');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount);

  // Replaying the same story node must not regress or duplicate progress.
  const duplicate = env.service.passStory(30205);
  assert.equal(codec.unpack('pb_mission_rsp', duplicate.data).mission.mission_id, '40201');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount);

  // Battle sections and unknown sections are not story passes.
  assert.throws(() => env.service.passStory(30201), error => error.code === 5);
  assert.throws(() => env.service.passStory(39999), error => error.code === 5);

  // Chapter 4's first journey battle must be playable immediately after the
  // chapter-3 story node is passed.
  const nextBattle = env.service.execute(201, fightRequest(40201, { fight_tid: 401 }));
  assert.equal(codec.unpack('pb_fight_response', nextBattle.data).report.finish, true);
  assert.equal(missionModule(env.store).mission_id, '40202');
});

test('ordinary victory advances the saved and returned cursor to the next journey node', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(8);
    const current = codec.unpack('pb_mission', rawBinary(module.value[0]));
    current.mission_id = '40207';
    module.value[0] = serializedBinary(codec.pack('pb_mission', current));
    const modules = new Map(model.state.modules.value);
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
  const passCount = Number(missionModule(env.store).pass_count?.count ?? 0);

  const result = env.service.execute(201, fightRequest(40208, { fight_tid: 408 }));
  const response = codec.unpack('pb_fight_response', result.data);
  const settlement = codec.unpack('mission_to_client', Buffer.from(response.stm.stm_data, 'base64'));
  assert.equal(settlement.mission.mission_id, '40209');
  assert.equal(missionModule(env.store).mission_id, '40209');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);

  // Re-entering the same battle must not count another clear.
  const repeated = env.service.execute(201, fightRequest(40208, { fight_tid: 408 }));
  const repeatedResponse = codec.unpack('pb_fight_response', repeated.data);
  const repeatedSettlement = codec.unpack('mission_to_client', Buffer.from(repeatedResponse.stm.stm_data, 'base64'));
  assert.equal(repeatedSettlement.mission.mission_id, '40209');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);

  const next = env.service.execute(201, fightRequest(40209, { fight_tid: 409 }));
  const nextResponse = codec.unpack('pb_fight_response', next.data);
  const nextSettlement = codec.unpack('mission_to_client', Buffer.from(nextResponse.stm.stm_data, 'base64'));
  assert.equal(nextSettlement.mission.mission_id, '40210');
  assert.equal(missionModule(env.store).mission_id, '40210');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 2);
});
