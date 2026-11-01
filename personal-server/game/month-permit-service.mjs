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
        const info = (message.month_permit_data?.month_permit_list ?? []).find(row => Number(row.id) === actId);
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

    const taskRows = [...(tables.MonthPermitTask?.values?.() ?? [])]
      .filter(entry => taskIds.includes(String(entry.tid)));

    const taskIdSet = new Set(taskIds.map(String));
    const completedTasks = taskInfoList.filter(task => taskIdSet.has(String(task.tid)));

    if (completedTasks.length > 0) throw new GameError(310, 'Task already claimed');

    const rewardRows = [...tables.MonthPermitTaskReward?.values?.() ?? []]
      .filter(entry => taskIds.includes(String(entry.tid)));

    const rewards = rewardRows.flatMap(row => {
      const items = row.reward_item ?? [];
      return items.map(pair => [Number(pair[0]), Number(pair[1])]);
    });

    // Update task info with claimed timestamp
    for (const taskId of taskIds) {
      const taskRow = taskRows.find(entry => String(entry.tid) === taskId);
      if (taskRow) {
        taskRow.get_time = Math.floor(Date.now() / 1000);
      }
    }

    const updatedTaskInfo = taskInfoList.map(task => {
      const existing = taskRows.find(entry => String(entry.tid) === String(task.tid));
      return existing || { tid: Number(task), get_time: 0 };
    });

    row.info.task_get = updatedTaskInfo;
    persistInfo(model, row);

    return {
      actId: String(actId),
      claimedTasks: taskIds.map(String),
      rewards,
      response: {
        month_permit_info: row.info,
        res: { changes: rewards.map(([tid, num]) => ({ tid: String(tid), diff_num: String(num) })), is_overflow: false }
      }
    };
  }

  return { supports, purchase, buyLevel, claimTask, gearByRecharge };
}
