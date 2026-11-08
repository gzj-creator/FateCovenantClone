import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHouseAssistantTables } from '../config/house-assistant-tables.mjs';
import { createHouseAssistantService } from '../game/house-assistant-service.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createGameStore } from '../storage/game-store.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const tables = readHouseAssistantTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const START = Date.parse('2026-11-08T08:00:00.000Z');
const SCHEMA = 'pb_house_assistant_info';

function fixture() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('House Assistant Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function defaultState(overrides = {}) {
  return {
    res: [
      { tid: '10023200', num: '1' },
      { tid: '10043200', num: '1' },
      { tid: '10063200', num: '1' },
      { tid: '20013200', num: '1' },
      { tid: '20023200', num: '1' }
    ],
    use: [],
    trial: [],
    last_use: [],
    ...overrides
  };
}

function setup(t, { initialState = defaultState(), now = () => START, omitted = false, rawModule = null } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-house-assistant-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    if (!omitted) modules.set(148, {
      value: [serializedBinary(rawModule ?? codec.pack(SCHEMA, initialState))],
      improper: false
    });
    model.state.modules.value = [...modules];
  });
  if (omitted) store.inspect(db => db.prepare('DELETE FROM login_modules WHERE module_id=148').run());
  return {
    databasePath,
    legacyStatePath,
    get store() { return store; },
    service(options = {}) {
      return createHouseAssistantService({ store, codec, gameTables, tables, now, ...options });
    },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, legacyStatePath, codec });
    }
  };
}

function houseData(store) {
  const module = new Map(store.state().modules.value).get(148);
  assert.ok(module, 'login module 148 is present');
  return codec.unpack(SCHEMA, rawBinary(module.value[0]));
}

const rejected = (action, code = 1) => assert.throws(
  action,
  error => error instanceof GameError && error.code === code
);

test('creates module 148 with the two client defaults and a decodable login payload', t => {
  const env = setup(t, { omitted: true }), service = env.service();
  const repair = service.ensureLoginState();
  assert.deepEqual(repair.defaults, [10043200, 20013200]);
  const data = codec.unpack(SCHEMA, service.loginPayload());
  assert.deepEqual(data.res.map(row => Number(row.tid)), [10043200, 20013200]);
  assert.deepEqual(data.use, []);
  assert.deepEqual(data.trial, []);
  assert.deepEqual(data.last_use, []);
  env.reopen();
  assert.deepEqual(houseData(env.store).res.map(row => Number(row.tid)), [10043200, 20013200]);
});

test('88202 selects assistants and 88201 selects backgrounds for both scenes, with persistence', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  let result = service.execute(88202, { req: [
    { scene_tid: '1', assistant_tid: '10063200' },
    { scene_tid: '2', assistant_tid: '10023200' }
  ] });
  assert.equal(result.schema, 'pb_house_assistant_use_rsp');
  assert.deepEqual(codec.unpack('pb_house_assistant_use_rsp', result.data).use.map(row => ({
    scene: Number(row.scene_tid), assistant: Number(row.use_assistant ?? 0), bg: Number(row.use_bg ?? 0)
  })), [
    { scene: 1, assistant: 10063200, bg: 0 },
    { scene: 2, assistant: 10023200, bg: 0 }
  ]);

  result = service.execute(88201, { req: [
    { scene_tid: '1', assistant_tid: '20013200' },
    { scene_tid: '2', assistant_tid: '20023200' }
  ] });
  assert.equal(result.schema, 'pb_house_assistant_use_rsp');
  assert.deepEqual(houseData(env.store).use.map(row => ({
    scene: Number(row.scene_tid), assistant: Number(row.use_assistant ?? 0), bg: Number(row.use_bg ?? 0)
  })), [
    { scene: 1, assistant: 10063200, bg: 20013200 },
    { scene: 2, assistant: 10023200, bg: 20023200 }
  ]);
  env.reopen();
  assert.equal(houseData(env.store).use[0].use_assistant, '10063200');
  assert.equal(houseData(env.store).use[0].use_bg, '20013200');
});

test('accepts the live single-selection payload and zero ids for unselected scenes', t => {
  const env = setup(t, {
    initialState: defaultState({ use: [{ scene_tid: '1', use_assistant: '10063200' }] })
  }), service = env.service();
  service.ensureLoginState();

  let result = service.execute(88202, { req: [
    { scene_tid: 1, assistant_tid: 10063200 },
    { scene_tid: 2 }
  ] });
  assert.equal(result.schema, 'pb_house_assistant_use_rsp');
  assert.deepEqual(codec.unpack('pb_house_assistant_use_rsp', result.data).use.map(row => ({
    scene: Number(row.scene_tid), assistant: Number(row.use_assistant ?? 0), bg: Number(row.use_bg ?? 0)
  })), [
    { scene: 1, assistant: 10063200, bg: 0 },
    { scene: 2, assistant: 0, bg: 0 }
  ]);

  result = service.execute(88201, { req: [
    { scene_tid: 1, assistant_tid: 20013200 },
    { scene_tid: 2, assistant_tid: 0 }
  ] });
  assert.equal(result.schema, 'pb_house_assistant_use_rsp');
  assert.deepEqual(houseData(env.store).use.map(row => ({
    scene: Number(row.scene_tid), assistant: Number(row.use_assistant ?? 0), bg: Number(row.use_bg ?? 0)
  })), [
    { scene: 1, assistant: 10063200, bg: 20013200 },
    { scene: 2, assistant: 0, bg: 0 }
  ]);
});

