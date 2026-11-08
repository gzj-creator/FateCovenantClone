import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createBattleRecordService, REPORT_SHARE_REFUSAL } from '../game/battle-record-service.mjs';

const codec = createGameCodec();
const FIXED_NOW = 1794000000000;

function setup(t) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-battle-record-', now: () => FIXED_NOW });
  const build = store => createBattleRecordService({ store, codec, now: () => FIXED_NOW });
  return { fixture, open: build.bind(null, fixture.store), build };
}

function otherRole(store, roleId) {
  store.inspect(db => db.prepare('INSERT INTO roles VALUES (?,?,?,?,?)').run(
    roleId, 1, 1700000000, JSON.stringify({ level: 12, nick_name: 'Peer' }), JSON.stringify({})
  ));
}

test('211 returns an authoritative empty list before any clear', t => {
  const env = setup(t);
  const service = env.open();
  const result = service.execute(211, { pass_tid: 77001, id: 20201 });
  const value = codec.unpack('pb_pass_record', result.data);
  assert.deepEqual(value.pass_info_list, []);
});

test('207-style recordPass is listed by 211, voted over 212 and persists across reopen', t => {
  const env = setup(t);
  const store = env.fixture.store;
  otherRole(store, 100099);
  let service = env.open();
  service.recordPass({
    passTid: 77001, businessId: 20201, passType: 1, fightId: 7700120201,
    passScore: 7, show: { pass_time: 1794000000, level: 12 }
  });
  store.inspect(db => db.prepare('INSERT INTO battle_pass_records VALUES (?,?,?,?,?,?,?,?,?,?)').run(
    100099, 77001, 20201, 1, 7700120202, 5, 0, '{}', JSON.stringify({ pass_time: 1794000100, level: 15 }), new Date(FIXED_NOW).toISOString()
  ));

  const listed = codec.unpack('pb_pass_record', service.execute(211, { pass_tid: 77001, id: 20201 }).data);
  assert.equal(listed.pass_info_list.length, 2);
  assert.equal(String(listed.pass_info_list[0].fight_id), '7700120202');
  assert.equal(Number(listed.pass_info_list[1].show_info.level), 12);
  assert.equal(Number(listed.pass_info_list[0].vote_info?.up_vote ?? 0), 0);
  assert.equal(Number(listed.pass_info_list[0].vote_info?.down_vote ?? 0), 0);

  // Self votes are fail-closed: the shipped client never votes its own record.
  assert.throws(() => service.execute(212, {
    pass_tid: 77001, id: 20201, fight_id: 7700120201, type: 1, is_up_vote: true
  }), /self vote/);

  const voted = service.execute(212, { pass_tid: 77001, id: 20201, fight_id: 7700120202, type: 1, is_up_vote: true });
  assert.equal(voted.value.up, true);
  assert.equal(voted.value.duplicate, false);
  assert.equal(voted.data.length, 0, '212 writes no reply frame');
  // Replaying the same direction is idempotent; flipping it is rejected.
  assert.equal(service.execute(212, { pass_tid: 77001, id: 20201, fight_id: 7700120202, type: 1, is_up_vote: true }).value.duplicate, true);
  assert.throws(() => service.execute(212, {
    pass_tid: 77001, id: 20201, fight_id: 7700120202, type: 1, is_up_vote: false
  }), /already recorded/);
  assert.throws(() => service.execute(212, {
    pass_tid: 77001, id: 20201, fight_id: 12345, type: 1, is_up_vote: true
  }), /Pass record is missing/);

  const reopened = codec.unpack('pb_pass_record', env.build(env.fixture.open()).execute(211, { pass_tid: 77001, id: 20201 }).data);
  assert.equal(reopened.pass_info_list.length, 2);
  assert.equal(Number(reopened.pass_info_list[0].vote_info.up_vote), 1);
  assert.equal(Number(reopened.pass_info_list[0].vote_info.down_vote ?? 0), 0);
});

test('205 share_report fails closed and 211 rejects malformed ids', t => {
  const env = setup(t);
  const service = env.open();
  assert.throws(() => service.execute(205, { fight_id: '1', fight_type: 1 }), new RegExp(REPORT_SHARE_REFUSAL.slice(0, 24)));
  assert.throws(() => service.execute(211, { pass_tid: -1, id: 1 }), /Invalid pass record tid/);
  assert.throws(() => service.execute(211, { pass_tid: 1, id: -5 }), /Invalid pass record business id/);
});

test('a failed vote insert rolls the whole statement back', t => {
  const env = setup(t);
  const store = env.fixture.store;
  otherRole(store, 100099);
  const service = env.open();
  store.inspect(db => {
    db.prepare('INSERT INTO battle_pass_records VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      100099, 88001, 30301, 1, 8800130301, 0, 0, '{}', '{}', new Date(FIXED_NOW).toISOString()
    );
    db.exec("CREATE TRIGGER reject_vote BEFORE INSERT ON battle_pass_votes BEGIN SELECT RAISE(ABORT,'forced vote failure'); END;");
  });
  assert.throws(() => service.execute(212, { pass_tid: 88001, id: 30301, fight_id: 8800130301, type: 1, is_up_vote: true }), /forced vote failure/);
  assert.equal(store.inspect(db => db.prepare('SELECT count(*) AS n FROM battle_pass_votes').get().n), 0);
});
