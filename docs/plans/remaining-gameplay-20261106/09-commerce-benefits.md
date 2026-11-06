# 礼包、通行证、基金、返利、拍卖与福利

本分区 53 个模块任务，106 条未路由/明确拒绝/占位命令。优先级：P1/P2。

共同依赖：复用现有 wallet/voucher/mail/permit/recharge 事务；CORE-EVENTS；拍卖还依赖 SOC 身份与 ITEM 结算。

每个二级小节是一张可独立派发的任务卡。编码、字段、静态来源及已有路径见 [inventory.json](inventory.json)，共同交付标准见 [实施与验收](11-dispatch-and-acceptance.md)。中文为协议名释义，具体 UI 文案以证据核对。

## PAY-RECHARGE：龙晶等额外充值入口

协议模块：`RechargeCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 4。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“龙晶等额外充值入口”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[first-recharge-service.mjs](../../../personal-server/game/first-recharge-service.mjs)、[gateway.mjs](../../../personal-server/game/gateway.mjs)、[welfare-service.mjs](../../../personal-server/game/welfare-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 16006 | `req_loong_recharge` | 未路由 | protobuf / `pb_recharge_buy_or_rev_req` | `res_buy_or_Rev_gift` |

已有处理路径（必须回归）：`16001 req_get_first_recharge_reward`、`16003 req_notify_get_recharge_reward`、`16004 req_recharge_by_token`、`16005 req_buy_or_rev_gift`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-TRIGGERGIFT：触发礼包激活与次数

协议模块：`TriggerGiftCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“触发礼包激活与次数”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 18001 | `req_active_trigger_gift` | 未路由 | etf / `—` | `pb_trigger_gift` |
| 18002 | `req_add_trigger_times` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-UPSTARGIFT：升星礼包奖励与版本

协议模块：`UpStarGiftCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“升星礼包奖励与版本”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 31052 | `req_up_star_gift_award` | 未路由 | protobuf / `pb_up_star_gift_req` | `pb_up_star_gift_back` |
| 31053 | `req_up_star_choose_version` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-VIP：VIP 礼包、特权奖励与经验兑换

协议模块：`VipCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“VIP 礼包、特权奖励与经验兑换”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 33001 | `req_buy_vip_gift` | 未路由 | etf / `—` | `pb_res_to_client` |
| 33002 | `req_get_vip_addition_reward` | 未路由 | etf / `—` | `pb_res_to_client` |
| 76301 | `req_vip_exp_exchange` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-PERMIT：普通通行证买级、福利、结算、自选与选期

协议模块：`PermitCmd`。未路由 8；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 3。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“普通通行证买级、福利、结算、自选与选期”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 购买、普通免费/付费档及一键领奖 35001/35002/35005 已实现；买级、福利、自选、期数与结算命令仍缺，不能把所有通行证标成全未实现。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 35003 | `req_permit_buy_level` | 未路由 | etf / `—` | `pb_permit_buy_level_back` |
| 35004 | `req_permit_adjust_cycle` | 未路由 | etf / `—` | `pb_permit_settle_back` |
| 35006 | `req_permit_gain_welfare` | 未路由 | etf / `—` | `pb_permit_gain_welfare_toc` |
| 35007 | `req_permit_buy_times_data` | 未路由 | etf / `—` | `pb_permit_server_data` |
| 35008 | `req_permit_manual_update` | 未路由 | etf / `—` | `pb_permit_manual_update_back` |
| 35009 | `req_permit_manual_settle` | 未路由 | etf / `—` | `pb_permit_settle_back` |
| 35010 | `req_permit_select_award` | 未路由 | protobuf / `pb_permit_select_award_req` | `pb_permit_select_award_back` |
| 35011 | `req_permit_choose_req` | 未路由 | protobuf / `pb_permit_choose_req` | `pb_permit_info` |

已有处理路径（必须回归）：`35001 req_permit_receive_free`、`35002 req_permit_receive_pay`、`35005 req_permit_receive_all`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-ONLINEGIFT：在线礼包

协议模块：`OnlineGiftCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“在线礼包”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 37010 | `req_online_gift_award` | 未路由 | etf / `—` | `pb_online_gift_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-FUNDACT：活动基金领奖

协议模块：`FundActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“活动基金领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 51001 | `req_fund_act_award` | 未路由 | etf / `—` | `pb_fund_act_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-NOTIFYGIFT：通知礼包激活

