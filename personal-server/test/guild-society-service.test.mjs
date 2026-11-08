import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGuildSocietyService, GUILD_SOCIETY_COMMANDS as C } from '../game/guild-society-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const serverOpenedAt = Date.parse('2026-10-24T05:00:00+08:00') / 1000;
const fixedNow = Date.UTC(2026, 9, 26, 0, 0, 0);
const ACTOR = 100001;
const MODULE = 24;

function writeLogin(store, login) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(MODULE, serializedBinary(codec.pack('pb_res_guild_login', login)));
    model.state.modules.value = [...modules];
  });
}

function readLogin(store) {
  const login = codec.unpack('pb_res_guild_login', rawBinary(new Map(store.state().modules.value).get(MODULE)));
  login.guildId = String(login.guildId ?? '0');
  login.guild_applies = login.guild_applies ?? [];
  return login;
}

function mutateLogin(store, fn) {
  const login = readLogin(store);
  fn(login);
  writeLogin(store, login);
  return login;
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guild-society-', serverOpenedAt });
  writeLogin(fixture.store, { guildId: '0', last_leave_time: 0, guild_applies: [] });
  let now = options.now ?? fixedNow;
  let service = createGuildSocietyService({
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
    setNow(value) { now = value; },
    reopen(next = {}) {
      const store = fixture.open();
      service = createGuildSocietyService({
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

function directoryRow(store, guildId) {
  return store.inspect(db => db.prepare('SELECT * FROM guild_directory WHERE guild_id=?').get(Number(guildId)));
}

function seedDirectory(store, guildId, name, extra = {}) {
  store.inspect(db => db.prepare(
    'INSERT INTO guild_directory (guild_id,name,badge,level,active,audit_type,level_limit,power_limit,leader_role_id,member_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(guildId, name, extra.badge ?? 1, extra.level ?? 2, extra.active ?? 7, extra.audit_type ?? 1,
    extra.level_limit ?? 1, extra.power_limit ?? 0, extra.leader_role_id ?? 200002, extra.member_count ?? 4, '2026-01-01', '2026-01-01'));
}

test('21001 create seeds module 24, the directory row and the guild log', t => {
  const harness = setup(t);
  seedDirectory(harness.store, 900002, 'Rival');
  const created = harness.service.execute(C.create, { name: 'Test Guild', badge: 3, notice: 'hello' });
  assert.equal(created.value.name, 'Test Guild');
  assert.equal(created.value.memberCount, 1);
  const guildId = created.value.guildId;
  const login = readLogin(harness.store);
  assert.equal(login.guildId, guildId);
  assert.equal(login.guild.name, 'Test Guild');
  assert.deepEqual(login.guild.member_list.map(m => [String(m.role_id), Number(m.job)]), [[String(ACTOR), 1]]);
  const row = directoryRow(harness.store, guildId);
  assert.equal(row.name, 'Test Guild');
  assert.equal(Number(row.member_count), 1);
  assert.equal(Number(harness.store.inspect(db => db.prepare('SELECT COUNT(*) AS c FROM guild_logs WHERE guild_id=? AND log_key=?').get(Number(guildId), 'create').c)), 1);

  // A second create is rejected as a duplicate, and names are unique.
  assert.throws(() => harness.service.execute(C.create, { name: 'Second' }), error => error.code === 310);
});

test('21001 rejects names already taken by another guild', t => {
  const harness = setup(t);
  seedDirectory(harness.store, 900002, 'Taken');
  assert.throws(() => harness.service.execute(C.create, { name: 'Taken' }), error => error.code === 310);
  assert.throws(() => harness.service.execute(C.create, { name: 'x' }), error => error.code === 1);
  assert.equal(readLogin(harness.store).guildId, '0');
});

test('21002 apply, 21003 accept and 21004/21012 recommendations project the real inbox', t => {
  const harness = setup(t);
  seedDirectory(harness.store, 900002, 'Rival', { active: 9 });
  harness.service.execute(C.applyJoin, [900002]);
  assert.deepEqual(readLogin(harness.store).guild_applies, ['900002']);
  assert.equal(Number(harness.store.inspect(db => db.prepare('SELECT COUNT(*) AS c FROM guild_apply_inbox WHERE guild_id=?').get(900002).c)), 1);
  assert.throws(() => harness.service.execute(C.applyJoin, [900002]), error => error.code === 310);
  assert.throws(() => harness.service.execute(C.applyJoin, [999999]), error => error.code === 5);

  const recommend = codec.unpack('pb_res_recommends', harness.service.execute(C.recommends).data);
  assert.deepEqual(recommend.guild_infos.map(row => String(row.id ?? row.guild_id)), ['900002']);
  const search = codec.unpack('pb_res_recommends', harness.service.execute(C.search, ['name', 'Riv']).data);
  assert.deepEqual(search.guild_infos.map(row => String(row.id ?? row.guild_id)), ['900002']);

  // Creating a fresh guild clears the application ledger, then approvals add members.
  harness.service.execute(C.create, { name: 'Home' });
  assert.deepEqual(readLogin(harness.store).guild_applies, []);
  harness.store.inspect(db => db.prepare('INSERT INTO guild_apply_inbox(guild_id,role_id,apply_time) VALUES (?,?,?)')
    .run(Number(readLogin(harness.store).guildId), 100002, 1));
  const handled = harness.service.execute(C.handleApplies, { agree: true, applies: [100002] });
  assert.equal(handled.value.processed, 1);
  assert.equal(handled.value.members, 2);
  const owned = Number(readLogin(harness.store).guildId);
  assert.equal(Number(harness.store.inspect(db => db.prepare('SELECT COUNT(*) AS c FROM guild_apply_inbox WHERE guild_id=?').get(owned).c)), 0);
  const members = readLogin(harness.store).guild.member_list.map(m => String(m.role_id));
  assert.ok(members.includes('100002'));
});

test('21016 contribute and 21015 recruit bump the daily counters and guild activity', t => {
  const harness = setup(t);
  harness.service.execute(C.create, { name: 'Home' });
  for (let i = 0; i < 3; i += 1) harness.service.execute(C.contribute);
  assert.throws(() => harness.service.execute(C.contribute), error => error.code === 5);
  const login = readLogin(harness.store);
  const contribute = codec.unpack('pb_guild_contribute', Buffer.from(login.contribute_info, 'base64'));
  assert.equal(contribute.count_info.count_list[0], 3);
  assert.equal(Number(directoryRow(harness.store, login.guildId).active), 3);

  for (let i = 0; i < 3; i += 1) harness.service.execute(C.sendRecruit, {});
  assert.throws(() => harness.service.execute(C.sendRecruit, {}), error => error.code === 5);
  const countInfo = readLogin(harness.store).count_info;
  assert.equal(Number(countInfo.count_list[0]), 3);
});

test('21008 edits, 21021 rename, 21022 social stamp, 21024 mail, 21025/21028/21029/85502/85504/85505 reads persist', t => {
  const harness = setup(t);
  const guildId = harness.service.execute(C.create, { name: 'Home' }).value.guildId;
  harness.service.execute(C.changeBaseInfo, { notice: 'new notice', audit_type: 2, level_limit: 5 });
  const base = readLogin(harness.store).guild;
  assert.equal(base.notice, 'new notice');
  assert.equal(Number(base.audit_type), 2);

  harness.service.execute(C.renameNormal, { name: 'Renamed' });
  assert.equal(directoryRow(harness.store, guildId).name, 'Renamed');
  assert.equal(readLogin(harness.store).guild.name, 'Renamed');

  const social = codec.unpack('pb_guild_social_role', harness.service.execute(C.setSocialStamp).data);
  assert.equal(String(social.guild_id), guildId);

  const mail = harness.service.execute(C.sendNoticeMail, { title: 'T', content: 'Body' });
  assert.equal(mail.value.titleLength, 1);

  const transfer = harness.service.execute(C.setReadTransfer);
  assert.ok(transfer.value.read_transfer_stamp);
  const ratio = harness.service.execute(C.setDistributionRatio, 40);
  assert.equal(ratio.value.distribution_ratio, 40);
  assert.throws(() => harness.service.execute(C.setDistributionRatio, 120), error => error.code === 1);
  const record = codec.unpack('pb_req_guild_pay_record', harness.service.execute(C.payRecord).data);
  assert.deepEqual(record.add_record, []);
  const active = codec.unpack('pb_guild_active_info', harness.service.execute(C.activePoint).data);
  assert.ok(Number(active.active_refresh_day) >= 1);
  const dissolveRead = codec.unpack('pb_guild_auto_dissolve_role', harness.service.execute(C.autoDissolveRead).data);
  assert.equal(dissolveRead.dissolve_read, true);
  const preRead = codec.unpack('pb_guild_auto_dissolve_role', harness.service.execute(C.preAutoDissolveRead).data);
  assert.equal(preRead.pre_dissolve_read, true);

  harness.service.execute(C.enterScene);
  const logs = harness.service.execute(C.guildLog).data;
  const logData = codec.unpack('pb_guild_log_data', Buffer.from(logs).subarray(6));
  assert.ok(logData.log_list.length >= 3);
});

test('21018 forced rename requires the server rename flag', t => {
  const harness = setup(t);
  harness.service.execute(C.create, { name: 'Home' });
  assert.throws(() => harness.service.execute(C.renameForce, { name: 'Forced' }), error => error.code === 5);
  mutateLogin(harness.store, login => { login.need_rename = true; });
  assert.equal(harness.service.execute(C.renameForce, { name: 'Forced' }).value.name, 'Forced');
  assert.ok(!readLogin(harness.store).need_rename);
});

test('21026 box award pays real resources once; 21030 pay award rejects without a pending row', t => {
  const harness = setup(t);
  harness.service.execute(C.create, { name: 'Home' });
  mutateLogin(harness.store, login => {
    login.pay_and_box = codec.pack('pb_guild_pay_box', {
      pb_role_box_award: [{ role_id: ACTOR, pb_box_award: [{ tid: 401900, num: 5 }], is_get: false }]
    });
  });
  const box = codec.unpack('pb_guild_box_rsp', harness.service.execute(C.boxAward).data);
  assert.equal(box.pb_role_box_award.is_get, true);
  assert.equal(box.res.changes.length, 1);
  assert.equal(String(box.res.changes[0].tid), '401900');
  assert.equal(Number(harness.store.inspect(db => db.prepare("SELECT COUNT(*) AS c FROM resources WHERE role_id=? AND tid='401900'").get(ACTOR).c)), 1);
  assert.throws(() => harness.service.execute(C.boxAward), error => error.code === 5);
  assert.throws(() => harness.service.execute(C.payAward), error => error.code === 5);
});

test('21013 dissolve clears module 24, the directory row and pending applications', t => {
  const harness = setup(t);
  const guildId = harness.service.execute(C.create, { name: 'Home' }).value.guildId;
  harness.store.inspect(db => db.prepare('INSERT INTO guild_apply_inbox(guild_id,role_id,apply_time) VALUES (?,?,?)').run(Number(guildId), 100002, 1));
  harness.service.execute(C.dissolve);
  const login = readLogin(harness.store);
  assert.equal(login.guildId, '0');
  assert.equal(login.guild, undefined);
  assert.equal(directoryRow(harness.store, guildId), undefined);
  assert.equal(Number(harness.store.inspect(db => db.prepare('SELECT COUNT(*) AS c FROM guild_apply_inbox WHERE guild_id=?').get(Number(guildId)).c)), 0);
  assert.equal(Number(codec.unpack('pb_guild_leave', Buffer.from(login.leave_count, 'base64')).count), 1);
});

test('unrecovered commands fail closed with business code 5 and leave state untouched', t => {
  const harness = setup(t);
  const guildId = harness.service.execute(C.create, { name: 'Home' }).value.guildId;
  const before = readLogin(harness.store);
  for (const type of [C.guildData, C.receiveActBox, C.levelAward, C.specialTaskAward, C.activeAward, C.activeFinishAward]) {
    assert.throws(() => harness.service.execute(type, {}), error => error.code === 5, 'type ' + type);
    assert.ok(harness.service.gap(type), 'gap metadata for ' + type);
  }
  assert.equal(readLogin(harness.store).guildId, guildId);
  assert.deepEqual(readLogin(harness.store).guild, before.guild);
});

test('guild profile survives a SQLite reopen', t => {
  const harness = setup(t);
  const guildId = harness.service.execute(C.create, { name: 'Home', notice: 'persist me' }).value.guildId;
  harness.service.execute(C.renameNormal, { name: 'Stable' });
  harness.reopen();
  const login = readLogin(harness.store);
  assert.equal(login.guildId, guildId);
  assert.equal(login.guild.name, 'Stable');
  assert.equal(directoryRow(harness.store, guildId).name, 'Stable');
});

test('PB encoding failure rolls back a guild rename', t => {
  const failing = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_guild_rename_back') throw new Error('guild encode failure');
      return codec.pack(name, value);
    }
  };
  const harness = setup(t, { codec: failing });
  const guildId = harness.service.execute(C.create, { name: 'Home' }).value.guildId;
  assert.throws(() => harness.service.execute(C.renameNormal, { name: 'Rolled Back' }), /guild encode failure/);
  assert.equal(readLogin(harness.store).guild.name, 'Home');
  assert.equal(directoryRow(harness.store, guildId).name, 'Home');
});
