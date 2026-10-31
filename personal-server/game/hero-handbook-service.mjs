import { serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { grantResources } from './resources.mjs';

const HERO_MODULE_ID = 10;
// HeroDataMgr.LoginParse decodes the fourth entry as
// pb_hero_all_handbook_record (the other entries are hero info, draw state,
// favour, visits, trial data and so on).
const HANDBOOK_SLOT = 3;
const HANDBOOK_CONSTANT_TID = 1;
const FIRST_STAGE_STAR_C = 5;
const QUALITY_GOLD = 50;
const QUALITY_WHITE = 60;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveTid(value, label = 'hero') {
  const tid = Number(value);
  if (!Number.isSafeInteger(tid) || tid <= 0 || tid > 0x7fffffff) {
    fail(1, `Invalid handbook ${label}`);
  }
  return tid;
}

function uint32(value, field, tid) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > 0xffffffff) {
    throw new Error(`Invalid hero handbook ${field} for ${tid}`);
  }
  return number;
}

function cloneRecord(record) {
  return { tid: record.tid, quality: record.quality, star: record.star, is_mutant: record.is_mutant };
}

function normalizeRecord(record) {
  const tid = uint32(record.tid, 'tid', record.tid ?? 'unknown');
  return {
    tid,
    quality: uint32(record.quality ?? 0, 'quality', tid),
    star: uint32(record.star ?? 0, 'star', tid),
    is_mutant: Boolean(record.is_mutant)
  };
}

function sortRecords(records) {
  return [...records].sort((left, right) => left.tid - right.tid);
}

function qualityValues(heroTables) {
  return [...heroTables.Quality.keys()].map(Number).filter(Number.isSafeInteger).sort((left, right) => left - right);
}

/**
 * The only reward column the client ships for the own-award claim lives in
 * HeroTable.HandbookConstant (award_item / award_count). In this build the
 * single row is 0/0, so pb_hero_handbook_own_award_back legitimately carries
 * an empty res_change. Keeping the lookup dynamic means a later table build
 * grants the configured item instead of silently dropping it.
 */
function ownAwardReward(heroTables) {
  const row = heroTables.HandbookConstant?.get(HANDBOOK_CONSTANT_TID);
  if (!row) return { itemId: 0, count: 0 };
  const itemId = Number(row.award_item ?? 0);
  const count = Number(row.award_count ?? 0);
  if (!Number.isSafeInteger(itemId) || itemId < 0 || !Number.isSafeInteger(count) || count < 0) {
    throw new Error('Invalid hero handbook own-award configuration');
  }
  return { itemId, count };
}

function nextQuality(current, maximum, available) {
  if (current >= maximum) return current;
  const next = available.find(value => value > current && value <= maximum);
  return next ?? Math.min(maximum, current + 10);
}

/**
 * Owned hero state is the upper bound of a codex record. Duplicate owned rows
 * (for example, the same hero owned with different mutations) keep the highest
 * star, then the highest quality, matching the original roster-to-codex view.
 */
function ownedTargets(heroInfo, heroTables) {
  const targets = new Map();
  for (const hero of heroInfo.hero_list ?? []) {
    const tid = positiveTid(hero.tid, 'hero');
    const config = heroTables.Hero.get(tid);
    if (!config || config.not_in_guide === true) continue;
    const star = uint32(hero.star ?? 0, 'star', tid);
    const quality = uint32(hero.quality ?? config.quality ?? 0, 'quality', tid);
    const isMutant = Number(hero.mutant ?? 0) > 0 || hero.is_mutant === true;
    const existing = targets.get(tid);
    if (!existing) {
      targets.set(tid, { tid, config, maxStar: star, maxQuality: quality, isMutant });
      continue;
    }
    existing.isMutant ||= isMutant;
    if (star > existing.maxStar || (star === existing.maxStar && quality > existing.maxQuality)) {
      existing.maxStar = star;
      existing.maxQuality = quality;
    }
  }
  return targets;
}

