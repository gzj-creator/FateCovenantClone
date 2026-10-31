import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createFantasyDrawService } from '../game/fantasy-draw-service.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;

function seed() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return { version: 1, roleId: 100001, serverId: 1, createdAt: openedAt, modules,
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'), guides: {}, lineups: null };
}

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fantasy-draw-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const clock = { seconds: 1793409600 };
  let store, service;
  function open() {
    store = createGameStore({ databasePath, seed, codec, serverOpenedAt: openedAt });
    service = createFantasyDrawService({ store, codec, tables, now: () => clock.seconds });
  }
  open();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    clock,
    get store() { return store; },
    get service() { return service; },
    reopen() { store.close(); open(); }
  };
}

function moduleData(store) {
  const module = new Map(store.state().modules.value).get(518);
  return module.value.map(rawBinary);
}

function drawInfo(store) {
  return codec.unpack('pb_fantasy_draw', moduleData(store)[2]);
}

function resource(store, tid) {
  return BigInt(store.read().resources.get(String(tid))?.num ?? 0);
}

test('login initializes purchase state without replacing equipment or formation', t => {
  const f = fixture(t);
  const equipment = codec.pack('pb_fantasy_equip_res', { equips: [{ tid: 1200719, uid: 7, level: 1 }], max_equip_id: 7 });
  const formation = codec.pack('pb_fantasy_formation_list', { formation_list: [{ uid: 7, slot_index: 1 }] });
  f.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(518);
    module.value[0] = serializedBinary(equipment);
    module.value[1] = serializedBinary(formation);
  });
  f.service.ensureLoginState();
  const [storedEquipment, storedFormation] = moduleData(f.store);
  assert.deepEqual(storedEquipment, equipment);
  assert.deepEqual(storedFormation, formation);
  assert.equal(drawInfo(f.store).left_buy_times, 10);
  f.reopen();
  f.service.ensureLoginState();
  assert.deepEqual(moduleData(f.store)[0], equipment);
  assert.equal(drawInfo(f.store).left_buy_times, 10);
});

test('ticket purchase is atomic, persistent, and replenishes up to the configured cap', t => {
  const f = fixture(t);
  f.service.ensureLoginState();
  f.store.transaction(model => grantResources(model, [[101500, 10000]], tables));
  const gems = resource(f.store, 101500), tickets = resource(f.store, 808002);
  const result = f.service.buyTickets(3);
  assert.equal(codec.unpack('pb_fantasy_equip_draw_buy_rsp', result.data).draw.left_buy_times, 7);
  assert.equal(resource(f.store, 101500), gems - 1200n);
  assert.equal(resource(f.store, 808002), tickets + 3n);
  assert.throws(() => f.service.buyTickets(8), error => error.code === 307);
  assert.equal(resource(f.store, 101500), gems - 1200n);
  f.reopen();
  assert.equal(drawInfo(f.store).left_buy_times, 7);
  f.clock.seconds += 86400;
  f.service.ensureLoginState();
  assert.equal(drawInfo(f.store).left_buy_times, 17);
  f.clock.seconds += 10 * 86400;
  f.service.ensureLoginState();
  assert.equal(drawInfo(f.store).left_buy_times, 70);
  const remainingGems = resource(f.store, 101500);
  assert.throws(() => f.service.buyTickets(70), error => error.code === 301);
  assert.equal(resource(f.store, 101500), remainingGems);
  assert.equal(drawInfo(f.store).left_buy_times, 70);
});

test('wishes require unlocked slots and candidates and survive a restart', t => {
  const f = fixture(t);
  f.service.ensureLoginState();
  assert.throws(() => f.service.setWish({ wish_list: [1200719] }), error => error.code === 305);
  f.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(518);
    const draw = codec.unpack('pb_fantasy_draw', rawBinary(module.value[2]));
    draw.total_draw_times = '100';
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', draw));
  });
  assert.throws(() => f.service.setWish({ wish_list: [1200719, 1200719] }), error => error.code === 1);
  assert.throws(() => f.service.setWish({ wish_list: [1203219] }), error => error.code === 1);
  const selected = f.service.setWish({ wish_list: [1200719, 1200819] });
  assert.deepEqual(codec.unpack('pb_fantasy_draw', selected.data).wish_list, [1200719, 1200819]);
  f.reopen();
  assert.deepEqual(drawInfo(f.store).wish_list, [1200719, 1200819]);
});
