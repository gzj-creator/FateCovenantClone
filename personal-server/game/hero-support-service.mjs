import { GameError } from './hero-progression.mjs';
import { readHeroSupportTables } from '../config/hero-support-tables.mjs';

// HERO-HERO draw-support cluster:
//   635 req_rev_recruit_progress_award  claim a recruitment progress award
//   651 req_draw_support_lineup         publish the exchange lineup this role supports
//   652 req_draw_get_support_data       read the wish-lineup support counts
//   673 req_draw_marquee                recruitment marquee entries
//
// These four ids only exist in the HeroCmd registry of this client build.
// 651/652/673 belong to the wish-exchange lineup UI and to the marquee channel;
// the request messages have no protobuf schema (they are encoded as plain ETF
// tuples), and 635 has no reward configuration at all. The rules below therefore
// read and write the archive that this server actually owns. Anything that would
// need another server's players is left as an explicit business code and is
// recorded in agent/workflow/gameplay-completion/HERO-HERO-B/support.md.
const COMMAND_PROGRESS_AWARD = 635;
const COMMAND_SUPPORT_LINEUP = 651;
const COMMAND_SUPPORT_DATA = 652;
const COMMAND_MARQUEE = 673;
const SUPPORTED = [COMMAND_PROGRESS_AWARD, COMMAND_SUPPORT_LINEUP, COMMAND_SUPPORT_DATA, COMMAND_MARQUEE];

const CODE_INVALID = 1;
const CODE_CONTENT = 3001;
const SUPPORT_TABLE = 'hero_draw_support';
// NormalDrawExchangeLineup keys the ordinary draw library, DrawExchangeLineup the
// advanced one. Both shipped families carry rows 1..4.
const DEFAULT_DRAW_LIB = 2;
const LINEUP_FAMILY = new Map([[1, 'DrawExchangeLineup'], [2, 'NormalDrawExchangeLineup']]);

const fail = (code, message) => { throw new GameError(code, message); };

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS ' + SUPPORT_TABLE + ' ('
    + 'role_id TEXT NOT NULL,'
    + 'draw_lib INTEGER NOT NULL,'
    + 'lineup_type INTEGER NOT NULL,'
    + 'updated_at TEXT NOT NULL,'
    + 'PRIMARY KEY(role_id, draw_lib))');
}

function positiveInt(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0 || number > 0xffffffff) fail(CODE_INVALID, 'Invalid draw ' + field);
  return number;
}

function firstPositive(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const number = Number(value);
    if (Number.isSafeInteger(number) && number > 0) return number;
  }
  return undefined;
}

// ETF requests reach the service as a bare scalar or as a flat tuple. Protobuf
// carriers (the marquee) arrive as a decoded object.
function normalize(raw) {
  const value = raw?.value ?? raw;
  if (value === undefined || value === null) return {};
  if (Array.isArray(value)) {
    const items = value.flat(Infinity).filter(item => item !== undefined && item !== null);
    if (items.length >= 2) return { draw_lib: items[0], lineup_type: items[1] };
    return items.length ? { scalar: items[0] } : {};
  }
  if (typeof value === 'object') return value;
  return { scalar: value };
}

