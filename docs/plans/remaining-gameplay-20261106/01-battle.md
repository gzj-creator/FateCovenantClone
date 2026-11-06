# 战斗、副本、竞技与排行榜

本分区 33 个模块任务，219 条未路由/明确拒绝/占位命令。优先级：P1/P2。

共同依赖：CORE-BATTLE、CORE-ATTR；竞技另依赖 BATTLE-RANK 和 SOC-FRIEND/SOC-GUILD 的相应身份数据。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## BATTLE-FIGHT：通用战斗与报告分享

协议模块：`FightCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 6。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用战斗与报告分享”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[mission-fight-service.mjs](../../../personal-server/game/mission-fight-service.mjs)。

已确认的附加缺口：

- 201 只接受普通主线战斗；精英实战、活动试炼、PVP、BOSS、多波次/多队的各自请求、规则、结算与报告未接通。
- 203/204/213 仅保留最近一场报告；持久化历史、按 ID 查询、跨战斗类型与分享未完成。
- 英雄技能主循环已在 2026-11-06 接通，不再把“完全未接技能库”列入待做；剩余见 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 205 | `share_report` | 未路由 | protobuf / `pb_share_report` | `—` |

已有处理路径（必须回归）：`201 fight_start`、`202 fight_exit`、`203 get_fight_report`、`204 get_fight_report_battle`、`207 fight_settlement`、`213 get_fight_report_full`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-REPORT：通关记录与点赞

协议模块：`ReportCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通关记录与点赞”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 211 | `req_pass_record` | 未路由 | protobuf / `pb_pass_record_req` | `pb_pass_record` |
| 212 | `req_pass_record_vote` | 未路由 | protobuf / `pb_pass_record_vote_req` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-PEAKTOWER：巅峰塔/爬塔

协议模块：`PeakTowerCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“巅峰塔/爬塔”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 1103 | `peak_tower_sweeps` | 未路由 | protobuf / `peak_tower_sweeps_req` | `peak_tower_sweep_back` |
| 1104 | `peak_tower_every_award` | 未路由 | etf / `—` | `peak_tower_back` |
| 1109 | `peak_tower_buy_goods` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1110 | `peak_tower_receive_achievement` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1111 | `peak_tower_rev_tower_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 1112 | `peak_tower_avg_layer` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-RANK：真实排行榜

