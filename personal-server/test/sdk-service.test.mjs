import assert from 'node:assert/strict';
import { createCipheriv, createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { equalMd5Hex, md5Hex, signSdkParameters } from '../sdk-signing.mjs';
import { createSdkService } from '../sdk-service.mjs';
import { signQuickSdk } from '../quick-sdk.mjs';

const digest = text => createHash('md5').update(text, 'utf8').digest('hex');
const configuration = {
  appId: 'local-sdk-test', appKey: 'local test key', sessionTtlSeconds: 60,
  account: { loginCode: 'local player', passwordMd5: digest('test-only-password'), userId: 'local-test-1', nickname: '本地测试' }
};
const PHONE_USER_ID = 'local-phone-19900000000';

async function fixture(t, options = {}) {
  let now = 1_790_000_000;
  const events = [];
  const service = createSdkService({ ...configuration, ...options, nowSeconds: () => now, logger: event => events.push(event) });
  t.after(() => service.close());
  const address = await service.listen(0);
  async function raw(route, options = {}) {
    const response = await fetch(address.url + route, { signal: AbortSignal.timeout(5000), ...options });
    return { status: response.status, headers: response.headers, body: await response.json() };
  }
  async function post(route, fields, overrides = {}) {
    const form = new URLSearchParams(fields);
    form.set('sign', signSdkParameters(fields, configuration.appKey));
    for (const [key, value] of Object.entries(overrides)) form.set(key, value);
    return raw(route, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: form.toString() });
  }
  const loginFields = { loginCode: configuration.account.loginCode, password: configuration.account.passwordMd5, appid: configuration.appId };
  async function login(overrides = {}) { return post('/user/login', { ...loginFields, ...overrides }); }
  function verify(result, overrides = {}) {
    return post('/user/tokenVerifySdk', { access_token: result.token, userid: result.userid, appid: configuration.appId, ...overrides });
  }
  return { service, address, events, raw, post, login, verify, loginFields, setTime: value => { now = value; } };
}

test('signature uses Java UTF-16 sorting, original values, and only ASCII-space removal', () => {
  const parameters = new Map([['\ue000', 'end'], ['😀', 'astral'], ['中', '汉 字'], ['a', 'x y\tz+&='], ['A', '']]);
  const canonical = 'A=&a=x y\tz+&=&中=汉 字&😀=astral&\ue000=end&key=k e y';
  assert.equal(signSdkParameters(parameters, 'k e y'), digest(canonical.replaceAll(' ', '')));
  assert.notEqual(signSdkParameters(parameters, 'k e y'), digest(encodeURIComponent(canonical)));
  assert.equal(signSdkParameters({ tab: '\t', nbsp: '\u00a0' }, 'key'), digest('nbsp=\u00a0&tab=\t&key=key'));
});

