import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createGuideService, awardTidOf } from '../game/guide-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const PROCESS_ID = 900;
const KEY_ID = 11;
const AWARD_TID = 7;

// Reward rows are injected here: GuideTable.Award has no exported rows yet, so
// the production config carries none and the service rejects unknown awards.
const AWARDS = new Map([[AWARD_TID, { awardTid: AWARD_TID, processId: PROCESS_ID, keyId: KEY_ID, items: [[101500, 20]] }]]);

function saveStep(store, processId = PROCESS_ID, keyId = KEY_ID) {
  store.transaction(model => { model.state.guides[String(keyId)] = processId; });
}

function claimRows(store) {
  return store.inspect(db => db.prepare("SELECT claim_key FROM reward_claims WHERE claim_type='guide_award'").all().map(row => row.claim_key));
}

function diamonds(store) {
  return BigInt(store.read().resources.get('101500')?.num ?? 0);
}

function setup(t, awards = AWARDS) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guide-' });
  let service = createGuideService({ store: fixture.store, codec, tables, awards, now: () => 1700000000000 });
  return {
    get store() { return fixture.store; },
    get service() { return service; },
    reopen() {
      const store = fixture.open();
      service = createGuideService({ store, codec, tables, awards, now: () => 1700000000000 });
      return { store, service };
    }
  };
}

test('8001 grants a configured guide award once and encodes pb_res_to_client', async t => {
  const { store, service } = setup(t);
  saveStep(store);
  const before = diamonds(store);

  const result = await service.execute(8001, AWARD_TID);
  assert.equal(result.value.awardTid, AWARD_TID);
  assert.equal(result.value.keyId, KEY_ID);
  const res = codec.unpack('pb_res_to_client', result.data);
  const change = res.changes.find(row => row.tid === '101500');
  assert.equal(change.diff_num, '20');
  assert.equal(diamonds(store), before + 20n);
  assert.deepEqual(claimRows(store), [`${PROCESS_ID}:${KEY_ID}:${AWARD_TID}`]);

  await assert.rejects(() => service.execute(8001, AWARD_TID), /already claimed/);
  assert.equal(diamonds(store), before + 20n);
});

test('8001 decodes the ETF argument shapes GuideCmd can send', async t => {
  const { store, service } = setup(t);
  saveStep(store);
  const fromScalar = await service.execute(8001, await decodeEtf(await encodeEtf(AWARD_TID)));
  assert.equal(fromScalar.value.awardTid, AWARD_TID);
  assert.equal(awardTidOf({ award_tid: 5 }), 5);
  assert.equal(awardTidOf([{ process: [] }, 5, Buffer.alloc(0)]), 5);
  assert.equal(awardTidOf('5'), 5);
  assert.equal(awardTidOf(null), null);
});

test('8001 rejects a step the guide has not saved yet', async t => {
  const { store, service } = setup(t);
  const before = diamonds(store);
  await assert.rejects(() => service.execute(8001, AWARD_TID), /not completed/);
  saveStep(store, PROCESS_ID, KEY_ID + 1);
  await assert.rejects(() => service.execute(8001, AWARD_TID), /not completed/);
  assert.equal(diamonds(store), before);
  assert.deepEqual(claimRows(store), []);
});

test('8001 rejects unknown and malformed award ids without touching state', async t => {
  const { store, service } = setup(t);
  saveStep(store);
  const before = store.read();
  await assert.rejects(() => service.execute(8001, 999999), /not configured/);
  await assert.rejects(() => service.execute(8001, 'abc'), /Invalid/);
  await assert.rejects(() => service.execute(8001, 0), /Invalid/);
  await assert.rejects(() => service.execute(8001, undefined), /Invalid/);
  assert.deepEqual(store.read().resources, before.resources);
  assert.deepEqual(claimRows(store), []);
});

