import { GameError } from './hero-progression.mjs';

function roleTables(tables) {
  if (!tables?.RoleLevel?.get) throw new GameError(5, 'Role level table is unavailable');
  return tables;
}

function maxRoleLevel(tables) {
  const configured = Number(tables?.RoleLevelSetting?.get?.(1)?.max_level ?? 0);
  if (configured > 0) return configured;
  return Math.max(...tables.RoleLevel.keys());
}

export function roleLevelCap(tables) {
  return maxRoleLevel(roleTables(tables));
}

/**
 * The single role-experience entry point. `role.exp` always means experience
 * inside the current level. A single award may cross several levels.
 */
export function addRoleExp(role, amount, { tables, source = 'unknown', onLevelUp = null } = {}) {
  const config = roleTables(tables);
  const level = Number(role?.level ?? 1);
  const exp = Number(role?.exp ?? 0);
  const gain = Number(amount);
  if (!Number.isSafeInteger(level) || level < 1) throw new GameError(5, 'Role level is invalid');
  if (!Number.isSafeInteger(exp) || exp < 0) throw new GameError(5, 'Role experience is invalid');
  if (!Number.isSafeInteger(gain) || gain < 0) throw new GameError(1, 'Role experience amount is invalid');

  const maxLevel = maxRoleLevel(config);
  if (level > maxLevel) throw new GameError(5, 'Role level exceeds the configured maximum');
  let nextLevel = level;
  let nextExp = exp + gain;
  if (!Number.isSafeInteger(nextExp)) throw new GameError(1, 'Role experience limit reached');
  const gainedLevels = [];

  while (nextLevel < maxLevel) {
    const reachExp = Number(config.RoleLevel.get(nextLevel)?.reach_exp);
    if (!Number.isSafeInteger(reachExp) || reachExp <= 0) {
      throw new GameError(5, `Role level ${nextLevel} experience configuration is missing`);
    }
    if (nextExp < reachExp) break;
    nextExp -= reachExp;
    nextLevel += 1;
    gainedLevels.push(nextLevel);
  }

  if (nextLevel === maxLevel) {
    const cap = Number(config.RoleLevel.get(maxLevel)?.reach_exp);
    if (Number.isSafeInteger(cap) && cap >= 0) nextExp = Math.min(nextExp, cap);
  }

  role.level = nextLevel;
  role.exp = nextExp;
  const result = { level: nextLevel, exp: nextExp, amount: gain, source, gainedLevels };
  if (gainedLevels.length && typeof onLevelUp === 'function') {
    onLevelUp({ from: level, to: nextLevel, levels: [...gainedLevels], source, role });
  }
  return result;
}