test('MD5 matches lowercase digest and Android Java replacement for unpaired surrogate', () => {
  assert.equal(md5Hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(md5Hex('孤立\ud800字符'), digest('孤立?字符'));
  assert.equal(signSdkParameters({ a: null, b: true, c: 12 }, 'key'), digest('a=null&b=true&c=12&key=key'));
  assert.equal(equalMd5Hex(md5Hex('abc'), md5Hex('abc').toUpperCase()), false);
  assert.throws(() => signSdkParameters({ sign: 'already-added' }, 'key'));
  assert.throws(() => signSdkParameters({}, 'key'));
});

test('HTTP login returns typed SDK object, random tokens, Unix seconds, and no-store', async t => {
  const f = await fixture(t);
  assert.equal(f.address.host, '127.0.0.1');
  assert(f.address.port > 0);
  const first = await f.login();
  const second = await f.login();
  assert.equal(first.status, 200);
  assert.equal(first.body.rcode, 0);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const result = first.body.result;
  assert.equal(typeof result, 'object');
  assert.equal(result.userid, configuration.account.userId);
  assert.equal(result.login_code, configuration.account.loginCode);
  assert.equal(result.nickname, configuration.account.nickname);
  assert.equal(result.expire_time, 1_790_000_060);
  assert.equal(Number.isInteger(result.expire_time), true);
  assert(result.expire_time < 2 ** 31);
  assert.match(result.token, /^[0-9a-f]{64}$/);
  assert.notEqual(result.token, second.body.result.token);
  const fields = { account_type: 'string', enthralment: 'number', expire_time: 'number', face_url: 'string', guest_id_verify: 'number', has_pwd: 'number', id_code: 'string', info_age: 'number', login_code: 'string', login_code_ext: 'string', mail_set: 'string', name: 'string', nickname: 'string', sdk_id_verify: 'boolean', status: 'string', telphone_set: 'string', token: 'string', userid: 'string' };
  assert.deepEqual(Object.keys(result).sort(), Object.keys(fields).sort());
  for (const [key, type] of Object.entries(fields)) assert.equal(typeof result[key], type, key);
});

test('HTTP token verification accepts issued token and rejects forged token or different user', async t => {
  const f = await fixture(t);
  const login = await f.login();
  const verified = await f.verify(login.body.result);
  assert.equal(verified.status, 200);
  assert.deepEqual(verified.body.result, login.body.result);
  const forged = await f.verify(login.body.result, { access_token: 'a'.repeat(64) });
  assert.equal(forged.status, 401);
  assert.equal(forged.body.rcode, 1003);
  const otherUser = await f.verify(login.body.result, { userid: 'unknown-user' });
  assert.equal(otherUser.status, 401);
  assert.equal(otherUser.body.rcode, 1003);
});

test('HTTP form decoding preserves Unicode, plus signs, ampersands, and signing spaces', async t => {
  const appId = '应用 + & = 😀';
  const appKey = '密钥 空格';
  const account = { loginCode: '本地 玩家+&=😀', passwordMd5: digest('本地密码'), userId: '用户一' };
  const service = createSdkService({ appId, appKey, account });
  t.after(() => service.close());
  const address = await service.listen(0);
  const fields = { loginCode: account.loginCode, password: account.passwordMd5, appid: appId };
  const body = new URLSearchParams({ ...fields, sign: signSdkParameters(fields, appKey) });
  const response = await fetch(address.url + '/user/login', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(), signal: AbortSignal.timeout(5000)
  });
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.result.login_code, account.loginCode);
  assert.equal(json.result.userid, account.userId);
});

test('HTTP login and token verification reject bad signatures and wrong app ID', async t => {
  const f = await fixture(t);
  const bad = await f.post('/user/login', f.loginFields, { sign: '0'.repeat(32) });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.rcode, 1001);
  const wrongApp = await f.login({ appid: 'different-app' });
  assert.equal(wrongApp.status, 401);
  assert.equal(wrongApp.body.rcode, 1001);
  const login = await f.login();
  const verified = await f.post('/user/tokenVerifySdk', { access_token: login.body.result.token, userid: login.body.result.userid, appid: configuration.appId }, { sign: 'f'.repeat(32) });
  assert.equal(verified.status, 401);
  assert.equal(verified.body.rcode, 1001);
});

test('HTTP login rejects a properly signed wrong password and unknown account', async t => {
  const f = await fixture(t);
  for (const fields of [{ password: digest('wrong-password') }, { loginCode: 'unknown-player' }, { password: 'test-only-password' }]) {
    const response = await f.login(fields);
    assert.equal(response.status, 401);
    assert.equal(response.body.rcode, 1002);
    assert.deepEqual(response.body.result, {});
  }
});

test('HTTP session expires after its epoch-second boundary, without sleeping', async t => {
  const f = await fixture(t);
  const login = await f.login();
  f.setTime(login.body.result.expire_time);
  assert.equal((await f.verify(login.body.result)).status, 200);
  f.setTime(login.body.result.expire_time + 1);
  const expired = await f.verify(login.body.result);
  assert.equal(expired.status, 401);
  assert.equal(expired.body.rcode, 1003);
});

test('HTTP banner returns empty config and unknown, payment, identity routes fail explicitly', async t => {
  const f = await fixture(t);
  for (const path of ['/banner/local-game/android-banner.json', '/banner/6/123-banner.json']) {
    const response = await f.raw(path);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {});
  }
  for (const path of ['/missing', '/pay/recharge/', '/user/identityBind']) {
    const response = await f.raw(path, { method: 'POST' });
    assert.equal(response.status, 404);
    assert.notEqual(response.body.rcode, 0);
  }
  assert.equal((await f.raw('/user/login')).status, 405);
});

