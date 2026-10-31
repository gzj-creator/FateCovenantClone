import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createHeroHandbookService } from '../game/hero-handbook-service.mjs';
import { createRecruitService } from '../game/recruit-service.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readFantasyEquipTables, readHeroTables } from '../config/hero-tables.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables(), fantasyEquipTables = readFantasyEquipTables(), tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const fixtureTids = [1020301, 1020601, 2010101, 2010201, 2020601, 4030801];

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 30, nick_name: Buffer.from('Handbook Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-handbook-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  const make = () => createHeroHandbookService({ store, codec, heroTables });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    directory,
    databasePath,
    legacyStatePath,
    get store() { return store; },
    make,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, legacyStatePath, codec });
    }
  };
}

function decodeLoginHandbook(state) {
  const module = new Map(state.modules.value).get(10);
  return codec.unpack('pb_hero_all_handbook_record', rawBinary(module.value[3]));
}

function recordFor(state, tid) {
  return decodeLoginHandbook(state).records.find(record => Number(record.tid) === tid);
}

function recordView(record) {
  return {
    tid: Number(record.tid),
    quality: Number(record.quality ?? 0),
    star: Number(record.star ?? 0),
    is_mutant: Boolean(record.is_mutant ?? false)
  };
}

function seedHandbook(env, { records, ownRev }) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(10);
    module.value[3] = serializedBinary(codec.pack('pb_hero_all_handbook_record', {
      records,
      own_rev: Buffer.from(ownRev ?? [])
    }));
    model.state.modules.value = [...modules];
  });
}

test('login codex creates base records for owned player-facing heroes and preserves progress and award bits', t => {
  const env = setup(t);
  const hiddenTid = [...heroTables.Hero].find(([, config]) => config.not_in_guide === true)[0];
  const hiddenConfig = heroTables.Hero.get(hiddenTid);

  seedHandbook(env, {
    records: [{ tid: 2020601, quality: 50, star: 3, is_mutant: true }],
    ownRev: [0x80, 0x01]
  });
  env.store.transaction(model => {
    model.heroInfo.hero_list.push(
      {
        tid: String(hiddenTid), uid: String(BigInt(hiddenTid) + 100000000n), level: 1, star: 0,
        star_progress: 0, breakthrough_level: 0, quality: hiddenConfig.quality
      },
      {
        tid: '1010101', uid: '1010101', level: 1, star: 2, star_progress: 0,
        breakthrough_level: 0, quality: 40
      },
      {
        tid: '2020601', uid: '3020601', level: 1, star: 4, star_progress: 0,
        breakthrough_level: 0, quality: 60, mutant: 17001
      }
    );
  });

  const result = env.make().ensureLoginState();
  const handbook = decodeLoginHandbook(env.store.state());
  assert.equal(result.recordCount, 7);
  assert.equal(result.added, 6);
  assert.equal(handbook.own_rev, 'gAE=');
  assert.ok(handbook.records.every(record => record.tid !== hiddenTid));
  assert.deepEqual(recordView(handbook.records.find(record => record.tid === 2020601)), {
    tid: 2020601, quality: 50, star: 3, is_mutant: true
  });
  assert.deepEqual(recordView(handbook.records.find(record => record.tid === 1010101)), {
    tid: 1010101, quality: 30, star: 0, is_mutant: false
  });
  assert.deepEqual(handbook.records.map(record => record.tid), [1010101, 1020301, 1020601, 2010101, 2010201, 2020601, 4030801]);

  env.reopen();
  assert.equal(env.make().ensureLoginState().added, 0);
  assert.deepEqual(decodeLoginHandbook(env.store.state()), handbook);
});

