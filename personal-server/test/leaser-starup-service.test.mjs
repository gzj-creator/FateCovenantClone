import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import {
  binary, createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary
} from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { readLeaserStarUpTables } from '../config/leaser-starup-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createLeaserStarUpService, LEASER_STAR_UP_COMMANDS } from '../game/leaser-starup-service.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readLeaserStarUpTables();
const gameTables = readGameTables();
const FIXED_SECONDS = 1_792_789_200;
const FIXED_NOW = FIXED_SECONDS * 1000;
const HERO_MODULE = 143;
const LEASE_MODULE = 179;
const STAR_UP_MODULE = 180;

const GENERIC = Object.freeze({
  2: Object.freeze({ schema: 'pb_lease_artifact', field: 'lease_artifact' }),
  3: Object.freeze({ schema: 'pb_lease_pet', field: 'lease_pet' }),
  4: Object.freeze({ schema: 'pb_lease_elves', field: 'lease_elves' })
});

function setup(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-leaser-starup-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = options => createSeed(codec, {
    ...options,
    createdAt: FIXED_SECONDS,
    roleName: 'Leaser Star-Up Test'
  });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  let clockNow = FIXED_NOW;
  const make = () => createLeaserStarUpService({
    store, codec, tables, resourceTables: gameTables, now: () => clockNow
  });
  make().ensureLoginState();
  t.after(() => {
    try { store.close(); } catch {}
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    databasePath,
    seed,
    get store() { return store; },
    make,
    setNow(value) { clockNow = Number(value); },
    reopen() {
      store.close();
      store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
    }
  };
}

function emptyHeroState() {
  return {
    func_tid: 7,
    lease_heroes: [],
    place_heroes: [],
    stamp: 0,
    total_lease_times: 0,
    lease_award_times: 0,
    last_lease_uid: 0
  };
}

function setResource(env, tid, num) {
  env.store.transaction(model => grantResources(model, [[tid, num]], gameTables, { codec }));
}

function genericObject(def, starRow) {
  return {
    tid: String(def.developTid),
    star: starRow.star,
    quality: starRow.quality,
    ...(def.type === 3 ? { core_slots: [], global_attr: [] } : {}),
    ...(def.type === 4 ? { bead_slots: [], global_attr: [] } : {}),
    ...(def.type === 2 ? { global_attr: [] } : {})
  };
}

function configTransition(def, currentIndex = 0) {
  const current = def.starRows[currentIndex];
  const next = def.starRows[currentIndex + 1];
  assert.ok(current && next, `Missing star transition for ${def.leaseKind}`);
  return { current, next };
}

function installHeroLease(env, def, current) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE);
    while (module.value.length < 7) module.value.push(serializedBinary(Buffer.alloc(0)));
    const hero = {
      lease_tid: 7,
      owner_id: '900001',
      hero_tid: def.developTid,
      star: current.star,
      quality: current.quality,
      uid: def.developTid,
      level: 80,
      attr: []
    };
    const state = emptyHeroState();
    state.lease_heroes.push({ hero, lease_stamp: 1, hero_tid: def.developTid, use_info: [] });
    module.value[5] = serializedBinary(codec.pack('pb_role_lease_hero', state));
    model.state.modules.value = [...modules];

    const team = {
      team_id: 1,
      max_power: '0',
      fighter_list: [],
      artifact_list: [],
      power: '0',
      lease_fighter_list: [{ loc: 1, hero: structuredClone(hero), replace_hero_id: '0' }],
      pet_list: [],
      elves_list: [],
      lease_pet: [],
      lease_elves: [],
      lease_artifact: []
    };
    model.playLineups = [{ type: 1, team_list: [structuredClone(team)], custom_attr: [], custom_lineup_index: 0, select_camp: 0 }];
    model.lineups = {
      pre_lineups: [{ index: 1, lineup: { team_list: [structuredClone(team)] }, select_camp: 0 }],
      cur_pre_index: 1,
      pre_lineups_standby: [{ index: 2, lineup: { team_list: [structuredClone(team)] }, select_camp: 0 }],
      version: 1
    };
  });
}

