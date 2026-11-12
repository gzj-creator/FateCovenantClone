import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const LEGACY_ACCOUNT = 'local-1';
const PHONE_ACCOUNT = 'local-phone-17607270093';
const SECOND_PHONE_ACCOUNT = 'local-phone-17607270094';

function starterModule(modules, id) {
  const entry = modules.get(id);
  assert.ok(entry, 'Missing login module ' + id);
  if (Array.isArray(entry.value) && typeof entry.improper === 'boolean') {
    return entry.value.map(value => rawBinary(value));
  }
  return [rawBinary(entry)];
}

function assertEmptyModule(modules, id) {
  assert.ok(starterModule(modules, id).every(value => value.length === 0), 'Module ' + id + ' retained account progression');
}

function lineupHeroIds(lineup) {
  return [
    ...(lineup?.fighter_list ?? []).map(fighter => String(fighter.hero_id)),
    ...(lineup?.team_list ?? []).flatMap(team => (team.fighter_list ?? []).map(fighter => String(fighter.hero_id)))
  ];
}

function assertStarterLineup(lineup, starterHeroIds) {
  for (const fighter of lineup?.fighter_list ?? []) assert.deepEqual(fighter.equip_ids ?? [], []);
  for (const team of lineup?.team_list ?? []) {
    for (const fighter of team.fighter_list ?? []) assert.deepEqual(fighter.equip_ids ?? [], []);
  }
  assert.ok(lineupHeroIds(lineup).every(heroId => starterHeroIds.has(heroId)));
}

function assertStarterAccount(store, roleId, {
  createdAt,
  energyAt,
  roleName = 'Local Test',
  setNameTimes = 0,
  postLogin = false
} = {}) {
  const model = store.read(roleId);
  assert.equal(Number(model.role.level), 1);
  assert.equal(Number(model.role.exp ?? 0), 0);
  assert.equal(Number(model.role.level_reward_record ?? 0), 0);
  assert.equal(Number(model.role.set_name_times ?? 0), setNameTimes);
  assert.equal(Buffer.from(model.role.nick_name, 'base64').toString('utf8'), roleName);
  if (createdAt != null) assert.equal(Number(model.role.create_time), createdAt);

  assert.deepEqual(model.heroInfo.hero_list.map(hero => hero.tid), ['2010101', '2010201']);
  assert.ok(model.heroInfo.hero_list.every(hero => Number(hero.level) === 1
    && Number(hero.star) === 0
    && Number(hero.star_progress) === 0
    && Number(hero.breakthrough_level) === 0));
  assert.ok(model.heroInfo.cell_list.every(cell => Number(cell.level) === 1 && Number(cell.break_level) === 0));

  const modules = new Map(model.state.modules.value);
  const mission = codec.unpack('pb_mission', starterModule(modules, 8)[0]);
  assert.equal(String(mission.mission_id ?? '0'), '0');
  assert.equal(Number(mission.pass_count?.count ?? 0), 0);
  const missionEnergy = codec.unpack('pb_role_energy_res', starterModule(modules, 8)[2]);
  assert.deepEqual(missionEnergy.res, [{
    tid: '100012900',
    num: '120',
    produce_time: energyAt ?? createdAt ?? Number(model.role.create_time)
  }]);
  if (!postLogin) {
    assert.deepEqual(codec.unpack('pb_currency_data', starterModule(modules, 5)[0]), { res_list: [] });
    assert.ok(modules.get(6).value.every(group => Array.isArray(group.value) && typeof group.improper === 'boolean'
      ? group.value.length === 0
      : group.bits === 8 && group.value?.data?.length === 0));
    assert.ok(starterModule(modules, 10).slice(1).every(value => value.length === 0));
    for (const id of [3, 12, 16, 21, 26, 29, 65, 90]) assertEmptyModule(modules, id);
    assert.deepEqual([...model.resources.keys()], ['100012900']);
  } else {
    assert.equal(model.resources.has('198830'), false);
  }
  assert.equal(BigInt(model.resources.get('100012900').num), 120n);
  const starterHeroIds = new Set(['2010101', '2010201']);
  for (const preset of model.lineups.pre_lineups ?? []) assertStarterLineup(preset.lineup, starterHeroIds);
  for (const preset of model.lineups.pre_lineups_standby ?? []) assertStarterLineup(preset.lineup, starterHeroIds);
  for (const lineup of model.playLineups) assertStarterLineup(lineup, starterHeroIds);

  const login = codec.unpack('pb_lineup_login', starterModule(modules, 9)[0]);
  if (login.custom_pre_lineup) {
    const custom = codec.unpack('pb_custom_lineup_role', Buffer.from(login.custom_pre_lineup, 'base64'));
    for (const preset of custom.custom_pre_lineups ?? []) assertStarterLineup(preset.lineup, starterHeroIds);
  }

  if (!postLogin) {
    const expectedOpenDay = String(Math.floor(((energyAt ?? createdAt ?? Number(model.role.create_time)) + 10800) / 86400));
    for (const bytes of starterModule(modules, 38)) {
      if (!bytes.length) continue;
      const permit = codec.unpack('pb_permit_data', bytes);
      assert.ok((permit.permit_list ?? []).every(info => String(info.open_day) === expectedOpenDay && info.levels.length === 0));
    }
  }
  return model;
}

