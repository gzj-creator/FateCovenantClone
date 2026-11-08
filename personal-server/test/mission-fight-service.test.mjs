import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createMissionFightService, lineupReferenceStats } from '../game/mission-fight-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-fight-', now: options.now });
  let store = fixture.store;
  let service = createMissionFightService({ store, codec, playbackEnabled: true, now: options.now });
  return {
    get store() { return store; },
    get service() { return service; },
    playbackDisabled: () => createMissionFightService({ store, codec, now: options.now }),
    reopen() {
      store = fixture.open();
      service = createMissionFightService({ store, codec, playbackEnabled: true, now: options.now });
    }
  };
}

const missionModule = store => codec.unpack('pb_mission', rawBinary(new Map(store.state().modules.value).get(8).value[0]));
const resourceAmount = (store, tid) => BigInt(store.read().resources.get(String(tid))?.num ?? 0);
const setMission = (store, missionId) => store.transaction(model => {
  const module = new Map(model.state.modules.value).get(8);
  const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
  mission.mission_id = String(missionId);
  module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
  const modules = new Map(model.state.modules.value);
  modules.set(8, module);
  model.state.modules.value = [...modules];
});
const addResource = (store, tid, num, group = 1) => store.transaction(model => {
  const entry = model.resources.size;
  model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
});
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

test('NPC compatibility reference balances every lineup stat instead of copying the top-HP tank', () => {
  const reference = lineupReferenceStats([
    { max_hp: 10000, attack: 100, defense: 500, speed: 80 },
    { max_hp: 5000, attack: 600, defense: 200, speed: 100 },
    { max_hp: 3000, attack: 1400, defense: 100, speed: 120 }
  ]);
  assert.deepEqual(reference, {
    maxHp: 6000,
    attack: 700,
    defense: 267,
    speed: 100
  });
  assert.notEqual(reference.attack, 100, 'the tank attack must not set every enemy attack');
  assert.notEqual(reference.defense, 500, 'the tank defense must not set every enemy defense');
});

test('v14 restores only a missing offline-fixture level-9 stamina row', t => {
  const env = setup(t);
  assert.equal(resourceAmount(env.store, 100012900), 120n);

  env.store.transaction(model => {
    model.resources.get('100012900').num = '0';
  });
  env.reopen();
  assert.equal(resourceAmount(env.store, 100012900), 0n, 'an existing zero must remain zero');

  env.store.inspect(db => {
    db.exec("DELETE FROM resources WHERE tid='100012900'; DELETE FROM migrations WHERE name='offline-fixture-starter-stamina-v14'; PRAGMA user_version=13;");
  });
  env.reopen();
  assert.equal(resourceAmount(env.store, 100012900), 140n);
  const migration = env.store.inspect(db => db.prepare("SELECT source FROM migrations WHERE name='offline-fixture-starter-stamina-v14'").get());
  assert.equal(migration.source, 'missing-level-9-stamina-restored=1; amount=140');
  env.reopen();
  assert.equal(resourceAmount(env.store, 100012900), 140n);
});

test('v13 rolls back only the premature v12 offline-fixture cursor exactly once', t => {
  const env = setup(t);
  assert.equal(missionModule(env.store).mission_id, '20205');
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM migrations WHERE name='mission-cursor-next-v12'").get().n), 1);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM migrations WHERE name='mission-cursor-last-cleared-v13'").get().n), 1);

  // Recreate the schema-12 state written by the erroneous migration. v13 may
  // undo this exact 20205 -> 30201 move because a fabricated cursor has no
  // first-clear reward claim.
  setMission(env.store, 30201);
  env.store.inspect(db => db.exec("BEGIN IMMEDIATE; UPDATE migrations SET source='offline-fixture; repaired-cursors=1' WHERE name='mission-cursor-next-v12'; DELETE FROM migrations WHERE name='mission-cursor-last-cleared-v13'; PRAGMA user_version=12; COMMIT;"));
  env.reopen();
  assert.equal(missionModule(env.store).mission_id, '20205');
  env.reopen();
  assert.equal(missionModule(env.store).mission_id, '20205');
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM migrations WHERE name='mission-cursor-last-cleared-v13'").get().n), 1);
});