function installGenericLeases(env, entries) {
  env.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(LEASE_MODULE);
    const state = module.value[0] && rawBinary(module.value[0]).length
      ? codec.unpack('pb_lease_role', rawBinary(module.value[0]))
      : { func_tid: 1, unit_role: [], day_flush_stamp: 0 };
    state.unit_role ??= [];
    const units = {};
    for (const { def, current } of entries) {
      const contract = GENERIC[def.type];
      const object = genericObject(def, current);
      const unit = codec.pack(contract.schema, object).toString('base64');
      let role = state.unit_role.find(candidate => Number(candidate.type) === def.type);
      if (!role) {
        role = { type: def.type, place_info: [], take_info: [] };
        state.unit_role.push(role);
      }
      role.take_info.push({ unit, lease_stamp: 1, unit_id: def.developTid, use_info: [] });
      units[contract.field] = [{ type: def.type, unit, tid: def.developTid }];
    }
    module.value[0] = serializedBinary(codec.pack('pb_lease_role', state));
    model.state.modules.value = [...modules];

    const team = {
      team_id: 1,
      max_power: '0',
      fighter_list: [],
      artifact_list: [],
      power: '0',
      lease_fighter_list: [],
      pet_list: [],
      elves_list: [],
      lease_pet: units.lease_pet ?? [],
      lease_elves: units.lease_elves ?? [],
      lease_artifact: units.lease_artifact ?? []
    };
    model.playLineups = [{ type: 1, team_list: [structuredClone(team)], custom_attr: [], custom_lineup_index: 0, select_camp: 0 }];
    model.lineups = {
      pre_lineups: [{ index: 1, lineup: { team_list: [structuredClone(team)] }, select_camp: 0 }],
      cur_pre_index: 1,
      pre_lineups_standby: [{ index: 2, lineup: { team_list: [structuredClone(team)] }, select_camp: 0 }],
      version: 1
    };
  });
}

function moduleState(store, moduleId) {
  const module = new Map(store.read().state.modules.value).get(moduleId);
  return module ?? null;
}

function heroLeaseState(store) {
  return codec.unpack('pb_role_lease_hero', rawBinary(moduleState(store, HERO_MODULE).value[5]));
}

function genericLeaseState(store) {
  return codec.unpack('pb_lease_role', rawBinary(moduleState(store, LEASE_MODULE).value[0]));
}

function resourceSnapshot(store) {
  return Object.fromEntries([...store.read().resources].map(([tid, value]) => [tid, structuredClone(value)]));
}

function leaseSnapshot(store) {
  const model = store.read();
  return {
    modules: [HERO_MODULE, LEASE_MODULE, STAR_UP_MODULE].map(id => [id, moduleState(store, id)]),
    resources: resourceSnapshot(store),
    lineups: structuredClone(model.lineups),
    playLineups: structuredClone(model.playLineups),
    permanentHeroes: structuredClone(model.heroInfo),
    otherModules: model.state.modules.value.filter(([id]) => ![HERO_MODULE, LEASE_MODULE, STAR_UP_MODULE].includes(Number(id))).map(([id, value]) => [id, structuredClone(value)])
  };
}

function directDecode(service, bytes, type = 101201) {
  return service.decode(type, bytes, {
    unpack: (schema, payload) => codec.unpack(schema, payload),
    etf: async data => { const decoded = await decodeEtf(data); return decoded?.value ?? decoded; }
  });
}

test('LeaserStarUpTable exposes all twelve tables and a unique develop id for every object', () => {
  assert.deepEqual(tables.counts, {
    Type: 4,
    TypeInfo: 4,
    Const: 1,
    Hero: 65,
    Artifact: 12,
    Pet: 9,
    Elves: 9,
    HeroStar: 727,
    ArtifactStar: 124,
    PetStar: 88,
    ElvesStar: 88,
    Reset: 60
  });
  assert.deepEqual([...LEASER_STAR_UP_COMMANDS], [101201, 101202]);
  assert.equal(tables.leaserFunc, 1);
  assert.equal(tables.heroLeaserFunc, 7);
  assert.equal(tables.resetCustomLimit, null);
  assert.equal(tables.definitionsByDevelopTid.size, 95);
  assert.deepEqual([...tables.definitionsByType].map(([type, rows]) => [type, rows.size]), [[1, 65], [2, 12], [3, 9], [4, 9]]);
  assert.deepEqual([...new Set([...tables.definitionsByDevelopTid.values()].map(def => def.costItem))].sort((a, b) => a - b), [7401900, 7501900, 7601900, 7701900]);
  assert.equal(tables.definitionForDevelopTid(1040201).configTid, 64);
  assert.equal(tables.definitionForConfigTid(1, 16).developTid, 1010101);
  assert.equal(tables.freeTimes, 2);
  assert.equal(tables.resetByVersion.get(1).length, 60);
});

