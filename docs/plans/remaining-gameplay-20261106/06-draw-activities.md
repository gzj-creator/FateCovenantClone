# 招募、抽取、翻牌与转盘活动

本分区 31 个模块任务，74 条未路由/明确拒绝/占位命令。优先级：P1/P2。

共同依赖：CORE-EVENTS、CORE-DRAW-POOLS；每个奖池独立持久化保底/轮次，库存和消耗在同一事务。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## DRAW-MAGICDRAW：魔法招募选人、成就与升星奖励

协议模块：`MagicDrawCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“魔法招募选人、成就与升星奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 60002 | `req_magic_draw_choose_hero` | 未路由 | etf / `—` | `pb_magic_draw_back` |
| 60003 | `req_magic_draw_achieve_award` | 未路由 | etf / `—` | `pb_magic_draw_back` |
| 60004 | `req_magic_draw_hero_star_award` | 未路由 | etf / `—` | `pb_magic_draw_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-PINBALL：弹珠活动成就

协议模块：`PinBallCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“弹珠活动成就”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88921 | `req_pin_ball_act_achieve_award` | 未路由 | etf / `—` | `pb_act_pin_ball_role_res_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-FANTASYEQUIPACT：幻武活动管道小游戏、任务与试炼闭环

协议模块：`FantasyEquipActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 8。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“幻武活动管道小游戏、任务与试炼闭环”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[fantasy-equip-act-service.mjs](../../../personal-server/game/fantasy-equip-act-service.mjs)。

已确认的附加缺口：

- 88922/88924/88927–88932 已有路由；生产 Fantasy Task/FantasyEquipActTask 为 0 行，88932 无合法生产任务。需要证据补齐，不能造任务或空成功。
- 88925/88926 管道重置/游玩与 88921 弹珠成就尚未接入；试炼战斗及伤害统计未接线。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88925 | `req_pipe_connect_reset` | 未路由 | etf / `—` | `pb_pipe_connect_game` |
| 88926 | `req_pipe_connect_play` | 未路由 | protobuf / `pb_pipe_connect_play_req` | `pb_pipe_connect_game` |

已有处理路径（必须回归）：`88922 req_get_day_marbles_award`、`88924 req_fantasy_draw_set_wish`、`88927 req_fantasy_act_vote_award`、`88928 req_fantasy_act_trial_award`、`88929 req_fantasy_act_trial_wear`、`88930 req_fantasy_act_trial_bless`、`88931 req_fantasy_act_trial_copy`、`88932 req_fantasy_act_draw_task`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-PYRAMID：金字塔抽取与任务

协议模块：`PyramidCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“金字塔抽取与任务”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88941 | `req_pyramid_draw` | 未路由 | etf / `—` | `pb_pyramid_draw_back` |
| 88942 | `req_pyramid_task` | 未路由 | etf / `—` | `pb_pyramid_task_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-THREEADMONITION：三诫抽取、宝箱、次数与入场

协议模块：`ThreeAdmonitionCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“三诫抽取、宝箱、次数与入场”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88961 | `req_three_admonition_draw` | 未路由 | etf / `—` | `pb_three_admonition_draw_ret` |
| 88962 | `req_three_admonition_rev_box_award` | 未路由 | etf / `—` | `pb_three_admonition_draw_ret` |
| 88965 | `req_three_admonition_add_draw_count` | 未路由 | etf / `—` | `pb_res_to_client` |
| 88966 | `req_three_admonition_enter_act` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-HUNDREDBONUS：百倍奖励随机、领取与日志