协议模块：`RankCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 9；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“真实排行榜”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[rank-service.mjs](../../../personal-server/game/rank-service.mjs)。

已确认的附加缺口：

- 2009 已可保存气泡；其余九条已路由读接口没有真实排名。补实时聚合、分组/跨服榜、历史榜、赛季冻结、同分规则与最终邮件奖励。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 2000 | `get_rank_data` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_to_client` |
| 2001 | `get_rank_info` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_info` |
| 2002 | `get_rank_top_data` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_to_client` |
| 2003 | `batch_get_hero_rank` | 未路由 | etf / `—` | `pb_rev_rank` |
| 2004 | `batch_get_player_hero_rank` | 未路由 | protobuf / `pb_batch_seq_rank` | `pb_batch_rev_rank` |
| 2005 | `get_rank_cross_top` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `pb_rank_cross_group_top` |
| 2006 | `batch_get_personal_rank_first` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_to_client` |
| 2007 | `get_appoint_rank` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_info` |
| 2008 | `get_rank_backup` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_to_client` |
| 2010 | `req_batch_get_rank` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `pb_rev_rank` |
| 2011 | `req_batch_get_rank_backup` | 空结构/固定值/仅应答：空榜/未上榜占位，未聚合真实排名 | etf / `—` | `rank_to_client_list` |

已有处理路径（必须回归）：`2009 update_rank_bubble`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-SWAPARENA：换位/多队竞技场

协议模块：`SwapArenaCmd`。未路由 10；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“换位/多队竞技场”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 4031 | `req_swap_arena_get_match` | 未路由 | etf / `—` | `pb_swap_arena_match_toc` |
| 4032 | `req_swap_arena_refresh_match` | 未路由 | etf / `—` | `pb_swap_arena_match_toc` |
| 4033 | `req_swap_arena_buy_fight_times` | 未路由 | etf / `—` | `pb_res_to_client` |
| 4034 | `req_swap_arena_more_fight` | 未路由 | etf / `—` | `pb_res_to_client` |
| 4035 | `req_swap_arena_fight_report` | 未路由 | etf / `—` | `pb_swap_arena_fight_report_data` |
| 4036 | `req_swap_arena_read_rank_change` | 未路由 | etf / `—` | `—` |
| 4037 | `req_swap_arena_set_read_report_time` | 未路由 | etf / `—` | `—` |
| 4038 | `req_swap_arena_rank_award` | 未路由 | protobuf / `pb_swap_arena_rank_award_req` | `pb_res_to_client` |
| 4039 | `req_swap_arena_update_cross_stage` | 未路由 | etf / `—` | `pb_swap_arena_update_cross` |
| 4040 | `req_swap_arena_init_double_team` | 未路由 | etf / `—` | `pb_lineup` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-REDCLIFF：RedCliff 副本

协议模块：`RedCliffCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“RedCliff 副本”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 55001 | `req_red_cliff_box` | 未路由 | etf / `—` | `pb_red_cliff_box_result` |
| 55002 | `req_red_cliff_buff` | 未路由 | etf / `—` | `pb_red_cliff_data_to_client` |
| 55003 | `req_red_cliff_reset` | 未路由 | etf / `—` | `pb_red_cliff_data_to_client` |
| 55004 | `req_red_cliff_refresh` | 未路由 | etf / `—` | `pb_red_cliff_data_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-GENERALDUNGEON：通用地牢副本

协议模块：`GeneralDungeonCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用地牢副本”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 78101 | `req_dungeon_evt_execute` | 未路由 | protobuf / `pb_dungeon_event_exe` | `pb_dungeon_event_res` |
| 78102 | `req_dungeon_data` | 未路由 | etf / `—` | `—` |
| 78103 | `req_dungeon_enter_level` | 未路由 | protobuf / `pb_enter_dungeon_level` | `pb_dungeon_level_change` |
| 78104 | `req_dungeon_close_level` | 未路由 | etf / `—` | `pb_dungeon_level_change` |
| 78105 | `req_dungeon_evt_activate` | 未路由 | protobuf / `pb_dungeon_event_active` | `pb_dungeon_event_list` |
| 78106 | `req_dungeon_sync_map` | 未路由 | protobuf / `pb_dungeon_sync_map` | `—` |
| 78107 | `req_dungeon_use_prop` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-ARENACONTEST：竞技大赛、竞猜与观战

协议模块：`ArenaContestCmd`。未路由 15；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“竞技大赛、竞猜与观战”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 83301 | `req_arena_contest_enter` | 未路由 | etf / `—` | `—` |
| 83302 | `req_arena_contest_leave` | 未路由 | etf / `—` | `—` |
| 83303 | `req_arena_contest_sign_up` | 未路由 | etf / `—` | `pb_arena_contest_role` |
| 83304 | `req_arena_contest_guess` | 未路由 | protobuf / `pb_arena_contest_guess_req` | `pb_arena_contest_guess_rsp` |
| 83305 | `req_arena_contest_rev_fight_award` | 未路由 | etf / `—` | `pb_arena_contest_fight_award_back` |
| 83306 | `req_arena_contest_get_guess_info` | 未路由 | etf / `—` | `pb_arena_contest_guess_info` |
| 83307 | `req_arena_contest_get_role_fight_report` | 未路由 | etf / `—` | `pb_arena_contest_fight_report_role` |
| 83308 | `req_arena_contest_get_final_info` | 未路由 | etf / `—` | `pb_arena_contest_final_match_info` |
| 83309 | `req_arena_contest_get_final_power_info` | 未路由 | etf / `—` | `pb_arena_contest_role_power_ret` |
| 83310 | `req_arena_contest_congratulate` | 未路由 | etf / `—` | `pb_arena_contest_congratulate_back` |
| 83311 | `req_arena_contest_get_top_roles` | 未路由 | etf / `—` | `pb_arena_contest_top_info` |
| 83312 | `req_arena_contest_watch_fight` | 未路由 | etf / `—` | `—` |
| 83313 | `req_arena_contest_rev_task_award` | 未路由 | etf / `—` | `pb_arena_contest_task_award_back` |
| 83314 | `req_arena_contest_rev_guess_award` | 未路由 | protobuf / `pb_arena_contest_guess_award_req` | `pb_arena_contest_guess_award_rsp` |
| 83315 | `req_arena_contest_watch_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-HUNTERARENA：猎人竞技场

协议模块：`HunterArenaCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“猎人竞技场”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84001 | `req_hunter_arena_clear_change` | 未路由 | etf / `—` | `—` |
| 84002 | `req_hunter_arena_day_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 84003 | `req_hunter_arena_season_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 84004 | `req_hunter_arena_palace` | 未路由 | etf / `—` | `pb_hunter_arena_palace` |
| 84005 | `req_hunter_arena_fight` | 未路由 | etf / `—` | `pb_fight_response` |
| 84006 | `req_hunter_arena_set_ignore` | 未路由 | etf / `—` | `—` |
| 84007 | `req_hunter_arena_set_read_report_time` | 未路由 | etf / `—` | `—` |
| 84008 | `req_hunter_arena_history_rank` | 未路由 | etf / `—` | `pb_hunter_arena_history_rank_rsp` |
| 84009 | `req_hunter_arena_report_lock` | 未路由 | protobuf / `pb_hunter_arena_set_report_lock` | `—` |
| 84010 | `req_hunter_arena_set_award_tips` | 未路由 | etf / `—` | `—` |
| 84011 | `req_hunter_arena_enter_form` | 未路由 | etf / `—` | `pb_role_hunter_arena` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-MARTIALCLUB：武馆组队挑战

