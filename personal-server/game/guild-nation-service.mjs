import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, toSeconds,
  resOf, grantAwards, spendResources, asInteger, optionalInteger, etfArgs,
  decodeCoopRequest, rosterScores, lineupPower, DIAMOND_TID
} from './guild-coop-shared.mjs';

// GuildNationCmd 99200-99264, except 99229 which remains owned by the existing
// GuildNationAssistService. Build queues, soldiers, technology, reports, map
// objects and strongholds live in the common cooperation documents. Resource
// mutations use the production inventory handlers and every paid claim uses an
// idempotency marker. Numerical costs/timers are local policy from
// config/guild-coop-tables.mjs; the request/response contracts are recovered.
export const GUILD_NATION_COMMANDS = Object.freeze({
  goAttack: 99200, roleBuild: 99201, spawnSoldier: 99202, soldierUp: 99203,
  queueUnlock: 99204, buildCancel: 99205, gemAcc: 99206, itemAcc: 99207,
  readReport: 99208, deleteReport: 99209, recvReport: 99210, reportList: 99211,
  technologyStudy: 99212, cancelStudy: 99213, studyGemAcc: 99214, studyItemAcc: 99215,
  finishStudy: 99216, updateRedDot: 99217, teamRecall: 99218, soldierCancel: 99219,
  defenseUseProtect: 99220, defenseExtinguish: 99221, defenseRepairCity: 99222,
  buildFreeAcc: 99223, assignSoldier: 99224, soldierGemAcc: 99225, soldierItemAcc: 99226,
  donateGuildTech: 99227, power: 99228, sendAssist: 99230, assist: 99231,
  soldierItemRaiseNum: 99232, recommendGuildTech: 99233, moveGuildBase: 99234,
  moveRoleBase: 99235, defenseReturn: 99236, repairCityAccItem: 99237,
  repairCityAccGem: 99238, repairCancel: 99239, finishTask: 99240,
  finishPhaseTask: 99241, otherRoleInfo: 99242, marchAcc: 99243,
  repairMapCore: 99244, mapObjSearch: 99245, callMuster: 99246, answerMuster: 99247,
  setFlag: 99248, moveFlag: 99249, strongholdAward: 99250,
  strongholdHonorAward: 99251, strongholdCaptureAward: 99252, musterInfoList: 99253,
  strongholdSign: 99254, cancelMuster: 99255, upLvGuildTech: 99256,
  studyGemFinish: 99257, strongholdBattleAward: 99258, mapObjInfo: 99259,
  freeFinishStudy: 99260, guildBattleList: 99261, holdMapObjInfo: 99262,
  holdSignNumInfo: 99263, guildBaseReturn: 99264
});
const SCOPE = 'guild_nation';
const REQUEST_SCHEMAS = {
  99200: 'pb_guild_nation_go_attack_req', 99201: 'pb_guild_nation_up_level_req',
  99202: 'pb_guild_nation_spawn_soldier_req', 99203: 'pb_guild_nation_up_soldier_req',
  99207: 'pb_guild_nation_build_item_acc_req', 99208: 'pb_guild_nation_read_report_req',
  99212: 'pb_guild_nation_study_req', 99215: 'pb_guild_nation_study_speed_req',
  99224: 'pb_guild_nation_soldier_line_up_req', 99226: 'pb_guild_nation_build_item_acc_req',
  99227: 'pb_guild_nation_team_tech_donation_req', 99230: 'pb_guild_nation_assist_rsp',
  99231: 'pb_guild_nation_assist_list', 99232: 'pb_res_obj',
  99236: 'pb_guild_nation_help_defense_return_req',
  99237: 'pb_guild_nation_repair_city_acc_item_req', 99243: 'pb_guild_nation_march_acc_req',
  99245: 'pb_guild_nation_search_req', 99246: 'pb_guild_nation_call_muster_req',
  99247: 'pb_guild_nation_answer_muster_req', 99249: 'pb_guild_nation_move_flag_req',
  99251: 'pb_guild_nation_stronghold_honor_req',
  99252: 'pb_guild_nation_stronghold_capture_record',
  99255: 'pb_guild_nation_cancel_muster_req', 99264: 'pb_guild_nation_help_defense_return_req'
};

function emptyTeam(teamId = 1) {
  return { team_id: teamId, cell_list: [], state: 0, march_id: 0, dst_gxy: 0, dst_obj_tid: 0 };
}

function emptyTask() {
  return { task_list: [], phase: { cur_phase: 1, is_received: false } };
}