test('HTTP form parser rejects duplicate, missing, extra, wrong content type, and oversized data', async t => {
  const f = await fixture(t);
  const valid = new URLSearchParams({ ...f.loginFields, sign: signSdkParameters(f.loginFields, configuration.appKey) }).toString();
  for (const body of [valid + '&appid=duplicate', valid + '&extra=unexpected', 'appid=only']) {
    assert.equal((await f.raw('/user/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })).status, 400);
  }
  assert.equal((await f.raw('/user/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 415);
  assert.equal((await f.raw('/user/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'x'.repeat(17 * 1024) })).status, 413);
});

test('HTTP logger records fixed route names and status, excluding credentials and unknown URL', async t => {
  const f = await fixture(t);
  const login = await f.login();
  await f.verify(login.body.result);
  await f.raw('/missing/secret-path?token=secret-query');
  const serialized = JSON.stringify(f.events);
  for (const secret of [configuration.account.passwordMd5, configuration.appKey, login.body.result.token, configuration.account.loginCode, 'secret-path', 'secret-query', 'password', 'access_token']) assert.equal(serialized.includes(secret), false, secret);
  assert(f.events.some(event => event.route === 'login' && event.statusCode === 200));
  assert(f.events.some(event => event.route === 'unknown' && event.statusCode === 404));
});

test('factory closes listener and invalidates sessions; a new service does not share tokens', async t => {
  const first = await fixture(t);
  const login = await first.login();
  await first.service.close();
  await first.service.close();
  assert.equal(first.service.address(), null);
  await assert.rejects(first.service.listen(0), /closed/);
  const second = await fixture(t);
  assert.equal((await second.verify(login.body.result)).status, 401);
});

test('file-backed SDK sessions survive restart, store only hashes, and expire normally', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-sdk-sessions-'));
  const sessionPath = path.join(directory, 'sessions.json');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const first = await fixture(t, { sessionPath });
  const login = await first.login();
  assert.equal(login.status, 200);
  const token = login.body.result.token;
  await first.service.close();
  assert.equal(fs.readFileSync(sessionPath, 'utf8').includes(token), false);

  const second = await fixture(t, { sessionPath });
  assert.equal((await second.verify(login.body.result)).status, 200);
  second.setTime(login.body.result.expire_time + 1);
  assert.equal((await second.verify(login.body.result)).status, 401);
  await second.service.close();

  const third = await fixture(t, { sessionPath });
  assert.equal((await third.verify(login.body.result)).status, 401);
});

test('version 1 session files migrate to version 2 identities without changing valid tokens', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-sdk-session-migration-'));
  const sessionPath = path.join(directory, 'sessions.json');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const first = await fixture(t, { sessionPath });
  const login = await first.login();
  assert.equal(login.status, 200);
  await first.service.close();

  const current = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  fs.writeFileSync(sessionPath, JSON.stringify({
    version: 1,
    sessions: current.sessions.map(({ tokenHash, userId, expiresAt }) => ({ tokenHash, userId, expiresAt }))
  }));

  const migrated = await fixture(t, { sessionPath });
  const stored = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  assert.equal(stored.version, 2);
  assert.deepEqual(stored.sessions[0], {
    tokenHash: current.sessions[0].tokenHash,
    userId: configuration.account.userId,
    loginCode: configuration.account.loginCode,
    nickname: configuration.account.nickname,
    expiresAt: current.sessions[0].expiresAt
  });
  assert.equal((await migrated.verify(login.body.result)).status, 200);
});

test('a realm process resolves sessions written by the primary realm without issuing its own login', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-sdk-shared-sessions-'));
  const primaryPath = path.join(directory, 'primary-sessions.json');
  const realmPath = path.join(directory, 'realm-sessions.json');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const primary = await fixture(t, { sessionPath: primaryPath });
  const login = await primary.login();
  assert.equal(login.status, 200);

  const realm = await fixture(t, { sessionPath: realmPath, sessionSourcePaths: [primaryPath] });
  assert.equal((await realm.verify(login.body.result)).status, 200);
  assert.equal(realm.service.resolveSession(configuration.account.userId, login.body.result.token).loginCode, configuration.account.loginCode);

  // A token issued for another account must not be accepted by the shared store.
  const impostor = await realm.service.resolveSession('someone-else', login.body.result.token);
  assert.equal(impostor, null);

  // The realm does not copy the shared sessions into its own store.
  assert.equal(fs.existsSync(realmPath), false);

  primary.setTime(login.body.result.expire_time + 1);
  realm.setTime(login.body.result.expire_time + 1);
  assert.equal((await realm.verify(login.body.result)).status, 401);
  await primary.service.close();
});

test('factory fails closed for missing config, bad MD5, TTL, clock, and invalid port', async () => {
  assert.throws(() => createSdkService(), /appId/);
  assert.throws(() => createSdkService({ ...configuration, account: { ...configuration.account, passwordMd5: 'plaintext' } }), /passwordMd5/);
  assert.throws(() => createSdkService({ ...configuration, sessionTtlSeconds: 0 }), /sessionTtlSeconds/);
  assert.throws(() => createSdkService({ ...configuration, nowSeconds: () => 2 ** 31 }), /int32/);
  const service = createSdkService(configuration);
  try { await assert.rejects(service.listen(-1), /Port/); } finally { await service.close(); }
  assert.equal(service.address(), null);
});

test('test OTP is opt-in, accepts arbitrary nonempty code, and creates a verified local session', async t => {
  const fields = { appid: configuration.appId, phone: '19900000000', verifyCode: '1234' };
  const disabled = await fixture(t);
  assert.equal((await disabled.post('/user/phoneLogin', fields)).status, 404);
  const f = await fixture(t, { localTestOtp: true });
  assert.equal((await f.post('/user/phoneAccountCheck', { appid: fields.appid, phone: fields.phone })).body.result.has_pwd, 0);
  const sms = await f.post('/sms/send', { appid: fields.appid, phone: fields.phone, type: '1', size: '6' });
  assert.equal(sms.status, 200);
  assert.match(sms.body.rdesc, /no SMS sent/);
  const login = await f.post('/user/phoneLogin', fields);
  assert.equal(login.status, 200);
  assert.equal(login.body.result.userid, PHONE_USER_ID);
  assert.equal(f.service.verifySession(PHONE_USER_ID, login.body.result.token), true);
  assert.equal((await f.verify(login.body.result)).status, 200);
  assert.equal((await f.post('/user/loginReg', { ...fields, verifyCode: '4321' })).status, 200);
  assert.equal((await f.post('/user/phoneLogin', { ...fields, verifyCode: '' })).status, 400);
  assert.equal((await f.post('/user/phoneLogin', { ...fields, phone: 'invalid' })).status, 400);
  assert.equal((await f.post('/user/phoneLogin', fields, { sign: '0'.repeat(32) })).status, 401);
  const logs = JSON.stringify(f.events);
  for (const value of [fields.phone, fields.verifyCode, login.body.result.token]) assert.equal(logs.includes(value), false);
});

test('isolated phone registration gets its own account and supports token verification', async t => {
  const fields={appid:configuration.appId,phone:'19900000000',password:'a'.repeat(32),verifyCode:'1234'};
  const disabled=await fixture(t);
  assert.equal((await disabled.post('/user/phoneRegist',fields)).status,404);
  const f=await fixture(t,{localTestOtp:true});
  assert.equal((await f.post('/user/phoneRegist',fields,{sign:'0'.repeat(32)})).status,401);
  for(const code of ['123','123456','abcd'])assert.equal((await f.post('/user/phoneRegist',{...fields,verifyCode:code})).status,400);
  const login=await f.post('/user/phoneRegist',fields);assert.equal(login.status,200);assert.equal(login.body.rcode,0);assert.equal(login.body.result.userid,PHONE_USER_ID);
  assert.equal((await f.verify(login.body.result)).status,200);
  assert.equal((await f.login()).status,200);
  const logs=JSON.stringify(f.events);for(const value of [fields.phone,fields.password,fields.verifyCode,login.body.result.token])assert.equal(logs.includes(value),false);
});

test('secondary SDK validates signed DES carrier against issued session and rejects forged credentials', async t => {
  const quickSdk = { productCode: 'fc-local', productKey: 'fclocal1' };
  const f = await fixture(t, { localTestOtp: true, quickSdk });
  const login = await f.post('/user/phoneLogin', { appid: configuration.appId, phone: '19900000000', verifyCode: '1234' });
  async function check(overrides = {}, badSign = false, lowercase = false) {
    const data = { uid: PHONE_USER_ID, token: login.body.result.token, ...overrides };
    const key = Buffer.from(quickSdk.productKey);
    const cipher = createCipheriv('des-ede3', Buffer.concat([key, key, key]), null);
    const json_data = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]).toString('base64');
    const fields = new Map([['product_code', quickSdk.productCode], ['json_data', json_data]]);
    const digest = signQuickSdk(fields, quickSdk.productKey);
    const sign = badSign ? '0'.repeat(32) : lowercase ? digest.toLowerCase() : digest;
    return f.raw('/v2/users/checkLogin', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams([...fields, ['sign', sign]]).toString() });
  }
  const accepted = await check();
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.result, true);
  assert.equal(accepted.body.data.user_token, login.body.result.token);
  assert.equal(accepted.body.data.uid, PHONE_USER_ID);
  assert.equal((await check({ token: 'a'.repeat(64) })).status, 401);
  assert.equal((await check({ uid: 'unknown' })).body.result, false);
  assert.equal((await check({}, true)).status, 401);
  assert.equal((await check({}, false, true)).status, 401);
  f.setTime(login.body.result.expire_time + 1);
  assert.equal((await check()).status, 401);
});

test('signed external QuickSDK identity is bridged to a server-owned local session', async t => {
  const quickSdk = { productCode: 'fc-local', productKey: 'fclocal1' };
  const canonical = { userId: 'server-player-2', loginCode: 'server-login-2', nickname: 'Server Player 2' };
  const resolved = [];
  const f = await fixture(t, {
    quickSdk,
    quickSdkIdentityResolver: identity => {
      resolved.push(identity);
      return canonical;
    }
  });
  async function check(overrides = {}, badSign = false) {
    const data = { uid: '9768a7c5ad00', token: '97170cea8a25', ...overrides };
    const key = Buffer.from(quickSdk.productKey);
    const cipher = createCipheriv('des-ede3', Buffer.concat([key, key, key]), null);
    const json_data = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]).toString('base64');
    const fields = new Map([['product_code', quickSdk.productCode], ['json_data', json_data]]);
    const digestValue = signQuickSdk(fields, quickSdk.productKey);
    const sign = badSign ? '0'.repeat(32) : digestValue;
    return f.raw('/v2/users/checkLogin', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams([...fields, ['sign', sign]]).toString() });
  }

  const accepted = await check();
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.result, true);
  assert.equal(accepted.body.data.uid, canonical.userId);
  assert.equal(accepted.body.data.platform_uid, canonical.userId);
  assert.equal(accepted.body.data.user_name, canonical.nickname);
  assert.match(accepted.body.data.user_token, /^[0-9a-f]{64}$/);
  assert.notEqual(accepted.body.data.user_token, '97170cea8a25');
  assert.equal(f.service.verifySession(canonical.userId, accepted.body.data.user_token), true);
  assert.equal((await f.verify({ token: accepted.body.data.user_token, userid: canonical.userId })).status, 200);
  assert.equal(resolved.length, 1);
  assert.deepEqual(resolved[0], { productCode: quickSdk.productCode, uid: '9768a7c5ad00', token: '97170cea8a25' });

  const second = await check({ token: 'abcdef123456' });
  assert.equal(second.status, 200);
  assert.match(second.body.data.user_token, /^[0-9a-f]{64}$/);
  assert.notEqual(second.body.data.user_token, accepted.body.data.user_token);
  const logged = JSON.stringify(f.events);
  for (const secret of ['9768a7c5ad00', '97170cea8a25', accepted.body.data.user_token]) assert.equal(logged.includes(secret), false, secret);

  const before = resolved.length;
  assert.equal((await check({}, true)).status, 401);
  assert.equal(resolved.length, before);
});

