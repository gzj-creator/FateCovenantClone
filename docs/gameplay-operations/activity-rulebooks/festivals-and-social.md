# 节庆、签到与协作详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

更新：2026-11-14。覆盖[原计划08](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md)的32张卡及既有MultiLogin。主要处理器为[act-reward-service](../../../personal-server/game/act-reward-service.mjs)，表读取见[act-activity-tables](../../../personal-server/config/act-activity-tables.mjs)，历史证据见[H块实施记录](../../../agent/workflow/gameplay-completion/ACT-REWARD-H/implementation.md)。冲榜79104另由[sprint-service](../../../personal-server/game/sprint-service.mjs)处理，不能把同族全部命令的状态混在一起。

下列原字段是静态事实；操作顺序与当前判定来自本服处理器时均按兼容路径理解。记录了资源写入不代表资格、随机、排行或时间算法已1:1恢复。节日表中的绝对时间保留原值，不能移成每个新服的同一天。请求与响应索引列于文末。

## ACT-SIGNACT：活动签到

**执行裁定：** [ACT-SIGNACT 的唯一R1决定](../rules/final-rule-register.md#act-signact)。本节数值与现代码描述须按该裁定使用。

37009提交活动id与签到day，当前用 `version*100+day` 查SignAct，拒绝未来日并记录该期day领取。原 `Const[1]` 为 `re_sign_count=0/re_sign_item=101500`；`SignAct[101]` 的item=[101500,101500]、count=[88,88]。补签上限0是该行事实，不推导所有版本永不能补签。

当前处理器将item/count的两项全部发放，尚未证明原数组是并发奖励还是不同资格档；因此不能把当前176钻写成原首日奖励。当前day按活动start经过24小时计算，补签消耗、resign_bin和原日界仍需消费者/客户端样本。[SignActTable](../rules/tables/SignActTable.md)。

## ACT-OPENSERVERSPRINT：开服冲刺任务、全服进度与排名奖励

**执行裁定：** [ACT-OPENSERVERSPRINT 的唯一R1决定](../rules/final-rule-register.md#act-openserversprint)。本节数值与现代码描述须按该裁定使用。

79101任务领取、79102完成玩家查询、79103全服档、79104排行任务领奖分别是不同来源。当前79101按SprintTask发奖/记日领取，但尚无完整task_value进度门禁；79102查询的是本角色已领记录，不能等同全服完成名单。79103缺跨角色聚合明确拒绝。

原 `SprintTask[1001]` 为task_value10/receive_limit2/rank_score0/award201500×1。79104独立服务使用实际排行榜与任务条件，历史真实APK领奖记录不覆盖79101/3。receive_limit2不能被通用“每期只能领一次”取代；全服首达名次、截止冻结和补领/邮件应逐分支核对。[OpenServerSprintTable](../rules/tables/OpenServerSprintTable.md)。

## ACT-LOGINREWARDACT：登录奖励活动

**执行裁定：** [ACT-LOGINREWARDACT 的唯一R1决定](../rules/final-rule-register.md#act-loginrewardact)。本节数值与现代码描述须按该裁定使用。

90301传活动实例，当前以Award.belong_act筛行、按tid排序，用活动第n日选第n档并保存已领tid；超过表天数时停在最后一档，重复领取拒绝。领取不会自己增加有效登录天数。

原Award101属于act82001、item101500/count500，LoginRewardAct82001有mail2571400。当前“活动经过天数”不等于“实际登录天数”，缺勤、补领和mail触发尚未原消费者确认；不得把该mail ID理解为自动补齐所有未签日。[LoginRewardActTable](../rules/tables/LoginRewardActTable.md)。

## ACT-CHRISTMASACT：圣诞装扮、奖励、心愿与商店

**执行裁定：** [ACT-CHRISTMASACT 的唯一R1决定](../rules/final-rule-register.md#act-christmasact)。本节数值与现代码描述须按该裁定使用。

现有98610消费Dress道具并增加装扮次数，98611领达到时间/次数的装扮奖，98612保存合法Wish，98613领商店档；装扮、心愿选择、日发道具、累计奖和商店领奖必须分别防重。选择心愿不能直接增加对应奖，跨日免费道具不应重置装扮累计。

原 `Period[105001]` 有divide_sec1734987600/appearance103003，DressAward1001101绑定act105001、available_sec1734840000、奖111608×1；日配置dress583002×1/wish584002×1。这里的1734…是绝对时间量级；当前time gate与版本编码是实现，未证明可按新服平移。原愿望结果、日期切换和剩余道具回收仍待证。[ChristmasActTable](../rules/tables/ChristmasActTable.md)。

## ACT-STOCKUPACT：囤货阶段与周期奖

**执行裁定：** [ACT-STOCKUPACT 的唯一R1决定](../rules/final-rule-register.md#act-stockupact)。本节数值与现代码描述须按该裁定使用。

99401应依据已发生的合法抽取累计领取阶段DrawAward，99402领取完成cycle_count的周期奖；二者不能通过领取请求自增抽数。原Version1为cycle_count240/cycle_award1721200×1/draw_lib158/probability59/multi_draw_condition10；DrawAward1为turn1/draw_count10/奖7101900×100。

当前缺本族抽数权威生产源，两条均明确拒绝。draw_lib158与probability59是不同引用，不是“158抽59%”；循环后清零/保留余数、阶段与周期能否同领、跨期继承和结束回收未证明。[StockUpActTable](../rules/tables/StockUpActTable.md)。

## ACT-COMACTDRAWAWARD：通用活动领奖

**执行裁定：** [ACT-COMACTDRAWAWARD 的唯一R1决定](../rules/final-rule-register.md#act-comactdrawaward)。本节数值与现代码描述须按该裁定使用。

99600按act_tid与draw_award_tid读取ActDrawAwardLib，当前发该库draw_award并累计draw_num，按库tid记一次领取。原 `ActDrawAward[101005]` 为init_count15/add_count5/award_lib1001–1006；Lib1001为draw_num10、奖499002×5与2171200×20、is_big标记。

当前处理器只检查库存在，尚未完整闭合库属于该活动、可用抽数、初始15和追加5的扣减，以及is_big/库切换条件；不能将任意库请求成功当原资格已验证。领取位不等于抽数余额，原循环、补次数来源和期末清理仍待恢复。[ActivityTable中的ActDrawAward族](../rules/tables/ActivityTable.md)。

## ACT-SPRINGFESTIVALACT：春节装扮与商店奖

**执行裁定：** [ACT-SPRINGFESTIVALACT 的唯一R1决定](../rules/final-rule-register.md#act-springfestivalact)。本节数值与现代码描述须按该裁定使用。

99601装扮扣本期Dress配置道具，99602按DressAward条件领取，99603按ShopAward领取；当前每档保存领取位。日发道具、装扮累计和商店付费资格分开，商店奖不能只凭有一行tid就任意领。

原Period116001的divide_sec1738011600，convert_src=[603002,620002]/convert_new=[101500,101500]/convert_param=[10,1000]，collectActs114001–114003；DressAward1001101奖352508×1。原convert字段并未证明单位、舍入和自动转换时点，当前不能直接宣布10:1或1000:1。春节真实日历和跨子活动累计也需核原消费者。[SpringFestivalActTable](../rules/tables/SpringFestivalActTable.md)。

## ACT-FESTIVALSIGNACT：节日签到

**执行裁定：** [ACT-FESTIVALSIGNACT 的唯一R1决定](../rules/final-rule-register.md#act-festivalsignact)。本节数值与现代码描述须按该裁定使用。

99801提交award_tid列表，当前限本version、按本版tid排序的序号门禁活动日，批量同事务发award_list与领取位。原FestivalSignAct101为version1、奖101500×666。

当前“第几个tid=第几天”是处理器映射，原开放日、缺勤补签、一天可补几档与日界未单独证明；不能因通用签到相似就复制SignAct.re_sign_count。批量有非法/重复条目时应整体回滚，已领位重登恢复。[FestivalSignActTable](../rules/tables/FestivalSignActTable.md)。

## ACT-COLLECTEXCHANGEACT：收集兑换

**执行裁定：** [ACT-COLLECTEXCHANGEACT 的唯一R1决定](../rules/final-rule-register.md#act-collectexchangeact)。本节数值与现代码描述须按该裁定使用。

100001按本期CollectExchangeAward检查sub库存，扣所有材料后发add，保存该行已兑换次数并限limit。原Award1001为version1，605002–609002各4，兑换11200×1，limit1。

当前同事务扣费与发奖已有路径；配置limit1是该行的期内上限，不应误作全账号永久上限。素材掉落生产、换期是否保留库存、剩余材料回收/邮件及limit0原含义仍需消费者，不能把当前Math.max(1,limit)解释成原规则。[CollectExchangeActTable](../rules/tables/CollectExchangeActTable.md)。

## ACT-FESTIVALMONSTERACT：节日怪物操作

**执行裁定：** [ACT-FESTIVALMONSTERACT 的唯一R1决定](../rules/final-rule-register.md#act-festivalmonsteract)。本节数值与现代码描述须按该裁定使用。

100101串联怪物局开始/攻击/结束，奖励应来自该局真实击打与击杀状态，不能由客户端报告次数直接领取。原FestivalMonsterAct1为total_hp2200/normal_hurt100/crit200/fight_count2/award604002×2/countdown3；Award1001为time_span[0,20]、奖2831200×4。

当前100101依赖未建立的BOSS局与结算，明确拒绝。正常/暴击分布、20秒区间是否闭区间、两次的日/期范围、击杀后奖励和未完成局恢复均未完整证明；不能用固定伤害或固定倒计时替代。[FestivalMonsterActTable](../rules/tables/FestivalMonsterActTable.md)。

## ACT-VALENTINEDAYACT：情人节领奖与聊天进度

**执行裁定：** [ACT-VALENTINEDAYACT 的唯一R1决定](../rules/final-rule-register.md#act-valentinedayact)。本节数值与现代码描述须按该裁定使用。

100502保存act_cfg_tid的chat index；100501领奖应只允许该活动已有的合法award_id，满足chat_available_sec和完成进度后记录同一配置领取位。原ValentineDayAct1绑定act123001/chat_npc10053200/chat_available_sec1739394000，奖101500×520、2002×2、32002×5；Content234行。

**当前有明确实现缺口**：100501找不到award_id时回退本活动首行，却按请求award_id记录领取，未闭合合法奖号与聊天条件；100502也只保存index，未验证完整内容推进。存在资源发放路径不等于原版已恢复。绝对开放时间、分支聊天与跨日/跨期领取需要原消费者和运行证据。[ValentineDayActTable](../rules/tables/ValentineDayActTable.md)。

## ACT-PREHEATACT：预热活动与奖励

**执行裁定：** [ACT-PREHEATACT 的唯一R1决定](../rules/final-rule-register.md#act-preheatact)。本节数值与现代码描述须按该裁定使用。

101001按PreheatAct消耗道具并记录抽取/预热状态，101002按Award发一次。原PreheatAct1为cost_tid638002/cost_num1/award2981200×1/divide_sec172800/max_draw_cnt999；Award1001101为version1/available_sec86400/server_range11/奖101500×666。

当前用act_id后缀 `act_id%1000` 找板、按编码解析version/index、把available_sec视为相对活动start的秒数，均是当前推断；不能把所有预热绑定到尾号相同的表。divide_sec172800与服务器区间server_range11的完整门禁、随机和跨段奖励还需原消费者。[PreheatActTable](../rules/tables/PreheatActTable.md)。

## ACT-COMMONSIGN：通用签到领奖

**执行裁定：** [ACT-COMMONSIGN 的唯一R1决定](../rules/final-rule-register.md#act-commonsign)。本节数值与现代码描述须按该裁定使用。

101501提交本期award_tid列表，当前按版本分组、tid顺序门禁日数，一次事务合并奖并回state_bin。原CommonSign101为version1、award2002×5。它与SignAct及FestivalSign是三个不同家族，不共用领取位或补签道具。

当前可领过去已解锁档，但这是处理器行为，真实补签规则未证明；序号与活动日、开服日/创角日的关系仍需原脚本。空列表、跨版tid和重复领取不应产生资源变化。[CommonSignTable](../rules/tables/CommonSignTable.md)。

## ACT-VOTEACT：盲投、普通投票、竞猜与全服进度

**执行裁定：** [ACT-VOTEACT 的唯一R1决定](../rules/final-rule-register.md#act-voteact)。本节数值与现代码描述须按该裁定使用。

102901/2投给本期Group允许Object，102903按实际票数门槛领进度，102904按任务领票，102905存竞猜，102906读全服总票，102907读参与者。个人消耗、个人票数、全服聚合和最终结果必须分开，客户端猜的三个对象不能直接作为赛果。

原Group101为version1/object1–8/select3/ret_object[1,2,3]；Task101为type1803/目标1/奖680002×1；Object1映射蜜雪儿3030501。当前个人投票/竞猜/本地领奖有状态，部分任务用个人票数代进度属于兼容映射；102906缺跨角色聚合仍拒绝。盲投概率、全服任务、排名冻结与竞猜发奖未完整恢复。[VoteActTable](../rules/tables/VoteActTable.md)。

## ACT-QUESTIONACT：答题与累计奖励

**执行裁定：** [ACT-QUESTIONACT 的唯一R1决定](../rules/final-rule-register.md#act-questionact)。本节数值与现代码描述须按该裁定使用。

103001提交day_index/topic_tid/choose；原Day1为version1/day1/lib1，Lib1列topic1–5/topic_num5，Topic1.answer2。Day.question_award_list的[0,9],[1,1]…[5,5]表示正确数到Award的映射；Award1发3221200×2。103002应按实际答题正确数选择对应Award，103003按累计正确/参与条件领Pile。

**当前尚未按此闭合**：103001只记录题号与choose，未做完整日期/选项和正确数门禁；103002直接把question_award_list交给资源发放函数，混淆映射与物品奖励，且未从Topic.answer算正确数。当前回答记录不等于答题结算完成。重复答题、跨日复用同topic、累计档与重新入场均需补原消费者/样本。[QuestionActTable](../rules/tables/QuestionActTable.md)。

## ACT-SUMMERACT：夏日主活动、水枪/水炮养成、阶段任务与结算

**执行裁定：** [ACT-SUMMERACT 的唯一R1决定](../rules/final-rule-register.md#act-summeract)。本节数值与现代码描述须按该裁定使用。

103711进入只保存enteredAt；主活动应再串联水枪升级/突破、灵珠激活/强化/品质、换皮肤、阶段任务、达标奖和结算。原SummerAct1关联累充106018–106021/buy_skin175001/clean_item列表；Task2001为phase2/type15302/target_count1/add_value10/奖721002×30，TaskProgress2001需100、奖736002×200。

原SummerWaterGun1的init_stage1/init_lv1/base_attr[[202,6000],[201,36000],[203,3600],[204,3600]]；SummerWaterGunLv1010001消耗721002×100、next_tid1010002。当前103702–10/103712及103701/103813–15养成、奖和结算多为明确拒绝。表已含水枪/灵珠数千行，缺的是对应权威状态/战斗与原迁移；不能继续笼统称“整张夏日表不存在”。clean_item不是已证自动清币逻辑。[SummerActTable](../rules/tables/SummerActTable.md)。

## ACT-SUMMERPVE：夏日PVE任务、次数、阶段与掉落

**执行裁定：** [ACT-SUMMERPVE 的唯一R1决定](../rules/final-rule-register.md#act-summerpve)。本节数值与现代码描述须按该裁定使用。

103801任务领奖、103802买挑战次数、103803阶段奖、103804选择额外掉落，需要同一phase的实际PVE次数、伤害/通关和选择状态。原PveConst1为day_free_trial_times2/max_top_up_day7；PveTrialTimes101500001用101500、price[[100,2]]；PvePhase1为phase2/trial_open_time259200/extra_drop_cost_num1，免费/付费额外掉落分别742002/743002。

当前四命令均因缺PVE挑战生产/迁移而拒绝。100和2的阶梯分量、试炼伤害区间、每日/总榜结算不能由字段外形推定；PveTrail20001001的max_hp3000000/fight10700001与TrailAward20101的damage_range1000和736002×25只是指定行事实，不证明任意自报1000伤害可领。[SummerActTable](../rules/tables/SummerActTable.md)。

## ACT-SUMMERMISSION：夏日关卡战斗结算与进度

**执行裁定：** [ACT-SUMMERMISSION 的唯一R1决定](../rules/final-rule-register.md#act-summermission)。本节数值与现代码描述须按该裁定使用。

103901必须消费已发出的本期关卡票据并验证结果，103902以真实已过主/支线任务累计领章节进度；剧情节点、小游戏节点和战斗节点需按mission_type区分，不能所有节点都模拟普通战斗。

原MainMission10001为chapter101/mission_type2/fight0/unlock_day0/award721002×300、723002×25、729002×4、3391200×1；SubMission10001为unlock_day3，ProgressAward1010001需challenge_count6、奖729002×500。当前两条均缺真实战斗/通关生产而拒绝；fight0并不等于随意送通关奖，前置和非战斗完成条件仍需消费者。[SummerActTable](../rules/tables/SummerActTable.md)。

## ACT-SUMMERPVP：夏日PVP、多队、竞猜、对手与挑战次数

**执行裁定：** [ACT-SUMMERPVP 的唯一R1决定](../rules/final-rule-register.md#act-summerpvp)。本节数值与现代码描述须按该裁定使用。

104101/111初始化交换/多队阵容，104107/108/113匹配或刷新对手，104105/106/109/110买不同次数，104102/103按真实日/阶段任务领奖，104104猜结果，104112查历史。各类次数不能共用一计数，竞猜不是挑战胜负来源。

原PvpConst1为swap_free_fight_times10/swap_free_rematch_times10、两类购买均101500×10/init_rank1000/guess_end_offset_time111600；ChallengeVersion1有free_challenge_count20/free_refresh_count10/init_score1000/enter_score3200。当前仅保存猜测和本地历史等少量路径，其余匹配/多队/购买/任务仍拒绝。原机器人库存在不代表可以固定胜负或造全服榜，ELO、跨服分组、竞猜结算与排名奖励未闭合。[SummerActTable](../rules/tables/SummerActTable.md)。

## ACT-QIXIACT：七夕折扣选择与日签

**执行裁定：** [ACT-QIXIACT 的唯一R1决定](../rules/final-rule-register.md#act-qixiact)。本节数值与现代码描述须按该裁定使用。

104401按recharge_tid保存自选条目，实际购买仍走支付链；104402按本期version与活动日选QiXiSign并记日领取。原QiXiSign1为day1/version1、奖3501200×1和101500×520；QiXiRecharge1的recharge_id_list为[1240001]。

当前自选只保存非空select_list，完整gift_award_tid/select_tid合法关系和购买消费这些选择的链仍需核对。日签当前不补领其他日；原是否补领、换选择时机、跨期同充值tid复用不能由现有持久化成功推导。[QiXiActTable](../rules/tables/QiXiActTable.md)。

## ACT-ANNIVERSARYGAMEACT：周年小游戏领奖

**执行裁定：** [ACT-ANNIVERSARYGAMEACT 的唯一R1决定](../rules/final-rule-register.md#act-anniversarygameact)。本节数值与现代码描述须按该裁定使用。

104403本应结算指定type的一局成绩并按其奖/次数规则发放。原Version1含games[59,58]/award_times1/card_count30；AnniversaryGameAct59有game_time30000/score_range[10000,30000]/skip_score[25000,30000]/rank_type235。另一个原奖励行Award15801奖8801900×1000与101500×100，它不属于上例game59，不能跨游戏配奖。

**当前用type*100+1固定选奖、按活动日发一次，回best.score=0/rank=0，未按真实成绩判档**；Version.games只证明某版本允许该游戏，不等于该请求活动绑定已完整核验。原跳过成绩分布、奖档、有效局与排行榜结算仍未恢复，不能称小游戏已原样还原。[AnniversaryGameActTable](../rules/tables/AnniversaryGameActTable.md)。

## ACT-FIVEDAYBOSSACT：五日BOSS任务、限时通关与排名

**执行裁定：** [ACT-FIVEDAYBOSSACT 的唯一R1决定](../rules/final-rule-register.md#act-fivedaybossact)。本节数值与现代码描述须按该裁定使用。

104601按已产生Task进度领，104602按TimePass及真实通关日期领，104603读实际排名。原Task101为day1/type1802/目标1/奖391002×300；TimePass106需need_day2，奖2002×10。

当前601/602缺任务与通关历史而拒绝，603只有本地读边界；BOSS伤害生产、开服/活动日、第二天之前还是之后条件、榜期冻结与名次发奖均待原消费者。不能拿请求时客户端显示的“已过”直接写服务器通关。[FiveDayBossActTable](../rules/tables/FiveDayBossActTable.md)。

## ACT-ONESREWARD：单次专项奖励

**执行裁定：** [ACT-ONESREWARD 的唯一R1决定](../rules/final-rule-register.md#act-onesreward)。本节数值与现代码描述须按该裁定使用。

105101按活动实例记录一次领取，当前读取OnesReward首行award。原row1为20014100至20074100七种各15。领取位与全部七种奖励应同事务，重发请求不得再给。

当前原表单行并不证明任意活动都能领此专项奖，活动type/版本的资格映射仍需原消费者；期次重开和账户/角色作用域不得凭通用claims表推为原规则。[OnesRewardTable](../rules/tables/OnesRewardTable.md)。

## ACT-INVITEACT：邀请绑定与任务

**执行裁定：** [ACT-INVITEACT 的唯一R1决定](../rules/final-rule-register.md#act-inviteact)。本节数值与现代码描述须按该裁定使用。

105201绑定真实邀请者/被邀请者，105202依据被邀请角色实际升级等事件给邀请方任务奖。原InviteConst.max_bind10；InviteAct1为split_level160/bind_reward1221200×1、2002×20、101500×1000；InviteTask1为type1801/目标80。

当前两条因缺多角色邀请图而明确拒绝。绑定次数、等级门槛、是否允许同账号、自邀和换绑、被邀80级统计和跨期绑定保留都需原消费者/真实关系账本，不允许虚构被邀请者刷满。[InviteActTable](../rules/tables/InviteActTable.md)。

## ACT-INVITEOLDACT：老玩家邀请与任务

**执行裁定：** [ACT-INVITEOLDACT 的唯一R1决定](../rules/final-rule-register.md#act-inviteoldact)。本节数值与现代码描述须按该裁定使用。

105250老玩家受邀/绑定与105251任务领奖需要真实旧账号资格、回归日期及被邀角色进度。原InviteOldTask101001为type100602/target28000000/limit_get_count1；2800万不能未经任务消费者证明直接标成战力。

当前两条明确拒绝，不能仅把邀请码字符串写入角色就算关系成立。需要恢复旧玩家判定、邀请关系、任务来源、可领取方和期内次数，跨期是否保留同一绑定也未知。[InviteOldActTable](../rules/tables/InviteOldActTable.md)。

## ACT-ROLEBACK：回归绑定、继承卡、账号查询与每日资源

**执行裁定：** [ACT-ROLEBACK 的唯一R1决定](../rules/final-rule-register.md#act-roleback)。本节数值与现代码描述须按该裁定使用。

回归先判Old/New资格，再查询旧角色、建立绑定/继承关系，105301绑定奖与105308日资源应以该关系为前提。原Old1为level30/leave_hours360/keep_time864000，s/e1789074000/1791665999；New1为min_recharge98/money100/money_item601500/keep_time864000，绑定奖209708×1、3002×20、2002×50、101500×8888。

当前105303继承卡、105305新绑定、105307跨账号角色查询拒绝；105301/308却已有直接发奖路径，未闭合真实绑定/离线/充值资格，因此不能称回归奖励条件已恢复。98的币种口径、有效10日从何开始、历史账号继承与日界需原消费者，后台钱包加款不应代替充值。[RoleBackTable](../rules/tables/RoleBackTable.md)。

## ACT-CHOICESTORY：分支剧情奖励

**执行裁定：** [ACT-CHOICESTORY 的唯一R1决定](../rules/final-rule-register.md#act-choicestory)。本节数值与现代码描述须按该裁定使用。

105601应在本期章节/页面达到已发生的分支状态后领合法award_list；原Chapter1带asserts321245600001，ChapterPage1的choices=[[681348,3],[681347,2]]、award为空。选项跳转页与奖励是不同字段，跳过剧情可以只跳演出，不能跳过奖励资格状态。

当前处理器按Chapter/ChoiceStory查行并记领取，对真实分支、asserts和空奖处理尚未完整闭合；空Page.award不能造钻石，也不能据一页空奖称整族没有奖励。跨日不应重发单次章节奖，跨期版本与旧分支是否共用需取证。[ChoiceStoryTable](../rules/tables/ChoiceStoryTable.md)。

## ACT-FIRECRACKERACT：爆竹使用、公会进度、任务与累充奖

**执行裁定：** [ACT-FIRECRACKERACT 的唯一R1决定](../rules/final-rule-register.md#act-firecrackeract)。本节数值与现代码描述须按该裁定使用。

106202消费真实爆竹并记录个人used，106204据AccAward条件领奖；106201公会信息应由真实公会成员使用汇总，106203任务与106205累充需独立事件源。原Task1为type14301/目标40/奖818302×5；AccAward10101为lib1/cond_val20/奖21002×100。

当前使用与个人累计奖有状态，公会展示未有完整多人聚合；106203/205仍因任务/支付账本缺口拒绝。不能用个人used替代全公会或把消费爆竹算充值。期内累计和每日来源、lib分组、期末剩余爆竹去向待原消费者。[FirecrackerActTable](../rules/tables/FirecrackerActTable.md)。

## ACT-HEROSIGNACT：英雄签到

**执行裁定：** [ACT-HEROSIGNACT 的唯一R1决定](../rules/final-rule-register.md#act-herosignact)。本节数值与现代码描述须按该裁定使用。

110501提交tid_list，当前检查本版Award.day已解锁，批量发award_list、记录sign_bit。原Award101为version1/day1、3831200/1221200/5361200各1；这些是物品tid，不能仅看标题就称每个是完整英雄。

当前按活动start经过日数门禁，实际登录天数、补签、创角晚入和活动结束后领取未完整证明。批量只要一项非法或重复应一起回滚，不能先给前半再报错。[HeroSignActTable](../rules/tables/HeroSignActTable.md)。

## ACT-ENJOYBLESSINGACT：祈福摇签

**执行裁定：** [ACT-ENJOYBLESSINGACT 的唯一R1决定](../rules/final-rule-register.md#act-enjoyblessingact)。本节数值与现代码描述须按该裁定使用。

110701本应按Version的活跃、购买/充值与返利库资格摇签；原Version1为stop_day18/back_item601500/shake_active250；Purchase1有back_limit1/back_item600/gift140002；Recharge1为back100/back_limit10/acc_cnt_new10。这里的600/100/10各自单位和累计算法未完全证明。

**当前只按已摇次数选择Rebate条目并发back_item/back_num，没有实际活跃/购买扣减，total_money/total_vitality回0**。这只是兼容发奖路径，不是原摇签资格/随机返利。停止第18日的起点、充值来源、限额与跨日重置需原消费者和真实账本。[EnjoyBlessingActTable](../rules/tables/EnjoyBlessingActTable.md)。

## ACT-QUESTIONNAIRE：问卷提交

**执行裁定：** [ACT-QUESTIONNAIRE 的唯一R1决定](../rules/final-rule-register.md#act-questionnaire)。本节数值与现代码描述须按该裁定使用。

110901提交questionnaire_tid及答案；当前保存已完成tid与答案条数，再发Questionnaire.award_list。原Act1映射act102035/questionnaire5/survey1203419；Questionnaire1为open_day3/奖101500×500；Const.content_limit3000/input_word_count_limit450。

当前尚未完整验证题目必答、选项/文字长度、open_day与该Act映射，不能把“提交成功”称原问卷资格已齐。答案内容属于玩家数据，应保存必要业务字段；奖励一次性，不因再次修改问卷或跨日再发。[QuestionnaireTable](../rules/tables/QuestionnaireTable.md)。

## ACT-ANNIVERSARYBANQUETACT：周年宴会任务与进度

**执行裁定：** [ACT-ANNIVERSARYBANQUETACT 的唯一R1决定](../rules/final-rule-register.md#act-anniversarybanquetact)。本节数值与现代码描述须按该裁定使用。

118001完成本期真实任务时发Task.award并增加process_add，118002检查已存process达到Process.process_req再领奖。原Task1为version1/type1803/目标1/process_add10/award101500×20；Process1需40、奖5911200×5；Version1连memory_act1002003。

当前118001缺任务进度明确拒绝，118002虽有发奖路径，但新状态process0且没有闭合的任务生产源，不能称可正常攒满宴会。memory_act不是自动继承全部旧进度的证明，跨期回馈/记忆活动与补发需原消费者。[AnniversaryBanquetActTable](../rules/tables/AnniversaryBanquetActTable.md)。

## ACT-MULTILOGIN：既有多日登录奖励

**执行裁定：** [ACT-MULTILOGIN 的唯一R1决定](../rules/final-rule-register.md#act-multilogin)。本节数值与现代码描述须按该裁定使用。

82101由[welfare-service](../../../personal-server/game/welfare-service.mjs)维护，不走上面的SignAct。当前按登录版本/已领取状态校验奖励，自选档须从该档choose_option对应合法候选中选；单次领奖、版本推进和真实有效登录日分别维护。

原MultiLogin101为item101500/count666/choose_option0，Const1有select_offset5/next_version2；182条奖励、26条Const。next_version2不表示每次登录立刻切版；循环、换期、第五日偏移/第七日自选和缺勤规则以消费者为准。原计划没有新待办卡，但全命令索引包含本族。[MultiLoginTable](../rules/tables/MultiLoginTable.md)。

## 日界、领取与多人结算

当前act-reward使用 `act_reward_state(role_id,act_id)`，版本改变重建data；共享claims的period为 `v<version>` 或 `v<version>:d<day>`，day多从活动开始经过24小时计算。它不是统一05:00日界，也未覆盖同id/version再次开启的全新期号，不能用相同键自然继承当原版事实。

单次领取位能防同键重发，仍不能代替合法奖号、原资格和真实进度。上文列出的映射/门禁缺口保持未完成状态；本轮没有修改它们。跨角色投票、邀请、回归、公会爆竹和夏日匹配必须有实际来源，期末应冻结结果并用结算账本发一次奖励，不能借用客户端自报的胜负或名次。

<!-- command-index:start -->

## 完整命令与任务卡索引

来源：[原静态命令目录](../../plans/remaining-gameplay-20261106/inventory.json)。仅取命令号、名称、模块、编码和schema，不继承其旧路由状态。`—`表示目录未绑定schema，不代表请求无参数或该功能未实现。实际分发与编码差异以正文当前处理器说明为准；原定义见[protobuf资产](../../../personal-server/assets/protobuf/)和[接口目录](../../../agent/workflow/interface-catalog/tcp-commands.md)。

### ACT-SIGNACT

[规则段](#act-signact活动签到) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-signact活动签到)。客户端模块：`SignActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 37009 | `req_sign_act_award` | protobuf / `pb_sign_act_req` | protobuf / `pb_sign_act_back` |

### ACT-OPENSERVERSPRINT

[规则段](#act-openserversprint开服冲刺任务全服进度与排名奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-openserversprint开服冲刺任务全服进度与排名奖励)。客户端模块：`OpenServerSprintCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 79101 | `req_sprint_receive_task` | etf / — | protobuf / `pb_sprint_receive_task_back` |
| 79102 | `req_sprint_task_finish_player` | etf / — | protobuf / `pb_sprint_task_finish` |
| 79103 | `req_sprint_server_process_award` | protobuf / `pb_sprint_server_process_req` | protobuf / `pb_sprint_server_process_rsp` |
| 79104 | `req_sprint_receive_rank_task` | protobuf / `pb_sprint_rank_task_receive_req` | protobuf / `pb_sprint_rank_task_receive_rsp` |

### ACT-LOGINREWARDACT

[规则段](#act-loginrewardact登录奖励活动) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-loginrewardact登录奖励活动)。客户端模块：`LoginRewardActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 90301 | `req_login_reward_act_award` | etf / — | protobuf / `pb_login_reward_act_rev_back` |

### ACT-CHRISTMASACT

[规则段](#act-christmasact圣诞装扮奖励心愿与商店) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-christmasact圣诞装扮奖励心愿与商店)。客户端模块：`ChristmasActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 98610 | `req_christmas_act_dress` | protobuf / `pb_christmas_act_dress_req` | protobuf / `pb_res_to_client` |
| 98611 | `req_christmas_act_get_dress_award` | etf / — | protobuf / `pb_res_to_client` |
| 98612 | `req_christmas_act_select_wish` | etf / — | etf-fallback / — |
| 98613 | `req_christmas_shop_award` | etf / — | protobuf / `pb_res_to_client` |

### ACT-STOCKUPACT

[规则段](#act-stockupact囤货阶段与周期奖) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-stockupact囤货阶段与周期奖)。客户端模块：`StockUpActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99401 | `req_stock_up_act_phase_award` | etf / — | protobuf / `pb_res_to_client` |
| 99402 | `req_stock_up_act_cycle_award` | etf / — | protobuf / `pb_stock_up_act_cycle_award_back` |

### ACT-COMACTDRAWAWARD

[规则段](#act-comactdrawaward通用活动领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-comactdrawaward通用活动领奖)。客户端模块：`ComActDrawAwardCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99600 | `req_common_act_draw_award` | protobuf / `pb_act_exit_req` | protobuf / `pb_act_draw_award_back` |

### ACT-SPRINGFESTIVALACT

[规则段](#act-springfestivalact春节装扮与商店奖) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-springfestivalact春节装扮与商店奖)。客户端模块：`SpringFestivalActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99601 | `req_spring_festival_dress` | etf / — | protobuf / `pb_res_to_client` |
| 99602 | `req_spring_festival_get_dress_award` | etf / — | protobuf / `pb_res_to_client` |
| 99603 | `req_spring_festival_shop_award` | etf / — | protobuf / `pb_res_to_client` |

### ACT-FESTIVALSIGNACT

[规则段](#act-festivalsignact节日签到) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-festivalsignact节日签到)。客户端模块：`FestivalSignActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 99801 | `req_festival_sign_award` | protobuf / `pb_festival_sign_award_req` | protobuf / `pb_res_to_client` |

### ACT-COLLECTEXCHANGEACT

[规则段](#act-collectexchangeact收集兑换) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-collectexchangeact收集兑换)。客户端模块：`CollectExchangeActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100001 | `req_collect_exchange_award` | protobuf / `pb_collect_exchange_award_req` | protobuf / `pb_collect_exchange_award_rsp` |

### ACT-FESTIVALMONSTERACT

[规则段](#act-festivalmonsteract节日怪物操作) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-festivalmonsteract节日怪物操作)。客户端模块：`FestivalMonsterActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100101 | `req_festival_monster_op` | etf / — | protobuf / `pb_festival_monster_op_back` |

### ACT-VALENTINEDAYACT

[规则段](#act-valentinedayact情人节领奖与聊天进度) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-valentinedayact情人节领奖与聊天进度)。客户端模块：`ValentineDayActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 100501 | `req_valentine_rev_award` | protobuf / `pb_valentine_day_rev_award_req` | protobuf / `pb_valentine_day_rev_award_rsp` |
| 100502 | `req_valentine_save_chat_progress` | protobuf / `pb_valentine_day_save_chat_progress_req` | etf-fallback / — |

### ACT-PREHEATACT

[规则段](#act-preheatact预热活动与奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-preheatact预热活动与奖励)。客户端模块：`PreheatActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 101001 | `req_preheat` | protobuf / `pb_preheat_req` | protobuf / `pb_res_to_client` |
| 101002 | `req_preheat_award` | protobuf / `pb_preheat_award_req` | protobuf / `pb_res_to_client` |

### ACT-COMMONSIGN

[规则段](#act-commonsign通用签到领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-commonsign通用签到领奖)。客户端模块：`CommonSignCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 101501 | `req_common_sign_award` | protobuf / `pb_common_sign_award_req` | protobuf / `pb_common_sign_award_rev` |

### ACT-VOTEACT

[规则段](#act-voteact盲投普通投票竞猜与全服进度) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-voteact盲投普通投票竞猜与全服进度)。客户端模块：`VoteActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 102901 | `req_vote_act_blind_vote` | protobuf / `pb_vote_act_vote_req` | protobuf / `pb_vote_act_back` |
| 102902 | `req_vote_act_common_vote` | protobuf / `pb_vote_act_vote_req` | protobuf / `pb_vote_act_back` |
| 102903 | `req_vote_act_progress_award` | etf / — | protobuf / `pb_res_to_client` |
| 102904 | `req_vote_act_task_award` | etf / — | protobuf / `pb_res_to_client` |
| 102905 | `req_vote_act_task_guess` | etf / — | etf-fallback / — |
| 102906 | `req_vote_act_server_vote` | etf / — | protobuf / `pb_vote_act_server` |
| 102907 | `req_vote_prize_list_req` | etf / — | protobuf / `pb_vote_prize_back` |

### ACT-QUESTIONACT

[规则段](#act-questionact答题与累计奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-questionact答题与累计奖励)。客户端模块：`QuestionActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103001 | `req_question_act_answer` | protobuf / `pb_question_answer_req` | protobuf / `pb_question_day` |
| 103002 | `req_question_act_reward` | protobuf / `pb_question_reward_req` | protobuf / `pb_question_reward_back` |
| 103003 | `req_question_act_reward_pile` | protobuf / `pb_question_reward_pile_req` | protobuf / `pb_question_reward_pile_back` |

### ACT-SUMMERACT

[规则段](#act-summeract夏日主活动水枪水炮养成阶段任务与结算) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-summeract夏日主活动水枪水炮养成阶段任务与结算)。客户端模块：`SummerActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103701 | `req_summer_preview_reward` | protobuf / `pb_summer_preview_req` | protobuf / `pb_res_to_client` |
| 103702 | `req_summer_wg_up_lv` | protobuf / `pb_summer_wg_up_lv_req` | protobuf / `pb_summer_wg_universal_back` |
| 103703 | `pb_summer_wg_up_stage` | etf / — | protobuf / `pb_summer_wg_universal_back` |
| 103704 | `pb_summer_wb_active` | protobuf / `pb_summer_wb_universal_req` | protobuf / `pb_summer_wg_universal_back` |
| 103705 | `pb_summer_wb_up_strong` | protobuf / `pb_summer_wb_up_strong_req` | protobuf / `pb_summer_wg_universal_back` |
| 103706 | `pb_summer_wb_up_quality` | protobuf / `pb_summer_wb_universal_req` | protobuf / `pb_summer_wg_universal_back` |
| 103707 | `pb_summer_phase_task_award` | etf / — | protobuf / `pb_summer_task_back` |
| 103708 | `pb_summer_phase_progress_award` | etf / — | protobuf / `pb_summer_task_back` |
| 103709 | `req_summer_change_water_skin` | protobuf / `pb_summer_water_skin_change_req` | protobuf / `pb_summer_water_gun_person` |
| 103710 | `req_summer_power` | protobuf / `pb_summer_power_req` | etf-fallback / — |
| 103711 | `req_summer_enter` | etf / — | etf-fallback / — |
| 103712 | `req_summer_standard_award` | etf / — | protobuf / `pb_res_to_client` |
| 103813 | `req_summer_standard_award_show` | etf / — | protobuf / `pb_summer_show_show_standard` |
| 103814 | `req_summer_settle_rewards_preview` | protobuf / `pb_summer_settle_rewards_preview_req` | protobuf / `pb_summer_settle_rewards_preview_rsp` |
| 103815 | `req_summer_settle_rewards` | protobuf / `pb_summer_settle_rewards_req` | protobuf / `pb_summer_settle_rewards_rsp` |

### ACT-SUMMERPVE

[规则段](#act-summerpve夏日pve任务次数阶段与掉落) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-summerpve夏日-pve-任务次数阶段与掉落)。客户端模块：`SummerPveCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103801 | `req_summer_act_task_award` | protobuf / `pb_summer_act_task_award_req` | protobuf / `pb_summer_act_pve_update` |
| 103802 | `req_summer_act_pve_buy_times` | protobuf / `pb_summer_act_pve_buy_times_req` | protobuf / `pb_summer_act_pve_update` |
| 103803 | `req_summer_act_pve_phase_award` | etf / — | protobuf / `pb_summer_act_pve_update` |
| 103804 | `req_summer_act_pve_set_award_drop` | protobuf / `pb_summer_act_pve_set_award_drop` | protobuf / `pb_summer_act_pve_update` |

### ACT-SUMMERMISSION

[规则段](#act-summermission夏日关卡战斗结算与进度) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-summermission夏日关卡战斗结算与进度)。客户端模块：`SummerMissionCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 103901 | `req_summer_mission_fight_settle` | protobuf / `pb_summer_act_mission_fight_req` | protobuf / `pb_summer_act_mission_fight_back` |
| 103902 | `req_summer_mission_progress_award` | etf / — | protobuf / `pb_summer_act_mission_progress_award_back` |

### ACT-SUMMERPVP

[规则段](#act-summerpvp夏日pvp多队竞猜对手与挑战次数) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-summerpvp夏日-pvp多队竞猜对手与挑战次数)。客户端模块：`SummerPvpCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104101 | `req_summer_act_pvp_init_swap` | etf / — | protobuf / `pb_summer_act_pvp_rank_update` |
| 104102 | `req_summer_act_pvp_day_task` | protobuf / `pb_summer_act_pvp_award` | protobuf / `pb_summer_act_pvp_update` |
| 104103 | `req_summer_act_pvp_phase_task` | protobuf / `pb_summer_act_pvp_award` | protobuf / `pb_summer_act_pvp_update` |
| 104104 | `req_summer_act_pvp_guess` | protobuf / `pb_summer_act_pvp_guess_req` | protobuf / `pb_summer_act_pvp_role` |
| 104105 | `req_summer_buy_challenge_times` | etf / — | protobuf / `pb_res_to_client` |
| 104106 | `req_summer_buy_challenge_match_times` | etf / — | protobuf / `pb_res_to_client` |
| 104107 | `req_summer_buy_match_enemy` | etf / — | protobuf / `pb_summer_challenge_person` |
| 104108 | `req_summer_act_pvp_swap_rematch` | etf / — | protobuf / `pb_summer_act_pvp_role` |
| 104109 | `req_summer_act_pvp_swap_buy_match` | protobuf / `pb_summer_act_pvp_swap_buy` | protobuf / `pb_summer_act_pvp_update` |
| 104110 | `req_summer_act_pvp_swap_buy_fight` | protobuf / `pb_summer_act_pvp_swap_buy` | protobuf / `pb_summer_act_pvp_update` |
| 104111 | `req_summer_act_pvp_swap_init_lineup` | protobuf / `pb_summer_act_pvp_swap_init_lineup` | protobuf / `pb_lineup` |
| 104112 | `req_summer_act_pvp_top_history` | etf / — | protobuf / `pb_summer_act_pvp_head_history` |
| 104113 | `req_summer_buy_special_match_enemy` | etf / — | protobuf / `pb_summer_challenge_person` |

### ACT-QIXIACT

[规则段](#act-qixiact七夕折扣选择与日签) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-qixiact七夕折扣选择与日签)。客户端模块：`QiXiActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104401 | `req_qi_xi_discount_select` | protobuf / `pb_qi_xi_recharge_select_req` | protobuf / `pb_qi_xi_recharge_select_info` |
| 104402 | `req_qi_xi_daily_sign` | etf / — | protobuf / `pb_res_to_client` |

### ACT-ANNIVERSARYGAMEACT

[规则段](#act-anniversarygameact周年小游戏领奖) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-anniversarygameact周年小游戏领奖)。客户端模块：`AnniversaryGameActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104403 | `req_anniversary_game_act_award` | protobuf / `pb_anniversary_game_act_award_req` | protobuf / `pb_anniversary_game_act_award_rsp` |

### ACT-FIVEDAYBOSSACT

[规则段](#act-fivedaybossact五日boss任务限时通关与排名) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-fivedaybossact五日-boss-任务限时通关与排名)。客户端模块：`FiveDayBossActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 104601 | `req_five_day_boss_act_task_award` | protobuf / `pb_five_day_boss_act_award_req` | protobuf / `pb_five_day_boss_act_res_update` |
| 104602 | `req_five_day_boss_act_time_pass_award` | protobuf / `pb_five_day_boss_act_award_req` | protobuf / `pb_five_day_boss_act_res_update` |
| 104603 | `req_five_day_boss_act_get_rank` | etf / — | protobuf / `pb_five_day_boss_act_server_data` |

### ACT-ONESREWARD

[规则段](#act-onesreward单次专项奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-onesreward单次专项奖励)。客户端模块：`OnesRewardCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105101 | `req_get_ones_reward` | etf / — | protobuf / `pb_get_ones_reward_rsp` |

### ACT-INVITEACT

[规则段](#act-inviteact邀请绑定与任务) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-inviteact邀请绑定与任务)。客户端模块：`InviteActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105201 | `req_invite_act_bind` | protobuf / `pb_invite_bind_req` | protobuf / `pb_invite_bind_rsp` |
| 105202 | `req_invite_act_task` | protobuf / `pb_invite_task_req` | protobuf / `pb_invite_task_rsp` |

### ACT-INVITEOLDACT

[规则段](#act-inviteoldact老玩家邀请与任务) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-inviteoldact老玩家邀请与任务)。客户端模块：`InviteOldActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105250 | `req_invite_old_act_invited` | etf / — | protobuf / `pb_invite_old_invited_list_rsp` |
| 105251 | `req_invite_old_act_task` | protobuf / `pb_invite_old_task_req` | protobuf / `pb_invite_old_task_rsp` |

### ACT-ROLEBACK

[规则段](#act-roleback回归绑定继承卡账号查询与每日资源) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-roleback回归绑定继承卡账号查询与每日资源)。客户端模块：`RoleBackCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105301 | `req_role_back_bind_award` | etf / — | protobuf / `pb_res_to_client` |
| 105303 | `req_role_back_inheritance_card` | etf / — | protobuf / `pb_permanent_card_active_back` |
| 105305 | `req_role_back_new_bind` | etf / — | protobuf / `pb_rsp_role_back_info_res` |
| 105307 | `req_role_back_get_roles_info` | etf / — | protobuf / `pb_rsp_role_show_infos` |
| 105308 | `req_role_back_get_day_money` | etf / — | protobuf / `pb_res_to_client` |

### ACT-CHOICESTORY

[规则段](#act-choicestory分支剧情奖励) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-choicestory分支剧情奖励)。客户端模块：`ChoiceStoryCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 105601 | `req_choice_story_award` | protobuf / `pb_choice_story_award_req` | protobuf / `pb_choice_story_award_rsp` |

### ACT-FIRECRACKERACT

[规则段](#act-firecrackeract爆竹使用公会进度任务与累充奖) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-firecrackeract爆竹使用公会进度任务与累充奖)。客户端模块：`FirecrackerActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 106201 | `req_firecracker_act_guild_info` | protobuf / `pb_firecracker_act_guild_info_req` | protobuf / `pb_firecracker_act_guild_info_rsp` |
| 106202 | `req_firecracker_act_use` | protobuf / `pb_firecracker_act_use_req` | protobuf / `pb_firecracker_act_use_rsp` |
| 106203 | `req_firecracker_act_task_award` | protobuf / `pb_firecracker_act_task_award_req` | protobuf / `pb_firecracker_act_task_award_rsp` |
| 106204 | `req_firecracker_act_acc_award` | protobuf / `pb_firecracker_act_acc_award_req` | protobuf / `pb_firecracker_act_acc_award_rsp` |
| 106205 | `req_firecracker_act_acc_recharge_award` | protobuf / `pb_firecracker_act_acc_recharge_award_req` | protobuf / `pb_firecracker_act_acc_recharge_award_rsp` |

### ACT-HEROSIGNACT

[规则段](#act-herosignact英雄签到) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-herosignact英雄签到)。客户端模块：`HeroSignActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110501 | `req_hero_sign_act_award` | protobuf / `pb_hero_sign_act_req` | protobuf / `pb_hero_sign_act_rev_back` |

### ACT-ENJOYBLESSINGACT

[规则段](#act-enjoyblessingact祈福摇签) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-enjoyblessingact祈福摇签)。客户端模块：`EnjoyBlessingActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110701 | `req_enjoy_blessing_act_shake` | etf / — | protobuf / `pb_enjoy_blessing_act_shake_back` |

### ACT-QUESTIONNAIRE

[规则段](#act-questionnaire问卷提交) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-questionnaire问卷提交)。客户端模块：`QuestionnaireCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 110901 | `req_questionnaire_finish` | protobuf / `pb_questionnaire_finish_req` | protobuf / `pb_questionnaire_finish_rsp` |

### ACT-ANNIVERSARYBANQUETACT

[规则段](#act-anniversarybanquetact周年宴会任务与进度) · [原任务卡](../../plans/remaining-gameplay-20261106/08-festivals-tasks.md#act-anniversarybanquetact周年宴会任务与进度)。客户端模块：`AnniversaryBanquetActCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 118001 | `req_anniversary_banquet_act_task_award` | protobuf / `pb_anniversary_banquet_act_task_award_req` | protobuf / `pb_anniversary_banquet_act_task_award_rsp` |
| 118002 | `req_anniversary_banquet_act_process_award` | protobuf / `pb_anniversary_banquet_act_process_award_req` | protobuf / `pb_anniversary_banquet_act_process_award_rsp` |

### ACT-MULTILOGIN

[规则段](#act-multilogin既有多日登录奖励) · [既有族目录](../../plans/remaining-gameplay-20261106/inventory.json)。客户端模块：`MultiLoginCmd`。

| type | 命令 | 请求编码 / schema | 响应编码 / schema |
| ---: | --- | --- | --- |
| 82101 | `req_multi_login_award` | protobuf / `pb_multi_login_award_req` | protobuf / `pb_res_to_client` |

