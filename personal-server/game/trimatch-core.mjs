import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { firstEquipLevelTid, firstHeroLevelTid, heroLevelRow, triMatchCellCount } from '../config/trimatch-tables.mjs';

// Shared triple match state: the authoritative per role site/hero/equip rows,
// the owned hero list derived from the item inventory, and the attribute and
// power pipeline used by development, the battle engine and PVP matchmaking.

export const CODE_INVALID = 1;
export const CODE_STATE = 5;
export const CODE_LIMIT = 3;
export const CODE_INSUFFICIENT = 301;

export const fail = (code, message) => { throw new GameError(code, message); };

export function integer(value, min, max, message) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(CODE_INVALID, message);
  return number;
}

export function isoSeconds(milliseconds) {
  return new Date(Math.floor(milliseconds / 1000) * 1000).toISOString();
}

export function ensureTrimatchTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_site (
    role_id INTEGER NOT NULL,
    site_index INTEGER NOT NULL,
    hero_tid INTEGER NOT NULL,
    level_tid INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, site_index)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_hero (
    role_id INTEGER NOT NULL,
    hero_tid INTEGER NOT NULL,
    star INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, hero_tid)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_equip (
    role_id INTEGER NOT NULL,
    site_index INTEGER NOT NULL,
    equip_type_tid INTEGER NOT NULL,
    level_tid INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, site_index, equip_type_tid)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_lineup (
    role_id INTEGER NOT NULL,
    uid INTEGER NOT NULL,
    gen_time INTEGER NOT NULL,
    name TEXT NOT NULL,
    team_list TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, uid)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_playing_lineup (
    role_id INTEGER NOT NULL,
    lineup_type INTEGER NOT NULL,
    team_list TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, lineup_type)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_ident (
    role_id INTEGER PRIMARY KEY,
    next_lineup_uid INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`);
}

function nowText(nowMs) {
  return isoSeconds(nowMs);
}

export function readIdent(db, roleId, nowMs) {
  const row = db.prepare('SELECT * FROM trimatch_ident WHERE role_id=?').get(roleId);
  if (row) return { roleId, nextUid: Number(row.next_lineup_uid ?? 1) };
  db.prepare('INSERT INTO trimatch_ident VALUES (?,?,?)').run(roleId, 2, nowText(nowMs));
  return { roleId, nextUid: 1 };
}

export function takeLineupUid(db, roleId, nowMs) {
  const ident = readIdent(db, roleId, nowMs);
  db.prepare('UPDATE trimatch_ident SET next_lineup_uid=?, updated_at=? WHERE role_id=?').run(ident.nextUid + 1, nowText(nowMs), roleId);
  return ident.nextUid;
}

export function readSites(db, roleId) {
  const rows = db.prepare('SELECT * FROM trimatch_site WHERE role_id=? ORDER BY site_index').all(roleId);
  return rows.map(row => ({ index: Number(row.site_index), hero_tid: Number(row.hero_tid), level_tid: Number(row.level_tid) }));
}

export function writeSite(db, roleId, site, nowMs) {
  db.prepare(`INSERT INTO trimatch_site (role_id, site_index, hero_tid, level_tid, updated_at) VALUES (?,?,?,?,?)
    ON CONFLICT(role_id, site_index) DO UPDATE SET hero_tid=excluded.hero_tid, level_tid=excluded.level_tid, updated_at=excluded.updated_at`)
    .run(roleId, site.index, site.hero_tid, site.level_tid, nowText(nowMs));
}

export function readHeroStars(db, roleId) {
  const rows = db.prepare('SELECT * FROM trimatch_hero WHERE role_id=?').all(roleId);
  const map = new Map();
  for (const row of rows) map.set(Number(row.hero_tid), Number(row.star));
  return map;
}

export function writeHeroStar(db, roleId, heroTid, star, nowMs) {
  db.prepare(`INSERT INTO trimatch_hero (role_id, hero_tid, star, updated_at) VALUES (?,?,?,?)
    ON CONFLICT(role_id, hero_tid) DO UPDATE SET star=excluded.star, updated_at=excluded.updated_at`)
    .run(roleId, heroTid, star, nowText(nowMs));
}

export function readEquips(db, roleId) {
  const rows = db.prepare('SELECT * FROM trimatch_equip WHERE role_id=? ORDER BY site_index, equip_type_tid').all(roleId);
  const map = new Map();
  for (const row of rows) {
    const site = Number(row.site_index), type = Number(row.equip_type_tid);
    if (!map.has(site)) map.set(site, new Map());
    map.get(site).set(type, Number(row.level_tid));
  }
  return map;
}

export function writeEquip(db, roleId, siteIndex, equipType, levelTid, nowMs) {
  db.prepare(`INSERT INTO trimatch_equip (role_id, site_index, equip_type_tid, level_tid, updated_at) VALUES (?,?,?,?,?)
    ON CONFLICT(role_id, site_index, equip_type_tid) DO UPDATE SET level_tid=excluded.level_tid, updated_at=excluded.updated_at`)
    .run(roleId, siteIndex, equipType, levelTid, nowText(nowMs));
}

function resourceCount(model, tid) {
  const row = model.resources.get(String(tid));
  if (!row) return 0;
  const value = Number(row.num ?? 0);
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

// Hero ownership follows the inventory: the client treats the hero tid as the
// hero card resource (MatchHeroRes / TID_RES_TYPE_BATTLE_TRI_MATCH_HERO), and a
// zero count means the hero was never obtained.
export function ownedHeroes(model, tables, stars) {
  const list = [];
  for (const [tid, row] of tables.heroes) {
    if (resourceCount(model, tid) <= 0) continue;
    list.push({ tid, star: stars.get(tid) ?? 0, row });
  }
  list.sort((left, right) => left.tid - right.tid);
  return list;
}

// Sites and equipment rows are created once per role. Sites start without a
// hero and at the first training tier; equipment starts at the first level of
// each equipped type. Owned heroes fill the empty sites in ascending tid order.
export function ensureRoleState(model, db, tables, roleId, nowMs) {
  const cells = triMatchCellCount(tables);
  if (!cells) fail(CODE_STATE, 'Triple match site configuration is missing');
  const firstLevel = firstHeroLevelTid(tables);
  if (!firstLevel) fail(CODE_STATE, 'Triple match hero level configuration is missing');
  let sites = readSites(db, roleId);
  if (!sites.length) {
    sites = [];
    for (let index = 1; index <= cells; index += 1) {
      const site = { index, hero_tid: 0, level_tid: firstLevel };
      writeSite(db, roleId, site, nowMs);
      sites.push(site);
    }
  }
  const stars = readHeroStars(db, roleId);
  const owned = ownedHeroes(model, tables, stars);
  const assigned = new Set(sites.map(site => site.hero_tid).filter(Boolean));
  for (const hero of owned) {
    if (assigned.has(hero.tid)) continue;
    const free = sites.find(site => !site.hero_tid);
    if (!free) break;
    free.hero_tid = hero.tid;
    writeSite(db, roleId, free, nowMs);
    assigned.add(hero.tid);
  }
  const equips = readEquips(db, roleId);
  for (const site of sites) {
    const types = equips.get(site.index);
    for (const [typeTid] of tables.equipTypes) {
      if (types && types.has(typeTid)) continue;
      const levelTid = firstEquipLevelTid(tables, typeTid);
      if (!levelTid) fail(CODE_STATE, 'Triple match equip level configuration is missing for type ' + typeTid);
      writeEquip(db, roleId, site.index, typeTid, levelTid, nowMs);
    }
  }
  readIdent(db, roleId, nowMs);
  return { sites: readSites(db, roleId), equips: readEquips(db, roleId), stars, owned };
}

function attrPairs(value, label) {
  if (!Array.isArray(value)) return [];
  return value.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(label + ' attribute configuration is invalid');
    return [Number(pair[0]), Number(pair[1])];
  });
}

// Attribute ids follow BattleTriMatchHeroTable.AttrType: 1 = health, 2 = attack,
// 3 = defence, and 4/5/6 are the health/attack/defence percentage modifiers used
// by the star table (value_type 1, factor 10000).
export function heroAttributes(tables, heroRow, levelTid, star, equipLevelTids) {
  const base = tables.heroAttrByTemplateLevel.get(Number(heroRow.attr_template) + ':' + Number(levelTid));
  if (!base) fail(CODE_STATE, 'Triple match hero attribute row is missing for level ' + levelTid);
  const flat = { hp: 0, atk: 0, def: 0 };
  for (const [attr, value] of attrPairs(base.attr, 'Triple match hero')) {
    if (attr === 1) flat.hp += value;
    else if (attr === 2) flat.atk += value;
    else if (attr === 3) flat.def += value;
  }
  const percent = { hp: 0, atk: 0, def: 0 };
  const starRow = tables.heroStarByHero.get(Number(heroRow.tid))?.find(row => Number(row.star) === Number(star));
  if (starRow) {
    for (const [attr, value] of attrPairs(starRow.attr, 'Triple match hero star')) {
      if (attr === 4) percent.hp += value;
      else if (attr === 5) percent.atk += value;
      else if (attr === 6) percent.def += value;
    }
  }
  for (const levelTidOfEquip of equipLevelTids ?? []) {
    const row = tables.equipLevels.get(Number(levelTidOfEquip));
    if (!row) continue;
    for (const [attr, value] of attrPairs(row.attr, 'Triple match equip')) {
      if (attr === 1) flat.hp += value;
      else if (attr === 2) flat.atk += value;
      else if (attr === 3) flat.def += value;
    }
  }
  return {
    hp: Math.max(1, Math.round(flat.hp * (1 + percent.hp / 10000))),
    atk: Math.max(1, Math.round(flat.atk * (1 + percent.atk / 10000))),
    def: Math.max(0, Math.round(flat.def * (1 + percent.def / 10000)))
  };
}

// BattleTriMatchPowerConst holds the recovered power weights
// (health 1, attack 8, defence 50).
export function powerOf(tables, attributes) {
  const constant = tables.powerConst ?? {};
  const hpRatio = Number(constant.hp_ratio ?? 1);
  const atkRatio = Number(constant.atk_ratio ?? 0);
  const defRatio = Number(constant.def_ratio ?? 0);
  return Math.max(1, Math.round(attributes.hp * hpRatio + attributes.atk * atkRatio + attributes.def * defRatio));
}

export function fightersOfRole(model, db, tables, roleId, teamSites) {
  const stars = readHeroStars(db, roleId);
  const equips = readEquips(db, roleId);
  const sites = new Map(readSites(db, roleId).map(site => [site.index, site]));
  const fighters = [];
  for (const entry of teamSites) {
    const site = sites.get(Number(entry.site_index));
    const heroTid = Number(entry.hero_tid ?? site?.hero_tid ?? 0);
    if (!heroTid) fail(CODE_STATE, 'Triple match lineup site has no hero');
    const heroRow = tables.heroes.get(heroTid);
    if (!heroRow) fail(CODE_STATE, 'Triple match hero configuration is missing for ' + heroTid);
    const levelTid = Number(site?.level_tid ?? 0);
    const equipLevelTids = [...(equips.get(Number(entry.site_index))?.values() ?? [])];
    const attributes = heroAttributes(tables, heroRow, levelTid, stars.get(heroTid) ?? 0, equipLevelTids);
    fighters.push({
      site_index: Number(entry.site_index),
      hero_tid: heroTid,
      star: stars.get(heroTid) ?? 0,
      level_tid: levelTid,
      level: Number(heroLevelRow(tables, levelTid)?.level ?? 1),
      equip_level_tids: equipLevelTids,
      attributes,
      power: powerOf(tables, attributes)
    });
  }
  return fighters;
}

export function teamSitesOf(model, db, tables, roleId, lineupType) {
  const row = db.prepare('SELECT * FROM trimatch_playing_lineup WHERE role_id=? AND lineup_type=?').get(roleId, lineupType);
  if (row) {
    let teams = [];
    try { teams = JSON.parse(row.team_list); } catch { teams = []; }
    const first = Array.isArray(teams) ? teams[0] : null;
    if (first && Array.isArray(first.sites) && first.sites.length) return first.sites.map(site => ({ site_index: Number(site.site_index), hero_tid: Number(site.hero_tid) }));
  }
  const sites = readSites(db, roleId).filter(site => site.hero_tid);
  if (!sites.length) fail(CODE_STATE, 'Triple match lineup has no deployed hero');
  return sites.map(site => ({ site_index: site.index, hero_tid: site.hero_tid }));
}

export function grant(model, awards, gameTables, codec) {
  const list = (awards ?? []).filter(pair => Array.isArray(pair) && pair.length === 2 && Number(pair[1]) > 0);
  if (!list.length) return { changes: [] };
  return grantResources(model, list, gameTables, { codec });
}

export function consume(model, costs, codec, nowMs) {
  const list = (costs ?? []).filter(pair => Array.isArray(pair) && pair.length === 2 && Number(pair[1]) > 0);
  if (!list.length) return { changes: [] };
  return consumeResources(model, list.map(pair => [Number(pair[0]), Number(pair[1])]), CODE_INSUFFICIENT, { codec, now: nowMs });
}

export function affordable(model, costs) {
  const totals = new Map();
  for (const pair of costs ?? []) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const tid = String(pair[0]);
    totals.set(tid, (totals.get(tid) ?? 0n) + BigInt(Number(pair[1])));
  }
  for (const [tid, amount] of totals) {
    if (BigInt(model.resources.get(tid)?.num ?? 0) < amount) return false;
  }
  return true;
}
