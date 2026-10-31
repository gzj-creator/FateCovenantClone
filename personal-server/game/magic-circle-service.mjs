import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';

export const MAGIC_CIRCLE_MODULE = 157;
export const MAGIC_CIRCLE_COMMANDS = Object.freeze({
  STAR_UP: 90401,
  LEVEL_UP: 90402,
  BREAK_UP: 90403,
  ACTIVE_POINT: 90404,
  RESET: 90405
});

const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max, message) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, message);
  return number;
};

function normalizedPoints(value, maximum) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(5, 'Magic-circle points are invalid');
  const points = value.map(point => Number(point));
  if (points.some(point => !Number.isSafeInteger(point) || point < 1 || point > maximum)) {
    fail(5, 'Magic-circle points are outside the configured range');
  }
  if (new Set(points).size !== points.length) fail(5, 'Magic-circle points contain duplicates');
  return points.sort((left, right) => left - right);
}

function normalizeRole(value, tables) {
  const rows = value?.magic_circle ?? [];
  if (!Array.isArray(rows)) fail(5, 'Magic-circle login payload is invalid');
  const constant = tables.constant;
  const maxLevel = Number(constant.max_level);
  const maxStar = Number(constant.max_star);
  const maxPoints = Number(constant.max_point_count);
  const seen = new Set();
  const byId = new Map();
  for (const row of rows) {
    const id = Number(row?.id);
    if (!tables.circleIds.includes(id)) fail(5, 'Magic-circle id is outside the configured range');
    if (seen.has(id)) fail(5, 'Magic-circle login payload contains duplicate ids');
    seen.add(id);
    const level = Number(row.level ?? 0), star = Number(row.star ?? 0), breakLevel = Number(row.break_level ?? 0);
    if (!Number.isSafeInteger(level) || level < 0 || level > maxLevel) fail(5, 'Magic-circle level state is invalid');
    if (!Number.isSafeInteger(star) || star < 0 || star > maxStar) fail(5, 'Magic-circle star state is invalid');
    if (!Number.isSafeInteger(breakLevel) || breakLevel < 0 || breakLevel > maxStar) fail(5, 'Magic-circle breakthrough state is invalid');
    const lastResetTime = Number(row.last_reset_time ?? 0);
    if (!Number.isSafeInteger(lastResetTime) || lastResetTime < 0) fail(5, 'Magic-circle reset time is invalid');
    byId.set(id, {
      id,
      level,
      star,
      break_level: breakLevel,
      points: normalizedPoints(row.points, maxPoints),
      last_reset_time: lastResetTime
    });
  }
  return {
    magic_circle: tables.circleIds.map(id => byId.get(id) ?? {
      id,
      level: 0,
      star: 0,
      break_level: 0,
      points: [],
      last_reset_time: 0
    })
  };
}

function costPairs(value, label) {
  if (!Array.isArray(value) || value.length === 0) fail(5, `${label} cost is not configured`);
  return value.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) fail(5, `${label} cost is invalid`);
    const tid = Number(pair[0]), count = Number(pair[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      fail(5, `${label} cost is invalid`);
    }
    return [tid, count];
  });
}

function response(codec, state, changes, extra = {}) {
  const value = {
    magic_circles: state.magic_circle.map(circle => ({ ...circle, points: [...circle.points] })),
    res_change: { changes, is_overflow: false }
  };
  return { value, data: codec.pack('pb_magic_circle_rsp', value), valueForLog: extra };
}

function modulePayloadBytes(module) {
  if (!module) return null;
  if (Array.isArray(module.value)) {
    if (module.value.length === 0) return null;
    if (module.value.length !== 1) fail(5, 'Magic-circle login module has an unexpected number of slots');
    return rawBinary(module.value[0]);
  }
  return rawBinary(module);
}

