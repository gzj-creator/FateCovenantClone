# 好友、聊天、公会与跨服协作

本分区 33 个模块任务，316 条未路由/明确拒绝/占位命令。优先级：P1/P2。

共同依赖：先 SOC-FRIEND、SOC-MSG、SOC-CHAT、SOC-GUILD；公会活动再依赖 CORE-BATTLE、CORE-EVENTS、BATTLE-RANK。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## SOC-GUILDDATA：公会数据查询

协议模块：`GuildDataCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会数据查询”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 171 | `req_guild_data` | 未路由 | protobuf / `pb_function_cache_req` | `pb_function_cache_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-MSG：频道加入、发言、历史、跨服消息与玩家信息

协议模块：`MsgCmd`。未路由 9；明确拒绝 0；空结构/固定值/仅应答 2；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“频道加入、发言、历史、跨服消息与玩家信息”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 10501 | `req_send_msg` | 未路由 | protobuf / `pb_req_send_msg` | `—` |
| 10502 | `req_enter_channel` | 未路由 | etf / `—` | `pb_msg_range_list_with_role_info` |
| 10503 | `req_leave_channel` | 空结构/固定值/仅应答：频道退出只应答 | etf / `—` | `—` |
| 10504 | `req_msg_role_info` | 未路由 | etf / `—` | `pb_msg_role_info` |
| 10505 | `req_msg_role_info_list` | 未路由 | etf / `—` | `pb_msg_role_info_list` |
| 10506 | `req_msg_range` | 未路由 | etf / `—` | `pb_msg_range_list_with_role_info` |
| 10507 | `req_get_channel_id_and_enter` | 空结构/固定值/仅应答：频道范围/成员列表为空 | etf / `—` | `pb_msg_range_list_with_role_info` |
| 10508 | `req_get_login_data` | 未路由 | etf / `—` | `pb_res_msg_login` |
| 10509 | `req_msg_cross_data` | 未路由 | etf / `—` | `pb_res_msg_login` |
| 10510 | `req_log_send_msg` | 未路由 | protobuf / `pb_req_send_msg` | `—` |
| 10511 | `req_tips_look_player` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-CHAT：世界、公会、私聊、跨服聊天与设置

协议模块：`ChatCmd`。未路由 10；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“世界、公会、私聊、跨服聊天与设置”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 11000 | `req_send_chat_msg_to_world` | 未路由 | protobuf / `pb_chat_msg_content` | `—` |
| 11001 | `req_send_chat_msg_to_guild` | 未路由 | protobuf / `pb_chat_msg_content` | `—` |
| 11002 | `req_send_chat_msg_to_role` | 未路由 | protobuf / `pb_req_send_msg_to_role` | `—` |
| 11003 | `req_send_multi_server_msg` | 未路由 | protobuf / `pb_chat_msg_content` | `—` |
| 11006 | `req_cancel_ban` | 未路由 | etf / `—` | `—` |
| 11008 | `req_banned_self` | 未路由 | protobuf / `pb_req_ban_self` | `—` |
| 11010 | `req_change_chat_setting` | 未路由 | etf / `—` | `—` |
| 11012 | `req_remove_private_target` | 未路由 | etf / `—` | `—` |
| 11013 | `req_chat_report` | 未路由 | etf / `—` | `pb_role_chat_report` |
| 11014 | `req_chat_msg_like` | 未路由 | protobuf / `pb_msg_like_req` | `pb_msg_like_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-FRIEND：好友、申请、黑名单、友情赠送与领取

协议模块：`FriendCmd`。未路由 13；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“好友、申请、黑名单、友情赠送与领取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 20001 | `req_apply_friends` | 未路由 | etf / `—` | `res_apply_friends` |
| 20002 | `req_remove_friend` | 未路由 | etf / `—` | `—` |
| 20003 | `req_agree_friend_applies` | 未路由 | etf / `—` | `res_agree_applies` |
| 20004 | `req_refuse_friend_applies` | 未路由 | etf / `—` | `—` |
| 20005 | `req_add_to_blacklist` | 未路由 | etf / `—` | `—` |
| 20006 | `req_remove_from_blacklist` | 未路由 | etf / `—` | `—` |
| 20007 | `req_present_friendship` | 未路由 | etf / `—` | `res_friendship_change` |
| 20008 | `req_receive_friendship` | 未路由 | etf / `—` | `res_friendship_change` |
| 20009 | `req_query_friend` | 未路由 | etf / `—` | `res_query_friend_player` |
| 20010 | `req_recommend_friend_list` | 未路由 | etf / `—` | `res_query_friend_player` |
| 20011 | `req_one_key_present_and_rev` | 未路由 | etf / `—` | `res_friendship_change` |
| 20012 | `req_friend_recommend_types` | 未路由 | etf / `—` | `res_query_friend_player` |
| 20013 | `req_friend_save_report` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILD：公会创建、申请、推荐、捐献、日志与奖励

协议模块：`GuildCmd`。未路由 24；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 4。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会创建、申请、推荐、捐献、日志与奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[guild-roster-service.mjs](../../../personal-server/game/guild-roster-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 21001 | `req_create_guild` | 未路由 | protobuf / `pb_req_create_guild` | `pb_guild_create_back` |
| 21002 | `req_apply_join_guild` | 未路由 | etf / `—` | `—` |
| 21003 | `req_handle_applies` | 未路由 | protobuf / `pb_req_handle_join_apply` | `—` |
| 21004 | `req_recommends` | 未路由 | etf / `—` | `pb_res_recommends` |
| 21008 | `req_change_base_info` | 未路由 | protobuf / `pb_req_guild_base_info` | `—` |
| 21012 | `req_search_guild` | 未路由 | etf / `—` | `pb_res_recommends` |
| 21013 | `req_dissolve_guild` | 未路由 | etf / `—` | `—` |
| 21014 | `req_impeach_president` | 未路由 | etf / `—` | `—` |
| 21015 | `req_send_recruit` | 未路由 | protobuf / `pb_guild_send_recruit_req` | `pb_res_guild_info` |
| 21016 | `req_contribute` | 未路由 | etf / `—` | `pb_res_guild_info` |
| 21017 | `req_receive_act_box` | 未路由 | etf / `—` | `pb_res_guild_info` |
| 21018 | `req_rename_guild_because_force` | 未路由 | etf / `—` | `pb_guild_rename_back` |
| 21019 | `req_guild_log` | 未路由 | etf / `—` | `—` |
| 21020 | `req_guild_level_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 21021 | `req_rename_guild_normal` | 未路由 | protobuf / `pb_guild_rename_req` | `pb_guild_rename_back` |
| 21022 | `req_set_guild_social_stamp` | 未路由 | etf / `—` | `pb_guild_social_role` |
| 21023 | `req_guild_enter_scene` | 未路由 | etf / `—` | `—` |
| 21024 | `req_guild_send_notice_mail` | 未路由 | protobuf / `pb_guild_send_notice_mail_req` | `—` |
| 21025 | `req_guild_set_read_transfer` | 未路由 | etf / `—` | `—` |
| 21026 | `req_guild_box_award` | 未路由 | etf / `—` | `pb_guild_box_rsp` |
| 21028 | `req_guild_set_distribution_ratio` | 未路由 | etf / `—` | `—` |
| 21029 | `req_get_pay_record` | 未路由 | etf / `—` | `pb_req_guild_pay_record` |
| 21030 | `req_guild_pay_award` | 未路由 | etf / `—` | `pb_guild_pay_rsp` |
| 21031 | `req_guild_notice_change_read` | 未路由 | etf / `—` | `—` |

