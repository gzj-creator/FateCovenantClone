import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createLineupService } from '../game/lineup-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const capture = JSON.parse(fs.readFileSync(capturePath));
function fixture() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return { version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000, modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'), guides: {}, lineups: null };
}
function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-lineup-test-'));
  const databasePath = path.join(directory, 'game.sqlite'), legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { directory, databasePath, legacyStatePath, get store() { return store; },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); } };
}
const rejected = (action, code) => assert.throws(action, error => error.code === code);
const serviceFor = store => createLineupService({ store, codec });

function currentLineup(store) {
  const preset = store.read().lineups.pre_lineups[0];
  return { type: 1, team_list: [structuredClone(preset.lineup)], custom_attr: [] };
}
function loginCustom(store) {
  const login = codec.unpack('pb_lineup_login', rawBinary(new Map(store.state().modules.value).get(9)));
  assert.ok(login.custom_pre_lineup, 'login module 9 must carry the custom preset list');
  return codec.unpack('pb_custom_lineup_role', Buffer.from(login.custom_pre_lineup, 'base64'));
}

test('custom presets can be created, renamed, saved, switched and deleted across reopen', t => {
  const env = setup(t), service = serviceFor(env.store);
  const lineup = currentLineup(env.store);

  let reply = codec.unpack('pb_custom_pre_lineup_list', service.execute(214, {
    custom_pre_lineups: [{ index: '0', name: 'Solo', lineup, type: '1', lineup_type_list: ['76'] }]
  }).data);
  assert.deepEqual(reply.custom_pre_lineups.map(entry => String(entry.index ?? 0)), ['-1', '0']);
  assert.equal(reply.custom_pre_lineups[1].name, 'Solo');
  assert.equal(reply.custom_pre_lineups[1].type, '1');
  assert.deepEqual(reply.custom_pre_lineups[1].lineup_type_list.map(Number), [76]);
  let stored = env.store.read();
  assert.equal(stored.lineups.custom_pre_lineups.length, 1);
  assert.equal(stored.playLineups.find(lineup => Number(lineup.type) === 76).custom_lineup_index, 0);
  assert.deepEqual(stored.playLineups.find(lineup => Number(lineup.type) === 76).team_list, [stored.lineups.pre_lineups[0].lineup]);
  assert.deepEqual(loginCustom(env.store).custom_pre_lineups.map(entry => String(entry.index ?? 0)), ['-1', '0']);

  reply = codec.unpack('pb_custom_pre_lineup', service.execute(215, { index: '0', name: 'Renamed' }).data);
  assert.equal(String(reply.index ?? 0), '0');
  assert.equal(reply.name, 'Renamed');

  const edited = currentLineup(env.store);
  edited.team_list[0].fighter_list[0].loc = 1;
  reply = codec.unpack('pb_custom_pre_lineup', service.execute(216, { index: '0', lineup: edited }).data);
  assert.equal(reply.lineup.team_list[0].fighter_list[0].loc, 1);
  stored = env.store.read();
  assert.equal(stored.playLineups.find(lineup => Number(lineup.type) === 76).team_list[0].fighter_list[0].loc, 1);

  reply = codec.unpack('pb_set_pre_lineup_index_rsp', service.execute(210, 1).data);
  assert.deepEqual(reply.copy_lineup.map(lineup => Number(lineup.type)).sort((a, b) => a - b), [1, 76, 77]);
  assert.equal(Number(env.store.read().lineups.cur_pre_index), 1);

  const deletion = service.execute(217, 0);
  assert.equal(etfInteger(deletion.data), 0);
  stored = env.store.read();
  assert.deepEqual(stored.lineups.custom_pre_lineups, []);
  assert.equal(stored.playLineups.find(lineup => Number(lineup.type) === 76).custom_lineup_index, 0);

  service.execute(214, { custom_pre_lineups: [{ name: 'Survivor', lineup: currentLineup(env.store), lineup_type_list: [] }] });
  env.reopen();
  const reopened = env.store.read();
  assert.deepEqual(reopened.lineups.custom_pre_lineups.map(entry => Number(entry.index)), [0]);
  const custom = loginCustom(env.store);
  assert.deepEqual(custom.custom_pre_lineups.map(entry => String(entry.index ?? 0)), ['-1', '0']);
  assert.equal(custom.custom_pre_lineups[1].name, 'Survivor');
  assert.equal(custom.cur_index, undefined);
});

