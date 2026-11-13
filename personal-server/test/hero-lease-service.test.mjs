import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readHeroLeaseTables } from '../config/hero-lease-tables.mjs';
import { createHeroLeaseService, HERO_LEASE_COMMANDS } from '../game/hero-lease-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const leaseTables = readHeroLeaseTables();
const capturePath = new URL('../fixtures/login-modules.seed.json', import.meta.url);
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const GUILD_ID = '900001';

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-lease-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Hero Lease Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const ownerId = store.state().roleId;
  const borrowerId = store.resolveAccount('lease-borrower').roleId;
  const make = () => createHeroLeaseService({
    store, codec, heroTables, leaseTables, now: () => FIXED_NOW
  });
  const call = (roleId, action) => store.runWithRole(roleId, action);
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory,
    databasePath,
    seed,
    ownerId,
    borrowerId,
    get store() { return store; },
    make,
    call,
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
    }
  };
}

function setGuild(store, roleIds, guildId = GUILD_ID) {
  const memberList = roleIds.map((roleId, index) => ({ role_id: roleId, job: index === 0 ? 1 : 6, join_time: String(FIXED_SECONDS + index) }));
  for (const roleId of roleIds) {
    store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      modules.set(24, serializedBinary(codec.pack('pb_res_guild_login', {
        guildId,
        last_leave_time: 0,
        leave_count: Buffer.alloc(0),
        guild: {
          id: guildId,
          level: 1,
          exp: 0,
          badge: 1,
          notice: 'Hero lease test guild',
          active: 0,
          name: 'Hero Lease Test',
          server_id: model.state.serverId,
          audit_type: 2,
          member_list: memberList,
          apply_list: []
        },
        guild_applies: []
      })));
      model.state.modules.value = [...modules];
    }, roleId);
  }
}

function roleLeaseState(store, roleId) {
  const module = new Map(store.read(roleId).state.modules.value).get(143);
  assert.equal(module.value.length, 7);
  const bytes = rawBinary(module.value[0]);
  return bytes.length ? codec.unpack('pb_role_lease_hero', bytes) : null;
}

function ownerHeroTids(env, count = 1) {
  return env.store.read(env.ownerId).heroInfo.hero_list.slice(0, count).map(hero => Number(hero.tid));
}

test('hero lease configuration exposes only GuildEmployMgr func 1 with three placement slots', () => {
  assert.deepEqual([...HERO_LEASE_COMMANDS], [87201, 87202, 87203, 87204, 87205]);
  assert.equal(leaseTables.active.tid, 1);
  assert.equal(leaseTables.active.max_lease_num, 3);
  assert.equal(leaseTables.active.max_place_num, 3);
  assert.equal(leaseTables.active.lua_module, 'GuildEmployMgr');
  assert.equal(leaseTables.slotForFunc(1), 0);
  assert.deepEqual(leaseTables.hooks.map(row => [row.tid, row.lease, row.index]), [[17, 1, 1], [18, 1, 2], [19, 1, 3]]);
  assert.deepEqual(leaseTables.unitByPb.get('pb_lease_hero'), { tid: 1, pb: 'pb_lease_hero' });
});

test('login initializes the active func in slot zero and preserves seven module slots', t => {
  const env = setup(t);
  env.call(env.ownerId, () => env.make().ensureLoginState());
  const module = new Map(env.store.read(env.ownerId).state.modules.value).get(143);
  assert.equal(module.value.length, 7);
  assert.equal(rawBinary(module.value[0]).length > 0, true);
  assert.ok(module.value.slice(1).every(slot => rawBinary(slot).length === 0));
  const state = roleLeaseState(env.store, env.ownerId);
  assert.equal(state.func_tid, 1);
  assert.deepEqual(state.lease_heroes, []);
  assert.deepEqual(state.place_heroes, []);
});

