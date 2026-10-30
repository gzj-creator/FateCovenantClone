# Hero Progression Evidence

Offline checkpoint: `2026-10-25T11:05:42.369Z`, 2517 packets and 248 game messages. Source: `analysis/captures/protocol-2026-10-25/decoded.local-only.json`; public packet/message index: [decode-summary.json](../../../analysis/captures/protocol-2026-10-25/decode-summary.json). Only field names, counts and comparisons are published. Instance IDs, request values, levels, resource identities and quantities remain local.

## Observed Exchanges

All exchanges are on `tcp-65`. Reply `seq` and `requestId` identify the originating request; the reply's `type=0` is not its command number.

| Operation | Type / Seq | Request ID / Packets | Response ID / Packets | Evidence Level |
| --- | --- | --- | --- | --- |
| Hero breakthrough | 638 / 97 | `game:tcp-65:c2s:3205` / 2407,2409 | `game:tcp-65:s2c:40569` / 2411 | Observed, decoded, user operation verified |
| Hero upgrade | 636 / 102 | `game:tcp-65:c2s:3313` / 2494,2496 | `game:tcp-65:s2c:40695` / 2498 | Observed, decoded, user operation verified |

The parent recorded the breakthrough baseline at packet 2355. The user confirmed clicking breakthrough; the parent retained the resulting animation as `hero-breakthrough-after.local-only.png`. For the upgrade, the user explicitly confirmed clicking upgrade once and then waiting. Neither exchange has an observed envelope error. These are separate operations with distinct request and response contracts.

## Contracts And Consumers

| Command | Request | Response |
| --- | --- | --- |
| `req_develop_hero_break` | ETF integer; the consumer supplies `cellIdx` | `pb_hero_break_ret`: `res`, `new_break_lv`, `change_hero_list` |
| `req_develop_up_lv` | `pb_hero_up_lv_req`: `hero_uid`, `up_lv_count`, `cell_index` | `pb_hero_up_lv_ret`: `res`, `new_lv`, `change_hero_list` |

The static command/schema links are in [static-interfaces.json](../interface-catalog/static-interfaces.json) and [static-schemas.json](../interface-catalog/static-schemas.json). Both response schemas and the upgrade request are owned by `13608142030213251000-hero_develop.net.proto.bin`, SHA-256 `9aee790b69b375ca775deaf2bfe09ef4308646a1df9af5951106cdc1f9407d71`.

The UI and state consumers support the interpretation independently of the command names:

- `5519511073943718000-HeroBreachForm.lua.bin`, prototype 21, source line 415: the breakthrough button checks conditions and calls `HeroDevelopMgr.SeqBreach(_curCellIdx, _curHero, callback)` at line 433.
- `13568180666481977000-HeroCmd.lua.bin`: prototype 14, line 175, ETF-encodes the breakthrough argument; prototype 12, line 147, builds the named upgrade PB fields.
- `12889656338346449000-HeroDevelopMgr.lua.bin`: prototype 25, line 461, sends the cell index through `req_develop_hero_break`. Its callback, prototype 24, line 477, applies `change_hero_list` with `InitBySrcHero`, writes `new_break_lv` to the cell's `break_level` and hero breakthrough state, parses `res`, invokes the UI callback and fires `EV_HERO_BREACH`.
- The same manager's prototype 23, line 414, sends `req_develop_up_lv`. Its callback, prototype 21, line 423, applies changed heroes, updates the cell's level from `new_lv`, refreshes attributes, parses resources and emits `EV_HERO_UPGRADE`.

Consumer locations are under candidate `assets__Android__script__lua__64_lua_project.bundle/textassets/`. The manager's SHA-256 is `b8e34701769614a8816fe8b6dc6d4137fdec6d8ca509fcc2ec85d0ca33ecdf4b`.

## State Comparisons

The login baseline comes from `game:tcp-65:s2c:103`: `ModuleTable.data.lua.json` prototype 5, source line 68, binds module 10 to `HeroDataMgr`. `11535996184519684000-HeroDataMgr.lua.bin` prototype 3, line 85, decodes the module list's first item as `pb_hero_info` and passes it to `InitHeroInfo`. That manager's SHA-256 is `479b2e2c6a1ffc84a7dd42e15d58c78102ba8249e71f5ab1d68b3af08c8d1b28`. Hero objects were normalized with the shipped schema's proto3 defaults before comparisons, so an omitted zero is not counted as a changed field.

| Comparison | Breakthrough, Seq 97 | Upgrade, Seq 102 |
| --- | --- | --- |
| Changed hero entries | 1 | 1 |
| Comparison baseline | Same identity in login module 10 | Same identity in seq 97 response |
| Identity and template retained | Yes | Yes |
| Changed hero fields | Only `breakthrough_level` | Only `level` |
| State transition | Breakthrough increases by one stage | Level increases by more than one |
| Response summary consistency | `new_break_lv` equals changed hero's breakthrough field | `new_lv` equals changed hero's level |
| Resource change entries | 2 | 1 |
| Negative resource deltas | Both entries | The one entry |

The upgrade request's `hero_uid` matches the returned hero internally, and its `cell_index` equals the prior breakthrough request's cell index. Its `up_lv_count` is greater than one; the resulting level increase exactly matches that count. **One user click produced a multilevel upgrade request.** The breakthrough stage established by seq 97 is retained in seq 102.

The resource entries are decoded server-reported deductions. This pass does not reconcile every resource balance or test persistence after reconnect. Other progression actions, upgrade limits, insufficiency failures, repeated breakthroughs and alternate hero/cell selections remain unverified.

## Offline Verification

Read the saved report without refreshing capture or accessing the device. Join the stable message IDs above to `privateFlows[].messageId`. Decode login module 10's first binary item as `pb_hero_info`; normalize the matching `hero` records with `defaults: true`, compare by identity locally, and publish only the comparison results above. Resource signs are compared as integers without publishing quantities.

The broad stock LuaJIT parser encounters ambiguous upvalue boundaries in unrelated parts of these two managers. Selected consumer prototypes and their child dependencies were therefore rewrapped in the original LuaJIT header as focused in-memory chunks and independently parsed with the unchanged stock `parse` function. Each chunk passed its complete-root/EOF check; its instruction operands and source lines matched the focused traversal. No shared parser or catalog was edited.

| Manager / Original Prototype | Raw Byte Offset / Length | Focused Stock Parse |
| --- | --- | --- |
| `HeroDevelopMgr` / 21 | 8624 / 675 | PASS |
| `HeroDevelopMgr` / 23, including children | 9836 / 244 | PASS |
| `HeroDevelopMgr` / 24 | 10082 / 593 | PASS |
| `HeroDevelopMgr` / 25, including child | 10677 / 546 | PASS |
| `HeroDataMgr` / 3 | 280 / 1236 | PASS |

## Catalog State Changes

- `req_develop_hero_break`: One existing hero increased its breakthrough stage by one. Its identity and other normalized fields were retained; the response's `new_break_lv` matches the changed hero. Two resource deductions were reported. The user confirmed the breakthrough action and its animation.
- `req_develop_up_lv`: One user click requested and returned a multilevel upgrade for the same hero and cell as the preceding breakthrough. The level increase matches `up_lv_count`; the breakthrough stage and other normalized hero fields were retained. One resource deduction was reported.