已有处理路径（必须回归）：`21005 req_guild_info`、`21006 req_expel_member`、`21007 req_leave_guild`、`21010 req_change_member_job`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDACTIVE：公会活跃任务、积分与解散状态

协议模块：`GuildActiveCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会活跃任务、积分与解散状态”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 21027 | `req_guild_special_task_award` | 未路由 | etf / `—` | `pb_guild_active_special_rsp` |
| 85501 | `req_guild_active_award` | 未路由 | protobuf / `pb_guild_active_award_req` | `pb_guild_active_award_rsp` |
| 85502 | `req_guild_active_point` | 未路由 | etf / `—` | `pb_guild_active_info` |
| 85503 | `req_guild_active_finish_award` | 未路由 | protobuf / `pb_guild_active_award_req` | `pb_guild_active_award_rsp` |
| 85504 | `req_guild_auto_dissolve_read` | 未路由 | etf / `—` | `pb_guild_auto_dissolve_role` |
| 85505 | `req_guild_pre_auto_dissolve_read` | 未路由 | etf / `—` | `pb_guild_auto_dissolve_role` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-SUPPORT：玩家助力与被助力记录

协议模块：`SupportCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“玩家助力与被助力记录”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 46001 | `req_support_player` | 未路由 | etf / `—` | `support_to_client` |
| 46002 | `req_get_supported` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-REALTIMEMAP：实时地图进出、移动、复活与传送

协议模块：`RealtimeMapCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“实时地图进出、移动、复活与传送”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 75001 | `req_realtime_map_enter` | 未路由 | protobuf / `pb_realtime_enter_map_req` | `pb_realtime_enter_map_back` |
| 75002 | `req_realtime_map_leave` | 未路由 | protobuf / `pb_realtime_leave_map_req` | `—` |
| 75003 | `req_realtime_map_back_born` | 未路由 | etf / `—` | `—` |
| 75004 | `req_realtime_map_move` | 未路由 | protobuf / `pb_realtime_map_role_move_req` | `—` |
| 75005 | `req_realtime_map_teleport_to_loc` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-COMMENT：英雄评论、点赞与评分

协议模块：`CommentCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄评论、点赞与评分”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 76601 | `req_comment_init_hero` | 未路由 | etf / `—` | `pb_hero_comment_info` |
| 76602 | `req_comment_add_like_count` | 未路由 | protobuf / `pb_req_add_like_count` | `pb_role_comment_info` |
| 76603 | `req_comment_add` | 未路由 | protobuf / `pb_hero_comment_insert_req` | `pb_hero_comments` |
| 76604 | `req_comment_set_score` | 未路由 | protobuf / `pb_hero_comment_set_score_req` | `pb_role_comment_info` |
| 76605 | `req_comment_role_score_info` | 未路由 | etf / `—` | `pb_role_comment_info` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-RELATIONSHIP：关系标记与通知