test('login initializes reset state and preserves empty lease containers without fabricating objects', t => {
  const env = setup(t);
  const state = moduleState(env.store, STAR_UP_MODULE);
  const reset = codec.unpack('pb_leaser_star_up', rawBinary(state));
  assert.equal(reset.reset_list.length, 1);
  assert.equal(reset.reset_list[0].version, 1);
  assert.equal(Number(reset.reset_list[0].last_reset_refresh_time ?? 0), 0);
  assert.equal(Number(reset.reset_list[0].cur_reset_times ?? 0), 0);
  assert.equal(moduleState(env.store, HERO_MODULE).value.length, 7);
  assert.ok(moduleState(env.store, HERO_MODULE).value.every(slot => rawBinary(slot).length === 0));
  assert.equal(moduleState(env.store, LEASE_MODULE).value.length, 1);
  assert.equal(rawBinary(moduleState(env.store, LEASE_MODULE).value[0]).length, 0);
});

test('hero star-up consumes the exact next-row cost and updates only leased copies', t => {
  const env = setup(t);
  const def = [...tables.definitionsByDevelopTid.values()].find(value => value.type === 1 && value.starRows.length > 1);
  const { current, next } = configTransition(def);
  installHeroLease(env, def, current);
  setResource(env, def.costItem, next.costNum + 7);
  const permanentBefore = structuredClone(env.store.read().heroInfo);
  const otherModulesBefore = leaseSnapshot(env.store).otherModules;

  const result = env.make().execute(101201, { version: 1, tid: def.developTid });
  const unpacked = codec.unpack('pb_leaser_star_up_rev', result.data);
  const hero = heroLeaseState(env.store).lease_heroes[0].hero;
  assert.deepEqual([hero.quality, hero.star], [next.quality, next.star]);
  assert.equal(unpacked.res.changes[0].diff_num, String(-next.costNum));
  assert.equal(resourceSnapshot(env.store)[String(def.costItem)].num, '7');
  assert.equal(unpacked.hero_lease_ret.lease.lease_heroes[0].hero.star, next.star);
  assert.equal(unpacked.hero_lease_ret.lineup.length, 1);
  assert.equal(unpacked.hero_lease_ret.lineup[0].team_list[0].lease_fighter_list[0].hero.star, next.star);
  assert.deepEqual(env.store.read().heroInfo, permanentBefore);
  assert.deepEqual(leaseSnapshot(env.store).otherModules, otherModulesBefore);

  const model = env.store.read();
  for (const preset of [model.lineups.pre_lineups[0], model.lineups.pre_lineups_standby[0]]) {
    assert.equal(preset.lineup.team_list[0].lease_fighter_list[0].hero.star, next.star);
    assert.equal(preset.lineup.team_list[0].lease_fighter_list[0].hero.quality, next.quality);
  }
  env.reopen();
  assert.equal(heroLeaseState(env.store).lease_heroes[0].hero.star, next.star);
});

