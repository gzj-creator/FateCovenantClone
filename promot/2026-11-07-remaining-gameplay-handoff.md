# 剩余玩法计划：新 session 总控续接提示词

## 可直接使用的提示词

项目 `F:\projects\FateCovenantClone`。继续完成 `docs/plans/remaining-gameplay-20261106/` 的剩余实施计划，你担任总控，按明确任务 ID 派发独立 worktree 的 agent，并负责真实接入、代码复核、冲突处理和最终验收。不要只交计划，也不要把已有可用分支重新实现。

开始先读当前 `AGENTS.md`、该计划的 `README.md`、`11-dispatch-and-acceptance.md`、`execution-status.md`、`task-index.md`，再读本文件和正在续接任务的任务卡、inventory.json 及 implementation.md。根据实际 Git/工作树状态调整本快照，不覆盖后续新增代码。

### 已验收主线

- 本提示词编写前主线为 `main@e90ef1e`，工作区干净；其业务源码基线为 `13231a4`，e90ef1e 仅更新交付文档。本提示词自身及之后的交接文档提交会使 main 再前进，须以 `git log/status` 核对。
- 最新完整 `npm test`：2234/2234，通过、0 失败、0 跳过；日志 `analysis/test-runs/gameplay-20261106/main-after-core-skill-events-draw-full.log`。不因新 session 或纯文档变更重复全量测试；新业务改动合并后由总控执行相关回归及一次全量。
- 16 个模块、2 个共享任务已有玩法实现交付，共 18 项，包含部分交付和证据缺口。另行合入的活动拒绝修正、奖池配置审计不计作新增玩法完成。完整分母为 276 模块 + 7 共享 + 72 英雄技能 = 355 项；18/355 约 5.1% 只是有实现交付的任务占比，不能当作工作量完成率。目前没有整卡进入仅待 APK 验收队列。
- 已交付具体名单、分支和剩余项以 `execution-status.md` 为准。HERO-HERO 只完成 614/647/663/664/665 小批，不能把整张卡销项。

### 本轮已合入的三个范围

1. CORE-SKILL-GATES：b87b99d 实现，合入 b6e1766；总控独立复核修复 e05533d/60b7ab7，分别合入 7e27826/d252af1。按品质/星级 AbilityLevel、持久化 mastery 门槛、rare/soul 替换组装技能；主线战斗与 1316 查询同源。显式 `skills=[]` 不再重新加载全部目录；普通1040201不再误选6910001063固定2倍占位技能。专项10/10、复核37/37，最终已被2234全量覆盖。
2. CORE-DRAW-POOLS：be514bb，合入7599ef8。仅提交只读生产配置审计、精确映射/7份资产哈希、生产配置/TCP/持久化/失败回滚复核；14圣器版本/25组已验证。226常驻幻武的60101/60102和神灵38版本/26库/56组均为空，幻武任务0行，仍为证据待补。未补造resolver、概率、奖励或不可达结论。报告在对应 implementation.md 和 config-audit.json。
3. CORE-EVENTS：db2daa7，合入13231a4。53001严格校验已观测proper ETF双整数列表，但不猜两个值语义；坏编码/形状返回1，未知规则返回5。53002未知规则返回5。替换原空成功；相关TCP证明module92/183不变，其余既有流程保持。阶段推进、53006、统一事件/任务周期和结束结算仍未完成；真实APK错误提示影响未验收。

三个范围的记录都在 `agent/workflow/gameplay-completion/<任务ID>/implementation.md`。注意 CORE-SKILL-GATES 是部分实现、证据待补，通用Passive仍从目录全部保留，尚未按突破筛选；等级仅元数据，缺每级倍率表。可达英雄4040101缺技能目录，仍走原有职业基础行为，不能编定义或擅自阻断整名英雄战斗。

### 正在续接的工作树

先核对它们的最新状态和交接 checkpoint；不要假设上一 session 的 agent 还能直接通信。若仍可见先收取其消息，不可见则从分支/文件恢复，不重复创建或覆盖原工作树。

