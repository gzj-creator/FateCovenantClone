import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const names = ('ISLT ISGE ISLE ISGT ISEQV ISNEV ISEQS ISNES ISEQN ISNEN ISEQP ISNEP ISTC ISFC IST ISF ISTYPE ISNUM MOV NOT UNM LEN ADDVN SUBVN MULVN DIVVN MODVN ADDNV SUBNV MULNV DIVNV MODNV ADDVV SUBVV MULVV DIVVV MODVV POW CAT KSTR KCDATA KSHORT KNUM KPRI KNIL UGET USETV USETS USETN USETP UCLO FNEW TNEW TDUP GGET GSET TGETV TGETS TGETB TGETR TSETV TSETS TSETB TSETM TSETR CALLM CALL CALLMT CALLT ITERC ITERN VARG ISNEXT RETM RET RET0 RET1 FORI JFORI FORL IFORL JFORL ITERL IITERL JITERL LOOP ILOOP JLOOP JMP FUNCF IFUNCF JFUNCF FUNCV IFUNCV JFUNCV FUNCC FUNCCW').split(' ');

export function parseLuaJit(buffer, { allowMultipleRoots = false } = {}) {
  let position = 0;
  const need = size => { if (position + size > buffer.length || size < 0) throw new Error('Truncated LuaJIT dump'); };
  const byte = () => { need(1); return buffer[position++]; };
  const uleb = () => { let value = 0, factor = 1; for (let i = 0; i < 5; i++) { const b = byte(); value += (b & 127) * factor; if (!(b & 128)) return value; factor *= 128; } throw new Error('Invalid ULEB128'); };
  // LuaJIT's 33-bit number encoding stores the int/num discriminator in the
  // low bit of the first byte and the first six value bits in bits 1..6.
  // Remaining bytes use a seven-bit continuation starting at bit 6.
  const uleb33 = () => {
    let value = byte() >> 1;
    if (value >= 0x40) {
      value &= 0x3f;
      let shift = -1;
      let current;
      do {
        shift += 7;
        current = byte();
        value |= (current & 0x7f) << shift;
      } while (current & 0x80);
    }
    return value >>> 0;
  };
  const string = count => { need(count); const text = buffer.subarray(position, position + count).toString('utf8'); position += count; return text; };
  const double = (low, high) => { const b = Buffer.alloc(8); b.writeUInt32LE(low >>> 0, 0); b.writeUInt32LE(high >>> 0, 4); return b.readDoubleLE(); };

  if (byte() !== 27 || byte() !== 76 || byte() !== 74 || byte() !== 2) throw new Error('Expected LuaJIT dump v2');
  const flags = uleb();
  if (flags & 1) throw new Error('Big-endian LuaJIT dumps are unsupported');
  const chunk = flags & 2 ? null : string(uleb());
  const stack = [];
  const prototypes = [];
  const tableScalar = () => {
    const tag = uleb();
    if (tag >= 5) return string(tag - 5);
    if (tag === 0) return null;
    if (tag === 1) return false;
    if (tag === 2) return true;
    if (tag === 3) return uleb() | 0;
    if (tag === 4) return double(uleb(), uleb());
    throw new Error('Unknown table scalar');
  };

  while (true) {
    const length = uleb();
    if (length === 0) break;
    const start = position;
    const end = start + length;
    need(length);
    const proto = { index: prototypes.length, flags: byte(), parameters: byte(), frameSize: byte(), upvalueCount: byte() };
    const gcCount = uleb();
    const numberCount = uleb();
    const instructionCount = uleb();
    let debugSize = 0;
    if (!(flags & 2)) {
      debugSize = uleb();
      if (debugSize) { proto.firstLine = uleb(); proto.lineCount = uleb(); }
    }

    proto.instructions = [];
    for (let i = 0; i < instructionCount; i++) {
      need(4);
      const instructionOffset = position;
      const raw = buffer.readUInt32LE(position);
      position += 4;
      proto.instructions.push({ pc: i, offset: instructionOffset, raw, name: names[raw & 255], a: (raw >>> 8) & 255, b: raw >>> 24, c: (raw >>> 16) & 255, d: raw >>> 16 });
    }

    const constantsStart = position;
    const attempts = [];
    for (let uv = 0; uv < 256 && constantsStart + uv * 2 <= end - debugSize; uv++) {
      position = constantsStart + uv * 2;
      const trialStack = [...stack];
      const constants = [];
      try {
        for (let i = 0; i < gcCount; i++) {
          const tag = uleb();
          if (tag >= 5) constants.push({ type: 'string', value: string(tag - 5) });
          else if (tag === 0) {
            const child = trialStack.pop();
            if (child === undefined) throw new Error('Missing child prototype');
            constants.push({ type: 'child', prototype: child });
          } else if (tag === 1) {
            const arrayCount = uleb();
            const hashCount = uleb();
            if (arrayCount + hashCount > 10000000) throw new Error('Constant table exceeds bound');
            const array = [];
            const hash = [];
            for (let n = 0; n < arrayCount; n++) array.push(tableScalar());
            for (let n = 0; n < hashCount; n++) hash.push([tableScalar(), tableScalar()]);
            constants.push({ type: 'table', array, hash });
          } else if (tag === 2 || tag === 3) {
            constants.push({ type: tag === 2 ? 'i64' : 'u64', low: uleb(), high: uleb() });
          } else if (tag === 4) {
            constants.push({ type: 'complex', real: double(uleb(), uleb()), imaginary: double(uleb(), uleb()) });
          } else {
            throw new Error('Unknown GC constant');
          }
        }
        const numbers = [];
        for (let i = 0; i < numberCount; i++) {
          const isNumber = (buffer[position] & 1) === 1;
          const low = uleb33();
          numbers.push(isNumber ? double(low, uleb()) : (low | 0));
        }
        if (position + debugSize === end) attempts.push({ uv, constants: constants.reverse(), numbers, trialStack, debugStart: position });
      } catch {}
    }

    const requiredUv = proto.instructions.reduce((max, instruction) => Math.max(max,
      instruction.name === 'UGET' ? instruction.d + 1 : /^USET[VNSP]$/.test(instruction.name) ? instruction.a + 1 : 0), 0);
    let supported = attempts.filter(attempt => attempt.uv >= requiredUv);
    // The LuaJIT header records the exact closure-upvalue count. Prefer it
    // when it yields a valid constant boundary: uncommon debug payloads can
    // otherwise create a second self-consistent boundary with fewer upvalues.
    const headerMatches = supported.filter(attempt => attempt.uv === proto.headerUpvalueCount);
    if (headerMatches.length === 1) supported = headerMatches;
    if (supported.length > 1) supported = supported.filter(attempt => attempt.uv === requiredUv);
    if (supported.length !== 1) throw new Error(`Constant boundary candidates: ${attempts.length}, supported: ${supported.length}, required UVs: ${requiredUv}`);
    const accepted = supported[0];
    proto.headerUpvalueCount = proto.upvalueCount;
    proto.upvalueCount = accepted.uv;
    proto.upvalues = [];
    for (let index = 0; index < accepted.uv; index++) {
      proto.upvalues.push(buffer.readUInt16LE(constantsStart + index * 2));
    }
    proto.constants = accepted.constants;
    proto.numbers = accepted.numbers;
    stack.splice(0, stack.length, ...accepted.trialStack);
    position = end;
    prototypes.push(proto);
    stack.push(proto.index);
  }

  if (position !== buffer.length) throw new Error('LuaJIT EOF mismatch');
  if (stack.length === 0 || (!allowMultipleRoots && stack.length !== 1)) {
    throw new Error(`LuaJIT root/EOF mismatch: roots=${stack.length}`);
  }
  return { flags, chunk, prototypes, rootPrototype: stack[0], rootPrototypes: [...stack] };
}

