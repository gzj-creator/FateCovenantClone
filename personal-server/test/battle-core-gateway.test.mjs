import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLocalGame } from '../local-game.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const OPENED_AT = 1792789200;
const NOW_MS = (OPENED_AT + 3600) * 1000;
const PASS_TID = 77001;
const BUSINESS_ID = 20201;

function seedDatabase(databasePath) {
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  store.close();
}

function openGame(databasePath) {
  return createLocalGame({
    databasePath,
    statePath: path.join(path.dirname(databasePath), 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    activityMode: 'all-open',
    now: () => NOW_MS
  });
}

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
  return {
    request,
    payloadOf: reply => Buffer.from(reply.data ?? '', 'base64'),
    errorCode: reply => Number(reply.err?.err ?? reply.err ?? 0)
  };
}

test('ReportCmd/CommonMapCmd/StarMissionCmd answer over the temporary handshake and survive a reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-battle-core-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  let game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  let client = await connectClient(t, game);

  // 211 answers with a real, empty pass record list before any clear.
  const empty = await client.request(211, 2, codec.pack('pb_pass_record_req', { pass_tid: PASS_TID, id: BUSINESS_ID }));
  assert.equal(client.errorCode(empty), 0);
  assert.deepEqual(codec.unpack('pb_pass_record', client.payloadOf(empty)).pass_info_list, []);

  // Fail-closed branches answer with an explicit error code, never an empty body.
  const vote = await client.request(212, 3, codec.pack('pb_pass_record_vote_req', {
    pass_tid: PASS_TID, id: BUSINESS_ID, fight_id: '999', type: 1, is_up_vote: true
  }));
  assert.equal(client.errorCode(vote), 5);
  const share = await client.request(205, 4, codec.pack('pb_share_report', { fight_id: '1', fight_type: 1 }));
  assert.equal(client.errorCode(share), 5);
  const mapInit = await client.request(90601, 5, Buffer.alloc(0));
  assert.equal(client.errorCode(mapInit), 5);
  const mapTrigger = await client.request(90602, 6, codec.pack('pb_common_map_node_trigger', { map_tid: 9001, sub_id: 0, x: 0, y: 0 }));
  assert.equal(client.errorCode(mapTrigger), 5);
  const mapSweep = await client.request(90603, 10, codec.pack('pb_common_map_sweep_trigger', { map_tid: 9001, sub_id: 0 }));
  assert.equal(client.errorCode(mapSweep), 5);

  // 89602 resolves the activity through ActivityTable (func 81 family) and reads
  // the shipped StarMissionTable: version 1 / activity 81001, chapter 1, 9-star
  // award 10101 -> 175002 x150. Stars arrive through the generic fight pipeline,
  // which is not implemented, so the chapter star block is seeded here the same
  // way the client would report nine cleared stars.
  game.store.inspect(db => db.prepare('INSERT INTO star_mission_chapter_state VALUES (?,?,?,?,?,?)').run(
    game.store.read().state.roleId, 1, 1, 'ff80', '', new Date(NOW_MS).toISOString()
  ));
  const chapterAward = await client.request(89602, 7, codec.pack('pb_star_mission_chapter_award_req', {
    activity_id: '81001', award_tid: '10101'
  }));
  assert.equal(client.errorCode(chapterAward), 0);
  const awardValue = codec.unpack('pb_star_mission_chapter_award_rsp', client.payloadOf(chapterAward));
  assert.equal(Number(awardValue.chapter.chapter), 1);
  assert.equal(awardValue.res_change.changes.length, 1);
  assert.equal(String(awardValue.res_change.changes[0].tid), '175002');
  assert.equal(String(awardValue.res_change.changes[0].diff_num), '150');
  assert.equal(String(game.store.read().resources.get('175002').num), '150');
  // An activity outside the func-81 family has no star mission configuration.
  const unknownStar = await client.request(89602, 11, codec.pack('pb_star_mission_chapter_award_req', {
    activity_id: '100601', award_tid: '10101'
  }));
  assert.equal(client.errorCode(unknownStar), 5);

  // A recorded clear is listed by 211 and still listed after a gateway reopen.
  game.store.inspect(db => db.prepare('INSERT INTO battle_pass_records VALUES (?,?,?,?,?,?,?,?,?,?)').run(
    game.store.read().state.roleId, PASS_TID, BUSINESS_ID, 1, 7700120201, 6, 0,
    '{}', JSON.stringify({ pass_time: OPENED_AT, level: 9 }), new Date(NOW_MS).toISOString()
  ));
  const listed = await client.request(211, 8, codec.pack('pb_pass_record_req', { pass_tid: PASS_TID, id: BUSINESS_ID }));
  const value = codec.unpack('pb_pass_record', client.payloadOf(listed));
  assert.equal(value.pass_info_list.length, 1);
  assert.equal(String(value.pass_info_list[0].fight_id), '7700120201');

  await game.close();
  game = openGame(databasePath);
  client = await connectClient(t, game);
  const reopened = await client.request(211, 9, codec.pack('pb_pass_record_req', { pass_tid: PASS_TID, id: BUSINESS_ID }));
  assert.equal(codec.unpack('pb_pass_record', client.payloadOf(reopened)).pass_info_list.length, 1);
  // The chapter award claim survives the reopen and is not paid twice.
  const replayed = await client.request(89602, 12, codec.pack('pb_star_mission_chapter_award_req', {
    activity_id: '81001', award_tid: '10101'
  }));
  assert.equal(client.errorCode(replayed), 0);
  assert.equal(codec.unpack('pb_star_mission_chapter_award_rsp', client.payloadOf(replayed)).res_change.changes.length, 0);
  assert.equal(String(game.store.read().resources.get('175002').num), '150');
});
