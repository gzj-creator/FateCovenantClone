import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { readBonusDrawTables } from '../config/bonus-draw-tables.mjs';

// BonusDrawCmd (101901/101902/101904). The reward tables were recovered from
// BonusDrawTable.data.lua (LuaJIT bytecode); the client-side rules come from
// BonusDrawMgr.lua. See agent/workflow/gameplay-completion/DRAW-BONUSDRAW/
// implementation.md for the bytecode hashes, source lines and the remaining gaps.
export const BONUS_DRAW_COMMANDS = Object.freeze({
  draw: 101901,
  switch: 101902,
  choosePool: 101904
});

const TYPE_SMALL = 0;
const TYPE_MID = 1;
const TYPE_BIG = 2;

// The client keeps one pb_bonus_draw record per draw tid:
//   id         BonusDrawTable.BonusDraw tid
//   cur_pool   1-based position inside BonusDraw.pool (BonusDrawMgr:GetCurPoolConfigId
//              indexes BonusDraw.pool[cur_pool]; the .proto comment calls it a pool
//              table tid but the shipped reader is positional)
//   pool_list  one entry per configured pool, id = the same position, award_list
//              holds the drawn Lib tids in draw order
const SCHEMA = `
CREATE TABLE IF NOT EXISTS bonus_draw_state (
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  draw_tid INTEGER NOT NULL,
  cur_pool_index INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(role_id, draw_tid)
);
CREATE TABLE IF NOT EXISTS bonus_draw_pool_awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  draw_tid INTEGER NOT NULL,
  pool_index INTEGER NOT NULL,
  pool_tid INTEGER NOT NULL,
  lib_tid INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bonus_draw_pool_awards_pool_idx
  ON bonus_draw_pool_awards(role_id, draw_tid, pool_index, id);
`;

function fail(code, message) {
  throw new GameError(code, message);
}

function intOf(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(1, 'Invalid ' + label);
  return number;
}

function clampSample(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(0.999999999, number));
}

