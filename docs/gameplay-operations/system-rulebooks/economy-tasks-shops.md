# 资源、任务、招募与商品详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

**代金券保留定制，其余价格、奖励、限购、抽取、首充/累充与运营条件以原版为准。** 钱包只是付款渠道，后台加钱包余额不属于游戏购买。数值从[ItemTable资源表](../rules/tables/ItemTable.md)、[TaskTable](../rules/tables/TaskTable.md)、[ShopTable](../rules/tables/ShopTable.md)、[RechargeTable](../rules/tables/RechargeTable.md)及其消费者读取；当前代码中的兼容算法单独注明。Lua消费者中的`ResTable`名称以实际ItemTable资产/族对照，不另造同名表页。

<a id="resources"></a>
## 1. 资源tid必须先分派到正确对象

[resources](../../../personal-server/game/resources.mjs)先读`Item[tid].type → Type[type].res_type/obj_class`，再选处理器。tid前缀不能代替该关联；也不能把所有奖励统一加进一张货币余额表。

| 配置类型/对象 | 当前落点 | 奖励真正到账的含义 |
| --- | --- | --- |
| `res_type=1500` | 货币 | 资源余额与`new_num/diff_num`一致 |
| `140000 + ItemBase` | 团长经验 | 执行经验/升级算法，触发原等级对应状态；不是普通背包道具 |
| 主线体力tid | 体力专用处理器 | 同步数量、自然恢复游标及module8；详见[体力规则](onboarding-combat.md) |
| Item缺行但Hero有行 | 英雄对象 | 创建真实拥有对象并进入module10，不只是增加英雄tid计数 |
| `4 + HeroChip` | module6容器group2 | 英雄碎片数量，和合成/升星读取同一份资源 |
| `14 + PetChip` / `21 + ElvesChip` | group8 / group12 | 宠物/精灵碎片，不能与本体奖励混同 |
| 普通`ItemProp/EquipMatProp/ItemBase`等 | group0 | 可被对应使用/消耗接口读到的物品 |
| `ItemBox/ItemSuitBox/ItemTimeBox`等箱子 | group1 | 先持有箱子；打开再按箱子配置产生奖励 |
| Artifact/Pet/Treasure/FantasyEquip/Elves/ElvesBead | 各对象处理器 | 创建本体、uid/槽位和对应登录数据，必要时产生`new_bin` |
| Figure类 | 头像/框/称号/气泡拥有列表 | 能在对应外观选择器使用，不只是背包有一个数字 |

同一笔先合并相同tid的数量，按整数/BigInt核算并检查全部成本，再统一变更。proto中64位数量与存储字符串不得先转JS浮点丢精度；表中单次数值也必须满足安全整数范围。未知tid或缺处理器不能悄悄返回空资源成功。

当前部分奖励消费者允许把**已知Item但尚无处理器**的奖励写入`pending_rewards`，按`role+source_key+item_tid`保留数量与原因，恢复处理器后一次性释放；完全未知资源仍拒绝。待发账本与已到账不是同一状态，不能因为任务已打领取位就说所有奖品已经获得。

<a id="items-boxes"></a>
## 2. 道具、箱子与追回按来源取规则

箱子打开由[item-box-service](../../../personal-server/game/item-box-service.mjs)读取具体箱子、候选、选中项及奖励族。固定奖、自选奖、随机奖、时长箱分别检查；请求tid不能超出原候选。随机权重、保底与次数必须属于这个箱子/奖池，不能从全英雄目录随便抽取。

碎片合成见[英雄规则](heroes-equipment.md)；体力餐、兑换、购买和章节奖励见[mission-extra](../../../personal-server/game/mission-extra-service.mjs)。体力自然恢复、立即购买、定时免费餐是不同来源，不能共用一次领取位或同一重置时间。

挂机、离线收益、资源追回需要同时查“产出率的关卡/等级行、计时起点、最大累计时长、整段取整、领取游标、快速收益次数/成本、免费与付费返还比例”。这些字段的完整消费者尚未在本册获得闭环证据，不能填写一套统一每分钟产量。`ItemAutoProduce`能进入背包也不证明已恢复自动生产计时。继续核对入口是ResTable对应`obj_class`和Mission/Task补偿行的`compensate_group_id`及原领取函数。

<a id="task-statistics"></a>
## 3. 任务的进度从哪里来

任务状态分三层：原配置定义目标；权威业务状态/统计决定进度；领取账本决定是否已经发奖。module90为普通/线性任务，91为每日/主任务/每周，module21为统计，不接受客户端自报已完成。

当前[task-service](../../../personal-server/game/task-service.mjs)与[task-statistics](../../../personal-server/game/task-statistics.mjs)的取数关系：

| TaskType路径 | 计算 | 不得替代为 |
| --- | --- | --- |
| `progress_type=2` | `data`选CountStatistics行；过滤`type=0`且非`custom_login`，定位module21的`index+1`槽；对`pb_count_statics_data.list`里id属于`stat_expand`的`total`求和 | 任意相邻统计槽、历史fixture、客户端传来的count |
| `progress_type=1/progress_fun=155` | module107的Destiny `cur_stage`原值 | UI显示的“第0层”等归一化标签 |
| `progress_fun=66` | `task_param`指定英雄tid的最高真实`star` | 全体英雄总星数 |
| `progress_fun=81` | 同tid英雄的最高`mastery_break` | 专精等级、战力或任意英雄的最高突破 |
| 主线性任务`task_type=1201` | module8的`mission_id` | 正在开战但尚未结算的目标 |