协议模块：`MartialClubCmd`。未路由 24；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“武馆组队挑战”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84401 | `req_martial_club_first_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 84404 | `req_martial_club_create_team` | 未路由 | protobuf / `pb_martial_club_team_create_req` | `pb_martial_club_team` |
| 84405 | `req_martial_club_add_bot` | 未路由 | etf / `—` | `pb_martial_club_team` |
| 84406 | `req_martial_club_set_help` | 未路由 | etf / `—` | `pb_martial_club_team` |
| 84407 | `req_martial_club_join_team` | 未路由 | etf / `—` | `pb_martial_club_team` |
| 84408 | `req_martial_club_exit_team` | 未路由 | etf / `—` | `pb_martial_club_team` |
| 84409 | `req_martial_club_team_info` | 未路由 | etf / `—` | `pb_martial_club_team_rsp` |
| 84410 | `req_martial_club_set_team_info` | 未路由 | protobuf / `pb_martial_club_set_team_info_req` | `pb_martial_club_team` |
| 84411 | `req_martial_club_set_ready` | 未路由 | etf / `—` | `pb_martial_club_team` |
| 84412 | `req_martial_club_invite` | 未路由 | etf / `—` | `—` |
| 84413 | `req_martial_club_invite_all` | 未路由 | etf / `—` | `—` |
| 84414 | `req_martial_club_set_member_pos` | 未路由 | protobuf / `pb_martial_club_set_member_pos_req` | `pb_martial_club_team` |
| 84415 | `req_martial_club_pass_count` | 未路由 | etf / `—` | `—` |
| 84416 | `req_martial_club_team_kick` | 未路由 | etf / `—` | `pb_martial_club_team` |
| 84417 | `req_martial_club_team_fight` | 未路由 | etf / `—` | `pb_martial_club_team_fight_rsp` |
| 84418 | `req_martial_club_bot_list` | 未路由 | etf / `—` | `—` |
| 84419 | `req_martial_club_give_up` | 未路由 | etf / `—` | `—` |
| 84420 | `req_martial_club_settlement` | 未路由 | etf / `—` | `pb_martial_club_team_settle_rsp` |
| 84421 | `req_martial_club_team_members` | 未路由 | protobuf / `pb_martial_club_members_req` | `pb_martial_club_members_rsp` |
| 84422 | `req_martial_club_team_skip` | 未路由 | etf / `—` | `—` |
| 84423 | `req_martial_club_employ_list` | 未路由 | etf / `—` | `pb_martial_club_employ_rsp` |
| 84424 | `req_martial_club_employ_enter` | 未路由 | etf / `—` | `—` |
| 84425 | `req_martial_club_match` | 未路由 | protobuf / `pb_martial_club_match_req` | `pb_martial_club_match_rsp` |
| 84426 | `req_martial_club_relic` | 未路由 | protobuf / `pb_martial_club_relic_req` | `pb_martial_club_relic_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-MARTIALCLUBACT：武馆活动奖励

