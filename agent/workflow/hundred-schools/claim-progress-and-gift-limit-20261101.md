# 百派争鸣 100 抽任务与招募礼包限购修复（2026-11-01）

## 结论

- 100 抽任务原先错误读取活动子数据 `role_data.draw_count`，当前数据库中该值为 `30`。
- 客户端 `HeroDrawUILogic.GetPersonalDrawCount` 实际求和普通、品质和魔法三个卡池，对应常量为 `1/2/10`。
- 实时登录模块 `21` 的 `TID_COUNT_DRAW` 当前为 `25 + 71 + 9 = 105`，所以任务确实已完成并可领取。
- 服务端现在按客户端口径读取模块 21，不再使用活动内的单人 `draw_count`。
- `16005` 招募礼包达到限购后，网关把钱包内部 `307` 映射为客户端已有文案的 `16016`，不再显示错误日志 ID。

## 代码

- `personal-server/game/hero-draw-activity-service.mjs`
  - 新增 `personalDrawCount()`，读取 `CountStatisticsTable` 中非自定义、`type=0`、`tid=1` 的统计槽。
  - 只累计客户端个人抽数使用的 draw lib `1`、`2`、`10`；活动任务类型 `1` 改用该值。
- `personal-server/game/gateway.mjs`
  - welfare 路由的 `16005` 在重复限购时将 `GameError 307` 返回为 `16016`。
  - 同时保留本分支已有的 `155` 自选套装礼盒路由。
- `personal-server/test/hundred-schools.test.mjs`
  - 覆盖活动计数为 `30`、客户端三池统计为 `25+71+9` 时任务 1 成功领取并落 SQLite。
  - 真实临时 TCP 覆盖重复购买 `880101` 返回 `16016`。
- `personal-server/test/welfare-service.test.mjs`、`personal-server/test/pet-activity.test.mjs`
  - 更新真实网关重复限购断言为 `16016`；直接服务层仍保留内部 `307`。

## 客户端证据

- `HeroDrawUILogic.lua.json` prototype 4/5/6 分别读取品质、普通和魔法卡池。
- `HeroDrawActMgr.lua.json` prototype 15/16 使用上述个人总抽数。
- `HeroTable.lua`：`TID_NORMAL_DRAW_LIB=1`、`TID_QUALITY_DRAW_LIB=2`、`TID_MAGIC_DRAW_LIB=10`。

## 验证

- 定向测试：`node --test test/hundred-schools.test.mjs`，`8/8` 通过。
- 受影响网关与系统测试：69/69 通过。
- 全量测试：`npm test --prefix personal-server`，`541/541` 通过。
- `git diff --check` 与三个修改 `.mjs` 的 `node --check` 通过。

实时数据库一致性备份：

- `analysis/experiments/private-server-20261025/p3/hundred-schools-claim-20261101/game.pre-hundred-schools-deploy.local-only.sqlite`
- 大小：`372736` 字节
- SHA256：`cdb7f618e97a2e9e09cef7a3147208c1af78e8c6e02ca41d71d09f366d69990c`
- `PRAGMA integrity_check=ok`

在备份副本上使用与生产相同的服务和日历调用 `claimTask(1)`：

- 领取前任务：`[17]`
- 领取后任务：`[1, 17]`
- 奖励变化：资源 `101500` 增加 `100`
- 证据：`analysis/experiments/private-server-20261025/p3/hundred-schools-claim-20261101/claim-verification.local-only.json`

## 部署

- 旧 PID：`48168`
- 新 PID：`8808`
- 启动时间：`2026-11-01T01:52:16.166Z`
- `18880/18881/18882/18883/19090` 均只监听 `127.0.0.1`
- stdout：`analysis/experiments/private-server-20261025/p3/hundred-schools-claim-20261101/server.stdout.local-only.log`
- stderr：`analysis/experiments/private-server-20261025/p3/hundred-schools-claim-20261101/server.stderr.local-only.log`，为空
- 部署状态：`analysis/experiments/private-server-20261025/p3/hundred-schools-claim-20261101/deployment.local-only.json`

本次只修改服务端，APK 未变化，因此没有生成新 APK 快照。真实客户端仍需用户重新登录并点击任务 1，确认页面不再显示过期且领取成功；在视觉确认前只能记为服务端、真实 TCP 和实时数据副本通过。

## 未完成范围

这次没有把商城全部礼包、通行证和活动战令统一标为可用。当前已通过的测试覆盖本次涉及的百派争鸣任务、招募礼包和已有的标准/月度通行证链路；其余商品族仍需逐类核对客户端 handler、奖励和 `1900` 推送。
