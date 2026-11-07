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
  PROPRIETARY_EVENT_KINDS,
  PROPRIETARY_HOOKS,
  addLayer,
  activeDomains,
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
  },

  // 天极值 recovery: "每回合（自身）普攻/绝招行动后额外获得1点天极值".
  {
    kind: 'tianji-gain',
    requires: [/每回合(?:自身)?(?:普攻\/绝招行动后|行动后)额外获得1点天极值/],
    evidence: '每回合自身普攻/绝招行动后额外获得1点天极值',
    config: { amount: 1 }
  },
  // 天极值 drain: "每回合首次释放终结技后降低敌方随机一人1点天极值".
  {
    kind: 'tianji-drain',
    requires: [/首次释放终结技后[，,]?降低敌方随机一?人?1点天极值/],
    evidence: '每回合首次释放终结技后降低敌方随机一人1点天极值',
    config: { amount: 1 }
  },
  // 坠羽星落: "随后清空目标的能量和天极值".
  {
    skillId: '2504070123', kind: 'clear-resource',
    requires: ['清空目标的能量和天极值'],
    evidence: '对敌方全体造成138%魔法伤害，随后清空目标的能量和天极值',
    config: { scope: 'all-enemies', resources: ['energy', 'tianji'] }
  },

  // 领域: 【魔能领域】 lasts two rounds, heals allies on opening and grants
  // 【魔能】 layers to the allies inside it.
  {
    skillId: '2104010123', kind: 'domain',
    requires: ['展开1层【魔能领域】',
      '领域内我方全体立刻回复自身10%的最大生命并额外提升10%攻击力，持续2回合',
      '领域内所有友方冒险者每回合开始时额外获得1层【魔能】'],
    evidence: '消耗3点天极值，造成敌方全体130%法术伤害，展开1层【魔能领域】；'
      + '【魔能领域】:领域内我方全体立刻回复自身10%的最大生命并额外提升10%攻击力，持续2回合；'
      + '领域内所有友方冒险者每回合开始时额外获得1层【魔能】、每次普攻/绝招时额外获得1层【魔能】、'
      + '每回合首次释放终结技时额外获得1层【魔能】、每次受到普攻/绝招/终结技/天极技伤害时额外获得1层【魔能】，持续2回合',
    config: {
      name: '魔能领域', rounds: 2, healRatio: 0.1,
      allyStats: [{ statType: 'attack-percent', magnitude: 0.1 }],
      layers: { name: '魔能', roundStart: 1, action: 1, firstUltimate: 1, damageTaken: 1 },
    }
  },

  // 命名层数: 【魂】 from any character death, capped at 8 by 314030175.
  {
    skillId: '2104030123', kind: 'layer',
    requires: ['敌我双方任意角色死亡时，自身将获得1层【魂】，每个角色仅能获取1次'],
    evidence: '敌我双方任意角色死亡时，自身将获得1层【魂】，每个角色仅能获取1次',
    config: { name: '魂', perDeath: 1 }
  },
  {
    skillId: '314030171', kind: 'layer',
    requires: ['战斗开始时，额外获得2层【魂】', '自身额外获得20%最大生命值的护盾'],
    evidence: '战斗开始时，额外获得2层【魂】；通过敌我双方角色死亡途径获取【魂】时（魂溢出时也可触发），'
      + '自身额外获得20%最大生命值的护盾',
    config: { name: '魂', opening: 2, deathShieldRatio: 0.2 }
  },
  {
    skillId: '314030175', kind: 'layer',
    requires: ['【魂】的层数上限提升至8层'],
    evidence: '【魂】的层数上限提升至8层',
    config: { name: '魂', cap: 8 }
  },

  // 命名层数: 【月光】, 100 层上限, 每层 +0.5% 最终伤害加成与无视防御.
  {
    skillId: '2404030123', kind: 'layer',
    requires: ['【月光】：至多叠加100层，每层提升0.5%最终伤害加成及0.5%无视防御'],
    evidence: '【月光】：至多叠加100层，每层提升0.5%最终伤害加成及0.5%无视防御',
    config: {
      name: '月光', cap: 100,
      perLayer: [
        { statType: 'damage-bonus', magnitude: 0.005 },
        { statType: 'ignore-defense', magnitude: 0.005 },
      ],
    }
  },
  {
    skillId: '2404040123', kind: 'layer',
    requires: ['【月光】：至多叠加100层，每层提升0.5%最终伤害加成及0.5%无视防御'],
    evidence: '【月光】：至多叠加100层，每层提升0.5%最终伤害加成及0.5%无视防御',
    config: {
      name: '月光', cap: 100,
      perLayer: [
        { statType: 'damage-bonus', magnitude: 0.005 },
        { statType: 'ignore-defense', magnitude: 0.005 },
      ],
    }
  },

  // 额外行动 / 追击 / 反击.
  {
    skillId: '120001001', kind: 'extra-action',
    requires: ['首回合', '再次释放1次普攻/绝招', '无法回复能量'],
    evidence: '首回合普攻/绝招后，再次释放1次普攻/绝招（该普攻/绝招无法回复能量）',
    config: { trigger: 'action-end', round: 1, oncePerBattle: true, sameAction: true, replaceTriggers: true }
  },
  {
    skillId: '334010173', kind: 'extra-action',
    requires: ['敌方冒险者阵亡时', '追击', '每回合最多触发1次'],
    evidence: '敌方冒险者阵亡时，立刻释放一次不消耗层数的{0}的追击，每回合最多触发1次',
    config: { trigger: 'enemy-death', action: 'ultimate', maxPerRound: 1 }
  },
  {
    skillId: '344020172', kind: 'extra-action',
    requires: ['受到终结技攻击后，立刻释放一次终结技', '每回合最多触发1次'],
    evidence: '受到终结技攻击后，立刻释放一次终结技，每回合最多触发1次',
    config: { trigger: 'hit-by-ultimate', action: 'ultimate', maxPerRound: 1 }
  },
  {
    skillId: '324020173', kind: 'extra-action',
    requires: ['自身行动回合结束后额外释放1次终结技', '摧毁敌方全体20%护盾'],
    evidence: '自身行动回合结束后额外释放1次终结技，且本次终结技释放前额外摧毁敌方全体20%护盾',
    config: { trigger: 'action-end', action: 'ultimate', maxPerRound: 1, destroyShieldRatio: 0.2, replaceTriggers: true }
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
      // Rules with a skillId bind one catalog row; rules without one express a
      // description pattern shared by many rows (e.g. the 天极值 clauses).
      if (rule.skillId !== undefined && String(rule.skillId) !== id) continue;
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

function emitProprietary(events, payload) {
  if (Array.isArray(events)) events.push(payload);
}

/** Add named layers to one unit and emit the observable layer event. */
function gainNamedLayers(events, unit, def, count, reason) {
  if (!unit || !def || !(count > 0)) return 0;
  const before = layerValue(unit, def.name);
  const after = addLayer(unit, def.name, count, { max: def.cap ?? null, perLayer: def.perLayer });
  const delta = after - before;
  if (delta > 0) {
    emitProprietary(events, {
      kind: PROPRIETARY_EVENT_KINDS.LAYER, aimId: unit.id, name: def.name,
      value: after, delta, reason,
    });
  }
  return delta;
}

/** Heal one unit and emit the same shape the effect pipeline reports. */
function healNamedUnit(events, unit, amount, sourceId) {
  if (!unit?.alive || !(amount > 0)) return 0;
  const oldHp = Math.max(0, Number(unit.hp) || 0);
  const newHp = Math.min(unit.maxHp, oldHp + Math.floor(amount));
  const actualHeal = newHp - oldHp;
  if (actualHeal <= 0) return 0;
  unit.hp = newHp;
  unit.healsReceived = (Number(unit.healsReceived) || 0) + actualHeal;
  emitProprietary(events, {
    kind: 'effect', type: 'heal', actor: sourceId, target: unit.id,
    value: actualHeal, actualHeal, oldHp, newHp, overheal: false,
  });
  return actualHeal;
}

/** Add a stat modifier whose lifetime is expressed in rounds. */
function applyTimedStat(unit, { statType, magnitude, rounds, sourceSkill = null, state = null }) {
  unit.buffs = unit.buffs ?? [];
  const entry = {
    statType,
    magnitude: Number(magnitude) || 0,
    stacks: 1,
    stacksAdditive: true,
    source: unit.id,
    sourceSkill,
    durationType: 'timed',
    remainingRounds: Math.max(0, Math.floor(Number(rounds) || 0)),
    appliedRound: Number(state?.round) || null,
  };
  const existing = unit.buffs.find(item => item.statType === statType
    && item.sourceSkill === sourceSkill && item.durationType === 'timed');
  if (existing) {
    existing.magnitude = entry.magnitude;
    existing.remainingRounds = Math.max(Number(existing.remainingRounds) || 0, entry.remainingRounds);
    existing.appliedRound = entry.appliedRound;
  } else {
    unit.buffs.push(entry);
  }
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
      // runHooks hands every hook its own owner as the first argument, so the
      // "自身释放" guards must read the acting unit from the payload.
      if (payload?.actor?.id !== unit.id) return false;
      if (config.on === 'ultimate' && payload?.actionType !== 'ultimate') return false;
      const enemies = livingEnemiesOf(actor, state);
      if (!enemies.length) return false;
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
      return removed > 0 ? { removed, detail } : false;
    }, { maxPerRound: config.maxPerRound ?? null });
    return { mode: 'hook', ratio: config.ratio, scope: config.scope, maxPerRound: config.maxPerRound ?? null };
  },

  'damage-cap': ({ rule }) => ({ ...rule.config }),

  'tianji-gain': ({ unit, rule }) => {
    const amount = Number(rule.config.amount) || 1;
    registerHook(unit, PROPRIETARY_HOOKS.ACTION_END, (actor, payload, state) => {
      // "每回合…行动后额外获得1点": one gain per round, and free follow-up
      // actions do not feed it again.
      if (payload?.extra) return false;
      if (payload?.actor?.id !== unit.id) return false;
      gainTianji(actor, amount, { events: state?.events, reason: 'mastery-action' });
      return null;
    }, { oncePerRound: true });
    return { amount };
  },

  'tianji-drain': ({ unit, rule }) => {
    const amount = Number(rule.config.amount) || 1;
    registerHook(unit, PROPRIETARY_HOOKS.ACTION_END, (actor, payload, state) => {
      if (payload?.extra || !payload?.useSkill) return false;
      if (payload?.actor?.id !== unit.id) return false;
      const enemies = livingEnemiesOf(actor, state).filter(enemy => tianjiValue(enemy) >= amount);
      if (!enemies.length) return false;
      const random = typeof state.random === 'function' ? state.random() : 0.5;
      const index = Math.min(enemies.length - 1, Math.floor(random * enemies.length));
      drainTianji(enemies[index], amount, {
        events: state?.events, reason: 'ultimate-drain', sourceId: actor.id
      });
      return null;
    }, { oncePerRound: true });
    return { amount };
  },

  'clear-resource': ({ rule }) => ({ ...rule.config }),

  'domain': ({ unit, skill, rule }) => {
    const config = rule.config;
    const layerDef = { name: config.layers.name };
    const openedBy = state => activeDomains(state, config.name)
      .find(domain => domain.ownerId === unit.id) ?? null;

    // The field opens after the cast resolves: the description deals damage
    // first and only then opens the domain, so its opening buffs never boost
    // the cast that created it.
    registerHook(unit, PROPRIETARY_HOOKS.ACTION_END, (owner, payload, state) => {
      if (payload?.extra) return false;
      if (payload?.actor?.id !== unit.id) return false;
      if (String(payload?.skill?.id ?? '') !== String(skill.id)) return false;
      const existing = openedBy(state);
      if (existing) existing.roundsRemaining = Math.max(existing.roundsRemaining, Number(config.rounds));
      else openDomain(state, { name: config.name, ownerId: unit.id, team: unit.team, rounds: Number(config.rounds) });
      emitProprietary(state?.events, {
        kind: PROPRIETARY_EVENT_KINDS.DOMAIN, aimId: unit.id, name: config.name,
        rounds: Number(config.rounds), delta: 1, reason: 'cast',
      });
      for (const ally of livingAlliesOf(unit, state)) {
        healNamedUnit(state?.events, ally, ally.maxHp * Number(config.healRatio), unit.id);
        for (const stat of config.allyStats ?? []) {
          applyTimedStat(ally, {
            statType: stat.statType, magnitude: stat.magnitude,
            rounds: Number(config.rounds), sourceSkill: String(skill.id), state,
          });
          emitProprietary(state?.events, {
            kind: 'effect', type: 'stat-modifier', id: state?.currentActionId ?? 0,
            actor: unit.id, target: ally.id, statType: stat.statType,
            magnitude: stat.magnitude, duration: Number(config.rounds),
            remainingRounds: Number(config.rounds), reason: 'domain-opening',
          });
        }
      }
      return null;
    }, {});

    // "领域内所有友方冒险者每回合开始时额外获得1层【魔能】"
    registerHook(unit, PROPRIETARY_HOOKS.ROUND_START, (owner, payload, state) => {
      if (!openedBy(state)) return false;
      for (const ally of livingAlliesOf(unit, state)) {
        gainNamedLayers(state?.events, ally, layerDef, Number(config.layers.roundStart), 'domain-round-start');
      }
      return null;
    }, {});

    // "每次普攻/绝招时额外获得1层" plus the extra layer on the round's first
    // ultimate. 绝招 is the ultimate action in this catalog, which is also what
    // makes "每回合首次释放终结技时额外获得1层" an additional layer.
    registerHook(unit, PROPRIETARY_HOOKS.ACTION_END, (owner, payload, state) => {
      if (!openedBy(state)) return false;
      const acting = payload?.actor;
      if (!acting || acting.team !== unit.team) return false;
      if (payload.actionType !== 'attack' && payload.actionType !== 'ultimate') return false;
      let count = Number(config.layers.action) || 0;
      if (payload.actionType === 'ultimate') {
        const key = 'domain:' + config.name + ':first-ultimate';
        const round = Number(state?.round);
        if (Number(unit.proprietary.counters.get(key)) !== round) {
          unit.proprietary.counters.set(key, round);
          count += Number(config.layers.firstUltimate) || 0;
        }
      }
      for (const ally of livingAlliesOf(unit, state)) {
        gainNamedLayers(state?.events, ally, layerDef, count, 'domain-action');
      }
      return null;
    }, {});

    // "每次受到普攻/绝招/终结技/天极技伤害时额外获得1层"
    registerHook(unit, PROPRIETARY_HOOKS.DAMAGE_TAKEN, (owner, payload, state) => {
      if (!openedBy(state)) return false;
      const target = payload?.target;
      if (!target?.alive || target.team !== unit.team) return false;
      if (!['attack', 'ultimate', 'tianji'].includes(payload?.actionType)) return false;
      gainNamedLayers(state?.events, target, layerDef, Number(config.layers.damageTaken), 'domain-damage-taken');
      return null;
    }, {});

    return { name: config.name, rounds: Number(config.rounds) };
  },

  'layer': ({ unit, skill, rule, state, events }) => {
    const config = rule.config;
    const defs = unit.proprietary.layerDefs;
    const def = defs.get(config.name) ?? { name: config.name };
    if (config.cap !== undefined) def.cap = Math.max(Number(def.cap ?? 0), Number(config.cap));
    if (Array.isArray(config.perLayer)) def.perLayer = config.perLayer;
    if (config.opening !== undefined) def.opening = (def.opening ?? 0) + Number(config.opening);
    if (config.perDeath !== undefined) def.perDeath = (def.perDeath ?? 0) + Number(config.perDeath);
    if (config.deathShieldRatio !== undefined) def.deathShieldRatio = Number(config.deathShieldRatio);
    defs.set(config.name, def);

    if (def.opening > 0 && !def.opened) {
      def.opened = true;
      gainNamedLayers(events, unit, def, def.opening, 'layer-opening');
      if (Array.isArray(def.perLayer)) {
        unit.proprietary.layerStats.set(def.name, def.perLayer);
      }
    }
    if (Array.isArray(def.perLayer)) unit.proprietary.layerStats.set(def.name, def.perLayer);

    if (def.perDeath > 0 && !def.deathHook) {
      def.deathHook = true;
      const seen = unit.proprietary.deathsSeen ?? (unit.proprietary.deathsSeen = new Set());
      registerHook(unit, PROPRIETARY_HOOKS.UNIT_DEATH, (owner, payload, hookState) => {
        const dead = payload?.unit;
        if (!dead || seen.has(dead.id)) return false;
        seen.add(dead.id);
        gainNamedLayers(hookState?.events, owner, def, def.perDeath, 'layer-death');
        if (def.deathShieldRatio > 0) {
          const amount = Math.floor(owner.maxHp * def.deathShieldRatio);
          if (amount > 0) {
            owner.shield = Math.max(0, Number(owner.shield) || 0) + amount;
            emitProprietary(hookState?.events, {
              kind: 'shield', id: hookState?.currentActionId ?? 0, aimId: owner.id,
              shield: owner.shield, reason: 'layer-death',
            });
          }
        }
        return null;
      }, {});
    }
    return { name: config.name, cap: def.cap ?? null };
  },

  'extra-action': ({ unit, skill, rule }) => {
    const config = rule.config;
    const request = (actor, payload) => ({
      kind: 'extra-action',
      actorId: actor.id,
      action: config.sameAction ? (payload?.useSkill ? 'ultimate' : 'attack') : (config.action ?? 'attack'),
      reason: String(skill.id),
      before: config.destroyShieldRatio
        ? (owner, state, events) => {
          for (const enemy of livingEnemiesOf(owner, state)) {
            destroyShield(enemy, config.destroyShieldRatio, { sourceId: owner.id, events });
          }
        }
        : null,
    });
    if (config.trigger === 'action-end') {
      registerHook(unit, PROPRIETARY_HOOKS.ACTION_END, (actor, payload, state) => {
        if (payload?.extra) return false;
        if (payload?.actor?.id !== unit.id) return false;
        if (config.round && Number(state.round) !== Number(config.round)) return false;
        return request(actor, payload);
      }, { oncePerBattle: config.oncePerBattle === true, maxPerRound: config.maxPerRound ?? 1 });
    } else if (config.trigger === 'enemy-death') {
      registerHook(unit, PROPRIETARY_HOOKS.UNIT_DEATH, (actor, payload) => {
        const dead = payload?.unit;
        if (!dead || dead.team === actor.team) return false;
        return request(actor, payload);
      }, { maxPerRound: config.maxPerRound ?? 1 });
    } else if (config.trigger === 'hit-by-ultimate') {
      registerHook(unit, PROPRIETARY_HOOKS.DAMAGE_TAKEN, (actor, payload) => {
        if (payload?.target?.id !== actor.id) return false;
        if (payload?.actor?.team === actor.team) return false;
        if (payload?.actionType !== 'ultimate') return false;
        return request(actor, payload);
      }, { maxPerRound: config.maxPerRound ?? 1 });
    }
    return { trigger: config.trigger, action: config.action ?? null };
  },
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
    if (rule.kind === 'clear-resource') {
      const alreadyInjected = output.some(definition => definition?.effect?.type === 'clear-resource');
      if (!alreadyInjected) {
        output = [...output, {
          target: { targetType: rule.config.scope },
          effect: { type: 'clear-resource', resources: rule.config.resources },
          duration: { durationType: 'instant', rounds: 0 },
          chance: 1,
        }];
      }
    }
  }
  return output;
}

/** Runtime trigger filter used to retire superseded catalog approximations. */
export function proprietaryTriggerAllowed(skill, trigger) {
  if (!skill || !trigger) return true;
  const active = PROPRIETARY_SKILL_RULES.filter(rule =>
    (rule.skillId === undefined || String(rule.skillId) === String(skill.id))
    && matchesDescription(skill, rule.requires));
  if (!active.length) return true;
  // A rule that implements the whole clause (an extra action, for example)
  // replaces the catalog's placeholder triggers for that row.
  if (active.some(rule => rule.config?.replaceTriggers === true)) return false;
  const effect = trigger?.effect?.effect;
  // "降低敌方随机一人1点天极值" was approximated in the catalog as 100 energy
  // loss. The proprietary drain hook now performs the described change, so the
  // approximation must not also run.
  if (active.some(rule => rule.kind === 'tianji-drain')
    && effect?.type === 'energy' && effect.energyType === 'loss' && Number(effect.magnitude) <= 100) {
    return false;
  }
  return true;
}