test('v13 preserves a legitimate 30201 first clear', t => {
  const env = setup(t);
  setMission(env.store, 30201);
  env.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.pass_count = { flush_time: 0, count: 10 };
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    const modules = new Map(model.state.modules.value);
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
  env.store.inspect(db => {
    db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(env.store.state().roleId, 'mission_first_clear', '30201', new Date(0).toISOString());
    db.exec("BEGIN IMMEDIATE; UPDATE migrations SET source='offline-fixture; repaired-cursors=1' WHERE name='mission-cursor-next-v12'; DELETE FROM migrations WHERE name='mission-cursor-last-cleared-v13'; PRAGMA user_version=12; COMMIT;");
  });
  env.reopen();
  assert.equal(missionModule(env.store).mission_id, '30201');
});

test('v15 keeps stamina in module 8 and rejects the stale full-energy projection', t => {
  const nowSeconds = 1794000000;
  const now = () => nowSeconds * 1000;
  const env = setup(t, { now });
  const stored = env.store.read().resources.get('100012900');
  assert.deepEqual(stored.location, [8, 2, 0]);
  assert.equal(stored.produce_time, nowSeconds);
  assert.equal(env.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 18);

  const module = new Map(env.store.state().modules.value).get(8);
  const loginEnergy = codec.unpack('pb_role_energy_res', rawBinary(module.value[2]));
  assert.deepEqual(loginEnergy.res, [{ tid: '100012900', num: '120', produce_time: nowSeconds }]);
});

test('energy recovery is authoritative and 207 embeds pb_mission_energy_res', t => {
  const nowSeconds = 1794000000;
  const now = () => nowSeconds * 1000;
  const env = setup(t, { now });
  setMission(env.store, 30201);
  env.store.transaction(model => {
    const energy = model.resources.get('100012900');
    energy.num = '139';
    energy.produce_time = nowSeconds - 360;
  });
  const projected = new Map(env.store.state().modules.value).get(8);
  assert.equal(codec.unpack('pb_role_energy_res', rawBinary(projected.value[2])).res[0].num, '140');

  env.service.execute(201, fightRequest(30202));
  const settled = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  const response = codec.unpack('pb_fight_settlement_response', settled.data);
  const mission = codec.unpack('mission_to_client', Buffer.from(response.stm.stm_data, 'base64'));
  const energyChange = mission.res.changes.find(change => change.tid === '100012900');
  assert.equal(energyChange.diff_num, '-5');
  assert.equal(energyChange.new_num, '135');
  assert.ok(energyChange.new_bin?.length);
  assert.deepEqual(codec.unpack('pb_mission_energy_res', Buffer.from(energyChange.new_bin, 'base64')), {
    tid: '100012900', num: '135', produce_time: nowSeconds
  });
  const loginEnergy = codec.unpack('pb_role_energy_res', rawBinary(
    new Map(env.store.state().modules.value).get(8).value[2]
  ));
  assert.deepEqual(loginEnergy.res, [{ tid: '100012900', num: '135', produce_time: nowSeconds }]);
});

