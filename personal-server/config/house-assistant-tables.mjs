import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultTablePath = tableAsset('HouseAssistantTable.data.lua.json');
let defaultCache;

export const HOUSE_ASSISTANT_SCENE_MAIN = 1;
export const HOUSE_ASSISTANT_SCENE_SUPPORT = 2;
export const HOUSE_ASSISTANT_ITEM_TYPE = 225;
export const HOUSE_BACKGROUND_ITEM_TYPE = 226;
export const DEFAULT_HOUSE_ASSISTANT_TID = 10043200;
export const DEFAULT_HOUSE_BACKGROUND_TID = 20013200;

export function readHouseAssistantTables(file = defaultTablePath) {
  if (file === defaultTablePath && defaultCache) return defaultCache;
  const generated = readGeneratedTables(file, ['Scene', 'Trial']);
  const scenes = new Map();
  for (const [key, row] of generated.Scene) {
    const id = Number(row?.tid ?? key);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid house-assistant scene id: ${key}`);
    scenes.set(id, Object.freeze({ id }));
  }
  const trials = new Map();
  for (const [key, row] of generated.Trial) {
    const id = Number(row?.id ?? key);
    const itemTid = Number(row?.tid);
    const durationSeconds = Number(row?.duration);
    const activityId = Number(row?.act_tid);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        !Number.isSafeInteger(itemTid) || itemTid <= 0 ||
        !Number.isSafeInteger(durationSeconds) || durationSeconds <= 0 ||
        !Number.isSafeInteger(activityId) || activityId <= 0) {
      throw new Error(`Invalid house-assistant trial configuration: ${key}`);
    }
    if (trials.has(id)) throw new Error(`Duplicate house-assistant trial id: ${id}`);
    trials.set(id, Object.freeze({ id, itemTid, durationSeconds, activityId }));
  }
  const tables = Object.freeze({ scenes, trials });
  if (file === defaultTablePath) defaultCache = tables;
  return tables;
}
