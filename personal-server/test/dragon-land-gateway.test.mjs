import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLocalGame } from '../local-game.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readDragonLandTables, dragonLandConfigForVersion } from '../config/dragon-land-tables.mjs';
import { activityWindow } from '../game/activity-calendar.mjs';
import { createDragonLandActService } from '../game/dragon-land-act-service.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const dragonLandTables = readDragonLandTables();
const OPENED_AT = 1792789200;
const ACT_ID = 1036001;
const VERSION = 1;
const GUILD_ID = '900001';
const DAY_ONE = activityWindow(tables.ActFrameAct.get(ACT_ID), OPENED_AT).start + 3600;
const NOW_MS = DAY_ONE * 1000;
const awardDay = dragonLandConfigForVersion(dragonLandTables, VERSION).award_day;

function seedDatabase(databasePath) {
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(24, serializedBinary(codec.pack('pb_res_guild_login', {
      guildId: GUILD_ID,
      guild: { guild_id: GUILD_ID, name: 'Local Guild', level: '1', member_list: [{ role_id: String(model.state.roleId) }] }
    })));
    model.state.modules.value = [...modules];
  });
  store.close();
}

function openGame(databasePath) {
  return createLocalGame({
    databasePath,
    statePath: path.join(path.dirname(databasePath), 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: OPENED_AT,
    activityMode: 'all-open',
    now: () => NOW_MS
  });
}

async function connectClient(t, game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
  t.after(() => socket.destroy());
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const nextFrame = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const challenge = parseServerChallenge(await nextFrame()), key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const pushes = [];
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const message = codec.unpack('pb_s2c', await nextFrame());
      if (message.seq === seq) return message;
      if (Number.isSafeInteger(Number(message.type))) pushes.push(message);
    }
  };
  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));
  assert.equal(Number(login.code ?? 1), 1);
  return {
    login,
    request,
    pushes,
    payloadOf: reply => Buffer.from(reply.data ?? '', 'base64'),
    errorCode: reply => Number(reply.err?.err ?? reply.err)
  };
}

