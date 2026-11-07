import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import { createRelicService } from '../game/relic-service.mjs';
import { readRelicTables } from '../config/relic-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const NOW = Date.parse('2026-11-08T08:00:00.000Z');
const HERO = 2010201;

function moduleBytes(login, moduleId) {
  const entry = login[2].value.find(value => Number(value[0]) === moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  const module = entry[1];
  if (Buffer.isBuffer(module)) return module;
  if (Array.isArray(module)) return Buffer.from(Buffer.isBuffer(module[0]) ? module[0] : module[0].value);
  return Buffer.from(module.value[0].value);
}

test('gateway routes 89709 and 89705 through the relic service', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-relic-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => NOW,
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const seedService = createRelicService({
    store: game.store, codec, tables: readRelicTables(), resourceTables: readGameTables(), now: () => NOW
  });
  const created = seedService.addRelics([{ tid: 2001109 }, { tid: 2001209 }, { tid: 2001309 }, { tid: 3001109 }]);
  assert.equal(created.length, 4);
  game.store.transaction(model => {
    let index = 0;
    for (const tid of [813002, 379002]) {
      const key = String(tid);
      const existing = model.resources.get(key);
      if (existing) existing.num = String(BigInt(existing.num) + 1000n);
      else model.resources.set(key, { tid: key, num: '1000', location: [5, null, index++] });
    }
  });

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
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    parsed.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  const login = () => request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: ''
  }));

  let response = await login();
  assert.equal(response.err, undefined);

  response = await request(89709, 2, codec.pack('pb_relic_wear_req', {
    wear_list: [{ hero_tid: HERO, relics: [1, 2] }]
  }));
  assert.equal(response.err, undefined);
  const worn = codec.unpack('pb_relic_wear_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(Number(worn.hero_list[0].tid), HERO);
  assert.deepEqual(worn.hero_list[0].relic.map(Number), [1, 2]);

  response = await request(89705, 3, codec.pack('pb_req_resolve_relic', { relic_uid_list: [3] }));
  assert.equal(response.err, undefined);
  const resolved = codec.unpack('pb_res_to_client', Buffer.from(response.data, 'base64'));
  assert.equal(Number(resolved.changes[0].diff_num), 10);

  response = await login();
  const modules = await decodeEtf(Buffer.from(response.data, 'base64'));
  const heroInfo = codec.unpack('pb_hero_info', moduleBytes(modules, 10));
  assert.deepEqual(heroInfo.hero_list.find(hero => Number(hero.tid) === HERO).relic.map(Number), [1, 2]);

  response = await request(89701, 4, await encodeEtf(4));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_op_relic', Buffer.from(response.data, 'base64')).relic.star, 1);

  response = await request(89702, 5, codec.pack('pb_req_recast_relic', { relic_uid: 4, index: 0 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_op_relic', Buffer.from(response.data, 'base64')).relic.recast_skills.length, 3);

  response = await request(89704, 6, codec.pack('pb_req_recast_relic', { relic_uid: 4, index: 0 }));
  assert.equal(response.err, undefined);
  assert.equal(codec.unpack('pb_res_op_relic', Buffer.from(response.data, 'base64')).relic.cur_skills.length, 3);

  response = await request(89706, 7, codec.pack('pb_req_recast_relic', { relic_uid: 4, index: 0 }));
  assert.ok(response.err, 'cancelling a saved recast has no pending result');

  const unsupported = new Set([89701, 89702, 89704, 89705, 89706, 89709]);
  assert.equal(events.some(event => event.event === 'unsupported_command' && unsupported.has(event.type)), false);
  assert.deepEqual(events.filter(event => event.event === 'relic_committed').map(event => event.type), [89709, 89705, 89701, 89702, 89704]);
  assert.deepEqual(events.filter(event => event.event === 'relic_rejected').map(event => event.type), [89706]);
});
