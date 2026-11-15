# 英雄、编队、装备与养成详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

本册把原表数值、客户端对象关系与当前服务端消费者分开记录。原表的完整行见[HeroTable](../rules/tables/HeroTable.md)、[EquipTable](../rules/tables/EquipTable.md)及[表目录](../rules/tables/README.md)。当前代码能说明现在怎样执行，不能独立证明原服的隐藏校验、随机过程和返还算法。伤害、属性合并与技能门槛见[战斗规则](onboarding-combat.md)。

<a id="lineup"></a>
## 1. 英雄、养成格与编队是三个对象

| 对象 | 权威身份与状态 | 不能混同的对象 |
| --- | --- | --- |
| 英雄 | `uid`为玩家拥有对象，`tid`为Hero行；保存星级、六段进度、品质、专精、形态及装备引用 | 同名NPC、Hero行存在、背包里只有碎片都不等于已获得英雄 |
| 养成格 | `index`、`level`、`break_level`；英雄被分配后继承格子等级/突破 | 星级属于英雄，不能随换人复制给另一英雄 |
| 预设编队 | 预设索引、模式、队号、阵位`loc`、格子`index`、英雄`hero_id` | 格子索引与战场位置不是同一个字段 |
| 模式编队 | `play_type`、版本、队数、附属物、租借/支援引用 | 普通主线的一队不能覆盖多队竞技或特殊玩法 |

英雄登录数据在module10，编队在module9。module9外层为`pb_lineup_login`，内部`pre_lineup`仍需按对应protobuf解码。英雄、格子和编队的改变都必须由重登重新投影得到，不能只把回包中的面板改大。

当前[格子服务](../../../personal-server/game/hero-develop-service.mjs)使用6格。初始1—3格无额外门槛；4—6格涉及`MethodScript`方法`377309400004`、`955132601046`。后两方法的参数含义及完整开放消费者尚未恢复，不能根据“总共有6格”直接让新角色全部使用。协议注释规定英雄离开养成格后回到等级1、突破0；跨预设如何继承须连同`submit`与编队消费者核对。

当前[编队服务](../../../personal-server/game/lineup-service.mjs)执行208玩法编队、209预设编辑、210选择、214新建、215改名、216设置、217删除、218版本。校验自己的英雄uid、已存在的格子、`loc`1—6；同一队不重复阵位、格子或英雄，最多6人。自定义编队当前最多20个，包含主编队索引-1，新编队索引从0开始；名称20字上限是当前实现值，仍需原客户端输入校验函数佐证。

`LineupTable.Type`通过[表读取器](../../../personal-server/config/lineup-tables.mjs)恢复，其`team_count`可到5。只有`same_with_pre=true`且`team_count=1`时才可把通配队号`[0]`按普通预设处理；多队玩法不能在209保存后全部覆盖为同一队。固定剧情队、租借、支援、后备位、阵营限制仍应由各玩法自己的规则检查。

<a id="hero-level"></a>
## 2. 升级与突破

数值来源为`HeroTable.UpLevel/UpStage/DevelopConst`；以下索引公式对应当前[hero-progression](../../../personal-server/game/hero-progression.mjs)。

设格子当前等级为`L`，升级次数为`n`，目标为`T=L+n`：

```text
升级成本 = 合并 Σ UpLevel[i].cost_item，i=L…T-1
团长限制 = role.level × DevelopConst[1].hero_lv_rate
突破限制 = UpStage[当前break_level+1].need_hero_lv（该行存在时）
```

当前请求`n`必须为1—299整数，目标不能超过300、团长限制或下一突破等级。`hero_lv_rate=1`。`UpLevel`恢复299行：1级升2级消耗`101800×110`，2级升3级消耗`101800×150`，所以1级直接升3级合计`101800×260`，与分两次消耗一致。300是当前消费者边界，不是由这两行即可推定所有版本/特殊英雄均为300级。

突破638当前读取`UpStage[当前break_level]`，检查格子等级达到该行`need_hero_lv`，扣该行`cost_item`后令突破+1。当前阶和下一阶是不同索引，文档不代替代码“修正”二者：

| UpStage行 | 原表等级要求 | 原表成本 | 当前消费者 |
| --- | --- | --- | --- |
| 0 | 1 | `201500×3000`、`122802×2` | 当前突破0提交638时读取 |
| 1 | 17 | `201500×6000`、`123002×5`、`123102×5` | 当前突破1提交638时读取；升级时又作为突破0的下一等级上限 |

`UpStage`有50行。最高突破取实际行而非把行数直接加到现存等级。每次消费先合并相同资源tid并检查全部余额，随后统一扣除；格子与引用此格子的英雄同步。当前`cellHeroes`从所有预设收集同格英雄，未编入预设或请求uid不属于该格均拒绝；跨预设继承范围尚须用原客户端换人/换预设记录核对。

<a id="hero-star"></a>
## 3. 六段升星、试炼与高星觉醒

原表关系是`Hero[tid] → quality/chip/max_star/camp → UpStarCost[quality×100+当前star]`。以下为实际英雄行例子：

| 英雄tid | quality | chip | 初始star | max_star | camp |
| --- | --- | --- | --- | --- | --- |
| 2010101 | 30 | 22100104 | 0 | 10 | 2 |
| 2010201 | 30 | 22100204 | 0 | 10 | 2 |
| 1020601 | 40 | 21100404 | 0 | 10 | 1 |
| 2020601 | 40 | 22300204 | 0 | 10 | 2 |

当前普通升星639接收`[hero_uid,段数]`。段数1—6且不能超过本星剩余段；当前star≥5时拒绝，不能用639绕过高星路径。

```text
成本 = Hero.chip × UpStarCost.piece_num × 本次段数
新star = 当前star + floor((当前star_progress+段数)/6)
新star_progress = (当前star_progress+段数) mod 6
```

`UpStarCost`3000、3001的每段碎片为5，3002为10，3003为15，3004为25；4000、4001每段10，4004每段30。故1020601在0星0段时，3段消耗30个`21100404`，6段合计60个并到1星；不能把每段成本误作整星总成本。