协议模块：`HundredBonusCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“百倍奖励随机、领取与日志”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 89401 | `req_hundred_bonus_random` | 未路由 | etf / `—` | `—` |
| 89402 | `req_hundred_bonus_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 89403 | `req_hundred_bonus_log` | 未路由 | etf / `—` | `pb_hundred_bonus_log_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-WISHTREE：许愿树宝藏及已有抽取链路

协议模块：`WishTreeCmd`。未路由 0；明确拒绝 1；空结构/固定值/仅应答 0；有处理路径，需保持回归 3。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“许愿树宝藏及已有抽取链路”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[wish-tree-service.mjs](../../../personal-server/game/wish-tree-service.mjs)。

已确认的附加缺口：

- 91701/91702/91704 已实现抽取、页签选择与自选记录；91703 宝藏领取始终报未实现。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91703 | `req_wish_tree_rev_treasure` | 明确拒绝：许愿树宝藏领取 | etf / `—` | `pb_wish_tree_rev_treasure_back` |

已有处理路径（必须回归）：`91701 req_wish_tree_draw`、`91702 req_wish_tree_choose_theme`、`91704 req_wish_tree_select`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-CHESS：棋盘抽取、任务、自选、轮次与兑换

协议模块：`ChessCmd`。未路由 6；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“棋盘抽取、任务、自选、轮次与兑换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 91901 | `req_chess_draw` | 未路由 | protobuf / `pb_chess_draw_req` | `pb_chess_draw_rsp` |
| 91902 | `req_chess_task` | 未路由 | etf / `—` | `pb_chess_task_award_rsp` |
| 91903 | `req_chess_choose_award` | 未路由 | etf / `—` | `—` |
| 91904 | `req_chess_new_turn` | 未路由 | protobuf / `pb_chess_new_turn_req` | `pb_chess` |
| 91905 | `req_chess_exchange` | 未路由 | protobuf / `pb_chess_exchange_req` | `pb_chess_exchange_rsp` |
| 91906 | `req_chess_turn_award` | 未路由 | protobuf / `pb_chess_turn_award_req` | `pb_chess_turn_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-RAFFLETICKET：奖券成就

协议模块：`RaffleTicketCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“奖券成就”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92101 | `req_raffle_ticket_achievement` | 未路由 | etf / `—` | `pb_raffle_ticket_phase_award_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-HEROBLAZONDRAW：英雄纹章抽取

协议模块：`HeroBlazonDrawCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“英雄纹章抽取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92201 | `req_hero_blazon_draw` | 未路由 | protobuf / `pb_hero_blazon_draw_req` | `pb_hero_blazon_draw_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-LOTTERYACT：抽奖活动与奖品日志

协议模块：`LotteryActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“抽奖活动与奖品日志”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92301 | `req_lottery_act_draw` | 未路由 | etf / `—` | `pb_lottery_act_draw_back` |
| 92302 | `req_lottery_act_award_log` | 未路由 | etf / `—` | `pb_lottery_act_server` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-MYSTERYWISH：神秘心愿兑换

协议模块：`MysteryWishCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“神秘心愿兑换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93001 | `req_mystery_wish_exchange` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-LOTTERY：彩票抽取与过期处理

协议模块：`LotteryCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“彩票抽取与过期处理”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93101 | `req_lottery` | 未路由 | protobuf / `simple_use` | `pb_res_to_client` |
| 93102 | `req_lottery_expire` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-FLIPCARD：翻牌与轮次

协议模块：`FlipCardCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“翻牌与轮次”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 97201 | `req_flip_card_turn` | 未路由 | protobuf / `pb_flip_card_turn_req` | `pb_flip_card_date` |
| 97301 | `req_flip_card` | 未路由 | protobuf / `pb_flip_card_req` | `pb_flip_card_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-TICKETDRAW：票券抽奖领奖与历史

协议模块：`TicketDrawCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“票券抽奖领奖与历史”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 97501 | `req_ticket_draw_rev_award` | 未路由 | etf / `—` | `pb_ticket_rev_award_back` |
| 97502 | `req_ticket_draw_query_history` | 未路由 | etf / `—` | `pb_ticket_draw_info` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-FRUITDRAWACT：水果抽奖

协议模块：`FruitDrawActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“水果抽奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 97901 | `req_fruit_draw_big` | 未路由 | etf / `—` | `pb_fruit_draw_big_award_back` |
| 97902 | `req_fruit_draw` | 未路由 | etf / `—` | `pb_fruit_draw_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-DRAW：通用抽取心愿选择

