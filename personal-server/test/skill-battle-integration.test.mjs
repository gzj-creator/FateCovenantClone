import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { simulateBattle, FIGHT_ENERGY_MAX } from '../game/battle-engine.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const HERO_ROLE = 2010101;
const codec = createGameCodec();

function unit(id, role, profession, overrides = {}) {
  return {
    id,
    role,
    profession,
    loc: id,
    abilityId: role,
    activeAbilityId: role + 1000000000,
    maxHp: 8000,
    attack: 100,
    defense: 0,
    speed: 90,
    initialEnergy: 0,
    ...overrides
  };
}

function actionWindow(events, srcId, actionType) {
  const start = events.find(event => event.kind === 'action-start'
    && event.srcId === srcId && event.actionType === actionType);
  assert.ok(start, `missing action type ${actionType} for unit ${srcId}`);
  const endIndex = events.findIndex((event, index) => index > events.indexOf(start)
    && event.kind === 'action-end' && event.id === start.id);
  assert.ok(endIndex >= 0, `missing action-end for action ${start.id}`);
  return events.slice(events.indexOf(start) + 1, endIndex);
}

test('battle unit id 101 loads and executes role 2010101 round-start skills', () => {
  const battle = simulateBattle({
    attackers: [unit(101, HERO_ROLE, 1, { loc: 1, speed: 120 })],
    defenders: [unit(201, 9002100, 2, { loc: 1, speed: 1 })],
    seed: 31,
    maxRounds: 1
  });

  const roundStartEffects = battle.events.filter(event => event.triggerType === 'on-round-start'
    && event.actor === 101);
  assert.ok(roundStartEffects.length > 0,
    'role 2010101 must register real database skills even though the battle instance id is 101');

  const damageBonus = roundStartEffects.find(event => event.type === 'stat-modifier'
    && event.target === 101
    && event.statType === 'damage-bonus'
    && String(event.trigger).startsWith('321010171_'));
  assert.ok(damageBonus,
    '重击 must execute on round start and expose its visible damage-bonus status');
  assert.equal(damageBonus.magnitude, 0.05);
});

test('real normal and active actions fire their matching skill trigger types', () => {
  const normal = simulateBattle({
    attackers: [unit(101, HERO_ROLE, 1, { loc: 1, speed: 120 })],
    defenders: [unit(201, 9002100, 2, { loc: 1, speed: 1 })],
    seed: 37,
    maxRounds: 1
  });
  const normalWindow = actionWindow(normal.events, 101, 1);
  assert.ok(normalWindow.some(event => event.triggerType === 'on-attack'),
    'a real normal attack must fire on-attack passives inside that action window');
  assert.ok(!normalWindow.some(event => event.triggerType === 'on-skill-use'),
    'a normal attack must not fire on-skill-use passives');
  assert.ok(!normalWindow.some(event => event.triggerType === 'on-ultimate-use'),
    'a normal attack must not fire on-ultimate-use passives');

  const active = simulateBattle({
    attackers: [unit(101, HERO_ROLE, 1, {
      loc: 1,
      speed: 120,
      initialEnergy: FIGHT_ENERGY_MAX
    })],
    defenders: [unit(201, 9002100, 2, { loc: 1, speed: 1 })],
    seed: 41,
    maxRounds: 1
  });
  const activeWindow = actionWindow(active.events, 101, 2);
  assert.ok(activeWindow.some(event => event.triggerType === 'on-skill-use'),
    'a real active action must fire on-skill-use passives inside that action window');
  assert.ok(activeWindow.some(event => event.triggerType === 'on-ultimate-use'),
    'a real active action must fire on-ultimate-use passives inside that action window');
  assert.ok(!activeWindow.some(event => event.triggerType === 'on-attack'),
    'an active action must not be reported as a normal on-attack action');
});

