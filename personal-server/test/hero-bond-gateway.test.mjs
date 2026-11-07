import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
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
const FETTER_HERO = 1040101;
const FETTER_GATHER_HERO = 1030501;
const DIFF_HERO = 1010101;
const DIFF_ITEM = 533002;
const PENDANT_HERO = 5040701;

function addHero(store, tid, overrides = {}) {
  store.transaction(model => {
    const config = heroTables.Hero.get(tid);
    model.heroInfo.hero_list.push({
      tid: String(tid), uid: String(tid), count: 1, level: 1,
      star: Number(config.star ?? 0), star_progress: 0, breakthrough_level: 0,
      quality: Number(config.quality ?? 0), relic: [], up_star_high_consume: [],
      source_point_list: [], pendant_select_list: [], ...overrides
    });
  });
}

function setDrawCount(store, drawCount) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(10);
    const bytes = module.value[2] ? rawBinary(module.value[2]) : Buffer.alloc(0);
    const info = bytes.length ? codec.unpack('pb_hero_draw_info', bytes) : { recruit_list: [], achieve_list: [] };
    info.recruit_list ??= [];
    info.achieve_list ??= [];
    let record = info.recruit_list.find(entry => Number(entry.tid) === 2 || Number(entry.draw_lib) === 2);
    if (!record) {
      record = { tid: 2, draw_lib: '2', custom_choose_index: 0 };
      info.recruit_list.push(record);
    }
    record.draw_count = drawCount;
    module.value[2] = { value: Buffer.from(codec.pack('pb_hero_draw_info', info)).toJSON(), bits: 8 };
    model.state.modules.value = [...modules];
  });
}

test('hero bond commands answer through the real gateway with login-module persistence', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-bond-gateway-'));
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
  const drawBytes = heroModule[1].value[2] ? Buffer.from(heroModule[1].value[2].value) : Buffer.alloc(0);
  const drawInfo = drawBytes.length ? codec.unpack('pb_hero_draw_info', drawBytes) : { recruit_list: [], achieve_list: [] };
  const qualityRecord = (drawInfo.recruit_list ?? []).find(entry => Number(entry.tid) === 2 || Number(entry.draw_lib) === 2);
  assert.ok(qualityRecord, 'login carries the quality draw record');
  assert.equal(Number(qualityRecord.custom_choose_index ?? 0), 0);

  setDrawCount(game.store, 8);
  let response = await request(602, 2, await encodeEtf([2]));
  assert.equal(response.err, undefined);
  const recruit = codec.unpack('pb_hero_recruit', Buffer.from(response.data, 'base64'));
  assert.equal(Number(recruit.custom_choose_index), 2);
  response = await request(602, 21, await encodeEtf([3]));
  assert.equal(response.err.err, 5);

  addHero(game.store, FETTER_HERO);
  response = await request(654, 3, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 1 }));
  assert.equal(response.err.err, 5);
  addHero(game.store, FETTER_GATHER_HERO);
  response = await request(654, 31, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 1 }));
  assert.equal(response.err, undefined);
  assert.equal(Buffer.from(response.data ?? '', 'base64').length, 0);
  response = await request(654, 32, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 1 }));
  assert.equal(response.err.err, 5);
  response = await request(654, 33, codec.pack('pb_active_fetter_req', { hero_tid: FETTER_HERO, fetter_idx: 9 }));
  assert.equal(response.err.err, 3001);

  addHero(game.store, DIFF_HERO);
  game.store.transaction(model => grantResources(model, [[DIFF_ITEM, 10]], tables));
  response = await request(661, 4, await encodeEtf([DIFF_HERO]));
  assert.equal(response.err, undefined);
  const diffed = codec.unpack('pb_hero_diff_back', Buffer.from(response.data, 'base64'));
  assert.equal(diffed.res.changes.find(change => Number(change.tid) === DIFF_ITEM).diff_num, '-10');
  assert.equal(Number(diffed.new_hero.diff), 1);
  assert.equal(BigInt(game.store.read().resources.get(String(DIFF_ITEM))?.num ?? 0), 0n);
  response = await request(661, 41, await encodeEtf([DIFF_HERO]));
  assert.equal(response.err.err, 5);

  addHero(game.store, PENDANT_HERO, { star: 8 });
  response = await request(672, 5, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: PENDANT_HERO, pendants: [{ index: 1, pendant_tid: 2 }]
  }));
  assert.equal(response.err, undefined);
  const pendant = codec.unpack('pb_hero_select_pendant_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(pendant.pendants.map(entry => [Number(entry.index), String(entry.pendant_tid)]), [[1, '2']]);
  const stored = game.store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === PENDANT_HERO);
  assert.deepEqual(stored.pendant_select_list.map(entry => [Number(entry.index), String(entry.pendant_tid)]), [[1, '2']]);
  response = await request(672, 51, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: PENDANT_HERO, pendants: [{ index: 1, pendant_tid: 1 }]
  }));
  assert.equal(response.err.err, 305);
  response = await request(672, 52, codec.pack('pb_hero_select_pendant_req', {
    hero_uid: PENDANT_HERO, pendants: [{ index: 9, pendant_tid: 2 }]
  }));
  assert.equal(response.err.err, 3001);
});
