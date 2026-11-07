# 剩余玩法计划：下一 session 总控续接提示词

## 可直接使用的提示词

```text
项目 F:\projects\FateCovenantClone。继续完成 docs/plans/remaining-gameplay-20261106/ 的剩余实施计划，你担任总控，
按明确任务 ID 派发独立 worktree 的 agent，并负责真实接入、代码复核、冲突处理和最终验收。不要只交计划，
不要把已完成任务重新实现，也不要等待旧 agent。

开始先读：
1. 当前 AGENTS.md
2. promot/2026-11-07-remaining-gameplay-next-session.md（本文件）
3. docs/plans/remaining-gameplay-20261106/README.md、11-dispatch-and-acceptance.md、execution-status.md、task-index.md
4. 正在续接任务的卡片与 agent/workflow/gameplay-completion/<任务ID>/implementation.md

核对实际 Git/工作树后调整本快照，不覆盖后续新增代码。当前主线：main@b5a44f0。
最新业务源码全量：personal-server npm test = 2311 tests / 2309 pass / 0 fail / 2 skipped，
日志 analysis/test-runs/gameplay-20261106/main-after-batch2-full.log。仅文档变更不必重跑全量；
新业务合并后跑相关回归，最后再跑一次全量。

按实际平台容量并行（上限 4 个执行线程 = 总控 + 3 个 agent），每次派发明确任务 ID，
定期检查进度，不无限等待空转任务。合并前工作树干净、rebase 最新 main、
git merge-base --is-ancestor main HEAD 与 git diff --check main..HEAD 通过，
并确认未删除主线已有登录、路由、迁移与既有修复。总控负责可审阅合并与冲突逐项保留双方业务。

不启停实时服务，不读写 runtime.local-only.data 或运行数据库，不操作模拟器/ADB/APK，
不连接原游戏服务器。仅使用临时 loopback TCP 和临时 SQLite 测试。
缺证据时继续独立可证部分，不猜协议号、奖励、战斗规则或全服数据；
区分部分交付、证据待补、服务端验收和 APK 验收。
```

## 已合入主线的本轮成果（2026-11-07 两次派发，共 6 项）

- main 现为 `b5a44f0`，工作区干净。本轮六个分支均已 `--no-ff` 合入并跑过合并后定向回归。
- 全量：tests 2311 / pass 2309 / fail 0 / skipped 2，时长约 233s，日志
  `analysis/test-runs/gameplay-20261106/main-after-batch2-full.log`。

| 任务 | 分支 | 合并位置 | 合并后定向 | 状态 |
| --- | --- | --- | ---: | --- |
| CORE-BATTLE-A | `task/CORE-BATTLE-A-20261107` | 早于 ea31832 | 127/127 | 服务端完成，B/C 待补 |
| SOC-FRIEND | `task/SOC-FRIEND-20261107` | d1701a2 | 35/35 | 服务端完成（无登录槽） |
| PLAY-FISHINGACT | `task/PLAY-FISHINGACT-20261107` | 3b2d8fa | 28/28 | 服务端完成 |
| PLAY-HELPUPACT | `task/PLAY-HELPUPACT-20261107` | 1e6dfe9 | 37/37 | 服务端完成 |
| BATTLE-ELITEMISSION | `task/BATTLE-ELITEMISSION-20261107` | 9c554fa | 55/55 | 服务端完成（需注入敌方） |
| PAY-GROUPBUYACT | `task/PAY-GROUPBUYACT-20261107` | d79c2bd | 72/72 | 服务端完成 |

关键实现与坑：

- CORE-BATTLE-A：新增 `actionScopedType()`（`game/effects/effect-executor.mjs`），触发相位不继承外层动作类型；
  伤害转治疗/护盾（`percent-damage-dealt`）固定后置；`recordActionDamage` 只累计 action 相位。
  后续改 `battle-engine.mjs`/`game/effects/*` 前必须先读该任务 implementation.md。
- SOC-FRIEND：`game/friend-service.mjs`（20001–20013）+ `config/friend-tables.mjs` + 资产
  `assets/tables/FriendTable.data.lua.json.gz`；数字登录槽位未取证，`loginPayload()` 已就绪但未进登录容器；
  2200/2202 推送载荷未取证；20012 过滤语义、20013 举报语义、友情点发放触发点为缺口。
- PLAY-FISHINGACT：`activity-read-service.mjs` 钓鱼分支与 `fishing_act_catches` 表；
  gateway 对 110303/110308/110309 用 `fishingEtfTypes` 解 ETF 活动 id 后透传。
  110308 筛选/上限、活动结束名次结算、FishBuy 直发鱼竿仍缺证据。