test('DragonLandActCmd 107701/107702/107703 answer over the temporary handshake and survive a reopen', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-dragon-land-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite');
  seedDatabase(databasePath);
  let game = openGame(databasePath);
  t.after(async () => {
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  let client = await connectClient(t, game);
  assert.equal(game.dragonLandAct.guildId(), GUILD_ID);

  // Login carries the dragon land role block inside module 92.
  const loginModuleEntries = (await decodeEtf(client.payloadOf(client.login)))[2].value;
  const loginModules = new Map(loginModuleEntries.map(entry => {
    const pair = Array.isArray(entry) ? entry : entry.value;
    return [Number(pair[0]), pair[1]];
  }));
  const activityModule = loginModules.get(92);
  assert.ok(activityModule, 'login module 92 is missing');
  const activity = codec.unpack('pb_act_login', Array.from(activityModule.value));
  const entry = (activity.act_list ?? []).find(item => Number(item.state_data?.act_id) === ACT_ID);
  assert.ok(entry, 'dragon land login entry is missing');
  const raw = Buffer.from(entry.module_login_data ?? '', 'base64');
  assert.equal(raw[0], 0x83);
  assert.equal(raw[1], 0x6d);
  assert.equal(codec.unpack('pb_dragon_land_role_data', raw.subarray(6)).version, String(VERSION));

  const guildReply = await client.request(107703, 2, codec.pack('pb_dragon_land_guild_data_req', { activity_id: String(ACT_ID) }));
  assert.equal(guildReply.err, undefined);
  const guild = codec.unpack('pb_dragon_land_guild_data_rsp', client.payloadOf(guildReply)).guild_info;
  assert.equal(guild.version, String(VERSION));
  assert.equal(guild.boss_id, '1');
  assert.equal(guild.level, '1');

  // No fight has been settled yet, so the trial tiers are not reachable.
  const locked = await client.request(107702, 3, codec.pack('pb_dragon_land_trial_award_req', {
    activity_id: String(ACT_ID), id_list: ['10101']
  }));
  assert.equal(client.errorCode(locked), 311);

  game.dragonLandAct.recordBossDamage({ actId: ACT_ID, guildId: GUILD_ID, damage: 900, wayTid: 1, piece: 6 });
  const trial = await client.request(107702, 4, codec.pack('pb_dragon_land_trial_award_req', {
    activity_id: String(ACT_ID), id_list: ['10101']
  }));
  assert.equal(trial.err, undefined);
  const trialValue = codec.unpack('pb_dragon_land_trial_award_rsp', client.payloadOf(trial));
  assert.deepEqual(trialValue.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]), [[101500, 10]]);
  assert.deepEqual(trialValue.act_info.boss_award_list, ['10101']);

  const daily = await client.request(107701, 5, codec.pack('pb_dragon_land_daily_award_req', { activity_id: String(ACT_ID) }));
  assert.equal(daily.err, undefined);
  const dailyValue = codec.unpack('pb_dragon_land_daily_award_rsp', client.payloadOf(daily));
  assert.equal(dailyValue.act_info.daily_award, true);
  assert.deepEqual(
    dailyValue.res.changes.map(change => [Number(change.tid), Number(change.diff_num)]),
    awardDay.map(row => [Number(row[0]), Number(row[1])])
  );
  const duplicate = await client.request(107701, 6, codec.pack('pb_dragon_land_daily_award_req', { activity_id: String(ACT_ID) }));
  assert.equal(codec.unpack('pb_dragon_land_daily_award_rsp', client.payloadOf(duplicate)).res.changes.length, 0);

  await game.close();
  game = openGame(databasePath);
  client = await connectClient(t, game);
  const afterReopen = await client.request(107701, 7, codec.pack('pb_dragon_land_daily_award_req', { activity_id: String(ACT_ID) }));
  assert.equal(codec.unpack('pb_dragon_land_daily_award_rsp', client.payloadOf(afterReopen)).res.changes.length, 0);
  const trialReopen = await client.request(107702, 8, codec.pack('pb_dragon_land_trial_award_req', {
    activity_id: String(ACT_ID), id_list: ['10101']
  }));
  assert.equal(codec.unpack('pb_dragon_land_trial_award_rsp', client.payloadOf(trialReopen)).res.changes.length, 0);
  const guildAfterReopen = await client.request(107703, 9, codec.pack('pb_dragon_land_guild_data_req', { activity_id: String(ACT_ID) }));
  const guildInfo = codec.unpack('pb_dragon_land_guild_data_rsp', client.payloadOf(guildAfterReopen)).guild_info;
  assert.equal(guildInfo.lost_hp, '900');
  assert.equal(guildInfo.piece, '6');
});

test('DragonLandActCmd 107701 rolls the whole grant back when encoding or SQLite fails', t => {
  const store = createGameStore({
    databasePath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fc-dragon-land-tx-')), 'game.sqlite'),
    seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT
  });
  t.after(() => { try { store.close(); } catch {} });
  const calendar = { serverOpenedAt: OPENED_AT, mode: 'all-open', isActivityRunning: () => true };
  const amounts = () => store.inspect(db => new Map(
    db.prepare('SELECT tid, amount FROM resources WHERE role_id=?').all(store.state().roleId)
      .map(row => [String(row.tid), Number(row.amount)])
  ));
  const before = amounts();
  const request = codec.pack('pb_dragon_land_daily_award_req', { activity_id: String(ACT_ID) });

  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_dragon_land_daily_award_rsp') throw new Error('forced dragon land response encode failure');
      return codec.pack(name, value);
    }
  };
  const encodingService = createDragonLandActService({
    store, codec: brokenCodec, tables, dragonLandTables, calendar, now: () => NOW_MS
  });
  assert.throws(() => encodingService.execute(107701, request), /forced dragon land response encode failure/);
  assert.deepEqual(amounts(), before);
  assert.equal(store.inspect(db => db.prepare('SELECT 1 FROM dragon_land_role_state').get()), undefined);

  store.inspect(db => db.exec(
    "CREATE TRIGGER reject_dragon_land_state BEFORE INSERT ON dragon_land_role_state BEGIN SELECT RAISE(ABORT, 'Injected dragon land storage failure'); END;"
  ));
  const service = createDragonLandActService({ store, codec, tables, dragonLandTables, calendar, now: () => NOW_MS });
  assert.throws(() => service.execute(107701, request), /Injected dragon land storage failure/);
  assert.deepEqual(amounts(), before);
});
