# 探索、家园、休闲与小游戏活动

本分区 29 个模块任务，194 条未路由/明确拒绝/占位命令。优先级：P2。

共同依赖：CORE-EVENTS；涉及战斗的分支依赖 CORE-BATTLE；访客/赠送/助力依赖 SOC-FRIEND/SOC-GUILD。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## PLAY-HOMEPUZZLEACT：家园拼图、赠送求助、分解与进度

协议模块：`HomePuzzleActCmd`。未路由 9；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“家园拼图、赠送求助、分解与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 11408 | `req_home_puzzle_task_reward` | 未路由 | protobuf / `pb_home_puzzle_task_reward_req` | `pb_home_puzzle_task_reward_rsp` |
| 11409 | `req_home_puzzle_gift` | 未路由 | protobuf / `pb_home_puzzle_gift_req` | `pb_home_puzzle_gift_rsp` |
| 11410 | `req_home_puzzle_request` | 未路由 | protobuf / `pb_home_puzzle_request_req` | `pb_home_puzzle_request_rsp` |
| 11413 | `req_home_puzzle_decompose` | 未路由 | protobuf / `pb_home_puzzle_decompose_req` | `pb_home_puzzle_decompose_rsp` |
| 11416 | `req_home_puzzle_rec_process_award` | 未路由 | protobuf / `pb_home_puzzle_rec_process_award_req` | `pb_home_puzzle_rec_process_award_rsp` |
| 11417 | `req_home_puzzle_get_friend_request_data` | 未路由 | protobuf / `pb_home_puzzle_get_friend_request_data_req` | `pb_home_puzzle_get_friend_request_data_rsp` |
| 11418 | `req_home_puzzle_rec_friend_gift_piece` | 未路由 | protobuf / `pb_home_puzzle_rec_gift_piece_req` | `pb_home_puzzle_rec_gift_piece_rsp` |
| 11419 | `req_home_puzzle_open_pack` | 未路由 | protobuf / `pb_home_puzzle_open_pack_req` | `pb_home_puzzle_open_pack_rsp` |
| 11420 | `req_home_puzzle_cancel_request` | 未路由 | protobuf / `pb_home_puzzle_cancel_request_req` | `pb_home_puzzle_cancel_request_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-HOMELANDACT：家园活动选人、任务、装修与清理

协议模块：`HomelandActCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“家园活动选人、任务、装修与清理”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 11501 | `req_homeland_act_select_hero` | 未路由 | protobuf / `pb_homeland_act_select_hero_req` | `pb_homeland_act_select_hero_rsp` |
| 11502 | `req_homeland_act_task_award` | 未路由 | protobuf / `pb_homeland_act_task_award_req` | `pb_homeland_act_task_award_rsp` |
| 11503 | `req_homeland_act_decorate` | 未路由 | protobuf / `pb_homeland_act_decorate_req` | `pb_homeland_act_decorate_rsp` |
| 11505 | `req_homeland_act_clear_room` | 未路由 | protobuf / `pb_homeland_act_clear_room_req` | `pb_homeland_act_clear_room_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-CARNIVAL：嘉年华大富翁、骰子、事件、建筑与科技

协议模块：`CarnivalCmd`。未路由 15；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“嘉年华大富翁、骰子、事件、建筑与科技”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 43003 | `req_carnival_use_item` | 未路由 | etf / `—` | `pb_mono_use_item_back` |
| 43006 | `req_carnival_throw_dice` | 未路由 | etf / `—` | `pb_mono_throw_dice_back` |
| 43008 | `req_carnival_touch_event` | 未路由 | etf / `—` | `—` |
| 43009 | `req_carnival_finish_event` | 未路由 | etf / `—` | `pb_mono_finish_ev_back` |
| 43010 | `req_carnival_auto_flush_dice` | 未路由 | etf / `—` | `pb_mono_auto_flush_dice_back` |
| 43014 | `req_carnival_buy_dice` | 未路由 | etf / `—` | `pb_mono_buy_dice_back` |
| 43016 | `req_carnival_latest_data` | 未路由 | etf / `—` | `pb_mono_req_data_back` |
| 43017 | `req_get_achieve_award` | 未路由 | etf / `—` | `pb_mono_rev_achieve_back` |
| 43018 | `req_monopoly_build` | 未路由 | etf / `—` | `pb_mono_one_build` |
| 43019 | `req_monopoly_build_up_level` | 未路由 | etf / `—` | `—` |
| 43020 | `req_mono_get_build_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 43021 | `req_mono_develop_tech` | 未路由 | etf / `—` | `pb_mono_tech` |
| 43022 | `req_carnival_build_dispatch` | 未路由 | protobuf / `pb_mono_dispatch_req` | `pb_mono_build_data` |
| 43023 | `req_carnival_box_award` | 未路由 | etf / `—` | `pb_mono_req_data_back` |
| 43024 | `req_handle_build_extra` | 未路由 | protobuf / `pb_mono_build_handle_req` | `pb_mono_build_handle_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-THEMETREASURE：主题寻宝、挑战、兑换与全服奖励

协议模块：`ThemeTreasureCmd`。未路由 12；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“主题寻宝、挑战、兑换与全服奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 76501 | `theme_treasure_hunt_req` | 未路由 | protobuf / `pb_theme_treasure_hunt_req` | `pb_theme_treasure_hunt_rsp` |
| 76502 | `theme_treasure_challenge_req` | 未路由 | protobuf / `pb_theme_treasure_challenge_req` | `pb_res_to_client` |
| 76503 | `theme_treasure_server_challenge_req` | 未路由 | etf / `—` | `—` |
| 76504 | `theme_treasure_exchange_req` | 未路由 | protobuf / `pb_theme_treasure_exchange_req` | `pb_theme_treasure_exchange_rsp` |
| 76505 | `theme_treasure_challenge_turn_req` | 未路由 | protobuf / `pb_theme_treasure_challenge_turn_req` | `pb_res_to_client` |
| 76506 | `theme_treasure_target_req` | 未路由 | etf / `—` | `—` |
| 76507 | `theme_treasure_task_award_req` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76508 | `theme_treasure_turn_award_req` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76509 | `theme_treasure_server_award_req` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76510 | `theme_treasure_special_award_req` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76511 | `theme_treasure_daily_award_req` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76512 | `req_theme_treasure_server` | 未路由 | etf / `—` | `pb_theme_treasure_server_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-MINIGAME：通用小游戏、结算与老虎机重试

