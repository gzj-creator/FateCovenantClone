import { GameError } from './hero-progression.mjs';

const CMS_DATA_INFO = 89501;

function configuredCmsIds(cmsTable) {
  if (!(cmsTable instanceof Map)) return new Set();
  return new Set([...cmsTable.keys()]
    .map(Number)
    .filter(tid => Number.isSafeInteger(tid) && tid > 0));
}

export function createCmsService({ codec, store, tables, now = Date.now }) {
  const knownCmsIds = configuredCmsIds(tables?.Cms);
  const currentSeconds = () => Math.max(0, Math.trunc(Number(now()) / 1000));

  function query(cmsTid) {
    if (!Number.isSafeInteger(cmsTid) || cmsTid <= 0 || !knownCmsIds.has(cmsTid)) {
      throw new GameError(1, 'Unknown CMS type');
    }
    const timestamp = currentSeconds();
    const rows = store.inspect(db => db.prepare(`
      SELECT question_id,title,link,award,start_time,end_time
      FROM cms_questions
      WHERE cms_tid=? AND enabled=1 AND start_time<=? AND end_time>?
      ORDER BY end_time ASC, question_id ASC
    `).all(cmsTid, timestamp, timestamp));
    const value = {
      question_list: rows.map(row => ({
        title: row.title,
        link: row.link,
        award: row.award,
        start_time: String(row.start_time),
        end_time: String(row.end_time)
      }))
    };
    return { data: codec.pack('pb_cms_question_info', value), value, cmsTid };
  }

  return {
    supports: type => Number(type) === CMS_DATA_INFO,
    execute(cmsTid) { return query(cmsTid); }
  };
}
