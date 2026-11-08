import { readEquipTables } from '../config/equip-tables.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';

// Extra hero attribute sources that live outside pb_single_hero. Each adapter
// reads one persisted module, resolves only configured columns and returns
// plain { play, displayAttr, value } rows for attribute-service.mjs. Attribute
// ids stay display ids (AttrType keys) so the assembler keeps the single
// AttrType -> fight_attr mapping; no adapter adds a fight attribute directly.

// RollEquipMgr login slot: pb_role_equip.equips is the worn six-cell set
// (EquipTable.Const.cell_count = 6). EquipAttrCollect.lua collects the cell
// attribute map into the lineup's shared base_values, so the same rows apply to
// every hero of the assembled lineup.
export const ROLE_EQUIP_MODULE = 26;

function modulesOf(model) {
  const modules = model?.state?.modules?.value;
  return modules ? new Map(modules) : new Map();
}

function moduleBytes(module) {
  try {
    if (!module?.value?.data) return Buffer.alloc(0);
    return Buffer.from(rawBinary(module));
  } catch {
    return Buffer.alloc(0);
  }
}

// EquipTable stores flat and percentage rows as [displayAttr, value] pairs and
// AttrType decides the bucket. Keep the pairs verbatim so a percentage column
// (for example talent_attrs crit 11) is never mistaken for a flat value.
function pushPairs(sources, play, pairs, multiplier = 1) {
  if (!Array.isArray(pairs)) return;
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const displayAttr = Number(pair[0]);
    const raw = Number(pair[1]);
    if (!Number.isSafeInteger(displayAttr) || displayAttr <= 0) continue;
    if (!Number.isFinite(raw) || raw === 0) continue;
    const value = raw * multiplier;
    if (!Number.isFinite(value) || value === 0) continue;
    sources.push({ play, displayAttr, value });
  }
}

// One worn equip contributes:
//   Equip.attrs                      -> template base attributes
//   Equip.per_level_attrs * (level-1)-> level growth
//   Refine[type*10000+refine].base_attrs      -> cumulative refine attrs
//   Inscription[type*10000+inscription].base_attrs -> cumulative inscription
// Talent rows are omitted on purpose: pb_equip carries no talent state, so any
// talent_attrs would be an uninformed guess.
export function collectEquipmentSources({ model, codec, tables = readEquipTables(), notes = [] } = {}) {
  const sources = [];
  const bytes = moduleBytes(modulesOf(model).get(ROLE_EQUIP_MODULE));
  if (!bytes.length) return { sources, notes };
  if (!codec) {
    notes.push('equip-codec-missing');
    return { sources, notes };
  }
  let data;
  try {
    data = codec.unpack('pb_role_equip', bytes);
  } catch {
    notes.push('equip-module-unreadable');
    return { sources, notes };
  }
  for (const equip of data?.equips ?? []) {
    const tid = Number(equip?.tid ?? 0);
    if (!Number.isSafeInteger(tid) || tid <= 0) continue;
    const label = 'equip:' + Number(equip?.id ?? 0) + ':' + tid;
    const template = tables?.Equip?.get(tid);
    if (!template) {
      notes.push('equip-template-missing:' + tid);
      continue;
    }
    pushPairs(sources, label + ':base', template.attrs);
    const level = Number(equip?.level ?? 1);
    if (Number.isSafeInteger(level) && level > 1) {
      pushPairs(sources, label + ':level', template.per_level_attrs, level - 1);
    }
    const type = Number(template.type ?? 0);
    const refine = Number(equip?.refine ?? 0);
    if (Number.isSafeInteger(refine) && refine > 0) {
      const row = tables?.Refine?.get(type * 10000 + refine);
      if (row) pushPairs(sources, label + ':refine', row.base_attrs);
      else notes.push('equip-refine-row-missing:' + type + ':' + refine);
    }
    const inscription = Number(equip?.inscription ?? 0);
    if (Number.isSafeInteger(inscription) && inscription > 0) {
      const row = tables?.Inscription?.get(type * 10000 + inscription);
      if (row) pushPairs(sources, label + ':inscription', row.base_attrs);
      else notes.push('equip-inscription-row-missing:' + type + ':' + inscription);
    }
  }
  return { sources, notes };
}