test('external QuickSDK identity resolver can reject an otherwise signed identity', async t => {
  const quickSdk = { productCode: 'fc-local', productKey: 'fclocal1' };
  const f = await fixture(t, { quickSdk, quickSdkIdentityResolver: () => null });
  const key = Buffer.from(quickSdk.productKey);
  const cipher = createCipheriv('des-ede3', Buffer.concat([key, key, key]), null);
  const json_data = Buffer.concat([cipher.update(JSON.stringify({ uid: 'external-user', token: 'external-token' }), 'utf8'), cipher.final()]).toString('base64');
  const fields = new Map([['product_code', quickSdk.productCode], ['json_data', json_data]]);
  const form = new URLSearchParams([...fields, ['sign', signQuickSdk(fields, quickSdk.productKey)]]);
  const response = await f.raw('/v2/users/checkLogin', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: form.toString() });
  assert.equal(response.status, 401);
  assert.equal(response.body.result, false);
  assert.equal(response.body.error.code, 1003);
});

test('QuickSDK order payment validates its carrier, product, role and amount before buying', async t => {
  const quickSdk = { productCode: 'fc-local', productKey: 'fclocal1' };
  const f = await fixture(t, { localTestOtp: true, quickSdk });
  const orders = new Map();
  const calls = [];
  const wallet = {
    snapshot: () => ({
      accounts: [{ account_id: PHONE_USER_ID, role_id: 100001 }],
      products: [{ id: 40009, price_cents: 600, type: 46 }]
    }),
    buy: input => {
      calls.push(input);
      if (input.product_id !== 40009) throw Object.assign(new Error('Unsupported product'), { code: 5 });
      let order = orders.get(input.request_id);
      if (!order) { order = { order_id: 'local-order-40009', duplicate: false }; orders.set(input.request_id, order); }
      return order;
    }
  };
  f.service.attachWallet(wallet);
  const login = await f.post('/user/phoneLogin', { appid: configuration.appId, phone: '19900000000', verifyCode: '1234' });
  const basePayment = {
    uid: PHONE_USER_ID, user_name: configuration.account.nickname, token: login.body.result.token,
    goods_id: 40009, goods_name: 'Value stamina', goods_desc: 'Local test product',
    cp_order_id: '100001179328161371540009', price: 6, count: 1, amount: 6,
    callback_url: 'http://127.0.0.1:18880/callback', extras_params: JSON.stringify({ roleID: 100001, goodsID: 40009, storeProductId: 'com.woobest.mysq_6', productID: 40009 }),
    external_params: '', pay_params: '',
    game_role_info: Buffer.from(JSON.stringify({ server_id: '1', game_role_id: '100001' })).toString('base64')
  };
  async function pay(overrides = {}, options = {}) {
    const key = Buffer.from(quickSdk.productKey);
    const cipher = createCipheriv('des-ede3', Buffer.concat([key, key, key]), null);
    const json_data = Buffer.concat([cipher.update(JSON.stringify({ ...basePayment, ...overrides }), 'utf8'), cipher.final()]).toString('base64');
    const fields = new Map([['product_code', options.productCode ?? quickSdk.productCode], ['json_data', json_data]]);
    const sign = options.badSign ? '0'.repeat(32) : signQuickSdk(fields, quickSdk.productKey);
    return f.raw('/v1/order/orderpay', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams([...fields, ['sign', sign]]).toString() });
  }

  const accepted = await pay();
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.result, true);
  assert.deepEqual(accepted.body.error, {});
  assert.deepEqual(accepted.body.data, { order_id: 'local-order-40009', channel_order_id: 'local-order-40009', channel_params: '' });
  assert.deepEqual(calls[0], { account_id: PHONE_USER_ID, product_id: 40009, request_id: '100001179328161371540009' });
  assert.equal((await pay()).body.data.order_id, 'local-order-40009');
  assert.equal(orders.size, 1);

  for (const [overrides, code] of [
    [{ token: 'a'.repeat(64) }, 1003],
    [{ uid: 'different-user' }, 1003],
    [{ goods_id: 40010 }, 400],
    [{ count: 2 }, 400],
    [{ price: 5 }, 400],
    [{ amount: 5 }, 400],
    [{ game_role_info: Buffer.from(JSON.stringify({ server_id: '2', game_role_id: '100001' })).toString('base64') }, 400]
  ]) {
    const rejected = await pay(overrides);
    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.result, false);
    assert.equal(rejected.body.error.code, code);
  }
  assert.equal((await pay({}, { badSign: true })).body.error.code, 1001);
  assert.equal((await pay({}, { productCode: 'other-product' })).body.error.code, 1001);
  const serialized = JSON.stringify(f.events);
  assert.equal(serialized.includes(login.body.result.token), false);
  assert.equal(serialized.includes('json_data'), false);
});