export function createBonusDrawService({
  store,
  codec,
  tables,
  bonusTables = readBonusDrawTables(),
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect) throw new Error('Bonus draw store is unavailable');
  const log = event => { try { logger(event); } catch {} };
  store.inspect(db => db.exec(SCHEMA));

  function seconds() {
    const value = Number(now());
    if (!Number.isFinite(value) || value < 0) fail(5, 'Bonus draw clock is invalid');
    return Math.floor(value / 1000);
  }

  function iso(at) {
    return new Date(at * 1000).toISOString();
  }

  // Resolves one BonusDraw row plus the Pool/Lib rows it points at. Every id
  // along the chain must exist: an unrecovered or empty mapping fails closed
  // instead of granting a placeholder reward.
  function configuration(drawTid) {
    const id = intOf(drawTid, 'bonus draw id');
    const row = bonusTables.BonusDraw?.get(id);
    if (!row) fail(5, 'Unknown bonus draw');
    const pools = Array.isArray(row.pool) ? row.pool.map(Number) : [];
    if (!pools.length) fail(5, 'Bonus draw has no configured pool');
    const costItem = Number(row.cost_item);
    if (!Number.isSafeInteger(costItem) || costItem <= 0) fail(5, 'Bonus draw cost item is not configured');
    const maxCnt = Number(row.max_cnt);
    if (!Number.isSafeInteger(maxCnt) || maxCnt <= 0) fail(5, 'Bonus draw max count is not configured');
    const resolved = pools.map((poolTid, offset) => {
      const pool = bonusTables.Pool?.get(poolTid);
      if (!pool) fail(5, 'Bonus draw pool ' + poolTid + ' is not configured');
      const libTids = Array.isArray(pool.lib) ? pool.lib.map(Number) : [];
      if (!libTids.length) fail(5, 'Bonus draw pool ' + poolTid + ' has no award rows');
      const libs = libTids.map(libTid => {
        const lib = bonusTables.Lib?.get(libTid);
        if (!lib) fail(5, 'Bonus draw lib ' + libTid + ' is not configured');
        const cnt = Number(lib.cnt);
        if (!Number.isSafeInteger(cnt) || cnt <= 0) fail(5, 'Bonus draw lib ' + libTid + ' has an invalid count');
        const award = Array.isArray(lib.award) && Array.isArray(lib.award[0]) ? lib.award[0] : null;
        const awardTid = Number(award?.[0]);
        const awardNum = Number(award?.[1]);
        if (!Number.isSafeInteger(awardTid) || awardTid <= 0 || !Number.isSafeInteger(awardNum) || awardNum <= 0) {
          fail(5, 'Bonus draw lib ' + libTid + ' has an invalid award');
        }
        const type = Number(lib.type);
        if (![TYPE_SMALL, TYPE_MID, TYPE_BIG].includes(type)) fail(5, 'Bonus draw lib ' + libTid + ' has an unknown type');
        return { tid: libTid, type, cnt, awardTid, awardNum };
      });
      return { index: offset + 1, tid: poolTid, libs };
    });
    return { id, row, pools: resolved, costItem, maxCnt };
  }

  function stateRow(db, roleId, drawTid, at) {
    const row = db.prepare('SELECT * FROM bonus_draw_state WHERE role_id=? AND draw_tid=?').get(roleId, drawTid);
    if (row) return { ...row };
    const stamp = iso(at);
    return { role_id: Number(roleId), draw_tid: Number(drawTid), cur_pool_index: 1, created_at: stamp, updated_at: stamp };
  }

  function saveState(db, state, at) {
    db.prepare(`INSERT INTO bonus_draw_state (role_id,draw_tid,cur_pool_index,created_at,updated_at)
      VALUES (?,?,?,?,?)
      ON CONFLICT(role_id,draw_tid) DO UPDATE SET
        cur_pool_index=excluded.cur_pool_index,
        updated_at=excluded.updated_at`).run(
      Number(state.role_id), Number(state.draw_tid), Number(state.cur_pool_index), state.created_at, iso(at)
    );
  }

  function poolIndex(config, state) {
    const index = Number(state.cur_pool_index);
    if (!Number.isSafeInteger(index) || index < 1 || index > config.pools.length) {
      fail(5, 'Bonus draw current pool is not configured');
    }
    return index;
  }

  function drawnTids(db, roleId, drawTid, index) {
    return db.prepare('SELECT lib_tid FROM bonus_draw_pool_awards WHERE role_id=? AND draw_tid=? AND pool_index=? ORDER BY id')
      .all(roleId, drawTid, index).map(row => Number(row.lib_tid));
  }

  function poolRecord(db, roleId, config, pool) {
    return { id: pool.index, award_list: drawnTids(db, roleId, config.id, pool.index) };
  }

  // pb_bonus_draw is the record the client stores per draw tid; every response
  // returns the whole thing so the client replaces its copy atomically.
  function drawRecord(db, roleId, config, state) {
    return {
      id: config.id,
      cur_pool: poolIndex(config, state),
      end_sec: '0',
      pool_list: config.pools.map(pool => poolRecord(db, roleId, config, pool))
    };
  }

  function remainingOf(pool, drawnList) {
    const drawn = new Map();
    for (const tid of drawnList) drawn.set(tid, (drawn.get(tid) ?? 0) + 1);
    return pool.libs.map(lib => ({
      lib,
      left: Math.max(0, lib.cnt - (drawn.get(lib.tid) ?? 0))
    }));
  }

  function pickWeighted(remaining, total) {
    let roll = clampSample(random()) * total;
    for (const entry of remaining) {
      if (entry.left <= 0) continue;
      roll -= entry.left;
      if (roll < 0) return entry;
    }
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (remaining[index].left > 0) return remaining[index];
    }
    return null;
  }

  function bigAwardState(pool, drawnList) {
    const big = pool.libs.find(lib => lib.type === TYPE_BIG);
    if (!big) return { configured: false, got: false };
    const count = drawnList.reduce((sum, tid) => sum + (tid === big.tid ? 1 : 0), 0);
    return { configured: true, got: count >= big.cnt, tid: big.tid, cnt: big.cnt, drawn: count };
  }

  function recordDrawn(db, roleId, drawTid, index, poolTid, libTid, at) {
    db.prepare('INSERT INTO bonus_draw_pool_awards (role_id,draw_tid,pool_index,pool_tid,lib_tid,created_at) VALUES (?,?,?,?,?,?)')
      .run(roleId, drawTid, index, poolTid, libTid, iso(at));
  }

  function drawCommand(request) {
    const config = configuration(request.id);
    const num = Number(request.num);
    if (!Number.isSafeInteger(num) || num < 1) fail(1, 'Invalid bonus draw count');
    if (num > config.maxCnt) fail(1, 'Bonus draw count exceeds the configured maximum');
    const stopOnBig = request.stop === true;
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, config.id, at);
      const index = poolIndex(config, state);
      const pool = config.pools[index - 1];
      const drawnList = drawnTids(db, roleId, config.id, index);
      const remaining = remainingOf(pool, drawnList);
      const available = remaining.reduce((sum, entry) => sum + entry.left, 0);
      if (!available) fail(312, 'Bonus draw pool is exhausted');
      if (num > available) fail(313, 'Bonus draw pool does not have enough remaining awards');

      const awards = [];
      const drawn = [];
      let total = available;
      for (let step = 0; step < num; step += 1) {
        const entry = pickWeighted(remaining, total);
        if (!entry || entry.left <= 0) fail(312, 'Bonus draw pool is exhausted');
        entry.left -= 1;
        total -= 1;
        drawn.push(entry.lib.tid);
        awards.push([entry.lib.awardTid, entry.lib.awardNum]);
        if (stopOnBig && entry.lib.type === TYPE_BIG) break;
      }

      const spent = consumeResources(model, [[config.costItem, drawn.length]], 301);
      for (const libTid of drawn) recordDrawn(db, roleId, config.id, index, pool.tid, libTid, at);
      const granted = grantResources(model, awards, tables);
      const after = drawnTids(db, roleId, config.id, index);
      const big = bigAwardState(pool, after);
      saveState(db, state, at);
      const value = {
        res: { changes: [...spent.changes, ...granted.changes], is_overflow: false },
        bonus_draw: drawRecord(db, roleId, config, state)
      };
      return {
        value,
        data: codec.pack('pb_bonus_draw_back', value),
        drawTid: config.id, poolIndex: index, poolTid: pool.tid,
        draws: drawn.length, libTids: drawn, bigGot: big.got, changes: value.res.changes.length
      };
    });
    result.valueForLog = {
      drawTid: result.drawTid, poolIndex: result.poolIndex, poolTid: result.poolTid,
      draws: result.draws, bigGot: result.bigGot, changes: result.changes
    };
    log({ event: 'bonus_draw_committed', ...result.valueForLog });
    return result;
  }

  // 101902 switches to the next configured pool of the same draw. The client
  // only sends its current draw tid and decodes the reply as ETF (Cmd.c2s_back
  // has no protobuf schema for this type), so the authoritative position is
  // returned as an Erlang map with a cur_pool field.
  function switchCommand(drawTid) {
    const config = configuration(drawTid);
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, config.id, at);
      const current = poolIndex(config, state);
      const next = current >= config.pools.length ? 1 : current + 1;
      if (config.pools.length < 2) fail(5, 'Bonus draw has a single configured pool');
      state.cur_pool_index = next;
      saveState(db, state, at);
      const pool = config.pools[next - 1];
      const drawnList = drawnTids(db, roleId, config.id, next);
      return {
        value: { id: config.id, cur_pool: next },
        poolTid: pool.tid,
        bigGot: bigAwardState(pool, drawnList).got,
        from: current, to: next
      };
    });
    result.valueForLog = { drawTid: config.id, from: result.from, to: result.to, poolTid: result.poolTid, bigGot: result.bigGot };
    log({ event: 'bonus_draw_switched', ...result.valueForLog });
    return result;
  }

  function choosePoolCommand(request) {
    const config = configuration(request.version);
    const poolTid = intOf(request.pool_id, 'bonus draw pool id');
    const target = config.pools.find(pool => pool.tid === poolTid);
    if (!target) fail(1, 'Bonus draw pool is not configured for this draw');
    const at = seconds();
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId, config.id, at);
      const current = poolIndex(config, state);
      if (current === target.index) fail(310, 'Bonus draw pool is already selected');
      state.cur_pool_index = target.index;
      saveState(db, state, at);
      const value = drawRecord(db, roleId, config, state);
      return {
        value,
        data: codec.pack('pb_bonus_draw', value),
        drawTid: config.id, poolIndex: target.index, poolTid: target.tid, from: current
      };
    });
    result.valueForLog = { drawTid: result.drawTid, from: result.from, poolIndex: result.poolIndex, poolTid: result.poolTid };
    log({ event: 'bonus_draw_pool_selected', ...result.valueForLog });
    return result;
  }

  function decode(type, bytes) {
    const schema = ({ 101901: 'pb_bonus_draw_req', 101904: 'pb_bonus_draw_choose_pool' })[Number(type)];
    if (!schema) fail(1, 'Unknown bonus draw command');
    try {
      return codec.unpack(schema, bytes ?? Buffer.alloc(0));
    } catch {
      fail(1, 'Invalid bonus draw request');
    }
  }

  // Read-only snapshot used by tests and by any future login slot wiring.
  function loginPayload(at = seconds()) {
    const records = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const list = [];
      for (const drawTid of [...(bonusTables.BonusDraw?.keys() ?? [])]) {
        let config;
        try {
          config = configuration(drawTid);
        } catch {
          continue;
        }
        const state = stateRow(db, roleId, config.id, at);
        list.push(drawRecord(db, roleId, config, state));
      }
      return list;
    });
    return codec.pack('pb_bonus_draw_all', { list: records });
  }

  return {
    supports: type => Object.values(BONUS_DRAW_COMMANDS).includes(Number(type)),
    decode,
    execute(type, request) {
      switch (Number(type)) {
        case BONUS_DRAW_COMMANDS.draw: return drawCommand(request);
        case BONUS_DRAW_COMMANDS.switch: return switchCommand(request);
        case BONUS_DRAW_COMMANDS.choosePool: return choosePoolCommand(request);
        default: return fail(1, 'Unknown bonus draw command');
      }
    },
    loginPayload,
    commands: BONUS_DRAW_COMMANDS
  };
}

