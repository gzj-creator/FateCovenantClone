import { GameError } from './hero-progression.mjs';
import { encodeEtfInteger } from '../protocol/game-codec.mjs';
import { grantResources } from './resources.mjs';
import {
  createFantasyEquipmentInventory,
  FANTASY_EQUIP_TYPE_NORMAL,
  FANTASY_EQUIP_TYPE_SP_GOD,
  FANTASY_EQUIP_TYPE_UNIQUE
} from './fantasy-equipment-inventory.mjs';
import { resolveDemigodActVersion, resolveFantasyActVersion } from './fantasy-act-tables.mjs';

export const FANTASY_ACT_STATE_KEY = 'fantasyActState';
export const FANTASY_ACT_STATE_VERSION = 1;
export const ACTIVITY_LOGIN_MODULE_ID = 183;
export const SERVER_DAY_SECONDS = 86400;
export const SERVER_RESET_OFFSET_SECONDS = 10800;
// Integration assumption: M6 owns the module-183 entry framing and may revise
// this ordering once the client decoder order is independently proven.
export const DEMIGOD_LOGIN_BLOCK_SCHEMAS = Object.freeze([
  'pb_demigod_act', 'pb_demigod_act_trial_data', 'pb_marbles_award_info'
]);
export const FANTASY_LOGIN_BLOCK_SCHEMAS = Object.freeze([
  'pb_fantasy_equip_act', 'pb_fantasy_equip_act_trial_data', 'pb_marbles_award_info'
]);

const INT32_MAX = 2147483647;
const fail = (code, message) => { throw new GameError(code, message); };
const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const clone = value => structuredClone(value);

export function serverDay(seconds) {
  const value = Number(seconds);
  if (!Number.isSafeInteger(value) || value < 0) fail(5, 'Invalid server time');
  return Math.floor((value + SERVER_RESET_OFFSET_SECONDS) / SERVER_DAY_SECONDS);
}

export function safeCount(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const text = typeof value === 'bigint' ? value.toString() : String(value ?? 0);
  if (!/^\d+$/.test(text)) fail(1, `Invalid ${field}`);
  const number = BigInt(text);
  if (number < BigInt(min) || number > BigInt(max)) fail(1, `Invalid ${field}`);
  return number;
}

export function integer(value, field, { min = 0, max = INT32_MAX } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, `Invalid ${field}`);
  return number;
}

/** ETF scalars arrive as a number, decimal string, [value], {value}, or uint64 {low,high}. */
export function normalizeEtfScalar(value, field = 'value') {
  if (Array.isArray(value)) {
    if (value.length !== 1) fail(1, `Invalid ${field}`);
    return normalizeEtfScalar(value[0], field);
  }
  if (isObject(value)) {
    if (value.low !== undefined || value.high !== undefined) {
      const low = BigInt(value.low ?? 0), high = BigInt(value.high ?? 0);
      if (low < 0n || high < 0n) fail(1, `Invalid ${field}`);
      return (high << 32n) | low;
    }
    if (value.value !== undefined) return normalizeEtfScalar(value.value, field);
  }
  if (typeof value === 'bigint') return value;
  const text = String(value ?? '');
  if (!/^\d+$/.test(text)) fail(1, `Invalid ${field}`);
  return BigInt(text);
}

function emptyActivity(kind, actTid, businessVersion, seconds, configuredMarblesActivityVersion) {
  const marblesActivityVersion = configuredMarblesActivityVersion ?? (kind === 'fantasy' ? businessVersion : 1);
  return {
    kind,
    act_tid: String(actTid),
    business_version: Number(businessVersion),
    created_at: seconds,
    daily: {
      refresh_day: serverDay(seconds),
      last_refresh: seconds,
      last_marbles_claim_day: -1,
      last_vote_claim_day: -1,
      marbles: { award_count: 0, big_award: false, activity_version: Number(marblesActivityVersion) }
    },
    draw: { draw_num: '0', version_draw_num: '0', total_draw_num: '0', wish_tid: '0', wish_list: [], draw_awards: [] },
    pre_choose_fantasy: '0',
    trials: {},
    tasks: { progress: '0', by_key: {}, claimed: [], records: '' },
    lifetime: { draw_num: '0', marbles_count: 0, big_award: false }
  };
}

function tableMap(tables, name) {
  return tables?.[name] instanceof Map ? tables[name] : null;
}

function rowByKey(map, key) {
  if (!(map instanceof Map)) return null;
  return map.get(Number(key)) ?? map.get(String(key)) ?? null;
}

function awardRows(row, names = ['award', 'awards', 'day_award', 'draw_award', 'choose_award']) {
  for (const name of names) {
    const value = row?.[name];
    if (Array.isArray(value)) {
      if (value.every(entry => Number.isSafeInteger(Number(entry)) && Number(entry) > 0)) return value.map(entry => [Number(entry), 1]);
      if (value.length === 2 && Number.isSafeInteger(Number(value[0])) && Number.isSafeInteger(Number(value[1]))) return [value];
      if (value.every(entry => Array.isArray(entry) && entry.length >= 2)) return value;
    }
  }
  return [];
}

