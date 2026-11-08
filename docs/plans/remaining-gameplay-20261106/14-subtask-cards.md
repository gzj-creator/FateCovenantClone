# 子卡划分（任务卡 → 可独立派发的子卡）

2026-11-08 建表。把 01–10 分区文档里的任务卡再拆成“一个 agent 能独立完成、独立提交、独立合并”的子卡，供多路并行派发。生成脚本 `tools/plan-subcards.mjs`；分区文档改动后重跑即可同步。

## 拆分规则

- 每张任务卡按命令功能族拆分：从命令名取最具体的功能词（settlement/award/fight/invite/member/rank/draw/buy 等），再按 type 连续性合并；单个子卡 3–8 条命令；命令不超过 5 条的任务卡不拆。
- 子卡 ID 形如 `BATTLE-MARTIALCLUB-S2`；分支 `task/<子卡ID>-YYYYMMDD`；worktree `.worktree/gameplay-20261106/<kebab-id>`。
- 看板状态取自 `execution-status.md`：标“服务端完成”的卡已有交付，子卡只剩证据补强与回归，不得当新玩法重做。

## 每张子卡的交付标准

1. 真实业务：权威状态落 SQLite，资源/奖励真实扣发；schema 或语义无证据的命令 fail closed（明确错误码，不用固定空包销项），并在 implementation.md 登记缺口。
2. 专项测试：服务单测 + 真实临时 loopback TCP（握手 909103 后走真实命令）+ SQLite 重开保持 + PB 编码失败整笔回滚 + SQLite 写入失败整笔回滚。
3. 网关只做增量派发：recruit 在 heroCommandServices 之前，百抽/奖励抽取在通用 activityRead 之前；不删除既有登录同步与派发块。
4. 交付物：`agent/workflow/gameplay-completion/<子卡ID>/implementation.md` + 分支提交；工作树干净、git diff --check 无输出、无删除主线文件。
5. 合并由总控执行（--no-ff）；同一时间只有一条分支改 gateway.mjs 派发区。

## 汇总

| 分区 | 任务卡 | 子卡 | 命令 |
| --- | ---: | ---: | ---: |
| [01-battle.md](01-battle.md) | 32 | 56 | 219 |
| [02-heroes-lineups.md](02-heroes-lineups.md) | 15 | 19 | 63 |
| [03-equipment-development.md](03-equipment-development.md) | 15 | 22 | 81 |
| [04-items-tasks-shops.md](04-items-tasks-shops.md) | 22 | 23 | 58 |
| [05-social-guild.md](05-social-guild.md) | 33 | 76 | 316 |
| [06-draw-activities.md](06-draw-activities.md) | 29 | 29 | 74 |
| [07-exploration-minigames.md](07-exploration-minigames.md) | 29 | 49 | 194 |
| [08-festivals-tasks.md](08-festivals-tasks.md) | 32 | 37 | 94 |
| [09-commerce-benefits.md](09-commerce-benefits.md) | 53 | 54 | 106 |
| [10-role-and-supporting.md](10-role-and-supporting.md) | 12 | 16 | 47 |
| **合计（01–10）** | **272** | **381** | **1252** |

另有两块不按命令拆：12-shared-gaps.md 的 7 个共享任务（CORE-BATTLE 已拆 A/B/C，CORE-ATTR / CORE-SKILL-GATES / CORE-CABIN 按实施步骤分阶段）；13-special-skills.md 的 72 个英雄技能卡按英雄各自成卡，依赖 CORE-BATTLE / CORE-ATTR / CORE-SKILL-GATES 先行。

## 派发与归属

| 归属 | 范围 | 说明 |
| --- | --- | --- |
| 块 A（本 session，#1–#33） | 01-battle.md 全部子卡；12-shared-gaps.md 的 CORE-* 收尾（CORE-BATTLE-C、CORE-ATTR、CORE-SKILL-GATES、CORE-CABIN）；全部分支的合并门禁与看板 | 战斗与战报是主线热点，需要单一口径；main 只由总控写入 |
| 块 B（新 agent B，#34–#119） | 02-heroes-lineups.md、03-equipment-development.md、04-items-tasks-shops.md、05-social-guild.md | 按子卡独立 worktree 派发，交付分支后进合并队列 |
| 块 C（新 agent C，#120–#276） | 06-draw-activities.md、07-exploration-minigames.md、08-festivals-tasks.md、09-commerce-benefits.md、10-role-and-supporting.md；13-special-skills.md 的 E1–E72 延后队列 | 按子卡独立 worktree 派发，交付分支后进合并队列 |

范围定义与编号见 [三大块](15-three-work-blocks.md)；本文件的子卡落在哪一块由所属分区决定。

并行度：平台同时最多 4 条 agent 线程（含总控），即 3 个实施 agent；同一时间只有 1 个 agent 改 gateway.mjs 派发区，其余子卡先做服务层与测试。

每个子卡的派发模板：

1. 从本文件复制子卡行（ID、type 区间、命令列表）。
2. 建 worktree 与分支：git worktree add .worktree/gameplay-20261106/<kebab-id> -b task/<子卡ID>-YYYYMMDD main。
3. 用命令名在 personal-server/game/gateway.mjs、assets/tables、config 中定位现有实现与配置；已有处理路径的子卡只补缺口，不重写。
4. 完成后自检：工作树干净、git merge-base --is-ancestor main HEAD 为 0、git diff --check 无输出、git diff --diff-filter=D --name-only main..HEAD 为空。
5. 向总控交付：分支名、HEAD、改动清单、测试统计与日志路径、fail closed 清单、证据缺口。

## 01-battle.md

### BATTLE-FIGHT：通用战斗与报告分享

- 协议模块 `FightCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-FIGHT-S1` | 205 | `share_report` | 1 | 0/1 | 0 |

### BATTLE-REPORT：通关记录与点赞

- 协议模块 `ReportCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-REPORT-S1` | 211-212 | `req_pass_record`<br>`req_pass_record_vote` | 2 | 0/2 | 0 |

### BATTLE-PEAKTOWER：巅峰塔/爬塔

- 协议模块 `PeakTowerCmd`；未路由 6 条；子卡 2 个；看板状态：服务端完成（部分证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-PEAKTOWER-S1` | 1103-1111 | `peak_tower_sweeps`<br>`peak_tower_every_award`<br>`peak_tower_rev_tower_award` | 3 | 2/1 | 0 |
| `BATTLE-PEAKTOWER-S2` | 1109-1112 | `peak_tower_buy_goods`<br>`peak_tower_receive_achievement`<br>`peak_tower_avg_layer` | 3 | 3/0 | 0 |

### BATTLE-RANK：真实排行榜

- 协议模块 `RankCmd`；未路由 2 条；子卡 3 个；看板状态：服务端完成（部分榜单事件/赛季结算阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-RANK-S1` | 2000-2010 | `get_rank_data`<br>`get_rank_top_data`<br>`batch_get_hero_rank`<br>`batch_get_player_hero_rank`<br>`get_rank_cross_top`<br>`get_appoint_rank`<br>`get_rank_backup`<br>`req_batch_get_rank` | 8 | 7/1 | 8 |
| `BATTLE-RANK-S2` | 2001-2006 | `get_rank_info`<br>`batch_get_personal_rank_first` | 2 | 2/0 | 2 |
| `BATTLE-RANK-S3` | 2011 | `req_batch_get_rank_backup` | 1 | 1/0 | 1 |

### BATTLE-SWAPARENA：换位/多队竞技场

- 协议模块 `SwapArenaCmd`；未路由 10 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-SWAPARENA-S1` | 4031-4035 | `req_swap_arena_get_match`<br>`req_swap_arena_refresh_match`<br>`req_swap_arena_buy_fight_times`<br>`req_swap_arena_more_fight`<br>`req_swap_arena_fight_report` | 5 | 5/0 | 1 |
| `BATTLE-SWAPARENA-S2` | 4036-4040 | `req_swap_arena_read_rank_change`<br>`req_swap_arena_set_read_report_time`<br>`req_swap_arena_rank_award`<br>`req_swap_arena_update_cross_stage`<br>`req_swap_arena_init_double_team` | 5 | 4/1 | 2 |

### BATTLE-REDCLIFF：RedCliff 副本

- 协议模块 `RedCliffCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-REDCLIFF-S1` | 55001-55004 | `req_red_cliff_box`<br>`req_red_cliff_buff`<br>`req_red_cliff_reset`<br>`req_red_cliff_refresh` | 4 | 4/0 | 0 |

### BATTLE-GENERALDUNGEON：通用地牢副本

- 协议模块 `GeneralDungeonCmd`；未路由 7 条；子卡 2 个；看板状态：服务端完成（事件规则部分证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-GENERALDUNGEON-S1` | 78101-78104 | `req_dungeon_evt_execute`<br>`req_dungeon_data`<br>`req_dungeon_enter_level`<br>`req_dungeon_close_level` | 4 | 2/2 | 0 |
| `BATTLE-GENERALDUNGEON-S2` | 78105-78107 | `req_dungeon_evt_activate`<br>`req_dungeon_sync_map`<br>`req_dungeon_use_prop` | 3 | 1/2 | 0 |

### BATTLE-ARENACONTEST：竞技大赛、竞猜与观战

- 协议模块 `ArenaContestCmd`；未路由 15 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-ARENACONTEST-S1` | 83301-83304 | `req_arena_contest_enter`<br>`req_arena_contest_leave`<br>`req_arena_contest_sign_up`<br>`req_arena_contest_guess` | 4 | 3/1 | 0 |
| `BATTLE-ARENACONTEST-S2` | 83305-83315 | `req_arena_contest_rev_fight_award`<br>`req_arena_contest_get_top_roles`<br>`req_arena_contest_rev_task_award`<br>`req_arena_contest_rev_guess_award`<br>`req_arena_contest_watch_award` | 5 | 4/1 | 1 |
| `BATTLE-ARENACONTEST-S3` | 83306-83309 | `req_arena_contest_get_guess_info`<br>`req_arena_contest_get_final_info`<br>`req_arena_contest_get_final_power_info` | 3 | 3/0 | 3 |
| `BATTLE-ARENACONTEST-S4` | 83307-83312 | `req_arena_contest_get_role_fight_report`<br>`req_arena_contest_congratulate`<br>`req_arena_contest_watch_fight` | 3 | 3/0 | 1 |

### BATTLE-HUNTERARENA：猎人竞技场

- 协议模块 `HunterArenaCmd`；未路由 11 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-HUNTERARENA-S1` | 84001-84010 | `req_hunter_arena_clear_change`<br>`req_hunter_arena_day_award`<br>`req_hunter_arena_season_award`<br>`req_hunter_arena_palace`<br>`req_hunter_arena_fight`<br>`req_hunter_arena_set_ignore`<br>`req_hunter_arena_set_read_report_time`<br>`req_hunter_arena_set_award_tips` | 8 | 8/0 | 0 |
| `BATTLE-HUNTERARENA-S2` | 84008-84011 | `req_hunter_arena_history_rank`<br>`req_hunter_arena_report_lock`<br>`req_hunter_arena_enter_form` | 3 | 2/1 | 1 |

### BATTLE-MARTIALCLUB：武馆组队挑战

- 协议模块 `MartialClubCmd`；未路由 24 条；子卡 5 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-MARTIALCLUB-S1` | 84401-84408 | `req_martial_club_first_award`<br>`req_martial_club_create_team`<br>`req_martial_club_add_bot`<br>`req_martial_club_set_help`<br>`req_martial_club_join_team`<br>`req_martial_club_exit_team` | 6 | 5/1 | 0 |
| `BATTLE-MARTIALCLUB-S2` | 84409-84411 | `req_martial_club_team_info`<br>`req_martial_club_set_team_info`<br>`req_martial_club_set_ready` | 3 | 2/1 | 2 |
| `BATTLE-MARTIALCLUB-S3` | 84412-84417 | `req_martial_club_invite`<br>`req_martial_club_invite_all`<br>`req_martial_club_set_member_pos`<br>`req_martial_club_pass_count`<br>`req_martial_club_team_kick`<br>`req_martial_club_team_fight` | 6 | 5/1 | 0 |
| `BATTLE-MARTIALCLUB-S4` | 84418-84423 | `req_martial_club_bot_list`<br>`req_martial_club_give_up`<br>`req_martial_club_settlement`<br>`req_martial_club_team_members`<br>`req_martial_club_team_skip`<br>`req_martial_club_employ_list` | 6 | 5/1 | 2 |
| `BATTLE-MARTIALCLUB-S5` | 84424-84426 | `req_martial_club_employ_enter`<br>`req_martial_club_match`<br>`req_martial_club_relic` | 3 | 1/2 | 0 |

### BATTLE-MARTIALCLUBACT：武馆活动奖励

- 协议模块 `MartialClubActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-MARTIALCLUBACT-S1` | 84431-84432 | `req_martial_act_pass_team_award`<br>`req_martial_act_server_award` | 2 | 2/0 | 0 |

### BATTLE-SOULTRIAL：灵魂试炼抽奖

- 协议模块 `SoulTrialCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-SOULTRIAL-S1` | 87104-87105 | `req_soul_trial_draw_award`<br>`req_soul_trial_rev_draw_award` | 2 | 2/0 | 0 |

### BATTLE-TOURNAMENT：巅峰对决/锦标赛

- 协议模块 `TournamentCmd`；未路由 11 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-TOURNAMENT-S1` | 88501-88503 | `req_tournament_clear_change`<br>`req_tournament_day_award`<br>`req_tournament_season_award` | 3 | 3/0 | 0 |
| `BATTLE-TOURNAMENT-S2` | 88504-88507 | `req_tournament_palace`<br>`req_tournament_fight`<br>`req_tournament_set_ignore`<br>`req_tournament_set_read_report_time` | 4 | 4/0 | 0 |
| `BATTLE-TOURNAMENT-S3` | 88508-88511 | `req_tournament_history_rank`<br>`req_tournament_report_lock`<br>`req_tournament_start_promote`<br>`req_tournament_enter_form` | 4 | 3/1 | 1 |

### BATTLE-SCARLETTRIAL：猩红试炼

- 协议模块 `ScarletTrialCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-SCARLETTRIAL-S1` | 89101-89102 | `req_scarlet_task_award`<br>`req_scarlet_select_stone` | 2 | 2/0 | 0 |

### BATTLE-STARMISSION：星级关卡、章节奖励与技能

- 协议模块 `StarMissionCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-STARMISSION-S1` | 89601-89604 | `req_star_mission_award`<br>`req_star_mission_chapter_award`<br>`req_star_mission_skill`<br>`req_star_mission_skill_reset` | 4 | 1/3 | 0 |

### BATTLE-COMMONMAP：通用地图节点与扫荡

- 协议模块 `CommonMapCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-COMMONMAP-S1` | 90601-90603 | `req_common_map_init`<br>`req_common_map_node_trigger`<br>`req_common_map_sweep` | 3 | 1/2 | 0 |

### BATTLE-FAMEHALL：名人堂挑战与掉落选择

