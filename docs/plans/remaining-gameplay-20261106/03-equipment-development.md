# 装备、圣器、魔灵、精灵及后期养成

本分区 16 个模块任务，81 条未路由/明确拒绝/占位命令。优先级：P1/P2。

共同依赖：CORE-ATTR、ITEM-ITEM；新增资源族先复用或扩展 resources.mjs，不能只改登录快照。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## EQUIP-EQUIP：普通装备觉醒、材料交换与批量精炼

协议模块：`EquipCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 6。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“普通装备觉醒、材料交换与批量精炼”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[equip-service.mjs](../../../personal-server/game/equip-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 1007 | `req_equip_awake` | 未路由 | etf / `—` | `pb_equip_awake_rsp` |
| 1008 | `req_equip_res_exchange` | 未路由 | protobuf / `pb_equip_res_exchange_req` | `pb_res_to_client` |
| 1009 | `req_equip_refine_one_key_batch` | 未路由 | protobuf / `pb_equip_refine_one_key_batch_req` | `pb_equip_refine_one_key_batch_rsp` |

已有处理路径（必须回归）：`1001 req_equip_level_up`、`1002 req_equip_forge`、`1003 req_equip_refine`、`1004 req_equip_refine_one_key`、`1005 req_equip_inscription`、`1006 req_equip_wear`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-ARTIFACT：圣器合成、强化、品质、升级、突破等

协议模块：`ArtifactCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“圣器合成、强化、品质、升级、突破等”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 37060 | `req_artifact_synthesis` | 未路由 | protobuf / `pb_artifact_star_up_req` | `pb_artifact_back` |
| 37061 | `req_artifact_strength` | 未路由 | protobuf / `pb_req_artifact_forge` | `pb_artifact_back` |
| 37062 | `req_artifact_quality` | 未路由 | etf / `—` | `pb_artifact_back` |
| 37068 | `req_artifact_forge_promote` | 未路由 | etf / `—` | `pb_artifact` |
| 37069 | `req_artifact_fetter` | 未路由 | etf / `—` | `pb_artifact_fetter` |
| 37070 | `req_artifact_level_up` | 未路由 | protobuf / `pb_artifact_level_up_req` | `pb_artifact_level_up_rsp` |
| 37071 | `req_artifact_break_level_up` | 未路由 | etf / `—` | `pb_artifact_break_level_up_rsp` |
| 37072 | `req_artifact_inject` | 未路由 | etf / `—` | `—` |
| 37073 | `req_artifact_handbook_level_up` | 未路由 | protobuf / `pb_artifact_handbook_level_up_req` | `pb_artifact_handbook_level_up_rsp` |
| 37074 | `req_artifact_fly_up` | 未路由 | etf / `—` | `pb_artifact_back` |
| 37075 | `req_artifact_change_skin` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-WARRUNE：战纹激活、升阶、洗属性、重铸与养成

协议模块：`WarRuneCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“战纹激活、升阶、洗属性、重铸与养成”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 83001 | `req_war_rune_active` | 未路由 | etf / `—` | `pb_war_rune_active_back` |
| 83002 | `req_war_rune_up_stage` | 未路由 | etf / `—` | `pb_res_to_client` |
| 83003 | `req_war_rune_attr_random` | 未路由 | etf / `—` | `pb_war_rune_random_attr_back` |
| 83004 | `req_war_rune_recast` | 未路由 | protobuf / `pb_war_rune_recast_req` | `pb_attr_develop_info` |
| 83005 | `req_war_rune_edu` | 未路由 | etf / `—` | `pb_war_rune_edu_back` |
| 83006 | `req_war_rune_up_level` | 未路由 | etf / `—` | `pb_res_to_client` |
| 83007 | `req_war_rune_up_star` | 未路由 | etf / `—` | `pb_war_rune_up_star_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-MUSEUM：博物馆藏品激活与人气奖励

协议模块：`MuseumCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“博物馆藏品激活与人气奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 85701 | `req_museum_rev_popularity_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 85702 | `req_museum_active_collection` | 未路由 | protobuf / `pb_museum_req_list` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-FANTASYHANDBOOK：幻武图鉴升星

