import test from 'node:test';
import assert from 'node:assert/strict';
import { tableAsset } from '../assets.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { readGeneratedTables, readHeroTables } from '../config/hero-tables.mjs';
import { readFightAbilityTypes } from '../config/fight-ability-types.mjs';
import { buildLineupAttrInfo, createLineupAttributeCache } from '../game/attribute-service.mjs';
import { FIGHT_ENERGY_MAX, simulateBattle } from '../game/battle-engine.mjs';
import { applySkillEffects, loadSkillDatabase, resolveActionSkill } from '../game/effects/skill-integration.mjs';
import { buildHeroSkillLoadout, selectFightActionIds } from '../game/hero-skill-loadout.mjs';
import { actionList, reportBattle, reportGuideDemoBattle } from '../game/mission-fight-service.mjs';
import { rosterFor, simulatePvpBattle } from '../game/pvp-battle.mjs';
import { createGameCodec } from '../protocol/game-codec.mjs';

const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const database = loadSkillDatabase();
const codec = createGameCodec();
const { Rare, Diff } = readGeneratedTables(tableAsset('HeroTable.data.lua.json'), ['Rare', 'Diff']);

test('the three fifth-tier crit masteries modify the same ultimate hit without a borrowed HP hit', () => {
  const abilityId = '2102030113';
  const ultimate = { id: abilityId, type: 'Ultimate', implementation: { effects: [{
    target: { targetType: 'single' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, variance: 1 }
  }] } };
  const tianji = { ...ultimate, id: '2504010123', description: '消耗3点天极值' };
  const play = (skills, initialEnergy, critChance = 0.2, initialTianji = 0) => {
    const report = simulateBattle({
      attackers: [{ id: 101, maxHp: 10000, attack: 100, speed: 100, critChance, critMultiplier: 1.5,
        initialEnergy, initialTianji, abilityId: 1102030101, activeAbilityId: Number(abilityId),
        tianjiAbilityId: Number(tianji.id), skills: [ultimate, tianji, ...skills] }],
      defenders: [{ id: 201, maxHp: 100000, attack: 1, speed: 1, defense: 0, skills: [] }],
      maxRounds: 1, seed: 1,
    });
    return report.events.filter(event => event.kind === 'action-start' && event.srcId === 101).map(action => ({
      id: action.abilityId,
      damage: report.events.filter(event => event.kind === 'damage' && event.id === action.id)
        .flatMap(event => event.harms).map(harm => harm.value),
    }));
  };
  const extra = database.heroes.flatMap(hero => hero.skills).find(skill => skill.id === '324020173');
  assert.deepEqual(play([], FIGHT_ENERGY_MAX), [{ id: Number(abilityId), damage: [100] }]);
  for (const [tid, id] of [[1020301, '312030175'], [3030301, '333030175'], [3030701, '333070175']]) {
    const skill = database.heroes.find(hero => Number(hero.id) === tid).skills.find(skill => skill.id === id);
    assert.deepEqual(play([skill], FIGHT_ENERGY_MAX), [{ id: Number(abilityId), damage: [165] }], id);
    assert.deepEqual(play([skill], 0, 1), play([], 0, 1), `${id} does not modify normal attacks`);
    assert.deepEqual(play([skill], 0, 1, 3), [{ id: Number(tianji.id), damage: [150] }], `${id} does not modify Tianji`);
    const free = play([skill, extra], 0, 1);
    assert.deepEqual(free, [play([], 0, 1)[0], { id: Number(abilityId), damage: [165] }], `${id} applies to free ordinary ultimate`);
  }
});

function heroAt(tid, overrides = {}) {
  const { quality, star } = heroTables.Hero.get(tid);
  return { uid: String(tid), tid, quality, star, level: 1, breakthrough_level: 0, rare: false, ...overrides };
}

function modelFor(hero) {
  return {
    state: { roleId: 1, modules: { value: [] } },
    role: { level: 1 },
    heroInfo: { hero_list: [hero] },
    playLineups: [{ type: 1, team_list: [{ team_id: 1, fighter_list: [{ hero_id: hero.uid, loc: 1 }] }] }]
  };
}

function packets(report, proto, schema) {
  return report.action_list.map(bytes => codec.unpack('pb_generic', bytes))
    .filter(packet => Number(packet.proto) === proto)
    .map(packet => codec.unpack(schema, Buffer.from(packet.bin, 'base64')));
}

function firstActive(battle) {
  return packets(battle, 101, 'pb_fat_action_before')
    .find(packet => Number(packet.src_id) === 101 && Number(packet.type) === 2);
}

function pvpFor(hero, foe = heroAt(2010101), defenderHp = 1000000) {
  const roster = member => rosterFor({ model: modelFor(member), heroTables, attributeTables });
  const defender = roster(foe);
  defender.entries[0].stats = { ...defender.entries[0].stats, hp: defenderHp, attack: 1, speed: 1, critRate: 0 };
  return simulatePvpBattle({ codec, attacker: roster(hero), defender, heroTables, seedText: hero.uid });
}

function journeyFor(hero) {
  const attempts = [10201, 20201].map(missionId => reportBattle(codec, modelFor(hero), { missionId }, {}, attributeTables));
  return attempts.find(firstActive) ?? attempts[0];
}

function lineupSkills(hero) {
  const info = buildLineupAttrInfo({ model: modelFor(hero), heroTables, attributeTables });
  const wire = codec.unpack('pb_attr_lineup_all_info', codec.pack('pb_attr_lineup_all_info', info));
  return wire.lineup_attr.attr_list[0].skills.map(Number);
}

assert.equal(Rare.size, 9);
for (const [tid, { skill: rareId }] of Rare) {
  test(`${tid} ordinary active is never executed as Rare.skill ${rareId} in Journey or PvP`, () => {
    const hero = heroAt(tid);
    const activeId = heroTables.Ability.get(tid).ability[1];
    for (const report of [journeyFor(hero), pvpFor(hero).battle]) {
      const fighter = report.fighter_list.find(unit => unit.id === 101);
      assert.equal(Number(firstActive(report)?.ab_tid), activeId, 'ordinary action must actually be used');
      const effect = resolveActionSkill(fighter, true, database);
      assert.equal(Number(effect?.id ?? activeId), activeId, 'the executed effect must match the reported action');
      assert.ok(!fighter.skills.some(skill => Number(skill.id) === rareId), 'locked form must not enter the loadout');
    }
  });
}

test('an explicitly supplied active definition cannot supply effects for another action ID', () => {
  const role = 3030501;
  const activeAbilityId = heroTables.Ability.get(role).ability[1];
  const rareSkill = database.heroes.find(hero => Number(hero.id) === role).skills
    .find(skill => Number(skill.id) === Rare.get(role).skill);
  assert.ok(rareSkill);
  assert.equal(resolveActionSkill({ role, activeAbilityId, skills: [rareSkill] }, true, database), null);
});

test('Vell retains its exact ordinary active and heals in a real PvP report', () => {
  const { battle } = pvpFor(heroAt(4030801));
  const fighter = battle.fighter_list.find(unit => unit.id === 101);
  assert.equal(Number(firstActive(battle)?.ab_tid), 2403080113);
  assert.equal(Number(resolveActionSkill(fighter, true, database)?.id), 2403080113);
  const heals = packets(battle, 106, 'pb_fat_harm').flatMap(packet => packet.harm_list);
  assert.ok(heals.some(harm => Number(harm.type) === 107 && Number(harm.src_id) === 101 && Number(harm.value) > 0));
});

test('Vell spends ordinary anger before Princess Arrives restores anger to the actual healing recipient', () => {
  const hero = heroAt(4030801);
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const actionIds = selectFightActionIds(abilityIds);
  assert.equal(actionIds.activeAbilityId, 2403080113);
  const strike = { id: '1201010101', type: 'Normal', implementation: { effects: [
    { target: { targetType: 'single' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 } },
  ] } };
  for (const [recipientId, camp, recovery, anger] of [[101, 4, 180, 120], [102, 4, 180, 200], [102, 3, 120, 160]]) {
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: recipientId === 101 ? 1 : 4, camp: 4, maxHp: 1000, attack: 100, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, skills, ...actionIds },
      { id: 102, loc: recipientId === 101 ? 4 : 1, camp, maxHp: 1000, attack: 1, speed: 10,
        initialEnergy: 0, activeAbilityId: null, skills: [] }],
      defenders: [{ id: 201, loc: 1, maxHp: 10000, attack: 700, speed: 200,
        abilityId: Number(strike.id), activeAbilityId: null, skills: [strike] }],
      maxRounds: 1,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    assert.equal(Number(cast?.ab_tid), 2403080113);
    assert.deepEqual(cast.aim_list.map(Number), [recipientId]);
    const heals = packets(report, 106, 'pb_fat_harm').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.harm_list).map(harm => [harm.type, harm.aim_id, harm.value, harm.old_hp, harm.hp].map(Number));
    assert.deepEqual(heals, [[107, recipientId, recovery, 300, 300 + recovery]]);
    const energy = packets(report, 116, 'pb_fat_attr_sync').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.attr_list).map(attr => [Number(attr.aim_id), Number(attr.attr_val ?? 0)]);
    assert.deepEqual(energy, recipientId === 101 ? [[101, anger + 50]] : [[101, 50], [recipientId, anger]]);
    const restored = simulation.events.filter(event => event.id === Number(cast.id)
      && event.kind === 'effect' && event.type === 'energy');
    assert.deepEqual(restored.map(event => [event.target, event.oldEnergy, event.newEnergy]), [
      [recipientId, recipientId === 101 ? 0 : 80, anger], [101, recipientId === 101 ? anger : 0, (recipientId === 101 ? anger : 0) + 50],
    ]);
  }
});

test('Lunael uses her exact Scarlet Field active and its separately capped defense hit', () => {
  const hero = heroAt(1030101);
  const id = 2103010113;
  assert.ok(lineupSkills(hero).includes(id));
  for (const report of [journeyFor(hero), pvpFor(hero).battle]) {
    assert.equal(Number(firstActive(report)?.ab_tid), id);
    const fighter = report.fighter_list.find(unit => unit.id === 101);
    assert.equal(Number(resolveActionSkill(fighter, true, database)?.id), id);
  }
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const active = skills.find(skill => Number(skill.id) === id);
  assert.equal(active.name, '猩红领域');
  assert.equal(active.implementation.abilityDes.text, 601501000);
  assert.equal(active.implementation.effects[0].effect.multiplier, 1.27);
  for (const [defense, trueDamage] of [[120, 120], [300, 150]]) {
    const simulation = simulateBattle({
      attackers: [{ id: 101, role: hero.tid, loc: 1, maxHp: 1000, attack: 100, defense, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, skills, critChance: 0, ...selectFightActionIds(abilityIds) }],
      defenders: [1, 3, 5].map((loc, index) => ({ id: 201 + index, loc, maxHp: 10000, attack: 1, defense: 1000, skills: [] })),
      maxRounds: 1, seed: 2,
    });
    const action = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(action.abilityId, id);
    assert.deepEqual(action.aimList, [201, 202]);
    const hits = simulation.events.filter(event => event.kind === 'damage' && event.id === action.id).flatMap(event => event.harms);
    assert.deepEqual(hits.map(hit => hit.aimId), [201, 202, 201, 202]);
    assert.deepEqual(hits.slice(2).map(hit => [hit.value, hit.critical]), [[trueDamage, false], [trueDamage, false]]);
  }
});

