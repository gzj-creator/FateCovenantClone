# ITEM-TASKAWARD 实施证据（69101 / 69102）

本记录只覆盖 `ITEM-TASKAWARD`，不继承 GrowthRoad、GrowthTarget 或其他任务活动的版本、分数和领取位。

## 原证据已闭合

- 原表 `TaskAwardTable.data.lua.bin` SHA256 为 `fb8e1788151b97eae71afda545ec266009f1c95795a6c6f0f64b7ea64896a21f`；`ActiveTaskAwardVersion=1`、`ActiveTaskAwardTask=263`、`ActiveTaskAwardProgress=6`、`ActiveTaskAwardTag=4`，任务 `growth_value` 总和为 `7425`。
- `ActivityTable[19001]` 的真实实例为 `func=19`、`version=1`、`server_day=33`、`duration_day=9998`。263 个任务使用 TaskType `13802`–`13816`（没有 `13813`），均映射 module 21 `CountStatistics` 的 `stat_expand` 维度。
- 客户端 `ActiveTaskAwardMgr` / `TaskAwardCmd` 证明 69101/69102 请求是单值 ETF，回包是 `pb_task_award_back{info,res}`；任务位图索引为 `taskTid % 1000`，进度位图索引为 `progressTid % 1000`，`rev_overdue` 独立。
- 登录使用 module 92 中活动 19001 的普通 `act_list` entry；其 `module_login_data` 是 ETF 包装的 `pb_task_award_master{data_list}`。
- 六档进度阈值为 600/1200/1800/2400/3000/3600。101/102/104/106 各发 132417×1，103/105 各发 101500×2500；132417 进入 module 534 宝物列表。六行逾期奖字段均为 0，因此没有可证明的逾期补奖规则。
- 客户端证据：`analysis/scratchpad/command-closure-46-20261115/item-b/TaskAwardCmd.prototypes.json`、`ActiveTaskAwardMgr.prototypes.json`、`TaskAwardTable.data.rows.json`。

## R1 推定

- 原客户端证明任务奖会累计到活动进度值，但未取得服务端把 `growth_value` 写入 `progress_value` 的提交函数。本实现按逐任务计入推定：只有真实统计达标且 69102 成功领取后，才在同一 SQLite 事务累计该值。
- 未取得服务端重复领取原错误码；项目既有 `AWARD_HAS_GET` 语义使用 310。缺生产者、未达标、窗口拒绝统一使用 err5，并在消息中带 `decisionId=R1-ITEM-TASKAWARD`。

## 服务端完成

- `personal-server/assets/tables/TaskAwardTable.data.rows.json` 保留四个原表族；`personal-server/config/task-award-tables.mjs` 校验源 SHA、行数、tid、位图索引和奖励。
- `personal-server/game/task-award-service.mjs` 按 `role/version/kind/tid` 保存领取位，保存 `progress_value` 与 `rev_overdue`；统计复核、领取位、资源发放和响应编码处于同一事务。
- 69102 只接受一个真实 TaskAward tid，69101 只接受一个进度 tid；ETF 解码拒绝空包、多值和非法 id。
- 登录同步可补建原窗口内缺失的 19001 entry，保留已有 `history_time.enter_time`，并写入 ETF 包装的 `pb_task_award_master`。窗口结束后仍投影已落库历史，但新变更支付前 err5。
- 网关已通过 `itemCommandServices` 接入 69006/69007/69101/69102 所在的通用受限分支；69101/69102 已从 `r1-fail-closed-command-service.mjs` 移出。

## 验证结果

```powershell
node --test --test-concurrency=1 personal-server/test/task-award-service.test.mjs
node --test --test-concurrency=1 personal-server/test/growth-target-task-award-gateway.test.mjs
```

- 服务专项：12/12 通过。覆盖原表/活动、任务领取、统计生产者、69101 阈值、重复、未知/多值/空 ETF、活动结束、module 92 登录、回复编码回滚和 SQLite trigger 回滚。
- 离线真实临时 TCP：TaskAward 用例通过，进程正常退出。覆盖初始/重开登录模块、69102 未完成 err5、成功回包、重复 310、69101 进度不足 err5、合法进度奖成功与重复 310。
- SQLite 重开：通过；任务位与进度位均从真实库恢复并在 module 92 重新投影。
- APK：未验收。生产 TCP、生产库、部署：未执行。

## 剩余缺口

- 原服务端错误码未取得，重复领取使用既有 310 属工程兼容。
- 逾期奖原表为 0，当前不开放逾期补奖。已合法落库的历史显示继续保留。
- 真实 APK 的界面流程、请求外形和在线推送未由本 agent 验收。

