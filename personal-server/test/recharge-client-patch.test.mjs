import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readTextAssets } from '../../tools/unityfs-read.mjs';
import { patchDailyDiscountLua, patchCouponRechargeLua } from '../../tools/patch-wallet-payment-lua.mjs';
import { parseLuaJit } from '../protocol/lua-jit-dump.mjs';

const bundlePath = process.env.FC_RECHARGE_CLIENT_BUNDLE;
const assets = bundlePath ? new Map(readTextAssets(fs.readFileSync(bundlePath)).map(asset => [asset.name, asset.bytes])) : null;
const options = { skip: bundlePath ? false : 'Set FC_RECHARGE_CLIENT_BUNDLE to the accepted v9 Lua bundle' };
const truthy = value => value !== false && value !== null && value !== undefined;
const multiple = (...values) => ({ values });
const list = values => Object.fromEntries(values.map((value, index) => [index + 1, value]));

// Execute the real modified instruction paths with UI/network dependencies
// stubbed. Unsupported instructions fail so an untested path cannot pass.
function run(prototype, args, globals, upvalues = []) {
  const registers = [...args], constants = prototype.constants;
  let pc = 0, top = registers.length, steps = 0;
  const call = (fn, values) => {
    assert.equal(typeof fn, 'function');
    const result = fn(...values);
    return result?.values ?? [result];
  };
  const cloneTable = constant => ({ ...Object.fromEntries((constant.array ?? []).map((value, index) => [index, value])), ...Object.fromEntries(constant.hash ?? []) });
  while (pc < prototype.instructions.length) {
    assert.ok(++steps < 2000, 'Lua instruction path terminated');
    const { name, a, b, c, d } = prototype.instructions[pc++];
    const condition = value => { if (!value) pc++; };
    switch (name) {
      case 'GGET': registers[a] = globals[constants[d].value]; break;
      case 'UGET': registers[a] = upvalues[d]; break;
      case 'MOV': registers[a] = registers[d]; break;
      case 'KSTR': registers[a] = constants[d].value; break;
      case 'KSHORT': registers[a] = d > 32767 ? d - 65536 : d; break;
      case 'KPRI': registers[a] = [null, false, true][d]; break;
      case 'KNUM': registers[a] = prototype.numbers[d]; break;
      case 'TNEW': registers[a] = {}; break;
      case 'TDUP': registers[a] = cloneTable(constants[d]); break;
      case 'TGETS': registers[a] = registers[b][constants[c].value]; break;
      case 'TGETV': registers[a] = registers[b][registers[c]]; break;
      case 'TGETB': registers[a] = registers[b][c]; break;
      case 'TSETS': registers[b][constants[c].value] = registers[a]; break;
      case 'TSETB': registers[b][c] = registers[a]; break;
      case 'TSETV': registers[b][registers[c]] = registers[a]; break;
      case 'NOT': registers[a] = !truthy(registers[d]); break;
      case 'ADDVV': registers[a] = registers[b] + registers[c]; break;
      case 'ISF': condition(!truthy(registers[d])); break;
      case 'IST': condition(truthy(registers[d])); break;
      case 'ISEQN': condition(registers[a] === prototype.numbers[d]); break;
      case 'ISNEV': condition(registers[a] !== registers[d]); break;
      case 'ISGE': condition(registers[a] >= registers[d]); break;
      case 'ISLE': condition(registers[a] <= registers[d]); break;
      case 'JMP': case 'UCLO': pc += d - 32768; break;
      case 'FNEW': registers[a] = () => {}; break;
      case 'CALL': case 'CALLM': {
        const values = call(registers[a], registers.slice(a + 2, name === 'CALLM' ? top : a + c + 1));
        const count = b === 0 ? values.length : b - 1;
        for (let index = 0; index < count; index++) registers[a + index] = values[index];
        if (b === 0) top = a + count;
        break;
      }
      case 'ITERC': {
        const values = call(registers[a - 3], [registers[a - 2], registers[a - 1]]);
        registers[a] = values[0]; registers[a + 1] = values[1];
        break;
      }
      case 'ITERL':
        if (registers[a] !== undefined && registers[a] !== null) { registers[a - 1] = registers[a]; pc += d - 32768; }
        break;
      case 'RET': return registers.slice(a, a + d - 1);
      case 'RET1': return [registers[a]];
      case 'RET0': return [];
      default: assert.fail(`Unsupported Lua instruction ${name} at ${pc - 1}`);
    }
  }
  assert.fail('Lua path exited without a return');
}

function assertOnlyChanged(source, output, prototypes) {
  assert.equal(output.length, source.length);
  parseLuaJit(output);
  const changed = new Set(prototypes.flatMap(prototype => prototype.instructions.flatMap(item => [0, 1, 2, 3].map(offset => item.offset + offset))));
  // Constant regions of the three UI functions are also explicitly replaced.
  for (const prototype of prototypes) {
    const end = prototype.instructions.at(-1).offset + 4;
    const next = parseLuaJit(source).prototypes[prototype.index + 1];
    if (prototype.index !== 54) for (let offset = end; offset < next.instructions[0].offset; offset++) changed.add(offset);
  }
  for (let offset = 0; offset < source.length; offset++) {
    if (!changed.has(offset)) assert.equal(output[offset], source[offset], `Unrelated byte ${offset} preserved`);
  }
}

