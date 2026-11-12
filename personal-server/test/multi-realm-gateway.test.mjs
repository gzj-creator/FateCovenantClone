import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { createSdkService } from '../sdk-service.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { md5Hex, signSdkParameters } from '../sdk-signing.mjs';

const codec = createGameCodec();
const CACHE_PATH = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1_790_000_000;
const APP_KEY = 'local test key';
const ACCOUNT = { loginCode: 'realm-tester', passwordMd5: md5Hex('test-only-password'), userId: 'local-1', nickname: '命运旅者' };

function handshakeClient(socket) {
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const request = async (type, seq, data) => {
    socket.write(encodeGameFrame(codec.pack('pb_c2s', { type, seq, data })));
    return codec.unpack('pb_s2c', await next());
  };
  return {
    next, request,
    async open(key) {
      socket.write(encodeGameFrame(Buffer.from('verify')));
      const parsed = parseServerChallenge(await next());
      socket.write(encodeGameFrame(Buffer.concat([
        Buffer.from(key),
        localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
        parsed.rawFlags,
        Buffer.from('1.55.090365')
      ])));
    }
  };
}

test('a second realm accepts the primary realm login session and keeps realm 2 credentials out', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-multi-realm-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let now = SERVER_OPENED_AT + 3600;

  // Primary realm issues the SDK session the public client logs in with.
  const sdk = createSdkService({
    localTestOtp: true,
    sessionTtlSeconds: 604800,
    sessionPath: path.join(directory, 'sdk-sessions.json'),
    account: ACCOUNT,
    appId: 'fc-local', appKey: APP_KEY,
    nowSeconds: () => now
  });
  t.after(() => sdk.close());
  const sdkAddress = await sdk.listen(0);
  const form = new URLSearchParams({ loginCode: ACCOUNT.loginCode, password: ACCOUNT.passwordMd5, appid: 'fc-local' });
  const loginResponse = await fetch(sdkAddress.url + '/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams([...form, ['sign', signSdkParameters(Object.fromEntries(form), APP_KEY)]]).toString()
  });
  const loginBody = await loginResponse.json();

  const realmTwo = createLocalGame({
    databasePath: path.join(directory, 'realm-2.sqlite'),
    statePath: path.join(directory, 'realm-2-state.json'),
    capturePath: CACHE_PATH,
    verifySession: sdk.verifySession,
    resolveSession: sdk.resolveSession,
    serverOpenedAt: SERVER_OPENED_AT,
    serverId: 2,
    serverName: '命运二服',
    roleId: 100002,
    roleName: '命运旅者',
    now: () => now * 1000
  });
  t.after(() => realmTwo.close());

  const realmThree = createLocalGame({
    databasePath: path.join(directory, 'realm-3.sqlite'),
    statePath: path.join(directory, 'realm-3-state.json'),
    capturePath: CACHE_PATH,
    verifySession: sdk.verifySession,
    resolveSession: sdk.resolveSession,
    serverOpenedAt: SERVER_OPENED_AT + 86400,
    serverId: 3,
    serverName: '命运三服',
    roleId: 100003,
    roleName: '命运旅者',
    now: () => now * 1000
  });
  t.after(() => realmThree.close());

  const twoAddress = await realmTwo.listen(0), threeAddress = await realmThree.listen(0);

  async function loginRealm(address, serverId, token) {
    const socket = net.connect(address.port, '127.0.0.1');
    t.after(() => socket.destroy());
    await once(socket, 'connect');
    const peer = handshakeClient(socket);
    await peer.open('CovenantKey12345');
    return peer.request(909103, 1, codec.pack('login', { server_id: serverId, channel_uid: ACCOUNT.userId, verify_code: token, channel_extra: '' }));
  }

  const accepted = await loginRealm(twoAddress, 2, loginBody.result.token);
  assert.equal(accepted.err, undefined);
  const realmTwoModules = new Map((await decodeEtf(Buffer.from(accepted.data, 'base64')))[2].value);
  assert.equal(Number(realmTwoModules.get(1)[3]), 2);
  assert.equal(realmTwo.store.serverId, 2);
  assert.equal(realmTwo.store.state().roleId, 100002);

  const thirdRealm = await loginRealm(threeAddress, 3, loginBody.result.token);
  assert.equal(thirdRealm.err, undefined);
  const realmThreeModules = new Map((await decodeEtf(Buffer.from(thirdRealm.data, 'base64')))[2].value);
  assert.equal(Number(realmThreeModules.get(1)[3]), 3);
  assert.equal(realmThree.store.serverId, 3);
  assert.equal(realmThree.store.state().roleId, 100003);
  // Fresh realm 3 save starts its own activity timeline from its own opening time.
  assert.equal(realmThree.store.state().serverOpenedAt, SERVER_OPENED_AT + 86400);
  assert.equal(realmTwo.store.state().serverOpenedAt, SERVER_OPENED_AT);

  // Realm 3 rejects a login framed for realm 2 even with a valid session.
  const wrongRealm = await loginRealm(threeAddress, 2, loginBody.result.token);
  assert.equal(wrongRealm.err?.err, -1);
  // An unknown token is rejected everywhere.
  const unknownToken = await loginRealm(threeAddress, 3, 'f'.repeat(64));
  assert.equal(unknownToken.err?.err, -1);
});
