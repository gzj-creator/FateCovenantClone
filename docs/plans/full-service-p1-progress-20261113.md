# 全功能计划 P1 工作进度（2026-11-13）

基线：`main@913b3a9`。本轮 worktree：`.worktree/full-service-p1-20261113`；分支：
`feat/full-service-p1-20261113`。标记：`[x]` 已完成并有测试，`[~]` 部分完成，
`[!]` 证据或客户端验收缺口。

## 已完成

- [x] E9-1 客户端 FunOpen 表：导出 523 行、271 个唯一断言；164 行转为可执行规则，
  359 行因表达式/组合/服务端时机等证据不足 fail closed。证据见
  `agent/workflow/evidence/E9-1.md`。
- [x] E9-2 命令到功能 id 映射：静态扫描 10,928 个 Lua 文件，生成 185 条有证据门禁规则；
  14 条同 prototype 直接证明，171 条同管理器唯一 id 且命名吻合。246 个发送点保留缺口。
  `21008/84410` 的 access 修正为 write。证据见 `agent/workflow/evidence/E9-2.md`。
- [~] 活动统一结算：`activity-settlement-service.mjs` 已把榜单快照、逐角色邮件补发、
  个人期数状态和幂等 marker 放入同一事务，提交后推送。T8/T9/T10/T13 合成 family
  专项通过；43 个真实活动家族仍未登记 `settle` adapter，未知 family 保持 running 且不发奖。
- [x] 活动登录/在线同步：模块 92/183 使用生命周期权威结果；ActFrame 阶段发送 3304，
  旧 ActivityTable 发送 3301；`closed` 无可信客户端值时不猜值。证据见
  `agent/workflow/evidence/E9-4.md`。
- [x] P0-2-3 等级事件：事务事件总线、`role.levelUp`、FunOpen 同事务重算、属性/战力缓存
  失效和 COMMIT 后定向 7201 已接通。定向 12/12、快速全量 236 项通过；证据见
  `agent/workflow/evidence/P0-2-3.md`。
- [x] 连接上限配置化：`createLocalGame` 使用正整数 `maxConnections`（默认 8），生产入口
  新增 `FC_MAX_CONNECTIONS`；非法值启动失败，边界测试验证恰好放行、超限断开及释放后重用。
- [!] 等级/战力没有已证实的专用 S2C 推送类型；当前不伪造。资源变化沿用现有业务回包，
  属性变化保证缓存失鲜，7201 仍缺独立用户动作/APK 视觉验收。

## 待完成 P0

- [ ] 推送目标强制为角色/公会/全服三选一，移除隐式广播；审查现有 `publish` 和
  `result.pushes` 调用并补多连接定向测试。
- [ ] 命令注册表对账实际派发 owner：输出未注册、重复 owner、注册无 `supports`、不可达
  命令和编码/回包元数据差异；1407 条逐条有明确状态，不把证据缺口记为已实现。
- [~] 命令功能门禁目前只覆盖 185 条静态映射，其余未声明项仍需在 E9-2 证据增加后补齐；
  读写初值只对有明确 setter 证据的两条完成修正。

## P1 入口条件

P0 横切项和全量验证完成后再进入 P1 属性管线、敌方数值、完整战报和统一战斗模式。
活动真实家族 adapter、7201/3301/3304 APK 视觉和陈旧命令证据继续保留 `[!]`。

## 验证与安全边界

- 2026-11-13 `npm test`：49 文件、236 项，pass 234 / fail 0 / skipped 2。
- 本轮未启停线上服务、未读写线上数据库、未操作模拟器/ADB/APK。
- 所有临时验证只使用源码、临时 SQLite 和组件代码；缺证据仍按 fail closed 处理。
