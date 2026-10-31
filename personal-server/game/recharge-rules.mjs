const DAY_SECONDS = 86400;
// Recharge day boundaries are 05:00 Asia/Shanghai. In UTC that is 21:00 on
// the preceding calendar day, so epoch seconds are shifted by three hours.
const RECHARGE_RESET_OFFSET_SECONDS = 3 * 3600;

export function timestampSeconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.floor(number > 100000000000 ? number / 1000 : number);
}

export function rechargeDayIndex(value) {
  return Math.floor((timestampSeconds(value) + RECHARGE_RESET_OFFSET_SECONDS) / DAY_SECONDS);
}

export function rechargeDayStart(value) {
  return rechargeDayIndex(value) * DAY_SECONDS - RECHARGE_RESET_OFFSET_SECONDS;
}

// RoleMgr.GetLoginDayCount uses the role's creation day in the same 05:00
// cycle. The first partial day and the creation day itself both count as day 1.
export function roleLoginDayCount(createdAt, at) {
  const created = timestampSeconds(createdAt);
  if (!created) return 1;
  return Math.max(1, rechargeDayIndex(at) - rechargeDayIndex(created) + 1);
}

// Server-scoped activities count their activation day as day 1. Unlike the
// general activity calendar, recharge features reset at 05:00 Asia/Shanghai,
// so this must use the same shifted epoch as rechargeDayIndex.
export function rechargeServerDayNumber(serverOpenedAt, at) {
  const opened = timestampSeconds(serverOpenedAt);
  if (!opened) return 1;
  return Math.max(1, rechargeDayIndex(at) - rechargeDayIndex(opened) + 1);
}

export function requireCentAmount(value, label = 'amount', { allowZero = false } = {}) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new TypeError(`${label} must be an exact integer number of cents`);
  }
  return value;
}

// Requests sent by the recharge commands use ETF lists or bare integers. Keep
// normalization recursive but limited to numeric values so malformed nested
// payloads cannot accidentally become a valid command.
export function etfIntegerList(value) {
  const candidate = value?.value instanceof Uint8Array || Array.isArray(value?.value)
    ? value.value
    : value;
  if (!Array.isArray(candidate)) return [Number(candidate)];
  return candidate.map(entry => Number(entry?.value ?? entry));
}

export function requireRechargeRequestTuple(value, length, label) {
  const tuple = etfIntegerList(value);
  if (tuple.length !== length || tuple.some(item => !Number.isSafeInteger(item) || item < 0)) {
    throw new TypeError(`${label} must contain ${length} non-negative integers`);
  }
  return tuple;
}

export function parseRechargeExtraParam(value, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new TypeError('Recharge extra parameter is required');
    return { is_extra_buy: false, period: 0, day_index: 0 };
  }
  let parsed;
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new TypeError('Recharge extra parameter must be JSON');
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || !Array.isArray(parsed[0]) || parsed[0].length !== 3) {
    throw new TypeError('Recharge extra parameter must contain one [is_extra_buy, period, day] tuple');
  }
  const [isExtraBuy, period, day] = parsed[0];
  if (typeof isExtraBuy !== 'boolean'
    || !Number.isSafeInteger(period) || period < 0
    || !Number.isSafeInteger(day) || day < 0) {
    throw new TypeError('Recharge extra parameter contains invalid values');
  }
  return { is_extra_buy: isExtraBuy, period, day_index: day };
}

export function rechargeCycleKey(product, at, { period = 0 } = {}) {
  const cycle = Number(product?.buy_cycle_limit ?? 0);
  if (cycle === 0) return 'unlimited';
  if (cycle === 1) return 'day:' + rechargeDayIndex(at);
  if (cycle === 2 || cycle === 3) return 'week:' + Math.floor((rechargeDayIndex(at) + 3) / 7);
  if ([4, 5, 7].includes(cycle)) {
    if (!Number.isSafeInteger(period) || period < 0) throw new TypeError('This recharge product requires a non-negative period');
    return 'period:' + period;
  }
  if (cycle === 6) return 'lifetime';
  throw new TypeError('Unsupported recharge cycle ' + cycle);
}

export function rechargeClaimKey(...parts) {
  if (!parts.length || parts.some(part => String(part).length === 0)) {
    throw new TypeError('A recharge claim key requires non-empty parts');
  }
  return parts.map(String).join(':');
}
