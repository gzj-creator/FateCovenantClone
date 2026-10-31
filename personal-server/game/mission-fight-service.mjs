import { decodeEtf, encodeEtfIntegerTuple, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { missionBattleConfig, readMissionTables } from '../config/mission-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { BATTLE_RESULT, FIGHT_ATTR, FIGHT_ENERGY_MAX, FIGHT_INITIAL_ENERGY, simulateBattle } from './battle-engine.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { decodeBitBlock, encodeBitBlock, hasBit, setBit } from './bit-block.mjs';

// Ordinary journey (mission) fights.
// Evidence: FightCmd.fight_start sends pb_fight_request.req = Codec.EncodePB('mission_fight_req');
// FightMgr handles pb_fight_response.report/stm and MissionUIMgr.AttackResult decodes stm.stm_data
// as 'mission_to_client'. The local service derives the configured enemy team and emits an
// action stream that can be replayed by the client's FightParseCtxMgr before settlement.
const MISSION_MODULE = 8;
const RESULT_WIN = BATTLE_RESULT.WIN;
// FightTable.TypeClient ids are TID_FIGHT_TYPE_* values. FightTable.lua sets
// TID_FIGHT_TYPE_MISSION = 1; id 3 is TID_FIGHT_TYPE_PEAK_TOWER and has
// multi_fight_model = 1 (four teams x five battles). Journey missions must use 1.
const REPORT_TYPE_CLIENT = 1;
const FIGHTER_ROLE_HERO = 1;
const FIGHTER_ROLE_NPC = 2;
const FIGHTER_ROLE_CAPTAIN = 3;
const ACTION_ABILITY_COMMON = 1;
const ACTION_ABILITY_ACTIVE = 2;
const PROMPT_NORMAL_HARM = 101;
const ACTION_ACTION_BEFORE = 101;
const ACTION_ACTION_AFTER = 102;
const ACTION_BATTLE_OVER = 104;
const ACTION_FIGHTER_DIE = 105;
const ACTION_FIGHT_HARM = 106;
const ACTION_ROUND_READY = 107;
const ACTION_SHIELD = 109;
const ACTION_ROUND_OVER = 112;
const ACTION_FIGHTER_RELIVE = 114;
const ACTION_FAT_ATTR_SYNC = 116;
// This APK fixes MissionSweepMgr.DEFAULT_MULTI_SWEEP_COUNT at 10 and
// MissionSweepSweepForm._SweepOneKey sends that value. SweepMission may lower
// it to the affordable count, so this client emits values from 1 through 10.
// This is a current-client boundary, not a field in MissionTable.SweepConst.
const CURRENT_CLIENT_MAX_SWEEP_TIMES = 10;

let missionOrderCache = null;

function missionOrder(sections) {
  if (!missionOrderCache || missionOrderCache.sections !== sections) {
    const entries = [...sections.entries()]
      .filter(([, section]) => !section?.is_discard)
      .sort((left, right) => Number(left[1]?.index ?? left[0]) - Number(right[1]?.index ?? right[0]) || Number(left[0]) - Number(right[0]));
    missionOrderCache = { sections, entries };
  }
  return missionOrderCache.entries;
}

function missionPosition(sections, missionId) {
  return missionOrder(sections).findIndex(([id]) => Number(id) === Number(missionId));
}

function nextMissionId(sections, missionId) {
  const order = missionOrder(sections), position = missionPosition(sections, missionId);
  return position >= 0 && position + 1 < order.length ? Number(order[position + 1][0]) : Number(missionId);
}

function action(codec, proto, schema, value) {
  return codec.pack('pb_generic', { proto, bin: codec.pack(schema, value) });
}

function unitConfig(tables, role, roleType) {
  const hero = tables.heroes.Hero.get(Number(role));
  if (!hero) throw new GameError(5, 'Mission fighter configuration missing');
  // Early mission enemies reuse hero rows, while later combat NPCs have a dedicated Npc row.
  const npc = roleType === FIGHTER_ROLE_NPC ? tables.heroes.Npc.get(Number(role)) : null;
  const ability = npc ? tables.heroes.Npc_Ability.get(Number(role)) : tables.heroes.Ability.get(Number(role));
  return { hero, npc: Boolean(npc), abilities: ability?.ability ?? [] };
}

function actionList(codec, simulation) {
  const events = [];
  for (const event of simulation.events) {
    if (event.kind === 'round-start') {
      events.push(action(codec, ACTION_ROUND_READY, 'pb_fat_round_ready', { round: event.round }));
    } else if (event.kind === 'action-start') {
      events.push(action(codec, ACTION_ACTION_BEFORE, 'pb_fat_action_before', {
        id: event.id,
        src_id: event.srcId,
        assist_list: event.assistIds ?? [],
        aim_list: event.aimList,
        ab_tid: event.abilityId,
        type: event.actionType === ACTION_ABILITY_ACTIVE ? ACTION_ABILITY_ACTIVE : ACTION_ABILITY_COMMON
      }));
    } else if (event.kind === 'damage') {
      events.push(action(codec, ACTION_FIGHT_HARM, 'pb_fat_harm', {
        id: event.id,
        harm_list: event.harms.map(harm => ({
          aim_id: harm.aimId,
          src_id: harm.srcId,
          type: PROMPT_NORMAL_HARM,
          is_ab_aim: true,
          value: harm.value,
          old_hp: harm.oldHp,
          hp: harm.hp,
          old_shield: harm.oldShield,
          shield: harm.shield
        }))
      }));
    } else if (event.kind === 'shield') {
      events.push(action(codec, ACTION_SHIELD, 'pb_fat_shield', {
        id: event.id,
        aim_id: event.aimId,
        shield: event.shield
      }));
    } else if (event.kind === 'death') {
      events.push(action(codec, ACTION_FIGHTER_DIE, 'pb_fat_fighter_die', {
        id: event.id,
        src_id: event.srcId,
        aim_id: event.aimId,
        count: event.count
      }));
    } else if (event.kind === 'revive') {
      events.push(action(codec, ACTION_FIGHTER_RELIVE, 'pb_fat_fighter_relive', {
        id: event.id,
        aim_id: event.aimId
      }));
    } else if (event.kind === 'anger-sync') {
      events.push(action(codec, ACTION_FAT_ATTR_SYNC, 'pb_fat_attr_sync', {
        id: event.id,
        attr_list: event.attrList.map(attr => ({
          aim_id: attr.aimId,
          attr_type: attr.attrType,
          attr_val: attr.attrValue,
          ignore_tip: attr.ignoreTip
        }))
      }));
    } else if (event.kind === 'action-end') {
      events.push(action(codec, ACTION_ACTION_AFTER, 'pb_fat_action_after', { id: event.id }));
    } else if (event.kind === 'round-end') {
      events.push(action(codec, ACTION_ROUND_OVER, 'pb_fat_round_over', { round: event.round }));
    } else if (event.kind === 'battle-end') {
      events.push(action(codec, ACTION_BATTLE_OVER, 'pb_fat_battle_over', { why: event.result }));
    }
  }
  return events;
}

function battleSeed(missionId, fightTid, roleId) {
  const text = String(missionId) + ':' + String(fightTid) + ':' + String(roleId);
  let seed = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    seed ^= text.charCodeAt(index);
    seed = Math.imul(seed, 0x01000193);
  }
  return seed || 1;
}

