import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readExplorationActTables } from '../config/exploration-act-tables.mjs';
import { createExplorationActService } from '../game/exploration-act-service.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const explorationTables = readExplorationActTables();
const OPENED_AT = 1792789200;
const START = (OPENED_AT + 90000) * 1000;

const G1_TYPES = [
  11408, 11409, 11410, 11413, 11416, 11417, 11418, 11419, 11420,
  11501, 11502, 11503, 11505,
  43003, 43006, 43008, 43009, 43010, 43014, 43016, 43017, 43018, 43019, 43020, 43021, 43022, 43023, 43024,
  76501, 76502, 76503, 76504, 76505, 76506, 76507, 76508, 76509, 76510, 76511, 76512,
  83701, 83702, 83703, 83704,
  85601, 85605, 85606, 85607, 85608, 85609, 85610,
  87801, 87802, 87803, 87804, 87805,
  88001, 88002, 88003, 88004, 88005, 88006, 88007, 88008, 88009, 88010,
  89901, 89902, 89903, 89904, 89905, 89906, 89907, 89908, 89909, 89910, 89911, 89912, 89913, 89914, 89915, 89916, 89917,
  90501, 90502, 90503, 90504, 90505, 90506, 90507,
  90801, 90802, 90803, 90804, 90805, 90806,
  93801, 93802
];

function open(now = () => START) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-g1-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  const service = createExplorationActService({ store, codec, tables, explorationTables, now, random: () => 0 });
  return { directory, databasePath, store, service };
}

