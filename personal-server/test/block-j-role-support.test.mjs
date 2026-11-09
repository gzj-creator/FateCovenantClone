import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { E, createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createRoleService, properList } from '../game/role-service.mjs';
import { createStoryService } from '../game/story-service.mjs';
import { createSkinService } from '../game/skin-service.mjs';
import { createActFrameService } from '../game/act-frame-service.mjs';
import { createCdkeyService } from '../game/cdkey-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const template = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
const NOW = 1700000000000;
const ROLE_ID = 100001;

function setup(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-block-j-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify({
    version: 1,
    roleId: ROLE_ID,
    serverId: 1,
    createdAt: options.createdAt ?? Math.floor(NOW / 1000),
    modules: template,
    rolePb: codec.pack('to_client_role_info', {
      level: options.level ?? 3,
      nick_name: Buffer.from('Local Test'),
      create_time: options.createdAt ?? Math.floor(NOW / 1000),
      figure_simple_info: {
        sex: 1,
        rank: 0,
        head_info: { tid: '0' },
        frame_info: { tid: '0' },
        title_info: { tid: '0' }
      }
    }).toString('base64'),
    guides: {},
    lineups: null
  }));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const tables = readGameTables();
  const heroTables = readHeroTables();
  const attributeTables = readAttributeTables();
  const calendar = createActivityCalendar({ tables, serverOpenedAt: store.serverOpenedAt, now: () => NOW });
  return {
    get store() { return store; },
    tables,
    calendar,
    role(overrides = {}) {
      return createRoleService({
        store, codec, tables, heroTables, attributeTables,
        now: () => NOW, gmEnabled: () => true, ...overrides
      });
    },
    story() { return createStoryService({ store, codec, now: () => NOW }); },
    skin() { return createSkinService({ store, codec, tables, now: () => NOW }); },
    cdkey(overrides = {}) {
      return createCdkeyService({ store, codec, tables, now: () => NOW, ...overrides });
    },
    actFrame(overrides = {}) {
      return createActFrameService({ store, codec, calendar, tables, now: () => NOW, gmEnabled: () => true, ...overrides });
    },
    grant(awards) {
      return store.transaction(model => grantResources(model, awards, tables, { codec }));
    },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function modules(env) { return new Map(env.store.read().state.modules.value); }

function setModules(env, action) {
  env.store.transaction(model => {
    const current = new Map(model.state.modules.value);
    action(current);
    model.state.modules.value = [...current];
  });
}

function activityLogin(env) {
  const module = modules(env).get(92);
  return codec.unpack('pb_act_login', rawBinary(module));
}

function activityIds(env) {
  const activity = activityLogin(env);
  const ids = [
    ...(activity.act_list ?? []).map(row => Number(row.state_data?.act_id)),
    ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(row => Number(row.act_id)))
  ].filter(Number.isSafeInteger);
  return [...new Set(ids)];
}

test('client table evidence is loaded for role, skin and player-data contracts', () => {
  const tables = readGameTables();
  assert.deepEqual(tables.ChangeName.get(1), {
    tid: 1, res: 101500, res_count: 200, min_length: 1, max_length: 6
  });
  assert.deepEqual(tables.FigureRank.get(22), {
    tid: 22, realm: 6, item: 0, title_name: 12086, item_count: 0,
    level: 0, level_award: 0, level_award_num: 0,
    power: 0, power_award: 0, power_award_num: 0,
    attrs: [[201, 62400], [202, 10400], [203, 6240], [204, 6240], [135, 2000]],
    stage_bg_img: 'img_tzpj_dengjihui_hong.png',
    stage_img: 'img_tzpj_dengjizi_ss.png', stage_level_img: 'img_tzpj_dengjizi_ss6.png',
    title_text_prop: 2091, title_bg: 'img_pj_biaohong.png',
    title_Icon: 'img_pj_biaohong.png', title_Img: 'img_tx_tb11.png',
    award: 0, award_count: 0
  });
  assert.equal(tables.SkinExchangeConst.get(1).exchange_item, 2701900);
  assert.equal(tables.SkinExchangeLib.get(100712).price, 1);
  assert.equal(tables.Skin.get(100712).score, 360);
  assert.equal(tables.SkinIncrease.get(60001).score, 22);
  assert.equal(tables.SkinIncrease.get(60005).score, 108);
  assert.equal(tables.PlayerDataType.size, 38);
  assert.equal(tables.PlayerDataBlock.size, 72);
  assert.ok(tables.VeteranConst.has(1));
});

