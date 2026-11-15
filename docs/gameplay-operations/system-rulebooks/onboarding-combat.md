# 创角、引导、主线与战斗详细规则

<!-- r1-rule-status -->
> 执行基线：2026-11-15 [R1唯一规范](../12-final-rule-baseline.md)。下文原配置和消费者证据保留；“当前”仅描述代码。每任务的[最终裁定](../rules/final-rule-register.md)决定执行，旧缺口描述不再授权自行猜规则，旧实现不自动获发布许可。

本文与[全部表导航](../rules/README.md)配套。来源重点为[HeroTable](../rules/tables/HeroTable.md)、[MissionTable](../rules/tables/MissionTable.md)、[GuideTable](../rules/tables/GuideTable.md)、[JourneyFightTable](../rules/tables/JourneyFightTable.md)，以及下文明确列出的消费者。静态规则、当前实现与未闭合的原服行为分别说明。

## 1. 首次登录与角色生命周期

账号登录先确定区服和账号到角色的唯一关联。已有角色读取原存档，新账号才生成初始角色；重登不能重新赠送创角物品、重置首充、重跑任务奖励或覆盖养成。失败的创建过程不得留下只有关联、没有完整角色的半成品。

当前[new-account-state.mjs](../../../personal-server/game/new-account-state.mjs)的起点是团长等级1、经验0、主线`mission_id=0`，初始英雄`2010101/2010201`为等级1、star0、突破0，体力`100012900=120`。创角奖励读取`FirstCreationAward`，还有默认英雄/外观兼容值。这是当前生成逻辑；完整原始创角档案仍要核`FirstCreationAward`、每个英雄模板字段和所有登录模块，不能把代码默认值直接定义为原版全量初始状态。

| 状态组 | 初始化约束 | 再次登录的来源 |
| --- | --- | --- |
| 角色身份 | uid/账号/服一致，经验为当前级内经验 | 角色权威行，不从登录模板复制等级 |
| 英雄与养成格子 | 只包含合法初始物品产生的英雄，uid独立 | 英雄行、格子行和编队持久化状态 |
| 主线/Guide | 空白通关进度、合法初始检查点和空领奖位 | module8/module16投影及领取账本 |
| 功能 | 原默认项及可计算开放条件 | 功能位与规则调和结果，不能复用成品号开放位 |
| 活动/商品 | 保留必要模块和实例结构，个人进度初始为空 | 当前期个人记录、订单和claim |
| 社交/竞技 | 未入会、无旧好友/段位/对手等原初始状态 | 对应业务行；不能把fixture成员当真实玩家 |

当前新号只明确清理部分模板模块，其他模块是否含历史玩家值仍需逐slot审计；具体清理范围见[新手章节](../02-onboarding-and-journey.md)。创建第二个账号时必须独立验证英雄uid、资源、Guide、活动与钱包隔离，不能仅检查昵称不同。

## 2. 团长经验与等级

原数据`RoleLevel[level].reach_exp`是从该级升到下一级所需经验，`RoleLevelSetting[1].max_level=300`。当前唯一经验入口为[addRoleExp](../../../personal-server/game/role-level.mjs)：

```text
E = 当前级内经验 + 本次经验
while 等级 < 等级上限 and E >= RoleLevel[等级].reach_exp:
    E -= RoleLevel[等级].reach_exp
    等级 += 1
保存等级和剩余E；触发真实跨级事件
```

例如原表1级需5经验、2级需10经验，1级经验4再获得13，结果为3级经验2。不能保存“累计总经验17”再让客户端当作当前级经验。最高级的经验封顶按最高级行处理；经验行缺失必须报告配置缺口，不能跳过等级。

升级奖励、体力补充、功能开放和任务事件分别消费跨级结果；不能因为团长升了两级就把本次战斗首通奖励再发两遍。英雄等级与团长等级是两个字段，英雄等级上限另按`DevelopConst.hero_lv_rate`约束。

<a id="guide-flow"></a>
## 3. 新手Guide的流程、检查点与奖励

