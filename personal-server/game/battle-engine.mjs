import {
  loadSkillDatabase,
  getHeroSkills,
  applySkillEffects,
  registerPassiveTriggers,
  processTriggers,
  processBuffTicks,
} from './effects/skill-integration.mjs';

export const BATTLE_RESULT = Object.freeze({ DRAW: 0, WIN: 1, LOSS: 2 });

const MAX_ACTIVE_UNITS = 12;
// EntityFighter.Init reads FightTable.SpecialAb(TID_FIGHT_ANGER_CONST=1).skill_base,
// whose shipped value is 1000. The client therefore renders a 500 value as 50% and
// a 250 gain as one 25% segment; using a 0..100 scale leaves the meter nearly empty.
export const FIGHT_ENERGY_MAX = 1000;
export const FIGHT_INITIAL_ENERGY = 500;
export const FIGHT_ENERGY_GAIN = 250;
export const FIGHT_ENERGY_ON_HIT = 80;
export const FIGHT_ATTR = Object.freeze({ ANGER: 67, MAX_ANGER: 180 });

const PROFESSION_BEHAVIORS = Object.freeze({
  1: 'guardian',
  2: 'breaker',
  3: 'hunter',
  4: 'elementalist',
  5: 'support'
});

// These profiles are local prototype rules. They use the shipped hero identities and
// professions, but do not claim to reproduce the original server's complete skill engine.
const ROLE_BEHAVIORS = new Map([
  [2010101, 'guardian'],
  [2010201, 'breaker'],
  [1020601, 'hunter'],
  [2020601, 'shadow-calamus']
]);

const COMBINATION_PARTNERS = new Map([
  [2010101, 2010201],
  [2010201, 2010101]
]);

const BEHAVIORS = Object.freeze({
  guardian: { basicMultiplier: 0.9, skillMultiplier: 0.75, skill: 'shield', critChance: 0.08 },
  breaker: { basicMultiplier: 1.05, skillMultiplier: 2.35, skill: 'heavy-strike', critChance: 0.12 },
  // TID_GRACE (1020601) is a hunter whose active skill targets the entire
  // enemy front row. FightTable stores loc 1..3 in the front row and 4..6 in
  // the back row for a standard six-slot formation.
  hunter: { basicMultiplier: 0.95, skillMultiplier: 2, skill: 'front-row-all', critChance: 0.18 },
  // TID_CALAMUS (2020601) has a single-target active skill. A kill repeats
  // the attack against the next living enemy until a strike fails to kill.
  'shadow-calamus': { basicMultiplier: 0.85, skillMultiplier: 2, skill: 'kill-chain', critChance: 0.1 },
  elementalist: { basicMultiplier: 0.85, skillMultiplier: 1.05, skill: 'area', critChance: 0.1 },
  support: { basicMultiplier: 0.8, skillMultiplier: 0.9, skill: 'revive-or-shield', critChance: 0.06 },
  striker: { basicMultiplier: 1, skillMultiplier: 1.75, skill: 'heavy-strike', critChance: 0.1 }
});

function finitePositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(name + ' must be positive');
  return value;
}

function normalizeUnit(unit, skillDatabase) {
  if (!unit || !Number.isSafeInteger(unit.id) || unit.id <= 0) throw new Error('Battle unit id is invalid');
  const maxHp = Math.floor(finitePositive(Number(unit.maxHp), 'maxHp'));
  const attack = finitePositive(Number(unit.attack), 'attack');
  const defense = Math.max(0, Number(unit.defense ?? 0));
  const speed = finitePositive(Number(unit.speed ?? 100), 'speed');
  const initialEnergy = Math.max(0, Math.min(FIGHT_ENERGY_MAX, Number(unit.initialEnergy ?? FIGHT_INITIAL_ENERGY)));

  // Load hero skills if skill database is available
  let skills = [];
  if (skillDatabase) {
    skills = getHeroSkills(unit.id, skillDatabase);
  }

  return {
    id: unit.id,
    team: unit.team,
    role: Number(unit.role ?? 0),
    profession: Number(unit.profession ?? 0),
    loc: Number(unit.loc ?? unit.id),
    abilityId: Number(unit.abilityId ?? 0),
    activeAbilityId: Number(unit.activeAbilityId ?? unit.abilityId ?? 0),
    behavior: String(unit.behavior ?? ''),
    maxHp,
    attack,
    defense,
    speed,
    critChance: Math.max(0, Math.min(0.75, Number(unit.critChance ?? 0))),
    hp: maxHp,
    shield: 0,
    energy: initialEnergy,
    alive: true,
    reviveOnce: Boolean(unit.reviveOnce),
    reviveHpRatio: Math.max(0.05, Math.min(0.75, Number(unit.reviveHpRatio ?? 0.3))),
    // New fields for skill system
    skills,
    buffs: [],
    debuffs: [],
    triggers: [],
    cooldowns: new Map(),
    damageTaken: 0,
    damageDealt: 0,
    healsReceived: 0,
    kills: 0,
  };
}

