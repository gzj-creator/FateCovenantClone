# BATTLE-TRIMATCHPVP 实施记录（三消 PVP 活动）

日期：2026-11-08。分支 `task/A2-TRIMATCH-20261108`，worktree
`.worktree/gameplay-20261108/a2-trimatch`。本卡只做活动侧服务端实现，未启停实时服务、未读写运行数据库、
未操作模拟器/ADB/APK、未派子 agent；验证只用 `node --check` 与 `git diff --check`。
三消 PVP 的匹配/对战管线属于 OVERALLPVP 卡（101101–101130），本卡不碰。

## 任务范围

模块 `TriMatchPvpCmd`，4 条命令此前完全没有路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 121001 | `req_tri_match_pvp_rec_task_award` | protobuf `pb_tri_match_pvp_rec_task_award_req` → `pb_tri_match_pvp_rec_task_award_rsp` | 已实现（目标校验、每日领取防重、真实发奖） |
| 121002 | `req_tri_match_pvp_rec_grade_award` | protobuf `pb_tri_match_pvp_rec_grade_award_req` → `pb_tri_match_pvp_rec_grade_award_rsp` | 已实现（按历史最高分校验、终身一次、真实发奖） |
| 121003 | `req_tri_match_pvp_get_report_list` | protobuf `pb_tri_match_pvp_get_report_list_req` → `pb_tri_match_pvp_get_report_list_rsp` | 已实现（落库战报按时间倒序取最近 30 条） |
| 121004 | `req_tri_match_pvp_rec_giveup` | ETF 无参 → ETF 空元组 | 已实现（`day_giveup=5` 限额、累计计数） |

4 条命令全部实现：4/4。

同时把三张卡的服务接进网关：`gateway.mjs` 增加 4 行 import、3 个服务实例 + `readTriMatchTables`、
`triMatchSchemas` 常量和一个派发块（纯新增，未重排既有代码）。

## 配置与协议证据

### protobuf（明文 .proto，直接读取）

`personal-server/assets/protobuf/tri_match_pvp.net.proto.bin`、`tri_match_pvp.db.proto.bin`：

- `pb_tri_match_pvp_rec_task_award_req{act_id, ids}` →
  `pb_tri_match_pvp_rec_task_award_rsp{data: pb_tri_match_pvp_act_res_data{act_data, res}}`。
- `pb_tri_match_pvp_rec_grade_award_req{act_id, ids}` →
  `pb_tri_match_pvp_rec_grade_award_rsp{data, award: bytes}`。
- `pb_tri_match_pvp_get_report_list_req{act_id}` →
  `pb_tri_match_pvp_get_report_list_rsp{report_list}`。
- `pb_tri_match_pvp_act_data{act_id, last_update_time, received_daily_task_ids, received_grade_ids,
  score, daily_success_times, last_settlement_fight_id, match_times, give_up_num,
  success_streak_times, report_list, max_score}`，字段注释写明 `report_list` 是“最近30场”、
  `success_streak_times` “失败时清零”、`max_score` “历史最高分”。
- `pb_tri_match_pvp_report{fight_uid, time, atk_role_id, def_role_id, result, atk_score_change,
  def_score_change, atk_power, def_power, is_robot, fight_tid}`。
- `pb_tri_match_pvp_set_data{act_data, res, score_change}` 是结算推送载荷（未来 PVP 对战管线用）。
- `tri_match_pvp.net.proto.bin` 里没有放弃（121004）的请求/回包消息。

### 客户端 LuaJIT 字节码

来源目录 `analysis/scratchpad/time-temple-20261108/project/`，用
`tools/dump-luajit-prototypes.mjs` 读取：

- `TriMatchPvpCmd.lua.bin`：121001/121002/121003 用 `Codec.EncodePB`，121004
  （`req_tri_match_pvp_rec_giveup`）发裸 Erlang 项。
- `TriMatchPvpMgr.lua.bin`：121002 仅在 `TriMatchPvpData.GetGradeAwardState() == STATE_RECEIVE`
  时发送；121003 结果经 `SetReportList` 存下来；121004 用 `IsGiveUpLimitReached` 对
  `Version.day_giveup` 做限制。
