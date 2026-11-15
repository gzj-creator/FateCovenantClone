import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  readTriMatchTables, firstHeroLevelTid, firstEquipLevelTid, heroStarCost
} from '../config/trimatch-tables.mjs';
import { createTriMatchService, TRI_MATCH_LOGIN_MODULES } from '../game/trimatch-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const triTables = readTriMatchTables();
const FIXED_NOW = 1700000000123;
const HERO_TIDS = [...triTables.heroes.keys()].slice(0, 4);
const HERO_CHIPS = [10014700, 10024700, 10034700, 10044700];
const LEVEL_MATERIAL = 835202;
const STAR_MATERIAL = 835402;
const EQUIP_MATERIAL = 835602;

const RESPONSE_SCHEMAS = Object.freeze({
  112001: 'pb_battle_tri_match_hero_up_lv_rsp',
  112002: 'pb_battle_tri_match_hero_up_star_rsp',
  113001: 'pb_battle_tri_match_equip_up_rsp',
  113002: 'pb_battle_tri_match_equip_swap_rsp',
  113003: 'pb_battle_tri_match_equip_multiple_up_rsp',
  114001: 'pb_battle_tri_match_lineup_add_rsp',
  114002: 'pb_battle_tri_match_lineup_edit_rsp',
  114003: 'pb_battle_tri_match_lineup_set_name_rsp',
  114004: 'pb_battle_tri_match_lineup_delete_rsp',
  114005: 'pb_battle_tri_match_edit_playing_lineup_rsp'
});

function setup(t, { levelMaterial = 1000 } = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-trimatch-', now: () => FIXED_NOW });
  let service = createTriMatchService({
    store: fixture.store, codec, tables: triTables, gameTables, now: () => FIXED_NOW
  });
  const grant = awards => fixture.store.transaction((model, db) => grantResources(
    model, awards, gameTables, { codec, db, now: () => FIXED_NOW }
  ));
  grant([
    ...HERO_TIDS.map(tid => [tid, 1]),
    [LEVEL_MATERIAL, levelMaterial],
    [STAR_MATERIAL, 1000],
    [EQUIP_MATERIAL, 1000],
    ...HERO_CHIPS.map(tid => [tid, 1000])
  ]);
  return {
    fixture,
    grant,
    get store() { return fixture.store; },
    execute(type, value) { return service.execute(type, value); },
    login() { return service.loginPayload(fixture.store.state().roleId); },
    snapshot() { return service.snapshot(fixture.store.state().roleId); },
    reopen() {
      fixture.open();
      service = createTriMatchService({
        store: fixture.store, codec, tables: triTables, gameTables, now: () => FIXED_NOW
      });
      return service;
    }
  };
}

function unpackResponse(type, result) {
  return codec.unpack(RESPONSE_SCHEMAS[type], result.data);
}

function resources(store, tid) {
  return Number(store.read().resources.get(String(tid))?.num ?? 0);
}

function heroLevelCost(levelTid, times) {
  let current = Number(levelTid), total = 0;
  for (let index = 0; index < times; index += 1) {
    const next = triTables.heroLevels.get(current + 1);
    assert.ok(next, 'fixture requires a consecutive next hero level');
    total += (next.cost_item ?? []).reduce((sum, pair) => sum + Number(pair[1]), 0);
    current = Number(next.tid);
  }
  return total;
}

function teamOf(heroTids = HERO_TIDS, teamId = 1) {
  return {
    team_id: teamId,
    sites: heroTids.map((heroTid, index) => ({ site_index: index + 1, hero_tid: heroTid }))
  };
}

function equipMap(response) {
  return new Map(response.change_equips.map(site => [
    Number(site.site_idx), new Map(site.equips.map(row => [Number(row.equip_type_tid), Number(row.level_tid)]))
  ]));
}

