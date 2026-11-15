import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readLeaserStarUpTables } from '../config/leaser-starup-tables.mjs';
import { readArtifactTables } from '../config/artifact-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import {
  overallPvpStageInGroup,
  readOverallPvpTables,
  resolveOverallPvpCycle
} from '../config/overall-pvp-tables.mjs';
import { GameError } from './hero-progression.mjs';
import { gameDayIndex } from './time.mjs';

const COMMAND_STAR_UP = 101201;
const COMMAND_RESET = 101202;
const SUPPORTED = Object.freeze([COMMAND_STAR_UP, COMMAND_RESET]);

const HERO_MODULE_ID = 143;
const LEASE_MODULE_ID = 179;
const STAR_UP_MODULE_ID = 180;
const HERO_FUNC_TID = 7;
const LEASE_FUNC_TID = 1;
const HERO_SLOT = 5;
const LEASE_SLOT = 0;

const CODE_INVALID = 1;
const CODE_STATE = 5;

// pb_lease_unit_role.type maps to the three non-hero rows in LeaserStarUpTable.
const UNIT_TYPES = Object.freeze({
  2: Object.freeze({ schema: 'pb_lease_artifact', lineupField: 'lease_artifact', label: 'artifact' }),
  3: Object.freeze({ schema: 'pb_lease_pet', lineupField: 'lease_pet', label: 'pet' }),
  4: Object.freeze({ schema: 'pb_lease_elves', lineupField: 'lease_elves', label: 'elves' })
});

// PetTable and ElvesTable carry the reset base rows used by the shipped
// LeaserStarUpPetObj._InitData and LeaserStarUpElvesObj._InitData. Only the
// reset identity fields are frozen here; all upgrade rows remain sourced from
// LeaserStarUpTable. Source SHA256s are recorded in the R1 implementation log.
const PET_RESET_BASES = new Map([
  [100113, Object.freeze({ star: 0, quality: 30 })],
  [200113, Object.freeze({ star: 0, quality: 40 })],
  [200213, Object.freeze({ star: 0, quality: 40 })],
  [300113, Object.freeze({ star: 0, quality: 50 })],
  [300213, Object.freeze({ star: 0, quality: 50 })],
  [300313, Object.freeze({ star: 0, quality: 50 })],
  [400113, Object.freeze({ star: 5, quality: 60 })],
  [400213, Object.freeze({ star: 5, quality: 60 })],
  [400313, Object.freeze({ star: 5, quality: 60 })]
]);

const ELVES_RESET_BASES = new Map([
  [100120, Object.freeze({ star: 0, quality: 30 })],
  [200120, Object.freeze({ star: 0, quality: 40 })],
  [200220, Object.freeze({ star: 0, quality: 40 })],
  [300120, Object.freeze({ star: 0, quality: 50 })],
  [300220, Object.freeze({ star: 0, quality: 50 })],
  [300320, Object.freeze({ star: 0, quality: 50 })],
  [400120, Object.freeze({ star: 5, quality: 60 })],
  [400220, Object.freeze({ star: 5, quality: 60 })],
  [400320, Object.freeze({ star: 5, quality: 60 })]
]);

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

function levelValue(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0 || number > 999) fail(CODE_STATE, `Invalid ${label}`);
  return number;
}

function emptySlot() {
  return serializedBinary(Buffer.alloc(0));
}

function emptyHeroLease() {
  return {
    func_tid: HERO_FUNC_TID,
    lease_heroes: [],
    place_heroes: [],
    stamp: 0,
    total_lease_times: 0,
    lease_award_times: 0,
    last_lease_uid: 0
  };
}

function emptyLeaseRole() {
  return { func_tid: LEASE_FUNC_TID, unit_role: [], day_flush_stamp: 0 };
}

function bytesOfSerialized(value) {
  if (!value) return Buffer.alloc(0);
  try { return rawBinary(value); } catch { fail(CODE_STATE, 'Leaser star-up login slot is malformed'); }
}

function ensureArrayModule(modules, moduleId, minimumLength) {
  let module = modules.get(moduleId);
  if (!module) {
    module = { value: [], improper: false };
    modules.set(moduleId, module);
  }
  if (!Array.isArray(module.value)) fail(CODE_STATE, `Leaser star-up module ${moduleId} is malformed`);
  while (module.value.length < minimumLength) module.value.push(emptySlot());
  return module;
}

