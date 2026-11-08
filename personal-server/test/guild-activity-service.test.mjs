import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGuildActivityService, GUILD_ACTIVITY_COMMANDS as C } from '../game/guild-activity-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const serverOpenedAt = Date.parse('2026-10-24T05:00:00+08:00') / 1000;
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);
const ACTOR = 100001;
const GUILD = '900001';
const MODULE = 24;

function seedGuild(store) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(MODULE, serializedBinary(codec.pack('pb_res_guild_login', { guildId: GUILD, last_leave_time: 0, guild_applies: [] })));
    model.state.modules.value = [...modules];
  });
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guild-activity-', serverOpenedAt });
  seedGuild(fixture.store);
  let now = options.now ?? fixedNow;
  let service = createGuildActivityService({
    store: fixture.store, codec: options.codec ?? codec, serverOpenedAt, now: () => now, logger: options.logger
  });
  return {
    fixture,
    get store() { return fixture.store; },
    get service() { return service; },
    setNow(value) { now = value; },
    reopen(next = {}) {
      const store = fixture.open();
      service = createGuildActivityService({
        store, codec: next.codec ?? options.codec ?? codec, serverOpenedAt, now: () => next.now ?? now, logger: options.logger
      });
      return service;
    }
  };
}

const count = (store, sql, ...args) => Number(store.inspect(db => db.prepare(sql).get(...args).count));

test('module 24 guild id scopes red envelope reads, thanks and fetch join', t => {
  const harness = setup(t);
  const data = codec.unpack('pb_guild_red_envelope_get_data_rsp', harness.service.execute(83103).data);
  assert.deepEqual(data.inactive_envelope, []);
  assert.deepEqual(data.fetched_red_envelopes, []);
  assert.equal(harness.service.execute(83103).value.guildId, 900001);
  assert.deepEqual(codec.unpack('pb_guild_red_envelope_rank_list', harness.service.execute(83107).data).rank_list, []);

  const thanks = harness.service.execute(83106, { id: 5 });
  assert.equal(thanks.value.thanks, true);
  assert.equal(harness.service.execute(83108).value.fetchJoin, 1);
  assert.equal(harness.service.execute(83108).value.fetchJoin, 2);

  for (const type of [83101, 83102, 83104, 83105]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
    assert.ok(harness.service.gap(type), 'gap ' + type);
  }
});

test('83401-83411 trial reads and writes persist real event state', t => {
  const harness = setup(t);
  assert.deepEqual(codec.unpack('pb_guild_trial_help_info', harness.service.execute(83401).data).help_list, []);
  harness.service.execute(83403, { type: 1, mon_tid: 7001 });
  const log = codec.unpack('pb_guild_trial_help_log_toc', harness.service.execute(83402).data);
  assert.equal(log.log_list.length, 1);
  assert.equal(Number(log.log_list[0].type), 1);
  assert.equal(String(log.log_list[0].role_id), String(ACTOR));
  assert.equal(Number(log.log_list[0].times), 1);
  assert.equal(harness.service.execute(83404, 'a notice').value.noticeLength, 8);
  assert.equal(harness.service.execute(83408).value.count, 1);
  assert.equal(harness.service.execute(83408).value.count, 2);
  assert.deepEqual(codec.unpack('pb_guild_trial_read_help_log_rsp', harness.service.execute(83410, { type: 1, role_id: 100002 }).data).help_log_list, []);
  harness.service.execute(83411);
  harness.service.execute(83407);
  for (const type of [83405, 83406, 83409]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
  }
});

test('893xx explore reads wish/camp state and stays truthful about empty boards', t => {
  const harness = setup(t);
  assert.equal(harness.service.execute(89306).value.round, 1);
  const wish = codec.unpack('pb_guild_explore_wish_back', harness.service.execute(89306).data);
  assert.equal(wish.round, 2);
  harness.service.execute(89310, [3]);
  harness.service.execute(89310, [3]);
  harness.service.execute(89310, [5]);
  const stat = codec.unpack('pb_guild_explore_camp_stat', harness.service.execute(89315).data);
  const camps = new Map(stat.event_stat_list.map(row => [Number(row.key), Number(row.value)]));
  assert.equal(camps.get(3), 2);
  assert.equal(camps.get(5), 1);
  assert.deepEqual(codec.unpack('pb_guild_explore_task_back', harness.service.execute(89305).data).res.changes, []);
  assert.deepEqual(codec.unpack('pb_guild_explore_task_back', harness.service.execute(89318).data).res.changes, []);
  const guild = codec.unpack('pb_guild_explore_guild', harness.service.execute(89326).data);
  assert.deepEqual(guild.build_list, []);
  assert.deepEqual(codec.unpack('pb_guild_explore_get_boss_box_back', harness.service.execute(893289).data).box_list, []);
  assert.deepEqual(codec.unpack('pb_guild_explore_trial_member_back', harness.service.execute(89352).data).member_list, []);
  for (const type of [89301, 89303, 89304, 89307]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
  }
});