test('112001 accumulates every UpLevel cost, rejects the exact shortfall atomically, and 112002 uses UpStar cost', async t => {
  const firstLevel = firstHeroLevelTid(triTables);
  const twoLevelCost = heroLevelCost(firstLevel, 2);
  const env = setup(t, { levelMaterial: twoLevelCost - 1 });

  await assert.rejects(
    () => env.execute(112001, { site_idx: 1, up_lv_times: 2 }),
    error => error instanceof GameError && error.code === 301
  );
  assert.equal(resources(env.store, LEVEL_MATERIAL), twoLevelCost - 1);

  env.grant([[LEVEL_MATERIAL, 1]]);
  const levelled = await env.execute(112001, { site_idx: 1, up_lv_times: 2 });
  assert.deepEqual(levelled.value, { siteIdx: 1, level: 3, steps: 2 });
  assert.equal(resources(env.store, LEVEL_MATERIAL), 0);
  const levelResponse = unpackResponse(112001, levelled);
  assert.equal(Number(levelResponse.change_site_data.index), 1);
  assert.equal(Number(levelResponse.change_site_data.level_tid), firstLevel + 2);
  assert.equal(Number(levelResponse.res.changes[0].tid), LEVEL_MATERIAL);
  assert.equal(levelResponse.res.changes[0].diff_num, String(-twoLevelCost));

  const starRow = triTables.heroStarByHero.get(HERO_TIDS[0]).find(row => Number(row.star) === 1);
  const starCosts = heroStarCost(starRow);
  const starred = await env.execute(112002, { hero_tid: HERO_TIDS[0] });
  assert.deepEqual(starred.value, { heroTid: HERO_TIDS[0], star: 1 });
  const starResponse = unpackResponse(112002, starred);
  assert.equal(Number(starResponse.change_hero_data.tid), HERO_TIDS[0]);
  assert.equal(Number(starResponse.change_hero_data.star), 1);
  for (const [tid, amount] of starCosts) {
    assert.equal(resources(env.store, tid), 1000 - amount);
    assert.equal(starResponse.res.changes.find(change => Number(change.tid) === tid).diff_num, String(-amount));
  }
  assert.equal(env.snapshot().stars.find(([tid]) => tid === HERO_TIDS[0])?.[1], 1);
});

test('113001-113003 use configured equipment rows for single, one-key, swap and repeated upgrades', async t => {
  const env = setup(t);
  env.login();
  const types = [...triTables.equipTypes.keys()];
  const initial = new Map(types.map(type => [type, firstEquipLevelTid(triTables, type)]));

  const single = await env.execute(113001, { site_idx: 1, equip_type_id: types[0], is_one_key: false });
  assert.equal(single.value.changed.length, 1);
  assert.equal(equipMap(unpackResponse(113001, single)).get(1).get(types[0]), initial.get(types[0]) + 1);
  assert.equal(resources(env.store, EQUIP_MATERIAL), 1000 - Number(triTables.equipLevels.get(initial.get(types[0]) + 1).cost_item[0][1]));

  const oneKey = await env.execute(113001, { site_idx: 2, equip_type_id: 0, is_one_key: true });
  assert.equal(oneKey.value.changed.length, types.length);
  const afterOneKey = equipMap(unpackResponse(113001, oneKey)).get(2);
  for (const type of types) assert.equal(afterOneKey.get(type), initial.get(type) + 1);

  const wholeSwap = await env.execute(113002, {
    site_idx1: 1, equip_type_id1: 0, site_idx2: 2, equip_type_id2: 0
  });
  const whole = equipMap(unpackResponse(113002, wholeSwap));
  assert.equal(whole.get(1).get(types[0]), initial.get(types[0]) + 1);
  assert.equal(whole.get(2).get(types[0]), initial.get(types[0]) + 1);
  for (const type of types.slice(1)) assert.equal(whole.get(1).get(type), initial.get(type) + 1);

  const typedSwap = await env.execute(113002, {
    site_idx1: 1, equip_type_id1: types[1], site_idx2: 3, equip_type_id2: types[0]
  });
  const typed = equipMap(unpackResponse(113002, typedSwap));
  assert.equal(typed.get(1).get(types[1]), initial.get(types[0]));
  assert.equal(typed.get(3).get(types[0]), initial.get(types[1]) + 1);

  const repeated = await env.execute(113003, { site_idx: 4, times: 2 });
  const repeatedEquips = equipMap(unpackResponse(113003, repeated)).get(4);
  for (const type of types) assert.equal(repeatedEquips.get(type), initial.get(type) + 2);
  const expectedCost = types.reduce((sum, type) => sum + Number(triTables.equipLevels.get(initial.get(type) + 1).cost_item[0][1])
    + Number(triTables.equipLevels.get(initial.get(type) + 2).cost_item[0][1]), 0);
  assert.equal(resources(env.store, EQUIP_MATERIAL), 1000 - Number(triTables.equipLevels.get(initial.get(types[0]) + 1).cost_item[0][1]) - 40 - expectedCost);

  env.store.inspect(db => {
    for (const type of types) {
      const lastTid = triTables.equipLevelsByType.get(type).at(-1).tid;
      db.prepare('UPDATE trimatch_equip SET level_tid=? WHERE role_id=? AND site_index=? AND equip_type_tid=?')
        .run(lastTid, env.store.state().roleId, 4, type);
    }
  });
  await assert.rejects(
    () => env.execute(113003, { site_idx: 4, times: 1 }),
    error => error instanceof GameError && error.code === 3
  );
});

