# PLAY-HELPUPACT 助力升阶/升超凡活动

2026-11-07。分支 `task/PLAY-HELPUPACT-20261107`，worktree `.worktree/gameplay-20261106/play-helpupact`，基线 `main@ea31832`。

状态：**服务端完成**（116001/116002/116003/116004 均有真实状态转移），服务、临时 TCP、SQLite 重开与回滚已验证；**无 APK 验收**，客户端入口与真实请求仍未取证。

## 配置依据

### 直接读自客户端数据（配置事实）

| 来源 | 内容 |
| --- | --- |
| `ActFrameTable.Act` 1096001 | `type=1096`、`version=1`、`ref_name=助力升超凡活动`、`show_name=691001`、`jump_func=3061`、`world_time=1788642000`、`duration_day=34`、`end_time=18000`、`stage=[50,90]`、`stage_duration_day=[5,29]`、`server_day_limit=1` |
| `ActFrameTable.ActType` 1096 | `lua_entity=HelpUpActData`、`lua_module=HelpUpActMgr`、`big_type=21`、`data_type=3`、`func_open=1632` |
| `ModuleTable` 92144 | 模块 92 内的入口行 `活动_助力升超凡`，`e_dir=project/activity/help_up_act`；**是入口 id，不是 act tid** |
| `HeroTable` 常量 | `ShowHelpUpParam` = `[400074,400010,400076,400077]`（展示用英雄，非协议事实） |
| `update-manifest-364110.txt` | `helpupact.bundle`（texture/ui/effects）存在；无单独数据表 bundle 名 |
| `help_up_act.net.proto.bin` / `help_up_act.db.proto.bin` | 116001 `{act_id, task_id_list}`→`{act_data, res}`；116002 `{act_id, stage_tid_list}`→`{act_data, res}`；116003 `{act_id, times}`→`{res, help_times}`；116004 `{act_id}`→`{times}`；`pb_help_up_act_data{act_id, daily_task_tid_list, weekly_task_tid_list, last_update_time, stage_tid_list, last_rec_time}`；`pb_help_up_act_login_data{act_data, help_times}` |

### 新补齐的配置表

`HelpUpActTable` 未在仓库既有 41 张表内。本轮从 `apk/com.jzyx.ps.v9-working.apk` 的 `assets/Android/script/lua/64_lua_project.bundle` 中只读抽取 TextAsset `HelpUpActTable.data.lua`（7,377 B），用 `tools/dump-table-prototypes.mjs` 转成 `personal-server/assets/tables/HelpUpActTable.data.lua.json.gz`（7,952 B），由 `personal-server/config/help-up-act-tables.mjs` 读取。解码结果：

| 子表 | 行数与内容 |
| --- | --- |
| `Version` 1 | `cost_item=834102`（助力手卷）、`cost_item_max=10`、`help_times=1`、`task_library=1`、`stage_library=1`、`award_group=1`、`recycle_mail_tid=9501400`、`fake_gen_start_time=28800`、`fake_gen_end_time=79200`、`fake_gen_interval=1`、`fake_gen_num=60` |
| `Task` 101–104 | 均 `belonging_version=1`、`cycle_type=1`、`award=[[834102,5]]`；`101 task_type=100816 target=1 sort=1`、`102 6712 target=1 sort=2`、`103 4701 target=100 sort=3`、`104 8301 target=100 sort=4` |
| `Stage` 101–103 | `stage=1/2/3`、`stage_num=5000000/10000000/15000000`、`award=[[5111200,5],[3401200,1]]` / `[[3021200,3],[10064100,5]]` / `[[25500704,20],[835702,1]]`、`hero=3030501/5040701/5040701`、`star=5/4/6` |
| `Award` 101–116 | 同一 `group=1`，每行 `weight=100`，单条奖励如 `[[101500,88]]`、`[[392002,1]]`、`[[101800,8888]]`；即每次助力的信封抽奖池 |
| `Show` 1 | 信封标题/正文/签名文本 id、`fake_group=1`、`help_times_interval=20`、`fake_channel_count=200`、`fake_official_count=1397`、`fake_item_num_multi=5`（客户端伪造跑马灯） |
| `FakeChannel` 101–104 / `FakeShow` 101–103 | 跑马灯假数据（`S/Y/H/X` 前缀 1429/1215/22/17、权重 6/3/1）；客户端展示用，服务端不生成 |

### 客户端 Lua 行为（字节码常量与调用序列）

