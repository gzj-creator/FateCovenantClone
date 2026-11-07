import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createFriendService, FRIEND_COMMANDS, FRIEND_PUSH_TYPES } from '../game/friend-service.mjs';
import { readFriendTables } from '../config/friend-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readFriendTables();
const serverOpenedAt = Date.parse('2026-10-24T05:00:00+08:00') / 1000;
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);
const DAY = 86400000;
const ACTOR = 100001;

function roleProfile(level, name) {
  return JSON.stringify(codec.unpack('to_client_role_info', codec.pack('to_client_role_info', {
    level,
    nick_name: Buffer.from(name, 'utf8')
  })));
}

function addRole(fixture, roleId, level, name) {
  fixture.store.inspect(db => db.prepare('INSERT INTO roles VALUES (?,?,?,?,?)').run(
    roleId, 1, 1700000000, roleProfile(level, name), JSON.stringify({})
  ));
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-friend-service-', serverOpenedAt });
  for (const role of options.roles ?? [
    { roleId: 100002, level: 9, name: 'Peer Two' },
    { roleId: 100003, level: 55, name: 'Peer Three' },
    { roleId: 100004, level: 75, name: 'Peer Four' }
  ]) addRole(fixture, role.roleId, role.level, role.name);
  let now = options.now ?? fixedNow;
  let service = createFriendService({
    store: fixture.store,
    codec: options.codec ?? codec,
    tables,
    serverOpenedAt,
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
      service = createFriendService({
        store,
        codec: next.codec ?? options.codec ?? codec,
        tables,
        serverOpenedAt,
        now: () => next.now ?? now,
        logger: options.logger
      });
      return service;
    }
  };
}

function loginState(service) {
  const payload = codec.unpack('res_friend_login', service.loginPayload());
  return payload;
}

const count = (store, sql, ...args) => Number(store.inspect(db => db.prepare(sql).get(...args).count));

// A second role's own session writes the application row the client would send.
function peerApply(harness, peerRoleId) {
  harness.store.inspect(db => db.prepare('INSERT OR IGNORE INTO friend_applies VALUES (?,?,?)')
    .run(ACTOR, peerRoleId, new Date(fixedNow).toISOString()));
}

function befriend(harness, peerRoleId) {
  peerApply(harness, peerRoleId);
  const agreed = codec.unpack('res_agree_applies', harness.service.execute(FRIEND_COMMANDS.agree, [peerRoleId]).data);
  assert.deepEqual(agreed.success_list, [String(peerRoleId)]);
}

test('FriendTable asset exposes the shipped limits and parameters', () => {
  assert.equal(tables.limit.length, 4);
  assert.deepEqual(tables.limit.map(row => [row.lv_range, row.max_friend_count, row.max_receive_friendship_count]), [
    [[1, 49], 60, 30], [[50, 59], 80, 40], [[60, 69], 90, 50], [[70, 999], 100, 60]
  ]);
  assert.deepEqual(tables.limit[0].daily_present_rewards, [[401900, 300]]);
  assert.equal(tables.param.max_apply_count, 30);
  assert.equal(tables.param.max_present_friendship_count, 20);
  assert.equal(tables.param.max_black_list_count, 100);
  assert.equal(tables.param.recommend_count, 5);
  assert.equal(tables.param.recommend_lv_limit, 10);
  assert.equal(tables.param.recommend_reset_time, 5);
  assert.equal(tables.param.max_private_count, 10);
  assert.equal(tables.param.accuss_count, 300);
  assert.equal(tables.param.friendship_exchange_ratio, 100);
  assert.equal(tables.param.present_exchange_ratio, 10);
  assert.deepEqual(tables.param.present_rewards, []);
  assert.deepEqual(tables.param.rev_rewards, []);
  assert.deepEqual(tables.recommend.map(row => row.tid), [1, 2, 3, 4]);
  assert.equal(tables.limitForLevel(55).tid, 2);
  assert.equal(tables.limitForLevel(0).tid, 4);
});

