import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ACTIVITY_CALENDAR_MODES = new Set(['schedule', 'all-open']);
export const DEFAULT_ACTIVITY_CALENDAR_CONFIG_PATH = fileURLToPath(new URL('./activity-calendar.json', import.meta.url));

export function parseActivityCalendarTimestamp(value, name = 'serverOpenedAt') {
  const text = String(value ?? '').trim();
  if (/^\d+$/.test(text)) {
    const numeric = Number(text);
    if (Number.isSafeInteger(numeric) && numeric > 0) return numeric > 100000000000 ? Math.floor(numeric / 1000) : numeric;
  }
  const parsed = Date.parse(text);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed / 1000);
  throw new Error(`${name} must be a Unix timestamp or ISO date`);
}

export function parseActivityCalendarConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Activity calendar config must be an object');
  const mode = String(value.mode ?? 'schedule').trim();
  if (!ACTIVITY_CALENDAR_MODES.has(mode)) throw new Error(`Unsupported activity calendar mode: ${mode}`);
  const serverOpenedAt = parseActivityCalendarTimestamp(value.serverOpenedAt);
  const activityWindowAnchor = value.activityWindowAnchor == null
    ? null
    : parseActivityCalendarTimestamp(value.activityWindowAnchor, 'activityWindowAnchor');
  const activityReferenceOpenedAt = value.activityReferenceOpenedAt == null
    ? null
    : parseActivityCalendarTimestamp(value.activityReferenceOpenedAt, 'activityReferenceOpenedAt');
  if (activityWindowAnchor != null && activityWindowAnchor > serverOpenedAt) {
    throw new Error('activityWindowAnchor must not be later than serverOpenedAt');
  }
  if (activityReferenceOpenedAt != null && activityReferenceOpenedAt > serverOpenedAt) {
    throw new Error('activityReferenceOpenedAt must not be later than serverOpenedAt');
  }
  let currentFishingActivityId = null;
  if (value.currentFishingActivityId != null) {
    currentFishingActivityId = Number(value.currentFishingActivityId);
    if (!Number.isSafeInteger(currentFishingActivityId) || currentFishingActivityId <= 0) {
      throw new Error('currentFishingActivityId must be a positive integer');
    }
  }
  return { mode, serverOpenedAt, activityReferenceOpenedAt, activityWindowAnchor, currentFishingActivityId };
}

export function loadActivityCalendarConfig(configPath = DEFAULT_ACTIVITY_CALENDAR_CONFIG_PATH) {
  const resolved = path.isAbsolute(configPath) ? configPath : path.resolve(configPath);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to load activity calendar config ${resolved}: ${error.message}`);
  }
  return parseActivityCalendarConfig(parsed);
}
