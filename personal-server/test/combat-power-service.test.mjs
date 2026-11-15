import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import {
  createGameCodec, decodeEtf, encodeEtf, rawBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readCombatPowerTables } from '../config/combat-power-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createCombatPowerService, COMBAT_POWER_COMMANDS } from '../game/combat-power-service.mjs';
import { decodeBitBlock, hasBit } from '../game/bit-block.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const combatTables = readCombatPowerTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const STATISTICS_MODULE = 21;
const COMBAT_POWER_STATISTIC_TID = 3;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-combat-power-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Combat Power Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const make = (serviceCodec = codec) => createCombatPowerService({
    store, codec: serviceCodec, gameTables, tables: combatTables
  });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    seed,
    get store() { return store; },
    make,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
    }
  };
}

function setRolePower(env, power) {
  env.store.transaction(model => {
    model.state.rolePower = { lineup_type: 1, power: String(power), computed_at: FIXED_SECONDS };
  });
}

function moduleBytes(store, moduleId, slot = null) {
  const module = new Map(store.read().state.modules.value).get(moduleId);
  const target = slot === null ? module : module?.value?.[slot];
  return target ? rawBinary(target) : Buffer.alloc(0);
}

function statisticsMaximum(store) {
  const bytes = moduleBytes(store, STATISTICS_MODULE, 0);
  const data = bytes.length ? codec.unpack('pb_count_statics_max', bytes) : { max_list: [] };
  return data.max_list.find(row => Number(row.tid) === COMBAT_POWER_STATISTIC_TID) ?? null;
}

