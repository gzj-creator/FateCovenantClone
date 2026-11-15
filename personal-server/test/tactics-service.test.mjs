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
import { readTacticsTables } from '../config/tactics-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { RANK_IDS } from '../config/rank-tables.mjs';
import { assembleHeroAttributes } from '../game/attribute-service.mjs';
import { rankPower } from '../game/rank-service.mjs';
import { rosterFor } from '../game/pvp-battle.mjs';
import {
  readTacticsState, writeTacticsLevels, TACTICS_MODULE_ID
} from '../game/tactics-state.mjs';
import { createTacticsService, TACTICS_COMMANDS } from '../game/tactics-service.mjs';
import { createR1FailClosedCommandService } from '../game/r1-fail-closed-command-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readTacticsTables();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const gameTables = readGameTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const TACTICS_POINT_ITEM = 2401900;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-tactics-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Tactics Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const make = (overrides = {}) => createTacticsService({
    store, codec, tables, resourceTables: gameTables, now: () => FIXED_NOW, ...overrides
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

function setResources(store, amount) {
  store.transaction(model => {
    model.resources.set(String(TACTICS_POINT_ITEM), {
      tid: String(TACTICS_POINT_ITEM),
      num: String(amount),
      location: [6, 1, model.resources.size]
    });
  });
}

function resourceAmount(store) {
  return Number(store.read().resources.get(String(TACTICS_POINT_ITEM))?.num ?? 0);
}

function moduleBytes(store) {
  const module = new Map(store.read().state.modules.value).get(TACTICS_MODULE_ID);
  return module ? rawBinary(module) : Buffer.alloc(0);
}

function stateLevels(store) {
  return readTacticsState({ model: store.read(), codec, tables }).levels;
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

function rankSelfValue(response) {
  const board = codec.unpack('rank_to_client', Buffer.from(response.data, 'base64'));
  assert.equal(Number(board.rank_id), RANK_IDS.POWER);
  return Number(board.self_value);
}

test('TacticsTable fixes 260 attrs, four chapters, 52 five-level nodes and chapter gates', () => {
  assert.deepEqual(tables.counts, { Attr: 260, Chapter: 4, Node: 52 });
  assert.deepEqual([...TACTICS_COMMANDS], [84501, 84502]);
  assert.deepEqual(tables.chapterTids, [1, 2, 3, 4]);
  assert.deepEqual(tables.chapterTids.map(tid => tables.chapterForTid(tid).openNext), [30, 48, 54, 0]);
  assert.deepEqual(tables.chapterTids.map(tid => tables.rootForChapter(tid).tid), [1, 101, 201, 301]);
  for (const node of tables.nodes.values()) {
    assert.equal(node.levelAttrs.length, 5);
    assert.equal(node.openNext, 3);
    for (const attrTid of node.levelAttrs) {
      const attr = tables.attrForTid(attrTid);
      assert.equal(attr.costItem, TACTICS_POINT_ITEM);
      assert.ok(attr.cost === 1 || attr.cost === 2);
    }
  }
});

test('fresh tactics state is empty and the first root level saves root plus sub_list with exact cost', t => {
  const env = setup(t);
  setResources(env.store, 5);
  const service = env.make();
  assert.deepEqual(service.ensureLoginState(), { persisted: false, chapterCount: 0, leveledNodes: 0 });
  assert.equal(moduleBytes(env.store).length, 0);

  const result = service.execute(84501, 1);
  const response = codec.unpack('pb_tactics_level_up_back', result.data);
  assert.deepEqual(response.node_info, { node_tid: 1, level: 1 });
  assert.deepEqual(response.res.changes, [{
    tid: String(TACTICS_POINT_ITEM), new_num: '4', diff_num: '-1'
  }]);
  assert.equal(resourceAmount(env.store), 4);

  const master = codec.unpack('pb_tactics_master', moduleBytes(env.store));
  const chapter = master.info_list.find(item => item.chapter_tid === 1);
  assert.deepEqual(chapter.root_node, { node_tid: 1, level: 1 });
  assert.deepEqual(chapter.sub_list.find(item => item.node_tid === 1), { node_tid: 1, level: 1 });
  env.reopen();
  assert.equal(stateLevels(env.store).get(1), 1);
});

test('parent and cross-chapter prerequisites reject without spending resources or mutating state', t => {
  const env = setup(t);
  setResources(env.store, 50);
  const service = env.make();

  assert.throws(() => service.execute(84501, 2), error => error.code === 5);
  assert.throws(() => service.execute(84501, 101), error => error.code === 5);
  assert.equal(resourceAmount(env.store), 50);
  assert.equal(moduleBytes(env.store).length, 0);

  env.store.transaction(model => {
    const levels = new Map([...tables.nodes.keys()].map(tid => [tid, 0]));
    for (const tid of [1, 2, 6, 3, 7, 8]) levels.set(tid, 5);
    assert.equal(tables.totalPoints(levels, 1), 30);
    writeTacticsLevels(model, codec, tables, levels);
  });
  const response = codec.unpack('pb_tactics_level_up_back', service.execute(84501, 101).data);
  assert.deepEqual(response.node_info, { node_tid: 101, level: 1 });
  assert.equal(stateLevels(env.store).get(101), 1);
});

test('level five costs two points and missing currency rolls back at the exact boundary', t => {
  const env = setup(t);
  setResources(env.store, 5);
  const service = env.make();
  for (let level = 1; level <= 4; level += 1) service.execute(84501, 1);
  assert.equal(resourceAmount(env.store), 1);
  const before = moduleBytes(env.store);
  assert.throws(() => service.execute(84501, 1), error => error.code === 301);
  assert.equal(resourceAmount(env.store), 1);
  assert.deepEqual(moduleBytes(env.store), before);
  assert.equal(stateLevels(env.store).get(1), 4);

  setResources(env.store, 2);
  const response = codec.unpack('pb_tactics_level_up_back', service.execute(84501, 1).data);
  assert.deepEqual(response.node_info, { node_tid: 1, level: 5 });
  assert.equal(resourceAmount(env.store), 0);
  assert.throws(() => service.execute(84501, 1), error => error.code === 5);
});

test('an encoding failure rolls back the consumed resource and node level together', t => {
  const env = setup(t);
  setResources(env.store, 4);
  const before = moduleBytes(env.store);
  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === 'pb_tactics_level_up_back') throw new Error('response encoding failed');
      return codec.pack(name, value);
    }
  };
  const service = env.make({ codec: brokenCodec });
  assert.throws(() => service.execute(84501, 1), /response encoding failed/);
  assert.equal(resourceAmount(env.store), 4);
  assert.deepEqual(moduleBytes(env.store), before);
});

