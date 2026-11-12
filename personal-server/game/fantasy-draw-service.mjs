import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';

const MODULE_ID = 518;
const DAY_SECONDS = 86400;

const dayIndex = seconds => gameDayIndex(seconds);
const fail = (code, message) => { throw new GameError(code, message); };

export function createFantasyDrawService({ store, codec, tables, now = () => Math.floor(Date.now() / 1000), logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const config = tables.FantasyDrawNormal?.get(1);
  if (!config || !tables.FantasyDrawNormalWish || !tables.FantasyDrawUnlock) {
    throw new Error('Fantasy draw configuration is missing');
  }
  const dailyLimit = Number(config.buy_daily_max_num), maxLimit = Number(config.buy_max_num);
  if (!(dailyLimit > 0) || !(maxLimit >= dailyLimit)) throw new Error('Fantasy draw purchase limits are invalid');

  function state(model, seconds) {
    const modules = new Map(model.state.modules.value);
    let module = modules.get(MODULE_ID);
    if (!module) module = { value: [], improper: false };
    if (!Array.isArray(module.value)) fail(5, 'Fantasy equipment login module is invalid');
    while (module.value.length < 3) module.value.push(serializedBinary(Buffer.alloc(0)));
    let draw;
    try {
      const bytes = rawBinary(module.value[2]);
      draw = bytes.length ? codec.unpack('pb_fantasy_draw', bytes) : null;
    } catch { fail(5, 'Fantasy draw login data is invalid'); }
    if (!draw) draw = { wish_list: [], total_draw_times: '0', wish_fail_times: '0', refresh_stamp: seconds, left_buy_times: dailyLimit };
    draw.wish_list ??= [];
    const previous = Number(draw.refresh_stamp ?? 0);
    const remaining = Number(draw.left_buy_times ?? 0);
    if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(remaining) || remaining < 0 || remaining > maxLimit) {
      fail(5, 'Fantasy draw purchase state is invalid');
    }
    if (previous > 0 && dayIndex(seconds) > dayIndex(previous)) {
      draw.left_buy_times = Math.min(maxLimit, remaining + dailyLimit * (dayIndex(seconds) - dayIndex(previous)));
      draw.refresh_stamp = seconds;
    }
    modules.set(MODULE_ID, module);
    return { modules, module, draw };
  }

  function write(model, current) {
    current.module.value[2] = serializedBinary(codec.pack('pb_fantasy_draw', current.draw));
    model.state.modules.value = [...current.modules];
  }

  function ensureLoginState() {
    log({ event: 'fantasy_draw_ensureLoginState_entry' });
    store.transaction(model => {
      const current = state(model, now());
      write(model, current);
    });
  }

  function setWish(request) {
    log({
      event: 'fantasy_draw_setWish_entry', request,
      requestHex: Buffer.isBuffer(request) || request instanceof Uint8Array ? Buffer.from(request).toString('base64') : undefined
    });
    const list = request?.wish_list;
    if (!Array.isArray(list)) fail(1, 'Invalid fantasy wish list');
    return store.transaction(model => {
      const current = state(model, now());
      const drawCount = BigInt(current.draw.total_draw_times ?? 0);
      const available = [...tables.FantasyDrawNormalWish.values()].filter(row => drawCount >= BigInt(row.draw_times ?? 0)).length;
      const unique = new Set();
      if (list.length > available) fail(305, 'Fantasy wish slots are not unlocked');
      for (const value of list) {
        const tid = Number(value), unlock = tables.FantasyDrawUnlock.get(tid);
        if (!Number.isSafeInteger(tid) || !unlock || drawCount < BigInt(unlock.draw_times ?? 0) || unique.has(tid)) {
          fail(1, 'Fantasy wish is invalid or locked');
        }
        unique.add(tid);
      }
      current.draw.wish_list = [...unique];
      const data = codec.pack('pb_fantasy_draw', current.draw);
      write(model, current);
      return { value: current.draw, data };
    });
  }

  function buyTickets(quantity) {
    log({ event: 'fantasy_draw_buyTickets_entry', quantity });
    const count = Number(quantity);
    if (!Number.isSafeInteger(count) || count < 1 || count > maxLimit) fail(1, 'Invalid fantasy ticket quantity');
    return store.transaction(model => {
      const current = state(model, now());
      if (count > Number(current.draw.left_buy_times)) fail(307, 'Fantasy ticket purchase limit reached');
      const cost = consumeResources(model, [[Number(config.buy_cost_item), Number(config.buy_price) * count]]);
      const reward = grantResources(model, [[Number(config.buy_award), count]], tables);
      current.draw.left_buy_times -= count;
      const value = { res: { changes: [...cost.changes, ...reward.changes], is_overflow: false }, draw: current.draw };
      const data = codec.pack('pb_fantasy_equip_draw_buy_rsp', value);
      write(model, current);
      return { value, data };
    });
  }

  return { moduleId: MODULE_ID, ensureLoginState, setWish, buyTickets, supports: type => type === 87617 || type === 87618 };
}
