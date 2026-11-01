import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

const MONTH_PERMIT_RECHARGE = 130;
const MONTH_PERMIT_HANDLE_FLAG = 116;
const MODULE_ACT_LOGIN = 183;

function positiveSafeInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new GameError(1, `Invalid month permit ${field}`);
  return number;
}

function positiveBigInt(value, field) {
  let number;
  try { number = BigInt(value); } catch { throw new GameError(1, `Invalid month permit ${field}`); }
  if (number <= 0n || number > BigInt(Number.MAX_SAFE_INTEGER)) throw new GameError(1, `Invalid month permit ${field}`);
  return number;
}

// RechargeTable type=130 products have an empty reward list. Their purchase is
// recorded in the owning activity's pb_month_permit_info.pay_list instead; the
// native client then refreshes the pass UI from extra_ret_list flag 116.
export function createMonthPermitService({ codec, tables }) {
  const gearByRecharge = new Map();
  for (const gear of tables.MonthPermitGear?.values?.() ?? []) {
    const recharge = Number(gear.recharge);
    if (!Number.isSafeInteger(recharge) || recharge <= 0) continue;
    const rows = gearByRecharge.get(recharge) ?? [];
    rows.push(gear);
    gearByRecharge.set(recharge, rows);
  }

  function supports(product) {
    return product?.type === MONTH_PERMIT_RECHARGE && gearByRecharge.has(Number(product.tid));
  }

  function wrappedPayload(bytes) {
    if (bytes.length < 6 || bytes[0] !== 0x83 || bytes[1] !== 0x6d) return null;
    const length = bytes.readUInt32BE(2);
    if (length > bytes.length - 6) return null;
    return bytes.subarray(6, 6 + length);
  }

  function activeInfo(model, actId) {
    const modules = new Map(model.state.modules.value);
    const moduleValue = modules.get(MODULE_ACT_LOGIN);
    if (!moduleValue || !Array.isArray(moduleValue.value)) throw new GameError(5, 'Month permit login data is unavailable');
    for (let elementIndex = 0; elementIndex < moduleValue.value.length; elementIndex++) {
      const element = moduleValue.value[elementIndex];
      let login;
      try { login = codec.unpack('pb_act_role_login', rawBinary(element)); } catch { continue; }
      for (const entry of login.data_list ?? []) {
        if (typeof entry.module_login_data !== 'string') continue;
        const innerBytes = wrappedPayload(Buffer.from(entry.module_login_data, 'base64'));
        if (!innerBytes) continue;
        let message;
        try { message = codec.unpack('pb_month_permit_login_back', innerBytes); } catch { continue; }
        const info = (message.month_permit_data?.month_permit_list ?? []).find(row => actId == null || Number(row.id) === actId);
        if (info) return { modules, moduleValue, elementIndex, login, entry, message, info };
      }
    }
    throw new GameError(5, 'Month permit activity is not active');
  }

  function persistInfo(model, row) {
    const packed = codec.pack('pb_month_permit_login_back', row.message);
    const header = Buffer.alloc(6);
    header[0] = 0x83;
    header[1] = 0x6d;
    header.writeUInt32BE(packed.length, 2);
    row.entry.module_login_data = Buffer.concat([header, packed]).toString('base64');
    row.moduleValue.value[row.elementIndex] = serializedBinary(codec.pack('pb_act_role_login', row.login));
    row.modules.set(MODULE_ACT_LOGIN, row.moduleValue);
    model.state.modules.value = [...row.modules];
  }

  function purchase({ model, product }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported month permit product');
    const gearRows = gearByRecharge.get(Number(product.tid));
    const modules = new Map(model.state.modules.value);
    const moduleValue = modules.get(MODULE_ACT_LOGIN);
    if (!moduleValue || !Array.isArray(moduleValue.value)) throw new GameError(5, 'Month permit login data is unavailable');

    for (let elementIndex = 0; elementIndex < moduleValue.value.length; elementIndex++) {
      const element = moduleValue.value[elementIndex];
      let login;
      try { login = codec.unpack('pb_act_role_login', rawBinary(element)); } catch { continue; }
      for (const entry of login.data_list ?? []) {
        if (typeof entry.module_login_data !== 'string') continue;
        const innerBytes = wrappedPayload(Buffer.from(entry.module_login_data, 'base64'));
        if (!innerBytes) continue;
        let message;
        try { message = codec.unpack('pb_month_permit_login_back', innerBytes); } catch { continue; }
        for (const info of message.month_permit_data?.month_permit_list ?? []) {
          const act = tables.ActFrameAct?.get(Number(info.id));
          if (!act) continue;
          const gear = gearRows.find(row => Number(row.version) === Number(act.version));
          if (!gear) continue;
          const payList = (info.pay_list ?? []).map(String);
          if (payList.includes(String(product.tid))) throw new GameError(307, 'Month permit already purchased');
          info.pay_list = [...payList, String(product.tid)];

          const packed = codec.pack('pb_month_permit_login_back', message);
          const header = Buffer.alloc(6);
          header[0] = 0x83;
          header[1] = 0x6d;
          header.writeUInt32BE(packed.length, 2);
          entry.module_login_data = Buffer.concat([header, packed]).toString('base64');

          moduleValue.value[elementIndex] = serializedBinary(codec.pack('pb_act_role_login', login));
          modules.set(MODULE_ACT_LOGIN, moduleValue);
          model.state.modules.value = [...modules];
          return {
            actId: String(info.id),
            gearTid: Number(gear.tid),
            info,
            extraRetList: [{ flag: MONTH_PERMIT_HANDLE_FLAG, data: codec.pack('pb_month_permit_info', info) }]
          };
        }
      }
    }
    throw new GameError(5, 'Month permit activity is not active');
  }

  function assertPurchaseAvailable({ modules, product }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported month permit product');
    const gearRows = gearByRecharge.get(Number(product.tid));
    const moduleValue = modules.get(MODULE_ACT_LOGIN);
    if (!moduleValue || !Array.isArray(moduleValue.value)) throw new GameError(5, 'Month permit login data is unavailable');

    for (const element of moduleValue.value) {
      let login;
      try { login = codec.unpack('pb_act_role_login', rawBinary(element)); } catch { continue; }
      for (const entry of login.data_list ?? []) {
        if (typeof entry.module_login_data !== 'string') continue;
        const innerBytes = wrappedPayload(Buffer.from(entry.module_login_data, 'base64'));
        if (!innerBytes) continue;
        let message;
        try { message = codec.unpack('pb_month_permit_login_back', innerBytes); } catch { continue; }
        for (const info of message.month_permit_data?.month_permit_list ?? []) {
          const act = tables.ActFrameAct?.get(Number(info.id));
          if (!act) continue;
          const gear = gearRows.find(row => Number(row.version) === Number(act.version));
          if (!gear) continue;
          const payList = (info.pay_list ?? []).map(String);
          if (payList.includes(String(product.tid))) throw new GameError(307, 'Month permit already purchased');
          return;
        }
      }
    }
    throw new GameError(5, 'Month permit activity is not active');
  }

  function buyLevel({ model, request }) {
    const actId = positiveSafeInteger(request?.tid, 'activity id');
    const buyNum = positiveBigInt(request?.buy_num, 'purchase count');
    const row = activeInfo(model, actId);
    const act = tables.ActFrameAct?.get(actId);
    if (!act) throw new GameError(5, 'Month permit activity configuration is unavailable');
    const cycle = tables.MonthPermitCycle?.get(Number(act.version));
    if (!cycle) throw new GameError(5, 'Month permit cycle configuration is unavailable');

    const buyExpRows = [...(tables.MonthPermitBuyExp?.values?.() ?? [])]
      .filter(entry => Number(entry.lib) === Number(cycle.buy_exp_lib));
    const unit = buyExpRows.find(entry => Number(entry.buy_num) === 1) ?? buyExpRows.sort((left, right) => Number(left.buy_num) - Number(right.buy_num))[0];
    const maxBuyNum = buyExpRows.reduce((max, entry) => Math.max(max, Number(entry.buy_num) || 0), 0);
    if (!unit || maxBuyNum <= 0) throw new GameError(5, 'Month permit purchase configuration is unavailable');
    if (buyNum > BigInt(maxBuyNum)) throw new GameError(1, 'Month permit purchase count exceeds the configured limit');

    const maxLevelRow = [...(tables.MonthPermitUpLv?.values?.() ?? [])]
      .find(entry => Number(entry.lib) === Number(cycle.up_lv_lib) && Number(entry.need_lv) === Number(cycle.buy_max_lv));
    const expItem = positiveSafeInteger(cycle.exp_item, 'experience item');
    const priceItem = positiveSafeInteger(unit.buy_exp_price, 'price item');
    const expPerUnit = positiveSafeInteger(unit.add_exp, 'experience gain');
    const pricePerUnit = positiveSafeInteger(unit.buy_exp_price_num, 'price');
    const maxExp = positiveSafeInteger(maxLevelRow?.exp, 'maximum experience');
    const expGain = BigInt(expPerUnit) * buyNum;
    const price = BigInt(pricePerUnit) * buyNum;
    if (expGain > BigInt(Number.MAX_SAFE_INTEGER) || price > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new GameError(1, 'Month permit purchase amount is too large');
    }
    const currentExp = BigInt(model.resources.get(String(expItem))?.num ?? 0);
    if (currentExp + expGain > BigInt(maxExp)) throw new GameError(307, 'Month permit purchase level cap reached');

    const spent = consumeResources(model, [[priceItem, Number(price)]]);
    const granted = grantResources(model, [[expItem, Number(expGain)]], tables, { codec });
    const buyExpNum = BigInt(row.info.buy_exp_num ?? 0) + expGain;
    row.info.buy_exp_num = buyExpNum.toString();
    persistInfo(model, row);
    return {
      actId: String(actId),
      buyExpNum: row.info.buy_exp_num,
      expGain: Number(expGain),
      cost: { tid: priceItem, num: Number(price) },
      response: {
        buy_exp_num: row.info.buy_exp_num,
        res: { changes: [...spent.changes, ...granted.changes], is_overflow: false }
      }
    };
  }

  function claimTask({ model, request }) {
    const actId = positiveSafeInteger(request?.activity_id, 'activity id');
    const taskIds = request?.task_id_list ?? [];
    if (!Array.isArray(taskIds) || taskIds.length === 0) throw new GameError(1, 'Task list is empty');

    const row = activeInfo(model, actId);
    const taskInfoList = row.info.task_get ?? [];

    const taskIdSet = new Set(taskIds.map(String));
    const claimedTids = new Set(taskInfoList.map(task => String(task.tid)));

    // Check if any tasks are already claimed
    const alreadyClaimed = taskIds.filter(tid => claimedTids.has(String(tid)));
    if (alreadyClaimed.length > 0) throw new GameError(310, 'Task already claimed');

    const taskRows = [...(tables.MonthPermitTask?.values?.() ?? [])]
      .filter(entry => taskIds.includes(String(entry.tid)));

    if (taskRows.length !== taskIds.length) throw new GameError(5, 'Invalid task ID');

    // Get activity configuration for exp item and level rewards
    const act = tables.ActFrameAct?.get(actId);
    if (!act) throw new GameError(5, 'Month permit activity configuration is unavailable');
    const cycle = tables.MonthPermitCycle?.get(Number(act.version));
    if (!cycle) throw new GameError(5, 'Month permit cycle configuration is unavailable');
    const expItem = positiveSafeInteger(cycle.exp_item, 'experience item');

    // Calculate total exp from all tasks
    const totalExpGain = taskRows.reduce((sum, row) => sum + (Number(row.add_exp) || 0), 0);
    if (totalExpGain <= 0) throw new GameError(5, 'Task has no exp reward');

    // Add exp to the permit
    const currentExp = BigInt(row.info.buy_exp_num ?? 0);
    const newExp = currentExp + BigInt(totalExpGain);
    row.info.buy_exp_num = newExp.toString();

    // Check for level rewards
    const upLvRows = [...(tables.MonthPermitUpLv?.values?.() ?? [])]
      .filter(entry => Number(entry.lib) === Number(cycle.up_lv_lib));

    const grantedRewards = [];
    for (const upLv of upLvRows) {
      const levelExp = BigInt(upLv.exp);
      if (newExp >= levelExp && currentExp < levelExp) {
        // This level was just reached, grant its reward
        if (upLv.is_big_award && upLv.award_item) {
          const items = upLv.award_item ?? [];
          for (const pair of items) {
            grantedRewards.push([Number(pair[0]), Number(pair[1])]);
          }
        }
      }
    }

    // Add claimed tasks to task_get list with current timestamp
    const now = Math.floor(Date.now() / 1000);
    const newTaskEntries = taskIds.map(tid => ({ tid: Number(tid), get_time: now }));
    row.info.task_get = [...taskInfoList, ...newTaskEntries];
    persistInfo(model, row);

    // Grant rewards if any
    const resourceChanges = [];
    if (grantedRewards.length > 0) {
      const granted = grantResources(model, grantedRewards, tables, { codec });
      resourceChanges.push(...granted.changes);
    }

    return {
      actId: String(actId),
      claimedTasks: taskIds.map(String),
      expGain: totalExpGain,
      newExp: row.info.buy_exp_num,
      rewards: grantedRewards,
      response: {
        month_permit_info: row.info,
        res: { changes: resourceChanges, is_overflow: false }
      }
    };
  }

  function claimReward({ model, actId, gearLvTid, oneKey = false }) {
    const requestedId = actId == null ? null : positiveSafeInteger(actId, 'activity id');
    const row = activeInfo(model, requestedId);
    const id = Number(row.info.id);
    const act = tables.ActFrameAct?.get(id);
    if (!act) throw new GameError(5, 'Month permit activity configuration is unavailable');
    const cycle = tables.MonthPermitCycle?.get(Number(act.version));
    if (!cycle) throw new GameError(5, 'Month permit cycle configuration is unavailable');

    const gearRows = [...(tables.MonthPermitGear?.values?.() ?? [])]
      .filter(gear => Number(gear.version) === Number(act.version));
    if (gearRows.length === 0) throw new GameError(5, 'Month permit gear configuration is unavailable');
    const payList = new Set((row.info.pay_list ?? []).map(String));
    const accessibleGears = new Set(gearRows
      .filter(gear => Number(gear.recharge) === 0 || payList.has(String(gear.recharge)))
      .map(gear => Number(gear.tid)));

    const expItem = positiveSafeInteger(cycle.exp_item, 'experience item');
    const experience = BigInt(model.resources.get(String(expItem))?.num ?? 0);
    const levelRows = [...(tables.MonthPermitUpLv?.values?.() ?? [])]
      .filter(entry => Number(entry.lib) === Number(cycle.up_lv_lib))
      .sort((left, right) => Number(left.need_lv) - Number(right.need_lv));
    let currentLevel = 0;
    for (const level of levelRows) {
      if (BigInt(level.exp) <= experience) currentLevel = Math.max(currentLevel, Number(level.need_lv));
    }

    const claimed = new Set((row.info.get_gear_lv_list ?? []).map(String));
    const allRows = [...(tables.MonthPermitGearLv?.values?.() ?? [])];
    let selected;
    if (oneKey) {
      selected = allRows.filter(entry => accessibleGears.has(Number(entry.gear))
        && Number(entry.level) <= currentLevel
        && !claimed.has(String(entry.tid)));
    } else {
      const tid = positiveSafeInteger(gearLvTid, 'gear level id');
      const entry = allRows.find(candidate => Number(candidate.tid) === tid);
      if (!entry) throw new GameError(5, 'Month permit reward configuration is unavailable');
      const gear = gearRows.find(candidate => Number(candidate.tid) === Number(entry.gear));
      if (!gear) throw new GameError(5, 'Month permit reward belongs to another activity version');
      if (!accessibleGears.has(Number(gear.tid)) && Number(gear.recharge) > 0) {
        throw new GameError(25001, 'Month permit reward has not been purchased');
      }
      if (claimed.has(String(tid))) throw new GameError(25002, 'Month permit reward has already been claimed');
      if (Number(entry.level) > currentLevel) throw new GameError(5, 'Month permit level is not reached');
      selected = [entry];
    }

    if (selected.length === 0) {
      throw new GameError(oneKey ? 25003 : 25002, 'Month permit reward is not claimable');
    }
    const awards = selected.flatMap(entry => Array.isArray(entry.award) ? entry.award : []);
    const granted = grantResources(model, awards, tables, { codec });
    const claimedTids = selected.map(entry => Number(entry.tid)).sort((left, right) => left - right);
    row.info.get_gear_lv_list = [...claimed, ...claimedTids.map(String)]
      .sort((left, right) => Number(left) - Number(right));
    persistInfo(model, row);

    return {
      actId: String(id),
      currentLevel,
      claimed: claimedTids,
      response: {
        get_list: claimedTids,
        res: { changes: granted.changes, is_overflow: false },
        month_permit: row.info
      }
    };
  }

  return {
    supports,
    assertPurchaseAvailable,
    purchase,
    buyLevel,
    claimTask,
    claimReward,
    claimAll: ({ model, actId }) => claimReward({ model, actId, oneKey: true }),
    gearByRecharge
  };
}