- `TriMatchPvpData.lua.bin`：段位状态由 `GetMaxScore() >= ActGrade.need_score` 判定；
  每日任务状态按 `ActTask.FlushTime` 每日刷新，并通过
  `TaskMgr.IsTaskFinishCommon(task_type, target_count, task_param)` 判断是否完成。
- `TriMatchPvpUtil.lua.bin`：机器人队伍走 `Team.def_team → attr → NpcAttr → CalcPower`，
  这也是 `TripleMatchFightNpcAttr` 表在三消战斗里的用途。

### 活动实例（`ActFrameAct` / `ActFrameType`）

- `ActFrameAct` 中 `type === 1304` 的实例是 `1304001`（三消 PVP），`ActFrameType` 里
  1304 指向 `TriMatchPvpData`。活动 id 由这张表推导，不写死。

### 表数据（`TriMatchPvpTable`）

| 子表 | 行数 | 关键字段与样例 |
| --- | ---: | --- |
| `Version` | 1 | `{tid:1, task_lib:1, grade_lib:1, init_score:0, day_giveup:5, report_max:30, match_robot:2, success_times_add:[10,5000], score_rank_id:443, cancel_match_count:5, cancel_match_time:300, ...}` |
| `ActTask` | 6 | 101–103 `task_type:102001`（target 1/3/5）、104 `102002`（target 2）、105–106 `102003`（target 1/3），全部 `lib:1`，`task_param:0` |
| `ActGrade` | 19 | 101 `need_score 0` 且 `award:[]`（只有 `success_award`）、102 `need_score 50`、103 `need_score 100`…；`settlement_score:30`、`settlement_score_fail:0` |
| `ActRobot` | 138 | 机器人队伍配置，供未来匹配使用 |
| `ActRobotConst` | 1 | `{base_min_power_rate:90, base_max_power_rate:120, streak_threshold:3, win_streak_power_rate:10, lose_streak_power_rate:10}` |
| `ActRankAward` | 13 | 排行榜奖励，本轮未接 |

## 实现

新增 `personal-server/game/trimatch-pvp-service.mjs`（`createTriMatchPvpService`），
复用 `trimatch-core.mjs` 的 `grant/ensureTrimatchTables` 与
`protocol/game-codec.mjs` 的 `encodeEtfIntegerTuple`。

### 权威状态（SQLite，事务内幂等建表）

```sql
trimatch_pvp_state(role_id, act_id, score, max_score, daily_success_times, daily_match_times,
                   daily_give_up, give_up_num, success_streak_times, match_times, day_key,
                   last_update_time, last_settlement_fight_id, updated_at,
                   PK(role_id,act_id))
trimatch_pvp_claim(role_id, act_id, claim_type, claim_key, created_at,
                   PK(role_id,act_id,claim_type,claim_key))
trimatch_pvp_report(role_id, act_id, fight_uid, fight_tid, time, atk_role_id, def_role_id,
                    result, atk_score_change, def_score_change, atk_power, def_power,
                    is_robot, created_at, PK(role_id,act_id,fight_uid))
```

`claim_type` 取 `daily_task`/`grade`；每日任务的 `claim_key` 是 `<UTC 日期>:<taskId>`，
段位是 `<gradeId>`（终身一次）。`day_key` 变化时清零每日计数，`score/max_score/match_times/
give_up_num` 这类活动期计数保留。

### 各命令业务

- **121001 每日任务**：`ids` 非空、≤64、无重复；任务必须在 `lib === Version.task_lib`（=1）的
  `ActTask` 里，`target_count > 0`，对应计数达到目标，且当天没领过。整批通过才发奖并写领取记录，
  任何一条不合法整批回滚。回包 `pb_tri_match_pvp_rec_task_award_rsp.data = {act_data, res}`。