test('ordinary mission fight previews at start and commits once at 207', async t => {
  const env = setup(t);
  assert.equal(missionModule(env.store).mission_id, '20205');
  assert.throws(() => env.service.execute(201, fightRequest(30202)), error => error.code === 5);
  const passCount = Number(missionModule(env.store).pass_count?.count ?? 0);
  const beforeRewards = Object.fromEntries(['122802', '201500', '101800'].map(tid => [tid, BigInt(env.store.read().resources.get(tid).num)]));
  const completed = 30201;
  const result = env.service.execute(201, fightRequest(completed));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.final_result, 1);
  assert.equal(response.report.finish ?? false, false);
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
  // A visible round-start passive gets its own complete action window before
  // the first character action.
  assert.deepEqual(actionMessages.slice(0, 6).map(value => value.proto), [107, 101, 109, 102, 101, 106]);
  assert.equal(actionMessages.at(-1).proto, 104);
  const decodeAction = (index, schema) => codec.unpack(schema, Buffer.from(actionMessages[index].bin, 'base64'));
  const angerSyncIds = new Set(actionMessages
    .filter(value => value.proto === 116)
    .map(value => Number(codec.unpack('pb_fat_attr_sync', Buffer.from(value.bin, 'base64')).id)));
  const attackers = battle.fighter_list.filter(unit => unit.team === 1 && Number(unit.role_type) === 1);
  const defenders = battle.fighter_list.filter(unit => unit.team === 2);
  // Character actions carry anger synchronization. Round-start passive action
  // windows do not and are excluded from assertions about character abilities.
  const beforeActions = actionMessages
    .map((value, index) => value.proto === 101 ? decodeAction(index, 'pb_fat_action_before') : null)
    .filter(value => value && angerSyncIds.has(Number(value.id)));
  const attackerIds = new Set(attackers.map(unit => Number(unit.id)));
  const actedAttackerIds = [...new Set(beforeActions.map(value => Number(value.src_id)).filter(id => attackerIds.has(id)))].sort((a, b) => a - b);
  // Correct cumulative star attributes can end this short encounter before a
  // slower lineup member gets a turn. The encoded actions still need to cover
  // every attacker that did act rather than assuming all four always appear.
  assert.ok(actedAttackerIds.length > 0);
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
  const graceActions = beforeActions.filter(value => value.src_id === 103);
  assert.ok(graceActions.length > 0, 'TID_GRACE must act in the encounter');
  const graceActive = graceActions.find(value => value.type === 2);
  if (graceActive) {
    assert.deepEqual([...graceActive.aim_list], defenders.map(unit => Number(unit.id)));
    const graceDamage = actionMessages
      .map((value, index) => value.proto === 106 ? decodeAction(index, 'pb_fat_harm') : null)
      .filter(Boolean)
      .find(value => value.id === graceActive.id);
    assert.deepEqual(graceDamage.harm_list.map(value => Number(value.aim_id)), defenders.map(unit => Number(unit.id)));
  }
  assert.ok(beforeActions.every(value => Array.isArray(value.assist_list)));
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
  assert.equal(response.stm.exception ?? false, false);
  const preview = codec.unpack('mission_to_client', Buffer.from(response.stm.stm_data, 'base64'));
  assert.equal(preview.mission.mission_id, '20205');
  assert.deepEqual(preview.res.changes, []);
  assert.equal(missionModule(env.store).mission_id, '20205');
  assert.equal(Number(missionModule(env.store).pass_count?.count ?? 0), passCount);
  assert.equal(resourceAmount(env.store, 100012900), 120n);
  for (const tid of ['122802', '201500', '101800']) assert.equal(resourceAmount(env.store, tid), beforeRewards[tid]);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_first_clear' AND claim_key='30201'").get().n), 0);

  const settled = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  const settlementResponse = codec.unpack('pb_fight_settlement_response', settled.data);
  assert.equal(settlementResponse.stm.result, 1);
  assert.equal(settlementResponse.stm.exception ?? false, false);
  const settlement = codec.unpack('mission_to_client', Buffer.from(settlementResponse.stm.stm_data, 'base64'));
  assert.equal(settlement.mission.mission_id, String(completed));
  assert.equal(settlement.fight_result, '1');
  assert.deepEqual(settlement.res.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '100012900', diff_num: '-5' },
    { tid: '122802', diff_num: '2' },
    { tid: '201500', diff_num: '190' },
    { tid: '101800', diff_num: '100' },
    { tid: '140000', diff_num: '45' }
  ]);
  const energyChange = settlement.res.changes.find(change => change.tid === '100012900');
  assert.ok(energyChange.new_bin?.length);
  assert.deepEqual(
    (({ tid, num }) => ({ tid, num }))(codec.unpack('pb_mission_energy_res', Buffer.from(energyChange.new_bin, 'base64'))),
    { tid: '100012900', num: '115' }
  );
  assert.deepEqual(await decodeEtf(Buffer.from(settlement.res.changes.at(-1).extra, 'base64')), [9, 45]);
  assert.equal(BigInt(env.store.read().resources.get('122802').num), beforeRewards['122802'] + 2n);
  assert.equal(BigInt(env.store.read().resources.get('201500').num), beforeRewards['201500'] + 190n);
  assert.equal(BigInt(env.store.read().resources.get('101800').num), beforeRewards['101800'] + 100n);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_first_clear' AND claim_key='30201'").get().n), 1);
  assert.equal(missionModule(env.store).mission_id, String(completed));
  assert.equal(Number(missionModule(env.store).pass_count?.count ?? 0), passCount + 1);
  const replay = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  const replayResponse = codec.unpack('pb_fight_settlement_response', replay.data);
  assert.equal(replayResponse.stm.result, 1);
  assert.deepEqual(Buffer.from(replayResponse.stm.stm_data, 'base64'), Buffer.from(settlementResponse.stm.stm_data, 'base64'));
  assert.equal(missionModule(env.store).mission_id, String(completed));
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
  // A repeated delivery of the same 207 must return the same settlement without incrementing twice.
  const duplicate = env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.deepEqual(duplicate.data, replay.data);
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
  env.reopen();
  assert.equal(missionModule(env.store).mission_id, String(completed));
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
  assert.equal(BigInt(env.store.read().resources.get('201500').num), beforeRewards['201500'] + 190n);
  // Replaying the node that was already cleared must not grant its first-clear
  // reward again or advance the last-cleared cursor.
  const repeatedAfterRestart = env.service.execute(201, fightRequest(completed));
  const restartedPreview = codec.unpack('pb_fight_response', repeatedAfterRestart.data);
  assert.equal(restartedPreview.report.finish ?? false, false);
  const restartedSettlement = codec.unpack('mission_to_client', Buffer.from(codec.unpack(
    'pb_fight_settlement_response',
    env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 })).data
  ).stm.stm_data, 'base64'));
  assert.deepEqual(restartedSettlement.res.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '100012900', diff_num: '-5' },
    { tid: '140000', diff_num: '45' }
  ]);
  assert.deepEqual(await decodeEtf(Buffer.from(restartedSettlement.res.changes.at(-1).extra, 'base64')), [10, 0]);
  assert.equal(BigInt(env.store.read().resources.get('201500').num), beforeRewards['201500'] + 190n);
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);
  assert.equal(Number(env.store.read().role.level), 10);
  assert.equal(Number(env.store.read().role.exp), 0);
  env.reopen();
  assert.equal(Number(env.store.read().role.level), 10);
  assert.equal(Number(env.store.read().role.exp), 0);
});