test('a recruited hero is lit and remains lit after reopening the save', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const ticket = model.resources.get('2002');
    if (ticket) ticket.num = '10';
    else model.resources.set('2002', { tid: '2002', num: '10', location: [6, 1, 0] });
  });
  const recruit = createRecruitService({ store: env.store, codec, tables, heroTables, fantasyEquipTables, random: () => 0 });
  recruit.ensureLoginState();
  recruit.execute(601, { draw_lib: 1, point_draw_num: 1 });
  assert.ok(env.store.read().heroInfo.hero_list.some(hero => Number(hero.tid) === 1010101));

  env.make().ensureLoginState();
  let handbook = decodeLoginHandbook(env.store.state());
  assert.deepEqual(recordView(handbook.records.find(record => record.tid === 1010101)), {
    tid: 1010101, quality: 30, star: 0, is_mutant: false
  });

  env.reopen();
  env.make().ensureLoginState();
  handbook = decodeLoginHandbook(env.store.state());
  assert.ok(handbook.records.some(record => record.tid === 1010101));
});

test('644 advances exactly one codex step, synchronizes module 10 slot 3, and is idempotent at the roster cap', t => {
  const env = setup(t), service = env.make();
  service.ensureLoginState();
  env.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(value => value.uid === '2020601');
    hero.star = 4;
    hero.quality = 60;
  });
  const resourcesBefore = structuredClone(env.store.read().resources);

  const sequence = [];
  for (let index = 0; index < 7; index++) {
    const result = service.raiseOne(2020601);
    const decoded = codec.unpack('pb_hero_handbook_raise_up_rsp', result.data);
    assert.equal(decoded.records.length, 1);
    const record = recordFor(env.store.state(), 2020601);
    assert.deepEqual(recordView(decoded.records[0]), recordView(record));
    sequence.push([record.star, record.quality]);
  }
  assert.deepEqual(sequence, [
    [1, 40], [2, 40], [3, 40], [4, 40], [4, 50], [4, 60], [4, 60]
  ]);
  assert.deepEqual(env.store.read().resources, resourcesBefore);

  const capped = env.store.state();
  env.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(value => value.uid === '2020601');
    hero.star = 2;
    hero.quality = 50;
  });
  const behindRoster = env.make().raiseOne(2020601);
  assert.deepEqual(recordView(codec.unpack('pb_hero_handbook_raise_up_rsp', behindRoster.data).records[0]), {
    tid: 2020601, quality: 60, star: 4, is_mutant: false
  });

  env.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(value => value.uid === '2020601');
    hero.star = 4;
    hero.quality = 60;
  });
  env.reopen();
  assert.deepEqual(recordView(recordFor(env.store.state(), 2020601)), { tid: 2020601, quality: 60, star: 4, is_mutant: false });

  const beforeRejected = env.store.state();
  assert.throws(() => env.make().raiseOne(0), error => error.code === 1);
  assert.throws(() => env.make().raiseOne(999999), error => error.code === 3001);
  assert.throws(() => env.make().raiseOne(1010101), error => error.code === 3001);
  assert.deepEqual(env.store.state(), beforeRejected);
});

test('645 advances distinct heroes once per request in one transaction and rejects invalid lists atomically', t => {
  const env = setup(t), service = env.make();
  service.ensureLoginState();
  env.store.transaction(model => {
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '2010101'), { star: 2, quality: 30 });
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '1020601'), { star: 1, quality: 40 });
  });

  const result = service.raiseOneKey([2010101, 1020601, 2010101]);
  const decoded = codec.unpack('pb_hero_handbook_raise_up_rsp', result.data);
  assert.deepEqual(decoded.records.map(recordView), [
    { tid: 2010101, quality: 30, star: 1, is_mutant: false },
    { tid: 1020601, quality: 40, star: 1, is_mutant: false }
  ]);
  assert.deepEqual(recordView(recordFor(env.store.state(), 2010101)), recordView(decoded.records[0]));
  assert.deepEqual(recordView(recordFor(env.store.state(), 1020601)), recordView(decoded.records[1]));

  const repeated = codec.unpack('pb_hero_handbook_raise_up_rsp', service.raiseOneKey([1020601]).data).records;
  assert.deepEqual(repeated.map(recordView), [{ tid: 1020601, quality: 40, star: 1, is_mutant: false }]);

  const beforeRejected = env.store.state();
  assert.throws(() => service.raiseOneKey([]), error => error.code === 1);
  assert.throws(() => service.raiseOneKey([2010101, 999999]), error => error.code === 3001);
  assert.throws(() => service.raiseOneKey(['not-a-hero']), error => error.code === 1);
  assert.deepEqual(env.store.state(), beforeRejected);

  env.reopen();
  assert.deepEqual(recordView(recordFor(env.store.state(), 2010101)), { tid: 2010101, quality: 30, star: 1, is_mutant: false });
});

