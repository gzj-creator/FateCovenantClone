import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { actionList, createMissionFightService } from '../game/mission-fight-service.mjs';
import { PROMPT } from '../game/effects/report-codes.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const SCHEMAS = {
  101: 'pb_fat_action_before', 102: 'pb_fat_action_after',
  103: 'pb_fat_buff_change', 104: 'pb_fat_battle_over',
  105: 'pb_fat_fighter_die', 106: 'pb_fat_harm',
  107: 'pb_fat_round_ready', 109: 'pb_fat_shield',
  112: 'pb_fat_round_over', 114: 'pb_fat_fighter_relive',
  116: 'pb_fat_attr_sync'
};

function fighter(id, overrides = {}) {
  return {
    id, role: 2010201, profession: 2, loc: id,
    abilityId: 1, activeAbilityId: 2,
    maxHp: 10000, attack: 10, defense: 0,
    speed: id === 101 ? 120 : 90, initialEnergy: 0, skills: [],
    ...overrides
  };
}

function selfHealSkill(id, { multiplier = 0.5, overheal = false } = {}) {
  return {
    id: String(id),
    type: 'Normal',
    implementation: {
      effects: [{
        target: { targetType: 'self' },
        effect: { type: 'heal', healType: 'percent-max-hp', multiplier, overheal },
        duration: { durationType: 'instant' },
        chance: 1
      }]
    }
  };
}

function decode(packets) {
  return packets.map(bytes => {
    const generic = codec.unpack('pb_generic', Buffer.from(bytes, 'base64'));
    return { proto: generic.proto, value: codec.unpack(SCHEMAS[generic.proto], Buffer.from(generic.bin, 'base64')) };
  });
}

test('a real heal event carries the HP delta the server applied', () => {
  const skill = selfHealSkill(990101, { multiplier: 0.5 });
  skill.implementation.effects[0].effect.healType = 'percent-missing-hp';
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990101, skills: [skill], speed: 10 })],
    defenders: [fighter(201, { speed: 200, attack: 5000, maxHp: 100000 })],
    seed: 5,
    maxRounds: 1
  });
  const heal = battle.events.find(event => event.kind === 'heal' && event.aimId === 101);
  assert.ok(heal, 'the self-heal runs');
  assert.equal(heal.type, 'heal');
  assert.equal(heal.hp - heal.oldHp, heal.value);
  assert.ok(heal.value > 0);
});

test('heal events project to pb_fat_harm with the proven TID_PROMPT_HEAL id', () => {
  assert.equal(PROMPT.HEAL, 107);
  const simulation = {
    events: [
      { kind: 'round-start', round: 1 },
      { kind: 'action-start', id: 1, srcId: 101, assistIds: [], aimList: [101], abilityId: 990101, actionType: 1 },
      { kind: 'heal', id: 1, srcId: 101, aimId: 101, value: 40, oldHp: 60, hp: 100, oldShield: 7, shield: 7 },
      { kind: 'action-end', id: 1 },
      { kind: 'round-end', round: 1 }
    ]
  };
  const harm = decode(actionList(codec, simulation)).find(packet => packet.proto === 106);
  assert.ok(harm, 'a heal must be projected as pb_fat_harm');
  assert.equal(harm.value.harm_list.length, 1);
  const entry = harm.value.harm_list[0];
  assert.equal(Number(entry.type), 107);
  assert.equal(Number(entry.aim_id), 101);
  assert.equal(Number(entry.src_id), 101);
  assert.equal(Number(entry.value), 40);
  assert.equal(Number(entry.old_hp), 60);
  assert.equal(Number(entry.hp), 100);
  assert.equal(Number(entry.old_shield), 7);
  assert.equal(Number(entry.shield), 7);
});

