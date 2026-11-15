import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readHeroBlazonTables } from '../config/hero-blazon-tables.mjs';
import { createHeroBlazonService, HERO_BLAZON_COMMANDS } from '../game/hero-blazon-service.mjs';
import net from 'node:net';
import { once } from 'node:events';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readHeroBlazonTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const MODULE_ID = 152;
const SKILL_ITEM = 24002;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-blazon-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Hero Blazon Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const service = createHeroBlazonService({ store, codec, tables });
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
      return createHeroBlazonService({ store, codec, tables });
    }
  };
}

function writeBlazon(store, state) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(MODULE_ID, serializedBinary(codec.pack('pb_hero_blazon', state)));
    model.state.modules.value = [...modules];
  });
}

function readBlazon(store) {
  const module = new Map(store.read().state.modules.value).get(MODULE_ID);
  return module ? codec.unpack('pb_hero_blazon', rawBinary(module)) : null;
}

function blazonState({ bonds = [], skills = [], talents = [] } = {}) {
  const chapters = new Map();
  for (const tid of bonds) {
    const group = tables.bondGroupForTid(tid);
    assert.ok(group, `bond ${tid} must be configured`);
    if (!chapters.has(group.campus)) chapters.set(group.campus, []);
    chapters.get(group.campus).push(tid);
  }
  return {
    chapter_list: [],
    skill_list: skills.slice().sort((left, right) => left - right),
    talent_list: talents,
    bond_list: [...chapters].map(([chapterId, list]) => ({ chapter_id: chapterId, bond_list: list })),
    reset_times: 0,
    reset_timestamp: 0,
    max_chart: '0'
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

test('hero blazon tables expose the original families and bond/skill indexes', () => {
  assert.deepEqual(HERO_BLAZON_COMMANDS, [88955, 88957]);
  assert.equal(tables.rows.Chapter.size, 4);
  assert.equal(tables.rows.BondGroup.size, 128);
  assert.equal(tables.rows.BondAttr.size, 3200);
  assert.equal(tables.rows.BondItemNeed.size, 492);
  assert.equal(tables.rows.Skill.size, 88);
  assert.equal(tables.rows.TalentUp.size, 27);
  assert.equal(tables.rows.Talent.size, 8);
  assert.equal(tables.rows.TalentReset.size, 5);
  assert.equal(tables.rows.Attr.size, 720);
  assert.equal(tables.rows.EmbedCell.size, 414);
  assert.equal(tables.param.skill_count, 4);
  // Bond tids are group*100+star; group 1001 stars 1..25 are contiguous.
  assert.equal(tables.bondStar(100101), 1);
  assert.equal(tables.bondGroupForTid(100101).tid, 1001);
  assert.equal(tables.bondMaxStar(1001), 25);
  assert.deepEqual(tables.bondNeedsForGroup(1001).map(row => row.special_item),
    [33000402, 32000302, 32000402, 32000502, 32000202]);
  // Skill tids are source*10+star.
  assert.equal(tables.skillSource(1101), 110);
  assert.equal(tables.skillStar(1101), 1);
  // HeroBlazonMgr.GetChartValueByChapterTid delegates to the bond rows.
  const chart = tables.chartValuesFromBonds([100101, 100201]);
  assert.equal(tables.bondAttrForTid(100101).chart_value, 12);
  assert.equal(chart.get(1), 24);
  assert.equal(chart.get(2), 0);
});

test('88955 activates the next skill star, consumes the original item and persists', async t => {
  const env = setup(t);
  writeBlazon(env.store, blazonState({ bonds: [100103], skills: [1100] }));
  setItem(env.store, SKILL_ITEM, 5);
  const decoded = await env.service.decode(88955, await encodeEtf([1101]), { etf: async data => decodeEtf(data) });
  assert.equal(decoded, 1101);
  const result = env.service.execute(88955, decoded);
  assert.equal(result.schema, 'pb_hero_blazon_update_skill_back');
  const value = codec.unpack('pb_hero_blazon_update_skill_back', result.data);
  assert.equal(Number(value.skill_tid), 1101);
  assert.equal(value.res_client.changes.length, 1);
  assert.equal(Number(value.res_client.changes[0].diff_num), -1);
  assert.deepEqual(readBlazon(env.store).skill_list.map(Number), [1100, 1101]);
  assert.equal(itemAmount(env.store, SKILL_ITEM), 4);

  const reopened = env.reopen();
  assert.deepEqual(readBlazon(env.store).skill_list.map(Number), [1100, 1101]);
  assert.equal(itemAmount(env.store, SKILL_ITEM), 4);
  assert.deepEqual(reopened.ensureLoginState().chartValues, { 1: 36, 2: 0, 3: 0, 4: 0 });
});

test('88955 rejects a skill whose predecessor star is missing without touching resources', async t => {
  const env = setup(t);
  writeBlazon(env.store, blazonState({ bonds: [100103], skills: [] }));
  setItem(env.store, SKILL_ITEM, 5);
  assert.throws(() => env.service.execute(88955, 1101), error => error.code === 5 && /previous star/.test(error.message));
  assert.deepEqual(readBlazon(env.store).skill_list, []);
  assert.equal(itemAmount(env.store, SKILL_ITEM), 5);
});

test('88955 rejects an unmet chart value and keeps the skill list unchanged', t => {
  const env = setup(t);
  writeBlazon(env.store, blazonState({ bonds: [], skills: [1100] }));
  setItem(env.store, SKILL_ITEM, 5);
  assert.throws(() => env.service.execute(88955, 1101), error => error.code === 5 && /chart value/.test(error.message));
  assert.deepEqual(readBlazon(env.store).skill_list.map(Number), [1100]);
  assert.equal(itemAmount(env.store, SKILL_ITEM), 5);
});

test('88955 rejects insufficient materials before any state change', t => {
  const env = setup(t);
  writeBlazon(env.store, blazonState({ bonds: [100103], skills: [1100] }));
  setItem(env.store, SKILL_ITEM, 0);
  assert.throws(() => env.service.execute(88955, 1101), error => error.code === 301);
  assert.deepEqual(readBlazon(env.store).skill_list.map(Number), [1100]);
  assert.equal(itemAmount(env.store, SKILL_ITEM), 0);
});

test('88955 rejects duplicate claims and unknown skill rows', t => {
  const env = setup(t);
  writeBlazon(env.store, blazonState({ bonds: [100103], skills: [1100, 1101] }));
  setItem(env.store, SKILL_ITEM, 5);
  assert.throws(() => env.service.execute(88955, 1101), error => error.code === 5 && /already active/.test(error.message));
  assert.equal(itemAmount(env.store, SKILL_ITEM), 5);
  assert.throws(() => env.service.execute(88955, 99999), error => error.code === 5 && /not configured/.test(error.message));
  assert.deepEqual(readBlazon(env.store).skill_list.map(Number), [1100, 1101]);
});

test('88955 keeps base skill activation fail-closed', t => {
  const env = setup(t);
  writeBlazon(env.store, blazonState({ bonds: [100101], skills: [] }));
  setItem(env.store, SKILL_ITEM, 5);
  assert.throws(() => env.service.execute(88955, 1100), error => error.code === 5 && /R1-HEROBLAZON-SKILL-BASE/.test(error.message));
  assert.deepEqual(readBlazon(env.store).skill_list, []);
  assert.equal(itemAmount(env.store, SKILL_ITEM), 5);
});

test('88955 treats a malformed non-scalar login module as state error', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(MODULE_ID, { value: [], bits: 8 });
    model.state.modules.value = [...modules];
  });
  assert.throws(() => env.service.execute(88955, 1101), error => error.code === 5);
});

