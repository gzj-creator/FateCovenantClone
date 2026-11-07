/**
 * CORE-BATTLE-B: proprietary battle mechanics.
 *
 * The generic engine models HP, shield, energy and timed buffs. Several shipped
 * descriptions need resources the generic model cannot express and must never be
 * folded into those fields:
 *
 *   天极值     an action currency that is spent and gained independently of
 *              energy (`消耗3点天极值`, `额外获得1点天极值`).
 *   超凡生命   a second life pool on top of the HP maximum
 *              (`自身超凡生命将提升至生命上限的100%`).
 *   layers     named stacks owned by a unit (`【魔能】`, `【魂】`, ...) with a
 *              per-layer stat contribution and an optional cap.
 *   summons    an untargetable companion that inherits the owner's stats and
 *              soaks fatal damage (`【迪迪】`).
 *   domains    a team-scoped timed field (`【魔能领域】`).
 *
 * Nothing in this module carries a number that is not written in a skill
 * description or a caller-provided configuration. Values that the descriptions
 * do not state (starting 天极值, the 天极值 cap) stay unset; see
 * implementation.md for the fail-closed list.
 */

export const PROPRIETARY_EVENT_KINDS = Object.freeze({
  TIANJI: 'proprietary-tianji',
  SUPER_HP: 'proprietary-super-hp',
  LAYER: 'proprietary-layer',
  SUMMON: 'proprietary-summon',
  DOMAIN: 'proprietary-domain',
  SHIELD_DESTROYED: 'proprietary-shield-destroyed',
  DAMAGE_CAPPED: 'proprietary-damage-capped',
});

/** Engine points where a proprietary rule may run. */
export const PROPRIETARY_HOOKS = Object.freeze({
  BATTLE_START: 'battle-start',
  ROUND_START: 'round-start',
  ACTION_START: 'action-start',
  BEFORE_ACTION: 'before-action',
  ULTIMATE_USE: 'ultimate-use',
  DAMAGE_DEALT: 'damage-dealt',
  DAMAGE_TAKEN: 'damage-taken',
  UNIT_DEATH: 'unit-death',
  ACTION_END: 'action-end',
  ROUND_END: 'round-end',
});

// Hook handlers may queue another action. Five nested hook levels is more than
// any shipped description asks for and stops a rule from feeding itself.
const MAX_HOOK_DEPTH = 4;

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nonNegative(value) {
  return Math.max(0, finite(value));
}

export function createProprietaryState(unit = {}) {
  const initialTianji = nonNegative(unit.initialTianji ?? 0);
  const tianjiMax = unit.tianjiMax === undefined || unit.tianjiMax === null
    ? null
    : nonNegative(unit.tianjiMax);
  return {
    tianji: { value: tianjiMax === null ? initialTianji : Math.min(initialTianji, tianjiMax), max: tianjiMax },
    superHp: { value: 0, max: 0 },
    layers: new Map(),
    layerStats: new Map(),
    summons: [],
    hooks: new Map(),
    counters: new Map(),
    rules: [],
    warnings: [],
  };
}

/** Return the proprietary container of a unit, creating it on demand. */
export function proprietaryOf(unit) {
  if (!unit) throw new Error('Proprietary state requires a battle unit');
  if (!unit.proprietary) unit.proprietary = createProprietaryState(unit);
  return unit.proprietary;
}

function emit(events, kind, payload) {
  if (!Array.isArray(events)) return;
  events.push({ kind, ...payload });
}

export function tianjiValue(unit) {
  return nonNegative(proprietaryOf(unit).tianji.value);
}

export function tianjiCap(unit) {
  return proprietaryOf(unit).tianji.max;
}

/**
 * Add 天极值. The cap only applies when the caller configured one; the shipped
 * descriptions never state a maximum, so an unset cap must not be replaced by
 * an invented number.
 */
export function gainTianji(unit, amount, { events, reason = null } = {}) {
  const gain = Math.floor(nonNegative(amount));
  const state = proprietaryOf(unit);
  const before = nonNegative(state.tianji.value);
  const uncapped = before + gain;
  state.tianji.value = state.tianji.max === null ? uncapped : Math.min(uncapped, state.tianji.max);
  const delta = state.tianji.value - before;
  if (delta) emit(events, PROPRIETARY_EVENT_KINDS.TIANJI, { aimId: unit.id, before, after: state.tianji.value, delta, reason });
  return delta;
}

