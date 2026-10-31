# 个人服务器功能修复执行计划

更新时间：2026-10-26（Asia/Singapore）

## 当前边界

本计划承接 `promot/2026-10-25-wallet-admin-handoff.md`。仅处理隔离客户端 `com.jzyx.ps` 与本机个人服务器，不操作原版 `com.jzyx.my`，不连接或重放原服。当前基线账户 `local-1` 余额为 0、充值订单为 0；不擅自加款或发放奖励。运行服务状态需每次从 `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server.local-only.json` 实时读取，不能沿用记录 PID。运行 SQLite、管理密钥、事件日志和动态值均为本机私有数据，绝不提交；密钥不得写入公开文档。

用户要求修复后先审阅，认可后再重启游戏。故在用户认可前只允许代码、文档、离线测试和临时数据库集成测试；不得停止/重启服务或客户端，不点击设备、不更改 ADB 路由/reverse/UID 隔离、不清理运行状态。设备命令如以后经用户认可执行，必须使用 `-s 127.0.0.1:16448`。

## 故障与已知协议线索

| 编号 | 用户反馈 | 静态线索（尚不等于 APK 验收） | 结果目标 |
|---|---|---|---|
| W1 | 继续余额充值联调 | SDK `/pay/recharge/order`、游戏推送 1900、确认 16003；handoff 记录用户余额 0，支持配置商品 38 项 | 临时库证明签名/会话/金额校验、扣款/资源/订单/流水原子一致及幂等；最后由用户自行加款并触发真实购买 |
| G1 | 旅途战斗返回服务器错误 | `interfaces.json` 声明 type 201 `fight_start`、202 `fight_exit`、207 `fight_settlement`、203/204/213 报告；服务器事件已有 type 201 `unsupported_command` 证据 | 验证真实旅途 Mission/Fight 请求和登录模块；只实现有表/存档证据的合法普通关卡开始与结算闭环 |
| G2 | 背包宝箱开启报服务器错误 | ItemCmd type 151 `use_box`、152 `use_selected_box`、153 `use_repeat_box`、157 `batch_use_box`；配置需查 Item/Box 规则 | 先确认普通宝箱具体 type，校验持有量与奖励配置；事务扣箱发奖，未知/随机/选择类规则明确拒绝 |
| G3 | 海岛垂钓活动服务器错误 | ModuleTable 92139 `活动_钓鱼活动`；type 110301-110311；`fishing_act.net.proto` 可读 | 确认登录模块和活动时段数据；优先让活动读取可打开，再仅实现证据充分的垂钓/领取子集 |
| G4 | 超凡冒险者活动打不开 | ModuleTable 92144 为 `活动_助力升超凡`；type 116001-116004 的 HelpUp 请求/领奖 schema | 确认其是否与用户所称入口一致；不能把“冒险者活动”按名称直接映射，活动读取和奖励依据配置/进度 |
| G5 | 新超凡魔灵服务器内部错误 | 可区分魔灵养成 module 158、玩法 160、魔灵投放活动 92059；候选 type 包括 Pet 命令 90731-90748、活动 90501-90507，以及精灵 937xx | 通过 UI/Cmd/初始化模块确认具体入口和失败 type；确认前不得发宠物、伪造概率或使用错误的精灵命令 |

动态事件日志 `events.jsonl` 已见旅途 type 201 `unsupported_command`，这支持 G1 根因是网关缺命令处理，但请求字段和结算行为仍要结合包结构/配置确认。日志现阶段没有用户提及其他四类入口的对应请求，因此不得仅凭错误文案认定是哪条命令。

## 执行阶段

### 阶段 0：保护基线

1. 记录实时 `server.local-only.json`、监听端口/归属进程，并只读核实隔离身份；不重启或点击。
2. 读取 handoff 一致备份与验收 JSON，校验 SQLite `integrity_check`、账户余额、订单数及已有 activity_claims；不得对运行数据库做测试写入。
3. 任何测试数据库都从一致备份复制到新的临时目录，测试结束后仅删除自己创建的临时目录。所有私密输出继续使用 `.local-only.*`。

### 阶段 1：逐项协议取证与实现

