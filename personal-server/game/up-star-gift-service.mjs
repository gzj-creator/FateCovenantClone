import { GameError } from './hero-progression.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { grantResources } from './resources.mjs';
import { readModuleData } from './develop-support.mjs';
import { hasBit, setBit } from './bit-block.mjs';

// 独立“限时升星 / 升星礼包”家族（模块 92037，ActivityTable func 25）。
//
// 登录数据 pb_up_star_gift_master 挂在模块 92 并行活动组的
// module_login_data 里，外层是 ETF BINARY_EXT 包装、内层是 protobuf：
//   info_list[]        每个活动版本一条 {version, act_id, award_bin, buy_limit_info}
//   cur_choose_version 客户端当前选中的版本号（不是 act_id）
//
// 客户端 UpStarGiftMgr.ParseData 把 info_list 变成 upStarDataMap[version]，
// 并把 award_bin 交给 Core.BitBlock.DecodePB；Show/HeroShow 是客户端静态表，
// 不进入登录包。UpStarGiftNewNode 只有在 gift==0 时才走 ReqTaskAward；
// gift>0 的行走 ReqBuyRechargeGift，由 RechargeMgr 购买，绝不是 31052 领奖。
export const UP_STAR_GIFT_ACTIVITY_FUNC = 25;
export const UP_STAR_GIFT_MODULE_ID = 92;
export const UP_STAR_GIFT_COMMANDS = Object.freeze({ AWARD: 31052, CHOOSE_VERSION: 31053 });

const RUNNING_STATE_ID = 50;
const ETF_VERSION = 0x83;
const ETF_BINARY_EXT = 0x6d;

// TaskTable.Type keys are task types, not hero/pet/elf ids. The progress
// function is the only static link from a task type to a player-data family:
//   1199.progress_fun=66  -> hero star; task_param is a HeroTable tid
//   13005.progress_fun=362 -> pet star; task_param is an ItemTable type=171 pet
//   14701.progress_fun=363 -> elf star; task_param is an ItemTable type=191 elf
// These numbers are verified against TaskTable.data.lua and ItemTable.data.lua
// (see the fix document); no id-prefix heuristic is used here.
const HERO_STAR_PROGRESS = 66;
const PET_STAR_PROGRESS = 362;
const ELF_STAR_PROGRESS = 363;

