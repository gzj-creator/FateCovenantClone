import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { createCabinService } from '../game/cabin-service.mjs';
import { hasBit } from '../game/bit-block.mjs';
import { GameError } from '../game/hero-progression.mjs';
import { createGameStore } from '../storage/game-store.mjs';

const codec = createGameCodec();
const heroTables = readHeroTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));

function fixture() {
  const modules = structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]);
  return {
    version: 1,
    roleId: 100001,
    serverId: 1,
    createdAt: 1700000000,
    modules,
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Cabin Test') }).toString('base64'),
    guides: {},
    lineups: null
  };
}

function setup(t, { level = 44 } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-cabin-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  let store = createGameStore({ databasePath, legacyStatePath, codec });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  store.transaction(model => { model.role.level = level; });
  return {
    databasePath,
    legacyStatePath,
    get store() { return store; },
    service(options = {}) { return createCabinService({ store, codec, heroTables, ...options }); },
    reopen() { store.close(); store = createGameStore({ databasePath, legacyStatePath, codec }); }
  };
}

function addResource(store, tid, num) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= 1) groups.push({ value: [], improper: false });
    const entry = groups[1].value.length;
    groups[1].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, 1, entry] });
  });
}

function cabinData(store) {
  const module = new Map(store.state().modules.value).get(114);
  assert.ok(module, 'login module 114 is present');
  return codec.unpack('pb_campsite_data', rawBinary(module));
}

function groupData(store, groupId) {
  const data = cabinData(store);
  const group = data.groups_data.find(value => Number(value.group_id) === groupId);
  assert.ok(group, `campsite group ${groupId} is present`);
  return group;
}

const rejected = (action, code) => assert.throws(action, error => error instanceof GameError && error.code === code);

