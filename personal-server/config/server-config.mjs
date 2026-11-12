import fs from 'node:fs';
import { isIP } from 'node:net';
import { parseActivityCalendarTimestamp } from './activity-calendar-config.mjs';

export const DEFAULT_PUBLIC_SERVER_CONFIG_URL = new URL('./public-server.json', import.meta.url);

function object(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object`);
  return value;
}

function host(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError(`${name} must be a nonempty host`);
  return value.trim();
}

function port(value, name) {
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new TypeError(`${name} must be an integer from 1 through 65535`);
  return value;
}

function extranetIp(value, name) {
  if (typeof value !== 'string') throw new TypeError(`${name} must be an IPv4:port string`);
  const match = /^([^:]+):([1-9][0-9]{0,4})$/.exec(value);
  if (!match || isIP(match[1]) !== 4 || Number(match[2]) > 65535) throw new TypeError(`${name} must be an IPv4:port string`);
  return value;
}

function positiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${name} must be a positive integer`);
  return number;
}

export function parsePublicServerConfig(value) {
  const root = object(value, 'server config');
  const listen = object(root.listen, 'listen');
  const ports = object(root.ports, 'ports');
  if (!Array.isArray(root.servers) || root.servers.length === 0) throw new TypeError('servers must be a nonempty array');
  if (typeof root.publicSdkUrl !== 'string') throw new TypeError('publicSdkUrl must be a URL string');
  let sdkUrl;
  try { sdkUrl = new URL(root.publicSdkUrl); }
  catch { throw new TypeError('publicSdkUrl must be a valid URL'); }
  if (!['http:', 'https:'].includes(sdkUrl.protocol)) throw new TypeError('publicSdkUrl must use HTTP or HTTPS');

  const seenIds = new Set(), seenNames = new Set(), seenRoleIds = new Set();
  const servers = root.servers.map((entry, index) => {
    const server = object(entry, `servers[${index}]`);
    const id = Number(server.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError(`servers[${index}].id must be a positive integer`);
    if (seenIds.has(id)) throw new TypeError(`Duplicate server id: ${id}`);
    seenIds.add(id);
    const name = host(server.name, `servers[${index}].name`);
    if (seenNames.has(name)) throw new TypeError(`Duplicate server name: ${name}`);
    seenNames.add(name);
    const roleId = positiveInteger(server.roleId, `servers[${index}].roleId`);
    if (seenRoleIds.has(roleId)) throw new TypeError(`Duplicate server roleId: ${roleId}`);
    seenRoleIds.add(roleId);
    return Object.freeze({
      id,
      name,
      roleId,
      roleName: host(server.roleName, `servers[${index}].roleName`),
      launchProfileId: host(server.launchProfileId, `servers[${index}].launchProfileId`),
      launchAt: parseActivityCalendarTimestamp(server.launchAt, `servers[${index}].launchAt`),
      extranetIp: extranetIp(server.extranetIp, `servers[${index}].extranetIp`)
    });
  });
  const activeServerId = positiveInteger(root.activeServerId, 'activeServerId');
  const activeServer = servers.find(server => server.id === activeServerId);
  if (!activeServer) throw new TypeError(`activeServerId ${activeServerId} is not present in servers`);

  return Object.freeze({
    listen: Object.freeze({ publicHost: host(listen.publicHost, 'listen.publicHost'), adminHost: host(listen.adminHost, 'listen.adminHost') }),
    ports: Object.freeze({
      sdk: port(ports.sdk, 'ports.sdk'),
      list: port(ports.list, 'ports.list'),
      startup: port(ports.startup, 'ports.startup'),
      game: port(ports.game, 'ports.game'),
      admin: port(ports.admin, 'ports.admin')
    }),
    publicSdkUrl: sdkUrl.href.replace(/\/$/, ''),
    activeServerId,
    activeServer,
    servers: Object.freeze(servers)
  });
}

/**
 * Public mode serves exactly one realm per process. The realm list itself is
 * shared, so a new realm is added once and started as its own process.
 */
export function selectActiveServer(config, serverId) {
  const id = Number(serverId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError('activeServerId override must be a positive integer');
  const server = config.servers.find(entry => entry.id === id);
  if (!server) throw new TypeError(`activeServerId ${id} is not present in servers`);
  if (config.activeServerId === id) return config;
  return Object.freeze({ ...config, activeServerId: id, activeServer: server });
}

export function loadPublicServerConfig(source = DEFAULT_PUBLIC_SERVER_CONFIG_URL, { activeServerId } = {}) {
  let value;
  try { value = JSON.parse(fs.readFileSync(source, 'utf8')); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Public server config is not valid JSON: ${error.message}`);
    throw error;
  }
  const config = parsePublicServerConfig(value);
  return activeServerId === undefined ? config : selectActiveServer(config, activeServerId);
}
