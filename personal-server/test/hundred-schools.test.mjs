import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { binary, createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { createHeroDrawActivityService } from '../game/hero-draw-activity-service.mjs';
import { createRecruitService } from '../game/recruit-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const heroTables = readHeroTables();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
const SERVER_OPENED_AT = 1792789200;
const ACTIVITY_ID = 117001;
const FIXED_NOW = 1793409600;

function seed() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: SERVER_OPENED_AT,
    modules,
    rolePb: codec.pack('to_client_role_info', { level: 30, nick_name: Buffer.from('Hundred Schools Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function makeServices(store, clock) {
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    mode: 'all-open',
    currentFishingActivityId: 1074011,
    now: () => clock.seconds * 1000
  });
  const heroDraw = createHeroDrawActivityService({
    store,
    codec,
    tables,
    heroTables,
    calendar,
    now: () => clock.seconds
  });
  const wallet = createWalletService({
    store,
    codec,
    tables,
    heroDrawActivity: heroDraw,
    now: () => clock.seconds
  });
  const recruit = createRecruitService({
    store,
    codec,
    tables,
    heroTables,
    now: () => clock.seconds,
    onDraw: (model, draw) => heroDraw.recordDraw(model, draw)
  });
  recruit.ensureLoginState();
  return { calendar, heroDraw, wallet, recruit };
}

function directFixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-schools-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const clock = { seconds: FIXED_NOW };
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
  let services = makeServices(store, clock);
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    databasePath,
    clock,
    get store() { return store; },
    get heroDraw() { return services.heroDraw; },
    get wallet() { return services.wallet; },
    get recruit() { return services.recruit; },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, serverOpenedAt: SERVER_OPENED_AT });
      services = makeServices(store, clock);
    }
  };
}

function storedActivity(store) {
  const module = new Map(store.state().modules.value).get(92);
  assert.ok(module);
  return codec.unpack('pb_act_login', rawBinary(module));
}

function unwrapDrawPayload(entry) {
  let bytes = Buffer.from(entry.module_login_data ?? '', 'base64');
  if (bytes[0] === 0x83 && bytes[1] === 0x6d) bytes = bytes.subarray(6);
  return bytes.length ? codec.unpack('pb_hero_draw_act_data', bytes) : { role_data: {}, server_draw_count: 0 };
}

function storedDraw(store) {
  const activity = storedActivity(store);
  const entry = activity.act_list.find(row => Number(row.state_data?.act_id) === ACTIVITY_ID)
    ?? activity.act_parallel_list.flatMap(group => group.states_data ?? []).find(state => Number(state.act_id) === ACTIVITY_ID);
  assert.ok(entry);
  return unwrapDrawPayload(entry);
}

function setRecruitDrawCount(store, lib, count) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(10);
    assert.ok(module);
    const info = codec.unpack('pb_hero_draw_info', rawBinary(module.value[2]));
    const row = info.recruit_list.find(entry => Number(entry.draw_lib) === lib);
    assert.ok(row);
    row.draw_count = count;
    module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', info));
    model.state.modules.value = [...modules];
  });
}

function addResource(store, tid, amount) {
  store.transaction(model => grantResources(model, [[tid, amount]], tables));
}

function unlockEliteRecruit(store) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(10);
    const drawInfo = codec.unpack('pb_hero_draw_info', rawBinary(module.value[2]));
    drawInfo.recruit_list.find(info => Number(info.draw_lib) === 1).draw_count = 30;
    module.value[2] = serializedBinary(codec.pack('pb_hero_draw_info', drawInfo));
    model.state.modules.value = [...modules];
  });
}

