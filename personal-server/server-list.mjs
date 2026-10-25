import http from 'node:http';
import { isIP } from 'node:net';
import { timingSafeEqual } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { md5Hex } from './sdk-signing.mjs';
import { createProtobufJsCodec } from './server-list-codec.mjs';

const HOST = '127.0.0.1';
const BODY_LIMIT = 16 * 1024;
const MAX_INT32 = 2_147_483_647;
const OPERATIONS = Object.freeze({
  channel_login_servers: ['channel_id', 'channel_uid', 'device_label'],
  preferred_login_servers: ['channel_id', 'channel_uid', 'device_label', 'last_server', 'manual_select'],
  login_server: ['server_id']
});

class ContractError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

function text(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 512) throw new TypeError(name + ' must be a nonempty string of at most 512 characters');
  return value;
}

function integer(value, name, minimum = 0, maximum = MAX_INT32) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new TypeError(name + ' is outside its integer range');
  return value;
}

export function signServerListParameters(params, signingKey) {
  text(signingKey, 'signingKey');
  if (!params || typeof params !== 'object' || Array.isArray(params)) throw new TypeError('params must be a JSON object');
  const keys = Object.keys(params).sort();
  if (keys.length === 0) throw new TypeError('params must not be empty');
  for (const key of keys) {
    const value = params[key];
    if (typeof value !== 'string' && !Number.isSafeInteger(value)) throw new TypeError('Only string or safe integer params are supported');
  }
  return md5Hex(keys.map(key => key + '=' + params[key]).join('&') + '&key=' + signingKey);
}

export function encodeServerListRequest(method, params, signingKey) {
  return new URLSearchParams({ method, json: Buffer.from(JSON.stringify(params), 'utf8').toString('base64'), sign: signServerListParameters(params, signingKey) });
}

export function buildLocalServer(config, now) {
  integer(now, 'now_sec', 1);
  integer(config?.id, 'server.id', 1);
  text(config.name, 'server.name');
  text(config.extranetIp, 'server.extranetIp');
  const parts = config.extranetIp.split(':');
  if (parts.length !== 2 || isIP(parts[0]) !== 4 || !/^[1-9][0-9]{0,4}$/.test(parts[1]) || Number(parts[1]) > 65535) throw new TypeError('server.extranetIp must be an explicitly configured IPv4:port');
  const releaseTime = config.releaseTime ?? now - 1;
  integer(releaseTime, 'server.releaseTime', 0, now - 1);
  return {
    id: config.id, name: config.name, state: 0, label: 1, show_state: 1,
    show_time: releaseTime, release_time: releaseTime, start_maintain_time: 0, stop_maintain_time: 0,
    extranet_ip: config.extranetIp, nick_name: config.name, cross_stage: 0
  };
}

export function buildServerListMessage(serverConfig, params, now) {
  const server = buildLocalServer(serverConfig, now);
  text(params.channel_id, 'channel_id');
  return {
    servers: [server], privilege_lv: 0, channel_id: Buffer.from(params.channel_id, 'utf8'), roles: [],
    now_sec: now, limit_login: false, open_time: server.release_time, ahead_time: 0, role_count: 0
  };
}

function parseRequest(body, signingKey) {
  const fields = new Map();
  for (const [key, value] of new URLSearchParams(body)) {
    if (!['method', 'json', 'sign'].includes(key) || fields.has(key) || value.length === 0) throw new ContractError(400, 'invalid_form', 'Expected method, json, and sign exactly once');
    fields.set(key, value);
  }
  if (fields.size !== 3) throw new ContractError(400, 'invalid_form', 'Missing form fields');
  const method = fields.get('method');
  if (method === 'login_server_state') throw new ContractError(501, 'unconfirmed_operation', 'login_server_state response contract is not yet confirmed');
  if (!Object.hasOwn(OPERATIONS, method)) throw new ContractError(400, 'unknown_operation', 'Unsupported server-list operation');
  const encoded = fields.get('json');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw new ContractError(400, 'invalid_json', 'Expected canonical Base64 JSON');
  let params;
  try {
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.toString('base64') !== encoded) throw new Error();
    params = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    const expectedFields = OPERATIONS[method];
    if (!params || typeof params !== 'object' || Array.isArray(params) || Object.keys(params).length !== expectedFields.length || expectedFields.some(key => !Object.hasOwn(params, key))) throw new Error();
    if (method === 'login_server') integer(params.server_id, 'server_id', 1);
    else {
      for (const key of ['channel_id', 'channel_uid', 'device_label']) text(params[key], key);
      if (method === 'preferred_login_servers') {
        integer(params.last_server, 'last_server');
        integer(params.manual_select, 'manual_select', 0, 1);
      }
    }
  } catch { throw new ContractError(400, 'invalid_params', 'Invalid JSON parameter shape or types'); }
  const expected = signServerListParameters(params, signingKey);
  const received = fields.get('sign');
  if (!/^[0-9a-f]{32}$/.test(received) || !timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))) throw new ContractError(401, 'invalid_signature', 'Invalid request signature');
  return { method, params };
}

