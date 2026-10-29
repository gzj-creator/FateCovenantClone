import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFiles, extractGroups, getTableName, parseLuaJit } from './extract-battle-tables.mjs';

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolRoot, '..');
const mainProjectRoot = path.resolve(projectRoot, '../..');
const decodedRelative = 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded';
const sourceRoot = fs.existsSync(path.join(projectRoot, decodedRelative)) ? projectRoot : mainProjectRoot;
const languageRelative = 'language-core.bundle/textassets/2430823284743666700-text_zh_cn.bin';
const configuredLanguage = process.env.FATE_COVENANT_LANGUAGE_TEXT
  ? path.resolve(process.env.FATE_COVENANT_LANGUAGE_TEXT) : '';
const languageCandidates = configuredLanguage ? [configuredLanguage] : [
  path.join(projectRoot, '.tmp-language-sub/candidate/decoded', languageRelative),
  path.join(mainProjectRoot, '.tmp-language-sub/candidate/decoded', languageRelative),
  path.join(projectRoot, 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded', languageRelative),
  path.join(mainProjectRoot, 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded', languageRelative)
];
const defaults = {
  source: path.join(sourceRoot, 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded'),
  language: languageCandidates.find(candidate => fs.existsSync(candidate)) ?? languageCandidates[0],
  output: path.join(projectRoot, 'unity/FateCovenantClone/Assets/Resources/CharacterSkillCatalog.json')
};

const tableTypes = [
  'HeroTable.Hero', 'HeroTable.Npc', 'HeroTable.Npc_Ability', 'HeroTable.Ability',
  'HeroTable.Profession', 'HeroTable.BaseAttrNew', 'HeroTable.Diff', 'HeroTable.Rare',
  'HeroTable.UpStageTalent', 'HeroMutantTable.HeroMutant', 'FightTable.Ability', 'FightTable.AbilityDes',
  'FightTable.Buff', 'FightTable.Effect', 'FightTable.TargetRule', 'FightTable.StatusEffect'
];
const desiredTypes = new Set(tableTypes);
const parsePrefixes = [
  'HeroTable.Hero', 'HeroTable.Npc', 'HeroTable.Ability', 'HeroTable.Profession',
  'HeroTable.Npc_Ability',
  'HeroTable.BaseAttrNew', 'HeroTable.Diff', 'HeroTable.Rare', 'HeroTable.UpStageTalent',
  'FightTable.Ability', 'FightTable.AbilityDes', 'FightTable.Buff', 'FightTable.Effect', 'FightTable.TargetRule',
  'FightTable.StatusEffect'
];

function parseArguments(argv) {
  const options = { ...defaults, reportOnly: false, samples: false };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--report-only') { options.reportOnly = true; continue; }
    if (argument === '--samples') { options.samples = true; continue; }
    if (argument === '--source' || argument === '--language' || argument === '--output') {
      const value = argv[++index];
      if (!value) throw new Error(`Missing value for ${argument}`);
      options[argument.slice(2)] = path.resolve(value);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function loadTables(sourceRoot) {
  const rowsByType = new Map();
  const filesByType = new Map();
  const files = collectFiles(sourceRoot).filter(file => {
    const name = getTableName(file);
    const family = name.replace(/\.\d+$/, '').split('.')[0];
    const base = name.replace(/\.\d+$/, '');
    if (family !== 'HeroTable' && family !== 'FightTable' && base !== 'HeroMutantTable') return false;
    if (base === 'HeroMutantTable') return true;
    return base === family || parsePrefixes.some(prefix => base === prefix || base.startsWith(prefix + '.'));
  });
  for (const file of files) {
    const name = getTableName(file);
    const fileBase = name.replace(/\.\d+$/, '');
    const family = fileBase.split('.')[0];
    for (const group of extractGroups(parseLuaJit(fs.readFileSync(file)))) {
      const type = group.rootName ? `${family}.${group.rootName}` : fileBase;
      if (!desiredTypes.has(type)) continue;
      if (!rowsByType.has(type)) { rowsByType.set(type, []); filesByType.set(type, new Set()); }
      rowsByType.get(type).push(...group.rows);
      filesByType.get(type).add(name);
    }
  }
  for (const type of tableTypes) {
    if (!rowsByType.has(type)) throw new Error(`Required table not found: ${type}`);
  }
  return { rowsByType, filesByType };
}

function indexByTid(rows) {
  const result = new Map();
  for (const row of rows) {
    if (row.tid == null) continue;
    const id = String(row.tid);
    if (!result.has(id)) result.set(id, row);
  }
  return result;
}

function parseLanguage(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const result = new Map();
  for (const line of text.split(/\r\n|\r|\n/)) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    result.set(line.slice(0, separator), line.slice(separator + 1));
  }
  return result;
}

function localized(language, id) {
  if (id == null || id === 0 || id === '') return '';
  const key = String(id);
  return language.get(key) ?? key;
}

function skillType(typeCode, source) {
  if (typeCode === 1) return 'Normal';
  if (typeCode === 2) return 'Passive';
  if (typeCode === 3) return 'Ultimate';
  if (typeCode === 4) return 'Transcendent';
  if (typeCode === 5) return 'Demigod';
  if (typeCode === 6) return 'Envoy';
  if (typeCode === 7) return 'Relic';
  if (typeCode === 8) return 'Attribute';
  if (typeCode === 9) return 'Mastery';
  if (typeCode === 10) return 'CrystalCore';
  if (typeCode === 11) return 'Exclusive';
  if (typeCode === 12) return 'UltimateTechnique';
  if (typeCode === 13) return 'MainBattle';
  if (typeCode === 14) return 'Support';
  if (typeCode === 15 || typeCode === 16) return 'Transcendent';
  if (source.includes('soul')) return 'Ultimate';
  if (source.includes('mastery')) return 'Mastery';
  return 'Passive';
}

function isActiveCategory(category) {
  return category === 'Normal' || category === 'Ultimate' || category === 'Transcendent'
    || category === 'Demigod' || category === 'Envoy' || category === 'UltimateTechnique'
    || category === 'MainBattle';
}

const WORDS = {
  heal: '\u6cbb\u7597', recover: '\u6062\u590d', reply: '\u56de\u590d', shield: '\u62a4\u76fe',
  allAllies: '\u5168\u4f53\u53cb\u65b9', ourAllies: '\u6211\u65b9\u5168\u4f53',
  allEnemies: '\u5168\u4f53\u654c\u4eba', enemyAll: '\u654c\u65b9\u5168\u4f53', allEnemy: '\u6240\u6709\u654c\u4eba',
  lowestHp: '\u751f\u547d\u6700\u4f4e', self: '\u81ea\u8eab', random: '\u968f\u673a',
  front: '\u524d\u6392', back: '\u540e\u6392', highestAttack: '\u653b\u51fb\u6700\u9ad8',
  stun: '\u7729\u6655', silence: '\u6c89\u9ed8', taunt: '\u5632\u8bbd',
  bleed: '\u6d41\u8840', burn: '\u707c\u70e7', poison: '\u4e2d\u6bd2',
  attack: '\u653b\u51fb', defense: '\u9632\u5fa1', speed: '\u901f\u5ea6',
  increase: '\u63d0\u9ad8', decrease: '\u964d\u4f4e', reduce: '\u51cf\u5c11',
  cleanse: '\u51c0\u5316', dispel: '\u9a71\u6563', energy: '\u80fd\u91cf', rage: '\u6012\u6c14',
  battleStart: '\u6218\u6597\u5f00\u59cb', roundStart: '\u56de\u5408\u5f00\u59cb',
  actionEnd: '\u884c\u52a8\u7ed3\u675f', damageTaken: '\u53d7\u5230\u4f24\u5bb3',
  death: '\u9635\u4ea1', normalCast: '\u666e\u901a\u653b\u51fb', ultimateCast: '\u7ec8\u7ed3\u6280',
  critical: '\u66b4\u51fb', criticalDamage: '\u66b4\u51fb\u4f24\u5bb3', hitRate: '\u547d\u4e2d\u7387',
  evade: '\u95ea\u907f', critResist: '\u6297\u66b4', reflect: '\u53cd\u5f39',
  finalDamageUp: '\u6700\u7ec8\u4f24\u5bb3\u52a0\u6210', finalDamageDown: '\u6700\u7ec8\u4f24\u5bb3\u51cf\u514d',
  damageUp: '\u4f24\u5bb3\u63d0\u5347', damageDown: '\u4f24\u5bb3\u964d\u4f4e', damageBonus: '\u4f24\u5bb3\u52a0\u6210',
  immunity: '\u514d\u4f24', turn: '\u56de\u5408', duration: '\u6301\u7eed',
  first: '\u9996\u6b21', enterBattle: '\u8fdb\u5165\u6218\u6597\u540e',
  defeated: '\u88ab\u51fb\u9000', receive: '\u53d7\u5230', kill: '\u51fb\u6740',
  healingReceived: '\u88ab\u6cbb\u6108\u7387', lifeSteal: '\u751f\u547d\u5077\u53d6', lifeStealText: '\u8f6c\u5316\u4e3a\u81ea\u8eab\u751f\u547d',
  defenseIgnore: '\u65e0\u89c6', initialEnergy: '\u521d\u59cb\u80fd\u91cf',
  maxHp: '\u6700\u5927\u751f\u547d', controlAccuracy: '\u5f02\u5e38\u72b6\u6001\u547d\u4e2d',
  controlResistance: '\u5f02\u5e38\u72b6\u6001\u6297\u6027', damageTakenUp: '\u53d7\u5230\u4f24\u5bb3\u589e\u52a0',
  critDamageDown: '\u66b4\u4f24\u51cf\u514d', finalReduction: '\u6700\u7ec8\u51cf\u4f24'
};

function includesAny(text, values) {
  return values.some(value => text.includes(value));
}

function inferTarget(description, activeType, wantsBeneficial) {
  if (includesAny(description, [WORDS.allAllies, WORDS.ourAllies])) return 'AllAllies';
  if (includesAny(description, [WORDS.allEnemies, WORDS.enemyAll, WORDS.allEnemy])) return 'AllEnemies';
  if (description.includes(WORDS.front)) return 'AllFrontEnemies';
  if (description.includes(WORDS.back)) return 'AllBackEnemies';
  if (description.includes(WORDS.highestAttack)) return 'HighestAttackEnemy';
  if (description.includes(WORDS.random)) return 'RandomEnemy';
  if (description.includes(WORDS.self)) return 'Self';
  if (description.includes(WORDS.lowestHp)) return wantsBeneficial ? 'LowestHpAlly' : 'LowestHpEnemy';
  return wantsBeneficial ? 'LowestHpAlly' : 'LowestHpEnemy';
}

function inferBuffTarget(description) {
  if (includesAny(description, [WORDS.allAllies, WORDS.ourAllies])) return 'AllAllies';
  return 'Self';
}

function statusAction(type, target, duration = 1, magnitude = 0, chance = 1) {
  return { type, target, duration, magnitude, stacks: 1, chance };
}

function cleanDescription(description) {
  return description.replace(/<[^>]*>/g, '');
}

function percentages(description) {
  return [...description.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map(match => Number(match[1]) / 100);
}

function firstPercentage(description, fallback = 0.1) {
  return percentages(description)[0] ?? fallback;
}

function firstFlatNumber(description) {
  const withoutPercentages = description.replace(/\d+(?:\.\d+)?\s*%/g, '');
  const match = withoutPercentages.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function durationTurns(description) {
  const match = description.match(/(?:持续)?(\d+)\s*回合/);
  return match ? Math.max(1, Number(match[1])) : 2;
}

function effectChance(description) {
  const match = description.match(/(\d+(?:\.\d+)?)\s*%\s*\u6982\u7387/)
    ?? description.match(/\u6982\u7387[^0-9]{0,12}(\d+(?:\.\d+)?)\s*%/);
  return match ? Math.min(1, Math.max(0, Number(match[1]) / 100)) : 1;
}

function inferActions(description, category, preferredTarget) {
  if (!description) return [];
  description = cleanDescription(description);
  const active = isActiveCategory(category);
  const actions = [];
  const beneficialDamageTarget = preferredTarget ?? inferTarget(description, active, false);
  const buffTarget = inferBuffTarget(description);
  const healing = includesAny(description, [WORDS.heal, WORDS.recover, WORDS.reply]);
  const harmful = includesAny(description, ['\u9020\u6210', '\u4f24\u5bb3', '\u653b\u51fb\u654c\u4eba']);
  const chance = effectChance(description);
  if (active && (harmful || !healing)) {
    const target = beneficialDamageTarget;
    actions.push({ type: harmful && includesAny(description, ['\u771f\u5b9e\u4f24\u5bb3']) ? 'TrueDamage' : 'Damage', target, power: 1.0 });
  }
  if (healing) actions.push({ type: 'Heal', target: inferTarget(description, active, true), power: 0.8, chance });
  if (description.includes(WORDS.shield)) actions.push({ type: 'Shield', target: inferTarget(description, active, true), power: 0.8, chance });
  if (description.includes(WORDS.stun)) actions.push(statusAction('ApplyStatus', beneficialDamageTarget, durationTurns(description), 1, chance));
  if (description.includes(WORDS.silence)) actions.push(statusAction('ApplyStatus', beneficialDamageTarget, durationTurns(description), 1, chance));
  if (description.includes(WORDS.maxHp) && includesAny(description, [WORDS.increase, '\u63d0\u5347', '\u589e\u52a0'])) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.05), chance));
  }
  if (description.includes(WORDS.controlAccuracy)) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1), chance));
  }
  if (description.includes(WORDS.controlResistance)) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1), chance));
  }
  if (description.includes(WORDS.attack) && includesAny(description, [WORDS.increase, '\u63d0\u5347', '\u589e\u52a0'])) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.15), chance));
  }
  if (description.includes(WORDS.attack) && includesAny(description, [WORDS.decrease, WORDS.reduce])) {
    actions.push(statusAction('ApplyStatus', beneficialDamageTarget, durationTurns(description), firstPercentage(description, 0.15), chance));
  }
  if (description.includes(WORDS.defense) && includesAny(description, [WORDS.increase, '\u63d0\u5347', '\u589e\u52a0'])) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.15), chance));
  }
  if (description.includes(WORDS.defense) && includesAny(description, [WORDS.decrease, WORDS.reduce])) {
    actions.push(statusAction('ApplyStatus', beneficialDamageTarget, durationTurns(description), firstPercentage(description, 0.15), chance));
  }
  if (includesAny(description, [WORDS.bleed, WORDS.burn, WORDS.poison])) {
    actions.push(statusAction('ApplyStatus', beneficialDamageTarget, durationTurns(description), 0.2, chance));
  }
  if (description.includes(WORDS.cleanse)) actions.push({ type: 'Cleanse', target: inferTarget(description, active, true) });
  if (description.includes(WORDS.dispel)) actions.push({ type: 'Dispel', target: inferTarget(description, active, false) });
  if (description.includes(WORDS.energy) && includesAny(description, [WORDS.recover, WORDS.reply, WORDS.increase, '\u589e\u52a0', '\u63d0\u5347'])) {
    const target = includesAny(description, [WORDS.allAllies, WORDS.ourAllies])
      ? 'AllAllies' : description.includes('\u53cb\u65b9') ? 'LowestHpAlly' : 'Self';
    actions.push({ type: 'RestoreRage', target, amount: Math.max(1, Math.round(firstFlatNumber(description) / 10)), chance });
  }
  if (description.includes(WORDS.energy) && includesAny(description, [WORDS.decrease, WORDS.reduce, '\u964d\u4f4e'])) {
    actions.push({ type: 'ReduceRage', target: beneficialDamageTarget, amount: Math.max(1, Math.round(firstFlatNumber(description) / 10)), chance });
  }
  if (description.includes(WORDS.finalDamageDown) || description.includes(WORDS.immunity) || description.includes(WORDS.damageDown)) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  }
  if (description.includes(WORDS.finalDamageUp) || (description.includes(WORDS.damageUp) && !description.includes(WORDS.damageDown))) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  }
  if (description.includes(WORDS.criticalDamage)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.15)));
  if (description.includes(WORDS.critical) && !description.includes(WORDS.criticalDamage)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.critResist)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.hitRate)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.evade)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.reflect)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.healingReceived)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.lifeSteal)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.defenseIgnore) && description.includes(WORDS.defense)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.lifeStealText)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if (description.includes(WORDS.damageBonus)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1)));
  if ((description.includes(WORDS.finalReduction) && includesAny(description, [WORDS.increase, '\u63d0\u5347', '\u589e\u52a0']))) {
    actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1), chance));
  }
  if (description.includes(WORDS.damageTakenUp)
    || (description.includes(WORDS.finalReduction) && includesAny(description, [WORDS.decrease, WORDS.reduce, '\u964d\u4f4e']))) {
    actions.push(statusAction('ApplyStatus', beneficialDamageTarget, durationTurns(description), firstPercentage(description, 0.1), chance));
  }
  if (description.includes(WORDS.critDamageDown)) actions.push(statusAction('ApplyStatus', buffTarget, durationTurns(description), firstPercentage(description, 0.1), chance));
  return actions;
}