async function gatewayFixture(t, logger = () => {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-schools-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const clock = { seconds: FIXED_NOW };
  let game = createLocalGame({
    databasePath,
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    activityMode: 'all-open',
    currentFishingActivityId: 1074011,
    localWallet: true,
    now: () => clock.seconds * 1000,
    logger,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));

  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    while (true) {
      const frame = codec.unpack('pb_s2c', await next());
      if (frame.seq === seq) return frame;
    }
  };
  const requestWithWalletPush = async (seq, data) => {
    send(codec.pack('pb_c2s', { type: 16004, seq, data }));
    const frames = [];
    while (!frames.some(frame => frame.seq === seq)) frames.push(codec.unpack('pb_s2c', await next()));
    return {
      ack: frames.find(frame => frame.seq === seq),
      notification: frames.find(frame => frame.type === 1900),
      wishNotification: frames.find(frame => frame.type === 9132)
    };
  };
  const loginResponse = await request(909103, 1, codec.pack('login', {
    server_id: 1,
    channel_uid: 'local-user',
    verify_code: 'test-session',
    channel_extra: ''
  }));
  const login = await decodeEtf(Buffer.from(loginResponse.data, 'base64'));
  return {
    directory,
    clock,
    login,
    request,
    requestWithWalletPush,
    get game() { return game; }
  };
}

test('genre selection persists and the star task uses the selected lineup id', t => {
  const env = directFixture(t);
  env.heroDraw.selectGenre(4);
  assert.throws(() => env.heroDraw.selectGenre(5), error => error.code === 1);
  assert.equal(storedDraw(env.store).role_data.draw_exchange_id, 4);

  env.store.transaction(model => {
    for (const tid of heroTables.NormalDrawExchangeLineup.get(4).hero) {
      const id = String(tid);
      const existing = model.heroInfo.hero_list.find(hero => String(hero.tid) === id);
      if (existing) existing.star = 75000;
      else model.heroInfo.hero_list.push({ tid: id, uid: id, level: 1, star: 75000, star_progress: 0, breakthrough_level: 0, quality: 50 });
    }
    env.heroDraw.recordDraw(model, { lib: 1, count: 400 });
    env.heroDraw.recordDraw(model, { lib: 10, count: 10 });
  });
  assert.equal(storedDraw(env.store).role_data.draw_count, 400);
  assert.equal(storedDraw(env.store).server_draw_count, 400);

  const personal = env.heroDraw.claimTask(7);
  assert.equal(hasBit(Buffer.from(personal.value.reward_bytes), 7), true);
  const artifactChange = personal.value.res.changes.find(row => row.tid === '200110');
  assert.equal(Number(artifactChange.diff_num), 1);
  const artifactModule = new Map(env.store.state().modules.value).get(50);
  const artifacts = codec.unpack('pb_artifact_info', rawBinary(artifactModule.value[0]));
  assert.equal(Number(artifacts.artifact_list.find(row => Number(row.tid) === 200110).num), Number(artifactChange.new_num));
  assert.doesNotThrow(() => env.heroDraw.claimTask(24));
  assert.doesNotThrow(() => env.heroDraw.claimTask(25));
  assert.throws(() => env.heroDraw.claimTask(7), error => error.code === 310);
  assert.deepEqual(
    env.store.inspect(db => db.prepare('SELECT task_id FROM activity_claims WHERE act_id=? ORDER BY task_id').all(ACTIVITY_ID).map(row => row.task_id)),
    [7, 24, 25]
  );

  env.reopen();
  assert.equal(storedDraw(env.store).role_data.draw_exchange_id, 4);
  assert.throws(() => env.heroDraw.claimTask(7), error => error.code === 310);
});

test('recruit draws update hundred-school counters atomically and exclude paid-library draws', t => {
  const env = directFixture(t);
  for (const tid of [2002, 3002, 401900, 4002]) addResource(env.store, tid, 10000);
  unlockEliteRecruit(env.store);
  for (const lib of [1, 2, 3, 10]) {
    const result = env.recruit.execute(601, { draw_lib: lib, point_draw_num: 2 });
    assert.equal(result.data.length > 0, true);
  }
  assert.equal(storedDraw(env.store).role_data.draw_count, 6);
  assert.equal(storedDraw(env.store).server_draw_count, 6);

  const failing = createRecruitService({
    store: env.store,
    codec,
    tables,
    heroTables,
    now: () => env.clock.seconds,
    onDraw() { throw new Error('Injected activity progress failure'); }
  });
  failing.ensureLoginState();
  const before = env.store.state();
  assert.throws(() => failing.execute(601, { draw_lib: 1, point_draw_num: 1 }), /Injected activity progress failure/);
  assert.deepEqual(env.store.state(), before);
});

