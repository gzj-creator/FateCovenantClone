import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Regenerate config/command-catalog.json from the read-only route probe.
//
//   node scripts/generate-command-catalog.mjs F:/path/to/route-probe.json
//
// The catalog is an input to the runtime command registry. Access is a
// heuristic only until E9-2 supplies the client command -> function map; the
// gateway uses it only for commands that have an explicit requires entry.

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/generate-command-catalog.mjs <route-probe.json>');
const probe = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
if (!Array.isArray(probe.results) || probe.results.length !== 1407) {
  throw new Error(`Expected 1407 probe results, got ${probe.results?.length}`);
}

const writePattern = /(^|_)(set|change|edit|save|create|delete|remove|buy|sell|use|draw|claim|award|upgrade|compose|consume|submit|cancel|kick|invite|join|leave|apply|accept|reject)(_|$)/;
const readPattern = /(^get_|^query_|^list_|^search_|^fetch_|^load_|^check_|^preview_|^calc_|^can_|_info$|_list$|_login$|_query$|_snapshot$|_rank$|^sync|^view_)/;
const commands = probe.results.map(row => ({
  type: Number(row.type),
  name: String(row.name),
  module: String(row.module),
  task: String(row.task),
  plan: String(row.plan),
  access: writePattern.test(String(row.name)) || !readPattern.test(String(row.name)) ? 'write' : 'read',
  requires: []
})).sort((left, right) => left.type - right.type);

const types = new Set(commands.map(row => row.type));
const names = new Set(commands.map(row => row.name));
if (types.size !== commands.length || names.size !== commands.length) {
  throw new Error('Probe contains duplicate command types or names');
}

const output = path.join(serverRoot, 'config', 'command-catalog.json');
fs.writeFileSync(output, JSON.stringify({
  source: 'route-probe.json',
  generatedAt: String(probe.generatedAt ?? new Date().toISOString()),
  total: commands.length,
  commands
}, null, 2) + '\n');
process.stdout.write(`Wrote ${path.relative(serverRoot, output)} (${commands.length} commands)\n`);
