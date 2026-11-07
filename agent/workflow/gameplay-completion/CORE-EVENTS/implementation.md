# CORE-EVENTS 部分交付

2026-11-07。分支 `task/CORE-EVENTS-20261106`。本轮按总控收窄到 53001/53002 的证据校验与未知推进拒绝；整体状态是“证据待补/部分交付”，不是服务端完成。没有启停实时服务、访问运行数据库、操作 ADB/模拟器或修改 APK。

## 协议证据与结论

| 命令 | 已有证据 | 尚不能确认 |
| --- | --- | --- |
| 53001 | catalog `tcp:c2s:53001:req_activity_state_change`，三次真实请求均解码；请求对象含长度 2 的数字数组与布尔字段，对应本项目 ETF 解码器的 proper list 包装。三次响应均是 seq 对应的空成功。响应 schema 为 `pb_act_state_change_back`。 | 两个数字的业务意义、状态枚举及状态转换条件没有恢复；三次空成功不能证明所有请求都应该成功。 |
| 53002 | catalog `tcp:c2s:53002:req_act_stage_change`；ActFrameCmd 直接 ETF 编码 input-register；响应 schema 为 `pb_act_role_stage_change_back`。 | 没有真实请求/响应录制；请求字段和阶段转换规则没有恢复。 |
| 53006 | catalog `tcp:c2s:53006:req_act_get_act_list_data`；响应 schema 为 `pb_act_frame_stage_push`。 | 没有实际请求，参数语义未恢复，本轮不添加猜测路由。 |

证据入口：`agent/workflow/interface-catalog/interfaces.json` 中上述 record ID；本地可交付 proto 为 `personal-server/assets/protobuf/activity.net.proto.bin`、`activity.db.proto.bin`、`act_frame.net.proto.bin`、`act_frame.db.proto.bin`。不重新复制原始敏感载荷。

53001 的三组录制位置：

- `protocol-2026-10-25:game:tcp-65:c2s:788` → `s2c:18367`。
- `protocol-2026-10-25-r2a:game:tcp-29:c2s:788` → `s2c:18954`。
- `protocol-2026-10-25-r2a:game:tcp-69:c2s:812` → `s2c:18970`。

这些录制没有隔离用户操作验证，公开 catalog 只保存 shape；本轮没有原始数值可用。因此不把两个数字命名为 act/state，不递归扫描任意数字提取活动 ID，也不构造年度窗口或未经证实的关闭/结算状态。

## 修改

`gateway.mjs` 将 53001/53002 从通用空成功分支独立出来：

- 先解码 ETF；坏编码返回业务错误 1。
- 53001 严格要求 proper `OtpErlangList`、长度 2、两个安全整数；tuple、improper list、字符串、其他长度等返回 1。
- 已证 shape 的 53001 与尚未恢复字段的 53002 返回业务错误 5，并记录 `activity_stage_sync_rejected`；不会承诺发生了未实现的推进。
- 这两个命令不进入写事务，不改模块 92/183、资源、领取位或其他存档。

此变更会让真实客户端在发出这两种未实现命令时收到错误；原先空成功只是掩盖缺口。真实 APK 提示影响仍待用户安排，不把 TCP 验证等同可玩验收。

已删除本轮临时 `inspect-core-events.mjs` 与无证据状态推进草稿。未修改 `game-store.mjs`、活动日历、模块 8/90、邮件或 207 结算路径。

## 既有生产路径复核

