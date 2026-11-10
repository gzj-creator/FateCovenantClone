import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import {
  MISSION_ENERGY_MODULE_ID,
  MISSION_ENERGY_SLOT,
  refreshEnergyResources
} from '../game/energy.mjs';
import {
  OFFLINE_FIXTURE_PASS_COUNT,
  OFFLINE_FIXTURE_STAMINA_TID,
  OFFLINE_FIXTURE_STARTER_ROLE_LEVEL,
  OFFLINE_FIXTURE_STARTER_STAMINA,
  rollbackPrematureOfflineFixtureMissionCursor
} from '../game/mission-progress.mjs';

const HERO_INFO_MODULE_ID = 10;

function synchronizeHeroInfoModule(modules, codec, heroInfo) {
  const module = modules.get(HERO_INFO_MODULE_ID);
  if (!module || !Array.isArray(module.value)) throw new Error('Hero login module 10 is unavailable');
  const values = [...module.value];
  while (!values.length) values.push(serializedBinary(Buffer.alloc(0)));
  values[0] = serializedBinary(codec.pack('pb_hero_info', heroInfo));
  modules.set(HERO_INFO_MODULE_ID, { ...module, value: values });
}

function modelFromState(state, codec) {
  const modules = new Map(state.modules.value);
  const heroes = codec.unpack('pb_hero_info', rawBinary(modules.get(10).value[0]));
  const resources = new Map();
  const add = (value, location) => {
    const tid = String(value.tid);
    if (resources.has(tid)) throw new Error('Duplicate resource in migration: ' + tid);
    resources.set(tid, { ...value, num: String(value.num ?? 0), location });
  };
  const energyModule = modules.get(MISSION_ENERGY_MODULE_ID);
  if (Array.isArray(energyModule?.value)) {
    const bytes = rawBinary(energyModule.value[MISSION_ENERGY_SLOT]);
    const energy = bytes.length ? codec.unpack('pb_role_energy_res', bytes) : { res: [] };
    (energy.res ?? []).forEach((value, entry) => add(value, [MISSION_ENERGY_MODULE_ID, MISSION_ENERGY_SLOT, entry]));
  }
  for (const [moduleId, index] of [[5, null], [10, 1]]) {
    const target = index === null ? modules.get(moduleId) : modules.get(moduleId).value[index];
    codec.unpack('pb_currency_data', rawBinary(target)).res_list.forEach((value, entry) => {
      // Mission stamina has its own EnergyRes container. Older local migrations
      // inserted it into the generic currency list, which the top bar ignores.
      if (moduleId === 5 && String(value.tid) === '100012900' && resources.has(String(value.tid))) return;
      add(value, [moduleId, index, entry]);
    });
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
  const currencies = new Map(), energyGroups = new Map();
  for (const resource of model.resources.values()) {
    const { location: [moduleId, group, entry], ...value } = resource;
    if (moduleId === MISSION_ENERGY_MODULE_ID && group === MISSION_ENERGY_SLOT) {
      const key = moduleId + ':' + group;
      if (!energyGroups.has(key)) {
        const target = modules.get(moduleId)?.value?.[group];
        const bytes = rawBinary(target);
        energyGroups.set(key, { moduleId, group, data: bytes.length ? codec.unpack('pb_role_energy_res', bytes) : { res: [] } });
      }
      const data = energyGroups.get(key).data;
      data.res ??= [];
      while (data.res.length <= entry) data.res.push({ tid: '', num: '0', produce_time: 0 });
      data.res[entry] = value;
    } else if (moduleId === 6) modules.get(6).value[group].value[entry] = serializedBinary(codec.pack('pb_res_obj', value));
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
  for (const { moduleId, group, data } of energyGroups.values()) {
    const module = modules.get(moduleId);
    if (!module || !Array.isArray(module.value)) throw new Error(`Energy login module ${moduleId} is unavailable`);
    while (module.value.length <= group) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[group] = serializedBinary(codec.pack('pb_role_energy_res', data));
  }
  state.modules.value = [...modules];
  return state;
}

function remapHeroId(value, idMap) {
  if (value === undefined || value === null) return value;
  const mapped = idMap.get(String(value));
  if (mapped === undefined) return value;
  return typeof value === 'string' ? mapped : Number(mapped);
}

function remapLineup(lineup, idMap) {
  for (const fighter of lineup?.fighter_list ?? []) fighter.hero_id = remapHeroId(fighter.hero_id, idMap);
  for (const team of lineup?.team_list ?? []) {
    for (const fighter of team.fighter_list ?? []) fighter.hero_id = remapHeroId(fighter.hero_id, idMap);
    for (const lease of team.lease_fighter_list ?? []) {
      lease.replace_hero_id = remapHeroId(lease.replace_hero_id, idMap);
      if (lease.hero) lease.hero.uid = remapHeroId(lease.hero.uid, idMap);
    }
  }
}

function remapRoleLineup(roleLineup, idMap) {
  for (const preset of [...(roleLineup?.pre_lineups ?? []), ...(roleLineup?.pre_lineups_standby ?? [])]) remapLineup(preset.lineup, idMap);
}

function assertLaunchProfile(db, expected) {
  const rows = db.prepare('SELECT role_id,server_id,metadata_json FROM roles ORDER BY role_id').all();
  if (!rows.length) return;
  for (const [index, row] of rows.entries()) {
    let metadata;
    try { metadata = JSON.parse(row.metadata_json); }
    catch { throw new Error(`Game database launch profile is unreadable for role ${row.role_id}`); }
    const mismatches = [];
    const compare = (label, actual, wanted) => {
      if (wanted != null && String(actual ?? '') !== String(wanted)) mismatches.push(`${label}=${actual ?? '<missing>'}`);
    };
    // A realm can now hold several accounts. The original launch-template role
    // is the lowest role id and keeps the configured id; later accounts get
    // their own role ids while sharing the realm launch metadata.
    if (index === 0) compare('roleId', row.role_id, expected.roleId);
    compare('serverId', row.server_id, expected.serverId);
    compare('serverName', metadata.serverName, expected.serverName);
    compare('roleName', metadata.roleName, expected.roleName);
    compare('launchProfileId', metadata.launchProfileId, expected.launchProfileId);
    compare('activityWindowAnchor', Number(metadata.activityWindowAnchor), expected.activityWindowAnchor);
    compare('serverOpenedAt', Number(metadata.serverOpenedAt), expected.serverOpenedAt);
    if (mismatches.length) {
      throw new Error(
        `Game database launch profile mismatch for role ${row.role_id}: ${mismatches.join(', ')}. ` +
        'Use the matching persistent data volume or an empty external data directory for this launch profile.'
      );
    }
  }
}

export function createGameStore({ databasePath, legacyStatePath, seed, codec, serverOpenedAt, launchProfile = null, now = Date.now }) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
  const clock = typeof now === 'function' ? now : () => now;
  const missionTables = readMissionTables();
  let version = db.prepare('PRAGMA user_version').get().user_version;
  if (version > 19) { db.close(); throw new Error('Unsupported game database schema: ' + version); }
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (role_id INTEGER PRIMARY KEY, server_id INTEGER NOT NULL, created_at INTEGER NOT NULL, profile_json TEXT NOT NULL, metadata_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      role_id INTEGER NOT NULL UNIQUE REFERENCES roles(role_id),
      login_code TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
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
    CREATE TABLE IF NOT EXISTS pending_rewards (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), source_key TEXT NOT NULL,
      item_tid INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0),
      res_type INTEGER, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','released')),
      created_at TEXT NOT NULL, released_at TEXT, PRIMARY KEY(role_id,source_key,item_tid));
    CREATE TABLE IF NOT EXISTS reward_claims (role_id INTEGER NOT NULL REFERENCES roles(role_id), claim_type TEXT NOT NULL, claim_key TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(role_id,claim_type,claim_key));
    CREATE TABLE IF NOT EXISTS voucher_skus (sku_id TEXT PRIMARY KEY, item_tid INTEGER NOT NULL UNIQUE, face_value_cents INTEGER NOT NULL CHECK(face_value_cents>0), title TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS game_mails (mail_id INTEGER PRIMARY KEY AUTOINCREMENT, role_id INTEGER NOT NULL REFERENCES roles(role_id), request_id TEXT NOT NULL, tid INTEGER NOT NULL DEFAULT 0, send_name TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, send_time INTEGER NOT NULL, expire_at INTEGER NOT NULL DEFAULT 0, read INTEGER NOT NULL DEFAULT 0, received INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, award_json TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(role_id,request_id));
    CREATE TABLE IF NOT EXISTS voucher_grants (grant_id TEXT PRIMARY KEY, mail_id INTEGER NOT NULL UNIQUE REFERENCES game_mails(mail_id), role_id INTEGER NOT NULL REFERENCES roles(role_id), sku_id TEXT NOT NULL REFERENCES voucher_skus(sku_id), item_tid INTEGER NOT NULL, face_value_cents INTEGER NOT NULL CHECK(face_value_cents>0), quantity INTEGER NOT NULL CHECK(quantity>0), claimed_at TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS voucher_redemptions (order_id TEXT PRIMARY KEY REFERENCES recharge_orders(order_id), role_id INTEGER NOT NULL REFERENCES roles(role_id), sku_id TEXT NOT NULL REFERENCES voucher_skus(sku_id), item_tid INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), amount_cents INTEGER NOT NULL CHECK(amount_cents>0), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fishing_activity_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), act_id INTEGER NOT NULL,
      get_num TEXT NOT NULL DEFAULT '0', high_size_list_json TEXT NOT NULL DEFAULT '[]',
      score TEXT NOT NULL DEFAULT '0', base_score TEXT NOT NULL DEFAULT '0',
      high_size TEXT NOT NULL DEFAULT '0', rod TEXT NOT NULL DEFAULT '0',
      weather_list_json TEXT NOT NULL DEFAULT '[]', book_state TEXT NOT NULL DEFAULT 'AA==',
      unlock_map_list_json TEXT NOT NULL DEFAULT '[]', level_state TEXT NOT NULL DEFAULT 'AA==',
      go_rank_reward INTEGER NOT NULL DEFAULT 0, have_rod_list_json TEXT NOT NULL DEFAULT '[]',
      get_money_num TEXT NOT NULL DEFAULT '0', wait_fish_json TEXT NOT NULL DEFAULT '{}',
      buy_limit_info_json TEXT NOT NULL DEFAULT '{}', progress_state TEXT NOT NULL DEFAULT 'AA==',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,act_id));
    CREATE TABLE IF NOT EXISTS activity_purchases (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), activity_id INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('gift','shop')), product_id INTEGER NOT NULL,
      buy_num INTEGER NOT NULL CHECK(buy_num>0), price_item_tid INTEGER NOT NULL,
      price_amount INTEGER NOT NULL CHECK(price_amount>=0), request_id TEXT NOT NULL,
      payload_json TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY(role_id,kind,request_id));
    CREATE TABLE IF NOT EXISTS cms_questions (
      question_id TEXT PRIMARY KEY, cms_tid INTEGER NOT NULL CHECK(cms_tid>0),
      title TEXT NOT NULL, link TEXT NOT NULL, award TEXT NOT NULL DEFAULT '',
      start_time INTEGER NOT NULL CHECK(start_time>=0),
      end_time INTEGER NOT NULL CHECK(end_time>start_time),
      enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
      created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS guild_nation_assists (
      assist_id TEXT PRIMARY KEY, guild_id TEXT NOT NULL,
      requester_role_id TEXT NOT NULL, target_type INTEGER NOT NULL,
      target_id INTEGER NOT NULL, max_num INTEGER NOT NULL CHECK(max_num>0),
      assist_num INTEGER NOT NULL DEFAULT 0 CHECK(assist_num>=0 AND assist_num<=max_num),
      finish_time INTEGER NOT NULL CHECK(finish_time>0),
      target_lv INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS game_mails_role_idx ON game_mails(role_id,deleted,send_time);
    CREATE INDEX IF NOT EXISTS voucher_grants_role_idx ON voucher_grants(role_id,claimed_at);
    CREATE INDEX IF NOT EXISTS activity_purchases_product_idx ON activity_purchases(role_id,activity_id,kind,product_id);
    CREATE INDEX IF NOT EXISTS pending_rewards_role_idx ON pending_rewards(role_id,status,item_tid);
    CREATE INDEX IF NOT EXISTS cms_questions_active_idx ON cms_questions(cms_tid,enabled,start_time,end_time);
    CREATE INDEX IF NOT EXISTS guild_nation_assists_active_idx ON guild_nation_assists(guild_id,finish_time,assist_num,max_num);
    -- BATTLE-CORE (task/BATTLE-CORE-20261108). Additive tables only: they hold the
    -- pass record / vote log, the common map node progress and the star mission
    -- bit blocks. No data migration is required, so the schema version stays at
    -- 16; every statement is idempotent and reruns on each open.
    CREATE TABLE IF NOT EXISTS battle_pass_records (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), pass_tid INTEGER NOT NULL,
      business_id INTEGER NOT NULL, pass_type INTEGER NOT NULL, fight_id INTEGER NOT NULL,
      pass_score INTEGER NOT NULL DEFAULT 0, sub_pass_score INTEGER NOT NULL DEFAULT 0,
      lineup_json TEXT NOT NULL DEFAULT '{}', show_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL, PRIMARY KEY(role_id,pass_tid,business_id,fight_id));
    CREATE TABLE IF NOT EXISTS battle_pass_votes (
      pass_tid INTEGER NOT NULL, business_id INTEGER NOT NULL, fight_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL REFERENCES roles(role_id), up_vote INTEGER NOT NULL CHECK(up_vote IN (0,1)),
      created_at TEXT NOT NULL, PRIMARY KEY(role_id,pass_tid,business_id,fight_id));
    -- Retained for schema continuity but unused: CommonMapCmd 90601-90603 fail
    -- closed because the shipped CommonMapTable has no map instances.
    CREATE TABLE IF NOT EXISTS common_map_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), map_tid INTEGER NOT NULL,
      map_json TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,map_tid));
    -- StarMissionTable is keyed by activity version, and every chapter (and the
    -- skill tree) keeps its own state, so both tables are keyed by version.
    CREATE TABLE IF NOT EXISTS star_mission_chapter_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), version INTEGER NOT NULL,
      chapter INTEGER NOT NULL, star_bits TEXT NOT NULL DEFAULT '',
      award_bits TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id,version,chapter));
    CREATE TABLE IF NOT EXISTS star_mission_skill_state (
      role_id INTEGER NOT NULL REFERENCES roles(role_id), version INTEGER NOT NULL,
      skills_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL,
      PRIMARY KEY(role_id,version));
    CREATE INDEX IF NOT EXISTS battle_pass_records_lookup_idx ON battle_pass_records(pass_tid,business_id,pass_score);
  `);
  if (launchProfile) {
    try { assertLaunchProfile(db, launchProfile); }
    catch (error) { db.close(); throw error; }
  }
  const writeModel = model => {
    const { state, role, heroInfo, resources, lineups, playLineups } = model;
    const { modules, rolePb, guides = {}, lineups: ignored, ...metadata } = state;
    db.prepare('INSERT OR REPLACE INTO roles VALUES (?,?,?,?,?)').run(state.roleId, state.serverId, state.createdAt, JSON.stringify(role), JSON.stringify(metadata));
    const moduleInsert = db.prepare('INSERT OR REPLACE INTO login_modules VALUES (?,?,?)');
    const storedModules = new Map(modules.value);
    synchronizeHeroInfoModule(storedModules, codec, heroInfo);
    for (const [key, value] of storedModules) moduleInsert.run(state.roleId, key, JSON.stringify(value));
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
    if (version < 4) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('reward-claims-v4', 'add-generic-reward-idempotency', new Date().toISOString());
        db.exec('PRAGMA user_version=4; COMMIT');
        version = 4;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 5) {
      db.exec('BEGIN IMMEDIATE');
      try {
        // v4 stored a claimed linear task's progress as snapshot_val. Because
        // all LinearTask rows share one taskMap entry per type, that mission-id
        // baseline was later subtracted from unrelated statistic counters and
        // produced values such as 40 - 40210 = -40170. A claimed task does not
        // need a baseline; clear legacy values so the client falls back to the
        // live statistics total.
        for (const row of db.prepare('SELECT role_id,payload_json FROM login_modules WHERE module_id=90').all()) {
          const module = JSON.parse(row.payload_json);
          let changed = false;
          for (let index = 0; index < (module.value?.length ?? 0); index++) {
            const bytes = rawBinary(module.value[index]);
            if (!bytes.length) continue;
            const data = codec.unpack('pb_linear_task_data', bytes);
            let slotChanged = false;
            for (const task of data.task_list ?? []) {
              if (Number(task.snapshot_val ?? 0) !== 0) { task.snapshot_val = 0; slotChanged = true; }
            }
            if (slotChanged) { module.value[index] = serializedBinary(codec.pack('pb_linear_task_data', data)); changed = true; }
          }
          if (changed) db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=90').run(JSON.stringify(module), row.role_id);
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('linear-task-snapshot-v5', 'clear-stale-linear-task-baselines', new Date().toISOString());
        db.exec('PRAGMA user_version=5; COMMIT');
        version = 5;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 6) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('fishing-activity-state-v6', 'add-persistent-fishing-island-state', new Date().toISOString());
        db.exec('PRAGMA user_version=6; COMMIT');
        version = 6;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 7) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const requested = Number(serverOpenedAt);
        const rows = db.prepare('SELECT role_id,created_at,metadata_json FROM roles').all();
        let openedAt = Number.isSafeInteger(requested) && requested > 0 ? requested : null;
        if (!openedAt) {
          for (const row of rows) {
            const value = Number(JSON.parse(row.metadata_json).serverOpenedAt);
            if (Number.isSafeInteger(value) && value > 0) { openedAt = value; break; }
          }
        }
        if (!openedAt && rows.length) openedAt = Math.min(...rows.map(row => Number(row.created_at)));
        if (!openedAt) throw new Error('Server opening time is missing');
        const update = db.prepare('UPDATE roles SET metadata_json=? WHERE role_id=?');
        for (const row of rows) {
          const metadata = JSON.parse(row.metadata_json);
          metadata.serverOpenedAt = openedAt;
          update.run(JSON.stringify(metadata), row.role_id);
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('activity-calendar-server-open-v7', 'persist-local-server-opening-time', new Date().toISOString());
        db.exec('PRAGMA user_version=7; COMMIT');
        version = 7;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 8) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('pet-activity-commerce-v8', 'add-activity-shop-and-gift-purchases', new Date().toISOString());
        db.exec('PRAGMA user_version=8; COMMIT');
        version = 8;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 9) {
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const role of db.prepare('SELECT role_id FROM roles').all()) {
          const rows = db.prepare('SELECT rowid,uid,tid,level,star,star_progress,break_level,payload_json FROM heroes WHERE role_id=? ORDER BY rowid').all(role.role_id);
          const idMap = new Map(), tids = new Set(), normalized = [];
          for (const row of rows) {
            const uid = String(row.uid), tid = String(row.tid);
            if (tids.has(tid)) throw new Error(`Duplicate hero tid ${tid} for role ${role.role_id}`);
            tids.add(tid);
            idMap.set(uid, tid);
            const payload = JSON.parse(row.payload_json);
            payload.uid = tid; payload.tid = tid;
            normalized.push({ ...row, uid: tid, tid, payload_json: JSON.stringify(payload) });
          }
          db.prepare('DELETE FROM heroes WHERE role_id=?').run(role.role_id);
          const insertHero = db.prepare('INSERT INTO heroes VALUES (?,?,?,?,?,?,?,?)');
          for (const row of normalized) insertHero.run(role.role_id, row.uid, row.tid, row.level, row.star, row.star_progress, row.break_level, row.payload_json);

          const lineupRow = db.prepare('SELECT payload_json FROM lineups WHERE role_id=?').get(role.role_id);
          const roleLineup = JSON.parse(lineupRow.payload_json);
          remapRoleLineup(roleLineup, idMap);
          db.prepare('UPDATE lineups SET payload_json=? WHERE role_id=?').run(JSON.stringify(roleLineup), role.role_id);
          const playRows = db.prepare('SELECT lineup_type,payload_json FROM play_lineups WHERE role_id=? ORDER BY lineup_type').all(role.role_id);
          const playLineups = playRows.map(row => JSON.parse(row.payload_json));
          const updatePlay = db.prepare('UPDATE play_lineups SET payload_json=? WHERE role_id=? AND lineup_type=?');
          for (const lineup of playLineups) { remapLineup(lineup, idMap); updatePlay.run(JSON.stringify(lineup), role.role_id, lineup.type); }

          const module9Row = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=9').get(role.role_id);
          if (module9Row) {
            const login = codec.unpack('pb_lineup_login', rawBinary(JSON.parse(module9Row.payload_json)));
            login.pre_lineup = codec.pack('pb_role_lineup', roleLineup).toString('base64');
            login.lineups = playLineups.map(lineup => codec.pack('pb_lineup', lineup).toString('base64'));
            if (login.custom_pre_lineup) {
              const custom = codec.unpack('pb_custom_lineup_role', Buffer.from(login.custom_pre_lineup, 'base64'));
              for (const item of custom.custom_pre_lineups ?? []) remapLineup(item.lineup, idMap);
              login.custom_pre_lineup = codec.pack('pb_custom_lineup_role', custom).toString('base64');
            }
            db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=9').run(JSON.stringify(serializedBinary(codec.pack('pb_lineup_login', login))), role.role_id);
          }

          const module10Row = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=10').get(role.role_id);
          if (module10Row) {
            const module10 = JSON.parse(module10Row.payload_json);
            const cells = codec.unpack('pb_hero_info', rawBinary(module10.value[0])).cell_list;
            module10.value[0] = serializedBinary(codec.pack('pb_hero_info', { hero_list: normalized.map(row => JSON.parse(row.payload_json)), cell_list: cells }));
            db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=10').run(JSON.stringify(module10), role.role_id);
          }
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('hero-identity-v9', 'align-client-hero-uid-with-tid', new Date().toISOString());
        db.exec('PRAGMA user_version=9; COMMIT');
        version = 9;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 10) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('pending-rewards-v10', 'retain rewards for unsupported gameplay domains', new Date().toISOString());
        db.exec('PRAGMA user_version=10; COMMIT');
        version = 10;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 11) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('login-business-reads-v11', 'add CMS questions and guild nation assist reads', new Date().toISOString());
        db.exec('PRAGMA user_version=11; COMMIT');
        version = 11;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 12) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const initial = db.prepare("SELECT source FROM migrations WHERE name='initial-save-v1'").get();
        const source = initial?.source === 'offline-fixture'
          ? 'offline-fixture; preserved-last-cleared-cursor'
          : `${initial?.source ?? 'unknown'}; preserved`;
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('mission-cursor-next-v12', source, new Date().toISOString());
        db.exec('PRAGMA user_version=12; COMMIT');
        version = 12;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 13) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const initial = db.prepare("SELECT source FROM migrations WHERE name='initial-save-v1'").get();
        const prior = db.prepare("SELECT source FROM migrations WHERE name='mission-cursor-next-v12'").get();
        let reverted = 0;
        if (initial?.source === 'offline-fixture' && String(prior?.source ?? '').startsWith('offline-fixture; repaired-cursors=')) {
          const sections = readMissionTables().sections;
          const update = db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=8');
          const hasClearReward = db.prepare("SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type='mission_first_clear' AND claim_key=?");
          for (const row of db.prepare('SELECT role_id,payload_json FROM login_modules WHERE module_id=8').all()) {
            const module = JSON.parse(row.payload_json);
            if (!Array.isArray(module.value) || !module.value[0]) continue;
            const mission = codec.unpack('pb_mission', rawBinary(module.value[0]));
            const missionId = String(mission.mission_id ?? '');
            const passCount = Number(mission.pass_count?.count ?? -1);
            if (passCount !== OFFLINE_FIXTURE_PASS_COUNT || hasClearReward.get(row.role_id, missionId)) continue;
            if (!rollbackPrematureOfflineFixtureMissionCursor(mission, sections)) continue;
            module.value[0] = serializedBinary(codec.pack('pb_mission', mission));
            update.run(JSON.stringify(module), row.role_id);
            reverted++;
          }
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run('mission-cursor-last-cleared-v13', `premature-v12-reverted=${reverted}`, new Date().toISOString());
        db.exec('PRAGMA user_version=13; COMMIT');
        version = 13;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 14) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const initial = db.prepare("SELECT source FROM migrations WHERE name='initial-save-v1'").get();
        let restored = 0;
        if (initial?.source === 'offline-fixture') {
          const insert = db.prepare('INSERT INTO resources VALUES (?,?,?,?,?)');
          for (const row of db.prepare('SELECT role_id,profile_json FROM roles').all()) {
            const level = Number(JSON.parse(row.profile_json).level);
            if (level !== OFFLINE_FIXTURE_STARTER_ROLE_LEVEL) continue;
            if (db.prepare('SELECT 1 FROM resources WHERE role_id=? AND tid=?').get(row.role_id, OFFLINE_FIXTURE_STAMINA_TID)) continue;

            const moduleRow = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=5').get(row.role_id);
            if (!moduleRow) continue;
            const module = JSON.parse(moduleRow.payload_json);
            const currency = codec.unpack('pb_currency_data', rawBinary(module));
            const resList = currency.res_list ?? [];
            let entry = resList.findIndex(value => String(value?.tid) === OFFLINE_FIXTURE_STAMINA_TID);
            if (entry < 0) entry = resList.length;
            const payload = { tid: OFFLINE_FIXTURE_STAMINA_TID, num: String(OFFLINE_FIXTURE_STARTER_STAMINA) };
            insert.run(row.role_id, OFFLINE_FIXTURE_STAMINA_TID, payload.num, JSON.stringify([5, null, entry]), JSON.stringify(payload));
            restored++;
          }
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run(
          'offline-fixture-starter-stamina-v14',
          `missing-level-9-stamina-restored=${restored}; amount=${OFFLINE_FIXTURE_STARTER_STAMINA}`,
          new Date().toISOString()
        );
        db.exec('PRAGMA user_version=14; COMMIT');
        version = 14;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 15) {
      db.exec('BEGIN IMMEDIATE');
      try {
        let moved = 0, resetProduceTime = 0;
        const updateModule = db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=?');
        const updateCurrency = db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=5');
        const selectResource = db.prepare('SELECT * FROM resources WHERE role_id=? AND tid=?');
        const writeResource = db.prepare('INSERT OR REPLACE INTO resources VALUES (?,?,?,?,?)');
        const nowSeconds = Math.floor(Number(clock()) / 1000);
        for (const role of db.prepare('SELECT role_id FROM roles').all()) {
          const roleId = role.role_id;
          const moduleRow = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=?').get(roleId, MISSION_ENERGY_MODULE_ID);
          if (!moduleRow) continue;
          const missionModule = JSON.parse(moduleRow.payload_json);
          if (!Array.isArray(missionModule.value)) continue;
          while (missionModule.value.length <= MISSION_ENERGY_SLOT) missionModule.value.push(serializedBinary(Buffer.alloc(0)));
          const slotBytes = rawBinary(missionModule.value[MISSION_ENERGY_SLOT]);
          const energy = slotBytes.length ? codec.unpack('pb_role_energy_res', slotBytes) : { res: [] };
          energy.res ??= [];

          const resourceRow = selectResource.get(roleId, '100012900');
          let entry = energy.res.findIndex(value => String(value?.tid) === '100012900');
          if (!resourceRow && entry < 0) continue;
          if (entry < 0) {
            entry = energy.res.length;
            energy.res.push({ tid: '100012900', num: '0', produce_time: nowSeconds });
          }
          const payload = resourceRow ? JSON.parse(resourceRow.payload_json) : { ...energy.res[entry] };
          const amount = String(resourceRow?.amount ?? energy.res[entry].num ?? 0);
          const oldLocation = resourceRow ? JSON.parse(resourceRow.location_json) : null;
          const oldProduceTime = Number(payload.produce_time ?? energy.res[entry].produce_time ?? 0);
          const canonicalRecent = Array.isArray(oldLocation)
            && oldLocation[0] === MISSION_ENERGY_MODULE_ID
            && oldLocation[1] === MISSION_ENERGY_SLOT
            && Number.isSafeInteger(oldProduceTime)
            && oldProduceTime > 0
            && oldProduceTime <= nowSeconds
            && nowSeconds - oldProduceTime < 86400;
          const produceTime = canonicalRecent ? oldProduceTime : nowSeconds;
          if (!canonicalRecent) resetProduceTime++;
          energy.res[entry] = { tid: '100012900', num: amount, produce_time: produceTime };
          missionModule.value[MISSION_ENERGY_SLOT] = serializedBinary(codec.pack('pb_role_energy_res', energy));
          updateModule.run(JSON.stringify(missionModule), roleId, MISSION_ENERGY_MODULE_ID);

          const resourcePayload = { tid: '100012900', num: amount, produce_time: produceTime };
          writeResource.run(roleId, '100012900', amount,
            JSON.stringify([MISSION_ENERGY_MODULE_ID, MISSION_ENERGY_SLOT, entry]), JSON.stringify(resourcePayload));

          const currencyRow = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=5').get(roleId);
          if (currencyRow) {
            const currency = codec.unpack('pb_currency_data', rawBinary(JSON.parse(currencyRow.payload_json)));
            const filtered = (currency.res_list ?? []).filter(value => String(value?.tid) !== '100012900');
            if (filtered.length !== (currency.res_list ?? []).length) {
              currency.res_list = filtered;
              updateCurrency.run(JSON.stringify(serializedBinary(codec.pack('pb_currency_data', currency))), roleId);
            }
          }
          moved++;
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run(
          'mission-energy-login-v15',
          `normalized=${moved}; produce-time-reset=${resetProduceTime}`,
          new Date(clock()).toISOString()
        );
        db.exec('PRAGMA user_version=15; COMMIT');
        version = 15;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 16) {
      db.exec('BEGIN IMMEDIATE');
      try {
        let synchronized = 0;
        const updateModule = db.prepare('UPDATE login_modules SET payload_json=? WHERE role_id=? AND module_id=10');
        for (const role of db.prepare('SELECT role_id FROM roles').all()) {
          const moduleRow = db.prepare('SELECT payload_json FROM login_modules WHERE role_id=? AND module_id=10').get(role.role_id);
          if (!moduleRow) continue;
          const hero_list = db.prepare('SELECT * FROM heroes WHERE role_id=? ORDER BY rowid').all(role.role_id).map(row => ({
            ...JSON.parse(row.payload_json), uid: row.uid, tid: row.tid, level: row.level,
            star: row.star, star_progress: row.star_progress, breakthrough_level: row.break_level
          }));
          const cell_list = db.prepare('SELECT * FROM hero_cells WHERE role_id=? ORDER BY cell_index').all(role.role_id).map(row => ({
            ...JSON.parse(row.payload_json), index: row.cell_index, level: row.level, break_level: row.break_level
          }));
          const modules = new Map([[HERO_INFO_MODULE_ID, JSON.parse(moduleRow.payload_json)]]);
          synchronizeHeroInfoModule(modules, codec, { hero_list, cell_list });
          updateModule.run(JSON.stringify(modules.get(HERO_INFO_MODULE_ID)), role.role_id);
          synchronized++;
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run(
          'hero-login-snapshot-v16',
          `synchronized-roles=${synchronized}; authoritative=heroes,hero_cells`,
          new Date(clock()).toISOString()
        );
        db.exec('PRAGMA user_version=16; COMMIT');
        version = 16;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 17) {
      db.exec('BEGIN IMMEDIATE');
      try {
        // Block J (ROLE-*) authorities. Every table is keyed by role and holds
        // only server-side state that the owning service mutates inside store
        // transactions; role profile fields keep living in roles.profile_json so
        // their login snapshot stays byte-identical to the client contract.
        db.exec(`
          CREATE TABLE IF NOT EXISTS role_profile_extra (
            role_id INTEGER PRIMARY KEY REFERENCES roles(role_id),
            sundry_json TEXT NOT NULL DEFAULT '{}',
            recommend_lv INTEGER NOT NULL DEFAULT 0,
            veteran_json TEXT NOT NULL DEFAULT '{}',
            pass_all_mission_at INTEGER NOT NULL DEFAULT 0,
            watch_video_day TEXT,
            updated_at TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS role_stories (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), story_id INTEGER NOT NULL,
            status TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,story_id));
          CREATE TABLE IF NOT EXISTS role_red_dots (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), path_key TEXT NOT NULL,
            state INTEGER NOT NULL DEFAULT 0, show_count INTEGER NOT NULL DEFAULT 0,
            extra_bin BLOB, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,path_key));
          CREATE TABLE IF NOT EXISTS role_channel_push (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), message_id INTEGER NOT NULL,
            is_open INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,message_id));
          CREATE TABLE IF NOT EXISTS client_diagnostic_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT, role_id INTEGER NOT NULL REFERENCES roles(role_id),
            day_count INTEGER NOT NULL DEFAULT 0, description TEXT NOT NULL,
            payload_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS cdkey_redemptions (
            code TEXT NOT NULL, role_id INTEGER NOT NULL REFERENCES roles(role_id), bag_id TEXT NOT NULL,
            created_at TEXT NOT NULL, PRIMARY KEY(code,role_id));
          CREATE TABLE IF NOT EXISTS role_figure_items (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), kind TEXT NOT NULL, tid INTEGER NOT NULL,
            expire_time INTEGER NOT NULL DEFAULT 0, red INTEGER NOT NULL DEFAULT 0,
            source TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(role_id,kind,tid));
          CREATE TABLE IF NOT EXISTS role_skins (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), skin_tid INTEGER NOT NULL,
            num INTEGER NOT NULL DEFAULT 1, increase_level INTEGER NOT NULL DEFAULT 0,
            source TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
            PRIMARY KEY(role_id,skin_tid));
          CREATE TABLE IF NOT EXISTS hero_skin_wear (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), hero_uid TEXT NOT NULL,
            skin_tid INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,hero_uid));
          CREATE TABLE IF NOT EXISTS role_skin_state (
            role_id INTEGER PRIMARY KEY REFERENCES roles(role_id),
            pending_exchange_skin INTEGER NOT NULL DEFAULT 0,
            ignore_fantasy_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS role_skin_handbook (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), handbook_id INTEGER NOT NULL,
            created_at TEXT NOT NULL, PRIMARY KEY(role_id,handbook_id));
          CREATE TABLE IF NOT EXISTS role_activity_stages (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), act_id INTEGER NOT NULL,
            stage_id INTEGER NOT NULL DEFAULT 0, state_id INTEGER NOT NULL DEFAULT 50,
            enter_time INTEGER NOT NULL DEFAULT 0, loop_count INTEGER NOT NULL DEFAULT 0,
            is_pause INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, PRIMARY KEY(role_id,act_id));
          CREATE TABLE IF NOT EXISTS gm_audit_entries (
            entry_id INTEGER PRIMARY KEY AUTOINCREMENT, role_id INTEGER NOT NULL REFERENCES roles(role_id),
            command TEXT NOT NULL, detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL);
          CREATE INDEX IF NOT EXISTS client_diagnostic_logs_role_idx ON client_diagnostic_logs(role_id,created_at);
          CREATE INDEX IF NOT EXISTS role_red_dots_role_idx ON role_red_dots(role_id,state);
        `);
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run(
          'role-support-block-j-v17',
          'role profile extras, stories, red dots, channel push, client logs, cdkeys, skins, activity stages, gm audit',
          new Date(clock()).toISOString()
        );
        db.exec('PRAGMA user_version=17; COMMIT');
        version = 17;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 18) {
      db.exec('BEGIN IMMEDIATE');
      try {
        // v1 of the star mission state stored one row per activity id with a
        // single star/award bit block. The shipped StarMissionTable is keyed by
        // activity *version* and every chapter keeps its own star block, so the
        // old column set cannot hold the real data. It only ever received
        // fixture rows, never a claim a running client could make, so it is
        // dropped rather than reinterpreted.
        const legacy = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='star_mission_state'").get();
        const dropped = legacy ? legacy.name : null;
        if (dropped) db.exec('DROP TABLE star_mission_state');
        db.exec(`
          CREATE TABLE IF NOT EXISTS star_mission_chapter_state (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), version INTEGER NOT NULL,
            chapter INTEGER NOT NULL, star_bits TEXT NOT NULL DEFAULT '',
            award_bits TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL,
            PRIMARY KEY(role_id,version,chapter));
          CREATE TABLE IF NOT EXISTS star_mission_skill_state (
            role_id INTEGER NOT NULL REFERENCES roles(role_id), version INTEGER NOT NULL,
            skills_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL,
            PRIMARY KEY(role_id,version));
        `);
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run(
          'star-mission-version-key-v18',
          dropped ? 'dropped-activity-keyed-star_mission_state' : 'created-version-keyed-star-mission-state',
          new Date(clock()).toISOString()
        );
        db.exec('PRAGMA user_version=18; COMMIT');
        version = 18;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if (version < 19) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const existing = db.prepare('SELECT account_id,role_id FROM local_wallets ORDER BY role_id').all();
        const insert = db.prepare(`INSERT OR IGNORE INTO accounts
          (account_id,role_id,login_code,phone,created_at,updated_at) VALUES (?,?,?,?,?,?)`);
        const timestamp = new Date(clock()).toISOString();
        for (const row of existing) {
          const match = /^local-phone-([0-9]{11})$/.exec(row.account_id);
          insert.run(row.account_id, row.role_id, row.account_id, match?.[1] ?? '', timestamp, timestamp);
        }
        db.prepare('INSERT OR IGNORE INTO migrations VALUES (?,?,?)').run(
          'multi-account-role-isolation-v19',
          'add-accounts-and-preserve-local-1-role',
          timestamp
        );
        db.exec('PRAGMA user_version=19; COMMIT');
        version = 19;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
  } catch (error) { db.close(); throw error; }

  const roleContext = new AsyncLocalStorage();
  function defaultRoleId() {
    const row = db.prepare('SELECT role_id FROM roles ORDER BY role_id LIMIT 1').get();
    if (!row) throw new Error('Game database has no role');
    return Number(row.role_id);
  }
  function activeRoleId(explicitRoleId) {
    const candidate = explicitRoleId ?? roleContext.getStore()?.roleId;
    if (candidate === undefined || candidate === null) return defaultRoleId();
    const id = Number(candidate);
    if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError('roleId must be a positive integer');
    return id;
  }
  function accountRow(accountId) {
    if (typeof accountId !== 'string' || accountId.length === 0) return null;
    return db.prepare('SELECT * FROM accounts WHERE account_id=?').get(accountId) ?? null;
  }
  function read(explicitRoleId) {
    const id = activeRoleId(explicitRoleId);
    const row = db.prepare('SELECT * FROM roles WHERE role_id=?').get(id);
    if (!row) throw new Error('Unknown role ' + id);
    const metadata = JSON.parse(row.metadata_json);
    const state = { ...metadata, roleId: id, serverId: row.server_id, createdAt: row.created_at,
      serverOpenedAt: Number(metadata.serverOpenedAt ?? row.created_at),
      modules: { value: db.prepare('SELECT * FROM login_modules WHERE role_id=? ORDER BY module_id').all(id).map(module => [module.module_id, JSON.parse(module.payload_json)]), improper: false },
      guides: Object.fromEntries(db.prepare('SELECT * FROM guides WHERE role_id=?').all(id).map(guide => [guide.guide_key, guide.process_id])) };
    const hero_list = db.prepare('SELECT * FROM heroes WHERE role_id=? ORDER BY rowid').all(id).map(hero => ({ ...JSON.parse(hero.payload_json), uid: hero.uid, tid: hero.tid, level: hero.level, star: hero.star, star_progress: hero.star_progress, breakthrough_level: hero.break_level }));
    const cell_list = db.prepare('SELECT * FROM hero_cells WHERE role_id=? ORDER BY cell_index').all(id).map(cell => ({ ...JSON.parse(cell.payload_json), index: cell.cell_index, level: cell.level, break_level: cell.break_level }));
    const resources = new Map(db.prepare('SELECT * FROM resources WHERE role_id=?').all(id).map(resource => [resource.tid, { ...JSON.parse(resource.payload_json), tid: resource.tid, num: resource.amount, location: JSON.parse(resource.location_json) }]));
    return { state, role: JSON.parse(row.profile_json), heroInfo: { hero_list, cell_list }, resources, lineups: JSON.parse(db.prepare('SELECT payload_json FROM lineups WHERE role_id=?').get(id).payload_json),
      playLineups: db.prepare('SELECT payload_json FROM play_lineups WHERE role_id=? ORDER BY lineup_type').all(id).map(row => JSON.parse(row.payload_json)) };
  }
  function resolveAccount(accountId, { loginCode = accountId, phone = '' } = {}) {
    if (typeof accountId !== 'string' || accountId.length === 0 || accountId.length > 512) {
      throw new TypeError('accountId must be a nonempty string of at most 512 characters');
    }
    const current = accountRow(accountId);
    if (current) return { accountId, roleId: Number(current.role_id), created: false };
    const wallet = db.prepare('SELECT role_id FROM local_wallets WHERE account_id=?').get(accountId);
    if (wallet) {
      const timestamp = new Date(clock()).toISOString();
      db.prepare(`INSERT OR IGNORE INTO accounts
        (account_id,role_id,login_code,phone,created_at,updated_at) VALUES (?,?,?,?,?,?)`)
        .run(accountId, wallet.role_id, loginCode, phone, timestamp, timestamp);
      return { accountId, roleId: Number(wallet.role_id), created: false };
    }
    db.exec('BEGIN IMMEDIATE');
    try {
      const raced = accountRow(accountId);
      if (raced) {
        db.exec('COMMIT');
        return { accountId, roleId: Number(raced.role_id), created: false };
      }
      const nextRoleId = Number(db.prepare('SELECT coalesce(max(role_id),0)+1 AS id FROM roles').get().id);
      if (!Number.isSafeInteger(nextRoleId) || nextRoleId <= 0) throw new Error('Unable to allocate a role id');
      const state = seed();
      state.roleId = nextRoleId;
      state.createdAt = Math.floor(clock() / 1000);
      const role = codec.unpack('to_client_role_info', Buffer.from(state.rolePb, 'base64'));
      role.level = 1;
      role.create_time = state.createdAt;
      role.level_reward_record = 0;
      state.rolePb = codec.pack('to_client_role_info', role).toString('base64');
      writeModel(modelFromState(state, codec));
      const timestamp = new Date(clock()).toISOString();
      db.prepare(`INSERT INTO accounts
        (account_id,role_id,login_code,phone,created_at,updated_at) VALUES (?,?,?,?,?,?)`)
        .run(accountId, nextRoleId, loginCode, phone, timestamp, timestamp);
      db.exec('COMMIT');
      return { accountId, roleId: nextRoleId, created: true };
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  function roleForAccount(accountId) {
    const row = accountRow(accountId);
    if (!row) throw new Error('Unknown game account ' + accountId);
    return Number(row.role_id);
  }
  function accountForRole(roleId = activeRoleId()) {
    const row = db.prepare('SELECT account_id,login_code,phone FROM accounts WHERE role_id=?').get(activeRoleId(roleId));
    return row ? { accountId: row.account_id, loginCode: row.login_code, phone: row.phone } : null;
  }
  const initialModel = read();
  return {
    databasePath, read, resolveAccount, roleForAccount, accountForRole,
    runWithRole(roleId, action) {
      const id = activeRoleId(roleId);
      if (!db.prepare('SELECT 1 FROM roles WHERE role_id=?').get(id)) throw new Error('Unknown role ' + id);
      if (typeof action !== 'function') throw new TypeError('role action must be a function');
      return roleContext.run({ roleId: id }, action);
    },
    currentRoleId() { return activeRoleId(); },
    currentAccountId() { return accountForRole(activeRoleId())?.accountId ?? null; },
    serverId: Number(initialModel.state.serverId),
    serverOpenedAt: Number(initialModel.state.serverOpenedAt),
    inspect(action) { return action(db); },
    state(roleId) {
      const model = read(roleId);
      refreshEnergyResources(model, { missionTables, now: clock });
      return materializeState(model, codec);
    },
    transaction(action, roleId) {
      const id = activeRoleId(roleId);
      db.exec('BEGIN IMMEDIATE');
      try {
        const model = read(id), result = action(model, db);
        if (result && typeof result.then === 'function') throw new Error('Game transactions must be synchronous');
        writeModel(model); db.exec('COMMIT'); return result;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); }
  };
}
