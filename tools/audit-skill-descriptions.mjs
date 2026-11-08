#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

// Compare localized AbilityDes text with every executable server effect. This is
// deliberately conservative: named mechanics that the current engine cannot
// express stay evidence gaps, while clear contradictions become errors.
const projectRoot = path.resolve(import.meta.dirname, '..');
const databasePath = path.join(projectRoot, 'personal-server/config/skill-database.json');
const languageIndex = process.argv.indexOf('--language');
const languageArgument = languageIndex >= 0 ? process.argv[languageIndex + 1] : null;
const languageCandidates = [
  languageArgument,
  process.env.FATE_COVENANT_LANGUAGE_TEXT,
  path.join(projectRoot, '.tmp-language-sub/candidate/decoded/language-core.bundle/textassets/2430823284743666700-text_zh_cn.bin'),
  path.join(projectRoot, 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded/language-core.bundle/textassets/2430823284743666700-text_zh_cn.bin'),
].filter(Boolean).map(file => path.resolve(file));
const languagePath = languageCandidates.find(file => fs.existsSync(file));
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0
  ? path.resolve(process.argv[outputIndex + 1])
  : path.join(projectRoot, 'analysis/reports/skill-description-audit.json');

if (!fs.existsSync(databasePath)) throw new Error('Missing skill database: ' + databasePath);
if (languageArgument && !languagePath) throw new Error('Language file not found: ' + languageArgument);

const language = new Map();
if (languagePath) {
  const text = fs.readFileSync(languagePath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r\n|\r|\n/)) {
    const separator = line.indexOf('=');
    if (separator > 0) language.set(line.slice(0, separator), line.slice(separator + 1));
  }
}

