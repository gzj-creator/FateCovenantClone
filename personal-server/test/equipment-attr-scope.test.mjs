import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, serializedBinary } from '../protocol/game-codec.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { buildLineupAttrInfo, FIGHT_ATTR } from '../game/attribute-service.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createGameFixture, fixtureModules } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();

// Equipment ownership is per hero: pb_lineup_fighter.equip_ids (=4) lists the
// equips worn by that fighter and EquipAttrCollect resolves attributes per
// fighter.index. Until a fighter's own equip_ids and a verified module-26 layout
// are persisted, worn equipment must not contribute to any hero's attributes.
// These tests lock that boundary so a shared-team reading of module 26 can never
// inflate the lineup again.
const ROLE_EQUIP_MODULE = 26;

// EquipTable row 10103 is a real template; the record below is only used to
// prove that even a fully resolvable equip row is ignored at lineup scope.
const resolvableEquip = {
  id: 101,
  tid: 10103,
  level: 5,
  level_exp: 0,
  inscription: 3,
  refine: 2,
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

function attrOf(entity, key) {
  return Number(entity.fight_attr_list.find(attr => Number(attr.key) === key)?.value ?? 0);
}

test('worn equipment never contributes to another hero through the lineup query', t => {
  const bareFixture = createGameFixture(t, codec, { prefix: 'fc-equip-scope-bare-', seed: { modules: modulesWith([]) } });
  const equippedFixture = createGameFixture(t, codec, { prefix: 'fc-equip-scope-worn-', seed: { modules: modulesWith([resolvableEquip]) } });

  const bare = buildLineupAttrInfo({ model: bareFixture.store.read(), heroTables, attributeTables });
  const equipped = buildLineupAttrInfo({ model: equippedFixture.store.read(), heroTables, attributeTables });

  assert.equal(equipped.lineup_attr.lineup_power, bare.lineup_attr.lineup_power);
  assert.equal(equipped.lineup_attr.attr_list.length, bare.lineup_attr.attr_list.length);
  for (const bareEntity of bare.lineup_attr.attr_list) {
    const equippedEntity = equipped.lineup_attr.attr_list.find(entry => String(entry.tid) === String(bareEntity.tid));
    assert.ok(equippedEntity, 'every hero is still reported');
    assert.deepEqual(equippedEntity.fight_attr_list, bareEntity.fight_attr_list);
  }
});

test('mission battle stays on the same hero attributes as 1316 for every lineup member', t => {
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

  const run = (prefix, equips) => {
    const fixture = createGameFixture(t, codec, { prefix, seed: { modules: modulesWith(equips) } });
    const service = createMissionFightService({ store: fixture.store, codec, playbackEnabled: true });
    const response = codec.unpack('pb_fight_response', service.execute(201, request).data);
    const info = buildLineupAttrInfo({ model: fixture.store.read(), heroTables, attributeTables });
    return { battle: response.report.battle_list[0], info };
  };

  const bare = run('fc-equip-scope-battle-bare-', []);
  const equipped = run('fc-equip-scope-battle-worn-', [resolvableEquip]);

  assert.equal(Number(equipped.battle.atk_power), Number(equipped.info.lineup_attr.lineup_power));
  assert.equal(Number(equipped.battle.atk_power), Number(bare.battle.atk_power));

  for (const unit of equipped.battle.fighter_list.filter(fighter => Number(fighter.role_type) === 1)) {
    const entity = equipped.info.lineup_attr.attr_list.find(entry => String(entry.tid) === String(unit.uid));
    assert.ok(entity, 'attacker is present in the attribute query');
    assert.equal(Number(unit.max_hp), attrOf(entity, FIGHT_ATTR.HP));
    const bareUnit = bare.battle.fighter_list.find(fighter => Number(fighter.role_type) === 1 && String(fighter.uid) === String(unit.uid));
    assert.equal(Number(unit.max_hp), Number(bareUnit.max_hp));
  }
});
