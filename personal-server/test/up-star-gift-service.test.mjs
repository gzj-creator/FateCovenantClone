import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readUpStarGiftTables } from '../config/up-star-gift-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { hasBit } from '../game/bit-block.mjs';
import {
  createUpStarGiftService, unwrapEtfBinary, wrapEtfBinary
} from '../game/up-star-gift-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const upStarTables = readUpStarGiftTables();
// 2026-11-01 has five func25 rows in their configured windows. The remaining
// func25 rows are historical configuration and must not be promoted to running.
const BASE_MS = Date.parse('2026-11-01T00:00:00Z');
const BASE_SECONDS = Math.floor(BASE_MS / 1000);
const RUNNING_VERSIONS = [40, 49, 52, 56, 111];
const RUNNING_ACTIVITY_IDS = [25042, 25051, 25053, 25056, 25111];
const EXPIRED_VERSION = 63;

function calendarAt(now = BASE_MS) {
  return createActivityCalendar({
    tables,
    serverOpenedAt: BASE_SECONDS,
    activityReferenceOpenedAt: null,
    mode: 'schedule',
    currentFishingActivityId: 1074011,
    now: () => now
  });
}

function seedActivity() {
  const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
  const template = capture.privateFlows.find(item => item.messageId === 'game:tcp-69:s2c:103').decoded;
  const modules = new Map(template[2].value);
  return codec.unpack('pb_act_login', rawBinary(modules.get(92)));
}

function upStarGroup(activity, gameTables = tables) {
  return activity.act_parallel_list.find(group =>
    group.states_data.some(state => Number(gameTables.Activity.get(Number(state.act_id))?.func) === 25));
}

function decodeMaster(group) {
  return codec.unpack('pb_up_star_gift_master', unwrapEtfBinary(group.module_login_data));
}

function createStubStore(modules, extras = {}) {
  let current = structuredClone(modules);
  return {
    state: () => ({ ...structuredClone(extras), roleId: 1, modules: { value: current, improper: false } }),
    transaction(run) {
      const model = { ...structuredClone(extras), state: { roleId: 1, modules: { value: structuredClone(current), improper: false } } };
      const result = run(model, {});
      current = model.state.modules.value;
      return result;
    },
    modules: () => current
  };
}

function serviceFor(store, {
  codec: override,
  now = BASE_MS,
  gameTables = tables,
  giftTables = upStarTables,
  calendar = calendarAt(now)
} = {}) {
  return createUpStarGiftService({
    store,
    codec: override ?? codec,
    tables: gameTables,
    upStarTables: giftTables,
    calendar,
    now: () => now,
    logger: () => {}
  });
}

function stubStoreFrom(activity) {
  return createStubStore([[92, serializedBinary(codec.pack('pb_act_login', activity))]]);
}

function activityRow(id, version) {
  return {
    ...tables.Activity.get(25072),
    tid: id,
    version,
    discard_time: 0,
    server_max_open_limited: 0
  };
}

function gameTablesWith(ids = [25002]) {
  const Activity = new Map(ids.map(id => [id, activityRow(id, id - 25000)]));
  return { ...tables, Activity };
}

function gift(id, version, extra = {}) {
  return {
    tid: id,
    type: 1199,
    version,
    targetCount: 0,
    starUnlock: 0,
    taskParam: 3030501,
    gift: 0,
    award: [[101500, 50]],
    oneKey: 0,
    ignoreRedDot: false,
    isSpecialShow: false,
    ...extra
  };
}

function addGiftTables(gifts) {
  const giftsById = new Map(upStarTables.giftsById);
  const giftsByVersion = new Map([...upStarTables.giftsByVersion].map(([version, rows]) => [version, [...rows]]));
  for (const row of gifts) {
    giftsById.set(row.tid, row);
    const rows = giftsByVersion.get(row.version) ?? [];
    rows.push(row);
    rows.sort((left, right) => left.tid - right.tid);
    giftsByVersion.set(row.version, rows);
  }
  return { ...upStarTables, giftsById, giftsByVersion };
}

function withoutVersion(giftTables, version = 2) {
  const giftsById = new Map([...giftTables.giftsById].filter(([, row]) => row.version !== version));
  const giftsByVersion = new Map([...giftTables.giftsByVersion].filter(([key]) => key !== version));
  const showsByVersion = new Map([...giftTables.showsByVersion].filter(([key]) => key !== version));
  return { ...giftTables, giftsById, giftsByVersion, showsByVersion };
}