统计累计使用BigInt，拒绝负数、错误payload及超过安全整数范围的结果；不存在的统计payload可为0，找不到配置/模块不能直接当任务完成。每种统计应由原行为事件更新一次，如真正抽取、真正通关或购买，而不是由领奖接口顺手加进度。

### 主线游标已有一处明确语义冲突

当前主线`mission_id`为最后已通关Section。`commonTaskProgress(progress_fun=2)`仍按“下一待打游标”注释执行`journeyKey(row)-1`；`journeyKey=belong_chapter×100+index`。章节统计`passedChapterCount`也以章节最大节点`< cursorKey`判断已通章。此处可能使刚通关节点/章少算，**本册仅登记具体冲突，不把它写成原版规则或本轮已修复**。需要核对`MissionMgr`最后通关语义与`TaskType.progress_fun=2/10/247`三个消费者，包括精英章节自身的游标含义。

<a id="tasks"></a>
## 4. 线性、普通、每日和每周任务

| 原表例行 | 条件/时段 | 奖励与其他字段 |
| --- | --- | --- |
| LinearTask10001 | `type=1/task_type=1201/target_count=30204` | `101500×50` |
| DailyTask1 | 创角业务日范围[1,999999]，`type=1803/target_count=1` | `101500×10`、活跃20、`is_award_role_exp=true` |
| DailyTask2 | 仅第1日，`type=1203/target_count=20` | `101500×10`、活跃20；`assert=234640300002` |
| WeeklyTask1 | `type=4702/target_count=300` | `3002×1` |

线性任务按`type`分组与`sortOrder`推进，记录`receive_tid/snapshot_val`，前驱、达标和领奖分开。普通任务恢复四组，已恢复行没有`award/award_n`列；当前领取可只写`receive_list`，不能据“任务”二字发一份自定奖励。后续版本若出现奖励列，再按实际行解析。

当前[every-task](../../../personal-server/game/every-task-service.mjs)命令：9000每日单领/9006一键，9002主任务单领/9007一键，9008每周单领/9009一键，9003活跃阶段奖。领取键为`role_id+scope+period_key+task_id`：主任务永久，日任务与活跃每日，周任务每周。当前业务日05:00 UTC+8重置，每周一05:00开始新周期；跨日重登根据账本重建，不修改上一周期历史。

当前每日可见集合按创角业务日`day_range`及补偿组偏移计算。`assert`、`dynamic_award`、`is_award_role_exp`、周末额外奖励仍需原函数的完整执行语义；现有领取路径主要发`award`并把`weekend_res_list`返回空，不能用表中存在`is_award_role_exp=true`证明团长经验已经正确发出。

当前单领重复返回310，未完成或不在有效日范围拒绝；一键领取遍历当前可见任务，跳过已领、未达标和不支持取数的项，对合法项同事务发奖并记账。它不是把所有任务强行完成。一键的这种部分跳过语义据当前消费者，原界面/服务是否完全相同仍须运行记录核对。

每日活跃为**已领取日任务**的`vitality`之和，不是存在任务条数或客户端完成勾选数。9003先核阈值与已领阶段，再发配置奖；日任务领取成功同时更新活动活跃统计。资源发放、领取位和统计任何一步失败都应回滚，不能重登出现“已领但资源没到”。

成就、首周、成长之路和活动任务继续使用其自身task_type、day/version/period及前驱，见[TaskActivityTable](../rules/tables/TaskActivityTable.md)和[task-activity-service](../../../personal-server/game/task-activity-service.mjs)。活动累计值、历史最高值、当前持有值应按TaskType函数区分，不能统一写成累计点击次数。

<a id="recruit"></a>
## 5. 招募成本、解锁和抽取顺序

普通英雄招募的配置在[HeroTable](../rules/tables/HeroTable.md)的`Draw/Guaranteed/DrawConst`；[DrawTable](../rules/tables/DrawTable.md)及其他独立抽奖表还需按各自玩法读取，不可因名称相似合池。

原`Draw1`为`cost_item=[2002]/cost_item_count=[1]`，`daily_free_count=0`，`most_draw_count=10`，`can_draw_any_num=false`，`group_weight=101`，`guaranteed=1`，功能门槛1046。它确证每次基础成本与一键10抽配置；任意抽数、免费抽、购买券和直接钻石抽仍分别检查自己的消费者。

`Guaranteed1.guaranteed_num=50/guaranteed_special=1/guaranteed_extra=0/guaranteed_extra_group=0`。这不单独确证“第50抽必出哪名英雄”，还需解析`group_weight`对应组、special消费者、候选与品质池。

`DrawConst`的普通购买价250，货币101500，每日购买上限1200、累计上限8000；魔法购买价800，同货币，每日上限60、累计600。上限属于购买对应对象，不得直接当所有招募lib抽数上限。

应逐抽执行并持久化的链条为：

```text
确定lib/版本与功能 → 校验抽数及成本 → 读取组/权重与合法候选
→ 本抽保底条件 → 心愿/指定候选规则 → 产生本抽结果
→ 原规则决定保底重置或累加 → 发真实对象/重复转换
→ 记抽取统计、成就、活动与记录 → 下一抽
```

十连必须让第1抽的结果影响第2抽的保底，不得先按同一旧保底状态并行抽10次。免费次数、付费次数、日计数、累计计数、品质保底、指定保底和心愿命中次数分别保存；断线不得重掷已提交结果。

