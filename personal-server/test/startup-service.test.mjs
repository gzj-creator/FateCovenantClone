import test from 'node:test';
import assert from 'node:assert/strict';
import { createStartupService } from '../startup-service.mjs';

test('startup serves confirmed version schema over loopback and leaves unknown contracts unimplemented', async () => {
  const events = [];
  const service = createStartupService({ appVersion: '1.55.090365', assetVersion: 364110, logger: event => events.push(event) });
  const address = await service.listen();
  assert.equal(address.address, '127.0.0.1');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const response = await fetch(`${base}/update/res/version_adr.txt?token=private-test`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { version: '1.55.090365.364110', reqAppVer: '1.55.090365' });
    assert.equal((await fetch(`${base}/server_config.txt?token=private-test`)).status, 501);
    assert.equal((await fetch(`${base}/update/res/version_adr.txt`, { method: 'POST', body: 'private-test' })).status, 501);
    assert.ok(!JSON.stringify(events).includes('private-test'));
  } finally { await service.close(); }
});

test('startup requires explicit valid packaged version values', () => {
  for (const options of [{}, { appVersion: '1.2', assetVersion: 1 }, { appVersion: '1.2.3', assetVersion: 0 }, { appVersion: '1.2.3', assetVersion: NaN }]) {
    assert.throws(() => createStartupService(options), TypeError);
  }
});
