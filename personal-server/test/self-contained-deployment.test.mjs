import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { createCipheriv } from 'node:crypto';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createProtobufJsCodec } from '../server-list-codec.mjs';
import { encodeServerListRequest } from '../server-list.mjs';
import { signQuickSdk } from '../quick-sdk.mjs';

const sourceRoot = fileURLToPath(new URL('..', import.meta.url));

function copyServer(target) {
  const sourceDependencies = path.join(sourceRoot, 'node_modules');
  const skipped = new Set([
    sourceDependencies,
    path.join(sourceRoot, 'runtime.local-only.data')
  ]);
  fs.cpSync(sourceRoot, target, {
    recursive: true,
    filter(source) {
      return !skipped.has(source) && !/\.sqlite(?:-shm|-wal)?$/i.test(path.basename(source));
    }
  });
  fs.symlinkSync(sourceDependencies, path.join(target, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
}

async function waitForReady(file, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Deployment server exited with code ${child.exitCode}`);
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Deployment server did not write its ready status');
}

test('a clean personal-server copy boots from the public server list without the repository analysis tree', { timeout: 60000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-self-contained-'));
  const serverCopy = path.join(directory, 'personal-server');
  const dataDirectory = path.join(directory, 'runtime');
  let child;
  t.after(async () => {
    if (child && child.exitCode === null) child.kill('SIGTERM');
    fs.rmSync(directory, { recursive: true, force: true });
  });

  copyServer(serverCopy);
  const stderr = [];
  child = spawn(process.execPath, [path.join(serverCopy, 'local-server.mjs'), '--public'], {
    cwd: directory,
    env: {
      ...process.env,
      FC_LOCAL_DATA: dataDirectory,
      FC_SDK_PORT: '0',
      FC_SERVER_LIST_PORT: '0',
      FC_STARTUP_PORT: '0',
      FC_GAME_PORT: '0',
      FC_ADMIN_PORT: '0'
    },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => stderr.push(chunk));

  const status = await waitForReady(path.join(dataDirectory, 'server.local-only.json'), child);
  assert.deepEqual(Object.keys(status.boundPorts).sort(), ['admin', 'game', 'list', 'sdk', 'startup']);
  assert.equal(status.activeServerId, 2);
  assert.equal(status.launchProfileId, 'public-realm-2-20261110');
  assert.equal(status.activityWindowAnchor, 1792789200);
  assert.equal(status.ports.length, 5);
  assert.ok(status.ports.every(port => Number.isInteger(port) && port > 0 && port <= 65535));
  assert.equal(status.serverOpenedAt, 1794326400);
  assert.deepEqual(status.servers, [
    { id: 2, name: '命运二服', extranetIp: '140.143.142.251:19090', releaseTime: 1794326400 },
    { id: 3, name: '命运三服', extranetIp: '140.143.142.251:19091', releaseTime: 1794477600 }
  ]);
  assert.deepEqual(status.listenHosts, { sdk: '0.0.0.0', list: '0.0.0.0', startup: '0.0.0.0', game: '0.0.0.0', admin: '127.0.0.1' });
  assert.ok(fs.existsSync(path.join(dataDirectory, 'game.local-only.sqlite')));
  assert.ok(fs.existsSync(path.join(dataDirectory, 'admin-key.local-only.txt')));
  const packagedSqlite = [];
  for (const entry of fs.readdirSync(serverCopy, { recursive: true })) {
    if (/\.sqlite(?:-shm|-wal)?$/i.test(entry)) packagedSqlite.push(entry);
  }
  assert.deepEqual(packagedSqlite, []);

  const signingKey = JSON.parse(fs.readFileSync(path.join(serverCopy, 'config', 'server-list-signing-key.json'), 'utf8')).key;
  const form = encodeServerListRequest('channel_login_servers', { channel_id: 'local-channel', channel_uid: 'local-account', device_label: 'local-device' }, signingKey);
  const listResponse = await fetch(`http://127.0.0.1:${status.boundPorts.list}/server_list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: form.toString(),
    signal: AbortSignal.timeout(5000)
  });
  assert.equal(listResponse.status, 200);
  const decoded = createProtobufJsCodec().decode('pb_login_servers', Buffer.from(await listResponse.arrayBuffer()));
  assert.deepEqual(decoded.servers.map(server => [server.id, server.name, server.extranet_ip]), [
    [2, '命运二服', '140.143.142.251:19090'],
    [3, '命运三服', '140.143.142.251:19091']
  ]);
  const realmThreeForm = encodeServerListRequest('login_server', { server_id: 3 }, signingKey);
  const realmThreeResponse = await fetch(`http://127.0.0.1:${status.boundPorts.list}/server_list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: realmThreeForm.toString(),
    signal: AbortSignal.timeout(5000)
  });
  assert.equal(realmThreeResponse.status, 200);
  const realmThree = createProtobufJsCodec().decode('pb_login_server', Buffer.from(await realmThreeResponse.arrayBuffer()));
  assert.equal(realmThree.id, 3);
  assert.equal(realmThree.extranet_ip, '140.143.142.251:19091');

  const quickSdkKey = 'fclocal1';
  const cipher = createCipheriv('des-ede3', Buffer.concat([Buffer.from(quickSdkKey), Buffer.from(quickSdkKey), Buffer.from(quickSdkKey)]), null);
  const carrier = Buffer.concat([
    cipher.update(JSON.stringify({ uid: '9768a7c5ad00', token: '97170cea8a25' }), 'utf8'),
    cipher.final()
  ]).toString('base64');
  const quickFields = new Map([['product_code', 'fc-local'], ['json_data', carrier]]);
  const quickResponse = await fetch(`http://127.0.0.1:${status.boundPorts.sdk}/v2/users/checkLogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams([...quickFields, ['sign', signQuickSdk(quickFields, quickSdkKey)]]).toString(),
    signal: AbortSignal.timeout(5000)
  });
  assert.equal(quickResponse.status, 200);
  const quickLogin = await quickResponse.json();
  assert.equal(quickLogin.result, true);
  assert.equal(quickLogin.data.uid, 'local-1');
  assert.match(quickLogin.data.user_token, /^[0-9a-f]{64}$/);

  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const stopTimeout = new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error('Deployment server did not stop')), 10000);
    timer.unref();
  });
  await Promise.race([exited, stopTimeout]);
  assert.equal(stderr.join(''), '');

  const publicEnvironment = { ...process.env };
  delete publicEnvironment.FC_LOCAL_DATA;
  const missingData = spawnSync(process.execPath, [path.join(serverCopy, 'local-server.mjs'), '--public'], {
    cwd: directory,
    env: publicEnvironment,
    encoding: 'utf8'
  });
  assert.notEqual(missingData.status, 0);
  assert.match(missingData.stderr, /FC_LOCAL_DATA is required in public mode/);

  const insideSource = spawnSync(process.execPath, [path.join(serverCopy, 'local-server.mjs'), '--public'], {
    cwd: directory,
    env: { ...process.env, FC_LOCAL_DATA: path.join(serverCopy, 'runtime') },
    encoding: 'utf8'
  });
  assert.notEqual(insideSource.status, 0);
  assert.match(insideSource.stderr, /must be outside the deployed source tree/);
});