function inferTriggers(description, category) {
  if (isActiveCategory(category)) return null;
  description = cleanDescription(description);
  const triggers = [];
  if (description.includes(WORDS.battleStart) || description.includes(WORDS.enterBattle)
    || description.includes(WORDS.initialEnergy) || description.includes('\u6218\u6597\u524d')) triggers.push('BattleStarted');
  if (description.includes(WORDS.roundStart)) triggers.push('RoundStarted');
  if (description.includes(WORDS.actionEnd)) triggers.push('ActionEnded');
  const reaction = description.includes(WORDS.damageTaken) || description.includes(WORDS.receive);
  if (reaction) triggers.push('DamageTaken');
  if (description.includes(WORDS.death) || description.includes(WORDS.defeated) || description.includes(WORDS.kill)) triggers.push('UnitDied');
  if (!reaction && (description.includes(WORDS.ultimateCast) || description.includes('\u80fd\u91cf\u6280\u80fd'))) triggers.push('UltimateCast');
  if (!reaction && (description.includes(WORDS.normalCast) || description.includes('\u666e\u653b'))) triggers.push('NormalSkillCast');
  if (triggers.length === 0) triggers.push('TurnStarted');
  return [...new Set(triggers)];
}

function inferStatusKind(description, target) {
  description = cleanDescription(description);
  if (description.includes(WORDS.stun)) return 'Stun';
  if (description.includes(WORDS.silence)) return 'Silence';
  if (description.includes(WORDS.bleed) || description.includes(WORDS.burn) || description.includes(WORDS.poison)) return 'DamageOverTime';
  if (description.includes(WORDS.finalDamageDown) || description.includes(WORDS.immunity) || description.includes(WORDS.damageDown)) return 'DamageTakenDown';
  if (description.includes(WORDS.finalReduction) && includesAny(description, [WORDS.increase, '\u63d0\u5347', '\u589e\u52a0'])) return 'DamageTakenDown';
  if (description.includes(WORDS.damageTakenUp)
    || (description.includes(WORDS.finalReduction) && includesAny(description, [WORDS.decrease, WORDS.reduce, '\u964d\u4f4e']))) return 'DamageTakenUp';
  if (description.includes(WORDS.maxHp)) return 'MaxHpUp';
  if (description.includes(WORDS.controlAccuracy)) return 'ControlAccuracyUp';
  if (description.includes(WORDS.controlResistance)) return 'ControlResistanceUp';
  if (description.includes(WORDS.finalDamageUp) || description.includes(WORDS.damageUp) || description.includes(WORDS.damageBonus)) return 'DamageDealtUp';
  if (description.includes(WORDS.criticalDamage)) return 'CritDamageUp';
  if (description.includes(WORDS.critDamageDown)) return 'CritDamageDown';
  if (description.includes(WORDS.critical)) return 'CritRateUp';
  if (description.includes(WORDS.critResist)) return 'CritResistanceUp';
  if (description.includes(WORDS.hitRate)) return 'AccuracyUp';
  if (description.includes(WORDS.evade)) return 'EvasionUp';
  if (description.includes(WORDS.reflect)) return 'ReflectUp';
  if (description.includes(WORDS.healingReceived)) return 'HealingReceivedUp';
  if (description.includes(WORDS.lifeSteal) || description.includes(WORDS.lifeStealText)) return 'LifeStealUp';
  if (description.includes(WORDS.defenseIgnore)) return 'DefenseIgnoreUp';
  if (description.includes(WORDS.attack)) return target.includes('Ally') || target === 'Self' ? 'AttackUp' : 'AttackDown';
  if (description.includes(WORDS.defense)) return target.includes('Ally') || target === 'Self' ? 'DefenseUp' : 'DefenseDown';
  return 'Custom';
}

