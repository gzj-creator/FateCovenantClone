import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import {
  DEMIGOD_LOGIN_BLOCK_SCHEMAS,
  FANTASY_LOGIN_BLOCK_SCHEMAS
} from '../game/fantasy-act-shared-service.mjs';
import { decodeModuleLoginBlocks, mergeRelicLoginContainer } from '../game/relic-divine-login.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;

function fixture() {
  const capture = JSON.parse(fs.readFileSync(capturePath));
  const decoded = capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded;
  const modules = new Map(decoded[2].value);
  return { capture, module183: modules.get(183) };
}

function serializedEntry(entry) {
  return {
    value: entry.value.map(value => serializedBinary(Buffer.from(value.value))),
    improper: false
  };
}

function setResource(store, tid, num, group = 1) {
  store.transaction(model => {
    const existing = model.resources.get(String(tid));
    if (existing) {
      existing.num = String(num);
      return;
    }
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, group, entry] });
  });
}

function moduleValue(model, id) {
  return new Map(model.state.modules.value).get(id);
}

function rawStored(value) {
  return Buffer.from(value?.value?.data ?? []);
}

test('module 183 merges are additive, uniquely indexed, and reject corrupt wrappers', () => {
  const { module183 } = fixture();
  const entry = serializedEntry(module183);
  const originalPlayer = codec.unpack('pb_act_role_login', rawStored(entry.value[0]));
  const originalServer = codec.unpack('pb_act_server_data', rawStored(entry.value[1]));
  entry.value.push(serializedBinary(Buffer.from('preserve-extra-module-value')));
  const block = codec.pack('pb_artifact_draw_player_list', {
    act_data_list: [{ act_tid: 159001, daily_time: 0 }]
  });
  const merged = mergeRelicLoginContainer({
    codec,
    entry,
    activities: [{ actTid: 159001, startTime: 1792789200, endTime: 1793394000, blocks: [block] }]
  });

  const player = codec.unpack('pb_act_role_login', Buffer.from(merged.values[0].value.data));
  const server = codec.unpack('pb_act_server_data', Buffer.from(merged.values[1].value.data));
  assert.equal(player.data_list.length, originalPlayer.data_list.length + 1);
  assert.equal(server.act_stage_list.length, originalServer.act_stage_list.length + 1);
  for (const original of originalPlayer.data_list) {
    assert.ok(player.data_list.some(row => Number(row.act_stage.act_id) === Number(original.act_stage.act_id)));
  }
  for (const original of originalServer.act_stage_list) {
    assert.ok(server.act_stage_list.some(row => Number(row.act_id) === Number(original.act_id)));
  }
  assert.equal(merged.values.length, 3);
  assert.deepEqual(Buffer.from(merged.values[2].value.data), Buffer.from('preserve-extra-module-value'));
  const added = player.data_list.find(row => Number(row.act_stage.act_id) === 159001);
  assert.equal(added.act_stage.start_time, '1792789200');
  assert.equal(added.act_stage.end_time, '1793394000');
  assert.equal(added.act_stage.cur_stage_id, 50);
  assert.deepEqual(decodeModuleLoginBlocks(added.module_login_data), [block]);
  const addedServer = server.act_stage_list.find(row => Number(row.act_id) === 159001);
  assert.equal(addedServer.start_time, '1792789200');
  assert.equal(addedServer.end_time, '1793394000');
  assert.equal(addedServer.cur_stage_id, 50);
  assert.deepEqual(addedServer.stage_time_list, [{
    stage_id: 50,
    start_time: '1792789200',
    end_time: '1793394000'
  }]);

  const replaced = mergeRelicLoginContainer({
    codec,
    entry: { value: merged.values, improper: false },
    activities: [{ actTid: 159001, startTime: 1792789200, endTime: 1793394000, blocks: [block] }]
  });
  const replacedPlayer = codec.unpack('pb_act_role_login', Buffer.from(replaced.values[0].value.data));
  assert.equal(replacedPlayer.data_list.filter(row => Number(row.act_stage.act_id) === 159001).length, 1);

  const corruptPlayer = codec.pack('pb_act_role_login', {
    data_list: [{
      act_stage: { act_id: 159001, start_time: '1', end_time: '2', cur_stage_id: 50, history_time: [] },
      module_login_data: Buffer.from('836d00000009', 'hex')
    }]
  });
  assert.throws(() => mergeRelicLoginContainer({
    codec,
    entry: { value: [serializedBinary(corruptPlayer), serializedBinary(Buffer.alloc(0))], improper: false },
    activities: [{ actTid: 159002, startTime: 1, endTime: 2, blocks: [block] }]
  }), error => error?.code === 5 && /Corrupt module_login_data/.test(error.message));
});

