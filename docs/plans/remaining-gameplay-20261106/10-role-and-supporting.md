# 团长、外观、剧情及辅助接口

本分区 12 个模块任务，47 条未路由/明确拒绝/占位命令。优先级：P1/P3。

共同依赖：CORE-ATTR；有资源的领奖操作依赖 ITEM；纯埋点/GM/开发登录单列为辅助项，不算独立玩法。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## ROLE-UNKNOWN：GM 调试命令

协议模块：`Unknown`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“GM 调试命令”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 10 | `gm_cmd` | 未路由 | unknown / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-ROLE：团长改名、头像、称号、形象、等级奖、属性与战力

协议模块：`RoleCmd`。未路由 23；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“团长改名、头像、称号、形象、等级奖、属性与战力”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104 | `record_sundry` | 未路由 | etf / `—` | `pb_role_sundry_item` |
| 105 | `record_pass_all_mission` | 未路由 | etf / `—` | `—` |
| 106 | `request_role_list` | 未路由 | etf / `—` | `pb_account_roles` |
| 110 | `req_role_set_recommend_lv` | 未路由 | etf / `—` | `—` |
| 111 | `req_role_check_veteran` | 未路由 | etf / `—` | `—` |
| 112 | `req_role_veteran_skip` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1301 | `req_set_role_name` | 未路由 | etf / `—` | `res_set_role_name` |
| 1302 | `req_random_role_name` | 未路由 | etf / `—` | `—` |
| 1303 | `req_get_level_reward` | 未路由 | etf / `—` | `res_get_level_reward` |
| 1304 | `req_set_role_figure` | 未路由 | etf / `—` | `pb_figure_simple_info` |
| 1305 | `req_active_role_title` | 未路由 | etf / `—` | `pb_active_title_req_back` |
| 1306 | `req_role_title_attr` | 未路由 | etf / `—` | `—` |
| 1307 | `req_check_same_name` | 未路由 | etf / `—` | `—` |
| 1308 | `req_refresh_figure_red` | 未路由 | etf / `—` | `pb_figure_have_info` |
| 1309 | `req_set_figure_sex` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1310 | `req_set_figure_style` | 未路由 | etf / `—` | `—` |
| 1311 | `req_set_role_name_sex` | 未路由 | etf / `—` | `res_set_role_name_sex` |
| 1312 | `req_up_rank` | 未路由 | etf / `—` | `pb_role_figure_up_back` |
| 1313 | `req_role_figure_rank_award` | 未路由 | etf / `—` | `pb_role_figure_rank_award_back` |
| 1314 | `req_role_refresh_power` | 未路由 | etf / `—` | `—` |
| 1315 | `req_role_figure_chat_bubble` | 未路由 | etf / `—` | `—` |
| 1316 | `req_role_attr_info` | 未路由 | etf / `—` | `pb_attr_lineup_all_info` |
| 1317 | `req_rev_watch_video_award` | 未路由 | etf / `—` | `pb_res_to_client` |

已有处理路径（必须回归）：`108 req_remove_operate_display`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-LOGIN：网络检查与开发登录辅助

协议模块：`LoginCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“网络检查与开发登录辅助”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 109 | `req_ensure_net_ok` | 未路由 | etf / `—` | `—` |
| 909101 | `login_dev_account` | 未路由 | protobuf / `login_dev` | `—` |
| 909102 | `login_dev_roleid` | 未路由 | protobuf / `login_dev` | `—` |

已有处理路径（必须回归）：`909103 login_sdk`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-PLAYERDATA：玩家数据查询

协议模块：`PlayerDataCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“玩家数据查询”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 161 | `req_player_data` | 未路由 | protobuf / `pb_function_cache_req` | `pb_function_cache_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-STORY：剧情完成与触发

协议模块：`StoryCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“剧情完成与触发”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 304 | `finish_story` | 未路由 | etf / `—` | `—` |
| 305 | `touch_story` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-REDDOT：红点持久化

协议模块：`RedDotCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“红点持久化”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 39001 | `req_save_changed_red_dot` | 未路由 | protobuf / `red_change_info` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-CDKEY：兑换码领奖

协议模块：`CdkeyCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“兑换码领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 40000 | `req_claim_prize` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-ACTIVITY：真实活动状态推进

协议模块：`ActivityCmd`。未路由 0；明确拒绝 0；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“真实活动状态推进”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 日历已有 schedule/all-open 和时间窗口校验；53001 只有空应答。补真实阶段状态、定时推进、切期和补偿，保留 all-open 作为显式测试策略。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 53001 | `req_activity_state_change` | 空结构/固定值/仅应答：活动状态只应答，没有推进 | etf / `—` | `pb_act_state_change_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-ACTFRAME：活动列表数据及 GM 开期/跳阶段/清理辅助

协议模块：`ActFrameCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“活动列表数据及 GM 开期/跳阶段/清理辅助”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 53002 只有空应答；53006 活动列表无路由。53003/53004/53005 属于 GM 辅助，应与玩家活动业务分开排期。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 53002 | `req_act_stage_change` | 空结构/固定值/仅应答：活动阶段只应答，没有推进 | etf / `—` | `pb_act_role_stage_change_back` |
| 53003 | `req_act_gm_open_act` | 未路由 | etf / `—` | `—` |
| 53004 | `req_act_gm_jump_stage` | 未路由 | etf / `—` | `—` |
| 53005 | `req_act_gm_clear_act_data` | 未路由 | etf / `—` | `—` |
| 53006 | `req_act_get_act_list_data` | 未路由 | etf / `—` | `pb_act_frame_stage_push` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-SKIN：皮肤穿戴、兑换、图鉴与强化

协议模块：`SkinCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“皮肤穿戴、兑换、图鉴与强化”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 76003 | `skin_wear` | 未路由 | protobuf / `pb_skin_wear_req` | `pb_skin_wear_back` |
| 76004 | `req_choose_exchange_skin` | 未路由 | etf / `—` | `—` |
| 76005 | `req_exchange_skin` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76006 | `toggle_ignore_fantasy_skin` | 未路由 | protobuf / `pb_toggle_ignore_fantasy_skin_req` | `—` |
| 76007 | `skin_activation_handbook` | 未路由 | etf / `—` | `pb_skin_handbook` |
| 76008 | `skin_handbook_info` | 未路由 | etf / `—` | `pb_skin_handbook` |
| 76009 | `skin_increase` | 未路由 | etf / `—` | `pb_skin_increase_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-CLIENTLOG：客户端诊断日志

协议模块：`ClientLogCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“客户端诊断日志”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 78901 | `req_save_to_server_info_log` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## ROLE-CHANNELPUSH：渠道推送开关

协议模块：`ChannelPushCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“渠道推送开关”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98201 | `rep_set_channel_push_open` | 未路由 | protobuf / `pb_channel_push_open` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
