import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createFantasyEquipmentInventory } from '../game/fantasy-equipment-inventory.mjs';
import {
  ARTIFACT_DRAW_ACT_COMMANDS,
  ARTIFACT_DRAW_TASK_MULTI,
  artifactDrawTaskBitIndex,
  createArtifactDrawActService
} from '../game/artifact-draw-act-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const openedAt = 1792789200;
const clockStart = 1793409600;
const ACT = Object.freeze({
  trial: 159001,
  task: 159002,
  draw: 159003,
  next: 159004,
  claim: 159005,
  synth: 159006,
  equipment: 159007
});
const resourceTids = [670002, 671002, 672002, 673002, 674002, 675002, 676002, 677002, 713002, 715002, 300610, 300710, 300810, 300910, 400110, 400210, 391002, 392002];

function seed() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: openedAt,
    modules: structuredClone(capture.privateFlows[0].decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30 }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-artifact-draw-act-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const clock = { seconds: options.seconds ?? clockStart };
  const randomQueue = [];
  const random = () => randomQueue.length ? randomQueue.shift() : 0.99;
  const activeCodec = options.codec ?? codec;
  const activeTables = options.tables ?? tables;
  const inventory = createFantasyEquipmentInventory({ codec: activeCodec, tables: activeTables });
  let store, service;

  function open() {
    store = createGameStore({ databasePath, seed, codec: activeCodec, serverOpenedAt: openedAt });
    service = createArtifactDrawActService({
      store,
      codec: activeCodec,
      tables: activeTables,
      inventory,
      now: () => clock.seconds,
      random,
      assertOpen: options.assertOpen ?? null,
      assertChallengeOpen: options.assertChallengeOpen ?? null,
      bombPlanner: options.bombPlanner ?? null,
      resolveNormalAward: options.resolveNormalAward ?? (({ cell }) => ({ tid: 391002, num: 2, index: cell }))
    });
  }

  open();
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    clock,
    setRandom(values) { randomQueue.splice(0, randomQueue.length, ...values); },
    get store() { return store; },
    get service() { return service; },
    reopen() { store.close(); open(); }
  };
}

function seedResources(store, amount = 10000, ids = resourceTids) {
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

function setResource(store, tid, amount) {
  store.transaction(model => {
    const key = String(tid);
    const current = model.resources.get(key);
    assert.ok(current, `Missing resource fixture ${tid}`);
    current.num = String(amount);
  });
}

function stateOf(store, actTid) {
  return store.read().state.artifactDrawActs?.activities?.[String(actTid)];
}

function moduleBytes(store, moduleId) {
  const module = new Map(store.state().modules.value).get(moduleId);
  return module?.value.map(rawBinary) ?? [];
}

function bitAt(value, index) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value ?? '', 'base64');
  return Boolean(bytes[Math.floor(index / 8)] & (1 << (index % 8)));
}

function codeIs(expected) {
  return error => error?.code === expected;
}

function persistenceSnapshot(store) {
  const model = store.read();
  return {
    artifactDrawActs: structuredClone(model.state.artifactDrawActs ?? null),
    resources: [...model.resources.values()]
      .map(row => ({ tid: row.tid, num: row.num, location: structuredClone(row.location) }))
      .sort((left, right) => left.tid.localeCompare(right.tid))
  };
}

function codecFailingOn(schema) {
  return {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === schema) throw new Error(`injected ${schema} failure`);
      return codec.pack(name, value);
    }
  };
}

function installCommitFailure(store) {
  store.inspect(db => db.exec("CREATE TRIGGER fail_artifact_commit BEFORE INSERT ON roles BEGIN SELECT RAISE(ABORT,'injected artifact sqlite failure'); END"));
}

function dropCommitFailure(store) {
  store.inspect(db => db.exec('DROP TRIGGER fail_artifact_commit'));
}

function copyTablesWithActivities(mutate) {
  const activities = new Map(tables.Activity);
  mutate(activities);
  return { ...tables, Activity: activities };
}

