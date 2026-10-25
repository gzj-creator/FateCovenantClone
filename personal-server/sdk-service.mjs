import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { equalMd5Hex, signSdkParameters } from './sdk-signing.mjs';
import { decodeQuickSdkCarrier, signQuickSdk } from './quick-sdk.mjs';

const HOST = '127.0.0.1';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_SESSIONS = 1024;
const MAX_UNIX_SECONDS = 2_147_483_647;

class RequestError extends Error {
  constructor(statusCode, rcode, message) {
    super(message);
    this.statusCode = statusCode;
    this.rcode = rcode;
  }
}

function requiredText(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 512) throw new TypeError(`${name} must be a nonempty string of at most 512 characters`);
  return value;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let finished = false;
    request.on('data', chunk => {
      if (finished) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        finished = true;
        reject(new RequestError(413, 413, 'Request body too large'));
      } else chunks.push(chunk);
    });
    request.on('end', () => {
      if (!finished) {
        finished = true;
        resolve(Buffer.concat(chunks));
      }
    });
    request.on('aborted', () => reject(new RequestError(400, 400, 'Incomplete request')));
    request.on('error', () => reject(new RequestError(400, 400, 'Invalid request')));
  });
}

async function readForm(request, expectedFields, optionalFields = []) {
  if (!/^application\/x-www-form-urlencoded(?:\s*;\s*charset\s*=\s*UTF-8)?\s*$/i.test(request.headers['content-type'] || '')) {
    throw new RequestError(415, 415, 'Expected UTF-8 form data');
  }
  const declaredLength = Number(request.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) throw new RequestError(413, 413, 'Request body too large');
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await readBody(request));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, 400, 'Invalid UTF-8 form data');
  }
  const fields = new Map();
  for (const [key, value] of new URLSearchParams(text)) {
    if ((!expectedFields.includes(key) && !optionalFields.includes(key)) || fields.has(key) || (value.length === 0 && !optionalFields.includes(key))) throw new RequestError(400, 400, 'Unexpected, duplicate, or empty field');
    fields.set(key, value);
  }
  if (expectedFields.some(key=>!fields.has(key))) throw new RequestError(400, 400, 'Missing request fields');
  return fields;
}