**CORE-BATTLE-A**

- worktree：`F:\projects\FateCovenantClone\.worktree\gameplay-20261106\core-battle-a`。
- 分支：`task/CORE-BATTLE-A-20261107`；WIP提交 `ffd0ab79a9b22882cd5db9c9dc1d48387edca805`，已rebase到main e90ef1e，worktree干净；未合main，不能直接当验收通过合入。
- 本轮尚未合 main。已有代码覆盖：按实际HP损失计算伤害上下文、120001002终结技实际伤害10%治疗、2504050123按伤害转盾、下一次普攻/终结技/受击消费及fallback路径、首次终结技暴击时机、刷新时保留新次数。
- 最终WIP专项 `node --test test/battle-common-effects.test.mjs` 为10/10；日志在该worktree `analysis/test-runs/core-battle-a-20261107/common-effects-wip.log`。此前30/30发生在最后phase隔离改动之前，不能当最终回归。生产主线/TCP、SQLite与完整相关回归未做，不能沿用main的2234结果认定新代码已验收。
- 当时改动：`game/battle-engine.mjs`、`game/effects/effect-executor.mjs`、`effect-types.mjs`、`skill-integration.mjs`，新增`common-skill-rules.mjs`、`test/battle-common-effects.test.mjs`。
- 明确缺口：`mission-fight-service.actionList`当前忽略heal效果，需取得pb_fat_harm治疗type/prompt的权威证据再投影；无证据就记录CORE-BATTLE-C依赖，不编数字或BUFF tid。
- 恢复后先review：当前phase仅隔离伤害累计，触发器仍读取外层actionType，限定终结技加成是否错误作用于附加伤害仍待验证；不要只因10个专项通过就跳过这项。
- 当前仅A通用效果，不扩B专有机制/C报告。该负责人协调battle-engine/effects，其他英雄agent不得并改共享执行器。

**SOC-FRIEND**