test('zero stamina rejects an ordinary mission fight without advancing or granting rewards', t => {
  const env = setup(t);
  env.store.transaction(model => {
    model.resources.get('100012900').num = '0';
  });
  const before = env.store.state();
  assert.throws(() => env.service.execute(201, fightRequest(30201)), error => error.code === 301);
  assert.deepEqual(env.store.state(), before);
  assert.equal(missionModule(env.store).mission_id, '20205');
});

test('fight exit acknowledges without settling, while report read keeps the started report', t => {
  const env = setup(t);
  const before = Number(missionModule(env.store).mission_id);
  const result = env.service.execute(201, fightRequest(20201, { loc: [] }));
  assert.equal(codec.unpack('pb_fight_response', result.data).report.finish ?? false, false);
  assert.equal(Number(missionModule(env.store).mission_id), before, 'an older mission must not roll progress back');
  const reports = env.service.execute(203, codec.pack('pb_get_fight_report', { fight_id: [] }));
  assert.equal(codec.unpack('pb_fight_report_res', reports.data).report.length, 1);
  assert.equal(env.service.execute(202, codec.pack('pb_fight_exit', { fight_type: 1, is_force: false })).data.length, 0);
  assert.equal(Number(missionModule(env.store).mission_id), before);
  assert.equal(resourceAmount(env.store, 100012900), 120n);
  assert.throws(() => env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 })), error => error.code === 1);
});

