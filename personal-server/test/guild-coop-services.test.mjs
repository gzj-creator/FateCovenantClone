import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readGuildCoopTables } from '../config/guild-coop-tables.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createGuildRosterService } from '../game/guild-roster-service.mjs';
import { createGuildBossService } from '../game/guild-boss-service.mjs';
import { createGuildJointService } from '../game/guild-joint-service.mjs';
import { createGuildRuneStoneService } from '../game/guild-rune-stone-service.mjs';
import { createGuildGvgService } from '../game/guild-gvg-service.mjs';
import { createGuildVoteService } from '../game/guild-vote-service.mjs';
import { createSlgMapService } from '../game/guild-slg-map-service.mjs';
import { createGuildNationService } from '../game/guild-nation-service.mjs';
import { createGuildBargainService } from '../game/guild-bargain-service.mjs';
import { createGuildExpeditionService } from '../game/guild-expedition-service.mjs';
import { createChannelEntryService } from '../game/channel-entry-service.mjs';
import { createGuildHuntService } from '../game/guild-hunt-service.mjs';
import { createGuildCrusadeService } from '../game/guild-crusade-service.mjs';
import { createGuildAuctionService } from '../game/guild-auction-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const FIXED_NOW = Date.UTC(2026, 10, 8, 2, 0, 0);

function setup(t) {
  let now = FIXED_NOW;
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guild-coop-', now: () => now });
  const clock = () => now;
  createGuildRosterService({ store: fixture.store, codec, now: () => Math.floor(now / 1000) }).ensureLoginState();
  fixture.store.transaction(model => grantResources(model, [[101500, 100000], [3002, 100]], tables, { codec, now: clock }));
  const coopTables = readGuildCoopTables();
  coopTables.boss.damageAwards[0].damage = '1';
  coopTables.boss.skillCooldown = 0;
  coopTables.auction.durationSeconds = 60;
  const make = store => {
    const shared = { store, codec, tables, heroTables: tables, coopTables, now: clock };
    return {
      boss: createGuildBossService(shared), joint: createGuildJointService(shared),
      rune: createGuildRuneStoneService(shared), gvg: createGuildGvgService(shared),
      vote: createGuildVoteService(shared), slg: createSlgMapService(shared),
      nation: createGuildNationService(shared), bargain: createGuildBargainService(shared),
      expedition: createGuildExpeditionService(shared), channel: createChannelEntryService(shared),
      hunt: createGuildHuntService(shared), crusade: createGuildCrusadeService(), auction: createGuildAuctionService(shared)
    };
  };
  let services = make(fixture.store);
  return {
    fixture, coopTables,
    get services() { return services; },
    advance(seconds) { now += seconds * 1000; },
    reopen() { services = make(fixture.open()); return services; }
  };
}

test('E2 covers all 154 missing command ids and leaves the existing 99229 owner intact', async t => {
  const env = setup(t);
  const all = Object.values(env.services).flatMap(service => Object.values(service.commands ?? {}));
  assert.equal(all.length, 154);
  assert.equal(new Set(all).size, 154);
  assert.equal(env.services.nation.supports(99229), false);
  await assert.rejects(env.services.crusade.execute(105805, Buffer.alloc(0)), error => error.code === 5);
});

test('guild boss damage, awards and idempotency survive a database reopen', async t => {
  const env = setup(t);
  const empty = await encodeEtf([]);
  await env.services.boss.execute(91309, empty);
  const entered = await env.services.boss.execute(91301, empty);
  assert.equal(codec.unpack('pb_guild_boss_guild', entered.data).guild_id, '900001');
  const hit = await env.services.boss.execute(91303, codec.pack('pb_guild_boss_use_skill_req', { skill_id: 1 }));
  assert.ok(BigInt(codec.unpack('pb_guild_boss_use_skill_back', hit.data).damage) > 0n);
  const claimed = await env.services.boss.execute(91304, codec.pack('pb_req_claim_boss_dmg_award', { boss_tid: 1, dmg_idx: 1, award_idx_list: [1] }));
  assert.equal(codec.unpack('pb_res_to_client', claimed.data).changes.length, 1);
  const reopened = env.reopen();
  await assert.rejects(reopened.boss.execute(91304, codec.pack('pb_req_claim_boss_dmg_award', { boss_tid: 1, dmg_idx: 1, award_idx_list: [1] })), error => error.code === 310);
});

