import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packagedAssetRoot = new URL('./assets/', import.meta.url);
const serverRoot = fileURLToPath(new URL('./', import.meta.url));

function assetRoot() {
  const override = process.env.FC_ASSET_ROOT;
  if (!override) return packagedAssetRoot;
  return pathToFileURL(path.resolve(override) + path.sep);
}

export const serverRootPath = serverRoot;
export const defaultDataDirectory = path.join(serverRoot, 'runtime.local-only.data');
export const loginSeedPath = new URL('./fixtures/login-modules.seed.json', import.meta.url);
export const serverListSigningKeyPath = new URL('./config/server-list-signing-key.json', import.meta.url);

export function assetUrl(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) throw new TypeError('Asset path is required');
  return new URL(relativePath, assetRoot());
}

export function tableAsset(name) {
  return assetUrl(`tables/${name}`);
}

export function protocolAsset(name) {
  return assetUrl(`protocol/${name}`);
}

export const protobufAssetDirectory = Object.freeze(assetUrl('protobuf/'));

export function readAssetBytes(file) {
  const requested = file instanceof URL ? fileURLToPath(file) : path.resolve(String(file));
  const compressed = requested.endsWith('.gz');
  try {
    const bytes = fs.readFileSync(requested);
    return compressed ? zlib.gunzipSync(bytes) : bytes;
  } catch (error) {
    if (compressed || error?.code !== 'ENOENT') throw error;
    const compressedPath = requested + '.gz';
    return zlib.gunzipSync(fs.readFileSync(compressedPath));
  }
}

export function readJsonAsset(file) {
  return JSON.parse(readAssetBytes(file).toString('utf8'));
}