function buildSkill(ref, maps, language) {
  const raw = maps.ability.get(ref.id) ?? null;
  const detail = maps.detail.get(ref.id) ?? null;
  const description = localized(language, detail?.text ?? detail?.detail_text ?? ref.descriptionId);
  const typeCode = detail?.type_des ?? raw?.type ?? (ref.source.some(value => value.includes('soul')) ? 3 : 2);
  const category = skillType(typeCode, ref.source.join(','));
  const name = localized(language, detail?.show_name ?? ref.nameId) || `Skill ${ref.id}`;
  const active = isActiveCategory(category);
  const actions = inferActions(description, category, ref.preferredTarget);
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    if (action.type === 'ApplyStatus') action.status = inferStatusKind(description, action.target);
  }
  const triggerNames = inferTriggers(description, category) ?? [];
  if (triggerNames.includes('BattleStarted') && !/(\d+)\s*回合/.test(description)) {
    for (let index = 0; index < actions.length; index++) {
      if (actions[index].type === 'ApplyStatus') actions[index].duration = 0;
    }
  }
  const triggers = triggerNames.map(trigger => ({ trigger, once: description.includes(WORDS.first), actions }));
  if (active && actions.length === 0) {
    actions.push({ type: 'Damage', target: 'LowestHpEnemy', power: 1 });
  }
  const resolved = Boolean(raw);
  const implementedActionCount = active ? actions.length : triggers.reduce((sum, trigger) => sum + trigger.actions.length, 0);
  const implementationStatus = !resolved ? 'Unresolved'
    : implementedActionCount === 0 ? 'MetadataOnly'
      : description ? 'DescriptionHeuristic' : 'MetadataFallback';
  return {
    id: String(ref.id),
    displayName: name,
    description,
    icon: detail?.skill_icon ?? '',
    typeCode,
    category,
    active,
    implemented: implementedActionCount > 0,
    hasCutIn: category === 'Ultimate' || category === 'UltimateTechnique',
    energyCost: category === 'Ultimate' ? 100 : 0,
    rawEffectType: raw?.effect_type ?? null,
    rawDamageType: raw?.dmg_type ?? null,
    source: [...new Set(ref.source)],
    implementationStatus,
    actions: active ? actions : [],
    triggers
  };
}