test('114001-114005 persist presets and main playing lineup, validate teams and exact playing types', async t => {
  const env = setup(t);
  const lineup = teamOf();
  const invalidDuplicates = [
    { lineup: { team_list: [{ team_id: 1, sites: [{ site_index: 1, hero_tid: HERO_TIDS[0] }, { site_index: 1, hero_tid: HERO_TIDS[1] }] }] } },
    { lineup: { team_list: [{ team_id: 1, sites: [{ site_index: 1, hero_tid: HERO_TIDS[0] }, { site_index: 2, hero_tid: HERO_TIDS[0] }] }] } },
    { lineup: { team_list: [teamOf(HERO_TIDS.slice(0, 2), 1), teamOf(HERO_TIDS.slice(2), 1)] } }
  ];
  for (const input of invalidDuplicates) {
    await assert.rejects(
      () => env.execute(114001, input),
      error => error instanceof GameError && error.code === 1
    );
  }

  const added = await env.execute(114001, { lineup: { team_list: [lineup], name: '' } });
  assert.equal(added.value.uid, 1);
  const addedResponse = unpackResponse(114001, added);
  assert.equal(Number(addedResponse.change_lineup.uid), 1);
  assert.equal(addedResponse.change_lineup.team_list[0].sites.length, 4);

  const edited = await env.execute(114002, {
    lineup: { uid: 1, gen_time: 0, name: 'edited', team_list: [teamOf([...HERO_TIDS].reverse())] }
  });
  assert.equal(edited.value.uid, 1);
  assert.equal(unpackResponse(114002, edited).change_lineup.name, 'edited');

  const renamed = await env.execute(114003, { uid: 1, name: 'main' });
  assert.equal(renamed.value.name, 'main');
  assert.equal(unpackResponse(114003, renamed).change_lineup.name, 'main');
  await assert.rejects(
    () => env.execute(114003, { uid: 1, name: '' }),
    error => error instanceof GameError && error.code === 1
  );

  const playing = await env.execute(114005, { lineup: { type: 1, team_list: [teamOf()] } });
  assert.equal(playing.value.type, 1);
  assert.equal(unpackResponse(114005, playing).lineup.type, '1');
  await env.execute(114005, { lineup: { type: 3, team_list: [teamOf()] } });
  await assert.rejects(
    () => env.execute(114005, { lineup: { team_list: [teamOf()] } }),
    error => error instanceof GameError && error.code === 1
  );
  await assert.rejects(
    () => env.execute(114005, { lineup: { type: 4, team_list: [teamOf()] } }),
    error => error instanceof GameError && error.code === 5
  );

  env.reopen();
  const login = env.login();
  assert.deepEqual(TRI_MATCH_LOGIN_MODULES, { hero: 563, equip: 564, lineup: 565 });
  const heroes = codec.unpack('pb_battle_tri_match_role_hero_data', login.hero);
  const equips = codec.unpack('pb_battle_tri_match_role_equip_data', login.equip);
  const lineups = codec.unpack('pb_battle_tri_match_role_lineup', login.lineup);
  assert.equal(heroes.hero_list.length, 4);
  assert.equal(heroes.site_list.length, 4);
  assert.equal(equips.equips.length, 4);
  assert.equal(lineups.lineup_list.length, 1);
  assert.equal(lineups.lineup_list[0].name, 'main');
  assert.deepEqual(lineups.playing_lineup.map(row => Number(row.type)), [1, 3]);
  assert.equal(lineups.playing_lineup[0].team_list.length, 1);
  assert.equal(lineups.add_max_num, '20');

  const deleted = await env.execute(114004, { uid: 1 });
  assert.equal(deleted.value.uid, 1);
  assert.equal(codec.unpack('pb_battle_tri_match_lineup_delete_rsp', deleted.data).change_lineup, undefined);
});

test('triple match presets stop at the configured maximum and UID allocation survives reopen', async t => {
  const env = setup(t);
  for (let index = 0; index < triTables.lineupConst.max_preset; index += 1) {
    const result = await env.execute(114001, { lineup: { team_list: [teamOf()] } });
    assert.equal(result.value.uid, index + 1);
  }
  await assert.rejects(
    () => env.execute(114001, { lineup: { team_list: [teamOf()] } }),
    error => error instanceof GameError && error.code === 3
  );
  await env.execute(114004, { uid: 20 });
  env.reopen();
  const next = await env.execute(114001, { lineup: { team_list: [teamOf()] } });
  assert.equal(next.value.uid, 21);
});

