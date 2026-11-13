import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createFeatureOverrideStore } from '../game/feature-overrides.mjs';
import { createFeatureService, openFeatureIds } from '../game/feature-service.mjs';

const codec = createGameCodec();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));

function standalone(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  let now = 1_700_000_000;
  const store = { inspect: action => action(db) };
  return {
    db,
    overrides: createFeatureOverrideStore({ store, now: () => now * 1000 }),
    setNow: value => { now = value; }
  };
}

test('force overrides are audited and revocable', t => {
  const { db, overrides, setNow } = standalone(t);
  const id = overrides.set({ serverId: 3, funId: 1039, mode: 'force_open', reason: 'open weekend', operator: 'ops' });
  assert.equal(overrides.activeFor(3).length, 1);
  assert.equal(overrides.activeFor(4).length, 0);
  setNow(1_700_000_100);
  overrides.set({ serverId: 3, funId: 1039, mode: 'force_close', reason: 'incident', operator: 'ops' });
  assert.equal(overrides.activeFor(3)[0].mode, 'force_close');
  overrides.revoke(id, 'ops', 'superseded');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ops_audit').get().n, 3);
  assert.throws(() => overrides.set({ serverId: 3, funId: 1039, mode: 'open' }), error => error.code === 1);
});

test('client-confirmed target 1 requests commit even with an evidence gap; force_close masks the login bitmap', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-feature-override-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1_700_000_000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9 }).toString('base64'), guides: {}, lineups: null
  });
  const store = createGameStore({ databasePath, seed, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const overrideStore = createFeatureOverrideStore({ store });
  const service = createFeatureService({
    store, codec,
    rules: [{
      funId: 1054,
      status: 'evidence_gap',
      conditions: [{ type: 'role_level', args: { level: 99 } }],
      evidenceGap: [{ reason: 'expression_not_supported' }]
    }],
    overrides: serverId => overrideStore.activeFor(serverId)
  });

  service.execute(7000, { value: [1054] });
  const state = store.state();
  const modules = new Map(state.modules.value);
  assert.ok(openFeatureIds(codec.unpack('res_fun_open_login', rawBinary(modules.get(3)))).has(1054));

  overrideStore.set({ serverId: 1, funId: 1054, mode: 'force_close', reason: 'test', operator: 'ops' });
  service.maskLogin(modules);
  assert.equal(openFeatureIds(codec.unpack('res_fun_open_login', rawBinary(modules.get(3)))).has(1054), false);
  // The persisted bitmap is untouched; revoking restores the original view.
  assert.ok(openFeatureIds(codec.unpack('res_fun_open_login', rawBinary(new Map(store.state().modules.value).get(3)))).has(1054));
  for (const row of overrideStore.activeFor(1)) overrideStore.revoke(row.id, 'ops', 'test');
  const restored = new Map(store.state().modules.value);
  service.maskLogin(restored);
  assert.ok(openFeatureIds(codec.unpack('res_fun_open_login', rawBinary(restored.get(3)))).has(1054));
});