test('900xx guild war guess, gather, entry and host round-trip through state', t => {
  const harness = setup(t);
  assert.deepEqual(codec.unpack('pb_guild_war_guess', harness.service.execute(90010).data).select_list, []);
  const guess = harness.service.execute(90001, { tid: 44, support_obj_id: 9001, area_idx: 2 });
  assert.equal(guess.value.tid, 44);
  const reread = codec.unpack('pb_guild_war_guess', harness.service.execute(90010).data);
  assert.equal(Number(reread.tid), 44);
  assert.deepEqual(reread.select_list.map(row => [row.key, row.value]), [['9001', '2']]);
  assert.equal(harness.service.execute(90005, [7]).value.loc, 7);
  assert.equal(harness.service.execute(90006, [100002]).value.roleId, 100002);
  assert.deepEqual(codec.unpack('pb_guild_war_entry', harness.service.execute(90009).data).area_list, []);
  const person = codec.unpack('pb_guild_war_person', harness.service.execute(90012).data);
  assert.ok(!person.have_operate);
  assert.equal(harness.service.execute(90014).value.host, ACTOR);
  assert.equal(harness.service.execute(90015).value.host, 0);
  harness.service.execute(90016);
  for (const type of [90002, 90007, 90008, 90011, 90013]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
  }
});

test('907xx duel and 912xx racing reads and attends keep their own state', t => {
  const harness = setup(t);
  assert.deepEqual(codec.unpack('pb_guild_duel_report_back', harness.service.execute(90705).data).report_list, []);
  assert.deepEqual(codec.unpack('pb_guild_duel_zone_back_list', harness.service.execute(90707).data).list, []);
  assert.ok(!codec.unpack('pb_guild_duel_guild_record', harness.service.execute(90706).data).acc_win_n);
  for (const type of [90702, 90703, 90704]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
  }

  const attended = codec.unpack('pb_guild_racing_attend_back', harness.service.execute(91201).data);
  assert.ok(String(attended.role_info.attend_time) !== '0');
  assert.equal(codec.unpack('pb_guild_racing_support', harness.service.execute(91202).data).role_info.support_times, 1);
  const voted = codec.unpack('pb_guild_racing_r', harness.service.execute(91204, { buff_tid: 11, event_tid: 22 }).data);
  assert.equal(voted.vote_buff_tid, 11);
  assert.equal(voted.vote_event_tid, 22);
  assert.deepEqual(codec.unpack('pb_guild_racing_role_info_list', harness.service.execute(91205).data).role_list, []);
  assert.deepEqual(codec.unpack('pb_guild_racing_score', harness.service.execute(91207).data).score_list, []);
  for (const type of [91203, 91206, 91208, 91209]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
  }
});

test('guild activity state survives a SQLite reopen', t => {
  const harness = setup(t);
  harness.service.execute(83108);
  harness.service.execute(89306);
  harness.service.execute(90005, [9]);
  harness.reopen();
  assert.equal(harness.service.execute(83108).value.fetchJoin, 2);
  assert.equal(harness.service.execute(89306).value.round, 2);
  const gather = harness.store.inspect(db => db.prepare("SELECT value_json FROM guild_activity_state WHERE guild_id=900001 AND scope='war' AND key='gather_loc'").get());
  assert.equal(JSON.parse(gather.value_json).loc, 9);
});

test('request schemas and gap metadata are exposed for the shipped types', () => {
  const harness = {
    service: null
  };
  const fixtureService = createGuildActivityService({
    store: {
      transaction: fn => fn({ state: { roleId: ACTOR, modules: { value: [] } } }, null),
      inspect: fn => fn({ exec() {}, prepare() { return { get() {}, all() { return []; }, run() {} }; } })
    },
    codec,
    serverOpenedAt,
    now: () => fixedNow
  });
  assert.equal(fixtureService.requestSchema(90001), 'pb_guild_war_guess_req');
  assert.equal(fixtureService.requestSchema(83103), null);
  assert.equal(fixtureService.supports(893289), true);
  assert.equal(fixtureService.supports(1), false);
});