协议模块：`FantasyHandbookCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“幻武图鉴升星”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89001 | `req_fantasy_handbook_star` | 未路由 | protobuf / `pb_fantasy_equip_id` | `pb_fantasy_handbook_equip` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-RELIC：Relic 装具穿戴、重铸、分解、重置、升阶等

协议模块：`RelicCmd`。未路由 11；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“Relic 装具穿戴、重铸、分解、重置、升阶等”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89701 | `req_relic_break_up` | 未路由 | etf / `—` | `pb_res_op_relic` |
| 89702 | `req_relic_recast` | 未路由 | protobuf / `pb_req_recast_relic` | `pb_res_op_relic` |
| 89704 | `req_relic_save_recast` | 未路由 | protobuf / `pb_req_recast_relic` | `pb_res_op_relic` |
| 89705 | `req_relic_resolve` | 未路由 | protobuf / `pb_req_resolve_relic` | `pb_res_to_client` |
| 89706 | `req_relic_cancel_recast` | 未路由 | protobuf / `pb_req_recast_relic` | `pb_res_op_relic` |
| 89707 | `req_relic_reset` | 未路由 | etf / `—` | `pb_rsp_reset_relic` |
| 89708 | `req_relic_stage` | 未路由 | protobuf / `pb_req_stage_relic` | `pb_res_op_relic` |
| 89709 | `req_relic_wear` | 未路由 | protobuf / `pb_relic_wear_req` | `pb_relic_wear_rsp` |
| 89710 | `req_relic_up_sp` | 未路由 | etf / `—` | `pb_relic_sp_up_rsp` |
| 89711 | `req_relic_variation` | 未路由 | etf / `—` | `pb_variation_back` |
| 89712 | `req_relic_refine` | 未路由 | etf / `—` | `pb_relic_refine_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-MAGICCIRCLE：法阵尚缺的批量升级与属性接入

协议模块：`MagicCircleCmd`。未路由 0；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 5。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“法阵尚缺的批量升级与属性接入”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[magic-circle-service.mjs](../../../personal-server/game/magic-circle-service.mjs)。

已确认的附加缺口：

- 90401–90405 已实现单步状态养成；90402 的多级升级明确拒绝，长按/批量语义待补。
- 法阵属性与技能尚未进入战斗；重置返还规则未取证，不能擅自发材料。

本任务没有新增数字命令：需要补齐上面的运行集成缺口，而不是重复添加已存在路由。

已有处理路径（必须回归）：`90401 req_magic_circle_star_up`、`90402 req_magic_circle_level_up`、`90403 req_magic_circle_break_up`、`90404 req_magic_circle_active_point`、`90405 req_magic_circle_reset`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-PET：魔灵合成、上阵、升级、升星、装备、符文与变异

协议模块：`PetCmd`。未路由 17；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“魔灵合成、上阵、升级、升星、装备、符文与变异”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90731 | `req_pet_combine` | 未路由 | etf / `—` | `pb_rsp_pet_develop` |
| 90732 | `req_pet_raise_star` | 未路由 | etf / `—` | `pb_rsp_pet_develop` |
| 90733 | `req_pet_lineup` | 未路由 | etf / `—` | `—` |
| 90734 | `req_pet_upgrade` | 未路由 | protobuf / `pb_req_pet_up_lv` | `pb_rsp_pet_develop` |
| 90736 | `req_equip_combine` | 未路由 | protobuf / `pb_req_combine_equip` | `pb_rsp_pet_equip` |
| 90737 | `req_equip_convert` | 未路由 | protobuf / `pb_req_combine_equip` | `pb_rsp_pet_equip` |
| 90738 | `req_rune_upgrade` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90739 | `req_rune_convert` | 未路由 | protobuf / `pb_req_pet_rune_convert` | `pb_res_to_client` |
| 90740 | `req_book_upgrade` | 未路由 | etf / `—` | `pb_pet_book_rsp` |
| 90741 | `req_pet_up_quality` | 未路由 | etf / `—` | `pb_pet_up_quality_back` |
| 90742 | `req_pet_equip_up` | 未路由 | protobuf / `pb_pet_equip_star_up` | `pb_pet_equip_star_up_back` |
| 90743 | `req_pet_open_ability` | 未路由 | etf / `—` | `pb_rsp_pet_develop` |
| 90744 | `req_pet_lineup_help` | 未路由 | protobuf / `pb_pet_help_slot_list` | `—` |
| 90745 | `req_pet_break` | 未路由 | etf / `—` | `pb_rsp_pet_develop` |
| 90746 | `pb_req_pet_slot_wear_equip_insert` | 未路由 | protobuf / `pb_req_pet_slot_wear_equip_insert` | `pb_rsp_pet_wear_equip` |
| 90747 | `req_pet_mutant` | 未路由 | etf / `—` | `pb_rsp_pet_develop` |
| 90748 | `req_pet_up_promote_lv` | 未路由 | protobuf / `pb_pet_up_promote_lv_req` | `pb_rsp_pet_develop` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-PETPLAY：魔灵探索与周期奖励

