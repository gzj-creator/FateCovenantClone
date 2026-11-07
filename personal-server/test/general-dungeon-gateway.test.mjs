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

const codec = createGameCodec();
const FIXED_NOW = 1792792800000;
const BOX_EVENT = 10100101;
const PROP_EVENT = 25100101;

test('GeneralDungeonCmd numeric routes work on a temporary handshake/login socket', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-general-dungeon-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
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
    const response = codec.unpack('pb_s2c', await next());
    assert.equal(response.seq, seq, 'one-way commands must not leave an extra frame in the stream');
    return response;
  };

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);

  const initial = await request(78102, 2, await encodeEtf([1]));
  assert.equal(initial.err, undefined);
  const initialPb = codec.unpack('pb_general_dungeon', Buffer.from(initial.data ?? '', 'base64'));
  assert.deepEqual(initialPb.level_data, []);

  const entered = await request(78103, 3, codec.pack('pb_enter_dungeon_level', { enter_level: 101, extraData: Buffer.alloc(0) }));
  assert.equal(entered.err, undefined);
  const enteredPb = codec.unpack('pb_dungeon_level_change', Buffer.from(entered.data, 'base64'));
  assert.equal(enteredPb.cur_level, 101);
  assert.equal(enteredPb.level_list[0].level_tid, 101);

  const activated = await request(78105, 4, codec.pack('pb_dungeon_event_active', {
    active_event: [BOX_EVENT], fog: Buffer.from([7, 8]), pos: 2004
  }));
  assert.equal(activated.err, undefined);
  const activatedPb = codec.unpack('pb_dungeon_event_list', Buffer.from(activated.data, 'base64'));
  assert.equal(activatedPb.events[0].event_id, BOX_EVENT);

  // A successful map sync is intentionally one-way. If it returned an empty
  // frame, this next request would observe the stale sequence number.
  send(codec.pack('pb_c2s', {
    type: 78106,
    seq: 5,
    data: codec.pack('pb_dungeon_sync_map', { scene_id: 1, pos: 2005, fog: Buffer.from([9]) })
  }));
  const readAfterSync = await request(78102, 6, await encodeEtf([1]));
  assert.equal(readAfterSync.err, undefined);
  const syncedPb = codec.unpack('pb_general_dungeon', Buffer.from(readAfterSync.data, 'base64'));
  assert.equal(syncedPb.level_data[0].scene[0].pos, 2005);

  const executed = await request(78101, 7, codec.pack('pb_dungeon_event_exe', {
    execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }));
  assert.equal(executed.err, undefined);
  const result = codec.unpack('pb_dungeon_event_res', Buffer.from(executed.data, 'base64'));
  assert.equal(result.target_evt, BOX_EVENT);
  assert.equal(result.box_count, 1);
  assert.ok(result.res.changes.length > 0);

  const repeated = await request(78101, 8, codec.pack('pb_dungeon_event_exe', {
    execute_event: BOX_EVENT, pos: 2004, fog: Buffer.alloc(0), active_event: [], req_data: 0
  }));
  assert.equal(repeated.err.err, 5);

  const propAwarded = await request(78101, 9, codec.pack('pb_dungeon_event_exe', {
    execute_event: PROP_EVENT, pos: 3010, fog: Buffer.alloc(0), active_event: [PROP_EVENT], req_data: 0
  }));
  assert.equal(propAwarded.err, undefined);
  const propUsed = await request(78107, 10, await encodeEtf([1]));
  assert.equal(propUsed.err, undefined);
  const afterProp = codec.unpack('pb_general_dungeon', Buffer.from((await request(78102, 11, await encodeEtf([1]))).data, 'base64'));
  assert.deepEqual(afterProp.level_data[0].prop_list, []);

  const closed = await request(78104, 12, await encodeEtf([101]));
  assert.equal(closed.err, undefined);
  const closedPb = codec.unpack('pb_dungeon_level_change', Buffer.from(closed.data, 'base64'));
  assert.equal(Number(closedPb.cur_level ?? 0), 0);
});