test('20001 applies, 20003 accepts and the pair survives reopening', t => {
  const harness = setup(t);
  const applied = codec.unpack('res_apply_friends', harness.service.execute(FRIEND_COMMANDS.apply, [100002]).data);
  assert.deepEqual(applied.friend_list, []);
  assert.deepEqual(applied.err_list, []);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_applies'), 1);
  assert.deepEqual(loginState(harness.service).friend_data.applies, []);

  const repeated = codec.unpack('res_apply_friends', harness.service.execute(FRIEND_COMMANDS.apply, [100002]).data);
  assert.deepEqual(repeated.err_list, ['310']);

  harness.reopen();
  peerApply(harness, 100002);
  assert.deepEqual(loginState(harness.service).friend_data.applies, ['100002']);
  const agreed = codec.unpack('res_agree_applies', harness.service.execute(FRIEND_COMMANDS.agree, [100002]).data);
  assert.deepEqual(agreed.success_list, ['100002']);
  assert.deepEqual(agreed.err_list, []);
  harness.reopen();
  const reloaded = loginState(harness.service);
  assert.deepEqual(reloaded.friend_data.friend_list.map(row => row.id), ['100002']);
  assert.deepEqual(reloaded.friend_data.applies, []);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_links'), 2);

  const removed = harness.service.execute(FRIEND_COMMANDS.remove, [100002]);
  assert.equal(removed.data.length, 0);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_links'), 0);
  assert.deepEqual(loginState(harness.service).friend_data.friend_list, []);
});

test('apply and agree reject real-save violations with business codes', t => {
  const harness = setup(t);
  const selfApply = codec.unpack('res_apply_friends', harness.service.execute(FRIEND_COMMANDS.apply, [ACTOR]).data);
  assert.deepEqual(selfApply.err_list, ['5']);
  const unknown = codec.unpack('res_apply_friends', harness.service.execute(FRIEND_COMMANDS.apply, [999999]).data);
  assert.deepEqual(unknown.err_list, ['5']);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_applies'), 0);

  const notApplied = codec.unpack('res_agree_applies', harness.service.execute(FRIEND_COMMANDS.agree, [100002]).data);
  assert.deepEqual(notApplied.success_list, []);
  assert.deepEqual(notApplied.err_list, ['5']);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.remove, [100002]), error => error.code === 5);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.refuse, [100002]), error => error.code === 5);
});

test('mutual apply completes the pair and 20004 refuses pending applications', t => {
  const harness = setup(t);
  harness.store.transaction((model, db) => {
    db.prepare('INSERT INTO friend_applies VALUES (?,?,?)').run(ACTOR, 100002, new Date(fixedNow).toISOString());
  });
  assert.deepEqual(loginState(harness.service).friend_data.applies, ['100002']);
  const accepted = codec.unpack('res_apply_friends', harness.service.execute(FRIEND_COMMANDS.apply, [100002]).data);
  assert.deepEqual(accepted.friend_list, ['100002']);
  assert.deepEqual(loginState(harness.service).friend_data.applies, []);
  harness.service.execute(FRIEND_COMMANDS.remove, [100002]);

  harness.store.transaction((model, db) => {
    db.prepare('INSERT INTO friend_applies VALUES (?,?,?)').run(ACTOR, 100003, new Date(fixedNow).toISOString());
  });
  assert.equal(harness.service.execute(FRIEND_COMMANDS.refuse, [100003]).value.refused, 1);
  assert.deepEqual(loginState(harness.service).friend_data.applies, []);
});

test('20005/20006 blacklist respects duplicates, limits and login projection', t => {
  const harness = setup(t);
  harness.service.execute(FRIEND_COMMANDS.addBlacklist, [100002]);
  assert.deepEqual(loginState(harness.service).friend_data.blacklist, ['100002']);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.addBlacklist, [100002]), error => error.code === 310);
  harness.service.execute(FRIEND_COMMANDS.removeBlacklist, [100002]);
  assert.deepEqual(loginState(harness.service).friend_data.blacklist, []);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.removeBlacklist, [100002]), error => error.code === 310);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.addBlacklist, [ACTOR]), error => error.code === 5);
});

test('blacklist capacity follows Param.max_black_list_count', t => {
  const roles = [];
  for (let index = 0; index < 101; index += 1) roles.push({ roleId: 110000 + index, level: 9, name: 'Block ' + index });
  const harness = setup(t, { roles });
  for (let index = 0; index < 100; index += 1) harness.service.execute(FRIEND_COMMANDS.addBlacklist, [110000 + index]);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.addBlacklist, [110100]), error => error.code === 5);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_blacklist'), 100);
});

