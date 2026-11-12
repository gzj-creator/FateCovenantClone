import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCodec, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { createFeatureService, openFeatureIds } from '../game/feature-service.mjs';
import { loadFunOpenRules } from '../game/feature-rules.mjs';
import { createLineupAttributeCache } from '../game/attribute-service.mjs';
import { createEventBus, emitRoleLevelUp } from '../game/event-bus.mjs';
import { grantResources } from '../game/resources.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const gameTables = readGameTables();
const heroTables = readHeroTables();
const attributeTables = readAttributeTables();
const CREATED_AT = 1792789200;
const clock = () => (CREATED_AT + 3600) * 1000;

test('domain events run inside the transaction and defer callbacks until commit or drop them on rollback', t => {
  const eventBus = createEventBus({ now: clock });
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-events-', eventBus, now: clock,
    seed: { createdAt: CREATED_AT, role: { level: 9, exp: 0, nick_name: Buffer.from('Events') } }
  });
  const seen = [], seenStoredLevels = [], committed = [];
  eventBus.on('role.levelUp', event => {
    seen.push(event);
    seenStoredLevels.push(fixture.store.read().role.level);
    eventBus.afterCommit(() => committed.push({ level: fixture.store.read().role.level, event }));
  });

  fixture.store.transaction(model => {
    model.role.level = 10;
    assert.equal(eventBus.currentModel(), model);
    emitRoleLevelUp(model, { from: 9, to: 10, levels: [10], source: 'test_commit' });
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].roleId, fixture.store.read().state.roleId);
  assert.equal(seen[0].serverDay, 1);
  assert.equal(seen[0].idempotencyKey.includes('test_commit'), true);
  assert.deepEqual(seenStoredLevels, [9], 'subscribers observe the transaction before it is persisted');
  assert.deepEqual(committed.map(item => item.level), [10]);

  const failRollback = event => {
    if (event.idempotencyKey.includes('test_rollback')) throw new Error('rollback from subscriber');
  };
  eventBus.on('role.levelUp', failRollback);
  assert.throws(() => fixture.store.transaction(model => {
    model.role.level = 11;
    emitRoleLevelUp(model, { from: 10, to: 11, levels: [11], source: 'test_rollback' });
  }), /rollback from subscriber/);
  assert.equal(seen.length, 2, 'the synchronous event still describes the attempted transaction');
  assert.deepEqual(seenStoredLevels, [9, 10], 'a failed transaction is still not persisted when its subscriber runs');
  assert.equal(committed.length, 1, 'a rolled-back event never reaches online subscribers');
  assert.equal(fixture.store.read().role.level, 10);
});

test('a resource experience award opens functions and schedules one targeted 7201 notification after commit', t => {
  const eventBus = createEventBus({ now: clock });
  const fixture = createGameFixture(t, codec, {
    prefix: 'fc-level-events-', eventBus, now: clock,
    seed: { createdAt: CREATED_AT, role: { level: 19, exp: 0, nick_name: Buffer.from('Level Event') } }
  });
  const features = createFeatureService({
    store: fixture.store, codec, rules: loadFunOpenRules(),
    overrides: () => [], context: () => ({})
  });
  const attributeCache = createLineupAttributeCache();
  const firstModel = fixture.store.read();
  attributeCache.get({ model: firstModel, lineupType: 1, heroTables, attributeTables });
  attributeCache.get({ model: firstModel, lineupType: 1, heroTables, attributeTables });
  assert.equal(attributeCache.stats().computed, 1);

  const pushes = [], pushLevels = [], addedFeatures = [], events = [];
  eventBus.on('role.levelUp', event => {
    const model = eventBus.currentModel();
    events.push(event);
    const added = features.reconcileModel(model);
    addedFeatures.push(...added);
    attributeCache.invalidate(event.roleId);
    const notifications = features.onlineNotificationsForIds(added, model);
    eventBus.afterCommit(() => {
      pushLevels.push(fixture.store.read().role.level);
      for (const notification of notifications) pushes.push({ roleId: event.roleId, ...notification });
    });
  });

  const threshold = Number(gameTables.RoleLevel.get(19).reach_exp);
  fixture.store.transaction(model => {
    const modules = new Map(model.state.modules.value);
    modules.set(3, serializedBinary(codec.pack('res_fun_open_login', { target_list: [] })));
    model.state.modules.value = [...modules];
    grantResources(model, [[1140000, threshold]], gameTables);
  });

  assert.equal(fixture.store.read().role.level, 20);
  assert.equal(events.length, 1);
  assert.deepEqual([events[0].from, events[0].to], [19, 20]);
  assert.equal(addedFeatures.includes(1001), true);
  assert.equal(attributeCache.stats().invalidations, 1);
  attributeCache.get({ model: fixture.store.read(), lineupType: 1, heroTables, attributeTables });
  assert.equal(attributeCache.stats().computed, 2);

  fixture.store.transaction(model => {
    const hero = model.heroInfo.hero_list.find(value => String(value.uid) === '2020601');
    assert.ok(hero, 'fixture lineup hero exists');
    hero.level = Number(hero.level ?? 1) + 1;
  });
  attributeCache.get({ model: fixture.store.read(), lineupType: 1, heroTables, attributeTables });
  assert.equal(attributeCache.stats().computed, 3, 'the cache key changes with hero growth state');

  assert.ok(pushes.length >= 1);
  assert.deepEqual(pushLevels, [20], 'online notifications are emitted only after COMMIT');
  assert.equal(pushes.every(push => push.type === 7201 && push.roleId === fixture.store.read().state.roleId), true);
  const notification = codec.unpack('res_notify_fun_open', pushes.find(push => push.targetTid === 1).data);
  assert.equal(Number(notification.target_tid), 1);
  assert.equal(notification.extra_ret_list.length, 1);
  assert.equal(notification.extra_ret_list[0].flag, 1);
  const login = codec.unpack('res_fun_open_login', rawBinary(new Map(fixture.store.state().modules.value).get(3)));
  const target = login.target_list.find(value => Number(value.target_tid) === 1);
  assert.ok(target, `target 1 is present: ${JSON.stringify(login.target_list)}`);
  const authoritative = Buffer.from(target.fun_open_state, 'base64');
  assert.deepEqual(Buffer.from(notification.extra_ret_list[0].data, 'base64'), authoritative);
  assert.equal(openFeatureIds(login).has(1001), true);
});
