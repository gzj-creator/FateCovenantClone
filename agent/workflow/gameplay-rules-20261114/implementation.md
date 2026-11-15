# 2026-11-14 原版玩法修复、取证与完整玩法运营文档

## 范围与用户约束

用户要求修复首章敌人/蜜雪儿、败北敌战力0、新号2-1阻断、引导赠角未发、1级名人堂引导，并排查其他玩法偏差。随后要求写完整详细玩法与运营文档，补充“除代金券系统外都1:1还原原游戏细节”。本次同时交付局部业务修复、离线显示候选、旧档工具、详细文档及可核证据，原问题按组件/TCP/存档/APK/发布分别验收，不以文档或服务端测试销项。

工作树基线`main@8135c8a20c34aa10fa89b4f99d72f71bd289099d`，未提交Git。`.codex/config.toml`既有修改保留。现有并行专项分别处理败北战力、Guide旧档、名人堂，主线程整合关卡链与文档。没有连接、请求或重放原服，没有部署/重启实时服务、读写活跃玩家库或修改/安装APK。本轮早期仅通过REA只读获取一张设备截图，未点击或启停客户端。

采用[reverse-engineer-anything技能](../../../.agents/skills/reverse-engineer-anything/SKILL.md)读取已有原客户端LuaJIT产物和复用静态/运行证据。未将普通源代码审计误当必须重新初始化REA的任务。尝试原生反编译的诊断未取得可用结果，后续使用本地字节码解析，不以失败输出推导玩法事实。

## 关键取证与纠错

1. 旧mission-tables直接使用Section.enemy，旧mission-fight-service按玩家均值×0.88与玩家最高等级造怪。地图展示不是实际敌阵，用户对首章首领的质疑成立；本轮已替换普通主线守方路径。
2. 原Fight/Team第0分片各988行，可经安全直线解释读取。旧readGeneratedDump将register0共享表当field map，导致有key但row为空，旧“原版不带Fight403”等结论不成立。当前文档生成器直接定位field→ordinal常量，并与调查JSON逐行比对一致。
3. 10205→Fight105→Team105→NPC3030500，relation_hero3030501蜜雪儿、loc5、Fighter10505.is_boss=true/view_custom120，NpcAttr20基础HP864/攻击216。2-1为Fight201/Team201，NPC[9301600,9301600,9301600,9105000]、loc[1,2,3,5]、NpcAttr12基础HP474/攻击119。NpcAttrRatio查NPC tid×10；固定调整{type,value}直接乘，pair倍率除10000。Team91102已提取，其强制替换玩家攻队的运行语义未证明。
4. GuideTable.Process141、Step718、Award16、Const1读取成功。Award1的award_i[1020601]/award_n[1]，Award2为2020601×1。Step106004/110004属于Process104/108，先请求奖励后HandleOver，不应要求奖励步骤key先完成。
5. 旧guide-awards生产配置为空。实际日志08:50:17.740Z出现guide_award_unconfigured award1，之后10205仍2名攻方，20201三次1回合败北；这是可复现阻断。现已恢复原配置与资格：Award1在10202通关后，Award2在20201通关后，不能提前发第二角。10201/10203已弃用，有效首段为10202→10204→10205→10206剧情→20201。
6. 原结果页GetDefTeamPower读NpcAttr.power×NPC数，同版NpcAttr1–47.power均0，2-1因此静态算0；只改服务端def_power不足以证明界面修复。名人堂Fun1218原条件已恢复为角色等级≥32且开服日≥2，模块开关161；用户1级弹窗的实际入口仍未定位。
7. 当前技能目录76英雄、1076引用，277条requiresInvestigation、75条project-fallback；普通被动装配catalog-passive-unmapped仍未完成突破解锁关联。
8. 仓库三服unit的数据目录rollover与deploy脚本默认live-20261112不一致；只登记，线上实际unit/override未读取，不擅改生产路径。

## 文档交付