test('rebuilds module 114 from role level with the initial cell bits and persists it', t => {
  const low = setup(t, { level: 9 }), lowService = low.service();
  lowService.ensureLoginState();
  assert.deepEqual(cabinData(low.store).groups_data, []);

  const env = setup(t, { level: 42 }), service = env.service();
  service.ensureLoginState();
  const data = cabinData(env.store);
  assert.deepEqual(data.groups_data.map(group => Number(group.group_id)), [1, 2, 3, 4, 9]);
  for (const group of data.groups_data) {
    const bits = Buffer.from(group.cell_states, 'base64');
    assert.equal(Buffer.from(bits).toString('hex'), '70');
    assert.deepEqual(group.hero_list, ['0', '0', '0', '0']);
    for (const cell of [1, 2, 3]) assert.equal(hasBit(bits, cell), true);
    assert.equal(hasBit(bits, 4), false);
  }

  env.store.transaction(model => { model.role.level = 44; });
  service.ensureLoginState();
  assert.deepEqual(cabinData(env.store).groups_data.map(group => Number(group.group_id)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const before = cabinData(env.store);
  env.reopen();
  assert.deepEqual(cabinData(env.store), before);
});

test('unlocks the fourth cell, spends exactly one thousand material and survives reopen', t => {
  const env = setup(t), service = env.service();
  addResource(env.store, '101500', 1500);
  service.ensureLoginState();

  const result = service.execute(83201, [1, 4]);
  const response = codec.unpack('pb_res_to_client', result.data);
  assert.deepEqual(response.changes, [{ tid: '101500', new_num: '500', diff_num: '-1000' }]);
  assert.ok(!response.is_overflow);
  const bits = Buffer.from(groupData(env.store, 1).cell_states, 'base64');
  assert.equal(bits.toString('hex'), '78');
  assert.equal(hasBit(bits, 4), true);
  assert.equal(env.store.read().resources.get('101500').num, '500');

  env.reopen();
  const reopened = env.service();
  assert.equal(Buffer.from(groupData(env.store, 1).cell_states, 'base64').toString('hex'), '78');
  rejected(() => reopened.execute(83201, [1, 4]), 51902);
  assert.equal(env.store.read().resources.get('101500').num, '500');
});

test('rejects invalid cells, locked groups and insufficient material without mutation', t => {
  const env = setup(t), service = env.service();
  addResource(env.store, '101500', 999);
  service.ensureLoginState();
  const before = cabinData(env.store);

  rejected(() => service.execute(83201, [1, 1]), 51901);
  rejected(() => service.execute(83201, [1, 5]), 51901);
  rejected(() => service.execute(83201, [99, 4]), 51901);
  rejected(() => service.execute(83201, [1, 4]), 301);
  assert.deepEqual(cabinData(env.store), before);
  assert.equal(env.store.read().resources.get('101500').num, '999');

  const locked = setup(t, { level: 42 });
  const lockedService = locked.service();
  lockedService.ensureLoginState();
  addResource(locked.store, '101500', 1000);
  rejected(() => lockedService.execute(83201, [5, 4]), 1);
  assert.equal(locked.store.read().resources.get('101500').num, '1000');
});

test('places, repeats and clears a matching camp hero through module 114', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const request = { place_groups: [{ group_id: 1, cell_index_list: [1], hero_uid_list: ['1020601'] }] };

  let response = codec.unpack('pb_campsite_data', service.execute(83202, request).data);
  assert.deepEqual(response.groups_data.map(group => Number(group.group_id)), [1]);
  assert.deepEqual(response.groups_data[0].hero_list, ['1020601', '0', '0', '0']);
  assert.deepEqual(groupData(env.store, 1).hero_list, ['1020601', '0', '0', '0']);

  const repeated = codec.unpack('pb_campsite_data', service.execute(83202, request).data);
  assert.deepEqual(repeated.groups_data[0].hero_list, ['1020601', '0', '0', '0']);
  assert.deepEqual(groupData(env.store, 1).hero_list, ['1020601', '0', '0', '0']);

  response = codec.unpack('pb_campsite_data', service.execute(83202, {
    place_groups: [{ group_id: 1, cell_index_list: [1], hero_uid_list: ['0'] }]
  }).data);
  assert.deepEqual(response.groups_data[0].hero_list, ['0', '0', '0', '0']);
  assert.deepEqual(groupData(env.store, 1).hero_list, ['0', '0', '0', '0']);

  service.execute(83202, request);
  env.reopen();
  assert.deepEqual(groupData(env.store, 1).hero_list, ['1020601', '0', '0', '0']);
});

test('swaps and explicitly moves placed heroes atomically', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const place = pairs => service.execute(83202, {
    place_groups: [{
      group_id: 1,
      cell_index_list: pairs.map(pair => pair[0]),
      hero_uid_list: pairs.map(pair => pair[1])
    }]
  });

  place([[1, '1020601'], [2, '1020301']]);
  let response = codec.unpack('pb_campsite_data', place([[1, '1020301'], [2, '1020601']]).data);
  assert.deepEqual(response.groups_data[0].hero_list, ['1020301', '1020601', '0', '0']);
  assert.deepEqual(groupData(env.store, 1).hero_list, ['1020301', '1020601', '0', '0']);

  response = codec.unpack('pb_campsite_data', place([[1, '0'], [2, '1020301']]).data);
  assert.deepEqual(response.groups_data[0].hero_list, ['0', '1020301', '0', '0']);
  assert.deepEqual(groupData(env.store, 1).hero_list, ['0', '1020301', '0', '0']);

  const before = cabinData(env.store);
  rejected(() => place([[1, '1020301']]), 1);
  assert.deepEqual(cabinData(env.store), before);

  env.reopen();
  assert.deepEqual(groupData(env.store, 1).hero_list, ['0', '1020301', '0', '0']);
});

test('enforces camp, profession, hero existence and unlocked-cell rules', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const place = (groupId, cell, uid) => service.execute(83202, {
    place_groups: [{ group_id: groupId, cell_index_list: [cell], hero_uid_list: [uid] }]
  });

  rejected(() => place(1, 1, '2010101'), 51904);
  rejected(() => place(5, 1, '1020601'), 51904);
  rejected(() => place(1, 1, '999999'), 3001);
  rejected(() => place(1, 4, '1020601'), 51903);
  assert.deepEqual(cabinData(env.store).groups_data.every(group => group.hero_list.every(uid => uid === '0')), true);
});

