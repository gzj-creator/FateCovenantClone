import crypto from 'node:crypto';
import { readJsonAsset, tableAsset } from '../assets.mjs';

const defaultPath = tableAsset('CareerLifeTable.data.rows.json');

export const CAREER_LIFE_TABLE_SOURCE_SHA256 =
  '825e93fc514bdebf683f96dfad1977bc1a05b437a2f45097cac4b0f925c49a90';
export const CAREER_LIFE_TABLE_ROW_DIGEST =
  '1e91dbefabda7c8828bb137a0202161a3a3b98acd84a38904e876bdd3a065c2d';
export const CAREER_LIFE_EXPECTED_COUNTS = Object.freeze({
  StoryChapter: 18,
  Story: 99,
  BossConst: 1,
  Boss: 0
});

let defaultCache;

function integer(value, label, { min = 0 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) {
    throw new Error(`Invalid CareerLife ${label}: ${value}`);
  }
  return number;
}

function byTid(rows, label) {
  const result = new Map();
  for (const raw of rows) {
    const row = Object.freeze({ ...raw, tid: integer(raw?.tid, `${label}.tid`, { min: 1 }) });
    if (result.has(row.tid)) throw new Error(`CareerLife ${label} duplicates tid ${row.tid}`);
    result.set(row.tid, row);
  }
  return result;
}

export function readCareerLifeTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  if (!dump || typeof dump !== 'object' || Array.isArray(dump)) {
    throw new Error('CareerLifeTable dump is missing its table families');
  }
  for (const [family, expected] of Object.entries(CAREER_LIFE_EXPECTED_COUNTS)) {
    if (!Array.isArray(dump[family]) || dump[family].length !== expected) {
      throw new Error(`CareerLifeTable ${family} has ${dump[family]?.length ?? 0} rows, expected ${expected}`);
    }
  }
  const digest = crypto.createHash('sha256').update(JSON.stringify({
    StoryChapter: dump.StoryChapter,
    Story: dump.Story,
    BossConst: dump.BossConst,
    Boss: dump.Boss
  })).digest('hex');
  if (digest !== CAREER_LIFE_TABLE_ROW_DIGEST) {
    throw new Error('CareerLifeTable rows do not match the R1 evidence digest');
  }

  const chapters = byTid(dump.StoryChapter.map(raw => {
    const tid = integer(raw?.tid, 'StoryChapter.tid', { min: 1 });
    const res = integer(raw?.res, `StoryChapter.${tid}.res`);
    const resCount = integer(raw?.res_count, `StoryChapter.${tid}.res_count`);
    // All 18 R1 rows carry a zero award. A nonzero row would require an
    // unrecovered award-list mapping, so reject the table rather than silently
    // claiming without its resource.
    if (res !== 0 || resCount !== 0) {
      throw new Error(`CareerLife StoryChapter.${tid} carries an unsupported award`);
    }
    return Object.freeze({ ...raw, tid, res, res_count: resCount });
  }), 'StoryChapter');

  const stories = byTid(dump.Story.map(raw => {
    const tid = integer(raw?.tid, 'Story.tid', { min: 1 });
    const chapter = integer(raw?.chapter, `Story.${tid}.chapter`, { min: 1 });
    const openMission = integer(raw?.open_mission, `Story.${tid}.open_mission`, { min: 1 });
    if (!chapters.has(chapter)) throw new Error(`CareerLife Story.${tid} uses unknown chapter ${chapter}`);
    return Object.freeze({ ...raw, tid, chapter, open_mission: openMission });
  }), 'Story');

  const storiesByChapter = new Map([...chapters.keys()].map(tid => [tid, []]));
  for (const story of stories.values()) storiesByChapter.get(story.chapter).push(story);
  for (const [chapter, rows] of storiesByChapter) {
    if (!rows.length) throw new Error(`CareerLife chapter ${chapter} has no stories`);
    rows.sort((left, right) => left.tid - right.tid);
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index].open_mission < rows[index - 1].open_mission) {
        throw new Error(`CareerLife chapter ${chapter} story mission order is not monotonic`);
      }
    }
    Object.freeze(rows);
  }

  const bossConst = byTid(dump.BossConst, 'BossConst');
  if (!bossConst.has(1)) throw new Error('CareerLife BossConst.1 is missing');
  const boss = byTid(dump.Boss, 'Boss');

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '1293368150589613600-CareerLifeTable.data.lua.bin',
      sha256: CAREER_LIFE_TABLE_SOURCE_SHA256,
      row_digest: CAREER_LIFE_TABLE_ROW_DIGEST
    }),
    counts: CAREER_LIFE_EXPECTED_COUNTS,
    chapters,
    stories,
    storiesByChapter,
    bossConst,
    boss,
    maxChapter: Math.max(...chapters.keys())
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}
