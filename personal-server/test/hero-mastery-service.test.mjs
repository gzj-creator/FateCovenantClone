import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import test from 'node:test';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createHeroMasteryService, heroMasteryView } from '../game/hero-mastery-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec(), heroTables = readHeroTables(), gameTables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));

// 2020601 ships a mastery group (5), a hero chip id and max_star 10 in the
// shipped HeroTable, so the tests use the real configuration rows.
const HERO_TID = 2020601;
const GROUP = Number(heroTables.Mastery.get(HERO_TID).mastery_group);
const CHIP = Number(heroTables.Hero.get(HERO_TID).chip);
const BREAK_ROW = level => heroTables.MasteryBreak.get(Number(heroTables.MasteryGroup.get(GROUP).break_range[level - 1]));
const LEVEL_ROW = level => heroTables.MasteryLevel.get(Number(heroTables.MasteryGroup.get(GROUP).level_range[level - 1]));

function fixture() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return { version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000, modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'), guides: { 12: 34 }, lineups: null };
}

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-mastery-'));
  const databasePath = path.join(directory, 'game.sqlite'), legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    service: () => createHeroMasteryService({ store, codec, heroTables }),
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function hero(store, tid = HERO_TID) {
  return store.read().heroInfo.hero_list.find(row => Number(row.tid) === tid);
}

function setHero(store, patch, tid = HERO_TID) {
  store.transaction(model => {
    const row = model.heroInfo.hero_list.find(candidate => Number(candidate.tid) === tid);
    Object.assign(row, patch);
  });
}

function stock(store) {
  store.transaction(model => grantResources(model, [[CHIP, 100000], [474002, 1000], [475002, 1000], [476002, 1000]], gameTables, { codec }));
}

function ready(t) {
  const env = setup(t);
  stock(env.store);
  setHero(env.store, { star: 10, mastery_level: 0, mastery_break: 0 });
  return env;
}

const rejected = (action, code) => assert.throws(action, error => error.code === code);
const amount = (store, tid) => BigInt(store.read().resources.get(String(tid))?.num ?? 0);

test('mastery break then level uses the shipped MasteryBreak/MasteryLevel rows and survives reopen', t => {
  const env = ready(t), service = env.service();
  const chip0 = amount(env.store, CHIP), mat0 = amount(env.store, 476002);

  // MasteryBreak.mastery_level_limit is the cap a break opens; an unbroken hero
  // is capped at 0, so levelling first is refused instead of inventing a cap.
  rejected(() => service.execute(659, [HERO_TID]), 3015);

  const broken = codec.unpack('pb_hero_mastery_break_rsp', service.execute(660, [HERO_TID]).data);
  assert.equal(broken.hero.mastery_break, 1);
  assert.equal(broken.hero.mastery_level ?? 0, 0);
  assert.equal(chip0 - amount(env.store, CHIP), BigInt(BREAK_ROW(1).chip));
  assert.equal(mat0 - amount(env.store, 476002), BigInt(BREAK_ROW(1).cost_res[0][1]));
  assert.equal(broken.res.changes.length, 2);

  const levelled = codec.unpack('pb_hero_mastery_level_up_rsp', service.execute(659, { value: [HERO_TID] }).data);
  assert.equal(levelled.hero.mastery_level, 1);
  assert.equal(levelled.hero.mastery_break, 1);
  const costs = levelled.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]);
  assert.deepEqual(costs.sort((a, b) => a[0] - b[0]), [[CHIP, -Number(LEVEL_ROW(1).chip)], [474002, -Number(LEVEL_ROW(1).cost_res[0][1])]].sort((a, b) => a[0] - b[0]));

  // The level cap is the break limit, so the eleventh level is refused.
  for (let level = 2; level <= 10; level++) service.execute(659, [HERO_TID]);
  rejected(() => service.execute(659, [HERO_TID]), 3011);
  assert.equal(hero(env.store).mastery_level, 10);

  env.reopen();
  assert.equal(hero(env.store).mastery_level, 10, 'level persists through SQLite reopen');
  assert.equal(hero(env.store).mastery_break, 1, 'break persists through SQLite reopen');
  const login = codec.unpack('pb_hero_info', rawBinary(new Map(env.store.state().modules.value).get(10).value[0]));
  const loginHero = login.hero_list.find(row => Number(row.tid) === HERO_TID);
  assert.equal(loginHero.mastery_level, 10);
  assert.equal(loginHero.mastery_break, 1);
  const view = heroMasteryView(hero(env.store), heroTables);
  assert.deepEqual(
    { unlocked: view.unlocked, group: view.group, level: view.level, break: view.break, limit: view.level_limit, ability: view.mastery_ability },
    { unlocked: true, group: GROUP, level: 10, break: 1, limit: 10, ability: Number(heroTables.Ability.get(HERO_TID).mastery_ability) }
  );
});

