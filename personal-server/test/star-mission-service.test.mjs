import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createStarMissionService } from '../game/star-mission-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readStarMissionTables, starMissionActivityVersion } from '../config/star-mission-tables.mjs';
import { decodeBitBlock, hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const starTables = readStarMissionTables();
const FIXED_NOW = 1794000000000;

// Version 1 of StarMissionTable belongs to the func-81 activity 81001
// ("SP new hero activity dungeon"). Chapter 1 has eight levels with three star
// rules each (24 stars) and three chapter awards at 9, 15 and 24 stars.
const ACT_ID = 81001;
const CHAPTER = 1;
const AWARD_TIER_9 = 10101;
const SKILL_ITEM = 177002;
const AWARD_ITEM = 175002;

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-star-mission-', now: () => FIXED_NOW });
  const tables = options.tables ?? starTables;
  const build = (store, next = {}) => createStarMissionService({
    store, codec: next.codec ?? codec, tables, activityTables: gameTables.Activity,
    gameTables, now: () => FIXED_NOW
  });
  const balance = (store, tid) => BigInt(store.read().resources.get(String(tid))?.num ?? 0);
  const give = (store, awards) => store.transaction(model => grantResources(model, awards, gameTables));
  return { fixture, tables, build, balance, give };
}

// Star bits follow the client BitBlock: bit 0 is the first cleared level star,
// MSB first inside each byte. Nine stars are bits 0..8 -> 0xff 0x80.
function seedStars(store, hex = 'ff80', chapter = CHAPTER, version = 1) {
  store.inspect(db => db.prepare('INSERT INTO star_mission_chapter_state VALUES (?,?,?,?,?,?)')
    .run(store.read().state.roleId, version, chapter, hex, '', new Date(FIXED_NOW).toISOString()));
}

test('the shipped StarMissionTable loads with 34 versions, eight levels per chapter and 9/15/24 star awards', () => {
  assert.equal(starTables.available, true);
  assert.equal(starTables.versions.size, 34);
  const version = starTables.versions.get(1);
  const chapter = version.chapters.get(CHAPTER);
  assert.equal(chapter.missions.length, 8);
  assert.equal(chapter.maxStars, 24);
  assert.deepEqual(chapter.tiers.map(tier => tier.star), [9, 15, 24]);
  assert.deepEqual(chapter.tiers.map(tier => tier.award), [[[AWARD_ITEM, 150]], [[AWARD_ITEM, 300]], [[174002, 1]]]);
  for (const skill of version.skills.values()) {
    assert.equal(skill.costId, SKILL_ITEM);
    assert.ok([2, 4].includes(skill.costNum));
    assert.ok(skill.maxLevel >= 1);
  }
  // Only the func-81 activity family points at these versions.
  assert.equal(starMissionActivityVersion(gameTables.Activity, ACT_ID), 1);
  assert.equal(starMissionActivityVersion(gameTables.Activity, 100601), null);
});

test('89602 grants the real 175002 x150 chapter award once and keeps the claim bit across a reopen', async t => {
  const env = setup(t);
  seedStars(env.fixture.store);
  const first = await env.build(env.fixture.store).execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TIER_9 });
  const reply = codec.unpack('pb_star_mission_chapter_award_rsp', first.data);
  assert.equal(Number(reply.chapter.chapter), CHAPTER);
  assert.equal(env.balance(env.fixture.store, AWARD_ITEM), 150n);
  const changes = reply.res_change.changes;
  assert.equal(changes.length, 1);
  assert.equal(String(changes[0].tid), String(AWARD_ITEM));
  assert.equal(String(changes[0].diff_num), '150');
  const awardBits = await decodeBitBlock(Buffer.from(reply.chapter.chapter_star_award, 'base64'));
  assert.equal(hasBit(awardBits, 0), true, 'the 9-star award is bit 0');
  const starBits = await decodeBitBlock(Buffer.from(reply.chapter.mission_star, 'base64'));
  assert.equal(hasBit(starBits, 8), true, 'the seeded star block is echoed back');

  const reopened = env.fixture.open();
  const again = await env.build(reopened).execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TIER_9 });
  assert.equal(codec.unpack('pb_star_mission_chapter_award_rsp', again.data).res_change.changes.length, 0);
  assert.equal(env.balance(env.fixture.store, AWARD_ITEM), 150n, 'the chapter award is granted exactly once');
});

test('89602 refuses a chapter below its star threshold and unknown activity or award ids', async t => {
  const env = setup(t);
  // Eight stars is one short of the 9-star award.
  seedStars(env.fixture.store, 'ff');
  const service = env.build(env.fixture.store);
  await assert.rejects(() => service.execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TIER_9 }), /needs 9 stars/);
  assert.equal(env.balance(env.fixture.store, AWARD_ITEM), 0n);

  await assert.rejects(() => service.execute(89602, { activity_id: 100601, award_tid: AWARD_TIER_9 }), /activity is missing/);
  await assert.rejects(() => service.execute(89602, { activity_id: ACT_ID, award_tid: 999999 }), /award configuration is missing/);
  await assert.rejects(() => service.execute(89602, { activity_id: 0, award_tid: AWARD_TIER_9 }), /Invalid star mission activity id/);
});

