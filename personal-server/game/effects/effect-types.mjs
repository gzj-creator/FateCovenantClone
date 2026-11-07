/**
 * Core effect type definitions for the skill effect system
 */

// Damage types
export const DAMAGE_TYPES = Object.freeze({
  PHYSICAL: 'physical',          // Affected by defense, can crit
  MAGICAL: 'magical',           // Affected by magic defense, can crit
  TRUE: 'true',                 // Ignores defense, cannot crit
  PERCENT_MAX_HP: 'percent-max-hp', // Percentage of target's max HP
  PERCENT_CURRENT_HP: 'percent-current-hp', // Percentage of target's current HP
});

// Heal types
export const HEAL_TYPES = Object.freeze({
  FLAT: 'flat',                   // Flat amount
  PERCENT_ATTACK: 'percent-attack', // Percentage of actor's attack
  PERCENT_MAX_HP: 'percent-max-hp', // Percentage of target's max HP
  PERCENT_MISSING_HP: 'percent-missing-hp', // Percentage of missing HP
  PERCENT_DAMAGE_DEALT: 'percent-damage-dealt', // Actual HP damage in the current action
});

// Shield types
export const SHIELD_TYPES = Object.freeze({
  FLAT: 'flat',                   // Flat amount
  PERCENT_DEFENSE: 'percent-defense', // Percentage of actor's defense
  PERCENT_MAX_HP: 'percent-max-hp', // Percentage of target's max HP
  PERCENT_ATTACK: 'percent-attack', // Percentage of actor's attack
  PERCENT_DAMAGE_DEALT: 'percent-damage-dealt', // Actual HP damage in the current action
});

// Stat modifier types
export const STAT_TYPES = Object.freeze({
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
  CRIT_DAMAGE_REDUCTION: 'crit-damage-reduction',
  CRIT_RESIST: 'crit-resist',
  CRIT_RESISTANCE: 'crit-resistance',
  ANTI_CRIT: 'anti-crit',
  HIT_RATE: 'hit-rate',
  EVASION: 'evasion',
  STATUS_HIT: 'status-hit',
  STATUS_RESIST: 'status-resist',
  REBOUND_RATE: 'rebound-rate',
  MAX_HP_PERCENT: 'max-hp-percent',
  HEAL_BONUS: 'heal-bonus',       // Percentage (0-1)
  SHIELD_BONUS: 'shield-bonus',   // Percentage (0-1)
  ENERGY_BONUS: 'energy-bonus',   // Percentage (0-1)
});

// Energy types
export const ENERGY_TYPES = Object.freeze({
  GAIN: 'gain',          // Add energy
  LOSS: 'loss',          // Remove energy
  STEAL: 'steal',        // Take from target and give to actor
  SET: 'set',            // Set to specific value
});

// Status effect types (buffs/debuffs)
export const STATUS_TYPES = Object.freeze({
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
  FRIGHTENED: 'frightened',          // 惊惧: terror debuff (银爵艾伦)
  CHAIN: 'chain',                    // 锁链 (chain layers)
  PURSUIT: 'pursuit',                // 追击
});

// Target selection types
export const TARGET_TYPES = Object.freeze({
  SELF: 'self',
  SINGLE: 'single',              // Default: front-most enemy
  FRONT_ROW: 'front-row',        // All enemies in front row (loc 1-3)
  FRONT_ROW_ALLIES: 'front-row-allies', // All allies in front row (loc 1-3)
  FRONT_ROW_HIGHEST_ATTACK: 'front-row-highest-attack', // Enemy in front row with highest attack
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
});

// Duration types
export const DURATION_TYPES = Object.freeze({
  INSTANT: 'instant',           // Apply once, no duration
  PERMANENT: 'permanent',      // Lasts until end of battle
  TIMED: 'timed',              // Lasts N rounds
  STACKING: 'stacking',        // Can stack up to N layers
  TRIGGER_COUNT: 'trigger-count', // Lasts N triggers
  CONDITIONAL: 'conditional',  // Lasts until condition is met
});

// Trigger types
export const TRIGGER_TYPES = Object.freeze({
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
});