test('mission progress requires 207 and fight_exit cannot bypass settlement', t => {
  const env = setup(t);
  setMission(env.store, 30201);
  env.service.execute(201, fightRequest(30202));
  assert.equal(Number(missionModule(env.store).mission_id), 30201);
  assert.equal(resourceAmount(env.store, 100012900), 120n);
  assert.equal(env.service.execute(202, codec.pack('pb_fight_exit', { fight_type: 1, is_force: false })).data.length, 0);
  assert.equal(Number(missionModule(env.store).mission_id), 30201);
  assert.equal(resourceAmount(env.store, 100012900), 120n);
  assert.throws(() => env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 })), error => error.code === 1);

  env.service.execute(201, fightRequest(30202));
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(Number(missionModule(env.store).mission_id), 30202);
  assert.equal(resourceAmount(env.store, 100012900), 115n);
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
  const next = 30202;
  setMission(env.store, 30201);
  // Wire shape produced by MissionUIMgr: chapter_tid/section_idx stay at protobuf defaults.
  const wire = (extra = {}) => codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 0,
    req: codec.pack('mission_fight_req', { mission_id: next, ...extra })
  });
  assert.throws(() => env.service.execute(201, wire({ is_assistant: true, boss_tid: 5 })), error => error.code === 5);
  const result = env.service.execute(201, wire({ is_assistant: true }));
  assert.equal(codec.unpack('pb_fight_response', result.data).report.finish ?? false, false);
  assert.equal(missionModule(env.store).mission_id, '30201');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '30202');
});

test('30204 uses the documented local pursuer fallback and commits at 207', t => {
  const env = setup(t);
  setMission(env.store, 30203);
  const result = env.service.execute(201, fightRequest(30204, { fight_tid: 304 }));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.tid, '304');
  assert.equal(response.report.finish ?? false, false);
  assert.deepEqual(response.report.battle_list[0].fighter_list.filter(unit => unit.team === 2).map(unit => unit.role), ['9002600', '9002600']);
  assert.equal(missionModule(env.store).mission_id, '30203');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '30204');
});

test('40203 uses the local chapter-four boss fallback and commits at 207', t => {
  const env = setup(t);
  setMission(env.store, 40202);
  const result = env.service.execute(201, fightRequest(40203, { fight_tid: 403 }));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.tid, '403');
  assert.equal(response.report.finish ?? false, false);
  assert.deepEqual(response.report.battle_list[0].fighter_list.filter(unit => unit.team === 2).map(unit => unit.role), ['9003300', '9003300']);
  assert.equal(missionModule(env.store).mission_id, '40202');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '40203');
});

test('40210 uses the documented local chapter-boss fallback and records the completed node', t => {
  const env = setup(t);
  setMission(env.store, 40209);
  const result = env.service.execute(201, fightRequest(40210, { fight_tid: 410 }));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.tid, '410');
  assert.equal(response.report.finish ?? false, false);
  assert.deepEqual(response.report.battle_list[0].fighter_list.filter(unit => unit.team === 2).map(unit => unit.role), ['1030401', '9002400']);
  assert.equal(missionModule(env.store).mission_id, '40209');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '40210');
});

test('mission chapter box grants configured rewards once and persists its BitBlock', async t => {
  const env = setup(t);
  setMission(env.store, 30205);
  const before = Object.fromEntries(['25002', '101500', '201500'].map(tid => [tid, resourceAmount(env.store, tid)]));
  const claim = async id => env.service.execute(506, await encodeEtf([id]));
  await assert.rejects(() => claim(2), error => error.code === 5);
  await assert.rejects(async () => env.service.execute(506, await encodeEtf([1, 2])), error => error.code === 5);
  assert.equal(missionModule(env.store).box_award ?? '', '');
  for (const tid of ['25002', '101500', '201500']) assert.equal(resourceAmount(env.store, tid), before[tid]);
  await assert.rejects(async () => env.service.execute(506, await encodeEtf([1, 1])), error => error.code === 1);
  // 3-5 is the last cleared node, so it already counts toward the chapter-three
  // box requirement even though the client displays 4-1 as the next node.

  const result = await claim(1);
  const response = codec.unpack('pb_mission_rsp', result.data);
  assert.equal(response.mission.mission_id, '30205');
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '25002', diff_num: '1' },
    { tid: '101500', diff_num: '30' },
    { tid: '201500', diff_num: '50000' }
  ]);
  assert.deepEqual([...(await decodeEtf(Buffer.from(response.mission.box_award, 'base64'))).value], [0x40]);
  assert.equal(BigInt(env.store.read().resources.get('25002').num), before['25002'] + 1n);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before['101500'] + 30n);
  assert.equal(BigInt(env.store.read().resources.get('201500').num), before['201500'] + 50000n);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_box'").get().n), 1);

  const repeated = codec.unpack('pb_mission_rsp', (await claim(1)).data);
  assert.deepEqual(repeated.res_change.changes, []);
  assert.equal(repeated.mission.box_award, response.mission.box_award);
  env.reopen();
  assert.deepEqual(codec.unpack('pb_mission_rsp', (await claim(1)).data).res_change.changes, []);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before['101500'] + 30n);
});

