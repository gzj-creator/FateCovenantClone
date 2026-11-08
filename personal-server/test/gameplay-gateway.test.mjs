import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { E, createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

// Real TCP integration on a temporary port using the checked-in capture seed.
const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;

async function loginModule(payload, moduleId) {
  const login = await decodeEtf(payload);
  const entry = login[2].value.find(value => Number(value[0]) === moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  return entry[1];
}

async function loginActivities(payload) {
  const entry = await loginModule(payload, 92);
  return codec.unpack('pb_act_login', Buffer.from(entry.value));
}

function loginModuleBytes(login, moduleId, slot = 0) {
  const entry = login[2].value.find(value => Number(value[0]) === moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  const value = entry[1].value;
  if (Array.isArray(value)) {
    assert.ok(value[slot], `login module ${moduleId} has slot ${slot}`);
    return Buffer.from(value[slot].value);
  }
  return Buffer.from(value);
}

function setDestiny(store, value) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(107, serializedBinary(codec.pack('pb_destiny_data', value)));
    model.state.modules.value = [...modules];
  });
}

function setMission(store, missionId) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = String(missionId);
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    model.state.modules.value = [...modules];
  });
}

function storedLinearTask(store) {
  // Module 90 holds the four common-task groups first; the linear group follows them.
  return codec.unpack('pb_linear_task_data', rawBinary(new Map(store.state().modules.value).get(90).value[4]));
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
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '20205');
  assert.equal(game.store.read().resources.get('100012900').num, '120');
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
  assert.equal(fight.report.finish ?? false, false);
  assert.equal(fight.report.type, 1);
  assert.equal(fight.report.battle_list.length, 1);
  assert.equal(fight.report.battle_list[0].fighter_list.length, 7);
  assert.equal(fight.report.battle_list[0].fighter_list.filter(unit => unit.role_type === 3).length, 1);
  const fightActions = fight.report.battle_list[0].action_list.map(bytes => codec.unpack('pb_generic', Buffer.from(bytes, 'base64')).proto);
  assert.deepEqual(fightActions.slice(0, 5), [107, 101, 109, 102, 101]);
  assert.deepEqual(fightActions.slice(-2), [112, 104]);
  assert.ok(fightActions.every(type => [101, 102, 104, 105, 106, 107, 109, 112, 114, 116].includes(type)));
  assert.ok(fightActions.includes(109));
  const fightPreview = codec.unpack('mission_to_client', Buffer.from(fight.stm.stm_data, 'base64'));
  assert.equal(fight.stm.exception ?? false, false);
  assert.equal(fightPreview.mission.mission_id, '20205');
  assert.deepEqual(fightPreview.res.changes, []);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '20205');
  assert.equal(game.store.read().resources.get('100012900').num, '120');
  assert.equal(game.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_first_clear' AND claim_key='30201'").get().n), 0);
  response = await request(207, 3, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  const committed = codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64'));
  assert.equal(committed.stm.result, 1);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(committed.stm.stm_data, 'base64')).mission.mission_id, '30201');
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30201');
  assert.equal(game.store.read().resources.get('100012900').num, '115');
  assert.equal(game.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_first_clear' AND claim_key='30201'").get().n), 1);
  response = await request(207, 31, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.deepEqual(codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64')).stm, committed.stm);
  assert.equal(game.store.read().resources.get('100012900').num, '115');

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

  // Designated emoji box: both one-key (159) and single use (151) must go
  // through the same fixed award list as the client's ItemBox callback.
  addResource(game.store, 1501200, 2);
  response = await request(159, 51, codec.pack('pb_one_key_use', { use: [{ tid: 1501200, num: 2 }] }));
  assert.equal(response.err, undefined);
  const designatedChanges = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(designatedChanges.find(change => change.tid === '1501200').diff_num, '-2');
  assert.equal(designatedChanges.find(change => change.tid === '381002').diff_num, '2');
  assert.equal(designatedChanges.find(change => change.tid === '389002').diff_num, '2');
  addResource(game.store, 1501200, 1);
  response = await request(151, 52, codec.pack('simple_use', { tid: 1501200, num: 1 }));
  assert.equal(response.err, undefined);
  const designatedSingle = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(designatedSingle.find(change => change.tid === '1501200').diff_num, '-1');
  assert.equal(designatedSingle.find(change => change.tid === '381002').diff_num, '1');
  assert.equal(designatedSingle.find(change => change.tid === '389002').diff_num, '1');
  assert.equal(game.store.read().resources.get('1501200').num, '0');
  assert.deepEqual(game.store.read().resources.get('381002').location.slice(0, 2), [6, 0]);
  assert.deepEqual(game.store.read().resources.get('389002').location.slice(0, 2), [6, 0]);

  // ITEM-ITEM: chip composition (156/158), manual conversion (154) and the guarded
  // repeat/lottery branches answer on their own numeric ItemCmd types.
  addResource(game.store, 21300104, 120, 2);
  response = await request(156, 60, codec.pack('simple_use', { tid: 21300104, num: 1 }));
  assert.equal(response.err, undefined);
  const composed = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(composed.find(change => change.tid === '21300104').diff_num, '-60');
  assert.equal(composed.find(change => change.tid === '1030101').diff_num, '1');
  response = await request(158, 61, codec.pack('pb_one_key_compose', { one_key_compose: [{ tid: 21300104, num: 1 }] }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes
    .find(change => change.tid === '21300104').diff_num, '-60');
  assert.equal(game.store.read().resources.get('21300104').num, '0');
  addResource(game.store, 157002, 1, 0);
  response = await request(154, 62, await encodeEtf([157002]));
  assert.equal(response.err, undefined);
  const converted = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(converted.find(change => change.tid === '157002').diff_num, '-1');
  assert.equal(converted.find(change => change.tid === '201500').diff_num, '2');
  // 153 has no BoxRepeat rows in this build and lottery rewards are undefined.
  response = await request(153, 63, await encodeEtf([2261200]));
  assert.equal(response.err.err, 5);
  response = await request(157, 64, codec.pack('pb_batch_use_box_req', { lottery_list: [{ tid: 100013400, num: 1 }] }));
  assert.equal(response.err.err, 5);

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
  // Fishing records and the per-fish top three are built from the catch that
  // just went through 110302; both reads take the activity id as an ETF argument.
  assert.equal(game.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM fishing_act_catches WHERE act_id=?').get(1074003).n), 1);
  response = await request(110303, 70, await encodeEtf([1074003]));
  assert.equal(response.err, undefined);
  const fishTop = codec.unpack('pb_fishing_act_get_top_rsp', Buffer.from(response.data ?? '', 'base64')).high_score_list;
  assert.deepEqual(fishTop.map(fish => fish.fish_id), [collectedFish.fish_id]);
  assert.equal(fishTop[0].data_list.length, 1);
  assert.equal(fishTop[0].data_list[0].role_id, String(game.store.read().state.roleId));
  response = await request(110308, 71, await encodeEtf([1074003]));
  assert.equal(response.err, undefined);
  const fishRecords = codec.unpack('pb_fishing_act_get_record_rsp', Buffer.from(response.data ?? '', 'base64')).record_list;
  assert.equal(fishRecords.length, 1);
  assert.equal(fishRecords[0].fish_id, collectedFish.fish_id);
  assert.equal(fishRecords[0].map_id, '201');
  assert.equal(fishRecords[0].name, 'Local Adventurer');
  // Codex award is the first-catch award of the recorded fish and cannot repeat.
  response = await request(110304, 72, codec.pack('pb_fishing_act_common_list_req', { act_id: 1074003, value: [Number(collectedFish.fish_id)] }));
  assert.equal(response.err, undefined);
  const codexAward = codec.unpack('pb_fishing_act_data_res', Buffer.from(response.data ?? '', 'base64'));
  assert.deepEqual(codexAward.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '10']]);
  assert.ok(Buffer.from(codexAward.data.book_state, 'base64').length > 0);
  response = await request(110304, 73, codec.pack('pb_fishing_act_common_list_req', { act_id: 1074003, value: [Number(collectedFish.fish_id)] }));
  assert.equal(response.err.err, 310);
  // Rod switch needs the rod item; 100034500 unlocks rod 3.
  response = await request(110306, 74, codec.pack('pb_fishing_act_common_req', { act_id: 1074003, value: 3 }));
  assert.equal(response.err.err, 311);
  addResource(game.store, 100034500, 1, 0);
  response = await request(110306, 75, codec.pack('pb_fishing_act_common_req', { act_id: 1074003, value: 3 }));
  assert.equal(response.err, undefined);
  const rodRow = game.store.inspect(db => db.prepare('SELECT rod,have_rod_list_json FROM fishing_activity_state WHERE act_id=?').get(1074003));
  assert.equal(rodRow.rod, '3');
  assert.deepEqual(JSON.parse(rodRow.have_rod_list_json), [1, 3]);
  // Level, codex progress and up-rank awards each pay once and keep their bits.
  game.store.inspect(db => db.prepare('UPDATE fishing_activity_state SET score=1000 WHERE act_id=?').run(1074003));
  response = await request(110307, 76, codec.pack('pb_fishing_act_common_req', { act_id: 1074003, value: 201 }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_fishing_act_data_res', Buffer.from(response.data ?? '', 'base64')).res.changes.map(change => change.tid), ['830902', '101500']);
  response = await request(110307, 77, codec.pack('pb_fishing_act_common_req', { act_id: 1074003, value: 201 }));
  assert.equal(response.err.err, 310);
  // Fish 101-105 are ordinary codex fish, which makes the five-unlock tier real.
  const fiveFish = [101, 102, 103, 104, 105].map(tid => ({ fish_id: String(tid), size: '100', score: '200' }));
  game.store.inspect(db => db.prepare('UPDATE fishing_activity_state SET high_size_list_json=? WHERE act_id=?').run(JSON.stringify(fiveFish), 1074003));
  response = await request(110310, 78, codec.pack('pb_fishing_act_common_list_req', { act_id: 1074003, value: [301] }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_fishing_act_data_res', Buffer.from(response.data ?? '', 'base64')).res.changes.map(change => [change.tid, change.diff_num]), [['101500', '1000']]);
  response = await request(110310, 79, codec.pack('pb_fishing_act_common_list_req', { act_id: 1074003, value: [301] }));
  assert.equal(response.err.err, 310);
  response = await request(110309, 80, await encodeEtf([1074003]));
  assert.equal(response.err.err, 311);
  game.store.inspect(db => db.prepare('UPDATE fishing_activity_state SET high_size=80000 WHERE act_id=?').run(1074003));
  response = await request(110309, 81, await encodeEtf([1074003]));
  assert.equal(response.err, undefined);
  const rankAward = codec.unpack('pb_fishing_act_data_res', Buffer.from(response.data ?? '', 'base64'));
  assert.equal(rankAward.data.go_rank_reward, true);
  assert.deepEqual(rankAward.res.changes.map(change => change.tid), ['101500', '392002', '391002']);
  response = await request(110309, 82, await encodeEtf([1074003]));
  assert.equal(response.err.err, 310);
  response = await request(116004, 7, codec.pack('pb_help_up_get_times_req', { act_id: 92144 }));
  // 92144 is the module-92 entry id; the command needs the act tid
  // (ActFrameTable.Act 1096001) and rejects unknown ids instead of answering 0.
  assert.equal(response.err.err, 1);
  response = await request(116001, 8, codec.pack('pb_help_up_task_reward_req', { act_id: 92144, task_id_list: [1] }));
  assert.equal(response.err.err, 1);

  // Auto-refresh shops need a decodable group even while their inventory is empty.
  response = await request(1202, 9, await encodeEtf([207, 206, 402]));
  assert.equal(response.err, undefined);
  const shops = codec.unpack('pb_query_shops_back', Buffer.from(response.data ?? '', 'base64')).shops;
  assert.deepEqual(shops.map(shop => shop.id), [207, 206, 402]);
  // 207/206 keep their auto-refresh group, and 402 is now served from the ordinary mall catalogue
  // instead of the former empty placeholder.
  assert.deepEqual(shops.map(shop => shop.items_groups.length), [1, 1, 1]);
  assert.equal(shops[2].items_groups[0].item_list.length, 28);
  const autoRefresh = codec.unpack('pb_shop_auto_refresh', Buffer.from(shops[0].items_groups[0].group_data_bin, 'base64'));
  assert.ok(Number(autoRefresh.next_refresh_time) > Math.floor(GAME_NOW / 1000));
  assert.equal(Number(autoRefresh.limit_bought_count ?? 0), 0);
  assert.deepEqual(autoRefresh.items_history_bought ?? [], []);

  // Activity synchronization cannot claim success until the request values and
  // transition rules are recovered. Captured 53001 uses a proper two-integer
  // list; tuple/invalid ETF inputs are rejected separately from unknown rules.
  const activityModulesBefore = JSON.stringify(game.store.state().modules.value.filter(([id]) => [92, 183].includes(Number(id))));
  response = await request(53002, 10, await encodeEtf([1004012]));
  assert.equal(response.err.err, 5);
  response = await request(53001, 101, await encodeEtf(new E.OtpErlangList([1, 2], false)));
  assert.equal(response.err.err, 5);
  response = await request(53001, 102, await encodeEtf([1, 2]));
  assert.equal(response.err.err, 1);
  response = await request(53001, 103, Buffer.from([131, 108]));
  assert.equal(response.err.err, 1);
  response = await request(53002, 104, Buffer.from([131, 108]));
  assert.equal(response.err.err, 1);
  assert.equal(JSON.stringify(game.store.state().modules.value.filter(([id]) => [92, 183].includes(Number(id)))), activityModulesBefore);

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
  const drawStatisticsTuple = await decodeEtf(Buffer.from(drawStatistics.data, 'base64'));
  assert.equal(drawStatisticsTuple.length, 2);
  assert.equal(drawStatisticsTuple[1], 0);
  const statisticsPush = codec.unpack('pb_count_statics_send_list', Buffer.from(drawStatisticsTuple[0].value));
  assert.equal(statisticsPush.data_list.length, 1);
  assert.equal(statisticsPush.data_list[0].stat_tid, 1);
  assert.deepEqual(statisticsPush.data_list[0].expand_id_list, ['1']);
  assert.equal(Number(statisticsPush.data_list[0].data.list.find(row => Number(row.id) === 1).total), 3);
  const achievementStatistics = codec.unpack('pb_s2c', await next());
  assert.equal(achievementStatistics.type, 2000);
  const achievementStatisticsTuple = await decodeEtf(Buffer.from(achievementStatistics.data, 'base64'));
  assert.equal(achievementStatisticsTuple.length, 2);
  assert.equal(achievementStatisticsTuple[1], 0);
  const achievementPush = codec.unpack('pb_count_statics_send_list', Buffer.from(achievementStatisticsTuple[0].value));
  assert.equal(achievementPush.data_list.length, 1);
  assert.equal(achievementPush.data_list[0].stat_tid, 75);

  // Demigod resident recruitment buys a ticket first. The client then emits
  // 601/draw_lib=226 for the actual draw and animation path.
  game.store.transaction(model => { model.resources.get('101500').num = '2000'; });
  const demigodModuleBefore = new Map(game.store.state().modules.value).get(518);
  const demigodDrawBefore = codec.unpack('pb_fantasy_draw', rawBinary(demigodModuleBefore.value[2]));
  const demigodEquipCountBefore = codec.unpack('pb_fantasy_equip_res', rawBinary(demigodModuleBefore.value[0])).equips.length;
  response = await request(87618, 17, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  const demigodPurchase = codec.unpack('pb_fantasy_equip_draw_buy_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(demigodPurchase.res.changes.map(change => [change.tid, change.diff_num]), [
    ['101500', '-400'],
    ['808002', '1']
  ]);
  const demigodTicket = codec.unpack('pb_res_obj', Buffer.from(demigodPurchase.res.changes.find(change => change.tid === '808002').new_bin, 'base64'));
  assert.equal(demigodTicket.tid, '808002');
  assert.equal(Number(demigodTicket.num ?? 0), 1);
  assert.equal(demigodPurchase.res.changes.some(change => change.extra), false);
  assert.equal(demigodPurchase.draw.left_buy_times, 9);
  assert.equal(demigodPurchase.draw.total_draw_times, demigodDrawBefore.total_draw_times);
  const demigodModule = new Map(game.store.state().modules.value).get(518);
  assert.equal(codec.unpack('pb_fantasy_draw', rawBinary(demigodModule.value[2])).total_draw_times, demigodDrawBefore.total_draw_times);
  assert.equal(codec.unpack('pb_fantasy_equip_res', rawBinary(demigodModule.value[0])).equips.length, demigodEquipCountBefore);
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
  assert.equal(missionOnly.report.finish ?? false, false);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(missionOnly.stm.stm_data, 'base64')).mission.mission_id, '30201');
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30201');
  response = await request(207, 32, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64')).stm.result, 1);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30202');
  assert.equal(game.store.read().resources.get('100012900').num, '110');

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
  assert.equal(story.mission.mission_id, '30205');
  assert.equal(story.res_change.changes.length, 0);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30205');
  response = await request(508, 13, await encodeEtf(['not-a-section']));
  assert.equal(response.err.err, 1);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30205');

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
  assert.equal(response.err, undefined);
  const repeatedBoxClaim = codec.unpack('pb_mission_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(repeatedBoxClaim.res_change.changes, []);
  assert.equal(repeatedBoxClaim.mission.box_award, boxClaim.mission.box_award);
  assert.equal(BigInt(game.store.read().resources.get('101500').num), boxDiamonds + 30n);

  // Linear task 10001 completes at journey mission 30204. The story request
  // above advances past that milestone, so claim it through the real ETF shape.
  const taskDiamonds = BigInt(game.store.read().resources.get('101500').num);
  response = await request(9010, 16, await encodeEtf([10001]));
  assert.equal(response.err, undefined);
  const taskClaim = codec.unpack('pb_linear_task_receive_back', Buffer.from(response.data, 'base64'));
  assert.deepEqual(taskClaim.task, { type: 1, receive_tid: 10001 });
  assert.equal(taskClaim.res_change.changes.find(change => change.tid === '101500').diff_num, '50');
  assert.equal(BigInt(game.store.read().resources.get('101500').num), taskDiamonds + 50n);
  const taskModule = codec.unpack('pb_linear_task_data', rawBinary(new Map(game.store.state().modules.value).get(90).value[4]));
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

test('gateway serves meal, stamina exchange and chapter pass on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-mission-extra-'));
  const databasePath = path.join(directory, 'game.sqlite');
  // 13:00 server time opens the 12-16 MealAward window.
  let gameNow = new Date(2026, 9, 24, 13, 0, 0, 0).getTime();
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => gameNow,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  addResource(game.store, 122702, 0);
  addResource(game.store, 100012900, 100);
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

  // 504 free meal: one parcel per window, then an explicit duplicate-claim error.
  let response = await request(504, 2, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  const meal = codec.unpack('pb_mission_meal_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(meal.res_change.changes.map(change => [change.tid, change.diff_num]), [['122702', '3']]);
  assert.equal(new Date(Number(meal.meal.last_refresh_stamp) * 1000).getHours(), 0);
  assert.equal(Buffer.from((await decodeEtf(Buffer.from(meal.meal.got_award, 'base64'))).value)[0], 0x40);
  response = await request(504, 3, await encodeEtf([1]));
  assert.equal(response.err.err, 310);

  // 505 stamina exchange spends one meal item and grants fifty stamina.
  response = await request(505, 4, await encodeEtf([100012900]));
  assert.equal(response.err, undefined);
  const exchanged = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64'));
  assert.deepEqual(exchanged.changes.map(change => [change.tid, change.diff_num]), [['122702', '-1'], ['100012900', '50']]);
  assert.equal(game.store.read().resources.get('100012900').num, '150');

  // 511 chapter pass refuses an unfinished chapter and records it once.
  response = await request(511, 5, await encodeEtf([3]));
  assert.equal(response.err.err, 5);
  setMission(game.store, 40201);
  response = await request(511, 6, await encodeEtf([3]));
  assert.equal(response.err, undefined);
  assert.deepEqual(await decodeEtf(Buffer.from(response.data, 'base64')), [3, 0]);
  response = await request(511, 7, await encodeEtf([3]));
  assert.deepEqual(await decodeEtf(Buffer.from(response.data, 'base64')), [3, 1]);

  // 509 one-key box rewards answer with the shared bitmap shape.
  setMission(game.store, 50201);
  response = await request(509, 8, codec.pack('pb_mission_one_key_reward_req', { box_tids: [1], common_task_tids: [] }));
  assert.equal(response.err, undefined);
  const oneKey = codec.unpack('pb_mission_one_key_reward_rsp', Buffer.from(response.data, 'base64'));
  assert.ok(oneKey.res_change.changes.length > 0);
  response = await request(509, 9, codec.pack('pb_mission_one_key_reward_req', { box_tids: [1], common_task_tids: [3] }));
  assert.equal(response.err.err, 5);
});


test('gateway claims a destiny-stage linear task through 9010 and persists it across restart', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-destiny-linear-task-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_NOW
  };
  let game = createLocalGame(options), socket;
  t.after(async () => {
    socket?.destroy();
    if (game) await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  setDestiny(game.store, { cur_stage: 2, slot_state: Buffer.alloc(13) });
  const diamondsBefore = BigInt(game.store.read().resources.get('201500').num);
  const response = await request(9010, 2, await encodeEtf([10004]));
  assert.equal(response.err, undefined);
  const claim = codec.unpack('pb_linear_task_receive_back', Buffer.from(response.data, 'base64'));
  assert.deepEqual(claim.task, { type: 1, receive_tid: 10004 });
  assert.deepEqual(claim.res_change.changes.map(change => [change.tid, change.diff_num]), [['201500', '2000']]);
  assert.equal(BigInt(game.store.read().resources.get('201500').num), diamondsBefore + 2000n);
  assert.deepEqual(storedLinearTask(game.store).task_list, [{ type: 1, receive_tid: 10004 }]);
  assert.equal(game.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='linear_task' AND claim_key='10004'").get().n), 1);

  let delivered = await decodeEtf(await game.loginPayload());
  assert.deepEqual(storedLinearTask(game.store).task_list, [{ type: 1, receive_tid: 10004 }]);
  assert.equal(codec.unpack('pb_linear_task_data', loginModuleBytes(delivered, 90, 4)).task_list.find(task => task.type === 1).receive_tid, 10004);
  assert.equal(codec.unpack('pb_destiny_data', loginModuleBytes(delivered, 107)).cur_stage, 2);

  socket.destroy(); socket = null;
  await game.close(); game = null;
  game = createLocalGame(options);
  delivered = await decodeEtf(await game.loginPayload());
  assert.equal(codec.unpack('pb_linear_task_data', loginModuleBytes(delivered, 90, 4)).task_list.find(task => task.type === 1).receive_tid, 10004);
  assert.equal(codec.unpack('pb_destiny_data', loginModuleBytes(delivered, 107)).cur_stage, 2);
  assert.equal(BigInt(game.store.read().resources.get('201500').num), diamondsBefore + 2000n);
});

test('all-open mode returns every stored activity and forces test-visible states', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-all-open-'));
  const databasePath = path.join(directory, 'game.sqlite');
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

  const state = game.store.state();
  const stored = codec.unpack('pb_act_login', rawBinary(new Map(state.modules.value).get(92)));
  const storedIds = [
    ...stored.act_list.map(entry => Number(entry.state_data?.act_id)),
    ...stored.act_parallel_list.flatMap(group => group.states_data.map(entry => Number(entry.act_id)))
  ];
  const payload = await game.loginPayload();
  const serverInfo = await loginModule(payload, 1);
  assert.equal(Number(serverInfo[4]), SERVER_OPENED_AT);
  assert.notEqual(Number(serverInfo[4]), state.createdAt);
  const activity = await loginActivities(payload);
  const returnedIds = new Set([
    ...activity.act_list.map(entry => Number(entry.state_data?.act_id)),
    ...activity.act_parallel_list.flatMap(group => group.states_data.map(entry => Number(entry.act_id)))
  ]);

  assert.equal(game.calendar.mode, 'all-open');
  assert.equal(activity.act_pause_list.length, 0);
  assert.ok(activity.act_list.every(entry => Number(entry.state_data?.cur_state_id) === 50));
  assert.ok(activity.act_parallel_list.every(group => group.states_data.every(entry => Number(entry.cur_state_id) === 50)));
  const current = SERVER_OPENED_AT + 7 * 86400;
  assert.ok(activity.act_custom_list.length > 0);
  assert.ok(activity.act_custom_list.every(entry => (
    Number(entry.start_time) <= current && current < Number(entry.end_time)
  )));
  assert.ok(storedIds.every(id => returnedIds.has(id)));
  assert.equal(returnedIds.has(83028), true);
  assert.equal(returnedIds.has(1074011), true);

  const firstWindows = activity.act_custom_list.map(entry => [Number(entry.act_id), Number(entry.start_time), Number(entry.end_time)]);
  const activityAgain = await loginActivities(await game.loginPayload());
  assert.deepEqual(
    activityAgain.act_custom_list.map(entry => [Number(entry.act_id), Number(entry.start_time), Number(entry.end_time)]),
    firstWindows
  );
});

test('leader equipment wear equips gear through the gateway and persists it', { timeout: 10000 }, async t => {
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

  const uid = '910001';
  let previousEquip;
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(175);
    const data = module && module.value?.data?.length
      ? codec.unpack('pb_leader_equips_data', rawBinary(module))
      : { slots: [], equip_list: [], max_uid: '0', draw_info: { lv: 1 }, dismiss: '' };
    data.slots = Array.isArray(data.slots) ? data.slots : [];
    data.equip_list = Array.isArray(data.equip_list) ? data.equip_list : [];
    const oldSlot = data.slots.find(slot => Number(slot.type) === 1);
    previousEquip = oldSlot?.equip;
    if (previousEquip) data.equip_list.push(previousEquip);
    data.slots = data.slots.filter(slot => Number(slot.type) !== 1);
    data.equip_list = data.equip_list.filter(equip => String(equip.uid) !== uid);
    data.equip_list.push({ tid: '2001018', uid, star: 0, level: 1, intensify_info: { intensify_level: 0, intensify_times: 0 } });
    data.max_uid = '910001';
    modules.set(175, serializedBinary(codec.pack('pb_leader_equips_data', data)));
    model.state.modules.value = [...modules];
  });

  const response = await request(98401, 2, codec.pack('pb_leader_equip_wear_req', { wear_list: [{ uid, type: 1 }] }));
  assert.equal(response.err, undefined);
  const back = codec.unpack('pb_leader_equip_wear_back', Buffer.from(response.data, 'base64'));
  assert.equal(back.slots.length, 1);
  assert.equal(back.slots[0].type, 1);
  assert.equal(back.slots[0].equip.uid, uid);
  assert.equal(back.slots[0].equip.tid, '2001018');
  assert.deepEqual(back.sub_equip_list.map(equip => equip.uid), [uid]);
  assert.deepEqual(back.add_equip_list.map(equip => equip.uid), previousEquip ? [String(previousEquip.uid)] : []);

  const after = codec.unpack('pb_leader_equips_data', rawBinary(new Map(game.store.state().modules.value).get(175)));
  assert.equal(after.equip_list.some(equip => String(equip.uid) === uid), false);
  assert.deepEqual(after.slots.find(slot => Number(slot.type) === 1), back.slots[0]);

  assert.equal(events.some(event => event.event === 'unsupported_command' && event.type === 98401), false);
  const committed = events.find(event => event.event === 'leader_equip_wear_committed');
  assert.ok(committed?.connection);
  assert.deepEqual({ type: committed.type, seq: committed.seq, slotTypes: committed.slotTypes, subUids: committed.subUids }, {
    type: 98401, seq: 2, slotTypes: [1], subUids: [uid]
  });
});

test('cabin unlock, hero placement and atomic swap use real gateway framing and persist module 114', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-cabin-gateway-'));
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

  game.store.transaction(model => { model.role.level = 46; });
  addResource(game.store, '101500', 1000);
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
  const loginValue = await decodeEtf(Buffer.from(login.data, 'base64'));
  const cabin = codec.unpack('pb_campsite_data', loginModuleBytes(loginValue, 114));
  assert.deepEqual(cabin.groups_data.map(group => Number(group.group_id)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(Buffer.from(cabin.groups_data[0].cell_states, 'base64').toString('hex'), '70');

  let response = await request(83201, 2, await encodeEtf([1, 4]));
  assert.equal(response.err, undefined);
  const changes = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.deepEqual(changes.map(change => [change.tid, change.diff_num]), [['101500', '-1000']]);
  assert.equal(game.store.read().resources.get('101500').num, '0');

  response = await request(83202, 3, codec.pack('pb_campsite_place', {
    place_groups: [{ group_id: 1, cell_index_list: [1], hero_uid_list: ['1020601'] }]
  }));
  assert.equal(response.err, undefined);
  const placed = codec.unpack('pb_campsite_data', Buffer.from(response.data, 'base64'));
  assert.deepEqual(placed.groups_data[0].hero_list, ['1020601', '0', '0', '0']);
  const persisted = codec.unpack('pb_campsite_data', rawBinary(new Map(game.store.state().modules.value).get(114)));
  const group = persisted.groups_data.find(value => Number(value.group_id) === 1);
  assert.equal(Buffer.from(group.cell_states, 'base64').toString('hex'), '78');
  assert.deepEqual(group.hero_list, ['1020601', '0', '0', '0']);

  response = await request(83202, 4, codec.pack('pb_campsite_place', {
    place_groups: [{ group_id: 1, cell_index_list: [2], hero_uid_list: ['1020301'] }]
  }));
  assert.equal(response.err, undefined);

  response = await request(83202, 5, codec.pack('pb_campsite_place', {
    place_groups: [{ group_id: 1, cell_index_list: [1, 2], hero_uid_list: ['1020301', '1020601'] }]
  }));
  assert.equal(response.err, undefined);
  const swapped = codec.unpack('pb_campsite_data', Buffer.from(response.data, 'base64'));
  assert.deepEqual(swapped.groups_data[0].hero_list, ['1020301', '1020601', '0', '0']);
  const swappedPersisted = codec.unpack('pb_campsite_data', rawBinary(new Map(game.store.state().modules.value).get(114)));
  const swappedGroup = swappedPersisted.groups_data.find(value => Number(value.group_id) === 1);
  assert.deepEqual(swappedGroup.hero_list, ['1020301', '1020601', '0', '0']);

  assert.equal(events.some(event => event.event === 'unsupported_command' && [83201, 83202].includes(event.type)), false);
  assert.deepEqual(events.filter(event => event.event === 'cabin_committed').map(event => event.type), [83201, 83202, 83202, 83202]);
});

test('gateway draws WishTree rebates over real TCP, persists them, and rejects a second empty quota', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-wish-tree-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const wishNow = Date.parse('2026-10-31T06:00:00.000Z');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => wishNow
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

  const module165 = codec.unpack('pb_wish_tree_new', loginModuleBytes(await decodeEtf(Buffer.from(login.data, 'base64')), 165));
  assert.equal(Number(module165.data_list.find(row => Number(row.type) === 2)?.can_wish_count ?? 0), 0);

  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const info = codec.unpack('pb_wish_tree_new', rawBinary(modules.get(165)));
    info.data_list.find(row => Number(row.type) === 2).can_wish_count = '1';
    modules.set(165, serializedBinary(codec.pack('pb_wish_tree_new', info)));
    model.state.modules.value = [...modules];
  });

  let response = await request(91701, 90, await encodeEtf([2]));
  assert.equal(response.err, undefined);
  const drawn = codec.unpack('pb_wish_tree_draw_back', Buffer.from(response.data, 'base64'));
  assert.equal(drawn.award_tid, 2003);
  assert.equal(drawn.tree_data.type, '2');
  assert.equal(drawn.tree_data.normal_times, '1');
  assert.equal(Number(drawn.tree_data.can_wish_count ?? 0), 0);
  assert.equal(drawn.res.changes.find(change => change.tid === '3002').diff_num, '5');

  response = await request(91701, 91, await encodeEtf([2]));
  assert.equal(response.err.err, 310);
  assert.equal(response.err.stacktrace, undefined);

  const persistedLogin = await decodeEtf(await game.loginPayload());
  const persisted = codec.unpack('pb_wish_tree_new', loginModuleBytes(persistedLogin, 165));
  const persistedRow = persisted.data_list.find(row => Number(row.type) === 2);
  assert.equal(persistedRow.normal_times, '1');
  assert.equal(Number(persistedRow.can_wish_count ?? 0), 0);
  assert.ok(Buffer.from(persistedRow.normal_bin, 'base64')[0] & 0x10);
});