function requestedMembers(model, request) {
  const wireTeam = (request.loc ?? []).find(team => (team.loc ?? []).length > 0);
  if (wireTeam) {
    const teamIndex = Number(wireTeam.team_id ?? 1);
    return {
      teamIndex: Number.isSafeInteger(teamIndex) && teamIndex > 0 ? teamIndex : 1,
      members: wireTeam.loc.map(entry => ({ heroId: String(entry.hero_id), loc: Number(entry.loc) }))
    };
  }
  const lineup = model.playLineups.find(value => value.type === 1)?.team_list?.[0];
  if (!lineup) throw new GameError(5, 'Journey lineup is missing');
  return {
    teamIndex: 1,
    members: (lineup.fighter_list ?? []).map(entry => ({ heroId: String(entry.hero_id), loc: Number(entry.loc) }))
  };
}

function combatAttributes(hero, level, maxHp, enemy = false) {
  const profession = Number(hero.profession ?? 0);
  const speedBase = profession === 3 ? 112 : profession === 4 ? 104 : profession === 2 ? 98 : profession === 5 ? 92 : 88;
  const attackRatio = profession === 3 ? 0.125 : profession === 2 ? 0.115 : profession === 4 ? 0.11 : profession === 5 ? 0.075 : 0.085;
  const defenseRatio = profession === 1 ? 0.032 : profession === 2 ? 0.026 : 0.018;
  return {
    profession,
    attack: Math.max(1, Math.round(maxHp * attackRatio + level * 3) * (enemy ? 0.9 : 1)),
    defense: Math.max(0, Math.round(maxHp * defenseRatio + level * 2)),
    speed: speedBase + (Number(hero.index ?? 0) % 7),
    initialEnergy: FIGHT_INITIAL_ENERGY
  };
}

