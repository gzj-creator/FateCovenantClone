import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { loadFantasyActTables } from '../game/fantasy-act-tables.mjs';
import { createFantasyEquipmentInventory } from '../game/fantasy-equipment-inventory.mjs';
import { createFantasySharedDrawService } from '../game/fantasy-shared-draw-service.mjs';
import { createArtifactDrawPool } from '../game/artifact-draw-pool.mjs';
import { createDemigodDrawPool } from '../game/demigod-draw-pool.mjs';
import { createResidentFantasyDrawPool } from '../game/resident-fantasy-draw-pool.mjs';
import { auditProductionDrawPools } from '../game/draw-pool-audit.mjs';

const codec = createGameCodec();
const tables = { ...readGameTables(), ...loadFantasyActTables() };
const heroTables = readHeroTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const openedAt = 1792789200;

function fixture(t, { activeCodec = codec } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-draw-production-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: openedAt,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null
  });
  let store;
  let service;
  let demigodVersion = 1;
  const randomValues = [];
  const random = () => randomValues.length ? randomValues.shift() : 0.99;
  const open = () => {
    store = createGameStore({ databasePath, seed, codec: activeCodec, serverOpenedAt: openedAt });
    const inventory = createFantasyEquipmentInventory({ codec: activeCodec, tables });
    service = createFantasySharedDrawService({
      store, codec: activeCodec, now: () => openedAt + 3600,
      pools: [
        createArtifactDrawPool({ tables, heroTables, random }),
        createDemigodDrawPool({ tables, heroTables, inventory, codec: activeCodec, random, resolveVersion: () => demigodVersion }),
        createResidentFantasyDrawPool({ tables, heroTables, inventory, codec: activeCodec, random })
      ]
    });
  };
  open();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    setDemigodVersion(value) { demigodVersion = value; },
    setRandom(...values) { randomValues.splice(0, randomValues.length, ...values); },
    reopen() { store.close(); open(); }
  };
}

function seedCosts(store) {
  const tids = new Set([
    ...tables.ArtifactDrawVersion.values(), ...tables.DemigodDraw.values(), { draw_lib: 226 }
  ].flatMap(row => heroTables.Draw.get(Number(row.draw_lib))?.cost_item ?? []));
  store.transaction(model => {
    let index = Math.max(-1, ...[...model.resources.values()].filter(row => row.location?.[0] === 5).map(row => Number(row.location[2]))) + 1;
    for (const tid of tids) {
      const key = String(tid), existing = model.resources.get(key);
      if (existing) existing.num = '1000000';
      else model.resources.set(key, { tid: key, num: '1000000', location: [5, null, index++] });
    }
  });
}

function snapshot(store) {
  const model = store.read();
  return { state: structuredClone(model.state), resources: structuredClone([...model.resources]) };
}

test('production audit records complete artifact groups and exact empty pool evidence', () => {
  const audit = auditProductionDrawPools({ tables, heroTables });
  assert.deepEqual(audit.summary, {
    ready: { artifact: true, demigod: false, resident: false },
    versions: { artifact: 14, demigod: 38 },
    drawLibs: { artifact: 14, demigod: 26 },
    rewardGroups: { artifact: 25, demigod: 56, resident: 2 },
    emptyRewardGroups: { artifact: 0, demigod: 56, resident: 2 },
    tasks: { fantasyEquipActTaskRows: 0, demigodActTaskRows: null }
  });
  assert.deepEqual(audit.artifact.missingGroupIds, []);
  assert.deepEqual(audit.demigod.missingGroupIds, []);
  assert.deepEqual(audit.resident.emptyGroupIds, [60101, 60102]);
  assert.deepEqual(audit.artifact.versionLibraries, [...tables.ArtifactDrawVersion.values()].map(row => ({ version: Number(row.tid), drawLib: Number(row.draw_lib) })));
  assert.equal(audit.demigod.unavailableVersions.length, 38);
  assert.ok(audit.demigod.unavailableVersions.every(row => row.reasons.every(reason => reason.startsWith('empty-group:'))));
});

