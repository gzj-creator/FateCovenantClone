import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createActivityReadService } from '../game/activity-read-service.mjs';

const codec = createGameCodec(), service = createActivityReadService({ codec });

test('activity read endpoints answer with empty evidenced lists', () => {
  const record = service.execute(110308, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_fishing_act_get_record_rsp', record.data), { record_list: [] });
  const top = service.execute(110303, Buffer.alloc(0));
  assert.deepEqual(codec.unpack('pb_fishing_act_get_top_rsp', top.data), { high_score_list: [] });
  const times = service.execute(116004, codec.pack('pb_help_up_get_times_req', { act_id: 92144 }));
  assert.equal(Number(codec.unpack('pb_help_up_get_times_rsp', times.data).times ?? 0), 0);
});

test('unverified fishing and help-up mutations are refused instead of invented', () => {
  for (const type of [110301, 110302, 110311, 110304, 110305, 110306, 110307, 110309, 110310, 116001, 116002, 116003]) {
    assert.equal(service.supports(type), true);
    assert.throws(() => service.execute(type, Buffer.alloc(0)), error => error.code === 5);
  }
  assert.equal(service.supports(201), false);
  assert.equal(service.supports(110312), false);
});