协议模块：`RelationshipCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“关系标记与通知”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 77501 | `req_relationship_mark` | 未路由 | protobuf / `pb_relation_mark_req` | `pb_relation_mark_rsp` |
| 77502 | `req_relationship_unmark` | 未路由 | protobuf / `pb_relation_un_mark_req` | `pb_relation_un_mark_rsp` |
| 77503 | `req_relationship_set_no_notify` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-ADVENTURE：冒险玩家列表

协议模块：`AdventureCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“冒险玩家列表”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 77601 | `req_adventure_role_list` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-STRATEGY：英雄攻略排行

协议模块：`StrategyCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄攻略排行”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 79201 | `req_hero_strategy_ranks` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDREDENVELOPE：公会红包

协议模块：`GuildRedEnvelopeCmd`。未路由 8；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会红包”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 83101 | `req_guild_red_envelope_fetch` | 未路由 | protobuf / `pb_guild_red_envelope_fetch_req` | `pb_guild_red_envelope_fetch_rsp` |
| 83102 | `req_guild_red_envelope_send` | 未路由 | etf / `—` | `—` |
| 83103 | `req_guild_red_envelope_get_data` | 未路由 | etf / `—` | `pb_guild_red_envelope_get_data_rsp` |
| 83104 | `req_guild_red_envelope_create` | 未路由 | etf / `—` | `pb_role_guild_red_envelope` |
| 83105 | `req_guild_red_envelop_show_log` | 未路由 | protobuf / `pb_guild_red_envelope_show_log_req` | `pb_guild_red_envelope_fetch_log`（定义缺失） |
| 83106 | `req_guild_red_envelop_thanks` | 未路由 | etf / `—` | `pb_res_to_client` |
| 83107 | `req_guild_red_envelop_rank` | 未路由 | etf / `—` | `pb_guild_red_envelope_rank_list` |
| 83108 | `req_guild_red_envelop_fetch_join` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDTRIAL：公会试炼、求助、助战与奖励

协议模块：`GuildTrialCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会试炼、求助、助战与奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 83401 | `req_guild_trial_help_info` | 未路由 | etf / `—` | `pb_guild_trial_help_info` |
| 83402 | `req_guild_trial_help_log` | 未路由 | etf / `—` | `pb_guild_trial_help_log_toc` |
| 83403 | `req_guild_trial_help` | 未路由 | etf / `—` | `pb_guild_trial_help_toc` |
| 83404 | `req_guild_trial_set_notice` | 未路由 | etf / `—` | `—` |
| 83405 | `req_guild_trial_gain_pass_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 83406 | `req_guild_trial_gain_box_award` | 未路由 | protobuf / `pb_guild_trial_gain_box_tos` | `pb_guild_trial_gain_box_toc` |
| 83407 | `req_guild_trial_gain_fight_log` | 未路由 | etf / `—` | `—` |
| 83408 | `req_guild_trial_rev_fail` | 未路由 | etf / `—` | `pb_guild_trial_rev_fail_toc` |
| 83409 | `req_guild_trial_suppress` | 未路由 | protobuf / `pb_guild_trial_fight_tos` | `pb_guild_trial_fight_toc` |
| 83410 | `req_guild_trial_read_help_log` | 未路由 | protobuf / `pb_guild_trial_read_help_log_req` | `pb_guild_trial_read_help_log_rsp` |
| 83411 | `req_guild_trial_thank_help` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-DANMAKU：弹幕点赞

协议模块：`DanmakuCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“弹幕点赞”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84701 | `req_like_danmuku` | 未路由 | protobuf / `pb_req_like_danmaku` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDEXPLORE：公会探索、地图、BOSS、任务与图鉴

协议模块：`GuildExploreCmd`。未路由 28；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会探索、地图、BOSS、任务与图鉴”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89301 | `req_guild_explore_pick_up_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89302 | `req_guild_explore_pick_up_person_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89303 | `req_guild_explore_portal` | 未路由 | protobuf / `pb_guild_explore_portal_req` | `pb_res_to_client` |
| 89304 | `req_guild_explore_move` | 未路由 | protobuf / `pb_guild_explore_move_req` | `pb_res_to_client` |
| 89305 | `req_guild_explore_task` | 未路由 | etf / `—` | `pb_guild_explore_task_back` |
| 89306 | `req_guild_wish` | 未路由 | etf / `—` | `pb_guild_explore_wish_back` |
| 89307 | `req_guild_explore_play_game` | 未路由 | protobuf / `pb_guild_explore_play_game_req` | `pb_guild_explore_play_game_back` |
| 89308 | `req_guild_explore_finish_game` | 未路由 | protobuf / `pb_guild_explore_finish_game_req` | `pb_guild_explore_finish_game_back` |
| 89309 | `req_guild_explore_get_game_award` | 未路由 | protobuf / `pb_guild_explore_get_game_award_req` | `pb_guild_explore_get_game_award_back` |
| 89310 | `req_guild_explore_camp` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89311 | `req_guild_explore_receive_build_level` | 未路由 | protobuf / `pb_guild_explore_build_award_req` | `pb_guild_explore_build_award_back` |
| 89312 | `req_guild_explore_atk_boss` | 未路由 | etf / `—` | `pb_guild_explore_atk_boss_back` |
| 89313 | `req_guild_explore_handbook_active` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89314 | `req_guild_explore_handbook_level_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89315 | `req_guild_explore_camp_stat` | 未路由 | etf / `—` | `pb_guild_explore_camp_stat` |
| 89316 | `req_guild_explore_buy_goods` | 未路由 | etf / `—` | `pb_guild_explore_shop_back` |
| 89317 | `req_guild_explore_unlock_portal` | 未路由 | etf / `—` | `—` |
| 89318 | `req_guild_explore_guide_task` | 未路由 | etf / `—` | `pb_guild_explore_task_back` |
| 89319 | `req_guild_explore_pre_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89320 | `req_guild_explore_pre_finish` | 未路由 | etf / `—` | `—` |
| 89321 | `req_guild_explore_join_wolf` | 未路由 | etf / `—` | `—` |
| 89322 | `req_guild_explore_rev_wolf` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89323 | `req_guild_explore_person_task` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89324 | `req_guild_explore_boss_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89326 | `req_guild_explore_boss_unlock` | 未路由 | etf / `—` | `pb_guild_explore_guild` |
| 89327 | `req_guild_explore_boss_enter` | 未路由 | etf / `—` | `—` |
| 89328 | `req_guild_explore_boss_sweep` | 未路由 | etf / `—` | `pb_res_to_client` |
| 893289 | `req_guild_explore_boss_box_list` | 未路由 | etf / `—` | `pb_guild_explore_get_boss_box_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDEXPLORETRIAL：公会探索试炼

