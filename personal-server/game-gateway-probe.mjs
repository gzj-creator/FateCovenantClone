import fs from 'node:fs';
import net from 'node:net';
import { createHash } from 'node:crypto';
import protobuf from 'protobufjs';
import { GameFrameDecoder, encodeGameFrame, isInitialVerifyPayload } from './game-framing.mjs';
import { createServerHandshakeChallenge } from './game-handshake.mjs';

const HOST = '127.0.0.1';
const LOGIN_SDK_TYPE = 909103;
const INITIAL_VERIFY = Buffer.from('verify', 'utf8');
const SCHEMAS = Object.freeze([
  ['channel_push.db.proto', 'afe4f56ac8f35267ad87bc252427c3b3f9a98f7e7d1c687df57f23fe7359e07c'],
  ['login.net.proto', 'a94efa0bfa99cc99664f6ace7bb6323bc8bf533b026c41fc9a15a6ce7f1e1e42'],
  ['net.net.proto', '2e233e81eda933e7a0cd134b11a29eb56f4096cb8e646c76a01b4118af8f7e5a']
]);

function digest(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function integer(value, name, maximum) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new TypeError(name + ' is outside its supported range');
  return value;
}

function loadSchemas() {
  const root = new protobuf.Root();
  for (const [name, expectedHash] of SCHEMAS) {
    const source = fs.readFileSync(new URL('../analysis/reports/private-client-16448/lua-bundles/login-protos/' + name, import.meta.url));
    if (digest(source) !== expectedHash) throw new Error('Exported gateway protobuf schema hash mismatch');
    protobuf.parse(source.toString('utf8'), root, { keepCase: true });
  }
  root.resolveAll();
  return { envelope: root.lookupType('pb_c2s'), login: root.lookupType('login') };
}