test('mission one-key claim skips previously claimed boxes and is idempotent across reopen', async t => {
  const env = setup(t);
  setMission(env.store, 50201);
  const before = Object.fromEntries(['25002', '101500', '201500'].map(tid => [tid, resourceAmount(env.store, tid)]));

  await env.service.execute(506, await encodeEtf([1]));
  const result = await env.service.execute(506, await encodeEtf([1, 2, 3, 4]));
  const response = codec.unpack('pb_mission_rsp', result.data);
  assert.deepEqual(response.res_change.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num })), [
    { tid: '25002', diff_num: '4' },
    { tid: '101500', diff_num: '160' },
    { tid: '201500', diff_num: '150000' }
  ]);
  assert.deepEqual([...(await decodeEtf(Buffer.from(response.mission.box_award, 'base64'))).value], [0x78]);
  assert.equal(BigInt(env.store.read().resources.get('25002').num), before['25002'] + 5n);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before['101500'] + 190n);
  assert.equal(BigInt(env.store.read().resources.get('201500').num), before['201500'] + 200000n);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_box'").get().n), 4);

  // The live save reached 4-10 after these boxes had already been claimed.
  // Retrying the client's one-key [1,2,3,4] request must remain an empty
  // success even though box 4 is not newly unlocked at this cursor.
  setMission(env.store, 40210);
  const repeated = codec.unpack('pb_mission_rsp', (await env.service.execute(506, await encodeEtf([1, 2, 3, 4]))).data);
  assert.deepEqual(repeated.res_change.changes, []);
  env.reopen();
  assert.deepEqual(codec.unpack('pb_mission_rsp', (await env.service.execute(506, await encodeEtf([1, 2, 3, 4]))).data).res_change.changes, []);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before['101500'] + 190n);
});

test('mission box reconciles a missing reward claim from the BitBlock without granting twice', async t => {
  const env = setup(t);
  setMission(env.store, 50201);
  const before = resourceAmount(env.store, '101500');
  const claim = async () => env.service.execute(506, await encodeEtf([1]));

  const first = codec.unpack('pb_mission_rsp', (await claim()).data);
  assert.deepEqual(first.res_change.changes.map(change => change.diff_num), ['1', '30', '50000']);
  env.store.inspect(db => db.prepare("DELETE FROM reward_claims WHERE role_id=? AND claim_type='mission_box' AND claim_key='1'").run(env.store.state().roleId));

  const reconciled = codec.unpack('pb_mission_rsp', (await claim()).data);
  assert.deepEqual(reconciled.res_change.changes, []);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 30n);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE role_id=? AND claim_type='mission_box' AND claim_key='1'").get(env.store.state().roleId).n), 1);

  env.reopen();
  assert.deepEqual(codec.unpack('pb_mission_rsp', (await claim()).data).res_change.changes, []);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 30n);
});

