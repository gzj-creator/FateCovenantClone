import { GameError } from './hero-progression.mjs';
import { readOverallMatchTables } from '../config/arena-tables.mjs';

// OverallMatchCmd.lua declares a single command, req_overall_match_start, which
// encodes pb_overall_match_start_req and expects pb_overall_match_start_rsp.
// See agent/workflow/gameplay-completion/BATTLE-OVERALLMATCH/implementation.md.
const COMMAND_START = 120001;
const SUPPORTED = [COMMAND_START];

const CODE_INVALID = 1;
const CODE_STATE = 5;

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS overall_match_queue (' +
    'role_id INTEGER PRIMARY KEY,' +
    'match_type INTEGER NOT NULL,' +
    'opt INTEGER NOT NULL,' +
    'rank INTEGER NOT NULL,' +
    'power INTEGER NOT NULL,' +
    'matched_at INTEGER NOT NULL,' +
    'updated_at TEXT NOT NULL)'
  );
}

export function createOverallMatchService({
  store,
  codec,
  tables = readOverallMatchTables(),
  now = Date.now,
  logger = () => {}
}) {
  const log = (event) => { try { logger(event); } catch {} };
  const types = Array.from(tables.type.values());

  function supports(type) { return SUPPORTED.includes(type); }

  function ruleFor(matchType) {
    const rule = tables.rule.get(matchType) ?? tables.rule.get(types[0]?.tid) ?? null;
    if (!rule) fail(CODE_STATE, 'Overall match rule configuration is missing');
    return rule;
  }

  // The pairing rules in OverallMatchTable.Rule describe how far the matched
  // role's rank and power may differ. This deployment has one role, so the pair
  // it can honestly offer is itself: rank difference 0 and power rate 100.
  async function start(input) {
    const matchType = integer(input ? input.match_type : undefined, 0, 1000000, 'Overall match type is missing');
    const opt = integer(input && input.opt !== undefined ? input.opt : 0, -1000000, 1000000, 'Overall match option is invalid');
    if (!tables.type.has(matchType)) fail(CODE_STATE, 'Overall match type is not configured: ' + matchType);
    const rule = ruleFor(matchType);
    const maxRankDiff = integer(rule.max_rank_diff ?? 0, 0, 1000000, 'Overall match rank window is invalid');
    const powerMin = integer(rule.power_rate_min ?? 100, 1, 1000, 'Overall match power floor is invalid');
    const powerMax = integer(rule.power_rate_max ?? 100, 1, 1000, 'Overall match power ceiling is invalid');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const roleId = model.state.roleId;
      const seconds = Math.floor(nowMs / 1000);
      db.prepare('INSERT INTO overall_match_queue (role_id, match_type, opt, rank, power, matched_at, updated_at)' +
        ' VALUES (?,?,?,?,?,?,?) ON CONFLICT(role_id) DO UPDATE SET' +
        ' match_type=excluded.match_type, opt=excluded.opt, rank=excluded.rank,' +
        ' power=excluded.power, matched_at=excluded.matched_at, updated_at=excluded.updated_at')
        .run(roleId, matchType, opt, 1, 0, seconds, isoSeconds(nowMs));
      log({ event: 'overall_match_queued', matchType, opt, maxRankDiff, powerMin, powerMax });
      return {
        value: { matchType, opt, rank: 1 },
        data: codec.pack('pb_overall_match_start_rsp', { match_type: matchType, opt })
      };
    });
  }

  async function execute(type, input) {
    if (type === COMMAND_START) return start(input);
    fail(CODE_INVALID, 'Unsupported overall match command');
  }

  return {
    supports, execute,
    commands: SUPPORTED,
    constants: { types: types.length }
  };
}

