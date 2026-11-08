import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { termInt, termText, termArray } from './role-service.mjs';

const SUPPORTED = new Set([76003, 76004, 76005, 76006, 76007, 76008, 76009]);

export function createSkinService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const stamp = () => new Date(now()).toISOString();

  function ownedSkins(db, roleId) {
    return db.prepare('SELECT * FROM role_skins WHERE role_id=? ORDER BY skin_tid').all(roleId);
  }

  function stateRow(db, roleId) {
    let row = db.prepare('SELECT * FROM role_skin_state WHERE role_id=?').get(roleId);
    if (!row) {
      db.prepare('INSERT INTO role_skin_state (role_id,updated_at) VALUES (?,?)').run(roleId, stamp());
      row = db.prepare('SELECT * FROM role_skin_state WHERE role_id=?').get(roleId);
    }
    return row;
  }

  function wear(request) {
    const heroUid = String(request?.hero_uid ?? '0');
    const skinTid = Number(request?.skin_tid ?? 0);
    if (!/^[0-9]+$/.test(heroUid) || heroUid === '0') throw new GameError(1, 'Invalid hero uid');
    return store.transaction((model, db) => {
      const hero = model.heroInfo.hero_list.find(row => String(row.uid) === heroUid);
      if (!hero) throw new GameError(3001, 'Hero does not exist');
      if (skinTid !== 0) {
        const owned = db.prepare('SELECT 1 FROM role_skins WHERE role_id=? AND skin_tid=?').get(model.state.roleId, skinTid);
        if (!owned) throw new GameError(420, 'Skin is not owned');
      }
      db.prepare('INSERT OR REPLACE INTO hero_skin_wear (role_id,hero_uid,skin_tid,updated_at) VALUES (?,?,?,?)')
        .run(model.state.roleId, heroUid, skinTid, stamp());
      return { value: { heroUid, skinTid }, data: codec.pack('pb_skin_wear_back', { hero_uid: heroUid, skin_tid: skinTid }) };
    });
  }

  function chooseExchange(input) {
    const skinTid = termInt(input);
    if (skinTid === null || skinTid <= 0) throw new GameError(1, 'Invalid skin choice');
    return store.transaction((model, db) => {
      stateRow(db, model.state.roleId);
      db.prepare('UPDATE role_skin_state SET pending_exchange_skin=?,updated_at=? WHERE role_id=?')
        .run(skinTid, stamp(), model.state.roleId);
      return { value: { skinTid }, data: null };
    });
  }

  function exchange(input) {
    const requested = termInt(input);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const state = stateRow(db, roleId);
      const skinTid = requested !== null && requested > 0 ? requested : Number(state.pending_exchange_skin ?? 0);
      if (!skinTid) throw new GameError(1, 'No skin exchange is pending');
      const owned = db.prepare('SELECT 1 FROM role_skins WHERE role_id=? AND skin_tid=?').get(roleId, skinTid);
      if (owned) throw new GameError(310, 'Skin is already owned');
      db.prepare('INSERT INTO role_skins (role_id,skin_tid,num,increase_level,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
        .run(roleId, skinTid, 1, 0, 'exchange', stamp(), stamp());
      db.prepare('UPDATE role_skin_state SET pending_exchange_skin=0,updated_at=? WHERE role_id=?').run(stamp(), roleId);
      return {
        value: { skinTid, changes: 0 },
        data: codec.pack('pb_res_to_client', { changes: [], is_overflow: false })
      };
    });
  }

  function toggleIgnore(request) {
    const heroTid = Number(request?.hero_tid ?? 0);
    if (!Number.isSafeInteger(heroTid) || heroTid <= 0) throw new GameError(1, 'Invalid hero tid');
    const ignore = Boolean(request?.ignore);
    return store.transaction((model, db) => {
      const state = stateRow(db, model.state.roleId);
      let list = [];
      try { list = JSON.parse(state.ignore_fantasy_json ?? '[]'); } catch {}
      const next = new Set((Array.isArray(list) ? list : []).map(Number));
      if (ignore) next.add(heroTid); else next.delete(heroTid);
      db.prepare('UPDATE role_skin_state SET ignore_fantasy_json=?,updated_at=? WHERE role_id=?')
        .run(JSON.stringify([...next]), stamp(), model.state.roleId);
      return { value: { heroTid, ignore }, data: null };
    });
  }

  function handbook(current) {
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const skins = ownedSkins(db, roleId);
      if (current) {
        const insert = db.prepare('INSERT OR IGNORE INTO role_skin_handbook (role_id,handbook_id,created_at) VALUES (?,?,?)');
        for (const skin of skins) insert.run(roleId, Number(skin.skin_tid), stamp());
      }
      const rows = db.prepare('SELECT * FROM role_skin_handbook WHERE role_id=? ORDER BY handbook_id').all(roleId);
      const score = skins.reduce((total, skin) => total + Number(skin.increase_level ?? 0) + 1, 0);
      return {
        value: { activated: rows.length, score },
        data: codec.pack('pb_skin_handbook', { skin_list: rows.map(row => Number(row.handbook_id)), score })
      };
    });
  }

  function increase(input) {
    const skinTid = termInt(termArray(input)?.[0] ?? input);
    if (skinTid === null || skinTid <= 0) throw new GameError(1, 'Invalid skin tid');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const owned = db.prepare('SELECT * FROM role_skins WHERE role_id=? AND skin_tid=?').get(roleId, skinTid);
      if (!owned) throw new GameError(420, 'Skin is not owned');
      const level = Number(owned.increase_level ?? 0) + 1;
      db.prepare('UPDATE role_skins SET increase_level=?,updated_at=? WHERE role_id=? AND skin_tid=?')
        .run(level, stamp(), roleId, skinTid);
      return {
        value: { skinTid, level },
        data: codec.pack('pb_skin_increase_back', {
          skin_info: { id: String(skinTid), num: Number(owned.num ?? 1), increase_level: level },
          res: { changes: [], is_overflow: false }
        })
      };
    });
  }

  async function execute(type, context = {}) {
    switch (Number(type)) {
      case 76003: return wear(context.request);
      case 76004: return chooseExchange(context.etf);
      case 76005: return exchange(context.etf);
      case 76006: return toggleIgnore(context.request);
      case 76007: return handbook(true);
      case 76008: return handbook(false);
      case 76009: return increase(context.etf);
      default: throw new GameError(1, 'Unsupported skin command');
    }
  }

  return { supports: type => SUPPORTED.has(Number(type)), execute };
}

