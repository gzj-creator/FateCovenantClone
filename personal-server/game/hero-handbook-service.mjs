import { serializedBinary } from '../protocol/game-codec.mjs';

const HERO_MODULE_ID = 10;
// HeroDataMgr.LoginParse decodes the fourth entry as
// pb_hero_all_handbook_record (the other entries are hero info, draw state,
// favour, visits, trial data and so on).
const HANDBOOK_SLOT = 3;

function uint32(value, field, tid) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > 0xffffffff) {
    throw new Error(`Invalid hero handbook ${field} for ${tid}`);
  }
  return number;
}

function buildRecords(heroInfo, heroTables) {
  const records = new Map();
  for (const hero of heroInfo.hero_list ?? []) {
    const tid = uint32(hero.tid, 'tid', hero.uid ?? 'unknown');
    const config = heroTables.Hero.get(tid);
    // HeroTable.not_in_guide marks internally-used or otherwise hidden heroes.
    // They can exist in the roster without belonging to the player-facing codex.
    if (!config || config.not_in_guide === true) continue;

    const candidate = {
      tid,
      quality: uint32(hero.quality ?? config.quality, 'quality', tid),
      star: uint32(hero.star, 'star', tid),
      is_mutant: Number(hero.mutant ?? 0) > 0 || hero.is_mutant === true
    };
    const existing = records.get(tid);
    if (!existing) {
      records.set(tid, candidate);
      continue;
    }

    // A duplicate hero entry must never downgrade the displayed codex state.
    const candidateIsNewer = candidate.star > existing.star ||
      (candidate.star === existing.star && candidate.quality > existing.quality);
    const merged = candidateIsNewer ? candidate : existing;
    merged.is_mutant ||= candidate.is_mutant || existing.is_mutant;
    records.set(tid, merged);
  }
  return [...records.values()].sort((left, right) => left.tid - right.tid);
}

export function createHeroHandbookService({ store, codec, heroTables }) {
  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const module = modules.get(HERO_MODULE_ID);
      if (!module || !Array.isArray(module.value)) throw new Error('Hero login module is missing');

      while (module.value.length <= HANDBOOK_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
      const previous = codec.unpack('pb_hero_all_handbook_record', Buffer.from(module.value[HANDBOOK_SLOT]?.value?.data ?? []));
      const previousTids = new Set((previous.records ?? []).map(record => Number(record.tid)));
      const records = buildRecords(model.heroInfo, heroTables);
      const currentTids = new Set(records.map(record => record.tid));

      module.value[HANDBOOK_SLOT] = serializedBinary(codec.pack('pb_hero_all_handbook_record', {
        records,
        // Preserve claim state exactly. Claiming own-hero awards is a separate
        // command and must not be inferred from the current roster.
        own_rev: previous.own_rev ?? ''
      }));
      model.state.modules.value = [...modules];
      return {
        recordCount: records.length,
        added: records.filter(record => !previousTids.has(record.tid)).length,
        removed: [...previousTids].filter(tid => !currentTids.has(tid)).length
      };
    });
  }

  return { ensureLoginState };
}