协议模块：`MiniGameCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用小游戏、结算与老虎机重试”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 83701 | `req_mini_game_settle` | 未路由 | protobuf / `pb_mini_game_settle_req` | `pb_mini_game_settle_rsp` |
| 83702 | `req_mini_game_enter` | 未路由 | protobuf / `pb_mini_game_enter_req` | `pb_mini_game_enter_rsp` |
| 83703 | `req_slot_machine_retry` | 未路由 | etf / `—` | `pb_mini_game_slot_machine` |
| 83704 | `req_mini_game_handle` | 未路由 | protobuf / `pb_mini_game_handle_req` | `pb_mini_game_handle_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-TREASUREHUNT：寻宝、铲子购买、合成、删除与刷新

协议模块：`TreasureHuntCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“寻宝、铲子购买、合成、删除与刷新”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 85601 | `req_treasure_hunt` | 未路由 | etf / `—` | `pb_treasure_hunt_ret_all` |
| 85605 | `req_treasure_hunt_buy_shovel` | 未路由 | etf / `—` | `pb_res_to_client` |
| 85606 | `req_treasure_hunt_compose` | 未路由 | protobuf / `pb_treasure_hunt_compose_req` | `—` |
| 85607 | `req_treasure_hunt_auto_compose` | 未路由 | etf / `—` | `pb_treasure_hunt_compose_ret` |
| 85608 | `req_treasure_hunt_delete_shovel` | 未路由 | etf / `—` | `pb_treasure_hunt_delete_ret` |
| 85609 | `req_treasure_hunt_exchange_shovel` | 未路由 | protobuf / `pb_treasure_hunt_exchange_req` | `—` |
| 85610 | `req_treasure_hunt_refresh` | 未路由 | etf / `—` | `pb_treasure_hunt_refresh_ret` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-GRANDTOURER：旅行令牌、任务、兑换、里程与强化

协议模块：`GrandTourerCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“旅行令牌、任务、兑换、里程与强化”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87801 | `req_grand_tourer_get_token` | 未路由 | etf / `—` | `pb_res_to_client` |
| 87802 | `req_grand_tourer_task_award` | 未路由 | etf / `—` | `pb_grand_tourer_task_back` |
| 87803 | `req_grand_tourer_exchange_token` | 未路由 | etf / `—` | `pb_res_to_client` |
| 87804 | `req_grand_tourer_distance_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 87805 | `req_grand_tourer_enhance` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-DREAM：梦境事件、日周奖、收集、宝箱与 NPC 阵容

协议模块：`DreamCmd`。未路由 10；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“梦境事件、日周奖、收集、宝箱与 NPC 阵容”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88001 | `req_dream_finish_event` | 未路由 | protobuf / `pb_dream_finish_event_req` | `pb_dream_fight_event_rsp` |
| 88002 | `req_dream_day_award` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88003 | `req_dream_week_finish_award` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88004 | `req_dream_all_finish_award` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88005 | `req_dream_finish_task` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88006 | `req_dream_collect_award` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88007 | `req_dream_box_award` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88008 | `req_dream_npc_lineup` | 未路由 | etf / `—` | `pb_dream_npc_lineup_rsp` |
| 88009 | `req_dream_single_collect_award` | 未路由 | etf / `—` | `pb_dream_award_rsp` |
| 88010 | `req_dream_refresh_event` | 未路由 | etf / `—` | `pb_dream_refresh_event_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-MAGICALJOURNEY：魔法旅程、国家养成、收藏、关卡与 BOSS

