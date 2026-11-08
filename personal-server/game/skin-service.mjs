import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { properList, termInt } from './role-service.mjs';

const SUPPORTED = new Set([76003, 76004, 76005, 76006, 76007, 76008, 76009]);

export function createSkinService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const stamp = () => new Date(now()).toISOString();

  function moduleSkinData(model) {
    const module = new Map(model.state.modules.value).get(65);
    const target = Array.isArray(module?.value) ? module.value[0] : null;
    const bytes = target ? rawBinary(target) : Buffer.alloc(0);
    return bytes.length ? codec.unpack('pb_skin_info', bytes) : { skin_list: [] };
  }

  function moduleSkins(model) {
    return moduleSkinData(model).skin_list ?? [];
  }

  function syncModuleSkin(model, skinTid, increaseLevel, num) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(65);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Skin login module is unavailable');
    const data = moduleSkinData(model);
    data.skin_list ??= [];
    let row = data.skin_list.find(entry => Number(entry.id) === skinTid);
    if (!row) {
      row = { id: String(skinTid), num: Number(num ?? 1), increase_level: increaseLevel };
      data.skin_list.push(row);
    } else {
      row.num = Number(row.num ?? num ?? 1);
      row.increase_level = increaseLevel;
    }
    module.value[0] = serializedBinary(codec.pack('pb_skin_info', data));
    model.state.modules.value = [...modules];
  }

  function ownedSkins(model, db, roleId) {
    const rows = new Map();
    for (const skin of moduleSkins(model)) {
      const skinTid = Number(skin.id ?? 0);
      if (!tables?.Skin?.has?.(skinTid)) continue;
      rows.set(skinTid, {
        skin_tid: skinTid,
        num: Number(skin.num ?? 1),
        increase_level: Number(skin.increase_level ?? 0),
        source: 'login-module'
      });
    }
    for (const row of db.prepare('SELECT * FROM role_skins WHERE role_id=? ORDER BY skin_tid').all(roleId)) {
      const skinTid = Number(row.skin_tid);
      rows.set(skinTid, { ...row, skin_tid: skinTid });
    }
    return [...rows.values()].sort((left, right) => left.skin_tid - right.skin_tid);
  }

  function requestedSkin(input) {
    const listed = termInt(properList(input)?.[0]);
    if (listed !== null) return listed;
    if (input && typeof input === 'object' && !Array.isArray(input) && !Buffer.isBuffer(input)) {
      const value = Number(input.choose_res_tid ?? 0);
      if (Number.isSafeInteger(value) && value > 0) return value;
    }
    return termInt(input);
  }

  function exchangeConfig(skinTid) {
    if (!tables?.Skin?.has?.(skinTid)) throw new GameError(5, 'Skin configuration is missing');
    const exchange = tables?.SkinExchangeLib?.get?.(skinTid);
    if (!exchange) throw new GameError(420, 'Skin is not available for exchange');
    const price = Number(exchange.price ?? 0);
    const item = Number(tables?.SkinExchangeConst?.get?.(1)?.exchange_item ?? 0);
    if (!Number.isSafeInteger(item) || item <= 0 || !Number.isSafeInteger(price) || price <= 0) {
      throw new GameError(5, 'Skin exchange configuration is invalid');
    }
    return { item, price };
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
        const owned = ownedSkins(model, db, model.state.roleId).some(row => Number(row.skin_tid) === skinTid);
        if (!owned) throw new GameError(420, 'Skin is not owned');
        if (!tables?.Skin?.has?.(skinTid)) throw new GameError(5, 'Skin configuration is missing');
      }
      db.prepare('INSERT OR REPLACE INTO hero_skin_wear (role_id,hero_uid,skin_tid,updated_at) VALUES (?,?,?,?)')
        .run(model.state.roleId, heroUid, skinTid, stamp());
      return { value: { heroUid, skinTid }, data: codec.pack('pb_skin_wear_back', { hero_uid: heroUid, skin_tid: skinTid }) };
    });
  }

  function chooseExchange(input) {
    const skinTid = requestedSkin(input);
    if (skinTid === null || skinTid <= 0) throw new GameError(1, 'Invalid skin choice');
    return store.transaction((model, db) => {
      exchangeConfig(skinTid);
      if (ownedSkins(model, db, model.state.roleId).some(row => Number(row.skin_tid) === skinTid)) {
        throw new GameError(310, 'Skin is already owned');
      }
      stateRow(db, model.state.roleId);
      db.prepare('UPDATE role_skin_state SET pending_exchange_skin=?,updated_at=? WHERE role_id=?')
        .run(skinTid, stamp(), model.state.roleId);
      return { value: { skinTid }, data: null };
    });
  }

  function exchange(input) {
    const requested = requestedSkin(input);
    // The shipped SkinDrawMgr sends an empty 76005 and never calls
    // req_choose_exchange_skin. Guessing from pending state would let the real
    // UI exchange a skin that it never selected through a network contract.
    if (requested === null || requested <= 0) throw new GameError(1, 'Skin exchange target is required');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const skinTid = requested;
      const owned = ownedSkins(model, db, roleId).some(row => Number(row.skin_tid) === skinTid);
      if (owned) throw new GameError(310, 'Skin is already owned');
      const { item, price } = exchangeConfig(skinTid);
      const consumed = consumeResources(model, [[item, price]], 301, { codec });
      const granted = grantResources(model, [[skinTid, 1]], tables, { codec });
      db.prepare('INSERT INTO role_skins (role_id,skin_tid,num,increase_level,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
        .run(roleId, skinTid, 1, 0, 'exchange', stamp(), stamp());
      db.prepare('UPDATE role_skin_state SET pending_exchange_skin=0,updated_at=? WHERE role_id=?').run(stamp(), roleId);
      return {
        value: { skinTid, changes: consumed.changes.length + granted.changes.length },
        data: codec.pack('pb_res_to_client', { changes: [...consumed.changes, ...granted.changes], is_overflow: false })
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
      const skins = ownedSkins(model, db, roleId);
      const handbookBySkin = new Map([...(tables.SkinHandbookShow?.values?.() ?? [])]
        .filter(row => row?.not_show !== true && Number(row?.point_skin) > 0)
        .map(row => [Number(row.point_skin), Number(row.tid)]));
      if (current) {
        const insert = db.prepare('INSERT OR IGNORE INTO role_skin_handbook (role_id,handbook_id,created_at) VALUES (?,?,?)');
        for (const skin of skins) {
          const handbookId = handbookBySkin.get(Number(skin.skin_tid));
          if (handbookId) insert.run(roleId, handbookId, stamp());
        }
      }
      const rows = db.prepare('SELECT * FROM role_skin_handbook WHERE role_id=? ORDER BY handbook_id').all(roleId);
      const score = skins.reduce((total, skin) => {
        const config = tables.Skin.get(Number(skin.skin_tid));
        const quality = Number(tables.Item?.get?.(Number(skin.skin_tid))?.quality ?? 0);
        const level = Number(skin.increase_level ?? 0);
        const increase = tables.SkinIncrease?.get?.(quality * 1000 + level);
        return total + Number(config?.score ?? 0) + Number(increase?.score ?? 0);
      }, 0);
      return {
        value: { activated: rows.length, score },
        data: codec.pack('pb_skin_handbook', { skin_list: rows.map(row => Number(row.handbook_id)), score })
      };
    });
  }

  function increase(input) {
    const skinTid = requestedSkin(input);
    if (skinTid === null || skinTid <= 0) throw new GameError(1, 'Invalid skin tid');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const owned = ownedSkins(model, db, roleId).find(row => Number(row.skin_tid) === skinTid);
      if (!owned) throw new GameError(420, 'Skin is not owned');
      const currentLevel = Number(owned.increase_level ?? 0);
      if (currentLevel >= 5) throw new GameError(305, 'Skin increase level has reached its maximum');
      const quality = Number(tables.Item?.get?.(skinTid)?.quality ?? 0);
      const next = tables.SkinIncrease?.get?.(quality * 1000 + currentLevel + 1);
      if (!next || !Array.isArray(next.consume)) throw new GameError(5, 'Skin increase configuration is missing');
      const consumed = consumeResources(model, next.consume.map(row => [Number(row[0]), Number(row[1])]), 301, { codec });
      const level = currentLevel + 1;
      const stored = db.prepare('SELECT * FROM role_skins WHERE role_id=? AND skin_tid=?').get(roleId, skinTid);
      if (stored) {
        db.prepare('UPDATE role_skins SET increase_level=?,updated_at=? WHERE role_id=? AND skin_tid=?')
          .run(level, stamp(), roleId, skinTid);
      } else {
        db.prepare('INSERT INTO role_skins (role_id,skin_tid,num,increase_level,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
          .run(roleId, skinTid, Number(owned.num ?? 1), level, 'increase', stamp(), stamp());
      }
      syncModuleSkin(model, skinTid, level, owned.num);
      return {
        value: { skinTid, level },
        data: codec.pack('pb_skin_increase_back', {
          skin_info: { id: String(skinTid), num: Number(owned.num ?? 1), increase_level: level },
          res: { changes: consumed.changes, is_overflow: false }
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

