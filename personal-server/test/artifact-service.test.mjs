import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createArtifactService, ARTIFACT_COMMANDS } from '../game/artifact-service.mjs';
import { readArtifactTables, UR_STAR_STONE_TID } from '../config/artifact-tables.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readArtifactTables();
const ACTOR = 10046;
const CHIP_LOW = 423002;          // Artifact 200110 chip
const CHIP_UR = 7001002;          // Artifact 400110 chip
const LEVEL_ITEM = 391002;        // Artifact level material
const BREAK_ITEM = 392002;        // Artifact breakthrough material
const FORGE_LOW = 13002;
const FORGE_MIDDLE = 14002;
const FORGE_HIGH = 15002;
const FLY_UP_ITEM = 647002;

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-artifact-service-',
    serverOpenedAt: 1700000000,
    seed: { roleId: ACTOR, role: { level: options.roleLevel ?? 40, nick_name: Buffer.from('Artifact Test') } }
  });
  const service = createArtifactService({ store: fixture.store, codec: options.codec ?? codec, tables, logger: options.logger });
  return { fixture, get store() { return fixture.store; }, get service() { return service; }, reopen: () => fixture.open() };
}

function addResource(store, tid, num) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= 0) groups.push({ value: [], improper: false });
    const entry = groups[0].value.length;
    groups[0].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, 0, entry] });
  });
}

function readInfo(store) {
  return store.transaction(model => {
    const module = new Map(model.state.modules.value).get(50);
    const bytes = rawBinary(module.value[0]);
    return bytes.length ? codec.unpack('pb_artifact_info', bytes) : { artifact_list: [] };
  });
}

function addArtifact(store, row) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(50);
    const bytes = rawBinary(module.value[0]);
    const info = bytes.length ? codec.unpack('pb_artifact_info', bytes) : { artifact_list: [], skill_list: [], lineup_list: [], fetter_list: [], inject_list: [], handbook_list: [] };
    info.artifact_list ??= [];
    info.artifact_list = info.artifact_list.filter(entry => Number(entry.tid) !== Number(row.tid));
    info.artifact_list.push(row);
    module.value[0] = serializedBinary(codec.pack('pb_artifact_info', info));
    model.state.modules.value = [...modules];
  });
}

function artifactRow(store, tid) {
  return readInfo(store).artifact_list.find(row => Number(row.tid) === Number(tid));
}

function owned(store, tid, overrides = {}) {
  const config = tables.artifact(tid);
  addArtifact(store, {
    tid: String(tid), num: 1, star: Number(config.init_star ?? 0), star_node: 0,
    forge_list: [0, 0, 0], stage: 0, quality: tables.qualityOf(tid), level: 0,
    break_level: 0, is_fly_up: false, artifact_skin: 0, ...overrides
  });
}

function resourceNum(store, tid) {
  return Number(store.transaction(model => model.resources.get(String(tid))?.num ?? 0));
}

const rejected = (action, code) => assert.throws(action, error => error instanceof GameError && error.code === code);

test('37060 raises star nodes, whole stars and UR stars from StarNode costs', t => {
  const env = setup(t);
  owned(env.store, 200110);
  addResource(env.store, CHIP_LOW, 1000);
  const first = codec.unpack('pb_artifact_back', env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 200110, times: 6 }).data);
  assert.equal(first.artifact.star, 1);
  assert.equal(Number(first.artifact.star_node ?? 0), 0);
  assert.equal(resourceNum(env.store, CHIP_LOW), 940);
  assert.deepEqual(first.res.changes.map(change => [change.tid, change.diff_num]), [[String(CHIP_LOW), '-60']]);

  const second = codec.unpack('pb_artifact_back', env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 200110, times: 2 }).data);
  assert.equal(second.artifact.star, 1);
  assert.equal(second.artifact.star_node, 2);
  assert.equal(resourceNum(env.store, CHIP_LOW), 920);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 200110, times: 5 }), 1);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 999999, times: 1 }), 5);

  owned(env.store, 400110);
  addResource(env.store, CHIP_UR, 1000);
  addResource(env.store, UR_STAR_STONE_TID, 5);
  const ur = codec.unpack('pb_artifact_back', env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 400110, times: 1 }).data);
  assert.equal(ur.artifact.star, 6);
  assert.equal(resourceNum(env.store, CHIP_UR), 840);
  assert.equal(resourceNum(env.store, UR_STAR_STONE_TID), 4);
});