test('all thirteen gifts grant once, enforce cycles and survive a SQLite reopen', t => {
  const env = directFixture(t);
  addResource(env.store, 101500, 100000);
  addResource(env.store, 401500, 100000);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'hundred-schools-gift-credit' });

  for (const [index, productId] of [880101, 880102, 111004, 112001, 880105].entries()) {
    const result = env.wallet.purchaseGift({ product_id: productId, request_id: `resource-gift-${index}` });
    assert.equal(result.extra_ret_list.some(entry => entry.flag === 92), true);
  }
  for (const [index, productId] of [40008, 40010, 2090003, 2090004, 2090005, 880103, 880104, 2090007].entries()) {
    const result = env.wallet.buy({
      product_id: productId,
      request_id: `cash-gift-${index}`,
      activity_version: 1
    });
    assert.equal(result.hero_activity_id, ACTIVITY_ID);
  }
  const allGifts = [880101, 880102, 111004, 112001, 880105, 40008, 40010, 2090003, 2090004, 2090005, 880103, 880104, 2090007];
  assert.deepEqual(allGifts.map(id => env.heroDraw.giftPurchaseCount(id)), Array(13).fill(1));
  assert.equal(env.store.inspect(db => db.prepare("SELECT count(*) AS n FROM activity_purchases WHERE activity_id=? AND kind='gift'").get(ACTIVITY_ID).n), 13);

  for (let index = 0; index < 4; index++) {
    env.wallet.purchaseGift({ product_id: 111004, request_id: `daily-gift-fill-${index}` });
  }
  assert.equal(env.heroDraw.giftPurchaseCount(111004), 5);
  assert.throws(() => env.wallet.purchaseGift({ product_id: 111004, request_id: 'daily-gift-limit' }), error => error.code === 307);
  env.clock.seconds += 86400;
  assert.equal(env.heroDraw.giftPurchaseCount(111004), 0);
  assert.doesNotThrow(() => env.wallet.purchaseGift({ product_id: 111004, request_id: 'daily-gift-next-day' }));
  assert.equal(env.heroDraw.giftPurchaseCount(111004), 1);

  env.reopen();
  assert.equal(env.heroDraw.giftPurchaseCount(880101), 1);
  assert.equal(env.heroDraw.giftPurchaseCount(40008), 1);
  assert.equal(env.heroDraw.giftPurchaseCount(111004), 1);
});

test('buy-cycle 6 remains a lifetime limit across activity periods', t => {
  const env = directFixture(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'hundred-schools-lifetime-credit' });
  for (const [index, productId] of [2090003, 2090004, 2090005, 2090007].entries()) {
    env.wallet.buy({ product_id: productId, request_id: `lifetime-gift-${index}`, activity_version: 1 });
  }

  // An old timestamp is before every activity-period bucket. These rows must
  // still count because BuyCycleLimit 6 is stored against the role forever.
  env.store.inspect(db => db.prepare(`UPDATE activity_purchases SET created_at=?
    WHERE activity_id=? AND kind='gift' AND product_id IN (2090003,2090004,2090005,2090007)`)
    .run(new Date(0).toISOString(), ACTIVITY_ID));
  env.reopen();
  assert.deepEqual(
    [2090003, 2090004, 2090005, 2090007].map(id => env.heroDraw.giftPurchaseCount(id)),
    [1, 1, 1, 1]
  );
  for (const productId of [2090003, 2090004, 2090005, 2090007]) {
    assert.throws(
      () => env.wallet.buy({ product_id: productId, request_id: `lifetime-limit-${productId}`, activity_version: 1 }),
      error => error.code === 307
    );
  }
});

test('shared daily-discount products also update Hundred Schools without exceeding its purchase limit', t => {
  const env = directFixture(t);
  env.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'shared-daily-credit' });

  let result = env.wallet.buy({ product_id: 40008, request_id: 'shared-daily-first' });
  assert.equal(result.hero_activity_id, ACTIVITY_ID);
  assert.equal(env.heroDraw.giftPurchaseCount(40008), 1);

  // DailyDiscount additional purchases remain available, but the shared SKU
  // cannot create a second Hundred Schools purchase record or reward slot.
  result = env.wallet.buy({ product_id: 40008, request_id: 'shared-daily-additional', extra_buy: true });
  assert.equal(result.daily_discount_additional, true);
  assert.equal(env.heroDraw.giftPurchaseCount(40008), 1);
  assert.equal(env.store.inspect(db => db.prepare("SELECT count(*) AS n FROM activity_purchases WHERE activity_id=? AND product_id=40008 AND kind='gift'").get(ACTIVITY_ID).n), 1);

  env.reopen();
  assert.equal(env.heroDraw.giftPurchaseCount(40008), 1);
  assert.throws(() => env.wallet.buy({
    product_id: 40008,
    request_id: 'shared-direct-after-daily',
    activity_version: 1
  }), error => error.code === 307);
});

