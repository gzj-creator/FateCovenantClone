/**
 * CORE-BATTLE-B: description-backed proprietary mechanisms.
 *
 * Every entry in PROPRIETARY_SKILL_RULES is only active when the catalog skill
 * still contains the quoted description fragments. A regenerated catalog that
 * changes a description therefore disables the rule instead of silently
 * applying a stale number. Entries are keyed by catalog skill id because the
 * shipped descriptions are per skill, not per hero.
 *
 * The numbers in `config` are transcribed from the same description (they are
 * quoted in `evidence`). Nothing is inferred: where a description omits a
 * value, the mechanism is not implemented and the gap is recorded in
 * implementation.md.
 */

import {
  PROPRIETARY_HOOKS,
  addLayer,
  addSuperHp,
  destroyShield,
  drainTianji,
  gainTianji,
  layerValue,
  openDomain,
  registerHook,
  setLayer,
  summonGuard,
  tianjiValue,
} from './proprietary-state.mjs';

const ENEMY_TARGET = { targetType: 'all-enemies' };

/**
 * Rule table. `requires` is the evidence gate: every literal fragment and every
 * regular expression must still match the shipped description for the rule to
 * run. `config` holds exactly the numbers quoted in `evidence`.
 */
export let PROPRIETARY_SKILL_RULES = [
  // 超凡生命: a second life pool equal to 100% of the HP maximum.
  {
    skillId: '354040171', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命将提升至生命上限的100%',
    config: { ratio: 1 }
  },
  {
    skillId: '354060171', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命将提升至生命上限的100%',
    config: { ratio: 1 }
  },
  {
    skillId: '354070171', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命提升至生命上限的100%',
    config: { ratio: 1 }
  },
  {
    skillId: '2504010123', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命将提升至生命上限的100%',
    config: { ratio: 1 }
  },
  {
    skillId: '2504030123', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命将提升至生命上限的100%',
    config: { ratio: 1 }
  },
  {
    skillId: '2504050123', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命将提升至生命上限的100%',
    config: { ratio: 1 }
  },
  {
    skillId: '2504070123', kind: 'super-hp',
    requires: ['超凡生命', /超凡生命(?:将)?提升至生命上限的100%/],
    evidence: '自身超凡生命将提升至生命上限的100%',
    config: { ratio: 1 }
  },

  // 召唤/替死: 【迪迪】 inherits 100% of the owner's HP, takes every fatal hit
  // for the owner, leaves after absorbing 100% of its own HP, stays 3 rounds.
  {
    skillId: '354060171', kind: 'summon-guard',
    requires: ['召唤【迪迪】', '致命伤害', '累计承受超过自身生命上限100%时退场', '迪迪持续3回合'],
    evidence: '召唤【迪迪】协同作战：小迪无法被选中，继承奈奈子全额攻击力和生命，奈奈子受到的所有致命伤害将优先由迪迪承担，迪迪累计承受超过自身生命上限100%时退场…迪迪持续3回合',
    config: { hpRatio: 1, absorbLimitRatio: 1, rounds: 3 }
  },
  // 再次召唤 + 每次退场 +30% 攻击 (same hero's 真我超越).
  {
    skillId: '354060175', kind: 'summon-resummon',
    requires: ['【迪迪】退出战场后', '重新召唤', '1场战斗仅可重新召唤1次', '额外获得30%的攻击力提升'],
    evidence: '【迪迪】退出战场后，将立即重新召唤进入战场协同作战，1场战斗仅可重新召唤1次；【迪迪】每次退场后，奈奈子额外获得30%的攻击力提升',
    config: { resummonTimes: 1, attackBonusPerLeave: 0.3 }
  },

  // 护盾按比例摧毁, inside the skill's own effect order.
  {
    skillId: '2404030123', kind: 'shield-destroy',
    requires: ['摧毁敌方全体50%当前护盾'],
    evidence: '摧毁敌方全体50%当前护盾，并造成130%物理伤害',
    config: { mode: 'skill', scope: 'all-enemies', ratio: 0.5 }
  },
  {
    skillId: '2404040123', kind: 'shield-destroy',
    requires: ['摧毁敌方全体50%当前护盾'],
    evidence: '摧毁敌方全体50%当前护盾，并造成130%物理伤害',
    config: { mode: 'skill', scope: 'all-enemies', ratio: 0.5 }
  },
  {
    skillId: '2504040123', kind: 'shield-destroy',
    requires: ['削减敌方全体35%的护盾'],
    evidence: '削减敌方全体35%的护盾，对敌方全体造成零生命上限20%的魔法伤害',
    config: { mode: 'skill', scope: 'all-enemies', ratio: 0.35 }
  },
  // 护盾按比例摧毁, before the unit's own ultimate.
  {
    skillId: '354010174', kind: 'shield-destroy',
    requires: ['自身释放终结技前，额外摧毁敌方全体15%的护盾，每回合限触发4次'],
    evidence: '自身释放终结技前，额外摧毁敌方全体15%的护盾，每回合限触发4次',
    config: { mode: 'hook', on: 'ultimate', scope: 'all-enemies', ratio: 0.15, maxPerRound: 4 }
  },
  {
    skillId: '354030174', kind: 'shield-destroy',
    requires: ['自身释放终结技前，额外摧毁目标20%的护盾，每回合限触发4次'],
    evidence: '自身释放终结技前，额外摧毁目标20%的护盾，每回合限触发4次',
    config: { mode: 'hook', on: 'ultimate', scope: 'target', ratio: 0.2, maxPerRound: 4 }
  },
  {
    skillId: '334020172', kind: 'shield-destroy',
    requires: ['每次释放普攻/绝招/终结技/天极技前会摧毁敌方全体目标10%护盾并均摊给我方全体'],
    evidence: '阿涅斯每次释放普攻/绝招/终结技/天极技前会摧毁敌方全体目标10%护盾并均摊给我方全体',
    config: { mode: 'hook', on: 'any', scope: 'all-enemies', ratio: 0.1, distributeToAllies: true }
  },

  // 伤害上限: per-target ceilings written in the description.
  {
    skillId: '2504030123', kind: 'damage-cap',
    requires: ['不超过自身攻击力的100%'],
    evidence: '对【致盲】单位额外造成15%最大生命值的真实伤害（不超过自身攻击力的100%）',
    config: { basis: 'attack', ratio: 1, match: { damageType: 'percent-max-hp', magnitude: 0.15 } }
  },
  {
    skillId: '324020171', kind: 'damage-cap',
    requires: ['不超过自身攻击力80%'],
    evidence: '【给了糖也捣蛋】每颗额外造成目标4%最大生命值的法术伤害（不超过自身攻击力80%）',
    config: { basis: 'attack', ratio: 0.8, match: { damageType: 'percent-max-hp', magnitude: 0.04 } }
  }
];