function fallbackNormal(profession, role, language) {
  const definitions = {
    1: { name: 'Warrior Basic Attack', power: 1.0, target: 'LowestHpEnemy' },
    2: { name: 'Assassin Basic Attack', power: 1.1, target: 'LowestHpEnemy' },
    3: { name: 'Ranger Basic Attack', power: 0.95, target: 'RandomEnemy' },
    4: { name: 'Knight Basic Attack', power: 0.85, target: 'LowestHpEnemy' }
  };
  const definition = definitions[profession] ?? definitions[1];
  const suffix = localized(language, role.nameId) || role.name;
  return {
    id: `normal-profession-${profession}`,
    displayName: `${definition.name} (${suffix})`,
    description: 'Project-defined fallback basic attack. The catalog client has no HeroTable.Ability.ability value for this hero.',
    icon: '', typeCode: 1, category: 'Normal', active: true, implemented: true, hasCutIn: false,
    energyCost: 0, rawEffectType: null, rawDamageType: 1,
    source: ['project-fallback'], implementationStatus: 'ProjectFallback',
    actions: [{ type: 'Damage', target: definition.target, power: definition.power }], triggers: []
  };
}

function addReference(map, id, source, preferredTarget = null) {
  if (id == null || id === 0 || id === '0') return;
  const key = String(id);
  if (!map.has(key)) map.set(key, { id: key, source: [], preferredTarget, nameId: null, descriptionId: null });
  const record = map.get(key);
  record.source.push(source);
  if (preferredTarget) record.preferredTarget = preferredTarget;
}

