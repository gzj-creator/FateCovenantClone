# HERO-LINEUP 实施记录（210 / 214 / 215 / 216 / 217）

日期：2026-11-07
分支：task/HERO-LINEUP-20261106（基于 main 5f87d34）
范围：personal-server 服务端实现、专项测试与交付记录。未启停实时服务、未操作模拟器/ADB、未读写 `personal-server/runtime.local-only.data`、未改 `docs/plans` 状态表、未改 APK。

## 结论

LineupCmd 的五条未路由命令已接入现有 lineup 派发块，预设阵容索引切换与自定义预设的新建、改名、保存、删除都走 `store.transaction`，自定义预设落在 `lineups` 表的 `payload_json` 内并在同一事务写入登录模块 9。208 / 209 / 218 分支保持原行为并回归通过。

当前完成层级：服务端业务 + 持久化 + 临时 TCP。真实 APK 操作与视觉验收未做（本轮禁止），未创建 APK 快照。

## 配置与协议依据

静态契约：

- 编队协议原文：`personal-server/assets/protobuf/lineup.net.proto.bin`（`pb_edit_pre_lineup_req/rsp`、`pb_edit_lineup_req/rsp`、`pb_set_pre_lineup_index_rsp`、`pb_lineup_login`、`pb_custom_lineup_set_name_req`、`pb_custom_lineup_set_req`）
- 预设 DB 协议：`personal-server/assets/protobuf/lineup.db.proto.bin`（`pb_role_lineup`、`pb_pre_lineup`、`pb_lineup`、`pb_lineup_team`、`pb_lineup_fighter`）
- 自定义预设 DB 协议：`personal-server/assets/protobuf/lineup_private.db.proto.bin`（`pb_custom_lineup_role`、`pb_custom_pre_lineup_list`、`pb_custom_pre_lineup`）
- 静态目录记录：`tcp:c2s:210:req_set_pre_lineup_index`、`tcp:c2s:214:req_custom_pre_lineup_new`、`tcp:c2s:215:req_custom_pre_lineup_set_name`、`tcp:c2s:216:req_custom_pre_lineup_set`、`tcp:c2s:217:req_custom_pre_lineup_delete`（`agent/workflow/interface-catalog/static-interfaces.json`）
- 既有整理：`agent/workflow/interface-catalog/lineup-preset-210-214-215-216-217.md`（本任务沿用其字段表，不重复抄写）

关键字段语义（全部有 proto 或表格证据）：

| 证据 | 内容 | 用途 |
| --- | --- | --- |
| `pb_role_lineup` | `pre_lineups=1`、`cur_pre_index=2`、`pre_lineups_standby=3`、`version=4` | 预设阵容权威结构 |
| `pb_pre_lineup` | `index=1(uint32)`、`lineup=2(pb_lineup_team)`、`select_camp=3` | 单套预设 |
| `pb_custom_pre_lineup` | `index=1(int64)`、`lineup=2(pb_lineup)`、`name=3`、`type=4(uint64)`、`lineup_type_list=5(repeated int64)` | 自定义预设 |
| `pb_custom_lineup_role` | `custom_pre_lineups=1`、`cur_index=2(uint64)` | 登录模块 9 的 `custom_pre_lineup` |
| `pb_custom_lineup_set_name_req` / `pb_custom_lineup_set_req` | `index` 为 uint64，默认值 0 不上线 | 缺失 index 视为 0 号自定义预设 |
| `pb_set_pre_lineup_index_rsp` | `copy_lineup=1(repeated pb_lineup)` | 切索引后需要覆盖的玩法阵容 |
| `pb_lineup.custom_lineup_index=4` | 注释“关联的定制阵容序号（0 为未使用预设阵容）” | 玩法阵容↔自定义预设的绑定 |
| `LineupTable.TemplateConst` | `max_lineup=20`、`create_lineup_index=0`、`main_lineup_index=-1` | 自定义预设上限与索引起点、主预设 -1 |
| `LineupTable.Type` | `same_with_pre`、`same_with_custom`、`team_count`（最大 5） | 哪些玩法阵容跟随预设/接受自定义预设，多队上限 |
| `LineupTable.PreUnlock` | tid 1–5，`relation_lineup` 1/69/70/81/82，tid 4/5 带 `unlock_condition` | 预设槽位与解锁；本服务只接受 `pre_lineups` 中已存在的槽位 |

