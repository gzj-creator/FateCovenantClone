# Skill Effect System Design

## Overview

The skill effect system provides a composable, declarative way to define and execute skill effects in the battle engine. It separates effect definitions from execution logic, allowing skills to be defined as compositions of primitive effects.

## Design Goals

1. **Composability**: Skills are composed of primitive effects that can be combined
2. **Declarative**: Effects describe what happens, not how
3. **Type-safe**: Clear types for all effects and parameters
4. **Extensible**: New effect types can be added without changing core logic
5. **Performant**: Efficient execution with minimal overhead
6. **Testable**: Each effect can be tested independently

## Architecture

```
Skill Definition
    ↓
Effect Composition (tree of effects)
    ↓
Effect Executor (applies effects to battle state)
    ↓
Battle State Update (modifies units, buffs, triggers)
```

## Effect Types

### Damage Effects

```javascript
const DAMAGE_TYPES = {
  PHYSICAL: 'physical',   // Affected by defense, can crit
  MAGICAL: 'magical',    // Affected by magic defense, can crit
  TRUE: 'true',          // Ignores defense, cannot crit
  PERCENT_MAX_HP: 'percent-max-hp', // Percentage of target's max HP
  PERCENT_CURRENT_HP: 'percent-current-hp', // Percentage of target's current HP
};

// Damage effect definition
{
  type: 'damage',
  damageType: 'physical' | 'magical' | 'true' | 'percent-max-hp' | 'percent-current-hp',
  magnitude: number,        // Base damage value or percentage
  multiplier: number,      // Multiplier on actor's attack stat (for physical/magical)
  variance: number,        // Random variance (0.92-1.08 default)
  canCrit: boolean,        // Whether this damage can crit
  critMultiplier: number,  // Crit damage multiplier (1.5 default)
  ignoreDefense: number,   // Percentage of defense to ignore (0-1)
  bonusDamage: number,     // Flat bonus damage
  conditionalDamage: (actor, target, state) => number, // Dynamic bonus calculation
}
```

### Healing Effects

```javascript
const HEAL_TYPES = {
  FLAT: 'flat',                    // Flat amount
  PERCENT_ATTACK: 'percent-attack', // Percentage of actor's attack
  PERCENT_MAX_HP: 'percent-max-hp', // Percentage of target's max HP
  PERCENT_MISSING_HP: 'percent-missing-hp', // Percentage of missing HP
};

// Healing effect definition
{
  type: 'heal',
  healType: 'flat' | 'percent-attack' | 'percent-max-hp' | 'percent-missing-hp',
  magnitude: number,        // Base heal value or percentage
  multiplier: number,      // Multiplier on actor's attack (for percent-attack)
  overheal: boolean,       // Whether overhealing is allowed
  conditionalHeal: (actor, target, state) => number, // Dynamic heal calculation
}
```

### Shield Effects

```javascript
const SHIELD_TYPES = {
  FLAT: 'flat',                    // Flat amount
  PERCENT_DEFENSE: 'percent-defense', // Percentage of actor's defense
  PERCENT_MAX_HP: 'percent-max-hp', // Percentage of target's max HP
  PERCENT_ATTACK: 'percent-attack', // Percentage of actor's attack
};

// Shield effect definition
{
  type: 'shield',
  shieldType: 'flat' | 'percent-defense' | 'percent-max-hp' | 'percent-attack',
  magnitude: number,        // Base shield value or percentage
  multiplier: number,      // Multiplier on relevant stat
  duration: number,        // Duration in rounds (0 = permanent)
  maxStacks: number,       // Maximum stacks (0 = no limit)
  conditionalShield: (actor, target, state) => number, // Dynamic shield calculation
}
```

### Stat Modifier Effects

