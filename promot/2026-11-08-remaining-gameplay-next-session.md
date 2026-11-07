# FateCovenantClone 剩余玩法计划下一 session 提示词（2026-11-08）

你在项目 `F:\projects\FateCovenantClone` 继续担任总控，按明确任务 ID 派发独立 worktree agent，并负责真实接入、代码复核、冲突处理、合并和最终验收。不要只交计划，不要重新实现已合入任务，不要等待旧 agent。

## 当前基线

- 当前 main 以包含本提示词的 docs tip 为准（写作时执行看板提交为 `c4d4c12`）；最新业务合并是 `354e1ca`。开始工作时先读取实际 `git log -1 main`。
- 已合入本轮第二批剩余任务：`SOC-MSG`（10501–10511，main `b4880a9` 起，后续 ETF 推送修复已合入）、`HERO-HERO-B`（HERO-HERO 卡剩余 18 条命令，main `eb1b1e1`）、`DRAW-HUNDREDDRAWACT`（117001–117005，main `354e1ca`）。
- 执行看板已更新为 26/355（约 7.3%，只表示已有实现交付，不代表完整规则闭合或 APK 验收）：23 个模块任务 + 3 个共享任务。当前仍无任务完成 APK 验收。
- 最后的主线全量是批次二 `2311 tests / 2309 pass / 0 fail / 2 skipped`，日志 `analysis/test-runs/gameplay-20261106/main-after-batch2-full.log`，已不覆盖第三批。
- HERO-HERO-B 分支全量为 `2368 / pass 2366 / fail 0 / skipped 2`；第三批合入主线后的定向证据为 HERO 相关 `131/131`、百抽/活动/福利/网关 `24/24`。
- 因此新 session 第一步应在 personal-server 跑一次 post-batch3 全量 `npm test`，把日志保存为 `analysis/test-runs/gameplay-20261106/main-after-batch3-full.log`，通过后再继续新业务合并。只文档变更不必重复全量。

先完整阅读：

1. 当前根目录 `AGENTS.md`。
2. `promot/2026-11-07-remaining-gameplay-next-session.md`（仍需读其中的环境和坑）。
3. `docs/plans/remaining-gameplay-20261106/README.md`、`11-dispatch-and-acceptance.md`、`execution-status.md`、`task-index.md`。
4. 已续接任务卡及 `agent/workflow/gameplay-completion/<任务ID>/implementation.md`。
5. HERO-HERO-B 文档：`agent/workflow/gameplay-completion/HERO-HERO-B/implementation.md`；百抽文档：`agent/workflow/gameplay-completion/DRAW-HUNDREDDRAWACT/implementation.md`。

## 已合入任务不可重做

`CORE-BATTLE-A`、`SOC-FRIEND`、`PLAY-FISHINGACT`、`BATTLE-ELITEMISSION`、`PLAY-HELPUPACT`、`PAY-GROUPBUYACT`、`HERO-HERO`（含 B 批 602/627–631/634/635/637/641/651/652/654/656/661/666/672/673）、`SOC-MSG`、`DRAW-HUNDREDDRAWACT` 及执行看板中的更早任务均不要重做。先按源码和测试确认，再只补证据缺口或后续独立任务。

第三批仍需保留的明确缺口：

- SOC-MSG 10508 payload 已有但登录数字槽未取证；1400–1403 的 `sender_bin/extra_bin` 未反解；频控、历史分页、跨服聚合待证。
- HERO-HERO-B 635 配置 0 行；651/652/673 当前客户端不可达；641 品质/星级/碎片规则、637 Cell 4–6、654/672 属性影响、629–634 跨角色租借登录槽均有证据缺口。
- DRAW-HUNDREDDRAWACT 的 `GuaranteeWeight` 服务端选择语义未恢复，当前保底按排序后的首个本体奖；宠物/精灵/幻装星级条件、type-104 技能奖和部分 target-chip 映射缺证据并 fail closed。

## 当前可复用工作树

旧 agent 已全部冻结，工作树均干净且没有新增实现提交，不要重复 `git worktree add`，也不要等待旧 agent：

- `.worktree/gameplay-20261106/soc-chat`，分支 `task/SOC-CHAT-20261107`，当前 HEAD `e55a039`。
- `.worktree/gameplay-20261106/equip-artifact`，分支 `task/EQUIP-ARTIFACT-20261107`，当前 HEAD `eb1b1e1`。
- `.worktree/gameplay-20261106/equip-relic`，分支 `task/EQUIP-RELIC-20261107`，当前 HEAD `354e1ca`。

每个 agent 开始前先 `git status --short`，确认干净后执行 `git rebase main`。若工作树出现非自己产生的改动，停止并报告，不得清理或覆盖。

## 下一批派发

