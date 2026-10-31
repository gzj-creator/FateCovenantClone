import assert from 'node:assert/strict';
import test from 'node:test';
import { E, createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
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
