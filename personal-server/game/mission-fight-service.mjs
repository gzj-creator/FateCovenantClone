import { decodeEtf, encodeEtfIntegerTuple, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { missionBattleConfig, readMissionTables } from '../config/mission-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { BATTLE_RESULT, FIGHT_ATTR, FIGHT_ENERGY_MAX, FIGHT_INITIAL_ENERGY, simulateBattle } from './battle-engine.mjs';
import { applyNpcScaling, assembleHeroAttributes, npcAttributeScale, powerFromStats } from './attribute-service.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { decodeBitBlock, encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { missionPosition } from './mission-progress.mjs';
import { energyMaxForRole, refreshEnergyResources } from './energy.mjs';
import { buildHeroSkillLoadout } from './hero-skill-loadout.mjs';
import { FAT_ACTION, PROMPT } from './effects/report-codes.mjs';

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
const PROMPT_NORMAL_HARM = PROMPT.HARM_NORMAL;
const PROMPT_HEAL = PROMPT.HEAL;
// pb_generic.proto ids come from the shipped client ProtobufKey table; see
// game/effects/report-codes.mjs for the full evidence record.
const ACTION_ACTION_BEFORE = FAT_ACTION.ACTION_BEFORE;
const ACTION_ACTION_AFTER = FAT_ACTION.ACTION_AFTER;
const ACTION_BUFF_CHANGE = FAT_ACTION.BUFF_CHANGE;
const ACTION_BATTLE_OVER = FAT_ACTION.BATTLE_OVER;
const ACTION_FIGHTER_DIE = FAT_ACTION.FIGHTER_DIE;
const ACTION_FIGHT_HARM = FAT_ACTION.HARM;
const ACTION_ROUND_READY = FAT_ACTION.ROUND_READY;
const ACTION_SHIELD = FAT_ACTION.SHIELD;
const ACTION_ROUND_OVER = FAT_ACTION.ROUND_OVER;
const ACTION_FIGHTER_RELIVE = FAT_ACTION.FIGHTER_RELIVE;
const ACTION_FAT_ATTR_SYNC = FAT_ACTION.ATTR_SYNC;
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

// Exported for the report-layer tests: the event -> pb_generic projection is
// the only place action codes and harm prompt ids reach the client.
export function actionList(codec, simulation) {
  const events = [];
  for (const event of simulation.events) {
    if (event.kind === 'round-start') {
      events.push(action(codec, ACTION_ROUND_READY, 'pb_fat_round_ready', { round: event.round }));
    } else if (event.kind === 'action-start' || event.kind === 'passive-action-start') {
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
    } else if (event.kind === 'heal' && Number(event.actualHeal ?? event.value) > 0) {
      // TID_PROMPT_HEAL (107): FightTable.Prompt[107] is a positive-number
      // prompt, which is exactly the client's IFightHarm.IsRecover test.
      events.push(action(codec, ACTION_FIGHT_HARM, 'pb_fat_harm', {
        id: event.id,
        harm_list: [{
          aim_id: event.aimId,
          src_id: event.srcId,
          type: PROMPT_HEAL,
          is_ab_aim: true,
          value: event.actualHeal ?? event.value,
          old_hp: event.oldHp,
          hp: event.hp ?? event.newHp,
          old_shield: event.oldShield ?? 0,
          shield: event.shield ?? 0
        }]
      }));
    } else if (event.kind === 'shield') {
      events.push(action(codec, ACTION_SHIELD, 'pb_fat_shield', {
        id: event.id,
        aim_id: event.aimId,
        shield: event.shield
      }));
    } else if (event.kind === 'proprietary-shield-destroyed') {
      // A proportional shield removal changes the same client-visible shield
      // value as an ordinary pb_fat_shield event. The client schema has no
      // separate destroy-shield packet, so the post-removal total is encoded.
      events.push(action(codec, ACTION_SHIELD, 'pb_fat_shield', {
        id: event.id ?? 0,
        aim_id: event.aimId,
        shield: event.shield
      }));
    } else if (event.kind === 'effect' && event.type === 'heal'
      && Number(event.actualHeal ?? event.value) > 0) {
      // Proprietary domain/passive handlers write the same recover shape as the
      // generic executor; this branch keeps those heals replayable too.
      events.push(action(codec, ACTION_FIGHT_HARM, 'pb_fat_harm', {
        id: event.id ?? 0,
        harm_list: [{
          aim_id: event.target,
          src_id: event.actor,
          type: PROMPT_HEAL,
          is_ab_aim: true,
          value: event.actualHeal ?? event.value,
          old_hp: event.oldHp,
          hp: event.newHp,
          old_shield: event.oldShield ?? 0,
          shield: event.shield ?? 0
        }]
      }));
    } else if (event.kind === 'buff-change') {
      // pb_fat_buff_change (103). sign is the add/remove flag: false -> AddBuff,
      // true -> RemoveBuff(change_reason), per BuffChangeStep._OnStart.
      events.push(action(codec, ACTION_BUFF_CHANGE, 'pb_fat_buff_change', {
        id: event.id,
        buff_list: event.buffs.map(buff => ({
          aim_id: buff.aimId,
          tid: buff.tid,
          ab_tid: buff.abilityId ?? 0,
          overlay: buff.overlay ?? 0,
          sign: Boolean(buff.sign),
          caster_id: buff.casterId ?? 0,
          change_reason: buff.changeReason ?? 0
        }))
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
    } else if (event.kind === 'action-end' || event.kind === 'passive-action-end') {
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

// The battle engine resolves one physical damage channel. Physical and magic
// defense are both assembled from configuration; their mean is the documented
// compatibility collapse until the engine splits damage types (CORE-BATTLE).
function defenseChannel(stats) {
  return Math.max(0, Math.round((Number(stats.physicalDefense ?? 0) + Number(stats.magicDefense ?? 0)) / 2));
}

// NPC base rows are unavailable, so the compatible enemy template is derived
// from the complete player lineup. Averaging each channel prevents one
// high-HP tank from setting every enemy's attack, defense and speed.
export function lineupReferenceStats(attackers) {
  const count = Math.max(1, attackers.length);
  const average = key => Math.max(0, Math.round(
    attackers.reduce((sum, unit) => sum + Number(unit[key] ?? 0), 0) / count
  ));
  return {
    maxHp: Math.max(1, average('max_hp')),
    attack: Math.max(1, average('attack')),
    defense: average('defense'),
    speed: Math.max(1, average('speed'))
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

// Exported so other fight entry points (elite missions) can reuse the same
// fighter assembly and action-stream generation. 'encounter' replaces the
// journey section lookup with an authoritative fight config:
// { mission: { fight }, enemies: [npc tids], tables: hero tables }.
export function reportBattle(codec, model, mission, request, attributeTables, encounter = null) {
  const config = encounter ?? missionBattleConfig(mission.missionId);
  if (!config) throw new GameError(5, 'Mission enemy configuration missing');
  const selected = requestedMembers(model, request);
  if (!selected.members.length || selected.members.length > 6) throw new GameError(5, 'Journey lineup size is invalid');
  if (selected.members.some(entry => !Number.isSafeInteger(entry.loc) || entry.loc < 1 || entry.loc > 7)) {
    throw new GameError(5, 'Journey lineup location is invalid');
  }
  const seenLocations = new Set();
  const seenHeroes = new Set();
  const attackers = selected.members.map((entry, index) => {
    if (seenLocations.has(entry.loc)) throw new GameError(5, 'Journey lineup location is duplicated');
    if (seenHeroes.has(entry.heroId)) throw new GameError(5, 'Journey lineup hero is duplicated');
    seenLocations.add(entry.loc);
    seenHeroes.add(entry.heroId);
    const hero = model.heroInfo.hero_list.find(value => String(value.uid) === entry.heroId);
    if (!hero) throw new GameError(5, 'Journey lineup hero is missing');
    const role = Number(hero.tid), cfg = unitConfig(config.tables, role, 1);
    const assembled = assembleHeroAttributes({ hero, heroTables: config.tables.heroes, attributeTables });
    const level = assembled.level, quality = assembled.quality, maxHp = assembled.stats.hp;
    const combat = {
      profession: assembled.profession,
      attack: assembled.stats.attack,
      defense: defenseChannel(assembled.stats),
      speed: assembled.stats.speed,
      initialEnergy: FIGHT_INITIAL_ENERGY
    };
    const skillLoadout = buildHeroSkillLoadout({ hero, heroTables: config.tables.heroes });
    const abilities = skillLoadout.abilityIds.length
      ? skillLoadout.abilityIds
      : cfg.abilities.slice(0, 8).map(Number);
    return {
      id: 101 + index, tid: role, role_type: FIGHTER_ROLE_HERO, uid: String(hero.uid), role,
      team: 1, team_index: selected.teamIndex, camp: assembled.camp, loc: entry.loc,
      star: assembled.star, level, quality, hp: maxHp, max_hp: maxHp,
      enable: true, final_hp: maxHp, style: Number(cfg.hero.style ?? role),
      ability_list: abilities, init_attr: initialFightAttributes(combat.initialEnergy), water_gun: 0,
      profession: combat.profession, attack: combat.attack, defense: combat.defense,
      speed: combat.speed, initialEnergy: combat.initialEnergy, abilityId: abilities[0] ?? 1,
      activeAbilityId: activeAbilityId(abilities),
      skills: skillLoadout.skills,
      power: assembled.power
    };
  });
  const attackerLevel = Math.max(...attackers.map(unit => unit.level));
  // The NpcAttr table and Fight -> Team -> NpcAttr resolver are recovered, but
  // Mission Fight 403 ships def_team=null (and its referenced Team row is also
  // absent). Without that authoritative selector, ordinary Mission NPCs keep a
  // balanced whole-lineup compatibility baseline, then apply the shipped
  // NpcAttrRatio / NpcFightCustom.elite_scale values.
  const reference = lineupReferenceStats(attackers);
  const defenders = config.enemies.map((role, index) => {
    const cfg = unitConfig(config.tables, role, 2);
    const level = Math.max(1, attackerLevel), quality = Number(cfg.hero.quality ?? 1);
    const fallback = {
      hp: Math.max(1, Math.round(reference.maxHp * 0.88)),
      attack: Math.max(1, Math.round(reference.attack * 0.88)),
      physicalDefense: Math.max(0, Math.round(reference.defense * 0.88)),
      magicDefense: Math.max(0, Math.round(reference.defense * 0.88)),
      critRate: 0,
      critHarm: 0,
      speed: reference.speed
    };
    const stats = applyNpcScaling(fallback, npcAttributeScale(attributeTables, role, { elite: Boolean(cfg.hero.is_elite || cfg.npc?.is_elite) }));
    const combat = {
      profession: Number(cfg.hero.profession ?? 0),
      attack: stats.attack,
      defense: defenseChannel(stats),
      speed: stats.speed,
      initialEnergy: FIGHT_INITIAL_ENERGY
    };
    const maxHpFinal = stats.hp;
    const abilities = cfg.abilities.slice(0, 8).map(Number);
    return {
      id: 201 + index, tid: role, role_type: cfg.npc ? FIGHTER_ROLE_NPC : FIGHTER_ROLE_HERO, uid: '0', role,
      team: 2, team_index: 1, camp: Number(cfg.hero.camp ?? 0), loc: index + 1,
      star: Number(cfg.hero.star ?? 0), level, quality, hp: maxHpFinal, max_hp: maxHpFinal,
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
    camp: unit.camp,
    loc: unit.loc,
    abilityId: unit.abilityId,
    activeAbilityId: unit.activeAbilityId,
    maxHp: unit.max_hp,
    attack: unit.attack,
    defense: unit.defense,
    speed: unit.speed,
    initialEnergy: unit.initialEnergy,
    skills: unit.skills
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
    // Power is the shared attribute-service compatibility rule; the same value
    // is returned by the 1316 attribute query and the rank screen.
    atk_power: String(attackers.reduce((sum, unit) => sum + unit.power, 0)),
    def_power: String(defenders.reduce((sum, unit) => sum + powerFromStats({
      hp: unit.max_hp, attack: unit.attack,
      physicalDefense: unit.defense, magicDefense: unit.defense
    }, attributeTables), 0)),
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
      if (change.new_bin !== undefined) current.new_bin = change.new_bin;
    } else {
      changes.set(tid, {
        tid,
        new_num: String(change.new_num),
        diff_num: String(change.diff_num),
        ...(change.new_bin === undefined ? {} : { new_bin: change.new_bin })
      });
    }
  }
  return [...changes.values()];
}

export function createMissionFightService({ store, codec, gameTables = readGameTables(), missionTables = readMissionTables(), attributeTables = readAttributeTables(), now = Date.now, logger = () => {}, playbackEnabled = false, eliteBattle = null, onSettlementCommitted = null }) {
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

  function staminaRequirement() {
    const stamina = missionTables.sweepConst.get(1);
    const item = Number(stamina?.cost_item), amount = Number(stamina?.cost_num);
    if (!Number.isSafeInteger(item) || item <= 0 || !Number.isSafeInteger(amount) || amount <= 0) {
      throw new GameError(5, 'Mission stamina configuration is invalid');
    }
    return [item, amount];
  }

  function assertStaminaAvailable(model) {
    const refreshed = structuredClone(model);
    refreshEnergyResources(refreshed, { missionTables, now });
    const [item, amount] = staminaRequirement();
    if (BigInt(refreshed.resources.get(String(item))?.num ?? 0) < BigInt(amount)) {
      throw new GameError(301, 'Insufficient resource');
    }
  }

  function consumeStamina(model, item, amount, insufficientCode) {
    refreshEnergyResources(model, { missionTables, now });
    return consumeResources(model, [[item, amount]], insufficientCode, {
      codec,
      now,
      energyMax: tid => energyMaxForRole(missionTables, tid, model.role?.level)
    });
  }

  function commitSettlement() {
    return store.transaction((model, db) => {
      const { module, value: current } = currentMission(model);
      const previous = Number(current.mission_id ?? 0);
      const [staminaItem, staminaCost] = staminaRequirement();
      const spent = consumeStamina(model, staminaItem, staminaCost, 301);
      let res = { changes: spent.changes, is_overflow: false };
      if (pending.result === RESULT_WIN) {
        const completed = pending.mission.missionId;
        const sections = missionTables.sections;
        const previousPosition = missionPosition(sections, previous), completedPosition = missionPosition(sections, completed);
        if (completedPosition >= 0 && (previousPosition < 0 || completedPosition >= previousPosition)) {
          // pb_mission.mission_id is the last cleared node. The client derives
          // the visible next fight from this value and advances it locally.
          if (completedPosition > previousPosition) current.mission_id = String(completed);
          if (!current.pass_count) current.pass_count = { flush_time: 0, count: 0 };
          if (completedPosition > previousPosition) current.pass_count.count = Number(current.pass_count.count ?? 0) + 1;
          const section = missionTables.sections.get(completed);
          const reward = firstClearReward(model, db, section, gameTables, now);
          res = {
            changes: combinedChanges(spent.changes, reward.changes),
            is_overflow: false
          };
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
    // Elite stages and elite bosses share the 201/207 fight entry point. Their
    // own module owns progress, stamina and rewards, so hand the request over
    // before the journey payload is decoded.
    if (eliteBattle && eliteBattle.matches(request)) {
      const elite = eliteBattle.start(request);
      pending = null;
      lastSettlement = null;
      lastReport = elite.report ?? null;
      return { value: elite.value, data: elite.data };
    }
    const mission = missionRequest(request.req);
    if (!mission) throw new GameError(5, 'Only ordinary mission fights are implemented');
    const current = currentMission(store.read()).value;
    const currentPosition = missionPosition(missionTables.sections, Number(current.mission_id ?? 0));
    const requestedPosition = missionPosition(missionTables.sections, mission.missionId);
    if (currentPosition < 0 || requestedPosition < 0) throw new GameError(5, 'Mission progression configuration is missing');
    // A request may replay a cleared node or fight the one immediate successor.
    // The client adds that successor when rendering the current journey entry.
    const isReplay = requestedPosition <= currentPosition;
    const isUnclearedSuccessor = requestedPosition === currentPosition + 1;
    if (!isReplay && !isUnclearedSuccessor) {
      throw new GameError(5, `Mission is not unlocked (current ${current.mission_id}@${currentPosition}, requested ${mission.missionId}@${requestedPosition})`);
    }
    assertStaminaAvailable(store.read());
    const reportBattleResult = reportBattle(codec, store.read(), mission, request, attributeTables);
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
      // FightMgr only requests pb_fight_settlement_request (207) when
      // report.finish is false. The normal journey contract is 201 -> 207;
      // advance the mission and consume stamina only in the 207 transaction.
      finish: false,
      req: request.req,
      team_count: 101
    };
    const previewValue = missionValue(current, mission, simulation.result, { changes: [], is_overflow: false });
    const stm = { result: simulation.result, stm_data: codec.pack('mission_to_client', previewValue), exception: false };
    pending = { stm, report, mission, result: simulation.result, committed: false, fightTid, rounds: simulation.overRound };
    lastReport = report;
    lastSettlement = null;
    const config = missionBattleConfig(mission.missionId);
    log({ event: 'mission_fight_started', missionId: mission.missionId, fightTid, reportType: report.type, previousMissionId: Number(current.mission_id ?? 0), settleType: request.stm_type, isAssistant: mission.isAssistant, bossTid: mission.bossTid, enemyFallback: config?.fallback ?? null, attackerCount: battle.atk_brief_lineup.team_list[0].fighter_list.length, defenderCount: battle.def_brief_lineup.team_list[0].fighter_list.length, actionCount: battle.action_list.length, rounds: simulation.overRound, result: simulation.result, pendingRevives: simulation.pendingRevives, committed: false, reportFinish: report.finish });
    return { value: { stm, mission: previewValue }, data: codec.pack('pb_fight_response', { report, rsp: {}, stm }) };
  }

  function settlement() {
    if (eliteBattle && eliteBattle.hasPending()) return eliteBattle.settlement();
    if (!pending && lastSettlement) return lastSettlement;
    if (!pending) throw new GameError(1, 'No pending fight settlement');
    if (pending.committed) return lastSettlement;
    const committed = commitSettlement(), missionId = pending.mission.missionId, previousMissionId = committed.previousMissionId;
    pending.stm = committed.stm;
    pending.committed = true;
    lastSettlement = { value: { stm: committed.stm }, data: codec.pack('pb_fight_settlement_response', { stm: committed.stm }) };
    // BATTLE-REPORT: a committed journey win is the authoritative pass record
    // that ReportCmd 211 lists. The hook runs in its own transaction so a
    // report-log failure cannot roll back the settlement itself.
    if (pending.result === RESULT_WIN && onSettlementCommitted) {
      try {
        onSettlementCommitted({ missionId: pending.mission.missionId, fightTid: pending.fightTid, rounds: pending.rounds, result: pending.result });
      } catch (error) {
        log({ event: 'mission_settlement_record_failed', missionId: pending.mission.missionId, message: error.message });
      }
    }
    log({ event: 'mission_fight_committed', missionId, previousMissionId });
    return lastSettlement;
  }

  function exit(bytes) {
    let isForce = false;
    try { isForce = Boolean(codec.unpack('pb_fight_exit', bytes).is_force); } catch {}
    if (eliteBattle) eliteBattle.exit();
    if (pending) log({ event: 'mission_fight_exited', missionId: pending.mission.missionId, isForce, result: pending.result, committed: pending.committed });
    // fight_exit acknowledges scene teardown. It must never bypass 207; an
    // uncommitted exit also clears any older settlement replay value.
    if (pending && !pending.committed) lastSettlement = null;
    pending = null;
    if (isForce) lastSettlement = null;
    return { value: {}, data: Buffer.alloc(0) };
  }

  // Box claims are split in two stages so the same logic can be reused inside a
  // larger transaction (509 one-key chapter rewards). prepare() does every read
  // and the async BitBlock encoding outside the transaction; apply() mutates the
  // model and reward_claims rows synchronously and never grants twice.
  async function prepareBoxClaim(rawTids) {
    if (!Array.isArray(rawTids) || rawTids.length === 0 || rawTids.length > 2048) throw new GameError(1, 'Invalid mission box request');
    const boxTids = rawTids.map(Number);
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
      // mission_id is the last cleared section, so that section already counts
      // toward chapter progress.
      return rows.filter(section => Number(section.index) <= Number(currentSection.index)).length;
    };
    const bits = await decodeBitBlock(Buffer.from(current.box_award ?? '', 'base64'));
    const requiredBytes = Math.floor(Math.max(...boxes.map(box => Number(box.tid))) / 8) + 1;
    let nextBits = Buffer.alloc(Math.max(bits.length, requiredBytes));
    bits.copy(nextBits);
    for (const box of boxes) nextBits = setBit(nextBits, Number(box.tid));
    const nextMission = { ...current, box_award: (await encodeBitBlock(nextBits)).toString('base64') };
    const moduleBytes = serializedBinary(codec.pack('pb_mission', nextMission));
    const expectedModule = JSON.stringify(module);
    return { boxes, chapterPasses, bits, nextMission, moduleBytes, expectedModule };
  }

  function applyBoxClaim(model, db, prepared) {
    const { boxes, chapterPasses, bits, nextMission, moduleBytes, expectedModule } = prepared;
    const fresh = new Map(model.state.modules.value);
    if (JSON.stringify(fresh.get(MISSION_MODULE)) !== expectedModule) throw new GameError(1, 'Mission data changed; retry box claim');
    const module = fresh.get(MISSION_MODULE);
    const newlyGranted = [];
    for (const box of boxes) {
      const id = Number(box.tid);
      const moduleClaimed = hasBit(bits, id);
      const recordedClaim = db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'mission_box', String(id));
      // A retry may name boxes that were already claimed under older chapter
      // boundary logic. Keep that retry idempotent; only a box that would
      // actually grant now must satisfy the current unlock threshold.
      if (!moduleClaimed && !recordedClaim && chapterPasses(Number(box.belong_chapter)) < Number(box.need_pass)) {
        throw new GameError(5, 'Mission box is not unlocked');
      }
      if (!moduleClaimed && !recordedClaim) newlyGranted.push(box);
      // A one-key claim can overlap a previous partial claim. Reconcile both
      // stores without granting again, and let an all-claimed retry succeed.
      if (!recordedClaim) db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'mission_box', String(id), new Date(now()).toISOString());
    }
    const awards = newlyGranted.flatMap(configuredBoxAwards);
    const reward = grantResources(model, awards, gameTables);
    const updated = new Map(model.state.modules.value);
    // Preserve the remaining module-8 slots (stamina/energy) that the 207
    // settlement path and mission-extra sync maintain alongside pb_mission.
    const nextModule = { ...module, value: [...module.value] };
    nextModule.value[0] = moduleBytes;
    updated.set(MISSION_MODULE, nextModule);
    model.state.modules.value = [...updated];
    return { mission: nextMission, res_change: { changes: reward.changes, is_overflow: false }, newlyGranted: newlyGranted.map(box => Number(box.tid)) };
  }

  async function claimBoxAwards(bytes) {
    const decoded = await decodeEtf(bytes);
    const value = decoded?.value ?? decoded;
    const prepared = await prepareBoxClaim(Array.isArray(value) ? value : null);
    return store.transaction((model, db) => {
      const claimed = applyBoxClaim(model, db, prepared);
      const result = { mission: claimed.mission, res_change: claimed.res_change };
      return { value: { ...result, newlyGranted: claimed.newlyGranted }, data: codec.pack('pb_mission_rsp', result) };
    });
  }

  // MissionSweepMgr sends mission_sweep_passed and feeds response.changes to
  // ResMgr.Parse while rendering one sweep_award group per repeated clear.
  function sweepPassed(bytes) {
    const request = codec.unpack('pb_mission_sweep_passed_req', bytes);
    const tid = Number(request.tid), times = Number(request.times);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid mission sweep id');
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
    // MissionNewSweepForm derives its batch count from the current stamina
    // balance. EnergyConst caps that balance at 3000, so with the configured
    // five stamina per sweep the client can legitimately request up to 600.
    // The legacy MissionSweepSweepForm separately fixes its one-key button at
    // 10; that UI convenience must not become the server-wide wire limit.
    const energyConfig = missionTables.energyConst.get(costItem);
    const maxEnergy = Number(energyConfig?.max);
    const maxSweepTimes = Math.floor(maxEnergy / costNum);
    if (!Number.isSafeInteger(maxEnergy) || maxEnergy <= 0 || !Number.isSafeInteger(maxSweepTimes) || maxSweepTimes <= 0) {
      throw new GameError(5, 'Mission sweep energy configuration is invalid');
    }
    if (!Number.isSafeInteger(times) || times <= 0 || times > maxSweepTimes) {
      throw new GameError(1, 'Invalid mission sweep count');
    }
    const totalCost = costNum * times;
    if (!Number.isSafeInteger(totalCost)) throw new GameError(1, 'Mission sweep count is too large');
    const totalAwards = awards.map(([id, count]) => [id, count * times]);

    return store.transaction((model, db) => {
      const { value: current } = currentMission(model);
      const currentPosition = missionPosition(sections, Number(current.mission_id));
      if (currentPosition < 0 || sectionPosition > currentPosition) throw new GameError(5, 'Mission sweep node is not cleared');
      const spent = consumeStamina(model, costItem, totalCost, 301);
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
      if (requestedIndex > previousIndex) {
        current.mission_id = String(id);
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
    prepareBoxClaim,
    applyBoxClaim,
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