test('Dream does not cast the passive 2103060113 when its anger reaches the action threshold', () => {
  const dream = heroAt(1030601);
  const pvp = pvpFor(dream);
  for (const report of [journeyFor(dream), pvp.battle]) {
    const fighter = report.fighter_list.find(unit => unit.id === 101);
    assert.ok(fighter.ability_list.includes(2103060113), 'the configured passive remains in the reported list');
    const actions = packets(report, 101, 'pb_fat_action_before').filter(action => Number(action.src_id) === 101);
    assert.ok(actions.length > 0);
    assert.deepEqual([...new Set(actions.map(action => [action.type, action.ab_tid].map(Number).join(':')))], ['1:1103060101']);
  }
  assert.equal(pvp.simulation.attackers[0].energy, 1000);
});

function fixedDamage(skill) {
  if (!skill) return [];
  const { implementation } = skill;
  return [{ ...skill, implementation: { ...implementation,
    effects: implementation.effects.map(definition => definition.effect.type !== 'damage' ? definition
      : { ...definition, effect: { ...definition.effect, variance: 1 } }) } }];
}

function ordinaryEnergyTrial(tid, quality, id, seed = 1) {
  const hero = heroAt(tid, { quality });
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const actionIds = selectFightActionIds(abilityIds);
  assert.equal(actionIds.activeAbilityId, id);
  const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
  assert.equal(Number(selected?.id), id, 'the ordinary effect must use the original action ID');
  const simulation = simulateBattle({
    attackers: [{ id: 101, role: tid, loc: 1, maxHp: 10000, attack: 1000, speed: 100,
      initialEnergy: FIGHT_ENERGY_MAX, critChance: 0, skills: fixedDamage(selected), ...actionIds }],
    defenders: [1, 4, 6].map((loc, index) => ({ id: 201 + index, loc, maxHp: 10000, attack: 1,
      speed: 1, defense: 0, initialEnergy: 600, initialTianji: 2, skills: [], activeAbilityId: null })),
    maxRounds: 1, seed,
  });
  const action = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
  assert.equal(action.abilityId, id);
  assert.equal(action.actionType, 2);
  const events = simulation.events.filter(event => event.id === action.id);
  assert.ok(!events.some(event => event.kind === 'shield' || event.kind === 'heal'));
  assert.ok(!simulation.events.some(event => event.kind === 'proprietary-tianji'));
  return {
    selected, targets: action.aimList,
    hits: events.filter(event => event.kind === 'damage').flatMap(event => event.harms).map(harm => [harm.aimId, harm.value]),
    drains: events.filter(event => event.kind === 'effect' && event.type === 'energy')
      .map(event => [event.target, event.oldEnergy, event.newEnergy]),
    syncedAnger: events.find(event => event.kind === 'anger-sync').attrList.map(attr => [attr.aimId, attr.attrValue]),
  };
}

test('a seeded random-three finisher replays the same target group that was hit and drained', () => {
  const target = { targetType: 'random-count', count: 3 };
  const finisher = { id: '2403020113', type: 'Ultimate', implementation: { effects: [
    { target, targetGroup: 'hit', effect: { type: 'damage', damageType: 'magical', multiplier: 1.27, canCrit: false, variance: 1 } },
    { target, targetGroup: 'hit', effect: { type: 'energy', energyType: 'loss', magnitude: 150 } },
  ] } };
  const play = (seed, locations) => {
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 1, maxHp: 10000, attack: 1000, speed: 100, initialEnergy: FIGHT_ENERGY_MAX,
        activeAbilityId: Number(finisher.id), skills: [finisher] }],
      defenders: locations.map((loc, index) => ({ id: 201 + index, loc, maxHp: 10000, attack: 1,
        speed: 1, initialEnergy: 600, activeAbilityId: null, skills: [] })),
      maxRounds: 1, seed,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    assert.equal(Number(cast.ab_tid), Number(finisher.id));
    const aims = cast.aim_list.map(Number);
    assert.equal(new Set(aims).size, Math.min(3, locations.length));
    const harms = packets(report, 106, 'pb_fat_harm').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.harm_list).map(harm => [Number(harm.aim_id), Number(harm.value)]);
    assert.deepEqual(harms.sort((left, right) => left[0] - right[0]), aims.map(id => [id, 1270]));
    const anger = packets(report, 116, 'pb_fat_attr_sync').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.attr_list).map(attr => [Number(attr.aim_id), Number(attr.attr_val ?? 0)]);
    assert.deepEqual(anger, [[101, 0], ...aims.map(id => [id, 530])]);
    return aims;
  };
  const locations = [1, 2, 4, 5, 6];
  const baseline = play(8, locations);
  assert.deepEqual(play(8, locations), baseline);
  assert.notDeepEqual(play(12, locations), baseline);
  assert.deepEqual(play(12, [1, 4]), [201, 202]);
});

test('Bard plays the exact three Aria tiers with area magic damage and per-target anger loss', () => {
  for (const [quality, id, key, damage] of [
    [30, 2101010111, 601501020, 710],
    [40, 2101010112, 601501021, 750],
    [50, 2101010113, 601501022, 830],
  ]) {
    const trial = ordinaryEnergyTrial(1010101, quality, id);
    assert.equal(trial.selected.implementation.abilityDes.text, key);
    assert.equal(trial.selected.implementation.effects[0].effect.damageType, 'magical');
    assert.equal(trial.selected.implementation.effects[1].chance, 0.5);
    assert.deepEqual(trial.targets, [201, 202, 203]);
    assert.deepEqual(trial.hits, [[201, damage], [202, damage], [203, damage]]);
    assert.deepEqual(trial.drains, [[202, 680, 530], [203, 680, 530]]);
    assert.deepEqual(trial.syncedAnger, [[101, 0], [201, 680], [202, 530], [203, 530]]);
  }
  const base = heroAt(1010101);
  assert.ok(lineupSkills(base).includes(2101010111));
  assert.equal(Number(firstActive(pvpFor(base).battle)?.ab_tid), 2101010111);
});

test('Hunter attacks only the enemy back row and removes ordinary anger on each successful roll', () => {
  for (const [quality, id, key, damage] of [
    [40, 2102020112, 601501009, 1140],
    [50, 2102020113, 601501010, 1270],
  ]) {
    const trial = ordinaryEnergyTrial(1020201, quality, id, 4);
    assert.equal(trial.selected.implementation.abilityDes.text, key);
    assert.equal(trial.selected.implementation.effects[0].effect.damageType, 'physical');
    assert.equal(trial.selected.implementation.effects[1].chance, 0.75);
    assert.deepEqual(trial.targets, [202, 203]);
    assert.deepEqual(trial.hits, [[202, damage], [203, damage]]);
    assert.deepEqual(trial.drains, [[202, 680, 430]]);
    assert.deepEqual(trial.syncedAnger, [[101, 0], [202, 430], [203, 680]]);
  }
  assert.ok(lineupSkills(heroAt(1020201)).includes(2102020112));
});