function setModule518(store) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(518);
    if (!module) module = { value: [], improper: false };
    while (module.value.length < 3) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[1] = serializedBinary(codec.pack('pb_fantasy_formation_list', {
      formation_list: [{ uid: 7, slot_index: 3 }]
    }));
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', {
      wish_list: [1200119], total_draw_times: '9', left_buy_times: 7
    }));
    modules.set(518, module);
    model.state.modules.value = [...modules];
  });
}

function finishFinalTurn(store, actTid) {
  store.transaction(model => {
    const activity = model.state.artifactDrawActs.activities[String(actTid)];
    assert.ok(activity);
    activity.fragments.turn = 7;
    activity.fragments.turn_over = true;
    activity.fragments.unclaimed_list = [];
    activity.server.cur_turn = 7;
  });
}

const FORGED_COMMAND_FIELDS = Object.freeze({
  cost_tid: 999999,
  draw_times: 999,
  got_special: true,
  bomb: true,
  awards: [{ tid: 999999, num: 999, index: 99 }],
  res_changes: { changes: [{ tid: 999999, num: 999 }], is_overflow: true },
  changes: [{ tid: 999999, num: 999 }],
  turn: 999,
  cur_turn: 999,
  is_synthesis: false
});

const ARTIFACT_COMMAND_MATRIX = Object.freeze([
  {
    command: 101801,
    version: 1,
    request: () => ({ act_tid: ACT.trial, challenge_tid: 1, task_id: [101] }),
    invalidRequest: () => ({ act_tid: ACT.trial, challenge_tid: 999, task_id: [101] }),
    prepare: f => f.service.recordTrialFight(ACT.trial, 1, 150000),
    prepareInsufficient() {},
    duplicate(f, request) {
      const repeated = f.service.execute(this.command, request);
      assert.equal(repeated.value.changes.length, 0);
    }
  },
  {
    command: 101802,
    version: 2,
    request: () => ({ act_tid: ACT.task, task_ids: [2101] }),
    invalidRequest: () => ({ act_tid: ACT.task, task_ids: [] }),
    prepare: f => f.service.recordArtifactDraw(ACT.task, 5),
    prepareInsufficient() {},
    duplicateCode: 310
  },
  {
    command: 101803,
    version: 3,
    request: () => ({ act_tid: ACT.draw, index: 1 }),
    invalidRequest: () => ({ act_tid: ACT.draw, index: 0 }),
    prepare() {},
    prepareInsufficient(f) {
      setResource(f.store, 670002, 0);
      setResource(f.store, 677002, 0);
    },
    duplicateCode: 1
  },
  {
    command: 101804,
    version: 4,
    request: () => ({ act_tid: ACT.next }),
    invalidRequest: () => ({}),
    prepare(f) {
      f.service.execute101803({ act_tid: ACT.next, index: 1 });
      f.service.execute101803({ act_tid: ACT.next, index: 2 });
      f.service.execute101805({ act_tid: ACT.next });
    },
    prepareInsufficient() {},
    duplicateCode: 308
  },
  {
    command: 101805,
    version: 5,
    request: () => ({ act_tid: ACT.claim }),
    invalidRequest: () => ({}),
    prepare: f => f.service.execute101803({ act_tid: ACT.claim, index: 1 }),
    prepareInsufficient() {},
    duplicateCode: 308
  },
  {
    command: 101806,
    version: 6,
    request: () => ({ act_tid: ACT.synth }),
    invalidRequest: () => ({}),
    prepare(f) {
      f.service.inspect(ACT.synth);
      finishFinalTurn(f.store, ACT.synth);
    },
    prepareInsufficient(f) {
      f.service.inspect(ACT.synth);
      finishFinalTurn(f.store, ACT.synth);
      setResource(f.store, 674002, 0);
    },
    duplicateCode: 310
  }
]);

function matrixFixture(t, options = {}) {
  return fixture(t, {
    ...options,
    bombPlanner: options.bombPlanner ?? (({ activity, drawTimes }) => Number(activity.act_tid) === ACT.next && drawTimes === 2)
  });
}