入口：[玩法与运营总目录](../../../docs/gameplay-operations/README.md)。10章覆盖还原标准、新手主线、战斗属性技能、英雄编队与养成、资源任务招募商城、全副本竞技社交公会、活动、运营SOP、问题验收与数据管理。附录含297协议分组、1407命令、523功能、16奖励、完整141流程/718步骤的可读表与原JSON、前四章26节点（标弃用/剧情）、来源哈希；未知规则不编原版数值填满文档。

更新docs/README，移除把已取消Unity路线当当前下一步的指令；旧文档继续可读。personal-server/README与根AGENTS补当前入口和唯一代金券例外。用户询问“支付设施不构成授权”的表述后，改为明确玩法口径：“代金券保留定制，其他商品与充值规则按原版还原”，不增加用户确认流程。

## 可复现命令

在项目根目录PowerShell：

```powershell
npm run check:command-dispatch --prefix personal-server
npm run audit:command-dispatch --prefix personal-server
node tools/build-gameplay-doc-evidence.mjs
```

首次check提示审计过期；运行audit后统计不变，只有gateway/catalog输入SHA256更新。该审计使用临时SQLite实例，不连接实时服务。更新后的源码基线与证据hash见[manifest](../../../docs/gameplay-operations/appendices/evidence-manifest.json)。生成器运行正常，并重新解释原Fight/Team，验证与调查结果一致。

派发统计：total1407、serviceRoute1323、gatewayRoute18、multiOwner6、unrouted60、requestEncodingMismatch172、requestEncodingUnverified982、responseRuntimeUnverified1407、responseSchemaMissing223。编码冲突为启发式审计提示，未逐命令确认，不直接定性172条实际故障；responseRuntimeUnverified是本静态审计的口径，不否认单独历史TCP证据。

附录生成器已改为复用read-fight-shard，核26个来源分片SHA256并逐行比对Journey资产：Fight3566/Team10744/Fighter4518/AttrAbility1099。Guide四族也与打包资产逐行比对。523规则ready176/gap347，8条Show保持缺口。最新链接/哈希、业务和全量结果见后文验证记录，不沿用早期纯文档阶段18文件/378链接或15来源数字。

## 本地证据路径

- 原Lua：`analysis/scratchpad/time-temple-20261108/project/`。
- GuideTable：`424837726185043140-GuideTable.data.lua.bin`，完整SHA256见manifest。
- Fight：`12324766054510731000-FightTable.Fight.0.data.lua.bin`。
- Team：`1879999098001760500-FightTable.Team.0.data.lua.bin`。
- 调查行：`analysis/scratchpad/game-rules-20261114/fight-team-0.json`。
- 实际新手事件：`analysis/experiments/local-new-user-debug-20261114-1425/server-data-01/events.jsonl`，只摘必要字段，不复制账户和敏感payload。
- REA只读截图：`analysis/scratchpad/game-rules-20261114/rea/screen.png`，SHA256`09c7b8be6c4d4afbbe54e84e72cee40d79e0d7438c307fe82e45eee98b952e30`，1440×2560；本轮不将它记作修复后截图。

## 遗留与下一工作

按[问题验收清单](../../../docs/gameplay-operations/09-defects-and-acceptance.md)继续：NPC精确技能/AttrAbility、玩家被动突破门槛、基础伤害/速度/怒气兼容值、Fight102固定攻方、其他encounter与多队报告、1级实际弹窗入口、后续Guide触发和100614400处理器、真实受影响存档、APK失败/重登及发布。所有不可达或未取证内容单列，不能用永久关闭代替还原。

## 本轮业务修改

### 普通主线

新增tools/read-fight-shard/extract-journey-rules、JourneyFightTable资产/reader；mission-tables与mission-fight-service接resolveFightTeam守方。外观走Npc.relation_hero，战报保留原NPC/role_type2、loc和TeamID×100+loc的FighterID。移除普通主线地图造阵、玩家均值缩放、最高等级和借邻关；战报FightID取Section权威配置，错fight_tid不能换关。普通主线多队暂明确拒绝，不能丢波次。

