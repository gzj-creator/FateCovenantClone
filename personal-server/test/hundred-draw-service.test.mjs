import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createHundredDrawService } from '../game/hundred-draw-service.mjs';
import { activityWindow, createActivityCalendar } from '../game/activity-calendar.mjs';
import { readModuleData, writeModuleData } from '../game/develop-support.mjs';
import { decodeModuleLoginBlocks } from '../game/relic-divine-login.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const fixedNow = 1793300000000;

function setup(t, random = () => 0.999999, serviceCodec = codec, calendar = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-hundred-draw-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Hundred Draw Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec });
  let service = createHundredDrawService({ store, codec: serviceCodec, tables, calendar, now: () => fixedNow, random });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen(nextRandom = random) {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec });
      service = createHundredDrawService({ store, codec, tables, calendar, now: () => fixedNow, random: nextRandom });
    }
  };
}

const run = (service, type, value) => service.execute(type, value);

function setElfStar(store, tid, star) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const data = readModuleData(modules, 538, null, 'pb_elves_develop', { elves: [], help_slots: [] }, codec);
    const elf = data.elves.find(entry => Number(entry.tid) === Number(tid));
    if (elf) elf.star = star;
    else data.elves.push({ tid: String(tid), star });
    writeModuleData(modules, 538, null, 'pb_elves_develop', data, codec);
    model.state.modules.value = [...modules];
  });
}

function setPetStar(store, tid, star) {
  store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    const data = readModuleData(modules, 158, 0, 'pb_pet_develop_data', { pets: [], slots: [] }, codec);
    const pet = data.pets.find(entry => Number(entry.tid) === Number(tid));
    if (pet) pet.star = star;
    else data.pets.push({ tid: String(tid), star });
    writeModuleData(modules, 158, 0, 'pb_pet_develop_data', data, codec);
    model.state.modules.value = [...modules];
  });
}

test('117001 consumes the pool item, records cumulative draws and persists the result', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  const result = run(e.service, 117001, { act_id: 1102001, times: 10 });
  assert.equal(result.value.act_data.cumulative_draw_times, '10');
  assert.equal(result.value.act_data.received_process_tid_list.length, 0);
  assert.equal(e.store.read().resources.get('835802').num, '990');
  e.reopen();
  const after = run(e.service, 117001, { act_id: 1102001, times: 1 });
  assert.equal(after.value.act_data.cumulative_draw_times, '11');
  assert.equal(e.store.read().resources.get('835802').num, '989');
});

test('legacy ActivityTable func 20 uses the same version pool and draw item as ActFrame type 1102', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 30]], tables));
  const result = run(e.service, 117001, { act_id: 20001, times: 10 });
  assert.equal(result.value.act_data.act_id, '20001');
  assert.equal(result.value.act_data.cumulative_draw_times, '10');
  assert.equal(result.value.res.changes.find(row => row.tid === '835802').diff_num, '-10');
  const marquee = run(e.service, 117005, { act_id: 20001, start_range: 1, end_range: 10 });
  assert.ok(Array.isArray(marquee.value.data.data));
});

test('modern HundredDraw login groups fall back to the reference-relative activity window', t => {
  const serverOpenedAt = 1794326400;
  const activityReferenceOpenedAt = 1790784000;
  const at = 1795640400 + 60;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt,
    activityReferenceOpenedAt,
    now: () => at * 1000
  });
  const e = setup(t, () => 0, codec, calendar);
  const groups = e.service.loginActFrameGroups({ act_list: [], act_custom_list: [] }, at);
  const group = groups.find(row => row.actId === 1102010);
  const expected = activityWindow(tables.ActFrameAct.get(1102010), serverOpenedAt, activityReferenceOpenedAt);

  assert.deepEqual([group.startTime, group.endTime], [expected.start, expected.end]);
});

test('117002 enforces the draw threshold, grants once and survives a reopen', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  assert.throws(() => run(e.service, 117002, { act_id: 1102001, tid_list: [10101] }), error => error.code === 311);
  run(e.service, 117001, { act_id: 1102001, times: 50 });
  const claimed = run(e.service, 117002, { act_id: 1102001, tid_list: [10101] });
  assert.equal(claimed.value.act_data.received_process_tid_list[0], '10101');
  assert.equal(claimed.value.res.changes.find(row => row.tid === '101500').diff_num, '500');
  assert.throws(() => run(e.service, 117002, { act_id: 1102001, tid_list: [10101] }), error => error.code === 310);
  e.reopen();
  assert.throws(() => run(e.service, 117002, { act_id: 1102001, tid_list: [10101] }), error => error.code === 310);
});