function setResources(store, ids) {
  store.transaction(model => {
    let nextIndex = Math.max(
      -1,
      ...[...model.resources.values()]
        .filter(value => value.location?.[0] === 5)
        .map(value => Number(value.location[2]))
    ) + 1;
    for (const tid of ids) {
      const key = String(tid), existing = model.resources.get(key);
      if (existing) existing.num = '100000';
      else {
        model.resources.set(key, { tid: key, num: '100000', location: [5, null, nextIndex++] });
      }
    }
  });
}

function seedFantasyModule(store) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(518) ?? { value: [], improper: false };
    while (module.value.length < 3) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[1] = serializedBinary(codec.pack('pb_fantasy_formation_list', {
      formation_list: []
    }));
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', {
      wish_list: [], total_draw_times: '9', wish_fail_times: '0', refresh_stamp: 1792790000, left_buy_times: 7
    }));
    modules.set(518, module);
    model.state.modules.value = [...modules];
  });
}

async function connectClient(game, t) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [], pendingPushes = [];
  socket.on('data', chunk => {
    for (const payload of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(payload);
      else queue.push(payload);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(value => { clearTimeout(timer); resolve(value); });
  });
  const send = data => socket.write(encodeGameFrame(data));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  async function request(type, seq, data = Buffer.alloc(0)) {
    send(codec.pack('pb_c2s', { type, seq, data }));
    while (true) {
      let payload;
      try {
        payload = await next();
      } catch (error) {
        error.message += ` for request type ${type}, seq ${seq}`;
        throw error;
      }
      const frame = codec.unpack('pb_s2c', payload);
      if (frame.seq === seq) return frame;
      if (Number.isSafeInteger(Number(frame.type))) pendingPushes.push(frame);
    }
  }
  async function waitPush(type) {
    let index = pendingPushes.findIndex(frame => Number(frame.type) === Number(type));
    while (index < 0) {
      const frame = codec.unpack('pb_s2c', await next());
      if (Number(frame.type) === Number(type)) return frame;
      if (Number.isSafeInteger(Number(frame.type))) pendingPushes.push(frame);
      index = pendingPushes.findIndex(value => Number(value.type) === Number(type));
    }
    return pendingPushes.splice(index, 1)[0];
  }
  return {
    socket,
    request,
    waitPush,
    pendingPushTypes: () => pendingPushes.map(frame => Number(frame.type))
  };
}

function loginActivity(loginBytes) {
  return decodeEtf(Buffer.from(loginBytes, 'base64'));
}

