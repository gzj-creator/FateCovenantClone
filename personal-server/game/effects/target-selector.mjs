/**
 * Target selection utility
 */

import { TARGET_TYPES } from './effect-types.mjs';

export class TargetSelector {
  /**
   * Select targets based on target type
   * @param {Object} targetDef - Target definition
   * @param {Object} actor - The actor unit
   * @param {Array} allUnits - All units in battle
   * @param {Object} state - Battle state
   * @returns {Array} Selected target units
   */
  selectTargets(targetDef, actor, allUnits, state) {
    const targetType = targetDef.targetType || TARGET_TYPES.SINGLE;
    const actorTeam = actor.team;

    switch (targetType) {
      case TARGET_TYPES.SELF:
        return [actor];

      case TARGET_TYPES.SINGLE:
        return this.selectSingleTarget(actor, allUnits, targetDef);

      case TARGET_TYPES.FRONT_ROW:
        return this.selectFrontRow(actor, allUnits);

      case TARGET_TYPES.FRONT_ROW_ALLIES:
        return this.selectFrontRowAllies(actor, allUnits);

      case TARGET_TYPES.BACK_ROW:
        return this.selectBackRow(actor, allUnits);

      case TARGET_TYPES.ALL_ENEMIES:
        return this.selectAllEnemies(actor, allUnits);

      case TARGET_TYPES.ALL_ALLIES:
        return this.selectAllAllies(actor, allUnits);

      case TARGET_TYPES.LOWEST_HP:
        return this.selectLowestHP(actor, allUnits, false);

      case TARGET_TYPES.HIGHEST_HP:
        return this.selectHighestHP(actor, allUnits, false);

      case TARGET_TYPES.LOWEST_HP_ENEMY:
        return this.selectLowestHP(actor, allUnits, true);

      case TARGET_TYPES.HIGHEST_HP_ENEMY:
        return this.selectHighestHP(actor, allUnits, true);

      case TARGET_TYPES.LOWEST_HP_ALLY:
        return this.selectLowestHPAlly(actor, allUnits);

      case TARGET_TYPES.HIGHEST_HP_ALLY:
        return this.selectHighestHPAlly(actor, allUnits);

      case TARGET_TYPES.RANDOM:
        return this.selectRandomEnemy(actor, allUnits);

      case TARGET_TYPES.RANDOM_ALLY:
        return this.selectRandomAlly(actor, allUnits);

      case TARGET_TYPES.RANDOM_COUNT:
        return this.selectRandomCount(actor, allUnits, targetDef.count || 1);

      default:
        console.warn(`Unknown target type: ${targetType}, defaulting to single`);
        return this.selectSingleTarget(actor, allUnits, targetDef);
    }
  }

  /**
   * Select single target (front-most enemy by default)
   */
  selectSingleTarget(actor, allUnits, targetDef) {
    const enemies = this.getEnemies(actor, allUnits);
    if (!enemies.length) return [];

    // Apply filter if provided
    let candidates = enemies;
    if (targetDef.filter) {
      candidates = enemies.filter(u => targetDef.filter(u, allUnits, this.state));
    }

    if (!candidates.length) return [];

    // Sort by priority if provided
    if (targetDef.priority) {
      candidates.sort((a, b) => targetDef.priority(a, b, this.state) - targetDef.priority(b, a, this.state));
    } else {
      // Default: sort by location (front-most first)
      candidates.sort((a, b) => a.loc - b.loc);
    }

    return [candidates[0]];
  }

  /**
   * Select all enemies in front row (loc 1-3)
   */
  selectFrontRow(actor, allUnits) {
    const enemies = this.getEnemies(actor, allUnits);
    return enemies.filter(u => u.loc >= 1 && u.loc <= 3 && u.alive).sort((a, b) => a.loc - b.loc);
  }

  /**
   * Select all allies in front row (loc 1-3)
   */
  selectFrontRowAllies(actor, allUnits) {
    const allies = this.getAllies(actor, allUnits);
    return allies.filter(u => u.loc >= 1 && u.loc <= 3 && u.alive).sort((a, b) => a.loc - b.loc);
  }

