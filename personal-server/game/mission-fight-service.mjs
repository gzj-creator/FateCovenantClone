import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { missionBattleConfig } from '../config/mission-tables.mjs';

// Ordinary journey (mission) fights.
// Evidence: FightCmd.fight_start sends pb_fight_request.req = Codec.EncodePB('mission_fight_req');
// FightMgr handles pb_fight_response.report/stm and MissionUIMgr.AttackResult decodes stm.stm_data
// as 'mission_to_client'. The local service derives the configured enemy team and emits the
// smallest evidenced round/battle action stream that the client can replay before settlement.
const MISSION_MODULE = 8;
const RESULT_WIN = 1;
const ACTION_BATTLE_OVER = 104;
const ACTION_ROUND_READY = 107;
const ACTION_ROUND_OVER = 112;

function action(codec, proto, schema, value) {
  return codec.pack('pb_generic', { proto, bin: codec.pack(schema, value) });
}

function unitConfig(tables, role, roleType) {
  const hero = tables.heroes.Hero.get(Number(role));
  if (!hero) throw new GameError(5, 'Mission fighter configuration missing');
  const ability = roleType === 1 ? tables.heroes.Ability.get(Number(role)) : tables.heroes.Npc_Ability.get(Number(role));
  return { hero, abilities: ability?.ability ?? [] };
}

function requestedMembers(model, request) {
  const wireTeam = (request.loc ?? []).find(team => (team.loc ?? []).length > 0);
  if (wireTeam) {
    return {
      teamIndex: 0,
      members: wireTeam.loc.map(entry => ({ heroId: String(entry.hero_id), loc: Number(entry.loc) }))
    };
  }
  const lineup = model.playLineups.find(value => value.type === 1)?.team_list?.[0];
  if (!lineup) throw new GameError(5, 'Journey lineup is missing');
  return {
    teamIndex: 0,
    members: (lineup.fighter_list ?? []).map(entry => ({ heroId: String(entry.hero_id), loc: Number(entry.loc) }))
  };
}

function reportBattle(codec, model, mission, request) {
  const config = missionBattleConfig(mission.missionId);
  if (!config) throw new GameError(5, 'Mission enemy configuration missing');
  const selected = requestedMembers(model, request);
  if (!selected.members.length || selected.members.length > 6) throw new GameError(5, 'Journey lineup size is invalid');
  if (selected.members.some(entry => !Number.isSafeInteger(entry.loc) || entry.loc < 1 || entry.loc > 7)) {
    throw new GameError(5, 'Journey lineup location is invalid');
  }
  const seenLocations = new Set();
  const attackers = selected.members.map((entry, index) => {
    if (seenLocations.has(entry.loc)) throw new GameError(5, 'Journey lineup location is duplicated');
    seenLocations.add(entry.loc);
    const hero = model.heroInfo.hero_list.find(value => String(value.uid) === entry.heroId);
    if (!hero) throw new GameError(5, 'Journey lineup hero is missing');
    const role = Number(hero.tid), cfg = unitConfig(config.tables, role, 1);
    const level = Number(hero.level ?? 1), quality = Number(hero.quality ?? cfg.hero.quality ?? 1);
    const maxHp = 1000 + level * 100 + quality * 10;
    return {
      id: 101 + index, tid: role, role_type: 1, uid: String(hero.uid), role,
      team: 1, team_index: selected.teamIndex, loc: entry.loc,
      star: Number(hero.star ?? 0), level, quality, hp: maxHp, max_hp: maxHp,
      enable: true, final_hp: maxHp, style: Number(cfg.hero.style ?? role),
      ability_list: cfg.abilities.slice(0, 8).map(Number)
    };
  });
  const attackerLevel = Math.max(...attackers.map(unit => unit.level));
  const defenders = config.enemies.map((role, index) => {
    const cfg = unitConfig(config.tables, role, 2);
    const level = Math.max(1, attackerLevel), quality = Number(cfg.hero.quality ?? 1);
    const maxHp = 1000 + level * 100 + quality * 10;
    return {
      id: 201 + index, tid: role, role_type: 2, uid: '0', role,
      team: 2, team_index: 0, loc: index + 1,
      star: Number(cfg.hero.star ?? 0), level, quality, hp: maxHp, max_hp: maxHp,
      enable: true, final_hp: 0, style: Number(cfg.hero.style ?? role),
      ability_list: cfg.abilities.slice(0, 8).map(Number)
    };
  });
  const fighters = [...attackers, ...defenders];
  const brief = (team, members) => ({ team_list: [{
    team_index: team,
    fighter_list: members.map(unit => ({ tid: unit.role, is_mutant: false }))
  }] });
  const actionList = [
    action(codec, ACTION_ROUND_READY, 'pb_fat_round_ready', { round: 1 }),
    action(codec, ACTION_ROUND_OVER, 'pb_fat_round_over', { round: 1 }),
    action(codec, ACTION_BATTLE_OVER, 'pb_fat_battle_over', { why: RESULT_WIN })
  ];
  return {
    atk_team_index: selected.teamIndex,
    def_team_index: 0,
    fighter_list: fighters,
    action_list: actionList,
    over_reason: RESULT_WIN,
    over_round: 1,
    result: RESULT_WIN,
    is_add_battle: false,
    atk_power: String(attackers.reduce((sum, unit) => sum + unit.max_hp, 0)),
    def_power: String(defenders.reduce((sum, unit) => sum + unit.max_hp, 0)),
    atk_brief_lineup: brief(selected.teamIndex, attackers),
    def_brief_lineup: brief(0, defenders)
  };
}

export function createMissionFightService({ store, codec, logger = () => {}, playbackEnabled = false }) {
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

  function settle(mission, request) {
    return store.transaction(model => {
      const battle = reportBattle(codec, model, mission, request);
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
      const stm = { result: RESULT_WIN, stm_data: codec.pack('mission_to_client', value), exception: false };
      return { value, battle, stm, previousMissionId: previous };
    });
  }

  function start(bytes) {
    const request = codec.unpack('pb_fight_request', bytes);
    // The client always opens FightScene for ordinary missions (MissionUIMgr sets PLAY_TYPE.NORMAL),
    // then plays report.battle_list[].action_list (pb_generic -> pb_fat_*). Without a real action
    // stream the scene stalls on a nil FightStepScheduler, so refuse until report playback exists.
    if (!playbackEnabled) throw new GameError(5, 'Mission fight playback is not implemented yet');
    const mission = missionRequest(request.req);
    if (!mission) throw new GameError(5, 'Only ordinary mission fights are implemented');
    const settled = settle(mission, request);
    const fightTid = Number(request.fight_tid ?? 0) || Number(missionBattleConfig(mission.missionId)?.mission.fight ?? 0);
    const report = {
      id: String(++fightIds),
      tid: String(fightTid),
      type: 0,
      atk_role_id: String(store.read().state.roleId),
      def_role_id: '0',
      battle_list: [settled.battle],
      time: String(Math.floor(Date.now() / 1000)),
      final_result: RESULT_WIN,
      finish: true,
      req: request.req,
      team_count: 101
    };
    const stm = settled.stm;
    pending = { stm, report, mission };
    lastReport = report;
    log({ event: 'mission_fight_settled', missionId: mission.missionId, fightTid, previousMissionId: settled.previousMissionId, settleType: request.stm_type, isAssistant: mission.isAssistant, bossTid: mission.bossTid, attackerCount: settled.battle.atk_brief_lineup.team_list[0].fighter_list.length, defenderCount: settled.battle.def_brief_lineup.team_list[0].fighter_list.length, actionCount: settled.battle.action_list.length });
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
