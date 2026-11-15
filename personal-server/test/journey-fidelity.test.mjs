import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readGuideAwards } from '../config/guide-awards.mjs';
import { createGuideService, saveGuideProcesses } from '../game/guide-service.mjs';
import { createLineupService } from '../game/lineup-service.mjs';
import { createMissionFightService, reportBattle } from '../game/mission-fight-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const attributes = readAttributeTables();
const now = () => Date.UTC(2026, 10, 14, 8);
const mission = store => codec.unpack('pb_mission', rawBinary(new Map(store.state().modules.value).get(8).value[0]));
const guide = store => codec.unpack('pb_guide', rawBinary(new Map(store.state().modules.value).get(16)));
const enemies = battle => battle.fighter_list.filter(unit => Number(unit.team) === 2);
const enemySnapshot = battle => enemies(battle).map(unit => ({
  npc: Number(unit.role), fighter: Number(unit.tid), loc: Number(unit.loc),
  hp: Number(unit.max_hp), level: Number(unit.level), abilities: unit.ability_list
}));
const request = (missionId, extra = {}) => codec.pack('pb_fight_request', {
  fight_tid: 999999, stm_type: 1,
  req: codec.pack('mission_fight_req', { mission_id: missionId }), ...extra
});
const settleRequest = codec.pack('pb_fight_settlement_request', { fight_type: 1 });

test('Michelle and 2-1 use original NPC identities and fixed templates across player progression', t => {
  const fixture = createGameFixture(t, codec, { seed: { freshAccount: true }, now });
  const model = fixture.store.read();
  const originalBoss = reportBattle(codec, model, { missionId: 10205 }, {}, attributes);
  assert.deepEqual(enemySnapshot(originalBoss).map(({ npc, fighter, loc, hp, level }) => ({ npc, fighter, loc, hp, level })), [
    { npc: 3030500, fighter: 10505, loc: 5, hp: 864, level: 1 }
  ]);
  const original = reportBattle(codec, model, { missionId: 20201 }, {}, attributes);
  assert.deepEqual(enemySnapshot(original).map(({ npc, fighter, loc, hp }) => ({ npc, fighter, loc, hp })), [
    { npc: 9301600, fighter: 20101, loc: 1, hp: 474 },
    { npc: 9301600, fighter: 20102, loc: 2, hp: 474 },
    { npc: 9301600, fighter: 20103, loc: 3, hp: 474 },
    { npc: 9105000, fighter: 20105, loc: 5, hp: 474 }
  ]);
  assert.equal(Number(original.def_power), 480);
  const enhanced = structuredClone(model);
  for (const hero of enhanced.heroInfo.hero_list) hero.level = 30;
  const other = reportBattle(codec, enhanced, { missionId: 20201 }, {
    loc: [{ team_id: 1, loc: [{ hero_id: '2010101', loc: 6 }] }]
  }, attributes);
  assert.deepEqual(enemySnapshot(other), enemySnapshot(original));
  assert.equal(other.def_power, original.def_power);
  assert.notEqual(other.atk_power, original.atk_power);
});