协议模块：`GuildExploreTrialCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会探索试炼”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89351 | `req_guild_explore_trial_receive` | 未路由 | etf / `—` | `pb_guild_explore_trial_receive_back` |
| 89352 | `req_guild_explore_trial_member` | 未路由 | etf / `—` | `pb_guild_explore_trial_member_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDWAR：公会战、集结、竞猜与排行奖励

协议模块：`GuildWarCmd`。未路由 14；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会战、集结、竞猜与排行奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90001 | `req_guild_war_guess` | 未路由 | protobuf / `pb_guild_war_guess_req` | `pb_guild_war_guess` |
| 90002 | `req_guild_war_guess_receive` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90005 | `req_guild_war_set_gather_loc` | 未路由 | etf / `—` | `—` |
| 90006 | `req_guild_war_set_gather_role` | 未路由 | etf / `—` | `—` |
| 90007 | `req_guild_war_fight` | 未路由 | protobuf / `pb_guild_war_fight_req` | `pb_realtime_challenge_fight_ret` |
| 90008 | `req_guild_war_fight_offline` | 未路由 | protobuf / `pb_guild_war_fight_req` | `—` |
| 90009 | `req_guild_war_update_entry` | 未路由 | etf / `—` | `pb_guild_war_entry` |
| 90010 | `req_guild_war_guess_data` | 未路由 | etf / `—` | `pb_guild_war_guess` |
| 90011 | `req_guild_war_receive_rank` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90012 | `req_guild_war_person` | 未路由 | etf / `—` | `pb_guild_war_person` |
| 90013 | `req_guild_war_fight_monster` | 未路由 | protobuf / `pb_guild_war_fight_req` | `—` |
| 90014 | `req_guild_war_host` | 未路由 | etf / `—` | `—` |
| 90015 | `req_guild_war_host_cancel` | 未路由 | etf / `—` | `—` |
| 90016 | `req_guild_war_share` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDDUEL：公会对决、匹配与轮次奖励

协议模块：`GuildDuelCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会对决、匹配与轮次奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90701 | `req_guild_duel_match_data` | 未路由 | etf / `—` | `pb_guild_duel_match_data_back` |
| 90702 | `req_guild_duel_receive_round` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90703 | `req_guild_duel_receive_level` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90704 | `req_guild_duel_fast_fight` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90705 | `req_guild_duel_read_report` | 未路由 | etf / `—` | `pb_guild_duel_report_back` |
| 90706 | `req_guild_duel_read_record` | 未路由 | etf / `—` | `pb_guild_duel_guild_record` |
| 90707 | `req_guild_duel_match_zone` | 未路由 | etf / `—` | `pb_guild_duel_zone_back_list` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDRACING：公会竞速、支援、BUFF 投票与积分

协议模块：`GuildRacingCmd`。未路由 9；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会竞速、支援、BUFF 投票与积分”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91201 | `req_attend` | 未路由 | etf / `—` | `pb_guild_racing_attend_back` |
| 91202 | `req_support` | 未路由 | etf / `—` | `pb_guild_racing_support` |
| 91203 | `req_use_buff` | 未路由 | protobuf / `pb_guild_racing_buff_use_req` | `pb_res_to_client` |
| 91204 | `req_vote_buff` | 未路由 | etf / `—` | `pb_guild_racing_r` |
| 91205 | `req_role_list` | 未路由 | etf / `—` | `pb_guild_racing_role_info_list` |
| 91206 | `req_guild_racing_rev_award` | 未路由 | etf / `—` | `pb_guild_racing_rev_award_back` |
| 91207 | `req_guild_racing_score_info` | 未路由 | etf / `—` | `pb_guild_racing_score` |
| 91208 | `req_guild_racing_rev_buff` | 未路由 | etf / `—` | `pb_guild_racing_rev_buff_back` |
| 91209 | `req_guild_racing_rev_score_award` | 未路由 | etf / `—` | `pb_guild_racing_rev_award_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDBOSS：公会 BOSS、伤害奖励与技能物品

