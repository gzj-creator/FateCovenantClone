import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createGameCodec, decodeEtf, encodeEtf, rawBinary, binary } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createVoucherService } from '../game/voucher-service.mjs';
import { createMailService } from '../game/mail-service.mjs';
import { createWalletService } from '../game/wallet-service.mjs';
import { createAdminService } from '../admin/server.mjs';
import { createLocalGame } from '../local-game.mjs';
import { GameFrameDecoder, encodeGameFrame, parseServerChallenge } from '../game-framing.mjs';
import { HANDSHAKE_FIXED_IV, LOCAL_AES_PROFILE, localAesBeforeFinal } from '../game-handshake.mjs';

const codec = createGameCodec();
const tables = readGameTables();
const capture = JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.local-only.json', import.meta.url)));

function fixture() {
  return {
    version: 1, roleId: 100001, serverId: 1, createdAt: 1700000000,
    modules: structuredClone(capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103').decoded[2]),
    rolePb: codec.pack('to_client_role_info', { level: 9, nick_name: Buffer.from('Local Test') }).toString('base64'),
    guides: {}, lineups: null
  };
}

function setup(t, { now = () => Math.floor(Date.now() / 1000) } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-voucher-'));
  const databasePath = path.join(directory, 'game.sqlite');
  const seed = () => fixture();
  let store = createGameStore({ databasePath, seed, codec });
  const pushes = [];
  const publish = (type, data) => pushes.push({ type, data });
  const make = () => {
    const voucher = createVoucherService({ store, tables, now });
    const wallet = createWalletService({ store, codec, tables, voucher, publish });
    const mail = createMailService({ store, codec, tables, voucher, publish, now });
    return { voucher, wallet, mail };
  };
  let services = make();
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return {
    directory, databasePath, pushes,
    get store() { return store; },
    get voucher() { return services.voucher; },
    get wallet() { return services.wallet; },
    get mail() { return services.mail; },
    reopen() { store.close(); store = createGameStore({ databasePath, seed, codec }); services = make(); }
  };
}

const voucherRequest = (overrides = {}) => ({
  account_id: 'local-1',
  request_id: 'voucher-mail-1',
  amount_cents: 600,
  title: '活动补偿',
  content: '测试代金券',
  expire_at: Math.floor(Date.now() / 1000) + 3600,
  ...overrides
});

test('voucher mail issue is idempotent and appears in login module 93', t => {
  const e = setup(t);
  const request = voucherRequest();
  const issued = e.mail.issueVoucher(request);
  assert.equal(issued.quantity, 600);
  assert.equal(issued.amount_cents, 600);
  assert.equal(issued.duplicate, false);
  const duplicate = e.mail.issueVoucher(request);
  assert.equal(duplicate.mail_id, issued.mail_id);
  assert.equal(duplicate.duplicate, true);
  assert.throws(() => e.mail.issueVoucher({ ...request, amount_cents: 700 }), x => x.code === 1);

  const login = codec.unpack('pb_rev_login_mail_info', e.mail.loginPayload());
  assert.equal(login.mail_list.length, 1);
  const brief = login.mail_list[0];
  assert.equal(Number(brief.id), issued.mail_id);
  assert.equal(brief.title, '活动补偿');
  assert.ok(!brief.read);
  assert.ok(!brief.received);
  assert.deepEqual(brief.award.map(row => [row.id, row.count]), [[701500, 600]]);
  assert.ok(brief.expire_time > 0);
  assert.equal(Number(brief.expire_convert_time), request.expire_at);

  const normal = e.mail.issue({ account_id: 'local-1', request_id: 'normal-mail-1', title: '普通邮件', content: '附件', awards: [{ tid: 101500, count: 10 }] });
  assert.ok(normal.mail_id > issued.mail_id);
  assert.equal(codec.unpack('pb_rev_login_mail_info', e.mail.loginPayload()).mail_list.length, 2);
});

test('claiming a voucher mail grants item 701500 exactly once and syncs grant state', t => {
  const e = setup(t);
  const issued = e.mail.issueVoucher(voucherRequest());
  const claimed = e.mail.claim(issued.mail_id);
  const value = codec.unpack('pb_rev_award_mail', claimed.data);
  assert.deepEqual(value.award.map(row => [row.id, row.count]), [[701500, 600]]);
  assert.equal(value.res.changes.find(change => change.tid === '701500').diff_num, '600');
  assert.equal(e.voucher.balance().quantity, 600);
  assert.equal(e.voucher.balance().amount_cents, 600);
  assert.throws(() => e.mail.claim(issued.mail_id), x => x.code === 5);

  const grant = e.store.inspect(db => db.prepare('SELECT * FROM voucher_grants WHERE mail_id=?').get(issued.mail_id));
  assert.ok(grant.claimed_at);
  const login = codec.unpack('pb_rev_login_mail_info', e.mail.loginPayload());
  assert.equal(login.mail_list[0].received, true);
  assert.equal(login.mail_list[0].read, true);

  const snapshot = e.voucher.snapshot();
  assert.equal(snapshot.sku.item_tid, 701500);
  assert.equal(snapshot.sku.face_value_cents, 1);
  assert.equal(snapshot.mails[0].status, 'claimed');
  assert.equal(snapshot.totals.pending_count, 0);
  assert.equal(snapshot.totals.claimed_amount_cents, 600);
  assert.equal(snapshot.totals.available_amount_cents, 600);

  const detail = codec.unpack('pb_mail', e.mail.detail(issued.mail_id));
  assert.equal(Number(detail.id), issued.mail_id);
  assert.equal(detail.title, '活动补偿');
  assert.equal(detail.content, '测试代金券');
  assert.equal(detail.send_name, '系统');
  assert.deepEqual(detail.award.map(row => [Number(row.tid), Number(row.num)]), [[701500, 600]]);
});

test('expired voucher mail cannot be claimed but can be deleted; pending reward cannot be deleted', t => {
  let clock = 1700000000;
  const e = setup(t, { now: () => clock });
  const expiring = e.mail.issueVoucher(voucherRequest({ request_id: 'expiring', expire_at: clock + 10 }));
  assert.throws(() => e.mail.delete(expiring.mail_id), x => x.code === 5);
  clock += 11;
  assert.throws(() => e.mail.claim(expiring.mail_id), x => x.code === 5);
  assert.throws(() => e.mail.claimOneKey([expiring.mail_id]), x => x.code === 5);
  assert.equal(e.voucher.snapshot().mails[0].status, 'expired');
  e.mail.delete(expiring.mail_id);
  assert.equal(e.voucher.snapshot().mails[0].status, 'deleted');
  assert.equal(e.voucher.balance().quantity, 0);

  const pending = e.mail.issueVoucher(voucherRequest({ request_id: 'pending', expire_at: 0 }));
  e.mail.deleteOneKey([]);
  assert.equal(e.voucher.snapshot().mails.find(row => row.mail_id === pending.mail_id).status, 'pending');
  e.mail.read(pending.mail_id);
  assert.equal(codec.unpack('pb_rev_login_mail_info', e.mail.loginPayload()).mail_list.find(row => Number(row.id) === pending.mail_id).read, true);
});

test('voucher purchase applies partial, full and counted deductions with balance payment', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 10000, request_id: 'fund' });
  const issued = e.mail.issueVoucher(voucherRequest({ request_id: 'grant-1200', amount_cents: 1200 }));
  e.mail.claim(issued.mail_id);
  assert.equal(e.voucher.balance().quantity, 1200);

  const partial = e.wallet.buy({ product_id: 11, request_id: 'partial', voucher_amount_cents: 200 });
  assert.equal(partial.voucher_quantity, 200);
  assert.equal(partial.voucher_amount_cents, 200);
  assert.equal(partial.balance_paid_cents, 400);
  assert.equal(partial.balance_cents, 9600);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 1);
  assert.equal(e.pushes.filter(push => push.type === 900).length, 1);
  const partialPush = codec.unpack('res_recharge_success', e.pushes.find(push => push.type === 1900).data);
  assert.equal(partialPush.is_use_token, true);
  assert.equal(Number(partialPush.use_item_tid), 701500);
  assert.equal(partialPush.res.changes.find(change => change.tid === '701500').diff_num, '-200');
  assert.equal(e.voucher.balance().quantity, 1000);
  assert.equal(e.store.read().resources.get('101500').num, '60');

  const retry = e.wallet.buy({ product_id: 11, request_id: 'partial', voucher_amount_cents: 200 });
  assert.equal(retry.duplicate, true);
  assert.equal(retry.order_id, partial.order_id);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 1);
  assert.equal(e.voucher.balance().quantity, 1000);

  const full = e.wallet.buy({ product_id: 11, request_id: 'full', voucher_item_tid: 701500 });
  assert.equal(full.voucher_quantity, 600);
  assert.equal(full.voucher_amount_cents, 600);
  assert.equal(full.balance_paid_cents, 0);
  assert.equal(full.balance_cents, 9600);
  assert.equal(e.voucher.balance().quantity, 400);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 2);

  const counted = e.wallet.buy({ product_id: 11, request_id: 'counted', voucher_count: 100 });
  assert.equal(counted.voucher_quantity, 100);
  assert.equal(counted.balance_paid_cents, 500);
  assert.equal(counted.balance_cents, 9100);
  assert.equal(e.voucher.balance().quantity, 300);
  assert.equal(e.store.read().resources.get('101500').num, '180');

  const snapshot = e.wallet.snapshot();
  const order = snapshot.orders.find(row => row.order_id === partial.order_id);
  assert.equal(order.voucher_quantity, 200);
  assert.equal(order.voucher_amount_cents, 200);
  assert.equal(order.balance_paid_cents, 400);
  const fullOrder = snapshot.orders.find(row => row.order_id === full.order_id);
  assert.equal(fullOrder.voucher_quantity, 600);
  assert.equal(fullOrder.balance_paid_cents, 0);
  assert.equal(snapshot.totals.voucher_redeemed_cents, 900);
  assert.equal(snapshot.totals.voucher_order_count, 3);
});

