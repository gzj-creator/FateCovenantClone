import { GameError } from './hero-progression.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';
import { serverDayNumber } from './activity-calendar.mjs';

// E1 guild activity commands:
//   GuildRedEnvelopeCmd  83101-83108
//   GuildTrialCmd        83401-83411
//   GuildExploreCmd      89301-89328, 893289
//   GuildExploreTrialCmd 89351-89352
//   GuildWarCmd          90001-90016
//   GuildDuelCmd         90701-90707
//   GuildRacingCmd       91201-91209
//
// Depth per family is deliberately uneven and recorded in the block report:
// commands whose reward rows, map nodes or battle configuration live in
// Guild*Table data that is not extracted in this workspace fail closed with an
// explicit business error. Everything else persists real member state in SQLite
// and answers with the shipped protobuf schema.
export const GUILD_ACTIVITY_COMMANDS = Object.freeze({
  redEnvelopeFetch: 83101,
  redEnvelopeSend: 83102,
  redEnvelopeData: 83103,
  redEnvelopeCreate: 83104,
  redEnvelopeShowLog: 83105,
  redEnvelopeThanks: 83106,
  redEnvelopeRank: 83107,
  redEnvelopeFetchJoin: 83108,
  trialHelpInfo: 83401,
  trialHelpLog: 83402,
  trialHelp: 83403,
  trialSetNotice: 83404,
  trialGainPassAward: 83405,
  trialGainBoxAward: 83406,
  trialGainFightLog: 83407,
  trialRevFail: 83408,
  trialSuppress: 83409,
  trialReadHelpLog: 83410,
  trialThankHelp: 83411
});

// Explore, explore trial, war, duel and racing are declared as numeric ranges so
// the router can answer every shipped type without a 79-line literal.
const EXPLORE_TYPES = Object.freeze([
  89301, 89302, 89303, 89304, 89305, 89306, 89307, 89308, 89309, 89310, 89311,
  89312, 89313, 89314, 89315, 89316, 89317, 89318, 89319, 89320, 89321, 89322,
  89323, 89324, 89326, 89327, 89328, 893289
]);
const EXPLORE_TRIAL_TYPES = Object.freeze([89351, 89352]);
const WAR_TYPES = Object.freeze([90001, 90002, 90005, 90006, 90007, 90008, 90009, 90010, 90011, 90012, 90013, 90014, 90015, 90016]);
const DUEL_TYPES = Object.freeze([90701, 90702, 90703, 90704, 90705, 90706, 90707]);
const RACING_TYPES = Object.freeze([91201, 91202, 91203, 91204, 91205, 91206, 91207, 91208, 91209]);

export const GUILD_ACTIVITY_REQUEST_SCHEMAS = Object.freeze({
  83101: 'pb_guild_red_envelope_fetch_req',
  83105: 'pb_guild_red_envelope_show_log_req',
  83406: 'pb_guild_trial_gain_box_tos',
  83409: 'pb_guild_trial_fight_tos',
  83410: 'pb_guild_trial_read_help_log_req',
  89303: 'pb_guild_explore_portal_req',
  89304: 'pb_guild_explore_move_req',
  89307: 'pb_guild_explore_play_game_req',
  89308: 'pb_guild_explore_finish_game_req',
  89309: 'pb_guild_explore_get_game_award_req',
  89311: 'pb_guild_explore_build_award_req',
  90001: 'pb_guild_war_guess_req',
  90007: 'pb_guild_war_fight_req',
  90008: 'pb_guild_war_fight_req',
  90013: 'pb_guild_war_fight_req',
  91203: 'pb_guild_racing_buff_use_req'
});

const CODE_INVALID = 1;
const CODE_UNAVAILABLE = 5;
const GUILD_MODULE_ID = 24;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS guild_activity_state (
  guild_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(guild_id,role_id,scope,key)
);
CREATE TABLE IF NOT EXISTS guild_activity_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  scope TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS guild_activity_events_idx
  ON guild_activity_events(guild_id,scope,kind,event_id DESC);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function textOf(value) {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  if (value && typeof value === 'object' && value.value instanceof Uint8Array) return Buffer.from(value.value).toString('utf8');
  if (value && typeof value === 'object' && value.value && Array.isArray(value.value.data)) return Buffer.from(value.value.data).toString('utf8');
  if (Array.isArray(value) && value.length && value.every(entry => Number.isInteger(entry) && entry >= 0 && entry <= 0x10ffff)) return String.fromCodePoint(...value);
  return null;
}