Guide表含141个Process、718个Step、16个Award。完整行见[流程与步骤附录](../appendices/guide-processes-and-steps.md)。`Process.tid`是流程，`Step.tid`是操作，`Process.keys`是可以保存的检查点；一个中间key不代表整个流程完成。`normal_steps`和`special_steps`分别保留正常和恢复分段，`next_process`可以多分支。

| 命令/状态 | 具体规则 | 失败或重登 |
| --- | --- | --- |
| 8000保存检查点 | Process存在、key属于该Process；只有末key才`is_over=true` | 非法归属拒绝；旧key请求不能让进度倒退 |
| 8001领奖 | 读取Award原物品与数量，检查该奖励实际前驱 | 不要求先保存本奖励步骤key；失败不消费资格 |
| 8002网络探测 | 依原客户端网络检测契约处理 | 不借此发奖励或推进Guide |
| `pb_guide.award` | 原MSB-first位图，与成功领取账本同步 | 重登仍显示已领，不重复生成英雄 |
| 替代Process | 相同key归属不同Process时分别存状态 | 不因共享key把另一流程直接完成 |

原`GuideAwardStep`先请求8001，成功后`HandleOver`，随后才保存key。把“已保存领奖key”设为本次领奖前提会形成死锁。早期链为`102→104→105→106→107→108→109`，另有102→113、107→114分支，分支条件不能任意删掉。

| 奖励 | 原物品 | 合法前驱 | 对应key |
| --- | --- | --- | --- |
| Award1 | `1020601×1` | 10202已通关 | Process104/113关联Step106004；104的keys为106004、106008 |
| Award2 | `2020601×1` | 20201即2-1已通关 | Process108，keys为110004、110008 |

第一名赠角应在首战后获得、查看和上阵。第二名赠角不能提前作为通过2-1的补偿。Award1/2领取后的位图首字节分别为`0x40/0x60`，它不是ETF包装位图。其他14奖的原物品逐行列于[奖励附录](../appendices/guide-awards.md)；Award3–10/12/13的实际触发链未恢复，Award15中的`100614400`还缺资源处理器，不能吞掉该物品后把整奖记成完成。

重试要求是“英雄/资源、领取位、领取账本一起成功或一起失败”。回包编码或数据库提交失败全部回滚；提交后掉线用重登恢复，不再发第二份。历史坏档只能依据合法前驱和已领证据补缺，不能重建新号或批量清Guide。

<a id="feature-gates"></a>
## 4. 功能开放与Guide触发的区分

功能开放由`FunOpen.target/switch/sys_switch/asserts`、动态参数和可能的`Show`替换共同决定，多断言是AND。523条配置的当前业务映射为ready177/gap346；文档原条件已核220条、仍缺证303条。955132601007已证为`MissionMgr.GetPassedSection()>=30203`，1514等44行不再算原语义未知，当前业务已接入该项。详见[条件及差异附录](../appendices/feature-unlocks.md)；已证不等于已开放，缺证按R1未满足处理。

当前[feature-service](../../../personal-server/game/feature-service.mjs)对7000的已恢复规则重核资格，未恢复的客户端表达式保留确认路径，避免1054等入口等待；7201的`target_tid`是完整功能ID，每项单独通知，不能发分组1冒充功能ID。登录前只有白名单命令；创角前不读取尚不存在角色的功能位。

名人堂Fun1218原条件为**团长等级≥32且开服日≥2**，另外受客户端模块开关161限制。因此31级/第2天、32级/第1天都未满足；32级/第2天才满足这两项数值条件。它仍不等价于“立即弹出某个Guide”：Guide的触发事件和表单入口另外核对。用户1级弹窗的实际入口尚未闭合，已有门槛不能替代现场表单ID、Storage和更新资源的证据。

## 5. 旅途节点与实际敌阵

`mission_id`在当前服务端保存最后已通关节点。有效顺序按Section原章节/index与弃用标记解析，不能按tid加1。`is_discard=true`的10201、10203保留配置但不重新插入当前流程。有效首段为：

