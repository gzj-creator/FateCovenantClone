import { createDecipheriv, createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';

export function signQuickSdk(fields, key) {
  const input = [...fields].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, value]) => `${name}=${value}`).join('&');
  return createHash('md5').update(input + '&' + key, 'utf8').digest('hex').toUpperCase();
}

export function decodeQuickSdkCarrier(carrier, key) {
  if (typeof carrier !== 'string' || carrier.length > 22000 || Buffer.byteLength(key, 'utf8') !== 8) throw new Error('Invalid local SDK carrier');
  const bytes = Buffer.from(carrier, 'base64');
  if (!bytes.length || bytes.length % 8 || bytes.toString('base64') !== carrier) throw new Error('Invalid local SDK carrier');
  // Repeating the DES key three times gives the same ECB operation using Node's supported 3DES provider.
  const decipher = createDecipheriv('des-ede3', Buffer.concat([Buffer.from(key), Buffer.from(key), Buffer.from(key)]), null);
  const plain = Buffer.concat([decipher.update(bytes), decipher.final()]);
  const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid SDK login object');
  return value;
}