- 协议模块 `FameHallCmd`；未路由 11 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-FAMEHALL-S1` | 91101-91106 | `req_fame_hall_enter_difficult`<br>`req_fame_hall_choose_drop`<br>`req_fame_hall_edit_artifact`<br>`req_fame_hall_reset`<br>`req_fame_hall_skip_choose` | 5 | 2/3 | 0 |
| `BATTLE-FAMEHALL-S2` | 91103-91111 | `req_fame_hall_stage_award`<br>`req_fame_hall_terminate`<br>`req_fame_hall_sweep`<br>`req_fame_hall_data`<br>`req_fame_hall_client_show_tag`<br>`req_fame_hall_reissue_stage_award` | 6 | 5/1 | 0 |

### BATTLE-WORLDBOSS：世界 BOSS

- 协议模块 `WorldBossCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-WORLDBOSS-S1` | 91801-91805 | `req_world_boss_enter_map`<br>`req_world_boss_leave_map`<br>`req_world_boss_receive`<br>`req_world_boss_history_rank`<br>`req_world_boss_receive_achievement` | 5 | 4/1 | 1 |

### BATTLE-PITLORD：PitLord 挑战、排名与补发

- 协议模块 `PitLordCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-PITLORD-S1` | 92801-92804 | `req_pit_lord_rank_award`<br>`req_pit_lord_history_rank_list`<br>`req_pit_lord_reissue_rank_award`<br>`req_pit_lord_free_award` | 4 | 4/0 | 3 |

### BATTLE-CAMPTOWER：阵营塔

- 协议模块 `CampTowerCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-CAMPTOWER-S1` | 93601-93603 | `req_camp_tower_cross_award`<br>`req_camp_tower_first_award`<br>`req_camp_tower_get_first_pass_list` | 3 | 1/2 | 1 |

### BATTLE-TOWERDEFENSE：塔防驻守与轮次奖励

- 协议模块 `TowerDefenseCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-TOWERDEFENSE-S1` | 97601-97605 | `req_tower_defense_garrison`<br>`req_tower_defense_turn_over`<br>`req_tower_defense_award`<br>`req_tower_defense_turns_award`<br>`req_tower_defense_look_award` | 5 | 4/1 | 0 |

### BATTLE-TOPARENA：巅峰竞技、半决赛/决赛与竞猜

- 协议模块 `TopArenaCmd`；未路由 18 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-TOPARENA-S1` | 98500-98583 | `req_top_arena_pre_favorite`<br>`req_top_arena_semi_server_help`<br>`req_top_arena_semi_get_server_help_res`<br>`req_top_arena_get_server_help` | 4 | 3/1 | 2 |
| `BATTLE-TOPARENA-S2` | 98505-98602 | `req_top_arena_get_rank_reward`<br>`req_top_arena_semi_get_server_help_reward`<br>`req_top_arena_final_attack`<br>`req_top_arena_final_guess`<br>`req_top_arena_final_battle_record`<br>`req_top_arena_final_get_rank_reward`<br>`req_top_arena_publicity_server_award`<br>`req_top_arena_server_max_rank_award` | 8 | 4/4 | 4 |
| `BATTLE-TOPARENA-S3` | 98564-98590 | `req_top_arena_final_get_server_rank`<br>`req_top_arena_final_join`<br>`req_top_arena_get_history`<br>`req_top_arena_set_declaration`<br>`req_top_arena_vote`<br>`req_top_arena_enter` | 6 | 5/1 | 2 |

### BATTLE-PLAYMATCH：即时匹配与取消

- 协议模块 `PlayMatchCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-PLAYMATCH-S1` | 98900-98901 | `req_play_match_start`<br>`req_play_match_cancel` | 2 | 2/0 | 0 |

### BATTLE-OVERALLPVP：综合 PVP、淘汰赛与竞猜

- 协议模块 `OverallPvpCmd`；未路由 30 条；子卡 7 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-OVERALLPVP-S1` | 101101-101110 | `req_overall_pvp_elms_buy_count`<br>`req_overall_pvp_elms_match`<br>`req_overall_pvp_prelims_match`<br>`req_overall_pvp_prelims_buy_times`<br>`req_overall_pvp_elms_sweep`<br>`req_overall_pvp_prelims_special_match` | 6 | 6/0 | 0 |
| `BATTLE-OVERALLPVP-S2` | 101102-101127 | `req_overall_pvp_rev_day_task_award`<br>`req_overall_pvp_rev_period_task_award`<br>`req_overall_pvp_preview_reward`<br>`req_overall_pvp_team_num_reward`<br>`req_overall_pvp_final_watch_award`<br>`req_overall_pvp_rev_sign_task_award`<br>`req_overall_pvp_show_reward`<br>`req_overall_pvp_fight_guess_reward` | 8 | 7/1 | 0 |
| `BATTLE-OVERALLPVP-S3` | 101111-101114 | `req_overall_pvp_report_person`<br>`req_overall_pvp_report_top`<br>`req_overall_pvp_elms_clear_group_dirty`<br>`req_overall_pvp_elms_clear_final_dirty` | 4 | 4/0 | 0 |
| `BATTLE-OVERALLPVP-S4` | 101115-101119 | `req_overall_pvp_enter_view`<br>`req_overall_pvp_exit_view`<br>`req_overall_pvp_elms_clear_fail_report`<br>`req_overall_pvp_scroll`<br>`req_overall_pvp_final_record` | 5 | 5/0 | 0 |
| `BATTLE-OVERALLPVP-S5` | 101122-101125 | `req_overall_pvp_get_info`<br>`req_overall_pvp_try_init_lineup`<br>`req_overall_pvp_fight_guess` | 3 | 2/1 | 1 |
| `BATTLE-OVERALLPVP-S6` | 101126-101130 | `req_overall_pvp_rank_guess`<br>`req_overall_pvp_rank_guess_num`<br>`req_overall_pvp_history_data` | 3 | 2/1 | 3 |
| `BATTLE-OVERALLPVP-S7` | 101128 | `req_overall_pvp_rank_guess_reward` | 1 | 1/0 | 1 |

### BATTLE-DESTINYPVE：命运 PVE 分层挑战

- 协议模块 `DestinyPveCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-DESTINYPVE-S1` | 104701-104702 | `req_destiny_pve_fight`<br>`req_destiny_pve_layer_info` | 2 | 0/2 | 1 |

### BATTLE-BATTLETRIMATCHHERO：三消战斗英雄升级升星

- 协议模块 `BattleTriMatchHeroCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-BATTLETRIMATCHHERO-S1` | 112001-112002 | `req_battle_tri_match_hero_up_lv`<br>`req_battle_tri_match_hero_up_star` | 2 | 0/2 | 0 |

### BATTLE-BATTLETRIMATCHEQUIP：三消战斗装备养成与交换

- 协议模块 `BattleTriMatchEquipCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-BATTLETRIMATCHEQUIP-S1` | 113001-113003 | `req_battle_tri_match_equip_up`<br>`req_battle_tri_match_equip_swap`<br>`req_battle_tri_match_equip_multiple_up` | 3 | 0/3 | 0 |

### BATTLE-BATTLETRIMATCHLINEUP：三消战斗阵容管理

- 协议模块 `BattleTriMatchLineupCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-BATTLETRIMATCHLINEUP-S1` | 114001-114005 | `req_battle_tri_match_lineup_add`<br>`req_battle_tri_match_lineup_edit`<br>`req_battle_tri_match_lineup_set_name`<br>`req_battle_tri_match_lineup_delete`<br>`req_battle_tri_match_edit_playing_lineup` | 5 | 0/5 | 0 |

### BATTLE-TRIPLEMATCHFIGHT：三消战斗开战、重试与战报

- 协议模块 `TripleMatchFightCmd`；未路由 6 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-TRIPLEMATCHFIGHT-S1` | 115001-115006 | `req_triple_match_fight`<br>`triple_match_fight_swap`<br>`triple_match_fight_retry`<br>`triple_match_fight_ready`<br>`triple_match_fight_giveup`<br>`triple_match_fight_get_record` | 6 | 3/3 | 1 |

### BATTLE-TRIMATCHTOWER：三消爬塔、体力恢复与奖励

- 协议模块 `TriMatchTowerCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-TRIMATCHTOWER-S1` | 119001-119003 | `req_tri_match_tower_rec_process_award`<br>`req_tri_match_tower_recover_stamina`<br>`req_tri_match_tower_act_get_pass` | 3 | 0/3 | 1 |

### BATTLE-OVERALLMATCH：综合匹配

- 协议模块 `OverallMatchCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-OVERALLMATCH-S1` | 120001 | `req_overall_match_start` | 1 | 0/1 | 0 |

### BATTLE-TRIMATCHPVP：三消 PVP、段位和战报

- 协议模块 `TriMatchPvpCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `BATTLE-TRIMATCHPVP-S1` | 121001-121004 | `req_tri_match_pvp_rec_task_award`<br>`req_tri_match_pvp_rec_grade_award`<br>`req_tri_match_pvp_get_report_list`<br>`req_tri_match_pvp_rec_giveup` | 4 | 1/3 | 1 |

## 02-heroes-lineups.md

### HERO-LINEUP：预设阵容索引、增删、改名与保存

- 协议模块 `LineupCmd`；未路由 5 条；子卡 1 个；看板状态：服务端完成

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-LINEUP-S1` | 210-217 | `req_set_pre_lineup_index`<br>`req_custom_pre_lineup_new`<br>`req_custom_pre_lineup_set_name`<br>`req_custom_pre_lineup_set`<br>`req_custom_pre_lineup_delete` | 5 | 2/3 | 0 |

### HERO-HERO：英雄进阶、试炼、重铸、碎片、访问与支援

- 协议模块 `HeroCmd`；未路由 20 条；子卡 5 个；看板状态：服务端完成（18 条剩余命令已补齐；多项规则证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-HERO-S1` | 602-672 | `req_choose_hero_school`<br>`req_develop_hero_trial`<br>`req_hero_select_pendant` | 3 | 1/2 | 0 |
| `HERO-HERO-S2` | 614-634 | `use_hero_chip`<br>`req_query_rent_out_info`<br>`req_rent_flush`<br>`req_query_share_data` | 4 | 2/2 | 2 |
| `HERO-HERO-S3` | 627-656 | `req_rent_out_hero`<br>`req_rent_out_off_hero`<br>`req_rent_in_hero`<br>`req_rev_recruit_progress_award`<br>`req_develop_submit_hero`<br>`req_develop_batch_submit_hero` | 6 | 2/4 | 0 |
| `HERO-HERO-S4` | 647-654 | `req_hero_visit`<br>`req_draw_get_support_data`<br>`req_active_fetter` | 3 | 2/1 | 1 |
| `HERO-HERO-S5` | 651-673 | `req_draw_support_lineup`<br>`req_hero_diff`<br>`req_hero_reforge`<br>`req_hero_reforge_save`<br>`req_hero_reforge_cancel`<br>`req_one_key_develop`<br>`req_draw_marquee` | 7 | 4/3 | 0 |

### HERO-MASTERY：精通升级与突破

- 协议模块 `MasteryCmd`；未路由 2 条；子卡 1 个；看板状态：服务端完成（技能已由 CORE-SKILL-GATES 接线；属性与完整规则待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-MASTERY-S1` | 659-660 | `req_hero_mastery_level_up`<br>`req_hero_mastery_break` | 2 | 2/0 | 0 |

### HERO-FAVOURINTIMACY：亲密度、约会与剧情

- 协议模块 `FavourIntimacyCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-FAVOURINTIMACY-S1` | 667-671 | `req_hero_intimacy_add`<br>`req_hero_intimacy_date`<br>`req_hero_intimacy_story` | 3 | 0/3 | 0 |

### HERO-INTELLI：Intelli 解锁与批量处理

- 协议模块 `IntelliCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-INTELLI-S1` | 701-702 | `req_intelli_unlock`<br>`req_intelli_batch_handle` | 2 | 0/2 | 0 |

### HERO-COMBATPOWER：战力奖励与预设战力更新

- 协议模块 `CombatPowerCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-COMBATPOWER-S1` | 802-803 | `combat_power_gain_award`<br>`req_update_pre_lineup_power` | 2 | 2/0 | 0 |

### HERO-TACTICS：战术升级与重置

- 协议模块 `TacticsCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-TACTICS-S1` | 84501-84502 | `req_tactics_level_up`<br>`req_tactics_reset` | 2 | 2/0 | 0 |

### HERO-HEROLEASE：英雄租借

- 协议模块 `HeroLeaseCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-HEROLEASE-S1` | 87201-87205 | `req_hero_lease_place`<br>`req_hero_lease_lease`<br>`req_hero_lease_give_back`<br>`req_hero_lease_take_back`<br>`req_hero_lease_list` | 5 | 0/5 | 1 |

### HERO-LINEUPSNAPSHOT：阵容/英雄快照

- 协议模块 `LineupSnapshotCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-LINEUPSNAPSHOT-S1` | 87701-87702 | `req_lineup_snapshot_hero`<br>`req_lineup_snapshot_list` | 2 | 1/1 | 1 |

### HERO-TEAMSUGGEST：推荐阵容激活与选择

- 协议模块 `TeamSuggestCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-TEAMSUGGEST-S1` | 88802-88803 | `req_team_suggest_active`<br>`req_team_suggest_select` | 2 | 1/1 | 0 |

### HERO-HEROBLAZON：英雄纹章、天赋、技能与羁绊

- 协议模块 `HeroBlazonCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-HEROBLAZON-S1` | 88951-88957 | `req_hero_blazon_up`<br>`req_hero_blazon_update_talent`<br>`req_hero_blazon_update_skill`<br>`req_hero_blazon_reset_skill`<br>`req_hero_blazon_bond_up` | 5 | 3/2 | 0 |

### HERO-NEWHEROEXCLUSIVE：新英雄专属选择、剧情与阵容奖励

- 协议模块 `NewHeroExclusiveCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-NEWHEROEXCLUSIVE-S1` | 88963-88967 | `req_new_hero_exclusive_choose_hero`<br>`req_new_hero_exclusive_rev_story_award`<br>`req_rev_new_hero_exclusive_lineup_award` | 3 | 3/0 | 0 |

### HERO-HEROLEGEND：英雄传奇书升星、祝福、升级与升阶

- 协议模块 `HeroLegendCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-HEROLEGEND-S1` | 89801-89804 | `req_hero_legend_book_handle_star`<br>`req_hero_legend_book_handle_bless`<br>`req_hero_legend_book_handle_level`<br>`req_hero_legend_book_handle_stage` | 4 | 4/0 | 0 |

### HERO-LEASERSTARUP：租借/Leaser 升星与重置

- 协议模块 `LeaserStarUpCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-LEASERSTARUP-S1` | 101201-101202 | `req_leaser_star_up`<br>`req_leaser_star_up_reset` | 2 | 0/2 | 0 |

### HERO-CAMPHALO：阵营光环升级

- 协议模块 `CampHaloCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `HERO-CAMPHALO-S1` | 103101 | `req_camp_halo_level_up` | 1 | 1/0 | 0 |

## 03-equipment-development.md

### EQUIP-EQUIP：普通装备觉醒、材料交换与批量精炼

- 协议模块 `EquipCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-EQUIP-S1` | 1007-1009 | `req_equip_awake`<br>`req_equip_res_exchange`<br>`req_equip_refine_one_key_batch` | 3 | 1/2 | 0 |

### EQUIP-ARTIFACT：圣器合成、强化、品质、升级、突破等

- 协议模块 `ArtifactCmd`；未路由 11 条；子卡 2 个；看板状态：服务端完成（4 条证据待补 fail closed，1 条部分交付）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-ARTIFACT-S1` | 37060-37062 | `req_artifact_synthesis`<br>`req_artifact_strength`<br>`req_artifact_quality` | 3 | 1/2 | 0 |
| `EQUIP-ARTIFACT-S2` | 37068-37075 | `req_artifact_forge_promote`<br>`req_artifact_fetter`<br>`req_artifact_level_up`<br>`req_artifact_break_level_up`<br>`req_artifact_inject`<br>`req_artifact_handbook_level_up`<br>`req_artifact_fly_up`<br>`req_artifact_change_skin` | 8 | 6/2 | 0 |

