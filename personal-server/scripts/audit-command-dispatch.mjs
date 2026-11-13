import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalGame } from '../local-game.mjs';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
const gatewayPath = path.join(serverRoot, 'game', 'gateway.mjs');
const catalogPath = path.join(serverRoot, 'config', 'command-catalog.json');
const interfacesPath = path.join(projectRoot, 'agent', 'workflow', 'interface-catalog', 'static-interfaces.json');
const outputPath = path.join(serverRoot, 'config', 'command-dispatch-audit.json');
const checkOnly = process.argv.includes('--check');

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function numericLiterals(text) {
  return [...text.matchAll(/(\d{1,7})/g)].map(match => Number(match[1]));
}

function conditionText(lines, start) {
  let text = lines[start].trim();
  for (let index = start; index < Math.min(lines.length, start + 8); index++) {
    if (index > start) text += ' ' + lines[index].trim();
    if (/\)\s*\{\s*$/.test(lines[index])) break;
  }
  return text;
}

function sourceEncodingHint(lines, lineNumber) {
  const snippet = lines.slice(Math.max(0, lineNumber - 1), lineNumber + 48).join('\n');
  const etf = /\b(?:decodeEtf|etfArgument|etfInput)\s*\(/.test(snippet);
  const protobuf = /\b(?:unpack|unpackRequest)\s*\(/.test(snippet) || /\bexecuteBinary\s*\(/.test(snippet);
  if (etf && protobuf) return 'conditional';
  if (protobuf) return 'protobuf';
  if (etf) return 'etf';
  return 'unverified';
}

function explicitEncoding(service, type) {
  if (!service || typeof service !== 'object') return 'unverified';
  try {
    if (typeof service.isProtobufRequest === 'function' && service.isProtobufRequest(type)) return 'protobuf';
    if (typeof service.isEtfRequest === 'function' && service.isEtfRequest(type)) return 'etf';
    if (typeof service.requestSchema === 'function' && service.requestSchema(type)) return 'protobuf';
  } catch {}
  return 'unverified';
}

function normalizeEncoding(value) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('protobuf')) return 'protobuf';
  if (text.includes('etf')) return 'etf';
  return 'unverified';
}

async function buildAudit() {
  const gatewayBytes = fs.readFileSync(gatewayPath);
  const catalogBytes = fs.readFileSync(catalogPath);
  const interfacesBytes = fs.readFileSync(interfacesPath);
  const source = gatewayBytes.toString('utf8');
  const lines = source.split(/\r?\n/);
  const catalog = JSON.parse(catalogBytes.toString('utf8'));
  const interfaces = JSON.parse(interfacesBytes.toString('utf8')).interfaces
    .filter(row => row.direction === 'c2s' && Number.isSafeInteger(Number(row.type)));
  const staticByType = new Map(interfaces.map(row => [Number(row.type), row]));
  const catalogTypes = new Set(catalog.commands.map(row => Number(row.type)));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-command-dispatch-audit-'));
  const ownerEntries = [];
  let game;
  try {
    game = createLocalGame({
      databasePath: path.join(directory, 'game.sqlite'),
      statePath: path.join(directory, 'absent.json'),
      capturePath: path.join(serverRoot, 'fixtures', 'login-modules.seed.json'),
      localWallet: true,
      serverOpenedAt: 1792789200,
      now: () => 1792792800000
    });
    const ownerGroups = game.commandSupportOwners();
    for (const [name, value] of Object.entries(ownerGroups)) {
      const services = Array.isArray(value) ? value : [value];
      for (let index = 0; index < services.length; index++) {
        const owner = services.length === 1 ? name : `${name}[${index}]`;
        const service = services[index];
        if (!service || typeof service.supports !== 'function') {
          ownerEntries.push({ owner, service: null, supported: new Set(), sourceLine: null, reason: 'supports_missing' });
          continue;
        }
        const baseName = name;
        const serviceCall = new RegExp(`\\b${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.supports\\(type\\)`);
        const callOffset = source.search(serviceCall);
        const callLine = callOffset < 0 ? null : source.slice(0, callOffset).split(/\r?\n/).length;
        const supported = new Set();
        for (const command of catalog.commands) {
          const commandType = Number(command.type);
          try { if (service.supports(commandType)) supported.add(commandType); } catch {}
        }
        ownerEntries.push({ owner, service, supported, sourceLine: callLine, reason: null });
      }
    }
    await game.close();
    game = null;
  } finally {
    if (game) await game.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }

  const directClaims = new Map();
  const handleStart = lines.findIndex(line => /async function handle\(payload\)/.test(line));
  const handleEnd = lines.findIndex((line, index) => index > handleStart && /const handleInRole/.test(line));
  if (handleStart < 0 || handleEnd < 0) throw new Error('Gateway command handler boundaries are missing');
  for (let index = handleStart; index < handleEnd; index++) {
    if (!/^ {6}if\s*\(/.test(lines[index])) continue;
    const condition = conditionText(lines, index);
    if (/phase\s*!==\s*['"]ready/.test(condition)) continue;
    const types = new Set([
      ...[...condition.matchAll(/\btype\s*===\s*(\d{1,7})/g)].map(match => Number(match[1])),
      ...[...condition.matchAll(/\[([\d,\s]+)\]\.includes\(type\)/g)].flatMap(match => numericLiterals(match[1]))
    ]);
    for (const type of types) {
      if (!catalogTypes.has(type)) continue;
      if (!directClaims.has(type)) directClaims.set(type, []);
      directClaims.get(type).push({ owner: 'gateway', sourceLine: index + 1 });
    }
  }
  const readsLine = lines.findIndex(line => /const reads = new Map\(\[\[/.test(line));
  if (readsLine >= 0) {
    for (const type of numericLiterals(lines[readsLine].match(/new Map\(\[(.*)\]\)/)?.[1] ?? '')) {
      if (!catalogTypes.has(type)) continue;
      if (!directClaims.has(type)) directClaims.set(type, []);
      directClaims.get(type).push({ owner: 'gateway-map', sourceLine: readsLine + 1 });
    }
  }
  const fantasyDrawGuard = /fantasyDraw\.supports\(type\)\s*&&\s*type\s*!==\s*(\d{1,7})/.exec(source);
  const fantasyDrawExcluded = fantasyDrawGuard ? Number(fantasyDrawGuard[1]) : null;

  const rows = [];
  for (const command of catalog.commands) {
    const type = Number(command.type);
    const staticRow = staticByType.get(type);
    const claims = [];
    for (const entry of ownerEntries) {
      if (!entry.supported.has(type)) continue;
      if (entry.owner === 'fantasyDraw' && type === fantasyDrawExcluded) continue;
      claims.push({
        owner: entry.owner,
        kind: 'service',
        sourceLine: entry.sourceLine,
        requestEncoding: explicitEncoding(entry.service, type),
        service: entry.service
      });
    }
    for (const claim of directClaims.get(type) ?? []) claims.push({ ...claim, kind: 'gateway', requestEncoding: 'unverified' });
    claims.sort((left, right) => (left.sourceLine ?? Number.MAX_SAFE_INTEGER) - (right.sourceLine ?? Number.MAX_SAFE_INTEGER));
    const reachable = claims[0] ?? null;
    const shadowed = claims.slice(1).map(claim => claim.owner);
    const staticRequest = normalizeEncoding(staticRow?.request?.encoding);
    const sourceHint = reachable?.kind === 'gateway'
      ? sourceEncodingHint(lines, reachable.sourceLine)
      : sourceEncodingHint(lines, reachable?.sourceLine ?? 1);
    const runtimeRequest = reachable && reachable.requestEncoding !== 'unverified' ? reachable.requestEncoding : sourceHint;
    const requestMismatch = runtimeRequest !== 'unverified' && runtimeRequest !== 'conditional'
      && staticRequest !== 'unverified' && runtimeRequest !== staticRequest;
    const status = !reachable ? 'unrouted'
      : claims.length > 1 ? 'multi_owner'
        : reachable.kind === 'gateway' ? 'gateway_route' : 'service_route';
    const evidenceGaps = [];
    if (!staticRow) evidenceGaps.push('static_interface_missing');
    if (staticRow && !staticRow.response?.schema?.present) evidenceGaps.push('response_schema_missing');
    if (runtimeRequest === 'unverified' || runtimeRequest === 'conditional') evidenceGaps.push('request_encoding_unverified');
    if (requestMismatch) evidenceGaps.push('request_encoding_mismatch');
    if (shadowed.length) evidenceGaps.push('shadowed_owner');
    rows.push({
      type,
      name: command.name,
      module: command.module,
      task: command.task,
      access: command.access,
      status,
      reachableOwner: reachable?.owner ?? null,
      owners: claims.map(claim => claim.owner),
      shadowedOwners: shadowed,
      requestEncoding: staticRequest,
      requestSchema: staticRow?.request?.schema?.name ?? null,
      runtimeRequestEncoding: runtimeRequest,
      requestEncodingDifference: requestMismatch,
      responseEncoding: normalizeEncoding(staticRow?.response?.encoding),
      responseSchema: staticRow?.response?.schema?.name ?? null,
      responseDefinitionPresent: staticRow?.response?.schema?.present ?? null,
      responseRuntimeVerification: 'unverified',
      evidenceGaps: [...new Set(evidenceGaps)]
    });
  }

  const supportedOutsideCatalog = [];
  for (const entry of ownerEntries) {
    for (const type of entry.supported) if (!catalogTypes.has(type)) supportedOutsideCatalog.push({ owner: entry.owner, type });
  }
  const count = status => rows.filter(row => row.status === status).length;
  const summary = {
    total: rows.length,
    serviceRoute: count('service_route'),
    gatewayRoute: count('gateway_route'),
    multiOwner: count('multi_owner'),
    unrouted: count('unrouted'),
    requestEncodingMismatch: rows.filter(row => row.requestEncodingDifference).length,
    requestEncodingUnverified: rows.filter(row => row.evidenceGaps.includes('request_encoding_unverified')).length,
    responseRuntimeUnverified: rows.length,
    responseSchemaMissing: rows.filter(row => row.evidenceGaps.includes('response_schema_missing')).length
  };
  const ownersWithoutSupports = ownerEntries.filter(entry => entry.reason).map(entry => entry.owner);
  const ownersWithoutCatalogTypes = ownerEntries.filter(entry => !entry.reason && entry.supported.size === 0).map(entry => entry.owner);
  return {
    schemaVersion: 1,
    source: {
      gateway: { path: 'personal-server/game/gateway.mjs', sha256: sha256(gatewayBytes) },
      catalog: { path: 'personal-server/config/command-catalog.json', sha256: sha256(catalogBytes) },
      staticInterfaces: { path: 'agent/workflow/interface-catalog/static-interfaces.json', sha256: sha256(interfacesBytes) }
    },
    method: 'runtime supports() snapshot + ordered top-level gateway type conditions + static C2S metadata',
    summary,
    ownerWithoutSupports: ownersWithoutSupports,
    ownerWithoutCatalogTypes: ownersWithoutCatalogTypes,
    supportedOutsideCatalog,
    commands: rows
  };
}

const audit = await buildAudit();
const rendered = JSON.stringify(audit, null, 2) + '\n';
if (checkOnly) {
  const checkedIn = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (checkedIn !== rendered) {
    console.error('command-dispatch-audit.json is stale; run npm run audit:command-dispatch');
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(audit.summary));
  }
} else {
  fs.writeFileSync(outputPath, rendered);
  console.log(JSON.stringify(audit.summary));
}
