import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAGIC = Buffer.from('UnityFS\0');
const align16 = value => Math.ceil(value / 16) * 16;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const md5 = bytes => crypto.createHash('md5').update(bytes).digest();

function lz4Decompress(input, expected) {
  if (expected > 268435456) throw new Error('LZ4 output exceeds analysis limit');
  const output = Buffer.alloc(expected);
  let source = 0;
  let destination = 0;
  const extended = start => {
    let length = start;
    if (start === 15) {
      let byte;
      do {
        if (source >= input.length) throw new Error('Truncated LZ4 length');
        byte = input[source++];
        length += byte;
      } while (byte === 255);
    }
    return length;
  };
  while (source < input.length) {
    const token = input[source++];
    const literalLength = extended(token >>> 4);
    if (source + literalLength > input.length || destination + literalLength > output.length) throw new Error('Invalid LZ4 literals');
    input.copy(output, destination, source, source + literalLength);
    source += literalLength;
    destination += literalLength;
    if (source === input.length) break;
    if (source + 2 > input.length) throw new Error('Truncated LZ4 match');
    const distance = input.readUInt16LE(source);
    source += 2;
    const matchLength = extended(token & 15) + 4;
    if (distance === 0 || distance > destination || destination + matchLength > output.length) throw new Error('Invalid LZ4 match');
    for (let index = 0; index < matchLength; index++) output[destination + index] = output[destination + index - distance];
    destination += matchLength;
  }
  if (destination !== expected) throw new Error(`LZ4 size mismatch ${destination} != ${expected}`);
  return output;
}

function decompress(input, expected, type) {
  if (type === 0) {
    if (input.length !== expected) throw new Error('Raw block size mismatch');
    return input;
  }
  if (type === 2 || type === 3) return lz4Decompress(input, expected);
  throw new Error(`Unsupported UnityFS compression type ${type}`);
}

function readCString(bytes, state) {
  const end = bytes.indexOf(0, state.position);
  if (end < 0) throw new Error('Missing UnityFS string terminator');
  const value = bytes.subarray(state.position, end).toString('utf8');
  state.position = end + 1;
  return value;
}

function parseBundle(bytes) {
  const unityOffset = bytes.indexOf(MAGIC);
  if (unityOffset < 0) throw new Error('UnityFS signature not found');
  const state = { position: unityOffset + MAGIC.length };
  const version = bytes.readUInt32BE(state.position);
  state.position += 4;
  const unity = readCString(bytes, state);
  const revision = readCString(bytes, state);
  const size = Number(bytes.readBigUInt64BE(state.position));
  state.position += 8;
  const compressedInfoBytes = bytes.readUInt32BE(state.position);
  const uncompressedInfoBytes = bytes.readUInt32BE(state.position + 4);
  const flags = bytes.readUInt32BE(state.position + 8);
  state.position += 12;
  const headerEnd = state.position;
  if (size !== bytes.length - unityOffset) throw new Error(`UnityFS size mismatch ${size} != ${bytes.length - unityOffset}`);

  let dataPosition = version >= 7 ? unityOffset + align16(headerEnd - unityOffset) : headerEnd;
  const infoOffset = flags & 0x80 ? unityOffset + size - compressedInfoBytes : dataPosition;
  const infoBytes = decompress(bytes.subarray(infoOffset, infoOffset + compressedInfoBytes), uncompressedInfoBytes, flags & 0x3f);
  if (!(flags & 0x80)) dataPosition += compressedInfoBytes;
  if (flags & 0x200) dataPosition = unityOffset + align16(dataPosition - unityOffset);

  let position = 16;
  const infoHash = infoBytes.subarray(0, 16);
  const blockCount = infoBytes.readUInt32BE(position);
  position += 4;
  if (blockCount > 100000) throw new Error('Unexpected UnityFS block count');
  const blocks = [];
  for (let index = 0; index < blockCount; index++) {
    blocks.push({ uncompressed: infoBytes.readUInt32BE(position), compressed: infoBytes.readUInt32BE(position + 4), flags: infoBytes.readUInt16BE(position + 8) });
    position += 10;
  }
  const nodeCount = infoBytes.readUInt32BE(position);
  position += 4;
  if (nodeCount > 100000) throw new Error('Unexpected UnityFS node count');
  const nodes = [];
  for (let index = 0; index < nodeCount; index++) {
    const offset = Number(infoBytes.readBigUInt64BE(position));
    const length = Number(infoBytes.readBigUInt64BE(position + 8));
    const nodeFlags = infoBytes.readUInt32BE(position + 16);
    position += 20;
    const end = infoBytes.indexOf(0, position);
    if (end < 0) throw new Error('Unterminated UnityFS node name');
    const name = infoBytes.subarray(position, end).toString('utf8');
    position = end + 1;
    nodes.push({ offset, size: length, flags: nodeFlags, name });
  }

  const chunks = [];
  for (const block of blocks) {
    if (dataPosition + block.compressed > bytes.length) throw new Error('UnityFS data block outside bundle');
    chunks.push(decompress(bytes.subarray(dataPosition, dataPosition + block.compressed), block.uncompressed, block.flags & 0x3f));
    dataPosition += block.compressed;
  }
  const data = Buffer.concat(chunks, blocks.reduce((sum, block) => sum + block.uncompressed, 0));
  for (const node of nodes) if (node.offset + node.size > data.length) throw new Error('UnityFS node outside uncompressed data');
  return { unityOffset, version, unity, revision, size, compressedInfoBytes, uncompressedInfoBytes, flags, headerEnd, infoHash, blocks, nodes, data };
}

