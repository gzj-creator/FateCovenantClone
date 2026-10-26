import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createSdkService } from './sdk-service.mjs';
import { createServerListService } from './server-list.mjs';
import { createProtobufJsCodec } from './server-list-codec.mjs';
import { createStartupService } from './startup-service.mjs';
import { createLocalGame } from './local-game.mjs';
import { createAdminService } from './admin/server.mjs';

const directory = path.resolve(process.env.FC_LOCAL_DATA ?? 'analysis/experiments/private-server-20261025/p3/runtime.local-only.data');
fs.mkdirSync(directory, { recursive: true });
const logger = event => { const line = JSON.stringify({ time: new Date().toISOString(), ...event }); fs.appendFileSync(path.join(directory, 'events.jsonl'), line + String.fromCharCode(10)); console.log(line); };
// Compatibility constants stay on disk; the isolated APK still signs Lua requests with these.
const tables = JSON.parse(fs.readFileSync('analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/GameTable.data.lua.json', 'utf8'));
const platformPrototype = tables.prototypes.find(p => p.constants.some(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform')));
const platformRow = platformPrototype?.constants.find(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform'));
const platformValues = platformPrototype?.constants.find(c => c.type === 'table' && typeof c.array[2] === 'string');
if (!platformRow || !platformValues) throw new Error('Local client platform contract not found');
const platformFields = Object.fromEntries(platformRow.hash.map(([key, index]) => [key, platformValues.array[index]]));
const sdk = createSdkService({ localTestOtp: true, platform: { appId: platformFields.app_id, appKey: platformFields.sign_to_platform }, quickSdk: { productCode: 'fc-local', productKey: 'fclocal1' }, appId: 'fc-local', appKey: 'fc-local-development-key', account: { loginCode: 'localtest', passwordMd5: createHash('md5').update('Local2026!').digest('hex'), userId: 'local-1', nickname: 'Local Adventurer' }, logger });
const key = JSON.parse(fs.readFileSync('analysis/experiments/private-server-20261025/p3/server-key.local-only.json')).key;
const list = createServerListService({ signingKey: key, server: { id: 1, name: 'Local Server', extranetIp: '127.0.0.1:19090' }, codec: createProtobufJsCodec(), logger });
const startup = createStartupService({ appVersion: '1.55.090365', assetVersion: 364110, logger });
const game = createLocalGame({ databasePath: path.join(directory, 'game.local-only.sqlite'), statePath: path.join(directory, 'state.local-only.json'), capturePath: 'personal-server/fixtures/login-modules.local-only.json', verifySession: sdk.verifySession, sprintPreview: true, localWallet:true, missionFightPlayback:true, logger });
sdk.attachWallet(game.wallet);
const tokenPath=path.join(directory,'admin-key.local-only.txt');
const admin=createAdminService({wallet:game.wallet,...(fs.existsSync(tokenPath)?{token:fs.readFileSync(tokenPath,'utf8').trim()}:{})});
if(!fs.existsSync(tokenPath))fs.writeFileSync(tokenPath,admin.token,{mode:0o600});
fs.writeFileSync(path.join(directory,'admin-url.local-only.txt'),'http://127.0.0.1:18883/#key='+admin.token);
const services = [admin,sdk, list, startup, game];
try {
  for (const [service, port] of [[sdk, 18880], [list, 18881], [startup, 18882], [game, 19090],[admin,18883]]) await service.listen(port);
  fs.writeFileSync(path.join(directory, 'server.local-only.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), ports: [18880, 18881, 18882, 19090,18883] }, null, 2));
  logger({ event: 'local_server_ready', ports: [18880, 18881, 18882, 19090, 18883] });
} catch (error) { for (const service of services) await service.close(); throw error; }
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { for (const service of services) await service.close(); });
