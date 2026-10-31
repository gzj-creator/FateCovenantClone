const TYPE_ONE_REWARDS = Object.freeze([
  132317, 132617, 132817, 133017, 133217, 133417
]);
const TYPE_TWO_REWARDS = Object.freeze([
  132517, 132717, 132917, 133117, 133317, 133517
]);

export const WISH_TREASURE_GLOBAL = Object.freeze({
  one_award_day: 10,
  open_award_num: 2,
  max_phase: 73
});

export const WISH_TREASURE_GIFT_TYPES = new Map([
  [1, new Set([46003, 46002, 40009])],
  [2, new Set([40010, 40008])]
]);

export function wishTreasureTypeForGift(productId) {
  const id = Number(productId);
  for (const [type, products] of WISH_TREASURE_GIFT_TYPES) {
    if (products.has(id)) return type;
  }
  return 0;
}

export function wishTreasureReward(type, phase) {
  const giftType = Number(type), phaseNumber = Number(phase);
  if (![1, 2].includes(giftType)
    || !Number.isSafeInteger(phaseNumber)
    || phaseNumber < 1
    || phaseNumber > WISH_TREASURE_GLOBAL.max_phase) {
    return null;
  }
  const normal = giftType === 1 ? TYPE_ONE_REWARDS : TYPE_TWO_REWARDS;
  if (phaseNumber <= 12) return { tid: normal[(phaseNumber - 1) % normal.length], count: 1 };
  if (phaseNumber <= 16) {
    const pair = giftType === 1 ? [134817, 135017] : [134917, 135117];
    return { tid: pair[(phaseNumber - 13) % 2], count: 1 };
  }
  if (phaseNumber <= 19) {
    const tail = giftType === 1 ? [132317, 132617, 133417] : [132517, 132717, 133517];
    return { tid: tail[phaseNumber - 17], count: 1 };
  }
  return { tid: giftType === 1 ? 3161200 : 3171200, count: 1 };
}

export function wishTreasureAward(type, phase) {
  const giftType = Number(type), phaseNumber = Number(phase);
  const reward = wishTreasureReward(giftType, phaseNumber);
  return reward ? { type: giftType, phase: phaseNumber, awardId: giftType * 1000 + phaseNumber, ...reward } : null;
}

export function parseWishTreasureAwardId(value) {
  const awardId = Number(value);
  if (!Number.isSafeInteger(awardId) || awardId <= 0) return null;
  const type = Math.floor(awardId / 1000), phase = awardId % 1000;
  return wishTreasureAward(type, phase);
}
