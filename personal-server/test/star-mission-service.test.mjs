import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createStarMissionService } from '../game/star-mission-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readStarMissionTables } from '../config/star-mission-tables.mjs';
import { decodeBitBlock, hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const FIXED_NOW = 1794000000000;
const ACT_ID = 94001;
const AWARD_TID = 940011;
const DIAMOND = '101500';

function fixtureTables({ needStar = 2 } = {}) {
  return {
    source: 'test-fixture',
    available: true,
    activities: new Map([[ACT_ID, {
      tid: ACT_ID,
      chapters: [{ chapter: 1, awardTid: AWARD_TID, needStar, award: [[101500, 100]] }],
      skills: new Map([[1, { tid: 1, cost: 1, maxLevel: 3 }]])
    }]])
  };
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-star-mission-', now: () => FIXED_NOW });
  const tables = options.tables ?? fixtureTables(options);
  const build = (store, next = {}) => createStarMissionService({
    store, codec: next.codec ?? codec, tables, gameTables, now: () => FIXED_NOW
  });
  return { fixture, tables, build, diamond: store => BigInt(store.read().resources.get(DIAMOND)?.num ?? 0) };
}

// Star bits are the mission_star BitBlock: bits 0 and 1 clear two stars.
function seedStars(store, hex = 'c0') {
  store.inspect(db => db.prepare('INSERT INTO star_mission_state VALUES (?,?,?,?,?,?)')
    .run(store.read().state.roleId, ACT_ID, hex, '', '{}', new Date(FIXED_NOW).toISOString()));
}

test('89602 grants a chapter award once and persists the claim bit across a reopen', async t => {
  const env = setup(t);
  seedStars(env.fixture.store);
  const service = env.build(env.fixture.store);
  const first = await service.execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TID });
  const reply = codec.unpack('pb_star_mission_chapter_award_rsp', first.data);
  assert.equal(Number(reply.chapter.chapter), 1);
  assert.equal(env.diamond(env.fixture.store), 100n);
  const awardBits = await decodeBitBlock(Buffer.from(reply.chapter.chapter_star_award, 'base64'));
  assert.equal(hasBit(awardBits, 1), true);
  const starBits = await decodeBitBlock(Buffer.from(reply.chapter.mission_star, 'base64'));
  assert.equal(hasBit(starBits, 0), true);

  const again = await env.build(env.fixture.open()).execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TID });
  assert.equal(codec.unpack('pb_star_mission_chapter_award_rsp', again.data).chapter.chapter, 1);
  assert.equal(env.diamond(env.fixture.store), 100n, 'the chapter award is not granted twice');
});

test('89602 fails closed when the chapter star threshold is not reached', async t => {
  const env = setup(t, { needStar: 3 });
  seedStars(env.fixture.store);
  await assert.rejects(() => env.build(env.fixture.store).execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TID }), /not unlocked/);
  assert.equal(env.diamond(env.fixture.store), 0n);
});

test('89603 spends star points on a skill and 89604 resets the allocation', async t => {
  const env = setup(t);
  seedStars(env.fixture.store);
  const service = env.build(env.fixture.store);
  assert.equal((await service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 })).value.level, 1);
  assert.equal((await service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 })).value.level, 2);
  await assert.rejects(() => service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 }), /Insufficient star mission skill points/);
  const reset = await service.execute(89604, { activity_id: ACT_ID });
  assert.equal(reset.value.reset, 1, 'one allocated skill is reset');
  assert.equal((await env.build(env.fixture.open()).execute(89603, { activity_id: ACT_ID, skill_tid: 1 })).value.level, 1);
});

test('star mission fails closed for missing configuration, 89601 and a failed reply encoding', async t => {
  const env = setup(t);
  seedStars(env.fixture.store);
  const service = env.build(env.fixture.store);
  await assert.rejects(() => service.execute(89602, { activity_id: 1, award_tid: 1 }), /Star mission configuration missing/);
  await assert.rejects(() => service.execute(89602, { activity_id: ACT_ID, award_tid: 123 }), /chapter award configuration missing/);
  assert.throws(() => service.execute(89601, { activity_id: ACT_ID }), /Star mission award is rejected/);

  const broken = env.build(env.fixture.store, { codec: { unpack: codec.unpack, pack() { throw new Error('pb-pack-failure'); } } });
  await assert.rejects(() => broken.execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TID }), /pb-pack-failure/);
  assert.equal(env.diamond(env.fixture.store), 0n, 'the chapter reward must roll back with the failed reply');
  const bit = env.fixture.store.inspect(db => db.prepare('SELECT award_bits FROM star_mission_state WHERE act_id=?').get(ACT_ID).award_bits);
  assert.equal(bit, '', 'the claim bit must roll back with the failed reply');
  assert.equal(readStarMissionTables().available, false);
});