按总控 + 3 agent 并行，明确派发：

1. `SOC-CHAT`：世界/公会/私聊/跨服与设置，11000、11001、11002、11003、11006、11008、11010、11012、11013、11014。优先复用 SOC-MSG 的 message service/table，但不得猜未知 ETF 参数、频控、举报或点赞规则。
2. `EQUIP-ARTIFACT`：圣器合成、强化、品质、升级、突破等 11 条，卡在 `docs/plans/remaining-gameplay-20261106/03-equipment-development.md`。
3. `EQUIP-RELIC`：Relic 装具穿戴、重铸、分解、重置、升阶等 11 条，卡在同文件。

每个分支必须：

- 实现真实状态、资源、奖励和登录/推送同步；缺证据时 fail closed 并登记，不使用固定空回包销项。
- 写 `agent/workflow/gameplay-completion/<任务ID>/implementation.md`，逐 type 区分服务端完成、部分交付、证据待补和 APK 未验收。
- 补服务专项、真实临时 loopback TCP、临时 SQLite 重开、PB 编码失败和 SQLite 写入失败回滚；提交到独立分支，不自行合 main。
- 合并前工作树干净、rebase 最新 main，通过 `git merge-base --is-ancestor main HEAD`、`git diff --check main..HEAD`，并列出 `git diff --diff-filter=D --name-only main..HEAD`，确认没有删除主线登录、路由、迁移和修复。

下一轮容量释放后，优先 `CORE-BATTLE-B/C`、其余 DRAW/PAY 活动、`CORE-TIME-TEMPLE`、`CORE-CABIN`，之后推进剩余模块和 72 个 `SKILL-*`。

## 合并热点

`personal-server/game/gateway.mjs` 是热点，冲突必须逐行解决，禁止整文件覆盖。登录区和派发区至少保留：

- `onlineGift.beginSession()`、`rankAchieve.ensureLoginState()`、`heroExtra.ensureLoginState()`、`firstWeekGoal.loginPayload()`、`growthRoad.ensureLoginState()`。
- `activityRead.synchronizeHelpUpLogin()`、`groupBuyAct.synchronizeLogin()`、`hundredDraw.synchronizeLogin()` 及 SOC-MSG 消息派发。
- 1316 属性；67004/67005、69001/69002；20001–20013 好友；钓鱼 ETF；精英 201/207；团购 100601/100602；207 结算/体力；邮件推送；活动期限；module 8/90 多槽；10501–10511；117001–117005。
- `game-store` schema 16、月卡任务经验、普通招募排除限定英雄、HERO-HERO-B 新服务和 SOC-MSG/百抽新服务。

注意 HERO 分支为让 651/652/673 命中新 support service，从 `recruit-service` 移除了这三项旧 `supports`/空回包；gateway 必须继续先派发 recruit、再派发 `heroCommandServices`。百抽派发必须在通用 `activityRead` 之前。

## 环境与硬约束

- 只维护 `personal-server/` 和隔离客户端相关代码；不操作 Unity。
- 不启停实时服务，不读写 `runtime.local-only.data` 或运行数据库。
- 不操作模拟器/ADB/APK，不生成 APK，不连接原游戏服务器。
- 测试仅用临时 loopback TCP、临时 SQLite 和 `analysis/` 下的测试日志。
- 缺证据时继续独立可证部分；不猜协议号、奖励、战斗规则、全服数据或登录模块数字槽。
- 使用 PowerShell、`rg`、`apply_patch`；Git 操作受写保护时按权限申请处理。

主线当前有一个与本计划无关的未跟踪文件：`assets/Android/script/lua/64_lua_project.bundle`，102,832,516 bytes，SHA256 `2b1fd41f3fb40ea3d3dcd1b7d1591d3d17ffacbc6422c028de4dc02ad04ecdc7`。不要删除或提交。需要合并且工作树必须干净时，先原路径 stash 保全，合并后立即恢复。

## 看板娘边界

本剩余玩法计划没有独立“看板娘选角/换装/互动系统”任务卡。已有的是资源加载修复：PlayerPrefs `SubDownloadFinish=1` 解除 `sub_first` 误判远程下载，记录在 `docs/06-personal-server-handoff.md`。`CORE-CABIN` 是船舱/房间玩法，`PLAY-HOMELAND*` 是家园活动，不能当成看板娘系统完成。除非用户另建任务卡，不要自行扩大范围。

## 验收与报告

每合并一个分支后跑相关回归；全部当前业务分支合并后只在主线跑一次最终全量。最终报告必须给出：main/业务 HEAD、逐任务状态、测试统计与日志、SQLite/TCP/回滚证据、网关保留项、证据缺口、APK 未验收边界，以及仍未实现的任务数量。