function behaviorName(unit) {
  return unit.behavior || ROLE_BEHAVIORS.get(unit.role) || PROFESSION_BEHAVIORS[unit.profession] || 'striker';
}

function behaviorFor(unit) {
  return BEHAVIORS[behaviorName(unit)] ?? BEHAVIORS.striker;
}

function nextRandom(state) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 0x100000000;
}

function byLocation(a, b) {
  return a.loc - b.loc || a.id - b.id;
}

function byHealthRatio(a, b) {
  return a.hp / a.maxHp - b.hp / b.maxHp || byLocation(a, b);
}

function living(team) {
  return team.filter(unit => unit.alive);
}

function enemiesOf(actor, allUnits) {
  return living(allUnits.filter(unit => unit.team !== actor.team));
}

function alliesOf(actor, allUnits) {
  return living(allUnits.filter(unit => unit.team === actor.team));
}

function chooseTargets(actor, allUnits, mode) {
  const opponents = enemiesOf(actor, allUnits);
  if (!opponents.length) return [];
  if (mode === 'all') return opponents.sort(byLocation);
  if (mode === 'front-row-all') {
    const front = opponents.filter(unit => unit.loc >= 1 && unit.loc <= 3).sort(byLocation);
    return front.length ? front : [[...opponents].sort(byLocation)[0]];
  }
  if (mode === 'lowest') return [[...opponents].sort(byHealthRatio)[0]];
  if (mode === 'back') return [[...opponents].sort((a, b) => byLocation(b, a))[0]];
  return [[...opponents].sort(byLocation)[0]];
}

function chooseShieldTargets(actor, allUnits, count) {
  return [...alliesOf(actor, allUnits)].sort(byHealthRatio).slice(0, count);
}

function emitDamage(actionId, actor, target, multiplier, state, bonus = 0) {
  if (!target.alive) return null;
  const behavior = behaviorFor(actor);
  const variance = 0.92 + nextRandom(state) * 0.16;
  const critical = nextRandom(state) < Math.max(actor.critChance, behavior.critChance);
  const raw = Math.max(1, actor.attack * multiplier - target.defense * 0.45 + bonus);
  const damage = Math.max(1, Math.floor(raw * variance * (critical ? 1.5 : 1)));
  const oldHp = target.hp;
  const oldShield = target.shield;
  const absorbed = Math.min(oldShield, damage);
  target.shield = oldShield - absorbed;
  target.hp = Math.max(0, oldHp - (damage - absorbed));
  target.energy = Math.min(FIGHT_ENERGY_MAX, target.energy + FIGHT_ENERGY_ON_HIT);
  if (target.hp === 0) target.alive = false;
  return {
    aimId: target.id,
    srcId: actor.id,
    value: damage,
    critical,
    oldHp,
    hp: target.hp,
    oldShield,
    shield: target.shield
  };
}

function applyShield(events, actionId, target, amount) {
  const applied = Math.max(0, Math.floor(amount));
  if (!target.alive || !applied) return;
  target.shield += applied;
  events.push({ kind: 'shield', id: actionId, aimId: target.id, shield: target.shield });
}

function emitAutoRevives(events, actionId, allUnits) {
  for (const unit of allUnits) {
    if (unit.alive || !unit.reviveOnce) continue;
    unit.reviveOnce = false;
    unit.alive = true;
    unit.hp = Math.max(1, Math.floor(unit.maxHp * unit.reviveHpRatio));
    unit.shield = 0;
    unit.energy = 0;
    events.push({ kind: 'revive', id: actionId, aimId: unit.id, hp: unit.hp });
  }
}

function emitDeathEvents(events, actionId, actor, harmList) {
  for (const harm of harmList) {
    if (harm.hp === 0 && harm.oldHp > 0) {
      events.push({ kind: 'death', id: actionId, srcId: actor.id, aimId: harm.aimId, count: 1 });
    }
  }
}