test('place, same-guild list, lease, give-back and take-back form a persistent closed loop', t => {
  const env = setup(t);
  setGuild(env.store, [env.ownerId, env.borrowerId]);
  env.call(env.ownerId, () => env.make().ensureLoginState());
  env.call(env.borrowerId, () => env.make().ensureLoginState());
  const [first, second] = ownerHeroTids(env, 2);
  env.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(entry => Number(entry.tid) === first);
    hero.level = 77;
    hero.star = 6;
    hero.quality = 4;
    hero.breakthrough_level = 5;
    hero.mastery_level = 3;
    hero.mastery_break = 2;
  }, env.ownerId);

  const placed = env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 1,
    hero_list: [{ hero_tid: first, index: 1 }, { hero_tid: second, index: 2 }]
  }));
  assert.equal(codec.unpack('pb_role_lease_hero', placed.data).place_heroes.length, 2);
  assert.equal(placed.value.place_heroes[0].hero.level, 77);
  assert.equal(Number(placed.value.place_heroes[0].hero.owner_id), env.ownerId);

  env.reopen();
  const listed = env.call(env.borrowerId, () => env.make().execute(87205, {
    lease_tid: 1,
    role_id_list: [env.ownerId, env.ownerId, 99999999]
  }));
  assert.equal(listed.value.all_place_heroes.length, 1);
  assert.equal(listed.value.all_place_heroes[0].role_id, env.ownerId);
  assert.deepEqual(listed.value.all_place_heroes[0].place_heroes.map(row => row.hero_tid), [first, second]);

  const leased = env.call(env.borrowerId, () => env.make().execute(87202, {
    lease_tid: 1,
    hero_list: [{ role_id: env.ownerId, hero_tid: first }]
  }));
  assert.equal(leased.value.lease_heroes.length, 1);
  assert.equal(leased.value.lease_heroes[0].hero.level, 77);
  assert.equal(Number(leased.value.lease_heroes[0].hero.owner_id), env.ownerId);
  assert.equal(leased.pushes.length, 1);
  const ownerAfterLease = roleLeaseState(env.store, env.ownerId);
  assert.equal(ownerAfterLease.place_heroes.find(row => row.hero_tid === first).lease_times, 1);
  assert.equal(ownerAfterLease.total_lease_times, 1);

  env.store.transaction(model => {
    const leaseHero = leased.value.lease_heroes[0].hero;
    if (!model.playLineups.length) model.playLineups.push({ type: 1, team_list: [], custom_attr: [], custom_lineup_index: 0, select_camp: 0 });
    if (!model.playLineups[0].team_list.length) model.playLineups[0].team_list.push({ team_id: 1, fighter_list: [], lease_fighter_list: [] });
    model.playLineups[0].team_list[0].lease_fighter_list = [{ loc: 1, hero: leaseHero, replace_hero_id: '0' }];
  }, env.borrowerId);

  const returned = env.call(env.borrowerId, () => env.make().execute(87203, {
    lease_tid: 1,
    hero_list: [{ role_id: env.ownerId, hero_tid: first }]
  }));
  assert.deepEqual(returned.value.lease_heroes, []);
  assert.equal(env.store.read(env.borrowerId).playLineups[0].team_list[0].lease_fighter_list.length, 0);
  assert.equal(returned.pushes.some(push => push.target?.roleId === env.ownerId), true);

  const retired = env.call(env.ownerId, () => env.make().execute(87204, { lease_tid: 1, hero_list: [first, second] }));
  assert.deepEqual(retired.value.place_heroes, []);
  assert.deepEqual(env.call(env.borrowerId, () => env.make().execute(87205, {
    lease_tid: 1, role_id_list: [env.ownerId]
  })).value.all_place_heroes, []);
});

