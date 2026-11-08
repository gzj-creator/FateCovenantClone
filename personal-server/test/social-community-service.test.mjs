import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createSocialCommunityService, COMMUNITY_COMMANDS as C } from '../game/social-community-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const serverOpenedAt = Date.parse('2026-10-24T05:00:00+08:00') / 1000;
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);
const ACTOR = 100001;

function roleProfile(level, name) {
  return JSON.stringify(codec.unpack('to_client_role_info', codec.pack('to_client_role_info', {
    level, nick_name: Buffer.from(name, 'utf8')
  })));
}

function addRole(store, roleId, level, name) {
  store.inspect(db => db.prepare('INSERT OR REPLACE INTO roles VALUES (?,?,?,?,?)').run(
    roleId, 1, 1700000000, roleProfile(level, name), JSON.stringify({})
  ));
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-community-', serverOpenedAt });
  addRole(fixture.store, 100002, 12, 'Peer Two');
  addRole(fixture.store, 100003, 30, 'Peer Three');
  let now = options.now ?? fixedNow;
  let service = createSocialCommunityService({
    store: fixture.store, codec: options.codec ?? codec, serverOpenedAt, now: () => now, logger: options.logger
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    setNow(value) { now = value; },
    reopen(next = {}) {
      const store = fixture.open();
      service = createSocialCommunityService({
        store, codec: next.codec ?? options.codec ?? codec, serverOpenedAt, now: () => next.now ?? now, logger: options.logger
      });
      return service;
    }
  };
}

const count = (store, sql, ...args) => Number(store.inspect(db => db.prepare(sql).get(...args).count));

test('46001 support writes the real ledger and enforces the daily cap', t => {
  const harness = setup(t);
  const reply = codec.unpack('support_to_client', harness.service.execute(C.supportPlayer, [1, 100002]).data);
  assert.equal(reply.info.support_list[0].times, 1);
  assert.equal(String(reply.info.support_list[0].support[0].role_id), '100002');
  assert.equal(count(harness.store, 'SELECT SUM(count) AS count FROM community_support WHERE type=1'), 1);
  assert.equal(count(harness.store, 'SELECT SUM(count) AS count FROM community_supported WHERE role_id=100002'), 1);

  for (let i = 0; i < 9; i += 1) harness.service.execute(C.supportPlayer, [1, 100003]);
  assert.throws(() => harness.service.execute(C.supportPlayer, [1, 100002]), error => error.code === 5);
  assert.equal(count(harness.store, 'SELECT SUM(count) AS count FROM community_support WHERE role_id=?', ACTOR), 10);
  assert.throws(() => harness.service.execute(C.supportPlayer, [1, ACTOR]), error => error.code === 1);
});

test('46001 rejects unknown targets and 46002 stays an empty by-shape gap', t => {
  const harness = setup(t);
  assert.throws(() => harness.service.execute(C.supportPlayer, [1, 999999]), error => error.code === 5);
  const empty = harness.service.execute(C.getSupported);
  assert.equal(empty.data.length, 0);
  assert.equal(empty.value.gap, 'supported ETF shape unknown');
});

test('75001/75004/75003/75002 maintain map presence in SQLite', t => {
  const harness = setup(t);
  const entered = codec.unpack('pb_realtime_enter_map_back', harness.service.execute(C.mapEnter, { map_id: 7 }).data);
  assert.equal(String(entered.id), '7');
  assert.deepEqual(entered.role_list.map(row => String(row.id)), [String(ACTOR)]);
  harness.service.execute(C.mapMove, { map_id: 7, dest_loc: 4 });
  const moved = harness.store.inspect(db => db.prepare('SELECT loc_index FROM community_map_presence WHERE map_id=7 AND role_id=?').get(ACTOR));
  assert.equal(Number(moved.loc_index), 4);
  assert.throws(() => harness.service.execute(C.mapTeleport, { map_id: 8 }), error => error.code === 5);
  harness.service.execute(C.mapBackBorn);
  const born = harness.store.inspect(db => db.prepare('SELECT loc_index FROM community_map_presence WHERE map_id=7 AND role_id=?').get(ACTOR));
  assert.equal(Number(born.loc_index), 0);
  assert.equal(harness.service.execute(C.mapLeave, { map_id: 7 }).data.length, 0);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM community_map_presence WHERE map_id=7'), 0);
});

test('76603 add, 76601 init, 76604 score and 76602 like move through real comments', t => {
  const harness = setup(t);
  const added = codec.unpack('pb_hero_comments', harness.service.execute(C.commentAdd, { hero_tid: 200101, content: 'nice hero' }).data);
  assert.equal(added.comments.length, 1);
  assert.equal(added.comments[0].content, 'nice hero');
  const commentId = Number(added.comments[0].uid);

  const init = codec.unpack('pb_hero_comment_info', harness.service.execute(C.commentInitHero, { hero_tid: 200101 }).data);
  assert.equal(Number(init.hero_tid), 200101);
  const comments = codec.unpack('pb_hero_comments', Buffer.from(init.comments ?? '', 'base64'));
  assert.equal(comments.comments.length, 1);

  const scored = codec.unpack('pb_role_comment_info', harness.service.execute(C.commentSetScore, { hero_tid: 200101, score: 4 }).data);
  assert.equal(scored.all_record[0].score, 4);
  assert.throws(() => harness.service.execute(C.commentSetScore, { hero_tid: 200101, score: 9 }), error => error.code === 1);

  const liked = codec.unpack('pb_role_comment_info', harness.service.execute(C.commentLike, { hero_tid: 200101, uid: commentId }).data);
  assert.equal(liked.remind_like_count, 9);
  assert.throws(() => harness.service.execute(C.commentLike, { hero_tid: 200101, uid: commentId }), error => error.code === 5);
  const stored = harness.store.inspect(db => db.prepare('SELECT like_count FROM community_comments WHERE comment_id=?').get(commentId));
  assert.equal(Number(stored.like_count), 1);
});

test('77501/77502/77503 mark, unmark and mute relationships', t => {
  const harness = setup(t);
  const marked = codec.unpack('pb_relation_mark_rsp', harness.service.execute(C.relationMark, { tid: 5, dst: 100002 }).data);
  assert.equal(Buffer.from(marked.custom ?? '', 'base64').length, 0);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM community_relations'), 1);
  assert.throws(() => harness.service.execute(C.relationMark, { tid: 5, dst: ACTOR }), error => error.code === 1);
  assert.equal(harness.service.execute(C.relationSetNoNotify, [5, 100002, 1]).value.no_notify, true);
  const unmuted = harness.store.inspect(db => db.prepare('SELECT no_notify FROM community_relations WHERE role_id=? AND tid=5 AND dst=100002').get(ACTOR));
  assert.equal(Number(unmuted.no_notify), 1);
  const unmarked = codec.unpack('pb_relation_un_mark_rsp', harness.service.execute(C.relationUnmark, { tid: 5, dst: 100002 }).data);
  assert.equal(Buffer.from(unmarked.custom ?? '', 'base64').length, 0);
  assert.throws(() => harness.service.execute(C.relationUnmark, { tid: 5, dst: 100002 }), error => error.code === 5);
});

test('77601/79201 return empty ETF lists and 84701 counts danmaku likes', t => {
  const harness = setup(t);
  for (const type of [C.adventureRoleList, C.heroStrategyRanks]) {
    const out = harness.service.execute(type);
    assert.deepEqual([...out.data], [131, 106]);
    assert.equal(out.value.gap, 'ETF list element shape unknown');
  }
  const first = harness.service.execute(C.likeDanmaku, { channel_id: 3, msg_idx: 1 });
  assert.equal(first.value.count, 1);
  const again = harness.service.execute(C.likeDanmaku, { channel_id: 3, msg_idx: 1 });
  assert.equal(again.value.count, 2);
});

test('support ledger survives a SQLite reopen', t => {
  const harness = setup(t);
  harness.service.execute(C.supportPlayer, [1, 100002]);
  harness.reopen();
  assert.equal(count(harness.store, 'SELECT SUM(count) AS count FROM community_support WHERE role_id=?', ACTOR), 1);
  assert.equal(count(harness.store, 'SELECT SUM(count) AS count FROM community_supported WHERE role_id=100002'), 1);
});

test('PB encoding failure rolls back the support insert', t => {
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'support_to_client') throw new Error('support encode failure');
      return codec.pack(name, value);
    }
  };
  const harness = setup(t, { codec: failing });
  assert.throws(() => harness.service.execute(C.supportPlayer, [1, 100002]), /support encode failure/);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM community_support'), 0);
  assert.equal(count(harness.store, 'SELECT COUNT(*) AS count FROM community_supported'), 0);
});
