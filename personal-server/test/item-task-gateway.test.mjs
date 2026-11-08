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
import { readGameTables } from '../config/game-tables.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const NOW = Date.UTC(2026, 9, 26, 0, 0, 0);
const OPENED_AT = Math.floor(Date.parse('2026-10-24T05:00:00+08:00') / 1000);
const roleStatistics = [...gameTables.CountStatistics.values()]
  .filter(row => !row.custom_login && Number(row.type) === 0);

function setStatistic(store, statisticType, id, total) {
  const index = roleStatistics.findIndex(row => Number(row.tid) === statisticType);
  assert.ok(index >= 0, `statistics slot ${statisticType} exists`);
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(21);
    module.value[index + 1] = serializedBinary(codec.pack('pb_count_statics_data', {
      list: [{ id: String(id), total: String(total) }]
    }));
    modules.set(21, module);
    model.state.modules.value = [...modules];
  });
}

// Login modules arrive as ETF binaries; the decoded shape wraps the bytes in a
// plain {value: Buffer} while an untouched entry is still an E.OtpErlangBinary.
function bytesOf(entry) {
  if (entry == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(entry)) return entry;
  if (typeof entry === 'string') return Buffer.from(entry, 'base64');
  if (Buffer.isBuffer(entry.value)) return entry.value;
  if (Buffer.isBuffer(entry.value?.data)) return entry.value.data;
  return Buffer.alloc(0);
}

test('FunctionManualCmd 82301 and TaskActivityCmd 105701 share the temporary handshake', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-item-task-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    now: () => NOW
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

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

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  const decodedLogin = await decodeEtf(Buffer.from(login.data, 'base64'));
  const modules = new Map(decodedLogin[2].value.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
  assert.ok(modules.has(106), `login module ids: ${[...modules.keys()].join(',')}`);
  const manualModule = modules.get(106);
  // An empty claim bit block packs to zero bytes, so the module entry may carry
  // an empty binary; an empty protobuf message decodes to its defaults.
  const manualBytes = bytesOf(manualModule);
  const manual = manualBytes.length ? codec.unpack('pb_function_manual', manualBytes) : {};
  assert.equal(Buffer.from(manual.got_award ?? '', 'base64').length, 0);

  const activityLogin = codec.unpack('pb_act_login', bytesOf(modules.get(92)));
  const taskActivityEntry = activityLogin.act_list.find(entry => Number(entry.state_data?.act_id) === 1003001);
  assert.ok(taskActivityEntry, 'task activity login entry is present');
  const wrapped = Buffer.from(taskActivityEntry.module_login_data, 'base64');
  const taskActivityRole = codec.unpack('pb_task_activity_role_info', wrapped.subarray(6));
  assert.equal(taskActivityRole.act_list.length, 1);
  assert.equal(Number(taskActivityRole.act_list[0].version), 1);

  setStatistic(game.store, 1, 2, 20);
  const claim = await request(82301, 2, await encodeEtf([3]));
  assert.equal(claim.err, undefined);
  const claimResponse = codec.unpack('pb_function_manual_award_rsp', Buffer.from(claim.data, 'base64'));
  assert.equal(claimResponse.res_change.changes.find(row => row.tid === '201500').diff_num, '10000');
  assert.ok(Buffer.from(claimResponse.got_award ?? '', 'base64').length > 0);
  const repeated = await request(82301, 3, await encodeEtf([3]));
  assert.equal(repeated.err.err, 310);
  const gated = await request(82301, 4, await encodeEtf([1]));
  assert.equal(gated.err.err, 5);

  setStatistic(game.store, 29, 2, 50);
  const finished = await request(105701, 5, codec.pack('pb_task_activity_finish_req', {
    activity_id: 1003001, task_id_list: [1]
  }));
  assert.equal(finished.err, undefined);
  const finishResponse = codec.unpack('pb_task_activity_finish_rsp', Buffer.from(finished.data, 'base64'));
  assert.equal(Number(finishResponse.act_info.version), 1);
  assert.deepEqual(finishResponse.act_info.finish_task_list.map(Number), [1]);
  assert.equal(finishResponse.res.changes.find(row => row.tid === '101500').diff_num, '100');
  const repeatedFinish = await request(105701, 6, codec.pack('pb_task_activity_finish_req', {
    activity_id: 1003001, task_id_list: [1]
  }));
  assert.equal(repeatedFinish.err.err, 310);
  const vitality = await request(105702, 7, Buffer.alloc(0));
  assert.equal(vitality.err.err, 5);
});