test('ETF requests require exactly one node or chapter id and both tactics commands are routed', async t => {
  const env = setup(t);
  setResources(env.store, 2);
  const service = env.make();
  assert.equal(await service.decode(84501, await encodeEtf([1]), { etf: decodeEtfValue }), 1);
  assert.equal(await service.decode(84502, await encodeEtf([1]), { etf: decodeEtfValue }), 1);
  await assert.rejects(
    service.decode(84501, await encodeEtf([1, 2]), { etf: decodeEtfValue }),
    error => error.code === 1
  );
  const failClosed = createR1FailClosedCommandService();
  assert.equal(failClosed.supports(84502), false);
  assert.equal(failClosed.supports(84501), false);
});

test('chapter reset refunds only the exact configured points and leaves other chapters intact', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const levels = new Map([...tables.nodes.keys()].map(tid => [tid, 0]));
    levels.set(1, 5);
    levels.set(6, 2);
    levels.set(101, 1);
    writeTacticsLevels(model, codec, tables, levels);
  });
  setResources(env.store, 4);
  const expectedRefund = [...Array(5)].reduce((sum, _, index) => sum + tables.attrForTid(tables.nodeForTid(1).levelAttrs[index]).cost, 0)
    + tables.attrForTid(tables.nodeForTid(6).levelAttrs[0]).cost
    + tables.attrForTid(tables.nodeForTid(6).levelAttrs[1]).cost;
  const service = env.make();
  const response = codec.unpack('pb_tactics_reset_back', service.execute(84502, 1).data);
  assert.equal(resourceAmount(env.store), 4 + expectedRefund);
  assert.equal(Number(response.res.changes[0].tid), TACTICS_POINT_ITEM);
  assert.equal(Number(response.res.changes[0].diff_num), expectedRefund);
  assert.equal(stateLevels(env.store).get(1), 0);
  assert.equal(stateLevels(env.store).get(6), 0);
  assert.equal(stateLevels(env.store).get(101), 1);
  assert.equal(response.master_info.info_list.find(row => row.chapter_tid === 1).sub_list.every(row => (row.level ?? 0) === 0), true);
  assert.equal(response.master_info.info_list.find(row => row.chapter_tid === 2).root_node.level, 1);

  const before = { resources: resourceAmount(env.store), module: moduleBytes(env.store) };
  assert.throws(() => service.execute(84502, 1), error => error.code === 5);
  assert.deepEqual({ resources: resourceAmount(env.store), module: moduleBytes(env.store) }, before);
  assert.throws(() => service.execute(84502, 99), error => error.code === 5);
  env.reopen();
  assert.equal(stateLevels(env.store).get(1), 0);
  assert.equal(stateLevels(env.store).get(101), 1);
});

test('chapter reset encoding failure rolls back both the refund and zeroed chapter', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const levels = new Map([...tables.nodes.keys()].map(tid => [tid, 0]));
    levels.set(1, 2);
    writeTacticsLevels(model, codec, tables, levels);
  });
  setResources(env.store, 3);
  const before = moduleBytes(env.store);
  const brokenCodec = {
    unpack: codec.unpack.bind(codec),
    pack(name, value) {
      if (name === 'pb_tactics_reset_back') throw new Error('reset response encoding failed');
      return codec.pack(name, value);
    }
  };
  assert.throws(() => env.make({ codec: brokenCodec }).execute(84502, 1), /reset response encoding failed/);
  assert.equal(resourceAmount(env.store), 3);
  assert.deepEqual(moduleBytes(env.store), before);
});

