import { GameError } from './hero-progression.mjs';
import { grantResources, partitionGrantableResources } from './resources.mjs';

const MAIL_COMMANDS = new Set([3000, 3001, 3002, 3003, 3004, 3005, 3006]);
// MailTable.data row 11400 is the first ordinary (type=1) system mail. tid=0 is
// not a valid config and makes the native client throw at Mail.lua:173, which
// drops the whole module 93 mail list (observed 2026-10-28).
const MAIL_CONFIG_TID = 11400;
// ResTable.Type[1400] is MailRes. A 900 push reaches MailMgr.RevNewMail ->
// ResMgr.Parse, which dispatches each pb_res_change by tid to MailRes.ResChange.
// new_bin is a packed pb_mail; new_num=0 means delete, any nonzero value adds.
const MAIL_RESOURCE_TID = 1400;
const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max, message) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(1, message);
  return value;
};
const text = (value, name, max) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) fail(1, 'Invalid mail ' + name);
  return value;
};
const requestKey = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.:-]{1,120}$/.test(value)) fail(1, 'Invalid mail request ID');
  return value;
};

function awards(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 32) fail(1, 'Invalid mail awards');
  return value.map(row => ({
    tid: integer(Number(row?.tid ?? row?.id), 1, 2147483647, 'Invalid mail award item'),
    count: integer(Number(row?.count ?? row?.num), 1, 1000000000, 'Invalid mail award count')
  }));
}

function assertGrantableMailAwards(rows, tables) {
  const { pending } = partitionGrantableResources(rows.map(row => [row.tid, row.count]), tables);
  if (pending.length) {
    fail(5, 'Mail award has no production resource handler: ' + pending.map(row => row.tid).join(','));
  }
}

function awardMessage(rows) {
  return rows.map(row => ({ id: row.tid, count: row.count }));
}