test('proper ETF lists reject improper tails while direct arrays remain a test convenience', () => {
  assert.deepEqual(properList([1, 2]), [1, 2]);
  assert.deepEqual(properList({ value: [1, 2], improper: false }), [1, 2]);
  assert.equal(properList({ value: [1, 2], improper: true }), null);
  assert.equal(properList({ value: [1, 2] }), null);
});

test('role names use ChangeName, reject occupied names, persist, and decode random-name ETF', async t => {
  const env = setup(t);
  env.grant([[101500, 500]]);
  env.store.transaction(model => { model.role.nick_name = Buffer.from('Local'); });
  const role = env.role();

  const own = await role.execute(1307, { etf: new E.OtpErlangBinary(Buffer.from('Local')) });
  assert.equal(own.value.exists, true);
  assert.equal(own.value.available, false);
  const free = await role.execute(1307, { etf: new E.OtpErlangBinary(Buffer.from('新名')) });
  assert.equal(free.value.exists, false);
  assert.equal(free.value.available, true);

  await assert.rejects(() => role.execute(1301, { etf: Buffer.from('超过六个字符的名字') }), error => error.code === 1);
  const renamed = await role.execute(1301, { etf: Buffer.from('新名') });
  assert.equal(renamed.value.name, '新名');
  assert.equal(renamed.value.times, 1);
  assert.equal(env.store.read().resources.get('101500').num, '300');
  assert.equal(codec.unpack('res_set_role_name', renamed.data).res.changes[0].diff_num, '-200');

  const random = await role.execute(1302, {});
  const randomTerm = await decodeEtf(await encodeEtf(random.etfTerm));
  assert.equal(randomTerm.improper, false);
  assert.equal(randomTerm.value.length, 1);
  const randomName = Buffer.from(randomTerm.value[0].value).toString('utf8');
  assert.ok([...randomName].length <= 6);

  const accepted = await role.execute(105, { etf: new E.OtpErlangList([], false) });
  assert.equal(accepted.value.recorded, true);
  assert.ok(accepted.value.safeMissionId > 0);
  await assert.rejects(() => role.execute(105, { etf: [1] }), error => error.code === 1);
  await assert.rejects(() => role.execute(105, { etf: { value: [], improper: true } }), error => error.code === 1);

  const veteran = await role.execute(111, {});
  assert.equal(veteran.value.eligible, false);
  await assert.rejects(() => role.execute(112, {}), error => error.code === 1);

  const level = await role.execute(1303, {});
  assert.equal(level.value.level, 3);
  await assert.rejects(() => role.execute(1303, {}), error => error.code === 310);
  env.grant([[101500, 50]]);
  const video = await role.execute(1317, {});
  assert.equal(video.value.changes, 1);
  await assert.rejects(() => role.execute(1317, {}), error => error.code === 310);

  env.reopen();
  const reopened = env.role();
  const list = await reopened.execute(106, {});
  const decoded = codec.unpack('pb_account_roles', list.data);
  assert.equal(decoded.roles[0].name, '新名');
  assert.equal(env.store.read().role.level_reward_record, 3);
  assert.equal(env.store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 18);
});

