import { randomUUID } from 'node:crypto';
import { GameError } from './hero-progression.mjs';

const DEFAULT_ITEM_TID = 701500;
const FACE_VALUE_CENTS = 100;

const fail = (code, message) => { throw new GameError(code, message); };
const integer = (value, min, max, message) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(1, message);
  return value;
};
// The native client's 16004 request has no coupon count. Its RechargeMgr uses
// RechargeTable.Param.score_token_rate, so the local item policy and the patched
// client table both define one voucher as one yuan.
export function createVoucherService({ store, tables, now = () => Math.floor(Date.now() / 1000), logger = () => {} }) {
  const parameter = tables.RechargeParam?.get(1) ?? {};
  const itemTid = integer(Number(parameter.coupon ?? DEFAULT_ITEM_TID), 1, 2147483647, 'Invalid voucher item configuration');
  const faceValueCents = FACE_VALUE_CENTS;
  const skuId = 'voucher-' + itemTid;
  const upsertSku = db => {
    db.prepare(`INSERT INTO voucher_skus VALUES (?,?,?,?,?,?)
      ON CONFLICT(sku_id) DO UPDATE SET
        item_tid=excluded.item_tid,
        face_value_cents=excluded.face_value_cents,
        title=excluded.title,
        active=1`)
      .run(skuId, itemTid, faceValueCents, '代金券', 1, new Date().toISOString());
    // Voucher mails are denominated in item count. Rebase existing grants so the
    // admin ledger and the patched client agree after upgrading from the old rate.
    db.prepare('UPDATE voucher_grants SET face_value_cents=? WHERE sku_id=?').run(faceValueCents, skuId);
  };
  // The SKU catalog is realm-wide. Empty public realms populate it before any
  // player role exists; normal realms keep the historical transaction path.
  if (store.empty && !store.hasRoles()) store.inspect(upsertSku);
  else store.transaction((model, db) => upsertSku(db));

  function sku() {
    const row = store.inspect(db => db.prepare('SELECT * FROM voucher_skus WHERE sku_id=? AND active=1').get(skuId));
    if (!row) fail(5, 'Voucher SKU is not configured');
    return { sku_id: row.sku_id, item_tid: row.item_tid, face_value_cents: row.face_value_cents, title: row.title };
  }

  function balance(model = store.read()) {
    const quantity = BigInt(model.resources.get(String(itemTid))?.num ?? 0);
    return { quantity: Number(quantity), amount_cents: Number(quantity) * faceValueCents };
  }

  function autoCount(priceCents) {
    integer(priceCents, 1, 100000000, 'Invalid voucher order price');
    return Math.floor(priceCents / faceValueCents);
  }

  function quote(priceCents, requestedCount) {
    integer(priceCents, 1, 100000000, 'Invalid voucher order price');
    integer(requestedCount, 0, 100000000, 'Invalid voucher quantity');
    const maximum = Math.floor(priceCents / faceValueCents);
    if (requestedCount > maximum) fail(302, 'Voucher deduction exceeds order price');
    const voucherAmount = requestedCount * faceValueCents;
    return { quantity: requestedCount, amount_cents: voucherAmount, balance_cents: priceCents - voucherAmount };
  }

  function consume({ model, db, orderId, roleId, quantity, amountCents }) {
    integer(quantity, 1, 100000000, 'Invalid voucher quantity');
    integer(amountCents, 1, 100000000, 'Invalid voucher amount');
    if (amountCents !== quantity * faceValueCents) fail(1, 'Voucher amount does not match its face value');
    const item = model.resources.get(String(itemTid));
    const current = BigInt(item?.num ?? 0);
    if (current < BigInt(quantity)) fail(302, 'Voucher balance is insufficient');
    item.num = String(current - BigInt(quantity));
    db.prepare('INSERT INTO voucher_redemptions(order_id,role_id,sku_id,item_tid,quantity,amount_cents,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(orderId, roleId, skuId, itemTid, quantity, amountCents, new Date().toISOString());
    try { logger({ event: 'voucher_redeemed', orderId, quantity, amountCents }); } catch {}
    return { tid: String(itemTid), new_num: item.num, diff_num: String(-quantity) };
  }

  function recordGrant({ db, mailId, roleId, quantity }) {
    integer(quantity, 1, 1000000000, 'Invalid voucher mail quantity');
    db.prepare('INSERT INTO voucher_grants(grant_id,mail_id,role_id,sku_id,item_tid,face_value_cents,quantity,claimed_at,created_at) VALUES (?,?,?,?,?,?,?,NULL,?)')
      .run(randomUUID(), mailId, roleId, skuId, itemTid, faceValueCents, quantity, new Date().toISOString());
  }

  function snapshot() {
    const currentBalance = balance();
    const currentSku = sku();
    return store.inspect(db => {
      const grants = db.prepare(`SELECT g.*, m.request_id, m.title, m.content, m.send_time, m.expire_at, m.read, m.received, m.deleted
        FROM voucher_grants g JOIN game_mails m ON m.mail_id=g.mail_id ORDER BY m.mail_id DESC`).all();
      const redemptions = db.prepare('SELECT * FROM voucher_redemptions ORDER BY created_at DESC LIMIT 100').all();
      const nowSeconds = now();
      const mails = grants.map(row => {
        const status = row.deleted ? 'deleted' : row.claimed_at ? 'claimed' : row.expire_at > 0 && nowSeconds > row.expire_at ? 'expired' : 'pending';
        return {
          mail_id: row.mail_id, request_id: row.request_id, title: row.title,
          content: row.content,
          quantity: row.quantity, face_value_cents: row.face_value_cents,
          amount_cents: row.quantity * row.face_value_cents, status,
          send_time: row.send_time, expire_at: row.expire_at, read: Boolean(row.read),
          received: Boolean(row.received), claimed_at: row.claimed_at
        };
      });
      const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
      const pending = mails.filter(row => row.status === 'pending');
      const claimed = mails.filter(row => row.status === 'claimed');
      const expired = mails.filter(row => row.status === 'expired');
      return {
        sku: currentSku, balance: currentBalance, mails, redemptions,
        totals: {
          issued_amount_cents: sum(mails, 'amount_cents'),
          claimed_amount_cents: sum(claimed, 'amount_cents'),
          outstanding_amount_cents: sum(pending, 'amount_cents'),
          redeemed_amount_cents: sum(redemptions, 'amount_cents'),
          available_amount_cents: currentBalance.amount_cents,
          mail_count: mails.length, pending_count: pending.length, claimed_count: claimed.length,
          expired_count: expired.length
        }
      };
    });
  }

  return { sku, balance, autoCount, quote, consume, recordGrant, snapshot, itemTid, faceValueCents, skuId };
}
