import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import {
  createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readCampHaloTables } from '../config/camp-halo-tables.mjs';
import { createCampHaloService, CAMP_HALO_COMMANDS } from '../game/camp-halo-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readCampHaloTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const CAMP_HALO_MODULE = 182;
const HERO_BLAZON_MODULE = 152;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-camp-halo-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Camp Halo Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const make = () => createCampHaloService({ store, codec, tables });
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

function moduleState(store, moduleId) {
  return new Map(store.read().state.modules.value).get(moduleId) ?? null;
}

function moduleBytes(store, moduleId) {
  const module = moduleState(store, moduleId);
  return module ? rawBinary(module) : Buffer.alloc(0);
}

function campHaloState(store) {
  const bytes = moduleBytes(store, CAMP_HALO_MODULE);
  return bytes.length ? codec.unpack('pb_camp_halo_role', bytes) : { halos: [] };
}

function resourceSnapshot(store) {
  return structuredClone(Object.fromEntries([...store.read().resources].map(([tid, value]) => [tid, value])));
}

const bondGroupsByCampus = new Map();
for (const row of tables.bondAttr.values()) {
  const group = tables.groupForBondTid(row.tid);
  if (!bondGroupsByCampus.has(group.campus)) bondGroupsByCampus.set(group.campus, new Map());
  const groups = bondGroupsByCampus.get(group.campus);
  if (!groups.has(group.tid)) groups.set(group.tid, []);
  groups.get(group.tid).push(row);
}

function exactBondTids(campus, target) {
  let states = new Map([[0, []]]);
  for (const [groupTid, rows] of bondGroupsByCampus.get(campus)) {
    const next = new Map(states);
    for (const [sum, path] of states) {
      for (const row of rows) {
        const total = sum + Number(row.chart_value);
        if (total > target || next.has(total)) continue;
        next.set(total, [...path, { groupTid, tid: row.tid }]);
      }
    }
    states = next;
    if (states.has(target)) return states.get(target).map(entry => entry.tid);
  }
  throw new Error(`No exact bond chart value ${target} exists for campus ${campus}`);
}

function writeBonds(env, targets) {
  const bondList = [];
  for (let campus = 1; campus <= 4; campus += 1) {
    bondList.push({ chapter_id: campus, bond_list: exactBondTids(campus, targets[campus] ?? 0) });
  }
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(HERO_BLAZON_MODULE, serializedBinary(codec.pack('pb_hero_blazon', { bond_list: bondList })));
    model.state.modules.value = [...modules];
  });
}

function setSelectCamp(env, camp) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(CAMP_HALO_MODULE, serializedBinary(codec.pack('pb_camp_halo_role', {
      halos: [], select_camp: camp
    })));
    model.state.modules.value = [...modules];
  });
}

function decodeCamp(service, camp) {
  return service.decode(103101, Buffer.from([131]), {
    etf: async () => [camp]
  });
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
  return { next, request, handshake };
}

test('CampHalo configuration fixes five camps, twenty levels, bond groups and chapters', () => {
  assert.deepEqual(tables.counts, {
    HeroCampHalo: 5,
    HeroCampHaloAttr: 20,
    BondAttr: 3200,
    BondGroup: 128,
    Chapter: 4
  });
  assert.deepEqual([...CAMP_HALO_COMMANDS], [103101]);
  assert.deepEqual(tables.campOrder, [1, 2, 3, 4, 9]);
  assert.deepEqual(tables.levelThresholds, [0, 400, 800, 1500]);
  for (const camp of tables.campOrder) {
    assert.deepEqual(tables.thresholdsForCamp(camp), [0, 400, 800, 1500]);
    assert.deepEqual(tables.requiredCampuses(camp), camp === 9 ? [1, 2, 3, 4] : [camp]);
  }
  assert.equal(tables.entryFor(1, 1).unlockScript, 546626500101);
  assert.equal(tables.entryFor(9, 3).unlockScript, 546626500903);
  assert.equal(tables.chapter.size, 4);
});

test('fresh login preserves an empty camp-halo module without fabricating level rows', t => {
  const env = setup(t);
  const projection = env.make().ensureLoginState();
  assert.equal(moduleBytes(env.store, CAMP_HALO_MODULE).length, 0);
  assert.deepEqual(campHaloState(env.store), { halos: [] });
  assert.deepEqual(projection.levels, {});
  assert.equal(projection.selectCamp, 0);
  assert.deepEqual(projection.chartValues, { 1: 0, 2: 0, 3: 0, 4: 0 });
});