```text
10202首战 → Award1 → 上阵 → 10204 → 10205蜜雪儿
→ 10206剧情 → 20201（2-1） → Award2
```

| Section | Fight→Team | 原NPC与位置 | 原表奖励摘录 |
| --- | --- | --- | --- |
| 10202 | 102→102 | 9100500×4，loc2/4/5/6 | 201500×360、101800×200 |
| 10204 | 104→104 | 9100100/9100100/9301600/9100100，loc2/4/5/6 | 201500×360、101800×200 |
| 10205 | 105→105 | 3030500，loc5，关联3030501蜜雪儿 | 25002×2、201500×50000、101800×2000 |
| 10206 | fight=0 | 剧情71，无普通战斗 | 该行`award=[]`，不能补造普通战斗奖 |
| 20201 | 201→201 | 9301600×3、9105000，loc1/2/3/5 | 201500×185、101800×100 |

实际战斗身份链为`Section.fight→Fight.def_team→Team.npc/loc/team_lv→Npc/NpcAttr`。`Section.enemy`是地图展示字段：10205仍展示两只9002600，不能据此替换真实蜜雪儿。请求的错误`fight_tid`不能覆盖Section权威Fight。

`Team.team_lv`用作`HeroTable.NpcAttr`行键；不能把20或12直接当NPC显示等级，更不能取玩家最高等级替代。Fight102还有`atk_team=[91102]`，该Team为9005500/9005600、loc2/5。`Fighter=teamTid×100+loc`使loc2引用9110202，但该行缺失；固定攻方是否覆盖玩家编队缺真实战报，当前保留已拥有的玩家编队，不能宣布固定攻方语义已经还原。

剧情节点通过原508流程推进；“跳过剧情”只跳展示，不能跳过服务端合法前驱。章节宝箱读取`Box.belong_chapter/need_pass/award`，单领和一键领共用领取证据。例如Box1属于第3章、要求通关5个节点，奖25002×1、101500×30、201500×50000；不能把Box tid1误当第一章宝箱。

<a id="journey-energy"></a>
## 6. 体力、购买与扫荡

主线体力tid为`100012900`。`EnergyConst`原行包含`period=360`、`rate=50`、`limit=800`、`max=3000`，这几个字段用途不同。自然恢复依据`EnergyRes.GetNum`：**每360秒恢复1点**，不能除以rate而变成更快恢复。`EnergyMax`按同资源且`level≤团长等级`的最高适用行选自然上限；例如4级行120、9级行140。低于首个适用等级时，当前消费者返回无上限行，不能自行向下外推成已证原规则。

在自然上限以下，设余额N、生产锚点T、当前时刻t、周期p、自然上限M：

```text
新增 = min(M-N, max(0, floor((t-T)/p)))
N += 新增
未满时 T += 新增×p；到自然上限时 T=t
```

例如可恢复空间至少3点、已经过725秒，恢复2点，保留5秒进度。购买、道具补充可能超过自然恢复上限，但还受各自持有/购买上限；不能把自然上限M、`limit`和`max`合并为同一个数字。

`SweepConst[1]`要求第2章开放，单次消耗体力5。当前请求数量上界由`EnergyConst.max / cost_num`计算，3000/5=600；实际还要检查已通关、开放章节、持有体力与合法批次数。UI一次10次不是协议全部上限。固定扫荡奖励读取`Sweep`相应行，额外随机奖读取`extra_rand_lib/extra_rand_rate`，这版常量为0，不能额外添随机掉落。

当前201生成战报，207结算时才扣挑战体力；当前失败也扣。**原版失败/主动退出/断线是否扣、何时扣仍缺对应运行证据**，此处不能把现有实现写成已证原规则。午晚餐则走`MealAward`对应窗口和领取记录，不能用自然恢复补成同一笔。

## 7. NPC属性链与能力增量

当前[fight-team-resolver](../../../personal-server/game/fight-team-resolver.mjs)已恢复基础链：