function initialRecord(target) {
  return {
    tid: target.tid,
    quality: uint32(target.config.quality ?? 0, 'quality', target.tid),
    star: 0,
    is_mutant: target.isMutant
  };
}

/**
 * Reproduce HeroHandbookRaiseStarForm:_CountHandbookValue. The form walks the
 * first five stars, then the quality ladder at star five, then the remaining
 * stars. A record is only allowed to advance one preview step per command.
 */
function advanceRecord(record, target, availableQualities) {
  const maxStar = target.maxStar;
  const maxQuality = target.maxQuality;
  const currentStar = record.star;
  const currentQuality = record.quality;
  let star = currentStar;
  let quality = currentQuality;

  if (currentStar < maxStar || currentQuality < maxQuality) {
    if (currentStar < FIRST_STAGE_STAR_C) {
      if (currentStar < maxStar) star = currentStar + 1;
      else if (currentQuality < maxQuality) quality = nextQuality(currentQuality, maxQuality, availableQualities);
    } else if (currentStar === FIRST_STAGE_STAR_C) {
      if (currentQuality < maxQuality) {
        if (currentQuality === QUALITY_GOLD) {
          quality = nextQuality(currentQuality, maxQuality, availableQualities);
          if (quality > currentQuality && currentStar < maxStar) star = currentStar + 1;
        } else if (currentQuality === QUALITY_WHITE) {
          if (currentStar < maxStar) star = currentStar + 1;
          else quality = nextQuality(currentQuality, maxQuality, availableQualities);
        } else {
          quality = nextQuality(currentQuality, maxQuality, availableQualities);
        }
      } else if (currentStar < maxStar) star = currentStar + 1;
    } else if (currentStar < maxStar) {
      star = currentStar + 1;
    } else if (currentQuality < maxQuality) {
      quality = nextQuality(currentQuality, maxQuality, availableQualities);
    }

    // A malformed or ahead-of-roster record can land between ladder steps.
    // Keep the command useful by taking one safe step toward either deficit.
    if (star === currentStar && quality === currentQuality) {
      if (currentStar < maxStar) star = currentStar + 1;
      else if (currentQuality < maxQuality) quality = nextQuality(currentQuality, maxQuality, availableQualities);
    }
  }

  return {
    ...record,
    star,
    quality,
    is_mutant: record.is_mutant || target.isMutant
  };
}