function lineupCollections(model) {
  const collection = [];
  for (const lineup of model.playLineups ?? []) collection.push({ lineup, play: true });
  for (const key of ['pre_lineups', 'pre_lineups_standby']) {
    for (const preset of model.lineups?.[key] ?? []) {
      if (preset?.lineup) collection.push({ lineup: preset.lineup, play: false });
    }
  }
  return collection;
}

function teamLists(lineup) {
  return Array.isArray(lineup?.team_list) ? lineup.team_list : [];
}

export function createLeaserStarUpService({
  store,
  codec,
  tables = readLeaserStarUpTables(),
  heroTables = readHeroTables(),
  artifactTables = readArtifactTables(),
  resourceTables = readGameTables(),
  overallPvpTables = readOverallPvpTables(),
  now = () => Date.now(),
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (tables.leaserFunc !== LEASE_FUNC_TID || tables.heroLeaserFunc !== HERO_FUNC_TID) {
    throw new Error('Leaser star-up function ids do not match the login modules');
  }
  if (HERO_SLOT !== tables.heroLeaserFunc - 2) throw new Error('Leaser star-up hero login slot is inconsistent');

  function nowSeconds() {
    const value = Math.floor(Number(typeof now === 'function' ? now() : now) / 1000);
    if (!Number.isSafeInteger(value) || value <= 0) fail(CODE_STATE, 'Leaser star-up clock is invalid');
    return value;
  }

  function readHeroLease(model) {
    const module = new Map(model.state.modules.value).get(HERO_MODULE_ID);
    const slot = module?.value?.[HERO_SLOT];
    const bytes = bytesOfSerialized(slot);
    if (!bytes.length) return null;
    let state;
    try { state = codec.unpack('pb_role_lease_hero', bytes); }
    catch { fail(CODE_STATE, 'Hero lease login data is invalid'); }
    if (Number(state?.func_tid) !== HERO_FUNC_TID) fail(CODE_STATE, 'Hero lease login data has the wrong function id');
    state.lease_heroes ??= [];
    state.place_heroes ??= [];
    return state;
  }

  function writeHeroLease(model, state) {
    const modules = new Map(model.state.modules.value);
    const module = ensureArrayModule(modules, HERO_MODULE_ID, 7);
    module.value[HERO_SLOT] = serializedBinary(codec.pack('pb_role_lease_hero', state));
    model.state.modules.value = [...modules];
  }

  function readLeaseRole(model) {
    const module = new Map(model.state.modules.value).get(LEASE_MODULE_ID);
    const slot = module?.value?.[LEASE_SLOT];
    const bytes = bytesOfSerialized(slot);
    if (!bytes.length) return null;
    let state;
    try { state = codec.unpack('pb_lease_role', bytes); }
    catch { fail(CODE_STATE, 'Generic lease login data is invalid'); }
    if (Number(state?.func_tid) !== LEASE_FUNC_TID) fail(CODE_STATE, 'Generic lease login data has the wrong function id');
    state.unit_role ??= [];
    return state;
  }

  function writeLeaseRole(model, state) {
    const modules = new Map(model.state.modules.value);
    const module = ensureArrayModule(modules, LEASE_MODULE_ID, 1);
    module.value[LEASE_SLOT] = serializedBinary(codec.pack('pb_lease_role', state));
    model.state.modules.value = [...modules];
  }

  function ensureStarUpLoginState(modules) {
    let module = modules.get(STAR_UP_MODULE_ID);
    let state = { reset_list: [] };
    if (module) {
      if (Array.isArray(module.value)) {
        if (module.value.length > 1) fail(CODE_STATE, 'Leaser star-up login module has extra slots');
        const bytes = bytesOfSerialized(module.value[0]);
        if (bytes.length) {
          try { state = codec.unpack('pb_leaser_star_up', bytes); }
          catch { fail(CODE_STATE, 'Leaser star-up login data is invalid'); }
        }
      } else {
        const bytes = bytesOfSerialized(module);
        if (bytes.length) {
          try { state = codec.unpack('pb_leaser_star_up', bytes); }
          catch { fail(CODE_STATE, 'Leaser star-up login data is invalid'); }
        }
      }
    }
    state.reset_list ??= [];
    const versions = new Set();
    for (const reset of state.reset_list) {
      const version = positiveInteger(reset?.version, 'leaser star-up reset version');
      if (versions.has(version)) fail(CODE_STATE, 'Leaser star-up reset versions are duplicated');
      versions.add(version);
      reset.last_reset_refresh_time = Number(reset.last_reset_refresh_time ?? 0);
      reset.cur_reset_times = Number(reset.cur_reset_times ?? 0);
      if (!Number.isSafeInteger(reset.last_reset_refresh_time) || reset.last_reset_refresh_time < 0
        || !Number.isSafeInteger(reset.cur_reset_times) || reset.cur_reset_times < 0) {
        fail(CODE_STATE, 'Leaser star-up reset state is invalid');
      }
    }
    if (!versions.has(1)) {
      state.reset_list.push({ version: 1, last_reset_refresh_time: 0, cur_reset_times: 0 });
      state.reset_list.sort((left, right) => Number(left.version) - Number(right.version));
    }
    const encoded = serializedBinary(codec.pack('pb_leaser_star_up', state));
    modules.set(STAR_UP_MODULE_ID, encoded);
    return state;
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      ensureArrayModule(modules, HERO_MODULE_ID, 7);
      ensureArrayModule(modules, LEASE_MODULE_ID, 1);
      readHeroLease(model);
      readLeaseRole(model);
      const starUp = ensureStarUpLoginState(modules);
      model.state.modules.value = [...modules];
      return {
        heroFuncTid: HERO_FUNC_TID,
        leaseFuncTid: LEASE_FUNC_TID,
        resetVersions: starUp.reset_list.map(entry => Number(entry.version))
      };
    });
  }

  function nextStar(definition, quality, star) {
    const currentKey = tables.starKey(definition.configTid, quality, star);
    const currentIndex = definition.starRows.findIndex(entry => entry.key === currentKey);
    if (currentIndex < 0) fail(CODE_STATE, 'Leaser object current star is not configured');
    const next = definition.starRows[currentIndex + 1];
    if (!next) fail(CODE_STATE, 'Leaser object is already at maximum star');
    return { current: definition.starRows[currentIndex], next };
  }

  function updateHeroObject(model, definition) {
    const state = readHeroLease(model);
    if (!state) fail(CODE_STATE, 'Hero is not leased');
    const matches = (state.lease_heroes ?? []).filter(info => {
      const outer = Number(info?.hero_tid ?? 0);
      const inner = Number(info?.hero?.hero_tid ?? 0);
      return outer === definition.developTid || inner === definition.developTid;
    });
    if (matches.length !== 1) fail(CODE_STATE, matches.length ? 'Leased hero identity is ambiguous' : 'Hero is not leased');
    const info = matches[0];
    if (!info.hero || typeof info.hero !== 'object') fail(CODE_STATE, 'Leased hero data is missing');
    if (Number(info.hero.hero_tid) !== definition.developTid) fail(CODE_STATE, 'Leased hero identity does not match');
    return { state, object: info.hero };
  }

  function updateGenericObject(model, definition) {
    const state = readLeaseRole(model);
    if (!state) fail(CODE_STATE, 'Leaser object is not leased');
    const contract = UNIT_TYPES[definition.type];
    if (!contract) fail(CODE_STATE, 'Leaser development type is unsupported');
    const matches = [];
    for (const role of state.unit_role ?? []) {
      if (Number(role?.type) !== definition.type) continue;
      for (const takeInfo of role.take_info ?? []) {
        const bytes = Buffer.from(takeInfo?.unit ?? '', 'base64');
        if (!bytes.length) fail(CODE_STATE, `Leased ${contract.label} data is missing`);
        let object;
        try { object = codec.unpack(contract.schema, bytes); }
        catch { fail(CODE_STATE, `Leased ${contract.label} data is invalid`); }
        if (Number(object?.tid) === definition.developTid) matches.push({ takeInfo, object });
      }
    }
    if (matches.length !== 1) {
      fail(CODE_STATE, matches.length ? 'Leased object identity is ambiguous' : 'Leaser object is not leased');
    }
    return { state, ...matches[0], contract };
  }

  function updateHeroLineups(model, developTid, next) {
    const changed = [];
    for (const { lineup, play } of lineupCollections(model)) {
      let lineupChanged = false;
      for (const team of teamLists(lineup)) {
        for (const entry of team?.lease_fighter_list ?? []) {
          if (Number(entry?.hero?.hero_tid) !== developTid) continue;
          entry.hero.star = next.star;
          entry.hero.quality = next.quality;
          lineupChanged = true;
        }
      }
      if (lineupChanged && play) changed.push(structuredClone(lineup));
    }
    return changed;
  }

  function updateGenericLineups(model, definition, next, schema) {
    const changed = [];
    const contract = UNIT_TYPES[definition.type];
    for (const { lineup, play } of lineupCollections(model)) {
      let lineupChanged = false;
      for (const team of teamLists(lineup)) {
        for (const unit of team?.[contract.lineupField] ?? []) {
          if (Number(unit?.type) !== definition.type || Number(unit?.tid) !== definition.developTid) continue;
          const bytes = Buffer.from(unit.unit ?? '', 'base64');
          if (!bytes.length) fail(CODE_STATE, `Lineup leased ${contract.label} data is missing`);
          let object;
          try { object = codec.unpack(schema, bytes); }
          catch { fail(CODE_STATE, `Lineup leased ${contract.label} data is invalid`); }
          if (Number(object?.tid) !== definition.developTid) fail(CODE_STATE, `Lineup leased ${contract.label} identity does not match`);
          object.star = next.star;
          object.quality = next.quality;
          unit.unit = codec.pack(schema, object).toString('base64');
          lineupChanged = true;
        }
      }
      if (lineupChanged && play) changed.push(structuredClone(lineup));
    }
    return changed;
  }

  function resetBaseLevels(definition) {
    let row;
    let quality;
    if (definition.type === 1) {
      row = heroTables?.Hero?.get(definition.developTid);
      quality = Number(row?.quality ?? NaN);
    } else if (definition.type === 2) {
      row = typeof artifactTables?.artifact === 'function'
        ? artifactTables.artifact(definition.developTid)
        : artifactTables?.Artifact?.get(definition.developTid);
      quality = Number(artifactTables?.qualityOf?.(definition.developTid) ?? NaN);
    } else {
      row = definition.type === 3
        ? PET_RESET_BASES.get(definition.developTid)
        : ELVES_RESET_BASES.get(definition.developTid);
      quality = Number(definition.type === 3 ? row?.quality : row?.quality);
    }
    const star = levelValue(definition.type === 1 || definition.type === 2 ? row?.star ?? row?.init_star : row?.star,
      'leaser reset base star');
    if (!Number.isSafeInteger(quality) || quality < 0 || quality > 999) {
      fail(CODE_STATE, 'Leaser reset base quality is not configured');
    }
    // HeroTable/PetTable/ItemTable express quality in tens (30..60), while
    // LeaserStarUpTable keys and pb_lease_* objects use the tier code (3..6).
    const qualityTier = quality >= 10 ? quality / 10 : quality;
    if (!Number.isSafeInteger(qualityTier) || qualityTier <= 0) {
      fail(CODE_STATE, 'Leaser reset base quality tier is invalid');
    }
    return { star, quality: qualityTier };
  }

  function resetTransition(definition, currentQuality, currentStar) {
    const base = resetBaseLevels(definition);
    const baseIndex = definition.starRows.findIndex(row => row.quality === base.quality && row.star === base.star);
    const currentIndex = definition.starRows.findIndex(row => row.quality === currentQuality && row.star === currentStar);
    if (baseIndex < 0) fail(CODE_STATE, 'Leaser object initial row is not configured');
    if (currentIndex < 0) fail(CODE_STATE, 'Leaser object current reset history is not configured');
    if (currentIndex <= baseIndex) fail(CODE_STATE, 'Leaser object has no retained upgrades to reset');
    let refund = 0;
    for (const row of definition.starRows.slice(baseIndex + 1, currentIndex + 1)) {
      refund += row.costNum;
      if (!Number.isSafeInteger(refund)) fail(CODE_STATE, 'Leaser reset refund is too large');
    }
    if (refund <= 0) fail(CODE_STATE, 'Leaser reset refund rows are missing');
    return { base, refund };
  }

  function assertOverallChampionResetAllowed(model, db, at) {
    const stateTable = db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name='overall_pvp_state'").get();
    if (!stateTable) return;
    const state = db.prepare('SELECT init_index FROM overall_pvp_state WHERE role_id=?').get(Number(model.state.roleId));
    // OverallChampionUtils.CheckCanReset permits an uninitialised champion
    // lineup. Once a lineup was initialised, the final stage locks it. This
    // server has no live overall-PVP fight producer, so IsFighting cannot be
    // true here; supported 101105 only refreshes the configured candidates.
    if (!state || Number(state.init_index) !== 1) return;
    const cycle = resolveOverallPvpCycle(overallPvpTables, at, { version: 0 });
    if (overallPvpStageInGroup(overallPvpTables, cycle?.stage?.stage, 'finals')) {
      fail(CODE_STATE, 'Leaser reset is locked by the overall champion final');
    }
  }

  function applyReset(model, definition, base) {
    const leased = definition.type === 1 ? updateHeroObject(model, definition) : updateGenericObject(model, definition);
    leased.object.quality = base.quality;
    leased.object.star = base.star;
    if (definition.type === 1) {
      writeHeroLease(model, leased.state);
      return {
        hero_lease_ret: {
          lease: leased.state,
          lineup: updateHeroLineups(model, definition.developTid, base)
        }
      };
    }
    leased.takeInfo.unit = codec.pack(leased.contract.schema, leased.object).toString('base64');
    writeLeaseRole(model, leased.state);
    return {
      lease_ret: {
        changed_lineups: updateGenericLineups(model, definition, base, leased.contract.schema),
        lease_info: leased.state
      }
    };
  }

  function reset(request, commandType) {
    const version = positiveInteger(request?.version, 'leaser star-up reset version');
    const developTid = positiveInteger(request?.tid, 'leaser star-up reset target tid');
    const definition = tables.definitionForDevelopTid(developTid);
    if (!definition) fail(CODE_STATE, 'Leaser reset object is not configured');
    if (version !== definition.version) fail(CODE_STATE, 'Leaser reset version is not configured');
    const resetRows = tables.resetByVersion.get(version);
    if (!resetRows?.length) fail(CODE_STATE, 'Leaser reset cost rows are not configured');
    const at = nowSeconds();

    return store.transaction((model, db) => {
      assertOverallChampionResetAllowed(model, db, at);
      const modules = new Map(model.state.modules.value);
      const resetState = ensureStarUpLoginState(modules);
      const entry = resetState.reset_list.find(candidate => Number(candidate.version) === version);
      if (!entry) fail(CODE_STATE, 'Leaser reset daily state is missing');
      const sameDay = Number(entry.last_reset_refresh_time) > 0
        && gameDayIndex(Number(entry.last_reset_refresh_time)) === gameDayIndex(at);
      let usedTimes = sameDay ? Number(entry.cur_reset_times) : 0;
      if (!Number.isSafeInteger(usedTimes) || usedTimes < 0 || usedTimes > resetRows.length) {
        fail(CODE_STATE, 'Leaser reset daily count is invalid');
      }
      if (usedTimes >= resetRows.length) fail(CODE_STATE, 'Leaser reset daily limit is reached');
      const resetRow = resetRows[usedTimes];

      model.state.modules.value = [...modules];
      const leased = definition.type === 1 ? updateHeroObject(model, definition) : updateGenericObject(model, definition);
      const currentQuality = levelValue(leased.object.quality, 'leaser reset object quality');
      const currentStar = levelValue(leased.object.star, 'leaser reset object star');
      const transition = resetTransition(definition, currentQuality, currentStar);

      // Every eligibility and configured-history check completes before the
      // reset fee is paid. A failed fee, refund projection or response encode
      // therefore leaves both the rented object and reset counter untouched.
      const consumed = consumeResources(model, [[resetRow.cost, resetRow.costNum]], 301, { codec, now });
      const refunded = grantResources(model, [[definition.costItem, transition.refund]], resourceTables, { codec });
      const resetObject = applyReset(model, definition, transition.base);

      usedTimes += 1;
      entry.last_reset_refresh_time = at;
      entry.cur_reset_times = usedTimes;
      modules.set(STAR_UP_MODULE_ID, serializedBinary(codec.pack('pb_leaser_star_up', resetState)));
      model.state.modules.value = [...modules];

      const value = {
        res: { changes: [...consumed.changes, ...refunded.changes], is_overflow: false },
        reset_data: {
          version,
          last_reset_refresh_time: at,
          cur_reset_times: usedTimes
        },
        ...resetObject
      };
      const data = codec.pack('pb_leaser_star_up_reset_rev', value);
      log({
        event: 'leaser_star_up_reset_committed',
        commandType,
        developTid,
        configTid: definition.configTid,
        kind: definition.leaseKind,
        from: { quality: currentQuality, star: currentStar },
        to: transition.base,
        resetRow: resetRow.tid,
        resetCost: resetRow.costNum,
        refundItem: definition.costItem,
        refund: transition.refund,
        usedTimes
      });
      return {
        schema: 'pb_leaser_star_up_reset_rev',
        value,
        data,
        valueForLog: {
          developTid,
          kind: definition.leaseKind,
          resetRow: resetRow.tid,
          resetCost: resetRow.costNum,
          refundItem: definition.costItem,
          refund: transition.refund,
          usedTimes
        }
      };
    });
  }

  function starUp(request) {
    const version = positiveInteger(request?.version, 'leaser star-up version');
    const developTid = positiveInteger(request?.tid, 'leaser star-up target tid');
    const definition = tables.definitionForDevelopTid(developTid);
    if (!definition) fail(CODE_STATE, 'Leaser development object is not configured');
    if (version !== definition.version) fail(CODE_STATE, 'Leaser star-up version is not configured');

    return store.transaction(model => {
      const leased = definition.type === 1 ? updateHeroObject(model, definition) : updateGenericObject(model, definition);
      const currentQuality = levelValue(leased.object.quality, 'leaser object quality');
      const currentStar = levelValue(leased.object.star, 'leaser object star');
      const transition = nextStar(definition, currentQuality, currentStar);
      const consumed = consumeResources(model, [[definition.costItem, transition.next.costNum]], 301, { codec, now });

      let value;
      if (definition.type === 1) {
        leased.object.quality = transition.next.quality;
        leased.object.star = transition.next.star;
        writeHeroLease(model, leased.state);
        const changed = updateHeroLineups(model, developTid, transition.next);
        value = {
          res: { changes: consumed.changes, is_overflow: false },
          hero_lease_ret: { lease: leased.state, lineup: changed }
        };
      } else {
        leased.object.quality = transition.next.quality;
        leased.object.star = transition.next.star;
        leased.takeInfo.unit = codec.pack(leased.contract.schema, leased.object).toString('base64');
        writeLeaseRole(model, leased.state);
        const changed = updateGenericLineups(model, definition, transition.next, leased.contract.schema);
        value = {
          res: { changes: consumed.changes, is_overflow: false },
          lease_ret: { changed_lineups: changed, lease_info: leased.state }
        };
      }

      const data = codec.pack('pb_leaser_star_up_rev', value);
      log({
        event: 'leaser_star_up_committed',
        developTid,
        configTid: definition.configTid,
        kind: definition.leaseKind,
        from: { quality: currentQuality, star: currentStar },
        to: { quality: transition.next.quality, star: transition.next.star },
        costItem: definition.costItem,
        costNum: transition.next.costNum
      });
      return {
        schema: 'pb_leaser_star_up_rev',
        value,
        data,
        valueForLog: { developTid, kind: definition.leaseKind, costItem: definition.costItem, costNum: transition.next.costNum }
      };
    });
  }

  async function decode(type, data, { unpack, etf } = {}) {
    if (!SUPPORTED.includes(Number(type))) fail(CODE_INVALID, 'Unsupported leaser star-up command');
    if (typeof unpack !== 'function') fail(CODE_STATE, 'Leaser star-up protobuf decoder is unavailable');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) fail(CODE_INVALID, 'Leaser star-up request is empty');
    let payload = input;
    if (input[0] === 131) {
      if (typeof etf !== 'function') fail(CODE_STATE, 'Leaser star-up ETF decoder is unavailable');
      payload = await etf(input);
    }
    if (payload?.value?.type === 'Buffer') payload = Buffer.from(payload.value.data);
    else if (payload?.type === 'Buffer' && Array.isArray(payload.data)) payload = Buffer.from(payload.data);
    else if (!Buffer.isBuffer(payload)) fail(CODE_INVALID, 'Leaser star-up request payload is invalid');
    const commandType = Number(type);
    const schema = commandType === COMMAND_STAR_UP
      ? 'pb_leaser_star_up_req'
      : 'pb_leaser_star_up_reset_req';
    return unpack(schema, payload);
  }

  function execute(type, input) {
    const commandType = Number(type);
    if (commandType === COMMAND_STAR_UP) return starUp(input);
    if (commandType === COMMAND_RESET) return reset(input, commandType);
    fail(CODE_INVALID, 'Unsupported leaser star-up command');
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    requestSchema: type => Number(type) === COMMAND_STAR_UP
      ? 'pb_leaser_star_up_req'
      : Number(type) === COMMAND_RESET ? 'pb_leaser_star_up_reset_req' : null,
    ensureLoginState,
    decode,
    execute
  };
}

export const LEASER_STAR_UP_COMMANDS = SUPPORTED;
