# 冲榜奖励“已过期”与活动开服时间修复

更新时间：2026-11-01（Asia/Shanghai）

用户现象：倒计时仍在进行，招募冲榜的任务奖励领取却提示“已过期”；其他活动也曾出现同类提示。用户确认问题应按后台共用函数排查，不应通过修改 APK 绕过。

## 根因

- `analysis/reports/private-client-16448/lua-bundles/initialization-payload-contracts.md` 已确认登录 module 1 的第 5 项是 `ServerInfo.OpenTime`。
- 客户端 `ActivityTimeUtil.GetActStateTimeByTabCfg` 的 `SERVER_TIME` 分支读取 `ServerInfo.OpenTime`，所以该字段同时影响多个静态活动的时间判断。
- `personal-server/game/gateway.mjs` 登录时错误地把角色 `state.createdAt` 放入 module 1 第 5 项。当前库中角色创建时间为 `1792844604`，活动日历的开服时间为 `1792789200`，两者不同。
- `personal-server/server-list.mjs` 在未传 `releaseTime` 时又回退到 `now - 1`；`local-server.mjs` 没有传该字段，导致区服列表和网关登录使用了不同的时间基准。

## 修复

- 登录 module 1 第 5 项统一使用 `calendar.serverOpenedAt`。
- `local-server.mjs` 把同一个 `serverOpenedAt` 作为区服列表的 `releaseTime`，使 `show_time`、`release_time` 和列表级 `open_time` 与 `ServerInfo.OpenTime` 一致。
- `server-list.mjs` 不再接受隐式 `now - 1`：缺失开服时间会明确报错。独立启动时默认读取 `activity-calendar.json`，并支持既有的 `FC_ACTIVITY_CALENDAR_CONFIG` / `FC_SERVER_OPENED_AT` 覆盖。
- 本次只修改后端和测试，不修改、安装或制作 APK。

## 验证

- 真实登录 ETF 定向测试：解码 module 1，断言第 5 项等于 `1792789200`，且不等于角色创建时间；`gameplay-gateway.test.mjs` 全部通过。
- 区服列表定向测试：直接构造和 HTTP protobuf 反向解码均断言 `show_time` / `release_time` / `open_time` 来自显式开服时间；`server-list.test.mjs` 全部通过。
- 定向网关与区服列表测试：`12/12` 通过。
- 重放到当前 `main` 后的个人服务器完整测试：`npm test`，`402/402` 通过。

## 验收边界

- 当前运行中的服务尚未用此修复重启，客户端也尚未重新登录，因此真实界面的冲榜奖励视觉验收仍待完成。
- 重启服务并使用隔离客户端重新登录后，module 1 才会向客户端下发新的开服时间；仅刷新活动页面不会替换已加载的 `ServerInfo.OpenTime`。
- 本次组件测试证明协议字段和统一时间基准，不等同于客户端视觉验收。

## 招募冲榜任务进度补修（2026-11-01）

- 用户再次确认：倒计时正常且达到任务条件后，招募限时冲榜领取仍显示“已过期”。该路径继续复用活动开放时间修复，并补正任务进度来源。
- `TaskType.data` 是 `CountStatistics.tid`。服务端现在按非自定义、`type=0` 的真实统计表顺序计算模块 21 槽位，不再把该值当成模块数组下标。领取时按任务或排名配置的 `stat_expand` ID 汇总进度：`reset_type=1` 读取当天 `count_list[0]`，其他类型读取 `total`。
- 新增回归用例写入统计 TID 37、统计 ID 1、累计值 10，然后领取活动 `13016` 的任务 `55011`，断言奖励入账且 `activity_claims` 新增一条。钱包/冲榜定向测试 `18/18` 通过；招募相关定向测试 `45/45` 通过。
- 修复提交为 `49fbc64 fix: read sprint task progress from configured statistics`。真实客户端最终视觉验收仍需在包含该提交的服务上领取一次冲榜任务。
