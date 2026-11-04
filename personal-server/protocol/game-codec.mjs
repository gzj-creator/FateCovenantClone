import fs from 'node:fs';
import protobuf from 'protobufjs';
import erlang from '../vendor/erlang_js/Erlang.js';
import { protobufAssetDirectory } from '../assets.mjs';

export const E = erlang.Erlang;
function prepareEtf(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) throw new RangeError('ETF number must be finite and exactly representable');
    if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
      // The bundled library truncates big integers and writes floats in host byte order.
      // NEW_FLOAT_EXT uses network byte order and is supported by the client codec.
      const bytes = Buffer.alloc(8); bytes.writeDoubleBE(value);
      return new E.OtpErlangFunction(70, bytes);
    }
  }
  if (Array.isArray(value)) return value.map(prepareEtf);
  if (value instanceof E.OtpErlangList) return new E.OtpErlangList(value.value.map(prepareEtf), value.improper);
  return value;
}
export const encodeEtf = value => new Promise((resolve, reject) => E.term_to_binary(prepareEtf(value), (error, result) => error ? reject(error) : resolve(Buffer.from(result))));
export const decodeEtf = bytes => new Promise((resolve, reject) => E.binary_to_term(bytes, (error, result) => error ? reject(error) : resolve(result)));
export function encodeEtfInteger(value) {
  if (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647) throw new RangeError('ETF integer must be an exact signed 32-bit value');
  if (value >= 0 && value <= 255) return Buffer.from([131, 97, value]);
  const bytes = Buffer.alloc(6);
  bytes[0] = 131; bytes[1] = 98; bytes.writeInt32BE(value, 2);
  return bytes;
}
export function encodeEtfIntegerTuple(values) {
  if (!Array.isArray(values) || values.length > 255) throw new RangeError('ETF integer tuple must contain at most 255 values');
  const header = Buffer.alloc(3);
  header[0] = 131; header[1] = 104; header[2] = values.length;
  return Buffer.concat([header, ...values.map(value => encodeEtfInteger(value).subarray(1))]);
}
export function encodeEtfBinaryList(values) {
  if (!Array.isArray(values) || values.length > 0xffffffff) throw new RangeError('ETF binary list must be an array');
  const items = values.map(value => {
    const bytes = Buffer.from(value);
    if (bytes.length > 0xffffffff) throw new RangeError('ETF binary item is too large');
    const header = Buffer.alloc(5);
    header[0] = 109; header.writeUInt32BE(bytes.length, 1);
    return Buffer.concat([header, bytes]);
  });
  const listHeader = Buffer.alloc(6);
  listHeader[0] = 131; listHeader[1] = 108; listHeader.writeUInt32BE(items.length, 2);
  return Buffer.concat([listHeader, ...items, Buffer.from([106])]);
}
export const binary = value => new E.OtpErlangBinary(Buffer.from(value));
export const rawBinary = object => Buffer.from(object.value.data);
export const serializedBinary = value => ({ value: Buffer.from(value).toJSON(), bits: 8 });
export function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    if (value.bits === 8 && value.value?.type === 'Buffer') return binary(value.value.data);
    if (Array.isArray(value.value) && typeof value.improper === 'boolean') return new E.OtpErlangList(value.value.map(revive), value.improper);
    throw new Error('Unsupported serialized ETF value');
  }
  return value;
}
export function loadGameSchemas() {
  const root = new protobuf.Root();
  const directory = protobufAssetDirectory;
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.proto.bin'))) protobuf.parse(fs.readFileSync(new URL(name, directory), 'utf8'), root, { keepCase: true });
  return root.resolveAll();
}
export function createGameCodec(root = loadGameSchemas()) {
  return { root,
    pack(name, object) { const type = root.lookupType(name); return Buffer.from(type.encode(type.fromObject(object)).finish()); },
    unpack(name, bytes) { const type = root.lookupType(name); return type.toObject(type.decode(bytes), { longs: String, bytes: String, arrays: true }); }
  };
}