test('voucher payment rejects insufficient voucher, insufficient balance and excess deduction atomically', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 1000, request_id: 'fund' });
  const initial = e.store.state();
  assert.throws(() => e.wallet.buy({ product_id: 11, request_id: 'no-voucher', voucher_amount_cents: 100 }), x => x.code === 302);
  assert.deepEqual(e.store.state(), initial);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 0);

  const issued = e.mail.issueVoucher(voucherRequest({ request_id: 'grant-600', amount_cents: 600 }));
  e.mail.claim(issued.mail_id);
  const before = e.store.state();
  assert.throws(() => e.wallet.buy({ product_id: 11, request_id: 'too-much', voucher_amount_cents: 700 }), x => x.code === 302);
  assert.deepEqual(e.store.state(), before);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 0);

  const repeat = e.wallet.buy({ product_id: 11, request_id: 'repeat', voucher_amount_cents: 100 });
  const afterRepeat = e.store.state();
  assert.throws(() => e.wallet.buy({ product_id: 11, request_id: 'repeat', voucher_amount_cents: 200 }), x => x.code === 1);
  assert.deepEqual(e.store.state(), afterRepeat);
  assert.equal(e.wallet.buy({ product_id: 11, request_id: 'repeat', voucher_amount_cents: 100 }).order_id, repeat.order_id);

  const guarded = e.store.state();
  e.store.inspect(db => db.exec("CREATE TRIGGER deny_voucher BEFORE INSERT ON voucher_redemptions BEGIN SELECT RAISE(ABORT,'deny'); END"));
  assert.throws(() => e.wallet.buy({ product_id: 11, request_id: 'blocked', voucher_amount_cents: 100 }));
  assert.deepEqual(e.store.state(), guarded);
  assert.equal(e.voucher.balance().quantity, 500);
  assert.equal(e.pushes.filter(push => push.type === 1900).length, 1);
  e.store.inspect(db => db.exec('DROP TRIGGER deny_voucher'));

  const broken = createWalletService({ store: e.store, tables, codec: { ...codec, pack(name, value) { if (name === 'res_recharge_success') throw new Error('encode fail'); return codec.pack(name, value); } }, voucher: e.voucher });
  const beforeBroken = e.store.state();
  assert.throws(() => broken.buy({ product_id: 11, request_id: 'encode-fail', voucher_amount_cents: 100 }));
  assert.deepEqual(e.store.state(), beforeBroken);

  const poor = setup(t);
  poor.wallet.credit({ account_id: 'local-1', amount_cents: 100, request_id: 'small-fund' });
  const poorIssued = poor.mail.issueVoucher(voucherRequest({ request_id: 'poor-grant', amount_cents: 600 }));
  poor.mail.claim(poorIssued.mail_id);
  const poorBefore = poor.store.state();
  assert.throws(() => poor.wallet.buy({ product_id: 11, request_id: 'poor-balance', voucher_amount_cents: 100 }), x => x.code === 301);
  assert.deepEqual(poor.store.state(), poorBefore);
  assert.equal(poor.voucher.balance().quantity, 600);
});