for (const matrix of ARTIFACT_COMMAND_MATRIX) {
  test(`${matrix.command} safety matrix covers validation, rollback, repetition and restart`, t => {
    const f = matrixFixture(t);
    seedResources(f.store);
    matrix.prepare(f);
    const prepared = persistenceSnapshot(f.store);
    const request = { ...matrix.request(), ...FORGED_COMMAND_FIELDS };

    assert.throws(() => f.service.execute(matrix.command, matrix.invalidRequest()), codeIs(1));
    assert.deepEqual(persistenceSnapshot(f.store), prepared);
    assert.throws(() => f.service.execute(matrix.command, { ...request, act_tid: matrix.version }), codeIs(1));
    assert.deepEqual(persistenceSnapshot(f.store), prepared);

    const result = f.service.execute(matrix.command, request);
    assert.equal(result.schema, ARTIFACT_DRAW_ACT_COMMANDS[matrix.command].response);
    assert.doesNotThrow(() => codec.unpack(result.schema, result.data));
    assert.notDeepEqual(persistenceSnapshot(f.store), prepared);

    if (matrix.duplicate) matrix.duplicate(f, request);
    else assert.throws(() => f.service.execute(matrix.command, request), codeIs(matrix.duplicateCode));
    const afterDuplicate = persistenceSnapshot(f.store);
    f.reopen();
    assert.deepEqual(persistenceSnapshot(f.store), afterDuplicate);

    const insufficient = matrixFixture(t);
    seedResources(insufficient.store);
    matrix.prepareInsufficient(insufficient);
    const beforeInsufficient = persistenceSnapshot(insufficient.store);
    assert.throws(() => insufficient.service.execute(matrix.command, request), codeIs(matrix.command === 101803 || matrix.command === 101806 ? 301 : 308));
    assert.deepEqual(persistenceSnapshot(insufficient.store), beforeInsufficient);

    const closed = matrixFixture(t, { assertOpen: () => false });
    seedResources(closed.store);
    const beforeClosed = persistenceSnapshot(closed.store);
    assert.throws(() => closed.service.execute(matrix.command, request), codeIs(305));
    assert.deepEqual(persistenceSnapshot(closed.store), beforeClosed);

    const responseSchema = ARTIFACT_DRAW_ACT_COMMANDS[matrix.command].response;
    const encoded = matrixFixture(t, { codec: codecFailingOn(responseSchema) });
    seedResources(encoded.store);
    matrix.prepare(encoded);
    const beforeEncoded = persistenceSnapshot(encoded.store);
    assert.throws(() => encoded.service.execute(matrix.command, request), new RegExp(`injected ${responseSchema} failure`));
    assert.deepEqual(persistenceSnapshot(encoded.store), beforeEncoded);

    const failed = matrixFixture(t);
    seedResources(failed.store);
    matrix.prepare(failed);
    const beforeSqliteFailure = persistenceSnapshot(failed.store);
    installCommitFailure(failed.store);
    try {
      assert.throws(() => failed.service.execute(matrix.command, request), /injected artifact sqlite failure/);
    } finally {
      dropCommitFailure(failed.store);
    }
    assert.deepEqual(persistenceSnapshot(failed.store), beforeSqliteFailure);
  });
}

test('activity ids map through Activity to versions 1..14 and login payloads stay unwrapped', t => {
  for (let version = 1; version <= 14; version += 1) {
    const row = tables.Activity.get(159000 + version);
    assert.equal(row.func, 159);
    assert.equal(row.version, version);
    assert.equal(tables.ArtifactDrawVersion.get(version).tid, version);
  }
  const f = fixture(t);
  const module183Before = moduleBytes(f.store, 183);
  const payloads = f.service.loginPayloads({ actTids: [ACT.trial, 159014] });
  assert.equal(payloads.moduleId, 183);
  assert.equal(payloads.entrySchema, 'pb_act_role_login');
  assert.deepEqual(payloads.payloadWrapper, { prefix: '836d', length: 'uint32be', headerBytes: 6 });
  assert.equal(payloads.playerList.data[0], 0x0a);
  const players = codec.unpack('pb_artifact_draw_player_list', payloads.playerList.data);
  const servers = codec.unpack('pb_artifact_draw_server_list', payloads.serverList.data);
  assert.deepEqual(players.act_data_list.map(value => value.act_tid), [ACT.trial, 159014]);
  assert.deepEqual(servers.act_data_list.map(value => value.act_tid), [ACT.trial, 159014]);
  assert.deepEqual(moduleBytes(f.store, 183), module183Before);
  assert.throws(() => f.service.loginPayloads({ actTids: [1] }), codeIs(1));
  assert.throws(() => f.service.execute101803({ act_tid: 1, index: 1 }), codeIs(1));
  assert.equal(tables.Activity.get(183013), undefined);
  assert.throws(() => f.service.execute101803({ act_tid: 183013, index: 1 }), codeIs(1));
});

