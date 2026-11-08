import { readJsonAsset, tableAsset } from '../assets.mjs';
import { awardPairs, byTid, integerField, rowsOf } from './lua-table-dump.mjs';

// MartialClubActTable (武馆活动) — extracted by tools/extract-lua-table.mjs.
// The campaign ships ten boss rows (every fourth boss of the permanent martial
// club). In this client build every first_award column is an empty literal while
// server_award carries the real reward, which is recorded as an evidence fact in
// agent/workflow/gameplay-completion/BATTLE-MARTIALCLUBACT/implementation.md.
const defaultPath = tableAsset('MartialClubActTable.data.lua.json');
let defaultCache;

export function readMartialClubActTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const rows = rowsOf(dump, 'MartialClubAct').map(row => ({
    tid: integerField(row, 'tid', 'MartialClubAct', { min: 1 }),
    firstAward: awardPairs(row.first_award, 'MartialClubAct'),
    serverAward: awardPairs(row.server_award, 'MartialClubAct')
  }));
  const result = { source: dump.source ?? null, rows: byTid(rows) };
  if (!result.rows.size) throw new Error('MartialClubAct configuration is empty');
  if (file === defaultPath) defaultCache = result;
  return result;
}
