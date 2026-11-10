import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readAssetBytes, readJsonAsset, defaultDataDirectory, loginSeedPath, serverRootPath,
  protocolAsset, serverListSigningKeyPath, tableAsset } from './assets.mjs';
import { createSdkService } from './sdk-service.mjs';
import { createServerListService } from './server-list.mjs';
import { createProtobufJsCodec } from './server-list-codec.mjs';
import { createStartupService } from './startup-service.mjs';
import { createLocalGame } from './local-game.mjs';
import { createAdminService } from './admin/server.mjs';
import { loadActivityCalendarConfig, parseActivityCalendarTimestamp } from './config/activity-calendar-config.mjs';
import { loadPublicServerConfig } from './config/server-config.mjs';
import { serverDayNumber } from './game/activity-calendar.mjs';

function configuredPort(variable, fallback) {
  const raw = process.env[variable];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0 || value > 65535) throw new TypeError(`${variable} must be a port from 0 through 65535`);
  return value;
}

function configuredHost(variable, fallback) {
  const raw = process.env[variable];
  if (raw === undefined || raw.trim() === '') return fallback;
  return raw.trim();
}

function pathIsInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function publicDataDirectory() {
  const raw = process.env.FC_LOCAL_DATA;
  if (!raw) throw new Error('FC_LOCAL_DATA is required in public mode and must name an external persistent volume');
  if (!path.isAbsolute(raw)) throw new Error('FC_LOCAL_DATA must be an absolute path in public mode');
  const resolved = path.resolve(raw);
  if (pathIsInside(serverRootPath, resolved)) {
    throw new Error('FC_LOCAL_DATA must be outside the deployed source tree in public mode');
  }
  return resolved;
}

const publicDeployment = process.argv.includes('--public') ? loadPublicServerConfig() : null;
const activeServer = publicDeployment?.activeServer ?? null;

const requestedPorts = Object.freeze({
  sdk: configuredPort('FC_SDK_PORT', publicDeployment?.ports.sdk ?? 18880),
  list: configuredPort('FC_SERVER_LIST_PORT', publicDeployment?.ports.list ?? 18881),
  startup: configuredPort('FC_STARTUP_PORT', publicDeployment?.ports.startup ?? 18882),
  game: configuredPort('FC_GAME_PORT', publicDeployment?.ports.game ?? 19090),
  admin: configuredPort('FC_ADMIN_PORT', publicDeployment?.ports.admin ?? 18883)
});
const publicListenHost = publicDeployment?.listen.publicHost ?? '127.0.0.1';
const adminListenHost = configuredHost('FC_ADMIN_LISTEN_HOST', publicDeployment?.listen.adminHost ?? '127.0.0.1');
const listenHosts = Object.freeze({ sdk: publicListenHost, list: publicListenHost, startup: publicListenHost,
  game: publicListenHost, admin: adminListenHost });

const activityCalendar = loadActivityCalendarConfig(process.env.FC_ACTIVITY_CALENDAR_CONFIG);
const environmentOpenedAt = process.env.FC_SERVER_OPENED_AT
  ? parseActivityCalendarTimestamp(process.env.FC_SERVER_OPENED_AT)
  : null;