### EQUIP-WARRUNE：战纹激活、升阶、洗属性、重铸与养成

- 协议模块 `WarRuneCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-WARRUNE-S1` | 83001-83004 | `req_war_rune_active`<br>`req_war_rune_up_stage`<br>`req_war_rune_attr_random`<br>`req_war_rune_recast` | 4 | 3/1 | 0 |
| `EQUIP-WARRUNE-S2` | 83005-83007 | `req_war_rune_edu`<br>`req_war_rune_up_level`<br>`req_war_rune_up_star` | 3 | 3/0 | 0 |

### EQUIP-MUSEUM：博物馆藏品激活与人气奖励

- 协议模块 `MuseumCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-MUSEUM-S1` | 85701-85702 | `req_museum_rev_popularity_award`<br>`req_museum_active_collection` | 2 | 1/1 | 0 |

### EQUIP-FANTASYHANDBOOK：幻武图鉴升星

- 协议模块 `FantasyHandbookCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-FANTASYHANDBOOK-S1` | 89001 | `req_fantasy_handbook_star` | 1 | 0/1 | 0 |

### EQUIP-RELIC：Relic 装具穿戴、重铸、分解、重置、升阶等

- 协议模块 `RelicCmd`；未路由 11 条；子卡 2 个；看板状态：服务端完成（保底/概率与登录 depot 槽位证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-RELIC-S1` | 89701-89706 | `req_relic_break_up`<br>`req_relic_recast`<br>`req_relic_save_recast`<br>`req_relic_resolve`<br>`req_relic_cancel_recast` | 5 | 1/4 | 0 |
| `EQUIP-RELIC-S2` | 89707-89712 | `req_relic_reset`<br>`req_relic_stage`<br>`req_relic_wear`<br>`req_relic_up_sp`<br>`req_relic_variation`<br>`req_relic_refine` | 6 | 4/2 | 0 |

### EQUIP-PET：魔灵合成、上阵、升级、升星、装备、符文与变异

- 协议模块 `PetCmd`；未路由 17 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-PET-S1` | 90731-90736 | `req_pet_combine`<br>`req_pet_raise_star`<br>`req_pet_lineup`<br>`req_equip_combine` | 4 | 3/1 | 0 |
| `EQUIP-PET-S2` | 90734-90740 | `req_pet_upgrade`<br>`req_equip_convert`<br>`req_rune_upgrade`<br>`req_rune_convert`<br>`req_book_upgrade` | 5 | 2/3 | 0 |
| `EQUIP-PET-S3` | 90741-90744 | `req_pet_up_quality`<br>`req_pet_equip_up`<br>`req_pet_open_ability`<br>`req_pet_lineup_help` | 4 | 2/2 | 0 |
| `EQUIP-PET-S4` | 90745-90748 | `req_pet_break`<br>`pb_req_pet_slot_wear_equip_insert`<br>`req_pet_mutant`<br>`req_pet_up_promote_lv` | 4 | 2/2 | 0 |

### EQUIP-PETPLAY：魔灵探索与周期奖励

- 协议模块 `PetPlayCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-PETPLAY-S1` | 90901-90902 | `req_pet_play_period_award`<br>`req_pet_play_over_explore` | 2 | 2/0 | 0 |

### EQUIP-ENERGYBURST：能量爆发奖励

- 协议模块 `EnergyBurstCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-ENERGYBURST-S1` | 91001 | `req_energy_burst_award` | 1 | 1/0 | 0 |

### EQUIP-TREASURE：秘宝升星、抽奖、套装、属性、自选与宝箱

- 协议模块 `TreasureCmd`；未路由 6 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-TREASURE-S1` | 93301-93306 | `req_treasure_star`<br>`req_treasure_draw_award`<br>`req_treasure_suit_up`<br>`req_treasure_attr_update`<br>`req_treasure_custom_draw`<br>`req_treasure_box` | 6 | 4/2 | 0 |

### EQUIP-ELVES：精灵升星、天赋、图鉴、助战、皮肤与变异

- 协议模块 `ElvesCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-ELVES-S1` | 93701-93704 | `req_elves_up_star`<br>`req_elves_up_talent`<br>`req_elves_up_book`<br>`req_elves_lineup_help` | 4 | 0/4 | 0 |
| `EQUIP-ELVES-S2` | 93705-93707 | `req_elves_wear_skin`<br>`req_elves_mutant`<br>`req_elves_up_break_lv` | 3 | 1/2 | 0 |

### EQUIP-ELVESBEAD：精灵珠升级、升星、穿脱与分解

- 协议模块 `ElvesBeadCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-ELVESBEAD-S1` | 93751-93755 | `req_bead_up_level`<br>`req_bead_up_star`<br>`req_bead_wear`<br>`req_bead_un_wear`<br>`req_bead_resolve` | 5 | 1/4 | 0 |

### EQUIP-LEADEREQUIP：团长装备升级、升星、分解、增幅与重铸

- 协议模块 `LeaderEquipCmd`；未路由 6 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-LEADEREQUIP-S1` | 98402-98407 | `req_leader_equip_up_level`<br>`req_leader_equip_up_star`<br>`req_leader_equip_dissolve`<br>`req_leader_equip_intensify`<br>`req_leader_equip_recast`<br>`req_leader_equip_save_dismiss` | 6 | 5/1 | 0 |

### EQUIP-DIVINEEMBRYO：神胚选择

- 协议模块 `DivineEmbryoCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-DIVINEEMBRYO-S1` | 102201 | `req_divine_embryo_select` | 1 | 1/0 | 0 |

### EQUIP-BADGE：徽章激活

- 协议模块 `BadgeCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `EQUIP-BADGE-S1` | 104201 | `req_badge_active` | 1 | 0/1 | 0 |

## 04-items-tasks-shops.md

### ITEM-ITEM：重复箱、手动兑换、碎片合成与抽奖箱分支

- 协议模块 `ItemCmd`；未路由 4 条；子卡 1 个；看板状态：服务端完成（153/157 证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-ITEM-S1` | 153-158 | `use_repeat_box`<br>`manual_convert_item`<br>`req_chip_compose`<br>`req_one_key_chip_compose` | 4 | 2/2 | 0 |

### ITEM-RESCOMPLETE：资源补全领奖

- 协议模块 `ResCompleteCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-RESCOMPLETE-S1` | 288 | `req_res_complete_award` | 1 | 1/0 | 0 |

### ITEM-MISSION：主线体力、补给、章节一键与 BOSS 奖励

- 协议模块 `MissionCmd`；未路由 6 条；子卡 1 个；看板状态：服务端完成（509 common_task、512 boss 证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-MISSION-S1` | 504-512 | `mission_meal`<br>`mission_energy_exchange`<br>`req_one_key_chapter`<br>`energy_energy_buy`<br>`req_mission_chapter_pass`<br>`req_mission_boss_pass_award` | 6 | 5/1 | 0 |

### ITEM-SHOP：普通商店、快速购买、刷新、结算与历史商品

- 协议模块 `ShopCmd`；未路由 6 条；子卡 2 个；看板状态：服务端完成

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-SHOP-S1` | 1203-1207 | `fast_buy_item`<br>`req_shop_settle`<br>`req_shop_easy_buy_item` | 3 | 3/0 | 0 |
| `ITEM-SHOP-S2` | 1205-1208 | `req_shop_wipe_butt`<br>`req_shop_buy_history_item`<br>`req_refresh_shop` | 3 | 2/1 | 1 |

### ITEM-GUIDE：引导领奖与网络检查

- 协议模块 `GuideCmd`；未路由 2 条；子卡 1 个；看板状态：服务端完成（奖励配置证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-GUIDE-S1` | 8001-8002 | `req_guide_award`<br>`req_check_guide_net` | 2 | 2/0 | 0 |

### ITEM-EVERYTASK：每日、每周、主线任务及一键领奖

- 协议模块 `EveryTaskCmd`；未路由 7 条；子卡 1 个；看板状态：服务端完成（部分进度/奖励证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-EVERYTASK-S1` | 9000-9009 | `req_finish_daily_task`<br>`req_finish_main_task`<br>`req_get_daily_active_reward`<br>`req_finish_all_daily_task`<br>`req_finish_all_main_task`<br>`req_finish_weekly_task`<br>`req_finish_all_weekly_task` | 7 | 7/0 | 1 |

### ITEM-COMMONTASK：通用任务与线性任务剩余进度函数

- 协议模块 `CommonTaskCmd`；未路由 1 条；子卡 1 个；看板状态：服务端完成（奖励/爬塔进度证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-COMMONTASK-S1` | 9005 | `req_finish_common_task` | 1 | 1/0 | 0 |

### ITEM-RANKACHIEVE：排名成就奖励

- 协议模块 `RankAchieveCmd`；未路由 1 条；子卡 1 个；看板状态：服务端完成（多数成就事件源证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-RANKACHIEVE-S1` | 43101 | `req_rank_achieve_award` | 1 | 0/1 | 1 |

### ITEM-FIRSTWEEKGOAL：首周目标与任务奖励

- 协议模块 `FirstWeekGoalCmd`；未路由 2 条；子卡 1 个；看板状态：服务端完成（部分进度事件证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-FIRSTWEEKGOAL-S1` | 67004-67005 | `req_first_week_goal_progress_award`<br>`req_first_week_goal_task_award` | 2 | 2/0 | 0 |

### ITEM-GROWTHROAD：成长之路

- 协议模块 `GrowthRoadCmd`；未路由 2 条；子卡 1 个；看板状态：服务端完成（1111–1113 任务进度证据阻塞）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-GROWTHROAD-S1` | 69001-69002 | `req_growth_road_progress_award`<br>`req_growth_road_task_award` | 2 | 2/0 | 0 |

### ITEM-GROWTHTARGET：成长目标阶段与任务

- 协议模块 `GrowthTargetCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-GROWTHTARGET-S1` | 69006-69007 | `req_growth_target_phase_award`<br>`req_growth_target_task_award` | 2 | 0/2 | 0 |

### ITEM-TASKAWARD：任务活动进度与任务奖

- 协议模块 `TaskAwardCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-TASKAWARD-S1` | 69101-69102 | `req_task_award_progress_award`<br>`req_task_award_task_award` | 2 | 2/0 | 0 |

### ITEM-OPENSERVERBOX：开服宝箱与进度

- 协议模块 `OpenServerBoxCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-OPENSERVERBOX-S1` | 69301-69302 | `req_open_server_box_award`<br>`req_open_server_box_progress` | 2 | 2/0 | 0 |

### ITEM-HOOK：挂机收益、快速收取与产物

- 协议模块 `HookCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-HOOK-S1` | 78201-78205 | `req_hook_gather`<br>`req_hook_preview`<br>`req_hook_fast_gather`<br>`req_hook_fast_produce_item`<br>`req_hook_produce_item` | 5 | 1/4 | 0 |

### ITEM-FUNCTIONMANUAL：功能手册奖励

- 协议模块 `FunctionManualCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-FUNCTIONMANUAL-S1` | 82301 | `req_function_manual_award` | 1 | 1/0 | 0 |

### ITEM-TASKGROUP：任务组任务与阶段领奖

- 协议模块 `TaskGroupCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-TASKGROUP-S1` | 84901-84902 | `req_task_group_task_award`<br>`req_task_group_group_award` | 2 | 0/2 | 0 |

### ITEM-CAREERLIFE：生涯剧情奖励

- 协议模块 `CareerLifeCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-CAREERLIFE-S1` | 85804 | `req_career_life_story_award` | 1 | 1/0 | 0 |

### ITEM-RESROLLBACK：资源回退预览与执行

- 协议模块 `ResRollbackCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-RESROLLBACK-S1` | 88401-88402 | `req_res_rollback_preview`<br>`req_res_rollback` | 2 | 0/2 | 0 |

### ITEM-MYSTERYSHOP：神秘商店自动刷新、手动刷新与购买

- 协议模块 `MysteryShopCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-MYSTERYSHOP-S1` | 91501-91503 | `req_mystery_shop_auto_refresh`<br>`req_mystery_shop_manual_refresh`<br>`req_mystery_shop_buy` | 3 | 3/0 | 0 |

### ITEM-LINEARLEVEL：线性等级宝箱

- 协议模块 `LinearLevelCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-LINEARLEVEL-S1` | 93501 | `req_linear_level_box_award` | 1 | 0/1 | 0 |

### ITEM-PERIODTASK：周期任务、阶段与积分奖励

- 协议模块 `PeriodTaskCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-PERIODTASK-S1` | 101301-101303 | `req_period_task_award`<br>`req_period_stage_award`<br>`req_period_score_award` | 3 | 3/0 | 1 |

### ITEM-TASKACTIVITY：任务活动提交与数据

- 协议模块 `TaskActivityCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ITEM-TASKACTIVITY-S1` | 105701-105702 | `req_task_activity_finish`<br>`req_task_activity_data` | 2 | 1/1 | 0 |

## 05-social-guild.md

### SOC-GUILDDATA：公会数据查询

- 协议模块 `GuildDataCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDDATA-S1` | 171 | `req_guild_data` | 1 | 0/1 | 0 |

### SOC-MSG：频道加入、发言、历史、跨服消息与玩家信息

- 协议模块 `MsgCmd`；未路由 9 条；子卡 2 个；看板状态：服务端完成（10508 登录槽与部分二进制载荷待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-MSG-S1` | 10501-10507 | `req_send_msg`<br>`req_enter_channel`<br>`req_leave_channel`<br>`req_msg_role_info`<br>`req_msg_role_info_list`<br>`req_msg_range`<br>`req_get_channel_id_and_enter` | 7 | 6/1 | 3 |
| `SOC-MSG-S2` | 10508-10511 | `req_get_login_data`<br>`req_msg_cross_data`<br>`req_log_send_msg`<br>`req_tips_look_player` | 4 | 3/1 | 2 |

### SOC-CHAT：世界、公会、私聊、跨服聊天与设置

- 协议模块 `ChatCmd`；未路由 10 条；子卡 2 个；看板状态：服务端完成（公会/跨服/封禁/点赞 fail closed）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-CHAT-S1` | 11000-11003 | `req_send_chat_msg_to_world`<br>`req_send_chat_msg_to_guild`<br>`req_send_chat_msg_to_role`<br>`req_send_multi_server_msg` | 4 | 0/4 | 0 |
| `SOC-CHAT-S2` | 11006-11014 | `req_cancel_ban`<br>`req_banned_self`<br>`req_change_chat_setting`<br>`req_remove_private_target`<br>`req_chat_report`<br>`req_chat_msg_like` | 6 | 4/2 | 0 |

### SOC-FRIEND：好友、申请、黑名单、友情赠送与领取

