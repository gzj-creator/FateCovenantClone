import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeDayIndex } from './recharge-rules.mjs';

const MONTHLY_CARD_MODULE = 20;
const MONTHLY_CARD_RECHARGE = 47;
const MONTHLY_CARD_HANDLE_FLAG = 5;

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new GameError(5, `Invalid monthly card ${field}`);
  }
  return number;
}

// RechargeTable type 47 products activate an entry in login module 20. The
// client's MonthlyCardMgr.LoginParse decodes pb_monthly_card_info and derives
// the buy state from monthly_card.start_day + MonthlyCardTable.reward_period.
export function createMonthlyCardService({ codec, tables }) {
  const cardByRecharge = new Map();
  for (const card of tables.MonthlyCard?.values?.() ?? []) {
    const recharge = Number(card.recharge);
    const cardId = positiveInteger(card.tid, 'id');
    const rewardPeriod = positiveInteger(card.reward_period, 'reward period');
    if (!Number.isSafeInteger(recharge) || recharge <= 0) continue;
    if (!cardByRecharge.has(recharge)) {
      cardByRecharge.set(recharge, { ...card, tid: cardId, reward_period: rewardPeriod });
    }
  }

  function supports(product) {
    return Number(product?.type) === MONTHLY_CARD_RECHARGE
      && cardByRecharge.has(Number(product?.tid));
  }

  function readInfo(modules) {
    const moduleValue = modules.get(MONTHLY_CARD_MODULE);
    if (!moduleValue) throw new GameError(5, 'Monthly card login data is unavailable');
    const info = codec.unpack('pb_monthly_card_info', rawBinary(moduleValue));
    info.card_list ??= [];
    return { info, moduleValue };
  }

  function activeOnDay(cardConfig, purchasedCard, day) {
    const startDay = Number(purchasedCard?.start_day ?? 0);
    if (!Number.isSafeInteger(startDay) || startDay <= 0) return false;
    return day >= startDay && day - startDay <= cardConfig.reward_period;
  }

  function assertPurchaseAvailable({ modules, product, at }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported monthly card product');
    const card = cardByRecharge.get(Number(product.tid));
    const { info } = readInfo(modules);
    const existing = info.card_list.find(row => Number(row.id) === card.tid);
    if (activeOnDay(card, existing, rechargeDayIndex(at))) {
      throw new GameError(307, 'Monthly card is already active');
    }
  }

  function purchase({ model, product, at }) {
    if (!supports(product)) throw new GameError(5, 'Unsupported monthly card product');
    const modules = new Map(model.state.modules.value);
    assertPurchaseAvailable({ modules, product, at });
    const { info, moduleValue } = readInfo(modules);
    const card = cardByRecharge.get(Number(product.tid));
    const startDay = rechargeDayIndex(at);
    const entry = {
      id: card.tid,
      invalid_day: 0,
      last_get_reward_day: 0,
      last_get_add_reward_day: 0,
      got_count: 0,
      start_day: startDay,
      got_reward: Buffer.alloc(0)
    };
    const existingIndex = info.card_list.findIndex(row => Number(row.id) === card.tid);
    if (existingIndex >= 0) info.card_list[existingIndex] = entry;
    else info.card_list.push(entry);
    modules.set(MONTHLY_CARD_MODULE, serializedBinary(codec.pack('pb_monthly_card_info', info)));
    model.state.modules.value = [...modules];
    return {
      cardId: card.tid,
      startDay,
      info,
      extraRetList: [{ flag: MONTHLY_CARD_HANDLE_FLAG, data: codec.pack('pb_monthly_card_info', info) }]
    };
  }

  return { supports, assertPurchaseAvailable, purchase, cardByRecharge };
}
