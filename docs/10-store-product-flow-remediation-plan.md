# 商城与任务链路修复总计划（2026-10-31）

## 目标

修复隔离客户端 `com.jzyx.ps` 连接本机个人服务器时的五组可见问题，并保持现有购买、钱包、活动快照和 SQLite 持久化边界不被破坏：

1. 每日必买一键购买中的免费礼包仍可购买，另两个付费礼包正确显示售罄；所有有限购礼包的售罄状态应使用同一服务端口径。
2. 必买返利购买后仍显示 7 次可领取，但领取按钮为灰；特惠返利存在同类问题。
3. 通行证/战令购买后没有界面反应，需要覆盖现有各类通行证和战令 SKU。
4. 背包中的表情包宝箱无法打开，需要确认协议、配置和奖励处理并接通。
5. 主线任务领取金币等奖励未完成，需要补齐当前真实客户端会触发的奖励领取链路。

本计划只处理隔离客户端和本机个人服务器。原版 `com.jzyx.my`、原服务器、APK 重签、设备路由和用户当前游戏进程均不在本计划的自动操作范围内。

## 工作树与基线

- 主工作区：`F:\projects\FateCovenantClone`
- 独立 worktree：`C:\Users\gzj\.codex\worktrees\766c\FateCovenantClone`
- 分支：`feature/store-product-flow-fixes-20261031`
- 初始基线提交：`3137e01 fix: align weekly gift sellout with current day`。F4/F5 已在基于最新 `main` `0fb31e5` 的独立集成 worktree 中复验并合入。
- 主工作区已有未提交 `tools/extract-battle-tables.mjs`，与本计划无关，禁止带入、覆盖或清理。
- worktree 的 `analysis` 目录通过 junction 指向主工作区的只读证据目录；所有子 agent 只能读取现有运行库、日志和截图，不得写入或清理其中的运行态数据。
- 被忽略的测试 fixture `personal-server/fixtures/login-modules.local-only.json` 已复制到 worktree，仅供离线测试。

## 验收级别

每个任务必须分别记录以下级别，不能互相替代：

- `组件通过`：目标 service、协议编解码和事务边界测试通过。
- `临时集成通过`：临时 SQLite、临时 loopback TCP 端口上的真实请求/回包、重开数据库验证通过。
- `运行服务请求通过`：部署后隔离客户端实际请求进入本机服务，日志与运行 SQLite 一致。
- `用户视觉通过`：用户确认对应界面按钮、数量、提示和奖励展示正确。

子 agent 默认只做到前两级，并完成代码和离线测试；部署、重启客户端和生产库写入由主 agent 在统一验收阶段执行。

## 任务拆分

| 编号 | 用户问题 | 子 agent 产出 | 主要代码边界 | 状态 |
| --- | --- | --- | --- | --- |
| F1 | 每日必买免费礼包未售罄；所有限购礼包售罄口径 | 统一限购计数与客户端展示字段；修复一键购买后免费礼包状态；补回归测试和证据说明 | `welfare-service.mjs`、`wallet-service.mjs`、`week-hunt-service.mjs`、相关配置与测试 | 主验收通过，已合入 main；待部署 |
| F2 | 必买返利/特惠返利购买后 7 次可领取但按钮灰 | 对齐购买记录、可领取次数、领取按钮状态和登录推送；覆盖两种返利 | `WishTree` 模块 165、91701/91704、钱包购买记录、登录同步与测试 | 主验收通过，已合入 main；待部署 |
| F3 | 通行证/战令购买无反应 | 盘点所有通行证 SKU，统一购买后的活动/模块/推送同步，覆盖标准通行证与月卡战令 | `permit-service.mjs`、`month-permit-service.mjs`、`wallet-service.mjs` 的购买接入与测试 | 主验收通过，已合入 main；待部署 |
| F4 | 表情包宝箱无法打开 | 定位具体物品与箱型，接通请求、扣箱、奖励发放、重开持久化 | `item-box-service.mjs`、对应资源/奖励处理与测试 | 主验收通过，已合入 main；待部署 |
| F5 | 主线任务领取金币等奖励未完成 | 定位客户端实际命令与任务表，补齐可验证的任务奖励领取，不伪造未证实的任务类型 | `task-service.mjs`、主线/任务协议接入与测试 | 主验收通过，已合入 main；待部署 |

每个任务的详细调查、根因、实现边界、测试命令和状态记录在 `agent/workflow/store-product-flow-fixes/<任务编号>.md`。子 agent 必须维护自己的文件；总计划表由主 agent 验收后更新。

## 每个任务的固定流程

1. 只读核对客户端真实请求、登录模块、配置表和现有测试，先写“证据 -> 根因 -> 实现边界”。
2. 在 worktree 内实现最小闭环，禁止使用未证实字段、伪造奖励或把显示成功当成购买成功。
3. 先跑本任务测试，再跑 `npm test --prefix personal-server` 全量测试。
4. 更新自己的状态文件，写明修改文件、测试结果、剩余风险、需要主 agent 集成的共享文件改动。
5. 不重启服务、不点击客户端、不修改生产 SQLite、不提交 Git；完成后把 worktree 路径、改动列表和验证结果发给主 agent。

