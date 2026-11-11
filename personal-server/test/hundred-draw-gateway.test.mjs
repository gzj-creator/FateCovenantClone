import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { decodeModuleLoginBlocks } from '../game/relic-divine-login.mjs';

const codec = createGameCodec();
const NOW = Date.UTC(2026, 9, 29, 4, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);

test('HundredDrawActCmd 117001-117005 use the real handshake and SQLite state', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-draw-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    serverOpenedAt: OPENED_AT,
    now: () => NOW,
    random: () => 0.999999
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  game.store.transaction(model => grantResources(model, [[835802, 1000]], game.tables));
  game.store.transaction(model => {
    if (!model.heroInfo.hero_list.some(entry => Number(entry.tid) === 5040701)) {
      model.heroInfo.hero_list.push({
        tid: '5040701', uid: '5040701', level: 1, star: 10, star_progress: 0,
        breakthrough_level: 0, quality: 70
      });
    }
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  const payloadOf = reply => Buffer.from(reply.data ?? '', 'base64');

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginModuleEntries = (await decodeEtf(payloadOf(login)))[2].value;
  const loginModules = new Map(loginModuleEntries.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
  const module92 = loginModules.get(92);
  assert.ok(module92, `login module 92 missing; got ${[...loginModules.keys()].join(',')}`);
  const activityLogin = codec.unpack('pb_act_login', Array.from(module92.value));
  const hundredEntry = activityLogin.act_list.find(entry => Number(entry.state_data?.act_id) === 1102001);
  assert.ok(hundredEntry);
  // 模块 92 的 module_login_data 必须是 ETF BINARY（0x83 0x6d）包装，客户端
  // ActivityMgr 先 DecodeErl 再交给 HundredDrawActData:LoginParse。
  const hundredBlocks = decodeModuleLoginBlocks(hundredEntry.module_login_data);
  assert.equal(hundredBlocks.length, 1);
  const hundredLoginData = codec.unpack('pb_hundred_draw_act_data', hundredBlocks[0]);
  assert.equal(hundredLoginData.act_id, '1102001');
  assert.equal(hundredLoginData.select_target_tid, '5040701');
  assert.equal(Number(hundredLoginData.guarantee_times ?? 0), 0);

  // ActFrame 行同样携带同一份登录块，避免模块 183 只有空 module_login_data。
  const module183 = loginModules.get(183);
  assert.ok(module183, `login module 183 missing; got ${[...loginModules.keys()].join(',')}`);
  const actFramePlayer = codec.unpack('pb_act_role_login', Buffer.from(module183.value[0].value));
  const hundredActFrameRow = actFramePlayer.data_list.find(row => Number(row.act_stage?.act_id) === 1102001);
  assert.ok(hundredActFrameRow);
  const actFrameBlocks = decodeModuleLoginBlocks(hundredActFrameRow.module_login_data);
  assert.equal(codec.unpack('pb_hundred_draw_act_data', actFrameBlocks[0]).select_target_tid, '5040701');

  const draw = await request(117001, 2, codec.pack('pb_hundred_act_draw_req', { act_id: 1102001, times: 50 }));
  assert.equal(draw.err, undefined);
  const drawBody = codec.unpack('pb_hundred_act_draw_rsp', payloadOf(draw));
  assert.equal(drawBody.act_data.cumulative_draw_times, '50');
  assert.equal(drawBody.res.changes.some(row => row.tid === '835802' && row.diff_num === '-50'), true);

  const claim = await request(117002, 3, codec.pack('pb_hundred_act_receive_process_award_req', { act_id: 1102001, tid_list: [10101] }));
  assert.equal(claim.err, undefined);
  assert.equal(codec.unpack('pb_hundred_act_receive_process_award_rsp', payloadOf(claim)).res.changes.find(row => row.tid === '101500').diff_num, '500');

  const select = await request(117003, 4, codec.pack('pb_hundred_draw_act_select_award_req', { act_id: 1102009, target_tid: 5040701 }));
  assert.equal(select.err, undefined);
  assert.equal(codec.unpack('pb_hundred_draw_act_select_award_rsp', payloadOf(select)).act_data.select_target_tid, '5040701');

  const star = await request(117004, 5, codec.pack('pb_hundred_draw_act_rec_star_award_req', { act_id: 1102001, tid_list: [10104] }));
  assert.equal(star.err, undefined);
  assert.equal(codec.unpack('pb_hundred_draw_act_rec_star_award_rsp', payloadOf(star)).act_data.received_star_tid_list[0], '10104');

  const marquee = await request(117005, 6, codec.pack('pb_hundred_draw_act_marquee_req', { act_id: 1102001, start_range: 1, end_range: 10 }));
  assert.equal(marquee.err, undefined);
  assert.deepEqual(codec.unpack('pb_hundred_draw_act_marquee_rsp', payloadOf(marquee)).data.data, []);
});