test('8001 rolls back the grant when the response cannot be encoded', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guide-codec-' });
  const brokenCodec = { ...codec, pack: (name, value) => { if (name === 'pb_res_to_client') throw new Error('encode failed'); return codec.pack(name, value); } };
  const service = createGuideService({ store: fixture.store, codec: brokenCodec, tables, awards: AWARDS });
  saveStep(fixture.store);
  const before = diamonds(fixture.store);
  await assert.rejects(() => service.execute(8001, AWARD_TID), /encode failed/);
  assert.equal(diamonds(fixture.store), before);
  assert.deepEqual(claimRows(fixture.store), []);
});

test('8001 rolls back when the claim insert fails in SQLite', async t => {
  const { store, service } = setup(t);
  saveStep(store);
  store.inspect(db => db.exec("CREATE TRIGGER guide_claim_block BEFORE INSERT ON reward_claims WHEN NEW.claim_type='guide_award' BEGIN SELECT RAISE(ABORT,'claim blocked'); END;"));
  const before = diamonds(store);
  await assert.rejects(() => service.execute(8001, AWARD_TID), /claim blocked/);
  assert.equal(diamonds(store), before);
  assert.deepEqual(claimRows(store), []);
});

test('a reopened database still rejects the claim and keeps the grant', async t => {
  const { store, service, reopen } = setup(t);
  saveStep(store);
  const before = diamonds(store);
  await service.execute(8001, AWARD_TID);
  const { store: reopenedStore, service: reopened } = reopen();
  assert.equal(diamonds(reopenedStore), before + 20n);
  await assert.rejects(() => reopened.execute(8001, AWARD_TID), /already claimed/);
  assert.equal(diamonds(reopenedStore), before + 20n);
});

test('8002 probes the guide network without a response body or state change', async t => {
  const { store, service } = setup(t);
  const before = JSON.stringify(store.read().state.guides);
  assert.equal(service.checkNet({ module: PROCESS_ID }), null);
  assert.equal(await service.execute(8002, await decodeEtf(await encodeEtf(PROCESS_ID))), null);
  assert.equal(JSON.stringify(store.read().state.guides), before);
  assert.equal(service.supports(8001), true);
  assert.equal(service.supports(8002), true);
  assert.equal(service.supports(8000), false);
});

const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const GAME_NOW = (SERVER_OPENED_AT + 3600) * 1000;

test('gateway saves guide progress then awards, probes the network and rejects a repeat over TCP', { timeout: 20000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-guide-tcp-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => GAME_NOW,
    random: () => 0.5,
    guideAwards: AWARDS
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

  const saved = await request(8000, 2, codec.pack('pb_req_save_process', { req_list: [{ process_id: PROCESS_ID, key_id: KEY_ID }] }));
  assert.equal(saved.seq, 2);
  assert.equal(saved.err, undefined);
  const savedBack = codec.unpack('pb_req_save_process_back', Buffer.from(saved.data, 'base64'));
  assert.deepEqual(savedBack.process_list.map(row => [row.process_id, row.key_id]), [[PROCESS_ID, KEY_ID]]);

  const before = BigInt(game.store.read().resources.get('101500')?.num ?? 0);
  const awarded = await request(8001, 3, Buffer.from(await encodeEtf(AWARD_TID)));
  assert.equal(awarded.seq, 3);
  assert.equal(awarded.err, undefined);
  const awardRes = codec.unpack('pb_res_to_client', Buffer.from(awarded.data, 'base64'));
  assert.equal(awardRes.changes.find(row => row.tid === '101500').diff_num, '20');
  assert.equal(BigInt(game.store.read().resources.get('101500').num), before + 20n);

  // 8002 answers nothing: the next frame the socket sees must be the reply to seq 5.
  send(codec.pack('pb_c2s', { type: 8002, seq: 4, data: Buffer.from(await encodeEtf(PROCESS_ID)) }));
  const duplicate = await request(8001, 5, Buffer.from(await encodeEtf(AWARD_TID)));
  assert.equal(duplicate.seq, 5);
  assert.equal(duplicate.err?.err, 310);
  assert.equal(BigInt(game.store.read().resources.get('101500').num), before + 20n);
});