1. 每项由一个实现责任人处理，阅读统一接口目录、对应 Cmd/Lua、protobuf schema、模块 92 活动结构与表配置。建立“命令号→请求 schema→响应 schema→存档状态/资源”的证据表。
2. 在 `personal-server/game/` 为新玩法建立独立 service 和测试；不要平行编辑共享 `gateway.mjs`、`game-store.mjs`、`package.json`。实现者先提交精确路由 patch，由集成负责人统一应用，避免合并冲突。
3. 所有奖励和战斗结果必须来自可验证配置、已观察存档/条件及确定性规则。缺配置的未知商品/活动/概率分支返回明确错误，不给客户端假成功。
4. 更新 `agent/workflow/fixes/<feature>.md`：证据、根因、实现边界、命令/字段、测试复现、组件/临时集成/APK/视觉验收状态分开记。

### 阶段 2：离线与临时集成验证

1. 先运行每项新增测试，再运行 `npm test --prefix personal-server` 全套。
2. 对真实网关路径的测试使用隔离临时端口和从一致备份复制出的临时 SQLite；验证 protobuf 编解码、回包序号、状态落库、SQLite 重开、幂等、防重复领奖、余额/资源/背包/活动领取位一致。
3. 覆盖非法关卡/不属于活动的 ID、活动未开启、资源不足、未知奖励配置及事务故障回滚；确保原有英雄、编队、用户领取位和 module 快照无回归。
4. 验收前比较运行 SQLite 文件和 `events.jsonl` 哈希/字节时间戳，确保代码测试没有触及生产运行状态。

### 阶段 3：集成代码审阅与用户批准

1. 主负责人逐项审阅证据和代码，拒绝无依据的时间、进度、排名、掉落、魔灵概率和奖励。
2. 应用通过审阅的精确网关 patch，运行全量测试和启动前静态检查；不启动第二个可能误连真实数据库的服务。
3. 提交代码与计划/修复文档，给用户列出逐项覆盖范围、测试结果、未覆盖项、下一次客户端验收操作。此阶段保持现有服务和客户端不动。
4. 用户认可后，才进入阶段 4。

### 阶段 4：用户认可后的部署与逐项验收

1. 部署前重新读取服务状态、核对 PID 命令行、五个端口均只监听 loopback、隔离包 UID/reverse 和 SQLite 完整性；保存运行库一致备份。
2. 只重启必要的本机服务并实时确认端口归属；再按明确安排决定是否重启隔离游戏。不能操作原版。SDK 会话存在内存，服务重启后需用户按本地测试登录页重新登录。
3. 一次只让用户验证一个功能，记录时间窗口和 type/seq，不替用户点击。依次建议：余额加款后 6 元普通商品；旅途普通关；普通背包宝箱；海岛垂钓打开及一次无付费操作；超凡活动打开；超凡魔灵具体入口。涉及花费、重要奖励或不可逆状态时用户自行决定是否执行。
4. 每步核对 APK 回包无 err、界面结果、SQLite/余额/资源变化及重登持久化。视觉确认由用户明确口述或提供已授权的截图证据；无此证据不得记“视觉验收通过”。

## 逐项验收定义

- **组件测试通过**：service 的边界、schema、规则单测通过；没有真实 socket/客户端证据。
- **临时集成通过**：临时 SQLite 与临时网关端口的完整请求/回包、事务和重开验证通过；不代表部署。
- **APK 请求通过**：隔离 APK 实际发送命令，生产本机服务日志/SQLite 显示处理结果；只证明协议链路。
- **用户视觉验收通过**：用户确认客户端活动/战斗/奖励画面正常，且存档/资源与回包一致。
- **功能可玩验收通过**：除视觉结果外，连续操作、边界条件与进程/数据库重开均符合预期；只对文档明确覆盖的子集成立。

## 当前状态

阶段 0 基线已核对：handoff SQLite 备份 `integrity_check=ok`，账户余额 0、订单 0、既有活动领取 3 条；实时运行数据未被写入或复制。`npm test --prefix personal-server` 当前 93/93 通过。全部个人服务器测试现统一位于 `personal-server/test/`，登录初始化测试数据已迁移为 `personal-server/fixtures/login-modules.local-only.json`，测试启动命令为 `node --test test/*.test.mjs`。

