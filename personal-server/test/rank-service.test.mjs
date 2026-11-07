import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createRankService } from '../game/rank-service.mjs';
import { readRankTables, RANK_IDS } from '../config/rank-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec(), tables = readRankTables();

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-rank-', ...options });
  const service = createRankService({ codec, store: fixture.store, tables, now: () => 1_800_000_000_000 });
  return { fixture, service };
}

function unpack(service, type, input, schema) {
  const result = service.execute(type, input);
  assert.equal(result.schema, schema);
  return codec.unpack(schema, result.data);
}

function objs(board) {
  return board.rank_list.map(bytes => codec.unpack('pb_rank_obj', Buffer.from(bytes, 'base64')));
}

test('authoritative mission state produces a persistent real rank and survives reopen', t => {
  const { fixture, service } = setup(t);
  assert.ok(service.synchronize() > 0);
  const board = unpack(service, 2000, [RANK_IDS.MISSION], 'rank_to_client');
  assert.equal(board.rank_id, String(RANK_IDS.MISSION));
  assert.equal(board.self_rank, 1);
  assert.equal(board.self_value, '20205');
  assert.equal(board.total, '1');
  assert.deepEqual(objs(board).map(item => [item.id, item.value]), [['100001', '20205']]);

  fixture.open();
  const reopened = createRankService({ codec, store: fixture.store, tables });
  assert.deepEqual(objs(unpack(reopened, 2000, [RANK_IDS.MISSION], 'rank_to_client')), objs(board));
});

test('score ordering uses value, configured direction, minimum value and numeric tie breaker', t => {
  const { service } = setup(t);
  for (const [participantId, value] of [[100003, 50], [100002, 50], [100004, 100], [100005, -1]]) {
    if (value < 0) continue;
    service.recordScore({ rankId: RANK_IDS.SWAP_ARENA, participantId, value, serverId: 1 });
  }
  const board = unpack(service, 2002, [RANK_IDS.SWAP_ARENA, 2], 'rank_to_client');
  assert.deepEqual(objs(board).map(item => item.id), ['100004', '100002']);
  assert.equal(board.total, '3');

  service.recordScore({ rankId: 62, participantId: 100002, value: 2 });
  service.recordScore({ rankId: 62, participantId: 100003, value: 1 });
  const reverse = unpack(service, 2002, [62, 10], 'rank_to_client');
  assert.deepEqual(objs(reverse).map(item => item.value), ['1', '2']);
  assert.throws(() => service.recordScore({ rankId: RANK_IDS.SWAP_ARENA, participantId: 100002, value: -1 }), error => error.code === 1);
  assert.throws(() => service.execute(2000, [999999]), error => error.code === 1);
});

test('current, appointed, cross, batch ETF and protobuf views read the same ranking rows', t => {
  const { service } = setup(t);
  for (const [participantId, serverId, value] of [[100001, 1, 100], [100002, 2, 200], [100003, 1, 300]]) {
    service.recordScore({ rankId: RANK_IDS.PET_SCORE, participantId, value, serverId });
  }

  const current = unpack(service, 2007, [RANK_IDS.PET_SCORE, 100002], 'rank_info');
  assert.deepEqual([current.id, current.rank, current.value], ['100002', 2, '200']);
  const etfBatch = unpack(service, 2003, [100001, [RANK_IDS.PET_SCORE, RANK_IDS.MISSION]], 'pb_rev_rank');
  assert.deepEqual(etfBatch.infos.map(info => [info.rank_id, info.value]), [
    [String(RANK_IDS.PET_SCORE), '100'],
    [String(RANK_IDS.MISSION), '20205']
  ]);
  const legacyBatch = unpack(service, 2010, [100003, [RANK_IDS.PET_SCORE]], 'pb_rev_rank');
  assert.deepEqual([legacyBatch.id, legacyBatch.infos[0].rank, legacyBatch.infos[0].value], ['100003', 1, '300']);

  const pb = codec.unpack('pb_batch_seq_rank', codec.pack('pb_batch_seq_rank', {
    seq_ranks: [{ id: '100002', rank_id_list: [String(RANK_IDS.PET_SCORE)] }]
  }));
  const pbBatch = unpack(service, 2004, pb, 'pb_batch_rev_rank');
  assert.deepEqual(pbBatch.rev_ranks.map(rev => [rev.id, rev.infos[0].rank, rev.infos[0].value]), [['100002', 2, '200']]);

  const cross = unpack(service, 2005, [RANK_IDS.PET_SCORE, RANK_IDS.PET_SCORE], 'pb_rank_cross_group_top');
  assert.deepEqual(cross.top_list.map(top => [top.server_id, top.rank_list.map(info => info.id)]), [
    ['1', ['100003', '100001']], ['2', ['100002']]
  ]);
});