export function createGuildNationService({ store, codec, tables, heroTables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.nation;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_NATION_COMMANDS));

  function freshWorld(at) {
    const start = Math.floor(at / config.seasonSeconds) * config.seasonSeconds;
    return {
      season: { start, end: start + config.seasonSeconds, version: Math.floor(start / config.seasonSeconds) + 1 },
      coreGxy: 1001, version: 1, maxQueues: 1, buildings: {}, queues: [], technologies: {},
      recommendTech: 1, flags: [], strongholds: {}, musters: {}, reports: [], assists: [], redDot: false
    };
  }

  function freshPerson(at) {
    return {
      version: 1, baseGxy: 2001, missionIndex: 1, missionChapter: 1, cityHp: config.cityHp,
      coreHp: config.coreHp, buildings: {}, queues: [], soldiers: [], teams: [emptyTeam(1)],
      studies: [], technology: {}, donate: { donate_num: 0, donate_num_diamond: 0, last_donate_time: 0 },
      tasks: [], taskStats: [], reports: [], protects: {}, fires: {}, repair: null,
      march: {}, energy: [], raiseEnd: 0, updatedAt: at
    };
  }

  function worldDoc(db, guildId, at) {
    const existing = readDoc(db, SCOPE, guildId, '0', 'world');
    if (existing && at < Number(existing.season.end)) return existing;
    return writeDoc(db, SCOPE, guildId, '0', 'world', freshWorld(at), at);
  }

  function personDoc(db, guildId, roleId, at) {
    return readDoc(db, SCOPE, guildId, roleId, 'state') ?? freshPerson(at);
  }

  function inputArgs(input) { return etfArgs(input); }
  function first(input, args, field, label, options = {}) {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? input[field] : args[0];
    return asInteger(value, label, options);
  }
  function teamFor(person, id) {
    const teamId = optionalInteger(id, 'team id', { min: 1, max: config.teamSlots }) ?? 1;
    let team = person.teams.find(row => Number(row.team_id) === teamId);
    if (!team) { team = emptyTeam(teamId); person.teams.push(team); }
    return team;
  }
  function buildView(person) {
    return {
      tid: person.tid, level: person.level, finish_time: person.finishTime ?? 0,
      is_assist: false, ori_build_time: person.oriBuildTime ?? 0, last_cancel_level: 0
    };
  }
  function queueView(queue) {
    return { tid: queue.tid, lock_sec: queue.lockSec ?? 0, build_tid: queue.buildTid ?? 0 };
  }
  function soldierView(soldier) {
    return {
      type: soldier.type, level: soldier.level, num: soldier.num, org_level: soldier.orgLevel ?? soldier.level,
      spawn_num: soldier.spawnNum ?? soldier.num, begin_time: soldier.beginTime ?? 0,
      finish_time: soldier.finishTime ?? 0, ori_build_time: soldier.oriBuildTime ?? 0
    };
  }
  function studyView(study) {
    return { id: study.id, study_node_tid: study.nodeId, study_node_lv: study.level, finish_time: study.finishTime, init_finish_time: study.initFinishTime };
  }
  function roleView(person) {
    return {
      version: person.version, lode_gxy_list: [], base_gxy: person.baseGxy,
      mission_index: person.missionIndex, mission_chapter: person.missionChapter,
      elite_star_bin: Buffer.alloc(0), monster_level: 1, energy_settle_time: 0,
      hero_energy_list: person.energy, build_info: { build_list: Object.values(person.buildings).map(buildView), queue_list: person.queues.map(queueView) },
      soldier_info: { type_list: [], raise_end_sec: person.raiseEnd },
      map_line_up_soldier: { team_list: person.teams, defense_team: person.teams[0] ?? emptyTeam(1) },
      technology_info: { study_list: person.studies.map(studyView), activation_list: [], is_assist_list: [] },
      donate_info: person.donate, scout_list: [], task_info: emptyTask(), lode_output: { day: 0, res_list: [] }
    };
  }
  function guildView(world, context) {
    return {
      core_gxy: world.coreGxy, technology_info: { chapter_list: [], recommend_tid: world.recommendTech },
      assist_list: activeAssists(context.guildId, store.inspect(db => db)), cur_assist_id: world.assists[0]?.id ?? 0,
      res_list: [], flag_gxy_list: world.flags, res_update_time: 0
    };
  }
  function strongholdView(world, tid) {
    const state = world.strongholds[tid] ?? { guildId: 0, signUp: [], occupiedAt: 0 };
    return { tid, owner_guild_id: state.guildId, occupy_start_time: state.occupiedAt, is_vacancy: !state.guildId,
      gxy: 5000 + tid, sign_up_guild_list: state.signUp, occupy_list: [], npc_list: [], help_defense_team: [], timer_id: 0, guard_id: 0 };
  }
  function allStrongholds(world) {
    return { stronghold_list: config.strongholdAwards.map((row, index) => strongholdView(world, index + 1)) };
  }
  function strongholdGuild(world, context) {
    return { score: 0, member_list: context.members.map(row => String(row.role_id)), join_member_list: [],
      sign_up_stronghold_tid: 0, occupy_tid: 0, occupy_list: [], official_list: [], stunt_list: [], record_list: [] };
  }
  function reportView(report) {
    return { uid: report.uid, tid: report.tid ?? 1, time: report.time, is_read: Boolean(report.isRead),
      is_received: Boolean(report.isReceived), atk_fight_result: Number(report.result ?? 1),
      fixed_award_list: [], extra_award_list: [], map_obj_type: report.mapObjType ?? 1, map_obj: Buffer.alloc(0),
      atk_role: { gxy: report.atkGxy ?? 0, role_id: report.atkRoleId ?? 0, name: 'Local', guild_name: '' },
      def_role: { gxy: report.defGxy ?? 0, role_id: report.defRoleId ?? 0, name: '', guild_name: '' },
      extra: Buffer.alloc(0) };
  }
  function activeAssists(guildId, db) {
    return db.prepare('SELECT requester_role_id AS role_id,target_type,target_id,max_num,assist_num,finish_time,target_lv,assist_id AS id FROM guild_nation_assists WHERE guild_id=? AND finish_time>? ORDER BY assist_id').all(guildId, toSeconds(now)).map(row => ({
      role_id: String(row.role_id), target_type: row.target_type, target_id: row.target_id,
      max_num: row.max_num, assist_num: row.assist_num, finish_time: row.finish_time, target_lv: row.target_lv,
      id: String(row.id)
    }));
  }
  function createReport(world, context, input, at) {
    const uid = String(world.version).padStart(6, '0') + String(at).slice(-6);
    world.version += 1;
    world.reports.push({ uid, tid: 1, time: at, isRead: false, isReceived: false, result: 1,
      mapObjType: 1, atkRoleId: context.roleId, defRoleId: input.def_role_id ?? 0,
      atkGxy: input.dst_gxy ?? personNumber(input.gxy), defGxy: input.gxy ?? 0 });
    return uid;
  }
  function personNumber(value) { try { return Number(value ?? 0); } catch { return 0; } }
  function grantClaim(db, model, context, world, key, items, at) {
    if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key, period: String(world.season.start), at })) {
      throw new GameError(310, 'Guild nation award was already claimed');
    }
    return grantAwards(model, tables, items, { codec, now });
  }

  function handled(command, input) {
    const args = inputArgs(input);
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const world = worldDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      let changes = [];
      let data = Buffer.alloc(0);
      let value = {};

      switch (command) {
        case 99200: {
          const team = teamFor(person, input?.team_id);
          team.state = 1; team.dst_gxy = input?.gxy ?? 0; team.dst_obj_tid = input?.obj_tid ?? 0;
          team.march_id = at;
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'nation_attack', amount: 1, details: { teamId: team.team_id, gxy: String(team.dst_gxy) }, at });
          data = codec.pack('pb_guild_nation_go_attack_back', { team_update: { team, team_state: { team_id: team.team_id, map_obj_tid: team.dst_obj_tid, map_obj: Buffer.alloc(0), march: { gxy: 0, start_time: at, end_time: at + config.marchSeconds }, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } }, is_def: false }, res: resOf(changes) });
          value = { teamId: team.team_id };
          break;
        }
        case 99201: {
          const tid = asInteger(input?.build_tid, 'build tid', { min: 1 });
          if (!config.buildTids.includes(tid)) throw new GameError(1, 'Guild nation build does not exist');
          changes = spendResources(model, config.buildCost, { codec });
          person.buildings[tid] = { tid, level: Number(person.buildings[tid]?.level ?? 0) + 1, finishTime: at + config.buildSeconds, oriBuildTime: config.buildSeconds };
          const buildItem = buildView(person.buildings[tid]);
          data = codec.pack('pb_guild_nation_build_change_back', { res: resOf(changes), build_item: buildItem, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } });
          value = { buildTid: tid, level: person.buildings[tid].level };
          break;
        }
        case 99202:
        case 99203: {
          const type = asInteger(input?.type, 'soldier type', { min: 1, max: 999 });
          if (!config.soldierTypes.includes(type)) throw new GameError(1, 'Guild nation soldier type does not exist');
          const count = optionalInteger(input?.num, 'soldier count', { min: 1 }) ?? 1;
          const level = command === 99202 ? 1 : optionalInteger(input?.target_level, 'target level', { min: 1 }) ?? 2;
          changes = spendResources(model, config.soldierCost, { codec });
          let soldier = person.soldiers.find(row => row.type === type && row.level === level);
          if (!soldier) { soldier = { type, level, num: 0, orgLevel: level, spawnNum: 0, beginTime: at, finishTime: at + config.soldierSeconds, oriBuildTime: config.soldierSeconds }; person.soldiers.push(soldier); }
          soldier.num += count; soldier.spawnNum += count; soldier.finishTime = at + config.soldierSeconds;
          data = codec.pack('pb_guild_nation_up_soldier_back', { res: resOf(changes), item_list: person.soldiers.map(soldierView) });
          value = { type, level, count };
          break;
        }
        case 99204:
          changes = spendResources(model, config.queueUnlockCost, { codec });
          world.maxQueues += 1;
          data = codec.pack('pb_guild_nation_build_queue_change_back', { res: resOf(changes), queue: queueView({ tid: world.maxQueues, lockSec: 0 }) });
          value = { queues: world.maxQueues };
          break;
        case 99205: {
          const tid = optionalInteger(args[0], 'queue tid', { min: 1 });
          person.queues = tid ? person.queues.filter(row => Number(row.tid) !== tid) : [];
          data = codec.pack('pb_guild_nation_build_change_back', { res: resOf([]), build_item: {}, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } });
          value = { cancelled: true };
          break;
        }
        case 99206:
          changes = spendResources(model, [[DIAMOND_TID, config.buildCost[0][1]]], { codec });
          data = codec.pack('pb_guild_nation_build_change_back', { res: resOf(changes), build_item: {}, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } });
          value = { accelerated: true };
          break;
        case 99207: {
          const costs = (input?.res_list ?? []).map(row => [asInteger(row.tid, 'resource tid', { min: 1 }), asInteger(row.num, 'resource count', { min: 1 })]);
          changes = spendResources(model, costs, { codec });
          data = codec.pack('pb_guild_nation_build_change_back', { res: resOf(changes), build_item: {}, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } });
          value = { resources: costs.length };
          break;
        }
        case 99208: {
          const ids = new Set((input?.report_uid_list ?? []).map(String));
          for (const report of world.reports) if (!ids.size || ids.has(String(report.uid))) report.isRead = true;
          const reports = world.reports.filter(report => !ids.size || ids.has(String(report.uid))).map(reportView);
          data = codec.pack('pb_guild_nation_report_back', { report_list: reports });
          value = { reports: reports.length };
          break;
        }
        case 99209:
          world.reports = []; person.reports = []; data = Buffer.alloc(0); value = { deleted: true }; break;
        case 99210: {
          const report = world.reports.find(row => !row.isReceived);
          if (!report) throw new GameError(5, 'No guild nation report is ready');
          report.isReceived = true;
          changes = grantClaim(db, model, context, world, 'report:' + report.uid, config.battleAward, at);
          data = codec.pack('pb_res_to_client', resOf(changes)); value = { report: report.uid }; break;
        }
        case 99211:
          data = codec.pack('pb_guild_nation_report_list', { version: world.version, is_red_dot: world.redDot, max_report_uid: world.reports.at(-1)?.uid ?? 0, report_list: world.reports.slice(-50).map(reportView) });
          value = { reports: world.reports.length }; break;
        case 99212: {
          const id = asInteger(input?.id, 'technology id', { min: 1 });
          const nodeId = optionalInteger(input?.node_id, 'technology node', { min: 1 }) ?? 1;
          if (person.studies.some(study => study.id === id)) throw new GameError(3, 'Technology is already being studied');
          changes = spendResources(model, config.studyCost, { codec });
          const study = { id, nodeId, level: 1, finishTime: at + config.studySeconds, initFinishTime: config.studySeconds };
          person.studies.push(study);
          data = codec.pack('pb_guild_nation_study_change_back', { res: resOf(changes), study: studyView(study), activation_node: { tid: nodeId, level: 1 } }); value = { technology: id }; break;
        }
        case 99213:
          person.studies = []; data = codec.pack('pb_guild_nation_study_change_back', { res: resOf([]), study: {}, activation_node: {} }); value = { cancelled: true }; break;
        case 99214:
          changes = spendResources(model, [[DIAMOND_TID, config.studySpeedCost]], { codec });
          for (const study of person.studies) study.finishTime = at;
          data = codec.pack('pb_guild_nation_study_change_back', { res: resOf(changes), study: person.studies[0] ? studyView(person.studies[0]) : {}, activation_node: {} }); value = { accelerated: true }; break;
        case 99215: {
          const costs = (input?.res_list ?? []).map(row => [asInteger(row.tid, 'resource tid', { min: 1 }), asInteger(row.num, 'resource count', { min: 1 })]);
          changes = spendResources(model, costs, { codec });
          for (const study of person.studies) study.finishTime = Math.max(at, Number(study.finishTime) - 60 * Math.max(1, costs.length));
          data = codec.pack('pb_guild_nation_study_change_back', { res: resOf(changes), study: person.studies[0] ? studyView(person.studies[0]) : {}, activation_node: {} }); value = { resources: costs.length }; break;
        }
        case 99216:
        case 99257:
        case 99260: {
          if (!person.studies.length) throw new GameError(5, 'No technology is being studied');
          const study = person.studies.shift(); person.technology[study.nodeId] = study.level;
          data = codec.pack('pb_guild_nation_finish_study_back', { activation_node: { tid: study.nodeId, level: study.level }, res: resOf(changes) }); value = { finish: study.id }; break;
        }
        case 99217: world.redDot = false; value = { redDot: false }; break;
        case 99218: for (const team of person.teams) { team.state = 0; team.march_id = 0; } value = { recalled: true }; break;
        case 99219: {
          const teamId = teamFor(person, args[0]).team_id;
          person.teams = person.teams.filter(team => team.team_id !== teamId);
          data = codec.pack('pb_guild_nation_up_soldier_back', { res: resOf([]), item_list: person.soldiers.map(soldierView) }); value = { teamId }; break;
        }
        case 99220: person.protects[context.roleId] = at + config.protectSeconds; data = codec.pack('pb_guild_nation_use_protect_back', { protect_start_time: at, protect_end_time: person.protects[context.roleId], res: resOf([]) }); value = { protected: true }; break;
        case 99221: person.fires[context.roleId] = 0; data = codec.pack('pb_guild_nation_extinguish_back', { city_hp: person.cityHp, fire_start_time: 0, fire_end_time: 0, res: resOf([]) }); value = { extinguished: true }; break;
        case 99222: person.repair = { start: at, end: at + config.repairSeconds }; data = codec.pack('pb_guild_nation_repair_city_back', { city_hp: person.cityHp, repair_start_time: at, repair_end_time: person.repair.end, res: resOf([]), origin_repair_time: config.repairSeconds }); value = { repairing: true }; break;
        case 99223: data = codec.pack('pb_guild_nation_build_list', { build_list: Object.values(person.buildings).map(buildView) }); value = { buildList: Object.keys(person.buildings).length }; break;
        case 99224: {
          const team = teamFor(person, input?.line_up_cell?.[0]?.team_id); team.cell_list = Array.isArray(input?.line_up_cell) ? input.line_up_cell : [];
          data = codec.pack('pb_guild_nation_soldier_line_up_back', { soldier_changes: [], lineup_cell: team.cell_list, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } }); value = { cells: team.cell_list.length }; break;
        }
        case 99225:
        case 99226: {
          if (command === 99225) changes = spendResources(model, [[DIAMOND_TID, config.soldierSpeedCost]], { codec });
          else changes = spendResources(model, (input?.res_list ?? []).map(row => [asInteger(row.tid, 'resource tid', { min: 1 }), asInteger(row.num, 'resource count', { min: 1 })]), { codec });
          for (const soldier of person.soldiers) soldier.finishTime = at;
          data = codec.pack('pb_guild_nation_up_soldier_back', { res: resOf(changes), item_list: person.soldiers.map(soldierView) }); value = { accelerated: person.soldiers.length }; break;
        }
        case 99227: {
          const count = asInteger(input?.num, 'donation count', { min: 1 });
          changes = spendResources(model, [[DIAMOND_TID, count]], { codec });
          const techId = asInteger(input?.tech_id, 'technology id', { min: 1 });
          world.technologies[techId] = Number(world.technologies[techId] ?? 0) + count * config.donatePointPerDiamond;
          person.donate.donate_num += count; person.donate.donate_num_diamond += count; person.donate.last_donate_time = at;
          data = codec.pack('pb_guild_nation_team_tech_donation_back', { res: resOf(changes), node: { tid: techId, level: 1, progress: world.technologies[techId], up_lv_time: 0 } }); value = { technology: techId, progress: world.technologies[techId] }; break;
        }
        case 99228: {
          const power = lineupPower(model, heroTables);
          data = codec.pack('pb_guild_nation_power_info_rsp', { lineup_power: [{ type: 1, team_power: [{ index: 1, power }] }] }); value = { power }; break;
        }
        case 99230: {
          const rows = Array.isArray(input?.list) ? input.list : [input];
          for (let index = 0; index < rows.length; index++) {
            const row = rows[index] ?? {};
            const id = String(row.id ?? at * 100 + index);
            db.prepare('INSERT OR REPLACE INTO guild_nation_assists VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, context.guildId, String(context.roleId), Number(row.target_type ?? 1), Number(row.target_id ?? 1), Math.max(1, Number(row.max_num ?? config.assistMax)), 0, at + config.assistSeconds, Number(row.target_lv ?? 1), new Date(at * 1000).toISOString());
          }
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'nation_send_assist', amount: rows.length, details: {}, at });
          value = { assists: rows.length };
          break;
        }
        case 99231: {
          const requested = Array.isArray(input?.list) ? input.list.map(row => String(row.id)) : [];
          const active = activeAssists(context.guildId, db);
          const requestedRows = requested.length
            ? active.filter(row => requested.includes(String(row.role_id)) || requested.includes(String(row.id)))
            : active;
          const targets = requestedRows.length ? requestedRows : active;
          let assisted = 0;
          for (const row of targets) {
            const result = db.prepare('UPDATE guild_nation_assists SET assist_num=assist_num+1 WHERE guild_id=? AND assist_id=? AND assist_num<max_num').run(context.guildId, String(row.id));
            assisted += Number(result.changes ?? 0);
          }
          if (!assisted) throw new GameError(5, 'No assist target is available');
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'nation_assist', amount: assisted, details: {}, at });
          data = codec.pack('pb_guild_nation_assist_list_back', { list: activeAssists(context.guildId, db) });
          value = { assisted };
          break;
        }
        case 99232: {
          const tid = asInteger(input?.tid, 'soldier item tid', { min: 1 });
          person.raiseEnd = at + config.soldierSeconds;
          data = codec.pack('pb_guild_nation_soldier_item_raise_num_back', { res: resOf([]), raise_end_sec: person.raiseEnd });
          value = { tid, raiseEnd: person.raiseEnd };
          break;
        }
        case 99233: {
          world.recommendTech = optionalInteger(args[0], 'technology id', { min: 1 }) ?? 1;
          data = codec.pack('pb_guild_nation_team_tech_recommend_back', { tech_id: world.recommendTech });
          value = { technology: world.recommendTech };
          break;
        }
        case 99234: {
          const gxy = optionalInteger(args[0], 'guild base coordinate', { min: 1 }) ?? person.baseGxy;
          world.coreGxy = gxy;
          data = codec.pack('pb_guild_nation_guild', guildView(world, context));
          value = { coreGxy: gxy };
          break;
        }
        case 99235: {
          const gxy = optionalInteger(args[0], 'role base coordinate', { min: 1 }) ?? person.baseGxy;
          person.baseGxy = gxy;
          data = codec.pack('pb_res_to_client', resOf([]));
          value = { baseGxy: gxy };
          break;
        }
        case 99236:
          value = { returned: true };
          break;
        case 99237: {
          const tid = asInteger(input?.item_tid, 'repair item tid', { min: 1 });
          const count = asInteger(input?.num, 'repair item count', { min: 1 });
          changes = spendResources(model, [[tid, count]], { codec });
          person.repair ??= { start: at, end: at + config.repairSeconds };
          person.repair.end = Math.max(at, Number(person.repair.end) - count * 10);
          data = codec.pack('pb_guild_nation_repair_city_back', { city_hp: person.cityHp, repair_start_time: person.repair.start, repair_end_time: person.repair.end, res: resOf(changes), origin_repair_time: config.repairSeconds });
          value = { resources: count };
          break;
        }
        case 99238:
          changes = spendResources(model, [[DIAMOND_TID, config.repairSeconds / 60]], { codec });
          person.repair ??= { start: at, end: at + config.repairSeconds };
          person.repair.end = at;
          data = codec.pack('pb_guild_nation_repair_city_back', { city_hp: person.cityHp, repair_start_time: person.repair.start, repair_end_time: at, res: resOf(changes), origin_repair_time: config.repairSeconds });
          value = { accelerated: true };
          break;
        case 99239:
          person.repair = null;
          data = codec.pack('pb_guild_nation_repair_city_back', { city_hp: person.cityHp, repair_start_time: 0, repair_end_time: 0, res: resOf([]), origin_repair_time: 0 });
          value = { cancelled: true };
          break;
        case 99240:
        case 99241: {
          const row = config.taskAwards[Math.min(person.tasks.length, config.taskAwards.length - 1)];
          changes = grantClaim(db, model, context, world, 'task:' + (command === 99240 ? row.tid : 'phase'), row.items, at);
          person.tasks.push({ tid: row.tid, time: at });
          if (command === 99241) person.taskStats.push({ id: 1, stat: [{ key: 'phase', value: 1 }] });
          data = codec.pack('pb_guild_nation_task_finish_back', { task_data: { task_list: person.tasks.map(task => Buffer.from(JSON.stringify(task))), phase: { cur_phase: command === 99241 ? 2 : 1, is_received: command === 99241 } }, res: resOf(changes) });
          value = { task: row.tid, claimed: true };
          break;
        }
        case 99242:
          data = codec.pack('pb_guild_nation_role', roleView(person));
          value = { roleId: context.roleId };
          break;
        case 99243: {
          const tid = asInteger(input?.item_tid, 'march item tid', { min: 1 });
          const count = asInteger(input?.num, 'march item count', { min: 1 });
          changes = spendResources(model, [[tid, count]], { codec });
          for (const team of person.teams) if (team.state === 1) team.march_id = at;
          data = codec.pack('pb_guild_nation_march_acc_back', { end_time: at + config.marchSeconds, res: resOf(changes) });
          value = { resources: count };
          break;
        }
        case 99244:
          person.coreHp = config.coreHp;
          data = codec.pack('pb_guild_nation_repair_map_back', { res: [], hp: person.coreHp });
          value = { coreHp: person.coreHp };
          break;
        case 99245: {
          const objTid = asInteger(input?.obj_tid, 'map object tid', { min: 1 });
          data = codec.pack('pb_guild_nation_search_back', { obj_tid: objTid, obj_type: Number(input?.obj_type ?? 1), obj_data: Buffer.alloc(0) });
          value = { objTid };
          break;
        }
        case 99246: {
          const team = teamFor(person, input?.team_id);
          const timerId = Number(input?.time_idx ?? at);
          world.musters[timerId] = { timerId, src: context.roleId, dst: String(input?.dst_id ?? 0), gxy: String(input?.dst_gxy ?? 0), team, end: at + config.musterSeconds };
          data = codec.pack('pb_guild_nation_call_muster_back', { res: resOf([]), team_state_update: { team, team_state: { team_id: team.team_id, map_obj_tid: input?.dst_obj_tid ?? 0, map_obj: Buffer.alloc(0), march: { gxy: 0, start_time: at, end_time: at + config.musterSeconds }, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } }, is_def: false }, muster_info: { timer_id: timerId, src_id: context.roleId, dst_id: input?.dst_id ?? 0, src_gxy: person.baseGxy, dst_gxy: input?.dst_gxy ?? 0, dst_obj_tid: input?.dst_obj_tid ?? 0, team_id: team.team_id, end_time: at + config.musterSeconds, team_num_limit: config.teamSlots, soldier_num_limit: 1000, muster_team_list: [] } });
          value = { timer: timerId };
          break;
        }
        case 99247: {
          const timerId = String(input?.timer_id ?? 0);
          const muster = world.musters[timerId];
          if (!muster || at >= Number(muster.end)) throw new GameError(5, 'Muster has ended');
          muster.answered = [...new Set([...(muster.answered ?? []), context.roleId])];
          const team = teamFor(person, input?.team_id);
          data = codec.pack('pb_guild_nation_answer_muster_back', { res: resOf([]), team_state_update: { team, team_state: { team_id: team.team_id, map_obj_tid: muster.team?.dst_obj_tid ?? 0, map_obj: Buffer.alloc(0), march: { gxy: 0, start_time: at, end_time: muster.end }, energy_change_info: { settle_time: 0, hero_energy_list: [], res: resOf([]) } }, is_def: false } });
          value = { timer: timerId };
          break;
        }
        case 99248:
          world.flags = [...new Set([...world.flags, person.baseGxy])];
          data = codec.pack('pb_guild_nation_guild_res_to_client', { change_list: [] });
          value = { flags: world.flags.length };
          break;
        case 99249: {
          const oldGxy = input?.old_gxy;
          const newGxy = input?.new_gxy;
          world.flags = world.flags.filter(gxy => String(gxy) !== String(oldGxy));
          if (!world.flags.some(gxy => String(gxy) === String(newGxy))) world.flags.push(newGxy);
          data = codec.pack('pb_guild_nation_guild_res_to_client', { change_list: [] });
          value = { flags: world.flags.length };
          break;
        }
        case 99250: {
          const row = config.strongholdAwards[0];
          changes = grantClaim(db, model, context, world, 'stronghold', row.items, at);
          data = codec.pack('pb_res_to_client', resOf(changes));
          value = { award: row.tid };
          break;
        }
        case 99251: {
          changes = grantClaim(db, model, context, world, 'stronghold-honor', config.honorAward, at);
          data = codec.pack('pb_res_to_client', resOf(changes));
          value = { honor: true };
          break;
        }
        case 99252: {
          const strongholdTid = optionalInteger(input?.stronghold_tid, 'stronghold tid', { min: 1 }) ?? 1;
          data = codec.pack('pb_guild_nation_stronghold_capture_record', { stronghold_tid: strongholdTid, capture_list: [] });
          value = { strongholdTid };
          break;
        }
        case 99253:
          data = codec.pack('pb_guild_nation_muster_info_list_back', { muster_info_list: Object.values(world.musters).filter(muster => at < Number(muster.end)).map(muster => ({ timer_id: muster.timerId, src_id: muster.src, dst_id: muster.dst, src_gxy: person.baseGxy, dst_gxy: muster.gxy, dst_obj_tid: 0, team_id: muster.team?.team_id ?? 0, end_time: muster.end, team_num_limit: config.teamSlots, soldier_num_limit: 1000, muster_team_list: [] })) });
          value = { musters: Object.keys(world.musters).length };
          break;
        case 99254: {
          const tid = optionalInteger(args[0], 'stronghold tid', { min: 1 }) ?? 1;
          const row = world.strongholds[tid] ?? { guildId: 0, signUp: [], occupiedAt: 0 };
          row.signUp = [...new Set([...(row.signUp ?? []), context.guildId])];
          world.strongholds[tid] = row;
          data = codec.pack('pb_guild_nation_stronghold_sign_ret', { stronghold_data: allStrongholds(world), stronghold_guild: strongholdGuild(world, context) });
          value = { strongholdTid: tid };
          break;
        }
        case 99255: {
          const timer = String(input?.timer_id ?? 0);
          const muster = world.musters[timer];
          if (!muster) throw new GameError(1, 'Muster does not exist');
          delete world.musters[timer];
          data = codec.pack('pb_guild_nation_cancel_muster_back', { team_info: muster.team ?? emptyTeam(1) });
          value = { timer };
          break;
        }
        case 99256: {
          const techId = optionalInteger(args[0], 'technology id', { min: 1 }) ?? world.recommendTech;
          world.technologies[techId] = Number(world.technologies[techId] ?? 0) + 1;
          data = codec.pack('pb_guild_nation_guild_tech_up_back', { res: [], node: { tid: techId, level: 1, progress: world.technologies[techId], up_lv_time: 0 } });
          value = { technology: techId };
          break;
        }
        case 99258:
          changes = grantClaim(db, model, context, world, 'stronghold-battle', config.battleAward, at);
          data = codec.pack('pb_res_to_client', resOf(changes));
          value = { claimed: true };
          break;
        case 99259:
          value = { mapObject: true };
          break;
        case 99261: {
          const scores = rosterScores(db, { scope: SCOPE, guildId: context.guildId, members: context.members });
          data = codec.pack('pb_guild_nation_battle_guild', { role_list: scores.map(row => ({ role_id: row.role_id, num: row.score })) });
          value = { roles: scores.length };
          break;
        }
        case 99262: {
          const tid = optionalInteger(args[0], 'stronghold tid', { min: 1 }) ?? 1;
          data = codec.pack('pb_guild_nation_stronghold', strongholdView(world, tid));
          value = { strongholdTid: tid };
          break;
        }
        case 99263: {
          const signNums = Object.entries(world.strongholds).map(([tid, row]) => ({ key: Number(tid), value: (row.signUp ?? []).length }));
          data = codec.pack('pb_guild_nation_stronghold_sign_num', { sign_num_list: signNums });
          value = { strongholds: signNums.length };
          break;
        }
        case 99264:
          value = { returned: true };
          break;
        default:
          throw new GameError(1, 'Unknown guild nation command');
      }

      writeDoc(db, SCOPE, context.guildId, '0', 'world', world, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      return { data, value };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown guild nation command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handled(command, input);
    log({ event: 'guild_nation_command', type: command, ...result.value });
    return result;
  }

  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_NATION_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
