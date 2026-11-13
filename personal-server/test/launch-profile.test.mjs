import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { rawBinary, createGameCodec } from '../protocol/game-codec.mjs';
import { ACTIVITY_LOGIN_MODULE_ID, relocateLaunchActivityWindows } from '../game/launch-profile.mjs';
import { createActivityCalendar, serverDayNumber } from '../game/activity-calendar.mjs';
import { createLocalGame, decodeEtf } from '../local-game.mjs';
import { mergeRelicLoginContainer, RELIC_ACTIVITY_LOGIN_MODULE_ID } from '../game/relic-divine-login.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';

const ANCHOR = 1792789200;
const OPENED_AT = 1794258000;
const ACTIVITY_REFERENCE_OPENED_AT = 1790784000;
const PUBLIC_SERVER_OPENED_AT = 1794326400;
const OFFSET = OPENED_AT - ANCHOR;
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url), 'utf8'));
const template = capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded;
const codec = createGameCodec();

function decodeActivity(entry) {
  return codec.unpack('pb_act_login', rawBinary(entry));
}

function decodeActFrame(entry) {
  return mergeRelicLoginContainer({ codec, entry });
}

test('launch relocation shifts module 92 and 183 absolute windows by the configured offset', () => {
  const source = new Map(template[2].value);
  const beforeActivity = decodeActivity(source.get(ACTIVITY_LOGIN_MODULE_ID));
  const beforeFrame = decodeActFrame(source.get(RELIC_ACTIVITY_LOGIN_MODULE_ID));
  const result = relocateLaunchActivityWindows({
    modules: source,
    codec,
    activityWindowAnchor: ANCHOR,
    serverOpenedAt: OPENED_AT
  });
  assert.equal(result.offsetSeconds, OFFSET);
  assert.equal(result.offsetSeconds, 17 * 86400);
  assert.equal(result.counts.customWindows, beforeActivity.act_custom_list.length);
  assert.ok(result.counts.activityStates > 0);
  assert.equal(result.counts.playerRows, beforeFrame.player.data_list.length);
  assert.equal(result.counts.serverRows, beforeFrame.server.act_stage_list.length);

  const afterActivity = decodeActivity(result.modules.get(ACTIVITY_LOGIN_MODULE_ID));
  const beforeCustom = new Map(beforeActivity.act_custom_list.map(row => [Number(row.act_id), row]));
  for (const row of afterActivity.act_custom_list) {
    const original = beforeCustom.get(Number(row.act_id));
    assert.equal(Number(row.start_time), Number(original.start_time) + (Number(original.start_time) > 0 ? OFFSET : 0));
    assert.equal(Number(row.end_time), Number(original.end_time) + (Number(original.end_time) > 0 ? OFFSET : 0));
  }
  const beforeHistory = new Map();
  for (const state of [
    ...beforeActivity.act_list.map(row => row.state_data),
    ...beforeActivity.act_parallel_list.flatMap(group => group.states_data ?? [])
  ]) beforeHistory.set(Number(state.act_id), state.history_time);
  for (const state of [
    ...afterActivity.act_list.map(row => row.state_data),
    ...afterActivity.act_parallel_list.flatMap(group => group.states_data ?? [])
  ]) {
    const originalHistory = beforeHistory.get(Number(state.act_id)) ?? [];
    for (let index = 0; index < (state.history_time ?? []).length; index++) {
      assert.equal(Number(state.history_time[index].enter_time), Number(originalHistory[index].enter_time) + OFFSET);
    }
  }

  const afterFrame = decodeActFrame(result.modules.get(RELIC_ACTIVITY_LOGIN_MODULE_ID));
  const beforePlayer = new Map(beforeFrame.player.data_list.map(row => [Number(row.act_stage?.act_id), row.act_stage]));
  for (const row of afterFrame.player.data_list) {
    const stage = row.act_stage;
    const original = beforePlayer.get(Number(stage?.act_id));
    assert.equal(Number(stage.start_time), Number(original.start_time) + OFFSET);
    assert.equal(Number(stage.end_time), Number(original.end_time) + OFFSET);
    for (let index = 0; index < (stage.history_time ?? []).length; index++) {
      assert.equal(Number(stage.history_time[index].enter_time), Number(original.history_time[index].enter_time) + OFFSET);
    }
  }
  const beforeServer = new Map(beforeFrame.server.act_stage_list.map(row => [Number(row.act_id), row]));
  for (const row of afterFrame.server.act_stage_list) {
    const original = beforeServer.get(Number(row.act_id));
    assert.equal(Number(row.start_time), Number(original.start_time) + OFFSET);
    assert.equal(Number(row.end_time), Number(original.end_time) + OFFSET);
    assert.equal(row.stage_time_list.length, original.stage_time_list.length);
    for (let index = 0; index < row.stage_time_list.length; index++) {
      assert.equal(Number(row.stage_time_list[index].start_time), Number(original.stage_time_list[index].start_time) + OFFSET);
      assert.equal(Number(row.stage_time_list[index].end_time), Number(original.stage_time_list[index].end_time) + OFFSET);
    }
  }
});