test('backup readers prefer the last pre-update board and only empty when no participant exists', t => {
  const { service } = setup(t);
  service.recordScore({ rankId: RANK_IDS.SWAP_ARENA, participantId: 100001, value: 100 });
  service.recordScore({ rankId: RANK_IDS.SWAP_ARENA, participantId: 100001, value: 200 });
  const current = unpack(service, 2000, [RANK_IDS.SWAP_ARENA], 'rank_to_client');
  const backup = unpack(service, 2008, RANK_IDS.SWAP_ARENA, 'rank_to_client');
  assert.equal(objs(current)[0].value, '200');
  assert.equal(objs(backup)[0].value, '100');
  const batch = unpack(service, 2011, [RANK_IDS.SWAP_ARENA, RANK_IDS.MISSION], 'rank_to_client_list');
  assert.deepEqual(batch.client_list.map(board => board.rank_id), [String(RANK_IDS.SWAP_ARENA), String(RANK_IDS.MISSION)]);
  assert.equal(objs(batch.client_list[0])[0].value, '100');
  assert.equal(batch.client_list[1].rank_list.length, 1);
  assert.deepEqual(unpack(service, 2011, [], 'rank_to_client_list').client_list, []);
});

test('bubble updates remain bounded, transactional and visible on later boards', t => {
  const { fixture, service } = setup(t);
  const result = service.execute(2009, '  Local banner  ');
  assert.equal(result.schema, 'etf-fallback');
  assert.deepEqual(result.value, { id: '100001', notice: 'Local banner' });
  assert.deepEqual(fixture.store.read().state.rankBubble, { id: '100001', notice: 'Local banner' });
  const board = unpack(service, 2000, [RANK_IDS.MISSION], 'rank_to_client');
  assert.deepEqual(board.bubbles, [{ id: '100001', notice: 'Local banner' }]);
  fixture.open();
  const reopened = createRankService({ codec, store: fixture.store, tables });
  assert.deepEqual(unpack(reopened, 2000, [RANK_IDS.MISSION], 'rank_to_client').bubbles, board.bubbles);
  for (const input of [null, '', '   ', 'x'.repeat(57), 42]) assert.throws(() => service.execute(2009, input), error => error.code === 1);
});

test('encoding and SQLite failures roll back synchronisation in the same transaction', t => {
  const first = setup(t);
  const failingCodec = Object.create(codec);
  failingCodec.pack = (schema, ...args) => {
    if (schema === 'rank_to_client') throw new Error('encode fail');
    return codec.pack(schema, ...args);
  };
  const encodedFailure = createRankService({ codec: failingCodec, store: first.fixture.store, tables });
  assert.throws(() => encodedFailure.execute(2000, [RANK_IDS.MISSION]), /encode fail/);
  assert.equal(first.fixture.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM rank_entries').get().count), 0);

  const second = setup(t);
  second.fixture.store.inspect(db => db.exec("CREATE TRIGGER reject_rank_insert BEFORE INSERT ON rank_entries BEGIN SELECT RAISE(ABORT,'deny'); END"));
  assert.throws(() => second.service.execute(2000, [RANK_IDS.MISSION]), /deny/);
  assert.equal(second.fixture.store.inspect(db => db.prepare('SELECT COUNT(*) AS count FROM rank_entries').get().count), 0);
});

test('malformed rank requests are rejected without client supplied state', t => {
  const { service } = setup(t);
  for (const [type, input] of [[2000, []], [2000, [0]], [2002, [RANK_IDS.POWER]], [2002, [RANK_IDS.POWER, 0]], [2005, [RANK_IDS.PET_SCORE]], [2006, []], [2007, [RANK_IDS.POWER]], [2008, [RANK_IDS.POWER]], [2010, [100001, []]], [2011, [0]]]) {
    assert.throws(() => service.execute(type, input), error => error.code === 1);
  }
});
