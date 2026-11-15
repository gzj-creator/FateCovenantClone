// Read the generated FightTable shard constructor without running client Lua.
// Register 0 is a pool of shared arrays in these files, not the field map.
export function readFightShard(parsed) {
  const proto = parsed.prototypes[parsed.rootPrototype];
  const fields = proto.constants.find(item => item.type === 'table'
    && item.hash.some(([key]) => key === 'tid'))?.hash;
  if (!fields) throw new Error('Fight shard field map is missing');
  const registers = [];
  const literal = item => new Map([
    ...item.array.map((value, index) => [index, value]), ...item.hash
  ].filter(([, value]) => value !== null));
  let rows;
  for (const instruction of proto.instructions) {
    const { a, b, c, d } = instruction;
    switch (instruction.name) {
      case 'TNEW': registers[a] = new Map(); break;
      case 'TDUP': registers[a] = literal(proto.constants[d]); break;
      case 'GGET': {
        const name = proto.constants[d].value;
        if (name === 'TableEmpty') registers[a] = new Map();
        else if (name === 'setmetatable') registers[a] = row => row;
        else if (name === 'rawget') registers[a] = { rawget: true };
        else throw new Error('Unsupported fight shard global: ' + name);
        break;
      }
      case 'FNEW': registers[a] = { closure: true }; break;
      case 'TSETS':
        if (proto.constants[c].value !== '__index') throw new Error('Unexpected shard metadata');
        break;
      case 'MOV': registers[a] = registers[d]; break;
      case 'TGETB': registers[a] = registers[b].get(c); break;
      case 'TSETB': registers[b].set(c, registers[a]); break;
      case 'TSETV': registers[b].set(registers[c], registers[a]); break;
      case 'KSHORT': registers[a] = (d << 16) >> 16; break;
      case 'KNUM': registers[a] = proto.numbers[d]; break;
      case 'KSTR': registers[a] = proto.constants[d].value; break;
      case 'KPRI': registers[a] = [null, false, true][d]; break;
      case 'CALL':
        if (b !== 2 || c !== 3 || typeof registers[a] !== 'function') throw new Error('Unexpected shard call');
        registers[a] = registers[a](registers[a + 2], registers[a + 3]);
        break;
      case 'UCLO': break;
      case 'RET1': rows = registers[a]; break;
      default: throw new Error('Unsupported fight shard opcode: ' + instruction.name);
    }
  }
  if (!(rows instanceof Map)) throw new Error('Fight shard did not return rows');
  const convert = value => value instanceof Map
    ? [...value].filter(([key]) => Number.isInteger(key) && key > 0)
      .sort(([left], [right]) => left - right).map(([, item]) => convert(item))
    : value;
  return new Map([...rows].map(([tid, row]) => {
    const value = Object.fromEntries(fields.map(([field, index]) => [field, convert(row.get(index))]));
    if (Number(value.tid) !== Number(tid)) throw new Error('Fight shard row id mismatch: ' + tid);
    return [Number(tid), value];
  }));
}