`TrialTask`恢复180行，键为`hero_tid×100+quality`，已见quality30/40/50对应`task=[[6702,3/4/5]]`。637提交、641试炼、656批量提交、666一键操作由[格子服务](../../../personal-server/game/hero-develop-service.mjs)分别处理。6702的统计来源、各品质触发阶段、试炼完成位与高星640的相互门槛需要一起核验；“有TrialTask行”不证明当前640已经完整执行原试炼资格。

当前高星640按`hero_tid`找到已拥有英雄，当前星取`max(存档star,Hero.star)`，必须至少5星且低于`Hero.max_star`。扣除本阶`piece_num`碎片及**一种**允许的觉醒石：

```text
允许石头 = UpStarStone[camp×1000+quality].item
扣除数量 = UpStarCost[quality×100+当前star].stone_num
```

如1030允许`[650002,651002,22002]`，1040允许`[649002,651002,22002]`；3005、3006的`piece_num=240/stone_num=2`，3007为240/3，4005为240/2。请求的`pb_res_obj.num=0`可表示protobuf默认值，服务仍按表扣数；显式填写非零且不等于配置数量、混选两种石头、重复同石tid均拒绝。成功星级+1、段进度清0，并在`up_star_high_consume`按结果星级记实际消耗，供后续回退审计。

失败码是当前服务语义：3001未拥有英雄，3029格不存在，3010等级上限，3023团长等级限制，331需突破，3024突破上限，3025等级不足，305满星，3021需高星/试炼路径，3004段数非法，3006碎片不足，301其他材料不足。码表是否完全等同原`MsgErr`须逐接口核对。

<a id="mastery"></a>
## 4. 专精先突破，再升级

`HeroTable.MasteryConst[1].unlock_star=10`。通过`Mastery[hero_tid].mastery_group → MasteryGroup.level_range/break_range → MasteryLevel/MasteryBreak`查行，不能用英雄tid直接索引每级成本。

当前[专精服务](../../../personal-server/game/hero-mastery-service.mjs)的状态为英雄`mastery_level/mastery_break`，659升级、660突破。未突破时等级上限为0，须先突破；现有突破档中`mastery_break≤当前突破`的最后一行提供`mastery_level_limit`。升级到`nextLevel`读取`group.level_range[nextLevel-1]`，扣`row.cost_res`和该英雄`chip×row.chip`。突破取`mastery_break=当前+1`的配置行，扣对应成本。

| group1原表行 | 成本 | 开放上限/属性 |
| --- | --- | --- |
| MasteryBreak1001 | 英雄碎片60、`476002×3` | 等级上限10；HP8640、攻击1440、物防864、魔防864 |
| MasteryBreak1002 | 英雄碎片180、`476002×6` | 等级上限20；其他属性按该行 |
| MasteryLevel1001 | 英雄碎片30、`474002×10` | HP3600 |
| MasteryLevel1002 | 英雄碎片30、`474002×15` | 攻击1080 |

`MasteryConst.cost_res=[[101500,500]]`确实存在，但当前核心升级/突破消费者使用各行`cost_res+chip`，不能自行给每次659/660再加500钻石。需要补证的是该常量在哪个原客户端操作中消费、突破是否另有当前专精等级前置，以及专精属性/技能进入面板和战斗的完整函数链。

<a id="favour"></a>
## 5. 好感、游乐、访问与图鉴

[好感服务](../../../personal-server/game/hero-favor-service.mjs)存module10的slot4；[访问服务](../../../personal-server/game/hero-extra-service.mjs)存slot5；图鉴存slot3，试炼另用slot6。相邻slot不能互相覆盖。

赠礼646的原表计算为：`新增好感=Σ(FavourGift[礼物tid].favour×数量)`。31002每个加5，32002每个加25；先合并礼物数量，计算新好感，检查`FavourBreak`上限后才扣物。`FavourBreak0.need_all_favor_level=1/max_favor_level=5`，break1为5/10；当前消费者以英雄`breakthrough_level`选择上限行，这一映射只据当前实现记录。等级通过`FavourLevel.need_favor`阈值确定，不能把送礼次数直接当等级。

游乐649要求`PlaygroundUnlock[hero_tid].unlock_favour_level`，例如1030101需好感3级。`FavourConst`为角色每日4次、同英雄每日1次，每次消耗`597002×1`。当前服务变更总/单英雄次数但不按`PlaygroundAward`执行奖励；已见该表例行`add_fafour=0/award=[]`，不能编造每次游乐固定增加好感。原表具体哪行被选、是否有其他结果分支仍需对应客户端函数与正常运行结果。

好感奖励653先核所请求的每个`FavourLevel.need_favor`，再发`level_up_award`并置该英雄的`got_level_award`位图。等级1要求0且无奖励；等级2要求100，奖励`101500×10`。当前重复领取310、尚未到达311、未开放/突破上限309、日次数满308。批量请求不得通过重复tid多发奖励，重登按原位图恢复。

访问647的`VisitConst.day_times=3/meet_times=1`。当前访问要求已拥有英雄、`VisitUnlock.unlock_player_lv`、本日未访问该英雄及总次数未满，按`Visit[Hero.quality].chip_num`发该英雄碎片；**Visit按品质索引是当前消费者的解释，原Lua未发现直接读取Visit的路径**。`continue_meet_s`当前保持存档原值，没有恢复权威连续会面计时器。须补`meet_times`、昨日对象、连续访问和刷新消费者，不能把“每日3次”扩写成所有访问规则已还原。

图鉴644/645升级、655领取持有奖励由[hero-handbook](../../../personal-server/game/hero-handbook-service.mjs)处理；当前目标上限取真实持有英雄的品质、星级及变异记录，不能接受请求任意抬高。曾持有但已不在背包的历史记录、各品质越阶与5星转换要按`Handbook/HandbookConstant`消费者核对。当前`HandbookConstant.award_item=0/award_count=0`，不能补一份想象的首次持有奖励。

<a id="reforge"></a>
## 6. 英雄重铸与材料合成

663生成候选、664保存、665取消。当前候选保存在`hero_reforge_pending`，主键`role_id+hero_tid`，包含新属性、随机属性和实际成本，断线重登不能凭空重新抽一次。锁词条成本使用`ReforgeConst.lock_price_ratio`，尺度为**100000**，不是10000。需要对照`ReforgeAttr`池、权重、锁定条目可否改变、免费次数及成本扣在生成还是保存；不能把“确认提交”普遍解释为“预览绝不消耗”，原消费者可能在抽候选时付费。

