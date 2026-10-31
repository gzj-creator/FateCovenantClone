# 个人服务器修复记录

基线提交 `26982a4`；2026-10-30 活动修复 worktree 基线 `5aa0a21`。本目录逐项记录“用户反馈 → 证据 → 根因 → 实现边界 → 测试 → 验收级别”。
统一测试：`npm test --prefix personal-server`，当前工作树结果为 **301/301 通过**。

| 编号 | 故障 | 本文档 | 本轮结论 |
|---|---|---|---|
| W1 | 余额充值联调 | [wallet-balance.md](wallet-balance.md) | 代码无需改动；组件/临时集成已覆盖，缺用户真实购买与视觉确认 |
| G1 | 旅途战斗服务器错误 | [mission-fight.md](mission-fight.md) | 开始/退出/结算服务已就绪；APK 实测确认客户端必须播放战报动作流，回放未实现前 201 明确拒绝，未验收 |
| G2 | 背包宝箱开启报错 | [item-box.md](item-box.md) | 新增配置化随机宝箱开启；选择/付费/重复箱明确拒绝 |
| G3 | 海岛垂钓活动报错 | [fishing-act.md](fishing-act.md) | 110305 岛屿解锁已实现；垂钓与其余奖励仍明确拒绝 |
| G4 | 超凡冒险者活动打不开 | [helpup-act.md](helpup-act.md) | 新增助力次数读取；任务/阶段/助力明确拒绝；入口活动数据仍缺证据 |
| G5 | 新超凡魔灵服务器错误 | [pet-activity/implementation.md](../pet-activity/implementation.md) | 83028 活动、专属商城和现世礼包已接入同一开服活动日历；组件/TCP 通过，实时 APK 未验收 |
| H1 | 进入大厅显示服务器错误 | [hall-entry.md](hall-entry.md) | 大厅商店读取按请求 id 空组回包、活动阶段同步空变更回执 |
| H2 | 点击头像显示服务器错误 | [avatar-rank-info.md](avatar-rank-info.md) | 2001 单条排名查询已实现；同分支另补 2002/2005/2006/2007/2009/2010，[详情](../activity-ranking/leaderboard-api.md)；267/267 测试通过，尚未部署与 APK 验收 |
| W2 | daily discount batch purchase limit | [daily-discount-batch-limit.md](daily-discount-batch-limit.md) | 46003 batch_update sync, restart backfill and real TCP verified; 192/192 tests |
| W3 | 首充购买后仍显示 ¥6 | [first-recharge-status.md](first-recharge-status.md) | 历史订单状态已修复；自动回填与 TCP 测试通过，首充面板待用户确认 |
| W4 | 限购礼包错误日志 ID | [purchase-limit-error.md](purchase-limit-error.md) | 限购先于余额校验；真实 QuickSDK 返回 307/80001，275/275 测试通过 |
| P1 | 636/82601/640/503 后期养成与扫荡 | [endgame-progression.md](endgame-progression.md) | 四接口已实现并集成部署；228/228 测试通过；四项 APK 操作与视觉验收待完成 |
| L1 | 团长装备穿戴返回未开放 | [leader-equip-wear.md](leader-equip-wear.md) | 98401 已接模块 175 事务穿戴、替换与持久化；301/301 通过，未部署、未做 APK 验收 |

验收级别定义见 `docs/07-private-server-feature-execution-plan.md`。活动修复逐项勾选见 `docs/08-activity-fix-checklist.md`。**本轮为限购修复，已重启本机服务部署；未由 agent 点击客户端界面，也未修改 ADB reverse/UID 隔离。**

## 2026-10-30 海岛垂钓岛屿解锁

- 用户进入海岛垂钓后点击岛屿，真实请求为 110305 `req_fishing_act_unlock_map`，旧服务固定返回 code 5。
- 新增活动版本到岛屿版本的校验、积分等级判定、首解锁奖励、SQLite 幂等存档和完整 `pb_fishing_act_data_res` 回包。
- 组件测试与临时 TCP 通过，APK/视觉验收待部署后由用户执行。
- 包括 1074011 地图 601 在内，已用两组版本映射验证；详见 [fishing-act.md](fishing-act.md)。