test('20007/20008 keep the daily present and receive ledger per server day', t => {
  const harness = setup(t);
  const { day } = harness.service.ensureLoginState();
  for (const id of [100002, 100003]) befriend(harness, id);
  const presented = codec.unpack('res_friendship_change', harness.service.execute(FRIEND_COMMANDS.present, [100002]).data);
  assert.deepEqual(presented.friendship.present_today, ['100002']);
  assert.equal(presented.friendship.day, day);
  assert.deepEqual(presented.res.changes, []);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.present, [100002]), error => error.code === 310);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.present, [100004]), error => error.code === 5);

  // Another role's own present session writes the same ledger row for this role.
  harness.store.inspect(db => db.prepare('INSERT INTO friend_gifts VALUES (?,?,?,?,NULL)')
    .run(day, 100003, ACTOR, new Date(fixedNow).toISOString()));
  const received = codec.unpack('res_friendship_change', harness.service.execute(FRIEND_COMMANDS.receive, [100003]).data);
  assert.deepEqual(received.friendship.to_receive_today, []);
  assert.deepEqual(received.friendship.received_today, ['100003']);
  assert.equal(received.friendship.received_count_today, 1);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.receive, [100003]), error => error.code === 310);

  harness.setNow(fixedNow + DAY);
  harness.reopen();
  const next = codec.unpack('res_friendship_change', harness.service.execute(FRIEND_COMMANDS.present, [100002]).data);
  assert.equal(next.friendship.day, day + 1);
  assert.deepEqual(next.friendship.present_today, ['100002']);
  assert.deepEqual(loginState(harness.service).friendship_data.received_today, []);
});

test('present and receive caps follow the FriendTable limits', t => {
  const roles = [];
  for (let index = 0; index < 31; index += 1) roles.push({ roleId: 120000 + index, level: 9, name: 'Present ' + index });
  const harness = setup(t, { roles });
  for (const role of roles) befriend(harness, role.roleId);
  harness.service.execute(FRIEND_COMMANDS.present, roles.slice(0, 20).map(role => role.roleId));
  assert.throws(
    () => harness.service.execute(FRIEND_COMMANDS.present, [roles[20].roleId]),
    error => error.code === 5
  );
  // Level 9 actor: Limit row 1 allows 30 received friends per day.
  const { day } = harness.service.ensureLoginState();
  for (let index = 0; index < 31; index += 1) {
    harness.store.inspect(db => db.prepare('INSERT INTO friend_gifts VALUES (?,?,?,?,NULL)')
      .run(day, roles[index].roleId, ACTOR, new Date(fixedNow).toISOString()));
  }
  const first = roles.slice(0, 30).map(role => role.roleId);
  harness.service.execute(FRIEND_COMMANDS.receive, first);
  assert.throws(
    () => harness.service.execute(FRIEND_COMMANDS.receive, [roles[30].roleId]),
    error => error.code === 5
  );
});

test('20011 one key present and receive commits both sides in one transaction', t => {
  const harness = setup(t);
  const { day } = harness.service.ensureLoginState();
  for (const id of [100002, 100003]) befriend(harness, id);
  harness.store.inspect(db => db.prepare('INSERT INTO friend_gifts VALUES (?,?,?,?,NULL)')
    .run(day, 100003, ACTOR, new Date(fixedNow).toISOString()));
  const result = codec.unpack('res_friendship_change', harness.service.execute(
    FRIEND_COMMANDS.oneKeyPresentAndReceive, [[100002], [100003]]
  ).data);
  assert.deepEqual(result.friendship.present_today, ['100002']);
  assert.deepEqual(result.friendship.received_today, ['100003']);
  assert.equal(result.friend_list.length, 2);

  assert.throws(
    () => harness.service.execute(FRIEND_COMMANDS.oneKeyPresentAndReceive, [[100003], [100002]]),
    error => error.code === 310
  );
  assert.deepEqual(loginState(harness.service).friendship_data.present_today, ['100002']);
});

