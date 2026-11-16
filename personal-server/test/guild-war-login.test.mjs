import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGameCodec } from '../protocol/game-codec.mjs';
import {
  createGuildActivityService,
  GUILD_EXPEDITION_LOGIN_MODULE_ID,
  GUILD_EXPLORE_LOGIN_MODULE_ID,
  GUILD_EXPLORE_TRIAL_LOGIN_MODULE_ID,
  GUILD_VOTE_LOGIN_MODULE_ID,
  GUILD_WAR_LOGIN_MODULE_ID
} from '../game/guild-activity-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const moduleTablePath = new URL('./fixtures/ModuleTable.data.lua.json', import.meta.url);

function findModuleRow(value, moduleId, modulePath, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    if (Number(value[1]) === moduleId && value[6] === modulePath) return value;
    for (const item of value) {
      const found = findModuleRow(item, moduleId, modulePath, seen);
      if (found) return found;
    }
    return null;
  }
  for (const item of Object.values(value)) {
    const found = findModuleRow(item, moduleId, modulePath, seen);
    if (found) return found;
  }
  return null;
}

test('ModuleTable binds GuildWarMgr to 24047', () => {
  const row = findModuleRow(JSON.parse(fs.readFileSync(moduleTablePath, 'utf8')), GUILD_WAR_LOGIN_MODULE_ID, 'project/guild_war');
  assert.ok(row, 'project/guild_war row is present');
  assert.equal(Number(row[1]), GUILD_WAR_LOGIN_MODULE_ID);
  assert.equal(row[6], 'project/guild_war');
});

test('guild war login provides four non-empty neutral binaries that the client can index', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guild-war-login-' });
  const service = createGuildActivityService({
    store: fixture.store,
    codec,
    serverOpenedAt: 1794690000
  });
  const payloads = service.loginPayloads();

  assert.equal(payloads.length, 4);
  assert.ok(payloads.every(payload => Buffer.isBuffer(payload)));
  const entry = codec.unpack('pb_guild_war_entry', payloads[0]);
  const data = codec.unpack('pb_guild_war_data', payloads[1]);
  const record = codec.unpack('pb_guild_war_record', payloads[2]);
  const person = codec.unpack('pb_guild_war_person', payloads[3]);
  assert.deepEqual(entry.area_list, []);
  assert.equal(entry.start_time, '1');
  assert.equal(data.war_list[0].is_over, true);
  assert.deepEqual(data.war_list[0].base_list, []);
  assert.deepEqual(record.settle_list[0].area_list, []);
  assert.deepEqual(person.guess_list, []);
  assert.deepEqual(person.stat_list, []);
  assert.deepEqual(person.add_stat_list, []);
  assert.equal(person.guess_area, 1);
  assert.equal(payloads.every(payload => payload.length > 0), true);
});

test('guild explore, trial, vote and expedition modules decode to neutral login objects', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guild-extra-login-' });
  const service = createGuildActivityService({
    store: fixture.store,
    codec,
    serverOpenedAt: 1794690000
  });
  const modules = await service.loginModulePayloads();

  assert.deepEqual([...modules.keys()], [
    GUILD_EXPLORE_LOGIN_MODULE_ID,
    GUILD_EXPLORE_TRIAL_LOGIN_MODULE_ID,
    GUILD_VOTE_LOGIN_MODULE_ID,
    GUILD_EXPEDITION_LOGIN_MODULE_ID
  ]);
  assert.equal([...modules.values()].flat().every(payload => Buffer.isBuffer(payload)), true);

  const explore = codec.unpack('pb_guild_explore_login', modules.get(GUILD_EXPLORE_LOGIN_MODULE_ID)[0]);
  const exploreGuild = codec.unpack('pb_guild_explore_guild', Buffer.from(explore.explore_guild_bin, 'base64'));
  const explorePerson = codec.unpack('pb_guild_explore_person', Buffer.from(explore.explore_person_bin, 'base64'));
  const taskData = explorePerson.task_data;
  assert.equal(exploreGuild.boss.end_time, '1');
  assert.equal(explorePerson.map_person.refresh_sec, '1');
  for (const bits of [
    taskData.person_task,
    taskData.guild_glory_task,
    taskData.person_glory_task,
    taskData.guide_task
  ]) {
    const raw = Buffer.from(bits, 'base64');
    assert.deepEqual(raw, Buffer.alloc(1), 'task bit blocks are non-nil raw bytes');
    assert.notEqual(raw[0], 0x83, 'task bit blocks do not contain an ETF wrapper');
  }

  const trial = codec.unpack('pb_guild_explore_trial', modules.get(GUILD_EXPLORE_TRIAL_LOGIN_MODULE_ID)[0]);
  const trialPerson = codec.unpack('pb_guild_explore_trial_person', modules.get(GUILD_EXPLORE_TRIAL_LOGIN_MODULE_ID)[1]);
  assert.equal(trial.end_time, '1');
  assert.ok(trialPerson.atk_info, 'atk_info is a decoded object');

  const vote = codec.unpack('pb_guild_vote_list', modules.get(GUILD_VOTE_LOGIN_MODULE_ID)[0]);
  assert.deepEqual(vote.vote_list, []);

  const expedition = codec.unpack('pb_guild_expedition_login', modules.get(GUILD_EXPEDITION_LOGIN_MODULE_ID)[0]);
  assert.ok(expedition.server_info, 'server_info is a decoded object');
  assert.equal(expedition.server_info.version, '1');
  assert.equal(expedition.server_info.version_start_time, '1');
  assert.equal(expedition.server_info.version_end_time, '1');
  assert.ok(expedition.role_info, 'role_info is a decoded object');
  assert.ok(expedition.guild_info, 'guild_info is a decoded object');
});