function parseSerializedTextAssets(data) {
  if (data.length < 48) throw new Error('Serialized data is truncated');
  const version = data.readUInt32BE(8);
  const littleEndian = data[16] === 0;
  if (version < 22 || !littleEndian) throw new Error(`Unsupported serialized version/endian ${version}/${littleEndian}`);
  const metadataSize = data.readUInt32BE(20);
  const fileSize = Number(data.readBigUInt64BE(24));
  const dataOffset = Number(data.readBigUInt64BE(32));
  if (fileSize !== data.length || metadataSize > dataOffset) throw new Error('Serialized header size mismatch');

  let position = 48;
  const need = size => {
    if (!Number.isSafeInteger(size) || size < 0 || position + size > data.length) throw new Error('Truncated serialized metadata');
  };
  const byte = () => { need(1); return data[position++]; };
  const int16 = () => { need(2); const value = data.readInt16LE(position); position += 2; return value; };
  const int32 = () => { need(4); const value = data.readInt32LE(position); position += 4; return value; };
  const uint64 = () => { need(8); const value = Number(data.readBigUInt64LE(position)); position += 8; return value; };
  const cstring = () => {
    const end = data.indexOf(0, position);
    if (end < 0) throw new Error('Unterminated serialized string');
    const value = data.subarray(position, end).toString('utf8');
    position = end + 1;
    return value;
  };

  cstring();
  int32();
  const typeTreeEnabled = byte() !== 0;
  const typeCount = int32();
  if (typeCount < 0 || typeCount > 10000) throw new Error('Invalid serialized type count');
  const types = [];
  for (let index = 0; index < typeCount; index++) {
    const classId = int32();
    byte();
    int16();
    if (classId === 114) { need(16); position += 16; }
    need(16);
    position += 16;
    if (typeTreeEnabled) {
      const nodeCount = int32();
      const stringSize = int32();
      if (nodeCount < 0 || nodeCount > 100000 || stringSize < 0 || stringSize > 10000000) throw new Error('Invalid serialized type tree');
      need(nodeCount * 32 + stringSize);
      position += nodeCount * 32 + stringSize;
    }
    const dependencyCount = int32();
    if (dependencyCount < 0 || dependencyCount > 100000) throw new Error('Invalid serialized dependency count');
    need(dependencyCount * 4);
    position += dependencyCount * 4;
    types.push({ classId });
  }

  const objectCount = int32();
  if (objectCount < 0 || objectCount > 1000000) throw new Error('Invalid serialized object count');
  const textAssets = [];
  for (let index = 0; index < objectCount; index++) {
    position = Math.ceil(position / 4) * 4;
    const pathId = uint64();
    const start = dataOffset + uint64();
    const size = int32();
    const typeId = int32();
    if (!types[typeId] || start < dataOffset || size < 0 || start + size > data.length) throw new Error('Serialized object is outside the file');
    if (types[typeId].classId !== 49) continue;
    let at = start;
    const nameLength = data.readInt32LE(at);
    at += 4;
    if (nameLength < 0 || nameLength > size || at + nameLength > data.length) throw new Error('Invalid TextAsset name length');
    const name = data.subarray(at, at + nameLength).toString('utf8');
    at = Math.ceil((at + nameLength) / 4) * 4;
    if (at + 4 > data.length) throw new Error('Truncated TextAsset script length');
    const scriptLength = data.readInt32LE(at);
    at += 4;
    if (scriptLength < 0 || at + scriptLength > start + size) throw new Error('Invalid TextAsset script length');
    textAssets.push({ pathId, start, size, name, scriptLengthField: at - 4, scriptOffset: at, scriptLength });
  }
  return textAssets;
}