function executeAttack(events, actionId, actor, targets, multiplier, state, bonusFor = () => 0) {
  const harmList = [];
  for (const target of targets) {
    if (!target.alive) continue;
    const harm = emitDamage(actionId, actor, target, multiplier, state, bonusFor(target));
    if (harm) harmList.push(harm);
  }
  if (!harmList.length) return harmList;
  events.push({ kind: 'damage', id: actionId, harms: harmList });
  emitDeathEvents(events, actionId, actor, harmList);
  return harmList;
}

function startAction(events, actor, actionId, targets, abilityId, actionType, assistIds = []) {
  events.push({
    kind: 'action-start',
    id: actionId,
    srcId: actor.id,
    assistIds,
    aimList: targets.map(target => target.id),
    abilityId,
    actionType
  });
}

function combinationAssistIds(actor, allUnits, useSkill) {
  if (!useSkill) return [];
  const partnerRole = COMBINATION_PARTNERS.get(actor.role);
  if (!partnerRole) return [];
  const partner = living(allUnits).find(unit => unit.team === actor.team && unit.role === partnerRole);
  return partner ? [partner.id] : [];
}

function emitAngerSync(events, actionId, beforeEnergy, allUnits) {
  const attrList = [];
  for (const unit of allUnits) {
    if (unit.energy === beforeEnergy.get(unit.id)) continue;
    attrList.push({ aimId: unit.id, attrType: FIGHT_ATTR.ANGER, attrValue: unit.energy, ignoreTip: true });
  }
  if (attrList.length) events.push({ kind: 'anger-sync', id: actionId, attrList });
}

function executeTurn(events, actor, allUnits, state) {
  let actionId = state.nextActionId++;
  const behavior = behaviorFor(actor);
  const useSkill = actor.energy >= FIGHT_ENERGY_MAX;
  const abilityId = (useSkill ? actor.activeAbilityId : actor.abilityId) || 1;
  const actionType = useSkill ? 2 : 1;
  const assistIds = combinationAssistIds(actor, allUnits, useSkill);
  const beforeEnergy = new Map(allUnits.map(unit => [unit.id, unit.energy]));
  const team = allUnits.filter(unit => unit.team === actor.team);

  if (useSkill && behavior.skill === 'area') {
    const targets = chooseTargets(actor, allUnits, 'all');
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets, behavior.skillMultiplier, state);
  } else if (useSkill && behavior.skill === 'kill-chain') {
    while (enemiesOf(actor, allUnits).length) {
      const targets = chooseTargets(actor, allUnits, 'lowest');
      startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
      executeAttack(events, actionId, actor, targets, behavior.skillMultiplier, state);
      if (targets[0].alive || !enemiesOf(actor, allUnits).length) break;
      events.push({ kind: 'action-end', id: actionId });
      actionId = state.nextActionId++;
    }
  } else if (useSkill && behavior.skill === 'execute') {
    const targets = chooseTargets(actor, allUnits, 'lowest');
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets, behavior.skillMultiplier, state, target => {
      return (1 - target.hp / target.maxHp) * actor.attack * 1.4;
    });
  } else if (useSkill && behavior.skill === 'front-row-all') {
    const targets = chooseTargets(actor, allUnits, 'front-row-all');
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets, behavior.skillMultiplier, state);
  } else if (useSkill && behavior.skill === 'heavy-strike') {
    const targets = chooseTargets(actor, allUnits, 'front');
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets, behavior.skillMultiplier, state);
  } else if (useSkill && behavior.skill === 'shield') {
    const targets = chooseTargets(actor, allUnits, 'front');
    const shieldTargets = chooseShieldTargets(actor, allUnits, 1);
    startAction(events, actor, actionId, [...targets, ...shieldTargets], abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets, behavior.skillMultiplier, state);
    for (const target of shieldTargets) applyShield(events, actionId, target, target.maxHp * 0.18);
  } else if (useSkill && behavior.skill === 'revive-or-shield') {
    const deadAlly = team.filter(unit => !unit.alive).sort(byLocation)[0];
    if (deadAlly) {
      startAction(events, actor, actionId, [deadAlly], abilityId, actionType, assistIds);
      deadAlly.alive = true;
      deadAlly.hp = Math.max(1, Math.floor(deadAlly.maxHp * 0.35));
      deadAlly.shield = 0;
      deadAlly.energy = 0;
      events.push({ kind: 'revive', id: actionId, aimId: deadAlly.id, hp: deadAlly.hp });
    } else {
      const shieldTargets = chooseShieldTargets(actor, allUnits, 2);
      startAction(events, actor, actionId, shieldTargets, abilityId, actionType, assistIds);
      for (const target of shieldTargets) applyShield(events, actionId, target, target.maxHp * 0.14);
    }
  } else {
    const name = behaviorName(actor);
    const mode = name === 'hunter' ? 'lowest' : name === 'elementalist' || name === 'shadow-calamus' ? 'back' : 'front';
    const targets = chooseTargets(actor, allUnits, mode);
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets, behavior.basicMultiplier, state);
  }

  actor.energy = useSkill ? 0 : Math.min(FIGHT_ENERGY_MAX, actor.energy + FIGHT_ENERGY_GAIN);
  emitAutoRevives(events, actionId, allUnits);
  emitAngerSync(events, actionId, beforeEnergy, allUnits);
  events.push({ kind: 'action-end', id: actionId });
}