- 协议模块 `FriendCmd`；未路由 13 条；子卡 4 个；看板状态：服务端完成（20012/20013 语义与友情点结算证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-FRIEND-S1` | 20001-20004 | `req_apply_friends`<br>`req_agree_friend_applies`<br>`req_refuse_friend_applies` | 3 | 3/0 | 0 |
| `SOC-FRIEND-S2` | 20002-20006 | `req_remove_friend`<br>`req_add_to_blacklist`<br>`req_remove_from_blacklist` | 3 | 3/0 | 0 |
| `SOC-FRIEND-S3` | 20007-20010 | `req_present_friendship`<br>`req_receive_friendship`<br>`req_query_friend`<br>`req_recommend_friend_list` | 4 | 4/0 | 2 |
| `SOC-FRIEND-S4` | 20011-20013 | `req_one_key_present_and_rev`<br>`req_friend_recommend_types`<br>`req_friend_save_report` | 3 | 3/0 | 0 |

### SOC-GUILD：公会创建、申请、推荐、捐献、日志与奖励

- 协议模块 `GuildCmd`；未路由 24 条；子卡 5 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILD-S1` | 21001-21008 | `req_create_guild`<br>`req_apply_join_guild`<br>`req_handle_applies`<br>`req_recommends`<br>`req_change_base_info` | 5 | 2/3 | 1 |
| `SOC-GUILD-S2` | 21012-21015 | `req_search_guild`<br>`req_dissolve_guild`<br>`req_impeach_president`<br>`req_send_recruit` | 4 | 3/1 | 0 |
| `SOC-GUILD-S3` | 21016-21019 | `req_contribute`<br>`req_receive_act_box`<br>`req_rename_guild_because_force`<br>`req_guild_log` | 4 | 4/0 | 1 |
| `SOC-GUILD-S4` | 21020-21031 | `req_guild_level_award`<br>`req_guild_box_award`<br>`req_get_pay_record`<br>`req_guild_pay_award`<br>`req_guild_notice_change_read` | 5 | 5/0 | 1 |
| `SOC-GUILD-S5` | 21021-21028 | `req_rename_guild_normal`<br>`req_set_guild_social_stamp`<br>`req_guild_enter_scene`<br>`req_guild_send_notice_mail`<br>`req_guild_set_read_transfer`<br>`req_guild_set_distribution_ratio` | 6 | 4/2 | 0 |

### SOC-GUILDACTIVE：公会活跃任务、积分与解散状态

- 协议模块 `GuildActiveCmd`；未路由 6 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDACTIVE-S1` | 21027-85503 | `req_guild_special_task_award`<br>`req_guild_active_award`<br>`req_guild_active_finish_award` | 3 | 1/2 | 0 |
| `SOC-GUILDACTIVE-S2` | 85502-85505 | `req_guild_active_point`<br>`req_guild_auto_dissolve_read`<br>`req_guild_pre_auto_dissolve_read` | 3 | 3/0 | 0 |

### SOC-SUPPORT：玩家助力与被助力记录

- 协议模块 `SupportCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-SUPPORT-S1` | 46001-46002 | `req_support_player`<br>`req_get_supported` | 2 | 2/0 | 1 |

### SOC-REALTIMEMAP：实时地图进出、移动、复活与传送

- 协议模块 `RealtimeMapCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-REALTIMEMAP-S1` | 75001-75005 | `req_realtime_map_enter`<br>`req_realtime_map_leave`<br>`req_realtime_map_back_born`<br>`req_realtime_map_move`<br>`req_realtime_map_teleport_to_loc` | 5 | 2/3 | 0 |

### SOC-COMMENT：英雄评论、点赞与评分

- 协议模块 `CommentCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-COMMENT-S1` | 76601-76605 | `req_comment_init_hero`<br>`req_comment_add_like_count`<br>`req_comment_add`<br>`req_comment_set_score`<br>`req_comment_role_score_info` | 5 | 2/3 | 2 |

### SOC-RELATIONSHIP：关系标记与通知

- 协议模块 `RelationshipCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-RELATIONSHIP-S1` | 77501-77503 | `req_relationship_mark`<br>`req_relationship_unmark`<br>`req_relationship_set_no_notify` | 3 | 1/2 | 0 |

### SOC-ADVENTURE：冒险玩家列表

- 协议模块 `AdventureCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-ADVENTURE-S1` | 77601 | `req_adventure_role_list` | 1 | 1/0 | 1 |

### SOC-STRATEGY：英雄攻略排行

- 协议模块 `StrategyCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-STRATEGY-S1` | 79201 | `req_hero_strategy_ranks` | 1 | 1/0 | 0 |

### SOC-GUILDREDENVELOPE：公会红包

- 协议模块 `GuildRedEnvelopeCmd`；未路由 8 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDREDENVELOPE-S1` | 83101-83104 | `req_guild_red_envelope_fetch`<br>`req_guild_red_envelope_send`<br>`req_guild_red_envelope_get_data`<br>`req_guild_red_envelope_create` | 4 | 3/1 | 1 |
| `SOC-GUILDREDENVELOPE-S2` | 83105-83108 | `req_guild_red_envelop_show_log`<br>`req_guild_red_envelop_thanks`<br>`req_guild_red_envelop_rank`<br>`req_guild_red_envelop_fetch_join` | 4 | 3/1 | 2 |

### SOC-GUILDTRIAL：公会试炼、求助、助战与奖励

- 协议模块 `GuildTrialCmd`；未路由 11 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDTRIAL-S1` | 83401-83406 | `req_guild_trial_help_info`<br>`req_guild_trial_set_notice`<br>`req_guild_trial_gain_pass_award`<br>`req_guild_trial_gain_box_award` | 4 | 3/1 | 1 |
| `SOC-GUILDTRIAL-S2` | 83402-83411 | `req_guild_trial_help_log`<br>`req_guild_trial_help`<br>`req_guild_trial_gain_fight_log`<br>`req_guild_trial_rev_fail`<br>`req_guild_trial_suppress`<br>`req_guild_trial_read_help_log`<br>`req_guild_trial_thank_help` | 7 | 5/2 | 3 |

### SOC-DANMAKU：弹幕点赞

- 协议模块 `DanmakuCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-DANMAKU-S1` | 84701 | `req_like_danmuku` | 1 | 0/1 | 0 |

### SOC-GUILDEXPLORE：公会探索、地图、BOSS、任务与图鉴

- 协议模块 `GuildExploreCmd`；未路由 28 条；子卡 5 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDEXPLORE-S1` | 89301-89324 | `req_guild_explore_pick_up_box`<br>`req_guild_explore_pick_up_person_box`<br>`req_guild_explore_get_game_award`<br>`req_guild_explore_handbook_active`<br>`req_guild_explore_handbook_level_award`<br>`req_guild_explore_pre_box`<br>`req_guild_explore_boss_box` | 7 | 6/1 | 1 |
| `SOC-GUILDEXPLORE-S2` | 89303-89308 | `req_guild_explore_portal`<br>`req_guild_explore_move`<br>`req_guild_wish`<br>`req_guild_explore_play_game`<br>`req_guild_explore_finish_game` | 5 | 1/4 | 0 |
| `SOC-GUILDEXPLORE-S3` | 89305-89323 | `req_guild_explore_task`<br>`req_guild_explore_camp`<br>`req_guild_explore_receive_build_level`<br>`req_guild_explore_camp_stat`<br>`req_guild_explore_buy_goods`<br>`req_guild_explore_guide_task`<br>`req_guild_explore_person_task` | 7 | 6/1 | 0 |
| `SOC-GUILDEXPLORE-S4` | 89312-89328 | `req_guild_explore_atk_boss`<br>`req_guild_explore_pre_finish`<br>`req_guild_explore_boss_sweep` | 3 | 3/0 | 0 |
| `SOC-GUILDEXPLORE-S5` | 89317-893289 | `req_guild_explore_unlock_portal`<br>`req_guild_explore_join_wolf`<br>`req_guild_explore_rev_wolf`<br>`req_guild_explore_boss_unlock`<br>`req_guild_explore_boss_enter`<br>`req_guild_explore_boss_box_list` | 6 | 6/0 | 1 |

### SOC-GUILDEXPLORETRIAL：公会探索试炼

- 协议模块 `GuildExploreTrialCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDEXPLORETRIAL-S1` | 89351-89352 | `req_guild_explore_trial_receive`<br>`req_guild_explore_trial_member` | 2 | 2/0 | 0 |

### SOC-GUILDWAR：公会战、集结、竞猜与排行奖励

- 协议模块 `GuildWarCmd`；未路由 14 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDWAR-S1` | 90001-90006 | `req_guild_war_guess`<br>`req_guild_war_guess_receive`<br>`req_guild_war_set_gather_loc`<br>`req_guild_war_set_gather_role` | 4 | 3/1 | 0 |
| `SOC-GUILDWAR-S2` | 90007-90013 | `req_guild_war_fight`<br>`req_guild_war_fight_offline`<br>`req_guild_war_update_entry`<br>`req_guild_war_guess_data`<br>`req_guild_war_receive_rank`<br>`req_guild_war_person`<br>`req_guild_war_fight_monster` | 7 | 4/3 | 1 |
| `SOC-GUILDWAR-S3` | 90014-90016 | `req_guild_war_host`<br>`req_guild_war_host_cancel`<br>`req_guild_war_share` | 3 | 3/0 | 0 |

### SOC-GUILDDUEL：公会对决、匹配与轮次奖励

- 协议模块 `GuildDuelCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDDUEL-S1` | 90701-90704 | `req_guild_duel_match_data`<br>`req_guild_duel_receive_round`<br>`req_guild_duel_receive_level`<br>`req_guild_duel_fast_fight` | 4 | 4/0 | 0 |
| `SOC-GUILDDUEL-S2` | 90705-90707 | `req_guild_duel_read_report`<br>`req_guild_duel_read_record`<br>`req_guild_duel_match_zone` | 3 | 3/0 | 0 |

### SOC-GUILDRACING：公会竞速、支援、BUFF 投票与积分

- 协议模块 `GuildRacingCmd`；未路由 9 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDRACING-S1` | 91201-91208 | `req_attend`<br>`req_support`<br>`req_use_buff`<br>`req_vote_buff`<br>`req_role_list`<br>`req_guild_racing_rev_buff` | 6 | 5/1 | 1 |
| `SOC-GUILDRACING-S2` | 91206-91209 | `req_guild_racing_rev_award`<br>`req_guild_racing_score_info`<br>`req_guild_racing_rev_score_award` | 3 | 3/0 | 2 |

### SOC-GUILDBOSS：公会 BOSS、伤害奖励与技能物品

- 协议模块 `GuildBossCmd`；未路由 12 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDBOSS-S1` | 91301-91310 | `req_guild_boss_enter_map`<br>`req_guild_boss_leave_map`<br>`req_claim_boss_dmg_award`<br>`req_batch_claim_boss_award`<br>`req_claim_boss_use_skill_award`<br>`req_claim_guild_boss_online_award` | 6 | 4/2 | 0 |
| `SOC-GUILDBOSS-S2` | 91303-91312 | `req_guild_boss_use_skill`<br>`req_claim_daily_free_skill_item`<br>`req_claim_guild_boss_box`<br>`req_join_guild_boss`<br>`req_buy_guild_boss_item`<br>`req_guild_boss_guild_info` | 6 | 5/1 | 1 |

### SOC-GUILDJOINT：公会联合探索与资源争夺

- 协议模块 `GuildJointCmd`；未路由 25 条；子卡 6 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDJOINT-S1` | 91601-91614 | `req_guild_joint_pick_box`<br>`req_guild_joint_pick_lode`<br>`req_guild_joint_task`<br>`req_guild_joint_rev_lode`<br>`req_guild_joint_single_box` | 5 | 5/0 | 0 |
| `SOC-GUILDJOINT-S2` | 91602-91623 | `req_guild_joint_pick_monster`<br>`req_guild_joint_single_monster`<br>`req_guild_joint_enter_single`<br>`req_guild_joint_single_settle`<br>`req_guild_joint_cancel_monster`<br>`req_guild_joint_calc_monster` | 6 | 6/0 | 0 |
| `SOC-GUILDJOINT-S3` | 91603-91616 | `req_guild_joint_pick_door`<br>`req_guild_joint_cancel_door`<br>`req_guild_joint_fight_report`<br>`req_guild_joint_single_door`<br>`req_guild_joint_calc_door` | 5 | 5/0 | 0 |
| `SOC-GUILDJOINT-S4` | 91607-91617 | `req_get_role_rank`<br>`req_guild_joint_get_info`<br>`req_guild_joint_settle_rank` | 3 | 3/0 | 3 |
| `SOC-GUILDJOINT-S5` | 91608-91624 | `req_guild_joint_set_pioneer`<br>`req_guild_joint_set_focus`<br>`req_guild_joint_set_auto` | 3 | 2/1 | 0 |
| `SOC-GUILDJOINT-S6` | 91620-91625 | `req_guild_joint_single_cancel`<br>`req_guild_joint_share`<br>`req_guild_joint_one_get` | 3 | 2/1 | 1 |

### SOC-GUILDRUNESTONE：公会符石穿脱与合成

- 协议模块 `GuildRuneStoneCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDRUNESTONE-S1` | 92701-92703 | `req_guild_rune_stone_take_on`<br>`req_guild_rune_stone_take_off`<br>`req_guild_rune_stone_compose` | 3 | 0/3 | 0 |

### SOC-GUILDGVG：公会 GVG 地图、矿点与据点争夺

