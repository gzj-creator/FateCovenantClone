# 个人服务器六项修复记录（2026-10-26）

基线提交 `26982a4`。本目录逐项记录“用户反馈 → 证据 → 根因 → 实现边界 → 测试 → 验收级别”。
统一测试：`npm test --prefix personal-server`，当前结果为 **104/104 通过**（首轮 102 项 + 部署后反馈复修 2 项）。

| 编号 | 故障 | 本文档 | 本轮结论 |
|---|---|---|---|
| W1 | 余额充值联调 | [wallet-balance.md](wallet-balance.md) | 代码无需改动；组件/临时集成已覆盖，缺用户真实购买与视觉确认 |
| G1 | 旅途战斗服务器错误 | [mission-fight.md](mission-fight.md) | 开始/退出/结算服务已就绪；APK 实测确认客户端必须播放战报动作流，回放未实现前 201 明确拒绝，未验收 |
| G2 | 背包宝箱开启报错 | [item-box.md](item-box.md) | 新增配置化随机宝箱开启；选择/付费/重复箱明确拒绝 |
| G3 | 海岛垂钓活动报错 | [fishing-act.md](fishing-act.md) | 新增记录/图鉴读取；垂钓与各类奖励明确拒绝 |
| G4 | 超凡冒险者活动打不开 | [helpup-act.md](helpup-act.md) | 新增助力次数读取；任务/阶段/助力明确拒绝；入口活动数据仍缺证据 |
| G5 | 新超凡魔灵服务器错误 | [pet-spirit.md](pet-spirit.md) | 未确认失败命令，未实现业务；增加请求载荷诊断以定位 |
| H1 | 进入大厅显示服务器错误 | [hall-entry.md](hall-entry.md) | 大厅商店读取按请求 id 空组回包、活动阶段同步空变更回执 |

验收级别定义见 `docs/07-private-server-feature-execution-plan.md`。**本轮没有任何一项达到 APK 实测或用户视觉验收。**
本轮未停止/重启服务与客户端、未点击设备、未修改 ADB reverse/UID 隔离，未向运行库写入测试数据。