test('guild, ownership, duplicate, index and configured limits fail closed', t => {
  const env = setup(t);
  const heroes = ownerHeroTids(env, 4);
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 1, hero_list: [{ hero_tid: heroes[0], index: 1 }]
  })), /not in a guild/);

  setGuild(env.store, [env.ownerId, env.borrowerId]);
  env.call(env.ownerId, () => env.make().ensureLoginState());
  env.call(env.borrowerId, () => env.make().ensureLoginState());
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 1, hero_list: heroes.map((hero_tid, index) => ({ hero_tid, index: index + 1 }))
  })), /placement limit/);
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 1, hero_list: [{ hero_tid: heroes[0], index: 1 }, { hero_tid: heroes[0], index: 2 }]
  })), /Duplicate placement hero/);
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 1, hero_list: [{ hero_tid: heroes[0], index: 1 }, { hero_tid: heroes[1], index: 1 }]
  })), /Duplicate placement index/);
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 1, hero_list: [{ hero_tid: heroes[0], index: 4 }]
  })), /placement index/);
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87201, {
    lease_tid: 3, hero_list: [{ hero_tid: heroes[0], index: 1 }]
  })), /not configured/);

  env.call(env.ownerId, () => env.make().execute(87201, { lease_tid: 1, hero_list: [{ hero_tid: heroes[0], index: 1 }] }));
  assert.throws(() => env.call(env.ownerId, () => env.make().execute(87202, {
    lease_tid: 1, hero_list: [{ role_id: env.ownerId, hero_tid: heroes[0] }]
  })), /current role/);
  const outsiderId = env.store.resolveAccount('lease-outsider').roleId;
  setGuild(env.store, [outsiderId], '900002');
  assert.deepEqual(env.call(outsiderId, () => env.make().execute(87205, {
    lease_tid: 1, role_id_list: [env.ownerId]
  })).value.all_place_heroes, []);
  assert.throws(() => env.call(outsiderId, () => env.make().execute(87202, {
    lease_tid: 1, hero_list: [{ role_id: env.ownerId, hero_tid: heroes[0] }]
  })), /same guild/);
  assert.throws(() => env.call(env.borrowerId, () => env.make().execute(87202, {
    lease_tid: 1, hero_list: [{ role_id: 99999999, hero_tid: heroes[0] }]
  })), /does not exist/);
});

test('borrower write failure rolls back owner lease counters atomically', t => {
  const env = setup(t);
  setGuild(env.store, [env.ownerId, env.borrowerId]);
  env.call(env.ownerId, () => env.make().ensureLoginState());
  env.call(env.borrowerId, () => env.make().ensureLoginState());
  const [heroTid] = ownerHeroTids(env, 1);
  env.call(env.ownerId, () => env.make().execute(87201, { lease_tid: 1, hero_list: [{ hero_tid: heroTid, index: 1 }] }));
  const before = roleLeaseState(env.store, env.ownerId);
  env.store.inspect(db => db.exec(`CREATE TRIGGER reject_borrower_lease BEFORE INSERT ON login_modules
    WHEN NEW.role_id=${env.borrowerId} AND NEW.module_id=143 BEGIN SELECT RAISE(ABORT, 'deny lease'); END`));
  assert.throws(() => env.call(env.borrowerId, () => env.make().execute(87202, {
    lease_tid: 1, hero_list: [{ role_id: env.ownerId, hero_tid: heroTid }]
  })), /deny lease/);
  assert.deepEqual(roleLeaseState(env.store, env.ownerId), before);
  assert.deepEqual(roleLeaseState(env.store, env.borrowerId).lease_heroes, []);
  env.store.inspect(db => db.exec('DROP TRIGGER reject_borrower_lease'));
});

function gatewayClient(socket) {
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      if (waiters.length) waiters.shift()(data); else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  const request = async (type, seq, data) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    return codec.unpack('pb_s2c', await next());
  };
  async function handshake() {
    send(Buffer.from('verify'));
    const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
    send(Buffer.concat([
      Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
      parsed.rawFlags, Buffer.from('1.55.090365')
    ]));
  }
  return { next, request, handshake };
}

