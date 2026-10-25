import http from 'node:http';
import { createHash } from 'node:crypto';

const KNOWN_ROUTES = new Map([
  ['/user/login', 'sdk_login'],
  ['/user/tokenVerifySdk', 'sdk_token_verify'],
  ['/user/gtOneLogin', 'sdk_one_login'],
  ['/user/thirdLogin', 'sdk_third_login'],
  ['/user/phoneLogin', 'sdk_phone_login'],
  ['/sdk/tracker/log', 'sdk_tracker'],
  ['/server_list', 'server_list'],
  ['/server_config.txt', 'server_config'],
  ['/update/res/version_adr.txt', 'android_version'],
  ['/update/res/server_config.txt', 'server_config']
]);

// This observer never forwards requests or returns an invented success payload.
export async function observeLocalRequests(ports, logger = event => console.log(JSON.stringify(event)), targetPackage = 'com.jzyx.my') {
  if (!['com.jzyx.my', 'com.jzyx.ps'].includes(targetPackage)) throw new TypeError('Unsupported test package');
  const servers = [];
  const log = event => logger({ recordedAtUtc: new Date().toISOString(), ...event });
  try {
    for (const port of ports) {
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new TypeError('Explicit local port required');
      const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, 'http://127.0.0.1');
        const route = KNOWN_ROUTES.get(url.pathname) ?? (/\/banner\/.+banner[.]json$/.test(url.pathname) ? 'sdk_banner' : 'unknown');
        let bodyBytes = 0;
        let bodyTooLarge = false;
        for await (const chunk of request) {
          bodyBytes += chunk.length;
          if (bodyBytes > 16384) { bodyTooLarge = true; break; }
        }
        log({ event: 'local_http_observed', port, method: request.method, route, bodyBytes,
          pathSha256: createHash('sha256').update(url.pathname).digest('hex'),
          packageMatchesTarget: request.headers.package === targetPackage,
          packageVersionMatchesTarget: request.headers['package-version'] === '1.55.090365',
          contentType: request.headers['content-type']?.split(';')[0] ?? null,
          status: bodyTooLarge ? 413 : 501 });
        response.writeHead(bodyTooLarge ? 413 : 501, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', Connection: 'close' });
        response.end('Local observation only; response contract not configured.');
      });
      servers.push(server);
      server.requestTimeout = 5000;
      server.headersTimeout = 5000;
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
      });
      log({ event: 'local_http_observer_listening', port, host: '127.0.0.1' });
    }
  } catch (error) {
    for (const server of servers) { server.closeAllConnections(); server.close(); }
    throw error;
  }
  return async () => {
    await Promise.all(servers.map(server => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); })));
  };
}

if (import.meta.main) {
  if (process.argv[2] !== '--listen') throw new Error('Explicit --listen required');
  const ports = (process.env.LOCAL_OBSERVER_PORTS ?? '18880,18881,18882').split(',').map(Number);
  const close = await observeLocalRequests(ports, undefined, process.env.LOCAL_TARGET_PACKAGE ?? 'com.jzyx.my');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, close);
}
