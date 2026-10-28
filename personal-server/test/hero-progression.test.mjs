import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, binary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createHeroProgression } from '../game/hero-progression.mjs';
import { createLineupService } from '../game/lineup-service.mjs';
import { createFeatureService } from '../game/feature-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec(), tables = readHeroTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
function fixture() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return { version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000, modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'), guides: { 12: 34 }, lineups: null };
}
function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-game-test-'));
  const databasePath = path.join(directory, 'game.sqlite'), legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const progression = () => createHeroProgression({ store, codec, tables });
  return { directory, databasePath, legacyStatePath, get store() { return store; }, get progression() { return progression(); },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); } };
}
const rejected = (action, code) => assert.throws(action, error => error.code === code);

test('feature acknowledgements preserve old bits, use captured MSB ordering and survive reopen', t => {
  const env = setup(t);
  const service = createFeatureService({ store: env.store, codec });
  const before = codec.unpack('res_fun_open_login', rawBinary(new Map(env.store.state().modules.value).get(3)));
  const old = Buffer.from(before.target_list.find(row => row.target_tid === 1).fun_open_state, 'base64');
  const reply = codec.unpack('res_fun_open', service.execute(7000, { value: [1005, 1537], improper: false }).data);
  const bytes = Buffer.from(reply.target_list.find(row => row.target_tid === 1).fun_open_state, 'base64');
  assert.equal(bytes[0], old[0] | 4);
  assert.equal(bytes[67], old[67] | 64);
  for (let i = 0; i < old.length; i++) assert.equal(bytes[i] & old[i], old[i]);
  env.reopen();
  assert.deepEqual(codec.unpack('res_fun_open_login', rawBinary(new Map(env.store.state().modules.value).get(3))).target_list, reply.target_list);
  const snapshot = env.store.state();
  for (const input of [null, [2001], [999], ['1537'], [1537.5]]) rejected(() => service.execute(7000, input), 1);
  assert.deepEqual(env.store.state(), snapshot);
});

test('local sprint preview opens only its two entry gates and is persistent and idempotent', t => {
  const env = setup(t), original = env.store.read();
  createFeatureService({ store: env.store, codec, sprintPreview: true });
  const first = env.store.state();
  const targets = codec.unpack('res_fun_open_login', rawBinary(new Map(first.modules.value).get(3))).target_list;
  const bytes = Buffer.from(targets.find(row => row.target_tid === 1).fun_open_state, 'base64');
  for (const id of [1039, 1537]) assert.ok(bytes[Math.floor((id % 1000) / 8)] & (128 >> (id % 8)));
  env.reopen();
  createFeatureService({ store: env.store, codec, sprintPreview: true });
  assert.deepEqual(env.store.state(), first);
  assert.deepEqual(env.store.read().heroInfo, original.heroInfo);
  assert.deepEqual(env.store.read().resources, original.resources);
});

test('migrates once into relational SQLite tables, backs up JSON, and preserves login modules', t => {
  const env = setup(t), before = env.store.state();
  assert.ok(fs.existsSync(path.join(env.directory, 'legacy.pre-sqlite-backup.local-only.json')));
  assert.equal(env.store.read().heroInfo.hero_list.length, 6);
  assert.equal(env.store.read().resources.size, 13);
  const original = new Map(fixture().modules.value), migrated = new Map(before.modules.value);
  for (const [key, value] of original) if (![5, 6, 9, 10].includes(key)) assert.deepEqual(migrated.get(key), value);
  const oldLineup = codec.unpack('pb_lineup_login', rawBinary(original.get(9)));
  const newLineup = codec.unpack('pb_lineup_login', rawBinary(migrated.get(9)));
  assert.deepEqual(newLineup.lineup_hero_libs, oldLineup.lineup_hero_libs);
  assert.equal(env.store.read().lineups.pre_lineups.length, 1);
  assert.equal(env.store.read().playLineups.length, 3);
  assert.deepEqual(codec.unpack('pb_role_lineup', Buffer.from(newLineup.pre_lineup, 'base64')), codec.unpack('pb_role_lineup', Buffer.from(oldLineup.pre_lineup, 'base64')));
  const decodeHeroes = state => codec.unpack('pb_hero_info', rawBinary(new Map(state.modules.value).get(10).value[0]));
  const newHeroes = decodeHeroes(before), oldHeroes = decodeHeroes(fixture());
  for (const hero of oldHeroes.hero_list) {
    const actual = newHeroes.hero_list.find(value => value.uid === hero.uid);
    for (const [key, value] of Object.entries(hero)) assert.deepEqual(actual[key], value);
  }
  env.store.transaction(model => { model.state.guides[55] = 66; });
  fs.writeFileSync(env.legacyStatePath, JSON.stringify({ ...fixture(), guides: {} }));
  env.reopen();
  assert.equal(env.store.state().guides[55], 66);
  const db = new DatabaseSync(env.databasePath, { readOnly: true });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM migrations').get().n, 4);
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reward_claims'").get());
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  db.close();
});

