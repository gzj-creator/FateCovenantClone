import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readGuideTables } from '../config/guide-tables.mjs';
import { readGuideAwards } from '../config/guide-awards.mjs';
import { createGuideService, guideProcessIsOver, projectGuideLoginModule, saveGuideProcesses } from '../game/guide-service.mjs';
import { createLineupService } from '../game/lineup-service.mjs';

const codec = createGameCodec(), tables = readGameTables(), guides = readGuideTables(), awards = readGuideAwards();
const guideLogin = store => codec.unpack('pb_guide', rawBinary(new Map(store.state().modules.value).get(16)));
const hero = (store, tid) => store.read().heroInfo.hero_list.find(hero => Number(hero.tid) === tid);
const claims = store => store.inspect(db => db.prepare("SELECT claim_key FROM reward_claims WHERE claim_type='guide_award'").all());

function setup(t, extra = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-guide-original-', seed: { freshAccount: true } });
  return { fixture, store: fixture.store, service: createGuideService({ store: fixture.store, codec, tables, awards, ...extra }) };
}

function setMission(store, id) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value), module = modules.get(8);
    const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
    mission.mission_id = String(id);
    module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
    modules.set(8, module); model.state.modules.value = [...modules];
  });
}

function setFeatures(store, ids) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value), states = new Map();
    for (const id of ids) {
      const target = Math.floor(id / 1000), index = id % 1000;
      let bytes = states.get(target) ?? Buffer.alloc(125);
      bytes[Math.floor(index / 8)] |= 0x80 >> index % 8;
      states.set(target, bytes);
    }
    modules.set(3, serializedBinary(codec.pack('res_fun_open_login', {
      target_list: [...states].map(([target_tid, bytes]) => ({ target_tid, fun_open_state: bytes.toString('base64') }))
    })));
    model.state.modules.value = [...modules];
  });
}

function save(store, rows) {
  return store.transaction(model => {
    const value = saveGuideProcesses({ model, codec, reqList: rows });
    codec.pack('pb_req_save_process_back', value);
    return value;
  });
}

test('original Guide.Award contains all 16 rewards and exact early hero quantities', () => {
  assert.equal(awards.size, 16);
  assert.deepEqual(awards.get(1).items, [[1020601, 1]]);
  assert.deepEqual(awards.get(2).items, [[2020601, 1]]);
  assert.deepEqual(awards.get(16).items, [[10084600, 1], [10034600, 1], [10024600, 1], [10014600, 1]]);
  assert.deepEqual(guides.Process.get(104).keys, [106004, 106008]);
  assert.deepEqual(guides.Process.get(108).keys, [110004, 110008]);
});

test('first hero is granted after 10202 before the award key is saved; second waits until 2-1 clears', async t => {
  const { store, service } = setup(t);
  setMission(store, 10201);
  await assert.rejects(() => service.execute(8001, 1), /not completed/);
  setMission(store, 10202);
  assert.equal(store.state().guides['106004'], undefined);
  const result = await service.execute(8001, 1);
  const awardChange = codec.unpack('pb_res_to_client', result.data).changes.find(change => change.tid === '1020601');
  assert.equal(awardChange.diff_num, '1');
  const heroExtras = await decodeEtf(Buffer.from(awardChange.extra, 'base64'));
  assert.equal(heroExtras.value.length, 1);
  const grantedHero = codec.unpack('hero', Buffer.from(heroExtras.value[0].value));
  assert.equal(grantedHero.tid, '1020601');
  assert.equal(grantedHero.uid, '1020601');
  assert.equal(grantedHero.level, 1);
  assert.equal(Number(hero(store, 1020601).level), 1);
  assert.equal(Number(hero(store, 1020601).count), 1);
  assert.equal(Buffer.from(guideLogin(store).award, 'base64')[0], 0x40, 'award 1 is raw MSB-first bit 1, without ETF wrapping');
  assert.equal(store.state().guides['106004'], undefined, 'grant does not silently finish the client step');
  setMission(store, 10206);
  await assert.rejects(() => service.execute(8001, 2), /not completed/);
  assert.equal(hero(store, 2020601), undefined, 'do not pre-grant the post-2-1 hero');
  setMission(store, 20201);
  await service.execute(8001, 2);
  assert.equal(Number(hero(store, 2020601).count), 1);
  assert.equal(Buffer.from(guideLogin(store).award, 'base64')[0], 0x60);
  await assert.rejects(() => service.execute(8001, 1), /already claimed/);
  await assert.rejects(() => service.execute(8001, 2), /already claimed/);
});