协议模块：`NotifyGiftCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“通知礼包激活”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 76201 | `req_notify_gift_activate` | 未路由 | etf / `—` | `pb_notify_gift_activate_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-REDENVELOPE：普通红包领奖与详情

协议模块：`RedEnvelopeCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“普通红包领奖与详情”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 77001 | `req_red_envelope_award` | 未路由 | etf / `—` | `pb_red_envelope_award_rsp` |
| 77002 | `req_red_envelope_info` | 未路由 | etf / `—` | `pb_client_red_envelope`（定义缺失） |
| 77003 | `req_red_envelope_info_by_sender` | 未路由 | etf / `—` | `pb_client_red_envelopes` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-VIPGIFT：VIP 专属礼包领奖

协议模块：`VipGiftCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“VIP 专属礼包领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 77101 | `vip_gift_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-FASHION：时装激活、穿戴与升级

协议模块：`FashionCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“时装激活、穿戴与升级”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 82602 | `req_fashion_act` | 未路由 | etf / `—` | `pb_res_to_client` |
| 82603 | `req_fashion_wear` | 未路由 | etf / `—` | `—` |
| 82604 | `req_fashion_lv` | 未路由 | etf / `—` | `pb_fashion_lv_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-VIPCITY：VIP 城市重建

协议模块：`VipCityCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“VIP 城市重建”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 82701 | `req_vip_city_rebuild` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-PRINCESS：公主/Princess 奖励补领与跨期刷新

协议模块：`PrincessCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 1。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“公主/Princess 奖励补领与跨期刷新”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[welfare-service.mjs](../../../personal-server/game/welfare-service.mjs)。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 84602 | `req_princess_award_supplement` | 未路由 | etf / `—` | `pb_princess_supplement_back` |
| 84603 | `req_cross_refresh_supplement` | 未路由 | etf / `—` | `pb_princess_energy_supplement` |

已有处理路径（必须回归）：`84601 req_princess_award`。

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-PERMANENTCARD：永久卡奖励领取

协议模块：`PermanentCardCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“永久卡奖励领取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

已确认的附加缺口：

- 永久卡购买/登录状态已有实现；87301 独立领奖没有网关路由。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87301 | `req_permanent_card_award` | 未路由 | etf / `—` | `pb_permanent_card_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-RECOVERY：资源追回免费奖励

协议模块：`RecoveryCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“资源追回免费奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87401 | `req_recovery_free_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-WEEKENDBONUS：周末奖励与游玩次数

协议模块：`WeekendBonusCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“周末奖励与游玩次数”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 87501 | `req_weekend_award` | 未路由 | etf / `—` | `pb_weekend_bonus_back` |
| 87502 | `req_weekend_play_count_award` | 未路由 | etf / `—` | `pb_weekend_bonus_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-LEVELSPRINT：等级冲刺免费奖

协议模块：`LevelSprintCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“等级冲刺免费奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88101 | `req_level_sprint_free_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-HOUSEASSISTANT：看板助手背景、选择与试用

协议模块：`HouseAssistantCmd`。未路由 4；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“看板助手背景、选择与试用”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88201 | `req_house_assistant_choose_bg` | 未路由 | protobuf / `pb_house_assistant_use_req_list` | `pb_house_assistant_use_rsp` |
| 88202 | `req_house_assistant_choose_assist` | 未路由 | protobuf / `pb_house_assistant_use_req_list` | `pb_house_assistant_use_rsp` |
| 88203 | `req_house_assistant_trial` | 未路由 | protobuf / `pb_house_assistant_trial_req` | `pb_house_assistant_trial_rsp` |
| 88204 | `req_house_assistant_trial_cancel` | 未路由 | protobuf / `pb_house_assistant_trial_cancel_req` | `pb_house_assistant_trial_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-HEATGIFT：热度礼包支援与全服数据

协议模块：`HeatGiftCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“热度礼包支援与全服数据”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88601 | `req_heat_gift_support` | 未路由 | etf / `—` | `pb_heat_gift_support_back` |
| 88602 | `req_heat_gift_server_info` | 未路由 | etf / `—` | `pb_heat_gift` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-FLASHSALE：限时特卖砍价与英雄

协议模块：`FlashSaleCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“限时特卖砍价与英雄”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88701 | `req_flash_sale_bargain` | 未路由 | etf / `—` | `pb_flash_sale_bargain_ret` |
| 88702 | `req_flash_sale_hero` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-ASSISTANT：玩法助手功能设置与执行