function etfInteger(data) {
  // encodeEtfInteger writes a synchronous ETF integer term.
  const bytes = Buffer.from(data);
  assert.equal(bytes[0], 131);
  return bytes[bytes.length - 1];
}

test('custom preset writes reject invalid indexes, duplicate names, foreign heroes and unusable types', t => {
  const env = setup(t), service = serviceFor(env.store);
  const lineup = currentLineup(env.store);
  service.execute(214, { custom_pre_lineups: [{ index: '0', name: 'Alpha', lineup, type: '1', lineup_type_list: [] }] });
  service.execute(214, { custom_pre_lineups: [{ index: '1', name: 'Beta', lineup, type: '1', lineup_type_list: [] }] });
  const before = env.store.state();

  rejected(() => service.execute(215, { index: '9', name: 'Missing' }), 51553);
  rejected(() => service.execute(215, { index: '0', name: 'Beta' }), 51560);
  rejected(() => service.execute(215, { index: '-1', name: 'Main' }), 51553);
  rejected(() => service.execute(216, { index: '0', lineup: { type: 1, team_list: [] } }), 51558);
  const foreign = structuredClone(lineup);
  foreign.team_list[0].fighter_list[0].hero_id = '999999';
  rejected(() => service.execute(216, { index: '0', lineup: foreign }), 3001);
  rejected(() => service.execute(216, { index: '5', lineup }), 51553);
  rejected(() => service.execute(214, { custom_pre_lineups: [{ name: 'Gamma', lineup_type_list: ['48'] }] }), 51552);
  rejected(() => service.execute(210, 5), 51553);
  rejected(() => service.execute(210, 'one'), 1);
  rejected(() => service.execute(217, 9), 51553);
  assert.deepEqual(env.store.state(), before);
});

test('custom presets honour the twenty entry limit from LineupTable.TemplateConst', t => {
  const env = setup(t), service = serviceFor(env.store);
  const lineup = currentLineup(env.store);
  const proposals = Array.from({ length: 19 }, (_, index) => ({ name: 'Preset ' + index, lineup, lineup_type_list: [] }));
  const reply = codec.unpack('pb_custom_pre_lineup_list', service.execute(214, { custom_pre_lineups: proposals }).data);
  assert.equal(reply.custom_pre_lineups.length, 20);
  const before = env.store.state();
  rejected(() => service.execute(214, { custom_pre_lineups: [{ name: 'Overflow', lineup, lineup_type_list: [] }] }), 51559);
  assert.deepEqual(env.store.state(), before);
});

test('response encoding failures roll the custom preset transaction back', t => {
  const env = setup(t);
  const failing = { ...codec, pack(name, value) {
    if (name === 'pb_custom_pre_lineup_list' || name === 'pb_custom_pre_lineup') throw new Error('Injected encoding failure');
    return codec.pack(name, value);
  } };
  const service = createLineupService({ store: env.store, codec: failing });
  const before = env.store.state();
  const lineup = currentLineup(env.store);
  assert.throws(() => service.execute(214, { custom_pre_lineups: [{ name: 'Broken', lineup, lineup_type_list: [] }] }), /Injected encoding failure/);
  assert.deepEqual(env.store.state(), before);
  const healthy = serviceFor(env.store);
  healthy.execute(214, { custom_pre_lineups: [{ index: '0', name: 'Kept', lineup, lineup_type_list: [] }] });
  const seeded = env.store.state();
  assert.throws(() => service.execute(215, { index: '0', name: 'Broken' }), /Injected encoding failure/);
  assert.deepEqual(env.store.state(), seeded);
});