清理复刻客户端产物尚未完成：引用审计确认私服仍依赖 `analysis/reports/private-client-16448/lua-bundles/` 的协议/配置、两份加密 fixture、`analysis/tools/protocol/node_modules/erlang_js/Erlang.js`；这些不能删除。清理大文件目录的递归命令被执行策略拒绝，因此 APK、IL2CPP 提取物、抓包和隔离 APK 构建副本仍在原处，尚未删除。实时服务、游戏、SQLite、管理员密钥和端口均未触碰，也未发生重启。

G1 的 type 201 已在运行事件日志标记 `unsupported_command`，其余四项尚未取得对应真实请求证据；余额仍为 0、真实游戏购买待用户操作。本轮此前派发的 agent 没有可审阅修复产出；功能工作仍需按本计划逐项推进、测试、审阅。

## 2026-10-26 阶段 1-3 进展（待用户批准后进入阶段 4）

本轮按项目分工完成证据核对与实现，逐项记录在 `agent/workflow/fixes/`（索引见 `agent/workflow/fixes/README.md`）：

| 编号 | 结果 | 验收级别 |
|---|---|---|
| W1 | 未发现新缺陷；SDK 金额/商品/角色/区服校验、扣款幂等、订单与流水事务已有测试覆盖 | 组件 + 临时集成；真实购买待用户 |
| G1 | 新增 `game/mission-fight-service.mjs`：普通主线 201 开始、202 退出、207 结算、203/204/213 战报；确定性胜利并在事务内推进 module 8 `pb_mission.mission_id` | 组件 + 临时 TCP；无动作回放、无奖励 |
| G2 | 新增 `game/item-box-service.mjs`：仅执行 `Random_Box`+`DrawTable` 权重且无保底的配置化宝箱；选择/付费/重复/指定箱明确拒绝 | 组件 + 临时 TCP |
| G3 | 初期新增 110308/110303 空记录读取；后续已实现活动日历及 110301/110302/110305/110311 并部署 | 组件 + 临时 TCP + 真实登录响应；APK 操作和用户视觉待验收 |
| G4 | 新增 116004 助力次数读取；116001-116003 明确拒绝；入口映射仍无真实请求证据 | 组件 + 临时 TCP；入口未验证 |
| G5 | 未确认失败命令，未实现业务；`unsupported_command` 事件新增 `payloadHead` 便于定位 | 无 |

统一测试 `npm test --prefix personal-server` = **102/102 通过**（新增 `item-box-service`、`mission-fight-service`、`activity-read-service`、`gameplay-gateway` 共 9 项）。真实网关测试使用临时端口 + 从 `p3/wallet-admin-20261025/handoff-game.local-only.sqlite` 复制的临时库；运行服务 PID 与运行库、事件日志未被测试写入。

新增配置依赖：`analysis/reports/private-client-16448/lua-bundles/.../bytecode/DrawTable.data.lua.json`（由 `analysis/tools/dump-lua-file.mjs` 从同一 bundle 的 `DrawTable.data.lua.bin` 生成）。

未触碰：原版 `com.jzyx.my`、ADB reverse/UID 隔离、运行服务与客户端进程；本轮未重启、未点击、未加款。

## 2026-10-26 部署后复修（大厅错误与主线战斗“配置出错”）

用户实测两处失败：进入大厅弹“服务器错误”，点击主线“摆脱追兵”弹“配置出错了”。

| 问题 | 证据 | 处理 |
|---|---|---|
| 主线 201 被拒（code 5） | `Err.lua.bin` 错误表 `CONFIG_ERROR=5`；`MissionUIMgr` proto 99 常量池显示普通关卡只编码 `mission_fight_req{mission_id,is_assistant}`，`chapter_tid/section_idx` 保持默认 0 | 201 改为 `mission_id>0` 即普通关卡；`is_assistant` 作为自动战斗标记放行，BOSS+助手仍拒绝；拒绝日志新增 `payloadHead` |
| 大厅 1202/53002 未实现（err -1） | 事件日志 ETF 解码：1202 请求 `[207,206,201,203,204,218]`（商店 id），53002 请求 `[1004012]`（活动 id），均紧邻登录序列 | 1202 按请求 id 返回空商品组 `pb_query_shops_back`；53002 与 53001 一致返回空 `change_list` |

