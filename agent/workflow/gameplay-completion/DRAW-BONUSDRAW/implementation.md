# DRAW-BONUSDRAW implementation

Date: 2026-11-08. Branch: `task/DRAW-BONUSDRAW-20261108`. Worktree: `.worktree/gameplay-20261106/draw-bonus`. Base: main `8d24290` (no rebase needed). Scope: `BonusDrawCmd` 101901-101904, previously un-routed.

## Delivery

- `assets/tables/BonusDrawTable.data.lua.bin` is the shipped table bytecode, byte-identical to the client bundle copy `analysis/scratchpad/time-temple-20261108/project/2066070250748689400-BonusDrawTable.data.lua.bin` (31,408 bytes, SHA256 `cc01df92bdc68a6c034bd45d2e5442f5d5dca5b823cf74805fdb37f3c2520854`).
- `assets/tables/BonusDrawTable.data.lua.json.gz` is the generated dump (42,161 bytes, SHA256 `be9c8066f2e6b34cc16c46421f05ca7d9dc194ffd2e56e4e83be84ef75fe5a27`). Rebuild command, run from the repository root:

```text
node tools/extract-bonus-draw-table.mjs personal-server/assets/tables/BonusDrawTable.data.lua.bin personal-server/assets/tables/BonusDrawTable.data.lua.json.gz
```

  The extractor prints the source and output SHA256 values, so the dump can be re-checked against this record.
- `config/bonus-draw-tables.mjs` loads `BonusDraw`, `Pool` and `Lib`. The three companion `*_List` prototypes are not extracted: their constructors only read an engine-maintained upvalue index list, and the row tids in the dump already give the same ordering.
- `game/bonus-draw-service.mjs` owns the three commands and their authoritative SQLite state (`bonus_draw_state`, `bonus_draw_pool_awards`, created lazily with idempotent `CREATE ... IF NOT EXISTS`). It does not change the shared game-store schema migration or `user_version`.
- `game/gateway.mjs` imports the service next to the hundred-draw service (import list entry after `createHundredDrawService`), constructs `bonusDraw` directly after `hundredDraw`, and dispatches it in a block placed between the hundred-draw block and `if (activityRead.supports(type))`. That position keeps the generic activity reader, which has no bonus-draw handler, from seeing these types. 101902 is special-cased inside the block because its reply is an Erlang term, not a protobuf message.
- `test/bonus-draw-service.test.mjs` (10 tests) and `test/bonus-draw-gateway.test.mjs` (1 test) cover the three commands.

## Recovered table evidence

`BonusDrawTable` holds 8 `BonusDraw`, 51 `Pool` and 352 `Lib` rows:

- `BonusDraw{tid,cost_item,pool[],show_name,red,max_cnt,can_choose,convert_item,convert_num}`. Rows 1-3 cost item 660002 with `can_choose=false` and reference pools 1-21; rows 4-8 cost item 802002 with `can_choose=true` and reference pools 22-51. `max_cnt` is 5 on every row, `convert_item/convert_num` are 201500/1000.
- `Pool{tid,lib[8],probability}`. Pools 1-21 carry `probability=0`; pools 22-51 carry values between roughly 15608 and 15627 that sum to 468368. The column's meaning was not recovered and nothing in the client reads it, so the server does not use it.
- `Lib{tid,award=[[itemTid,num]],cnt,type}`. `type` uses the constants defined in the client-side `BonusDrawTable.lua` dump: `SMALL=0`, `MID=1`, `BIG=2`. Every pool configures one BIG, three MID and four SMALL libraries, and each library's `cnt` is the number of copies of that award in the pool. Totals are 8/12/16 copies for pools 1-21 and 40/50 for pools 22-51.

Client behaviour comes from `BonusDrawMgr.lua` (7,043 bytes, SHA256 `4c199e686418b16b793d56e8cb00903043bbd302e25d7382bb4e48d1728e8cba`), `BonusDrawCmd.lua` (722 bytes, SHA256 `fda36e53996a17eb761470cec4e4db4687f8ccb3831e5b16994d6f2722becf29`) and `BonusDrawUtils.lua` (929 bytes, SHA256 `0acb7e6c80fe71f8875e8c8b93952ebe6adbc07df958ccf8e3ecffa4e2a76f6c`), all from the same bundle directory. Disassembly of the manager is at `analysis/scratchpad/draw-bonus-20261108/mgr-disasm.txt`; prototype 9 has two valid constant boundaries and was decoded with a relaxed reader that accepts an upvalue count of 3. What it shows:

- `LoginParse` decodes `pb_bonus_draw_all` and stores one record per draw tid.
- `GetRemainDrawAwardCount` subtracts the drawn `award_list` entries from the configured `cnt` sum, `CheckCurBigAwardIsGot` compares the BIG library's drawn count against its `cnt`, and `GetDrawAwardList` groups the drawn tids by library `type`.
- `GetCurPoolConfigId` evaluates `BonusDrawTable.BonusDraw[id].pool[cur_pool]`, so `cur_pool` is a 1-based position inside the draw's `pool` array.
- The draw request sends `{id,num,stop}`, where `stop` means stop after a BIG award, and the UI clamps the count to `min(owned cost items, max_cnt)`.
- `ReqChangeBonusDrawPool` (101902) sends only `curBonusDrawTid` and reads `resp.cur_pool`. The command registry reports `c2s_back = null` for 101902, and `Connection.lua` decodes an empty schema with non-empty data through `Codec.DecodeErl`, so the reply body is an Erlang term.
- `ReqSwitchDrawPool(version, pool_id)` (101904) is called from `BonusDrawUtils.sureCb` with the draw tid as `version` and a `Pool` tid as `pool_id`, and expects `pb_bonus_draw`.

