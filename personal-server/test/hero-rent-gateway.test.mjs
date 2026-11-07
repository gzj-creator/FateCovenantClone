import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;
const RENT_TID = 2;
const RENT_HERO = 1030101;

function addHero(store, tid, star) {
  store.transaction(model => {
    const config = heroTables.Hero.get(tid);
    const existing = model.heroInfo.hero_list.find(hero => Number(hero.tid) === tid);
    if (existing) { existing.star = star; existing.level = 20; return; }
    model.heroInfo.hero_list.push({
      tid: String(tid), uid: String(tid), count: 1, level: 20,
      star, star_progress: 0, breakthrough_level: 0,
      quality: Number(config.quality ?? 0), relic: [], up_star_high_consume: [],
      source_point_list: [], pendant_select_list: []
    });
  });
}

test('hero rent commands answer through the real gateway with the numeric types', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-rent-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_NOW
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
  const request = async (type, seq, data = Buffer.alloc(0)) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal(login.err, undefined);
  const loginValue = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.ok(loginValue[2].value.find(entry => Number(entry[0]) === 10), 'login carries the hero module');
  const roleId = game.store.read().state.roleId;

  addHero(game.store, RENT_HERO, 5);
  let response = await request(627, 2, codec.pack('pb_req_rent_out', { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [1] }));
  assert.equal(response.err, undefined);
  const listed = codec.unpack('pb_req_rent_out_back', Buffer.from(response.data, 'base64'));
  assert.equal(listed.rent_out_one.rent_out_hero_list.length, 1);
  assert.equal(String(listed.rent_out_one.rent_out_hero_list[0].hero_uid), String(RENT_HERO));

  response = await request(627, 21, codec.pack('pb_req_rent_out', { rent_tid: RENT_TID, hero_uid_list: [RENT_HERO], hero_index_list: [1] }));
  assert.equal(response.err.err, 5);

  response = await request(631, 3);
  assert.equal(response.err, undefined);
  const flushed = codec.unpack('pb_rent_flush_ret', Buffer.from(response.data, 'base64'));
  assert.equal(flushed.rent_out_one.rent_out_hero_list.length, 1);

  response = await request(630, 4, await encodeEtf([roleId]));
  assert.equal(response.err, undefined);
  const queried = codec.unpack('pb_req_query_rent_hero_ret', Buffer.from(response.data, 'base64'));
  assert.equal(String(queried.role_rent_out_list[0].role_id), String(roleId));

  response = await request(634, 5, codec.pack('pb_hero_share_req', { req_list: [{ role_id: roleId, uid_list: [RENT_HERO], share_tid: 1 }] }));
  assert.equal(response.err, undefined);
  const shared = codec.unpack('pb_hero_share_req_back', Buffer.from(response.data, 'base64'));
  assert.equal(shared.req_back_list.length, 1);
  assert.deepEqual(shared.req_back_list[0].hero_share_list, []);

  response = await request(634, 51, codec.pack('pb_hero_share_req', { req_list: [{ role_id: 200002, uid_list: [], share_tid: 1 }] }));
  assert.equal(response.err.err, 3001);

  response = await request(628, 6);
  assert.equal(response.err, undefined);
  const removed = codec.unpack('pb_req_rent_out_back', Buffer.from(response.data, 'base64'));
  assert.equal(removed.rent_out_one.take_off_list.length, 1);

  response = await request(629, 7, codec.pack('pb_req_rent', { rent_tid: RENT_TID, is_clear_cur: true, rent_req_list: [] }));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_req_rent_back', Buffer.from(response.data, 'base64')).rent_data.rent_hero_list, []);
});