## 共享文件规则

为减少并行冲突，子 agent 优先修改各自 service 和独立测试文件。以下共享文件只允许由主 agent 统一合并：

- `personal-server/game/gateway.mjs`
- `personal-server/game/wallet-service.mjs`（F1、F3 明确需要时先写 patch 说明，由主 agent 排序合并）
- `personal-server/game/resources.mjs`
- `personal-server/storage/game-store.mjs`
- `personal-server/package.json`
- 本计划文档和总验收记录

若任务必须修改共享文件，子 agent 在状态文件中给出精确函数、插入点、协议类型和建议 patch；不得与另一任务同时直接编辑同一共享文件。

## 并行编排

- 第一波：F2、F4、F5（代码和测试边界基本独立）。
- 第二波：F1、F3（两者可能涉及钱包购买流水，按顺序接入共享层）。
- 主 agent 在每波结束后检查差异、运行全量测试、补齐 gateway 路由和共享文件集成，再更新本计划状态。

## 统一验收门槛

- 所有新增测试和现有全量测试通过；测试必须使用临时数据库，不得写运行库。
- 购买/领取请求必须验证：重复请求幂等、余额或资源不足、售罄、未完成、活动关闭、编码失败回滚。
- 登录或推送后的字段必须与 SQLite 订单、资源、活动领取位和模块快照一致。
- 部署前保存运行 SQLite 一致备份和完整性检查；部署后只操作隔离客户端 `com.jzyx.ps`，所有 ADB 命令使用 `-s 127.0.0.1:16448`。
- 未取得用户视觉确认前，只能标记为“组件/临时集成通过”，不能标记“可玩验收通过”。

## 当前状态记录

### 2026-10-31 初始化

- 已创建独立 worktree 和分支，基线为 `3137e01`。
- 已建立五个任务状态文件，等待按波次派发子 agent。
- worktree 测试环境已补齐 `personal-server/node_modules` 和只读分析证据 junction；首个全量测试在复制 fixture 前因缺少 `login-modules.local-only.json` 失败，fixture 补齐后重新执行。
- 离线基线：`npm test --prefix personal-server` 为 **287/287** 通过。
- 主工作区未提交的 `tools/extract-battle-tables.mjs` 未复制、未修改。

### 2026-10-31 F4/F5 合入 main

- F4 与 F5 在基于最新 `main` `0fb31e5` 的独立 worktree `F:\projects\FateCovenantClone\.worktree\store-product-f4-f5-integration` 中完成干净集成。
- 主验收复测 F4、F5 和 gateway 目标测试 32/32 通过；全量 `npm test --prefix personal-server` 310/310 通过。
- F4 已接通 `1501200` 指定奖励箱的 151/159 路径、两种表情奖励、扣箱、回滚和重开持久化；F5 已接通命运阶段函数 155 对应的六个主线任务。
- 两项只达到组件和临时 TCP/SQLite 集成验收，尚未部署、未重启正式服务、未写生产 SQLite，也未取得用户视觉确认。
- F2 继续在总功能 worktree 调查和实现，不随本次合入 main。

### 2026-10-31 F1/F3 合入 main

- F1 以 32082e8、f6bb8c5 合入 main，统一了每日优惠购买事实、免费礼包模块 108/flag 40 同步、重复购买和重启回填口径。
- F3 以 aed3aea 合入 main，标准通行证 191201–191205 与当前活动月卡/战令 1300071–1300074 的购买回包均有非空 handoff，购买后模块与活动数据持久化。
- 主 agent 在商城专用 worktree 复跑全量 npm test --prefix personal-server：325/325 通过；两项仍属于组件与临时集成验收，待部署和隔离客户端视觉确认。

### 2026-11-01 F2 主验收

- F2 子 agent 原提交为 `416e3aa`；主 agent 在最新 main `f6bb8c5` 上完成文档提交 `d35e4c2` 和集成提交 `73da401`，集成分支为 `fix/store-f2-integration-20261101`。
- `WishTree` 模块 165 已接通登录规范化和订单回填；购买按两种返利类型及服务端 05:00 日界写入 `buy_day_list`，同类型同日幂等增加 `can_wish_count`。
- `91701` 已实现额度与开奖日校验、按 `normal_idx_list` 顺序发奖、MSB-first BitBlock、额度/次数更新及编码失败事务回滚；`91704` 已持久化自选奖励。
- 集成冲突仅在 `wallet-service.purchaseGift()` 的同一提交位置，最终同时保留 F1 的模块 108 同步和 F2 的模块 165 购买记录。
- 主集成目标测试 13/13 和 37/37 通过；集成分支全量 **334/334** 通过，合入 main 后全量 **344/344** 通过，`git diff --check` 通过。
- 已以合并提交 `13a3465` 合入 main；与 main 新进提交无冲突。
- 本轮未部署、未重启正式服务、未操作 ADB 或写入生产 SQLite；仍待部署、运行服务请求验收和用户视觉确认。
- `91703` 宝箱兑换仍返回明确未实现错误，不在本次“购买后可领取返利”范围。
