import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createHeroHandbookService } from '../game/hero-handbook-service.mjs';
import { createRecruitService } from '../game/recruit-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createLocalGame } from '../local-game.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables(), tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));

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

test('login codex records every player-facing owned hero and preserves own-award bits', t => {
  const env = setup(t);
  const hiddenTid = [...heroTables.Hero].find(([, config]) => config.not_in_guide === true)[0];
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(10);
    module.value[3] = serializedBinary(codec.pack('pb_hero_all_handbook_record', {
      records: [],
      own_rev: Buffer.from([0x80, 0x01])
    }));
    model.state.modules.value = [...modules];
    model.heroInfo.hero_list.push({
      tid: String(hiddenTid), uid: String(BigInt(hiddenTid) + 100000000n), level: 1, star: 0,
      star_progress: 0, breakthrough_level: 0, quality: heroTables.Hero.get(hiddenTid).quality
    });
    Object.assign(model.heroInfo.hero_list.find(hero => hero.uid === '2020601'), {
      star: 3, quality: 60, mutant: 17001
    });
    model.heroInfo.hero_list.push({
      tid: '2020601', uid: '3020601', level: 1, star: 4, star_progress: 0,
      breakthrough_level: 0, quality: 60
    });
  });

  const result = env.make().ensureLoginState();
  const handbook = decodeLoginHandbook(env.store.state());
  assert.equal(result.recordCount, 6);
  assert.equal(handbook.records.length, 6);
  assert.equal(handbook.own_rev, 'gAE=');
  assert.ok(handbook.records.every(record => record.tid !== hiddenTid));
  assert.deepEqual(handbook.records.find(record => record.tid === 2020601), {
    tid: 2020601, quality: 60, star: 4, is_mutant: true
  });

  env.reopen();
  env.make().ensureLoginState();
  assert.deepEqual(decodeLoginHandbook(env.store.state()), handbook);
});

test('a recruited hero is lit and remains lit after reopening the save', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const ticket = model.resources.get('2002');
    if (ticket) ticket.num = '10';
    else model.resources.set('2002', { tid: '2002', num: '10', location: [6, 1, 0] });
  });
  const recruit = createRecruitService({ store: env.store, codec, tables, heroTables, random: () => 0 });
  recruit.ensureLoginState();
  recruit.execute(601, { draw_lib: 1, point_draw_num: 1 });
  assert.ok(env.store.read().heroInfo.hero_list.some(hero => Number(hero.tid) === 1010101));

  env.make().ensureLoginState();
  let handbook = decodeLoginHandbook(env.store.state());
  const recruited = handbook.records.find(record => record.tid === 1010101);
  assert.equal(recruited.quality, 30);
  assert.equal(Number(recruited.star ?? 0), 0);
  assert.equal(Boolean(recruited.is_mutant ?? false), false);

  env.reopen();
  env.make().ensureLoginState();
  handbook = decodeLoginHandbook(env.store.state());
  assert.ok(handbook.records.some(record => record.tid === 1010101));
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
  assert.deepEqual(handbook.records.map(record => record.tid), [1020301, 1020601, 2010101, 2010201, 2020601, 4030801]);
});