协议模块：`MagicalJourneyCmd`。未路由 17；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“魔法旅程、国家养成、收藏、关卡与 BOSS”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89901 | `req_magical_journey_sword` | 未路由 | protobuf / `pb_magical_journey_sword_req` | `pb_magical_journey_sword_rsp` |
| 89902 | `req_magical_journey_country_main_up` | 未路由 | etf / `—` | `pb_magical_journey_main_up_rsp` |
| 89903 | `req_magical_journey_country_sub_active` | 未路由 | protobuf / `pb_magical_journey_country_sub_active_req` | `pb_magical_journey_country_sub_active_rsp` |
| 89904 | `req_magical_journey_country_sub_up` | 未路由 | etf / `—` | `pb_magical_journey_sub_up_rsp` |
| 89905 | `req_magical_journey_sword_record` | 未路由 | etf / `—` | `pb_magical_journey_sword_record_info` |
| 89906 | `req_magical_journey_activate_normal_collect` | 未路由 | protobuf / `pb_magical_journey_collect_activate_req` | `pb_magical_journey_collect_activate_normal_rsp` |
| 89907 | `req_magical_journey_activate_season_collect` | 未路由 | protobuf / `pb_magical_journey_collect_activate_req` | `pb_res_to_client` |
| 89908 | `req_magical_journey_mission_star_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89909 | `req_magical_journey_mission_task_award` | 未路由 | etf / `—` | `pb_magical_journey_task_rev_back` |
| 89910 | `req_magical_journey_mission_multi_fight` | 未路由 | protobuf / `pb_magical_journey_mission_fight_req` | `pb_magical_journey_mission_multi_fight_back` |
| 89911 | `req_magical_journey_boss_multi_fight` | 未路由 | protobuf / `pb_magical_journey_boss_fight_req` | `pb_magical_journey_boss_fight_back` |
| 89912 | `req_magical_journey_chapter_progress_award` | 未路由 | etf / `—` | `pb_magical_journey_progress_rev_back` |
| 89913 | `req_magical_journey_node_rank_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89914 | `req_magical_journey_mission_pass_info` | 未路由 | etf / `—` | `pb_magical_journey_mission_pass` |
| 89915 | `req_magical_journey_star_skill_active` | 未路由 | etf / `—` | `pb_magical_journey_star_activate_rsp` |
| 89916 | `req_magical_journey_power` | 未路由 | etf / `—` | `—` |
| 89917 | `req_magical_journey_login_after` | 未路由 | etf / `—` | `pb_magical_journey_login_after_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-PETACTIVITY：超凡魔灵现世选择、挑战、好感、治疗与兑换

协议模块：`PetActivityCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“超凡魔灵现世选择、挑战、好感、治疗与兑换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

已确认的附加缺口：