test('voucher mail, grant and order state survive reopening the database', t => {
  const e = setup(t);
  e.wallet.credit({ account_id: 'local-1', amount_cents: 1000, request_id: 'persist-fund' });
  const issued = e.mail.issueVoucher(voucherRequest({ request_id: 'persist-mail', amount_cents: 600 }));
  e.mail.claim(issued.mail_id);
  const order = e.wallet.buy({ product_id: 11, request_id: 'persist-order', voucher_amount_cents: 200 });
  e.reopen();
  assert.equal(e.voucher.balance().quantity, 400);
  const snapshot = e.voucher.snapshot();
  assert.equal(snapshot.mails.length, 1);
  assert.equal(snapshot.mails[0].status, 'claimed');
  assert.equal(snapshot.totals.redeemed_amount_cents, 200);
  const stored = e.wallet.snapshot().orders.find(row => row.order_id === order.order_id);
  assert.equal(stored.voucher_quantity, 200);
  assert.equal(stored.balance_paid_cents, 400);
  assert.equal(codec.unpack('pb_rev_login_mail_info', e.mail.loginPayload()).mail_list[0].received, true);

  const db = new DatabaseSync(e.databasePath, { readOnly: true });
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3);
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name);
  for (const name of ['voucher_skus', 'game_mails', 'voucher_grants', 'voucher_redemptions']) assert.ok(names.includes(name));
  assert.ok(db.prepare('SELECT name FROM migrations WHERE name=?').get('voucher-mail-v3'));
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  db.close();
});