export function collectFiles(root) {
  const result = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (/^\d+-(FightTable|HeroTable|HeroMutantTable|TextTable)(?:\..+)?\.data\.lua\.bin$/.test(entry.name)
        || /^\d+-LocalizeTable\.lua\.bin$/.test(entry.name)) result.push(fullPath);
    }
  };
  walk(root);
  return result.sort();
}

export function getTableName(file) {
  return path.basename(file).replace(/^\d+-/, '').replace(/\.data\.lua\.bin$/, '').replace(/\.lua\.bin$/, '');
}

function tableValue(value) {
  if (value && value.type === 'table') return value.array;
  if (value && Object.hasOwn(value, 'value')) return value.value;
  return value;
}

export function extractGroups(result) {
  const groups = [];
  const rootConstants = result.prototypes[result.rootPrototype].constants;
  const rootNames = new Map();
  for (let i = 0; i + 1 < rootConstants.length; i++) {
    const name = rootConstants[i];
    const child = rootConstants[i + 1];
    if (name.type === 'string' && child.type === 'child') rootNames.set(child.prototype, name.value);
  }
  for (const proto of result.prototypes) {
    const schemas = proto.constants
      .filter(value => value.type === 'table' && value.hash.length > 0 && value.hash.some(([key]) => key === 'tid'))
      .map(value => ({
        columns: Object.fromEntries(value.hash.map(([key, index]) => [key, tableValue(index)])),
        maxIndex: Math.max(...value.hash.map(([, index]) => Number(tableValue(index))))
      }));
    if (schemas.length === 0) continue;

    const candidates = proto.constants
      .filter(value => value.type === 'table' && value.hash.length === 0 && value.array[0] == null && typeof value.array[1] === 'number')
      .filter(value => value.array.length >= 4);
    const byLength = new Map();
    for (const value of candidates) {
      if (!byLength.has(value.array.length)) byLength.set(value.array.length, []);
      byLength.get(value.array.length).push(value.array);
    }
    const dominant = [...byLength.entries()].sort((left, right) => right[1].length - left[1].length || right[0] - left[0])[0];
    if (!dominant) continue;
    const schema = schemas.find(value => value.maxIndex <= dominant[0] - 1) ?? schemas[0];
    const rows = dominant[1].map(array => Object.fromEntries(Object.entries(schema.columns).map(([key, index]) => [key, array[index] ?? null])));
    groups.push({
      prototype: proto.index,
      rootName: rootNames.get(proto.index) ?? null,
      firstLine: proto.firstLine ?? null,
      strings: [...new Set(proto.constants.filter(value => value.type === 'string').map(value => value.value))],
      columns: schema.columns,
      rows
    });
  }
  return groups;
}

