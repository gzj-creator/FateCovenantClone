import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateBattle } from '../game/battle-engine.mjs';
import { EffectExecutor } from '../game/effects/effect-executor.mjs';
import { loadSkillDatabase, skillToEffects } from '../game/effects/skill-integration.mjs';
import { actionList } from '../game/mission-fight-service.mjs';
import { createGameCodec } from '../protocol/game-codec.mjs';
import {
  PROPRIETARY_HOOKS, addLayer, createProprietaryState, layerValue, runHooks,
} from '../game/effects/proprietary-state.mjs';
import { initProprietaryBattle } from '../game/effects/proprietary-rules.mjs';

const database = loadSkillDatabase();
const codec = createGameCodec();

const REPORT_SCHEMAS = {
  103: 'pb_fat_buff_change',
  106: 'pb_fat_harm',
  109: 'pb_fat_shield',
};

function decodeReportActions(events) {
  return actionList(codec, { events }).map(bytes => {
    const generic = codec.unpack('pb_generic', Buffer.from(bytes, 'base64'));
    const schema = REPORT_SCHEMAS[generic.proto];
    if (!schema) return null;
    return {
      proto: generic.proto,
      value: codec.unpack(schema, Buffer.from(generic.bin, 'base64')),
    };
  }).filter(Boolean);
}

function catalogSkill(id) {
  const skill = database.heroes.flatMap(hero => hero.skills)
    .find(row => String(row.id) === String(id));
  assert.ok(skill, 'Missing production skill ' + id);
  return skill;
}

function fighter(id, overrides = {}) {
  return {
    id, role: 2010201, profession: 2, loc: id, maxHp: 1000,
    attack: 100, defense: 0, speed: 90, initialEnergy: 0, skills: [], ...overrides,
  };
}

test('250404 uses the caster max-HP basis and adds 40% only against an unshielded target', () => {
  const skill = catalogSkill('2504040123');
  const effects = skillToEffects(skill, database);
  assert.equal(effects[0].effect.type, 'destroy-shield');
  assert.equal(effects[0].effect.ratio, 0.35);
  const damage = effects.find(definition => definition.effect.type === 'damage').effect;
  assert.equal(damage.damageType, 'magical');
  assert.equal(damage.damageBasis, 'actor-max-hp');
  assert.equal(damage.magnitude, 0.2);
  assert.equal(damage.multiplier, undefined);
  assert.deepEqual(damage.conditionalDamage, {
    condition: 'target-no-shield', multiplier: 0.4,
  });

  const actor = {
    id: 101, team: 1, maxHp: 10000, hp: 10000, attack: 100,
    buffs: [], debuffs: [],
  };
  const target = {
    id: 201, team: 2, maxHp: 50000, hp: 50000, defense: 0,
    shield: 0, alive: true, buffs: [], debuffs: [],
  };
  const state = {
    random: () => 0.5, events: [], round: 1,
    actionContext: { actionType: 'tianji', phase: 'action', damage: new Map() },
  };
  const executor = new EffectExecutor(state);
  const unshielded = executor.executeDamage(damage, actor, target);
  assert.equal(unshielded.value, 2800, '20% of 10,000 max HP is 2,000 before the 40% condition');

  const shieldedTarget = {
    ...target, id: 202, shield: 500, hp: 50000, buffs: [], debuffs: [],
  };
  const shielded = executor.executeDamage(damage, actor, shieldedTarget);
  assert.equal(shielded.value, 2000, 'the bonus is absent while the target has any shield');
});

test('狐魅领域 grants allies and drains enemies 100 energy after normal/ultimate actions', () => {
  const battle = simulateBattle({
    attackers: [
      fighter(101, {
        role: 5040201, loc: 1, maxHp: 5000, attack: 10, speed: 150,
        initialTianji: 3, activeAbilityId: 2504020123,
        skills: [catalogSkill('2504020123')],
      }),
      fighter(102, { loc: 2, maxHp: 1000, attack: 1, speed: 120 }),
    ],
    defenders: [
      fighter(201, { loc: 1, maxHp: 200000, attack: 1, speed: 110, initialEnergy: 500 }),
      fighter(202, { loc: 2, maxHp: 200000, attack: 1, speed: 100, initialEnergy: 500 }),
    ],
    seed: 71,
    maxRounds: 1,
  });

  const domains = battle.events.filter(event => event.kind === 'proprietary-domain');
  assert.equal(domains.length, 1);
  assert.equal(domains[0].name, '狐魅领域');
  assert.equal(domains[0].rounds, 2);

  const energyEvents = battle.events.filter(event => event.kind === 'effect'
    && event.type === 'energy' && event.reason === 'domain-action-energy');
  assert.ok(energyEvents.length >= 2, 'at least one later action must exercise the field');
  assert.ok(energyEvents.some(event => event.target === 101 && event.energyType === 'gain'
    && event.magnitude === 100));
  assert.ok(energyEvents.some(event => event.target === 201 && event.energyType === 'loss'
    && event.magnitude === 100));
  assert.ok(energyEvents.filter(event => event.energyType === 'gain')
    .every(event => event.newEnergy === Math.min(1000, event.oldEnergy + 100)));
  assert.ok(energyEvents.filter(event => event.energyType === 'loss')
    .every(event => event.newEnergy === Math.max(0, event.oldEnergy - 100)));
});