```text
模板值 = NpcAttr[team_lv].attr_list[attr]
NPC倍率 = NpcAttrRatio[npcTid×10].attr_list[attr] / 10000，缺项为1
上下文倍率 = 对应pair值 / 10000，缺项为1
固定倍率 = {type:attr,value:乘数}.value，缺项为1
基础值 = floor(模板值 × NPC倍率 × 上下文倍率 × 固定倍率)
再合入合法属性能力值 → AttrCalculator.CalcValues
```

蜜雪儿模板NpcAttr20基础HP864、攻击216；2-1模板NpcAttr12基础HP474、攻击119。同关不应因玩家升级或换队改变这些固定模板值。Fighter10505有`is_boss=true`、`view_custom=120`，身份、位置和表现都要保留。

原`HeroAbilityLogic.HeroAttrAbilityValues`逐精确技能tid读`AttrAbility.attr_type/attr_value`；普通属性技能累加，魂/专精属性技能对同项覆盖。原`HeroAttrCollect`遍历合法技能列表收集。蜜雪儿NPC技能中的3303050121含actor属性55=600、54=1200，3303050141含6=1800、5=900；当前NPC基础链尚未接入这些增量。不能把864/216当作原服最终全能力属性。

2-1 NPC列表引用3900400149/150/151，完整四份AttrAbility分片没有这些行；154/155有行也不能挪用。`Npc_Ability.ability`和`Fighter.add_ab`保留精确ID，不通过玩家星级表拼新ID，也不因`relation_hero`相同而加载可玩英雄全部后期被动。原服NPC执行完整技能/属性能力的语义仍需补证。

## 8. 显示属性、actor属性与战斗属性

| 属性 | actor编号 | 战斗编号 | 百分比actor编号 |
| --- | ---: | ---: | ---: |
| HP | 1 | 24 | 5 |
| 攻击 | 2 | 2 | 6 |
| 物理防御 | 24 | 8 | 26 |
| 法术防御 | 25 | 13 | 27 |
| 暴击 | 11 | 29 | 由对应AttrType解释 |
| 暴伤 | 12 | 30 | 由对应AttrType解释 |

映射由`AttrType.fight_attr`决定，不是所有同号都同义。读取百分比时以`value_type=1`和`show_factor`解释定点数；平值不除10000。原`AttrCalculator.CalcValues`对HP/攻击/双防分别执行`floor(平值×(1+对应百分比))`，再移除四个百分比键。例如HP1000、生命百分比5000得到1500，不是1000+5000。

玩家基础成长按`BaseAttrNew[heroTid×100+quality]`选行：`base+grow×(level-1)/10000`。低星取当前一行`StarAddAttr[camp×10000+quality×100+min(star,5)]`，不能累加所有低星行；6星以上另取`HighStarAddAttr[heroTid×100+star]`，再合突破与BattleAttr。当前某品质行缺失时存在邻近品质兼容回退，必须保留`notes`并逐英雄对照，不能把回退当原版公式。

## 9. 战力公式与显示来源

[calcAttrPower](../../../personal-server/game/attribute-service.mjs)恢复的属性战力使用一次最终向上取整：

```text
B = 攻击×0.6 + 物防×0.5 + 法防×0.5 + HP×0.1
战力 = ceil(B × (1 + 各加成项之和) × (1 + POWER_FINAL_BONUS_FACTOR))
```

各属性先经`attrValue`按原类型转为平值/比例。加成项完整展开如下，不能把所有项简化为暴击加成：