当前[recruit-service](../../../personal-server/game/recruit-service.mjs)支持599/600/601/642/643/657/658/662/77901/87617/87618；[recruit-pool-rules](../../../personal-server/game/recruit-pool-rules.mjs)的lib1/2/3/10仍含本地兼容品质矩阵。普通池排除限定英雄、心愿候选走`DrawExchangeHero`目录是当前处理；**不能据此公布原版概率或说池已1:1**。缺口准确落在原Group/GroupWeight范围、special/extra保底分支、每类lib重置条件和重复英雄转换。

当前`drawOne`普通池以品质≥50重置保底；指定池只在实际抽中指定候选时重置，心愿主要在品质50/60选择候选。这是当前算法，仍需原消费者对应；不能把所有池都写成SSR即清零。历史采集中“指定招募冒险者→完成选择”实际触发601并抽出英雄，因此UI完成按钮不能一律记为只保存心愿。心愿选择、移除和执行抽取要以协议与结果分别辨认。

圣器、团长装备、幻武、秘宝、天极及活动抽奖各自有配置、货币和保底。可从[ArtifactDrawActTable](../rules/tables/ArtifactDrawActTable.md)、[FantasyEquipActTable](../rules/tables/FantasyEquipActTable.md)、[TreasureHuntTable](../rules/tables/TreasureHuntTable.md)、[HeroDrawActTable](../rules/tables/HeroDrawActTable.md)继续查，不继承普通50抽规则。

<a id="shop"></a>
## 6. 普通商店的货架、价格和限购

当前[shop-service](../../../personal-server/game/shop-service.mjs)使用1201—1208；表内原名为ShopTable的`Item/Main/Period/AutoRefresh`等，加载到代码后有`ShopItem/ShopMain/ShopPeriod/ShopAutoRefresh`前缀。完整行优先看原表页，避免把代码别名当另一张资产。

```text
shop_id = floor(Item.tid / 10000000)
单次产出 = Item.item × Item.count
本次产出 = 单次产出 × 请求购买次数
```

例`Item3010101002`属于商店301，商品`43002×20`，货币42002，`price=[[1,2000]]`，`purchase_limit=1`。一次购买扣42002×2000、得43002×20；不能把`count=20`当允许买20次，或把货架tid当奖励tid。

价格数组存在多档时，当前`unitPriceFor`选择`volume≤本次请求次数`的最高档，按`所选单价×本次次数`计费；负单价转充值路径。**阶梯是按本次数量还是累计购买序号、是否逐档累加，只据该当前消费者尚不能确证原规则**，需要对应Shop客户端价格函数和跨档实际订单。不能静默把任何负价当免费。

货架持久化为`shop_shelf_state`标记与`shop_cells`行；已初始化但cells为空可以表示真正售罄，不能在重登时自动补回全货架。购买写`shop_purchases`、周期累计`shop_buy_totals`；刷新保存总/免费/付费/特权次数、下次免费和自动刷新时间；周期结束以`shop_settlements`记一次结算。

刷新应按`CellRefresh/CellLib/ManualRefresh/AutoRefresh/Period`选候选、权重、格数、成本、免费恢复和期号。每个shop独立刷新，付费刷新不能顺便清别店限购。**当前shop的`dayKey=floor(epochSeconds/86400)×86400`按UTC日，不能把本册的05:00任务重置时间套成所有商店现状或原事实。** 手动刷新、周商店和活动期末到底在哪个时区清算须各自核函数。

购买时检查商品确在当前货架/版本、shop与cell匹配、数量、累计限购、货币、资源处理器。`request_id`据角色+请求关联已成交记录，同请求参数不符拒绝；实际扣款、发物、计数与货架改变同事务。活动商店另读[ActShopTable](../rules/tables/ActShopTable.md)与[act-shop-service](../../../personal-server/game/act-shop-service.mjs)的actId/version/period，活动关闭后的货币清理和补发不能当普通日刷新。

## 7. 商品价格、支付类型和礼包层级

商品从`Recharge[product_id]`读取`price/pay_type/cost_item/reward_tid/reward_count/can_buy_times/buy_cycle_limit/type`。金额单位是**分**，奖励tid/count平行数组必须等长。

| 原Recharge行 | 原价与限购 | 原基础奖励/后续处理 |
| --- | --- | --- |
| 46003 | `price=900`即¥9；type46；`pay_type=0`；`can_buy_times=1` | `122702×6`、`3002×10`、`101500×120`；Handle40对应DailyDiscountMgr |
| 46004 | `price=300`即¥3；type46；限购1 | 基础奖励数组为空；需核DailyDiscount关联消费者，不可自行补46003的奖励 |

`Handle`用`recharge_type=商品type`匹配，行tid成为`extra_ret.flag`；type46匹配flag40。相同商品的资源奖励与模块状态更新是两段合同：不能只发资源却不写领取/权益，也不能只发flag不发奖。

常规礼包关系为[RegularGiftTable](../rules/tables/RegularGiftTable.md)的`Type → RegularGift[type].groups → Group[group].gifts → Recharge商品`。当前[regular-gift-service](../../../personal-server/game/regular-gift-service.mjs)按该链构建可售列表，并从成功订单重算限购，不从钱包加款流水计数。类型禁用、缺组、重复商品归属、礼包刷新与商品周期冲突不能被忽略。

当前[recharge-rules](../../../personal-server/game/recharge-rules.mjs)对`buy_cycle_limit`的解释：0无限、1每日、2/3每周、4/5/7按期、6终身。期号须由活动权威状态确定，不能让请求任意改period刷新购买次数。

