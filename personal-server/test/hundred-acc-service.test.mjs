import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createHundredAccService } from '../game/hundred-acc-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));

function setRechargeTotal(store, total) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const raw = modules.get(19) ? rawBinary(modules.get(19)) : Buffer.alloc(0);
    const login = raw.length ? codec.unpack('res_recharge_login', raw) : {};
    login.total_amount = total;
    modules.set(19, serializedBinary(codec.pack('res_recharge_login', login)));
    model.state.modules.value = [...modules];
  });
}

function setup(t, clock = () => 1761829200000) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-acc-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec });
  const make = () => createHundredAccService({ store, codec, tables, now: clock });
  let service = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    setRechargeTotal: total => setRechargeTotal(store, total),
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec });
      service = make();
    }
  };
}

test('hundred cumulative recharge claims persist tier records and rewards', t => {
  const e = setup(t);
  e.setRechargeTotal(599);
  const result = e.service.execute([1]);
  const response = codec.unpack('pb_res_to_client', result.data);
  assert.equal(response.changes.find(change => change.tid === '101500').diff_num, '100');
  assert.throws(() => e.service.execute([1]), error => error.code === 310);
  assert.throws(() => e.service.execute([2]), error => error.code === 311);

  let activity = codec.unpack('pb_hundred_acc', rawBinary(new Map(e.store.state().modules.value).get(166)));
  assert.deepEqual(activity.reward_list.map(row => row.group_id), [1]);
  assert.deepEqual(activity.reward_list[0].reward_id_list, [1]);
  assert.equal(activity.reward_list[0].reward_time, '1761829200');
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 1);

  e.reopen();
  assert.throws(() => e.service.execute([1]), error => error.code === 310);
  activity = codec.unpack('pb_hundred_acc', rawBinary(new Map(e.store.state().modules.value).get(166)));
  assert.deepEqual(activity.reward_list[0].reward_id_list, [1]);
});

test('hundred cumulative recharge compares cent totals without a second conversion', t => {
  const e = setup(t);
  assert.equal(tables.HundredAccGroup.get(2).amount, 600);
  e.setRechargeTotal(21300);

  const result = e.service.execute([2]);
  const response = codec.unpack('pb_res_to_client', result.data);
  assert.equal(response.changes.find(change => change.tid === '101500').diff_num, '300');
  assert.equal(response.changes.find(change => change.tid === '1501200').diff_num, '1');

  const activity = codec.unpack('pb_hundred_acc', rawBinary(new Map(e.store.state().modules.value).get(166)));
  assert.deepEqual(activity.reward_list.map(row => row.group_id), [2]);
  assert.equal(e.store.inspect(db => db.prepare('SELECT count(*) n FROM activity_claims').get().n), 1);
});

test('real gateway routes ETF 92001 and returns the configured second-tier reward', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-acc-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    localWallet: true,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  setRechargeTotal(game.store, 21300);
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
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

  const response = await request(92001, 2, await encodeEtf([2]));
  assert.equal(response.err, undefined);
  const changes = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(changes.find(change => change.tid === '101500').diff_num, '300');
  assert.equal(changes.find(change => change.tid === '1501200').diff_num, '1');
  const activity = codec.unpack('pb_hundred_acc', rawBinary(new Map(game.store.state().modules.value).get(166)));
  assert.deepEqual(activity.reward_list.map(row => row.group_id), [2]);
});
