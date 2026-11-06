# 节日、签到、限时目标与协作活动

本分区 32 个模块任务，94 条未路由/明确拒绝/占位命令。优先级：P2。

共同依赖：CORE-EVENTS、ITEM-EVERYTASK/ITEM-COMMONTASK；全服进度不得用固定数值代替。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## ACT-SIGNACT：活动签到

协议模块：`SignActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“活动签到”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 37009 | `req_sign_act_award` | 未路由 | protobuf / `pb_sign_act_req` | `pb_sign_act_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-OPENSERVERSPRINT：开服冲刺任务、全服进度与排名奖励

协议模块：`OpenServerSprintCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“开服冲刺任务、全服进度与排名奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[sprint-service.mjs](../../../personal-server/game/sprint-service.mjs)。

已确认的附加缺口：

- 79104 冲榜任务领奖已有实现；最终榜单结算/邮件奖、79101–79103 和未覆盖进度函数仍缺。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 79101 | `req_sprint_receive_task` | 未路由 | etf / `—` | `pb_sprint_receive_task_back` |
| 79102 | `req_sprint_task_finish_player` | 未路由 | etf / `—` | `pb_sprint_task_finish` |
| 79103 | `req_sprint_server_process_award` | 未路由 | protobuf / `pb_sprint_server_process_req` | `pb_sprint_server_process_rsp` |

已有处理路径（必须回归）：`79104 req_sprint_receive_rank_task`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-LOGINREWARDACT：登录奖励活动

协议模块：`LoginRewardActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“登录奖励活动”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90301 | `req_login_reward_act_award` | 未路由 | etf / `—` | `pb_login_reward_act_rev_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-CHRISTMASACT：圣诞装扮、奖励、心愿与商店

协议模块：`ChristmasActCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“圣诞装扮、奖励、心愿与商店”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98610 | `req_christmas_act_dress` | 未路由 | protobuf / `pb_christmas_act_dress_req` | `pb_res_to_client` |
| 98611 | `req_christmas_act_get_dress_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98612 | `req_christmas_act_select_wish` | 未路由 | etf / `—` | `—` |
| 98613 | `req_christmas_shop_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-STOCKUPACT：囤货阶段与周期奖

协议模块：`StockUpActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“囤货阶段与周期奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99401 | `req_stock_up_act_phase_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99402 | `req_stock_up_act_cycle_award` | 未路由 | etf / `—` | `pb_stock_up_act_cycle_award_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-COMACTDRAWAWARD：通用活动领奖

协议模块：`ComActDrawAwardCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用活动领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99600 | `req_common_act_draw_award` | 未路由 | protobuf / `pb_act_exit_req` | `pb_act_draw_award_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-SPRINGFESTIVALACT：春节装扮与商店奖

协议模块：`SpringFestivalActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“春节装扮与商店奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99601 | `req_spring_festival_dress` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99602 | `req_spring_festival_get_dress_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99603 | `req_spring_festival_shop_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-FESTIVALSIGNACT：节日签到

协议模块：`FestivalSignActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“节日签到”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99801 | `req_festival_sign_award` | 未路由 | protobuf / `pb_festival_sign_award_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-COLLECTEXCHANGEACT：收集兑换

协议模块：`CollectExchangeActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“收集兑换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100001 | `req_collect_exchange_award` | 未路由 | protobuf / `pb_collect_exchange_award_req` | `pb_collect_exchange_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-FESTIVALMONSTERACT：节日怪物操作

协议模块：`FestivalMonsterActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“节日怪物操作”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100101 | `req_festival_monster_op` | 未路由 | etf / `—` | `pb_festival_monster_op_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-VALENTINEDAYACT：情人节领奖与聊天进度

协议模块：`ValentineDayActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“情人节领奖与聊天进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100501 | `req_valentine_rev_award` | 未路由 | protobuf / `pb_valentine_day_rev_award_req` | `pb_valentine_day_rev_award_rsp` |
| 100502 | `req_valentine_save_chat_progress` | 未路由 | protobuf / `pb_valentine_day_save_chat_progress_req` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-PREHEATACT：预热活动与奖励

协议模块：`PreheatActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“预热活动与奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101001 | `req_preheat` | 未路由 | protobuf / `pb_preheat_req` | `pb_res_to_client` |
| 101002 | `req_preheat_award` | 未路由 | protobuf / `pb_preheat_award_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-COMMONSIGN：通用签到领奖

协议模块：`CommonSignCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用签到领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101501 | `req_common_sign_award` | 未路由 | protobuf / `pb_common_sign_award_req` | `pb_common_sign_award_rev` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-VOTEACT：盲投、普通投票、竞猜与全服进度

