# 全功能计划 P0 实施进度（2026-11-12）

依据：

- `full-service-design-20261112.md` §8 P0、§10.1–§10.3。
- `ops-level-open-rules-20261112.md` §1–§7。

标记：`[ ]` 未开始，`[~]` 进行中，`[x]` 已完成并有测试，`[!]` 缺证据或待用户验收。

## 0. 测试入口

- [x] T0-1 `npm test` 只保留短测；把实测耗时长的文件移入 `test/slow-files.json`。
  2026-11-13：慢测清单增加 83 个英雄技能校验/网关文件；`npm test` 实测约 14 秒、204 项（pass 202 / skipped 2，含本轮新增测试）。
- [x] T0-2 增加按耗时自动生成慢测清单的脚本，后续新增测试不再手工维护。
  `scripts/measure-slow-files.mjs`（`npm run test:measure-slow`）逐文件单独计时，`--write` 以 1 秒阈值重写 `test/slow-files.json`；已在两个测试文件上验证输出与失败退出码。

## 1. 统一时间基准（ops §1）

- [x] P0-1-1 新增 `game/time.mjs`：`naturalDay`、`gameDay`、`serverDay`、`gameWeek`，时区与 05:00 日切可配置。
- [x] P0-1-2 业务代码移除裸写 `10800/18000/28800`、`5 * 3600`、`8 * 3600`。
- [x] P0-1-3 启动扫描测试：发现裸写偏移常量即失败。
- [x] P0-1-4 修正 `serverDayNumber` 按开服业务日计算（18:00 开服次日 05:00 进第 2 天）。
  `activity-calendar.serverDayNumber` 已改为调用 `time.mjs` 的 `serverDay`；开服自然日锚定第 1 天，00:00 开服也不会把 `refer_day` 窗口整体平移。`time-base` 与 `activity-calendar` 共 25 项通过。

## 2. 升级规则（ops §2）

- [x] P0-2-1 唯一经验入口 `addRoleExp(role, amount, source)`，支持一次跨多级、满级封顶。
- [x] P0-2-2 主线结算与道具/奖励经验走同一入口。
- [~] P0-2-3 升级后动作：功能开放重算、等级属性失效、`role.levelUp` 事件、事务后推送。
  `addRoleExp` 已提供 `onLevelUp` 回调；事件总线、属性缓存失效和登录/在线推送仍待 P0-6 接线。
- [x] P0-2-4 验收 T2/T3：一次跨 3 级、满级经验封顶。

## 3. 功能开放（ops §3）

- [x] P0-3-1 新号模块 3 从空位图开始，不再继承抓包角色。
- [x] P0-3-2 功能规则资产 `fun-open-rules.json` 与纯函数 `evaluateFunOpen(role)`。
  2026-11-13：已从客户端 FunOpen 表与 MethodScript/MethodTable 字节码导出全部 523 行；164 行条件可执行，359 行无充分证据并严格 fail closed。来源、复现命令与结论见 `agent/workflow/evidence/E9-1.md`。
- [x] P0-3-3 7000 申请逐个复核规则；无规则时保留现状并记录申请。
- [x] P0-3-4 功能覆盖表 `fun_open_override` 与登录/在线生效。
  `feature-overrides.mjs` 落表并审计；`feature-service` 支持 `force_open`（写入位图）与 `force_close`（不改位图，登录下发时屏蔽），管理端可增删；`feature-overrides.test.mjs` 覆盖撤销后恢复。在线主动推送仍等 E9-4 的 S2C 类型。
- [~] P0-3-5 验收 T1/T4/T5：新号位图、未达条件申请、写命令拒绝、读命令空态。
  T1 新号模块 3 清空、T4 未达条件不置位已有单测；T5 的命令注册表门禁仍待 P0-6。

## 4. 活动开放（ops §4）

- [x] P0-4-1 活动实例表 `activity_instance`、个人状态 `(role_id, act_id, period_no)`。
  已新增 `activity-store.mjs`：实例、覆盖、结算、审计四张表及幂等写入；个人状态仍由各家族现有表承载，统一容器待接线。
- [x] P0-4-2 判定顺序：覆盖 → 废弃 → 区服资格 → 时间窗 → 状态 → 玩家条件 → 父子。
- [x] P0-4-3 状态机：未开始/预告/进行/领奖/展示/关闭；离开进行时结算。
- [x] P0-4-4 统一 `activityGate(actId, read|operate|claim)`。
- [~] P0-4-5 验收 T6–T13。
  已覆盖 T6/T7/T11/T12 的引擎单测；`activity-runtime.mjs` 在登录时写入实例、调度器按分钟推进阶段，并以 `(act_id, period_no, role_id, step)` 幂等记录生命周期结算。T8/T9 的家族奖励邮件、T10 延长后的个人进度、T13 新期家族计数清零仍待各家族 `settle` 接口接入。

## 5. 调度与运营（ops §5–§6）

- [x] P0-5-1 `scheduler_job` 表、每分钟 tick、启动补跑。
  `game/scheduler.mjs` 支持一次性与 recurring job；网关启动即登记 `activity.tick`，每分钟运行 `activity-runtime.tick()`，启动时的到期任务会补跑。
- [x] P0-5-2 `activity_override`、`ops_audit`、管理端预览/生效/留痕。
  管理端「活动与开放」页支持活动实例/覆盖/功能覆盖查看、活动预演、活动覆盖写入与撤销、功能强制开放/关闭与撤销；所有写操作进 `ops_audit`，`close_early`/`force_open` 必须二次确认。
- [x] P0-5-3 活动结算幂等键 `(act_id, period_no, role_id, step)`。
- [x] P0-5-4 结算前备份、失败告警、管理端重试。
  `activity-runtime` 在离开进行状态前调用 `onSettle`，网关用 `VACUUM INTO` 备份到 `backups/activity-<act>-<period>-*.sqlite`；备份或结算失败保持 running、记录 `activity_settle_failed`，管理端「立即检查活动阶段」可重试。

## 6. 命令注册表与门禁（full-service §2、§8 P0）

- [~] P0-6-1 每条命令声明 `requires: funId` 与读写类型。
  `config/command-catalog.json` 为 1407 条命令逐条写入 `access`（read/write）与 `requires` 字段；`requires` 目前全空，等待 E9-2 的客户端命令→功能映射后由 `config/command-gate-rules.json` 覆盖。
- [x] P0-6-2 启动对账 1407 条目录，缺失即失败。
  `game/command-registry.mjs` 启动时校验总数、type/name 唯一性和 access 声明；非 1407 条、重复或未知规则引用都会抛错。
- [~] P0-6-3 未开功能：写命令拒绝、读命令空态、登录模块空态。
  网关已接入门禁：写命令返回 309，读命令返回空成功，并记录 `fun_open_command_denied`；`command-gate-gateway.test.mjs` 用真实 TCP 登录验证 636/106。完整 1407 条映射和各功能登录模块空态仍待 E9-2/E9-1。

