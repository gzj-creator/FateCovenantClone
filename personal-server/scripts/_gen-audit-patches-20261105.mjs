/**
 * Generates skill-database patches for the 2026-11-05 audit round.
 * Writes one patch JSON per hero into analysis/experiments/skill-audit-20261105/patches
 * and prints a summary. Apply with:
 *   node scripts/apply-hero-skill-patch.mjs <absolute patch dir>
 */
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = 'config/skill-database.json';
const OUT_DIR = path.resolve('../analysis/experiments/skill-audit-20261105/patches');
fs.mkdirSync(OUT_DIR, { recursive: true });

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const heroOf = id => db.heroes.find(h => String(h.id) === String(id));
const clone = value => JSON.parse(JSON.stringify(value));
const log = [];

const queue = new Map();
function patchHero(heroId, mutate, descOverrides = {}) {
  if (!queue.has(heroId)) queue.set(heroId, { mutators: [], descs: {}, added: {} });
  const entry = queue.get(heroId);
  entry.mutators.push(mutate);
  Object.assign(entry.descs, descOverrides);
  heroOf(heroId)._added = entry.added;
}

function flush() {
  for (const [heroId, entry] of queue) {
    const hero = heroOf(heroId);
    if (!hero) throw new Error('hero not found ' + heroId);
    const before = new Map(hero.skills.map(s => [s.id, JSON.stringify(s.implementation)]));
    const descsBefore = new Map(hero.skills.map(s => [s.id, s.description]));
    const skills = hero.skills.map(clone);
    for (const mutate of entry.mutators) mutate(skills, hero);
    const descOverrides = entry.descs;
  const changed = [];
  for (const skill of skills) {
    const prev = before.get(skill.id);
    if (prev === undefined) { changed.push({ id: skill.id, added: true, impl: skill.implementation }); continue; }
    const descChanged = descOverrides[skill.id] && descOverrides[skill.id] !== descsBefore.get(skill.id);
    if (prev !== JSON.stringify(skill.implementation) || descChanged) changed.push({ id: skill.id, impl: skill.implementation });
  }
  if (!changed.length) { log.push(heroId + ': no changes'); continue; }
  const payload = {
    heroId: Number(heroId),
    skills: changed.map(entry => {
      const original = hero.skills.find(s => s.id === entry.id);
      const out = { id: entry.id, implementation: entry.impl };
      if (descOverrides[entry.id]) out.description = descOverrides[entry.id];
      if (!original) {
        const added = hero._added && hero._added[entry.id];
        if (!added) throw new Error('added skill needs metadata: ' + entry.id);
        Object.assign(out, { name: added.name, type: added.type, category: added.category, status: added.status, description: added.description });
      }
      return out;
    }),
  };
  const file = path.join(OUT_DIR, heroId + '.json');
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  log.push(heroId + ' ' + hero.name + ': ' + changed.map(c => c.id + (c.added ? '(added)' : '')).join(', '));
  }
}

const skillOf = (skills, id) => {
  const skill = skills.find(s => s.id === id);
  if (!skill) throw new Error('skill not found: ' + id);
  return skill;
};
const mark = (impl, reason) => {
  const tag = '[audit-20261105: ' + reason + ']';
  impl.notes = impl.notes ? (impl.notes.includes(tag) ? impl.notes : impl.notes + ' ' + tag) : tag;
};
const walkEffects = impl => [
  ...(impl.effects || []),
  ...(impl.triggers || []).map(t => t.effect).filter(Boolean),
];

// --- 1020101 深海歌姬: missing effectType/targetType/energyCost on every skill
patchHero(1020101, skills => {
  for (const skill of skills) {
    const impl = skill.implementation;
    let touched = false;
    const first = (impl.effects || [])[0];
    if (!impl.effectType && first && first.effect && first.effect.type) {
      impl.effectType = first.effect.type;
      touched = true;
    }
    if (!impl.targetType && first && first.target && first.target.targetType) {
      impl.targetType = first.target.targetType;
      touched = true;
    }
    if (impl.energyCost === undefined) { impl.energyCost = 0; touched = true; }
    if (touched) mark(impl, 'effectType/targetType/energyCost filled from effects[0]; metadata was missing');
  }
  // battle-long modifiers were recorded as instant while sibling heroes use permanent
  for (const id of ['312010171', '312010172', '312010173', '120000032', '120000042', '120000044']) {
    const impl = skillOf(skills, id).implementation;
    for (const wrap of walkEffects(impl)) {
      if (wrap.duration && wrap.duration.durationType === 'instant') {
        wrap.duration = { durationType: 'permanent', rounds: 0 };
      }
    }
    mark(impl, 'battle-long modifier duration normalised to permanent to match sibling heroes');
  }
  // 生命护盾: description says first time HP < 70%
  const shield = skillOf(skills, '120001003').implementation;
  shield.triggers[0].conditionKey = 'hp-below-70';
  mark(shield, 'conditionKey hp-below-70 restored from description');
});

