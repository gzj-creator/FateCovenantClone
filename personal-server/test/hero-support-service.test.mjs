import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroSupportTables } from '../config/hero-support-tables.mjs';
import { createHeroSupportService } from '../game/hero-support-service.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const supportTables = readHeroSupportTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const SERVER_OPENED_AT = 1792789200;
const GAME_AT = Date.UTC(2026, 0, 2, 0, 0) / 1000;
const ROLE_ID = 100001;
// DrawExchangeLineup and NormalDrawExchangeLineup both ship rows 1..4.
const LINEUP_ONE = 1;
const LINEUP_TWO = 2;
const LINEUP_THREE = 3;

function fixture() {
  return {
    version: 1,
    roleId: ROLE_ID,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 40, nick_name: Buffer.from('Hero Support Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-support-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  const events = [];
  let now = GAME_AT;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    events,
    get store() { return store; },
    setNow(value) { now = value; },
    service() {
      return createHeroSupportService({
        store, codec, tables, heroTables, now: () => now,
        logger: event => events.push(event)
      });
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function rejected(run, code) {
  assert.throws(run, error => error?.code === code);
}

test('the support service owns 635/651/652/673 and rejects other types', t => {
  const env = setup(t);
  const service = env.service();
  for (const type of [635, 651, 652, 673]) assert.ok(service.supports(type), 'supports ' + type);
  for (const type of [601, 627]) assert.equal(service.supports(type), false);
  rejected(() => service.execute(701, {}), 1);
});

test('652 reports the real support counts of the archive', t => {
  const env = setup(t);
  const service = env.service();
  const value = codec.unpack('pb_draw_support_back', service.execute(652, [2]).data);
  assert.deepEqual(value.role_support.support_list, []);
  assert.deepEqual(value.server_support.support_list, []);
});

test('651 records the supported lineup and 652 reports it after a reopen', t => {
  const env = setup(t);
  let service = env.service();
  const listed = codec.unpack('pb_draw_support_back', service.execute(651, [2, LINEUP_THREE]).data);
  // uint64 protobuf fields (lineup_type) unpack as decimal strings.
  assert.deepEqual(listed.role_support.support_list, [{ lineup_type: String(LINEUP_THREE), support_num: 1 }]);
  assert.deepEqual(listed.server_support.support_list, [{ lineup_type: String(LINEUP_THREE), support_num: 1 }]);

  // A second role in the same archive must show up in the server aggregate.
  env.store.inspect(db => db.prepare('INSERT INTO hero_draw_support(role_id,draw_lib,lineup_type,updated_at) VALUES(?,?,?,?)')
    .run('200002', 2, LINEUP_TWO, new Date(GAME_AT * 1000).toISOString()));

  env.reopen();
  service = env.service();
  const value = codec.unpack('pb_draw_support_back', service.execute(652, [2]).data);
  assert.deepEqual(value.role_support.support_list, [{ lineup_type: String(LINEUP_THREE), support_num: 1 }]);
  assert.deepEqual(value.server_support.support_list, [
    { lineup_type: String(LINEUP_TWO), support_num: 1 },
    { lineup_type: String(LINEUP_THREE), support_num: 1 }
  ]);
});

test('651 replaces the previous choice of the same draw library and keeps libraries apart', t => {
  const env = setup(t);
  const service = env.service();
  service.execute(651, [2, LINEUP_ONE]);
  const replaced = codec.unpack('pb_draw_support_back', service.execute(651, [2, LINEUP_TWO]).data);
  assert.deepEqual(replaced.server_support.support_list, [{ lineup_type: String(LINEUP_TWO), support_num: 1 }]);

  // Draw library 1 keys DrawExchangeLineup and is stored separately.
  const advanced = codec.unpack('pb_draw_support_back', service.execute(651, { draw_lib: 1, lineup_type: LINEUP_THREE }).data);
  assert.deepEqual(advanced.server_support.support_list, [{ lineup_type: String(LINEUP_THREE), support_num: 1 }]);
  const normal = codec.unpack('pb_draw_support_back', service.execute(652, [2]).data);
  assert.deepEqual(normal.server_support.support_list, [{ lineup_type: String(LINEUP_TWO), support_num: 1 }]);
});

test('651 rejects unknown lineups, unknown draw libraries and empty payloads', t => {
  const env = setup(t);
  const service = env.service();
  rejected(() => service.execute(651, [2, 99]), 1);
  rejected(() => service.execute(651, [3, LINEUP_ONE]), 3001);
  rejected(() => service.execute(651, []), 1);
  rejected(() => service.execute(652, [9]), 3001);
});

test('635 answers with a content code because this build ships no progress award rows', t => {
  const env = setup(t);
  const service = env.service();
  assert.equal(supportTables.DrawProgAward.size, 0);
  rejected(() => service.execute(635, [1]), 3001);
  assert.ok(env.events.some(event => event.event === 'hero_draw_progress_award_unconfigured' && event.awardTid === 1));
});

test('673 answers with an empty marquee payload', t => {
  const env = setup(t);
  const service = env.service();
  const value = codec.unpack('pb_draw_marquee_rsp', service.execute(673, { draw_lib: 2, param: Buffer.alloc(0) }).data);
  assert.ok(value.data === undefined || value.data === '' || value.data === null);
  assert.ok(env.events.some(event => event.event === 'hero_draw_marquee_empty' && event.drawLib === 2));
});