协议模块：`GuildBossCmd`。未路由 12；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会 BOSS、伤害奖励与技能物品”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91301 | `req_guild_boss_enter_map` | 未路由 | etf / `—` | `pb_guild_boss_guild` |
| 91302 | `req_guild_boss_leave_map` | 未路由 | etf / `—` | `—` |
| 91303 | `req_guild_boss_use_skill` | 未路由 | protobuf / `pb_guild_boss_use_skill_req` | `pb_guild_boss_use_skill_back` |
| 91304 | `req_claim_boss_dmg_award` | 未路由 | protobuf / `pb_req_claim_boss_dmg_award` | `pb_res_to_client` |
| 91305 | `req_batch_claim_boss_award` | 未路由 | protobuf / `pb_req_batch_claim_boss_award` | `pb_res_to_client` |
| 91306 | `req_claim_boss_use_skill_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91307 | `req_claim_daily_free_skill_item` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91308 | `req_claim_guild_boss_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91309 | `req_join_guild_boss` | 未路由 | etf / `—` | `pb_res_join_guild_boss` |
| 91310 | `req_claim_guild_boss_online_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91311 | `req_buy_guild_boss_item` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91312 | `req_guild_boss_guild_info` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDJOINT：公会联合探索与资源争夺

协议模块：`GuildJointCmd`。未路由 25；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会联合探索与资源争夺”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91601 | `req_guild_joint_pick_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91602 | `req_guild_joint_pick_monster` | 未路由 | etf / `—` | `pb_guild_joint_atk_monster` |
| 91603 | `req_guild_joint_pick_door` | 未路由 | etf / `—` | `—` |
| 91604 | `req_guild_joint_pick_lode` | 未路由 | etf / `—` | `pb_guild_joint_pick_lode_rsp` |
| 91605 | `req_guild_joint_task` | 未路由 | etf / `—` | `pb_guild_joint_rev_task_rsp` |
| 91606 | `req_guild_joint_rev_lode` | 未路由 | etf / `—` | `pb_guild_joint_rev_lode_rsp` |
| 91607 | `req_get_role_rank` | 未路由 | etf / `—` | `pb_guild_role_rank_show_list` |
| 91608 | `req_guild_joint_set_pioneer` | 未路由 | protobuf / `pb_guild_j_set_pioneer_req` | `pb_guild_j_pioneer_rsp` |
| 91609 | `req_guild_joint_cancel_door` | 未路由 | etf / `—` | `—` |
| 91610 | `req_guild_joint_set_focus` | 未路由 | etf / `—` | `—` |
| 91611 | `req_guild_joint_fight_report` | 未路由 | etf / `—` | `pb_guild_j_report_rsp` |
| 91612 | `req_guild_joint_get_info` | 未路由 | etf / `—` | `pb_guild_joint_enter_map_back` |
| 91613 | `req_guild_joint_single_monster` | 未路由 | etf / `—` | `pb_guild_joint_role_map` |
| 91614 | `req_guild_joint_single_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 91615 | `req_guild_joint_single_door` | 未路由 | etf / `—` | `pb_guild_joint_role_map` |
| 91616 | `req_guild_joint_calc_door` | 未路由 | etf / `—` | `—` |
| 91617 | `req_guild_joint_settle_rank` | 未路由 | etf / `—` | `—` |
| 91618 | `req_guild_joint_enter_single` | 未路由 | etf / `—` | `pb_guild_joint_enter_map_back` |
| 91619 | `req_guild_joint_single_settle` | 未路由 | etf / `—` | `pb_guild_joint_role_map` |
| 91620 | `req_guild_joint_single_cancel` | 未路由 | etf / `—` | `pb_guild_joint_role_map` |
| 91621 | `req_guild_joint_share` | 未路由 | etf / `—` | `—` |
| 91622 | `req_guild_joint_cancel_monster` | 未路由 | etf / `—` | `—` |
| 91623 | `req_guild_joint_calc_monster` | 未路由 | etf / `—` | `—` |
| 91624 | `req_guild_joint_set_auto` | 未路由 | etf / `—` | `pb_guild_joint_guild` |
| 91625 | `req_guild_joint_one_get` | 未路由 | protobuf / `pb_guild_joint_rev_one_get_req` | `pb_guild_joint_rev_task_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDRUNESTONE：公会符石穿脱与合成

协议模块：`GuildRuneStoneCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会符石穿脱与合成”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92701 | `req_guild_rune_stone_take_on` | 未路由 | protobuf / `pb_guild_rune_stone_take_on_req` | `pb_res_to_client` |
| 92702 | `req_guild_rune_stone_take_off` | 未路由 | protobuf / `pb_guild_rune_stone_take_off_req` | `pb_res_to_client` |
| 92703 | `req_guild_rune_stone_compose` | 未路由 | protobuf / `pb_guild_rune_stone_compose_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDGVG：公会 GVG 地图、矿点与据点争夺