| 项 | 原系数/组合 |
| --- | --- |
| 命中/闪避 | `(HIT+DODGE+2×HIT_FINAL+2×DODGE_FINAL)×0.075` |
| 暴击/抗暴 | `(CRIT+RESIST_CRIT+2×CRITICAL_FINAL+2×CRITICAL_DODGE_FINAL)×(1.5+CRITICAL_ADD+CRITICAL_DEFENSE)×0.075` |
| 伤害加成/减免 | `(ATTACK_ADD+REDUCE)×0.2` |
| 四阵营攻防 | 8项之和×0.05 |
| 最终增伤/减伤 | `(DEEPEN_FINAL+REDUCE_FINAL)×0.4` |
| 吸血/反弹 | `SUCK×0.2 + BOUNCE×0.1×(1+BOUNCE_REDUCE)` |
| 忽防与抗忽防 | 各×0.3 |
| 怒气 | `ANGER×0.0001` |
| 异常命中/抗性 | 两项之和×0.1 |
| 降怒命中/抗性 | 两项之和×0.05 |
| 怒气回复 | `ANGER_RESTORE_INCR×0.21` |
| 普攻增减伤/绝招增减伤 | 各组两项之和×0.1 |
| 施疗/受疗 | 各×0.1 |
| 破军/御守 | 两项之和×0.001 |
| 战力加成 | `POWER_BONUS_FACTOR×0.1` |
| 结果伤害增减 | 各×0.6 |

无额外加成、攻击100、物防50、法防60、HP1000时，B=215、战力215。先逐属性取整再逐项加战力与该公式不等价。

战报`atk_power/def_power`、英雄面板、1316和结果页可能读不同消费者。原失败结果页读`CombatPowerCalculator.GetDefTeamPower`，该版本早期`NpcAttr.power=0`，所以即使战报有正数也仍可能显示0。离线显示候选仅在原静态值非正时读取战报，未通过APK验收，也不是原服正数算法的证据。

<a id="battle-report"></a>
## 10. 技能、动作、胜负与战报

一场战斗的规则输入必须包括双方权威阵容、已解锁技能、属性、初始状态、模式和随机种子；结果以模拟轨迹为准，不能按战力比固定输赢。当前玩家技能装配仍有`catalog-passive-unmapped`、277条待调查引用与75条project-fallback；速度职业估算、初始怒气500、部分怒气增长、双防平均和基础伤害通道仍含兼容值，不是原版完整规则。

当前可复核的动作输出链为[simulateBattle](../../../personal-server/game/battle-engine.mjs)→[actionList](../../../personal-server/game/mission-fight-service.mjs)→`pb_generic`。每次伤害必须带实际旧/新HP、旧/新盾，吸血按实际HP伤害计算并受缺失HP限制；治疗、盾、怒气、死亡、复活和追击保持发生顺序。不能只改变最终HP而缺少原回放需要的事件。

| 战报层 | 必需信息 | 不能替代的东西 |
| --- | --- | --- |
| 模式/Fight | 原type_client、fightTid、模式参数 | 不同玩法不能共用一个错误type_client |
| 队伍 | 队伍索引、原阵型/loc、真实出战者与power | 多队不能只保留第一波 |
| Fighter | 战内id、uid、role/role_type、模板tid、初始HP/属性/技能 | NPC外观hero tid不等于玩家uid |
| 动作 | round/action/ability/targets及属性变化 | 成功回包不等于客户端能完整回放 |
| 结果 | 胜负、轮数、末HP、结算标识 | 不能由客户端提交win直接决定 |

普通主线报告类型为1；类型3是另一多队模式，不能用来伪装旅途。当前普通主线多队明确拒绝，完整继承血量/队伍顺序和多场报告尚未实现。

## 11. 开战、结算与中断状态机

```text
合法节点/阵容 → 201生成并保存待结算报告
→ 回放/中断 → 207按已保存报告结算
→ 扣合法成本 + 胜利时推进节点/首通/经验/统计
→ 保存已结算结果 → 在线同步/重登恢复
```

201不能提前重复发首通；207不能信任新传的关卡或胜负。首通唯一来源键包含角色和Section，当前`reward_claims`类型为`mission_first_clear`；宝箱另用`mission_box`，不能互相覆盖。重复207不能二次扣体力、发资源或加团长经验。

必须分别覆盖：201前断线、报告已保存但未收到、回放中退出、207提交前失败、提交成功但回包丢失、服务重启。合法败北保持原已通关节点且不发胜利奖；弱队允许输，不能为“新手可继续”固定必胜。阶段迁移、扣体力、奖励、经验、统计与回包编码都应在事务边界内一致。