- `HelpUpActData._ParseDataImpl` 用 `pb_help_up_act_login_data` 解析活动自身数据块：`_overallHelpTimes=help_times`、`_actData=act_data`；`stage_tid_list`→`_stageReceivedTidMap`、`daily_task_tid_list`→`_dailyTaskReceivedTidMap`、`weekly_task_tid_list`→`_weeklyTaskReceivedTidMap`。**三个列表是已领取记录，不是可领列表。**
- 同一原型用 `TimeKit.IsSameDay/IsSameWeek` 比较 `last_update_time` 决定日/周领取位重置。
- `HelpUpActMgr` 原型 25（`req_help_up_get_times` 回包）把 `rsp.times` 传入 `RefreshOverallHelpTimes`；原型 27（`req_help_up_help` 回包）把 `rsp.help_times` 传入 `RefreshOverallHelpTimes`，并 `AwardKit.Parse(rsp.res)`。两处都指向**全服累计助力次数**。
- `HelpUpActMgr` 原型 33 在发 `req_help_up_task_reward` 前检查 `GetActData` 与 `IsRunning`，否则弹 `ACTIVITY_IS_OVER`；错误分支含 `ACHIEVE_LIMIT`/`MAX_LIMIT`。
- `HelpUpActUtil`：`GetStageProgress` 按 `Stage.stage_num` 做 `min/max` 归一；`GetNeedItemNum=ceil(max(a,0)/b)`、`GetSubmitItemNum=min(a,b,c)`。
- `HelpUpActEnvelopeForm`：用 `Show.envelope_*` 展示信封，`GetOverallHelpTimes` 与 `Stage.stage_num` 比较后 `ReqStageAward`。

### 推断（非配置事实，已在代码注释与本文标注）

1. 每次助力消耗 1 个 `cost_item`、累加 `help_times=1`：由 `cost_item`/`cost_item_max`/`help_times` 三列与 `GetNeedItemNum` 的向上取整语义推出，单次请求上限 `times ≤ cost_item_max`。
2. 每次助力从 `Award(group=award_group)` 按 `weight` 抽一行信封奖励并随 `res` 发放；`Award` 表与 `award_group` 字段是事实，"每次一条"是推断。
3. `cycle_type=1` 视为 `CYCLE_DAILY`，其余视为周常。客户端常量 `CYCLE_DAILY/CYCLE_WEEKLY` 的数值未在可抽取资产中找到，当前配置只有 `cycle_type=1`，周常列表因此恒为空。
4. 周重置边界取服务器 08:00 日界对齐到周一（与 `activity-calendar.dayZero` 一致）；`TimeKit.IsSameWeek` 实现未取证。
5. 单角色部署下"全服累计助力次数"存在该角色自己的行上；没有第二玩家或机器人参与。

## 实现

代码改动（3 个文件 + 1 张表资产 + 测试）：

- `personal-server/assets/tables/HelpUpActTable.data.lua.json.gz`：新增配置表 dump。
- `personal-server/config/help-up-act-tables.mjs`：`readHelpUpActTables()` 读取 `Task/Show/Version/FakeChannel/FakeShow/Stage/Award`。
- `personal-server/game/activity-read-service.mjs`：
  - 移除 116001–116003 的 `refused` 与 116004 的固定零 `reads`；`HELP_UP_TYPES` 加入 `supports()`。
  - 新表 `help_up_act_state(role_id, act_id, overall_help_times, last_update_time, last_rec_time, stage_tid_list_json, daily_task_tid_list_json, weekly_task_tid_list_json, created_at, updated_at)`，构造时 `store.inspect` 幂等创建。
  - `116004` 读 `overall_help_times`（真值，非零占位）；`116003` 在同一事务内校验 `times` 上限、扣 `cost_item`、抽信封、累加总数、`res`+`help_times`；`116001` 用 `currentTaskProgress`（TaskTable.Type 统计）校验 `target_count`，按 `cycle_type` 写日/周领取位并 `last_rec_time`；`116002` 用 `Stage.stage_num` 对齐总数后写 `stage_tid_list`。
  - 所有写入走 `store.transaction`：编码或 SQLite 失败整体回滚。
  - `synchronizeHelpUpLogin(activity, at)` / `helpUpLoginPayload(actId, at)`：把 `pb_help_up_act_login_data` 放进模块 92 活动条目的 `module_login_data`（客户端 `HelpUpActData._ParseDataImpl` 正是从那里解析），并在登录时按日/周重置领取位。
- `personal-server/game/gateway.mjs`：`loginPayload()` 在打包模块 92 前调用 `activityRead.synchronizeHelpUpLogin(activity, loginSeconds)`（1 处调用 + 日志）。命令分发无需改动，`activityRead.supports()` 已覆盖 116001–116004。
- `personal-server/test/help-up-act.test.mjs`（8 项）：配置解析、助力扣道具与累计、任务领奖与统计门槛、阶段领奖与 `stage_num`、批量回滚、日重置、登录块、真实 TCP。
- `personal-server/test/activity-read-service.test.mjs`、`personal-server/test/gameplay-gateway.test.mjs`：把旧的"116001–116003 拒绝 5 / 116004 固定 0（act 92144）"断言改成新语义（空包=1，未知 act=1）。

