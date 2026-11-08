# E2 社交后半：公会、跨服与协作实施记录

日期：2026-11-08

分支：`task/BLOCK-E2-20261108`

起点：`8ebd5a1`（`docs(plan): split remaining cards into 13 focused work blocks`）

范围：[三大块 E2](../../../../docs/plans/remaining-gameplay-20261106/15-three-work-blocks.md) 的 #107–#119，共 13 张模块任务、154 条静态目录中缺失的命令。

## 覆盖结果

154/154 条命令都进入显式服务路径，且命令 ID 在所有 E2 服务之间唯一。153 条执行当前服务端业务状态机；`105805` 因出货 protobuf 没有响应 schema，显式返回业务错误码 5。既有 `99229` 继续归 `guild-nation-assist-service`，没有第二个所有者。

| 任务卡 | 模块 | 命令 | 服务 | 交付结果 |
| --- | --- | --- | --- | --- |
| SOC-GUILDBOSS | `GuildBossCmd` | 91301–91312（12） | `guild-boss-service.mjs` | 加入、技能伤害、阶段/排行、伤害/技能奖励、每日物品、箱子、在线奖励与购买 |
| SOC-GUILDJOINT | `GuildJointCmd` | 91601–91625（25） | `guild-joint-service.mjs` | 怪物/门/箱/矿脉、任务、先锋/焦点、单体战斗、自动、排行与结算 |
| SOC-GUILDRUNESTONE | `GuildRuneStoneCmd` | 92701–92703（3） | `guild-rune-stone-service.mjs` | 真实符石穿戴、卸下、合成和槽位持久化 |
| SOC-GUILDGVG | `GuildGVGCmd` | 97001–97018（18） | `guild-gvg-service.mjs` | 矿点、怪物、区块、据点、PVP、任务、传送门与撤离 |
| SOC-GUILDVOTE | `GuildVoteCmd` | 98702、99701（2） | `guild-vote-service.mjs` | 发起、投票、结果与周期奖励 |
| SOC-SLGMAP | `SlgMapCmd` | 99100–99102（3） | `guild-slg-map-service.mjs` | 区块视野、进入和离开会话 |
| SOC-GUILDNATION | `GuildNationCmd` | 99200–99228（不含 99229）、99230–99264（64） | `guild-nation-service.mjs` | 建造、兵种、科技、城防、据点、任务、行军、集结、旗标、援助和奖励 |
| SOC-GUILDBARGAIN | `GuildBargainCmd` | 101401–101404（4） | `guild-bargain-service.mjs` | 活动信息、砍价、购买和未砍价名单 |
| SOC-GUILDEXPEDITION | `GuildExpeditionCmd` | 101601–101615（15） | `guild-expedition-service.mjs` | 宣战、鼓舞、战报、排名、竞猜、位置、点赞、战斗与城市列表 |
| SOC-CHANNELENTRY | `ChannelEntryCmd` | 102801（1） | `channel-entry-service.mjs` | 从通用空应答迁移为配置化入口回包 |
| SOC-GUILDHUNT | `GuildHuntCmd` | 103401–103403（3） | `guild-hunt-service.mjs` | 参与、支援与服务器猎物状态 |
| SOC-GUILDCRUSADE | `GuildCrusadeCmd` | 105805（1） | `guild-crusade-service.mjs` | 显式拒绝；回包 schema 缺失，不伪造排名 |
| SOC-GUILDAUCTION | `GuildAuctionCmd` | 107601–107603（3） | `guild-auction-service.mjs` | 竞价、前手退款、心愿、结算与唯一领奖 |

路由位于 `personal-server/game/gateway.mjs`。`102801` 已从原通用空应答分支移除，`108` 的 UI 确认行为不变。服务在网关中位于最终 unsupported 分支之前，并通过 `supports()` 逐命令选择；回调失败只返回对应 `err`，不会写入未提交的业务状态。

## 权威状态与事务

公会身份来自登录模块 24 的 `pb_res_guild_login`。每个命令都要求公会 id、成员列表和当前角色成员关系有效；无公会返回 7，登录模块缺失或无法解码返回 5。该模块与既有 21005–21010 公会路径共用，不另建公会身份副本。

共享存储实现在 `personal-server/game/guild-coop-shared.mjs`，首次使用时幂等建表：

| 表 | 主键/内容 | 用途 |
| --- | --- | --- |
| `guild_coop_docs` | `(scope,guild_id,role_id,doc_key)`，JSON payload | 模块地图、赛季、建筑、科技、排名与角色进度 |
| `guild_coop_claims` | `(scope,guild_id,role_id,claim_key,period)` | 日/周/赛季奖励幂等领取 |
| `guild_coop_events` | 自增事件日志 | 从真实操作汇总伤害、积分和公会排名 |

