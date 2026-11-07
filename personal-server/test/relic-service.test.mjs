import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createRelicService } from '../game/relic-service.mjs';
import { readRelicTables, RELIC_CHIP_ITEM_TID } from '../config/relic-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';

const codec = createGameCodec();
const relicTables = readRelicTables();
const gameTables = readGameTables();
const NOW = Date.parse('2026-11-08T08:00:00.000Z');

const codeIs = code => error => error?.code === code;
const HERO = 2010201;
const OTHER_HERO = 2010101;

function fixture(t, options = {}) {
  const f = createGameFixture(t, codec, { prefix: 'fc-relic-', now: () => NOW });
  const build = () => createRelicService({
    store: f.store,
    codec: options.codec ?? codec,
    tables: options.tables ?? relicTables,
    resourceTables: gameTables,
    random: options.random ?? (() => 0.5),
    now: () => NOW
  });
  let service = build();
  return {
    directory: f.directory,
    databasePath: f.databasePath,
    get store() { return f.store; },
    get service() { return service; },
    reopen() { f.open(); service = build(); return service; }
  };
}

function seedResources(store, amount = 10000, ids = [RELIC_CHIP_ITEM_TID, 379002, 668002, 667002, 179002]) {
  store.transaction(model => {
    let index = 0;
    for (const tid of ids) {
      const key = String(tid);
      const existing = model.resources.get(key);
      if (existing) existing.num = String(BigInt(existing.num) + BigInt(amount));
      else model.resources.set(key, { tid: key, num: String(amount), location: [5, null, index++] });
    }
  });
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

function depotRows(store) {
  return store.inspect(db => db.prepare('SELECT * FROM relic_depot ORDER BY CAST(uid AS INTEGER)').all());
}

function heroOf(store, tid) {
  return store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === tid);
}

test('relic wear stores the hero relic slots and rejects conflicts', t => {
  const f = fixture(t);
  const created = f.service.addRelics([{ tid: 2001109 }, { tid: 2001209 }, { tid: 2002109 }, { tid: 2001309 }]);
  assert.equal(created.length, 4);
  assert.deepEqual(depotRows(f.store).map(row => row.uid), ['1', '2', '3', '4']);

  const result = f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [1, 2] }] });
  assert.equal(result.schema, 'pb_relic_wear_rsp');
  assert.doesNotThrow(() => codec.unpack('pb_relic_wear_rsp', result.data));
  assert.deepEqual(heroOf(f.store, HERO).relic.map(Number), [1, 2]);

  assert.throws(() => f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [1, 3] }] }), codeIs(1));
  assert.deepEqual(heroOf(f.store, HERO).relic.map(Number), [1, 2]);
  assert.throws(() => f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [999] }] }), codeIs(5));
  assert.throws(() => f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [1, 1] }] }), codeIs(1));
  assert.throws(() => f.service.execute(89709, { wear_list: [{ hero_tid: 9999999, relics: [4] }] }), codeIs(5));
  assert.throws(() => f.service.execute(89709, { wear_list: [{ hero_tid: OTHER_HERO, relics: [1] }] }), codeIs(1));
  assert.throws(() => f.service.execute(89709, { wear_list: [] }), codeIs(1));
  assert.throws(() => f.service.execute(89709, {}), codeIs(1));

  const replaced = f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [4] }] });
  assert.equal(codec.unpack('pb_relic_wear_rsp', replaced.data).hero_list[0].relic.length, 1);
  assert.deepEqual(heroOf(f.store, HERO).relic.map(Number), [4]);

  const service = f.reopen();
  assert.equal(depotRows(f.store).length, 4);
  assert.deepEqual(heroOf(f.store, HERO).relic.map(Number), [4]);
  const afterRestart = service.execute(89709, { wear_list: [{ hero_tid: OTHER_HERO, relics: [2] }] });
  assert.equal(afterRestart.schema, 'pb_relic_wear_rsp');
  assert.deepEqual(heroOf(f.store, OTHER_HERO).relic.map(Number), [2]);
});