test('applies one-key batches across groups atomically', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const response = codec.unpack('pb_campsite_data', service.execute(83202, {
    place_groups: [
      { group_id: 1, cell_index_list: [1, 2], hero_uid_list: ['1020601', '1020301'] },
      { group_id: 5, cell_index_list: [1], hero_uid_list: ['2010101'] },
      { group_id: 9, cell_index_list: [], hero_uid_list: [] }
    ]
  }).data);
  assert.deepEqual(response.groups_data.map(group => Number(group.group_id)), [1, 5, 9]);
  assert.deepEqual(groupData(env.store, 1).hero_list, ['1020601', '1020301', '0', '0']);
  assert.deepEqual(groupData(env.store, 5).hero_list, ['2010101', '0', '0', '0']);
  assert.deepEqual(groupData(env.store, 9).hero_list, ['0', '0', '0', '0']);

  const before = cabinData(env.store);
  rejected(() => service.execute(83202, {
    place_groups: [
      { group_id: 1, cell_index_list: [3], hero_uid_list: ['4030801'] },
      { group_id: 5, cell_index_list: [2], hero_uid_list: ['1020601'] }
    ]
  }), 51904);
  assert.deepEqual(cabinData(env.store), before);
});

test('rejects malformed and conflicting place batches before writing', t => {
  const env = setup(t), service = env.service();
  service.ensureLoginState();
  const before = cabinData(env.store);
  rejected(() => service.execute(83202, { place_groups: [] }), 1);
  rejected(() => service.execute(83202, { place_groups: [{ group_id: 1, cell_index_list: [1, 2], hero_uid_list: ['1020601'] }] }), 1);
  rejected(() => service.execute(83202, { place_groups: [{ group_id: 1, cell_index_list: [0], hero_uid_list: ['1020601'] }] }), 1);
  rejected(() => service.execute(83202, {
    place_groups: [
      { group_id: 1, cell_index_list: [1], hero_uid_list: ['1020601'] },
      { group_id: 1, cell_index_list: [2], hero_uid_list: ['1020301'] }
    ]
  }), 1);
  rejected(() => service.execute(83202, {
    place_groups: [
      { group_id: 1, cell_index_list: [1], hero_uid_list: ['1020601'] },
      { group_id: 5, cell_index_list: [1], hero_uid_list: ['1020601'] }
    ]
  }), 51904);
  rejected(() => service.execute(83202, {
    place_groups: [{ group_id: 1, cell_index_list: [1, 1], hero_uid_list: ['1020601', '1020301'] }]
  }), 1);
  assert.deepEqual(cabinData(env.store), before);
  assert.equal(service.supports(83203), false);
  rejected(() => service.execute(83203, []), 1);
});

test('rolls back module 114 and the spent resource when encoding fails', t => {
  const env = setup(t), service = env.service();
  addResource(env.store, '101500', 1000);
  service.ensureLoginState();
  const before = cabinData(env.store);
  const brokenResponse = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_res_to_client') throw new Error('forced cabin response encode failure');
      return codec.pack(name, value);
    }
  };
  assert.throws(() => env.service({ codec: brokenResponse }).execute(83201, [1, 4]), /forced cabin response encode failure/);
  assert.deepEqual(cabinData(env.store), before);
  assert.equal(env.store.read().resources.get('101500').num, '1000');

  const brokenState = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_campsite_data') throw new Error('forced cabin state encode failure');
      return codec.pack(name, value);
    }
  };
  assert.throws(() => env.service({ codec: brokenState }).execute(83202, {
    place_groups: [{ group_id: 1, cell_index_list: [1], hero_uid_list: ['1020601'] }]
  }), /forced cabin state encode failure/);
  assert.deepEqual(cabinData(env.store), before);
});

test('rolls back module 114 and the spent resource when SQLite rejects the write', t => {
  const env = setup(t), service = env.service();
  addResource(env.store, '101500', 1000);
  service.ensureLoginState();
  const before = cabinData(env.store);
  env.store.inspect(db => db.exec(
    "CREATE TRIGGER reject_cabin_resource_write BEFORE INSERT ON resources BEGIN SELECT RAISE(ABORT, 'Injected cabin storage failure'); END;"
  ));

  assert.throws(() => service.execute(83201, [1, 4]), /Injected cabin storage failure/);
  assert.deepEqual(cabinData(env.store), before);
  assert.equal(env.store.read().resources.get('101500').num, '1000');
});