function bytesOf(value) {
  if (value == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  if (value.value?.type === 'Buffer') return Buffer.from(value.value.data);
  if (Array.isArray(value.value)) return Buffer.from(value.value);
  return Buffer.alloc(0);
}

// 模块 92 的 module_login_data 在登录快照里是 ETF BINARY_EXT（83 6d len ...），
// 内层才是 protobuf。旧实现把它当裸 protobuf 解析会得到 “illegal tag”。
export function unwrapEtfBinary(value) {
  const bytes = bytesOf(value);
  if (bytes.length >= 6 && bytes[0] === ETF_VERSION && bytes[1] === ETF_BINARY_EXT) {
    const length = bytes.readUInt32BE(2);
    if (6 + length <= bytes.length) return bytes.subarray(6, 6 + length);
  }
  return bytes;
}

export function wrapEtfBinary(bytes) {
  const body = Buffer.from(bytes);
  const header = Buffer.alloc(6);
  header[0] = ETF_VERSION;
  header[1] = ETF_BINARY_EXT;
  header.writeUInt32BE(body.length, 2);
  return Buffer.concat([header, body]);
}

function wireEntry(entry) {
  const row = {
    version: Number(entry.version) || 0,
    act_id: String(entry.act_id ?? 0),
    award_bin: bytesOf(entry.award_bin)
  };
  const limit = entry.buy_limit_info;
  if (limit && typeof limit === 'object' && Object.keys(limit).length) row.buy_limit_info = limit;
  return row;
}

function maxStar(rows, tid) {
  let max = 0;
  for (const row of rows ?? []) {
    if (String(row?.tid ?? '') !== String(tid)) continue;
    const star = Number(row.star ?? 0);
    if (Number.isSafeInteger(star) && star > max) max = star;
  }
  return max;
}

function unionBits(left, right) {
  const a = bytesOf(left), b = bytesOf(right);
  const result = Buffer.alloc(Math.max(a.length, b.length));
  for (let index = 0; index < result.length; index += 1) result[index] = (a[index] ?? 0) | (b[index] ?? 0);
  return result;
}

function mergeBuyLimitInfo(left, right) {
  if (!left || typeof left !== 'object') return right && typeof right === 'object' ? { ...right } : {};
  if (!right || typeof right !== 'object') return { ...left };
  return { ...left, ...right };
}

export function createUpStarGiftService({ store, codec, tables, upStarTables, calendar, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => Math.floor(Number(now()) / 1000);

  // ActivityTable func 25 is the registry: tid is the activity id and version
  // is the client-side version number used by Show/UpStarGift rows.
  function versions() {
    const rows = [];
    for (const [tid, row] of tables?.Activity ?? []) {
      if (Number(row?.func) !== UP_STAR_GIFT_ACTIVITY_FUNC) continue;
      const actId = Number(tid), version = Number(row.version);
      if (!Number.isSafeInteger(actId) || actId <= 0 || !Number.isSafeInteger(version) || version <= 0) continue;
      rows.push({ actId, version, row });
    }
    return rows.sort((left, right) => left.version - right.version);
  }

  function configured(row) {
    return Boolean(upStarTables?.giftsByVersion?.has(Number(row.version))
      && upStarTables?.showsByVersion?.has(Number(row.version)));
  }

  function isUpStarState(state) {
    return Number(tables?.Activity?.get?.(Number(state?.act_id))?.func) === UP_STAR_GIFT_ACTIVITY_FUNC;
  }

  function familyGroup(activity) {
    return (activity.act_parallel_list ?? []).find(group => (group.states_data ?? []).some(isUpStarState)) ?? null;
  }

  function decodeMaster(raw) {
    const inner = unwrapEtfBinary(raw);
    if (!inner.length) return { info_list: [], cur_choose_version: 0 };
    try {
      const master = codec.unpack('pb_up_star_gift_master', inner);
      master.info_list ??= [];
      return master;
    } catch (error) {
      // Never reinterpret a corrupt player payload as an empty state. Login
      // catches this at the family boundary and leaves the original bytes in
      // place; commands fail closed inside their transaction.
      throw new GameError(5, `Up-star gift login data is invalid: ${error.message}`);
    }
  }

  function encodeMaster(master) {
    return wrapEtfBinary(codec.pack('pb_up_star_gift_master', {
      cur_choose_version: Number(master.cur_choose_version) || 0,
      info_list: (master.info_list ?? []).map(wireEntry)
    }));
  }

  function windowStart(config) {
    const window = activityWindow(config.row, calendar?.serverOpenedAt, calendar?.activityReferenceOpenedAt);
    return Number(window?.start) || 0;
  }

  function discardedAt(row, at) {
    const discardTime = Number(row?.row?.discard_time ?? 0);
    return discardTime > 0 && at >= discardTime;
  }

  function compareVersionRows(left, right) {
    return windowStart(right) - windowStart(left) || right.actId - left.actId;
  }

  function selectVersionRow(candidates, running, existingActId, at) {
    const available = candidates.filter(candidate => !discardedAt(candidate, at));
    const runningAvailable = running.filter(candidate => !discardedAt(candidate, at));
    if (runningAvailable.length) return [...runningAvailable].sort(compareVersionRows)[0];

    const known = available.find(candidate => candidate.actId === Number(existingActId));
    if (known) return known;
    if (available.length) return [...available].sort(compareVersionRows)[0];

    const existing = candidates.find(candidate => candidate.actId === Number(existingActId));
    if (existing) return existing;
    return [...candidates].sort(compareVersionRows)[0] ?? null;
  }

  function stateFor(group, actId) {
    return (group.states_data ?? []).find(candidate => Number(candidate?.act_id) === Number(actId)) ?? null;
  }

  // Keep one info_list row per ActivityTable func25 version, not just the
  // captured 66 historical rows. ActivityTable contains a duplicate version 91
  // entry (25091 current and 25098 discarded), so the mapping must be selected
  // by running state, discard_time and window rather than table insertion order.
  // Existing award_bin/buy_limit_info rows are preserved.
  function reconcile(activity, at) {
    const rows = versions();
    if (!rows.length) {
      return {
        group: null, master: null, running: [], configured: [], unconfiguredRunning: [],
        addedStates: [], addedInfo: [], curChooseVersion: 0, hasActivityConfig: false
      };
    }

    let group = familyGroup(activity);
    const addedStates = [];
    const runningRows = [];
    const rowsByVersion = new Map();
    for (const row of rows) {
      if (!rowsByVersion.has(row.version)) rowsByVersion.set(row.version, []);
      rowsByVersion.get(row.version).push(row);
    }

    // Determine the live rows before materializing any ActivityTable row into
    // the login snapshot. Historical table rows are configuration, not current
    // running evidence.
    for (const row of rows) {
      const state = group ? stateFor(group, row.actId) : null;
      if (!discardedAt(row, at) && calendar.isActivityRunning(row.actId, state, activity, at)) {
        runningRows.push(row);
      }
    }

    if (!runningRows.length) {
      const configuredRows = [];
      for (const candidates of rowsByVersion.values()) {
        const row = selectVersionRow(candidates, [], 0, at);
        if (row && configured(row)) configuredRows.push(row);
      }
      return {
        group, master: null, running: [], configured: configuredRows, unconfiguredRunning: [],
        addedStates, addedInfo: [], curChooseVersion: 0, hasActivityConfig: true
      };
    }

    // Decode existing player state before creating a group or status rows so a
    // corrupt payload cannot be partially replaced during login.
    const master = decodeMaster(group?.module_login_data);
    const hadInfoEntries = (master.info_list ?? []).length > 0;
    const existingGroup = Boolean(group);
    if (!group) group = { states_data: [], module_login_data: Buffer.alloc(0) };
    const statesData = [...(group.states_data ?? [])];
    for (const row of runningRows) {
      if (stateFor({ states_data: statesData }, row.actId)) continue;
      statesData.push({
        act_id: row.actId,
        cur_state_id: RUNNING_STATE_ID,
        history_time: [{ state_id: RUNNING_STATE_ID, enter_time: String(windowStart(row) || at) }]
      });
      addedStates.push(row.actId);
    }

    const existing = new Map();
    for (const entry of master.info_list) {
      const version = Number(entry.version);
      const actId = Number(entry.act_id);
      if (!Number.isSafeInteger(version) || version <= 0
        || !Number.isSafeInteger(actId) || actId <= 0) {
        throw new GameError(5, 'Up-star gift login data contains an invalid version entry');
      }
      const current = existing.get(version);
      if (!current) {
        existing.set(version, {
          ...entry,
          award_bin: bytesOf(entry.award_bin),
          buy_limit_info: mergeBuyLimitInfo(entry.buy_limit_info, {})
        });
      } else {
        // A duplicated version is still one client-side BitBlock. Merge claim
        // state so canonicalization can never turn an existing claim back into
        // an unclaimed reward.
        current.award_bin = unionBits(current.award_bin, entry.award_bin);
        current.buy_limit_info = mergeBuyLimitInfo(current.buy_limit_info, entry.buy_limit_info);
      }
    }

    const selectedByVersion = new Map();
    for (const [version, candidates] of rowsByVersion) {
      const runningForVersion = runningRows.filter(row => row.version === version);
      selectedByVersion.set(version, selectVersionRow(
        candidates, runningForVersion, existing.get(version)?.act_id, at
      ));
    }
    const configuredRows = [...selectedByVersion.values()].filter(row => row && configured(row));
    const running = configuredRows.filter(row => runningRows.includes(row));
    const unconfiguredRunning = runningRows
      .filter(row => !configured(selectedByVersion.get(row.version) ?? row))
      .filter((row, index, all) => all.findIndex(candidate => candidate.version === row.version) === index);

    // Canonicalize stored historical rows when ActivityTable disambiguates a
    // reused client version (for example 25091 versus discarded 25098), while
    // adding entries only for versions that are currently running.
    for (const [version, row] of selectedByVersion) {
      const entry = existing.get(version);
      if (entry && row && Number(entry.act_id) !== row.actId) entry.act_id = String(row.actId);
    }

    if (!running.length) {
      return {
        group, master: null, running: [], configured: configuredRows, unconfiguredRunning,
        addedStates, addedInfo: [], curChooseVersion: 0, hasActivityConfig: true
      };
    }

    // Current rows always need a status/info entry. Reused client versions
    // additionally keep one canonical info row even when that generation is
    // historical, so two ActivityTable rows cannot both claim the same bit map.
    const materializedRows = [...running];
    for (const [version, row] of selectedByVersion) {
      if (hadInfoEntries && row && configured(row) && rowsByVersion.get(version).length > 1
        && !materializedRows.some(candidate => candidate.version === version)) {
        materializedRows.push(row);
      }
    }
    const addedInfo = [];
    for (const row of materializedRows) {
      const entry = existing.get(row.version);
      if (!entry) {
        const created = { version: row.version, act_id: String(row.actId), award_bin: '', buy_limit_info: {} };
        master.info_list.push(created);
        existing.set(row.version, created);
        addedInfo.push(row.actId);
      }
    }
    // Remove duplicate historical entries after their claim bits have been
    // merged. Preserve already stored versions that are no longer present in
    // ActivityTable so old claim records are not silently discarded.
    master.info_list = [...existing.values(), ...master.info_list.filter(entry => !existing.has(Number(entry.version)))];

    const runningByVersion = new Map(running.map(row => [row.version, row]));
    const originalChoice = Number(master.cur_choose_version) || 0;
    let chosen = Number(master.cur_choose_version) || 0;
    if (!runningByVersion.has(chosen)) {
      const newest = [...running].sort((left, right) =>
        windowStart(right) - windowStart(left) || right.version - left.version)[0];
      chosen = newest.version;
    }
    master.cur_choose_version = chosen;
    const encoded = encodeMaster(master);
    const dirty = !existingGroup || addedStates.length > 0 || addedInfo.length > 0
      || originalChoice !== chosen
      || !bytesOf(group.module_login_data).equals(encoded);
    group.states_data = statesData;
    group.module_login_data = encoded;
    if (!existingGroup) {
      activity.act_parallel_list ??= [];
      activity.act_parallel_list.push(group);
    }
    return {
      group, master, running, configured: configuredRows, addedStates, addedInfo,
      unconfiguredRunning, curChooseVersion: chosen, hasActivityConfig: true, dirty
    };
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    let state;
    try {
      state = reconcile(activity, at);
    } catch (error) {
      // Login must not fail because one activity is corrupt, but it also must
      // not silently erase claim history. Preserve the payload and let the two
      // commands continue to fail closed until the state is repaired.
      log({
        event: 'up_star_gift_login_rejected',
        code: error instanceof GameError ? error.code : 2,
        message: error.message
      });
      return {
        activityIds: [], versions: [], curChooseVersion: 0, addedStates: [], addedInfo: [], error: error.message
      };
    }
    if (!state.running.length) {
      return {
        activityIds: [], versions: [], curChooseVersion: 0,
        addedStates: state.addedStates, addedInfo: [], unconfiguredRunning: state.unconfiguredRunning,
        hasActivityConfig: state.hasActivityConfig
      };
    }
    return {
      activityIds: state.running.map(row => row.actId),
      versions: state.running.map(row => row.version),
      curChooseVersion: state.curChooseVersion,
      addedStates: state.addedStates,
      addedInfo: state.addedInfo,
      unconfiguredRunning: state.unconfiguredRunning,
      hasActivityConfig: state.hasActivityConfig
    };
  }

  function readActivityFrom(modules) {
    const module = modules.get(UP_STAR_GIFT_MODULE_ID);
    if (!module) throw new GameError(5, 'Activity login data is unavailable');
    try {
      return codec.unpack('pb_act_login', rawBinary(module));
    } catch {
      throw new GameError(5, 'Activity login data is invalid');
    }
  }

  // 31053 req_up_star_choose_version：ETF 整数版本号。
  function chooseVersion(version) {
    const selected = Number(version);
    if (!Number.isSafeInteger(selected) || selected <= 0) throw new GameError(1, 'Invalid up-star gift version');
    const at = currentSeconds();
    const result = store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const activity = readActivityFrom(modules);
      const state = reconcile(activity, at);
      if (!state.hasActivityConfig) throw new GameError(5, 'Up-star gift activity configuration is unavailable');
      if (!state.group || !state.master) {
        if (state.unconfiguredRunning.length) {
          throw new GameError(5, 'Running up-star gift activity has no UpStarGiftTable configuration');
        }
        throw new GameError(309, 'Up-star gift activity is not running');
      }
      const row = state.running.find(candidate => candidate.version === selected);
      if (!row) {
        if (state.unconfiguredRunning.some(candidate => candidate.version === selected)) {
          throw new GameError(5, 'Up-star gift version ' + selected + ' has no UpStarGiftTable configuration');
        }
        throw new GameError(309, 'Up-star gift version is not running');
      }
      if (!upStarTables.giftsByVersion.has(selected)) throw new GameError(5, 'Up-star gift version has no UpStarGiftTable configuration');
      const entry = (state.master.info_list ?? []).find(candidate => Number(candidate.version) === selected);
      if (!entry) throw new GameError(5, 'Up-star gift login data is missing the selected version');
      const changed = Number(state.master.cur_choose_version) !== selected;
      if (changed || state.dirty) {
        state.master.cur_choose_version = selected;
        state.group.module_login_data = encodeMaster(state.master);
        // Pack before mutating the model so a schema error leaves no partial write.
        const packed = codec.pack('pb_act_login', activity);
        modules.set(UP_STAR_GIFT_MODULE_ID, serializedBinary(packed));
        model.state.modules.value = [...modules];
      }
      return { changed, repaired: Boolean(state.dirty), version: selected, actId: row.actId };
    });
    log({ event: 'up_star_gift_version_selected', ...result });
    return { value: result, data: Buffer.alloc(0) };
  }

  function progressReader(model, modules) {
    const cache = new Map();
    let petRows;
    let elfRows;

    const loadPets = () => {
      if (petRows) return petRows;
      const module = modules.get(158);
      if (!module) return (petRows = []);
      try {
        petRows = readModuleData(modules, 158, 0, 'pb_pet_develop_data', { pets: [], slots: [] }, codec).pets ?? [];
      } catch {
        throw new GameError(5, 'Pet login data is invalid');
      }
      return petRows;
    };

    const loadElves = () => {
      if (elfRows) return elfRows;
      const module = modules.get(538);
      if (!module) return (elfRows = []);
      try {
        elfRows = readModuleData(modules, 538, null, 'pb_elves_develop', { elves: [], help_slots: [] }, codec).elves ?? [];
      } catch {
        throw new GameError(5, 'Elf login data is invalid');
      }
      return elfRows;
    };

    return gift => {
      const key = gift.type + ':' + gift.taskParam;
      if (cache.has(key)) return cache.get(key);
      const typeConfig = tables?.TaskType?.get(Number(gift.type));
      if (!typeConfig || Number(typeConfig.progress_type) !== 1) {
        throw new GameError(5, 'Up-star gift task type is not configured: ' + gift.type);
      }
      const progressFun = Number(typeConfig.progress_fun);
      let progress;
      if (progressFun === HERO_STAR_PROGRESS) {
        if (!tables?.Hero?.has?.(Number(gift.taskParam))) {
          throw new GameError(5, 'Up-star gift HeroTable target is unavailable: ' + gift.taskParam);
        }
        progress = maxStar(model.heroInfo?.hero_list, gift.taskParam);
      } else if (progressFun === PET_STAR_PROGRESS) {
        if (Number(tables?.Item?.get?.(Number(gift.taskParam))?.type) !== 171) {
          throw new GameError(5, 'Up-star gift pet task_param is not an ItemTable type 171: ' + gift.taskParam);
        }
        progress = maxStar(loadPets(), gift.taskParam);
      } else if (progressFun === ELF_STAR_PROGRESS) {
        if (Number(tables?.Item?.get?.(Number(gift.taskParam))?.type) !== 191) {
          throw new GameError(5, 'Up-star gift elf task_param is not an ItemTable type 191: ' + gift.taskParam);
        }
        progress = maxStar(loadElves(), gift.taskParam);
      }
      else throw new GameError(5, 'Up-star gift task progress is not implemented: ' + progressFun);
      cache.set(key, progress);
      return progress;
    };
  }

  // 31052 req_up_star_gift_award：pb_up_star_gift_req{ids}。ids 是
  // UpStarGiftTable.UpStarGift.tid，不是版本号；gift>0 的行是充值礼包，由
  // RechargeMgr 处理，不能从这里免费领取。
  function award(request) {
    const raw = request?.ids ?? [];
    if (!Array.isArray(raw)) throw new GameError(1, 'Invalid up-star gift ids');
    const ids = raw.map(value => Number(value));
    if (!ids.length || ids.length > 100
      || ids.some(id => !Number.isSafeInteger(id) || id <= 0)
      || new Set(ids).size !== ids.length) {
      throw new GameError(1, 'Invalid up-star gift ids');
    }
    const at = currentSeconds();
    const result = store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const activity = readActivityFrom(modules);
      const state = reconcile(activity, at);
      if (!state.hasActivityConfig) throw new GameError(5, 'Up-star gift activity configuration is unavailable');
      if (!state.group || !state.master || !state.running.length) {
        if (state.unconfiguredRunning.length) {
          throw new GameError(5, 'Running up-star gift activity has no UpStarGiftTable configuration');
        }
        throw new GameError(309, 'Up-star gift activity is not running');
      }
      const version = Number(state.master.cur_choose_version) || 0;
      const selected = state.running.find(row => row.version === version);
      if (!selected) throw new GameError(309, 'Up-star gift version is not selected');
      const entry = (state.master.info_list ?? []).find(candidate => Number(candidate.version) === version);
      if (!entry) throw new GameError(5, 'Up-star gift login data is missing the selected version');
      const versionRows = upStarTables.giftsByVersion.get(version);
      if (!versionRows?.length) throw new GameError(5, 'Up-star gift version has no UpStarGiftTable configuration');

      const gifts = ids.map(id => {
        const gift = upStarTables.giftsById.get(id);
        if (!gift) throw new GameError(1, 'Unknown up-star gift id: ' + id);
        if (gift.version !== version) {
          throw new GameError(5, 'Up-star gift id ' + id + ' belongs to version ' + gift.version + ', not selected version ' + version);
        }
        if (gift.gift > 0) throw new GameError(5, 'Up-star gift id ' + id + ' is a recharge product; use the recharge flow');
        if (!gift.award.length) throw new GameError(5, 'Up-star gift id ' + id + ' has no claimable award');
        if (gift.oneKey !== 0) throw new GameError(5, 'Up-star gift id ' + id + ' is a one-key gift');
        return gift;
      });

      const bits = bytesOf(entry.award_bin);
      const already = ids.filter(id => hasBit(bits, id % 100));
      if (already.length === ids.length) {
        // A retried request must not duplicate resources. Return the same
        // state shape with an empty resource change list.
        if (state.dirty) {
          const packedActivity = codec.pack('pb_act_login', activity);
          modules.set(UP_STAR_GIFT_MODULE_ID, serializedBinary(packedActivity));
          model.state.modules.value = [...modules];
        }
        const info = wireEntry(entry);
        const res = { changes: [], is_overflow: false };
        return { info, res, data: codec.pack('pb_up_star_gift_back', { info, res }), idempotent: true };
      }
      if (already.length) throw new GameError(310, 'Up-star gift award was already claimed: ' + already.join(','));

      const progressOf = progressReader(model, modules);
      const show = upStarTables.showsByVersion.get(version);
      const awards = [];
      for (const gift of gifts) {
        const progress = progressOf(gift);
        if (progress < gift.targetCount) {
          throw new GameError(5, 'Up-star gift id ' + gift.tid + ' task is not complete: requires ' + gift.targetCount + ', current ' + progress);
        }
        if (gift.starUnlock > 0) {
          if (!show) throw new GameError(5, 'Up-star gift display configuration is unavailable for version ' + version);
          const displayProgress = maxStar(model.heroInfo?.hero_list, show.showStyle);
          if (displayProgress < gift.starUnlock) {
            throw new GameError(5, 'Up-star gift id ' + gift.tid + ' display gift is locked: requires hero ' +
              show.showStyle + ' star ' + gift.starUnlock + ', current ' + displayProgress);
          }
        }
        awards.push(...gift.award);
      }

      let nextBits = bits;
      for (const id of ids) nextBits = setBit(nextBits, id % 100);
      entry.award_bin = nextBits;
      state.group.module_login_data = encodeMaster(state.master);

      // Validate serialization before granting, then merge the granted module
      // changes back before writing module 92. A grant or pack failure aborts
      // the surrounding SQLite transaction as a whole.
      const packedActivity = codec.pack('pb_act_login', activity);
      const res = grantResources(model, awards, tables, { codec });
      const finalModules = new Map(model.state.modules.value);
      finalModules.set(UP_STAR_GIFT_MODULE_ID, serializedBinary(packedActivity));
      model.state.modules.value = [...finalModules];
      const info = wireEntry(entry);
      const data = codec.pack('pb_up_star_gift_back', { info, res });
      return { info, res, data, idempotent: false };
    });
    log({
      event: result.idempotent ? 'up_star_gift_award_idempotent' : 'up_star_gift_award_claimed',
      version: Number(result.info.version), actId: Number(result.info.act_id), ids: ids.length,
      changes: result.res.changes.length
    });
    return { value: { info: result.info, res: result.res }, data: result.data };
  }

  return {
    supports: type => Object.values(UP_STAR_GIFT_COMMANDS).includes(Number(type)),
    commands: UP_STAR_GIFT_COMMANDS,
    synchronizeLogin,
    execute(type, input) {
      if (Number(type) === UP_STAR_GIFT_COMMANDS.CHOOSE_VERSION) return chooseVersion(input);
      if (Number(type) === UP_STAR_GIFT_COMMANDS.AWARD) return award(input);
      throw new GameError(1, 'Unsupported up-star gift command');
    }
  };
}