test('damage from an on-attack skill enters the battle death event stream', () => {
  const battle = simulateBattle({
    attackers: [unit(101, HERO_ROLE, 1, { loc: 1, speed: 120, attack: 60 })],
    defenders: [unit(201, 9002100, 2, {
      loc: 1,
      speed: 1,
      attack: 1,
      // The normal hit is deterministic but non-lethal; the on-attack passive
      // supplies the killing hit and therefore proves passive deaths are encoded.
      // The bound is two plain 63-point hits: the mastery's "next ultimate"
      // bonus no longer boosts the same attack (CORE-BATTLE-A scoping), so the
      // fixture cannot rely on that +15% to reach zero.
      maxHp: 126
    })],
    seed: 43,
    maxRounds: 1
  });

  const skillDamageIndex = battle.events.findIndex(event => event.type === 'damage'
    && event.actor === 101
    && event.target === 201
    && event.triggerType === 'on-attack'
    && String(event.trigger).startsWith('120001001_'));
  assert.ok(skillDamageIndex >= 0,
    '双重攻击 must apply its extra damage as an observable on-attack skill effect');

  const deathIndex = battle.events.findIndex((event, index) => index > skillDamageIndex
    && event.kind === 'death'
    && event.aimId === 201);
  assert.ok(deathIndex >= 0,
    'when an on-attack skill effect kills a unit, action_list-visible death state must be emitted');
});

test('a skill battle is reproducible from its seed without global RNG', () => {
  const run = () => simulateBattle({
    attackers: [unit(101, 1040101, 4, {
      loc: 1,
      speed: 120,
      initialEnergy: FIGHT_ENERGY_MAX
    })],
    defenders: [
      unit(201, 9002100, 2, { loc: 1, speed: 1 }),
      unit(202, 9002200, 2, { loc: 2, speed: 1 })
    ],
    seed: 47,
    maxRounds: 1
  });

  const first = run();
  const originalRandom = Math.random;
  Math.random = () => { throw new Error('seeded skill battle attempted to use global Math.random()'); };
  try {
    const second = run();
    assert.deepEqual(second, first);
  } finally {
    Math.random = originalRandom;
  }
});

test('passive action windows use unique nonzero ids in every round', () => {
  const battle = simulateBattle({
    attackers: [unit(101, 5040201, 2, {
      loc: 1,
      speed: 120,
      attack: 1,
      maxHp: 8000
    })],
    defenders: [unit(201, 9002100, 2, {
      loc: 1,
      speed: 1,
      attack: 1,
      maxHp: 100000
    })],
    seed: 53,
    maxRounds: 2
  });

  const passiveStarts = battle.events.filter(event => event.kind === 'passive-action-start');
  const passiveEnds = battle.events.filter(event => event.kind === 'passive-action-end');
  const passiveShields = battle.events.filter(event => event.kind === 'shield'
    && event.aimId === 101 && passiveStarts.some(start => start.id === event.id));
  assert.equal(passiveStarts.length, 2);
  assert.deepEqual(passiveEnds.map(event => event.id), passiveStarts.map(event => event.id));
  assert.ok(passiveStarts.every(event => event.id > 0));
  assert.equal(new Set(passiveStarts.map(event => event.id)).size, passiveStarts.length);
  assert.equal(passiveShields.length, 2);

  for (const shield of passiveShields) {
    const start = battle.events.findIndex(event => event.kind === 'passive-action-start'
      && event.id === shield.id);
    const end = battle.events.findIndex(event => event.kind === 'passive-action-end'
      && event.id === shield.id);
    const shieldIndex = battle.events.indexOf(shield);
    assert.ok(start < shieldIndex && shieldIndex < end);
  }
});

test('every HP threshold passive is evaluated after damage instead of only at 50 percent', () => {
  const battle = simulateBattle({
    attackers: [unit(101, 1020101, 2, { loc: 1, speed: 120, attack: 1 })],
    defenders: [unit(201, 18002100, 2, { loc: 1, speed: 1, maxHp: 20000, attack: 3500 })],
    seed: 31,
    maxRounds: 1
  });

  // The first hit leaves role 1020101 below 70% but above 50%. Its hp-below-70
  // shield must already execute; waiting for a 50% crossing skips this passive.
  assert.ok(battle.attackers[0].hp / battle.attackers[0].maxHp < 0.7);
  assert.ok(battle.attackers[0].hp / battle.attackers[0].maxHp > 0.5);
  assert.ok(battle.events.some(event => event.kind === 'shield' && event.aimId === 101),
    'hp-below-70 must execute after the first qualifying damage event');
});

