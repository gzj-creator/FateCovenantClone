# BLOCK-D 实施记录（#65–#86：物品、商店与日周任务）

日期：2026-11-08
分支：`task/BLOCK-D-20261108`（worktree `.worktree/gameplay-20261108/block-d-20261108`）
基线：`main@bd650ba`

块内 22 卡 / 58 条命令，其中 9 卡（ITEM-SHOP、ITEM-ITEM、ITEM-MISSION、ITEM-GUIDE、ITEM-EVERYTASK、ITEM-COMMONTASK、ITEM-RANKACHIEVE、ITEM-FIRSTWEEKGOAL、ITEM-GROWTHROAD）在进入本块前已合入 main，状态见 `docs/plans/remaining-gameplay-20261106/execution-status.md`。本块处理剩余 13 卡 / 27 条命令。

## 本块交付

| 卡 | 命令 | 状态 | 记录 |
| --- | --- | --- | --- |
| ITEM-FUNCTIONMANUAL | 82301 | 服务端完成（手册 28 行中统计源/主线章节源可领，其余进度源 code 5） | [ITEM-FUNCTIONMANUAL](../ITEM-FUNCTIONMANUAL/implementation.md) |
| ITEM-TASKACTIVITY | 105701 | 服务端完成 | [ITEM-TASKACTIVITY](../ITEM-TASKACTIVITY/implementation.md) |
| ITEM-TASKACTIVITY | 105702 | 未实现：`server_vitality` 无权威来源，按 `5` 拒绝 | 同上 |

新增资产与工具：

- `tools/extract-lua-table-rows.mjs`：LuaJIT 生成表 → 行 JSON 的可复现抽取器（`<XxxTable.data.lua.bin> <out.json.gz>`）。
- `personal-server/assets/tables/FunctionManualTable.rows.json.gz`（`Task` 28 行）、`TaskActivityTable.rows.json.gz`（`Lib` 138 / `Common` 6 / `Tag` 12）。
- `personal-server/config/item-task-tables.mjs`、`personal-server/game/task-statistics.mjs`、`personal-server/game/etf-binary.mjs`。

## 未交付命令与阻塞证据

以下 10 卡 24 条命令未实现，再加上 ITEM-TASKACTIVITY 的 105702，本块 27 条命令中有 25 条未交付。每条命令的请求/回包 schema 已确认（引自 `personal-server/assets/protobuf/**`、`docs/plans/remaining-gameplay-20261106/04-items-tasks-shops.md`），阻塞点都在“权威状态或奖励配置”上；没有用空包、固定值或客户端自报完成来销项。

### ITEM-RESCOMPLETE（288 `req_res_complete_award`）

- `ResCompleteTable` 已抽取：`Open` 3 行（`size`、`download_chapter`、`auto_download_day`、`old_player_day`、`old_player_chapter`、`second_chapter`）、`Award` 1 行（`101500×200`、`201500×10000`、`101800×500`）。
- `ResCompleteMgr.lua`：`IsDownloadFinish`/`IsSubPackage`/`GetPassedSection`/`GetRoleLv`/`GetRoleCreateDay` 决定模块能否领奖，`hasAward` 记在 `loginData`，`AWARD_HAS_GET` 是重复领取错误。
- 阻塞：判断依据是**客户端资源包下载完成状态**，3 个 `Open` 行只有下载策略、没有奖励列，`Award` 只有 1 行，ETF `param` 的取值来源（`Open.tid` 还是 `Award.tid`）无法从反汇编字符串确定。若按 `Open.tid` 领 3 次会把同一份奖励发三次，按一次领又可能漏掉原服的分档语义。没有服务端可校验的下载完成信号，无法给出权威状态转移。

### ITEM-GROWTHTARGET（69006/69007）

- proto 已确认：`pb_growth_target_phase_award_req { act_tid, phase_tid }`、`pb_growth_target_task_award_req { act_tid, task_tid_list }`，回包 `pb_growth_target_act { act_tid, phase_award_list, task_award_list, finish_task_list }`。
- 活动入口存在：`ActivityTable` func 18 的 `18001/18002/18003`（version 1–3），与 `GrowthTargetTable.Version` 的 3 行对应。
- 阻塞：`GrowthTargetTable` 的 `Task`/`Phase` 行由 LuaJIT 的函数调用动态构造，现有抽取器只能取字面量表，抽出结果为 `Const` 3 行、`Version` 3 行，任务与阶段目标/奖励全部缺失。没有目标值和奖励就无从校验与发放。

### ITEM-TASKAWARD（69101/69102）