协议模块：`MartialClubActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“武馆活动奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84431 | `req_martial_act_pass_team_award` | 未路由 | etf / `—` | `pb_martial_club_act_pass_award_rsp` |
| 84432 | `req_martial_act_server_award` | 未路由 | etf / `—` | `pb_martial_club_act_server_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-ELITEMISSION：精英任务的战斗闭环

协议模块：`EliteMissionCmd`。未路由 0；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 3。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“精英任务的战斗闭环”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[elite-mission-service.mjs](../../../personal-server/game/elite-mission-service.mjs)。

已确认的附加缺口：

- 87001/87002/87003 已有进度和奖励事务；不能重做为占位。精英专属开战、服务端战果证明及结算到进度/领奖资格的闭环仍缺。

本任务没有新增数字命令：需要补齐上面的运行集成缺口，而不是重复添加已存在路由。

已有处理路径（必须回归）：`87001 req_elite_mission_custom`、`87002 req_elite_mission_box_award`、`87003 req_elite_mission_chapter_pass`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-SOULTRIAL：灵魂试炼抽奖

协议模块：`SoulTrialCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“灵魂试炼抽奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87104 | `req_soul_trial_draw_award` | 未路由 | etf / `—` | `pb_soul_trial_draw_back` |
| 87105 | `req_soul_trial_rev_draw_award` | 未路由 | etf / `—` | `pb_soul_trial_rev_draw_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-TOURNAMENT：巅峰对决/锦标赛

协议模块：`TournamentCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“巅峰对决/锦标赛”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88501 | `req_tournament_clear_change` | 未路由 | etf / `—` | `—` |
| 88502 | `req_tournament_day_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 88503 | `req_tournament_season_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 88504 | `req_tournament_palace` | 未路由 | etf / `—` | `pb_match_pvp_palace` |
| 88505 | `req_tournament_fight` | 未路由 | etf / `—` | `pb_fight_response` |
| 88506 | `req_tournament_set_ignore` | 未路由 | etf / `—` | `—` |
| 88507 | `req_tournament_set_read_report_time` | 未路由 | etf / `—` | `—` |
| 88508 | `req_tournament_history_rank` | 未路由 | etf / `—` | `pb_hunter_arena_history_rank_rsp` |
| 88509 | `req_tournament_report_lock` | 未路由 | protobuf / `pb_match_pvp_set_report_lock` | `—` |
| 88510 | `req_tournament_start_promote` | 未路由 | etf / `—` | `pb_tournament_role` |
| 88511 | `req_tournament_enter_form` | 未路由 | etf / `—` | `pb_tournament_role` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-SCARLETTRIAL：猩红试炼

协议模块：`ScarletTrialCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“猩红试炼”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89101 | `req_scarlet_task_award` | 未路由 | etf / `—` | `pb_scarlet_trial_award_back` |
| 89102 | `req_scarlet_select_stone` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-STARMISSION：星级关卡、章节奖励与技能

协议模块：`StarMissionCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“星级关卡、章节奖励与技能”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89601 | `req_star_mission_award` | 未路由 | etf / `—` | `—` |
| 89602 | `req_star_mission_chapter_award` | 未路由 | protobuf / `pb_star_mission_chapter_award_req` | `pb_star_mission_chapter_award_rsp` |
| 89603 | `req_star_mission_skill` | 未路由 | protobuf / `pb_star_mission_skill_req` | `pb_res_to_client` |
| 89604 | `req_star_mission_skill_reset` | 未路由 | protobuf / `pb_star_mission_skill_reset_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-COMMONMAP：通用地图节点与扫荡

协议模块：`CommonMapCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用地图节点与扫荡”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90601 | `req_common_map_init` | 未路由 | etf / `—` | `pb_common_map_init_back` |
| 90602 | `req_common_map_node_trigger` | 未路由 | protobuf / `pb_common_map_node_trigger` | `pb_common_map_node_trigger_back` |
| 90603 | `req_common_map_sweep` | 未路由 | protobuf / `pb_common_map_sweep_trigger` | `pb_common_map_sweep_trigger_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-FAMEHALL：名人堂挑战与掉落选择