- 已有活动登录、魔灵数据、专属商城和礼包购买；90501–90507 核心选择、战斗、好感、治疗、活力与兑换均无路由。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90501 | `req_pet_act_select_pet` | 未路由 | protobuf / `pb_req_pet_act_select_pet` | `—` |
| 90502 | `req_pet_act_claim_fight_rewards` | 未路由 | protobuf / `pb_req_pet_act_daily_reward` | `pb_res_to_client` |
| 90503 | `req_pet_act_claim_likability_rewards` | 未路由 | protobuf / `pb_req_pet_act_claim_likability_rewards` | `pb_res_to_client` |
| 90504 | `req_pet_act_cure` | 未路由 | protobuf / `pb_req_pet_act_cure` | `pb_res_pet_act_cure` |
| 90505 | `req_pet_act_finish_cure` | 未路由 | protobuf / `pb_req_pet_act_cure` | `pb_res_pet_act_cure` |
| 90506 | `req_pet_rev_daily_vitality_rewards` | 未路由 | etf / `—` | `pb_rev_pet_vitality_award_ret` |
| 90507 | `req_pet_act_exchange` | 未路由 | etf / `—` | `pb_pet_exchange_ret` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-RADISHFARM：萝卜农场、事件、拜访与助力

协议模块：`RadishFarmCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“萝卜农场、事件、拜访与助力”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90801 | `req_radish_farm_start` | 未路由 | protobuf / `pb_radish_farm_normal_req` | `pb_radish_farm_normal_rsp` |
| 90802 | `req_radish_farm_event` | 未路由 | protobuf / `pb_radish_farm_normal_req` | `pb_radish_farm_normal_rsp` |
| 90803 | `req_radish_farm_cell_award` | 未路由 | protobuf / `pb_radish_farm_normal_req` | `pb_radish_farm_reward_rsp` |
| 90804 | `req_radish_farm_visit` | 未路由 | etf / `—` | `pb_radish_farm_visit_rsp` |
| 90805 | `req_radish_farm_help` | 未路由 | protobuf / `pb_radish_farm_help_req` | `pb_radish_farm_help_rsp` |
| 90806 | `req_radish_farm_select_gift` | 未路由 | protobuf / `pb_radish_farm_gift_select_req` | `pb_radish_farm_gift` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-EXPERIENCEACT：历练出发与领奖

协议模块：`ExperienceActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“历练出发与领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93801 | `req_experience_go` | 未路由 | protobuf / `pb_experience_go_req` | `pb_experience_go_rsp` |
| 93802 | `req_experience_award` | 未路由 | protobuf / `pb_experience_award_req` | `pb_experience_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-PUZZLEACT：拼图活动任务与进度

协议模块：`PuzzleActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“拼图活动任务与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102001 | `req_puzzle_act_finish_task` | 未路由 | protobuf / `pb_puzzle_act_req` | `pb_puzzle_act_back` |
| 102002 | `req_puzzle_act_progress_award` | 未路由 | protobuf / `pb_puzzle_act_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-TILESWAP：换块小游戏换轮

协议模块：`TileSwapCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“换块小游戏换轮”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102501 | `req_tile_swap_next_turn` | 未路由 | etf / `—` | `pb_tile_swap` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-MUSHROOMMONSTER：蘑菇怪开始、结束与领奖

