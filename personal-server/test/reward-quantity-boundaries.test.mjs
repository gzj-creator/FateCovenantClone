import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createElvesBeadService } from '../game/elves-bead-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec(), tables = { ...readGameTables(), Hero: readHeroTables().Hero };
const I32_MAX = 2147483647, U32_MAX = 4294967295, I64_MAX = '9223372036854775807';
const families = [
  { label: 'artifact', id: 200110, module: 50, slot: 0, schema: 'pb_artifact_info', list: 'artifact_list', row: { tid: '200110' }, field: 'num', max: I32_MAX },
  { label: 'skin', id: 100212, module: 65, slot: 0, schema: 'pb_skin_info', list: 'skin_list', row: { id: '100212' }, field: 'num', max: I32_MAX },
  { label: 'fantasy raw equipment', id: 1100119, module: 518, slot: 0, schema: 'pb_fantasy_equip_res', list: 'raw_equips', row: { tid: 1100119 }, field: 'num', max: I32_MAX },
  { label: 'treasure chips', id: 130117, module: 534, slot: 0, schema: 'pb_treasure_data', list: 'treasure_list', row: { tid: '130117' }, field: 'chip_num', max: U32_MAX },
  { label: 'house assistant', id: 10013200, module: 148, slot: 0, schema: 'pb_house_assistant_info', list: 'res', row: { tid: '10013200' }, field: 'num', max: I64_MAX }
];
function writeModule(model, family, value) {
  const modules = new Map(model.state.modules.value);
  const binary = serializedBinary(codec.pack(family.schema, value));
  if (family.slot == null) modules.set(family.module, binary);
  else {
    const envelope = modules.get(family.module) ?? { value: [] };
    envelope.value[family.slot] = binary;
    modules.set(family.module, envelope);
  }
  model.state.modules.value = [...modules];
}
function readModule(store, family) {
  const module = new Map(store.state().modules.value).get(family.module);
  return codec.unpack(family.schema, rawBinary(family.slot == null ? module : module.value[family.slot]));
}
for (const family of families) test(`${family.label} respects its actual protobuf quantity width and rolls back overflow`, t => {
  const { store } = createGameFixture(t, codec);
  store.transaction(model => writeModule(model, family, { [family.list]: [{ ...family.row, [family.field]: String(BigInt(family.max) - 1n) }] }));
  store.transaction(model => grantResources(model, [[family.id, 1]], tables, { codec }));
  assert.equal(String(readModule(store, family)[family.list][0][family.field]), String(family.max));
  const before = store.state();
  assert.throws(() => store.transaction(model => grantResources(model, [[family.id, 1]], tables, { codec })),
    error => error.code === 1 && /limit/i.test(error.message));
  assert.deepEqual(store.state(), before);
});

test('hero count cannot wrap the signed int32 count in the saved hero protocol', t => {
  const { store } = createGameFixture(t, codec);
  const id = Number(store.read().heroInfo.hero_list[0].tid);
  store.transaction(model => { model.heroInfo.hero_list[0].count = I32_MAX; });
  const before = store.state();
  assert.throws(() => store.transaction(model => grantResources(model, [[id, 1]], tables, { codec })), error => error.code === 1);
  assert.deepEqual(store.state(), before);
});

test('elves bead int64 identifiers stay consecutive above Number.MAX_SAFE_INTEGER', t => {
  const { store } = createGameFixture(t, codec);
  const family = { module: 539, slot: null, schema: 'pb_elves_bead_data' };
  const previous = '9007199254740992';
  store.transaction(model => writeModule(model, family, { max_uid: previous, elves_beads: [] }));
  store.transaction(model => grantResources(model, [[1000122, 2]], tables, { codec }));
  const result = readModule(store, family);
  assert.equal(result.max_uid, '9007199254740994');
  assert.deepEqual(result.elves_beads.map(row => row.uid), ['9007199254740993', '9007199254740994']);
});

test('bead development preserves exact int64 selection, counter and worn references across reopen', t => {
  const env = createGameFixture(t, codec);
  const family = { module: 539, slot: null, schema: 'pb_elves_bead_data' };
  const uid = '9007199254740993', adjacent = '9007199254740992';
  env.store.transaction(model => {
    writeModule(model, family, { max_uid: '9007199254740995', elves_beads: [
      { tid: '1000122', uid: adjacent, level: 1 }, { tid: '1000122', uid, level: 1 }
    ] });
    const group = new Map(model.state.modules.value).get(6).value[0].value;
    const entry = group.length;
    group.push(serializedBinary(Buffer.alloc(0)));
    model.resources.set('1000122', { tid: '1000122', num: '10', location: [6, 0, entry] });
  });
  const service = createElvesBeadService({ store: env.store, codec });
  const input = service.decode(93751, codec.pack('pb_bead_level_up_req', { bead_uid: uid, up_level: 1 }));
  const leveled = codec.unpack('pb_bead_develop_rsp', service.execute(93751, input).data);
  assert.equal(leveled.bead.uid, uid);
  assert.equal(leveled.bead.level, 2);
  service.execute(93753, { beads_slots: [{ elves_id: 100120, beads_slots: [{ index: 1, elves_bead_uid: uid }] }] });
  env.open();
  const data = readModule(env.store, family);
  assert.equal(data.max_uid, '9007199254740995');
  assert.deepEqual(data.elves_beads.map(row => [row.uid, row.level]), [[adjacent, 1], [uid, 2]]);
  const slots = env.store.inspect(db => JSON.parse(db.prepare("SELECT payload FROM develop_module_state WHERE module='elves_bead_slots'").get().payload));
  assert.equal(slots.slots[0].uid, uid);
  const before = env.store.state();
  const reopened = createElvesBeadService({ store: env.store, codec });
  for (const invalid of ['9223372036854775808', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => reopened.execute(93751, { bead_uid: invalid, up_level: 1 }), error => error.code === 1);
    assert.deepEqual(env.store.state(), before);
  }
});

test('elves bead counter refuses allocation past the int64 maximum without a partial reward', t => {
  const { store } = createGameFixture(t, codec);
  const family = { module: 539, slot: null, schema: 'pb_elves_bead_data' };
  store.transaction(model => writeModule(model, family, { max_uid: I64_MAX, elves_beads: [] }));
  const before = store.state();
  assert.throws(() => store.transaction(model => grantResources(model, [[1000122, 1]], tables, { codec })), error => error.code === 1);
  assert.deepEqual(store.state(), before);
});