test('all six command responses use their exact protobuf schemas', t => {
  const f = fixture(t, {
    bombPlanner: ({ activity }) => Number(activity.act_tid) === ACT.next,
    resolveNormalAward: ({ cell }) => ({ tid: 391002, num: 2, index: cell })
  });
  seedResources(f.store);
  const module518Before = moduleBytes(f.store, 518);

  f.service.recordTrialFight(ACT.trial, 1, 150000);
  const r1 = f.service.execute101801({ act_tid: ACT.trial, challenge_tid: 1, task_id: [101] });
  f.service.recordArtifactDraw(ACT.task, 5);
  const r2 = f.service.execute101802({ act_tid: ACT.task, task_ids: [2101] });
  const r3 = f.service.execute101803({ act_tid: ACT.draw, index: 1 });
  const bomb = f.service.execute101803({ act_tid: ACT.next, index: 1 });
  assert.equal(bomb.value.bomb, true);
  const r4 = f.service.execute101804({ act_tid: ACT.next });
  f.service.execute101803({ act_tid: ACT.claim, index: 1 });
  const r5 = f.service.execute101805({ act_tid: ACT.claim });
  f.service.inspect(ACT.synth);
  finishFinalTurn(f.store, ACT.synth);
  const r6 = f.service.execute101806({ act_tid: ACT.synth });

  const results = { 101801: r1, 101802: r2, 101803: r3, 101804: r4, 101805: r5, 101806: r6 };
  for (const [command, result] of Object.entries(results)) {
    const schema = ARTIFACT_DRAW_ACT_COMMANDS[command].response;
    assert.equal(result.schema, schema);
    assert.doesNotThrow(() => codec.unpack(schema, result.data));
  }
  assert.deepEqual(moduleBytes(f.store, 518), module518Before);
});

test('trial and draw task claim bytes use task_tid % 1000 in independent bitsets', t => {
  const f = fixture(t);
  f.service.recordTrialFight(ACT.trial, 1, 150000);
  f.service.recordArtifactDraw(ACT.trial, 1);
  const result = f.service.execute101802({ act_tid: ACT.trial, task_ids: [1001, 1101] });
  const response = codec.unpack('pb_artifact_draw_task_award_rsp', result.data);
  assert.equal(ARTIFACT_DRAW_TASK_MULTI, 1000);
  assert.equal(artifactDrawTaskBitIndex(1001), 1);
  assert.equal(artifactDrawTaskBitIndex(1101), 101);
  assert.equal(bitAt(response.daily_award_state, 1), true);
  assert.equal(bitAt(response.daily_award_state, 101), false);
  assert.equal(bitAt(response.period_award_state, 101), true);
  assert.equal(bitAt(response.period_award_state, 1), false);
  const login = f.service.loginPayloads({ actTids: [ACT.trial] });
  const player = codec.unpack('pb_artifact_draw_player_list', login.playerList.data).act_data_list[0];
  assert.equal(bitAt(player.daily_award_state, 1), true);
  assert.equal(bitAt(player.period_award_state, 101), true);
  assert.throws(() => f.service.execute101802({ act_tid: ACT.trial, task_ids: [1001] }), codeIs(310));
});

