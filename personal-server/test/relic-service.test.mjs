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
