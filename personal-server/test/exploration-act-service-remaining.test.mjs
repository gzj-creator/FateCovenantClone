import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, encodeEtf } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readExplorationActTables } from '../config/exploration-act-tables.mjs';
import { createExplorationActService } from '../game/exploration-act-service.mjs';
import { grantResources } from '../game/resources.mjs';
import { createSeed } from './helpers/game-fixture.mjs';
import { GameError } from '../game/hero-progression.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const explorationTables = readExplorationActTables();
const OPENED_AT = 1792789200;
const START = (OPENED_AT + 90000) * 1000;

function open(now = () => START, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-g1-remaining-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const store = createGameStore({ databasePath, seed: () => createSeed(codec), codec, serverOpenedAt: OPENED_AT });
  const service = createExplorationActService({
    store, codec, tables, explorationTables: options.explorationTables ?? explorationTables,
    calendar: options.calendar, now, random: () => 0
  });
  return { directory, databasePath, store, service };
}

function reopen(databasePath, now = () => START) {
  const store = createGameStore({ databasePath, codec, serverOpenedAt: OPENED_AT });
  const service = createExplorationActService({ store, codec, tables, explorationTables, now, random: () => 0 });
  return { store, service };
}

function fund(store, pairs) {
  store.transaction(model => grantResources(model, pairs, tables, { codec }));
}

function balance(store, tid) {
  return Number(store.transaction(model => model.resources.get(String(tid))?.num ?? 0));
}

function cleanup(directory) {
  try { fs.rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }); } catch {}
}

async function run(service, type, data = Buffer.alloc(0)) {
  return service.execute(type, data);
}

function unpack(schema, result) {
  return codec.unpack(schema, result.data);
}

async function expectCode(promise, code) {
  await assert.rejects(promise, error => error instanceof GameError && error.code === code);
}

test('Homeland selection, task, decoration and clear survive reopen', async () => {
  const env = open();
  try {
    const select = await run(env.service, 11501, codec.pack('pb_homeland_act_select_hero_req', {
      activity_id: 2, hero_tid: 5040601
    }));
    assert.equal(Number(unpack('pb_homeland_act_select_hero_rsp', select).act_info.selected_hero_tid), 5040601);

    const task = await run(env.service, 11502, codec.pack('pb_homeland_act_task_award_req', {
      activity_id: 2, task_tid: 201
    }));
    assert.equal(unpack('pb_homeland_act_task_award_rsp', task).act_info.finish_tasks.length, 1);
    await expectCode(run(env.service, 11502, codec.pack('pb_homeland_act_task_award_req', {
      activity_id: 2, task_tid: 201
    })), 310);

    const decorate = await run(env.service, 11503, codec.pack('pb_homeland_act_decorate_req', {
      activity_id: 2,
      furniture_list: [{ furniture_tid: 100974400, x: 1, y: 1, furniture_type: 0 }]
    }));
    assert.equal(unpack('pb_homeland_act_decorate_rsp', decorate).act_info.decorate_list.length, 1);

    const cleared = await run(env.service, 11505, codec.pack('pb_homeland_act_clear_room_req', { activity_id: 2 }));
    assert.equal(unpack('pb_homeland_act_clear_room_rsp', cleared).act_info.is_cleaned, true);

    env.store.close();
    const second = reopen(env.databasePath);
    try {
      const selected = await run(second.service, 11501, codec.pack('pb_homeland_act_select_hero_req', {
        activity_id: 2, hero_tid: 5040601
      }));
      assert.equal(Number(unpack('pb_homeland_act_select_hero_rsp', selected).act_info.selected_hero_tid), 5040601);
      await expectCode(run(second.service, 11505, codec.pack('pb_homeland_act_clear_room_req', { activity_id: 2 })), 311);
    } finally {
      second.store.close();
    }
  } finally {
    cleanup(env.directory);
  }
});

