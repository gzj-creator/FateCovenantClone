# 块 A2 交付记录：战斗 PVP、竞技、锦标赛与三消

2026-11-08 派发并完成。范围是[工作块总览](15-three-work-blocks.md)中的块 A2（#18–#33），共 16 张任务卡、147 条未路由命令。
本块按“实现即提交、不验收”的授权执行：子 agent 只做实现、`node --check` 与 `git diff --check`，不跑 `npm test`、不写真实 TCP/SQLite 证据、不启停服务、不操作设备。全部验收与修复转交验收 agent。

## 分支与工作树

| 组 | 分支 | 工作树 | 基线 | HEAD |
| --- | --- | --- | --- | --- |
| arena | `task/A2-ARENA-20261108` | `.worktree/gameplay-20261108/a2-arena` | `8ebd5a1` | `4b9a0cf` |
| martial | `task/A2-MARTIAL-20261108` | `.worktree/gameplay-20261108/a2-martial` | `8ebd5a1` | `40ea227` |
| trimatch | `task/A2-TRIMATCH-20261108` | `.worktree/gameplay-20261108/a2-trimatch` | `8ebd5a1` | `50735aa` |
| overallpvp | `task/A2-OVERALLPVP-20261108` | `.worktree/gameplay-20261108/a2-overallpvp` | `70de346` | `c17622c` |

四条分支都只做纯新增网关接线：import、服务实例、以卡 ID 注释标记的派发块、登录同步；没有重排既有派发区。合并时的冲突集中在 `personal-server/game/gateway.mjs` 的 import 与登录同步段。

四条分支均无未提交业务改动；`a2-trimatch` 工作树残留未跟踪的 `analysis-tmp/`（临时取证脚本），未进入任何提交，可直接删除。

## 覆盖情况

合计 16/16 张卡、147/147 条命令有网关路由。其中 136 条走真实状态与奖励路径，11 条按缺证明确 fail closed（返回业务错误码或明确拒绝，不伪造数据）。

| 卡 | 命令 | 覆盖 | 提交 |
| --- | --- | ---: | --- |
| BATTLE-SWAPARENA | 4031–4040 | 10/10 | `19e3a01` |
| BATTLE-ARENACONTEST | 83301–83315 | 15/15（83313/83314 fail closed） | `d22b131` |
| BATTLE-HUNTERARENA | 84001–84011 | 11/11（84005 fail closed） | `2289498` |
| BATTLE-PLAYMATCH | 98900–98901 | 2/2 | `4b9a0cf` |
| BATTLE-OVERALLMATCH | 120001 | 1/1 | `4b9a0cf` |
| BATTLE-MARTIALCLUB | 84401、84404–84426 | 24/24 | `304ee73` |
| BATTLE-MARTIALCLUBACT | 84431–84432 | 2/2 | `6dbc37a` |
| BATTLE-TOURNAMENT | 88501–88511 | 11/11 | `baff4af` |
| BATTLE-TOPARENA | 98500–98602 | 18/18 | `40ea227` |
| BATTLE-BATTLETRIMATCHHERO | 112001–112002 | 2/2 | `9fe9a53` |
| BATTLE-BATTLETRIMATCHEQUIP | 113001–113003 | 3/3 | `9fe9a53` |
| BATTLE-BATTLETRIMATCHLINEUP | 114001–114005 | 5/5 | `9fe9a53` |
| BATTLE-TRIPLEMATCHFIGHT | 115001–115006 | 6/6 | `dece577` |
| BATTLE-TRIMATCHTOWER | 119001–119003 | 3/3 | `f5064ac` |
| BATTLE-TRIMATCHPVP | 121001–121004 | 4/4 | `50735aa` |
| BATTLE-OVERALLPVP | 101101–101130 | 30/30（8 条 fail closed：101104/107/119/120/125–128） | `cb11c85`、`ff18680` |

表资产与读取器分别落在 `personal-server/assets/tables/` 和 `personal-server/config/`（arena、martial/tournament/top arena、trimatch 系列、OverallPvp）；新增服务在 `personal-server/game/`（`swap-arena-service`、`hunter-arena-service`、`arena-contest-service`、`play-match-service`、`overall-match-service`、`martial-club-service`、`martial-club-act-service`、`tournament-service`、`top-arena-service`、`trimatch-core`/`trimatch-service`、`trimatch-fight-service`、`trimatch-tower-service`、`trimatch-pvp-service`、`overall-pvp-service`）。

