import { GameError } from './hero-progression.mjs';
import { assembleLineup, powerFromStats } from './attribute-service.mjs';
import { buildHeroSkillLoadout } from './hero-skill-loadout.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { BATTLE_RESULT, FIGHT_ATTR, FIGHT_ENERGY_MAX, FIGHT_INITIAL_ENERGY, simulateBattle } from './battle-engine.mjs';
import { actionList } from './mission-fight-service.mjs';

// Shared player-versus-player battle seam for the 位面锦标赛 (TournamentCmd) and
// 巅峰竞技 (TopArenaCmd) entry points. Both modules hand the client a normal
// pb_fight_report, so the report shape follows mission-fight-service while both
// sides are assembled from authoritative persisted hero rows instead of the
// NPC scaling path (the journey screen uses that path only because journey
// enemies are configured NPC tids).
//
// The opponent roster is a deployment-supplied input: no client table ships an
// opponent line-up for these modules (FightTable.def_team is null in every
// shipped row), so the services refuse the fight unless a provider can resolve
// a real roster. See each task's implementation.md for that evidence gap.
const FIGHTER_ROLE_HERO = 1;
const FIGHTER_ROLE_CAPTAIN = 3;

function fail(code, message) { throw new GameError(code, message); }

export function battleSeed(text) {
  const source = String(text);
  let seed = 0x811c9dc5;
  for (let index = 0; index < source.length; index++) {
    seed ^= source.charCodeAt(index);
    seed = Math.imul(seed, 0x01000193);
  }
  return seed || 1;
}

// One side of a PvP battle: a role's persisted heroes for a play lineup.
export function rosterFor({ model, lineupType = 1, heroTables = readHeroTables(), attributeTables = readAttributeTables() }) {
  let assembled;
  try {
    assembled = assembleLineup({ model, lineupType, heroTables, attributeTables });
  } catch (error) {
    if (error instanceof GameError) throw error;
    throw new GameError(5, 'PvP lineup could not be assembled');
  }
  if (!assembled.entries.length) fail(5, 'PvP lineup is empty');
  if (assembled.entries.length > 6) fail(5, 'PvP lineup is too large');
  return assembled;
}

function defenseChannel(stats) {
  return Math.max(0, Math.round((Number(stats.physicalDefense ?? 0) + Number(stats.magicDefense ?? 0)) / 2));
}

function activeAbilityId(abilities) {
  const values = abilities.map(Number);
  return values.find(id => String(id).startsWith('2')) ?? values[0] ?? 1;
}

function initialFightAttributes(initialEnergy) {
  return [
    { type: FIGHT_ATTR.ANGER, value: initialEnergy },
    { type: FIGHT_ATTR.MAX_ANGER, value: FIGHT_ENERGY_MAX }
  ];
}

function fightersOf(entries, { team, teamIndex, idBase, heroTables }) {
  return entries.map((entry, index) => {
    const abilities = buildHeroSkillLoadout({ hero: entry.hero, heroTables })?.abilityIds ?? [];
    const maxHp = Math.max(1, Math.round(Number(entry.stats.hp ?? 1)));
    const combat = {
      attack: Math.max(1, Math.round(Number(entry.stats.attack ?? 1))),
      defense: defenseChannel(entry.stats),
      speed: Math.max(0, Math.round(Number(entry.stats.speed ?? 0)))
    };
    return {
      id: idBase + index,
      tid: Number(entry.tid),
      role_type: FIGHTER_ROLE_HERO,
      uid: String(entry.uid ?? entry.hero?.uid ?? '0'),
      role: Number(entry.tid),
      team,
      team_index: teamIndex,
      loc: Math.max(1, Number(entry.loc ?? index + 1)),
      star: Number(entry.star ?? 0),
      level: Number(entry.level ?? 1),
      quality: Number(entry.quality ?? 1),
      hp: maxHp,
      max_hp: maxHp,
      enable: true,
      final_hp: maxHp,
      style: Number(entry.tid),
      ability_list: abilities,
      init_attr: initialFightAttributes(FIGHT_INITIAL_ENERGY),
      water_gun: 0,
      profession: Number(entry.profession ?? 0),
      attack: combat.attack,
      defense: combat.defense,
      speed: combat.speed,
      initialEnergy: FIGHT_INITIAL_ENERGY,
      abilityId: abilities[0] ?? 1,
      activeAbilityId: activeAbilityId(abilities),
      skills: buildHeroSkillLoadout({ hero: entry.hero, heroTables })?.skills ?? []
    };
  });
}