```text
充值业务日编号 = floor((epochSeconds+10800)/86400)
业务日起点 = 日编号×86400-10800
创角/开服第N日 = 当前业务日编号-创建/开启日编号+1（至少1）
```

这对应05:00 UTC+8。周期、创角日、开服日、活动激活日分别使用相应起点；“已过24小时”“成功登录次数”“第几个自然日”不能替代。已关闭活动的附加购买、额外次数及共享SKU须按[每日折扣消费者](../../../personal-server/game/daily-discount-purchase.mjs)和具体活动行判断，不能只看商品表仍存在就允许买。

## 8. 首充、累充、月卡与通行证

[FirstRechargeTable](../rules/tables/FirstRechargeTable.md)当前恢复首充门槛`need_amount=600`即¥6，`rewards=[1,2,3]/days=[1,2,3]`；Award1给英雄3030501，Award2含`101500×888`。领取16001由[first-recharge-service](../../../personal-server/game/first-recharge-service.mjs)读取module19的`total_amount`与创角业务日，按档位/天数寻找已达标未领的下一奖，写module51领取位及`reward_claims(first_recharge,grade,day)`。没有可领项返回311，不提前补后两日。

`roleLoginDayCount`名称虽含login，当前及其原客户端注释指**创角日跨度**，不是只累计成功登录过的日数。首充到账、累计消费达到门槛和第几日可领是三个条件，必须分别检查。

累充98620由[acc-recharge-service](../../../personal-server/game/acc-recharge-service.mjs)按活动开放范围取日充值记录，核档位和活动期后发奖。永久累充、单日最高、连充天数、活动区间累计不是同一字段。已领位、当前期的金额与待发资源均需重登可重建；历史修复函数的存在不等于当前每个活动金额都已与原服核验。

月卡、永久卡、基金、通行证购买需创建对应权益和到期/等级/进度状态；购买立即奖励与每日/阶段奖励分别记唯一键。续期从当前未到期尾端还是本次购买时刻起算、补领窗口、升级版差额、免费/付费双轨和赛季结束，须查各自表与消费者，不能套用首充三日逻辑。完整商品行见[RechargeTable](../rules/tables/RechargeTable.md)，模块与服务导航见[全模块目录](../appendices/modules.md)。

## 9. 代金券与钱包的定制口径

| 环节 | 当前定制规则 |
| --- | --- |
| 券面值 | 道具701500，1张=100分=¥1；数量为整数 |
| 发券 | 管理端发行后创建真实游戏邮件，领取后才进入可用券余额 |
| 抵扣 | 不超过商品标价、面值换算或持有数量；原生16004不传券数时按现有入口自动选择可用数 |
| 混合付款 | `券抵扣分+钱包余额付款分=商品price` |
| 钱包加款 | 只增加可付款余额，绝不因此自动发商品或增加游戏充值统计 |
| 已购买 | 成交订单才扣券/余额、发原商品与权益、记录相应购买资格和限购 |

当前[wallet-service](../../../personal-server/game/wallet-service.mjs)在`pay_type=0`商品成交后调用`recordRecharge(product.price)`，即按原标价记`total_amount`、日记录和最大单日记录，券抵扣不把该数字改为钱包净支付额；其他pay_type不走这段累计。此为当前既有定制统计口径，不可把后台加款也算进去，更不能擅改原商品门槛。具体活动是否另有排除条件继续按它自己的消费者核对。

券发行、邮件待领、实际领取、券余额、订单核销、钱包扣款与游戏奖励分别对账。不能仅见后台订单列表就认定券已经领取；不能把`price_cents`、`voucher_amount_cents`、`balance_paid_cents`混成一个充值金额。

## 10. 订单、到账通知与邮件结算

购买当前以`account_id+request_id`唯一。同请求且商品/券数相同返回原订单；同键不同参数拒绝。事务内重新核活动/限购/余额，写订单，扣券及余额，发资源/权益，记录游戏充值和礼包状态，保存可重放的成功通知。已售罄优先报限购307，不能因为买完余额不足又把同商品改报余额不足301而误导客户端。

16004发起、1900成功通知、16003确认分别保存状态。1900丢包应重放已提交通知，16003只确认既有订单，不能再次购买；重登根据订单和业务状态补同步。事务失败全回滚，通知失败保留已成交事实，不要求玩家换request_id重买来补到账。

<a id="mail"></a>
[mail-service](../../../personal-server/game/mail-service.mjs)按`role_id+request_id`去重发信；相同键但内容/奖励不同拒绝。`read/received/deleted/expire_at`分开：读信不发奖，领取在同事务发实际资源并标received/read，代金券邮件另写`voucher_grants.claimed_at`。当前重复单领、过期领取均拒绝；一键跳过已领/过期项，合并合法奖。带未领有效附件的邮件不能删除，过期/已领/无附件可以删除。

活动结算应在自己的事务内调用`enqueueToRoleInTransaction`，用“区服+活动/赛季+期号+档位/角色”稳定键形成结算邮件，提交后再push。服务器重启、同任务补跑和断线重登不能制造第二封等价奖。邮件发出与邮件附件领取分两次事务，各自防重；“已发邮件”不能写成“玩家已拿到附件”。

## 11. 本册未闭合的原规则入口

