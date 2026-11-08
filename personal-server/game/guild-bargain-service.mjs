import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, dayKey, toSeconds,
  resOf, grantAwards, spendResources, asInteger, etfArgs, decodeCoopRequest, DIAMOND_TID
} from './guild-coop-shared.mjs';

// GuildBargainCmd 101401-101404. The gift catalogue and price ladder are local
// policy (config/guild-coop-tables.mjs); membership runs, purchases and claim
// markers are persisted in the common cooperation tables. Five distinct guild
// members lower the price by one step, and each role can buy a gift once per
// daily guild round.
export const GUILD_BARGAIN_COMMANDS = Object.freeze({ info: 101401, bargain: 101402, buy: 101403, notBargain: 101404 });
const SCOPE = 'guild_bargain';
const REQUEST_SCHEMAS = {
  101402: 'pb_guild_bargain_req',
  101403: 'pb_guild_bargain_buy_req',
  101404: 'pb_guild_not_bargain_list_req'
};

export function createGuildBargainService({ store, codec, tables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.bargain;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_BARGAIN_COMMANDS));

  function freshGift(giftTid, day) {
    return {
      day,
      giftTid,
      currentPrice: config.startPrice,
      bargainers: {},
      buyers: {}
    };
  }

  function giftTid(input) {
    const value = input?.gift_tid ?? Object.keys(config.gifts)[0];
    const tid = asInteger(value, 'gift tid', { min: 1 });
    if (!config.gifts[tid]) throw new GameError(1, 'Bargain gift does not exist');
    return tid;
  }

  function stateDoc(db, context, at) {
    const day = dayKey(at);
    const doc = readDoc(db, SCOPE, context.guildId, '0', 'state') ?? { day, gifts: {} };
    if (doc.day !== day) {
      doc.day = day;
      doc.gifts = {};
    }
    return doc;
  }

  function giftDoc(doc, tid) {
    doc.gifts[tid] ??= freshGift(tid, doc.day);
    return doc.gifts[tid];
  }

  function guildView(gift) {
    const bargainList = Object.entries(gift.bargainers).map(([roleId, entry]) => ({
      role_id: roleId,
      bargain_price: Number(entry.price),
      bargain_time: Number(entry.time),
      has_bought: Boolean(gift.buyers[roleId])
    }));
    return {
      gift_tid: gift.giftTid,
      bargain_param_tid: gift.bargainers ? Object.keys(gift.bargainers).length : 0,
      current_price: gift.currentPrice,
      bargain_list: bargainList,
      refresh_time: 0,
      bargain_price_tid: gift.currentPrice
    };
  }

  function personView(gift, roleId) {
    const bargain = gift.bargainers[roleId];
    const buy = gift.buyers[roleId];
    return {
      buy_time: Number(buy?.time ?? 0),
      bargain_time: Number(bargain?.time ?? 0),
      buy_price: Number(buy?.price ?? 0)
    };
  }

  function handled(type, input) {
    const command = Number(type);
    if (command === 101401 && etfArgs(input).length) throw new GameError(1, 'Bargain info takes no parameters');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = stateDoc(db, context, at);
      const tid = command === 101401
        ? Number(Object.keys(config.gifts)[0])
        : giftTid(input);
      const gift = giftDoc(doc, tid);

      if (command === 101402) {
        if (gift.bargainers[context.roleId]) throw new GameError(3, 'This role already bargained for the gift');
        if (Object.keys(gift.bargainers).length >= config.maxBargainers) throw new GameError(5, 'Bargain limit is reached');
        gift.currentPrice = Math.max(config.floor, gift.currentPrice - config.step);
        gift.bargainers[context.roleId] = { price: gift.currentPrice, time: at };
        appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'bargain', amount: config.step, details: { giftTid: tid, price: gift.currentPrice }, at });
      } else if (command === 101403) {
        if (gift.buyers[context.roleId]) throw new GameError(3, 'This role already bought the gift');
        const changes = spendResources(model, [[DIAMOND_TID, gift.currentPrice]], { code: 301, codec });
        gift.buyers[context.roleId] = { price: gift.currentPrice, time: at };
        const awardChanges = grantAwards(model, tables, config.gifts[tid].items, { codec, now });
        appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'bargain_buy', amount: 1, details: { giftTid: tid, price: gift.currentPrice }, at });
        writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
        return { data: codec.pack('pb_guild_bargain_buy_rsp', { info: guildView(gift), res: resOf([...changes, ...awardChanges]) }), value: { giftTid: tid, price: gift.currentPrice } };
      } else if (command === 101404) {
        const bargained = new Set(Object.keys(gift.bargainers));
        const roleList = context.members.map(member => String(member.role_id)).filter(roleId => !bargained.has(roleId));
        writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
        return { data: codec.pack('pb_guild_not_bargain_list_rsp', { role_list: roleList }), value: { giftTid: tid, count: roleList.length } };
      }

      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return {
        data: codec.pack('pb_guild_bargain_get_info_rsp', { info: guildView(gift), personal_info: personView(gift, context.roleId) }),
        value: { giftTid: tid, price: gift.currentPrice }
      };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown guild bargain command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handled(command, input);
    log({ event: 'guild_bargain_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_BARGAIN_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
