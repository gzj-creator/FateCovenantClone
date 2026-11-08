import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { actionList } from '../game/mission-fight-service.mjs';
import {
  BUFF_CHANGE_REASON,
  BUFF_SIGN,
  PROVEN_STATUS_BUFF_TIDS,
  provenBuffTid
} from '../game/effects/report-codes.mjs';

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
    maxHp: 100000, attack: 10, defense: 0,
    speed: id === 101 ? 120 : 90, initialEnergy: 0, skills: [],
    ...overrides
  };
}

function statusSkill(id, statusType, { duration = { durationType: 'timed', rounds: 3 }, effect = {} } = {}) {
  return {
    id: String(id),
    type: 'Normal',
    implementation: {
      effects: [{
        target: { targetType: 'single' },
        effect: { type: 'status', statusType, ...effect },
        duration,
        chance: 1
      }]
    }
  };
}

function allBuffChanges(battle) {
  return battle.events.filter(event => event.kind === 'buff-change').flatMap(event => event.buffs);
}

function decode(packets) {
  return packets.map(bytes => {
    const generic = codec.unpack('pb_generic', Buffer.from(bytes, 'base64'));
    return { proto: generic.proto, value: codec.unpack(SCHEMAS[generic.proto], Buffer.from(generic.bin, 'base64')) };
  });
}

test('proven status types map to the shipped FightTable.Buff tids only', () => {
  assert.equal(provenBuffTid('stun'), 10001);
  assert.equal(provenBuffTid('poison'), 11003);
  assert.equal(provenBuffTid('burn'), 11004);
  for (const unproven of ['frightened', 'chain', 'pursuit', 'strengthened', 'protection', 'silence', 'freeze']) {
    assert.equal(provenBuffTid(unproven), null, unproven + ' has no proven FightTable.Buff row');
  }
  assert.deepEqual(PROVEN_STATUS_BUFF_TIDS.map(entry => entry.tid), [10001, 11003, 11004]);
});

test('sign is the add/remove flag the client branches on', () => {
  // pb_buff_obj.sign: true adds layers, false removes them (proto comment plus
  // BuffChangeStep._OnStart and ParseBuff.DoBuff).
  assert.equal(BUFF_SIGN.ADD, true);
  assert.equal(BUFF_SIGN.REMOVE, false);
  assert.equal(BUFF_CHANGE_REASON.DISPEL, 1);
  assert.equal(BUFF_CHANGE_REASON.DEAD, 2);
});

test('an applied poison reports one add entry with the real tid, layer count and caster', () => {
  const skill = statusSkill(990001, 'poison');
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990001, skills: [skill] })],
    defenders: [fighter(201, { speed: 1, maxHp: 50000, attack: 1 })],
    seed: 7,
    maxRounds: 1
  });
  const additions = allBuffChanges(battle).filter(entry => entry.sign === BUFF_SIGN.ADD);
  assert.equal(additions.length, 1);
  assert.deepEqual(
    {
      aimId: additions[0].aimId,
      tid: additions[0].tid,
      overlay: additions[0].overlay,
      sign: additions[0].sign,
      casterId: additions[0].casterId,
      changeReason: additions[0].changeReason,
      abilityId: additions[0].abilityId
    },
    { aimId: 201, tid: 11003, overlay: 1, sign: true, casterId: 101, changeReason: BUFF_CHANGE_REASON.NONE, abilityId: 990001 }
  );
});

test('a stacked status reports only the layers each application added', () => {
  const skill = statusSkill(990011, 'poison', {
    duration: { durationType: 'timed', rounds: 6 },
    effect: { maxStacks: 3, stacks: 1 }
  });
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990011, skills: [skill] })],
    defenders: [fighter(201, { speed: 1, maxHp: 500000, attack: 1 })],
    seed: 21,
    maxRounds: 3
  });
  const additions = allBuffChanges(battle).filter(entry => entry.sign === BUFF_SIGN.ADD);
  assert.equal(additions.length, 3, 'each application reports its own layer delta');
  assert.deepEqual(additions.map(entry => entry.overlay), [1, 1, 1]);
  const applied = battle.events.filter(event => event.kind === 'effect' && event.statusType === 'poison');
  assert.deepEqual(applied.map(event => event.stacks), [1, 2, 3],
    'the server stack count advances by the reported deltas');
});

test('a refresh that adds no layer reports nothing', () => {
  const skill = statusSkill(990012, 'poison', {
    duration: { durationType: 'timed', rounds: 6 },
    effect: { maxStacks: 2, refresh: false }
  });
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990012, skills: [skill] })],
    defenders: [fighter(201, { speed: 1, maxHp: 500000, attack: 1 })],
    seed: 22,
    maxRounds: 3
  });
  const additions = allBuffChanges(battle).filter(entry => entry.sign === BUFF_SIGN.ADD);
  assert.equal(additions.length, 1, 'only the first application changed the layer count');
});

test('statuses without a proven FightTable.Buff row stay fail-closed', () => {
  const skill = statusSkill(990002, 'frightened');
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990002, skills: [skill] })],
    defenders: [fighter(201, { speed: 1, maxHp: 50000, attack: 1 })],
    seed: 11,
    maxRounds: 2
  });
  assert.equal(battle.events.some(event => event.kind === 'buff-change'), false,
    'an unmapped status must not invent a tid or a 103 packet');
  const target = battle.defenders.find(unit => unit.id === 201);
  assert.ok(target, 'the battle still ran with the status applied server-side');
});