```javascript
const STAT_TYPES = {
  ATTACK_FLAT: 'attack-flat',
  ATTACK_PERCENT: 'attack-percent',
  DEFENSE_FLAT: 'defense-flat',
  DEFENSE_PERCENT: 'defense-percent',
  SPEED_FLAT: 'speed-flat',
  SPEED_PERCENT: 'speed-percent',
  CRIT_RATE: 'crit-rate',          // Percentage (0-1)
  CRIT_DAMAGE: 'crit-damage',     // Percentage multiplier (1.0 = no bonus)
  IGNORE_DEFENSE: 'ignore-defense', // Percentage (0-1)
  DAMAGE_BONUS: 'damage-bonus',   // Percentage (0-1)
  DAMAGE_REDUCTION: 'damage-reduction', // Percentage (0-1)
  HEAL_BONUS: 'heal-bonus',       // Percentage (0-1)
  SHIELD_BONUS: 'shield-bonus',   // Percentage (0-1)
  ENERGY_BONUS: 'energy-bonus',   // Percentage (0-1)
};

// Stat modifier effect definition
{
  type: 'stat-modifier',
  statType: string,        // One of STAT_TYPES
  magnitude: number,      // Flat value or percentage
  isPercentage: boolean,  // Whether magnitude is a percentage
  duration: number,        // Duration in rounds (0 = permanent)
  maxStacks: number,       // Maximum stacks (0 = no limit)
  stacksAdditive: boolean, // Whether stacks add (+) or multiply (*)
}
```

### Energy Effects

```javascript
const ENERGY_TYPES = {
  GAIN: 'gain',           // Add energy
  LOSS: 'loss',           // Remove energy
  STEAL: 'steal',         // Take from target and give to actor
  SET: 'set',             // Set to specific value
};

// Energy effect definition
{
  type: 'energy',
  energyType: 'gain' | 'loss' | 'steal' | 'set',
  magnitude: number,      // Amount to gain/lose/steal/set
  target: 'self' | 'target' | 'all-allies' | 'all-enemies',
  conditionalEnergy: (actor, target, state) => number, // Dynamic calculation
}
```

### Status Effects (Buffs/Debuffs)

```javascript
const STATUS_TYPES = {
  // Buffs
  PROTECTION: 'protection',           // Immune to damage
  INVULNERABLE: 'invulnerable',       // Immune to all effects
  STRENGTHENED: 'strengthened',       // Increased damage
  HASTED: 'hasted',                  // Increased speed
  ENERGIZED: 'energized',            // Increased energy gain

  // Debuffs
  POISON: 'poison',                  // Damage over time
  BURN: 'burn',                      // Damage over time (fire)
  BLEED: 'bleed',                    // Damage over time (physical)
  FREEZE: 'freeze',                  // Cannot act
  SILENCE: 'silence',                // Cannot use skills
  STUN: 'stun',                      // Cannot act, takes extra damage
  WEAKENED: 'weakened',              // Decreased damage
  SLOWED: 'slowed',                  // Decreased speed
  EXHAUSTED: 'exhausted',            // Decreased energy gain
};

// Status effect definition
{
  type: 'status',
  statusType: string,     // One of STATUS_TYPES
  duration: number,       // Duration in rounds (0 = permanent)
  maxStacks: number,      // Maximum stacks (0 = no limit)
  tickInterval: number,   // Rounds between ticks (for DoT effects)
  tickEffect: effect,     // Effect to apply each tick (for DoT effects)
  dispellable: boolean,   // Can be dispelled
  unique: boolean,        // Only one instance per unit
}
```

### Target Selection

```javascript
const TARGET_TYPES = {
  SELF: 'self',
  SINGLE: 'single',              // Default: front-most enemy
  FRONT_ROW: 'front-row',        // All enemies in front row (loc 1-3)
  BACK_ROW: 'back-row',          // All enemies in back row (loc 4-6)
  ALL_ENEMIES: 'all-enemies',
  ALL_ALLIES: 'all-allies',
  LOWEST_HP: 'lowest-hp',        // Ally or enemy with lowest HP%
  HIGHEST_HP: 'highest-hp',      // Ally or enemy with highest HP%
  LOWEST_HP_ENEMY: 'lowest-hp-enemy',
  HIGHEST_HP_ENEMY: 'highest-hp-enemy',
  LOWEST_HP_ALLY: 'lowest-hp-ally',
  HIGHEST_HP_ALLY: 'highest-hp-ally',
  RANDOM: 'random',              // Random enemy
  RANDOM_ALLY: 'random-ally',    // Random ally
  RANDOM_COUNT: 'random-count',  // N random targets
};

// Target selection definition
{
  targetType: string,        // One of TARGET_TYPES
  count: number,             // Number of targets (for random-count)
  filter: (unit, state) => boolean, // Additional filter function
  priority: (a, b, state) => number, // Sort priority (lower = higher priority)
}
```

## Duration System

### Duration Types

