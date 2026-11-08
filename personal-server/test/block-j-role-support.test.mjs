import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createRoleService } from '../game/role-service.mjs';
import { createStoryService } from '../game/story-service.mjs';
import { createCdkeyService } from '../game/cdkey-service.mjs';
import { createSkinService } from '../game/skin-service.mjs';
import { createActFrameService } from '../game/act-frame-service.mjs';

const codec = createGameCodec();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const template = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
const NOW = 1700000000000;

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-block-j-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000, modules: template,
    rolePb: codec.pack('to_client_role_info', {
      level: 3, nick_name: Buffer.from('Local Test'), create_time: 1700000000,
      figure_simple_info: { sex: 1, head_info: { tid: '0' }, frame_info: { tid: '0' }, title_info: { tid: '0' } }
    }).toString('base64'),
    guides: {}, lineups: null
  }));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const tables = readGameTables();
  const calendar = createActivityCalendar({ tables, serverOpenedAt: store.serverOpenedAt, now: () => NOW });
  return {
    get store() { return store; },
    tables,
    calendar,
    role: () => createRoleService({ store, codec, tables, heroTables: readHeroTables(), attributeTables: readAttributeTables(), now: () => NOW, gmEnabled: () => true }),
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

test('role profile commands persist through SQLite reopen', t => {
  const env = setup(t);
  const role = env.role();
  return role.execute(1301, { etf: Buffer.from('New Hero') }).then(async name => {
    assert.equal(name.value.name, 'New Hero');
    assert.equal(name.value.times, 1);
    const sundry = await role.execute(104, { etf: [10, 7] });
    assert.equal(sundry.value.tid, 10);
    const reward = await role.execute(1303, {});
    assert.ok(reward.value.rewards > 0);
    assert.equal(reward.value.level, 3);
    await assert.rejects(() => role.execute(1303, {}), error => error.code === 310);
    const list = await role.execute(106, {});
    assert.equal(list.value.roles, 1);
    env.reopen();
    const profile = env.store.read().role;
    assert.equal(Buffer.from(profile.nick_name, 'base64').toString('utf8'), 'New Hero');
    assert.equal(profile.level_reward_record, 3);
    const row = env.store.inspect(db => db.prepare('SELECT sundry_json FROM role_profile_extra WHERE role_id=100001').get());
    assert.deepEqual(JSON.parse(row.sundry_json)['10'], { value_int: 0, value_pb: '', time_day: Math.floor(NOW / 1000 / 86400) });
  });
});

test('red dot, story, cdkey and client log commands commit authoritative rows', async t => {
  const env = setup(t);
  const role = env.role();
  const story = createStoryService({ store: env.store, now: () => NOW });
  const cdkey = createCdkeyService({ store: env.store, codec, tables: env.tables, now: () => NOW, codes: { codes: { WELCOME: { bag_id: 'w1', awards: [] } } } });
  await role.execute(39001, { request: { to_add_or_change_list: [{ path_bin: 'root/red', state: true, show_count: 2, extra: '' }], to_del_list: [] } });
  await story.execute(304, { etf: [2001, 2002] });
  const claimed = await cdkey.execute(40000, { etf: Buffer.from('welcome') });
  assert.equal(claimed.value.code, 'WELCOME');
  await assert.rejects(() => cdkey.execute(40000, { etf: Buffer.from('WELCOME') }), error => error.code === 310);
  await role.execute(78901, { etf: Buffer.from('client diagnostics') });
  const counts = env.store.inspect(db => ({
    red: db.prepare('SELECT state,show_count FROM role_red_dots WHERE role_id=100001').get(),
    stories: db.prepare('SELECT COUNT(*) AS n FROM role_stories WHERE role_id=100001').get().n,
    codes: db.prepare('SELECT COUNT(*) AS n FROM cdkey_redemptions WHERE role_id=100001').get().n,
    logs: db.prepare('SELECT COUNT(*) AS n FROM client_diagnostic_logs WHERE role_id=100001').get().n
  }));
  assert.equal(counts.red.state, 1);
  assert.equal(counts.red.show_count, 2);
  assert.equal(counts.stories, 2);
  assert.equal(counts.codes, 1);
  assert.equal(counts.logs, 1);
});

test('skin ownership gates wear, exchange and increase', async t => {
  const env = setup(t);
  const skin = createSkinService({ store: env.store, codec, tables: env.tables, now: () => NOW });
  const hero = env.store.read().heroInfo.hero_list[0];
  await assert.rejects(() => skin.execute(76003, { request: { hero_uid: String(hero.uid), skin_tid: 5001 } }), error => error.code === 420);
  await skin.execute(76004, { etf: 5001 });
  const exchange = await skin.execute(76005, {});
  assert.equal(exchange.value.skinTid, 5001);
  const worn = await skin.execute(76003, { request: { hero_uid: String(hero.uid), skin_tid: 5001 } });
  assert.equal(worn.data.length > 0, true);
  const increased = await skin.execute(76009, { etf: 5001 });
  assert.equal(increased.value.level, 1);
  const handbook = await skin.execute(76007, {});
  assert.equal(handbook.value.activated, 1);
  env.reopen();
  const stored = env.store.inspect(db => db.prepare('SELECT increase_level FROM role_skins WHERE role_id=100001 AND skin_tid=5001').get());
  assert.equal(stored.increase_level, 1);
});

test('activity frame reconciliation is authoritative and idempotent', async t => {
  const env = setup(t);
  const actFrame = createActFrameService({ store: env.store, codec, calendar: env.calendar, tables: env.tables, now: () => NOW, gmEnabled: () => true });
  const list = await actFrame.execute(53006, {});
  assert.ok(list.value.activities > 0);
  const first = await actFrame.execute(53001, { etf: [0, 50] });
  assert.ok(first.value.changes > 0);
  const second = await actFrame.execute(53001, { etf: [0, 50] });
  assert.equal(second.value.changes, 0);
  const stages = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM role_activity_stages WHERE role_id=100001').get().n);
  assert.equal(stages > 0, true);
});