协议模块：`MushroomMonsterCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“蘑菇怪开始、结束与领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102601 | `req_mushroom_start` | 未路由 | etf / `—` | `pb_mushroom_monster` |
| 102602 | `req_mushroom_end` | 未路由 | etf / `—` | `pb_mushroom_monster_end_rev` |
| 102603 | `req_mushroom_award` | 未路由 | etf / `—` | `pb_mushroom_monster_award_rev` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-GOPHERACT：打地鼠

协议模块：`GopherActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“打地鼠”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103201 | `req_beat_gopher` | 未路由 | unknown / `—` | `pb_beat_gopher_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-TOWERACT：爬塔活动前进、切换与任务

协议模块：`TowerActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“爬塔活动前进、切换与任务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104301 | `req_tower_act_step` | 未路由 | protobuf / `pb_tower_act_step_req` | `pb_tower_act_slot_rsp` |
| 104302 | `req_tower_act_switch` | 未路由 | protobuf / `pb_tower_act_switch_req` | `pb_tower_act_role` |
| 104303 | `req_tower_act_task` | 未路由 | protobuf / `pb_tower_act_task_req` | `pb_tower_act_task_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-SPIRITCOURTYARD：灵庭种植、土地、合成、委托协作与宴会

协议模块：`SpiritCourtyardCmd`。未路由 16；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“灵庭种植、土地、合成、委托协作与宴会”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105001 | `req_spirit_courtyard_tree_plant` | 未路由 | protobuf / `pb_req_spirit_courtyard_tree_plant` | `pb_rsp_spirit_courtyard_tree_plant` |
| 105002 | `req_spirit_courtyard_tree_get` | 未路由 | etf / `—` | `pb_rsp_spirit_courtyard_tree_get` |
| 105003 | `req_spirit_courtyard_add_land` | 未路由 | etf / `—` | `pb_rsp_spirit_courtyard_tree_get` |
| 105004 | `req_spirit_courtyard_tree_remove` | 未路由 | etf / `—` | `pb_rsp_spirit_courtyard_tree_plant` |
| 105005 | `req_spirit_courtyard_get_task_reward` | 未路由 | protobuf / `pb_req_spirit_courtyard_submit_entrust` | `pb_res_spirit_courtyard_submit_entrust` |
| 105006 | `req_spirit_courtyard_update_task` | 未路由 | etf / `—` | `pb_res_spirit_courtyard_update_task` |
| 105007 | `req_spirit_courtyard_publish_collaboration` | 未路由 | protobuf / `pb_req_spirit_courtyard_publish_collaboration` | `pb_res_spirit_courtyard_publish_collaboration` |
| 105008 | `req_spirit_courtyard_assist_entrust` | 未路由 | protobuf / `pb_req_spirit_courtyard_assist_entrust` | `pb_res_spirit_courtyard_assist_entrust` |
| 105009 | `req_spirit_courtyard_finish_guild_task` | 未路由 | protobuf / `pb_req_spirit_courtyard_finish_banquet` | `pb_rsp_spirit_courtyard_finish_banquet` |
| 105010 | `req_spirit_courtyard_tree_fruit_merge` | 未路由 | protobuf / `pb_req_spirit_courtyard_fruit_merge` | `pb_res_to_client` |
| 105011 | `req_spirit_courtyard_tree_change` | 未路由 | protobuf / `pb_req_spirit_courtyard_tree_plant` | `pb_rsp_spirit_courtyard_tree_get` |
| 105012 | `req_spirit_courtyard_refresh_role_info` | 未路由 | protobuf / `pb_req_spirit_courtyard_refresh_role_info` | `pb_res_spirit_courtyard_refresh_role_info` |
| 105013 | `req_spirit_courtyard_cancel_publish_collaboration` | 未路由 | protobuf / `pb_req_spirit_courtyard_cancel_collaboration` | `pb_res_spirit_courtyard_cancel_collaboration` |
| 105014 | `req_spirit_courtyard_intimacy_task_reward` | 未路由 | etf / `—` | `pb_spirit_courtyard_in_task_res` |
| 105015 | `req_spirit_courtyard_banquet_award` | 未路由 | etf / `—` | `pb_rsp_spirit_courtyard_banquet_award` |
| 105016 | `req_spirit_courtyard_use_item` | 未路由 | protobuf / `pb_req_spirit_courtyard_use_item` | `pb_rsp_spirit_courtyard_tree_get` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-TRIPLEMATCH：三消换块、重开、道具与关卡奖励

协议模块：`TripleMatchCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消换块、重开、道具与关卡奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 106001 | `req_triple_match_swap_tile` | 未路由 | protobuf / `pb_triple_match_swap_tile_req` | `pb_triple_match_swap_tile_rsp` |
| 106002 | `req_triple_match_restart` | 未路由 | protobuf / `pb_triple_match_restart_req` | `pb_triple_match_swap_tile_rsp` |
| 106003 | `req_triple_match_score_award` | 未路由 | protobuf / `pb_triple_match_score_award_req` | `pb_triple_match_score_award_rsp` |
| 106004 | `req_triple_match_use_item` | 未路由 | protobuf / `pb_triple_match_use_item_req` | `pb_triple_match_use_item_rsp` |
| 106005 | `req_triple_match_pass_stage_award` | 未路由 | protobuf / `pb_triple_match_rec_pass_stage_award_req` | `pb_triple_match_rec_pass_stage_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-MATCHINGGAMEACT：配对小游戏抽签、卡牌与奖励

协议模块：`MatchingGameActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“配对小游戏抽签、卡牌与奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107501 | `req_matching_game_act_luck` | 未路由 | protobuf / `pb_matching_game_act_luck_req` | `pb_role_matching_game_act_info` |
| 107502 | `req_matching_game_act_use_card` | 未路由 | etf / `—` | `pb_matching_game_act_use_card_rsp` |
| 107503 | `req_matching_game_award` | 未路由 | protobuf / `pb_matching_game_act_score_award_req` | `pb_matching_game_act_score_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-MONOPOLYACT：大富翁事件、战斗、援助、公会任务与补给

协议模块：`MonopolyActCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“大富翁事件、战斗、援助、公会任务与补给”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107801 | `req_monopoly_act_go` | 未路由 | protobuf / `pb_monopoly_act_go_req` | `pb_monopoly_act_go_back` |
| 107802 | `req_monopoly_act_finish_fight_event` | 未路由 | protobuf / `pb_monopoly_act_base_req` | `pb_monopoly_act_finish_order_back` |
| 107803 | `req_monopoly_act_get_live_award` | 未路由 | protobuf / `pb_monopoly_act_get_reward_req` | `pb_res_to_client` |
| 107804 | `req_monopoly_act_get_guild_task_award` | 未路由 | protobuf / `pb_monopoly_act_get_reward_req` | `pb_res_to_client` |
| 107805 | `req_monopoly_act_get_total_task_award` | 未路由 | protobuf / `pb_monopoly_act_get_reward_req` | `pb_res_to_client` |
| 107806 | `req_monopoly_act_get_supply` | 未路由 | protobuf / `pb_monopoly_act_get_reward_req` | `pb_res_to_client` |
| 107807 | `req_monopoly_act_fight_help` | 未路由 | protobuf / `pb_monopoly_act_base_req` | `pb_monopoly_act_send_order_back` |
| 107808 | `req_monopoly_act_get_guild_info` | 未路由 | etf / `—` | `pb_monopoly_act_get_guild_back` |
| 107809 | `req_monopoly_act_day_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 107810 | `req_monopoly_act_jump_fight` | 未路由 | protobuf / `pb_monopoly_act_fight_req` | `pb_monopoly_act_base_back` |
| 107811 | `req_monopoly_act_finish_firm` | 未路由 | protobuf / `pb_monopoly_act_finish_firm_req` | `pb_monopoly_act_finish_order_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-DREAMTRIALACT：梦境试炼抢夺与公会数据