| 精确缺口 | 继续核对位置 | 在补证前不能宣称 |
| --- | --- | --- |
| 普通任务通关游标少一节点/章 | `commonTaskProgress`的fun2/10/247与MissionMgr游标语义 | 已修复所有任务达标时序 |
| 日任务动态经验/周末/断言 | `is_award_role_exp/dynamic_award/assert/weekend_bonus_item`的原函数 | 配置award就是全部日任务奖 |
| 招募权重和special保底 | Draw.group_weight→原Group，Guaranteed.special/extra与各lib消费者 | 兼容矩阵是原概率 |
| 商店跨价格档、重置时区 | Shop价格函数、Auto/Manual/Period消费者 | 所有店同价算法、05:00刷新 |
| 空基础奖励商品的权益 | Recharge46004→type46→Handle40→DailyDiscount | 空奖商品可随意补奖或一定无奖 |
| 挂机/追回计时和比例 | 自动产出对象、任务补偿组及领取函数 | 统一离线收益公式已恢复 |

本轮交付规则与证据索引，不执行订单、补偿、运行库修复或APK验收。

<a id="first-week"></a>
## 12. 首周目标、成长之路与手册各有领奖身份

67004进度奖、67005任务奖读取[FirstWeekGoalTable](../rules/tables/FirstWeekGoalTable.md)与[first-week-goal-service](../../../personal-server/game/first-week-goal-service.mjs)，登录module59015。当前候选活动要求`Activity.func=46`、目标version有表、server_day和开服时间min/max满足，且处于活动窗口，多个候选取version/id最高者。实例键为`activityId:start:end`，不是只用“第几天”或固定version。

任务进度按TaskType权威来源核，任务奖励的积分物品匹配scoreTid后，**只有已成功领取的任务奖**计入可领进度奖的分数，不能把所有已达标但未领的任务先算成已得分。领取键含`role+periodKey+kind+itemId`，进度奖与任务奖不能共用一个无类型tid。空请求当前代表一键取全部可领项；重复tid拒绝，不通过请求列表重复累加积分。活动版本、领奖位、资源和积分投影都须重登一致。

<a id="growth-road"></a>
69001/69002读取[GrowthRoadTable](../rules/tables/GrowthRoadTable.md)与[growth-road-service](../../../personal-server/game/growth-road-service.mjs)，module53696。当前按`Activity.func=17`及关联活动/版本核窗口，分别保存`road_version/progress_value/rev_overdue`与`role+version+kind+itemId`领取行。TaskType1102—1110可读统计；1111—1113依赖progress_fun203/82等尚缺生产者，必须明确不可领，不能用角色等级或任意统计补足。`rev_overdue`是独立过期领取资格，不因窗口结束就默认发最高奖。

<a id="function-manual"></a>
82301读取[FunctionManualTable](../rules/tables/FunctionManualTable.md)和[function-manual-service](../../../personal-server/game/function-manual-service.mjs)，module106。当前支持progress_type2统计、fun2主线journeyKey、fun10已通章，其他函数拒绝。它的fun2**没有commonTask的减1**；但fun10仍以章最大节点`<游标`判完成，与“mission_id保存最后已通关”存在同类末节点时序疑问，且弃用Section是否排除需核。领取按`role+manualTid`唯一，`got_award`按原tid置位；手册红点不代替领取记录。

<a id="rank-achieve"></a>
43101读取[RankAchieveTable](../rules/tables/RankAchieveTable.md)及[rank-achieve-service](../../../personal-server/game/rank-achieve-service.mjs)，module170。当前真实资格仅覆盖event_type6爬塔层数及17/53目标英雄持有；英雄目标通过`event_param_convert→Hero.nick_name`解析，不是直接把该数字当heroTid。比较规则1/2/3分别≥/≤/等于，其他规则只按当前消费者布尔处理。`eventType.unit≠0`的公会/其他单位资格没有闭合，不能按个人达标代领。完成记录与领奖记录独立，8601为完成push；领取按`role+tid`唯一，模块按`floor(tid/1000)`分组、`tid%1000`置位。

<a id="task-activity"></a>
105701完成、105702取数据由[task-activity-service](../../../personal-server/game/task-activity-service.mjs)读取[TaskActivityTable](../rules/tables/TaskActivityTable.md)。`ActFrame.Act.type=1003`的活动行提供version/窗口，Lib提供任务；105701的`activity_id/task_id_list`逐项核本期配置、未领取和真实目标，再一次发奖与写完成表。重复tid、空列表、版本漂移、已结束活动不能借批量请求绕过。

普通统计任务读module21；type100701的progress_fun460是**同服所有角色的活跃统计之和**。105702无参数，返回server_vitality，不按本角色或活动id随意隔离该全服值。module92的活动条目用ETF包装`pb_task_activity_role_info`恢复version/finish_task_list；新活动的actId/version不能沿用上一期完成列表。

<a id="peripheral-tasks"></a>
## 13. 其余任务族的原状态与确切缺口

以下协议中的记录有不同作用，不能全部套每日任务的日期键。当前本册未定位相应族的完整权威消费者；只恢复schema或命令索引不代表可以领奖。

