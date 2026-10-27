const $ = id => document.getElementById(id);
const fromHash = new URLSearchParams(location.hash.slice(1)).get('key');
let token = fromHash || sessionStorage.getItem('fc-admin-key') || '';
let state;
const pending = { credit: null, purchase: null, voucher: null };
if (fromHash) {
  sessionStorage.setItem('fc-admin-key', token);
  history.replaceState(null, '', location.pathname);
}

const money = cents => {
  const value = Number(cents) || 0;
  return (value < 0 ? '-¥ ' : '¥ ') + (Math.abs(value) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const names = { 101500: '钻石', 201500: '金币', 401500: '龙晶', 1601000: '冲榜积分', 701500: '代金券' };
const statusNames = { pending: '待领取', claimed: '已领取', expired: '已过期', deleted: '已删除' };
const time = value => value ? new Date(Number(value) < 100000000000 ? Number(value) * 1000 : Number(value)).toLocaleString('zh-CN') : '—';

function message(text, error = false) {
  $('status').textContent = text;
  $('status').className = error ? 'error' : '';
}

async function api(url, data) {
  const response = await fetch(url, {
    method: data ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, ...(data ? { 'Content-Type': 'application/json' } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401) $('auth').hidden = false;
    throw new Error(body.error || '请求失败');
  }
  return body;
}

function rows(target, items, render, columns) {
  const body = $(target);
  body.replaceChildren();
  if (!items.length) {
    const row = document.createElement('tr'), cell = document.createElement('td');
    cell.colSpan = columns;
    cell.textContent = '暂无记录';
    row.append(cell);
    body.append(row);
    return;
  }
  for (const item of items) {
    const row = document.createElement('tr');
    for (const text of render(item)) {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.append(cell);
    }
    body.append(row);
  }
}

function fillAccounts(select) {
  const previous = select.value;
  select.replaceChildren(...state.accounts.map(account => new Option(`${account.phone || '无手机号'} · ${account.account_id}`, account.account_id)));
  if (state.accounts.some(account => account.account_id === previous)) select.value = previous;
}

function voucherData() {
  return state?.vouchers ?? null;
}

function selectedProduct() {
  return state?.products.find(product => product.id === Number($('product').value));
}

function readYuan(input) {
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) throw new Error('请输入有效金额');
  return Math.round(value * 100);
}

function selectProduct() {
  const product = selectedProduct();
  const vouchers = voucherData();
  const balance = product?.price_cents || 0;
  const available = vouchers?.balance?.amount_cents || 0;
  const maximum = Math.min(balance, available);
  $('price').textContent = money(balance);
  $('rewards').textContent = product?.rewards.map(reward => (names[reward.tid] || '资源 ' + reward.tid) + ' × ' + reward.count).join('、') || '暂无商品';
  $('purchase-voucher-balance').textContent = vouchers ? `${vouchers.balance.quantity.toLocaleString('zh-CN')} 张 · ${money(available)}` : '代金券服务未启用';
  $('voucher-deduction').max = (maximum / 100).toFixed(2);
  $('voucher-deduction').disabled = !vouchers || maximum <= 0;
  $('use-max-voucher').disabled = !vouchers || maximum <= 0;
  if (!vouchers || maximum <= 0) $('voucher-deduction').value = '0.00';
  updatePurchaseQuote();
}

function updatePurchaseQuote() {
  const product = selectedProduct();
  const vouchers = voucherData();
  const price = product?.price_cents || 0;
  const available = vouchers?.balance?.amount_cents || 0;
  const maximum = Math.min(price, available);
  const requested = Math.max(0, Math.round((Number($('voucher-deduction').value) || 0) * 100));
  const applied = Math.min(requested, maximum);
  const balance = price - applied;
  $('balance-pay').textContent = money(balance);
  $('purchase-submit').textContent = applied > 0 ? `确认购买 · 余额支付 ${money(balance)}` : '使用余额购买';
  if (!vouchers) $('purchase-quote').textContent = '代金券服务未启用，本次将全额使用账户余额';
  else if (requested > maximum) $('purchase-quote').textContent = `最多可抵扣 ${money(maximum)}（可用 ${vouchers.balance.quantity.toLocaleString('zh-CN')} 张）`;
  else if (applied > 0) $('purchase-quote').textContent = `本次抵扣 ${money(applied)} · 使用 ${Math.round(applied / vouchers.sku.face_value_cents).toLocaleString('zh-CN')} 张代金券`;
  else $('purchase-quote').textContent = '本次不使用代金券';
}

function updateVoucherPreview() {
  const vouchers = voucherData();
  const cents = Math.max(0, Math.round((Number($('voucher-amount').value) || 0) * 100));
  if (!vouchers) {
    $('voucher-preview').textContent = '代金券服务未启用';
    return;
  }
  const count = Math.floor(cents / vouchers.sku.face_value_cents);
  $('voucher-preview').textContent = `${count.toLocaleString('zh-CN')} 张 · ${money(cents)}`;
}

function render() {
  $('auth').hidden = true;
  $('connection').textContent = '服务在线';
  const account = state.accounts[0];
  const vouchers = voucherData();
  $('balance').textContent = money(account?.balance_cents || 0);
  $('account-short').textContent = account ? `${account.account_id} · 角色 ${account.role_id}` : '无本地账户';
  $('voucher-available').textContent = money(vouchers?.balance?.amount_cents || 0);
  $('voucher-count').textContent = `${(vouchers?.balance?.quantity || 0).toLocaleString('zh-CN')} 张`;
  $('voucher-pending').textContent = money(vouchers?.totals?.outstanding_amount_cents || 0);
  $('voucher-pending-count').textContent = `${vouchers?.totals?.pending_count || 0} 封邮件`;
  $('credited').textContent = money(state.totals.credited_cents);
  $('order-count').textContent = `${state.totals.order_count} 笔订单`;
  $('nickname').textContent = account?.nickname || 'Local Adventurer';
  $('account-meta').textContent = [account?.account_id, account?.phone, '角色 ' + account?.role_id].filter(Boolean).join(' · ');

  fillAccounts($('credit-account'));
  fillAccounts($('voucher-account'));
  const selected = $('product').value;
  $('product').replaceChildren(...state.products.map(product => new Option('#' + product.id + ' · ' + money(product.price_cents) + ' · ' + product.rewards.map(reward => (names[reward.tid] || reward.tid) + '×' + reward.count).join('、'), product.id)));
  if (selected && state.products.some(product => String(product.id) === selected)) $('product').value = selected;
  selectProduct();
  updateVoucherPreview();

  rows('orders', state.orders, order => [
    time(order.created_at), order.order_id, '#' + order.product_id, money(order.price_cents),
    order.voucher_quantity ? `${money(order.voucher_amount_cents)} · ${order.voucher_quantity} 张` : '—',
    money(order.balance_paid_cents), order.acknowledged ? '已确认' : '已到账'
  ], 7);
  rows('ledger', state.ledger, entry => [
    time(entry.created_at), entry.kind === 'credit' ? '管理加款' : '充值消费',
    (entry.delta_cents > 0 ? '+' : '') + money(entry.delta_cents), money(entry.balance_cents),
    entry.details.note || entry.details.order_id || ''
  ], 5);
  rows('vouchers', vouchers?.mails || [], record => [
    time(record.send_time), '#' + record.mail_id, `${money(record.amount_cents)} · ${record.quantity.toLocaleString('zh-CN')} 张`,
    statusNames[record.status] || record.status, time(record.claimed_at), record.content || record.title || '—'
  ], 6);
}

async function load() {
  state = await api('/api/state');
  render();
}

async function refresh() {
  try {
    await load();
  } catch (error) {
    $('connection').textContent = '连接未就绪';
    message(error.message, true);
    throw error;
  }
}

async function submit(form, path, getData, kind, success) {
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  try {
    const data = getData();
    const signature = JSON.stringify(data);
    let record = pending[kind];
    if (!record || record.signature !== signature) {
      record = { signature, payload: { ...data, request_id: crypto.randomUUID() } };
      pending[kind] = record;
    }
    const result = await api(path, record.payload);
    pending[kind] = null;
    try { await load(); } catch {}
    message(success(result), false);
  } catch (error) {
    message(error.message, true);
  } finally {
    button.disabled = false;
  }
}

$('credit-form').addEventListener('submit', event => {
  event.preventDefault();
  submit(event.currentTarget, '/api/credit', () => {
    const cents = Math.round(Number($('amount').value) * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('请输入有效金额');
    return { account_id: $('credit-account').value, amount_cents: cents, note: $('note').value };
  }, 'credit', result => `加款成功，当前余额 ${money(result.balance_cents)}`);
});

$('purchase-form').addEventListener('submit', event => {
  event.preventDefault();
  submit(event.currentTarget, '/api/purchase', () => {
    const product = selectedProduct();
    const vouchers = voucherData();
    if (!product) throw new Error('请选择商品');
    if (!state.accounts[0]) throw new Error('没有本地账户');
    const requested = readYuan($('voucher-deduction'));
    const maximum = Math.min(product.price_cents, vouchers?.balance?.amount_cents || 0);
    if (requested > maximum) throw new Error(`代金券最多可抵扣 ${money(maximum)}`);
    return { account_id: state.accounts[0].account_id, product_id: product.id, ...(vouchers ? { voucher_amount_cents: requested } : {}) };
  }, 'purchase', result => {
    const voucherText = result.voucher_quantity ? `，代金券抵扣 ${money(result.voucher_amount_cents)}` : '';
    return `购买成功，订单 ${result.order_id}${voucherText}，余额支付 ${money(result.balance_paid_cents)}`;
  });
});

$('voucher-form').addEventListener('submit', event => {
  event.preventDefault();
  submit(event.currentTarget, '/api/vouchers/issue', () => {
    const vouchers = voucherData();
    if (!vouchers) throw new Error('代金券服务未启用');
    const amountCents = Math.round(Number($('voucher-amount').value) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('请输入有效发放面额');
    const days = Number($('voucher-days').value);
    if (!Number.isSafeInteger(days) || days < 0 || days > 3650) throw new Error('有效天数必须是 0 到 3650 的整数');
    const title = $('voucher-title').value.trim();
    const content = $('voucher-content').value.trim();
    return {
      account_id: $('voucher-account').value,
      amount_cents: amountCents,
      expire_at: days ? Math.floor(Date.now() / 1000) + days * 86400 : 0,
      ...(title ? { title } : {}),
      ...(content ? { content } : {})
    };
  }, 'voucher', result => {
    return `已发送邮件 #${result.mail_id}，代金券 ${result.quantity.toLocaleString('zh-CN')} 张，面额 ${money(result.amount_cents)}；需在游戏内领取`;
  });
});

$('auth').addEventListener('submit', event => {
  event.preventDefault();
  token = $('key').value;
  sessionStorage.setItem('fc-admin-key', token);
  refresh().catch(() => {});
});

$('refresh').onclick = () => refresh().catch(() => {});
$('product').onchange = selectProduct;
$('voucher-amount').oninput = updateVoucherPreview;
$('voucher-deduction').oninput = updatePurchaseQuote;
$('use-max-voucher').onclick = () => {
  const product = selectedProduct();
  const maximum = Math.min(product?.price_cents || 0, voucherData()?.balance?.amount_cents || 0);
  $('voucher-deduction').value = (maximum / 100).toFixed(2);
  updatePurchaseQuote();
};

for (const element of document.querySelectorAll('[data-amount]')) {
  element.onclick = () => { $('amount').value = Number(element.dataset.amount).toFixed(2); };
}
for (const name of ['wallet', 'vouchers', 'orders', 'ledger']) {
  $(name + '-tab').onclick = () => {
    for (const other of ['wallet', 'vouchers', 'orders', 'ledger']) {
      $(other + '-view').hidden = other !== name;
      $(other + '-tab').classList.toggle('active', other === name);
    }
  };
}

refresh().catch(() => {});
