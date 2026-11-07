import { readJsonAsset, tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('RankAchieveTable.data.json.gz');
let defaultCache;

const EXPECTED_ROWS = Object.freeze({
  RankAchieve: 84,
  EventType: 59,
  EventTimeSeparate: 6,
  Type: 4
});

function tableRows(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows) || table.rows.length !== EXPECTED_ROWS[name]) {
    throw new Error(`Rank achieve table ${name} has an unexpected row count`);
  }
  return table.rows;
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`Invalid rank achieve ${label}`);
  return number;
}

function awardPairs(value, label) {
  if (!Array.isArray(value)) throw new Error(`Invalid rank achieve ${label}`);
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Invalid rank achieve ${label}`);
    return [positiveNumber(pair[0], label), positiveNumber(pair[1], label)];
  });
}

function validate(rows, eventTypes) {
  const achievements = new Map();
  for (const source of rows.RankAchieve) {
    const tid = positiveNumber(source.tid, 'achievement id');
    const type = positiveNumber(source.type, `achievement ${tid} type`);
    const eventType = positiveNumber(source.event_type, `achievement ${tid} event type`);
    if (!eventTypes.has(eventType)) throw new Error(`Rank achieve event ${eventType} is missing`);
    const award = awardPairs(source.award, `achievement ${tid} award`);
    const finishAward = awardPairs(source.finish_award, `achievement ${tid} finish award`);
    const bit = tid % 1000;
    if (bit <= 0) throw new Error(`Rank achieve type slot does not match tid ${tid}`);
    achievements.set(tid, Object.freeze({
      ...source,
      tid,
      type,
      event_type: eventType,
      event_param: source.event_param,
      event_param_convert: source.event_param_convert,
      finish_award: finishAward,
      award
    }));
  }
  return achievements;
}

export function readRankAchieveTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const rows = Object.fromEntries(Object.keys(EXPECTED_ROWS).map(name => [name, tableRows(dump, name)]));
  const eventRows = new Map();
  for (const row of rows.EventType) {
    const tid = positiveNumber(row.tid, 'event type id');
    const unit = Number(row.unit), compareRule = Number(row.compare_rule);
    if (![0, 1].includes(unit) || ![0, 1, 2, 3].includes(compareRule)) {
      throw new Error(`Rank achieve event type ${tid} has invalid qualification metadata`);
    }
    eventRows.set(tid, Object.freeze({ ...row, tid, unit, compare_rule: compareRule }));
  }
  const achievements = validate(rows, eventRows);
  const achievementTypes = new Map();
  for (const tid of rows.Type.map(row => positiveNumber(row.tid, 'achievement section id'))) achievementTypes.set(tid, tid);
  for (const row of achievements.values()) {
    if (!achievementTypes.has(row.type)) throw new Error(`Rank achieve section ${row.type} is missing`);
  }
  const result = Object.freeze({
    source: dump.source ?? null,
    achievements,
    eventTypes: eventRows,
    eventTimeSeparate: new Map(rows.EventTimeSeparate.map(row => [positiveNumber(row.tid, 'timed event id'), row])),
    achievementTypes,
    counts: Object.freeze({ ...EXPECTED_ROWS })
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}