test('Hug Messenger slows anger gains only for the target of her three Love Hug tiers', () => {
  for (const [quality, id, textId, amount] of [
    [30, 2301010111, 601501064, 2110], [40, 2301010112, 601501065, 2240], [50, 2301010113, 601501066, 2480],
  ]) {
    const hero = heroAt(3010101, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, textId);
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 1, maxHp: 100000, attack: 1000, speed: 100, critChance: 0,
        initialEnergy: FIGHT_ENERGY_MAX, skills: fixedDamage(selected), ...actionIds }],
      defenders: [1, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: 1,
        speed: 50 - index, initialEnergy: 100, initialTianji: 2, activeAbilityId: null, skills: [] })),
      maxRounds: 4,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    const castId = Number(cast.id);
    assert.equal(Number(cast.ab_tid), id);
    assert.deepEqual(cast.aim_list.map(Number), [201]);
    const harms = packets(report, 106, 'pb_fat_harm').filter(packet => Number(packet.id) === castId)
      .flatMap(packet => packet.harm_list).map(harm => [Number(harm.aim_id), Number(harm.value)]);
    assert.deepEqual(harms, [[201, amount]]);
    const angerSync = packets(report, 116, 'pb_fat_attr_sync').find(packet => Number(packet.id) === castId);
    assert.deepEqual(angerSync.attr_list.map(attr => [Number(attr.aim_id), Number(attr.attr_val ?? 0)]), [[101, 0], [201, 155]]);
    const angerAfterActions = id => simulation.events.filter(event => event.kind === 'action-start' && event.srcId === id)
      .map(action => simulation.events.find(event => event.kind === 'anger-sync' && event.id === action.id)
        ?.attrList.find(attr => attr.aimId === id)?.attrValue);
    assert.deepEqual(angerAfterActions(201), [292.5, 474, 655.5, 985.5]);
    assert.deepEqual(angerAfterActions(202), [350, 600, 850, 1000]);
    assert.equal(simulation.events.filter(event => event.kind === 'action-start' && event.abilityId === id).length, 1);
    const targetTurns = packets(report, 101, 'pb_fat_action_before').filter(action => Number(action.src_id) === 201);
    const wireAnger = packets(report, 116, 'pb_fat_attr_sync');
    assert.deepEqual(targetTurns.map(action => Number(wireAnger.find(sync => sync.id === action.id)
      .attr_list.find(attr => Number(attr.aim_id) === 201).attr_val)), [292, 474, 655, 985]);
    assert.ok(!simulation.events.some(event => event.kind === 'proprietary-tianji'));
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Shadowshield Knight transfers the capped defense of each hit front-row enemy for two rounds', () => {
  for (const [quality, id, textId, regularHit, armoredHit] of [
    [40, 2102050112, 601501013, 2973, 2358],
    [50, 2102050113, 601501014, 3313, 2627],
  ]) {
    const hero = heroAt(1020501, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(actionIds.activeAbilityId, id);
    assert.equal(Number(selected?.id), id, 'the same-ID ultimate must replace the profession fallback');
    assert.equal(selected.implementation.abilityDes.text, textId);
    const normal = resolveActionSkill({ ...actionIds, skills }, false, database);
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 1, defense: 1000, attack: 3000, maxHp: 100000, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, critChance: 0, skills: [...fixedDamage(selected), ...fixedDamage(normal)], ...actionIds }],
      defenders: [1000, 3000, 3000, 6000].map((defense, index) => ({ id: 201 + index, loc: index + 1,
        maxHp: 100000, attack: 2000, defense, speed: 50 - index, critChance: 0, initialEnergy: 0,
        abilityId: actionIds.abilityId, activeAbilityId: null, skills: fixedDamage(normal) })),
      maxRounds: 3,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    assert.equal(Number(cast.ab_tid), id);
    assert.deepEqual(cast.aim_list.map(Number), [201, 202, 203]);
    const harms = packets(report, 106, 'pb_fat_harm');
    const hitsFor = action => harms.filter(packet => Number(packet.id) === Number(action.id))
      .flatMap(packet => packet.harm_list).map(harm => [Number(harm.aim_id), Number(harm.value)]);
    assert.deepEqual(hitsFor(cast), [[201, regularHit], [202, armoredHit], [203, armoredHit]]);
    assert.deepEqual(simulation.events.filter(event => event.id === Number(cast.id) && event.type === 'stat-modifier')
      .map(event => [event.target, event.magnitude, event.durationType, event.duration.rounds]),
    [[201, -30, 'timed', 2], [202, -60, 'timed', 2], [203, -60, 'timed', 2], [101, 150, 'timed', 2]]);
    const wireActions = packets(report, 101, 'pb_fat_action_before');
    assert.deepEqual(wireActions.filter(action => Number(action.src_id) === 201).map(hitsFor),
      [[[101, 1588]], [[101, 1588]], [[101, 1588]]]);
    assert.deepEqual(wireActions.filter(action => Number(action.src_id) === 101).slice(1).map(hitsFor),
      [[[201, 2618]], [[201, 2618]]]);
    const expiry = simulation.events.map((event, index) => ({ ...event, index }))
      .filter(event => event.type === 'status-expire');
    assert.deepEqual(expiry.map(event => event.target), [101, 201, 202, 203]);
    const roundThree = simulation.events.findIndex(event => event.kind === 'round-start' && event.round === 3);
    assert.ok(expiry.every(event => event.index > roundThree));
    const sync = packets(report, 116, 'pb_fat_attr_sync').find(packet => packet.id === cast.id);
    assert.deepEqual(sync.attr_list.map(attr => [Number(attr.aim_id), Number(attr.attr_val ?? 0)]),
      [[101, 0], [201, 80], [202, 80], [203, 80]]);
    assert.equal(packets(report, 103, 'pb_fat_buff_change').length, 0, 'no invented defense overlay');
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Holy Radiance weakens every hit enemy outgoing damage without making them take extra damage', () => {
  for (const [quality, id, textId, damage] of [
    [40, 2402010112, 601501080, 750], [50, 2402010113, 601501081, 830],
  ]) {
    const hero = heroAt(4020101, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(actionIds.activeAbilityId, id);
    assert.equal(Number(selected?.id), id, 'the same-ID ultimate must replace the profession fallback');
    assert.equal(selected.implementation.abilityDes.text, textId);
    const normal = resolveActionSkill({ ...actionIds, skills }, false, database);
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 1, maxHp: 100000, attack: 1000, speed: 100, critChance: 0,
        initialEnergy: FIGHT_ENERGY_MAX, skills: [...fixedDamage(selected), ...fixedDamage(normal)], ...actionIds }],
      defenders: [1, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: 1000,
        speed: 50 - index, critChance: 0, initialEnergy: 0, abilityId: actionIds.abilityId,
        activeAbilityId: null, skills: fixedDamage(normal) })),
      maxRounds: 4,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    assert.equal(Number(cast.ab_tid), id);
    assert.deepEqual(cast.aim_list.map(Number), [201, 202]);
    const harms = packets(report, 106, 'pb_fat_harm');
    const hitsFor = action => harms.filter(packet => packet.id === action.id).flatMap(packet => packet.harm_list)
      .map(harm => [Number(harm.aim_id), Number(harm.value)]);
    assert.deepEqual(hitsFor(cast), [[201, damage], [202, damage]]);
    const actions = packets(report, 101, 'pb_fat_action_before');
    for (const foeId of [201, 202]) {
      assert.deepEqual(actions.filter(action => Number(action.src_id) === foeId).map(hitsFor),
        [[[101, 850]], [[101, 850]], [[101, 850]], [[101, 1000]]]);
    }
    assert.deepEqual(actions.filter(action => Number(action.src_id) === 101).slice(1).map(hitsFor),
      [[[201, 1000]], [[201, 1000]], [[201, 1000]]]);
    const sync = packets(report, 116, 'pb_fat_attr_sync').find(packet => packet.id === cast.id);
    assert.deepEqual(sync.attr_list.map(attr => [Number(attr.aim_id), Number(attr.attr_val ?? 0)]),
      [[101, 0], [201, 80], [202, 80]]);
    assert.equal(packets(report, 103, 'pb_fat_buff_change').length, 0, 'no invented weakness overlay');
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Quicksand Prince heals only from his capped follow-up true damage, never from the physical hit', () => {
  for (const [quality, id, textId, physicalDamage] of [
    [40, 2202010112, 601501030, 224], [50, 2202010113, 601501031, 248],
  ]) {
    const hero = heroAt(2020101, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(actionIds.activeAbilityId, id);
    assert.equal(Number(selected?.id), id, 'the same-ID ultimate must replace the profession fallback');
    assert.equal(selected.implementation.abilityDes.text, textId);
    const normal = resolveActionSkill({ ...actionIds, skills }, false, database);
    for (const [maxHp, trueDamage] of [[2000, 60], [6000, 100], [200, 0]]) {
      const simulation = simulateBattle({
        attackers: [{ id: 101, loc: 1, maxHp: 1000, attack: 100, speed: 100, critChance: 0,
          initialEnergy: FIGHT_ENERGY_MAX, skills: fixedDamage(selected), ...actionIds }],
        defenders: [1, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp, attack: 200,
          speed: 200 - index, critChance: 0, initialEnergy: 0, abilityId: actionIds.abilityId,
          activeAbilityId: null, skills: fixedDamage(normal) })),
        maxRounds: 1,
      });
      const report = { action_list: actionList(codec, simulation) };
      const cast = firstActive(report);
      assert.equal(Number(cast.ab_tid), id);
      assert.deepEqual(cast.aim_list.map(Number), [201]);
      const castEvents = simulation.events.filter(event => event.id === Number(cast.id));
      const damage = castEvents.filter(event => event.kind === 'damage').flatMap(event => event.harms);
      assert.deepEqual(damage.map(harm => [harm.aimId, harm.value, harm.critical]),
        trueDamage ? [[201, physicalDamage, false], [201, trueDamage, false]] : [[201, physicalDamage, false]]);
      const healing = castEvents.filter(event => event.kind === 'heal');
      assert.deepEqual(healing.map(event => [event.aimId, event.value, event.actualHeal]),
        trueDamage ? [[101, trueDamage, trueDamage]] : []);
      const harms = packets(report, 106, 'pb_fat_harm').filter(packet => packet.id === cast.id)
        .flatMap(packet => packet.harm_list).map(harm => [Number(harm.aim_id), Number(harm.value), Number(harm.type) === 107]);
      assert.deepEqual(harms, trueDamage ? [[201, physicalDamage, false], [201, trueDamage, false], [101, trueDamage, true]]
        : [[201, physicalDamage, false]]);
      const sync = packets(report, 116, 'pb_fat_attr_sync').find(packet => packet.id === cast.id);
      assert.deepEqual(sync.attr_list.map(attr => [Number(attr.aim_id), Number(attr.attr_val ?? 0)]),
        [[101, 0], [201, trueDamage ? 410 : 330]]);
    }
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Bounty Hunter shoots the front row with penetration and crit limited to Deadly Bullet', () => {
  for (const [quality, id, key, criticalDamage, regularDamage] of [
    [30, 2301030111, 601501070, 1504, 1003],
    [40, 2301030112, 601501071, 1588, 1058],
    [50, 2301030113, 601501072, 1769, 1179],
  ]) {
    const hero = heroAt(3010301, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    const normal = resolveActionSkill({ ...actionIds, skills }, false, database);
    const play = seed => {
      const simulation = simulateBattle({
        attackers: [{ id: 101, role: hero.tid, loc: 1, maxHp: 10000, attack: 1000, speed: 100, critChance: 0,
          initialEnergy: FIGHT_ENERGY_MAX, critMultiplier: 1.5, skills: [...fixedDamage(selected), ...fixedDamage(normal)], ...actionIds }],
        defenders: [1, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp: 10000, attack: 1,
          speed: 1, defense: 200, skills: [] })),
        maxRounds: 2, seed,
      });
      const actions = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 101);
      assert.deepEqual(actions.map(action => action.abilityId), [id, actionIds.abilityId]);
      return actions.map(action => {
        assert.deepEqual(action.aimList, [201]);
        const effects = simulation.events.filter(event => event.id === action.id);
        assert.ok(!effects.some(event => event.kind === 'effect' || event.kind === 'shield'));
        return effects.filter(event => event.kind === 'damage').flatMap(event => event.harms)
          .map(harm => [harm.aimId, harm.value, harm.critical]);
      });
    };
    assert.deepEqual(play(2000), [[[201, criticalDamage, true]], [[201, 917, false]]]);
    assert.deepEqual(play(1), [[[201, regularDamage, false]], [[201, 917, false]]]);
  }
  assert.ok(lineupSkills(heroAt(3010301)).includes(2301030111));
});