export function createHeroHandbookService({ store, codec, heroTables, tables }) {
  const availableQualities = qualityValues(heroTables);
  const ownAward = ownAwardReward(heroTables);

  function readHandbook(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE_ID);
    if (!module || !Array.isArray(module.value)) throw new Error('Hero login module is missing');
    while (module.value.length <= HANDBOOK_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
    let decoded;
    try {
      decoded = codec.unpack('pb_hero_all_handbook_record', Buffer.from(module.value[HANDBOOK_SLOT]?.value?.data ?? []));
    } catch {
      fail(5, 'Hero handbook state is invalid');
    }
    return {
      modules,
      module,
      records: (decoded.records ?? []).map(normalizeRecord),
      ownRev: Buffer.from(decoded.own_rev ?? '', 'base64')
    };
  }

  function writeRecords(model, modules, module, records, ownRev) {
    const payload = codec.pack('pb_hero_all_handbook_record', {
      records: sortRecords(records),
      own_rev: ownRev
    });
    module.value[HANDBOOK_SLOT] = serializedBinary(payload);
    model.state.modules.value = [...modules];
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const { modules, module, records, ownRev } = readHandbook(model);
      const known = new Set(records.map(record => record.tid));
      let added = 0;
      for (const target of ownedTargets(model.heroInfo, heroTables).values()) {
        if (known.has(target.tid)) continue;
        records.push(initialRecord(target));
        known.add(target.tid);
        added++;
      }
      writeRecords(model, modules, module, records, ownRev);
      return { recordCount: records.length, added, removed: 0 };
    });
  }

  function raiseOne(heroId) {
    const tid = positiveTid(heroId);
    return store.transaction(model => {
      const target = ownedTargets(model.heroInfo, heroTables).get(tid);
      if (!target) fail(3001, 'Hero is not owned or is not in the handbook');
      const { modules, module, records, ownRev } = readHandbook(model);
      let index = records.findIndex(record => record.tid === tid);
      if (index < 0) {
        records.push(initialRecord(target));
        index = records.length - 1;
      }
      const record = advanceRecord(records[index], target, availableQualities);
      records[index] = record;
      writeRecords(model, modules, module, records, ownRev);
      const response = { records: [cloneRecord(record)] };
      return { value: response, data: codec.pack('pb_hero_handbook_raise_up_rsp', response) };
    });
  }

  function raiseOneKey(heroIds) {
    if (!Array.isArray(heroIds) || heroIds.length === 0) fail(1, 'Hero handbook raise list is empty');
    const ids = [];
    const seen = new Set();
    for (const value of heroIds) {
      const tid = positiveTid(value, 'hero list entry');
      if (seen.has(tid)) continue;
      seen.add(tid);
      ids.push(tid);
    }

    return store.transaction(model => {
      const targets = ownedTargets(model.heroInfo, heroTables);
      for (const tid of ids) {
        if (!targets.has(tid)) fail(3001, 'Hero is not owned or is not in the handbook');
      }
      const { modules, module, records, ownRev } = readHandbook(model);
      const changed = [];
      for (const tid of ids) {
        const target = targets.get(tid);
        let index = records.findIndex(record => record.tid === tid);
        if (index < 0) {
          records.push(initialRecord(target));
          index = records.length - 1;
        }
        const record = advanceRecord(records[index], target, availableQualities);
        records[index] = record;
        changed.push(cloneRecord(record));
      }
      writeRecords(model, modules, module, records, ownRev);
      const response = { records: changed };
      return { value: response, data: codec.pack('pb_hero_handbook_raise_up_rsp', response) };
    });
  }

  /**
   * 655 = req_hero_handbook_own_award. The command wrapper in HeroCmd.lua is
   * the same EncodeErl(R0) shape as 644, and HeroHandbookMgr.ReqOwnAward
   * forwards R0 exactly like SeqRaiseStar does for its hero tid; the client
   * check HeroHandbookMgr.CheckOwnAwardCanGot(tid) is per hero. A payload
   * therefore names one hero. An absent payload keeps the older
   * claim-everything behaviour used by local tools and tests.
   */
  function claimOwnAward(heroId) {
    const requested = heroId === undefined || heroId === null ? undefined : positiveTid(heroId);
    return store.transaction(model => {
      const targets = ownedTargets(model.heroInfo, heroTables);
      let claimed;
      if (requested === undefined) {
        claimed = [...targets.values()];
      } else {
        const target = targets.get(requested);
        if (!target) fail(3001, 'Hero is not owned or is not in the handbook');
        claimed = [target];
      }
      const { modules, module, records, ownRev } = readHandbook(model);
      let rev = ownRev;
      const changedTids = [];
      for (const target of claimed) {
        const index = Number(target.config.index);
        if (!Number.isSafeInteger(index) || index < 0) fail(5, `Hero handbook index is missing for ${target.tid}`);
        if (hasBit(rev, index)) continue;
        rev = setBit(rev, index);
        changedTids.push(target.tid);
      }
      writeRecords(model, modules, module, records, rev);
      const changes = [];
      if (changedTids.length && ownAward.itemId > 0 && ownAward.count > 0) {
        if (!tables) fail(5, 'Hero handbook reward tables are unavailable');
        changes.push(...grantResources(model, [[ownAward.itemId, ownAward.count * changedTids.length]], tables).changes);
      }
      const response = { rev_bin: rev, res_change: { changes, is_overflow: false } };
      return {
        value: { rev_bin: rev, res_change: { changes }, changedTids, claimedTid: requested ?? null },
        data: codec.pack('pb_hero_handbook_own_award_back', response)
      };
    });
  }

  return {
    supports: type => type === 644 || type === 645 || type === 655,
    reward: ownAward,
    ensureLoginState,
    raiseOne,
    raiseOneKey,
    claimOwnAward
  };
}
