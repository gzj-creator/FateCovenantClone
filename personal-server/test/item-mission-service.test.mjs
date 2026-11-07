import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createMissionExtraService } from '../game/mission-extra-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();

// Local wall-clock instants keep the meal windows and daily resets independent
// of the machine timezone.
const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute, 0, 0).getTime();
const DAY1_NOON = at(6, 12, 30);
const DAY1_EVENING = at(6, 19, 0);
const DAY2_NOON = at(7, 12, 30);

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-item-mission-' });
  let clock = options.now ?? DAY1_NOON;
  let store = fixture.store;
  const build = () => {
    const fight = createMissionFightService({ store, codec });
    return createMissionExtraService({ store, codec, missionFight: fight, now: () => clock });
  };
  let service = build();
  return {
    get store() { return store; },
    get service() { return service; },
    setClock(value) { clock = value; },
    reopen() { store = fixture.open(); service = build(); }
  };
}

const missionModule = store => codec.unpack('pb_mission', rawBinary(new Map(store.state().modules.value).get(8).value[0]));
const amount = (store, tid) => BigInt(store.read().resources.get(String(tid))?.num ?? 0);
const bitsOf = async base64 => Buffer.from((await decodeEtf(Buffer.from(base64 ?? '', 'base64'))).value ?? []);

const setResource = (store, tid, num, group = 1) => store.transaction(model => {
  const existing = model.resources.get(String(tid));
  if (existing) { existing.num = String(num); return; }
  const groups = new Map(model.state.modules.value).get(6).value;
  while (groups.length <= group) groups.push({ value: [], improper: false });
  const entry = groups[group].value.length;
  groups[group].value.push(serializedBinary(Buffer.alloc(0)));
  model.resources.set(String(tid), { tid: String(tid), num: String(num), location: [6, group, entry] });
});

const setMission = (store, missionId) => store.transaction(model => {
  const module = new Map(model.state.modules.value).get(8);
  const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
  mission.mission_id = String(missionId);
  module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
  const modules = new Map(model.state.modules.value);
  modules.set(8, module);
  model.state.modules.value = [...modules];
});

test('504 meal claim grants the configured parcel once per window and local day', async t => {
  const env = setup(t);
  setResource(env.store, 122702, 0);
  const response = codec.unpack('pb_mission_meal_rsp', (await env.service.execute(504, await encodeEtf([1]))).data);
  assert.equal(Number(response.meal.last_refresh_stamp), Math.floor(at(6, 0) / 1000));
  assert.equal((await bitsOf(response.meal.got_award))[0], 0x40);
  assert.deepEqual(response.res_change.changes.map(change => [change.tid, change.diff_num]), [['122702', '3']]);
  assert.equal(amount(env.store, 122702), 3n);

  await assert.rejects(async () => env.service.execute(504, await encodeEtf([1])), error => error.code === 310);
  // The 18-23 window is still closed at 12:30 server time.
  await assert.rejects(async () => env.service.execute(504, await encodeEtf([2])), error => error.code === 5);
  await assert.rejects(async () => env.service.execute(504, await encodeEtf([9])), error => error.code === 5);
  assert.equal(amount(env.store, 122702), 3n);

  env.setClock(DAY1_EVENING);
  const evening = codec.unpack('pb_mission_meal_rsp', (await env.service.execute(504, await encodeEtf([2]))).data);
  assert.equal((await bitsOf(evening.meal.got_award))[0], 0x60);
  assert.equal(amount(env.store, 122702), 6n);
  // An empty payload resolves the tid from the current window and the meal is
  // already claimed today.
  await assert.rejects(async () => env.service.execute(504, Buffer.alloc(0)), error => error.code === 310);

  env.reopen();
  await assert.rejects(async () => env.service.execute(504, await encodeEtf([2])), error => error.code === 310);
  assert.equal(amount(env.store, 122702), 6n);

  // The next local day resets the claim bitmap and the window picker works again.
  env.setClock(DAY2_NOON);
  const nextDay = codec.unpack('pb_mission_meal_rsp', (await env.service.execute(504, Buffer.alloc(0))).data);
  assert.equal(Number(nextDay.meal.last_refresh_stamp), Math.floor(at(7, 0) / 1000));
  assert.equal((await bitsOf(nextDay.meal.got_award))[0], 0x40);
  assert.equal(amount(env.store, 122702), 9n);
});