/** Spend 天极值. Returns false and changes nothing when the unit is short. */
export function spendTianji(unit, amount, { events, reason = null } = {}) {
  const cost = Math.floor(nonNegative(amount));
  const state = proprietaryOf(unit);
  const before = nonNegative(state.tianji.value);
  if (cost > before) return false;
  state.tianji.value = before - cost;
  if (cost) emit(events, PROPRIETARY_EVENT_KINDS.TIANJI, { aimId: unit.id, before, after: state.tianji.value, delta: -cost, reason });
  return true;
}

/** Remove 天极值 without a cost check (enemy drain, full clear). */
export function drainTianji(unit, amount, { events, reason = null, sourceId = null } = {}) {
  const state = proprietaryOf(unit);
  const before = nonNegative(state.tianji.value);
  const removed = Math.min(before, Math.floor(nonNegative(amount)));
  state.tianji.value = before - removed;
  if (removed) {
    emit(events, PROPRIETARY_EVENT_KINDS.TIANJI, {
      aimId: unit.id, before, after: state.tianji.value, delta: -removed, reason, srcId: sourceId
    });
  }
  return removed;
}

export function superHpValue(unit) {
  return nonNegative(proprietaryOf(unit).superHp.value);
}

export function addSuperHp(unit, amount, { events, reason = null } = {}) {
  const state = proprietaryOf(unit);
  const added = Math.floor(nonNegative(amount));
  if (!added) return 0;
  state.superHp.value += added;
  state.superHp.max = Math.max(state.superHp.max, state.superHp.value);
  emit(events, PROPRIETARY_EVENT_KINDS.SUPER_HP, { aimId: unit.id, value: state.superHp.value, delta: added, reason });
  return added;
}

export function addLayer(unit, name, count = 1, { max = null, perLayer = null } = {}) {
  const key = String(name);
  const state = proprietaryOf(unit);
  const added = Math.floor(nonNegative(count));
  if (!added) return layerValue(unit, key);
  const before = nonNegative(state.layers.get(key));
  const limit = max === null || max === undefined ? null : Math.floor(nonNegative(max));
  const next = limit === null ? before + added : Math.min(before + added, limit);
  state.layers.set(key, next);
  if (Array.isArray(perLayer) && perLayer.length) state.layerStats.set(key, perLayer);
  return next;
}

export function layerValue(unit, name) {
  return nonNegative(proprietaryOf(unit).layers.get(String(name)));
}

export function setLayer(unit, name, value, { max = null, perLayer = null } = {}) {
  const key = String(name);
  const state = proprietaryOf(unit);
  const limit = max === null || max === undefined ? null : Math.floor(nonNegative(max));
  const next = Math.max(0, limit === null ? Math.floor(nonNegative(value)) : Math.min(Math.floor(nonNegative(value)), limit));
  state.layers.set(key, next);
  if (Array.isArray(perLayer) && perLayer.length) state.layerStats.set(key, perLayer);
  return next;
}

export function consumeLayers(unit, name, count = 1) {
  const key = String(name);
  const state = proprietaryOf(unit);
  const before = nonNegative(state.layers.get(key));
  const removed = Math.min(before, Math.floor(nonNegative(count)));
  state.layers.set(key, before - removed);
  return removed;
}

/** Stat entries contributed by named layers, consumed by stat total helpers. */
export function layerModifiers(unit) {
  const state = unit?.proprietary;
  if (!state || !state.layers.size) return [];
  const entries = [];
  for (const [name, stacks] of state.layers) {
    if (!(stacks > 0)) continue;
    for (const contribution of state.layerStats.get(name) ?? []) {
      entries.push({
        statType: contribution.statType,
        magnitude: finite(contribution.magnitude),
        stacks,
        stacksAdditive: contribution.stacksAdditive !== false,
        actionType: contribution.actionType ?? null,
        source: 'proprietary-layer:' + name,
      });
    }
  }
  return entries;
}

/**
 * Register an untargetable companion.
 * ratio values are relative to the owner: `hpRatio` of the owner's maximum HP,
 * `absorbLimitRatio` of the summon's own maximum HP before it leaves.
 */