错误码沿用本项目约定：`1` 请求非法、`301` 资源不足、`309` 活动未开启、`310` 已领取、`311` 条件未达。

## 复现

```powershell
# 配置表抽取（只读 APK，不重打包）
$out='analysis\scratchpad\helpupact-20261107'
# 1) 取 assets/Android/script/lua/64_lua_project.bundle（102,832,516 B）到 $out
# 2) 取 TextAsset HelpUpActTable.data.lua
node tools/dump-table-prototypes.mjs $out\assets\HelpUpActTable.data.lua $out\HelpUpActTable.data.lua.json
# 3) gzip 到 personal-server/assets/tables/HelpUpActTable.data.lua.json.gz

# 验证
cd personal-server
node --test --test-concurrency=1 test/help-up-act.test.mjs
node --test --test-concurrency=1 test/activity-read-service.test.mjs test/activity-calendar.test.mjs test/gameplay-gateway.test.mjs
```

## 验证分层

| 层 | 结果 |
| --- | --- |
| 服务专项 | `test/help-up-act.test.mjs` 8/8 通过（含 4 项 SQLite 重开/回滚断言） |
| 既有回归 | `activity-read-service` + `activity-calendar` + `gameplay-gateway` 20/20 通过 |
| 登录/模块 92 相关 | `acc-recharge`、`hero-progression`、`hundred-schools`、`pet-activity`、`recharge-rebate-reset`、`relic-divine-gateway`、`welfare-service` 61/61 通过；`task-service` + `every-task-service` 19/19 通过 |
| 真实临时 TCP | 握手 → 登录 → 116004/116003/116001/116002 真实数字 type；登录模块 92 内含 1096001 条目且 `module_login_data` 可解出 `pb_help_up_act_login_data` |
| SQLite | `help_up_act_state` 重开后领取位与累计值保持，重复领奖仍返回 310 |
| 异常回滚 | `[101, 999]` 批量领奖报错后无道具、无领取行；助力道具不足报 301 且总数不变 |
| APK | **未验收**（本轮未操作模拟器/ADB/APK） |

未跑全量 `npm test`（按分工由总控统一执行）。

## 剩余缺口

1. 无客户端真实 116001–116004 请求或界面证据（`agent/workflow/fixes/helpup-act.md` 记录的缺口延续），本任务是服务端闭环。
2. 活动窗口为 `world_time=1788642000` + 34 天（约 2026-09-06 → 2026-10-10），当前日期已过；不排期或不做定制窗口时模块 92 不会带该活动。测试用 `act_custom_list` 定制窗口让日历判定为开启。
3. "全服"累计次数在单角色部署下就是该角色自己的计数；跨角色/跨服聚合语义无证据，未实现，也未造机器人或第二玩家。协议 `req_help_up_help` 只有 `act_id`/`times`，没有目标角色字段，因此不存在可伪造的"被助力对象"。
4. `cycle_type`→日/周映射与周重置边界为推断；`CYCLE_DAILY` 常量值未取证。
5. 每次助力抽一条 `Award` 信封为推断；客户端是否合并展示多条信封未验证。
6. `stage_num` 500 万/1000 万/1500 万是原始配置的全服门槛，单机正常玩法几乎不可能自然达到；测试通过直接写库对齐总数验证领取路径，不代表线上可自然达标。
7. 客户端伪造跑马灯（`FakeChannel`/`FakeShow`/`fake_gen_*`）属展示层，服务端不参与，也未伪造。

## 总控接入清单

- 合并 `task/PLAY-HELPUPACT-20261107`；新增资产 `personal-server/assets/tables/HelpUpActTable.data.lua.json.gz` 需随代码一起提交（仅表 dump，APK 未改）。
- `gateway.loginPayload()` 中的 `activityRead.synchronizeHelpUpLogin(activity, loginSeconds)` 是唯一的登录接入点；**未臆造数字登录槽**——客户端从模块 92 活动条目的 `module_login_data` 解析，若后续取证到独立模块 id，再改为独立槽位。
- 表 `help_up_act_state` 由服务构造时自动创建，无需 `game-store.mjs` 迁移改动。
- 回归命令见上；全量 `npm test` 由总控执行。
- APK 验收建议：把 1096001 排期或下发定制窗口后，登录应出现"助力升超凡"入口；界面显示的总助力次数 = `pb_help_up_get_times_rsp.times`，助力后应扣 834102 并获得信封奖励，任务/阶段红点随统计与总数变化。
- 若客户端实际发送的不是 1096001（例如沿用 92144 之类的入口 id），服务会返回错误 1 并落 `activity_read_rejected` 日志，用该日志与真实包修正映射。

## BLOCK-G2 回归（2026-11-08）

本块未改动该活动实现；G2 网关派发只覆盖 minigame-act-service 注册的命令（102001-111015），既有命令仍由原实现处理，全量 npm test 通过。