| 家族/命令 | 已知原数据与对应边界 | 要补接的精确规则 |
| --- | --- | --- |
| <a id="growth-target"></a>成长目标69006/69007 | 原表Task666/Const3/Version3/Phase111；func18实例18001/18002/18003映射version1/2/3；每version 37 phase、每phase 6 task；请求为ETF包装PB，三个领取列表独立 | 服务端已实现版本/阶段/任务、原奖励、事务领取、module92登录和SQLite重开。69007仅对已证真实生产者开放；81个period=1任务及缺生产者的phase仍在状态变化前err5。默认生产者下没有完整可领phase，69006不得以注入生产者或总分代替 |
| <a id="task-award"></a>任务活动69101/69102 | 原表Version1/Task263/Progress6/Tag4；Activity19001、func19、server_day33；`pb_task_award`按version分progress_value/progress_award/task_award/rev_overdue；请求为单值ETF | 263个任务均映射module21真实统计，六档阈值600–3600；任务奖独立位图，领取时按R1推定累计growth_value；module92登录、重复请求和SQLite重开已闭合。六档逾期奖原值为0，不开放逾期补奖；已落库历史仍展示 |
| <a id="open-server-box"></a>开服宝箱69301/69302 | 原`OpenServerBoxTable`有4个版本、每版30个日箱和5个进度行；`join_day/rev_days/rev_progress/version/recharge_flag`分别保存加入日、领取游标、进度位、版本和真实付费状态。功能门槛为通关30203，当前数据门槛实例为60205；每日资格按激活业务日计算 | 服务端已实现版本/SQL门槛/候选日/进度核验，69301发原日奖并推进游标，69302发原进度奖；`recharge_flag`只由真实630070付费订单产生，后台余额不计费。ETF/PB、SQLite事务、登录投影、重开及真实临时TCP已测；原服成功函数、真实APK和生产TCP仍待验收 |
| <a id="task-group"></a>任务组84901/84902 | TaskTable有`Group 6`（1001–1006）、`GroupTask 20`、`GroupFunc 0`；单任务奖与组奖分开请求。组奖行已恢复为`201500×1`，`Type 1202`的`progress_fun=10`指向已通过章节，`Type 8601`另配`progress_type=2,data=42`；`CommonTask`四行只是分片引用 | 84901/84902仍失败关闭：`GroupFunc`为空，`func_id/func_open`、组间前驱/可见性、独立领取位和type 1202/8601的本服权威进度生产者无法定义；不能以全任务列表或单项奖存在就开放组奖。数字登录槽未取得。2026-11-15 E组复核与真实临时TCP拒绝路径通过 |
| <a id="career-life"></a>生涯剧情85804 | `pb_career_life`分别存boss_bin/story_bin/pass_award、refresh_time、fight_boss/fight_count；原表StoryChapter18、Story99、BossConst1、Boss0，18章的`res/res_count`均为0 | 服务端按本章全部Story.open_mission和权威mission游标开放，使用`Section.index`（含discard要求），成功后只置`story_bin`章位并写模块153。未知/未开放/重复/损坏状态在写入前err5，编码失败回滚；专项、登录、重开与临时TCP通过 |
| <a id="linear-level"></a>线性关卡93501 | `pb_linear_level_box_award_req(type,indexes)`与战斗type/level分开；回包更新`pb_linear_level`。原`LinearLevelTable`给出每个type的累计通过门槛、宝箱index和奖励 | 服务端拒绝空/重复/未配置index，在真实`pass_fight`门槛后一次发奖并写入位图；登录使用模块535。ETF/PB、精确门槛、重复、编码失败、SQLite重开和真实临时TCP已测；不能把indexes当关卡tid，也不能与9010线性任务混用 |
| <a id="period-task"></a>周期任务101301—101303 | PB含`version/task_list/stage_award_state/score_award_state`；单任务项含task_id/refresh_sec，`RefreshType`3行分别映射每日、周期、永久刷新；功能模块545。2026-11-15从原bundle和第二份独立导出双重确认`Task=0, Version=0, Score=0, Stage=0` | schema已能说明每日任务须当日refresh_sec、周期/永久任务有记录即已领，但配置中没有任务类型/次数/参数/前驱、阶段`task_range`与奖、积分阈值/奖或`Version.score_item`；登录slot未闭合。三条继续在解析和状态访问前err5 |

<a id="hook"></a>
## 14. 挂机、资源补全、回退与神秘商店

78201—78205的挂机数据已明确不是整数背包余额。`pb_hook.cache_list`的num为float，保存小数缓存；`last_reap_time/last_gather_time/old_stage/rand_reap_time`分别记录产出/领取/旧关卡/随机产出，快速挂机次数另有`pb_fast_hook.fast_count`。预览/收取请求含type_list/msg_bin，快速请求含type/count或item_id/times/msg_bin；msg_bin须按挂机type的原自定义schema解释，不能丢掉后统一按主线收益计算。

2026-11-15 C组复核已冻结Hook表六族、同版PB/ETF外层、12个type→erl模块映射、produce-id常量和3063条`RandomAward`外部码；原`HookTable` bundle的SHA256以`363929DC…B3F8F9F9A59E44120B29`为准，旧记录少一个`F9`。五条仍失败关闭，因为逐type产率/关卡/上限、小数余量与取整、领取游标、随机时间、快速次数/成本及`msg_bin`解释没有权威服务端消费者。

待补链为原挂机type→产率/关卡行→累计上限→小数累积与发整取整→领取游标→随机产出时间→快速次数/成本。预览不前移领取游标；正常领取保留小数余量；道具快速生产先核该道具允许的type和times。原表/函数尚未闭合时，不填固定每分钟收益，也不能按客户端传入award发奖。

<a id="res-complete"></a>
288资源补全奖需要恢复“原补全类型/资格→应补资源清单→已领位/来源键”的消费者。2026-11-15 E组已恢复唯一`Award`行及平行数组`award=[101500,201500,101800]`、`award_n=[200,10000,500]`，但`CanAward()`只读客户端下载完成标志，请求不带章节/天数/大小等可服务端复核的依据，无法构造权威领取键；`Open`三行只控制自动下载时机。资源不足提示、资源预览与真正补发不同；不能把当前余额与模板余额的差额直接赠送。288继续失败关闭。