export function summonGuard(unit, { id, name = null, hpRatio = null, absorbLimitRatio = 1, rounds = null, onLeave = null } = {}) {
  const state = proprietaryOf(unit);
  const maxHp = hpRatio === null ? 0 : Math.max(1, Math.floor(unit.maxHp * finite(hpRatio)));
  const summon = {
    id: id ?? (unit.id * 1000 + state.summons.length + 1),
    name: name ?? String(id ?? 'summon'),
    ownerId: unit.id,
    ownerTeam: unit.team,
    maxHp,
    hp: maxHp,
    absorbed: 0,
    absorbLimit: Math.max(1, Math.floor(maxHp * finite(absorbLimitRatio, 1))),
    roundsRemaining: rounds === null ? null : Math.max(0, Math.floor(finite(rounds))),
    alive: true,
    onLeave,
  };
  state.summons.push(summon);
  return summon;
}

export function activeSummon(unit) {
  const state = proprietaryOf(unit);
  return state.summons.find(summon => summon.alive) ?? null;
}

export function dismissSummon(unit, summon) {
  if (!summon || !summon.alive) return null;
  summon.alive = false;
  summon.hp = 0;
  const owner = proprietaryOf(unit);
  const index = owner.summons.indexOf(summon);
  if (index >= 0) owner.summons.splice(index, 1);
  return summon.onLeave ? summon.onLeave(unit, summon) : null;
}

export function openDomain(state, { name, ownerId, team, rounds }) {
  const domains = state?.proprietaryDomains ?? (state.proprietaryDomains = []);
  const domain = {
    name: String(name),
    ownerId: ownerId ?? null,
    team: team ?? null,
    roundsRemaining: Math.max(0, Math.floor(finite(rounds))),
  };
  domains.push(domain);
  return domain;
}

export function activeDomains(state, name = null) {
  const domains = state?.proprietaryDomains ?? [];
  return domains.filter(domain => domain.roundsRemaining > 0
    && (name === null || domain.name === String(name)));
}

export function advanceDomains(state) {
  const domains = state?.proprietaryDomains ?? [];
  for (const domain of domains) domain.roundsRemaining = Math.max(0, domain.roundsRemaining - 1);
  state.proprietaryDomains = domains.filter(domain => domain.roundsRemaining > 0);
}

/**
 * Register one hook handler on a unit.
 * limits: { oncePerBattle, oncePerRound, maxPerBattle, maxPerRound }.
 */
export function registerHook(unit, hookName, handler, limits = {}) {
  const state = proprietaryOf(unit);
  const list = state.hooks.get(hookName) ?? [];
  list.push({
    handler,
    oncePerBattle: limits.oncePerBattle === true,
    oncePerRound: limits.oncePerRound === true,
    maxPerBattle: Number.isFinite(Number(limits.maxPerBattle)) ? Number(limits.maxPerBattle) : null,
    maxPerRound: Number.isFinite(Number(limits.maxPerRound)) ? Number(limits.maxPerRound) : null,
    used: 0,
    usedRound: 0,
    roundUsed: 0,
    triggeredThisRound: false,
  });
  state.hooks.set(hookName, list);
  return list[list.length - 1];
}

function hookReady(hook, state) {
  const round = Number(state?.round ?? 0);
  if (hook.roundUsed !== round) {
    hook.roundUsed = round;
    hook.triggeredThisRound = false;
    hook.usedRound = 0;
  }
  if (hook.oncePerBattle && hook.used > 0) return false;
  if (hook.oncePerRound && hook.triggeredThisRound) return false;
  if (hook.maxPerBattle !== null && hook.used >= hook.maxPerBattle) return false;
  if (hook.maxPerRound !== null && hook.usedRound >= hook.maxPerRound) return false;
  return true;
}

function lockHook(hook) {
  hook.used += 1;
  hook.usedRound += 1;
  hook.triggeredThisRound = true;
}

/**
 * Run every unit's handlers for one engine point.
 * Returns the non-null results so the engine can act on queued extra actions.
 */
export function runHooks(state, hookName, payload = {}, events = null, filter = null) {
  const results = [];
  if (!state || (state.proprietaryHookDepth || 0) >= MAX_HOOK_DEPTH) return results;
  state.proprietaryHookDepth = (state.proprietaryHookDepth || 0) + 1;
  try {
    for (const unit of state.allUnits ?? []) {
      if (!unit?.proprietary) continue;
      if (filter && !filter(unit)) continue;
      for (const hook of unit.proprietary.hooks.get(hookName) ?? []) {
        if (!hookReady(hook, state)) continue;
        const result = hook.handler(unit, payload, state);
        lockHook(hook);
        if (result !== undefined && result !== null && result !== false) results.push(result);
        if (Array.isArray(result)) results.push(...result.filter(Boolean));
      }
    }
  } finally {
    state.proprietaryHookDepth--;
  }
  return results;
}