test('Carnival dice, events, build, tech, dispatch and box award use local state', async () => {
  let clock = START;
  const env = open(() => clock);
  try {
    fund(env.store, [[101500, 5000]]);
    const latest = await run(env.service, 43016);
    assert.equal(unpack('pb_mono_req_data_back', latest).monopoly.total_throw_dice_num ?? 0, 0);

    const thrown = await run(env.service, 43006, await encodeEtf([10]));
    assert.equal(unpack('pb_mono_throw_dice_back', thrown).cur_index, 10);
    await run(env.service, 43008, await encodeEtf([10]));
    const finished = await run(env.service, 43009, await encodeEtf([10]));
    assert.ok(unpack('pb_mono_finish_ev_back', finished));

    const built = await run(env.service, 43018, await encodeEtf([1]));
    assert.equal(unpack('pb_mono_build_handle_back', built).one_build.id, 1);
    const upgraded = await run(env.service, 43019, await encodeEtf([1]));
    assert.equal(unpack('pb_mono_build_handle_back', upgraded).one_build.level, 2);
    clock += 20000 * 1000;
    const harvested = await run(env.service, 43020, await encodeEtf([1]));
    assert.ok(unpack('pb_mono_build_handle_back', harvested).res.changes.length > 0);

    clock += 8 * 86400 * 1000;
    const tech = await run(env.service, 43021, await encodeEtf([101]));
    assert.equal(unpack('pb_mono_req_data_back', tech).monopoly.tech_list.length, 1);
    await run(env.service, 43003, await encodeEtf([2002]));
    const dispatch = await run(env.service, 43022, codec.pack('pb_mono_dispatch_req', {
      dispatch: [{ index: 1, one_dispatch: { heroes: [] } }]
    }));
    assert.ok(unpack('pb_mono_build_data', dispatch));
    await run(env.service, 43014, await encodeEtf([1]));
    await run(env.service, 43010);

    await run(env.service, 43006, await encodeEtf([1]));
    const boxEvent = await run(env.service, 43009, await encodeEtf([11]));
    assert.ok(unpack('pb_mono_finish_ev_back', boxEvent));
    const box = await run(env.service, 43023, await encodeEtf([1]));
    assert.ok((unpack('pb_mono_req_data_back', box).monopoly.left_box_num ?? 0) >= 0);
    await expectCode(run(env.service, 43017, await encodeEtf([1])), 311);
    await run(env.service, 43024, codec.pack('pb_mono_build_handle_req', { build_id: 1, custom_bin: Buffer.alloc(0) }));
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Theme treasure hunt, challenge, exchange and server query commit once', async () => {
  const env = open();
  try {
    fund(env.store, [[173002, 200], [4401900, 1000]]);
    const server = await run(env.service, 76512, await encodeEtf([1]));
    assert.equal(unpack('pb_theme_treasure_server_rsp', server).server_step ?? 0, 0);
    const hunt = await run(env.service, 76501, codec.pack('pb_theme_treasure_hunt_req', {
      activity_id: 1, step: 50, get_target_player: false
    }));
    assert.equal(unpack('pb_theme_treasure_hunt_rsp', hunt).steps.length, 50);
    const huntTail = await run(env.service, 76501, codec.pack('pb_theme_treasure_hunt_req', {
      activity_id: 1, step: 30, get_target_player: false
    }));
    assert.equal(unpack('pb_theme_treasure_hunt_rsp', huntTail).steps.length, 30);
    assert.equal(balance(env.store, 173002), 120);

    const first = await run(env.service, 76507, await encodeEtf([1, 110001]));
    assert.ok(unpack('pb_res_to_client', first).changes.length > 0);
    await expectCode(run(env.service, 76502, codec.pack('pb_theme_treasure_challenge_req', {
      activity_id: 1, type: 0, tid: 110001
    })), 310);
    const second = await run(env.service, 76502, codec.pack('pb_theme_treasure_challenge_req', {
      activity_id: 1, type: 0, tid: 110003
    }));
    assert.ok(unpack('pb_res_to_client', second).changes.length > 0);
    await expectCode(run(env.service, 76505, codec.pack('pb_theme_treasure_challenge_turn_req', {
      activity_id: 1, tid: 110001
    })), 311);
    await run(env.service, 76503, await encodeEtf([1]));
    await run(env.service, 76506, await encodeEtf([1]));
    const exchange = await run(env.service, 76504, codec.pack('pb_theme_treasure_exchange_req', {
      activity_id: 1, tid: 1001, exchange_num: 1
    }));
    assert.ok(unpack('pb_theme_treasure_exchange_rsp', exchange).exchange.exchange.length > 0);
    await expectCode(run(env.service, 76504, codec.pack('pb_theme_treasure_exchange_req', {
      activity_id: 1, tid: 1001, exchange_num: 1
    })), 311);
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Treasure hunt generates a board, digs, composes, exchanges and refreshes', async () => {
  const env = open();
  try {
    fund(env.store, [[3101900, 100000]]);
    await run(env.service, 85605, await encodeEtf([6]));
    for (let index = 0; index < 6; index++) await run(env.service, 85601, await encodeEtf([1]));
    assert.equal(balance(env.store, 100013000), 1);

    await run(env.service, 85605, await encodeEtf([4]));
    const compose = await run(env.service, 85606, codec.pack('pb_treasure_hunt_compose_req', { src_index: 7, tar_index: 8 }));
    assert.equal(unpack('pb_treasure_hunt_compose_ret', compose).all_compose_list.length, 1);
    await run(env.service, 85605, await encodeEtf([4]));
    const automatic = await run(env.service, 85607);
    assert.ok(unpack('pb_treasure_hunt_compose_ret', automatic).all_compose_list.length >= 2);

    await run(env.service, 85605, await encodeEtf([2]));
    const refreshed = await run(env.service, 85610);
    const role = unpack('pb_treasure_hunt_refresh_ret', refreshed).role_data;
    const indexes = role.res.shovel_list.map(row => Number(row.index));
    assert.ok(indexes.length >= 2);
    await run(env.service, 85609, codec.pack('pb_treasure_hunt_exchange_req', {
      src_index: indexes[0], tar_index: indexes[1]
    }));
    await run(env.service, 85608, await encodeEtf([indexes[0]]));
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Dream event, week, single collect and collect award use recovered tables', async () => {
  const env = open();
  try {
    const refreshed = await run(env.service, 88010);
    assert.ok(unpack('pb_dream_refresh_event_rsp', refreshed).event);
    for (let index = 0; index < 5; index++) {
      const result = await run(env.service, 88001, codec.pack('pb_dream_finish_event_req', {
        param: codec.pack('pb_dream_event', { type: 1, data: Buffer.alloc(0) })
      }));
      assert.equal(unpack('pb_dream_fight_event_rsp', result).week_finish_event, index + 1);
    }
    const week = await run(env.service, 88003, await encodeEtf([1]));
    assert.ok(unpack('pb_dream_award_rsp', week));
    await expectCode(run(env.service, 88003, await encodeEtf([1])), 310);
    for (const tid of [1, 2, 3]) await run(env.service, 88009, await encodeEtf([tid]));
    await expectCode(run(env.service, 88009, await encodeEtf([1])), 310);
    const collect = await run(env.service, 88006, await encodeEtf([1]));
    assert.ok(unpack('pb_dream_award_rsp', collect));
    await expectCode(run(env.service, 88004, await encodeEtf([1])), 311);
    assert.ok(unpack('pb_dream_npc_lineup_rsp', await run(env.service, 88008)));
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Dream daily award uses FixAward once per server day and survives reopen', async () => {
  let clock = START;
  const env = open(() => clock);
  let reopened = null;
  try {
    const before = balance(env.store, 141002);
    const first = await run(env.service, 88002);
    const body = unpack('pb_dream_award_rsp', first);
    assert.ok(Number(body.got_day_award_stamp) > 0);
    assert.equal(body.res_change.changes.length, 3);
    assert.equal(balance(env.store, 141002) - before, 4);
    await expectCode(run(env.service, 88002), 310);

    env.store.close();
    reopened = reopen(env.databasePath, () => clock);
    await expectCode(run(reopened.service, 88002), 310);

    clock = START + 86400 * 1000;
    const next = await run(reopened.service, 88002);
    assert.notEqual(Number(unpack('pb_dream_award_rsp', next).got_day_award_stamp), Number(body.got_day_award_stamp));
  } finally {
    if (reopened) reopened.store.close(); else env.store.close();
    cleanup(env.directory);
  }
});

test('Magical journey sword, country, missions, boss and star skill persist', async () => {
  const env = open();
  try {
    fund(env.store, [[180002, 10000], [183002, 100], [187002, 100], [182002, 1000]]);
    for (let index = 0; index < 3; index++) await run(env.service, 89901);
    await expectCode(run(env.service, 89901), 311);
    const main = await run(env.service, 89902);
    assert.ok(unpack('pb_magical_journey_main_up_rsp', main).journey_power > 0);
    await run(env.service, 89903, codec.pack('pb_magical_journey_country_sub_active_req', {
      type: 1, index: 1, is_merge: false
    }));
    const sub = await run(env.service, 89904, await encodeEtf([1, 1]));
    assert.equal(unpack('pb_magical_journey_sub_up_rsp', sub).sub_info.level, 2);
    assert.ok(unpack('pb_magical_journey_sword_record_info', await run(env.service, 89905)).record_list.length === 1);
    await run(env.service, 89906, codec.pack('pb_magical_journey_collect_activate_req', {
      items: [{ tid: 10300, star: 1 }]
    }));
    await run(env.service, 89907, codec.pack('pb_magical_journey_collect_activate_req', {
      items: [{ tid: 1, star: 1 }]
    }));
    await run(env.service, 89910, codec.pack('pb_magical_journey_mission_fight_req', {
      season: 1, chapter: 101, mission: 1
    }));
    await run(env.service, 89910, codec.pack('pb_magical_journey_mission_fight_req', {
      season: 1, chapter: 101, mission: 20
    }));
    assert.ok(unpack('pb_magical_journey_task_rev_back', await run(env.service, 89908, await encodeEtf([1010020]))));
    assert.ok(unpack('pb_magical_journey_progress_rev_back', await run(env.service, 89912, await encodeEtf([1001]))));
    await expectCode(run(env.service, 89909, await encodeEtf([1001])), 310);
    const boss = await run(env.service, 89911, codec.pack('pb_magical_journey_boss_fight_req', {
      season: 1, fight_tid: 8900001, times: 1
    }));
    assert.ok(unpack('pb_magical_journey_boss_fight_back', boss).this_score > 0);
    const star = await run(env.service, 89915, await encodeEtf([10101]));
    assert.ok(unpack('pb_magical_journey_star_activate_rsp', star));
    await expectCode(run(env.service, 89915, await encodeEtf([10101])), 310);
    assert.ok(unpack('pb_magical_journey_open_handle', await run(env.service, 89916)));
    await run(env.service, 89914);
    await run(env.service, 89917);
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Pet activity select, fight claim, cure, favor, vitality and exchange', async () => {
  let clock = START;
  const env = open(() => clock);
  try {
    fund(env.store, [[378002, 10], [1901200, 1]]);
    const selected = await run(env.service, 90501, codec.pack('pb_req_pet_act_select_pet', {
      act_tid: 83010, pet_tid: 300313
    }));
    assert.equal(unpack('pb_pet_act_player', selected).selected_pet_tid, 300313);
    await run(env.service, 90502, codec.pack('pb_req_pet_act_daily_reward', {
      act_tid: 83010, challenge_tid: 28, task_id: [2801]
    }));
    await expectCode(run(env.service, 90502, codec.pack('pb_req_pet_act_daily_reward', {
      act_tid: 83010, challenge_tid: 28, task_id: [2801]
    })), 310);
    await run(env.service, 90504, codec.pack('pb_req_pet_act_cure', { act_tid: 83010, wound_tid: 37 }));
    clock += 10 * 1000;
    await run(env.service, 90505, codec.pack('pb_req_pet_act_cure', { act_tid: 83010, wound_tid: 37 }));
    await run(env.service, 90504, codec.pack('pb_req_pet_act_cure', { act_tid: 83010, wound_tid: 38 }));
    clock += 10 * 1000;
    await run(env.service, 90505, codec.pack('pb_req_pet_act_cure', { act_tid: 83010, wound_tid: 38 }));
    assert.ok(unpack('pb_pet_act_flush', await run(env.service, 90503, codec.pack('pb_req_pet_act_claim_likability_rewards', {
      act_tid: 83010, favor_tid: 1001
    }))));
    await run(env.service, 90506, await encodeEtf([83010]));
    await expectCode(run(env.service, 90506, await encodeEtf([83010])), 310);
    await run(env.service, 90507, await encodeEtf([300113]));
    await expectCode(run(env.service, 90507, await encodeEtf([300113])), 310);
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Grand tourer token, task, exchange, distance and enhance use the weekend tables', async () => {
  const env = open();
  try {
    fund(env.store, [[4001900, 10], [101500, 5000]]);
    await run(env.service, 87801);
    await expectCode(run(env.service, 87801), 310);
    await run(env.service, 87802, await encodeEtf([1]));
    await expectCode(run(env.service, 87802, await encodeEtf([1])), 310);
    await run(env.service, 87803, await encodeEtf([1]));
    await run(env.service, 87804, await encodeEtf([3]));
    await expectCode(run(env.service, 87804, await encodeEtf([3])), 311);
    await run(env.service, 87805, await encodeEtf([5]));
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Theme treasure server challenge pays the type=1 task once', async () => {
  const env = open();
  try {
    const roleId = Number(env.store.state().roleId);
    const stamp = new Date(START).toISOString();
    env.store.transaction((model, db) => {
      db.prepare(`INSERT INTO exploration_act_state (role_id, module, act_id, payload, created_at, updated_at)
        VALUES (?,?,?,?,?,?)`).run(roleId, 'theme_treasure', 63012,
        JSON.stringify({ step: 50000, claims: [], boxes: [], exchange: {} }), stamp, stamp);
    });
    const award = await run(env.service, 76509, await encodeEtf([63012, 1220001]));
    const body = unpack('pb_res_to_client', award);
    const change = body.changes.find(entry => Number(entry.tid) === 17002);
    assert.equal(Number(change?.diff_num), 500);
    await expectCode(run(env.service, 76509, await encodeEtf([63012, 1220001])), 310);
    await expectCode(run(env.service, 76509, await encodeEtf([63001, 110001])), 5);
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Magical journey sword enforces the daily exp cap and resets across days', async () => {
  let clock = START;
  const baseSword = [...explorationTables.magicalJourney.Sword.values()][0];
  const tightTables = {
    ...explorationTables,
    magicalJourney: {
      ...explorationTables.magicalJourney,
      Sword: new Map([[1, { ...baseSword, day_max: 300, day_times: 10 }]])
    }
  };
  const env = open(() => clock, { explorationTables: tightTables });
  try {
    await run(env.service, 89901);
    await expectCode(run(env.service, 89901), 311);
    clock += 86400 * 1000;
    const next = unpack('pb_magical_journey_sword_rsp', await run(env.service, 89901));
    assert.equal(Number(next.sword.use_free_times), 1);
    assert.equal(Number(next.sword.exp_contributed), 200);
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('G1 login synchronization publishes module 92 entries and dedicated modules', async () => {
  const active = new Set([1080001, 1085001, 63001, 84001, 100001]);
  const env = open(() => START, { calendar: { isActivityRunning: actId => active.has(Number(actId)) } });
  try {
    const activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    const login = env.service.synchronizeLogin(activity, Math.floor(START / 1000));
    assert.deepEqual(login.activityIds, [1080001, 1085001, 63001, 84001, 100001]);
    assert.deepEqual([...login.modules.keys()].sort((left, right) => left - right), [136, 145, 155, 168, 519]);
    const entryPayload = actId => {
      const entry = activity.act_list.find(row => Number(row.state_data.act_id) === actId);
      assert.ok(entry, 'module 92 entry for ' + actId);
      const bytes = Buffer.from(entry.module_login_data, 'base64');
      assert.equal(bytes[0], 0x83);
      assert.equal(bytes[1], 0x6d);
      return bytes.subarray(6);
    };
    assert.equal(Number(codec.unpack('pb_home_puzzle_act_data', entryPayload(1080001)).act_tid), 1080001);
    assert.equal(Number(codec.unpack('pb_homeland_act_role_data', entryPayload(1085001)).act_id), 1085001);
    assert.equal(Number(codec.unpack('pb_theme_treasure_hunt_login', entryPayload(63001)).server_step ?? 0), 0);
    assert.ok(codec.unpack('pb_radish_farm_role', entryPayload(84001)));
    assert.equal(codec.unpack('pb_experience_act_data', entryPayload(100001)).area_list.length, 1);
    assert.ok(codec.unpack('pb_treasure_hunt_fun_open_ret', login.modules.get(136)).map_data);
    assert.equal(login.modules.get(145).length, 3);
    assert.equal(Number(codec.unpack('pb_weekend_bonus', login.modules.get(145)[0]).func_tid), 2);
    assert.ok(codec.unpack('pb_grand_tourer', login.modules.get(145)[2]));
    assert.ok(codec.unpack('pb_magical_journey_login', login.modules.get(155)).country_info);
    assert.ok(codec.unpack('pb_monopoly', login.modules.get(168)).map_data);
    assert.ok(codec.unpack('pb_dream_role', login.modules.get(519)).group_events.length > 0);

    env.service.synchronizeLogin(activity, Math.floor(START / 1000));
    assert.equal(activity.act_list.length, 5);
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});

test('Remaining G1 command gaps stay explicit rather than returning empty success', async () => {
  const env = open();
  try {
    for (const type of [76510, 76511, 88005, 88007, 89913]) {
      await expectCode(run(env.service, type), 5);
    }
  } finally {
    env.store.close();
    fs.rmSync(env.directory, { recursive: true, force: true });
  }
});