test('proprietary shield destruction and domain heals are projected into the client report', () => {
  const packets = decodeReportActions([
    { kind: 'proprietary-shield-destroyed', id: 7, aimId: 201, srcId: 101, shield: 325 },
    {
      kind: 'effect', id: 7, type: 'heal', actor: 101, target: 102,
      value: 150, actualHeal: 150, oldHp: 850, newHp: 1000,
    },
  ]);
  const shield = packets.find(packet => packet.proto === 109);
  assert.ok(shield, 'shield destruction needs a pb_fat_shield packet');
  assert.equal(Number(shield.value.id), 7);
  assert.equal(Number(shield.value.aim_id), 201);
  assert.equal(Number(shield.value.shield), 325);

  const heal = packets.find(packet => packet.proto === 106);
  assert.ok(heal, 'direct domain healing needs a heal prompt');
  assert.equal(Number(heal.value.id), 7);
  assert.equal(Number(heal.value.harm_list[0].type), 107);
  assert.equal(Number(heal.value.harm_list[0].value), 150);
});

test('220401 restores 150 energy to every ally only when its Tianji cast causes no kill', () => {
  const skill = catalogSkill('2204010123');
  const run = enemyHp => simulateBattle({
    attackers: [
      fighter(101, {
        role: 2040101, loc: 1, maxHp: 8000, attack: 500, speed: 180,
        initialTianji: 3, activeAbilityId: '2204010123', skills: [skill],
      }),
      fighter(102, { loc: 2, maxHp: 1000, attack: 1, speed: 90 }),
    ],
    defenders: [fighter(201, { loc: 1, maxHp: enemyHp, attack: 1, speed: 10 })],
    seed: 13,
    maxRounds: 1,
  });

  const surviving = run(1000000);
  const gains = surviving.events.filter(event => event.kind === 'effect'
    && event.type === 'energy' && event.reason === 'no-kill-energy');
  assert.deepEqual(gains.map(event => event.target).sort(), [101, 102]);
  assert.ok(gains.every(event => event.newEnergy === Math.min(1000, event.oldEnergy + 150)));

  const lethal = run(1);
  assert.equal(lethal.events.some(event => event.reason === 'no-kill-energy'), false,
    'a kill by any target suppresses the no-kill branch');
});

test('630302 reads live debuff layers for its 15% heal and 200-energy thresholds', () => {
  const reward = catalogSkill('6303020105');
  const debuffSkill = {
    id: 'debug-debuff-aura', name: 'debug debuff aura', type: 'Passive',
    description: 'test fixture', implementation: {
      effects: [],
      triggers: Array.from({ length: 9 }, (_, index) => ({
        triggerType: 'on-round-start', condition: null, conditionKey: null,
        cooldown: 0, maxTriggers: 0, oncePerBattle: true, oncePerRound: false,
        priority: index, chance: 1,
        effect: {
          target: { targetType: 'all-enemies' },
          effect: {
            type: 'stat-modifier', statType: 'attack-percent', magnitude: -0.01,
            isPercentage: true,
          },
          duration: { durationType: 'instant', rounds: 0 }, chance: 1,
        },
      })),
    },
  };
  const battle = simulateBattle({
    attackers: [fighter(101, {
      role: 630302, loc: 1, maxHp: 1000, attack: 100, speed: 100,
      abilityId: '6303020105', activeAbilityId: '6303020105', skills: [reward, debuffSkill],
    })],
    defenders: [fighter(201, { loc: 1, maxHp: 100000, attack: 100, speed: 200 })],
    seed: 29,
    maxRounds: 1,
  });
  const heals = battle.events.filter(event => event.kind === 'effect'
    && event.type === 'heal' && event.actor === 101);
  assert.ok(heals.length >= 1, 'three or more debuff layers trigger the 15% max-HP heal');
  assert.ok(heals.every(event => event.actualHeal <= 150));
  const energy = battle.events.find(event => event.kind === 'effect' && event.type === 'energy'
    && event.reason === 'debuff-threshold-energy');
  assert.ok(energy, 'nine debuff layers also restore 200 energy');
});

