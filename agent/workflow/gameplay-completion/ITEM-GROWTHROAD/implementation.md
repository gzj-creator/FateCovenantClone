# ITEM-GROWTHROAD 实施记录

日期：2026-11-07
分支：`task/ITEM-GROWTHROAD-20261106`
基线：`main@d375bf6`（含 ITEM-FIRSTWEEKGOAL、HERO-HERO、207 体力、邮件推送、活动/fishing 登录期限修复；实现提交 `69e3f03`）

## 结论

已接通 `69001 req_growth_road_progress_award` 与 `69002 req_growth_road_task_award` 的登录快照、ETF 请求、权威领取状态、资源发放、SQLite 防重和 PB 回包。临时 TCP 通过真实握手与 `909103` 登录，登录模块 `53696` 与直接回包读取同一状态。

成长值来源按客户端配置：`GrowthRoadTable.Task.type` 指向 `TaskTable` 的 `TaskType`。其中 `1102..1110` 为 `progress_type=2` 统计任务，按既有 `module 21 → CountStatistics.data` 槽位计算；`1111..1113` 使用 `progress_fun=203/82` 客户端回调，个人服务器没有对应权威事件，领取返回业务错误 `5` 并写明原因，不放行固定进度。

## 配置与协议依据

- `personal-server/assets/protobuf/growth_road.net.proto.bin`：`pb_growth_road_back { info, res }`。
- `personal-server/assets/protobuf/growth_road.db.proto.bin`：`pb_growth_road_master { data_list }` 与 `pb_growth_road { version, progress_value, progress_award, task_award, rev_overdue }`。
- `GrowthRoadCmd.lua` 反汇编（461B，SHA256 `7e6da2102f9818aec844a3d54120162de4c2479e3cd97b0626dac0f7ec2378ab`）：两个导出分别以 `Codec.EncodeErl` 发送 ETF 参数、以 `Codec.EncodePB` 接收 `pb_growth_road_back`。
- `GrowthRoadMgr.lua` 反汇编：`LoginParse` 解 `pb_growth_road_master`，`ParseData` 解 `pb_growth_road`；`ReqTaskAward(tid)` 先校验 `TaskMgr:IsTaskFinishAll(type,target_count)` 再发 `69002`，`ReqProgressAward(tid)` 校验 `Progress.need_count <= progress_value` 再发 `69001`。
- `ModuleTable` 行 `92009 活动_成长之路 → project/activity/growth_road`，登录容器列为 `53696`（同族 `92027 首周目标 → 59015` 的既有实现先例）。
- `ActivityTable` 行 `17001 成长之路`：`func=17`、`version=1`、`server_day=1`、`start_time/end_time=18000`、`duration_day=9998`，即开服第 1 天 05:00 起长期开放。
- `GrowthRoadTable` 由 `tools/extract-growth-road-table.mjs` 从本地 APK 的 `assets/Android/script/lua/64_lua_project.bundle` 的 `GrowthRoadTable.data.lua` 抽取，收纳为 `personal-server/assets/tables/GrowthRoadTable.data.lua.json.gz`：`Task=318`、`Version=1`、`Progress=12`、`Tag=4`。
  - `Task`：`tid,tag,type,target_count,growth_value,award_list`。
  - `Progress`：`tid,need_count,award,award_n,award_new,award_new_n,overdue_award,overdue_award_n`，门槛 200→8000。

## 实现

- `personal-server/config/growth-road-tables.mjs`：校验四张表行数、ID 唯一性、tag/type/target/growth_value、任务奖励对和进度奖励字段，建立按 `tid` 与门槛排序的索引。
- `personal-server/game/growth-road-service.mjs`：
  - 按 `ActivityTable.func=17` 取窗口；开服时间与 `/clock` 一致，跨期由窗口判断。
  - `69002`：校验任务存在、未领取、`module 21` 权威统计 ≥ `target_count`，写入领取位并把 `growth_value` 累加到 `progress_value`，按下发任务奖励。
  - `69001`：校验进度档存在、未领取、`progress_value >= need_count`，按 `cutting_time` 选择 `award_new/award_new_n` 或 `award/award_n`，写入领取位并下发奖励。
  - 领取位、`progress_value`、`rev_overdue`、资源变化与 PB 回包在同一 `store.transaction` 内提交；编码或 SQLite 失败整体回滚。
  - `growth_road_state` 与 `growth_road_claims` 均以 `CREATE TABLE IF NOT EXISTS` 在服务构造期创建，不改 `game-store.mjs`。
  - 登录模块 `53696` 与 `69001/69002` 回包读取同一 `growth_road_state`/`growth_road_claims` 权威状态。
- `personal-server/game/gateway.mjs`：新增服务实例、登录槽位同步和精确数字派发；复跑确认与 `onlineGift.beginSession()`、`rankAchieve.ensureLoginState()`、`firstWeekGoal` 登录/派发共存。

## 验证

```powershell
cd personal-server
node --test test/item-growthroad-service.test.mjs test/item-growthroad-gateway.test.mjs test/item-firstweekgoal-service.test.mjs test/item-firstweekgoal-gateway.test.mjs test/gameplay-gateway.test.mjs
```

结果：`32/32` 通过（本任务专项 9 项 + 首周目标 13 项 + HERO-HERO 9 项 + gameplay-gateway 1 项）。覆盖：

- 配置抽取行数与字段；任务奖励、成长值累加、进度门槛与奖励档位。
- 未完成统计、未达门槛、非法 ID、多 ID 请求、重复领取（`310`）、`progress_fun` 缺来源（`5`）。
- PB 编码异常时领取位与资源整体回滚；SQLite 关闭重开后领取位与 `progress_value` 仍有效。
- 临时 TCP：真实握手 → `909103` 登录 → 登录模块 `53696` 解出 `pb_growth_road_master` → `69002` ETF 请求 → `pb_growth_road_back`，并验证重复 `310`、未达门槛 `5`、非法 ID `1`。
- 已 rebase 到含 HERO-HERO 的 `main@d375bf6`，网关同时保留 `heroExtra`、`growthRoad`、`firstWeekGoal` 派发以及 `onlineGift.beginSession()` / `rankAchieve.ensureLoginState()` 登录路径；`git diff main..HEAD` 只新增本任务文件。

未执行：实时服务启停、模拟器/ADB、运行数据库读写、APK 改动或 APK/UI 验收（不属于本任务阶段）。

## 推断与剩余证据

- `69001/69002` 的 ETF 参数是单个 `tid`：依据 `GrowthRoadMgr` 调用点和 `GrowthRoadCmd` 直通首参反汇编；尚无真实客户端实包验证。服务端同时接受 `[tid]`、裸整数与 `{tid}` 形态，多 ID 明确拒绝，避免误吞列表。
- `award_new/award_n` 与 `award/award_n` 以 `Version.cutting_time` 选择，属配置字段推断；`overdue_award` 仅在活动过期且领取“已达成的最高档”时使用，`rev_overdue` 置 1，同样需原服对照。
- `1111/1112/1113` 依赖 `progress_fun=203/82`，缺生产事件与计数来源，当前明确拒绝。`1102..1110` 的统计总量取决于模块 21 是否已由既有玩法写入；未写入时为 0 且不可领。
- 活动 17001 `duration_day=9998`、无暂停/循环分支；未取得原服跨版本换代与皮肤侧（`Version.skin_*`）回填证据，本次不写皮肤奖励。
