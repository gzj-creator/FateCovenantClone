# 抽取与招募详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

更新：2026-11-14。任务范围为[原计划06](../../plans/remaining-gameplay-20261106/06-draw-activities.md)的31族。通用服务见[draw-activity-service](../../../personal-server/game/draw-activity-service.mjs)、[逐族处理器](../../../personal-server/game/draw-activity-families.mjs)，历史证据见[F块记录](../../../agent/workflow/gameplay-completion/BLOCK-F/implementation.md)。文末逐族列出完整命令索引。

证据边界：[本册说明](README.md#证据怎么读)适用于所有流程。除明确引用原Lua调用链外，下面抽取顺序、扣费次数、随机算法与保底更新描述均为当前兼容实现或尚待恢复的契约，不能从字段存在推导成原服已确证。

## 招募入口与奖池共同规则

当前普通/精英/冒险招募的候选来自 `DrawTable` 与英雄开放条件；活动自选要进一步满足本期版本、目标组和自选资格。现有处理器先保存合法目标，再按单抽/多抽次序扣费、取结果、更新保底和实际获得英雄/碎片；批量中每一抽影响后续保底。这是当前实现顺序，仍需原消费者逐池对照。限定目标不能混入普通池。

当前 `recruit-pool-rules` 有本地兼容矩阵，不能作为原概率公告。`DrawTable` 中 `weight/probability` 字段必须先确认属于哪个候选集合，才可计算条件概率；显示概率ID不是概率本身。下文“按权重抽取”只在权重与候选关系均恢复时成立，未知池不借用邻版本。

## DRAW-MAGICDRAW：魔法招募

**执行裁定：** [DRAW-MAGICDRAW 的唯一R1决定](../rules/final-rule-register.md#draw-magicdraw)。本节数值与现代码描述须按该裁定使用。

先用60002选择 `MagicDrawTable.Hero` 中合法英雄，再由真实招募事件累计抽数，60003领 `Award.need_count` 档，60004领对应升星档。选择不能发英雄，领奖不能自己增加抽数。`MagicDraw[1]` 原字段有 `award_num=10`、`diamond_count=60`；`Award[201]` 为达到15次后 `101500×90`。这不证明每次魔法招募的实际付款就是60钻，仍需连接充值/抽取入口。

当前选择和成就档有状态路径，抽数生产源未闭合；`StarRes` 为0行，升星奖拒绝。跨日是否重置抽数不能由 `need_count` 推出。表：[MagicDrawTable](../rules/tables/MagicDrawTable.md)。

## DRAW-PINBALL：弹珠成就

**执行裁定：** [DRAW-PINBALL 的唯一R1决定](../rules/final-rule-register.md#draw-pinball)。本节数值与现代码描述须按该裁定使用。

88921只能领取真实弹珠局产生的成就，必须先有局号、发射/碰撞或结算结果，再关联任务阈值和领取位。现有路由没有权威弹珠局、成就进度与奖励关系，明确拒绝；不能把幻武每日弹珠发放当成弹珠小游戏已经结算。对应响应为 `pb_act_pin_ball_role_res_back`，配置和结算算法仍待恢复。

## DRAW-FANTASYEQUIPACT：幻武活动与管道

**执行裁定：** [DRAW-FANTASYEQUIPACT 的唯一R1决定](../rules/final-rule-register.md#draw-fantasyequipact)。本节数值与现代码描述须按该裁定使用。

活动顺序是选择合法幻武/心愿→按本期专用池招募→领取每日弹珠/投票或任务奖励→选择试炼装备、祝福、复制阵容→结算试炼。管道小游戏88925重置、88926提交连接操作是独立局状态，不能仅改变计数。

当前[幻武服务](../../../personal-server/game/fantasy-equip-act-service.mjs)承接88922/88924/88927–88932；管道生成、连通判定和重置费用未恢复，88925/88926拒绝。原 `FantasyEquipActTable.Task` 为0行，任务领奖不能自行造进度。专用池、弹珠和试炼状态分别保存；试炼伤害生产链与真实客户端仍需对照。表：[FantasyEquipActTable](../rules/tables/FantasyEquipActTable.md)。

## DRAW-PYRAMID：金字塔

**执行裁定：** [DRAW-PYRAMID 的唯一R1决定](../rules/final-rule-register.md#draw-pyramid)。本节数值与现代码描述须按该裁定使用。

活动版本给出门票 `Version.sub_item`，层配置 `Ceil.sub_num` 给扣费数量；**当前处理器**让88941从该层 `Ceil.award` 的剩余格中无放回打开，发 `Award.award_item/award_num`，保存已开格、层和轮，并在候选耗尽后推进。这一无放回和推进算法来自本服源码，尚无原服随机/推进对照。原 `Ceil[1011]` 需2个门票、候选Award1–7；`Award[1]` 为 `201500×5` 且 `special=true`，该标志是否提前升层仍待原消费者证据。

88942任务需权威事件；`Task[1001]` 是type1803、目标1、奖励 `861200×5`，表存在仍不能代替任务完成来源。`ShopSettle[1]` 配置 `org_item=3501900 → trans_item=101500`、`trans_rate=1000`，换算除数和自动结算时点尚未据此证明。表：[PyramidTable](../rules/tables/PyramidTable.md)。

## DRAW-THREEADMONITION：三诫

**执行裁定：** [DRAW-THREEADMONITION 的唯一R1决定](../rules/final-rule-register.md#draw-threeadmonition)。本节数值与现代码描述须按该裁定使用。

**当前处理器**让88966建立入场态；88965以 `Const.cost_item=3401900`、`cost_item_num=15` 购买抽取资格；88961同时消费资格及 `draw_cost_item=3701900×1`，在未开DrawAward中抽取并保存索引；88962校验 `BoxAward.finish_index_list` 全部已完成再发箱奖。原表最大抽取数16；箱101要求索引1/2/3/4，奖励 `24400704×10`。资格与道具的双重扣费、无放回和重置顺序仍需原Lua或运行样本证明，不能仅靠处理器推出。

抽奖、箱奖和购买次数各有独立状态，重复箱奖不能重付。当前服务有表驱动链，但部分二进制局态留空；随机索引和叙事/答案状态尚未做客户端逐步验收。表：[ThreeAdmonitionTable](../rules/tables/ThreeAdmonitionTable.md)。

## DRAW-HUNDREDBONUS：百倍奖励

**执行裁定：** [DRAW-HUNDREDBONUS 的唯一R1决定](../rules/final-rule-register.md#draw-hundredbonus)。本节数值与现代码描述须按该裁定使用。

89401产生随机结果并保存，89402按本次结果与 `HundredBonus.base_value/bonus` 结算，89403读真实角色日志。`HundredBonus[1]` 配置 `free_num=2`、`limit_num=3`、`base_value=6`、奖励币101500；`Const.seq_cd=60`。免费次数、资格金额 `need_amount_list`、本次结果和已领位必须分开。

当前保存三位随机数并按表tid去重发奖；金额为max(1,base_value×(拼接值%11))，免费随机次数只累加、没有按free_num强制门禁，日志也未闭合完整写入生产。上述生成分布与bonus映射仅为当前算法，未获原服证据。`Robot.money` 是配置，不能把其中2368/2468等数值当玩家充值额或原服随机权重。付费额度、日重置、多人展示与机器人选择算法仍未知。表：[HundredBonusTable](../rules/tables/HundredBonusTable.md)。

## DRAW-WISHTREE：许愿树

**执行裁定：** [DRAW-WISHTREE 的唯一R1决定](../rules/final-rule-register.md#draw-wishtree)。本节数值与现代码描述须按该裁定使用。

91702选主题，91704保存合法自选，91701按当前主题和购买形成的资格抽取；91703宝藏领取是独立累计。`Global.max_accrue_day=14`、`treasure_need_times=10`；Type1关联商品46003/46002/40009。`Award[1001]` 为 `2002×10`，额外 `22002×2`，可选1001–1004；SelectAward1001还带 `join_day=13`，不能提前拿该选项。

购买、可抽次数、日返利和领取位由[许愿树服务](../../../personal-server/game/wish-tree-service.mjs)持久化；宝藏池/结算语义仍缺证，91703拒绝。14天从哪一状态字段起算、补登和旧期资格如何处理以原消费者为准，不用当前日期重新开满周期。表：[WishTreeTable](../rules/tables/WishTreeTable.md)。

## DRAW-CHESS：棋盘抽取

**执行裁定：** [DRAW-CHESS 的唯一R1决定](../rules/final-rule-register.md#draw-chess)。本节数值与现代码描述须按该裁定使用。

现代码91901按`Param.normal_cost_item/num`扣费并按配置序号发FixedAward，91904推进轮、91906领turn_award；这只是当前行为，原分布、特殊格结束及日重置消费者未闭合，R1不许可据此新增消耗翻格/换轮获奖。原Param1为5×5展示板、max_turn15、469002×1、is_daily_reset=true；FixedAward101配置101500×388，不能从展示格数推出必须抽25次。真实旧轮/已得结果保留，91906只凭真实完成轮交付原固定轮奖一次。

`FixedAward.is_special` 在当前实现中仅影响展示，原是否提前结束整轮仍需消费者证明。Task/Exchange/ChooseAward为0行，91902/91903/91905仍拒绝。`transform_item/rate`、`end_item`、每日重置与剩余格继承需恢复实际消费者；存在字段不等于已完成回收。表：[ChessTable](../rules/tables/ChessTable.md)。

## DRAW-RAFFLETICKET：奖券成就

**执行裁定：** [DRAW-RAFFLETICKET 的唯一R1决定](../rules/final-rule-register.md#draw-raffleticket)。本节数值与现代码描述须按该裁定使用。

92101按 `Achievement.condition` 检查已经产生的有效抽数，发对应 `award` 并保存成就领取位。例Achievement1要求25次，奖 `4371200×20`。`Const.draw_lib=23` 与特殊/一二三等奖各有独立ID，不允许从成就请求推出开奖结果。

当前成就检查存在，但抽数生产源未在该服务闭合；未达成返回业务拒绝，不能把领取请求本身累计为一次。全服开奖、券号和跨期结算属于独立缺口。表：[RaffleTicketTable](../rules/tables/RaffleTicketTable.md)。

## DRAW-HEROBLAZONDRAW：英雄纹章

**执行裁定：** [DRAW-HEROBLAZONDRAW 的唯一R1决定](../rules/final-rule-register.md#draw-heroblazondraw)。本节数值与现代码描述须按该裁定使用。

`HeroBlazonDraw[1]` 原字段为消耗395002×1、单抽1/多抽5、`positive_guarantee=60`、`counter_guarantee=[20,3]`、`max_daily_draw=1000`、多抽解锁抽数25，池为3201。92201应按本池连续抽取并分别维护日抽数、正/反保底与替换状态。

当前缺DrawTable3201–3204的有效组，且 `[20,3]` 两个分量的触发和重置算法未证明，明确拒绝；不能公告“20抽必3个”之类推测。表：[HeroBlazonDrawTable](../rules/tables/HeroBlazonDrawTable.md)。

## DRAW-LOTTERYACT：抽奖活动

**执行裁定：** [DRAW-LOTTERYACT 的唯一R1决定](../rules/final-rule-register.md#draw-lotteryact)。本节数值与现代码描述须按该裁定使用。

92301先使用 `free_num`，用尽后扣 `draw_item` 或原替代支付，再从当前 `Lib` 抽中并立即入账；92302读取同角色日志。`LotteryAct[1]` 为免费1次、道具413002、`max_luck_value=1000`、normal_lib201–207、big_lib101–103；`Lib[101]` 配101500×5000、weight800，同时有 `probability=60`。两个字段不可混作同一个概率。

当前处理普通加权与个人日志；BigRate、幸运值累加/重置、全服展示和现金替代价格消费者仍有缺口。免费次数重置必须按实例与原日界，不同版本不能共用免费位。表：[LotteryActTable](../rules/tables/LotteryActTable.md)。

## DRAW-MYSTERYWISH：神秘心愿

**执行裁定：** [DRAW-MYSTERYWISH 的唯一R1决定](../rules/final-rule-register.md#draw-mysterywish)。本节数值与现代码描述须按该裁定使用。

93001只接受当前类别和池的可兑换Item，消费 `Const.cost_item=473002×7` 后发该行 `item/count`，保存领取/兑换状态。`Item[11001]` 为type11、英雄1030101×1。当前能扣费和发奖，但 `Item.type` 的筛选、类型切换及是否可重复兑换尚待客户端链证明；不能允许任意tid跨类型兑换。表：[MysteryWishTable](../rules/tables/MysteryWishTable.md)。

## DRAW-LOTTERY：彩票及过期券

**执行裁定：** [DRAW-LOTTERY 的唯一R1决定](../rules/final-rule-register.md#draw-lottery)。本节数值与现代码描述须按该裁定使用。

93101使用券进入对应期，93102处理已经到期的本期券。`Item[100013400]` 为period1、`draw_lib=3901`、`server_open_time=[8,14]`、`expire_time=28`、`guarantee_tid=1`。这是开服区间与过期字段的原值，时间单位/端点和保底算法仍须原脚本确认。

3901池当前为空，权威期次结算也未建立，两命令拒绝；不以固定奖或等值钻石代替兑奖，不直接清除用户旧券。表：[LotteryTable](../rules/tables/LotteryTable.md)。

## DRAW-FLIPCARD：翻牌换轮

**执行裁定：** [DRAW-FLIPCARD 的唯一R1决定](../rules/final-rule-register.md#draw-flipcard)。本节数值与现代码描述须按该裁定使用。

97201选择/推进合法Turn；97301应在本轮Board/Award定义下扣普通或付费道具、保存已翻牌和奖励。Version1展示3×5，普通470002×1、付费471002×1、绑定活动96001、功能1292，并有 `recover_mail=3231400`。

当前只保存轮次，缺Board/Award族使翻牌拒绝。回收邮件ID不能证明回收倍率已恢复，不能只造15张空牌让客户端继续。表：[FlipCardTable](../rules/tables/FlipCardTable.md)。

## DRAW-TICKETDRAW：票券开奖

**执行裁定：** [DRAW-TICKETDRAW 的唯一R1决定](../rules/final-rule-register.md#draw-ticketdraw)。本节数值与现代码描述须按该裁定使用。

97501领取开奖结果，97502读历史；资格应来自该场实际持券/参与记录，抽签、全服/跨服场次与领取位分开。Type1的道具6203500，`draw_rank=[1,2,3]`、`draw_num=[1,1,1]`、`settle_time=18300`、`is_cross=true`，安慰奖101500×100；Award1011配101500×30000。

当前缺跨角色开奖与冻结结果，两命令拒绝。18300保留秒数字段，不能脱离原时钟消费者断言为每天05:05固定开奖。表：[TicketDrawTable](../rules/tables/TicketDrawTable.md)。

## DRAW-FRUITDRAWACT：水果抽奖

**执行裁定：** [DRAW-FRUITDRAWACT 的唯一R1决定](../rules/final-rule-register.md#draw-fruitdrawact)。本节数值与现代码描述须按该裁定使用。

97901保存当前版本合法BigCell，97902按所选大奖、普通格、连线和累计规则扣费开奖。Const1的券499002×1、`probability=11409`、`multi_unlock_cnt=10`、`max_multi_cnt=5`、`multiple=2`；BigCell1101选择300120×1，关联碎片300121。

当前只接选择；11409在DrawTable.LibWeight中缺关系，开奖拒绝。大奖进度40、倍率2等字段须由实际消费者解释，不能把概率ID11409换算成百分比。表：[FruitDrawActTable](../rules/tables/FruitDrawActTable.md)。

## DRAW-DRAW：通用心愿

**执行裁定：** [DRAW-DRAW 的唯一R1决定](../rules/final-rule-register.md#draw-draw)。本节数值与现代码描述须按该裁定使用。

98101保存wish tid与draw lib，后续实际招募必须使用同一库的资格、候选与重置周期。当前持久化已接，尚未与recruit-service的通用心愿验证和重置完全连接；不能因为“完成选择”返回成功就认定后续概率已经按心愿变化。普通与活动心愿分别隔离，不复制到全部奖池。

## DRAW-DEMIGODACT：天极活动

**执行裁定：** [DRAW-DEMIGODACT 的唯一R1决定](../rules/final-rule-register.md#draw-demigodact)。本节数值与现代码描述须按该裁定使用。

天极活动需要本期目标/形态、专用池、主任务、试炼、投票/活动计数与专属养成共同恢复。现有[天极活动服务](../../../personal-server/game/demigod-act-service.mjs)和专用draw-pool有状态路径；表中的 `lib_range`、任务/奖励关系若缺，不允许使用相邻版本。F块该卡没有新增缺失命令，不能由此推导玩法已完成；完整池、跨期、战斗与客户端各自验收。数值以[DemigodActTable](../rules/tables/DemigodActTable.md)为索引，缺失子表保留缺失状态。

## DRAW-ELVESACT：精灵现世

**执行裁定：** [DRAW-ELVESACT 的唯一R1决定](../rules/final-rule-register.md#draw-elvesact)。本节数值与现代码描述须按该裁定使用。

100901选择主精灵，100902选择果实活动，100903按实际抽数领取DrawAward；目标须属于本期ElvesAct配置，不能选任意已存在精灵。例DrawAward7001为version7、10抽奖499002×5。`Elves` 中关联up_star_act与专属商店是后续入口，不意味着选择即可领取升星奖。

当前保存选择并检查门槛，抽数源和DrawAwardShow回包仍有缺口。主精灵、果实、自选、升星与累计位分别保存，换目标是否清保底没有证据不能自行决定。表：[ElvesActTable](../rules/tables/ElvesActTable.md)。

## DRAW-ARTIFACTDRAWACT：圣器活动

**执行裁定：** [DRAW-ARTIFACTDRAWACT 的唯一R1决定](../rules/final-rule-register.md#draw-artifactdrawact)。本节数值与现代码描述须按该裁定使用。

选择当期合法圣器目标→专用抽取→里程碑/升级任务→按配置兑换/购买，是与普通圣器养成不同的活动链。由[圣器活动服务](../../../personal-server/game/artifact-draw-act-service.mjs)及专用奖池处理；当前活动实例/版本与DrawLib必须一致。表：[ArtifactDrawActTable](../rules/tables/ArtifactDrawActTable.md)。是否主目标保底、重复物品转换、多人跑马灯和跨期累计，逐专用池核证，不能从F块“0条新增缺失命令”得出已还原。

## DRAW-BONUSDRAW：福利抽取

**执行裁定：** [DRAW-BONUSDRAW 的唯一R1决定](../rules/final-rule-register.md#draw-bonusdraw)。本节数值与现代码描述须按该裁定使用。

101901请求 `{id,num,stop}`，`num`不超过持有券和 `BonusDraw.max_cnt`；按 `BonusDraw.pool[cur_pool] → Pool.lib → Lib.cnt/award/type` 解析剩余奖，遇BIG且stop为真就结束本批。101902换下一池，101904选指定池。表中8个BonusDraw、51Pool、352Lib，每池1种BIG/3种MID/4种SMALL；max_cnt均5。1–3号券660002，4–8号券802002。

客户端已证明 `cur_pool` 是pool数组中的1起始位置，剩余份数按配置cnt扣已抽记录。当前服务按剩余份数均匀无放回抽样，**单奖真实权重未恢复**；Pool.probability未使用，`can_choose`未严格执行，`convert_item=201500/convert_num=1000`转换未接，登录槽也未接。101902返回ETF map的客户端形态尚待验。详见[专项](../../../agent/workflow/gameplay-completion/DRAW-BONUSDRAW/implementation.md)、[BonusDrawTable](../rules/tables/BonusDrawTable.md)。

## DRAW-CAPSULETOY：扭蛋

**执行裁定：** [DRAW-CAPSULETOY 的唯一R1决定](../rules/final-rule-register.md#draw-capsuletoy)。本节数值与现代码描述须按该裁定使用。

102301按PoolOutput权重与价格开扭蛋、更新实际玩具数量；102302按Exchange.group/num消费组合并发 `award_num`；102303消耗玩具收集/回收；102304按累计收集数领Collect档。例Exchange101需两组各1，奖励101500×30000，`limit=1`。有36PoolOutput、24种CapsuleToy和9档Collect。

抽到、持有、已收集、已兑换是不同计数；兑换不能仅增加累计而不扣玩具，收集不能再当库存使用。当前链有真实事务，部分集合位与回包仍需客户端对照；轮次/日限购/回收跨期时点未取得的字段不补常数。表：[CapsuleToyTable](../rules/tables/CapsuleToyTable.md)。

## DRAW-CHESSREVERT：棋盘翻转

**执行裁定：** [DRAW-CHESSREVERT 的唯一R1决定](../rules/final-rule-register.md#draw-chessrevert)。本节数值与现代码描述须按该裁定使用。

102402先保存当前版本合法礼物选择，102403换轮必须保留正确ActTurn进度，102401领取当前已经达成的轮奖。ActActive101为version1、cnt100；ActVersion1关联tile_swap1及商店奖励668002×25/667002×15。

当前选礼和推进有状态路径，但ActActive→ActTurn权威进度映射未恢复，102401拒绝，不能用请求id直接发奖。付费累计ActRecharge与普通活跃分别计算，不能以换块完成数替代充值。表：[ChessRevertTable](../rules/tables/ChessRevertTable.md)。

## DRAW-CHILDPUZZLEACT：儿童拼图

**执行裁定：** [DRAW-CHILDPUZZLEACT 的唯一R1决定](../rules/final-rule-register.md#draw-childpuzzleact)。本节数值与现代码描述须按该裁定使用。

103305先保存本轮自选；103301按PuzzleVersion的库和消耗抽拼片；103302按真实连线/列完成领奖；103303满足结束规则才换轮；103304领取真实PuzzleTask进度。原PuzzleVersion1为map_x4/map_y4、max_turn3、draw_consume_id709002/draw_consume_num10/draw_lib5510；PuzzleAward101101奖101500×80。

当前抽取/选择/换轮有路径，连线规则未恢复使103302拒绝；Task的外部生产源也未闭合。`res_rollback=10`及 `puzzle_award_mail`需单独解释，不能直接作为全部余额回收比例。表：[ChildPuzzleActTable](../rules/tables/ChildPuzzleActTable.md)。

## DRAW-HOARDWHEELACT：囤积轮盘

**执行裁定：** [DRAW-HOARDWHEELACT 的唯一R1决定](../rules/final-rule-register.md#draw-hoardwheelact)。本节数值与现代码描述须按该裁定使用。

103501保存Pool与合法自选奖，实际draw_id的招募链生产抽数；103502领任务奖，103503领Pile累计档。Pool1指向draw_id207、choose_id[3]；Task1101为version1、type1803、目标1、奖596002×5；Award1配2371200×1并引用probability15501。

当前任务和累计检查有路径，但缺生产调用方写入进度，新号未达标拒绝。奖池选择、累计、任务keep_type各有作用域；不能因为重登或切池归零全部数据，也不能由probability ID编概率。表：[HoardWheelActTable](../rules/tables/HoardWheelActTable.md)。

## DRAW-THOUSANDDRAW：千抽

**执行裁定：** [DRAW-THOUSANDDRAW 的唯一R1决定](../rules/final-rule-register.md#draw-thousanddraw)。本节数值与现代码描述须按该裁定使用。

104501根据type与当前层 `thousandDraw.tower_layer` 选 one/two/three_draw_lib，经Group.lib_range抽出本批并写pending；104502一次性发pending并清空。Const.max_round=25；配置1001为total_times10、tower_layer40、三个池1/17/21；Group1仅 `[10000,1030401,1]`。

不能开抽与领取各发一遍，未领pending不允许覆盖。当前真实pending与领取已接；每层one/two随机次数范围、层解锁和25轮后的行为仍需客户端核对，不能把单候选Group1推成全部千抽都固定英雄。表：[ThousandDrawTable](../rules/tables/ThousandDrawTable.md)。

## DRAW-PRAYACT：祈福

**执行裁定：** [DRAW-PRAYACT 的唯一R1决定](../rules/final-rule-register.md#draw-prayact)。本节数值与现代码描述须按该裁定使用。

104901须一次提交AwardIndex要求的五个奖池的完整合法自选，拒缺项、跨索引及重复；104902传活动实例ID，按该实例version同时推进五索引。普通结果用normal_val，暴击用critical_ration与critical_val，积累progress_val后发该索引所选奖，并保存次数、进度和历史。

AwardIndex1为version1、normal_val1、critical_ration400、critical_val[2,5]、progress_val100；Award1为pray_index1、3791200×1。400的分母应查运行消费者，不能直接印成400%。当前五池与module183重登重建已接；`AwardRation.direct_group/target_cnt/direct_ration`、is_direct仍待证。详见[专项](../../../agent/workflow/gameplay-completion/DRAW-PRAYACT/implementation.md)、[PrayActTable](../rules/tables/PrayActTable.md)。

## DRAW-CASHBACKDRAW：返利抽奖

**执行裁定：** [DRAW-CASHBACKDRAW 的唯一R1决定](../rules/final-rule-register.md#draw-cashbackdraw)。本节数值与现代码描述须按该裁定使用。

105502应根据已支付的合法充值增加次数，105501扣实际资格与Round.cost_num开奖，105503按真实全服进度领奖，105504读全服累计。Act1配need_recharge12、award818102×100；Round1为version1/turn1/cost_num200；AwardLib101权重1000、award2002×3、need_draw0，ProAward1为pro100奖101500×500。

当前缺权威充值币种、全服充值和累计，四命令拒绝。钱包后台加余额不是充值事件，也不能把Act.need_recharge12直接解作12元后跳过商品归属。表：[CashbackDrawTable](../rules/tables/CashbackDrawTable.md)。

## DRAW-TURNTABLEACT：转盘

**执行裁定：** [DRAW-TURNTABLEACT 的唯一R1决定](../rules/final-rule-register.md#draw-turntableact)。本节数值与现代码描述须按该裁定使用。

当前107901先消费 `Ver.use_item`，从达到 `Award.min_num` 的本版候选按weight抽取，发奖并更新轮数与未出大奖次数。原Ver1消耗6881900×1、big_num49；Award101为version1/min_num1/weight700，奖22002×1、is_big=false。

big_num与min_num共同决定候选/大奖条件，不能只拿某行700除10000公告概率。当前有表驱动扣费与持久化，部分活动回包字段留空；大奖后计数重置和保底在客户端需对照，未覆盖所有版本。表：[TurntableActTable](../rules/tables/TurntableActTable.md)。

## DRAW-FLOPCARDACT：牌型翻牌

**执行裁定：** [DRAW-FLOPCARDACT 的唯一R1决定](../rules/final-rule-register.md#draw-flopcardact)。本节数值与现代码描述须按该裁定使用。

当前109101按本阶段 `Ver.use_item/flop_card_times` 扣费，按CardHandRank牌型与AwardGroup权重生成奖励并挂pending；109102真正领取；109103按AccAward.cond_val领累计档。原Ver1的flop_card_times=[3,4,1]，use_item依次820202×3/×3/×1，limit_flop_card7，gift_act184503、shop_act187017。AwardGroup1权重[5000,5000]，候选101500×500与4981200×1。

pending、已翻数、jackpot、累计位不能混为一个标记，重登恢复同一手牌。当前完整扣费/挂奖/领取链已接；牌面展示、大奖后的换轮、权重与阶段组合的原服分布仍未完成APK验收。表：[FlopCardActTable](../rules/tables/FlopCardActTable.md)。

## DRAW-HUNDREDDRAWACT：百抽

**执行裁定：** [DRAW-HUNDREDDRAWACT 的唯一R1决定](../rules/final-rule-register.md#draw-hundreddrawact)。本节数值与现代码描述须按该裁定使用。

117002先选本期合法目标，117001按Pool消耗单抽/十抽并逐次维护累计与保底；117003领ProcessAward、117004领StarTask、117005读榜。旧Activity.func20与ActFrame.type1102都指向本族。Version1连Pool101、礼包1841001、商店182810；Pool101券835802。父活动20001的实际窗口必须传给子商店/礼包，不能因子行静态窗口过期而拒绝本期购买。

当前[百抽服务](../../../personal-server/game/hundred-draw-service.mjs)从PoolAward的probability_num优先、weight其次抽取，累计到guarantee_total_draw_times时选本体候选；该算法的原权重/保底选择尚有缺口，不能当原服概率。选目标、目标碎片/本体、升星任务的资源类型分别处理，非英雄目标条件和type104能力奖励仍需对照；排行榜必须来自实际抽数。详见[专项](../../../agent/workflow/gameplay-completion/DRAW-HUNDREDDRAWACT/implementation.md)、[HundredDrawActTable](../rules/tables/HundredDrawActTable.md)。

## DRAW-HERODRAWACT：既有百校/英雄招募活动任务与流派

**执行裁定：** [DRAW-HERODRAWACT 的唯一R1决定](../rules/final-rule-register.md#draw-herodrawact)。本节数值与现代码描述须按该裁定使用。

100301按本期Task的真实招募/流派进度领奖，100302保存合法draw exchange/流派选择，实际抽取另由专用池与购买/次数生产。原Task1为version1/task_type1/task_value100/award101500×100；Const1有add_draw_num100/add_draw_time60/hero_list[1030101,2030201,3030601,4030501]；GenreRank1连genre_team101/rank_id180，RankReward1为rank_tid180/rank_range[1,1]、奖3002×10、101500×666、352708×1。

当前[hero-draw-activity-service](../../../personal-server/game/hero-draw-activity-service.mjs)有合法选择、真实任务/购买和登录路径。add_draw_time60的单位与恢复起点、流派计分、额外抽数、原专用池与期末名次奖励仍需逐消费者核验；不能把一次选择成功当100抽已发。该族是原inventory中的既有服务，没有新待办卡。[HeroDrawActTable](../rules/tables/HeroDrawActTable.md)。

## 跨日、跨期与验收重点

逐族至少覆盖：有pending时断线→重登同结果；领取成功后回包丢失→不重发；批量抽中保底后剩余抽继续使用更新计数；换目标/换池不污染其他库；第五点前后免费数与日限；活动结束前后是否仍可领pending；原回收表对应的物品与倍率。上文未恢复的回收与保底分支不能用通用清币/重置算法代替。

<!-- command-index:start -->

## 完整命令与任务卡索引

来源：[原静态命令目录](../../plans/remaining-gameplay-20261106/inventory.json)。仅取命令号、名称、模块、编码和schema，不继承其旧路由状态。`—`表示目录未绑定schema，不代表请求无参数或该功能未实现。实际分发与编码差异以正文当前处理器说明为准；原定义见[protobuf资产](../../../personal-server/assets/protobuf/)和[接口目录](../../../agent/workflow/interface-catalog/tcp-commands.md)。

### DRAW-MAGICDRAW

[规则段](#draw-magicdraw魔法招募) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-magicdraw魔法招募选人成就与升星奖励)。客户端模块：`MagicDrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 60002 | `req_magic_draw_choose_hero` | etf / — | protobuf / `pb_magic_draw_back` |
| 60003 | `req_magic_draw_achieve_award` | etf / — | protobuf / `pb_magic_draw_back` |
| 60004 | `req_magic_draw_hero_star_award` | etf / — | protobuf / `pb_magic_draw_back` |

### DRAW-PINBALL

[规则段](#draw-pinball弹珠成就) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-pinball弹珠活动成就)。客户端模块：`PinBallCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88921 | `req_pin_ball_act_achieve_award` | etf / — | protobuf / `pb_act_pin_ball_role_res_back` |

### DRAW-FANTASYEQUIPACT

[规则段](#draw-fantasyequipact幻武活动与管道) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-fantasyequipact幻武活动管道小游戏任务与试炼闭环)。客户端模块：`FantasyEquipActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88922 | `req_get_day_marbles_award` | etf / — | protobuf / `pb_res_to_client` |
| 88924 | `req_fantasy_draw_set_wish` | etf / — | etf-fallback / — |
| 88925 | `req_pipe_connect_reset` | etf / — | protobuf / `pb_pipe_connect_game` |
| 88926 | `req_pipe_connect_play` | protobuf / `pb_pipe_connect_play_req` | protobuf / `pb_pipe_connect_game` |
| 88927 | `req_fantasy_act_vote_award` | etf / — | protobuf / `pb_res_to_client` |
| 88928 | `req_fantasy_act_trial_award` | protobuf / `pb_fantasy_act_receive_trial_req` | protobuf / `pb_res_to_client` |
| 88929 | `req_fantasy_act_trial_wear` | protobuf / `pb_fantasy_act_wear_equip_req` | protobuf / `pb_fantasy_act_wear_back` |
| 88930 | `req_fantasy_act_trial_bless` | protobuf / `pb_fantasy_act_wear_bless_req` | protobuf / `pb_fantasy_act_wear_bless_back` |
| 88931 | `req_fantasy_act_trial_copy` | etf / — | protobuf / `pb_fantasy_equip_act_trial` |
| 88932 | `req_fantasy_act_draw_task` | protobuf / `pb_fantasy_act_task_reward_req` | protobuf / `pb_fantasy_act_task_reward_rev` |

### DRAW-PYRAMID

[规则段](#draw-pyramid金字塔) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-pyramid金字塔抽取与任务)。客户端模块：`PyramidCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88941 | `req_pyramid_draw` | etf / — | protobuf / `pb_pyramid_draw_back` |
| 88942 | `req_pyramid_task` | etf / — | protobuf / `pb_pyramid_task_rsp` |

### DRAW-THREEADMONITION

[规则段](#draw-threeadmonition三诫) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-threeadmonition三诫抽取宝箱次数与入场)。客户端模块：`ThreeAdmonitionCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 88961 | `req_three_admonition_draw` | etf / — | protobuf / `pb_three_admonition_draw_ret` |
| 88962 | `req_three_admonition_rev_box_award` | etf / — | protobuf / `pb_three_admonition_draw_ret` |
| 88965 | `req_three_admonition_add_draw_count` | etf / — | protobuf / `pb_res_to_client` |
| 88966 | `req_three_admonition_enter_act` | etf / — | etf-fallback / — |

### DRAW-HUNDREDBONUS

[规则段](#draw-hundredbonus百倍奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-hundredbonus百倍奖励随机领取与日志)。客户端模块：`HundredBonusCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 89401 | `req_hundred_bonus_random` | etf / — | etf-fallback / — |
| 89402 | `req_hundred_bonus_award` | etf / — | protobuf / `pb_res_to_client` |
| 89403 | `req_hundred_bonus_log` | etf / — | protobuf / `pb_hundred_bonus_log_back` |

### DRAW-WISHTREE

[规则段](#draw-wishtree许愿树) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-wishtree许愿树宝藏及已有抽取链路)。客户端模块：`WishTreeCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 91701 | `req_wish_tree_draw` | etf / — | protobuf / `pb_wish_tree_draw_back` |
| 91702 | `req_wish_tree_choose_theme` | etf / — | etf-fallback / — |
| 91703 | `req_wish_tree_rev_treasure` | etf / — | protobuf / `pb_wish_tree_rev_treasure_back` |
| 91704 | `req_wish_tree_select` | protobuf / `pb_wish_tree_select_req` | protobuf / `pb_wish_tree_select_back` |

### DRAW-CHESS

[规则段](#draw-chess棋盘抽取) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-chess棋盘抽取任务自选轮次与兑换)。客户端模块：`ChessCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 91901 | `req_chess_draw` | protobuf / `pb_chess_draw_req` | protobuf / `pb_chess_draw_rsp` |
| 91902 | `req_chess_task` | etf / — | protobuf / `pb_chess_task_award_rsp` |
| 91903 | `req_chess_choose_award` | etf / — | etf-fallback / — |
| 91904 | `req_chess_new_turn` | protobuf / `pb_chess_new_turn_req` | protobuf / `pb_chess` |
| 91905 | `req_chess_exchange` | protobuf / `pb_chess_exchange_req` | protobuf / `pb_chess_exchange_rsp` |
| 91906 | `req_chess_turn_award` | protobuf / `pb_chess_turn_award_req` | protobuf / `pb_chess_turn_award_rsp` |

### DRAW-RAFFLETICKET

[规则段](#draw-raffleticket奖券成就) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-raffleticket奖券成就)。客户端模块：`RaffleTicketCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92101 | `req_raffle_ticket_achievement` | etf / — | protobuf / `pb_raffle_ticket_phase_award_back` |

### DRAW-HEROBLAZONDRAW

[规则段](#draw-heroblazondraw英雄纹章) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-heroblazondraw英雄纹章抽取)。客户端模块：`HeroBlazonDrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92201 | `req_hero_blazon_draw` | protobuf / `pb_hero_blazon_draw_req` | protobuf / `pb_hero_blazon_draw_rsp` |

### DRAW-LOTTERYACT

[规则段](#draw-lotteryact抽奖活动) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-lotteryact抽奖活动与奖品日志)。客户端模块：`LotteryActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 92301 | `req_lottery_act_draw` | etf / — | protobuf / `pb_lottery_act_draw_back` |
| 92302 | `req_lottery_act_award_log` | etf / — | protobuf / `pb_lottery_act_server` |

### DRAW-MYSTERYWISH

[规则段](#draw-mysterywish神秘心愿) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-mysterywish神秘心愿兑换)。客户端模块：`MysteryWishCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 93001 | `req_mystery_wish_exchange` | etf / — | protobuf / `pb_res_to_client` |

### DRAW-LOTTERY

[规则段](#draw-lottery彩票及过期券) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-lottery彩票抽取与过期处理)。客户端模块：`LotteryCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 93101 | `req_lottery` | protobuf / `simple_use` | protobuf / `pb_res_to_client` |
| 93102 | `req_lottery_expire` | etf / — | protobuf / `pb_res_to_client` |

### DRAW-FLIPCARD

[规则段](#draw-flipcard翻牌换轮) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-flipcard翻牌与轮次)。客户端模块：`FlipCardCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 97201 | `req_flip_card_turn` | protobuf / `pb_flip_card_turn_req` | protobuf / `pb_flip_card_date` |
| 97301 | `req_flip_card` | protobuf / `pb_flip_card_req` | protobuf / `pb_flip_card_rsp` |

### DRAW-TICKETDRAW

[规则段](#draw-ticketdraw票券开奖) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-ticketdraw票券抽奖领奖与历史)。客户端模块：`TicketDrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 97501 | `req_ticket_draw_rev_award` | etf / — | protobuf / `pb_ticket_rev_award_back` |
| 97502 | `req_ticket_draw_query_history` | etf / — | protobuf / `pb_ticket_draw_info` |

### DRAW-FRUITDRAWACT

[规则段](#draw-fruitdrawact水果抽奖) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-fruitdrawact水果抽奖)。客户端模块：`FruitDrawActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 97901 | `req_fruit_draw_big` | etf / — | protobuf / `pb_fruit_draw_big_award_back` |
| 97902 | `req_fruit_draw` | etf / — | protobuf / `pb_fruit_draw_back` |

### DRAW-DRAW

[规则段](#draw-draw通用心愿) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-draw通用抽取心愿选择)。客户端模块：`DrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98101 | `req_draw_choose_wish` | protobuf / `pb_role_random_draw_item` | protobuf / `pb_role_random_draw_info` |

### DRAW-DEMIGODACT

[规则段](#draw-demigodact天极活动) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-demigodact神灵降世真实奖池与试炼闭环)。客户端模块：`DemigodActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98301 | `req_demigod_get_day_marbles_award` | etf / — | protobuf / `pb_res_to_client` |
| 98302 | `req_get_big_marbles_award` | etf / — | protobuf / `pb_res_to_client` |
| 98303 | `req_demigod_act_trial_award` | protobuf / `pb_demigod_act_receive_trial_req` | protobuf / `pb_res_to_client` |
| 98304 | `req_demigod_act_trial_wear` | protobuf / `pb_demigod_act_wear_equip_req` | protobuf / `pb_demigod_act_wear_back` |
| 98305 | `req_demigod_act_trial_bless` | protobuf / `pb_demigod_act_wear_bless_req` | protobuf / `pb_demigod_act_wear_bless_back` |
| 98306 | `req_demigod_act_trial_copy` | etf / — | protobuf / `pb_demigod_act_trial` |
| 98307 | `req_demigod_act_draw_award` | etf / — | protobuf / `pb_demigod_act_draw_award_back` |
| 98308 | `req_demigod_act_choose_wish` | etf / — | etf-fallback / — |

### DRAW-ELVESACT

[规则段](#draw-elvesact精灵现世) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-elvesact精灵活动主精灵果实抽取与奖励)。客户端模块：`ElvesActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100901 | `req_main_elves_tid` | etf / — | etf-fallback / — |
| 100902 | `req_cur_fruit_draw_act` | etf / — | etf-fallback / — |
| 100903 | `req_elves_draw_award` | protobuf / `pb_elves_act_draw_award_req` | protobuf / `pb_elves_act_draw_award` |

### DRAW-ARTIFACTDRAWACT

[规则段](#draw-artifactdrawact圣器活动) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-artifactdrawact圣器天池试炼统计接入)。客户端模块：`ArtifactDrawActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 101801 | `req_artifact_trials_claim_fight_rewards` | protobuf / `pb_req_artifact_trials_daily_reward_req` | protobuf / `pb_res_to_client` |
| 101802 | `req_artifact_draw_task_rewards` | protobuf / `pb_artifact_draw_task_award_req` | protobuf / `pb_artifact_draw_task_award_rsp` |
| 101803 | `req_artifact_fragments_draw` | protobuf / `pb_artifact_fragments_draw_req` | protobuf / `pb_artifact_fragments_draw_rsp` |
| 101804 | `req_artifact_fragments_new_turn` | protobuf / `pb_artifact_fragments_new_turn_req` | protobuf / `pb_fragments_draw_info` |
| 101805 | `req_artifact_fragments_claim` | protobuf / `pb_artifact_fragments_claim_req` | protobuf / `pb_artifact_fragments_claim_rsp` |
| 101806 | `req_artifact_fragments_synthesis` | protobuf / `pb_artifact_fragments_synthesis_req` | protobuf / `pb_artifact_fragments_synthesis_rsp` |

### DRAW-BONUSDRAW

[规则段](#draw-bonusdraw福利抽取) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-bonusdraw奖励抽取切换与选池)。客户端模块：`BonusDrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 101901 | `req_bonus_draw` | protobuf / `pb_bonus_draw_req` | protobuf / `pb_bonus_draw_back` |
| 101902 | `req_bonus_draw_switch` | etf / — | etf-fallback / — |
| 101904 | `req_bonus_choose_pool` | protobuf / `pb_bonus_draw_choose_pool` | protobuf / `pb_bonus_draw` |

### DRAW-CAPSULETOY

[规则段](#draw-capsuletoy扭蛋) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-capsuletoy扭蛋兑换收集与进度)。客户端模块：`CapsuleToyCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102301 | `req_capsule_toy_draw` | etf / — | protobuf / `pb_capsule_toy_draw_back` |
| 102302 | `req_capsule_toy_exchange` | protobuf / `pb_capsule_toy_exchange_req` | protobuf / `pb_res_to_client` |
| 102303 | `req_capsule_toy_collect` | etf / — | protobuf / `pb_capsule_toy_collect_back` |
| 102304 | `req_capsule_toy_progress` | etf / — | protobuf / `pb_capsule_toy_progress_back` |

### DRAW-CHESSREVERT

[规则段](#draw-chessrevert棋盘翻转) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-chessrevert棋盘翻转轮次自选礼物与换轮)。客户端模块：`ChessRevertCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102401 | `req_chess_revert_turn_award` | protobuf / `pb_chess_revert_req` | protobuf / `pb_chess_revert_award_back` |
| 102402 | `req_chess_revert_act_select_gift` | protobuf / `pb_chess_revert_select_gift_req` | protobuf / `pb_chess_revert_act_gift` |
| 102403 | `req_chess_revert_next_turn` | protobuf / `pb_chess_revert_next_turn` | protobuf / `pb_chess_revert_init` |

### DRAW-CHILDPUZZLEACT

[规则段](#draw-childpuzzleact儿童拼图) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-childpuzzleact拼图抽取自选任务与换轮)。客户端模块：`ChildPuzzleActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103301 | `req_puzzle_draw` | protobuf / `pb_puzzle_draw_req` | protobuf / `pb_puzzle_draw_back` |
| 103302 | `req_puzzle_award` | etf / — | protobuf / `pb_res_to_client` |
| 103303 | `req_puzzle_change_turn` | etf / — | protobuf / `pb_puzzle_person` |
| 103304 | `req_puzzle_task_award` | protobuf / `pb_puzzle_task_award_req` | protobuf / `pb_puzzle_task_award_rsp` |
| 103305 | `req_puzzle_select_award` | etf / — | protobuf / `pb_puzzle_person` |

### DRAW-HOARDWHEELACT

[规则段](#draw-hoardwheelact囤积轮盘) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-hoardwheelact囤积转盘奖池任务与累计)。客户端模块：`HoardWheelActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103501 | `req_hoard_wheel_set_pool` | protobuf / `pb_hoard_wheel_draw_change_req` | protobuf / `pb_hoard_wheel_pool` |
| 103502 | `req_hoard_wheel_task` | protobuf / `pb_hoard_wheel_task_req` | protobuf / `pb_res_to_client` |
| 103503 | `req_hoard_wheel_pile` | protobuf / `pb_hoard_wheel_pile_req` | protobuf / `pb_hoard_wheel_pile_back` |

### DRAW-THOUSANDDRAW

[规则段](#draw-thousanddraw千抽) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-thousanddraw千抽与领奖)。客户端模块：`ThousandDrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104501 | `req_thousand_draw` | protobuf / `pb_request_thousand_draw` | protobuf / `pb_response_thousand_draw` |
| 104502 | `req_thousand_award` | protobuf / `pb_request_thousand_award` | protobuf / `pb_response_thousand_award` |

### DRAW-PRAYACT

[规则段](#draw-prayact祈福) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-prayact祈愿自选与抽取)。客户端模块：`PrayActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104901 | `req_pray_act_select_award` | protobuf / `pb_pray_act_select_award_req` | protobuf / `pb_pray_act_select_award_rsp` |
| 104902 | `req_pray_act_draw_award` | protobuf / `pb_pray_act_draw_award_req` | protobuf / `pb_pray_act_draw_award_rsp` |

### DRAW-CASHBACKDRAW

[规则段](#draw-cashbackdraw返利抽奖) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-cashbackdraw返利抽奖次数全服奖励与进度)。客户端模块：`CashbackDrawCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105501 | `req_cashback_draw_draw` | protobuf / `pb_cashback_draw_draw_req` | protobuf / `pb_cashback_draw_draw_rsp` |
| 105502 | `req_cashback_draw_get_times` | protobuf / `pb_cashback_draw_get_times_req` | protobuf / `pb_cashback_draw_get_times_rsp` |
| 105503 | `req_cashback_draw_server_award` | protobuf / `pb_cashback_draw_server_award_req` | protobuf / `pb_cashback_draw_server_award_rsp` |
| 105504 | `req_cashback_draw_server_progress` | protobuf / `pb_cashback_draw_server_progress_req` | protobuf / `pb_cashback_draw_server_progress_rsp` |

### DRAW-TURNTABLEACT

[规则段](#draw-turntableact转盘) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-turntableact转盘活动)。客户端模块：`TurntableActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 107901 | `req_turntable_act_go` | etf / — | protobuf / `pb_turntable_act_go_back` |

### DRAW-FLOPCARDACT

[规则段](#draw-flopcardact牌型翻牌) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-flopcardact翻牌单次与累计奖励)。客户端模块：`FlopCardActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 109101 | `req_flop_card_flop` | protobuf / `pb_flop_card_act_flop_req` | protobuf / `pb_flop_card_act_rsp` |
| 109102 | `req_flop_card_get_reward` | protobuf / `pb_flop_card_act_get_reward_req` | protobuf / `pb_flop_card_act_rsp` |
| 109103 | `req_flop_card_get_total_reward` | protobuf / `pb_flop_card_act_get_total_reward_req` | protobuf / `pb_flop_card_act_rsp` |

### DRAW-HUNDREDDRAWACT

[规则段](#draw-hundreddrawact百抽) · [原任务卡](../../plans/remaining-gameplay-20261106/06-draw-activities.md#draw-hundreddrawact百抽进度奖自选升星奖与跑马灯)。客户端模块：`HundredDrawActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 117001 | `req_hundred_act_draw` | protobuf / `pb_hundred_act_draw_req` | protobuf / `pb_hundred_act_draw_rsp` |
| 117002 | `req_hundred_act_receive_process_award` | protobuf / `pb_hundred_act_receive_process_award_req` | protobuf / `pb_hundred_act_receive_process_award_rsp` |
| 117003 | `req_hundred_draw_act_select_award` | protobuf / `pb_hundred_draw_act_select_award_req` | protobuf / `pb_hundred_draw_act_select_award_rsp` |
| 117004 | `req_hundred_draw_act_rec_star_award` | protobuf / `pb_hundred_draw_act_rec_star_award_req` | protobuf / `pb_hundred_draw_act_rec_star_award_rsp` |
| 117005 | `req_hundred_draw_act_marquee` | protobuf / `pb_hundred_draw_act_marquee_req` | protobuf / `pb_hundred_draw_act_marquee_rsp` |

### DRAW-HERODRAWACT

[规则段](#draw-herodrawact既有百校英雄招募活动任务与流派) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`HeroDrawActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100301 | `req_hero_draw_act_task_reward` | etf / — | protobuf / `pb_hero_draw_act_task_reward_back` |
| 100302 | `req_hero_draw_act_set_draw_exchange` | etf / — | etf-fallback / — |

