import { ATTR_SCALE, calcAttrPower, calcAttrValues } from './attribute-service.mjs';

const valueFromTable = (rows, tid) => rows instanceof Map ? rows.get(Number(tid)) : rows?.[tid];

function listedValue(attrList, attrId) {
  for (const pair of Array.isArray(attrList) ? attrList : []) {
    if (!Array.isArray(pair) || Number(pair[0]) !== Number(attrId)) continue;
    const value = Number(pair[1] ?? ATTR_SCALE);
    return Number.isFinite(value) ? value : ATTR_SCALE;
  }
  return ATTR_SCALE;
}

function mergeAttrList(target, attrList) {
  for (const pair of Array.isArray(attrList) ? attrList : []) {
    if (!Array.isArray(pair) || !Number.isFinite(Number(pair[0])) || !Number.isFinite(Number(pair[1]))) continue;
    const attrId = Number(pair[0]);
    target.set(attrId, (target.get(attrId) ?? 0) + Number(pair[1]));
  }
}

function buildNpcBaseValues({ npcTid, npcAttr, ratios, ratioContext, fixedContext, abilityValues }) {
  const result = new Map();
  const fighterRatio = valueFromTable(ratios, npcTid)?.attr_list;
  const contextRatio = Array.isArray(ratioContext) ? ratioContext : ratioContext?.attr_list;
  for (const pair of Array.isArray(npcAttr?.attr_list) ? npcAttr.attr_list : []) {
    if (!Array.isArray(pair) || !Number.isFinite(Number(pair[0])) || !Number.isFinite(Number(pair[1]))) continue;
    const attrId = Number(pair[0]);
    const fighterScale = listedValue(fighterRatio, attrId) / ATTR_SCALE;
    const contextScale = listedValue(contextRatio, attrId) / ATTR_SCALE;
    const fixed = listedValue(fixedContext, attrId) / ATTR_SCALE;
    const value = Math.floor(Number(pair[1]) * fighterScale * contextScale * fixed);
    result.set(attrId, (result.get(attrId) ?? 0) + value);
  }
  mergeAttrList(result, abilityValues);
  return result;
}

// Mirrors the shipped FightMgr -> FightTable.Team -> NpcAttr.CalcAttr ->
// AttrCalculator.CalcValues chain. The resolver never substitutes a nearby
// team, player level, or NpcAttr row: every missing link is returned as a
// fail-closed reason for the caller.
export function resolveFightTeam({
  fight,
  teams,
  npcAttrs,
  ratios = new Map(),
  npcTable = new Map(),
  ratioContext = [],
  fixedContext = [],
  abilityValues = new Map(),
  attributeTables
}) {
  const teamIds = Array.isArray(fight?.def_team) ? fight.def_team.map(Number) : [];
  if (!teamIds.length) return { resolved: false, reason: 'fight-def-team-missing', fightTid: Number(fight?.tid ?? 0), teams: [] };
  if (!attributeTables) throw new TypeError('attributeTables is required');

  const resolvedTeams = [];
  for (const teamTid of teamIds) {
    const team = valueFromTable(teams, teamTid);
    if (!team) return { resolved: false, reason: 'fight-team-missing', fightTid: Number(fight?.tid ?? 0), teamTid, teams: [] };
    const npcTids = Array.isArray(team.npc) ? team.npc.map(Number) : [];
    const locations = Array.isArray(team.loc) ? team.loc.map(Number) : [];
    if (!npcTids.length || npcTids.length !== locations.length) {
      return { resolved: false, reason: 'team-fighter-layout-invalid', fightTid: Number(fight?.tid ?? 0), teamTid, teams: [] };
    }
    const attrTid = Number(team.team_lv);
    const npcAttr = valueFromTable(npcAttrs, attrTid);
    if (!Number.isSafeInteger(attrTid) || attrTid <= 0 || !npcAttr) {
      return { resolved: false, reason: 'team-npcattr-missing', fightTid: Number(fight?.tid ?? 0), teamTid, attrTid, teams: [] };
    }

    const entries = npcTids.map((npcTid, index) => {
      const npc = valueFromTable(npcTable, npcTid);
      const baseValues = buildNpcBaseValues({
        npcTid, npcAttr, ratios, ratioContext, fixedContext,
        abilityValues: abilityValues instanceof Map ? abilityValues.get(npcTid) : abilityValues?.[npcTid]
      });
      const values = calcAttrValues(baseValues, attributeTables);
      return {
        npcTid,
        role: Number(npc?.relation_hero ?? npcTid),
        loc: locations[index],
        level: 1,
        skillLv: Number(npcAttr.skill_lv ?? 0),
        attrTid,
        baseValues,
        values,
        tablePower: Number(npcAttr.power ?? 0),
        calculatedPower: calcAttrPower(values, attributeTables),
        source: 'Fight->Team->NpcAttr->CalcValues'
      };
    });
    resolvedTeams.push({ teamTid, attrTid, entries });
  }
  return { resolved: true, fightTid: Number(fight?.tid ?? 0), reason: null, teams: resolvedTeams };
}
