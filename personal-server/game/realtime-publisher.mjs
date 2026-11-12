const TARGET_KINDS = new Set(['role', 'guild', 'server']);

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function normalizeTarget(rawTarget, currentRoleId) {
  const target = rawTarget == null
    ? { kind: 'role', roleId: currentRoleId() }
    : rawTarget;
  if (typeof target === 'number' || typeof target === 'string') {
    const roleId = positiveInteger(target);
    return roleId == null ? null : { kind: 'role', roleId };
  }
  if (!target || typeof target !== 'object' || !TARGET_KINDS.has(target.kind)) return null;
  if (target.kind === 'server') return Object.freeze({ kind: 'server' });
  if (target.kind === 'role') {
    const roleId = positiveInteger(target.roleId);
    return roleId == null ? null : Object.freeze({ kind: 'role', roleId });
  }
  const guildId = positiveInteger(target.guildId);
  return guildId == null ? null : Object.freeze({ kind: 'guild', guildId });
}

export function createRealtimePublisher({ subscribers, currentRoleId, guildIdForRole, logger = () => {} }) {
  if (!(subscribers instanceof Map)) throw new TypeError('subscribers must be a Map');
  if (typeof currentRoleId !== 'function') throw new TypeError('currentRoleId must be a function');
  if (typeof guildIdForRole !== 'function') throw new TypeError('guildIdForRole must be a function');

  function publish(type, data, rawTarget) {
    const pushType = positiveInteger(type);
    if (pushType == null || !Buffer.isBuffer(data)) {
      logger({ event: 'realtime_push_skipped', reason: 'invalid_push', pushType: type ?? null });
      return { target: null, delivered: 0 };
    }
    let target;
    try {
      target = normalizeTarget(rawTarget, currentRoleId);
    } catch {
      target = null;
    }
    if (!target) {
      logger({ event: 'realtime_push_skipped', reason: 'target_unavailable', pushType });
      return { target: null, delivered: 0 };
    }

    const recipients = new Set();
    if (target.kind === 'server') {
      for (const group of subscribers.values()) for (const send of group) recipients.add(send);
    } else if (target.kind === 'role') {
      for (const send of subscribers.get(target.roleId) ?? []) recipients.add(send);
    } else {
      for (const [roleId, group] of subscribers) {
        let memberGuildId = null;
        try { memberGuildId = positiveInteger(guildIdForRole(roleId)); } catch {}
        if (memberGuildId !== target.guildId) continue;
        for (const send of group) recipients.add(send);
      }
    }

    let delivered = 0;
    for (const send of recipients) {
      try {
        send(pushType, data);
        delivered++;
      } catch {
        logger({ event: 'realtime_push_failed', pushType, target: target.kind });
      }
    }
    return { target, delivered };
  }

  return { publish };
}