test('mission sweep consumes configured stamina and repeats every reward group', t => {
  const env = setup(t);
  setMission(env.store, 40210);
  addResource(env.store, 100012900, 20);
  const before = Object.fromEntries(['201500', '101800', '122802'].map(tid => [tid, BigInt(env.store.read().resources.get(tid).num)]));
  assert.equal(env.service.supports(503), true);

  const request = times => codec.pack('pb_mission_sweep_passed_req', { tid: 30202, times });
  const first = codec.unpack('pb_mission_sweep_passed_rsp', env.service.execute(503, request(1)).data);
  assert.deepEqual(first.changes.changes.map(change => ({ tid: change.tid, diff_num: change.diff_num, new_num: change.new_num })), [
    { tid: '100012900', diff_num: '-5', new_num: '15' },
    { tid: '201500', diff_num: '200', new_num: String(before['201500'] + 200n) },
    { tid: '101800', diff_num: '100', new_num: String(before['101800'] + 100n) },
    { tid: '122802', diff_num: '1', new_num: String(before['122802'] + 1n) }
  ]);
  assert.notEqual(first.changes.is_overflow, true);
  assert.deepEqual(first.sweep_award, [{
    award: [
      { tid: '201500', num: '200' },
      { tid: '101800', num: '100' },
      { tid: '122802', num: '1' }
    ]
  }]);
  assert.equal(env.store.read().resources.get('100012900').num, '15');

  const second = codec.unpack('pb_mission_sweep_passed_rsp', env.service.execute(503, request(2)).data);
  assert.equal(second.sweep_award.length, 2);
  assert.deepEqual(second.sweep_award[0], second.sweep_award[1]);
  assert.deepEqual(second.sweep_award[0].award, first.sweep_award[0].award);
  assert.deepEqual(second.changes.changes.map(change => [change.tid, change.diff_num, change.new_num]), [
    ['100012900', '-10', '5'],
    ['201500', '400', String(before['201500'] + 600n)],
    ['101800', '200', String(before['101800'] + 300n)],
    ['122802', '2', String(before['122802'] + 3n)]
  ]);
  assert.equal(env.store.read().resources.get('100012900').num, '5');

  env.reopen();
  assert.equal(env.store.read().resources.get('100012900').num, '5');
  assert.equal(BigInt(env.store.read().resources.get('201500').num), before['201500'] + 600n);
  assert.equal(BigInt(env.store.read().resources.get('101800').num), before['101800'] + 300n);
  assert.equal(BigInt(env.store.read().resources.get('122802').num), before['122802'] + 3n);
});

test('mission sweep rejects invalid, unswept and unaffordable requests without mutation', t => {
  const env = setup(t);
  addResource(env.store, 100012900, 4);
  const before = env.store.state();
  const request = (tid, times) => codec.pack('pb_mission_sweep_passed_req', { tid, times });

  assert.throws(() => env.service.execute(503, request(30202, 0)), error => error.code === 1);
  assert.throws(() => env.service.execute(503, request(30202, 601)), error => error.code === 1);
  assert.throws(() => env.service.execute(503, request(999999, 1)), error => error.code === 5);
  assert.throws(() => env.service.execute(503, request(30202, 1)), error => error.code === 5);
  assert.deepEqual(env.store.state(), before);

  setMission(env.store, 40210);
  const cleared = env.store.state();
  assert.throws(() => env.service.execute(503, request(30202, 1)), error => error.code === 301);
  assert.deepEqual(env.store.state(), cleared);
});

test('mission sweep response encoding failure rolls back stamina and rewards', t => {
  const env = setup(t);
  setMission(env.store, 40210);
  addResource(env.store, 100012900, 10);
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, object) {
      if (name === 'pb_mission_sweep_passed_rsp') throw new Error('sweep encode fail');
      return codec.pack(name, object);
    }
  };
  const broken = createMissionFightService({ store: env.store, codec: brokenCodec, playbackEnabled: true });
  assert.throws(() => broken.execute(503, codec.pack('pb_mission_sweep_passed_req', { tid: 30202, times: 1 })), /sweep encode fail/);
  assert.deepEqual(env.store.state(), before);
});

