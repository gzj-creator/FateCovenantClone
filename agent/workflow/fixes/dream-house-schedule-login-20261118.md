# D1 梦中小屋错误开放与每日登录活跃奖励提示已过期

日期：2026-11-18（Asia/Shanghai）

分支/worktree：`fix/dream-house-schedule-20261118` / `.worktree/fix-dream-house-20261118`

基线提交：`89b410a`

状态：已合并 `main@4e6f8ad` 并部署；组件、健康检查和客户端启动通过，等待用户登录后做梦中小屋入口与领奖的 APK 真机验收

## 现象与触发

- 用户进入梦中小屋后看到「[第1期]」仍在运行，但按活动排期认为当前时间不应开放。
- 领取第一项「每日登录游戏」奖励时，客户端显示奖励已过期；服务端记录中 `11502` 请求的 `task_tid=701` 返回 `code=311`。
- 同一登录会话中 `11505` 成功，请求对应的活动配置为 `actTid=1085007`。错误开放、登录任务进度和 ActFrame 阶段窗口是相互关联但可分别验证的问题。

## 证据

- 界面证据：`analysis/experiments/launch-20261115/codex-current.png`。
- 运行日志：`analysis/experiments/launch-20261115/` 中 `11505` 成功、`11502 task_tid=701 code=311`。
- 只读运行库：`analysis/experiments/launch-20261115/server-data-fixed/game.local-only.sqlite`。`activity_instance` 同时存在 `1085004` 与 `1085007`，两者均为 `running`，且 `stage_windows_json` 都是 `[]`。
- 官方 TapTap 活动页：`https://www.taptap.cn/moment/819573274533956808`。官方正文对梦中小屋写明“具体活动时间视各服务器情况而定”，不能用固定公历日作为全局入口。
- 公开玩法规则（2026-11-18 用户补充并要求按服龄判断）：
  - 新区在开服第 8 天开启，`开服天数 >= 8` 才可进入；公开说明称一般持续约 5 天。
  - 老服使用世界时间期，要求 `开服天数 >= 29`。
  - 梦中小屋是限时排行活动，与家园/橘屋互相独立。
- 当前新区锚点 `1794690000`（2026-11-15 05:00 Asia/Shanghai）：第 4 天、第 7 天末均无 Type 1085 活动；第 8 天 05:00 才选择 `1085008`。这些日期只用于验证相对服龄，不是全局排期。
- `ActFrameTable`：
  - `1085003` 是世界时间老服期。
  - `1085004` 是 26 天线性新服版本。
  - `1085007` 是 `refer_day=1`、持续 7 天的旧相对代际。
  - `1085008/1085009/1085010` 分别从服龄第 8/15/22 天开始。
  - `1085008` 的阶段数组为 `[50,90] / [6,1] / [43200,0]`；精确时长以该行 ActFrame 为准，公开说明中的 5 天是通常时长。
- `HomelandTask.tid=701` 为 `task_type=1803`、`task_count=1`。
- 客户端规则证据：`docs/gameplay-operations/activity-rulebooks/time-and-stages.md` 第 5 节的 `GetStageTime`。
- 组件回归日志：`analysis/test-runs/dream-house-schedule-login-20261118-targeted.log`。

## 根因

1. `personal-server/game/exploration-act-service.mjs` 把通用 `TaskType=1803`（每日登录游戏）错误实现为必须先选择家园英雄。
2. `personal-server/game/exploration-act-service.mjs` 的宠物活动与 `artifact-draw-act-service.mjs` 的 TrialsTask 也把同一 `1803` 分别绑定到选宠物和试炼通关次数，属于同类语义错误。
3. `runningActFrameIds()`/登录过滤只按每个 ActFrame 行自己的时间判断。`1085004`、`1085007` 的 `refer_day=1` 使它们在新区第 4 天仍自证可开，违反公开规则的 `开服天数 >= 8`；同时多个相对代际可一起通过。此前“只看最高版本”的推定不能代替真实开服日门槛。
4. `activity-lifecycle.mjs` 只读取旧 Activity 的 `state/state_end_day`，没有按 ActFrame 的 `stage/stage_duration_day/stage_end_time` 实现 `GetStageTime`。因此 50 段边界错误，90 段不能按表切换，登录 `stage_time_list` 与持久实例都没有权威阶段窗口。
5. 客户端把 `11502` 的 `311`（任务未完成）呈现为「已过期」；这里不是活动奖励时间与活动窗口被两套逻辑分别判定，而是登录任务进度被错误算成未完成。

上一份 [sprint-claim-expired.md](sprint-claim-expired.md) 没有拦住复发，因为它的防复发断言只覆盖统计 TID、module 21 和 `ServerInfo.OpenTime`，没有覆盖通用 TaskType 1803、Type 1085 同族版本选择或 ActFrame 阶段算法。

