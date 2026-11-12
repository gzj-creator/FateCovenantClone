const DAY_SECONDS = 86400;

export const DEFAULT_TIMEZONE_OFFSET_SECONDS = 8 * 3600;
export const DEFAULT_RESET_HOUR = 5;

function timestampSeconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function timeOptions(options = {}) {
  const timezoneOffsetSeconds = Number(options.timezoneOffsetSeconds ?? DEFAULT_TIMEZONE_OFFSET_SECONDS);
  const resetHour = Number(options.resetHour ?? DEFAULT_RESET_HOUR);
  if (!Number.isSafeInteger(timezoneOffsetSeconds) || Math.abs(timezoneOffsetSeconds) > DAY_SECONDS) {
    throw new Error('timezoneOffsetSeconds must be an integer within one day');
  }
  if (!Number.isInteger(resetHour) || resetHour < 0 || resetHour > 23) {
    throw new Error('resetHour must be an integer between 0 and 23');
  }
  return { timezoneOffsetSeconds, resetHour, resetOffsetSeconds: resetHour * 3600 };
}

// Natural calendar day: local 00:00 in the realm timezone.
export function naturalDay(value, options = {}) {
  const { timezoneOffsetSeconds } = timeOptions(options);
  const at = timestampSeconds(value);
  return Math.floor((at + timezoneOffsetSeconds) / DAY_SECONDS) * DAY_SECONDS - timezoneOffsetSeconds;
}

// Business day: local reset hour (05:00 by default) in the realm timezone.
export function gameDay(value, options = {}) {
  const { timezoneOffsetSeconds, resetOffsetSeconds } = timeOptions(options);
  const at = timestampSeconds(value);
  return Math.floor((at + timezoneOffsetSeconds - resetOffsetSeconds) / DAY_SECONDS) * DAY_SECONDS
    - timezoneOffsetSeconds + resetOffsetSeconds;
}

// Server day number: the opening business day is day 1, independent of the
// opening hour. A realm opened at 18:00 therefore enters day 2 at 05:00.
export function serverDay(serverOpenedAt, value, options = {}) {
  const opened = timestampSeconds(serverOpenedAt);
  if (opened <= 0) return 0;
  if (timestampSeconds(value) < opened) return 0;
  const difference = gameDay(value, options) - gameDay(opened, options);
  return Math.max(0, Math.floor(difference / DAY_SECONDS) + 1);
}

// Week: Monday at the business-day reset hour.
export function gameWeek(value, options = {}) {
  const day = gameDay(value, options);
  const { timezoneOffsetSeconds } = timeOptions(options);
  const weekday = new Date((day + timezoneOffsetSeconds) * 1000).getUTCDay();
  return day - ((weekday + 6) % 7) * DAY_SECONDS;
}

// Derived helpers used by persistence keys and display code. They contain no
// timezone or reset constants of their own.
export function gameDayIndex(value, options = {}) {
  // Serial business-day number compatible with the legacy
  // floor((seconds + resetOffset) / 86400) counters. The value increments at
  // the business-day boundary and is stable across process restarts.
  return Math.floor(gameDay(value, options) / DAY_SECONDS) + 1;
}

export function localDateKey(value, options = {}) {
  const { timezoneOffsetSeconds } = timeOptions(options);
  return new Date((naturalDay(value, options) + timezoneOffsetSeconds) * 1000).toISOString().slice(0, 10);
}

export function localWeekday(value, options = {}) {
  const { timezoneOffsetSeconds } = timeOptions(options);
  return new Date((naturalDay(value, options) + timezoneOffsetSeconds) * 1000).getUTCDay();
}