test('account roles persist separately and AsyncLocalStorage isolates concurrent work', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-account-store-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const createdAt = 1794326400;
  const seed = (options = {}) => createSeed(codec, { createdAt, ...options });
  let store = createGameStore({ databasePath, seed, codec, now: () => createdAt * 1000 });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });

  store.transaction((model, db) => {
    db.prepare('INSERT INTO local_wallets(account_id,role_id) VALUES (?,?)').run(LEGACY_ACCOUNT, model.state.roleId);
  });
  const legacy = store.resolveAccount(LEGACY_ACCOUNT);
  const phone = store.resolveAccount(PHONE_ACCOUNT, { loginCode: 'phone-17607270093', phone: '17607270093' });
  const secondPhone = store.resolveAccount(SECOND_PHONE_ACCOUNT, { loginCode: 'phone-17607270094', phone: '17607270094' });
  assert.equal(legacy.created, false);
  assert.equal(legacy.roleId, 100001);
  assert.equal(phone.created, true);
  assert.equal(secondPhone.created, true);
  assert.notEqual(phone.roleId, legacy.roleId);
  assert.notEqual(secondPhone.roleId, legacy.roleId);
  assert.notEqual(secondPhone.roleId, phone.roleId);
  assert.equal(store.read(legacy.roleId).role.level, 9);
  assertStarterAccount(store, phone.roleId, { createdAt });
  assertStarterAccount(store, secondPhone.roleId, { createdAt });

  const delay = () => new Promise(resolve => setTimeout(resolve, 5));
  const [legacyRole, phoneRole] = await Promise.all([
    store.runWithRole(legacy.roleId, async () => { await delay(); return store.read().state.roleId; }),
    store.runWithRole(phone.roleId, async () => { await delay(); return store.read().state.roleId; })
  ]);
  assert.equal(legacyRole, legacy.roleId);
  assert.equal(phoneRole, phone.roleId);

  store.runWithRole(phone.roleId, () => store.transaction(model => { model.role.level = 2; }));
  assert.equal(store.read(phone.roleId).role.level, 2);
  assert.equal(store.read(legacy.roleId).role.level, 9);

  store.close();
  store = createGameStore({ databasePath, seed, codec, now: () => createdAt * 1000 });
  assert.equal(store.resolveAccount(LEGACY_ACCOUNT).roleId, legacy.roleId);
  assert.equal(store.resolveAccount(PHONE_ACCOUNT).roleId, phone.roleId);
  assert.equal(store.resolveAccount(SECOND_PHONE_ACCOUNT).roleId, secondPhone.roleId);
  assert.equal(store.read(phone.roleId).role.level, 2);
  assertStarterAccount(store, secondPhone.roleId, { createdAt });
});

test('v20 repairs only the broken level-one fixture account', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-account-v20-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const createdAt = 1794326400;
  const seed = (options = {}) => createSeed(codec, { createdAt, ...options });
  const repairSeed = (options = {}) => createSeed(codec, { createdAt: createdAt + 86400, ...options });
  let store = createGameStore({ databasePath, seed, codec, now: () => createdAt * 1000 });
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const brokenRoleId = store.state().roleId;
  const preserved = store.resolveAccount('preserved-level-twelve');
  store.inspect(db => {
    const broken = db.prepare('SELECT profile_json FROM roles WHERE role_id=?').get(brokenRoleId);
    db.prepare('UPDATE roles SET profile_json=? WHERE role_id=?')
      .run(JSON.stringify({ ...JSON.parse(broken.profile_json), level: 1, set_name_times: 1 }), brokenRoleId);
    const preservedRow = db.prepare('SELECT profile_json FROM roles WHERE role_id=?').get(preserved.roleId);
    db.prepare('UPDATE roles SET profile_json=? WHERE role_id=?')
      .run(JSON.stringify({ ...JSON.parse(preservedRow.profile_json), level: 12, set_name_times: 0 }), preserved.roleId);
    db.exec("DELETE FROM migrations WHERE name='new-account-starter-state-v20'; PRAGMA user_version=19;");
  });

  store.close();
  store = createGameStore({ databasePath, seed: repairSeed, codec, now: () => (createdAt + 86400) * 1000 });
  assertStarterAccount(store, brokenRoleId, { createdAt, energyAt: createdAt + 86400, setNameTimes: 1 });
  assert.equal(store.read(preserved.roleId).role.level, 12);
  assert.deepEqual(store.read(preserved.roleId).heroInfo.hero_list.map(hero => hero.tid), ['2010101', '2010201']);
  const migration = store.inspect(db => db.prepare("SELECT source FROM migrations WHERE name='new-account-starter-state-v20'").get());
  assert.equal(migration.source, 'repaired-role-ids=' + brokenRoleId);
  assert.equal(store.inspect(db => db.prepare('PRAGMA user_version').get().user_version), 20);

  store.close();
  store = createGameStore({ databasePath, seed, codec, now: () => createdAt * 1000 });
  assert.equal(store.read(preserved.roleId).role.level, 12);
  assert.equal(store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM migrations WHERE name='new-account-starter-state-v20'").get().n), 1);
});