function validateTeams(attackers, defenders) {
  if (!Array.isArray(attackers) || !attackers.length) throw new Error('Attacker team is empty');
  if (!Array.isArray(defenders) || !defenders.length) throw new Error('Defender team is empty');
  if (attackers.length > 6 || defenders.length > 6) throw new Error('Battle team exceeds six units');
  if (attackers.length + defenders.length > MAX_ACTIVE_UNITS) throw new Error('Battle unit count exceeds limit');
  const ids = new Set();
  for (const unit of [...attackers, ...defenders]) {
    if (ids.has(unit.id)) throw new Error('Battle unit id is duplicated');
    ids.add(unit.id);
  }
}

export function simulateBattle({ attackers, defenders, seed = 1, maxRounds = 30 }) {
  validateTeams(attackers, defenders);
  if (!Number.isSafeInteger(maxRounds) || maxRounds < 1 || maxRounds > 100) throw new Error('maxRounds is invalid');
  const skillDatabase = loadSkillDatabase();
  const attackerTeam = attackers.map(unit => normalizeUnit({ ...unit, team: 1 }, skillDatabase));
  const defenderTeam = defenders.map(unit => normalizeUnit({ ...unit, team: 2 }, skillDatabase));
  const allUnits = [...attackerTeam, ...defenderTeam];
  const events = [];
  const turnState = { seed: (Number(seed) >>> 0) || 1, nextActionId: 1, skillDatabase, random: null };
  // register passive triggers
  for (const u of allUnits) {
    registerPassiveTriggers(u, skillDatabase, turnState);
  }
  let result = BATTLE_RESULT.DRAW;
  let overRound = 0;

  for (let round = 1; round <= maxRounds; round++) {
    events.push({ kind: 'round-start', round });
    const order = [...living(attackerTeam), ...living(defenderTeam)].sort((a, b) => b.speed - a.speed || a.id - b.id);
    for (const actor of order) {
      if (!actor.alive) continue;
      if (!living(attackerTeam).length || !living(defenderTeam).length) break;
      executeTurn(events, actor, allUnits, turnState);
      if (!living(attackerTeam).length || !living(defenderTeam).length) break;
    }
    events.push({ kind: 'round-end', round });
    overRound = round;
    if (!living(defenderTeam).length) {
      result = BATTLE_RESULT.WIN;
      break;
    }
    if (!living(attackerTeam).length) {
      result = BATTLE_RESULT.LOSS;
      break;
    }
  }

  events.push({ kind: 'battle-end', result });
  return {
    result,
    overRound,
    events,
    actionCount: turnState.nextActionId - 1,
    attackers: attackerTeam.map(unit => ({ id: unit.id, hp: unit.hp, maxHp: unit.maxHp, shield: unit.shield, energy: unit.energy, alive: unit.alive })),
    defenders: defenderTeam.map(unit => ({ id: unit.id, hp: unit.hp, maxHp: unit.maxHp, shield: unit.shield, energy: unit.energy, alive: unit.alive })),
    pendingRevives: allUnits.filter(unit => !unit.alive && unit.reviveOnce).map(unit => unit.id)
  };
}

export function battleBehaviorFor(unit) {
  return behaviorName(unit);
}
