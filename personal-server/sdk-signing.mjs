import { createHash, timingSafeEqual } from 'node:crypto';

function javaUtf8(text) {
  let valid = '';
  for (let index = 0; index < text.length; index++) {
    const unit = text.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        valid += text[index] + text[++index];
      } else valid += '?';
    } else valid += unit >= 0xdc00 && unit <= 0xdfff ? '?' : text[index];
  }
  return Buffer.from(valid, 'utf8');
}

export function md5Hex(text) {
  if (typeof text !== 'string') throw new TypeError('MD5 input must be a string');
  return createHash('md5').update(javaUtf8(text)).digest('hex');
}

function stringValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return String(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  throw new TypeError('Signature values must be strings, booleans, finite numbers, or null');
}

export function signSdkParameters(parameters, appKey) {
  if (typeof appKey !== 'string' || appKey.length === 0) throw new TypeError('appKey is required');
  if (!(parameters instanceof Map) && (parameters === null || typeof parameters !== 'object' || Array.isArray(parameters))) {
    throw new TypeError('Signature parameters must be a Map or object');
  }
  const entries = parameters instanceof Map ? [...parameters] : Object.entries(parameters);
  if (entries.length === 0) throw new TypeError('Signature parameters must not be empty');
  if (entries.some(([key]) => typeof key !== 'string' || key === 'sign')) {
    throw new TypeError('Signature keys must be strings and must exclude sign');
  }
  // Java compareTo and this comparator both order UTF-16 code units, not Unicode code points.
  entries.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  const canonical = entries.map(([key, value]) => `${key}=${stringValue(value)}`).join('&');
  return md5Hex(`${canonical}&key=${appKey}`.replaceAll(' ', ''));
}

export function equalMd5Hex(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string' || !/^[0-9a-f]{32}$/.test(expected) || !/^[0-9a-f]{32}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}