test('invalid item in a task batch rolls back every task reward and claim bit', t => {
  const f = fixture(t);
  f.service.recordArtifactDraw(ACT.task, 5);
  const before = resource(f.store, 676002);
  assert.throws(() => f.service.execute101802({ act_tid: ACT.task, task_ids: [2101, 999999] }), codeIs(1));
  assert.equal(resource(f.store, 676002), before);
  assert.deepEqual(stateOf(f.store, ACT.task).period.claims, []);
  assert.throws(() => f.service.execute101802({ act_tid: ACT.task, task_ids: [2101, 2101] }), codeIs(1));
  assert.deepEqual(stateOf(f.store, ACT.task).period.claims, []);
});

test('fragment claim precedes next turn and duplicate cells or settlements are rejected', t => {
  const f = fixture(t, { bombPlanner: ({ drawTimes }) => drawTimes === 2 });
  seedResources(f.store);
  const freeBefore = resource(f.store, 670002);
  const paidBefore = resource(f.store, 677002);
  const first = f.service.execute101803({
    act_tid: ACT.draw, index: 1, cost_tid: 999999, draw_times: 999,
    awards: [{ tid: 999999, num: 999 }], got_special: true
  });
  assert.equal(first.value.got_special, false);
  assert.equal(resource(f.store, 670002), freeBefore - 1n);
  assert.throws(() => f.service.execute101803({ act_tid: ACT.draw, index: 1 }), codeIs(1));
  assert.throws(() => f.service.execute101804({ act_tid: ACT.draw }), codeIs(308));
  f.service.execute101803({ act_tid: ACT.draw, index: 2 });
  assert.equal(resource(f.store, 677002), paidBefore - 1n);
  assert.throws(() => f.service.execute101804({ act_tid: ACT.draw }), codeIs(308));
  const claim = f.service.execute101805({ act_tid: ACT.draw });
  assert.equal(claim.value.awards.length, 1);
  assert.throws(() => f.service.execute101805({ act_tid: ACT.draw }), codeIs(308));
  const next = f.service.execute101804({ act_tid: ACT.draw });
  assert.equal(next.value.turn, 2);
  assert.throws(() => f.service.execute101804({ act_tid: ACT.draw }), codeIs(308));
  finishFinalTurn(f.store, ACT.draw);
  assert.throws(() => f.service.execute101804({ act_tid: ACT.draw }), codeIs(308));
});

test('synthesis is rejected until a settled and claimed final round', t => {
  const f = fixture(t);
  seedResources(f.store);
  const chipBefore = resource(f.store, 674002);
  assert.throws(() => f.service.execute101806({ act_tid: ACT.synth }), codeIs(308));
  assert.equal(resource(f.store, 674002), chipBefore);
  f.service.execute101803({ act_tid: ACT.synth, index: 1 });
  assert.throws(() => f.service.execute101806({ act_tid: ACT.synth }), codeIs(308));
  f.service.execute101805({ act_tid: ACT.synth });
  assert.throws(() => f.service.execute101806({ act_tid: ACT.synth }), codeIs(308));
  assert.equal(resource(f.store, 674002), chipBefore);
  finishFinalTurn(f.store, ACT.synth);
  const synthesized = f.service.execute101806({ act_tid: ACT.synth });
  assert.equal(resource(f.store, 674002), chipBefore - 1n);
  assert.equal(synthesized.value.res_changes.changes.length, 2);
  assert.throws(() => f.service.execute101806({ act_tid: ACT.synth }), codeIs(310));
});

test('daily state refreshes while period claims survive restart', t => {
  const f = fixture(t);
  f.service.recordTrialFight(ACT.trial, 1, 150000);
  f.service.recordArtifactDraw(ACT.trial, 1);
  f.service.execute101802({ act_tid: ACT.trial, task_ids: [1001, 1101] });
  const oldDailyTime = stateOf(f.store, ACT.trial).daily_time;
  f.clock.seconds += 86400;
  const refreshed = f.service.inspect(ACT.trial).state;
  assert.ok(refreshed.daily_time > oldDailyTime);
  assert.deepEqual(refreshed.daily.claims, []);
  assert.deepEqual(refreshed.period.claims, [1101]);
  assert.equal(refreshed.period.counters.special_draws, 1);
  assert.equal(refreshed.daily.counters.special_draws, 0);
  assert.equal(refreshed.fight_record.acc_dmg, '0');
  assert.deepEqual(refreshed.fight_record.claimed_tasks, []);
  f.reopen();
  const restored = f.service.inspect(ACT.trial).state;
  assert.deepEqual(restored.period.claims, [1101]);
  assert.deepEqual(restored.daily.claims, []);
});

