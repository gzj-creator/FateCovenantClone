# 从一个入口查到完整规则

这些例子说明如何把规则册、活动ID、版本、数值表与实际操作条件连起来。例子使用本次快照中的精确原值；没有恢复的函数仍保持未知，不从例子外推所有版本。

## 例一：开服钓鱼1074003

先查[逐活动表](activities.md)中的`ActFrameTable.Act[1074003]`：

| 项目 | 原值 | 规则含义与边界 |
| --- | --- | --- |
| 类型 | 1074 | 查`ActType[1074]`，管理器为FishingActMgr |
| 功能 | ActType.func_open=1614 | 还须满足功能条件和模块开关；jump_func=3031不是同一个ID |
| 版本 | 3 | 查FishingActTable.Version[3]，不能直接读版本1 |
| 时间 | refer_day=1、refer_start_time=18000、duration_day=5、end_time=18000 | 原开服相对配置，不是world_time活动 |
| 阶段 | stage=[50,90]、stage_duration_day=[4,1]、stage_end_time=[79200,18000] | 两个阶段的具体终点须同时读取日数和日内秒数；不能把全部5天当进行期 |
| 岛屿/关卡/图鉴库 | island_version=2、level_library=2、illustrated_guide_version_library=1 | 三个引用独立，不能都改成3 |
| 门票/免费数量 | ticket_item=821202、free_item_num=25 | 数量原值为25；仅该字段不能证明每天发25 |
| 活动币/积分物品 | money=821302、score_item=6901900 | 资源空间独立，不能把门票直接当积分 |
| 榜单 | score_rank_lib=2、high_score_rank_lib=2；rank_need_score=80000 | 两类榜单各自读对应表，不以开局次数冒充渔获积分 |
| 关联商店/礼包 | shop=182503、gift=184703、res_exchange=45 | 这些是活动关联引用，需继续沿对应表/处理器查SKU和兑换规则 |

按本服当前窗口函数，以`2026-11-12 18:00+08:00`开服输入计算，配置窗口为`11-12 05:00 → 11-17 05:00`。窗口早于实际开服时刻不表示玩家能提前进入服务器；实际可参与区间还受阶段、功能和实例资格限制。这个窗口只是现有函数的可重建结果，原ActFrame整体S/E直接读取服务器实例，没有静态计算fallback。

进一步明确假设服务器`start_time=11-12 05:00`、tz=UTC+8、没有对应`stage_time_list`覆盖，原客户端GetStageTime得到50段`11-12 05:00 → 11-16 22:00`，90段`11-16 22:00 → 11-17 05:00`。后段配置1天，实际时长为7小时；这是原算法在假设输入下的结果，不能声称已观察到原服下发。阶段原规则见[时间与阶段](../activity-rulebooks/time-and-stages.md)，全部投影与阻断见[逐活动阶段](activity-phases.md)，不能据总窗口断言第5天仍能钓鱼。

查[完整FishingActTable](tables/FishingActTable.md)中的Level、IslandFish、Fish、Rod、Buy、Progress、ScoreRank与HighScoreRank，才能进一步确定逐级消耗、鱼种、竿、任务和奖励。玩法顺序及待恢复随机/结算规则见[垂钓规则](../activity-rulebooks/exploration-and-minigames.md)。

## 例二：商城资源商品111001

关联链是`RegularGift[1001].groups → Group[1001001].gifts → Recharge[111001]`，不是直接把商店组号作为充值SKU。

| 字段 | 原值 |
| --- | --- |
| Group.show_condition | 19257301001 |
| Recharge.type | 16 |
| pay_type / cost_item | 1 / 401500 |
| price | 280 |
| reward_tid / reward_count | [157002] / [100000] |
| can_buy_times / buy_cycle_limit | 3 / 1 |

该行是资源付款配置。应沿本类型处理器解释为相应资源消耗与实际奖励；不能把price=280统一展示为人民币2.80元。次数3和周期引用1分别保留；周期1的准确日切/终身含义由原枚举与消费者证明，不能看数字自行推定。

正常购买还须满足Group.show_condition、商品资格、本期限制和余额。成功时消耗、奖励、次数、模块同步与编码共同提交；已售罄的UI状态由同一购买台账产生。重试与重登不能再次发奖或把已购次数清零。规则来源见[RegularGiftTable](tables/RegularGiftTable.md)、[RechargeTable](tables/RechargeTable.md)及[商业规则册](../activity-rulebooks/commerce-and-benefits.md)。

现金商品另按自身付款类型处理。例如`Recharge[1]`的pay_type=0、price=3000、奖励401500×300；当前现金消费者将3000解释为分，即30元。此处can_buy_times=0不单独证明无限次。后台钱包加30元只改变支付余额，实际购买成功才按该商品原规则发奖、记首充/累充和限购；代金券只使用用户指定的定制发行与抵扣规则。

## 例三：为什么拿到权重仍不能公告抽卡概率

原`DrawTable.LibWeight[101]`：

```json
{
  "weight_group": [[205,6],[5000,7],[4720,8]],
  "guaranteed_group": [6],
  "guaranteed_weight": [40],
  "counter_guaranteed_group": [],
  "against_guaranteed_group_num": 1,
  "reset_guaranteed_top_num": 1,
  "max_draw_num": 2
}
```

普通weight_group数组的权重和是9925，这是可直接复核的算术结果。Group[6]、Group[7]、Group[8]的原lib_range在此资产均为空；缺候选时，205/9925不能变成某个英雄的正式掉率。`guaranteed_weight=[40]`及max_draw_num=2也不能仅凭字段名解释成“2抽保底”。

必须继续取得候选库、候选过滤、保底触发/重置、反保底及相应消费者，才可能给出真实条件概率。若使用另一独立分片，需在该版本的规则里补来源与哈希；不能把本地兼容矩阵填进这张原表。完整589库参数见[奖池目录](draw-pools.md)，流程与缺口见[抽取规则册](../activity-rulebooks/draw-and-recruit.md)。

## 例四：新手角色奖励和进入2-1的顺序

原`GuideTable.Award[1]`为1020601×1，Award[2]为2020601×1。原Step106004与110004均是领奖步骤，分别属于Process104与108；领奖请求成功后才结束该步骤，不能要求先保存本领奖步骤完成再允许发奖。

当前已恢复的资格要求分别为通关10202、通关20201。第二个角色是2-1通关后的奖励，不能提前发来绕过关卡。第一个角色到账后再通过合法编队上阵。英雄对象、资源返回、claim、module16原位图和引导检查点分别核对；一项成功不代表其他项已同步。

首章首领链为`Section10205 → Fight105 → Team105 → NPC3030500 → relation_hero3030501`蜜雪儿，位置5；2-1守方为9301600×3和9105000×1，位置[1,2,3,5]。地图Section.enemy不用于替代实际敌阵。完整规则见[新手与战斗](../system-rulebooks/onboarding-combat.md)、[原引导流程](../appendices/guide-processes-and-steps.md)与[前四章原敌阵](../appendices/early-missions.md)。

## 直接查询完整数值

在根目录PowerShell执行以下只读操作，可以获取版本3的全部原字段：

```powershell
$ruleTable = Get-Content -LiteralPath 'docs/gameplay-operations/rules/tables/FishingActTable.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$ruleTable.families.Version.rows | Where-Object { $_.tid -eq 3 } | ConvertTo-Json -Depth 30
```

查其他原表时更换文件名、families子表名与tid。文件中的assetPath/assetSha256绑定来源；缺字段、0、空数组和未恢复子表分别处理，不根据一个null结果自行补造规则。
