# G4 超凡冒险者活动打不开

状态：2026-11-08 已在服务端定位并修复；组件与临时 TCP 回归通过，真实客户端验收尚未执行。

## 结论

- `ModuleTable` 92144 对应 `活动_助力升超凡`，实际活动为 `ActFrameTable.Act 1096001`（type 1096）。
- all-open 登录已经通过 module 92 下发活动条目和 `pb_help_up_act_login_data`，但 module 183 的参考快照没有 `1096001` 的 `pb_act_server_data` / `pb_act_role_login` 阶段行。
- 客户端 `Activity._Ctor(extra)` 从 `extra[1]`、`extra[2]` 读取 server/player 阶段；`Activity:IsValid()` 依赖这两份数据。缺行时 `HelpUpActMgr:OpenMainForm()` 在 `ActMgr:IsValid()` 处返回 `ACTIVITY_NOT_OPEN`，不会发送 116001–116004。这解释了活动条目可见但点击后无网络请求。

## 修复

- `personal-server/game/activity-calendar.mjs`：`normalizeActFrameLogin()` 在 all-open 模式下可接收当前 module 92 活动 ID；对 module 183 中缺少的 server/player 行补齐 type、当前可用的起止时间、stage 50、非暂停状态和 history。
- `personal-server/game/gateway.mjs`：活动登录同步完成后把 module 92 的活动 ID 传给 module 183 归一化。
- 修复只补缺失行，重复登录保持幂等，既有 module 183 活动数据继续保留。

## 验证

- 定向测试：`activity-calendar`、`help-up-act`、`relic-divine-gateway`、`gameplay-gateway` 共 28 项，pass 28 / fail 0。
- 真实临时 TCP：登录同时断言 module 92 的 `1096001` 数据块、module 183 的 player/server 阶段行，以及 116001–116004 路由。
- 完整 `personal-server` 测试：2751 项，pass 2749 / fail 0 / skipped 2；跳过项是缺少已验收客户端 bundle 的既有条件测试。

## 状态边界

- 本次未重启实时服务、未读取或修改运行数据库、未操作模拟器/ADB/APK。
- 部署后需要客户端重新登录，让新的 module 183 登录数据生效；真实入口点击和界面打开仍需客户端验收。