test('closed and unknown activities, bad ids and bad indices reject without cost', t => {
  const closed = fixture(t, { assertOpen: () => false });
  seedResources(closed.store);
  const before = resource(closed.store, 670002);
  assert.throws(() => closed.service.execute101803({ act_tid: ACT.draw, index: 1 }), codeIs(305));
  assert.equal(resource(closed.store, 670002), before);
  assert.equal(stateOf(closed.store, ACT.draw), undefined);

  const f = fixture(t);
  assert.throws(() => f.service.execute101803({ act_tid: 183013, index: 1 }), codeIs(1));
  assert.throws(() => f.service.execute101803({ act_tid: 999999, index: 1 }), codeIs(1));
  assert.throws(() => f.service.execute101803({ act_tid: ACT.draw, index: 0 }), codeIs(1));
  assert.throws(() => f.service.execute101803({ act_tid: ACT.draw, index: 43 }), codeIs(1));
  assert.throws(() => f.service.execute101801({ act_tid: ACT.trial, challenge_tid: 999, task_id: [101] }), codeIs(1));
  assert.throws(() => f.service.execute101802({ act_tid: ACT.task, task_ids: [999999] }), codeIs(1));
  assert.throws(() => f.service.execute101802({ act_tid: ACT.task, task_ids: [] }), codeIs(1));
  assert.throws(() => f.service.execute(101899, {}), codeIs(5));
});

test('encoding and SQLite failures roll back draw cost and activity state', t => {
  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === 'pb_artifact_fragments_draw_rsp') throw new Error('injected artifact response failure');
      return codec.pack(name, value);
    }
  };
  const encoded = fixture(t, { codec: brokenCodec });
  seedResources(encoded.store);
  const encodedBefore = resource(encoded.store, 670002);
  assert.throws(() => encoded.service.execute101803({ act_tid: ACT.draw, index: 1 }), /injected artifact response failure/);
  assert.equal(resource(encoded.store, 670002), encodedBefore);
  assert.equal(stateOf(encoded.store, ACT.draw), undefined);

  const failed = fixture(t);
  seedResources(failed.store);
  const sqliteBefore = resource(failed.store, 670002);
  failed.store.inspect(db => db.exec("CREATE TRIGGER fail_artifact_cost BEFORE INSERT ON resources WHEN NEW.tid='670002' BEGIN SELECT RAISE(ABORT,'injected sqlite failure'); END"));
  try {
    assert.throws(() => failed.service.execute101803({ act_tid: ACT.draw, index: 1 }), /injected sqlite failure/);
  } finally {
    failed.store.inspect(db => db.exec('DROP TRIGGER fail_artifact_cost'));
  }
  assert.equal(resource(failed.store, 670002), sqliteBefore);
  assert.equal(stateOf(failed.store, ACT.draw), undefined);
});

test('equipment rewards update module 518 block 0 without overwriting blocks 1 and 2', t => {
  const f = fixture(t, { resolveNormalAward: ({ cell }) => ({ tid: 1200119, num: 1, index: cell }) });
  seedResources(f.store);
  setModule518(f.store);
  const before = moduleBytes(f.store, 518);
  f.service.execute101803({ act_tid: ACT.equipment, index: 1 });
  const claimed = f.service.execute101805({ act_tid: ACT.equipment });
  const after = moduleBytes(f.store, 518);
  assert.deepEqual(after[1], before[1]);
  assert.deepEqual(after[2], before[2]);
  const inventory = codec.unpack('pb_fantasy_equip_res', after[0]);
  assert.equal(inventory.equips.length, 1);
  assert.equal(inventory.equips[0].tid, '1200119');
  assert.ok(claimed.value.res_changes.changes.some(change => change.extra?.length));
});