test('multi-level upgrade deducts summed experience, preserves hero fields, and survives reopen', t => {
  const env = setup(t);
  env.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(hero => hero.uid === '2020601');
    hero.skin_tid = '123456789012345'; hero.relic = ['123'];
    hero.level = 2; model.heroInfo.cell_list.find(cell => cell.index === 4).level = 2;
  });
  const initial = BigInt(env.store.read().resources.get('101800').num);
  const result = env.progression.execute(636, { hero_uid: '2020601', cell_index: 4, up_lv_count: 2 });
  const response = codec.unpack('pb_hero_up_lv_ret', result.data);
  assert.equal(response.new_lv, 4);
  assert.equal(response.res.changes[0].diff_num, '-340');
  assert.equal(response.change_hero_list[0].skin_tid, '123456789012345');
  assert.deepEqual(response.change_hero_list[0].relic, [123]);
  env.reopen();
  assert.equal(env.store.read().resources.get('101800').num, String(initial - 340n));
  const heroInfo = codec.unpack('pb_hero_info', rawBinary(new Map(env.store.state().modules.value).get(10).value[0]));
  assert.equal(heroInfo.hero_list.find(hero => hero.uid === '2020601').level, 4);
  assert.equal(heroInfo.cell_list.find(cell => cell.index === 4).level, 4);
});

test('upgrade validates role cap, binding, count, materials and breakthrough without mutation', t => {
  const env = setup(t), initial = env.store.state();
  rejected(() => env.progression.execute(636, { hero_uid: '2020601', cell_index: 4, up_lv_count: 2 }), 3023);
  rejected(() => env.progression.execute(636, { hero_uid: '2010101', cell_index: 4, up_lv_count: 1 }), 3001);
  rejected(() => env.progression.execute(636, { hero_uid: '2020601', cell_index: 4, up_lv_count: 0 }), 1);
  rejected(() => env.progression.execute(636, { hero_uid: '2010101', cell_index: 1, up_lv_count: 1 }), 331);
  assert.deepEqual(env.store.state(), initial);
  env.store.transaction(model => { model.resources.get('101800').num = '0'; });
  const noExp = env.store.state();
  rejected(() => env.progression.execute(636, { hero_uid: '2020601', cell_index: 4, up_lv_count: 1 }), 301);
  assert.deepEqual(env.store.state(), noExp);
});

test('breakthrough atomically consumes two materials and synchronizes cell and hero', t => {
  const env = setup(t), before = env.store.read();
  const result = codec.unpack('pb_hero_break_ret', env.progression.execute(638, 1).data);
  assert.equal(result.new_break_lv, 1);
  assert.deepEqual(result.res.changes.map(change => change.diff_num), ['-3000', '-2']);
  assert.equal(env.store.read().resources.get('201500').num, String(BigInt(before.resources.get('201500').num) - 3000n));
  assert.equal(env.store.read().heroInfo.cell_list.find(cell => cell.index === 1).break_level, 1);
  rejected(() => env.progression.execute(638, 1), 3025);
  assert.equal(codec.unpack('pb_hero_up_lv_ret', env.progression.execute(636, { hero_uid: '2010101', cell_index: 1, up_lv_count: 1 }).data).new_lv, 2);
});

test('star advancement consumes chips per segment and rolls six segments into one star', t => {
  const env = setup(t);
  const result = codec.unpack('pb_hero_up_star_ret', env.progression.execute(639, [2020601, 3]).data);
  assert.equal(result.new_hero.star ?? 0, 0);
  assert.equal(result.new_hero.star_progress, 3);
  assert.equal(result.new_hero.level, 8);
  assert.equal(result.res.changes[0].tid, '22300204');
  assert.equal(result.res.changes[0].diff_num, '-30');
  const initial = env.store.state();
  rejected(() => env.progression.execute(639, [2020601, 1]), 3006);
  rejected(() => env.progression.execute(639, [2020601, 4]), 3004);
  rejected(() => env.progression.execute(639, [999, 1]), 3001);
  assert.deepEqual(env.store.state(), initial);
  env.store.transaction(model => { model.resources.get('22300204').num = '30'; });
  const rolled = codec.unpack('pb_hero_up_star_ret', env.progression.execute(639, [2020601, 3]).data);
  assert.equal(rolled.new_hero.star, 1);
  assert.equal(rolled.new_hero.star_progress ?? 0, 0);
  env.reopen();
  assert.equal(env.store.read().heroInfo.hero_list.find(hero => hero.uid === '2020601').star, 1);
});