test('644 walks the star-5 quality ladder and stops at the roster cap', t => {
  const env = setup(t), service = env.make();
  service.ensureLoginState();
  env.store.transaction(model => {
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '2020601'), { star: 10, quality: 70 });
  });

  const sequence = [];
  for (let index = 0; index < 14; index++) {
    service.raiseOne(2020601);
    const record = recordFor(env.store.state(), 2020601);
    sequence.push([record.star, record.quality]);
  }
  assert.deepEqual(sequence, [
    [1, 40], [2, 40], [3, 40], [4, 40], [5, 40],
    [5, 50], [6, 60], [7, 60], [8, 60], [9, 60], [10, 60],
    [10, 70], [10, 70], [10, 70]
  ]);

  seedHandbook(env, { records: [{ tid: 2020601, quality: 60, star: 5, is_mutant: false }], ownRev: [] });
  assert.deepEqual(
    recordView(codec.unpack('pb_hero_handbook_raise_up_rsp', service.raiseOne(2020601).data).records[0]),
    { tid: 2020601, quality: 60, star: 6, is_mutant: false }
  );

  seedHandbook(env, { records: [{ tid: 2020601, quality: 70, star: 10, is_mutant: false }], ownRev: [] });
  assert.deepEqual(
    recordView(codec.unpack('pb_hero_handbook_raise_up_rsp', service.raiseOne(2020601).data).records[0]),
    { tid: 2020601, quality: 70, star: 10, is_mutant: false }
  );
});

test('655 with a hero id claims only that hero and rejects heroes the roster does not own', t => {
  const env = setup(t), service = env.make();
  service.ensureLoginState();
  const resourcesBefore = structuredClone(env.store.read().resources);

  const result = service.claimOwnAward(2020601);
  const decoded = codec.unpack('pb_hero_handbook_own_award_back', result.data);
  const rev = Buffer.from(decoded.rev_bin, 'base64');
  assert.equal(result.value.claimedTid, 2020601);
  assert.deepEqual(result.value.changedTids, [2020601]);
  assert.equal(hasBit(rev, heroTables.Hero.get(2020601).index), true);
  for (const tid of fixtureTids.filter(tid => tid !== 2020601)) {
    assert.equal(hasBit(rev, heroTables.Hero.get(tid).index), false);
  }
  assert.deepEqual(decoded.res_change.changes, []);
  assert.equal(decodeLoginHandbook(env.store.state()).own_rev, rev.toString('base64'));

  const repeated = codec.unpack('pb_hero_handbook_own_award_back', service.claimOwnAward(2020601).data);
  assert.deepEqual(Buffer.from(repeated.rev_bin, 'base64'), rev);
  assert.deepEqual(service.claimOwnAward(2020601).value.changedTids, []);

  const beforeRejected = env.store.state();
  assert.throws(() => service.claimOwnAward(0), error => error.code === 1);
  assert.throws(() => service.claimOwnAward(999999), error => error.code === 3001);
  assert.throws(() => service.claimOwnAward(1010101), error => error.code === 3001);
  assert.deepEqual(env.store.state(), beforeRejected);
  assert.deepEqual(env.store.read().resources, resourcesBefore);

  const rest = service.claimOwnAward();
  assert.deepEqual([...rest.value.changedTids].sort((a, b) => a - b), fixtureTids.filter(tid => tid !== 2020601).sort((a, b) => a - b));
  assert.equal(rest.value.changedTids.length, fixtureTids.length - 1);
});

