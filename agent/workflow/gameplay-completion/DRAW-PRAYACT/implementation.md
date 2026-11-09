# DRAW-PRAYACT 登录恢复与五奖池实现记录

2026-11-10。独立 worktree `.worktree/draw-activity-login-state-20261109`，分支 `fix/draw-activity-login-state-20261109`，基线 `main@e5b40e5`。本记录修复祈福活动 `104901/104902` 的实例 ID、五奖池推进与模块 183 重登恢复问题。

## 根因

- 客户端登录 ActFrame 实例为 `183013`，`ActFrameAct[183013].version=13`；请求 `104901/104902` 携带的是实例 ID，旧服务却直接以 `183013` 查 `PrayActTable.PrayAct`，而该表主键为 `1..19`，因此无法找到活动。
- `AwardIndex.version=13` 对应奖池索引 `61..65`。旧实现每次抽取只推进排序后的首个索引，另外四个索引的 `draw_cnt`、`progress` 和 `history` 不变化，并且每次只回一个错误的 `draw_info`。
- 选择表单收集并提交全部五个奖池索引；旧服务接受任意非空子集。旧服务同时未从权威 `draw_activity_state` 重建模块 183 的 `pb_pray_act`，重登后选择、次数、进度和领取历史会回到模板状态。

## 实现

- `draw-activity-families.mjs` 新增统一活动解析：`PrayAct` 配置 ID 与 ActFrame 实例 ID 都可接受，且只接受 `ActFrameAct.type=183` 的实例。状态仍按配置 `version=13` 持久化，回包保留客户端传入的实例 ID `183013`。
- `104901` 要求所选索引恰好覆盖该版本全部 `AwardIndex`，拒绝缺项、重复项、未知索引和属于其他索引的 `Award`。
- `104902` 每次抽取同时推进全部五个索引，每个索引独立执行 `normal_val`、`critical_ration`、`critical_val` 和 `progress_val` 规则；每次抽取生成一个 `draw_critical_list` 项，其中包含五个 `draw_info`，并用共同 `draw_cnt` 对齐客户端展示。
- `draw-activity-service.mjs` 新增 `synchronizeLogin()`；它从 `draw_activity_state` 重建模块 183 中已存在活动的 `pb_pray_act`，恢复选择、抽取次数、进度和累计获得历史，并只同步登录容器中实际存在的活动。
- `gateway.mjs` 在登录组装模块 183 前调用该同步，并把同步活动合并到最终模块 92/183 登录载荷。

## 客户端证据

- `PrayActSelectForm._OnClickNotarize` 收集全部 `awardIdMap`，少于五项时提示选择未完成。
- `PrayActDrawNode._PlayCritical` 遍历 `draw_critical_list -> draw_info`，按每个 `pray_index` 独立展示 `is_critical`、`progress_val` 和 `is_award`。
- `PrayActDrawForm._ShowCritical` 同样遍历所有 `draw_info`。
- `PrayAct[13]` 的 `consume_tid=816002`、`consume_cnt=1`；索引 `61..65` 的 `progress_val` 均为 100，`critical_val` 分别为 `[2,5]`、`[3,8]`、`[5,11]`、`[7,13]`、`[7,16]`，`critical_ration` 分别为 400、950、1300、1700、2500。
- 原始字节码证据位于 `analysis/scratchpad/time-temple-20261108/project/` 下的 `PrayActDrawNode.lua.bin`、`PrayActDrawForm.lua.bin`、`PrayActSelectForm.lua.bin` 和 `PrayActTable.data.lua.bin`。

## 验证

```powershell
node --check game/draw-activity-families.mjs
node --check game/draw-activity-service.mjs
node --check game/gateway.mjs
node --test test/draw-activity-service.test.mjs
node --test test/draw-activity-gateway.test.mjs
npm test
```

- 服务专项 `17/17`，真实网关专项 `1/1`。
- `random=0` 的 50 抽断言结果为五个索引 `draw_cnt=[50,50,50,50,50]`、`progress=[0,50,50,50,50]`、奖励历史 `[1,1,2,3,3]`；响应包含 50 个 `draw_critical_list` 项，每项五个 `draw_info`。
- 真实临时 TCP 登录载荷中，模块 183 的 `pray_act_info.act_tid` 为 `183013`，五个索引均恢复到 50 次，选择与奖励历史均来自 SQLite。
- 相邻累计充值、模块 92/183、artifact draw、PremiumAct 等回归 `59/59`。
- 当前分支全量 `npm test` 为 2797 项、pass 2795、fail 0、skipped 2；日志 `analysis/test-runs/draw-activity-login-state-20261109/worktree-full.log`。

## 边界

- `AwardRation.direct_group/target_cnt/direct_ration` 与 `is_direct` 的完整业务规则仍缺权威证据，当前保留 `is_direct=false`，不臆造直发奖池。
- 本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK，因此不等同 APK 可玩验收，也不需要更新 APK 快照。
