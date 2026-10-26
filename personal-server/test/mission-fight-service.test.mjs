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
    get store() { return store; }, service: createMissionFightService({ store, codec }),
    reopen() { store.close(); store = createGameStore({ databasePath: file, codec }); }
  };
}

const missionModule = store => codec.unpack('pb_mission', rawBinary(new Map(store.state().modules.value).get(8).value[0]));
const fightRequest = (mission, extra = {}) => codec.pack('pb_fight_request', {
  fight_tid: 20152, stm_type: 1,
  req: codec.pack('mission_fight_req', { chapter_tid: 202, section_idx: 6, mission_id: mission }),
  loc: [{ team_id: 1, loc: [{ hero_id: '2020601', loc: 1 }] }],
  ...extra
});

test('ordinary mission fight settles once, advances the mission module and replays settlement', t => {
  const env = setup(t);
  const before = Number(missionModule(env.store).mission_id);
  assert.ok(before > 0);
  const next = before + 1;
  const result = env.service.execute(201, fightRequest(next));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.final_result, 1);
  assert.equal(response.report.finish, true);
  assert.equal(response.report.battle_list.length, 0);
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
  const result = env.service.execute(201, fightRequest(before - 1));
  assert.equal(codec.unpack('pb_fight_response', result.data).report.finish, true);
  assert.equal(Number(missionModule(env.store).mission_id), before, 'an older mission must not roll progress back');
  const reports = env.service.execute(203, codec.pack('pb_get_fight_report', { fight_id: [] }));
  assert.equal(codec.unpack('pb_fight_report_res', reports.data).report.length, 1);
  assert.equal(env.service.execute(202, codec.pack('pb_fight_exit', { fight_type: 1, is_force: true })).data.length, 0);
});

test('non-mission fights are refused without touching saved state', t => {
  const env = setup(t);
  const before = env.store.state();
  assert.throws(() => env.service.execute(201, fightRequest(20206, { req: Buffer.from([1, 2, 3, 4]) })), error => error.code === 5);
  assert.throws(() => env.service.execute(201, fightRequest(20206, { req: codec.pack('mission_fight_req', {}) })), error => error.code === 5);
  assert.throws(() => env.service.execute(207, Buffer.alloc(0)), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);
});
