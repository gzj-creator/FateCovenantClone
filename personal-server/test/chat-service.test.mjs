import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createChatService, CHAT_COMMANDS, CHAT_CODES } from '../game/chat-service.mjs';
import { createMessageService, MESSAGE_COMMANDS } from '../game/message-service.mjs';
import { readChatTables } from '../config/chat-tables.mjs';
import { channelIdFor } from '../config/message-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const fixedNow = Date.UTC(2026, 10, 7, 4, 0, 0);
const ACTOR = 10046;
const PEER = 10047;
const SERVER = 1;
const WORLD = channelIdFor(1, SERVER);
const PRIVATE = channelIdFor(3, PEER);

function roleProfile(level, name) {
  return JSON.stringify(codec.unpack('to_client_role_info', codec.pack('to_client_role_info', {
    level,
    nick_name: Buffer.from(name, 'utf8')
  })));
}

function addRole(fixture, roleId, level, name) {
  fixture.store.inspect(db => db.prepare('INSERT OR REPLACE INTO roles VALUES (?,?,?,?,?)').run(
    roleId, SERVER, 1700000000, roleProfile(level, name), JSON.stringify({})
  ));
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-chat-service-',
    serverOpenedAt: 1700000000,
    seed: { roleId: ACTOR }
  });
  for (const role of options.roles ?? [{ roleId: PEER, level: 9, name: 'Peer Two' }]) {
    addRole(fixture, role.roleId, role.level, role.name);
  }
  let now = options.now ?? fixedNow;
  let service = createChatService({
    store: fixture.store,
    codec: options.codec ?? codec,
    now: () => now,
    logger: options.logger
  });
  const messages = createMessageService({ store: fixture.store, codec, now: () => now });
  return {
    fixture,
    messages,
    get store() { return fixture.store; },
    get service() { return service; },
    get now() { return now; },
    setNow(value) { now = value; },
    reopen(next = {}) {
      service = createChatService({
        store: fixture.open(),
        codec: next.codec ?? options.codec ?? codec,
        now: () => next.now ?? now,
        logger: options.logger
      });
      return service;
    }
  };
}

function content(text, msgType = 0) {
  return { text_content: text, link_params: [], msg_type: msgType, be_reply_content: '' };
}

function worldBytes(text, msgType = 0) {
  return codec.pack('pb_chat_msg_content', content(text, msgType));
}

function privateBytes(target, text, msgType = 0) {
  return codec.pack('pb_req_send_msg_to_role', {
    target_role_id: String(target),
    content: content(text, msgType)
  });
}

function joinWorld(env) {
  env.messages.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
}

function joinPrivate(env, target = PEER) {
  env.messages.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [3, [target]]);
}

test('ChatTable Param and ReportConst keep their recovered production values', () => {
  const tables = readChatTables();
  assert.equal(tables.param.chat_word_count_limit, 140);
  assert.equal(tables.param.send_time_interval, 10);
  assert.equal(tables.param.count_limit_in_cd, 3);
  assert.equal(tables.param.world_chat_level_limit, 15);
  assert.equal(tables.param.max_private_session_count, 10);
  assert.equal(tables.report.day_times, 30);
  assert.equal(tables.report.report_msg_num, 30);
  assert.equal(tables.report.report_msg_valid_time, 1800);
});

test('11000 persists a world message and pushes pb_res_new_msg with ordered fields', async t => {
  const env = setup(t);
  joinWorld(env);
  const result = await env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('hello world'));
  assert.equal(result.data.length, 0);
  assert.equal(result.pushes.length, 1);
  assert.equal(result.pushes[0].type, 1400);
  const push = codec.unpack('pb_res_new_msg', result.pushes[0].data);
  assert.equal(push.channel_id, String(WORLD));
  assert.equal(push.msg.sender, String(ACTOR));
  assert.equal(push.msg.idx, 1);
  assert.equal(push.msg.time, Math.floor(fixedNow / 1000));
  assert.equal(Number(push.msg.type ?? 0), 0);
  assert.equal(Buffer.from(push.msg.content, 'base64').length > 0, true);
  const stored = env.store.inspect(db => db.prepare('SELECT sender,idx,type,content FROM message_history WHERE channel_id=?').all(WORLD));
  assert.equal(stored.length, 1);
  assert.equal(Number(stored[0].sender), ACTOR);
  assert.equal(Number(stored[0].idx), 1);
  assert.equal(Number(stored[0].type), 0);
  const range = env.messages.execute(MESSAGE_COMMANDS.range, [WORLD, 1, 5]);
  const body = codec.unpack('pb_msg_range_list_with_role_info', range.data);
  assert.equal(body.msg_list.length, 1);
  assert.equal(Buffer.from(body.msg_list[0].content, 'base64').equals(Buffer.from(stored[0].content)), true);
});