test('artifact, pet and elves star-up update module 179 and all lineup copies, including quality crossing', t => {
  const env = setup(t);
  const defs = [2, 3, 4].map(type => [...tables.definitionsByDevelopTid.values()].find(def => def.type === type));
  const transitions = defs.map(def => configTransition(def));
  const crossingIndex = defs[2].starRows.findIndex((row, index, rows) => rows[index + 1] && rows[index + 1].quality !== row.quality);
  assert.ok(crossingIndex >= 0);
  transitions[2] = configTransition(defs[2], crossingIndex);
  installGenericLeases(env, defs.map((def, index) => ({ def, current: transitions[index].current })));
  for (let index = 0; index < defs.length; index++) setResource(env, defs[index].costItem, transitions[index].next.costNum + 5);
  const otherModulesBefore = leaseSnapshot(env.store).otherModules;

  for (let index = 0; index < defs.length; index++) {
    const def = defs[index], next = transitions[index].next;
    const result = env.make().execute(101201, { version: 1, tid: def.developTid });
    const unpacked = codec.unpack('pb_leaser_star_up_rev', result.data);
    assert.equal(unpacked.res.changes[0].diff_num, String(-next.costNum));
    assert.equal(unpacked.lease_ret.changed_lineups.length, 1);
    const state = genericLeaseState(env.store);
    const role = state.unit_role.find(row => Number(row.type) === def.type);
    const object = codec.unpack(GENERIC[def.type].schema, Buffer.from(role.take_info[0].unit, 'base64'));
    assert.deepEqual([object.quality, object.star], [next.quality, next.star]);
    assert.equal(state.unit_role.filter(row => Number(row.type) === def.type).length, 1);
  }

  const model = env.store.read();
  for (const roster of [model.playLineups[0], model.lineups.pre_lineups[0].lineup, model.lineups.pre_lineups_standby[0].lineup]) {
    const team = roster.team_list[0];
    for (const def of defs) {
      const unit = team[GENERIC[def.type].field][0];
      const object = codec.unpack(GENERIC[def.type].schema, Buffer.from(unit.unit, 'base64'));
      const next = transitions.find((_, index) => defs[index] === def).next;
      assert.deepEqual([object.quality, object.star], [next.quality, next.star]);
    }
  }
  assert.deepEqual(leaseSnapshot(env.store).otherModules, otherModulesBefore);
  env.reopen();
  assert.equal(genericLeaseState(env.store).unit_role.length, 3);
});

test('101202 resets a real hero upgrade history, refunds every configured row and persists login state', t => {
  const env = setup(t);
  const def = tables.definitionForDevelopTid(1040101);
  const current = def.starRows[2];
  const refund = def.starRows[1].costNum + def.starRows[2].costNum;
  installHeroLease(env, def, current);
  setResource(env, def.costItem, 7);
  setResource(env, 101500, 500);
  const permanentBefore = structuredClone(env.store.read().heroInfo);
  const otherModulesBefore = leaseSnapshot(env.store).otherModules;

  const result = env.make().execute(101202, { version: 1, tid: def.developTid });
  const unpacked = codec.unpack('pb_leaser_star_up_reset_rev', result.data);
  const hero = heroLeaseState(env.store).lease_heroes[0].hero;
  assert.deepEqual([hero.quality, hero.star], [6, 5]);
  assert.equal(unpacked.res.changes.find(change => change.tid === String(def.costItem)).diff_num, String(refund));
  assert.equal(resourceSnapshot(env.store)[String(def.costItem)].num, String(refund + 7));
  assert.equal(resourceSnapshot(env.store)['101500'].num, '500');
  assert.deepEqual(unpacked.reset_data, {
    version: 1,
    last_reset_refresh_time: String(FIXED_SECONDS),
    cur_reset_times: 1
  });
  assert.deepEqual([
    unpacked.hero_lease_ret.lease.lease_heroes[0].hero.quality,
    unpacked.hero_lease_ret.lease.lease_heroes[0].hero.star
  ], [6, 5]);
  assert.equal(unpacked.hero_lease_ret.lineup[0].team_list[0].lease_fighter_list[0].hero.star, 5);
  assert.deepEqual(env.store.read().heroInfo, permanentBefore);
  assert.deepEqual(leaseSnapshot(env.store).otherModules, otherModulesBefore);

  const persisted = codec.unpack('pb_leaser_star_up', rawBinary(moduleState(env.store, STAR_UP_MODULE)));
  assert.deepEqual(persisted.reset_list, unpacked.reset_data ? [unpacked.reset_data] : []);
  env.reopen();
  assert.equal(heroLeaseState(env.store).lease_heroes[0].hero.star, 5);
});