function resourceAmount(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

function claimState(store) {
  return structuredClone(store.read().state.combatPower);
}

async function decodeEtfValue(data) {
  const decoded = await decodeEtf(data);
  return decoded?.value ?? decoded;
}

function gatewayClient(socket) {
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
  async function handshake() {
    send(Buffer.from('verify'));
    const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
    send(Buffer.concat([
      Buffer.from(key),
      localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
      parsed.rawFlags,
      Buffer.from('1.55.090365')
    ]));
  }
  return { request, handshake };
}

test('CombatPower configuration fixes all 24 contiguous thresholds and awards', () => {
  assert.deepEqual(combatTables.counts, { CPBreak: 24 });
  assert.deepEqual([...COMBAT_POWER_COMMANDS], [802]);
  assert.equal(combatTables.entryFor(1).breakValue, 50_000);
  assert.deepEqual(combatTables.entryFor(1).award, [[391002, 200]]);
  assert.equal(combatTables.entryFor(4).breakValue, 200_000);
  assert.deepEqual(combatTables.entryFor(4).award, [[423002, 20], [392002, 2], [391002, 400]]);
  assert.equal(combatTables.entryFor(24).breakValue, 10_000_000);
  assert.equal(combatTables.entryFor(24).special, true);
});

test('login projects authoritative combat power into CountStatistics module 21 slot 0', t => {
  const env = setup(t);
  setRolePower(env, 200_000);
  const projection = env.make().ensureLoginState();
  assert.equal(projection.historyMax, 200_000);
  assert.equal(projection.statisticsSlot, 3);
  assert.deepEqual(projection.claimedTids, []);
  assert.deepEqual(statisticsMaximum(env.store), { tid: '3', progress: '200000' });
  assert.deepEqual(claimState(env.store), { historyMax: '200000', receivedBits: '' });
});

test('802 grants the exact tier reward, encodes the BitBlock and remains idempotent after reopen', async t => {
  const env = setup(t);
  setRolePower(env, 50_000);
  const service = env.make();
  service.ensureLoginState();
  assert.equal(resourceAmount(env.store, 391002), 0);

  const result = service.execute(802, 1);
  const response = codec.unpack('pb_power_award_toc', result.data);
  const bits = await decodeBitBlock(Buffer.from(response.gain_award_data, 'base64'));
  assert.equal(hasBit(bits, 1), true);
  assert.equal(response.res.changes.find(change => Number(change.tid) === 391002).diff_num, '200');
  assert.equal(resourceAmount(env.store, 391002), 200);
  assert.equal(claimState(env.store).receivedBits, Buffer.from([0x40, 0x00]).toString('base64'));

  env.reopen();
  const reopened = env.make();
  reopened.ensureLoginState();
  assert.throws(() => reopened.execute(802, 1), error => error.code === 5 && /already/.test(error.message));
  assert.equal(resourceAmount(env.store, 391002), 200);
});

test('802 rejects unknown and unqualified tiers without changing rewards or claim state', t => {
  const env = setup(t);
  setRolePower(env, 100_000);
  const service = env.make();
  service.ensureLoginState();
  assert.throws(() => service.execute(802, 999), error => error.code === 5);
  assert.throws(() => service.execute(802, 3), error => error.code === 5 && /requires/.test(error.message));
  assert.throws(() => service.execute(802, 0), error => error.code === 1);
  assert.equal(resourceAmount(env.store, 391002), 0);
  assert.deepEqual(claimState(env.store), { historyMax: '100000', receivedBits: '' });
});

test('response encoding failure rolls back the resource grant and claimed bit', t => {
  const env = setup(t);
  setRolePower(env, 50_000);
  env.make().ensureLoginState();
  const brokenCodec = Object.create(codec);
  brokenCodec.pack = (name, value) => {
    if (name === 'pb_power_award_toc') throw new Error('injected combat power response failure');
    return codec.pack(name, value);
  };
  assert.throws(
    () => env.make(brokenCodec).execute(802, 1),
    /injected combat power response failure/
  );
  assert.equal(resourceAmount(env.store, 391002), 0);
  assert.deepEqual(claimState(env.store), { historyMax: '50000', receivedBits: '' });
});

test('ETF 802 decoding accepts the client scalar and rejects malformed multi-value payloads', async t => {
  const env = setup(t);
  const service = env.make();
  assert.equal(await service.decode(802, await encodeEtf(1), { etf: decodeEtfValue }), 1);
  await assert.rejects(
    service.decode(802, await encodeEtf([1, 2]), { etf: decodeEtfValue }),
    error => error.code === 1
  );
  await assert.rejects(service.decode(802, Buffer.alloc(0), { etf: decodeEtfValue }), error => error.code === 1);
});

test('real gateway routes ETF 802 and the 803 preset power refresh', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-combat-power-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Combat Power Gateway' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  setRolePower({ store }, 50_000);
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('combat-power-gateway', roleId, 'combat-power-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'combat-power-session' && uid === 'combat-power-gateway'
      ? { userId: uid, loginCode: uid }
      : null
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  await once(socket, 'connect');
  const peer = gatewayClient(socket);
  await peer.handshake();
  const login = await peer.request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'combat-power-gateway',
    verify_code: 'combat-power-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const response = await peer.request(802, 2, await encodeEtf(1));
  assert.equal(response.err, undefined);
  const award = codec.unpack('pb_power_award_toc', Buffer.from(response.data, 'base64'));
  const bits = await decodeBitBlock(Buffer.from(award.gain_award_data, 'base64'));
  assert.equal(hasBit(bits, 1), true);
  assert.equal(award.res.changes.find(change => Number(change.tid) === 391002).diff_num, '200');

  const duplicate = await peer.request(802, 3, await encodeEtf(1));
  assert.equal(duplicate.err.err, 5);
  // 803 left the fail-closed table in batch H1: the gateway now recomputes the
  // preset power from the authoritative roster and answers with an empty ack.
  const refreshed = await peer.request(803, 4, Buffer.alloc(0));
  assert.equal(refreshed.err, undefined);
  assert.equal(refreshed.data ?? '', '');
  const presets = game.store.read().lineups.pre_lineups ?? [];
  assert.ok(presets.length, 'the captured role must carry a preset lineup');
  assert.ok(Number(presets[0].lineup?.power ?? 0) > 0, '803 must persist a recomputed power');
});