协议模块：`DreamTrialActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“梦境试炼抢夺与公会数据”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 108001 | `req_dream_trial_query_rob` | 未路由 | protobuf / `pb_dream_trial_query_rob_req` | `pb_dream_trial_query_rob_rsp` |
| 108002 | `req_dream_trial_guild_info` | 未路由 | protobuf / `pb_dream_trial_guild_info_req` | `pb_dream_trial_guild_info_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-DIAMONDVEINACT：钻石矿脉地图、行动、战斗与公会排名

协议模块：`DiamondVeinActCmd`。未路由 9；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“钻石矿脉地图、行动、战斗与公会排名”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 109001 | `req_diamond_vein_act_get_map` | 未路由 | protobuf / `pb_diamond_vein_act_base_req` | `pb_diamond_vein_act_map_data` |
| 109002 | `req_diamond_vein_act_enter_map` | 未路由 | protobuf / `pb_diamond_vein_act_base_req` | `pb_diamond_vein_act_enter_rsp` |
| 109003 | `req_diamond_vein_act_award` | 未路由 | protobuf / `pb_diamond_vein_act_base_req` | `pb_diamond_vein_act_get_award_rsp` |
| 109004 | `req_diamond_vein_act_buy_attack` | 未路由 | protobuf / `pb_diamond_vein_act_base_req` | `pb_diamond_vein_act_role_res_rsp` |
| 109005 | `req_diamond_vein_act_buy_action` | 未路由 | protobuf / `pb_diamond_vein_act_base_req` | `pb_diamond_vein_act_role_res_rsp` |
| 109006 | `req_diamond_vein_act_guild_focus` | 未路由 | protobuf / `pb_diamond_vein_act_guild_focus_req` | `pb_diamond_vein_act_guild_rsp` |
| 109007 | `req_diamond_vein_act_guild_rank_info` | 未路由 | etf / `—` | `pb_diamond_vein_act_guild_rank_player_info` |
| 109008 | `req_diamond_vein_act_get_fight_record` | 未路由 | etf / `—` | `pb_diamond_vein_act_fight_reports_rsp` |
| 109009 | `req_diamond_vein_act_get_guild_info` | 未路由 | etf / `—` | `pb_diamond_vein_act_guild_data` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-SOURCEPOINT：源点变换、合成与任务