function client(socket) {
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
  const queue = [], waiters = [];
  socket.on('data', chunk => {
    for (const data of decoder.push(chunk)) {
      const waiter = waiters.shift();
      if (waiter) waiter.resolve(data);
      else queue.push(data);
    }
  });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const entry = { resolve, reject };
    entry.timer = setTimeout(() => {
      const index = waiters.indexOf(entry);
      if (index >= 0) waiters.splice(index, 1);
      reject(new Error('Gateway response timeout'));
    }, 45000);
    entry.resolve = data => { clearTimeout(entry.timer); resolve(data); };
    waiters.push(entry);
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
      Buffer.from(key),
      localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }),
      parsed.rawFlags,
      Buffer.from('1.55.090365')
    ]));
  }
  return { next, request, handshake, close: () => socket.destroy() };
}

test('multiple simultaneous gateway sessions resolve different starter accounts and mail stays isolated', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-account-gateway-'));
  const game = createLocalGame({
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'state.json'),
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    localWallet: true,
    serverId: 1,
    roleId: 100002,
    serverOpenedAt: 1_700_000_000,
    resolveSession: (uid, token) => {
      if ((uid === LEGACY_ACCOUNT && token === 'legacy-session')
        || (uid === PHONE_ACCOUNT && token === 'phone-session')
        || (uid === SECOND_PHONE_ACCOUNT && token === 'second-phone-session')) {
        return { userId: uid, loginCode: uid, nickname: 'Isolation Test' };
      }
      return null;
    }
  });
  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = await game.listen(0);
  async function login(uid, token) {
    const socket = net.connect(address.port, '127.0.0.1');
    sockets.push(socket);
    await once(socket, 'connect');
    const peer = client(socket);
    await peer.handshake();
    const response = await peer.request(909103, 1, codec.pack('login', {
      server_id: 1, channel_uid: uid, verify_code: token, channel_extra: ''
    }));
    assert.equal(response.err, undefined);
    const loginData = await decodeEtf(Buffer.from(response.data, 'base64'));
    const modules = new Map(loginData[2].value);
    return { peer, modules, roleId: Number(modules.get(1)[1]), role: codec.unpack('to_client_role_info', Buffer.from(modules.get(2).value)) };
  }

  const [legacy, phone, secondPhone] = await Promise.all([
    login(LEGACY_ACCOUNT, 'legacy-session'),
    login(PHONE_ACCOUNT, 'phone-session'),
    login(SECOND_PHONE_ACCOUNT, 'second-phone-session')
  ]);
  assert.equal(legacy.roleId, 100002);
  assert.deepEqual([phone.roleId, secondPhone.roleId].sort(), [100003, 100004]);
  assert.equal(legacy.role.level, 9);
  assert.equal(phone.role.level, 1);
  assert.equal(secondPhone.role.level, 1);
  assertStarterAccount(game.store, phone.roleId, { roleName: 'Local Adventurer', postLogin: true });
  assertStarterAccount(game.store, secondPhone.roleId, { roleName: 'Local Adventurer', postLogin: true });
  assert.equal(game.store.roleForAccount(LEGACY_ACCOUNT), legacy.roleId);
  assert.equal(game.store.roleForAccount(PHONE_ACCOUNT), phone.roleId);
  assert.equal(game.store.roleForAccount(SECOND_PHONE_ACCOUNT), secondPhone.roleId);

  const issued = game.mail.issueVoucher({
    account_id: PHONE_ACCOUNT,
    request_id: 'account-isolation-voucher',
    quantity: 1_000_000,
    title: '百万代金券到账',
    content: '已发放 1,000,000 张代金券，每张可抵扣 1 元。',
    expire_at: 0
  });
  assert.equal(issued.quantity, 1_000_000);
  const push = codec.unpack('pb_s2c', await phone.peer.next());
  assert.equal(push.type, 900);

  const phoneClaim = await phone.peer.request(3002, 2, await encodeEtf([issued.mail_id]));
  assert.equal(phoneClaim.err, undefined);
  const legacyClaim = await legacy.peer.request(3002, 2, await encodeEtf([issued.mail_id]));
  assert.equal(legacyClaim.err?.err, 5);
  assert.equal(game.store.read(phone.roleId).resources.get('701500').num, '1000000');
  assert.equal(game.store.read(legacy.roleId).resources.get('701500')?.num ?? '0', '0');
  assert.equal(game.store.read(secondPhone.roleId).resources.get('701500')?.num ?? '0', '0');
});
