# LT1 主线任务 3-4 重登后仍可领取

日期：2026-11-18（Asia/Shanghai）；独立 worktree 基线：`eb1e8ce`。

## 现象与证据

- 用户已领主线「通关 3-4」，重登后仍有领取红点；再点时没有奖励。`TaskTable.LinearTask[10001]` 对应关卡 `30204`、任务组 `1`，首次奖励为 `101500×50`。
- `analysis/experiments/launch-20261115/server-data-fixed/events.jsonl`：`2026-11-16T15:45:46.095Z` 的 `9010/seq25` 首领成功（`changes=1`）；`2026-11-18T13:54:05.284Z` 的 `9010/seq753` 确认 `receiveTid=10001`、`changes=0`；`2026-11-18T13:54:38.855Z` 有 `909103/seq1` 重登。日志未保留该次登录正文字节。
- 同目录 `game.local-only.sqlite` 只读核对：对应角色有唯一 `linear_task/10001` 领取记录，模块 90 的 SQLite 下标 0–3 为空，下标 4 的 `0a05080110914e` 解出 `task_list=[{type:1,receive_tid:10001}]`。
- `analysis/tmp/client-script-work/CommonTaskMgr.lua.bin`（SHA256 `eaa44152f1f00645a9461674b57ee090aabbdc46fb572f43ab00839ebe644599`）proto 1：PC 9 取 Lua 下标 1，PC 12–16 移除该项，PC 23–28 把剩余列表按 `pb_common_task` 解码，PC 82–86 把第一项交给 `MainLinearTaskMgr.LoginParse`。`MainLinearTaskMgr.lua.bin`（SHA256 `90425c8e763f54558e5cec86e1316c9c2ae582ca85d39636fbf0cbcb5c4174d5`）proto 0/6/9/10/12 证实按 `type` 保存 `receive_tid`、跳过已领任务，并仅对当前 `STATE_RECEIVE` 亮红点。

## 复发复盘与根因

[前次 4-3 修复](../main-task-4-3-claim-20261110/implementation.md)修对了防重和 SQLite 高水位，却把内部顺序当作客户端顺序。最初的五个空槽抓包无法区分位置；旧测试又按同一假设读取登录下标 4，没有模拟客户端先取首项的行为。`gateway.mjs` 原样发送 SQLite 的 `[1201,1602,1202,9001,线性]`，客户端读到的线性任务为空，重登后重新把已达标的 `10001` 当成可领；点击回包里的 `receive_tid` 本身正确。

修业务代码前先补真实 `909103 → 9010 → 重开 SQLite → 909103 → 再次 9010` 回归，断言按客户端取首项读出领取状态，不再以存储下标断言登录回包。

## 修复范围

- 保留 SQLite 槽位和 `reward_claims`；`ensureLoginState` 仍先从领取记录修复快照。网关只对出站模块 90 投影为 ETF 正常列表 `[线性,1201,1602,1202,9001]`，空槽保留，不能改成 ETF 元组。
- 修复覆盖共享模块 90 的全部线性任务和四组普通任务的登录同步；不改 `9005`/`9010` 进度、领取事务、回包或奖励逻辑，不需要迁库。已领的 `10001` 不再触发可领状态，下一项真实可领取时客户端仍可亮红点。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 组件及相关网关 | `task-service.test.mjs`、`item-commontask-service.test.mjs`、`gameplay-gateway.test.mjs` | 35/35 通过 |
| 临时 TCP | 3-4 首次领取 +50、重开库后 `909103` 首槽收到 `receive_tid=10001`，再领零变化、余额与单条领取记录不变；星火任务首槽与四组不同位图的偏移正确 | 修前首槽确认为 `[]`，修后 2/2 通过 |
| 默认回归 | `npm test --prefix personal-server`（fast） | 541 项：539 通过、0 失败、2 跳过 |
| 部署 | 实时服务与运行数据库 | 未部署、未写运行库 |
| APK 真机 | 已领 3-4 后重登，确认旧任务不再亮可领红点 | 未验收 |

日志：本 worktree 的 `analysis/test-runs/main-linear-task-relogin-20261118/` 下 `before.log`、`focused-after.log`、`targeted-after.log` 和 `fast-after.log`。

## 防复发与边界

- 存储布局与网络布局分别断言，登录校验按客户端读取首槽，覆盖 ETF 容器类型、空槽及四组非空位图。不能根据全空抓包推断语义位置，也不能用 SQLite 的槽位校验登录回包。
- 未操作 APK 或设备；需部署后由用户重新登录确认界面。这里只确认服务端登录数据，不将临时客户端解码当作 APK 视觉验收。