function testActivity({ version = 2, actId = 25002, awardBin = Buffer.alloc(0), selected = version } = {}) {
  const master = wrapEtfBinary(codec.pack('pb_up_star_gift_master', {
    cur_choose_version: selected,
    info_list: [{ version, act_id: String(actId), award_bin: awardBin }]
  }));
  return {
    act_list: [],
    act_pause_list: [],
    act_custom_list: [],
    act_parallel_list: [{
      states_data: [{ act_id: actId, cur_state_id: 50, history_time: [{ state_id: 50, enter_time: String(BASE_SECONDS) }] }],
      module_login_data: master
    }]
  };
}

function game(directory, { now = () => BASE_MS, activityMode = 'schedule', logger } = {}) {
  return createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: BASE_SECONDS,
    activityMode,
    now,
    logger
  });
}

function testGame(t, prefix = 'fc-up-star-') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  let instance;
  let reopened;
  t.after(async () => {
    if (reopened) await reopened.close();
    if (instance) await instance.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  instance = game(directory);
  return {
    directory,
    get instance() { return instance; },
    set instance(value) { instance = value; },
    get reopened() { return reopened; },
    set reopened(value) { reopened = value; }
  };
}

function setHeroStar(model, tid, star) {
  model.heroInfo.hero_list = (model.heroInfo.hero_list ?? []).filter(hero => String(hero.tid) !== String(tid));
  model.heroInfo.hero_list.push({ uid: String(tid), tid: String(tid), level: 1, star, star_progress: 0, breakthrough_level: 0 });
}

function seedClaimState(instance, {
  activity = testActivity(),
  heroStar = 0,
  petRows = [],
  elfRows = []
} = {}) {
  instance.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(92, serializedBinary(codec.pack('pb_act_login', activity)));
    if (petRows == null) modules.delete(158);
    else {
      const module = modules.get(158);
      const values = Array.isArray(module?.value) ? module.value : [];
      values[0] = serializedBinary(codec.pack('pb_pet_develop_data', { pets: petRows, slots: [] }));
      modules.set(158, { ...(module ?? {}), value: values, improper: false });
    }
    if (elfRows == null) modules.delete(538);
    else modules.set(538, serializedBinary(codec.pack('pb_elves_develop', { elves: elfRows, help_slots: [] })));
    model.state.modules.value = [...modules];
    setHeroStar(model, 3030501, heroStar);
  });
}

function serviceForGame(instance, {
  tableSet = gameTablesWith(),
  giftTables = upStarTables,
  runningIds = [25002],
  codec: override
} = {}) {
  return createUpStarGiftService({
    store: instance.store,
    codec: override ?? codec,
    tables: tableSet,
    upStarTables: giftTables,
    calendar: {
      isActivityRunning: actId => runningIds.map(Number).includes(Number(actId)),
      serverOpenedAt: null
    },
    now: () => BASE_MS,
    logger: () => {}
  });
}

function module92(instance) {
  return new Map(instance.store.read().state.modules.value).get(92);
}

function storedMaster(instance) {
  const activity = codec.unpack('pb_act_login', rawBinary(module92(instance)));
  return decodeMaster(upStarGroup(activity, gameTablesWith()));
}

function resourceAmount(instance, id) {
  return Number(instance.store.read().resources.get(String(id))?.num ?? 0);
}

test('UpStarGift assets expose the verified fields, task types and claim-bit encoding', () => {
  assert.equal(upStarTables.UpStarOneKeyGift.size, 1);
  assert.equal(upStarTables.Show.size, 109);
  assert.equal(upStarTables.UpStarGift.size, 538);
  assert.equal(upStarTables.Const.size, 1);
  assert.equal(upStarTables.HeroShow.size, 88);
  assert.equal(upStarTables.giftsById.get(201).award[0][0], 101500);
  assert.equal(upStarTables.giftsById.get(201).award[0][1], 50);
  assert.equal(upStarTables.giftsById.get(299).gift, 540214);
  assert.equal(upStarTables.giftsById.get(204).starUnlock, 3);
  assert.equal(upStarTables.showsByVersion.get(2).showStyle, 3030501);
  assert.deepEqual([...upStarTables.giftBitByVersion.get(2)].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 99]);
  assert.equal(Number(tables.TaskType.get(1199).progress_fun), 66);
  assert.equal(Number(tables.TaskType.get(13005).progress_fun), 362);
  assert.equal(Number(tables.TaskType.get(14701).progress_fun), 363);
  assert.equal(Number(tables.Item.get(300113).type), 171);
  assert.equal(Number(tables.Item.get(300120).type), 191);
});

