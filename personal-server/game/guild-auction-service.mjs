import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, toSeconds,
  resOf, grantAwards, spendResources, asInteger, etfArgs, decodeCoopRequest, DIAMOND_TID
} from './guild-coop-shared.mjs';

// GuildAuctionCmd 107601-107603. Auction items, opening prices, duration and
// completion bonus are local policy. Bids spend real diamonds, replace (and
// refund) the previous high bid atomically, wishes persist per role, and a
// completed round can only pay its winners once.
export const GUILD_AUCTION_COMMANDS = Object.freeze({ bid: 107601, wish: 107602, get: 107603 });
const SCOPE = 'guild_auction';
const AUCTION_ID = 1;
const REQUEST_SCHEMAS = { 107601: 'req_guild_auction_bid', 107602: 'pb_guild_auction_wish_req' };

export function createGuildAuctionService({ store, codec, tables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.auction;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_AUCTION_COMMANDS));

  function freshAuction(at) {
    return {
      auctionId: AUCTION_ID,
      start: at,
      end: at + config.durationSeconds,
      settled: false,
      version: 1,
      items: config.items.map(item => ({
        uid: item.uid,
        resTid: item.resTid,
        count: item.count,
        price: item.startPrice,
        bidder: 0,
        bidTime: 0,
        state: 0
      })),
      records: []
    };
  }

  function auctionDoc(db, guildId, at) {
    const key = 'auction:' + AUCTION_ID;
    const existing = readDoc(db, SCOPE, guildId, '0', key);
    if (existing && at < Number(existing.end)) return existing;
    if (existing && !existing.settled) return existing;
    return existing ?? freshAuction(at);
  }

  function roleDoc(db, guildId, roleId, at) {
    return readDoc(db, SCOPE, guildId, roleId, 'state') ?? { wishes: [], records: [] };
  }

  function itemView(item) {
    return {
      uid: item.uid,
      res_tid: item.resTid,
      bid_player: item.bidder,
      bid_price: item.price,
      bid_over_time: 0,
      state: item.state,
      bid_player_list: item.bidder ? [item.bidder] : [],
      bid_time: item.bidTime
    };
  }

  function guildDataView(auction, context) {
    return {
      auction_tid: auction.auctionId,
      item_list: auction.items.map(itemView),
      record_list: auction.records.map(record => ({
        res_tid: record.resTid,
        time: record.time,
        bid_price: record.price,
        role_id: record.roleId
      })),
      version: auction.version,
      member_list: context.members.map(member => String(member.role_id)),
      bonus: config.bonus,
      pre_list: [],
      uid_index: auction.items.length,
      show_list: [],
      stage: auction.settled ? 2 : 1,
      is_award: auction.settled
    };
  }

  function bundle(auction, context) {
    return {
      guild_auction_info: { data_list: [guildDataView(auction, context)] },
      state_info: { state_list: [{ auction_tid: auction.auctionId, state: auction.settled ? 2 : 1 }] }
    };
  }

  function roleRecord(item, at) {
    return { res_tid: item.resTid, time: at, bid_price: item.price, is_bid: true, role_id: item.bidder };
  }

  function bid(input) {
    const auctionId = asInteger(input?.auction_id, 'auction id', { min: 1 });
    const itemUid = asInteger(input?.item_uid, 'auction item uid', { min: 1 });
    const spend = asInteger(input?.spend, 'bid amount', { min: 1 });
    if (auctionId !== AUCTION_ID) throw new GameError(1, 'Auction does not exist');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const auction = auctionDoc(db, context.guildId, at);
      if (at >= Number(auction.end)) throw new GameError(5, 'Auction has ended');
      const item = auction.items.find(row => Number(row.uid) === itemUid);
      if (!item) throw new GameError(1, 'Auction item does not exist');
      if (spend <= Number(item.price)) throw new GameError(5, 'Bid must exceed the current price');
      const previousBidder = String(item.bidder);
      const previousPrice = Number(item.price);
      const changes = spendResources(model, [[DIAMOND_TID, spend]], { code: 301, codec });
      if (item.bidder && previousBidder !== String(context.roleId)) {
        changes.push(...grantAwards(model, tables, [[DIAMOND_TID, previousPrice]], { codec, now }));
      }
      item.bidder = String(context.roleId);
      item.price = spend;
      item.bidTime = at;
      item.state = 1;
      auction.records.push({ resTid: item.resTid, time: at, price: spend, roleId: item.bidder });
      auction.version += 1;
      const role = roleDoc(db, context.guildId, context.roleId, at);
      const record = roleRecord(item, at);
      role.records.push(record);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', role, at);
      writeDoc(db, SCOPE, context.guildId, '0', 'auction:' + AUCTION_ID, auction, at);
      appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'auction_bid', amount: spend, details: { itemUid, previousBidder: previousBidder === '0' ? null : previousBidder }, at });
      return {
        data: codec.pack('rsp_guild_auction_bid', { is_bid: true, item: itemView(item), res: resOf(changes), add_role_record_list: [record] }),
        value: { itemUid, spend }
      };
    });
  }

  function wish(input) {
    const auctionId = asInteger(input?.auction_id, 'auction id', { min: 1 });
    const itemUid = asInteger(input?.auction_item_uid, 'auction item uid', { min: 1 });
    const doType = asInteger(input?.do_type, 'wish operation', { min: 0, max: 1 });
    if (auctionId !== AUCTION_ID) throw new GameError(1, 'Auction does not exist');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const auction = auctionDoc(db, context.guildId, at);
      if (!auction.items.some(item => Number(item.uid) === itemUid)) throw new GameError(1, 'Auction item does not exist');
      const role = roleDoc(db, context.guildId, context.roleId, at);
      const wishes = new Set(role.wishes.map(Number));
      if (doType === 1) {
        if (!wishes.has(itemUid) && wishes.size >= config.wishLimit) throw new GameError(5, 'Wish list limit is reached');
        wishes.add(itemUid);
      } else {
        wishes.delete(itemUid);
      }
      role.wishes = [...wishes];
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', role, at);
      return { data: codec.pack('rsp_guild_auction_wish', { auction_tid: auction.auctionId, focus_item_uid_list: role.wishes }), value: { itemUid, wishes: role.wishes.length } };
    });
  }

  function get(input) {
    if (etfArgs(input).length) throw new GameError(1, 'Auction get takes no parameters');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const auction = auctionDoc(db, context.guildId, at);
      const changes = [];
      if (at >= Number(auction.end) && !auction.settled) {
        auction.settled = true;
        auction.version += 1;
        for (const item of auction.items) {
          item.state = 2;
          if (String(item.bidder) === context.roleId) {
            changes.push(...grantAwards(model, tables, [[item.resTid, item.count]], { codec, now }));
          }
        }
        if (auction.records.some(record => String(record.roleId) === context.roleId)) {
          changes.push(...grantAwards(model, tables, [[DIAMOND_TID, config.bonus]], { codec, now }));
        }
      }
      const claimed = auction.settled && claimOnce(db, {
        scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'settle', period: String(auction.auctionId), at
      });
      writeDoc(db, SCOPE, context.guildId, '0', 'auction:' + AUCTION_ID, auction, at);
      return {
        data: codec.pack('guild_auction_get_req', bundle(auction, context)),
        value: { settled: auction.settled, claimed: Boolean(claimed), changes: changes.length }
      };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown guild auction command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = command === 107601 ? bid(input) : command === 107602 ? wish(input) : get(input);
    log({ event: 'guild_auction_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_AUCTION_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