- 协议模块 `GuildGVGCmd`；未路由 18 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDGVG-S1` | 97001-97004 | `req_guild_gvg_pick_box`<br>`req_guild_gvg_pick_lode`<br>`req_guild_gvg_attack_lode`<br>`req_guild_gvg_rev_lode` | 4 | 2/2 | 0 |
| `SOC-GUILDGVG-S2` | 97005-97017 | `req_guild_gvg_pick_monster`<br>`req_guild_gvg_rev_monster`<br>`req_guild_gvg_cancel_monster` | 3 | 1/2 | 0 |
| `SOC-GUILDGVG-S3` | 97007-97018 | `req_guild_gvg_pick_block`<br>`req_guild_gvg_focus`<br>`req_guild_gvg_task`<br>`req_guild_gvg_unlock_portal`<br>`req_guild_gvg_portal`<br>`req_guild_gvg_cancel_block`<br>`req_guild_gvg_leave_hold`<br>`req_guild_gvg_leave_hold_fight` | 8 | 3/5 | 0 |
| `SOC-GUILDGVG-S4` | 97008-97010 | `req_guild_gvg_pick_hold`<br>`req_guild_gvg_pvp`<br>`req_guild_gvg_defense_hold` | 3 | 1/2 | 0 |

### SOC-GUILDVOTE：公会投票

- 协议模块 `GuildVoteCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDVOTE-S1` | 98702-99701 | `req_guild_vote_vote`<br>`req_guild_vote_start` | 2 | 1/1 | 0 |

### SOC-SLGMAP：SLG 地图视野与进出

- 协议模块 `SlgMapCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-SLGMAP-S1` | 99100-99102 | `req_slg_map_add_block_view`<br>`req_slg_map_enter`<br>`req_slg_map_leave` | 3 | 2/1 | 0 |

### SOC-GUILDNATION：公会国战、建造、兵种、科技、行军与据点

- 协议模块 `GuildNationCmd`；未路由 64 条；子卡 12 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDNATION-S1` | 99200-99204 | `req_guild_nation_go_attack`<br>`req_guild_nation_role_build`<br>`req_guild_nation_soldier_up`<br>`req_guild_nation_queue_unlock` | 4 | 1/3 | 0 |
| `SOC-GUILDNATION-S2` | 99202-99224 | `req_guild_nation_spawn_soldier`<br>`req_guild_nation_read_report`<br>`req_guild_nation_delete_report`<br>`req_guild_nation_recv_report`<br>`req_guild_nation_assign_soldier` | 5 | 2/3 | 0 |
| `SOC-GUILDNATION-S3` | 99205-99239 | `req_guild_nation_build_cancel`<br>`req_guild_nation_update_red_dot`<br>`req_guild_nation_team_recall`<br>`req_guild_nation_soldier_cancel`<br>`req_guild_nation_defense_use_protect`<br>`req_guild_nation_defense_extinguish`<br>`req_guild_nation_defense_repair_city`<br>`req_guild_nation_repair_cancel` | 8 | 8/0 | 0 |
| `SOC-GUILDNATION-S4` | 99206-99243 | `req_guild_nation_gem_acc`<br>`req_guild_nation_item_acc`<br>`req_guild_nation_study_gem_acc`<br>`req_guild_nation_study_item_acc`<br>`req_guild_nation_build_free_acc`<br>`req_guild_nation_soldier_gem_acc`<br>`req_guild_nation_soldier_item_acc`<br>`req_guild_nation_march_acc` | 8 | 4/4 | 0 |
| `SOC-GUILDNATION-S5` | 99211-99261 | `req_guild_nation_report_list`<br>`req_guild_nation_finish_task`<br>`req_guild_nation_finish_phase_task`<br>`req_guild_nation_repair_map_core`<br>`req_guild_nation_map_obj_search`<br>`req_guild_nation_muster_info_list`<br>`req_guild_nation_guild_battle_list` | 7 | 6/1 | 3 |
| `SOC-GUILDNATION-S6` | 99212-99260 | `req_guild_nation_technology_study`<br>`req_guild_nation_cancel_study`<br>`req_guild_nation_finish_study`<br>`req_guild_nation_free_finish_study` | 4 | 3/1 | 0 |
| `SOC-GUILDNATION-S7` | 99227-99256 | `req_guild_nation_donate_guild_tech`<br>`req_guild_nation_recommend_guild_tech`<br>`req_guild_nation_up_lv_guild_tech` | 3 | 2/1 | 0 |
| `SOC-GUILDNATION-S8` | 99228-99232 | `req_guild_nation_power`<br>`req_guild_nation_send_assist`<br>`req_guild_nation_assist`<br>`req_guild_nation_soldier_item_raise_num` | 4 | 1/3 | 0 |
| `SOC-GUILDNATION-S9` | 99234-99238 | `req_guild_nation_move_guild_base`<br>`req_guild_nation_move_role_base`<br>`req_guild_nation_repair_city_acc_item`<br>`req_guild_nation_repair_city_acc_gem` | 4 | 3/1 | 0 |
| `SOC-GUILDNATION-S10` | 99236-99264 | `req_guild_nation_defense_defense_return`<br>`req_guild_nation_call_muster`<br>`req_guild_nation_answer_muster`<br>`req_guild_nation_set_flag`<br>`req_guild_nation_move_flag`<br>`req_guild_nation_cancle_muster`<br>`req_guild_nation_guild_base_return` | 7 | 1/6 | 0 |
| `SOC-GUILDNATION-S11` | 99242-99263 | `req_guild_nation_other_role_info`<br>`req_guild_nation_study_gem_finish`<br>`req_guild_nation_map_obj_info`<br>`req_guild_nation_hold_map_obj_info`<br>`req_guild_nation_hold_sign_num_info` | 5 | 5/0 | 4 |
| `SOC-GUILDNATION-S12` | 99250-99258 | `req_guild_nation_stronghold_award`<br>`req_guild_nation_stronghold_honor_award`<br>`req_guild_nation_stronghold_capture_award`<br>`req_guild_nation_stronghold_sign`<br>`req_guild_nation_stronghold_battle_award` | 5 | 3/2 | 0 |

### SOC-GUILDBARGAIN：公会砍价

- 协议模块 `GuildBargainCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDBARGAIN-S1` | 101401-101404 | `req_guild_bargain_info`<br>`req_guild_bargain`<br>`req_guild_bargain_buy`<br>`req_guild_not_bargain_list` | 4 | 1/3 | 2 |

### SOC-GUILDEXPEDITION：公会远征、宣战、鼓舞、竞猜与地图排名

- 协议模块 `GuildExpeditionCmd`；未路由 15 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDEXPEDITION-S1` | 101601-101613 | `req_guild_expedition_server_info`<br>`req_guild_expedition_guess_info`<br>`req_guild_expedition_guess`<br>`req_guild_expedition_guild_info` | 4 | 3/1 | 3 |
| `SOC-GUILDEXPEDITION-S2` | 101602-101604 | `req_guild_expedition_declare`<br>`req_guild_expedition_inspire`<br>`req_guild_expedition_fight_report` | 3 | 3/0 | 0 |
| `SOC-GUILDEXPEDITION-S3` | 101605-101607 | `req_guild_expedition_city_rank`<br>`req_guild_expedition_guild_inner_rank`<br>`req_guild_expedition_build_rank` | 3 | 3/0 | 3 |
| `SOC-GUILDEXPEDITION-S4` | 101610-101615 | `req_guild_expedition_city_pos_list`<br>`req_guild_expedition_build_pos_list`<br>`req_guild_expedition_like`<br>`req_guild_expedition_grass`<br>`req_guild_expedition_city_info_list` | 5 | 4/1 | 3 |

### SOC-CHANNELENTRY：频道入口业务

- 协议模块 `ChannelEntryCmd`；未路由 0 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-CHANNELENTRY-S1` | 102801 | `req_channel_entry` | 1 | 1/0 | 0 |

### SOC-GUILDHUNT：公会狩猎参与与支援

- 协议模块 `GuildHuntCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDHUNT-S1` | 103401-103403 | `req_guild_hunt_attend`<br>`req_guild_hunt_support`<br>`req_guild_hunt_server_info` | 3 | 3/0 | 1 |

### SOC-GUILDCRUSADE：公会讨伐排名

- 协议模块 `GuildCrusadeCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDCRUSADE-S1` | 105805 | `req_guild_crusade_get_rank` | 1 | 1/0 | 1 |

### SOC-GUILDAUCTION：公会拍卖、心愿与领取

- 协议模块 `GuildAuctionCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `SOC-GUILDAUCTION-S1` | 107601-107603 | `req_guild_auction_bid`<br>`req_guild_auction_wish`<br>`req_guild_auction_get` | 3 | 1/2 | 1 |

## 06-draw-activities.md

### DRAW-MAGICDRAW：魔法招募选人、成就与升星奖励

- 协议模块 `MagicDrawCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-MAGICDRAW-S1` | 60002-60004 | `req_magic_draw_choose_hero`<br>`req_magic_draw_achieve_award`<br>`req_magic_draw_hero_star_award` | 3 | 3/0 | 0 |

### DRAW-PINBALL：弹珠活动成就

- 协议模块 `PinBallCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-PINBALL-S1` | 88921 | `req_pin_ball_act_achieve_award` | 1 | 1/0 | 0 |

### DRAW-FANTASYEQUIPACT：幻武活动管道小游戏、任务与试炼闭环

- 协议模块 `FantasyEquipActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-FANTASYEQUIPACT-S1` | 88925-88926 | `req_pipe_connect_reset`<br>`req_pipe_connect_play` | 2 | 1/1 | 0 |

### DRAW-PYRAMID：金字塔抽取与任务

- 协议模块 `PyramidCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-PYRAMID-S1` | 88941-88942 | `req_pyramid_draw`<br>`req_pyramid_task` | 2 | 2/0 | 0 |

### DRAW-THREEADMONITION：三诫抽取、宝箱、次数与入场

- 协议模块 `ThreeAdmonitionCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-THREEADMONITION-S1` | 88961-88966 | `req_three_admonition_draw`<br>`req_three_admonition_rev_box_award`<br>`req_three_admonition_add_draw_count`<br>`req_three_admonition_enter_act` | 4 | 4/0 | 0 |

### DRAW-HUNDREDBONUS：百倍奖励随机、领取与日志

- 协议模块 `HundredBonusCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-HUNDREDBONUS-S1` | 89401-89403 | `req_hundred_bonus_random`<br>`req_hundred_bonus_award`<br>`req_hundred_bonus_log` | 3 | 3/0 | 1 |

### DRAW-WISHTREE：许愿树宝藏及已有抽取链路

- 协议模块 `WishTreeCmd`；未路由 0 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-WISHTREE-S1` | 91703 | `req_wish_tree_rev_treasure` | 1 | 1/0 | 0 |

### DRAW-CHESS：棋盘抽取、任务、自选、轮次与兑换

- 协议模块 `ChessCmd`；未路由 6 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-CHESS-S1` | 91901-91906 | `req_chess_draw`<br>`req_chess_task`<br>`req_chess_choose_award`<br>`req_chess_new_turn`<br>`req_chess_exchange`<br>`req_chess_turn_award` | 6 | 2/4 | 0 |

### DRAW-RAFFLETICKET：奖券成就

- 协议模块 `RaffleTicketCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-RAFFLETICKET-S1` | 92101 | `req_raffle_ticket_achievement` | 1 | 1/0 | 0 |

### DRAW-HEROBLAZONDRAW：英雄纹章抽取

- 协议模块 `HeroBlazonDrawCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-HEROBLAZONDRAW-S1` | 92201 | `req_hero_blazon_draw` | 1 | 0/1 | 0 |

### DRAW-LOTTERYACT：抽奖活动与奖品日志

- 协议模块 `LotteryActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-LOTTERYACT-S1` | 92301-92302 | `req_lottery_act_draw`<br>`req_lottery_act_award_log` | 2 | 2/0 | 1 |

### DRAW-MYSTERYWISH：神秘心愿兑换

- 协议模块 `MysteryWishCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-MYSTERYWISH-S1` | 93001 | `req_mystery_wish_exchange` | 1 | 1/0 | 0 |

### DRAW-LOTTERY：彩票抽取与过期处理

- 协议模块 `LotteryCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-LOTTERY-S1` | 93101-93102 | `req_lottery`<br>`req_lottery_expire` | 2 | 1/1 | 0 |

### DRAW-FLIPCARD：翻牌与轮次

- 协议模块 `FlipCardCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-FLIPCARD-S1` | 97201-97301 | `req_flip_card_turn`<br>`req_flip_card` | 2 | 0/2 | 0 |

### DRAW-TICKETDRAW：票券抽奖领奖与历史

- 协议模块 `TicketDrawCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-TICKETDRAW-S1` | 97501-97502 | `req_ticket_draw_rev_award`<br>`req_ticket_draw_query_history` | 2 | 2/0 | 1 |

### DRAW-FRUITDRAWACT：水果抽奖

- 协议模块 `FruitDrawActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-FRUITDRAWACT-S1` | 97901-97902 | `req_fruit_draw_big`<br>`req_fruit_draw` | 2 | 2/0 | 0 |

### DRAW-DRAW：通用抽取心愿选择

- 协议模块 `DrawCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-DRAW-S1` | 98101 | `req_draw_choose_wish` | 1 | 0/1 | 0 |

### DRAW-ELVESACT：精灵活动主精灵、果实抽取与奖励

- 协议模块 `ElvesActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-ELVESACT-S1` | 100901-100903 | `req_main_elves_tid`<br>`req_cur_fruit_draw_act`<br>`req_elves_draw_award` | 3 | 2/1 | 0 |

### DRAW-BONUSDRAW：奖励抽取、切换与选池

- 协议模块 `BonusDrawCmd`；未路由 3 条；子卡 1 个；看板状态：服务端完成（概率与折算语义证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-BONUSDRAW-S1` | 101901-101904 | `req_bonus_draw`<br>`req_bonus_draw_switch`<br>`req_bonus_choose_pool` | 3 | 1/2 | 0 |

### DRAW-CAPSULETOY：扭蛋、兑换、收集与进度

- 协议模块 `CapsuleToyCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-CAPSULETOY-S1` | 102301-102304 | `req_capsule_toy_draw`<br>`req_capsule_toy_exchange`<br>`req_capsule_toy_collect`<br>`req_capsule_toy_progress` | 4 | 3/1 | 0 |

### DRAW-CHESSREVERT：棋盘翻转轮次、自选礼物与换轮

- 协议模块 `ChessRevertCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-CHESSREVERT-S1` | 102401-102403 | `req_chess_revert_turn_award`<br>`req_chess_revert_act_select_gift`<br>`req_chess_revert_next_turn` | 3 | 0/3 | 0 |

### DRAW-CHILDPUZZLEACT：拼图抽取、自选、任务与换轮

- 协议模块 `ChildPuzzleActCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-CHILDPUZZLEACT-S1` | 103301-103305 | `req_puzzle_draw`<br>`req_puzzle_award`<br>`req_puzzle_change_turn`<br>`req_puzzle_task_award`<br>`req_puzzle_select_award` | 5 | 3/2 | 0 |

### DRAW-HOARDWHEELACT：囤积转盘奖池、任务与累计

- 协议模块 `HoardWheelActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-HOARDWHEELACT-S1` | 103501-103503 | `req_hoard_wheel_set_pool`<br>`req_hoard_wheel_task`<br>`req_hoard_wheel_pile` | 3 | 0/3 | 0 |

### DRAW-THOUSANDDRAW：千抽与领奖

- 协议模块 `ThousandDrawCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-THOUSANDDRAW-S1` | 104501-104502 | `req_thousand_draw`<br>`req_thousand_award` | 2 | 0/2 | 0 |

### DRAW-PRAYACT：祈愿自选与抽取

- 协议模块 `PrayActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-PRAYACT-S1` | 104901-104902 | `req_pray_act_select_award`<br>`req_pray_act_draw_award` | 2 | 0/2 | 0 |

### DRAW-CASHBACKDRAW：返利抽奖、次数、全服奖励与进度

- 协议模块 `CashbackDrawCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-CASHBACKDRAW-S1` | 105501-105504 | `req_cashback_draw_draw`<br>`req_cashback_draw_get_times`<br>`req_cashback_draw_server_award`<br>`req_cashback_draw_server_progress` | 4 | 0/4 | 1 |

### DRAW-TURNTABLEACT：转盘活动

- 协议模块 `TurntableActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-TURNTABLEACT-S1` | 107901 | `req_turntable_act_go` | 1 | 1/0 | 0 |

### DRAW-FLOPCARDACT：翻牌、单次与累计奖励

- 协议模块 `FlopCardActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-FLOPCARDACT-S1` | 109101-109103 | `req_flop_card_flop`<br>`req_flop_card_get_reward`<br>`req_flop_card_get_total_reward` | 3 | 0/3 | 2 |

### DRAW-HUNDREDDRAWACT：百抽、进度奖、自选、升星奖与跑马灯

- 协议模块 `HundredDrawActCmd`；未路由 4 条；子卡 1 个；看板状态：服务端完成（保底选择与非英雄星级奖证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `DRAW-HUNDREDDRAWACT-S1` | 117001-117005 | `req_hundred_act_draw`<br>`req_hundred_act_receive_process_award`<br>`req_hundred_draw_act_select_award`<br>`req_hundred_draw_act_rec_star_award`<br>`req_hundred_draw_act_marquee` | 5 | 0/5 | 0 |

## 07-exploration-minigames.md

### PLAY-HOMEPUZZLEACT：家园拼图、赠送求助、分解与进度