- PLAY-HELPUPACT：`activity-read-service.mjs` 助力分支 + `config/help-up-act-tables.mjs` +
  `assets/tables/HelpUpActTable.data.lua.json.gz`；登录数据写模块 92 活动条目，
  gateway 登录路径新增 `activityRead.synchronizeHelpUpLogin(activity, loginSeconds)`。
- BATTLE-ELITEMISSION：新增 `game/elite-mission-battle.mjs`，`mission-fight-service.mjs` 增加
  可选 `eliteBattle` 与导出的 `reportBattle(..., encounter)`，201/202/207 分流；
  精英敌方阵容无表证据，必须由 `createLocalGame({ eliteEnemies })` 注入，缺省 err 5。
- PAY-GROUPBUYACT：新增 `game/group-buy-act-service.mjs` + `config/group-buy-act-tables.mjs` +
  `assets/tables/GroupBuyActTable.data.lua.json.gz` + `tools/extract-group-buy-table.mjs`；
  100601 从 `recharge_orders`+`local_wallets` 聚合人数并叠加 HeadCompensate，
  100602 同事务发奖，16005 回执追加 flag=93。
- gateway.mjs 是合并热点：登录活动区必须同时保留 helpUp 与 groupBuy 两条同步；
  派发区保留 friend（20001–20013）、fishing ETF、elite battle 注入、groupBuy、以及全部既有数字 type。
  合并冲突只逐行解决，禁止整文件覆盖。
- 主线在本轮曾三次被外部推进：9593baa（代金券/每日折扣修正）、0c4f84e（v10 APK 文档）、
  28a1a53（普通招募池排除限定英雄），均已保留。下一轮仍要先 `git log/status` 核对，
  预计 main 可能继续前进。

## 剩余计划盘点（main b5a44f0）

完整分母 355 项 = 276 模块 + 7 共享 + 72 英雄技能。当前 21 个模块 + 3 个共享任务有实现交付（24/355≈6.8%），
其中多数带证据缺口；**尚无任务达到"只差 APK 操作"的整卡状态**，任何 APK 验收都为 0。

各分区剩余（模块任务）：

| 分区 | 总数 | 已交付 | 剩余 | 已交付任务 |
| --- | ---: | ---: | ---: | --- |
| 01-battle | 33 | 4 | 29 | BATTLE-PEAKTOWER、BATTLE-RANK、BATTLE-GENERALDUNGEON、BATTLE-ELITEMISSION |
| 02-heroes-lineups | 15 | 3 | 12 | HERO-LINEUP、HERO-HERO（部分）、HERO-MASTERY |
| 03-equipment-development | 16 | 0 | 16 | — |
| 04-items-tasks-shops | 22 | 9 | 13 | ITEM-SHOP/ITEM/EVERYTASK/MISSION/COMMONTASK/GUIDE/RANKACHIEVE/GROWTHROAD/FIRSTWEEKGOAL |
| 05-social-guild | 33 | 1 | 32 | SOC-FRIEND |
| 06-draw-activities | 31 | 0 | 31 | —（CORE-DRAW-POOLS 属共享任务） |
| 07-exploration-minigames | 29 | 2 | 27 | PLAY-FISHINGACT、PLAY-HELPUPACT |
| 08-festivals-tasks | 32 | 0 | 32 | — |
| 09-commerce-benefits | 53 | 2 | 51 | PAY-ONLINEGIFT、PAY-GROUPBUYACT |
| 10-role-and-supporting | 12 | 0 | 12 | — |

共享任务（7）：CORE-ATTR 部分完成（属性查询/战力/普通副本同源，装备等来源未汇入）；
CORE-SKILL-GATES 部分完成（AbilityLevel/mastery/soul 已接，通用 Passive 突破筛选与每级倍率缺）；
CORE-BATTLE-A 已完成，CORE-BATTLE-B/C 未开始（C 依赖 `pb_fat_harm` 治疗 type/prompt 证据）；
CORE-EVENTS 部分交付（53001/53002 未知推进拒绝，53006/周期/结束结算缺）；CORE-DRAW-POOLS 证据待补
（226 常驻幻武 60101/60102、神灵 56 组 lib_range 空）；CORE-TIME-TEMPLE、CORE-CABIN 未领取。

英雄技能：`13-special-skills.md` 的 72 个 SKILL-* 任务（277 条近似/待调查引用）全部未按计划实施。

## 已建工作树（本轮中断前创建，均为空且干净，可直接复用）

- `F:\projects\FateCovenantClone\.worktree\gameplay-20261106\hero-hero2`
  分支 `task/HERO-HERO-B-20261107`，HEAD=b5a44f0，无提交。
