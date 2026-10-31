import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

// Real TCP integration on a temporary port with a database copied from the consistent handoff backup.
const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;

async function loginActivities(payload) {
  const login = await decodeEtf(payload);
  const entry = login[2].value.find(value => Number(value[0]) === 92);
  assert.ok(entry, 'login module 92 is present');
  return codec.unpack('pb_act_login', Buffer.from(entry[1].value));
}

function addResource(store, tid, num, group = 1) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid, num: String(num), location: [6, group, entry] });
  });
}

test('gateway serves mission fights, box opening and activity reads on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-gameplay-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  let gameNow = GAME_NOW;
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    missionFightPlayback: true,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => gameNow,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);
  const scheduledActivity = await loginActivities(Buffer.from(login.data, 'base64'));
  assert.equal(scheduledActivity.act_list.some(entry => Number(entry.state_data?.act_id) === 1074003), true);
  assert.equal(BigInt(game.store.read().resources.get('821202')?.num ?? 0), 25n);

  // Heartbeat is one-way. If it receives an empty frame, the client's receive
  // stream is left at offset 4 and decodes the next frame header as protobuf.
  send(codec.pack('pb_c2s', { type: -1, seq: 1, data: Buffer.alloc(0) }));

  // Journey fight: settle through the real gateway framing and persist the mission module.
  let response = await request(201, 2, codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: 30201 }),
    loc: [{ team_id: 1, loc: [
      { hero_id: '2010101', loc: 6 },
      { hero_id: '2010201', loc: 4 },
      { hero_id: '1020601', loc: 2 },
      { hero_id: '2020601', loc: 5 }
    ] }]
  }));
  assert.equal(response.seq, 2);
  assert.equal(response.err, undefined);
  const fight = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'));
  assert.equal(fight.report.finish, true);
  assert.equal(fight.report.type, 1);
  assert.equal(fight.report.battle_list.length, 1);
  assert.equal(fight.report.battle_list[0].fighter_list.length, 7);
  assert.equal(fight.report.battle_list[0].fighter_list.filter(unit => unit.role_type === 3).length, 1);
  const fightActions = fight.report.battle_list[0].action_list.map(bytes => codec.unpack('pb_generic', Buffer.from(bytes, 'base64')).proto);
  assert.deepEqual(fightActions.slice(0, 4), [107, 101, 106, 116]);
  assert.deepEqual(fightActions.slice(-2), [112, 104]);
  assert.ok(fightActions.every(type => [101, 102, 104, 105, 106, 107, 109, 112, 114, 116].includes(type)));
  assert.ok(fightActions.includes(109));
  assert.equal(codec.unpack('mission_to_client', Buffer.from(fight.stm.stm_data, 'base64')).mission.mission_id, '30202');
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30202');
  response = await request(207, 3, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64')).stm.result, 1);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30202');

  // Backpack box: the configured draw library replaces the previously unsupported command.
  response = await request(159, 4, codec.pack('pb_one_key_use', { use: [{ tid: 2261200, num: 1 }] }));
  assert.equal(response.err, undefined);
  const changes = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(changes.find(change => change.tid === '2261200').diff_num, '-1');
  // An unverified box rule is refused with a business error instead of a fake success.
  response = await request(159, 5, codec.pack('pb_one_key_use', { use: [{ tid: 11200, num: 1 }] }));
  assert.equal(response.err.err, 5);

  // Type 152 selection box: the whole command must commit instead of falling
  // through to unsupported_command / the generic client error.
  addResource(game.store, 71200, 1);
  response = await request(152, 50, codec.pack('selected_use', { tid: 71200, num: 1, selected: [{ index: 1, num: 1 }] }));
  assert.equal(response.err, undefined);
  const selectedChanges = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(selectedChanges.find(change => change.tid === '71200').diff_num, '-1');
  assert.equal(selectedChanges.find(change => change.tid === '21300104').diff_num, '1');
  assert.equal(game.store.read().resources.get('71200').num, '0');
  assert.equal(game.store.read().resources.get('21300104').num, '1');

  // Activity reads answer, activity mutations stay refused.
  response = await request(110308, 6, Buffer.alloc(0));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_fishing_act_get_record_rsp', Buffer.from(response.data ?? '', 'base64')).record_list, []);
  response = await request(110305, 55, codec.pack('pb_fishing_act_common_req', { act_id: 1074003, value: 201 }));
  assert.equal(response.err, undefined);
  const fishingUnlock = codec.unpack('pb_fishing_act_data_res', Buffer.from(response.data ?? '', 'base64'));
  assert.equal(fishingUnlock.data.act_id, '1074003');
  assert.deepEqual(fishingUnlock.data.unlock_map_list, ['201']);
  assert.equal(fishingUnlock.res.changes.length, 2);
  response = await request(110305, 56, codec.pack('pb_fishing_act_common_req', { act_id: 1074003, value: 201 }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_fishing_act_data_res', Buffer.from(response.data ?? '', 'base64')).res.changes, []);
  const baitBeforeCast = BigInt(game.store.read().resources.get('821202').num);
  response = await request(110301, 57, codec.pack('pb_fishing_act_rod_req', { act_id: 1074003, map_id: 201 }));
  assert.equal(response.err, undefined);
  const waitingFish = codec.unpack('pb_fishing_act_role_data', Buffer.from(response.data ?? '', 'base64')).wait_fish;
  assert.ok(Number(waitingFish.fish_id) > 0);
  assert.equal(BigInt(game.store.read().resources.get('821202').num), baitBeforeCast - 1n);
  response = await request(110302, 58, codec.pack('pb_fishing_act_get_req', { act_id: 1074003, is_get: true }));
  assert.equal(response.err, undefined);
  const collectedFish = codec.unpack('pb_fishing_act_get_rsp', Buffer.from(response.data ?? '', 'base64'));
  assert.equal(collectedFish.data.get_num, '1');
  assert.deepEqual(collectedFish.data.wait_fish, {});
  response = await request(116004, 7, codec.pack('pb_help_up_get_times_req', { act_id: 92144 }));
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', Buffer.from(response.data ?? '', 'base64')).times ?? 0), 0);
  response = await request(116001, 8, codec.pack('pb_help_up_task_reward_req', { act_id: 92144, task_id_list: [1] }));
  assert.equal(response.err.err, 5);

  // Auto-refresh shops need a decodable group even while their inventory is empty.
  response = await request(1202, 9, await encodeEtf([207, 206, 402]));
  assert.equal(response.err, undefined);
  const shops = codec.unpack('pb_query_shops_back', Buffer.from(response.data ?? '', 'base64')).shops;
  assert.deepEqual(shops.map(shop => shop.id), [207, 206, 402]);
  assert.deepEqual(shops.map(shop => shop.items_groups.length), [1, 1, 0]);
  const autoRefresh = codec.unpack('pb_shop_auto_refresh', Buffer.from(shops[0].items_groups[0].group_data_bin, 'base64'));
  assert.ok(Number(autoRefresh.next_refresh_time) > Math.floor(GAME_NOW / 1000));
  assert.equal(Number(autoRefresh.limit_bought_count ?? 0), 0);
  assert.deepEqual(autoRefresh.items_history_bought ?? [], []);

  // Activity stage sync is acknowledged with the empty change list instead of an error.
  response = await request(53002, 10, await encodeEtf([1004012]));
  assert.equal(response.err, undefined);

  // Recruitment uses ETF quantities for ticket purchase and protobuf for the draw itself.
  const ticketsBeforeRecruitment = Number(game.store.read().resources.get('2002')?.num ?? 0);
  game.store.transaction(model => { model.resources.get('101500').num = '1000'; });
  response = await request(600, 15, await encodeEtf([2]));
  assert.equal(response.err, undefined);
  const purchase = codec.unpack('pb_draw_normal_buy_ret', Buffer.from(response.data, 'base64'));
  assert.deepEqual(purchase.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '-500'], ['2002', '2']]);
  response = await request(601, 16, codec.pack('pb_draw_hero', { draw_lib: 1, point_draw_num: 2 }));
  assert.equal(response.err, undefined);
  const draw = codec.unpack('hero_draw_back', Buffer.from(response.data, 'base64'));
  assert.equal(draw.recruit_info.draw_lib, '1');
  assert.equal(draw.recruit_info.draw_count, 3);
  assert.ok(draw.res.changes.some(change => change.tid === '2002' && change.diff_num === '-2'));
  assert.equal(game.store.read().resources.get('2002').num, String(ticketsBeforeRecruitment));
  const drawStatistics = codec.unpack('pb_s2c', await next());
  assert.equal(drawStatistics.type, 2000);
  const statisticsPush = codec.unpack('pb_count_statics_send_list', Buffer.from(drawStatistics.data, 'base64'));
  assert.equal(statisticsPush.data_list.length, 1);
  assert.equal(statisticsPush.data_list[0].stat_tid, 1);
  assert.deepEqual(statisticsPush.data_list[0].expand_id_list, ['1']);
  assert.equal(Number(statisticsPush.data_list[0].data.list.find(row => Number(row.id) === 1).total), 3);
  const achievementStatistics = codec.unpack('pb_s2c', await next());
  assert.equal(achievementStatistics.type, 2000);
  const achievementPush = codec.unpack('pb_count_statics_send_list', Buffer.from(achievementStatistics.data, 'base64'));
  assert.equal(achievementPush.data_list.length, 1);
  assert.equal(achievementPush.data_list[0].stat_tid, 75);

  // Demigod resident recruitment buys the missing ticket and performs the
  // requested draw atomically. AwardKit reads the result from pb_res_to_client;
  // there is no separate 10101 state push in this protocol.
  game.store.transaction(model => { model.resources.get('101500').num = '2000'; });
  response = await request(87618, 17, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  const demigodPurchase = codec.unpack('pb_fantasy_equip_draw_buy_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(demigodPurchase.res.changes.filter(change => !change.extra).map(change => [change.tid, change.diff_num ?? '0']), [
    ['101500', '-400'],
    ['808002', '0']
  ]);
  const demigodTicket = codec.unpack('pb_res_obj', Buffer.from(demigodPurchase.res.changes.find(change => change.tid === '808002').new_bin, 'base64'));
  assert.equal(demigodTicket.tid, '808002');
  assert.equal(Number(demigodTicket.num ?? 0), 0);
  assert.equal(demigodPurchase.res.changes.filter(change => change.extra).length, 1);
  assert.equal(demigodPurchase.draw.left_buy_times, 9);
  assert.equal(demigodPurchase.draw.total_draw_times, '1');
  const demigodModule = new Map(game.store.state().modules.value).get(518);
  assert.equal(codec.unpack('pb_fantasy_draw', rawBinary(demigodModule.value[2])).total_draw_times, '1');
  assert.equal(codec.unpack('pb_fantasy_equip_res', rawBinary(demigodModule.value[0])).equips.length, 1);
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(518);
    const draw = codec.unpack('pb_fantasy_draw', rawBinary(module.value[2]));
    draw.total_draw_times = '100';
    module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', draw));
    model.state.modules.value = [...modules];
  });
  response = await request(87617, 18, codec.pack('pb_fantasy_equip_draw_wish_req', { wish_list: [1200719, 1200819] }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_fantasy_draw', Buffer.from(response.data, 'base64')).wish_list, [1200719, 1200819]);

  // The real MissionUIMgr encoder omits chapter_tid/section_idx; mission_id alone must settle.
  response = await request(201, 11, codec.pack('pb_fight_request', {
    fight_tid: 302, stm_type: 0,
    req: codec.pack('mission_fight_req', { mission_id: 30202, is_assistant: true })
  }));
  assert.equal(response.err, undefined);
  const missionOnly = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'));
  assert.equal(missionOnly.report.finish, true);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(missionOnly.stm.stm_data, 'base64')).mission.mission_id, '30203');

  // 503 is the mission sweep command emitted by MissionSweepMgr. It returns
  // the final resource changes plus one award group per repeated clear.
  addResource(game.store, 100012900, 5);
  response = await request(503, 60, codec.pack('pb_mission_sweep_passed_req', { tid: 30202, times: 1 }));
  assert.equal(response.err, undefined);
  const sweep = codec.unpack('pb_mission_sweep_passed_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(sweep.sweep_award.length, 1);
  assert.deepEqual(sweep.sweep_award[0].award, [
    { tid: '201500', num: '200' },
    { tid: '101800', num: '100' },
    { tid: '122802', num: '1' }
  ]);
  assert.deepEqual(sweep.changes.changes.map(change => [change.tid, change.diff_num]), [
    ['100012900', '-5'],
    ['201500', '200'],
    ['101800', '100'],
    ['122802', '1']
  ]);
  assert.equal(game.store.read().resources.get('100012900').num, '0');

  // 508 req_mission_custom continues the chapter-3 story node. The client sends
  // an ETF single-element list carrying sectionTid, then expects pb_mission_rsp.
  game.store.transaction(model => {
    const module = new Map(model.state.modules.value).get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = '30204';
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    const modules = new Map(model.state.modules.value);
    modules.set(8, module);
    model.state.modules.value = [...modules];
  });
  response = await request(508, 12, await encodeEtf([30205]));
  assert.equal(response.err, undefined);
  const story = codec.unpack('pb_mission_rsp', Buffer.from(response.data ?? '', 'base64'));
  assert.equal(story.mission.mission_id, '40201');
  assert.equal(story.res_change.changes.length, 0);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '40201');
  response = await request(508, 13, await encodeEtf(['not-a-section']));
  assert.equal(response.err.err, 1);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '40201');

  // Chapter 3's final node unlocks box 1. The client sends the visible box ids
  // as an ETF list and expects pb_mission_rsp with the updated BitBlock.
  const boxDiamonds = BigInt(game.store.read().resources.get('101500').num);
  response = await request(506, 14, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  const boxClaim = codec.unpack('pb_mission_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual([...(await decodeEtf(Buffer.from(boxClaim.mission.box_award, 'base64'))).value], [0x40]);
  assert.equal(boxClaim.res_change.changes.find(change => change.tid === '101500').diff_num, '30');
  assert.equal(BigInt(game.store.read().resources.get('101500').num), boxDiamonds + 30n);
  response = await request(506, 15, await encodeEtf([1]));
  assert.equal(response.err.err, 310);

  // Linear task 10001 completes at journey mission 30204. The story request
  // above advances past that milestone, so claim it through the real ETF shape.
  const taskDiamonds = BigInt(game.store.read().resources.get('101500').num);
  response = await request(9010, 16, await encodeEtf([10001]));
  assert.equal(response.err, undefined);
  const taskClaim = codec.unpack('pb_linear_task_receive_back', Buffer.from(response.data, 'base64'));
  assert.deepEqual(taskClaim.task, { type: 1, receive_tid: 10001 });
  assert.equal(taskClaim.res_change.changes.find(change => change.tid === '101500').diff_num, '50');
  assert.equal(BigInt(game.store.read().resources.get('101500').num), taskDiamonds + 50n);
  const taskModule = codec.unpack('pb_linear_task_data', rawBinary(new Map(game.store.state().modules.value).get(90).value[0]));
  assert.equal(taskModule.task_list.find(task => task.type === 1).receive_tid, 10001);
  response = await request(9010, 17, await encodeEtf([10001]));
  assert.equal(response.err.err, 310);

  // Chapter completion asks which recommended gifts are active. The scheduled
  // calendar excludes this expired offer so its commerce data cannot leak into
  // the login response.
  response = await request(85901, 18, codec.pack('pb_recommend_gift_active_req', { actives: [{ act_tid: 61070, gift_id: [2811, 2812, 2813] }] }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_recommend_gift_active_rsp', Buffer.from(response.data ?? '', 'base64')).gift_list, []);

  // On local day 8 the opening fishing generation and contract 83028 are over.
  gameNow = (SERVER_OPENED_AT + 7 * 86400) * 1000;
  const currentActivity = await loginActivities(await game.loginPayload());
  const currentIds = [
    ...currentActivity.act_list.map(entry => Number(entry.state_data?.act_id)),
    ...currentActivity.act_parallel_list.flatMap(group => group.states_data.map(entry => Number(entry.act_id)))
  ];
  assert.equal(currentIds.some(id => id >= 1074001 && id <= 1074011), false);
  assert.equal(currentIds.includes(83028), false);
  assert.equal(currentActivity.act_custom_list.some(entry => Number(entry.act_id) === 83028), false);
});

test('all-open mode returns every stored activity and forces test-visible states', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-all-open-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: () => true,
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => (SERVER_OPENED_AT + 7 * 86400) * 1000
  });
  t.after(async () => { await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const stored = codec.unpack('pb_act_login', rawBinary(new Map(game.store.state().modules.value).get(92)));
  const storedIds = [
    ...stored.act_list.map(entry => Number(entry.state_data?.act_id)),
    ...stored.act_parallel_list.flatMap(group => group.states_data.map(entry => Number(entry.act_id)))
  ];
  const activity = await loginActivities(await game.loginPayload());
  const returnedIds = new Set([
    ...activity.act_list.map(entry => Number(entry.state_data?.act_id)),
    ...activity.act_parallel_list.flatMap(group => group.states_data.map(entry => Number(entry.act_id)))
  ]);

  assert.equal(game.calendar.mode, 'all-open');
  assert.equal(activity.act_pause_list.length, 0);
  assert.ok(activity.act_list.every(entry => Number(entry.state_data?.cur_state_id) === 50));
  assert.ok(activity.act_parallel_list.every(group => group.states_data.every(entry => Number(entry.cur_state_id) === 50)));
  assert.ok(activity.act_custom_list.every(entry => Number(entry.start_time ?? 0) === 0 && Number(entry.end_time ?? 0) === 0));
  assert.ok(storedIds.every(id => returnedIds.has(id)));
  assert.equal(returnedIds.has(83028), true);
  assert.equal(returnedIds.has(1074011), true);
});

test('leader equipment wear reports an unopened feature instead of a generic server error', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-leader-equip-wear-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  const before = codec.unpack('pb_leader_equips_data', rawBinary(new Map(game.store.state().modules.value).get(175)));
  const response = await request(98401, 2, codec.pack('pb_leader_equip_wear_req', {}));
  assert.equal(response.err.err, 305);
  assert.equal(response.err.stacktrace, undefined);
  const after = codec.unpack('pb_leader_equips_data', rawBinary(new Map(game.store.state().modules.value).get(175)));
  assert.deepEqual(after, before);

  assert.equal(events.some(event => event.event === 'unsupported_command' && event.type === 98401), false);
  const rejection = events.find(event => event.event === 'leader_equip_wear_rejected');
  assert.ok(rejection?.connection);
  assert.deepEqual({ event: rejection.event, type: rejection.type, seq: rejection.seq, code: rejection.code, reason: rejection.reason }, {
    event: 'leader_equip_wear_rejected', type: 98401, seq: 2, code: 305, reason: 'feature_not_open'
  });
});
