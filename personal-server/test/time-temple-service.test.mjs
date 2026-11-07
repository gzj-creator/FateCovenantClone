import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';
import {
  TIME_TEMPLE_DATA_SCHEMA,
  TIME_TEMPLE_UNREGISTERED_COMMANDS,
  createTimeTempleService,
  unregisteredTimeTempleCommands
} from '../game/time-temple-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;

function moduleData(login, moduleId) {
  const entry = login[2].value.find(value => Number(value[0]) === moduleId);
  assert.ok(entry, `login module ${moduleId} is present`);
  assert.ok(Array.isArray(entry[1].value), `login module ${moduleId} uses the observed list shape`);
  assert.equal(entry[1].value.length, 1, `login module ${moduleId} has one data slot`);
  return Buffer.from(entry[1].value[0].value);
}

async function connectAndLogin(game) {
  const address = await game.listen(0);
  const socket = net.connect(address.port, '127.0.0.1');
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
  send(codec.pack('pb_c2s', {
    type: 909103,
    seq: 1,
    data: codec.pack('login', {
      server_id: 1,
      channel_uid: 'local-user',
      verify_code: 'test-session',
      channel_extra: ''
    })
  }));
  const response = codec.unpack('pb_s2c', await next());
  assert.equal(response.err, undefined);
  const login = await decodeEtf(Buffer.from(response.data, 'base64'));
  return { socket, next, send, login };
}

function moduleState(store, moduleId) {
  return JSON.stringify(new Map(store.state().modules.value).get(moduleId));
}

test('time temple login module and 7801 draw push use the captured schemas', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-time-temple-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session'
  };
  let game = createLocalGame(options);
  let socket;
  t.after(async () => {
    socket?.destroy();
    if (game) await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  // Reproduce an account created before module 159 initialization existed.
  game.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.delete(159);
    model.state.modules.value = [...modules];
  });

  let connection = await connectAndLogin(game);
  socket = connection.socket;
  let bytes = moduleData(connection.login, 159);
  assert.equal(bytes.length, 0);
  assert.deepEqual(codec.unpack('pb_time_temple_data', bytes), {
    bond_data: [],
    runes_data: [],
    god_data: [],
    select_runes: []
  });
  assert.deepEqual(game.timeTemple.snapshot().counts, {
    bonds: 0,
    runes: 0,
    gods: 0,
    selectedRunes: 0
  });

  const draw = { season_id: 7, draw_num: 2, award_phase_num: 3, award_state: Buffer.from([1, 2, 3]) };
  const encoded = game.timeTemple.createDrawPush(draw);
  assert.equal(encoded.type, 7801);
  assert.equal(encoded.schema, 'pb_time_temple_draw');
  game.timeTemple.publishDraw(draw);
  const pushed = codec.unpack('pb_s2c', await connection.next());
  assert.equal(pushed.type, 7801);
  const pushedDraw = codec.unpack('pb_time_temple_draw', Buffer.from(pushed.data, 'base64'));
  assert.equal(Number(pushedDraw.season_id), 7);
  assert.equal(Number(pushedDraw.draw_num), 2);
  assert.equal(Number(pushedDraw.award_phase_num), 3);
  assert.equal(pushedDraw.award_state, 'AQID');
  assert.throws(() => game.timeTemple.publishDraw({ ...draw, season_id: -1 }), error => error.code === 5);
  assert.throws(() => game.timeTemple.publishDraw({ ...draw, award_state: 'not-bytes' }), error => error.code === 5);

  // Reopen the same SQLite database and prove the initialized module survives.
  socket.destroy(); socket = undefined;
  await game.close(); game = undefined;
  game = createLocalGame(options);
  connection = await connectAndLogin(game);
  socket = connection.socket;
  bytes = moduleData(connection.login, 159);
  assert.equal(bytes.length, 0);
  assert.deepEqual(codec.unpack('pb_time_temple_data', bytes).select_runes, []);
});

test('time temple request encoders are declared unregistered with no numeric C2S type', () => {
  const names = [
    'req_time_temple_embryo_up',
    'req_time_temple_bond_up',
    'req_time_temple_runes_collect',
    'req_time_temple_runes_up',
    'req_time_temple_runes_skill_select',
    'req_time_temple_god_up',
    'req_time_temple_season_shop',
    'req_time_temple_draw_award'
  ];
  assert.deepEqual(unregisteredTimeTempleCommands().map(command => command.name), names);
  assert.equal(TIME_TEMPLE_UNREGISTERED_COMMANDS.length, 8);
  assert.equal(Object.isFrozen(TIME_TEMPLE_UNREGISTERED_COMMANDS), true);
  for (const command of TIME_TEMPLE_UNREGISTERED_COMMANDS) {
    assert.equal(command.numericType, null, command.name + ' must not claim a numeric type');
    assert.equal(Object.isFrozen(command), true);
  }
  assert.deepEqual(
    Object.fromEntries(TIME_TEMPLE_UNREGISTERED_COMMANDS.map(command => [command.name, command.encoding])),
    {
      req_time_temple_embryo_up: 'etf',
      req_time_temple_bond_up: 'etf',
      req_time_temple_runes_collect: 'etf',
      req_time_temple_runes_up: 'etf',
      req_time_temple_runes_skill_select: 'protobuf',
      req_time_temple_god_up: 'etf',
      req_time_temple_season_shop: 'etf',
      req_time_temple_draw_award: 'etf'
    }
  );
  assert.deepEqual(
    Object.fromEntries(TIME_TEMPLE_UNREGISTERED_COMMANDS.map(command => [command.name, command.responseSchema])),
    {
      req_time_temple_embryo_up: 'pb_embryo_up_back',
      req_time_temple_bond_up: null,
      req_time_temple_runes_collect: 'pb_runes_collect_back',
      req_time_temple_runes_up: null,
      req_time_temple_runes_skill_select: 'pb_time_temple_select_runes_skills',
      req_time_temple_god_up: null,
      req_time_temple_season_shop: null,
      req_time_temple_draw_award: 'pb_draw_phase_award_back'
    }
  );
  // Copies are detached, so a caller cannot register a numeric type at runtime.
  const copy = unregisteredTimeTempleCommands();
  copy[0].numericType = 7701;
  copy.pop();
  assert.equal(TIME_TEMPLE_UNREGISTERED_COMMANDS[0].numericType, null);
  assert.equal(TIME_TEMPLE_UNREGISTERED_COMMANDS.length, 8);
});