export function extractBattleTables(sourceRoot, desiredPrefixes = [], options = {}) {
  const details = options.details === true;
  const includeRows = options.includeRows === true;
  const desiredTypes = new Set(options.types ?? []);
  const output = [];
  const groups = new Map();
  for (const file of collectFiles(sourceRoot)) {
    const name = getTableName(file);
    const family = name.replace(/\.\d+$/, '').split('.')[0];
    const fileBase = name.replace(/\.\d+$/, '');
    if (desiredPrefixes.length && !desiredPrefixes.some(prefix => family.startsWith(prefix.split('.')[0]))) continue;
    // Parameterized files can be rejected before parsing. The unparameterized
    // family file still needs parsing because it may contain several sub-tables.
    if (desiredTypes.size && fileBase !== family && ![...desiredTypes].some(type => fileBase === type || fileBase.startsWith(type + '.'))) continue;
    const extracted = extractGroups(parseLuaJit(fs.readFileSync(file)));
    for (const extractedGroup of extracted) {
      const type = extractedGroup.rootName
        ? (fileBase === family ? `${family}.${extractedGroup.rootName}` : fileBase)
        : fileBase;
      if (!groups.has(type)) groups.set(type, { files: new Set(), rows: 0, schemas: new Map(), fileRows: [] });
      const group = groups.get(type);
      group.files.add(name);
      const signature = JSON.stringify(extractedGroup.columns);
      if (!group.schemas.has(signature)) group.schemas.set(signature, { columns: extractedGroup.columns, rows: 0, sample: null, prototypes: [], data: includeRows ? [] : undefined });
      const schemaGroup = group.schemas.get(signature);
      schemaGroup.rows += extractedGroup.rows.length;
      if (includeRows) schemaGroup.data.push(...extractedGroup.rows);
      if (!schemaGroup.sample && extractedGroup.rows.length) schemaGroup.sample = extractedGroup.rows[0];
      schemaGroup.prototypes.push({ file: name, prototype: extractedGroup.prototype, firstLine: extractedGroup.firstLine, strings: extractedGroup.strings });
      group.rows += extractedGroup.rows.length;
      group.fileRows.push({
      name,
      prototype: extractedGroup.prototype,
      rootName: extractedGroup.rootName,
      firstLine: extractedGroup.firstLine,
      rows: extractedGroup.rows.length,
      schema: extractedGroup.columns,
      sample: extractedGroup.rows[0] ?? null
      });
    }
  }
  for (const [type, group] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (desiredTypes.size && !desiredTypes.has(type)) continue;
    output.push({ type, files: group.files.size, rows: group.rows, schemas: [...group.schemas.values()], ...(details ? { fileRows: group.fileRows } : {}) });
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const sourceRoot = path.resolve(process.argv[2] ?? 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded');
  const options = process.argv.slice(3);
  const details = options.includes('--details');
  const includeRows = options.includes('--rows');
  const typeOption = options.find(value => value.startsWith('--types='));
  const types = typeOption ? typeOption.slice('--types='.length).split(',').filter(Boolean) : [];
  const desiredPrefixes = options.filter(value => value !== '--details' && value !== '--rows' && value !== typeOption);
  for (const group of extractBattleTables(sourceRoot, desiredPrefixes, { details, includeRows, types })) {
    console.log(JSON.stringify(group));
  }
}
