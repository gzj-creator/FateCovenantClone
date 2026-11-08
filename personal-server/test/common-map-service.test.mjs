import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommonMapService } from '../game/common-map-service.mjs';
import { readCommonMapTables, COMMON_MAP_LAYOUT_GAP } from '../config/common-map-tables.mjs';

const tables = readCommonMapTables();

test('the shipped CommonMapTable loads its real definitions but no map layout', () => {
  assert.equal(tables.available, true);
  assert.equal(tables.layoutAvailable, false);
  // Eighteen sub tables ship in the dump; eleven of them are the small
  // definition maps the client indexes by tid.
  assert.deepEqual([...tables.definitions.keys()].sort(), [
    'Area', 'AwardPool', 'Box', 'BoxGroup', 'Buff', 'BuffGroup', 'Fight', 'FishingGame',
    'Game', 'GameAward', 'HideStory', 'HideStoryOption', 'Key', 'KeyType', 'Node',
    'RandomKey', 'RandomKeyConst'
  ]);
  assert.equal(tables.definitions.get('Node').size, 11);
  assert.equal(tables.definitions.get('Buff').size, 16);
  assert.equal(tables.definitions.get('GameAward').size, 76);
  // CommonMap itself is a single row carrying the request protobuf only.
  assert.equal(tables.maps.size, 1);
  const map = tables.maps.get(1);
  assert.equal(map.initPbStruct, 'pb_pet_play_master');
  assert.equal(map.layout, null, 'no map instance grid ships in the table');
  const node = tables.definitions.get('Node').get(1);
  assert.equal(node.luaClass, 'CMapBornPosNode');
  assert.equal(node.editorClass, 'BaseMapCellData');
});

test('90601-90603 fail closed with the layout gap instead of a fabricated map', () => {
  const events = [];
  const service = createCommonMapService({ tables, logger: event => events.push(event) });
  for (const type of [90601, 90602, 90603]) {
    assert.equal(service.supports(type), true);
    let error = null;
    try {
      service.execute(type, { map_tid: 1, sub_id: 0, x: 0, y: 0 });
    } catch (caught) {
      error = caught;
    }
    assert.ok(error, 'command ' + type + ' must refuse');
    assert.equal(error.code, 5);
    assert.equal(error.message, COMMON_MAP_LAYOUT_GAP);
  }
  assert.equal(events.length, 3);
  assert.deepEqual(events.map(event => event.type), [90601, 90602, 90603]);
  assert.equal(events[0].tableAvailable, true);
  assert.equal(events[0].mapRows, 1);
  assert.throws(() => service.execute(99999, {}), /Unsupported common map command/);
});

test('the gap is reported even when the table asset is missing entirely', () => {
  const service = createCommonMapService({ tables: { available: false, maps: new Map() } });
  assert.throws(() => service.execute(90601, {}), error => error.code === 5 && error.message === COMMON_MAP_LAYOUT_GAP);
});