test('37060 fails closed with 301 when chips or UR stones are missing', t => {
  const env = setup(t);
  owned(env.store, 400110);
  addResource(env.store, CHIP_UR, 1000);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 400110, times: 1 }), 301);
  assert.equal(Number(artifactRow(env.store, 400110).star ?? 5), 5);
});

test('37061 and 37068 consume ForgeType materials and promote a completed stage', t => {
  const env = setup(t);
  owned(env.store, 300610);
  for (const [tid, num] of [[FORGE_LOW, 100], [FORGE_MIDDLE, 100], [FORGE_HIGH, 100]]) addResource(env.store, tid, num);
  const stage = tables.forge(300610, 0);
  const [lowType, lowCount] = stage.forge_count[0];
  const forged = codec.unpack('pb_artifact_back', env.service.execute(ARTIFACT_COMMANDS.strength, {
    tid: 300610, forge_list: [{ type: lowType, forge_count: lowCount }]
  }).data);
  assert.deepEqual(forged.artifact.forge_list, [lowCount, 0, 0]);
  assert.equal(resourceNum(env.store, FORGE_LOW), 100 - lowCount);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.strength, { tid: 300610, forge_list: [{ type: 1, forge_count: 1 }] }), 1);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.forgePromote, 300610), 5);

  for (const [type, count] of stage.forge_count) {
    const remaining = count - artifactRow(env.store, 300610).forge_list[type - 1];
    if (remaining > 0) env.service.execute(ARTIFACT_COMMANDS.strength, { tid: 300610, forge_list: [{ type, forge_count: remaining }] });
  }
  const promoted = codec.unpack('pb_artifact', env.service.execute(ARTIFACT_COMMANDS.forgePromote, 300610).data);
  assert.equal(promoted.stage, 1);
  assert.deepEqual(promoted.forge_list, [Number(stage.forge_count[0][1]), Number(stage.forge_count[1][1]), Number(stage.forge_count[2][1])]);
});

test('37069 activates only satisfied fetters once and persists the list', t => {
  const env = setup(t);
  owned(env.store, 200110);
  owned(env.store, 200210);
  const activated = codec.unpack('pb_artifact_fetter', env.service.execute(ARTIFACT_COMMANDS.fetter, 200110).data);
  assert.ok(activated.fetter_list.includes(1));
  assert.deepEqual(readInfo(env.store).fetter_list, activated.fetter_list);
  const repeat = codec.unpack('pb_artifact_fetter', env.service.execute(ARTIFACT_COMMANDS.fetter, 200110).data);
  assert.deepEqual(repeat.fetter_list, []);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.fetter, 999999), 5);
});

test('37070 levels up through quality*10000+level rows and honours the breakthrough limit', t => {
  const env = setup(t);
  owned(env.store, 200110);
  addResource(env.store, LEVEL_ITEM, 100000);
  const limit = Number(tables.breakUp(40, 0).up_level_limit);
  const first = codec.unpack('pb_artifact_level_up_rsp', env.service.execute(ARTIFACT_COMMANDS.levelUp, { tid: 200110, times: 2 }).data);
  assert.equal(first.artifact.level, 2);
  const expected = tables.levelUp(40, 1).cost_num + tables.levelUp(40, 2).cost_num;
  assert.equal(resourceNum(env.store, LEVEL_ITEM), 100000 - expected);
  assert.deepEqual(first.res_change.changes.map(change => [change.tid, change.diff_num]), [[String(LEVEL_ITEM), String(-expected)]]);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.levelUp, { tid: 200110, times: limit }), 5);
});