协议模块：`DrawCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通用抽取心愿选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98101 | `req_draw_choose_wish` | 未路由 | protobuf / `pb_role_random_draw_item` | `pb_role_random_draw_info` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-DEMIGODACT：神灵降世真实奖池与试炼闭环

协议模块：`DemigodActCmd`。未路由 0；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 8。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“神灵降世真实奖池与试炼闭环”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[demigod-act-service.mjs](../../../personal-server/game/demigod-act-service.mjs)。

已确认的附加缺口：

- 98301–98308 已有事务业务；生产 601 神灵奖池缺有效奖励组，试炼伤害只有 recordTrialDamage API，没有可玩的战斗来源。

本任务没有新增数字命令：需要补齐上面的运行集成缺口，而不是重复添加已存在路由。

已有处理路径（必须回归）：`98301 req_demigod_get_day_marbles_award`、`98302 req_get_big_marbles_award`、`98303 req_demigod_act_trial_award`、`98304 req_demigod_act_trial_wear`、`98305 req_demigod_act_trial_bless`、`98306 req_demigod_act_trial_copy`、`98307 req_demigod_act_draw_award`、`98308 req_demigod_act_choose_wish`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-ELVESACT：精灵活动主精灵、果实抽取与奖励

协议模块：`ElvesActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“精灵活动主精灵、果实抽取与奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100901 | `req_main_elves_tid` | 未路由 | etf / `—` | `—` |
| 100902 | `req_cur_fruit_draw_act` | 未路由 | etf / `—` | `—` |
| 100903 | `req_elves_draw_award` | 未路由 | protobuf / `pb_elves_act_draw_award_req` | `pb_elves_act_draw_award` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-ARTIFACTDRAWACT：圣器天池试炼统计接入

协议模块：`ArtifactDrawActCmd`。未路由 0；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 6。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“圣器天池试炼统计接入”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[artifact-draw-act-service.mjs](../../../personal-server/game/artifact-draw-act-service.mjs)。

已确认的附加缺口：

- 101801–101806 已接服务与网关；recordTrialFight 没有活动战斗调用方，真实试炼伤害、通关记录和试炼任务进度来源仍缺。

本任务没有新增数字命令：需要补齐上面的运行集成缺口，而不是重复添加已存在路由。

已有处理路径（必须回归）：`101801 req_artifact_trials_claim_fight_rewards`、`101802 req_artifact_draw_task_rewards`、`101803 req_artifact_fragments_draw`、`101804 req_artifact_fragments_new_turn`、`101805 req_artifact_fragments_claim`、`101806 req_artifact_fragments_synthesis`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-BONUSDRAW：奖励抽取、切换与选池

协议模块：`BonusDrawCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“奖励抽取、切换与选池”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101901 | `req_bonus_draw` | 未路由 | protobuf / `pb_bonus_draw_req` | `pb_bonus_draw_back` |
| 101902 | `req_bonus_draw_switch` | 未路由 | etf / `—` | `—` |
| 101904 | `req_bonus_choose_pool` | 未路由 | protobuf / `pb_bonus_draw_choose_pool` | `pb_bonus_draw` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-CAPSULETOY：扭蛋、兑换、收集与进度

协议模块：`CapsuleToyCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“扭蛋、兑换、收集与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102301 | `req_capsule_toy_draw` | 未路由 | etf / `—` | `pb_capsule_toy_draw_back` |
| 102302 | `req_capsule_toy_exchange` | 未路由 | protobuf / `pb_capsule_toy_exchange_req` | `pb_res_to_client` |
| 102303 | `req_capsule_toy_collect` | 未路由 | etf / `—` | `pb_capsule_toy_collect_back` |
| 102304 | `req_capsule_toy_progress` | 未路由 | etf / `—` | `pb_capsule_toy_progress_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-CHESSREVERT：棋盘翻转轮次、自选礼物与换轮

协议模块：`ChessRevertCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“棋盘翻转轮次、自选礼物与换轮”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102401 | `req_chess_revert_turn_award` | 未路由 | protobuf / `pb_chess_revert_req` | `pb_chess_revert_award_back` |
| 102402 | `req_chess_revert_act_select_gift` | 未路由 | protobuf / `pb_chess_revert_select_gift_req` | `pb_chess_revert_act_gift` |
| 102403 | `req_chess_revert_next_turn` | 未路由 | protobuf / `pb_chess_revert_next_turn` | `pb_chess_revert_init` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-CHILDPUZZLEACT：拼图抽取、自选、任务与换轮

协议模块：`ChildPuzzleActCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“拼图抽取、自选、任务与换轮”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103301 | `req_puzzle_draw` | 未路由 | protobuf / `pb_puzzle_draw_req` | `pb_puzzle_draw_back` |
| 103302 | `req_puzzle_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 103303 | `req_puzzle_change_turn` | 未路由 | etf / `—` | `pb_puzzle_person` |
| 103304 | `req_puzzle_task_award` | 未路由 | protobuf / `pb_puzzle_task_award_req` | `pb_puzzle_task_award_rsp` |
| 103305 | `req_puzzle_select_award` | 未路由 | etf / `—` | `pb_puzzle_person` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-HOARDWHEELACT：囤积转盘奖池、任务与累计

