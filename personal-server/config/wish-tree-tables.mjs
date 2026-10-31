// Static rows decoded from WishTreeTable.data.lua.bin shipped by client
// 1.55.090365. The table only contains the small normal-tree catalogue used by
// module 165; keep the field names identical to the client table.
const global = Object.freeze({ tid: 1, max_accrue_day: 14, treasure_need_times: 10 });

const types = new Map([
  [1, Object.freeze({ tid: 1, gift: Object.freeze([46003, 46002, 40009]) })],
  [2, Object.freeze({ tid: 2, gift: Object.freeze([40010, 40008]) })]
]);

const row = (tid, special, item, count, extraItem = 0, extraCount = 0, selectAward = []) =>
  Object.freeze({ tid, special, item, count, extra_item: extraItem, extra_count: extraCount, select_award: Object.freeze(selectAward) });

const awards = new Map([
  [1001, row(1001, true, 2002, 10, 22002, 2, [1001, 1002, 1003, 1004])],
  [1002, row(1002, false, 33002, 10)],
  [1003, row(1003, false, 2002, 10)],
  [1004, row(1004, false, 33002, 10, 421200, 1)],
  [1005, row(1005, false, 101500, 888)],
  [1006, row(1006, false, 2002, 5)],
  [1007, row(1007, false, 101500, 666, 3002, 10)],
  [1008, row(1008, false, 2002, 5)],
  [1009, row(1009, false, 101500, 388)],
  [2001, row(2001, true, 3002, 10, 22002, 4, [2001, 2002, 2003, 2004])],
  [2002, row(2002, false, 33002, 15)],
  [2003, row(2003, false, 3002, 5)],
  [2004, row(2004, false, 33002, 15, 1321200, 1)],
  [2005, row(2005, false, 101500, 1288)],
  [2006, row(2006, false, 2002, 10)],
  [2007, row(2007, false, 101500, 888, 3002, 10)],
  [2008, row(2008, false, 2002, 10)],
  [2009, row(2009, false, 101500, 588)]
]);

const selectAwards = new Map([
  [1001, Object.freeze([1001, 1002, 1003, 1004])],
  [2001, Object.freeze([2001, 2002, 2003, 2004])]
]);

export const wishTreeTables = Object.freeze({
  WishTreeGlobal: global,
  WishTreeType: types,
  WishTreeAward: awards,
  WishTreeSelectAward: selectAwards
});

export function wishTreeTypeForGift(productId) {
  const id = Number(productId);
  for (const [type, config] of types) {
    if ((config.gift ?? []).includes(id)) return type;
  }
  return 0;
}

export function wishTreeDefaultAwardTids(type) {
  const giftType = Number(type);
  if (!types.has(giftType)) return [];
  return Array.from({ length: 9 }, (_, index) => giftType * 1000 + index + 1);
}