实测样例：`personal-server/fixtures/login-modules.seed.json` 的 `game:tcp-69:s2c:103` 登录模块 9 中，`pb_custom_lineup_role` 只含 `custom_pre_lineups=[{index:-1,...}]`，且没有 `cur_index` 字段。因此 -1 是“跟随当前预设”的主条目，`cur_index` 保持缺省，不臆造 -1（uint64 无法表示 -1）。

## 实现设计

权威状态：

- `lineups.payload_json`（`pb_role_lineup` JSON）新增两个键：`custom_pre_lineups`（不含 -1 主条目）与可选的 `custom_cur_index`。未改 `game-store.mjs` 的 schema 或迁移，JSON 载荷向后兼容，proto 打包会忽略这两个额外键。
- 登录模块 9 的 `pb_lineup_login.custom_pre_lineup` 由同一事务内的 `writeCustomState` 重写为 `[主条目, ...custom_pre_lineups]`，因此 `materializeState` 写回的模块 9 与 `lineups` 表始终一致。
- 旧的运行库只有模块 9 里的自定义列表时，`ensureLoginState()`（登录时已由 gateway 调用）会把列表收编进 `lineups` 表，再按当前预设重建 -1 主条目；返回值仍是原有“被修复的玩法阵容类型”数组，不改变调用方语义。

命令语义：

- 210 `req_set_pre_lineup_index`：ETF 单参数索引，必须命中 `pre_lineups`；写 `cur_pre_index`，用 `same_with_pre && team_count===1` 的 `LineupTable.Type` 覆盖对应玩法阵容，返回 `pb_set_pre_lineup_index_rsp.copy_lineup`，同时刷新 -1 主条目。重复切换同一索引幂等。
- 214 `req_custom_pre_lineup_new`：请求 `pb_custom_pre_lineup_list`，按列表顺序创建；索引从 `create_lineup_index=0` 起取最小空闲值；未带阵容时复制当前预设；`type` 由队伍数推导（1–5）；`lineup_type_list` 只接受存在且 `same_with_custom=true` 的玩法类型，并写入 `pb_lineup.custom_lineup_index` 与镜像阵容。请求里已存在的索引（或同内容的重复提交）视为幂等重试而跳过，兼容“只带新草稿”和“带整份列表”两种理解。返回权威全列表。
- 215 `req_custom_pre_lineup_set_name`：校验索引存在、名称长度、非空名称不重名；返回单条 `pb_custom_pre_lineup`。缺失 index 视为 0 号（uint64 默认值语义）。
- 216 `req_custom_pre_lineup_set`：校验索引与阵容（英雄存在、格子存在、站位 1–6、无重复站位/格子/英雄、队伍数 ≤5），写回自定义预设，并同步所有绑定该预设的玩法阵容；返回单条 `pb_custom_pre_lineup`。
- 217 `req_custom_pre_lineup_delete`：ETF 单参数索引；删除预设、解绑相关玩法阵容（`custom_lineup_index=0`）、必要时清空 `custom_cur_index`。回包在仓库证据里是 `etf-fallback` 且 schema 未恢复，按 ETF 整数回显被删索引（`encodeEtfInteger`），不使用 protobuf。
- 208 / 209 / 218：逻辑未改动；209/218 额外复用 `writeCustomState` 刷新 -1 主条目，保证登录一致。

失败码（沿用本模块既有 515xx 段，客户端只显示通用错误）：

| 场景 | 码 |
| --- | --- |
| 非法参数/格式 | 1 |
| 英雄不存在 | 3001 |
| 格子不存在 | 3029 |
| 未知预设、编辑 -1 主条目 | 51553 |
| 未知/不接受自定义预设的玩法类型 | 51552 |
| 重复站位/格子 | 51554 |
| 重复英雄 | 51555 |
| 缺队伍或重复队伍 | 51558 |
| 超过二十条上限 | 51559 |
| 重名 | 51560 |
| 名称超长 | 51561 |
| 玩法类型已被其他自定义预设占用 | 51562 |