export function setProprietarySkillRules(rules) {
  PROPRIETARY_SKILL_RULES = rules;
}

export function skillDescription(skill) {
  return String(skill?.description ?? '');
}

export function matchesDescription(skill, fragments) {
  if (!Array.isArray(fragments) || !fragments.length) return true;
  const text = skillDescription(skill);
  return fragments.every(fragment => (fragment instanceof RegExp ? fragment.test(text) : text.includes(fragment)));
}

/**
 * FightTable.Ability rows for 天极技 carry type 2 with run_type 5; every
 * ordinary ultimate/active row in the same catalog uses run_type 1. The ten
 * rows whose description starts with "消耗3点天极值" are exactly this set, so
 * run_type 5 is the configuration evidence for the action kind.
 */
export function isDeitySkill(skill) {
  const ability = skill?.implementation?.ability;
  return Boolean(ability) && Number(ability.type) === 2 && Number(ability.run_type) === 5;
}

/** Described 天极值 price of a 天极技, or null when the row does not state one. */
export function tianjiCostFor(skill) {
  const match = skillDescription(skill).match(/消耗\s*(\d+)\s*点天极值/);
  if (!match) return null;
  const cost = Number(match[1]);
  return Number.isSafeInteger(cost) && cost > 0 ? cost : null;
}

export function proprietaryRulesFor(skills = []) {
  const active = [];
  for (const skill of skills) {
    const id = String(skill?.id);
    for (const rule of PROPRIETARY_SKILL_RULES) {
      if (String(rule.skillId) !== id) continue;
      if (!matchesDescription(skill, rule.requires)) continue;
      active.push({ rule, skill });
    }
  }
  return active;
}