test('fresh save grants the first hero, clears Michelle, survives a 2-1 loss, then earns the second hero after 2-1', async t => {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-journey-fidelity-', now,
    seed: { freshAccount: true, createdAt: now() / 1000 }
  });
  let store, fights, guides, lineups;
  const connect = () => {
    store = fixture.store;
    fights = createMissionFightService({ store, codec, playbackEnabled: true, now });
    guides = createGuideService({ store, codec, tables: readGameTables(), awards: readGuideAwards(), now });
    lineups = createLineupService({ store, codec });
  };
  const reopen = () => { fixture.open(); connect(); };
  connect();
  const start = (id, extra) => codec.unpack('pb_fight_response', fights.execute(201, request(id, extra)).data).report;
  const settle = () => codec.unpack('pb_fight_settlement_response', fights.execute(207, settleRequest).data);
  const claimCount = kind => store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type=?').get(kind).n);
  const assign = (id, index, loc) => {
    const preset = structuredClone(store.read().lineups.pre_lineups[0]);
    preset.lineup.fighter_list.push({ hero_id: String(id), index, loc });
    lineups.execute(209, { pre_lineup_list: [preset], handle_types: ['0'] });
  };

  assert.equal(Number(store.read().role.level), 1);
  assert.deepEqual(store.read().heroInfo.hero_list.map(hero => Number(hero.tid)), [2010101, 2010201]);
  assert.equal(Number(mission(store).mission_id ?? 0), 0);
  await assert.rejects(() => guides.execute(8001, 1), /not completed/);
  const first = start(10202);
  assert.equal(first.tid, '102', 'the server must ignore a mismatched client fight_tid');
  assert.equal(first.final_result, 1);
  assert.deepEqual(enemies(first.battle_list[0]).map(unit => Number(unit.role)), [9100500, 9100500, 9100500, 9100500]);
  settle();
  assert.equal(mission(store).mission_id, '10202');
  await guides.execute(8001, 1);
  store.transaction(model => saveGuideProcesses({ model, codec, reqList: [{ process_id: 104, key_id: 106004 }] }));
  assert.equal(guide(store).process_list.find(row => row.process_id === 104).is_over ?? false, false);
  reopen();
  await assert.rejects(() => guides.execute(8001, 1), /already claimed/);
  assign(1020601, 3, 2);
  store.transaction(model => saveGuideProcesses({ model, codec, reqList: [{ process_id: 104, key_id: 106008 }] }));
  assert.equal(guide(store).process_list.find(row => row.process_id === 104).is_over, true);

  assert.equal(start(10204).final_result, 1);
  settle();
  const boss = start(10205);
  assert.equal(boss.tid, '105');
  assert.deepEqual(enemies(boss.battle_list[0]).map(unit => [Number(unit.role), Number(unit.tid), Number(unit.loc)]), [[3030500, 10505, 5]]);
  assert.equal(boss.final_result, 1);
  settle();
  assert.equal(mission(store).mission_id, '10205');
  fights.passStory([10206]);
  assert.equal(mission(store).mission_id, '10206');
  await assert.rejects(() => guides.execute(8001, 2), /not completed/);
  assert.equal(store.read().heroInfo.hero_list.some(hero => hero.tid === '2020601'), false);

  const beforeLossRole = structuredClone(store.read().role);
  const beforeLossClaims = claimCount('mission_first_clear');
  const lost = start(20201, { loc: [{ team_id: 1, loc: [{ hero_id: '2010101', loc: 6 }] }] });
  assert.equal(lost.final_result, 2, 'a legal weaker team must still be able to lose');
  assert.ok(Number(lost.battle_list[0].def_power) > 0);
  const lossSettlement = settle();
  assert.equal(lossSettlement.stm.result, 2);
  assert.equal(mission(store).mission_id, '10206');
  assert.equal(claimCount('mission_first_clear'), beforeLossClaims);
  assert.deepEqual(store.read().role, beforeLossRole);
  const afterLoss = store.state();
  settle();
  assert.deepEqual(store.state(), afterLoss, 'repeated settlement cannot consume twice');
  reopen();
  assert.equal(mission(store).mission_id, '10206');
  assert.equal(claimCount('guide_award'), 1);
  assert.equal(store.read().playLineups.find(row => row.type === 1).team_list[0].fighter_list.length, 3);
  const win = start(20201);
  assert.equal(win.tid, '201');
  assert.equal(win.final_result, 1);
  assert.deepEqual(enemySnapshot(win.battle_list[0]), enemySnapshot(lost.battle_list[0]));
  settle();
  assert.equal(mission(store).mission_id, '20201');
  await guides.execute(8001, 2);
  assign(2020601, 4, 5);
  reopen();
  assert.deepEqual(store.read().heroInfo.hero_list.map(hero => [Number(hero.tid), Number(hero.level), Number(hero.count)]), [
    [2010101, 1, 1], [2010201, 1, 1], [1020601, 1, 1], [2020601, 1, 1]
  ]);
  assert.equal(Buffer.from(guide(store).award, 'base64')[0], 0x60);
  assert.equal(claimCount('guide_award'), 2);
  assert.equal(store.read().playLineups.find(row => row.type === 1).team_list[0].fighter_list.length, 4);
  await assert.rejects(() => guides.execute(8001, 2), /already claimed/);
});