test('guild joint, rune stone, vote and SLG state are transactional', async t => {
  const env = setup(t);
  const empty = await encodeEtf([]);
  const info = await env.services.joint.execute(91612, empty);
  const joint = codec.unpack('pb_guild_joint_enter_map_back', info.data);
  assert.equal(joint.map.monster_list.length, 3);
  const hit = await env.services.joint.execute(91602, await encodeEtf([1]));
  const jointHit = codec.unpack('pb_guild_joint_atk_monster', hit.data);
  assert.ok(BigInt(jointHit.hurt) > 0n);

  const runeTids = [...tables.Item.keys()].filter(tid => tables.Type.get(Number(tables.Item.get(tid)?.type))?.obj_class?.reference === 'ItemGuildRuneStone').sort((a, b) => a - b);
  assert.ok(runeTids.length >= 2);
  env.fixture.store.transaction(model => grantResources(model, [[runeTids[0], 6], [runeTids[1], 1]], tables, { codec, now: () => env.fixture.store ? FIXED_NOW : FIXED_NOW }));
  const equipped = await env.services.rune.execute(92701, codec.pack('pb_guild_rune_stone_take_on_req', { rune_tid: runeTids[0], operates: [{ index: 1, tid: runeTids[0] }] }));
  assert.ok(codec.unpack('pb_res_to_client', equipped.data).changes.length > 0);
  await env.services.rune.execute(92702, codec.pack('pb_guild_rune_stone_take_off_req', { rune_tid: runeTids[0], operates: [{ index: 1, tid: runeTids[0] }] }));
  await env.services.rune.execute(92703, codec.pack('pb_guild_rune_stone_compose_req', { sources: [{ key: runeTids[0], value: 3 }], targets: [{ key: runeTids[1], value: 1 }] }));

  await env.services.vote.execute(99701, await encodeEtf([1]));
  const vote = await env.services.vote.execute(98702, codec.pack('pb_guild_vote_req', { type: 1, vote: 100001 }));
  assert.equal(codec.unpack('pb_guild_vote_info', vote.data).type, '1');
  await env.services.slg.execute(99100, codec.pack('pb_slg_map_view_req', { fun_tid: 1, block_list: [1, 2] }));
  await env.services.slg.execute(99101, empty);
});

test('GVG, bargain, hunt and auction use authoritative inventory and claims', async t => {
  const env = setup(t);
  const empty = await encodeEtf([]);
  const box = await env.services.gvg.execute(97001, empty);
  assert.equal(codec.unpack('pb_res_to_client', box.data).changes.length, 1);
  await env.services.gvg.execute(97005, codec.pack('pb_guild_gvg_req', { map_node_id: 1, team_id: 1 }));
  await env.services.gvg.execute(97002, codec.pack('pb_guild_gvg_req', { map_node_id: 2, team_id: 1 }));

  const bargain = await env.services.bargain.execute(101402, codec.pack('pb_guild_bargain_req', { gift_tid: 1 }));
  assert.equal(codec.unpack('pb_guild_bargain_rsp', bargain.data).info.current_price, 920);
  const bought = await env.services.bargain.execute(101403, codec.pack('pb_guild_bargain_buy_req', { gift_tid: 1 }));
  assert.ok(codec.unpack('pb_guild_bargain_buy_rsp', bought.data).res.changes.length >= 2);

  await env.services.hunt.execute(103401, empty);
  const support = await env.services.hunt.execute(103402, empty);
  assert.equal(codec.unpack('pb_res_to_client', support.data).changes.length, 2);
  const huntInfo = await env.services.hunt.execute(103403, empty);
  assert.equal(codec.unpack('pb_guild_hunt_server', huntInfo.data).id, '1');

  await env.services.auction.execute(107602, codec.pack('pb_guild_auction_wish_req', { auction_id: 1, auction_item_uid: 1, do_type: 1 }));
  const bid = await env.services.auction.execute(107601, codec.pack('req_guild_auction_bid', { auction_id: 1, item_uid: 1, spend: 60 }));
  assert.equal(codec.unpack('rsp_guild_auction_bid', bid.data).is_bid, true);
  env.advance(61);
  const settled = await env.services.auction.execute(107603, empty);
  assert.equal(settled.value.settled, true);
  assert.equal(codec.unpack('guild_auction_get_req', settled.data).guild_auction_info.data_list[0].stage, '2');
});