test('launch relocation rejects an anchor later than the opening time', () => {
  assert.throws(() => relocateLaunchActivityWindows({
    modules: new Map(template[2].value),
    codec,
    activityWindowAnchor: OPENED_AT,
    serverOpenedAt: ANCHOR
  }), /must not be later/);
});

test('the rebased login template follows static relative days instead of captured all-open custom windows', () => {
  const modules = relocateLaunchActivityWindows({
    modules: new Map(template[2].value),
    codec,
    activityWindowAnchor: ANCHOR,
    serverOpenedAt: OPENED_AT
  }).modules;
  const native = decodeActivity(modules.get(ACTIVITY_LOGIN_MODULE_ID));
  const tables = readGameTables();
  const idsAt = (dayOffset, at = OPENED_AT + dayOffset * 86400) => {
    const activity = structuredClone(native);
    const calendar = createActivityCalendar({ tables, serverOpenedAt: OPENED_AT, mode: 'schedule', now: () => at * 1000 });
    calendar.applyLoginSchedule(activity, at);
    return new Set([
      ...(activity.act_list ?? []).map(row => Number(row.state_data?.act_id)),
      ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(row => Number(row.act_id)))
    ]);
  };

  assert.equal(serverDayNumber(OPENED_AT, OPENED_AT), 1);
  assert.equal(serverDayNumber(OPENED_AT, OPENED_AT + 86400), 2);
  assert.equal(serverDayNumber(OPENED_AT, OPENED_AT + 6 * 86400), 7);
  assert.equal(serverDayNumber(OPENED_AT, OPENED_AT + 7 * 86400), 8);
  assert.equal(idsAt(0).has(89001), true);
  assert.equal(idsAt(6).has(89001), true);
  assert.equal(idsAt(7).has(89001), false);
  assert.equal(idsAt(9, OPENED_AT + 9 * 86400 - 1).has(12015), false);
  assert.equal(idsAt(9).has(12015), true);
});

test('a persistent database refuses a different launch profile before migrations can reinterpret it', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-launch-profile-'));
  const databasePath = path.join(directory, 'game.sqlite');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const selected = Object.freeze({
    roleId: 100002,
    serverId: 2,
    serverName: 'Realm 2',
    roleName: 'Adventurer',
    launchProfileId: 'realm-2-launch',
    activityWindowAnchor: ANCHOR,
    serverOpenedAt: OPENED_AT
  });
  const seed = () => ({
    ...createSeed(codec, { roleId: selected.roleId, serverId: selected.serverId }),
    ...selected
  });
  const first = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT, launchProfile: selected });
  const secondary = first.resolveAccount('secondary-account');
  assert.equal(secondary.roleId, selected.roleId + 1);
  first.close();

  const matching = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT, launchProfile: selected });
  assert.equal(matching.roleForAccount('secondary-account'), secondary.roleId);
  matching.close();

  assert.throws(() => createGameStore({
    databasePath,
    seed,
    codec,
    serverOpenedAt: OPENED_AT,
    launchProfile: { ...selected, roleId: selected.roleId + 9 }
  }), /launch profile mismatch.*roleId/i);

  assert.throws(() => createGameStore({
    databasePath,
    seed,
    codec,
    serverOpenedAt: OPENED_AT + 86400,
    launchProfile: { ...selected, serverOpenedAt: OPENED_AT + 86400 }
  }), /launch profile mismatch.*serverOpenedAt/i);
});

test('an empty public realm creates level-one accounts and survives reopening', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-empty-realm-'));
  const databasePath = path.join(directory, 'game.sqlite');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const selected = Object.freeze({
    roleId: 100004,
    serverId: 3,
    serverName: 'Realm 3',
    roleName: 'Adventurer',
    launchProfileId: 'empty-realm-3-launch',
    activityWindowAnchor: ANCHOR,
    serverOpenedAt: OPENED_AT,
    emptyRealm: true
  });
  const seed = options => createSeed(codec, {
    ...selected,
    roleId: options?.freshAccount ? selected.roleId + 1 : selected.roleId,
    ...options
  });

  const first = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT, launchProfile: selected });
  assert.equal(first.empty, true);
  assert.equal(first.hasRoles(), false);
  assert.equal(first.accountCount(), 0);
  const firstAccount = first.resolveAccount('first-account');
  assert.equal(firstAccount.roleId, 1);
  assert.equal(firstAccount.created, true);
  assert.equal(first.hasRoles(), true);
  assert.equal(first.accountCount(), 1);
  assert.equal(first.inspect(db => db.prepare('SELECT source FROM migrations WHERE name=?').get('empty-realm-v1')).source, 'no-player-rows');
  const firstState = first.state(firstAccount.roleId);
  assert.equal(codec.unpack('to_client_role_info', Buffer.from(firstState.rolePb, 'base64')).level, 1);
  first.close();

  const reopened = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT, launchProfile: selected });
  assert.equal(reopened.roleForAccount('first-account'), 1);
  const secondAccount = reopened.resolveAccount('second-account');
  assert.equal(secondAccount.roleId, 2);
  assert.equal(secondAccount.created, true);
  assert.notEqual(secondAccount.roleId, reopened.roleForAccount('first-account'));
  assert.equal(reopened.accountCount(), 2);
  reopened.close();
});