test('temporary TCP gateway routes 210, 214, 215, 216 and 217 with the existing 209 path', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-lineup-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    activityMode: 'all-open',
    verifySession: (uid, code) => uid === 'lineup-user' && code === 'lineup-session',
    now: () => 1700000000000
  });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const frame of decoder.push(chunk)) { if (waiters.length) waiters.shift()(frame); else queue.push(frame); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(frame => { clearTimeout(timer); resolve(frame); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const login = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'lineup-user', verify_code: 'lineup-session', channel_extra: '' }));
  assert.equal(login.err, undefined);
  const loginPayload = await decodeEtf(Buffer.from(login.data, 'base64'));
  const loginModule = new Map(loginPayload[2].value).get(9);
  const loginLineup = codec.unpack('pb_lineup_login', Buffer.from(loginModule.value));
  const custom = codec.unpack('pb_custom_lineup_role', Buffer.from(loginLineup.custom_pre_lineup, 'base64'));
  assert.deepEqual(custom.custom_pre_lineups.map(entry => String(entry.index)), ['-1']);

  const lineup = currentLineup(game.store);
  let response = await request(214, 2, codec.pack('pb_custom_pre_lineup_list', {
    custom_pre_lineups: [{ index: '0', name: 'Tcp', lineup, type: '1', lineup_type_list: [] }]
  }));
  assert.equal(response.err, undefined);
  let value = codec.unpack('pb_custom_pre_lineup_list', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.custom_pre_lineups.map(entry => String(entry.index ?? 0)), ['-1', '0']);

  response = await request(215, 3, codec.pack('pb_custom_lineup_set_name_req', { index: '0', name: 'Tcp Renamed' }));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_custom_pre_lineup', Buffer.from(response.data, 'base64'));
  assert.equal(value.name, 'Tcp Renamed');

  const edited = currentLineup(game.store);
  edited.team_list[0].fighter_list[0].loc = 3;
  response = await request(216, 4, codec.pack('pb_custom_lineup_set_req', { index: '0', lineup: edited }));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_custom_pre_lineup', Buffer.from(response.data, 'base64'));
  assert.equal(value.lineup.team_list[0].fighter_list[0].loc, 3);

  const preset = structuredClone(game.store.read().lineups.pre_lineups[0]);
  preset.lineup.fighter_list[0].loc = 3;
  response = await request(209, 5, codec.pack('pb_edit_pre_lineup_req', { pre_lineup_list: [preset], handle_types: ['0'] }));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_edit_pre_lineup_rsp', Buffer.from(response.data, 'base64'));
  assert.equal(value.custom_pre_lineup_list.custom_pre_lineups[0].lineup.team_list[0].fighter_list[0].loc, 3);

  response = await request(210, 6, await encodeEtf(1));
  assert.equal(response.err, undefined);
  value = codec.unpack('pb_set_pre_lineup_index_rsp', Buffer.from(response.data, 'base64'));
  assert.deepEqual(value.copy_lineup.map(lineup => Number(lineup.type)).sort((a, b) => a - b), [1, 76, 77]);

  response = await request(217, 7, await encodeEtf(0));
  assert.equal(response.err, undefined);
  assert.equal(await decodeEtf(Buffer.from(response.data, 'base64')), 0);

  response = await request(217, 8, await encodeEtf(0));
  assert.equal(response.err.err, 51553);

  const stored = game.store.read();
  assert.deepEqual(stored.lineups.custom_pre_lineups, []);
  const reopened = codec.unpack('pb_custom_lineup_role', Buffer.from(codec.unpack('pb_lineup_login',
    Buffer.from(game.store.state().lineups, 'base64')).custom_pre_lineup, 'base64'));
  assert.deepEqual(reopened.custom_pre_lineups.map(entry => String(entry.index)), ['-1']);
});