test('Ellie strikes the same enemy back row twice with her ordinary hit crit bonus', () => {
  for (const [quality, id, key, damage, criticalDamage] of [
    [40, 2302050112, 601501062, 570, 855],
    [50, 2302050113, 601501063, 630, 945],
  ]) {
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero: heroAt(3020501, { quality }), heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    const play = firstBackRowHp => {
      const simulation = simulateBattle({
        attackers: [{ id: 101, role: 3020501, loc: 1, maxHp: 10000, attack: 1000, speed: 100, critChance: 0,
          initialEnergy: FIGHT_ENERGY_MAX, critMultiplier: 1.5, skills: fixedDamage(selected), ...actionIds }],
        defenders: [1, 4, 6].map((loc, index) => ({ id: 201 + index, loc, maxHp: index === 1 ? firstBackRowHp : 10000,
          attack: 1, speed: 1, defense: 0, skills: [] })),
        maxRounds: 1, seed: 5,
      });
      const action = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
      assert.equal(action.abilityId, id);
      assert.deepEqual(action.aimList, [202, 203]);
      return simulation.events.filter(event => event.id === action.id && event.kind === 'damage').flatMap(event => event.harms)
        .map(harm => [harm.aimId, harm.value, harm.critical]);
    };
    assert.deepEqual(play(10000), [[202, criticalDamage, true], [203, damage, false],
      [202, criticalDamage, true], [203, damage, false]]);
    const afterDeath = play(100);
    assert.deepEqual(afterDeath.map(hit => hit[0]), [202, 203, 203]);
  }
});

test('Dreamspeaker heals all allies with the caster HP cap and supplies timed mitigation and anti-crit', () => {
  const hero = heroAt(4030101);
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const actionIds = selectFightActionIds(abilityIds);
  const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
  assert.equal(Number(selected?.id), 2403010113);
  assert.equal(selected.implementation.abilityDes.text, 601501073);
  const probe = { id: '1201010101', type: 'Normal', implementation: { effects: [{
    target: { targetType: 'all-enemies' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 },
  }] } };
  for (const [attack, heal] of [[500, 210], [2000, 390]]) {
    const simulation = simulateBattle({
      attackers: [{ id: 101, role: hero.tid, loc: 1, maxHp: 1300, attack, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, skills: [selected], ...actionIds },
      { id: 102, loc: 4, maxHp: 2000, attack: 1, speed: 50, initialEnergy: 0, activeAbilityId: null, skills: [] }],
      defenders: [{ id: 201, loc: 1, maxHp: 100000, attack: 400, speed: 150, activeAbilityId: null,
        abilityId: Number(probe.id), skills: [probe] }],
      maxRounds: 4, seed: 1,
    });
    const cast = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(cast.abilityId, 2403010113);
    assert.deepEqual(cast.aimList, [101, 102]);
    const effects = simulation.events.filter(event => event.id === cast.id);
    assert.ok(!effects.some(event => event.kind === 'shield' || event.kind === 'damage'));
    assert.deepEqual(effects.filter(event => event.kind === 'heal').map(event => [event.aimId, event.actualHeal, event.actorMaxHpCap]),
      [[101, heal, 390], [102, heal, 390]]);
    const modifiers = effects.filter(event => event.type === 'stat-modifier');
    assert.deepEqual(modifiers.map(event => [event.target, event.statType, event.magnitude, event.duration.rounds]),
      [[101, 'damage-reduction', 0.12, 2], [102, 'damage-reduction', 0.12, 2],
        [101, 'anti-crit', 0.08, 2], [102, 'anti-crit', 0.08, 2]]);
    const probes = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 201);
    assert.deepEqual(probes.map(action => simulation.events.filter(event => event.id === action.id && event.kind === 'damage')
      .flatMap(event => event.harms).map(hit => hit.value)), [[400, 400], [352, 352], [352, 352], [400, 400]]);
  }
});

test('Sheep Doctor heals the whole team and only the strongest ally gets stacking timed damage', () => {
  const damageSkill = (id, type, targetType, multiplier) => ({ id: String(id), type, implementation: { effects: [{
    target: { targetType }, effect: { type: 'damage', damageType: 'physical', multiplier, canCrit: false, variance: 1 },
  }] } });
  const probe = damageSkill(1201010101, 'Normal', 'single', 1);
  const opening = damageSkill(2201010111, 'Ultimate', 'all-enemies', 0.2);
  const followup = damageSkill(1201010102, 'Normal', 'single', 0.01);
  for (const [quality, id, key, cappedHeal, uncappedHeal] of [
    [30, 2401030111, 601501096, 200, 300], [40, 2401030112, 601501097, 230, 330], [50, 2401030113, 601501098, 260, 370],
  ]) {
    const hero = heroAt(4010301, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    for (const [maxHp, heal] of [[1000, cappedHeal], [4000, uncappedHeal]]) {
      const simulation = simulateBattle({
        attackers: [{ id: 101, loc: 4, maxHp, attack: 1000, speed: 100,
          initialEnergy: FIGHT_ENERGY_MAX, skills: [selected], ...actionIds },
        ...[[102, 1, 2000], [103, 6, 100]].map(([probeId, loc, attack]) => ({ id: probeId, loc, attack,
          maxHp: 10000, speed: 50, abilityId: Number(probe.id), activeAbilityId: null, skills: [probe] }))],
        defenders: [{ id: 201, loc: 1, maxHp: 100000, attack: 3000, speed: 200,
          initialEnergy: FIGHT_ENERGY_MAX, abilityId: Number(followup.id), activeAbilityId: Number(opening.id), skills: [opening, followup] }],
        maxRounds: 4, seed: 1,
      });
      const casts = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 101 && event.abilityId === id);
      assert.equal(casts.length, 1);
      assert.deepEqual(casts[0].aimList, [102, 101, 103]);
      const effects = simulation.events.filter(event => event.id === casts[0].id);
      assert.deepEqual(effects.filter(event => event.kind === 'heal').map(event => [event.aimId, event.actualHeal]),
        [[102, heal], [101, heal], [103, heal]]);
      assert.ok(!effects.some(event => event.kind === 'damage' || event.kind === 'shield'));
      const harms = simulation.events.filter(event => event.kind === 'damage').flatMap(event => event.harms);
      assert.deepEqual(harms.filter(hit => hit.srcId === 102).map(hit => hit.value), [2200, 2200, 2200, 2000]);
      assert.deepEqual(harms.filter(hit => hit.srcId === 103).map(hit => hit.value), [100, 100, 100, 100]);
      const report = { action_list: actionList(codec, simulation) };
      assert.equal(Number(firstActive(report)?.ab_tid), id);
    }
    const caster = { id: 101, team: 1, loc: 1, hp: 1000, maxHp: 1000, attack: 1000, alive: true };
    const strongest = { ...caster, id: 102, loc: 4, attack: 2000 };
    const state = { round: 1, skillDatabase: database };
    const stacks = Array.from({ length: 4 }, () => applySkillEffects(selected, caster, [caster, strongest], state, []).results
      .filter(result => result.type === 'stat-modifier')
      .map(result => [result.target, result.statType, result.magnitude, result.stacks]));
    assert.deepEqual(stacks, [1, 2, 3, 3].map(count => [[102, 'damage-bonus', 0.1, count]]));
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Sea Singer heals only the lowest-health ally and adds 25 percent strictly below the threshold', () => {
  const wound = { id: '1201010101', type: 'Normal', implementation: { effects: [{
    target: { targetType: 'single' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 },
  }] } };
  for (const [quality, id, key, base, increased, capped, wireHeal] of [
    [40, 2102010112, 601501005, 1500, 1875, 1000, 187], [50, 2102010113, 601501006, 1660, 2075, 1100, 207],
  ]) {
    const hero = heroAt(1020101, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    for (const [hp, casterHp, expected] of [[2499, 4000, increased], [2500, 4000, base], [2501, 4000, base], [2499, 1000, capped]]) {
      const caster = { id: 101, team: 1, loc: 4, hp: casterHp, maxHp: casterHp, attack: 1000, alive: true };
      const ally = { id: 102, team: 1, loc: 1, hp, maxHp: 10000, alive: true };
      const healthy = { ...ally, id: 103, hp: 6000, loc: 2 };
      const enemy = { ...ally, id: 201, hp: 1, team: 2 };
      const results = applySkillEffects(selected, caster, [caster, ally, healthy, enemy], { skillDatabase: database }, []).results;
      assert.deepEqual(results.map(result => [result.type, result.target, result.value, result.actualHeal]),
        [['heal', 102, expected, expected]]);
    }
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 4, maxHp: 1000, attack: 100, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, skills: [selected], ...actionIds },
      { id: 102, loc: 1, maxHp: 1000, attack: 1, speed: 10, activeAbilityId: null, skills: [] }],
      defenders: [{ id: 201, loc: 1, maxHp: 10000, attack: 751, speed: 200,
        abilityId: Number(wound.id), activeAbilityId: null, skills: [wound] }],
      maxRounds: 1,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    assert.equal(Number(cast?.ab_tid), id);
    assert.deepEqual(cast.aim_list.map(Number), [102]);
    const harms = packets(report, 106, 'pb_fat_harm').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.harm_list).map(harm => [harm.type, harm.aim_id, harm.value, harm.old_hp, harm.hp].map(Number));
    assert.deepEqual(harms, [[107, 102, wireHeal, 249, 249 + wireHeal]]);
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Jellyfish heals and cleanses the same ally even if healing changes the lowest-health order', () => {
  const enemySkill = { id: '1201010101', type: 'Normal', implementation: { effects: [
    { target: { targetType: 'single' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 } },
    { target: { targetType: 'single' }, effect: { type: 'status', statusType: 'poison' }, duration: { durationType: 'timed', rounds: 2 } },
  ] } };
  for (const [quality, id, textId, heal, wireHeal] of [
    [40, 2302020112, 601501056, 1500, 150], [50, 2302020113, 601501057, 1660, 166],
  ]) {
    const hero = heroAt(3020201, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, textId);
    for (const [maxHp, amount] of [[10000, heal], [1000, 1100]]) {
      const caster = { id: 101, team: 1, loc: 4, hp: maxHp, maxHp, attack: 1000, alive: true };
      const debuffs = [{ type: 'burn', stacks: 1 }, { type: 'poison', stacks: 2 }];
      const ally = { id: 102, team: 1, loc: 1, hp: 2000, maxHp: 10000, alive: true,
        debuffs: [...debuffs], buffs: [{ type: 'attack' }] };
      const unselected = { ...ally, id: 103, loc: 2, hp: 2500, debuffs: [{ type: 'silence' }] };
      const enemy = { ...ally, id: 201, team: 2, hp: 1000, debuffs: [] };
      const { results } = applySkillEffects(selected, caster, [caster, ally, unselected, enemy], { skillDatabase: database }, []);
      assert.deepEqual(results.map(result => [result.type, result.target, result.actualHeal ?? result.count]),
        [['heal', 102, amount], ['dispel', 102, 1]]);
      assert.equal(ally.hp, 2000 + amount);
      assert.equal(ally.debuffs.length, 1);
      assert.equal(ally.buffs.length, 1);
      assert.equal(unselected.hp, 2500);
      assert.equal(unselected.debuffs.length, 1);
    }
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 4, maxHp: 1000, attack: 100, speed: 100, initialEnergy: FIGHT_ENERGY_MAX,
        skills, ...actionIds }, { id: 102, loc: 1, maxHp: 1000, attack: 1, speed: 10, activeAbilityId: null, skills: [] }],
      defenders: [{ id: 201, loc: 1, maxHp: 10000, attack: 700, speed: 200,
        abilityId: Number(enemySkill.id), activeAbilityId: null, skills: [enemySkill] }],
      maxRounds: 1,
    });
    const report = { action_list: actionList(codec, simulation) };
    const cast = firstActive(report);
    assert.equal(Number(cast?.ab_tid), id);
    assert.deepEqual(cast.aim_list.map(Number), [102]);
    const recoveries = packets(report, 106, 'pb_fat_harm').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.harm_list).map(harm => [harm.type, harm.aim_id, harm.value, harm.old_hp, harm.hp].map(Number));
    assert.deepEqual(recoveries, [[107, 102, wireHeal, 300, 300 + wireHeal]]);
    const cleanses = packets(report, 103, 'pb_fat_buff_change').filter(packet => Number(packet.id) === Number(cast.id))
      .flatMap(packet => packet.buff_list).map(buff => [Number(buff.aim_id), Number(buff.tid), Number(buff.overlay), !!buff.sign, Number(buff.change_reason)]);
    assert.deepEqual(cleanses, [[102, 11003, 1, false, 1]]);
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Grace opens with a two-round self shield and her own tea finisher hits only the front row', () => {
  const probe = { id: '1201010101', type: 'Normal', implementation: { effects: [{
    target: { targetType: 'all-enemies' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 },
  }] } };
  for (const [quality, id, key, damage] of [[40, 2102060112, 601501015, 1140], [50, 2102060113, 601501016, 1270]]) {
    const hero = heroAt(1020601, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(actionIds.activeAbilityId, id);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    const play = (locations) => simulateBattle({
      attackers: [{ id: 101, loc: 1, role: hero.tid, maxHp: 10000, attack: 1000, speed: 150, critChance: 0,
        initialEnergy: FIGHT_ENERGY_MAX, skills: [selected], ...actionIds },
      { id: 102, loc: 4, maxHp: 2000, attack: 1, speed: 1, initialEnergy: 0, activeAbilityId: null, skills: [] }],
      defenders: locations.map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: index === 0 ? 100 : 1,
        speed: 90 - index, critChance: 0, initialEnergy: 0, activeAbilityId: null,
        abilityId: Number(probe.id), skills: index === 0 ? [probe] : [] })),
      maxRounds: 4, seed: 1,
    });
    const simulation = play([1, 3, 5]);
    const shields = simulation.events.filter(event => event.kind === 'shield');
    assert.deepEqual(shields.map(event => [event.id, event.aimId, event.shield]), [[0, 101, 500], [0, 101, 0]]);
    const cast = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(cast.abilityId, id);
    assert.deepEqual(cast.aimList, [201, 202]);
    assert.equal(simulation.events[1], shields[0]);
    const harms = (replay, action) => replay.events.filter(event => event.id === action.id && event.kind === 'damage').flatMap(event => event.harms);
    assert.deepEqual(harms(simulation, cast).map(hit => [hit.aimId, hit.value]), [[201, damage], [202, damage]]);
    assert.ok(!simulation.events.some(event => event.id === cast.id && event.kind === 'shield'));
    const expiry = play([1]);
    const probes = expiry.events.filter(event => event.kind === 'action-start' && event.srcId === 201);
    assert.deepEqual(probes.map(action => harms(expiry, action).map(hit => hit.value)), [[92, 100], [92, 100], [92, 100], [100, 100]]);
    assert.deepEqual(probes.map(action => harms(expiry, action)[0].oldShield > 0), [true, true, false, false]);
    const report = { action_list: actionList(codec, simulation) };
    assert.deepEqual(packets(report, 109, 'pb_fat_shield').map(packet => [Number(packet.id ?? 0), Number(packet.aim_id), Number(packet.shield ?? 0)]),
      [[0, 101, 500], [0, 101, 0]]);
    const emptyFront = play([5, 6]);
    const emptyCast = emptyFront.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.ok(!emptyFront.events.some(event => event.id === emptyCast.id && event.kind === 'damage'));
  }
  const grace = heroAt(1020601);
  assert.ok(lineupSkills(grace).includes(2102060112));
  for (const battle of [journeyFor(grace), pvpFor(grace).battle]) {
    assert.equal(Number(firstActive(battle)?.ab_tid), 2102060112);
    const actions = battle.action_list.map(bytes => codec.unpack('pb_generic', bytes));
    assert.deepEqual(actions.slice(0, 2).map(packet => Number(packet.proto)), [107, 109]);
    const opening = codec.unpack('pb_fat_shield', Buffer.from(actions[1].bin, 'base64'));
    assert.equal(Number(opening.id ?? 0), 0);
    assert.equal(Number(opening.aim_id), 101);
    assert.ok(Number(opening.shield) > 0);
  }
});

