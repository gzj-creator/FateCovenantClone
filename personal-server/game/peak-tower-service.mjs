import { GameError } from './hero-progression.mjs';
import { encodeEtfIntegerTuple } from '../protocol/game-codec.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import {
  peakTowerLayer,
  peakTowerLayerAwards,
  peakTowerMaxLayer,
  peakTowerTypeAwards,
  readPeakTowerTables
} from '../config/peak-tower-tables.mjs';
import { grantResources, consumeResources } from './resources.mjs';
import { BATTLE_RESULT } from './battle-engine.mjs';
import { hasBit, setBit } from './bit-block.mjs';

// PeakTowerCmd: 1103 sweeps, 1104 every_award, 1109 buy_goods,
// 1110 receive_achievement, 1111 rev_tower_award, 1112 avg_layer.
const COMMAND_SWEEPS = 1103;
const COMMAND_EVERY_AWARD = 1104;
const COMMAND_BUY_GOODS = 1109;
const COMMAND_RECEIVE_ACHIEVEMENT = 1110;
const COMMAND_REV_TOWER_AWARD = 1111;
const COMMAND_AVG_LAYER = 1112;
const SUPPORTED = [COMMAND_SWEEPS, COMMAND_EVERY_AWARD, COMMAND_BUY_GOODS, COMMAND_RECEIVE_ACHIEVEMENT, COMMAND_REV_TOWER_AWARD, COMMAND_AVG_LAYER];

const CLAIM_LAYER = 'peak_tower_layer';
const CLAIM_ACHIEVEMENT = 'peak_tower_achievement';
const CLAIM_TOWER = 'peak_tower_tower';
const CLAIM_SWEEP = 'peak_tower_sweep';
const CLAIM_CHALLENGE = 'peak_tower_challenge';

const CODE_INVALID = 1;
const CODE_LIMIT = 3;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;

function fail(code, message) { throw new GameError(code, message); }

function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

function dayKey(milliseconds) {
  return new Date(milliseconds).toISOString().slice(0, 10);
}

function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

function ensureTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS peak_tower_state (
    role_id INTEGER PRIMARY KEY,
    layer INTEGER NOT NULL,
    max_layer INTEGER NOT NULL,
    max_layer_time TEXT NOT NULL,
    award_time TEXT NOT NULL,
    buy_goods TEXT NOT NULL,
    sweep_day TEXT NOT NULL,
    sweep_used INTEGER NOT NULL,
    tower_award TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS peak_tower_claims (
    role_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL,
    claim_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, claim_type, claim_key)
  )`);
}

function readState(db, roleId, nowMs) {
  const row = db.prepare('SELECT * FROM peak_tower_state WHERE role_id=?').get(roleId);
  if (!row) {
    return {
      roleId,
      layer: 0,
      maxLayer: 0,
      maxLayerTime: isoSeconds(nowMs),
      awardTime: isoSeconds(0),
      buyGoods: [],
      sweepDay: dayKey(nowMs),
      sweepUsed: 0,
      towerAward: Buffer.alloc(0),
      exists: false
    };
  }
  let buyGoods = [];
  try { buyGoods = JSON.parse(row.buy_goods || '[]'); } catch { buyGoods = []; }
  let towerAward = Buffer.alloc(0);
  try { towerAward = row.tower_award ? Buffer.from(row.tower_award, 'hex') : Buffer.alloc(0); } catch { towerAward = Buffer.alloc(0); }
  const sweepDay = row.sweep_day || dayKey(nowMs);
  return {
    roleId,
    layer: Number(row.layer ?? 0),
    maxLayer: Number(row.max_layer ?? 0),
    maxLayerTime: row.max_layer_time ?? isoSeconds(nowMs),
    awardTime: row.award_time ?? isoSeconds(0),
    buyGoods: Array.isArray(buyGoods) ? buyGoods.map(Number).filter(Number.isSafeInteger) : [],
    sweepDay,
    sweepUsed: sweepDay === dayKey(nowMs) ? Number(row.sweep_used ?? 0) : 0,
    towerAward,
    exists: true
  };
}

function writeState(db, state, nowMs) {
  const updatedAt = isoSeconds(nowMs);
  db.prepare(`INSERT INTO peak_tower_state
    (role_id, layer, max_layer, max_layer_time, award_time, buy_goods, sweep_day, sweep_used, tower_award, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(role_id) DO UPDATE SET
      layer=excluded.layer,
      max_layer=excluded.max_layer,
      max_layer_time=excluded.max_layer_time,
      award_time=excluded.award_time,
      buy_goods=excluded.buy_goods,
      sweep_day=excluded.sweep_day,
      sweep_used=excluded.sweep_used,
      tower_award=excluded.tower_award,
      updated_at=excluded.updated_at`)
    .run(
      state.roleId,
      state.layer,
      state.maxLayer,
      state.maxLayerTime,
      state.awardTime,
      JSON.stringify(state.buyGoods),
      state.sweepDay,
      state.sweepUsed,
      state.towerAward.toString('hex'),
      updatedAt
    );
}

function claimed(db, roleId, type, key) {
  return !!db.prepare('SELECT 1 FROM peak_tower_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(roleId, type, key);
}

function recordClaim(db, roleId, type, key, createdAt) {
  db.prepare('INSERT INTO peak_tower_claims VALUES (?,?,?,?)').run(roleId, type, key, createdAt);
}

export function createPeakTowerService({
  store,
  codec,
  tables = readPeakTowerTables(),
  gameTables = null,
  now = Date.now,
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  const resourceTables = () => gameTables ?? readGameTables();

  if (!tables?.layers?.size) throw new Error('Peak tower configuration is unavailable');
  const maxConfigLayer = peakTowerMaxLayer(tables);

  // Sweep depth is capped by PeakTowerTable.Global.fast_harvest_layer (140) and the
  // daily sweep counter by Global.rapid_fighting (10). Both values come from the
  // client configuration; the field names and values are recorded in the delivery note.
  const sweepDepthLimit = Math.max(1, Number(tables.global?.fast_harvest_layer ?? 1));
  const dailySweepLimit = Math.max(1, Number(tables.global?.rapid_fighting ?? 1));

  function dataOf(state) {
    return {
      layer: state.layer,
      award_time: Math.floor(new Date(state.awardTime).getTime() / 1000),
      max_layer_time: Math.floor(new Date(state.maxLayerTime).getTime() / 1000),
      max_layer: state.maxLayer,
      layer_change_time: Math.floor(new Date(state.maxLayerTime).getTime() / 1000),
      buy_goods: state.buyGoods,
      count_limit: { flush_time: Math.floor(now() / 1000) + 86400, count: Math.max(0, dailySweepLimit - state.sweepUsed) },
      tower_award: state.towerAward
    };
  }

  function back(state, changes) {
    return {
      peak_tower_data: dataOf(state),
      res: { changes: changes ?? [], is_overflow: false }
    };
  }

  function resPacket(changes) {
    return { changes: changes ?? [], is_overflow: false };
  }

  function supports(type) { return SUPPORTED.includes(type); }

  function requireLayerCleared(state, layer) {
    if (state.layer < layer) fail(CODE_STATE, 'Peak tower layer is not unlocked');
  }

  // Rewards of already cleared layers. Every layer reward is granted once and tracked in
  // peak_tower_claims, so a repeated claim cannot grant the same layer twice.
  async function everyAward() {
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      if (state.layer <= 0) fail(CODE_STATE, 'Peak tower layer is not unlocked');
      const createdAt = isoSeconds(nowMs);
      const pending = [];
      for (let layer = 1; layer <= state.layer; layer += 1) {
        if (claimed(db, model.state.roleId, CLAIM_LAYER, String(layer))) continue;
        const row = peakTowerLayer(tables, layer);
        if (!row) continue;
        const awards = peakTowerLayerAwards(row);
        if (!awards.length) fail(CODE_STATE, 'Peak tower layer reward configuration is missing: ' + layer);
        pending.push({ layer, awards });
      }
      if (!pending.length) fail(CODE_LIMIT, 'Peak tower layer awards are already claimed');
      const awards = pending.flatMap(entry => entry.awards);
      const reward = grantResources(model, awards, resourceTables());
      for (const entry of pending) recordClaim(db, model.state.roleId, CLAIM_LAYER, String(entry.layer), createdAt);
      state.awardTime = isoSeconds(nowMs);
      writeState(db, state, nowMs);
      log({ event: 'peak_tower_every_award_committed', layers: pending.length, changes: reward.changes.length });
      return {
        value: { layers: pending.map(entry => entry.layer), changes: reward.changes, layer: state.layer },
        data: codec.pack('peak_tower_back', back(state, reward.changes))
      };
    });
  }

  async function sweeps(input) {
    // peak_tower_sweeps_req.sweeps_layer is the layer to sweep. Only a layer that was already
    // cleared can be swept, and the same layer can be swept once per day.
    const requested = integer(input?.sweeps_layer ?? (Array.isArray(input) ? input[0] : input), 1, maxConfigLayer, 'Invalid peak tower sweep layer');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      if (state.layer <= 0) fail(CODE_STATE, 'Peak tower layer is not unlocked');
      requireLayerCleared(state, requested);
      if (requested > sweepDepthLimit) fail(CODE_LIMIT, 'Peak tower sweep depth exceeds the configured fast harvest layer');
      if (state.sweepUsed + 1 > dailySweepLimit) fail(CODE_LIMIT, 'Peak tower sweep count is insufficient');
      const today = dayKey(nowMs);
      const claimKey = today + ':' + requested;
      if (claimed(db, model.state.roleId, CLAIM_SWEEP, claimKey)) fail(CODE_LIMIT, 'Peak tower sweep request was already settled');
      const row = peakTowerLayer(tables, requested);
      if (!row) fail(CODE_STATE, 'Peak tower layer configuration is missing: ' + requested);
      const awards = peakTowerLayerAwards(row);
      if (!awards.length) fail(CODE_STATE, 'Peak tower layer reward configuration is empty');
      const reward = grantResources(model, awards, resourceTables());
      recordClaim(db, model.state.roleId, CLAIM_SWEEP, claimKey, isoSeconds(nowMs));
      state.sweepDay = today;
      state.sweepUsed += 1;
      writeState(db, state, nowMs);
      log({ event: 'peak_tower_sweeps_committed', layer: requested, changes: reward.changes.length });
      return {
        value: { sweepsLayer: requested, layers: [requested, requested], changes: reward.changes },
        data: codec.pack('peak_tower_sweep_back', { peak_tower_back: back(state, reward.changes) })
      };
    });
  }

  async function buyGoods(input) {
    const raw = Array.isArray(input) ? input[0] : (input && typeof input === 'object' ? (input.tid ?? input.goods_tid ?? input.id) : input);
    const goodsTid = integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid peak tower goods id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      const row = tables.shop.get(goodsTid);
      if (!row) fail(CODE_STATE, 'Peak tower goods configuration is missing');
      const unlockLayer = Number(row.layer ?? 0);
      if (!Number.isSafeInteger(unlockLayer) || unlockLayer <= 0) fail(CODE_STATE, 'Peak tower goods unlock layer is invalid');
      if (state.maxLayer < unlockLayer) fail(CODE_STATE, 'Peak tower goods is not unlocked');
      if (state.buyGoods.includes(goodsTid)) fail(CODE_LIMIT, 'Peak tower goods was already bought');
      if (claimed(db, model.state.roleId, 'peak_tower_goods', String(goodsTid))) fail(CODE_LIMIT, 'Peak tower goods was already bought');
      const currency = Number(row.currency ?? 0), price = Number(row.price ?? 0);
      if (!Number.isSafeInteger(currency) || currency <= 0 || !Number.isSafeInteger(price) || price <= 0) {
        fail(CODE_STATE, 'Peak tower goods price configuration is invalid');
      }
      const goods = (Array.isArray(row.goods) ? row.goods : []).map((pair) => {
        if (!Array.isArray(pair) || pair.length !== 2) fail(CODE_STATE, 'Peak tower goods reward configuration is invalid');
        const tid = Number(pair[0]), count = Number(pair[1]);
        if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
          fail(CODE_STATE, 'Peak tower goods reward configuration is invalid');
        }
        return [tid, count];
      });
      if (!goods.length) fail(CODE_STATE, 'Peak tower goods reward configuration is empty');
      consumeResources(model, [[currency, price]], CODE_INSUFFICIENT);
      const reward = grantResources(model, goods, resourceTables());
      recordClaim(db, model.state.roleId, 'peak_tower_goods', String(goodsTid), isoSeconds(nowMs));
      state.buyGoods.push(goodsTid);
      writeState(db, state, nowMs);
      log({ event: 'peak_tower_buy_goods_committed', goodsTid, currency, price, changes: reward.changes.length });
      return {
        value: { goodsTid, currency, price, changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  async function receiveAchievement(input) {
    const raw = Array.isArray(input) ? input[0] : (input && typeof input === 'object' ? (input.tid ?? input.achievement_tid) : input);
    const achievementTid = integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid peak tower achievement id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      const type = tables.types.get(achievementTid);
      if (!type) fail(CODE_STATE, 'Peak tower achievement configuration is missing');
      const range = Array.isArray(type.layer_range) ? type.layer_range.map(Number) : [];
      if (range.length !== 2 || !Number.isSafeInteger(range[1])) fail(CODE_STATE, 'Peak tower achievement layer range is invalid');
      if (state.maxLayer < range[1]) fail(CODE_STATE, 'Peak tower achievement is not reached');
      if (claimed(db, model.state.roleId, CLAIM_ACHIEVEMENT, String(achievementTid))) fail(CODE_LIMIT, 'Peak tower achievement was already received');
      const awards = peakTowerTypeAwards(type);
      if (!awards.length) fail(CODE_STATE, 'Peak tower achievement reward configuration is empty');
      const reward = grantResources(model, awards, resourceTables());
      recordClaim(db, model.state.roleId, CLAIM_ACHIEVEMENT, String(achievementTid), isoSeconds(nowMs));
      writeState(db, state, nowMs);
      log({ event: 'peak_tower_achievement_committed', achievementTid, changes: reward.changes.length });
      return {
        value: { achievementTid, changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  // Switching towers happens after the last layer of the current tower type is cleared.
  // The claim bit is stored in the tower_award bit block, matching pb_peak_tower_data.tower_award.
  async function revTowerAward(input) {
    const raw = Array.isArray(input) ? input[0] : (input && typeof input === 'object' ? (input.tid ?? input.tower_tid) : input);
    const towerTid = (raw === undefined || raw === null || raw === '') ? null : integer(raw, 1, Number.MAX_SAFE_INTEGER, 'Invalid peak tower id');
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      if (state.layer <= 0) fail(CODE_STATE, 'Peak tower layer is not unlocked');
      const bitsNow = state.towerAward;
      const granted = [];
      let nextBits = Buffer.from(bitsNow);
      const createdAt = isoSeconds(nowMs);
      if (towerTid !== null) {
        const type = tables.types.get(towerTid);
        if (!type) fail(CODE_STATE, 'Peak tower configuration is missing');
        const range = Array.isArray(type.layer_range) ? type.layer_range.map(Number) : [];
        if (range.length === 2 && Number.isSafeInteger(range[1]) && state.maxLayer < range[1]) {
          fail(CODE_STATE, 'Peak tower award is not reached');
        }
      }
      for (const type of tables.types.values()) {
        const tid = Number(type.tid);
        if (!Number.isSafeInteger(tid) || tid <= 0) continue;
        if (towerTid !== null && tid !== towerTid) continue;
        const range = Array.isArray(type.layer_range) ? type.layer_range.map(Number) : [];
        if (range.length !== 2 || !Number.isSafeInteger(range[1])) continue;
        if (state.maxLayer < range[1]) continue;
        if (claimed(db, model.state.roleId, CLAIM_TOWER, String(tid))) continue;
        if (hasBit(nextBits, tid)) continue;
        const awards = peakTowerTypeAwards(type);
        if (!awards.length) fail(CODE_STATE, 'Peak tower award reward configuration is empty');
        granted.push({ tid, awards });
        nextBits = setBit(nextBits, tid);
      }
      if (!granted.length) fail(CODE_LIMIT, 'Peak tower award was already received');
      const awards = granted.flatMap(candidate => candidate.awards);
      const reward = grantResources(model, awards, resourceTables());
      for (const candidate of granted) recordClaim(db, model.state.roleId, CLAIM_TOWER, String(candidate.tid), createdAt);
      state.towerAward = nextBits;
      writeState(db, state, nowMs);
      log({ event: 'peak_tower_tower_award_committed', towers: granted.map(candidate => candidate.tid), changes: reward.changes.length });
      return {
        value: { towers: granted.map(candidate => candidate.tid), changes: reward.changes },
        data: codec.pack('pb_res_to_client', resPacket(reward.changes))
      };
    });
  }

  // Server wide average of the highest cleared layer. Single deployment: the aggregate is
  // computed from the authoritative per role rows, never from a client supplied value.
  async function avgLayer() {
    const summary = store.inspect(db => {
      ensureTables(db);
      const row = db.prepare('SELECT COUNT(*) AS players, COALESCE(SUM(max_layer), 0) AS total FROM peak_tower_state').get();
      const players = Number(row?.players ?? 0), total = Number(row?.total ?? 0);
      return { players, average: players > 0 ? Math.round(total / players) : 0 };
    });
    log({ event: 'peak_tower_avg_layer_read', players: summary.players, average: summary.average });
    return {
      value: { average: summary.average, players: summary.players },
      // Response schema for 1112 is not recovered from the client bundle; the local client
      // decodes this reply with its ETF fallback order. Only the average is returned.
      data: encodeEtfIntegerTuple([summary.average])
    };
  }

  // Settlement seam used by the fight pipeline: progress only moves when a real battle
  // engine simulation ends in a win for the requested next layer.
  async function challenge({ layer, simulation }) {
    const target = integer(layer, 1, maxConfigLayer, 'Invalid peak tower challenge layer');
    const row = peakTowerLayer(tables, target);
    if (!row) fail(CODE_STATE, 'Peak tower layer configuration is missing');
    if (!simulation || !Array.isArray(simulation.events) || !Number.isSafeInteger(Number(simulation.result))) {
      fail(CODE_INVALID, 'Peak tower challenge requires a battle engine simulation');
    }
    const end = [...simulation.events].reverse().find(event => event && event.kind === 'battle-end');
    if (!end) fail(CODE_INVALID, 'Peak tower simulation is missing the battle result');
    if (Number(end.result) !== Number(simulation.result)) fail(CODE_INVALID, 'Peak tower simulation result is inconsistent');
    const won = Number(simulation.result) === BATTLE_RESULT.WIN;
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readState(db, model.state.roleId, nowMs);
      const attemptKey = String(target);
      if (!won) {
        log({ event: 'peak_tower_challenge_lost', layer: target, round: simulation.overRound ?? 0 });
        return {
          value: { layer: target, won: false, overRound: simulation.overRound ?? 0 },
          data: codec.pack('peak_tower_back', back(state, []))
        };
      }
      if (target !== state.layer + 1) fail(CODE_STATE, 'Peak tower layer is not the next challenge layer');
      if (claimed(db, model.state.roleId, CLAIM_CHALLENGE, attemptKey)) fail(CODE_LIMIT, 'Peak tower layer was already cleared');
      recordClaim(db, model.state.roleId, CLAIM_CHALLENGE, attemptKey, isoSeconds(nowMs));
      state.layer = target;
      if (target > state.maxLayer) {
        state.maxLayer = target;
        state.maxLayerTime = isoSeconds(nowMs);
      }
      writeState(db, state, nowMs);
      log({ event: 'peak_tower_challenge_committed', layer: target, round: simulation.overRound ?? 0 });
      return {
        value: { layer: target, won: true, overRound: simulation.overRound ?? 0 },
        data: codec.pack('peak_tower_back', back(state, []))
      };
    });
  }

  async function execute(type, input) {
    if (type === COMMAND_SWEEPS) return sweeps(input);
    if (type === COMMAND_EVERY_AWARD) return everyAward();
    if (type === COMMAND_BUY_GOODS) return buyGoods(input);
    if (type === COMMAND_RECEIVE_ACHIEVEMENT) return receiveAchievement(input);
    if (type === COMMAND_REV_TOWER_AWARD) return revTowerAward(input);
    if (type === COMMAND_AVG_LAYER) return avgLayer();
    fail(CODE_INVALID, 'Unsupported peak tower command');
  }

  function state(roleId) {
    return store.inspect(db => { ensureTables(db); return readState(db, roleId, now()); });
  }

  return { supports, execute, sweeps, everyAward, buyGoods, receiveAchievement, revTowerAward, avgLayer, challenge, state };
}

