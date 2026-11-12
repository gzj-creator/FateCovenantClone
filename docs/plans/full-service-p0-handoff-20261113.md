# 全功能计划 P0 交接（2026-11-13）

## 分支与提交

- 基线：`main@85c4b6f`
- 分支：`feat/full-service-p0-20261112`
- worktree：`.worktree/full-service-p0-20261112`
- 上一提交：`692b146 feat: add P0 time, level, feature-open and activity lifecycle foundations`
- 本轮提交：`feat/full-service-p0-20261112` 分支最新提交，提交信息为
  `feat: complete P0 activity gates, command registry and operations`；精确哈希用
  `git log -1 feat/full-service-p0-20261112` 读取。
- 本轮结束后按用户要求合入 `main` 并推送。

## 本轮完成

### 测试入口

- `npm test` 只跑快速套件；当前 43 个文件，实测约 15 秒，210 项中 pass 208、fail 0、skipped 2。
- 新增 `personal-server/scripts/measure-slow-files.mjs` 与 `npm run test:measure-slow`。逐文件计时，默认 1000ms 阈值；`--write` 可全量或 `--file <name> --write` 增量维护 `test/slow-files.json`。
- `command-gate-gateway.test.mjs` 实测约 3.2 秒，已移入慢测。

### 时间与等级

- `game/time.mjs` 提供自然日、业务日、服务器日、周。
- `serverDayNumber` 已改为统一业务日口径：开服自然日锚定第 1 天，05:00 切换。18:00 开服会在次日 05:00 进入第 2 天；00:00 开服不会让 `refer_day` 窗口整体平移。
- `role-level.mjs` 是唯一经验入口，支持一次跨多级、满级封顶和 `onLevelUp`。
- 尚未完成：事件总线、等级属性缓存失效、在线 `role.levelUp` 推送。

### 功能开放

- `feature-rules.mjs` 支持等级、主线、服务器日、引导、依赖功能、创角天数、英雄条件；未知条件失败关闭。
- `feature-service.mjs` 对 7000 申请逐条复核；规则资产为空时保留现状并记录申请。
- `feature-overrides.mjs` 落 `fun_open_override` 与 `ops_audit`：
  - `force_open` 写入角色位图；
  - `force_close` 不改位图，只在登录下发时清位，撤销后恢复；
  - 支持查看、撤销、管理端写入和审计。
- 未完成：E9-1 客户端 FunOpen 表、E9-2 命令到功能映射、所有功能登录模块空态、在线主动推送类型 E9-4。

### 活动生命周期

- `activity-store.mjs`：
  - `activity_instance`
  - `activity_override`
  - `activity_settlement`
  - `ops_audit`
- `activity-runtime.mjs`：
  - 登录时把模块 92 当前活动写入实例表；
  - 调度器每分钟推进阶段；
  - 离开进行态前执行 `onSettle`，失败保持 running 并重试；
  - 以 `(act_id, period_no, role_id, step)` 幂等；
  - 网关在结算前用 `VACUUM INTO` 备份 SQLite。
- `scheduler.mjs` 支持 recurring job：handler 返回 `nextDueAt`，完成标记后再登记下一轮。`activity.tick` 已挂到网关，启动时补跑。
- `activity-calendar.windowFor` 暴露与登录过滤相同的活动窗口，避免实例表与客户端载荷漂移。
- 管理端“活动与开放”页支持实例、覆盖、功能覆盖、预演、二次确认、撤销和立即检查阶段。
- 未完成：各活动家族 `settle` 的排行、邮件补发、专属货币处理；活动隐藏是否过滤模块 92；T8/T9 家族邮件、T10 延长后个人进度、T13 新期家族计数清零。

### 命令注册表

- `config/command-catalog.json`：来自 route probe 的 1407 条 C2S 命令，逐条有 type/name/module/task/plan/access/requires。
- `game/command-registry.mjs`：启动校验 1407 条、type/name 唯一、读写声明；规则可来自 `config/command-gate-rules.json`。
- 网关门禁：
  - 未开功能的写命令返回 309；
  - 读命令返回空成功；
  - 记录 `fun_open_command_denied`。
- `command-gate-gateway.test.mjs` 已用真实 TCP 登录验证 636 写拒绝、106 读空态。
- 当前 `requires` 全空，因为 E9-2 未取证；`access` 是按命令名生成的保守初值，映射到位后应逐项复核。

## 关键文件

- `personal-server/game/time.mjs`
- `personal-server/game/role-level.mjs`
- `personal-server/game/feature-rules.mjs`
- `personal-server/game/feature-service.mjs`
- `personal-server/game/feature-overrides.mjs`
- `personal-server/game/activity-lifecycle.mjs`
- `personal-server/game/activity-store.mjs`
- `personal-server/game/activity-runtime.mjs`
- `personal-server/game/scheduler.mjs`
- `personal-server/game/command-registry.mjs`
- `personal-server/game/db-backup.mjs`
- `personal-server/config/command-catalog.json`
- `personal-server/config/command-gate-rules.json`
- `personal-server/scripts/measure-slow-files.mjs`
- `personal-server/admin/server.mjs`
- `personal-server/admin/index.html`
- `personal-server/admin/admin.js`

## 验证记录

本轮已跑：

```powershell
npm test --prefix .\personal-server
node --test .\personal-server\test\command-gate-gateway.test.mjs
node --test .\personal-server\test\launch-profile.test.mjs
node --test .\personal-server\test\activity-runtime.test.mjs .\personal-server\test\activity-store.test.mjs
node --test .\personal-server\test\admin-ops.test.mjs
node --test .\personal-server\test\db-backup.test.mjs
```

结果：快速套件 43 文件、210 项、pass 208 / fail 0 / skipped 2。真实网关门禁、登录载荷、活动实例与备份专项均通过。

## 下一步顺序

1. 取证 E9-1：导出客户端 FunOpen 表，生成 `config/fun-open-rules.json`。
2. 取证 E9-2：补 `command-gate-rules.json` 的 type→funId 映射；逐条复核 `access`。
3. 给各活动家族补统一 `settle`：榜单冻结、奖励邮件、未领补发、专属货币、个人状态归档；接 T8/T9/T10/T13。
4. 把活动运行时的可见性结果接回模块 92/183，并补 E9-4 推送类型后的在线同步。
5. 完成 P0-2-3：事件总线、`role.levelUp` 订阅、属性/战力缓存失效、事务后推送。
6. 继续 P0 横切项：连接上限配置、推送目标强制（角色/公会/全服）、命令注册表与派发覆盖对账。
7. 之后再进入 P1：属性管线、敌方数值、完整战报、统一战斗模式。

## 安全边界

- 本轮没有启停线上服务、读写线上数据库、操作模拟器/ADB/APK。
- 新机器继续时默认只做源码、临时 SQLite、回环端口和组件/TCP 测试；部署或设备操作需用户另行明确。
- 取证前维持 fail closed，不以空载荷、固定值或猜测奖励销项。