if (publicDeployment) {
  if (!activeServer) throw new Error('Public mode requires one active server in public-server.json');
  if (activityCalendar.serverOpenedAt !== activeServer.launchAt) {
    throw new Error('activity-calendar serverOpenedAt must equal the active server launchAt');
  }
  if (environmentOpenedAt != null && environmentOpenedAt !== activeServer.launchAt) {
    throw new Error('FC_SERVER_OPENED_AT cannot override the active server launchAt in public mode');
  }
  if (activityCalendar.mode === 'schedule' && activityCalendar.activityWindowAnchor == null) {
    throw new Error('Schedule mode requires activityWindowAnchor for launch-profile rebasing');
  }
}
const serverOpenedAt = publicDeployment ? activeServer.launchAt : (environmentOpenedAt ?? activityCalendar.serverOpenedAt);
const directory = publicDeployment ? publicDataDirectory() : path.resolve(process.env.FC_LOCAL_DATA ?? defaultDataDirectory);
fs.mkdirSync(directory, { recursive: true });
const logger = event => { const line = JSON.stringify({ time: new Date().toISOString(), ...event }); fs.appendFileSync(path.join(directory, 'events.jsonl'), line + String.fromCharCode(10)); console.log(line); };
// Compatibility constants stay on disk; the isolated APK still signs Lua requests with these.
const tables = readJsonAsset(tableAsset('GameTable.data.lua.json'));
const platformPrototype = tables.prototypes.find(p => p.constants.some(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform')));
const platformRow = platformPrototype?.constants.find(c => c.type === 'table' && c.hash.some(([key]) => key === 'sign_to_platform'));
const platformValues = platformPrototype?.constants.find(c => c.type === 'table' && typeof c.array[2] === 'string');
if (!platformRow || !platformValues) throw new Error('Local client platform contract not found');
const platformFields = Object.fromEntries(platformRow.hash.map(([key, index]) => [key, platformValues.array[index]]));
const sdkAccount = Object.freeze({
  loginCode: 'localtest',
  passwordMd5: createHash('md5').update('Local2026!').digest('hex'),
  userId: 'local-1',
  nickname: activeServer?.roleName ?? 'Local Adventurer'
});
const sdk = createSdkService({
  localTestOtp: true,
  sessionTtlSeconds: 604800,
  sessionPath: path.join(directory, 'sdk-sessions.local-only.json'),
  platform: { appId: platformFields.app_id, appKey: platformFields.sign_to_platform },
  quickSdk: { productCode: 'fc-local', productKey: 'fclocal1' },
  quickSdkIdentityResolver: () => ({
    userId: sdkAccount.userId, loginCode: sdkAccount.loginCode, nickname: sdkAccount.nickname
  }),
  quickServerUrl: publicDeployment?.publicSdkUrl ?? `http://127.0.0.1:${requestedPorts.sdk || 18880}`,
  appId: 'fc-local', appKey: 'fc-local-development-key', account: sdkAccount, logger
});
const keyPath = process.env.FC_SERVER_LIST_SIGNING_KEY_PATH
  ? path.resolve(process.env.FC_SERVER_LIST_SIGNING_KEY_PATH)
  : serverListSigningKeyPath;
const key = readJsonAsset(keyPath).key;
const updateManifest = process.env.FC_UPDATE_MANIFEST_PATH
  ? fs.readFileSync(path.resolve(process.env.FC_UPDATE_MANIFEST_PATH))
  : readAssetBytes(protocolAsset('update-manifest-364110.txt'));
const startup = createStartupService({ appVersion: '1.55.090365', assetVersion: 364110, updateManifest, logger });
const game = createLocalGame({
  databasePath: path.join(directory, 'game.local-only.sqlite'),
  statePath: path.join(directory, 'state.local-only.json'),
  capturePath: loginSeedPath,
  verifySession: sdk.verifySession,
  serverOpenedAt,
  serverId: activeServer?.id ?? 1,
  serverName: activeServer?.name ?? '命运一服',
  roleId: activeServer?.roleId ?? 100001,
  roleName: activeServer?.roleName ?? 'Local Adventurer',
  launchProfileId: activeServer?.launchProfileId ?? null,
  activityWindowAnchor: publicDeployment ? activityCalendar.activityWindowAnchor : null,
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
    const address = await service.listen(requestedPorts[name], listenHosts[name]);
    boundPorts[name] = address.port;
  }
  const servers = publicDeployment
    ? [{ id: activeServer.id, name: activeServer.name, extranetIp: activeServer.extranetIp, releaseTime: activeServer.launchAt }]
    : [{ id: 1, name: '命运一服', extranetIp: `127.0.0.1:${boundPorts.game}`, releaseTime: serverOpenedAt }];
  const list = createServerListService({ signingKey: key, servers, codec: createProtobufJsCodec(), logger });
  services.push(list);
  const listAddress = await list.listen(requestedPorts.list, listenHosts.list);
  boundPorts.list = listAddress.port;
  fs.writeFileSync(path.join(directory,'admin-url.local-only.txt'),`http://127.0.0.1:${boundPorts.admin}/#key=${admin.token}`);
  const ports = [boundPorts.sdk, boundPorts.list, boundPorts.startup, boundPorts.game, boundPorts.admin];
  const launch = {
    activeServerId: activeServer?.id ?? 1,
    launchProfileId: activeServer?.launchProfileId ?? null,
    activityWindowAnchor: publicDeployment ? activityCalendar.activityWindowAnchor : null,
    serverDay: serverDayNumber(serverOpenedAt, Math.floor(Date.now() / 1000))
  };
  fs.writeFileSync(path.join(directory, 'server.local-only.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), ...launch, serverOpenedAt, activityMode: activityCalendar.mode, currentFishingActivityId: activityCalendar.currentFishingActivityId, servers, listenHosts, ports, boundPorts }, null, 2));
  logger({ event: 'local_server_ready', ...launch, servers, listenHosts, ports, boundPorts, serverOpenedAt, activityMode: activityCalendar.mode, currentFishingActivityId: activityCalendar.currentFishingActivityId });
} catch (error) { for (const service of services) await service.close(); throw error; }
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { for (const service of services) await service.close(); });