协议模块：`FameHallCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“名人堂挑战与掉落选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91101 | `req_fame_hall_enter_difficult` | 未路由 | protobuf / `pb_fame_hall_enter_difficult` | `pb_fame_hall_enter_difficult_rsp` |
| 91102 | `req_fame_hall_choose_drop` | 未路由 | protobuf / `pb_fame_hall_choose_drop_req` | `pb_fame_hall_choose_drop_rsp` |
| 91103 | `req_fame_hall_stage_award` | 未路由 | protobuf / `pb_fame_hall_reward_req` | `pb_fame_hall_reward_rsp` |
| 91104 | `req_fame_hall_edit_artifact` | 未路由 | protobuf / `pb_fame_hall_artifact_req` | `pb_fame_hall_line_artifact` |
| 91105 | `req_fame_hall_reset` | 未路由 | etf / `—` | `pb_fame_hall_reset_rsp` |
| 91106 | `req_fame_hall_skip_choose` | 未路由 | etf / `—` | `pb_fame_hall_role` |
| 91107 | `req_fame_hall_terminate` | 未路由 | etf / `—` | `pb_fame_hall_role` |
| 91108 | `req_fame_hall_sweep` | 未路由 | etf / `—` | `pb_fame_hall_sweep_rsp` |
| 91109 | `req_fame_hall_data` | 未路由 | etf / `—` | `pb_fame_hall_role` |
| 91110 | `req_fame_hall_client_show_tag` | 未路由 | etf / `—` | `—` |
| 91111 | `req_fame_hall_reissue_stage_award` | 未路由 | etf / `—` | `pb_fame_hall_reissue_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-WORLDBOSS：世界 BOSS

协议模块：`WorldBossCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“世界 BOSS”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91801 | `req_world_boss_enter_map` | 未路由 | etf / `—` | `pb_world_boss_server` |
| 91802 | `req_world_boss_leave_map` | 未路由 | etf / `—` | `—` |
| 91803 | `req_world_boss_receive` | 未路由 | etf / `—` | `pb_world_boss_receive_kill_back` |
| 91804 | `req_world_boss_history_rank` | 未路由 | etf / `—` | `pb_world_boss_history_rank` |
| 91805 | `req_world_boss_receive_achievement` | 未路由 | protobuf / `pb_world_boss_achieve_reward_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-PITLORD：PitLord 挑战、排名与补发

协议模块：`PitLordCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“PitLord 挑战、排名与补发”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92801 | `req_pit_lord_rank_award` | 未路由 | etf / `—` | `pb_pit_lord_rank_award_rsp` |
| 92802 | `req_pit_lord_history_rank_list` | 未路由 | etf / `—` | `pb_pit_lord_history_rank_list` |
| 92803 | `req_pit_lord_reissue_rank_award` | 未路由 | etf / `—` | `pb_pit_lord_rank_award_rsp` |
| 92804 | `req_pit_lord_free_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-CAMPTOWER：阵营塔

协议模块：`CampTowerCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“阵营塔”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93601 | `req_camp_tower_cross_award` | 未路由 | protobuf / `pb_camp_tower_cross_award_req` | `pb_camp_tower_cross_award_rsp` |
| 93602 | `req_camp_tower_first_award` | 未路由 | protobuf / `pb_camp_tower_first_award_req` | `pb_camp_tower_first_award_rsp` |
| 93603 | `req_camp_tower_get_first_pass_list` | 未路由 | etf / `—` | `pb_camp_tower_get_first_pass_list_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-TOWERDEFENSE：塔防驻守与轮次奖励

协议模块：`TowerDefenseCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“塔防驻守与轮次奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 97601 | `req_tower_defense_garrison` | 未路由 | protobuf / `pb_tower_defense_garrison_req` | `pb_tower_defense` |
| 97602 | `req_tower_defense_turn_over` | 未路由 | etf / `—` | `pb_tower_defense` |
| 97603 | `req_tower_defense_award` | 未路由 | etf / `—` | `pb_tower_defense_award_rsp` |
| 97604 | `req_tower_defense_turns_award` | 未路由 | etf / `—` | `pb_tower_defense_award_rsp` |
| 97605 | `req_tower_defense_look_award` | 未路由 | etf / `—` | `pb_tower_defense_look_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-TOPARENA：巅峰竞技、半决赛/决赛与竞猜

