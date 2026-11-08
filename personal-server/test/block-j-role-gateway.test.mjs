import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const NOW_SECONDS = SERVER_OPENED_AT + 3600;
const NOW = NOW_SECONDS * 1000;

function createTemporaryGame(databasePath, statePath) {
  return createLocalGame({
    databasePath,
    statePath,
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => NOW,
    random: () => 0.5
  });
}

async function connectAndLogin(game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const decoded = await decodeEtf(Buffer.from(login.data, 'base64'));
  return { socket, send, request, next, login: decoded };
}

function loginModuleBytes(login, moduleId, slot = null) {
  const entry = new Map(login[2].value).get(moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  const value = entry.value ?? entry;
  const selected = Array.isArray(value) && slot !== null ? value[slot] : value;
  assert.ok(selected, `login module ${moduleId} has slot ${slot}`);
  return Buffer.isBuffer(selected) ? Buffer.from(selected) : Buffer.from(selected.value ?? selected);
}

function activityIds(login) {
  const activity = codec.unpack('pb_act_login', loginModuleBytes(login, 92));
  const ids = [
    ...(activity.act_list ?? []).map(row => Number(row.state_data?.act_id)),
    ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(row => Number(row.act_id)))
  ];
  return [...new Set(ids.filter(value => Number.isSafeInteger(value) && value > 0))];
}