test('101202 applies free and paid daily reset rows, a new day restores free uses, and every rejection is atomic', t => {
  const env = setup(t);
  const def = tables.definitionForDevelopTid(1040101);
  const current = def.starRows[2];
  const refund = def.starRows[1].costNum + def.starRows[2].costNum;

  installHeroLease(env, def, current);
  assert.equal(env.make().execute(101202, { version: 1, tid: def.developTid }).value.reset_data.cur_reset_times, 1);
  installHeroLease(env, def, current);
  assert.throws(() => env.make().execute(101202, { version: 2, tid: def.developTid }), error => error.code === 5);
  assert.throws(() => env.make().execute(101202, { version: 1, tid: 999999999 }), error => error.code === 5);
  assert.equal(env.make().execute(101202, { version: 1, tid: def.developTid }).value.reset_data.cur_reset_times, 2);

  installHeroLease(env, def, current);
  const beforeNoDiamond = leaseSnapshot(env.store);
  assert.throws(() => env.make().execute(101202, { version: 1, tid: def.developTid }), error => error.code === 301);
  assert.deepEqual(leaseSnapshot(env.store), beforeNoDiamond);

  setResource(env, 101500, 100);
  const third = env.make().execute(101202, { version: 1, tid: def.developTid });
  assert.equal(third.value.reset_data.cur_reset_times, 3);
  assert.equal(third.value.res.changes.find(change => change.tid === '101500').diff_num, '-100');
  assert.equal(resourceSnapshot(env.store)[String(def.costItem)].num, String(refund * 3));

  env.setNow(FIXED_NOW + 86_400_000);
  installHeroLease(env, def, current);
  const nextDay = env.make().execute(101202, { version: 1, tid: def.developTid });
  assert.equal(nextDay.value.reset_data.cur_reset_times, 1);
  assert.equal(nextDay.value.res.changes.some(change => change.tid === '101500'), false);

  installHeroLease(env, def, def.starRows[0]);
  const beforeAlreadyBase = leaseSnapshot(env.store);
  assert.throws(() => env.make().execute(101202, { version: 1, tid: def.developTid }), error => error.code === 5);
  assert.deepEqual(leaseSnapshot(env.store), beforeAlreadyBase);
});

test('101202 resets artifacts, pets and elves through the shared lease/store transaction', t => {
  const env = setup(t);
  const defs = [2, 3, 4].map(type => [...tables.definitionsByType.get(type).values()].find(def => def.starRows.length > 2));
  installGenericLeases(env, defs.map(def => ({ def, current: def.starRows[2] })));
  setResource(env, 101500, 100);

  for (let index = 0; index < defs.length; index++) {
    const def = defs[index];
    const result = env.make().execute(101202, { version: 1, tid: def.developTid });
    const state = genericLeaseState(env.store);
    const role = state.unit_role.find(row => Number(row.type) === def.type);
    const object = codec.unpack(GENERIC[def.type].schema, Buffer.from(role.take_info[0].unit, 'base64'));
    assert.deepEqual([object.quality, Number(object.star ?? 0)], [def.starRows[0].quality, def.starRows[0].star]);
    assert.equal(result.value.reset_data.cur_reset_times, index + 1);
  }
  assert.equal(resourceSnapshot(env.store)['101500'].num, '0');
  const lineup = env.store.read().playLineups[0].team_list[0];
  for (const def of defs) {
    const field = GENERIC[def.type].field;
    const object = codec.unpack(GENERIC[def.type].schema, Buffer.from(lineup[field][0].unit, 'base64'));
    assert.deepEqual([object.quality, Number(object.star ?? 0)], [def.starRows[0].quality, def.starRows[0].star]);
  }
  env.reopen();
  assert.equal(genericLeaseState(env.store).unit_role.length, 3);
});

