# 英雄养成、编队与关系

本分区 15 个模块任务，63 条未路由/明确拒绝/占位命令。优先级：P1/P2。

共同依赖：CORE-ATTR；技能升级关联 CORE-SKILL-GATES；租借关联 SOC-FRIEND/SOC-GUILD。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## HERO-LINEUP：预设阵容索引、增删、改名与保存

协议模块：`LineupCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 3。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“预设阵容索引、增删、改名与保存”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[lineup-service.mjs](../../../personal-server/game/lineup-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 210 | `req_set_pre_lineup_index` | 未路由 | etf / `—` | `pb_set_pre_lineup_index_rsp` |
| 214 | `req_custom_pre_lineup_new` | 未路由 | protobuf / `pb_custom_pre_lineup_list` | `pb_custom_pre_lineup_list` |
| 215 | `req_custom_pre_lineup_set_name` | 未路由 | protobuf / `pb_custom_lineup_set_name_req` | `pb_custom_pre_lineup` |
| 216 | `req_custom_pre_lineup_set` | 未路由 | protobuf / `pb_custom_lineup_set_req` | `pb_custom_pre_lineup` |
| 217 | `req_custom_pre_lineup_delete` | 未路由 | etf / `—` | `—` |

已有处理路径（必须回归）：`208 req_edit_lineup`、`209 req_edit_pre_lineup`、`218 req_lineup_exchange_version`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-HERO：英雄进阶、试炼、重铸、碎片、访问与支援

协议模块：`HeroCmd`。未路由 20；明确拒绝 0；空结构/固定值/仅应答 3；有处理路径，需保持回归 18。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄进阶、试炼、重铸、碎片、访问与支援”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[recruit-service.mjs](../../../personal-server/game/recruit-service.mjs)、[hero-progression.mjs](../../../personal-server/game/hero-progression.mjs)、[hero-handbook-service.mjs](../../../personal-server/game/hero-handbook-service.mjs)、[hero-favor-service.mjs](../../../personal-server/game/hero-favor-service.mjs)。

已确认的附加缺口：

- 保留 636/638/639/640 升级、突破、普通升星与觉醒，以及现有图鉴/训练/招募；641 独立试炼仍缺，不能误报 640 尚未实现。
- 651/652/673 为空响应；支援池、支援角色和跑马灯要接真实数据。601 的缺失生产奖池见 CORE-DRAW-POOLS。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 602 | `req_choose_hero_school` | 未路由 | etf / `—` | `pb_hero_recruit` |
| 614 | `use_hero_chip` | 未路由 | protobuf / `hero_chip_use` | `pb_res_to_client` |
| 627 | `req_rent_out_hero` | 未路由 | protobuf / `pb_req_rent_out` | `pb_req_rent_out_back` |
| 628 | `req_rent_out_off_hero` | 未路由 | etf / `—` | `pb_req_rent_out_back` |
| 629 | `req_rent_in_hero` | 未路由 | protobuf / `pb_req_rent` | `pb_req_rent_back` |
| 630 | `req_query_rent_out_info` | 未路由 | etf / `—` | `pb_req_query_rent_hero_ret` |
| 631 | `req_rent_flush` | 未路由 | etf / `—` | `pb_rent_flush_ret` |
| 634 | `req_query_share_data` | 未路由 | protobuf / `pb_hero_share_req` | `pb_hero_share_req_back` |
| 635 | `req_rev_recruit_progress_award` | 未路由 | etf / `—` | `pb_rev_draw_progress_award_back` |
| 637 | `req_develop_submit_hero` | 未路由 | protobuf / `pb_hero_submit_req` | `pb_hero_submit_ret` |
| 641 | `req_develop_hero_trial` | 未路由 | protobuf / `pb_hero_wake_req` | `pb_hero_trial_ret` |
| 647 | `req_hero_visit` | 未路由 | etf / `—` | `pb_hero_visit_rsp` |
| 651 | `req_draw_support_lineup` | 空结构/固定值/仅应答：玩家/服务器支援列表为空 | etf / `—` | `pb_draw_support_back` |
| 652 | `req_draw_get_support_data` | 空结构/固定值/仅应答：支援池数据为空 | etf / `—` | `pb_draw_support_back` |
| 654 | `req_active_fetter` | 未路由 | protobuf / `pb_active_fetter_req` | `—` |
| 656 | `req_develop_batch_submit_hero` | 未路由 | protobuf / `pb_hero_batch_submit_req` | `pb_hero_submit_ret` |
| 661 | `req_hero_diff` | 未路由 | etf / `—` | `pb_hero_diff_back` |
| 663 | `req_hero_reforge` | 未路由 | protobuf / `pb_hero_reforge_req` | `pb_hero_reforge_back` |
| 664 | `req_hero_reforge_save` | 未路由 | etf / `—` | `pb_hero_reforge` |
| 665 | `req_hero_reforge_cancel` | 未路由 | etf / `—` | `pb_hero_reforge` |
| 666 | `req_one_key_develop` | 未路由 | protobuf / `pb_hero_one_key_up_req` | `pb_hero_one_key_up_rsp` |
| 672 | `req_hero_select_pendant` | 未路由 | protobuf / `pb_hero_select_pendant_req` | `pb_hero_select_pendant_rsp` |
| 673 | `req_draw_marquee` | 空结构/固定值/仅应答：招募跑马灯为空 | protobuf / `pb_draw_marquee_req` | `pb_draw_marquee_rsp` |

已有处理路径（必须回归）：`599 req_draw_buy_magic_scroll`、`600 req_draw_buy_normal_scroll`、`601 draw_hero`、`636 req_develop_up_lv`、`638 req_develop_hero_break`、`639 req_develop_up_star_normal`、`640 req_develop_up_star_high`、`642 req_choose_wish_hero`、`643 req_takeoff_wish_hero`、`644 req_req_hero_handbook_raise_level`、`645 req_req_hero_handbook_raise_one_key`、`646 req_hero_favour_gift`、`649 req_hero_favour_play`、`653 req_hero_favour_level_award`、`655 req_hero_handbook_own_award`、`657 req_choose_extra_wish_hero`、`658 req_takeoff_extra_wish_hero`、`662 req_get_draw_achieve_award`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-MASTERY：精通升级与突破

协议模块：`MasteryCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“精通升级与突破”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 659 | `req_hero_mastery_level_up` | 未路由 | etf / `—` | `pb_hero_mastery_level_up_rsp` |
| 660 | `req_hero_mastery_break` | 未路由 | etf / `—` | `pb_hero_mastery_break_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-FAVOURINTIMACY：亲密度、约会与剧情

协议模块：`FavourIntimacyCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“亲密度、约会与剧情”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 667 | `req_hero_intimacy_add` | 未路由 | protobuf / `pb_hero_intimacy_add_req` | `pb_hero_intimacy_add_rsp` |
| 670 | `req_hero_intimacy_date` | 未路由 | protobuf / `pb_hero_intimacy_date_req` | `pb_hero_intimacy_date_rsp` |
| 671 | `req_hero_intimacy_story` | 未路由 | protobuf / `pb_hero_intimacy_story_req` | `pb_hero_intimacy_story_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-INTELLI：Intelli 解锁与批量处理

协议模块：`IntelliCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“Intelli 解锁与批量处理”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 701 | `req_intelli_unlock` | 未路由 | protobuf / `pb_intelli_unlock_req` | `intelli_to_client` |
| 702 | `req_intelli_batch_handle` | 未路由 | protobuf / `pb_intelli_batch_handle` | `intelli_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-COMBATPOWER：战力奖励与预设战力更新

协议模块：`CombatPowerCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“战力奖励与预设战力更新”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 802 | `combat_power_gain_award` | 未路由 | etf / `—` | `pb_power_award_toc` |
| 803 | `req_update_pre_lineup_power` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-TACTICS：战术升级与重置