// --- 4020101 辉光神女 / 5040201 苏苏 / 5040401 零 / 5040501 烬: 生命护盾 metadata gaps
for (const heroId of [4020101, 5040201, 5040401, 5040501]) {
  patchHero(heroId, skills => {
    const impl = skillOf(skills, '120001003').implementation;
    const reasons = [];
    if (!impl.effectType) { impl.effectType = 'shield'; reasons.push('effectType'); }
    if (!impl.targetType) { impl.targetType = 'self'; reasons.push('targetType'); }
    if (impl.energyCost === undefined) impl.energyCost = 0;
    if (!impl.triggers[0].conditionKey) { impl.triggers[0].conditionKey = 'hp-below-70'; reasons.push('conditionKey hp-below-70'); }
    if (reasons.length) mark(impl, '生命护盾 metadata restored from description: ' + reasons.join(', '));
  });
}

// --- 1020601 女仆格蕾丝: 升格防御 targets allies, 'front-row-allies' is not a selector type
patchHero(1020601, skills => {
  const impl = skillOf(skills, '6102060102').implementation;
  impl.targetType = 'all-allies';
  for (const wrap of walkEffects(impl)) wrap.target = { targetType: 'all-allies' };
  impl.requiresInvestigation = true;
  mark(impl, 'targetType front-row-allies is not supported by TargetSelector; approximated as all-allies');
});

// --- 1030201 银爵艾伦: 定制策略 targets front-row highest attack
patchHero(1030201, skills => {
  const impl = skillOf(skills, '313020175').implementation;
  impl.targetType = 'single';
  for (const wrap of walkEffects(impl)) wrap.target = { targetType: 'single' };
  impl.requiresInvestigation = true;
  mark(impl, 'targetType front-row-highest-attack is not supported by TargetSelector; approximated as single (front-most enemy)');
});

// --- 2040101 赤霄: timed durations recorded with rounds 0
patchHero(2040101, skills => {
  for (const id of ['324010171', '324010173', '324010175']) {
    const impl = skillOf(skills, id).implementation;
    let fixed = 0;
    for (const wrap of walkEffects(impl)) {
      if (wrap.duration && wrap.duration.durationType === 'timed' && !(wrap.duration.rounds > 0)) {
        wrap.duration = { durationType: 'timed', rounds: 1 };
        fixed++;
      }
    }
    if (fixed) mark(impl, 'timed duration rounds 0 -> 1 (applies during the round the ultimate is used)');
  }
});

// --- 5040401 零 / 5040501 烬: 潜能蕴养 shield duration had timed/rounds 0
for (const [heroId, skillId] of [[5040401, '354040172'], [5040501, '354050172']]) {
  patchHero(heroId, skills => {
    const impl = skillOf(skills, skillId).implementation;
    let fixed = 0;
    for (const wrap of walkEffects(impl)) {
      if (wrap.effect && wrap.effect.type === 'shield' && wrap.duration && wrap.duration.durationType === 'timed' && !(wrap.duration.rounds > 0)) {
        wrap.duration = { durationType: 'permanent', rounds: 0 };
        fixed++;
      }
    }
    if (fixed) mark(impl, 'shield duration timed/0 -> permanent (description gives no round limit; shield lasts until consumed)');
  });
}

// --- 5040101 夜璃: 极意自现 modelled shield destruction as a negative shield
patchHero(5040101, skills => {
  const impl = skillOf(skills, '354010174').implementation;
  let fixed = 0;
  for (const wrap of walkEffects(impl)) {
    if (wrap.effect && wrap.effect.type === 'shield' && wrap.effect.multiplier < 0) {
      wrap.effect = { type: 'stat-modifier', statType: 'shield-bonus', magnitude: wrap.effect.multiplier, isPercentage: true };
      wrap.duration = { durationType: 'timed', rounds: 1 };
      fixed++;
    }
  }
  if (fixed) mark(impl, 'negative shield multiplier replaced by shield-bonus stat-modifier (executor cannot destroy numeric shields proportionally)');
});

// --- 1040201 爱蜜莉: 蛰伏 outer effect duration was instant while the trigger buff is permanent
patchHero(1040201, skills => {
  const impl = skillOf(skills, '120000051').implementation;
  let fixed = 0;
  for (const wrap of impl.effects) {
    if (wrap.duration && wrap.duration.durationType === 'instant') {
      wrap.duration = { durationType: 'permanent', rounds: 0 };
      fixed++;
    }
  }
  if (fixed) mark(impl, 'outer effect duration instant -> permanent to match trigger effect');
});

// --- 1010201 鱼缸头 / 3040101 伊娃: 鹰眼 lost the hp-above-50 condition
for (const heroId of [1010201, 3040101]) {
  patchHero(heroId, skills => {
    const impl = skillOf(skills, '120000028').implementation;
    impl.triggers[0].conditionKey = 'hp-above-50';
    mark(impl, 'conditionKey hp-above-50 restored from description');
  });
}