test('504 meal encoding failure rolls the claim and the reward back', async t => {
  const env = setup(t);
  setResource(env.store, 122702, 0);
  const before = env.store.state();
  const brokenCodec = {
    ...codec,
    pack(name, object) {
      if (name === 'pb_mission_meal_rsp') throw new Error('meal encode fail');
      return codec.pack(name, object);
    }
  };
  const broken = createMissionExtraService({ store: env.store, codec: brokenCodec, now: () => DAY1_NOON });
  await assert.rejects(async () => broken.execute(504, codec.pack ? Buffer.alloc(0) : Buffer.alloc(0)), /meal encode fail/);
  assert.deepEqual(env.store.state(), before);
  assert.equal(amount(env.store, 122702), 0n);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM mission_meal_claims').get().n), 0);
});

test('504 SQLite failure inside the transaction leaves no claim row and no reward', async t => {
  const env = setup(t);
  setResource(env.store, 122702, 0);
  env.store.inspect(db => db.exec("CREATE TRIGGER meal_block BEFORE INSERT ON resources BEGIN SELECT RAISE(ABORT,'resources locked'); END;"));
  await assert.rejects(async () => env.service.execute(504, await encodeEtf([1])), /resources locked/);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM mission_meal_claims').get().n), 0);
  assert.equal(amount(env.store, 122702), 0n);
});

test('505 energy exchange consumes one source item and respects the stamina cap and daily limit', async t => {
  const env = setup(t);
  setResource(env.store, 122702, 5);
  setResource(env.store, 100012900, 100);
  const first = codec.unpack('pb_res_to_client', (await env.service.execute(505, await encodeEtf([100012900]))).data);
  assert.deepEqual(first.changes.map(change => [change.tid, change.diff_num]), [['122702', '-1'], ['100012900', '50']]);
  assert.equal(amount(env.store, 100012900), 150n);
  assert.equal(amount(env.store, 122702), 4n);

  // The source item tid resolves the same EnergyConst row.
  await env.service.execute(505, await encodeEtf([122702]));
  assert.equal(amount(env.store, 100012900), 200n);

  // EnergyConst.max caps the stamina balance.
  setResource(env.store, 100012900, 2990);
  await assert.rejects(async () => env.service.execute(505, await encodeEtf([100012900])), error => error.code === 5);
  assert.equal(amount(env.store, 100012900), 2990n);

  // Missing source items surface as an insufficient-resource error.
  setResource(env.store, 100012900, 0);
  setResource(env.store, 122702, 0);
  await assert.rejects(async () => env.service.execute(505, await encodeEtf([100012900])), error => error.code === 301);
  await assert.rejects(async () => env.service.execute(505, Buffer.alloc(0)), error => error.code === 1);
  await assert.rejects(async () => env.service.execute(505, await encodeEtf([999999999])), error => error.code === 5);

  // EnergyConst.limit 800 caps the day at sixteen exchanges of rate 50. The two
  // earlier exchanges already spent 100 of that daily cap.
  setResource(env.store, 122702, 40);
  let exchanges = 0;
  for (let index = 0; index < 20; index++) {
    try {
      await env.service.execute(505, await encodeEtf([100012900]));
      exchanges++;
    } catch (error) {
      assert.equal(error.code, 5);
      break;
    }
  }
  assert.equal(exchanges, 14);
  assert.equal(amount(env.store, 100012900), 700n);
  assert.equal(amount(env.store, 122702), 26n);
  await assert.rejects(async () => env.service.execute(505, await encodeEtf([100012900])), error => error.code === 5);
  assert.equal(amount(env.store, 122702), 26n);

  env.reopen();
  await assert.rejects(async () => env.service.execute(505, await encodeEtf([100012900])), error => error.code === 5);
  env.setClock(DAY2_NOON);
  await env.service.execute(505, await encodeEtf([100012900]));
  assert.equal(amount(env.store, 100012900), 750n);
});

test('505 exchange rolls back the item cost when the stamina grant is rejected', async t => {
  const env = setup(t);
  setResource(env.store, 122702, 3);
  setResource(env.store, 100012900, 100);
  env.store.inspect(db => db.exec("CREATE TRIGGER energy_block BEFORE INSERT ON resources BEGIN SELECT RAISE(ABORT,'resources locked'); END;"));
  await assert.rejects(async () => env.service.execute(505, await encodeEtf([100012900])), /resources locked/);
  assert.equal(amount(env.store, 122702), 3n);
  assert.equal(amount(env.store, 100012900), 100n);
  assert.equal(env.store.inspect(db => db.prepare('SELECT COUNT(*) AS n FROM mission_energy_exchanges').get().n), 0);
});