function initialFightAttributes(initialEnergy) {
  return [
    { type: FIGHT_ATTR.ANGER, value: initialEnergy },
    { type: FIGHT_ATTR.MAX_ANGER, value: FIGHT_ENERGY_MAX }
  ];
}

function activeAbilityId(abilities) {
  const values = abilities.map(Number);
  // FightActionBeforeStep dispatches on FightTable.Ability(ab_tid).type. The
  // shipped skill ids encode the same type in their leading digit: 1 common,
  // 2 active, 3 passive and 4 attribute. Returning a passive id here makes the
  // client take its normal-attack path even when the action packet says type 2.
  return values.find(id => String(id).startsWith('2')) ?? values[0] ?? 1;
}

// FightCaptainRoleInfoNode loads FighterMgr:GetCaptain(LOC_ASSAULT) and indexes
// captainFighter without a nil guard. A captain fighter is a VirtualFighter used
// by the artifact HUD; it is not one of the player's HeroFighter rows.
function captainFighter(attackers, selected) {
  const leader = attackers[0];
  return {
    id: 100,
    tid: 0,
    role_type: FIGHTER_ROLE_CAPTAIN,
    uid: '0',
    role: 0,
    team: 1,
    team_index: selected.teamIndex,
    loc: 0,
    star: 0,
    level: Math.max(...attackers.map(unit => unit.level)),
    quality: 1,
    hp: 1,
    max_hp: 1,
    enable: true,
    final_hp: 1,
    style: Number(leader.style),
    ability_list: [],
    init_attr: [],
    water_gun: 0,
    profession: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    initialEnergy: 0,
    abilityId: 0
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
    const combat = combatAttributes(cfg.hero, level, maxHp);
    const abilities = cfg.abilities.slice(0, 8).map(Number);
    return {
      id: 101 + index, tid: role, role_type: FIGHTER_ROLE_HERO, uid: String(hero.uid), role,
      team: 1, team_index: selected.teamIndex, loc: entry.loc,
      star: Number(hero.star ?? 0), level, quality, hp: maxHp, max_hp: maxHp,
      enable: true, final_hp: maxHp, style: Number(cfg.hero.style ?? role),
      ability_list: abilities, init_attr: initialFightAttributes(combat.initialEnergy), water_gun: 0,
      profession: combat.profession, attack: combat.attack, defense: combat.defense,
      speed: combat.speed, initialEnergy: combat.initialEnergy, abilityId: abilities[0] ?? 1,
      activeAbilityId: activeAbilityId(abilities)
    };
  });
  const attackerLevel = Math.max(...attackers.map(unit => unit.level));
  const defenders = config.enemies.map((role, index) => {
    const cfg = unitConfig(config.tables, role, 2);
    const level = Math.max(1, attackerLevel), quality = Number(cfg.hero.quality ?? 1);
    const maxHp = Math.round((1000 + level * 100 + quality * 10) * 0.88);
    const combat = combatAttributes(cfg.hero, level, maxHp, true);
    const abilities = cfg.abilities.slice(0, 8).map(Number);
    return {
      id: 201 + index, tid: role, role_type: cfg.npc ? FIGHTER_ROLE_NPC : FIGHTER_ROLE_HERO, uid: '0', role,
      team: 2, team_index: 1, loc: index + 1,
      star: Number(cfg.hero.star ?? 0), level, quality, hp: maxHp, max_hp: maxHp,
      enable: true, final_hp: 0, style: Number(cfg.hero.style ?? role),
      ability_list: abilities, init_attr: initialFightAttributes(combat.initialEnergy), water_gun: 0,
      profession: combat.profession, attack: combat.attack, defense: combat.defense,
      speed: combat.speed, initialEnergy: combat.initialEnergy, abilityId: abilities[0] ?? 1,
      activeAbilityId: activeAbilityId(abilities)
    };
  });
  const fightTid = Number(request.fight_tid ?? 0) || Number(config.mission.fight ?? 0);
  const seed = battleSeed(mission.missionId, fightTid, model.state.roleId);
  const combatUnit = unit => ({
    id: unit.id,
    role: unit.role,
    profession: unit.profession,
    loc: unit.loc,
    abilityId: unit.abilityId,
    activeAbilityId: unit.activeAbilityId,
    maxHp: unit.max_hp,
    attack: unit.attack,
    defense: unit.defense,
    speed: unit.speed,
    initialEnergy: unit.initialEnergy
  });
  const simulation = simulateBattle({ attackers: attackers.map(combatUnit), defenders: defenders.map(combatUnit), seed });
  const finalHp = new Map([...simulation.attackers, ...simulation.defenders].map(unit => [unit.id, unit.hp]));
  for (const unit of attackers) unit.final_hp = finalHp.get(unit.id) ?? unit.final_hp;
  for (const unit of defenders) unit.final_hp = finalHp.get(unit.id) ?? 0;
  const fighters = [captainFighter(attackers, selected), ...attackers, ...defenders];
  const brief = (team, members) => ({ team_list: [{
    team_index: team,
    fighter_list: members.map(unit => ({ tid: unit.role, is_mutant: false }))
  }] });
  return {
    simulation,
    // pb_fight_report_battle team indices are 1-based; FightForm:RefreshTeamIndex
    // selects team_index - 1 and FightScene:SetSceneShowContent indexes
    // scene.location_and_camera with def_team_index directly.
    atk_team_index: selected.teamIndex,
    def_team_index: 1,
    fighter_list: fighters,
    action_list: actionList(codec, simulation),
    over_reason: simulation.result,
    over_round: simulation.overRound,
    result: simulation.result,
    is_add_battle: false,
    atk_power: String(attackers.reduce((sum, unit) => sum + unit.max_hp, 0)),
    def_power: String(defenders.reduce((sum, unit) => sum + unit.max_hp, 0)),
    atk_brief_lineup: brief(selected.teamIndex, attackers),
    def_brief_lineup: brief(1, defenders)
  };
}

