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

test('gateway serves mission fights, box opening and activity reads on a temporary port', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-gameplay-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  const game = createLocalGame({ databasePath, statePath: path.join(directory, 'absent.json'), capturePath, missionFightPlayback: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session' });
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
  assert.equal(codec.unpack('mission_to_client', Buffer.from(fight.stm.stm_data, 'base64')).mission.mission_id, '30201');
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30201');
  response = await request(207, 3, codec.pack('pb_fight_settlement_request', { fight_type: 1 }));
  assert.equal(codec.unpack('pb_fight_settlement_response', Buffer.from(response.data, 'base64')).stm.result, 1);
  assert.equal(codec.unpack('pb_mission', rawBinary(new Map(game.store.state().modules.value).get(8).value[0])).mission_id, '30201');

  // Backpack box: the configured draw library replaces the previously unsupported command.
  response = await request(159, 4, codec.pack('pb_one_key_use', { use: [{ tid: 2261200, num: 1 }] }));
  assert.equal(response.err, undefined);
  const changes = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64')).changes;
  assert.equal(changes.find(change => change.tid === '2261200').diff_num, '-1');
  // An unverified box rule is refused with a business error instead of a fake success.
  response = await request(159, 5, codec.pack('pb_one_key_use', { use: [{ tid: 11200, num: 1 }] }));
  assert.equal(response.err.err, 5);

  // Activity reads answer, activity mutations stay refused.
  response = await request(110308, 6, Buffer.alloc(0));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_fishing_act_get_record_rsp', Buffer.from(response.data ?? '', 'base64')).record_list, []);
  response = await request(116004, 7, codec.pack('pb_help_up_get_times_req', { act_id: 92144 }));
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', Buffer.from(response.data ?? '', 'base64')).times ?? 0), 0);
  response = await request(116001, 8, codec.pack('pb_help_up_task_reward_req', { act_id: 92144, task_id_list: [1] }));
  assert.equal(response.err.err, 5);

  // Hall entry asks for shop ids: answer the requested ids with empty local groups.
  response = await request(1202, 9, await encodeEtf([207, 206]));
  assert.equal(response.err, undefined);
  const shops = codec.unpack('pb_query_shops_back', Buffer.from(response.data ?? '', 'base64')).shops;
  assert.deepEqual(shops.map(shop => shop.id), [207, 206]);
  assert.deepEqual(shops.map(shop => shop.items_groups.length), [0, 0]);

  // Activity stage sync is acknowledged with the empty change list instead of an error.
  response = await request(53002, 10, await encodeEtf([1004012]));
  assert.equal(response.err, undefined);

  // The real MissionUIMgr encoder omits chapter_tid/section_idx; mission_id alone must settle.
  response = await request(201, 11, codec.pack('pb_fight_request', {
    fight_tid: 302, stm_type: 0,
    req: codec.pack('mission_fight_req', { mission_id: 30202, is_assistant: true })
  }));
  assert.equal(response.err, undefined);
  const missionOnly = codec.unpack('pb_fight_response', Buffer.from(response.data, 'base64'));
  assert.equal(missionOnly.report.finish, true);
  assert.equal(codec.unpack('mission_to_client', Buffer.from(missionOnly.stm.stm_data, 'base64')).mission.mission_id, '30202');

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

  // Chapter completion asks which recommended gifts are active. Echo the
  // observed request as zero-purchase counts instead of failing the callback.
  response = await request(85901, 14, codec.pack('pb_recommend_gift_active_req', { actives: [{ act_tid: 61070, gift_id: [2811, 2812, 2813] }] }));
  assert.equal(response.err, undefined);
  const gift = codec.unpack('pb_recommend_gift_active_rsp', Buffer.from(response.data, 'base64')).gift_list[0];
  assert.equal(gift.act_tid, 61070);
  assert.deepEqual(gift.buy_list.map(entry => entry.recharge_tid), [2811, 2812, 2813]);
  assert.ok(gift.buy_list.every(entry => !entry.buy_times));
});