function setMission(store, missionId) {
  store.transaction(model => {
    const module = new Map(model.state.modules.value).get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = String(missionId);
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    const modules = new Map(model.state.modules.value);
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
}

function addResource(store, tid, num, group = 1) {
  store.transaction(model => {
    const entry = model.resources.size;
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
  });
}

function actions(report) {
  return report.battle_list[0].action_list.map(bytes => codec.unpack(
    'pb_generic',
    Buffer.from(bytes, 'base64')
  ));
}

function decodeAction(packet, schema) {
  return codec.unpack(schema, Buffer.from(packet.bin, 'base64'));
}

test('mission action_list encodes passive skill damage under the source action', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-skill-battle-' });
  addResource(fixture.store, 100012900, 1000);
  setMission(fixture.store, 30201);
  const service = createMissionFightService({ store: fixture.store, codec, playbackEnabled: true });
  const request = codec.pack('pb_fight_request', {
    fight_tid: 301,
    stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: 30201 }),
    loc: [{ team_id: 1, loc: [{ hero_id: String(HERO_ROLE), loc: 1 }] }]
  });

  const response = codec.unpack('pb_fight_response', service.execute(201, request).data);
  const battle = response.report.battle_list[0];
  const hero = battle.fighter_list.find(candidate => candidate.team === 1
    && Number(candidate.role) === HERO_ROLE);
  assert.ok(hero, 'task battle must include role 2010101');

  const packets = actions(response.report);
  const passiveShieldIndex = packets.findIndex(packet => Number(packet.proto) === 109);
  assert.ok(passiveShieldIndex > 0);
  const passiveShield = decodeAction(packets[passiveShieldIndex], 'pb_fat_shield');
  const passiveStartIndex = packets.findIndex((packet, index) => index < passiveShieldIndex
    && Number(packet.proto) === 101
    && Number(decodeAction(packet, 'pb_fat_action_before').id) === Number(passiveShield.id));
  const passiveEndIndex = packets.findIndex((packet, index) => index > passiveShieldIndex
    && Number(packet.proto) === 102
    && Number(decodeAction(packet, 'pb_fat_action_after').id) === Number(passiveShield.id));
  assert.ok(passiveStartIndex >= 0 && passiveEndIndex > passiveShieldIndex,
    'round-start passive effects must have an existing action-before/after window');
  const replaySchemas = new Map([
    [101, 'pb_fat_action_before'],
    [102, 'pb_fat_action_after'],
    [105, 'pb_fat_fighter_die'],
    [106, 'pb_fat_harm'],
    [109, 'pb_fat_shield'],
    [114, 'pb_fat_fighter_relive'],
    [116, 'pb_fat_attr_sync'],
  ]);
  for (const packet of packets) {
    const schema = replaySchemas.get(Number(packet.proto));
    if (!schema) continue;
    assert.ok(Number(decodeAction(packet, schema).id) > 0,
      `${schema} must not use action id 0`);
  }
  const actionBefore = packets
    .filter(packet => Number(packet.proto) === 101)
    .map(packet => decodeAction(packet, 'pb_fat_action_before'))
    .find(action => Number(action.src_id) === Number(hero.id) && Number(action.type) === 1);
  assert.ok(actionBefore, 'task battle must expose a normal action for role 2010101');

  const damages = packets
    .filter(packet => Number(packet.proto) === 106)
    .map(packet => decodeAction(packet, 'pb_fat_harm'))
    .filter(damage => damage.id === actionBefore.id);
  assert.ok(damages.length >= 2,
    'the normal attack plus 双重攻击 skill damage must both be encoded under the same action id');
});