协议模块：`TopArenaCmd`。未路由 18；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“巅峰竞技、半决赛/决赛与竞猜”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98500 | `req_top_arena_pre_favorite` | 未路由 | etf / `—` | `pb_top_arena_favorite_rsp` |
| 98505 | `req_top_arena_get_rank_reward` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98526 | `req_top_arena_semi_server_help` | 未路由 | protobuf / `pb_top_arena_server_help_req` | `pb_top_arena_server_help_rsp` |
| 98527 | `req_top_arena_semi_get_server_help_reward` | 未路由 | protobuf / `pb_top_arena_server_help_reward_req` | `pb_top_arena_server_help_rsp` |
| 98532 | `req_top_arena_semi_get_server_help_res` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98560 | `req_top_arena_final_attack` | 未路由 | protobuf / `pb_top_arena_attack_req` | `pb_top_arena_attack_rsp` |
| 98561 | `req_top_arena_final_guess` | 未路由 | protobuf / `pb_top_arena_guess_req` | `pb_top_arena_guess` |
| 98562 | `req_top_arena_final_battle_record` | 未路由 | protobuf / `pb_get_fight_report` | `pb_fight_report_res` |
| 98563 | `req_top_arena_final_get_rank_reward` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98564 | `req_top_arena_final_get_server_rank` | 未路由 | etf / `—` | `pb_top_arena_get_server_rank_rsp` |
| 98565 | `req_top_arena_final_join` | 未路由 | etf / `—` | `pb_top_arena_semi_data` |
| 98580 | `req_top_arena_get_history` | 未路由 | protobuf / `pb_top_arena_winner_history_req` | `pb_top_arena_winner_history_rsp` |
| 98581 | `req_top_arena_set_declaration` | 未路由 | etf / `—` | `pb_top_arena_history_win_info` |
| 98582 | `req_top_arena_vote` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98583 | `req_top_arena_get_server_help` | 未路由 | etf / `—` | `pb_top_arena_server_help_info_rsp` |
| 98590 | `req_top_arena_enter` | 未路由 | etf / `—` | `pb_top_arena_enter_rsp` |
| 98601 | `req_top_arena_publicity_server_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98602 | `req_top_arena_server_max_rank_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-PLAYMATCH：即时匹配与取消

