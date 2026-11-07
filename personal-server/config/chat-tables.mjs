import { readJsonAsset, tableAsset } from '../assets.mjs';

// ChatTable.Param and ChatTable.ReportConst ship inside ChatTable.data.lua of
// client 1.55.090365 and are recovered read-only by
// tools/extract-chat-table.mjs (see
// agent/workflow/gameplay-completion/SOC-CHAT/implementation.md). ChatMgr reads
// the rows at module init (ChatMgr prototype 92): send_time_interval,
// count_limit_in_cd, max_msg_count, chat_word_count_limit,
// world_chat_level_limit, private_chat_lv_limit, ... and the report limits.
const paramPath = tableAsset('ChatTable.Param.json.gz');
const reportPath = tableAsset('ChatTable.ReportConst.json.gz');
let defaultCache;

const PARAM_FIELDS = Object.freeze([
  'tid', 'show_time_interval', 'world_chat_level_limit', 'chat_word_count_limit',
  'cancel_ban_lv_inc', 'send_time_interval', 'count_limit_in_cd',
  'sys_tips_auto_disappear_time', 'similarity_msg_limit', 'similarity_check_limit',
  'similarity_msg_count_limit', 'emoj_count', 'black_house_level_limit',
  'max_msg_count', 'login_chat_msg_count', 'save_chat_msg_days', 'max_link_count',
  'max_private_session_count', 'private_chat_lv_limit', 'private_chat_lv_dt_limit',
  'pull_history_count', 'security_tips_limit', 'link_default_color',
  'chat_record_max_length', 'chat_preview_time', 'private_chat_auto_round_time',
  'private_chat_auto_round_old_index', 'chat_latest_msg_show_time',
  'chat_latest_msg_str_len'
]);

const REPORT_FIELDS = Object.freeze(['tid', 'day_times', 'report_msg_num', 'report_msg_valid_time']);

function readRow(asset, fields, label) {
  if (!Array.isArray(asset?.rows) || asset.rows.length !== 1) {
    throw new Error('ChatTable.' + label + ' has an unexpected row count');
  }
  const row = asset.rows[0];
  if (Number(row?.tid) !== 1) throw new Error('ChatTable.' + label + ' has an unexpected tid');
  const out = {};
  for (const field of fields) {
    if (!(field in row)) throw new Error('ChatTable.' + label + ' is missing ' + field);
    out[field] = row[field];
  }
  for (const [field, value] of Object.entries(out)) {
    if (field === 'link_default_color') {
      if (typeof value !== 'string') throw new Error('ChatTable.' + label + ' has a non-string ' + field);
      continue;
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error('ChatTable.' + label + ' has an invalid ' + field);
    out[field] = number;
  }
  return Object.freeze(out);
}

export function readChatTables({ param = paramPath, report = reportPath } = {}) {
  if (param === paramPath && report === reportPath && defaultCache) return defaultCache;
  const paramAsset = readJsonAsset(param);
  const reportAsset = readJsonAsset(report);
  const tables = Object.freeze({
    source: Object.freeze({
      param: paramAsset.source ?? null,
      report: reportAsset.source ?? null
    }),
    param: readRow(paramAsset, PARAM_FIELDS, 'Param'),
    report: readRow(reportAsset, REPORT_FIELDS, 'ReportConst')
  });
  if (param === paramPath && report === reportPath) defaultCache = tables;
  return tables;
}
