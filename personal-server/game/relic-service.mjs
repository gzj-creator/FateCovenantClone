import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import {
  RELIC_CHIP_ITEM_TID,
  readRelicParam,
  readRelicTables,
  relicQualityOf
} from '../config/relic-tables.mjs';

// Commands from the client's RelicCmd module (89701-89712). 89703 is not
// declared by the shipped client, so every routed type is listed here.
export const RELIC_COMMANDS = Object.freeze({
  BREAK_UP: 89701,
  RECAST: 89702,
  SAVE_RECAST: 89704,
  RESOLVE: 89705,
  CANCEL_RECAST: 89706,
  RESET: 89707,
  STAGE: 89708,
  WEAR: 89709,
  UP_SP: 89710,
  VARIATION: 89711,
  REFINE: 89712
});

const SUPPORTED = new Set(Object.values(RELIC_COMMANDS));
const MAX_RELIC_UID = 4294967295; // hero.relic is repeated uint32
const fail = (code, message) => { throw new GameError(code, message); };

function safeInteger(value, message, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(1, message);
  return number;
}

function scalarId(input, message) {
  let value = input;
  if (Array.isArray(value)) value = value.length === 1 ? value[0] : undefined;
  else if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    value = value.uid ?? value.relic_uid ?? value.hero_tid ?? value.id;
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) fail(1, message);
  return id;
}

function uidText(value, message) {
  let uid;
  try { uid = BigInt(value); } catch { fail(1, message); }
  if (uid <= 0n || uid > BigInt(MAX_RELIC_UID)) fail(1, message);
  return uid.toString();
}

function skillList(value) {
  return (value ?? []).map(entry => Number(entry)).filter(entry => Number.isSafeInteger(entry) && entry > 0);
}

function recastDataRows(value) {
  return (value ?? []).map(row => ({
    recast_times: Number(row?.recast_times ?? 0),
    recast_normal_times: Number(row?.recast_normal_times ?? 0),
    guarantee_times: Number(row?.guarantee_times ?? 0)
  }));
}

function stageCostRows(value) {
  return (value ?? []).map(row => ({ tid: Number(row?.tid ?? 0), num: Number(row?.num ?? 0) }))
    .filter(row => row.tid > 0 && row.num > 0);
}

function normalizeRow(row) {
  return {
    uid: String(row.uid),
    tid: Number(row.tid),
    star: Number(row.star ?? 0),
    stage: Number(row.stage ?? 0),
    is_variation: Number(row.is_variation ?? 0) === 1,
    cur_skills: skillList(row.cur_skills),
    recast_skills: skillList(row.recast_skills),
    recast_datas: recastDataRows(row.recast_datas),
    stage_cost_relics: stageCostRows(row.stage_cost_relics)
  };
}

function createSchema(db) {
  // Service-owned tables: the shared store keeps its own migration version and
  // only writes the gameplay entities it knows about.
  db.exec(`
    CREATE TABLE IF NOT EXISTS relic_depot (
      role_id INTEGER NOT NULL, uid TEXT NOT NULL, tid INTEGER NOT NULL,
      star INTEGER NOT NULL DEFAULT 0, stage INTEGER NOT NULL DEFAULT 0,
      is_variation INTEGER NOT NULL DEFAULT 0 CHECK(is_variation IN (0,1)),
      cur_skills_json TEXT NOT NULL DEFAULT '[]', recast_skills_json TEXT NOT NULL DEFAULT '[]',
      recast_datas_json TEXT NOT NULL DEFAULT '[]', stage_cost_relics_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id,uid));
    CREATE INDEX IF NOT EXISTS relic_depot_role_idx ON relic_depot(role_id,tid);
    CREATE TABLE IF NOT EXISTS relic_counters (
      role_id INTEGER PRIMARY KEY, max_uid TEXT NOT NULL DEFAULT '0');
  `);
}

