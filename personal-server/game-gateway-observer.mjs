import net from 'node:net';
import { createHash } from 'node:crypto';
import { GameFrameDecoder, isInitialVerifyPayload } from './game-framing.mjs';

const LOOPBACK = '127.0.0.1';
const INITIAL_FRAME_LIMIT = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 5000;

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(name + ' must be a positive integer');
}

function payloadDigest(payload) {
  return createHash('sha256').update(payload).digest('hex');
}

export function createGameGatewayObserver({ port = 0, timeoutMs = DEFAULT_TIMEOUT_MS, logger = event => console.log(JSON.stringify(event)) } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new TypeError('port must be an integer from 0 through 65535');
  positiveInteger(timeoutMs, 'timeoutMs');
  if (typeof logger !== 'function') throw new TypeError('logger must be a function');
  let closed = false;
  let listening;
  let closing;
  const log = event => { try { logger(Object.freeze(event)); } catch {} };
  const server = net.createServer(socket => {
    const decoder = new GameFrameDecoder({ maxPayloadBytes: INITIAL_FRAME_LIMIT });
    let classified = false;
    log({ event: 'gateway_connection', status: 'accepted' });
    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => {
      if (!classified) log({ event: 'gateway_first_frame', status: 'timeout' });
      socket.destroy();
    });
    socket.on('error', () => {});
    socket.on('data', chunk => {
      if (classified) return;
      try {
        const frames = decoder.push(chunk);
        if (frames.length === 0) return;
        classified = true;
        const payload = frames[0];
        if (isInitialVerifyPayload(payload, Buffer.from('verify', 'utf8'))) {
          log({ event: 'gateway_first_frame', status: 'initial_verify_received', payloadBytes: payload.length });
          log({ event: 'gateway_experiment_stop', reason: 'challenge_not_implemented' });
        } else {
          log({ event: 'gateway_first_frame', status: 'unexpected_payload', payloadBytes: payload.length, sha256: payloadDigest(payload) });
          log({ event: 'gateway_experiment_stop', reason: 'initial_verify_not_observed' });
        }
        socket.end();
      } catch (error) {
        classified = true;
        log({ event: 'gateway_first_frame', status: error?.code === 'FRAME_TOO_LARGE' ? 'oversize' : 'invalid' });
        log({ event: 'gateway_experiment_stop', reason: 'invalid_frame' });
        socket.destroy();
      }
    });
    socket.on('end', () => {
      if (!classified) {
        try { decoder.finish(); }
        catch { log({ event: 'gateway_first_frame', status: 'truncated' }); }
      }
    });
  });
  return Object.freeze({
    listen() {
      if (closed || listening) return Promise.reject(new Error('Observer already started or closed'));
      listening = new Promise((resolve, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => {
          server.off('error', onError);
          const address = server.address();
          log({ event: 'gateway_listening', host: LOOPBACK, port: address.port });
          resolve({ host: LOOPBACK, port: address.port });
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, LOOPBACK);
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
        });
      })();
      return closing;
    }
  });
}

if (import.meta.main) {
  let observer;
  try {
    const rawPort = process.env.GAME_GATEWAY_PORT ?? '19090';
    if (!/^(?:0|[1-9][0-9]{0,4})$/.test(rawPort) || Number(rawPort) > 65535) throw new TypeError();
    observer = createGameGatewayObserver({ port: Number(rawPort) });
    await observer.listen();
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await observer.close(); });
  } catch {
    await observer?.close();
    console.error('Gateway observer failed. Check GAME_GATEWAY_PORT (loopback only; 0 through 65535).');
    process.exitCode = 1;
  }
}
