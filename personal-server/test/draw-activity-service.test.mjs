import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { grantResources } from '../game/resources.mjs';
import { createDrawActivityService, DRAW_ACTIVITY_COMMANDS } from '../game/draw-activity-service.mjs';
import { activityWindow, createActivityCalendar } from '../game/activity-calendar.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json', import.meta.url)));
const fixedNow = 1793400000000;
const SERVER_OPENED_AT = 1792789200;
const ACTIVITY_REFERENCE_OPENED_AT = 1790784000;

function setup(t, random = () => 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-draw-activity-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Draw Activity Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  let store = createGameStore({ databasePath: file, seed, codec });
  let service = createDrawActivityService({ store, codec, tables, now: () => fixedNow, random });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return {
    get store() { return store; },
    get service() { return service; },
    reopen(nextRandom = random) {
      store.close();
      store = createGameStore({ databasePath: file, seed, codec });
      service = createDrawActivityService({ store, codec, tables, now: () => fixedNow, random: nextRandom });
    }
  };
}

test('107901 spends the configured turntable price and grants the drawn award', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[6881900, 5]], tables));
  const result = e.service.execute(DRAW_ACTIVITY_COMMANDS.turntableGo, {});
  assert.equal(result.value.draw_tid, '101');
  assert.equal(e.store.read().resources.get('6881900').num, '4');
  assert.equal(e.store.read().resources.get('22002').num, '1');
  assert.equal(result.value.act_data.spins, '1');
  e.reopen();
  const next = e.service.execute(DRAW_ACTIVITY_COMMANDS.turntableGo, {});
  assert.equal(next.value.act_data.spins, '2');
  assert.equal(e.service.stateOf(100001, 'turntable', 1).counters.spins, 2);
});

test('107901 fails closed when the spin price is not affordable and keeps state intact', async t => {
  const e = setup(t);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.turntableGo, {}),
    error => error.code === 301
  );
  assert.equal(e.service.stateOf(100001, 'turntable', 1).counters.spins, undefined);
  assert.equal(e.store.read().resources.get('22002'), undefined);
});

test('102301 draws from the configured pool, grants the toy and enforces the draw limit', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[707002, 40]], tables));
  const first = e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyDraw, {});
  assert.equal(first.value.draw_count, '1');
  assert.deepEqual(first.value.draw_list, [{ toy: '683002', num: '3' }]);
  assert.equal(e.store.read().resources.get('683002').num, '3');
  assert.equal(e.store.read().resources.get('707002').num, '39');
  e.reopen();
  const second = e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyDraw, {});
  assert.equal(second.value.draw_count, '2');
  assert.equal(e.service.stateOf(100001, 'capsule_toy', 1).counters.draw_count, 2);
});

test('98101 validates the draw-library wish catalog and persists the selected wish', async t => {
  const e = setup(t);
  assert.equal(tables.DrawRandomWish.size, 6);
  const wish = tables.DrawRandomWish.get(300113);
  assert.equal(Number(wish.draw_lib), 30);

  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.chooseWish, {
      bytes: codec.pack('pb_role_random_draw_item', { draw_lib: 31, wish_tid: 300113 })
    }),
    error => error.code === 1
  );
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.chooseWish, {
      bytes: codec.pack('pb_role_random_draw_item', { draw_lib: 30, wish_tid: 300120 })
    }),
    error => error.code === 1
  );
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.chooseWish, {
      bytes: codec.pack('pb_role_random_draw_item', { draw_lib: 30 })
    }),
    error => error.code === 1
  );

  const selected = e.service.execute(DRAW_ACTIVITY_COMMANDS.chooseWish, {
    bytes: codec.pack('pb_role_random_draw_item', { draw_lib: 30, wish_tid: 300113 })
  });
  assert.deepEqual(selected.value.draw_list, [{ draw_lib: 30, wish_tid: '300113' }]);
  assert.equal(e.service.stateOf(100001, 'draw_wish', 30).selections.wish, 300113);
  e.reopen();
  assert.equal(e.service.stateOf(100001, 'draw_wish', 30).selections.wish, 300113);
});