const normalizeText = value => String(value ?? '')
  .replace(/<[^>]*>/g, '')
  .replace(/\\n/g, ' ')
  .replace(/[\r\n\u2028\u2029]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
const descriptionFor = skill => {
  const textId = skill.implementation?.abilityDes?.text;
  const localized = textId && language.has(String(textId));
  return {
    text: normalizeText(localized ? language.get(String(textId)) : skill.description),
    storedText: normalizeText(skill.description),
    source: localized ? 'abilityDes.text' : 'skill.description',
  };
};
const nameFor = skill => {
  const nameId = skill.implementation?.abilityDes?.show_name;
  return nameId && language.has(String(nameId))
    ? normalizeText(language.get(String(nameId))) : null;
};
const targetsOf = effect => Array.isArray(effect)
  ? effect.map(item => item?.target?.targetType).filter(Boolean)
  : effect?.target?.targetType ? [effect.target.targetType] : [];
const effectBody = effect => effect?.effect ?? effect ?? {};
const effectsFor = skill => {
  const implementation = skill.implementation ?? {};
  const direct = Array.isArray(implementation.effects) ? implementation.effects : [];
  const triggers = Array.isArray(implementation.triggers)
    ? implementation.triggers.map(trigger => trigger?.effect).filter(Boolean) : [];
  return { direct, triggers, all: [...direct, ...triggers] };
};
const hasEffectType = (effects, type) => effects.some(effect => effectBody(effect)?.type === type);
const effectsOfType = (effects, type) => effects.filter(effect => effectBody(effect)?.type === type);
const fractionEqual = (left, right) => Number.isFinite(left) && Number.isFinite(right)
  && Math.abs(left - right) <= 0.0001;

function firstPercentAfter(text, pattern) {
  const match = text.match(pattern);
  if (!match) return null;
  const value = match[1].match(/\d+(?:\.\d+)?/)?.[0];
  return value === undefined ? null : Number(value) / 100;
}

function issue(hero, skill, description, code, message, evidence = {}) {
  return {
    code,
    severity: 'error',
    heroId: String(hero.id),
    heroName: hero.name,
    skillId: String(skill.id),
    skillName: skill.name,
    skillType: skill.type,
    descriptionSource: description.source,
    description: description.text,
    message,
    evidence,
  };
}

const issues = [];
const gaps = [];
const summary = {
  heroes: database.heroes.length,
  skillReferences: 0,
  uniqueSkillIds: 0,
  categories: Object.create(null),
  types: Object.create(null),
  requiresInvestigation: 0,
  noExecutableEffects: 0,
  localizedDescriptions: 0,
  storedDescriptions: 0,
  ambiguousAbilityDescriptions: 0,
  descriptionSourceMismatches: 0,
  nameSourceMismatches: 0,
  errors: 0,
  evidenceGaps: 0,
};
const uniqueIds = new Set();

// Some extracted AbilityDes shards reuse a template row for several mastery
// slots in one hero. That row can be valid evidence for one slot but cannot
// establish which visible description belongs to each of the others.
const localDescriptionGroups = new Map();
for (const hero of database.heroes) {
  const groups = new Map();
  for (const skill of hero.skills ?? []) {
    const textId = skill.implementation?.abilityDes?.text;
    if (textId === undefined || textId === null) continue;
    const key = String(textId);
    const group = groups.get(key) ?? [];
    group.push(String(skill.id));
    groups.set(key, group);
  }
  localDescriptionGroups.set(String(hero.id), groups);
  summary.ambiguousAbilityDescriptions += [...groups.values()]
    .filter(ids => ids.length > 1)
    .reduce((count, ids) => count + ids.length, 0);
}

function descriptionConflictCode(hero, skill, description) {
  if (!description.storedText || !description.text) return null;
  if (description.source !== 'abilityDes.text') return null;
  const group = localDescriptionGroups.get(String(hero.id))?.get(
    String(skill.implementation.abilityDes.text)
  );
  // Shared template rows are an extraction ambiguity, not proof that the
  // curated catalog description is wrong.
  if (group && group.length > 1) return 'AMBIGUOUS_ABILITY_DESCRIPTION';
  return description.storedText === description.text ? null : 'DESCRIPTION_SOURCE_MISMATCH';
}

const describesDirectDamage = text => {
  if (!text) return false;
  for (const match of text.matchAll(/(?:造成|附加|额外造成)([^。；\n]{0,64}?)(?:真实伤害|法术伤害|魔法伤害|物理伤害|伤害|生命流失)/g)) {
    const prefix = match[1];
    const whole = match[0];
    const suffix = text.slice((match.index ?? 0) + whole.length);
    if (/^(?:加成|提升|提高|增加|降低|减免)/.test(suffix)) continue;
    if (/(?:伤害|攻击)(?:加成|提升|提高|增加|降低|减免|转化|速度|抗性)/.test(prefix)) continue;
    if (/(?:暴击|最终|持续|反击|造成)伤害(?:加成|提升|提高|增加|降低|减免)/.test(whole)) continue;
    if (/(?:暴击|最终|无视防御)/.test(prefix)) continue;
    // "造成伤害的百分之多少" describes a consequence or conversion. A direct
    // hit names a target/percentage/stat before the damage keyword.
    if (!/[\d%目标等于]/.test(prefix) && !/^(?:额外造成)/.test(whole)) continue;
    return true;
  }
  return false;
};

const describesHpRecovery = text => Boolean(text)
  && /(?:治疗|恢复|回复)(?!加成)[^。；\n]{0,32}(?:生命值|生命)(?!上限)/.test(text);

const energyClauses = text => String(text ?? '')
  .replace(/(?:无法|不能|不可)(?:恢复|回复|获得|增加)[^。；,，\n]{0,20}?能量值?/g, '')
  .replace(/(?:能量|能量值)(?:恢复速度|回复速度|恢复率|回复率|降低抗性)/g, '能量属性')
  .split(/[。；,，\n]/);
const describesEnergyGain = text => energyClauses(text)
  .some(clause => /(?:恢复|回复|获得|增加)[^。；,，\n]{0,24}?(?:点)?能量值?(?!属性)/.test(clause));
const describesEnergyLoss = text => energyClauses(text)
  .some(clause => /(?:扣除|降低|减少|失去|移除|清空|夺取)[^。；,，\n]{0,24}?(?:点)?能量值?(?!属性)/.test(clause));

const describesShieldCreation = text => Boolean(text)
  && (/(?:获得|提供|附加|生成|添加|施加)[^。；\n]{0,28}护盾/.test(text)
    || /转化为[^。；\n]{0,16}护盾值?[^。；\n]{0,12}(?:添加|获得)/.test(text));

for (const hero of database.heroes) {
  for (const skill of hero.skills ?? []) {
    summary.skillReferences += 1;
    uniqueIds.add(String(skill.id));
    summary.categories[skill.category ?? 'unknown'] = (summary.categories[skill.category ?? 'unknown'] ?? 0) + 1;
    summary.types[skill.type ?? 'unknown'] = (summary.types[skill.type ?? 'unknown'] ?? 0) + 1;
    if (skill.implementation?.requiresInvestigation) summary.requiresInvestigation += 1;

    const description = descriptionFor(skill);
    const effects = effectsFor(skill);
    if (description.source === 'abilityDes.text') summary.localizedDescriptions += 1;
    else if (description.text) summary.storedDescriptions += 1;
    if (!effects.all.length) summary.noExecutableEffects += 1;

    const descriptionConflict = descriptionConflictCode(hero, skill, description);
    if (descriptionConflict === 'DESCRIPTION_SOURCE_MISMATCH') {
      summary.descriptionSourceMismatches += 1;
      issues.push(issue(hero, skill, description, descriptionConflict,
        'Stored skill description conflicts with the unique AbilityDes row.', {
          storedDescription: description.storedText,
          abilityDesText: description.text,
        }));
    } else if (descriptionConflict === 'AMBIGUOUS_ABILITY_DESCRIPTION') {
      gaps.push({
        heroId: String(hero.id), heroName: hero.name,
        skillId: String(skill.id), skillName: skill.name,
        reason: `AbilityDes text ${skill.implementation.abilityDes.text} is reused by multiple skills in this hero; stored description retained pending extraction repair`,
      });
    }

    const localizedName = nameFor(skill);
    // Without a resolved AbilityDes text, show_name can be a cloned template
    // field and cannot independently prove the visible skill name wrong.
    if (description.source === 'abilityDes.text'
      && localizedName && localizedName !== skill.name) {
      const group = localDescriptionGroups.get(String(hero.id))?.get(
        String(skill.implementation.abilityDes.text)
      );
      if (!group || group.length <= 1) {
        summary.nameSourceMismatches += 1;
        gaps.push({
          heroId: String(hero.id), heroName: hero.name,
          skillId: String(skill.id), skillName: skill.name,
          reason: `AbilityDes.show_name resolves to ${localizedName}, while the localized description matches the stored catalog text; name mapping remains unverified`,
        });
      }
    }

    if (skill.implementation?.catalogTypeMatch === false) {
      issues.push(issue(hero, skill, description, 'TYPE_MISMATCH',
        'Catalog skill type conflicts with AbilityDes.type_des.', {
          catalogType: skill.type,
          abilityDesType: skill.implementation?.abilityDes?.type_des,
        }));
    }

    const saysHealHp = describesHpRecovery(description.text);
    if (saysHealHp && !hasEffectType(effects.all, 'heal')) {
      issues.push(issue(hero, skill, description, 'HEAL_DESCRIPTION_WITHOUT_HEAL',
        'The description grants HP recovery, but no executable effect is heal.', {
          effectTypes: effects.all.map(effect => effectBody(effect)?.type ?? null),
        }));
    }

    // "受到伤害降低" and "造成伤害后" describe conditions, not damage output.
    const saysDamage = describesDirectDamage(description.text);
    if (saysDamage && !hasEffectType(effects.all, 'damage')) {
      issues.push(issue(hero, skill, description, 'DAMAGE_DESCRIPTION_WITHOUT_DAMAGE',
        'The description produces damage, but no executable effect is damage.', {
          effectTypes: effects.all.map(effect => effectBody(effect)?.type ?? null),
        }));
    }

    const createsShield = describesShieldCreation(description.text);
    if (createsShield && !hasEffectType(effects.all, 'shield')) {
      issues.push(issue(hero, skill, description, 'SHIELD_DESCRIPTION_WITHOUT_SHIELD',
        'The description creates a shield, but no executable effect is shield.', {
          effectTypes: effects.all.map(effect => effectBody(effect)?.type ?? null),
        }));
    }

    const restoresEnergy = describesEnergyGain(description.text);
    if (restoresEnergy && !effectsOfType(effects.all, 'energy')
      .some(effect => effectBody(effect)?.energyType === 'gain')) {
      issues.push(issue(hero, skill, description, 'ENERGY_GAIN_DESCRIPTION_WITHOUT_GAIN',
        'The description restores energy, but no executable effect grants energy.', {
          effectTypes: effects.all.map(effect => effectBody(effect)?.type ?? null),
        }));
    }

    const drainsEnergy = describesEnergyLoss(description.text);
    if (drainsEnergy && !effectsOfType(effects.all, 'energy')
      .some(effect => ['loss', 'steal', 'set'].includes(effectBody(effect)?.energyType))
      && !hasEffectType(effects.all, 'clear-resource')) {
      issues.push(issue(hero, skill, description, 'ENERGY_LOSS_DESCRIPTION_WITHOUT_LOSS',
        'The description removes energy, but no executable effect drains or clears energy.', {
          effectTypes: effects.all.map(effect => effectBody(effect)?.type ?? null),
        }));
    }

    if (skill.type === 'Normal' || skill.type === 'Ultimate') {
      if (/(?:我方|友方).{0,10}(?:生命|血量)(?:百分比)?最低/.test(description.text)) {
        const damagingTargets = effects.direct.filter(effect => effectBody(effect)?.type === 'damage').flatMap(targetsOf);
        if (damagingTargets.some(target => target !== 'self' && target !== 'lowest-hp-ally' && !target.includes('ally'))) {
          issues.push(issue(hero, skill, description, 'ALLY_TARGET_SELECTED_AS_ENEMY',
            'An ally-only description has a direct damage effect that targets non-allies.', { damagingTargets }));
        }
      }
      if (/(?:对)?(?:敌方全体|所有敌人|全体敌人)[^。；\n]{0,32}造成/.test(description.text)) {
        const directDamageTargets = effectsOfType(effects.direct, 'damage').flatMap(targetsOf);
        if (directDamageTargets.length && !directDamageTargets.some(target => target === 'all-enemies')) {
          issues.push(issue(hero, skill, description, 'ALL_ENEMY_TARGET_MISMATCH',
            'The description targets all enemies, but no direct damage effect uses all-enemies.', { directDamageTargets }));
        }
      }
      if (/(?:全体友方|全体我方|我方全体|所有友方)[^。；\n]{0,32}(?:恢复|治疗|获得|提升|增加|施加)/.test(description.text)) {
        const beneficial = effects.direct.filter(effect => ['heal', 'shield', 'stat-modifier', 'energy', 'status']
          .includes(effectBody(effect)?.type));
        const beneficialTargets = beneficial.flatMap(targetsOf);
        if (beneficialTargets.length && !beneficialTargets.some(target => target === 'all-allies')) {
          issues.push(issue(hero, skill, description, 'ALL_ALLY_TARGET_MISMATCH',
            'The description targets all allies, but no direct beneficial effect uses all-allies.', { beneficialTargets }));
        }
      }
    }

    const damagePercent = firstPercentAfter(description.text,
      /(?:造成|附加)([^。；\n]{0,60}?%)(?:[^。；\n]{0,30}?)(?:伤害|生命流失)(?!加成|提升|提高|降低|减免)/);
    const damageMultipliers = effectsOfType(effects.all, 'damage')
      .map(effect => Number(effectBody(effect)?.multiplier)).filter(Number.isFinite);
    if (damagePercent !== null && damageMultipliers.length
      && !damageMultipliers.some(value => fractionEqual(value, damagePercent))) {
      issues.push(issue(hero, skill, description, 'DAMAGE_MULTIPLIER_MISMATCH',
        'The primary damage percentage in the description is not represented by any damage multiplier.', {
          descriptionPercent: damagePercent, damageMultipliers,
        }));
    }

    const healPercent = firstPercentAfter(description.text,
      /(?:恢复|回复|治疗)([^。；\n]{0,50}?%)(?:[^。；\n]{0,24}?)(?:生命值|生命)/);
    const healMultipliers = effectsOfType(effects.all, 'heal')
      .map(effect => Number(effectBody(effect)?.multiplier)).filter(Number.isFinite);
    if (healPercent !== null && healMultipliers.length
      && !healMultipliers.some(value => fractionEqual(value, healPercent))) {
      issues.push(issue(hero, skill, description, 'HEAL_MULTIPLIER_MISMATCH',
        'The primary healing percentage in the description is not represented by any heal multiplier.', {
          descriptionPercent: healPercent, healMultipliers,
        }));
    }

    const energyPointMatch = description.text.match(/(?:恢复|回复|获得|增加).{0,30}?(\d+)\s*点能量/);
    const describedEnergy = energyPointMatch ? Number(energyPointMatch[1]) : null;
    const energyMagnitudes = effectsOfType(effects.all, 'energy')
      .filter(effect => effectBody(effect)?.energyType === 'gain')
      .map(effect => Number(effectBody(effect)?.magnitude)).filter(Number.isFinite);
    if (describedEnergy !== null && energyMagnitudes.length && !energyMagnitudes.includes(describedEnergy)) {
      issues.push(issue(hero, skill, description, 'ENERGY_GAIN_MAGNITUDE_MISMATCH',
        'The described energy grant is not represented by any gain magnitude.', {
          describedEnergy, energyMagnitudes,
        }));
    }

    const minHpCap = firstPercentAfter(description.text,
      /(?:不超过|最多为|至多).{0,30}?(?:自身|自身最大)?生命值的?(\d+(?:\.\d+)?%)/);
    const configuredCaps = effectsOfType(effects.all, 'heal')
      .map(effect => Number(effectBody(effect)?.maxHealPercentActorMaxHp)).filter(Number.isFinite);
    if (minHpCap !== null && configuredCaps.length && !configuredCaps.some(value => fractionEqual(value, minHpCap))) {
      issues.push(issue(hero, skill, description, 'HEAL_CAP_MISMATCH',
        'The described heal cap is not represented by an executable heal cap.', { minHpCap, configuredCaps }));
    }

    if (skill.implementation?.requiresInvestigation) {
      gaps.push({
        heroId: String(hero.id), heroName: hero.name,
        skillId: String(skill.id), skillName: skill.name,
        reason: skill.implementation.notes ?? 'requires investigation',
      });
    }
  }
}

summary.uniqueSkillIds = uniqueIds.size;
summary.errors = issues.length;
summary.evidenceGaps = gaps.length;
summary.issueCodes = Object.fromEntries([...new Set(issues.map(item => item.code))].sort().map(code =>
  [code, issues.filter(item => item.code === code).length]));

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    database: path.relative(projectRoot, databasePath),
    language: languagePath ? path.relative(projectRoot, languagePath) : null,
  },
  summary,
  issues,
  evidenceGaps: gaps,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ output: outputPath, summary }, null, 2));

if (process.argv.includes('--fail-on-errors') && issues.length) process.exitCode = 1;