test('veteran commands use an explicit local policy without an undefined configuration crash', async t => {
  const env = setup(t, { level: 1, createdAt: Math.floor(NOW / 1000) - 8 * 86400 });
  const role = env.role({ veteranConfig: { min_level: 1, min_days: 7, skip_awards: [[101500, 25]] } });
  const checked = await role.execute(111, {});
  assert.equal(checked.value.eligible, true);
  assert.ok(checked.value.days >= 8);
  const skipped = await role.execute(112, {});
  assert.equal(skipped.value.skipped, true);
  assert.equal(env.store.read().resources.get('101500').num, '25');
  await assert.rejects(() => role.execute(112, {}), error => error.code === 310);
});

test('support commands commit client diagnostics, cdkeys and audited GM state', async t => {
  const env = setup(t);
  const role = env.role();
  assert.equal((await role.execute(109, {})).data, null);
  assert.equal((await role.execute(78901, { etf: Buffer.from('client diagnostics') })).data, null);

  const gmInput = new E.OtpErlangMap(new Map([
    [new E.OtpErlangBinary(Buffer.from('command')), new E.OtpErlangBinary(Buffer.from('status'))]
  ]));
  const gm = await role.execute(10, { etf: gmInput });
  assert.equal(gm.value.role_id, ROLE_ID);
  await assert.rejects(() => env.role({ gmEnabled: () => false }).execute(10, { etf: gmInput }), error => error.code === 403);

  const cdkey = env.cdkey({ codes: { codes: { WELCOME: { bag_id: 'w1', awards: [[101500, 10]] } } } });
  const claimed = await cdkey.execute(40000, { etf: new E.OtpErlangBinary(Buffer.from(' welcome ')) });
  assert.equal(claimed.value.code, 'WELCOME');
  assert.equal(codec.unpack('pb_res_to_client', claimed.data).changes[0].diff_num, '10');
  await assert.rejects(() => cdkey.execute(40000, { etf: Buffer.from('WELCOME') }), error => error.code === 310);
  await assert.rejects(() => env.cdkey().execute(40000, { etf: Buffer.from('UNKNOWN') }), error => error.code === 5);
  assert.deepEqual(env.store.inspect(db => ({
    logs: db.prepare('SELECT COUNT(*) AS n FROM client_diagnostic_logs WHERE role_id=?').get(ROLE_ID).n,
    codes: db.prepare('SELECT COUNT(*) AS n FROM cdkey_redemptions WHERE role_id=?').get(ROLE_ID).n,
    audits: db.prepare('SELECT COUNT(*) AS n FROM gm_audit_entries WHERE role_id=?').get(ROLE_ID).n
  })), { logs: 1, codes: 1, audits: 1 });
});

test('red dots accept protobuf bytes, deletes raw and base64 paths, and projects through login', async t => {
  const env = setup(t);
  const role = env.role();
  const firstPath = Buffer.from('root/red-one');
  const secondPath = Buffer.from('root/red-two');
  await role.execute(39001, {
    request: {
      to_add_or_change_list: [
        { path_bin: firstPath, state: true, show_count: 2, extra: Buffer.from([1, 2]) },
        { path_bin: secondPath, state: false, show_count: 0, extra: Buffer.alloc(0) }
      ],
      to_del_list: []
    }
  });
  let login = codec.unpack('all_saved_red', role.loginRedDots());
  assert.equal(login.saved_red_list.length, 2);
  assert.deepEqual(login.saved_red_list.map(row => Buffer.from(row.path_bin, 'base64').toString('utf8')).sort(), ['root/red-one', 'root/red-two']);

  await role.execute(39001, { request: { to_add_or_change_list: [], to_del_list: ['root/red-one'] } });
  login = codec.unpack('all_saved_red', role.loginRedDots());
  assert.deepEqual(login.saved_red_list.map(row => Buffer.from(row.path_bin, 'base64').toString('utf8')), ['root/red-two']);

  await role.execute(39001, {
    request: { to_add_or_change_list: [{ path_bin: firstPath, state: true, show_count: 0, extra: Buffer.alloc(0) }], to_del_list: [] }
  });
  await role.execute(39001, { request: { to_add_or_change_list: [], to_del_list: [firstPath.toString('base64')] } });
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM role_red_dots WHERE role_id=?').get(ROLE_ID).n), 1);

  await role.execute(98201, { request: { message_id: 7, is_open: true } });
  const push = codec.unpack('pb_channel_push_param', role.loginChannelPush());
  assert.deepEqual(push.open_list.map(row => [row.message_id, row.is_open]), [[7, true]]);
  env.reopen();
  const reopened = env.role();
  assert.equal(codec.unpack('all_saved_red', reopened.loginRedDots()).saved_red_list.length, 1);
  assert.equal(codec.unpack('pb_channel_push_param', reopened.loginChannelPush()).open_list[0].message_id, 7);
});

