import { rawBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

const STATISTICS_MODULE = 21;
const ROLE_STATISTICS_TYPE = 0;

// TaskType.progress_type=2 rows read the role statistics payload that login
// module 21 carries. TaskType.data selects the CountStatistics slot and
// stat_expand lists the statistic ids that add up to the task progress.
export function statisticTaskProgress({ model, typeConfig, codec, gameTables, label }) {
  const fail = message => {
    throw new GameError(5, `${label} ${message}`);
  };
  if (!Array.isArray(typeConfig.stat_expand)) fail('statistics are not configured');
  const statisticsType = Number(typeConfig.data);
  const roleStatistics = [...(gameTables.CountStatistics?.values() ?? [])]
    .filter(row => !row.custom_login && Number(row.type) === ROLE_STATISTICS_TYPE);
  const index = roleStatistics.findIndex(row => Number(row.tid) === statisticsType);
  if (index < 0) fail('statistics slot is not configured');
  const module = new Map(model.state.modules.value).get(STATISTICS_MODULE);
  if (!module || !Array.isArray(module.value)) fail('statistics login module is missing');
  const payload = module.value[index + 1];
  if (payload == null) return 0;
  let data;
  try {
    data = codec.unpack('pb_count_statics_data', rawBinary(payload));
  } catch {
    fail('statistics payload is invalid');
  }
  const ids = new Set(typeConfig.stat_expand.map(String));
  let total = 0n;
  for (const row of data.list ?? []) {
    if (!ids.has(String(row.id))) continue;
    const value = BigInt(row.total ?? 0);
    if (value < 0n) fail('statistics payload is invalid');
    total += value;
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) fail('statistics overflow');
  return Number(total);
}