- 协议模块 `HomePuzzleActCmd`；未路由 9 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-HOMEPUZZLEACT-S1` | 11408-11418 | `req_home_puzzle_task_reward`<br>`req_home_puzzle_gift`<br>`req_home_puzzle_decompose`<br>`req_home_puzzle_rec_process_award`<br>`req_home_puzzle_rec_friend_gift_piece` | 5 | 0/5 | 0 |
| `PLAY-HOMEPUZZLEACT-S2` | 11410-11420 | `req_home_puzzle_request`<br>`req_home_puzzle_get_friend_request_data`<br>`req_home_puzzle_open_pack`<br>`req_home_puzzle_cancel_request` | 4 | 0/4 | 1 |

### PLAY-HOMELANDACT：家园活动选人、任务、装修与清理

- 协议模块 `HomelandActCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-HOMELANDACT-S1` | 11501-11505 | `req_homeland_act_select_hero`<br>`req_homeland_act_task_award`<br>`req_homeland_act_decorate`<br>`req_homeland_act_clear_room` | 4 | 0/4 | 0 |

### PLAY-CARNIVAL：嘉年华大富翁、骰子、事件、建筑与科技

- 协议模块 `CarnivalCmd`；未路由 15 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-CARNIVAL-S1` | 43003-43010 | `req_carnival_use_item`<br>`req_carnival_throw_dice`<br>`req_carnival_touch_event`<br>`req_carnival_finish_event`<br>`req_carnival_auto_flush_dice` | 5 | 5/0 | 0 |
| `PLAY-CARNIVAL-S2` | 43014-43019 | `req_carnival_buy_dice`<br>`req_carnival_latest_data`<br>`req_monopoly_build`<br>`req_monopoly_build_up_level` | 4 | 4/0 | 0 |
| `PLAY-CARNIVAL-S3` | 43017-43024 | `req_get_achieve_award`<br>`req_mono_get_build_award`<br>`req_mono_develop_tech`<br>`req_carnival_build_dispatch`<br>`req_carnival_box_award`<br>`req_handle_build_extra` | 6 | 4/2 | 2 |

### PLAY-THEMETREASURE：主题寻宝、挑战、兑换与全服奖励

- 协议模块 `ThemeTreasureCmd`；未路由 12 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-THEMETREASURE-S1` | 76501-76506 | `theme_treasure_hunt_req`<br>`theme_treasure_challenge_req`<br>`theme_treasure_server_challenge_req`<br>`theme_treasure_exchange_req`<br>`theme_treasure_challenge_turn_req`<br>`theme_treasure_target_req` | 6 | 2/4 | 0 |
| `PLAY-THEMETREASURE-S2` | 76507-76512 | `theme_treasure_task_award_req`<br>`theme_treasure_turn_award_req`<br>`theme_treasure_server_award_req`<br>`theme_treasure_special_award_req`<br>`theme_treasure_daily_award_req`<br>`req_theme_treasure_server` | 6 | 6/0 | 0 |

### PLAY-MINIGAME：通用小游戏、结算与老虎机重试

- 协议模块 `MiniGameCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-MINIGAME-S1` | 83701-83704 | `req_mini_game_settle`<br>`req_mini_game_enter`<br>`req_slot_machine_retry`<br>`req_mini_game_handle` | 4 | 1/3 | 0 |

### PLAY-TREASUREHUNT：寻宝、铲子购买、合成、删除与刷新

- 协议模块 `TreasureHuntCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-TREASUREHUNT-S1` | 85601-85607 | `req_treasure_hunt`<br>`req_treasure_hunt_buy_shovel`<br>`req_treasure_hunt_compose`<br>`req_treasure_hunt_auto_compose` | 4 | 3/1 | 0 |
| `PLAY-TREASUREHUNT-S2` | 85608-85610 | `req_treasure_hunt_delete_shovel`<br>`req_treasure_hunt_exchange_shovel`<br>`req_treasure_hunt_refresh` | 3 | 2/1 | 0 |

### PLAY-GRANDTOURER：旅行令牌、任务、兑换、里程与强化

- 协议模块 `GrandTourerCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-GRANDTOURER-S1` | 87801-87805 | `req_grand_tourer_get_token`<br>`req_grand_tourer_task_award`<br>`req_grand_tourer_exchange_token`<br>`req_grand_tourer_distance_award`<br>`req_grand_tourer_enhance` | 5 | 5/0 | 1 |

### PLAY-DREAM：梦境事件、日周奖、收集、宝箱与 NPC 阵容

- 协议模块 `DreamCmd`；未路由 10 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-DREAM-S1` | 88001-88009 | `req_dream_finish_event`<br>`req_dream_day_award`<br>`req_dream_week_finish_award`<br>`req_dream_all_finish_award`<br>`req_dream_finish_task`<br>`req_dream_collect_award`<br>`req_dream_box_award`<br>`req_dream_single_collect_award` | 8 | 7/1 | 0 |
| `PLAY-DREAM-S2` | 88008-88010 | `req_dream_npc_lineup`<br>`req_dream_refresh_event` | 2 | 2/0 | 0 |

### PLAY-MAGICALJOURNEY：魔法旅程、国家养成、收藏、关卡与 BOSS

- 协议模块 `MagicalJourneyCmd`；未路由 17 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-MAGICALJOURNEY-S1` | 89901-89904 | `req_magical_journey_sword`<br>`req_magical_journey_country_main_up`<br>`req_magical_journey_country_sub_active`<br>`req_magical_journey_country_sub_up` | 4 | 2/2 | 0 |
| `PLAY-MAGICALJOURNEY-S2` | 89905-89907 | `req_magical_journey_sword_record`<br>`req_magical_journey_activate_normal_collect`<br>`req_magical_journey_activate_season_collect` | 3 | 1/2 | 0 |
| `PLAY-MAGICALJOURNEY-S3` | 89908-89913 | `req_magical_journey_mission_star_award`<br>`req_magical_journey_mission_task_award`<br>`req_magical_journey_mission_multi_fight`<br>`req_magical_journey_boss_multi_fight`<br>`req_magical_journey_chapter_progress_award`<br>`req_magical_journey_node_rank_award` | 6 | 4/2 | 1 |
| `PLAY-MAGICALJOURNEY-S4` | 89914-89917 | `req_magical_journey_mission_pass_info`<br>`req_magical_journey_star_skill_active`<br>`req_magical_journey_power`<br>`req_magical_journey_login_after` | 4 | 4/0 | 1 |

### PLAY-PETACTIVITY：超凡魔灵现世选择、挑战、好感、治疗与兑换

- 协议模块 `PetActivityCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-PETACTIVITY-S1` | 90501-90503 | `req_pet_act_select_pet`<br>`req_pet_act_claim_fight_rewards`<br>`req_pet_act_claim_likability_rewards` | 3 | 0/3 | 0 |
| `PLAY-PETACTIVITY-S2` | 90504-90507 | `req_pet_act_cure`<br>`req_pet_act_finish_cure`<br>`req_pet_rev_daily_vitality_rewards`<br>`req_pet_act_exchange` | 4 | 2/2 | 0 |

### PLAY-RADISHFARM：萝卜农场、事件、拜访与助力

- 协议模块 `RadishFarmCmd`；未路由 6 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-RADISHFARM-S1` | 90801-90806 | `req_radish_farm_start`<br>`req_radish_farm_event`<br>`req_radish_farm_cell_award`<br>`req_radish_farm_visit`<br>`req_radish_farm_help`<br>`req_radish_farm_select_gift` | 6 | 1/5 | 0 |

### PLAY-EXPERIENCEACT：历练出发与领奖

- 协议模块 `ExperienceActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-EXPERIENCEACT-S1` | 93801-93802 | `req_experience_go`<br>`req_experience_award` | 2 | 0/2 | 0 |

### PLAY-PUZZLEACT：拼图活动任务与进度

- 协议模块 `PuzzleActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-PUZZLEACT-S1` | 102001-102002 | `req_puzzle_act_finish_task`<br>`req_puzzle_act_progress_award` | 2 | 0/2 | 0 |

### PLAY-TILESWAP：换块小游戏换轮

- 协议模块 `TileSwapCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-TILESWAP-S1` | 102501 | `req_tile_swap_next_turn` | 1 | 1/0 | 0 |

### PLAY-MUSHROOMMONSTER：蘑菇怪开始、结束与领奖

- 协议模块 `MushroomMonsterCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-MUSHROOMMONSTER-S1` | 102601-102603 | `req_mushroom_start`<br>`req_mushroom_end`<br>`req_mushroom_award` | 3 | 3/0 | 0 |

### PLAY-GOPHERACT：打地鼠

- 协议模块 `GopherActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-GOPHERACT-S1` | 103201 | `req_beat_gopher` | 1 | 1/0 | 0 |

### PLAY-TOWERACT：爬塔活动前进、切换与任务

- 协议模块 `TowerActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-TOWERACT-S1` | 104301-104303 | `req_tower_act_step`<br>`req_tower_act_switch`<br>`req_tower_act_task` | 3 | 0/3 | 0 |

### PLAY-SPIRITCOURTYARD：灵庭种植、土地、合成、委托协作与宴会

- 协议模块 `SpiritCourtyardCmd`；未路由 16 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-SPIRITCOURTYARD-S1` | 105001-105004 | `req_spirit_courtyard_tree_plant`<br>`req_spirit_courtyard_tree_get`<br>`req_spirit_courtyard_add_land`<br>`req_spirit_courtyard_tree_remove` | 4 | 3/1 | 1 |
| `PLAY-SPIRITCOURTYARD-S2` | 105005-105016 | `req_spirit_courtyard_get_task_reward`<br>`req_spirit_courtyard_tree_change`<br>`req_spirit_courtyard_refresh_role_info`<br>`req_spirit_courtyard_intimacy_task_reward`<br>`req_spirit_courtyard_banquet_award`<br>`req_spirit_courtyard_use_item` | 6 | 2/4 | 2 |
| `PLAY-SPIRITCOURTYARD-S3` | 105006-105009 | `req_spirit_courtyard_update_task`<br>`req_spirit_courtyard_assist_entrust`<br>`req_spirit_courtyard_finish_guild_task` | 3 | 1/2 | 0 |
| `PLAY-SPIRITCOURTYARD-S4` | 105007-105013 | `req_spirit_courtyard_publish_collaboration`<br>`req_spirit_courtyard_tree_fruit_merge`<br>`req_spirit_courtyard_cancel_publish_collaboration` | 3 | 0/3 | 0 |

### PLAY-TRIPLEMATCH：三消换块、重开、道具与关卡奖励

- 协议模块 `TripleMatchCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-TRIPLEMATCH-S1` | 106001-106005 | `req_triple_match_swap_tile`<br>`req_triple_match_restart`<br>`req_triple_match_score_award`<br>`req_triple_match_use_item`<br>`req_triple_match_pass_stage_award` | 5 | 0/5 | 1 |

### PLAY-MATCHINGGAMEACT：配对小游戏抽签、卡牌与奖励

- 协议模块 `MatchingGameActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-MATCHINGGAMEACT-S1` | 107501-107503 | `req_matching_game_act_luck`<br>`req_matching_game_act_use_card`<br>`req_matching_game_award` | 3 | 1/2 | 0 |

### PLAY-MONOPOLYACT：大富翁事件、战斗、援助、公会任务与补给

- 协议模块 `MonopolyActCmd`；未路由 11 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-MONOPOLYACT-S1` | 107801-107809 | `req_monopoly_act_go`<br>`req_monopoly_act_get_live_award`<br>`req_monopoly_act_get_guild_task_award`<br>`req_monopoly_act_get_total_task_award`<br>`req_monopoly_act_day_award` | 5 | 1/4 | 3 |
| `PLAY-MONOPOLYACT-S2` | 107802-107811 | `req_monopoly_act_finish_fight_event`<br>`req_monopoly_act_get_supply`<br>`req_monopoly_act_fight_help`<br>`req_monopoly_act_get_guild_info`<br>`req_monopoly_act_jump_fight`<br>`req_monopoly_act_finish_firm` | 6 | 1/5 | 2 |

### PLAY-DREAMTRIALACT：梦境试炼抢夺与公会数据

- 协议模块 `DreamTrialActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-DREAMTRIALACT-S1` | 108001-108002 | `req_dream_trial_query_rob`<br>`req_dream_trial_guild_info` | 2 | 0/2 | 2 |

### PLAY-DIAMONDVEINACT：钻石矿脉地图、行动、战斗与公会排名

- 协议模块 `DiamondVeinActCmd`；未路由 9 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-DIAMONDVEINACT-S1` | 109001-109003 | `req_diamond_vein_act_get_map`<br>`req_diamond_vein_act_enter_map`<br>`req_diamond_vein_act_award` | 3 | 0/3 | 1 |
| `PLAY-DIAMONDVEINACT-S2` | 109004-109006 | `req_diamond_vein_act_buy_attack`<br>`req_diamond_vein_act_buy_action`<br>`req_diamond_vein_act_guild_focus` | 3 | 0/3 | 0 |
| `PLAY-DIAMONDVEINACT-S3` | 109007-109009 | `req_diamond_vein_act_guild_rank_info`<br>`req_diamond_vein_act_get_fight_record`<br>`req_diamond_vein_act_get_guild_info` | 3 | 3/0 | 3 |

### PLAY-SOURCEPOINT：源点变换、合成与任务

- 协议模块 `SourcePointCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-SOURCEPOINT-S1` | 110101-110103 | `req_source_point_change`<br>`req_source_point_combine`<br>`req_source_point_task_award` | 3 | 0/3 | 0 |

### PLAY-FISHINGACT：钓鱼剩余鱼竿、图鉴、奖励、记录与排名

- 协议模块 `FishingActCmd`；未路由 0 条；子卡 2 个；看板状态：服务端完成（记录筛选与活动结束结算证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-FISHINGACT-S1` | 110303-110308 | `req_fishing_act_get_fish_top`<br>`req_fishing_act_change_rod`<br>`req_fishing_act_get_record` | 3 | 2/1 | 2 |
| `PLAY-FISHINGACT-S2` | 110304-110310 | `req_fishing_act_book_award`<br>`req_fishing_act_level_award`<br>`req_fishing_act_up_rank_award`<br>`req_fishing_act_progress_award` | 4 | 1/3 | 1 |

### PLAY-ALBUM：家具、套装激活与套装奖励

- 协议模块 `AlbumCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-ALBUM-S1` | 110401-110403 | `req_furniture_active`<br>`req_furniture_suit_active`<br>`req_furniture_suit_award` | 3 | 3/0 | 0 |

### PLAY-HOMELAND：家园任务、拜访、点赞、升级、清洁与替换

- 协议模块 `HomelandCmd`；未路由 8 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-HOMELAND-S1` | 110904-110908 | `req_homeland_task_award`<br>`req_homeland_familiar_list`<br>`req_homeland_visit_list`<br>`req_homeland_visit`<br>`req_homeland_like` | 5 | 5/0 | 2 |
| `PLAY-HOMELAND-S2` | 110911-110913 | `req_homeland_level_up`<br>`req_homeland_clean_room`<br>`req_homeland_replace` | 3 | 2/1 | 0 |

### PLAY-BAKINGACT：烘焙合成、订单、蛋糕、事件、道具与整理

- 协议模块 `BakingActCmd`；未路由 15 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-BAKINGACT-S1` | 111001-111005 | `req_baking_rec_lv_award`<br>`req_baking_swap`<br>`req_baking_synthesize`<br>`req_baking_batch_synthesize`<br>`req_baking_make_cake` | 5 | 0/5 | 0 |
| `PLAY-BAKINGACT-S2` | 111006-111012 | `req_baking_give_up_order`<br>`req_baking_use_item`<br>`req_baking_use_cheat_item`<br>`req_baking_yeast_click`<br>`req_get_act_data`<br>`req_baking_handle_event`<br>`req_baking_submit_order` | 7 | 0/7 | 1 |
| `PLAY-BAKINGACT-S3` | 111013-111015 | `req_baking_refresh_time_limit_order`<br>`req_baking_one_key_sort`<br>`req_baking_select_batch_synthesize_model` | 3 | 0/3 | 0 |