本册所述规则资料不代表这些场景已全部通过APK。现有组件/TCP、真实存档及客户端的分别验收状态继续见[问题清单](../09-defects-and-acceptance.md)。

<a id="role-profile"></a>
## 12. 团长资料、形象与等级奖

[RoleTable](../rules/tables/RoleTable.md)中的`ChangeName/Level/FigureHead/FigureFrame/FigureTitle/FigureRank/FigureChatBubble`分别提供改名、等级和外观规则。[role-service](../../../personal-server/game/role-service.mjs)把角色资料存入`roles.profile_json`，附加状态、限时外观及奖励另存业务行；不能只改登录模板里的名字。

| 命令族 | 当前执行规则 | 需要核原消费者的具体边界 |
| --- | --- | --- |
| 1301/1307/1311改名、查重、改名与性别 | 去首尾空白，按Unicode字符计长度，拒绝控制字符，核同名，再按`ChangeName.res/res_count`扣款；名称和性别在同一次提交内保存 | 表未读到时的200钻、1—6字是代码fallback，不能当原表事实；屏蔽词、同服/全服重名范围、首次免费次数须核原改名函数 |
| 1302随机名 | 读取NamePrefix/NameSuffix等可用名称池，缺池拒绝 | 当前以roleId/时间等选下标，不是已证原随机分布 |
| 1303等级奖 | 从当前已达等级对应`Level`行取奖励，领取账本与资源同时提交 | 已达等级不等于已领；不得在每次登录重发，也不得用团长经验奖励代替等级奖 |
| 1304/1305/1308/1315头像、称号、红点、气泡 | 核配置和拥有记录，按稳定拥有位图与限时外观行投影，清红点不授予所有权 | 限时有效期、默认外观例外、称号属性与叠加范围分别核原函数 |
| 1309/1310/1312/1313性别、风格、形象阶级与阶奖 | 性别当前只接受1/2；阶级成本/奖读取FigureRank，阶奖独立防重 | 当前风格只核Hero/FigureHead中存在，尚不足以证明已执行原拥有权/解锁要求 |
| 1314/1316刷新战力/查属性 | 刷新使用实际属性消费者；英雄战力与全预设战力区别见前文 | 1316在gateway处理，不以role-service命令集合中缺失1316推定接口不存在 |
| 104/105/108/110杂项、通关记录、展示清理、推荐等级 | 只更新各自附加状态；105须核真实主线游标 | 展示状态不构成通关、领取或功能开放；108须继续核独立路由，不能只凭命令声明确认执行 |

111检查老玩家资格、112跳过使用`veteranConfig`。当前默认最低10级/7日/空跳过奖是本地配置，不能替代`VeteranConst`及原跳过流程。资格、已跳过、跳过时间和真正奖励应独立持久化；重复跳过不再发奖。1317视频奖励也须核`WatchVideoAward`与真实次数/日界，不能由“客户端看过”直接信任可领奖。

<a id="login-contract"></a>
## 13. 登录、网络检查与玩家数据查询

909103走SDK身份及选服，909101/909102为开发账号/角色辅助入口。认证成功、区服合法、账号归属和角色初始化要在读取个人数据之前闭合；109网络确认不是创建角色、跳过认证或发物品的入口。开发登录不能因原协议保留命令就默认对外开放。

<a id="player-data"></a>
161读取的块必须遵循`PlayerDataType/PlayerDataBlock/PlayerDataFunc`及原protobuf。当前role-service只恢复block 1、2、3、4、7、12、13、16、21、22等分支。请求中的roleId、模块或block名不能被当作任意读取接口；尚缺分支要指出具体block和对应返回函数，不能用本角色全部模块冒充目标玩家数据。

<a id="story"></a>
## 14. 剧情触发、完成与皮肤

[story-service](../../../personal-server/game/story-service.mjs)把305触发和304完成保存到`role_stories`，已完成状态不能被后到的touch降级。module88由旧登录数据与实际完成行合并。**当前尚未核剧情图的合法前驱、所属章节、开放条件与选择分支**；因此请求某个已存在story tid成功，不等于该剧情完成条件已1:1。主线剧情节点还须走508合法推进，不能单靠304跳过主线。

