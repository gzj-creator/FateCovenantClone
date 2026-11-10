import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { rawBinary, createGameCodec } from '../protocol/game-codec.mjs';
import { ACTIVITY_LOGIN_MODULE_ID, relocateLaunchActivityWindows } from '../game/launch-profile.mjs';
import { createActivityCalendar, serverDayNumber } from '../game/activity-calendar.mjs';
import { createLocalGame } from '../local-game.mjs';
import { mergeRelicLoginContainer, RELIC_ACTIVITY_LOGIN_MODULE_ID } from '../game/relic-divine-login.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';

const ANCHOR = 1792789200;
const OPENED_AT = 1794258000;
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

test('the rebased login template follows server days 1, 2, 7 and 8', () => {
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
  assert.equal(idsAt(0).has(20001), true);
  assert.equal(idsAt(0).has(53037), false);
  assert.equal(idsAt(1).has(53037), true);
  assert.equal(idsAt(6).has(53037), true);
  assert.equal(idsAt(7).has(53037), true);
  assert.equal(idsAt(8).has(53037), false);
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