/**
 * Apply one incoming hit: shield first, then 超凡生命, then HP.
 * A unit protected by an active summon does not lose HP to a hit that would be
 * fatal; the summon records the damage instead (【迪迪】 rule).
 */
export function absorbDamage(unit, rawDamage, { events = null, sourceId = null } = {}) {
  const amount = Math.max(0, Math.floor(finite(rawDamage)));
  const state = proprietaryOf(unit);
  const oldShield = nonNegative(unit.shield);
  const absorbed = Math.min(oldShield, amount);
  unit.shield = oldShield - absorbed;
  let remaining = amount - absorbed;

  let superAbsorbed = 0;
  if (remaining > 0 && state.superHp.value > 0) {
    superAbsorbed = Math.min(state.superHp.value, remaining);
    state.superHp.value -= superAbsorbed;
    remaining -= superAbsorbed;
    emit(events, PROPRIETARY_EVENT_KINDS.SUPER_HP, {
      aimId: unit.id, value: state.superHp.value, delta: -superAbsorbed, srcId: sourceId, reason: 'damage'
    });
  }

  let summonAbsorbed = 0;
  const oldHp = nonNegative(unit.hp);
  if (remaining > 0 && remaining >= oldHp) {
    const summon = activeSummon(unit);
    if (summon) {
      summonAbsorbed = remaining;
      summon.absorbed += summonAbsorbed;
      summon.hp = Math.max(0, summon.maxHp - summon.absorbed);
      remaining = 0;
      emit(events, PROPRIETARY_EVENT_KINDS.SUMMON, {
        aimId: unit.id, srcId: sourceId, summonId: summon.id, absorbed: summonAbsorbed,
        total: summon.absorbed, limit: summon.absorbLimit, left: false
      });
      if (summon.absorbed >= summon.absorbLimit) {
        const result = dismissSummon(unit, summon);
        emit(events, PROPRIETARY_EVENT_KINDS.SUMMON, { aimId: unit.id, summonId: summon.id, left: true, result: result ?? null });
      }
    }
  }

  unit.hp = Math.max(0, oldHp - remaining);
  if (unit.hp === 0) unit.alive = false;
  return { damage: amount, absorbed, superAbsorbed, summonAbsorbed, oldHp, newHp: unit.hp };
}

/** Clamp damage to a described ceiling (attack or max-HP based). */
export function capDamage(damage, cap, basis = {}) {
  if (!cap) return damage;
  const value = cap.basis === 'max-hp' ? finite(basis.maxHp) : finite(basis.attack);
  const ratio = finite(cap.ratio);
  if (!(value > 0) || !(ratio > 0)) return damage;
  return Math.min(damage, Math.max(1, Math.floor(value * ratio)));
}

/** Destroy a percentage of the unit's current shield. Returns the amount removed. */
export function destroyShield(unit, ratio, { events = null, sourceId = null } = {}) {
  const current = nonNegative(unit?.shield);
  const fraction = Math.min(1, Math.max(0, finite(ratio)));
  const removed = Math.min(current, Math.floor(current * fraction));
  if (removed > 0) {
    unit.shield = current - removed;
    emit(events, PROPRIETARY_EVENT_KINDS.SHIELD_DESTROYED, {
      aimId: unit.id, srcId: sourceId, ratio: fraction, removed, shield: unit.shield
    });
  }
  return removed;
}

/** Reset per-round hook accounting for one unit. */
export function resetProprietaryRound(unit) {
  const state = unit?.proprietary;
  if (!state) return;
  for (const hooks of state.hooks.values()) {
    for (const hook of hooks) {
      hook.triggeredThisRound = false;
      hook.usedRound = 0;
    }
  }
  for (const summon of state.summons) {
    if (summon.roundsRemaining === null) continue;
    summon.roundsRemaining = Math.max(0, summon.roundsRemaining - 1);
    if (summon.roundsRemaining === 0) summon.alive = false;
  }
  state.summons = state.summons.filter(summon => summon.alive);
}