- 配置完整：`TaskAwardTable.data` 抽出 `ActiveTaskAwardTask` 263 行（`type`、`target_count`、`growth_value`、`award_list`）、`ActiveTaskAwardProgress` 6 行（`need_count`、`award`、`overdue_award`）、`ActiveTaskAwardVersion` 1 行、`ActiveTaskAwardTag` 4 行；`type` 如 `13802` 为 `progress_type=2` 统计任务，可复用本块的统计进度。
- 阻塞：`ModuleTable` 行 92068（活动_任务奖励）与 `92009 成长之路`、`92010 成长目标` 共用同一个显示名列，`ActFrameTable.ActType` 中也没有任务奖励活动类型，`ActivityTable` 116 个 func 中同样没有对应入口。因此在当前版本缺少可判定的开放条件和登录容器，若按“永久开放”直接实现，等于自造活动生命周期。

### ITEM-OPENSERVERBOX（69301/69302）

- proto：`pb_open_server_box_req { tid, select }`、`pb_open_server_box { join_day, rev_days, rev_progress, version, recharge_flag }`。
- `OpenServerBoxTable` 抽出 `Icon` 4 行、`Const` 1 行（`check_day=30`）；**没有任何奖励表**，进度档位（`rev_progress`）的 tid 与奖励无处可查。
- 阻塞：无奖励配置，且 `select`（选英雄）依赖英雄自选表；按空奖励实现等于空包。

### ITEM-HOOK（78201–78205）

- proto 与配置齐备：`pb_hook_gather_or_preview_req { type_list }`、`pb_hook_fast_gather_req { type, count }`、`pb_hook_item_fast_req { item_id, times }`；`HookTable` 抽出 `Type` 12 行（`produce_period`、`max_fixed_period`、`init_award`、`fast_gather_type`、`erl_module`、`data_class`）、`Stage` 5593 行（`belong_hook_type`、`fixed_award`、`random_award`）、`FastItem` 61 行。
- 阻塞：`HookMgr` 的产出与阶段来自各玩法自己的数据对象（`HookPeakTowerData`、`HookGuildCampData`、`MagicJourneyHookData`、`HookSoulTrialData`、`PetPlayOneData`、`GuildNationHookData`、`SummerActHookData`、`HookHomelandData`、`TriMatchTowerHookData` 等），抽出的 `Stage` 行列出的 `belong_hook_type` 与 `Type.tid`（10/17–28）没有直接对应关系，`PeakTowerMgr` 还会推 `EVT_HOOK_STAGE_CHANGE`。没有“当前阶段”的权威来源，无法计算 `fixed_award` 的产出周期与阶段切换。

### ITEM-TASKGROUP（84901/84902）

- proto：`pb_task_group_task_award_req { tid_list }`、`pb_task_group_group_award_req { tid_list }`，回包 `pb_role_task_group { func_id, task_groups, got_award, func_open }`。
- 配置：`TaskTable.Group` 6 行、`GroupTask` 20 行已抽出（`type=1202` 的章节任务可用现有进度函数）。
- 阻塞：`TaskGroupMgr` 用 `TaskTable.GroupFunc` 按 `funcID` 取任务组（`GroupCount`/`GroupByIndex`/`GroupByFunc`），而 `GroupFunc` 在本版本抽出 **0 行**；回包里的 `func_id`、`func_open` 也就无从确定。组与功能绑定缺失，等于功能未配置。

### ITEM-CAREERLIFE（85804）

- proto：`pb_career_life { boss_bin, refresh_time, story_bin, fight_boss, fight_count, pass_award }`；命令是 ETF 单参数。
- 配置：`CareerLifeTable.StoryChapter` 18 行，但 `res`/`res_count` 大多为 0。
- 阻塞：剧情奖励列没有实际配置，且 `story_bin` 的领取位下标依赖章节推进（`fight_boss`/`fight_count`）的真实来源，本块没有生涯战斗。

### ITEM-RESROLLBACK（88401/88402）

- proto：`pb_res_rollback_req { rollback_type, rollback_res_id }`、回包 `pb_res_rollback_preview_ret { res_list }` / `pb_res_rollback_ret { res, to_client }`。
- 配置：`ResRollbackTable.Const`（`can_rollback_min_star=6`、`rollback_to_star=5`）、`Type` 8 行（`cost_item`、`cost_item_num`、`update_attr_play`、`bi_log`）。
- 阻塞：退回的资源量是服务端按养成历史计算的（`update_attr_play` 只是开关），本服没有“投入账本”（升级/升星消耗记录），也没有 `to_client` 的原始数据结构。当前无法给出真实预览值；用固定比例推算会与客户端预览不符。

### ITEM-MYSTERYSHOP（91501–91503）

