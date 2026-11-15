# D ITEM-MYSTERYSHOP / ITEM-PERIODTASK 证据与实施（2026-11-15）

批次：R1 剩余 5 组中的 D 组，命令 `91501`、`91502`、`101301`、`101302`、`101303`。
worktree `.worktree/r1-remaining-20261115/d`，分支 `task/r1-remaining-d-20261115`，基线提交 `12a6a16`。

**结论：5 条全部维持支付前失败关闭，本轮没有可以登记为成功链或部分成功的变更。** 本轮把两条此前写法模糊的缺口改成可复核结论：神秘商店的手动刷新价格阶梯、日限、折扣权重列已在原表/客户端字节码闭合，缺的是候选池与状态推进；周期任务的 `Task/Version/Score/Stage` 四族在同一版导出中确为 0 行。没有代码写入资源、领取位、次数或对象。

## 1. 逐 type 唯一状态

| type | 命令 | 状态 | decisionId | 支付前仍缺 |
| --- | --- | --- | --- | --- |
| `91501` | `req_mystery_shop_auto_refresh` | 仍失败关闭 | `R1-ITEM-MYSTERYSHOP-AUTOREFRESH` | 每格候选池与产出条数、`auto_refresh_weight` 的抽取阶段、`all_times_data`/`customize_auto_refresh_times` 推进、`next_auto_refresh_time` 计算 |
| `91502` | `req_mystery_shop_manual_refresh` | 仍失败关闭 | `R1-ITEM-MYSTERYSHOP-MANUALREFRESH` | 同上候选生成与 `discount_items` 替换；价格阶梯/日限本身已闭合 |
| `101301` | `req_period_task_award` | 仍失败关闭 | `R1-ITEM-PERIODTASK-TASK` | `PeriodTaskTable.Task` 0 行：task_type/count/param/pre_task/refresh_type 全缺 |
| `101302` | `req_period_stage_award` | 仍失败关闭 | `R1-ITEM-PERIODTASK-STAGE` | `PeriodTaskTable.Stage` 0 行：阶段 task_range 与原阶段奖缺 |
| `101303` | `req_period_score_award` | 仍失败关闭 | `R1-ITEM-PERIODTASK-SCORE` | `PeriodTaskTable.Score` 0 行与 `Version.score_item` 缺：积分阈值与原积分奖缺 |

## 2. 原证据

### 2.1 神秘商店（91501/91502）

- 原表 `MysteryShopTable.data.lua.bin` SHA256 `4c575e23cb8235f43882a908ad6b3d8b3c0d8047c1d1f352bd4f6f582afd1c1c`；离线资产 `personal-server/assets/tables/MysteryShopTable.data.json.gz`。族行数：`CellType 5 / Cell 14 / ItemLib 418 / Const 1 / ManualRefresh 5 / DiscountLibType 5 / DiscountLib 35`。
- `ManualRefresh` 5 行：tid 1–5，price `100/100/120/120/150`，currency_type 均 `101500`。
- `Const(1)`：`max_manual_refresh=5`、`buy_count_total=9`、`high_discount_up=75`、`bubble_cd_time=600`、`hero_full_star_correct=5`。
- `DiscountLib` 35 行按 `discount_lib_type 1–5` 各 7 行；列 `discount_idx/discount/auto_refresh_weight/manual_refresh_cw`。`manual_refresh_cw` 固定 4 段 `[2/4/5/20, weight]`。多行共享 `discount_idx=6`（70% 与 75%），因此 `discount_idx` 不是唯一键。
- `ItemLib` 418 行列 `cost_item/count/item/discount_price/tid/hero/is_rare_goods/pre_condition`；按 tid 首位分族 158/5/129/22/104；116 行有 `pre_condition`；**`is_rare_goods` 全为 false（0 行）**；158 行带 `hero`。
- PB `pb_mystery_shop`：`next_auto_refresh_time#1`、`last_manual_refresh_time#2`、`manual_refresh_count#3`、`discount_items#4 (pb_mystery_shop_item{cell_id,discount_item_tid,discount_price_index,is_bought})`、`all_times_data#5 (pb_mystery_times{times_type, times_data[]{tid,stage,times}})`、`customize_auto_refresh_times#6`、`buy_times#7`。登录模块 162。
- 客户端（`command-closure-46-20261115/item-a/prototypes`）：
  - `MysteryShopCmd` 只做 ETF 编码，三个请求无业务参数（SHA256 `9307…` 原型文件见目录）。
  - `MysteryShopMgr` 原型 #12 `GetRefreshPriceCfg`：常量 `numbers=[1]`，取“满足 `tid <= manualRefreshCount + 1` 的最后一行”；#15 `IsManualRefreshLimit`：`max_manual_refresh <= manualRefreshCount`；#27 用 `FlushTime.IsSameDay(lastManualRefreshTime)` 决定跨日清零。由此价格阶梯为 0→100、1→100、2→120、3→120、4→150、5 次封顶。
  - #19 `GetItemPrice`：`ItemLib[discountItemTid].discount_price[DiscountLib[discountPriceIndex].discount_idx]`，并返回 `cost_item`。
  - **客户端不做候选生成**：`discount_items` 完全由服务端下发，客户端只展示与消费 `is_bought`。
