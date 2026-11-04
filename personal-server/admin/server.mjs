import http from 'node:http';
import fs from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const assets = new Map([
  ['/', ['index.html', 'text/html;charset=utf-8']],
  ['/admin.js', ['admin.js', 'text/javascript;charset=utf-8']],
  ['/pending-request.js', ['pending-request.js', 'text/javascript;charset=utf-8']],
  ['/admin.css', ['admin.css', 'text/css;charset=utf-8']]
]);

export function createAdminService({ wallet, mail, voucher, token = randomBytes(32).toString('hex') }) {
  const server = http.createServer(async (req, res) => {
    const send = (status, value) => {
      if (res.headersSent) return;
      res.writeHead(status, { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(value));
    };
    try {
      const host = req.headers.host;
      if (!/^127[.]0[.]0[.]1:[0-9]+$/.test(host ?? '')) return send(403, { error: 'Invalid host' });
      const url = new URL(req.url, 'http://' + host);
      if (req.method === 'GET' && assets.has(url.pathname)) {
        const [file, type] = assets.get(url.pathname);
        const body = fs.readFileSync(new URL(file, import.meta.url));
        res.writeHead(200, {
          'Content-Type': type, 'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'",
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(body);
        return;
      }
      const received = Buffer.from(req.headers.authorization?.replace(/^Bearer /, '') ?? '');
      const expected = Buffer.from(token);
      if (received.length !== expected.length || !timingSafeEqual(received, expected)) return send(401, { error: 'Management key required' });
      if (req.method === 'GET' && url.pathname === '/api/state') {
        const state = wallet.snapshot();
        if (voucher) state.vouchers = voucher.snapshot();
        return send(200, state);
      }
      if (req.method === 'GET' && url.pathname === '/api/vouchers') {
        if (!voucher) return send(503, { error: 'Voucher service is not configured' });
        return send(200, voucher.snapshot());
      }
      if (req.method !== 'POST' || !['/api/credit', '/api/purchase', '/api/vouchers/issue'].includes(url.pathname)) return send(404, { error: 'Not found' });
      if (req.headers.origin && req.headers.origin !== 'http://' + host) return send(403, { error: 'Invalid origin' });
      if (!/^application\/json(?:;|$)/.test(req.headers['content-type'] ?? '')) return send(415, { error: 'JSON required' });
      const parts = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8192) return send(413, { error: 'Request too large' });
        parts.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(parts).toString()); }
      catch { return send(400, { error: 'Invalid JSON' }); }
      if (url.pathname === '/api/vouchers/issue') {
        if (!mail) return send(503, { error: 'Mail service is not configured' });
        return send(200, mail.issueVoucher(input));
      }
      send(200, url.pathname === '/api/credit' ? wallet.credit(input) : wallet.buy(input));
    } catch (error) {
      if (!res.headersSent) send(error.code ? 400 : 500, { error: error.code ? error.message : 'Internal error', code: error.code });
      else res.destroy(error);
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  return {
    token,
    listen(port = 18883) { return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server.address())); }); },
    close() { return new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
  };
}