function encodeRawBlocks(parsed, data, prefix) {
  if (data.length !== parsed.data.length) throw new Error('Patch cannot change uncompressed bundle length');
  let blockOffset = 0;
  for (const block of parsed.blocks) {
    blockOffset += block.uncompressed;
  }
  if (blockOffset !== data.length) throw new Error('UnityFS block sizes do not cover member data');

  const infoLength = 16 + 4 + parsed.blocks.length * 10 + 4
    + parsed.nodes.reduce((sum, node) => sum + 20 + Buffer.byteLength(node.name) + 1, 0);
  const info = Buffer.alloc(infoLength);
  parsed.infoHash.copy(info, 0);
  let position = 16;
  info.writeUInt32BE(parsed.blocks.length, position);
  position += 4;
  for (const block of parsed.blocks) {
    info.writeUInt32BE(block.uncompressed, position);
    info.writeUInt32BE(block.uncompressed, position + 4);
    info.writeUInt16BE(block.flags & ~0x3f, position + 8);
    position += 10;
  }
  info.writeUInt32BE(parsed.nodes.length, position);
  position += 4;
  for (const node of parsed.nodes) {
    info.writeBigUInt64BE(BigInt(node.offset), position);
    info.writeBigUInt64BE(BigInt(node.size), position + 8);
    info.writeUInt32BE(node.flags, position + 16);
    position += 20;
    position += info.write(node.name, position, 'utf8');
    info[position++] = 0;
  }

  const header = Buffer.from(MAGIC);
  const version = Buffer.alloc(4); version.writeUInt32BE(parsed.version);
  const size = Buffer.alloc(8);
  const infoSizes = Buffer.alloc(8);
  infoSizes.writeUInt32BE(info.length, 0);
  infoSizes.writeUInt32BE(info.length, 4);
  const flags = Buffer.alloc(4);
  flags.writeUInt32BE(parsed.flags & ~0x3f);
  const headerPrefix = Buffer.concat([header, version, Buffer.from(parsed.unity + '\0'), Buffer.from(parsed.revision + '\0')]);
  const headerTail = Buffer.concat([infoSizes, flags]);
  const headerLength = headerPrefix.length + size.length + headerTail.length;
  const headerPadding = Buffer.alloc(parsed.version >= 7 ? align16(headerLength) - headerLength : 0);
  const infoAtEnd = (parsed.flags & 0x80) !== 0;
  const dataPositionWithoutInfo = headerLength + headerPadding.length;
  const dataPosition = infoAtEnd
    ? dataPositionWithoutInfo
    : (parsed.flags & 0x200
      ? align16(dataPositionWithoutInfo + info.length)
      : dataPositionWithoutInfo + info.length);
  const infoDataPadding = Buffer.alloc(infoAtEnd ? 0 : dataPosition - dataPositionWithoutInfo - info.length);
  const totalSize = headerLength + headerPadding.length + (infoAtEnd
    ? data.length + info.length
    : info.length + infoDataPadding.length + data.length);
  size.writeBigUInt64BE(BigInt(totalSize));
  const headerWithoutEnd = Buffer.concat([headerPrefix, size, headerTail]);
  const body = infoAtEnd
    ? Buffer.concat([prefix, headerWithoutEnd, headerPadding, data, info])
    : Buffer.concat([prefix, headerWithoutEnd, headerPadding, info, infoDataPadding, data]);
  return body;
}

