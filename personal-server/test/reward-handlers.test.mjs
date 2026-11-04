import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources, rewardHandlerFor } from '../game/resources.mjs';
import { hasBit } from '../game/bit-block.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));

function itemWithObjClass(objClass) {
  for (const item of tables.Item.values()) {
    const type = tables.Type.get(Number(item.type));
    if (type?.obj_class?.reference === objClass) return Number(item.tid);
  }
  throw new Error(`No ItemTable row uses obj_class ${objClass}`);
}

function configuredRechargeAwards() {
  const rows = [];
  const add = (source, list) => rows.push({ source, list: list ?? [] });
  for (const row of tables.FirstRechargeAward.values()) add(`first:${row.tid}`, row.award);
  for (const row of tables.RechargeBonusAward.values()) add(`bonus:${row.tid}`, row.award_list);
  for (const row of tables.RechargeRebateResetAct.values()) add(`rebate:${row.tid}`, row.daily_award);
  for (const row of tables.LineFirstRecharge.values()) add(`line:${row.tid}`, row.award);
  for (const row of tables.AccRechargeAward.values()) add(`acc:${row.tid}`, row.award);
  for (const row of tables.HundredAccReward.values()) add(`hundred:${row.tid}`, row.reward);
  for (const row of tables.ExtraReward.values()) add(`extra:${row.tid}`, row.reward);
  for (const row of tables.ExtraFixReward.values()) add(`extra_fix:${row.tid}`, row.reward);
  return rows;
}

test('every configured recharge award maps to exactly one explicit handler', () => {
  const rows = configuredRechargeAwards();
  const failures = [];
  let count = 0;
  for (const row of rows) {
    for (const [tid, amount] of row.list) {
      count++;
      if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(amount) || amount <= 0) failures.push(`${row.source}:${tid}:${amount}:invalid`);
      const handler = rewardHandlerFor(tid, tables);
      if (!handler) failures.push(`${row.source}:${tid}:missing-handler`);
    }
  }
  assert.ok(count > 1400);
  assert.deepEqual(failures, []);
  assert.match(rewardHandlerFor(3030501, tables).key, /hero/);
  assert.match(rewardHandlerFor(300610, tables).key, /Artifact/);
  assert.match(rewardHandlerFor(355708, tables).key, /figure-title/);
  assert.match(rewardHandlerFor(400108, tables).key, /chat-bubble/);
  assert.match(rewardHandlerFor(6008002, tables).key, /FantasyEquipChip:item-container/);
  assert.match(rewardHandlerFor(1012002, tables).key, /SpRelicItem:item-container/);
});

test('preflight rejects unknown rewards and grants every dedicated family through its explicit module 6 container', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-reward-handlers-'));
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  const store = createGameStore({ databasePath: path.join(directory, 'game.sqlite'), seed, codec, serverOpenedAt: 1792789200 });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const before = store.state();
  assert.throws(() => store.transaction(model => grantResources(model, [[999999999, 1]], tables)), error => error.code === 5);
  assert.deepEqual(store.state(), before);

  const dedicatedContainerIds = [
    itemWithObjClass('FantasyEquipChip'),
    itemWithObjClass('SpRelicItem'),
    itemWithObjClass('EmojiItem'),
    itemWithObjClass('ItemRoleSkin')
  ];
  for (const id of dedicatedContainerIds) assert.match(rewardHandlerFor(id, tables).key, /^2:.*:item-container:0$/);

  const awards = [
    [3030501, 1], [300610, 1], [157112, 1], [400313, 1], [141717, 3], [141117, 3],
    [1202919, 1], [400220, 1], [1030922, 2], [10063200, 1], [100108, 1], [200508, 1],
    [355708, 1], [400108, 1],
    ...dedicatedContainerIds.map(id => [id, 1])
  ];
  store.transaction(model => grantResources(model, awards, tables, { codec }));
  store.transaction(model => grantResources(model, [[141717, 1]], tables, { codec }));
  const modules = new Map(store.state().modules.value);
  const hero = codec.unpack('pb_hero_info', rawBinary(modules.get(10).value[0]));
  assert.ok(hero.hero_list.some(row => Number(row.tid) === 3030501 && Number(row.count) === 1));
  const artifacts = codec.unpack('pb_artifact_info', rawBinary(modules.get(50).value[0]));
  assert.equal(artifacts.artifact_list.find(row => Number(row.tid) === 300610).num, 1);
  const skins = codec.unpack('pb_skin_info', rawBinary(modules.get(65).value[0]));
  assert.equal(skins.skin_list.find(row => Number(row.id) === 157112).num, 1);
  assert.ok(codec.unpack('pb_pet_develop_data', rawBinary(modules.get(158).value[0])).pets.some(row => Number(row.tid) === 400313));
  const treasures = codec.unpack('pb_treasure_data', rawBinary(modules.get(534).value[0]));
  assert.equal(treasures.treasure_list.filter(row => Number(row.tid) === 141717).length, 1);
  assert.equal(treasures.treasure_list.find(row => Number(row.tid) === 141717).chip_num, 4);
  assert.equal(treasures.treasure_list.find(row => Number(row.tid) === 141117).chip_num, 3);
  assert.equal(codec.unpack('pb_fantasy_equip_res', rawBinary(modules.get(518).value[0])).raw_equips.find(row => Number(row.tid) === 1202919).num, 1);
  assert.ok(codec.unpack('pb_elves_develop', rawBinary(modules.get(538))).elves.some(row => Number(row.tid) === 400220));
  assert.equal(codec.unpack('pb_elves_bead_data', rawBinary(modules.get(539))).elves_beads.filter(row => Number(row.tid) === 1030922).length, 2);
  assert.equal(codec.unpack('pb_house_assistant_info', rawBinary(modules.get(148).value[0])).res.find(row => Number(row.tid) === 10063200).num, '1');
  for (const id of dedicatedContainerIds) assert.equal(store.read().resources.get(String(id))?.location?.[0], 6);

  const role = codec.unpack('to_client_role_info', Buffer.from(store.state().rolePb, 'base64'));
  assert.equal(hasBit(Buffer.from(role.figure_have_info.stable_head_info, 'base64'), 1), true);
  assert.equal(hasBit(Buffer.from(role.figure_have_info.stable_frame_info, 'base64'), 5), true);
  assert.equal(hasBit(Buffer.from(role.figure_have_info.stable_title_info, 'base64'), 557), true);
  assert.equal(hasBit(Buffer.from(role.figure_have_info.stable_bubble_info, 'base64'), 1001), true);
  assert.equal(store.read().resources.has('300610'), false);
  assert.equal(store.read().resources.has('3030501'), false);
});

test('role experience rewards accept safe numeric amounts', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-role-exp-'));
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(flow => flow.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, exp: 7 }).toString('base64'),
    guides: {}, lineups: null
  });
  const store = createGameStore({ databasePath: path.join(directory, 'game.sqlite'), seed, codec, serverOpenedAt: 1792789200 });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });

  const result = store.transaction(model => grantResources(model, [[1140000, 10]], tables));
  assert.equal(result.changes[0].new_num, '17');
  assert.equal(store.read().role.exp, 17);
});