协议模块：`GuildGVGCmd`。未路由 18；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会 GVG 地图、矿点与据点争夺”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 97001 | `req_guild_gvg_pick_box` | 未路由 | etf / `—` | `pb_res_to_client` |
| 97002 | `req_guild_gvg_pick_lode` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97003 | `req_guild_gvg_attack_lode` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97004 | `req_guild_gvg_rev_lode` | 未路由 | etf / `—` | `—` |
| 97005 | `req_guild_gvg_pick_monster` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97006 | `req_guild_gvg_rev_monster` | 未路由 | etf / `—` | `—` |
| 97007 | `req_guild_gvg_pick_block` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97008 | `req_guild_gvg_pick_hold` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97009 | `req_guild_gvg_pvp` | 未路由 | etf / `—` | `—` |
| 97010 | `req_guild_gvg_defense_hold` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97011 | `req_guild_gvg_focus` | 未路由 | etf / `—` | `—` |
| 97012 | `req_guild_gvg_task` | 未路由 | etf / `—` | `—` |
| 97013 | `req_guild_gvg_unlock_portal` | 未路由 | etf / `—` | `—` |
| 97014 | `req_guild_gvg_portal` | 未路由 | protobuf / `pb_guild_gvg_portal_req` | `—` |
| 97015 | `req_guild_gvg_cancel_block` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97016 | `req_guild_gvg_leave_hold` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97017 | `req_guild_gvg_cancel_monster` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |
| 97018 | `req_guild_gvg_leave_hold_fight` | 未路由 | protobuf / `pb_guild_gvg_req` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDVOTE：公会投票

协议模块：`GuildVoteCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会投票”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98702 | `req_guild_vote_vote` | 未路由 | protobuf / `pb_guild_vote_req` | `pb_guild_vote_info` |
| 99701 | `req_guild_vote_start` | 未路由 | etf / `—` | `pb_guild_vote_info` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-SLGMAP：SLG 地图视野与进出

协议模块：`SlgMapCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“SLG 地图视野与进出”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99100 | `req_slg_map_add_block_view` | 未路由 | protobuf / `pb_slg_map_view_req` | `—` |
| 99101 | `req_slg_map_enter` | 未路由 | etf / `—` | `—` |
| 99102 | `req_slg_map_leave` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDNATION：公会国战、建造、兵种、科技、行军与据点

协议模块：`GuildNationCmd`。未路由 64；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会国战、建造、兵种、科技、行军与据点”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[guild-nation-assist-service.mjs](../../../personal-server/game/guild-nation-assist-service.mjs)。

已确认的附加缺口：

