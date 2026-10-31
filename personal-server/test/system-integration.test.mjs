import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createGameCodec, decodeEtf, rawBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createLocalGame } from '../local-game.mjs';
import { grantResources } from '../game/resources.mjs';

const codec = createGameCodec();
const capturePath = new URL('../fixtures/login-modules.local-only.json', import.meta.url);
const SERVER_OPENED_AT = 1792789200;
const REQUIRED_MODULES = [10, 24, 114, 156, 157, 159];
const GIFT_TID = 33002;
const HERO_TID = 2020601;

function loginModules(login) {
  const modules = new Map(login[2].value.map(entry => [Number(entry[0]), entry[1]]));
  const ids = login[2].value.map(entry => Number(entry[0]));
  assert.equal(new Set(ids).size, ids.length, 'login ETF must not contain duplicate module ids');
  for (const moduleId of REQUIRED_MODULES) assert.ok(modules.has(moduleId), `login module ${moduleId} is present`);
  return modules;
}

function moduleBytes(modules, moduleId) {
  const module = modules.get(moduleId);
  assert.ok(module, `module ${moduleId} exists`);
  if (module.value?.data) return Buffer.from(rawBinary(module));
  assert.ok(Buffer.isBuffer(module.value) || module.value instanceof Uint8Array, `module ${moduleId} is binary`);
  return Buffer.from(module.value);
}

function listSlotBytes(module, index) {
  const slot = module.value?.[index];
  assert.ok(slot && slot.value !== undefined, `module slot ${index} exists`);
  return Buffer.from(slot.value?.data ?? slot.value);
}

function stableModuleBytes(modules, moduleId) {
  const module = modules.get(moduleId);
  assert.ok(module, `module ${moduleId} exists`);
  if (Array.isArray(module.value)) {
    assert.equal(module.value.length, 1, `module ${moduleId} keeps its one-slot envelope`);
    return listSlotBytes(module, 0);
  }
  return moduleBytes(modules, moduleId);
}

function heroSlots(modules) {
  const module = modules.get(10);
  assert.ok(Array.isArray(module.value), 'module 10 uses its slot list');
  assert.ok(module.value.length > 4, 'module 10 has both handbook and favour slots');
  const handbook = codec.unpack('pb_hero_all_handbook_record', listSlotBytes(module, 3));
  const favour = codec.unpack('pb_role_hero_favour', listSlotBytes(module, 4));
  return { module, handbook, favour };
}

function assertScrolls(modules) {
  const guild = codec.unpack('pb_res_guild_login', moduleBytes(modules, 24));
  assert.ok(Array.isArray(guild.guild?.member_list) && guild.guild.member_list.length > 0);

  const cabin = codec.unpack('pb_campsite_data', moduleBytes(modules, 114));
  assert.ok(Array.isArray(cabin.groups_data));

  const rune = codec.unpack('pb_norse_rune', moduleBytes(modules, 156));
  assert.deepEqual(rune.type_list.map(row => row.type), [1, 2, 3, 4]);

  const magicModule = modules.get(157);
  assert.ok(Array.isArray(magicModule.value) && magicModule.value.length === 1);
  const magic = codec.unpack('pb_magic_circle_role', listSlotBytes(magicModule, 0));
  assert.equal(magic.magic_circle.length, 5);

  const timeModule = modules.get(159);
  assert.ok(Array.isArray(timeModule.value) && timeModule.value.length === 1);
  const time = codec.unpack('pb_time_temple_data', listSlotBytes(timeModule, 0));
  assert.deepEqual(time, { bond_data: [], runes_data: [], god_data: [], select_runes: [] });
}

test('joint login preserves handbook, training, guild, cabin, rune, magic-circle and time-temple modules', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-system-integration-'));
  const options = {
    databasePath: path.join(directory, 'game.sqlite'),
    statePath: path.join(directory, 'absent.json'),
    capturePath,
    serverOpenedAt: SERVER_OPENED_AT,
    now: () => SERVER_OPENED_AT * 1000
  };
  let game = createLocalGame(options);
  t.after(async () => {
    try { await game?.close(); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });

  const first = await decodeEtf(await game.loginPayload());
  const firstModules = loginModules(first);
  const firstHero = heroSlots(firstModules);
  assert.ok(firstHero.handbook.records.some(record => record.tid === HERO_TID));
  assert.deepEqual(firstHero.favour.favours, []);
  assertScrolls(firstModules);

  const stableBytes = new Map([24, 114, 156, 157, 159].map(moduleId => [moduleId, stableModuleBytes(firstModules, moduleId)]));
  const initialHandbookBytes = listSlotBytes(firstHero.module, 3);
  const initialFavourBytes = listSlotBytes(firstHero.module, 4);
  const stableHeroSlots = new Map(firstHero.module.value
    .map((slot, index) => [index, listSlotBytes(firstHero.module, index)])
    .filter(([index]) => index !== 3 && index !== 4));

  game.handbook.claimOwnAward(HERO_TID);
  const tables = readGameTables();
  game.store.transaction(model => grantResources(model, [[GIFT_TID, 6]], tables));
  game.heroFavor.execute(646, { hero_tid: HERO_TID, gifts: [{ tid: GIFT_TID, num: 6 }] });

  const second = await decodeEtf(await game.loginPayload());
  const secondModules = loginModules(second);
  const secondHero = heroSlots(secondModules);
  assert.ok(secondHero.handbook.records.some(record => record.tid === HERO_TID));
  assert.ok(secondHero.handbook.own_rev);
  assert.notDeepEqual(listSlotBytes(secondHero.module, 3), initialHandbookBytes);
  assert.equal(secondHero.favour.favours.find(row => row.hero_tid === HERO_TID).favour, 300);
  assert.notDeepEqual(listSlotBytes(secondHero.module, 4), initialFavourBytes);
  for (const [moduleId, bytes] of stableBytes) assert.deepEqual(stableModuleBytes(secondModules, moduleId), bytes, `module ${moduleId} is unchanged`);
  for (const [index, bytes] of stableHeroSlots) {
    assert.deepEqual(listSlotBytes(secondHero.module, index), bytes, `module 10 slot ${index} is unchanged`);
  }

  await game.close();
  game = undefined;
  game = createLocalGame(options);
  const reopened = await decodeEtf(await game.loginPayload());
  const reopenedModules = loginModules(reopened);
  const reopenedHero = heroSlots(reopenedModules);
  assert.deepEqual(listSlotBytes(reopenedHero.module, 3), listSlotBytes(secondHero.module, 3));
  assert.deepEqual(listSlotBytes(reopenedHero.module, 4), listSlotBytes(secondHero.module, 4));
  assert.ok(reopenedHero.handbook.own_rev);
  assert.equal(reopenedHero.favour.favours.find(row => row.hero_tid === HERO_TID).favour, 300);
  for (const [moduleId, bytes] of stableBytes) assert.deepEqual(stableModuleBytes(reopenedModules, moduleId), bytes, `module ${moduleId} survives reopen`);
  for (const [index, bytes] of stableHeroSlots) {
    assert.deepEqual(listSlotBytes(reopenedHero.module, index), bytes, `module 10 slot ${index} survives reopen`);
  }
});