test('story login reads slot 1, preserves prior fields, and touch cannot downgrade finish', async t => {
  const env = setup(t);
  setModules(env, current => current.set(88, {
    value: [7, serializedBinary(codec.pack('story_data', { tid: 7, finish_story_list: [90] }))]
  }));
  const story = env.story();
  await story.execute(304, { etf: [2001, 2002] });
  await story.execute(305, { etf: [2001, 2003] });
  const payload = story.loginPayload();
  assert.equal(payload.tid, 7);
  const data = codec.unpack('story_data', payload.payload);
  assert.equal(data.tid, 7);
  assert.deepEqual(data.finish_story_list, [90, 2001, 2002]);
  const statuses = env.store.inspect(db => db.prepare('SELECT story_id,status FROM role_stories WHERE role_id=? ORDER BY story_id').all(ROLE_ID)
    .map(row => ({ ...row })));
  assert.deepEqual(statuses, [
    { story_id: 2001, status: 'finished' },
    { story_id: 2002, status: 'finished' },
    { story_id: 2003, status: 'touched' }
  ]);
  env.reopen();
  assert.deepEqual(codec.unpack('story_data', env.story().loginPayload().payload).finish_story_list, [90, 2001, 2002]);
});

test('skin exchange, wear, five-level increase, handbook and login-module ownership use shipped tables', async t => {
  const env = setup(t);
  env.grant([[2701900, 20], [628002, 60]]);
  const skin = env.skin();
  const heroUid = String(env.store.read().heroInfo.hero_list[0].uid);
  await assert.rejects(() => skin.execute(76004, { etf: [5001] }), error => error.code === 5);
  await assert.rejects(() => skin.execute(76004, { etf: { value: [100712], improper: true } }), error => error.code === 1);
  await skin.execute(76004, { etf: [100712] });
  assert.equal((await skin.execute(76004, { etf: [100712] })).value.skinTid, 100712);
  assert.equal(env.store.read().resources.get('2701900').num, '20');
  await assert.rejects(() => skin.execute(76005, { etf: [] }), error => error.code === 1);
  const exchange = await skin.execute(76005, { etf: [100712] });
  const exchangeData = codec.unpack('pb_res_to_client', exchange.data);
  assert.equal(exchangeData.changes.find(row => row.tid === '2701900').diff_num, '-1');
  assert.equal(exchangeData.changes.find(row => row.tid === '100712').diff_num, '1');
  const skinModule = codec.unpack('pb_skin_info', rawBinary(new Map(env.store.read().state.modules.value).get(65).value[0]));
  assert.equal(skinModule.skin_list.find(row => Number(row.id) === 100712).num, 1);

  const worn = await skin.execute(76003, { request: { hero_uid: heroUid, skin_tid: 100712 } });
  assert.equal(codec.unpack('pb_skin_wear_back', worn.data).skin_tid, '100712');
  const levels = [];
  for (let index = 0; index < 5; index++) {
    const result = await skin.execute(76009, { etf: [100712] });
    levels.push(result.value.level);
  }
  assert.deepEqual(levels, [1, 2, 3, 4, 5]);
  await assert.rejects(() => skin.execute(76009, { etf: [100712] }), error => error.code === 305);
  const handbook = await skin.execute(76007, {});
  assert.equal(handbook.value.activated, 1);
  assert.equal(handbook.value.score, 468);
  const handbookData = codec.unpack('pb_skin_handbook', handbook.data);
  assert.deepEqual(handbookData.skin_list, [4]);
  assert.equal(handbookData.score, 468);
  assert.equal(env.store.read().resources.get('2701900').num, '19');
  assert.equal(env.store.read().resources.get('628002').num, '15');

  env.reopen();
  const row = env.store.inspect(db => db.prepare('SELECT increase_level FROM role_skins WHERE role_id=? AND skin_tid=100712').get(ROLE_ID));
  assert.equal(row.increase_level, 5);
  const reopenedHandbook = await env.skin().execute(76008, {});
  assert.equal(codec.unpack('pb_skin_handbook', reopenedHandbook.data).score, 468);
});