NPC技能ID保留Npc_Ability/Fighter.add_ab，模拟侧不装同名可玩英雄全部后期被动。精确技能/AttrAbility增量尚未实现，其他encounter仍有旧兼容路径。固定攻方曾试接后使首战必败，因没有原服战报证明强制替换语义已撤销。Team91102.loc2应取9110202但缺行，不能借9110201替代或放水。FirstFightCustomize只绑定GuideAnimScene90022/90023，Custom102.custom_star无已证主线增强消费者，不是必胜依据。

### Guide与旧档

生产readGuideAwards从原资产加载16奖；已恢复路径检查真实前驱/功能/前key，移除先存本领奖key前提。英雄/资源变化、原MSB-first领取位与claim同事务提交，编码或SQLite失败全回滚。8000验证归属、中间is_over=false、末key才true，旧请求不倒退；共享key的替代Process各自保存。Award3–10/12/13缺触发，Award15的100614400缺处理器，明确拒绝且不消费资格。

新增game/guide-award-repair、scripts/repair-guide-awards和8项专项。默认脱敏预览，仅离线补合法通关后的原Award1/2；位图或claim已领即跳过，已有英雄但无领取证据标review_existing_hero。工具不启动createGameStore迁移，保存全库逻辑指纹、SQLite一致备份（支持WAL）、完整性/外键检查、副本演练，提交前校验源与演练后指纹。正常养成、资源、格子、编队、guides、原英雄protobuf字节保留；guide_award_repairs存来源，二次发放0。

```powershell
node personal-server/scripts/repair-guide-awards.mjs --database <离线.sqlite> --output <plan.json>
node personal-server/scripts/repair-guide-awards.mjs --database <离线.sqlite> --apply --plan <plan.json> --backup-dir <独立备份目录> --confirm-offline
```

可重复--role <ID>。邻近状态文件PID活跃时在打开库前拒绝。真实故障目录当时PID7108活跃、WAL持续写；本轮没有打开该库或生成其预览，不能称离线快照或已补发。

### 功能开放与首号登录

提取器支持TNEW空MethodScript参数，索引1014→1880，多断言按原AND；7000重核ready规则，早开1218返回fail_id_list，1054等未恢复表达式继续客户端确认。7201逐完整funId通知、extra为空。真实临时空服TCP发现创角前features.openIds断线，现仅ready阶段执行功能门禁，登录前白名单不变。已有错误位不自动清，1级实际弹窗未闭合，详见[专项调查](fame-hall-investigation.md)。

### 败北显示离线候选

新增patch-defeat-power-lua/test-defeat-power-lua/build-defeat-power-bundle，锁32/64原脚本hash。原静态战力不大于0时取最终队战报正数def_power；原正数/倍率路径不变，fallback不重复倍率，零/负/缺失不填常数。18/18离线指令测试，两候选各10928 TextAsset核验、只有目标脚本变动。未运行客户端Lua或生成/安装APK，容器重建未验装载，也没有原服正数算法证据。详见[补丁记录](defeat-power/README.md)。

## 业务验证与扩大回归

独立主线/解析32/32、Guide三文件30/30、旧档8/8、名人堂关联44/44、败北离线18/18已通过。新增journey-fidelity两项通过：独立常量核蜜雪儿NPC/Fighter/位置/HP、2-1四NPC/HP/战力，玩家升级/换队不改守方；临时新库正常201/207→Award1→中间key→重开库→209上阵→10204→蜜雪儿→剧情→2-1单人合法败北（不推进/不发胜利奖/重复207不二扣）→重登三人队获胜→才领Award2→上阵/重登。英雄全程1级，无后台加级、送强角或削怪。这是当前服务端闭环，不代替原技能/伤害和APK全程验收。

首轮test:all在旧multi-realm测试清理钩子挂起，已中断，以60000ms测试超时和test-force-exit重跑，并在干净8135c8a worktree对照。不能把中断日志称全量通过。旧lifesteal测试假定回复必等于10%伤害，原固定敌人下缺失HP更少，现断言实际回复min(缺失HP,floor(实际HP伤害×10%))，未改引擎或怪物迎合测试。最终全量/基线、部署、链接/哈希结果在本节后续记录，以实际日志为准。