test('11000 rejects empty content and an unknown MsgType tid', async t => {
  const env = setup(t);
  joinWorld(env);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('')), error => error.code === CHAT_CODES.invalid);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('ok', 99)), error => error.code === CHAT_CODES.invalid);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendWorld, Buffer.from([0xff, 0xff])), error => error.code === CHAT_CODES.invalid);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history').get().count)), 0);
});

test('11000 refuses to send before the world channel is joined', async t => {
  const env = setup(t);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('not joined')), error => error.code === CHAT_CODES.notMember);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history').get().count)), 0);
});

test('11002 persists a private message with the target ETF extra', async t => {
  const env = setup(t);
  joinPrivate(env);
  const result = await env.service.execute(CHAT_COMMANDS.sendRole, privateBytes(PEER, 'private hello'));
  const push = codec.unpack('pb_res_new_msg', result.pushes[0].data);
  assert.equal(push.channel_id, String(PRIVATE));
  assert.equal(push.msg.sender, String(ACTOR));
  const extra = await decodeEtf(Buffer.from(push.extra_bin, 'base64'));
  assert.equal(Number(extra), ACTOR);
  const stored = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(PRIVATE));
  assert.equal(Number(stored.count), 1);
});

test('11002 rejects a private target that does not exist', async t => {
  const env = setup(t);
  joinPrivate(env);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendRole, privateBytes(10048, 'missing')), error => error.code === CHAT_CODES.targetMissing);
});

test('11012 removes the joined private target and stays idempotent', async t => {
  const env = setup(t);
  joinPrivate(env);
  const first = await env.service.execute(CHAT_COMMANDS.removePrivateTarget, await encodeEtf(PEER));
  assert.equal(first.value.removed, 1);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_members WHERE role_id=? AND channel_id=?').get(ACTOR, PRIVATE).count), 0);
  const second = await env.service.execute(CHAT_COMMANDS.removePrivateTarget, await encodeEtf(PEER));
  assert.equal(second.value.removed, 0);
});

test('11013 reports a role and rejects duplicates until the valid window expires', async t => {
  const env = setup(t);
  const payload = await encodeEtf([PEER, 'bad', 'bad behaviour']);
  const result = await env.service.execute(CHAT_COMMANDS.chatReport, payload);
  const body = codec.unpack('pb_role_chat_report', result.data);
  assert.equal(body.time_stamp, String(Math.floor(fixedNow / 1000)));
  assert.deepEqual(body.reported, [String(PEER)]);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.chatReport, payload), error => error.code === CHAT_CODES.duplicate);
  env.setNow(fixedNow + 1801 * 1000);
  const later = await env.service.execute(CHAT_COMMANDS.chatReport, payload);
  const laterBody = codec.unpack('pb_role_chat_report', later.data);
  assert.deepEqual(laterBody.reported, [String(PEER)]);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM chat_reports').get().count)), 2);
});

test('11013 enforces the recovered daily report limit and report shapes', async t => {
  const env = setup(t);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.chatReport, await encodeEtf([PEER, 'bad'])), error => error.code === CHAT_CODES.unavailable);
  for (let day = 0; day < 30; day++) {
    const payload = await encodeEtf([PEER, 'bad', 'case ' + day]);
    await env.service.execute(CHAT_COMMANDS.chatReport, payload);
    env.setNow(fixedNow + (day + 1) * 2000 * 1000);
  }
  await assert.rejects(env.service.execute(CHAT_COMMANDS.chatReport, await encodeEtf([PEER, 'bad', 'overflow'])), error => error.code === CHAT_CODES.limit);
});