// --- cloned metadata: ability/abilityDes tid must match the skill id
const TID_FIX = [
  [1030701, ['313070171', '313070172', '313070173', '313070174', '313070175']],
  [2030301, ['323030171', '323030172', '323030173', '323030174']],
];
for (const [heroId, skillIds] of TID_FIX) {
  patchHero(heroId, skills => {
    for (const id of skillIds) {
      const impl = skillOf(skills, id).implementation;
      if (impl.ability) impl.ability.tid = Number(id);
      if (impl.abilityDes) impl.abilityDes.tid = Number(id);
      mark(impl, 'ability/abilityDes tid aligned to skill id (cloned template metadata)');
    }
  });
}

// --- 3030301 厉火之咒: restore missing 333030174 炽星魔焰 and de-merge its text from 333030173
patchHero(3030301, skills => {
  const crit = skillOf(skills, '333030173').implementation;
  mark(crit, 'description de-merged: 燃烧 clause belongs to 333030174');
  const hero = heroOf(3030301);
  const added = {
    id: '333030174',
    name: '炽星魔焰',
    type: 'Mastery',
    status: 'Executable',
    category: 'description-inferred',
    description: '普攻/绝招后，30%概率给目标额外附加1层【燃烧】，持续2回合',
    implementation: {
      source: 'FightTable.AbilityDes text only (ability row absent from catalog dump)',
      resolvedAbility: false,
      resolvedDescription: true,
      ability: null,
      abilityDes: null,
      catalogTypeMatch: null,
      effectType: 'status',
      targetType: 'single',
      energyCost: 0,
      effects: [
        {
          target: { targetType: 'single' },
          effect: { type: 'status', statusType: 'burn', duration: 2, maxStacks: 0, dispellable: true, sourceSkill: '333030174' },
          duration: { durationType: 'timed', rounds: 2 },
          chance: 0.3,
        },
      ],
      triggers: [
        {
          triggerType: 'on-attack',
          condition: null,
          conditionKey: null,
          cooldown: 0,
          maxTriggers: 0,
          oncePerBattle: false,
          oncePerRound: false,
          effect: {
            target: { targetType: 'single' },
            effect: { type: 'status', statusType: 'burn', duration: 2, maxStacks: 0, dispellable: true, sourceSkill: '333030174' },
            duration: { durationType: 'timed', rounds: 2 },
            chance: 0.3,
          },
          priority: 0,
        },
        {
          triggerType: 'on-skill-use',
          condition: null,
          conditionKey: null,
          cooldown: 0,
          maxTriggers: 0,
          oncePerBattle: false,
          oncePerRound: false,
          effect: {
            target: { targetType: 'single' },
            effect: { type: 'status', statusType: 'burn', duration: 2, maxStacks: 0, dispellable: true, sourceSkill: '333030174' },
            duration: { durationType: 'timed', rounds: 2 },
            chance: 0.3,
          },
          priority: 0,
        },
      ],
      requiresInvestigation: true,
      notes: '30% chance to add 1 burn layer for 2 rounds after normal/skill. Trigger chance cannot be rolled by processTriggers; stack count not tracked. restored by audit-20261105 (row was dropped by the catalog dump).',
    },
  };
  const index = skills.findIndex(s => s.id === '333030173');
  hero._added = { '333030174': added };
  skills.splice(index + 1, 0, added);
}, { '333030173': '进入战斗后，暴击率提升5%和暴击伤害加成提升10%' });

// --- 鼓舞 120000054: description says 普攻/绝招, in-scope heroes only registered on-attack
for (const heroId of [1020601, 1030701, 2020101, 3030401, 4010201, 5040501]) {
  patchHero(heroId, skills => {
    const impl = skillOf(skills, '120000054').implementation;
    if (impl.triggers.some(t => t.triggerType === 'on-skill-use')) return;
    const template = impl.triggers[0];
    impl.triggers.push({
      ...clone(template),
      triggerType: 'on-skill-use',
      effect: clone(template.effect),
    });
    mark(impl, 'on-skill-use trigger added: description says 友方普攻/绝招');
  });
}

// --- merged description text: the catalog dump appended the next skill's text to these rows
function trimMergedDescription(heroId, skillId) {
  const hero = heroOf(heroId);
  const own = hero.skills.find(s => s.id === skillId);
  let text = (own.description || '').trim();
  const others = hero.skills
    .filter(s => s.id !== skillId && (s.description || '').trim().length > 8)
    .map(s => (s.description || '').trim())
    .sort((a, b) => b.length - a.length);
  let trimmed = true;
  while (trimmed) {
    trimmed = false;
    for (const other of others) {
      if (text.endsWith(other) && text.length > other.length) {
        text = text.slice(0, text.length - other.length).trim();
        trimmed = true;
      }
    }
  }
  if (text === (own.description || '').trim()) return null;
  return text;
}

for (const [heroId, skillId] of [[1020201, '312020174'], [1030201, '313020173'], [1040301, '314030174']]) {
  const trimmed = trimMergedDescription(heroId, skillId);
  if (!trimmed) { log.push(heroId + '/' + skillId + ': description already clean'); continue; }
  patchHero(heroId, skills => {
    mark(skillOf(skills, skillId).implementation, 'description trimmed: catalog dump had merged the next skill text into this row');
  }, { [skillId]: trimmed });
}

flush();
console.log(log.join('\n'));
console.log('\npatches written to ' + OUT_DIR);