- 99229 可读 SQLite 助力列表，不是国战已实现；其余 64 条命令未路由，建造/兵种/科技/行军/城防/据点/集结及周期结算均需实现。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99200 | `req_guild_nation_go_attack` | 未路由 | protobuf / `pb_guild_nation_go_attack_req` | `pb_guild_nation_go_attack_back` |
| 99201 | `req_guild_nation_role_build` | 未路由 | protobuf / `pb_guild_nation_up_level_req` | `pb_guild_nation_build_change_back` |
| 99202 | `req_guild_nation_spawn_soldier` | 未路由 | protobuf / `pb_guild_nation_spawn_soldier_req` | `pb_guild_nation_up_soldier_back` |
| 99203 | `req_guild_nation_soldier_up` | 未路由 | protobuf / `pb_guild_nation_up_soldier_req` | `pb_guild_nation_up_soldier_back` |
| 99204 | `req_guild_nation_queue_unlock` | 未路由 | etf / `—` | `pb_guild_nation_build_queue_change_back` |
| 99205 | `req_guild_nation_build_cancel` | 未路由 | etf / `—` | `pb_guild_nation_build_change_back` |
| 99206 | `req_guild_nation_gem_acc` | 未路由 | etf / `—` | `pb_guild_nation_build_change_back` |
| 99207 | `req_guild_nation_item_acc` | 未路由 | protobuf / `pb_guild_nation_build_item_acc_req` | `pb_guild_nation_build_change_back` |
| 99208 | `req_guild_nation_read_report` | 未路由 | protobuf / `pb_guild_nation_read_report_req` | `pb_guild_nation_report_back` |
| 99209 | `req_guild_nation_delete_report` | 未路由 | etf / `—` | `—` |
| 99210 | `req_guild_nation_recv_report` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99211 | `req_guild_nation_report_list` | 未路由 | etf / `—` | `pb_guild_nation_report_list` |
| 99212 | `req_guild_nation_technology_study` | 未路由 | protobuf / `pb_guild_nation_study_req` | `pb_guild_nation_study_change_back` |
| 99213 | `req_guild_nation_cancel_study` | 未路由 | etf / `—` | `pb_guild_nation_study_change_back` |
| 99214 | `req_guild_nation_study_gem_acc` | 未路由 | etf / `—` | `pb_guild_nation_study_change_back` |
| 99215 | `req_guild_nation_study_item_acc` | 未路由 | protobuf / `pb_guild_nation_study_speed_req` | `pb_guild_nation_study_change_back` |
| 99216 | `req_guild_nation_finish_study` | 未路由 | etf / `—` | `pb_guild_nation_finish_study_back` |
| 99217 | `req_guild_nation_update_red_dot` | 未路由 | etf / `—` | `—` |
| 99218 | `req_guild_nation_team_recall` | 未路由 | etf / `—` | `—` |
| 99219 | `req_guild_nation_soldier_cancel` | 未路由 | etf / `—` | `pb_guild_nation_up_soldier_back` |
| 99220 | `req_guild_nation_defense_use_protect` | 未路由 | etf / `—` | `pb_guild_nation_use_protect_back` |
| 99221 | `req_guild_nation_defense_extinguish` | 未路由 | etf / `—` | `pb_guild_nation_extinguish_back` |
| 99222 | `req_guild_nation_defense_repair_city` | 未路由 | etf / `—` | `pb_guild_nation_repair_city_back` |
| 99223 | `req_guild_nation_build_free_acc` | 未路由 | etf / `—` | `pb_guild_nation_build_list` |
| 99224 | `req_guild_nation_assign_soldier` | 未路由 | protobuf / `pb_guild_nation_soldier_line_up_req` | `pb_guild_nation_soldier_line_up_back` |
| 99225 | `req_guild_nation_soldier_gem_acc` | 未路由 | etf / `—` | `pb_guild_nation_up_soldier_back` |
| 99226 | `req_guild_nation_soldier_item_acc` | 未路由 | protobuf / `pb_guild_nation_build_item_acc_req` | `pb_guild_nation_up_soldier_back` |
| 99227 | `req_guild_nation_donate_guild_tech` | 未路由 | protobuf / `pb_guild_nation_team_tech_donation_req` | `pb_guild_nation_team_tech_donation_back` |
| 99228 | `req_guild_nation_power` | 未路由 | etf / `—` | `pb_guild_nation_power_info_rsp` |
| 99230 | `req_guild_nation_send_assist` | 未路由 | protobuf / `pb_guild_nation_assist_rsp` | `—` |
| 99231 | `req_guild_nation_assist` | 未路由 | protobuf / `pb_guild_nation_assist_list` | `pb_guild_nation_assist_list_back` |
| 99232 | `req_guild_nation_soldier_item_raise_num` | 未路由 | protobuf / `pb_res_obj` | `pb_guild_nation_soldier_item_raise_num_back` |
| 99233 | `req_guild_nation_recommend_guild_tech` | 未路由 | etf / `—` | `pb_guild_nation_team_tech_recommend_back` |
| 99234 | `req_guild_nation_move_guild_base` | 未路由 | etf / `—` | `pb_guild_nation_guild` |
| 99235 | `req_guild_nation_move_role_base` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99236 | `req_guild_nation_defense_defense_return` | 未路由 | protobuf / `pb_guild_nation_help_defense_return_req` | `—` |
| 99237 | `req_guild_nation_repair_city_acc_item` | 未路由 | protobuf / `pb_guild_nation_repair_city_acc_item_req` | `pb_guild_nation_repair_city_back` |
| 99238 | `req_guild_nation_repair_city_acc_gem` | 未路由 | etf / `—` | `pb_guild_nation_repair_city_back` |
| 99239 | `req_guild_nation_repair_cancel` | 未路由 | etf / `—` | `pb_guild_nation_repair_city_back` |
| 99240 | `req_guild_nation_finish_task` | 未路由 | etf / `—` | `pb_guild_nation_task_finish_back` |
| 99241 | `req_guild_nation_finish_phase_task` | 未路由 | etf / `—` | `pb_guild_nation_task_finish_back` |
| 99242 | `req_guild_nation_other_role_info` | 未路由 | etf / `—` | `pb_guild_nation_role` |
| 99243 | `req_guild_nation_march_acc` | 未路由 | protobuf / `pb_guild_nation_march_acc_req` | `pb_guild_nation_march_acc_back` |
| 99244 | `req_guild_nation_repair_map_core` | 未路由 | etf / `—` | `pb_guild_nation_repair_map_back` |
| 99245 | `req_guild_nation_map_obj_search` | 未路由 | protobuf / `pb_guild_nation_search_req` | `pb_guild_nation_search_back` |
| 99246 | `req_guild_nation_call_muster` | 未路由 | protobuf / `pb_guild_nation_call_muster_req` | `pb_guild_nation_call_muster_back` |
| 99247 | `req_guild_nation_answer_muster` | 未路由 | protobuf / `pb_guild_nation_answer_muster_req` | `pb_guild_nation_answer_muster_back` |
| 99248 | `req_guild_nation_set_flag` | 未路由 | etf / `—` | `pb_guild_nation_guild_res_to_client` |
| 99249 | `req_guild_nation_move_flag` | 未路由 | protobuf / `pb_guild_nation_move_flag_req` | `pb_guild_nation_guild_res_to_client` |
| 99250 | `req_guild_nation_stronghold_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99251 | `req_guild_nation_stronghold_honor_award` | 未路由 | protobuf / `pb_guild_nation_stronghold_honor_req` | `pb_res_to_client` |
| 99252 | `req_guild_nation_stronghold_capture_award` | 未路由 | protobuf / `pb_guild_nation_stronghold_capture_record` | `pb_guild_nation_stronghold_capture_record` |
| 99253 | `req_guild_nation_muster_info_list` | 未路由 | etf / `—` | `pb_guild_nation_muster_info_list_back` |
| 99254 | `req_guild_nation_stronghold_sign` | 未路由 | etf / `—` | `pb_guild_nation_stronghold_sign_ret` |
| 99255 | `req_guild_nation_cancle_muster` | 未路由 | protobuf / `pb_guild_nation_cancel_muster_req` | `pb_guild_nation_cancel_muster_back` |
| 99256 | `req_guild_nation_up_lv_guild_tech` | 未路由 | etf / `—` | `pb_guild_nation_guild_tech_up_back` |
| 99257 | `req_guild_nation_study_gem_finish` | 未路由 | etf / `—` | `pb_guild_nation_finish_study_back` |
| 99258 | `req_guild_nation_stronghold_battle_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99259 | `req_guild_nation_map_obj_info` | 未路由 | etf / `—` | `—` |
| 99260 | `req_guild_nation_free_finish_study` | 未路由 | etf / `—` | `pb_guild_nation_finish_study_back` |
| 99261 | `req_guild_nation_guild_battle_list` | 未路由 | etf / `—` | `pb_guild_nation_battle_guild` |
| 99262 | `req_guild_nation_hold_map_obj_info` | 未路由 | etf / `—` | `pb_guild_nation_stronghold` |
| 99263 | `req_guild_nation_hold_sign_num_info` | 未路由 | etf / `—` | `pb_guild_nation_stronghold_sign_num` |
| 99264 | `req_guild_nation_guild_base_return` | 未路由 | protobuf / `pb_guild_nation_help_defense_return_req` | `—` |

