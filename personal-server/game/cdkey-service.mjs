import fs from 'node:fs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { termText, termValue, awardPairs } from './role-service.mjs';

const SUPPORTED = new Set([40000]);

function readCodes() {
  try { return JSON.parse(fs.readFileSync(new URL('../config/cdkey-awards.json', import.meta.url), 'utf8')); }
  catch { return { codes: {} }; }
}

export function createCdkeyService({ store, codec, tables, now = Date.now, logger = () => {}, codes = readCodes() }) {
  const log = event => { try { logger(event); } catch {} };
  const stamp = () => new Date(now()).toISOString();

  function claim(input) {
    const unwrapped = termValue(input);
    const code = (termText(input) ?? (Buffer.isBuffer(unwrapped) ? unwrapped.toString('utf8') : '')).trim().toUpperCase();
    if (!code) throw new GameError(1, 'Invalid cdkey payload');
    const entry = codes?.codes?.[code] ?? null;
    if (!entry) throw new GameError(5, 'Cdkey is not configured');
    const awards = Array.isArray(entry.awards) ? entry.awards : [];
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      if (db.prepare('SELECT 1 FROM cdkey_redemptions WHERE code=? AND role_id=?').get(code, roleId)) {
        throw new GameError(310, 'Cdkey was already redeemed');
      }
      db.prepare('INSERT INTO cdkey_redemptions (code,role_id,bag_id,created_at) VALUES (?,?,?,?)')
        .run(code, roleId, String(entry.bag_id ?? code), stamp());
      const granted = awards.length ? grantResources(model, awardPairs(awards), tables) : { changes: [] };
      log({ event: 'cdkey_redeemed', code, changes: granted.changes.length });
      return {
        value: { code, changes: granted.changes.length },
        data: codec.pack('pb_res_to_client', { changes: granted.changes, is_overflow: false })
      };
    });
  }

  return {
    supports: type => SUPPORTED.has(Number(type)),
    execute: async (type, context = {}) => {
      if (Number(type) !== 40000) throw new GameError(1, 'Unsupported cdkey command');
      return claim(context.etf);
    }
  };
}
