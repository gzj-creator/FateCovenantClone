import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPublicServerConfig, parsePublicServerConfig } from '../config/server-config.mjs';

function config(overrides = {}) {
  return {
    listen: { publicHost: '0.0.0.0', adminHost: '127.0.0.1' },
    ports: { sdk: 18880, list: 18881, startup: 18882, game: 19090, admin: 18883 },
    publicSdkUrl: 'http://203.0.113.10:18880',
    activeServerId: 2,
    servers: [{
      id: 2,
      name: 'Realm 2',
      roleId: 100002,
      roleName: 'Adventurer',
      launchProfileId: 'realm-2-launch',
      launchAt: '2026-11-10T05:00:00+08:00',
      extranetIp: '203.0.113.10:19090'
    }],
    ...overrides
  };
}

test('public server config resolves the active launch profile', () => {
  const parsed = parsePublicServerConfig(config());
  assert.equal(parsed.activeServerId, 2);
  assert.equal(parsed.activeServer.launchProfileId, 'realm-2-launch');
  assert.equal(parsed.activeServer.launchAt, 1794258000);
  assert.equal(parsed.activeServer.roleId, 100002);
});

test('public server config rejects a missing active server', () => {
  assert.throws(() => parsePublicServerConfig(config({ activeServerId: 3 })), /is not present/);
});

test('the checked-in public config targets the new realm without changing its advertised address', () => {
  const parsed = loadPublicServerConfig();
  assert.equal(parsed.activeServer.id, 2);
  assert.equal(parsed.activeServer.name, '命运二服');
  assert.equal(parsed.activeServer.extranetIp, '140.143.142.251:19090');
  assert.equal(parsed.activeServer.launchAt, 1794326400);
});
