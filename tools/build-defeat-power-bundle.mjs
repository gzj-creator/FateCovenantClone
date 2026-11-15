import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readTextAssets } from './unityfs-read.mjs';
import { replaceTextAsset } from './unityfs-byte-patch.mjs';
import { patchDefeatPowerLua } from './patch-defeat-power-lua.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function buildDefeatPowerBundle(input, outputDirectory) {
  if (fs.existsSync(outputDirectory)) throw new Error('Use a new output directory');
  const source = fs.readFileSync(input);
  const assets = readTextAssets(source);
  const matches = assets.filter(asset => asset.name === 'FightResultMissionForm.lua');
  if (matches.length !== 1) throw new Error('Expected one FightResultMissionForm TextAsset');
  const original = matches[0].bytes;
  const patch = patchDefeatPowerLua(original);
  const output = path.join(outputDirectory, `${patch.report.architecture}_lua_project.bundle`);
  const originalPath = path.join(outputDirectory, 'FightResultMissionForm.original.lua.bin');
  const replacement = path.join(outputDirectory, 'FightResultMissionForm.patched.lua.bin');
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(originalPath, original);
  fs.writeFileSync(replacement, patch.bytes);
  const bundle = replaceTextAsset(input, output, 'FightResultMissionForm.lua', replacement);
  const changed = readTextAssets(fs.readFileSync(output));
  const lookup = new Map(changed.map(asset => [asset.name, asset.bytes]));
  if (changed.length !== assets.length || lookup.size !== assets.length) throw new Error('Bundle TextAsset inventory changed');
  for (const asset of assets) {
    const expected = asset.name === 'FightResultMissionForm.lua' ? patch.bytes : asset.bytes;
    if (!lookup.get(asset.name)?.equals(expected)) throw new Error('Unexpected TextAsset change: ' + asset.name);
  }
  const report = {
    source: { path: path.resolve(input), sha256: hash(source), bytes: source.length },
    output: { path: path.resolve(output), sha256: bundle.outputSha256, bytes: bundle.outputBytes },
    patch: patch.report, bundle, verifiedTextAssets: changed.length,
    status: 'offline candidate; no APK generated or installed; no visual acceptance'
  };
  fs.writeFileSync(path.join(outputDirectory, 'defeat-power-bundle.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, directory] = process.argv.slice(2);
  if (!input || !directory) throw new Error('Usage: build-defeat-power-bundle.mjs <project.bundle> <new-output-directory>');
  console.log(JSON.stringify(buildDefeatPowerBundle(input, directory), null, 2));
}
