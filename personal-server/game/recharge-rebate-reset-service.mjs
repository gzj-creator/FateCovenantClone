import { rawBinary } from '../protocol/game-codec.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeClaimKey, rechargeDayIndex, requireRechargeRequestTuple } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';

const ACTIVITY_MODULE = 92;
const CLAIM_COMMAND = 100201;
const ACT_IDS = [118001, 118002, 118003];
const ALL_OPEN_ACT_ID = 118003;
const RUNNING_STATE = 50;

function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}

function unwrapEtfBinary(bytes) {
  if (!bytes.length) return Buffer.alloc(0);
  if (bytes[0] === 0x83 && bytes[1] === 0x6d) {
    if (bytes.length < 6) throw new GameError(5, 'Rebate activity payload is truncated');
    const length = bytes.readUInt32BE(2);
    if (bytes.length !== length + 6) throw new GameError(5, 'Rebate activity payload length is invalid');
    return bytes.subarray(6);
  }
  return bytes;
}

function stateEntries(activity) {
  const result = [];
  for (const entry of activity.act_list ?? []) if (entry?.state_data) result.push(entry);
  for (const group of activity.act_parallel_list ?? []) for (const state of group.states_data ?? []) result.push({ state_data: state });
  return result;
}

function removeRebateStates(activity) {
  const ids = new Set(ACT_IDS);
  activity.act_list = (activity.act_list ?? []).filter(entry => !ids.has(Number(entry.state_data?.act_id)));
  activity.act_parallel_list = (activity.act_parallel_list ?? []).flatMap(group => {
    const states = (group.states_data ?? []).filter(state => !ids.has(Number(state.act_id)));
    return states.length ? [{ ...group, states_data: states }] : [];
  });
}

