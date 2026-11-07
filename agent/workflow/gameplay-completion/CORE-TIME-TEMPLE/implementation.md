# CORE-TIME-TEMPLE 实施记录

日期：2026-11-08。分支 `task/CORE-TIME-TEMPLE-20261108`，worktree `.worktree/gameplay-20261106/core-time-temple`，基线 main `680b2b7`。

**状态：协议取证完成，映射结论为“客户端未注册”，服务端不实现业务。** 八个 `req_time_temple_*` 编码器在本版客户端（1.55.090365）没有任何数字 C2S type。这不是“映射难找”，而是发送链路在 `Connection:Send` 里以 `Cmd.c2s_index[cmd]` 查表，查不到就 `error("send msg type error")` 并直接返回，客户端根本发不出这些请求。因此本轮不新增任何猜测的网关业务分支，只把结论固化为证据、可复现工具和服务端显式的 fail-closed 常量；module 159 登录空态与 7801 推送维持原行为。未做 APK 与界面验收。

| 层级 | 结果 |
| --- | --- |
| 命令注册表 | `Cmd.lua` prototype 0 完整反解：`c2s_index` 1407 条、`c2s_back` 1189 条、`c2s_switch` 1407 条、`s2c_index` 307 条、`s2c` 262 条；八个神殿名字在五张表中全部为 null |
| 发送链路 | `Seq:Send` → `Session:SendMsg` → `Connection:Send`，唯一把名字换成 wire type 的位置是 `type = Cmd.c2s_index[cmd]`，缺失即中止 |
| 回包链路 | `Connection:_HandReqCallback` 用 `Cmd.c2s_back[cmd]` 解码回包，缺失同样无法处理 |
| 数值普查 | 1407 条唯一 type，min 10 / max 909103；7700–7900 与 900–910 各 0 条；7801 只在 S2C |
| 服务端 | 8 条命令登记为 `TIME_TEMPLE_UNREGISTERED_COMMANDS`（`numericType: null`），网关对任何猜测 type 仍回 `LOCAL_NOT_IMPLEMENTED` |
| 临时 TCP | 通过：真实握手与登录后发 7801、7701、7702、7709，四条均返回 `err:-1`、`LOCAL_NOT_IMPLEMENTED:<type>`，module 159 载荷与 snapshot 不变 |
| 回滚 | 通过：`pb_time_temple_data` 编码失败不落库；`login_modules` 上 `RAISE(ABORT)` 触发器使整笔事务回滚 |
| APK/UI | 未做（本轮禁止操作模拟器、ADB、APK 与实时服务） |

## 交付文件

| 文件 | 说明 |
| --- | --- |
| `tools/extract-cmd-registry.mjs` | 从 core bundle（或已解包的 `Cmd.lua.bin`）还原 `Cmd` 五张槽表；支持 `--lookup`、`--range`、`--out`、`--full` |
| `agent/workflow/time-temple/cmd-registry-20261108.json` | 本轮证据：源哈希、槽表规模、正控、八条查表结果（全 null）、数值普查、调用点、客户端发送路径、结论与限制 |
| `personal-server/game/time-temple-service.mjs` | 新增 `TIME_TEMPLE_UNREGISTERED_COMMANDS` 与 `unregisteredTimeTempleCommands()`；既有登录态、`createDrawPush`、`publishDraw` 未变 |
| `personal-server/game/gateway.mjs` | 新增 `payloadBytes()` 日志辅助并替换 8 处 `(request.data ?? Buffer.alloc(0)).subarray(...)`；修复空 payload 时 fallback 分支崩溃 |
| `personal-server/test/time-temple-service.test.mjs` | 由 1 项扩展到 5 项：既有登录/推送、注册缺口、真实 TCP fail-closed、编码失败、SQLite 回滚 |

未修改 `storage/game-store.mjs`（无新表、`user_version` 不变）、其他 agent 的服务与配置资产。

## 为什么是“不存在”而不是“没找到”