## 修复范围

- Type 1085 相对服龄活动增加新区第 8 天门槛，世界时间期增加老服第 29 天门槛；判断只使用 `ServerInfo.OpenTime` 推导的服龄。
- 仅对 Type 1085 的服务器时间新服版本做局部代际选择：新区第 8/15/22 天分别选择 `1085008/1085009/1085010`，第 8 天前不退回 `1085004/1085007`；不全局套用“同 type 只开最高版本”。
- 增加共享的 TaskType 1803 判定，统一 Homeland、Pet Challenge 和 TrialsTask 消费点；每日登录本身不再依赖选英雄、选宠物或试炼战报。
- 对非空 ActFrame stage 数组实现原始 `GetStageTime`，并让阶段窗口贯穿登录、`activity_instance.stage_windows_json` 和 scheduler。
- 保持空 stage 数组的既有行为；不完整 stage 配置 fail closed。
- 客户端将 `11502` 的 `311` 呈现为“奖励已过期”；本次按错误进度根因修复，不为规避文案而放开未完成任务的领奖门禁。

## 同类问题排查

- 源码内 `TaskType=1803` 只有 Homeland、Pet Challenge、Artifact TrialsTask 三个消费点，现均调用共享 `isDailyLoginTask()`；非 1803 任务仍保留真实伤害、次数和战报门槛。
- 所有非空 ActFrame stage 配置都经过同一 `activityStageWindows()`；空 stage 行继续沿用既有 Activity 状态，避免把 811 条证据不足的活动一次性关闭。
- `1024001` 四天梦境活动与功能 `1155` 是另外的系统，不能覆盖或代替 Type 1085 梦中小屋的开服日门槛。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 专项组件测试 | `activity-calendar/lifecycle/runtime`、Artifact TrialsTask、Homeland/Pet 回归 | 合并后 72/72 通过；日志 `analysis/test-runs/dream-house-schedule-login-20261118-merged-targeted.log` |
| 全量组件测试 | `personal-server npm test` | 合并后 541 项：pass 539 / fail 0 / skipped 2；日志 `analysis/test-runs/dream-house-schedule-login-20261118-merge-full.log` |
| 临时 TCP | 本轮未执行 | 未验证 |
| 部署 | 从 main 启动，核进程、五端口、管理页、stderr、SQLite 与开服日 | 通过；PID `8752`，`serverOpenedAt=1794690000`、`serverDay=4`、全部端口仅 `127.0.0.1`、管理页 200、stderr 0、SQLite quick/integrity ok |
| APK 真机 | 启动既有隔离客户端 `com.jzyx.ps`，不改 APK | 已到 QuickSDK 账号登录页；梦中小屋入口和 `11502` 领奖仍待用户验证 |

部署前备份位于 `analysis/experiments/launch-20261115/server-data-fixed/backups/pre-dream-house-deploy-20261118T051352Z/`。`game.local-only.vacuum.sqlite` 大小 1,687,552 字节，SHA256 `a87867b36f2d45c5ab52a9fd7a6d3df2223a2b45098bbeed299c32006dc1a5a0`，包含 2 个角色、1 个账号和 177 张表。

## 防复发

- Homeland 使用真实 `activity_id=7/task_tid=701`，在未选择英雄时断言领取成功，并断言重复领取为 310。
- Pet 在未选择宠物时领取 1803 任务成功。
- Artifact TrialsTask 在没有任何试炼战斗计数时领取 1803 任务成功；非 1803 任务仍按真实伤害/次数门槛拒绝。
- Type 1085 断言新区第 1—7 天不开放，第 8 天 05:00 才选择 `1085008`；第 8/15/22 天切换代际，00:00—05:00 间隙不回退旧版本。
- 老服世界时间期断言第 28 天不开放、第 29 天开放。
- 老服世界时间期再断言 50/51/52/53/54 段均为运行、90 段为展示，并在整体窗口结束关闭。
- `1085008` 断言阶段 50 运行至第 6 天 12:00，阶段 90 展示至第 7 天 00:00；持久 `stage_windows_json` 非空，scheduler 完成 running→show→closed。
- 不完整 stage 数组断言不开放。

## 未验证项与边界

- 原服务端选择函数尚未取得；当前入口门槛由公开玩法规则与 `ActFrameTable` 的日龄行共同确定，断言锁定的是对外行为，不冒充已恢复原函数源码。
- 空 stage 的 ActFrame 不自动生成阶段，避免一次改动关闭 811 条证据不足的活动。
- 通用长周期奖励保留活动结束门禁；没有本期完成权益快照前，不直接放开结束后的累计统计领奖，避免产出或重复领奖。
- 部署验收只证明服务和新进程健康；用户登录后仍需核对 module 92 不再下发第 4 天的 Type 1085 活动，并验证第 8 天入口/阶段及每日登录奖励领取。