  /**
   * Select all enemies in back row (loc 4-6)
   */
  selectBackRow(actor, allUnits) {
    const enemies = this.getEnemies(actor, allUnits);
    return enemies.filter(u => u.loc >= 4 && u.loc <= 6 && u.alive).sort((a, b) => a.loc - b.loc);
  }

  /**
   * Select all enemies
   */
  selectAllEnemies(actor, allUnits) {
    return this.getEnemies(actor, allUnits).filter(u => u.alive).sort((a, b) => a.loc - b.loc);
  }

  /**
   * Select all allies
   */
  selectAllAllies(actor, allUnits) {
    return this.getAllies(actor, allUnits).filter(u => u.alive).sort((a, b) => a.loc - b.loc);
  }

  /**
   * Select unit with lowest HP%
   */
  selectLowestHP(actor, allUnits, enemiesOnly = false) {
    const units = enemiesOnly ? this.getEnemies(actor, allUnits) : allUnits.filter(u => u.alive);
    if (!units.length) return [];

    const sorted = [...units].sort((a, b) => {
      const aRatio = a.hp / a.maxHp;
      const bRatio = b.hp / b.maxHp;
      return aRatio - bRatio || a.loc - b.loc;
    });

    return [sorted[0]];
  }

  /**
   * Select unit with highest HP%
   */
  selectHighestHP(actor, allUnits, enemiesOnly = false) {
    const units = enemiesOnly ? this.getEnemies(actor, allUnits) : allUnits.filter(u => u.alive);
    if (!units.length) return [];

    const sorted = [...units].sort((a, b) => {
      const aRatio = a.hp / a.maxHp;
      const bRatio = b.hp / b.maxHp;
      return bRatio - aRatio || a.loc - b.loc;
    });

    return [sorted[0]];
  }

  /**
   * Select ally with lowest HP%
   */
  selectLowestHPAlly(actor, allUnits) {
    const allies = this.getAllies(actor, allUnits).filter(u => u.alive);
    if (!allies.length) return [];

    const sorted = [...allies].sort((a, b) => {
      const aRatio = a.hp / a.maxHp;
      const bRatio = b.hp / b.maxHp;
      return aRatio - bRatio || a.loc - b.loc;
    });

    return [sorted[0]];
  }

  /**
   * Select ally with highest HP%
   */
  selectHighestHPAlly(actor, allUnits) {
    const allies = this.getAllies(actor, allUnits).filter(u => u.alive);
    if (!allies.length) return [];

    const sorted = [...allies].sort((a, b) => {
      const aRatio = a.hp / a.maxHp;
      const bRatio = b.hp / b.maxHp;
      return bRatio - aRatio || a.loc - b.loc;
    });

    return [sorted[0]];
  }

  /**
   * Select random enemy
   */
  selectRandomEnemy(actor, allUnits) {
    const enemies = this.getEnemies(actor, allUnits).filter(u => u.alive);
    if (!enemies.length) return [];

    const index = Math.floor(Math.random() * enemies.length);
    return [enemies[index]];
  }

  /**
   * Select random ally
   */
  selectRandomAlly(actor, allUnits) {
    const allies = this.getAllies(actor, allUnits).filter(u => u.alive);
    if (!allies.length) return [];

    const index = Math.floor(Math.random() * allies.length);
    return [allies[index]];
  }

  /**
   * Select N random targets
   */
  selectRandomCount(actor, allUnits, count) {
    const enemies = this.getEnemies(actor, allUnits).filter(u => u.alive);
    if (!enemies.length) return [];

    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, enemies.length));
  }

  /**
   * Get all enemy units
   */
  getEnemies(actor, allUnits) {
    return allUnits.filter(u => u.team !== actor.team && u.alive);
  }

  /**
   * Get all ally units
   */
  getAllies(actor, allUnits) {
    return allUnits.filter(u => u.team === actor.team && u.alive);
  }
}