function inspect(bundlePath) {
  const bytes = fs.readFileSync(bundlePath);
  const parsed = parseBundle(bytes);
  const nodeSlices = parsed.nodes.map(node => ({ ...node, sha256: sha256(parsed.data.subarray(node.offset, node.offset + node.size)) }));
  return {
    path: path.resolve(bundlePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    prefixBytes: parsed.unityOffset,
    unity: parsed.unity,
    revision: parsed.revision,
    version: parsed.version,
    headerFlags: `0x${parsed.flags.toString(16)}`,
    blockCount: parsed.blocks.length,
    blockFlags: [...new Set(parsed.blocks.map(block => `0x${block.flags.toString(16)}`))],
    infoHash: parsed.infoHash.toString('hex'),
    dataMd5: md5(parsed.data).toString('hex'),
    dataSha256: sha256(parsed.data),
    dataBytes: parsed.data.length,
    nodes: nodeSlices,
  };
}

function patch(bundlePath, outputPath, offsetText, oldHex, newHex) {
  const input = fs.readFileSync(bundlePath);
  const parsed = parseBundle(input);
  const offset = Number(offsetText);
  const oldBytes = Buffer.from(oldHex, 'hex');
  const newBytes = Buffer.from(newHex, 'hex');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset + oldBytes.length > parsed.data.length) throw new Error('Patch offset outside uncompressed data');
  if (oldBytes.length !== newBytes.length || oldBytes.length === 0) throw new Error('Patch must replace bytes with a non-empty equal-length value');
  if (!parsed.data.subarray(offset, offset + oldBytes.length).equals(oldBytes)) throw new Error('Patch source bytes do not match');
  const data = Buffer.from(parsed.data);
  newBytes.copy(data, offset);
  const prefix = input.subarray(0, parsed.unityOffset);
  const output = encodeRawBlocks(parsed, data, prefix);
  const outputDirectory = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(outputDirectory, { recursive: true });
  if (fs.existsSync(outputPath)) throw new Error('Output already exists; refusing to overwrite');
  fs.writeFileSync(outputPath, output);

  const verified = parseBundle(output);
  if (!verified.data.subarray(offset, offset + oldBytes.length).equals(newBytes)) throw new Error('Patched bytes did not survive bundle rebuild');
  if (!verified.data.subarray(0, offset).equals(parsed.data.subarray(0, offset))) throw new Error('Bytes before patch changed');
  if (!verified.data.subarray(offset + newBytes.length).equals(parsed.data.subarray(offset + newBytes.length))) throw new Error('Bytes after patch changed');
  return {
    input: path.resolve(bundlePath),
    inputSha256: sha256(input),
    output: path.resolve(outputPath),
    outputBytes: output.length,
    outputSha256: sha256(output),
    prefixBytes: parsed.unityOffset,
    prefixPreserved: output.subarray(0, parsed.unityOffset).equals(input.subarray(0, parsed.unityOffset)),
    offset,
    oldHex,
    newHex,
    infoHashMode: 'preserved-input-hash',
    blockCompressionMode: 'raw',
    dataSha256: sha256(verified.data),
  };
}

function replace(bundlePath, outputPath, offsetText, replacementPath) {
  const input = fs.readFileSync(bundlePath);
  const parsed = parseBundle(input);
  const offset = Number(offsetText);
  const replacement = fs.readFileSync(replacementPath);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset + replacement.length > parsed.data.length) throw new Error('Replacement range outside uncompressed data');
  if (replacement.length === 0) throw new Error('Replacement must not be empty');
  const data = Buffer.from(parsed.data);
  replacement.copy(data, offset);
  const prefix = input.subarray(0, parsed.unityOffset);
  const output = encodeRawBlocks(parsed, data, prefix);
  const outputDirectory = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(outputDirectory, { recursive: true });
  if (fs.existsSync(outputPath)) throw new Error('Output already exists; refusing to overwrite.');
  fs.writeFileSync(outputPath, output);

  const verified = parseBundle(output);
  if (!verified.data.subarray(offset, offset + replacement.length).equals(replacement)) throw new Error('Replacement did not survive bundle rebuild');
  if (!verified.data.subarray(0, offset).equals(parsed.data.subarray(0, offset))) throw new Error('Bytes before replacement changed');
  if (!verified.data.subarray(offset + replacement.length).equals(parsed.data.subarray(offset + replacement.length))) throw new Error('Bytes after replacement changed');
  return {
    input: path.resolve(bundlePath),
    inputSha256: sha256(input),
    output: path.resolve(outputPath),
    outputBytes: output.length,
    outputSha256: sha256(output),
    prefixBytes: parsed.unityOffset,
    prefixPreserved: output.subarray(0, parsed.unityOffset).equals(input.subarray(0, parsed.unityOffset)),
    offset,
    replacement: path.resolve(replacementPath),
    replacementBytes: replacement.length,
    replacementSha256: sha256(replacement),
    infoHashMode: 'preserved-input-hash',
    blockCompressionMode: 'raw',
    dataSha256: sha256(verified.data)
  };
}