test('Love Archer applies the 30 percent crit bonus only to her own all-enemy finisher', () => {
  for (const [quality, id, key, damage] of [[40, 2402020112, 601501082, 750], [50, 2402020113, 601501083, 830]]) {
    const hero = heroAt(4020201, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    const normal = resolveActionSkill({ ...actionIds, skills }, false, database);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 1, attack: 1000, maxHp: 10000, speed: 100, critChance: 0, critMultiplier: 1.5,
        initialEnergy: FIGHT_ENERGY_MAX, skills: [normal, selected], ...actionIds }],
      defenders: [1, 6].map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: 1, speed: 1,
        critChance: 0, initialEnergy: 0, activeAbilityId: null, skills: [] })),
      maxRounds: 2, seed: 1,
    });
    const actions = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 101);
    assert.deepEqual(actions.map(action => [action.abilityId, action.aimList]), [[id, [201, 202]], [actionIds.abilityId, [201]]]);
    const harms = action => simulation.events.filter(event => event.kind === 'damage' && event.id === action.id)
      .flatMap(event => event.harms).map(hit => [hit.aimId, hit.value, hit.critical]);
    assert.deepEqual(harms(actions[0]), [[201, damage * 1.5, true], [202, damage, false]]);
    assert.equal(harms(actions[1])[0][2], false);
    assert.ok(!simulation.events.some(event => event.id === actions[0].id && ['shield', 'heal', 'effect'].includes(event.kind)));
    const battle = pvpFor(hero).battle;
    assert.equal(Number(firstActive(battle)?.ab_tid), id);
    assert.ok(lineupSkills(hero).includes(id));
  }
});

test('Molin hits both rows and lowers only the affected enemies’ final damage reduction for two rounds', () => {
  const probe = { id: '1201010101', type: 'Normal', implementation: { effects: [{
    target: { targetType: 'all-enemies' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 },
  }] } };
  for (const [quality, id, key, damage] of [[40, 2402040112, 601501086, 750], [50, 2402040113, 601501087, 830]]) {
    const hero = heroAt(4020401, { quality });
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
    assert.equal(Number(selected?.id), id);
    assert.equal(selected.implementation.abilityDes.text, key);
    const simulation = simulateBattle({
      attackers: [{ id: 101, loc: 4, attack: 1000, maxHp: 10000, speed: 100, critChance: 0,
        initialEnergy: FIGHT_ENERGY_MAX, skills: fixedDamage(selected), ...actionIds },
      { id: 102, loc: 1, attack: 100, maxHp: 10000, speed: 50, abilityId: Number(probe.id), activeAbilityId: null, skills: [probe] }],
      defenders: [1, 4, 6].map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: 1, speed: 1,
        critChance: 0, activeAbilityId: null, skills: [] })),
      maxRounds: 4, seed: 1,
    });
    const action = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(action.abilityId, id);
    assert.deepEqual(action.aimList, [201, 202, 203]);
    assert.equal(simulation.events.filter(event => event.kind === 'action-start' && event.abilityId === id).length, 1);
    const harms = action => simulation.events.filter(event => event.kind === 'damage' && event.id === action.id)
      .flatMap(event => event.harms).map(hit => [hit.aimId, hit.value]);
    assert.deepEqual(harms(action), [[201, damage], [202, damage], [203, damage]]);
    const probes = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 102);
    const affected = [[201, 100], [202, 112], [203, 112]];
    assert.deepEqual(probes.map(harms), [affected, affected, affected, [[201, 100], [202, 100], [203, 100]]]);
    assert.ok(lineupSkills(hero).includes(id));
    assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
  }
});

test('Black Crow casts the same-ID magic storm and caps both permanent enemy penalties at three layers', () => {
  const hero = heroAt(1030401);
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const actionIds = selectFightActionIds(abilityIds);
  const id = 2103040113;
  assert.equal(actionIds.activeAbilityId, id);
  const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
  assert.equal(Number(selected?.id), id);
  assert.equal(selected.implementation.abilityDes.text, 601501003);
  assert.equal(selected.implementation.effects[0].effect.damageType, 'magical');
  const probe = { id: '1201010101', type: 'Normal', implementation: { effects: [{
    target: { targetType: 'single' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 },
  }] } };
  const simulation = simulateBattle({
    attackers: [{ id: 101, loc: 1, attack: 1000, maxHp: 100000, speed: 100, critChance: 0,
      initialEnergy: FIGHT_ENERGY_MAX, skills: fixedDamage(selected), ...actionIds }],
    defenders: [1, 6].map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: 1000,
      speed: 10, abilityId: Number(probe.id), activeAbilityId: null, skills: [probe] })),
    maxRounds: 16, seed: 1,
  });
  const casts = simulation.events.filter(event => event.kind === 'action-start' && event.abilityId === id);
  assert.ok(casts.length >= 4);
  for (const cast of casts) {
    assert.deepEqual(cast.aimList, [201, 202]);
    assert.deepEqual(simulation.events.filter(event => event.kind === 'damage' && event.id === cast.id)
      .flatMap(event => event.harms).map(hit => [hit.aimId, hit.value]), [[201, 830], [202, 830]]);
  }
  let castsSoFar = 0;
  const attacksByEnemy = new Map([[201, 0], [202, 0]]);
  for (const event of simulation.events) {
    if (event.kind === 'action-start' && event.abilityId === id) castsSoFar++;
    if (event.kind !== 'damage') continue;
    for (const hit of event.harms.filter(harm => attacksByEnemy.has(harm.srcId))) {
      attacksByEnemy.set(hit.srcId, attacksByEnemy.get(hit.srcId) + 1);
      assert.equal(hit.value, [1000, 902, 810, 722][Math.min(3, castsSoFar)], `target ${hit.srcId}, casts ${castsSoFar}`);
    }
  }
  assert.deepEqual([...attacksByEnemy.values()], [16, 16]);
  assert.ok(lineupSkills(hero).includes(id));
  assert.equal(Number(firstActive(pvpFor(hero).battle)?.ab_tid), id);
});