async function readBody(request) {
  if (!/^application\/x-www-form-urlencoded(?:\s*;\s*charset\s*=\s*UTF-8)?\s*$/i.test(request.headers['content-type'] || '')) throw new ContractError(415, 'invalid_content_type', 'Expected UTF-8 form data');
  if (Number(request.headers['content-length']) > BODY_LIMIT) throw new ContractError(413, 'body_too_large', 'Request body too large');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw new ContractError(413, 'body_too_large', 'Request body too large');
    chunks.push(chunk);
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)); }
  catch { throw new ContractError(400, 'invalid_utf8', 'Invalid UTF-8 form'); }
}

export function createServerListService(options = {}) {
  const signingKey = text(options.signingKey, 'signingKey');
  const nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000));
  if (typeof nowSeconds !== 'function') throw new TypeError('nowSeconds must be a function');
  const serverConfig = Object.freeze({ ...options.server });
  buildLocalServer(serverConfig, nowSeconds());
  const codec = options.codec;
  if (codec !== undefined && (typeof codec.encode !== 'function' || codec.metadata?.name !== 'protobufjs')) throw new TypeError('Use a codec created from an explicitly supplied existing protobufjs package');
  if (options.logger !== undefined && typeof options.logger !== 'function') throw new TypeError('logger must be a function');
  const log = event => { try { options.logger?.(Object.freeze(event)); } catch {} };
  const server = http.createServer(async (request, response) => {
    let operation = 'unknown';
    function send(status, body, contentType = 'application/json;charset=UTF-8') {
      if (response.destroyed || response.writableEnded) return;
      const bytes = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
      response.writeHead(status, { 'Content-Type': contentType, 'Content-Length': bytes.length, 'Cache-Control': 'no-store', 'Connection': 'close' });
      response.end(bytes);
      log({ event: 'request', operation, status });
    }
    try {
      const url = new URL(request.url, 'http://' + HOST);
      if (url.pathname !== '/server_list') throw new ContractError(404, 'unknown_route', 'Route not implemented');
      if (request.method !== 'POST') throw new ContractError(405, 'invalid_method', 'POST required');
      if (url.search) throw new ContractError(400, 'invalid_query', 'Use form fields without a query string');
      const parsed = parseRequest(await readBody(request), signingKey);
      operation = parsed.method;
      if (parsed.method === 'login_server' && parsed.params.server_id !== serverConfig.id) throw new ContractError(404, 'unknown_server', 'Server ID is not configured');
      if (!codec) throw new ContractError(501, 'protobuf_codec_unavailable', 'No existing protobufjs runtime was configured; JSON is not a protobuf response');
      const now = nowSeconds();
      const name = parsed.method === 'login_server' ? 'pb_login_server' : 'pb_login_servers';
      const message = name === 'pb_login_server' ? buildLocalServer(serverConfig, now) : buildServerListMessage(serverConfig, parsed.params, now);
      const bytes = codec.encode(name, message);
      if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new Error('Codec returned no bytes');
      send(200, bytes, 'application/octet-stream');
    } catch (error) {
      const known = error instanceof ContractError;
      send(known ? error.status : 500, { error: known ? error.code : 'internal_error', message: known ? error.message : 'Internal server-list error' });
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  let listening;
  let closing;
  let closed = false;
  return Object.freeze({
    codecMetadata: codec?.metadata ?? null,
    listen(port = 0) {
      if (closed || listening) return Promise.reject(new Error('Service already started or closed'));
      if (!Number.isInteger(port) || port < 0 || port > 65535) return Promise.reject(new TypeError('Invalid port'));
      listening = new Promise((resolve, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => {
          server.off('error', onError);
          const address = server.address();
          log({ event: 'listening', host: HOST, port: address.port, protobuf: codec?.metadata?.version ?? 'unavailable' });
          resolve({ host: HOST, port: address.port, url: 'http://' + HOST + ':' + address.port });
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, HOST);
      });
      return listening;
    },
    address() { return server.address(); },
    close() {
      if (closing) return closing;
      closed = true;
      closing = (async () => {
        if (listening) await listening.catch(() => {});
        if (server.listening) await new Promise((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve());
          server.closeAllConnections();
        });
      })();
      return closing;
    }
  });
}

if (import.meta.main) {
  let service;
  try {
    const codec = createProtobufJsCodec(process.env.PROTOBUFJS_PACKAGE_JSON);
    service = createServerListService({ signingKey: process.env.SERVER_LIST_SIGNING_KEY,
      server: { id: Number(process.env.LOCAL_SERVER_ID), name: process.env.LOCAL_SERVER_NAME, extranetIp: process.env.LOCAL_SERVER_EXTRANET_IP },
      codec, logger: event => console.log(JSON.stringify(event)) });
    await service.listen(process.env.SERVER_LIST_PORT === undefined ? 18881 : Number(process.env.SERVER_LIST_PORT));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await service.close(); });
  } catch {
    await service?.close();
    console.error('Server-list service failed. Check explicit signing key, local server ID/name/IPv4:port, optional protobufjs package path, and port configuration.');
    process.exitCode = 1;
  }
}