test('separate star trials cannot be bypassed through normal star advancement', t => {
  const env = setup(t);
  env.store.transaction(model => { model.heroInfo.hero_list.find(hero => hero.uid === '2020601').star = 5; });
  rejected(() => env.progression.execute(639, [2020601, 1]), 3021);
});

test('exception and response-encoding failure roll back resource and hero mutations', t => {
  const env = setup(t), before = env.store.state();
  assert.throws(() => env.store.transaction(model => { model.resources.get('101800').num = '0'; throw new Error('Injected write failure'); }));
  const progression = createHeroProgression({ store: env.store, tables, codec: { pack() { throw new Error('Injected encoding failure'); } } });
  assert.throws(() => progression.execute(636, { hero_uid: '2020601', cell_index: 4, up_lv_count: 1 }));
  assert.deepEqual(env.store.state(), before);
});

test('SQLite write rejection rolls back hero updates and resource deduction together', t => {
  const env = setup(t), before = env.store.state();
  const db = new DatabaseSync(env.databasePath);
  db.exec("CREATE TRIGGER reject_resource_write BEFORE INSERT ON resources BEGIN SELECT RAISE(ABORT, 'Injected storage failure'); END;");
  db.close();
  assert.throws(() => env.progression.execute(636, { hero_uid: '2020601', cell_index: 4, up_lv_count: 1 }));
  assert.deepEqual(env.store.state(), before);
});

test('version-one lineup repair preserves hero progression and resources', t => {
  const env = setup(t);
  env.progression.execute(639, [2020601, 3]);
  const before = env.store.read();
  const db = new DatabaseSync(env.databasePath);
  const snapshot = rawBinary(new Map(fixture().modules.value).get(9));
  db.prepare('UPDATE lineups SET payload_json=?').run(JSON.stringify(codec.unpack('pb_role_lineup', snapshot)));
  db.exec("DELETE FROM play_lineups; DELETE FROM migrations WHERE name='lineup-envelope-v2'; PRAGMA user_version=1;");
  db.close();
  env.reopen();
  const after = env.store.read();
  assert.equal(after.lineups.pre_lineups.length, 1);
  assert.equal(after.playLineups.length, 3);
  assert.deepEqual(after.heroInfo, before.heroInfo);
  assert.deepEqual(after.resources, before.resources);
});

test('squad version switching is idempotent and restores each saved layout after reopen', t => {
  const env = setup(t), service = () => createLineupService({ store: env.store, codec });
  let result = codec.unpack('pb_edit_pre_lineup_rsp', service().execute(218, 0).data);
  assert.equal(result.role_lineup.version ?? 0, 0);
  assert.equal(result.role_lineup.pre_lineups[0].lineup.fighter_list.length, 4);
  const preset = structuredClone(result.role_lineup.pre_lineups[0]);
  preset.lineup.fighter_list[0].loc = 1;
  service().execute(209, { pre_lineup_list: [preset], handle_types: ['0'] });
  service().execute(218, 0);
  service().execute(218, 1);
  assert.equal(env.store.read().lineups.pre_lineups[0].lineup.fighter_list[0].loc, 6);
  env.reopen();
  result = service().execute(218, 0).value;
  assert.equal(result.role_lineup.pre_lineups[0].lineup.fighter_list[0].loc, 1);
  const login = codec.unpack('pb_lineup_login', Buffer.from(env.store.state().lineups, 'base64'));
  assert.equal(codec.unpack('pb_role_lineup', Buffer.from(login.pre_lineup, 'base64')).pre_lineups[0].lineup.fighter_list[0].loc, 1);
  rejected(() => service().execute(218, 5), 1);
});

test('preset and play-lineup edits validate ownership and duplicate positions atomically', t => {
  const env = setup(t), service = createLineupService({ store: env.store, codec });
  const original = env.store.read(), preset = structuredClone(original.lineups.pre_lineups[0]);
  preset.lineup.fighter_list[0].loc = 1;
  const result = service.execute(209, { pre_lineup_list: [preset], handle_types: ['1'] });
  assert.equal(result.value.copy_lineup[0].type, 1);
  env.reopen();
  assert.equal(env.store.read().playLineups[0].team_list[0].fighter_list[0].loc, 1);
  const play = structuredClone(env.store.read().playLineups[0]);
  play.team_list[0].fighter_list[0].loc = 3;
  createLineupService({ store: env.store, codec }).execute(208, { lineup_list: [play] });
  const before = env.store.state(), invalid = structuredClone(play);
  invalid.team_list[0].fighter_list[0].loc = invalid.team_list[0].fighter_list[1].loc;
  rejected(() => createLineupService({ store: env.store, codec }).execute(208, { lineup_list: [invalid] }), 51554);
  invalid.team_list[0].fighter_list[0].hero_id = '999';
  rejected(() => createLineupService({ store: env.store, codec }).execute(208, { lineup_list: [invalid] }), 3001);
  assert.deepEqual(env.store.state(), before);
});