function livingEnemiesOf(unit, state) {
  return (state?.allUnits ?? []).filter(candidate => candidate.alive && candidate.team !== unit.team);
}

function livingAlliesOf(unit, state) {
  return (state?.allUnits ?? []).filter(candidate => candidate.alive && candidate.team === unit.team);
}

/** Add a permanent stat modifier without going through the effect pipeline. */
function applyPermanentStat(unit, { statType, magnitude, sourceSkill }) {
  unit.buffs = unit.buffs ?? [];
  const entry = {
    statType,
    magnitude,
    stacks: 1,
    stacksAdditive: true,
    source: unit.id,
    sourceSkill,
    durationType: 'permanent',
    remainingRounds: 0,
    unique: true,
    refresh: true,
  };
  const existing = unit.buffs.find(item => item.statType === statType && item.sourceSkill === sourceSkill);
  if (existing) Object.assign(existing, entry);
  else unit.buffs.push(entry);
}

/**
 * Leave handling shared by the first and any later 【迪迪】 summon: the mastery
 * that grants the resummon also grants the per-leave attack bonus.
 */
function summonLeft(owner) {
  const policy = owner?.proprietary?.summonPolicy;
  if (!policy) return null;
  const result = { attackBonus: 0, resummoned: false };
  if (policy.attackBonusPerLeave > 0) {
    applyPermanentStat(owner, {
      statType: 'attack-percent', magnitude: policy.attackBonusPerLeave, sourceSkill: policy.attackBonusSkill ?? 'summon-leave'
    });
    result.attackBonus = policy.attackBonusPerLeave;
  }
  if (policy.resummonTimes > 0 && policy.resummoned < policy.resummonTimes) {
    policy.resummoned += 1;
    summonGuard(owner, {
      id: owner.id * 1000 + 100 + policy.resummoned,
      name: policy.name,
      hpRatio: policy.hpRatio,
      absorbLimitRatio: policy.absorbLimitRatio,
      rounds: policy.rounds,
      onLeave: () => summonLeft(owner),
    });
    result.resummoned = true;
  }
  return result;
}

const HANDLERS = Object.freeze({
  'super-hp': ({ unit, rule, events }) => {
    const amount = Math.max(1, Math.floor(unit.maxHp * Number(rule.config.ratio)));
    addSuperHp(unit, amount, { events, reason: 'super-life' });
    return { ratio: rule.config.ratio, value: amount };
  },

  'summon-guard': ({ unit, rule }) => {
    const config = rule.config;
    unit.proprietary.summonPolicy = {
      name: '迪迪',
      hpRatio: config.hpRatio,
      absorbLimitRatio: config.absorbLimitRatio,
      rounds: config.rounds,
      resummonTimes: 0,
      resummoned: 0,
      attackBonusPerLeave: 0,
      attackBonusSkill: null,
    };
    const summon = summonGuard(unit, {
      id: unit.id * 1000 + 1,
      name: '迪迪',
      hpRatio: config.hpRatio,
      absorbLimitRatio: config.absorbLimitRatio,
      rounds: config.rounds,
      onLeave: () => summonLeft(unit),
    });
    return { name: summon.name, maxHp: summon.maxHp, absorbLimit: summon.absorbLimit, rounds: config.rounds };
  },

  'summon-resummon': ({ unit, skill, rule }) => {
    const policy = unit.proprietary.summonPolicy;
    if (!policy) {
      unit.proprietary.warnings.push('summon-policy-missing:' + String(skill.id));
      return null;
    }
    policy.resummonTimes = Number(rule.config.resummonTimes) || 0;
    policy.attackBonusPerLeave = Number(rule.config.attackBonusPerLeave) || 0;
    policy.attackBonusSkill = String(skill.id);
    return { resummonTimes: policy.resummonTimes, attackBonusPerLeave: policy.attackBonusPerLeave };
  },

  'shield-destroy': ({ unit, skill, rule }) => {
    const config = rule.config;
    if (config.mode !== 'hook') return { mode: 'skill', ratio: config.ratio, scope: config.scope };
    registerHook(unit, PROPRIETARY_HOOKS.BEFORE_ACTION, (actor, payload, state) => {
      if (actor.id !== unit.id) return null;
      if (config.on === 'ultimate' && payload?.actionType !== 'ultimate') return null;
      const enemies = livingEnemiesOf(actor, state);
      if (!enemies.length) return null;
      let scope = enemies;
      if (config.scope === 'target') {
        const actionTargets = typeof payload?.resolveTargets === 'function' ? payload.resolveTargets() : [];
        const chosen = actionTargets.filter(target => target.team !== actor.team && target.alive);
        scope = chosen.length ? chosen : enemies.slice(0, 1);
      }
      let removed = 0;
      const detail = [];
      for (const target of scope) {
        const amount = destroyShield(target, config.ratio, { sourceId: actor.id, events: state.events });
        if (amount > 0) detail.push({ aimId: target.id, removed: amount, shield: target.shield });
        removed += amount;
      }
      if (removed > 0 && config.distributeToAllies) {
        const allies = livingAlliesOf(actor, state);
        const share = Math.floor(removed / Math.max(1, allies.length));
        for (const ally of allies) ally.shield = Math.max(0, Number(ally.shield) || 0) + share;
      }
      return removed > 0 ? { removed, detail } : null;
    }, { maxPerRound: config.maxPerRound ?? null });
    return { mode: 'hook', ratio: config.ratio, scope: config.scope, maxPerRound: config.maxPerRound ?? null };
  },

  'damage-cap': ({ rule }) => ({ ...rule.config }),
});

