import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { assembleHeroAttributes } from '../game/attribute-service.mjs';
import { simulateBattle } from '../game/battle-engine.mjs';
import { rosterFor, simulatePvpBattle } from '../game/pvp-battle.mjs';
import { reportBattle } from '../game/mission-fight-service.mjs';

const codec = createGameCodec(), heroTables = readHeroTables(), attributeTables = readAttributeTables();
const modelFor = (tid = 4030801) => ({
  state: { roleId: 1, modules: { value: [] } }, role: { level: 1 },
  heroInfo: { hero_list: [{ uid: '1', tid, level: 1, star: 0, star_progress: 0, breakthrough_level: 0 }] },
  playLineups: [{ type: 1, team_list: [{ team_id: 1, fighter_list: [{ hero_id: '1', loc: 1 }] }] }]
});
const fighter = (id, changes = {}) => ({
  id, role: 0, loc: 1, maxHp: 1000000, attack: 1000,
  defense: 0, speed: id === 101 ? 120 : 80, skills: [], initialEnergy: 0, ...changes
});
const harms = battle => battle.events.filter(e => e.kind === 'damage')
  .flatMap(e => e.harms).filter(h => h.srcId === 101);

test('an explicit zero base crit rate cannot be raised by a fallback profession profile', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const result = simulateBattle({ attackers: [fighter(101, { critChance: 0, profession: 3 })],
      defenders: [fighter(201)], seed, maxRounds: 1 });
    assert.ok(harms(result).every(h => !h.critical), `unexpected critical at seed ${seed}`);
  }
});

test('100 percent base crit and base crit multiplier survive normalization', () => {
  const run = critMultiplier => simulateBattle({
    attackers: [fighter(101, { critChance: 1, critMultiplier })], defenders: [fighter(201)],
    seed: 17, maxRounds: 1
  });
  const normal = harms(run(1)), doubled = harms(run(2));
  assert.ok(normal.length && normal.every(h => h.critical));
  assert.ok(doubled.every(h => h.critical));
  assert.ok(Math.abs(doubled[0].value - 2 * normal[0].value) <= 1);
});

test('mission battle passes configured base crit chance and crit damage into simulation', () => {
  const tid = 4030801;
  const rows = new Map(attributeTables.BaseAttrNew);
  rows.set(tid * 100 + 50, { ...rows.get(tid * 100 + 50), crit: 10000, crit_harm: 20000 });
  const result = reportBattle(codec, modelFor(), { missionId: 10201 }, {}, { ...attributeTables, BaseAttrNew: rows });
  assert.ok(harms(result.simulation).length);
  assert.ok(harms(result.simulation).every(h => h.critical));
});

test('PvP uses the complete assembled power rather than dropping secondary bonuses', () => {
  const roster = rosterFor({ model: modelFor(), heroTables, attributeTables });
  const result = simulatePvpBattle({ codec, attacker: roster, defender: roster, seedText: 'numeric-power' });
  assert.equal(result.atkPower, roster.totalPower);
  assert.equal(result.defPower, roster.totalPower);
  assert.equal(result.battle.atk_power, String(roster.totalPower));
});

test('PvP preserves camp for the real camp-conditional Vell energy effect', () => {
  const model = modelFor();
  const roster = rosterFor({ model, heroTables, attributeTables });
  // Give Vell the same unlocked production ultimate in both runs. Only the
  // target camp differs, so its description-backed camp multiplier must differ.
  const hero = { ...model.heroInfo.hero_list[0], star: 5 };
  const makeRoster = camp => ({ ...roster, entries: [
    { ...roster.entries[0], hero, camp, stats: { ...roster.entries[0].stats, hp: 1000000, attack: 1 } }
  ] });
  const targetCamp = heroTables.Hero.get(4030801).camp;
  const run = camp => simulatePvpBattle({ codec, attacker: makeRoster(camp), defender: makeRoster(0), seedText: 'numeric-camp' });
  const boosted = run(targetCamp), ordinary = run(0);
  assert.notDeepEqual(boosted.simulation, ordinary.simulation,
    'Vell camp-sensitive energy gain must affect the simulation');
});
