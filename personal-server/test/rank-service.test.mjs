import assert from 'node:assert/strict';
import test from 'node:test';
import { E, createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createRankService } from '../game/rank-service.mjs';

const codec = createGameCodec(), service = createRankService({ codec });

test('batch archived rankings preserve each requested ID and encode explicitly empty boards', () => {
  const result = service.execute(2011, [1001, 2002, 1001]);
  assert.equal(result.schema, 'rank_to_client_list');
  const boards = codec.unpack(result.schema, result.data).client_list;
  assert.deepEqual(boards.map(board => board.rank_id), ['1001', '2002']);
  for (const board of boards) {
    assert.deepEqual(board.rank_list, []);
    assert.equal(board.self_rank ?? 0, 0);
    assert.equal(board.self_value ?? '0', '0');
    assert.equal(board.total ?? '0', '0');
  }
  assert.deepEqual(codec.unpack(result.schema, service.execute(2011, []).data).client_list, []);
  assert.equal(service.execute(2011, new E.OtpErlangList([1001], false)).value.client_list.length, 1);
});

test('current and single archived ranking readers return the matching board schema', () => {
  for (const [type, input] of [[2000, [1001]], [2008, 1001]]) {
    assert.ok(service.supports(type));
    const result = service.execute(type, input);
    assert.equal(result.schema, 'rank_to_client');
    assert.equal(codec.unpack(result.schema, result.data).rank_id, '1001');
  }
});

test('avatar profile rank info reports the requested role as unranked', async () => {
  assert.ok(service.supports(2001));
  const result = service.execute(2001, [53, 100001]);
  assert.equal(result.schema, 'rank_info');
  const info = codec.unpack(result.schema, result.data);
  assert.equal(info.id, '100001');
  assert.equal(info.rank_id, '53');
  assert.equal(info.rank ?? 0, 0);
  assert.equal(info.value ?? '0', '0');
  assert.equal(info.extra ?? '', '');
  const captured = await decodeEtf(Buffer.from('g2wAAAACYTViAAGGoWo=', 'base64'));
  assert.deepEqual(service.execute(2001, captured).data, result.data);
  const other = codec.unpack('rank_info', service.execute(2001, [54, 100002]).data);
  assert.equal(other.id, '100002');
  assert.equal(other.rank_id, '54');
});

test('all remaining leaderboard readers return explicit empty data with the requested IDs', async () => {
  for (const type of [2002, 2005, 2006, 2007, 2009, 2010]) assert.ok(service.supports(type));

  let result = service.execute(2002, [53, 5]);
  assert.equal(result.schema, 'rank_to_client');
  assert.equal(codec.unpack(result.schema, result.data).rank_id, '53');

  result = service.execute(2005, [7, 53]);
  assert.equal(result.schema, 'pb_rank_cross_group_top');
  assert.deepEqual(codec.unpack(result.schema, result.data).top_list, []);

  result = service.execute(2006, [53, 54, 53]);
  assert.equal(result.schema, 'rank_to_client');
  assert.equal(codec.unpack(result.schema, result.data).rank_id, '53');

  result = service.execute(2007, [53, 100001]);
  assert.equal(result.schema, 'rank_info');
  const appointed = codec.unpack(result.schema, result.data);
  assert.deepEqual([appointed.id, appointed.rank_id, appointed.rank ?? 0, appointed.value ?? '0', appointed.extra ?? ''], ['100001', '53', 0, '0', '']);

  const capturedBatch = await decodeEtf(await encodeEtf([100001, [53, 54]]));
  result = service.execute(2010, capturedBatch);
  assert.equal(result.schema, 'pb_rev_rank');
  const revision = codec.unpack(result.schema, result.data);
  assert.equal(revision.id, '100001');
  assert.deepEqual(revision.infos.map(info => [info.id, info.rank_id, info.rank ?? 0, info.value ?? '0']), [
    ['100001', '53', 0, '0'],
    ['100001', '54', 0, '0']
  ]);
});

test('rank bubble updates are bounded, acknowledged and visible on later boards', () => {
  let state = { roleId: 100001 };
  const bubbleStore = {
    read: () => ({ state: structuredClone(state) }),
    transaction: action => action({ state })
  };
  const bubbleService = createRankService({ codec, store: bubbleStore });
  const result = bubbleService.execute(2009, '  Local banner  ');
  assert.equal(result.schema, 'etf-fallback');
  assert.deepEqual(result.value, { id: '100001', notice: 'Local banner' });
  assert.equal(result.data.length, 0);
  assert.deepEqual(state.rankBubble, { id: '100001', notice: 'Local banner' });

  const board = codec.unpack('rank_to_client', bubbleService.execute(2000, [53]).data);
  assert.deepEqual(board.bubbles, [{ id: '100001', notice: 'Local banner' }]);
  const reopenedService = createRankService({ codec, store: bubbleStore });
  assert.deepEqual(codec.unpack('rank_to_client', reopenedService.execute(2000, [53]).data).bubbles, board.bubbles);
});

test('ranking readers reject malformed, excessive and unsafe IDs', () => {
  for (const [type, input] of [[2000, []], [2000, [1, 2]], [2008, [1]], [2011, null], [2011, [0]], [2011, [-1]], [2011, ['1']], [2011, [1.5]], [2011, [Number.MAX_SAFE_INTEGER + 1]], [2011, Array(101).fill(1)], [999, [1]]]) {
    assert.throws(() => service.execute(type, input), error => error.code === 1);
  }
});

test('avatar profile rank info rejects malformed or unsafe request pairs', () => {
  for (const input of [[], [53], [53, 100001, 1], [0, 100001], [53, 0], [-1, 100001], [53, -1], ['53', 100001], [53, '100001'], [1.5, 100001], [53, 1.5], [Number.MAX_SAFE_INTEGER + 1, 100001], [53, Number.MAX_SAFE_INTEGER + 1], 53, null, {}, { value: [53] }]) {
    assert.throws(() => service.execute(2001, input), error => error.code === 1);
  }
});

test('remaining leaderboard readers reject malformed requests without changing state', () => {
  const invalidRequests = [
    [2002, null], [2002, [53]], [2002, [53, 0]],
    [2005, []], [2005, [7, -1]],
    [2006, []], [2006, [53, '54']],
    [2007, [53]], [2007, [53, 0]],
    [2009, null], [2009, '   '], [2009, 'x'.repeat(57)],
    [2010, [100001]], [2010, [100001, []]], [2010, [0, [53]]], [2010, [100001, [53, 0]]]
  ];
  for (const [type, input] of invalidRequests) {
    assert.throws(() => service.execute(type, input), error => error.code === 1);
  }
});