协议模块：`AssistantCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“玩法助手功能设置与执行”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 88901 | `req_assistant_set_func` | 未路由 | protobuf / `pb_assistant_setting_req` | `pb_assistant_setting_back` |
| 88902 | `req_assistant_do_command` | 未路由 | protobuf / `pb_assistant_execute_req` | `pb_assistant_execute_back` |
| 88903 | `req_assistant_start_try` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-PREBOOK：预约任务与分享奖励

协议模块：`PrebookCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“预约任务与分享奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92401 | `req_prebook_task_award` | 未路由 | etf / `—` | `pb_prebook_back` |
| 92402 | `req_prebook_share_award` | 未路由 | etf / `—` | `pb_prebook_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-ROLESHARE：玩家分享奖励

协议模块：`RoleShareCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“玩家分享奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92501 | `req_role_share_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-CROSS：跨服广告、功能免费与付费奖

协议模块：`CrossCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“跨服广告、功能免费与付费奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92601 | `req_cross_receive_ads_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 92602 | `req_cross_receive_fun_free_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 92603 | `req_cross_receive_fun_pay_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-REDRAIN：红包雨随机、领取与激活

协议模块：`RedRainCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“红包雨随机、领取与激活”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 92901 | `req_red_rain_random` | 未路由 | etf / `—` | `pb_red_rain` |
| 92902 | `req_red_rain_rev` | 未路由 | protobuf / `pb_red_rain_rev_award_req` | `pb_red_rain_back` |
| 92903 | `req_red_rain_active` | 未路由 | etf / `—` | `pb_red_rain` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-DIAMONDFUND：钻石基金稳健/幸运奖励领取

协议模块：`DiamondFundCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“钻石基金稳健/幸运奖励领取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

已确认的附加缺口：

- 基金购买和订单回填已有实现；93201/93202 两类领奖没有路由。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93201 | `req_steady_award` | 未路由 | etf / `—` | `pb_diamond_award_rsp` |
| 93202 | `req_fortune_award` | 未路由 | etf / `—` | `pb_diamond_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-WEEKHUNT：周猎任务、进度与升级礼包

协议模块：`WeekHuntCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“周猎任务、进度与升级礼包”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

已确认的附加缺口：

- 周礼包购买、周期与模块 533 回填已有实现；93401/93402/93403 任务、进度、升级礼包操作无路由。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 93401 | `req_week_hunt_common_task` | 未路由 | protobuf / `pb_week_common_task_req` | `pb_week_common_task_rsp` |
| 93402 | `req_week_hunt_common_progress` | 未路由 | protobuf / `pb_week_common_progress_req` | `pb_week_common_progress_rsp` |
| 93403 | `req_week_hunt_upgrade_gift` | 未路由 | protobuf / `pb_week_upgrade_gift_req` | `pb_week_upgrade_gift_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-LINKGIFT：联动礼包自选

协议模块：`LinkGiftCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“联动礼包自选”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 97401 | `req_link_gift_custom_choose` | 未路由 | etf / `—` | `pb_link_gift_custom_item` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-VIPLINK：VIP 联动展示

协议模块：`VipLinkCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“VIP 联动展示”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98001 | `req_vip_link_show` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-GEMREBATEACT：宝石返利投入

协议模块：`GemRebateActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“宝石返利投入”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98630 | `req_gem_rebate_put` | 未路由 | protobuf / `pb_gem_rebate_req` | `pb_gem_rebate_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-APPEARANCERELEASEACT：外观上新互动

协议模块：`AppearanceReleaseActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“外观上新互动”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 98800 | `req_appearance_release_act_interact` | 未路由 | protobuf / `pb_appearance_release_act_interact_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-CAKEACTIVITY：蛋糕活动每日、充值与托盘选择