协议模块：`VoteActCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“盲投、普通投票、竞猜与全服进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102901 | `req_vote_act_blind_vote` | 未路由 | protobuf / `pb_vote_act_vote_req` | `pb_vote_act_back` |
| 102902 | `req_vote_act_common_vote` | 未路由 | protobuf / `pb_vote_act_vote_req` | `pb_vote_act_back` |
| 102903 | `req_vote_act_progress_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 102904 | `req_vote_act_task_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 102905 | `req_vote_act_task_guess` | 未路由 | etf / `—` | `—` |
| 102906 | `req_vote_act_server_vote` | 未路由 | etf / `—` | `pb_vote_act_server` |
| 102907 | `req_vote_prize_list_req` | 未路由 | etf / `—` | `pb_vote_prize_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-QUESTIONACT：答题与累计奖励

协议模块：`QuestionActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“答题与累计奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103001 | `req_question_act_answer` | 未路由 | protobuf / `pb_question_answer_req` | `pb_question_day` |
| 103002 | `req_question_act_reward` | 未路由 | protobuf / `pb_question_reward_req` | `pb_question_reward_back` |
| 103003 | `req_question_act_reward_pile` | 未路由 | protobuf / `pb_question_reward_pile_req` | `pb_question_reward_pile_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-SUMMERACT：夏日主活动、水枪/水炮养成、阶段任务与结算

协议模块：`SummerActCmd`。未路由 15；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“夏日主活动、水枪/水炮养成、阶段任务与结算”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103701 | `req_summer_preview_reward` | 未路由 | protobuf / `pb_summer_preview_req` | `pb_res_to_client` |
| 103702 | `req_summer_wg_up_lv` | 未路由 | protobuf / `pb_summer_wg_up_lv_req` | `pb_summer_wg_universal_back` |
| 103703 | `pb_summer_wg_up_stage` | 未路由 | etf / `—` | `pb_summer_wg_universal_back` |
| 103704 | `pb_summer_wb_active` | 未路由 | protobuf / `pb_summer_wb_universal_req` | `pb_summer_wg_universal_back` |
| 103705 | `pb_summer_wb_up_strong` | 未路由 | protobuf / `pb_summer_wb_up_strong_req` | `pb_summer_wg_universal_back` |
| 103706 | `pb_summer_wb_up_quality` | 未路由 | protobuf / `pb_summer_wb_universal_req` | `pb_summer_wg_universal_back` |
| 103707 | `pb_summer_phase_task_award` | 未路由 | etf / `—` | `pb_summer_task_back` |
| 103708 | `pb_summer_phase_progress_award` | 未路由 | etf / `—` | `pb_summer_task_back` |
| 103709 | `req_summer_change_water_skin` | 未路由 | protobuf / `pb_summer_water_skin_change_req` | `pb_summer_water_gun_person` |
| 103710 | `req_summer_power` | 未路由 | protobuf / `pb_summer_power_req` | `—` |
| 103711 | `req_summer_enter` | 未路由 | etf / `—` | `—` |
| 103712 | `req_summer_standard_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 103813 | `req_summer_standard_award_show` | 未路由 | etf / `—` | `pb_summer_show_show_standard` |
| 103814 | `req_summer_settle_rewards_preview` | 未路由 | protobuf / `pb_summer_settle_rewards_preview_req` | `pb_summer_settle_rewards_preview_rsp` |
| 103815 | `req_summer_settle_rewards` | 未路由 | protobuf / `pb_summer_settle_rewards_req` | `pb_summer_settle_rewards_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-SUMMERPVE：夏日 PVE 任务、次数、阶段与掉落