test('admin page serves voucher tools and issues/purchases through authenticated HTTP', async t => {
  const e = setup(t);
  const admin = createAdminService({ wallet: e.wallet, mail: e.mail, voucher: e.voucher, token: 'voucher-key' });
  const address = await admin.listen(0);
  t.after(() => admin.close());
  const url = 'http://127.0.0.1:' + address.port;
  const page = await fetch(url + '/');
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /voucher-layout/);
  assert.match(html, /voucher-amount/);
  const css = await fetch(url + '/admin.css');
  assert.equal(css.status, 200);
  assert.match(await css.text(), /\.voucher-layout/);
  assert.equal((await fetch(url + '/api/vouchers')).status, 401);

  const headers = { Authorization: 'Bearer voucher-key', 'Content-Type': 'application/json', Origin: url };
  const post = (route, body) => fetch(url + route, { method: 'POST', headers, body: JSON.stringify(body) });
  const credit = await post('/api/credit', { account_id: 'local-1', amount_cents: 1000, request_id: 'admin-credit' });
  assert.equal(credit.status, 200);
  const issue = await post('/api/vouchers/issue', { account_id: 'local-1', amount_cents: 600, request_id: 'admin-mail', expire_at: Math.floor(Date.now() / 1000) + 3600, title: '管理端发券' });
  assert.equal(issue.status, 200);
  const issued = await issue.json();
  assert.equal(issued.quantity, 600);
  assert.equal((await (await post('/api/vouchers/issue', { account_id: 'local-1', amount_cents: 600, request_id: 'admin-mail', expire_at: Math.floor(Date.now() / 1000) + 3600, title: '管理端发券' })).json()).duplicate, true);

  const state = await (await fetch(url + '/api/state', { headers: { Authorization: 'Bearer voucher-key' } })).json();
  assert.equal(state.vouchers.sku.item_tid, 701500);
  assert.equal(state.vouchers.balance.quantity, 0);
  assert.equal(state.vouchers.mails.length, 1);
  assert.equal(state.vouchers.totals.outstanding_amount_cents, 600);
  assert.equal(state.vouchers.mails[0].status, 'pending');

  e.mail.claim(issued.mail_id);
  assert.equal(e.voucher.balance().quantity, 600);
  const purchase = await post('/api/purchase', { account_id: 'local-1', product_id: 11, request_id: 'admin-buy', voucher_amount_cents: 200 });
  assert.equal(purchase.status, 200);
  const bought = await purchase.json();
  assert.equal(bought.voucher_quantity, 200);
  assert.equal(bought.balance_paid_cents, 400);
  const vouchers = await (await fetch(url + '/api/vouchers', { headers: { Authorization: 'Bearer voucher-key' } })).json();
  assert.equal(vouchers.balance.quantity, 400);
  assert.equal(vouchers.totals.claimed_amount_cents, 600);
});