- **121002 段位奖励**：`lib === Version.grade_lib`（=1），`max_score >= ActGrade.need_score`
  才可领，领过报 `CODE_LIMIT`。`ActGrade 101` 的 `award` 是空数组，这是原表数据
  （它只有 `success_award`），所以空奖励按“记录已领、发 0 资源”处理，而不是报错。
  回包 `pb_tri_match_pvp_rec_grade_award_rsp.data = {act_data, res}`。
- **121003 战报列表**：从 `trimatch_pvp_report` 按 `time DESC, fight_uid DESC` 取
  `Version.report_max`（=30）条，字段全部转成 protobuf 的 int64 字符串/bool。
  数据由结算缝写入，客户端无法自报。
- **121004 放弃**：`daily_give_up >= Version.day_giveup`（=5）报 `CODE_LIMIT`；
  否则 `daily_give_up` 与活动期 `give_up_num` 各加一。请求是裸 ETF，回空 ETF 元组。
- **结算缝 `recordFight(model, db, payload)`**：供未来的三消 PVP 对战管线调用。写入真实战报行，
  并推进 `score`（同时刷新 `max_score`）、`match_times`、`daily_match_times`；胜利加
  `daily_success_times` 与 `success_streak_times`，失败把连胜清零。

### 网关接线

`triMatchSchemas` 把 `121001/121002/121003` 登记为 protobuf 请求，其余
（`115003/115005/115006/121004`）走 `decodeEtf`；派发块按
`triMatchFight → triMatchTower → triMatchPvp` 顺序找服务，成功打 `trimatch_committed`、
失败按 `GameError.code` 回错误并打 `trimatch_rejected`。开战成功时通过
`hooks.onFightSettled` 把战斗结果交给爬塔 `settle`。

## 验证

按任务纪律只做静态检查：`node --check` 覆盖 `trimatch-pvp-service.mjs` 与改动后的
`gateway.mjs`，`git diff --check` 无空白/冲突标记问题。本卡未运行 `npm test`、未起本地服务、
未连真实 TCP、未读写运行数据库、未做 APK 验收，因此**没有**任何“已实测”结论。

## 未闭合缺口

- **任务计数的 task_type 映射是推断**：`ActTask.task_type` 在 `CountStatistics` 里对应
  expand 10019–10021，公开表 dump 没有这三条定义；本实现按三条阶梯的自然语义映射成
  `102001→每日胜场`、`102002→连胜`、`102003→每日场次`，其他 task_type 直接
  `CODE_STATE` 拒绝（fail closed），不猜。
- **121002 的 `award` bytes 未填**：回包里另一个 `bytes award` 字段编码未恢复，当前留空。
- **121004 回包 schema 未恢复**：proto 里没有放弃消息，客户端也没有用 PB 解析，当前回空 ETF
  元组；原服是否回别的内容（例如 `pb_tri_match_pvp_act_data`）没有证据。
- **战报在 PVP 对战管线落地前为空**：121003 正常返回空列表，因为没有任何真实匹配战写入
  `trimatch_pvp_report`；胜负、积分变化的服务端规则（`ActGrade.settlement_score`、
  `Version.success_times_add`）本轮没有接入。
- **匹配/对战属 OVERALLPVP 卡**：101101–101130 的三消匹配、机器人选择（`ActRobot`、
  `ActRobotConst` 的 90%–120% 战力区间、连胜加成）、超时与取消匹配都不在本卡范围。
- **排行榜未接**：`ActRankAward`（13 行）与 `Version.score_rank_id=443` 指的全服积分榜
  没有实现。
- **登录模块 92 未同步**：PVP 活动数据还没有写进 `pb_tri_match_pvp_role_info` 的登录下发，
  客户端面板可能拿不到段位、任务与战报；本卡只实现命令侧。
- **每日边界按 UTC 日期**：`day_key` 用 ISO 日期（UTC），原服 `ActTask.FlushTime` 的实际时区
  与刷新时刻未核实，跨日前后一小时可能对不上。
- **多活动实例**：121004 没有 `act_id`，只能取 `type 1304` 中 tid 最大的实例；121001–121003
  的 `act_id` 必须是配置实例，其余报 `CODE_STATE`。