统一测试 `npm test --prefix personal-server` = **103/103 通过**。新增用例覆盖“mission_id-only 的真实客户端编码”“1202 按 id 回包”“53002 空回执”。商店购买（1201/1203/16005）与真实活动阶段推进仍未实现并明确返回错误。两处修复仍需用户重启后 APK 复测与视觉确认，未记为已验收。

## 2026-10-26 战斗回放最小实现

| 项目 | 实现 | 验收 |
|---|---|---|
| 真实关卡敌阵 | `MissionTable.Section[mission_id]` 提供 `fight` 与 `enemy`；`30201` 使用 `fight=301`、2 名配置敌人，空敌阵明确拒绝 | 组件 |
| 攻守 fighter | 攻方使用请求 `loc` 或当前旅程编队，守方使用 Mission 配置；英雄/NPC/技能从 Lua 表读取 | 组件 + 临时 TCP |
| 最小回放 | `pb_generic` 动作依次为 round ready 107、round over 112、battle over 104 | 组件 + 临时 TCP |
| 结算边界 | 只推进现有主线 module 与 207 重放，不伪造资源奖励、伤害或技能效果 | 组件 + 临时 TCP |

`missionFightPlayback:true` 已开启，定向测试 5/5 与 1/1 通过，统一测试 **104/104** 通过。下一步需要在隔离 APK 由用户自行点击当前主线：成功标准是战斗场景出现双方角色并进入胜利界面，207 不报错；尚不能把组件测试或协议可解码等同于 APK/视觉验收。

## 2026-10-30 活动修复检查点（worktree `feature/activity-fixes`，基线 `5aa0a21`）

用户实测海岛垂钓进入岛屿后点击挑战提示“配置出错”。日志确认对应命令是 110305 `req_fishing_act_unlock_map`，旧服务固定返回业务错误 5。该命令不是副本战斗，而是按 `act_id + map_id` 解锁当前钓鱼版本岛屿。

G3 现已实现：

- `1074001-1074011` 活动版本映射到 `FishingActTable.Version.island_version`，再校验 `FishingActTable.Island.belonging_version`。
- 用活动积分和 `FishingActTable.Level` 计算钓鱼等级；首解锁校验等级阈值、发配置奖励并写入 SQLite `fishing_activity_state`，重复请求幂等。
- 返回完整 `pb_fishing_act_data_res`，包括地图列表、三个状态 BitBlock、默认空鱼获/天气/鱼竿字段和资源变化。
- schema 升至 v6，迁移 `fishing-activity-state-v6`；现有角色、英雄、编队、资源与活动领取位不改写。
- 组件测试、临时 TCP 和 SQLite 重开通过；该检查点当时尚未部署，后续部署和活动日历证据见下文 2026-10-31 检查点。

其他活动已按 module 92 当前快照逐项登记在 `docs/08-activity-fix-checklist.md`，每完成一项再勾选。该检查点当时 110301/110302/110311 尚未实现；后续 2026-10-31 检查点已完成并部署。110304/110306/110307/110309/110310 奖励以及 HelpUp 116001-116003 仍保持明确拒绝。未点击客户端、未改动原版 APK 或 ADB reverse。

## 2026-10-31 活动日历与钓鱼闭环检查点

开服时间固定为 `2026-10-24 05:00 +08:00`（`1792789200`）。首轮钓鱼 `1074003` 已按配置在 2026-10-29 05:00 结束，下一轮 `1074005` 在 2026-11-03 05:00 开启；当前鱼饵无法获取是活动关闭后的正常结果。`83028` 的定制窗口在 2026-10-26 05:00 结束，登录响应现已动态移除。