test('two concurrent claims allow exactly one winner', async t => {
  const f = fixture(t);
  seedResources(f.store);
  f.service.execute101803({ act_tid: ACT.claim, index: 1 });
  const before = resource(f.store, 391002);
  const workerSource = String.raw`
    import { parentPort, workerData } from 'node:worker_threads';
    const [{ createGameCodec }, { createGameStore }, { readGameTables }, { createArtifactDrawActService }] = await Promise.all([
      import(workerData.codecUrl), import(workerData.storeUrl), import(workerData.tablesUrl), import(workerData.serviceUrl)
    ]);
    const codec = createGameCodec();
    const store = createGameStore({ databasePath: workerData.databasePath, codec, serverOpenedAt: workerData.openedAt });
    const service = createArtifactDrawActService({ store, codec, tables: readGameTables(), now: () => workerData.now, random: () => 0.99 });
    try {
      const result = service.execute101805({ act_tid: workerData.actTid });
      parentPort.postMessage({ ok: true, awards: result.value.awards.length });
    } catch (error) {
      parentPort.postMessage({ ok: false, code: error?.code ?? null, message: String(error?.message ?? error) });
    } finally {
      store.close();
    }
  `;
  const workerUrl = new URL('data:text/javascript,' + encodeURIComponent(workerSource));
  const common = {
    databasePath: f.databasePath,
    openedAt,
    now: f.clock.seconds,
    actTid: ACT.claim,
    codecUrl: new URL('../protocol/game-codec.mjs', import.meta.url).href,
    storeUrl: new URL('../storage/game-store.mjs', import.meta.url).href,
    tablesUrl: new URL('../config/game-tables.mjs', import.meta.url).href,
    serviceUrl: new URL('../game/artifact-draw-act-service.mjs', import.meta.url).href
  };
  const run = () => new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { workerData: common });
    worker.once('message', resolve);
    worker.once('error', reject);
  });
  const results = await Promise.all([run(), run()]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.filter(result => !result.ok && result.code === 308).length, 1);
  assert.equal(resource(f.store, 391002), before + 2n);
  assert.equal(stateOf(f.store, ACT.claim).fragments.claimed_list.length, 1);
});

test('M3 activity callback resolves version ids and rejects forged mismatches', t => {
  const f = fixture(t);
  assert.throws(() => f.service.recordArtifactDraw(1, 2), codeIs(1));
  assert.deepEqual(f.service.recordArtifactDraw(ACT.trial, 2), { act_tid: ACT.trial, version: 1, count: 2 });
  const viaEvent = f.store.transaction(model => f.service.onFantasyDraw(model, {
    pool: 'artifact', count: 3, event: { version: 1 }, seconds: f.clock.seconds
  }));
  assert.deepEqual(viaEvent, { act_tid: ACT.trial, version: 1, count: 3 });
  assert.equal(stateOf(f.store, ACT.trial).period.counters.special_draws, 5);
  assert.throws(() => f.store.transaction(model => f.service.onFantasyDraw(model, {
    pool: 'artifact', act_tid: ACT.task, version: 1, count: 1, seconds: f.clock.seconds
  })), codeIs(5));
  assert.equal(stateOf(f.store, ACT.task), undefined);
  assert.deepEqual(f.service.recordRecharge(ACT.trial, 50), { recharge_value: 50 });

  const ambiguous = fixture(t, {
    tables: copyTablesWithActivities(activities => {
      activities.set(159099, { ...activities.get(ACT.trial), tid: 159099, version: 1 });
    })
  });
  assert.throws(() => ambiguous.store.transaction(model => ambiguous.service.onFantasyDraw(model, {
    pool: 'artifact', event: { version: 1 }, count: 1, seconds: ambiguous.clock.seconds
  })), codeIs(5));
  assert.equal(stateOf(ambiguous.store, ACT.trial), undefined);

  const missing = fixture(t, {
    tables: copyTablesWithActivities(activities => activities.delete(159014))
  });
  assert.throws(() => missing.store.transaction(model => missing.service.onFantasyDraw(model, {
    pool: 'artifact', version: 14, count: 1, seconds: missing.clock.seconds
  })), codeIs(5));
});