```javascript
const DURATION_TYPES = {
  INSTANT: 'instant',           // Apply once, no duration
  PERMANENT: 'permanent',      // Lasts until end of battle
  TIMED: 'timed',              // Lasts N rounds
  STACKING: 'stacking',        // Can stack up to N layers
  TRIGGER_COUNT: 'trigger-count', // Lasts N triggers
  CONDITIONAL: 'conditional',  // Lasts until condition is met
};
```

### Duration Definition

```javascript
{
  durationType: 'instant' | 'permanent' | 'timed' | 'stacking' | 'trigger-count' | 'conditional',
  rounds: number,              // For TIMED
  maxStacks: number,           // For STACKING
  maxTriggers: number,         // For TRIGGER_COUNT
  condition: (unit, state) => boolean, // For CONDITIONAL
  stacksAdditive: boolean,    // For STACKING: true = add magnitudes, false = multiply
  refreshOnStack: boolean,     // For STACKING: refresh duration on new stack
}
```

## Trigger System

### Trigger Types

```javascript
const TRIGGER_TYPES = {
  // Attack triggers
  ON_ATTACK: 'on-attack',           // When actor attacks
  ON_HIT: 'on-hit',                 // When actor hits a target
  ON_KILL: 'on-kill',              // When actor kills a target
  ON_CRIT: 'on-crit',              // When actor lands a crit

  // Defense triggers
  ON_BEING_HIT: 'on-being-hit',     // When actor is hit
  ON_BEING_CRIT: 'on-being-crit',   // When actor is crit
  ON_HP_THRESHOLD: 'on-hp-threshold', // When HP crosses threshold
  ON_DEATH: 'on-death',             // When actor dies

  // Skill triggers
  ON_SKILL_USE: 'on-skill-use',     // When actor uses a skill
  ON_SKILL_HIT: 'on-skill-hit',     // When actor's skill hits
  ON_ULTIMATE_USE: 'on-ultimate-use', // When actor uses ultimate

  // Round triggers
  ON_ROUND_START: 'on-round-start', // When round starts
  ON_ROUND_END: 'on-round-end',     // When round ends
  ON_TURN_START: 'on-turn-start',   // When actor's turn starts
  ON_TURN_END: 'on-turn-end',       // When actor's turn ends

  // Energy triggers
  ON_ENERGY_FULL: 'on-energy-full', // When energy reaches max
  ON_ENERGY_GAIN: 'on-energy-gain', // When energy is gained

  // Status triggers
  ON_BUFF_GAIN: 'on-buff-gain',     // When gaining a buff
  ON_DEBUFF_GAIN: 'on-debuff-gain', // When gaining a debuff
  ON_STATUS_EXPIRE: 'on-status-expire', // When status expires
};
```

### Trigger Definition

```javascript
{
  triggerType: string,      // One of TRIGGER_TYPES
  condition: (actor, event, state) => boolean, // Additional condition
  cooldown: number,         // Cooldown in rounds
  maxTriggers: number,      // Max triggers per battle (0 = no limit)
  oncePerBattle: boolean,   // Only trigger once per battle
  oncePerRound: boolean,    // Only trigger once per round
  effect: effect,          // Effect to apply when triggered
  priority: number,         // Trigger priority (higher = earlier)
}
```

## Skill Definition Structure

```javascript
{
  id: string,               // Skill ID
  name: string,             // Skill name
  type: 'normal' | 'active' | 'passive' | 'ultimate' | 'mastery',
  energyCost: number,       // Energy cost (0 for normal/passive)

  // Effects to apply
  effects: [
    {
      // Target selection
      target: {
        targetType: string,
        ...targetOptions
      },

      // Effect to apply
      effect: {
        type: string,
        ...effectOptions
      },

      // Duration
      duration: {
        durationType: string,
        ...durationOptions
      },

      // Chance
      chance: number,        // 0-1, probability of applying

      // Condition
      condition: (actor, target, state) => boolean,
    }
  ],

  // Passive triggers (for passive skills)
  triggers: [
    {
      triggerType: string,
      ...triggerOptions
    }
  ],

  // Conditional logic
  conditions: {
    actor: (actor, state) => boolean,
    target: (target, state) => boolean,
    battle: (state) => boolean,
  },

  // Metadata
  description: string,
  source: 'catalog' | 'methodtable' | 'custom',
}
```

## Effect Executor

The effect executor applies effects to battle state:

