import {
  loadSkillDatabase,
  getHeroSkills,
  applySkillEffects,
  collectSkillTargets,
  registerPassiveTriggers,
  processTriggers,
  processBuffTicks,
  resetRoundTriggers,
  resolveActionSkill,
} from './effects/skill-integration.mjs';
import {
  effectiveAttack,
  effectiveCritChance,
  effectiveCritMultiplier,
  effectiveDamageBonus,
  effectiveDamageReduction,
  effectiveDefense,
  effectiveEnergyBonus,
  effectiveIgnoreDefense,
  effectiveShieldBonus,
  effectiveSpeed,
  consumeTriggerCount,
  recordActionDamage,
  actionScopedType,
} from './effects/effect-executor.mjs';
import {
  PROPRIETARY_HOOKS,
  absorbDamage,
  advanceDomains,
  createProprietaryState,
  resetProprietaryRound,
  runHooks,
  spendTianji,
  tianjiValue,
} from './effects/proprietary-state.mjs';
import { initProprietaryBattle, isDeitySkill, tianjiCostFor } from './effects/proprietary-rules.mjs';
import {
  BUFF_CHANGE_REASON,
  BUFF_SIGN,
  provenBuffTid,
  removesOnDeath,
} from './effects/report-codes.mjs';

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

  // A caller that has authoritative progression must pass the filtered catalog.
  // Role-only tests and systems without roster state retain the legacy lookup.
  let skills = [];
  if (skillDatabase) {
    skills = Array.isArray(unit.skills)
      ? unit.skills
      : getHeroSkills(unit.role ?? unit.id, skillDatabase);
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
    proprietary: createProprietaryState(unit),
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
  const actionType = actionScopedType(state);
  const critChance = effectiveCritChance({
    ...actor,
    critChance: Math.max(actor.critChance, behavior.critChance),
  }, target, actionType);
  const critical = nextRandom(state) < critChance;
  const ignoreDefense = effectiveIgnoreDefense(actor);
  const raw = Math.max(1,
    effectiveAttack(actor) * multiplier
    - effectiveDefense(target) * 0.45 * (1 - ignoreDefense)
    + bonus);
  const critMultiplier = critical ? effectiveCritMultiplier(actor, target) : 1;
  let damage = Math.max(1, Math.floor(
    raw * variance * (1 + effectiveDamageBonus(actor, actionType)) * critMultiplier
  ));
  damage = Math.max(1, Math.floor(damage * (1 - effectiveDamageReduction(target))));
  const oldShield = target.shield;
  // Shield, 超凡生命 and HP are resolved in one shared helper so the effect
  // executor and this fallback path cannot disagree about what a hit does.
  const applied = absorbDamage(target, damage, { sourceId: actor.id, events: state?.events });
  const absorbed = applied.absorbed + applied.superAbsorbed + applied.summonAbsorbed;
  const oldHp = applied.oldHp;
  target.energy = Math.min(
    FIGHT_ENERGY_MAX,
    target.energy + FIGHT_ENERGY_ON_HIT * (1 + effectiveEnergyBonus(target))
  );
  const hpDamage = recordActionDamage(actor, target, oldHp, target.hp, absorbed, state);
  consumeTriggerCount(target, 'damage-taken');
  return {
    aimId: target.id,
    srcId: actor.id,
    value: damage,
    hpDamage,
    absorbed,
    critical,
    oldHp,
    hp: target.hp,
    oldShield,
    shield: target.shield
  };
}