test('ETF BINARY_EXT wrapper round-trips the protobuf master without changing bytes', () => {
  const protobuf = codec.pack('pb_up_star_gift_master', {
    cur_choose_version: 72,
    info_list: [{ version: 72, act_id: '25072', award_bin: Buffer.from([0x40]) }]
  });
  const wrapped = wrapEtfBinary(protobuf);
  assert.deepEqual([...wrapped.subarray(0, 2)], [0x83, 0x6d]);
  assert.equal(wrapped.readUInt32BE(2), protobuf.length);
  assert.deepEqual(unwrapEtfBinary(wrapped), protobuf);
  const decoded = codec.unpack('pb_up_star_gift_master', unwrapEtfBinary(wrapped));
  assert.equal(Number(decoded.cur_choose_version), 72);
  assert.equal(Number(decoded.info_list[0].act_id), 25072);
  assert.deepEqual(Buffer.from(decoded.info_list[0].award_bin, 'base64'), Buffer.from([0x40]));
});

test('login sync adds missing live versions, preserves history and selects a live version', () => {
  const activity = seedActivity();
  const service = serviceFor(stubStoreFrom(activity));
  const result = service.synchronizeLogin(activity, BASE_SECONDS);

  assert.deepEqual(result.versions, RUNNING_VERSIONS);
  assert.deepEqual(result.activityIds, RUNNING_ACTIVITY_IDS);
  assert.equal(result.curChooseVersion, 111);
  assert.ok(result.addedInfo.includes(25111), '25111 is open by schedule but absent from the captured payload');
  assert.deepEqual(result.addedStates, [25111]);
  assert.deepEqual(result.unconfiguredRunning, []);

  const master = decodeMaster(upStarGroup(activity));
  for (const version of RUNNING_VERSIONS) {
    assert.ok(master.info_list.some(row => Number(row.version) === version), 'version ' + version + ' must have login data');
  }
  assert.equal(Number(master.cur_choose_version), 111);
  assert.ok(master.info_list.length >= 66, 'historical rows must not be removed');
});

test('login sync preserves a valid selection and repairs an expired one', () => {
  const valid = seedActivity();
  const validGroup = upStarGroup(valid);
  const validMaster = decodeMaster(validGroup);
  validGroup.module_login_data = wrapEtfBinary(codec.pack('pb_up_star_gift_master', {
    cur_choose_version: 111,
    info_list: validMaster.info_list.map(row => ({ version: Number(row.version), act_id: Number(row.act_id), award_bin: Buffer.from(row.award_bin || '', 'base64') }))
  }));
  serviceFor(stubStoreFrom(valid)).synchronizeLogin(valid, BASE_SECONDS);
  assert.equal(Number(decodeMaster(upStarGroup(valid)).cur_choose_version), 111);

  const expired = seedActivity();
  const expiredGroup = upStarGroup(expired);
  const expiredMaster = decodeMaster(expiredGroup);
  expiredGroup.module_login_data = wrapEtfBinary(codec.pack('pb_up_star_gift_master', {
    cur_choose_version: EXPIRED_VERSION,
    info_list: expiredMaster.info_list.map(row => ({ version: Number(row.version), act_id: Number(row.act_id), award_bin: Buffer.from(row.award_bin || '', 'base64') }))
  }));
  serviceFor(stubStoreFrom(expired)).synchronizeLogin(expired, BASE_SECONDS);
  const repaired = Number(decodeMaster(upStarGroup(expired)).cur_choose_version);
  assert.ok(RUNNING_VERSIONS.includes(repaired));
  assert.notEqual(repaired, EXPIRED_VERSION);
});