test('migrates the legacy single-scene house-assistant payload', t => {
  const legacy = codec.pack('pb_house_assistant_info_old', {
    res: [
      { tid: '10043200', num: '1' },
      { tid: '20013200', num: '1' }
    ],
    use_bg: 20013200,
    use_assistant: 10043200
  });
  const env = setup(t, { rawModule: legacy }), service = env.service();
  const repair = service.ensureLoginState();
  assert.deepEqual(repair.defaults, []);
  assert.deepEqual(houseData(env.store).use, [
    { scene_tid: '1', use_bg: '20013200', use_assistant: '10043200' }
  ]);
  assert.deepEqual(codec.unpack(SCHEMA, service.loginPayload()).use, [
    { scene_tid: '1', use_bg: '20013200', use_assistant: '10043200' }
  ]);
});

test('88203 starts configured trials and 88204 restores last_use after the final cancellation', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  service.execute(88202, { req: [{ scene_tid: 1, assistant_tid: 10063200 }] });
  service.execute(88201, { req: [{ scene_tid: 1, assistant_tid: 20013200 }] });
  const beforeTrial = houseData(env.store).use;

  let result = service.execute(88203, {
    trial_id_list: [1, 2],
    req: [
      { scene_tid: 1, assistant_tid: 10163200 },
      { scene_tid: 1, assistant_tid: 20133200 }
    ]
  });
  assert.equal(result.schema, 'pb_house_assistant_trial_rsp');
  let data = codec.unpack('pb_house_assistant_trial_rsp', result.data).info;
  assert.deepEqual(data.trial.map(row => [Number(row.id), Number(row.deadline)]), [
    [1, Math.floor(START / 1000) + 259200],
    [2, Math.floor(START / 1000) + 259200]
  ]);
  assert.equal(Number(data.use[0].use_assistant), 10163200);
  assert.equal(Number(data.use[0].use_bg), 20133200);
  assert.deepEqual(data.last_use, beforeTrial);

  result = service.execute(88204, { trial_id_list: [1] });
  data = codec.unpack('pb_house_assistant_trial_rsp', result.data).info;
  assert.deepEqual(data.trial.map(row => Number(row.id)), [2]);
  assert.equal(Number(data.use[0].use_assistant), 10163200);
  assert.deepEqual(data.last_use, beforeTrial);

  result = service.execute(88204, { trial_id_list: [2] });
  data = codec.unpack('pb_house_assistant_trial_rsp', result.data).info;
  assert.deepEqual(data.trial, []);
  assert.deepEqual(data.use, beforeTrial);
  assert.deepEqual(data.last_use, []);
  env.reopen();
  assert.deepEqual(houseData(env.store).use, beforeTrial);
});

test('expired trials are removed at login and restore the pre-trial selection', t => {
  let current = START;
  const env = setup(t, { now: () => current }), service = env.service();
  service.ensureLoginState();
  service.execute(88202, { req: [{ scene_tid: 1, assistant_tid: 10063200 }] });
  service.execute(88203, {
    trial_id_list: [1],
    req: [{ scene_tid: 1, assistant_tid: 10163200 }]
  });
  current += 259201 * 1000;
  const repair = service.ensureLoginState();
  assert.deepEqual(repair.expired, [1]);
  assert.equal(repair.restored, true);
  const data = houseData(env.store);
  assert.equal(data.use[0].use_assistant, '10063200');
  assert.deepEqual(data.trial, []);
  assert.deepEqual(data.last_use, []);
});

test('rejects invalid scenes, wrong kinds, unowned items, malformed trials and active-trial changes atomically', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const before = houseData(env.store);
  rejected(() => service.execute(88202, { req: [{ scene_tid: 99, assistant_tid: 10063200 }] }));
  rejected(() => service.execute(88202, { req: [{ scene_tid: 1, assistant_tid: 20013200 }] }));
  rejected(() => service.execute(88202, { req: [{ scene_tid: 1, assistant_tid: 10053200 }] }));
  rejected(() => service.execute(88201, { req: [{ scene_tid: 1, assistant_tid: 10063200 }] }));
  rejected(() => service.execute(88203, { trial_id_list: [99], req: [{ scene_tid: 1, assistant_tid: 10163200 }] }));
  rejected(() => service.execute(88203, {
    trial_id_list: [1, 2],
    req: [{ scene_tid: 1, assistant_tid: 10163200 }]
  }));
  assert.deepEqual(houseData(env.store), before);

  service.execute(88203, { trial_id_list: [1], req: [{ scene_tid: 1, assistant_tid: 10163200 }] });
  const duringTrial = houseData(env.store);
  rejected(() => service.execute(88202, { req: [{ scene_tid: 1, assistant_tid: 10063200 }] }));
  assert.deepEqual(houseData(env.store), duringTrial);
  assert.equal(service.supports(88205), false);
});

test('rolls back module 148 when a response cannot be encoded', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const before = houseData(env.store);
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_house_assistant_use_rsp') throw new Error('forced house-assistant response failure');
      return codec.pack(name, value);
    }
  };
  assert.throws(() => env.service({ codec: brokenCodec }).execute(88202, {
    req: [{ scene_tid: 1, assistant_tid: 10063200 }]
  }), /forced house-assistant response failure/);
  assert.deepEqual(houseData(env.store), before);
});