function applyShield(events, actionId, target, amount) {
  const applied = Math.max(0, Math.floor(amount * (1 + effectiveShieldBonus(target))));
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

// The client keeps one layer counter per buff tid and subtracts the reported
// overlay, so every removal has to carry the real layer count that vanished.
function statusLayers(status) {
  return Math.max(1, Math.floor(Number(status?.stacks) || 1));
}

// dead_rm=true rows are proven for the three statuses this engine can map to a
// FightTable.Buff tid (stun 10001, poison 11003, burning 11004), so a death
// removes exactly those layers and reports change_reason=DEAD. Unproven
// statuses keep their previous behaviour and stay unreported.
function collectDeathBuffChanges(buffChanges, unit) {
  const statuses = [...(unit.buffs || []), ...(unit.debuffs || [])];
  let removedAny = false;
  for (const status of statuses) {
    if (!removesOnDeath(status.type)) continue;
    removedAny = true;
    buffChanges.push({
      aimId: unit.id,
      tid: provenBuffTid(status.type),
      overlay: statusLayers(status),
      sign: BUFF_SIGN.REMOVE,
      casterId: Number(status.source ?? 0) || 0,
      changeReason: BUFF_CHANGE_REASON.DEAD,
      abilityId: 0,
    });
  }
  if (!removedAny) return buffChanges;
  unit.buffs = (unit.buffs || []).filter(status => !removesOnDeath(status.type));
  unit.debuffs = (unit.debuffs || []).filter(status => !removesOnDeath(status.type));
  return buffChanges;
}

function emitDeathEvents(events, actionId, actor, harmList, allUnits = null) {
  for (const harm of harmList) {
    if (harm.hp === 0 && harm.oldHp > 0) {
      events.push({ kind: 'death', id: actionId, srcId: actor.id, aimId: harm.aimId, count: 1 });
      const target = allUnits?.find(unit => unit.id === harm.aimId);
      if (target) {
        const buffChanges = collectDeathBuffChanges([], target);
        if (buffChanges.length) events.push({ kind: 'buff-change', id: actionId, buffs: buffChanges });
      }
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
  emitDeathEvents(events, actionId, actor, harmList, state.allUnits);
  handleDamageTriggers(events, actionId, actor, harmList, state);
  return harmList;
}

function unitHasStatus(unit, ...types) {
  const wanted = new Set(types);
  return [...(unit.buffs || []), ...(unit.debuffs || [])]
    .some(status => wanted.has(status.type) || wanted.has(status.statusType));
}

function rawDamageEvent(actionId, result) {
  const event = {
    kind: 'damage',
    id: actionId,
    harms: [{
      aimId: result.target,
      srcId: result.actor,
      value: result.value,
      critical: Boolean(result.crit),
      oldHp: result.oldHp,
      hp: result.newHp,
      oldShield: result.oldShield,
      shield: result.newShield,
    }],
  };
  for (const key of ['type', 'actor', 'target', 'trigger', 'triggerType', 'status', 'tick']) {
    if (result[key] !== undefined) event[key] = result[key];
  }
  return event;
}

function appendEffectResults(events, actionId, results, actor, state) {
  if (!Array.isArray(results) || !results.length) return;
  const units = new Map((state.allUnits || []).map(unit => [unit.id, unit]));
  const damageForTriggers = [];
  const buffChanges = [];

  for (const result of results) {
    if (result.type === 'damage') {
      const harm = rawDamageEvent(actionId, result).harms[0];
      events.push(rawDamageEvent(actionId, result));
      const target = units.get(result.target);
      if (target) {
        if (harm.hp === 0 && harm.oldHp > 0) {
          actor.kills = (actor.kills || 0) + 1;
          events.push({ kind: 'death', id: actionId, srcId: actor.id, aimId: target.id, count: 1 });
          collectDeathBuffChanges(buffChanges, target);
        }
      }
      damageForTriggers.push(harm);
    } else if (result.type === 'shield') {
      events.push({ kind: 'shield', id: actionId, aimId: result.target, shield: result.newShield });
    } else if (result.type === 'heal') {
      // TID_PROMPT_HEAL=107 is the positive-number prompt the client renders as
      // a recover value; a heal never changes shield, so both shield fields
      // repeat the current shield to keep the withShield branch consistent.
      const target = units.get(result.target);
      events.push({
        // Keep the executor's original fields (value/actualHeal/newHp) so
        // existing engine consumers still see the unclipped heal, then add the
        // report-facing aliases used by the action projector.
        ...result,
        kind: 'heal',
        type: 'heal',
        id: actionId,
        srcId: result.actor,
        aimId: result.target,
        hp: result.newHp,
        oldShield: target?.shield ?? 0,
        shield: target?.shield ?? 0,
        tick: result.tick === true,
        status: result.status ?? null,
      });
    } else if (result.type === 'status') {
      events.push({ ...result, kind: 'effect', id: actionId });
      const tid = provenBuffTid(result.statusType);
      // overlay is a layer delta on the client; a refresh that added nothing
      // must not produce a 103 entry.
      const layers = Math.max(0, Math.floor(Number(result.stacksDelta ?? result.stacks) || 0));
      if (tid && layers > 0) {
        buffChanges.push({
          aimId: result.target,
          tid,
          overlay: layers,
          sign: BUFF_SIGN.ADD,
          casterId: result.actor,
          changeReason: BUFF_CHANGE_REASON.NONE,
          abilityId: Number(state.currentAbilityId) || 0,
        });
      }
    } else {
      events.push({ ...result, kind: 'effect', id: actionId });
      if (result.type === 'status-expire') {
        const tid = provenBuffTid(result.statusType);
        if (tid) {
          buffChanges.push({
            aimId: result.target,
            tid,
            overlay: Math.max(1, Math.floor(Number(result.stacks) || 1)),
            sign: BUFF_SIGN.REMOVE,
            casterId: 0,
            changeReason: BUFF_CHANGE_REASON.NONE,
            abilityId: 0,
          });
        }
      } else if (result.type === 'dispel') {
        const dispelled = Array.isArray(result.removedDetail) && result.removedDetail.length
          ? result.removedDetail
          : (result.removed || []).map(statusType => ({ statusType, stacks: 1 }));
        for (const entry of dispelled) {
          const tid = provenBuffTid(entry.statusType);
          if (!tid) continue;
          buffChanges.push({
            aimId: result.target,
            tid,
            overlay: Math.max(1, Math.floor(Number(entry.stacks) || 1)),
            sign: BUFF_SIGN.REMOVE,
            casterId: result.actor,
            changeReason: BUFF_CHANGE_REASON.DISPEL,
            abilityId: 0,
          });
        }
      }
    }
  }

  if (buffChanges.length) events.push({ kind: 'buff-change', id: actionId, buffs: buffChanges });
  if (damageForTriggers.length) handleDamageTriggers(events, actionId, actor, damageForTriggers, state);

  // Status and stat modifier results are the only observable signal currently
  // exposed by the executor for a gained buff/debuff.
  for (const result of results) {
    if (result.type !== 'stat-modifier' && result.type !== 'status') continue;
    const target = units.get(result.target);
    if (target) processUnitTriggers(events, target, 'on-buff-gain', state, actionId);
  }
}

function processUnitTriggers(events, unit, triggerType, state, actionId = state.currentActionId || 0) {
  if (!unit || (state.triggerDepth || 0) >= 8) return;
  const raw = [];
  const actionContext = state.actionContext;
  const previousPhase = actionContext?.phase;
  if (actionContext) actionContext.phase = 'trigger';
  state.triggerDepth = (state.triggerDepth || 0) + 1;
  try {
    processTriggers(unit, triggerType, state.allUnits, state, raw);
    appendEffectResults(events, actionId, raw, unit, state);
  } finally {
    if (actionContext) actionContext.phase = previousPhase;
    state.triggerDepth--;
  }
}

function appendStandaloneResults(events, unit, results, state) {
  if (!unit || !Array.isArray(results) || !results.length) return;
  // A passive action still needs an existing FightTable.Ability id; reuse the
  // trigger prefix when present, otherwise the unit's own action ability.
  const triggerSkill = results.find(result => result.trigger)?.trigger;
  const parsedAbilityId = Number(String(triggerSkill || '').split('_')[0]);
  const abilityId = Number.isSafeInteger(parsedAbilityId) && parsedAbilityId > 0
    ? parsedAbilityId
    : (Number(unit.abilityId) || Number(unit.activeAbilityId) || 1);
  if (state.actionOpen) {
    appendEffectResults(events, state.currentActionId, results, unit, state);
    return;
  }

  // A visible round-start passive needs a complete action window. Reusing the
  // id of the action that is about to start is invalid when that passive ends
  // the battle before any character acts.
  const actionId = Math.max(1, state.nextActionId);
  const startIndex = events.length;
  const previousAbilityId = state.currentAbilityId;
  state.currentAbilityId = abilityId;
  try {
    appendEffectResults(events, actionId, results, unit, state);
  } finally {
    state.currentAbilityId = previousAbilityId;
  }
  const visibleKinds = new Set(['damage', 'shield', 'death', 'revive', 'anger-sync', 'buff-change']);
  // A heal that restores no HP is not a visible step; only a real recovery
  // opens a passive action window.
  if (!events.slice(startIndex).some(event => visibleKinds.has(event.kind)
    || (event.kind === 'heal' && Number(event.actualHeal ?? event.value) > 0))) return;

  state.nextActionId = actionId + 1;
  const targets = new Map();
  for (const result of results) {
    const target = state.allUnits.find(candidate => candidate.id === result.target);
    if (target) targets.set(target.id, target);
  }
  for (const event of events.slice(startIndex)) {
    const aimId = event.aimId ?? event.harms?.[0]?.aimId;
    const target = state.allUnits.find(candidate => candidate.id === aimId);
    if (target) targets.set(target.id, target);
  }
  if (!targets.size) targets.set(unit.id, unit);

  events.splice(startIndex, 0, {
    kind: 'passive-action-start',
    id: actionId,
    srcId: unit.id,
    assistIds: [],
    aimList: [...targets.values()].map(target => target.id),
    abilityId,
    actionType: 1,
    synthetic: true,
  });
  events.push({ kind: 'passive-action-end', id: actionId, synthetic: true });
}

function handleDamageTriggers(events, actionId, actor, harms, state) {
  if (state.handlingDamageTriggers) return;
  state.handlingDamageTriggers = true;
  try {
    const units = new Map(state.allUnits.map(unit => [unit.id, unit]));
    for (const harm of harms) {
      const target = units.get(harm.aimId);
      if (!target) continue;
      processUnitTriggers(events, target, 'on-being-hit', state, actionId);
      const actionType = state.actionContext?.actionType ?? null;
      runProprietary(state, PROPRIETARY_HOOKS.DAMAGE_TAKEN, { target, actor, actionId, harm, actionType }, events,
        unit => unit.id === target.id);
      runProprietary(state, PROPRIETARY_HOOKS.DAMAGE_DEALT, { target, actor, actionId, harm, actionType }, events,
        unit => unit.id === actor.id);
      if (harm.oldHp > 0 && harm.hp === 0) {
        processUnitTriggers(events, actor, 'on-kill', state, actionId);
        processUnitTriggers(events, target, 'on-death', state, actionId);
        // "敌方冒险者阵亡时，立刻释放一次追击" style reactions.
        runProprietary(state, PROPRIETARY_HOOKS.UNIT_DEATH, { unit: target, killer: actor, actionId }, events);
      } else {
        // A single trigger family backs every data threshold. processTriggers
        // evaluates each trigger's hp-below/above condition without consuming
        // conditions that are still false.
        processUnitTriggers(events, target, 'on-hp-threshold', state, actionId);
      }
    }
  } finally {
    state.handlingDamageTriggers = false;
  }
}

/** Queue one extra action produced by a proprietary reaction or mastery. */
function enqueueProprietaryAction(state, request) {
  if (!state.proprietaryQueue) state.proprietaryQueue = [];
  if (state.proprietaryQueue.length >= 4) return;
  state.proprietaryQueue.push(request);
}

/**
 * Run proprietary hooks and turn "extra-action" results into queued actions.
 * Hooks that do not request an action simply mutate state/events.
 */
function runProprietary(state, hookName, payload, events = null, filter = null) {
  const results = runHooks(state, hookName, payload, events, filter);
  for (const result of results) {
    if (!result || result.kind !== 'extra-action') continue;
    enqueueProprietaryAction(state, {
      actorId: result.actorId ?? payload.actor?.id,
      kind: result.action ?? 'attack',
      skill: result.skill ?? null,
      before: result.before ?? null,
      reason: result.reason ?? null,
    });
  }
  return results;
}

function drainProprietaryActions(events, state) {
  if (!state.proprietaryQueue?.length) return;
  if ((state.proprietaryActionDepth || 0) >= 3) {
    state.proprietaryQueue.length = 0;
    return;
  }
  state.proprietaryActionDepth = (state.proprietaryActionDepth || 0) + 1;
  try {
    while (state.proprietaryQueue.length) {
      const request = state.proprietaryQueue.shift();
      const actor = state.allUnits.find(unit => unit.id === request.actorId);
      if (!actor?.alive) continue;
      executeExtraAction(events, actor, state.allUnits, state, request);
    }
  } finally {
    state.proprietaryActionDepth--;
  }
}

// A free action granted by a mastery or reaction. It pays no energy and no
// 天极值 ("不消耗能量", "无消耗"), so only the effect pipeline and the ordinary
// after-action triggers run.
function executeExtraAction(events, actor, allUnits, state, request) {
  const actionId = state.nextActionId++;
  const behavior = behaviorFor(actor);
  const useSkill = request.kind === 'ultimate' || request.kind === 'tianji';
  const catalogSkill = request.skill ?? resolveActionSkill(actor, useSkill, state.skillDatabase);
  const abilityId = (useSkill ? actor.activeAbilityId : actor.abilityId) || 1;
  const actionType = useSkill ? 2 : 1;
  const beforeEnergy = new Map(allUnits.map(unit => [unit.id, unit.energy]));
  const assistIds = combinationAssistIds(actor, allUnits, useSkill);
  state.currentActionId = actionId;
  state.actionOpen = true;
  state.currentAbilityId = abilityId;
  state.actionContext = {
    actorId: actor.id,
    actionType: useSkill ? 'ultimate' : 'attack',
    phase: 'action',
    damage: new Map(),
    extra: true
  };
  if (typeof request.before === 'function') request.before(actor, state, events);
  runProprietary(state, PROPRIETARY_HOOKS.BEFORE_ACTION, {
    actor, actionId, useSkill, skill: catalogSkill, actionType: state.actionContext.actionType, extra: true,
    resolveTargets: () => {
      const skill = catalogSkill ?? resolveActionSkill(actor, useSkill, state.skillDatabase);
      return skill ? collectSkillTargets(skill, actor, allUnits, state) : chooseTargets(actor, allUnits, 'front');
    }
  }, events);
  if (catalogSkill) {
    const targets = collectSkillTargets(catalogSkill, actor, allUnits, state);
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    const raw = [];
    const outcome = applySkillEffects(catalogSkill, actor, allUnits, state, raw);
    appendEffectResults(events, actionId, outcome.results, actor, state);
  } else {
    const targets = chooseTargets(actor, allUnits, 'front');
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    executeAttack(events, actionId, actor, targets,
      useSkill ? behavior.skillMultiplier : behavior.basicMultiplier, state);
  }
  state.actionContext.phase = 'after';
  processUnitTriggers(events, actor, useSkill ? 'on-skill-use' : 'on-attack', state, actionId);
  if (useSkill) processUnitTriggers(events, actor, 'on-ultimate-use', state, actionId);
  runProprietary(state, PROPRIETARY_HOOKS.ACTION_END, {
    actor, actionId, useSkill, skill: catalogSkill, actionType: state.actionContext.actionType, extra: true
  }, events);
  emitAutoRevives(events, actionId, allUnits);
  emitAngerSync(events, actionId, beforeEnergy, allUnits);
  events.push({ kind: 'action-end', id: actionId });
  state.actionOpen = false;
  state.actionContext = null;
  state.currentAbilityId = 0;
}

function runRoundTrigger(events, unit, triggerType, state) {
  if (!unit || (state.triggerDepth || 0) >= 8) return;
  const raw = [];
  state.triggerDepth = (state.triggerDepth || 0) + 1;
  try {
    processTriggers(unit, triggerType, state.allUnits, state, raw);
    appendStandaloneResults(events, unit, raw, state);
  } finally {
    state.triggerDepth--;
  }
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
  const silenced = unitHasStatus(actor, 'silence');
  // 天极技 (FightTable ability type 2 / run_type 5) is paid with 天极值, never
  // with energy. A deity skill that the description gives no price for cannot
  // be cast, so the unit falls back to its normal action instead of treating
  // energy as the currency of a 天极技.
  const activeSkill = resolveActionSkill(actor, true, state.skillDatabase);
  const deitySkill = activeSkill && isDeitySkill(activeSkill) ? activeSkill : null;
  const deityCost = deitySkill ? tianjiCostFor(deitySkill) : null;
  const deityReady = Boolean(deitySkill) && deityCost !== null && !silenced
    && tianjiValue(actor) >= deityCost;
  const useSkill = deityReady || (!deitySkill && actor.energy >= FIGHT_ENERGY_MAX && !silenced);
  const actionKind = deityReady ? 'tianji' : useSkill ? 'ultimate' : 'attack';
  const abilityId = (useSkill ? actor.activeAbilityId : actor.abilityId) || 1;
  const actionType = useSkill ? 2 : 1;
  const assistIds = combinationAssistIds(actor, allUnits, useSkill);
  const beforeEnergy = new Map(allUnits.map(unit => [unit.id, unit.energy]));
  const team = allUnits.filter(unit => unit.team === actor.team);
  const catalogSkill = resolveActionSkill(actor, useSkill, state.skillDatabase);
  state.currentActionId = actionId;
  state.actionOpen = true;
  state.currentAbilityId = abilityId;
  state.actionContext = { actorId: actor.id, actionType: actionKind, phase: 'before', damage: new Map() };
  runProprietary(state, PROPRIETARY_HOOKS.ACTION_START, {
    actor, actionId, useSkill, actionType: state.actionContext.actionType
  }, events);
  processUnitTriggers(events, actor, 'on-turn-start', state, actionId);
  if (useSkill && !deityReady) processUnitTriggers(events, actor, 'before-ultimate-use', state, actionId);
  const actionModifiers = new Map([...(actor.buffs || []), ...(actor.debuffs || [])]
    .map(entry => [entry, entry.applicationId]));
  state.actionContext.phase = 'action';
  // "释放终结技前，额外摧毁敌方全体15%的护盾" style clauses run here, after
  // the turn-start and before-ultimate triggers and before any damage.
  runProprietary(state, PROPRIETARY_HOOKS.BEFORE_ACTION, {
    actor, actionId, useSkill, skill: catalogSkill, actionType: state.actionContext.actionType,
    resolveTargets: () => {
      const skill = catalogSkill ?? resolveActionSkill(actor, useSkill, state.skillDatabase);
      return skill ? collectSkillTargets(skill, actor, allUnits, state) : chooseTargets(actor, allUnits, 'front');
    }
  }, events);

  if (catalogSkill) {
    const targets = collectSkillTargets(catalogSkill, actor, allUnits, state);
    startAction(events, actor, actionId, targets, abilityId, actionType, assistIds);
    const raw = [];
    const outcome = applySkillEffects(catalogSkill, actor, allUnits, state, raw);
    appendEffectResults(events, actionId, outcome.results, actor, state);
  } else if (useSkill && behavior.skill === 'area') {
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

  if (deityReady) {
    spendTianji(actor, deityCost, { events, reason: 'deity-skill' });
  } else {
    actor.energy = useSkill ? 0 : Math.min(FIGHT_ENERGY_MAX, actor.energy + FIGHT_ENERGY_GAIN);
  }
  state.actionContext.phase = 'after';
  // "下一次终结技" modifiers are not consumed by a 天极技.
  if (!deityReady) consumeTriggerCount(actor, useSkill ? 'ultimate' : 'attack', actionModifiers);
  processUnitTriggers(events, actor, useSkill ? 'on-skill-use' : 'on-attack', state, actionId);
  if (deityReady) processUnitTriggers(events, actor, 'on-tianji-use', state, actionId);
  else if (useSkill) processUnitTriggers(events, actor, 'on-ultimate-use', state, actionId);
  processUnitTriggers(events, actor, 'on-turn-end', state, actionId);
  runProprietary(state, PROPRIETARY_HOOKS.ACTION_END, {
    actor, actionId, useSkill, skill: catalogSkill, actionType: state.actionContext.actionType
  }, events);
  emitAutoRevives(events, actionId, allUnits);
  emitAngerSync(events, actionId, beforeEnergy, allUnits);
  events.push({ kind: 'action-end', id: actionId });
  state.actionOpen = false;
  state.actionContext = null;
  state.currentAbilityId = 0;
  drainProprietaryActions(events, state);
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
  const turnState = {
    seed: (Number(seed) >>> 0) || 1,
    nextActionId: 1,
    currentActionId: 0,
    // FightTable.Ability id of the action currently being reported, used as
    // pb_buff_obj.ab_tid when a status is applied inside that action.
    currentAbilityId: 0,
    actionOpen: false,
    round: 0,
    skillDatabase,
    allUnits,
    random: null,
    triggerDepth: 0,
    handlingDamageTriggers: false,
  };
  turnState.random = () => nextRandom(turnState);
  // Proprietary helpers emit their own events; give them the stream the rest of
  // the engine writes to so a shield destruction or a summon absorb is visible
  // in the same report order.
  turnState.events = events;
  // register passive triggers
  for (const u of allUnits) {
    registerPassiveTriggers(u, skillDatabase, turnState);
  }
  // CORE-BATTLE-B: description-backed proprietary declarations (天极值, 超凡生命,
  // summons, layers, domains) and their hooks. Declarations that cannot be
  // matched against the shipped description stay inactive.
  turnState.proprietaryQueue = [];
  for (const unit of allUnits) initProprietaryBattle(unit, turnState, events);
  let result = BATTLE_RESULT.DRAW;
  let overRound = 0;

  for (let round = 1; round <= maxRounds; round++) {
    turnState.round = round;
    events.push({ kind: 'round-start', round });
    for (const unit of allUnits) resetRoundTriggers(unit);
    for (const unit of allUnits) resetProprietaryRound(unit);
    runProprietary(turnState, PROPRIETARY_HOOKS.ROUND_START, { round }, events);
    for (const unit of living(allUnits)) runRoundTrigger(events, unit, 'on-round-start', turnState);
    if (!living(attackerTeam).length || !living(defenderTeam).length) {
      events.push({ kind: 'round-end', round });
      overRound = round;
      result = !living(defenderTeam).length ? BATTLE_RESULT.WIN : BATTLE_RESULT.LOSS;
      break;
    }
    const order = living(allUnits).sort((a, b) =>
      effectiveSpeed(b) - effectiveSpeed(a) || a.id - b.id);
    for (const actor of order) {
      if (!actor.alive) continue;
      if (!living(attackerTeam).length || !living(defenderTeam).length) break;
      if (unitHasStatus(actor, 'stun', 'freeze')) {
        events.push({ kind: 'status-skip', round, srcId: actor.id });
        continue;
      }
      executeTurn(events, actor, allUnits, turnState);
      if (!living(attackerTeam).length || !living(defenderTeam).length) break;
    }
    for (const unit of living(allUnits)) runRoundTrigger(events, unit, 'on-round-end', turnState);
    for (const unit of living(allUnits)) {
      const raw = [];
      processBuffTicks(unit, turnState, raw);
      appendStandaloneResults(events, unit, raw, turnState);
    }
    runProprietary(turnState, PROPRIETARY_HOOKS.ROUND_END, { round }, events);
    advanceDomains(turnState);
    drainProprietaryActions(events, turnState);
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