test('510 manual stamina purchase follows the ShopItem price ladder and daily purchase limit', async t => {
  const env = setup(t);
  setResource(env.store, 122702, 0);
  setResource(env.store, 101500, 1000);
  const first = codec.unpack('pb_energy_manual_buy_rsp', (await env.service.execute(510, await encodeEtf([100012900]))).data);
  // ShopItem 2070101001 price ladder starts at a free first purchase.
  assert.deepEqual(first.res.changes.map(change => [change.tid, change.diff_num]), [['122702', '1']]);
  assert.equal(Number(first.buy.num), 1);
  assert.equal(Number(first.buy.tid), 100012900);
  assert.ok(Number(first.buy.time) > 0);
  assert.equal(amount(env.store, 101500), 1000n);

  const second = codec.unpack('pb_energy_manual_buy_rsp', (await env.service.execute(510, await encodeEtf([100012900]))).data);
  assert.deepEqual(second.res.changes.map(change => [change.tid, change.diff_num]), [['101500', '-30'], ['122702', '1']]);
  assert.equal(Number(second.buy.num), 2);
  assert.equal(amount(env.store, 101500), 970n);

  // ShopItem.purchase_limit is 9 purchases per day.
  for (let index = 3; index <= 9; index++) await env.service.execute(510, await encodeEtf([100012900]));
  assert.equal(amount(env.store, 122702), 9n);
  await assert.rejects(async () => env.service.execute(510, await encodeEtf([100012900])), error => error.code === 310);
  assert.equal(amount(env.store, 122702), 9n);

  env.reopen();
  await assert.rejects(async () => env.service.execute(510, await encodeEtf([100012900])), error => error.code === 310);
  env.setClock(DAY2_NOON);
  const nextDay = codec.unpack('pb_energy_manual_buy_rsp', (await env.service.execute(510, await encodeEtf([2070101001]))).data);
  assert.equal(Number(nextDay.buy.num), 1);
  assert.deepEqual(nextDay.res.changes.map(change => [change.tid, change.diff_num]), [['122702', '1']]);

  // The second tier costs 30 diamonds and rejects an empty wallet.
  setResource(env.store, 101500, 10);
  await assert.rejects(async () => env.service.execute(510, await encodeEtf([100012900])), error => error.code === 301);
  assert.equal(amount(env.store, 122702), 10n);
  await assert.rejects(async () => env.service.execute(510, Buffer.alloc(0)), error => error.code === 1);
});

test('509 one-key chapter rewards share the 506 box bitmap inside one transaction', async t => {
  const env = setup(t);
  setMission(env.store, 50201);
  const before = Object.fromEntries(['25002', '101500', '201500'].map(tid => [tid, amount(env.store, tid)]));
  const request = ids => codec.pack('pb_mission_one_key_reward_req', { box_tids: ids, common_task_tids: [] });

  // Common tasks have no local progress source yet and must not be reported as claimed.
  await assert.rejects(async () => env.service.execute(509, codec.pack('pb_mission_one_key_reward_req', { box_tids: [1], common_task_tids: [3] })),
    error => error.code === 5
  );
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_box'").get().n), 0);

  const response = codec.unpack('pb_mission_one_key_reward_rsp', (await env.service.execute(509, request([1, 2, 3, 4]))).data);
  assert.deepEqual(response.res_change.changes.map(change => [change.tid, change.diff_num]), [
    ['25002', '5'], ['101500', '190'], ['201500', '200000']
  ]);
  assert.deepEqual([...(await bitsOf(response.mission.box_award))], [0x78]);
  assert.deepEqual(response.common_task.receive_list ?? [], []);
  assert.equal(amount(env.store, 101500), before['101500'] + 190n);

  const repeated = codec.unpack('pb_mission_one_key_reward_rsp', (await env.service.execute(509, request([1, 2, 3, 4]))).data);
  assert.deepEqual(repeated.res_change.changes, []);
  assert.equal(amount(env.store, 101500), before['101500'] + 190n);

  env.reopen();
  assert.deepEqual(codec.unpack('pb_mission_one_key_reward_rsp', (await env.service.execute(509, request([1, 2, 3, 4]))).data).res_change.changes, []);
  assert.equal(amount(env.store, 101500), before['101500'] + 190n);
});

