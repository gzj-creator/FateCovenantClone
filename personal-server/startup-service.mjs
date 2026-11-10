import fs from 'node:fs';
import http from 'node:http';
import { createHash } from 'node:crypto';

export function createStartupService({ appVersion, assetVersion, updateManifest, logger = () => {} }) {
  if (!/^\d+\.\d+\.\d+$/.test(appVersion) || appVersion.split('.').some(v => Number(v) > 0x7fffffff)) throw new TypeError('Explicit app version required');
  if (!Number.isInteger(assetVersion) || assetVersion < 1 || assetVersion > 0x7fffffff) throw new TypeError('Explicit packaged asset version required');
  if (updateManifest !== undefined && (!Buffer.isBuffer(updateManifest) || updateManifest.length === 0)) throw new TypeError('Update manifest must be a non-empty Buffer');
  const version = Buffer.from(JSON.stringify({ version: `${appVersion}.${assetVersion}`, reqAppVer: appVersion }));
  const manifestRoute = `/update/res/Android/FixAll/update.txt_${assetVersion}`;
  const server = http.createServer((request, response) => {
    let path;
    try {
      path = new URL(request.url, 'http://127.0.0.1').pathname;
    } catch {
      request.resume();
      const body = Buffer.from('Invalid request target.');
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store', Connection: 'close' });
      response.end(body);
      logger({ event: 'startup_response', route: 'invalid_request_target', status: 400 });
      return;
    }
    const versionRequest = request.method === 'GET' && path === '/update/res/version_adr.txt';
    const manifestRequest = request.method === 'GET' && path === manifestRoute && updateManifest !== undefined;
    const recognized = versionRequest || manifestRequest;
    const status = recognized ? 200 : 501;
    const route = versionRequest ? 'android_version' : manifestRequest ? 'android_update_manifest' : 'unknown';
    const body = versionRequest ? version : manifestRequest ? updateManifest : Buffer.from('Startup response contract not implemented.');
    request.resume();
    response.writeHead(status, { 'Content-Type': versionRequest ? 'application/json' : 'text/plain; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store', Connection: 'close' });
    response.end(body);
    logger({ event: 'startup_response', route, status,
      pathSha256: createHash('sha256').update(path).digest('hex') });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  return {
    listen(port = 0, host = '127.0.0.1') {
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new TypeError('Invalid port');
      if (typeof host !== 'string' || host.length === 0) throw new TypeError('Invalid host');
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => resolve(server.address()));
      });
    },
    close() { return new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
  };
}

if (import.meta.main) {
  if (process.argv[2] !== '--listen') throw new Error('Explicit --listen required');
  const updateManifest = process.env.LOCAL_UPDATE_MANIFEST ? fs.readFileSync(process.env.LOCAL_UPDATE_MANIFEST) : undefined;
  const service = createStartupService({ appVersion: process.env.LOCAL_APP_VERSION, assetVersion: Number(process.env.LOCAL_ASSET_VERSION), updateManifest,
    logger: event => console.log(JSON.stringify({ recordedAtUtc: new Date().toISOString(), ...event })) });
  await service.listen(18882);
  console.log(JSON.stringify({ event: 'startup_listening', host: '127.0.0.1', port: 18882 }));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => service.close());
}