test('a heal that restores no HP is never sent as a recover prompt', () => {
  const simulation = {
    events: [
      { kind: 'round-start', round: 1 },
      { kind: 'heal', id: 1, srcId: 101, aimId: 101, value: 0, oldHp: 100, hp: 100, oldShield: 0, shield: 0 },
      { kind: 'round-end', round: 1 }
    ]
  };
  const packets = decode(actionList(codec, simulation));
  assert.equal(packets.some(packet => packet.proto === 106), false);
});

test('the client receives at most one harm packet per action with ordered damage and recovery rows', () => {
  const damage = (id, oldHp, hp, value) => ({ kind: 'damage', id,
    harms: [{ aimId: 201, srcId: 101, value, oldHp, hp, oldShield: 7, shield: 0 }] });
  const packets = decode(actionList(codec, { events: [
    { kind: 'action-start', id: 1, srcId: 101, aimList: [201], abilityId: 2202010112, actionType: 2 },
    damage(1, 300, 270, 37),
    { kind: 'shield', id: 1, aimId: 101, shield: 16 },
    damage(1, 270, 250, 20),
    { kind: 'heal', id: 1, srcId: 101, aimId: 101, value: 40, actualHeal: 20, oldHp: 80, hp: 100 },
    { kind: 'effect', type: 'heal', id: 1, actor: 101, target: 102, value: 4, oldHp: 89, newHp: 93 },
    { kind: 'action-end', id: 1 },
    { kind: 'action-start', id: 2, srcId: 101, aimList: [201], abilityId: 1102010101, actionType: 1 },
    damage(2, 250, 240, 10),
    { kind: 'action-end', id: 2 },
  ] }));
  assert.deepEqual(packets.map(packet => [packet.proto, Number(packet.value.id)]),
    [[101, 1], [106, 1], [109, 1], [102, 1], [101, 2], [106, 2], [102, 2]]);
  assert.deepEqual(packets.filter(packet => packet.proto === 106).map(packet => packet.value.harm_list.map(harm =>
    [harm.type, harm.src_id, harm.aim_id, Number(harm.value), Number(harm.old_hp), Number(harm.hp)])), [
    [[101, 101, 201, 37, 300, 270], [101, 101, 201, 20, 270, 250], [107, 101, 101, 20, 80, 100],
      [107, 101, 102, 4, 89, 93]],
    [[101, 101, 201, 10, 250, 240]],
  ]);
});

test('the production report now carries the life-steal recover prompt', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-heal-', now: () => 1700000000 * 1000 });
  fixture.store.transaction(model => {
    const lineupHeroes = new Set([2010101, 2010201]);
    for (const hero of model.heroInfo.hero_list) {
      if (lineupHeroes.has(Number(hero.tid))) hero.star = 10;
      if (Number(hero.tid) === 2010201) hero.breakthrough_level = 1;
    }
  });
  const service = createMissionFightService({ store: fixture.store, codec, playbackEnabled: true, now: () => 1700000000 * 1000 });
  const lineup = [
    { hero_id: '2010101', loc: 6 },
    { hero_id: '2010201', loc: 4 }
  ];
  const started = service.execute(201, codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: 30201 }),
    loc: [{ team_id: 1, loc: lineup }]
  }));
  const report = codec.unpack('pb_fight_response', Buffer.from(started.data, 'base64')).report.battle_list[0];
  const heals = decode(report.action_list.map(bytes => Buffer.from(bytes, 'base64')))
    .filter(packet => packet.proto === 106)
    .flatMap(packet => packet.value.harm_list)
    .filter(harm => Number(harm.type) === 107);
  assert.ok(heals.length >= 1, 'hero 2010201 life-steals through its ultimate');
  for (const heal of heals) {
    assert.equal(Number(heal.value), Number(heal.hp) - Number(heal.old_hp));
    assert.ok(Number(heal.value) > 0);
  }
  // 201 is still preview-only.
  const mission = codec.unpack('pb_mission', rawBinary(new Map(fixture.store.state().modules.value).get(8).value[0]));
  assert.equal(mission.mission_id, '20205');
});
