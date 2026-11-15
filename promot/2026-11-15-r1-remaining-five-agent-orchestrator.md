# 2026-11-15 R1 剩余 25 条任务总控提示词

```text
你是 FateCovenantClone R1 剩余 25 条命令的总控实施 agent。项目根目录为
F:\projects\FateCovenantClone，其他机器按实际路径调整。

## 基线事实

- 以当前 main 的提交 a006536 为基线；开始前必须再次读取 git rev-parse HEAD。
- 工作树只允许保留 .codex/config.toml 的既有本地修改。不得提交或覆盖它。
- 46 条优先命令中，21 条已有具体服务实现：803、667/670/671、88955/88957、
  89801-89804、101202、84502、93501、69301/69302、69006/69007、69101/69102、
  85804、91503。
- 剩余 25 条必须由你组织完成：88951/88953/88956、701/702、87701/87702、
  88963/88964/88967、78201-78205、91501/91502、101301-101303、288、
  88401/88402、84901/84902。
- “完成”首先要求独立复核原证据。证据闭合才实现成功链；证据未闭合的动作必须
  在扣资源、置领取位、改次数、改对象或返回成功之前继续以
  GameError(5, 原因和 decisionId) 拒绝。不能把失败关闭数量下降冒充玩法完成。

## 必须完整读取

按顺序读取：
1. AGENTS.md；
2. docs/gameplay-operations/12-final-rule-baseline.md；
3. docs/gameplay-operations/rules/final-rule-register.md；
4. docs/gameplay-operations/system-rulebooks/heroes-equipment.md 和
   economy-tasks-shops.md；
5. docs/gameplay-operations/rules/unresolved.md；
6. docs/gameplay-operations/11-project-roadmap.md；
7. docs/gameplay-operations/09-defects-and-acceptance.md；
8. agent/workflow/rule-implementation-20261115/ 下全部本轮记录，特别是
   implementation.md、h1-heroblazon.md、h1-intimacy.md、h2-intelli.md、
   h1-item-hook.md、i2-mysteryshop.md；
9. 当前 r1-fail-closed-command-service.mjs、gateway.mjs、命令审计配置以及相关
   service/test/config/assets。

## 总原则

- R1 和逐任务最终裁定优先。旧计划、当前源码、旧 fixture、旧默认值和兼容常数
  不能覆盖 R1，只能作为差异或历史证据。
- 原证据、R1 明确推定、工程兼容和具体受限动作必须分开记录。
- 每条命令先建立证据包：原表/子表/行字段及 SHA256、同版 PB schema、客户端真实
  调用者与前置、权威状态所有者、实例/期号键、登录 slot、资格、成本、上限、奖励、
  拒绝条件、重复语义和结果投影。
- 校验、扣费、发奖、统计、领取位和编码必须处于同一 SQLite 事务。编码、推送或
  持久化失败必须整笔回滚。重复 request_id/领取键返回原结果或明确完成，不得二次
  扣费、抽奖、发奖或推进。
- 禁止用路由存在、处理函数存在或单项测试通过代替玩法完成。
- 不读取当前阵容冒充冻结历史；不按普通 Shop 替代神秘商店；不按余额差赠送；
  不固定返还；不猜随机池、圆整、日界、期号、付费位或返还公式。
- 默认不启停实时服务、不读写生产数据库、不操作模拟器/ADB/APK、不部署。
  需要这些动作时停止依赖步骤并明确说明。

## 五个子 agent 的任务边界

每个子 agent 恰好负责 5 条，互不重叠：

A. Hero Blazon + Intelli
   - 88951、88953、88956
   - 701、702
   - 读取 heroes-equipment.md、HeroBlazon/HeroBlazonBond/Intelli 原表、同版 PB、
     HeroBlazonCmd/Mgr、IntelliCmd/Mgr 和登录消费者。

B. Lineup Snapshot + New Hero Exclusive
   - 87701、87702
   - 88963、88964、88967
   - 必须证明快照写入生产者、冻结身份、可见性、日界与引用清理；必须证明活动
     实例期、候选/选择上限、故事前驱、奖励槽和奖励消费者。无快照时保持失败关闭。

C. Item Hook
   - 78201、78202、78203、78204、78205
   - 读取 Hook 表族、客户端 Mgr/Cmd/PB、产出时钟、上限、余量取整、领取游标、
     预览和快收成本。任何成本或产出边界缺失均不得先扣费或前移 last_reap_time。

D. Mystery Shop + Period Task
   - 91501、91502
   - 101301、101302、101303
   - 神秘商店须闭合候选池、权重、刷新、次数/段价、price_index、资格和限购；
     周期任务须分别闭合 version、实例/期号、任务、阶段、分数、进度奖、任务奖、
     领取位和逾期资格。

E. Res Complete + Res Rollback + Task Group
   - 288
   - 88401、88402
   - 84901、84902
   - ResComplete 必须解析原补全类型、资格、资源清单和唯一键，不能按余额差赠送；
     ResRollback 必须闭合 rollback_type 到对象/成本映射、预览、执行前指纹和返还
     消费者；TaskGroup 不得借其他任务的版本或奖励。

## worktree 与集成规则

- 从提交 a006536 为五个子 agent 建立隔离 worktree，例如
  .worktree/r1-remaining-20261115/a 至 e。不得使用旧 main 或旧 worktree 重建基线。
- 当前环境若只有 4 个执行槽，先并行 3 个子 agent，再启动剩余 2 个；不要让同一
  worktree 被两个 agent 同时修改。
- 子 agent 只能编辑自己的域配置、service 和专项测试，以及自己的 workflow 证据
  文档。共享文件 gateway.mjs、r1-fail-closed-command-service.mjs、
  command-dispatch-audit.json、09-defects-and-acceptance.md、
  rulebook/unresolved/final-rule-register 和总 implementation.md 由总控串行集成。
- 子 agent 必须输出共享文件的精确改动建议和测试结果，但不得自行覆盖其他 agent
  已完成的共享文件改动。
- 每合入一个子 agent 后都立即重跑命令审计、失败关闭测试和相关真实临时 TCP，
  再进入下一个合并。不得一次性合并五个分支后再排查冲突。

## 每个子 agent 的交付物

- 5 条 type 的唯一状态表：成功链、部分成功、仍失败关闭；不得含糊。
- 原证据路径、表/行/字段、来源 SHA256、PB 形状、客户端调用者、登录 slot 和
  状态所有者。
- 实现文件及事务边界；重复请求、编码失败、SQLite 失败和重开行为。
- 已证成功动作的成功测试，以及缺失子动作的“err5 且资源/状态不变”测试。
- 真实临时 TCP、ETF/PB、登录投影、在线推送（若原协议存在）和 SQLite 重开。
- 不能实现的字段必须列明缺失证据，禁止写“应该可以”。

## 基线回归债务

当前 fast 全量为 449 tests / 447 pass / 0 fail / 2 skipped；2 个 skip 是缺少既有
FC_RECHARGE_CLIENT_BUNDLE。test:all 已尝试但尚未跑完，并已观察到至少以下跨模块
失败，必须独立复现、判断是真实回归还是并行端口/测试隔离问题，再修复：

- ReportCmd/CommonMapCmd/StarMissionCmd temporary-handshake/reopen；
- delivered APK activity tables unresolved-state contract；
- protobuf benefit requests should reach family refusal instead of code 1；
- 87301 permanent-card daily award/reopen；
- block J role/support temporary loopback/reopen；
- draw activities temporary TCP/SQLite；
- pray login persisted-state/table-relative window；
- hero bond commands real-gateway login persistence；
- hero extra commands real-gateway login persistence。

先运行完整 npm --prefix personal-server run test:all 并保存日志；单个复跑可确认的
真实失败必须在本阶段修复。不能把并行执行造成的端口冲突静默忽略，也不能把真实
失败标成 flaky。只有完整 test:all 实际通过才可报告全量回归通过。

## 最终验证与报告

至少运行：
- 每个子 agent 的相关 node --test --test-concurrency=1 专项；
- 每个成功链的真实临时 TCP、SQLite 重开和登录同步测试；
- npm --prefix personal-server run check:command-dispatch；
- npm --prefix personal-server test；
- npm --prefix personal-server run test:all；
- node tools/build-detailed-rule-docs.mjs --check；
- node tools/verify-detailed-rule-docs.mjs；
- git diff --check；
- git status --short --branch。

报告必须分开列出：原证据已闭合、R1 推定、服务端完成、离线 TCP 完成、存档/重开、
APK、生产 TCP/生产库、部署。没有实际执行的层一律写“未验收”。最终必须给出
46 条逐 type 状态表和剩余失败关闭原因；不得用 21/46 或路由率作为完整完成率。

用户之后会新注册账户实机游玩，因此还要把“新账号首次登录、创角、引导、首战、
重登和 SQLite 持久化”作为独立验收阶段。该阶段需要用户明确授权启动服务和操作
APK；不能用当前离线测试替代，也不能承诺未验收环境“绝无 bug”。
```
