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
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const tables = readGameTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;
const REFORGE_HERO = 1040301;

function addHero(store, tid) {
  store.transaction(model => {
    const config = heroTables.Hero.get(tid);
    model.heroInfo.hero_list.push({
      tid: String(tid), uid: String(tid), count: 1, level: 1,
      star: Number(config.star ?? 0), star_progress: 0, breakthrough_level: 0,
      quality: Number(config.quality ?? 0), relic: [], up_star_high_consume: [],
      source_point_list: [], pendant_select_list: []
    });
  });
}

test('hero extra commands answer through the real gateway with login-module persistence', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-extra-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_NOW,
    random: () => 0.31
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
  const loginValue = await decodeEtf(Buffer.from(login.data, 'base64'));
  const heroModule = loginValue[2].value.find(entry => Number(entry[0]) === 10);
  assert.ok(heroModule, 'login carries module 10');
  const visitBytes = Buffer.from(heroModule[1].value[5].value);
  assert.ok(visitBytes.length > 0, 'login carries the hero visit slot');
  const visitState = codec.unpack('pb_role_hero_visit', visitBytes);
  assert.deepEqual(visitState.visited_heroes ?? [], []);

  game.store.transaction(model => grantResources(model, [[21300104, 60], [710002, 10]], tables));
  let response = await request(614, 2, codec.pack('hero_chip_use', { tid: 21300104, num: 60 }));
  assert.equal(response.err, undefined);
  const composed = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64'));
  assert.equal(composed.changes.find(change => change.tid === '21300104').diff_num, '-60');
  assert.ok(composed.changes.find(change => change.tid === '21300104').extra);
  assert.equal(game.store.read().heroInfo.hero_list.some(hero => Number(hero.tid) === 1030101), true);
  response = await request(614, 21, codec.pack('hero_chip_use', { tid: 21300104, num: 60 }));
  assert.equal(response.err.err, 5);

  response = await request(647, 3, await encodeEtf([2010101]));
  assert.equal(response.err, undefined);
  const visited = codec.unpack('pb_hero_visit_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(visited.hero_visit.visited_heroes, [2010101]);
  assert.equal(visited.res_change.changes.find(change => Number(change.tid) === 22100104).diff_num, '10');
  response = await request(647, 31, await encodeEtf([2010101]));
  assert.equal(response.err.err, 5);

  addHero(game.store, REFORGE_HERO);
  response = await request(663, 4, codec.pack('pb_hero_reforge_req', { hero_tid: REFORGE_HERO, use_currency: false, lock_idx_list: [] }));
  assert.equal(response.err, undefined);
  const rolled = codec.unpack('pb_hero_reforge_back', Buffer.from(response.data, 'base64'));
  assert.equal(rolled.reforge.attr_list.length, 4);
  assert.equal(rolled.res.changes.find(change => Number(change.tid) === 710002).diff_num, '-10');
  response = await request(663, 41, codec.pack('pb_hero_reforge_req', { hero_tid: REFORGE_HERO, use_currency: false, lock_idx_list: [] }));
  assert.equal(response.err.err, 5);
  response = await request(664, 5, await encodeEtf([REFORGE_HERO]));
  assert.equal(response.err, undefined);
  const saved = codec.unpack('pb_hero_reforge', Buffer.from(response.data, 'base64'));
  assert.deepEqual(saved.attr_list, rolled.reforge.attr_list);
  const stored = game.store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === REFORGE_HERO);
  assert.deepEqual(stored.reforge.attr_list, saved.attr_list);
  response = await request(665, 6, await encodeEtf([REFORGE_HERO]));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_hero_reforge', Buffer.from(response.data, 'base64')).attr_list, saved.attr_list);
});

