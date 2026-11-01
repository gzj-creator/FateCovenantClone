/**
 * Unit tests for target selector
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TargetSelector } from '../../game/effects/target-selector.mjs';
import { TARGET_TYPES } from '../../game/effects/effect-types.mjs';

describe('TargetSelector', () => {
  describe('selectTargets', () => {
    it('should select self', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const allUnits = [actor];
      const targetDef = { targetType: TARGET_TYPES.SELF };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 1);
      assert.strictEqual(targets[0].id, 1);
    });

    it('should select single enemy', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 2, alive: true };
      const allUnits = [actor, enemy1, enemy2];
      const targetDef = { targetType: TARGET_TYPES.SINGLE };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 1);
      assert.strictEqual(targets[0].id, 2); // Front-most enemy
    });

    it('should select front row enemies', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 2, alive: true };
      const enemy3 = { id: 4, team: 2, loc: 3, alive: true };
      const enemy4 = { id: 5, team: 2, loc: 4, alive: true };
      const allUnits = [actor, enemy1, enemy2, enemy3, enemy4];
      const targetDef = { targetType: TARGET_TYPES.FRONT_ROW };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 3);
      assert.strictEqual(targets[0].id, 2);
      assert.strictEqual(targets[1].id, 3);
      assert.strictEqual(targets[2].id, 4);
    });

    it('should select back row enemies', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 4, alive: true };
      const enemy3 = { id: 4, team: 2, loc: 5, alive: true };
      const allUnits = [actor, enemy1, enemy2, enemy3];
      const targetDef = { targetType: TARGET_TYPES.BACK_ROW };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 2);
      assert.strictEqual(targets[0].id, 3);
      assert.strictEqual(targets[1].id, 4);
    });

    it('should select all enemies', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 2, alive: true };
      const ally1 = { id: 4, team: 1, loc: 2, alive: true };
      const allUnits = [actor, enemy1, enemy2, ally1];
      const targetDef = { targetType: TARGET_TYPES.ALL_ENEMIES };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 2);
      assert.strictEqual(targets[0].id, 2);
      assert.strictEqual(targets[1].id, 3);
    });

    it('should select all allies', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const ally1 = { id: 2, team: 1, loc: 2, alive: true };
      const ally2 = { id: 3, team: 1, loc: 3, alive: true };
      const enemy1 = { id: 4, team: 2, loc: 1, alive: true };
      const allUnits = [actor, ally1, ally2, enemy1];
      const targetDef = { targetType: TARGET_TYPES.ALL_ALLIES };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 3);
      assert.strictEqual(targets[0].id, 1);
      assert.strictEqual(targets[1].id, 2);
      assert.strictEqual(targets[2].id, 3);
    });

    it('should select enemy with lowest HP%', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, hp: 80, maxHp: 100, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 2, hp: 30, maxHp: 100, alive: true };
      const enemy3 = { id: 4, team: 2, loc: 3, hp: 50, maxHp: 100, alive: true };
      const allUnits = [actor, enemy1, enemy2, enemy3];
      const targetDef = { targetType: TARGET_TYPES.LOWEST_HP_ENEMY };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 1);
      assert.strictEqual(targets[0].id, 3); // 30% HP
    });

    it('should select enemy with highest HP%', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, hp: 80, maxHp: 100, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 2, hp: 30, maxHp: 100, alive: true };
      const enemy3 = { id: 4, team: 2, loc: 3, hp: 50, maxHp: 100, alive: true };
      const allUnits = [actor, enemy1, enemy2, enemy3];
      const targetDef = { targetType: TARGET_TYPES.HIGHEST_HP_ENEMY };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 1);
      assert.strictEqual(targets[0].id, 2); // 80% HP
    });

    it('should select ally with lowest HP%', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, hp: 100, maxHp: 100, alive: true };
      const ally1 = { id: 2, team: 1, loc: 2, hp: 80, maxHp: 100, alive: true };
      const ally2 = { id: 3, team: 1, loc: 3, hp: 30, maxHp: 100, alive: true };
      const allUnits = [actor, ally1, ally2];
      const targetDef = { targetType: TARGET_TYPES.LOWEST_HP_ALLY };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 1);
      assert.strictEqual(targets[0].id, 3); // 30% HP
    });

    it('should skip dead units', () => {
      const selector = new TargetSelector();
      const actor = { id: 1, team: 1, loc: 1, alive: true };
      const enemy1 = { id: 2, team: 2, loc: 1, alive: true };
      const enemy2 = { id: 3, team: 2, loc: 2, alive: false };
      const allUnits = [actor, enemy1, enemy2];
      const targetDef = { targetType: TARGET_TYPES.ALL_ENEMIES };

      const targets = selector.selectTargets(targetDef, actor, allUnits);

      assert.strictEqual(targets.length, 1);
      assert.strictEqual(targets[0].id, 2);
    });
  });
});