test('88965 charges the extra-draw item, adds attempts and rejects over-cap requests', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[3401900, 100]], tables));
  const result = e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount, { times: 2 });
  assert.equal(result.value.changes.find(row => row.tid === '3401900').diff_num, '-30');
  assert.equal(e.service.stateOf(100001, 'three_admonition', 1).counters.draw_count, 2);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount, { times: 15 }),
    error => error.code === 311
  );
  assert.equal(e.service.stateOf(100001, 'three_admonition', 1).counters.draw_count, 2);
  assert.equal(e.store.read().resources.get('3401900').num, '70');
});

test('three admonition draws, boxes and selection state persist across reopen', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[3401900, 20], [3701900, 3]], tables));
  e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionAddDrawCount, { times: 1 });
  const drawn = e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionDraw, {});
  assert.equal(drawn.awardTid, 101);
  assert.deepEqual(drawn.value.new_role_data.award_index_list, [101]);
  assert.equal(e.store.read().resources.get('24300604').num, '5');
  assert.equal(e.store.read().resources.get('3701900').num, '2');
  e.reopen();
  assert.deepEqual(e.service.stateOf(100001, 'three_admonition', 1).selections.indices, [101]);
  const box = e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionBoxAward, { etf: 109 });
  assert.equal(box.boxTid, 109);
  assert.equal(e.store.read().resources.get('1041200').num, '1');
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.admonitionBoxAward, { etf: 109 }),
    error => error.code === 310
  );
});

test('capsule toy exchange, collection and progress use configured toys', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[683002, 1], [684002, 1], [708002, 80]], tables));
  const request = codec.pack('pb_capsule_toy_exchange_req', {
    act_id: 1, exchange_tid: 101, exchange_list: [
      { index: 0, item_list: [{ key: 683002, value: 1 }] },
      { index: 1, item_list: [{ key: 684002, value: 1 }] }
    ]
  });
  const exchanged = e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyExchange, { bytes: request });
  assert.equal(exchanged.exchangeTid, 101);
  assert.equal(e.store.read().resources.get('101500').num, '30000');
  const collected = e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyCollect, { etf: 683002 });
  assert.equal(collected.toyTid, 683002);
  assert.equal(e.store.read().resources.get('708002').num, '0');
  assert.equal(e.store.read().resources.get('101500').num, '31500');
  e.reopen();
  assert.equal(e.service.stateOf(100001, 'capsule_toy', 1).counters.exchanges['101'], 1);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.capsuleToyCollect, { etf: 683002 }),
    error => error.code === 310
  );
});

test('chess draw advances fixed awards, rejects a reused slot and opens the next round', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[469002, 20]], tables));
  const firstBytes = codec.pack('pb_chess_draw_req', { activity_id: 1, index: 0 });
  const secondBytes = codec.pack('pb_chess_draw_req', { activity_id: 1, index: 1 });
  const first = e.service.execute(DRAW_ACTIVITY_COMMANDS.chessDraw, { bytes: firstBytes });
  assert.equal(first.awardTid, 101);
  assert.equal(e.store.read().resources.get('101500').num, '388');
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.chessDraw, { bytes: firstBytes }),
    error => error.code === 310
  );
  const second = e.service.execute(DRAW_ACTIVITY_COMMANDS.chessDraw, { bytes: secondBytes });
  assert.equal(second.value.got_special, true);
  assert.equal(e.service.stateOf(100001, 'chess', 1).counters.turn_over, undefined);
  for (let index = 2; index < 15; index++) {
    e.service.execute(DRAW_ACTIVITY_COMMANDS.chessDraw, {
      bytes: codec.pack('pb_chess_draw_req', { activity_id: 1, index })
    });
  }
  assert.equal(e.service.stateOf(100001, 'chess', 1).counters.turn_over, 1);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.chessDraw, {
      bytes: codec.pack('pb_chess_draw_req', { activity_id: 1, index: 15 })
    }),
    error => error.code === 311
  );
  const next = e.service.execute(
    DRAW_ACTIVITY_COMMANDS.chessNewTurn,
    { bytes: codec.pack('pb_chess_new_turn_req', { activity_id: 1 }) }
  );
  assert.equal(next.value.turn, 2);
  assert.equal(e.service.stateOf(100001, 'chess', 1).counters.round, 2);
});