614碎片合成通过`ResTable.Chip[chip_tid].point_item/need_num`查目标与数量；当前拒绝`custom_tid≠0`和已拥有目标。原版对重复英雄、自选通用碎片、超出合成数量与剩余碎片的语义须由这些字段的消费者补证，不能统一套“每N片合成所有英雄”。

<a id="equip"></a>
## 7. 普通装备：强化、精炼和铭刻分别查表

[EquipTable](../rules/tables/EquipTable.md)恢复Equip80行、Level2000行、Refine320行、Inscription520行；`Const.cell_count=6`与4种`Type`不是同一数量。

| Equip行 | 基础/每级属性 | 上限 | 制造成本与开放表达式 |
| --- | --- | --- | --- |
| 10103 | 攻击3000 / 每级90 | `lv_max=10`、`refine_limit_lv=2`、`inscription_limit=0` | `157002×1500+201500×1200`；方法955132601002，参数[15] |
| 10203 | 攻击4500 / 每级140 | `lv_max=20`、精炼上限6 | `157002×4500+201500×2400`；相同方法，参数[26] |

开放参数[15]/[26]须结合方法955132601002的函数体解释，不能只见数字就断言分别为团长15/26级。`Const`还有`strength_master_per=10`、`strength_red_lv=56`、`strength_rate=2`、`one_key_refine=4`、`refine_master_per=2`、`refine_role_lv=40`、`inject_open=5`、`awaken_open=5`；这些分别是消费者输入，不是都可当角色等级门槛。

当前[equip-service](../../../personal-server/game/equip-service.mjs)的命令：1001强化、1002制造、1003精炼、1004单件一键精炼、1005铭刻、1006穿戴、1007觉醒、1008材料交换、1009背包一键精炼。装备本体`id`与模板`tid`分开；已穿戴集合读module26、背包装备读module16，协议须按该消费者的`pb_role_equip`核对，而非按相邻模块猜归属。

强化从`L`加`n`级，成本为`Σ Level[type×10000+i].cost，i=L…L+n-1`；目标不得超过`Equip.lv_max`。如type1的10001成本`201500×900`，10002成本960，1级升3级合计1860。制造按模板`cost×times`扣物，生成独立id的等级1装备。**当前制造路径没有消费上述unlock_method，强化也未以Const.strength_rate限制团长等级；这不是已确认的原开放规则。**

精炼表与当前简化实现存在明确差异：

| 原表Refine10001 | 原表可确定内容 |
| --- | --- |
| cost | `17002×16` |
| exp_total / exp_once | 200 / 10 |
| lucky_weight | `[[60,1]]` |
| base_attrs / once_attrs | 攻击720 / 攻击36 |

当前1003只扣一行成本后直接`refine+1/refine_exp=0/multi=1`，未执行经验累加、幸运倍率或逐次成长。因此不能把该实现公布为原精炼算法。`developmentCostRows`当前又以`10000+level`读Refine/Inscription，类型选择与原`Type`映射需补相应Lua消费者。铭刻10001成本`18002×8`、基础攻击1800，其等级门槛、经验与幸运语义也须单独核对。

材料交换通过`ResExchange[src/dst].value`计算`floor(源数量×源value/目标value)`，当前已见155002、156002的value均1、`forge_lv=2`；这是当前换算消费者。材料允许方向、制造等级资格、手续费和零产出处理仍要核原函数，不能据value相同就开放任意道具互换。

## 8. 圣器、Relic与幻武

| 家族 | 配置关联与数值边界 | 当前消费者及必须闭合的规则 |
| --- | --- | --- |
| <a id="artifact"></a>Artifact圣器 | [ArtifactTable](../rules/tables/ArtifactTable.md)含18个本体、品质30/40/50/60/70、StarNode55、BreakUp155、Forge72、FlyUp11、Fetter130行；升级另见[ArtifactLevelUp](../rules/tables/ArtifactLevelUp.md)3005行 | [artifact-service](../../../personal-server/game/artifact-service.mjs)；当前品质计算`20+10×floor(tid/100000)`，升级键`quality×10000+level`，UR石339002的数量取StarNode.stone_num；出场顺序、羁绊、技能作用域和等级属性须一起进入战斗 |
| <a id="relic"></a>Relic装具/星火相关 | [RelicTable](../rules/tables/RelicTable.md)：MainAttr/StageAttr/Quality/AttrQuality/Suit、RecastTimes/Lib/AttrType/AttrValue/RecastSkill，以及Sp各族；7位tid当前以`floor(tid/1000000)×10`求品质，碎片813002 | [relic-service](../../../personal-server/game/relic-service.mjs)；保留随机词条候选、保底、套装、槽位及分解/回退记录，不能把Artifact与Relic按英文互译后共用背包 |
| <a id="fantasy-equip"></a>幻武 | [FantasyEquipTable](../rules/tables/FantasyEquipTable.md)的本体/品质/等级/星级/合成/祝福表与对应活动表 | [fantasy-equipment-service](../../../personal-server/game/fantasy-equipment-service.mjs)；穿脱、突破、等级、普通/SP/UR星、祝福候选和合成分开；穿戴或被编队引用的材料不能当普通空闲材料消耗 |
| 团长装备 | [LeaderEquipTable](../rules/tables/LeaderEquipTable.md) | [leader-equip-service](../../../personal-server/game/leader-equip-service.mjs)、[develop-service](../../../personal-server/game/leader-equip-develop-service.mjs)；本体、强化、升星、增幅、重铸候选与返还分账，不能用英雄装备uid替代 |

ArtifactTable根索引的LevelUp解析失败不代表原版无升级数据；独立ArtifactLevelUp分片已恢复。NPC属性的同类情况见[HeroTableNpcAttr](../rules/tables/HeroTableNpcAttr.md)。

## 9. 其他养成的查表与状态边界

下表给出当前可继续逐字段核对的位置，不把文件存在写成玩法已1:1。未列数值的上限应查相应表行/函数，不能统一使用其他系统的等级或每日次数。