协议模块：`PlayMatchCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“即时匹配与取消”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98900 | `req_play_match_start` | 未路由 | etf / `—` | `—` |
| 98901 | `req_play_match_cancel` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-OVERALLPVP：综合 PVP、淘汰赛与竞猜

协议模块：`OverallPvpCmd`。未路由 30；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“综合 PVP、淘汰赛与竞猜”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101101 | `req_overall_pvp_elms_buy_count` | 未路由 | etf / `—` | `pb_overall_pvp_elms_buy_count_back` |
| 101102 | `req_overall_pvp_rev_day_task_award` | 未路由 | etf / `—` | `pb_overall_pvp_rev_task_award_back` |
| 101103 | `req_overall_pvp_rev_period_task_award` | 未路由 | etf / `—` | `pb_overall_pvp_rev_task_award_back` |
| 101104 | `req_overall_pvp_elms_match` | 未路由 | etf / `—` | `pb_overall_pvp_elms_match_back` |
| 101105 | `req_overall_pvp_prelims_match` | 未路由 | etf / `—` | `pb_overall_pvp_prelims_refresh_opponent_back` |
| 101106 | `req_overall_pvp_prelims_buy_times` | 未路由 | etf / `—` | `pb_overall_pvp_buy_times_back` |
| 101107 | `req_overall_pvp_elms_sweep` | 未路由 | etf / `—` | `pb_overall_pvp_elms_buy_count_back` |
| 101108 | `req_overall_pvp_preview_reward` | 未路由 | etf / `—` | `pb_res_to_client` |
| 101109 | `req_overall_pvp_team_num_reward` | 未路由 | etf / `—` | `pb_overall_pvp_team_num_award_back` |
| 101110 | `req_overall_pvp_prelims_special_match` | 未路由 | etf / `—` | `pb_overall_pvp_prelims_special_match_back` |
| 101111 | `req_overall_pvp_report_person` | 未路由 | etf / `—` | `pb_overall_pvp_report_obj` |
| 101112 | `req_overall_pvp_report_top` | 未路由 | etf / `—` | `pb_overall_pvp_report_obj` |
| 101113 | `req_overall_pvp_elms_clear_group_dirty` | 未路由 | etf / `—` | `—` |
| 101114 | `req_overall_pvp_elms_clear_final_dirty` | 未路由 | etf / `—` | `—` |
| 101115 | `req_overall_pvp_enter_view` | 未路由 | etf / `—` | `—` |
| 101116 | `req_overall_pvp_exit_view` | 未路由 | etf / `—` | `—` |
| 101117 | `req_overall_pvp_elms_clear_fail_report` | 未路由 | etf / `—` | `—` |
| 101118 | `req_overall_pvp_scroll` | 未路由 | etf / `—` | `pb_overall_pvp_scroll_list` |
| 101119 | `req_overall_pvp_final_record` | 未路由 | etf / `—` | `pb_overall_final_record_back` |
| 101120 | `req_overall_pvp_final_watch_award` | 未路由 | etf / `—` | `pb_receive_watch_award_back` |
| 101121 | `req_overall_pvp_rev_sign_task_award` | 未路由 | etf / `—` | `pb_overall_pvp_rev_task_award_back` |
| 101122 | `req_overall_pvp_get_info` | 未路由 | etf / `—` | `pb_overall_pvp_get_info` |
| 101123 | `req_overall_pvp_try_init_lineup` | 未路由 | etf / `—` | `pb_lineup` |
| 101124 | `req_overall_pvp_show_reward` | 未路由 | etf / `—` | `pb_res_to_client` |
| 101125 | `req_overall_pvp_fight_guess` | 未路由 | protobuf / `pb_overall_pvp_fight_guess_req` | `pb_overall_pvp_guess_type` |
| 101126 | `req_overall_pvp_rank_guess` | 未路由 | protobuf / `pb_overall_pvp_rank_guess_req` | `pb_overall_pvp_guess_type` |
| 101127 | `req_overall_pvp_fight_guess_reward` | 未路由 | protobuf / `pb_overall_pvp_guess_req` | `pb_overall_pvp_guess_award_back` |
| 101128 | `req_overall_pvp_rank_guess_reward` | 未路由 | etf / `—` | `pb_overall_pvp_guess_award_back` |
| 101129 | `req_overall_pvp_rank_guess_num` | 未路由 | etf / `—` | `pb_overall_pvp_rank_guess_num_list` |
| 101130 | `req_overall_pvp_history_data` | 未路由 | etf / `—` | `pb_overall_pvp_history_version_list` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-DESTINYPVE：命运 PVE 分层挑战

协议模块：`DestinyPveCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“命运 PVE 分层挑战”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104701 | `req_destiny_pve_fight` | 未路由 | protobuf / `pb_destiny_pve_fight_req` | `pb_destiny_pve_fight_rsq`（定义缺失） |
| 104702 | `req_destiny_pve_layer_info` | 未路由 | protobuf / `pb_destiny_pve_layer_info_req` | `pb_destiny_pve_layer_info_rsq` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-BATTLETRIMATCHHERO：三消战斗英雄升级升星

协议模块：`BattleTriMatchHeroCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消战斗英雄升级升星”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 112001 | `req_battle_tri_match_hero_up_lv` | 未路由 | protobuf / `pb_battle_tri_match_hero_up_lv_req` | `pb_battle_tri_match_hero_up_lv_rsp` |
| 112002 | `req_battle_tri_match_hero_up_star` | 未路由 | protobuf / `pb_battle_tri_match_hero_up_star_req` | `pb_battle_tri_match_hero_up_star_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-BATTLETRIMATCHEQUIP：三消战斗装备养成与交换

协议模块：`BattleTriMatchEquipCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消战斗装备养成与交换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 113001 | `req_battle_tri_match_equip_up` | 未路由 | protobuf / `pb_battle_tri_match_equip_up_req` | `pb_battle_tri_match_equip_up_rsp` |
| 113002 | `req_battle_tri_match_equip_swap` | 未路由 | protobuf / `pb_battle_tri_match_equip_swap_req` | `pb_battle_tri_match_equip_swap_rsp` |
| 113003 | `req_battle_tri_match_equip_multiple_up` | 未路由 | protobuf / `pb_battle_tri_match_equip_multiple_up_req` | `pb_battle_tri_match_equip_multiple_up_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-BATTLETRIMATCHLINEUP：三消战斗阵容管理

