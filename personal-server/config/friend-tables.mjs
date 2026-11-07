import { readJsonAsset, tableAsset } from '../assets.mjs';

// FriendTable.data.lua ships with client 1.55.090365 and was recovered read-only
// from the extracted LuaJIT bytecode (see
// agent/workflow/gameplay-completion/SOC-FRIEND/evidence.md). Only the Limit,
// Param and Recommend sub tables are interpreted here; the table carries no
// friendship reward rows (present_rewards and rev_rewards are empty).
const defaultPath = tableAsset('FriendTable.data.lua.json.gz');
let defaultCache;

const EXPECTED_COUNTS = Object.freeze({ Limit: 4, Param: 1, Recommend: 4 });

function rowsOf(dump, name) {
  const table = dump?.[name];
  if (!table || typeof table !== 'object') throw new Error(`Friend table ${name} is missing`);
  const rows = Object.values(table).sort((left, right) => Number(left.tid) - Number(right.tid));
  if (rows.length !== EXPECTED_COUNTS[name]) throw new Error(`Friend table ${name} has an unexpected row count`);
  return rows;
}

function integer(value, label, { min = 0 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new Error(`Invalid friend ${label}`);
  return number;
}

function pairs(value, label) {
  if (!Array.isArray(value)) throw new Error(`Invalid friend ${label}`);
  return value.map(entry => {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error(`Invalid friend ${label}`);
    return [integer(entry[0], label, { min: 1 }), integer(entry[1], label)];
  });
}

function readLimit(rows) {
  return rows.map(row => {
    const range = row.lv_range;
    if (!Array.isArray(range) || range.length !== 2) throw new Error('Invalid friend Limit lv_range');
    return {
      tid: integer(row.tid, 'Limit tid', { min: 1 }),
      lv_range: [integer(range[0], 'Limit level', { min: 1 }), integer(range[1], 'Limit level', { min: 1 })],
      daily_present_rewards: pairs(row.daily_present_rewards ?? [], 'Limit daily_present_rewards'),
      max_friend_count: integer(row.max_friend_count, 'Limit max_friend_count', { min: 1 }),
      max_receive_friendship_count: integer(row.max_receive_friendship_count, 'Limit max_receive_friendship_count', { min: 1 })
    };
  });
}

function readParam(row) {
  return {
    tid: integer(row.tid, 'Param tid', { min: 1 }),
    max_apply_count: integer(row.max_apply_count, 'Param max_apply_count', { min: 1 }),
    max_present_friendship_count: integer(row.max_present_friendship_count, 'Param max_present_friendship_count', { min: 1 }),
    max_black_list_count: integer(row.max_black_list_count, 'Param max_black_list_count', { min: 1 }),
    max_show_apply_count: integer(row.max_show_apply_count, 'Param max_show_apply_count', { min: 1 }),
    recommend_count: integer(row.recommend_count, 'Param recommend_count', { min: 1 }),
    recommend_lv_limit: integer(row.recommend_lv_limit, 'Param recommend_lv_limit'),
    max_search_count: integer(row.max_search_count, 'Param max_search_count', { min: 1 }),
    recommend_reset_time: integer(row.recommend_reset_time, 'Param recommend_reset_time'),
    max_private_count: integer(row.max_private_count, 'Param max_private_count'),
    accuss_count: integer(row.accuss_count, 'Param accuss_count'),
    recommend_fight_life: integer(row.recommend_fight_life, 'Param recommend_fight_life'),
    recommend_max_rank: integer(row.recommend_max_rank, 'Param recommend_max_rank'),
    friendship_exchange_ratio: integer(row.friendship_exchange_ratio, 'Param friendship_exchange_ratio'),
    present_exchange_ratio: integer(row.present_exchange_ratio, 'Param present_exchange_ratio'),
    present_rewards: pairs(row.present_rewards ?? [], 'Param present_rewards'),
    rev_rewards: pairs(row.rev_rewards ?? [], 'Param rev_rewards')
  };
}

function readRecommend(rows) {
  return rows.map(row => ({
    tid: integer(row.tid, 'Recommend tid', { min: 1 }),
    name: integer(row.name, 'Recommend name'),
    imgBg: String(row.imgBg ?? '')
  }));
}

export function readFriendTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const dump = readJsonAsset(file);
  const limit = readLimit(rowsOf(dump, 'Limit'));
  const param = readParam(rowsOf(dump, 'Param')[0]);
  const recommend = readRecommend(rowsOf(dump, 'Recommend'));
  const tables = Object.freeze({
    limit: Object.freeze(limit),
    param: Object.freeze(param),
    recommend: Object.freeze(recommend),
    // Client FriendMgr.ResolveFriendLimit selects the first row whose lv_range
    // contains the role level; the last row (70-999) is the fallback.
    limitForLevel(level) {
      const value = Number(level);
      return limit.find(row => value >= row.lv_range[0] && value <= row.lv_range[1]) ?? limit[limit.length - 1];
    }
  });
  if (file === defaultPath) defaultCache = tables;
  return tables;
}