所有校验与编码都在同一个 `store.transaction` 内完成；`codec.pack` 抛错时整个事务回滚。

## 改动文件

- `personal-server/game/lineup-service.mjs`：新增 210/214/215/216/217，导入 ETF 编码器，重构自定义预设读写为“lineups 表权威 + 模块 9 同步”。
- `personal-server/game/gateway.mjs`：仅替换既有 `lineups.supports(type)` 块内的输入解码两行（ETF 与 PB 分派由服务声明），未重排无关代码。
- `personal-server/test/hero-lineup-service.test.mjs`：新增专项测试（服务、事务、持久化、真实 TCP）。
- `agent/workflow/gameplay-completion/HERO-LINEUP/implementation.md`：本记录。

未改：`personal-server/storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*`、`config/skill-database.json`、`docs/plans/*`、`apk/*`。

## 复现命令

```powershell
# 工作目录：F:\projects\FateCovenantClone\.worktree\gameplay-20261106\hero-lineup\personal-server
node --test test/hero-lineup-service.test.mjs
node --test test/hero-progression.test.mjs
npm test
```

## 验证证据

- 专项服务与 TCP：`node --test test/hero-lineup-service.test.mjs` → 5/5 通过
  - 新建→改名→保存→切换索引→删除全链路，删除同时解绑玩法阵容；
  - 重开 SQLite 后 `lineups` 表与登录模块 9 的自定义列表一致（`-1` 主条目 + 自定义条目）；
  - 非法索引、重复名称、越界英雄、非法队伍、非法类型、超额均返回业务失败且状态不变；
  - 注入 `codec.pack` 异常时事务回滚（新建与改名两处）；
  - 真实 TCP：握手 + 909103 登录后依次发送 214/215/216/209/210/217，数字 type 解码往返，二次删除返回 51553；结束时再次解模块 9 校验只剩 -1 主条目。
- 回归：`node --test test/hero-progression.test.mjs test/recruit-service.test.mjs` → 46/46（含 208/209/218 既有断言）。
- 全量：`npm test` → tests 2089 / pass 2086 / fail 3；三条失败均为 `test/login-business-reads.test.mjs` 依赖未分发的本地证据库 `analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite`（总控已确认的基线环境缺口），与本任务无关。

## APK 验收边界

本轮未启动服务、未操作模拟器，也没有真实客户端证据；以下需要后续 APK 验收：

- 预设阵容页面切索引（210）后玩法阵容是否随之刷新；
- 自定义预设新建/改名/保存/删除的 UI 反馈与数量上限提示；
- 217 回包形状：当前按 ETF 整数回显索引，客户端实际处理未验；
- `custom_lineup_index` 绑定在某玩法阵容后的显示与战斗取用。

## 具体剩余缺口

1. 217 的回包命令形状仍属 `etf-fallback`，静态证据没有 schema；如后续抓到真实回包，应以实测替换当前整数回显。
2. 自定义名称长度上限（当前 20 字符）与是否允许空名是推断值；实测样例只有 -1 主条目空名。
3. 214 请求究竟是“只带新增草稿”还是“带整份列表”未确证；实现按索引/名称幂等兼容两种，但若真实客户端要求服务端保留客户端索引，需要实测修正。
4. `pb_lineup.custom_lineup_index` 的 0 与 proto 默认值“未使用”重叠：0 号自定义预设的绑定只记录在 `lineup_type_list`，未被写入可区分的玩法阵容字段，需客户端实测确认表现。
5. `LineupTable.PreUnlock` 中 4/5 号预设槽位的 `unlock_condition`（582540600004/582540600005）未在本任务内解析与发放；当前只保证 210 只能切到 `pre_lineups` 已存在的槽位。
6. `pb_custom_lineup_role.cur_index` 的语义没有实测证据（捕获数据缺该字段），实现保持缺省、不写入。

