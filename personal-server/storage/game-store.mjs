import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

function modelFromState(state, codec) {
  const modules = new Map(state.modules.value);
  const heroes = codec.unpack('pb_hero_info', rawBinary(modules.get(10).value[0]));
  const resources = new Map();
  const add = (value, location) => {
    const tid = String(value.tid);
    if (resources.has(tid)) throw new Error('Duplicate resource in migration: ' + tid);
    resources.set(tid, { ...value, num: String(value.num ?? 0), location });
  };
  for (const [moduleId, index] of [[5, null], [10, 1]]) {
    const target = index === null ? modules.get(moduleId) : modules.get(moduleId).value[index];
    codec.unpack('pb_currency_data', rawBinary(target)).res_list.forEach((value, entry) => add(value, [moduleId, index, entry]));
  }
  modules.get(6).value.forEach((group, groupIndex) => {
    if (Array.isArray(group.value)) group.value.forEach((value, entry) => add(codec.unpack('pb_res_obj', rawBinary(value)), [6, groupIndex, entry]));
  });
  const login = codec.unpack('pb_lineup_login', rawBinary(modules.get(9)));
  return { state, role: codec.unpack('to_client_role_info', Buffer.from(state.rolePb, 'base64')),
    heroInfo: heroes, resources, lineups: codec.unpack('pb_role_lineup', Buffer.from(login.pre_lineup, 'base64')),
    playLineups: login.lineups.map(bytes => codec.unpack('pb_lineup', Buffer.from(bytes, 'base64'))) };
}

// Snapshot modules retain unknown fields; authoritative mutable entities live in tables.
export function materializeState(model, codec) {
  const state = structuredClone(model.state);
  const modules = new Map(state.modules.value);
  state.rolePb = codec.pack('to_client_role_info', model.role).toString('base64');
  const lineupLogin = codec.unpack('pb_lineup_login', rawBinary(modules.get(9)));
  lineupLogin.pre_lineup = codec.pack('pb_role_lineup', model.lineups);
  lineupLogin.lineups = model.playLineups.map(lineup => codec.pack('pb_lineup', lineup));
  const lineupBytes = codec.pack('pb_lineup_login', lineupLogin);
  state.lineups = lineupBytes.toString('base64');
  modules.set(9, serializedBinary(lineupBytes));
  modules.get(10).value[0] = serializedBinary(codec.pack('pb_hero_info', model.heroInfo));
  const currencies = new Map();
  for (const resource of model.resources.values()) {
    const { location: [moduleId, group, entry], ...value } = resource;
    if (moduleId === 6) modules.get(6).value[group].value[entry] = serializedBinary(codec.pack('pb_res_obj', value));
    else {
      const key = moduleId + ':' + group;
      if (!currencies.has(key)) {
        const target = group === null ? modules.get(moduleId) : modules.get(moduleId).value[group];
        currencies.set(key, { moduleId, group, data: codec.unpack('pb_currency_data', rawBinary(target)) });
      }
      currencies.get(key).data.res_list[entry] = value;
    }
  }
  for (const { moduleId, group, data } of currencies.values()) {
    const value = serializedBinary(codec.pack('pb_currency_data', data));
    if (group === null) modules.set(moduleId, value);
    else modules.get(moduleId).value[group] = value;
  }
  state.modules.value = [...modules];
  return state;
}