test('gateway login module 93, mail claim, native 16004 voucher payment and 16003 acknowledgement', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-voucher-gateway-'));
  const legacyStatePath = path.join(directory, 'legacy.json');
  fs.writeFileSync(legacyStatePath, JSON.stringify(fixture()));
  const game = createLocalGame({ databasePath: path.join(directory, 'game.sqlite'), statePath: legacyStatePath, capturePath: new URL('../fixtures/login-modules.local-only.json', import.meta.url), localWallet: true, verifySession: (uid, code) => uid === 'local-user' && code === 'test-session' });
  let socket;
  t.after(async () => { socket?.destroy(); await game.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const issued = game.mail.issueVoucher(voucherRequest({ request_id: 'gateway-mail', amount_cents: 600, expire_at: Math.floor(Date.now() / 1000) + 3600 }));

  const address = await game.listen(0);
  socket = net.connect(address.port, '127.0.0.1');
  const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 }), queue = [], waiters = [];
  socket.on('data', chunk => { for (const data of decoder.push(chunk)) { if (waiters.length) waiters.shift()(data); else queue.push(data); } });
  const next = () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gateway response timeout')), 5000);
    waiters.push(data => { clearTimeout(timer); resolve(data); });
  });
  const send = payload => socket.write(encodeGameFrame(payload));
  await once(socket, 'connect');
  send(Buffer.from('verify'));
  const parsed = parseServerChallenge(await next()), key = 'ClientKey1234567';
  send(Buffer.concat([Buffer.from(key), localAesBeforeFinal(parsed.clientVerify, key, HANDSHAKE_FIXED_IV, { profile: LOCAL_AES_PROFILE }), parsed.rawFlags, Buffer.from('1.55.090365')]));
  const request = async (type, seq, data) => { send(codec.pack('pb_c2s', { type, seq, data })); return codec.unpack('pb_s2c', await next()); };

  let response = await request(909103, 1, codec.pack('login', { server_id: 1, channel_uid: 'local-user', verify_code: 'test-session', channel_extra: '' }));
  const login = await decodeEtf(Buffer.from(response.data, 'base64'));
  const modules = new Map(login[2].value);
  const mailModule = codec.unpack('pb_rev_login_mail_info', Buffer.from(modules.get(93).value));
  assert.equal(mailModule.mail_list.length, 1);
  assert.equal(Number(mailModule.mail_list[0].id), issued.mail_id);
  assert.deepEqual(mailModule.mail_list[0].award.map(row => [row.id, row.count]), [[701500, 600]]);

  response = await request(3002, 2, await encodeEtf([issued.mail_id]));
  assert.equal(response.err, undefined);
  const claimed = codec.unpack('pb_rev_one_key_award_mail', Buffer.from(response.data, 'base64'));
  assert.deepEqual(claimed.rev_id_list.map(Number), [issued.mail_id]);
  assert.equal(claimed.res.changes.find(change => change.tid === '701500').diff_num, '600');
  assert.equal(game.voucher.balance().quantity, 600);

  send(codec.pack('pb_c2s', { type: 16004, seq: 3, data: await encodeEtf([11, '', 701500]) }));
  const push = codec.unpack('pb_s2c', await next());
  const charged = codec.unpack('pb_s2c', await next());
  assert.equal(push.type, 1900);
  const success = codec.unpack('res_recharge_success', Buffer.from(push.data, 'base64'));
  assert.equal(success.is_use_token, true);
  assert.equal(Number(success.use_item_tid), 701500);
  assert.equal(success.order.length > 0, true);
  assert.equal(charged.seq, 3);
  assert.equal(charged.err, undefined);
  assert.equal(game.voucher.balance().quantity, 0);
  assert.equal(game.store.read().resources.get('101500').num, '60');

  response = await request(16003, 4, await encodeEtf(binary(success.order)));
  assert.equal(response.err, undefined);
  assert.equal(response.seq, 4);
  assert.equal(game.wallet.snapshot().orders.find(row => row.order_id === success.order).acknowledged, 1);
});