test('guide hero and three-person lineup survive SQLite reopen through module 9', async t => {
  const { store, fixture, service } = setup(t);
  setMission(store, 10202);
  await service.execute(8001, 1);
  const lineupService = createLineupService({ store, codec, tables });
  const preset = structuredClone(store.read().lineups.pre_lineups[0]);
  preset.lineup.fighter_list.push({
    loc: 2,
    index: 3,
    hero_id: '1020601',
    equip_ids: [1, 2, 3, 4],
    relic_ids: ['0', '0', '0', '0']
  });
  const response = codec.unpack('pb_edit_pre_lineup_rsp', lineupService.execute(209, {
    pre_lineup_list: [preset],
    handle_types: ['0']
  }).data);
  assert.ok(response.role_lineup.pre_lineups[0].lineup.fighter_list.some(fighter => fighter.hero_id === '1020601'));

  const storedModule = store.inspect(db => JSON.parse(db.prepare(
    'SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=9'
  ).get(store.currentRoleId()).payload_json));
  const storedLogin = codec.unpack('pb_lineup_login', rawBinary(storedModule));
  const storedRole = codec.unpack('pb_role_lineup', Buffer.from(storedLogin.pre_lineup, 'base64'));
  assert.ok(storedRole.pre_lineups[0].lineup.fighter_list.some(fighter => fighter.hero_id === '1020601'));
  assert.ok(storedLogin.lineups.some(bytes => codec.unpack('pb_lineup', Buffer.from(bytes, 'base64'))
    .team_list[0].fighter_list.some(fighter => fighter.hero_id === '1020601')));

  const reopened = fixture.open();
  const loginModule = new Map(reopened.state().modules.value).get(9);
  const login = codec.unpack('pb_lineup_login', rawBinary(loginModule));
  const role = codec.unpack('pb_role_lineup', Buffer.from(login.pre_lineup, 'base64'));
  assert.ok(role.pre_lineups[0].lineup.fighter_list.some(fighter => fighter.hero_id === '1020601'));
  assert.ok(reopened.read().heroInfo.hero_list.some(hero => hero.uid === '1020601'));
});

test('guide progress validates original key membership and keeps intermediate steps unfinished across relogin', t => {
  const { store, fixture } = setup(t);
  assert.equal(guideProcessIsOver(104, 106004), false);
  assert.equal(guideProcessIsOver(104, 106008), true);
  assert.equal(guideProcessIsOver(900, 11), false);
  assert.deepEqual(save(store, [{ process_id: 104, key_id: 106004 }]).process_list,
    [{ process_id: 104, key_id: 106004, is_over: false }]);
  assert.equal(guideLogin(fixture.open()).process_list.find(row => row.process_id === 104).is_over === true, false);
  const reopened = fixture.store;
  const before = reopened.state();
  assert.throws(() => save(reopened, [{ process_id: 104, key_id: 106008 }, { process_id: 108, key_id: 106008 }]), /Invalid/);
  assert.deepEqual(reopened.state(), before, 'a malformed batch must not partly advance the guide');
  assert.throws(() => save(reopened, [{ process_id: 900, key_id: 11 }]), /Invalid/);
  save(reopened, [{ process_id: 104, key_id: 106008 }]);
  const stale = save(reopened, [{ process_id: 104, key_id: 106004 }]);
  assert.deepEqual(stale.process_list, [{ process_id: 104, key_id: 106008, is_over: true }]);
  const projected = projectGuideLoginModule({ entry: new Map(reopened.state().modules.value).get(16), guides: reopened.state().guides, codec });
  assert.deepEqual(codec.unpack('pb_guide', projected.data).process_list.find(row => row.process_id === 104), stale.process_list[0]);
});

test('module 16 projection repairs old intermediate is_over=true and preserves alternate processes sharing a key', () => {
  const entry = codec.pack('pb_guide', { award: 'YA==', process_list: [
    { process_id: 104, key_id: 106004, is_over: true },
    { process_id: 113, key_id: 106008, is_over: true },
    { process_id: 104, key_id: 106004, is_over: true }
  ] });
  const projected = codec.unpack('pb_guide', projectGuideLoginModule({ entry, guides: { 106004: 104 }, codec }).data);
  assert.equal(projected.award, 'YA==');
  assert.deepEqual(projected.process_list.map(row => ({ ...row, is_over: row.is_over === true })), [
    { process_id: 104, key_id: 106004, is_over: false },
    { process_id: 113, key_id: 106008, is_over: true }
  ]);
});

