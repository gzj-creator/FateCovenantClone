# 物品、普通商店、日周任务与主线外围

本分区 22 个模块任务，58 条未路由/明确拒绝/占位命令。优先级：P1。

共同依赖：CORE-EVENTS；限购与重置共用开服日/服务器日，奖励共用事务资源处理器。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## ITEM-ITEM：重复箱、手动兑换、碎片合成与抽奖箱分支

协议模块：`ItemCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 5。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“重复箱、手动兑换、碎片合成与抽奖箱分支”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[item-box-service.mjs](../../../personal-server/game/item-box-service.mjs)。

已确认的附加缺口：

- 151/152/155/159 的已实现指定、随机、自选、套装箱需要保留；重复箱、付费箱业务及 157.lottery_list 尚缺。
- 随机箱已有保底持久化；尚需核对客户端保底登录/展示数据，不能把现有保底重做为固定抽取。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 153 | `use_repeat_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 154 | `manual_convert_item` | 未路由 | etf / `—` | `pb_res_to_client` |
| 156 | `req_chip_compose` | 未路由 | protobuf / `simple_use` | `pb_res_to_client` |
| 158 | `req_one_key_chip_compose` | 未路由 | protobuf / `pb_one_key_compose` | `pb_res_to_client` |

已有处理路径（必须回归）：`151 use_box`、`152 use_selected_box`、`155 use_selected_suit_box`、`157 batch_use_box`、`159 req_one_key_use_item`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-RESCOMPLETE：资源补全领奖

协议模块：`ResCompleteCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“资源补全领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 288 | `req_res_complete_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-MISSION：主线体力、补给、章节一键与 BOSS 奖励

协议模块：`MissionCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 3。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“主线体力、补给、章节一键与 BOSS 奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[mission-fight-service.mjs](../../../personal-server/game/mission-fight-service.mjs)、[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 已有 503 扫荡、506 章节箱与 508 剧情推进；随机扫荡奖励 rand_award 非零明确拒绝。其余外围命令见下表。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 504 | `mission_meal` | 未路由 | etf / `—` | `pb_mission_meal_rsp` |
| 505 | `mission_energy_exchange` | 未路由 | etf / `—` | `pb_res_to_client` |
| 509 | `req_one_key_chapter` | 未路由 | protobuf / `pb_mission_one_key_reward_req` | `pb_mission_one_key_reward_rsp` |
| 510 | `energy_energy_buy` | 未路由 | etf / `—` | `pb_energy_manual_buy_rsp` |
| 511 | `req_mission_chapter_pass` | 未路由 | etf / `—` | `—` |
| 512 | `req_mission_boss_pass_award` | 未路由 | etf / `—` | `pb_res_to_client` |

已有处理路径（必须回归）：`503 mission_sweep_passed`、`506 req_inner_box_award`、`508 req_mission_custom`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-SHOP：普通商店、快速购买、刷新、结算与历史商品

协议模块：`ShopCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 2。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“普通商店、快速购买、刷新、结算与历史商品”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 1201 购买仅支持魔灵活动专属店；1202 对其余店返回空结构。普通商店的货架、库存、价格分档、刷新、限购、历史与结算没有完整业务。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 1203 | `fast_buy_item` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1204 | `req_shop_settle` | 未路由 | etf / `—` | `pb_shop_settle_back` |
| 1205 | `req_shop_wipe_butt` | 未路由 | etf / `—` | `pb_shop_info` |
| 1206 | `req_shop_buy_history_item` | 未路由 | protobuf / `pb_req_buy_history_item` | `pb_rev_buy_history_item` |
| 1207 | `req_shop_easy_buy_item` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1208 | `req_refresh_shop` | 未路由 | etf / `—` | `pb_manual_refresh_shop_back` |

已有处理路径（必须回归）：`1201 req_buy_shop_item`、`1202 req_shops_info`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-GUIDE：引导领奖与网络检查

协议模块：`GuideCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“引导领奖与网络检查”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 8001 | `req_guide_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 8002 | `req_check_guide_net` | 未路由 | etf / `—` | `—` |

已有处理路径（必须回归）：`8000 req_save_guide_process`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-EVERYTASK：每日、每周、主线任务及一键领奖

协议模块：`EveryTaskCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“每日、每周、主线任务及一键领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 9000 | `req_finish_daily_task` | 未路由 | etf / `—` | `daily_receive_back` |
| 9002 | `req_finish_main_task` | 未路由 | etf / `—` | `main_receive_back` |
| 9003 | `req_get_daily_active_reward` | 未路由 | etf / `—` | `daily_receive_back` |
| 9006 | `req_finish_all_daily_task` | 未路由 | etf / `—` | `daily_receive_back` |
| 9007 | `req_finish_all_main_task` | 未路由 | etf / `—` | `main_receive_back` |
| 9008 | `req_finish_weekly_task` | 未路由 | etf / `—` | `weekly_receive_back` |
| 9009 | `req_finish_all_weekly_task` | 未路由 | etf / `—` | `weekly_receive_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-COMMONTASK：通用任务与线性任务剩余进度函数