function buildCharacter(hero, maps, language) {
  const npc = maps.npcByHero.get(String(hero.tid)) ?? null;
  const npcAbility = npc ? maps.npcAbility.get(String(npc.tid)) : null;
  const heroAbility = maps.heroAbility.get(String(hero.tid)) ?? null;
  const profession = maps.profession.get(String(hero.profession)) ?? null;
  const references = new Map();
  addReference(references, heroAbility?.ability, 'hero.ability');
  addReference(references, heroAbility?.soul_ability, 'hero.soul');
  addReference(references, heroAbility?.hide_ability, 'hero.hide');
  addReference(references, npcAbility?.ability, 'npc.ability');
  addReference(references, npcAbility?.soul_ab, 'npc.soul');
  addReference(references, npcAbility?.profession_ab, 'npc.professionPassive');
  if (heroAbility?.mastery_ability) {
    for (let masteryBreak = 1; masteryBreak <= 5; masteryBreak++) {
      addReference(
        references,
        Number(heroAbility.mastery_ability) + masteryBreak - 1,
        `hero.mastery.break${masteryBreak}`);
    }
  }
  for (const row of maps.mutantByHero.get(String(hero.tid)) ?? []) {
    addReference(references, row.extra_skill, 'hero.mutant.extra');
  }
  for (const row of maps.upstageByHero.get(String(hero.tid)) ?? []) {
    addReference(references, row.skill, 'upstage.skill');
    addReference(references, row.potential_skill, 'upstage.potential');
  }
  for (const row of maps.diffByHero.get(String(hero.tid)) ?? []) addReference(references, row.skill, 'hero.diff');
  for (const row of maps.rareByHero.get(String(hero.tid)) ?? []) addReference(references, row.skill, 'hero.rare');

  const roleName = profession?.show_name_pinyin || 'UNKNOWN';
  const skills = [fallbackNormal(hero.profession, { name: roleName, nameId: profession?.show_name }, language)];
  const sortedRefs = [...references.values()].sort((left, right) => {
    const priority = value => value.source.some(item => item.includes('soul')) ? 0
      : value.source.some(item => item.includes('mastery')) ? 1
        : value.source.some(item => item.includes('profession')) ? 2 : 3;
    return priority(left) - priority(right) || Number(left.id) - Number(right.id);
  });
  const seen = new Set(['normal-profession-' + hero.profession]);
  for (const reference of sortedRefs) {
    if (seen.has(reference.id)) continue;
    seen.add(reference.id);
    skills.push(buildSkill(reference, maps, language));
  }
  const ultimateIndex = skills.findIndex(skill => skill.category === 'Ultimate' || skill.category === 'UltimateTechnique');
  const ultimateId = ultimateIndex >= 0 ? skills[ultimateIndex].id : null;
  const normalId = skills.find(skill => skill.category === 'Normal')?.id ?? skills[0].id;
  const base = maps.baseAttr.get(String(Number(hero.tid) * 100 + 50))
    ?? maps.baseAttr.get(String(Number(hero.tid) * 100 + 60)) ?? {};
  return {
    id: String(hero.tid),
    name: localized(language, hero.nick_name) || localized(language, hero.title_name) || String(hero.tid),
    roleId: hero.profession,
    role: titleCase(roleName),
    quality: hero.quality,
    camp: hero.camp,
    catalogVisible: hero.not_in_guide === false,
    npcId: npc ? String(npc.tid) : null,
    stats: {
      maxHp: base.hp ?? 1000,
      attack: base.attack ?? 100,
      defense: base.physical_def ?? 50,
      magicDefense: base.magic_def ?? 50,
      speed: 90 + Number(hero.profession) * 5 + Math.max(0, Number(hero.quality) - 30) / 10,
      critBasisPoints: base.crit ?? 0,
      critDamageBasisPoints: base.crit_harm ?? 15000,
      speedSource: 'project-fallback'
    },
    normalSkillId: normalId,
    ultimateSkillId: ultimateId,
    skills
  };
}