test('mission sweep accepts the client stamina-derived count above the legacy ten-key batch', t => {
  const env = setup(t);
  setMission(env.store, 40210);
  addResource(env.store, 100012900, 3005);
  const request = times => codec.pack('pb_mission_sweep_passed_req', { tid: 30202, times });

  // EnergyConst.max is 3000 and SweepConst.cost_num is 5. The current client
  // can therefore emit counts through 600, even though the legacy one-key
  // form normally sends 10.
  assert.throws(() => env.service.execute(503, request(601)), error => error.code === 1);
  const first = codec.unpack('pb_mission_sweep_passed_rsp', env.service.execute(503, request(99)).data);
  assert.equal(first.sweep_award.length, 99);
  const second = codec.unpack('pb_mission_sweep_passed_rsp', env.service.execute(503, request(501)).data);
  assert.equal(second.sweep_award.length, 501);
  assert.equal(env.store.read().resources.get('100012900').num, '5');
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
  setMission(env.store, 30201);
  // Reach the chapter-3 story node through the real fight path so the
  // story-pass precondition is the same one the client has in game.
  for (const mission of [30201, 30202, 30203, 30204]) {
    env.service.execute(201, fightRequest(mission, { fight_tid: 300 + (mission % 100) }));
    env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  }
  assert.equal(missionModule(env.store).mission_id, '30204');
  const passCount = Number(missionModule(env.store).pass_count?.count ?? 0);
  const result = env.service.passStory(30205);
  const response = codec.unpack('pb_mission_rsp', result.data);
  assert.equal(response.mission.mission_id, '30205');
  assert.equal(Number(response.mission.pass_count.count), passCount);
  assert.equal(response.res_change.changes.length, 0);
  assert.ok(!response.res_change.is_overflow);
  assert.equal(missionModule(env.store).mission_id, '30205');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount);

  // Replaying the same story node must not regress or duplicate progress.
  const duplicate = env.service.passStory(30205);
  assert.equal(codec.unpack('pb_mission_rsp', duplicate.data).mission.mission_id, '30205');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount);

  // Battle sections and unknown sections are not story passes.
  assert.throws(() => env.service.passStory(30201), error => error.code === 5);
  assert.throws(() => env.service.passStory(39999), error => error.code === 5);

  // Chapter 4's first journey battle must be playable immediately after the
  // chapter-3 story node is passed.
  const nextBattle = env.service.execute(201, fightRequest(40201, { fight_tid: 401 }));
  assert.equal(codec.unpack('pb_fight_response', nextBattle.data).report.finish ?? false, false);
  assert.equal(missionModule(env.store).mission_id, '30205');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '40201');
});

test('ordinary victory records the completed journey node and unlocks its successor', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(8);
    const current = codec.unpack('pb_mission', rawBinary(module.value[0]));
    current.mission_id = '40208';
    module.value[0] = serializedBinary(codec.pack('pb_mission', current));
    const modules = new Map(model.state.modules.value);
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
  const passCount = Number(missionModule(env.store).pass_count?.count ?? 0);

  const result = env.service.execute(201, fightRequest(40209, { fight_tid: 409 }));
  const response = codec.unpack('pb_fight_response', result.data);
  assert.equal(response.report.finish ?? false, false);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(response.stm.stm_data, 'base64')).mission.mission_id, '40208');
  assert.equal(missionModule(env.store).mission_id, '40208');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount);
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '40209');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);

  // Re-entering the same battle must not count another clear.
  const repeated = env.service.execute(201, fightRequest(40209, { fight_tid: 409 }));
  const repeatedResponse = codec.unpack('pb_fight_response', repeated.data);
  assert.equal(repeatedResponse.report.finish ?? false, false);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(repeatedResponse.stm.stm_data, 'base64')).mission.mission_id, '40209');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 1);

  const next = env.service.execute(201, fightRequest(40210, { fight_tid: 410 }));
  const nextResponse = codec.unpack('pb_fight_response', next.data);
  assert.equal(nextResponse.report.finish ?? false, false);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(nextResponse.stm.stm_data, 'base64')).mission.mission_id, '40209');
  env.service.execute(207, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(missionModule(env.store).mission_id, '40210');
  assert.equal(Number(missionModule(env.store).pass_count.count), passCount + 2);
});
