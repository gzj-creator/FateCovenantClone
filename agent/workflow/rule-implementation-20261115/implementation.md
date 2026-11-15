# 2026-11-15 R1 已确定规则实施

本轮按用户要求逐项实施文档中已经确定的规则。每项完成后在[最终验收文档](../../../docs/gameplay-operations/09-defects-and-acceptance.md#r1-已确定规则逐项验收台账)标记；原证据不足、客户端未验或发布未验的边界单独保留。

## 当前收口状态（2026-11-15）

46条首批命令中已有21条由具体服务实现：`803`、`667/670/671`、`88955/88957`、`89801-89804`、`101202`、`84502`、`93501`、`69301/69302`、`69006/69007`、`69101/69102`、`85804`、`91503`。这些命令已从通用失败关闭服务移出；服务端、登录同步、SQLite重开和离线真实TCP按各自记录分别验收。`69006`和`91503`仍保留专用支付前拒绝子域：前者缺81个每日任务的按日生产者，后者缺原资格条件及非整数价格圆整规则。

通用失败关闭集合现为25条、10项任务：`88951/88953/88956`、`701/702`、`87701/87702`、`88963/88964/88967`、`78201-78205`、`91501/91502`、`101301-101303`、`288`、`88401/88402`、`84901/84902`。各type的逐项原因以`personal-server/game/r1-fail-closed-command-service.mjs`为权威；缺原配置、生产者、前驱、返还消费者或结果投影时继续在资源/领取位/次数/对象变更前返回`GameError(5)`。

本记录后续较早小节保留当时形成过程中的数量，作为历史检查点；当前数量以本节、失败关闭服务、派发审计和[09验收表](../../../docs/gameplay-operations/09-defects-and-acceptance.md#r1-已确定规则逐项验收台账)为准。真实APK、生产TCP、生产库和部署均未验收。

验证基线：完成`HERO-LEASERSTARUP/101201`、`HERO-CAMPHALO/103101`、`HERO-COMBATPOWER/802`和`HERO-TACTICS/84501`后，`npm run test:fast`共336项，pass 334、fail 0、skipped 2；`test:all`未运行。日志见`analysis/test-runs/rule-implementation-20261115/tactics-fast.log`。最终文档生成器、`build-detailed-rule-docs.mjs --check`、文档验证器和`git diff --check`仍需在本次记录更新后复跑。该结果是下一项工作的回归基线，不替代真实APK、生产TCP或发布验收。

## HERO-LEASERSTARUP 租借升星与重置

用户要求按已确定规则逐项开工并立即登记验收。本项以R1、四类`LeaserStarUpTable`、客户端`LeaserStarUpMgr/LeaserStarUpUtil`及同版PB为准。后续已补齐对象真实升级历史、`Reset`分段成本和原返还消费者。

实现：

- 新增`personal-server/assets/tables/LeaserStarUpTable.data.json.gz`的原表读取器和业务服务；读取Type 4、TypeInfo 4、Const 1、Hero 65、Artifact 12、Pet 9、Elves 9、HeroStar 727、ArtifactStar 124、PetStar 88、ElvesStar 88、Reset 60。95个`developTid`全局唯一，四类成本分别为7401900、7501900、7601900、7701900。
- 修正配置索引，将请求的`developTid`与星表编码使用的配置行`tid`分开。客户端请求`tid`按`developTid`解析；星键严格为`配置行tid×10000+quality×1000+star`，目标取同一配置行星表排序后的下一项。
- `101201`兼容客户端ETF包裹的内层PB和直接PB；校验version、对象存在、实际租借副本唯一、当前星键和下一项。通过后在下一次SQLite事务提交前精确扣除下一项`cost_num`，余额不足返回301，任一后续步骤失败整笔回滚。
- Hero租借状态读取模块143 func7 slot5，更新`lease_heroes[].hero.star/quality`；Artifact/Pet/Elves读取模块179 func1 slot0的`unit_role[].take_info[].unit`，按type解码`pb_lease_artifact/pet/elves`后重新编码写回。
- 同步`model.playLineups`、`pre_lineups`和`pre_lineups_standby`中的Hero或通用租借嵌入副本；响应分别返回`hero_lease_ret`或`lease_ret`，实际变化的玩法阵容随回包返回。永久英雄、永久养成模块和其他资源不变。
- 登录初始化模块180的version1重置记录，并规范化143/179空slot，不为未租借对象伪造状态。`101202`按对象真实历史穿越的星表行返还同成本道具，按当日`Reset`行消耗免费/付费重置次数，并把对象、阵容嵌入副本、资源和模块180置于同一事务；不再由通用失败关闭服务接管。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/leaser-starup-service.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
node --test --test-concurrency=1 personal-server/test/gameplay-gateway.test.mjs
node --test --test-concurrency=1 personal-server/test/hero-lease-service.test.mjs
node --test --test-concurrency=1 personal-server/test/command-registry.test.mjs
node --test --test-concurrency=1 personal-server/test/command-dispatch-runtime.test.mjs
npm run check:command-dispatch
```

结果：Leaser专项11/11、失败关闭2/2、普通网关7/7、HeroLease 6/6、注册表5/5、派发运行时1/1通过。专项覆盖12表数量及索引、95个开发ID唯一、四类对象、同品质下一星、品质跨越、真实History/Reset返还、免费与付费次数、Daily恢复、资源不足/编码失败回滚、模块143/179/180、全部阵容副本、SQLite重开、ETF与直接PB及真实临时TCP。

边界：原服务端成功函数和`unlock_condition`执行语义仍未取得；当前按全部已穿越星表行返还属于现有证据推定。真实APK请求/界面、原服实时登录形状和生产TCP未验收。

## HERO-CAMPHALO 阵营光环升级

R1与同版客户端`CampHaloMgr`、`CampHaloCmd`、`HeroBlazonHaloForm`、`HeroBlazonBondData`、`CampHaloTable`、`HeroBlazonTable`共同闭合可确定部分：`103101`只接受一个阵营参数；等级从0逐级升到3；1/2/3/4分别使用对应章节ChartVal，9要求四章全部达到同级门槛；400/800/1500门槛来自20个`HeroCampHaloAttr`行。配置和客户端升级流程均未出现扣资源字段，因此升级按原流程只改等级，不扣资源。

实现：

- 生成并严格校验`CampHaloTable.data.json.gz`的`HeroCampHalo`5行、`HeroCampHaloAttr`20行，以及`HeroBlazonBondTable.data.json.gz`的`BondAttr`3200行、`BondGroup`128行、`Chapter`4行；支持阵营固定为1/2/3/4/9，等级键固定为`camp×100+level`，原`unlock`必须为`546626500{camp×100+level}`。
- `camp-halo-service.mjs`读取模块152的`pb_hero_blazon.bond_list`，只接受配置中存在的当前羁绊TID，以`floor(tid/100)`定位BondGroup/campus，并按每个当前羁绊的`BondAttr.chart_value`求和得到四章ChartVal。
- 模块182为空时仅在内存投影为`halos=[]`、`select_camp=0`，登录初始化不回写五行0级；成功后按阵营顺序稳定写回`camp_tid/level`，并保留`select_camp`。门槛不足、未知羁绊、非法阵营、越级、重复camp、坏模块和最高级重试均在事务内返回业务错误，不修改资源或状态。
- `103101`注册到`heroCommandServices[6]`，请求识别为ETF、响应为`pb_camp_halo_role`；从`r1-fail-closed-command-service.mjs`移除`103101`并删除`HERO-CAMPHALO`失败关闭组。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/camp-halo-service.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
node --test --test-concurrency=1 personal-server/test/command-registry.test.mjs
node --test --test-concurrency=1 personal-server/test/command-dispatch-runtime.test.mjs
npm run check:command-dispatch
```

结果：阵营光环专项9/9、失败关闭2/2、注册表5/5、派发运行时1/1通过。专项覆盖原表数量与脚本门槛、新号空PB不伪造、普通阵营精确门槛、差1拒绝且状态/资源不变、1→2→3和最高级拒绝、混沌四章全达标、ETF单参数、非法camp、未知bond、`select_camp`保留、SQLite重开及真实临时TCP。审计仍为`total=1407/serviceRoute=1383/gatewayRoute=18/multiOwner=6/unrouted=0/requestEncodingMismatch=173/requestEncodingUnverified=980/responseRuntimeUnverified=1407/responseSchemaMissing=223`。

边界：真实APK外层ETF、界面流程和生产TCP未验；`CampHaloAttr.attr/sp_attr/skill`进入全局或出战阵容的最终属性/技能投影、`active_num`实际启用语义及`select_camp`选择动作尚未接入。当前完成的是权威等级、ChartVal门槛和状态持久化，不能宣称光环已经改变战斗结果。本轮未启停实时服务、未读写生产库、未操作模拟器/ADB/APK。

## HERO-COMBATPOWER 战力奖励 802

R1与同版`CombatPowerMgr`、`CountStatisticsMgr`、`CombatPowerTable`、`CombatPowerCmd`及PB共同闭合802的奖励链：客户端`ReceivePowerAward(tid)`读取`CountStatisticsMgr.GetMaxProgress(TID_PROG_IDEA_COMBAT)`，断言`CPBreak[tid].break_value <= 历史最高战力`后发送ETF单参数`tid`；`UpdatePowerReceiveState`用回包`gain_award_data`整体重置BitBlock。`special=true`行的`target`是分项战力配置，不参与802的总战力断言，不能拿它替代`break_value`。

实现：

- 原表`CombatPowerTable`的`CPBreak`已从同版客户端抽取为`personal-server/assets/tables/CombatPowerTable.rows.json.gz`，SHA256为`5BFBA02E55EDDD265F691426E8346A454BCF875DCA7AE22E91F7DB1E03AC15BE`。读取器严格校验24个连续tid、50,000至10,000,000递增门槛、每4档一组、奖励资源为正整数；第4/8/12/16/20/24档保留`special/target`原行但不改变总战力门槛。
- 新增`combat-power-service.mjs`并接入`heroCommandServices[7]`。`802`只接受ETF单个tid；未知tid、历史战力不足和重复领取均返回业务错误5。服务不接受客户端自报power。
- 权威历史最高取服务端`rolePower.power`、已持久历史与模块21 slot0 `pb_count_statics_max`中`tid=3`进度三者的最大值。`CountStatisticsTable`中非custom、type0的`tid=3`位于索引2，对应数据slot3；登录时只更新 slot0 的最大值信封，不伪造 slot3 的普通计数数据。
- 领取时在同一SQLite事务中按`CPBreak.award`调用真实`grantResources`，设置0-based、MSB-first的tid位，持久化`historyMax/receivedBits`，同步模块21最大值，再编码`pb_power_award_toc`。`gain_award_data`按客户端BitBlock消费方式编码为ETF BINARY；回包编码或资源处理器失败都会回滚奖励和领取位。
- 从`r1-fail-closed-command-service.mjs`移除`802`，失败关闭表由48条降为47条；随后`HERO-TACTICS/84501`接入真实服务后降至46条。`803`继续按原说明拒绝，因为没有取得参数及预设战力重算契约。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/combat-power-service.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
node --test --test-concurrency=1 personal-server/test/command-registry.test.mjs
node --test --test-concurrency=1 personal-server/test/command-dispatch-runtime.test.mjs
npm --prefix personal-server run audit:command-dispatch
npm --prefix personal-server run check:command-dispatch
```

结果：战力奖励专项7/7、失败关闭2/2、注册表5/5、派发运行时1/1及真实临时TCP通过。专项覆盖24行原档位与奖励、模块21历史投影、正常领取、精确资源变化、档位不足、未知tid、重复领取、SQLite重开防重、ETF单参数、响应编码失败整笔回滚，以及802成功而803仍err5。审计仍为`total=1407/serviceRoute=1383/gatewayRoute=18/multiOwner=6/unrouted=0/requestEncodingMismatch=173/requestEncodingUnverified=980/responseRuntimeUnverified=1407/responseSchemaMissing=223`。

边界：客户端运行时从`DataMgr.GetData(1).receiveState`读取登录领取位，但该`1`对应的真实登录宿主尚未核实；当前未伪造模块1，领取位只保存在服务端权威状态并由802回包恢复，重登后真实客户端的已领显示仍待APK验收。历史最高已投影到模块21 slot0，但原服产生/刷新`tid=3`统计的完整事件触发器未取得。真实APK外层ETF、界面流程和生产TCP未验收；本轮未启停实时服务、未读写生产库、未操作模拟器/ADB/APK。

## HERO-TACTICS 战术节点升级与重置边界

R1与同版`PlayerDataTable`、`TacticsTable`、`TacticsMgr`、`TacticsCmd`及PB共同闭合84501：模块19为标量`pb_tactics_master`；`Attr`260行、`Chapter`4行、`Node`52行，每节点固定5级；章节`open_next=30/48/54/0`，根节点为`1/101/201/301`。非根节点要求父节点达到该节点`open_next=3`，非第一章根节点要求前一章累计等级点数达到前一章门槛。升级道具为`2401900`，目标等级`Attr.sub_count`为1或2。

实现：

- 新增`tactics-tables.mjs`、`tactics-state.mjs`和`tactics-service.mjs`；原表按260个属性、4章、52节点及固定5级严格校验，配置缺失或重复立即拒绝。
- `84501`只接受ETF单个节点tid；在同一SQLite事务内校验章节根、父级、跨章累计点数、5级上限和道具余额，随后扣费并写模块19，再编码`pb_tactics_level_up_back`。编码失败或资源写入失败整笔回滚。
- 客户端`TacticsMgr.InitData`实际读取`sub_list`，因此保存时根节点同时写入`root_node`和`sub_list`；读取重复节点若等级冲突则失败关闭，不能以root的0级覆盖sub_list中的真实等级。
- 战术累计等级按`AttrType.exchange`投影到最终HP、攻击、物防、法防、暴击等属性。共享投影已接入1316属性查询、普通/精英任务战报、当前排行榜战力、锦标赛和武馆上阵阵容；属性缓存键包含战术投影。
- `84501/84502`均已注册到原战术服务。`84502`仅重置请求章节，并按该章真实节点等级的Attr行精确返还2401900，不改其他章节，也不再由通用失败关闭服务接管。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/tactics-service.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
npm --prefix personal-server run check:command-dispatch
npm --prefix personal-server test
```

结果：战术专项12/12、失败关闭2/2及真实临时TCP通过。专项覆盖原表数量、父子与跨章门槛、成本1/2、余额不足、节点与章节重置、编码失败回滚、模块19重开、根节点双字段、ETF，以及当前战力榜随战术投影上升。

边界：原服务端成功函数未取得；真实APK外层ETF、界面流程和生产TCP未验收。原服战术属性在尚未定位的其他玩法入口中是否另有二次倍率或上限仍待逐项核验；当前已接入入口统一使用同一服务端投影。

## R1-RANK-TIEBREAK 排行榜同分

R1规定：没有原同分消费者时，按原分值主序、该分数首次精确达到的服务端提交时间、数值role_id排序；重复同分不刷新首次时间，降分后再次到同分复用原首次时间。旧记录优先使用可信历史事件，否则所有迁入行共享迁移快照时间。

实现：

- `personal-server/game/rank-service.mjs` 新增 `rank_score_reached`，主键为排名、作用域、期号、参与者和分值；保存毫秒级 `first_reached_at` 与来源。
- `rank_schema_meta` 记录兼容策略；旧库首次打开时扫描历史备份，按最早可信值建立记录，无历史者统一使用迁移快照。
- 排序加入首次到达时间，之后才比较数值role_id；当前榜单、指定查询、跨服分组、批量查询和备份榜共用同一排序。
- 重复写入相同分值不刷新首次时间；分值变化保留旧分值历史，降分后重返同分不会插值或重写。

验证：

```powershell
node --test personal-server/test/rank-service.test.mjs
```

结果：9/9通过，覆盖分值/反向序/角色ID并列、首次时间优先、重复同分、降分重返、旧库统一迁移快照、重开持久化、编码和SQLite失败回滚。

边界：原版同分消费者仍未取得，本次是R1明确推定；未做真实客户端同分展示、跨期冻结/发奖及APK验收，不能宣称原算法已取得。

## R1-TIME-ABSOLUTE 时间与活动窗口

R1规定刷新点为05:00；相对开服活动按原`refer_day/server_day`和日内偏移；`world_time`保留原绝对日期；只有单独声明的历史回放时间轴才可整体平移。

实现：

- `activity-calendar.mjs`的`dayZero()`改为标准05:00业务日零点；相对活动从`DayBegin/gameDay`加原日内偏移计算，结束日继续使用原`duration_day/end_time`。
- `activityWindow()`默认`absolute`。`world_time`直接返回原表S/E；只有显式传`windowPolicy='rebase'`才按参考开服差值平移。
- 日历配置新增`windowPolicy`：正式`schedule`为`absolute`，开发/历史`all-open`默认`rebase`；运行状态同步写入该策略。
- 网关仅在显式回放模式重定位抓包登录模板，正式排期不再自动复活旧活动；all-open作为全开放回放，保留全部活动并跳过无关功能锁产生的暂停标记。
- `audit-activity-schedule.mjs`按绝对、回放和相对三类窗口使用统一业务日公式，避免旧的自然日/平移预期误报。

验证：

```powershell
node --test personal-server/test/activity-calendar.test.mjs personal-server/test/activity-calendar-config.test.mjs personal-server/test/activity-schedule-audit.test.mjs personal-server/test/activity-runtime.test.mjs personal-server/test/launch-profile.test.mjs
node --test --test-name-pattern='all-open mode returns' personal-server/test/gameplay-gateway.test.mjs
```

结果：专项37/37通过；真实TCP all-open登录1/1通过。

边界：正式新服中旧绝对活动已过期时必须关闭；`rebase`结果只用于显式历史回放，不能写成当日原服日历。461三项尚无显式实例，本阶段继续以`unresolved_time_type`失败关闭。真实APK跨04:59:59/05:00、旧活动关闭、回放标签及生产TCP未验收。此前记录的战斗人数与WishTree门禁用例已分别按下述专项结论修正，`gameplay-gateway.test.mjs`当前7/7通过。

## R1-DYNAMIC-461-175001 461显式实例

R1规定：按真实组主服业务日固定四项首期，175001继承父174001的整体窗口并显式生成50段；1036008、1037001、1037002分别按业务日79、29、90起算。刷新点为05:00，阶段采用显式`DayBegin`和`DayZero/end_time`。只建真实单服组，不按`serverId/scopeId/master=self`拼接未知服务器函数；parent短ID暂用`[1,0]`，原值举证前不伪装为已恢复。

实现：

- `personal-server/config/activity-explicit-occurrences.mjs`固化四项首期和阶段边界；完整实例指纹包含baseline、scope、真实scopeId、actId、version和occurrenceId，任何S/E变化都会产生新实例。
- 1037001/v10和1037002/v11不再把50/90误读为父活动总期限；v11尾段保留原`end_time`后按05:00业务日收口。1037001仍由`DynamicArg462<=90`决定是否开放，不隐式复发。
- `activity-calendar.mjs`按显式实例处理`461`，不再从登录模板或未知服务器函数外推；模块92下发子活动及显式stage，模块183同步同一窗口；未登记`time_fun=461`继续以`unresolved_time_type`失败关闭。
- `activity-runtime.mjs`与`activity-store.mjs`按periodNo及显式50/90阶段记账，持久化baseline/scope/version/occurrence/instanceKey/业务日和stage；实例切换不串档。`act-frame-service.mjs`生成并保持`stage_time_list`。
- 175001的首期服务于后续PAY-BUYSKINACT；父期结束后不循环，也不补登入日前已经错过的免费日奖。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/activity-calendar-config.test.mjs personal-server/test/activity-calendar.test.mjs personal-server/test/activity-explicit-occurrences.test.mjs personal-server/test/activity-lifecycle.test.mjs personal-server/test/activity-online-sync.test.mjs personal-server/test/activity-read-service.test.mjs personal-server/test/activity-runtime.test.mjs personal-server/test/activity-schedule-audit.test.mjs personal-server/test/activity-settlement.test.mjs personal-server/test/activity-store.test.mjs personal-server/test/launch-profile.test.mjs
```

结果：67/67通过。覆盖公历00:00不换业务日、05:00换日、首日/末日边界、显式S/E、四项首期、完整实例指纹、50/90阶段、模块92/183的`stage_time_list`、SQLite持久化、重开恢复和schema失败回滚。

边界：原461服务器函数和原175001真实下发S/E仍未取得，当前实现是R1明确裁定。APK实际登录、模块92/183展示、跨日及生产TCP未验收；本专项通过不能代替客户端或上线验收。

## PAY-BUYSKINACT 购皮肤活动

R1规定：175001使用父174001整体窗口；五个version1 SKU按活动日第1/3/17/31/45天解锁；免费日奖按05:00业务日、每个item_id每日一次，并使用原`con_time`窗口；付费不限免费日窗，但每角色、每实例、每SKU一次；955132601007映射为`GetPassedSection>=30203`，只服务功能1514。

实现：
- 新增13行`BuySkinActTable.data.json`，保存原资产SHA256，并只启用tid 1–5/version 1；逐项核对SKU、价格32800分、解锁日、免费奖励和每期一次限购。
- `buy-skin-act-service.mjs`实现104001、免费日账本、购买账本、活动/日/功能门禁、永久皮肤所有权检查、模块65/92同步与flag 106记录；资源层补`4000:ItemBase`，使特权物品走模块6。
- 钱包将商品、扣款、订单、两个奖励、`role_skins`、`activity_purchases`和登录模块放在同一SQLite事务；同request_id返回原订单，不重复扣款。
- 网关将104001接到专用protobuf路由；16004兼容R1外形`[productId,[175001,buySkinTid],paymentItem]`，16003仍完成本地订单确认。活动外从商品列表隐藏。
- 功能提取器只把共享断言955132601007绑定到1514，其他43个共享sysSwitch来源继续失败关闭；模块8当前的mission_id参与7000与登录重算。

验证：
```powershell
node --test --test-concurrency=1 personal-server/test/buy-skin-act-service.test.mjs
node --test personal-server/test/fun-open-rules.test.mjs
node --test --test-concurrency=1 personal-server/test/event-bus.test.mjs personal-server/test/fame-hall-fidelity.test.mjs personal-server/test/wallet-service.test.mjs personal-server/test/purchase-flow-regression.test.mjs personal-server/test/recharge-rules.test.mjs personal-server/test/recharge-client-patch.test.mjs personal-server/test/recharge-bonus-service.test.mjs
```

结果：BuySkin专项8/8；覆盖五个免费日窗/SKU解锁日、同日防重、重叠领取、付费窗口、首次购买、同请求重放、跨SKU限购、模块65/92、原子回滚、SQLite重开，以及104001→16004→16003临时TCP。功能规则4/4；相关钱包、事件、名人堂和充值回归58通过、2项因未提供客户端bundle跳过。

边界：真实APK的16004外层编码及实际界面未验；原服175001下发、返场、后台暂停/延长未取得；`sysSwitch=92098`的权威业务状态来源未取得。当前功能业务映射为ready 177/gap 346，本项只新增1514，不能把共享断言的其余43行一并打开。

## BATTLE-BATTLETRIMATCHHERO 三消英雄与升星

R1规定：112001按原等级逐级累计成本升等，112002按原星级成本和前置升星；必要成本、目标对象或内容版本不完整时拒绝该变更并保持资源不变；英雄碎片通过原对象类型的处理器进入真实拥有状态。

实现：

- `trimatch-core.mjs`与`trimatch-service.mjs`接入112001/112002；多级升级先汇总全部等级成本，再一次性扣除并返回实际资源变化，不足时整笔回滚。
- 模块6 group 2新增`4700:MatchHeroChip`处理器；英雄碎片按真实对象类型合成，升星链路不再停在发奖阶段。
- 登录模块563`BattleTriMatchHeroMgr`下发角色持久化的三消英雄状态。`ModuleTable`的`e_dir`已与客户端Mgr/DB proto核对。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/trimatch-service.test.mjs
node --test --test-concurrency=1 personal-server/test/command-dispatch-runtime.test.mjs
```

结果：三消专项5/5通过，覆盖累计成本、精确差1材料时原子拒绝、112002原表成本、碎片合成、SQLite关闭重开后英雄恢复、563登录解包及真实临时TCP。派发审计和运行时测试通过。

边界：真实APK的112001/112002外层请求编码、界面流程和响应展示未验；563的实时原服登录形状未抓包，当前依据ModuleTable、客户端Mgr DB proto和LoginParse推导。`ability`/技能解锁与客户端表现联动尚未完成；`is_break`额外门槛未取得；三消功能FunOpen业务状态、开放时机及错误码未验。

## BATTLE-BATTLETRIMATCHEQUIP 三消装备与兑换

R1规定：113001按原类别及一键升级语义处理，113002按整槽或指定类型交换，113003按原多轮升级规则处理；只有证据完整的成本/产出才执行，失败不留下部分扣料或物件变化。

实现：

- `trimatch-service.mjs`接入113001–113003，支持单类/一键升级、整槽/指定类型交换、多轮升级及满级拒绝。
- 升级和交换写入同一持久化对象；资源不足或上下文失败时事务回滚；登录模块564同步`BattleTriMatchEquipMgr`。
- 一键升级按现有证据每类只升一级，材料不足处停止；没有证据的额外成本或返还不由代码补算。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/trimatch-service.test.mjs
```

结果：装备升级、整槽/指定交换、多轮升级、满级拒绝、事务失败和SQLite重开恢复通过，564登录解包与真实临时TCP通过。

边界：真实APK三条请求的外层编码和界面流程未验；564实时原服登录形状未抓包。装备交换是否另收成本、是否返还旧材料未取得证据，当前只交换真实等级，不造额外账目。“每类只升一级”和材料不足停止语义尚待真实APK对照。

## BATTLE-BATTLETRIMATCHLINEUP 三消出战阵容

R1规定：114001–114005保存预设、设置出战和读取阵容；配置类型、位置、英雄拥有关系及同队唯一性必须校验，未知类型不默认成合法类型；登录恢复全部真实出战类型。

实现：

- 网关接入114001–114005，`trimatch-service.mjs`实现最多20套预设、增删改读与type 1/2/3出战阵容。
- 修复`trimatch_ident`首项UID被跳过的问题，首套预设固定从UID 1开始；`playing_lineup`改按repeated保存并恢复三类型阵容。
- 阵容校验只接受`BattleTriMatchLineupTable.Type`中的1/2/3，并拒绝重复`team_id`、重复英雄、重复位置和未拥有英雄；登录模块565同步`BattleTriMatchLineupMgr`。

验证：

```powershell
node --test --test-concurrency=1 personal-server/test/trimatch-service.test.mjs
node --test --test-concurrency=1 personal-server/test/command-dispatch-runtime.test.mjs
```

结果：114001–114005、配置类型、重复位置/英雄/队伍、未拥有英雄、20套上限、UID持久化、三类型恢复、565登录解包和10条命令真实临时TCP全部通过。

边界：真实APK五条请求的外层编码和界面流程未验；565实时原服登录形状未抓包。`add_max_num`原服语义未取得，当前按客户端Mgr实际读取的`max_preset`下发表值20。原版队伍数量、三消主界面/塔/PVP预设是否共享或互斥，以及阵营/位置特殊限制未取得。

## R1-TIME-HUNDREDDRAW 百抽与父子活动窗口

R1规定：正式排期保留`world_time`绝对日期；原服抓包得到的`act_custom_list`只属于产生该抓包的原服务器实例，不能在正式新服中复活。只有显式`windowPolicy='rebase'`的历史回放可以保留该实例窗口。现代百抽父活动20001运行期间，182商店和184礼包必须跟随同一父窗口，不能被子行的旧静态`world_time`单独关闭。

实现：

- `activity-calendar.mjs`仅在`rebase`回放模式承认旧legacy custom窗口；`absolute`正式模式使用当前相对父活动的`refer_day/server_day`窗口。
- `hundred-draw-service.mjs`的`runningConfigs()`优先调用日历`windowFor()`，使父活动和182/184伴随行使用同一有效实例；无日历调用方仍保留旧custom/静态窗口兼容回退。
- `hundred-draw-service.test.mjs`拆为正式绝对排期关闭已过期实例、显式rebase回放恢复原实例两个正交用例，不再要求正式新服平移旧`1102010`。

验证：

```powershell
node --test personal-server/test/hundred-draw-service.test.mjs
node --test personal-server/test/premium-act.test.mjs
node --test personal-server/test/activity-calendar.test.mjs
node --test personal-server/test/gameplay-gateway.test.mjs
```

结果：百抽18/18、付费活动10/10、活动日历22/22、真实临时TCP网关7/7通过。覆盖正式绝对过期关闭、显式rebase窗口、20001父子商店/礼包同步、原抽奖/进度奖/星奖/跑马灯、SQLite重开和真实TCP。

边界：真实APK跨刷新点、旧活动隐藏及生产TCP未验收；原服历史窗口只用于回放，不能称正式新服当日日历。

## R1-BATTLE-CAPTAIN-REPORT 普通战报虚拟队长

R1与同版客户端证据规定：普通战斗报告必须包含客户端圣器HUD读取的虚拟captain fighter；该行不是额外玩家英雄、不参与伤害，也不能改变实际攻守人数。

实现：

- `mission-fight-service.mjs`在201报告中加入`role_type=3`的虚拟captain，同时保持四名玩家英雄`role_type=1`和Fight301/Team301的四名NPC`role_type=2`。
- `gameplay-gateway.test.mjs`真实临时TCP用例核对30201报告为4名玩家、4名NPC和1个虚拟captain，共9个fighter；仍验证实际动作流、201→207结算、体力/首通奖励与重复207幂等。
- 该用例等待响应时按请求`seq`匹配回包，避免把无seq的7201服务端推送误当成207响应；不掩盖业务失败。

验证：`node --test personal-server/test/gameplay-gateway.test.mjs`，结果7/7通过。

边界：真实APK普通主线显示、圣器HUD及生产TCP未验收；不能用虚拟captain条数宣称实际参战人数增加。

## DRAW-WISHTREE Fun1223受限边界

R1规定正常许愿树抽取必须服从原功能门禁。当前`Fun1223`的原条件断言仍为`955132601007`，业务含义未闭合，因此正式默认必须失败关闭；91701已恢复的抽取/返利服务只能作为受限实现验证。

实现与验证：

- 默认91701返回309，不因服务代码存在而绕开Fun1223。
- `gameplay-gateway.test.mjs`仅在测试中显式创建`force_open(1223)`运维覆盖，再验证真实临时TCP抽取、返利、次数扣除、重复空额度310和登录模块165重开持久化。
- `node --test personal-server/test/gameplay-gateway.test.mjs`结果7/7通过。

边界：Fun1223原条件、正式开放时机和真实APK入口未取得；不能把运维强开路径记作原功能已开放。

## R1-FAILCLOSED-42 未闭合命令业务拒绝（起点46条）

R1规定：缺少原配置、前驱、生产者、返还消费者或结果投影的具体变更必须在扣资源、置领取位或伪造成功前拒绝；不得继续落入通用未实现响应。已冻结的旧状态和只读事实仍应保留，不能因整族有缺口而清除。

实现：

- 新增`r1-fail-closed-command-service.mjs`，逐type列出20项任务和精确缺口原因。本轮H1完成`803/667/670/88955`后，HERO-COMBATPOWER已全部移出，HERO-FAVOURINTIMACY仅保留671，HERO-HEROBLAZON仅保留88951/88953/88956/88957；当前类型表为42条。
- 受影响任务为`HERO-COMBATPOWER`、`HERO-FAVOURINTIMACY`、`HERO-HEROBLAZON`、`HERO-HEROLEGEND`、`HERO-INTELLI`、`HERO-LEASERSTARUP`、`HERO-LINEUPSNAPSHOT`、`HERO-NEWHEROEXCLUSIVE`、`HERO-TACTICS`、`ITEM-CAREERLIFE`、`ITEM-GROWTHTARGET`、`ITEM-HOOK`、`ITEM-LINEARLEVEL`、`ITEM-MYSTERYSHOP`、`ITEM-OPENSERVERBOX`、`ITEM-PERIODTASK`、`ITEM-RESCOMPLETE`、`ITEM-RESROLLBACK`、`ITEM-TASKAWARD`、`ITEM-TASKGROUP`。
- 网关在通用fallback前接入该服务，统一返回业务错误5并记录`r1_command_refused`；这些请求不会再记为`unsupported_command`。服务在读取或修改状态前拒绝，因此不会扣料、改位图或发伪造奖励。
- 新增完整类型表测试和真实临时TCP代表命令测试；当前类型表42项，派发审计为`serviceRoute=1383`、`unrouted=0`。

验证：

```powershell
node --test personal-server/test/r1-fail-closed-command-service.test.mjs
node --test personal-server/test/command-dispatch-runtime.test.mjs
node --test personal-server/test/command-registry.test.mjs
npm run check:command-dispatch
```

结果：失败关闭服务2/2、派发运行时1/1、注册表5/5通过；审计1407条命令中`unrouted=0`。真实TCP以288、671、78201、101301、101202验证均返回err5、无通用未实现fallback。

边界：本项完成的是“每条未闭合命令均有明确R1拒绝边界”，不等于20项原玩法已实现。后续在某组原生产者、状态、成本、结果和作用域全部闭合后，必须从失败关闭表移除该type并增加真实功能测试。101201、103101、802、84501、803、667、670与88955移出后当前为42条；请求编码证据仍有173条不匹配、980条未核验，响应运行时仍全部待验；不得用本轮结果宣称1407条命令都可玩。


## HERO-COMBATPOWER 803 预设阵容战力重算

R1与同版证据闭合803：`pb_lineup_team.power`原注释写明“当前战力，目前用于向客户端发送战力值，客户端暂时没有提供计算战力的方式”，说明预设阵容战力由服务端计算并下发；客户端`HeroShowUILogicMgr.CheckReqRefPower`先按`HeroTable.ConstByIndex(1).req_ref_interval`限频，再用`PreLineupMgr.GetLineupByIdx(当前预设)`取得阵容，空阵容或全无效fighter时直接返回，否则`Seq:Cast(CombatPowerCmd.req_update_pre_lineup_power)`（`CombatPowerCmd`只有encode、没有回包处理器）。命令目录仍记录为ETF、无声明响应schema。

实现：
- 新增`personal-server/game/pre-lineup-power-service.mjs`并接入`heroCommandServices`。`803`接受ETF单个预设下标；空数据或0按`pb_role_lineup.cur_pre_index`落到当前预设；非整数term返回1。
- 重算只读服务端权威：按`assembleHeroAttributes`（含`tacticsGlobalAttrs`全局投影）逐fighter取`PowerCalculator.CalcAttrPower`，累加为`pb_lineup_team.power`，并把`max_power`更新为历史最大；不接受任何客户端power字段。未知下标、无fighter、非本人英雄、非标量请求均在写状态前返回`GameError(5/1)`。
- 结果只写`model.lineups`，由`game-store.materializeState`在下一次登录/存档时同步进模块9的`pb_role_lineup.pre_lineups`。客户端无803回包处理器，因此回包为空的ack。

验证：`node --test --test-concurrency=1 personal-server/test/pre-lineup-power-service.test.mjs` 7/7通过，覆盖精确重算、历史最大保留、未知下标/客户端自报power/空阵容拒绝且状态不变、空请求按当前预设、模块9登录payload与SQLite重开后一致、真实临时TCP成功ack与非法term返回1；`combat-power-service.test.mjs`的802用例同步改为803成功重算，7/7通过。

边界：`803`只刷新被请求的预设阵容；同源玩法阵容副本仍按209编辑/登录同步各自刷新，本轮不代改。真实APK请求外层ETF、界面刷新时机和生效时机未验；生产库未读写。

## HERO-HEROBLAZON 88955 纹章技能升星

R1与同版证据只闭合88955：客户端`HeroBlazonCmd.req_hero_blazon_update_skill`→`HeroBlazonSkillMgr.ReqUpStarSkill`，技能tid为`源技能tid×10+星`，按`HeroBlazonTable.Skill[skill_tid].active_item`数量扣除、`active_chart_value`为进入门槛；图鉴值来自`HeroBlazonMgr.GetChartValueByChapterTid`→`HeroBlazonBondMgr`，即已拥有羁绊行`BondAttr.chart_value`按campus求和；状态落模块152`pb_hero_blazon.skill_list`，回包`pb_hero_blazon_update_skill_back{skill_tid,res_client}`。

实现：
- 新增原表资产`personal-server/assets/tables/HeroBlazonTable.data.json.gz`（源bundle`8647623730521538000-HeroBlazonTable.data.lua.bin`，SHA256 `D0077B02FAB8422FBD584AEC4F6E5E1CC824C756EC7D29DF206331A7AFE278C9`）与`personal-server/config/hero-blazon-tables.mjs`，严格校验17个族行数（Param1/Quality4/TalentUp27/Talent8/TalentReset5/ScoreBox6/Attr720/Skill88/Level26/AngerSkillType3/AngerSkillDes48/Chapter4/BondAttr3200/BondItemNeed492/BondGroup128/EmbedGroup110/EmbedCell414）及索引连续性。
- `personal-server/game/hero-blazon-service.mjs`在同一事务内校验技能行、上一星前驱、campus图鉴门槛与材料余额，通过后按`active_item`真实扣除、写模块152、编码回包；余额不足返回301，编码或资源失败整笔回滚。
- 从`r1-fail-closed-command-service.mjs`移除88955；失败关闭表由46条降为45条，再与667/670一起降至42条（803与本项各自移出）。

验证：`node --test --test-concurrency=1 personal-server/test/hero-blazon-service.test.mjs` 9/9通过，覆盖原表行数/索引、下一星成功与精确扣1、前驱缺失、图鉴不足、材料不足、重复领取、未知技能、基础技能err5、非标量模块、SQLite重开、ETF单参数以及真实临时TCP回包与持久化。

边界：`88951`（章节普通格/特殊镶嵌的精确消耗与结果位图）、`88953`（天赋点数预算与`need_other_level`上限）、`88956`（技能重置范围/成本/返还）继续失败关闭；`88957`已按目标`BondGroup`、下一星`BondAttr`、组内5个材料各1个和最大星实现，并返回完整`talent_list`；`star==0`的基础技能激活因消费者未恢复同样返回err5（`R1-HEROBLAZON-SKILL-BASE`）。技能与属性进入战斗的最终投影未接入；真实APK界面与生产TCP未验收。

## HERO-FAVOURINTIMACY 667/670/671 赠礼、约会与故事

原证据已闭合：`HeroTable.data.lua.json.gz`（SHA256 `03E95433BE6D5AF3D0AA17FB0C4D4224E67E7F342B502FDC3A3B65ABF27F2561`）包含Base16、Item4、Level50、Const1、Cycle2、Charm30等族；同版`hero_favour_intimacy.net.proto.bin`（SHA256 `DACCF5F8A4D07BC650654A2D1EE24776D120F59544F97985EB1E366AE976250E`）与`FavourIntimacyMgr`（SHA256 `395845B6DBC6FF07E1B63DC5AA4BB33383BD1DC33DB39F79727461DC8BBE0485`）闭合直接PB、回包消费和周期语义。客户端`IsInSameCycle`以`IsSameDay`处理`user_date_cycle=2`、以`IsSameWeek`处理`hero_date_cycle=1`，即用户约会周限30、英雄约会日限；日界和周边界按R1业务时区05:00。模块10第12个值（slot11）由`HeroDataMgr.ParseLogin`解析为`pb_hero_favour_intimacy`。

实现：

- 新增`personal-server/config/favour-intimacy-tables.mjs`读取原表；新增`personal-server/game/hero-intimacy-service.mjs`并接入网关`heroCommandServices`。667/670/671使用各自原PB，不再是ETF。
- 667先校验拥有英雄、Base入口已开放、原赠礼物和正数量，再在同一事务中合并物品、按Level阈值升级、原子扣物并推进`intimacy_value/intimacy_level`。670校验当前Level的`date_times`、用户周限与英雄日限，原子发放`date_award`并推进两层次数和最后时间。状态写模块10 slot11。
- 等级`award/chip_num`和约会`date_chip_num`由667/670响应交给客户端`AwardKit.Parse`消费；`chip_num`对应`Hero.chip`。这些是R1推定，未声称取得原服务端函数。编码、奖励、资源或状态失败整笔事务回滚。
- 后续补齐671原表关系：StoryChapter16、StoryChapterPage86、StoryChapterChoice80、StoryChapterPageShow202；每故事恰好五个choice，`FavourIntimacyBase.hero_story`指向故事，终章页要求`endingType>0`且带原`award`。671校验英雄拥有、页面所属choice、亲密度门槛和`story_got_bin`未领位，只发该终章页奖。

验证：`node --test --test-concurrency=1 personal-server/test/hero-intimacy-service.test.mjs personal-server/test/hero-intimacy-gateway.test.mjs` 9/9通过。覆盖原表行数、667精确扣物/升级/等级奖/chip、670日周界限、671终章页和独立位图、次数/重复拒绝前不变、未知/未拥有/关闭入口、直接PB、编码失败回滚、SQLite重开，以及真实临时socket登录、三type路由、slot11持久化和重复约会拒绝。H1三组专项合计34/34，三组真实临时TCP均通过。

边界：亲密度对面板/战斗属性的最终投影、真实APK外层与界面流程、生产TCP和生产库未验收；原服务端成功函数未取得。

## HERO-HEROLEGEND 89801—89804 传奇书

原证据：`HeroLegendTable`源SHA256 `72dcade6f1ca9691858ad39c7e5b7cc849cc9ac195ad129be6958aa966a47575`，包含17个Book、3个祝福槽、4个阶段和15个等级行；`HeroLegendBookMgr`模块154标量登录解析、`HeroLegendBookUtil`上限/阶段/祝福条件、`HeroLegendBookForm`请求流程及`pb_hero_legend_book(_active/_active_back)`已核对。原服务端函数未取得，成功动作标记为R1显式推定。

实现：新增`personal-server/config/hero-legend-tables.mjs`、原行资产`HeroLegendTable.data.json.gz`和`personal-server/game/hero-legend-service.mjs`。89801在书未存在且英雄已拥有时创建5星书，否则要求英雄本体星数不小于当前书星后加一星；89802只接受书tid和1..3槽位，按`BookBlessOpen.need_star`与`Book.bless_hero`目标校验并禁止重复；89803按`Hero.chip`扣`BookLevel.need_piece`，10星时受当前阶段×5级封顶；89804要求10星、当前等级等于下一阶段`need_level`，成功后阶段加一。所有写状态在SQLite事务内，空模块154规范化为空列表，资源、状态或编码失败回滚。

验证：`node --test --test-concurrency=1 personal-server/test/hero-legend-service.test.mjs` 7/7通过。覆盖原表读取、ETF四个type、真实临时TCP、资源不足不扣、重复祝福拒绝、空账号不伪造书和SQLite重开。失败关闭类型由42降至38，测试固定数量同步更新。

边界：真实APK外层/界面和生产TCP未验收；传奇书属性/技能进入全部战斗及其他玩法阵容的最终投影仍待逐入口核验。当前只有已证状态、原回包形状和客户端可见存储，不把服务端测试写成原服函数已恢复。

## 2026-11-15 R1 剩余25条命令五组独立复核

基线为`12a6a16`。五组分别在`.worktree/r1-remaining-20261115/{a,b,c,d,e}`从该提交建立worktree，完成证据复核后按A→E串行合入。最终结论是：**25条命令零移出失败关闭集合**。各组都补出了可机读原表和更精确的阻断点，但没有组同时闭合原生产者、权威状态、成本、前驱、奖励/返还消费者和结果投影，因此没有实现或宣称成功链。所有命令继续在解析价格、扣资源、置领取位、改次数或改对象之前返回`GameError(5, 原因 + decisionId)`。

### A组：纹章与情报（88951/88953/88956、701/702）

详细证据见[a-heroblazon-intelli.md](a-heroblazon-intelli.md)。88951普通格列表生产者是空桩，普通格成本消费者和激活结果位图缺；88953的`GetAllTalentValue`是恒定0桩，`TalentUp`缺`need_other_level`；88956在整个客户端没有请求发送者，原表17族也没有技能重置成本/返还族，`TalentReset`仅属于天赋，不能挪用。701/702有真实Cmd/Mgr调用者，但`Intelli`投影只有4列、没有解锁奖励列，`Type.unlock=389242300001..8`需要求值的`MethodScript`，现有`MethodTable`没有这些解锁脚本行；完成奖、派遣条件/选择和开始到完成状态机也未闭合。

### B组：阵容快照与新英雄专属（87701/87702、88963/88964/88967）

详细证据见[b-lineup-snapshot-new-hero-exclusive.md](b-lineup-snapshot-new-hero-exclusive.md)。已冻结`LineupSnapshotTable`和`NewHeroExclusiveTable`原行及同版PB。快照没有`pb_lineup_snapshot`写入生产者，`reference`生命周期、日界和跨角色可见范围未知；`common_map/dream/guild_explore/guild_gvg/guild_joint`只证明五个镜像key宿主，没有给出写入规则。87702的`key_list`完全来自服务端先前下发的快照元数据。新英雄专属可推导候选`Version→WishDraw→WishDrawHero`，88964已核197行`StoryAward`和`tid%1000`领取位，但活动实例/换选、剧情日/fight解锁生产者未取得，194/197行`fight=0`；表内没有`LineupAward`族，88967没有客户端消费者，三个登录slot也未定位。

### C组：挂机产出（78201—78205）

详细证据见[c-item-hook.md](c-item-hook.md)。原表六族、同版PB/ETF外层、五条客户端请求构造、12个hook type→erl模块映射、produce-id常量及3063条`RandomAward`外部码已冻结。`HookTable`源bundle SHA256以`363929DC…B3F8F9F9A59E44120B29`为准，纠正旧记录少一个`F9`。成功链仍缺逐type产率/关卡/上限、float余量累积与取整、领取游标、随机时间、快速次数/成本和`msg_bin`权威解释；不得把原背包余额差或客户端award当产出。

### D组：神秘商店与周期任务（91501/91502、101301—101303）

详细证据见[d-mysteryshop-periodtask.md](d-mysteryshop-periodtask.md)。神秘商店已闭合5档手动价`100/100/120/120/150`、货币101500、日限5、五类折扣权重和四段`manual_refresh_cw`，但每格候选池、产出条数、自动权重抽取阶段、`all_times_data`/`customize_auto_refresh_times`推进和`next_auto_refresh_time`仍缺；`discount_idx`有重复值，不是唯一键。周期任务从原bundle和第二份独立导出双重确认`Task/Version/Score/Stage`均为0行，任务类型/次数/参数/前驱、阶段`task_range`与奖、积分阈值/奖和`Version.score_item`都不能凭客户端语义补造；登录slot仍未闭合。

### E组：补全、回退与任务组（288、88401/88402、84901/84902）

详细证据见[e-res-tasks-residuals.md](e-res-tasks-residuals.md)。288唯一`Award`行的`101500×200/201500×10000/101800×500`已恢复，但`CanAward()`只读客户端下载完成标志，请求不带章节/天数/大小等可复核依据，无法构造权威领取键。88401/88402已恢复8类对象、成本500/100×7和最低6星回退5星，并确认`refresh_func`只是客户端刷新钩子；服务端返还公式、逐类对象重置范围、返还消费者、`to_client`和预览后指纹复核仍缺。84901/84902已恢复6组、20个组合任务和组奖`201500×1`，但`GroupFunc`为0行，`func_id/func_open`、组间前驱、type 1202/8601进度生产者和领取位定义缺失。

### 共享失败关闭与回归修复

- 25条逐type原因已按本轮证据更新并附decisionId；类型集合仍为25条。`r1-fail-closed-command-service.test.mjs`和E组专项共8/8通过，包含真实临时TCP逐条err5、无成功payload及登录后持久化状态逐字节不变。
- 修复`multi-realm-gateway.test.mjs`在Windows上删除临时目录早于异步`close()`完成所导致的`EPERM`与测试进程挂起；现在显式逐个等待服务器关闭并以`maxRetries`清理目录，文件约3.6秒通过。
- protobuf benefit测试分别复现：104001已实现，应移出未实现契约；105401等benefit类型原先被309功能门禁截住，现让已登记为refusal-only的benefit类型在功能门禁前到达业务拒绝。`benefit-command-decode` 6/6通过。
- StarMission、永久卡、皮肤、英雄差异与英雄重铸等真实网关用例改为只在测试中显式`force_open`其Fun门禁，生产门禁未被绕过；不再用“重跑到绿”掩盖309。
- pray login按R1绝对窗口复现，测试服务器开启时间改为窗口前10天且仍受29天限制，不再错误要求旧相对平移。
- 首充真实网关超时复现为模块槽冲突：`TACTICS_MODULE_ID`原误写19，会覆盖模块19 `res_recharge_login`，下一次登录因`Tactics login data is invalid`断开。按`ModuleTable`改为125（`TacticsMgr/project/tactics`），与HeroBlazon 152、HeroLegend 154、MysteryShop 162一致；tactics与line-first-recharge测试均通过。
- 上述11个已知失败文件修复后单个复跑合计47/47通过，日志保存在`analysis/test-runs/r1-remaining-20261115/`。
- 完整`test:all`首跑剩余的五项逐一复现并修复，未把任何一项标记为flaky：诺言符文90201和圣器89709改由测试使用生产`featureOverrides.set()`单服`force_open` 1201/1195；QuickSDK的POSIX `0600`断言只在支持该权限语义的平台执行，Windows仍核验UID/token哈希及敏感字段不落盘；活动20001的百抽块被后执行的开服宝箱同步覆盖，现改为追加独立ETF记录块，`open-server-box-service.test.mjs`同步按多块流解码；战斗报告测试原错误假设2010101带护盾，现加入真实拥有回合开始护盾的1020601（`6102060102`）并保留严格`101→109→102`窗口断言。
- 六个相关文件联合复跑45/45通过。最终完整`npm --prefix personal-server run test:all`为3215通过、0失败、2条件跳过（3217项，636955.5814 ms），日志为`analysis/test-runs/r1-remaining-20261115/final-test-all-after-regression-fixes.log`；`npm --prefix personal-server test`为482通过、0失败、2条件跳过（484项，96296.3613 ms），日志为`analysis/test-runs/r1-remaining-20261115/final-fast-test-after-regression-fixes.log`。
- 最终`check:command-dispatch`仍为total 1407/serviceRoute 1383/gatewayRoute 18/multiOwner 6/unrouted 0；`build-detailed-rule-docs --check`、`verify-detailed-rule-docs`与`git diff --check`均通过。

### 分层验收

| 层级 | 当前结果 |
| --- | --- |
| 原证据已闭合 | 各组表/PB/客户端调用链和缺失函数已独立复核并保存；25条成功链均未闭合 |
| R1 推定 | 本轮新增0条；没有用推定补造成本、候选、奖励、返还或状态 |
| 服务端完成 | 25条均为失败关闭，0条成功链完成 |
| 离线 TCP | 25条逐条GameError(5)、状态不变已验；专项还覆盖各组真实临时TCP拒绝路径 |
| 存档/重开 | 因无成功写入不能做成功存档/重开验收；拒绝前后状态一致已验 |
| APK | 未验收；本轮未操作ADB/APK |
| 生产 TCP / 生产库 | 未读写、未验收 |
| 部署 | 未执行 |

新账号首次登录、创角、引导、首战、重登和SQLite持久化实机游玩属于独立验收阶段，需要用户另行授权启动服务与操作APK；本轮离线测试不能替代该阶段，也不能承诺未验收环境没有bug。
