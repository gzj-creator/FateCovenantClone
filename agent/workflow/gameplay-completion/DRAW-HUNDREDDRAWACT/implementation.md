# DRAW-HUNDREDDRAWACT implementation

Date: 2026-11-08. Branch: `task/DRAW-HUNDREDDRAWACT-20261107`. Worktree: `.worktree/gameplay-20261106/draw-hundred`. Scope: `HundredDrawActCmd` 117001-117005.

## Delivery

- `game/hundred-draw-service.mjs` owns all five commands and their authoritative SQLite state.
- `config/hundred-draw-tables.mjs` loads the recovered `HundredDrawActTable` tables and the small `RoleTable.FigureHead` lookup needed by head rewards.
- `assets/tables/HundredDrawActTable.data.lua.json.gz` is a generated table dump. Source `analysis/scratchpad/draw-hundred/lua/HundredDrawActTable.data.lua` SHA256 is `711579447a2597a58a91a10697048f05c37a24f0c1709b3dfc06de81a336356c`; output SHA256 is `157c2df26c1f0617e1b35ed0725a29c0204d04f404de0d18d8833124da1a3d5c` (44,817 bytes, 48 prototypes). Rebuilding through `tools/extract-hundred-draw-table.mjs` reproduced the output hash exactly.
- `game/activity-read-service.mjs` no longer returns the old empty 117005 response. Gateway dispatch checks the hundred-draw service before the generic activity read path.
- Login synchronization writes each running type-1102 activity's `pb_hundred_draw_act_data` into that activity entry's `module_login_data` inside module 92 (`pb_act_login`).

The shipped `ActFrameTable` contains type 1102 activity ids 1102001 through 1102010. Their configured pools cover hero, pet, fantasy-equipment and elves themes. Pools 101-106 each contain draw-item cost, target/version data, progress-award library, star-task library and a 100-draw guarantee threshold.

## Command status

| type | Server behavior | Remaining evidence or limit |
| ---: | --- | --- |
| 117001 | Validates the type-1102 activity and running window; consumes `Pool.draw_item` once per draw; selects from `PoolAward` by `probability_num` with `weight` as fallback; persists cumulative/guarantee counts; grants real resources; records ontology marquee rows; returns `pb_hundred_act_draw_rsp`. | The guarantee threshold and ontology reset are driven by `Pool.guarantee_total_draw_times` and `PoolAward.award_type=102`. `GuaranteeWeight` is present in the recovered table, but its server selection semantics were not recovered; the current deterministic guarantee selects the first sorted ontology row. This must be checked against server evidence before calling the guarantee rule complete. |
| 117002 | Reads `ProcessAward` by `belong_version`, checks `draw_times`, rejects duplicate claims, grants award types 101/103, persists claim ids, and records big-node marquee entries. | Progress rows containing ontology chip awards whose target-to-chip mapping is not recovered fail closed with code 5. |
| 117003 | Supports `pool_type=102` (currently 1102009), validates the requested target against `Version.target`, and persists `select_target_tid`. | Only the devolve pool is supported by the client branch; other pool types explicitly reject target selection. |
| 117004 | Reads `StarTask` by library, checks the owned target hero's authoritative star, grants configured awards once, and persists `received_star_tid_list`. | Pet/elves/fantasy star predicates and non-hero skill mappings are not recovered. Non-hero themes and unresolved award type 104 fail with code 5 rather than receiving guessed rewards. |
| 117005 | Pages real `hundred_draw_marquees` rows in descending id order with a validated range capped at 200 and returns `pb_hundred_draw_act_marquee_rsp`. | Pagination and display semantics still need APK/original-server comparison. |

The service creates `hundred_draw_act_state` and `hundred_draw_marquees` lazily with an index on `(act_id, id)`. It does not change the shared game-store schema migration.

## Verification

Focused command/service run:

```text
node --test --test-concurrency=1 test/hundred-draw-service.test.mjs test/hundred-draw-gateway.test.mjs
tests 8 / pass 8 / fail 0
```

Coverage includes all five commands through a real temporary loopback TCP handshake and numeric gateway types, login module 92 data, item cost, progress-award claiming and duplicate rejection, target selection, hero star reward and duplicate rejection, pagination, and SQLite reopen. Separate failure tests force response encoding and SQLite state-write failures and verify both resource cost and domain state roll back. Tests use only temporary loopback sockets and temporary SQLite files.

The required activity/read, welfare, gateway and broader focused regression is run before merge; the final main full suite is run only after all current business branches are merged.

## Acceptance boundary

This is a server implementation with evidence gaps, not a completed APK acceptance. No live service was started or stopped, no running database or `runtime.local-only.data` was read or written, no emulator/ADB/APK was operated, and no original game server was contacted. APK acceptance remains pending, especially guarantee weighting, non-hero star tasks, type-104 skill rewards, chip target mapping and original response-code parity.

## 2026-11-11 legacy activity compatibility

真实事件 `2026-11-10T16:08:19.443Z command type=117005 seq=21 bytes=8` 暴露了旧活动代际未被百抽服务识别的问题：`ActivityTable.Act[20001]` 使用 `func=20/version=1`，而旧服务只接受 `ActFrameAct.type=1102`。

- `HundredDrawActTable.Version[1]` 映射池 `101`、礼包 `1841001`、商店 `182810`；池 `101` 的 `draw_item` 为 `835802`。
- 百抽配置查找和登录扫描现在同时接受旧 `func=20` 与新 `type=1102`。
- 登录同步输出父活动及其 `Version.gift/shop` 子行；`activity-calendar` 在 `schedule` 和 `all-open` 下都可用父活动窗口材料化这些明确关联行。线上新服 `00:00` 开服时，`20001` 的模块 92 自定义窗口早于静态表 `05:00` 窗口，因此登录和命令运行判定都使用实际自定义窗口。
- `PremiumActService` 记住本次登录材料化的子活动窗口，后续 `16005` 限购与可购检查不再回落到子行已经过期的静态窗口。
- 正式排期真实临时 TCP 覆盖：module 92 的 `20001` 数据、module 183 的 `20001/1841001/182810`、`1270963` 免费获得 `835802 x30`、`117001` 扣 10 张、`117005` 成功、SQLite 累计抽数为 10。测试固定在开服后 8 分 19 秒、静态表五点窗口之前，定向 43/43 通过。

`182810` 的兑换商店命令仍依赖缺失的 `ActShopTable`，继续明确拒绝。该兼容修复不改变保底权重、非英雄星级条件和其他既有证据边界。