test('Evan executes each exact Hammer Strike on the enemy back row without a borrowed shield', () => {
  const baseHero = heroAt(2010101);
  for (const [quality, id, key, damage] of [
    [30, 2201010111, 601501042, 1188],
    [40, 2201010112, 601501043, 1254],
    [50, 2201010113, 601501044, 1397],
  ]) {
    const hero = { ...baseHero, quality };
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = skills.find(skill => Number(skill.id) === id);
    const simulation = simulateBattle({
      attackers: [{ id: 101, role: hero.tid, loc: 1, maxHp: 10000, attack: 1000, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, critChance: 0, skills: fixedDamage(selected), ...actionIds }],
      defenders: [1, 4, 6].map((loc, index) => ({ id: 201 + index, loc, maxHp: 10000, attack: 1, speed: 1, skills: [] })),
      maxRounds: 1,
    });
    const action = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(action.abilityId, id);
    assert.deepEqual(action.aimList, [202, 203]);
    const effects = simulation.events.filter(event => event.id === action.id);
    assert.deepEqual(effects.filter(event => event.kind === 'damage').flatMap(event => event.harms)
      .map(harm => [harm.aimId, harm.value]), [[202, damage], [203, damage]]);
    assert.ok(!effects.some(event => event.kind === 'shield'));
    assert.equal(selected.implementation.abilityDes.text, key);
  }
  assert.ok(lineupSkills(baseHero).includes(2201010111));
  for (const report of [journeyFor(baseHero), pvpFor(baseHero).battle]) {
    const fighter = report.fighter_list.find(unit => unit.id === 101);
    assert.equal(Number(firstActive(report)?.ab_tid), 2201010111);
    assert.equal(Number(resolveActionSkill(fighter, true, database)?.id), 2201010111);
  }
});

test('Rebecca executes the same tier in each loadout and reduces only her target’s damage mitigation', () => {
  const baseHero = heroAt(2010201);
  const probe = { id: '1201010101', type: 'Normal', implementation: { effects: [{
    target: { targetType: 'all-enemies' }, effect: { type: 'damage', damageType: 'physical', multiplier: 1, canCrit: false, variance: 1 },
  }] } };
  for (const [quality, id, key, damage] of [
    [30, 2201020111, 601501045, 2110],
    [40, 2201020112, 601501046, 2240],
    [50, 2201020113, 601501047, 2480],
  ]) {
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero: { ...baseHero, quality }, heroTables, skillDatabase: database });
    const actionIds = selectFightActionIds(abilityIds);
    assert.equal(actionIds.activeAbilityId, id);
    const selected = skills.find(skill => Number(skill.id) === id);
    const simulation = simulateBattle({
      attackers: [{ id: 101, role: baseHero.tid, loc: 2, maxHp: 10000, attack: 1000, speed: 100,
        initialEnergy: FIGHT_ENERGY_MAX, critChance: 0, skills: fixedDamage(selected), ...actionIds },
      { id: 102, loc: 1, maxHp: 10000, attack: 100, speed: 50, activeAbilityId: null, abilityId: Number(probe.id), skills: [probe] }],
      defenders: [1, 2, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp: 100000, attack: 1, speed: 1, skills: [] })),
      maxRounds: 4,
    });
    const action = simulation.events.find(event => event.kind === 'action-start' && event.srcId === 101);
    assert.equal(action.abilityId, id);
    const hits = simulation.events.filter(event => event.kind === 'damage' && event.id === action.id)
      .flatMap(event => event.harms).map(harm => [harm.aimId, harm.value]);
    assert.deepEqual(hits, [[201, damage]]);
    const probes = simulation.events.filter(event => event.kind === 'damage')
      .flatMap(event => event.harms).filter(harm => harm.srcId === 102).map(harm => harm.value);
    assert.deepEqual(probes, [110, 100, 100, 110, 100, 100, 110, 100, 100, 100, 100, 100]);
    assert.equal(selected.implementation.abilityDes.text, key);
  }
  for (const report of [journeyFor(baseHero), pvpFor(baseHero).battle]) {
    const fighter = report.fighter_list.find(unit => unit.id === 101);
    assert.equal(Number(firstActive(report)?.ab_tid), 2201020111);
    assert.equal(Number(resolveActionSkill(fighter, true, database)?.id), 2201020111);
  }
});

test('both guide fights select NPC 9005700 active 6202060113 by its original type', () => {
  for (const fightId of [90029, 90030]) {
    const battle = reportGuideDemoBattle(codec, modelFor(heroAt(2010101)), fightId, attributeTables);
    const shadow = battle.fighter_list.find(unit => unit.role === 9005700);
    assert.equal(shadow.abilityId, 1202060101, `guide ${fightId} normal`);
    assert.equal(shadow.activeAbilityId, 6202060113, `guide ${fightId} active`);
  }
});

test('all 847 base-quality star states resolve exact level-specific slots', () => {
  const types = readFightAbilityTypes();
  const mismatches = [];
  let count = 0;
  for (const [tid, { ability }] of heroTables.Ability) {
    const slotGroups = new Set(ability.map(id => Math.floor(id / 10)));
    for (let star = 0; star <= 10; star++) {
      const hero = heroAt(tid, { star });
      const { level } = heroTables.AbilityLevel.get(hero.quality * 100 + star);
      const expected = ability.flatMap((id, slot) => level[slot] > 0 ? [Math.floor(id / 10) * 10 + level[slot]] : []);
      const actual = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database }).abilityIds
        .filter(id => slotGroups.has(Math.floor(id / 10)));
      assert.ok(expected.every(id => types.has(id)), `original ability inventory ${tid}/${star}`);
      if (actual.join(',') !== expected.join(',')) mismatches.push({ tid, star, expected, actual });
      count++;
    }
  }
  assert.equal(count, 847);
  assert.equal(mismatches.length, 0, JSON.stringify(mismatches[0]));
});

test('all 75 localized single-target normals attach their own action definitions', () => {
  const distribution = {};
  const unresolved = [];
  for (const tid of heroTables.Ability.keys()) {
    const { skills, abilityIds } = buildHeroSkillLoadout({ hero: heroAt(tid), heroTables, skillDatabase: database });
    const { abilityId } = selectFightActionIds(abilityIds);
    const skill = skills.find(candidate => Number(candidate.id) === abilityId);
    if (!skill) {
      unresolved.push(abilityId);
      continue;
    }
    assert.equal(skill.type, 'Normal', String(tid));
    assert.equal(skill.implementation.abilityDes.tid, abilityId, String(tid));
    const [entry] = skill.implementation.effects;
    assert.equal(skill.implementation.effects.length, 1, String(tid));
    assert.equal(entry.target.targetType, 'single', String(tid));
    const key = [entry.effect.damageType, entry.effect.multiplier, skill.implementation.tianjiGain ?? 0].join(':');
    distribution[key] = (distribution[key] ?? 0) + 1;
  }
  assert.deepEqual(distribution, { 'physical:1:0': 36, 'magical:1:0': 23, 'physical:1.1:1': 4, 'magical:1.1:1': 12 });
  assert.deepEqual(unresolved.sort(), [1404030101, 1404040101]);
});

test('Night Li normal grants one point by its own ID and the next turn pays Tianji, not anger', () => {
  const hero = heroAt(5040101);
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const actionIds = selectFightActionIds(abilityIds);
  const normal = skills.find(skill => Number(skill.id) === actionIds.abilityId);
  const deity = skills.find(skill => Number(skill.id) === actionIds.tianjiAbilityId);
  const simulation = simulateBattle({
    attackers: [{ id: 101, role: hero.tid, loc: 1, maxHp: 10000, attack: 1000, speed: 100,
      initialTianji: 2, initialEnergy: 0, critChance: 0, skills: [...fixedDamage(normal), deity], ...actionIds }],
    defenders: [{ id: 201, maxHp: 100000, attack: 1, speed: 1, skills: [] }],
    maxRounds: 2,
  });
  const actions = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 101);
  assert.deepEqual(actions.map(event => event.abilityId), [1504010101, 2504010123]);
  const harm = simulation.events.find(event => event.kind === 'damage' && event.id === actions[0].id);
  assert.deepEqual(harm.harms.map(hit => [hit.aimId, hit.value]), [[201, 1100]]);
  assert.deepEqual(simulation.events.filter(event => event.aimId === 101 && event.reason === 'normal-action')
    .map(event => [event.delta, event.after]), [[1, 3]]);
  assert.equal(simulation.events.find(event => event.aimId === 101 && event.reason === 'deity-skill').delta, -3);
  assert.ok(simulation.attackers[0].energy >= 250);
});

test('Qimeng Michelle mastery two drains an enemy’s Tianji, not anger, after an ordinary ultimate', () => {
  const hero = heroAt(5040701, { star: 10, mastery_break: 2 });
  const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const skill = skills.find(candidate => candidate.skillSource === 'mastery-selection');
  assert.equal(Number(skill?.id), 354070172);
  const actionIds = selectFightActionIds(abilityIds);
  const simulate = (passives, deity = false, initialEnergy = FIGHT_ENERGY_MAX) => simulateBattle({
    attackers: [{ id: 101, role: hero.tid, loc: 1, maxHp: 10000, attack: 50, speed: 100, critChance: 0,
      initialEnergy, initialTianji: deity ? 3 : 0, skills: deity ? [...passives, {
        id: String(actionIds.tianjiAbilityId), type: 'Ultimate', description: '消耗3点天极值',
        implementation: { effects: [{ target: { targetType: 'single' }, effect: {
          type: 'damage', damageType: 'magical', multiplier: 1, variance: 1,
        } }] },
      }] : passives, ...actionIds }],
    defenders: [1, 4].map((loc, index) => ({ id: 201 + index, loc, maxHp: 10000, attack: 1, speed: 1,
      initialEnergy: 300, initialTianji: 2, activeAbilityId: null, skills: [] })),
    maxRounds: 1, seed: 2,
  });
  const drains = simulation => simulation.events.filter(event => event.reason === 'ultimate-drain');
  const simulation = simulate([skill]);
  assert.deepEqual(drains(simulation).map(event => [event.srcId, event.delta, event.after]), [[101, -1, 1]]);
  assert.ok([201, 202].includes(drains(simulation)[0].aimId));
  assert.deepEqual(simulation.defenders.map(unit => unit.energy), simulate([]).defenders.map(unit => unit.energy));
  assert.deepEqual(drains(simulate([skill], true)), []);
  assert.deepEqual(drains(simulate([skill], false, 0)), []);
  const doubler = database.heroes.find(row => Number(row.id) === 2010101).skills.find(candidate => candidate.id === '120001001');
  const twice = simulate([skill, doubler]);
  assert.equal(twice.events.filter(event => event.kind === 'action-start' && event.srcId === 101 && event.actionType === 2).length, 2);
  assert.equal(drains(twice).length, 1);
});