test('117003 selects a devolve target and 117005 reads the recorded marquee', async t => {
  const e = setup(t, () => 0);
  e.store.transaction(model => grantResources(model, [[835802, 10], [836302, 10]], tables));
  const selected = run(e.service, 117003, { act_id: 1102009, target_tid: 5040701 });
  assert.equal(selected.value.act_data.select_target_tid, '5040701');
  assert.throws(() => run(e.service, 117003, { act_id: 1102009, target_tid: 123 }), error => error.code === 1);
  run(e.service, 117001, { act_id: 1102001, times: 1 });
  const marquee = run(e.service, 117005, { act_id: 1102001, start_range: 1, end_range: 10 });
  assert.equal(marquee.value.data.data.length, 1);
  assert.equal(marquee.value.data.data[0].target_tid, '5040701');
});

test('117004 claims a hero star award once when the owned hero meets the target star', async t => {
  const e = setup(t);
  e.store.transaction(model => {
    model.heroInfo.hero_list.push({ tid: '5040701', uid: '5040701', level: 1, star: 10, star_progress: 0, breakthrough_level: 0, quality: 70 });
  });
  const result = run(e.service, 117004, { act_id: 1102001, tid_list: [10104] });
  assert.equal(result.value.act_data.received_star_tid_list[0], '10104');
  assert.equal(result.value.res.changes.find(row => row.tid === '6031200').diff_num, '2');
  assert.throws(() => run(e.service, 117004, { act_id: 1102001, tid_list: [10104] }), error => error.code === 310);
});

test('117004 rejects a star award before the target hero reaches the configured star', async t => {
  const e = setup(t);
  e.store.transaction(model => {
    model.heroInfo.hero_list.push({ tid: '5040701', uid: '5040701', level: 1, star: 5, star_progress: 0, breakthrough_level: 0, quality: 70 });
  });
  assert.throws(() => run(e.service, 117004, { act_id: 1102001, tid_list: [10104] }), error => error.code === 311);
});

test('117001 rolls costs and state back when response encoding fails', async t => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_hundred_act_draw_rsp') throw new Error('forced hundred-draw response failure');
      return codec.pack(name, value);
    }
  };
  const e = setup(t, () => 0.999999, failingCodec);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  assert.throws(
    () => run(e.service, 117001, { act_id: 1102001, times: 1 }),
    /forced hundred-draw response failure/
  );
  assert.equal(e.store.read().resources.get('835802').num, '1000');
  e.reopen();
  assert.equal(run(e.service, 117001, { act_id: 1102001, times: 1 }).value.act_data.cumulative_draw_times, '1');
});

test('117001 rolls costs and state back when SQLite rejects the state write', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[835802, 1000]], tables));
  e.store.inspect(db => db.exec(`
    CREATE TRIGGER hundred_draw_state_abort
    BEFORE INSERT ON hundred_draw_act_state
    BEGIN SELECT RAISE(ABORT, 'forced hundred-draw state failure'); END;
  `));
  assert.throws(
    () => run(e.service, 117001, { act_id: 1102001, times: 1 }),
    /forced hundred-draw state failure/
  );
  assert.equal(e.store.read().resources.get('835802').num, '1000');
  e.store.inspect(db => db.exec('DROP TRIGGER hundred_draw_state_abort'));
  assert.equal(run(e.service, 117001, { act_id: 1102001, times: 1 }).value.act_data.cumulative_draw_times, '1');
});