### PLAY-HELPUPACT：助力升阶/升超凡活动

- 协议模块 `HelpUpActCmd`；未路由 0 条；子卡 1 个；看板状态：服务端完成（全服聚合与部分周期语义证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PLAY-HELPUPACT-S1` | 116001-116004 | `req_help_up_task_reward`<br>`req_help_up_stage_award`<br>`req_help_up_help`<br>`req_help_up_get_times` | 4 | 0/4 | 1 |

## 08-festivals-tasks.md

### ACT-SIGNACT：活动签到

- 协议模块 `SignActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-SIGNACT-S1` | 37009 | `req_sign_act_award` | 1 | 0/1 | 0 |

### ACT-OPENSERVERSPRINT：开服冲刺任务、全服进度与排名奖励

- 协议模块 `OpenServerSprintCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-OPENSERVERSPRINT-S1` | 79101-79103 | `req_sprint_receive_task`<br>`req_sprint_task_finish_player`<br>`req_sprint_server_process_award` | 3 | 2/1 | 0 |

### ACT-LOGINREWARDACT：登录奖励活动

- 协议模块 `LoginRewardActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-LOGINREWARDACT-S1` | 90301 | `req_login_reward_act_award` | 1 | 1/0 | 0 |

### ACT-CHRISTMASACT：圣诞装扮、奖励、心愿与商店

- 协议模块 `ChristmasActCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-CHRISTMASACT-S1` | 98610-98613 | `req_christmas_act_dress`<br>`req_christmas_act_get_dress_award`<br>`req_christmas_act_select_wish`<br>`req_christmas_shop_award` | 4 | 3/1 | 1 |

### ACT-STOCKUPACT：囤货阶段与周期奖

- 协议模块 `StockUpActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-STOCKUPACT-S1` | 99401-99402 | `req_stock_up_act_phase_award`<br>`req_stock_up_act_cycle_award` | 2 | 2/0 | 0 |

### ACT-COMACTDRAWAWARD：通用活动领奖

- 协议模块 `ComActDrawAwardCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-COMACTDRAWAWARD-S1` | 99600 | `req_common_act_draw_award` | 1 | 0/1 | 0 |

### ACT-SPRINGFESTIVALACT：春节装扮与商店奖

- 协议模块 `SpringFestivalActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-SPRINGFESTIVALACT-S1` | 99601-99603 | `req_spring_festival_dress`<br>`req_spring_festival_get_dress_award`<br>`req_spring_festival_shop_award` | 3 | 3/0 | 1 |

### ACT-FESTIVALSIGNACT：节日签到

- 协议模块 `FestivalSignActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-FESTIVALSIGNACT-S1` | 99801 | `req_festival_sign_award` | 1 | 0/1 | 0 |

### ACT-COLLECTEXCHANGEACT：收集兑换

- 协议模块 `CollectExchangeActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-COLLECTEXCHANGEACT-S1` | 100001 | `req_collect_exchange_award` | 1 | 0/1 | 0 |

### ACT-FESTIVALMONSTERACT：节日怪物操作

- 协议模块 `FestivalMonsterActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-FESTIVALMONSTERACT-S1` | 100101 | `req_festival_monster_op` | 1 | 1/0 | 0 |

### ACT-VALENTINEDAYACT：情人节领奖与聊天进度

- 协议模块 `ValentineDayActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-VALENTINEDAYACT-S1` | 100501-100502 | `req_valentine_rev_award`<br>`req_valentine_save_chat_progress` | 2 | 0/2 | 0 |

### ACT-PREHEATACT：预热活动与奖励

- 协议模块 `PreheatActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-PREHEATACT-S1` | 101001-101002 | `req_preheat`<br>`req_preheat_award` | 2 | 0/2 | 0 |

### ACT-COMMONSIGN：通用签到领奖

- 协议模块 `CommonSignCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-COMMONSIGN-S1` | 101501 | `req_common_sign_award` | 1 | 0/1 | 0 |

### ACT-VOTEACT：盲投、普通投票、竞猜与全服进度

- 协议模块 `VoteActCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-VOTEACT-S1` | 102901-102906 | `req_vote_act_blind_vote`<br>`req_vote_act_common_vote`<br>`req_vote_act_server_vote` | 3 | 1/2 | 0 |
| `ACT-VOTEACT-S2` | 102903-102907 | `req_vote_act_progress_award`<br>`req_vote_act_task_award`<br>`req_vote_act_task_guess`<br>`req_vote_prize_list_req` | 4 | 4/0 | 1 |

### ACT-QUESTIONACT：答题与累计奖励

- 协议模块 `QuestionActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-QUESTIONACT-S1` | 103001-103003 | `req_question_act_answer`<br>`req_question_act_reward`<br>`req_question_act_reward_pile` | 3 | 0/3 | 0 |

### ACT-SUMMERACT：夏日主活动、水枪/水炮养成、阶段任务与结算

- 协议模块 `SummerActCmd`；未路由 15 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-SUMMERACT-S1` | 103701-103815 | `req_summer_preview_reward`<br>`pb_summer_phase_task_award`<br>`pb_summer_phase_progress_award`<br>`req_summer_standard_award`<br>`req_summer_standard_award_show`<br>`req_summer_settle_rewards_preview`<br>`req_summer_settle_rewards` | 7 | 4/3 | 0 |
| `ACT-SUMMERACT-S2` | 103702-103706 | `req_summer_wg_up_lv`<br>`pb_summer_wg_up_stage`<br>`pb_summer_wb_active`<br>`pb_summer_wb_up_strong`<br>`pb_summer_wb_up_quality` | 5 | 1/4 | 0 |
| `ACT-SUMMERACT-S3` | 103709-103711 | `req_summer_change_water_skin`<br>`req_summer_power`<br>`req_summer_enter` | 3 | 1/2 | 0 |

### ACT-SUMMERPVE：夏日 PVE 任务、次数、阶段与掉落

- 协议模块 `SummerPveCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-SUMMERPVE-S1` | 103801-103804 | `req_summer_act_task_award`<br>`req_summer_act_pve_buy_times`<br>`req_summer_act_pve_phase_award`<br>`req_summer_act_pve_set_award_drop` | 4 | 1/3 | 0 |

### ACT-SUMMERMISSION：夏日关卡战斗结算与进度

- 协议模块 `SummerMissionCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-SUMMERMISSION-S1` | 103901-103902 | `req_summer_mission_fight_settle`<br>`req_summer_mission_progress_award` | 2 | 1/1 | 0 |

### ACT-SUMMERPVP：夏日 PVP、多队、竞猜、对手与挑战次数

- 协议模块 `SummerPvpCmd`；未路由 13 条；子卡 3 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-SUMMERPVP-S1` | 104101-104104 | `req_summer_act_pvp_init_swap`<br>`req_summer_act_pvp_day_task`<br>`req_summer_act_pvp_phase_task`<br>`req_summer_act_pvp_guess` | 4 | 1/3 | 0 |
| `ACT-SUMMERPVP-S2` | 104105-104113 | `req_summer_buy_challenge_times`<br>`req_summer_buy_challenge_match_times`<br>`req_summer_buy_match_enemy`<br>`req_summer_act_pvp_swap_rematch`<br>`req_summer_act_pvp_swap_buy_match`<br>`req_summer_buy_special_match_enemy` | 6 | 5/1 | 0 |
| `ACT-SUMMERPVP-S3` | 104110-104112 | `req_summer_act_pvp_swap_buy_fight`<br>`req_summer_act_pvp_swap_init_lineup`<br>`req_summer_act_pvp_top_history` | 3 | 1/2 | 1 |

### ACT-QIXIACT：七夕折扣选择与日签

- 协议模块 `QiXiActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-QIXIACT-S1` | 104401-104402 | `req_qi_xi_discount_select`<br>`req_qi_xi_daily_sign` | 2 | 1/1 | 0 |

### ACT-ANNIVERSARYGAMEACT：周年小游戏领奖

- 协议模块 `AnniversaryGameActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-ANNIVERSARYGAMEACT-S1` | 104403 | `req_anniversary_game_act_award` | 1 | 0/1 | 0 |

### ACT-FIVEDAYBOSSACT：五日 BOSS 任务、限时通关与排名

- 协议模块 `FiveDayBossActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-FIVEDAYBOSSACT-S1` | 104601-104603 | `req_five_day_boss_act_task_award`<br>`req_five_day_boss_act_time_pass_award`<br>`req_five_day_boss_act_get_rank` | 3 | 1/2 | 1 |

### ACT-ONESREWARD：单次专项奖励

- 协议模块 `OnesRewardCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-ONESREWARD-S1` | 105101 | `req_get_ones_reward` | 1 | 1/0 | 1 |

### ACT-INVITEACT：邀请绑定与任务

- 协议模块 `InviteActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-INVITEACT-S1` | 105201-105202 | `req_invite_act_bind`<br>`req_invite_act_task` | 2 | 0/2 | 0 |

### ACT-INVITEOLDACT：老玩家邀请与任务

- 协议模块 `InviteOldActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-INVITEOLDACT-S1` | 105250-105251 | `req_invite_old_act_invited`<br>`req_invite_old_act_task` | 2 | 1/1 | 0 |

### ACT-ROLEBACK：回归绑定、继承卡、账号查询与每日资源

- 协议模块 `RoleBackCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-ROLEBACK-S1` | 105301-105308 | `req_role_back_bind_award`<br>`req_role_back_inheritance_card`<br>`req_role_back_new_bind`<br>`req_role_back_get_roles_info`<br>`req_role_back_get_day_money` | 5 | 5/0 | 2 |

### ACT-CHOICESTORY：分支剧情奖励

- 协议模块 `ChoiceStoryCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-CHOICESTORY-S1` | 105601 | `req_choice_story_award` | 1 | 0/1 | 0 |

### ACT-FIRECRACKERACT：爆竹使用、公会进度、任务与累充奖

- 协议模块 `FirecrackerActCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-FIRECRACKERACT-S1` | 106201-106205 | `req_firecracker_act_guild_info`<br>`req_firecracker_act_use`<br>`req_firecracker_act_task_award`<br>`req_firecracker_act_acc_award`<br>`req_firecracker_act_acc_recharge_award` | 5 | 0/5 | 1 |

### ACT-HEROSIGNACT：英雄签到

- 协议模块 `HeroSignActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-HEROSIGNACT-S1` | 110501 | `req_hero_sign_act_award` | 1 | 0/1 | 0 |

### ACT-ENJOYBLESSINGACT：祈福摇签

- 协议模块 `EnjoyBlessingActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-ENJOYBLESSINGACT-S1` | 110701 | `req_enjoy_blessing_act_shake` | 1 | 1/0 | 0 |

### ACT-QUESTIONNAIRE：问卷提交

- 协议模块 `QuestionnaireCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-QUESTIONNAIRE-S1` | 110901 | `req_questionnaire_finish` | 1 | 0/1 | 0 |

### ACT-ANNIVERSARYBANQUETACT：周年宴会任务与进度

- 协议模块 `AnniversaryBanquetActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ACT-ANNIVERSARYBANQUETACT-S1` | 118001-118002 | `req_anniversary_banquet_act_task_award`<br>`req_anniversary_banquet_act_process_award` | 2 | 0/2 | 0 |

## 09-commerce-benefits.md

### PAY-RECHARGE：龙晶等额外充值入口

- 协议模块 `RechargeCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-RECHARGE-S1` | 16006 | `req_loong_recharge` | 1 | 0/1 | 0 |

### PAY-TRIGGERGIFT：触发礼包激活与次数

- 协议模块 `TriggerGiftCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-TRIGGERGIFT-S1` | 18001-18002 | `req_active_trigger_gift`<br>`req_add_trigger_times` | 2 | 2/0 | 0 |

### PAY-UPSTARGIFT：升星礼包奖励与版本

- 协议模块 `UpStarGiftCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-UPSTARGIFT-S1` | 31052-31053 | `req_up_star_gift_award`<br>`req_up_star_choose_version` | 2 | 1/1 | 0 |

### PAY-VIP：VIP 礼包、特权奖励与经验兑换

- 协议模块 `VipCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-VIP-S1` | 33001-76301 | `req_buy_vip_gift`<br>`req_get_vip_addition_reward`<br>`req_vip_exp_exchange` | 3 | 3/0 | 1 |

### PAY-PERMIT：普通通行证买级、福利、结算、自选与选期

- 协议模块 `PermitCmd`；未路由 8 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-PERMIT-S1` | 35003-35007 | `req_permit_buy_level`<br>`req_permit_adjust_cycle`<br>`req_permit_gain_welfare`<br>`req_permit_buy_times_data` | 4 | 4/0 | 0 |
| `PAY-PERMIT-S2` | 35008-35011 | `req_permit_manual_update`<br>`req_permit_manual_settle`<br>`req_permit_select_award`<br>`req_permit_choose_req` | 4 | 2/2 | 0 |

### PAY-ONLINEGIFT：在线礼包

