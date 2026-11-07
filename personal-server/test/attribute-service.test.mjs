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
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { assembleHeroAttributes, assembleLineup, buildLineupAttrInfo, FIGHT_ATTR } from '../game/attribute-service.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const SERVER_OPENED_AT = 1792789200;

const hero = (overrides = {}) => ({ uid: '1', tid: 1040101, level: 1, star: 1, breakthrough_level: 0, ...overrides });

test('assembles configured level, star, break and quality attribute rows', () => {
  const base = assembleHeroAttributes({ hero: hero(), heroTables, attributeTables });
  assert.equal(base.stats.hp, 7500);
  assert.equal(base.stats.attack, 1050);
  assert.equal(base.stats.physicalDefense, 345);
  assert.ok(base.sources.some(source => source.play === 'base' && source.key === FIGHT_ATTR.HP));
  assert.ok(base.sources.some(source => source.play === 'battle' && source.key === FIGHT_ATTR.HP));
  assert.equal(base.fightAttrs[FIGHT_ATTR.HP], base.stats.hp);

  const levelled = assembleHeroAttributes({ hero: hero({ level: 60 }), heroTables, attributeTables });
  assert.ok(levelled.stats.hp > base.stats.hp, 'level growth adds HP');
  assert.ok(levelled.stats.attack > base.stats.attack, 'level growth adds attack');
  assert.ok(levelled.sources.some(source => source.play === 'base' && source.displayAttr === 1));

  const starred = assembleHeroAttributes({ hero: hero({ star: 6 }), heroTables, attributeTables });
  assert.ok(starred.stats.hp > levelled.stats.hp, 'high star rows add HP');
  assert.ok(starred.sources.some(source => source.play === 'high-star:6'));

  const broken = assembleHeroAttributes({ hero: hero({ breakthrough_level: 6 }), heroTables, attributeTables });
  assert.ok(broken.stats.hp > levelled.stats.hp, 'breakthrough rows add HP');
  assert.ok(broken.sources.some(source => source.play === 'break' && source.value > 0));

  // Deterministic for identical state.
  assert.deepEqual(assembleHeroAttributes({ hero: hero({ level: 60, star: 6, breakthrough_level: 6 }), heroTables, attributeTables }).stats,
    assembleHeroAttributes({ hero: hero({ level: 60, star: 6, breakthrough_level: 6 }), heroTables, attributeTables }).stats);

  // Quality changes the authoritative BaseAttrNew row (q50 -> q60 doubles 3040201).
  const quality50 = assembleHeroAttributes({ hero: hero({ tid: 3040201 }), heroTables, attributeTables, overrides: { quality: 50 } });
  const quality60 = assembleHeroAttributes({ hero: hero({ tid: 3040201 }), heroTables, attributeTables, overrides: { quality: 60 } });
  assert.equal(quality50.quality, 50);
  assert.equal(quality60.quality, 60);
  const baseHp = assembled => assembled.sources.find(source => source.play === 'base' && source.displayAttr === 1).value;
  assert.equal(baseHp(quality50), 3000);
  assert.equal(baseHp(quality60), 6000);

  assert.throws(() => assembleHeroAttributes({ hero: hero({ tid: 1 }), heroTables, attributeTables }), error => error.code === 5);
});

test('attribute query and mission battle use one authoritative lineup power', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-attr-' });
  const model = fixture.store.read();
  const lineup = assembleLineup({ model, heroTables, attributeTables });
  assert.ok(lineup.entries.length > 0);
  const info = buildLineupAttrInfo({ model, heroTables, attributeTables });
  assert.equal(info.lineup_attr.lineup_power, String(lineup.totalPower));
  assert.equal(info.lineup_attr.attr_list.length, lineup.entries.length);
  const encoded = codec.pack('pb_attr_lineup_all_info', info);
  assert.deepEqual(codec.unpack('pb_attr_lineup_all_info', encoded).lineup_attr.lineup_power, String(lineup.totalPower));
  for (const entry of info.lineup_attr.attr_list) {
    const hp = entry.fight_attr_list.find(attr => Number(attr.key) === FIGHT_ATTR.HP);
    assert.ok(hp && Number(hp.value) > 0);
  }

  const service = createMissionFightService({ store: fixture.store, codec, playbackEnabled: true });
  const request = codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: 30201 }),
    loc: [{ team_id: 1, loc: [
      { hero_id: '2010101', loc: 6 },
      { hero_id: '2010201', loc: 4 },
      { hero_id: '1020601', loc: 2 },
      { hero_id: '2020601', loc: 5 }
    ] }]
  });
  const response = codec.unpack('pb_fight_response', service.execute(201, request).data);
  const battle = response.report.battle_list[0];
  const assembled = new Map(lineup.entries.map(entry => [entry.uid, entry]));
  for (const unit of battle.fighter_list.filter(fighter => Number(fighter.role_type) === 1)) {
    const entry = assembled.get(String(unit.uid));
    assert.ok(entry, 'mission fighter is part of the assembled lineup');
    assert.equal(Number(unit.max_hp), entry.stats.hp);
  }
  assert.equal(Number(battle.atk_power), lineup.totalPower);
});

test('attribute assembly follows persisted hero state across SQLite reopen', t => {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-attr-store-' });
  const before = fixture.store.read();
  const target = before.heroInfo.hero_list.find(value => String(value.uid) === '2020601');
  const beforeStats = assembleHeroAttributes({ hero: target, heroTables, attributeTables }).stats;
  fixture.store.transaction(model => {
    const stored = model.heroInfo.hero_list.find(value => String(value.uid) === '2020601');
    stored.level = Number(stored.level ?? 1) + 5;
  });
  const store = fixture.open();
  const reloaded = store.read().heroInfo.hero_list.find(value => String(value.uid) === '2020601');
  const afterStats = assembleHeroAttributes({ hero: reloaded, heroTables, attributeTables }).stats;
  assert.ok(afterStats.hp > beforeStats.hp);
  assert.ok(afterStats.attack > beforeStats.attack);
  assert.equal(afterStats.hp, assembleHeroAttributes({ hero: reloaded, heroTables, attributeTables }).stats.hp);
});

test('1316 attribute query over real gateway framing matches stored lineup power', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-attr-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => (SERVER_OPENED_AT + 3600) * 1000,
    random: () => 0.5
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

  const response = await request(1316, 2, Buffer.from([131, 106]));
  assert.equal(response.err, undefined);
  const info = codec.unpack('pb_attr_lineup_all_info', Buffer.from(response.data, 'base64'));
  const expected = assembleLineup({ model: game.store.read(), heroTables, attributeTables });
  assert.equal(info.lineup_attr.lineup_power, String(expected.totalPower));
  assert.equal(info.lineup_attr.attr_list.length, expected.entries.length);
  assert.equal(info.lineup_attr.lineup_type, 1);
  const first = info.lineup_attr.attr_list[0];
  const expectedFirst = expected.entries.find(entry => String(entry.uid) === String(first.tid));
  assert.ok(expectedFirst, 'attribute entity tid is the persisted hero uid');
  assert.equal(Number(first.fight_attr_list.find(attr => Number(attr.key) === FIGHT_ATTR.HP).value), expectedFirst.stats.hp);
  assert.equal(Number(info.lineup_attr.team_power_list[0].power), expected.entries.reduce((sum, entry) => sum + entry.power, 0));
});

