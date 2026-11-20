import { readJsonAsset, tableAsset } from '../assets.mjs';

let cached;
let normalSkills;

export function readFightAbilityTypes() {
  if (cached) return cached;
  const { fields, rows, sources } = readJsonAsset(tableAsset('FightAbilityTypes.data.json.gz'));
  if (fields.join(',') !== 'tid,type,run_type' || rows.length !== sources.reduce((sum, source) => sum + source.rows, 0)) {
    throw new Error('FightTable.Ability dispatch inventory is incomplete');
  }
  const abilities = new Map();
  for (const [tid, type, runType] of rows) {
    if (![tid, type, runType].every(Number.isSafeInteger) || tid <= 0 || type <= 0 || runType < 0 || abilities.has(tid)) {
      throw new Error('Invalid FightTable.Ability dispatch row: ' + tid);
    }
    abilities.set(tid, { type, runType });
  }
  return cached = abilities;
}

export function isTianjiAbility(abilityId) {
  const row = readFightAbilityTypes().get(Number(abilityId));
  return row?.type === 2 && row.runType === 5;
}

export function readHeroNormalSkills() {
  if (normalSkills) return normalSkills;
  const { fields, rows } = readJsonAsset(tableAsset('HeroNormalSkills.data.json'));
  if (fields.join(',') !== 'id,name,textKey,damageType,multiplier,tianjiGain') {
    throw new Error('Invalid original hero normal schema');
  }
  const types = readFightAbilityTypes();
  const lookup = new Map();
  for (const [id, name, textKey, damageType, multiplier, tianjiGain] of rows) {
    if (lookup.has(id) || types.get(id)?.type !== 1 || !name || !Number.isSafeInteger(textKey)
        || !['physical', 'magical'].includes(damageType) || ![1, 1.1].includes(multiplier)
        || tianjiGain !== (multiplier === 1.1 ? 1 : 0)) {
      throw new Error('Invalid original hero normal row: ' + id);
    }
    lookup.set(id, { name, textKey, damageType, multiplier, tianjiGain });
  }
  return normalSkills = lookup;
}