function configuredAwards(section) {
  const ids = Array.isArray(section?.award) ? section.award : [];
  const counts = Array.isArray(section?.award_n) ? section.award_n : [];
  if (ids.length !== counts.length) throw new GameError(5, 'Mission reward configuration is invalid');
  return ids.map((id, index) => [Number(id), Number(counts[index])]);
}

function grantMissionExperience(model, gameTables) {
  const level = Number(model.role.level ?? 1);
  const exp = Number(model.role.exp ?? 0);
  if (!Number.isSafeInteger(level) || level < 1 || !Number.isSafeInteger(exp) || exp < 0) throw new GameError(5, 'Role experience is invalid');
  const levelConfig = gameTables.RoleLevel.get(level);
  const amount = Number(levelConfig?.mission_award_num);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new GameError(5, 'Role mission experience configuration is missing');
  let nextLevel = level, nextExp = exp + amount;
  if (!Number.isSafeInteger(nextExp)) throw new GameError(1, 'Role experience limit reached');
  const configuredMax = Number(gameTables.RoleLevelSetting.get(1)?.max_level ?? 0);
  const maxLevel = configuredMax > 0 ? configuredMax : Math.max(...gameTables.RoleLevel.keys());
  while (nextLevel < maxLevel) {
    const reachExp = Number(gameTables.RoleLevel.get(nextLevel)?.reach_exp);
    if (!Number.isSafeInteger(reachExp) || reachExp <= 0) throw new GameError(5, 'Role level experience configuration is missing');
    if (nextExp < reachExp) break;
    nextExp -= reachExp;
    nextLevel++;
  }
  model.role.level = nextLevel;
  model.role.exp = nextExp;
  return {
    tid: '140000',
    new_num: String(nextExp),
    diff_num: String(amount),
    extra: encodeEtfIntegerTuple([nextLevel, nextExp]).toString('base64')
  };
}