test('Ayame quality 40 star 0 uses 2202060112 in 1316, Journey and PvP', () => {
  const hero = heroAt(2020601);
  const expected = lineupSkills(hero);
  assert.equal(expected[1], 2202060112);
  for (const report of [journeyFor(hero), pvpFor(hero).battle]) {
    const fighter = report.fighter_list.find(unit => unit.id === 101);
    assert.deepEqual(fighter.ability_list, expected);
    assert.equal(Number(firstActive(report)?.ab_tid), 2202060112);
  }
});

test('Calamus follows actual finisher kills with 150% hits, capped unless the original mutation is equipped', () => {
  for (const [quality, id, key, firstDamage] of [[40, 2202060112, 601501040, 2240], [50, 2202060113, 601501041, 2480]]) {
    const play = (mutant, health) => {
      const hero = heroAt(2020601, { quality, mutant });
      const { skills, abilityIds } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
      const actionIds = selectFightActionIds(abilityIds);
      const selected = resolveActionSkill({ ...actionIds, skills }, true, database);
      assert.equal(actionIds.activeAbilityId, id);
      assert.equal(Number(selected?.id), id);
      assert.equal(selected.implementation.abilityDes.text, key);
      const simulation = simulateBattle({
        attackers: [{ id: 101, loc: 1, role: hero.tid, attack: 1000, maxHp: 10000, speed: 100, critChance: 0,
          initialEnergy: FIGHT_ENERGY_MAX, skills, ...actionIds }],
        defenders: health.map((maxHp, index) => ({ id: 201 + index, loc: 1 + index, maxHp, attack: 1, speed: 1,
          critChance: 0, initialEnergy: 0, activeAbilityId: null, skills: [] })),
        maxRounds: 1, seed: 1,
      });
      const report = { action_list: actionList(codec, simulation) };
      const casts = packets(report, 101, 'pb_fat_action_before').filter(action => Number(action.src_id) === 101 && Number(action.type) === 2);
      assert.equal(new Set(casts.map(action => action.id)).size, casts.length);
      const finished = packets(report, 102, 'pb_fat_action_after');
      const damage = packets(report, 106, 'pb_fat_harm');
      const anger = packets(report, 116, 'pb_fat_attr_sync');
      const spent = anger.filter(packet => casts.some(cast => cast.id === packet.id)).flatMap(packet => packet.attr_list
        .filter(attr => Number(attr.aim_id) === 101 && Number(attr.attr_type) === 67)
        .map(attr => [packet.id, Number(attr.attr_val ?? 0)]));
      assert.deepEqual(spent, [[casts[0].id, 0]]);
      return casts.map(action => {
        assert.equal(Number(action.ab_tid), id);
        assert.ok(finished.some(packet => packet.id === action.id));
        const hits = damage.filter(packet => packet.id === action.id).flatMap(packet => packet.harm_list);
        assert.deepEqual(hits.map(hit => hit.aim_id), action.aim_list);
        return hits.map(hit => [Number(hit.aim_id), Number(hit.value)]);
      }).flat();
    };
    const normal = [[201, firstDamage], [202, 1500], [203, 1500]];
    const allLethal = [2100, 1400, 1300, 1200, 10];
    assert.deepEqual(play(0, allLethal), normal);
    assert.deepEqual(play(2, allLethal), normal);
    assert.deepEqual(play(1, allLethal), [...normal, [204, 1500], [205, 1500]]);
    assert.deepEqual(play(1, [5000, 10]), [[201, firstDamage]]);
    assert.deepEqual(play(1, [2100, 5000, 10]), [[201, firstDamage], [202, 1500]]);
  }
});

test('all 77 heroes exclude locked milestones and include the first unlocked breakthrough in their lineup skills', () => {
  const failures = [];
  for (const tid of heroTables.Ability.keys()) {
    const milestones = [...heroTables.UpStageTalent].filter(([key]) => Math.floor(key / 100) === tid && key % 100 > 0);
    const firstIds = milestones.filter(([key]) => key % 100 === 1)
      .flatMap(([, row]) => [row.skill, row.potential_skill]).filter(id => id > 0);
    assert.ok(firstIds.length > 0, String(tid));
    const lockedIds = new Set(milestones.flatMap(([, row]) => [row.skill, row.potential_skill]).filter(id => id > 0));
    const base = buildHeroSkillLoadout({ hero: heroAt(tid), heroTables, skillDatabase: database });
    const early = base.skills.map(skill => Number(skill.id)).filter(id => lockedIds.has(id));
    const firstBreak = buildHeroSkillLoadout({ hero: heroAt(tid, { breakthrough_level: 1 }), heroTables, skillDatabase: database });
    const missing = firstIds.filter(id => !firstBreak.abilityIds.includes(id));
    if (early.length || missing.length) failures.push({ tid, early, missing });
  }
  assert.equal(failures.length, 0, JSON.stringify(failures[0]));
});

test('Evan doubles its first-round attack only after breakthrough 1 and reports the same gate in 1316', () => {
  for (const stage of [0, 1]) {
    const hero = heroAt(2010101, { breakthrough_level: stage });
    const { battle, simulation } = pvpFor(hero);
    const roundOne = simulation.events.slice(0, simulation.events.findIndex(event => event.kind === 'round-end'));
    const firstRound = roundOne.filter(event => event.kind === 'action-start' && event.srcId === 101 && event.actionType === 1);
    assert.equal(firstRound.length, stage + 1, `Evan breakthrough ${stage}`);
    assert.equal(lineupSkills(hero).includes(120001001), stage === 1);
    assert.deepEqual(battle.fighter_list.find(unit => unit.id === 101).ability_list, lineupSkills(hero));
  }
});

test('all 380 mastery tiers select the current original ID independently of mastery level', () => {
  const types = readFightAbilityTypes();
  const mismatches = [];
  let count = 0;
  for (const [tid, { mastery_ability: base }] of heroTables.Ability) {
    if (!(base > 0)) continue;
    for (let tier = 1; tier <= 5; tier++) {
      const expected = base + tier - 1;
      assert.ok(types.has(expected), `original mastery reference ${expected}`);
      for (const level of [0, 1]) {
        const hero = heroAt(tid, { star: 10, mastery_level: level, mastery_break: tier });
        const loadout = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
        const ids = loadout.abilityIds.filter(id => id >= base && id < base + 5);
        const effectIds = loadout.skills.filter(skill => skill.skillSource === 'mastery-selection').map(skill => Number(skill.id));
        const entry = database.heroes.find(hero => Number(hero.id) === tid)?.skills.find(skill => Number(skill.id) === expected);
        if (ids.join(',') !== String(expected) || effectIds.join(',') !== (entry ? String(expected) : '')) {
          mismatches.push({ tid, tier, level, expected, ids, effectIds });
        }
      }
      count++;
    }
  }
  assert.equal(count, 380);
  assert.equal(mismatches.length, 0, JSON.stringify(mismatches[0]));
});

test('Rare.skill is granted separately for all nine rare heroes, never as their ordinary active', () => {
  for (const [tid, { skill: rareId }] of Rare) {
    const hero = heroAt(tid, { rare: true });
    const expected = lineupSkills(hero);
    const { battle } = pvpFor(hero);
    const unit = battle.fighter_list.find(unit => unit.id === 101);
    const active = heroTables.Ability.get(tid).ability[1];
    assert.ok(expected.includes(rareId), String(tid));
    assert.deepEqual(unit.ability_list, expected);
    assert.equal(Number(firstActive(battle)?.ab_tid), active);
    assert.equal(unit.skills.find(skill => Number(skill.id) === rareId)?.type, 'Passive');
  }
});

test('Lunael round-end rare shield is an actual passive effect only in the rare state', () => {
  for (const rare of [false, true]) {
    const { simulation } = pvpFor(heroAt(1030101, { rare }));
    const shieldActions = new Set(simulation.events.filter(event => event.kind === 'passive-action-start'
      && event.srcId === 101 && event.abilityId === 6103010109).map(event => event.id));
    assert.equal(simulation.events.some(event => event.kind === 'shield' && shieldActions.has(event.id)), rare);
  }
});

test('all 68 Diff.skill references require the diff marker and are never placeholder active effects', () => {
  assert.equal(Diff.size, 68);
  for (const [tid, { skill: id }] of Diff) {
    const base = buildHeroSkillLoadout({ hero: heroAt(tid), heroTables, skillDatabase: database });
    const diff = buildHeroSkillLoadout({ hero: heroAt(tid, { diff: '1' }), heroTables, skillDatabase: database });
    assert.ok(!base.abilityIds.includes(id), `${tid} ordinary`);
    assert.deepEqual(diff.abilityIds, [...base.abilityIds, id]);
    assert.ok(!diff.skills.some(skill => Number(skill.id) === id && skill.category === 'metadata fallback'));
  }
});

test('the diff marker and skill agree in Journey and PvP replay payloads', () => {
  const hero = heroAt(1010101, { diff: '1' });
  for (const report of [journeyFor(hero), pvpFor(hero).battle]) {
    const wire = codec.unpack('pb_fight_report_battle', codec.pack('pb_fight_report_battle', report));
    const fighter = wire.fighter_list.find(unit => Number(unit.id) === 101);
    assert.equal(Number(fighter.hero_diff), 1);
    assert.deepEqual(fighter.ability_list.map(Number), lineupSkills(hero));
  }
});

test('two mutant skills and replay flags require the matching persisted mutation ID', () => {
  const cache = createLineupAttributeCache();
  for (const [tid, mutant, skillId] of [[2020601, 1, 6202060112], [1020601, 2, 6102060102]]) {
    for (const marker of [0, 3 - mutant, mutant]) {
      const expected = marker === mutant;
      const hero = heroAt(tid, { mutant: marker });
      const attributes = cache.get({ model: modelFor(hero), heroTables, attributeTables });
      assert.equal(attributes.lineup_attr.attr_list[0].skills.includes(skillId), expected, `${tid} mutant ${marker}`);
      for (const report of [journeyFor(hero), pvpFor(hero).battle]) {
        const fighter = report.fighter_list.find(unit => unit.id === 101);
        assert.equal(fighter.skills.some(skill => Number(skill.id) === skillId), expected);
        const wire = codec.unpack('pb_fight_report_battle', codec.pack('pb_fight_report_battle', report));
        assert.equal(Boolean(wire.fighter_list.find(unit => Number(unit.id) === 101).is_mutant), expected);
        assert.equal(Boolean(wire.atk_brief_lineup.team_list[0].fighter_list[0].is_mutant), expected);
      }
    }
  }
});