test('skin increase persists login-module-owned skins and their level in module 65', async t => {
  const env = setup(t);
  env.grant([[628002, 9]]);
  const first = await env.skin().execute(76009, { etf: [200612] });
  assert.equal(first.value.level, 1);
  let loginSkins = codec.unpack('pb_skin_info', rawBinary(new Map(env.store.read().state.modules.value).get(65).value[0])).skin_list;
  assert.equal(loginSkins.find(row => Number(row.id) === 200612).increase_level, 1);
  assert.equal(env.store.inspect(db => db.prepare('SELECT increase_level FROM role_skins WHERE role_id=? AND skin_tid=200612').get(ROLE_ID).increase_level), 1);

  env.reopen();
  const second = await env.skin().execute(76009, { etf: [200612] });
  assert.equal(second.value.level, 2);
  loginSkins = codec.unpack('pb_skin_info', rawBinary(new Map(env.store.read().state.modules.value).get(65).value[0])).skin_list;
  assert.equal(loginSkins.find(row => Number(row.id) === 200612).increase_level, 2);
});

test('rank upgrades enforce level, power and item gates; rank 22 is free and awards are idempotent', async t => {
  const env = setup(t);
  const role = env.role();
  env.store.transaction(model => {
    model.role.level = 32;
    model.state.rolePower = { lineup_type: 1, power: '149999' };
  });
  await assert.rejects(() => role.execute(1312, {}), error => error.code === 430);
  env.store.transaction(model => { model.role.level = 33; });
  await assert.rejects(() => role.execute(1312, {}), error => error.code === 431);
  env.store.transaction(model => { model.state.rolePower.power = '150000'; });
  await assert.rejects(() => role.execute(1312, {}), error => error.code === 301);
  env.grant([[34002, 3]]);
  let result = await role.execute(1312, {});
  assert.equal(result.value.rank, 1);
  assert.deepEqual(codec.unpack('pb_role_figure_up_back', result.data).res.changes.map(row => [row.tid, row.diff_num]), [['34002', '-1']]);

  env.store.transaction(model => { model.role.level = 36; model.state.rolePower.power = '350000'; });
  result = await role.execute(1312, {});
  assert.equal(result.value.rank, 2);
  assert.equal(env.store.read().resources.get('34002').num, '0');

  env.store.transaction(model => {
    model.role.figure_simple_info.rank = 21;
    model.role.level = 1;
    model.state.rolePower.power = '0';
  });
  result = await role.execute(1312, {});
  assert.equal(result.value.rank, 22);
  assert.deepEqual(result.value.changes, []);

  env.store.transaction(model => {
    model.role.figure_simple_info.rank = 1;
    model.role.level = 33;
    model.state.rolePower.power = '150000';
  });
  result = await role.execute(1313, {});
  let response = codec.unpack('pb_role_figure_rank_award_back', result.data);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '100');
  const bits = Buffer.from(response.rank_award_bin, 'base64');
  assert.equal(hasBit(bits, 1), true);
  assert.equal(hasBit(bits, 2), true);
  const second = await role.execute(1313, {});
  assert.equal(second.value.changes, 0);
  assert.deepEqual(codec.unpack('pb_role_figure_rank_award_back', second.data).res.changes, []);

  env.store.transaction(model => { model.role.figure_simple_info.rank = 22; });
  const maxRank = await role.execute(1313, {});
  assert.equal(maxRank.value.changes, 0);
  env.reopen();
  assert.equal(env.store.read().role.figure_simple_info.rank, 22);
});