function firstClearReward(model, db, section, gameTables, now) {
  const awards = configuredAwards(section);
  if (!awards.length) return { changes: [], is_overflow: false };
  if (awards.some(([id, count]) => !Number.isSafeInteger(id) || !Number.isSafeInteger(count) || count < 0)) throw new GameError(5, 'Mission reward configuration is invalid');
  const claimKey = String(section.tid);
  if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'mission_first_clear', claimKey)) return { changes: [], is_overflow: false };
  db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'mission_first_clear', claimKey, new Date(now()).toISOString());
  const res = grantResources(model, awards.filter(([, count]) => count > 0), gameTables);
  return { changes: res.changes, is_overflow: false };
}

function configuredBoxAwards(box) {
  const awards = Array.isArray(box?.award) ? box.award : [];
  const result = awards.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, 'Mission box reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count <= 0) throw new GameError(5, 'Mission box reward configuration is invalid');
    return [tid, count];
  });
  if (!result.length) throw new GameError(5, 'Mission box has no configured rewards');
  return result;
}

function configuredSweepAwards(sweep) {
  if (Number(sweep?.rand_award ?? 0) !== 0) throw new GameError(5, 'Random mission sweep rewards are not implemented');
  const awards = Array.isArray(sweep?.award) ? sweep.award : [];
  const result = awards.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new GameError(5, 'Mission sweep reward configuration is invalid');
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(count) || count <= 0) throw new GameError(5, 'Mission sweep reward configuration is invalid');
    return [tid, count];
  });
  if (!result.length) throw new GameError(5, 'Mission sweep has no configured rewards');
  return result;
}

function combinedChanges(...groups) {
  const changes = new Map();
  for (const change of groups.flat()) {
    const tid = String(change.tid);
    const current = changes.get(tid);
    if (current) {
      current.new_num = String(change.new_num);
      current.diff_num = (BigInt(current.diff_num) + BigInt(change.diff_num)).toString();
    } else {
      changes.set(tid, { tid, new_num: String(change.new_num), diff_num: String(change.diff_num) });
    }
  }
  return [...changes.values()];
}

