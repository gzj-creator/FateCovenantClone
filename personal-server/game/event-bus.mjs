import { serverDay } from './time.mjs';

const MODEL_EVENT_BUS = Symbol('fateCovenantEventBus');

function errorMessage(error) {
  return String(error?.message ?? error);
}

/**
 * Synchronous domain-event bus owned by the SQLite transaction boundary.
 * Subscribers run before COMMIT; deferred callbacks run only after COMMIT and
 * are discarded on rollback so no online state can claim an uncommitted write.
 */
export function createEventBus({ now = Date.now, logger = () => {} } = {}) {
  const handlers = new Map();
  const scopes = [];
  const currentScope = () => scopes.at(-1) ?? null;

  function on(type, handler) {
    if (typeof type !== 'string' || !type || typeof handler !== 'function') {
      throw new TypeError('Event type and handler are required');
    }
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(handler);
    return () => handlers.get(type)?.delete(handler);
  }

  function begin(model) {
    if (!model || typeof model !== 'object') throw new TypeError('An event transaction requires a role model');
    if (scopes.length) throw new Error('Nested game event transactions are not supported');
    const scope = { model, pending: [], events: [], deferred: [], state: 'active' };
    scopes.push(scope);
    Object.defineProperty(model, MODEL_EVENT_BUS, {
      configurable: true,
      enumerable: false,
      value: api
    });
    return scope;
  }

  function assertScope(scope) {
    if (!scope || currentScope() !== scope || scope.state !== 'active') {
      throw new Error('Event transaction is not active');
    }
  }

  function enqueue(type, payload = {}) {
    const scope = currentScope();
    if (!scope) throw new Error('Domain events must be emitted inside a game transaction');
    assertScope(scope);
    if (typeof type !== 'string' || !type) throw new TypeError('Event type is required');
    scope.pending.push({ type, payload });
    return scope.pending.length;
  }

  function dispatch(type, payload) {
    const scope = currentScope();
    assertScope(scope);
    const roleId = Number(payload.roleId ?? scope.model.state?.roleId);
    if (!Number.isSafeInteger(roleId) || roleId <= 0) throw new Error('Domain event roleId is invalid');
    const at = Number(now());
    const openedAt = Number(payload.serverOpenedAt ?? scope.model.state?.serverOpenedAt);
    const event = Object.freeze({
      ...payload,
      type,
      roleId,
      serverDay: payload.serverDay ?? (openedAt > 0 ? serverDay(openedAt, at) : null),
      source: payload.source ?? null,
      idempotencyKey: payload.idempotencyKey ?? null
    });
    scope.events.push(event);
    for (const handler of handlers.get(type) ?? []) handler(event);
    return event;
  }

  // Events are queued while a service is still mutating the shared model. They
  // are synchronously delivered after the action returns but before writeModel
  // and COMMIT, so a subscriber cannot have its module writes overwritten by a
  // resource function that finishes later in the same command.
  function flush(scope) {
    assertScope(scope);
    while (scope.pending.length) {
      const { type, payload } = scope.pending.shift();
      dispatch(type, payload);
    }
  }

  function afterCommit(callback) {
    const scope = currentScope();
    if (!scope) throw new Error('Post-commit callbacks must be registered inside a game transaction');
    assertScope(scope);
    if (typeof callback !== 'function') throw new TypeError('Post-commit callback is required');
    scope.deferred.push(callback);
  }

  function commit(scope) {
    assertScope(scope);
    scope.state = 'committed';
    scopes.pop();
    const callbacks = scope.deferred.splice(0);
    for (const callback of callbacks) {
      try { callback(); } catch (error) {
        try { logger({ event: 'domain_event_after_commit_failed', message: errorMessage(error) }); } catch {}
      }
    }
  }

  function abort(scope) {
    if (!scope || currentScope() !== scope) return;
    scope.state = 'aborted';
    scope.deferred.length = 0;
    scopes.pop();
  }

  function modelForCurrentEvent() {
    return currentScope()?.model ?? null;
  }

  const api = {
    on,
    begin,
    commit,
    abort,
    emit: enqueue,
    enqueue,
    flush,
    afterCommit,
    currentModel: modelForCurrentEvent,
    currentEvents: () => currentScope()?.events.slice() ?? []
  };
  return api;
}

export function eventBusForModel(model) {
  return model?.[MODEL_EVENT_BUS] ?? null;
}

export function emitModelEvent(model, type, payload = {}) {
  const bus = eventBusForModel(model);
  if (!bus) return null;
  return bus.enqueue(type, payload);
}

export function emitRoleLevelUp(model, levelEvent) {
  const roleId = Number(model?.state?.roleId);
  const from = Number(levelEvent?.from);
  const to = Number(levelEvent?.to);
  if (!Number.isSafeInteger(roleId) || roleId <= 0
      || !Number.isSafeInteger(from) || from < 1
      || !Number.isSafeInteger(to) || to <= from) {
    throw new Error('Role level-up event is invalid');
  }
  return emitModelEvent(model, 'role.levelUp', {
    roleId,
    from,
    to,
    levels: Array.isArray(levelEvent.levels) ? [...levelEvent.levels] : [to],
    source: String(levelEvent.source ?? 'unknown'),
    idempotencyKey: `role.levelUp:${roleId}:${from}:${to}:${String(levelEvent.source ?? 'unknown')}`
  });
}
