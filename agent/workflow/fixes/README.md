# 个人服务器修复记录

基线提交 `26982a4`；2026-10-30 活动修复 worktree 基线 `5aa0a21`。本目录逐项记录“用户反馈 → 证据 → 根因 → 实现边界 → 测试 → 验收级别”。
统一测试：`npm test --prefix personal-server`；合并前定向 68/68 通过，本轮全量 `npm run test:all` 实测 2898 项、
pass 2896、fail 0、skipped 2（两项均等待 `FC_RECHARGE_CLIENT_BUNDLE`），日志
`analysis/test-runs/up-star-gift-20261112/main-merge-all.log`。

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
| E1 | 进入游戏依次提示“仅显示物品不可操作”和“配置出错了” | [entry-display-config-error-20261111.md](entry-display-config-error-20261111.md) | `107703` 关闭活动改为空读取，`10507 type 12` 接入本服频道；目标回归 23/23，通过后待部署与客户端复验 |
| U1 | 独立“限时升星/升星礼包”空白 | [up-star-gift-20261111.md](up-star-gift-20261111.md) | 登录版本块补齐当前开放版本并修复选中版本；31053 仅选当前开放版本；31052 按英雄/魔灵/精灵真实星级、静态奖励与 award_bin 同事务结算；当前开放行均为充值礼包，充值仍走 RechargeMgr |
| U2 | 块 I 同类活动“有入口但只有拒绝” | [benefit-command-decode-20261111.md](benefit-command-decode-20261111.md) | 27 条仍由 benefit 处理的 protobuf 命令按 schema 解码；104801 拆到 ActShop；拒绝原因按最新 APK/Lua/表复核，Fashion 与红包的旧缺失文案已纠正 |
| U3 | 活动商店读取与同类资产缺口 | [act-shop-20261112.md](act-shop-20261112.md)、[activity-asset-audit-20261112.md](activity-asset-audit-20261112.md) | 104801 返回当前 ActFrame 商店并持久化 ETF/protobuf 玩家状态；104802/104803 保留具体拒绝；43 家族/83 命令逐项登记资产、入口和持久化缺口 |
| E2 | 登录后及活动轮询提示“配置出错” | [activity-server-vitality-20261111.md](activity-server-vitality-20261111.md) | `105702` 由无条件 code 5 改为模块 21 槽 29 维度 2 的真实全服聚合；日任务领取补齐统计链路，100701 全服任务复用同一口径；定向 77/77 通过，待部署与 APK 验收 |
| W2 | daily discount batch purchase limit | [daily-discount-batch-limit.md](daily-discount-batch-limit.md) | 46003 batch_update sync, restart backfill and real TCP verified; 192/192 tests |
| W3 | 首充购买后仍显示 ¥6 | [first-recharge-status.md](first-recharge-status.md) | 历史订单状态已修复；自动回填与 TCP 测试通过，首充面板待用户确认 |
| W4 | 限购礼包错误日志 ID | [purchase-limit-error.md](purchase-limit-error.md) | 限购先于余额校验；真实 QuickSDK 返回 307/80001，275/275 测试通过 |
| W5 | 03:00 后每日折扣购买报 310 | [wish-tree-rebate-cycle-20261108.md](wish-tree-rebate-cycle-20261108.md) | wallet-service 捕获 310 只跳过返利记录，购买成功；全量 2481 项 0 失败，未部署 |
| W6 | 限时招募礼包显示不可操作 | [limited-recruit-gift-week-hunt-20261110.md](limited-recruit-gift-week-hunt-20261110.md) | 40008/40010 的已关闭 Week Hunt 上下文只跳过任务记账；真实 16004 购买成功，全量 2808 项 0 失败，待部署 |
| P1 | 636/82601/640/503 后期养成与扫荡 | [endgame-progression.md](endgame-progression.md) | 四接口已实现并集成部署；228/228 测试通过；四项 APK 操作与视觉验收待完成 |
| L1 | 团长装备穿戴返回未开放 | [leader-equip-wear.md](leader-equip-wear.md) | 98401 已接模块 175 事务穿戴、替换与持久化；315/315 通过，未部署、未做 APK 验收 |
| F5 | 线性任务缺少星火阶段进度 | [f5-linear-task-destiny-progress.md](f5-linear-task-destiny-progress.md) | 5901/155 读取模块 107 的原始 `cur_stage`；六个任务、临时 TCP 与 307/307 测试通过；未部署、未做 APK 验收 |

验收级别定义见 `docs/07-private-server-feature-execution-plan.md`。活动修复逐项勾选见 `docs/08-activity-fix-checklist.md`。**本轮为限购修复，已重启本机服务部署；未由 agent 点击客户端界面，也未修改 ADB reverse/UID 隔离。**

## 2026-10-30 海岛垂钓岛屿解锁

- 用户进入海岛垂钓后点击岛屿，真实请求为 110305 `req_fishing_act_unlock_map`，旧服务固定返回 code 5。
- 新增活动版本到岛屿版本的校验、积分等级判定、首解锁奖励、SQLite 幂等存档和完整 `pb_fishing_act_data_res` 回包。
- 组件测试与临时 TCP 通过，APK/视觉验收待部署后由用户执行。
- 包括 1074011 地图 601 在内，已用两组版本映射验证；详见 [fishing-act.md](fishing-act.md)。