test('duplicate ActivityTable version 91 selects current 25091 and discards expired 25098', () => {
  const activity = seedActivity();
  serviceFor(stubStoreFrom(activity)).synchronizeLogin(activity, BASE_SECONDS);
  const master = decodeMaster(upStarGroup(activity));
  const rows = master.info_list.filter(row => Number(row.version) === 91);
  assert.equal(rows.length, 1);
  assert.equal(Number(rows[0].act_id), 25091);
});

test('31053 selects only a configured running version, is idempotent and survives relogin', () => {
  const activity = seedActivity();
  const store = stubStoreFrom(activity);
  const service = serviceFor(store);

  const first = service.execute(31053, 40);
  assert.deepEqual(first.value, { changed: true, version: 40, actId: 25042 });
  const stored = codec.unpack('pb_act_login', rawBinary(new Map(store.modules()).get(92)));
  assert.equal(Number(decodeMaster(upStarGroup(stored)).cur_choose_version), 40);

  assert.equal(service.execute(31053, 40).value.changed, false);
  const relogin = codec.unpack('pb_act_login', rawBinary(new Map(store.modules()).get(92)));
  service.synchronizeLogin(relogin, BASE_SECONDS);
  assert.equal(Number(decodeMaster(upStarGroup(relogin)).cur_choose_version), 40);
});

test('31053 rejects zero, malformed, expired and unknown versions without writing', () => {
  const store = stubStoreFrom(seedActivity());
  const service = serviceFor(store);
  const before = JSON.stringify(new Map(store.modules()).get(92));

  for (const value of [0, -1, '', null, 'x']) {
    assert.throws(() => service.execute(31053, value), error => error.code === 1);
  }
  for (const value of [EXPIRED_VERSION, 9, 9999]) {
    assert.throws(() => service.execute(31053, value), error => error.code === 309);
  }
  assert.equal(JSON.stringify(new Map(store.modules()).get(92)), before);
});

test('31053 rolls transaction state back when the activity wrapper cannot be serialized', () => {
  const store = stubStoreFrom(seedActivity());
  let fail = false;
  const flaky = {
    ...codec,
    pack(name, value) {
      if (fail && name === 'pb_act_login') throw new Error('serialization failed');
      return codec.pack(name, value);
    }
  };
  const service = serviceFor(store, { codec: flaky });
  const before = JSON.stringify(new Map(store.modules()).get(92));
  fail = true;
  assert.throws(() => service.execute(31053, 40), /serialization failed/);
  assert.equal(JSON.stringify(new Map(store.modules()).get(92)), before);
});

test('missing ActivityTable and running rows without UpStarGiftTable fail closed with code 5', () => {
  const noActivityTables = { ...tables, Activity: new Map() };
  const noActivityService = serviceFor(stubStoreFrom(seedActivity()), { gameTables: noActivityTables });
  assert.throws(() => noActivityService.execute(31053, 72), error => error.code === 5);
  assert.throws(() => noActivityService.execute(31052, { ids: [201] }), error => error.code === 5);

  const tableSet = gameTablesWith([25002]);
  const store = stubStoreFrom(testActivity());
  const noGiftConfig = serviceFor(store, { gameTables: tableSet, giftTables: withoutVersion(upStarTables, 2) });
  assert.throws(() => noGiftConfig.execute(31053, 2), error => error.code === 5);
  assert.throws(() => noGiftConfig.execute(31052, { ids: [201] }), error => error.code === 5);
});

test('31052 and 31053 reject missing module 92 login data without writing', () => {
  const store = createStubStore([]);
  const service = serviceFor(store, { gameTables: gameTablesWith([25002]) });

  for (const invoke of [
    () => service.execute(31052, { ids: [201] }),
    () => service.execute(31053, 2)
  ]) {
    assert.throws(invoke, error => error.code === 5 && /Activity login data is unavailable/.test(error.message));
  }
  assert.deepEqual(store.modules(), []);
});

