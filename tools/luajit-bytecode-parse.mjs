const names = ('ISLT ISGE ISLE ISGT ISEQV ISNEV ISEQS ISNES ISEQN ISNEN ISEQP ISNEP ISTC ISFC IST ISF ISTYPE ISNUM MOV NOT UNM LEN ADDVN SUBVN MULVN DIVVN MODVN ADDNV SUBNV MULNV DIVNV MODNV ADDVV SUBVV MULVV DIVVV MODVV POW CAT KSTR KCDATA KSHORT KNUM KPRI KNIL UGET USETV USETS USETN USETP UCLO FNEW TNEW TDUP GGET GSET TGETV TGETS TGETB TGETR TSETV TSETS TSETB TSETM TSETR CALLM CALL CALLMT CALLT ITERC ITERN VARG ISNEXT RETM RET RET0 RET1 FORI JFORI FORL IFORL JFORL ITERL IITERL JITERL LOOP ILOOP JLOOP JMP FUNCF IFUNCF JFUNCF FUNCV IFUNCV JFUNCV FUNCC FUNCCW').split(' ');
export function parseLuaJit(buffer) {
  let position = 0;
  const need = size => { if (position + size > buffer.length || size < 0) throw new Error('Truncated LuaJIT dump'); };
  const byte = () => { need(1); return buffer[position++]; };
  const uleb = () => { let value = 0, factor = 1; for (let i = 0; i < 5; i++) { const b = byte(); value += (b & 127) * factor; if (!(b & 128)) return value; factor *= 128; } throw new Error('Invalid ULEB128'); };
  const uleb33 = () => {
    let value = byte() >> 1;
    if (value >= 0x40) {
      value &= 0x3f;
      let shift = -1;
      let current;
      let bytes = 1;
      do {
        if (++bytes > 5) throw new Error('Invalid 33-bit field');
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
    const blockLengthOffset = position;
    const length = uleb();
    if (length === 0) break;
    const start = position;
    const end = start + length;
    need(length);
    const proto = { index: prototypes.length, blockLengthOffset, start, end, flags: byte(), parameters: byte(), frameSize: byte(), upvalueCount: byte() };
    proto.headerUpvalueCount = proto.upvalueCount;
    const gcCount = uleb();
    const numberCount = uleb();
    const instructionCount = uleb();
    let debugSize = 0;
    const debugSizeOffset = position;
    if (!(flags & 2)) {
      debugSize = uleb();
      if (debugSize) { proto.firstLine = uleb(); proto.lineCount = uleb(); }
    }

    proto.instructionStart = position;
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
    const attemptErrors = [];
    const attemptEnds = [];
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
        attemptEnds.push(`${uv}:${position}+${debugSize}-${end}`);
        if (position + debugSize === end) attempts.push({ uv, constants: constants.reverse(), numbers, trialStack, debugStart: position });
      } catch (error) { attemptErrors.push(`${uv}:${error.message}`); }
    }

    const requiredUv = proto.instructions.reduce((max, instruction) => Math.max(max,
      instruction.name === 'UGET' ? instruction.d + 1 : /^USET[VNSP]$/.test(instruction.name) ? instruction.a + 1 : 0), 0);
    let supported = attempts.filter(attempt => attempt.uv >= requiredUv);
    const headerMatches = supported.filter(attempt => attempt.uv === proto.headerUpvalueCount);
    if (headerMatches.length === 1) supported = headerMatches;
    if (supported.length > 1) supported = supported.filter(attempt => attempt.uv === requiredUv);
    if (supported.length > 1) supported = supported.filter(attempt => attempt.uv === proto.upvalueCount);
    if (supported.length > 1) supported = [supported.reduce((min, attempt) => attempt.uv < min.uv ? attempt : min)];
    if (supported.length !== 1) throw new Error(`Constant boundary candidates: ${attempts.length}, supported: ${supported.length}, required UVs: ${requiredUv}, prototype: ${prototypes.length}, start: ${start}, end: ${end}, constantsStart: ${constantsStart}, gc: ${gcCount}, numbers: ${numberCount}, instructions: ${instructionCount}, debug: ${debugSize}, flags: ${proto.flags}; ends: ${attemptEnds.slice(0,8).join(',')}; errors: ${attemptErrors.slice(-8).join(',')}`);
    const accepted = supported[0];
    proto.debugSizeOffset = debugSizeOffset;
    proto.debugSize = debugSize;
    proto.debugStart = accepted.debugStart;
    proto.constantsStart = constantsStart;
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

  if (position !== buffer.length || stack.length !== 1) throw new Error('LuaJIT root/EOF mismatch');
  return { flags, chunk, prototypes, rootPrototype: stack[0] };
}