## Command status

| type | Server behavior | Remaining evidence or limit |
| ---: | --- | --- |
| 101901 | Validates the draw tid, resolves its cost item, `max_cnt` and every pool/lib/award along the chain, then samples uniformly without replacement from the copies still left in the current pool, consuming `cost_item` once per award and granting the configured items. `stop` ends the batch on the BIG library. Records each drawn library tid, returns `pb_bonus_draw_back{res,bonus_draw}` with the whole per-draw record. | Per-award weighting is unrecovered, so every remaining copy is equally likely; `Pool.probability` is unused. The `convert_item/convert_num` conversion rule is unrecovered, so awards are granted raw without a conversion step. Both need original-server or client evidence before this can be called parity. |
| 101902 | Advances `cur_pool` to the next configured position of the same draw, wrapping to 1 at the end, and persists it. A draw with fewer than two pools is rejected with code 5. The reply is an ETF map `#{<<"cur_pool">> => index}`. | Which pool the client expects after the last position (wrap versus stay) rests on the client's own modulo-style update; a real client has not confirmed the ETF map key or decoder shape. |
| 101904 | Resolves `version` as the draw tid, requires `pool_id` to be one of that draw's pools, stores the matching position, and returns `pb_bonus_draw`. Selecting the current pool fails with 310; a pool outside the draw fails with 1. | `can_choose` from `BonusDraw` is not enforced, and the client's own guard was not traced far enough to know whether it also blocks a repeat selection locally. |

Both write paths fail closed with code 5 for an unknown draw, pool, lib or award, code 1 for a bad count or a pool outside the draw, 301 for missing cost items, 312 for an exhausted pool and 313 when the batch exceeds the remaining copies.

## Verification

```text
node --test --test-concurrency=1 test/bonus-draw-service.test.mjs   tests 10 / pass 10 / fail 0
node --test --test-concurrency=1 test/bonus-draw-gateway.test.mjs   tests 1 / pass 1 / fail 0
m5-command-matrix + hundred-draw-service + hundred-draw-gateway
  + activity-read-service + gameplay-gateway                    tests 30 / pass 30 / fail 0
```

Logs: `analysis/test-runs/gameplay-20261106/draw-bonus-service.log`, `draw-bonus-gateway.log`, `draw-bonus-regression.log`.

The gateway test drives 101901, 101902 and 101904 over a real temporary loopback TCP handshake with numeric types and checks the ETF reply of 101902. The service tests cover cost charging, award granting, the `stop` break with a partial charge, pool exhaustion and short-pool rejection, persistence across a database reopen, pool switching with wrap, per-pool draw history, pool selection and repeat rejection, and rollback when protobuf encoding or the SQLite write fails. All use temporary loopback sockets and temporary SQLite files.

Full suite in `personal-server`: `npm test` reported 2449 tests, 2445 pass, 2 fail, 2 skipped (`analysis/test-runs/gameplay-20261106/draw-bonus-full.log`). Both failures are in `test/recommend-gift-count.test.mjs` (`native 16004 batch offer ...` returns err 310, `native 16004 uses available vouchers ...` times out) and reproduce on the base commit 8d24290 without any of these changes: that file alone reports 5 tests, 3 pass, 2 fail at `8d24290` (`analysis/test-runs/gameplay-20261106/draw-bonus-baseline-recommend-gift.log`). They belong to the voucher payment path, not to bonus draw.

## Acceptance boundary

This is a server implementation with evidence gaps, not an APK acceptance. No live service was started or stopped, no running database or `runtime.local-only.data` was read or written, no emulator, ADB or APK was operated, and no original game server was contacted.

Open items:

- `cur_pool` is treated as a 1-based index into `BonusDraw.pool` because the shipped `GetCurPoolConfigId` indexes it positionally, while the `.proto` comment describes it as a pool table tid. A real client capture would settle the conflict.
- `Pool.probability` semantics and the per-award weighting are unrecovered; draws are uniform without replacement.
- The `convert_item=201500` / `convert_num=1000` conversion is not applied.
- The client's `award_list` predicates read `x.tid`, while `pb_bonus_draw` declares the field as `repeated uint64`; the list display may need a client-side check.
- The 101902 ETF map key and decoder shape are unverified against a real client.
- No login slot was recovered for `BonusDrawMgr` (no slot id in the login module evidence, and the seed fixtures carry empty buffers), so login synchronization is not wired. `loginPayload()` builds a correct `pb_bonus_draw_all` from the same state and is covered by a test, ready to attach once the slot is known. Until then a relogin returns no bonus-draw list to the client.
- `BonusDrawBaseNode`, `BonusDrawAwardBaseNode` and `HeroDownBonusDrawNode` were only read for field usage; their UI-side clamping and node refresh timing were not traced.
