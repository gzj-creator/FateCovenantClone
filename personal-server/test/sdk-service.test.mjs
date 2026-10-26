import assert from 'node:assert/strict';
import { createCipheriv, createHash } from 'node:crypto';
import test from 'node:test';
import { equalMd5Hex, md5Hex, signSdkParameters } from '../sdk-signing.mjs';
import { createSdkService } from '../sdk-service.mjs';
import { signQuickSdk } from '../quick-sdk.mjs';

const digest = text => createHash('md5').update(text, 'utf8').digest('hex');
const configuration = {
  appId: 'local-sdk-test', appKey: 'local test key', sessionTtlSeconds: 60,
  account: { loginCode: 'local player', passwordMd5: digest('test-only-password'), userId: 'local-test-1', nickname: '本地测试' }
};

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
  assert.equal(f.service.verifySession(configuration.account.userId, login.body.result.token), true);
  assert.equal((await f.verify(login.body.result)).status, 200);
  assert.equal((await f.post('/user/loginReg', { ...fields, verifyCode: '4321' })).status, 200);
  assert.equal((await f.post('/user/phoneLogin', { ...fields, verifyCode: '' })).status, 400);
  assert.equal((await f.post('/user/phoneLogin', { ...fields, phone: 'invalid' })).status, 400);
  assert.equal((await f.post('/user/phoneLogin', fields, { sign: '0'.repeat(32) })).status, 401);
  const logs = JSON.stringify(f.events);
  for (const value of [fields.phone, fields.verifyCode, login.body.result.token]) assert.equal(logs.includes(value), false);
});

test('isolated phone registration signs into the existing account and supports token verification', async t => {
  const fields={appid:configuration.appId,phone:'19900000000',password:'a'.repeat(32),verifyCode:'1234'};
  const disabled=await fixture(t);
  assert.equal((await disabled.post('/user/phoneRegist',fields)).status,404);
  const f=await fixture(t,{localTestOtp:true});
  assert.equal((await f.post('/user/phoneRegist',fields,{sign:'0'.repeat(32)})).status,401);
  for(const code of ['123','123456','abcd'])assert.equal((await f.post('/user/phoneRegist',{...fields,verifyCode:code})).status,400);
  const login=await f.post('/user/phoneRegist',fields);assert.equal(login.status,200);assert.equal(login.body.rcode,0);assert.equal(login.body.result.userid,configuration.account.userId);
  assert.equal((await f.verify(login.body.result)).status,200);
  assert.equal((await f.login()).status,200);
  const logs=JSON.stringify(f.events);for(const value of [fields.phone,fields.password,fields.verifyCode,login.body.result.token])assert.equal(logs.includes(value),false);
});

test('secondary SDK validates signed DES carrier against issued session and rejects forged credentials', async t => {
  const quickSdk = { productCode: 'fc-local', productKey: 'fclocal1' };
  const f = await fixture(t, { localTestOtp: true, quickSdk });
  const login = await f.post('/user/phoneLogin', { appid: configuration.appId, phone: '19900000000', verifyCode: '1234' });
  async function check(overrides = {}, badSign = false, lowercase = false) {
    const data = { uid: configuration.account.userId, token: login.body.result.token, ...overrides };
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
  assert.equal(accepted.body.data.uid, configuration.account.userId);
  assert.equal((await check({ token: 'a'.repeat(64) })).status, 401);
  assert.equal((await check({ uid: 'unknown' })).body.result, false);
  assert.equal((await check({}, true)).status, 401);
  assert.equal((await check({}, false, true)).status, 401);
  f.setTime(login.body.result.expire_time + 1);
  assert.equal((await check()).status, 401);
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