test('current shipped schedule exposes only paid up-star rows and keeps them out of 31052', () => {
  const scheduleTables = readGameTables();
  const at = Date.parse('2026-11-11T18:29:00Z');
  const calendar = createActivityCalendar({
    tables: scheduleTables,
    serverOpenedAt: Math.floor(Date.parse('2026-11-11T00:00:00+08:00') / 1000),
    activityReferenceOpenedAt: Math.floor(Date.parse('2026-10-01T00:00:00+08:00') / 1000),
    activityWindowAnchor: Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000),
    mode: 'schedule',
    currentFishingActivityId: 1074011,
    now: () => at
  });
  const activity = seedActivity();
  const service = serviceFor(stubStoreFrom(activity), { now: at, calendar });

  const synced = service.synchronizeLogin(activity, Math.floor(at / 1000));
  assert.deepEqual(synced.versions, [40, 49, 52, 56, 111]);
  for (const version of synced.versions) {
    const rows = upStarTables.giftsByVersion.get(version);
    assert.ok(rows.length > 0);
    assert.ok(rows.every(row => row.gift > 0), 'version ' + version + ' must not invent a free claim');
  }
  assert.throws(
    () => service.execute(31052, { ids: [upStarTables.giftsByVersion.get(111)[0].tid] }),
    error => error.code === 5 && /recharge product/.test(error.message)
  );
});

test('31052 validates protobuf ids before touching claim state', () => {
  const tableSet = gameTablesWith([25002]);
  const harness = testGame(test, 'fc-up-star-ids-');
  seedClaimState(harness.instance);
  const service = serviceForGame(harness.instance, { tableSet });
  const before = JSON.stringify(module92(harness.instance));

  for (const input of [{}, { ids: [] }, { ids: [0] }, { ids: [201, 201] }, { ids: ['x'] }, { ids: '201' }]) {
    assert.throws(() => service.execute(31052, input), error => error.code === 1);
  }
  assert.throws(() => service.execute(31052, { ids: [99999] }), error => error.code === 1);
  assert.equal(JSON.stringify(module92(harness.instance)), before);
});

test('31052 resolves authoritative hero progress, grants table rewards and is replay-safe', () => {
  const tableSet = gameTablesWith([25002]);
  const harness = testGame(test, 'fc-up-star-award-');
  seedClaimState(harness.instance, { heroStar: 0 });
  const service = serviceForGame(harness.instance, { tableSet });
  const beforeResources = resourceAmount(harness.instance, 101500);

  assert.throws(() => service.execute(31052, { ids: [202] }), error => {
    assert.equal(error.code, 5);
    assert.match(error.message, /task is not complete: requires 1, current 0/);
    return true;
  });
  harness.instance.store.transaction(model => setHeroStar(model, 3030501, 1));

  const claimed = service.execute(31052, { ids: [202] });
  assert.equal(claimed.value.res.changes[0].diff_num, '100');
  assert.equal(resourceAmount(harness.instance, 101500), beforeResources + 100);
  assert.equal(hasBit(Buffer.from(claimed.value.info.award_bin, 'base64'), 2), true);

  const repeat = service.execute(31052, { ids: [202] });
  assert.deepEqual(repeat.value.res.changes, []);
  assert.equal(resourceAmount(harness.instance, 101500), beforeResources + 100);
  assert.throws(() => service.execute(31052, { ids: [201, 202] }), error => error.code === 310);
});

test('31052 rejects cross-version, paid, empty-award and one-key rows', () => {
  const tableSet = gameTablesWith([25002]);
  const harness = testGame(test, 'fc-up-star-row-kind-');
  seedClaimState(harness.instance, { heroStar: 10 });
  const oneKeyTables = addGiftTables([gift(208, 2, { oneKey: 1 })]);
  const service = serviceForGame(harness.instance, { tableSet, giftTables: oneKeyTables });

  assert.throws(() => service.execute(31052, { ids: [301] }), error => error.code === 5 && /not selected version/.test(error.message));
  assert.throws(() => service.execute(31052, { ids: [299] }), error => error.code === 5 && /recharge product/.test(error.message));
  assert.throws(() => service.execute(31052, { ids: [200] }), error => error.code === 5 && /no claimable award/.test(error.message));
  assert.throws(() => service.execute(31052, { ids: [208] }), error => error.code === 5 && /one-key gift/.test(error.message));
});

