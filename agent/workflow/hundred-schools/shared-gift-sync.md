# Hundred Schools shared gift synchronization

Date: 2026-10-31

## Trigger

The Hundred Schools gift list contains shared DailyDiscount products `40008`
and `40010`. `HeroDrawActGiftItemNode` handles RechargeTable type 46 through
`DailyDiscountMgr.RechargeGift`, so the wire request carries a JSON tuple in
`extra_param` instead of the integer Hundred Schools activity version. The
first implementation treated that tuple as DailyDiscount-only. A purchase
made from the Hundred Schools page therefore updated the daily row but left
the Hundred Schools limit, recommended-gift badge, and current-page state at
zero until the next login.

## Fix

- Type 46 shared products still use the existing DailyDiscount limits and
  protobuf update.
- The same committed wallet order now writes one Hundred Schools gift record
  when that activity is running and its independent limit still permits it.
- The 1900 recharge notification contains both flag `40`
  (`DailyDiscount`) and flag `92` (`Hundred Schools`) so both open pages update
  immediately.
- DailyDiscount additional purchases remain available after the normal daily
  row is sold out, but cannot create a second Hundred Schools purchase record.
- Direct Hundred Schools requests remain isolated and cannot consume the
  DailyDiscount allowance.

Client evidence:

- `HeroDrawActGiftItemNode.lua.json`, root prototype lines 96-119: type `46`
  constructs `period/day/isExtraBuy` and calls `DailyDiscountMgr.RechargeGift`;
  type `16/106` reaches `HeroDrawActMgr.ReqBuyRechargeGift`.
- `HeroDrawActMgr.lua.json`, prototype 25: `ReqBuyRechargeGift` passes the
  integer `GetVersion()` to `RechargeMgr`.
- `HeroDrawActMgr.lua.json`, prototype 29: the Hundred Schools client updates
  `recharge_limit_info` only from a flag `92` return containing
  `pb_hero_draw_act_role`.

## Verification

- Targeted `node --test test/hundred-schools.test.mjs`: 7/7 passed.
- Full `npm test`: 207/207 passed.
- Integrated `main` full regression after the endgame merge: 230/230 passed.
- Real temporary TCP 16004 purchase with the tuple-shaped DailyDiscount
  `extra_param` returns both flags, persists one `40010` Hundred Schools gift,
  and refuses a later direct duplicate without charging again.
- SQLite reopen preserves the shared purchase and its limit.
- `node --check` and `git diff --check` passed.

Real APK page-by-page visual verification remains user-driven; this pass did
not click the isolated client.
