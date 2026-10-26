import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createProtobufJsCodec, SERVER_SCHEMA_SHA256 } from '../server-list-codec.mjs';
import { buildLocalServer, buildServerListMessage, createServerListService, encodeServerListRequest, signServerListParameters } from '../server-list.mjs';

const NOW = 1_790_000_000;
const KEY = 'local signing key with spaces';
const serverConfig = { id: 1, name: 'S1 本地测试服', extranetIp: '127.0.0.1:19090' };
const params = { channel_id: 'local-channel', channel_uid: 'local-account', device_label: 'local device' };
const digest = value => createHash('md5').update(value, 'utf8').digest('hex');
const codec = createProtobufJsCodec();

async function fixture(t, useCodec = true) {
  const events = [];
  const service = createServerListService({ signingKey: KEY, server: serverConfig, nowSeconds: () => NOW, codec: useCodec ? codec : undefined, logger: event => events.push(event) });
  t.after(() => service.close());
  const address = await service.listen(0);
  async function raw(path, options = {}) {
    const response = await fetch(address.url + path, { signal: AbortSignal.timeout(5000), ...options });
    const bytes = Buffer.from(await response.arrayBuffer());
    return { status: response.status, headers: response.headers, bytes, json: () => JSON.parse(bytes.toString('utf8')) };
  }
  function post(method, data, override = {}) {
    const form = encodeServerListRequest(method, data, KEY);
    for (const [key, value] of Object.entries(override)) form.set(key, value);
    return raw('/server_list', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: form.toString() });
  }
  return { service, address, events, raw, post };
}

test('server-list signing uses original sorted params and preserves ASCII spaces', () => {
  const values = { z: 'a b+&=', a: 2, 中: '中文 😀' };
  assert.equal(signServerListParameters(values, KEY), digest('a=2&z=a b+&=&中=中文 😀&key=' + KEY));
  assert.notEqual(signServerListParameters(values, KEY), digest(('a=2&z=a b+&=&中=中文 😀&key=' + KEY).replaceAll(' ', '')));
  const form = encodeServerListRequest('preferred_login_servers', values, KEY);
  assert.deepEqual(JSON.parse(Buffer.from(form.get('json'), 'base64').toString('utf8')), values);
  assert.equal(form.get('sign'), signServerListParameters(values, KEY));
});

test('strict local message constructors require explicit IPv4:port and past timestamps', () => {
  const server = buildLocalServer(serverConfig, NOW);
  assert.equal(server.state, 0);
  assert.equal(server.show_state, 1);
  assert(server.show_time < NOW && server.release_time < NOW);
  assert.equal(server.start_maintain_time, 0);
  assert.equal(server.stop_maintain_time, 0);
  const message = buildServerListMessage(serverConfig, params, NOW);
  assert.deepEqual(message.roles, []);
  assert.equal(message.limit_login, false);
  assert.equal(message.channel_id.toString('utf8'), params.channel_id);
  for (const extranetIp of [undefined, '', 'localhost:19090', '127.0.0.1', '::1:19090', '127.0.0.1:65536']) assert.throws(() => buildLocalServer({ ...serverConfig, extranetIp }, NOW));
  assert.throws(() => buildLocalServer({ ...serverConfig, releaseTime: NOW }, NOW));
  assert.throws(() => buildLocalServer({ ...serverConfig, id: 0 }, NOW));
});

test('trusted protobufjs encodes and reverse-decodes both exact exported message types', () => {
  assert.equal(codec.metadata.name, 'protobufjs');
  assert.match(codec.metadata.version, /^[0-9]+[.][0-9]+[.][0-9]+/);
  assert.equal(codec.metadata.schemaSha256, SERVER_SCHEMA_SHA256);
  const list = buildServerListMessage(serverConfig, params, NOW);
  const bytes = codec.encode('pb_login_servers', list);
  assert(Buffer.isBuffer(bytes) && bytes.length > 0);
  const decoded = codec.decode('pb_login_servers', bytes);
  assert.equal(decoded.servers[0].id, serverConfig.id);
  assert.equal(decoded.servers[0].name, serverConfig.name);
  assert.equal(decoded.servers[0].extranet_ip, serverConfig.extranetIp);
  assert.equal(decoded.now_sec, String(NOW));
  assert.equal(decoded.channel_id.toString('utf8'), params.channel_id);
  assert.deepEqual(decoded.roles, []);
  const single = codec.decode('pb_login_server', codec.encode('pb_login_server', list.servers[0]));
  assert.deepEqual(single, decoded.servers[0]);
  assert.throws(() => codec.encode('pb_login_server', { id: 'wrong-type' }), /Invalid protobuf/);
  assert.throws(() => codec.encode('unknown', {}), /Unsupported/);
});

