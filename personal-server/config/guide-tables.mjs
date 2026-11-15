import { readGeneratedTables } from './hero-tables.mjs';
import { tableAsset } from '../assets.mjs';

let cached;
export function readGuideTables() {
  return cached ??= readGeneratedTables(tableAsset('GuideTable.data.json.gz'),
    ['Process', 'Step', 'Award', 'Const', 'ProcessExclusion']);
}
