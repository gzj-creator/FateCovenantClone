# PLAY-BAKINGACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成。2026-11-08 残余项把 111002、111003、111004、111006、111011、111012、111013 补成表驱动实现，并扩展 111001、111005 的棋盘/订单边界；权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 111001-111015

## 状态键

baking:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

等级奖励、制作蛋糕（体力消耗 + cake_weight_list/cake_lv_weight_list 权重）、使用道具、作弊道具、酵母点击、取数据、一键整理、批量模式均落库；体力按 recover_time/recover_num 恢复。新增棋盘交换、相邻同蛋糕同等级合成为高一级、批量合成按低等级优先并返回每步棋盘、放弃订单按 abandon_item 扣费、提交订单按 Order.cake_list 匹配并发放 add_score/award、限时订单按 order_weight_list 强制时效组刷新、事件格按 SpecialEvent.award1/award2 发放并移除格子。

## 证据缺口

棋盘坐标、订单权重、蛋糕等级上限和事件奖励均为表驱动推断，尚无原服棋盘/订单回包对照；111014 一键整理沿用既有的固定 7 列排序，未在本轮扩展。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。

## 2026-11-08 登录“橘屋参数出错”的定位与修复

### 现象与证据

- `analysis/tmp/homeland-logcat-20261108.txt` 在 2026-11-08 21:48:52 记录 `Activity 12014 Time Config Error`，紧接着是 `ActivityServerData.lua.txt:77: attempt to index field 'stateList' (a nil value)`，随后模块 92（活动大使）`LoginFinish` 中止。
- `12014` 是勇士冲榜活动，不是烘焙协议；烘焙活动 `1101001`、`1101002` 的配置和登录态均存在。`12014` 先失败后，客户端没有完成模块 92 后续活动的初始化，因此进入烘焙屋时才表现为“橘屋参数出错”。
- 全开模式此前直接循环抓包中的自定义窗口：`1793545200` 到 `1794214800`（北京时间 2026-11-01 23:00 到 11-09 17:00）。`12014` 的活动表定义却是北京时间 05:00 开启、持续 7 天 18 小时；客户端按配置日边界算出的状态末点是 `1794150000`（北京时间 11-08 23:00），而抓包自定义窗口仍开放到 11-09 17:00。报错登录发生在 `1794150019`，刚越过表配置状态末点 19 秒，客户端因此报告 `Time Config Error`，随后 `stateList` 为 nil，模块 92 中止。

### 修复

- `personal-server/game/activity-calendar.mjs` 新增 `alignedAllOpenWindow()`：有表配置时，以 `activityWindow()` 所得窗口的每日起始相位锚定当前重置日，并保留表配置的完整窗口时长。
- `filterLoginActivity()` 在全开模式下优先使用该表驱动窗口，再回退到抓包窗口或 365 天窗口。`12014` 因此从北京时间 05:00 起算，表定义时长与客户端 `state_end_day/state_end_time` 计算出的结束点兼容。
- 修复只调整模块 92 登录窗口，不修改烘焙 `111001-111015` 的状态、资源或业务规则。

### 验证

- rebase 到最新 `main` 后执行 `node --test --test-concurrency=1 test/activity-calendar.test.mjs test/gameplay-gateway.test.mjs`：18 项，18 通过、0 失败、0 跳过。
- 新增回归以真实时间 `1794150019` 断言：`12014` 的起始相位与活动表一致、当前时间位于窗口内、窗口时长不变、当前登录早于客户端计算出的状态末点，并且窗口末点与状态末点对齐；同时断言烘焙 `1101001/1101002` 和 `12014` 的并行登录组仍保留。
- rebase 后全量 `npm test`：2762 项，2760 通过、0 失败、2 跳过；日志保存在 `analysis/test-runs/gameplay-20261108/baking-act-orange-house-fixed-full.log`。

### 验收边界

- 本轮未启停实时服务、未读写运行数据库、未操作模拟器或 APK。部署并重启新服务后，仍需由真实客户端重新登录并进入烘焙屋，确认模块 92 不再报错且烘焙数据正常显示。

## 2026-11-09 “橘屋参数错误”继续定位

### 原因

- 重启并重新登录后，模块 92 的 `Activity 180015 Time Config Error` 与 `LoginFinish Error` 已消失，但客户端仍弹出“橘屋参数错误”。
- 下一条失败请求为 `53001 req_activity_state_change`。客户端一次发送 25 个活动 ID：`84009,63033,63034,63035,84010,84011,84013,100010,135007,84016,84017,100012,84018,100013,100016,100018,100020,100021,100025,63036,63001,63004,63014,63015,63029`。
- 这些 ID 都是 `ActivityTable` 中的合法活动实例，但对应活动族并未进入当前模块 92 的 `act_list`/`act_parallel_list`。旧实现只认模块 92 已下发 ID，因此返回 `role_support_command_rejected code=1, Unknown activity ids`；客户端将其显示成登录期根级参数错误，并中止后续活动初始化。

### 修复

- `act-frame-service.mjs` 对 `53001/53002` 区分“已配置但未下发”和真正未知的 ID：前者返回合法的空 `pb_act_state_change_back` / 阶段变化 ACK，不写 `role_activity_stages`；后者仍返回 code 1。
- 这样既避免请求级 `CONFIG_ERROR`，又不会把客户端任意伪造的 ID 当成有效活动或伪造阶段状态。

### 验证

- `personal-server/test/block-j-role-support.test.mjs` 新增本次真实 25 个 ID 的完整回归，断言均存在于 `ActivityTable`、均不在模块 92 可见列表、服务返回 0 条变化且 SQLite 不新增阶段行；`999999999` 继续拒绝。
- 角色支持专项 14/14 通过；角色网关、活动日历、玩法网关合并专项 19/19 通过。
- 全量 `npm test`：2784 项，2782 通过、0 失败、2 跳过；日志 `analysis/test-runs/gameplay-20261108/act-frame-configured-ack-full.log`。

### 部署验收

- 修复提交 `8f03c6b` 已以 merge `81d5dfb` 合入 `main`。实时服务从旧 PID `18888` 重启为 `23204`，五个端口均由 `23204` 在 `127.0.0.1` 监听，管理页 HTTP 200，stderr 为空；运行日志 `personal-server/runtime.local-only.data/server-20261109-134548.local-only.out.log`。
- 客户端在重启后自动重连并完成真实登录（role `100001`）。首次 `53001` 为 seq 12、142 字节，服务返回 36 字节并记录 `role_support_command_committed`；随后 17 字节 `53001` 也正常提交，均无 `errCode`。
- 同一登录链的 `102801` 为 seq 24、7 字节 ETF `[1]`，服务按参数返回 `channelId=1, opens=2`，无 `errCode`。
- 客户端当前画面见 `analysis/tmp/fc-activity-ack-20261109.png`：已正常进入礼包界面，无“橘屋参数错误”或参数错误弹窗。
