import test from 'node:test';
import assert from 'node:assert/strict';
import { readEquipTables, equipLevelRow } from '../config/equip-tables.mjs';

// EquipTable ships only as LuaJIT bytecode; the loader reads the prototype dump
// produced by tools/dump-table-prototypes.mjs. These assertions pin the table
// families and the keys that req_equip_level_up / req_equip_forge / req_equip_wear
// need, so a silently truncated dump fails here instead of at request time.
const tables = readEquipTables();

test('equip configuration exposes every table family the equip commands need', () => {
  assert.equal(tables.Equip.size, 80);
  assert.equal(tables.Type.size, 4);
  assert.equal(tables.Level.size, 2000);
  assert.equal(tables.EQ_Forge.size, 20);
  assert.equal(tables.Const.size, 1);
  for (const name of ['EQ_Quality', 'EQ_Master_Quality', 'EQ_Refine_Show', 'EQ_Inscription_Stage', 'Master', 'Talent', 'ResExchange', 'Refine', 'Inscription', 'DevelopType']) {
    assert.ok(tables[name] instanceof Map && tables[name].size > 0, name + ' must not be empty');
  }
});

test('equip templates carry the develop columns the client sends back as pb_equip', () => {
  const row = tables.Equip.get(10103);
  assert.equal(row.type, 1);
  assert.equal(row.quality, 1);
  assert.equal(row.lv_max, 10);
  assert.deepEqual(row.cost, [[157002, 1500], [201500, 1200]]);
  assert.deepEqual(row.per_level_attrs, [[2, 90]]);
  const types = new Set([...tables.Equip.values()].map(equip => Number(equip.type)));
  assert.deepEqual([...types].sort(), [1, 2, 3, 4]);
});

test('level rows are keyed by equip type and level with per-level cost', () => {
  assert.deepEqual(tables.Level.get(10001), { tid: 10001, equip_type: 1, level_exp: 0, cost: [[201500, 900]] });
  assert.deepEqual(tables.Level.get(20001), { tid: 20001, equip_type: 2, level_exp: 0, cost: [[201500, 600]] });
  assert.deepEqual(tables.Level.get(40001), { tid: 40001, equip_type: 4, level_exp: 0, cost: [[201500, 450]] });
  assert.equal(equipLevelRow(tables, 1, 1), tables.Level.get(10001));
  assert.equal(equipLevelRow(tables, 4, 1), tables.Level.get(40001));
  assert.equal(equipLevelRow(tables, 1, 0), null);
  assert.equal(equipLevelRow(tables, 5, 1), null);
});

test('develop constants describe the cell and one-key rules', () => {
  const constant = tables.Const.get(1);
  assert.equal(constant.cell_count, 6);
  assert.equal(constant.one_key_refine, 4);
  assert.equal(constant.inject_open, 5);
});