```javascript
class EffectExecutor {
  executeEffect(effect, actor, target, state) {
    switch (effect.type) {
      case 'damage':
        return this.executeDamage(effect, actor, target, state);
      case 'heal':
        return this.executeHeal(effect, actor, target, state);
      case 'shield':
        return this.executeShield(effect, actor, target, state);
      case 'stat-modifier':
        return this.executeStatModifier(effect, actor, target, state);
      case 'energy':
        return this.executeEnergy(effect, actor, target, state);
      case 'status':
        return this.executeStatus(effect, actor, target, state);
      default:
        throw new Error(`Unknown effect type: ${effect.type}`);
    }
  }

  executeDamage(effect, actor, target, state) {
    // Calculate base damage
    let baseDamage = effect.magnitude;
    if (effect.multiplier) {
      baseDamage = actor.attack * effect.multiplier;
    }

    // Apply conditional bonus
    if (effect.conditionalDamage) {
      baseDamage += effect.conditionalDamage(actor, target, state);
    }

    // Apply variance
    const variance = effect.variance || 0.92 + state.random() * 0.16;
    baseDamage *= variance;

    // Check crit
    const canCrit = effect.canCrit !== false;
    const critChance = actor.critChance + (actor.buffs.critRate || 0);
    const isCrit = canCrit && state.random() < critChance;
    const critMultiplier = isCrit ? (effect.critMultiplier || 1.5) : 1.0;

    // Calculate defense reduction
    let defense = target.defense;
    if (effect.ignoreDefense) {
      defense *= (1 - effect.ignoreDefense);
    }

    // Final damage
    const finalDamage = Math.max(1, Math.floor((baseDamage - defense * 0.45) * critMultiplier));

    // Apply to target
    const oldHp = target.hp;
    const absorbed = Math.min(target.shield, finalDamage);
    target.shield -= absorbed;
    target.hp = Math.max(0, target.hp - (finalDamage - absorbed));

    // Return event
    return {
      type: 'damage',
      actor: actor.id,
      target: target.id,
      value: finalDamage,
      absorbed,
      crit: isCrit,
      oldHp,
      newHp: target.hp,
    };
  }

  // Similar methods for other effect types...
}
```

## Integration with Battle Engine

### Current Battle Engine Integration Points

1. **Unit normalization** (`normalizeUnit`)
   - Add `buffs` and `debuffs` arrays to unit state
   - Add `triggers` array for passive triggers
   - Add `cooldowns` map for skill cooldowns

2. **Turn execution** (`executeTurn`)
   - Check and apply passive triggers before action
   - Apply skill effects when using active skill
   - Check and apply passive triggers after action
   - Process buff/debuff ticks at round end

3. **Battle simulation** (`simulateBattle`)
   - Register passive triggers at battle start
   - Process trigger events throughout battle
   - Clean up expired buffs/debuffs at battle end

### Proposed Changes

```javascript
// In battle-engine.mjs

function normalizeUnit(unit) {
  // ... existing code ...

  return {
    // ... existing fields ...
    buffs: [],           // Active buffs
    debuffs: [],         // Active debuffs
    triggers: [],        // Passive triggers
    cooldowns: new Map(), // Skill cooldowns
    damageTaken: 0,     // Damage taken this round
    damageDealt: 0,     // Damage dealt this round
    healsReceived: 0,    // Healing received this round
    kills: 0,            // Kills this battle
  };
}

function executeTurn(events, actor, allUnits, state) {
  // Process pre-action triggers
  processTriggers(actor, 'on-turn-start', allUnits, state, events);

  // Check if using skill
  const useSkill = actor.energy >= FIGHT_ENERGY_MAX;
  if (useSkill) {
    const skill = getSkill(actor.activeAbilityId);
    if (skill) {
      // Apply skill effects
      applySkillEffects(skill, actor, allUnits, state, events);
    }
  } else {
    // Apply normal attack effects
    const skill = getSkill(actor.abilityId);
    if (skill) {
      applySkillEffects(skill, actor, allUnits, state, events);
    }
  }

  // Process post-action triggers
  processTriggers(actor, 'on-turn-end', allUnits, state, events);
}

function applySkillEffects(skill, actor, allUnits, state, events) {
  const executor = new EffectExecutor(state);

  for (const effectDef of skill.effects) {
    const targets = selectTargets(effectDef.target, actor, allUnits, state);

    for (const target of targets) {
      // Check condition
      if (effectDef.condition && !effectDef.condition(actor, target, state)) {
        continue;
      }

      // Check chance
      if (effectDef.chance && state.random() > effectDef.chance) {
        continue;
      }

      // Execute effect
      const result = executor.executeEffect(effectDef.effect, actor, target, state);

      // Apply duration
      if (effectDef.duration) {
        applyDuration(effectDef.duration, effectDef.effect, target);
      }

      // Record event
      events.push(result);
    }
  }
}
```