协议模块：`TacticsCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“战术升级与重置”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84501 | `req_tactics_level_up` | 未路由 | etf / `—` | `pb_tactics_level_up_back` |
| 84502 | `req_tactics_reset` | 未路由 | etf / `—` | `pb_tactics_reset_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-HEROLEASE：英雄租借

协议模块：`HeroLeaseCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄租借”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87201 | `req_hero_lease_place` | 未路由 | protobuf / `pb_lease_hero_place_req` | `pb_role_lease_hero` |
| 87202 | `req_hero_lease_lease` | 未路由 | protobuf / `pb_lease_hero_lease_req` | `pb_role_lease_hero` |
| 87203 | `req_hero_lease_give_back` | 未路由 | protobuf / `pb_lease_hero_give_back_req` | `pb_role_lease_hero` |
| 87204 | `req_hero_lease_take_back` | 未路由 | protobuf / `pb_lease_hero_take_back_req` | `pb_role_lease_hero` |
| 87205 | `req_hero_lease_list` | 未路由 | protobuf / `pb_lease_hero_list_req` | `pb_lease_hero_list_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-LINEUPSNAPSHOT：阵容/英雄快照

协议模块：`LineupSnapshotCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“阵容/英雄快照”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87701 | `req_lineup_snapshot_hero` | 未路由 | etf / `—` | `pb_lineup_hero_server` |
| 87702 | `req_lineup_snapshot_list` | 未路由 | protobuf / `pb_lineup_snapshot_list_req` | `pb_lineup_snapshot_list` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-TEAMSUGGEST：推荐阵容激活与选择

协议模块：`TeamSuggestCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“推荐阵容激活与选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[team-suggest-service.mjs](../../../personal-server/game/team-suggest-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88802 | `req_team_suggest_active` | 未路由 | protobuf / `pb_hero_team_suggest_active` | `pb_hero_team_suggest_collect` |
| 88803 | `req_team_suggest_select` | 未路由 | etf / `—` | `pb_hero_team_suggest` |

已有处理路径（必须回归）：`88801 req_team_suggest_award`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-HEROBLAZON：英雄纹章、天赋、技能与羁绊

协议模块：`HeroBlazonCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄纹章、天赋、技能与羁绊”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88951 | `req_hero_blazon_up` | 未路由 | protobuf / `pb_hero_blazon_up` | `pb_hero_blazon_up_back` |
| 88953 | `req_hero_blazon_update_talent` | 未路由 | protobuf / `pb_hero_blazon_update_talent_req` | `pb_hero_blazon_update_talent_rsp` |
| 88955 | `req_hero_blazon_update_skill` | 未路由 | etf / `—` | `pb_hero_blazon_update_skill_back` |
| 88956 | `req_hero_blazon_reset_skill` | 未路由 | etf / `—` | `pb_res_to_client` |
| 88957 | `req_hero_blazon_bond_up` | 未路由 | etf / `—` | `pb_hero_blazon_bond_up_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-NEWHEROEXCLUSIVE：新英雄专属选择、剧情与阵容奖励

协议模块：`NewHeroExclusiveCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“新英雄专属选择、剧情与阵容奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88963 | `req_new_hero_exclusive_choose_hero` | 未路由 | etf / `—` | `pb_shop_info` |
| 88964 | `req_new_hero_exclusive_rev_story_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 88967 | `req_rev_new_hero_exclusive_lineup_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-HEROLEGEND：英雄传奇书升星、祝福、升级与升阶

协议模块：`HeroLegendCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄传奇书升星、祝福、升级与升阶”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89801 | `req_hero_legend_book_handle_star` | 未路由 | etf / `—` | `pb_hero_legend_book_active` |
| 89802 | `req_hero_legend_book_handle_bless` | 未路由 | etf / `—` | `pb_hero_legend_book_active` |
| 89803 | `req_hero_legend_book_handle_level` | 未路由 | etf / `—` | `pb_hero_legend_book_active_back` |
| 89804 | `req_hero_legend_book_handle_stage` | 未路由 | etf / `—` | `pb_hero_legend_book_active` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-LEASERSTARUP：租借/Leaser 升星与重置

协议模块：`LeaserStarUpCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“租借/Leaser 升星与重置”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101201 | `req_leaser_star_up` | 未路由 | protobuf / `pb_leaser_star_up_req` | `pb_leaser_star_up_rev` |
| 101202 | `req_leaser_star_up_reset` | 未路由 | protobuf / `pb_leaser_star_up_reset_req` | `pb_leaser_star_up_reset_rev` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## HERO-CAMPHALO：阵营光环升级

协议模块：`CampHaloCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“阵营光环升级”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103101 | `req_camp_halo_level_up` | 未路由 | etf / `—` | `pb_camp_halo_role` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