协议模块：`SummerPveCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“夏日 PVE 任务、次数、阶段与掉落”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103801 | `req_summer_act_task_award` | 未路由 | protobuf / `pb_summer_act_task_award_req` | `pb_summer_act_pve_update` |
| 103802 | `req_summer_act_pve_buy_times` | 未路由 | protobuf / `pb_summer_act_pve_buy_times_req` | `pb_summer_act_pve_update` |
| 103803 | `req_summer_act_pve_phase_award` | 未路由 | etf / `—` | `pb_summer_act_pve_update` |
| 103804 | `req_summer_act_pve_set_award_drop` | 未路由 | protobuf / `pb_summer_act_pve_set_award_drop` | `pb_summer_act_pve_update` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-SUMMERMISSION：夏日关卡战斗结算与进度

协议模块：`SummerMissionCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“夏日关卡战斗结算与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103901 | `req_summer_mission_fight_settle` | 未路由 | protobuf / `pb_summer_act_mission_fight_req` | `pb_summer_act_mission_fight_back` |
| 103902 | `req_summer_mission_progress_award` | 未路由 | etf / `—` | `pb_summer_act_mission_progress_award_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-SUMMERPVP：夏日 PVP、多队、竞猜、对手与挑战次数

协议模块：`SummerPvpCmd`。未路由 13；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“夏日 PVP、多队、竞猜、对手与挑战次数”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104101 | `req_summer_act_pvp_init_swap` | 未路由 | etf / `—` | `pb_summer_act_pvp_rank_update` |
| 104102 | `req_summer_act_pvp_day_task` | 未路由 | protobuf / `pb_summer_act_pvp_award` | `pb_summer_act_pvp_update` |
| 104103 | `req_summer_act_pvp_phase_task` | 未路由 | protobuf / `pb_summer_act_pvp_award` | `pb_summer_act_pvp_update` |
| 104104 | `req_summer_act_pvp_guess` | 未路由 | protobuf / `pb_summer_act_pvp_guess_req` | `pb_summer_act_pvp_role` |
| 104105 | `req_summer_buy_challenge_times` | 未路由 | etf / `—` | `pb_res_to_client` |
| 104106 | `req_summer_buy_challenge_match_times` | 未路由 | etf / `—` | `pb_res_to_client` |
| 104107 | `req_summer_buy_match_enemy` | 未路由 | etf / `—` | `pb_summer_challenge_person` |
| 104108 | `req_summer_act_pvp_swap_rematch` | 未路由 | etf / `—` | `pb_summer_act_pvp_role` |
| 104109 | `req_summer_act_pvp_swap_buy_match` | 未路由 | protobuf / `pb_summer_act_pvp_swap_buy` | `pb_summer_act_pvp_update` |
| 104110 | `req_summer_act_pvp_swap_buy_fight` | 未路由 | protobuf / `pb_summer_act_pvp_swap_buy` | `pb_summer_act_pvp_update` |
| 104111 | `req_summer_act_pvp_swap_init_lineup` | 未路由 | protobuf / `pb_summer_act_pvp_swap_init_lineup` | `pb_lineup` |
| 104112 | `req_summer_act_pvp_top_history` | 未路由 | etf / `—` | `pb_summer_act_pvp_head_history` |
| 104113 | `req_summer_buy_special_match_enemy` | 未路由 | etf / `—` | `pb_summer_challenge_person` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-QIXIACT：七夕折扣选择与日签

协议模块：`QiXiActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“七夕折扣选择与日签”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104401 | `req_qi_xi_discount_select` | 未路由 | protobuf / `pb_qi_xi_recharge_select_req` | `pb_qi_xi_recharge_select_info` |
| 104402 | `req_qi_xi_daily_sign` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-ANNIVERSARYGAMEACT：周年小游戏领奖

协议模块：`AnniversaryGameActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“周年小游戏领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104403 | `req_anniversary_game_act_award` | 未路由 | protobuf / `pb_anniversary_game_act_award_req` | `pb_anniversary_game_act_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-FIVEDAYBOSSACT：五日 BOSS 任务、限时通关与排名