test('local payment tips require an active signed SDK session and advertise payment methods', async t => {
  const f = await fixture(t, { localTestOtp: true });
  f.service.attachWallet({ snapshot: () => ({ accounts: [], products: [] }) });
  const request = fields => f.raw('/pay/recharge/paytips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams(fields).toString()
  });
  const unsigned = { appid: configuration.appId, userid: configuration.account.userId };
  assert.equal((await request({ ...unsigned, sign: '0'.repeat(32) })).status, 401);
  const login = await f.login();
  const signed = await request({ ...unsigned, sign: signSdkParameters(unsigned, configuration.appKey) });
  assert.equal(signed.status, 200);
  assert.deepEqual(signed.body, {
    rcode: 0,
    rdesc: 'ok',
    result: {
      alipay: { status: 1, tips: '' },
      weixin: { status: 1, tips: '' }
    }
  });
  const forged = await request({ ...unsigned, userid: 'other-user', sign: signSdkParameters({ ...unsigned, userid: 'other-user' }, configuration.appKey) });
  assert.equal(forged.status, 401);
  f.setTime(login.body.result.expire_time + 1);
  assert.equal((await request({ ...unsigned, sign: signSdkParameters(unsigned, configuration.appKey) })).status, 401);
});

test('QuickSDK order payment maps wallet failures to an ApiResult error', async t => {
  const quickSdk = { productCode: 'fc-local', productKey: 'fclocal1' };
  const f = await fixture(t, { localTestOtp: true, quickSdk });
  let failure = Object.assign(new Error('Account balance is insufficient'), { code: 301 });
  f.service.attachWallet({
    snapshot: () => ({
      accounts: [{ account_id: PHONE_USER_ID, role_id: 100001 }],
      products: [{ id: 40009, price_cents: 600, type: 46 }]
    }),
    buy: () => { throw failure; }
  });
  const login = await f.post('/user/phoneLogin', { appid: configuration.appId, phone: '19900000000', verifyCode: '1234' });
  const key = Buffer.from(quickSdk.productKey);
  async function pay(cpOrderId) {
    const payment = {
      uid: PHONE_USER_ID, token: login.body.result.token, goods_id: 40009,
      cp_order_id: cpOrderId, price: 6, amount: 6, count: 1,
      extras_params: JSON.stringify({ goodsID: 40009, productID: 40009 }),
      game_role_info: Buffer.from(JSON.stringify({ server_id: '1', game_role_id: '100001' })).toString('base64')
    };
    const cipher = createCipheriv('des-ede3', Buffer.concat([key, key, key]), null);
    const json_data = Buffer.concat([cipher.update(JSON.stringify(payment), 'utf8'), cipher.final()]).toString('base64');
    const fields = new Map([['product_code', quickSdk.productCode], ['json_data', json_data]]);
    return f.raw('/v1/order/orderpay', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams([...fields, ['sign', signQuickSdk(fields, quickSdk.productKey)]]).toString() });
  }
  const response = await pay('quick-pay-insufficient');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { result: false, error: { code: 301, id: '80000', message: '\u4f59\u989d\u4e0d\u8db3\uff0c\u8bf7\u5148\u5145\u503c' }, data: {} });
  failure = Object.assign(new Error('Product purchase limit reached'), { code: 307 });
  const limited = await pay('quick-pay-limit');
  assert.equal(limited.status, 200);
  assert.deepEqual(limited.body, { result: false, error: { code: 307, id: '80001', message: '\u8be5\u5546\u54c1\u4eca\u65e5\u8d2d\u4e70\u6b21\u6570\u5df2\u7528\u5b8c' }, data: {} });
});

