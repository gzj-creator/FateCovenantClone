import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

// Ordinary journey (mission) fights.
// Evidence: FightCmd.fight_start sends pb_fight_request.req = Codec.EncodePB('mission_fight_req');
// FightMgr handles pb_fight_response.report/stm and MissionUIMgr.AttackResult decodes stm.stm_data
// as 'mission_to_client'. The original server battle engine produced report action bytes, so this
// local service settles deterministically instead of replaying moves.
const MISSION_MODULE = 8;
const RESULT_WIN = 1;

export function createMissionFightService({ store, codec, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  let pending = null, lastReport = null, fightIds = 0;

  function missionRequest(bytes) {
    if (typeof bytes === 'string') bytes = Buffer.from(bytes, 'base64');
    if (!bytes || !bytes.length) return null;
    let request;
    try { request = codec.unpack('mission_fight_req', bytes); } catch { return null; }
    const chapter = Number(request.chapter_tid ?? 0), section = Number(request.section_idx ?? 0), missionId = Number(request.mission_id ?? 0);
    if (!Number.isSafeInteger(chapter) || !Number.isSafeInteger(section) || !Number.isSafeInteger(missionId)) return null;
    if (chapter < 0 || section < 0) return null;
    // Evidence: MissionUIMgr's ordinary section attack encodes
    // EncodePB('mission_fight_req', { mission_id = ..., is_assistant = AutoFightMgr.IsAutoState() })
    // (LuaJIT constants of MissionUIMgr proto 99). chapter_tid/section_idx stay at their
    // protobuf defaults and never reach the wire, so mission_id is the only required field.
    if (!(missionId > 0)) return null;
    if (Number(request.boss_tid ?? 0) > 0 && request.is_assistant) return null;
    return { chapter, section, missionId, bossTid: Number(request.boss_tid ?? 0), isAssistant: Boolean(request.is_assistant) };
  }

  function settle(mission) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const module = modules.get(MISSION_MODULE);
      if (!module || !Array.isArray(module.value)) throw new Error('Mission login module missing');
      const current = codec.unpack('pb_mission', rawBinary(module.value[0]));
      const previous = Number(current.mission_id ?? 0);
      current.mission_id = String(Math.max(previous, mission.missionId));
      if (!current.pass_count) current.pass_count = { flush_time: 0, count: 0 };
      current.pass_count.count = Number(current.pass_count.count ?? 0) + 1;
      module.value[0] = serializedBinary(codec.pack('pb_mission', current));
      modules.set(MISSION_MODULE, module);
      model.state.modules.value = [...modules];
      const value = {
        res: { changes: [], is_overflow: false },
        fight_result: RESULT_WIN,
        mission: { mission_id: String(current.mission_id), pass_count: current.pass_count },
        is_boss: mission.bossTid > 0,
        boss_tid: mission.bossTid
      };
      return { value, data: codec.pack('mission_to_client', value), previousMissionId: previous };
    });
  }

  function start(bytes) {
    const request = codec.unpack('pb_fight_request', bytes);
    const mission = missionRequest(request.req);
    if (!mission) throw new GameError(5, 'Only ordinary mission fights are implemented');
    const settled = settle(mission);
    const report = {
      id: String(++fightIds),
      tid: String(request.fight_tid ?? 0),
      type: 0,
      atk_role_id: String(store.read().state.roleId),
      def_role_id: '0',
      battle_list: [],
      time: String(Math.floor(Date.now() / 1000)),
      final_result: RESULT_WIN,
      finish: true,
      req: request.req,
      team_count: 101
    };
    const stm = { result: RESULT_WIN, stm_data: settled.data, exception: false };
    pending = { stm, report, mission };
    lastReport = report;
    log({ event: 'mission_fight_settled', missionId: mission.missionId, previousMissionId: settled.previousMissionId, settleType: request.stm_type, isAssistant: mission.isAssistant, bossTid: mission.bossTid });
    return { value: { stm, mission: settled.value }, data: codec.pack('pb_fight_response', { report, rsp: {}, stm }) };
  }

  function settlement() {
    if (!pending) throw new GameError(1, 'No pending fight settlement');
    const stm = pending.stm, missionId = pending.mission.missionId;
    pending = null;
    log({ event: 'mission_fight_settlement_replayed', missionId });
    return { value: { stm }, data: codec.pack('pb_fight_settlement_response', { stm }) };
  }

  function exit() {
    if (pending) log({ event: 'mission_fight_exited', missionId: pending.mission.missionId });
    pending = null;
    return { value: {}, data: Buffer.alloc(0) };
  }

  function reports(ids) {
    const wanted = new Set((ids || []).map(String));
    const list = lastReport && (!wanted.size || wanted.has(lastReport.id)) ? [lastReport] : [];
    return { value: { report: list }, data: codec.pack('pb_fight_report_res', { report: list }) };
  }

  return {
    supports: type => [201, 202, 203, 204, 207, 213].includes(type),
    execute(type, bytes) {
      if (type === 201) return start(bytes);
      if (type === 202) return exit();
      if (type === 207) return settlement();
      return reports(codec.unpack('pb_get_fight_report', bytes).fight_id);
    }
  };
}