function trialConfig(kind, tables, tidValue, businessVersion) {
  const tid = integer(tidValue, 'trial tid', { min: 1 });
  const map = tableMap(tables, kind === 'demigod' ? 'DemigodTrial' : 'FantasyEquipTrial');
  if (!map) fail(5, 'Fantasy activity trial configuration is unavailable');
  const row = rowByKey(map, tid);
  if (!row) fail(306, 'Unknown fantasy activity trial');
  const draw = rowByKey(tableMap(tables, kind === 'demigod' ? 'DemigodDraw' : 'FantasyEquipActDraw'), businessVersion);
  const range = Array.isArray(draw?.range) ? draw.range.map(Number) : [];
  if (!range.includes(tid)) fail(306, 'Fantasy activity trial is not part of the current version');
  return { tid, row };
}

function damageRows(kind, tables, trialTid) {
  const map = tableMap(tables, kind === 'demigod' ? 'DemigodTrialDamage' : 'FantasyEquipTrialDamage');
  if (!map) fail(5, 'Fantasy activity trial reward configuration is unavailable');
  return [...map.values()].filter(row => Number(row?.challenge) === Number(trialTid));
}

function qualityOf(tables, equip) {
  const definition = tables.FantasyEquip?.get(Number(equip?.tid));
  const item = tables.Item?.get(Number(equip?.tid));
  return Number(equip?.quality ?? item?.quality ?? definition?.quality ?? 0);
}

function typeOf(tables, equip) {
  return Number(tables.FantasyEquip?.get(Number(equip?.tid))?.type ?? 0);
}

