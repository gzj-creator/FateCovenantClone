import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createCmsService } from '../game/cms-service.mjs';
import { createGuildNationAssistService } from '../game/guild-nation-assist-service.mjs';
import { createLocalGame, encodeEtf } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const backup = new URL('../../analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite', import.meta.url);
const codec = createGameCodec();
const tables = readGameTables();
const SERVER_OPENED_AT = 1792789200;

function setup(t, initialSeconds = 1800000000) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-login-business-reads-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  let nowSeconds = initialSeconds;
  const openStore = () => createGameStore({ databasePath, codec, serverOpenedAt: SERVER_OPENED_AT });
  let store = openStore();
  const makeCms = () => createCmsService({ codec, store, tables, now: () => nowSeconds * 1000 });
  const makeAssist = () => createGuildNationAssistService({ codec, store, now: () => nowSeconds * 1000 });
  let cms = makeCms(), assist = makeAssist();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get cms() { return cms; },
    get assist() { return assist; },
    nowSeconds() { return nowSeconds; },
    setNow(seconds) { nowSeconds = seconds; },
    reopen() {
      store.close();
      store = openStore();
      cms = makeCms();
      assist = makeAssist();
    }
  };
}

function insertCms(store, value) {
  const row = {
    cms_tid: 1, link: 'https://example.invalid/survey', award: '10 diamonds',
    start_time: 1799999900, end_time: 1800000200, enabled: 1,
    created_at: '2026-11-01T00:00:00.000Z', ...value
  };
  store.inspect(db => db.prepare(`INSERT INTO cms_questions
    (question_id,cms_tid,title,link,award,start_time,end_time,enabled,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    row.question_id, row.cms_tid, row.title, row.link, row.award,
    row.start_time, row.end_time, row.enabled, row.created_at
  ));
}

function currentGuildId(store) {
  const module = new Map(store.state().modules.value).get(24);
  return codec.unpack('pb_res_guild_login', rawBinary(module)).guildId;
}

function insertAssist(store, value) {
  const row = {
    guild_id: currentGuildId(store), requester_role_id: '100002', target_type: 1,
    target_id: 30001, max_num: 5, assist_num: 1, finish_time: 1800000060,
    target_lv: 2, created_at: '2026-11-01T00:00:00.000Z', ...value
  };
  store.inspect(db => db.prepare(`INSERT INTO guild_nation_assists
    (assist_id,guild_id,requester_role_id,target_type,target_id,max_num,assist_num,finish_time,target_lv,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    row.assist_id, row.guild_id, row.requester_role_id, row.target_type, row.target_id,
    row.max_num, row.assist_num, row.finish_time, row.target_lv, row.created_at
  ));
}

test('schema v11 stores business read state and CMS returns only active matching questions', t => {
  const env = setup(t);
  assert.equal(env.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 11);
  assert.ok(env.store.inspect(db => db.prepare("SELECT name FROM migrations WHERE name='login-business-reads-v11'").get()));
  assert.ok(env.cms.supports(89501));
  assert.equal(env.cms.supports(89502), false);

  insertCms(env.store, { question_id: 'late', title: 'Late survey', end_time: 1800000120 });
  insertCms(env.store, { question_id: 'near', title: 'Near survey', start_time: env.nowSeconds(), end_time: 1800000060 });
  insertCms(env.store, { question_id: 'expired', title: 'Expired survey', end_time: env.nowSeconds() });
  insertCms(env.store, { question_id: 'future', title: 'Future survey', start_time: env.nowSeconds() + 1, end_time: 1800000300 });
  insertCms(env.store, { question_id: 'disabled', title: 'Disabled survey', end_time: 1800000300, enabled: 0 });
  insertCms(env.store, { question_id: 'other-type', title: 'Other CMS', cms_tid: 2, end_time: 1800000300 });

  const result = env.cms.execute(1);
  const value = codec.unpack('pb_cms_question_info', result.data);
  assert.deepEqual(value.question_list.map(question => question.title), ['Near survey', 'Late survey']);
  assert.deepEqual(value.question_list[0], {
    title: 'Near survey',
    link: 'https://example.invalid/survey',
    award: '10 diamonds',
    start_time: String(env.nowSeconds()),
    end_time: '1800000060'
  });

  env.store.inspect(db => db.prepare("DELETE FROM cms_questions WHERE question_id IN ('near','late')").run());
  assert.deepEqual(codec.unpack('pb_cms_question_info', env.cms.execute(1).data).question_list, []);

  assert.throws(() => env.cms.execute(2), error => error.code === 1);
  assert.throws(() => env.cms.execute('1'), error => error.code === 1);
});

test('guild nation assist reads are scoped to the current guild and active requests', t => {
  const env = setup(t);
  assert.ok(env.assist.supports(99229));
  assert.equal(env.assist.supports(99228), false);
  const guildId = currentGuildId(env.store);

  insertAssist(env.store, { assist_id: '9000000000000000003', requester_role_id: '100003', target_id: 30003, finish_time: 1800000090 });
  insertAssist(env.store, { assist_id: '9000000000000000002', requester_role_id: '100002', target_id: 30002, finish_time: 1800000030, target_lv: 3, assist_num: 2 });
  insertAssist(env.store, { assist_id: '9000000000000000004', requester_role_id: '100004', target_id: 30004, finish_time: env.nowSeconds() });
  insertAssist(env.store, { assist_id: '9000000000000000005', requester_role_id: '100005', target_id: 30005, assist_num: 5 });
  insertAssist(env.store, { assist_id: '9000000000000000006', requester_role_id: '100006', target_id: 30006, guild_id: '900002' });

  const result = env.assist.execute(null);
  const value = codec.unpack('pb_guild_nation_assist_list_back', result.data);
  assert.equal(result.guildId, guildId);
  assert.deepEqual(value.list.map(item => item.id), ['9000000000000000002', '9000000000000000003']);
  assert.deepEqual(value.list[0], {
    role_id: '100002', target_type: 1, target_id: 30002, max_num: 5,
    assist_num: 2, finish_time: '1800000030', target_lv: 3, id: '9000000000000000002'
  });
  assert.throws(() => env.assist.execute('unexpected'), error => error.code === 1);

  env.reopen();
  assert.deepEqual(codec.unpack('pb_guild_nation_assist_list_back', env.assist.execute(null).data).list.map(item => item.id), ['9000000000000000002', '9000000000000000003']);
  env.store.inspect(db => db.prepare("DELETE FROM guild_nation_assists WHERE guild_id=?").run(guildId));
  assert.deepEqual(codec.unpack('pb_guild_nation_assist_list_back', env.assist.execute(null).data).list, []);
});

test('real gateway serves CMS and current-guild assist reads without unsupported-command errors', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-login-business-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  fs.copyFileSync(backup, databasePath);
  let gameNow = (SERVER_OPENED_AT + 3600) * 1000;
  const game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => gameNow,
    random: () => 0.5
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
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
  const request = async (type, seq, data) => {
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
  let response = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(response.err, undefined);

  const nowSeconds = Math.floor(gameNow / 1000);
  game.store.inspect(db => db.prepare(`INSERT INTO cms_questions
    (question_id,cms_tid,title,link,award,start_time,end_time,enabled,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    'tcp-survey', 1, 'TCP survey', 'https://example.invalid/tcp', 'Reward',
    nowSeconds - 1, nowSeconds + 60, 1, new Date(gameNow).toISOString()
  ));
  const guildId = currentGuildId(game.store);
  game.store.inspect(db => db.prepare(`INSERT INTO guild_nation_assists
    (assist_id,guild_id,requester_role_id,target_type,target_id,max_num,assist_num,finish_time,target_lv,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    '9000000000000000020', guildId, '100003', 2, 40001, 3, 1, nowSeconds + 30,
    5, new Date(gameNow).toISOString()
  ));

  response = await request(89501, 2, await encodeEtf([1]));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('pb_cms_question_info', Buffer.from(response.data, 'base64')).question_list.map(question => question.title), ['TCP survey']);
  // GuildNationAssistMgr sends ETF atom `nil` (83 64 00 03 6e 69 6c),
  // not an empty protobuf payload.
  response = await request(99229, 3, Buffer.from('g2QAA25pbA==', 'base64'));
  assert.equal(response.err, undefined);
  assert.deepEqual(
    codec.unpack('pb_guild_nation_assist_list_back', Buffer.from(response.data, 'base64')).list.map(item => item.id),
    ['9000000000000000020']
  );
});