协议模块：`CakeActivityCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“蛋糕活动每日、充值与托盘选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99000 | `req_cake_activity_daily_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99001 | `req_cake_activity_rechage_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99002 | `req_cake_activity_select_plate` | 未路由 | protobuf / `pb_cake_activity_select_plate_req` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-QUADRUPLECROSS：四重跨期随机、免费与付费奖

协议模块：`QuadrupleCrossCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“四重跨期随机、免费与付费奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99500 | `req_quadruple_cross_random_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99501 | `req_quadruple_cross_free_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 99502 | `req_quadruple_cross_pay_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-FINANCEMANAGEACT：理财产品选择与返利

协议模块：`FinanceManageActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“理财产品选择与返利”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 99901 | `req_finance_manage_act_select_product` | 未路由 | protobuf / `pb_finance_manage_act_select_product_req` | `pb_res_to_client` |
| 99902 | `req_finance_manage_act_rebate` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-SKINCRYSTAL：皮肤水晶购买

协议模块：`SkinCrystalCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“皮肤水晶购买”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100401 | `req_skin_crystal_buy` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-GROUPBUYACT：团购全服统计与团购奖

协议模块：`GroupBuyActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“团购全服统计与团购奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 100601 全服数据只回空对象；100602 团购奖未实现，商品付款不能代替团购人数、目标和奖励。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100601 | `req_group_buy_act_server_data` | 空结构/固定值/仅应答：团购全服数据为空 | etf / `—` | `pb_group_buy_act_server` |
| 100602 | `req_group_buy_act_group_award` | 未路由 | protobuf / `pb_group_buy_act_group_award_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-REBATESHOPACT：返利商店领奖

协议模块：`RebateShopActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“返利商店领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 100701 | `req_rebate_shop_act_award` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-DIVINEREALMACT：神域活动礼包选择

协议模块：`DivineRealmActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“神域活动礼包选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101701 | `req_divine_realm_act_select_gift` | 未路由 | protobuf / `pb_divine_realm_gift_select_req` | `pb_divine_realm_act_gift` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-BONUSSHOP：奖励商店购买

协议模块：`BonusShopCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“奖励商店购买”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 101903 | `req_bonus_shopping` | 未路由 | protobuf / `pb_bonus_shopping_req` | `pb_bonus_shopping_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-AUCTION：拍卖出价、心愿、分红与详情

协议模块：`AuctionCmd`。未路由 5；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“拍卖出价、心愿、分红与详情”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 102701 | `req_auction_bid` | 未路由 | protobuf / `pb_auction_bid_req` | `pb_auction_bid_back` |
| 102702 | `req_auction_wish` | 未路由 | protobuf / `pb_auction_wish_req` | `—` |
| 102703 | `req_auction_dividend_award` | 未路由 | etf / `—` | `pb_auction_dividend_rev_back` |
| 102704 | `req_auction_attend` | 未路由 | etf / `—` | `pb_role_auction_list` |
| 102705 | `req_auction_detail` | 未路由 | etf / `—` | `pb_auction` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-SKINRECHARGE：皮肤充值角色选择

协议模块：`SkinRechargeCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“皮肤充值角色选择”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 103601 | `req_skin_recharge_get_role` | 未路由 | etf / `—` | `—` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-BUYSKINACT：购皮肤活动免费奖励

协议模块：`BuySkinActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“购皮肤活动免费奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104001 | `req_buy_skin_free_award` | 未路由 | protobuf / `pb_buy_skin_free_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-ACTSHOP：活动商店数据、购买与等级奖励

协议模块：`ActShopCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“活动商店数据、购买与等级奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 104801 | `req_act_shop_info` | 未路由 | protobuf / `pb_act_shop_info_req` | `pb_act_shop_info_rsp` |
| 104802 | `req_act_buy_goods` | 未路由 | protobuf / `pb_act_buy_goods_req` | `pb_act_buy_goods_rsp` |
| 104803 | `req_act_shop_level_rewards` | 未路由 | protobuf / `pb_act_shop_level_rewards_req` | `pb_act_shop_level_rewards_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-PREMIUMACT：增值活动免费奖励

协议模块：`PremiumActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“增值活动免费奖励”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105401 | `req_premium_free_award` | 未路由 | protobuf / `pb_premium_free_award_req` | `pb_premium_free_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-RECYCLEACT：回收活动