test('101202 response encoding failure rolls back the reset fee, refund, object and daily counter', t => {
  const env = setup(t);
  const def = tables.definitionForDevelopTid(1040101);
  installHeroLease(env, def, def.starRows[2]);
  setResource(env, 101500, 100);
  const before = leaseSnapshot(env.store);
  const brokenCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_leaser_star_up_reset_rev') throw new Error('reset response encode failure');
      return codec.pack(name, value);
    }
  };
  const service = createLeaserStarUpService({
    store: env.store, codec: brokenCodec, tables, resourceTables: gameTables, now: () => FIXED_NOW
  });
  assert.throws(() => service.execute(101202, { version: 1, tid: def.developTid }), /reset response encode failure/);
  assert.deepEqual(leaseSnapshot(env.store), before);
});

test('unknown, absent, invalid, max-star, insufficient and post-cost failures are fail-closed and atomic', t => {
  const env = setup(t);
  const def = [...tables.definitionsByDevelopTid.values()].find(value => value.type === 1);
  setResource(env, def.costItem, 10000);
  assert.throws(() => env.make().execute(101201, { version: 1, tid: def.developTid }), error => error.code === 5);
  assert.throws(() => env.make().execute(101201, { version: 2, tid: def.developTid }), error => error.code === 5);
  assert.throws(() => env.make().execute(101201, { version: 1, tid: 999999999 }), error => error.code === 5);
  assert.equal(env.make().supports(101202), true);

  const first = def.starRows[0], last = def.starRows.at(-1);
  installHeroLease(env, def, { ...first, quality: 9, star: 9 });
  assert.throws(() => env.make().execute(101201, { version: 1, tid: def.developTid }), error => error.code === 5);
  installHeroLease(env, def, last);
  assert.throws(() => env.make().execute(101201, { version: 1, tid: def.developTid }), error => error.code === 5);

  const next = def.starRows[1];
  installHeroLease(env, def, first);
  env.store.transaction(model => { model.resources.get(String(def.costItem)).num = String(next.costNum - 1); });
  let before = leaseSnapshot(env.store);
  assert.throws(() => env.make().execute(101201, { version: 1, tid: def.developTid }), error => error.code === 301);
  assert.deepEqual(leaseSnapshot(env.store), before);

  const generic = [...tables.definitionsByDevelopTid.values()].find(value => value.type === 4);
  const transition = configTransition(generic);
  installGenericLeases(env, [{ def: generic, current: transition.current }]);
  setResource(env, generic.costItem, transition.next.costNum + 1);
  env.store.transaction(model => {
    model.playLineups[0].team_list[0].lease_elves[0].unit = Buffer.from([0xff]).toString('base64');
  });
  before = leaseSnapshot(env.store);
  assert.throws(() => env.make().execute(101201, { version: 1, tid: generic.developTid }), error => error.code === 5);
  assert.deepEqual(leaseSnapshot(env.store), before);
});

test('101201 and 101202 accept both the client ETF-binary envelope and direct protobuf bytes', async t => {
  const env = setup(t);
  const request = codec.pack('pb_leaser_star_up_req', { version: 1, tid: 1040201 });
  const direct = await directDecode(env.make(), request);
  const wrapped = await directDecode(env.make(), await encodeEtf(binary(request)));
  assert.equal(direct.version, 1);
  assert.equal(direct.tid, '1040201');
  assert.deepEqual(wrapped, direct);
  const reset = codec.pack('pb_leaser_star_up_reset_req', { version: 1, tid: 1040201 });
  const resetDirect = await directDecode(env.make(), reset, 101202);
  const resetWrapped = await directDecode(env.make(), await encodeEtf(binary(reset)), 101202);
  assert.deepEqual(resetWrapped, resetDirect);
  assert.equal(env.make().requestSchema(101202), 'pb_leaser_star_up_reset_req');
});