test('655 pays HandbookConstant award_item/award_count when the table configures a reward', t => {
  const env = setup(t);
  const rewardedTables = {
    ...heroTables,
    HandbookConstant: new Map([[1, { tid: 1, award_item: 101500, award_count: 3 }]])
  };
  const service = createHeroHandbookService({ store: env.store, codec, heroTables: rewardedTables, tables });
  service.ensureLoginState();
  const before = BigInt(env.store.read().resources.get('101500')?.num ?? 0);

  const one = service.claimOwnAward(2020601);
  const oneDecoded = codec.unpack('pb_hero_handbook_own_award_back', one.data);
  assert.deepEqual(oneDecoded.res_change.changes.map(change => [change.tid, change.diff_num]), [['101500', '3']]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 3n);

  const all = service.claimOwnAward();
  const allDecoded = codec.unpack('pb_hero_handbook_own_award_back', all.data);
  assert.deepEqual(allDecoded.res_change.changes.map(change => [change.tid, change.diff_num]), [['101500', '15']]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 18n);

  const none = codec.unpack('pb_hero_handbook_own_award_back', service.claimOwnAward().data);
  assert.deepEqual(none.res_change.changes, []);
  assert.equal(BigInt(env.store.read().resources.get('101500').num), before + 18n);
});

test('655 claims one own-award bit per owned codex hero, returns no resource change, and is idempotent', t => {
  const env = setup(t), service = env.make();
  service.ensureLoginState();
  const resourcesBefore = structuredClone(env.store.read().resources);
  const heroesBefore = structuredClone(env.store.read().heroInfo);

  const result = service.claimOwnAward();
  const decoded = codec.unpack('pb_hero_handbook_own_award_back', result.data);
  const rev = Buffer.from(decoded.rev_bin, 'base64');
  assert.equal(result.value.changedTids.length, fixtureTids.length);
  assert.deepEqual(decoded.res_change.changes, []);
  for (const tid of fixtureTids) assert.equal(hasBit(rev, heroTables.Hero.get(tid).index), true);
  assert.deepEqual(env.store.read().resources, resourcesBefore);
  assert.deepEqual(env.store.read().heroInfo, heroesBefore);
  assert.equal(decodeLoginHandbook(env.store.state()).own_rev, rev.toString('base64'));

  const repeated = service.claimOwnAward();
  const repeatedDecoded = codec.unpack('pb_hero_handbook_own_award_back', repeated.data);
  assert.deepEqual(Buffer.from(repeatedDecoded.rev_bin, 'base64'), rev);
  assert.deepEqual(repeatedDecoded.res_change.changes, []);
  assert.deepEqual(repeated.value.changedTids, []);

  const hiddenTid = [...heroTables.Hero].find(([, config]) => config.not_in_guide === true)[0];
  const hiddenConfig = heroTables.Hero.get(hiddenTid);
  env.store.transaction(model => {
    model.heroInfo.hero_list.push({
      tid: String(hiddenTid), uid: String(BigInt(hiddenTid) + 100000000n), level: 1, star: 0,
      star_progress: 0, breakthrough_level: 0, quality: hiddenConfig.quality
    });
  });
  const afterHidden = service.claimOwnAward();
  const hiddenRev = Buffer.from(afterHidden.value.rev_bin);
  assert.equal(hasBit(hiddenRev, hiddenConfig.index), false);
  assert.deepEqual(afterHidden.value.changedTids, []);
});

test('response-encoding and SQLite write failures roll back handbook and own-award mutations', t => {
  const env = setup(t);
  env.make().ensureLoginState();
  env.store.transaction(model => {
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '2020601'), { star: 2, quality: 50 });
  });
  const before = env.store.state();

  const brokenPack = { ...codec, pack(name, object) {
    if (name === 'pb_hero_handbook_raise_up_rsp' || name === 'pb_hero_handbook_own_award_back') {
      throw new Error('Injected handbook encoding failure');
    }
    return codec.pack(name, object);
  } };
  const broken = createHeroHandbookService({ store: env.store, codec: brokenPack, heroTables });
  assert.throws(() => broken.raiseOne(2020601), /Injected handbook encoding failure/);
  assert.deepEqual(env.store.state(), before);
  assert.throws(() => broken.claimOwnAward(), /Injected handbook encoding failure/);
  assert.deepEqual(env.store.state(), before);

  const db = new DatabaseSync(env.databasePath);
  db.exec("CREATE TRIGGER reject_login_module_write BEFORE INSERT ON login_modules BEGIN SELECT RAISE(ABORT, 'Injected storage failure'); END;");
  db.close();
  assert.throws(() => env.make().raiseOne(2020601), /Injected storage failure/);
  assert.deepEqual(env.store.state(), before);
});