<a id="skin"></a>
[SkinTable](../rules/tables/SkinTable.md)的`Skin/ExchangeLib/ExchangeConst/HandbookShow/Increase`不能混用。[skin-service](../../../personal-server/game/skin-service.mjs)处理76003—76009，module65保存实际拥有皮肤：

| 操作 | 当前成本/状态规则 | 精确缺口 |
| --- | --- | --- |
| 76003穿戴 | 自己的英雄uid、已拥有皮肤；skin_tid=0为卸下 | 当前主要校验拥有和Skin行存在，原皮肤对英雄/形态的兼容约束仍需核字段消费者 |
| 76004选择、76005兑换 | 选择存pending；实际兑换仍须明确目标，扣`ExchangeConst.exchange_item×ExchangeLib[skinTid].price`，发皮肤并清pending | pending不是已购买凭证；兑换开放窗、数量/重复拥有的原限制须补证 |
| 76006忽略幻武外观 | 保存独立忽略选项 | 不删除幻武、皮肤，也不改变属性拥有权 |
| 76007激活图鉴、76008查询 | `HandbookShow.point_skin`映射图鉴；分数汇总Skin.score和Increase.score | 激活图鉴与获得皮肤是两件事，原全局属性叠加入口须核HandbookAttr/Attr |
| 76009强化 | 当前按道具quality与目标等级查`Increase[quality×1000+level].consume`；代码上限5 | 上限5是当前边界；需以实际Increase最高行/原函数确认，扣款与module65增加等级须一致 |

<a id="cdkey"></a>
## 15. 兑换码与CMS问卷

[cdkey-service](../../../personal-server/game/cdkey-service.mjs)的40000读取本地`config/cdkey-awards.json`，码去首尾空白并转大写，以`code+role_id`唯一；发资源和写领取记录同事务。该文件是本地发码配置，**不是原服可用兑换码名单**。原码的开始/截止、服务器/渠道范围、账号与角色限制、全服总使用上限和批次互斥仍缺分发证据；不能把角色去重扩写成已恢复全部原兑换码规则。

<a id="cms"></a>
[cms-service](../../../personal-server/game/cms-service.mjs)的89501先核Cms tid，再读已启用且`start≤now<end`的`cms_questions`，按end/questionId排序返回link/title/award文本。读取问卷不等于完成问卷，更不直接发award字符串中的物品；完成回执、签名与实际奖励入口尚需独立证据。

<a id="activity-frame"></a>
## 16. 活动状态、阶段与调试命令

[act-frame-service](../../../personal-server/game/act-frame-service.mjs)把活动状态和stage投影保存到`role_activity_stages`。53001状态变化、53002阶段变化、53006取列表必须按真实活动行和日历重核，不能由客户端传入目标状态就任意延长购买/领奖窗。`act_id/version/state/stage/enter_time/loop_count/is_pause`各有作用，活动结束不代表所有已购权益或待结算奖一起删除。

<a id="gm"></a>
53003开活动、53004跳阶段、53005清数据和10的GM命令是调试操作。当前`gmEnabled`默认false并写`gm_audit_entries`；它们不属于玩家正常活动推进，也不构成原运营日历的数值来源。不能把GM可强开解释为新号已经达到FunOpen条件。

<a id="client-state"></a>
## 17. 红点、日志与渠道推送

39001保存已变化的红点，78901保存客户端诊断信息；红点表示展示/已读，不是资源领取账本，清红点不能清领奖位或重置任务。日志内容不能当成战斗胜负、支付成功、CDKEY完成等业务证明。

98201请求含`message_id/is_open`，当前校验正整数message_id并按`role+message_id`保存开关；登录module173的`pb_channel_push_param.open_list`从这些行重建。它只保存通知偏好，不发送真实渠道通知。原可配置message_id集合、渠道资格、开关默认值与推送生产者仍需核，不把已保存is_open写成已投递通知。


