import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createArenaContestService } from '../game/arena-contest-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const NOW = 1794756200000;

test('module 113 follows ArenaContestMgr role, act, match binary order', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-arena-login-' });
  const service = createArenaContestService({
    store: fixture.store,
    codec,
    serverOpenedAt: NOW / 1000 - 12 * 3600,
    now: () => NOW
  });

  const payloads = service.loginPayloads();
  assert.equal(payloads.length, 3);

  const role = codec.unpack('pb_arena_contest_role', payloads[0]);
  const act = codec.unpack('pb_arena_contest_act', payloads[1]);
  const match = codec.unpack('pb_arena_contest_match', payloads[2]);
  assert.equal(Number(role.period), Number(act.period));
  assert.ok(Number(act.start_time) > 0);
  assert.equal(match.role1, undefined);
});