export function createRelicService({
  store,
  codec,
  tables = readRelicTables(),
  resourceTables,
  random = Math.random,
  now = Date.now
}) {
  if (!store || !codec) throw new Error('Relic service requires the game store and codec');
  if (!(tables?.Relic instanceof Map) || !(tables?.Quality instanceof Map)) {
    throw new Error('Relic configuration is missing');
  }
  if (!(resourceTables?.Item instanceof Map)) throw new Error('Relic service requires the item tables');
  const param = readRelicParam(tables);
  if (!param) throw new Error('Relic constants are missing');
  store.inspect(db => createSchema(db));

  const stamp = () => new Date(Number(now())).toISOString();

  function readDepot(db, roleId) {
    const rows = db.prepare('SELECT * FROM relic_depot WHERE role_id=? ORDER BY CAST(uid AS INTEGER)').all(roleId);
    return rows.map(row => ({
      uid: row.uid, tid: row.tid, star: row.star, stage: row.stage,
      is_variation: row.is_variation === 1,
      cur_skills: JSON.parse(row.cur_skills_json),
      recast_skills: JSON.parse(row.recast_skills_json),
      recast_datas: JSON.parse(row.recast_datas_json),
      stage_cost_relics: JSON.parse(row.stage_cost_relics_json)
    }));
  }

  function writeDepot(db, roleId, rows) {
    db.prepare('DELETE FROM relic_depot WHERE role_id=?').run(roleId);
    const insert = db.prepare('INSERT INTO relic_depot VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    const at = stamp();
    for (const row of rows) {
      insert.run(roleId, String(row.uid), row.tid, row.star, row.stage, row.is_variation ? 1 : 0,
        JSON.stringify(row.cur_skills), JSON.stringify(row.recast_skills),
        JSON.stringify(row.recast_datas), JSON.stringify(row.stage_cost_relics), at, at);
    }
  }

  function readCounters(db, roleId) {
    const row = db.prepare('SELECT max_uid FROM relic_counters WHERE role_id=?').get(roleId);
    if (!row) return { max_uid: 0 };
    const value = Number(row.max_uid);
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_RELIC_UID) throw new Error('Corrupt relic uid counter');
    return { max_uid: value };
  }

  function writeCounters(db, roleId, counters) {
    db.prepare('INSERT OR REPLACE INTO relic_counters VALUES (?,?)').run(roleId, String(counters.max_uid));
  }

  function nextUid(counters) {
    counters.max_uid += 1;
    if (counters.max_uid > MAX_RELIC_UID) fail(305, 'Relic depot uid space exhausted');
    return String(counters.max_uid);
  }

  function configuredRelic(tid) {
    const row = tables.Relic.get(Number(tid));
    if (!row) fail(5, 'Relic configuration is missing');
    return row;
  }

  function configuredQuality(tid) {
    const quality = relicQualityOf(tid);
    const row = quality == null ? null : tables.Quality.get(quality);
    if (!row) fail(5, 'Relic quality configuration is missing');
    return row;
  }

  function costPairs(rows, message) {
    const pairs = [];
    for (const row of rows ?? []) {
      if (!Array.isArray(row) || row.length !== 2) fail(5, message);
      const tid = Number(row[0]);
      const count = Number(row[1]);
      if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) fail(5, message);
      pairs.push([tid, count]);
    }
    return pairs;
  }

  function consume(model, pairs) {
    if (!pairs.length) return [];
    return consumeResources(model, pairs).changes;
  }

  function grant(model, pairs) {
    if (!pairs.length) return [];
    return grantResources(model, pairs, resourceTables).changes;
  }

  function response(resChanges) {
    return { changes: resChanges, is_overflow: false };
  }

  function relicValue(row) {
    return {
      tid: String(row.tid),
      num: 1,
      uid: String(row.uid),
      star: Number(row.star ?? 0),
      cur_skills: row.cur_skills.map(value => String(value)),
      recast_skills: row.recast_skills.map(value => String(value)),
      recast_datas: row.recast_datas.map(entry => ({
        recast_times: String(entry.recast_times),
        recast_normal_times: String(entry.recast_normal_times),
        guarantee_times: String(entry.guarantee_times)
      })),
      stage: Number(row.stage ?? 0),
      stage_cost_relics: row.stage_cost_relics.map(entry => ({ tid: String(entry.tid), num: String(entry.num) })),
      is_variation: Boolean(row.is_variation)
    };
  }

  function findRelic(depot, uid) {
    const id = uidText(uid, 'Invalid relic uid');
    const row = depot.find(entry => entry.uid === id);
    if (!row) fail(5, 'Relic does not exist');
    return row;
  }

  function heroList(model) {
    model.heroInfo.hero_list = Array.isArray(model.heroInfo.hero_list) ? model.heroInfo.hero_list : [];
    return model.heroInfo.hero_list;
  }

  function wornUids(hero) {
    return (Array.isArray(hero.relic) ? hero.relic : []).map(value => String(value));
  }

  function heroByTid(model, tid) {
    const heroes = heroList(model).filter(hero => Number(hero.tid) === tid);
    if (!heroes.length) fail(5, 'Hero does not exist');
    if (heroes.length > 1) fail(5, 'Hero tid is ambiguous');
    return heroes[0];
  }

  function wornOwner(model, uid, ignoreTid = null) {
    for (const hero of heroList(model)) {
      if (ignoreTid != null && Number(hero.tid) === ignoreTid) continue;
      if (wornUids(hero).includes(uid)) return hero;
    }
    return null;
  }

  function executeWear(model, db, input) {
    const requests = input?.wear_list;
    if (!Array.isArray(requests) || !requests.length) fail(1, 'Relic wear list is empty');
    const depot = readDepot(db, model.state.roleId);
    const byUid = new Map(depot.map(row => [row.uid, row]));
    const seenHeroes = new Set();
    const changes = [];
    for (const request of requests) {
      const heroTid = safeInteger(request?.hero_tid, 'Invalid relic wear hero', { min: 1 });
      if (seenHeroes.has(heroTid)) fail(1, 'Relic wear hero is duplicated');
      seenHeroes.add(heroTid);
      const hero = heroByTid(model, heroTid);
      // An empty list clears every slot of the hero.
      if (!Array.isArray(request?.relics)) fail(1, 'Invalid relic wear uid list');
      const uids = [], types = new Set();
      for (const raw of request.relics) {
        const uid = uidText(raw, 'Invalid relic uid');
        if (uids.includes(uid)) fail(1, 'Relic wear uid is duplicated');
        const row = byUid.get(uid);
        if (!row) fail(5, 'Relic does not exist');
        const config = configuredRelic(row.tid);
        const type = Number(config.type);
        if (!Number.isSafeInteger(type) || type < 1) fail(5, 'Relic type configuration is missing');
        if (types.has(type)) fail(1, 'Two relics of the same slot are worn at once');
        types.add(type);
        const owner = wornOwner(model, uid, heroTid);
        if (owner) fail(1, 'Relic is already worn by another hero');
        uids.push(uid);
      }
      // The request supplies the hero's complete wear set; relics of this hero
      // that are absent from it are removed from the slots they occupied.
      hero.relic = uids.map(value => Number(value));
      changes.push(structuredClone(hero));
    }
    writeDepot(db, model.state.roleId, depot);
    const value = {
      hero_list: changes,
      lineup_list: [],
      role_lineup: structuredClone(model.lineups)
    };
    return {
      schema: 'pb_relic_wear_rsp',
      value,
      data: codec.pack('pb_relic_wear_rsp', value),
      valueForLog: { heroes: changes.map(hero => Number(hero.tid)), relics: changes.map(hero => wornUids(hero).length) }
    };
  }

  function executeResolve(model, db, input) {
    const list = input?.relic_uid_list;
    if (!Array.isArray(list) || !list.length) fail(1, 'Relic resolve list is empty');
    const depot = readDepot(db, model.state.roleId);
    const byUid = new Map(depot.map(row => [row.uid, row]));
    const resolved = new Set(), awards = new Map();
    for (const raw of list) {
      const uid = uidText(raw, 'Invalid relic uid');
      if (resolved.has(uid)) fail(1, 'Relic resolve uid is duplicated');
      const row = byUid.get(uid);
      if (!row) fail(5, 'Relic does not exist');
      if (wornOwner(model, uid)) fail(1, 'A worn relic cannot be resolved');
      const quality = configuredQuality(row.tid);
      const chip = Number(quality.resolve_chip ?? 0);
      if (!Number.isSafeInteger(chip) || chip <= 0) fail(5, 'Relic resolve reward configuration is missing');
      awards.set(RELIC_CHIP_ITEM_TID, (awards.get(RELIC_CHIP_ITEM_TID) ?? 0) + chip);
      resolved.add(uid);
    }
    const remaining = depot.filter(row => !resolved.has(row.uid));
    const res = response(grant(model, [...awards]));
    writeDepot(db, model.state.roleId, remaining);
    return {
      schema: 'pb_res_to_client',
      value: res,
      data: codec.pack('pb_res_to_client', res),
      valueForLog: { resolved: [...resolved] }
    };
  }

  // Param.recast_index_unlock_star maps each recast slot to the relic star that
  // unlocks it; the shipped table lists three slots. Recast counters live per
  // slot in pb_relic.recast_datas.
  function recastSlot(relic, indexValue) {
    const index = safeInteger(indexValue, 'Invalid relic recast index', { min: 0 });
    const unlocks = Array.isArray(param.recast_index_unlock_star) ? param.recast_index_unlock_star : [];
    if (index >= unlocks.length) fail(1, 'Invalid relic recast index');
    const needStar = Number(unlocks[index]);
    if (!Number.isSafeInteger(needStar) || needStar < 0) fail(5, 'Relic recast slot configuration is missing');
    if (Number(relic.star ?? 0) < needStar) fail(305, 'Relic recast slot is locked');
    while (relic.recast_datas.length <= index) relic.recast_datas.push({ recast_times: 0, recast_normal_times: 0, guarantee_times: 0 });
    return { index, data: relic.recast_datas[index] };
  }

  function rollSkills(relic, quality) {
    const candidates = [];
    for (const row of tables.RecastSkill.values()) {
      const qualities = Array.isArray(row.quality) ? row.quality.map(Number) : [];
      const skills = Array.isArray(row.skill_id) ? row.skill_id.map(Number) : [];
      const position = qualities.indexOf(Number(quality));
      if (position < 0 || position >= skills.length) continue;
      const skill = skills[position];
      const weight = Number(tables.RecastSkillProb.get(skill)?.probability ?? 0);
      if (!Number.isSafeInteger(skill) || skill <= 0 || weight <= 0) continue;
      candidates.push({ skill, weight });
    }
    if (!candidates.length) fail(5, 'Relic recast skill configuration is missing');
    const count = Number(param.skill_count ?? 0);
    if (!Number.isSafeInteger(count) || count <= 0) fail(5, 'Relic recast skill count is missing');
    const pool = [...candidates], rolled = [];
    while (rolled.length < count && pool.length) {
      const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = random() * total;
      let chosen = pool.length - 1;
      for (let index = 0; index < pool.length; index++) {
        roll -= pool[index].weight;
        if (roll < 0) { chosen = index; break; }
      }
      rolled.push(pool[chosen].skill);
      pool.splice(chosen, 1);
    }
    return rolled;
  }

  function executeBreakUp(model, db, input) {
    const uid = uidText(scalarId(input, 'Invalid relic break-up payload'), 'Invalid relic uid');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    const quality = configuredQuality(relic.tid);
    const maxStar = Number(quality.max_star ?? 0);
    if (!Number.isSafeInteger(maxStar) || maxStar <= 0) fail(305, 'Relic cannot be upgraded');
    const star = Number(relic.star ?? 0);
    if (star >= maxStar) fail(305, 'Relic star limit reached');
    const chips = Array.isArray(quality.cost_chip) ? Number(quality.cost_chip[star] ?? 0) : 0;
    if (!Number.isSafeInteger(chips) || chips <= 0) fail(5, 'Relic star cost configuration is missing');
    const res = response(consume(model, [[RELIC_CHIP_ITEM_TID, chips]]));
    relic.star = star + 1;
    writeDepot(db, model.state.roleId, depot);
    const value = { res, relic: relicValue(relic) };
    return {
      schema: 'pb_res_op_relic',
      value,
      data: codec.pack('pb_res_op_relic', value),
      valueForLog: { relicUid: relic.uid, star: relic.star, chips }
    };
  }

  function executeRecast(model, db, input) {
    const uid = uidText(input?.relic_uid, 'Invalid relic uid');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    const slot = recastSlot(relic, input?.index ?? 0);
    const cost = costPairs([param.recast_cost], 'Relic recast cost configuration is invalid');
    if (!cost.length) fail(5, 'Relic recast cost configuration is missing');
    const quality = configuredQuality(relic.tid);
    const rolled = rollSkills(relic, relicQualityOf(relic.tid));
    const res = response(consume(model, cost));
    slot.data.recast_times += 1;
    slot.data.recast_normal_times += 1;
    slot.data.guarantee_times += 1;
    relic.recast_skills = rolled;
    writeDepot(db, model.state.roleId, depot);
    const value = { res, relic: relicValue(relic) };
    return {
      schema: 'pb_res_op_relic',
      value,
      data: codec.pack('pb_res_op_relic', value),
      valueForLog: { relicUid: relic.uid, index: slot.index, skills: rolled, quality: Number(quality.tid) }
    };
  }

  function executeSaveRecast(model, db, input) {
    const uid = uidText(input?.relic_uid, 'Invalid relic uid');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    const slot = recastSlot(relic, input?.index ?? 0);
    if (!relic.recast_skills.length) fail(1, 'Relic has no pending recast result');
    relic.cur_skills = [...relic.recast_skills];
    relic.recast_skills = [];
    slot.data.recast_times = 0;
    slot.data.recast_normal_times = 0;
    slot.data.guarantee_times = 0;
    writeDepot(db, model.state.roleId, depot);
    const value = { res: response([]), relic: relicValue(relic) };
    return {
      schema: 'pb_res_op_relic',
      value,
      data: codec.pack('pb_res_op_relic', value),
      valueForLog: { relicUid: relic.uid, index: slot.index, saved: relic.cur_skills.length }
    };
  }

  function executeCancelRecast(model, db, input) {
    const uid = uidText(input?.relic_uid, 'Invalid relic uid');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    const slot = recastSlot(relic, input?.index ?? 0);
    if (!relic.recast_skills.length) fail(1, 'Relic has no pending recast result');
    relic.recast_skills = [];
    slot.data.recast_times = 0;
    slot.data.recast_normal_times = 0;
    slot.data.guarantee_times = 0;
    writeDepot(db, model.state.roleId, depot);
    const value = { res: response([]), relic: relicValue(relic) };
    return {
      schema: 'pb_res_op_relic',
      value,
      data: codec.pack('pb_res_op_relic', value),
      valueForLog: { relicUid: relic.uid, index: slot.index }
    };
  }

  // Quality.stage_cost holds the item amount per stage and Quality.stage_cost_item
  // names the item; only quality 50 declares both, so the other qualities stop
  // with the business code instead of consuming an invented material.
  function executeStage(model, db, input) {
    const uid = uidText(input?.relic_uid, 'Invalid relic uid');
    const materialUids = Array.isArray(input?.relic_uid_list) ? input.relic_uid_list : [];
    if (!materialUids.length) fail(1, 'Relic stage material list is empty');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    const quality = configuredQuality(relic.tid);
    const maxStage = Number(param.max_stage ?? 0);
    const stage = Number(relic.stage ?? 0);
    if (!Number.isSafeInteger(maxStage) || maxStage <= 0) fail(5, 'Relic stage configuration is missing');
    if (stage >= maxStage) fail(305, 'Relic stage limit reached');
    const itemTid = Number(quality.stage_cost_item ?? 0);
    const costs = Array.isArray(quality.stage_cost) ? Number(quality.stage_cost[stage] ?? 0) : 0;
    if (!Number.isSafeInteger(itemTid) || itemTid <= 0 || !Number.isSafeInteger(costs) || costs <= 0) {
      fail(5, 'Relic stage cost configuration is missing');
    }

    const materials = [], seen = new Set();
    for (const raw of materialUids) {
      const materialUid = uidText(raw, 'Invalid relic uid');
      if (materialUid === relic.uid) fail(1, 'A relic cannot consume itself');
      if (seen.has(materialUid)) fail(1, 'Relic stage material uid is duplicated');
      seen.add(materialUid);
      const row = depot.find(entry => entry.uid === materialUid);
      if (!row) fail(5, 'Relic does not exist');
      if (wornOwner(model, materialUid)) fail(1, 'A worn relic cannot be used as stage material');
      materials.push(row);
    }

    const res = response(consume(model, [[itemTid, costs]]));
    const aggregate = new Map(relic.stage_cost_relics.map(row => [row.tid, row.num]));
    for (const row of materials) aggregate.set(row.tid, (aggregate.get(row.tid) ?? 0) + 1);
    relic.stage_cost_relics = [...aggregate].map(([tid, num]) => ({ tid, num }));
    relic.stage = stage + 1;
    writeDepot(db, model.state.roleId, depot.filter(row => !seen.has(row.uid) || row.uid === relic.uid));
    const value = { res, relic: relicValue(relic) };
    return {
      schema: 'pb_res_op_relic',
      value,
      data: codec.pack('pb_res_op_relic', value),
      valueForLog: { relicUid: relic.uid, stage: relic.stage, materials: materials.length, itemTid, costs }
    };
  }

  // Reset returns the stage materials recorded by previous stage-ups. The
  // client response carries them in back_relic_l, so the depot mints fresh uids
  // for the returned templates instead of resurrecting removed instances.
  function executeReset(model, db, input) {
    const uid = uidText(scalarId(input, 'Invalid relic reset payload'), 'Invalid relic uid');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    if (Number(relic.stage ?? 0) <= 0) fail(1, 'Relic stage is already zero');
    const counters = readCounters(db, model.state.roleId);
    const back = [];
    for (const row of relic.stage_cost_relics) {
      configuredRelic(row.tid);
      for (let index = 0; index < row.num; index++) {
        const restored = {
          uid: nextUid(counters), tid: row.tid, star: 0, stage: 0, is_variation: false,
          cur_skills: [], recast_skills: [], recast_datas: [], stage_cost_relics: []
        };
        depot.push(restored);
        back.push(restored);
      }
    }
    relic.stage = 0;
    relic.stage_cost_relics = [];
    writeDepot(db, model.state.roleId, depot);
    writeCounters(db, model.state.roleId, counters);
    const value = { res: response([]), relic: relicValue(relic), back_relic_l: back.map(relicValue) };
    return {
      schema: 'pb_rsp_reset_relic',
      value,
      data: codec.pack('pb_rsp_reset_relic', value),
      valueForLog: { relicUid: relic.uid, returned: back.length }
    };
  }

  function executeVariation(model, db, input) {
    const uid = uidText(scalarId(input, 'Invalid relic variation payload'), 'Invalid relic uid');
    const depot = readDepot(db, model.state.roleId);
    const relic = findRelic(depot, uid);
    const quality = configuredQuality(relic.tid);
    if (quality.is_variation !== true) fail(305, 'Relic quality cannot vary');
    if (relic.is_variation) fail(305, 'Relic is already varied');
    const costs = costPairs(quality.variation_consume, 'Relic variation cost configuration is invalid');
    if (!costs.length) fail(5, 'Relic variation cost configuration is missing');
    const res = response(consume(model, costs));
    relic.is_variation = true;
    writeDepot(db, model.state.roleId, depot);
    const value = { relic: relicValue(relic), res };
    return {
      schema: 'pb_variation_back',
      value,
      data: codec.pack('pb_variation_back', value),
      valueForLog: { relicUid: relic.uid, varied: true }
    };
  }

  // Sp is the hero relic-rune level ladder (cost, star gate, refine-value gate)
  // and SpHero names the per-hero upgrade item. Both are required before any
  // resource is spent.
  function spConfig(heroTid) {
    const row = tables.SpHero?.get(Number(heroTid));
    if (!row) fail(5, 'Relic SP configuration is missing');
    const item = Number(row.item ?? 0);
    if (!Number.isSafeInteger(item) || item <= 0) fail(5, 'Relic SP item configuration is missing');
    return { row, item };
  }

  function executeUpSp(model, db, input) {
    const heroTid = scalarId(input, 'Invalid relic SP payload');
    const hero = heroByTid(model, heroTid);
    const current = Number(hero.sp_relic_level ?? 0);
    const next = current + 1;
    const level = tables.Sp?.get(next);
    if (!level) fail(305, 'Relic SP level limit reached');
    const needStar = Number(level.need_star ?? 0);
    if (Number(hero.star ?? 0) < needStar) fail(305, 'Hero star is too low for relic SP');
    const needRefine = Number(level.refine_value ?? 0);
    if (Number(hero.sp_relic_refine_value ?? 0) < needRefine) fail(305, 'Relic SP refine value is too low');
    const { item } = spConfig(heroTid);
    const count = Number(level.cost ?? 0);
    if (!Number.isSafeInteger(count) || count <= 0) fail(5, 'Relic SP cost configuration is missing');
    const res = response(consume(model, [[item, count]]));
    hero.sp_relic_level = String(next);
    const value = { hero: structuredClone(hero), res };
    return {
      schema: 'pb_relic_sp_up_rsp',
      value,
      data: codec.pack('pb_relic_sp_up_rsp', value),
      valueForLog: { heroTid, level: next, item, count }
    };
  }

  // SpRefine tiers are keyed by the attr_scope range that contains the current
  // refine value; random_limit bounds the value granted by one refine.
  function refineTier(value) {
    const tiers = [...(tables.SpRefine?.values() ?? [])]
      .map(row => ({ row, scope: (row.attr_scope ?? []).map(Number) }))
      .filter(entry => entry.scope.length === 2 && entry.scope.every(Number.isSafeInteger))
      .sort((left, right) => left.scope[0] - right.scope[0]);
    const tier = tiers.find(entry => value >= entry.scope[0] && value < entry.scope[1]);
    if (!tier) fail(305, 'Relic SP refine limit reached');
    return tier.row;
  }

  function executeRefine(model, db, input) {
    const heroTid = scalarId(input, 'Invalid relic refine payload');
    const hero = heroByTid(model, heroTid);
    const { item } = spConfig(heroTid);
    const value = Number(hero.sp_relic_refine_value ?? 0);
    if (!Number.isSafeInteger(value) || value < 0) fail(5, 'Hero refine value is invalid');
    const tier = refineTier(value);
    const count = Number(tier.cost ?? 0);
    const limit = Number(tier.random_limit ?? 0);
    if (!Number.isSafeInteger(count) || count <= 0 || !Number.isSafeInteger(limit) || limit <= 0) {
      fail(5, 'Relic SP refine configuration is missing');
    }
    const add = 1 + Math.floor(random() * limit);
    const res = response(consume(model, [[item, count]]));
    hero.sp_relic_refine_value = String(value + add);
    const responseValue = {
      tid: String(heroTid),
      refine_value: String(value + add),
      add_refine_value: String(add),
      res
    };
    return {
      schema: 'pb_relic_refine_back',
      value: responseValue,
      data: codec.pack('pb_relic_refine_back', responseValue),
      valueForLog: { heroTid, refineValue: value + add, add }
    };
  }

  return {
    // Acquisition seam. Relic forging and the relic draw belong to the draw
    // module, which is outside this task; other systems hand finished relic
    // templates to the depot through this method so the depot stays the single
    // authority for uid, star and recast state.
    addRelics(entries) {
      return store.transaction((model, db) => {
        const depot = readDepot(db, model.state.roleId);
        const counters = readCounters(db, model.state.roleId);
        const created = [];
        for (const entry of entries ?? []) {
          const tid = safeInteger(entry?.tid, 'Invalid relic tid', { min: 1 });
          configuredRelic(tid);
          const count = safeInteger(entry?.count ?? 1, 'Invalid relic count', { min: 1, max: 1000 });
          for (let index = 0; index < count; index++) {
            const row = {
              uid: nextUid(counters), tid, star: 0, stage: 0, is_variation: false,
              cur_skills: [], recast_skills: [], recast_datas: [], stage_cost_relics: []
            };
            depot.push(row);
            created.push(structuredClone(row));
          }
        }
        writeDepot(db, model.state.roleId, depot);
        writeCounters(db, model.state.roleId, counters);
        return created;
      });
    },
    supports: type => SUPPORTED.has(type),
    execute(type, input) {
      if (!SUPPORTED.has(type)) fail(1, 'Unsupported relic command');
      return store.transaction((model, db) => {
        if (type === RELIC_COMMANDS.WEAR) return executeWear(model, db, input);
        if (type === RELIC_COMMANDS.RESOLVE) return executeResolve(model, db, input);
        if (type === RELIC_COMMANDS.BREAK_UP) return executeBreakUp(model, db, input);
        if (type === RELIC_COMMANDS.RECAST) return executeRecast(model, db, input);
        if (type === RELIC_COMMANDS.SAVE_RECAST) return executeSaveRecast(model, db, input);
        if (type === RELIC_COMMANDS.CANCEL_RECAST) return executeCancelRecast(model, db, input);
        if (type === RELIC_COMMANDS.STAGE) return executeStage(model, db, input);
        if (type === RELIC_COMMANDS.RESET) return executeReset(model, db, input);
        if (type === RELIC_COMMANDS.VARIATION) return executeVariation(model, db, input);
        if (type === RELIC_COMMANDS.UP_SP) return executeUpSp(model, db, input);
        if (type === RELIC_COMMANDS.REFINE) return executeRefine(model, db, input);
        fail(1, 'Unsupported relic command');
      });
    }
  };
}