test('relic resolve grants chips, refuses worn relics and persists', t => {
  const f = fixture(t);
  seedResources(f.store);
  const before = resource(f.store, RELIC_CHIP_ITEM_TID);
  f.service.addRelics([{ tid: 2001109 }, { tid: 2001209 }, { tid: 5001109 }]);
  f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [2] }] });

  const result = f.service.execute(89705, { relic_uid_list: [1, 3] });
  assert.equal(result.schema, 'pb_res_to_client');
  const client = codec.unpack('pb_res_to_client', result.data);
  assert.equal(Number(client.changes[0].tid), RELIC_CHIP_ITEM_TID);
  assert.equal(Number(client.changes[0].diff_num), 10 + 350);
  assert.equal(resource(f.store, RELIC_CHIP_ITEM_TID), before + 360n);
  assert.deepEqual(depotRows(f.store).map(row => row.uid), ['2']);

  assert.throws(() => f.service.execute(89705, { relic_uid_list: [2] }), codeIs(1));
  assert.throws(() => f.service.execute(89705, { relic_uid_list: [1] }), codeIs(5));
  assert.throws(() => f.service.execute(89705, { relic_uid_list: [] }), codeIs(1));

  const service = f.reopen();
  assert.deepEqual(depotRows(f.store).map(row => row.uid), ['2']);
  assert.throws(() => service.execute(89705, { relic_uid_list: [1] }), codeIs(5));
});

test('encoding and SQLite failures roll back relic depot and hero slots', t => {
  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === 'pb_relic_wear_rsp') throw new Error('injected relic response failure');
      return codec.pack(name, value);
    }
  };
  const encoded = fixture(t, { codec: brokenCodec });
  encoded.service.addRelics([{ tid: 2001109 }]);
  assert.throws(() => encoded.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [1] }] }), /injected relic response failure/);
  assert.deepEqual(heroOf(encoded.store, HERO).relic.map(Number), []);
  assert.equal(depotRows(encoded.store).length, 1);

  const failed = fixture(t);
  failed.service.addRelics([{ tid: 2001109 }]);
  failed.store.inspect(db => db.exec("CREATE TRIGGER fail_relic_depot BEFORE INSERT ON relic_depot BEGIN SELECT RAISE(ABORT,'injected relic depot failure'); END"));
  try {
    assert.throws(() => failed.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [1] }] }), /injected relic depot failure/);
  } finally {
    failed.store.inspect(db => db.exec('DROP TRIGGER fail_relic_depot'));
  }
  assert.deepEqual(heroOf(failed.store, HERO).relic.map(Number), []);
  assert.equal(depotRows(failed.store).length, 1);
});

test('relic break-up spends the quality chip cost up to the star cap', t => {
  const f = fixture(t);
  seedResources(f.store, 1000);
  f.service.addRelics([{ tid: 3001109 }, { tid: 2001109 }, { tid: 3001209 }]);
  const before = resource(f.store, RELIC_CHIP_ITEM_TID);

  const first = f.service.execute(89701, 1);
  assert.equal(first.schema, 'pb_res_op_relic');
  assert.equal(codec.unpack('pb_res_op_relic', first.data).relic.star, 1);
  assert.equal(resource(f.store, RELIC_CHIP_ITEM_TID), before - 60n);

  f.service.execute(89701, { uid: 1 });
  f.service.execute(89701, [1]);
  let row = depotRows(f.store).find(entry => entry.uid === '1');
  assert.equal(row.star, 3);
  assert.equal(resource(f.store, RELIC_CHIP_ITEM_TID), before - 360n);
  assert.throws(() => f.service.execute(89701, 1), codeIs(305));

  assert.throws(() => f.service.execute(89701, 2), codeIs(305));
  assert.throws(() => f.service.execute(89701, 999), codeIs(5));
  assert.throws(() => f.service.execute(89701, 0), codeIs(1));

  f.store.transaction(model => { model.resources.get(String(RELIC_CHIP_ITEM_TID)).num = '0'; });
  assert.throws(() => f.service.execute(89701, 3), codeIs(301));

  const service = f.reopen();
  row = depotRows(f.store).find(entry => entry.uid === '1');
  assert.equal(row.star, 3);
  assert.throws(() => service.execute(89701, 1), codeIs(305));
});

