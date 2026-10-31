import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

const PERMIT_MODULE = 38;
const PERMIT_PRODUCT_TYPE = 6;
const BASE_PERMIT_TYPES = new Set([67, 68, 69, 70, 71]);
// RechargeTable.Handle[9] maps recharge_type 6 to PermitNewMgr. The client
// loops over extra_ret_list without a nil guard, so a standard permit purchase
// must return at least one entry. PermitNewMgr refreshes from the product tid;
// the pb_permit_info payload documents the row that changed.
const PERMIT_HANDLE_FLAG = 9;

// Standard permits use their own login module. RechargeTable links the shop
// product to a PermitTable row, and the client refreshes the row from the 1900
// recharge event after the order commits.
export function createPermitService({ codec, tables }) {
  const permitByRecharge = new Map();
  for (const permit of tables.PermitBase?.values?.() ?? []) {
    const recharge = Number(permit.recharge);
    const type = Number(permit.type);
    if (!Number.isSafeInteger(recharge) || recharge <= 0 || !BASE_PERMIT_TYPES.has(type)) continue;
    if (!permitByRecharge.has(recharge)) permitByRecharge.set(recharge, permit);
  }

  function supports(product) {
    if (!product || Number(product.type) !== PERMIT_PRODUCT_TYPE) return false;
    if (!Array.isArray(product.reward_tid) || product.reward_tid.length !== 0) return false;
    if (!Array.isArray(product.reward_count) || product.reward_count.length !== 0) return false;
    return permitByRecharge.has(Number(product.tid));
  }

  function purchase({ model, product }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported permit product');
    const permit = permitByRecharge.get(Number(product.tid));
    const modules = new Map(model.state.modules.value);
    const moduleValue = modules.get(PERMIT_MODULE);
    if (!moduleValue || !Array.isArray(moduleValue.value)) throw new GameError(5, 'Permit login data is unavailable');

    for (let elementIndex = 0; elementIndex < moduleValue.value.length; elementIndex++) {
      let data;
      try {
        data = codec.unpack('pb_permit_data', rawBinary(moduleValue.value[elementIndex]));
      } catch {
        continue;
      }
      const info = (data.permit_list ?? []).find(row => Number(row.id) === Number(permit.tid));
      if (!info) continue;
      if (info.is_pay === true) throw new GameError(307, 'Permit already purchased');

      info.is_pay = true;
      moduleValue.value[elementIndex] = serializedBinary(codec.pack('pb_permit_data', data));
      modules.set(PERMIT_MODULE, moduleValue);
      model.state.modules.value = [...modules];
      return {
        permitId: String(permit.tid),
        extraRetList: [{ flag: PERMIT_HANDLE_FLAG, data: codec.pack('pb_permit_info', info) }]
      };
    }

    throw new GameError(5, 'Permit login row is unavailable');
  }

  return { supports, purchase, permitByRecharge };
}