test('Glow Shadow emits the mutant shield only with its configured mutation', () => {
  for (const mutant of [0, 2]) {
    const { simulation } = pvpFor(heroAt(1020601, { mutant }));
    const windows = new Set(simulation.events.filter(event => event.kind === 'passive-action-start'
      && event.srcId === 101 && event.abilityId === 6102060102).map(event => event.id));
    assert.equal(simulation.events.some(event => event.kind === 'shield' && windows.has(event.id)), mutant === 2);
  }
});

const tianjiHeroes = [...heroTables.Ability].filter(([, row]) => row.soul_ability > 0);
const knownTianjiPrices = new Set([
  2104010123, 2104020123, 2104030123, 2204010123, 2204020123,
  2304010123, 2404020123, 2504010123, 2504020123, 2504060123
]);

function ordinaryActiveOf(hero) {
  const { level } = heroTables.AbilityLevel.get(hero.quality * 100 + hero.star);
  const { ability } = heroTables.Ability.get(hero.tid);
  const types = readFightAbilityTypes();
  return ability.map((id, slot) => level[slot] > 0 ? Math.floor(id / 10) * 10 + level[slot] : 0)
    .find(id => types.get(id)?.type === 2 && types.get(id)?.runType !== 5);
}

test('all 18 base-quality eligible heroes keep ordinary and Tianji actions in 1316, Journey and PvP', () => {
  assert.equal(tianjiHeroes.length, 18);
  for (const [tid, { soul_ability: tianjiId }] of tianjiHeroes) {
    const hero = heroAt(tid);
    const activeId = ordinaryActiveOf(hero);
    assert.ok(activeId, `${tid} has a distinct ordinary action`);
    assert.deepEqual(readFightAbilityTypes().get(tianjiId), { type: 2, runType: 5 });
    for (const state of [hero, heroAt(tid, { quality: 50, rare: true })]) {
      const ids = lineupSkills(state);
      assert.equal(ids[0], tianjiId, `${tid} original Tianji reference`);
      assert.equal(ids.filter(id => id === tianjiId).length, 1);
      assert.ok(ids.includes(ordinaryActiveOf(state)), `${tid} ordinary action is preserved`);
    }
    const journey = reportBattle(codec, modelFor(hero), { missionId: 10201 }, {}, attributeTables);
    for (const report of [journey, pvpFor(hero).battle]) {
      const fighter = report.fighter_list.find(unit => unit.id === 101);
      assert.equal(fighter.activeAbilityId, activeId, `${tid} ordinary selector`);
      assert.equal(fighter.tianjiAbilityId, tianjiId, `${tid} Tianji selector`);
      assert.deepEqual(fighter.ability_list, lineupSkills(hero));
    }
  }
});

test('raising a non-eligible base quality or setting rare does not unlock a Tianji reference', () => {
  const tid = 3030501;
  const tianjiId = 2504010123;
  const ability = heroTables.Ability.get(tid);
  const tables = { ...heroTables, Ability: new Map(heroTables.Ability).set(tid, { ...ability, soul_ability: tianjiId }) };
  const hero = heroAt(tid, { quality: 70, star: 5, rare: true });
  const loadout = buildHeroSkillLoadout({ hero, heroTables: tables, skillDatabase: database });
  assert.ok(!loadout.abilityIds.includes(tianjiId));
  assert.ok(loadout.abilityIds.includes(ordinaryActiveOf(hero)));
});

test('千千结 keeps its Tianji reference in 1316 but does not equip an effect with disputed ownership', () => {
  const hero = heroAt(4040401);
  const id = heroTables.Ability.get(hero.tid).soul_ability;
  const loadout = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  assert.equal(id, 2404040123);
  assert.ok(lineupSkills(hero).includes(id));
  assert.ok(loadout.abilityIds.includes(ordinaryActiveOf(hero)));
  assert.ok(!loadout.skills.some(skill => Number(skill.id) === id));
  assert.ok(loadout.warnings.includes('tianji-effect-unresolved:' + id));
});

function tianjiTrial(hero, initialTianji, legacyTianjiId) {
  const { abilityIds, skills } = buildHeroSkillLoadout({ hero, heroTables, skillDatabase: database });
  const selection = selectFightActionIds(abilityIds);
  const actionIds = legacyTianjiId === undefined ? selection : { abilityId: selection.abilityId, activeAbilityId: legacyTianjiId };
  const simulation = simulateBattle({
    attackers: [{ id: 101, role: hero.tid, maxHp: 10000, attack: 100, speed: 100, initialEnergy: FIGHT_ENERGY_MAX,
      initialTianji, skills, ...actionIds }],
    defenders: [{ id: 201, maxHp: 100000, attack: 1, speed: 1, skills: [], initialEnergy: 0 }],
    maxRounds: 1
  });
  const starts = simulation.events.filter(event => event.kind === 'action-start' && event.srcId === 101);
  const spends = simulation.events.filter(event => event.kind === 'proprietary-tianji' && event.aimId === 101 && event.delta < 0);
  return { first: starts[0], spends, actor: simulation.attackers[0] };
}

test('known Tianji costs take three points without using anger; other heroes keep their ordinary cast', () => {
  let priced = 0;
  let unpriced = 0;
  for (const [tid, { soul_ability: tianjiId }] of tianjiHeroes) {
    const hero = heroAt(tid);
    const activeId = ordinaryActiveOf(hero);
    const empty = tianjiTrial(hero, 0);
    assert.equal(empty.first.abilityId, activeId, `${tid} has no Tianji points`);
    assert.deepEqual(empty.spends, []);
    const full = tianjiTrial(hero, 3);
    if (knownTianjiPrices.has(tianjiId)) {
      priced++;
      assert.equal(full.first.abilityId, tianjiId, `${tid} casts its own Tianji`);
      assert.deepEqual(full.spends.map(event => event.delta), [-3], `${tid} uses the described Tianji cost`);
      assert.equal(full.actor.energy, FIGHT_ENERGY_MAX, `${tid} does not pay ordinary anger`);
    } else {
      unpriced++;
      assert.equal(full.first.abilityId, activeId, `${tid} has no evidenced Tianji cost`);
      assert.deepEqual(full.spends, []);
    }
  }
  assert.equal(priced, 10);
  assert.equal(unpriced, 8);
});

test('Agnes and 4040101 cannot spend anger on Tianji even with a mislabelled or absent effect', () => {
  for (const [tid, tianjiId] of [[3040201, 2304020123], [4040101, 2404010123]]) {
    const hero = heroAt(tid, { rare: true });
    for (const points of [0, 9]) {
      const result = tianjiTrial(hero, points, tianjiId);
      assert.equal(result.first.actionType, 1, `${tid} was supplied no ordinary active`);
      assert.equal(result.actor.energy, FIGHT_ENERGY_MAX, `${tid} must not pay anger`);
      assert.deepEqual(result.spends, []);
    }
  }
});

test('5040101 mastery can fund a real PvP Tianji cast whose replay keeps both action IDs', () => {
  const hero = heroAt(5040101, { star: 10, mastery_break: 4 });
  const { battle, simulation } = pvpFor(hero, heroAt(2010101), 100000000);
  const casts = packets(battle, 101, 'pb_fat_action_before')
    .filter(action => Number(action.src_id) === 101 && Number(action.type) === 2)
    .map(action => Number(action.ab_tid));
  assert.ok(casts.includes(ordinaryActiveOf(hero)));
  assert.ok(casts.includes(2504010123));
  assert.ok(simulation.events.some(event => event.kind === 'proprietary-tianji' && event.aimId === 101
    && event.reason === 'deity-skill' && event.delta === -3));
});

function eliteTrial(hero, enemyTid) {
  return reportBattle(codec, modelFor(hero), { missionId: 101 }, {}, attributeTables, {
    mission: { fight: 15000101 }, enemies: [enemyTid], tables: { heroes: heroTables }
  });
}

test('six injected elite NPCs use their own action IDs without registering player mechanics', () => {
  const tids = [...heroTables.Npc_Ability.keys()]
    .filter(tid => heroTables.Npc.has(tid) && database.heroes.some(hero => Number(hero.id) === tid))
    .sort((left, right) => left - right);
  assert.deepEqual(tids, [5040201, 5040301, 5040401, 5040501, 5040601, 5040701]);
  const leaks = [];
  for (const tid of tids) {
    const report = eliteTrial(heroAt(2010101, { breakthrough_level: 1 }), tid);
    const fighter = report.fighter_list.find(unit => unit.id === 201);
    const source = heroTables.Npc_Ability.get(tid).ability;
    assert.equal(fighter.role_type, 2);
    assert.deepEqual(fighter.ability_list, source);
    const actions = packets(report, 101, 'pb_fat_action_before').filter(action => Number(action.src_id) === 201);
    assert.ok(actions.length > 0, `${tid} still performs compatibility actions`);
    const wrongIds = actions.flatMap(action => {
      const row = readFightAbilityTypes().get(Number(action.ab_tid));
      return source.includes(Number(action.ab_tid)) && row?.type === Number(action.type) ? [] : [Number(action.ab_tid)];
    });
    if (tid === 5040601) assert.ok(actions.some(action => Number(action.ab_tid) === 2504060113));
    const proprietary = report.simulation.events.filter(event => event.kind.startsWith('proprietary-')
      && (event.aimId === 201 || event.srcId === 201)).map(event => event.kind);
    if (!Array.isArray(fighter.skills) || fighter.skills.length || proprietary.length || wrongIds.length) {
      leaks.push({ tid, actions: [...new Set(wrongIds)], events: [...new Set(proprietary)] });
    }
  }
  assert.deepEqual(leaks, []);
});

test('an injected elite Hero template cannot borrow the same-TID owned player breakthrough', () => {
  const report = eliteTrial(heroAt(2010101, { breakthrough_level: 1 }), 2010101);
  const firstRound = report.simulation.events.slice(0, report.simulation.events.findIndex(event => event.kind === 'round-end'));
  const count = id => firstRound.filter(event => event.kind === 'action-start' && event.srcId === id).length;
  assert.equal(count(101), 2, 'the persisted player has the breakthrough');
  assert.equal(count(201), 1, 'the injected template is not the owned player');
});
