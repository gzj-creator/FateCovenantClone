import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { MYSTERY_SHOP_MODULE_ID } from '../game/mystery-shop-service.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const FIXED_NOW = Date.parse('2026-11-15T12:00:00+08:00');
const OPENED_AT = Math.floor(Date.parse('2026-10-01T05:00:00+08:00') / 1000);
const ACCOUNT_ID = 'mystery-shop-gateway';
const SESSION = 'mystery-shop-session';

function bytesOf(entry) {
  if (entry == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(entry)) return entry;
  if (typeof entry === 'string') return Buffer.from(entry, 'base64');
  if (Buffer.isBuffer(entry.value)) return entry.value;
  if (Buffer.isBuffer(entry.value?.data)) return entry.value.data;
  return Buffer.alloc(0);
}

function loginModules(login) {
  return new Map(login[2].value.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
}

function amount(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

function prepareDatabase(directory) {
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, { ...options, createdAt: OPENED_AT, roleName: 'Mystery Shop Gateway' });
  const store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT, now: () => FIXED_NOW });
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(MYSTERY_SHOP_MODULE_ID, serializedBinary(codec.pack('pb_mystery_shop', {
      next_auto_refresh_time: '0',
      last_manual_refresh_time: '0',
      manual_refresh_count: 0,
      discount_items: [{
        cell_id: 1,
        discount_item_tid: '10101001',
        discount_price_index: '7',
        is_bought: false
      }],
      all_times_data: [],
      customize_auto_refresh_times: 0,
      buy_times: '7'
    })));
    model.state.modules.value = [...modules];
  });
  store.transaction(model => {
    grantResources(model, [[101500, 100000]], gameTables, { codec });
  });
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run(ACCOUNT_ID, store.state().roleId, ACCOUNT_ID, '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();
  return { databasePath, seed };
}

function startGateway({ databasePath, seed }) {
  const rulesPath = path.join(path.dirname(databasePath), 'gate-rules.json');
  fs.writeFileSync(rulesPath, JSON.stringify({ rules: [] }));
  const previousRulesPath = process.env.FC_COMMAND_GATE_RULES_PATH;
  process.env.FC_COMMAND_GATE_RULES_PATH = rulesPath;
  try {
    return createLocalGame({
      databasePath,
      statePath: path.join(path.dirname(databasePath), 'absent.json'),
      capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
      serverOpenedAt: OPENED_AT,
      serverId: 1,
      now: () => FIXED_NOW,
      verifySession: (uid, token) => uid === ACCOUNT_ID && token === SESSION
    });
  } finally {
    if (previousRulesPath == null) delete process.env.FC_COMMAND_GATE_RULES_PATH;
    else process.env.FC_COMMAND_GATE_RULES_PATH = previousRulesPath;
  }
}

async function connectClient(t, game) {
  const socket = net.connect((await game.listen(0)).port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [];
  const waiters = [];
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
  const parsed = parseServerChallenge(await next());
  const key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: ACCOUNT_ID,
    verify_code: SESSION,
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const decoded = await decodeEtf(Buffer.from(login.data, 'base64'));
  return { request, socket, modules: loginModules(decoded) };
}

test('91503 routes ETF purchase through module 162, rolls back repeats and survives gateway reopen', { timeout: 30000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-mystery-shop-gateway-'));
  const prepared = prepareDatabase(directory);
  let game = startGateway(prepared);
  t.after(async () => {
    await game?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  let client = await connectClient(t, game);
  let state = codec.unpack('pb_mystery_shop', bytesOf(client.modules.get(MYSTERY_SHOP_MODULE_ID)));
  assert.equal(Boolean(state.discount_items[0].is_bought), false);
  assert.equal(state.buy_times, '7');

  const beforeCurrency = amount(game.store, 101500);
  const beforeItem = amount(game.store, 21300104);
  let response = await client.request(91503, 2, await encodeEtf(1));
  assert.equal(response.err, undefined);
  const result = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64'));
  assert.equal(Boolean(result.is_overflow), false);
  assert.equal(result.changes.length, 2);
  assert.equal(amount(game.store, 101500), beforeCurrency - 570);
  assert.equal(amount(game.store, 21300104), beforeItem + 5);

  response = await client.request(91503, 3, await encodeEtf(1));
  assert.equal(response.err, undefined);
  assert.equal(amount(game.store, 101500), beforeCurrency - 570);
  assert.equal(amount(game.store, 21300104), beforeItem + 5);
  const owned = game.commandSupportOwners().itemCommandServices.find(service => service.supports(91503));
  assert.ok(owned);
  state = codec.unpack('pb_mystery_shop', owned.loginPayload().data);
  assert.equal(state.discount_items[0].is_bought, true);
  assert.equal(state.buy_times, '8');

  client.socket.destroy();
  await game.close();
  game = null;

  const reopened = createGameStore({
    databasePath: prepared.databasePath,
    seed: prepared.seed,
    codec,
    serverOpenedAt: OPENED_AT,
    now: () => FIXED_NOW
  });
  const persistedModules = new Map(reopened.state().modules.value);
  const persisted = codec.unpack('pb_mystery_shop', rawBinary(persistedModules.get(MYSTERY_SHOP_MODULE_ID)));
  assert.equal(persisted.discount_items[0].is_bought, true);
  assert.equal(persisted.buy_times, '8');
  assert.equal(amount(reopened, 101500), beforeCurrency - 570);
  assert.equal(amount(reopened, 21300104), beforeItem + 5);
  reopened.close();

  game = startGateway(prepared);
  client = await connectClient(t, game);
  state = codec.unpack('pb_mystery_shop', bytesOf(client.modules.get(MYSTERY_SHOP_MODULE_ID)));
  assert.equal(state.discount_items[0].is_bought, true);
  assert.equal(state.buy_times, '8');
});
