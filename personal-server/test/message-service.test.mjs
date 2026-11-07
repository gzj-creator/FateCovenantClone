import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createMessageService, MESSAGE_COMMANDS } from '../game/message-service.mjs';
import { readMessageTables, channelIdFor } from '../config/message-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { GameError } from '../game/hero-progression.mjs';

const codec = createGameCodec();
const tables = readMessageTables();
const fixedNow = Date.UTC(2026, 10, 7, 4, 0, 0);
// Uid.Compose(uid,serverId) rejects a trailing slot >= 100000, so the fixture
// uses the production-shaped five-digit role ids (the isolated client role is
// 10046).
const ACTOR = 10046;
const PEER = 10047;
const SERVER = 1;

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
    prefix: 'fc-message-service-',
    serverOpenedAt: 1700000000,
    seed: { roleId: ACTOR }
  });
  for (const role of options.roles ?? [{ roleId: PEER, level: 9, name: 'Peer Two' }]) {
    addRole(fixture, role.roleId, role.level, role.name);
  }
  let now = options.now ?? fixedNow;
  let service = createMessageService({
    store: fixture.store,
    codec: options.codec ?? codec,
    tables,
    serverOpenedAt: 1700000000,
    now: () => now,
    logger: options.logger
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    get now() { return now; },
    setNow(value) { now = value; },
    reopen(next = {}) {
      const store = fixture.open();
      service = createMessageService({
        store,
        codec: next.codec ?? options.codec ?? codec,
        tables,
        serverOpenedAt: 1700000000,
        now: () => next.now ?? now,
        logger: options.logger
      });
      return service;
    }
  };
}

function sendMessage(service, channelId, text, extra = Buffer.alloc(0)) {
  return service.executeBinary(MESSAGE_COMMANDS.send, codec.pack('pb_req_send_msg', {
    channel_id: String(channelId),
    content_bin: Buffer.from(text, 'utf8'),
    extra_param: extra
  }));
}

test('MsgTable.ChannelType exposes the seventeen recovered channel types', () => {
  assert.deepEqual(tables.channelTypes.map(row => row.tid), [1, 2, 3, 4, 5, 7, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.equal(tables.get(1).is_chat, true);
  assert.equal(tables.get(5).is_chat, false);
  assert.equal(tables.get(15).is_cross, true);
});

test('channel ids follow MsgChannel StaticFixedChannelId', () => {
  // (100 + type) * 100000 + id, and StaticGetChannelType extracts the infix
  // modulo RESERVED_CHANNEL_TYPE (100).
  assert.equal(channelIdFor(1, 1), 10100001);
  assert.equal(tables.channelTypeOf(10100001), 1);
  assert.equal(tables.channelTargetOf(10100001), 1);
  assert.equal(tables.isCanonicalChannelId(10100001), true);
  assert.equal(tables.isCanonicalChannelId(1), false);
  assert.equal(channelIdFor(3, ACTOR), 10310046);
  assert.equal(tables.channelTypeOf(10310046), 3);
});

test('10507 resolves the world channel id and persists the join', t => {
  const env = setup(t);
  const result = env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
  const body = codec.unpack('pb_msg_range_list_with_role_info', result.data);
  assert.equal(body.channel_id, '10100001');
  assert.deepEqual(body.msg_list, []);
  assert.equal(result.value.channelId, 10100001);
  const joined = env.store.inspect(db => db.prepare('SELECT channel_id FROM message_members WHERE role_id=?').all(ACTOR));
  assert.deepEqual(joined.map(row => Number(row.channel_id)), [10100001]);
});

test('10501 writes real history and 10506 reads the requested index range', t => {
  const env = setup(t);
  env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
  sendMessage(env.service, 10100001, 'hello world');
  env.setNow(fixedNow + 1000);
  sendMessage(env.service, 10100001, 'second');

  const range = env.service.execute(MESSAGE_COMMANDS.range, [10100001, 1, 10]);
  const body = codec.unpack('pb_msg_range_list_with_role_info', range.data);
  assert.equal(body.channel_id, '10100001');
  assert.deepEqual(body.msg_list.map(message => Number(message.idx)), [1, 2]);
  assert.equal(Buffer.from(body.msg_list[0].content, 'base64').toString('utf8'), 'hello world');
  assert.equal(body.role_info_list.length, 1);
  assert.equal(body.role_info_list[0].role_id, String(ACTOR));
  assert.equal(body.role_info_list[0].player_info.level, 9);
  const stored = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history WHERE channel_id=?').get(10100001));
  assert.equal(Number(stored.count), 2);
});

test('10502 and 10503 toggle membership and the leave reply stays empty', t => {
  const env = setup(t);
  env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
  sendMessage(env.service, 10100001, 'persisted');

  const left = env.service.execute(MESSAGE_COMMANDS.leave, 10100001);
  assert.equal(left.data.length, 0);
  const afterLeave = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_members WHERE role_id=?').get(ACTOR));
  assert.equal(Number(afterLeave.count), 0);

  const entered = env.service.execute(MESSAGE_COMMANDS.enter, 10100001);
  const body = codec.unpack('pb_msg_range_list_with_role_info', entered.data);
  assert.equal(body.msg_list.length, 1);
  const afterEnter = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_members WHERE role_id=?').get(ACTOR));
  assert.equal(Number(afterEnter.count), 1);
});

test('10504 and 10505 answer role information from the save', t => {
  const env = setup(t);
  const single = env.service.execute(MESSAGE_COMMANDS.roleInfo, PEER);
  const info = codec.unpack('pb_msg_role_info', single.data);
  assert.equal(info.role_id, String(PEER));
  assert.equal(info.player_info.level, 9);
  assert.equal(Buffer.from(info.player_info.name, 'base64').toString('utf8'), 'Peer Two');

  const list = env.service.execute(MESSAGE_COMMANDS.roleInfoList, [PEER, ACTOR, PEER]);
  const body = codec.unpack('pb_msg_role_info_list', list.data);
  assert.deepEqual(body.role_info_list.map(row => row.role_id), [String(PEER), String(ACTOR)]);
});

test('unknown channel ids, cross channels and recovered-gap commands are rejected', t => {
  const env = setup(t);
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.enter, 1), error => error instanceof GameError && error.code === 1);
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [15, []]), error => error instanceof GameError && error.code === 5);
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.crossData, []), error => error instanceof GameError && error.code === 5);
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.tipsLookPlayer, [1]), error => error instanceof GameError && error.code === 5);
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [2, []]), error => error instanceof GameError && error.code === 5);
});

