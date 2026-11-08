import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec } from '../protocol/game-codec.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';
import { createCommonMapService } from '../game/common-map-service.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { readCommonMapTables } from '../config/common-map-tables.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const FIXED_NOW = 1794000000000;
const MAP_TID = 9001;
const DIAMOND = '101500';
// 9000100 is a beatable combat NPC and 5040201 the elite NPC that wins against
// the fixture line-up; both results come from the real simulateBattle run.
const WINNING_ENEMY = 9000100;
const LOSING_ENEMY = 5040201;

function fixtureTables({ enemy = WINNING_ENEMY } = {}) {
  return {
    source: 'test-fixture',
    available: true,
    nodes: new Map(),
    maps: new Map([[MAP_TID, {
      tid: MAP_TID, x: 4, y: 4,
      nodes: [
        {
          index: 0, x: 0, y: 0, type: 1, isLine: true, dbData: 0, cfgData: 0,
          enemies: [enemy], award: [[101500, 10]], need: -1, repeat: true, buffs: [7]
        },
        {
          index: 1, x: 1, y: 0, type: 2, isLine: false, dbData: 0, cfgData: 1,
          enemies: [], award: [[101500, 5]], need: 0, repeat: false, buffs: []
        }
      ]
    }]])
  };
}

function setLineup(store) {
  store.transaction(model => {
    model.playLineups = [{ type: 1, team_list: [{ team_index: 1, fighter_list: [
      { hero_id: '2010101', loc: 6 }, { hero_id: '2010201', loc: 4 }, { hero_id: '1020601', loc: 2 }
    ] }] }];
  });
}

function setup(t, options = {}) {
  const fixture = createGameFixture(t, codec, { prefix: 'fc-common-map-', now: () => FIXED_NOW });
  setLineup(fixture.store);
  const tables = options.tables ?? fixtureTables(options);
  const build = (store, next = {}) => createCommonMapService({
    store, codec: next.codec ?? codec, tables, heroTables, gameTables, attributeTables,
    now: () => FIXED_NOW
  });
  return { fixture, tables, build, diamond: store => BigInt(store.read().resources.get(DIAMOND)?.num ?? 0) };
}

test('90601 initialises pb_common_map state and reloads it after a reopen', t => {
  const env = setup(t);
  const first = codec.unpack('pb_common_map_init_back', env.build(env.fixture.store).execute(90601, { map_tid: MAP_TID }).data);
  const map = codec.unpack('pb_common_map', Buffer.from(first.fun_bin, 'base64'));
  assert.equal(map.line_list.length, 1);
  assert.equal(map.evt_list.length, 1);
  assert.equal(Boolean(map.evt_list[0].is_over), false);
  const reopened = codec.unpack('pb_common_map', Buffer.from(codec.unpack('pb_common_map_init_back',
    env.build(env.fixture.open()).execute(90601, { map_tid: MAP_TID }).data).fun_bin, 'base64'));
  assert.deepEqual(reopened, map);
});

test('90602 settles a real simulateBattle node once and grants the configured reward', t => {
  const env = setup(t);
  const service = env.build(env.fixture.store);
  const before = env.diamond(env.fixture.store);
  const reply = codec.unpack('pb_common_map_node_trigger_back', service.execute(90602, {
    map_tid: MAP_TID, sub_id: 0, is_line: true, x: 0, y: 0, param: Buffer.alloc(0)
  }).data);
  assert.equal(Boolean(reply.trigger_node.is_over), true);
  assert.deepEqual(reply.add_buff_list, [7]);
  assert.equal(reply.res.changes.length, 1);
  assert.equal(env.diamond(env.fixture.store), before + 10n);

  // A replay of a cleared node must not grant the clear reward twice.
  const replay = codec.unpack('pb_common_map_node_trigger_back', service.execute(90602, {
    map_tid: MAP_TID, sub_id: 0, is_line: true, x: 0, y: 0, param: Buffer.alloc(0)
  }).data);
  assert.equal(Boolean(replay.trigger_node.is_over), true);
  assert.equal(replay.res.changes.length, 0);
  assert.equal(env.diamond(env.fixture.store), before + 10n);
});

test('90602 keeps a lost node open and 90603 sweeps a cleared node', t => {
  const lossEnv = setup(t, { enemy: LOSING_ENEMY });
  const loss = codec.unpack('pb_common_map_node_trigger_back', lossEnv.build(lossEnv.fixture.store).execute(90602, {
    map_tid: MAP_TID, sub_id: 0, is_line: true, x: 0, y: 0, param: Buffer.alloc(0)
  }).data);
  assert.equal(Boolean(loss.trigger_node.is_over), false);
  assert.equal(loss.res.changes.length, 0);
  assert.equal(lossEnv.diamond(lossEnv.fixture.store), 0n);

  const env = setup(t);
  const service = env.build(env.fixture.store);
  assert.throws(() => service.execute(90603, { map_tid: MAP_TID, sub_id: 0 }), /not cleared/);
  service.execute(90602, { map_tid: MAP_TID, sub_id: 0, is_line: true, x: 0, y: 0, param: Buffer.alloc(0) });
  const before = env.diamond(env.fixture.store);
  const swept = codec.unpack('pb_common_map_sweep_trigger_back', service.execute(90603, { map_tid: MAP_TID, sub_id: 0 }).data);
  assert.equal(Boolean(swept.map_info.line_list[0].is_over), true);
  assert.equal(swept.res.changes.length, 1);
  assert.equal(env.diamond(env.fixture.store), before + 10n);
  // Node 1 is configured repeat=false, so its sweep is refused.
  service.execute(90602, { map_tid: MAP_TID, sub_id: 1, is_line: false, x: 1, y: 0, param: Buffer.alloc(0) });
  assert.throws(() => service.execute(90603, { map_tid: MAP_TID, sub_id: 1 }), /cannot be swept/);
});

test('common map fails closed without configuration and rolls back when the reply cannot be encoded', t => {
  const env = setup(t);
  const service = env.build(env.fixture.store);
  assert.throws(() => service.execute(90601, { map_tid: 123456 }), /Common map configuration missing/);
  assert.throws(() => service.execute(90602, { map_tid: 123456, x: 0, y: 0 }), /Common map configuration missing/);
  assert.throws(() => service.execute(90602, { map_tid: MAP_TID, x: 9, y: 9 }), /node is missing/);

  const broken = env.build(env.fixture.store, { codec: { unpack: codec.unpack, pack() { throw new Error('pb-pack-failure'); } } });
  assert.throws(() => broken.execute(90602, { map_tid: MAP_TID, sub_id: 0, is_line: true, x: 0, y: 0, param: Buffer.alloc(0) }), /pb-pack-failure/);
  assert.equal(env.diamond(env.fixture.store), 0n, 'reward must roll back with the failed reply');
  const map = codec.unpack('pb_common_map', Buffer.from(codec.unpack('pb_common_map_init_back', service.execute(90601, { map_tid: MAP_TID }).data).fun_bin, 'base64'));
  assert.equal(Boolean(map.line_list[0].is_over), false, 'node progress must roll back with the failed reply');

  // The shipped asset root has no CommonMapTable yet, so the production reader
  // reports unavailability and every command fails closed.
  assert.equal(readCommonMapTables().available, false);
});
