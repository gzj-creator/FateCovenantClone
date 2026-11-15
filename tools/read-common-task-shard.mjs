import assert from 'node:assert/strict';

// Read only the straight-line constructor shipped in TaskTable.CommonTask.*.
// Unlike readGeneratedDump, these constructors keep a cache in r0 and the
// field map in r1. The metatable captures that field map. No client code runs.
export function readCommonTaskShard(parsed) {
  const proto = parsed.prototypes[parsed.rootPrototype];
  const maps = proto.constants.filter(c => c.type === 'table' && c.hash.length === 8
    && c.hash.every(([key, ordinal]) => typeof key === 'string' && Number.isInteger(ordinal)));
  assert.equal(maps.length, 1, 'Expected one CommonTask field map');
  const fields = new Map(maps[0].hash);
  assert.deepEqual([...fields].sort((a, b) => a[1] - b[1]), [
    ['tid', 1], ['type', 2], ['target_count', 3], ['award', 4],
    ['award_n', 5], ['effect', 6], ['show_award', 7], ['show_award_n', 8]
  ]);
  const registers = [];
  const literal = c => new Map([...c.array.map((value, key) => [key, value]), ...c.hash]
    .filter(([, value]) => value !== null));
  let result;
  for (const i of proto.instructions) {
    const { a, b, c, d } = i;
    switch (i.name) {
      case 'TDUP': registers[a] = literal(proto.constants[d]); break;
      case 'TNEW': registers[a] = new Map(); break;
      case 'GGET': {
        const name = proto.constants[d].value;
        assert.ok(['TableEmpty', 'setmetatable', 'rawget'].includes(name), 'Unexpected global: ' + name);
        registers[a] = name === 'TableEmpty' ? new Map() : { global: name };
        break;
      }
      case 'FNEW': {
        const child = parsed.prototypes[proto.constants[d].prototype];
        assert.deepEqual(child.instructions.map(x => x.name), ['UGET', 'TGETV', 'UGET', 'MOV', 'MOV', 'CALLT']);
        // The child indexes its first captured value by field name, then
        // delegates to rawget(row, ordinal). Resolve the actual captured r1.
        const first = child.upvalues[child.instructions[0].d];
        assert.ok(first & 0x8000, 'Field map must be captured from this frame');
        const captured = registers[first & 0x3fff];
        assert.deepEqual(captured, fields, 'Metatable must capture the field map');
        registers[a] = { fieldIndices: captured };
        break;
      }
      case 'TSETS':
        assert.equal(proto.constants[c].value, '__index');
        registers[b].fieldIndices = registers[a].fieldIndices;
        break;
      case 'TSETB': registers[b].set(c, registers[a]); break;
      case 'TSETV': registers[b].set(registers[c], registers[a]); break;
      case 'TGETB': registers[a] = registers[b].get(c); break;
      case 'MOV': registers[a] = registers[d]; break;
      case 'KSHORT': registers[a] = d >= 32768 ? d - 65536 : d; break;
      case 'KNUM': registers[a] = proto.numbers[d]; break;
      case 'CALL':
        assert.equal(registers[a]?.global, 'setmetatable');
        assert.equal(b, 2); assert.equal(c, 3);
        assert.ok(registers[a + 2] instanceof Map);
        assert.deepEqual(registers[a + 3].fieldIndices, fields);
        registers[a + 2].fieldIndices = fields;
        registers[a] = registers[a + 2];
        break;
      case 'UCLO': break;
      case 'RET1': result = registers[a]; break;
      default: throw new Error('Unsupported CommonTask constructor instruction: ' + i.name);
    }
  }
  assert.ok(result instanceof Map);
  const convert = value => {
    if (!(value instanceof Map)) return value;
    assert.ok([...value.keys()].every(key => Number.isInteger(key) && key >= 0));
    const keys = [...value.keys()].filter(key => key > 0).sort((a, b) => a - b);
    if (!keys.length) return [];
    assert.deepEqual(keys, Array.from({ length: keys.length }, (_, n) => n + 1), 'Sparse nested resource array');
    return keys.map(key => convert(value.get(key)));
  };
  return [...result].map(([tid, raw]) => {
    assert.ok(raw instanceof Map && raw.fieldIndices === fields);
    const row = Object.fromEntries([...fields].map(([key, ordinal]) => [key, convert(raw.get(ordinal))]));
    assert.equal(tid, row.tid);
    assert.ok(row.award.length === row.award_n.length);
    return row;
  }).sort((a, b) => a.tid - b.tid);
}
