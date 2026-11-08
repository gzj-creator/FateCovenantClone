import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeDayIndex } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';

const MONTHLY_CARD_MODULE = 20;
const MONTHLY_CARD_RECHARGE = 47;
const MONTHLY_CARD_HANDLE_FLAG = 5;

function positiveInteger(value, field, code = 5) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new GameError(code, `Invalid monthly card ${field}`);
  }
  return number;
}

function rewardBytes(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  return Buffer.alloc(0);
}

// RechargeTable type 47 products activate an entry in login module 20. The
// client's MonthlyCardMgr.LoginParse decodes pb_monthly_card_info and derives
// the buy state from monthly_card.start_day + MonthlyCardTable.reward_period.
// Monthly-card day N uses BitBlock index N (not the generic zero-based index).
export function createMonthlyCardService({ codec, tables, now = Date.now }) {
  const cardByRecharge = new Map();
  const cardById = new Map();
  for (const card of tables.MonthlyCard?.values?.() ?? []) {
    const recharge = Number(card.recharge);
    const cardId = positiveInteger(card.tid, 'id');
    const rewardPeriod = positiveInteger(card.reward_period, 'reward period');
    if (!Number.isSafeInteger(recharge) || recharge <= 0) continue;
    if (!cardByRecharge.has(recharge)) {
      const normalized = { ...card, tid: cardId, reward_period: rewardPeriod };
      cardByRecharge.set(recharge, normalized);
      cardById.set(cardId, normalized);
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
    return day >= startDay && day < startDay + cardConfig.reward_period;
  }

  function countRewardBits(bits, rewardPeriod) {
    let count = 0;
    for (let day = 1; day <= rewardPeriod; day++) {
      if (hasBit(bits, day)) count++;
    }
    return count;
  }

  // The first implementation wrote claim day N at index N - 1. The client's
  // AwardIsGotByDayIndex uses index N, so move legacy bits one position and
  // regenerate got_count. The old encoding always set index 0 when day 1 was
  // claimed, which also makes this repair naturally idempotent.
  function repairLegacyClaimBits({ model }) {
    const modules = new Map(model.state.modules.value);
    if (!modules.has(MONTHLY_CARD_MODULE)) return { changed: false, repaired: [] };
    const { info } = readInfo(modules);
    const repaired = [];
    for (const row of info.card_list) {
      const cardConfig = cardById.get(Number(row.id));
      const current = rewardBytes(row.got_reward);
      if (!cardConfig || !hasBit(current, 0)) continue;
      let bits = Buffer.alloc(Math.max(current.length, Math.ceil((cardConfig.reward_period + 1) / 8)));
      for (let day = 1; day <= cardConfig.reward_period; day++) {
        if (hasBit(current, day - 1)) bits = setBit(bits, day);
      }
      row.got_reward = bits;
      row.got_count = countRewardBits(bits, cardConfig.reward_period);
      repaired.push({ cardId: cardConfig.tid, gotCount: row.got_count });
    }
    if (!repaired.length) return { changed: false, repaired: [] };
    modules.set(MONTHLY_CARD_MODULE, serializedBinary(codec.pack('pb_monthly_card_info', info)));
    model.state.modules.value = [...modules];
    return { changed: true, repaired };
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

  function claim({ model, request, at = now() }) {
    const currentDay = rechargeDayIndex(at);
    const requestedCards = request?.card_list;
    if (!Array.isArray(requestedCards) || requestedCards.length === 0) {
      throw new GameError(1, 'Monthly card reward list is empty');
    }

    const modules = new Map(model.state.modules.value);
    const { info } = readInfo(modules);
    const seenCards = new Set();
    const updatedCards = new Map();
    const awards = [];
    const claims = [];

    for (const requestedCard of requestedCards) {
      const cardId = positiveInteger(requestedCard?.card_id, 'id', 1);
      if (seenCards.has(cardId)) throw new GameError(1, 'Monthly card reward list contains a duplicate card');
      seenCards.add(cardId);

      const cardConfig = cardById.get(cardId);
      if (!cardConfig) throw new GameError(5, 'Monthly card configuration is unavailable');
      const purchasedCard = info.card_list.find(row => Number(row.id) === cardId);
      if (!purchasedCard || !activeOnDay(cardConfig, purchasedCard, currentDay)) {
        throw new GameError(309, 'Monthly card is not active');
      }

      const requestedDays = requestedCard?.day;
      if (!Array.isArray(requestedDays) || requestedDays.length === 0) {
        throw new GameError(1, 'Monthly card reward day list is empty');
      }
      const seenDays = new Set();
      let rewardBits = rewardBytes(purchasedCard.got_reward);
      const startDay = Number(purchasedCard.start_day);
      for (const rawDay of requestedDays) {
        const day = positiveInteger(rawDay, 'reward day', 1);
        if (day > cardConfig.reward_period) throw new GameError(1, 'Monthly card reward day is out of range');
        if (seenDays.has(day)) throw new GameError(1, 'Monthly card reward day is duplicated');
        seenDays.add(day);
        if (startDay + day - 1 > currentDay) throw new GameError(309, 'Monthly card reward is not available yet');
        if (hasBit(rewardBits, day)) throw new GameError(310, 'Monthly card reward already claimed');
        rewardBits = setBit(rewardBits, day);

        if (!Array.isArray(cardConfig.reward)) throw new GameError(5, 'Monthly card reward configuration is unavailable');
        for (const reward of cardConfig.reward) {
          awards.push([
            positiveInteger(reward?.[0], 'reward id'),
            positiveInteger(reward?.[1], 'reward quantity')
          ]);
        }
        claims.push({ cardId, day });
      }
      purchasedCard.got_reward = rewardBits;
      purchasedCard.got_count = countRewardBits(rewardBits, cardConfig.reward_period);
      purchasedCard.last_get_reward_day = currentDay;
      updatedCards.set(cardId, purchasedCard);
    }

    const granted = grantResources(model, awards, tables, { codec });
    const latestModules = new Map(model.state.modules.value);
    latestModules.set(MONTHLY_CARD_MODULE, serializedBinary(codec.pack('pb_monthly_card_info', info)));
    model.state.modules.value = [...latestModules];
    const cards = [...updatedCards.values()];
    return {
      cardIds: cards.map(card => Number(card.id)),
      claims,
      changes: granted.changes.length,
      response: {
        card: cards,
        res: { changes: granted.changes, is_overflow: false }
      }
    };
  }

  // FreePrivilegeActCmd.req_free_privilege_act_activate_month (110602) grants the
  // activity version's month card without a recharge. The entry, start day and
  // serialization match purchase() so login module 20, the daily reward bits and
  // the can-buy checks all read one authoritative row. A card that is already
  // active on the current day is refused instead of being restarted, otherwise a
  // repeated free activation would extend the reward period for free.
  function activateFreeCard({ model, cardId, at = now() }) {
    const id = positiveInteger(cardId, 'id');
    const card = cardById.get(id);
    if (!card) throw new GameError(5, 'Monthly card configuration is unavailable');
    const modules = new Map(model.state.modules.value);
    const { info } = readInfo(modules);
    const startDay = rechargeDayIndex(at);
    const existing = info.card_list.find(row => Number(row.id) === id);
    if (activeOnDay(card, existing, startDay)) throw new GameError(307, 'Monthly card is already active');
    const entry = {
      id,
      invalid_day: 0,
      last_get_reward_day: 0,
      last_get_add_reward_day: 0,
      got_count: 0,
      start_day: startDay,
      got_reward: Buffer.alloc(0)
    };
    const existingIndex = info.card_list.findIndex(row => Number(row.id) === id);
    if (existingIndex >= 0) info.card_list[existingIndex] = entry;
    else info.card_list.push(entry);
    modules.set(MONTHLY_CARD_MODULE, serializedBinary(codec.pack('pb_monthly_card_info', info)));
    model.state.modules.value = [...modules];
    return { cardId: id, startDay, info, entry };
  }


  return { supports, assertPurchaseAvailable, purchase, claim, activateFreeCard, repairLegacyClaimBits, cardByRecharge, cardById };
}