test('stable figure BitBlocks drive ownership and login have-info without negative indexes', async t => {
  const env = setup(t, { level: 120 });
  env.grant([[100108, 1], [300108, 1], [200108, 1]]);
  const role = env.role();
  const info = codec.unpack('pb_figure_have_info', (await role.execute(1308, {})).data);
  assert.equal(hasBit(Buffer.from(info.stable_head_info, 'base64'), 1), true);
  assert.equal(hasBit(Buffer.from(info.stable_frame_info, 'base64'), 1), true);
  assert.equal(hasBit(Buffer.from(info.stable_title_info, 'base64'), 1), true);
  assert.deepEqual(info.limit_title_list.map(row => row.tid), ['300108']);

  const selected = await role.execute(1305, { etf: [300108] });
  const selectedData = codec.unpack('pb_active_title_req_back', selected.data);
  assert.equal(selectedData.simple_info.title_info.tid, '300108');
  const head = await role.execute(1304, { etf: [100108] });
  assert.equal(codec.unpack('pb_figure_simple_info', head.data).head_info.tid, '100108');
  await role.execute(1309, { etf: [2] });
  await role.execute(1310, { etf: [0] });
  await role.execute(1315, { etf: [0] });
  assert.equal(env.store.read().role.figure_simple_info.sex, 2);
  assert.equal(env.store.read().role.figure_simple_info.style_id, '0');
});

test('player-data resolver serves explicit blocks and cache-misses blocks without an authority', async t => {
  const env = setup(t);
  const role = env.role();
  const result = await role.execute(161, {
    request: {
      type: 1,
      item_list: [{ id: String(ROLE_ID), block_id_list: [1, 3, 8] }]
    }
  });
  const back = codec.unpack('pb_function_cache_back', result.data);
  assert.equal(back.item_list.length, 1);
  assert.deepEqual(back.item_list[0].block_list.map(row => row.block_id), [1, 3]);
  const player = codec.unpack('pb_player_info', Buffer.from(back.item_list[0].block_list[0].block_bin, 'base64'));
  const lineup = codec.unpack('pb_player_lineup', Buffer.from(back.item_list[0].block_list[1].block_bin, 'base64'));
  assert.equal(player.id, String(ROLE_ID));
  assert.equal(Buffer.from(player.name, 'base64').toString('utf8'), 'Local Test');
  assert.ok(Array.isArray(lineup.lineup_list));

  setModules(env, current => current.set(110, serializedBinary(codec.pack('pb_fashion_data', {
    cur_id: 321,
    info_list: [{ id: 321, lv: 2 }]
  }))));
  const partial = await role.execute(161, {
    request: { type: 5, item_list: [{ id: String(ROLE_ID), block_id_list: [1, 4, 5, 24, 999] }] }
  });
  const response = codec.unpack('pb_function_cache_back', partial.data);
  assert.deepEqual(response.item_list[0].block_list.map(row => row.block_id), [1, 4, 24]);
  const fashionBlock = response.item_list[0].block_list.find(row => row.block_id === 24);
  assert.equal(await decodeEtf(Buffer.from(fashionBlock.block_bin, 'base64')), 321);
  const wrongRole = await role.execute(161, {
    request: { type: 1, item_list: [{ id: '999', block_id_list: [1] }] }
  });
  assert.deepEqual(codec.unpack('pb_function_cache_back', wrongRole.data).item_list[0].block_list, []);
});