function moduleBytes(entry) {
  assert.ok(entry, 'login module is missing');
  const value = entry.value ?? entry;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  if (value?.data) return Buffer.from(value.data);
  if (value?.value?.data) return Buffer.from(value.value.data);
  throw new TypeError('Login module binary is malformed');
}

test('gateway routes all ten triple match commands over a temporary TCP port', { timeout: 20000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-trimatch-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    now: () => FIXED_NOW,
    verifySession: (uid, code) => uid === 'trimatch-user' && code === 'trimatch-session'
  });
  game.store.transaction((model, db) => grantResources(model, [
    ...HERO_TIDS.map(tid => [tid, 1]),
    [LEVEL_MATERIAL, 1000], [STAR_MATERIAL, 1000], [EQUIP_MATERIAL, 1000],
    ...HERO_CHIPS.map(tid => [tid, 1000])
  ], game.tables, { codec, db, now: () => FIXED_NOW }));

  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
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
  const challenge = parseServerChallenge(await next());
  const key = 'ClientKey1234567';
  send(Buffer.concat([
    Buffer.from(key),
    localAesBeforeFinal(challenge.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
    challenge.rawFlags,
    Buffer.from('1.55.090365')
  ]));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const frame = codec.unpack('pb_s2c', await next());
      if (Number(frame.seq) === Number(seq)) return frame;
    }
  };

  const login = await request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'trimatch-user', verify_code: 'trimatch-session', channel_extra: ''
  }));
  const loginFlow = await decodeEtf(Buffer.from(login.data, 'base64'));
  assert.equal(Number(loginFlow[0]), 1);
  const modules = new Map(loginFlow[2].value.map(([id, entry]) => [Number(id), entry]));
  const heroLogin = codec.unpack('pb_battle_tri_match_role_hero_data', moduleBytes(modules.get(563)));
  const equipLogin = codec.unpack('pb_battle_tri_match_role_equip_data', moduleBytes(modules.get(564)));
  const lineupLogin = codec.unpack('pb_battle_tri_match_role_lineup', moduleBytes(modules.get(565)));
  assert.equal(heroLogin.site_list.length, 4);
  assert.equal(equipLogin.equips.length, 4);
  assert.equal(lineupLogin.lineup_list.length, 0);

  let seq = 2;
  const invoke = async (type, value) => {
    const response = await request(type, seq++, codec.pack(RESPONSE_SCHEMAS[type].replace(/_rsp$/, '_req'), value));
    assert.equal(response.err, undefined, `command ${type} failed: ${JSON.stringify(response.err)}`);
    return codec.unpack(RESPONSE_SCHEMAS[type], Buffer.from(response.data ?? '', 'base64'));
  };

  const levelled = await invoke(112001, { site_idx: 1, up_lv_times: 1 });
  assert.equal(Number(levelled.change_site_data.level_tid), 2);
  const starred = await invoke(112002, { hero_tid: HERO_TIDS[0] });
  assert.equal(Number(starred.change_hero_data.star), 1);
  const equipUp = await invoke(113001, { site_idx: 1, equip_type_id: 1, is_one_key: false });
  assert.equal(equipUp.change_equips[0].equips[0].level_tid, '1002');
  await invoke(113002, { site_idx1: 1, equip_type_id1: 1, site_idx2: 2, equip_type_id2: 1 });
  const multiple = await invoke(113003, { site_idx: 2, times: 1 });
  assert.equal(multiple.change_equips[0].equips.length, 4);
  const added = await invoke(114001, { lineup: { team_list: [teamOf()] } });
  const uid = Number(added.change_lineup.uid);
  await invoke(114002, { lineup: { uid, gen_time: 0, name: 'tcp', team_list: [teamOf([...HERO_TIDS].reverse())] } });
  await invoke(114003, { uid, name: 'final' });
  const playing = await invoke(114005, { lineup: { type: 1, team_list: [teamOf()] } });
  assert.equal(Number(playing.lineup.type), 1);
  await invoke(114004, { uid });

  assert.equal(game.store.inspect(db => db.prepare('SELECT count(*) AS n FROM trimatch_lineup').get().n), 0);
  assert.equal(game.store.inspect(db => db.prepare('SELECT count(*) AS n FROM trimatch_playing_lineup WHERE lineup_type=1').get().n), 1);
});