test('fixed-pool login reports the configured elf target and zero guarantee before the first draw', t => {
  const e = setup(t);
  const encoded = e.service.loginPayload(1102008, Math.floor(fixedNow / 1000));
  // 模块 92/183 的字段契约是 ETF BINARY 包装（0x83 0x6d + 长度）。
  assert.equal(encoded.subarray(0, 2).toString('hex'), '836d');
  const blocks = decodeModuleLoginBlocks(encoded);
  assert.equal(blocks.length, 1);
  const data = codec.unpack('pb_hundred_draw_act_data', blocks[0]);
  assert.equal(data.act_id, '1102008');
  assert.equal(data.select_target_tid, '500520');
  assert.equal(Number(data.cumulative_draw_times ?? 0), 0);
  assert.equal(Number(data.guarantee_times ?? 0), 0);
  assert.equal(data.received_star_tid_list.length, 0);
  const stored = e.store.inspect(db => db.prepare(
    'SELECT select_target_tid FROM hundred_draw_act_state WHERE role_id=? AND act_id=?'
  ).get(100001, 1102008));
  assert.equal(stored.select_target_tid, 500520);
});

test('117004 claims an elf star award from module 538 and rejects a repeated claim', t => {
  const e = setup(t);
  setElfStar(e.store, 500520, 5);
  const result = run(e.service, 117004, { act_id: 1102008, tid_list: [10301] });
  assert.equal(result.value.act_data.select_target_tid, '500520');
  assert.equal(result.value.act_data.received_star_tid_list[0], '10301');
  assert.equal(result.value.res.changes.find(row => row.tid === '836102').diff_num, '10');
  assert.throws(() => run(e.service, 117004, { act_id: 1102008, tid_list: [10301] }), error => error.code === 310);
  e.reopen();
  assert.throws(() => run(e.service, 117004, { act_id: 1102008, tid_list: [10301] }), error => error.code === 310);
});

test('117004 rejects an elf star award below the configured star', t => {
  const e = setup(t);
  setElfStar(e.store, 500520, 4);
  assert.throws(() => run(e.service, 117004, { act_id: 1102008, tid_list: [10301] }), error => error.code === 311);
});

test('117004 keeps the unmapped elf type-104 reward closed instead of granting a guess', t => {
  const e = setup(t);
  setElfStar(e.store, 500520, 8);
  assert.throws(() => run(e.service, 117004, { act_id: 1102008, tid_list: [10303] }), error => error.code === 5);
  const state = e.store.inspect(db => db.prepare(
    'SELECT received_star_tid_list_json FROM hundred_draw_act_state WHERE role_id=? AND act_id=?'
  ).get(100001, 1102008));
  assert.equal(state?.received_star_tid_list_json ?? '[]', '[]');
});

test('117004 reads pet stars from module 158 for theme 102', t => {
  const e = setup(t);
  setPetStar(e.store, 500113, 6);
  const result = run(e.service, 117004, { act_id: 1102005, tid_list: [10201] });
  assert.equal(result.value.act_data.select_target_tid, '500113');
  assert.equal(result.value.res.changes.find(row => row.tid === '835902').diff_num, '10');
});

test('117002 maps the elf progress chip through ItemTable.Chip', t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[836102, 200]], tables));
  run(e.service, 117001, { act_id: 1102008, times: 100 });
  run(e.service, 117001, { act_id: 1102008, times: 25 });
  const claimed = run(e.service, 117002, { act_id: 1102008, tid_list: [10303] });
  assert.equal(claimed.value.res.changes.find(row => row.tid === '500521').diff_num, '100');
});

test('117001 records target hit counts instead of timestamps', t => {
  const e = setup(t, () => 0);
  e.store.transaction(model => grantResources(model, [[836102, 20]], tables));
  const result = run(e.service, 117001, { act_id: 1102008, times: 10 });
  assert.equal(result.value.act_data.draw_target_time, '10');
  assert.equal(result.value.act_data.ten_target_times, '10');
  assert.equal(result.value.act_data.guarantee_times, '0');
});

test('117004 rolls the star claim back when response encoding fails', t => {
  const failingCodec = {
    ...codec,
    pack(name, value) {
      if (name === 'pb_hundred_draw_act_rec_star_award_rsp') throw new Error('forced star response failure');
      return codec.pack(name, value);
    }
  };
  const e = setup(t, () => 0.999999, failingCodec);
  setElfStar(e.store, 500520, 5);
  assert.throws(() => run(e.service, 117004, { act_id: 1102008, tid_list: [10301] }), /forced star response failure/);
  assert.equal(e.store.read().resources.get('836102'), undefined);
  e.reopen();
  const claimed = run(e.service, 117004, { act_id: 1102008, tid_list: [10301] });
  assert.equal(claimed.value.res.changes.find(row => row.tid === '836102').diff_num, '10');
});
