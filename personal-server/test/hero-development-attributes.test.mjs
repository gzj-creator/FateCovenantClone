import test from 'node:test';
import assert from 'node:assert/strict';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { assembleHeroAttributes, createLineupAttributeCache } from '../game/attribute-service.mjs';

const heroTables = readHeroTables(), attributeTables = readAttributeTables();
const hero = changes => ({ uid: '1', tid: 2020601, level: 1, star: 0, star_progress: 0, breakthrough_level: 0, ...changes });
const assemble = changes => assembleHeroAttributes({ hero: hero(changes), heroTables, attributeTables });

test('mastery levels add every reached row, including actor 44 exchanged into both defenses', () => {
  const base = assemble({}), trained = assemble({ mastery_level: 3 });
  assert.equal(trained.stats.hp - base.stats.hp, 3600);
  assert.equal(trained.stats.attack - base.stats.attack, 1080);
  assert.equal(trained.stats.physicalDefense - base.stats.physicalDefense, 936);
  assert.equal(trained.stats.magicDefense - base.stats.magicDefense, 936);
  assert.ok(trained.power > base.power);
});

test('mastery breakthrough uses the current cumulative row once', () => {
  const base = assemble({}), trained = assemble({ mastery_break: 2 });
  assert.equal(trained.stats.hp - base.stats.hp, 19440);
  assert.equal(trained.stats.attack - base.stats.attack, 3240);
  assert.equal(trained.stats.physicalDefense - base.stats.physicalDefense, 1944);
});

test('breakthrough talents accumulate reached rows and apply their percentages', () => {
  const trained = assemble({ breakthrough_level: 2 });
  const source = trained.sources.find(s => s.play === 'break-talent:202060102' && s.displayAttr === 6);
  assert.equal(source?.value, 500);
  const baseAttack = assemble({}).stats.attack;
  const breakAttack = attributeTables.BreakAddAttr.get(2).attack;
  assert.equal(trained.stats.attack, Math.floor((baseAttack + breakAttack) * 1.05));
});

test('mastery-only changes update cached 1316 attributes', () => {
  const owned = hero({});
  const model = { state: { roleId: 1 }, role: { level: 1 }, heroInfo: { hero_list: [owned] },
    playLineups: [{ type: 1, team_list: [{ team_id: 1, fighter_list: [{ hero_id: '1', loc: 1 }] }] }] };
  const cache = createLineupAttributeCache(), options = { model, heroTables, attributeTables };
  const before = cache.get(options);
  owned.mastery_level = 3;
  const after = cache.get(options);
  assert.notDeepEqual(after.lineup_attr, before.lineup_attr);
});