1. `Cmd.lua` 是客户端唯一的请求注册表。core bundle `64_lua_core.bundle`（393,040 B，SHA256 `054c3a1d5de29f66b5f41f413ac56a473ee7b95ccf1226b343068b79cdd3be56`，四份提取副本一致）里 `Cmd.lua`（165,335 B，SHA256 `36ebc52059977de944da4f57ab15ce0238acb360e07fc976dd68f4f73d4453c8`）的 prototype 0 只有 19 条指令，构造全局 `Cmd` 并把五张表存进常量槽。解析结果是完整表：`c2s_index` 1407 条、`c2s_back` 1189 条、`c2s_switch` 1407 条、`s2c_index` 307 条、`s2c` 262 条。
2. 表是真实且完整的，有正控：`req_guild_info → 21005`（`c2s_back: pb_guild`）、`req_chat_msg_like → 11014`（`c2s_back: pb_msg_like_rsp`），11000–11014 十条聊天命令全部命中。说明解析没有漏读。
3. 八个神殿名字在 `c2s_index`、`c2s_back`、`c2s_switch` 中都是 null。`CoreAssets.lua` 只有 `txt_Cmd_lua → "Cmd.lua.txt"` 一个命令表资产，没有第二份注册表；project bundle 内除 `TimeTempleCmd` 自身外没有文件引用 `c2s_index`。
4. 发送路径把“名字 → 数字”的转换只放在一处，且失败即中止：`TimeTempleMgr` 调 `Seq.New():Send(TimeTempleCmd.req_time_temple_*, ...)` → `Seq.lua` prototype 5 `NetMgr.GetSession(GAME_LOGIC_SESSION):SendMsg(cmd, ...)` → `Session.lua` prototype 8 `self._con:Send(cmd, ...)` → `Connection.lua` prototype 3 pc 41–45：`type = Cmd.c2s_index[cmd]`，为 nil 时 `error("send msg type error")` 并返回，不编码 `pb_c2s`。所以即使界面能点，请求也到不了服务端。
5. 回包同理：`Connection.lua` prototype 21 pc 10–15 用 `Cmd.c2s_back[cmd]` 选解码 schema。

数值普查进一步排除了“换个号段找”的路子：7700–7900 与 900–910 都是 0 条；`90501–90507` 是宠物活动（`req_pet_act_*`），`91001` 是能量爆发（`req_energy_burst_award`）。猜这些号段会把真实的别的模块路由劫持掉。

## 逐命令状态

映射列全部为“未注册”，服务端状态全部为“不实现”，因此不存在可路由的成功路径。

| 命令 | 客户端调用点 | 映射 | 回包契约 | 服务端状态 | 主要缺口 |
| --- | --- | --- | --- | --- | --- |
| `req_time_temple_embryo_up` | `TimeTempleMgr` prototype 7（胚胎升级） | 未注册 | `pb_embryo_up_back` | 不实现 | 奖励/消耗规则未恢复；回包 schema 仅名字可证 |
| `req_time_temple_bond_up` | prototype 9（羁绊升级） | 未注册 | 未恢复 | 不实现 | 无 `_back` 契约；等级与消耗规则未知 |
| `req_time_temple_runes_collect` | prototype 12（符文收集） | 未注册 | `pb_runes_collect_back` | 不实现 | 产出概率、消耗与冷却未知 |
| `req_time_temple_runes_up` | prototype 14（符文升级） | 未注册 | 未恢复 | 不实现 | 无 `_back` 契约；升级阶数与材料未知 |
| `req_time_temple_runes_skill_select` | prototype 17（符文技能选择） | 未注册 | `pb_time_temple_select_runes_skills` | 不实现 | 唯一 PB 编码请求；可选集合与洗练规则未知 |
| `req_time_temple_god_up` | prototype 21（神格升级） | 未注册 | 未恢复 | 不实现 | 无 `_back` 契约；属性与材料未知 |
| `req_time_temple_season_shop` | 无调用点 | 未注册 | 未恢复 | 不实现 | 名字只存在于 `TimeTempleCmd` prototype 6，本版没有 UI 调用 |
| `req_time_temple_draw_award` | prototype 19（抽取阶段奖励） | 未注册 | `pb_draw_phase_award_back` | 不实现 | 阶段划分与保底规则未知 |

已实现且保持不变的只有两件事：登录 module 159 的稳定空态（单元素 ETF 列表 + 0 字节 `pb_time_temple_data`），以及 S2C 7801 的 `pb_time_temple_draw` 推送格式与发送通道。

## 网关日志修复