function replaceTextAsset(bundlePath, outputPath, targetName, replacementPath) {
  const input = fs.readFileSync(bundlePath);
  const parsed = parseBundle(input);
  const matches = [];
  for (const node of parsed.nodes) {
    const nodeData = parsed.data.subarray(node.offset, node.offset + node.size);
    for (const asset of parseSerializedTextAssets(nodeData)) {
      if (asset.name === targetName) matches.push({ ...asset, start: node.offset + asset.start, scriptLengthField: node.offset + asset.scriptLengthField, scriptOffset: node.offset + asset.scriptOffset });
    }
  }
  if (matches.length !== 1) throw new Error(`Expected one TextAsset named ${targetName}, found ${matches.length}`);
  const target = matches[0];
  const replacement = fs.readFileSync(replacementPath);
  if (replacement.length === 0) throw new Error('TextAsset replacement must not be empty');
  if (replacement.length > target.scriptLength) throw new Error(`TextAsset replacement is larger than its original slot (${replacement.length} > ${target.scriptLength})`);

  const data = Buffer.from(parsed.data);
  replacement.copy(data, target.scriptOffset);
  data.fill(0, target.scriptOffset + replacement.length, target.scriptOffset + target.scriptLength);
  data.writeInt32LE(replacement.length, target.scriptLengthField);
  const prefix = input.subarray(0, parsed.unityOffset);
  const output = encodeRawBlocks(parsed, data, prefix);
  const outputDirectory = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(outputDirectory, { recursive: true });
  if (fs.existsSync(outputPath)) throw new Error('Output already exists; refusing to overwrite.');
  fs.writeFileSync(outputPath, output);

  const verifiedBundle = parseBundle(output);
  const verifiedMatches = [];
  for (const node of verifiedBundle.nodes) {
    const nodeData = verifiedBundle.data.subarray(node.offset, node.offset + node.size);
    for (const asset of parseSerializedTextAssets(nodeData)) {
      if (asset.name === targetName) verifiedMatches.push({ ...asset, start: node.offset + asset.start, scriptLengthField: node.offset + asset.scriptLengthField, scriptOffset: node.offset + asset.scriptOffset });
    }
  }
  if (verifiedMatches.length !== 1) throw new Error('Patched TextAsset could not be found during verification');
  const verified = verifiedMatches[0];
  if (verified.scriptLength !== replacement.length || !verifiedBundle.data.subarray(verified.scriptOffset, verified.scriptOffset + replacement.length).equals(replacement)) {
    throw new Error('TextAsset replacement did not survive bundle rebuild');
  }
  for (let index = 0; index < data.length; index++) {
    const insideScriptSlot = index >= target.scriptOffset && index < target.scriptOffset + target.scriptLength;
    const insideLengthField = index >= target.scriptLengthField && index < target.scriptLengthField + 4;
    if (!insideScriptSlot && !insideLengthField && data[index] !== parsed.data[index]) throw new Error(`Unexpected bundle byte changed at ${index}`);
  }
  return {
    input: path.resolve(bundlePath),
    inputSha256: sha256(input),
    output: path.resolve(outputPath),
    outputBytes: output.length,
    outputSha256: sha256(output),
    targetName,
    targetOffset: target.scriptOffset,
    originalBytes: target.scriptLength,
    replacement: path.resolve(replacementPath),
    replacementBytes: replacement.length,
    replacementSha256: sha256(replacement),
    lengthFieldOffset: target.scriptLengthField,
    trailingOldScriptBytesZeroed: target.scriptLength - replacement.length,
    blockCompressionMode: 'raw'
  };
}

function extract(bundlePath, outputPath, offsetText, lengthText) {
  const parsed = parseBundle(fs.readFileSync(bundlePath));
  const offset = offsetText == null ? 0 : Number(offsetText);
  const length = lengthText == null ? parsed.data.length - offset : Number(lengthText);
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > parsed.data.length) {
    throw new Error('Extraction range outside uncompressed data');
  }
  const directory = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(directory, { recursive: true });
  if (fs.existsSync(outputPath)) throw new Error('Output already exists; refusing to overwrite');
  const bytes = parsed.data.subarray(offset, offset + length);
  fs.writeFileSync(outputPath, bytes);
  console.log(JSON.stringify({ bundle: path.resolve(bundlePath), output: path.resolve(outputPath), offset, bytes: bytes.length, sha256: sha256(bytes) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, input, ...rest] = process.argv.slice(2);
  if (command === 'inspect' && input) {
    console.log(JSON.stringify(inspect(input), null, 2));
  } else if (command === 'patch' && rest.length === 4) {
    console.log(JSON.stringify(patch(input, ...rest), null, 2));
  } else if (command === 'replace' && rest.length === 3) {
    console.log(JSON.stringify(replace(input, ...rest), null, 2));
  } else if (command === 'replace-textasset' && rest.length === 3) {
    console.log(JSON.stringify(replaceTextAsset(input, ...rest), null, 2));
  } else if (command === 'extract' && input && rest.length >= 1) {
    extract(input, ...rest);
  } else {
    throw new Error('Usage: unityfs-byte-patch.mjs inspect <bundle> | patch <bundle> <output> <data-offset> <old-hex> <new-hex> | replace <bundle> <output> <data-offset> <replacement-file> | replace-textasset <bundle> <output> <asset-name> <replacement-file> | extract <bundle> <output> [offset] [length]');
  }
}