协议模块：`RecycleActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“回收活动”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 105901 | `req_recycle_act_recycle` | 未路由 | protobuf / `pb_recycle_act_recycle_req` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-VICKREYAUCTIONACT：维克里/密封拍卖

协议模块：`VickreyAuctionActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“维克里/密封拍卖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 106101 | `req_vickrey_auction_act_get_info` | 未路由 | protobuf / `pb_vickrey_auction_act_info_req` | `pb_vickrey_auction_act_info_rsp` |
| 106102 | `req_vickrey_act_auction_bid` | 未路由 | protobuf / `pb_vickrey_auction_act_bid_req` | `pb_vickrey_auction_act_bid_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-GIFTBOXACT：礼盒活动领取

协议模块：`GiftBoxActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“礼盒活动领取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 106301 | `req_gift_box_receive` | 未路由 | protobuf / `pb_gift_box_receive_req` | `pb_gift_box_receive_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-SUBSCRIPTIONACT：订阅、领取与入场

协议模块：`SubscriptionActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“订阅、领取与入场”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107301 | `req_subscription_act_subscribe` | 未路由 | protobuf / `pb_subscription_act_subscribe_req` | `pb_subscription_act_subscribe_rsp` |
| 107302 | `req_subscription_act_get` | 未路由 | protobuf / `pb_subscription_act_subscribe_req` | `pb_subscription_act_award_rsp` |
| 107303 | `req_subscription_act_enter` | 未路由 | etf / `—` | `pb_subscription_act_data` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-NEWPERMITACT：新通行证领奖

协议模块：`NewPermitActCmd`。未路由 1；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“新通行证领奖”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107401 | `req_new_permit_award` | 未路由 | protobuf / `pb_new_permit_award_req` | `pb_new_permit_award_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-DRAGONLANDACT：龙岛日奖、试炼奖与公会数据

协议模块：`DragonLandActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 1；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“龙岛日奖、试炼奖与公会数据”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)。

已确认的附加缺口：

- 107703 只回空公会数据；107701/107702 每日和试炼领奖无路由，挑战及公会贡献来源要一并闭合。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 107701 | `req_dragon_land_daily_award` | 未路由 | protobuf / `pb_dragon_land_daily_award_req` | `pb_dragon_land_daily_award_rsp` |
| 107702 | `req_dragon_land_trial_award` | 未路由 | protobuf / `pb_dragon_land_trial_award_req` | `pb_dragon_land_trial_award_rsp` |
| 107703 | `req_dragon_land_guild_data` | 空结构/固定值/仅应答：龙岛公会数据为空 | protobuf / `pb_dragon_land_guild_data_req` | `pb_dragon_land_guild_data_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-DIAMONDBANKACT：钻石银行任务、奖励与购买

协议模块：`DiamondBankActCmd`。未路由 3；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“钻石银行任务、奖励与购买”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110201 | `req_diamond_bank_act_task` | 未路由 | protobuf / `pb_diamond_bank_act_base_req` | `pb_diamond_bank_act_task_rsp` |
| 110202 | `req_diamond_bank_act_award` | 未路由 | etf / `—` | `pb_res_to_client` |
| 110203 | `req_diamond_bank_act_buy` | 未路由 | etf / `—` | `pb_res_to_client` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-FREEPRIVILEGEACT：免费特权及月度激活

协议模块：`FreePrivilegeActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“免费特权及月度激活”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110601 | `req_free_privilege_act_activate` | 未路由 | etf / `—` | `pb_free_privilege_act_activate_back` |
| 110602 | `req_free_privilege_act_activate_month` | 未路由 | etf / `—` | `pb_free_privilege_act_activate_month_back` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。

## PAY-SLOTGAMEACT：老虎机活动游玩与领取

协议模块：`SlotGameActCmd`。未路由 2；明确拒绝 0；空结构/固定值/仅应答 0；有处理路径，需保持回归 0。

实施目标：补齐下表所列命令的真实业务、权威状态、资源/奖励和登录/推送同步，形成“老虎机活动游玩与领取”可重登恢复的操作闭环。保留现有可用分支。

代码起点：[gateway.mjs](../../../personal-server/game/gateway.mjs)（目前没有对应业务路由）。

| type | 命令 | 当前行为 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- | --- |
| 110801 | `req_slot_game_act_go` | 未路由 | protobuf / `pb_slot_game_act_go_req` | `pb_slot_game_act_role_data` |
| 110802 | `req_slot_game_act_get` | 未路由 | protobuf / `pb_slot_game_act_draw_req` | `pb_slot_game_act_draw_rsp` |

完成条件：本任务全部缺失分支有业务证据和真实状态转移；资源、状态、领取位与回包原子提交；通过专项服务、临时 TCP、SQLite 重开验证。单独记录未取得的规则/客户端验收，不以空包或固定结果销项。