- 现有实现 `personal-server/game/mystery-shop-service.mjs` 只让 `91503` 通过 `supports()`（buy），`91501/91502` 注释明确仍由共享拒绝表接管。

### 2.2 周期任务（101301–101303）

- 原表 `11485873983200618000-PeriodTaskTable.data.lua.bin` SHA256 `4d1a2deeb86e235c771b2519271f5b507ee32a159642cfa075066a7348abf7d7`。
- 行为核验（不只信 extractor）：该 bundle 共 20 个原型；`RefreshType` 数据原型 30 条指令（3 行），而 `Task`/`Version`/`Score`/`Stage` 的数据原型各只有 4 条指令（空列表），与行级导出 `Task=0, RefreshType=3, Version=0, Score=0, Stage=0` 一致。第二份独立导出 `analysis/tmp/item-block-tables/PeriodTaskTable.json.gz` 同样为空。
- `RefreshType`：1→`PeriodTaskDayRefresh`、2→`PeriodTaskPeriodRefresh`、3→`PeriodTaskPermanent`。
- PB：`pb_period_task_all{list#1}`、`pb_period_task_info{version#1,task_list#2,stage_award_state#3,score_award_state#4}`、`pb_period_task_item{task_id#1,refresh_sec#2}`、`pb_period_task_back{period_task#1,res#2}`；请求 `101301` 为 ETF 单标量（input register 0），响应 `pb_period_task_back`。
- 客户端 `PeriodTaskMgr` 语义已闭合但无数据可用：版本取 `VersionList` + `Version.act`/`ActivityTimeUtil.GetActStateTime`/`server_valid_day`；任务奖按 `pre_task` 前驱与 `RefreshType.lua_module` 的 `GetTaskAwardState/IsTaskFinish/GetTaskProgress`；阶段奖要求 `Stage.task_range` 内全部任务已领；积分奖要求 `Version.score_item` 余额达到 `Score` 阈值。三种刷新模块分别用 `FlushTime.IsSameDay(refresh_sec)`、`_GetPeriodDayRange`、永久记录判定。
- 功能模块 545（`module-hosts.json`，`e_dir=project/period_task`）；`pb_period_task_all` 的具体登录槽号本轮仍未从 ModuleTable/LoginParse 闭合，未推定。

## 3. 本轮实现（只读证据层，不开放玩法）

- 新增原资产 `personal-server/assets/tables/PeriodTaskTable.data.json.gz`（SHA256 `9BADECAEA66041A30B9BD48FF60FFB2F6FD82B17C645870EA5A13781FC1932C9`，内容为上述 bundle 的逐族行，`sourceSha256` 写在文件内）。
- 新增 `personal-server/config/period-task-tables.mjs`：校验冻结 SHA、五族行数、`RefreshType` 三个 lua 模块映射；导出 `gameplayReady:false`、逐 type decisionId 与六条逐字段缺口。**未注册到网关或命令服务。**
- 新增 `personal-server/config/mystery-shop-refresh-evidence.mjs`：从既有 `MysteryShopTable` 校验并冻结手动刷新价格阶梯、货币、日限、五类折扣权重与 `[2/4/5/20] `权重段，导出与客户端一致的 `priceForRefreshCount()`、已证事实计数与六条逐字段缺口；`gameplayReady:false`。**未注册到网关。**
- 未修改 `gateway.mjs`、`r1-fail-closed-command-service.mjs`、`mystery-shop-service.mjs` 的任何成功路径；91503 窄成功链行为不变。