test('509 refuses unknown and duplicate boxes and rolls back a failed response encode', async t => {
  const env = setup(t);
  setMission(env.store, 50201);
  const before = env.store.state();
  await assert.rejects(async () => env.service.execute(509, codec.pack('pb_mission_one_key_reward_req', { box_tids: [999], common_task_tids: [] })),
    error => error.code === 1 || error.code === 5
  );
  await assert.rejects(async () => env.service.execute(509, Buffer.from([0xff, 0xff, 0xff])), error => error.code === 1);
  assert.deepEqual(env.store.state(), before);

  const brokenCodec = {
    ...codec,
    pack(name, object) {
      if (name === 'pb_mission_one_key_reward_rsp') throw new Error('one key encode fail');
      return codec.pack(name, object);
    }
  };
  const broken = createMissionExtraService({ store: env.store, codec: brokenCodec, now: () => DAY1_NOON });
  await assert.rejects(async () => broken.execute(509, codec.pack('pb_mission_one_key_reward_req', { box_tids: [1], common_task_tids: [] })),
    /one key encode fail/
  );
  assert.deepEqual(env.store.state(), before);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_box'").get().n), 0);
});

test('511 chapter pass is derived from the mission cursor and recorded once', async t => {
  const env = setup(t);
  setMission(env.store, 30201);
  await assert.rejects(async () => env.service.execute(511, await encodeEtf([3])), error => error.code === 5);
  await assert.rejects(async () => env.service.execute(511, await encodeEtf([99])), error => error.code === 5);

  setMission(env.store, 40201);
  const first = await env.service.execute(511, await encodeEtf([3]));
  assert.deepEqual(await decodeEtf(first.data), [3, 0]);
  assert.equal(env.store.inspect(db => db.prepare("SELECT COUNT(*) AS n FROM reward_claims WHERE claim_type='mission_chapter_pass'").get().n), 1);
  const repeated = await env.service.execute(511, await encodeEtf([3]));
  assert.deepEqual(await decodeEtf(repeated.data), [3, 1]);
  // Without an explicit chapter the command reports the highest finished chapter.
  assert.deepEqual(await decodeEtf((await env.service.execute(511, Buffer.alloc(0))).data), [3, 1]);

  env.reopen();
  assert.deepEqual(await decodeEtf((await env.service.execute(511, await encodeEtf([3]))).data), [3, 1]);
});

test('512 boss award requires a recorded clear, pays once and survives reopen', async t => {
  const env = setup(t);
  setMission(env.store, 30201);
  // Boss 2 has open_chapter 0 and open_server_day 2, so only a clear is missing.
  await assert.rejects(async () => env.service.execute(512, await encodeEtf([2])), error => error.code === 5);
  assert.equal(missionModule(env.store).boss_bin ?? '', '');

  env.store.inspect(db => db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)')
    .run(env.store.state().roleId, 'mission_boss_clear', '2', new Date(DAY1_NOON).toISOString()));
  const before = Object.fromEntries(['2002', '25002', '101500'].map(tid => [tid, amount(env.store, tid)]));
  const response = codec.unpack('pb_res_to_client', (await env.service.execute(512, await encodeEtf([2]))).data);
  assert.deepEqual(response.changes.map(change => [change.tid, change.diff_num]), [
    ['2002', '5'], ['25002', '2'], ['101500', '100']
  ]);
  assert.equal(amount(env.store, 101500), before['101500'] + 100n);
  assert.equal((await bitsOf(missionModule(env.store).boss_bin))[0], 0x20);

  await assert.rejects(async () => env.service.execute(512, await encodeEtf([2])), error => error.code === 310);
  env.reopen();
  await assert.rejects(async () => env.service.execute(512, await encodeEtf([2])), error => error.code === 310);
  assert.equal(amount(env.store, 101500), before['101500'] + 100n);
  // Boss 1 needs chapter eight, which this cursor has not reached.
  env.store.inspect(db => db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)')
    .run(env.store.state().roleId, 'mission_boss_clear', '1', new Date(DAY1_NOON).toISOString()));
  await assert.rejects(async () => env.service.execute(512, await encodeEtf([1])), error => error.code === 5);
  await assert.rejects(async () => env.service.execute(512, await encodeEtf([99])), error => error.code === 5);
  await assert.rejects(async () => env.service.execute(512, Buffer.alloc(0)), error => error.code === 1);
});
