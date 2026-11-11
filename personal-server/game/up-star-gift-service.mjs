import { GameError } from './hero-progression.mjs';
import { activityWindow } from './activity-calendar.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

// 独立“限时升星 / 升星礼包”家族（模块 92037，ActivityTable func 25）。
//
// 登录数据 pb_up_star_gift_master 挂在模块 92 并行活动组的 module_login_data 里，
// 外层是 ETF BINARY_EXT 包装、内层是 protobuf：
//   info_list[]       每个版本一条 { version, act_id, award_bin, buy_limit_info }
//   cur_choose_version 客户端当前选中的版本
// 参考服登录快照（两份角色、534 字节）只带 version/act_id，领取位与限购为空，说明
// 这两项是玩家态而不是静态配置；静态档位与奖励属于 UpStarGiftTable。
//
// 31053 选择版本：校验版本属于当前开放的 func 25 活动并写回模块 92。
// 31052 领奖：pb_up_star_gift_req{ids} 需要 UpStarGiftTable 的档位条件和奖励，
// 当前资产里没有该表，因此校验请求后按 code 5 明确拒绝，不伪造奖励或空成功。
export const UP_STAR_GIFT_ACTIVITY_FUNC = 25;
export const UP_STAR_GIFT_MODULE_ID = 92;
export const UP_STAR_GIFT_COMMANDS = Object.freeze({ AWARD: 31052, CHOOSE_VERSION: 31053 });
export const UP_STAR_GIFT_AWARD_GAP =
  'PAY-UPSTARGIFT: UpStarGiftTable 未导出，升星礼包的档位条件与奖励无法核对；' +
  '已在 personal-server/assets/tables、assets/protobuf、客户端 lua/UI bundle 清单和' +
  'agent/workflow 证据中查找，均无该表';

const RUNNING_STATE_ID = 50;
const ETF_VERSION = 0x83;
const ETF_BINARY_EXT = 0x6d;

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

