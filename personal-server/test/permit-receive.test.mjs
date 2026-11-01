import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createPermitService } from '../game/permit-service.mjs';
import { createMonthPermitService } from '../game/month-permit-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const STANDARD_PERMIT = 1401;
const STANDARD_PRODUCT = 2000001;
const STANDARD_DAY = 20757;
const MONTH_PERMIT = 1004012;
const MONTH_PRODUCT = 1300071;
const MONTH_EXP_ITEM = 10004200;

function fixture() {
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(row => row.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t, prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  const make = () => ({
    standard: createPermitService({ codec, tables, now: () => STANDARD_DAY * 86400 }),
    month: createMonthPermitService({ codec, tables })
  });
  let services = make();
  t.after(() => {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    get store() { return store; },
    get standard() { return services.standard; },
    get month() { return services.month; },
    grant(awards) { return store.transaction(model => grantResources(model, awards, tables, { codec })); },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec });
      services = make();
    }
  };
}

function standardInfo(store) {
  const moduleValue = new Map(store.state().modules.value).get(38);
  for (const element of moduleValue.value) {
    const data = codec.unpack('pb_permit_data', rawBinary(element));
    const info = (data.permit_list ?? []).find(row => Number(row.id) === STANDARD_PERMIT);
    if (info) return info;
  }
  throw new Error('Standard permit row not found');
}

function monthInfo(store) {
  const moduleValue = new Map(store.state().modules.value).get(183);
  for (const element of moduleValue.value) {
    const login = codec.unpack('pb_act_role_login', rawBinary(element));
    for (const entry of login.data_list ?? []) {
      if (typeof entry.module_login_data !== 'string') continue;
      const wrapped = Buffer.from(entry.module_login_data, 'base64');
      if (wrapped.length < 6 || wrapped[0] !== 0x83 || wrapped[1] !== 0x6d) continue;
      const message = codec.unpack('pb_month_permit_login_back', wrapped.subarray(6));
      const info = message.month_permit_data?.month_permit_list?.find(row => Number(row.id) === MONTH_PERMIT);
      if (info) return info;
    }
  }
  throw new Error('Month permit row not found');
}

test('standard permit receive-all grants free and purchased levels once and persists', t => {
  const env = setup(t, 'fc-standard-permit-receive-');
  const before = BigInt(env.store.read().resources.get('101500')?.num ?? 0);

  const free = env.store.transaction(model => env.standard.claimAll({ model, permitId: STANDARD_PERMIT }));
  assert.equal(free.level, 7);
  assert.deepEqual(free.levels.map(row => [Number(row.level), row.receive_free, row.receive_permit]), [
    [1, true, undefined], [2, true, undefined], [3, true, undefined], [4, true, undefined],
    [5, true, undefined], [6, true, undefined], [7, true, undefined]
  ]);
  assert.equal(BigInt(env.store.read().resources.get('101500').num) - before, 210n);
  assert.throws(
    () => env.store.transaction(model => env.standard.claimPaid({ model, permitId: STANDARD_PERMIT })),
    error => error.code === 25001
  );

  env.store.transaction(model => env.standard.purchase({ model, product: tables.Recharge.get(STANDARD_PRODUCT) }));
  const paid = env.store.transaction(model => env.standard.claimAll({ model, permitId: STANDARD_PERMIT }));
  assert.deepEqual(paid.levels.map(row => [Number(row.level), row.receive_free, row.receive_permit]), [
    [1, true, true], [2, true, true], [3, true, true], [4, true, true],
    [5, true, true], [6, true, true], [7, true, true]
  ]);
  assert.throws(
    () => env.store.transaction(model => env.standard.claimAll({ model, permitId: STANDARD_PERMIT })),
    error => error.code === 25003
  );

  env.reopen();
  assert.equal(standardInfo(env.store).is_pay, true);
  assert.deepEqual(standardInfo(env.store).levels.map(row => [Number(row.level), row.receive_free, row.receive_permit]), [
    [1, true, true], [2, true, true], [3, true, true], [4, true, true],
    [5, true, true], [6, true, true], [7, true, true]
  ]);
});

test('month permit single and receive-all claims enforce level, paid gears and duplication', t => {
  const env = setup(t, 'fc-month-permit-receive-');
  env.grant([[MONTH_EXP_ITEM, 2000]]);
  env.store.transaction(model => env.month.purchase({ model, product: tables.Recharge.get(MONTH_PRODUCT) }));

  const single = env.store.transaction(model => env.month.claimReward({ model, actId: MONTH_PERMIT, gearLvTid: 5101 }));
  assert.equal(single.currentLevel, 2);
  assert.deepEqual(single.claimed, [5101]);
  assert.deepEqual(single.response.get_list.map(Number), [5101]);
  assert.throws(
    () => env.store.transaction(model => env.month.claimReward({ model, actId: MONTH_PERMIT, gearLvTid: 5101 })),
    error => error.code === 25002
  );

  const all = env.store.transaction(model => env.month.claimAll({ model, actId: MONTH_PERMIT }));
  assert.deepEqual(all.claimed, [5102, 5201, 5202]);
  assert.deepEqual(all.response.get_list.map(Number), [5102, 5201, 5202]);
  assert.deepEqual(monthInfo(env.store).get_gear_lv_list.map(Number), [5101, 5102, 5201, 5202]);
  assert.equal(all.response.month_permit.get_gear_lv_list.length, 4);
  assert.throws(
    () => env.store.transaction(model => env.month.claimAll({ model, actId: MONTH_PERMIT })),
    error => error.code === 25003
  );

  env.reopen();
  assert.deepEqual(monthInfo(env.store).get_gear_lv_list.map(Number), [5101, 5102, 5201, 5202]);
});

test('gateway routes 35005 and 105803 over real TCP', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-permit-receive-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    activityMode: 'all-open',
    now: () => STANDARD_DAY * 86400 * 1000,
    verifySession: (uid, code) => uid === 'permit-user' && code === 'permit-session',
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  game.store.transaction(model => grantResources(model, [[MONTH_EXP_ITEM, 2000]], tables, { codec }));

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [];
  const waiters = [];
  socket.on('data', chunk => {
    for (const frame of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(frame);
      else queue.push(frame);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(frame => { clearTimeout(timer); resolve(frame); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };

  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'permit-user', verify_code: 'permit-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);

  const standard = await request(35005, 2, await encodeEtf([STANDARD_PERMIT]));
  assert.equal(standard.err, undefined, JSON.stringify(events.filter(event => event.seq === 2)));
  const standardValue = codec.unpack('pb_permit_receive_back', Buffer.from(standard.data, 'base64'));
  assert.equal(Number(standardValue.permit.id), STANDARD_PERMIT);
  assert.equal(standardValue.levels.length, 7);

  const month = await request(105803, 3, Buffer.alloc(0));
  assert.equal(month.err, undefined);
  const monthValue = codec.unpack('pb_month_permit_receive_back', Buffer.from(month.data, 'base64'));
  assert.equal(Number(monthValue.month_permit.id), MONTH_PERMIT);
  assert.deepEqual(monthValue.get_list.map(Number), [5101, 5102]);

  assert.ok(events.some(event => event.event === 'permit_reward_committed' && event.type === 35005));
  assert.ok(events.some(event => event.event === 'month_permit_reward_committed' && event.type === 105803));
  assert.equal(events.some(event => event.event === 'unsupported_command' && [35005, 105803].includes(event.type)), false);
});