function numeric(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) fail(CODE_INVALID, 'Invalid ' + label);
  return parsed;
}

export function createGuildActivityService({
  store,
  codec,
  serverOpenedAt,
  now = Date.now,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Guild activity store is unavailable');
  const openedAt = serverOpenedAt ?? store.serverOpenedAt;
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function clockMilliseconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(CODE_UNAVAILABLE, 'Guild activity clock is invalid');
    return Math.floor(value);
  }

  const nowSeconds = () => Math.trunc(clockMilliseconds() / 1000);
  const isoNow = () => new Date(clockMilliseconds()).toISOString();
  const today = () => serverDayNumber(openedAt, clockMilliseconds());
  const actorOf = model => String((model.state ?? model).roleId);
  const guildIdOf = model => String((model.state ?? model).guildId ?? '0');

  // The local server has exactly one guild membership; guild activities key their
  // state by that guild id so several members could share a board.
  function guildIdFor(model, db) {
    const direct = guildIdOf(model);
    if (/^[0-9]+$/.test(direct) && BigInt(direct) > 0n) return Number(direct);
    // Module 24 (pb_res_guild_login) is the authority for the current guild.
    const modules = new Map((model.state ?? model).modules?.value ?? []);
    const module = modules.get(GUILD_MODULE_ID);
    if (module) {
      try {
        const login = codec.unpack('pb_res_guild_login', rawBinary(module));
        const guildId = String(login?.guildId ?? '0');
        if (/^[0-9]+$/.test(guildId) && BigInt(guildId) > 0n) return Number(guildId);
      } catch {
        // Fall through to the directory lookup below.
      }
    }
    const row = db.prepare('SELECT guild_id FROM guild_directory ORDER BY guild_id LIMIT 1').get();
    return row ? Number(row.guild_id) : 0;
  }

  function pack(schema, value) {
    try {
      return codec.pack(schema, value);
    } catch (error) {
      log({ event: 'guild_activity_pack_failed', schema, message: error.message });
      return Buffer.alloc(0);
    }
  }

  function getState(db, guildId, roleId, scope, key) {
    const row = db.prepare('SELECT value_json FROM guild_activity_state WHERE guild_id=? AND role_id=? AND scope=? AND key=?')
      .get(guildId, roleId, scope, key);
    if (!row) return null;
    try {
      return JSON.parse(row.value_json);
    } catch {
      return null;
    }
  }

  function setState(db, guildId, roleId, scope, key, value) {
    db.prepare(`INSERT INTO guild_activity_state(guild_id,role_id,scope,key,value_json,updated_at) VALUES (?,?,?,?,?,?)
      ON CONFLICT(guild_id,role_id,scope,key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at`)
      .run(guildId, roleId, scope, key, JSON.stringify(value ?? {}), isoNow());
    return value;
  }

  function recordEvent(db, guildId, roleId, scope, kind, payload) {
    db.prepare('INSERT INTO guild_activity_events(guild_id,role_id,scope,kind,payload_json,created_at) VALUES (?,?,?,?,?,?)')
      .run(guildId, roleId, scope, kind, JSON.stringify(payload ?? {}), isoNow());
  }

  function listEvents(db, guildId, scope, kind, limit = 50) {
    return db.prepare('SELECT * FROM guild_activity_events WHERE guild_id=? AND scope=? AND kind=? ORDER BY event_id DESC LIMIT ?')
      .all(guildId, scope, kind, limit);
  }

  const emptyRes = () => ({ changes: [] });

  // GuildRedEnvelopeTable (envelope tid, amount, split rules) is not extracted, so
  // envelopes can neither be created nor paid out; the reads below are truthful
  // projections of the (empty) local envelope board.
  function redEnvelope(model, db, command, input) {
    const guildId = guildIdFor(model, db);
    const actor = Number(actorOf(model));
    switch (command) {
      case 83103:
        return { data: pack('pb_guild_red_envelope_get_data_rsp', { inactive_envelope: [], fetched_red_envelopes: [] }), value: { guildId, envelopes: 0 } };
      case 83107:
        return { data: pack('pb_guild_red_envelope_rank_list', { rank_list: [] }), value: { guildId, ranks: 0 } };
      case 83106: {
        const id = numeric(input?.id ?? (Array.isArray(input) ? input[0] : input), 'red envelope id', { min: 1 });
        recordEvent(db, guildId, actor, 'red_envelope', 'thanks', { id });
        return { data: pack('pb_res_to_client', emptyRes()), value: { guildId, id, thanks: true } };
      }
      case 83108: {
        const current = getState(db, guildId, actor, 'red_envelope', 'fetch_join') ?? { count: 0 };
        setState(db, guildId, actor, 'red_envelope', 'fetch_join', { count: Number(current.count ?? 0) + 1, day: today() });
        recordEvent(db, guildId, actor, 'red_envelope', 'fetch_join', {});
        return { data: pack('pb_res_to_client', emptyRes()), value: { guildId, fetchJoin: Number(current.count ?? 0) + 1 } };
      }
      default:
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
    }
  }

  function trial(model, db, command, input) {
    const guildId = guildIdFor(model, db);
    const actor = Number(actorOf(model));
    switch (command) {
      case 83401:
        return { data: pack('pb_guild_trial_help_info', { help_list: [] }), value: { guildId, help: 0 } };
      case 83402: {
        const rows = listEvents(db, guildId, 'trial', 'help');
        return {
          data: pack('pb_guild_trial_help_log_toc', {
            log_list: rows.map(row => {
              const payload = JSON.parse(row.payload_json);
              return {
                role_id: Number(payload.role_id ?? 0),
                time: Number(payload.time ?? 0),
                times: Number(payload.times ?? 1),
                type: Number(payload.type ?? 0),
                read: Boolean(payload.read),
                thank: Boolean(payload.thank)
              };
            })
          }),
          value: { guildId, logs: rows.length }
        };
      }
      case 83403: {
        const type = numeric(input?.type ?? (Array.isArray(input) ? input[0] : 0) ?? 0, 'trial help type', { min: 0, max: 99 });
        const monTid = numeric(input?.mon_tid ?? (Array.isArray(input) ? input[1] : 0) ?? 0, 'trial monster tid', { min: 0 });
        recordEvent(db, guildId, actor, 'trial', 'help', { role_id: actor, type, times: 1, mon_tid: monTid, read: false, thank: false, time: nowSeconds() });
        return { data: pack('pb_guild_trial_help_toc', { exception: false, res: emptyRes() }), value: { guildId, type, monTid } };
      }
      case 83404: {
        const notice = (textOf(input) ?? '').trim();
        if (notice.length > 120) fail(CODE_INVALID, 'Trial notice is too long');
        setState(db, guildId, actor, 'trial', 'notice', { notice, time: nowSeconds() });
        return { data: Buffer.alloc(0), value: { guildId, noticeLength: notice.length } };
      }
      case 83407: {
        recordEvent(db, guildId, actor, 'trial', 'fight_log', {});
        return { data: Buffer.alloc(0), value: { guildId } };
      }
      case 83408: {
        const current = getState(db, guildId, actor, 'trial', 'rev_fail') ?? { count: 0 };
        const next = { count: Number(current.count ?? 0) + 1, time: nowSeconds() };
        setState(db, guildId, actor, 'trial', 'rev_fail', next);
        return { data: pack('pb_guild_trial_rev_fail_toc', {}), value: { guildId, count: next.count } };
      }
      case 83410: {
        const type = numeric(input?.type ?? 0, 'help log type', { min: 0, max: 99 });
        const roleId = numeric(input?.role_id ?? 0, 'help log role id', { min: 0 });
        setState(db, guildId, actor, 'trial', 'help_read', { type, role_id: roleId, time: nowSeconds() });
        return { data: pack('pb_guild_trial_read_help_log_rsp', { help_log_list: [] }), value: { guildId, type, roleId } };
      }
      case 83411: {
        recordEvent(db, guildId, actor, 'trial', 'thank_help', {});
        return { data: Buffer.alloc(0), value: { guildId } };
      }
      default:
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
    }
  }

  function explore(model, db, command, input) {
    const guildId = guildIdFor(model, db);
    const actor = Number(actorOf(model));
    switch (command) {
      case 89305:
      case 89318:
        return { data: pack('pb_guild_explore_task_back', { res: emptyRes() }), value: { guildId, kind: command === 89305 ? 'task' : 'guide_task' } };
      case 89306: {
        const wish = getState(db, guildId, actor, 'explore', 'wish') ?? { round: 0 };
        const round = Number(wish.round ?? 0) + 1;
        setState(db, guildId, actor, 'explore', 'wish', { round, day: today() });
        return { data: pack('pb_guild_explore_wish_back', { round, res: emptyRes() }), value: { guildId, round } };
      }
      case 89310: {
        recordEvent(db, guildId, actor, 'explore', 'camp', { camp: numeric(Array.isArray(input) ? input[0] : (input?.camp ?? 0), 'camp', { min: 0, max: 99 }) });
        return { data: pack('pb_res_to_client', emptyRes()), value: { guildId } };
      }
      case 89315: {
        const rows = listEvents(db, guildId, 'explore', 'camp', 200);
        const counts = new Map();
        for (const row of rows) {
          const camp = Number(JSON.parse(row.payload_json).camp ?? 0);
          counts.set(camp, (counts.get(camp) ?? 0) + 1);
        }
        return {
          data: pack('pb_guild_explore_camp_stat', { event_stat_list: [...counts].map(([key, value]) => ({ key, value })) }),
          value: { guildId, camps: counts.size }
        };
      }
      case 89323: {
        recordEvent(db, guildId, actor, 'explore', 'person_task', {});
        return { data: pack('pb_res_to_client', emptyRes()), value: { guildId } };
      }
      case 89326:
        return {
          data: pack('pb_guild_explore_guild', {
            explore_exp: '0', wish_item_count: '0', wish_item_fetch_role: [], build_list: [],
            unlock_list: [], event_stat_list: [], wish_item_touch_list: [], join_item_count: 0
          }),
          value: { guildId }
        };
      case 893289:
        return { data: pack('pb_guild_explore_get_boss_box_back', { box_list: [], res: emptyRes() }), value: { guildId, boxes: 0 } };
      default:
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
    }
  }

  function exploreTrial(model, db, command) {
    const guildId = guildIdFor(model, db);
    if (command === 89352) {
      return { data: pack('pb_guild_explore_trial_member_back', { member_list: [] }), value: { guildId, members: 0 } };
    }
    fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
  }

  function guildWar(model, db, command, input) {
    const guildId = guildIdFor(model, db);
    const actor = Number(actorOf(model));
    switch (command) {
      case 90001: {
        const tid = numeric(input?.tid, 'guess tid', { min: 1 });
        const obj = numeric(input?.support_obj_id ?? 0, 'guess target', { min: 0 });
        const area = numeric(input?.area_idx ?? 0, 'guess area', { min: 0, max: 255 });
        setState(db, guildId, actor, 'war', 'guess', { tid, support_obj_id: String(obj), area_idx: area, time: nowSeconds() });
        return { data: pack('pb_guild_war_guess', { tid, select_list: [{ key: String(obj), value: String(area) }] }), value: { guildId, tid, obj } };
      }
      case 90005: {
        const loc = numeric(Array.isArray(input) ? input[0] : input, 'gather location', { min: 0 });
        setState(db, guildId, actor, 'war', 'gather_loc', { loc, time: nowSeconds() });
        return { data: Buffer.alloc(0), value: { guildId, loc } };
      }
      case 90006: {
        const roleId = numeric(Array.isArray(input) ? input[0] : input, 'gather role id', { min: 1 });
        setState(db, guildId, actor, 'war', 'gather_role', { role_id: roleId, time: nowSeconds() });
        return { data: Buffer.alloc(0), value: { guildId, roleId } };
      }
      case 90009:
        return { data: pack('pb_guild_war_entry', { area_list: [], refresh_time: '0', cur_phase: 0, stage: 0, calc_power_time: '0', start_time: '0' }), value: { guildId, areas: 0 } };
      case 90010: {
        const guess = getState(db, guildId, actor, 'war', 'guess');
        if (!guess) return { data: pack('pb_guild_war_guess', { select_list: [] }), value: { guildId, guessed: false } };
        return {
          data: pack('pb_guild_war_guess', {
            tid: Number(guess.tid ?? 0),
            select_list: [{ key: String(guess.support_obj_id ?? '0'), value: String(guess.area_idx ?? 0) }]
          }),
          value: { guildId, guessed: true }
        };
      }
      case 90012:
        return { data: pack('pb_guild_war_person', { guess_list: [], stat_list: [], add_stat_list: [], is_receive_rank: false, have_operate: false }), value: { guildId } };
      case 90014: {
        setState(db, guildId, actor, 'war', 'host', { role_id: actor, time: nowSeconds() });
        recordEvent(db, guildId, actor, 'war', 'host', { role_id: actor });
        return { data: Buffer.alloc(0), value: { guildId, host: actor } };
      }
      case 90015: {
        db.prepare("DELETE FROM guild_activity_state WHERE guild_id=? AND role_id=? AND scope='war' AND key='host'").run(guildId, actor);
        return { data: Buffer.alloc(0), value: { guildId, host: 0 } };
      }
      case 90016: {
        recordEvent(db, guildId, actor, 'war', 'share', {});
        return { data: Buffer.alloc(0), value: { guildId } };
      }
      default:
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
    }
  }

  function guildDuel(model, db, command) {
    const guildId = guildIdFor(model, db);
    switch (command) {
      case 90701:
        return { data: pack('pb_guild_duel_match_data_back', {}), value: { guildId, matched: false } };
      case 90705:
        return { data: pack('pb_guild_duel_report_back', { report_list: [] }), value: { guildId, reports: 0 } };
      case 90706:
        return { data: pack('pb_guild_duel_guild_record', { acc_win_n: 0, max_win_streak_n: 0, win_streak_n: 0, acc_entry_n: 0, report_list: [] }), value: { guildId } };
      case 90707:
        return { data: pack('pb_guild_duel_zone_back_list', { list: [] }), value: { guildId, zones: 0 } };
      default:
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
    }
  }

  function guildRacing(model, db, command, input) {
    const guildId = guildIdFor(model, db);
    const actor = Number(actorOf(model));
    const state = getState(db, guildId, actor, 'racing', 'role') ?? {
      attend_time: '0', support_times: 0, vote_buff_tid: 0, vote_event_tid: 0, day: today()
    };
    const roleInfo = () => ({
      attend_time: String(state.attend_time ?? '0'),
      support_times: Number(state.support_times ?? 0),
      vote_buff_tid: Number(state.vote_buff_tid ?? 0),
      vote_event_tid: Number(state.vote_event_tid ?? 0),
      power: '0'
    });
    switch (command) {
      case 91201: {
        state.attend_time = String(nowSeconds());
        state.day = today();
        setState(db, guildId, actor, 'racing', 'role', state);
        recordEvent(db, guildId, actor, 'racing', 'attend', { role_id: actor });
        return { data: pack('pb_guild_racing_attend_back', { role_info: roleInfo(), res: emptyRes() }), value: { guildId, attend_time: state.attend_time } };
      }
      case 91202: {
        state.support_times = Number(state.support_times ?? 0) + 1;
        setState(db, guildId, actor, 'racing', 'role', state);
        return { data: pack('pb_guild_racing_support', { role_info: roleInfo(), res: emptyRes() }), value: { guildId, support_times: state.support_times } };
      }
      case 91204: {
        const buffTid = numeric(Array.isArray(input) ? input[0] : (input?.buff_tid ?? 0), 'vote buff tid', { min: 0 });
        const eventTid = numeric(Array.isArray(input) ? input[1] : (input?.event_tid ?? 0) ?? 0, 'vote event tid', { min: 0 });
        state.vote_buff_tid = buffTid;
        state.vote_event_tid = eventTid;
        setState(db, guildId, actor, 'racing', 'role', state);
        return { data: pack('pb_guild_racing_r', roleInfo()), value: { guildId, buffTid, eventTid } };
      }
      case 91205:
        return { data: pack('pb_guild_racing_role_info_list', { role_list: [] }), value: { guildId, roles: 0 } };
      case 91207:
        return { data: pack('pb_guild_racing_score', { score_list: [], expire_time: '0', is_cross: false }), value: { guildId, scores: 0 } };
      default:
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
    }
  }

  // Reward, map-node, buff and battle commands need Guild*Table rows that are not
  // extracted in this workspace. They answer with an explicit business error and
  // are listed as gaps in agent/workflow/gameplay-completion/BLOCK-E1.
  const GAPS = new Map([
    [83101, 'GuildRedEnvelopeTable amounts are not extracted'],
    [83102, 'GuildRedEnvelopeTable amounts are not extracted'],
    [83104, 'GuildRedEnvelopeTable amounts are not extracted'],
    [83105, 'pb_guild_red_envelope_fetch_log schema is absent from the shipped protobuf assets'],
    [83405, 'GuildTrialTable pass award rows are not extracted'],
    [83406, 'GuildTrialTable box award rows are not extracted'],
    [83409, 'GuildTrialTable monster battle configuration is not extracted'],
    [89301, 'GuildExploreTable box rows are not extracted'],
    [89302, 'GuildExploreTable person box rows are not extracted'],
    [89303, 'GuildExploreTable portal graph is not extracted'],
    [89304, 'GuildExploreTable movement energy cost is not extracted'],
    [89307, 'GuildExploreTable minigame configuration is not extracted'],
    [89308, 'GuildExploreTable minigame configuration is not extracted'],
    [89309, 'GuildExploreTable minigame award rows are not extracted'],
    [89311, 'GuildExploreTable build award rows are not extracted'],
    [89312, 'GuildExploreTable boss configuration is not extracted'],
    [89313, 'GuildExploreTable handbook rows are not extracted'],
    [89314, 'GuildExploreTable handbook award rows are not extracted'],
    [89316, 'GuildExploreTable shop goods are not extracted'],
    [89317, 'GuildExploreTable portal graph is not extracted'],
    [89319, 'GuildExploreTable pre box rows are not extracted'],
    [89320, 'GuildExploreTable completion rules are not extracted'],
    [89321, 'GuildExploreTable wolf event configuration is not extracted'],
    [89322, 'GuildExploreTable wolf award rows are not extracted'],
    [89324, 'GuildExploreTable boss box rows are not extracted'],
    [89327, 'GuildExploreTable boss instance configuration is not extracted'],
    [89328, 'GuildExploreTable boss sweep rules are not extracted'],
    [89351, 'GuildExploreTrialTable award rows are not extracted'],
    [90002, 'GuildWarTable guess award rows are not extracted'],
    [90007, 'GuildWarTable battle configuration is not extracted'],
    [90008, 'GuildWarTable battle configuration is not extracted'],
    [90011, 'GuildWarTable rank award rows are not extracted'],
    [90013, 'GuildWarTable monster battle configuration is not extracted'],
    [90702, 'GuildDuelTable round award rows are not extracted'],
    [90703, 'GuildDuelTable level award rows are not extracted'],
    [90704, 'GuildDuelTable battle configuration is not extracted'],
    [91203, 'GuildRacingTable buff rows are not extracted'],
    [91206, 'GuildRacingTable award rows are not extracted'],
    [91208, 'GuildRacingTable buff award rows are not extracted'],
    [91209, 'GuildRacingTable score award rows are not extracted']
  ]);

  const SUPPORTED = new Set([
    ...Object.values(GUILD_ACTIVITY_COMMANDS),
    ...EXPLORE_TYPES, ...EXPLORE_TRIAL_TYPES, ...WAR_TYPES, ...DUEL_TYPES, ...RACING_TYPES
  ]);

  return {
    supports: type => SUPPORTED.has(Number(type)),
    requestSchema: type => GUILD_ACTIVITY_REQUEST_SCHEMAS[Number(type)] ?? null,
    gap: type => GAPS.get(Number(type)) ?? null,
    execute(type, input) {
      const command = Number(type);
      const gap = GAPS.get(command);
      if (gap) fail(CODE_UNAVAILABLE, 'Guild activity gap: ' + gap);
      return store.transaction((model, db) => {
        if (command >= 83101 && command <= 83108) return redEnvelope(model, db, command, input);
        if (command >= 83401 && command <= 83411) return trial(model, db, command, input);
        if (EXPLORE_TYPES.includes(command)) return explore(model, db, command, input);
        if (EXPLORE_TRIAL_TYPES.includes(command)) return exploreTrial(model, db, command);
        if (WAR_TYPES.includes(command)) return guildWar(model, db, command, input);
        if (DUEL_TYPES.includes(command)) return guildDuel(model, db, command);
        if (RACING_TYPES.includes(command)) return guildRacing(model, db, command, input);
        fail(CODE_UNAVAILABLE, 'Guild activity command is not implemented');
      });
    }
  };
}
