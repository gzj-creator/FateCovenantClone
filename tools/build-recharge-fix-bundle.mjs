import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readTextAssets } from './unityfs-read.mjs';
import { replaceTextAsset } from './unityfs-byte-patch.mjs';
import { patchDailyDiscountLua, patchCouponRechargeLua } from './patch-wallet-payment-lua.mjs';

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function buildRechargeFixBundle(inputPath, outputDirectory) {
  const source = fs.readFileSync(inputPath);
  const assets = new Map(readTextAssets(source).map(asset => [asset.name, asset.bytes]));
  const patches = [
    ['RechargeSuperGiftBannerNode.lua', patchDailyDiscountLua],
    ['RechargeMgr.lua', patchCouponRechargeLua]
  ].map(([name, patch]) => {
    if (!assets.has(name)) throw new Error(`Missing TextAsset ${name}`);
    const before = assets.get(name), after = patch(before);
    return { name, before, after, path: path.join(outputDirectory, name + '.bin') };
  });
  const intermediate = path.join(outputDirectory, 'daily-ui.bundle');
  const outputPath = path.join(outputDirectory, '64_lua_project.bundle');
  const reportPath = path.join(outputDirectory, 'recharge-fix-bundle.json');
  for (const file of [...patches.map(patch => patch.path), intermediate, outputPath, reportPath]) {
    if (fs.existsSync(file)) throw new Error(`Refusing to overwrite ${file}`);
  }
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const patch of patches) fs.writeFileSync(patch.path, patch.after);
  const stages = [
    replaceTextAsset(inputPath, intermediate, patches[0].name, patches[0].path),
    replaceTextAsset(intermediate, outputPath, patches[1].name, patches[1].path)
  ];
  const output = fs.readFileSync(outputPath);
  const verified = new Map(readTextAssets(output).map(asset => [asset.name, asset.bytes]));
  if (verified.size !== assets.size) throw new Error('TextAsset count changed');
  for (const [name, bytes] of assets) {
    const expected = patches.find(patch => patch.name === name)?.after ?? bytes;
    if (!verified.get(name)?.equals(expected)) throw new Error(`Unexpected TextAsset change: ${name}`);
  }
  const report = {
    source: { path: path.resolve(inputPath), sha256: sha256(source), bytes: source.length },
    output: { path: path.resolve(outputPath), sha256: sha256(output), bytes: output.length },
    patches: patches.map(patch => ({ name: patch.name, sourceSha256: sha256(patch.before), outputSha256: sha256(patch.after), bytes: patch.after.length })),
    stages, verifiedTextAssets: verified.size, deviceValidated: false
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, outputDirectory] = process.argv.slice(2);
  if (!input || !outputDirectory) throw new Error('Usage: build-recharge-fix-bundle.mjs <v9-lua-project.bundle> <new-output-directory>');
  console.log(JSON.stringify(buildRechargeFixBundle(input, outputDirectory), null, 2));
}