协议模块：`FiveDayBossActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“五日 BOSS 任务、限时通关与排名”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104601 | `req_five_day_boss_act_task_award` | 未路由 | protobuf / `pb_five_day_boss_act_award_req` | `pb_five_day_boss_act_res_update` |
| 104602 | `req_five_day_boss_act_time_pass_award` | 未路由 | protobuf / `pb_five_day_boss_act_award_req` | `pb_five_day_boss_act_res_update` |
| 104603 | `req_five_day_boss_act_get_rank` | 未路由 | etf / `—` | `pb_five_day_boss_act_server_data` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-ONESREWARD：单次专项奖励

协议模块：`OnesRewardCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“单次专项奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105101 | `req_get_ones_reward` | 未路由 | etf / `—` | `pb_get_ones_reward_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-INVITEACT：邀请绑定与任务

协议模块：`InviteActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“邀请绑定与任务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105201 | `req_invite_act_bind` | 未路由 | protobuf / `pb_invite_bind_req` | `pb_invite_bind_rsp` |
| 105202 | `req_invite_act_task` | 未路由 | protobuf / `pb_invite_task_req` | `pb_invite_task_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-INVITEOLDACT：老玩家邀请与任务

协议模块：`InviteOldActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“老玩家邀请与任务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105250 | `req_invite_old_act_invited` | 未路由 | etf / `—` | `pb_invite_old_invited_list_rsp` |
| 105251 | `req_invite_old_act_task` | 未路由 | protobuf / `pb_invite_old_task_req` | `pb_invite_old_task_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-ROLEBACK：回归绑定、继承卡、账号查询与每日资源

协议模块：`RoleBackCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“回归绑定、继承卡、账号查询与每日资源”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105301 | `req_role_back_bind_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 105303 | `req_role_back_inheritance_card` | 未路由 | etf / `—` | `pb_permanent_card_active_back` |
| 105305 | `req_role_back_new_bind` | 未路由 | etf / `—` | `pb_rsp_role_back_info_res` |
| 105307 | `req_role_back_get_roles_info` | 未路由 | etf / `—` | `pb_rsp_role_show_infos` |
| 105308 | `req_role_back_get_day_money` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-CHOICESTORY：分支剧情奖励

协议模块：`ChoiceStoryCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“分支剧情奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105601 | `req_choice_story_award` | 未路由 | protobuf / `pb_choice_story_award_req` | `pb_choice_story_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-FIRECRACKERACT：爆竹使用、公会进度、任务与累充奖

协议模块：`FirecrackerActCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“爆竹使用、公会进度、任务与累充奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 106201 | `req_firecracker_act_guild_info` | 未路由 | protobuf / `pb_firecracker_act_guild_info_req` | `pb_firecracker_act_guild_info_rsp` |
| 106202 | `req_firecracker_act_use` | 未路由 | protobuf / `pb_firecracker_act_use_req` | `pb_firecracker_act_use_rsp` |
| 106203 | `req_firecracker_act_task_award` | 未路由 | protobuf / `pb_firecracker_act_task_award_req` | `pb_firecracker_act_task_award_rsp` |
| 106204 | `req_firecracker_act_acc_award` | 未路由 | protobuf / `pb_firecracker_act_acc_award_req` | `pb_firecracker_act_acc_award_rsp` |
| 106205 | `req_firecracker_act_acc_recharge_award` | 未路由 | protobuf / `pb_firecracker_act_acc_recharge_award_req` | `pb_firecracker_act_acc_recharge_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-HEROSIGNACT：英雄签到

协议模块：`HeroSignActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄签到”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110501 | `req_hero_sign_act_award` | 未路由 | protobuf / `pb_hero_sign_act_req` | `pb_hero_sign_act_rev_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-ENJOYBLESSINGACT：祈福摇签

协议模块：`EnjoyBlessingActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“祈福摇签”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110701 | `req_enjoy_blessing_act_shake` | 未路由 | etf / `—` | `pb_enjoy_blessing_act_shake_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-QUESTIONNAIRE：问卷提交

协议模块：`QuestionnaireCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“问卷提交”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110901 | `req_questionnaire_finish` | 未路由 | protobuf / `pb_questionnaire_finish_req` | `pb_questionnaire_finish_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ACT-ANNIVERSARYBANQUETACT：周年宴会任务与进度

协议模块：`AnniversaryBanquetActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“周年宴会任务与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 118001 | `req_anniversary_banquet_act_task_award` | 未路由 | protobuf / `pb_anniversary_banquet_act_task_award_req` | `pb_anniversary_banquet_act_task_award_rsp` |
| 118002 | `req_anniversary_banquet_act_process_award` | 未路由 | protobuf / `pb_anniversary_banquet_act_process_award_req` | `pb_anniversary_banquet_act_process_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