test('an expiring timed status is reported as a removal carrying its layers', () => {
  const skill = statusSkill(990003, 'stun', {
    duration: { durationType: 'timed', rounds: 1 },
    effect: { stacks: 2 }
  });
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990003, skills: [skill] })],
    defenders: [fighter(201, { speed: 1, maxHp: 50000, attack: 1 })],
    seed: 13,
    maxRounds: 2
  });
  const entries = allBuffChanges(battle).filter(entry => entry.tid === 10001);
  const addition = entries.find(entry => entry.sign === BUFF_SIGN.ADD);
  assert.ok(addition, 'the stun is added first');
  assert.equal(addition.overlay, 2);
  const removal = entries.find(entry => entry.sign === BUFF_SIGN.REMOVE);
  assert.ok(removal, 'the timed stun expires and is reported');
  assert.equal(removal.overlay, 2, 'the removal subtracts the layers that were on the target');
  assert.equal(removal.changeReason, BUFF_CHANGE_REASON.NONE);
});

test('dead_rm statuses are removed when the holder dies', () => {
  const skill = statusSkill(990004, 'burn', {
    duration: { durationType: 'timed', rounds: 2 },
    effect: { tickInterval: 1, tickEffect: { type: 'damage', damageType: 'percent-max-hp', magnitude: 1, canCrit: false, variance: 1 } }
  });
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990004, skills: [skill], attack: 1 })],
    defenders: [fighter(201, { speed: 1, maxHp: 100, attack: 1 })],
    seed: 17,
    maxRounds: 2
  });
  assert.ok(battle.events.some(event => event.kind === 'death' && event.aimId === 201),
    'the burn tick kills the defender');
  const deathRemoval = allBuffChanges(battle)
    .find(entry => entry.tid === 11004 && entry.sign === BUFF_SIGN.REMOVE
      && entry.changeReason === BUFF_CHANGE_REASON.DEAD);
  assert.ok(deathRemoval, 'dead_rm=true turns the burn into a DEAD removal');
  assert.equal(deathRemoval.aimId, 201);
  assert.equal(deathRemoval.overlay, 1);
});

test('a cleanse reports the dispelled layers with change_reason DISPEL', () => {
  const skill = {
    id: '990005',
    type: 'Normal',
    implementation: {
      effects: [
        {
          target: { targetType: 'single' },
          effect: { type: 'status', statusType: 'poison', maxStacks: 3 },
          duration: { durationType: 'timed', rounds: 5 },
          chance: 1
        },
        {
          target: { targetType: 'single' },
          effect: { type: 'dispel', removeType: 'debuff', count: 1 },
          duration: { durationType: 'instant' },
          chance: 1
        }
      ]
    }
  };
  const battle = simulateBattle({
    attackers: [fighter(101, { abilityId: 990005, skills: [skill] })],
    defenders: [fighter(201, { speed: 1, maxHp: 500000, attack: 1 })],
    seed: 23,
    maxRounds: 1
  });
  const entries = allBuffChanges(battle).filter(entry => entry.tid === 11003);
  const addition = entries.find(entry => entry.sign === BUFF_SIGN.ADD);
  const dispel = entries.find(entry => entry.sign === BUFF_SIGN.REMOVE);
  assert.ok(addition, 'the poison is applied inside the same action');
  assert.ok(dispel, 'the cleanse is reported as a removal');
  assert.equal(dispel.changeReason, BUFF_CHANGE_REASON.DISPEL);
  assert.equal(dispel.casterId, 101);
  assert.equal(dispel.overlay, addition.overlay, 'a whole-entry dispel removes the layers it found');
  const dispelled = battle.events.find(event => event.kind === 'effect' && event.type === 'dispel');
  assert.equal(dispelled.count, 1);
  assert.deepEqual(dispelled.removed, ['poison'], 'the server state lost the poison');
  assert.equal(dispelled.removedDetail[0].stacks, addition.overlay);
});

test('the buff-change event projects to pb_fat_buff_change (proto 103)', () => {
  const simulation = {
    events: [
      { kind: 'round-start', round: 1 },
      { kind: 'action-start', id: 1, srcId: 101, assistIds: [], aimList: [201], abilityId: 990006, actionType: 1 },
      { kind: 'buff-change', id: 1, buffs: [{
        aimId: 201, tid: 11003, overlay: 2, sign: BUFF_SIGN.ADD, casterId: 101,
        changeReason: BUFF_CHANGE_REASON.NONE, abilityId: 990006
      }, {
        aimId: 201, tid: 10001, overlay: 1, sign: BUFF_SIGN.REMOVE, casterId: 101,
        changeReason: BUFF_CHANGE_REASON.DISPEL, abilityId: 0
      }] },
      { kind: 'action-end', id: 1 },
      { kind: 'round-end', round: 1 }
    ]
  };
  const buff = decode(actionList(codec, simulation)).find(packet => packet.proto === 103);
  assert.ok(buff, 'proto 103 must be emitted');
  assert.equal(Number(buff.value.id), 1);
  assert.equal(buff.value.buff_list.length, 2);
  const [added, removed] = buff.value.buff_list;
  assert.equal(Number(added.aim_id), 201);
  assert.equal(String(added.tid), '11003');
  assert.equal(Number(added.overlay), 2);
  assert.equal(Boolean(added.sign), true, 'an add carries sign=true');
  assert.equal(Number(added.ab_tid), 990006);
  assert.equal(Number(added.caster_id), 101);
  assert.equal(Number(added.change_reason ?? 0), BUFF_CHANGE_REASON.NONE);
  assert.equal(String(removed.tid), '10001');
  assert.equal(Number(removed.overlay), 1);
  // Protobuf omits a false bool, so a removal decodes with sign unset.
  assert.equal(Boolean(removed.sign), false, 'a removal carries sign=false');
  assert.equal(Number(removed.change_reason ?? 0), BUFF_CHANGE_REASON.DISPEL);
});