test('gateway preserves login blocks, routes every relic command, and pushes after committed draws', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-relic-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const logs = [];
  const options = {
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    currentArtifactActivityId: 159009,
    currentDemigodActivityId: 102018,
    currentFantasyActivityId: 74001,
    now: () => GAME_NOW,
    random: () => 0.25,
    relicDrawGroupResolver: ({ kind }) => {
      if (kind === 'demigod') return { lib_range: [[1, 1202219, 1]] };
      if (kind === 'resident_fantasy') return { lib_range: [[1, 1200719, 1]] };
      return undefined;
    },
    logger: event => logs.push(event)
  };
  let game = createLocalGame(options);
  let client;
  const cleanup = async () => {
    client?.socket.destroy();
    try { await game.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  };
  t.after(cleanup);

  const before = fixture().module183;
  const originalPlayer = codec.unpack('pb_act_role_login', Buffer.from(before.value[0].value));
  const originalServer = codec.unpack('pb_act_server_data', Buffer.from(before.value[1].value));
  seedFantasyModule(game.store);
  setResources(game.store, [149002, 808002, 811002, 670002, 671002, 672002, 673002, 674002, 675002, 676002, 677002, 713002, 715002]);
  const sealedFantasy = new Map(game.store.state().modules.value).get(518).value.map(rawStored);

  client = await connectClient(game, t);
  let login;
  try {
    login = await client.request(909103, 1, codec.pack('login', {
      server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
    }));
  } catch (error) {
    t.diagnostic(JSON.stringify(logs));
    throw error;
  }
  assert.equal(login.err, undefined);
  const loginValue = await loginActivity(login.data);
  const loginModules = new Map(loginValue[2].value);
  const activityState = codec.unpack('pb_act_login', Buffer.from(loginModules.get(92).value));
  const activityIds = new Set([
    ...activityState.act_list.map(row => Number(row.state_data.act_id)),
    ...activityState.act_parallel_list.flatMap(group => group.states_data.map(row => Number(row.act_id)))
  ]);
  assert.ok([159009, 102018, 74001].every(id => activityIds.has(id)));

  const mergedPlayer = codec.unpack('pb_act_role_login', Buffer.from(loginModules.get(183).value[0].value));
  const mergedServer = codec.unpack('pb_act_server_data', Buffer.from(loginModules.get(183).value[1].value));
  for (const row of originalPlayer.data_list) {
    assert.ok(mergedPlayer.data_list.some(value => Number(value.act_stage.act_id) === Number(row.act_stage.act_id)));
  }
  for (const row of originalServer.act_stage_list) {
    assert.ok(mergedServer.act_stage_list.some(value => Number(value.act_id) === Number(row.act_id)));
  }
  const fishingPlayer = mergedPlayer.data_list.find(row => Number(row.act_stage.act_id) === 1074011);
  const fishingServer = mergedServer.act_stage_list.find(row => Number(row.act_id) === 1074011);
  for (const row of [fishingPlayer.act_stage, fishingServer]) {
    assert.equal(row.cur_stage_id, 50);
    assert.ok(Number(row.start_time) <= GAME_NOW / 1000);
    assert.ok(Number(row.end_time) > GAME_NOW / 1000);
  }
  assert.equal(fishingServer.stage_time_list[0].stage_id, 50);
  assert.ok(Number(fishingServer.stage_time_list[0].end_time) > GAME_NOW / 1000);
  const demigodRow = mergedPlayer.data_list.find(row => Number(row.act_stage.act_id) === 102018);
  const fantasyRow = mergedPlayer.data_list.find(row => Number(row.act_stage.act_id) === 74001);
  const demigodBlocks = decodeModuleLoginBlocks(demigodRow.module_login_data);
  const fantasyBlocks = decodeModuleLoginBlocks(fantasyRow.module_login_data);
  assert.equal(demigodBlocks.length, DEMIGOD_LOGIN_BLOCK_SCHEMAS.length);
  assert.equal(fantasyBlocks.length, FANTASY_LOGIN_BLOCK_SCHEMAS.length);
  assert.deepEqual(DEMIGOD_LOGIN_BLOCK_SCHEMAS, [
    'pb_demigod_act', 'pb_demigod_act_trial_data', 'pb_marbles_award_info'
  ]);
  assert.deepEqual(FANTASY_LOGIN_BLOCK_SCHEMAS, [
    'pb_fantasy_equip_act', 'pb_fantasy_equip_act_trial_data', 'pb_marbles_award_info'
  ]);
  demigodBlocks.forEach((block, index) => assert.ok(codec.unpack(DEMIGOD_LOGIN_BLOCK_SCHEMAS[index], block)));
  fantasyBlocks.forEach((block, index) => assert.ok(codec.unpack(FANTASY_LOGIN_BLOCK_SCHEMAS[index], block)));
  assert.equal(codec.unpack('pb_demigod_act', demigodBlocks[0]).act_tid, 102018);
  assert.equal(codec.unpack('pb_fantasy_equip_act', fantasyBlocks[0]).act_tid, 74001);
  const fantasyModule = new Map(game.store.state().modules.value).get(518);
  assert.ok(codec.unpack('pb_fantasy_equip_res', rawStored(fantasyModule.value[0])));
  assert.deepEqual(codec.unpack('pb_fantasy_formation_list', rawStored(fantasyModule.value[1])).formation_list, []);
  assert.equal(codec.unpack('pb_fantasy_draw', rawStored(fantasyModule.value[2])).total_draw_times, '9');
  assert.deepEqual(fantasyModule.value.slice(1, 3).map(rawStored), sealedFantasy.slice(1, 3));

  let seq = 10, response;
  game.artifactDrawAct.recordTrialFight(159001, 1, 150000);
  response = await client.request(101801, seq++, codec.pack('pb_req_artifact_trials_daily_reward_req', { act_tid: 159001, challenge_tid: 1, task_id: [101] }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')));

  game.artifactDrawAct.recordArtifactDraw(159002, 5);
  response = await client.request(101802, seq++, codec.pack('pb_artifact_draw_task_award_req', { act_tid: 159002, task_ids: [2101] }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_artifact_draw_task_award_rsp', Buffer.from(response.data, 'base64')));

  response = await client.request(101803, seq++, codec.pack('pb_artifact_fragments_draw_req', { act_tid: 159003, index: 1 }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_artifact_fragments_draw_rsp', Buffer.from(response.data, 'base64')));

  game.artifactDrawAct.execute101803({ act_tid: 159004, index: 1 });
  game.artifactDrawAct.execute101803({ act_tid: 159004, index: 2 });
  game.artifactDrawAct.execute101805({ act_tid: 159004 });
  game.store.transaction(model => {
    model.state.artifactDrawActs.activities['159004'].fragments.turn_over = true;
  });
  response = await client.request(101804, seq++, codec.pack('pb_artifact_fragments_new_turn_req', { act_tid: 159004 }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_fragments_draw_info', Buffer.from(response.data, 'base64')));

  game.artifactDrawAct.execute101803({ act_tid: 159005, index: 1 });
  response = await client.request(101805, seq++, codec.pack('pb_artifact_fragments_claim_req', { act_tid: 159005 }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_artifact_fragments_claim_rsp', Buffer.from(response.data, 'base64')));

  game.artifactDrawAct.inspect(159006);
  game.store.transaction(model => {
    const activity = model.state.artifactDrawActs.activities['159006'];
    activity.fragments.turn = 7;
    activity.fragments.turn_over = true;
    activity.fragments.unclaimed_list = [];
    activity.server.cur_turn = 7;
  });
  response = await client.request(101806, seq++, codec.pack('pb_artifact_fragments_synthesis_req', { act_tid: 159006 }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_artifact_fragments_synthesis_rsp', Buffer.from(response.data, 'base64')));

  response = await client.request(601, seq++, codec.pack('pb_draw_hero', { draw_lib: 192, point_draw_num: 1 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('hero_draw_back', Buffer.from(response.data, 'base64')).recruit_info.draw_lib, '192');
  const artifactPush = await client.waitPush(7001);
  assert.equal(codec.unpack('pb_fantasy_equip_act_draw', Buffer.from(artifactPush.data, 'base64')).all_guarantee_times, 1);

  response = await client.request(601, seq++, codec.pack('pb_draw_hero', { draw_lib: 94, point_draw_num: 1 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('hero_draw_back', Buffer.from(response.data, 'base64')).recruit_info.draw_lib, '94');
  const demigodPush = await client.waitPush(9160);
  assert.equal(codec.unpack('pb_demigod_act_draw_back', Buffer.from(demigodPush.data, 'base64')).draw_num, 1);

  setResource(game.store, 101500, 2000);
  const residentModuleBefore = new Map(game.store.state().modules.value).get(518);
  const residentDrawBefore = codec.unpack('pb_fantasy_draw', rawStored(residentModuleBefore.value[2]));
  const residentTicketBefore = BigInt(game.store.read().resources.get('808002')?.num ?? 0);
  response = await client.request(87618, seq++, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  const residentPurchase = codec.unpack('pb_fantasy_equip_draw_buy_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(residentPurchase.draw.left_buy_times, residentDrawBefore.left_buy_times - 1);
  assert.equal(residentPurchase.draw.total_draw_times, residentDrawBefore.total_draw_times);
  assert.equal(residentPurchase.res.changes.some(change => change.extra), false);
  assert.equal(BigInt(game.store.read().resources.get('808002').num), residentTicketBefore + 1n);

  response = await client.request(601, seq++, codec.pack('pb_draw_hero', { draw_lib: 226, point_draw_num: 1 }));
  assert.equal(response.err, undefined);
  const residentDraw = codec.unpack('hero_draw_back', Buffer.from(response.data, 'base64'));
  assert.equal(residentDraw.recruit_info.draw_lib, '226');
  assert.equal(residentDraw.res.changes.some(change => change.tid === '808002' && change.diff_num === '-1'), true);
  assert.equal(residentDraw.res.changes.filter(change => change.extra?.length).length, 1);
  assert.equal(BigInt(game.store.read().resources.get('808002').num), residentTicketBefore);
  const fantasyPush = await client.waitPush(10101);
  assert.equal(codec.unpack('pb_fantasy_draw', Buffer.from(fantasyPush.data, 'base64')).total_draw_times, '10');

  const fantasyEquipmentCommands = [
    [87601, 'pb_fantasy_equip_put_on_req', {}],
    [87603, 'pb_fantasy_equip_take_off_req', {}],
    [87604, 'pb_fantasy_equip_bless_req', {}],
    [87605, 'pb_fantasy_equip_id', {}],
    [87606, 'pb_fantasy_equip_level_up_req', {}],
    [87607, 'pb_fantasy_equip_composite_req', {}],
    [87608, 'pb_fantasy_equip_dev_req', {}],
    [87609, 'pb_fantasy_equip_composite_req', {}],
    [87610, null, Buffer.alloc(0)],
    [87611, 'pb_fantasy_equip_lineup_custom_req', {}],
    [87613, 'pb_fantasy_equip_lineup_one_key_req', {}],
    [87614, 'pb_fantasy_formation_list', {}],
    [87615, 'pb_fantasy_awakening_req', {}],
    [87616, 'pb_fantasy_awakening_req', {}],
    [87617, 'pb_fantasy_equip_draw_wish_req', {}],
    [87618, null, Buffer.alloc(0)]
  ];
  for (const [type, schema, request] of fantasyEquipmentCommands) {
    const data = schema ? codec.pack(schema, request) : request;
    response = await client.request(type, seq++, data);
    assert.notEqual(response.err?.err, -1, `command ${type} must be routed`);
    assert.ok(logs.some(event => Number(event.type) === type && (
      String(event.event).startsWith('fantasy_equipment_') || String(event.event).startsWith('fantasy_draw_') ||
      (type === 87618 && String(event.event).startsWith('recruit_'))
    )), `command ${type} must reach its service`);
  }

  response = await client.request(601, seq++, codec.pack('pb_draw_hero', { draw_lib: 192, point_draw_num: 1001 }));
  assert.equal(response.err?.err, 1);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(client.pendingPushTypes(), []);
  assert.ok(logs.some(event => event.event === 'fantasy_shared_draw_rejected' && event.type === 601));

  const pbCommands = [
    [98303, 'pb_demigod_act_receive_trial_req', { act_tid: 102018, tid: 1, receive_tid: 1001 }],
    [98304, 'pb_demigod_act_wear_equip_req', { act_tid: 102018, tid: 1, fantasy_id: { uid: 0, tid: 0 } }],
    [98305, 'pb_demigod_act_wear_bless_req', { act_tid: 102018, tid: 1, bless_list: [] }],
    [88928, 'pb_fantasy_act_receive_trial_req', { act_tid: 74001, tid: 1, receive_tid: 1001 }],
    [88929, 'pb_fantasy_act_wear_equip_req', { act_tid: 74001, tid: 1, fantasy_id: { uid: 0, tid: 0 } }],
    [88930, 'pb_fantasy_act_wear_bless_req', { act_tid: 74001, tid: 1, bless_list: [] }],
    [88932, 'pb_fantasy_act_task_reward_req', { act_tid: 74001, task_id: 1 }]
  ];
  for (const [type, schema, request] of pbCommands) {
    response = await client.request(type, seq++, codec.pack(schema, request));
    assert.notEqual(response.err?.err, -1, `command ${type} must be routed`);
  }
  const etfCommands = [
    [98301, []], [98302, []], [98307, []], [88922, []], [88927, []],
    [98306, [1]], [98308, [1200119]], [88924, [1200119]], [88931, [1]]
  ];
  for (const [type, value] of etfCommands) {
    response = await client.request(type, seq++, await encodeEtf(value));
    assert.notEqual(response.err?.err, -1, `command ${type} must be routed`);
  }
  assert.ok(logs.some(event => event.event === 'relic_activity_committed' || event.event === 'relic_activity_rejected'));

  const persistedDemigod = game.store.state().fantasyActState.kinds.demigod.draw.version_draw_num;
  assert.equal(persistedDemigod, '1');
  const persistedFantasy = codec.unpack('pb_fantasy_draw', rawStored(new Map(game.store.state().modules.value).get(518).value[2]));
  assert.equal(persistedFantasy.total_draw_times, '10');

  client.socket.destroy();
  await game.close();
  game = createLocalGame(options);
  const reopenedDemigod = game.store.state().fantasyActState.kinds.demigod.draw.version_draw_num;
  const reopenedFantasy = codec.unpack('pb_fantasy_draw', rawStored(new Map(game.store.state().modules.value).get(518).value[2]));
  assert.equal(reopenedDemigod, '1');
  assert.equal(reopenedFantasy.total_draw_times, '10');
});