test('mastery breakthrough stops at the configured break rows', t => {
  const env = ready(t), service = env.service();
  for (let level = 1; level <= 5; level++) {
    service.execute(660, [HERO_TID]);
    assert.equal(hero(env.store).mastery_break, level);
  }
  assert.equal(heroMasteryView(hero(env.store), heroTables).level_limit, 70);
  rejected(() => service.execute(660, [HERO_TID]), 3012);
  assert.equal(hero(env.store).mastery_break, 5);
});

test('insufficient materials, illegal hero/mastery ids and locked mastery fail without state changes', t => {
  const env = ready(t), service = env.service();
  service.execute(660, [HERO_TID]);
  const before = env.store.read();
  env.store.transaction(model => { model.resources.get(String(CHIP)).num = '0'; model.resources.get('474002').num = '0'; });
  const stocked = env.store.read();
  rejected(() => service.execute(659, [HERO_TID]), 301);
  assert.equal(hero(env.store).mastery_level, 0, 'failed level-up must not raise the level');
  assert.equal(amount(env.store, CHIP), 0n, 'failed level-up must not consume the remaining chip stock');

  rejected(() => service.execute(659, [9876543]), 3001);
  rejected(() => service.execute(660, [9876543]), 3001);
  rejected(() => service.execute(659, {}), 1);
  rejected(() => service.execute(659, [0]), 1);
  rejected(() => service.execute(661, [HERO_TID]), 1);

  // 9000100 is a shipped hero row without a Mastery row.
  env.store.transaction(model => grantResources(model, [[9000100, 1]], gameTables, { codec }));
  setHero(env.store, { star: 10 }, 9000100);
  rejected(() => service.execute(660, [9000100]), 3008);
  assert.equal(hero(env.store, 9000100).mastery_break ?? 0, 0);

  setHero(env.store, { star: 5 });
  rejected(() => service.execute(659, [HERO_TID]), 3019);
  rejected(() => service.execute(660, [HERO_TID]), 3019);
  assert.ok(before && stocked);
});

test('encoding and SQLite failures roll the mastery change back', t => {
  const env = ready(t), service = env.service();
  service.execute(660, [HERO_TID]);
  const snapshot = { level: hero(env.store).mastery_level, break: hero(env.store).mastery_break, chip: amount(env.store, CHIP) };

  const brokenCodec = { pack() { throw new Error('pack failure'); }, unpack: codec.unpack.bind(codec) };
  const encodingService = createHeroMasteryService({ store: env.store, codec: brokenCodec, heroTables });
  assert.throws(() => encodingService.execute(659, [HERO_TID]), /pack failure/);
  assert.deepEqual({ level: hero(env.store).mastery_level, break: hero(env.store).mastery_break, chip: amount(env.store, CHIP) }, snapshot);

  // A row the SQLite writer cannot persist: the transaction must not commit the
  // in-memory mastery change when the write fails.
  const failingStore = {
    read: () => env.store.read(),
    transaction(action) {
      const result = action(env.store.read());
      assert.ok(result);
      throw Object.assign(new Error('SQLITE_ERROR: simulated write failure'), { code: 'ERR_SQLITE_ERROR' });
    }
  };
  assert.throws(() => createHeroMasteryService({ store: failingStore, codec, heroTables }).execute(659, [HERO_TID]), /SQLITE_ERROR/);
  assert.deepEqual({ level: hero(env.store).mastery_level, break: hero(env.store).mastery_break, chip: amount(env.store, CHIP) }, snapshot);
  env.reopen();
  assert.deepEqual({ level: hero(env.store).mastery_level, break: hero(env.store).mastery_break, chip: amount(env.store, CHIP) }, snapshot);
});

test('gateway routes 659 and 660 over a temporary TCP connection', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-mastery-tcp-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  stock(game.store);
  setHero(game.store, { star: 10, mastery_level: 0, mastery_break: 0 });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  let reply = await request(660, 2, await encodeEtf([HERO_TID]));
  assert.equal(reply.err ?? 0, 0);
  assert.equal(codec.unpack('pb_hero_mastery_break_rsp', Buffer.from(reply.data, 'base64')).hero.mastery_break, 1);

  reply = await request(659, 3, await encodeEtf([HERO_TID]));
  assert.equal(reply.err ?? 0, 0);
  assert.equal(codec.unpack('pb_hero_mastery_level_up_rsp', Buffer.from(reply.data, 'base64')).hero.mastery_level, 1);

  const rejectedReply = await request(659, 4, await encodeEtf([9876543]));
  assert.equal(rejectedReply.err?.err, 3001);
  assert.equal(hero(game.store).mastery_level, 1);
});