export function createFantasyActSharedService({
  store,
  codec,
  tables,
  fantasyTables = null,
  now = () => Math.floor(Date.now() / 1000),
  demigodActTid = null,
  fantasyActTid = null,
  taskDefinitions = null,
  bigMarblesAwardIndex = null,
  marblesActivityVersion = null,
  marblesRandom = Math.random,
  taskProgressProvider = null,
  assertOpen
}) {
  if (!store || typeof store.transaction !== 'function') throw new Error('Fantasy activity store is required');
  if (!codec || typeof codec.pack !== 'function' || typeof codec.unpack !== 'function') throw new Error('Fantasy activity codec is required');
  if (!(tables?.Item instanceof Map) || !(tables?.FantasyEquip instanceof Map)) throw new Error('Fantasy activity equipment tables are required');
  if (typeof assertOpen !== 'function') throw new Error('Fantasy activity assertOpen callback is required');
  if (typeof marblesRandom !== 'function') throw new Error('Fantasy activity marbles random source is required');
  const inventory = createFantasyEquipmentInventory({ codec, tables });
  const allTables = { ...tables, ...(fantasyTables ?? {}) };

  function configuredActivity(kind, explicit = null, { allowBusinessVersion = false } = {}) {
    const value = explicit ?? (kind === 'demigod' ? demigodActTid : fantasyActTid);
    if (value === null || value === undefined) fail(5, 'Fantasy activity tid is not configured');
    const tid = integer(value, 'activity tid', { min: 1 });
    if (kind === 'demigod') {
      if (!(allTables.DemigodAct instanceof Map) || !(allTables.DemigodDraw instanceof Map)
        || !(allTables.DemigodActVersionByActivityTid instanceof Map)
        || !(allTables.DemigodActActivityTidByVersion instanceof Map)) {
        fail(5, 'Demigod activity schedule configuration is unavailable');
      }
      let activityTid, version;
      if (allTables.DemigodActVersionByActivityTid.has(tid)) {
        activityTid = tid;
        version = allTables.DemigodActVersionByActivityTid.get(tid);
      } else if (allowBusinessVersion) {
        version = resolveDemigodActVersion(allTables, tid);
        if (version === null) fail(306, 'Unknown demigod activity version');
        activityTid = allTables.DemigodActActivityTidByVersion.get(version);
      } else {
        fail(306, 'Public demigod act_tid must be an ActivityTable func=102 id');
      }
      if (!Number.isSafeInteger(activityTid) || !(allTables.DemigodActSchedule instanceof Map)
        || !allTables.DemigodActSchedule.has(activityTid)) {
        fail(5, 'Demigod activity schedule mapping is incomplete');
      }
      if (!rowByKey(allTables.DemigodAct, version) || !rowByKey(allTables.DemigodDraw, version)
        || Number(allTables.DemigodDraw.get(version)?.tid ?? version) !== version) {
        fail(5, 'Demigod Draw and Act configuration do not match');
      }
      return { activityTid, businessVersion: version };
    }
    if (!(allTables.FantasyEquipActDraw instanceof Map) || !(allTables.FantasyEquipActPre instanceof Map)
      || !(allTables.FantasyActVersionByActivityTid instanceof Map)) {
      fail(5, 'Fantasy activity version configuration is unavailable');
    }
    const versionByActivityTid = allTables.FantasyActVersionByActivityTid;
    const activityTidByVersion = allTables.FantasyActActivityTidByVersion;
    if (!(activityTidByVersion instanceof Map)) fail(5, 'Fantasy activity reverse version mapping is unavailable');
    let activityTid, version;
    if (versionByActivityTid.has(tid)) {
      activityTid = tid;
      version = versionByActivityTid.get(tid);
    } else if (allowBusinessVersion) {
      version = resolveFantasyActVersion(allTables, tid);
      if (version === null) fail(306, 'Unknown fantasy activity version');
      activityTid = activityTidByVersion.get(version);
    } else {
      fail(306, 'Public fantasy act_tid must be an ActivityTable func=74 id');
    }
    if (version === null) fail(306, 'Unknown fantasy activity version');
    if (!Number.isSafeInteger(activityTid) || !(allTables.FantasyActSchedule instanceof Map)
      || !allTables.FantasyActSchedule.has(activityTid)) {
      fail(5, 'Fantasy activity schedule mapping is incomplete');
    }
    const draw = rowByKey(allTables.FantasyEquipActDraw, version);
    const pre = rowByKey(allTables.FantasyEquipActPre, version);
    if (!draw || !pre || Number(draw.tid ?? version) !== version || Number(pre.tid ?? version) !== version) {
      fail(5, 'Fantasy activity Draw and Pre configuration do not match');
    }
    return { activityTid, businessVersion: version };
  }

  function assertActivityOpen(model, kind, identity, seconds, event) {
    let activityTid = null, row = null;
    if (kind === 'fantasy') {
      activityTid = identity.activityTid;
      row = activityTid === null ? null : allTables.FantasyActSchedule?.get(activityTid) ?? null;
    } else {
      activityTid = identity.activityTid;
      row = allTables.DemigodActSchedule?.get(activityTid) ?? null;
    }
    const result = assertOpen({
      model, kind, actTid: identity.activityTid, activityTid,
      businessVersion: identity.businessVersion, row, seconds, event
    });
    if (result === false) fail(305, 'Fantasy activity is closed');
  }

  function root(model, seconds) {
    model.state[FANTASY_ACT_STATE_KEY] ??= { version: FANTASY_ACT_STATE_VERSION, kinds: {} };
    const state = model.state[FANTASY_ACT_STATE_KEY];
    if (!isObject(state) || state.version !== FANTASY_ACT_STATE_VERSION || !isObject(state.kinds)) {
      fail(5, 'Fantasy activity persistent state is invalid');
    }
    state.kinds ??= {};
    return { state, seconds };
  }

  function activity(model, kind, seconds, actTidValue = null, event = 'activity', options = {}) {
    if (kind !== 'demigod' && kind !== 'fantasy') fail(5, 'Unknown fantasy activity kind');
    const identity = configuredActivity(kind, actTidValue, options);
    assertActivityOpen(model, kind, identity, seconds, event);
    const holder = root(model, seconds);
    let current = holder.state.kinds[kind];
    if (!current) current = holder.state.kinds[kind] = emptyActivity(
      kind, identity.activityTid, identity.businessVersion, seconds, marblesActivityVersion
    );
    current.business_version ??= Number(current.act_tid);
    if (String(current.act_tid) !== String(identity.activityTid)
      || Number(current.business_version) !== Number(identity.businessVersion)) {
      const lifetime = clone(current.lifetime ?? {});
      current = emptyActivity(kind, identity.activityTid, identity.businessVersion, seconds, marblesActivityVersion);
      current.lifetime = lifetime;
      holder.state.kinds[kind] = current;
    }
    const day = serverDay(seconds);
    if (!Number.isSafeInteger(Number(current.daily?.refresh_day)) || day > Number(current.daily.refresh_day)) {
      current.daily.refresh_day = day;
      current.daily.last_refresh = seconds;
    }
    current.trials ??= {};
    current.tasks ??= { progress: '0', by_key: {}, claimed: [], records: '' };
    current.tasks.by_key ??= {};
    current.pre_choose_fantasy ??= '0';
    current.draw ??= emptyActivity(
      kind, identity.activityTid, identity.businessVersion, seconds, marblesActivityVersion
    ).draw;
    return {
      current, state: holder.state, actTid: identity.activityTid,
      businessVersion: identity.businessVersion, day
    };
  }

  function trialState(current, tid) {
    current.trials[String(tid)] ??= {
      tid: Number(tid), fantasy_equip: '0', bless_list: [], max_damage: '0', receive_list: []
    };
    const trial = current.trials[String(tid)];
    trial.bless_list ??= [];
    trial.receive_list ??= [];
    return trial;
  }

  function grantAwards(model, awards, current) {
    const resourceRows = [], changes = [], created = [];
    for (const entry of awards ?? []) {
      const tid = integer(entry?.[0] ?? entry?.tid, 'reward tid', { min: 1 });
      const num = integer(entry?.[1] ?? entry?.num, 'reward quantity', { min: 1 });
      if (tables.FantasyEquip.has(tid)) {
        for (let index = 0; index < num; index++) {
          const equip = inventory.create(current, tid);
          created.push(equip);
          changes.push({
            tid: String(tid), new_num: '1', diff_num: '1',
            extra: codec.pack('pb_fantasy_equip', equip)
          });
        }
      } else resourceRows.push([tid, num]);
    }
    if (resourceRows.length) changes.push(...grantResources(model, resourceRows, tables).changes);
    return { changes, equipment: created };
  }

  function allActivityReferences(model) {
    const container = model?.state?.[FANTASY_ACT_STATE_KEY]?.kinds;
    const references = [];
    if (!isObject(container)) return references;
    for (const [kind, activityState] of Object.entries(container)) {
      for (const [trialTid, trial] of Object.entries(activityState?.trials ?? {})) {
        if (Number(trial.fantasy_equip) > 0) references.push({ kind: 'activity_main', activity: kind, trial_tid: Number(trialTid), uid: Number(trial.fantasy_equip) });
        for (const uid of trial.bless_list ?? []) references.push({ kind: 'activity_bless', activity: kind, trial_tid: Number(trialTid), uid: Number(uid) });
      }
    }
    return references;
  }

  function referencesFor(model, uid, skip = null) {
    return allActivityReferences(model).filter(ref => ref.uid === Number(uid) &&
      !(skip?.kind === ref.kind && skip?.trial_tid === ref.trial_tid &&
        (skip?.activity === undefined || skip.activity === ref.activity)));
  }

  function ensureNoForeignReference(model, uid, skip = null) {
    const current = inventory.read(model);
    const ordinary = inventory.referenceDetails(model, current, uid);
    if (ordinary.length || referencesFor(model, uid, skip).length) fail(308, 'Fantasy equipment is still referenced');
  }

  function claimDailyMarbles(kind, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'claim_daily_marbles');
      const daily = info.current.daily, marbles = daily.marbles;
      if (Number(daily.last_marbles_claim_day) === info.day) fail(307, 'Daily marbles reward was already claimed');
      const constMap = tableMap(allTables, 'MarblesConst');
      const rows = tableMap(allTables, 'Marbles');
      if (!constMap || !rows) { fail(5, 'Marbles activity configuration is unavailable'); }
      const config = [...constMap.values()][0];
      const limit = integer(config.max_run_time, 'marbles max run time', { min: 1 });
      const configured = [...rows.values()].filter(row => Number(row?.version ?? row?.group ?? 1) === Number(marbles.activity_version ?? 1));
      const source = configured.length ? configured : [...rows.values()];
      const index = Number(marbles.award_count);
      if (!Number.isSafeInteger(index) || index < 0) fail(5, 'Invalid persistent marbles award count');
      if (index >= limit) fail(307, 'Marbles daily reward limit reached');
      if (index >= source.length) fail(307, 'Marbles daily reward limit reached');
      const awards = awardRows(source[index]);
      if (!awards.length) fail(5, 'Marbles reward configuration is missing');
      const current = inventory.read(model);
      const granted = grantAwards(model, awards, current);
      inventory.save(model, current);
      marbles.award_count = index + 1;
      info.current.lifetime.marbles_count = Number(info.current.lifetime.marbles_count ?? 0) + 1;
      daily.last_marbles_claim_day = info.day;
      const value = { changes: granted.changes, is_overflow: false };
      return { schema: 'pb_res_to_client', value, data: codec.pack('pb_res_to_client', value), equipment: granted.equipment, marbles: clone(marbles), awardThreshold: Number(config.award_threshold ?? 0) };
    });
  }

  function claimBigMarbles(kind, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'claim_big_marbles');
      const marbles = info.current.daily.marbles;
      if (marbles.big_award) fail(307, 'Big marbles reward was already claimed');
      const constMap = tableMap(allTables, 'MarblesConst');
      if (!constMap) fail(5, 'Marbles activity configuration is unavailable');
      const config = [...constMap.values()][0];
      const threshold = integer(config.award_threshold ?? 0, 'marbles threshold');
      if (Number(marbles.award_count) < threshold) fail(307, 'Marbles reward threshold is not reached');
      const awards = awardRows(config, ['award', 'awards']);
      if (!awards.length) fail(5, 'Big marbles reward configuration is missing');
      if (awards.some(([tid]) => !tables.FantasyEquip.has(Number(tid)))) {
        fail(5, 'Big marbles reward contains a non-equipment item');
      }
      let awardIndex;
      if (bigMarblesAwardIndex !== null) {
        awardIndex = Math.abs(integer(bigMarblesAwardIndex, 'big marbles award index'));
      } else {
        const randomValue = Number(marblesRandom());
        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) fail(5, 'Invalid marbles random value');
        awardIndex = Math.floor(randomValue * awards.length);
      }
      const selected = awards[awardIndex % awards.length];
      const current = inventory.read(model);
      const granted = grantAwards(model, [selected], current);
      inventory.save(model, current);
      marbles.big_award = true;
      info.current.lifetime.big_award = true;
      const value = { changes: granted.changes, is_overflow: false };
      return { schema: 'pb_res_to_client', value, data: codec.pack('pb_res_to_client', value), equipment: granted.equipment, marbles: clone(marbles) };
    });
  }

  function claimVoteAward(kind, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'claim_vote_award');
      if (Number(info.current.pre_choose_fantasy ?? 0) > 0) fail(307, 'Fantasy activity vote reward was already claimed');
      const choices = tableMap(allTables, 'FantasyEquipActPreShow');
      if (!choices) fail(5, 'Fantasy activity pre-choice configuration is unavailable');
      const candidates = [...choices.values()]
        .filter(row => Number(row?.version) === Number(info.businessVersion))
        .sort((left, right) => Number(left.tid) - Number(right.tid));
      if (!candidates.length) fail(5, 'Fantasy activity pre-choice candidates are missing for this version');
      const weights = candidates.map((row, index) => integer(row.weight, `pre-choice weight ${index}`, { min: 1 }));
      const randomValue = Number(marblesRandom());
      if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) fail(5, 'Invalid activity random value');
      let roll = Math.floor(randomValue * weights.reduce((sum, value) => sum + value, 0));
      let selected = candidates.at(-1);
      for (let index = 0; index < candidates.length; index++) {
        if (roll < weights[index]) { selected = candidates[index]; break; }
        roll -= weights[index];
      }
      const selectedTid = integer(selected.fantasy_equip, 'pre-chosen fantasy equipment tid', { min: 1 });
      if (!tables.FantasyEquip.has(selectedTid)) fail(5, 'PreShow references unknown fantasy equipment');
      const configured = allTables.FantasyEquipActPre ?? allTables.Pre;
      if (!(configured instanceof Map)) fail(5, 'Fantasy activity vote reward configuration is unavailable');
      const row = rowByKey(configured, info.businessVersion);
      if (!row) fail(5, 'Fantasy activity vote reward configuration is missing for this version');
      const awards = awardRows(row, ['choose_award', 'award', 'awards']);
      if (!awards.length) fail(5, 'Fantasy activity vote reward configuration is missing');
      const current = inventory.read(model);
      // Pre.choose_award is an AwardKit list, not a set of alternatives. The
      // server-chosen PreShow fantasy id selects the equipment; the complete
      // version reward list is granted in the same transaction.
      const granted = grantAwards(model, awards, current);
      inventory.save(model, current);
      info.current.daily.last_vote_claim_day = info.day;
      info.current.pre_choose_fantasy = String(selectedTid);
      const value = { changes: granted.changes, is_overflow: false };
      return {
        schema: 'pb_res_to_client', value, data: codec.pack('pb_res_to_client', value),
        equipment: granted.equipment, pre_choose_fantasy: selectedTid
      };
    });
  }

  function claimTrialReward(kind, input, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'claim_trial_reward');
      const { tid } = trialConfig(kind, allTables, input?.tid, info.businessVersion);
      const receiveTid = integer(input?.receive_tid, 'trial receive tid', { min: 1 });
      const trial = trialState(info.current, tid);
      const row = damageRows(kind, allTables, tid).find(value => Number(value.tid) === receiveTid);
      if (!row) fail(306, 'Unknown fantasy trial reward');
      if (trial.receive_list.includes(receiveTid)) fail(307, 'Fantasy trial reward was already claimed');
      if (BigInt(trial.max_damage ?? 0) < BigInt(row.damage ?? 0)) fail(307, 'Fantasy trial damage threshold is not reached');
      const awards = awardRows(row);
      if (!awards.length) fail(5, 'Fantasy trial reward configuration is missing');
      const current = inventory.read(model);
      const granted = grantAwards(model, awards, current);
      inventory.save(model, current);
      trial.receive_list.push(receiveTid);
      const value = { changes: granted.changes, is_overflow: false };
      return { schema: 'pb_res_to_client', value, data: codec.pack('pb_res_to_client', value), equipment: granted.equipment, trial: clone(trial) };
    });
  }

  function wearTrialEquipment(kind, input, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'wear_trial_equipment');
      const { tid, row } = trialConfig(kind, allTables, input?.tid, info.businessVersion);
      const id = input?.fantasy_id;
      const uid = integer(id?.uid, 'fantasy equipment uid', { min: 1 });
      const equipTid = integer(id?.tid, 'fantasy equipment tid', { min: 1 });
      const current = inventory.read(model);
      const equip = inventory.find(current, { uid, tid: equipTid });
      const type = typeOf(tables, equip);
      if (type !== FANTASY_EQUIP_TYPE_UNIQUE && type !== FANTASY_EQUIP_TYPE_SP_GOD) fail(308, 'Only unique or SP fantasy equipment can be worn in a trial');
      const definition = tables.FantasyEquip.get(equipTid);
      if (type === FANTASY_EQUIP_TYPE_UNIQUE && Number(definition?.hero) !== Number(row.hero)) fail(308, 'Fantasy equipment hero does not match the trial');
      ensureNoForeignReference(model, uid, { kind: 'activity_main', activity: kind, trial_tid: tid });
      const trial = trialState(info.current, tid);
      const oldBless = [...trial.bless_list];
      trial.fantasy_equip = String(uid);
      trial.bless_list = [];
      for (const value of current.data.equips) value.bless = value.bless.filter(blessUid => !oldBless.includes(blessUid));
      // Remove bless references that this equipment owned in a previously replaced main instance.
      for (const value of current.data.equips) if (value.uid === uid) value.bless = [];
      inventory.save(model, current);
      const value = { challenge: clone(trial), fantasy_equip: clone(equip) };
      const schema = kind === 'demigod' ? 'pb_demigod_act_wear_back' : 'pb_fantasy_act_wear_back';
      return { schema, value, data: codec.pack(schema, value), trial: clone(trial), equipment: clone(equip) };
    });
  }

  function wearTrialBless(kind, input, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'wear_trial_bless');
      const { tid } = trialConfig(kind, allTables, input?.tid, info.businessVersion);
      const trial = trialState(info.current, tid);
      const mainUid = Number(trial.fantasy_equip);
      if (!mainUid) fail(307, 'Fantasy trial equipment is not selected');
      const current = inventory.read(model);
      const main = inventory.findUid(current, mainUid);
      const config = tables.FantasyEquipConst?.get(1);
      const count = Number(config?.bless_count ?? 2);
      const unlocks = [...(config?.bless_slot_unlock ?? [])].map(Number);
      const minQuality = Number(config?.min_bless_quality ?? 50);
      const list = input?.bless_list;
      if (!Array.isArray(list) || list.length > count) fail(1, 'Invalid trial blessing list');
      if (new Set(list.map(value => Number(value?.pos))).size !== list.length) fail(1, 'Duplicate trial blessing position');
      const next = [];
      for (const item of list) {
        const pos = integer(item?.pos, 'blessing position', { min: 1, max: count });
        if (main.star < Number(unlocks[pos - 1] ?? INT32_MAX)) fail(307, 'Trial blessing slot is locked');
        const uid = integer(item?.bless_fantasy_id?.uid, 'blessing equipment uid', { min: 1 });
        const equipTid = integer(item?.bless_fantasy_id?.tid, 'blessing equipment tid', { min: 1 });
        if (uid === mainUid) fail(308, 'Trial main equipment cannot bless itself');
        const equip = inventory.find(current, { uid, tid: equipTid });
        if (typeOf(tables, equip) !== FANTASY_EQUIP_TYPE_NORMAL || qualityOf(tables, equip) < minQuality) fail(308, 'Trial blessing equipment quality is too low');
        const currentRefs = inventory.referenceDetails(model, current, uid);
        const replacingOwnBlessing = currentRefs.every(reference => reference.kind === 'bless' && Number(reference.uid) === mainUid);
        if ((!replacingOwnBlessing && currentRefs.length) || referencesFor(model, uid, { kind: 'activity_bless', activity: kind, trial_tid: tid }).length) {
          fail(308, 'Fantasy equipment is still referenced');
        }
        if (next.includes(uid)) fail(1, 'Duplicate trial blessing equipment');
        next.push(uid);
      }
      // Detach this trial's previous blessing owner then apply the full replacement list.
      for (const value of current.data.equips) value.bless = value.bless.filter(uid => !(trial.bless_list ?? []).includes(uid));
      main.bless = next;
      trial.bless_list = next.map(String);
      inventory.save(model, current);
      const value = { challenge: clone(trial), fantasy_list: current.data.equips.filter(entry => next.includes(entry.uid)).map(clone) };
      const schema = kind === 'demigod' ? 'pb_demigod_act_wear_bless_back' : 'pb_fantasy_act_wear_bless_back';
      return { schema, value, data: codec.pack(schema, value), trial: clone(trial), equipment: value.fantasy_list };
    });
  }

  function copyTrial(kind, trialTidValue, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'copy_trial');
      const { tid, row } = trialConfig(kind, allTables, trialTidValue, info.businessVersion);
      const trial = trialState(info.current, tid);
      if (Number(trial.fantasy_equip) > 0) fail(307, 'Fantasy trial equipment is already selected');
      const current = inventory.read(model);
      let source = current.data.equips.find(equip => equip.uid === Number(model.heroInfo?.hero_list?.find(hero => Number(hero.tid) === Number(row.hero))?.fantasy_equip ?? 0));
      if (!source) {
        const candidates = current.data.equips.filter(equip => typeOf(tables, equip) === FANTASY_EQUIP_TYPE_UNIQUE && Number(tables.FantasyEquip.get(equip.tid)?.hero) === Number(row.hero));
        source = candidates[0];
      }
      if (!source) fail(306, 'No source fantasy equipment is available for this trial hero');
      const sourceRefs = inventory.referenceDetails(model, current, source.uid).filter(reference => reference.kind !== 'hero');
      if (sourceRefs.length || referencesFor(model, source.uid).length) fail(308, 'Fantasy equipment is still referenced');
      const equip = inventory.clone(current, source.uid, { bless: [] });
      inventory.save(model, current);
      trial.fantasy_equip = String(equip.uid);
      trial.bless_list = [];
      const schema = kind === 'demigod' ? 'pb_demigod_act_trial' : 'pb_fantasy_equip_act_trial';
      const value = clone(trial);
      return { schema, value, data: codec.pack(schema, value), trial: clone(trial), equipment: clone(equip) };
    });
  }

  function setWish(kind, request, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'set_wish');
      const wish = normalizeEtfScalar(request, 'wish tid');
      const map = tableMap(allTables, kind === 'demigod' ? 'DemigodDrawWish' : 'DrawWish');
      if (!map) fail(5, 'Fantasy wish configuration is unavailable');
      if (wish !== 0n && !rowByKey(map, wish)) fail(306, 'Unknown fantasy wish');
      if (kind === 'fantasy' && wish !== 0n) {
        const draw = rowByKey(tableMap(allTables, 'FantasyEquipActDraw'), info.businessVersion);
        const allowed = Array.isArray(draw?.draw_wish) ? draw.draw_wish.map(Number) : [];
        if (!allowed.includes(Number(wish))) fail(306, 'Fantasy wish is not part of the current version');
      }
      info.current.draw.wish_tid = wish.toString();
      return { schema: 'etf', value: { wish_tid: wish.toString() }, data: encodeEtfInteger(1), wish_tid: wish.toString() };
    });
  }

  function recordDraw(model, kind, event, actTidValue = null) {
    if (!event || !Number.isSafeInteger(Number(event.count)) || Number(event.count) < 1) fail(5, 'Fantasy draw event count is invalid');
    const info = activity(model, kind, Number(now()), actTidValue, 'record_draw', { allowBusinessVersion: true });
    const count = BigInt(event.count);
    info.current.draw.draw_num = (BigInt(info.current.draw.draw_num ?? 0) + count).toString();
    info.current.draw.version_draw_num = (BigInt(info.current.draw.version_draw_num ?? 0) + count).toString();
    info.current.draw.total_draw_num = (BigInt(info.current.draw.total_draw_num ?? 0) + count).toString();
    info.current.tasks.progress = (BigInt(info.current.tasks.progress ?? 0) + count).toString();
    info.current.lifetime.draw_num = (BigInt(info.current.lifetime.draw_num ?? 0) + count).toString();
    return clone(info.current.draw);
  }

  function claimDemoGodDrawAward(actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, 'demigod', seconds, actTidValue, 'claim_demigod_draw_award');
      const awards = tableMap(tables, 'DemigodDrawAward');
      if (!awards) fail(5, 'Demigod draw award configuration is unavailable');
      const rows = [...awards.values()].filter(row => Math.floor(Number(row.tid) / 1000) === Number(info.businessVersion)).sort((left, right) => Number(left.draw_num) - Number(right.draw_num));
      const row = rows.find(value => !info.current.draw.draw_awards.includes(Number(value.tid)) && BigInt(info.current.draw.version_draw_num ?? 0) >= BigInt(value.draw_num));
      if (!row) fail(307, 'No demigod draw award is available');
      const current = inventory.read(model);
      const granted = grantAwards(model, awardRows(row, ['draw_award', 'award']), current);
      inventory.save(model, current);
      info.current.draw.draw_awards.push(Number(row.tid));
      const value = { res_change: { changes: granted.changes, is_overflow: false }, draw_award_id: Number(row.tid) };
      return { schema: 'pb_demigod_act_draw_award_back', value, data: codec.pack('pb_demigod_act_draw_award_back', value), equipment: granted.equipment };
    });
  }

  function claimTask(kind, input, actTidValue = null) {
    return store.transaction(model => {
      const seconds = Number(now());
      const info = activity(model, kind, seconds, actTidValue, 'claim_task');
      const taskId = integer(input?.task_id, 'task id', { min: 1 });
      const definitions = taskDefinitions ?? (
        kind === 'fantasy' ? allTables.FantasyEquipActTask : allTables.DemigodActTask
      );
      if (!(definitions instanceof Map)) fail(5, 'Fantasy activity task configuration is unavailable');
      const row = definitions instanceof Map ? definitions.get(taskId) : definitions[taskId];
      if (!row) fail(306, 'Unknown fantasy activity task');
      if (info.current.tasks.claimed.includes(taskId)) fail(307, 'Fantasy activity task reward was already claimed');
      const taskType = integer(row.type, 'task type', { min: 1 });
      const target = integer(row.count, 'task count', { min: 1 });
      if (row.param === undefined) fail(5, 'Fantasy activity task param is missing');
      let progress;
      if (taskProgressProvider !== null) {
        if (typeof taskProgressProvider !== 'function') fail(5, 'Fantasy activity task progress provider is invalid');
        progress = taskProgressProvider({
          model, kind, task: clone(row), businessVersion: info.businessVersion,
          progress: clone(info.current.tasks)
        });
      } else {
        progress = info.current.tasks.by_key[taskProgressKey(taskType, row.param)] ?? 0;
      }
      const progressValue = BigInt(normalizeEtfScalar(progress, 'task progress'));
      if (progressValue < BigInt(target)) fail(307, 'Fantasy activity task is not complete');
      const awards = awardRows(row);
      if (!awards.length) fail(5, 'Fantasy activity task reward configuration is missing');
      const current = inventory.read(model);
      const granted = grantAwards(model, awards, current);
      inventory.save(model, current);
      info.current.tasks.claimed.push(taskId);
      if (row.records !== undefined) info.current.tasks.records = String(row.records);
      const value = { task_id: taskId, task_records: Buffer.from(info.current.tasks.records || '', 'base64'), res_change: { changes: granted.changes, is_overflow: false } };
      const schema = kind === 'demigod' ? 'pb_demigod_act_task_reward_rev' : 'pb_fantasy_act_task_reward_rev';
      return { schema, value, data: codec.pack(schema, value), equipment: granted.equipment };
    });
  }

  function taskProgressKey(type, param) {
    return `${type}:${JSON.stringify(param)}`;
  }

  /** Server-side gameplay event; callers must already hold store.transaction(). */
  function recordTaskEvent(model, kind, event, actTidValue = null) {
    const info = activity(
      model, kind, Number(now()), actTidValue, 'record_task_event', { allowBusinessVersion: true }
    );
    const type = integer(event?.type, 'task type', { min: 1 });
    const count = integer(event?.count, 'task event count', { min: 1 });
    if (event?.param === undefined) fail(1, 'Invalid task param');
    const key = taskProgressKey(type, event.param);
    const current = BigInt(info.current.tasks.by_key[key] ?? 0) + BigInt(count);
    info.current.tasks.by_key[key] = current.toString();
    return { key, progress: current.toString() };
  }

  function recordTrialDamage(model, kind, trialTidValue, damageValue, actTidValue = null) {
    const info = activity(
      model, kind, Number(now()), actTidValue, 'record_trial_damage', { allowBusinessVersion: true }
    );
    const { tid } = trialConfig(kind, allTables, trialTidValue, info.businessVersion);
    const damage = BigInt(normalizeEtfScalar(damageValue, 'trial damage'));
    if (damage < 0n) fail(1, 'Invalid trial damage');
    const trial = trialState(info.current, tid);
    if (damage > BigInt(trial.max_damage ?? 0)) trial.max_damage = damage.toString();
    return clone(trial);
  }

  function ensureState(kind, actTidValue = null) {
    return store.transaction(model => clone(activity(model, kind, Number(now()), actTidValue, 'ensure_state').current));
  }

  function createReferenceProvider() {
    return (model, uid) => referencesFor(model, uid).map(value => ({ ...value }));
  }

  /**
   * Pure payloads for the module-183 login container. The container encoder
   * lives in M6; block order below is an explicit integration assumption until
   * the client decoder ordering is proven.
   */
  function serializeLoginBlocks(kind, actTidValue = null) {
    return store.transaction(model => {
      const info = activity(model, kind, Number(now()), actTidValue, 'serialize_login_blocks');
      const trialList = Object.values(info.current.trials).map(trial => ({
        tid: Number(trial.tid),
        fantasy_equip: String(trial.fantasy_equip ?? '0'),
        bless_list: (trial.bless_list ?? []).map(String),
        max_damage: String(trial.max_damage ?? '0'),
        receive_list: (trial.receive_list ?? []).map(Number)
      }));
      const marbles = {
        award_count: Number(info.current.daily.marbles.award_count ?? 0),
        marbles_big_award: Boolean(info.current.daily.marbles.big_award),
        activity_version: Number(info.current.daily.marbles.activity_version ?? info.businessVersion)
      };
      let state, trialSchema, stateSchema;
      if (kind === 'demigod') {
        stateSchema = 'pb_demigod_act';
        trialSchema = 'pb_demigod_act_trial_data';
        state = {
          buy_limit_info: undefined,
          act_tid: Number(info.actTid),
          draw_num: Number(info.current.draw.draw_num ?? 0),
          draw_award_id: Number(info.current.draw.draw_awards.at(-1) ?? 0),
          draw_awards: (info.current.draw.draw_awards ?? []).map(Number),
          wish_tid: String(info.current.draw.wish_tid ?? '0'),
          wish_list: [],
          version_draw_num: String(info.current.draw.version_draw_num ?? '0')
        };
      } else {
        stateSchema = 'pb_fantasy_equip_act';
        trialSchema = 'pb_fantasy_equip_act_trial_data';
        state = {
          buy_limit_info: undefined,
          draw_info: {
            wish_tid: Number(info.current.draw.wish_tid ?? 0),
            normal_guarantee_times: 0,
            guarantee_progress: 0,
            all_guarantee_times: Number(info.current.draw.total_draw_num ?? 0)
          },
          pre_choose_fantasy: Number(info.current.pre_choose_fantasy ?? 0),
          task_records: Buffer.from(info.current.tasks.records ?? '', 'base64'),
          act_tid: Number(info.actTid)
        };
      }
      const blocks = [
        { index: 0, schema: stateSchema, data: codec.pack(stateSchema, state) },
        { index: 1, schema: trialSchema, data: codec.pack(trialSchema, { challenge_list: trialList }) },
        { index: 2, schema: 'pb_marbles_award_info', data: codec.pack('pb_marbles_award_info', marbles) }
      ];
      return { kind, act_tid: info.actTid, business_version: info.businessVersion, blocks };
    });
  }

  return {
    inventory, tables: allTables, ensureState,
    claimDailyMarbles, claimBigMarbles, claimVoteAward, claimTrialReward,
    wearTrialEquipment, wearTrialBless, copyTrial, setWish,
    recordDraw, claimDemoGodDrawAward, claimTask, recordTaskEvent, recordTrialDamage,
    createReferenceProvider,
    serializeLoginBlocks,
    activityReferences: model => allActivityReferences(model),
    _recordDraw: recordDraw,
    _recordTrialDamage: recordTrialDamage
  };
}