<a id="res-rollback"></a>
88401预览、88402执行共用`pb_res_rollback_req(rollback_type,rollback_res_id)`。原预览只返回res_list；执行还回to_client更新被回退系统。2026-11-15 E组已恢复8个`rollback_type`、统一成本货币101500及成本500/100×7、最低6星回退到5星，并确认`refresh_func`只是执行后的客户端刷新钩子。仍缺服务端返还公式、八类对象各自的重置范围/投资历史、返还消费者、`to_client`结构、穿戴/锁定/引用保护及预览后指纹复核。`rollback_res_id`可能是独立对象id，不能统一当item tid；88401/88402继续失败关闭。

<a id="mystery-shop"></a>
91501自动刷新、91502手动刷新、91503购买的`pb_mystery_shop`保存自动/手动时间、manual_refresh_count、discount_items、all_times_data和buy_times。每格是`cell_id/discount_item_tid/discount_price_index/is_bought`，随机次数又按times_type/tid/stage/times区分。

91503的窄成功链已接入：[mystery-shop-service.mjs](../../../personal-server/game/mystery-shop-service.mjs)只接受ETF单个`cell_id`，从模块162的权威`discount_items`取已持久化商品，以`ItemLib.discount_price[DiscountLib.discount_idx] × DiscountLib.discount / 100`计算`ItemLib.cost_item`成本，并在单一SQLite事务内扣款、发`item/count`、置本cell `is_bought`、增加`buy_times`、写request幂等记录和编码`pb_res_to_client`。同request/cell重复请求不再次扣款；新请求不能重复购买原cell。只有`Cell.pre_condition`和`ItemLib.pre_condition`都未配置、商品/折扣家族一致且折扣价恰为整数时才成功。当前3个Cell和116个ItemLib带未恢复前置条件，这些请求以及非整数折扣价均在扣款前返回err5，不猜资格或圆整。

91501自动刷新、91502手动刷新仍失败关闭：2026-11-15 D组已复核5档手动价格`100/100/120/120/150`、货币101500、日限5、五类折扣权重及固定四段`manual_refresh_cw=[[2,w],[4,w],[5,w],[20,w]]`；`discount_idx`存在重复值，不能当唯一键。仍缺每格候选池与产出条数、自动权重抽取阶段、`all_times_data`/`customize_auto_refresh_times`推进、日界/CD及`next_auto_refresh_time`计算。价格阶梯和日限恢复不等于刷新算法恢复；不能拿普通Shop固定商品替代，也不能凭重进页面或重登洗掉`is_bought`；自动/手动刷新继续err5。

<a id="mission-rewards"></a>
## 15. 主线补给、Guide和统计查询的跨册边界

