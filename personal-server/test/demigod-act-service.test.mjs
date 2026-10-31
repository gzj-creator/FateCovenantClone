import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createDemigodActService } from '../game/demigod-act-service.mjs';
import { createFantasyEquipmentService } from '../game/fantasy-equipment-service.mjs';
import { loadFantasyActTables } from '../game/fantasy-act-tables.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const m5Tables = loadFantasyActTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;
const alwaysOpen = () => true;

function fixture(t, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-demigod-act-'));
  const databasePath = path.join(dir, 'game.sqlite');
  let store, service, closed = false;
  const seed = () => ({ version: 1, roleId: 100001, serverId: 1, createdAt: openedAt,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null });
  const open = () => {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    service = createDemigodActService({
      store, codec, tables, fantasyTables: m5Tables, activityTid: 102001, assertOpen: alwaysOpen, ...extra
    });
    closed = false;
  };
  open();
  t.after(() => { if (!closed) store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { get store() { return store; }, get service() { return service; }, reopen() { if (!closed) store.close(); open(); } };
}

function equip(f, tid, options = {}) {
  return f.store.transaction(model => {
    const current = f.service.inventory.read(model);
    const value = f.service.inventory.create(current, tid, options);
    f.service.inventory.save(model, current);
    return value;
  });
}

test('adapter advertises exactly the eight demigod activity commands', () => {
  const f = fixture(test);
  for (let type = 98301; type <= 98308; type++) assert.equal(f.service.supports(type), true);
  assert.equal(f.service.supports(98309), false);
  assert.throws(() => f.service.execute(99999, {}), /Unsupported/);
});

test('all demigod PB commands return their declared schema and persist', () => {
  const f = fixture(test);
  const main = equip(f, 1200119, { star: 5 });
  const bless = equip(f, 1120119);
  const trial = f.service.execute(98304, { tid: 1, fantasy_id: { uid: main.uid, tid: main.tid } });
  assert.equal(trial.schema, 'pb_demigod_act_wear_back');
  assert.ok(trial.data.length);
  const match403 = equip(f, 1200619);
  f.service.execute(98304, { tid: 2, fantasy_id: { uid: match403.uid, tid: match403.tid } });
  const ordinary = createFantasyEquipmentService({
    store: f.store, codec, tables, extraReferences: f.service.createReferenceProvider()
  });
  assert.throws(() => ordinary.execute(87601, {
    hero_tid: 4030801, equip: { uid: match403.uid, tid: match403.tid }
  }), /activity trial/);
  const blessResult = f.service.execute(98305, { tid: 1, bless_list: [{ bless_fantasy_id: { uid: bless.uid, tid: bless.tid }, pos: 1 }] });
  assert.equal(blessResult.schema, 'pb_demigod_act_wear_bless_back');
  assert.ok(blessResult.data.length);
  assert.deepEqual(blessResult.trial.bless_list, [String(bless.uid)]);
  const clear = f.service.execute(98305, { tid: 1, bless_list: [] });
  assert.deepEqual(clear.trial.bless_list, []);

  f.store.transaction(model => f.service.recordTrialDamage(model, 1, 500000));
  assert.equal(f.service.execute(98303, { tid: 1, receive_tid: 1001 }).schema, 'pb_res_to_client');
  f.store.transaction(model => f.service.recordDraw(model, { count: 10 }));
  assert.equal(f.service.execute(98307, null).schema, 'pb_demigod_act_draw_award_back');
  const [wishTid] = tables.DemigodDrawWish.keys();
  assert.equal(f.service.execute(98308, wishTid).schema, 'etf');

  f.reopen();
  const state = f.store.state().fantasyActState.kinds.demigod;
  assert.equal(state.trials['1'].fantasy_equip, String(main.uid));
  assert.deepEqual(state.trials['1'].receive_list, [1001]);
  assert.deepEqual(state.draw.draw_awards, [1001]);
});

test('module-183 payload exposes ordered logical activity blocks without touching the login container', () => {
  const f = fixture(test);
  const before = structuredClone(new Map(f.store.state().modules.value).get(183) ?? null);
  const payload = f.service.serializeLoginBlocks();
  assert.equal(payload.kind, 'demigod');
  assert.deepEqual(payload.blocks.map(block => block.index), [0, 1, 2]);
  assert.deepEqual(payload.blocks.map(block => block.schema), [
    'pb_demigod_act', 'pb_demigod_act_trial_data', 'pb_marbles_award_info'
  ]);
  assert.ok(payload.blocks[0].data.length > 0);
  for (const block of payload.blocks) assert.ok(Buffer.isBuffer(block.data));
  assert.equal(codec.unpack('pb_demigod_act', payload.blocks[0].data).act_tid, 102001);
  assert.deepEqual(new Map(f.store.state().modules.value).get(183) ?? null, before);
});

test('daily and big marbles are one-time and threshold gated', () => {
  const f = fixture(test);
  assert.equal(f.service.execute(98301, null).schema, 'pb_res_to_client');
  assert.throws(() => f.service.execute(98301, null), /already claimed/);
  f.store.transaction(model => { model.state.fantasyActState.kinds.demigod.daily.marbles.award_count = 12; });
  const result = f.service.execute(98302, null);
  assert.equal(result.schema, 'pb_res_to_client');
  assert.ok(result.value.changes[0].extra.length > 0);
  assert.equal(result.equipment.length, 1);
  assert.throws(() => f.service.execute(98302, null), /already claimed/);
});

test('copy creates a distinct trial instance with no copied blessing references', () => {
  const f = fixture(test);
  const source = equip(f, 1200119);
  const copy = f.service.execute(98306, 1);
  assert.equal(copy.schema, 'pb_demigod_act_trial');
  assert.notEqual(copy.equipment.uid, source.uid);
  assert.deepEqual(copy.equipment.bless, []);
  const equips = f.service.inventory.read({ ...f.store.read() }).data.equips;
  assert.equal(equips.filter(value => value.uid === copy.equipment.uid).length, 1);
});