export function createUpStarGiftService({ store, codec, tables, calendar, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => Math.floor(Number(now()) / 1000);

  // ActivityTable func 25 是这一家族的注册表：tid 是活动 id，version 是客户端版本号。
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
      // 载荷损坏时不能中断登录；重建后仍会写回完整结构，并把原始问题留在日志里。
      log({ event: 'up_star_gift_login_parse_failed', message: error.message, bytes: inner.length });
      return { info_list: [], cur_choose_version: 0 };
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

  function runningVersions(activity, at, rows) {
    return rows.filter(row => {
      const state = (activity.act_parallel_list ?? [])
        .flatMap(group => group.states_data ?? [])
        .find(candidate => Number(candidate?.act_id) === row.actId) ?? null;
      return calendar.isActivityRunning(row.actId, state, activity, at);
    });
  }

  // 登录与两条命令共用同一套对齐：补齐当前开放但登录快照缺失的版本（例如
  // 25111 在排期内开放，却不在参考快照的 66 条里），并把失效的选中版本切回
  // 当前开放的最新版本。参考服的 info_list 会保留未开放版本，所以这里不删除历史行。
  function reconcile(activity, at) {
    activity.act_parallel_list ??= [];
    const rows = versions();
    if (!rows.length) return { group: null, master: null, running: [], addedStates: [], addedInfo: [], curChooseVersion: 0 };

    const running = runningVersions(activity, at, rows);
    if (!running.length) return { group: familyGroup(activity), master: null, running: [], addedStates: [], addedInfo: [], curChooseVersion: 0 };

    let group = familyGroup(activity);
    if (!group) {
      group = { states_data: [], module_login_data: Buffer.alloc(0) };
      activity.act_parallel_list.push(group);
    }
    group.states_data ??= [];

    const addedStates = [];
    for (const row of running) {
      let state = group.states_data.find(candidate => Number(candidate?.act_id) === row.actId);
      if (!state) {
        state = {
          act_id: row.actId,
          cur_state_id: RUNNING_STATE_ID,
          history_time: [{ state_id: RUNNING_STATE_ID, enter_time: String(windowStart(row) || at) }]
        };
        group.states_data.push(state);
        addedStates.push(row.actId);
      } else if (Number(state.cur_state_id) !== RUNNING_STATE_ID) {
        state.cur_state_id = RUNNING_STATE_ID;
        state.history_time = [...(state.history_time ?? []), { state_id: RUNNING_STATE_ID, enter_time: String(at) }];
        addedStates.push(row.actId);
      }
    }

    const master = decodeMaster(group.module_login_data);
    const known = new Set((master.info_list ?? []).map(entry => Number(entry.act_id)));
    const addedInfo = [];
    for (const row of running) {
      if (known.has(row.actId)) continue;
      master.info_list.push({ version: row.version, act_id: row.actId, award_bin: '', buy_limit_info: {} });
      addedInfo.push(row.actId);
    }

    const runningVersionsById = new Map(running.map(row => [row.actId, row]));
    const storedChoice = Number(master.cur_choose_version) || 0;
    const storedEntry = (master.info_list ?? []).find(entry => Number(entry.version) === storedChoice);
    const storedRunning = storedEntry && runningVersionsById.has(Number(storedEntry.act_id));
    if (!storedRunning) {
      const newest = [...running].sort((left, right) => windowStart(right) - windowStart(left) || right.version - left.version)[0];
      master.cur_choose_version = newest.version;
    }
    group.module_login_data = encodeMaster(master);
    return {
      group, master, running,
      addedStates, addedInfo,
      curChooseVersion: Number(master.cur_choose_version) || 0
    };
  }

  function synchronizeLogin(activity, at = currentSeconds()) {
    if (!activity || typeof activity !== 'object') throw new GameError(5, 'Activity login data is invalid');
    const state = reconcile(activity, at);
    if (!state.running.length) {
      return { activityIds: [], versions: [], curChooseVersion: 0, addedStates: [], addedInfo: [] };
    }
    return {
      activityIds: state.running.map(row => row.actId),
      versions: state.running.map(row => row.version),
      curChooseVersion: state.curChooseVersion,
      addedStates: state.addedStates,
      addedInfo: state.addedInfo
    };
  }

  function readActivity() {
    const module = new Map(store.state().modules.value).get(UP_STAR_GIFT_MODULE_ID);
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
      const module = modules.get(UP_STAR_GIFT_MODULE_ID);
      if (!module) throw new GameError(5, 'Activity login data is unavailable');
      let activity;
      try {
        activity = codec.unpack('pb_act_login', rawBinary(module));
      } catch {
        throw new GameError(5, 'Activity login data is invalid');
      }
      const state = reconcile(activity, at);
      if (!state.group || !state.master) throw new GameError(309, 'Up-star gift activity is not running');
      const row = state.running.find(candidate => candidate.version === selected);
      if (!row) throw new GameError(309, 'Up-star gift version is not running');
      const entry = (state.master.info_list ?? []).find(candidate => Number(candidate.act_id) === row.actId);
      if (!entry) throw new GameError(5, 'Up-star gift login data is missing the selected version');
      const changed = Number(state.master.cur_choose_version) !== selected;
      if (changed) {
        state.master.cur_choose_version = selected;
        state.group.module_login_data = encodeMaster(state.master);
        modules.set(UP_STAR_GIFT_MODULE_ID, serializedBinary(codec.pack('pb_act_login', activity)));
        model.state.modules.value = [...modules];
      }
      return { changed, version: selected, actId: row.actId };
    });
    log({ event: 'up_star_gift_version_selected', ...result });
    return { value: result, data: Buffer.alloc(0) };
  }

  // 31052 req_up_star_gift_award：pb_up_star_gift_req{ids}。
  // 请求结构、版本和活动窗口可以校验；每个 id 的达标条件与奖励来自
  // UpStarGiftTable，本环境没有该资产，因此明确拒绝，不写领取位。
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
    const activity = readActivity();
    const state = reconcile(activity, at);
    if (!state.group || !state.master || !state.running.length) throw new GameError(309, 'Up-star gift activity is not running');
    const version = Number(state.master.cur_choose_version) || 0;
    const entry = (state.master.info_list ?? []).find(candidate => Number(candidate.version) === version);
    if (!entry) throw new GameError(309, 'Up-star gift version is not selected');
    log({ event: 'up_star_gift_award_refused', version, actId: Number(entry.act_id), ids });
    throw new GameError(5, UP_STAR_GIFT_AWARD_GAP);
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