test('star_unLock uses Show.show_style hero star and remains separate from target_count', () => {
  const tableSet = gameTablesWith([25002]);
  const giftTables = addGiftTables([gift(208, 2, { targetCount: 0, starUnlock: 3 })]);
  const harness = testGame(test, 'fc-up-star-lock-');
  seedClaimState(harness.instance, { heroStar: 2 });
  const service = serviceForGame(harness.instance, { tableSet, giftTables });

  assert.throws(() => service.execute(31052, { ids: [208] }), error => {
    assert.equal(error.code, 5);
    assert.match(error.message, /display gift is locked: requires hero 3030501 star 3, current 2/);
    assert.doesNotMatch(error.message, /task is not complete/);
    return true;
  });
  harness.instance.store.transaction(model => setHeroStar(model, 3030501, 3));
  assert.equal(service.execute(31052, { ids: [208] }).value.res.changes[0].diff_num, '50');
});

test('31052 resolves pet and elf progress from their authoritative login modules', () => {
  const tableSet = gameTablesWith([25002]);
  const giftTables = addGiftTables([
    gift(209, 2, { type: 13005, taskParam: 300113, targetCount: 1 }),
    gift(210, 2, { type: 14701, taskParam: 300120, targetCount: 1 })
  ]);
  const harness = testGame(test, 'fc-up-star-pet-elf-');
  seedClaimState(harness.instance, { petRows: [], elfRows: [] });
  const service = serviceForGame(harness.instance, { tableSet, giftTables });

  assert.throws(() => service.execute(31052, { ids: [209] }), error => error.code === 5 && /requires 1, current 0/.test(error.message));
  assert.throws(() => service.execute(31052, { ids: [210] }), error => error.code === 5 && /requires 1, current 0/.test(error.message));
  harness.instance.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const petModule = modules.get(158);
    const petSlots = Array.isArray(petModule?.value) ? petModule.value : [];
    petSlots[0] = serializedBinary(codec.pack('pb_pet_develop_data', { pets: [{ tid: '300113', star: 2 }], slots: [] }));
    modules.set(158, { ...(petModule ?? {}), value: petSlots, improper: false });
    modules.set(538, serializedBinary(codec.pack('pb_elves_develop', { elves: [{ tid: '300120', star: 1 }], help_slots: [] })));
    model.state.modules.value = [...modules];
  });

  assert.equal(service.execute(31052, { ids: [209] }).value.res.changes[0].diff_num, '50');
  assert.equal(service.execute(31052, { ids: [210] }).value.res.changes[0].diff_num, '50');
});

test('claim bits are isolated by version and survive activity version switching', () => {
  const tableSet = gameTablesWith([25002, 25003]);
  const harness = testGame(test, 'fc-up-star-version-isolation-');
  seedClaimState(harness.instance);
  const service = serviceForGame(harness.instance, { tableSet, runningIds: [25002, 25003] });

  service.execute(31052, { ids: [201] });
  service.execute(31053, 3);
  service.execute(31052, { ids: [301] });
  const master = storedMaster(harness.instance);
  const version2 = master.info_list.find(row => Number(row.version) === 2);
  const version3 = master.info_list.find(row => Number(row.version) === 3);
  assert.equal(hasBit(Buffer.from(version2.award_bin, 'base64'), 1), true);
  assert.equal(hasBit(Buffer.from(version3.award_bin, 'base64'), 1), true);
  assert.equal(hasBit(Buffer.from(version2.award_bin, 'base64'), 2), false);
});

test('no running version returns code 309 for both commands', () => {
  const tableSet = gameTablesWith([25002]);
  const store = stubStoreFrom(testActivity());
  const service = serviceFor(store, {
    gameTables: tableSet,
    calendar: { isActivityRunning: () => false, serverOpenedAt: null }
  });
  assert.throws(() => service.execute(31053, 2), error => error.code === 309);
  assert.throws(() => service.execute(31052, { ids: [201] }), error => error.code === 309);
});

