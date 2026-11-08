import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createPetService } from '../game/pet-service.mjs';
import { createTreasureService } from '../game/treasure-service.mjs';
import { createElvesService } from '../game/elves-service.mjs';
import { createElvesBeadService } from '../game/elves-bead-service.mjs';
import { createWarRuneService } from '../game/war-rune-service.mjs';
import { createMuseumService } from '../game/museum-service.mjs';
import { createDevelopExtraService } from '../game/develop-extra-service.mjs';
import { createLeaderEquipDevelopService } from '../game/leader-equip-develop-service.mjs';
import { createEquipService } from '../game/equip-service.mjs';
import { readEquipTables } from '../config/equip-tables.mjs';

const codec = createGameCodec();

function addResource(store, tid, num, group = 1) {
  store.transaction(model => {
    const groups = new Map(model.state.modules.value).get(6).value;
    while (groups.length <= group) groups.push({ value: [], improper: false });
    const entry = groups[group].value.length;
    groups[group].value.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
  });
}

function moduleData(store, moduleId, schema) {
  const module = new Map(store.state().modules.value).get(moduleId);
  const target = Array.isArray(module?.value) ? module.value[0] : module;
  const bytes = rawBinary(target);
  return bytes.length ? codec.unpack(schema, bytes) : {};
}

function editModule(store, moduleId, schema, mutate) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(moduleId);
    const slotted = Array.isArray(module?.value);
    const target = slotted ? module.value[0] : module;
    const bytes = rawBinary(target);
    const data = bytes.length ? codec.unpack(schema, bytes) : {};
    mutate(data);
    if (slotted) {
      module.value[0] = serializedBinary(codec.pack(schema, data));
      modules.set(moduleId, module);
    } else {
      modules.set(moduleId, serializedBinary(codec.pack(schema, data)));
    }
    model.state.modules.value = [...modules];
  });
}

function setup(t, prefix) {
  const fixture = createGameFixture(t, codec, { prefix });
  return { get store() { return fixture.store; }, reopen: () => fixture.open() };
}

test('pet 90731 combines a pet with its chip and survives reopen', t => {
  const env = setup(t, 'fc-pet-');
  addResource(env.store, 100114, 10);
  const service = createPetService({ store: env.store, codec });
  const result = service.execute(90731, 100113);
  const body = codec.unpack('pb_rsp_pet_develop', result.data);
  assert.equal(Number(body.pet.tid), 100113);
  assert.equal(body.res_change.changes[0].tid, '100114');
  const reopened = env.reopen();
  const data = moduleData(reopened, 158, 'pb_pet_develop_data');
  assert.equal(data.pets.length, 1);
  assert.equal(Number(data.pets[0].tid), 100113);
  assert.throws(() => createPetService({ store: reopened, codec }).execute(90731, 100113), error => error.code === 1);
});

test('pet 90734 level-up enforces the cap and rejects a short wallet', t => {
  const env = setup(t, 'fc-pet-level-');
  addResource(env.store, 100114, 10);
  const service = createPetService({ store: env.store, codec });
  service.execute(90731, 100113);
  const result = service.execute(90734, { pet_tid: 100113, level_count: 2 });
  const body = codec.unpack('pb_rsp_pet_develop', result.data);
  assert.equal(Number(body.pet.level), 3);
  assert.throws(() => service.execute(90734, { pet_tid: 100113, level_count: 8 }), error => error.code === 301);
  assert.throws(() => service.execute(90734, { pet_tid: 100113, level_count: 100 }), error => error.code === 305);
});

test('treasure 93301 spends the treasure chip and records the star', t => {
  const env = setup(t, 'fc-treasure-');
  addResource(env.store, 10130117, 5);
  editModule(env.store, 534, 'pb_treasure_data', data => {
    data.treasure_list = [{ tid: 130117, star: 0, quality: 1, chip_num: 1 }];
  });
  const service = createTreasureService({ store: env.store, codec });
  const body = codec.unpack('pb_treasure_star_ret', service.execute(93301, 130117).data);
  assert.equal(Number(body.card.star), 1);
  assert.equal(moduleData(env.store, 534, 'pb_treasure_data').treasure_list[0].star, 1);
});

test('elf star-up and bead level-up mutate their login modules', t => {
  const env = setup(t, 'fc-elves-');
  addResource(env.store, 100121, 10);
  addResource(env.store, 1000122, 10);
  editModule(env.store, 538, 'pb_elves_develop', data => {
    data.elves = [{ tid: 100120, star: 0, talent_pages: [], beads_slots: [] }];
  });
  editModule(env.store, 539, 'pb_elves_bead_data', data => {
    data.elves_beads = [{ tid: '1000122', uid: '1', level: 1, star: 0 }];
    data.max_uid = 1;
  });
  const elves = createElvesService({ store: env.store, codec });
  const star = codec.unpack('pb_elves_develop_rsp', elves.execute(93701, { elves_tid: 100120 }).data);
  assert.equal(Number(star.elves.star), 1);
  const beads = createElvesBeadService({ store: env.store, codec });
  const level = codec.unpack('pb_bead_develop_rsp', beads.execute(93751, { bead_uid: 1, up_level: 2 }).data);
  assert.equal(Number(level.bead.level), 3);
  assert.throws(() => beads.execute(93751, { bead_uid: 9, up_level: 1 }), error => error.code === 5);
});

