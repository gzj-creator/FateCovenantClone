// Group B patch generator (2026-11-05)
// Emits `apply-hero-skill-patch.mjs` inputs only. Never writes skill-database.json.
//
// Scope: hero 3020101 / 3020301 / 3020401 / 2030201 / 2040201 / 3020201 / 3030201.
// Supported enum values come from personal-server/game/effects/effect-types.mjs.
// Catalog stats (max-hp-percent / hit-rate / anti-crit / crit-resist /
// crit-damage-reduction / status-hit / status-resist / evasion) are registered
// in STAT_TYPES; mechanics the engine cannot express are kept conservative and
// flagged with requiresInvestigation + notes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../../personal-server/config/skill-database.json');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// ---------- builders ----------
const dur = (durationType, rounds = 0, extra = {}) => ({ durationType, rounds, ...extra });
const PERM = () => dur('permanent', 0);
const INST = () => dur('instant', 0);
const TIMED = rounds => dur('timed', rounds);
const CONDITIONAL = conditionKey => dur('conditional', 0, { conditionKey });

const E = (targetType, effect, duration, extra = {}) => ({
  target: { targetType },
  effect,
  duration,
  chance: 1,
  ...extra,
});

const T = (triggerType, effectEntry, options = {}) => ({
  triggerType,
  condition: null,
  conditionKey: options.conditionKey ?? null,
  cooldown: options.cooldown ?? 0,
  maxTriggers: options.maxTriggers ?? 0,
  oncePerBattle: options.oncePerBattle ?? false,
  oncePerRound: options.oncePerRound ?? false,
  effect: effectEntry,
  priority: options.priority ?? 0,
  chance: options.chance ?? 1,
});

const stat = (statType, magnitude) => ({ type: 'stat-modifier', statType, magnitude, isPercentage: true });
const mitigation = magnitude => stat('damage-reduction', magnitude);
const energyGain = magnitude => ({ type: 'energy', energyType: 'gain', magnitude });
const shieldMaxHp = multiplier => ({ type: 'shield', shieldType: 'percent-max-hp', multiplier });
const shieldDefense = multiplier => ({ type: 'shield', shieldType: 'percent-defense', multiplier });
const healMaxHp = multiplier => ({ type: 'heal', healType: 'percent-max-hp', multiplier, overheal: false });
const healAttack = multiplier => ({ type: 'heal', healType: 'percent-attack', multiplier, overheal: false });
const physical = multiplier => ({ type: 'damage', damageType: 'physical', multiplier, canCrit: true });
const magical = multiplier => ({ type: 'damage', damageType: 'magical', multiplier, canCrit: true });
const dispelBuff = count => ({ type: 'dispel', removeType: 'buff', count });
const cleanseDebuff = count => ({ type: 'dispel', removeType: 'debuff', count });

// ---------- shared mastery bodies (Knight class 3020xxx) ----------
const unshaken = () => ({
  effectType: 'stat-modifier',
  targetType: 'self',
  effects: [E('self', mitigation(0.05), PERM())],
  triggers: [T('on-round-start', E('self', mitigation(0.05), PERM()), { oncePerBattle: true, maxTriggers: 1 })],
  notes: '进入战斗后最终伤害减免+5%.',
});

const vitality = () => ({
  effectType: 'stat-modifier',
  targetType: 'self',
  effects: [E('self', stat('max-hp-percent', 0.05), PERM())],
  triggers: [T('on-round-start', E('self', stat('max-hp-percent', 0.05), PERM()), { oncePerBattle: true, maxTriggers: 1 })],
  notes: '进入战斗后最大生命值增幅+5%（statType max-hp-percent，由 effect-types.mjs 扩展枚举登记）。',
});