test('relic recast rolls the configured skills, save and cancel clear pending results', t => {
  const f = fixture(t);
  seedResources(f.store, 1000);
  f.service.addRelics([{ tid: 3001109 }]);
  const before = resource(f.store, 379002);

  assert.throws(() => f.service.execute(89702, { relic_uid: 1, index: 1 }), codeIs(305));
  assert.throws(() => f.service.execute(89702, { relic_uid: 5, index: 0 }), codeIs(5));
  assert.throws(() => f.service.execute(89702, { relic_uid: 1, index: 7 }), codeIs(1));

  const result = f.service.execute(89702, { relic_uid: 1, index: 0 });
  const rolled = codec.unpack('pb_res_op_relic', result.data).relic;
  assert.equal(rolled.recast_skills.length, 3);
  assert.equal(rolled.cur_skills.length, 0);
  assert.equal(Number(rolled.recast_datas[0].recast_times), 1);
  assert.equal(resource(f.store, 379002), before - 80n);

  const saved = f.service.execute(89704, { relic_uid: 1, index: 0 });
  const savedRelic = codec.unpack('pb_res_op_relic', saved.data).relic;
  assert.deepEqual(savedRelic.cur_skills.map(Number), rolled.recast_skills.map(Number));
  assert.equal(savedRelic.recast_skills.length, 0);
  assert.equal(Number(savedRelic.recast_datas[0].recast_times ?? 0), 0);
  assert.throws(() => f.service.execute(89704, { relic_uid: 1, index: 0 }), codeIs(1));

  f.service.execute(89702, { relic_uid: 1, index: 0 });
  const cancelled = f.service.execute(89706, { relic_uid: 1, index: 0 });
  assert.equal(codec.unpack('pb_res_op_relic', cancelled.data).relic.recast_skills.length, 0);
  assert.throws(() => f.service.execute(89706, { relic_uid: 1, index: 0 }), codeIs(1));

  const service = f.reopen();
  const row = depotRows(f.store).find(entry => entry.uid === '1');
  assert.equal(JSON.parse(row.cur_skills_json).length, 3);
  assert.equal(JSON.parse(row.recast_skills_json).length, 0);
  assert.throws(() => service.execute(89706, { relic_uid: 1, index: 0 }), codeIs(1));
});

test('relic recast and break-up roll back on encoding and SQLite failures', t => {
  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === 'pb_res_op_relic') throw new Error('injected relic operation failure');
      return codec.pack(name, value);
    }
  };
  const encoded = fixture(t, { codec: brokenCodec });
  seedResources(encoded.store, 1000);
  encoded.service.addRelics([{ tid: 3001109 }]);
  assert.throws(() => encoded.service.execute(89701, 1), /injected relic operation failure/);
  assert.throws(() => encoded.service.execute(89702, { relic_uid: 1, index: 0 }), /injected relic operation failure/);
  assert.equal(resource(encoded.store, RELIC_CHIP_ITEM_TID), 1000n);
  assert.equal(resource(encoded.store, 379002), 1000n);
  assert.equal(depotRows(encoded.store)[0].star, 0);
  assert.equal(depotRows(encoded.store)[0].recast_skills_json, '[]');

  const failed = fixture(t);
  seedResources(failed.store, 1000);
  failed.service.addRelics([{ tid: 3001109 }]);
  failed.store.inspect(db => db.exec("CREATE TRIGGER fail_relic_update BEFORE INSERT ON relic_depot BEGIN SELECT RAISE(ABORT,'injected relic update failure'); END"));
  try {
    assert.throws(() => failed.service.execute(89701, 1), /injected relic update failure/);
  } finally {
    failed.store.inspect(db => db.exec('DROP TRIGGER fail_relic_update'));
  }
  assert.equal(resource(failed.store, RELIC_CHIP_ITEM_TID), 1000n);
  assert.equal(depotRows(failed.store)[0].star, 0);
});

