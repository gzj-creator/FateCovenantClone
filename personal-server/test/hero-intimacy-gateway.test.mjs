import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const HERO_TID = 4040301;
const GIFT_ITEM = 830502;

async function connectAndLogin(game, t) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [];
  const waiters = [];
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
    for (;;) {
      const response = codec.unpack('pb_s2c', await next());
      if (response.seq === seq) return response;
    }
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next());
  const key = 'ClientKey1234567';
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
  return { request, socket };
}

function loginIntimacy(store) {
  const module = new Map(store.state().modules.value).get(10);
  const packed = rawBinary(module.value[11]);
  return packed.length ? codec.unpack('pb_hero_favour_intimacy', packed) : {};
}

test('667, 670 and 671 are routed over a real socket and sync persisted slot 11', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-intimacy-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const statePath = path.join(directory, 'absent.json');
  const events = [];
  let clientSocket;
  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    logger: event => events.push(event)
  });
  t.after(async () => {
    try { clientSocket?.destroy(); } catch {}
    try { await game.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });

  game.store.transaction(model => {
    const hero = model.heroInfo.hero_list[0];
    hero.tid = String(HERO_TID);
    hero.uid = String(HERO_TID);
    grantResources(model, [[GIFT_ITEM, 1]], gameTables, { codec });
  });
  const client = await connectAndLogin(game, t);
  clientSocket = client.socket;
  const { request } = client;

  const add = await request(667, 2, codec.pack('pb_hero_intimacy_add_req', {
    hero_tid: HERO_TID,
    items: [{ tid: GIFT_ITEM, num: 1 }]
  }));
  assert.equal(add.err, undefined);
  const addReply = codec.unpack('pb_hero_intimacy_add_rsp', Buffer.from(add.data, 'base64'));
  assert.equal(Number(addReply.hero_data.hero_tid), HERO_TID);
  assert.equal(Number(addReply.hero_data.intimacy_value), 1);
  assert.equal(Number(game.store.read().resources.get(String(GIFT_ITEM))?.num ?? 0), 0);

  const date = await request(670, 3, codec.pack('pb_hero_intimacy_date_req', { hero_tid: HERO_TID }));
  assert.equal(date.err, undefined);
  const dateReply = codec.unpack('pb_hero_intimacy_date_rsp', Buffer.from(date.data, 'base64'));
  assert.equal(Number(dateReply.all_data.hero_list[0].cycle_date_times), 1);
  assert.equal(Number(dateReply.all_data.cycle_date_times), 1);
  assert.deepEqual(dateReply.award.changes.map(change => [change.tid, change.diff_num]), [
    ['101500', '50'],
    ['830602', '1']
  ]);

  const beforeStory = Number(game.store.read().resources.get('101500')?.num ?? 0);
  const story = await request(671, 4, codec.pack('pb_hero_intimacy_story_req', { hero_tid: HERO_TID, page_id: 1 }));
  assert.equal(story.err, undefined);
  const storyReply = codec.unpack('pb_hero_intimacy_story_rsp', Buffer.from(story.data, 'base64'));
  assert.equal(Number(storyReply.award.changes[0].diff_num), 400);
  assert.equal(Number(game.store.read().resources.get('101500')?.num ?? 0), beforeStory + 400);
  assert.equal(hasBit(Buffer.from(storyReply.hero_data.story_got_bin, 'base64'), 1), true);

  const beforeReject = game.store.state();
  const repeat = await request(670, 5, codec.pack('pb_hero_intimacy_date_req', { hero_tid: HERO_TID }));
  assert.equal(repeat.err?.err, 5);
  assert.deepEqual(game.store.state(), beforeReject);
  assert.ok(events.some(event => event.event === 'hero_command_committed' && Number(event.type) === 667));
  assert.ok(events.some(event => event.event === 'hero_command_committed' && Number(event.type) === 670));
  assert.ok(events.some(event => event.event === 'hero_command_committed' && Number(event.type) === 671));
  assert.ok(events.some(event => event.event === 'hero_command_rejected' && Number(event.type) === 670 && event.code === 5));

  const persisted = loginIntimacy(game.store);
  assert.equal(Number(persisted.hero_list[0].cycle_date_times), 1);
  assert.equal(Number(persisted.cycle_date_times), 1);
  assert.equal(hasBit(Buffer.from(persisted.hero_list[0].story_got_bin, 'base64'), 1), true);
});
