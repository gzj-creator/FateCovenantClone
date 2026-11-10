import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const LEGACY_ACCOUNT = 'local-1';
const PHONE_ACCOUNT = 'local-phone-17607270093';

test('account roles persist separately and AsyncLocalStorage isolates concurrent work', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-account-store-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => createSeed(codec);
  let store = createGameStore({ databasePath, seed, codec });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });

  store.transaction((model, db) => {
    db.prepare('INSERT INTO local_wallets(account_id,role_id) VALUES (?,?)').run(LEGACY_ACCOUNT, model.state.roleId);
  });
  const legacy = store.resolveAccount(LEGACY_ACCOUNT);
  const phone = store.resolveAccount(PHONE_ACCOUNT, { loginCode: 'phone-17607270093', phone: '17607270093' });
  assert.equal(legacy.created, false);
  assert.equal(legacy.roleId, 100001);
  assert.equal(phone.created, true);
  assert.notEqual(phone.roleId, legacy.roleId);
  assert.equal(store.read(legacy.roleId).role.level, 9);
  assert.equal(store.read(phone.roleId).role.level, 1);

  const delay = () => new Promise(resolve => setTimeout(resolve, 5));
  const [legacyRole, phoneRole] = await Promise.all([
    store.runWithRole(legacy.roleId, async () => { await delay(); return store.read().state.roleId; }),
    store.runWithRole(phone.roleId, async () => { await delay(); return store.read().state.roleId; })
  ]);
  assert.equal(legacyRole, legacy.roleId);
  assert.equal(phoneRole, phone.roleId);

  store.runWithRole(phone.roleId, () => store.transaction(model => { model.role.level = 2; }));
  assert.equal(store.read(phone.roleId).role.level, 2);
  assert.equal(store.read(legacy.roleId).role.level, 9);

  store.close();
  store = createGameStore({ databasePath, seed, codec });
  assert.equal(store.resolveAccount(LEGACY_ACCOUNT).roleId, legacy.roleId);
  assert.equal(store.resolveAccount(PHONE_ACCOUNT).roleId, phone.roleId);
});

function client(socket) {
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      const waiter = waiters.shift();
      if (waiter) waiter.resolve(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const entry = { resolve, reject };
    entry.timer = setTimeout(() => {
      const index = waiters.indexOf(entry);
      if (index >= 0) waiters.splice(index, 1);
      reject(new Error('Gateway response timeout'));
    }, 15000);
    entry.resolve = data => { clearTimeout(entry.timer); resolve(data); };
    waiters.push(entry);
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
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
  return { next, request, handshake, close: () => socket.destroy() };
}

test('two simultaneous gateway sessions resolve different accounts and mail stays isolated', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-account-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'state.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    localWallet: true,
    serverId: 1,
    roleId: 100002,
    serverOpenedAt: 1_700_000_000,
    resolveSession: (uid, token) => {
      if ((uid === LEGACY_ACCOUNT && token === 'legacy-session')
        || (uid === PHONE_ACCOUNT && token === 'phone-session')) {
        return { userId: uid, loginCode: uid, nickname: 'Isolation Test' };
      }
      return null;
    }
  });
  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  async function login(uid, token) {
    const socket = net.connect(address.port, '127.0.0.1');
    sockets.push(socket);
    await once(socket, 'connect');
    const peer = client(socket);
    await peer.handshake();
    const response = await peer.request(909103, 1, codec.pack('login', {
      server_id: 1, channel_uid: uid, verify_code: token, channel_extra: ''
    }));
    assert.equal(response.err, undefined);
    const loginData = await decodeEtf(Buffer.from(response.data, 'base64'));
    const modules = new Map(loginData[2].value);
    return { peer, modules, roleId: Number(modules.get(1)[1]), role: codec.unpack('to_client_role_info', Buffer.from(modules.get(2).value)) };
  }

  const [legacy, phone] = await Promise.all([
    login(LEGACY_ACCOUNT, 'legacy-session'),
    login(PHONE_ACCOUNT, 'phone-session')
  ]);
  assert.equal(legacy.roleId, 100002);
  assert.equal(phone.roleId, 100003);
  assert.equal(legacy.role.level, 9);
  assert.equal(phone.role.level, 1);
  assert.equal(game.store.roleForAccount(LEGACY_ACCOUNT), legacy.roleId);
  assert.equal(game.store.roleForAccount(PHONE_ACCOUNT), phone.roleId);

  const issued = game.mail.issueVoucher({
    account_id: PHONE_ACCOUNT,
    request_id: 'account-isolation-voucher',
    quantity: 1_000_000,
    title: '百万代金券到账',
    content: '已发放 1,000,000 张代金券，每张可抵扣 1 元。',
    expire_at: 0
  });
  assert.equal(issued.quantity, 1_000_000);
  const push = codec.unpack('pb_s2c', await phone.peer.next());
  assert.equal(push.type, 900);

  const phoneClaim = await phone.peer.request(3002, 2, await encodeEtf([issued.mail_id]));
  assert.equal(phoneClaim.err, undefined);
  const legacyClaim = await legacy.peer.request(3002, 2, await encodeEtf([issued.mail_id]));
  assert.equal(legacyClaim.err?.err, 5);
  assert.equal(game.store.read(phone.roleId).resources.get('701500').num, '1000000');
  assert.equal(game.store.read(legacy.roleId).resources.get('701500')?.num ?? '0', '0');
});
