import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import test from 'node:test';
import {
  createGameCodec,
  decodeEtf,
  encodeEtf,
  rawBinary,
  serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readHeroLegendTables, HERO_LEGEND_INITIAL_STAR } from '../config/hero-legend-tables.mjs';
import {
  createHeroLegendService,
  HERO_LEGEND_COMMANDS,
  HERO_LEGEND_MODULE_ID
} from '../game/hero-legend-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readHeroLegendTables();
const BOOK_TID = 1040101;
const CHIP_TID = 21400104;
const BLESS_HERO_TID = 3030501;
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-legend-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Hero Legend Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const service = createHeroLegendService({ store, codec, heroTables, tables });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    seed,
    service,
    get store() { return store; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
      return createHeroLegendService({ store, codec, heroTables, tables });
    }
  };
}

function addOwnedHero(store, tid, star = 10) {
  store.transaction(model => {
    if (model.heroInfo.hero_list.some(hero => Number(hero.tid) === Number(tid))) return;
    model.heroInfo.hero_list.push({
      relic: [], up_star_high_consume: [], source_point_list: [], pendant_select_list: [],
      tid: String(tid), count: 1, uid: String(tid), level: 1, source: 1,
      quality: 60, star, star_progress: 0, breakthrough_level: 0
    });
  });
}

function writeBook(store, activeList) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(HERO_LEGEND_MODULE_ID, serializedBinary(codec.pack('pb_hero_legend_book', { active_list: activeList })));
    model.state.modules.value = [...modules];
  });
}

function readBook(store) {
  const module = new Map(store.read().state.modules.value).get(HERO_LEGEND_MODULE_ID);
  if (!module) return { active_list: [] };
  const bytes = rawBinary(module);
  const value = bytes.length ? codec.unpack('pb_hero_legend_book', bytes) : { active_list: [] };
  return {
    ...value,
    active_list: (value.active_list ?? []).map(row => ({
      ...row,
      level: Number(row.level ?? 0),
      stage: Number(row.stage ?? 0),
      bless_hero_list: (row.bless_hero_list ?? []).map(Number)
    }))
  };
}

function setItem(store, tid, amount) {
  store.transaction(model => {
    const existing = model.resources.get(String(tid));
    if (existing) existing.num = String(amount);
    else {
      const template = [...model.resources.values()].find(row => row && typeof row === 'object');
      const row = structuredClone(template);
      row.tid = String(tid);
      row.num = String(amount);
      if ('produce_time' in row) row.produce_time = 0;
      if ('location' in row) row.location = 0;
      model.resources.set(String(tid), row);
    }
  });
}