- worktree：`F:\projects\FateCovenantClone\.worktree\gameplay-20261106\soc-friend`。
- 分支：`task/SOC-FRIEND-20261107`，checkpoint提交 `75dcdc7`，基线e90ef1e，worktree干净。仅提交implementation.md、evidence.md与inspect-evidence.mjs；没有好友服务、配置、网关补丁或业务测试，未合main。
- 任务卡在`05-social-guild.md`，恢复好友申请/同意拒绝/移除/黑名单/查询推荐/友情赠送领取/一键的完整可证闭环。
- 原catalog引用的`analysis/reports/private-client-16448/...`路径已失效。现存原始LuaJIT树已找到：`F:\projects\FateCovenantClone\.worktree\recruit-20261101\.scratch\out\luaproject\`，含`FriendMgr.lua`、`FriendTable.data.lua`、`FriendCmd.lua`、`FriendErr`和Friend UI。读取证据助手checkpoint，复用已有工具，不重新解包APK。
- 只读证据助手worktree：`F:\projects\FateCovenantClone\.worktree\gameplay-20261106\soc-friend-evidence`，detached13231a4；报告已保存为`agent/workflow/gameplay-completion/SOC-FRIEND/evidence-notes.md`。同一必要报告已放入SOC-FRIEND负责人worktree的`evidence.md`，由负责人统一提交，无需重复提交辅助worktree。
- 负责人worktree的 `analysis/scratchpad/SOC-FRIEND/` 保留FriendTable配置JSON、FriendMgr完整解析JSON及可复现检查产物；必要读取脚本也随交付文档保存。已证部分包括上限、部分ETF列表形状、日切字段和2203推送封装；数字登录槽、日界定义、奖励触发/好感增量仍未知。不要把字段名推断当规则。
- 检查脚本语法、FriendTable恢复、Manager84/85复现和差异检查已通过，未做业务验收。历史提取树与当前v9客户端来源对应尚未独立确认，使用其规则前须核对资产版本。静态列表结论以evidence.md为准，不能把未取证的形状扩到所有分支。
- 需要reverse-engineer-anything时，先读`.agents/skills/reverse-engineer-anything/SKILL.md`，只做本地静态核对。
- 生产边界：当前store和gateway固定同一个角色，`game-store.read()`取roles首行。actor必须来自当前权威存档；目标只能是roles中真实角色。单角色时推荐为空有依据，不能造机器人或第二玩家。不得仅改actor ID而让资源仍写第一角色。完整双角色登录若需要公共接口，提出最小接入补丁由总控处理，不自行扩认证/schema。
- 复用现有事务、资源、PB/ETF；双向关系、申请、黑名单、每日赠送/待收账本和回包编码一致事务。普通模块先独立服务与必要接入补丁；gateway、登录容器、迁移由总控统一维护。

### 下一轮执行顺序

1. 核对主线、工作树和checkpoint，先续完CORE-BATTLE-A与SOC-FRIEND独立可证部分，不丢弃已有未提交成果。接管现有agent或派新agent到原工作树，明确所有权。
2. 复核实际业务、临时TCP、SQLite重开和编码/写入失败回滚；不能只测helper或靠手写计数代替生产事件。agent交付后及时通知，总控阶段轮询，不无限等待空转任务。
3. 合并前工作树干净、rebase最新main、`git merge-base --is-ancestor main HEAD`和`git diff --check main..HEAD`通过。检查差异没有删除主线已有登录/路由/迁移。总控使用可审阅合并，冲突逐项保留两侧业务。
4. 合并后针对新变更运行相关回归，最后在personal-server执行一次`npm test`；新增运行资产/部署依赖才执行`npm run test:deployment`。不要并发启动相同全量，也不要把旧结果套给新业务源码。
5. 持续按A/B优先派发明确ID；CORE-EVENTS/CORE-DRAW-POOLS先准确列证据阻塞，不反复无效泛扫；可推进其他不依赖缺失证据的任务。并发按实际平台容量尽量满载，上个session上限为4个执行线程（包含总控），不能声称已有8个并发。
6. 更新`execution-status.md`与每卡`implementation.md`，把服务端、证据缺口、TCP/SQLite、APK分开记录。缺规则就标证据待补，不伪造奖励、协议号、固定胜利、全服统计或完整完成。

### 必须保留的主线修复

- 96d4c18：207战斗结算/体力同步；4ee1f8b：新邮件推送刷新；7b5af58：活动/fishing登录期限。
- mission-fight-service的module8多槽；task-service的module90通用任务槽0-3、线性槽4；game-store既有迁移。
- gateway登录同时保留`onlineGift.beginSession()`、`rankAchieve.ensureLoginState()`、`heroExtra.ensureLoginState()`、`firstWeekGoal.loginPayload()`、`growthRoad.ensureLoginState()`，以及1316、67004/67005、69001/69002和此前所有数字type派发。
- 本轮技能loadout、显式空数组和metadata fallback两处复核修复；活动拒绝分支；draw生产审计测试。

### 操作限制

只维护personal-server与隔离客户端范围。当前阶段不得启停实时服务、读写`runtime.local-only.data`、操作模拟器/ADB/APK、连接原游戏服务器。测试仅临时loopback端口/临时SQLite。没有新设备授权，不做APK验收或快照；纯服务端变更不制造新APK。

使用PowerShell，检索优先rg，手工编辑用apply_patch。用户和其他agent已有改动必须保留，不用reset --hard、checkout --或整文件覆盖解除冲突。新运行资产收纳到personal-server/assets。用户偏好简洁中文沟通，每阶段说明实际结果和剩余项，继续实施，不止回复“可以继续”。

## 换 session 保存结果

2026-11-07 用户明确要求换session。上述实施和证据agent均已停止本轮扩展，CORE-BATTLE-A与SOC-FRIEND各自checkpoint已提交且工作树干净，均未合主线。证据助手本地未跟踪备份报告仍保留，必要内容已进入SOC-FRIEND的75dcdc7，不需为清理而删除。下一session先续两个checkpoint；不要等待已经结束的旧agent自动完成，也不要把WIP当完成提交直接合入。