协议模块：`PetPlayCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“魔灵探索与周期奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 90901 | `req_pet_play_period_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 90902 | `req_pet_play_over_explore` | 未路由 | etf / `—` | `pb_pet_play` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-ENERGYBURST：能量爆发奖励

协议模块：`EnergyBurstCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“能量爆发奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91001 | `req_energy_burst_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-TREASURE：秘宝升星、抽奖、套装、属性、自选与宝箱

协议模块：`TreasureCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“秘宝升星、抽奖、套装、属性、自选与宝箱”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93301 | `req_treasure_star` | 未路由 | etf / `—` | `pb_treasure_star_ret` |
| 93302 | `req_treasure_draw_award` | 未路由 | etf / `—` | `pb_treasure_draw_phase_award_back` |
| 93303 | `req_treasure_suit_up` | 未路由 | etf / `—` | `pb_treasure_suit` |
| 93304 | `req_treasure_attr_update` | 未路由 | etf / `—` | `—` |
| 93305 | `req_treasure_custom_draw` | 未路由 | protobuf / `pb_treasure_custom_draw` | `pb_treasure_custom_draw` |
| 93306 | `req_treasure_box` | 未路由 | protobuf / `pb_treasure_box_req` | `pb_treasure_box_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-ELVES：精灵升星、天赋、图鉴、助战、皮肤与变异

协议模块：`ElvesCmd`。未路由 7；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“精灵升星、天赋、图鉴、助战、皮肤与变异”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93701 | `req_elves_up_star` | 未路由 | protobuf / `pb_elves_up_star_req` | `pb_elves_develop_rsp` |
| 93702 | `req_elves_up_talent` | 未路由 | protobuf / `pb_elves_up_talent_req` | `pb_elves_develop_rsp` |
| 93703 | `req_elves_up_book` | 未路由 | protobuf / `pb_elves_up_book_req` | `pb_elves_develop_rsp` |
| 93704 | `req_elves_lineup_help` | 未路由 | protobuf / `pb_elves_lineup_help_req` | `—` |
| 93705 | `req_elves_wear_skin` | 未路由 | protobuf / `pb_elves_wear_skin_req` | `—` |
| 93706 | `req_elves_mutant` | 未路由 | etf / `—` | `pb_elves_mutant_back` |
| 93707 | `req_elves_up_break_lv` | 未路由 | protobuf / `pb_elves_up_break_lv_req` | `pb_elves_develop_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-ELVESBEAD：精灵珠升级、升星、穿脱与分解

协议模块：`ElvesBeadCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“精灵珠升级、升星、穿脱与分解”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93751 | `req_bead_up_level` | 未路由 | protobuf / `pb_bead_level_up_req` | `pb_bead_develop_rsp` |
| 93752 | `req_bead_up_star` | 未路由 | protobuf / `pb_bead_up_star_req` | `pb_elves_bead_back` |
| 93753 | `req_bead_wear` | 未路由 | protobuf / `pb_bead_equip_req` | `pb_bead_equip_rsp` |
| 93754 | `req_bead_un_wear` | 未路由 | protobuf / `pb_bead_un_equip_req` | `pb_bead_un_equip_rsp` |
| 93755 | `req_bead_resolve` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-LEADEREQUIP：团长装备升级、升星、分解、增幅与重铸

协议模块：`LeaderEquipCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“团长装备升级、升星、分解、增幅与重铸”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[leader-equip-service.mjs](../../../personal-server/game/leader-equip-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98402 | `req_leader_equip_up_level` | 未路由 | etf / `—` | `pb_leader_equip_up_level_back` |
| 98403 | `req_leader_equip_up_star` | 未路由 | protobuf / `pb_leader_equip_up_star_req` | `pb_leader_equip_back` |
| 98404 | `req_leader_equip_dissolve` | 未路由 | etf / `—` | `pb_res_to_client` |
| 98405 | `req_leader_equip_intensify` | 未路由 | etf / `—` | `pb_leader_equip_intensify_back` |
| 98406 | `req_leader_equip_recast` | 未路由 | etf / `—` | `pb_leader_equip_recast_back`（定义缺失） |
| 98407 | `req_leader_equip_save_dismiss` | 未路由 | etf / `—` | `—` |

已有处理路径（必须回归）：`98401 req_leader_equip`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-DIVINEEMBRYO：神胚选择

协议模块：`DivineEmbryoCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“神胚选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102201 | `req_divine_embryo_select` | 未路由 | etf / `—` | `pb_divine_embryo_data` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## EQUIP-BADGE：徽章激活

协议模块：`BadgeCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“徽章激活”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104201 | `req_badge_active` | 未路由 | protobuf / `pb_badge_active_req` | `pb_badge_role` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