| 范围 | 当前权威来源/作用域 | 剩余缺口 |
| --- | --- | --- |
| 活动日历 | `activity-calendar.mjs` 已有 schedule/all-open、开服日、服务资格、窗口与 fishing 初始化；module92 登录按该日历过滤，module183 的 all-open 期限归一化已有实现。 | 状态 50 以外的生命周期配置、结束补跑、展示/结算阶段与邮件奖励规则未恢复；不能从有字段推导出转换业务。 |
| task / 9010 | `currentTaskProgress` 读取主线、模块21统计及命途107；领取位与奖励同事务；模块90保留四个通用槽和线性槽4。 | 多个 progress_fun 没有对应玩法权威状态；不能用客户端自报完成。 |
| every-task | role + scope + period_key 防重，日/周/永久主任务各自隔离；登录从领取表重建模块91。 | 进度仍调用全量统计读取，日/周统计区间没有接入；仅重置领取位不能证明旧消费不会重计。需按已证 count_list/mod_day 与各任务 reset 规则补齐，不能统一改总量语义。 |
| growth-road | role + road_version + kind + item_id 防重，1102–1110 读取模块21。 | 1111–1113 的 progress_fun 203/82 缺权威来源；state 表以 role 为主键，真正多版本/跨期保留尚需定义。 |
| first-week | role + activityId/start/end 的 period_key + kind + item_id 防重；统计源可计算的任务已经可领取。 | progress_fun 回调、挑战日/结算规则未闭合；不能固定全服完成。 |
| 招募事件 | `recruit-service.mjs` 的真实 601 事务更新模块21统计并调用 `onDraw`；gateway 已接 `heroDrawActivity.recordDraw`。 | 此分支已经接线，本轮不重复实现；其余任务消费哪种统计及区间需逐配置确认。 |
| 战斗/领取事件 | 207 才提交体力、主线及奖励；领取服务已有各自事务。 | 当前缺统一可持久事件键、玩法统计维度与活动重置/结算映射。只在 gateway 事后加计数会漏回滚，不能作为替代。 |

在本轮收窄范围内，没有找到可直接新增且无需确认玩法维度/周期规则的独立生命周期分支；已存在的招募事件保持复用。下一步应先恢复状态枚举/转换和任务函数绑定，再在业务事务内部接事件，保留幂等键与重启补跑依据。

## 验证

临时 TCP 测试扩展在 `personal-server/test/gameplay-gateway.test.mjs` 的真实握手/登录场景中：

- proper 两整数 ETF list 的 53001 返回 5；已证外形的两个数仅作 shape 测试，不当作活动/状态。
- ETF tuple 的 53001 返回 1；53001/53002 的截断 ETF 均返回 1。
- 53002 返回 5；上述请求前后 SQLite 回读的 module92/183 序列化字节完全相同。
- 原场景继续执行真实 201→207、招募、商店和活动请求，保证拒绝分支没有损坏后续帧。

复现：在 `personal-server/` 执行 `node --test --test-concurrency=1 test/gameplay-gateway.test.mjs`，7/7 通过。相关活动、邮件、207、任务、成长与首周回归及主线保持核对结果见下方最终验证记录。

SQLite 新增/迁移：无。新增运行资产/部署依赖：无。APK/UI：未验收。

### 最终验证记录

- 相关回归基于 main `b6e1766`（含 CORE-SKILL-GATES）；最终 rebase 到 main `7599ef8`，保留总控统计及技能/奖池行，仅修改 CORE-EVENTS 行。`git diff --check` 通过。
- 相关回归 100/100 通过，命令：

```powershell
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs test/activity-calendar-config.test.mjs test/activity-calendar.test.mjs test/relic-divine-gateway.test.mjs test/mail-voucher.test.mjs test/mission-fight-service.test.mjs test/task-service.test.mjs test/item-everytask-service.test.mjs test/item-commontask-service.test.mjs test/item-growthroad-service.test.mjs test/item-growthroad-gateway.test.mjs test/item-firstweekgoal-service.test.mjs test/item-firstweekgoal-gateway.test.mjs
```

- 与 main 比较，`game-store.mjs`、`energy.mjs`、`mission-progress.mjs`、`resources.mjs`、`mail-service.mjs`、`activity-calendar.mjs`、`relic-divine-login.mjs`、`mission-fight-service.mjs`、`mission-extra-service.mjs`、`task-service.mjs` 无差异。
- gateway 仅替换原 53001/53002 空成功分支；108/102801/10503 的既有确认、全部其他路由、在线礼包/成就/首周/成长登录、1316 属性与技能装配保持不变。
- 测试临时 TCP/SQLite 由已有测试清理；未留下 inspect 脚本、独立临时数据库或未结束测试进程。本轮未运行全量，集成全量由总控执行。
