import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

const MONTH_PERMIT_RECHARGE = 130;
const MONTH_PERMIT_HANDLE_FLAG = 116;
const MODULE_ACT_LOGIN = 183;

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

  return { supports, purchase, gearByRecharge };
}