| 系统 | 可执行的关联入口 | 原规则需要继续核对的具体对象 |
| --- | --- | --- |
| 羁绊 | [hero-bond表](../../../personal-server/config/hero-bond-tables.mjs)、[服务](../../../personal-server/game/hero-bond-service.mjs) | 所需英雄/形态、曾获得或同时上阵、等级/星级阈值、重复属性合并 |
| 支援/租借 | [support表](../../../personal-server/config/hero-support-tables.mjs)、[rent表](../../../personal-server/config/hero-rent-tables.mjs)、[lease表](../../../personal-server/config/hero-lease-tables.mjs) | 出借人拥有权、期号/截止时间、每模式次数、同英雄互斥、到期对已开战快照的影响 |
| 法阵 | [magic-circle表](../../../personal-server/config/magic-circle-tables.mjs)、[服务](../../../personal-server/game/magic-circle-service.mjs) | 激活与选中状态、等级行成本、批量逐级上限、全局/出战属性和技能归属 |
| 符文/战纹 | [norse-rune表](../../../personal-server/config/norse-rune-tables.mjs)、[norse服务](../../../personal-server/game/norse-rune-service.mjs)、[war-rune服务](../../../personal-server/game/war-rune-service.mjs) | LazyInit词条池、槽位与组合、洗炼候选、锁条成本、重置返还 |
| 魔灵/宠物 | [pet-service](../../../personal-server/game/pet-service.mjs)，module158 | 合成/变异、上阵、星级、装备/符文、灵核背包与灵祠槽位，材料本体是否被引用 |
| 精灵/精灵珠 | [elves-service](../../../personal-server/game/elves-service.mjs)、[bead-service](../../../personal-server/game/elves-bead-service.mjs)，module538/539 | 天赋/皮肤/变异、助战位、珠本体与精灵槽位双向引用、拆分返还及图鉴属性 |
| 秘宝/心愿 | [treasure-service](../../../personal-server/game/treasure-service.mjs)、[wish表](../../../personal-server/config/wish-treasure-tables.mjs)、[wish服务](../../../personal-server/game/wish-treasure-service.mjs) | 抽取阶段、候选、保底、套装、历史选择和跨日，不能把选择当已获得 |
| 博物馆 | [museum-service](../../../personal-server/game/museum-service.mjs) | 收集激活、人气增量、阶段奖与实际资源；页面/组归属按原行 |

## 10. 消费、返还、失败与重登

所有养成都先确认目标拥有权、功能与阶段、配置行、全部成本、对象引用、目标上限，再变更。碎片、觉醒石、装备本体、随机候选和租借对象不是同一种可消费资源；穿戴、锁定、被活动/自定义/玩法编队引用的唯一对象须按原限制保护。

升级/随机抽候选等合法重复操作会再次产生效果，不能一概按“同命令已做过”禁止；重试保护应绑定请求或已提交结果。领取、候选保存、分解、返还等一次性动作要有实体版本或唯一账本，避免断线后把同一对象消费/返还两次。当前各消费者的幂等实现范围应逐接口核验，不以有事务代替请求防重。

回退、分解或重置先按原消耗历史和返还配置形成预览；执行需验证预览对象未变、候选仍有效，再扣对象/发返还并保存记录。原版未恢复的手续费、随机结果、稀有材料比例不能自行设全返或不返。

重登至少核对英雄/格子/编队、背包与穿戴、候选、资源、图鉴/好感/试炼位、技能和属性：若只改变模块展示而战斗仍读取旧值，或反向只改战斗却让客户端显示旧拥有关系，都未形成闭环。本册记录规则与缺口，不宣称本轮已完成相应APK或运行服验收。

<a id="intimacy"></a>
## 11. 新亲密度系统不与旧好感合账

667增加亲密度、670约会、671剧情，原请求分别是`pb_hero_intimacy_add_req(hero_tid,items)`、`pb_hero_intimacy_date_req(hero_tid)`、`pb_hero_intimacy_story_req(hero_tid,page_id)`。旧646好感的等级、赠礼物品、每日游乐次数不能直接用于这套请求。

HeroTable已恢复`FavourIntimacyBase/Level/Item/Const/Cycle/Charm/Content`等族。Base 16行、赠礼物4行、Level 50行、Const 1行、周期2行、Charm 30行。`Item.item_tid=830502/add_intimacy=1`；Level1的`need_intimacy=700/date_times=1/date_award=[[101500,50],[830602,1]]`，普通`award=[]`；Const的`user_date_cycle=2/user_date_times_limit=30/hero_date_cycle=1`。客户端`FavourIntimacyMgr.IsInSameCycle`分别以`FlushTime.IsSameDay`消费cycle1、以`TimeKit.IsSameWeek`消费cycle2，因此英雄约会为日周期、用户约会为周周期；R1统一05:00业务日、周一换周。

667/670/671的服务链已闭合：Base开放时间→拥有英雄→Item合并扣数/阈值升级，或当前Level约会奖，或英雄所属故事的终章页奖→模块10 slot11独立`pb_hero_favour_intimacy`。667按真实物品`add_intimacy`推进，670维护英雄日周期与用户周周期，671读取StoryChapter 16、Page 86、Choice 80、PageShow 202行，只对`endingType>0`且原`award`非空的终章页置`story_got_bin`位。

671按`hero_tid/page_id`校验英雄拥有、Base `hero_story`、页面所属choice、亲密度门槛和未领位；成功后只发该页原奖，不隐式完成约会或其他页面。未知/越权/非终章/重复/损坏状态在支付前err5。等级`award/chip_num`和约会`date_chip_num`由响应交客户端`AwardKit.Parse`消费仍属R1推定；实现为[hero-intimacy-service](../../../personal-server/game/hero-intimacy-service.mjs)，三命令已通过专项、登录、SQLite重开和离线临时TCP。

<a id="destiny"></a>
## 12. 命运节点、推荐阵容与流派

82601读取[DestinyTable](../rules/tables/DestinyTable.md)和[destiny-service](../../../personal-server/game/destiny-service.mjs)。当前module107保存`cur_stage/slot_state`，历史module100只作为迁移来源。节点阶段为`floor(nodeTid/100)`，本阶位为`nodeTid%100`；只对当前阶未点亮节点合并`active_res_list`成本，全部扣款后置位。整阶所有配置节点点亮才升阶、清该阶位；旧阶重试返回权威状态，不再次扣物；未来阶和缺行拒绝。节点是否另有顺序/前置、阶段属性进入战斗的原函数仍须核表消费者，不能仅凭位图认定已接入全部命运效果。

