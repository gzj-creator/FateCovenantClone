import assert from 'node:assert/strict';
import test from 'node:test';
import { createRealtimePublisher } from '../game/realtime-publisher.mjs';

function fixture({ roleId = 1, guilds = new Map() } = {}) {
  const sent = [];
  const subscribers = new Map();
  for (const id of [1, 2, 3]) {
    subscribers.set(id, new Set([(type, data) => sent.push({ connection: id, type, data })]));
  }
  const events = [];
  const publisher = createRealtimePublisher({
    subscribers,
    currentRoleId: () => roleId,
    guildIdForRole: id => guilds.get(id) ?? null,
    logger: event => events.push(event)
  });
  return { publisher, sent, events, subscribers };
}

test('role targets reach only every connection of that role', () => {
  const f = fixture();
  f.subscribers.get(1).add((type, data) => f.sent.push({ connection: 'role-1-extra', type, data }));
  const data = Buffer.from('role');
  const result = f.publisher.publish(7201, data, { kind: 'role', roleId: 1 });
  assert.deepEqual(result, { target: { kind: 'role', roleId: 1 }, delivered: 2 });
  assert.deepEqual(f.sent.map(row => row.connection), [1, 'role-1-extra']);
});

test('server targets fan out to every connected role', () => {
  const f = fixture();
  const result = f.publisher.publish(3304, Buffer.from('server'), { kind: 'server' });
  assert.deepEqual(result, { target: { kind: 'server' }, delivered: 3 });
  assert.deepEqual(f.sent.map(row => row.connection), [1, 2, 3]);
});

test('guild targets resolve online roles through the guild authority', () => {
  const f = fixture({ guilds: new Map([[1, 900001], [2, 900002], [3, 900001]]) });
  const result = f.publisher.publish(2305, Buffer.from('guild'), { kind: 'guild', guildId: 900001 });
  assert.deepEqual(result, { target: { kind: 'guild', guildId: 900001 }, delivered: 2 });
  assert.deepEqual(f.sent.map(row => row.connection), [1, 3]);
});

test('missing role context and malformed targets fail closed instead of broadcasting', () => {
  const f = fixture({ roleId: null });
  assert.equal(f.publisher.publish(1, Buffer.from('none')).delivered, 0);
  assert.equal(f.publisher.publish(1, Buffer.from('bad'), { kind: 'broadcast' }).delivered, 0);
  assert.equal(f.publisher.publish(1, Buffer.from('bad'), { kind: 'guild', guildId: 0 }).delivered, 0);
  assert.equal(f.sent.length, 0);
  assert.deepEqual(f.events.map(event => event.reason), ['target_unavailable', 'target_unavailable', 'target_unavailable']);
});

test('the authenticated current role is the only implicit target', () => {
  const f = fixture({ roleId: 2 });
  assert.deepEqual(f.publisher.publish(900, Buffer.from('mail')), {
    target: { kind: 'role', roleId: 2 }, delivered: 1
  });
  assert.deepEqual(f.sent.map(row => row.connection), [2]);
});