test('37071 breakthrough needs role level, artifact level limit and material', t => {
  const env = setup(t);
  const limit = Number(tables.breakUp(40, 0).up_level_limit);
  owned(env.store, 200110, { level: limit });
  addResource(env.store, BREAK_ITEM, 100);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.breakLevelUp, 999999), 5);
  const next = tables.breakUp(40, 1);
  const result = codec.unpack('pb_artifact_break_level_up_rsp', env.service.execute(ARTIFACT_COMMANDS.breakLevelUp, 200110).data);
  assert.equal(result.artifact.break_level, 1);
  assert.equal(resourceNum(env.store, BREAK_ITEM), 100 - Number(next.cost_num));
  assert.deepEqual(result.res_change.changes.map(change => [change.tid, change.diff_num]), [[String(BREAK_ITEM), String(-Number(next.cost_num))]]);

  const low = setup(t);
  owned(low.store, 200110, { level: 0 });
  addResource(low.store, BREAK_ITEM, 100);
  rejected(() => low.service.execute(ARTIFACT_COMMANDS.breakLevelUp, 200110), 5);
});

test('37074 fly-up consumes the configured cost once and rejects a star limit above max star', t => {
  const env = setup(t);
  owned(env.store, 400110, { star: 6 });
  addResource(env.store, FLY_UP_ITEM, 20);
  const result = codec.unpack('pb_artifact_back', env.service.execute(ARTIFACT_COMMANDS.flyUp, 400110).data);
  assert.equal(result.artifact.is_fly_up, true);
  assert.equal(resourceNum(env.store, FLY_UP_ITEM), 10);
  rejected(() => env.service.execute(ARTIFACT_COMMANDS.flyUp, 400110), 5);

  const low = setup(t);
  owned(low.store, 300610, { star: 5 });
  addResource(low.store, FLY_UP_ITEM, 20);
  rejected(() => low.service.execute(ARTIFACT_COMMANDS.flyUp, 300610), 5);
});

test('37062/37072/37073/37075 fail closed with explicit unavailable errors', t => {
  const env = setup(t);
  owned(env.store, 200110);
  for (const type of [ARTIFACT_COMMANDS.quality, ARTIFACT_COMMANDS.inject, ARTIFACT_COMMANDS.handbookLevelUp, ARTIFACT_COMMANDS.changeSkin]) {
    rejected(() => env.service.execute(type, type === ARTIFACT_COMMANDS.handbookLevelUp ? { tid: 200110, times: 1 } : 200110), 5);
  }
});

test('artifact state survives a SQLite reopen and login normalisation is idempotent', t => {
  const env = setup(t);
  owned(env.store, 200110);
  addResource(env.store, CHIP_LOW, 100);
  env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 200110, times: 6 });
  env.reopen();
  const service = createArtifactService({ store: env.store, codec, tables });
  assert.equal(artifactRow(env.store, 200110).star, 1);
  assert.equal(resourceNum(env.store, CHIP_LOW), 40);
  const first = service.ensureLoginState();
  const second = service.ensureLoginState();
  assert.equal(first.changed, false);
  assert.equal(second.changed, false);
  assert.equal(artifactRow(env.store, 200110).star, 1);
});

test('PB encoding failure rolls back star-up state and resources', t => {
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_artifact_back') throw new Error('artifact encode failure');
      return codec.pack(name, value);
    }
  };
  const env = setup(t, { codec: failing });
  owned(env.store, 200110);
  addResource(env.store, CHIP_LOW, 100);
  assert.throws(() => env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 200110, times: 1 }), /artifact encode failure/);
  assert.equal(Number(artifactRow(env.store, 200110).star ?? 0), 0);
  assert.equal(resourceNum(env.store, CHIP_LOW), 100);
});

test('SQLite write rejection rolls back artifact state and resources', t => {
  const env = setup(t);
  owned(env.store, 200110);
  addResource(env.store, CHIP_LOW, 100);
  env.store.inspect(db => db.exec(
    "CREATE TRIGGER artifact_state_insert_reject BEFORE INSERT ON login_modules BEGIN SELECT RAISE(ABORT,'artifact_state_write_rejected'); END; CREATE TRIGGER artifact_state_update_reject BEFORE UPDATE ON login_modules BEGIN SELECT RAISE(ABORT,'artifact_state_write_rejected'); END;"
  ));
  assert.throws(() => env.service.execute(ARTIFACT_COMMANDS.synthesis, { tid: 200110, times: 1 }), /artifact_state_write_rejected/);
  env.store.inspect(db => db.exec('DROP TRIGGER artifact_state_insert_reject; DROP TRIGGER artifact_state_update_reject'));
  assert.equal(Number(artifactRow(env.store, 200110).star ?? 0), 0);
  assert.equal(resourceNum(env.store, CHIP_LOW), 100);
});