test('tactics levels project exchanged HP, attack and defense into hero stats and power', t => {
  const env = setup(t);
  const hero = env.store.read().heroInfo.hero_list[0];
  const plain = assembleHeroAttributes({ hero, heroTables, attributeTables });
  env.store.transaction(model => {
    const levels = new Map([...tables.nodes.keys()].map(tid => [tid, 0]));
    levels.set(1, 1);
    writeTacticsLevels(model, codec, tables, levels);
  });
  const globalAttrs = tables.collectBaseValues(stateLevels(env.store));
  const projected = assembleHeroAttributes({ hero, heroTables, attributeTables, globalAttrs });
  assert.deepEqual(globalAttrs, { 201: 90, 202: 15, 209: 9 });
  assert.ok(projected.stats.hp >= plain.stats.hp + 90);
  assert.ok(projected.stats.attack >= plain.stats.attack + 15);
  assert.equal(projected.stats.physicalDefense, plain.stats.physicalDefense + 9);
  assert.equal(projected.stats.magicDefense, plain.stats.magicDefense + 9);
  assert.ok(projected.power > plain.power);
  assert.ok(projected.sources.some(source => source.play === 'global:tactics' && source.sourceAttr === 201));
});

test('rank power and PvP roster consume the authoritative tactics projection', t => {
  const env = setup(t);
  const globalAttrs = { 201: 90, 202: 15, 209: 9 };
  const model = env.store.read();
  const plainPower = rankPower(model);
  const projectedPower = rankPower(model, { globalAttrs });
  assert.ok(projectedPower > plainPower);

  const plainRoster = rosterFor({ model });
  const projectedRoster = rosterFor({ model, globalAttrsForModel: () => globalAttrs });
  assert.ok(projectedRoster.entries[0].stats.hp > plainRoster.entries[0].stats.hp);
  assert.ok(projectedRoster.entries[0].stats.attack > plainRoster.entries[0].stats.attack);
  assert.ok(projectedRoster.entries[0].power > plainRoster.entries[0].power);
});

test('duplicate root level zero cannot hide a conflicting sub_list level', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(TACTICS_MODULE_ID, serializedBinary(codec.pack('pb_tactics_master', {
      info_list: [{
        chapter_tid: 1,
        root_node: { node_tid: 1, level: 0 },
        sub_list: [{ node_tid: 1, level: 1 }]
      }]
    })));
    model.state.modules.value = [...modules];
  });
  assert.throws(
    () => readTacticsState({ model: env.store.read(), codec, tables }),
    error => error.code === 5 && /duplicated/.test(error.message)
  );
});

test('real gateway routes ETF 84501 and 84502 with persistence and login projection', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-tactics-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Tactics Gateway' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('tactics-gateway', roleId, 'tactics-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'tactics-session' && uid === 'tactics-gateway'
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
    channel_uid: 'tactics-gateway',
    verify_code: 'tactics-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  game.featureOverrides.set({
    serverId: game.store.read().state.serverId,
    funId: 1052,
    mode: 'force_open',
    reason: 'tactics service regression',
    operator: 'test'
  });
  const beforeUpgradeRank = await peer.request(2000, 2, await encodeEtf([RANK_IDS.POWER]));
  assert.equal(beforeUpgradeRank.err, undefined);
  setResources(game.store, 2);

  const upgraded = await peer.request(84501, 3, await encodeEtf([1]));
  assert.equal(upgraded.err, undefined);
  const response = codec.unpack('pb_tactics_level_up_back', Buffer.from(upgraded.data, 'base64'));
  assert.deepEqual(response.node_info, { node_tid: 1, level: 1 });

  const afterUpgradeRank = await peer.request(2000, 4, await encodeEtf([RANK_IDS.POWER]));
  assert.equal(afterUpgradeRank.err, undefined);
  const beforePower = rankSelfValue(beforeUpgradeRank);
  const afterPower = rankSelfValue(afterUpgradeRank);
  assert.ok(afterPower > beforePower, `rank power did not increase: ${beforePower} -> ${afterPower}`);

  const reset = await peer.request(84502, 5, await encodeEtf([1]));
  assert.equal(reset.err, undefined);
  const resetResponse = codec.unpack('pb_tactics_reset_back', Buffer.from(reset.data, 'base64'));
  assert.equal(Number(resetResponse.res.changes[0].diff_num), 1);
  assert.equal(resetResponse.master_info.info_list.find(row => row.chapter_tid === 1).root_node.level ?? 0, 0);
  assert.equal(stateLevels(game.store).get(1), 0);
  assert.equal(resourceAmount(game.store), 2);

  const afterResetRank = await peer.request(2000, 6, await encodeEtf([RANK_IDS.POWER]));
  assert.equal(afterResetRank.err, undefined);
  assert.equal(rankSelfValue(afterResetRank), beforePower);
});