export function createRechargeRebateResetService({ store, codec, tables, calendar, now = Date.now, logger = () => {} }) {
  const configs = new Map(ACT_IDS
    .map(id => [id, tables.Activity?.get(id)])
    .filter(([, config]) => Number(config?.func) === 118));
  if (!configs.size) throw new Error('Recharge rebate-reset activity configuration is missing');
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => {
    const value = Number(now());
    return Math.floor(value > 100000000000 ? value / 1000 : value);
  };

  function activityConfig(actId) { return configs.get(Number(actId)) ?? null; }

  function selectedActId(activity, at) {
    if (calendar?.mode === 'all-open') return configs.has(ALL_OPEN_ACT_ID) ? ALL_OPEN_ACT_ID : null;
    const paused = new Set((activity.act_pause_list ?? []).map(Number));
    return ACT_IDS
      .filter(id => configs.has(id) && !paused.has(id))
      .filter(id => {
        const existing = stateEntries(activity).find(entry => Number(entry.state_data.act_id) === id)?.state_data ?? null;
        return calendar
          ? calendar.isActivityRunning(id, existing, activity, at)
          : true;
      })
      .at(-1) ?? null;
  }

  function decodeInfo(entry, actId) {
    try {
      const bytes = unwrapEtfBinary(Buffer.from(entry?.module_login_data ?? '', 'base64'));
      const info = bytes.length ? codec.unpack('pb_recharge_rebate_reset', bytes) : { act_id: actId, award_bin: Buffer.alloc(0) };
      if (Number(info.act_id) !== Number(actId)) return { act_id: actId, award_bin: Buffer.alloc(0) };
      info.act_id = actId;
      info.award_bin = Buffer.from(info.award_bin ?? '', 'base64');
      return info;
    } catch {
      return { act_id: actId, award_bin: Buffer.alloc(0) };
    }
  }

  function writeInfo(entry, info) {
    entry.module_login_data = wrapEtfBinary(codec.pack('pb_recharge_rebate_reset', info)).toString('base64');
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    const actId = selectedActId(activity, at);
    const existing = actId
      ? [...stateEntries(activity)].reverse().find(entry => Number(entry.state_data.act_id) === actId) ?? null
      : null;
    removeRebateStates(activity);
    if (!actId) return null;
    const config = activityConfig(actId);
    const window = activityWindow(config, calendar?.serverOpenedAt ?? store.serverOpenedAt);
    const state = existing?.state_data ? structuredClone(existing.state_data) : {
      act_id: actId,
      cur_state_id: RUNNING_STATE,
      history_time: [{ state_id: RUNNING_STATE, enter_time: Number(window?.start ?? at) }]
    };
    state.act_id = actId;
    state.cur_state_id = RUNNING_STATE;
    state.history_time ??= [{ state_id: RUNNING_STATE, enter_time: Number(window?.start ?? at) }];
    const entry = { state_data: state, module_login_data: '' };
    const info = decodeInfo(existing, actId);
    writeInfo(entry, info);
    activity.act_list.push(entry);
    log({ event: 'recharge_rebate_reset_login_synchronized', actId, mode: calendar?.mode ?? 'schedule' });
    return { actId, activity, entry, state, config, window, info };
  }

  function currentOpenDay(context, at) {
    const duration = Math.max(1, Number(context.config.duration_day ?? 1));
    const start = Number(context.window?.start ?? 0);
    if (!start) return 1;
    return Math.min(duration, Math.max(1, rechargeDayIndex(at) - rechargeDayIndex(start) + 1));
  }

  function contextFor(modules, actId, at) {
    const module = modules.get(ACTIVITY_MODULE);
    const activity = module ? codec.unpack('pb_act_login', rawBinary(module)) : { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    const context = synchronizeLogin(activity, at);
    if (!context || Number(context.actId) !== Number(actId)) throw new GameError(309, 'Recharge rebate-reset activity is not open');
    context.activity = activity;
    return context;
  }

  function claim(value) {
    let actId, slot;
    try { [actId, slot] = requireRechargeRequestTuple(value, 2, 'Recharge rebate-reset claim'); }
    catch { throw new GameError(1, 'Invalid recharge rebate-reset claim'); }
    if (!Number.isSafeInteger(actId) || !configs.has(actId)) throw new GameError(1, 'Invalid recharge rebate-reset activity');
    const at = currentSeconds();
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const context = contextFor(modules, actId, at);
      const config = tables.RechargeRebateResetAct?.get(Number(context.config.version));
      const awardList = config?.daily_award ?? [];
      const openDay = currentOpenDay(context, at);
      const bits = Buffer.from(context.info.award_bin ?? '', 'base64');
      const award = slot === 0 ? [config?.preview_award_item, config?.preview_award_num] : awardList[slot - 1];
      if (!Array.isArray(award) || award.length !== 2 || !award.every(n => Number.isSafeInteger(Number(n)) && Number(n) > 0)) {
        throw new GameError(1, 'Recharge rebate-reset award is invalid');
      }
      if (openDay < slot + 1) throw new GameError(311, 'Recharge rebate-reset award is not open');
      const key = rechargeClaimKey('recharge_rebate_reset', actId, slot);
      if (hasBit(bits, slot) || db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'recharge_rebate_reset', key)) {
        throw new GameError(310, 'Recharge rebate-reset award already claimed');
      }
      const res = grantResources(model, [[Number(award[0]), Number(award[1])]], tables, { codec });
      context.info.award_bin = setBit(bits, slot);
      writeInfo(context.entry, context.info);
      const updatedModules = new Map(model.state.modules.value);
      updatedModules.set(ACTIVITY_MODULE, { value: Buffer.from(codec.pack('pb_act_login', context.activity)).toJSON(), bits: 8 });
      model.state.modules.value = [...updatedModules];
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'recharge_rebate_reset', key, new Date(at * 1000).toISOString());
      const actInfo = { act_id: actId, award_bin: context.info.award_bin };
      const response = { act_info: actInfo, res };
      log({ event: 'recharge_rebate_reset_claimed', actId, openDay, slot, changes: res.changes.length });
      return { value: response, data: codec.pack('pb_recharge_rebate_reset_back', response) };
    });
  }

  return {
    supports: type => type === CLAIM_COMMAND,
    execute(type, value) { if (type !== CLAIM_COMMAND) throw new GameError(5, 'Unsupported recharge rebate-reset command'); return claim(value); },
    synchronizeLogin,
    activityIds: ACT_IDS,
    moduleId: ACTIVITY_MODULE
  };
}