export function createHeroSupportService({ store, codec, tables, heroTables, now = () => Date.now(), logger = () => {} }) {
  void tables;
  void heroTables;
  const log = event => { try { logger(event); } catch {} };
  const supportTables = readHeroSupportTables();
  if (!supportTables.NormalDrawExchangeLineup?.size && !supportTables.DrawExchangeLineup?.size) {
    throw new Error('Hero draw exchange lineup configuration is missing');
  }
  store.inspect(db => ensureTables(db));

  function currentSeconds() {
    const value = Number(now());
    if (!Number.isFinite(value)) fail(CODE_INVALID, 'Hero draw support clock is invalid');
    return value > 100000000000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  function roleKey(model) {
    return String(model.state.roleId);
  }

  function lineupRows(drawLib) {
    const family = LINEUP_FAMILY.get(drawLib);
    const rows = family ? supportTables[family] : undefined;
    if (!rows?.size) fail(CODE_CONTENT, 'Draw exchange lineup does not exist for draw library ' + String(drawLib));
    return rows;
  }

  function requireLineup(drawLib, lineupType) {
    const rows = lineupRows(drawLib);
    if (!rows.has(lineupType)) fail(CODE_INVALID, 'Unknown draw exchange lineup ' + String(lineupType));
    return rows.get(lineupType);
  }

  function readSupportValue(db, role, drawLib) {
    const totals = db.prepare('SELECT lineup_type, COUNT(*) AS support_num FROM ' + SUPPORT_TABLE
      + ' WHERE draw_lib=? GROUP BY lineup_type ORDER BY lineup_type').all(drawLib);
    const own = db.prepare('SELECT lineup_type FROM ' + SUPPORT_TABLE + ' WHERE role_id=? AND draw_lib=?').get(role, drawLib);
    return {
      role_support: { support_list: own ? [{ lineup_type: Number(own.lineup_type), support_num: 1 }] : [] },
      server_support: {
        support_list: totals.map(row => ({ lineup_type: Number(row.lineup_type), support_num: Number(row.support_num ?? 0) }))
      }
    };
  }

  function supportBack(value) {
    return { schema: 'pb_draw_support_back', value, data: codec.pack('pb_draw_support_back', value) };
  }

  function supportLineup(raw) {
    const input = normalize(raw);
    const drawLib = firstPositive(input.draw_lib, input.lib, input.draw) ?? DEFAULT_DRAW_LIB;
    const lineupType = firstPositive(input.lineup_type, input.lineup_id, input.lineup, input.tid, input.scalar);
    if (lineupType === undefined) fail(CODE_INVALID, 'A draw exchange lineup is required');
    return store.transaction((model, db) => {
      requireLineup(drawLib, lineupType);
      const role = roleKey(model);
      db.prepare('INSERT INTO ' + SUPPORT_TABLE + '(role_id,draw_lib,lineup_type,updated_at) VALUES(?,?,?,?) '
        + 'ON CONFLICT(role_id,draw_lib) DO UPDATE SET lineup_type=excluded.lineup_type,updated_at=excluded.updated_at')
        .run(role, drawLib, lineupType, new Date(currentSeconds() * 1000).toISOString());
      const value = readSupportValue(db, role, drawLib);
      const result = supportBack(value);
      log({ event: 'hero_draw_support_lineup_committed', drawLib, lineupType, roles: value.server_support.support_list.length });
      return { ...result, valueForLog: { drawLib, lineupType } };
    });
  }

  function supportData(raw) {
    const input = normalize(raw);
    const drawLib = firstPositive(input.draw_lib, input.lib, input.draw, input.scalar) ?? DEFAULT_DRAW_LIB;
    return store.transaction((model, db) => {
      lineupRows(drawLib);
      const value = readSupportValue(db, roleKey(model), drawLib);
      const result = supportBack(value);
      log({ event: 'hero_draw_support_data_sent', drawLib, serverEntries: value.server_support.support_list.length });
      return { ...result, valueForLog: { drawLib, serverEntries: value.server_support.support_list.length } };
    });
  }

  function marquee(input) {
    // The marquee channel carries other players' lucky draws. A single-role
    // deployment has no such source, so the truthful answer is "no entries".
    const drawLib = Number(input?.draw_lib ?? 0);
    const paramBytes = Buffer.isBuffer(input?.param) ? input.param.length : 0;
    const value = { data: Buffer.alloc(0) };
    log({ event: 'hero_draw_marquee_empty', drawLib, paramBytes });
    return {
      schema: 'pb_draw_marquee_rsp',
      value,
      data: codec.pack('pb_draw_marquee_rsp', value),
      valueForLog: { drawLib, paramBytes, entries: 0 }
    };
  }

  function progressAward(raw) {
    const input = normalize(raw);
    const awardTid = firstPositive(input.award_tid, input.tid, input.scalar) ?? null;
    const rows = supportTables.DrawProgAward;
    if (!rows?.size) {
      log({ event: 'hero_draw_progress_award_unconfigured', awardTid });
      fail(CODE_CONTENT, 'Recruitment progress awards are not configured in this client version');
    }
    // Rows exist in a future build but this dump never shipped one, so the row
    // columns and the reward shape are unknown; refuse instead of inventing them.
    log({ event: 'hero_draw_progress_award_unsupported', awardTid, configuredRows: rows.size });
    fail(CODE_CONTENT, 'Recruitment progress award claiming is not supported');
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    async decode(type, raw, helpers) {
      const command = Number(type);
      if (command === COMMAND_MARQUEE) return helpers.unpack('pb_draw_marquee_req', raw ?? Buffer.alloc(0));
      if (!raw?.length) return {};
      let value;
      try {
        value = await helpers.etf(raw);
      } catch {
        return fail(CODE_INVALID, 'Invalid hero draw support payload');
      }
      return Array.isArray(value) && value.length === 1 ? value[0] : value;
    },
    execute(type, input) {
      switch (Number(type)) {
        case COMMAND_PROGRESS_AWARD: return progressAward(input);
        case COMMAND_SUPPORT_LINEUP: return supportLineup(input);
        case COMMAND_SUPPORT_DATA: return supportData(input);
        case COMMAND_MARQUEE: return marquee(input);
        default: return fail(CODE_INVALID, 'Invalid hero draw support command');
      }
    }
  };
}