- proto 与配置齐备：`pb_mystery_shop { next_auto_refresh_time, last_manual_refresh_time, manual_refresh_count, discount_items[{cell_id, discount_item_tid, discount_price_index, is_bought}], all_times_data, customize_auto_refresh_times, buy_times }`；`MysteryShopTable` 抽出 `Cell` 14、`CellType` 5、`Const` 1（`max_manual_refresh=5`、`buy_count_total=9`、`high_discount_up=75`、`bubble_cd_time=600`）、`ManualRefresh` 5、`DiscountLib` 35、`DiscountLibType` 5。
- 阻塞：`MysteryShopMgr` 从 `ShopMgr:GetItemList(TID_SHOP_DAILY/TID_SHOP_WEEK)` 取商品，再用 `DiscountLib.discount` 与商品 `priceList[discount_price_index]` 算价；`MysteryShopTable` 本身不含商品池，`ShopTable.data.lua` 无法用现有抽取器解析（`readGeneratedTables` 取不到任何子表，LuaJIT 行同样是动态构造），因此 `TID_SHOP_DAILY/TID_SHOP_WEEK` 的具体 shop id、价格档位与 `is_rare_goods`/`high_discount_up` 的加价语义都无法落地。手动刷新与购买都会直接改资源，宁可拒绝也不能按猜测定价。

### ITEM-LINEARLEVEL（93501）

- proto：`pb_linear_level_box_award_req { type, indexes }`、回包 `pb_linear_level { type, level, box_award }`。
- 配置：`LinearLevelTable.Box` 80 行（`tid` 如 `100010`、`type`、`pass_fight`、`award`）、`Type` 4 行。
- 阻塞：宝箱解锁依赖 `pb_linear_level.level`（线性关卡战斗 `linear_level_fight` 推进），本块没有该战斗链路，登录容器 `665704` 由 `GuildMgr` 注册、与线性关卡数据共用，无法自行制造 `level`。

### ITEM-PERIODTASK（101301–101303）

- proto：`pb_period_task_back { period_task: { version, task_list, stage_award_state, score_award_state }, res }`。
- 配置：`PeriodTaskTable` 抽出 `Task` 0 行、`Version` 0 行、`Score` 0 行、`Stage` 0 行，只有 `RefreshType` 3 行（日刷新/周期刷新/永久）。
- 阻塞：本版本没有任何周期任务、积分档或阶段档配置，功能不可达；实现等于凭空造奖励。

### ITEM-TASKACTIVITY 105702

- 见 [ITEM-TASKACTIVITY](../ITEM-TASKACTIVITY/implementation.md)：`server_vitality` 需要全服活跃度来源，本服无生产方。

## 交叉发现（不在本块修复范围）

- `ModuleTable.show_name` 是**显示名文本 id**，不是登录容器号：`tid=92 活动` 与 `tid=92114 活动_通用任务活动` 的 `show_name` 都是 `6024`，`92009/92010/92068` 也都是 `53696`。按本块核对，登录容器应取 `ModuleTable.tid`（如功能手册 `106`、任务组 `129`、神秘商店 `162`、线性关卡 `535`、周期任务 `545`，活动类为 `92009`/`92010`/`92068`/`92039`/`92114`）。已合入的 ITEM-GROWTHROAD 使用 `53696` 作为登录模块号，与本次结论不一致，需要后续块用真实 APK 登录包确认后再决定是否修正。
- `TaskTable.GroupFunc`、`TaskAwardTable` 之外的多张 LuaJIT 表行由函数调用构造，`tools/extract-lua-table-rows.mjs` 只能取字面量表；后续需要扩展为可执行 `CALL` 的构造器解释器，才能拿到 `GrowthTargetTable.Task/Phase`、`ShopTable.*` 等表。

## 验证

```powershell
cd personal-server
node --test --test-concurrency=1 test/*.test.mjs
```

全量结果：分支基线 `analysis/test-runs/gameplay-20261106/block-d-full.log`（2604 项、pass 2602）；同步 main（含块 F/H/G2）后 `analysis/test-runs/gameplay-20261106/block-d-merged3-full.log`（2646 项、pass 2644、fail 0、skipped 2）。本块新增 `test/function-manual-service.test.mjs`（6 项）、`test/task-activity-service.test.mjs`（7 项）、`test/item-task-gateway.test.mjs`（1 项真实握手 + 登录 + 两条命令）。

合并：`8ac7a73` 以 `--no-ff` 合入 main `78b1a46`；合并后 main 的 tree 与全量测试所在提交的 tree 相同（`dbe81e8`）。

未执行：实时服务启停、模拟器/ADB、运行数据库读写、APK 改动或 UI 验收。