新增 `game/activity-calendar.mjs` 按开服日过滤 module 92 并补入当前钓鱼代际，保留暂停位且不回写 SQLite 快照。schema v7 在 metadata 持久化 `serverOpenedAt`，合并魔灵商城后源码上限升至 v8。`110301/110302/110305/110311` 已实现并在事务内持久化鱼饵、鱼获、积分、奖励和待收鱼；每个钓鱼版本首次登录发放配置中的 25 个免费鱼饵，当前没有证据支持每日重复发放。

合并后 `npm test --prefix personal-server` 为 **199/199 通过**。临时 TCP 覆盖第 1 天钓鱼开放、免费鱼饵、解锁/甩杆/收鱼及第 8 天全部 `107400x` 与 `83028` 移除。实时服务仍运行既定 v7 数据库；本轮只合并源码，未部署。服务 PID 以 `runtime.local-only.data/server.local-only.json` 为准，五个端口仅监听 loopback；用户视觉与下一轮跨日 APK 操作仍待验收。

## 2026-10-31 活动测试全开配置

活动模式已从代码固定行为改为配置文件控制，默认文件为 `personal-server/config/activity-calendar.json`。正式模式 `schedule` 保留按开服日过滤；当前测试阶段设为 `all-open`，保留登录快照中的全部活动、清除暂停位、统一活动状态为开启，并指定 `1074011` 作为测试钓鱼版本。过期的 `83028` 与钓鱼入口会重新出现在登录响应中，但 SQLite 原始 module 92 不写回。

配置读取和模式校验位于 `personal-server/config/activity-calendar-config.mjs`。修改配置后需重启本机服务；`FC_ACTIVITY_CALENDAR_CONFIG` 可指定其他配置文件。全量测试为 **189/189 通过**，真实网关测试确认全开响应保留全部 SQLite 活动 ID，包括 `83028`。运行实例 PID 与模式以 `runtime.local-only.data/server.local-only.json` 为准。

## 2026-10-31 代金券 1 元面值与累充修复

代金券现固定为 `1 张 = 100 分（¥1.00）`，客户端 `score_token_rate` 同步改为 `100`。Web 管理页已改为默认发放 1 张并明确订单按商品原价计入累充；服务端在 `res_recharge_login.total_amount` 中始终增加商品原价。两套客户端支付确认文案均已改为“消耗代金券计入累充/本次消费计入累计充值”。

管理 API 已发放邮件 `#2`（`request_id=voucher-1m-20261031`）：1,000,000 张、每张 ¥1、永久有效。真实客户端已完成读取和领取，资源 `701500` 从 400 张增加到 1,000,400 张。最新 `forward6` 隔离 APK 已安装并进入大厅/充值商店；设备端 SHA256 为 `ae08340adf9faab19402567c5f4e92fae7bb7ceea52ab1ac21400c3128363bf5`。代金券与月卡专项 `16/16` 通过，真实 `¥6` 购买、确认文案视觉和累充增量仍待用户完成最后一步验收。

## 2026-10-31 每日优惠批量限购与真实支付闭环

- 46003（¥9 一键购买）已由真实客户端完成支付，服务端走 16004 → 1900 → 16003，订单 acknowledged=1，代金券扣除 9 张，星钻奖励到账。
- 修复 DailyDiscountRecharge.batch_update=[2,5] 未应用的问题：module 108 的行 6、2、5 现在同事务更新；服务启动从订单回填全部依赖行，避免“界面仍可买但后端 307”。
- 16004 在检查代金券余额前执行只读限购预检，已售罄商品稳定返回 307；额外购买只允许客户端显式 isExtraBuy=true。
- 全量测试 192/192 通过，覆盖真实 TCP 16004、1900、16003、重复/组件拒绝、不扣款和重启保持。运行库 schema v7、integrity_check=ok，修复前 6/2/5=1/0/0，修复后为 1/1/1。
- 服务 PID 8100 的五个端口均仅监听 127.0.0.1；隔离客户端已自动重连并完成 145 模块登录。证据见 analysis/experiments/private-server-20261025/p3/daily-discount-batch-20261031/。
- 当前可用 APK 快照为 apk/com.jzyx.ps.v9-working.apk，Hash 见 apk/README.md；SubDownloadFinish=1 前置条件不变。