test('88957 advances the requested bond source, preserves talents and consumes each original item once', async t => {
  const env = setup(t);
  const needItems = tables.bondNeedsForGroup(1001).map(row => row.special_item);
  writeBlazon(env.store, blazonState({ talents: [{ tid: 1, attr_val: 200 }] }));
  for (const item of needItems) setItem(env.store, item, 2);

  const decoded = await env.service.decode(88957, await encodeEtf([1001]), { etf: async data => decodeEtf(data) });
  assert.equal(decoded, 1001);
  const result = env.service.execute(88957, decoded);
  assert.equal(result.schema, 'pb_hero_blazon_bond_up_rsp');
  const value = codec.unpack('pb_hero_blazon_bond_up_rsp', result.data);
  assert.equal(value.res_client.changes.length, new Set(needItems).size);
  assert.deepEqual(value.update_talent_list.map(row => [Number(row.tid), Number(row.attr_val)]), [[1, 200]]);
  assert.deepEqual(readBlazon(env.store).bond_list.map(row => ({ chapter_id: row.chapter_id, bond_list: row.bond_list.map(Number) })), [{ chapter_id: 1, bond_list: [100101] }]);
  assert.deepEqual(readBlazon(env.store).talent_list.map(row => [Number(row.tid), Number(row.attr_val)]), [[1, 200]]);
  for (const item of needItems) assert.equal(itemAmount(env.store, item), 1);

  env.reopen();
  assert.deepEqual(readBlazon(env.store).bond_list.map(row => ({ chapter_id: row.chapter_id, bond_list: row.bond_list.map(Number) })), [{ chapter_id: 1, bond_list: [100101] }]);
  for (const item of needItems) assert.equal(itemAmount(env.store, item), 1);
});