/**
 * Apply every declaration that begins at battle start (超凡生命, summons,
 * opening layers) and register the hooks the declaration needs.
 */
export function initProprietaryBattle(unit, state, events = null) {
  const active = proprietaryRulesFor(unit.skills ?? []);
  for (const entry of active) {
    const handler = HANDLERS[entry.rule.kind];
    if (!handler) {
      unit.proprietary.warnings.push('unhandled-proprietary-kind:' + entry.rule.kind);
      continue;
    }
    const declaration = handler({ unit, skill: entry.skill, rule: entry.rule, state, events });
    unit.proprietary.rules.push({
      skillId: String(entry.skill.id),
      kind: entry.rule.kind,
      ...(declaration ?? {}),
    });
  }
  return unit.proprietary.rules;
}

/**
 * Effect-list patch point used by skill-integration:
 *  - `damage-cap` tags the matching damage definition with its ceiling;
 *  - `shield-destroy` in skill mode prepends the proportional shield removal so
 *    it happens before that skill's own damage.
 */
export function proprietarySkillEffects(skill, definitions) {
  if (!Array.isArray(definitions) || !definitions.length || !skill) return definitions;
  const active = PROPRIETARY_SKILL_RULES.filter(rule =>
    String(rule.skillId) === String(skill.id) && matchesDescription(skill, rule.requires));
  if (!active.length) return definitions;
  let output = definitions;
  for (const rule of active) {
    if (rule.kind === 'damage-cap') {
      const match = rule.config.match ?? {};
      output = output.map(definition => {
        const effect = definition?.effect;
        if (!effect || effect.type !== 'damage') return definition;
        if (match.damageType && effect.damageType !== match.damageType) return definition;
        if (match.magnitude !== undefined && Number(effect.magnitude) !== Number(match.magnitude)) return definition;
        if (effect.damageCap) return definition;
        return {
          ...definition,
          effect: { ...effect, damageCap: { basis: rule.config.basis, ratio: rule.config.ratio } }
        };
      });
    }
    if (rule.kind === 'shield-destroy' && rule.config.mode === 'skill') {
      const alreadyInjected = output.some(definition => definition?.effect?.type === 'destroy-shield');
      if (!alreadyInjected) {
        output = [{
          target: { targetType: rule.config.scope },
          effect: { type: 'destroy-shield', ratio: rule.config.ratio },
          duration: { durationType: 'instant', rounds: 0 },
          chance: 1,
        }, ...output];
      }
    }
  }
  return output;
}

/** Runtime trigger filter used to retire superseded catalog approximations. */
export function proprietaryTriggerAllowed(skill, trigger) {
  return true;
}
