import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createRechargeBonusService } from '../game/recharge-bonus-service.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec(), tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const OPENED_AT = Date.parse('2026-10-30T21:00:00Z') / 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-recharge-bonus-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let now = Date.parse('2026-10-31T00:00:00Z');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Recharge Bonus Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT });
  const make = () => createRechargeBonusService({ store, codec, tables, calendar: { serverOpenedAt: OPENED_AT }, now: () => now });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, get service() { return service; },
    setNow(value) { now = value; },
    recharge() {
      store.transaction(model => {
        const modules = new Map(model.state.modules.value);
        service.recordRecharge({ model, modules, at: Math.floor(now / 1000) });
        model.state.modules.value = [...modules];
      });
    },
    info() { return codec.unpack('pb_recharge_bonus', rawBinary(new Map(store.state().modules.value).get(149))); },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT });
      service = make();
    }
  };
}

test('recharge bonus selects once, counts distinct recharge days and claims the matching group award', t => {
  const e = setup(t);
  let selected = codec.unpack('pb_recharge_bonus', e.service.execute(88301, [1]).data);
  assert.equal(selected.tid, 1); assert.equal(selected.group, 1);
  assert.throws(() => e.service.execute(88301, [2]), error => error.code === 5);
  assert.throws(() => e.service.execute(88302, [1]), error => error.code === 1);

  e.recharge();
  assert.equal(e.info().acc_recharge_days, 1);
  e.recharge();
  assert.equal(e.info().acc_recharge_days, 1);
  let response = codec.unpack('pb_recharge_bonus_back', e.service.execute(88302, [1]).data);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '666');
  assert.equal(hasBit(Buffer.from(response.info.award_bin, 'base64'), 1), true);
  assert.throws(() => e.service.execute(88302, [1]), error => error.code === 310);

  e.setNow(Date.parse('2026-10-31T21:00:00Z'));
  e.recharge();
  assert.equal(e.info().acc_recharge_days, 2);
  response = codec.unpack('pb_recharge_bonus_back', e.service.execute(88302, [2]).data);
  assert.equal(response.res.changes.find(row => row.tid === '2002').diff_num, '5');

  e.reopen();
  assert.throws(() => e.service.execute(88302, [2]), error => error.code === 310);
});

test('second recharge bonus round resets the first-round selection at server day 35', t => {
  const e = setup(t);
  e.service.execute(88301, [1]);
  e.recharge();
  assert.equal(e.info().acc_recharge_days, 1);
  e.setNow(Date.parse('2026-12-03T21:00:00Z'));
  e.service.synchronize();
  assert.deepEqual(e.info(), {});
  const selected = codec.unpack('pb_recharge_bonus', e.service.execute(88301, [2]).data);
  assert.equal(selected.tid, 2); assert.equal(selected.group, 2);
});