test('10510 records logs without appending channel history', t => {
  const env = setup(t);
  env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
  const result = env.service.executeBinary(MESSAGE_COMMANDS.logSend, codec.pack('pb_req_send_msg', {
    channel_id: '10100001',
    content_bin: Buffer.from('log only', 'utf8')
  }));
  assert.equal(result.data.length, 0);
  const history = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_history').get());
  const logs = env.store.inspect(db => db.prepare('SELECT content FROM message_logs').all());
  assert.equal(Number(history.count), 0);
  assert.equal(logs.length, 1);
  assert.equal(Buffer.from(logs[0].content).toString('utf8'), 'log only');
});

test('a protobuf encode failure rolls the channel join back', t => {
  const brokenCodec = {
    ...codec,
    pack(name, object) {
      if (name === 'pb_msg_range_list_with_role_info') throw new Error('encode failure');
      return codec.pack(name, object);
    }
  };
  const env = setup(t, { codec: brokenCodec });
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.enter, 10100001), /encode failure/);
  const members = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_members').get());
  const channels = env.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM message_channels').get());
  assert.equal(Number(members.count), 0);
  assert.equal(Number(channels.count), 0);
});

test('message history survives a store reopen', t => {
  const env = setup(t);
  env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
  sendMessage(env.service, 10100001, 'durable');
  const reopened = env.reopen();
  const range = reopened.execute(MESSAGE_COMMANDS.range, [10100001, 1, 5]);
  const body = codec.unpack('pb_msg_range_list_with_role_info', range.data);
  assert.equal(body.msg_list.length, 1);
  assert.equal(Buffer.from(body.msg_list[0].content, 'base64').toString('utf8'), 'durable');
});

test('10508 login payload replays joined channels', t => {
  const env = setup(t);
  env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [1, []]);
  sendMessage(env.service, 10100001, 'login payload');
  const payload = env.service.loginPayload();
  const body = codec.unpack('pb_res_msg_login', payload);
  assert.equal(body.channel_msg_list.length, 1);
  assert.equal(body.channel_msg_list[0].channel_id, '10100001');
  assert.equal(body.channel_msg_list[0].msg_list.length, 1);
  assert.equal(body.role_info_list.length, 1);
});

test('private channels require a peer role and carry an ETF extra', t => {
  const env = setup(t);
  assert.throws(() => env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [3, []]), error => error instanceof GameError && error.code === 1);
  const result = env.service.execute(MESSAGE_COMMANDS.getChannelIdAndEnter, [3, [PEER]]);
  const body = codec.unpack('pb_msg_range_list_with_role_info', result.data);
  assert.equal(body.channel_id, String(channelIdFor(3, PEER)));
  assert.ok(body.extraData.length > 0);
});