test('real gateway routes 87201-87205 and targets owner updates with push 6601', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hero-lease-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'absent.json');
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Hero Lease Gateway' });
  const seeded = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const ownerId = seeded.state().roleId;
  seeded.resolveAccount('lease-borrower-gateway');
  const borrowerId = seeded.roleForAccount('lease-borrower-gateway');
  // Re-key the initial account so both real gateway sessions resolve known users.
  seeded.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('lease-owner-gateway', ownerId, 'lease-owner-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('lease-borrower-gateway', borrowerId, 'lease-borrower-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  const borrowerAccount = seeded.roleForAccount('lease-borrower-gateway');
  assert.equal(borrowerAccount, borrowerId);
  setGuild(seeded, [ownerId, borrowerId]);
  const [heroTid] = seeded.read(ownerId).heroInfo.hero_list.slice(0, 1).map(hero => Number(hero.tid));
  seeded.close();

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath,
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => {
      if (token !== 'lease-session' || !['lease-owner-gateway', 'lease-borrower-gateway'].includes(uid)) return null;
      return { userId: uid, loginCode: uid };
    }
  });
  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const address = await game.listen(0);
  async function login(uid) {
    const socket = net.connect(address.port, '127.0.0.1');
    sockets.push(socket);
    await once(socket, 'connect');
    const peer = gatewayClient(socket);
    await peer.handshake();
    const response = await peer.request(909103, 1, codec.pack('login', {
      server_id: 1, channel_uid: uid, verify_code: 'lease-session', channel_extra: ''
    }));
    assert.equal(response.err, undefined);
    const payload = await decodeEtf(Buffer.from(response.data, 'base64'));
    const modules = new Map(payload[2].value);
    const leaseModule = modules.get(143);
    assert.equal(leaseModule.value.length, 7);
    assert.ok(leaseModule.value[0], JSON.stringify(leaseModule));
    assert.ok(Buffer.from(leaseModule.value[0].value).length > 0);
    return peer;
  }
  const owner = await login('lease-owner-gateway');
  const borrower = await login('lease-borrower-gateway');

  const placed = await owner.request(87201, 2, codec.pack('pb_lease_hero_place_req', {
    lease_tid: 1, hero_list: [{ hero_tid: heroTid, index: 1 }]
  }));
  assert.equal(placed.err, undefined);
  assert.equal(codec.unpack('pb_role_lease_hero', Buffer.from(placed.data, 'base64')).place_heroes.length, 1);

  const listed = await borrower.request(87205, 2, codec.pack('pb_lease_hero_list_req', {
    lease_tid: 1, role_id_list: [ownerId]
  }));
  assert.equal(listed.err, undefined);
  assert.equal(codec.unpack('pb_lease_hero_list_rsp', Buffer.from(listed.data, 'base64')).all_place_heroes.length, 1);

  const leased = await borrower.request(87202, 3, codec.pack('pb_lease_hero_lease_req', {
    lease_tid: 1, hero_list: [{ role_id: ownerId, hero_tid: heroTid }]
  }));
  assert.equal(leased.err, undefined);
  const ownerPush = codec.unpack('pb_s2c', await owner.next());
  assert.equal(ownerPush.type, 6601);
  assert.equal(codec.unpack('pb_lease_hero_change_notify', Buffer.from(ownerPush.data, 'base64')).lease[0].func_tid, 1);

  const returned = await borrower.request(87203, 4, codec.pack('pb_lease_hero_give_back_req', {
    lease_tid: 1, hero_list: [{ role_id: ownerId, hero_tid: heroTid }]
  }));
  assert.equal(returned.err, undefined);
  const borrowerPush = codec.unpack('pb_s2c', await borrower.next());
  assert.equal(borrowerPush.type, 6601);
  const ownerReturnPush = codec.unpack('pb_s2c', await owner.next());
  assert.equal(ownerReturnPush.type, 6601);

  const retired = await owner.request(87204, 3, codec.pack('pb_lease_hero_take_back_req', {
    lease_tid: 1, hero_list: [heroTid]
  }));
  assert.equal(retired.err, undefined);
  assert.deepEqual(codec.unpack('pb_role_lease_hero', Buffer.from(retired.data, 'base64')).place_heroes, []);
});