test('camp 1 upgrades at the exact chart threshold without consuming resources', t => {
  const env = setup(t);
  writeBonds(env, { 1: 400, 2: 0, 3: 0, 4: 0 });
  setSelectCamp(env, 1);
  const resourcesBefore = resourceSnapshot(env.store);
  const blazonBefore = moduleBytes(env.store, HERO_BLAZON_MODULE);

  const result = env.make().execute(103101, 1);
  const response = codec.unpack('pb_camp_halo_role', result.data);
  assert.equal(result.schema, 'pb_camp_halo_role');
  assert.deepEqual(response.halos, [{ camp_tid: 1, level: 1 }]);
  assert.equal(response.select_camp, 1);
  assert.deepEqual(campHaloState(env.store), response);
  assert.deepEqual(resourceSnapshot(env.store), resourcesBefore);
  assert.deepEqual(moduleBytes(env.store, HERO_BLAZON_MODULE), blazonBefore);
});

test('one point below the threshold rejects atomically and keeps resources and state unchanged', t => {
  const env = setup(t);
  writeBonds(env, { 1: 399, 2: 0, 3: 0, 4: 0 });
  const resourcesBefore = resourceSnapshot(env.store);
  const haloBefore = moduleBytes(env.store, CAMP_HALO_MODULE);
  assert.throws(() => env.make().execute(103101, 1), error => error.code === 5);
  assert.deepEqual(moduleBytes(env.store, CAMP_HALO_MODULE), haloBefore);
  assert.deepEqual(resourceSnapshot(env.store), resourcesBefore);
});

test('levels advance 1 to 2 to 3, reject level 4 and survive a SQLite reopen', t => {
  const env = setup(t);
  writeBonds(env, { 1: 1500, 2: 0, 3: 0, 4: 0 });
  const service = env.make();
  assert.equal(codec.unpack('pb_camp_halo_role', service.execute(103101, 1).data).halos[0].level, 1);
  assert.equal(codec.unpack('pb_camp_halo_role', service.execute(103101, 1).data).halos[0].level, 2);
  assert.equal(codec.unpack('pb_camp_halo_role', service.execute(103101, 1).data).halos[0].level, 3);
  assert.throws(() => service.execute(103101, 1), error => error.code === 5);
  assert.equal(campHaloState(env.store).halos[0].level, 3);
  env.reopen();
  assert.equal(campHaloState(env.store).halos[0].level, 3);
});

test('chaos camp 9 requires all four chapters to meet the same threshold', t => {
  const env = setup(t);
  writeBonds(env, { 1: 400, 2: 400, 3: 400, 4: 399 });
  const service = env.make();
  assert.throws(() => service.execute(103101, 9), error => error.code === 5);
  assert.deepEqual(campHaloState(env.store).halos, []);

  writeBonds(env, { 1: 400, 2: 400, 3: 400, 4: 400 });
  const response = codec.unpack('pb_camp_halo_role', service.execute(103101, 9).data);
  assert.deepEqual(response.halos, [{ camp_tid: 9, level: 1 }]);
});

test('ETF camp decoding is single-valued and unsupported camps fail closed', async t => {
  const env = setup(t);
  const service = env.make();
  assert.equal(await service.decode(103101, await encodeEtf([1]), { etf: decodeEtfValue }), 1);
  assert.equal(await decodeCamp(service, 9), 9);
  await assert.rejects(
    service.decode(103101, await encodeEtf([1, 2]), { etf: decodeEtfValue }),
    error => error.code === 1
  );
  await assert.rejects(
    service.decode(103101, Buffer.alloc(0), { etf: decodeEtfValue }),
    error => error.code === 1
  );
  assert.throws(() => service.execute(103101, 5), error => error.code === 5);
  assert.throws(() => service.execute(103101, 0), error => error.code === 1);
});

test('unknown current bond tids fail closed without changing the halo state', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(HERO_BLAZON_MODULE, serializedBinary(codec.pack('pb_hero_blazon', {
      bond_list: [{ chapter_id: 1, bond_list: [999999] }]
    })));
    model.state.modules.value = [...modules];
  });
  const before = moduleBytes(env.store, CAMP_HALO_MODULE);
  assert.throws(() => env.make().execute(103101, 1), error => error.code === 5);
  assert.deepEqual(moduleBytes(env.store, CAMP_HALO_MODULE), before);
});

test('real gateway routes ETF 103101 and returns pb_camp_halo_role', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-camp-halo-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Camp Halo Gateway' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  writeBonds({ store }, { 1: 400, 2: 0, 3: 0, 4: 0 });
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('camp-halo-gateway', roleId, 'camp-halo-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'camp-halo-session' && uid === 'camp-halo-gateway'
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
    channel_uid: 'camp-halo-gateway',
    verify_code: 'camp-halo-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const response = await peer.request(103101, 2, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  const state = codec.unpack('pb_camp_halo_role', Buffer.from(response.data, 'base64'));
  assert.deepEqual(state.halos, [{ camp_tid: 1, level: 1 }]);

  const refused = await peer.request(103101, 3, await encodeEtf([5]));
  assert.equal(refused.err.err, 5);
  assert.equal(refused.data ?? '', '');
});
