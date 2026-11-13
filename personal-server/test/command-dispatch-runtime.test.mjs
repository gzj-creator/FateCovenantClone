import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('checked-in dispatch audit matches live supports and gateway routing', { timeout: 30000 }, () => {
  const result = spawnSync(process.execPath, ['scripts/audit-command-dispatch.mjs', '--check'], {
    cwd: serverRoot,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout.trim()), {
    total: 1407,
    serviceRoute: 1316,
    gatewayRoute: 18,
    multiOwner: 6,
    unrouted: 67,
    requestEncodingMismatch: 172,
    requestEncodingUnverified: 986,
    responseRuntimeUnverified: 1407,
    responseSchemaMissing: 223
  });
});