test('all configured personal, server and selected-genre star tasks can be claimed', t => {
  const env = directFixture(t);
  env.heroDraw.selectGenre(4);
  env.store.transaction(model => {
    for (const tid of heroTables.NormalDrawExchangeLineup.get(4).hero) {
      const id = String(tid);
      const existing = model.heroInfo.hero_list.find(hero => String(hero.tid) === id);
      if (existing) existing.star = 600000;
      else model.heroInfo.hero_list.push({ tid: id, uid: id, level: 1, star: 600000, star_progress: 0, breakthrough_level: 0, quality: 50 });
    }
    env.heroDraw.recordDraw(model, { lib: 1, count: 2000 });
  });

  const taskIds = [...tables.HeroDrawActTask.keys()].sort((left, right) => left - right);
  assert.equal(taskIds.length, 34);
  for (const taskId of taskIds) {
    const result = env.heroDraw.claimTask(taskId);
    assert.equal(hasBit(Buffer.from(result.value.reward_bytes), taskId), true, `task ${taskId}`);
  }
  const claimed = env.store.inspect(db => db.prepare('SELECT task_id FROM activity_claims WHERE act_id=? ORDER BY task_id').all(ACTIVITY_ID).map(row => row.task_id));
  assert.deepEqual(claimed, taskIds);
  for (const taskId of taskIds) {
    assert.throws(() => env.heroDraw.claimTask(taskId), error => error.code === 310, `duplicate task ${taskId}`);
  }
});