test('war rune activation, star-up and the state table survive reopen', t => {
  const env = setup(t, 'fc-warrune-');
  addResource(env.store, 151002, 10);
  const service = createWarRuneService({ store: env.store, codec, random: () => 0.5 });
  const active = codec.unpack('pb_war_rune_active_back', service.execute(83001, 2100116).data);
  assert.equal(active.grid.rune_tid, 2100116);
  const star = codec.unpack('pb_war_rune_up_star_back', service.execute(83007, 2100116).data);
  assert.equal(star.war_rune.star, 2);
  const attr = codec.unpack('pb_war_rune_random_attr_back', service.execute(83003, 2100116).data);
  assert.equal(attr.develop_list.length, 1);
  assert.equal(env.reopen().state().modules.value.length > 0, true);
  const reopened = createWarRuneService({ store: env.store, codec });
  assert.throws(() => reopened.execute(83001, 2100116), error => error.code === 1);
});

test('museum activation raises popularity and the tier award is idempotent', t => {
  const env = setup(t, 'fc-museum-');
  addResource(env.store, 100013000, 50);
  const service = createMuseumService({ store: env.store, codec });
  const activated = service.execute(85702, { pb_museum_req_list: [{ tid: 100013000, num: 10 }] });
  assert.equal(codec.unpack('pb_res_to_client', activated.data).changes[0].tid, '100013000');
  service.execute(85701, 1);
  assert.throws(() => service.execute(85701, 1), error => error.code === 1);
  assert.throws(() => service.execute(85701, 5), error => error.code === 305);
});

test('badge, divine embryo and energy burst commands keep idempotent state', t => {
  const env = setup(t, 'fc-extra-');
  addResource(env.store, 10001, 2);
  const service = createDevelopExtraService({ store: env.store, codec });
  const badge = codec.unpack('pb_badge_role', service.execute(104201, { tid_list: [10001] }).data);
  assert.equal(Number(badge.badge_pages[0].badges[0].tid), 10001);
  assert.throws(() => service.execute(104201, { tid_list: [10001] }), error => error.code === 1);
  const embryo = codec.unpack('pb_divine_embryo_data', service.execute(102201, 151310111).data);
  assert.equal(Number(embryo.select_id), 151310111);
  service.execute(91001, 1);
  assert.throws(() => service.execute(91001, 1), error => error.code === 1);
  const play = codec.unpack('pb_pet_play', service.execute(90902, undefined).data);
  assert.equal(Number(play.map_index), 2);
});

test('leader-equipment star-up consumes cost uids from the bag', t => {
  const env = setup(t, 'fc-leader-');
  editModule(env.store, 175, 'pb_leader_equips_data', data => {
    data.slots = [{ type: 1, level: 1, equip: { tid: '1007', uid: '11', star: 0, level: 1 } }];
    data.equip_list = [{ tid: '1008', uid: '12', star: 0, level: 1 }];
    data.max_uid = '12';
  });
  const service = createLeaderEquipDevelopService({ store: env.store, codec });
  const body = codec.unpack('pb_leader_equip_back', service.execute(98403, { uid: 11, cost_uid_list: [12] }).data);
  assert.equal(Number(body.equip.star), 1);
  const data = moduleData(env.store, 175, 'pb_leader_equips_data');
  assert.equal(data.equip_list.length, 0);
  assert.equal(Number(data.slots[0].equip.star), 1);
});

test('equip 1008 converts exchange rows and 1009 batch-refines the bag', t => {
  const env = setup(t, 'fc-equip-ext-');
  const tables = readEquipTables();
  addResource(env.store, 155002, 100);
  addResource(env.store, 17002, 10000);
  editModule(env.store, 16, 'pb_role_equip', data => {
    data.equips = [{ id: 1, tid: 10103, level: 1, level_exp: 0, inscription: 0, refine: 0, refine_exp: 0, random_develop_cost: [] }];
  });
  const service = createEquipService({ store: env.store, codec, tables });
  const exchanged = codec.unpack('pb_res_to_client', service.execute(1008, { exchanges: [{ src: 155002, num: 10, dst: 156002 }] }).data);
  assert.ok(exchanged.changes.some(change => change.tid === '156002'));
  assert.throws(() => service.execute(1007, { equip_id: 1 }), error => error.code === 305);
  const batch = codec.unpack('pb_equip_refine_one_key_batch_rsp', service.execute(1009, {}).data);
  assert.equal(batch.equips.length, 1);
  assert.equal(Number(batch.equips[0].refine), 1);
});