## Data Storage

### Buff/Debuff Structure

```javascript
{
  id: string,               // Unique ID for this instance
  type: string,             // Status type
  source: string,           // Source unit ID
  sourceSkill: string,      // Source skill ID
  stacks: number,           // Current stacks
  maxStacks: number,        // Maximum stacks
  duration: number,         // Remaining rounds
  tickInterval: number,     // Rounds between ticks
  nextTick: number,         // Round when next tick occurs
  dispellable: boolean,     // Can be dispelled
  unique: boolean,          // Only one instance per unit
  data: object,             // Custom data for the status
}
```

### Trigger Structure

```javascript
{
  id: string,               // Unique ID
  triggerType: string,      // Trigger type
  sourceSkill: string,      // Source skill ID
  condition: function,      // Trigger condition
  cooldown: number,         // Remaining cooldown rounds
  maxTriggers: number,      // Max triggers remaining
  lastTriggerRound: number, // Round when last triggered
  effect: object,           // Effect to apply
  priority: number,         // Trigger priority
}
```

## Implementation Phases

### Phase 1: Core Effect Types (Week 1)
- Implement damage, heal, shield effects
- Implement effect executor
- Integrate with current battle engine
- Unit tests for core effects

### Phase 2: Stat Modifiers & Energy (Week 1-2)
- Implement stat modifier effects
- Implement energy effects
- Add buff/debuff application/removal
- Unit tests

### Phase 3: Status Effects (Week 2)
- Implement status effect system
- Implement DoT (damage over time)
- Implement status dispel
- Unit tests

### Phase 4: Trigger System (Week 2-3)
- Implement trigger registration
- Implement trigger processing
- Implement trigger conditions
- Unit tests

### Phase 5: Duration System (Week 3)
- Implement duration tracking
- Implement stacking logic
- Implement expiration
- Unit tests

### Phase 6: Skill Composition (Week 3-4)
- Implement skill definition parsing
- Implement effect composition
- Implement conditional logic
- Integration tests

### Phase 7: Hero Implementation (Week 4+)
- Implement Tier 1 heroes using new system
- Verify against catalog
- Performance testing
- Iterate based on feedback

## Testing Strategy

### Unit Tests
- Each effect type tested independently
- Test edge cases (zero values, negative values, overflow)
- Test duration mechanics
- Test trigger conditions

### Integration Tests
- Test full skill execution
- Test skill interactions
- Test buff/debuff stacking
- Test trigger chains

### Validation Tests
- Compare skill outputs with catalog descriptions
- Verify damage/healing numbers match expected ranges
- Verify trigger conditions fire correctly
- Verify durations expire correctly

## Performance Considerations

1. **Effect pooling**: Reuse effect objects to reduce GC
2. **Trigger batching**: Process triggers in batches to reduce overhead
3. **Condition caching**: Cache condition results when possible
4. **Lazy evaluation**: Only calculate values when needed
5. **Early exit**: Skip effects when target is dead/invulnerable

## Migration Strategy

1. **Parallel implementation**: Keep old system alongside new system
2. **Gradual migration**: Migrate heroes one at a time
3. **Fallback**: Use old system as fallback for unmigrated heroes
4. **Validation**: Compare outputs between old and new systems
5. **Cutover**: Once all heroes migrated, remove old system

## Open Questions

1. **Effect ordering**: When multiple effects apply to same target, what order?
   - Proposal: By effect priority, then by skill priority, then by speed

2. **Trigger timing**: When do triggers fire relative to effects?
   - Proposal: Triggers fire in defined phases (pre-action, post-action, round-start, round-end)

3. **Stacking behavior**: How do buffs with same type stack?
   - Proposal: Additive for same source, multiplicative for different sources

4. **Status immunity**: How to handle status immunity?
   - Proposal: Immunity prevents application, but doesn't dispel existing

5. **Conditional evaluation**: When are conditions evaluated?
   - Proposal: At trigger time, not at registration time