test('HTTP channel and preferred server lists return protobuf binary that reverse-decodes', async t => {
  const f = await fixture(t);
  assert.equal(f.address.host, '127.0.0.1');
  for (const [method, data] of [['channel_login_servers', params], ['preferred_login_servers', { ...params, last_server: 0, manual_select: 1 }]]) {
    const response = await f.post(method, data);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/octet-stream');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const decoded = codec.decode('pb_login_servers', response.bytes);
    assert.equal(decoded.servers.length, 1);
    assert.equal(decoded.servers[0].extranet_ip, serverConfig.extranetIp);
    assert.equal(decoded.now_sec, String(NOW));
    assert.equal(decoded.limit_login, false);
    assert.deepEqual(decoded.roles, []);
  }
});

test('HTTP single-server request returns pb_login_server and rejects unknown or invalid IDs', async t => {
  const f = await fixture(t);
  const response = await f.post('login_server', { server_id: 1 });
  assert.equal(response.status, 200);
  assert.equal(codec.decode('pb_login_server', response.bytes).id, 1);
  const unknown = await f.post('login_server', { server_id: 2 });
  assert.equal(unknown.status, 404);
  assert.equal(unknown.json().error, 'unknown_server');
  for (const server_id of [0, -1, '1', 1.5, 2 ** 31]) {
    const form = new URLSearchParams({ method: 'login_server', json: Buffer.from(JSON.stringify({ server_id })).toString('base64'), sign: '0'.repeat(32) });
    const invalid = await f.raw('/server_list', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.json().error, 'invalid_params');
  }
});

test('HTTP rejects wrong signature, unknown operation, and unconfirmed state operation', async t => {
  const f = await fixture(t);
  const signature = await f.post('channel_login_servers', params, { sign: '0'.repeat(32) });
  assert.equal(signature.status, 401);
  assert.equal(signature.json().error, 'invalid_signature');
  const unknown = await f.post('unimplemented_operation', { server_id: 1 });
  assert.equal(unknown.status, 400);
  assert.equal(unknown.json().error, 'unknown_operation');
  const state = await f.post('login_server_state', { server_id: 1 });
  assert.equal(state.status, 501);
  assert.equal(state.json().error, 'unconfirmed_operation');
});

test('HTTP validates Base64, field shapes, duplicate form fields, and request method', async t => {
  const f = await fixture(t);
  for (const json of ['invalid!', Buffer.from('{}').toString('base64'), Buffer.from('[1]').toString('base64'), Buffer.from(JSON.stringify({ ...params, unexpected: 'x' })).toString('base64')]) {
    assert.equal((await f.post('channel_login_servers', params, { json })).status, 400);
  }
  const form = encodeServerListRequest('channel_login_servers', params, KEY).toString();
  assert.equal((await f.raw('/server_list', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form + '&method=duplicate' })).status, 400);
  assert.equal((await f.raw('/server_list')).status, 405);
  assert.equal((await f.raw('/unknown')).status, 404);
  assert.equal((await f.raw('/server_list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 415);
});

test('without codec HTTP explicitly returns 501 and never JSON disguised as protobuf', async t => {
  const f = await fixture(t, false);
  const response = await f.post('channel_login_servers', params);
  assert.equal(response.status, 501);
  assert.equal(response.json().error, 'protobuf_codec_unavailable');
  assert.match(response.headers.get('content-type'), /^application\/json/);
});

test('service logs exclude keys, signatures, raw URLs, and request account identifiers', async t => {
  const f = await fixture(t);
  await f.post('channel_login_servers', params);
  await f.raw('/unknown-secret?token=secret-token');
  const logs = JSON.stringify(f.events);
  for (const secret of [KEY, params.channel_uid, 'unknown-secret', 'secret-token', signServerListParameters(params, KEY)]) assert.equal(logs.includes(secret), false);
  await f.service.close();
  await f.service.close();
  assert.equal(f.service.address(), null);
  await assert.rejects(f.service.listen(0), /closed/);
});