test('relic stage consumes configured materials and reset returns them', t => {
  const f = fixture(t);
  seedResources(f.store, 1000);
  f.service.addRelics([{ tid: 5001109 }, { tid: 5001209 }, { tid: 5001309 }, { tid: 2001109 }]);
  const before = resource(f.store, 667002);

  assert.throws(() => f.service.execute(89708, { relic_uid: 1, relic_uid_list: [] }), codeIs(1));
  assert.throws(() => f.service.execute(89708, { relic_uid: 1, relic_uid_list: [1] }), codeIs(1));
  assert.throws(() => f.service.execute(89708, { relic_uid: 1, relic_uid_list: [2, 2] }), codeIs(1));
  assert.throws(() => f.service.execute(89708, { relic_uid: 1, relic_uid_list: [99] }), codeIs(5));
  assert.throws(() => f.service.execute(89708, { relic_uid: 4, relic_uid_list: [2] }), codeIs(5));

  f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [3] }] });
  assert.throws(() => f.service.execute(89708, { relic_uid: 1, relic_uid_list: [3] }), codeIs(1));
  f.service.execute(89709, { wear_list: [{ hero_tid: HERO, relics: [] }] });

  const staged = f.service.execute(89708, { relic_uid: 1, relic_uid_list: [2, 3] });
  const relic = codec.unpack('pb_res_op_relic', staged.data).relic;
  assert.equal(relic.stage, 1);
  assert.deepEqual(relic.stage_cost_relics.map(row => [Number(row.tid), Number(row.num)]), [[5001209, 1], [5001309, 1]]);
  assert.equal(resource(f.store, 667002), before - 10n);
  assert.deepEqual(depotRows(f.store).map(row => row.uid), ['1', '4']);

  const reset = f.service.execute(89707, 1);
  assert.equal(reset.schema, 'pb_rsp_reset_relic');
  const resetValue = codec.unpack('pb_rsp_reset_relic', reset.data);
  assert.equal(resetValue.back_relic_l.length, 2);
  assert.equal(Number(resetValue.relic.stage ?? 0), 0);
  assert.deepEqual(depotRows(f.store).map(row => row.uid), ['1', '4', '5', '6']);
  assert.deepEqual(depotRows(f.store).filter(row => ['5', '6'].includes(row.uid)).map(row => row.tid).sort(), [5001209, 5001309]);
  assert.throws(() => f.service.execute(89707, 1), codeIs(1));
  assert.throws(() => f.service.execute(89707, 99), codeIs(5));

  f.store.inspect(db => db.prepare('UPDATE relic_depot SET stage=5 WHERE uid=?').run('1'));
  assert.throws(() => f.service.execute(89708, { relic_uid: 1, relic_uid_list: [5] }), codeIs(305));

  const service = f.reopen();
  assert.equal(depotRows(f.store).length, 4);
  assert.equal(depotRows(f.store).find(row => row.uid === '1').stage, 5);
  assert.equal(service.execute(89707, 1).schema, 'pb_rsp_reset_relic');
});