test('88957 rejects insufficient items before replacing the bond or consuming anything', t => {
  const env = setup(t);
  const needItems = tables.bondNeedsForGroup(1001).map(row => row.special_item);
  writeBlazon(env.store, blazonState({ bonds: [100101] }));
  needItems.slice(0, -1).forEach(item => setItem(env.store, item, 1));
  setItem(env.store, needItems.at(-1), 0);
  assert.throws(() => env.service.execute(88957, 1001), error => error.code === 5);
  assert.deepEqual(readBlazon(env.store).bond_list.map(row => ({ chapter_id: row.chapter_id, bond_list: row.bond_list.map(Number) })), [{ chapter_id: 1, bond_list: [100101] }]);
  assert.equal(itemAmount(env.store, needItems[0]), 1);
  assert.equal(itemAmount(env.store, needItems.at(-1)), 0);
});

test('88957 rejects max-star and unknown bond sources without charging', t => {
  const env = setup(t);
  const maxTid = 100100 + tables.bondMaxStar(1001);
  writeBlazon(env.store, blazonState({ bonds: [maxTid] }));
  const needItems = tables.bondNeedsForGroup(1001).map(row => row.special_item);
  for (const item of needItems) setItem(env.store, item, 1);
  assert.throws(() => env.service.execute(88957, 1001), error => error.code === 5 && /max star/.test(error.message));
  assert.throws(() => env.service.execute(88957, 9999), error => error.code === 5 && /not configured/.test(error.message));
  assert.deepEqual(readBlazon(env.store).bond_list.map(row => ({ chapter_id: row.chapter_id, bond_list: row.bond_list.map(Number) })), [{ chapter_id: 1, bond_list: [maxTid] }]);
  for (const item of needItems) assert.equal(itemAmount(env.store, item), 1);
});

test('88957 rejects an invalid ETF argument', async t => {
  const env = setup(t);
  const invalid = await encodeEtf([0]);
  await assert.rejects(
    () => env.service.decode(88957, invalid, { etf: async data => decodeEtf(data) }),
    error => error.code === 1
  );
  assert.throws(() => env.service.execute(88957, 0), error => error.code === 1);
});

test('unproven HeroBlazon chapter, talent and skill-reset writes stay fail closed', t => {
  const env = setup(t);
  for (const type of [88951, 88953, 88956]) {
    assert.equal(env.service.supports(type), false);
    assert.throws(() => env.service.execute(type, {}), error => error.code === 1);
  }
});

test('real gateway routes ETF 88955 and 88957 and persists both login projections', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-blazon-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Blazon Gateway' });
  const store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  writeBlazon(store, blazonState({ bonds: [100103], skills: [1100] }));
  // Grant through the real resource handler so module 6 carries a valid entry;
  // the login payload materialises every resource row back into its module.
  const bondItems = tables.bondNeedsForGroup(1002).map(row => row.special_item);
  store.transaction(model => {
    grantResources(model, [[SKILL_ITEM, 5], ...bondItems.map(item => [item, 1])], readGameTables(), { codec });
  });
  const roleId = store.state().roleId;
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('blazon-gateway', roleId, 'blazon-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'blazon-session' && uid === 'blazon-gateway'
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
    channel_uid: 'blazon-gateway',
    verify_code: 'blazon-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const response = await request(88955, 2, await encodeEtf([1101]));
  assert.equal(response.err, undefined);
  const value = codec.unpack('pb_hero_blazon_update_skill_back', Buffer.from(response.data, 'base64'));
  assert.equal(Number(value.skill_tid), 1101);
  assert.equal(Number(value.res_client.changes[0].diff_num), -1);
  assert.deepEqual(readBlazon(game.store).skill_list.map(Number), [1100, 1101]);
  assert.equal(itemAmount(game.store, SKILL_ITEM), 4);

  const bondResponse = await request(88957, 3, await encodeEtf([1002]));
  assert.equal(bondResponse.err, undefined);
  const bondValue = codec.unpack('pb_hero_blazon_bond_up_rsp', Buffer.from(bondResponse.data, 'base64'));
  assert.equal(bondValue.res_client.changes.length, bondItems.length);
  assert.deepEqual(readBlazon(game.store).bond_list.map(row => ({ chapter_id: row.chapter_id, bond_list: row.bond_list.map(Number) })), [{ chapter_id: 1, bond_list: [100103, 100201] }]);
  for (const item of bondItems) assert.equal(itemAmount(game.store, item), 0);
});