export function createMailService({ store, codec, tables, voucher, publish = () => {}, now = () => Math.floor(Date.now() / 1000), logger = () => {} }) {
  function roleForAccount(db, accountId) {
    const row = db.prepare('SELECT role_id FROM accounts WHERE account_id=?').get(accountId)
      ?? db.prepare('SELECT role_id FROM local_wallets WHERE account_id=?').get(accountId);
    if (!row) fail(1, 'Unknown local account for mail');
    return row.role_id;
  }
  function mailRow(db, roleId, mailId) {
    const row = db.prepare('SELECT * FROM game_mails WHERE role_id=? AND mail_id=? AND deleted=0').get(roleId, Number(mailId));
    if (!row) fail(5, 'Mail does not exist');
    return row;
  }
  function expiry(value) {
    if (value === undefined || value === null || value === '' || value === 0 || value === '0') return 0;
    let seconds;
    if (typeof value === 'number') seconds = value;
    else if (typeof value === 'string' && /^\d+$/.test(value)) seconds = Number(value);
    else if (typeof value === 'string') seconds = Math.floor(Date.parse(value) / 1000);
    else fail(1, 'Invalid mail expiry');
    if (!Number.isSafeInteger(seconds) || seconds <= now()) fail(1, 'Mail expiry must be in the future');
    return seconds;
  }
  function brief(row, current = now()) {
    const award = JSON.parse(row.award_json);
    return {
      tid: row.tid, id: row.mail_id, send_time: row.send_time,
      read: Boolean(row.read), received: Boolean(row.received), title: row.title,
      award: awardMessage(award), is_full_info: true,
      expire_time: row.expire_at > 0 ? Math.max(0, row.expire_at - current) : 0,
      expire_convert_time: row.expire_at
    };
  }
  function fullMail(row, current = now()) {
    const award = JSON.parse(row.award_json);
    return {
      ...brief(row, current), send_name: row.send_name, content: row.content,
      award: award.map(item => ({ tid: item.tid, num: item.count })),
      params: Buffer.alloc(0), common_ref: 0
    };
  }
  function publishNewMail(mailId, roleId) {
    try {
      const row = store.inspect(db => db.prepare('SELECT * FROM game_mails WHERE mail_id=? AND deleted=0').get(mailId));
      if (!row) return;
      const newBin = codec.pack('pb_mail', fullMail(row)).toString('base64');
      publish(900, codec.pack('pb_rev_new_mail_info', {
        res: {
          changes: [{ tid: String(MAIL_RESOURCE_TID), new_num: '1', diff_num: '0', new_bin: newBin }],
          is_overflow: false
        }
      }), roleId);
    } catch (error) {
      try { logger({ event: 'mail_notification_pending', mailId, message: error.message }); } catch {}
    }
  }

  function normalizeIssue({ request_id, title = '代金券到账', content = '', awards: rawAwards, expire_at = 0, send_name = '系统', voucherGrant = null }) {
    requestKey(request_id);
    const normalizedAwards = awards(rawAwards);
    text(title, 'title', 80);
    if (typeof content !== 'string' || content.length > 1000) fail(1, 'Invalid mail content');
    text(send_name, 'sender', 40);
    const expireAt = expiry(expire_at);
    assertGrantableMailAwards(normalizedAwards, tables);
    if (voucherGrant) {
      if (!voucher) fail(5, 'Voucher mail service is unavailable');
      const sku = voucher.sku();
      if (voucherGrant.item_tid !== sku.item_tid || voucherGrant.face_value_cents !== sku.face_value_cents) fail(5, 'Voucher mail SKU mismatch');
      if (normalizedAwards.length !== 1 || normalizedAwards[0].tid !== sku.item_tid || normalizedAwards[0].count !== voucherGrant.quantity) fail(5, 'Voucher mail award mismatch');
    }
    return { request_id, title, content, awards: normalizedAwards, expireAt, send_name, voucherGrant };
  }

  // Activity settlement calls this from inside its own store.transaction so the
  // mail row and the settlement-step marker commit atomically. Notification is
  // intentionally deferred to publishNewMail after that transaction commits.
  function enqueueToRoleInTransaction({ db, roleId, ...message }) {
    if (!db?.prepare) throw new TypeError('Mail transaction database is required');
    const id = integer(Number(roleId), 1, Number.MAX_SAFE_INTEGER, 'Invalid mail role ID');
    if (!db.prepare('SELECT 1 FROM roles WHERE role_id=?').get(id)) fail(5, 'Unknown role for mail');
    const normalized = normalizeIssue(message);
    const old = db.prepare('SELECT * FROM game_mails WHERE role_id=? AND request_id=?').get(id, normalized.request_id);
    if (old) {
      const grant = db.prepare('SELECT * FROM voucher_grants WHERE mail_id=?').get(old.mail_id);
      const same = old.title === normalized.title && old.content === normalized.content
        && old.award_json === JSON.stringify(normalized.awards) && old.expire_at === normalized.expireAt
        && (!normalized.voucherGrant || (grant && grant.quantity === normalized.voucherGrant.quantity));
      if (!same) fail(1, 'Mail request ID already used');
      return {
        mail_id: old.mail_id, duplicate: true, role_id: id, awards: normalized.awards,
        quantity: grant?.quantity ?? 0,
        amount_cents: (grant?.quantity ?? 0) * (grant?.face_value_cents ?? 0)
      };
    }
    const sendTime = now();
    const row = db.prepare('INSERT INTO game_mails(role_id,request_id,tid,send_name,title,content,send_time,expire_at,read,received,deleted,award_json,created_at) VALUES (?,?,?,?,?,?,?,?,0,0,0,?,?)')
      .run(id, normalized.request_id, MAIL_CONFIG_TID, normalized.send_name, normalized.title, normalized.content,
        sendTime, normalized.expireAt, JSON.stringify(normalized.awards), new Date().toISOString());
    const mailId = Number(row.lastInsertRowid);
    if (normalized.voucherGrant) voucher.recordGrant({ db, mailId, roleId: id, quantity: normalized.voucherGrant.quantity });
    return {
      mail_id: mailId, duplicate: false, role_id: id, awards: normalized.awards,
      quantity: normalized.voucherGrant?.quantity ?? 0,
      amount_cents: (normalized.voucherGrant?.quantity ?? 0) * (normalized.voucherGrant?.face_value_cents ?? 0)
    };
  }

  function issue({ account_id, request_id, title = '代金券到账', content = '', awards: rawAwards, expire_at = 0, send_name = '系统', voucherGrant = null }) {
    const roleId = store.inspect(db => roleForAccount(db, account_id));
    const result = store.runWithRole(roleId, () => store.transaction((model, db) => enqueueToRoleInTransaction({
      db, roleId, request_id, title, content, awards: rawAwards, expire_at, send_name, voucherGrant
    })));
    if (!result.duplicate) {
      try { logger({ event: 'mail_issued', mailId: result.mail_id, accountId: account_id }); } catch {}
      publishNewMail(result.mail_id, roleId);
    }
    return result;
  }

  function issueVoucher({ account_id, request_id, quantity, amount_cents, title = '代金券到账', content, expire_at = 0, send_name = '系统' }) {
    if (!voucher) fail(5, 'Voucher mail service is unavailable');
    const sku = voucher.sku();
    let count;
    if (quantity !== undefined) {
      count = integer(Number(quantity), 1, 1000000000, 'Invalid voucher quantity');
      if (amount_cents !== undefined && Number(amount_cents) !== count * sku.face_value_cents) fail(1, 'Voucher amount does not match its face value');
    } else {
      const amount = integer(Number(amount_cents), 1, 1000000000, 'Invalid voucher amount');
      if (amount % sku.face_value_cents !== 0) fail(1, 'Voucher amount is not divisible by its face value');
      count = amount / sku.face_value_cents;
    }
    const message = content ?? `您收到 ${count} 张代金券，可在付款时抵扣 ${(count * sku.face_value_cents / 100).toFixed(2)} 元。`;
    return issue({ account_id, request_id, title, content: message, send_name, expire_at,
      awards: [{ tid: sku.item_tid, count }],
      voucherGrant: { item_tid: sku.item_tid, face_value_cents: sku.face_value_cents, quantity: count } });
  }

  function loginPayload(roleId = store.read().state.roleId) {
    const rows = store.inspect(db => db.prepare('SELECT * FROM game_mails WHERE role_id=? AND deleted=0 ORDER BY send_time DESC, mail_id DESC').all(roleId));
    const current = now();
    return codec.pack('pb_rev_login_mail_info', { mail_list: rows.map(row => brief(row, current)) });
  }

  function read(mailId) {
    const roleId = store.read().state.roleId;
    store.transaction((model, db) => {
      const row = mailRow(db, roleId, mailId);
      db.prepare('UPDATE game_mails SET read=1 WHERE mail_id=?').run(row.mail_id);
    });
    return { mail_id: Number(mailId) };
  }

  function readOneKey(ids) {
    const roleId = store.read().state.roleId;
    const selected = Array.isArray(ids) && ids.length ? new Set(ids.map(Number)) : null;
    store.transaction((model, db) => {
      const rows = db.prepare('SELECT mail_id FROM game_mails WHERE role_id=? AND deleted=0 AND read=0').all(roleId);
      const update = db.prepare('UPDATE game_mails SET read=1 WHERE mail_id=?');
      for (const row of rows) if (!selected || selected.has(row.mail_id)) update.run(row.mail_id);
    });
    return {};
  }

  function claim(mailId) {
    const roleId = store.read().state.roleId;
    return store.transaction((model, db) => {
      const row = mailRow(db, roleId, mailId);
      if (row.received) fail(5, 'Mail award already received');
      if (row.expire_at > 0 && now() > row.expire_at) fail(5, 'Mail has expired');
      const award = JSON.parse(row.award_json);
      const result = grantResources(model, award.map(item => [item.tid, item.count]), tables);
      db.prepare('UPDATE game_mails SET received=1,read=1 WHERE mail_id=?').run(row.mail_id);
      db.prepare('UPDATE voucher_grants SET claimed_at=? WHERE mail_id=? AND claimed_at IS NULL').run(new Date().toISOString(), row.mail_id);
      const value = { res: result, award: awardMessage(award) };
      return { data: codec.pack('pb_rev_award_mail', value), value };
    });
  }

  function claimOneKey(ids) {
    const roleId = store.read().state.roleId;
    const selected = Array.isArray(ids) && ids.length ? new Set(ids.map(Number)) : null;
    return store.transaction((model, db) => {
      const rows = db.prepare('SELECT * FROM game_mails WHERE role_id=? AND deleted=0 AND received=0 AND award_json<>\'[]\' ORDER BY mail_id').all(roleId)
        .filter(row => !selected || selected.has(row.mail_id))
        .filter(row => !(row.expire_at > 0 && now() > row.expire_at));
      if (!rows.length) fail(5, 'No mail awards available');
      const totals = new Map();
      for (const row of rows) for (const item of JSON.parse(row.award_json)) totals.set(String(item.tid), (totals.get(String(item.tid)) ?? 0) + item.count);
      const result = grantResources(model, [...totals].map(([tid, count]) => [Number(tid), count]), tables);
      const timestamp = new Date().toISOString(), current = now(), claimed = [];
      for (const row of rows) {
        db.prepare('UPDATE game_mails SET received=1,read=1 WHERE mail_id=?').run(row.mail_id);
        db.prepare('UPDATE voucher_grants SET claimed_at=? WHERE mail_id=? AND claimed_at IS NULL').run(timestamp, row.mail_id);
        claimed.push(brief({ ...row, received: 1, read: 1 }, current));
      }
      const revIdList = rows.map(row => row.mail_id);
      const value = { res: result, rev_id_list: revIdList, rev_mail_list: claimed };
      return { data: codec.pack('pb_rev_one_key_award_mail', value), value };
    });
  }

  function del(mailId) {
    const roleId = store.read().state.roleId;
    store.transaction((model, db) => {
      const row = mailRow(db, roleId, mailId);
      const award = JSON.parse(row.award_json);
      const expired = row.expire_at > 0 && now() > row.expire_at;
      if (award.length && !row.received && !expired) fail(5, 'Mail award has not been received');
      db.prepare('UPDATE game_mails SET deleted=1 WHERE mail_id=?').run(row.mail_id);
    });
    return {};
  }

  function delOneKey(ids) {
    const roleId = store.read().state.roleId;
    const selected = Array.isArray(ids) && ids.length ? new Set(ids.map(Number)) : null;
    store.transaction((model, db) => {
      const rows = db.prepare('SELECT mail_id,received,award_json,expire_at FROM game_mails WHERE role_id=? AND deleted=0').all(roleId);
      const update = db.prepare('UPDATE game_mails SET deleted=1 WHERE mail_id=?');
      for (const row of rows) {
        if (selected && !selected.has(row.mail_id)) continue;
        const expired = row.expire_at > 0 && now() > row.expire_at;
        if (row.received || row.award_json === '[]' || expired) update.run(row.mail_id);
      }
    });
    return {};
  }

  function detail(mailId) {
    const roleId = store.read().state.roleId;
    const row = store.inspect(db => db.prepare('SELECT * FROM game_mails WHERE role_id=? AND mail_id=? AND deleted=0').get(roleId, Number(mailId)));
    if (!row) fail(5, 'Mail does not exist');
    return codec.pack('pb_mail', fullMail(row));
  }

  return {
    supports: type => MAIL_COMMANDS.has(type), issue, issueVoucher,
    enqueueToRoleInTransaction, publishNewMail,
    loginPayload, read, readOneKey, claim, claimOneKey, delete: del, deleteOneKey: delOneKey, detail
  };
}