test('lottery activity draw writes an authoritative role log consumed by 92302', async t => {
  const e = setup(t);
  const drawn = e.service.execute(DRAW_ACTIVITY_COMMANDS.lotteryActDraw, { etf: 1 });
  assert.equal(drawn.free, true);
  assert.equal(drawn.value.hit_lib_tid_list.length, 1);
  const log = e.service.execute(DRAW_ACTIVITY_COMMANDS.lotteryActLog, { etf: 1 });
  assert.equal(log.value.log_list.length, 1);
  assert.equal(log.value.log_list[0].lib_tid, drawn.value.hit_lib_tid_list[0]);
});

test('child puzzle draw consumes the configured item and records its library award', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[709002, 20]], tables));
  const result = e.service.execute(DRAW_ACTIVITY_COMMANDS.puzzleDraw, {
    bytes: codec.pack('pb_puzzle_draw_req', { version: 1, buy_draw_item: false })
  });
  assert.equal(result.value.puzzle_id, 709002);
  assert.equal(e.service.stateOf(100001, 'child_puzzle', 1).counters.draw_times, 1);
  e.reopen();
  assert.equal(e.service.stateOf(100001, 'child_puzzle', 1).counters.draw_times, 1);
});

test('thousand draw keeps awards pending until the matching award command claims them', async t => {
  const e = setup(t);
  const drawn = e.service.execute(DRAW_ACTIVITY_COMMANDS.thousandDraw, {
    bytes: codec.pack('pb_request_thousand_draw', { type: 1 })
  });
  assert.equal(drawn.value.type_info_list[0].type, 1);
  assert.ok(drawn.value.type_info_list[0].award_list.length > 0);
  assert.equal(e.store.read().resources.get(String(drawn.awards[0][0]))?.num ?? undefined, undefined);
  const claimed = e.service.execute(DRAW_ACTIVITY_COMMANDS.thousandAward, {
    bytes: codec.pack('pb_request_thousand_award', { type: 1 })
  });
  assert.equal(claimed.value.res.changes.length, 1);
  assert.equal(e.service.stateOf(100001, 'thousand_draw', 1).counters.pending['1'], undefined);
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.thousandAward, {
      bytes: codec.pack('pb_request_thousand_award', { type: 1 })
    }),
    error => error.code === 311
  );
});

test('pray act persists a selected award, consumes draws and grants at the configured threshold', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[816002, 100]], tables));
  e.service.execute(DRAW_ACTIVITY_COMMANDS.praySelect, {
    bytes: codec.pack('pb_pray_act_select_award_req', {
      act_tid: 1,
      index_award_list: [
        { pray_index_tid: 1, award_tid: 1 },
        { pray_index_tid: 2, award_tid: 5 },
        { pray_index_tid: 3, award_tid: 9 },
        { pray_index_tid: 4, award_tid: 13 },
        { pray_index_tid: 5, award_tid: 17 }
      ]
    })
  });
  const drawn = e.service.execute(DRAW_ACTIVITY_COMMANDS.prayDraw, {
    bytes: codec.pack('pb_pray_act_draw_award_req', { act_tid: 1, cnt: 50 })
  });
  assert.equal(drawn.value.pray_act_info.pray_list[0].draw_cnt, 50);
  assert.ok(drawn.value.pray_act_info.pray_list.every(index => index.draw_cnt === 50));
  assert.equal(drawn.value.draw_critical_list.length, 50);
  assert.ok(drawn.value.draw_critical_list.every(draw => draw.draw_info.length === 5));
  assert.equal(e.store.read().resources.get('816002').num, '50');
  assert.equal(e.store.read().resources.get('3791200').num, '1');
  e.reopen();
  assert.equal(e.service.stateOf(100001, 'pray_act', 1).counters.drawCounts['1'], 50);
  assert.equal(e.service.stateOf(100001, 'pray_act', 1).counters.drawCounts['5'], 50);
});

test('pray draw fails closed until every configured index has a selected award', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[816002, 1]], tables));
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.praySelect, {
      bytes: codec.pack('pb_pray_act_select_award_req', {
        act_tid: 183013,
        index_award_list: [{ pray_index_tid: 61, award_tid: 242 }]
      })
    }),
    error => error.code === 1
  );
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.prayDraw, {
      bytes: codec.pack('pb_pray_act_draw_award_req', { act_tid: 183013, cnt: 1 })
    }),
    error => error.code === 311
  );
  assert.equal(e.store.read().resources.get('816002').num, '1');
});