## 各卡实施记录

每张卡的规则来源、状态表、fail closed 分支与剩余缺口在 `agent/workflow/gameplay-completion/<任务 ID>/implementation.md`，与上表 16 张卡一一对应。

## 明确的降级项与证据缺口

- 换位竞技场：4034 补次数授予量无表字段，当前按 +1；对手用 `role_id=0` 机器人填充；跨阶段滚动未实现。
- 时空冠位赛：84005 因 `BotLib.fight_tid` 阵容表缺失固定 fail closed；赛季按 7 天推算；单角色部署名次固定 1。
- 擂台赛：`ArenaDailyTask` 发布表 0 行，任务奖 fail closed；竞猜奖依赖不存在的对阵引擎；决赛/人气/战力/顶尖角色返回真实空表。
- 玩法匹配：`play_cake` 回合推送无证据，只登记匹配票据与窗口。
- 全服匹配：单角色部署只能匹配自身，power 记 0。
- 武馆：开战需部署注入 `enemyRoster`/`eliteEnemies`；跨服与直播推送未做。
- 锦标赛：88505/88510 需注入 `enemyRoster`；elo 公式未取得（当前用 `min_win_gain` 属显式假设）；殿堂、赛季结算、跨服名次未实现。
- 巅峰竞技：登录模块 113 只解出 1/4 块，未挂登录块；赛程按开服日 + 7 天周期锚定；单服积分当排名；决赛空擂台占位；竞猜结算/奖励、历届冠军、宣言展示、Area/`scatter_tid` 映射、次数校验、跨服与主动推送为缺口。
- 三消战斗：换块只记账不解算；11901/11902 推送未发；开战一次性算完整场；爬塔 `award` bytes 为空、`min_power` 固定 0、体力道具语义推断、胜利不扣体力；PVP 任务计数映射部分推断，战报在真实对战管线前为空；三消活动登录模块 92 的 `StateData` 未下发。
- 综合 PVP：8 条需真实跨服淘汰赛对阵/决赛排名的命令 fail closed；部分 `_back` 无专属消息、101123 回包类型为推断、BitBlock 位序语义未定、预赛真实战斗未接。

## 验收 agent 的下一步

1. 以当前 main（至少 `0cefbbd`）为准 rebase 四条分支，逐块解决 `gateway.mjs` import 与登录同步冲突，保持双方派发共存。
2. 逐卡独立复核 147 条路由与 fail closed 语义，确认没有空包冒充实现。
3. 在 personal-server 执行定向与全量 `npm test`，补真实临时 TCP/SQLite 证据，修复合并后缺陷。
4. 验收通过后再更新执行状态表与任务索引；本记录不声明 APK 验收。

## 合并结果（2026-11-08）

- arena 以 `--no-ff` 合入 main `4a5ab5f`；gateway 自动合并通过。
- martial 合入 `aea32d5`；手工解决 gateway 的 import、服务实例与派发块冲突，arena 与 martial 的派发、登录同步全部保留。
- trimatch 合入 `a6f5fa1`；`TripleMatchTable` 与 G2 小游戏块共用同一资产，保留 main 既有行数组格式，并把 `trimatch-tables.mjs` 的读取器改为同时接受行数组与 `{fields, rows}` 两种 dump 格式；`readTriMatchTables()` 实载验证 gate 3、game 21、tiles 84、fightLevels 105、pvpGrades 19、towerMissions 500。
- overallpvp 合入 `2561103`；`overall-pvp-tables.mjs` 采用综合 PVP 分支的完整读取器，gateway 保留小游戏块与 `OVERALL_PVP_PB_TYPES`、`functionManual` 登录模块与 `overallPvp.ensureLoginState()`。
- 合并后定向回归 `gameplay-gateway` + `m5-command-matrix` + `login-business-reads` 共 19/19 通过；`attribute-service` 4/4 单文件通过。
- 全量 `npm test` 因环境里同时存在多条测试/服务进程，临时 TCP 用例出现超时并长时间无进展，已中止；中止日志在 `analysis/test-runs/gameplay-20261106/main-after-a2-merge-full-aborted.log`。全量重跑留给验收 agent 在安静环境执行。
- 本轮未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK；A2 仍无 APK 验收。