test('344020175 revives its owner at full HP with 1000 energy and post-revive stats', () => {
  const battle = simulateBattle({
    attackers: [fighter(101, {
      role: 3440201, loc: 1, maxHp: 1000, attack: 1, speed: 10,
      activeAbilityId: '344020175', skills: [catalogSkill('344020175')],
    })],
    defenders: [fighter(201, { loc: 1, maxHp: 100000, attack: 10000, speed: 200 })],
    seed: 5,
    maxRounds: 2,
  });
  const revive = battle.events.find(event => event.kind === 'revive' && event.aimId === 101);
  assert.ok(revive, 'the death hook must revive before the battle-end check');
  assert.equal(Number(revive.hp), 1000);
  assert.equal(Number(revive.energy), 1000);
});

test('640305 replaces the 160%-attack approximation with 16% target lost HP and a 240% attack cap', () => {
  const effects = skillToEffects(catalogSkill('6403050105'), database);
  const damage = effects.find(definition => definition.effect.type === 'damage').effect;
  assert.equal(damage.damageBasis, 'target-lost-hp');
  assert.equal(damage.magnitude, 0.16);
  assert.equal(damage.multiplier, undefined);
  assert.deepEqual(damage.damageCap, { basis: 'attack', ratio: 2.4 });

  const actor = { id: 101, team: 1, maxHp: 1000, hp: 1000, attack: 100, buffs: [], debuffs: [] };
  const target = { id: 201, team: 2, maxHp: 1000, hp: 400, defense: 0, shield: 0, alive: true, buffs: [], debuffs: [] };
  const executor = new EffectExecutor({
    random: () => 0.5, round: 1,
    actionContext: { actionType: 'ultimate', phase: 'action', damage: new Map() },
  });
  assert.equal(executor.executeDamage(damage, actor, target).value, 96);

  const cappedActor = { ...actor, attack: 10 };
  const cappedTarget = { ...target, id: 202, hp: 1 };
  assert.equal(executor.executeDamage(damage, cappedActor, cappedTarget).value, 24,
    '16% of 999 lost HP is capped by 240% of the caster attack');
});

test('640103 resolves freeze success and silence failure with shipped buff TIDs', () => {
  const skill = catalogSkill('6401030108');
  const run = seed => simulateBattle({
    attackers: [fighter(101, {
      role: 3030501, loc: 1, maxHp: 10000, attack: 100, speed: 200,
      initialEnergy: 1000, abilityId: '6401030108', activeAbilityId: '6401030108', skills: [skill],
    })],
    defenders: [fighter(201, {
      role: 1, loc: 1, maxHp: 100000, attack: 1, speed: 1, initialEnergy: 0,
    })],
    seed, maxRounds: 1,
  });

  const success = run(2);
  assert.ok(success.events.some(event => event.kind === 'effect' && event.statusType === 'freeze'));
  assert.ok(success.events.some(event => event.kind === 'status-skip' && event.srcId === 201),
    'a frozen target skips its action in the round');
  const energy = success.events.find(event => event.kind === 'effect'
    && event.type === 'energy' && event.reason === 'freeze-success-energy');
  assert.ok(energy);
  assert.equal(energy.magnitude, 200);
  assert.equal(energy.newEnergy, 200, 'ultimate energy was spent before the rare-skill reward');
  const successBuff = decodeReportActions(success.events)
    .find(packet => packet.proto === 103);
  assert.equal(Number(successBuff.value.buff_list[0].tid), 10002);

  const failure = run(1);
  assert.ok(failure.events.some(event => event.kind === 'effect' && event.statusType === 'silence'));
  assert.equal(failure.events.some(event => event.kind === 'status-skip' && event.srcId === 201), false,
    'silence blocks skills but does not skip the action');
  assert.equal(failure.events.some(event => event.reason === 'freeze-success-energy'), false);
  const failureBuff = decodeReportActions(failure.events)
    .find(packet => packet.proto === 103);
  assert.equal(Number(failureBuff.value.buff_list[0].tid), 10003);
});

