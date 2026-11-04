import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readAssetBytes, readJsonAsset, defaultDataDirectory, loginSeedPath,
  protocolAsset, serverListSigningKeyPath, tableAsset } from './assets.mjs';
import { createSdkService } from './sdk-service.mjs';
import { createServerListService } from './server-list.mjs';
import { createProtobufJsCodec } from './server-list-codec.mjs';
import { createStartupService } from './startup-service.mjs';
import { createLocalGame } from './local-game.mjs';
import { createAdminService } from './admin/server.mjs';
import { loadActivityCalendarConfig, parseActivityCalendarTimestamp } from './config/activity-calendar-config.mjs';

function configuredPort(variable, fallback) {
  const raw = process.env[variable];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0 || value > 65535) throw new TypeError(`${variable} must be a port from 0 through 65535`);
  return value;
}

const requestedPorts = Object.freeze({
  sdk: configuredPort('FC_SDK_PORT', 18880),
  list: configuredPort('FC_SERVER_LIST_PORT', 18881),
  startup: configuredPort('FC_STARTUP_PORT', 18882),
  game: configuredPort('FC_GAME_PORT', 19090),
  admin: configuredPort('FC_ADMIN_PORT', 18883)
});

const activityCalendar = loadActivityCalendarConfig(process.env.FC_ACTIVITY_CALENDAR_CONFIG);
const serverOpenedAt = process.env.FC_SERVER_OPENED_AT
  ? parseActivityCalendarTimestamp(process.env.FC_SERVER_OPENED_AT)
  : activityCalendar.serverOpenedAt;
const directory = path.resolve(process.env.FC_LOCAL_DATA ?? defaultDataDirectory);
fs.mkdirSync(directory, { recursive: true });
const logger = event => { const line = JSON.stringify({ time: new Date().toISOString(), ...event }); fs.appendFileSync(path.join(directory, 'events.jsonl'), line + String.fromCharCode(10)); console.log(line); };
// Compatibility constants stay on disk; the isolated APK still signs Lua requests with these.
const tables = readJsonAsset(tableAsset('GameTable.data.lua.json'));
const platformPrototype = tables.prototypes.find(p => p.constants.some(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform')));
const platformRow = platformPrototype?.constants.find(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform'));
const platformValues = platformPrototype?.constants.find(c => c.type === 'table' && typeof c.array[2] === 'string');
if (!platformRow || !platformValues) throw new Error('Local client platform contract not found');
const platformFields = Object.fromEntries(platformRow.hash.map(([key, index]) => [key, platformValues.array[index]]));
  const sdk = createSdkService({ localTestOtp: true, sessionTtlSeconds: 604800, sessionPath: path.join(directory, 'sdk-sessions.local-only.json'), platform: { appId: platformFields.app_id, appKey: platformFields.sign_to_platform }, quickSdk: { productCode: 'fc-local', productKey: 'fclocal1' }, appId: 'fc-local', appKey: 'fc-local-development-key', account: { loginCode: 'localtest', passwordMd5: createHash('md5').update('Local2026!').digest('hex'), userId: 'local-1', nickname: 'Local Adventurer' }, logger });
const key = readJsonAsset(serverListSigningKeyPath).key;
const startup = createStartupService({ appVersion: '1.55.090365', assetVersion: 364110, updateManifest: readAssetBytes(protocolAsset('update-manifest-364110.txt')), logger });
const game = createLocalGame({
  databasePath: path.join(directory, 'game.local-only.sqlite'),
  statePath: path.join(directory, 'state.local-only.json'),
  capturePath: loginSeedPath,
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
const services = [admin,sdk,startup,game];
const boundPorts = {};
try {
  for (const [name, service] of [['sdk',sdk], ['startup',startup], ['game',game], ['admin',admin]]) {
    const address = await service.listen(requestedPorts[name]);
    boundPorts[name] = address.port;
  }
  const list = createServerListService({ signingKey: key, server: { id: 1, name: 'Local Server', extranetIp: `127.0.0.1:${boundPorts.game}`, releaseTime: serverOpenedAt }, codec: createProtobufJsCodec(), logger });
  services.push(list);
  const listAddress = await list.listen(requestedPorts.list);
  boundPorts.list = listAddress.port;
  fs.writeFileSync(path.join(directory,'admin-url.local-only.txt'),`http://127.0.0.1:${boundPorts.admin}/#key=${admin.token}`);
  const ports = [boundPorts.sdk, boundPorts.list, boundPorts.startup, boundPorts.game, boundPorts.admin];
  fs.writeFileSync(path.join(directory, 'server.local-only.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), serverOpenedAt, activityMode: activityCalendar.mode, currentFishingActivityId: activityCalendar.currentFishingActivityId, ports, boundPorts }, null, 2));
  logger({ event: 'local_server_ready', ports, boundPorts, serverOpenedAt, activityMode: activityCalendar.mode, currentFishingActivityId: activityCalendar.currentFishingActivityId });
} catch (error) { for (const service of services) await service.close(); throw error; }
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { for (const service of services) await service.close(); });
