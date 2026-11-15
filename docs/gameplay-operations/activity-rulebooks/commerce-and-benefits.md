# 商品与福利详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

更新：2026-11-14。覆盖[原计划09](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md)的53张待办卡，并补入当时已有服务的10族。普通支付和代金券口径另见[经济与商品总章](../05-economy-and-commerce.md)；这里逐家族记录操作、配置、资格与缺口。完整命令列表位于文末。

原表价格、奖励、次数和资格保持原版；钱包仅提供付款渠道，后台增加余额不触发游戏充值。代金券为唯一保留定制的部分。当前具体拒绝原因以[benefit-commerce-service](../../../personal-server/game/benefit-commerce-service.mjs)为准；[I块记录](../../../agent/workflow/gameplay-completion/PAY-BLOCK-I/implementation.md)和[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)是历史证据，独立服务及网关的先后顺序决定最终处理者。

下列“当前”流程由本服源码证明，不自动等于原服算法；没有配置的族只列已知协议边界和真正缺口，不编造商品或数值。非普通商城也须先确定父活动、版本、有效窗口和商品tid；商品价格、支付币种、限购周期与领取条件不能由活动标题推出。

## PAY-RECHARGE：龙晶等额外充值入口

**执行裁定：** [PAY-RECHARGE 的唯一R1决定](../rules/final-rule-register.md#pay-recharge)。本节数值与现代码描述须按该裁定使用。

16004使用实际支付渠道提交合法商品订单，成功后1900同步资源/活动，16003确认已有发奖；16005买/领礼包也须通过该商品Handle及限购校验；16001是首充奖，16006为龙晶入口，不是后台充值余额。订单、扣款、资源、已支付统计与同步事件要同一业务事务提交，重发只能确认同订单。

原Recharge1为type81/pay_type0/price3000/reward401500×300/recharge_stall2001，LoongPrice100为price10；Param含token_item601500/coupon701500及rate100。这些单位必须结合支付类型与消费者解释，不能将price3000直接显示为¥3000。当前普通订单/余额/资源链已接；特殊Handle未恢复应明确拒绝，不借邻商品的奖、价或限购。[RechargeTable](../rules/tables/RechargeTable.md)。

## PAY-TRIGGERGIFT：触发礼包激活与次数

**执行裁定：** [PAY-TRIGGERGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-triggergift)。本节数值与现代码描述须按该裁定使用。

18001激活某个已符合触发条件的礼包，18002增加该礼包允许的触发次数；这两个操作与真正购买、发奖分开。客户端提交激活不能成为任意礼包开放的充分条件，增加次数也不能直接发礼包。

当前有trigger_gift协议，但无TriggerGiftTable及原触发条件、tid关系、可加次数、持续时间和玩家trigger记录，两条均拒绝。没有可确证数值示例；需恢复“哪个实际事件触发哪行、起止时间、增加次数上限、重登和跨期是否保留”，不能套用统一每日限购。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-UPSTARGIFT：升星礼包奖励与版本

**执行裁定：** [PAY-UPSTARGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-upstargift)。本节数值与现代码描述须按该裁定使用。

31053选择允许的升星版本，31052按本版UpStarGift检查真实英雄/魔灵/精灵星级；gift=0的免费任务才直接发award并写已领位，付费gift交RechargeMgr购买。选择版本不能增加星级或刷新已领任务，表tid与英雄实例id不可混用。

原UpStarOneKeyGift1为version2/type1199/target_count5/task_param3030501/gift540213/asserts761850400001；UpStarGift200为version2/type1199/task_param2010101/gift0但award为空，空奖不造资源。当前独立[up-star-gift-service](../../../personal-server/game/up-star-gift-service.mjs)优先处理两条，已修登录版本块与实际窗口；当前某些版全为充值行并非缺失免费奖。原全部目标类型、选择锁定和一键礼包条件仍需逐版验。[UpStarGiftTable](../rules/tables/UpStarGiftTable.md)、[修复记录](../../../agent/workflow/fixes/up-star-gift-20261111.md)。

## PAY-VIP：VIP礼包、特权奖励与经验兑换

**执行裁定：** [PAY-VIP 的唯一R1决定](../rules/final-rule-register.md#pay-vip)。本节数值与现代码描述须按该裁定使用。

33001购买VIP礼包、33002领特权额外奖励、76301兑换VIP经验分别维护支付与领取记录；VIP等级必须由实际合法来源计算，不能由客户端上报等级开满礼包。经验兑换不能反过来补造充值订单。

当前vip协议已有，VipTable和等级/加成/礼包/兑换档尚未导出，三条拒绝。缺购买资格、物品价格、经验倍率、每日或永久领取范围、升级补领和溢出规则；无原数值不得以常见“充值1元=VIP经验”补齐。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-PERMIT：普通通行证买级、福利、结算、自选与选期

**执行裁定：** [PAY-PERMIT 的唯一R1决定](../rules/final-rule-register.md#pay-permit)。本节数值与现代码描述须按该裁定使用。

35001领免费、35002领付费、35005一键领，当前根据真实经验与购买记录发Level奖励；未买不应领付费档。35003买级、35004调周期、35006福利、35007次数、35008更新、35009结算、35010自选、35011选期是其他契约，不能由已有领奖推导全部完成。

原Level2001需exp50/free_award101500×250/permit_award101500×1250及17002×800；Cycle501为cycle7/cycle_type2/func_open1134/settle_mail2821400/rebate3000；Welfare20001为buy_times50、奖101500×100及201500×10000。当前前三条可结算，其余八条因买级/递进/选奖/换期/结算迁移未闭合而拒绝。cycle_type2、rebate3000和经验动态函数需按具体消费者，不直接解释成7天30%返利。[PermitTable](../rules/tables/PermitTable.md)、[permit-service](../../../personal-server/game/permit-service.mjs)。

## PAY-ONLINEGIFT：在线礼包

**执行裁定：** [PAY-ONLINEGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-onlinegift)。本节数值与现代码描述须按该裁定使用。

37010按本日真实在线acc_sec领取下一个OnlineGift档，发奖后推进last_receive_id。在线来自会话开始/关闭/请求时累计，不把离线时间加进来；断线、服务重开和日切需保存已累计秒数及领取位。提前为53901，当期全领为53902。

原OnlineGift801行/Period89行/PeriodMax154行，第一期档含180/360/540秒，OnlineGift1为180秒奖2002×1。当前05:00业务日重置，模块134；period取serverDay并封顶89是当前兼容算法，未按PeriodMax.server_open_stamp/max_period完整恢复原选择。不能把PeriodMax首行max_period212误当现有212期奖。[专项](../../../agent/workflow/gameplay-completion/PAY-ONLINEGIFT/implementation.md)、[OnlineGiftTable](../rules/tables/OnlineGiftTable.md)。

## PAY-FUNDACT：活动基金领奖

**执行裁定：** [PAY-FUNDACT 的唯一R1决定](../rules/final-rule-register.md#pay-fundact)。本节数值与现代码描述须按该裁定使用。

51001应先确认已买本期基金和角色达到对应等级，再领该档一次；档位资格、购买与发奖分离，不因点基金入口产生基金所有权。

当前有fund_act协议，缺FundActTable、等级档/付费商品关系及领取位，明确拒绝。无法确证任何价格或回报率；需取证免费/付费档、买后能否补领已达等级、活动截止和邮件补发，不能借DiamondFund或普通Permit表代替。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-NOTIFYGIFT：通知礼包激活

**执行裁定：** [PAY-NOTIFYGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-notifygift)。本节数值与现代码描述须按该裁定使用。

76201消费的是平台/GMC下发通知所指的合法礼包资格，激活不是任意客户端指定商品。需校验通知身份、领取对象、有效期、是否已激活，再交商品购买/发奖路径。

当前缺对应GMC商品/推送通道及接收位，拒绝。此缺口不是把本地静态活动行加进ActFrame即可解决；通知过期、重推与账号换角色是否共享资格均未取得证据，无可引用的原表奖励数值。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-REDENVELOPE：普通红包领奖与详情

**执行裁定：** [PAY-REDENVELOPE 的唯一R1决定](../rules/final-rule-register.md#pay-redenvelope)。本节数值与现代码描述须按该裁定使用。

77002看红包，77003按发送者看，77001领取真实红包实例；实例需有发送者、剩余份数/金额、已领角色与过期时间。查询不消耗份数，重复领同红包不能重复发，领完不等于删除全部发送历史。

当前pb_red_envelope与复数响应已有，缺RedEnvelopeTable、红包池/掉落、发送者维度和权威领取位，三条拒绝。原随机分包、最低/最高值、发送费用、过期退回和日次数均未知，不能用固定金额红包或普通公会红包实现冒充。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-VIPGIFT：VIP专属礼包领奖

**执行裁定：** [PAY-VIPGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-vipgift)。本节数值与现代码描述须按该裁定使用。

77101按平台送达的VIP gift领取，先确认received_gift位与有效期，再发对应真实礼包。它不同于33001购买VIP礼包，也不同于Princess体力午/晚奖。

当前vip_gift协议和登录结构已有，但无VipGiftTable/GMC礼包源及received_gift写回，拒绝。不能因角色VIP等级或看到推送文本就构造奖励；重推、防重、账号作用域和过期处理均需原证据。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-FASHION：时装激活、穿戴与升级

**执行裁定：** [PAY-FASHION 的唯一R1决定](../rules/final-rule-register.md#pay-fashion)。本节数值与现代码描述须按该裁定使用。

82602激活、82603穿戴、82604升级是三步：先真实拥有/消耗激活材料，再选择已激活且适用角色的时装，升级按下一档扣费并原子保存。穿戴不能重新给激活奖励，升级失败不能只扣材料。

当前FashionTable、模块110的pb_fashion_data/pb_fashion_lv_back已存在；缺FashionCmd/Mgr/Data Lua与真实请求，三个操作的参数、消耗、错误和写回尚未闭合，均拒绝。不能继续写“FashionTable未导出”；也不能拿SkinTable中外观所有权代替Fashion升级系统。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-VIPCITY：VIP城市重建

**执行裁定：** [PAY-VIPCITY 的唯一R1决定](../rules/final-rule-register.md#pay-vipcity)。本节数值与现代码描述须按该裁定使用。

82701针对真实城市建筑执行重建，应检查建筑/当前阶段、VIP资格和配置消耗，保存新阶段及对应产出/领取状态。重发同一步不能再次扣费或重发建筑阶段奖。

当前vip_city协议已有，VipCityTable及建筑和重建费用无证据，拒绝。原是否拆旧返还、等待时间、免费次数、同日重建上限和永久加成均未恢复；不拿常驻家园建筑代替VIP城。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-PRINCESS：公主/Princess奖励补领与跨期刷新

**执行裁定：** [PAY-PRINCESS 的唯一R1决定](../rules/final-rule-register.md#pay-princess)。本节数值与现代码描述须按该裁定使用。

84601领取合法午/晚体力奖，84602补领尚未领的档并前移同一energy领取位，之后84601不可再领相同档。模块126保存energy与supplement；补领不是另开一份奖励。

原EnergyAward1为award_item122702/award_count3/start_time43200/end_time57600/free_day1/reissue_item101500/reissue_count50/unlock_cond649496900001。当前84601/2已有资源结算，日索引使用gameDayIndex；84603跨期刷新缺能量来源、周期与补领迁移而拒绝。原时段、免费补领天数与50的补领付款是否已严格匹配仍须分支核验，不能因84602发奖就称全部条件已齐。[PrincessTable](../rules/tables/PrincessTable.md)、[福利服务](../../../personal-server/game/welfare-service.mjs)。

## PAY-PERMANENTCARD：永久卡奖励领取

**执行裁定：** [PAY-PERMANENTCARD 的唯一R1决定](../rules/final-rule-register.md#pay-permanentcard)。本节数值与现代码描述须按该裁定使用。

87301读取模块62实际element_list中已激活的卡，按PermanentCard.reward发日奖并更新last_reward_day/data_version；未激活不发，同日已领拒绝。多个element当前一起处理，任一重复导致整笔回滚。

原PermanentCard1为recharge490001/reward101500×200/day_limit15/active_item431002/active_num1/buy_day_limit0。当前dayIndex已调用gameDayIndex，默认UTC+8的05:00；源码旧04:00注释不是现行为。day_limit15及另一档30的激活起点/到期门禁尚未完全闭合，免费体验free_endtime与付费element所有权需分别处理。[PermanentCardTable](../rules/tables/PermanentCardTable.md)、[当前处理器](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-RECOVERY：资源追回免费奖励

**执行裁定：** [PAY-RECOVERY 的唯一R1决定](../rules/final-rule-register.md#pay-recovery)。本节数值与现代码描述须按该裁定使用。

87401领取由真实未参与玩法产生的可追回资源，先查追回日期/玩法额度，再扣除该条未领额度并发奖。免费追回不表示能领所有历史活动奖励，免费与付费追回也不能共用同一资格重复发。

当前recovery协议存在，缺RecoveryTable、可追回清单/免费比例/日期和领取位，拒绝。离线天数上限、结算倍率、付费补足及过期清理均无确证值，不能按“昨天没打=原奖励100%”构造资源。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-WEEKENDBONUS：周末奖励与游玩次数

**执行裁定：** [PAY-WEEKENDBONUS 的唯一R1决定](../rules/final-rule-register.md#pay-weekendbonus)。本节数值与现代码描述须按该裁定使用。

87501领玩法奖励、87502领游玩次数档，资格需来自Func.skip_func关联玩法的真实today/total play_count，领取更新reward_bin。不能用打开入口次数充当完成次数，也不能同一完成事件在多个版本重算。

当前WeekendBonus的Func/Shop/Const/WeekendBonus/ProgressAward及模块145已加载，仍缺请求tid映射、真实次数源与reward_bin写回，均拒绝。GrandTourer使用同表的日令牌路径不证明87501/2完成；原周末定义、跨日today与总次数、次数档可补领范围分别待证。[WeekendBonusTable](../rules/tables/WeekendBonusTable.md)。

## PAY-LEVELSPRINT：等级冲刺免费奖

**执行裁定：** [PAY-LEVELSPRINT 的唯一R1决定](../rules/final-rule-register.md#pay-levelsprint)。本节数值与现代码描述须按该裁定使用。

88101应从真实角色等级/升级事件确认LevelSprint免费档，然后记录已领编码；购买冲刺礼包与免费领奖不同。当前LevelSprintTable和pb_level_sprint已有，升级源、位图编码及重复错误未闭合，拒绝。

原活动67001的discard_time1753909200已早于2026-11的审计时间，当前正式排期关闭，不能拿已废弃行解释今天必有弹窗。缺原字段到等级档的完整消费者，不编等级/钻石示例，也不把关闭入口视为玩法已经实现。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-HOUSEASSISTANT：看板助手背景、选择与试用

**执行裁定：** [PAY-HOUSEASSISTANT 的唯一R1决定](../rules/final-rule-register.md#pay-houseassistant)。本节数值与现代码描述须按该裁定使用。

88201给合法Scene选背景，88202选已拥有助手，88203启动允许的Trial，88204取消试用；试用到期需恢复合法所有权/默认选择，不能保留过期付费助手。当前[house-assistant-service](../../../personal-server/game/house-assistant-service.mjs)保存资源归属、使用位和试用时刻，登录清理过期。

原Scene2行/Trial4行；Trial10163200为duration259200/act_tid1006001/id1。259200是该试用秒数，不能推为所有助手固定3天。资格来自活动/外观归属，重复试用是否可延期、跨期再试和免费默认项以原消费者核对；不能靠改PlayerPrefs授予付费所有权。[HouseAssistantTable](../rules/tables/HouseAssistantTable.md)、[专项](../../../agent/workflow/house-assistant/implementation.md)。

## PAY-HEATGIFT：热度礼包支援与全服数据

**执行裁定：** [PAY-HEATGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-heatgift)。本节数值与现代码描述须按该裁定使用。

88601支援应扣真实道具/资格并写个人贡献、全服应援值，88602读取实际聚合；全服限购、解锁与个人奖不是一计数。没有成员贡献时不能固定满热度开放礼包。

当前heat_gift协议有，HeatGiftTable、全服应援聚合、礼包解锁与限购无证据，两条拒绝。缺口包含真实支援单位和奖励关系、退回/结束结算及跨期重置，不以固定零值回包消除正常读取错误。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-FLASHSALE：限时特卖砍价与英雄

**执行裁定：** [PAY-FLASHSALE 的唯一R1决定](../rules/final-rule-register.md#pay-flashsale)。本节数值与现代码描述须按该裁定使用。

88701应根据真实任务进度获得砍价资格，再按原公式改变该礼包价格；88702选择/取得gift_hero需遵守对应版本和购买记录。当前ActivityTable已含FlashSaleTaskGroup3/Task30/Version2/Const2/Gift2，不是整表缺失。

仍缺版本选择、任务2301/1201/1115的真实来源、砍价/暴击公式、最低价及gift_hero和领取位，均拒绝。任务完成与砍价次数、当前折后价格和实际支付价必须同一状态；跨日价格保留/过期恢复不能自定。[ActivityTable](../rules/tables/ActivityTable.md)、[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-ASSISTANT：玩法助手功能设置与执行

**执行裁定：** [PAY-ASSISTANT 的唯一R1决定](../rules/final-rule-register.md#pay-assistant)。本节数值与现代码描述须按该裁定使用。

88901设置开启的合法func，88902执行对应玩法命令，88903开始试用。助手必须调用原业务的资格/次数/成本与真实结算，设置开关不能直接领奖，执行失败不得标已完成全部日常。

当前assistant协议存在，AssistantTable、可执行功能项、命令映射和试用记录无证据，三条拒绝。缺批量顺序、失败后续策略、资源不足行为、每日/试用期限及幂等，不能发固定资源代替实际扫荡。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-PREBOOK：预约任务与分享奖励

**执行裁定：** [PAY-PREBOOK 的唯一R1决定](../rules/final-rule-register.md#pay-prebook)。本节数值与现代码描述须按该裁定使用。

92401根据本期预约任务实际进度领档，92402针对有证据的分享完成领一次。预约登记/分享动作、完成记录、领奖位分离，客户端仅发“领奖”不能产生预约事实。

当前prebook协议有，PrebookTable、任务档和分享奖未取得，均拒绝。平台预约信息、领取账号/角色范围、上线后补发、跨期是否复用未知，无原数值，不套RoleShare或问卷奖励。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-ROLESHARE：玩家分享奖励

**执行裁定：** [PAY-ROLESHARE 的唯一R1决定](../rules/final-rule-register.md#pay-roleshare)。本节数值与现代码描述须按该裁定使用。

92501对应玩家分享后的奖励，需与原分享状态/日期绑定，而非每次打开分享窗口都发一次。平台回调、奖励领取方与同日重复分享应有明确状态。

当前只有role_share协议，缺RoleShareTable、行为证据和发奖记录，拒绝。原是否每日一次、活动一次、截图/链接分享形式及离线回调均未知，不能用固定奖励补全。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-CROSS：跨服广告、功能免费与付费奖

**执行裁定：** [PAY-CROSS 的唯一R1决定](../rules/final-rule-register.md#pay-cross)。本节数值与现代码描述须按该裁定使用。

92601领广告奖，92602领功能免费档，92603领已付费档；三者需要各自实际广告完成、功能资格或支付证明，不能互相替代。跨服是否影响资格应依原分组和周期。

当前cross协议存在，广告/功能礼包的档位、价奖和来源资格仍未闭合，对应新增变更拒绝。本轮已取得的[CrossTable](../rules/tables/CrossTable.md)是跨服分组/神域配置，并非这组广告礼包的价奖表；撤回“CrossTable资产全部缺失”的旧说法。广告次数、重试/中断和paid资格需各自原来源；钱包余额不能激活所有paid奖。[当前拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-REDRAIN：红包雨随机、领取与激活

**执行裁定：** [PAY-REDRAIN 的唯一R1决定](../rules/final-rule-register.md#pay-redrain)。本节数值与现代码描述须按该裁定使用。

92903激活本轮，92901生成/取本轮随机结果，92902领取已经生成的奖；必须保存轮号、pending与领取位，掉线后不得重新随机。未激活不能任意调用随机，已领结果不能换一个请求再发。

当前red_rain协议完整但RedRainTable缺失，轮次、权重/保底和领取记录未恢复，三条拒绝。原落点数、概率、免费次数、激活成本和轮次时间未知，不能按普通红包或老虎机补值。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-DIAMONDFUND：钻石基金稳健/幸运奖励领取

**执行裁定：** [PAY-DIAMONDFUND 的唯一R1决定](../rules/final-rule-register.md#pay-diamondfund)。本节数值与现代码描述须按该裁定使用。

93201领已买稳健基金当日档，93202领已买幸运基金当日随机档；每日结果及minimum保底状态应先确定并持久化，不能重复请求重新抽。原Type1关联recharge155001；SteadyFundAward1为award101500/count1200/earning120；FortuneFundAward1为101500各档count[100,400,500,600]/weight[1,200000,150000,150000]/minimum_count900。

当前15日两类奖励表可读，但购买周期、day_award选择、minimum_count保底触发和day_award_history写回未由原消费者闭合，两条拒绝。900不是“每抽必900”的已证规则，权重也只能在候选/保底分支恢复后计算概率。缺勤补领和买入日/自然日的起点待证。[DiamondFundTable](../rules/tables/DiamondFundTable.md)。

## PAY-WEEKHUNT：周猎任务、进度与升级礼包

**执行裁定：** [PAY-WEEKHUNT 的唯一R1决定](../rules/final-rule-register.md#pay-weekhunt)。本节数值与现代码描述须按该裁定使用。

93401任务奖、93402总进度奖、93403升级礼包均依实际周猎期；任务按pre_task/真实完成累计，不能点领奖自动填完。原Const为task_count3/period_day7/duration_day14/time_split1729026000/rule_time_split1730235600；Task101在period1/day1/pre_task0/进度10、奖1571200×10，Progress101需30、奖101500×288。

当前Period/Const用于真实购买台账，但93401–3仍缺task_id生产、common_progress/week_common_task位图和礼包迁移，均拒绝。Period1的common_gift[2,5]/upgrade_gift[3,4]/free_gift1是本期映射，不证明任意升档可补领所有过去周。7与14的分工和新旧time_split必须按原消费者。[WeekHuntTable](../rules/tables/WeekHuntTable.md)。

## PAY-LINKGIFT：联动礼包自选

**执行裁定：** [PAY-LINKGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-linkgift)。本节数值与现代码描述须按该裁定使用。

97401保存当前LinkGift的custom_list，normal_tid对应基础礼包、choose_gift只能取该条合法候选；真正购买再消费这些选择。选择不能直接发自选物品，也不能把不同活动/版本的选项写到同一个礼包。

当前LinkGiftTable、db结构和完整Lua已有，但normal_tid/choose_gift约束、版本作用域、写入顺序与错误仍未闭合，拒绝；缺口不是“没有net proto”，该请求本身为ETF。跨期选项保留、买后锁定与多项是否必选需原消费者。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-VIPLINK：VIP联动展示

**执行裁定：** [PAY-VIPLINK 的唯一R1决定](../rules/final-rule-register.md#pay-viplink)。本节数值与现代码描述须按该裁定使用。

98001读取已满足VIP/联动条件的展示关系，读取不应激活奖励或购买资格。当前vip_link协议有，VipLinkTable与解锁/展示映射缺失，拒绝。

展示角色、商品与VIP等级关系、是否跟随本期及过期后展示行为均无确证值；返回空列表只能说明本服无数据，不能称原活动没有内容。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-GEMREBATEACT：宝石返利投入

**执行裁定：** [PAY-GEMREBATEACT 的唯一R1决定](../rules/final-rule-register.md#pay-gemrebateact)。本节数值与现代码描述须按该裁定使用。

98630应在本期合法档位投入真实宝石/道具，按表记录投入与返利待领；投入、随机返利、实际发放和退回分开，客户端提交“投入数量”不能生成对应库存。

当前gem_rebate_act协议已有，GemRebateActTable、比例/档位及领取记录无证据，拒绝。原消耗币种、次数、保底和是否立即返还未知，不能以1:1返还或固定倍率作临时原版规则。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-APPEARANCERELEASEACT：外观上新互动

**执行裁定：** [PAY-APPEARANCERELEASEACT 的唯一R1决定](../rules/final-rule-register.md#pay-appearancereleaseact)。本节数值与现代码描述须按该裁定使用。

98800按当前版本NPC idx执行互动，记录interact_state并在合法次数/条件下发奖；浏览外观、互动、购买皮肤是不同事件。当前AppearanceReleaseActTable、请求/登录pb及Lua已导出，缺NPC idx对应、位/计数编码、每日上限和领取迁移，拒绝。

不能只对interact_state做自增就认定原规则已恢复；同NPC重复、换NPC、跨日、跨期和已购买外观后的互动资格需逐消费者核验。表在交付资产可读不等于已作为完整运行配置接入。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-CAKEACTIVITY：蛋糕活动每日、充值与托盘选择

**执行裁定：** [PAY-CAKEACTIVITY 的唯一R1决定](../rules/final-rule-register.md#pay-cakeactivity)。本节数值与现代码描述须按该裁定使用。

99002先选合法托盘，99000按每日条件领，99001依据真实充值领对应托盘奖；选托盘不能产生充值，跨日只重置日领取，不随意清掉实际购买记录。

当前cake_activity协议与ActivityTable内PlayCake片段已有，缺CakeActivityTable或等价完整每日/充值托盘配置和迁移，三条拒绝。它不是烘焙合成BakingAct，不能使用Baking.Order奖代替；托盘切换、未领保留和截止补发未知。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-QUADRUPLECROSS：四重跨期随机、免费与付费奖

**执行裁定：** [PAY-QUADRUPLECROSS 的唯一R1决定](../rules/final-rule-register.md#pay-quadruplecross)。本节数值与现代码描述须按该裁定使用。

99500对应随机结果，99501免费档，99502付费档；需要明确当前期及跨期继承、随机pending和购买资格。领取免费奖不能激活付费档，反复查询不能重置随机。

当前quadruple_cross.db存在，QuadrupleCrossTable与池/档/已领位未取得，三条拒绝。四重具体周期、是否跨服、随机权重和旧期补领均未知，不因“四重”标题构造四个等额奖励。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-FINANCEMANAGEACT：理财产品选择与返利

**执行裁定：** [PAY-FINANCEMANAGEACT 的唯一R1决定](../rules/final-rule-register.md#pay-financemanageact)。本节数值与现代码描述须按该裁定使用。

99901选本期合法理财产品，99902领取真实购买后到期/达标返利；选择是意向，不能直接加返利。产品、买入时刻、本金支付与已返金额必须可追溯。

当前finance_manage_act协议有，FinanceManageActTable、档位/利率/状态缺失，均拒绝。原按日/按阶段返、最短持有、能否切产品、提前结束/补领未知；不能从基金玩法借回报率或给钱包余额计息。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-SKINCRYSTAL：皮肤水晶购买

**执行裁定：** [PAY-SKINCRYSTAL 的唯一R1决定](../rules/final-rule-register.md#pay-skincrystal)。本节数值与现代码描述须按该裁定使用。

100401购买合法SkinCrystal商品应校验货币、剩余限购及持有/发放资源，扣款与奖同时写入；重复请求依业务订单/次数不能无限复制。

当前仅有相关协议，SkinCrystalTable、商品/货币/限购/持有记录无证据，拒绝。水晶是否为直接货币、兑换券或礼包、每日/永久上限和多余皮肤换算未知，不能直接以SkinTable的展示id发物品。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-GROUPBUYACT：团购全服统计与团购奖

**执行裁定：** [PAY-GROUPBUYACT 的唯一R1决定](../rules/final-rule-register.md#pay-groupbuyact)。本节数值与现代码描述须按该裁定使用。

100601聚合同一gift真正支付的不同账号人数，再加本活动开始后达到HeadCompensate.compensate_time的配置人数；100602要求本人实际买过该gift且人数达GroupAward.head_cnt，再发一次该档。配置补偿人数是原表机制，不能删掉当伪造；也不能另造机器人订单凑数。

原Version14行/Gift218行/GroupAward104行/HeadCompensate364行，版本1–9有团购gift；gift1070001的补偿每期14条合计15人，首条1800秒加2；门槛5/10/15/20各奖401500×600。26个团购商品type107/pay_type1/price6000/cost_item401500/限购1/cycle5。当前按act_id作用域聚合/防重，16005回执追加flag93；跨期订单、同账号多角色去重、补偿边界和退款状态仍需原服对照。[专项](../../../agent/workflow/gameplay-completion/PAY-GROUPBUYACT/implementation.md)、[GroupBuyActTable](../rules/tables/GroupBuyActTable.md)。

## PAY-REBATESHOPACT：返利商店领奖

**执行裁定：** [PAY-REBATESHOPACT 的唯一R1决定](../rules/final-rule-register.md#pay-rebateshopact)。本节数值与现代码描述须按该裁定使用。

100701按实际消费累计匹配Award.cost并保存got_shop_award；is_global_cost决定统计作用域，不能拿钱包后台加款或本角色任意资源减少代全服有效消费。

当前RebateShopActTable、db和Lua已导出，消费生产源、is_global_cost账本、档位匹配与领取迁移未闭合，拒绝。原消费包括哪些商品/币种、退款回滚、跨期截断和可多次领取规则待证；不是整张表缺失。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-DIVINEREALMACT：神域活动礼包选择

**执行裁定：** [PAY-DIVINEREALMACT 的唯一R1决定](../rules/final-rule-register.md#pay-divinerealmact)。本节数值与现代码描述须按该裁定使用。

101701保存本期神域活动合法gift选择，购买/领奖再验证所属版本及可选组；选择本身不发包、不增加神域进度。当前divine_realm_act协议有，DivineRealmActTable和档位资格缺失，拒绝。

原是否单选、一次买多档、选后锁定、跨期保留和神域玩法条件均未知，不能借通用PremiumAct自选结构填值；须拿到真实配置与消费者再实现。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-BONUSSHOP：奖励商店购买

**执行裁定：** [PAY-BONUSSHOP 的唯一R1决定](../rules/final-rule-register.md#pay-bonusshop)。本节数值与现代码描述须按该裁定使用。

101903应按BonusShop商品、价格、货币和限购扣费发奖；请求数量须为正且不超过剩余次数，商品作用域随对应活动。名称中的bonus不证明免费。

当前bonus_shop协议存在，BonusShopTable和商品/货币/次数记录缺失，拒绝。价格阶梯、刷新、跨日次数与售罄行为未知，不能把ShopTable中同tid直接当该商店原商品。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-AUCTION：拍卖出价、心愿、分红与详情

**执行裁定：** [PAY-AUCTION 的唯一R1决定](../rules/final-rule-register.md#pay-auction)。本节数值与现代码描述须按该裁定使用。

102704参加真实场次，102705查询详情，102701按底价/加价规则出价，102702保存心愿，102703领取已经结算的分红。需要同场真实竞价集合、当前最高价/买家、冻结资金和最终成交，查询不能生成拍品或分红。

当前auction协议有，AuctionTable与场次、底价、分红、流拍及出价状态缺失，五条拒绝。原加价幅度、截标延时、跨服范围、失败退款、成交发货和分红受益人均待证，不用单角色竞价模拟全服拍卖。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-SKINRECHARGE：皮肤充值角色选择

**执行裁定：** [PAY-SKINRECHARGE 的唯一R1决定](../rules/final-rule-register.md#pay-skinrecharge)。本节数值与现代码描述须按该裁定使用。

103601针对本期SkinRecharge获取/选择符合充值档的角色，资格应来自对应商品实际支付与皮肤归属，不能请求任意角色tid即授予。

当前skin_recharge协议有，SkinRechargeTable、角色/档位/发放与领取记录无证据，拒绝。原自选候选、已有皮肤替换、重复购买补偿及跨期选择保留未知，不以普通英雄招募自选代用。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-BUYSKINACT：购皮肤活动免费奖励

**执行裁定：** [PAY-BUYSKINACT 的唯一R1决定](../rules/final-rule-register.md#pay-buyskinact)。本节数值与现代码描述须按该裁定使用。

104001传item_id领取本期BuySkin免费条目，核条目版本、unlock_day及con_time日窗，并保存该条当业务日已领记录。原免费消费者没有先购买、先拥有皮肤或英雄的要求；撤回“购买前不能领取”的旧结论。购买订单与免费日奖分别记账，不互相增加资格。

本轮已核[BuySkinActTable](../rules/tables/BuySkinActTable.md)及原Lua：175001/version1有五条，解锁日1/3/17/31/45，各101500×50连续3个业务日且每日一次；五SKU1180001—1180005各32800分、每角色每期各1次。con_time不控制商品下架，商品解锁后可购至子E。1514原门槛为通关30203，另核92098；完整原证据和父174001窗口推定见[动态专项](../rules/dynamic-schedule-decisions.md)。当前业务拒绝属于尚未接入，不能再写为这些原语义都未知；未取得原实例的排期身份仍为推定。过期不新增漏日日奖，但已支付/已提交确定权益保留，永久皮肤不删除。

## PAY-ACTSHOP：活动商店数据、购买与等级奖励

**执行裁定：** [PAY-ACTSHOP 的唯一R1决定](../rules/final-rule-register.md#pay-actshop)。本节数值与现代码描述须按该裁定使用。

104801读当前ActFrame与ActShopTable中的真实开放商店，已由[act-shop-service](../../../personal-server/game/act-shop-service.mjs)接管；104802须扣真实货币并更新times/history_tid，104803按等级与claimed_tid_list领取各层奖。

当前读路径可返回真实商店/关闭态，买和多层领奖仍由benefit明确拒绝。ActShop表存在、登录块能创建，不等于购买事务已完成；跨期同商品tid的history、升级跨多层、限购刷新及回包失败回滚尚需原Lua和样本。[ActShopTable](../rules/tables/ActShopTable.md)、[修复记录](../../../agent/workflow/fixes/act-shop-20261112.md)。

## PAY-PREMIUMACT：增值活动免费奖励

**执行裁定：** [PAY-PREMIUMACT 的唯一R1决定](../rules/final-rule-register.md#pay-premiumact)。本节数值与现代码描述须按该裁定使用。

105401免费档需满足Free.asserts后发Free.award并记录free_get_list；付费Config.gift另由Premium商城/支付处理。原Version110行/Config852行/Free72行；Free100001为version100/asserts661021400001/奖101500×50。版本1002有10个gift但没有Free行，不能额外制造免费档。

当前[premium-act-service](../../../personal-server/game/premium-act-service.mjs)负责付费商城配置、父窗口、购买台账和登录，不处理105401；105401仍被benefit拒绝。缺asserts完整语义与免费领取迁移，不能将付费商城可购买等同免费档已恢复。[PremiumActTable](../rules/tables/PremiumActTable.md)、[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-RECYCLEACT：回收活动

**执行裁定：** [PAY-RECYCLEACT 的唯一R1决定](../rules/final-rule-register.md#pay-recycleact)。本节数值与现代码描述须按该裁定使用。

105901提交真实可回收物品与数量，按本期折算规则扣原物品、发回收货币并记录流水；同一实例不能回收两次。回收不是活动结束清币的通用接口。

当前recycle_act协议存在，RecycleActTable、折算/上限/流水无证据，拒绝。原整除/舍入、绑定装备是否可回收、随机返还、跨期余额和邮件去向未知，不能以物品出售价格或1:1换钻补值。[拒绝定义](../../../personal-server/game/benefit-commerce-service.mjs)。

## PAY-VICKREYAUCTIONACT：维克里/密封拍卖

**执行裁定：** [PAY-VICKREYAUCTIONACT 的唯一R1决定](../rules/final-rule-register.md#pay-vickreyauctionact)。本节数值与现代码描述须按该裁定使用。

106101查看当前场次与允许公开的排名信息，106102提交真实密封出价；成交需要原全服竞价集合及第二价格规则、买家支付和落选退款。出价保存不能直接发货，自己的报价不得在冻结前作为公开第一价泄漏。

当前VickreyAuctionActTable、db/net和Lua已导出，缺跨玩家报价集合、前五隐私、第二价格成交、扣款/退款及结算写回，两条均拒绝。原同价先后、保留价、出价修改和结算邮件仍需完整契约；有表不等于拍卖已可运行。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-GIFTBOXACT：礼盒活动领取

**执行裁定：** [PAY-GIFTBOXACT 的唯一R1决定](../rules/final-rule-register.md#pay-giftboxact)。本节数值与现代码描述须按该裁定使用。

106301按GiftBox配置的Box真实购买、base_recharge累计和Gift可领条件发奖，box_bought_list与gift_get_list分别保存。购买盒子不等于所有Gift立即可领，领取附赠不应再次扣购买价格。

当前GiftBoxActTable、pb_gift_box_role_info与Lua已导出，但购买/可领/base_recharge和两个列表迁移未闭合，拒绝。累计充值口径、每盒次数、开盒随机、退单和跨期旧盒补领未知，不用普通物品箱规则代替。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-SUBSCRIPTIONACT：订阅、领取与入场

**执行裁定：** [PAY-SUBSCRIPTIONACT 的唯一R1决定](../rules/final-rule-register.md#pay-subscriptionact)。本节数值与现代码描述须按该裁定使用。

107303进入真实round，107301申请认购，107302领取已由配额抽签确定的结果；请求302的shape已确证，不等于中奖资格。认购名单、冻结资源、配额、winner公示、落选退还和结算邮件各需权威记录。

当前SubscriptionActTable、db/net和Cmd已有，缺全服轮次名单/抽签/扣款/结算契约，三条拒绝。原人数补偿、权重、超额如何抽、何时扣款及跨轮保留不猜；不能把单角色认购自动判为中奖。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-NEWPERMITACT：新通行证领奖

**执行裁定：** [PAY-NEWPERMITACT 的唯一R1决定](../rules/final-rule-register.md#pay-newpermitact)。本节数值与现代码描述须按该裁定使用。

107401领取本期NewPermit的合法Tier，资格由Tier.recharge/condition/add_value转换的真实经验和pay_list决定，再记录领取/结算。它与35001普通通行证、105801月战令不是同一状态结构。

当前NewPermitActTable、pb_new_permit_role_info与结算协议已有，经验计算、pay_list购买来源、奖励条件和邮件迁移未闭合，拒绝。新旧期经验继承、自选档、提前购买补领和结束邮件均需原消费者；不能直接套标准Permit.exp逻辑。[资产审计](../../../agent/workflow/fixes/activity-asset-audit-20261112.md)。

## PAY-DRAGONLANDACT：龙岛日奖、试炼奖与公会数据

**执行裁定：** [PAY-DRAGONLANDACT 的唯一R1决定](../rules/final-rule-register.md#pay-dragonlandact)。本节数值与现代码描述须按该裁定使用。

107701领日奖，107702按真实公会BOSS进度领BossAward，107703查真实贡献。当前recordBossDamage只作用当前boss、击杀不溢出下一个boss，并保存成员way/day贡献；后续战斗生产是否完全接入仍须独立核验。

原DragonLandAct.award_day为21002×100、901900×300、20002×5、201500×50000、414002×10、101500×50；Boss1.hp3000，BossAward每级按hp_per75/50/25/0分档。当前剩余百分比为ceil((hp-lost)/hp×100)，日序调用dayZero→naturalDay，现为UTC+8午夜，不继承旧记录“08:00”说法；原日界仍待证。已领档/日奖重复仅确认不重发，无法直接发的奖励走待发资源账本，其实际消费也需验。[专项](../../../agent/workflow/gameplay-completion/PAY-DRAGONLANDACT/implementation.md)、[DragonLandActTable](../rules/tables/DragonLandActTable.md)。

## PAY-DIAMONDBANKACT：钻石银行任务、奖励与购买

**执行裁定：** [PAY-DIAMONDBANKACT 的唯一R1决定](../rules/final-rule-register.md#pay-diamondbankact)。本节数值与现代码描述须按该裁定使用。

110203首次开启按Ver.open_use_item扣费并生成银行存款，110201检查真实LiveTask进度发任务奖，110202只一次领取存款。原Ver1为open_use_item101500×1000/open_add_num1000/act_item820902/add_item101500/rage10000/max_limit10000/recharge_rage1000；LiveTask101为type4701/target50/keep_type0/group1/奖820902×50。

当前开启增加820902×1000，领取按floor(min(存款,10000)*rage/10000)扣相应存款并发101500；这些为当前实现，open_add_num解释和倍率仍需原消费者。keep_type0作日任务、其余期任务，group1日常/group2额外，日界调用dayZero为当前UTC+8午夜；购买VerRecharge1关联138001/day_buy_times1/batch_update[]，联动限购需同步。任务不支持的真实进度仍不可领，跨期残余存款与超过封顶部分去向未自动视为已还原。[专项](../../../agent/workflow/gameplay-completion/PAY-DIAMONDBANKACT/implementation.md)、[DiamondBankActTable](../rules/tables/DiamondBankActTable.md)。

## PAY-FREEPRIVILEGEACT：免费特权及月度激活

**执行裁定：** [PAY-FREEPRIVILEGEACT 的唯一R1决定](../rules/final-rule-register.md#pay-freeprivilegeact)。本节数值与现代码描述须按该裁定使用。

110601首次写active_time与模块62.free_endtime=now+privilege_day×86400，不新增付费永久卡element；重复激活不能延长。110602只在配置允许is_month_card时按month_card激活真实月卡，保留付费拥有/到期状态。

原Version1为privilege_day30/is_month_card=true/month_card1，Version和Show各2行。当前体验与月卡分开保存并同步登录，不能把免费体验当490001永久卡真实购买或累充；活动结束后体验是否按active_time自然结束、跨期再次激活和已有月卡叠加仍需原消费者对照。[专项](../../../agent/workflow/gameplay-completion/PAY-FREEPRIVILEGEACT/implementation.md)、[FreePrivilegeActTable](../rules/tables/FreePrivilegeActTable.md)。

## PAY-SLOTGAMEACT：老虎机活动游玩与领取

**执行裁定：** [PAY-SLOTGAMEACT 的唯一R1决定](../rules/final-rule-register.md#pay-slotgameact)。本节数值与现代码描述须按该裁定使用。

110801无pending时扣入场物品，抽奖保存award_lib_tid；有pending不再扣费/重抽。110802按challenge_multiplier布尔选择是否挑战倍率后发奖、清pending，重登恢复同一待领结果。原Version1为award_map_lib1/multiplier_lib1；AwardMapLib101的item6921900→award_lib1；AwardLib101为weight100/101500×300，另两条weight0不可中。

原MultiplierLib阈值0/1/30映射库1/2/3；库1的倍率120/150/200/250/300权重20/20/20/30/30。**阈值解释、每入场消耗1、数量×倍率/100均为当前推断**，不据此公布原返奖率。待领中断/领取丢包防重已落库，原挑战触发、倍率保底、跨期pending与券回收仍待原样本。[专项](../../../agent/workflow/gameplay-completion/PAY-SLOTGAMEACT/implementation.md)、[SlotGameActTable](../rules/tables/SlotGameActTable.md)。

## PAY-MONTHLYCARD：既有月卡日奖

**执行裁定：** [PAY-MONTHLYCARD 的唯一R1决定](../rules/final-rule-register.md#pay-monthlycard)。本节数值与现代码描述须按该裁定使用。

17001由[monthly-card-service](../../../personal-server/game/monthly-card-service.mjs)按真实已激活卡和未领日奖发放，购买激活与日领奖不同。原MonthlyCard1为recharge140001/reward_period30/reward122702×1、8501900×2、101500×300/item_recharge150021/role_back_recharge150019；Award4007另配178002×15、Period4.start_day3。

当前付费/道具/回归月卡入口需保持各自原条件，不把freePrivilege体验写成充值订单。续购延长、漏领补发、addition_award与跨日到期边界仍以消费者核对；30日不是领取30次后才到期的已证推论。[MonthlyCardTable](../rules/tables/MonthlyCardTable.md)。

## PAY-RECOMMENDGIFT：既有推荐礼包激活查询

**执行裁定：** [PAY-RECOMMENDGIFT 的唯一R1决定](../rules/final-rule-register.md#pay-recommendgift)。本节数值与现代码描述须按该裁定使用。

85901网关按真实正在运行/未暂停活动返回gift_list与buy_times，百抽/魔灵活动从专用台账取次数，其他已支持项从recharge_orders取实际购买数。查询不发奖、不扣费，也不能把请求内任意gift_id自动变成合法商品。

当前对已识别百抽/魔灵有configuredGifts过滤，其他活动映射尚需逐家族验证，不能把全局订单次数当所有周期限购。RechargeTable.RecommendGift当前0行，实际推荐入口来自其他消费者，不能用空表断言没有推荐礼包。[网关实现](../../../personal-server/game/gateway.mjs)、[RechargeTable](../rules/tables/RechargeTable.md)。

## PAY-RECHARGEBONUS：既有充值返奖分组

**执行裁定：** [PAY-RECHARGEBONUS 的唯一R1决定](../rules/final-rule-register.md#pay-rechargebonus)。本节数值与现代码描述须按该裁定使用。

88301选择合法Group，88302依据实际支付累计与该组Award领取，不因切组刷新已经消费的充值资格。原Group2行/Award24行；Award101属belong_group1，奖101500×666及17002×500；RechargeBonus1为open_day1/group[1]。

当前[recharge-bonus-service](../../../personal-server/game/recharge-bonus-service.mjs)维护选择/领取和付款来源，开服窗口、同金额跨组可领性及旧组未领奖应逐原消费者核验。Award表中的物品数量不是充值金额，钱包加款不进其累计。[RechargeBonusTable](../rules/tables/RechargeBonusTable.md)。

## PAY-HUNDREDACC：既有百元累计奖励

**执行裁定：** [PAY-HUNDREDACC 的唯一R1决定](../rules/final-rule-register.md#pay-hundredacc)。本节数值与现代码描述须按该裁定使用。

92001按实际累计支付达到HundredAcc.Group.amount后领Reward，记录所领tid；一次支付不能通过重复确认造多笔累计。原Group1.amount100，Reward1奖101500×100/get_day_index0/split_stamp1758488400/split_reward101500×100；Const.show_entry_day5/move_day_cnt7。

当前[hundred-acc-service](../../../personal-server/game/hundred-acc-service.mjs)已有真实累计和领取路径，amount单位、split_stamp前后分支及领取日门禁以原消费者为准，不能只按“百元”标题推价。入口第5日也不表示所有奖第5日自动发。[HundredAccTable](../rules/tables/HundredAccTable.md)。

## PAY-WISHTREASURE：既有许愿宝藏周期奖

**执行裁定：** [PAY-WISHTREASURE 的唯一R1决定](../rules/final-rule-register.md#pay-wishtreasure)。本节数值与现代码描述须按该裁定使用。

97101按类型与phase领取，当前要求本phase窗口内有合法商品购买日，记录模块172.buy_day_list/rev_list及reward_claims双重防重。类型1关联46003/46002/40009，类型2关联40010/40008，不能把许愿树91703未实现宝藏入口当同一命令。

当前[配置模块](../../../personal-server/config/wish-treasure-tables.mjs)写one_award_day10/open_award_num2/max_phase73，按阶段轮换物品，第一类首期132317×1。这是现有兼容配置，未保存完整原表消费者证据前不能当原服周期/奖单公告。开服日、首次购买日、缺勤与第73期后行为需继续核对。[服务](../../../personal-server/game/wish-treasure-service.mjs)。

## PAY-ACCRECHARGEACT：既有活动累充

**执行裁定：** [PAY-ACCRECHARGEACT 的唯一R1决定](../rules/final-rule-register.md#pay-accrechargeact)。本节数值与现代码描述须按该裁定使用。

98620按活动窗口中已支付订单累计，筛本版本/服务器区间/variant的Award，达标才发并记领取位。不能全账号历史充值累计到每个新活动，也不能将后台钱包入账当订单；退款或重发不得增加累计。

原Award1000101为version1/server_range1/variant0/acc_cnt5000/acc_cnt_new50/奖3002×10；新旧金额字段需由版本/消费者决定，不能把5000与50相加。当前[acc-recharge-service](../../../personal-server/game/acc-recharge-service.mjs)有真实订单统计，跨服区间、特殊variant和父活动实际时间仍需逐版对照。[AccRechargeActTable](../rules/tables/AccRechargeActTable.md)。

## PAY-DAILYDISCOUNT：既有每日折扣自选

**执行裁定：** [PAY-DAILYDISCOUNT 的唯一R1决定](../rules/final-rule-register.md#pay-dailydiscount)。本节数值与现代码描述须按该裁定使用。

99300保存当前合法礼包自选，真正16005购买时读取选择与日限。原Recharge1关联40006/day_buy_times1/start_day1/end_day999999；Const.max_buy_additionally30，DailyGiftAward2001为open_day1/gift40010/奖5971200×10及2002×10。

当前每日折扣购买维护模块108及batch_update关联限购，已有[日限服务](../../../personal-server/game/daily-discount-purchase.mjs)；选择不发奖，buy_additionally与普通日限分别保存。旧问题batch_update=[2,5]不能再按两次独立商品随意买满；原追加购买次数和具体自选消费者仍需逐商品核验。[DailyDiscountTable](../rules/tables/DailyDiscountTable.md)。

## PAY-RECHARGEREBATERESET：既有充值返利重置奖

**执行裁定：** [PAY-RECHARGEREBATERESET 的唯一R1决定](../rules/final-rule-register.md#pay-rechargerebatereset)。本节数值与现代码描述须按该裁定使用。

100201领取本次重置活动中合法返利档，先确认对应Act与真实重置/购买状态，再写一次领取。原Act1的daily_award是三个101500×100，preview_award_item101500/preview_award_num100；三项不能仅凭数组长度解释成同次发300或固定三日。

当前[recharge-rebate-reset-service](../../../personal-server/game/recharge-rebate-reset-service.mjs)有持久化领奖路径；首充倍率重置、可领日、重复开期与历史首充位的关系仍应对照原消费者。不能因活动叫reset就清空全部商品订单或退款台账。[RechargeRebateResetTable](../rules/tables/RechargeRebateResetTable.md)。

## PAY-LINEFIRSTRECHARGE：既有线路首充选择与领奖

**执行裁定：** [PAY-LINEFIRSTRECHARGE 的唯一R1决定](../rules/final-rule-register.md#pay-linefirstrecharge)。本节数值与现代码描述须按该裁定使用。

102101从当前Group所属Choose中选合法gift，102102按实际首充购买/天次发LineFirstRecharge奖励。原Group1.start_tid1/start_time0/end_time1758488400；Choose101属belong1/gift600001；LineFirstRecharge1的award为两项2002×5、duration0。

当前[line-first-recharge-service](../../../personal-server/game/line-first-recharge-service.mjs)已有选择/购买/领取路径；两项award的日次/档位含义和绝对end_time不得省略。选择不能发英雄、换组不能重置已首充记录，父期窗口与旧期漏领奖待逐版对照。[LineFirstRechargeTable](../rules/tables/LineFirstRechargeTable.md)。

## PAY-MONTHPERMIT：既有月战令

**执行裁定：** [PAY-MONTHPERMIT 的唯一R1决定](../rules/final-rule-register.md#pay-monthpermit)。本节数值与现代码描述须按该裁定使用。

105801领已买Gear的等级奖、105802买级、105803一键领、105804按真实Task发经验；经验源、已买档和已领等级分开。原Task101为version1/type4701/target100/add_exp50/day_type1；BuyExp1消耗101500×3000/add_exp1000；UpLv101需exp1000，GearLv1101为gear1/level1/奖10054100×1。

原Cycle1含login_add_exp1000/week_add_exp10000/buy_max_lv30/last_buy_exp_day7/settle_mail8371400，Const.over_mail_notice_day3/over_mail_notice8381400。当前[month-permit-service](../../../personal-server/game/month-permit-service.mjs)与支付联动，期内购买、任务领奖和经验落库；全部Cycle分支、日/周上限、期末邮件和跨期未领需保留证据，不能套普通Permit7天周期。[MonthPermitTable](../rules/tables/MonthPermitTable.md)。

## 订单、日界与期末处理

价格单位从Recharge.pay_type/cost_item/price及对应Handle共同解释，不能仅凭商品名字或展示金额换算。`buy_cycle_limit`、`can_buy_times`、日限和batch_update关联项须按原商品的周期键同步；一个订单只计一次，账号去重与角色领取位分别保存。

当前在线礼包和永久卡用05:00业务日；龙岛和钻石银行调用dayZero的自然日；其他活动还有按start经过24小时的日序。原消费者未全部对齐之前不统一宣布日切已还原。跨期补发、币种回收、拍卖退款、基金漏领和结算邮件逐族恢复，不能用“结束清零”替代未证规则。

本册记录兼容实现和明确拒绝，没有修改业务、读取运行数据库或操作APK。单个支付成功、登录商城可展示、表存在或历史组件测试通过，均不代表本册全部商品与福利已1:1还原。

<!-- command-index:start -->

## 完整命令与任务卡索引

来源：[原静态命令目录](../../plans/remaining-gameplay-20261106/inventory.json)。仅取命令号、名称、模块、编码和schema，不继承其旧路由状态。`—`表示目录未绑定schema，不代表请求无参数或该功能未实现。实际分发与编码差异以正文当前处理器说明为准；原定义见[protobuf资产](../../../personal-server/assets/protobuf/)和[接口目录](../../../agent/workflow/interface-catalog/tcp-commands.md)。

### PAY-RECHARGE

[规则段](#pay-recharge龙晶等额外充值入口) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-recharge龙晶等额外充值入口)。客户端模块：`RechargeCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 16001 | `req_get_first_recharge_reward` | etf / — | protobuf / `pb_res_rev_first_recharge_reward` |
| 16003 | `req_notify_get_recharge_reward` | etf / — | etf-fallback / — |
| 16004 | `req_recharge_by_token` | etf / — | etf-fallback / — |
| 16005 | `req_buy_or_rev_gift` | protobuf / `pb_recharge_buy_or_rev_req` | protobuf / `res_buy_or_Rev_gift` |
| 16006 | `req_loong_recharge` | protobuf / `pb_recharge_buy_or_rev_req` | protobuf / `res_buy_or_Rev_gift` |

### PAY-TRIGGERGIFT

[规则段](#pay-triggergift触发礼包激活与次数) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-triggergift触发礼包激活与次数)。客户端模块：`TriggerGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 18001 | `req_active_trigger_gift` | etf / — | protobuf / `pb_trigger_gift` |
| 18002 | `req_add_trigger_times` | etf / — | etf-fallback / — |

### PAY-UPSTARGIFT

[规则段](#pay-upstargift升星礼包奖励与版本) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-upstargift升星礼包奖励与版本)。客户端模块：`UpStarGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 31052 | `req_up_star_gift_award` | protobuf / `pb_up_star_gift_req` | protobuf / `pb_up_star_gift_back` |
| 31053 | `req_up_star_choose_version` | etf / — | etf-fallback / — |

### PAY-VIP

[规则段](#pay-vipvip礼包特权奖励与经验兑换) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-vipvip-礼包特权奖励与经验兑换)。客户端模块：`VipCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 33001 | `req_buy_vip_gift` | etf / — | protobuf / `pb_res_to_client` |
| 33002 | `req_get_vip_addition_reward` | etf / — | protobuf / `pb_res_to_client` |
| 76301 | `req_vip_exp_exchange` | etf / — | protobuf / `pb_res_to_client` |

### PAY-PERMIT

[规则段](#pay-permit普通通行证买级福利结算自选与选期) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-permit普通通行证买级福利结算自选与选期)。客户端模块：`PermitCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 35001 | `req_permit_receive_free` | etf / — | protobuf / `pb_permit_receive_back` |
| 35002 | `req_permit_receive_pay` | etf / — | protobuf / `pb_permit_receive_back` |
| 35003 | `req_permit_buy_level` | etf / — | protobuf / `pb_permit_buy_level_back` |
| 35004 | `req_permit_adjust_cycle` | etf / — | protobuf / `pb_permit_settle_back` |
| 35005 | `req_permit_receive_all` | etf / — | protobuf / `pb_permit_receive_back` |
| 35006 | `req_permit_gain_welfare` | etf / — | protobuf / `pb_permit_gain_welfare_toc` |
| 35007 | `req_permit_buy_times_data` | etf / — | protobuf / `pb_permit_server_data` |
| 35008 | `req_permit_manual_update` | etf / — | protobuf / `pb_permit_manual_update_back` |
| 35009 | `req_permit_manual_settle` | etf / — | protobuf / `pb_permit_settle_back` |
| 35010 | `req_permit_select_award` | protobuf / `pb_permit_select_award_req` | protobuf / `pb_permit_select_award_back` |
| 35011 | `req_permit_choose_req` | protobuf / `pb_permit_choose_req` | protobuf / `pb_permit_info` |

### PAY-ONLINEGIFT

[规则段](#pay-onlinegift在线礼包) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-onlinegift在线礼包)。客户端模块：`OnlineGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 37010 | `req_online_gift_award` | etf / — | protobuf / `pb_online_gift_back` |

### PAY-FUNDACT

[规则段](#pay-fundact活动基金领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-fundact活动基金领奖)。客户端模块：`FundActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 51001 | `req_fund_act_award` | etf / — | protobuf / `pb_fund_act_back` |

### PAY-NOTIFYGIFT

[规则段](#pay-notifygift通知礼包激活) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-notifygift通知礼包激活)。客户端模块：`NotifyGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 76201 | `req_notify_gift_activate` | etf / — | protobuf / `pb_notify_gift_activate_rsp` |

### PAY-REDENVELOPE

[规则段](#pay-redenvelope普通红包领奖与详情) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-redenvelope普通红包领奖与详情)。客户端模块：`RedEnvelopeCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 77001 | `req_red_envelope_award` | etf / — | protobuf / `pb_red_envelope_award_rsp` |
| 77002 | `req_red_envelope_info` | etf / — | protobuf / `pb_client_red_envelope` |
| 77003 | `req_red_envelope_info_by_sender` | etf / — | protobuf / `pb_client_red_envelopes` |

### PAY-VIPGIFT

[规则段](#pay-vipgiftvip专属礼包领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-vipgiftvip-专属礼包领奖)。客户端模块：`VipGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 77101 | `vip_gift_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-FASHION

[规则段](#pay-fashion时装激活穿戴与升级) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-fashion时装激活穿戴与升级)。客户端模块：`FashionCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 82602 | `req_fashion_act` | etf / — | protobuf / `pb_res_to_client` |
| 82603 | `req_fashion_wear` | etf / — | etf-fallback / — |
| 82604 | `req_fashion_lv` | etf / — | protobuf / `pb_fashion_lv_back` |

### PAY-VIPCITY

[规则段](#pay-vipcityvip城市重建) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-vipcityvip-城市重建)。客户端模块：`VipCityCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 82701 | `req_vip_city_rebuild` | etf / — | protobuf / `pb_res_to_client` |

### PAY-PRINCESS

[规则段](#pay-princess公主princess奖励补领与跨期刷新) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-princess公主princess-奖励补领与跨期刷新)。客户端模块：`PrincessCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 84601 | `req_princess_award` | protobuf / `pb_princess_req` | protobuf / `pb_princess_back` |
| 84602 | `req_princess_award_supplement` | etf / — | protobuf / `pb_princess_supplement_back` |
| 84603 | `req_cross_refresh_supplement` | etf / — | protobuf / `pb_princess_energy_supplement` |

### PAY-PERMANENTCARD

[规则段](#pay-permanentcard永久卡奖励领取) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-permanentcard永久卡奖励领取)。客户端模块：`PermanentCardCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 87301 | `req_permanent_card_award` | etf / — | protobuf / `pb_permanent_card_back` |

### PAY-RECOVERY

[规则段](#pay-recovery资源追回免费奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-recovery资源追回免费奖励)。客户端模块：`RecoveryCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 87401 | `req_recovery_free_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-WEEKENDBONUS

[规则段](#pay-weekendbonus周末奖励与游玩次数) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-weekendbonus周末奖励与游玩次数)。客户端模块：`WeekendBonusCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 87501 | `req_weekend_award` | etf / — | protobuf / `pb_weekend_bonus_back` |
| 87502 | `req_weekend_play_count_award` | etf / — | protobuf / `pb_weekend_bonus_back` |

### PAY-LEVELSPRINT

[规则段](#pay-levelsprint等级冲刺免费奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-levelsprint等级冲刺免费奖)。客户端模块：`LevelSprintCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88101 | `req_level_sprint_free_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-HOUSEASSISTANT

[规则段](#pay-houseassistant看板助手背景选择与试用) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-houseassistant看板助手背景选择与试用)。客户端模块：`HouseAssistantCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88201 | `req_house_assistant_choose_bg` | protobuf / `pb_house_assistant_use_req_list` | protobuf / `pb_house_assistant_use_rsp` |
| 88202 | `req_house_assistant_choose_assist` | protobuf / `pb_house_assistant_use_req_list` | protobuf / `pb_house_assistant_use_rsp` |
| 88203 | `req_house_assistant_trial` | protobuf / `pb_house_assistant_trial_req` | protobuf / `pb_house_assistant_trial_rsp` |
| 88204 | `req_house_assistant_trial_cancel` | protobuf / `pb_house_assistant_trial_cancel_req` | protobuf / `pb_house_assistant_trial_rsp` |

### PAY-HEATGIFT

[规则段](#pay-heatgift热度礼包支援与全服数据) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-heatgift热度礼包支援与全服数据)。客户端模块：`HeatGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88601 | `req_heat_gift_support` | etf / — | protobuf / `pb_heat_gift_support_back` |
| 88602 | `req_heat_gift_server_info` | etf / — | protobuf / `pb_heat_gift` |

### PAY-FLASHSALE

[规则段](#pay-flashsale限时特卖砍价与英雄) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-flashsale限时特卖砍价与英雄)。客户端模块：`FlashSaleCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88701 | `req_flash_sale_bargain` | etf / — | protobuf / `pb_flash_sale_bargain_ret` |
| 88702 | `req_flash_sale_hero` | etf / — | etf-fallback / — |

### PAY-ASSISTANT

[规则段](#pay-assistant玩法助手功能设置与执行) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-assistant玩法助手功能设置与执行)。客户端模块：`AssistantCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88901 | `req_assistant_set_func` | protobuf / `pb_assistant_setting_req` | protobuf / `pb_assistant_setting_back` |
| 88902 | `req_assistant_do_command` | protobuf / `pb_assistant_execute_req` | protobuf / `pb_assistant_execute_back` |
| 88903 | `req_assistant_start_try` | etf / — | etf-fallback / — |

### PAY-PREBOOK

[规则段](#pay-prebook预约任务与分享奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-prebook预约任务与分享奖励)。客户端模块：`PrebookCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92401 | `req_prebook_task_award` | etf / — | protobuf / `pb_prebook_back` |
| 92402 | `req_prebook_share_award` | etf / — | protobuf / `pb_prebook_back` |

### PAY-ROLESHARE

[规则段](#pay-roleshare玩家分享奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-roleshare玩家分享奖励)。客户端模块：`RoleShareCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92501 | `req_role_share_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-CROSS

[规则段](#pay-cross跨服广告功能免费与付费奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-cross跨服广告功能免费与付费奖)。客户端模块：`CrossCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92601 | `req_cross_receive_ads_award` | etf / — | protobuf / `pb_res_to_client` |
| 92602 | `req_cross_receive_fun_free_award` | etf / — | protobuf / `pb_res_to_client` |
| 92603 | `req_cross_receive_fun_pay_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-REDRAIN

[规则段](#pay-redrain红包雨随机领取与激活) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-redrain红包雨随机领取与激活)。客户端模块：`RedRainCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92901 | `req_red_rain_random` | etf / — | protobuf / `pb_red_rain` |
| 92902 | `req_red_rain_rev` | protobuf / `pb_red_rain_rev_award_req` | protobuf / `pb_red_rain_back` |
| 92903 | `req_red_rain_active` | etf / — | protobuf / `pb_red_rain` |

### PAY-DIAMONDFUND

[规则段](#pay-diamondfund钻石基金稳健幸运奖励领取) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-diamondfund钻石基金稳健幸运奖励领取)。客户端模块：`DiamondFundCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 93201 | `req_steady_award` | etf / — | protobuf / `pb_diamond_award_rsp` |
| 93202 | `req_fortune_award` | etf / — | protobuf / `pb_diamond_award_rsp` |

### PAY-WEEKHUNT

[规则段](#pay-weekhunt周猎任务进度与升级礼包) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-weekhunt周猎任务进度与升级礼包)。客户端模块：`WeekHuntCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 93401 | `req_week_hunt_common_task` | protobuf / `pb_week_common_task_req` | protobuf / `pb_week_common_task_rsp` |
| 93402 | `req_week_hunt_common_progress` | protobuf / `pb_week_common_progress_req` | protobuf / `pb_week_common_progress_rsp` |
| 93403 | `req_week_hunt_upgrade_gift` | protobuf / `pb_week_upgrade_gift_req` | protobuf / `pb_week_upgrade_gift_rsp` |

### PAY-LINKGIFT

[规则段](#pay-linkgift联动礼包自选) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-linkgift联动礼包自选)。客户端模块：`LinkGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 97401 | `req_link_gift_custom_choose` | etf / — | protobuf / `pb_link_gift_custom_item` |

### PAY-VIPLINK

[规则段](#pay-viplinkvip联动展示) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-viplinkvip-联动展示)。客户端模块：`VipLinkCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98001 | `req_vip_link_show` | etf / — | etf-fallback / — |

### PAY-GEMREBATEACT

[规则段](#pay-gemrebateact宝石返利投入) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-gemrebateact宝石返利投入)。客户端模块：`GemRebateActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98630 | `req_gem_rebate_put` | protobuf / `pb_gem_rebate_req` | protobuf / `pb_gem_rebate_back` |

### PAY-APPEARANCERELEASEACT

[规则段](#pay-appearancereleaseact外观上新互动) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-appearancereleaseact外观上新互动)。客户端模块：`AppearanceReleaseActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98800 | `req_appearance_release_act_interact` | protobuf / `pb_appearance_release_act_interact_req` | protobuf / `pb_res_to_client` |

### PAY-CAKEACTIVITY

[规则段](#pay-cakeactivity蛋糕活动每日充值与托盘选择) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-cakeactivity蛋糕活动每日充值与托盘选择)。客户端模块：`CakeActivityCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99000 | `req_cake_activity_daily_award` | etf / — | protobuf / `pb_res_to_client` |
| 99001 | `req_cake_activity_rechage_award` | etf / — | protobuf / `pb_res_to_client` |
| 99002 | `req_cake_activity_select_plate` | protobuf / `pb_cake_activity_select_plate_req` | etf-fallback / — |

### PAY-QUADRUPLECROSS

[规则段](#pay-quadruplecross四重跨期随机免费与付费奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-quadruplecross四重跨期随机免费与付费奖)。客户端模块：`QuadrupleCrossCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99500 | `req_quadruple_cross_random_award` | etf / — | protobuf / `pb_res_to_client` |
| 99501 | `req_quadruple_cross_free_award` | etf / — | protobuf / `pb_res_to_client` |
| 99502 | `req_quadruple_cross_pay_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-FINANCEMANAGEACT

[规则段](#pay-financemanageact理财产品选择与返利) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-financemanageact理财产品选择与返利)。客户端模块：`FinanceManageActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99901 | `req_finance_manage_act_select_product` | protobuf / `pb_finance_manage_act_select_product_req` | protobuf / `pb_res_to_client` |
| 99902 | `req_finance_manage_act_rebate` | etf / — | protobuf / `pb_res_to_client` |

### PAY-SKINCRYSTAL

[规则段](#pay-skincrystal皮肤水晶购买) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-skincrystal皮肤水晶购买)。客户端模块：`SkinCrystalCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100401 | `req_skin_crystal_buy` | etf / — | protobuf / `pb_res_to_client` |

### PAY-GROUPBUYACT

[规则段](#pay-groupbuyact团购全服统计与团购奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-groupbuyact团购全服统计与团购奖)。客户端模块：`GroupBuyActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100601 | `req_group_buy_act_server_data` | etf / — | protobuf / `pb_group_buy_act_server` |
| 100602 | `req_group_buy_act_group_award` | protobuf / `pb_group_buy_act_group_award_req` | protobuf / `pb_res_to_client` |

### PAY-REBATESHOPACT

[规则段](#pay-rebateshopact返利商店领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-rebateshopact返利商店领奖)。客户端模块：`RebateShopActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100701 | `req_rebate_shop_act_award` | etf / — | protobuf / `pb_res_to_client` |

### PAY-DIVINEREALMACT

[规则段](#pay-divinerealmact神域活动礼包选择) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-divinerealmact神域活动礼包选择)。客户端模块：`DivineRealmActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 101701 | `req_divine_realm_act_select_gift` | protobuf / `pb_divine_realm_gift_select_req` | protobuf / `pb_divine_realm_act_gift` |

### PAY-BONUSSHOP

[规则段](#pay-bonusshop奖励商店购买) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-bonusshop奖励商店购买)。客户端模块：`BonusShopCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 101903 | `req_bonus_shopping` | protobuf / `pb_bonus_shopping_req` | protobuf / `pb_bonus_shopping_back` |

### PAY-AUCTION

[规则段](#pay-auction拍卖出价心愿分红与详情) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-auction拍卖出价心愿分红与详情)。客户端模块：`AuctionCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102701 | `req_auction_bid` | protobuf / `pb_auction_bid_req` | protobuf / `pb_auction_bid_back` |
| 102702 | `req_auction_wish` | protobuf / `pb_auction_wish_req` | etf-fallback / — |
| 102703 | `req_auction_dividend_award` | etf / — | protobuf / `pb_auction_dividend_rev_back` |
| 102704 | `req_auction_attend` | etf / — | protobuf / `pb_role_auction_list` |
| 102705 | `req_auction_detail` | etf / — | protobuf / `pb_auction` |

### PAY-SKINRECHARGE

[规则段](#pay-skinrecharge皮肤充值角色选择) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-skinrecharge皮肤充值角色选择)。客户端模块：`SkinRechargeCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103601 | `req_skin_recharge_get_role` | etf / — | etf-fallback / — |

### PAY-BUYSKINACT

[规则段](#pay-buyskinact购皮肤活动免费奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-buyskinact购皮肤活动免费奖励)。客户端模块：`BuySkinActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104001 | `req_buy_skin_free_award` | protobuf / `pb_buy_skin_free_req` | protobuf / `pb_res_to_client` |

### PAY-ACTSHOP

[规则段](#pay-actshop活动商店数据购买与等级奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-actshop活动商店数据购买与等级奖励)。客户端模块：`ActShopCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104801 | `req_act_shop_info` | protobuf / `pb_act_shop_info_req` | protobuf / `pb_act_shop_info_rsp` |
| 104802 | `req_act_buy_goods` | protobuf / `pb_act_buy_goods_req` | protobuf / `pb_act_buy_goods_rsp` |
| 104803 | `req_act_shop_level_rewards` | protobuf / `pb_act_shop_level_rewards_req` | protobuf / `pb_act_shop_level_rewards_rsp` |

### PAY-PREMIUMACT

[规则段](#pay-premiumact增值活动免费奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-premiumact增值活动免费奖励)。客户端模块：`PremiumActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105401 | `req_premium_free_award` | protobuf / `pb_premium_free_award_req` | protobuf / `pb_premium_free_award_rsp` |

### PAY-RECYCLEACT

[规则段](#pay-recycleact回收活动) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-recycleact回收活动)。客户端模块：`RecycleActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105901 | `req_recycle_act_recycle` | protobuf / `pb_recycle_act_recycle_req` | protobuf / `pb_res_to_client` |

### PAY-VICKREYAUCTIONACT

[规则段](#pay-vickreyauctionact维克里密封拍卖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-vickreyauctionact维克里密封拍卖)。客户端模块：`VickreyAuctionActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 106101 | `req_vickrey_auction_act_get_info` | protobuf / `pb_vickrey_auction_act_info_req` | protobuf / `pb_vickrey_auction_act_info_rsp` |
| 106102 | `req_vickrey_act_auction_bid` | protobuf / `pb_vickrey_auction_act_bid_req` | protobuf / `pb_vickrey_auction_act_bid_rsp` |

### PAY-GIFTBOXACT

[规则段](#pay-giftboxact礼盒活动领取) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-giftboxact礼盒活动领取)。客户端模块：`GiftBoxActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 106301 | `req_gift_box_receive` | protobuf / `pb_gift_box_receive_req` | protobuf / `pb_gift_box_receive_rsp` |

### PAY-SUBSCRIPTIONACT

[规则段](#pay-subscriptionact订阅领取与入场) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-subscriptionact订阅领取与入场)。客户端模块：`SubscriptionActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 107301 | `req_subscription_act_subscribe` | protobuf / `pb_subscription_act_subscribe_req` | protobuf / `pb_subscription_act_subscribe_rsp` |
| 107302 | `req_subscription_act_get` | protobuf / `pb_subscription_act_subscribe_req` | protobuf / `pb_subscription_act_award_rsp` |
| 107303 | `req_subscription_act_enter` | etf / — | protobuf / `pb_subscription_act_data` |

### PAY-NEWPERMITACT

[规则段](#pay-newpermitact新通行证领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-newpermitact新通行证领奖)。客户端模块：`NewPermitActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 107401 | `req_new_permit_award` | protobuf / `pb_new_permit_award_req` | protobuf / `pb_new_permit_award_rsp` |

### PAY-DRAGONLANDACT

[规则段](#pay-dragonlandact龙岛日奖试炼奖与公会数据) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-dragonlandact龙岛日奖试炼奖与公会数据)。客户端模块：`DragonLandActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 107701 | `req_dragon_land_daily_award` | protobuf / `pb_dragon_land_daily_award_req` | protobuf / `pb_dragon_land_daily_award_rsp` |
| 107702 | `req_dragon_land_trial_award` | protobuf / `pb_dragon_land_trial_award_req` | protobuf / `pb_dragon_land_trial_award_rsp` |
| 107703 | `req_dragon_land_guild_data` | protobuf / `pb_dragon_land_guild_data_req` | protobuf / `pb_dragon_land_guild_data_rsp` |

### PAY-DIAMONDBANKACT

[规则段](#pay-diamondbankact钻石银行任务奖励与购买) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-diamondbankact钻石银行任务奖励与购买)。客户端模块：`DiamondBankActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110201 | `req_diamond_bank_act_task` | protobuf / `pb_diamond_bank_act_base_req` | protobuf / `pb_diamond_bank_act_task_rsp` |
| 110202 | `req_diamond_bank_act_award` | etf / — | protobuf / `pb_res_to_client` |
| 110203 | `req_diamond_bank_act_buy` | etf / — | protobuf / `pb_res_to_client` |

### PAY-FREEPRIVILEGEACT

[规则段](#pay-freeprivilegeact免费特权及月度激活) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-freeprivilegeact免费特权及月度激活)。客户端模块：`FreePrivilegeActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110601 | `req_free_privilege_act_activate` | etf / — | protobuf / `pb_free_privilege_act_activate_back` |
| 110602 | `req_free_privilege_act_activate_month` | etf / — | protobuf / `pb_free_privilege_act_activate_month_back` |

### PAY-SLOTGAMEACT

[规则段](#pay-slotgameact老虎机活动游玩与领取) · [原任务卡](../../plans/remaining-gameplay-20261106/09-commerce-benefits.md#pay-slotgameact老虎机活动游玩与领取)。客户端模块：`SlotGameActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110801 | `req_slot_game_act_go` | protobuf / `pb_slot_game_act_go_req` | protobuf / `pb_slot_game_act_role_data` |
| 110802 | `req_slot_game_act_get` | protobuf / `pb_slot_game_act_draw_req` | protobuf / `pb_slot_game_act_draw_rsp` |

### PAY-MONTHLYCARD

[规则段](#pay-monthlycard既有月卡日奖) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`MonthlyCardCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 17001 | `req_get_monthly_card_reward` | protobuf / `req_get_monthly_card_reward` | protobuf / `res_get_monthly_card_reward` |

### PAY-RECOMMENDGIFT

[规则段](#pay-recommendgift既有推荐礼包激活查询) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`RecommendGiftCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 85901 | `req_recommend_gift_active` | protobuf / `pb_recommend_gift_active_req` | protobuf / `pb_recommend_gift_active_rsp` |

### PAY-RECHARGEBONUS

[规则段](#pay-rechargebonus既有充值返奖分组) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`RechargeBonusCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88301 | `req_select_group` | etf / — | protobuf / `pb_recharge_bonus` |
| 88302 | `req_get_recharge_bonus_award` | etf / — | protobuf / `pb_recharge_bonus_back` |

### PAY-HUNDREDACC

[规则段](#pay-hundredacc既有百元累计奖励) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`HundredAccCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92001 | `req_hundred_acc` | etf / — | protobuf / `pb_res_to_client` |

### PAY-WISHTREASURE

[规则段](#pay-wishtreasure既有许愿宝藏周期奖) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`WishTreasureCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 97101 | `req_wish_treasure_rev` | etf / — | protobuf / `pb_wish_treasure_rev_back` |

### PAY-ACCRECHARGEACT

[规则段](#pay-accrechargeact既有活动累充) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`AccRechargeActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98620 | `req_acc_recharge_act_get_award` | protobuf / `pb_acc_recharge_award_req` | protobuf / `pb_res_to_client` |

### PAY-DAILYDISCOUNT

[规则段](#pay-dailydiscount既有每日折扣自选) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`DailyDiscountCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99300 | `req_daily_discount_select` | protobuf / `pb_daily_discount_select_req` | protobuf / `pb_daily_discount_select_info` |

### PAY-RECHARGEREBATERESET

[规则段](#pay-rechargerebatereset既有充值返利重置奖) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`RechargeRebateResetCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100201 | `req_recharge_rebate_reset_award` | etf / — | protobuf / `pb_recharge_rebate_reset_back` |

### PAY-LINEFIRSTRECHARGE

[规则段](#pay-linefirstrecharge既有线路首充选择与领奖) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`LineFirstRechargeCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102101 | `req_line_first_recharge_choose` | etf / — | etf-fallback / — |
| 102102 | `req_line_first_recharge_rev` | etf / — | protobuf / `pb_line_first_recharge_rev_back` |

### PAY-MONTHPERMIT

[规则段](#pay-monthpermit既有月战令) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`MonthPermitCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105801 | `req_month_permit_receive_pay` | protobuf / `pb_month_permit_receive_req` | protobuf / `pb_month_permit_receive_back` |
| 105802 | `req_month_permit_buy_level` | protobuf / `pb_month_permit_buy_exp_req` | protobuf / `pb_month_permit_buy_level_back` |
| 105803 | `req_month_permit_receive_all` | etf / — | protobuf / `pb_month_permit_receive_back` |
| 105804 | `req_month_permit_task_reward` | protobuf / `pb_month_permit_task_req` | protobuf / `pb_month_permit_task_back` |