function titleCase(value) {
  const lower = String(value).toLowerCase();
  return lower.length ? lower[0].toUpperCase() + lower.slice(1) : 'Unknown';
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = String(row[key]);
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
}

function validateCatalog(catalog, sourceGroups) {
  const errors = [];
  const visible = catalog.characters.filter(character => character.catalogVisible);
  if (visible.length !== 76) errors.push(`Expected 76 catalog heroes, found ${visible.length}`);
  if (catalog.characters.length !== 337) errors.push(`Expected 337 source heroes, found ${catalog.characters.length}`);
  const skillIds = new Set();
  let referenceCount = 0;
  let descriptionCount = 0;
  let activeCount = 0;
  let triggerCount = 0;
  let battleLongStatusCount = 0;
  const statuses = new Map();
  for (const character of visible) {
    if (!character.name || character.name === character.id) errors.push(`Hero ${character.id} has no localized name`);
    if (!character.stats || character.stats.maxHp <= 0 || character.stats.attack < 0) errors.push(`Hero ${character.id} has invalid stats`);
    if (!character.skills.some(skill => skill.category === 'Normal')) errors.push(`Hero ${character.id} has no normal skill`);
    for (const skill of character.skills) {
      skillIds.add(skill.id);
      referenceCount++;
      if (skill.description) descriptionCount++;
      if (skill.active) activeCount++;
      if (skill.triggers.length) triggerCount++;
      for (const action of skill.actions.concat(...skill.triggers.map(trigger => trigger.actions))) {
        if (action.type !== 'ApplyStatus') continue;
        if (action.status === 'Custom') errors.push(`Hero ${character.id} skill ${skill.id} has an executable Custom status`);
        if (action.duration === 0) battleLongStatusCount++;
      }
      statuses.set(skill.implementationStatus, (statuses.get(skill.implementationStatus) ?? 0) + 1);
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    catalogHeroes: visible.length,
    sourceHeroes: catalog.characters.length,
    skillReferences: referenceCount,
    uniqueSkills: skillIds.size,
    localizedSkillDescriptions: descriptionCount,
    activeSkills: activeCount,
    triggeredSkills: triggerCount,
    battleLongStatusReferences: battleLongStatusCount,
    catalogHeroesWithoutUltimate: visible.filter(character => !character.ultimateSkillId).map(character => character.id),
    implementationStatuses: Object.fromEntries([...statuses.entries()].sort()), sourceTables: sourceGroups
  };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!fs.existsSync(options.source)) throw new Error(`Decoded Lua root not found: ${options.source}`);
  if (!fs.existsSync(options.language)) throw new Error(`Language text not found: ${options.language}`);
  const { rowsByType, filesByType } = loadTables(options.source);
  const rows = type => rowsByType.get(type);
  const language = parseLanguage(options.language);
  const maps = {
    ability: indexByTid(rows('FightTable.Ability')),
    detail: indexByTid(rows('FightTable.AbilityDes')),
    npcByHero: new Map(rows('HeroTable.Npc').map(row => [String(row.relation_hero), row])),
    npcAbility: indexByTid(rows('HeroTable.Npc_Ability')),
    heroAbility: indexByTid(rows('HeroTable.Ability')),
    profession: indexByTid(rows('HeroTable.Profession')),
    baseAttr: indexByTid(rows('HeroTable.BaseAttrNew')),
    upstageByHero: groupBy(rows('HeroTable.UpStageTalent').map(row => ({ ...row, hero: String(row.tid).slice(0, -2) })), 'hero'),
    diffByHero: groupBy(rows('HeroTable.Diff'), 'tid'),
    rareByHero: groupBy(rows('HeroTable.Rare'), 'tid'),
    mutantByHero: groupBy(rows('HeroMutantTable.HeroMutant'), 'belong_hero')
  };
  maps.diffByHero = groupBy(rows('HeroTable.Diff'), 'tid');
  const characters = rows('HeroTable.Hero')
    .slice()
    .sort((left, right) => Number(left.not_in_guide) - Number(right.not_in_guide) || Number(left.tid) - Number(right.tid))
    .map(hero => buildCharacter(hero, maps, language));
  const sourceTables = Object.fromEntries(tableTypes.map(type => [type, {
    rows: rows(type).length,
    uniqueTids: new Set(rows(type).map(row => String(row.tid))).size,
    files: filesByType.get(type).size
  }]));
  const catalog = {
    schemaVersion: 1,
    rulesVersion: 'catalog-data-v1',
    source: {
      decodedLuaRoot: 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded',
      languageFile: 'language-core.bundle/textassets/2430823284743666700-text_zh_cn.bin',
      tables: sourceTables
    },
    assumptions: [
      'Normal attacks are project fallbacks because HeroTable.Ability.ability is empty for catalog heroes.',
      'Speed is a deterministic project fallback; other base stats come from HeroTable.BaseAttrNew.',
      'Base damage remains max(1, round(ATK*2.6)-floor(DEF*0.5)); exact original combat formulas were not recovered.',
      'Targets, durations, percentages and trigger timing inferred from localized descriptions are marked DescriptionHeuristic.',
      'Battle-start statuses without an explicit round limit are treated as battle-long project approximations.',
      'Skills with an Ability row but no AbilityDes text remain MetadataOnly and are not presented as fully recovered.'
    ],
    characters
  };
  const validation = validateCatalog(catalog, sourceTables);
  if (!validation.ok) throw new Error(`Catalog validation failed:\n${validation.errors.join('\n')}`);
  if (!options.reportOnly) {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  }
  console.log(JSON.stringify({ output: options.reportOnly ? null : options.output, validation }, null, 2));
  if (options.samples) {
    const sample = catalog.characters.filter(character => character.catalogVisible)
      .flatMap(character => character.skills.map(skill => ({ hero: character.name, ...skill })))
      .filter(skill => skill.implementationStatus === 'MetadataOnly')
      .slice(0, 40);
    console.log(JSON.stringify({ samples: sample }, null, 2));
  }
}

main();