协议模块：`HoardWheelActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“囤积转盘奖池、任务与累计”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103501 | `req_hoard_wheel_set_pool` | 未路由 | protobuf / `pb_hoard_wheel_draw_change_req` | `pb_hoard_wheel_pool` |
| 103502 | `req_hoard_wheel_task` | 未路由 | protobuf / `pb_hoard_wheel_task_req` | `pb_res_to_client` |
| 103503 | `req_hoard_wheel_pile` | 未路由 | protobuf / `pb_hoard_wheel_pile_req` | `pb_hoard_wheel_pile_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-THOUSANDDRAW：千抽与领奖

协议模块：`ThousandDrawCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“千抽与领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104501 | `req_thousand_draw` | 未路由 | protobuf / `pb_request_thousand_draw` | `pb_response_thousand_draw` |
| 104502 | `req_thousand_award` | 未路由 | protobuf / `pb_request_thousand_award` | `pb_response_thousand_award` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-PRAYACT：祈愿自选与抽取

协议模块：`PrayActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“祈愿自选与抽取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104901 | `req_pray_act_select_award` | 未路由 | protobuf / `pb_pray_act_select_award_req` | `pb_pray_act_select_award_rsp` |
| 104902 | `req_pray_act_draw_award` | 未路由 | protobuf / `pb_pray_act_draw_award_req` | `pb_pray_act_draw_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-CASHBACKDRAW：返利抽奖、次数、全服奖励与进度

协议模块：`CashbackDrawCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“返利抽奖、次数、全服奖励与进度”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105501 | `req_cashback_draw_draw` | 未路由 | protobuf / `pb_cashback_draw_draw_req` | `pb_cashback_draw_draw_rsp` |
| 105502 | `req_cashback_draw_get_times` | 未路由 | protobuf / `pb_cashback_draw_get_times_req` | `pb_cashback_draw_get_times_rsp` |
| 105503 | `req_cashback_draw_server_award` | 未路由 | protobuf / `pb_cashback_draw_server_award_req` | `pb_cashback_draw_server_award_rsp` |
| 105504 | `req_cashback_draw_server_progress` | 未路由 | protobuf / `pb_cashback_draw_server_progress_req` | `pb_cashback_draw_server_progress_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-TURNTABLEACT：转盘活动

协议模块：`TurntableActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“转盘活动”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107901 | `req_turntable_act_go` | 未路由 | etf / `—` | `pb_turntable_act_go_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-FLOPCARDACT：翻牌、单次与累计奖励

协议模块：`FlopCardActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“翻牌、单次与累计奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 109101 | `req_flop_card_flop` | 未路由 | protobuf / `pb_flop_card_act_flop_req` | `pb_flop_card_act_rsp` |
| 109102 | `req_flop_card_get_reward` | 未路由 | protobuf / `pb_flop_card_act_get_reward_req` | `pb_flop_card_act_rsp` |
| 109103 | `req_flop_card_get_total_reward` | 未路由 | protobuf / `pb_flop_card_act_get_total_reward_req` | `pb_flop_card_act_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## DRAW-HUNDREDDRAWACT：百抽、进度奖、自选、升星奖与跑马灯

协议模块：`HundredDrawActCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“百抽、进度奖、自选、升星奖与跑马灯”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[activity-read-service.mjs](../../../personal-server/game/activity-read-service.mjs)。

已确认的附加缺口：

- 117005 只有空跑马灯；117001–117004 的抽取、进度、自选和升星奖励均无路由。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 117001 | `req_hundred_act_draw` | 未路由 | protobuf / `pb_hundred_act_draw_req` | `pb_hundred_act_draw_rsp` |
| 117002 | `req_hundred_act_receive_process_award` | 未路由 | protobuf / `pb_hundred_act_receive_process_award_req` | `pb_hundred_act_receive_process_award_rsp` |
| 117003 | `req_hundred_draw_act_select_award` | 未路由 | protobuf / `pb_hundred_draw_act_select_award_req` | `pb_hundred_draw_act_select_award_rsp` |
| 117004 | `req_hundred_draw_act_rec_star_award` | 未路由 | protobuf / `pb_hundred_draw_act_rec_star_award_req` | `pb_hundred_draw_act_rec_star_award_rsp` |
| 117005 | `req_hundred_draw_act_marquee` | 空结构/固定值/仅应答：百抽跑马灯为空 | protobuf / `pb_hundred_draw_act_marquee_req` | `pb_hundred_draw_act_marquee_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
