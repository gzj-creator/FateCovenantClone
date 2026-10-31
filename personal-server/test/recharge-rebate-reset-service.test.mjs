import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, rawBinary, encodeEtf, decodeEtf } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLocalGame } from '../game/gateway.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { localAesBeforeFinal, HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE } from '../game-handshake.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createActivityCalendar } from '../game/activity-calendar.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { createRechargeRebateResetService } from '../game/recharge-rebate-reset-service.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));
const OPENED_AT = Date.parse('2026-10-30T21:00:00Z') / 1000;

function setup(t, mode = 'all-open') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-recharge-rebate-'));
  const databasePath = path.join(directory, 'game.sqlite');
  let now = Date.parse('2026-10-31T00:00:00Z');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: OPENED_AT,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Rebate Reset Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT });
  let service;
  const make = () => {
    const calendar = createActivityCalendar({
      tables, serverOpenedAt: OPENED_AT, mode,
      currentFishingActivityId: 1074011,
      now: () => now
    });
    service = createRechargeRebateResetService({ store, codec, tables, calendar, now: () => now });
  };
  make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    get store() { return store; }, get service() { return service; },
    setNow(value) { now = value; },
    reopen() { store.close(); store = createGameStore({ databasePath, seed, codec, serverOpenedAt: OPENED_AT }); make(); }
  };
}

test('rebate reset claims the requested slot, unlocks at 05:00 and survives SQLite reopen', t => {
  const e = setup(t);
  let response = codec.unpack('pb_recharge_rebate_reset_back', e.service.execute(100201, [118003, 0]).data);
  assert.equal(response.act_info.act_id, '118003');
  assert.equal(hasBit(Buffer.from(response.act_info.award_bin, 'base64'), 0), true);
  assert.equal(hasBit(Buffer.from(response.act_info.award_bin, 'base64'), 1), false);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '10');
  assert.throws(() => e.service.execute(100201, [118003, 0]), error => error.code === 310);
  assert.throws(() => e.service.execute(100201, [118003, 1]), error => error.code === 311);
  assert.throws(() => e.service.execute(100201, [118003, 4]), error => error.code === 1);
  e.setNow(Date.parse('2026-10-31T21:00:00Z'));
  response = codec.unpack('pb_recharge_rebate_reset_back', e.service.execute(100201, [118003, 1]).data);
  assert.equal(hasBit(Buffer.from(response.act_info.award_bin, 'base64'), 1), true);
  assert.equal(response.res.changes.find(row => row.tid === '101500').diff_num, '10');

  const activity = codec.unpack('pb_act_login', rawBinary(new Map(e.store.state().modules.value).get(92)));
  const stateIds = activity.act_list.map(entry => Number(entry.state_data.act_id)).filter(id => [118001, 118002, 118003].includes(id));
  assert.deepEqual(stateIds, [118003]);

  e.reopen();
  assert.throws(() => e.service.execute(100201, [118003, 1]), error => error.code === 310);
});

test('scheduled rebate reset follows the seven-day server window and rejects claims after it closes', t => {
  const e = setup(t, 'schedule');
  const response = codec.unpack('pb_recharge_rebate_reset_back', e.service.execute(100201, [118003, 0]).data);
  assert.equal(response.act_info.act_id, '118003');
  e.setNow(Date.parse('2026-11-08T00:00:00Z'));
  assert.throws(() => e.service.execute(100201, [118003, 1]), error => error.code === 309);
});

test('rebate claim insertion failure rolls back reward and activity state', t => {
  const e = setup(t);
  const beforeActivity = rawBinary(new Map(e.store.state().modules.value).get(92)).toString('base64');
  const beforeDiamonds = e.store.read().resources.get('101500')?.num ?? '0';
  e.store.inspect(db => db.exec("CREATE TRIGGER fail_rebate_claim BEFORE INSERT ON reward_claims BEGIN SELECT RAISE(ABORT, 'rebate rollback'); END"));
  assert.throws(() => e.service.execute(100201, [118003, 0]), /rebate rollback/);
  assert.equal(rawBinary(new Map(e.store.state().modules.value).get(92)).toString('base64'), beforeActivity);
  assert.equal(e.store.read().resources.get('101500')?.num ?? '0', beforeDiamonds);
  assert.equal(e.store.inspect(db => db.prepare("SELECT count(*) n FROM reward_claims WHERE claim_type='recharge_rebate_reset'").get().n), 0);
});

test('real gateway accepts the client ETF activity and slot tuple', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-rebate-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'), statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url),
    localWallet: true, serverOpenedAt: OPENED_AT, activityMode: 'all-open',
    now: () => Date.parse('2026-10-31T00:00:00Z'),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  });
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
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  assert.equal((await decodeEtf(Buffer.from(login.data, 'base64')))[0], 1);
  const response = await request(100201, 2, await encodeEtf([118003, 0]));
  assert.equal(response.err, undefined);
  const result = codec.unpack('pb_recharge_rebate_reset_back', Buffer.from(response.data, 'base64'));
  assert.equal(result.res.changes.find(row => row.tid === '101500').diff_num, '10');
  assert.equal(hasBit(Buffer.from(result.act_info.award_bin, 'base64'), 0), true);
  const duplicate = await request(100201, 3, await encodeEtf([118003, 0]));
  assert.equal(duplicate.err?.err, 310);
});