function captainFighter(attackers) {
  const leader = attackers[0];
  return {
    id: 100,
    tid: 0,
    role_type: FIGHTER_ROLE_CAPTAIN,
    uid: '0',
    role: 0,
    team: 1,
    team_index: 1,
    loc: 0,
    star: 0,
    level: Math.max(...attackers.map(unit => unit.level)),
    quality: 1,
    hp: 1,
    max_hp: 1,
    enable: true,
    final_hp: 1,
    style: Number(leader?.style ?? 0),
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
  initialEnergy: unit.initialEnergy,
  skills: unit.skills
});

// Runs one deterministic PvP battle and returns both the simulation and the
// pb_fight_report_battle payload the client replays.
export function simulatePvpBattle({ codec, attacker, defender, seedText, heroTables = readHeroTables() }) {
  if (!attacker?.entries?.length) fail(5, 'PvP attacker lineup is empty');
  if (!defender?.entries?.length) fail(5, 'PvP defender lineup is empty');
  const attackers = fightersOf(attacker.entries, { team: 1, teamIndex: 1, idBase: 101, heroTables });
  const defenders = fightersOf(defender.entries, { team: 2, teamIndex: 1, idBase: 201, heroTables });
  const simulation = simulateBattle({
    attackers: attackers.map(combatUnit),
    defenders: defenders.map(combatUnit),
    seed: battleSeed(seedText)
  });
  const finalHp = new Map([...simulation.attackers, ...simulation.defenders].map(unit => [unit.id, unit.hp]));
  for (const unit of attackers) unit.final_hp = finalHp.get(unit.id) ?? unit.final_hp;
  for (const unit of defenders) unit.final_hp = finalHp.get(unit.id) ?? 0;
  const fighters = [captainFighter(attackers), ...attackers, ...defenders];
  const brief = (team, members) => ({
    team_list: [{
      team_index: team,
      fighter_list: members.map(unit => ({ tid: unit.role, is_mutant: false }))
    }]
  });
  const atkPower = attacker.entries.reduce((sum, entry) => sum + powerFromStats({
    hp: entry.stats.hp, attack: entry.stats.attack,
    physicalDefense: entry.stats.physicalDefense, magicDefense: entry.stats.magicDefense
  }), 0);
  const defPower = defender.entries.reduce((sum, entry) => sum + powerFromStats({
    hp: entry.stats.hp, attack: entry.stats.attack,
    physicalDefense: entry.stats.physicalDefense, magicDefense: entry.stats.magicDefense
  }), 0);
  return {
    simulation,
    won: Number(simulation.result) === Number(BATTLE_RESULT.WIN),
    atkPower,
    defPower,
    battle: {
      atk_team_index: 1,
      def_team_index: 1,
      fighter_list: fighters,
      action_list: actionList(codec, simulation),
      over_reason: simulation.result,
      over_round: simulation.overRound,
      result: simulation.result,
      is_add_battle: false,
      atk_power: String(atkPower),
      def_power: String(defPower),
      atk_brief_lineup: brief(1, attackers),
      def_brief_lineup: brief(1, defenders)
    }
  };
}

// Report wrapper shared by both modules: pb_fight_report with a single battle.
export function buildFightReport({ id, fightTid, reportType, atkRoleId, defRoleId, battle, result, nowSeconds, requestBytes = Buffer.alloc(0) }) {
  return {
    id: String(id),
    tid: String(fightTid ?? 0),
    type: Number(reportType),
    atk_role_id: String(atkRoleId),
    def_role_id: String(defRoleId ?? 0),
    battle_list: [battle],
    time: String(nowSeconds),
    final_result: Number(result),
    finish: true,
    req: requestBytes,
    team_count: 101,
    atk_power: String(battle.atk_power ?? 0),
    def_power: String(battle.def_power ?? 0)
  };
}