function tokenKey(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createSdkService(options = {}) {
  const localTestOtp = options.localTestOtp === true;
  const quickSdk = options.quickSdk;
  if (quickSdk && (typeof quickSdk.productCode !== 'string' || Buffer.byteLength(quickSdk.productKey ?? '', 'utf8') !== 8)) throw new TypeError('Local QuickSDK requires a product code and eight-byte key');
  const appId = requiredText(options.appId, 'appId');
  const appKey = requiredText(options.appKey, 'appKey');
  const platform = options.platform && Object.freeze({
    appId: requiredText(options.platform.appId, 'platform.appId'),
    appKey: requiredText(options.platform.appKey, 'platform.appKey')
  });
  const supplied = options.account || {};
  const account = Object.freeze({
    loginCode: requiredText(supplied.loginCode, 'account.loginCode'),
    passwordMd5: supplied.passwordMd5,
    userId: requiredText(supplied.userId ?? 'local-1', 'account.userId'),
    nickname: requiredText(supplied.nickname ?? 'Local test player', 'account.nickname')
  });
  if (typeof account.passwordMd5 !== 'string' || !/^[0-9a-f]{32}$/.test(account.passwordMd5)) throw new TypeError('account.passwordMd5 must be a lowercase MD5 digest');
  const sessionTtlSeconds = options.sessionTtlSeconds ?? 3600;
  if (!Number.isSafeInteger(sessionTtlSeconds) || sessionTtlSeconds < 1 || sessionTtlSeconds > 604800) throw new TypeError('sessionTtlSeconds must be between 1 and 604800');
  const nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000));
  if (typeof nowSeconds !== 'function') throw new TypeError('nowSeconds must be a function');
  if (options.logger !== undefined && typeof options.logger !== 'function') throw new TypeError('logger must be a function');
  const sessions = new Map();
  let wallet;
  const log = event => {
    try { options.logger?.(Object.freeze(event)); } catch {}
  };
  const currentTime = () => {
    const value = nowSeconds();
    if (!Number.isSafeInteger(value) || value < 0 || value + sessionTtlSeconds > MAX_UNIX_SECONDS) throw new Error('Clock exceeds SDK int32 Unix timestamp range');
    return value;
  };
  currentTime();
  function resultFor(token, expiresAt) {
    return {
      account_type: 'local', enthralment: 0, expire_time: expiresAt, face_url: '',
      guest_id_verify: 0, has_pwd: 1, id_code: '', info_age: 0,
      login_code: account.loginCode, login_code_ext: account.loginCode, mail_set: '',
      name: '', nickname: account.nickname, sdk_id_verify: false, status: '1',
      telphone_set: '', token, userid: account.userId
    };
  }
  function authenticateForm(fields) {
    const received = fields.get('sign');
    fields.delete('sign');
    const expected = signSdkParameters(fields, appKey);
    if (fields.get('appid') !== appId || !equalMd5Hex(expected, received)) throw new RequestError(401, 1001, 'Invalid application or signature');
  }
  const server = http.createServer(async (request, response) => {
    let route = 'unknown';
    function send(statusCode, value, rcode = value.rcode) {
      if (response.destroyed || response.writableEnded) return;
      const body = JSON.stringify(value);
      response.writeHead(statusCode, {
        'Content-Type': 'application/json;charset=UTF-8', 'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Connection': 'close'
      });
      response.end(body);
      log({ event: 'request', route, statusCode, ...(rcode === undefined ? {} : { rcode }) });
    }
    try {
      const url = new URL(request.url, `http://${HOST}`);
      route = url.pathname === '/user/login' ? 'login' : url.pathname === '/user/tokenVerifySdk' ? 'tokenVerifySdk' : /^\/banner\/[A-Za-z0-9_-]+\/(?:android|[0-9]+)-banner[.]json$/.test(url.pathname) ? 'banner' : 'unknown';
      const otpRoutes = { '/user/phoneAccountCheck': 'phoneAccountCheck', '/sms/send': 'localSms', '/user/phoneLogin': 'localPhoneLogin', '/user/loginReg': 'localPhoneLogin', '/user/phoneRegist': 'localPhoneRegister' };
      if (localTestOtp && Object.hasOwn(otpRoutes, url.pathname)) route = otpRoutes[url.pathname];
      if (quickSdk && url.pathname === '/v2/users/checkLogin') route = 'quickLogin';
      if (quickSdk && url.pathname === `/${quickSdk.productCode}-1088.html`) route = 'quickServers';
      if (localTestOtp && platform && url.pathname === '/user/userStatus') route = 'userStatus';
      if(localTestOtp && wallet && url.pathname==='/pay/recharge/order')route='walletOrder';
      if (route === 'unknown') log({ event: 'unimplemented_route', method: request.method, pathSha256: createHash('sha256').update(url.pathname).digest('hex') });
      if (route === 'unknown') throw new RequestError(404, 404, 'Route not implemented');
      if (url.search) throw new RequestError(400, 400, 'Use form fields without a query string');
      if (request.method !== (['banner', 'quickServers'].includes(route) ? 'GET' : 'POST')) throw new RequestError(405, 405, 'Method not allowed');
      if (route === 'banner') { send(200, {}); return; }
      if (route === 'quickServers') { send(200, ['http://127.0.0.1:18880']); return; }
      if(route==='walletOrder'){
        const fields=await readForm(request,['appid','userid','server','role_id','product_id','cp_order','amount','sign'],['channel','game','title','recharge_source','third_product_id','extra_params','package']);
        const signature=fields.get('sign');fields.delete('sign');
        const validKey=fields.get('appid')===appId?appKey:platform&&fields.get('appid')===platform.appId?platform.appKey:null;
        if(!validKey||!equalMd5Hex(signSdkParameters(fields,validKey),signature))throw new RequestError(401,1001,'Invalid local payment signature');
        if(fields.get('userid')!==account.userId||![...sessions.values()].some(s=>s.userId===account.userId&&currentTime()<=s.expiresAt))throw new RequestError(401,1003,'Local SDK session required');
        const state=wallet.snapshot(),owner=state.accounts.find(x=>x.account_id===account.userId),product=state.products.find(x=>String(x.id)===fields.get('product_id'));
        if(!owner||!product||fields.get('server')!=='1'||fields.get('role_id')!==String(owner.role_id)||!/^\d+(?:[.]\d{1,2})?$/.test(fields.get('amount'))||Math.round(Number(fields.get('amount'))*100)!==product.price_cents)throw new RequestError(400,400,'Invalid local product, role or amount');
        let order;try{order=wallet.buy({account_id:account.userId,product_id:product.id,request_id:fields.get('cp_order')});}catch(error){throw new RequestError(400,error.code??400,error.message);}
        send(200,{rcode:0,rdesc:'Local balance purchase completed',result:{order_no:order.order_id,status:1,balance_cents:order.balance_cents}});return;
      }
      if (route === 'userStatus') {
        const fields = await readForm(request, ['appid', 'userid', 'sign']);
        const signature = fields.get('sign');
        fields.delete('sign');
        if (fields.get('appid') !== platform.appId || !equalMd5Hex(signSdkParameters(fields, platform.appKey), signature)) {
          log({ event: 'user_status_rejected', stage: 'signature', appMatches: fields.get('appid') === platform.appId });
          throw new RequestError(401, 1001, 'Invalid local platform or signature');
        }
        const active = fields.get('userid') === account.userId && [...sessions.values()].some(session => session.userId === account.userId && currentTime() <= session.expiresAt);
        if (!active) throw new RequestError(401, 1003, 'Local SDK session required');
        // Fictional identity fixture for this isolated local test, not an identity check.
        const status = { is_idcode_verified: 1, is_certification: 2, is_guest: 0, is_telphone_bind: 1, info_telphone: '19900000000', info_age: 18 };
        send(200, { rcode: 0, rdesc: 'ok', ...status, result: status });
        return;
      }
      if (route === 'quickLogin') {
        const fields = await readForm(request, ['product_code', 'json_data', 'sign']);
        const signature = fields.get('sign');
        fields.delete('sign');
        if (fields.get('product_code') !== quickSdk.productCode || !/^[0-9A-F]{32}$/.test(signature) || !equalMd5Hex(signQuickSdk(fields, quickSdk.productKey).toLowerCase(), signature.toLowerCase())) {
          log({ event: 'quick_login_rejected', stage: 'signature', productMatches: fields.get('product_code') === quickSdk.productCode, signatureLength: signature.length });
          throw new RequestError(401, 1001, 'Invalid local product or signature');
        }
        let login;
        try { login = decodeQuickSdkCarrier(fields.get('json_data'), quickSdk.productKey); }
        catch { throw new RequestError(400, 400, 'Invalid local SDK carrier'); }
        const session = typeof login.token === 'string' && /^[0-9a-f]{64}$/.test(login.token) ? sessions.get(tokenKey(login.token)) : undefined;
        if (!session || session.userId !== login.uid || currentTime() > session.expiresAt) {
          log({ event: 'quick_login_rejected', stage: 'session', tokenKnown: Boolean(session), uidMatches: session?.userId === login.uid, uidLength: String(login.uid ?? '').length, tokenLength: String(login.token ?? '').length });
          throw new RequestError(401, 1003, 'Local SDK session required');
        }
        send(200, { result: true, error: {}, data: { uid: account.userId, user_name: account.nickname, user_token: login.token, token: login.token, platform_uid: account.userId, platform_username: account.nickname, platform_password: '', platform_status: '1', stopCreateRole: false, stopCreateTime: '' } });
        return;
      }
      const otpFields = { phoneAccountCheck: ['appid', 'phone', 'sign'], localSms: ['appid', 'phone', 'type', 'size', 'sign'], localPhoneLogin: ['appid', 'phone', 'verifyCode', 'sign'], localPhoneRegister: ['appid', 'phone', 'password', 'verifyCode', 'sign'] };
      const fields = await readForm(request, otpFields[route] ?? (route === 'login' ? ['loginCode', 'password', 'appid', 'sign'] : ['access_token', 'appid', 'userid', 'sign']));
      authenticateForm(fields);
      if (Object.hasOwn(otpFields, route) && !/^[0-9]{11}$/.test(fields.get('phone'))) throw new RequestError(400, 400, 'Use an eleven-digit local test phone identifier');
      if (route === 'phoneAccountCheck') { send(200, { rcode: 0, rdesc: 'Local test account', result: { has_pwd: 0 } }); return; }
      if (route === 'localSms') { send(200, { rcode: 0, rdesc: 'Local test mode: no SMS sent', result: { wait_time: 1 } }); return; }
      if (['localPhoneLogin','localPhoneRegister'].includes(route) && !/^[0-9]{4}$/.test(fields.get('verifyCode'))) throw new RequestError(400, 400, 'Use a four-digit local test code');
      const now = currentTime();
      for (const [key, session] of sessions) if (now > session.expiresAt) sessions.delete(key);
      if (route === 'login' || route === 'localPhoneLogin' || route === 'localPhoneRegister') {
        // The isolated SDK's registration screen also signs a password field.
        // It signs into the existing test identity without changing its credentials or save.
        if (route === 'login' && (fields.get('loginCode') !== account.loginCode || !equalMd5Hex(account.passwordMd5, fields.get('password')))) throw new RequestError(401, 1002, 'Invalid credentials');
        if (sessions.size >= MAX_SESSIONS) throw new RequestError(503, 1004, 'Session limit reached');
        const token = randomBytes(32).toString('hex');
        const expiresAt = now + sessionTtlSeconds;
        sessions.set(tokenKey(token), { userId: account.userId, expiresAt });
        send(200, { rcode: 0, rdesc: 'ok', result: resultFor(token, expiresAt) });
        return;
      }
      const token = fields.get('access_token');
      const session = /^[0-9a-f]{64}$/.test(token) ? sessions.get(tokenKey(token)) : undefined;
      if (!session || session.userId !== fields.get('userid') || now > session.expiresAt) throw new RequestError(401, 1003, 'Invalid or expired session');
      send(200, { rcode: 0, rdesc: 'ok', result: resultFor(token, session.expiresAt) });
    } catch (error) {
      const known = error instanceof RequestError;
      if (route === 'quickLogin') {
        send(known ? error.statusCode : 500, { result: false, error: { code: known ? error.rcode : 500, message: known ? error.message : 'Internal service error' }, data: {} });
        return;
      }
      send(known ? error.statusCode : 500, { rcode: known ? error.rcode : 500, rdesc: known ? error.message : 'Internal service error', result: {} });
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 1000;
  let closed = false;
  let listenPromise;
  let closePromise;
  return Object.freeze({
    attachWallet(value) { if(!localTestOtp)throw new Error('Wallet requires explicit local test mode');wallet=value; },
    verifySession(userId, token) {
      if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return false;
      const session = sessions.get(tokenKey(token));
      return Boolean(session && session.userId === userId && currentTime() <= session.expiresAt);
    },
    listen(port = 0) {
      if (closed) return Promise.reject(new Error('Service is closed'));
      if (listenPromise) return Promise.reject(new Error('Service was already started'));
      if (!Number.isInteger(port) || port < 0 || port > 65535) return Promise.reject(new TypeError('Port must be between 0 and 65535'));
      listenPromise = new Promise((resolve, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => {
          server.off('error', onError);
          const address = server.address();
          log({ event: 'listening', host: HOST, port: address.port });
          resolve({ host: HOST, port: address.port, url: `http://${HOST}:${address.port}` });
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, HOST);
      });
      return listenPromise;
    },
    address() { return server.address(); },
    close() {
      if (closePromise) return closePromise;
      closed = true;
      closePromise = (async () => {
        if (listenPromise) await listenPromise.catch(() => {});
        if (server.listening) await new Promise((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve());
          server.closeAllConnections();
        });
        sessions.clear();
      })();
      return closePromise;
    }
  });
}

if (import.meta.main) {
  let service;
  try {
    service = createSdkService({
      appId: process.env.SDK_APP_ID, appKey: process.env.SDK_APP_KEY,
      account: { loginCode: process.env.SDK_LOGIN_CODE, passwordMd5: process.env.SDK_PASSWORD_MD5,
        userId: process.env.SDK_USER_ID, nickname: process.env.SDK_NICKNAME },
      logger: event => console.log(JSON.stringify(event))
    });
    await service.listen(process.env.SDK_PORT === undefined ? 18880 : Number(process.env.SDK_PORT));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await service.close(); });
  } catch {
    await service?.close();
    console.error('SDK service failed. Check SDK_APP_ID, SDK_APP_KEY, SDK_LOGIN_CODE, SDK_PASSWORD_MD5, optional SDK_USER_ID/SDK_NICKNAME, and SDK_PORT.');
    process.exitCode = 1;
  }
}
