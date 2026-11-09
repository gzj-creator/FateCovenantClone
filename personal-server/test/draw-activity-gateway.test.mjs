import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { decodeModuleLoginBlocks } from '../game/relic-divine-login.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const openedAt = 1792789200;

test('draw activities complete over temporary TCP and persist against SQLite', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-draw-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: openedAt,
    now: () => (openedAt + 3600) * 1000,
    random: () => 0
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  game.store.transaction(model => grantResources(model, [[820202, 50], [816002, 100]], tables));

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
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  let response = await request(104501, 2, codec.pack('pb_request_thousand_draw', { type: 1 }));
  assert.equal(response.err, undefined);
  const thousand = codec.unpack('pb_response_thousand_draw', Buffer.from(response.data, 'base64'));
  assert.equal(thousand.role_info.round, '1');
  assert.ok(thousand.role_info.type_info_list[0].award_list.length > 0);

  response = await request(104502, 3, codec.pack('pb_request_thousand_award', { type: 1 }));
  assert.equal(response.err, undefined);
  const claimedThousand = codec.unpack('pb_response_thousand_award', Buffer.from(response.data, 'base64'));
  assert.equal(claimedThousand.res.changes.length, 1);

  response = await request(109101, 4, codec.pack('pb_flop_card_act_flop_req', { activity_id: 1, flop_type: 1 }));
  assert.equal(response.err, undefined);
  const flop = codec.unpack('pb_flop_card_act_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(flop.act_info.total_count, 1);
  assert.equal(flop.res.changes.find(change => change.tid === '820202').diff_num, '-3');

  response = await request(109102, 5, codec.pack('pb_flop_card_act_get_reward_req', { activity_id: 1 }));
  assert.equal(response.err, undefined);
  assert.ok(codec.unpack('pb_flop_card_act_rsp', Buffer.from(response.data, 'base64')).res.changes.length > 0);

  response = await request(105502, 6, codec.pack('pb_cashback_draw_get_times_req', { activity_id: 1 }));
  assert.equal(response.err?.err, 5);

  response = await request(104901, 7, codec.pack('pb_pray_act_select_award_req', {
    act_tid: 183013,
    index_award_list: [
      { pray_index_tid: 61, award_tid: 242 },
      { pray_index_tid: 62, award_tid: 244 },
      { pray_index_tid: 63, award_tid: 248 },
      { pray_index_tid: 64, award_tid: 252 },
      { pray_index_tid: 65, award_tid: 256 }
    ]
  }));
  assert.equal(response.err, undefined);
  response = await request(104902, 8, codec.pack('pb_pray_act_draw_award_req', { act_tid: 183013, cnt: 50 }));
  assert.equal(response.err, undefined);
  const prayer = codec.unpack('pb_pray_act_draw_award_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(prayer.pray_act_info.act_tid, '183013');
  assert.deepEqual(prayer.pray_act_info.pray_list.map(index => Number(index.draw_cnt)), [50, 50, 50, 50, 50]);
  assert.equal(prayer.draw_critical_list.length, 50);
  assert.deepEqual(prayer.draw_critical_list[0].draw_info.map(info => Number(info.pray_index)), [61, 62, 63, 64, 65]);

  const relogin = await decodeEtf(await game.loginPayload());
  const reloginModules = new Map(relogin[2].value.map(([id, entry]) => [Number(id), entry]));
  const player = codec.unpack('pb_act_role_login', Buffer.from(reloginModules.get(183).value[0].value));
  const prayerRow = player.data_list.find(row => Number(row.act_stage?.act_id) === 183013);
  const restored = codec.unpack(
    'pb_pray_act', decodeModuleLoginBlocks(prayerRow.module_login_data)[0]
  );
  assert.equal(restored.act_tid, '183013');
  const restoredIndex = restored.pray_list.find(row => Number(row.pray_index_tid) === 61);
  assert.equal(restoredIndex.select_award_tid, '242');
  assert.equal(restoredIndex.draw_cnt, '50');
  assert.equal(restoredIndex.pray_award_info_list[0].history_cnt, '1');
  assert.deepEqual(restored.pray_list.map(index => Number(index.draw_cnt)), [50, 50, 50, 50, 50]);
  assert.equal(game.store.inspect(db => db.prepare(
    "SELECT version FROM draw_activity_state WHERE module='pray_act'"
  ).get().version), 13);
  assert.equal(game.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM draw_activity_state WHERE module='flop_card'").get().n), 1);
});
