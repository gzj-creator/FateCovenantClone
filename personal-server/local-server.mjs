import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSdkService } from './sdk-service.mjs';
import { createServerListService } from './server-list.mjs';
import { createProtobufJsCodec } from './server-list-codec.mjs';
import { createStartupService } from './startup-service.mjs';
import { createLocalGame } from './local-game.mjs';
import { createAdminService } from './admin/server.mjs';
import { loadActivityCalendarConfig, parseActivityCalendarTimestamp } from './config/activity-calendar-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configDirectory = path.join(__dirname, 'config');
const secretsDirectory = path.join(__dirname, 'secrets');

const activityCalendar = loadActivityCalendarConfig(process.env.FC_ACTIVITY_CALENDAR_CONFIG);
const serverOpenedAt = process.env.FC_SERVER_OPENED_AT
  ? parseActivityCalendarTimestamp(process.env.FC_SERVER_OPENED_AT)
  : activityCalendar.serverOpenedAt;
const directory = path.resolve(process.env.FC_LOCAL_DATA ?? 'analysis/experiments/private-server-20261025/p3/runtime.local-only.data');
fs.mkdirSync(directory, { recursive: true });
const logger = event => { const line = JSON.stringify({ time: new Date().toISOString(), ...event }); fs.appendFileSync(path.join(directory, 'events.jsonl'), line + String.fromCharCode(10)); console.log(line); };
// Compatibility constants stay on disk; the isolated APK still signs Lua requests with these.
const tables = JSON.parse(fs.readFileSync(path.join(projectRoot, 'analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/GameTable.data.lua.json'), 'utf8'));
const platformPrototype = tables.prototypes.find(p => p.constants.some(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform')));
const platformRow = platformPrototype?.constants.find(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform'));
const platformValues = platformPrototype?.constants.find(c => c.type === 'table' && typeof c.array[2] === 'string');
if (!platformRow || !platformValues) throw new Error('Local client platform contract not found');
const platformFields = Object.fromEntries(platformRow.hash.map(([key, index]) => [key, platformValues.array[index]]));
  const sdkAccount = Object.freeze({ loginCode: 'localtest', passwordMd5: createHash('md5').update('Local2026!').digest('hex'), userId: 'local-1', nickname: 'Local Adventurer' });
  const sdk = createSdkService({
    localTestOtp: true, sessionTtlSeconds: 604800, sessionPath: path.join(directory, 'sdk-sessions.local-only.json'),
    platform: { appId: platformFields.app_id, appKey: platformFields.sign_to_platform },
    quickSdk: { productCode: 'fc-local', productKey: 'fclocal1' },
    // The shipped APK obtains a QuickSDK platform identity from its upstream
    // login page, then signs that identity into /v2/users/checkLogin. Bind the
    // signed platform identity to this deployment's current game account and
    // issue a server-owned token; no APK or device NAT is required.
    quickSdkIdentityResolver: () => ({ userId: sdkAccount.userId, loginCode: sdkAccount.loginCode, nickname: sdkAccount.nickname }),
    appId: 'fc-local', appKey: 'fc-local-development-key', account: sdkAccount, logger
  });
const keyPath = path.resolve(process.env.FC_SERVER_LIST_SIGNING_KEY_PATH ?? path.join(secretsDirectory, 'server-list-signing-key.json'));
const keyContent = fs.readFileSync(keyPath, 'utf8');
const key = JSON.parse(keyContent).key;
const list = createServerListService({ signingKey: key, server: { id: 1, name: 'Local Server', extranetIp: '127.0.0.1:19090', releaseTime: serverOpenedAt }, codec: createProtobufJsCodec(), logger });
const updateManifestPath = path.resolve(process.env.FC_UPDATE_MANIFEST_PATH ?? path.join(configDirectory, 'update-manifest-364110.txt'));
const startup = createStartupService({ appVersion: '1.55.090365', assetVersion: 364110, updateManifest: fs.readFileSync(updateManifestPath), logger });
const game = createLocalGame({
  databasePath: path.join(directory, 'game.local-only.sqlite'),
  statePath: path.join(directory, 'state.local-only.json'),
  capturePath: path.join(projectRoot, 'personal-server/fixtures/login-modules.local-only.json'),
  verifySession: sdk.verifySession,
  serverOpenedAt,
  activityMode: activityCalendar.mode,
  currentFishingActivityId: activityCalendar.currentFishingActivityId,
  sprintPreview: true,
  localWallet: true,
  missionFightPlayback: true,
  logger
});
sdk.attachWallet(game.wallet);
const tokenPath=path.join(directory,'admin-key.local-only.txt');
const admin=createAdminService({wallet:game.wallet,mail:game.mail,voucher:game.voucher,...(fs.existsSync(tokenPath)?{token:fs.readFileSync(tokenPath,'utf8').trim()}:{})});
if(!fs.existsSync(tokenPath))fs.writeFileSync(tokenPath,admin.token,{mode:0o600});
fs.writeFileSync(path.join(directory,'admin-url.local-only.txt'),'http://127.0.0.1:18883/#key='+admin.token);
const services = [admin,sdk, list, startup, game];
try {
  for (const [service, port] of [[sdk, 18880], [list, 18881], [startup, 18882], [game, 19090],[admin,18883]]) await service.listen(port);
  fs.writeFileSync(path.join(directory, 'server.local-only.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), serverOpenedAt, activityMode: activityCalendar.mode, currentFishingActivityId: activityCalendar.currentFishingActivityId, ports: [18880, 18881, 18882, 19090,18883] }, null, 2));
  logger({ event: 'local_server_ready', ports: [18880, 18881, 18882, 19090, 18883], serverOpenedAt, activityMode: activityCalendar.mode, currentFishingActivityId: activityCalendar.currentFishingActivityId });
} catch (error) { for (const service of services) await service.close(); throw error; }
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { for (const service of services) await service.close(); });