test('relic variation is limited to qualities that declare it', t => {
  const f = fixture(t);
  seedResources(f.store, 1000);
  f.service.addRelics([{ tid: 5001109 }, { tid: 2001109 }]);
  const before = resource(f.store, 668002);

  assert.throws(() => f.service.execute(89711, 2), codeIs(305));
  assert.throws(() => f.service.execute(89711, 99), codeIs(5));

  const varied = f.service.execute(89711, 1);
  assert.equal(varied.schema, 'pb_variation_back');
  assert.equal(codec.unpack('pb_variation_back', varied.data).relic.is_variation, true);
  assert.equal(resource(f.store, 668002), before - 10n);
  assert.throws(() => f.service.execute(89711, 1), codeIs(305));
  assert.equal(depotRows(f.store).find(row => row.uid === '1').is_variation, 1);

  const service = f.reopen();
  assert.equal(depotRows(f.store).find(row => row.uid === '1').is_variation, 1);
  assert.throws(() => service.execute(89711, 1), codeIs(305));
});

function tablesWithSpHero(heroTid, item) {
  const tables = { ...relicTables, SpHero: new Map(relicTables.SpHero) };
  tables.SpHero.set(heroTid, { tid: heroTid, refine_attr: 66, item, relic_name: 1 });
  return tables;
}

function setHero(store, tid, patch) {
  store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(entry => Number(entry.tid) === tid);
    assert.ok(hero, 'hero fixture ' + tid);
    Object.assign(hero, patch);
  });
}

test('relic SP level-up spends the hero SP item and honours gated levels', t => {
  const f = fixture(t, { tables: tablesWithSpHero(HERO, 497002) });
  seedResources(f.store, 1000, [497002]);
  const before = resource(f.store, 497002);

  const result = f.service.execute(89710, HERO);
  assert.equal(result.schema, 'pb_relic_sp_up_rsp');
  const value = codec.unpack('pb_relic_sp_up_rsp', result.data);
  assert.equal(Number(value.hero.sp_relic_level), 1);
  assert.equal(resource(f.store, 497002), before - 1n);

  assert.throws(() => f.service.execute(89710, OTHER_HERO), codeIs(5));
  assert.throws(() => f.service.execute(89710, 9999999), codeIs(5));

  setHero(f.store, HERO, { sp_relic_level: '3', sp_relic_refine_value: '0' });
  assert.throws(() => f.service.execute(89710, HERO), codeIs(305));
  setHero(f.store, HERO, { sp_relic_refine_value: '1000' });
  const gated = f.service.execute(89710, HERO);
  assert.equal(Number(codec.unpack('pb_relic_sp_up_rsp', gated.data).hero.sp_relic_level), 4);

  setHero(f.store, HERO, { sp_relic_level: '10' });
  assert.throws(() => f.service.execute(89710, HERO), codeIs(305));

  const service = f.reopen();
  assert.equal(Number(heroOf(f.store, HERO).sp_relic_level), 10);
  assert.throws(() => service.execute(89710, HERO), codeIs(305));
});

test('relic refine adds the tier-bounded value and persists', t => {
  const f = fixture(t, { tables: tablesWithSpHero(HERO, 497002) });
  seedResources(f.store, 1000, [497002]);
  const before = resource(f.store, 497002);

  const result = f.service.execute(89712, HERO);
  assert.equal(result.schema, 'pb_relic_refine_back');
  const value = codec.unpack('pb_relic_refine_back', result.data);
  assert.equal(Number(value.tid), HERO);
  assert.equal(Number(value.refine_value), 6);
  assert.equal(Number(value.add_refine_value), 6);
  assert.equal(resource(f.store, 497002), before - 1n);
  assert.equal(Number(heroOf(f.store, HERO).sp_relic_refine_value), 6);

  assert.throws(() => f.service.execute(89712, OTHER_HERO), codeIs(5));
  setHero(f.store, HERO, { sp_relic_refine_value: '999999' });
  assert.throws(() => f.service.execute(89712, HERO), codeIs(305));

  const service = f.reopen();
  setHero(f.store, HERO, { sp_relic_refine_value: '1200' });
  const tier2 = service.execute(89712, HERO);
  const tier2Value = codec.unpack('pb_relic_refine_back', tier2.data);
  assert.equal(Number(tier2Value.refine_value), 1206);
});