协议模块：`BattleTriMatchLineupCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消战斗阵容管理”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 114001 | `req_battle_tri_match_lineup_add` | 未路由 | protobuf / `pb_battle_tri_match_lineup_add_req` | `pb_battle_tri_match_lineup_add_rsp` |
| 114002 | `req_battle_tri_match_lineup_edit` | 未路由 | protobuf / `pb_battle_tri_match_lineup_edit_req` | `pb_battle_tri_match_lineup_edit_rsp` |
| 114003 | `req_battle_tri_match_lineup_set_name` | 未路由 | protobuf / `pb_battle_tri_match_lineup_set_name_req` | `pb_battle_tri_match_lineup_set_name_rsp` |
| 114004 | `req_battle_tri_match_lineup_delete` | 未路由 | protobuf / `pb_battle_tri_match_lineup_delete_req` | `pb_battle_tri_match_lineup_delete_rsp` |
| 114005 | `req_battle_tri_match_edit_playing_lineup` | 未路由 | protobuf / `pb_battle_tri_match_edit_playing_lineup_req` | `pb_battle_tri_match_edit_playing_lineup_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-TRIPLEMATCHFIGHT：三消战斗开战、重试与战报

协议模块：`TripleMatchFightCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消战斗开战、重试与战报”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 115001 | `req_triple_match_fight` | 未路由 | protobuf / `pb_triple_match_fight_request` | `pb_triple_match_fight_response` |
| 115002 | `triple_match_fight_swap` | 未路由 | protobuf / `pb_triple_match_fight_swap_tile_req` | `—` |
| 115003 | `triple_match_fight_retry` | 未路由 | etf / `—` | `pb_triple_match_fight_response` |
| 115004 | `triple_match_fight_ready` | 未路由 | protobuf / `pb_triple_match_fight_ready_req` | `pb_triple_match_fight_ready_rsp` |
| 115005 | `triple_match_fight_giveup` | 未路由 | etf / `—` | `—` |
| 115006 | `triple_match_fight_get_record` | 未路由 | etf / `—` | `pb_triple_match_fight_report` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-TRIMATCHTOWER：三消爬塔、体力恢复与奖励

协议模块：`TriMatchTowerCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消爬塔、体力恢复与奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 119001 | `req_tri_match_tower_rec_process_award` | 未路由 | protobuf / `pb_tri_match_tower_rec_process_award_req` | `pb_tri_match_tower_rec_process_award_rsp` |
| 119002 | `req_tri_match_tower_recover_stamina` | 未路由 | protobuf / `pb_tri_match_tower_recover_stamina_req` | `pb_tri_match_tower_recover_stamina_rsp` |
| 119003 | `req_tri_match_tower_act_get_pass` | 未路由 | protobuf / `pb_tri_match_tower_act_get_pass_req` | `pb_tri_match_tower_act_get_pass_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-OVERALLMATCH：综合匹配

协议模块：`OverallMatchCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“综合匹配”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 120001 | `req_overall_match_start` | 未路由 | protobuf / `pb_overall_match_start_req` | `pb_overall_match_start_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## BATTLE-TRIMATCHPVP：三消 PVP、段位和战报

协议模块：`TriMatchPvpCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三消 PVP、段位和战报”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 121001 | `req_tri_match_pvp_rec_task_award` | 未路由 | protobuf / `pb_tri_match_pvp_rec_task_award_req` | `pb_tri_match_pvp_rec_task_award_rsp` |
| 121002 | `req_tri_match_pvp_rec_grade_award` | 未路由 | protobuf / `pb_tri_match_pvp_rec_grade_award_req` | `pb_tri_match_pvp_rec_grade_award_rsp` |
| 121003 | `req_tri_match_pvp_get_report_list` | 未路由 | protobuf / `pb_tri_match_pvp_get_report_list_req` | `pb_tri_match_pvp_get_report_list_rsp` |
| 121004 | `req_tri_match_pvp_rec_giveup` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
