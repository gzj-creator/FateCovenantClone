import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeHandleForType } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';

const PERMIT_MODULE = 38;
const PERMIT_PRODUCT_TYPE = 6;
const NOT_BUY_PERMIT = 25001;
const PERMIT_HAS_RECEIVED = 25002;
const PERMIT_NO_ONE_KEY_AWARD = 25003;

// Standard permits use their own login module. RechargeTable links the shop
// product to a PermitTable row, and the client refreshes the row from the 1900
// recharge event after the order commits.
export function createPermitService({ codec, tables, now = () => Math.floor(Date.now() / 1000) }) {
  const permitHandle = rechargeHandleForType(tables, PERMIT_PRODUCT_TYPE);
  if (permitHandle == null) throw new Error('RechargeTable.Handle is missing the standard permit handler');
  const permitByRecharge = new Map();
  for (const permit of tables.PermitBase?.values?.() ?? []) {
    for (const recharge of [Number(permit.recharge), Number(permit.discount_recharge)]) {
      if (!Number.isSafeInteger(recharge) || recharge <= 0) continue;
      if (!permitByRecharge.has(recharge)) permitByRecharge.set(recharge, permit);
    }
  }

  function supports(product) {
    if (!product || Number(product.type) !== PERMIT_PRODUCT_TYPE) return false;
    if (!Array.isArray(product.reward_tid) || product.reward_tid.length !== 0) return false;
    if (!Array.isArray(product.reward_count) || product.reward_count.length !== 0) return false;
    return permitByRecharge.has(Number(product.tid));
  }

  function findInfo(model, permitId) {
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
      const info = (data.permit_list ?? []).find(row => Number(row.id) === permitId);
      if (info) return { modules, moduleValue, elementIndex, data, info };
    }
    throw new GameError(5, 'Permit login row is unavailable');
  }

  function persistInfo(model, found) {
    const modules = new Map(model.state.modules.value);
    found.moduleValue.value[found.elementIndex] = serializedBinary(codec.pack('pb_permit_data', found.data));
    modules.set(PERMIT_MODULE, found.moduleValue);
    model.state.modules.value = [...modules];
  }

  function levelRows(permitId) {
    return [...(tables.PermitLevel?.values?.() ?? [])]
      .filter(row => Math.floor(Number(row.tid) / 1000) === permitId)
      .sort((left, right) => Number(left.exp) - Number(right.exp));
  }

  function currentExperience({ model, permit }) {
    const dynamic = tables.PermitDynamicArgs?.get(Number(permit.exp_item));
    if (dynamic?.lua_interface?.reference === 'PermitUtil.CalcOpenDay') {
      throw new GameError(5, 'Permit open-day experience requires the active permit row');
    }
    return Number(model.resources.get(String(permit.exp_item))?.num ?? 0);
  }

  function experienceForInfo({ model, permit, info }) {
    const dynamic = tables.PermitDynamicArgs?.get(Number(permit.exp_item));
    if (dynamic?.lua_interface?.reference === 'PermitUtil.CalcOpenDay') {
      const openDay = Number(info.open_day);
      if (!Number.isSafeInteger(openDay) || openDay <= 0) {
        throw new GameError(5, 'Permit open day is invalid');
      }
      const cycle = Number(tables.PermitCycle?.get(Number(info.id))?.cycle ?? 0);
      if (!Number.isSafeInteger(cycle) || cycle <= 0) throw new GameError(5, 'Permit cycle configuration is unavailable');
      const at = Number(now());
      if (!Number.isSafeInteger(at) || at <= 0) throw new GameError(1, 'Invalid permit claim time');
      const currentDay = gameDayIndex(at);
      return Math.min(Math.max(currentDay - openDay + 1, 0), cycle);
    }
    return currentExperience({ model, permit });
  }

  function currentLevel(rows, experience) {
    let level = 0;
    for (const row of rows) {
      if (Number(row.exp) <= experience) level = Math.max(level, Number(row.tid) % 1000);
    }
    return level;
  }

  function claim({ model, permitId, free = false, paid = false, paidOnly = false, oneKey = false }) {
    const id = Number(permitId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, 'Invalid permit id');
    const permit = tables.PermitBase?.get(id);
    if (!permit) throw new GameError(5, 'Permit configuration is unavailable');
    const found = findInfo(model, id);
    if (paidOnly && found.info.is_pay !== true) throw new GameError(NOT_BUY_PERMIT, 'Permit has not been purchased');

    const rows = levelRows(id);
    if (rows.length === 0) throw new GameError(5, 'Permit level configuration is unavailable');
    const experience = experienceForInfo({ model, permit, info: found.info });
    const maxLevel = currentLevel(rows, experience);
    const levelState = new Map((found.info.levels ?? []).map(row => [Number(row.level), row]));
    const awards = [];
    const changed = [];

    for (const row of rows) {
      const level = Number(row.tid) % 1000;
      if (level > maxLevel || level <= 0) continue;
      let state = levelState.get(level);
      if (!state) {
        state = { level };
        levelState.set(level, state);
      }
      let levelChanged = false;
      if (free && state.receive_free !== true && Array.isArray(row.free_award) && row.free_award.length > 0) {
        state.receive_free = true;
        awards.push(...row.free_award);
        levelChanged = true;
      }
      if (paid && found.info.is_pay === true && state.receive_permit !== true
          && Array.isArray(row.permit_award) && row.permit_award.length > 0) {
        state.receive_permit = true;
        awards.push(...row.permit_award);
        levelChanged = true;
      }
      if (levelChanged) changed.push({ ...state });
    }

    if (changed.length === 0) {
      throw new GameError(oneKey ? PERMIT_NO_ONE_KEY_AWARD : PERMIT_HAS_RECEIVED, 'Permit reward is not claimable');
    }

    found.info.levels = [...levelState.values()].sort((left, right) => Number(left.level) - Number(right.level));
    const granted = grantResources(model, awards, tables, { codec });
    persistInfo(model, found);
    return {
      permitId: String(id),
      experience,
      level: maxLevel,
      levels: changed,
      response: {
        levels: changed,
        res: { changes: granted.changes, is_overflow: false },
        permit: found.info
      }
    };
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
        extraRetList: [{ flag: permitHandle, data: codec.pack('pb_permit_info', info) }]
      };
    }

    throw new GameError(5, 'Permit login row is unavailable');
  }

  function assertPurchaseAvailable({ modules, product }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported permit product');
    const permit = permitByRecharge.get(Number(product.tid));
    const moduleValue = modules.get(PERMIT_MODULE);
    if (!moduleValue || !Array.isArray(moduleValue.value)) throw new GameError(5, 'Permit login data is unavailable');
    for (const element of moduleValue.value) {
      let data;
      try { data = codec.unpack('pb_permit_data', rawBinary(element)); } catch { continue; }
      const info = (data.permit_list ?? []).find(row => Number(row.id) === Number(permit.tid));
      if (!info) continue;
      if (info.is_pay === true) throw new GameError(307, 'Permit already purchased');
      return;
    }
    throw new GameError(5, 'Permit login row is unavailable');
  }

  return {
    supports,
    assertPurchaseAvailable,
    purchase,
    claim,
    claimFree: ({ model, permitId }) => claim({ model, permitId, free: true }),
    claimPaid: ({ model, permitId }) => claim({ model, permitId, paid: true, paidOnly: true }),
    claimAll: ({ model, permitId }) => claim({ model, permitId, free: true, paid: true, oneKey: true }),
    permitByRecharge
  };
}