已有处理路径（必须回归）：`99229 req_guild_nation_get_assist_list`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDBARGAIN：公会砍价

协议模块：`GuildBargainCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会砍价”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101401 | `req_guild_bargain_info` | 未路由 | etf / `—` | `pb_guild_bargain_get_info_rsp` |
| 101402 | `req_guild_bargain` | 未路由 | protobuf / `pb_guild_bargain_req` | `pb_guild_bargain_rsp` |
| 101403 | `req_guild_bargain_buy` | 未路由 | protobuf / `pb_guild_bargain_buy_req` | `pb_guild_bargain_buy_rsp` |
| 101404 | `req_guild_not_bargain_list` | 未路由 | protobuf / `pb_guild_not_bargain_list_req` | `pb_guild_not_bargain_list_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDEXPEDITION：公会远征、宣战、鼓舞、竞猜与地图排名

协议模块：`GuildExpeditionCmd`。未路由 15；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会远征、宣战、鼓舞、竞猜与地图排名”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101601 | `req_guild_expedition_server_info` | 未路由 | etf / `—` | `pb_guild_expedition_info` |
| 101602 | `req_guild_expedition_declare` | 未路由 | etf / `—` | `—` |
| 101603 | `req_guild_expedition_inspire` | 未路由 | etf / `—` | `pb_guild_expedition_inspire_back` |
| 101604 | `req_guild_expedition_fight_report` | 未路由 | etf / `—` | `pb_guild_expedition_req_report_back` |
| 101605 | `req_guild_expedition_city_rank` | 未路由 | etf / `—` | `pb_guild_expedition_city_guild_rank` |
| 101606 | `req_guild_expedition_guild_inner_rank` | 未路由 | etf / `—` | `pb_guild_expedition_city_role_rank` |
| 101607 | `req_guild_expedition_build_rank` | 未路由 | etf / `—` | `pb_guild_expedition_build_guild_rank` |
| 101608 | `req_guild_expedition_guess_info` | 未路由 | etf / `—` | `pb_guild_expedition_guess_info_back` |
| 101609 | `req_guild_expedition_guess` | 未路由 | protobuf / `pb_guild_expedition_guess_req` | `pb_guild_expedition_guess_back` |
| 101610 | `req_guild_expedition_city_pos_list` | 未路由 | etf / `—` | `pb_guild_expedition_pos_list` |
| 101611 | `req_guild_expedition_build_pos_list` | 未路由 | etf / `—` | `pb_guild_expedition_pos_list` |
| 101612 | `req_guild_expedition_like` | 未路由 | etf / `—` | `pb_res_to_client` |
| 101613 | `req_guild_expedition_guild_info` | 未路由 | etf / `—` | `pb_guild_expedition_guild` |
| 101614 | `req_guild_expedition_grass` | 未路由 | protobuf / `pb_guild_expedition_pos_fight_req` | `pb_guild_expedition_pos_fight_back` |
| 101615 | `req_guild_expedition_city_info_list` | 未路由 | etf / `—` | `pb_guild_expedition_city_info_list` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-CHANNELENTRY：频道入口业务

协议模块：`ChannelEntryCmd`。未路由 0；明确拒绝 0；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“频道入口业务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 102801 只有入口确认，未建立频道会话/成员/消息；与 SOC-MSG 和 SOC-CHAT 联合交付。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102801 | `req_channel_entry` | 空结构/固定值/仅应答：频道入口只应答 | etf / `—` | `pb_channel_entry` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDHUNT：公会狩猎参与与支援

协议模块：`GuildHuntCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会狩猎参与与支援”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103401 | `req_guild_hunt_attend` | 未路由 | etf / `—` | `—` |
| 103402 | `req_guild_hunt_support` | 未路由 | etf / `—` | `pb_res_to_client` |
| 103403 | `req_guild_hunt_server_info` | 未路由 | etf / `—` | `pb_guild_hunt_server` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDCRUSADE：公会讨伐排名

协议模块：`GuildCrusadeCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会讨伐排名”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105805 | `req_guild_crusade_get_rank` | 未路由 | etf / `—` | `pb_guild_crusade_rank_rsp`（定义缺失） |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## SOC-GUILDAUCTION：公会拍卖、心愿与领取

协议模块：`GuildAuctionCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公会拍卖、心愿与领取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107601 | `req_guild_auction_bid` | 未路由 | protobuf / `req_guild_auction_bid` | `rsp_guild_auction_bid` |
| 107602 | `req_guild_auction_wish` | 未路由 | protobuf / `pb_guild_auction_wish_req` | `rsp_guild_auction_wish` |
| 107603 | `req_guild_auction_get` | 未路由 | etf / `—` | `guild_auction_get_req` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
