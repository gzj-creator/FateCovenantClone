import assert from 'node:assert/strict';
import test from 'node:test';
import { E, createGameCodec } from '../protocol/game-codec.mjs';
import { createRankService } from './rank-service.mjs';

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

test('ranking readers reject malformed, excessive and unsafe IDs', () => {
  for (const [type, input] of [[2000, []], [2000, [1, 2]], [2008, [1]], [2011, null], [2011, [0]], [2011, [-1]], [2011, ['1']], [2011, [1.5]], [2011, [Number.MAX_SAFE_INTEGER + 1]], [2011, Array(101).fill(1)], [999, [1]]]) {
    assert.throws(() => service.execute(type, input), error => error.code === 1);
  }
});