test('block J role/support commands survive real loopback framing and SQLite reopen', { timeout: 20000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-block-j-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'absent.json');
  let game = createTemporaryGame(databasePath, statePath);
  let connection;
  t.after(async () => {
    connection?.socket.destroy();
    if (game) await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  connection = await connectAndLogin(game);
  const roleId = String(game.store.read().state.roleId);
  const initialRed = codec.unpack('all_saved_red', loginModuleBytes(connection.login, 4));
  const initialPush = codec.unpack('pb_channel_push_param', loginModuleBytes(connection.login, 173));
  const initialStory = codec.unpack('story_data', loginModuleBytes(connection.login, 88, 1));
  assert.deepEqual(initialRed.saved_red_list, []);
  assert.deepEqual(initialPush.open_list, []);
  assert.ok(Array.isArray(initialStory.finish_story_list));

  const ids = activityIds(connection.login);
  assert.ok(ids.length >= 2);
  const visibleIds = ids.slice(0, 2);

  // These client commands use Seq:Send/Cast without callbacks. The following
  // 53006 must be the next frame on the stream and must answer only its ETF.
  const redPayload = codec.pack('red_change_info', {
    to_add_or_change_list: [{
      state: true,
      path_bin: Buffer.from('role/support/red'),
      show_count: 2,
      extra: Buffer.from([7, 8])
    }],
    to_del_list: []
  });
  connection.send(codec.pack('pb_c2s', { type: 39001, seq: 2, data: redPayload }));
  connection.send(codec.pack('pb_c2s', { type: 304, seq: 3, data: await encodeEtf([2001]) }));
  connection.send(codec.pack('pb_c2s', { type: 305, seq: 4, data: await encodeEtf([2002]) }));
  connection.send(codec.pack('pb_c2s', {
    type: 98201,
    seq: 5,
    data: codec.pack('pb_channel_push_open', { message_id: 7, is_open: true })
  }));
  const flushed = await connection.request(53006, 6, await encodeEtf(visibleIds));
  assert.equal(flushed.seq, 6, 'one-way commands must not inject an empty ETF or protobuf response');
  assert.deepEqual(
    codec.unpack('pb_act_frame_stage_push', Buffer.from(flushed.data, 'base64')).act_stage_list.map(row => Number(row.act_id)),
    visibleIds
  );

  const activityResponse = await connection.request(53001, 7, await encodeEtf([ids[0]]));
  assert.equal(activityResponse.err, undefined);
  const activityChanges = codec.unpack('pb_act_state_change_back', Buffer.from(activityResponse.data, 'base64')).change_back_data;
  assert.ok(activityChanges.length > 0);
  assert.ok(activityChanges.every(row => row.id === ids[0]));

  // The shipped SkinDrawMgr sends an empty 76005 without first sending 76004.
  // Fail closed rather than guessing a skin from pending or ownership state.
  const emptyExchange = await connection.request(76005, 8, await encodeEtf([]));
  assert.equal(emptyExchange.err.err, 1);

  game.store.transaction(model => grantResources(model, [[2701900, 1]], game.tables));
  connection.send(codec.pack('pb_c2s', { type: 76004, seq: 9, data: await encodeEtf([100712]) }));
  const exchanged = await connection.request(76005, 10, await encodeEtf([100712]));
  assert.equal(exchanged.err, undefined);
  const exchangeChanges = codec.unpack('pb_res_to_client', Buffer.from(exchanged.data, 'base64')).changes;
  assert.deepEqual(exchangeChanges.map(row => [row.tid, row.diff_num]), [['2701900', '-1'], ['100712', '1']]);

  const playerData = await connection.request(161, 11, codec.pack('pb_function_cache_req', {
    type: 5,
    item_list: [{ id: roleId, block_id_list: [1, 4, 24] }]
  }));
  assert.equal(playerData.err, undefined);
  const cache = codec.unpack('pb_function_cache_back', Buffer.from(playerData.data, 'base64'));
  assert.deepEqual(cache.item_list[0].block_list.map(row => row.block_id), [1, 4, 24]);
  const player = codec.unpack('pb_player_info', Buffer.from(cache.item_list[0].block_list[0].block_bin, 'base64'));
  assert.equal(player.id, roleId);
  const fashion = cache.item_list[0].block_list.find(row => row.block_id === 24);
  assert.equal(await decodeEtf(Buffer.from(fashion.block_bin, 'base64')), 0);

  game.store.transaction(model => grantResources(model, [[628002, 3]], game.tables));
  const increased = await connection.request(76009, 12, await encodeEtf([100712]));
  assert.equal(increased.err, undefined);
  const increaseBack = codec.unpack('pb_skin_increase_back', Buffer.from(increased.data, 'base64'));
  assert.equal(increaseBack.skin_info.increase_level, 1);
  assert.deepEqual(increaseBack.res.changes.map(row => [row.tid, row.diff_num]), [['628002', '-3']]);

  connection.socket.destroy();
  await game.close();
  game = null;

  game = createTemporaryGame(databasePath, statePath);
  connection = await connectAndLogin(game);
  const reopenedRed = codec.unpack('all_saved_red', loginModuleBytes(connection.login, 4));
  const reopenedPush = codec.unpack('pb_channel_push_param', loginModuleBytes(connection.login, 173));
  const reopenedStory = codec.unpack('story_data', loginModuleBytes(connection.login, 88, 1));
  const reopenedSkins = codec.unpack('pb_skin_info', loginModuleBytes(connection.login, 65, 0)).skin_list;
  assert.deepEqual(
    reopenedRed.saved_red_list.map(row => Buffer.from(row.path_bin, 'base64').toString('utf8')),
    ['role/support/red']
  );
  assert.deepEqual(reopenedPush.open_list.map(row => [row.message_id, row.is_open]), [[7, true]]);
  assert.equal(reopenedStory.finish_story_list.includes(2001), true);
  assert.equal(reopenedStory.finish_story_list.includes(2002), false);
  assert.equal(reopenedSkins.find(row => Number(row.id) === 100712).increase_level, 1);
  const skinRow = game.store.inspect(db => db.prepare('SELECT skin_tid,increase_level FROM role_skins WHERE role_id=?').get(game.store.read().state.roleId));
  assert.deepEqual({ skin_tid: skinRow.skin_tid, increase_level: skinRow.increase_level }, { skin_tid: 100712, increase_level: 1 });
});