test('gateway seeding binds the configured realm, role and launch profile', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-launch-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: () => true,
    serverOpenedAt: OPENED_AT,
    serverId: 2,
    serverName: 'Realm 2',
    roleId: 100002,
    roleName: 'Adventurer',
    launchProfileId: 'realm-2-launch',
    activityWindowAnchor: ANCHOR,
    activityMode: 'schedule',
    now: () => (OPENED_AT + 3600) * 1000
  });
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const state = game.store.state();
  assert.equal(state.roleId, 100002);
  assert.equal(state.serverId, 2);
  assert.equal(state.createdAt, OPENED_AT);
  assert.equal(state.serverOpenedAt, OPENED_AT);
  assert.equal(state.launchProfileId, 'realm-2-launch');
  assert.equal(state.activityWindowAnchor, ANCHOR);
  assert.equal(state.serverName, 'Realm 2');
  assert.equal(state.roleName, 'Adventurer');
  assert.equal(decodeActivity(new Map(state.modules.value).get(ACTIVITY_LOGIN_MODULE_ID)).act_custom_list.length, 96);
});

test('gateway login exposes white-ribbon at server day 16 with the same five-day window in modules 92 and 183', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-white-ribbon-day16-'));
  const at = PUBLIC_SERVER_OPENED_AT + 15 * 86400 + 6 * 3600;
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: () => true,
    serverOpenedAt: PUBLIC_SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    activityWindowAnchor: ANCHOR,
    launchProfileId: 'white-ribbon-day16',
    activityMode: 'schedule',
    now: () => at * 1000
  });
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const initial = await decodeEtf(await game.loginPayload());
  const initialModules = new Map(initial[2].value.map(entry => [Number(entry[0]), entry[1]]));
  const initialActivity = codec.unpack('pb_act_login', Buffer.from(initialModules.get(ACTIVITY_LOGIN_MODULE_ID).value));
  const initialIds = new Set([
    ...(initialActivity.act_list ?? []).map(entry => Number(entry.state_data?.act_id)),
    ...(initialActivity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(entry => Number(entry.act_id)))
  ]);
  assert.equal(serverDayNumber(PUBLIC_SERVER_OPENED_AT, at), 16);
  assert.equal(initialIds.has(1102010), true, 'the protocol row is retained for structural compatibility');
  assert.equal((initialActivity.act_pause_list ?? []).map(Number).includes(1102010), true,
    'an unproven function lock must present the activity as paused');

  for (const funId of [30395, 2463, 30302]) game.featureOverrides.set({
    serverId: game.store.read().state.serverId,
    funId,
    mode: 'force_open',
    reason: 'launch-profile regression fixture',
    operator: 'test'
  });
  const login = await decodeEtf(await game.loginPayload());
  const modules = new Map(login[2].value.map(entry => [Number(entry[0]), entry[1]]));
  const activity = codec.unpack('pb_act_login', Buffer.from(modules.get(ACTIVITY_LOGIN_MODULE_ID).value));
  const activityIds = new Set([
    ...(activity.act_list ?? []).map(entry => Number(entry.state_data?.act_id)),
    ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(entry => Number(entry.act_id)))
  ]);
  assert.equal(activityIds.has(1102010), true);
  assert.equal((activity.act_pause_list ?? []).map(Number).includes(1102010), false);
  assert.deepEqual(
    activity.act_custom_list.filter(row => Number(row.act_id) === 1102010)
      .map(row => [Number(row.start_time), Number(row.end_time)]),
    [[1795640400, 1796072400]]
  );

  const module183 = modules.get(RELIC_ACTIVITY_LOGIN_MODULE_ID);
  const player = codec.unpack('pb_act_role_login', Buffer.from(module183.value[0].value));
  const server = codec.unpack('pb_act_server_data', Buffer.from(module183.value[1].value));
  for (const actId of [1102010, 182819, 1841010]) {
    for (const row of [
      player.data_list.find(entry => Number(entry.act_stage?.act_id) === actId)?.act_stage,
      server.act_stage_list.find(entry => Number(entry.act_id) === actId)
    ]) {
      assert.ok(row, `module 183 row ${actId} is present`);
      assert.equal(Number(row.start_time), 1795640400);
      assert.equal(Number(row.end_time), 1796072400);
      assert.equal(Number(row.end_time) - Number(row.start_time), 5 * 86400);
    }
  }
});
