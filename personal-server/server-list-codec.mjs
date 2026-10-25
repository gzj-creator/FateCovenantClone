import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const SERVER_SCHEMA_SHA256 = '1f1a744f71e9dd5216b7ecc061383ef5ded3b2fe9072aa8e8785659e6f8df4d3';
const schemaPath = fileURLToPath(new URL('../analysis/reports/private-client-16448/lua-bundles/login-protos/server.net.proto', import.meta.url));

export function createProtobufJsCodec(packageJsonPath = fileURLToPath(new URL('./node_modules/protobufjs/package.json', import.meta.url))) {
  if (typeof packageJsonPath !== 'string' || !path.isAbsolute(packageJsonPath)) throw new TypeError('An explicit absolute protobufjs package.json path is required');
  const metadata = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (metadata.name !== 'protobufjs' || typeof metadata.version !== 'string') throw new TypeError('Expected an existing protobufjs package');
  const bytes = fs.readFileSync(schemaPath);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== SERVER_SCHEMA_SHA256) throw new Error('Exported server schema SHA-256 mismatch');
  const require = createRequire(packageJsonPath);
  const protobuf = require(path.dirname(packageJsonPath));
  if (typeof protobuf.parse !== 'function') throw new Error('The full protobufjs runtime with .proto parsing is required');
  const root = protobuf.parse(bytes.toString('utf8'), { keepCase: true }).root;
  const allowed = new Set(['pb_login_servers', 'pb_login_server']);
  function typeFor(name) {
    if (!allowed.has(name)) throw new TypeError('Unsupported response message type');
    return root.lookupType(name);
  }
  return Object.freeze({
    metadata: Object.freeze({ name: metadata.name, version: metadata.version, packageJsonPath, schemaPath, schemaSha256: hash }),
    encode(name, object) {
      const type = typeFor(name);
      const error = type.verify(object);
      if (error) throw new TypeError('Invalid protobuf message: ' + error);
      return Buffer.from(type.encode(type.create(object)).finish());
    },
    decode(name, bytes) {
      const type = typeFor(name);
      return type.toObject(type.decode(bytes), { longs: String, bytes: Buffer, defaults: true, arrays: true });
    }
  });
}
