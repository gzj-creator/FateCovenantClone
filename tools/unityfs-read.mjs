import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// Read-only UnityFS reader used to pull TextAssets (Lua bytecode, protobuf
// schemas, handshake manifests) out of the shipped bundles. Personal-server
// configuration tables are generated from the extracted bytecode; nothing here
// executes client Lua.
const MAGIC = Buffer.from('UnityFS\0');
const align16 = value => Math.ceil(value / 16) * 16;

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

export function parseBundle(bytes) {
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
  return { unityOffset, version, unity, revision, size, compressedInfoBytes, uncompressedInfoBytes, flags, headerEnd, blocks, nodes, data };
}

export function parseSerializedTextAssets(data) {
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

  {
    const end = data.indexOf(0, position);
    if (end < 0) throw new Error('Unterminated serialized string');
    position = end + 1;
  }
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

// Flatten every node of a bundle into `{ pathId, name, bytes }` TextAssets.
export function readTextAssets(buffer) {
  const parsed = parseBundle(buffer);
  const assets = [];
  for (const node of parsed.nodes) {
    const nodeData = parsed.data.subarray(node.offset, node.offset + node.size);
    let nodeAssets;
    try { nodeAssets = parseSerializedTextAssets(nodeData); } catch { continue; }
    for (const asset of nodeAssets) {
      assets.push({ pathId: asset.pathId, name: asset.name, bytes: nodeData.subarray(asset.scriptOffset, asset.scriptOffset + asset.scriptLength) });
    }
  }
  return assets;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [bundlePath, filter = ''] = process.argv.slice(2);
  if (!bundlePath) throw new Error('Usage: node unityfs-read.mjs <bundle> [name-filter]');
  const assets = readTextAssets(fs.readFileSync(bundlePath));
  console.log(JSON.stringify({ assets: assets.length, names: assets.filter(asset => asset.name.includes(filter)).map(asset => `${asset.pathId}-${asset.name}`) }, null, 1));
}