协议模块：`SourcePointCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“源点变换、合成与任务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110101 | `req_source_point_change` | 未路由 | protobuf / `pb_source_point_change_req` | `pb_source_point_change_rsp` |
| 110102 | `req_source_point_combine` | 未路由 | protobuf / `pb_source_point_combine_req` | `pb_source_point_combine_rsp` |
| 110103 | `req_source_point_task_award` | 未路由 | protobuf / `pb_source_point_task_req` | `pb_source_point_task_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-FISHINGACT：钓鱼剩余鱼竿、图鉴、奖励、记录与排名

协议模块：`FishingActCmd`。未路由 0；明确拒绝 5；空结构/固定值/仅应答 2；有处理路径，需保持回归 4。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“钓鱼剩余鱼竿、图鉴、奖励、记录与排名”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[activity-read-service.mjs](../../../personal-server/game/activity-read-service.mjs)。

已确认的附加缺口：

- 110301/110302/110305/110311 抛竿、收鱼、开图、批量收鱼已有实现；图鉴奖、鱼竿更换、等级奖、排名奖和进度奖仍明确拒绝。
- 110303 榜单和 110308 记录固定为空；天气、鱼竿、尺寸/概率公式对齐与真实榜结算需要随玩法补全。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110303 | `req_fishing_act_get_fish_top` | 空结构/固定值/仅应答：钓鱼榜为空 | etf / `—` | `pb_fishing_act_get_top_rsp` |
| 110304 | `req_fishing_act_book_award` | 明确拒绝：钓鱼图鉴领奖 | protobuf / `pb_fishing_act_common_list_req` | `pb_fishing_act_data_res` |
| 110306 | `req_fishing_act_change_rod` | 明确拒绝：钓鱼更换鱼竿 | protobuf / `pb_fishing_act_common_req` | `—` |
| 110307 | `req_fishing_act_level_award` | 明确拒绝：钓鱼等级领奖 | protobuf / `pb_fishing_act_common_req` | `pb_fishing_act_data_res` |
| 110308 | `req_fishing_act_get_record` | 空结构/固定值/仅应答：钓鱼记录为空 | etf / `—` | `pb_fishing_act_get_record_rsp` |
| 110309 | `req_fishing_act_up_rank_award` | 明确拒绝：钓鱼上榜奖励 | etf / `—` | `pb_fishing_act_data_res` |
| 110310 | `req_fishing_act_progress_award` | 明确拒绝：钓鱼进度领奖 | protobuf / `pb_fishing_act_common_list_req` | `pb_fishing_act_data_res` |

已有处理路径（必须回归）：`110301 req_fishing_act_go_fish`、`110302 req_fishing_act_get_fish`、`110305 req_fishing_act_unlock_map`、`110311 req_fishing_act_batch_get_fish`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-ALBUM：家具、套装激活与套装奖励

协议模块：`AlbumCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“家具、套装激活与套装奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110401 | `req_furniture_active` | 未路由 | etf / `—` | `pb_homeland_album_role` |
| 110402 | `req_furniture_suit_active` | 未路由 | etf / `—` | `pb_homeland_album_role` |
| 110403 | `req_furniture_suit_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-HOMELAND：家园任务、拜访、点赞、升级、清洁与替换

协议模块：`HomelandCmd`。未路由 8；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“家园任务、拜访、点赞、升级、清洁与替换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110904 | `req_homeland_task_award` | 未路由 | etf / `—` | `pb_homeland_task_finish_rsp` |
| 110905 | `req_homeland_familiar_list` | 未路由 | etf / `—` | `pb_homeland_familiar_info_rsp` |
| 110906 | `req_homeland_visit_list` | 未路由 | etf / `—` | `pb_homeland_visit_record_list_rsp` |
| 110907 | `req_homeland_visit` | 未路由 | etf / `—` | `pb_homeland_visit_record_rsp` |
| 110908 | `req_homeland_like` | 未路由 | etf / `—` | `pb_homeland_like_rsp` |
| 110911 | `req_homeland_level_up` | 未路由 | etf / `—` | `pb_homeland_level_up_rsp` |
| 110912 | `req_homeland_clean_room` | 未路由 | etf / `—` | `—` |
| 110913 | `req_homeland_replace` | 未路由 | protobuf / `pb_homeland_replace_req` | `pb_homeland_depot` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-BAKINGACT：烘焙合成、订单、蛋糕、事件、道具与整理

