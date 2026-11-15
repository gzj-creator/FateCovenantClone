import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGameCodec } from '../protocol/game-codec.mjs';
import {
  createGuildActivityService,
  GUILD_WAR_LOGIN_MODULE_ID
} from '../game/guild-activity-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const moduleTablePath = new URL('./fixtures/ModuleTable.data.lua.json', import.meta.url);

function findGuildWarRow(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    if (Number(value[1]) === GUILD_WAR_LOGIN_MODULE_ID && value[6] === 'project/guild_war') return value;
    for (const item of value) {
      const found = findGuildWarRow(item, seen);
      if (found) return found;
    }
    return null;
  }
  for (const item of Object.values(value)) {
    const found = findGuildWarRow(item, seen);
    if (found) return found;
  }
  return null;
}

test('ModuleTable binds GuildWarMgr to 24047', () => {
  const row = findGuildWarRow(JSON.parse(fs.readFileSync(moduleTablePath, 'utf8')));
  assert.ok(row, 'project/guild_war row is present');
  assert.equal(Number(row[1]), GUILD_WAR_LOGIN_MODULE_ID);
  assert.equal(row[6], 'project/guild_war');
});

test('guild war login provides the four empty binaries expected by GuildWarMgr', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guild-war-login-' });
  const service = createGuildActivityService({
    store: fixture.store,
    codec,
    serverOpenedAt: 1794690000
  });
  const payloads = service.loginPayloads();

  assert.equal(payloads.length, 4);
  assert.ok(payloads.every(payload => Buffer.isBuffer(payload)));
  assert.deepEqual(codec.unpack('pb_guild_war_entry', payloads[0]).area_list, []);
  assert.deepEqual(codec.unpack('pb_guild_war_data', payloads[1]).war_list, []);
  assert.deepEqual(codec.unpack('pb_guild_war_record', payloads[2]).settle_list, []);
  const person = codec.unpack('pb_guild_war_person', payloads[3]);
  assert.deepEqual(person.guess_list, []);
  assert.deepEqual(person.stat_list, []);
  assert.deepEqual(person.add_stat_list, []);
  assert.equal(payloads.every(payload => payload.length === 0), true);
});