export function createGameStore({ databasePath, legacyStatePath, seed, codec }) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
  let version = db.prepare('PRAGMA user_version').get().user_version;
  if (version > 3) { db.close(); throw new Error('Unsupported game database schema: ' + version); }
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (role_id INTEGER PRIMARY KEY, server_id INTEGER NOT NULL, created_at INTEGER NOT NULL, profile_json TEXT NOT NULL, metadata_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_modules (role_id INTEGER NOT NULL REFERENCES roles(role_id), module_id INTEGER NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY(role_id,module_id));
    CREATE TABLE IF NOT EXISTS heroes (role_id INTEGER NOT NULL REFERENCES roles(role_id), uid TEXT NOT NULL, tid TEXT NOT NULL, level INTEGER NOT NULL, star INTEGER NOT NULL, star_progress INTEGER NOT NULL, break_level INTEGER NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY(role_id,uid));
    CREATE TABLE IF NOT EXISTS hero_cells (role_id INTEGER NOT NULL REFERENCES roles(role_id), cell_index INTEGER NOT NULL, level INTEGER NOT NULL, break_level INTEGER NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY(role_id,cell_index));
    CREATE TABLE IF NOT EXISTS resources (role_id INTEGER NOT NULL REFERENCES roles(role_id), tid TEXT NOT NULL, amount TEXT NOT NULL, location_json TEXT NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY(role_id,tid));
    CREATE TABLE IF NOT EXISTS lineups (role_id INTEGER PRIMARY KEY REFERENCES roles(role_id), payload_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS play_lineups (role_id INTEGER NOT NULL REFERENCES roles(role_id), lineup_type INTEGER NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY(role_id,lineup_type));
    CREATE TABLE IF NOT EXISTS guides (role_id INTEGER NOT NULL REFERENCES roles(role_id), guide_key TEXT NOT NULL, process_id INTEGER NOT NULL, PRIMARY KEY(role_id,guide_key));
    CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, source TEXT NOT NULL, completed_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS local_wallets (account_id TEXT PRIMARY KEY, role_id INTEGER NOT NULL UNIQUE REFERENCES roles(role_id), balance_cents INTEGER NOT NULL DEFAULT 0 CHECK(balance_cents>=0));
    CREATE TABLE IF NOT EXISTS wallet_ledger (entry_id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES local_wallets(account_id), kind TEXT NOT NULL, delta_cents INTEGER NOT NULL, balance_cents INTEGER NOT NULL, created_at TEXT NOT NULL, details_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS recharge_orders (order_id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES local_wallets(account_id), request_id TEXT NOT NULL, product_id INTEGER NOT NULL, price_cents INTEGER NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, acknowledged INTEGER NOT NULL DEFAULT 0, UNIQUE(account_id,request_id));
    CREATE TABLE IF NOT EXISTS activity_claims (role_id INTEGER NOT NULL REFERENCES roles(role_id), act_id INTEGER NOT NULL, task_id INTEGER NOT NULL, period TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(role_id,act_id,task_id,period));
    CREATE TABLE IF NOT EXISTS voucher_skus (sku_id TEXT PRIMARY KEY, item_tid INTEGER NOT NULL UNIQUE, face_value_cents INTEGER NOT NULL CHECK(face_value_cents>0), title TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS game_mails (mail_id INTEGER PRIMARY KEY AUTOINCREMENT, role_id INTEGER NOT NULL REFERENCES roles(role_id), request_id TEXT NOT NULL, tid INTEGER NOT NULL DEFAULT 0, send_name TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, send_time INTEGER NOT NULL, expire_at INTEGER NOT NULL DEFAULT 0, read INTEGER NOT NULL DEFAULT 0, received INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, award_json TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(role_id,request_id));
    CREATE TABLE IF NOT EXISTS voucher_grants (grant_id TEXT PRIMARY KEY, mail_id INTEGER NOT NULL UNIQUE REFERENCES game_mails(mail_id), role_id INTEGER NOT NULL REFERENCES roles(role_id), sku_id TEXT NOT NULL REFERENCES voucher_skus(sku_id), item_tid INTEGER NOT NULL, face_value_cents INTEGER NOT NULL CHECK(face_value_cents>0), quantity INTEGER NOT NULL CHECK(quantity>0), claimed_at TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS voucher_redemptions (order_id TEXT PRIMARY KEY REFERENCES recharge_orders(order_id), role_id INTEGER NOT NULL REFERENCES roles(role_id), sku_id TEXT NOT NULL REFERENCES voucher_skus(sku_id), item_tid INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), amount_cents INTEGER NOT NULL CHECK(amount_cents>0), created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS game_mails_role_idx ON game_mails(role_id,deleted,send_time);
    CREATE INDEX IF NOT EXISTS voucher_grants_role_idx ON voucher_grants(role_id,claimed_at);
  `);
  const writeModel = model => {
    const { state, role, heroInfo, resources, lineups, playLineups } = model;
    const { modules, rolePb, guides = {}, lineups: ignored, ...metadata } = state;
    db.prepare('INSERT OR REPLACE INTO roles VALUES (?,?,?,?,?)').run(state.roleId, state.serverId, state.createdAt, JSON.stringify(role), JSON.stringify(metadata));
    const moduleInsert = db.prepare('INSERT OR REPLACE INTO login_modules VALUES (?,?,?)');
    for (const [key, value] of new Map(modules.value)) moduleInsert.run(state.roleId, key, JSON.stringify(value));
    for (const table of ['heroes', 'hero_cells', 'resources', 'guides']) db.prepare('DELETE FROM ' + table + ' WHERE role_id=?').run(state.roleId);
    const heroInsert = db.prepare('INSERT INTO heroes VALUES (?,?,?,?,?,?,?,?)');
    for (const hero of heroInfo.hero_list) heroInsert.run(state.roleId, String(hero.uid), String(hero.tid), hero.level ?? 1, hero.star ?? 0, hero.star_progress ?? 0, hero.breakthrough_level ?? 0, JSON.stringify(hero));
    const cellInsert = db.prepare('INSERT INTO hero_cells VALUES (?,?,?,?,?)');
    for (const cell of heroInfo.cell_list) cellInsert.run(state.roleId, cell.index, cell.level ?? 1, cell.break_level ?? 0, JSON.stringify(cell));
    const resourceInsert = db.prepare('INSERT INTO resources VALUES (?,?,?,?,?)');
    for (const { location, ...resource } of resources.values()) resourceInsert.run(state.roleId, String(resource.tid), String(resource.num), JSON.stringify(location), JSON.stringify(resource));
    db.prepare('INSERT OR REPLACE INTO lineups VALUES (?,?)').run(state.roleId, JSON.stringify(lineups));
    db.prepare('DELETE FROM play_lineups WHERE role_id=?').run(state.roleId);
    const playInsert = db.prepare('INSERT INTO play_lineups VALUES (?,?,?)');
    for (const lineup of playLineups) playInsert.run(state.roleId, lineup.type, JSON.stringify(lineup));
    const guideInsert = db.prepare('INSERT INTO guides VALUES (?,?,?)');
    for (const [key, process] of Object.entries(guides)) guideInsert.run(state.roleId, key, process);
  };
  try {
    if (!db.prepare('SELECT role_id FROM roles LIMIT 1').get()) {
      const hasLegacy = legacyStatePath && fs.existsSync(legacyStatePath);
      const state = hasLegacy ? JSON.parse(fs.readFileSync(legacyStatePath, 'utf8')) : seed();
      if (hasLegacy) {
        const backup = legacyStatePath.replace(/\.json$/, '') + '.pre-sqlite-backup.local-only.json';
        if (!fs.existsSync(backup)) fs.copyFileSync(legacyStatePath, backup, fs.constants.COPYFILE_EXCL);
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        writeModel(modelFromState(state, codec));
        db.prepare('INSERT INTO migrations VALUES (?,?,?)').run('initial-save-v1', hasLegacy ? path.basename(legacyStatePath) : 'offline-fixture', new Date().toISOString());
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 2) {
      db.exec('BEGIN IMMEDIATE');
      try {
        // Version 1 decoded the envelope as its nested role message. Repair only lineups.
        for (const row of db.prepare('SELECT role_id FROM roles').all()) {
          const snapshot = JSON.parse(db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=9').get(row.role_id).payload_json);
          const login = codec.unpack('pb_lineup_login', rawBinary(snapshot));
          if (version === 1) db.prepare('UPDATE lineups SET payload_json=? WHERE role_id=?').run(JSON.stringify(codec.unpack('pb_role_lineup', Buffer.from(login.pre_lineup, 'base64'))), row.role_id);
          const insert = db.prepare('INSERT OR IGNORE INTO play_lineups VALUES (?,?,?)');
          for (const bytes of login.lineups) { const lineup = codec.unpack('pb_lineup', Buffer.from(bytes, 'base64')); insert.run(row.role_id, lineup.type, JSON.stringify(lineup)); }
        }
        db.prepare('INSERT INTO migrations VALUES (?,?,?)').run('lineup-envelope-v2', 'preserved-login-module-9', new Date().toISOString());
        db.exec('PRAGMA user_version=2; COMMIT');
        version = 2;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 3) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('voucher-mail-v3', 'add-mail-and-voucher-ledger', new Date().toISOString());
        db.exec('PRAGMA user_version=3; COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
  } catch (error) { db.close(); throw error; }
  function read() {
    const row = db.prepare('SELECT * FROM roles LIMIT 1').get();
    const id = row.role_id;
    const state = { ...JSON.parse(row.metadata_json), roleId: id, serverId: row.server_id, createdAt: row.created_at,
      modules: { value: db.prepare('SELECT * FROM login_modules WHERE role_id=? ORDER BY module_id').all(id).map(module => [module.module_id, JSON.parse(module.payload_json)]), improper: false },
      guides: Object.fromEntries(db.prepare('SELECT * FROM guides WHERE role_id=?').all(id).map(guide => [guide.guide_key, guide.process_id])) };
    const hero_list = db.prepare('SELECT * FROM heroes WHERE role_id=? ORDER BY rowid').all(id).map(hero => ({ ...JSON.parse(hero.payload_json), uid: hero.uid, tid: hero.tid, level: hero.level, star: hero.star, star_progress: hero.star_progress, breakthrough_level: hero.break_level }));
    const cell_list = db.prepare('SELECT * FROM hero_cells WHERE role_id=? ORDER BY cell_index').all(id).map(cell => ({ ...JSON.parse(cell.payload_json), index: cell.cell_index, level: cell.level, break_level: cell.break_level }));
    const resources = new Map(db.prepare('SELECT * FROM resources WHERE role_id=?').all(id).map(resource => [resource.tid, { ...JSON.parse(resource.payload_json), tid: resource.tid, num: resource.amount, location: JSON.parse(resource.location_json) }]));
    return { state, role: JSON.parse(row.profile_json), heroInfo: { hero_list, cell_list }, resources, lineups: JSON.parse(db.prepare('SELECT payload_json FROM lineups WHERE role_id=?').get(id).payload_json),
      playLineups: db.prepare('SELECT payload_json FROM play_lineups WHERE role_id=? ORDER BY lineup_type').all(id).map(row => JSON.parse(row.payload_json)) };
  }
  return {
    databasePath, read,
    inspect(action) { return action(db); },
    state() { return materializeState(read(), codec); },
    transaction(action) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const model = read(), result = action(model, db);
        if (result && typeof result.then === 'function') throw new Error('Game transactions must be synchronous');
        writeModel(model); db.exec('COMMIT'); return result;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); }
  };
}
