import test from 'node:test';
import assert from 'node:assert/strict';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { ACTOR_ATTR } from '../game/attribute-service.mjs';
import { resolveFightTeam } from '../game/fight-team-resolver.mjs';

const attributeTables = readAttributeTables();

test('Fight403 fail-closes because its shipped def_team is empty', () => {
  const result = resolveFightTeam({
    fight: { tid: 403, type: 1, scene: 9, lineup: 76, def_team: null },
    teams: new Map(), npcAttrs: attributeTables.NpcAttr,
    ratios: attributeTables.NpcAttrRatio, attributeTables
  });
  assert.deepEqual(result, { resolved: false, reason: 'fight-def-team-missing', fightTid: 403, teams: [] });
});

test('complete Fight -> Team -> NpcAttr chain selects exact rows and scales attributes', () => {
  const result = resolveFightTeam({
    fight: { tid: 9001, def_team: [10] },
    teams: new Map([[10, { tid: 10, team_lv: 7, npc: [1010100, 1020300], loc: [1, 4] }]]),
    npcAttrs: new Map([[7, {
      tid: 7, skill_lv: 5001, power: 4321,
      attr_list: [
        [ACTOR_ATTR.HP, 1000], [ACTOR_ATTR.LIFE_PERCENT, 5000],
        [ACTOR_ATTR.ATTACK, 100], [ACTOR_ATTR.ATTACK_PERCENT, 2000],
        [ACTOR_ATTR.PHYSICAL_DEFENSE, 40], [ACTOR_ATTR.MAGIC_DEFENSE, 60],
        [ACTOR_ATTR.CRIT, 500], [ACTOR_ATTR.CRIT_HARM, 15000]
      ]
    }]]),
    ratios: new Map([[1010100, { attr_list: [[ACTOR_ATTR.HP, 12000], [ACTOR_ATTR.ATTACK, 9000]] }]]),
    npcTable: new Map([
      [1010100, { tid: 1010100, relation_hero: 1010101 }],
      [1020300, { tid: 1020300, relation_hero: 1020301 }]
    ]),
    ratioContext: [[ACTOR_ATTR.HP, 5000]],
    fixedContext: [[ACTOR_ATTR.ATTACK, 20000]],
    attributeTables
  });

  assert.equal(result.resolved, true);
  assert.equal(result.teams.length, 1);
  assert.deepEqual(result.teams[0].entries.map(entry => ({
    npcTid: entry.npcTid, role: entry.role, loc: entry.loc, attrTid: entry.attrTid
  })), [
    { npcTid: 1010100, role: 1010101, loc: 1, attrTid: 7 },
    { npcTid: 1020300, role: 1020301, loc: 4, attrTid: 7 }
  ]);
  assert.equal(result.teams[0].entries[0].values.get(ACTOR_ATTR.HP), 900);
  assert.equal(result.teams[0].entries[0].values.get(ACTOR_ATTR.ATTACK), 216);
  assert.equal(result.teams[0].entries[1].values.get(ACTOR_ATTR.HP), 750);
  assert.equal(result.teams[0].entries[1].values.get(ACTOR_ATTR.ATTACK), 240);
  assert.equal(result.teams[0].entries[0].skillLv, 5001);
  assert.equal(result.teams[0].entries[0].tablePower, 4321);
  assert.ok(result.teams[0].entries[0].calculatedPower > 0);
});

test('resolver rejects a missing Team or NpcAttr row instead of choosing a neighbour', () => {
  const missingTeam = resolveFightTeam({
    fight: { tid: 9002, def_team: [11] }, teams: new Map(),
    npcAttrs: attributeTables.NpcAttr, attributeTables
  });
  assert.equal(missingTeam.reason, 'fight-team-missing');
  const missingAttr = resolveFightTeam({
    fight: { tid: 9003, def_team: [12] },
    teams: new Map([[12, { tid: 12, team_lv: 999999, npc: [1010100], loc: [1] }]]),
    npcAttrs: attributeTables.NpcAttr, attributeTables
  });
  assert.equal(missingAttr.reason, 'team-npcattr-missing');
});