test('activity reconciliation accepts only requested known ids and rejects improper or malformed ETF', async t => {
  const env = setup(t);
  const actFrame = env.actFrame();
  const ids = activityIds(env);
  assert.ok(ids.length >= 2);
  const firstId = ids[0], secondId = ids[1];
  const customIds = new Set((activityLogin(env).act_custom_list ?? []).map(row => Number(row.act_id)));
  const configWindowIds = ids.filter(actId => !customIds.has(actId)).slice(0, 2);
  assert.equal(configWindowIds.length, 2);
  const list = await actFrame.execute(53006, { etf: configWindowIds });
  const listData = codec.unpack('pb_act_frame_stage_push', list.data);
  assert.deepEqual(listData.act_stage_list.map(row => Number(row.act_id)), configWindowIds);
  assert.ok(listData.act_stage_list.every(row => Number(row.start_time) > 0 && Number(row.end_time) > Number(row.start_time)));

  let result = await actFrame.execute(53001, { etf: new E.OtpErlangList([firstId, firstId], false) });
  assert.deepEqual(result.value.actIds, [firstId]);
  const first = codec.unpack('pb_act_state_change_back', result.data);
  assert.ok(first.change_back_data.every(row => row.id === firstId));
  result = await actFrame.execute(53001, { etf: [firstId] });
  assert.equal(result.value.changes, 0);

  result = await actFrame.execute(53002, { etf: [secondId] });
  assert.deepEqual(result.value.actIds, [secondId]);
  assert.ok(codec.unpack('pb_act_role_stage_change_back', result.data).change_list.every(row => row.act_id === secondId));
  assert.deepEqual(env.store.inspect(db => db.prepare('SELECT act_id FROM role_activity_stages WHERE role_id=? ORDER BY act_id').all(ROLE_ID).map(row => row.act_id)), [firstId, secondId].sort((a, b) => a - b));

  await assert.rejects(() => actFrame.execute(53001, {}), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53001, { etf: [] }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53001, { etf: [-1] }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53001, { etf: [999999999] }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53001, { etf: { value: [firstId], improper: true } }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53006, {}), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53006, { etf: [] }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53006, { etf: [1.5] }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53006, { etf: [999999999] }), error => error.code === 1);
  await assert.rejects(() => actFrame.execute(53006, { etf: { value: [firstId], improper: true } }), error => error.code === 1);
});

test('activity state-change hints for configured but undelivered activities return an empty acknowledgement', async t => {
  const env = setup(t);
  const actFrame = env.actFrame();
  const requestIds = [
    84009, 63033, 63034, 63035, 84010, 84011, 84013, 100010, 135007,
    84016, 84017, 100012, 84018, 100013, 100016, 100018, 100020, 100021,
    100025, 63036, 63001, 63004, 63014, 63015, 63029
  ];
  const visibleIds = new Set(activityIds(env));
  assert.ok(requestIds.every(id => env.tables.Activity.has(id)));
  assert.ok(requestIds.every(id => !visibleIds.has(id)));

  const result = await actFrame.execute(53001, { etf: requestIds });
  assert.deepEqual(result.value, { changes: 0, actIds: requestIds });
  assert.deepEqual(codec.unpack('pb_act_state_change_back', result.data).change_back_data, []);
  assert.equal(env.store.inspect(db => db.prepare(
    `SELECT COUNT(*) AS count FROM role_activity_stages WHERE role_id=? AND act_id IN (${requestIds.map(() => '?').join(',')})`
  ).get(ROLE_ID, ...requestIds).count), 0);

  await assert.rejects(
    () => actFrame.execute(53001, { etf: [999999999] }),
    error => error.code === 1 && error.message.includes('Unknown activity ids')
  );
});