export function createMagicCircleService({ store, codec, tables, now = Date.now }) {
  const constant = tables.constant;
  const maxLevel = Number(constant.max_level);
  const maxStar = Number(constant.max_star);
  const maxPoints = Number(constant.max_point_count);
  const breakInterval = Number(constant.break_level_interval);
  const levelUpItem = Number(constant.level_up_item);

  function readState(model, modules) {
    const module = modules.get(MAGIC_CIRCLE_MODULE);
    let bytes;
    try { bytes = modulePayloadBytes(module); }
    catch { fail(5, 'Magic-circle login module is invalid'); }
    if (!bytes?.length) return normalizeRole(undefined, tables);
    let value;
    try { value = codec.unpack('pb_magic_circle_role', bytes); }
    catch { fail(5, 'Magic-circle login payload cannot be decoded'); }
    return normalizeRole(value, tables);
  }

  function writeState(model, modules, state) {
    // The captured client shape for module 157 is a one-slot Erlang list.
    // Keep that envelope so LoginParse receives the same data shape as the
    // original server even though newer local modules use a bare binary.
    modules.set(MAGIC_CIRCLE_MODULE, { value: [serializedBinary(codec.pack('pb_magic_circle_role', state))], improper: false });
    model.state.modules.value = [...modules];
  }

  function circleOf(state, id) {
    const circle = state.magic_circle.find(value => value.id === id);
    if (!circle) fail(5, 'Magic-circle configuration is missing');
    return circle;
  }

  function levelRow(circle) {
    const row = tables.levels.get(circle.id * 1000 + circle.level);
    if (!row) fail(5, 'Magic-circle level configuration is missing');
    return row;
  }

  function pointRow(circle, point) {
    const current = levelRow(circle);
    const row = tables.points.get(point * 1000 + Number(current.point_level));
    if (!row) fail(5, 'Magic-circle point configuration is missing');
    return row;
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      let existed = false;
      try { existed = Boolean(modulePayloadBytes(modules.get(MAGIC_CIRCLE_MODULE))?.length); }
      catch { /* The decode below reports the malformed payload. */ }
      const state = readState(model, modules);
      writeState(model, modules, state);
      return { created: !existed, circleCount: state.magic_circle.length };
    });
  }

  function run(type, id, action) {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const state = readState(model, modules);
      const circle = circleOf(state, id);
      const result = action(model, circle, state);
      writeState(model, modules, state);
      return response(codec, state, result.changes, { circleId: id, action: type, ...result.log });
    });
  }

  function levelUp(request) {
    const id = integer(request?.id, 1, tables.circleIds.length, 'Invalid magic-circle id');
    const requested = Number(request?.target_level ?? 0);
    // target_level is deprecated in the recovered schema. The UI sends one
    // level for a normal tap; multi-level long-press semantics are unproven.
    if (!Number.isSafeInteger(requested) || (requested !== 0 && requested !== 1)) {
      fail(1, 'Multi-level magic-circle upgrades are not implemented');
    }
    return run(MAGIC_CIRCLE_COMMANDS.LEVEL_UP, id, (model, circle) => {
      if (circle.level >= maxLevel) fail(5, 'Magic circle is at maximum level');
      if (circle.break_level < maxStar && Math.floor(circle.level / breakInterval) > circle.break_level) {
        fail(5, 'Magic circle breakthrough is required before level up');
      }
      const row = tables.levels.get(circle.id * 1000 + circle.level + 1);
      if (!row) fail(5, 'Magic-circle next-level configuration is missing');
      const cost = Number(row.cost_num);
      if (!Number.isSafeInteger(cost) || cost < 0) fail(5, 'Magic-circle level cost is invalid');
      const res = consumeResources(model, cost ? [[levelUpItem, cost]] : [], 301);
      circle.level += 1;
      return { changes: res.changes, log: { level: circle.level, cost } };
    });
  }

  function breakUp(id) {
    return run(MAGIC_CIRCLE_COMMANDS.BREAK_UP, id, (model, circle) => {
      if (circle.break_level >= maxStar) fail(5, 'Magic circle is at maximum breakthrough');
      const gate = (circle.break_level + 1) * breakInterval;
      if (circle.level < gate) fail(5, 'Magic-circle level is too low for breakthrough');
      const row = tables.breaks.get(circle.id * 1000 + circle.break_level + 1);
      if (!row) fail(5, 'Magic-circle breakthrough configuration is missing');
      const res = consumeResources(model, costPairs(row.cost, 'Magic-circle breakthrough'), 301);
      circle.break_level += 1;
      return { changes: res.changes, log: { breakLevel: circle.break_level, gate } };
    });
  }

  function starUp(id) {
    return run(MAGIC_CIRCLE_COMMANDS.STAR_UP, id, (model, circle) => {
      if (circle.star >= maxStar) fail(5, 'Magic circle is at maximum star');
      const row = tables.stars.get(circle.id * 1000 + circle.star + 1);
      if (!row) fail(5, 'Magic-circle star configuration is missing');
      const res = consumeResources(model, costPairs(row.cost, 'Magic-circle star'), 301);
      circle.star += 1;
      return { changes: res.changes, log: { star: circle.star } };
    });
  }

  function activePoint(request) {
    const id = integer(request?.id, 1, tables.circleIds.length, 'Invalid magic-circle id');
    if (!Array.isArray(request?.points) || request.points.length === 0) fail(1, 'Magic-circle point selection is empty');
    const points = request.points.map(point => integer(point, 1, maxPoints, 'Invalid magic-circle point'));
    if (new Set(points).size !== points.length) fail(1, 'Magic-circle point selection contains duplicates');
    points.sort((left, right) => left - right);
    return run(MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT, id, (model, circle) => {
      for (const point of points) if (circle.points.includes(point)) fail(310, 'Magic-circle point is already active');
      if (new Set([...circle.points, ...points]).size > maxPoints) fail(5, 'Magic-circle point limit reached');
      const costs = points.flatMap(point => costPairs(pointRow(circle, point).consume_list, 'Magic-circle point'));
      const res = consumeResources(model, costs, 301);
      circle.points = [...circle.points, ...points].sort((left, right) => left - right);
      return { changes: res.changes, log: { points: [...circle.points] } };
    });
  }

  function reset(id) {
    return run(MAGIC_CIRCLE_COMMANDS.RESET, id, (model, circle) => {
      if (circle.points.length === 0) fail(1, 'Magic circle has no active points to reset');
      const current = Math.floor(Number(now()) / 1000);
      if (!Number.isSafeInteger(current) || current < 0) fail(5, 'Magic-circle clock is invalid');
      const config = tables.circles.get(circle.id);
      const interval = Number(config?.reset_interval_time);
      if (!Number.isSafeInteger(interval) || interval <= 0) fail(5, 'Magic-circle reset interval is invalid');
      if (circle.last_reset_time > 0 && current - circle.last_reset_time < interval) {
        fail(311, 'Magic-circle reset cooldown has not elapsed');
      }
      // Reset returns no resource changes. The client parses res_change, but the
      // original refund ratio and per-point activation history are unproven.
      circle.points = [];
      circle.last_reset_time = current;
      return { changes: [], log: { nextResetAt: current + interval } };
    });
  }

  return {
    ensureLoginState,
    supports: type => Object.values(MAGIC_CIRCLE_COMMANDS).includes(Number(type)),
    execute(type, input) {
      switch (Number(type)) {
        case MAGIC_CIRCLE_COMMANDS.STAR_UP:
          return starUp(integer(input?.id ?? input, 1, tables.circleIds.length, 'Invalid magic-circle id'));
        case MAGIC_CIRCLE_COMMANDS.LEVEL_UP: return levelUp(input);
        case MAGIC_CIRCLE_COMMANDS.BREAK_UP:
          return breakUp(integer(input?.id ?? input, 1, tables.circleIds.length, 'Invalid magic-circle id'));
        case MAGIC_CIRCLE_COMMANDS.ACTIVE_POINT: return activePoint(input);
        case MAGIC_CIRCLE_COMMANDS.RESET:
          return reset(integer(input?.id ?? input, 1, tables.circleIds.length, 'Invalid magic-circle id'));
        default: fail(1, 'Invalid magic-circle command');
      }
    }
  };
}