test('gateway authenticates locally and handles PB upgrades, ETF stars, business errors and updated login state', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-gateway-test-'));
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  const events = [];
  const game = createLocalGame({ databasePath: path.join(directory, 'game.sqlite'), statePath: legacyStatePath, capturePath, localWallet: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session', logger: event => events.push(event) });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  let response = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  const initialLogin = await decodeEtf(Buffer.from(response.data, 'base64'));
  assert.equal(initialLogin[0], 1);
  assert.ok(Math.abs(initialLogin[1][0] - Date.now()) < 5000);
  assert.deepEqual(initialLogin[1].slice(1), [28800, 1]);
  const activityBefore = rawBinary(new Map(game.store.state().modules.value).get(92));
  response = await request(7000, 7000, await encodeEtf([1537]));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('res_fun_open', Buffer.from(response.data, 'base64')).target_list.length, 2);
  for (const [type, input, schema] of [[2011, [1001, 2002], 'rank_to_client_list'], [2000, [1001], 'rank_to_client'], [2008, 2002, 'rank_to_client']]) {
    response = await request(type, type, await encodeEtf(input));
    assert.equal(response.seq, type); assert.equal(response.err, undefined);
    const board = codec.unpack(schema, Buffer.from(response.data, 'base64'));
    if (type === 2011) assert.deepEqual(board.client_list.map(value => value.rank_id), ['1001', '2002']);
    else assert.equal(board.rank_id, String(type === 2000 ? 1001 : 2002));
  }
  response = await request(218, 5, await encodeEtf(0));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_edit_pre_lineup_rsp', Buffer.from(response.data, 'base64')).role_lineup.pre_lineups.length, 1);
  const preset = game.store.read().lineups.pre_lineups[0];
  response = await request(209, 7, codec.pack('pb_edit_pre_lineup_req', { pre_lineup_list: [preset], handle_types: [0] }));
  assert.equal(response.err, undefined);
  response = await request(208, 9, codec.pack('pb_edit_lineup_req', { lineup_list: game.store.read().playLineups }));
  assert.equal(codec.unpack('pb_edit_lineup_rsp', Buffer.from(response.data, 'base64')).lineup_list.length, 3);
  response = await request(636, 21, codec.pack('pb_hero_up_lv_req', { hero_uid: '2020601', cell_index: 4, up_lv_count: 1 }));
  assert.equal(response.seq, 21); assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_hero_up_lv_ret', Buffer.from(response.data, 'base64')).new_lv, 9);
  const upgradeEvent = events.find(event => event.event === 'hero_progression_committed' && event.type === 636);
  assert.deepEqual(upgradeEvent.changedHeroes, [{ uid: '2020601', level: 9 }]);
  assert.equal(upgradeEvent.newLv, 9);
  assert.match(upgradeEvent.responseSha256, /^[0-9a-f]{64}$/);
  response = await request(639, 22, await encodeEtf([2020601, 3]));
  assert.equal(codec.unpack('pb_hero_up_star_ret', Buffer.from(response.data, 'base64')).new_hero.star_progress, 3);
  response = await request(639, 23, await encodeEtf([2020601, 1]));
  assert.equal(response.err.err, 3006);
  send(codec.pack('pb_c2s', { type: -1, seq: 24, data: Buffer.alloc(0) }));
  const login = await decodeEtf(await game.loginPayload());
  assert.ok(Math.abs(login[1][0] - Date.now()) < 5000);
  assert.deepEqual(Buffer.from(new Map(login[2].value).get(92).value), activityBefore);
  const heroModule = new Map(login[2].value).get(10).value[0];
  const hero = codec.unpack('pb_hero_info', Buffer.from(heroModule.value)).hero_list.find(hero => hero.uid === '2020601');
  assert.equal(hero.level, 9); assert.equal(hero.star_progress, 3);
  game.wallet.credit({account_id:'local-1',amount_cents:1000,request_id:'tcp-fund'});
  const order=game.wallet.buy({product_id:11,request_id:'tcp-purchase'});
  const notification=codec.unpack('pb_s2c',await next());assert.equal(notification.type,1900);
  assert.equal(codec.unpack('res_recharge_success',Buffer.from(notification.data,'base64')).order,order.order_id);
  response=await request(16003,30,await encodeEtf(binary(order.order_id)));assert.equal(response.err,undefined);assert.equal(response.seq,30);
  assert.equal(game.wallet.snapshot().orders[0].acknowledged,1);
});