奖励与消耗统一经 `grantResources`/`consumeResources` 写入既有角色资源和模块状态。业务文档、领取位、事件和资源在同一个 `store.transaction()` 中提交；任一 protobuf/ETF 编码或 SQLite 写入失败会回滚整笔事务。角色排行以登录公会成员为分母，未行动角色保持零分，不预置虚假分数。

BOSS、联合探索、GVG 和远征的伤害使用当前真实阵容战力经 `buildLineupAttrInfo()` 计算，再乘本地策略百分比；不是原服战斗公式。所有配置集中在 `personal-server/config/guild-coop-tables.mjs`，文件头明确区分协议证据与本地政策。

## 验证

专项文件：`personal-server/test/guild-coop-services.test.mjs`。修正每日技能次数重复计数及拍卖 u64 角色 ID 转 Number 后，专项为 6/6：

1. 154 条命令恰好唯一，`99229` 不被新国战服务接管，`105805` 返回 code 5。
2. BOSS 真实战力伤害、伤害奖励、幂等领取与 SQLite 重开。
3. 联合探索、符石、投票和 SLG 的状态转移。
4. GVG、砍价、狩猎和拍卖的权威资源/领取。
5. 远征、频道和国战建造/兵种/科技/援助。
6. 真实临时 TCP 握手、`909103` 登录和帧编解码覆盖 BOSS、联合探索、频道入口。

分支完整套件退出 0：tests 2550、pass 2548、fail 0、cancelled 0、skipped 2、todo 0，duration_ms 349260.9469。日志为 `analysis/test-runs/gameplay-20261106/e2-social-coop-branch-full.log`。全部新增/修改 JavaScript 文件通过 `node --check`，`git diff --check` 通过。

rebase 到 main `2561103` 后，E2 定向回归发现 A2 合并带入的 `arena-contest`、`hunter-arena`、`overall-match` 与 `play-match` 建表 SQL 缺少右括号，登录会以 `incomplete input` 中断。修复提交 `7ada31d` 只补齐这些语句，并以 `guild-coop + gameplay-gateway + m5-command-matrix` 定向 `22/22` 验证；`120001` 与 `98900` 另做 SQLite 建表/执行烟测，输出为 `{"overallBytes":2,"overallType":1,"playTid":1}`。最终主线全量回归将在合并后补录。

E2 业务提交 `ff813e8`、A2 建表修复 `7ada31d` 与文档提交 `cad6a46` 已于 `85c39dd` 以 `--no-ff` 合入 `main`。合并后主线全量退出 0：tests 2706、pass 2704、fail 0、cancelled 0、skipped 2、todo 0，duration_ms 453066.9223；日志为 `analysis/test-runs/gameplay-20261106/main-after-e2-social-coop-full.log`。

本轮未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未连接模拟器/ADB，也未生成或替换 APK。

## 证据缺口

- `GuildCrusadeCmd:105805` 的请求只有 ETF，且 `pb_guild_crusade_rank_rsp` 不在出货 protobuf 中；必须取得 schema、排名来源和真实帧才能完成。
- 大量 ETF 命令只有静态目录、客户端调用形状或反汇编证据，尚未取得原服逐命令录制。服务端会解码并校验可识别的参数，但不能据此证明原服错误码和边界语义完全一致。
- 配置中的 HP、刷新周期、成本、价格、奖励、建筑/科技时长和排名档位都是本地策略；本轮没有恢复客户端 `Guild*Table` 的权威数值。
- 地图战斗、怪物、据点、城市和拍卖当前是服务端状态转移与真实资源事务。原服完整战报、跨成员并发结算、跨服匹配和公会聚合未复现。
- E2 未恢复任何新增推送载荷，也没有验证多客户端同时操作。`guild_coop_events` 能避免预置排名，但不能替代原服的锁、撮合和跨服事务证据。
- 当前只完成服务端与临时 TCP/SQLite 验证；13 张卡均未进入 APK 操作验收。

## 复现

在 `personal-server` 执行：

```powershell
node --test --test-concurrency=1 test/guild-coop-services.test.mjs
npm test
```

静态路由检查和 JavaScript 语法检查：

```powershell
Get-ChildItem game/guild-*-service.mjs,game/channel-entry-service.mjs,game/guild-coop-shared.mjs,config/guild-coop-tables.mjs,test/guild-coop-services.test.mjs | ForEach-Object { node --check $_.FullName }
git diff --check
```
