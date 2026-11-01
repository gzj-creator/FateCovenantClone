import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

const PERMANENT_CARD_MODULE = 62;
const PERMANENT_CARD_RECHARGE = 29;

// PermanentCardNode activates the row locally after a successful recharge, but
// login module 62 is the durable state. Keep that module in the purchase
// transaction so relogin/restart does not make a bought card appear buyable.
export function createPermanentCardService({ codec, tables }) {
  const unpack = moduleValue => codec.unpack('pb_permanent_card', rawBinary(moduleValue));
  const cardByRecharge = new Map();
  for (const card of tables.PermanentCard?.values?.() ?? []) {
    const cardTid = Number(card.tid);
    if (!Number.isSafeInteger(cardTid) || cardTid <= 0) continue;
    for (const rechargeTid of [Number(card.recharge), Number(card.discount_recharge)]) {
      if (!Number.isSafeInteger(rechargeTid) || rechargeTid <= 0) continue;
      const product = tables.Recharge.get(rechargeTid);
      if (!product || Number(product.type) !== PERMANENT_CARD_RECHARGE || Number(product.pay_type) !== 0) continue;
      if (!cardByRecharge.has(rechargeTid)) cardByRecharge.set(rechargeTid, { ...card, tid: cardTid });
    }
  }

  function supports(product) {
    return Number(product?.type) === PERMANENT_CARD_RECHARGE
      && cardByRecharge.has(Number(product?.tid));
  }

  function readInfo(modules) {
    const moduleValue = modules.get(PERMANENT_CARD_MODULE);
    if (!moduleValue) throw new GameError(5, 'Permanent card login data is unavailable');
    const info = unpack(moduleValue);
    info.element_list ??= [];
    info.record_list ??= [];
    return info;
  }

  function active(info, cardTid) {
    return info.element_list.some(row => Number(row.tid) === Number(cardTid));
  }

  function assertPurchaseAvailable({ modules, product }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported permanent card product');
    const card = cardByRecharge.get(Number(product.tid));
    if (active(readInfo(modules), card.tid)) throw new GameError(307, 'Permanent card is already active');
  }

  function purchase({ model, product }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported permanent card product');
    const modules = new Map(model.state.modules.value);
    assertPurchaseAvailable({ modules, product });
    const info = readInfo(modules);
    const card = cardByRecharge.get(Number(product.tid));
    info.element_list.push({ tid: Number(card.tid), last_reward_day: 0, data_version: 0 });
    const data = codec.pack('pb_permanent_card', info);
    modules.set(PERMANENT_CARD_MODULE, serializedBinary(data));
    model.state.modules.value = [...modules];
    return { cardId: Number(card.tid), info };
  }

  function restoreFromOrders({ modules, rows }) {
    const purchasedCards = new Set();
    for (const row of rows) {
      const product = tables.Recharge.get(row.product_id);
      if (supports(product)) purchasedCards.add(Number(cardByRecharge.get(Number(product.tid)).tid));
    }
    if (!purchasedCards.size) return false;

    const info = modules.has(PERMANENT_CARD_MODULE)
      ? readInfo(modules)
      : { element_list: [], record_list: [], free_endtime: 0 };
    let changed = false;
    for (const cardTid of purchasedCards) {
      if (active(info, cardTid)) continue;
      info.element_list.push({ tid: cardTid, last_reward_day: 0, data_version: 0 });
      changed = true;
    }
    if (!changed && modules.has(PERMANENT_CARD_MODULE)) return false;
    modules.set(PERMANENT_CARD_MODULE, serializedBinary(codec.pack('pb_permanent_card', info)));
    return true;
  }

  return { supports, assertPurchaseAvailable, purchase, restoreFromOrders, readInfo, cardByRecharge };
}