test('pray act accepts the ActFrame instance id and keys state by its config version', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[816002, 50]], tables));
  e.service.execute(DRAW_ACTIVITY_COMMANDS.praySelect, {
    bytes: codec.pack('pb_pray_act_select_award_req', {
      act_tid: 183013,
      index_award_list: [
        { pray_index_tid: 61, award_tid: 242 },
        { pray_index_tid: 62, award_tid: 244 },
        { pray_index_tid: 63, award_tid: 248 },
        { pray_index_tid: 64, award_tid: 252 },
        { pray_index_tid: 65, award_tid: 256 }
      ]
    })
  });
  const drawn = e.service.execute(DRAW_ACTIVITY_COMMANDS.prayDraw, {
    bytes: codec.pack('pb_pray_act_draw_award_req', { act_tid: 183013, cnt: 50 })
  });
  assert.equal(drawn.value.pray_act_info.act_tid, 183013);
  assert.equal(drawn.value.pray_act_info.pray_list[0].pray_index_tid, 61);
  assert.equal(drawn.value.pray_act_info.pray_list[0].select_award_tid, 242);
  assert.equal(drawn.value.pray_act_info.pray_list[0].draw_cnt, 50);
  assert.equal(drawn.value.pray_act_info.pray_list[0].pray_award_info_list[0].history_cnt, 1);
  assert.deepEqual(drawn.value.pray_act_info.pray_list.map(index => index.draw_cnt), [50, 50, 50, 50, 50]);
  assert.deepEqual(drawn.value.pray_act_info.pray_list.map(index => index.progress_value), [0, 50, 50, 50, 50]);
  assert.deepEqual(drawn.value.pray_act_info.pray_list.map(index => index.pray_award_info_list[0].history_cnt), [1, 1, 2, 3, 3]);
  assert.equal(drawn.value.draw_critical_list.length, 50);
  assert.deepEqual(drawn.value.draw_critical_list[0].draw_info.map(info => info.pray_index), [61, 62, 63, 64, 65]);
  assert.deepEqual(drawn.value.draw_critical_list.map(draw => draw.draw_cnt), Array.from({ length: 50 }, (_, index) => index + 1));
  assert.equal(e.store.read().resources.get('816002').num, '0');
  e.reopen();
  assert.equal(e.service.stateOf(100001, 'pray_act', 13).counters.drawCounts['61'], 50);
  assert.equal(e.service.stateOf(100001, 'pray_act', 13).selections.awards['61'], 242);
  assert.equal(e.service.stateOf(100001, 'pray_act', 13).counters.drawCounts['65'], 50);
});

test('pray login payload restores persisted state and uses the table-relative window', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[816002, 50]], tables));
  e.service.execute(DRAW_ACTIVITY_COMMANDS.praySelect, {
    bytes: codec.pack('pb_pray_act_select_award_req', {
      act_tid: 183013,
      index_award_list: [
        { pray_index_tid: 61, award_tid: 242 },
        { pray_index_tid: 62, award_tid: 244 },
        { pray_index_tid: 63, award_tid: 248 },
        { pray_index_tid: 64, award_tid: 252 },
        { pray_index_tid: 65, award_tid: 256 }
      ]
    })
  });
  e.service.execute(DRAW_ACTIVITY_COMMANDS.prayDraw, {
    bytes: codec.pack('pb_pray_act_draw_award_req', { act_tid: 183013, cnt: 50 })
  });

  const modules = new Map(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103')
    .decoded[2].value.map(([id, entry]) => [Number(id), entry]));
  const activity = codec.unpack('pb_act_login', rawBinary(modules.get(92)));
  const result = e.service.synchronizeLogin(activity, modules.get(183), fixedNow / 1000);
  assert.deepEqual(result.activityIds, [183013]);
  assert.equal(result.loginActivities.length, 1);
  const payload = codec.unpack('pb_pray_act', result.loginActivities[0].blocks[0]);
  assert.equal(payload.act_tid, '183013');
  const index = payload.pray_list.find(row => Number(row.pray_index_tid) === 61);
  assert.equal(index.select_award_tid, '242');
  assert.equal(index.draw_cnt, '50');
  assert.equal(index.progress_value ?? 0, 0);
  assert.equal(index.pray_award_info_list[0].history_cnt, '1');
  assert.deepEqual(payload.pray_list.map(row => Number(row.draw_cnt)), [50, 50, 50, 50, 50]);
  assert.deepEqual(payload.pray_list.map(row => Number(row.progress_value ?? 0)), [0, 50, 50, 50, 50]);

  const expected = activityWindow(
    tables.ActFrameAct.get(183013),
    SERVER_OPENED_AT,
    ACTIVITY_REFERENCE_OPENED_AT
  );
  const at = expected.start + 60;
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    now: () => at * 1000
  });
  const scheduled = createDrawActivityService({ store: e.store, codec, tables, calendar, now: () => at * 1000 });
  const scheduledResult = scheduled.synchronizeLogin(activity, modules.get(183), at);
  assert.deepEqual(
    [scheduledResult.loginActivities[0].startTime, scheduledResult.loginActivities[0].endTime],
    [expected.start, expected.end]
  );
  const closedAt = expected.end + 1;
  const closedCalendar = createActivityCalendar({
    tables,
    serverOpenedAt: SERVER_OPENED_AT,
    activityReferenceOpenedAt: ACTIVITY_REFERENCE_OPENED_AT,
    now: () => closedAt * 1000
  });
  const closed = createDrawActivityService({ store: e.store, codec, tables, calendar: closedCalendar, now: () => closedAt * 1000 });
  assert.deepEqual(closed.synchronizeLogin(activity, modules.get(183), closedAt), { activityIds: [], loginActivities: [] });
});