test('11010 persists the opaque ETF setting and replays it in pb_res_chat_login', async t => {
  const env = setup(t);
  const blob = await encodeEtf([1, 2, 3]);
  const result = await env.service.execute(CHAT_COMMANDS.changeSetting, blob);
  assert.equal(result.data.length, 0);
  assert.equal(env.service.settingsOf().equals(blob), true);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.changeSetting, Buffer.from([0xff])), error => error.code === CHAT_CODES.invalid);
  const copied = Buffer.from(env.service.settingsPayload());
  const login = codec.unpack('pb_res_chat_login', copied);
  assert.equal(Buffer.from(login.tips_setting, 'base64').equals(blob), true);
});

test('chat history, reports, removed targets and settings survive a store reopen', async t => {
  const env = setup(t);
  joinWorld(env);
  joinPrivate(env);
  await env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('durable world'));
  await env.service.execute(CHAT_COMMANDS.sendRole, privateBytes(PEER, 'durable private'));
  await env.service.execute(CHAT_COMMANDS.chatReport, await encodeEtf([PEER, 'bad', 'durable report']));
  const blob = await encodeEtf(7);
  await env.service.execute(CHAT_COMMANDS.changeSetting, blob);
  await env.service.execute(CHAT_COMMANDS.removePrivateTarget, await encodeEtf(PEER));
  const reopened = env.reopen();
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(WORLD).count)), 1);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM chat_reports').get().count)), 1);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_members WHERE role_id=? AND channel_id=?').get(ACTOR, PRIVATE).count)), 0);
  assert.equal(reopened.settingsOf().equals(blob), true);
  await assert.rejects(reopened.execute(CHAT_COMMANDS.chatReport, await encodeEtf([PEER, 'bad', 'duplicate after reopen'])), error => error.code === CHAT_CODES.duplicate);
});

test('unrecovered guild, cross-server, ban, like and malformed proof paths fail closed', async t => {
  const env = setup(t);
  joinWorld(env);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendGuild, worldBytes('guild')), error => error.code === CHAT_CODES.unavailable);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendMultiServer, worldBytes('cross')), error => error.code === CHAT_CODES.unavailable);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.cancelBan, await encodeEtf([])), error => error.code === CHAT_CODES.unavailable);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.bannedSelf, codec.pack('pb_req_ban_self', { proof_list: [] })), error => error.code === CHAT_CODES.unavailable);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.bannedSelf, Buffer.from([0xff])), error => error.code === CHAT_CODES.invalid);
  await assert.rejects(env.service.execute(CHAT_COMMANDS.msgLike, codec.pack('pb_msg_like_req', { channel_id: String(WORLD), index: '1' })), error => error.code === CHAT_CODES.unavailable);
});

test('a pb_res_new_msg encode failure rolls the message and channel row back', async t => {
  const brokenCodec = {
    ...codec,
    pack(name, object) {
      if (name === 'pb_res_new_msg') throw new Error('push encode failure');
      return codec.pack(name, object);
    }
  };
  const env = setup(t, { codec: brokenCodec });
  // Join through the real codec so the membership is independent of the fault.
  env.store.inspect(db => {
    db.prepare('INSERT OR IGNORE INTO message_members VALUES (?,?,?)').run(ACTOR, WORLD, new Date(fixedNow).toISOString());
  });
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('rollback')), /push encode failure/);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history').get().count)), 0);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_channels').get().count)), 0);
});

test('a SQLite ABORT trigger on message_history rolls the whole send back', async t => {
  const env = setup(t);
  joinWorld(env);
  env.store.inspect(db => db.prepare('DELETE FROM message_channels WHERE channel_id=?').run(WORLD));
  env.store.inspect(db => db.exec(`CREATE TRIGGER chat_history_abort BEFORE INSERT ON message_history
    BEGIN SELECT RAISE(ABORT, 'forced chat history failure'); END;`));
  await assert.rejects(env.service.execute(CHAT_COMMANDS.sendWorld, worldBytes('db failure')), /forced chat history failure/);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history').get().count)), 0);
  assert.equal(Number(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_channels WHERE channel_id=?').get(WORLD).count)), 0);
});