test('expedition, channel and guild nation commands expose real state', async t => {
  const env = setup(t);
  const empty = await encodeEtf([]);
  const expedition = await env.services.expedition.execute(101601, empty);
  assert.equal(codec.unpack('pb_guild_expedition_info', expedition.data).city_list.length, 3);
  await env.services.expedition.execute(101602, await encodeEtf([1]));
  const inspire = await env.services.expedition.execute(101603, empty);
  assert.equal(codec.unpack('pb_guild_expedition_inspire_back', inspire.data).role_point, '1');
  await env.services.expedition.execute(101614, codec.pack('pb_guild_expedition_pos_fight_req', { build_tid: 1, pos: 1, team_id: 1 }));

  const channel = await env.services.channel.execute(102801, empty);
  assert.equal(codec.unpack('pb_channel_entry', channel.data).channel_id, 1);
  assert.equal(codec.unpack('pb_channel_entry', channel.data).is_open, true);
  const channelTwo = await env.services.channel.execute(102801, await encodeEtf([2]));
  assert.equal(codec.unpack('pb_channel_entry', channelTwo.data).channel_id, 2);
  await assert.rejects(
    env.services.channel.execute(102801, await encodeEtf([99])),
    error => error.code === 5
  );
  await assert.rejects(
    env.services.channel.execute(102801, await encodeEtf([1, 2])),
    error => error.code === 1
  );

  const power = await env.services.nation.execute(99228, empty);
  assert.ok(codec.unpack('pb_guild_nation_power_info_rsp', power.data).lineup_power.length === 1);
  await env.services.nation.execute(99201, codec.pack('pb_guild_nation_up_level_req', { build_tid: 1, queue_tid: 1 }));
  await env.services.nation.execute(99202, codec.pack('pb_guild_nation_spawn_soldier_req', { type: 1, num: 2, level: 1 }));
  await env.services.nation.execute(99212, codec.pack('pb_guild_nation_study_req', { id: 1, node_id: 1 }));
  const finish = await env.services.nation.execute(99216, empty);
  assert.equal(codec.unpack('pb_guild_nation_finish_study_back', finish.data).activation_node.tid, 1);
  await env.services.nation.execute(99230, codec.pack('pb_guild_nation_assist_rsp', { list: [{ role_id: '100001', target_type: 1, target_id: 1, target_lv: 1, id: '77' }] }));
  assert.equal(env.fixture.store.inspect(db => db.prepare('SELECT assist_num FROM guild_nation_assists WHERE assist_id=?').get('77').assist_num), 0);
  const assist = await env.services.nation.execute(99231, codec.pack('pb_guild_nation_assist_list', { list: [{ role_id: '100001', target_type: 1, target_id: 1, target_lv: 1, id: '77' }] }));
  assert.equal(codec.unpack('pb_guild_nation_assist_list_back', assist.data).list.length, 1);
  assert.equal(env.fixture.store.inspect(db => db.prepare('SELECT assist_num FROM guild_nation_assists WHERE assist_id=?').get('77').assist_num), 1);
});

test('temporary TCP gateway routes cooperation commands and decodes client responses', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-guild-coop-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    verifySession: (uid, code) => uid === 'local-user' && code === 'test-session',
    serverOpenedAt: 1792789200,
    now: () => FIXED_NOW
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

  const empty = await encodeEtf([]);
  assert.equal((await request(91309, 2, empty)).err, undefined);
  const entered = await request(91301, 3, empty);
  assert.equal(codec.unpack('pb_guild_boss_guild', Buffer.from(entered.data, 'base64')).guild_id, '900001');
  const hit = await request(91303, 4, codec.pack('pb_guild_boss_use_skill_req', { skill_id: 1 }));
  assert.ok(BigInt(codec.unpack('pb_guild_boss_use_skill_back', Buffer.from(hit.data, 'base64')).damage) > 0n);
  const joint = await request(91612, 5, empty);
  assert.equal(codec.unpack('pb_guild_joint_enter_map_back', Buffer.from(joint.data, 'base64')).map.monster_list.length, 3);
  const channel = await request(102801, 6, await encodeEtf([1]));
  assert.equal(codec.unpack('pb_channel_entry', Buffer.from(channel.data, 'base64')).channel_id, 1);
  assert.equal(codec.unpack('pb_channel_entry', Buffer.from(channel.data, 'base64')).is_open, true);
});