## 系统任务与命令定位

本表按[全模块规则索引](../rules/module-rule-index.json)分配；任务ID用于追踪，命令type逐项保留。每条链接定位本册的具体规则节或表行，既包括已证规则，也包括明确列出的实现差异和原证据缺口。列出命令不表示该分支已通过APK验收。

| 任务ID | 系统 | 命令type | 具体规则节 |
| --- | --- | --- | --- |
| <a id="role-unknown"></a>[`ROLE-UNKNOWN`](../rules/final-rule-register.md#role-unknown) | GM 调试命令 | `10` | [GM 调试命令](#gm) |
| <a id="role-role"></a>[`ROLE-ROLE`](../rules/final-rule-register.md#role-role) | 团长改名、头像、称号、形象、等级奖、属性与战力 | `104`、`105`、`106`、`108`、`110`、`111`、`112`、`1301`、`1302`、`1303`、`1304`、`1305`、`1306`、`1307`、`1308`、`1309`、`1310`、`1311`、`1312`、`1313`、`1314`、`1315`、`1316`、`1317` | [团长改名、头像、称号、形象、等级奖、属性与战力](#role-profile) |
| <a id="role-login"></a>[`ROLE-LOGIN`](../rules/final-rule-register.md#role-login) | 网络检查与开发登录辅助 | `109`、`909101`、`909102`、`909103` | [网络检查与开发登录辅助](#login-contract) |
| <a id="role-playerdata"></a>[`ROLE-PLAYERDATA`](../rules/final-rule-register.md#role-playerdata) | 玩家数据查询 | `161` | [玩家数据查询](#player-data) |
| <a id="role-story"></a>[`ROLE-STORY`](../rules/final-rule-register.md#role-story) | 剧情完成与触发 | `304`、`305` | [剧情完成与触发](#story) |
| <a id="role-funopen"></a>[`ROLE-FUNOPEN`](../rules/final-rule-register.md#role-funopen) | 既有功能开放请求 | `7000` | [既有功能开放请求](#feature-gates) |
| <a id="role-reddot"></a>[`ROLE-REDDOT`](../rules/final-rule-register.md#role-reddot) | 红点持久化 | `39001` | [红点持久化](#client-state) |
| <a id="role-cdkey"></a>[`ROLE-CDKEY`](../rules/final-rule-register.md#role-cdkey) | 兑换码领奖 | `40000` | [兑换码领奖](#cdkey) |
| <a id="role-activity"></a>[`ROLE-ACTIVITY`](../rules/final-rule-register.md#role-activity) | 真实活动状态推进 | `53001` | [真实活动状态推进](#activity-frame) |
| <a id="role-actframe"></a>[`ROLE-ACTFRAME`](../rules/final-rule-register.md#role-actframe) | 活动列表数据及 GM 开期/跳阶段/清理辅助 | `53002`、`53003`、`53004`、`53005`、`53006` | [活动列表数据及 GM 开期/跳阶段/清理辅助](#activity-frame) |
| <a id="role-skin"></a>[`ROLE-SKIN`](../rules/final-rule-register.md#role-skin) | 皮肤穿戴、兑换、图鉴与强化 | `76003`、`76004`、`76005`、`76006`、`76007`、`76008`、`76009` | [皮肤穿戴、兑换、图鉴与强化](#skin) |
| <a id="role-clientlog"></a>[`ROLE-CLIENTLOG`](../rules/final-rule-register.md#role-clientlog) | 客户端诊断日志 | `78901` | [客户端诊断日志](#client-state) |
| <a id="role-cms"></a>[`ROLE-CMS`](../rules/final-rule-register.md#role-cms) | 既有 CMS 问卷目录读取 | `89501` | [既有 CMS 问卷目录读取](#cms) |
| <a id="role-channelpush"></a>[`ROLE-CHANNELPUSH`](../rules/final-rule-register.md#role-channelpush) | 渠道推送开关 | `98201` | [渠道推送开关](#client-state) |