test('time temple stays fail-closed on the real gateway while the 7801 draw push still works', { timeout: 15000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-time-temple-gateway-'));
  const events = [];
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    logger: event => events.push(event)
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const connection = await connectAndLogin(game);
  socket = connection.socket;
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    connection.send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await connection.next());
  };

  assert.equal(moduleData(connection.login, 159).length, 0);
  // No request encoder is registered, so the service exposes no command surface.
  assert.equal(typeof game.timeTemple.supports, 'undefined');
  assert.equal(typeof game.timeTemple.execute, 'undefined');

  const beforeModule = moduleState(game.store, 159);
  const beforeCounts = game.timeTemple.snapshot().counts;
  // 7801 is the S2C draw push; 7701/7702/7709 are guesses that must not be routed.
  for (const [index, type] of [7801, 7701, 7702, 7709].entries()) {
    const response = await request(type, 10 + index, Buffer.alloc(0));
    assert.equal(response.err?.err, -1, 'type ' + type + ' must be rejected');
    assert.equal(response.err?.stacktrace, 'LOCAL_NOT_IMPLEMENTED:' + type);
  }
  assert.equal(moduleState(game.store, 159), beforeModule);
  assert.deepEqual(game.timeTemple.snapshot().counts, beforeCounts);
  const unsupported = events.filter(event => event.event === 'unsupported_command').map(event => event.type);
  assert.deepEqual(unsupported, [7801, 7701, 7702, 7709]);

  // The push half of the same type number keeps working and stays decodeable.
  const draw = { season_id: 3, draw_num: 5, award_phase_num: 1, award_state: Buffer.from([9]) };
  game.timeTemple.publishDraw(draw);
  const pushed = codec.unpack('pb_s2c', await connection.next());
  assert.equal(pushed.type, 7801);
  assert.equal(pushed.err, undefined);
  const pushedDraw = codec.unpack('pb_time_temple_draw', Buffer.from(pushed.data, 'base64'));
  assert.equal(Number(pushedDraw.season_id), 3);
  assert.equal(Number(pushedDraw.draw_num), 5);
  assert.equal(pushedDraw.award_state, 'CQ==');
});

test('time temple login initialization leaves no module behind when the protobuf encoder fails', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-time-temple-pack-' });
  fixture.store.inspect(db => db.prepare('DELETE FROM login_modules WHERE module_id = 159').run());
  assert.equal(new Map(fixture.store.state().modules.value).has(159), false);

  const poisoned = {
    ...codec,
    pack(name, value) {
      if (name === TIME_TEMPLE_DATA_SCHEMA) throw new Error('time temple protobuf pack failure');
      return codec.pack(name, value);
    }
  };
  const service = createTimeTempleService({ store: fixture.store, codec: poisoned, publish: () => {} });
  assert.throws(() => service.ensureLoginState(), /time temple protobuf pack failure/);
  assert.equal(new Map(fixture.store.state().modules.value).has(159), false);

  // The same entry point succeeds once the encoder works, so the failure was the encoder.
  const healthy = createTimeTempleService({ store: fixture.store, codec, publish: () => {} });
  assert.equal(healthy.ensureLoginState().counts.selectedRunes, 0);
  const reopened = fixture.open();
  const modules = new Map(reopened.state().modules.value);
  assert.equal(modules.has(159), true);
  assert.deepEqual(codec.unpack(TIME_TEMPLE_DATA_SCHEMA, Buffer.from(modules.get(159).value[0].value)), {
    bond_data: [],
    runes_data: [],
    god_data: [],
    select_runes: []
  });
});

test('time temple login initialization rolls back the whole save when SQLite aborts the module write', async t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-time-temple-sqlite-' });
  const probeTid = '424242';
  // The probe rides inside the same transaction so a rollback is observable.
  const storeWithProbe = {
    ...fixture.store,
    transaction(action) {
      return fixture.store.transaction(model => {
        model.resources.set(probeTid, { tid: probeTid, num: '7', location: [999, 0, 0] });
        return action(model);
      });
    }
  };
  const service = createTimeTempleService({ store: storeWithProbe, codec, publish: () => {} });

  service.ensureLoginState();
  assert.equal(fixture.store.read().resources.has(probeTid), true);
  fixture.store.inspect(db => db.prepare('DELETE FROM resources WHERE tid = ?').run(probeTid));
  const rowsBefore = fixture.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM login_modules').get().n);

  fixture.store.inspect(db => db.exec(
    "CREATE TRIGGER fc_fail_time_temple BEFORE INSERT ON login_modules WHEN NEW.module_id = 159 " +
    "BEGIN SELECT RAISE(ABORT,'time temple write failure'); END"
  ));
  assert.throws(() => service.ensureLoginState(), /time temple write failure/);

  assert.equal(fixture.store.read().resources.has(probeTid), false);
  assert.equal(fixture.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM login_modules').get().n), rowsBefore);
  fixture.store.inspect(db => db.exec('DROP TRIGGER fc_fail_time_temple'));
  assert.equal(new Map(fixture.open().state().modules.value).has(159), true);
});