function gatewayClient(socket) {
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
  const request = async (type, seq, data = Buffer.alloc(0)) => {
    send(codec.pack('pb_c2s', { type, seq, data }));
    for (;;) {
      const response = codec.unpack('pb_s2c', await next());
      if (response.seq === seq) return response;
    }
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
  return { next, request, handshake };
}

test('real gateway routes ETF 101201 and 101202 with login persistence', { timeout: 10000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-leaser-starup-gateway-'));
  const databasePath = path.join(directory, 'game.sqlite'), statePath = path.join(directory, 'absent.json');
  const def = [...tables.definitionsByDevelopTid.values()].find(value => value.type === 1);
  const { current, next } = configTransition(def);
  const seed = options => createSeed(codec, { ...options, createdAt: FIXED_SECONDS, roleName: 'Leaser Star-Up Gateway' });
  let store = createGameStore({ databasePath, seed, codec, now: () => FIXED_NOW });
  const roleId = store.state().roleId;
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(HERO_MODULE);
    while (module.value.length < 7) module.value.push(serializedBinary(Buffer.alloc(0)));
    const state = emptyHeroState();
    state.lease_heroes.push({
      hero: { lease_tid: 7, owner_id: 900001, hero_tid: def.developTid, star: current.star, quality: current.quality, uid: def.developTid, level: 80, attr: [] },
      lease_stamp: 1, hero_tid: def.developTid, use_info: []
    });
    module.value[5] = serializedBinary(codec.pack('pb_role_lease_hero', state));
    model.state.modules.value = [...modules];
    grantResources(model, [[def.costItem, next.costNum + 3]], gameTables, { codec });
  });
  store.inspect(db => {
    db.prepare('DELETE FROM accounts').run();
    db.prepare('INSERT INTO accounts(account_id,role_id,login_code,phone,created_at,updated_at) VALUES(?,?,?,?,?,?)')
      .run('leaser-gateway', roleId, 'leaser-gateway', '', new Date(FIXED_NOW).toISOString(), new Date(FIXED_NOW).toISOString());
  });
  store.close();

  const game = createLocalGame({
    databasePath,
    statePath,
    capturePath: new URL('../fixtures/login-modules.seed.json', import.meta.url),
    serverOpenedAt: FIXED_SECONDS,
    now: () => FIXED_NOW,
    resolveSession: (uid, token) => token === 'leaser-session' && uid === 'leaser-gateway' ? { userId: uid, loginCode: uid } : null
  });
  let socket;
  t.after(async () => {
    socket?.destroy();
    await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  await once(socket, 'connect');
  const peer = gatewayClient(socket);
  await peer.handshake();
  const login = await peer.request(909103, 1, codec.pack('login', {
    server_id: 1, channel_uid: 'leaser-gateway', verify_code: 'leaser-session', channel_extra: ''
  }));
  assert.equal(login.err, undefined);
  const loginPayload = await decodeEtf(Buffer.from(login.data, 'base64'));
  const modules = new Map(loginPayload[2].value);
  assert.equal(Buffer.from(modules.get(STAR_UP_MODULE).value).length > 0, true);
  assert.equal(Buffer.from(modules.get(HERO_MODULE).value[5].value).length > 0, true);

  const request = codec.pack('pb_leaser_star_up_req', { version: 1, tid: def.developTid });
  const response = await peer.request(101201, 2, await encodeEtf(binary(request)));
  assert.equal(response.err, undefined);
  const updated = codec.unpack('pb_leaser_star_up_rev', Buffer.from(response.data, 'base64'));
  assert.equal(updated.res.changes[0].diff_num, String(-next.costNum));
  assert.equal(updated.hero_lease_ret.lease.lease_heroes[0].hero.star, next.star);

  const resetResponse = await peer.request(101202, 3, await encodeEtf(binary(codec.pack('pb_leaser_star_up_reset_req', {
    version: 1, tid: def.developTid
  }))));
  assert.equal(resetResponse.err, undefined);
  const reset = codec.unpack('pb_leaser_star_up_reset_rev', Buffer.from(resetResponse.data, 'base64'));
  assert.equal(reset.hero_lease_ret.lease.lease_heroes[0].hero.star, current.star);
  assert.equal(reset.reset_data.cur_reset_times, 1);
  assert.equal(reset.res.changes.find(change => change.tid === String(def.costItem)).diff_num, String(next.costNum));

  const refused = await peer.request(101202, 4, await encodeEtf(binary(codec.pack('pb_leaser_star_up_reset_req', {
    version: 1, tid: def.developTid
  }))));
  assert.equal(refused.err.err, 5);
  assert.equal(refused.data ?? '', '');
});