事务/重复/重开边界：本组没有可执行变更，因此没有新增写入；`91501/91502/101301/101302/101303` 继续在解析与状态访问前返回 `GameError(5, 原因 + decisionId)`，不扣费、不推进 `last_reap/manual_refresh_count/all_times_data`、不置领取位。共享失败关闭专项的真实 TCP 用例覆盖这 5 条的 err5 与“持久化状态逐字节不变”。

## 4. 验证

```powershell
node --check personal-server/config/period-task-tables.mjs
node --check personal-server/config/mystery-shop-refresh-evidence.mjs
node --test --test-concurrency=1 personal-server/test/period-task-evidence.test.mjs
node --test --test-concurrency=1 personal-server/test/mystery-shop-refresh-evidence.test.mjs
node --test --test-concurrency=1 personal-server/test/mystery-shop-service.test.mjs
node --test --test-concurrency=1 personal-server/test/mystery-shop-gateway.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
git diff --check
```

结果：新增两项专项 6/6；既有神秘商店专项 10/10、`mystery-shop-gateway` 真实临时 TCP 1/1、共享失败关闭 2/2（含 25 条真实 TCP 全量拒绝与状态不变）。合计 19/19。91503 成功链回归全绿。

## 5. 共享文件精确改动建议（由总控串行合并）

1. `personal-server/game/r1-fail-closed-command-service.mjs`：保留这 5 条，只把原因改成本轮可复核措辞：
   - `91501`: `ITEM-MYSTERYSHOP: per-cell candidate pool, auto-refresh weight stage, all_times_data/customize_auto_refresh_times advance and next_auto_refresh_time are not recovered`
   - `91502`: `ITEM-MYSTERYSHOP: manual price ladder and daily limit are recovered, but candidate generation and discount_items replacement are not`
   - `101301`: `ITEM-PERIODTASK: shipped PeriodTaskTable.Task has 0 rows (task_type/task_count/task_param/pre_task/refresh_type missing)`
   - `101302`: `ITEM-PERIODTASK: shipped PeriodTaskTable.Stage has 0 rows (stage task_range and stage awards missing)`
   - `101303`: `ITEM-PERIODTASK: shipped PeriodTaskTable.Score and Version.score_item are empty (score thresholds and awards missing)`
2. `personal-server/config/command-dispatch-audit.json`：无需改动（无新增路由，5 条仍属失败关闭服务）。
3. `docs/gameplay-operations/09-defects-and-acceptance.md`：在“R1 尚缺原始证据的 25 条命令”表中把 ITEM-MYSTERYSHOP 行改为“阶梯/日限/权重已核；候选生成与状态替换缺”，ITEM-PERIODTASK 行改为“Task/Version/Score/Stage 同版导出 0 行”；不改任何裁定。
4. `docs/gameplay-operations/system-rulebooks/economy-tasks-shops.md`：`#mystery-shop` 段补一句“ManualRefresh 5 档 100/100/120/120/150、货币 101500、日限 5、跨日按 `FlushTime.IsSameDay` 清零已由客户端原型 #12/#15/#27 闭合；DiscountLib 提供 `auto_refresh_weight` 与四段 `manual_refresh_cw`，但候选池与状态推进未闭合”；`#period-task` 段补一句“同版 bundle 的 Task/Version/Score/Stage 四族 0 行，RefreshType 仅 3 行”。
5. `agent/workflow/rule-implementation-20261115/implementation.md`：追加“D 组复核：5 条维持失败关闭”，不得写成完成项；失败关闭总数仍为 25。

## 6. 分层验收

| 层 | 状态 |
| --- | --- |
| 原证据已闭合 | 价格阶梯/日限/权重列为是；候选生成、周期任务配置为否 |
| R1 推定 | 本轮无新增推定 |
| 服务端完成 | 无（无成功链） |
| 离线 TCP | 仅拒绝路径通过（5 条 err5、无 payload、状态不变） |
| 存档/重开 | 无写入；共享用例验证拒绝前后状态逐字节一致 |
| APK | 未验收 |
| 生产 TCP / 生产库 | 未验收 |
| 部署 | 未执行 |

未启停实时服务、未读写生产库、未操作模拟器/ADB/APK。