// Probe termination is deliberate: no ETF, business success, or invented error is sent.
export function createGameGatewayProbe({ profile, flags, expectedApplicationVersion, timeoutMs = 5000,
  maxPayloadBytes = 65536, maxConnections = 4, logger = event => console.log(JSON.stringify(event)) } = {}) {
  createServerHandshakeChallenge({ profile, flags, expectedApplicationVersion });
  if (Object.values(flags).some(value => value)) throw new TypeError('This probe requires explicit false flags; optional packet encryption is not implemented');
  const configuredFlags = Object.freeze({ ...flags });
  integer(timeoutMs, 'timeoutMs', 120000);
  integer(maxPayloadBytes, 'maxPayloadBytes', 1048576);
  integer(maxConnections, 'maxConnections', 32);
  if (typeof logger !== 'function') throw new TypeError('logger must be a function');
  const schemas = loadSchemas();
  const connections = new Set();
  let nextConnectionId = 0;
  let listening;
  let closing;
  let closed = false;
  const log = event => {
    try { logger(Object.freeze({ recordedAtUtc: new Date().toISOString(), ...event })); } catch {}
  };
  const server = net.createServer(socket => {
    if (closed || connections.size >= maxConnections) {
      log({ event: 'gateway_connection_rejected', reason: closed ? 'service_closed' : 'connection_limit' });
      socket.destroy();
      return;
    }
    connections.add(socket);
    const connectionId = ++nextConnectionId;
    const decoder = new GameFrameDecoder({ maxPayloadBytes });
    let state = 'initial_verify';
    let challenge;
    log({ event: 'gateway_connection', connectionId });
    socket.setNoDelay(true);
    socket.setTimeout(timeoutMs);
    function stop(reason, destroy = false) {
      if (state === 'stopped') return;
      state = 'stopped';
      log({ event: 'gateway_probe_stop', connectionId, reason });
      if (destroy) socket.destroy();
      else socket.end();
    }
    socket.on('timeout', () => stop('idle_timeout', true));
    socket.on('error', () => stop('transport_error', true));
    socket.on('close', () => {
      connections.delete(socket);
      log({ event: 'gateway_connection_closed', connectionId });
    });
    socket.on('end', () => {
      if (state === 'stopped') return;
      try { decoder.finish(); stop('peer_closed'); }
      catch { stop('truncated_frame'); }
    });
    socket.on('data', chunk => {
      if (state === 'stopped') return;
      let frames;
      try { frames = decoder.push(chunk); }
      catch (error) { stop(error?.code === 'FRAME_TOO_LARGE' ? 'frame_too_large' : 'invalid_frame', true); return; }
      for (const payload of frames) {
        if (state === 'stopped') break;
        if (state === 'initial_verify') {
          if (!isInitialVerifyPayload(payload, INITIAL_VERIFY)) {
            log({ event: 'gateway_initial_frame', connectionId, status: 'unexpected', payloadBytes: payload.length, sha256: digest(payload) });
            stop('initial_verify_not_observed');
            break;
          }
          log({ event: 'gateway_initial_frame', connectionId, status: 'verify', payloadBytes: payload.length });
          challenge = createServerHandshakeChallenge({ profile, flags: configuredFlags, expectedApplicationVersion });
          state = 'client_reply';
          socket.write(encodeGameFrame(challenge.payload));
          log({ event: 'gateway_challenge_sent', connectionId, payloadBytes: challenge.payload.length, profile, targetRuntimeMatchEstablished: false });
          continue;
        }
        if (state === 'client_reply') {
          const result = challenge.verifyReply(payload);
          log({ event: 'gateway_handshake_reply', connectionId, status: result.ok ? 'matched_local_profile' : 'rejected',
            payloadBytes: payload.length, sha256: digest(payload), ...(result.ok ? { profile, targetRuntimeMatchEstablished: false } : { reason: result.reason }) });
          if (!result.ok) { stop('invalid_client_reply'); break; }
          challenge = null;
          state = 'login_sdk';
          continue;
        }
        const metadata = { connectionId, payloadBytes: payload.length, sha256: digest(payload) };
        let message;
        try {
          message = schemas.envelope.decode(payload);
          if (!Object.hasOwn(message, 'type') || schemas.envelope.verify(message)) throw new Error();
        } catch {
          log({ event: 'gateway_application_frame', ...metadata, status: 'invalid_protobuf' });
          stop('invalid_application_envelope');
          break;
        }
        metadata.type = message.type;
        metadata.seq = message.seq;
        if (message.type !== LOGIN_SDK_TYPE) {
          log({ event: 'gateway_application_frame', ...metadata, status: 'unsupported_command' });
          stop('unsupported_application_command');
          break;
        }
        if (!Object.hasOwn(message, 'seq') || message.seq === 0 || !Object.hasOwn(message, 'data') || message.data.length === 0) {
          log({ event: 'gateway_application_frame', ...metadata, status: 'incomplete_login_envelope' });
          stop('invalid_login_envelope');
          break;
        }
        try {
          const login = schemas.login.decode(message.data);
          if (schemas.login.verify(login)) throw new Error();
        } catch {
          log({ event: 'gateway_application_frame', ...metadata, status: 'invalid_login_protobuf' });
          stop('invalid_login_protobuf');
          break;
        }
        log({ event: 'gateway_login_sdk_capture', ...metadata, loginPayloadBytes: message.data.length,
          loginPayloadSha256: digest(message.data), status: 'protobuf_decoded_no_login_response' });
        stop('login_sdk_captured_no_response');
      }
    });
  });
  return Object.freeze({
    listen(port) {
      if (closed || listening) return Promise.reject(new Error('Probe already started or closed'));
      if (!Number.isInteger(port) || port < 0 || port > 65535) return Promise.reject(new TypeError('An explicit port from 0 through 65535 is required'));
      listening = new Promise((resolve, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => {
          server.off('error', onError);
          const address = server.address();
          log({ event: 'gateway_listening', host: HOST, port: address.port, profile, targetRuntimeMatchEstablished: false });
          resolve({ host: HOST, port: address.port });
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, HOST);
      });
      return listening;
    },
    close() {
      if (closing) return closing;
      closed = true;
      closing = (async () => {
        if (listening) await listening.catch(() => {});
        if (server.listening) await new Promise((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve());
          for (const socket of connections) socket.destroy();
        });
      })();
      return closing;
    }
  });
}

if (import.meta.main) {
  let probe;
  try {
    if (process.argv.length !== 3 || process.argv[2] !== '--listen') throw new TypeError();
    function environmentFlag(name) {
      if (!['0', '1'].includes(process.env[name])) throw new TypeError();
      return process.env[name] === '1';
    }
    const port = process.env.GAME_GATEWAY_PORT;
    if (!/^(?:0|[1-9][0-9]{0,4})$/.test(port ?? '') || Number(port) > 65535) throw new TypeError();
    probe = createGameGatewayProbe({ profile: process.env.GAME_AES_PROFILE,
      expectedApplicationVersion: process.env.GAME_GATEWAY_APP_VERSION,
      flags: { encryptC2S: environmentFlag('GAME_GATEWAY_ENCRYPT_C2S'), encryptS2C: environmentFlag('GAME_GATEWAY_ENCRYPT_S2C'),
        signature: environmentFlag('GAME_GATEWAY_SIGNATURE') } });
    await probe.listen(Number(port));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await probe.close(); });
  } catch {
    await probe?.close();
    console.error('Gateway probe is inactive. Use --listen with explicit GAME_AES_PROFILE, GAME_GATEWAY_APP_VERSION, GAME_GATEWAY_PORT, and three GAME_GATEWAY_* encryption/signature flags (currently all 0).');
    process.exitCode = 1;
  }
}
