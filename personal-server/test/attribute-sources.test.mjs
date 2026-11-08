import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { readEquipTables } from '../config/equip-tables.mjs';
import { assembleHeroAttributes, buildLineupAttrInfo, FIGHT_ATTR } from '../game/attribute-service.mjs';
import { collectEquipmentSources, ROLE_EQUIP_MODULE } from '../game/hero-attribute-sources.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createGameFixture, fixtureModules } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const equipTables = readEquipTables();

// EquipTable row 10103: type 1, lv_max 10, attrs [[2,3000]],
// per_level_attrs [[2,90]]. Refine 2 / Inscription 3 come from the same table
// family, so the expected contribution is computed from configuration only.
const EQUIP_TID = 10103;
const equipLevel = 5;
const equipRefine = 2;
const equipInscription = 3;

const wornEquip = {
  id: 101,
  tid: EQUIP_TID,
  level: equipLevel,
  level_exp: 0,
  inscription: equipInscription,
  refine: equipRefine,
  refine_exp: 0,
  random_develop_cost: []
};

function modulesWith(equips) {
  const modules = fixtureModules();
  const list = Array.isArray(modules) ? modules : [...(modules.value ?? [])];
  const payload = serializedBinary(codec.pack('pb_role_equip', { equips }));
  const index = list.findIndex(entry => Number(entry[0]) === ROLE_EQUIP_MODULE);
  if (index >= 0) list[index] = [ROLE_EQUIP_MODULE, payload];
  else list.push([ROLE_EQUIP_MODULE, payload]);
  return Array.isArray(modules) ? list : { ...modules, value: list };
}

const attackOf = pairs => Number((pairs.find(pair => Number(pair[0]) === 2) ?? [0, 0])[1]);

const equipAttack = (() => {
  const template = equipTables.Equip.get(EQUIP_TID);
  const refine = equipTables.Refine.get(Number(template.type) * 10000 + equipRefine);
  const inscription = equipTables.Inscription.get(Number(template.type) * 10000 + equipInscription);
  return attackOf(template.attrs)
    + attackOf(template.per_level_attrs) * (equipLevel - 1)
    + attackOf(refine.base_attrs)
    + attackOf(inscription.base_attrs);
})();

test('worn equipment contributes configured template, level, refine and inscription attributes', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-attr-equip-', seed: { modules: modulesWith([wornEquip]) } });
  const model = fixture.store.read();
  const collected = collectEquipmentSources({ model, codec, tables: equipTables });
  assert.deepEqual(collected.notes, []);
  assert.ok(collected.sources.length > 0, 'worn equip produces attribute rows');
  assert.ok(collected.sources.some(source => source.play.endsWith(':base')), 'template attrs are recorded');
  assert.ok(collected.sources.some(source => source.play.endsWith(':level')), 'level growth is recorded');
  assert.ok(collected.sources.some(source => source.play.endsWith(':refine')), 'refine attrs are recorded');
  assert.ok(collected.sources.some(source => source.play.endsWith(':inscription')), 'inscription attrs are recorded');

  const hero = model.heroInfo.hero_list.find(entry => String(entry.uid) === '2020601');
  const bare = assembleHeroAttributes({ hero, heroTables, attributeTables });
  const equipped = assembleHeroAttributes({ hero, heroTables, attributeTables, extraSources: collected.sources });
  const equipFlat = equipped.sources.filter(source => source.play.startsWith('equip:') && source.displayAttr === 2)
    .reduce((sum, source) => sum + source.value, 0);
  assert.equal(equipFlat, equipAttack);
  // Percentage rows from star/break configuration also scale equipment flat
  // attributes, so the final delta is at least the configured flat total.
  assert.ok(equipped.stats.attack - bare.stats.attack >= equipAttack);
  assert.ok(equipped.power > bare.power, 'equipment raises lineup power');
  assert.ok(equipped.sources.some(source => source.play.startsWith('equip:')), 'equipment rows are explainable');

  // The same rows must never be counted twice when a caller collects twice.
  const doubled = assembleHeroAttributes({ hero, heroTables, attributeTables, extraSources: [...collected.sources, ...collected.sources] });
  assert.equal(doubled.stats.attack, equipped.stats.attack);
  assert.ok(doubled.notes.some(note => note.startsWith('duplicate-attribute-source-skipped:')));
});