test('640305 teammate controls restore 150 energy at most three times per round', () => {
  const controlSkill = {
    id: '990640305', name: 'control fixture', type: 'Ultimate', description: 'test',
    implementation: {
      effects: [{
        target: { targetType: 'single' },
        effect: { type: 'status', statusType: 'stun', stacks: 1 },
        duration: { durationType: 'timed', rounds: 1 }, chance: 1,
      }],
      triggers: [],
    },
  };
  const controllers = [102, 103, 104, 105].map((id, index) => fighter(id, {
    role: 3030501, loc: index + 2, maxHp: 10000, attack: 1, speed: 190 - index,
    initialEnergy: 1000, abilityId: '990640305', activeAbilityId: '990640305',
    skills: [controlSkill],
  }));
  const battle = simulateBattle({
    attackers: [
      fighter(101, {
        role: 4030501, loc: 1, maxHp: 10000, attack: 1, speed: 1,
        initialEnergy: 0, activeAbilityId: '6403050105', skills: [catalogSkill('6403050105')],
      }),
      ...controllers,
    ],
    defenders: [fighter(201, {
      role: 1, loc: 1, maxHp: 1000000, attack: 1, speed: 0.5, initialEnergy: 0,
    })],
    seed: 19, maxRounds: 1,
  });
  const rewards = battle.events.filter(event => event.kind === 'effect'
    && event.type === 'energy' && event.reason === 'control-ally-energy');
  assert.equal(rewards.length, 3);
  assert.ok(rewards.every(event => event.actor !== 101 && event.target === 101
    && event.magnitude === 150));
});

test('狐佑 heals only the ally that actually completes the action', () => {
  const skill = catalogSkill('2504020123');
  const makeUnit = (id, speed) => ({
    ...fighter(id, {
      role: id === 101 ? 5040201 : 2010201, loc: id - 100, maxHp: 1000,
      attack: 10, defense: 0, speed, initialEnergy: 0, skills: id === 101 ? [skill] : [],
    }),
    team: 1, hp: 1000, shield: 0, energy: 0, alive: true,
    buffs: [], debuffs: [], proprietary: createProprietaryState({ initialTianji: 3 }),
  });
  const owner = makeUnit(101, 100);
  const ally = makeUnit(102, 90);
  const events = [];
  const state = {
    allUnits: [owner, ally], round: 1, currentActionId: 1, events,
    random: () => 0.5,
  };
  initProprietaryBattle(owner, state, events);
  initProprietaryBattle(ally, state, events);

  runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {
    actor: owner, actionId: 1, useSkill: true, skill,
    actionType: 'ultimate', extra: false,
  }, events);
  events.length = 0;
  owner.hp = 500;
  ally.hp = 500;

  runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {
    actor: ally, actionId: 2, useSkill: false, actionType: 'attack', extra: false,
  }, events);
  const heals = events.filter(event => event.kind === 'effect' && event.type === 'heal');
  assert.deepEqual(heals.map(event => event.target), [102]);
  assert.equal(heals[0].actualHeal, 150);
  assert.equal(owner.hp, 500, 'the non-acting domain ally is not healed');
  assert.equal(ally.hp, 650);
});

test('80 月光 restores 240 energy and every 月光 layer is removed after the Tianji action', () => {
  const skill = catalogSkill('2404030123');
  const run = layers => {
    const unit = {
      ...fighter(101, {
        role: 5040301, loc: 1, maxHp: 10000, attack: 100, speed: 100,
        initialEnergy: 0, activeAbilityId: '2404030123', skills: [skill],
      }),
      team: 1, hp: 10000, shield: 0, energy: 0, alive: true,
      buffs: [], debuffs: [], proprietary: createProprietaryState({}),
    };
    const events = [];
    const state = {
      allUnits: [unit], round: 1, currentActionId: 7, events,
      random: () => 0.5,
    };
    initProprietaryBattle(unit, state, events);
    addLayer(unit, '月光', layers, { max: 100 });
    runHooks(state, PROPRIETARY_HOOKS.ACTION_END, {
      actor: unit, actionId: 7, useSkill: true, skill,
      actionType: 'tianji', extra: false,
    }, events);
    return { unit, events };
  };

  const threshold = run(80);
  const energy = threshold.events.find(event => event.kind === 'effect'
    && event.type === 'energy' && event.reason === 'moonlight-threshold-energy');
  assert.equal(energy.magnitude, 240);
  assert.equal(layerValue(threshold.unit, '月光'), 0);

  const below = run(79);
  assert.equal(below.events.some(event => event.reason === 'moonlight-threshold-energy'), false);
  assert.equal(layerValue(below.unit, '月光'), 0);
});
