import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Offline source inventory. Matches are review candidates, never a claim that
// the referenced arithmetic matches the original server. No runtime DB opens.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.dirname(serverRoot);
const destination = process.argv[2] && path.resolve(process.argv[2]);
const patterns = {
  rounding: /\bMath\.(?:round|ceil|floor|trunc)\s*\(/,
  fixedPoint: /(?:[*/]\s*(?:10000|100|1000)\b|ATTR_SCALE|GROWTH_SCALE)/,
  randomness: /\b(?:random|sample|chance|weight|probability|guaranteed)\b/i,
  quantities: /(?:\.num\s*=|\.count\s*=|chip_num\s*=|balance_cents|totalCost|priceCents|diff_num)/,
  sourceLimits: /\b(?:infer(?:ence|red)?|heuristic|compatibility|unrecover(?:ed)?|unproven|placeholder|TODO)\b/i
};
const domains = [
  ['combat', /(?:battle|fight|effects|attribute|power|lineup|rank)/],
  ['economy', /(?:wallet|voucher|recharge|shop|commerce|purchase|permit|card|fund)/],
  ['rewards-resources', /(?:resources|item|reward|award|box|energy|role-level|mail|task|statistics)/],
  ['random-draw', /(?:recruit|draw|pool|capsule|slot-game)/],
  ['development', /(?:hero|equip|pet|elves|rune|relic|destiny|tactics|favor|handbook|magic|treasure|time-temple|cabin|museum|fetter)/],
  ['protocol-admin-runtime', /(?:\/protocol\/|\/admin\/|^personal-server\/[^/]+\.mjs$)/],
  ['schedule-social-activities', /./]
];
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : /\.(?:mjs|js)$/.test(entry.name) ? [target] : [];
  });
}
const files = [
  ...['game', 'config', 'storage', 'protocol', 'admin'].flatMap(name => walk(path.join(serverRoot, name))),
  ...fs.readdirSync(serverRoot).filter(name => name.endsWith('.mjs')).map(name => path.join(serverRoot, name))
].sort();
const inventory = files.map(filename => {
  const bytes = fs.readFileSync(filename), source = bytes.toString('utf8');
  const relative = path.relative(repoRoot, filename).split(path.sep).join('/');
  const candidates = source.split(/\r?\n/).flatMap((line, i) => {
    const kinds = Object.entries(patterns).filter(([, pattern]) => pattern.test(line)).map(([kind]) => kind);
    return kinds.length ? [{ line: i + 1, kinds, source: line.trim() }] : [];
  });
  return {
    path: relative,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    domain: domains.find(([, pattern]) => pattern.test(relative))[0],
    lines: source.split(/\r?\n/).length,
    candidates
  };
});
const summary = {
  sourceFiles: inventory.length,
  candidateFiles: inventory.filter(file => file.candidates.length).length,
  candidateLines: inventory.reduce((total, file) => total + file.candidates.length, 0),
  domains: Object.fromEntries(domains.map(([domain]) => [domain, {
    files: inventory.filter(file => file.domain === domain).length,
    candidateLines: inventory.filter(file => file.domain === domain).reduce((n, file) => n + file.candidates.length, 0)
  }]))
};
const result = {
  schemaVersion: 1,
  method: 'Every game/config/storage/protocol/admin JS module and root runtime mjs hashed and scanned; line candidates require semantic review.',
  limitations: 'Does not certify original formula fidelity, runtime/APK acceptance, or complete coverage of arithmetic written without these patterns.',
  summary,
  inventory
};
if (destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
}
console.log(JSON.stringify(summary));
