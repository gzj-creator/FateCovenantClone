import http from 'node:http';
import fs from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const assets = new Map([
  ['/', ['index.html', 'text/html;charset=utf-8']],
  ['/admin.js', ['admin.js', 'text/javascript;charset=utf-8']],
  ['/pending-request.js', ['pending-request.js', 'text/javascript;charset=utf-8']],
  ['/admin.css', ['admin.css', 'text/css;charset=utf-8']]
]);

export function createAdminService({
  wallet, mail, voucher, activityStore = null, featureOverrides = null,
  activityRuntime = null, scheduler = null,
  token = randomBytes(32).toString('hex')
}) {
  const bad = message => { const error = new Error(message); error.code = 1; throw error; };
  const serverId = value => {
    const id = Number(value ?? 1);
    if (!Number.isSafeInteger(id) || id <= 0) bad('Invalid server ID');
    return id;
  };
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
      if (req.method === 'GET' && url.pathname === '/api/activity') {
        if (!activityStore) return send(503, { error: 'Activity store is not configured' });
        const id = serverId(url.searchParams.get('serverId'));
        return send(200, {
          instances: activityStore.listInstances(id),
          overrides: activityStore.listOverrides(id),
          settlements: activityStore.listSettlements(id)
        });
      }
      if (req.method === 'GET' && url.pathname === '/api/feature/overrides') {
        if (!featureOverrides) return send(503, { error: 'Feature override store is not configured' });
        return send(200, { overrides: featureOverrides.list(serverId(url.searchParams.get('serverId'))) });
      }
      if (req.method === 'GET' && url.pathname === '/api/scheduler') {
        if (!scheduler) return send(503, { error: 'Scheduler is not configured' });
        return send(200, { jobs: scheduler.list() });
      }
      const postPaths = new Set([
        '/api/credit', '/api/purchase', '/api/vouchers/issue',
        '/api/activity/override', '/api/activity/override/revoke', '/api/activity/preview', '/api/activity/tick',
        '/api/feature/override', '/api/feature/override/revoke', '/api/scheduler/run'
      ]);
      if (req.method !== 'POST' || !postPaths.has(url.pathname)) return send(404, { error: 'Not found' });
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
      if (url.pathname === '/api/activity/override') {
        if (!activityStore) return send(503, { error: 'Activity store is not configured' });
        if (['close_early', 'force_open'].includes(input.kind) && input.confirm !== true) bad('This override requires confirm=true');
        return send(200, { id: activityStore.recordOverride({ ...input, serverId: serverId(input.serverId), operator: input.operator ?? 'admin' }) });
      }
      if (url.pathname === '/api/activity/preview') {
        if (!activityStore || !activityRuntime) return send(503, { error: 'Activity runtime is not configured' });
        const id = serverId(input.serverId), actId = Number(input.actId);
        if (!Number.isSafeInteger(actId) || actId <= 0) bad('Invalid activity ID');
        const row = activityStore.instance(id, actId);
        const window = row ? { start: Number(row.open_at ?? row.preview_at), end: Number(row.show_until ?? row.close_at) } : null;
        return send(200, {
          before: row?.stage ?? null,
          after: activityRuntime.evaluate(actId, Math.floor(Date.now() / 1000), {
            window,
            override: { kind: input.kind, startAt: input.startAt, endAt: input.endAt, conditions: input.conditions ?? [] }
          })
        });
      }
      if (url.pathname === '/api/activity/override/revoke') {
        if (!activityStore) return send(503, { error: 'Activity store is not configured' });
        const id = Number(input.id);
        if (!Number.isSafeInteger(id) || id <= 0) bad('Invalid override ID');
        activityStore.revokeOverride(id, input.operator ?? 'admin', input.reason ?? '');
        return send(200, { revoked: id });
      }
      if (url.pathname === '/api/activity/tick') {
        if (!activityRuntime) return send(503, { error: 'Activity runtime is not configured' });
        return send(200, { changes: activityRuntime.tick() });
      }
      if (url.pathname === '/api/feature/override') {
        if (!featureOverrides) return send(503, { error: 'Feature override store is not configured' });
        return send(200, { id: featureOverrides.set({ ...input, serverId: serverId(input.serverId), operator: input.operator ?? 'admin' }) });
      }
      if (url.pathname === '/api/feature/override/revoke') {
        if (!featureOverrides) return send(503, { error: 'Feature override store is not configured' });
        const id = Number(input.id);
        if (!Number.isSafeInteger(id) || id <= 0) bad('Invalid override ID');
        featureOverrides.revoke(id, input.operator ?? 'admin', input.reason ?? '');
        return send(200, { revoked: id });
      }
      if (url.pathname === '/api/scheduler/run') {
        if (!scheduler) return send(503, { error: 'Scheduler is not configured' });
        return send(200, { processed: scheduler.runDue(job => {
          if (job.key === 'activity.tick' && activityRuntime) {
            activityRuntime.tick();
            return { nextDueAt: Math.floor(Date.now() / 1000) + 60 };
          }
          return undefined;
        }) });
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
    listen(port = 18883, host = '127.0.0.1') {
      if (typeof host !== 'string' || host.length === 0) return Promise.reject(new TypeError('Invalid host'));
      return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => resolve(server.address())); });
    },
    close() { return new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
  };
}