test('v9 daily UI uses daily stock despite expired Week Hunt and routes both paid offers', options, () => {
  const source = assets.get('RechargeSuperGiftBannerNode.lua');
  const output = patchDailyDiscountLua(source), parsed = parseLuaJit(output);
  assertOnlyChanged(source, output, [0, 9, 10, 11].map(index => parseLuaJit(source).prototypes[index]));
  const products = { 1: 40006, 2: 40009, 3: 40010, 4: 40008, 5: 46002, 6: 46003 };
  const sold = new Set([40006, 40009, 46002, 46003]);
  const payments = [], popups = [];
  const globals = {
    WeekHuntDataMgr: new Proxy({}, { get() { assert.fail('Daily UI must not consult the expired Week Hunt period'); } }),
    DailyDiscountMgr: { IsSelloutToday: id => sold.has(id), GetRemindCount: id => sold.has(id) ? 0 : 1, IS_EXTRA_BUY: true },
    DailyDiscountTable: { Recharge: tid => ({ recharge_id: products[tid], batch_update: list([2, 5]) }),
      RechargeValueIndex: () => ({ recharge_id: Object.fromEntries(Object.entries(products).map(([tid, id]) => [id, Number(tid)])) }) },
    RechargeTable: { Recharge: tid => ({ tid, pay_type: 0 }), PAY_FREE: 2 },
    RechargeMgr: { RechargeOrBuyGift: (...args) => payments.push(args) },
    CommerceBuyPopupForm: { Open: popup => popups.push(popup) },
    RedDotTable: { TID_DAILY_DISCOUNT: 1 },
    LocalizeTable: { EXPENSIVE_PRIVILEGE_BUY_LIMIT: 1 },
    Localize: { FormatText: (_, count) => String(count) },
    ipairs: rows => multiple((table, index) => table[index + 1] === undefined ? multiple() : multiple(index + 1, table[index + 1]), rows, 0)
  };
  for (const id of [40009, 46002, 40010, 40008]) {
    const node = { InitNode(_, value) { node.info = value; }, SetRedPath() {}, SetDesc(_, value) { node.desc = value; }, SetSelloutState(_, value) { node.sold = value; } };
    run(parsed.prototypes[9], [{}, node, { recharge_id: id, is_buy_additionally: true }], globals);
    assert.equal(node.sold, sold.has(id));
    assert.equal(node.info.buyTimes, sold.has(id) ? 0 : 1);
  }
  assert.deepEqual(run(parsed.prototypes[0], [6], globals), [true, true]);
  sold.delete(46003);
  assert.deepEqual(run(parsed.prototypes[0], [6], globals), [false, false]);
  sold.clear();
  assert.deepEqual(run(parsed.prototypes[0], [6], globals), [true, false]);
  for (const id of [40010, 40008]) {
    run(parsed.prototypes[11], [{}, id, 1, [5971200], [10]], globals);
    assert.equal(popups.at(-1).rechargeTid, id);
    assert.equal(popups.at(-1).isShowNumSelect, true);
    assert.deepEqual(popups.at(-1).resTidL, [5971200]);
    assert.deepEqual(popups.at(-1).resNumL, [10]);
    assert.equal(typeof popups.at(-1).buyFunc, 'function');
    run(parsed.prototypes[10], [], globals, [{}, id]);
  }
  assert.deepEqual(payments.map(([id, extra]) => [id, extra[1], extra[2], extra[3]]), [[40010, false, 0, 0], [40008, false, 0, 0]]);
});

test('v9 voucher success increases shared total, day and max amounts while compensation stays excluded', options, () => {
  const source = assets.get('RechargeMgr.lua'), output = patchCouponRechargeLua(source);
  const original = parseLuaJit(source).prototypes[54], patched = parseLuaJit(output).prototypes[54];
  const changed = new Set([27, 28].flatMap(index => [0, 1, 2, 3].map(offset => original.instructions[index].offset + offset)));
  for (let index = 0; index < source.length; index++) if (!changed.has(index)) assert.equal(source[index], output[index]);
  const evaluate = (prototype, useItem, compensated = false) => {
    const data = { totalAmount: 63300 }, daily = [], maximum = [], events = [];
    const manager = { UpdateRechargeRecord: (record, price, id, day, counted) => daily.push({ record, price, id, day, counted }),
      UpdateMaxRechargeRecord: (price, record, counted) => maximum.push({ price, record, counted }),
      DispatchRechargeEv: value => events.push(value) };
    run(prototype, [{ recharge_id: 40010, use_item_tid: useItem, is_use_token: useItem !== 0, time: 1794010000, get_token: compensated }], {
      RechargeTable: { Recharge: () => ({ price: 1200 }) }, Codec: { DecodeErl: () => list([list([false, 0, 20764])]) },
      FlushTime: { GetDayIndex: () => 20764 }, CurrencyMgr: { GetCouponItem: () => 701500 },
      EventUtil: { Fire: (...args) => events.push(args) }, RechargeMgr: { EVT_RECHARGE_GET_TOKEN: 2 }
    }, [data, manager]);
    return { total: data.totalAmount, daily, maximum, events };
  };
  assert.equal(evaluate(original, 701500).total, 63300);
  for (const useItem of [701500, 0]) {
    const result = evaluate(patched, useItem);
    assert.equal(result.total, 64500);
    assert.equal(result.daily[0].record.amount, 1200);
    assert.equal(result.daily[0].counted, true);
    assert.equal(result.maximum[0].counted, true);
    assert.equal(result.events.length, 1);
  }
  const compensation = evaluate(patched, 701500, true);
  assert.equal(compensation.total, 63300);
  assert.equal(compensation.daily.length, 0);
  assert.equal(compensation.events.length, 1);
});