test('an unreachable or missing equip configuration fails closed', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-attr-equip-missing-' });
  const model = fixture.store.read();
  // The captured test account stores slot ids (1..30) in module 26 that do not
  // resolve through EquipTable. They must not be treated as attributes.
  const collected = collectEquipmentSources({ model, codec, tables: equipTables });
  assert.equal(collected.sources.length, 0);
  assert.ok(collected.notes.some(note => note.startsWith('equip-template-missing:')));

  const hero = model.heroInfo.hero_list.find(entry => String(entry.uid) === '2020601');
  const bare = assembleHeroAttributes({ hero, heroTables, attributeTables });
  const withUnknown = assembleHeroAttributes({ hero, heroTables, attributeTables, extraSources: collected.sources });
  assert.deepEqual(withUnknown.stats, bare.stats);
});

test('mission battle uses the same worn-equipment attributes as the lineup query', t => {
  const request = codec.pack('pb_fight_request', {
    fight_tid: 301,
    stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: 30201 }),
    loc: [{ team_id: 1, loc: [
      { hero_id: '2010101', loc: 6 },
      { hero_id: '2010201', loc: 4 },
      { hero_id: '1020601', loc: 2 },
      { hero_id: '2020601', loc: 5 }
    ] }]
  });

  const run = (prefix, modules) => {
    const fixture = createGameFixture(t, codec, { prefix, seed: { modules } });
    const service = createMissionFightService({ store: fixture.store, codec, playbackEnabled: true });
    const response = codec.unpack('pb_fight_response', service.execute(201, request).data);
    return { fixture, battle: response.report.battle_list[0] };
  };

  const bare = run('fc-attr-battle-bare-', modulesWith([]));
  const equipped = run('fc-attr-battle-equip-', modulesWith([wornEquip]));

  const attacker = (battle, uid) => battle.fighter_list.find(fighter => Number(fighter.role_type) === 1 && String(fighter.uid) === uid);
  const bareHero = bare.fixture.store.read().heroInfo.hero_list.find(entry => String(entry.uid) === '2020601');
  const equipModel = equipped.fixture.store.read();
  const equippedHero = equipModel.heroInfo.hero_list.find(entry => String(entry.uid) === '2020601');
  const collected = collectEquipmentSources({ model: equipModel, codec, tables: equipTables });
  const assembled = assembleHeroAttributes({ hero: equippedHero, heroTables, attributeTables, extraSources: collected.sources });
  const assembledBare = assembleHeroAttributes({ hero: bareHero, heroTables, attributeTables });

  const bareUnit = attacker(bare.battle, '2020601');
  const equippedUnit = attacker(equipped.battle, '2020601');
  assert.equal(Number(bareUnit.max_hp), assembledBare.stats.hp);
  assert.equal(Number(equippedUnit.max_hp), assembled.stats.hp);
  assert.ok(assembled.stats.attack - assembledBare.stats.attack >= equipAttack);
  assert.ok(Number(equippedUnit.max_hp) >= Number(bareUnit.max_hp), 'equipment HP growth never lowers HP');

  const info = buildLineupAttrInfo({ model: equipModel, heroTables, attributeTables });
  const entity = info.lineup_attr.attr_list.find(entry => String(entry.tid) === '2020601');
  assert.equal(Number(entity.fight_attr_list.find(attr => Number(attr.key) === FIGHT_ATTR.ATTACK).value), assembled.stats.attack);
  assert.equal(Number(equipped.battle.atk_power), Number(info.lineup_attr.lineup_power));
});