test('local platform status validates its own signature, identity, active session and fixture shape', async t => {
  const platform = { appId: 'local-platform', appKey: 'local-platform-key' };
  const f = await fixture(t, { localTestOtp: true, platform });
  const fields = { appid: platform.appId, userid: configuration.account.userId };
  async function status(overrides = {}, signature) {
    const params = { ...fields, ...overrides };
    return f.raw('/user/userStatus', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: new URLSearchParams({ ...params, sign: signature ?? signSdkParameters(params, platform.appKey) }).toString() });
  }
  assert.equal((await status()).status, 401);
  const login = await f.login();
  const accepted = await status();
  assert.equal(accepted.status, 200);
  assert.deepEqual(accepted.body.result, { is_idcode_verified: 1, is_certification: 2, is_guest: 0, is_telphone_bind: 1, info_telphone: '19900000000', info_age: 18 });
  for (const [key, value] of Object.entries(accepted.body.result)) assert.equal(accepted.body[key], value);
  assert.equal((await status({ userid: 'unknown-user' })).status, 401);
  assert.equal((await status({ appid: configuration.appId })).status, 401);
  assert.equal((await status({}, '0'.repeat(32))).status, 401);
  f.setTime(login.body.result.expire_time + 1);
  assert.equal((await status()).status, 401);
  const disabled = await fixture(t, { platform });
  assert.equal((await disabled.raw('/user/userStatus', { method: 'POST' })).status, 404);
});