test('G1 registry covers every declared exploration command', () => {
  const { directory, service, store } = open();
  try {
    const expectedModules = {
      'PLAY-HOMEPUZZLEACT': [11408, 11409, 11410, 11413, 11416, 11417, 11418, 11419, 11420],
      'PLAY-HOMELANDACT': [11501, 11502, 11503, 11505],
      'PLAY-CARNIVAL': [43003, 43006, 43008, 43009, 43010, 43014, 43016, 43017, 43018, 43019, 43020, 43021, 43022, 43023, 43024],
      'PLAY-THEMETREASURE': [76501, 76502, 76503, 76504, 76505, 76506, 76507, 76508, 76509, 76510, 76511, 76512],
      'PLAY-MINIGAME': [83701, 83702, 83703, 83704],
      'PLAY-TREASUREHUNT': [85601, 85605, 85606, 85607, 85608, 85609, 85610],
      'PLAY-GRANDTOURER': [87801, 87802, 87803, 87804, 87805],
      'PLAY-DREAM': [88001, 88002, 88003, 88004, 88005, 88006, 88007, 88008, 88009, 88010],
      'PLAY-MAGICALJOURNEY': [89901, 89902, 89903, 89904, 89905, 89906, 89907, 89908, 89909, 89910, 89911, 89912, 89913, 89914, 89915, 89916, 89917],
      'PLAY-PETACTIVITY': [90501, 90502, 90503, 90504, 90505, 90506, 90507],
      'PLAY-RADISHFARM': [90801, 90802, 90803, 90804, 90805, 90806],
      'PLAY-EXPERIENCEACT': [93801, 93802]
    };
    assert.equal(G1_TYPES.length, 98);
    for (const type of G1_TYPES) assert.equal(service.supports(type), true, 'missing route ' + type);
    for (const [card, types] of Object.entries(expectedModules)) {
      for (const type of types) assert.equal(service.commands.get(type).card, card);
    }
    const implemented = G1_TYPES.filter(type => service.implemented(type));
    assert.deepEqual(implemented.sort((a, b) => a - b), [
      11408, 11409, 11410, 11413, 11416, 11417, 11418, 11419, 11420,
      11501, 11502, 11503, 11505,
      43003, 43006, 43008, 43009, 43010, 43014, 43016, 43017, 43018, 43019, 43020, 43021, 43022, 43023, 43024,
      76501, 76502, 76503, 76504, 76505, 76506, 76507, 76508, 76509, 76512,
      83701, 83702, 83703, 83704,
      85601, 85605, 85606, 85607, 85608, 85609, 85610,
      87801, 87802, 87803, 87804, 87805,
      88001, 88002, 88003, 88004, 88006, 88008, 88009, 88010,
      89901, 89902, 89903, 89904, 89905, 89906, 89907, 89908, 89909, 89910, 89911, 89912, 89914, 89915, 89916, 89917,
      90501, 90502, 90503, 90504, 90505, 90506, 90507,
      90801, 90802, 90803, 90804, 90805, 90806, 93801, 93802
    ]);
    const gaps = G1_TYPES.filter(type => !service.implemented(type));
    assert.deepEqual(gaps.sort((a, b) => a - b), [76510, 76511, 88005, 88007, 89913]);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('ExperienceAct go and award follow need_time and claim once', async () => {
  let clock = START;
  const { directory, service, store } = open(() => clock);
  try {
    const go = await service.execute(93801, codec.pack('pb_experience_go_req', {
      act_tid: 1, area_unit_list: [{ tid: 1, area_unit_list: [1, 2, 3, 4] }]
    }));
    const goBody = codec.unpack('pb_experience_go_rsp', go.data);
    assert.equal(goBody.area_info.length, 1);
    await assert.rejects(() => service.execute(93802, codec.pack('pb_experience_award_req', { act_tid: 1, award_list: [1] })), err => err instanceof GameError && err.code === 311);
    clock = START + 3 * 3600 * 1000;
    const award = await service.execute(93802, codec.pack('pb_experience_award_req', { act_tid: 1, award_list: [1] }));
    const body = codec.unpack('pb_experience_award_rsp', award.data);
    assert.equal(body.area_info[0].finish_time_list.includes(1), true);
    await assert.rejects(() => service.execute(93802, codec.pack('pb_experience_award_req', { act_tid: 1, award_list: [1] })), err => err instanceof GameError && err.code === 310);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('RadishFarm start, harvest and reopen keep the cell state', async () => {
  let clock = START;
  let { directory, databasePath, service, store } = open(() => clock);
  try {
    const start = await service.execute(90801, codec.pack('pb_radish_farm_normal_req', { id: [1] }));
    assert.equal(codec.unpack('pb_radish_farm_normal_rsp', start.data).cells.length, 1);
    await assert.rejects(() => service.execute(90803, codec.pack('pb_radish_farm_normal_req', { id: [1] })), err => err instanceof GameError && err.code === 311);
    clock = START + 2 * 3600 * 1000;
    const award = await service.execute(90803, codec.pack('pb_radish_farm_normal_req', { id: [1] }));
    assert.equal(codec.unpack('pb_radish_farm_reward_rsp', award.data).cells[0].is_harvest, true);
    store.close();
    store = createGameStore({ databasePath, codec, serverOpenedAt: OPENED_AT });
    service = createExplorationActService({ store, codec, tables, explorationTables, now: () => clock, random: () => 0 });
    await assert.rejects(() => service.execute(90803, codec.pack('pb_radish_farm_normal_req', { id: [1] })), err => err instanceof GameError && err.code === 310);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('HomePuzzle request, duplicate refusal and gift requirement', async () => {
  const { directory, service, store } = open();
  try {
    const request = codec.pack('pb_home_puzzle_request_req', { activity_id: 1, piece_tid: 10101 });
    const made = await service.execute(11410, request);
    const madeBody = codec.unpack('pb_home_puzzle_request_rsp', made.data);
    assert.equal(madeBody.act_data.my_requests.length, 1);
    await assert.rejects(() => service.execute(11410, request), err => err instanceof GameError && err.code === 310);
    await assert.rejects(() => service.execute(11409, codec.pack('pb_home_puzzle_gift_req', {
      activity_id: 1, piece_tid: 10101, friend_role_id: 0
    })), err => err instanceof GameError && err.code === 301);
    const cancel = await service.execute(11420, codec.pack('pb_home_puzzle_cancel_request_req', { activity_id: 1, piece_tid: 10101 }));
    assert.equal(codec.unpack('pb_home_puzzle_cancel_request_rsp', cancel.data).act_data.my_requests.length, 0);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('Runtime activity ids resolve through ActFrame and Activity versions', async () => {
  const { directory, service, store } = open();
  try {
    store.transaction(model => grantResources(model, [[173002, 10]], tables, { codec }));
    const puzzle = await service.execute(11410, codec.pack('pb_home_puzzle_request_req', {
      activity_id: 1080001, piece_tid: 10101
    }));
    assert.equal(Number(codec.unpack('pb_home_puzzle_request_rsp', puzzle.data).act_data.act_tid), 1080001);
    const homeland = await service.execute(11501, codec.pack('pb_homeland_act_select_hero_req', {
      activity_id: 1085001, hero_tid: 5040601
    }));
    assert.equal(Number(codec.unpack('pb_homeland_act_select_hero_rsp', homeland.data).act_info.act_id), 1085001);
    const hunt = await service.execute(76501, codec.pack('pb_theme_treasure_hunt_req', {
      activity_id: 63001, step: 1, get_target_player: false
    }));
    assert.equal(codec.unpack('pb_theme_treasure_hunt_rsp', hunt.data).steps.length, 1);
    const radish = await service.execute(90801, codec.pack('pb_radish_farm_normal_req', {
      act_tid: 84001, id: [1]
    }));
    assert.equal(codec.unpack('pb_radish_farm_normal_rsp', radish.data).cells.length, 1);
    const experience = await service.execute(93801, codec.pack('pb_experience_go_req', {
      act_tid: 100001, area_unit_list: [{ tid: 1, area_unit_list: [1] }]
    }));
    assert.equal(codec.unpack('pb_experience_go_rsp', experience.data).area_info.length, 1);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('MiniGame enter and slot retry use the shipped MiniGameTable', async () => {
  const { directory, service, store } = open();
  try {
    const enter = await service.execute(83702, codec.pack('pb_mini_game_enter_req', { tid: 4, custom_bin: Buffer.alloc(0) }));
    assert.equal(enter.data.length > 0, true);
    const retry = await service.execute(83703, Buffer.alloc(0));
    const body = codec.unpack('pb_mini_game_slot_machine', retry.data);
    assert.equal(body.left_retry_times, 2);
    await assert.rejects(() => service.execute(83701, codec.pack('pb_mini_game_settle_req', { tid: 30, custom_bin: Buffer.alloc(0) })), err => err instanceof GameError && err.code === 5);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('GrandTourer daily token claims once per day', async () => {
  const { directory, service, store } = open();
  try {
    const first = await service.execute(87801, Buffer.alloc(0));
    assert.ok(codec.unpack('pb_res_to_client', first.data).changes.length > 0);
    await assert.rejects(() => service.execute(87801, Buffer.alloc(0)), err => err instanceof GameError && err.code === 310);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

import net from 'node:net';
import { once } from 'node:events';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

async function connectClient(t, game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const nextFrame = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await nextFrame()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const message = codec.unpack('pb_s2c', await nextFrame());
      if (message.seq === seq) return message;
    }
  };
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(Number(login.code ?? 1), 1);
  const loginModules = (await decodeEtf(Buffer.from(login.data ?? '', 'base64')))[2];
  return {
    request, loginModules,
    payloadOf: reply => Buffer.from(reply.data ?? '', 'base64'),
    errorCode: reply => Number(reply.err?.err ?? reply.err)
  };
}

function loginModule(infoModules, moduleId) {
  const list = Array.isArray(infoModules) ? infoModules : infoModules.value;
  const entry = list.find(item => Number((Array.isArray(item) ? item : item.value)[0]) === moduleId);
  assert.ok(entry, 'login container carries module ' + moduleId);
  const fields = Array.isArray(entry) ? entry : entry.value;
  const component = fields[1];
  const values = Buffer.isBuffer(component) || component instanceof Uint8Array ? [component]
    : Array.isArray(component) ? component
    : Array.isArray(component?.value) ? component.value
    : [component];
  const bytesOf = value => {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (Array.isArray(value)) return Buffer.from(value);
    if (value?.value != null) return bytesOf(value.value);
    if (value?.data != null) return Buffer.from(value.data);
    throw new Error('Unsupported ETF binary shape for module ' + moduleId);
  };
  return values.map(bytesOf);
}

test('G1 commands answer over the temporary gateway handshake', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-g1-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  store.transaction(model => grantResources(model, [[173002, 10]], tables, { codec }));
  store.close();
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    activityMode: 'all-open',
    now: () => START,
    random: () => 0
  });
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const client = await connectClient(t, game);
  const activityLogin = codec.unpack('pb_act_login', loginModule(client.loginModules, 92)[0]);
  const activityIds = new Set((activityLogin.act_list ?? []).map(entry => Number(entry.state_data?.act_id)));
  for (const actId of [1080001, 1085001, 63001, 84001, 100001]) {
    assert.ok(activityIds.has(actId), 'module 92 carries G1 activity ' + actId);
  }
  for (const moduleId of [136, 155, 168, 519]) {
    assert.ok(loginModule(client.loginModules, moduleId)[0]?.length > 0, 'login carries G1 module ' + moduleId);
  }
  assert.equal(loginModule(client.loginModules, 145).length, 3);
  const enter = await client.request(83702, 2, codec.pack('pb_mini_game_enter_req', { tid: 4, custom_bin: Buffer.alloc(0) }));
  assert.equal(enter.err, undefined);
  assert.ok(client.payloadOf(enter).length > 0);
  const retry = await client.request(83703, 3, Buffer.alloc(0));
  assert.equal(retry.err, undefined);
  assert.equal(codec.unpack('pb_mini_game_slot_machine', client.payloadOf(retry)).left_retry_times, 2);
  const latest = await client.request(43016, 4, Buffer.alloc(0));
  assert.equal(latest.err, undefined);
  assert.ok(client.payloadOf(latest).length > 0);
  const hunt = await client.request(76501, 5, codec.pack('pb_theme_treasure_hunt_req', { activity_id: 1, step: 0, get_target_player: false }));
  assert.equal(hunt.err, undefined);
  assert.equal(codec.unpack('pb_theme_treasure_hunt_rsp', client.payloadOf(hunt)).steps.length, 1);
  const dream = await client.request(88002, 6, Buffer.alloc(0));
  assert.equal(dream.err, undefined);
  assert.ok(Number(codec.unpack('pb_dream_award_rsp', client.payloadOf(dream)).got_day_award_stamp) > 0);
  const gap = await client.request(88005, 7, Buffer.alloc(0));
  assert.equal(client.errorCode(gap), 5);
});