回归时发现一个既有缺口：protobufjs 把空的 `bytes` 字段解成普通数组，于是 `payloadHead: (request.data ?? Buffer.alloc(0)).subarray(0, 64)` 在空 payload 上抛 `...subarray is not a function`，连接被销毁，客户端连 `LOCAL_NOT_IMPLEMENTED` 都收不到。这正是 fail-closed 承诺里最不该丢的一环，所以新增 `payloadBytes(data, limit)`（Buffer / Uint8Array / 数组 / 字符串归一）并替换 8 处同类写法（`unsupported_command`、`story_mission_rejected`、`mission_extra_rejected`、`fight_rejected`、`acc_recharge_rejected`、`group_buy_rejected`、`hundred_acc_rejected`、`voucher_recharge_rejected`）。行为变化只在日志字段，响应内容不变。

## 验证

专项测试 `test/time-temple-service.test.mjs`（5 项）：

1. 既有：删除 module 159 后重新登录补回空态、登录 ETF 形状、SQLite 重开、真实 TCP 7801 推送可反解、非法 uint32 与非法 `award_state` 被拒。
2. 新增：八条命令名顺序、`numericType` 全为 null、常量与每条记录冻结、返回副本与常量隔离、`game.timeTemple` 不暴露 `supports`/`execute`。
3. 新增：真实 loopback 网关发 7801、7701、7702、7709 全部返回 `err:-1` + `LOCAL_NOT_IMPLEMENTED:<type>`，module 159 载荷与 snapshot 不变，`unsupported_command` 事件类型顺序一致；随后 `publishDraw` 仍能推送 7801 并被反解。
4. 新增：`pb_time_temple_data` 编码抛错时不写 module 159，换回正常 codec 后同一入口成功。
5. 新增：在 `login_modules` 上装 `NEW.module_id = 159` 的 `RAISE(ABORT)` 触发器，同事务内的探针资源与 159 写入一并回滚，行数与资源均回到事务前。

回滚测试的探针（同事务写入 `resources` 的临时 tid）先在没有触发器的情况下确认能落库，再在触发器下确认消失，避免把“本来就没写”误当成回滚。

回归命令与结果见下节“验收结果”。

## 证据缺口

1. 本结论只覆盖 1.55.090365。后续客户端版本或热更新命令表可能注册这些名字，届时需要新的 `Cmd.lua` 证据。
2. `req_time_temple_season_shop` 在本版没有调用点，即使将来找到数字 type 也缺少界面侧语义。
3. 客户端另有门禁 `FunOpenMgr.IsOpen(FunOpenTable.TID_FUN_TIME_TEMPLE = 1199)` 与 `MagicalJourneyMgr` 赛季状态，其开启条件未解码；它影响界面可见性，不改变“请求无法发出”的结论。
4. `pb_embryo_up_back`、`pb_runes_collect_back`、`pb_draw_phase_award_back`、`pb_time_temple_select_runes_skills` 只恢复了名字，字段级契约未逐一展开；`bond_up`、`runes_up`、`god_up`、`season_shop` 连 `_back` 名字都没有。
5. 7801 的真实触发时机仍未观察；本轮只证明载荷格式与发送通道。
6. 奖池概率、保底、价格、刷新时间、资源扣除与属性接入全部未实现。
7. 未部署运行服务、未生成 APK、未操作模拟器，因此不代表 APK 实测或用户视觉验收。

## 复现命令

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\core-time-temple
node tools\extract-cmd-registry.mjs --bundle <64_lua_core.bundle> --lookup req_time_temple_embryo_up,req_time_temple_draw_award --range 7700-7900
cd personal-server
node --test test/time-temple-service.test.mjs
node --test test/time-temple-service.test.mjs test/m5-command-matrix.test.mjs test/gameplay-gateway.test.mjs
```

`64_lua_core.bundle` 属本地 APK 产物、不入库；任何一份 SHA256 为 `054c3a1d...` 的提取副本都可用于复现。也可用 `--cmd <Cmd.lua.bin>` 直接喂已解包的 TextAsset。

## 验收结果

```
test/time-temple-service.test.mjs
  tests 5  pass 5  fail 0  skipped 0

test/time-temple-service.test.mjs test/m5-command-matrix.test.mjs test/gameplay-gateway.test.mjs
  tests 21  pass 21  fail 0  skipped 0

npm test（personal-server 全量）
  tests 2428  pass 2426  fail 0  skipped 2  duration 291849ms
```

日志（主仓库 `analysis/test-runs/gameplay-20261106/`）：`core-time-temple-service.log`、`core-time-temple-regression.log`、`core-time-temple-full.log`。未做 APK 实机验收，未启停实时服务，未读写 `runtime.local-only.data`，未操作模拟器/ADB。