test('flop card reserves a weighted award and claims it with cumulative progress', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[820202, 10]], tables));
  const flop = e.service.execute(DRAW_ACTIVITY_COMMANDS.flopDraw, {
    bytes: codec.pack('pb_flop_card_act_flop_req', { activity_id: 1, flop_type: 1 })
  });
  assert.equal(flop.value.act_info.total_count, 1);
  assert.equal(flop.value.act_info.flop_count, 1);
  assert.equal(e.store.read().resources.get('101500')?.num, undefined);
  const claimed = e.service.execute(DRAW_ACTIVITY_COMMANDS.flopClaim, {
    bytes: codec.pack('pb_flop_card_act_get_reward_req', { activity_id: 1 })
  });
  assert.equal(claimed.value.res.changes.find(change => change.tid === '101500').diff_num, '500');
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.flopClaim, {
      bytes: codec.pack('pb_flop_card_act_get_reward_req', { activity_id: 1 })
    }),
    error => error.code === 311
  );
});

test('draw activity encoding failure rolls back resources and persistent state', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-draw-rollback-'));
  const file = path.join(dir, 'game.sqlite');
  const seed = () => ({
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Draw Activity Test') }).toString('base64'),
    guides: {}, lineups: null
  });
  const store = createGameStore({ databasePath: file, seed, codec });
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  store.transaction(model => grantResources(model, [[709002, 20]], tables));
  const failingCodec = Object.create(codec);
  failingCodec.pack = (name, value) => {
    if (name === 'pb_puzzle_draw_back') throw new Error('forced draw activity encoding failure');
    return codec.pack(name, value);
  };
  const failing = createDrawActivityService({ store, codec: failingCodec, tables, now: () => fixedNow, random: () => 0 });
  assert.throws(
    () => failing.execute(DRAW_ACTIVITY_COMMANDS.puzzleDraw, {
      bytes: codec.pack('pb_puzzle_draw_req', { version: 1, buy_draw_item: false })
    }),
    /forced draw activity encoding failure/
  );
  assert.equal(store.read().resources.get('709002').num, '20');
  assert.equal(failing.stateOf(100001, 'child_puzzle', 1).counters.draw_times, undefined);
});

test('draw activity SQLite failure rolls back resources and persistent state', async t => {
  const e = setup(t);
  e.store.transaction(model => grantResources(model, [[709002, 20]], tables));
  e.store.inspect(db => db.exec(
    "CREATE TRIGGER reject_draw_activity_state BEFORE INSERT ON draw_activity_state " +
    "BEGIN SELECT RAISE(ABORT, 'forced draw activity SQLite failure'); END"
  ));
  assert.throws(
    () => e.service.execute(DRAW_ACTIVITY_COMMANDS.puzzleDraw, {
      bytes: codec.pack('pb_puzzle_draw_req', { version: 1, buy_draw_item: false })
    }),
    /forced draw activity SQLite failure/
  );
  assert.equal(e.store.read().resources.get('709002').num, '20');
  assert.equal(e.service.stateOf(100001, 'child_puzzle', 1).counters.draw_times, undefined);
});