503扫荡按[体力与扫荡](onboarding-combat.md#journey-energy)核已通关、体力、Sweep固定奖和数量；504用MealAward窗口及`role+day+mealTid`领取键，505兑换和510购买分别记日次数/成本，不能共用一个“买体力次数”。[mission-extra-service](../../../personal-server/game/mission-extra-service.mjs)当前采用进程本地日期/小时和本地午夜，**并非本册充值/日任务的05:00 UTC+8函数**；原各系统时间口径要分别核。

506内箱、509一键章节、511章通关、512BOSS奖必须各查所属章节/need_pass/原奖励，使用不同claim_type。普通节点已通关不自动证明该章全部有效节点/BOSS已过；508剧情推进还要检查合法前驱。BOSS奖励依`mission_boss_clear`真实证据，不以看过Boss形象或客户端说已打败为资格。

<a id="guide-awards"></a>
8000检查点、8001奖励、8002网络检查的完整Process/key/前驱/位图时序见[Guide规则](onboarding-combat.md#guide-flow)。领取必须先按Award发原物品，再保存位与账本；不能因上次有网络错误就提前发下一名赠角，不能把网络检测当领奖重试入口。

<a id="statistics-query"></a>
77901为既有统计查询，取值规则见[统计维度与TaskType](#task-statistics)。查询只投影已提交统计，不能为让任务可领而创建一次行为事件；原CountStatistics.index/custom_login/type/stat_expand决定模块槽和聚合维度，不能把module21所有数值相加后回给任意任务。


## 系统任务与命令定位

本表按[全模块规则索引](../rules/module-rule-index.json)分配；任务ID用于追踪，命令type逐项保留。每条链接定位本册的具体规则节或表行，既包括已证规则，也包括明确列出的实现差异和原证据缺口。列出命令不表示该分支已通过APK验收。

| 任务ID | 系统 | 命令type | 具体规则节 |
| --- | --- | --- | --- |
| <a id="item-item"></a>[`ITEM-ITEM`](../rules/final-rule-register.md#item-item) | 重复箱、手动兑换、碎片合成与抽奖箱分支 | `151`、`152`、`153`、`154`、`155`、`156`、`157`、`158`、`159` | [重复箱、手动兑换、碎片合成与抽奖箱分支](#items-boxes) |
| <a id="item-rescomplete"></a>[`ITEM-RESCOMPLETE`](../rules/final-rule-register.md#item-rescomplete) | 资源补全领奖 | `288` | [资源补全领奖](#res-complete) |
| <a id="item-mission"></a>[`ITEM-MISSION`](../rules/final-rule-register.md#item-mission) | 主线体力、补给、章节一键与 BOSS 奖励 | `503`、`504`、`505`、`506`、`508`、`509`、`510`、`511`、`512` | [主线体力、补给、章节一键与 BOSS 奖励](#mission-rewards) |
| <a id="item-shop"></a>[`ITEM-SHOP`](../rules/final-rule-register.md#item-shop) | 普通商店、快速购买、刷新、结算与历史商品 | `1201`、`1202`、`1203`、`1204`、`1205`、`1206`、`1207`、`1208` | [普通商店、快速购买、刷新、结算与历史商品](#shop) |
| <a id="item-mail"></a>[`ITEM-MAIL`](../rules/final-rule-register.md#item-mail) | 既有邮件读取、领取与删除 | `3000`、`3001`、`3002`、`3003`、`3004`、`3005`、`3006` | [既有邮件读取、领取与删除](#mail) |
| <a id="item-guide"></a>[`ITEM-GUIDE`](../rules/final-rule-register.md#item-guide) | 引导领奖与网络检查 | `8000`、`8001`、`8002` | [引导领奖与网络检查](#guide-awards) |
| <a id="item-everytask"></a>[`ITEM-EVERYTASK`](../rules/final-rule-register.md#item-everytask) | 每日、每周、主线任务及一键领奖 | `9000`、`9002`、`9003`、`9006`、`9007`、`9008`、`9009` | [每日、每周、主线任务及一键领奖](#tasks) |
| <a id="item-commontask"></a>[`ITEM-COMMONTASK`](../rules/final-rule-register.md#item-commontask) | 通用任务与线性任务剩余进度函数 | `9005`、`9010` | [通用任务与线性任务剩余进度函数](#tasks) |
| <a id="item-rankachieve"></a>[`ITEM-RANKACHIEVE`](../rules/final-rule-register.md#item-rankachieve) | 排名成就奖励 | `43101` | [排名成就奖励](#rank-achieve) |
| <a id="item-firstweekgoal"></a>[`ITEM-FIRSTWEEKGOAL`](../rules/final-rule-register.md#item-firstweekgoal) | 首周目标与任务奖励 | `67004`、`67005` | [首周目标与任务奖励](#first-week) |
| <a id="item-growthroad"></a>[`ITEM-GROWTHROAD`](../rules/final-rule-register.md#item-growthroad) | 成长之路 | `69001`、`69002` | [成长之路](#growth-road) |
| <a id="item-growthtarget"></a>[`ITEM-GROWTHTARGET`](../rules/final-rule-register.md#item-growthtarget) | 成长目标阶段与任务 | `69006`、`69007` | [成长目标阶段与任务](#growth-target) |
| <a id="item-taskaward"></a>[`ITEM-TASKAWARD`](../rules/final-rule-register.md#item-taskaward) | 任务活动进度与任务奖 | `69101`、`69102` | [任务活动进度与任务奖](#task-award) |
| <a id="item-openserverbox"></a>[`ITEM-OPENSERVERBOX`](../rules/final-rule-register.md#item-openserverbox) | 开服宝箱与进度 | `69301`、`69302` | [开服宝箱与进度](#open-server-box) |
| <a id="item-countstatistics"></a>[`ITEM-COUNTSTATISTICS`](../rules/final-rule-register.md#item-countstatistics) | 既有统计数据查询 | `77901` | [既有统计数据查询](#statistics-query) |
| <a id="item-hook"></a>[`ITEM-HOOK`](../rules/final-rule-register.md#item-hook) | 挂机收益、快速收取与产物 | `78201`、`78202`、`78203`、`78204`、`78205` | [挂机收益、快速收取与产物](#hook) |
| <a id="item-functionmanual"></a>[`ITEM-FUNCTIONMANUAL`](../rules/final-rule-register.md#item-functionmanual) | 功能手册奖励 | `82301` | [功能手册奖励](#function-manual) |
| <a id="item-taskgroup"></a>[`ITEM-TASKGROUP`](../rules/final-rule-register.md#item-taskgroup) | 任务组任务与阶段领奖 | `84901`、`84902` | [任务组任务与阶段领奖](#task-group) |
| <a id="item-careerlife"></a>[`ITEM-CAREERLIFE`](../rules/final-rule-register.md#item-careerlife) | 生涯剧情奖励 | `85804` | [生涯剧情奖励](#career-life) |
| <a id="item-resrollback"></a>[`ITEM-RESROLLBACK`](../rules/final-rule-register.md#item-resrollback) | 资源回退预览与执行 | `88401`、`88402` | [资源回退预览与执行](#res-rollback) |
| <a id="item-mysteryshop"></a>[`ITEM-MYSTERYSHOP`](../rules/final-rule-register.md#item-mysteryshop) | 神秘商店自动刷新、手动刷新与购买 | `91501`、`91502`、`91503` | [神秘商店自动刷新、手动刷新与购买](#mystery-shop) |
| <a id="item-linearlevel"></a>[`ITEM-LINEARLEVEL`](../rules/final-rule-register.md#item-linearlevel) | 线性等级宝箱 | `93501` | [线性等级宝箱](#linear-level) |
| <a id="item-periodtask"></a>[`ITEM-PERIODTASK`](../rules/final-rule-register.md#item-periodtask) | 周期任务、阶段与积分奖励 | `101301`、`101302`、`101303` | [周期任务、阶段与积分奖励](#period-task) |
| <a id="item-taskactivity"></a>[`ITEM-TASKACTIVITY`](../rules/final-rule-register.md#item-taskactivity) | 任务活动提交与数据 | `105701`、`105702` | [任务活动提交与数据](#task-activity) |
