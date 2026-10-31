# 个人服务器修复记录

基线提交 `26982a4`；2026-10-30 活动修复 worktree 基线 `5aa0a21`。本目录逐项记录“用户反馈 → 证据 → 根因 → 实现边界 → 测试 → 验收级别”。
统一测试：`npm test --prefix personal-server`，当前结果为 **199/199 通过**。

| 编号 | 故障 | 本文档 | 本轮结论 |
|---|---|---|---|
| W1 | 余额充值联调 | [wallet-balance.md](wallet-balance.md) | 代码无需改动；组件/临时集成已覆盖，缺用户真实购买与视觉确认 |
| G1 | 旅途战斗服务器错误 | [mission-fight.md](mission-fight.md) | 开始/退出/结算服务已就绪；APK 实测确认客户端必须播放战报动作流，回放未实现前 201 明确拒绝，未验收 |
| G2 | 背包宝箱开启报错 | [item-box.md](item-box.md) | 新增配置化随机宝箱开启；选择/付费/重复箱明确拒绝 |
| G3 | 海岛垂钓活动报错 | [fishing-act.md](fishing-act.md) | 110305 岛屿解锁已实现；垂钓与其余奖励仍明确拒绝 |
| G4 | 超凡冒险者活动打不开 | [helpup-act.md](helpup-act.md) | 新增助力次数读取；任务/阶段/助力明确拒绝；入口活动数据仍缺证据 |
| G5 | 新超凡魔灵服务器错误 | [pet-activity/implementation.md](../pet-activity/implementation.md) | 83028 活动、专属商城和现世礼包已接入同一开服活动日历；组件/TCP 通过，实时 APK 未验收 |
| H1 | 进入大厅显示服务器错误 | [hall-entry.md](hall-entry.md) | 大厅商店读取按请求 id 空组回包、活动阶段同步空变更回执 |
| W2 | daily discount batch purchase limit | [daily-discount-batch-limit.md](daily-discount-batch-limit.md) | 46003 batch_update sync, restart backfill and real TCP verified; 192/192 tests |

验收级别定义见 `docs/07-private-server-feature-execution-plan.md`。活动修复逐项勾选见 `docs/08-activity-fix-checklist.md`。**本轮没有停止/重启服务与客户端、未点击设备、未修改 ADB reverse/UID 隔离，未向运行库写入测试数据。**

## 2026-10-30 海岛垂钓岛屿解锁

- 用户进入海岛垂钓后点击岛屿，真实请求为 110305 `req_fishing_act_unlock_map`，旧服务固定返回 code 5。
- 新增活动版本到岛屿版本的校验、积分等级判定、首解锁奖励、SQLite 幂等存档和完整 `pb_fishing_act_data_res` 回包。
- 组件测试与临时 TCP 通过，APK/视觉验收待部署后由用户执行。
- 包括 1074011 地图 601 在内，已用两组版本映射验证；详见 [fishing-act.md](fishing-act.md)。