test('89603 spends 177002 per skill level, enforces the level cap and the parent skill gate', async t => {
  const env = setup(t);
  env.give(env.fixture.store, [[SKILL_ITEM, 20]]);
  const service = env.build(env.fixture.store);
  // Skill 1 is a root skill with three levels at 2 items each.
  for (const level of [1, 2, 3]) {
    const reply = await service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 });
    const res = codec.unpack('pb_res_to_client', reply.data);
    assert.equal(res.changes.length, 1);
    assert.equal(String(res.changes[0].tid), String(SKILL_ITEM));
    assert.equal(String(res.changes[0].diff_num), '-2');
    assert.equal(env.balance(env.fixture.store, SKILL_ITEM), BigInt(20 - 2 * level));
  }
  assert.throws(() => service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 }), /max level/);
  assert.equal(env.balance(env.fixture.store, SKILL_ITEM), 14n, 'a capped skill costs nothing');

  // Skill 2 needs skill 1 at its cap, which is now satisfied.
  assert.equal((await service.execute(89603, { activity_id: ACT_ID, skill_tid: 2 })).value.changes.length, 1);
  // Skill 5 depends on skill 2 (level cap 3) and must stay locked.
  assert.throws(() => service.execute(89603, { activity_id: ACT_ID, skill_tid: 5 }), /prerequisite is not active: 2/);

  const persisted = env.fixture.store.inspect(db => JSON.parse(db.prepare(
    'SELECT skills_json FROM star_mission_skill_state WHERE version=1').get().skills_json));
  assert.deepEqual(persisted, { 1: 3, 2: 1 });
});

test('89603 fails closed without the skill item and 89604 refunds every spent level', async t => {
  const env = setup(t);
  const service = env.build(env.fixture.store);
  assert.throws(() => service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 }), /Insufficient resource/);
  env.give(env.fixture.store, [[SKILL_ITEM, 10]]);
  for (const level of [1, 2, 3]) await service.execute(89603, { activity_id: ACT_ID, skill_tid: 1 });
  // Skill 3 unlocks once its parent (skill 1) reaches the cap of 3.
  await service.execute(89603, { activity_id: ACT_ID, skill_tid: 3 });
  assert.equal(env.balance(env.fixture.store, SKILL_ITEM), 2n);

  const reset = await service.execute(89604, { activity_id: ACT_ID });
  const res = codec.unpack('pb_res_to_client', reset.data);
  assert.equal(res.changes.length, 1);
  assert.equal(String(res.changes[0].diff_num), '8', 'four levels at 2 items each are refunded');
  assert.equal(env.balance(env.fixture.store, SKILL_ITEM), 10n);

  const reopened = env.fixture.open();
  const row = reopened.inspect(db => db.prepare('SELECT skills_json FROM star_mission_skill_state WHERE version=1').get());
  assert.equal(row.skills_json, '{}');
  const refundAgain = await env.build(reopened).execute(89604, { activity_id: ACT_ID });
  assert.equal(codec.unpack('pb_res_to_client', refundAgain.data).changes.length, 0);
  assert.equal(env.balance(env.fixture.store, SKILL_ITEM), 10n, 'an empty skill tree refunds nothing');
});

test('89601 stays refused and a failed reply encoding leaves no claim behind', async t => {
  const env = setup(t);
  seedStars(env.fixture.store);
  const service = env.build(env.fixture.store);
  assert.throws(() => service.execute(89601, { activity_id: ACT_ID }), /Star mission award is rejected/);

  const broken = env.build(env.fixture.store, { codec: { unpack: codec.unpack, pack() { throw new Error('pb-pack-failure'); } } });
  await assert.rejects(() => broken.execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TIER_9 }), /pb-pack-failure/);
  assert.equal(env.balance(env.fixture.store, AWARD_ITEM), 0n, 'the reward rolls back with the failed reply');
  const bit = env.fixture.store.inspect(db => db.prepare(
    'SELECT award_bits FROM star_mission_chapter_state WHERE version=1 AND chapter=1').get().award_bits);
  assert.equal(bit, '', 'the claim bit rolls back with the failed reply');
});

test('an unavailable StarMissionTable fails closed instead of guessing rewards', async t => {
  const env = setup(t, { tables: { source: null, available: false, versions: new Map() } });
  seedStars(env.fixture.store);
  await assert.rejects(() => env.build(env.fixture.store).execute(89602, { activity_id: ACT_ID, award_tid: AWARD_TIER_9 }),
    /configuration is unavailable/);
});
