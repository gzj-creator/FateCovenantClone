import http from 'node:http';
import { createHash } from 'node:crypto';

export function createStartupService({ appVersion, assetVersion, logger = () => {} }) {
  if (!/^\d+\.\d+\.\d+$/.test(appVersion) || appVersion.split('.').some(v => Number(v) > 0x7fffffff)) throw new TypeError('Explicit app version required');
  if (!Number.isInteger(assetVersion) || assetVersion < 1 || assetVersion > 0x7fffffff) throw new TypeError('Explicit packaged asset version required');
  const version = Buffer.from(JSON.stringify({ version: `${appVersion}.${assetVersion}`, reqAppVer: appVersion }));
  const server = http.createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    const recognized = request.method === 'GET' && path === '/update/res/version_adr.txt';
    const status = recognized ? 200 : 501;
    request.resume();
    response.writeHead(status, { 'Content-Type': recognized ? 'application/json' : 'text/plain', 'Cache-Control': 'no-store', Connection: 'close' });
    response.end(recognized ? version : 'Startup response contract not implemented.');
    logger({ event: 'startup_response', route: recognized ? 'android_version' : 'unknown', status,
      pathSha256: createHash('sha256').update(path).digest('hex') });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  return {
    listen(port = 0) {
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new TypeError('Invalid port');
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server.address()));
      });
    },
    close() { return new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
  };
}

if (import.meta.main) {
  if (process.argv[2] !== '--listen') throw new Error('Explicit --listen required');
  const service = createStartupService({ appVersion: process.env.LOCAL_APP_VERSION, assetVersion: Number(process.env.LOCAL_ASSET_VERSION),
    logger: event => console.log(JSON.stringify({ recordedAtUtc: new Date().toISOString(), ...event })) });
  await service.listen(18882);
  console.log(JSON.stringify({ event: 'startup_listening', host: '127.0.0.1', port: 18882 }));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => service.close());
}