test('real TCP routes genre, recruitment, tasks, gifts, recommendations and rankings', async t => {
  const logs = [];
  const env = await gatewayFixture(t, event => logs.push(event));
  const loginModules = new Map(env.login[2].value);
  assert.ok(loginModules.get(92), `login module 92 missing; keys=${[...loginModules.keys()].join(',')}`);
  const loginActivity = codec.unpack('pb_act_login', Buffer.from(loginModules.get(92).value));
  const loginEntry = loginActivity.act_list.find(entry => Number(entry.state_data?.act_id) === ACTIVITY_ID);
  assert.ok(loginEntry);
  const loginDraw = unwrapDrawPayload(loginEntry);
  assert.ok(loginDraw.role_data.recharge_limit_info);
  assert.deepEqual(loginDraw.role_data.recharge_limit_info.buy_num_list, []);
  assert.equal(Number(loginDraw.role_data.draw_exchange_id ?? 0), 0);

  for (const tid of [2002, 3002, 401900, 4002, 101500, 401500]) addResource(env.game.store, tid, 100000);
  unlockEliteRecruit(env.game.store);
  env.game.wallet.credit({ account_id: 'local-1', amount_cents: 100000, request_id: 'hundred-schools-tcp-credit' });

  let response = await env.request(100302, 10, await encodeEtf([4]));
  assert.equal(response.err, undefined);
  assert.equal(storedDraw(env.game.store).role_data.draw_exchange_id, 4);

  for (const [index, lib] of [1, 2, 3, 10].entries()) {
    response = await env.request(601, 11 + index, codec.pack('pb_draw_hero', { draw_lib: lib, point_draw_num: 2 }));
    assert.equal(response.err, undefined);
  }
  assert.equal(storedDraw(env.game.store).role_data.draw_count, 6);
  assert.equal(storedDraw(env.game.store).server_draw_count, 6);

  response = await env.request(100301, 20, await encodeEtf([18]));
  assert.equal(response.err, undefined);
  const reward = codec.unpack('pb_hero_draw_act_task_reward_back', Buffer.from(response.data, 'base64'));
  assert.equal(hasBit(Buffer.from(reward.reward_bytes, 'base64'), 18), true);
  assert.ok(reward.res.changes.length > 0);

  response = await env.request(16005, 21, codec.pack('pb_recharge_buy_or_rev_req', { recharge_id: 880101, buy_num: 1 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('res_buy_or_Rev_gift', Buffer.from(response.data, 'base64')).extra_ret_list.some(entry => entry.flag === 92), true);

  let walletFrames = await env.requestWithWalletPush(22, await encodeEtf([40008, 1, 0]));
  assert.equal(walletFrames.ack.err, undefined);
  let push = codec.unpack('res_recharge_success', Buffer.from(walletFrames.notification.data, 'base64'));
  assert.equal(push.extra_ret_list.some(entry => entry.flag === 92), true);
  assert.equal(env.game.store.inspect(db => db.prepare("SELECT count(*) AS n FROM activity_purchases WHERE activity_id=? AND product_id=40008 AND kind='gift'").get(ACTIVITY_ID).n), 1);

  const week = codec.unpack('pb_week_hunt', rawBinary(new Map(env.game.store.state().modules.value).get(533))).week_period_info[0];
  const giftDay = Math.min(Math.floor((env.clock.seconds + 10800) / 86400), week.start_day + 6);
  const dailyOptions = JSON.stringify([
    { ipv4: '10.0.2.15', channel_extra_cfg: '', channel_id: '160092', mac_address: '' },
    [false, week.version, giftDay]
  ]);
  walletFrames = await env.requestWithWalletPush(23, await encodeEtf([40010, binary(Buffer.from(dailyOptions)), 0]));
  assert.equal(walletFrames.ack.err, undefined);
  const dailyModule = new Map(env.game.store.state().modules.value).get(108);
  assert.equal(codec.unpack('pb_daily_discount_all', rawBinary(dailyModule)).daily_discount_list.find(row => row.recharge_tid === 3).buy_times, 1);
  push = codec.unpack('res_recharge_success', Buffer.from(walletFrames.notification.data, 'base64'));
  assert.equal(push.extra_ret_list.some(entry => entry.flag === 40), true);
  assert.equal(push.extra_ret_list.some(entry => entry.flag === 92), true);
  assert.equal(env.game.store.inspect(db => db.prepare("SELECT count(*) AS n FROM activity_purchases WHERE activity_id=? AND product_id=40010 AND kind='gift'").get(ACTIVITY_ID).n), 1);

  response = await env.request(16004, 24, await encodeEtf([40010, 2, 0]));
  assert.equal(response.err.err, 5);
  response = await env.request(16004, 25, await encodeEtf([40010, 1, 0]));
  // Do not leave the client waiting for a 1900 push that will never follow.
  // A repeated gift reports its configured limit and the original purchase stays intact.
  assert.equal(response.err.err, 16016);
  assert.equal(env.game.store.inspect(db => db.prepare("SELECT count(*) AS n FROM activity_purchases WHERE activity_id=? AND product_id=40010 AND kind='gift'").get(ACTIVITY_ID).n), 1);

  response = await env.request(85901, 30, codec.pack('pb_recommend_gift_active_req', {
    actives: [{ act_tid: ACTIVITY_ID, gift_id: [880101, 40008, 40010] }]
  }));
  assert.equal(response.err, undefined);
  const recommended = codec.unpack('pb_recommend_gift_active_rsp', Buffer.from(response.data, 'base64')).gift_list;
  assert.deepEqual(recommended[0].buy_list.map(row => [row.recharge_tid, row.buy_times]), [[880101, 1], [40008, 1], [40010, 1]]);

  response = await env.request(2008, 31, await encodeEtf(180));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('rank_to_client', Buffer.from(response.data, 'base64')).rank_id, '180');
  response = await env.request(2011, 32, await encodeEtf([180, 181, 182, 183]));
  assert.equal(response.err, undefined);
  assert.deepEqual(codec.unpack('rank_to_client_list', Buffer.from(response.data, 'base64')).client_list.map(row => row.rank_id), ['180', '181', '182', '183']);
  assert.equal(logs.some(event => event.event === 'hero_draw_genre_selected'), true);
  assert.equal(logs.some(event => event.event === 'hero_draw_task_claimed'), true);
});
