import { GameError } from './hero-progression.mjs';

// ReportCmd / FightCmd residual commands.
//
// Evidence:
// - 2xx ReportCmd: pb_pass_record_req {pass_tid, id} -> pb_pass_record
//   (fight_report.net.proto.bin, fight_report.db.proto.bin: pb_pass_record /
//   pb_pass_info / pb_pass_info_vote).
// - 212 pb_pass_record_vote_req {pass_tid, id, fight_id, type, is_up_vote},
//   no registered c2s_back: a successful vote writes no frame.
// - 205 pb_share_report {fight_id, fight_type}: Cmd.lua registers the request
//   with c2s_back = nil, so Connection._DecodeMsg falls back to ETF for the
//   reply and FightReportMgr.ShareReport's callback only tests Err.NO_ERROR.
//   The shipped client exposes the share entry (FightReportForm ->
//   FightReportMgr.ShareReport) and defines no share record, share counter or
//   share reward table, so the handler acknowledges with an empty frame and
//   logs the request. It grants nothing and persists nothing.
//
// Records are written by the real 207 journey settlement (see gateway.mjs) and
// stored in battle_pass_records; votes land in battle_pass_votes. Both tables
// are additive and idempotent (CREATE TABLE IF NOT EXISTS + primary keys).
function positiveInteger(value, label, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < (allowZero ? 0 : 1)) throw new GameError(1, 'Invalid ' + label);
  return number;
}

export function createBattleRecordService({ store, codec, logger = () => {}, now = Date.now }) {
  const log = event => { try { logger(event); } catch {} };

  // Called from the 207 settlement path with the committed journey result.
  function recordPass({ passTid, businessId, passType, fightId, passScore = 0, subPassScore = 0, lineup = {}, show = {} }) {
    const passTidValue = positiveInteger(passTid, 'pass record tid');
    const businessValue = Number(businessId);
    if (!Number.isSafeInteger(businessValue) || businessValue < 0) throw new GameError(1, 'Invalid pass record business id');
    const fightValue = positiveInteger(fightId, 'pass record fight id');
    return store.transaction((model, db) => {
      db.prepare('INSERT OR IGNORE INTO battle_pass_records VALUES (?,?,?,?,?,?,?,?,?,?)').run(
        model.state.roleId, passTidValue, businessValue, Number(passType ?? 0), fightValue,
        Number(passScore ?? 0), Number(subPassScore ?? 0),
        JSON.stringify(lineup ?? {}), JSON.stringify(show ?? {}), new Date(now()).toISOString()
      );
      return { passTid: passTidValue, businessId: businessValue, fightId: fightValue };
    });
  }

  function votesFor(db, passTid, businessId) {
    const rows = db.prepare(
      'SELECT fight_id, SUM(up_vote) AS up_vote, SUM(1 - up_vote) AS down_vote FROM battle_pass_votes WHERE pass_tid=? AND business_id=? GROUP BY fight_id'
    ).all(passTid, businessId);
    return new Map(rows.map(row => [Number(row.fight_id), {
      up_vote: String(Number(row.up_vote ?? 0)), down_vote: String(Number(row.down_vote ?? 0))
    }]));
  }

  function passRecord(request) {
    const passTid = positiveInteger(request?.pass_tid, 'pass record tid', { allowZero: true });
    const businessId = Number(request?.id ?? 0);
    if (!Number.isSafeInteger(businessId) || businessId < 0) throw new GameError(1, 'Invalid pass record business id');
    const rows = store.inspect(db => {
      const records = db.prepare(
        'SELECT * FROM battle_pass_records WHERE pass_tid=? AND business_id=? ORDER BY pass_score, fight_id'
      ).all(passTid, businessId);
      const votes = votesFor(db, passTid, businessId);
      return records.map(row => ({ row, vote: votes.get(Number(row.fight_id)) ?? null }));
    });
    const value = {
      pass_info_list: rows.map(({ row, vote }) => ({
        pass_type: Number(row.pass_type ?? 0),
        fight_id: String(row.fight_id),
        role_id: String(row.role_id),
        pass_score: String(row.pass_score ?? 0),
        sub_pass_score: String(row.sub_pass_score ?? 0),
        show_info: { ...JSON.parse(row.show_json ?? '{}') },
        vote_info: vote ?? { up_vote: '0', down_vote: '0' }
      }))
    };
    log({ event: 'pass_record_sent', passTid, businessId, count: value.pass_info_list.length });
    return { value, data: codec.pack('pb_pass_record', value) };
  }

  function vote(request) {
    const passTid = positiveInteger(request?.pass_tid, 'pass record tid', { allowZero: true });
    const businessId = Number(request?.id ?? 0);
    if (!Number.isSafeInteger(businessId) || businessId < 0) throw new GameError(1, 'Invalid pass record business id');
    const fightId = Number(request?.fight_id ?? 0);
    if (!Number.isSafeInteger(fightId) || fightId < 0) throw new GameError(1, 'Invalid pass record fight id');
    // pb_pass_record_vote_req.is_up_vote is the only vote direction flag; the
    // request must name one of the two directions explicitly.
    if (typeof request?.is_up_vote !== 'boolean') throw new GameError(1, 'Invalid pass record vote direction');
    const up = request.is_up_vote;
    return store.transaction((model, db) => {
      const record = db.prepare('SELECT role_id FROM battle_pass_records WHERE pass_tid=? AND business_id=? AND fight_id=?')
        .get(passTid, businessId, fightId);
      if (!record) throw new GameError(5, 'Pass record is missing');
      // The shipped client never votes on its own record. Self-vote and daily
      // vote limits are not evidenced, so both stay fail-closed.
      if (Number(record.role_id) === Number(model.state.roleId)) throw new GameError(5, 'Pass record self vote is rejected');
      const existing = db.prepare('SELECT up_vote FROM battle_pass_votes WHERE role_id=? AND pass_tid=? AND business_id=? AND fight_id=?')
        .get(model.state.roleId, passTid, businessId, fightId);
      if (existing) {
        if (Number(existing.up_vote) === (up ? 1 : 0)) return { value: { duplicate: true, passTid, businessId, fightId, up }, data: Buffer.alloc(0) };
        throw new GameError(1, 'Pass record vote is already recorded');
      }
      db.prepare('INSERT INTO battle_pass_votes VALUES (?,?,?,?,?,?)').run(
        passTid, businessId, fightId, model.state.roleId, up ? 1 : 0, new Date(now()).toISOString()
      );
      return { value: { duplicate: false, passTid, businessId, fightId, up }, data: Buffer.alloc(0) };
    });
  }

  // 205 pb_share_report. The client callback only checks Err.NO_ERROR and the
  // command has no c2s_back schema, so an empty body with code 0 is the
  // protocol's success signal for this request.
  function shareReport(request) {
    const fightId = Number(request?.fight_id ?? 0);
    if (!Number.isSafeInteger(fightId) || fightId <= 0) throw new GameError(1, 'Invalid share report fight id');
    const fightType = Number(request?.fight_type ?? 0);
    if (!Number.isSafeInteger(fightType) || fightType <= 0) throw new GameError(1, 'Invalid share report fight type');
    log({ event: 'battle_report_shared', fightId, fightType });
    return { value: { shared: true, fightId, fightType }, data: Buffer.alloc(0) };
  }

  return {
    supports: type => [205, 211, 212].includes(type),
    recordPass,
    execute(type, input) {
      if (type === 205) return shareReport(input);
      if (type === 211) return passRecord(input);
      if (type === 212) return vote(input);
      throw new GameError(1, 'Unsupported report command');
    }
  };
}
