import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameDay, gameDayIndex, gameWeek, naturalDay, serverDay } from '../game/time.mjs';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAY = 86400;
const TZ = 8 * 3600;

test('natural day starts at local midnight', () => {
  const at = Date.UTC(2026, 10, 12, 18, 30) / 1000;
  assert.equal(naturalDay(at), Date.UTC(2026, 10, 13, 0, 0) / 1000 - TZ);
});

test('business day starts at local 05:00', () => {
  const before = Date.UTC(2026, 10, 11, 20, 59, 59) / 1000;
  const after = Date.UTC(2026, 10, 11, 21, 0, 0) / 1000;
  assert.equal(gameDay(before), Date.UTC(2026, 10, 10, 21, 0) / 1000);
  assert.equal(gameDay(after), Date.UTC(2026, 10, 11, 21, 0) / 1000);
  assert.equal(gameDayIndex(after) - gameDayIndex(before), 1);
});

test('server day counts business days and ignores the opening hour', () => {
  const openedAt = Date.UTC(2026, 10, 12, 10, 0) / 1000; // 18:00 Asia/Shanghai
  assert.equal(serverDay(openedAt, openedAt), 1);
  assert.equal(serverDay(openedAt, Date.UTC(2026, 10, 12, 20, 59) / 1000), 1);
  assert.equal(serverDay(openedAt, Date.UTC(2026, 10, 12, 21, 0) / 1000), 2);
  assert.equal(serverDay(openedAt, openedAt - 1), 0);
});

test('game week starts Monday at the business-day boundary', () => {
  const monday = Date.UTC(2026, 10, 8, 21, 0) / 1000;
  assert.equal(gameWeek(monday), monday);
  assert.equal(gameWeek(monday + 6 * DAY), monday);
  assert.equal(gameWeek(monday + 7 * DAY), monday + 7 * DAY);
});

test('business code contains no bare day-reset offsets', () => {
  const roots = ['game', 'storage', 'admin'];
  const pattern = /(?<![\d.])(10800|18000|28800)(?![\d.])|(?<![\d.])(?:5|8)\s*\*\s*3600(?![\d.])/;
  const offenders = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.mjs') && entry.name !== 'time.mjs') {
        const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
        lines.forEach((line, index) => {
          if (pattern.test(line)) offenders.push(`${path.relative(serverRoot, full)}:${index + 1}: ${line.trim()}`);
        });
      }
    }
  };
  for (const root of roots) walk(path.join(serverRoot, root));
  assert.deepEqual(offenders, []);
});