test('the real login payload contains the generated codex slot', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-handbook-login-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(statePath, JSON.stringify(fixture()));
  const game = createLocalGame({ databasePath, statePath, capturePath, verifySession: () => true });
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const decoded = await decodeEtf(await game.loginPayload());
  const modules = new Map(decoded[2].value);
  const handbook = codec.unpack('pb_hero_all_handbook_record', Buffer.from(modules.get(10).value[3].value));
  assert.equal(handbook.records.length, 6);
  assert.deepEqual(handbook.records.map(record => record.tid), fixtureTids);
  assert.ok(handbook.records.every(record => (record.star ?? 0) === 0));
});

test('gateway accepts 644, 645 and 655 over the real framed TCP path without LOCAL_NOT_IMPLEMENTED', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-handbook-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(statePath, JSON.stringify(fixture()));
  const events = [];
  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
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
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  let response = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(response.data, 'base64')))[0], 1);

  game.store.transaction(model => {
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '2020601'), { star: 4, quality: 60 });
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '1020301'), { star: 1, quality: 50 });
    Object.assign(model.heroInfo.hero_list.find(value => value.uid === '4030801'), { star: 2, quality: 50 });
  });

  response = await request(644, 2, await encodeEtf([2020601]));
  assert.equal(response.err, undefined);
  assert.deepEqual(recordView(codec.unpack('pb_hero_handbook_raise_up_rsp', Buffer.from(response.data, 'base64')).records[0]), {
    tid: 2020601, quality: 40, star: 1, is_mutant: false
  });

  response = await request(645, 3, codec.pack('pb_hero_handbook_raise_one_key_req', { hero_id: [1020301, 4030801] }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_hero_handbook_raise_up_rsp', Buffer.from(response.data, 'base64')).records.map(recordView), [
    { tid: 1020301, quality: 40, star: 1, is_mutant: false },
    { tid: 4030801, quality: 50, star: 1, is_mutant: false }
  ]);

  response = await request(655, 4, await encodeEtf([2020601]));
  assert.equal(response.err, undefined);
  const award = codec.unpack('pb_hero_handbook_own_award_back', Buffer.from(response.data, 'base64'));
  assert.equal(award.res_change.changes.length, 0);
  assert.equal(hasBit(Buffer.from(award.rev_bin, 'base64'), heroTables.Hero.get(2020601).index), true);
  assert.equal(hasBit(Buffer.from(award.rev_bin, 'base64'), heroTables.Hero.get(1020301).index), false);

  response = await request(655, 5, Buffer.alloc(0));
  assert.equal(response.err, undefined);
  const awardAll = codec.unpack('pb_hero_handbook_own_award_back', Buffer.from(response.data, 'base64'));
  for (const tid of [1020301, 4030801]) {
    assert.equal(hasBit(Buffer.from(awardAll.rev_bin, 'base64'), heroTables.Hero.get(tid).index), true);
  }

  const beforeRejected = game.store.state();
  response = await request(644, 6, await encodeEtf([0]));
  assert.equal(response.err?.err, 1);
  response = await request(645, 7, Buffer.from([0xff, 0xff, 0xff]));
  assert.equal(response.err?.err, 2);
  response = await request(655, 8, await encodeEtf([999999]));
  assert.equal(response.err?.err, 3001);
  assert.deepEqual(game.store.state(), beforeRejected);
  for (const type of [644, 645, 655]) {
    assert.equal(events.some(event => event.event === 'hero_handbook_committed' && event.type === type), true);
    assert.equal(events.some(event => event.event === 'unsupported_command' && event.type === type), false);
  }
  assert.equal(events.some(event => String(event.stacktrace ?? '').includes('LOCAL_NOT_IMPLEMENTED')), false);
});