协议模块：`BakingActCmd`。未路由 15；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“烘焙合成、订单、蛋糕、事件、道具与整理”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 111001 | `req_baking_rec_lv_award` | 未路由 | protobuf / `pb_baking_rec_lv_award_req` | `pb_baking_rec_lv_award_rsp` |
| 111002 | `req_baking_swap` | 未路由 | protobuf / `pb_baking_swap_req` | `pb_baking_swap_rsp` |
| 111003 | `req_baking_synthesize` | 未路由 | protobuf / `pb_baking_synthesize_req` | `pb_baking_synthesize_rsp` |
| 111004 | `req_baking_batch_synthesize` | 未路由 | protobuf / `pb_baking_batch_synthesize_req` | `pb_baking_batch_synthesize_rsp` |
| 111005 | `req_baking_make_cake` | 未路由 | protobuf / `pb_baking_make_cake_req` | `pb_baking_make_cake_rsp` |
| 111006 | `req_baking_give_up_order` | 未路由 | protobuf / `pb_baking_give_up_order_req` | `pb_baking_give_up_order_rsp` |
| 111007 | `req_baking_use_item` | 未路由 | protobuf / `pb_baking_use_item_req` | `pb_baking_use_item_rsp` |
| 111008 | `req_baking_use_cheat_item` | 未路由 | protobuf / `pb_baking_use_cheat_item_req` | `pb_baking_use_cheat_item_rsp` |
| 111009 | `req_baking_yeast_click` | 未路由 | protobuf / `pb_baking_yeast_click_req` | `pb_baking_yeast_click_rsp` |
| 111010 | `req_get_act_data` | 未路由 | protobuf / `pb_baking_get_new_act_data_req` | `pb_baking_get_new_act_data_rsp` |
| 111011 | `req_baking_handle_event` | 未路由 | protobuf / `pb_baking_handle_event_req` | `pb_baking_handle_event_rsp` |
| 111012 | `req_baking_submit_order` | 未路由 | protobuf / `pb_baking_submit_order_req` | `pb_baking_submit_order_rsp` |
| 111013 | `req_baking_refresh_time_limit_order` | 未路由 | protobuf / `pb_baking_refresh_time_limit_order_req` | `pb_baking_refresh_time_limit_order_rsp` |
| 111014 | `req_baking_one_key_sort` | 未路由 | protobuf / `pb_baking_one_key_sort_req` | `pb_baking_one_key_sort_rsp` |
| 111015 | `req_baking_select_batch_synthesize_model` | 未路由 | protobuf / `pb_baking_select_batch_synthesize_model_req` | `pb_baking_select_batch_synthesize_model_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PLAY-HELPUPACT：助力升阶/升超凡活动

协议模块：`HelpUpActCmd`。未路由 0；明确拒绝 3；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“助力升阶/升超凡活动”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[activity-read-service.mjs](../../../personal-server/game/activity-read-service.mjs)。

已确认的附加缺口：

- 116001/116002/116003 始终拒绝；116004 固定零。补活动登录块、助力关系/次数、任务、阶段与奖励，不把“超凡冒险者”UI 猜测当协议已确认。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 116001 | `req_help_up_task_reward` | 明确拒绝：助力任务领奖 | protobuf / `pb_help_up_task_reward_req` | `pb_help_up_task_reward_rsp` |
| 116002 | `req_help_up_stage_award` | 明确拒绝：助力阶段领奖 | protobuf / `pb_help_up_stage_award_req` | `pb_help_up_stage_award_rsp` |
| 116003 | `req_help_up_help` | 明确拒绝：发起助力 | protobuf / `pb_help_up_help_req` | `pb_help_up_help_rsp` |
| 116004 | `req_help_up_get_times` | 空结构/固定值/仅应答：助力次数固定为零 | protobuf / `pb_help_up_get_times_req` | `pb_help_up_get_times_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