test('durable award bits and legacy claim keys independently prevent regrant after reopening', async t => {
  const { store, fixture, service } = setup(t);
  setMission(store, 10202);
  await service.execute(8001, 1);
  store.inspect(db => db.prepare("DELETE FROM reward_claims WHERE claim_type='guide_award'").run());
  const reopened = fixture.open();
  await assert.rejects(() => createGuideService({ store: reopened, codec, tables, awards }).execute(8001, 1), /already claimed/);
  assert.equal(Number(hero(reopened, 1020601).count), 1);
  reopened.transaction((model, db) => {
    const modules = new Map(model.state.modules.value), login = guideLogin(reopened);
    login.award = '';
    modules.set(16, serializedBinary(codec.pack('pb_guide', login))); model.state.modules.value = [...modules];
    db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(model.state.roleId, 'guide_award', '113:106004:1', '2026-11-14T00:00:00.000Z');
  });
  await assert.rejects(() => createGuideService({ store: reopened, codec, tables, awards }).execute(8001, 1), /already claimed/);
  assert.equal(Number(hero(reopened, 1020601).count), 1);
});

test('hero, bitset and claim all roll back on response or SQLite update failure', async t => {
  for (const failure of ['response', 'sqlite']) {
    const brokenCodec = { ...codec, pack(name, value) {
      if (failure === 'response' && name === 'pb_res_to_client') throw new Error('guide response failed');
      return codec.pack(name, value);
    } };
    const { store, service } = setup(t, { codec: brokenCodec });
    setMission(store, 10202);
    if (failure === 'sqlite') store.inspect(db => db.exec("CREATE TRIGGER guide_module_block BEFORE INSERT ON login_modules WHEN NEW.module_id=16 BEGIN SELECT RAISE(ABORT,'guide module blocked'); END;"));
    const before = store.state();
    await assert.rejects(() => service.execute(8001, 1), failure === 'response' ? /guide response failed/ : /guide module blocked/);
    assert.equal(hero(store, 1020601), undefined);
    assert.deepEqual(store.state(), before);
    assert.deepEqual(claims(store), []);
  }
});

test('first-key awards use recovered feature and completed-guide gates rather than pre-saving the award itself', async t => {
  const { store, service } = setup(t);
  setMission(store, 30204);
  await assert.rejects(() => service.execute(8001, 11), /not completed/);
  save(store, [{ process_id: 235, key_id: 235015 }]);
  await service.execute(8001, 11);
  assert.equal(store.state().guides['206002'], undefined);
  await assert.rejects(() => service.execute(8001, 16), /not completed/);
  save(store, [{ process_id: 10390, key_id: 365104 }]);
  await assert.rejects(() => service.execute(8001, 16), /not completed/);
  setFeatures(store, [1635]);
  await service.execute(8001, 16);
  assert.equal(store.state().guides['365106'], undefined);
  assert.equal(claims(store).length, 2);
});

test('rewards without a recovered triggering path stay explicitly unavailable', async t => {
  const { store, service } = setup(t);
  setMission(store, 40210);
  await assert.rejects(() => service.execute(8001, 3), error => error.code === 5 && /eligibility evidence/.test(error.message));
  assert.deepEqual(claims(store), []);
});

test('later reward paths require their original feature and preceding key, including the alternate process', async t => {
  for (const route of [
    { award: 14, process: 366, key: 364055, feature: 1542 },
    { award: 14, process: 10361, key: 365035, feature: 1542, prerequisite: { process_id: 10360, key_id: 365031 } },
    { award: 15, process: 10360, key: 365021, feature: 1625, unsupportedItem: 100614400 }
  ]) {
    await t.test('process ' + route.process, async t => {
      const { store, service } = setup(t);
      await assert.rejects(() => service.execute(8001, route.award), /not completed/);
      save(store, [{ process_id: route.process, key_id: route.key }]);
      await assert.rejects(() => service.execute(8001, route.award), /not completed/);
      setFeatures(store, [route.feature]);
      if (route.prerequisite) {
        await assert.rejects(() => service.execute(8001, route.award), /not completed/);
        save(store, [route.prerequisite]);
      }
      if (route.unsupportedItem) {
        await assert.rejects(() => service.execute(8001, route.award), new RegExp('no explicit handler: ' + route.unsupportedItem));
        assert.equal(claims(store).length, 0, 'unsupported reward cannot consume the entitlement');
      } else {
        await service.execute(8001, route.award);
        assert.equal(claims(store).length, 1);
      }
    });
  }
});

test('saving alternate guides that share key IDs persists both processes and rolls back a failed response', t => {
  const { store } = setup(t);
  save(store, [{ process_id: 104, key_id: 106004 }, { process_id: 113, key_id: 106008 }]);
  assert.deepEqual(guideLogin(store).process_list.filter(row => [104, 113].includes(row.process_id)), [
    { process_id: 104, key_id: 106004 }, { process_id: 113, key_id: 106008, is_over: true }
  ]);
  const before = store.state();
  assert.throws(() => store.transaction(model => {
    saveGuideProcesses({ model, codec, reqList: [{ process_id: 104, key_id: 106008 }] });
    throw new Error('save response failed');
  }), /save response failed/);
  assert.deepEqual(store.state(), before);
});