<a id="team-suggest"></a>
88801领奖、88802激活、88803选择由[team-suggest-service](../../../personal-server/game/team-suggest-service.mjs)读取`HeroTable.TeamSuggest/TeamSuggestAward`，使用module10 slot7。TeamSuggest100有6个`[英雄tid,目标星级]`对；Award101为team_type1、收集10%、奖`31002×2`。当前百分比算法为：

```text
分母 = Σ(目标星级+1)
分子 = Σ(min(拥有星级，目标星级)+1)
百分比 = floor(100×分子/分母)
```

**当前未拥有英雄的星级默认0，因而也贡献1；缺席英雄是否应贡献0尚缺原函数验证。** 激活时另核英雄属于推荐阵容、拥有/星级和重复项。选择不领奖；领奖按同team_type未领档位顺序，核collect_percent，再以`team_type+awardTid`唯一。领取位按`awardTid%100`恢复，不能将激活列表当领奖列表。

<a id="team-genre"></a>
91401单领、91402一键、91403查询由[team-genre-service](../../../personal-server/game/team-genre-service.mjs)处理。原`TeamGenreConst.rule_time_split=1757278800`用**服务器开服时间**选择新旧`TeamGenreCycle/Award`，不是每次登录时间；按当前开服日选择`unlock_open_day`已达到的最高周期，并通过`cycle_team`关联`StrategyTeamGenre/TeamGenre`。当前进度是已拥有`suggest_hero`的数量，奖励档tid不得高于数量，按`周期+主流派type+awardTid`唯一。

`pb_team_genre_role.genre_list.team_id`在客户端实际指主流派type，不是strategy team tid，`cycle_id`才是周期；历史以team tid存的领奖键仅兼容读取，不再多发。持有收集不代表已经设置某玩法编队，查询也不能自动领取。

<a id="peripheral-hero"></a>
## 13. 情报、战术、快照和新英雄支线的具体缺口

以下命令的schema或配置片段已存在，但本册尚未找到能闭合所有原条件的权威消费者。表中明确应恢复的字段关系；不能以空对象/固定成功回包作为完成实现。

| 命令族 | 已恢复的状态/协议事实 | 要恢复的字段与函数链 |
| --- | --- | --- |
| <a id="intelli"></a>701/702情报 | `pb_intelli_unlock_req.intelli_id_list`；批处理`finish_list/start_list/is_assistant`；单项保存`tid/type/finish_time/finished/award_type/star`和全局`last_refresh_stamp` | 原情报槽/品质池、刷新时点/成本、派遣英雄条件、开始到完成计时、领取award_type的真实物品；不能把start_list与finish_list都直接视为已完成 |
| <a id="combat-power-award"></a>802/803战力 | 802已按`CombatPowerTable.CPBreak`24档、权威历史最高与BitBlock领奖位实现；803已确认ETF单预设下标，按服务端`assembleHeroAttributes`逐fighter重算`pb_lineup_team.power/max_power`并空ack，结果登录投影到模块9 | 客户端自报power永不采纳；802真实登录领取位宿主和803 APK外层/刷新时机仍待验收；预设战力与其他玩法战斗属性副本不是同一写入点 |
| <a id="tactics"></a>84501/84502战术 | `pb_tactics_master.info_list`按chapter_tid；节点`node_tid/level`，章节含root_node/sub_list。84501已实现父子/跨章/5级上限、道具2401900精确成本；84502只重置请求章节并按真实节点等级汇总已消耗点数 | 属性已投影到1316、普通/精英任务战报、当前战力榜、锦标赛和武馆；技能进入战斗或其他未定位入口仍待逐项验收。原服务端成功函数、真实APK和生产TCP未验收 |
| <a id="lineup-snapshot"></a>87701/87702快照 | key含`role_id/day/power`；快照含lineup/hero_list/hero_attr及reference；负roleId表示机器人 | 采样日界、快照创建/冻结、引用计数与清理、请求可见范围；不能读当前英雄后伪装成历史day阵容 |
| <a id="hero-blazon"></a>88951/88953/88955—88957纹章 | 88955已闭合：技能tid=`源×10+星`，按`Skill.active_item`扣料、`active_chart_value`校验本章节已拥有羁绊的`BondAttr.chart_value`和图鉴和，写模块152 `skill_list`并返回`pb_hero_blazon_update_skill_back`。88957以目标`BondGroup`和下一星`BondAttr`为前驱，组内5个`BondItemNeed.special_item`各扣1，按`campus`更新羁绊星并返回完整`talent_list`。88951/88953/88956仍失败关闭 | 原章节普通/特殊格成本与结果位图、天赋点数预算及技能重置范围/返还仍未闭合；技能进入战斗的最终投影待接。HeroBlazonDrawTable的抽取数值不能代替养成表 |
| <a id="new-hero-exclusive"></a>88963/88964/88967专属体验 | 剧情`version/award_rev_states`；抽取`draw_hero_tid/act_version/rev_hero_tid_list/draw_num/draw_awards/limit_draw_num`；礼包另有limit_info | 选英雄候选与换选限制、活动各version的剧情日奖、阵容领取资格；选择、故事、抽取与礼包的位图不能互相顶替 |
| <a id="hero-legend"></a>89801—89804传奇书 | `pb_hero_legend_book_active`按英雄保存star/level/stage/bless_hero_list；`HeroLegendBookMgr/Util/Cmd`、`HeroLegendTable`、同版`hero_legend_book.net`已恢复 | `89801`在英雄已拥有且书未激活时创建初始5星；升级要求英雄本体至少当前书星，上限10；`89803`按`Hero.chip`扣`BookLevel.need_piece`，星级10时由`BookStage`每5级封顶；`89804`要求10星且当前等级等于阶段行的`need_level`；`89802`的第二参数是1..3槽位，按`BookBlessOpen`的6/8/10星与`Book.bless_hero`目标校验，列表保存英雄tid并禁止重复。上述服务端语义是R1显式推定，原服务端函数未取得；传奇书属性和技能进入全部战斗的最终投影仍待逐入口核验 |
| <a id="leaser-star"></a>101201/101202租借升星/重置 | 请求均含version和tid；回包同时含lease_ret与hero_lease_ret，重置另有reset_data。12表资产含Hero65/Artifact12/Pet9/Elves9、四类星表和Reset60 | 101201按配置行当前星键的下一项扣费；101202按对象真实历史穿越的星表行返还、按当日Reset段价计费、免费/付费次数和对象/阵容副本同步。只作用于租借副本；`unlock_condition`执行语义及原服务端成功函数仍未取得，真实APK/生产TCP未验收 |
| <a id="camp-halo"></a>103101阵营光环 | `pb_camp_halo_role.halos`含`camp_tid/level`，select_camp=0代表未选择 | 原升级成本/上限、阵营/角色门槛、选择或全局光环的效果范围、与其他阵营加成叠加；存level不能代替效果计算 |

