import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { assembleHeroAttributes } from '../game/attribute-service.mjs';
import { createPreLineupPowerService, PRE_LINEUP_POWER_COMMANDS } from '../game/pre-lineup-power-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-pre-lineup-power-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    freshAccount: true,
    createdAt: FIXED_SECONDS,
    roleName: 'Preset Power Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const make = (overrides = {}) => createPreLineupPowerService({
    store, codec, heroTables, attributeTables, ...overrides
  });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    get store() { return store; },
    make,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
    }
  };
}

function presets(store) {
  return structuredClone(store.read().lineups.pre_lineups ?? []);
}

function expectedTeamPower(store, preset) {
  const model = store.read();
  const heroes = new Map((model.heroInfo?.hero_list ?? []).map(hero => [String(hero.uid), hero]));
  let total = 0;
  const perFighter = [];
  for (const fighter of preset.lineup?.fighter_list ?? []) {
    const hero = heroes.get(String(fighter.hero_id));
    assert.ok(hero, `fixture hero ${fighter.hero_id} must exist`);
    const power = assembleHeroAttributes({ hero, heroTables, attributeTables }).power;
    total += power;
    perFighter.push({ heroId: String(hero.uid), power });
  }
  return { total, perFighter };
}

function loginPresetPower(store) {
  // The login payload is materialised from the authoritative lineup rows when
  // the gateway builds it (game-store materializeState), so read it from there.
  const login = codec.unpack('pb_lineup_login', Buffer.from(store.state().lineups, 'base64'));
  const role = codec.unpack('pb_role_lineup', Buffer.from(login.pre_lineup, 'base64'));
  return (role.pre_lineups ?? []).map(preset => ({
    index: Number(preset.index),
    power: Number(preset.lineup?.power ?? 0),
    maxPower: Number(preset.lineup?.max_power ?? 0)
  }));
}

test('803 recomputes the preset power from authoritative hero attributes', t => {
  const env = setup(t);
  const service = env.make();
  assert.deepEqual([...PRE_LINEUP_POWER_COMMANDS], [803]);
  assert.equal(service.supports(803), true);
  assert.equal(service.supports(802), false);

  const before = presets(env.store)[0];
  assert.equal(before.index, 1);
  const expected = expectedTeamPower(env.store, before);

  const result = service.execute(803, 1);
  assert.equal(result.data.length, 0, '803 answers with an empty acknowledgement');

  const after = presets(env.store)[0];
  assert.equal(Number(after.lineup.power), expected.total);
  assert.equal(Number(after.lineup.max_power), expected.total);
  const fighterPower = new Map(after.lineup.fighter_list.map(fighter => [String(fighter.hero_id), Number(fighter.power)]));
  for (const entry of expected.perFighter) assert.equal(fighterPower.get(entry.heroId), entry.power);
  assert.ok(expected.total > 0, 'the fixture preset must produce a positive power');
});

test('803 keeps the historical maximum when the recomputed power drops', t => {
  const env = setup(t);
  env.store.transaction(model => {
    model.lineups.pre_lineups[0].lineup.max_power = '999999999';
    model.lineups.pre_lineups[0].lineup.power = '123';
  });
  const service = env.make();
  const expected = expectedTeamPower(env.store, presets(env.store)[0]);
  service.execute(803, 1);
  const after = presets(env.store)[0];
  assert.equal(Number(after.lineup.power), expected.total);
  assert.equal(Number(after.lineup.max_power), 999999999);
});

test('803 refuses an unknown index, a client-supplied power and an empty preset without changing state', t => {
  const env = setup(t);
  const service = env.make();
  const before = presets(env.store);

  assert.throws(() => service.execute(803, 99), error => error.code === 5);
  assert.deepEqual(presets(env.store), before, 'unknown index must not touch the preset');

  // A client-sent power object has no index and is never accepted as a value.
  assert.throws(() => service.execute(803, { power: 999999999 }), error => error.code === 5);
  assert.deepEqual(presets(env.store), before, 'client power must not be stored');

  env.store.transaction(model => { model.lineups.pre_lineups[0].lineup.fighter_list = []; });
  const emptyPreset = presets(env.store);
  assert.throws(() => service.execute(803, 1), error => error.code === 5);
  assert.deepEqual(presets(env.store), emptyPreset, 'an empty preset must not be given a power');
});

test('803 selects the current preset when the request carries no index', t => {
  const env = setup(t);
  env.store.transaction(model => {
    model.lineups.pre_lineups[0].index = 5;
    model.lineups.cur_pre_index = 5;
  });
  const service = env.make();
  const expected = expectedTeamPower(env.store, presets(env.store).find(preset => preset.index === 5));
  service.execute(803, undefined);
  const after = presets(env.store).find(preset => preset.index === 5);
  assert.equal(Number(after.lineup.power), expected.total);
});

test('803 power is part of the module 9 login payload and survives a SQLite reopen', t => {
  const env = setup(t);
  env.make().execute(803, 1);
  const expected = expectedTeamPower(env.store, presets(env.store)[0]).total;
  env.reopen();
  const after = presets(env.store)[0];
  assert.equal(Number(after.lineup.power), expected);
  const reloaded = loginPresetPower(env.store).find(entry => entry.index === 1);
  assert.equal(reloaded.power, expected);
  assert.equal(reloaded.maxPower, expected);
});

async function tcpClient(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-pre-lineup-tcp-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW,
    logger: event => events.push(event),
    ...options
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
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
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  return { game, events, request, send };
}

test('803 over a real socket acknowledges and persists the recomputed preset power', { timeout: 15000 }, async t => {
  const { game, events, request } = await tcpClient(t);
  const before = presets(game.store);
  assert.ok(before.length, 'the captured account must carry a preset lineup');
  const expected = expectedTeamPower(game.store, before[0]).total;

  const response = await request(803, 2, await encodeEtf(Number(before[0].index)));
  assert.equal(response.err, undefined, '803 must be accepted');
  assert.equal(response.data ?? '', '', '803 replies with an empty acknowledgement');

  const after = presets(game.store)[0];
  assert.equal(Number(after.lineup.power), expected);
  assert.equal(Number(after.lineup.max_power), Math.max(Number(before[0].lineup?.max_power ?? 0), expected));
  assert.ok(events.some(event => event.event === 'pre_lineup_power_recomputed' && event.index === Number(before[0].index)));
  assert.equal(events.some(event => event.event === 'r1_command_refused' && Number(event.type) === 803), false);
});

test('803 over a real socket rejects a term that does not carry a preset index', { timeout: 15000 }, async t => {
  const { game, request, send } = await tcpClient(t);
  const before = presets(game.store);
  const response = await request(803, 2, await encodeEtf('not-an-index'));
  assert.equal(response.err?.err, 1);
  assert.deepEqual(presets(game.store), before, 'a malformed request must not change the preset');
  assert.ok(send);
});