test('20009 query and 20010 recommend only return real save roles', t => {
  const harness = setup(t);
  const byId = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.query, '100003').data);
  assert.deepEqual(byId.player_info_list.map(row => row.role_id), ['100003']);
  const byName = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.query, 'Peer Two').data);
  assert.deepEqual(byName.player_info_list.map(row => row.role_id), ['100002']);
  const missing = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.query, '999999').data);
  assert.deepEqual(missing.player_info_list, []);
  const self = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.query, String(ACTOR)).data);
  assert.deepEqual(self.player_info_list, []);

  const recommended = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.recommend, null).data);
  assert.deepEqual(recommended.player_info_list.map(row => row.role_id), ['100002', '100003', '100004']);
  assert.deepEqual(recommended.player_info_list[0].recommend_types, []);
  befriend(harness, 100002);
  harness.service.execute(FRIEND_COMMANDS.addBlacklist, [100003]);
  const filtered = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.recommend, null).data);
  assert.deepEqual(filtered.player_info_list.map(row => row.role_id), ['100004']);

  const typed = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.recommendTypes, [1]).data);
  assert.deepEqual(typed.player_info_list, []);
});

test('single-role saves keep recommendations empty and reject invented targets', t => {
  const harness = setup(t, { roles: [] });
  const recommended = codec.unpack('res_query_friend_player', harness.service.execute(FRIEND_COMMANDS.recommend, null).data);
  assert.deepEqual(recommended.player_info_list, []);
  const applied = codec.unpack('res_apply_friends', harness.service.execute(FRIEND_COMMANDS.apply, [100002]).data);
  assert.deepEqual(applied.err_list, ['5']);
  assert.deepEqual(loginState(harness.service).friend_data.friend_list, []);
});

test('20013 records a report for a real role and enforces accuss_count', t => {
  const harness = setup(t);
  const result = harness.service.execute(FRIEND_COMMANDS.saveReport, [100002, 'spam']);
  assert.equal(result.data.length, 0);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_reports'), 1);
  assert.throws(
    () => harness.service.execute(FRIEND_COMMANDS.saveReport, [100002, 'x'.repeat(301)]),
    error => error.code === 1
  );
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.saveReport, [999999, 'spam']), error => error.code === 5);
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.saveReport, ['spam']), error => error.code === 1);
});

test('PB encoding failure rolls back applications and friendships', t => {
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'res_apply_friends') throw new Error('friend encode failure');
      return codec.pack(name, value);
    }
  };
  const harness = setup(t, { codec: failing });
  assert.throws(() => harness.service.execute(FRIEND_COMMANDS.apply, [100002]), /friend encode failure/);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_applies'), 0);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_friendship'), 0);
});

test('SQLite write rejection rolls back the whole one-key transaction', t => {
  const harness = setup(t);
  for (const id of [100002, 100003]) befriend(harness, id);
  harness.store.inspect(db => db.exec(
    "CREATE TRIGGER friend_gift_reject BEFORE INSERT ON friend_gifts BEGIN SELECT RAISE(ABORT,'friend_gift_write_rejected'); END;"
  ));
  assert.throws(
    () => harness.service.execute(FRIEND_COMMANDS.oneKeyPresentAndReceive, [[100002], []]),
    /friend_gift_write_rejected/
  );
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM friend_gifts'), 0);
  const state = harness.service.ensureLoginState();
  assert.equal(state.day, codec.unpack('pb_friendship', codec.pack('pb_friendship', { day: state.day })).day);
  assert.deepEqual(loginState(harness.service).friendship_data.present_today, []);
});

test('login payload and push builders expose only evidenced payloads', async t => {
  const harness = setup(t);
  const state = loginState(harness.service);
  assert.deepEqual(state.friend_data.friend_list, []);
  assert.deepEqual(state.friendship_data.present_today, []);
  const reduce = harness.service.pushPayload.reduce(100002);
  assert.equal(codec.unpack('res_friend_reduce', reduce).friend_role_id, '100002');
  const change = await harness.service.pushPayload.friendshipChange({ day: 3, flower: '0' }, { id: '100002', favors: 0 });
  assert.ok(change.length > 0);
  assert.throws(() => harness.service.pushPayload.append(), error => error.code === 5);
  assert.throws(() => harness.service.pushPayload.applyAppend(), error => error.code === 5);
  assert.equal(FRIEND_PUSH_TYPES.append, 2200);
  assert.equal(FRIEND_PUSH_TYPES.reduce, 2201);
  assert.equal(FRIEND_PUSH_TYPES.applyAppend, 2202);
  assert.equal(FRIEND_PUSH_TYPES.friendshipChange, 2203);
});