test('all 14 production artifact versions execute normal and exact guarantee draws without injected rewards', t => {
  const f = fixture(t);
  seedCosts(f.store);
  const persisted = [];
  for (const row of tables.ArtifactDrawVersion.values()) {
    const drawLib = Number(row.draw_lib), version = Number(row.tid);
    const draw = heroTables.Draw.get(drawLib);
    const threshold = Number(heroTables.Guaranteed.get(Number(draw.guaranteed)).guaranteed_num);
    const weights = tables.DrawLibWeight.get(Number(draw.group_weight));
    const costTid = String(draw.cost_item[0]);
    const before = BigInt(f.store.read().resources.get(costTid).num);
    f.setRandom();
    const normal = f.service.execute601({ draw_lib: drawLib, point_draw_num: threshold - 1 });
    assert.equal(normal.valueForLog.draw_count, threshold - 1);
    assert.equal(f.store.read().state.fantasyDrawPools.pools[`artifact:${version}:${drawLib}`].guaranteed_count, String(threshold - 1));
    f.setRandom(0, 0);
    const guaranteed = f.service.execute601({ draw_lib: drawLib });
    assert.ok(weights.guaranteed_group.includes(guaranteed.valueForLog.group_ids[0]));
    assert.equal(guaranteed.value.recruit_info.guaranteed_count, 0);
    assert.equal(guaranteed.value.recruit_info.draw_count, threshold);
    assert.equal(before - BigInt(f.store.read().resources.get(costTid).num), BigInt(threshold * draw.cost_item_count[0]));
    const decoded = codec.unpack('hero_draw_back', guaranteed.data);
    assert.equal(decoded.recruit_info.draw_lib, String(drawLib));
    assert.ok(decoded.res.changes.some(change => BigInt(change.diff_num) > 0n));
    persisted.push([`artifact:${version}:${drawLib}`, structuredClone(f.store.read().state.fantasyDrawPools.pools[`artifact:${version}:${drawLib}`])]);
  }
  const beforeReopen = snapshot(f.store);
  f.reopen();
  assert.deepEqual(snapshot(f.store), beforeReopen);
  for (const [key, value] of persisted) assert.deepEqual(f.store.read().state.fantasyDrawPools.pools[key], value);
});

test('all production demigod versions and resident 226 fail closed before any state change', t => {
  const f = fixture(t);
  seedCosts(f.store);
  const before = snapshot(f.store);
  for (const row of tables.DemigodDraw.values()) {
    f.setDemigodVersion(Number(row.tid));
    assert.throws(() => f.service.execute601({ draw_lib: Number(row.draw_lib) }), error => error?.code === 5 && /has no configured rewards/.test(error.message));
  }
  assert.throws(() => f.service.execute601({ draw_lib: 226 }), error => error?.code === 5 && /60101/.test(error.message));
  assert.deepEqual(snapshot(f.store), before);
  assert.equal(f.store.read().state.fantasyDrawPools, undefined);
});

test('production artifact response encoding and SQLite commit failures roll back every draw effect', t => {
  let rejectResponse = false;
  const activeCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (rejectResponse && name === 'hero_draw_back') throw new Error('production draw encode failure');
      return codec.pack(name, value);
    }
  };
  const f = fixture(t, { activeCodec });
  seedCosts(f.store);
  const before = snapshot(f.store);
  rejectResponse = true;
  assert.throws(() => f.service.execute601({ draw_lib: 181 }), /production draw encode failure/);
  assert.deepEqual(snapshot(f.store), before);
  rejectResponse = false;
  f.store.inspect(db => db.exec("CREATE TRIGGER reject_production_draw BEFORE INSERT ON roles BEGIN SELECT RAISE(ABORT,'production draw sqlite failure'); END"));
  try {
    assert.throws(() => f.service.execute601({ draw_lib: 181 }), /production draw sqlite failure/);
  } finally {
    f.store.inspect(db => db.exec('DROP TRIGGER reject_production_draw'));
  }
  assert.deepEqual(snapshot(f.store), before);
});