<a id="extra-development"></a>
## 14. 当前以固定值或空奖处理的养成分支

[develop-extra-service](../../../personal-server/game/develop-extra-service.mjs)明确尚缺LazyInit数值。下列行为必须保留为实现差异，不可称原版玩法已经完成：

| 命令 | 当前实现 | 原规则缺口与后果 |
| --- | --- | --- |
| <a id="fantasy-handbook"></a>89001幻武图鉴 | 固定扣`434002×1`，指定tid星+1，上限10 | FantasyHandbook原本体/碎片对应、每星消耗、上限与图鉴属性未接；这组固定值不是原证据 |
| <a id="pet-play"></a>90901/90902魔灵探索 | 以1600000000为推定epoch、7天一期，地图从1至7；90902直接前进，90901置本期已领奖但回空奖 | PetPlayTable原周期锚点、地图清理/完成条件、原奖励和CommonMap实例；直接标领奖会消耗资格却没发奖，不能作为可玩验收 |
| <a id="energy-burst"></a>91001能量爆发 | 接受1—100档并标已领，返回空资源变化 | EnergyBurstTable原档位、能量/完成资格和award未恢复；档位存在与达标均未由该固定范围证明 |
| <a id="divine-embryo"></a>102201神胚 | 只保存正整数selectId，返回guaranteed_item=0 | 原候选集、换选限制、保底道具与真实获得链；选择不是获得，当前未校验候选来自原表 |
| <a id="badge"></a>104201徽章 | 扣所请求每个tid×1，全部放page_id1 | BadgeTable原页面/组合、激活成本、拥有条件和属性未恢复；不能把任意道具扣1便当已激活合法徽章 |

这些差异与前文普通装备精炼的经验/幸运缺失分别跟踪；修复时必须保留已有已提交事实并评估合法补偿，不能仅改显示字段后宣称旧损失已处理。

<a id="other-development-details"></a>
## 15. 法阵、租借及其他养成的当前算法边界

| 家族 | 现有消费者能确定的执行细节 | 原规则核对点 |
| --- | --- | --- |
| <a id="magic-circle"></a>法阵90401—90405 | 读取器恢复5个法阵、405级行、40升星/40突破行和32点位行；等级键`id×1000+level`、点位键`point×1000+point_level`。升级读下一等级cost_num×Const.level_up_item，突破需达到`(当前break+1)×break_level_interval`，升星另扣Star.cost | 当前废弃target_level仅接受0/1，长按多级语义未证，不可称批量已实现；点位组合、选中/全局属性、技能进入战斗仍核原消费者 |
| <a id="hero-lease"></a>英雄租借87201—87205 | [HeroLeaseTable](../rules/tables/HeroLeaseTable.md)7行，当前唯一启用func_tid1为GuildEmployMgr，module143 slot0；最多放3/借3、day_refresh=true，Hook17/18/19对应放置index1/2/3。放出、借入、归还、收回与列表使用各自PB | 只向真实同会对象取租借英雄；快照与实际拥有分开；原cache_flush_time、收益上限、日界/过期及已开战引用的语义须核原函数。HeroTable.Rent的627—631不是同一套module143状态 |
| <a id="war-rune"></a>战纹83001—83007 | 当前固定激活消耗151002×1；升阶按stage扣同品质片；洗属性在2—7间选key、value100—500；等级上限100/星上限10，部分成本固定1/2/3片 | 这些是war-rune-service明示的本地推定；WarRuneTable真实槽位/词条池/权重、品质和成本行、属性编号/范围未接，不能公布为原数值 |
| <a id="norse-rune"></a>星魂卷轴90201—90204 | token保存token/level/quality，另有4种type等级、总level/exp和待处置draw_token；当前归一化按真实token/level/quality范围拒绝非法或重复项 | 抽签候选必须先保存，再按原接纳/替换函数处理；总经验、token升级和type升级不是同一成本；原消费者及[norse表读取器](../../../personal-server/config/norse-rune-tables.mjs)逐行核随机权重/经验换算 |
| <a id="pet"></a>魔灵90731—90748 | 当前module158和独立灵核/灵祠状态；固定上限星15/级100/突破5/晋升10/品质5/符文节点30。合成以`petTid+1`碎片×1，升星扣当前star+2片，升级扣level_count片 | 是当前代码算法，并非已证Pet原成长表。应恢复每级成本、同名材料/灵核合成、装备转换/穿戴、能力开启和变异条件；不能据Item相邻tid推导全部宠物的原片数 |
| <a id="elves"></a>精灵93701—93707 | 当前module538，星15/天赋10/图鉴10/突破5，chip=tid+1，变异材料633002；拥有、助战、皮肤与变异分开 | 原Elves升级/星/天赋行及前置、皮肤对本体兼容、助战槽条件/属性作用域仍需恢复；固定上限不能由物品家族证明 |
| <a id="elves-bead"></a>精灵珠93751—93755 | 当前module539，uid对象、max_uid；级上限100/星10、固定BEAD_TID1000122；穿脱需同时维护珠与精灵引用 | 珠品质、每级/星成本、槽位/属性组合和分解返还的原表仍缺；不能把一个基础珠tid当所有品质的统一消耗 |
| <a id="treasure"></a>秘宝93301—93306 | 当前module534，星/套装星上限10、抽取进度固定10阶段；升星按`'10'+tid`拼碎片tid并扣star+1片，部分进度/开箱回空资源 | 原Treasure成本、套装激活/升级、阶段目标与奖励、宝箱产出/时间、自选池和保底未闭合；这些固定算法和空奖不证明原秘宝玩法完成 |
| <a id="museum"></a>博物馆85701/85702 | 当前每件藏品固定加10人气，第n档要求n×100，领取置位但发空奖；批量激活扣请求tid/num | MuseumTable原藏品资格/人气、重复收集价值、档位与实际奖励尚缺，固定10/100属于本地推定 |
| <a id="leader-equip"></a>团长装备98401—98407 | module175保存slots/equip_list/max_uid；98401穿戴与养成服务共用同一本体。当前增幅/重铸部分改变状态却回空资源，STAR_MAX10 | 原LeaderEquip行已可查不代表这些消费者已接表；逐级/星成本、分解实际返还、增幅词条候选、保存/取消及上限须按原函数重接 |