function itemAmount(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

test('HeroLegend table families and progression constants are frozen', () => {
  assert.deepEqual(HERO_LEGEND_COMMANDS, [89801, 89802, 89803, 89804]);
  assert.deepEqual(tables.counts, {
    BookBlessStar: 11, BookBlessOpen: 3, Book: 17, BookShowParam: 17,
    BookStage: 4, BookAttr: 64, BookStar: 6, BookLevel: 15, BlessHero: 3
  });
  assert.equal(tables.source.sha256, '72dcade6f1ca9691858ad39c7e5b7cc849cc9ac195ad129be6958aa966a47575');
  assert.equal(HERO_LEGEND_INITIAL_STAR, 5);
  assert.deepEqual(tables.blessOpenForSlot(1).need_star, 6);
  assert.deepEqual(tables.blessOpenForSlot(2).need_star, 8);
  assert.deepEqual(tables.blessOpenForSlot(3).need_star, 10);
  assert.deepEqual(tables.bookForHeroTid(BOOK_TID).bless_hero, [3030501, 1020601, 2020601]);
});

test('empty module 154 stays empty on login and activation creates the original five-star book', t => {
  const env = setup(t);
  addOwnedHero(env.store, BOOK_TID, 10);
  assert.deepEqual(env.service.ensureLoginState(), { activeCount: 0, activeBooks: [] });
  assert.deepEqual(readBook(env.store), { active_list: [] });
  const result = env.service.execute(89801, BOOK_TID);
  assert.equal(result.schema, 'pb_hero_legend_book_active');
  assert.deepEqual(result.value, { tid: String(BOOK_TID), star: 5, level: 0, stage: 0, bless_hero_list: [] });
  assert.deepEqual(readBook(env.store), { active_list: [result.value] });
  const reopened = env.reopen();
  assert.equal(reopened.ensureLoginState().activeCount, 1);
  assert.deepEqual(readBook(env.store).active_list[0], result.value);
});

test('89801 star-up uses owned hero star as the gate and does not mutate the hero or resources', t => {
  const env = setup(t);
  addOwnedHero(env.store, BOOK_TID, 6);
  env.service.execute(89801, BOOK_TID);
  setItem(env.store, CHIP_TID, 99);
  const result = env.service.execute(89801, BOOK_TID);
  assert.equal(result.value.star, 6);
  assert.equal(itemAmount(env.store, CHIP_TID), 99);
  assert.equal(env.store.read().heroInfo.hero_list.find(row => Number(row.tid) === BOOK_TID).star, 6);
  env.store.transaction(model => {
    model.heroInfo.hero_list.find(row => Number(row.tid) === BOOK_TID).star = 5;
  });
  assert.throws(() => env.service.execute(89801, BOOK_TID), error => error.code === 5 && /requires hero star/.test(error.message));
});

test('89802 derives the target from slot 1..3, checks open star and ownership, and rejects duplicates', t => {
  const env = setup(t);
  addOwnedHero(env.store, BOOK_TID, 10);
  addOwnedHero(env.store, BLESS_HERO_TID, 0);
  env.service.execute(89801, BOOK_TID);
  assert.throws(() => env.service.execute(89802, [BOOK_TID, 1]), error => error.code === 5 && /requires 6 stars/.test(error.message));
  writeBook(env.store, [{ tid: BOOK_TID, star: 6, level: 0, stage: 0, bless_hero_list: [] }]);
  const result = env.service.execute(89802, [BOOK_TID, 1]);
  assert.deepEqual(result.value.bless_hero_list, [BLESS_HERO_TID]);
  assert.throws(() => env.service.execute(89802, [BOOK_TID, 1]), error => error.code === 5 && /already active/.test(error.message));
  assert.deepEqual(readBook(env.store).active_list[0].bless_hero_list, [BLESS_HERO_TID]);
});

test('89803 consumes the configured hero chip and 89804 enforces star, level and stage order', t => {
  const env = setup(t);
  addOwnedHero(env.store, BOOK_TID, 10);
  writeBook(env.store, [{ tid: BOOK_TID, star: 10, level: 0, stage: 1, bless_hero_list: [] }]);
  setItem(env.store, CHIP_TID, 40);
  const level = env.service.execute(89803, BOOK_TID);
  assert.equal(level.schema, 'pb_hero_legend_book_active_back');
  assert.equal(level.value.elem.level, 1);
  assert.equal(itemAmount(env.store, CHIP_TID), 30);
  assert.throws(() => env.service.execute(89804, BOOK_TID), error => error.code === 5 && /requires level 5/.test(error.message));
  writeBook(env.store, [{ tid: BOOK_TID, star: 10, level: 0, stage: 0, bless_hero_list: [] }]);
  const stage = env.service.execute(89804, BOOK_TID);
  assert.equal(stage.value.stage, 1);
  assert.equal(itemAmount(env.store, CHIP_TID), 30);
});

test('HeroLegend rejects malformed login state and insufficient level materials without partial writes', t => {
  const env = setup(t);
  addOwnedHero(env.store, BOOK_TID, 10);
  writeBook(env.store, [{ tid: BOOK_TID, star: 10, level: 0, stage: 1, bless_hero_list: [] }]);
  setItem(env.store, CHIP_TID, 0);
  assert.throws(() => env.service.execute(89803, BOOK_TID), error => error.code === 301);
  assert.deepEqual(readBook(env.store).active_list[0], { tid: String(BOOK_TID), star: 10, level: 0, stage: 1, bless_hero_list: [] });
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(HERO_LEGEND_MODULE_ID, { value: [], bits: 8 });
    model.state.modules.value = [...modules];
  });
  assert.throws(() => env.service.ensureLoginState(), error => error.code === 5);
});

test('HeroLegend ETF decode, real temporary TCP, response schemas and SQLite reopen', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-legend-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Hero Legend Gateway' });
  const store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  addOwnedHero(store, BOOK_TID, 10);
  addOwnedHero(store, BLESS_HERO_TID, 0);
  store.transaction(model => { grantResources(model, [[CHIP_TID, 40]], readGameTables(), { codec }); });
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('hero-legend-gateway', roleId, 'hero-legend-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();
  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'hero-legend-session' && uid === 'hero-legend-gateway'
      ? { userId: uid, loginCode: uid } : null
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
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
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const response = codec.unpack('pb_s2c', await next());
      if (response.seq === seq) return response;
    }
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
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'hero-legend-gateway', verify_code: 'hero-legend-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const dl = Buffer.from(await encodeEtf([BOOK_TID]));
  assert.equal(await game.commandSupportOwners().heroCommandServices.find(service => service.supports(89801)).decode(89801, dl, { etf: decodeEtf }), BOOK_TID);

  let response = await request(89801, 2, await encodeEtf([BOOK_TID]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_hero_legend_book_active', Buffer.from(response.data, 'base64')).star, 5);
  response = await request(89801, 3, await encodeEtf([BOOK_TID]));
  assert.equal(codec.unpack('pb_hero_legend_book_active', Buffer.from(response.data, 'base64')).star, 6);
  response = await request(89802, 4, await encodeEtf([BOOK_TID, 1]));
  assert.equal(codec.unpack('pb_hero_legend_book_active', Buffer.from(response.data, 'base64')).bless_hero_list[0], BLESS_HERO_TID);
  for (let seq = 5; seq <= 8; seq += 1) {
    response = await request(89801, seq, await encodeEtf([BOOK_TID]));
    assert.equal(response.err, undefined);
  }
  response = await request(89804, 9, await encodeEtf([BOOK_TID]));
  assert.equal(codec.unpack('pb_hero_legend_book_active', Buffer.from(response.data, 'base64')).stage, 1);
  response = await request(89803, 10, await encodeEtf([BOOK_TID]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_hero_legend_book_active_back', Buffer.from(response.data, 'base64')).elem.level, 1);
  assert.equal(itemAmount(game.store, CHIP_TID), 30);
  const persisted = readBook(game.store).active_list[0];
  assert.equal(persisted.star, 10);
  assert.equal(persisted.level, 1);
  assert.equal(persisted.stage, 1);
  assert.deepEqual(persisted.bless_hero_list, [BLESS_HERO_TID]);
});