协议模块：`CommonTaskCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用任务与线性任务剩余进度函数”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[task-service.mjs](../../../personal-server/game/task-service.mjs)。

已确认的附加缺口：

- 9010 已支持主线游标、累计统计及命运实阶；其他进度函数仍明确拒绝。新增玩法必须产生服务端统计事件，不能信任客户端报完成。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 9005 | `req_finish_common_task` | 未路由 | etf / `—` | `common_receive_back` |

已有处理路径（必须回归）：`9010 req_finish_linear_task`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-RANKACHIEVE：排名成就奖励

协议模块：`RankAchieveCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“排名成就奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 43101 | `req_rank_achieve_award` | 未路由 | protobuf / `pb_rank_achieve_award_req` | `pb_rank_achieve_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-FIRSTWEEKGOAL：首周目标与任务奖励

协议模块：`FirstWeekGoalCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“首周目标与任务奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 67004 | `req_first_week_goal_progress_award` | 未路由 | etf / `—` | `pb_first_week_goal_back` |
| 67005 | `req_first_week_goal_task_award` | 未路由 | etf / `—` | `pb_first_week_goal_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-GROWTHROAD：成长之路

协议模块：`GrowthRoadCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“成长之路”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 69001 | `req_growth_road_progress_award` | 未路由 | etf / `—` | `pb_growth_road_back` |
| 69002 | `req_growth_road_task_award` | 未路由 | etf / `—` | `pb_growth_road_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-GROWTHTARGET：成长目标阶段与任务

协议模块：`GrowthTargetCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“成长目标阶段与任务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 69006 | `req_growth_target_phase_award` | 未路由 | protobuf / `pb_growth_target_phase_award_req` | `pb_growth_target_phase_award_rsp` |
| 69007 | `req_growth_target_task_award` | 未路由 | protobuf / `pb_growth_target_task_award_req` | `pb_growth_target_task_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-TASKAWARD：任务活动进度与任务奖

协议模块：`TaskAwardCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“任务活动进度与任务奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 69101 | `req_task_award_progress_award` | 未路由 | etf / `—` | `pb_task_award_back` |
| 69102 | `req_task_award_task_award` | 未路由 | etf / `—` | `pb_task_award_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-OPENSERVERBOX：开服宝箱与进度

协议模块：`OpenServerBoxCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“开服宝箱与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 69301 | `req_open_server_box_award` | 未路由 | etf / `—` | `pb_open_server_box_back` |
| 69302 | `req_open_server_box_progress` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-HOOK：挂机收益、快速收取与产物

协议模块：`HookCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“挂机收益、快速收取与产物”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 78201 | `req_hook_gather` | 未路由 | protobuf / `pb_hook_gather_or_preview_req` | `pb_hook_gather_rsp` |
| 78202 | `req_hook_preview` | 未路由 | protobuf / `pb_hook_gather_or_preview_req` | `pb_hook_preview_rsp` |
| 78203 | `req_hook_fast_gather` | 未路由 | protobuf / `pb_hook_fast_gather_req` | `pb_hook_fast_rsp` |
| 78204 | `req_hook_fast_produce_item` | 未路由 | protobuf / `pb_hook_item_fast_req` | `pb_hook_item_fast_rsp` |
| 78205 | `req_hook_produce_item` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-FUNCTIONMANUAL：功能手册奖励

协议模块：`FunctionManualCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“功能手册奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 82301 | `req_function_manual_award` | 未路由 | etf / `—` | `pb_function_manual_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-TASKGROUP：任务组任务与阶段领奖

协议模块：`TaskGroupCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“任务组任务与阶段领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84901 | `req_task_group_task_award` | 未路由 | protobuf / `pb_task_group_task_award_req` | `pb_task_group_task_award_rsp` |
| 84902 | `req_task_group_group_award` | 未路由 | protobuf / `pb_task_group_group_award_req` | `pb_task_group_group_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-CAREERLIFE：生涯剧情奖励

协议模块：`CareerLifeCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“生涯剧情奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 85804 | `req_career_life_story_award` | 未路由 | etf / `—` | `pb_career_life_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-RESROLLBACK：资源回退预览与执行

协议模块：`ResRollbackCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“资源回退预览与执行”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88401 | `req_res_rollback_preview` | 未路由 | protobuf / `pb_res_rollback_req` | `pb_res_rollback_preview_ret` |
| 88402 | `req_res_rollback` | 未路由 | protobuf / `pb_res_rollback_req` | `pb_res_rollback_ret` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-MYSTERYSHOP：神秘商店自动刷新、手动刷新与购买

协议模块：`MysteryShopCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“神秘商店自动刷新、手动刷新与购买”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91501 | `req_mystery_shop_auto_refresh` | 未路由 | etf / `—` | `pb_mystery_shop` |
| 91502 | `req_mystery_shop_manual_refresh` | 未路由 | etf / `—` | `pb_mystery_shop_manual_refresh_back` |
| 91503 | `req_mystery_shop_buy` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-LINEARLEVEL：线性等级宝箱

协议模块：`LinearLevelCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“线性等级宝箱”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93501 | `req_linear_level_box_award` | 未路由 | protobuf / `pb_linear_level_box_award_req` | `pb_linear_level_box_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-PERIODTASK：周期任务、阶段与积分奖励

协议模块：`PeriodTaskCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“周期任务、阶段与积分奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101301 | `req_period_task_award` | 未路由 | etf / `—` | `pb_period_task_back` |
| 101302 | `req_period_stage_award` | 未路由 | etf / `—` | `pb_period_task_back` |
| 101303 | `req_period_score_award` | 未路由 | etf / `—` | `pb_period_task_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ITEM-TASKACTIVITY：任务活动提交与数据

协议模块：`TaskActivityCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“任务活动提交与数据”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105701 | `req_task_activity_finish` | 未路由 | protobuf / `pb_task_activity_finish_req` | `pb_task_activity_finish_rsp` |
| 105702 | `req_task_activity_data` | 未路由 | etf / `—` | `pb_task_activity_data_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