test('grant and module persistence are atomic; failure rolls back and success survives reopen', async t => {
  const tableSet = gameTablesWith([25002]);
  const harness = testGame(t, 'fc-up-star-transaction-');
  seedClaimState(harness.instance, { heroStar: 1 });
  const service = serviceForGame(harness.instance, { tableSet });
  const beforeModule = JSON.stringify(module92(harness.instance));
  const beforeResources = resourceAmount(harness.instance, 101500);

  harness.instance.store.inspect(db => db.exec(`
    CREATE TRIGGER force_up_star_resource_failure
    BEFORE INSERT ON resources
    BEGIN SELECT RAISE(ABORT, 'forced resource persistence failure'); END;
  `));
  assert.throws(() => service.execute(31052, { ids: [202] }), /forced resource persistence failure/);
  assert.equal(JSON.stringify(module92(harness.instance)), beforeModule, 'module 92 must roll back with resources');
  assert.equal(resourceAmount(harness.instance, 101500), beforeResources, 'resource grant must roll back');

  harness.instance.store.inspect(db => db.exec('DROP TRIGGER force_up_star_resource_failure'));
  const claimed = service.execute(31052, { ids: [202] });
  assert.equal(claimed.value.res.changes[0].diff_num, '100');
  assert.equal(resourceAmount(harness.instance, 101500), beforeResources + 100);
  assert.equal(hasBit(Buffer.from(storedMaster(harness.instance).info_list.find(row => Number(row.version) === 2).award_bin, 'base64'), 2), true);

  await harness.instance.close();
  harness.instance = undefined;
  harness.reopened = game(harness.directory);
  assert.equal(resourceAmount(harness.reopened, 101500), beforeResources + 100);
  assert.equal(hasBit(Buffer.from(storedMaster(harness.reopened).info_list.find(row => Number(row.version) === 2).award_bin, 'base64'), 2), true);
});

async function connect(t, instance) {
  const address = await instance.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  t.after(() => socket.destroy());
  await once(socket, 'connect');
  socket.write(encodeGameFrame(Buffer.from('verify')));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  socket.write(encodeGameFrame(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ])));
  let seq = 0;
  const request = async (type, data) => {
    socket.write(encodeGameFrame(codec.pack('pb_c2s', { type, seq: ++seq, data })));
    return codec.unpack('pb_s2c', await next());
  };
  const login = await request(909103, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const decoded = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.equal(decoded[0], 1);
  return { request, loginModules: new Map(decoded[2].value) };
}

test('gateway routes 31052/31053 before benefit-commerce and round-trips their two payload encodings', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-up-star-gateway-'));
  const events = [];
  const instance = game(directory, { activityMode: 'all-open', logger: event => events.push(event) });
  // The current ActivityTable no longer carries the retired version 2 row, but
  // the shipped UpStarGiftTable still owns its free claims. Add that scheduler
  // row only in this isolated test database to exercise the production route.
  instance.tables.Activity.set(25002, activityRow(25002, 2));
  t.after(async () => { await instance.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const { request, loginModules } = await connect(t, instance);

  const loginActivity = codec.unpack('pb_act_login', Buffer.from(loginModules.get(92)?.value?.data ?? loginModules.get(92)?.value ?? []));
  const loginMaster = decodeMaster(upStarGroup(loginActivity));
  assert.ok(loginMaster.info_list.some(entry => Number(entry.version) === 2), 'login must expose free version 2');
  assert.ok(loginMaster.info_list.some(entry => Number(entry.act_id) === 25111), 'login must expose the current paid version 111');

  const chosen = await request(31053, await encodeEtf([2]));
  assert.equal(chosen.err, undefined);
  assert.ok(events.some(event => event.event === 'up_star_gift_committed' && event.type === 31053));

  const claimed = await request(31052, codec.pack('pb_up_star_gift_req', { ids: [201] }));
  assert.equal(claimed.err, undefined);
  const response = codec.unpack('pb_up_star_gift_back', Buffer.from(claimed.data, 'base64'));
  assert.equal(Number(response.info.version), 2);
  assert.equal(Number(response.info.act_id), 25002);
  assert.equal(response.res.changes[0].diff_num, '50');
  assert.equal(hasBit(Buffer.from(response.info.award_bin, 'base64'), 1), true);
  assert.ok(events.some(event => event.event === 'up_star_gift_committed' && event.type === 31052));
  assert.equal(events.some(event => event.event === 'benefit_command_committed' && [31052, 31053].includes(event.type)), false);

  const replay = await request(31052, codec.pack('pb_up_star_gift_req', { ids: [201] }));
  assert.equal(replay.err, undefined);
  assert.deepEqual(codec.unpack('pb_up_star_gift_back', Buffer.from(replay.data, 'base64')).res.changes, []);

  const malformed = await request(31052, Buffer.from([0xff, 0xff]));
  assert.equal(malformed.err.err, 1);
  const invalidVersion = await request(31053, await encodeEtf([0]));
  assert.equal(invalidVersion.err.err, 1);
});
