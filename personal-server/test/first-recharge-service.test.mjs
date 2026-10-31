import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createFirstRechargeService } from '../game/first-recharge-service.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const CREATED_AT = Date.parse('2026-10-29T21:30:00Z') / 1000;

function setRechargeTotal(store, cents) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const raw = modules.get(19) ? rawBinary(modules.get(19)) : Buffer.alloc(0);
    const login = raw.length ? codec.unpack('res_recharge_login', raw) : {};
    login.total_amount = cents;
    modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
    model.state.modules.value = [...modules];
  });
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-first-recharge-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: CREATED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('First Recharge Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let now = Date.parse('2026-10-31T21:00:00Z');
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
  const make = () => createFirstRechargeService({ store, codec, tables, now: () => now });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, get service() { return service; },
    setNow(value) { now = value; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: CREATED_AT });
      service = make();
    }
  };
}

test('first recharge grants one grade/day at a time, unlocks by role login day and persists claims', t => {
  const e = setup(t);
  setRechargeTotal(e.store, 600);
  let response = codec.unpack('pb_res_rev_first_recharge_reward', e.service.execute().data);
  assert.equal(response.res.changes.find(row => row.tid === '3030501').diff_num, '1');
  let grade = response.grade_list.find(row => row.grade === 1);
  assert.equal(hasBit(Buffer.from(grade.reward_states, 'base64'), 1), true);
  assert.equal(hasBit(Buffer.from(grade.reward_states, 'base64'), 2), false);

  response = codec.unpack('pb_res_rev_first_recharge_reward', e.service.execute().data);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '888');
  response = codec.unpack('pb_res_rev_first_recharge_reward', e.service.execute().data);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '888');
  assert.throws(() => e.service.execute(), error => error.code === 311);
  assert.equal(e.store.inspect(db => db.prepare("SELECT count(*) n FROM reward_claims WHERE claim_type='first_recharge'").get().n), 3);

  e.reopen();
  assert.throws(() => e.service.execute(), error => error.code === 311);
});

test('first recharge advances to higher grades after an earlier grade is complete', t => {
  const e = setup(t);
  setRechargeTotal(e.store, 3000);
  for (let index = 0; index < 3; index++) e.service.execute();
  const response = codec.unpack('pb_res_rev_first_recharge_reward', e.service.execute().data);
  assert.equal(response.res.changes.find(row => row.tid === '2002').diff_num, '10');
  assert.equal(response.grade_list.find(row => row.grade === 2).reward_states.length > 0, true);
});

test('first recharge waits for the configured role login day after 05:00', t => {
  const e = setup(t);
  setRechargeTotal(e.store, 600);
  e.setNow(Date.parse('2026-10-29T21:30:00Z'));
  e.service.execute();
  assert.throws(() => e.service.execute(), error => error.code === 311);
  e.setNow(Date.parse('2026-10-30T20:59:59Z'));
  assert.throws(() => e.service.execute(), error => error.code === 311);
  e.setNow(Date.parse('2026-10-30T21:00:00Z'));
  const response = codec.unpack('pb_res_rev_first_recharge_reward', e.service.execute().data);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '888');
});