<a id="hero-operations"></a>
HERO命令族还合并了招募、租出/支持、养成、图鉴和重铸：599—602/635/642/643/657/658/662/673的成本/抽取按[招募规则](economy-tasks-shops.md#recruit)；636—641/656/666按升级、突破与星级节；644—655按好感/图鉴与羁绊消费者；663—665按候选事务；627—634/651/652按独立租出/支援表。661变异/形态和672吊坠仍须核`Diff/Pendant/StarPendant`的对象与互斥消费者，不能由一个HERO任务组ID推定所有分支共享一个完成状态。


## 系统任务与命令定位

本表按[全模块规则索引](../rules/module-rule-index.json)分配；任务ID用于追踪，命令type逐项保留。每条链接定位本册的具体规则节或表行，既包括已证规则，也包括明确列出的实现差异和原证据缺口。列出命令不表示该分支已通过APK验收。

| 任务ID | 系统 | 命令type | 具体规则节 |
| --- | --- | --- | --- |
| <a id="hero-lineup"></a>[`HERO-LINEUP`](../rules/final-rule-register.md#hero-lineup) | 预设阵容索引、增删、改名与保存 | `208`、`209`、`210`、`214`、`215`、`216`、`217`、`218` | [预设阵容索引、增删、改名与保存](#lineup) |
| <a id="hero-hero"></a>[`HERO-HERO`](../rules/final-rule-register.md#hero-hero) | 英雄进阶、试炼、重铸、碎片、访问与支援 | `599`、`600`、`601`、`602`、`614`、`627`、`628`、`629`、`630`、`631`、`634`、`635`、`636`、`637`、`638`、`639`、`640`、`641`、`642`、`643`、`644`、`645`、`646`、`647`、`649`、`651`、`652`、`653`、`654`、`655`、`656`、`657`、`658`、`661`、`662`、`663`、`664`、`665`、`666`、`672`、`673` | [英雄进阶、试炼、重铸、碎片、访问与支援](#hero-operations) |
| <a id="hero-mastery"></a>[`HERO-MASTERY`](../rules/final-rule-register.md#hero-mastery) | 精通升级与突破 | `659`、`660` | [精通升级与突破](#mastery) |
| <a id="hero-favourintimacy"></a>[`HERO-FAVOURINTIMACY`](../rules/final-rule-register.md#hero-favourintimacy) | 亲密度、约会与剧情 | `667`、`670`、`671` | [亲密度、约会与剧情](#intimacy) |
| <a id="hero-intelli"></a>[`HERO-INTELLI`](../rules/final-rule-register.md#hero-intelli) | Intelli 解锁与批量处理 | `701`、`702` | [Intelli 解锁与批量处理](#intelli) |
| <a id="hero-combatpower"></a>[`HERO-COMBATPOWER`](../rules/final-rule-register.md#hero-combatpower) | 战力奖励与预设战力更新 | `802`、`803` | [战力奖励与预设战力更新](#combat-power-award) |
| <a id="equip-equip"></a>[`EQUIP-EQUIP`](../rules/final-rule-register.md#equip-equip) | 普通装备觉醒、材料交换与批量精炼 | `1001`、`1002`、`1003`、`1004`、`1005`、`1006`、`1007`、`1008`、`1009` | [普通装备觉醒、材料交换与批量精炼](#equip) |
| <a id="equip-artifact"></a>[`EQUIP-ARTIFACT`](../rules/final-rule-register.md#equip-artifact) | 圣器合成、强化、品质、升级、突破等 | `37060`、`37061`、`37062`、`37068`、`37069`、`37070`、`37071`、`37072`、`37073`、`37074`、`37075` | [圣器合成、强化、品质、升级、突破等](#artifact) |
| <a id="equip-destiny"></a>[`EQUIP-DESTINY`](../rules/final-rule-register.md#equip-destiny) | 命运阶级的既有点亮与升阶 | `82601` | [命运阶级的既有点亮与升阶](#destiny) |
| <a id="equip-warrune"></a>[`EQUIP-WARRUNE`](../rules/final-rule-register.md#equip-warrune) | 战纹激活、升阶、洗属性、重铸与养成 | `83001`、`83002`、`83003`、`83004`、`83005`、`83006`、`83007` | [战纹激活、升阶、洗属性、重铸与养成](#war-rune) |
| <a id="hero-tactics"></a>[`HERO-TACTICS`](../rules/final-rule-register.md#hero-tactics) | 战术升级与重置 | `84501`、`84502` | [战术升级与重置](#tactics) |
| <a id="equip-museum"></a>[`EQUIP-MUSEUM`](../rules/final-rule-register.md#equip-museum) | 博物馆藏品激活与人气奖励 | `85701`、`85702` | [博物馆藏品激活与人气奖励](#museum) |
| <a id="hero-herolease"></a>[`HERO-HEROLEASE`](../rules/final-rule-register.md#hero-herolease) | 英雄租借 | `87201`、`87202`、`87203`、`87204`、`87205` | [英雄租借](#hero-lease) |
| <a id="equip-fantasyequip"></a>[`EQUIP-FANTASYEQUIP`](../rules/final-rule-register.md#equip-fantasyequip) | 幻武的既有穿脱与养成 | `87601`、`87603`、`87604`、`87605`、`87606`、`87607`、`87608`、`87609`、`87610`、`87611`、`87613`、`87614`、`87615`、`87616`、`87617`、`87618` | [幻武的既有穿脱与养成](#fantasy-equip) |
| <a id="hero-lineupsnapshot"></a>[`HERO-LINEUPSNAPSHOT`](../rules/final-rule-register.md#hero-lineupsnapshot) | 阵容/英雄快照 | `87701`、`87702` | [阵容/英雄快照](#lineup-snapshot) |
| <a id="hero-teamsuggest"></a>[`HERO-TEAMSUGGEST`](../rules/final-rule-register.md#hero-teamsuggest) | 推荐阵容激活与选择 | `88801`、`88802`、`88803` | [推荐阵容激活与选择](#team-suggest) |
| <a id="hero-heroblazon"></a>[`HERO-HEROBLAZON`](../rules/final-rule-register.md#hero-heroblazon) | 英雄纹章、天赋、技能与羁绊 | `88951`、`88953`、`88955`、`88956`、`88957` | [英雄纹章、天赋、技能与羁绊](#hero-blazon) |
| <a id="hero-newheroexclusive"></a>[`HERO-NEWHEROEXCLUSIVE`](../rules/final-rule-register.md#hero-newheroexclusive) | 新英雄专属选择、剧情与阵容奖励 | `88963`、`88964`、`88967` | [新英雄专属选择、剧情与阵容奖励](#new-hero-exclusive) |
| <a id="equip-fantasyhandbook"></a>[`EQUIP-FANTASYHANDBOOK`](../rules/final-rule-register.md#equip-fantasyhandbook) | 幻武图鉴升星 | `89001` | [幻武图鉴升星](#fantasy-handbook) |
| <a id="equip-relic"></a>[`EQUIP-RELIC`](../rules/final-rule-register.md#equip-relic) | Relic 装具穿戴、重铸、分解、重置、升阶等 | `89701`、`89702`、`89704`、`89705`、`89706`、`89707`、`89708`、`89709`、`89710`、`89711`、`89712` | [Relic 装具穿戴、重铸、分解、重置、升阶等](#relic) |
| <a id="hero-herolegend"></a>[`HERO-HEROLEGEND`](../rules/final-rule-register.md#hero-herolegend) | 英雄传奇书升星、祝福、升级与升阶 | `89801`、`89802`、`89803`、`89804` | [英雄传奇书升星、祝福、升级与升阶](#hero-legend) |
| <a id="equip-norserune"></a>[`EQUIP-NORSERUNE`](../rules/final-rule-register.md#equip-norserune) | 星魂卷轴的既有抽签与养成 | `90201`、`90202`、`90203`、`90204` | [星魂卷轴的既有抽签与养成](#norse-rune) |
| <a id="equip-magiccircle"></a>[`EQUIP-MAGICCIRCLE`](../rules/final-rule-register.md#equip-magiccircle) | 法阵尚缺的批量升级与属性接入 | `90401`、`90402`、`90403`、`90404`、`90405` | [法阵尚缺的批量升级与属性接入](#magic-circle) |
| <a id="equip-pet"></a>[`EQUIP-PET`](../rules/final-rule-register.md#equip-pet) | 魔灵合成、上阵、升级、升星、装备、符文与变异 | `90731`、`90732`、`90733`、`90734`、`90736`、`90737`、`90738`、`90739`、`90740`、`90741`、`90742`、`90743`、`90744`、`90745`、`90746`、`90747`、`90748` | [魔灵合成、上阵、升级、升星、装备、符文与变异](#pet) |
| <a id="equip-petplay"></a>[`EQUIP-PETPLAY`](../rules/final-rule-register.md#equip-petplay) | 魔灵探索与周期奖励 | `90901`、`90902` | [魔灵探索与周期奖励](#pet-play) |
| <a id="equip-energyburst"></a>[`EQUIP-ENERGYBURST`](../rules/final-rule-register.md#equip-energyburst) | 能量爆发奖励 | `91001` | [能量爆发奖励](#energy-burst) |
| <a id="hero-teamgenre"></a>[`HERO-TEAMGENRE`](../rules/final-rule-register.md#hero-teamgenre) | 流派阵容的既有选择与奖励 | `91401`、`91402`、`91403` | [流派阵容的既有选择与奖励](#team-genre) |
| <a id="equip-treasure"></a>[`EQUIP-TREASURE`](../rules/final-rule-register.md#equip-treasure) | 秘宝升星、抽奖、套装、属性、自选与宝箱 | `93301`、`93302`、`93303`、`93304`、`93305`、`93306` | [秘宝升星、抽奖、套装、属性、自选与宝箱](#treasure) |
| <a id="equip-elves"></a>[`EQUIP-ELVES`](../rules/final-rule-register.md#equip-elves) | 精灵升星、天赋、图鉴、助战、皮肤与变异 | `93701`、`93702`、`93703`、`93704`、`93705`、`93706`、`93707` | [精灵升星、天赋、图鉴、助战、皮肤与变异](#elves) |
| <a id="equip-elvesbead"></a>[`EQUIP-ELVESBEAD`](../rules/final-rule-register.md#equip-elvesbead) | 精灵珠升级、升星、穿脱与分解 | `93751`、`93752`、`93753`、`93754`、`93755` | [精灵珠升级、升星、穿脱与分解](#elves-bead) |
| <a id="equip-leaderequip"></a>[`EQUIP-LEADEREQUIP`](../rules/final-rule-register.md#equip-leaderequip) | 团长装备升级、升星、分解、增幅与重铸 | `98401`、`98402`、`98403`、`98404`、`98405`、`98406`、`98407` | [团长装备升级、升星、分解、增幅与重铸](#leader-equip) |
| <a id="hero-leaserstarup"></a>[`HERO-LEASERSTARUP`](../rules/final-rule-register.md#hero-leaserstarup) | 租借/Leaser 升星与重置 | `101201`、`101202` | [租借/Leaser 升星与重置](#leaser-star) |
| <a id="equip-divineembryo"></a>[`EQUIP-DIVINEEMBRYO`](../rules/final-rule-register.md#equip-divineembryo) | 神胚选择 | `102201` | [神胚选择](#divine-embryo) |
| <a id="hero-camphalo"></a>[`HERO-CAMPHALO`](../rules/final-rule-register.md#hero-camphalo) | 阵营光环升级 | `103101` | [阵营光环升级](#camp-halo) |
| <a id="equip-badge"></a>[`EQUIP-BADGE`](../rules/final-rule-register.md#equip-badge) | 徽章激活 | `104201` | [徽章激活](#badge) |