const composure = () => ({
  effectType: 'stat-modifier',
  targetType: 'self',
  effects: [E('self', stat('crit-resist', 0.05), PERM()), E('self', stat('crit-damage-reduction', 0.1), PERM())],
  triggers: [
    T('on-round-start', E('self', stat('crit-resist', 0.05), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
    T('on-round-start', E('self', stat('crit-damage-reduction', 0.1), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
  ],
  notes: '进入战斗后抗暴率+5%、暴击伤害减免+10%.',
});

const bedrock = () => ({
  effectType: 'stat-modifier',
  targetType: 'self',
  effects: [E('self', mitigation(0.15), TIMED(1))],
  triggers: [
    T('on-attack', E('self', mitigation(0.15), TIMED(1))),
    T('on-skill-use', E('self', mitigation(0.15), TIMED(1))),
  ],
  requiresInvestigation: true,
  notes: '普攻/绝招后“下一次受伤”减免15%，引擎无单次消耗伤害减免，近似为1回合15%最终伤害减免。',
});

const idolPrivilege = () => ({
  effectType: 'stat-modifier',
  targetType: 'self',
  effects: [E('self', mitigation(0.08), TIMED(1)), E('self', healMaxHp(0.05), INST())],
  triggers: [
    T('on-round-start', E('self', mitigation(0.08), TIMED(1)), { maxTriggers: 3 }),
    T('on-round-end', E('self', healMaxHp(0.05), INST()), { conditionKey: 'round-3', oncePerBattle: true, maxTriggers: 1 }),
  ],
  notes: '前3回合每回合开始获得1回合8%最终伤害减免（最多3次）；第3回合结束回复5%最大生命。',
});

// ---------- shared passive bodies ----------
const sharedPassives = {
  '120001027': () => ({
    effectType: 'energy',
    targetType: 'self',
    effects: [E('self', energyGain(150), INST())],
    triggers: [T('on-being-hit', E('self', energyGain(150), INST()))],
    notes: '受到普攻/绝招后回复150点能量。',
  }),
  '120000046': () => ({
    effectType: 'stat-modifier',
    targetType: 'self',
    effects: [E('self', mitigation(0.1), PERM())],
    triggers: [T('on-round-start', E('self', mitigation(0.1), PERM()), { conditionKey: 'has-debuff' })],
    notes: '自身有减益状态时最终伤害减免+10%。',
  }),
  '120000051': () => ({
    effectType: 'stat-modifier',
    targetType: 'self',
    effects: [E('self', mitigation(0.15), PERM())],
    triggers: [T('on-hp-threshold', E('self', mitigation(0.15), PERM()), { conditionKey: 'hp-below-50', oncePerBattle: true, maxTriggers: 1 })],
    notes: '生命首次低于50%后最终伤害减免+15%。',
  }),
  '120000054': () => ({
    effectType: 'energy',
    targetType: 'self',
    effects: [E('self', energyGain(25), INST())],
    triggers: [T('on-attack', E('self', energyGain(25), INST()))],
    requiresInvestigation: true,
    notes: '描述为友方普攻/绝招时回复25能量；触发器只能绑定自身普攻，友方事件未接入，按自身普攻近似。',
  }),
  '120000055': () => ({
    effectType: 'stat-modifier',
    targetType: 'self',
    effects: [E('self', stat('crit-rate', 0.3), TIMED(1))],
    triggers: [T('on-attack', E('self', stat('crit-rate', 0.3), TIMED(1)), { conditionKey: 'target-hp-above-self' })],
    notes: '攻击生命百分比高于自身的目标时暴击率+30%（1回合）。',
  }),
  '120000059': () => ({
    effectType: 'stat-modifier',
    targetType: 'self',
    effects: [E('self', stat('heal-bonus', 0.2), TIMED(2), { unique: true, refresh: true })],
    triggers: [T('on-round-start', E('self', stat('heal-bonus', 0.2), TIMED(2), { unique: true, refresh: true }), { oncePerBattle: true, maxTriggers: 1 })],
    notes: '战斗开始后前2回合被治愈率+20%（一次施加，持续2回合）。',
  }),
  '120001003': () => ({
    effectType: 'shield',
    targetType: 'self',
    effects: [E('self', shieldDefense(0.8), TIMED(2))],
    triggers: [T('on-hp-threshold', E('self', shieldDefense(0.8), TIMED(2)), { conditionKey: 'hp-below-70', oncePerBattle: true, maxTriggers: 1 })],
    notes: '首次生命低于70%时获得自身防御力80%的护盾，持续2回合。',
  }),
};

const passive = id => {
  const factory = sharedPassives[id];
  if (!factory) throw new Error(`no shared passive spec for ${id}`);
  return { id, spec: factory() };
};

// ---------- hero payloads ----------
const knightMasteries = prefix => [
  { id: `${prefix}71`, spec: unshaken() },
  { id: `${prefix}72`, spec: vitality() },
  { id: `${prefix}73`, spec: composure() },
  { id: `${prefix}74`, spec: bedrock() },
];

const heroSpecs = {
  3020101: [
    ...knightMasteries('3320101'),
    {
      id: '332010175',
      spec: {
        effectType: 'shield',
        targetType: 'self',
        effects: [E('self', shieldMaxHp(0.05), INST())],
        triggers: [T('on-ultimate-use', E('self', shieldMaxHp(0.05), INST()))],
        notes: '释放终结技时额外获得最大生命5%的护盾。',
      },
    },
    passive('120001027'),
    passive('120000046'),
    passive('120000051'),
    passive('120000054'),
    passive('120000055'),
    passive('120000059'),
    passive('120001003'),
  ],
  3020301: [
    ...knightMasteries('3320301'),
    { id: '332030175', spec: idolPrivilege() },
    passive('120001027'),
    passive('120000046'),
    passive('120000051'),
    passive('120000054'),
    passive('120000055'),
    passive('120000059'),
    passive('120001003'),
  ],
  3020401: [
    ...knightMasteries('3320401'),
    { id: '332040175', spec: idolPrivilege() },
    passive('120001027'),
    passive('120000046'),
    passive('120000051'),
    passive('120000054'),
    passive('120000055'),
    passive('120000059'),
  ],
  2030201: [
    {
      id: '323020173',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'self',
        effects: [E('self', stat('ignore-defense', 0.05), PERM()), E('self', stat('hit-rate', 0.1), PERM())],
        triggers: [
          T('on-round-start', E('self', stat('ignore-defense', 0.05), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
          T('on-round-start', E('self', stat('hit-rate', 0.1), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
        ],
        notes: '进入战斗后无视防御+5%、命中率+10%.',
      },
    },
    {
      id: '120000025',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'self',
        effects: [E('self', stat('crit-resistance', 0.3), PERM())],
        triggers: [
          T('on-round-start', E('self', stat('crit-resistance', 0.3), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
          T('on-buff-gain', E('self', stat('crit-resistance', 0.3), PERM())),
        ],
        requiresInvestigation: true,
        notes: '自身有增益状态时抗暴率+30%（statType crit-resistance）；增益存在性未由引擎判定，按回合开始与获得增益两个时机施加。',
      },
    },
    {
      id: '120000028',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'self',
        effects: [E('self', stat('hit-rate', 0.15), PERM())],
        triggers: [T('on-round-start', E('self', stat('hit-rate', 0.15), PERM()), { conditionKey: 'hp-above-50', oncePerBattle: true, maxTriggers: 1 })],
        notes: '生命高于50%时命中率+15%.',
      },
    },
    {
      id: '6203020109',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'all-allies',
        effects: [
          E('all-allies', mitigation(0.05), TIMED(1)),
          E('all-allies', { ...stat('crit-damage', 0.05), maxStacks: 3 }, PERM()),
        ],
        triggers: [
          T('on-round-start', E('all-allies', mitigation(0.05), TIMED(1)), { oncePerBattle: true, maxTriggers: 1 }),
          T('on-kill', E('all-allies', mitigation(0.05), TIMED(1))),
          T('on-ultimate-use', E('all-allies', { ...stat('crit-damage', 0.05), maxStacks: 3 }, PERM())),
        ],
        requiresInvestigation: true,
        notes: '稀有技能：描述中的{0}为未解出的buff模板，近似为1回合5%最终伤害减免；战斗开始与敌方死亡时对我方全体施加。暴击伤害+5%（古域阵营翻倍、最多3层）以终结技使用触发近似，阵营数据与“{0}期间释放终结技”窗口判定未接入引擎。',
      },
    },
  ],
  2040201: [
    {
      id: '324020173',
      spec: {
        effectType: 'damage',
        targetType: 'all-enemies',
        effects: [E('all-enemies', magical(1.3), INST()), E('all-enemies', dispelBuff(1), INST())],
        triggers: [
          T('on-turn-end', E('all-enemies', dispelBuff(1), INST()), { priority: -1 }),
          T('on-turn-end', E('all-enemies', magical(1.3), INST())),
        ],
        requiresInvestigation: true,
        notes: '混合效果（主效果为伤害）：自身行动回合结束后再释放1次终结技，以“捣蛋到底”的130%全体法术伤害复刻一次作为近似；释放前摧毁敌方全体20%护盾无对应效果，近似为先驱散敌方全体1个可驱散增益（触发 priority -1 先于伤害）。每回合触发次数由引擎回合事件控制。',
      },
    },
  ],
  3020201: [
    { id: '332020172', spec: vitality() },
    {
      id: '332020173',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'self',
        effects: [E('self', stat('status-hit', 0.1), PERM()), E('self', stat('status-resist', 0.1), PERM())],
        triggers: [
          T('on-round-start', E('self', stat('status-hit', 0.1), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
          T('on-round-start', E('self', stat('status-resist', 0.1), PERM()), { oncePerBattle: true, maxTriggers: 1 }),
        ],
        notes: '进入战斗后异常状态命中+10%、异常状态抗性+10%.',
      },
    },
    {
      id: '332020174',
      spec: {
        effectType: 'dispel',
        targetType: 'random-ally',
        effects: [E('random-ally', cleanseDebuff(1), INST())],
        triggers: [
          T('on-attack', E('random-ally', cleanseDebuff(1), INST())),
          T('on-skill-use', E('random-ally', cleanseDebuff(1), INST())),
        ],
        requiresInvestigation: true,
        notes: '普攻/绝招后随机驱散1个友方减益；目标由引擎随机选取，敌我单位中是否含自身由战斗队列决定。',
      },
    },
    {
      id: '120000034',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'self',
        effects: [E('self', stat('anti-crit', 0.2), CONDITIONAL('hp-above-50'), { conditionKey: 'hp-above-50', unique: true, refresh: true })],
        triggers: [T('on-round-start', E('self', stat('anti-crit', 0.2), CONDITIONAL('hp-above-50'), { conditionKey: 'hp-above-50', unique: true, refresh: true }), { conditionKey: 'hp-above-50' })],
        notes: '生命高于50%时抗暴提升20%（statType anti-crit，conditional 持续）。',
      },
    },
    {
      id: '120001015',
      spec: {
        effectType: 'stat-modifier',
        targetType: 'self',
        effects: [E('self', stat('evasion', 0.2), TIMED(1))],
        triggers: [T('on-ultimate-use', E('self', stat('evasion', 0.2), TIMED(1)))],
        notes: '终结技后闪避增加20%，持续1回合（statType evasion）。',
      },
    },
  ],
  3030201: [
    { id: '333020172', spec: vitality() },
    { id: '333020173', spec: composure() },
    { id: '333020175', spec: idolPrivilege() },
    {
      id: '6303020105',
      spec: {
        effectType: 'damage',
        targetType: 'single',
        effects: [
          E('single', physical(1), INST()),
          E('self', stat('damage-bonus', 0.2), PERM()),
        ],
        triggers: [T('on-attack', E('self', stat('damage-bonus', 0.2), PERM()))],
        requiresInvestigation: true,
        notes: '稀有技能：可执行的“任意攻击附加20%伤害加成”已实现为攻击时获得20%伤害加成；基础伤害沿用元数据兜底1.0x物理单击。按目标减益层数触发的≥3层回15%最大生命、≥6层按已损生命提升暴击率/暴击伤害（≤25%）、≥9层回200能量需要减益层数与目标状态条件，引擎未接入，待调查。',
      },
    },
  ],
};

// ---------- emit ----------
let written = 0;
for (const [heroIdText, entries] of Object.entries(heroSpecs)) {
  const heroId = Number(heroIdText);
  const hero = db.heroes.find(candidate => candidate.id === heroId);
  if (!hero) throw new Error(`hero ${heroId} not found in skill database`);

  const skills = entries.map(({ id, spec }) => {
    const skill = hero.skills.find(candidate => candidate.id === id);
    if (!skill) throw new Error(`hero ${heroId} has no skill ${id}`);
    const current = skill.implementation || {};
    const implementation = {
      source: current.source || 'FightTable.Ability + FightTable.AbilityDes',
      resolvedAbility: Boolean(current.ability),
      resolvedDescription: Boolean(current.abilityDes),
      ability: current.ability ?? null,
      abilityDes: current.abilityDes ?? null,
      catalogTypeMatch: current.catalogTypeMatch ?? null,
      effectType: spec.effectType,
      targetType: spec.targetType,
      energyCost: current.energyCost ?? 0,
      effects: spec.effects,
      triggers: spec.triggers || [],
      requiresInvestigation: Boolean(spec.requiresInvestigation),
      notes: spec.notes || '',
    };
    return { id, implementation };
  });

  const outFile = path.join(__dirname, `hero-${heroId}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify({ heroId, skills }, null, 2)}\n`, 'utf8');
  written += 1;
  console.log(`wrote ${path.basename(outFile)}: ${skills.length} skills`);
}

console.log(`done: ${written} patch files`);