- 协议模块 `OnlineGiftCmd`；未路由 1 条；子卡 1 个；看板状态：服务端完成（PeriodMax 精确语义待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-ONLINEGIFT-S1` | 37010 | `req_online_gift_award` | 1 | 1/0 | 0 |

### PAY-FUNDACT：活动基金领奖

- 协议模块 `FundActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-FUNDACT-S1` | 51001 | `req_fund_act_award` | 1 | 1/0 | 0 |

### PAY-NOTIFYGIFT：通知礼包激活

- 协议模块 `NotifyGiftCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-NOTIFYGIFT-S1` | 76201 | `req_notify_gift_activate` | 1 | 1/0 | 0 |

### PAY-REDENVELOPE：普通红包领奖与详情

- 协议模块 `RedEnvelopeCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-REDENVELOPE-S1` | 77001-77003 | `req_red_envelope_award`<br>`req_red_envelope_info`<br>`req_red_envelope_info_by_sender` | 3 | 3/0 | 2 |

### PAY-VIPGIFT：VIP 专属礼包领奖

- 协议模块 `VipGiftCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-VIPGIFT-S1` | 77101 | `vip_gift_award` | 1 | 1/0 | 0 |

### PAY-FASHION：时装激活、穿戴与升级

- 协议模块 `FashionCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-FASHION-S1` | 82602-82604 | `req_fashion_act`<br>`req_fashion_wear`<br>`req_fashion_lv` | 3 | 3/0 | 0 |

### PAY-VIPCITY：VIP 城市重建

- 协议模块 `VipCityCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-VIPCITY-S1` | 82701 | `req_vip_city_rebuild` | 1 | 1/0 | 0 |

### PAY-PRINCESS：公主/Princess 奖励补领与跨期刷新

- 协议模块 `PrincessCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-PRINCESS-S1` | 84602-84603 | `req_princess_award_supplement`<br>`req_cross_refresh_supplement` | 2 | 2/0 | 0 |

### PAY-PERMANENTCARD：永久卡奖励领取

- 协议模块 `PermanentCardCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-PERMANENTCARD-S1` | 87301 | `req_permanent_card_award` | 1 | 1/0 | 0 |

### PAY-RECOVERY：资源追回免费奖励

- 协议模块 `RecoveryCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-RECOVERY-S1` | 87401 | `req_recovery_free_award` | 1 | 1/0 | 0 |

### PAY-WEEKENDBONUS：周末奖励与游玩次数

- 协议模块 `WeekendBonusCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-WEEKENDBONUS-S1` | 87501-87502 | `req_weekend_award`<br>`req_weekend_play_count_award` | 2 | 2/0 | 0 |

### PAY-LEVELSPRINT：等级冲刺免费奖

- 协议模块 `LevelSprintCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-LEVELSPRINT-S1` | 88101 | `req_level_sprint_free_award` | 1 | 1/0 | 0 |

### PAY-HOUSEASSISTANT：看板助手背景、选择与试用

- 协议模块 `HouseAssistantCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-HOUSEASSISTANT-S1` | 88201-88204 | `req_house_assistant_choose_bg`<br>`req_house_assistant_choose_assist`<br>`req_house_assistant_trial`<br>`req_house_assistant_trial_cancel` | 4 | 0/4 | 0 |

### PAY-HEATGIFT：热度礼包支援与全服数据

- 协议模块 `HeatGiftCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-HEATGIFT-S1` | 88601-88602 | `req_heat_gift_support`<br>`req_heat_gift_server_info` | 2 | 2/0 | 1 |

### PAY-FLASHSALE：限时特卖砍价与英雄

- 协议模块 `FlashSaleCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-FLASHSALE-S1` | 88701-88702 | `req_flash_sale_bargain`<br>`req_flash_sale_hero` | 2 | 2/0 | 0 |

### PAY-ASSISTANT：玩法助手功能设置与执行

- 协议模块 `AssistantCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-ASSISTANT-S1` | 88901-88903 | `req_assistant_set_func`<br>`req_assistant_do_command`<br>`req_assistant_start_try` | 3 | 1/2 | 0 |

### PAY-PREBOOK：预约任务与分享奖励

- 协议模块 `PrebookCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-PREBOOK-S1` | 92401-92402 | `req_prebook_task_award`<br>`req_prebook_share_award` | 2 | 2/0 | 0 |

### PAY-ROLESHARE：玩家分享奖励

- 协议模块 `RoleShareCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-ROLESHARE-S1` | 92501 | `req_role_share_award` | 1 | 1/0 | 0 |

### PAY-CROSS：跨服广告、功能免费与付费奖

- 协议模块 `CrossCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-CROSS-S1` | 92601-92603 | `req_cross_receive_ads_award`<br>`req_cross_receive_fun_free_award`<br>`req_cross_receive_fun_pay_award` | 3 | 3/0 | 0 |

### PAY-REDRAIN：红包雨随机、领取与激活

- 协议模块 `RedRainCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-REDRAIN-S1` | 92901-92903 | `req_red_rain_random`<br>`req_red_rain_rev`<br>`req_red_rain_active` | 3 | 2/1 | 0 |

### PAY-DIAMONDFUND：钻石基金稳健/幸运奖励领取

- 协议模块 `DiamondFundCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-DIAMONDFUND-S1` | 93201-93202 | `req_steady_award`<br>`req_fortune_award` | 2 | 2/0 | 0 |

### PAY-WEEKHUNT：周猎任务、进度与升级礼包

- 协议模块 `WeekHuntCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-WEEKHUNT-S1` | 93401-93403 | `req_week_hunt_common_task`<br>`req_week_hunt_common_progress`<br>`req_week_hunt_upgrade_gift` | 3 | 0/3 | 0 |

### PAY-LINKGIFT：联动礼包自选

- 协议模块 `LinkGiftCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-LINKGIFT-S1` | 97401 | `req_link_gift_custom_choose` | 1 | 1/0 | 0 |

### PAY-VIPLINK：VIP 联动展示

- 协议模块 `VipLinkCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-VIPLINK-S1` | 98001 | `req_vip_link_show` | 1 | 1/0 | 0 |

### PAY-GEMREBATEACT：宝石返利投入

- 协议模块 `GemRebateActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-GEMREBATEACT-S1` | 98630 | `req_gem_rebate_put` | 1 | 0/1 | 0 |

### PAY-APPEARANCERELEASEACT：外观上新互动

- 协议模块 `AppearanceReleaseActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-APPEARANCERELEASEACT-S1` | 98800 | `req_appearance_release_act_interact` | 1 | 0/1 | 0 |

### PAY-CAKEACTIVITY：蛋糕活动每日、充值与托盘选择

- 协议模块 `CakeActivityCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-CAKEACTIVITY-S1` | 99000-99002 | `req_cake_activity_daily_award`<br>`req_cake_activity_rechage_award`<br>`req_cake_activity_select_plate` | 3 | 2/1 | 0 |

### PAY-QUADRUPLECROSS：四重跨期随机、免费与付费奖

- 协议模块 `QuadrupleCrossCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-QUADRUPLECROSS-S1` | 99500-99502 | `req_quadruple_cross_random_award`<br>`req_quadruple_cross_free_award`<br>`req_quadruple_cross_pay_award` | 3 | 3/0 | 0 |

### PAY-FINANCEMANAGEACT：理财产品选择与返利

- 协议模块 `FinanceManageActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-FINANCEMANAGEACT-S1` | 99901-99902 | `req_finance_manage_act_select_product`<br>`req_finance_manage_act_rebate` | 2 | 1/1 | 0 |

### PAY-SKINCRYSTAL：皮肤水晶购买

- 协议模块 `SkinCrystalCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-SKINCRYSTAL-S1` | 100401 | `req_skin_crystal_buy` | 1 | 1/0 | 0 |

### PAY-GROUPBUYACT：团购全服统计与团购奖

- 协议模块 `GroupBuyActCmd`；未路由 1 条；子卡 1 个；看板状态：服务端完成（全服口径与客户端回包对照待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-GROUPBUYACT-S1` | 100601-100602 | `req_group_buy_act_server_data`<br>`req_group_buy_act_group_award` | 2 | 1/1 | 0 |

### PAY-REBATESHOPACT：返利商店领奖

- 协议模块 `RebateShopActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-REBATESHOPACT-S1` | 100701 | `req_rebate_shop_act_award` | 1 | 1/0 | 0 |

### PAY-DIVINEREALMACT：神域活动礼包选择

- 协议模块 `DivineRealmActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-DIVINEREALMACT-S1` | 101701 | `req_divine_realm_act_select_gift` | 1 | 0/1 | 0 |

### PAY-BONUSSHOP：奖励商店购买

- 协议模块 `BonusShopCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-BONUSSHOP-S1` | 101903 | `req_bonus_shopping` | 1 | 0/1 | 0 |

### PAY-AUCTION：拍卖出价、心愿、分红与详情

- 协议模块 `AuctionCmd`；未路由 5 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-AUCTION-S1` | 102701-102705 | `req_auction_bid`<br>`req_auction_wish`<br>`req_auction_dividend_award`<br>`req_auction_attend`<br>`req_auction_detail` | 5 | 3/2 | 1 |

### PAY-SKINRECHARGE：皮肤充值角色选择

- 协议模块 `SkinRechargeCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-SKINRECHARGE-S1` | 103601 | `req_skin_recharge_get_role` | 1 | 1/0 | 1 |

### PAY-BUYSKINACT：购皮肤活动免费奖励

- 协议模块 `BuySkinActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-BUYSKINACT-S1` | 104001 | `req_buy_skin_free_award` | 1 | 0/1 | 0 |

### PAY-ACTSHOP：活动商店数据、购买与等级奖励

- 协议模块 `ActShopCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-ACTSHOP-S1` | 104801-104803 | `req_act_shop_info`<br>`req_act_buy_goods`<br>`req_act_shop_level_rewards` | 3 | 0/3 | 1 |

### PAY-PREMIUMACT：增值活动免费奖励

- 协议模块 `PremiumActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-PREMIUMACT-S1` | 105401 | `req_premium_free_award` | 1 | 0/1 | 0 |

### PAY-RECYCLEACT：回收活动

- 协议模块 `RecycleActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-RECYCLEACT-S1` | 105901 | `req_recycle_act_recycle` | 1 | 0/1 | 0 |

### PAY-VICKREYAUCTIONACT：维克里/密封拍卖

- 协议模块 `VickreyAuctionActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-VICKREYAUCTIONACT-S1` | 106101-106102 | `req_vickrey_auction_act_get_info`<br>`req_vickrey_act_auction_bid` | 2 | 0/2 | 1 |

### PAY-GIFTBOXACT：礼盒活动领取

- 协议模块 `GiftBoxActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-GIFTBOXACT-S1` | 106301 | `req_gift_box_receive` | 1 | 0/1 | 0 |

### PAY-SUBSCRIPTIONACT：订阅、领取与入场

- 协议模块 `SubscriptionActCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-SUBSCRIPTIONACT-S1` | 107301-107303 | `req_subscription_act_subscribe`<br>`req_subscription_act_get`<br>`req_subscription_act_enter` | 3 | 1/2 | 1 |

### PAY-NEWPERMITACT：新通行证领奖

- 协议模块 `NewPermitActCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-NEWPERMITACT-S1` | 107401 | `req_new_permit_award` | 1 | 0/1 | 0 |

### PAY-DRAGONLANDACT：龙岛日奖、试炼奖与公会数据

- 协议模块 `DragonLandActCmd`；未路由 2 条；子卡 1 个；看板状态：服务端完成（战斗来源与日重置语义证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-DRAGONLANDACT-S1` | 107701-107703 | `req_dragon_land_daily_award`<br>`req_dragon_land_trial_award`<br>`req_dragon_land_guild_data` | 3 | 0/3 | 0 |

### PAY-DIAMONDBANKACT：钻石银行任务、奖励与购买

- 协议模块 `DiamondBankActCmd`；未路由 3 条；子卡 1 个；看板状态：服务端完成（结算字段与多数任务进度证据待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-DIAMONDBANKACT-S1` | 110201-110203 | `req_diamond_bank_act_task`<br>`req_diamond_bank_act_award`<br>`req_diamond_bank_act_buy` | 3 | 2/1 | 0 |

### PAY-FREEPRIVILEGEACT：免费特权及月度激活

- 协议模块 `FreePrivilegeActCmd`；未路由 2 条；子卡 1 个；看板状态：服务端完成（月卡激活 res 与体验期永久卡权益语义待补）

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-FREEPRIVILEGEACT-S1` | 110601-110602 | `req_free_privilege_act_activate`<br>`req_free_privilege_act_activate_month` | 2 | 2/0 | 0 |

### PAY-SLOTGAMEACT：老虎机活动游玩与领取

- 协议模块 `SlotGameActCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `PAY-SLOTGAMEACT-S1` | 110801-110802 | `req_slot_game_act_go`<br>`req_slot_game_act_get` | 2 | 0/2 | 1 |

## 10-role-and-supporting.md

### ROLE-UNKNOWN：GM 调试命令

- 协议模块 `Unknown`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-UNKNOWN-S1` | 10 | `gm_cmd` | 1 | 1/0 | 0 |

### ROLE-ROLE：团长改名、头像、称号、形象、等级奖、属性与战力

- 协议模块 `RoleCmd`；未路由 23 条；子卡 4 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-ROLE-S1` | 104-112 | `record_sundry`<br>`record_pass_all_mission`<br>`request_role_list`<br>`req_role_check_veteran`<br>`req_role_veteran_skip` | 5 | 5/0 | 1 |
| `ROLE-ROLE-S2` | 110-1311 | `req_role_set_recommend_lv`<br>`req_set_role_name`<br>`req_set_role_figure`<br>`req_set_figure_sex`<br>`req_set_figure_style`<br>`req_set_role_name_sex` | 6 | 6/0 | 0 |
| `ROLE-ROLE-S3` | 1302-1307 | `req_random_role_name`<br>`req_active_role_title`<br>`req_role_title_attr`<br>`req_check_same_name` | 4 | 4/0 | 0 |
| `ROLE-ROLE-S4` | 1303-1317 | `req_get_level_reward`<br>`req_refresh_figure_red`<br>`req_up_rank`<br>`req_role_figure_rank_award`<br>`req_role_refresh_power`<br>`req_role_figure_chat_bubble`<br>`req_role_attr_info`<br>`req_rev_watch_video_award` | 8 | 8/0 | 4 |

### ROLE-LOGIN：网络检查与开发登录辅助

- 协议模块 `LoginCmd`；未路由 3 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-LOGIN-S1` | 109-909102 | `req_ensure_net_ok`<br>`login_dev_account`<br>`login_dev_roleid` | 3 | 1/2 | 0 |

### ROLE-PLAYERDATA：玩家数据查询

- 协议模块 `PlayerDataCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-PLAYERDATA-S1` | 161 | `req_player_data` | 1 | 0/1 | 0 |

### ROLE-STORY：剧情完成与触发

- 协议模块 `StoryCmd`；未路由 2 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-STORY-S1` | 304-305 | `finish_story`<br>`touch_story` | 2 | 2/0 | 0 |

### ROLE-REDDOT：红点持久化

- 协议模块 `RedDotCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-REDDOT-S1` | 39001 | `req_save_changed_red_dot` | 1 | 0/1 | 0 |

### ROLE-CDKEY：兑换码领奖

- 协议模块 `CdkeyCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-CDKEY-S1` | 40000 | `req_claim_prize` | 1 | 1/0 | 0 |

### ROLE-ACTIVITY：真实活动状态推进

- 协议模块 `ActivityCmd`；未路由 0 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-ACTIVITY-S1` | 53001 | `req_activity_state_change` | 1 | 1/0 | 0 |

### ROLE-ACTFRAME：活动列表数据及 GM 开期/跳阶段/清理辅助

- 协议模块 `ActFrameCmd`；未路由 4 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-ACTFRAME-S1` | 53002-53006 | `req_act_stage_change`<br>`req_act_gm_open_act`<br>`req_act_gm_jump_stage`<br>`req_act_gm_clear_act_data`<br>`req_act_get_act_list_data` | 5 | 5/0 | 1 |

### ROLE-SKIN：皮肤穿戴、兑换、图鉴与强化

- 协议模块 `SkinCmd`；未路由 7 条；子卡 2 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-SKIN-S1` | 76003-76005 | `skin_wear`<br>`req_choose_exchange_skin`<br>`req_exchange_skin` | 3 | 2/1 | 0 |
| `ROLE-SKIN-S2` | 76006-76009 | `toggle_ignore_fantasy_skin`<br>`skin_activation_handbook`<br>`skin_handbook_info`<br>`skin_increase` | 4 | 3/1 | 1 |

### ROLE-CLIENTLOG：客户端诊断日志

- 协议模块 `ClientLogCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-CLIENTLOG-S1` | 78901 | `req_save_to_server_info_log` | 1 | 1/0 | 1 |

### ROLE-CHANNELPUSH：渠道推送开关

- 协议模块 `ChannelPushCmd`；未路由 1 条；子卡 1 个；看板状态：待领取

| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |
| --- | --- | --- | ---: | --- | ---: |
| `ROLE-CHANNELPUSH-S1` | 98201 | `rep_set_channel_push_open` | 1 | 0/1 | 0 |