- `F:\projects\FateCovenantClone\.worktree\gameplay-20261106\soc-msg`
  分支 `task/SOC-MSG-20261107`，HEAD=b5a44f0，无提交。
- `F:\projects\FateCovenantClone\.worktree\gameplay-20261106\draw-hundred`
  分支 `task/DRAW-HUNDREDDRAWACT-20261107`，HEAD=b5a44f0，无提交。

上一轮中断时只发出了 hero-hero2 的 agent，未产生任何提交或未跟踪产物；soc-msg / draw-hundred 未派发。
下一 session 直接派新 agent 到这三个工作树，不要重复 `git worktree add`。

## 下一轮执行顺序（建议）

1. 先看是否有旧 agent 消息（上轮已中止，不可等待）；核对 main 与三个工作树状态。
2. 第一批三并行（工作树已建好）：
   - `HERO-HERO-B`：补齐 HERO-HERO 卡剩余命令（602、627–631、634、635、637、641、651、652、654、656、661、666、672、673 等，
     以任务卡表格与当前源码为准；保留 636/638/639/640、614/647/663/664/665、图鉴/训练/招募）。
   - `SOC-MSG`：10501–10505 等频道加入/发言/历史/跨服消息/玩家信息；可复用 SOC-FRIEND 的角色与关系数据。
   - `DRAW-HUNDREDDRAWACT`：117001–117005 百抽、进度奖、自选、升星奖、跑马灯（`activity-read-service.mjs` 117005 现为空）。
3. 每个 agent 完成即通知总控；总控复核 diff、rebase、合并、跑定向回归，再排下一批：
   优先 `SOC-CHAT`/`SOC-GUILD`、`CORE-BATTLE-B/C`（需先补 pb_fat_harm 证据）、`EQUIP-*` 16 项、
   其余 DRAW/PAY 活动（`PAY-DRAGONLANDACT`、`DRAW-ARTIFACTDRAWACT`、`DRAW-DEMIGODACT` 等），
   最后再进入 72 个 SKILL-* 任务。
4. 每次合并后跑相关回归；全部业务合并完成后在 personal-server 跑一次 `npm test`；
   新增运行资产/部署依赖才跑 `npm run test:deployment`。不要并发跑两个全量。
5. 更新 `docs/plans/remaining-gameplay-20261106/execution-status.md` 与每卡 implementation.md，
   分别记录服务端、TCP、SQLite、证据缺口与 APK 边界；不把"服务端完成"写成"可玩完成"。

## 必须保留的主线修复

- 96d4c18：207 战斗结算/体力同步；4ee1f8b：新邮件推送刷新；7b5af58：活动/fishing 登录期限。
- `mission-fight-service` 的 module 8 多槽；`task-service` 的 module 90 通用槽 0–3、线性槽 4；`game-store` 既有迁移。
- gateway 登录同时保留：`onlineGift.beginSession()`、`rankAchieve.ensureLoginState()`、
  `heroExtra.ensureLoginState()`、`firstWeekGoal.loginPayload()`、`growthRoad.ensureLoginState()`、
  `activityRead.synchronizeHelpUpLogin()`、`groupBuyAct.synchronizeLogin()`，以及 1316、67004/67005、
  69001/69002 和此前所有数字 type 派发。
- 本轮技能 loadout/显式空数组/metadata fallback 修复、活动拒绝分支、draw 生产审计、
  CORE-BATTLE-A phase 作用域与伤害转治疗/护盾、BATTLE-ELITEMISSION 的 201/207 分流、
  PAY-GROUPBUYACT 的 16005 flag=93 增强。

## 操作限制

只维护 personal-server 与隔离客户端范围。当前阶段不得启停实时服务、读写 `runtime.local-only.data`、
操作模拟器/ADB/APK、连接原游戏服务器。测试仅临时 loopback 端口与临时 SQLite。
没有新设备授权不做 APK 验收或快照；纯服务端变更不制造新 APK。
使用 PowerShell，检索优先 rg，手工编辑用 apply_patch。新运行资产收纳到 `personal-server/assets`。
用户和其他 agent 已有改动必须保留，不用 `reset --hard`、`checkout --` 或整文件覆盖解除冲突。

## 换 session 保存结果（本文件生成时）

- main=b5a44f0，工作区干净；本轮 6 项已合入，全量 2311/2309/0 fail/2 skipped。
- 三个新工作树已创建但无提交，可直接复用。
- 未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK、未生成 APK。
- 本提示词与 execution-status.md 同时提交；下一 session 以 `git log` 实际状态为准，不把本段 PID/提交当永久值。