export function createMissionFightService({ store, codec, gameTables = readGameTables(), missionTables = readMissionTables(), now = Date.now, logger = () => {}, playbackEnabled = false }) {
  const log = event => { try { logger(event); } catch {} };
  let pending = null, lastReport = null, lastSettlement = null, fightIds = 0;

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

  function currentMission(model) {
    const module = new Map(model.state.modules.value).get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value)) throw new Error('Mission login module missing');
    return { module, value: codec.unpack('pb_mission', rawBinary(module.value[0])) };
  }

  function missionValue(current, mission, fightResult, res) {
    return {
      res,
      fight_result: fightResult,
      mission: { mission_id: String(current.mission_id ?? 0), pass_count: current.pass_count },
      is_boss: mission.bossTid > 0,
      boss_tid: mission.bossTid
    };
  }

  function commitSettlement() {
    return store.transaction((model, db) => {
      const { module, value: current } = currentMission(model);
      const previous = Number(current.mission_id ?? 0);
      let res = { changes: [], is_overflow: false };
      if (pending.result === RESULT_WIN) {
        const completed = pending.mission.missionId;
        const sections = missionTables.sections;
        const previousPosition = missionPosition(sections, previous), completedPosition = missionPosition(sections, completed);
        if (completedPosition >= 0 && (previousPosition < 0 || completedPosition >= previousPosition)) {
          // MissionMgr.ParseData assigns pb_mission.mission_id to sectionTid and
          // only refreshes the journey UI when the value changes. After a win,
          // this field must therefore be the next fight rather than the node
          // that was just cleared.
          current.mission_id = String(nextMissionId(sections, completed));
          if (!current.pass_count) current.pass_count = { flush_time: 0, count: 0 };
          current.pass_count.count = Number(current.pass_count.count ?? 0) + 1;
          const section = missionTables.sections.get(completed);
          res = firstClearReward(model, db, section, gameTables, now);
        }
        // A successful journey battle always grants role experience. Replaying
        // an already cleared section does not repeat its first-clear rewards,
        // but still consumes stamina and must grant the current level's
        // RoleTable.Level.mission_award_num.
        res.changes.push(grantMissionExperience(model, gameTables));
        module.value[0] = serializedBinary(codec.pack('pb_mission', current));
        const modules = new Map(model.state.modules.value);
        modules.set(MISSION_MODULE, module);
        model.state.modules.value = [...modules];
      }
      const value = missionValue(current, pending.mission, pending.result, res);
      return { value, stm: { result: pending.result, stm_data: codec.pack('mission_to_client', value), exception: false }, previousMissionId: previous };
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
    const reportBattleResult = reportBattle(codec, store.read(), mission, request);
    const { simulation, ...battle } = reportBattleResult;
    const fightTid = Number(request.fight_tid ?? 0) || Number(missionBattleConfig(mission.missionId)?.mission.fight ?? 0);
    const report = {
      id: String(++fightIds),
      tid: String(fightTid),
      type: REPORT_TYPE_CLIENT,
      atk_role_id: String(store.read().state.roleId),
      def_role_id: '0',
      battle_list: [battle],
      time: String(Math.floor(Date.now() / 1000)),
      final_result: simulation.result,
      finish: true,
      req: request.req,
      team_count: 101
    };
    pending = { stm: null, report, mission, result: simulation.result, committed: false };
    // Mission fights deliver their stm with fight_start and the client confirms
    // the victory result without sending a follow-up 207/202. Commit the
    // deterministic result here so the mission module advances on return.
    const committed = commitSettlement();
    const stm = committed.stm;
    pending.stm = stm;
    pending.committed = true;
    lastReport = report;
    lastSettlement = { value: { stm }, data: codec.pack('pb_fight_settlement_response', { stm }) };
    const config = missionBattleConfig(mission.missionId);
    log({ event: 'mission_fight_started', missionId: mission.missionId, fightTid, reportType: report.type, previousMissionId: committed.previousMissionId, settleType: request.stm_type, isAssistant: mission.isAssistant, bossTid: mission.bossTid, enemyFallback: config?.fallback ?? null, attackerCount: battle.atk_brief_lineup.team_list[0].fighter_list.length, defenderCount: battle.def_brief_lineup.team_list[0].fighter_list.length, actionCount: battle.action_list.length, rounds: simulation.overRound, result: simulation.result, pendingRevives: simulation.pendingRevives, committed: true });
    return { value: { stm, mission: codec.unpack('mission_to_client', Buffer.from(stm.stm_data, 'base64')) }, data: codec.pack('pb_fight_response', { report, rsp: {}, stm }) };
  }

  function settlement() {
    if (!pending && lastSettlement) return lastSettlement;
    if (!pending) throw new GameError(1, 'No pending fight settlement');
    if (pending.committed) return lastSettlement;
    const committed = commitSettlement(), missionId = pending.mission.missionId, previousMissionId = committed.previousMissionId;
    pending.stm = committed.stm;
    pending.committed = true;
    lastSettlement = { value: { stm: committed.stm }, data: codec.pack('pb_fight_settlement_response', { stm: committed.stm }) };
    log({ event: 'mission_fight_committed', missionId, previousMissionId });
    return lastSettlement;
  }

  function exit(bytes) {
    let isForce = false;
    try { isForce = Boolean(codec.unpack('pb_fight_exit', bytes).is_force); } catch {}
    if (pending && !pending.committed && pending.result === RESULT_WIN && !isForce) {
      // Ordinary missions deliver stm in the fight_start response. The real
      // client confirms the result with fight_exit (202), not settlement (207),
      // so commit here after a completed victory before dropping pending.
      settlement();
      log({ event: 'mission_fight_committed_on_exit', missionId: pending.mission.missionId });
    } else if (pending) {
      log({ event: 'mission_fight_exited', missionId: pending.mission.missionId, isForce, result: pending.result });
    }
    pending = null;
    if (isForce) lastSettlement = null;
    return { value: {}, data: Buffer.alloc(0) };
  }

  async function claimBoxAwards(bytes) {
    const decoded = await decodeEtf(bytes);
    const value = decoded?.value ?? decoded;
    if (!Array.isArray(value) || value.length === 0 || value.length > 2048) throw new GameError(1, 'Invalid mission box request');
    const boxTids = value.map(Number);
    if (boxTids.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(boxTids).size !== boxTids.length) {
      throw new GameError(1, 'Invalid mission box id');
    }

    const state = store.state();
    const modules = new Map(state.modules.value);
    const module = modules.get(MISSION_MODULE);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Mission login module is missing');
    const current = codec.unpack('pb_mission', rawBinary(module.value[0]));
    const currentSection = missionTables.sections.get(Number(current.mission_id));
    if (!currentSection) throw new GameError(5, 'Current mission configuration is missing');
    const currentChapter = Number(currentSection.belong_chapter);
    const boxes = boxTids.map(id => {
      const box = missionTables.boxes.get(id);
      if (!box) throw new GameError(1, 'Mission box configuration is missing');
      return box;
    });
    const chapterPasses = chapter => {
      if (chapter > currentChapter) return 0;
      const rows = [...missionTables.sections.values()].filter(section => Number(section.belong_chapter) === chapter);
      if (chapter < currentChapter) return rows.length;
      return rows.filter(section => Number(section.index) <= Number(currentSection.index)).length;
    };
    for (const box of boxes) {
      if (chapterPasses(Number(box.belong_chapter)) < Number(box.need_pass)) throw new GameError(5, 'Mission box is not unlocked');
    }

    const bits = await decodeBitBlock(Buffer.from(current.box_award ?? '', 'base64'));
    if (boxes.some(box => hasBit(bits, Number(box.tid)))) throw new GameError(310, 'Mission box reward already claimed');
    const requiredBytes = Math.floor(Math.max(...boxes.map(box => Number(box.tid))) / 8) + 1;
    const nextBits = Buffer.alloc(Math.max(bits.length, requiredBytes));
    bits.copy(nextBits);
    for (const box of boxes) setBit(nextBits, Number(box.tid));
    const nextMission = { ...current, box_award: (await encodeBitBlock(nextBits)).toString('base64') };
    const moduleBytes = serializedBinary(codec.pack('pb_mission', nextMission));
    const expectedModule = JSON.stringify(module);
    const awards = boxes.flatMap(configuredBoxAwards);

    return store.transaction((model, db) => {
      const fresh = new Map(model.state.modules.value);
      if (JSON.stringify(fresh.get(MISSION_MODULE)) !== expectedModule) throw new GameError(1, 'Mission data changed; retry box claim');
      for (const id of boxTids) {
        if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'mission_box', String(id))) {
          throw new GameError(310, 'Mission box reward already claimed');
        }
      }
      for (const id of boxTids) {
        db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'mission_box', String(id), new Date(now()).toISOString());
      }
      const reward = grantResources(model, awards, gameTables);
      const updated = new Map(model.state.modules.value);
      updated.set(MISSION_MODULE, { ...module, value: [moduleBytes] });
      model.state.modules.value = [...updated];
      const res = { changes: reward.changes, is_overflow: false };
      const result = { mission: nextMission, res_change: res };
      return { value: result, data: codec.pack('pb_mission_rsp', result) };
    });
  }

  // MissionSweepMgr sends mission_sweep_passed and feeds response.changes to
  // ResMgr.Parse while rendering one sweep_award group per repeated clear.
  function sweepPassed(bytes) {
    const request = codec.unpack('pb_mission_sweep_passed_req', bytes);
    const tid = Number(request.tid), times = Number(request.times);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid mission sweep id');
    if (!Number.isSafeInteger(times) || times <= 0 || times > CURRENT_CLIENT_MAX_SWEEP_TIMES) throw new GameError(1, 'Invalid mission sweep count');
    const sweep = missionTables.sweeps.get(tid);
    if (!sweep) throw new GameError(5, 'Mission sweep configuration missing');
    const awards = configuredSweepAwards(sweep);
    const sections = missionTables.sections;
    const sectionPosition = missionPosition(sections, tid);
    if (sectionPosition < 0) throw new GameError(5, 'Mission sweep node configuration missing');
    const costConfig = missionTables.sweepConst.get(1);
    const costItem = Number(costConfig?.cost_item), costNum = Number(costConfig?.cost_num);
    if (!Number.isSafeInteger(costItem) || costItem <= 0 || !Number.isSafeInteger(costNum) || costNum <= 0) {
      throw new GameError(5, 'Mission sweep cost configuration is invalid');
    }
    const totalCost = costNum * times;
    if (!Number.isSafeInteger(totalCost)) throw new GameError(1, 'Mission sweep count is too large');
    const totalAwards = awards.map(([id, count]) => [id, count * times]);

    return store.transaction((model, db) => {
      const { value: current } = currentMission(model);
      const currentPosition = missionPosition(sections, Number(current.mission_id));
      if (currentPosition < 0 || sectionPosition >= currentPosition) throw new GameError(5, 'Mission sweep node is not cleared');
      const spent = consumeResources(model, [[costItem, totalCost]]);
      const reward = grantResources(model, totalAwards, gameTables);
      const value = {
        changes: { changes: combinedChanges(spent.changes, reward.changes), is_overflow: false },
        sweep_award: Array.from({ length: times }, () => ({
          award: awards.map(([id, count]) => ({ tid: String(id), num: String(count) }))
        }))
      };
      return { value, data: codec.pack('pb_mission_sweep_passed_rsp', value) };
    });
  }

  // MissionUIMgr opens CatoonListForm for section rows with story > 0. Its
  // continue callback calls MissionMgr.ReqStoryAward(sectionTid), which sends
  // ETF [sectionTid] as type 508 req_mission_custom. The response is the same
  // pb_mission_rsp shape as a normal mission pass: the client's ParseData then
  // moves MissionMgr.sectionTid forward and fires MissionMgr.PASS_MISSION.
  function passStory(sectionTid) {
    const id = Number(sectionTid);
    if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, 'Invalid story mission id');
    const sections = missionTables.sections;
    const section = sections.get(id);
    if (!section) throw new GameError(5, 'Story mission configuration missing');
    if (!(Number(section.story) > 0)) throw new GameError(5, 'Mission is not a story mission');
    return store.transaction((model, db) => {
      const { module, value: current } = currentMission(model);
      const previous = Number(current.mission_id ?? 0);
      const previousIndex = missionPosition(sections, previous), requestedIndex = missionPosition(sections, id);
      if (previous > 0 && requestedIndex > previousIndex + 1) throw new GameError(5, 'Story mission is not unlocked');
      let res = { changes: [], is_overflow: false };
      if (requestedIndex >= previousIndex) {
        current.mission_id = String(nextMissionId(sections, id));
        res = firstClearReward(model, db, section, gameTables, now);
      }
      module.value[0] = serializedBinary(codec.pack('pb_mission', current));
      const modules = new Map(model.state.modules.value);
      modules.set(MISSION_MODULE, module);
      model.state.modules.value = [...modules];
      return {
        value: { mission: current, previousMissionId: previous, requestedSectionTid: id },
        data: codec.pack('pb_mission_rsp', {
          mission: { mission_id: String(current.mission_id ?? 0), pass_count: current.pass_count },
          res_change: res
        })
      };
    });
  }

  function reports(ids) {
    const wanted = new Set((ids || []).map(String));
    const list = lastReport && (!wanted.size || wanted.has(lastReport.id)) ? [lastReport] : [];
    return { value: { report: list }, data: codec.pack('pb_fight_report_res', { report: list }) };
  }

  return {
    supports: type => [201, 202, 203, 204, 207, 213, 503, 506].includes(type),
    passStory,
    execute(type, bytes) {
      if (type === 506) return claimBoxAwards(bytes);
      if (type === 503) return sweepPassed(bytes);
      if (type === 201) return start(bytes);
      if (type === 202) return exit(bytes);
      if (type === 207) return settlement();
      return reports(codec.unpack('pb_get_fight_report', bytes).fight_id);
    }
  };
}
