import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
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
const CELL_HERO = 2020601;
const BUMPED_HERO = 2010101;
const SPARE_HERO = 4030801;
const CHIP_HERO = 1020601;

test('hero develop commands answer through the real gateway with saved state', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-develop-gateway-'));
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
  const heroInfo = codec.unpack('pb_hero_info', Buffer.from(heroModule[1].value[0].value));
  assert.equal(heroInfo.cell_list.length, 6);
  assert.equal(heroInfo.hero_list.find(hero => Number(hero.tid) === CELL_HERO).level, 8);

  // 637 submit hero: the two heroes exchange cells.
  const submitted = await request(637, 2, codec.pack('pb_hero_submit_req', { hero_tid: CELL_HERO, cell_index: 1, lineup_pos: 0 }));
  assert.equal(submitted.err, undefined);
  const submitValue = codec.unpack('pb_hero_submit_ret', Buffer.from(submitted.data, 'base64'));
  assert.equal(submitValue.cell_list.length, 6);
  assert.deepEqual(submitValue.change_hero_list.map(hero => Number(hero.tid)).sort((left, right) => left - right), [BUMPED_HERO, CELL_HERO]);
  assert.equal(Number(submitValue.cur_pre_lineup.index), 1);
  const exchanged = game.store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === BUMPED_HERO);
  assert.equal(exchanged.level, 8);
  assert.equal(exchanged.breakthrough_level, 1);

  const invalidCell = await request(637, 3, codec.pack('pb_hero_submit_req', { hero_tid: SPARE_HERO, cell_index: 9, lineup_pos: 0 }));
  assert.equal(invalidCell.err.err, 1);
  const unowned = await request(637, 4, codec.pack('pb_hero_submit_req', { hero_tid: 9999999, cell_index: 1, lineup_pos: 0 }));
  assert.equal(unowned.err.err, 3001);

  // 656 batch submit.
  const batch = await request(656, 5, codec.pack('pb_hero_batch_submit_req', {
    hero_list: [{ hero_tid: SPARE_HERO, cell_index: 5, lineup_pos: 0 }, { hero_tid: 1020301, cell_index: 6, lineup_pos: 0 }]
  }));
  assert.equal(batch.err, undefined);
  const batchValue = codec.unpack('pb_hero_submit_ret', Buffer.from(batch.data, 'base64'));
  assert.equal(batchValue.cell_list.length, 6);
  const duplicate = await request(656, 6, codec.pack('pb_hero_batch_submit_req', {
    hero_list: [{ hero_tid: SPARE_HERO, cell_index: 1, lineup_pos: 0 }, { hero_tid: SPARE_HERO, cell_index: 2, lineup_pos: 0 }]
  }));
  assert.equal(duplicate.err.err, 1);

  // 641 trail: the hero must sit on the first star maximum.
  const chipTid = Number(heroTables.Hero.get(CHIP_HERO).chip);
  const stoneTid = 651002;
  game.store.transaction(model => {
    model.heroInfo.hero_list.find(hero => Number(hero.tid) === CHIP_HERO).star = 5;
    grantResources(model, [[chipTid, 240], [stoneTid, 2]], tables);
  });
  const trailed = await request(641, 7, codec.pack('pb_hero_wake_req', { hero_tid: CHIP_HERO, res: [{ tid: stoneTid, num: 0 }] }));
  assert.equal(trailed.err, undefined);
  const trailValue = codec.unpack('pb_hero_trial_ret', Buffer.from(trailed.data, 'base64'));
  assert.equal(Number(trailValue.new_quality), 50);
  assert.equal(Number(trailValue.new_star), 6);
  assert.equal(trailValue.res.changes.find(change => Number(change.tid) === chipTid).diff_num, '-240');
  assert.equal(trailValue.res.changes.find(change => Number(change.tid) === stoneTid).diff_num, '-2');
  assert.equal(Number(trailValue.trial.hero_tid), CHIP_HERO);
  const trailedHero = game.store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === CHIP_HERO);
  assert.equal(trailedHero.quality, 50);
  assert.equal(trailedHero.star, 6);
  const trialModule = new Map(game.store.state().modules.value).get(10);
  const trialSlot = codec.unpack('pb_role_hero_trial', rawBinary(trialModule.value[6]));
  assert.equal(Number(trialSlot.hero_trial[0].hero_tid), CHIP_HERO);
  const repeated = await request(641, 8, codec.pack('pb_hero_wake_req', { hero_tid: CHIP_HERO, res: [{ tid: stoneTid, num: 0 }] }));
  assert.equal(repeated.err.err, 5);
  const tooLow = await request(641, 9, codec.pack('pb_hero_wake_req', { hero_tid: SPARE_HERO, res: [] }));
  assert.equal(tooLow.err.err, 5);

  // 666 one key: the client sends no hero list, so every owned hero is tried.
  const oneKey = await request(666, 10, codec.pack('pb_hero_one_key_up_req', { hero_tid_list: [] }));
  assert.equal(oneKey.err, undefined);
  const oneKeyValue = codec.unpack('pb_hero_one_key_up_rsp', Buffer.from(oneKey.data, 'base64'));
  assert.ok(oneKeyValue.failed_hero_list.length >= 1, 'unaffordable heroes are reported as failures');
  assert.ok(Array.isArray(oneKeyValue.success_hero_list));
  const oneKeySingle = await request(666, 11, codec.pack('pb_hero_one_key_up_req', { hero_tid_list: [CHIP_HERO] }));
  assert.equal(oneKeySingle.err, undefined);
  const single = codec.unpack('pb_hero_one_key_up_rsp', Buffer.from(oneKeySingle.data, 'base64'));
  assert.equal(Number(single.failed_hero_list[0].hero_tid), CHIP_HERO);
  assert.equal(Number(single.failed_hero_list[0].before_star), 6);
});
