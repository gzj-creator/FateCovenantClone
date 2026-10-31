# G3 海岛垂钓活动报错

更新时间：2026-10-31（Asia/Singapore）

状态：**活动排期、免费鱼饵、甩杆、收获、批量收获和岛屿解锁均已实现；组件、临时 TCP、运行迁移与真实登录响应通过。下一轮 APK 操作和用户视觉未验收。**

## 本次失败证据

- 2026-10-30 12:22:46 客户端打开 `FishingActEnterForm`，12:22:48 进入 `FishingActIslandMainForm`。
- 12:22:51 和 12:22:53 用户两次点击 `_ctnClick`，每次发送 `110305 req_fishing_act_unlock_map`，请求体 7 字节。
- 实时服务 `events.jsonl` 两次均记录 `activity_read_rejected`，业务错误码 5；客户端日志记录 `req_error_code=5`。
- 同一时间窗内 110308 `req_fishing_act_get_record` 已成功返回，说明活动页面和通用读取链路可打开，失败点是岛屿解锁。

## 根因

客户端点击岛屿发送：

```text
pb_fishing_act_common_req {
  int64 act_id = 1;
  int64 value = 2;  // map_id
}
```

旧网关把 110305 固定写在 `refused` 表，返回 `Fishing map unlock is not implemented`。`ModuleTable 92139` 是模块表条目，`89001` 是百媚之约；真正钓鱼活动是 `1074001-1074011`，不能按 92139 或 89001 拒绝 110305。

客户端 `FishingActMgr.ReqUnlockMap` 收到 `pb_fishing_act_data_res` 后会调用 `FishingActData:RefreshByRoleData(rsp.data)`，解析奖励并触发 `EVT_UNLOCK_MAP`。`CheckIslandUnlock` 使用钓鱼活动等级，而不是团长等级；等级来自 `FishingActUtil.GetLevelByScore(score)`。

## 配置映射

`ActFrameTable.Act[act_id].version` 映射到 `FishingActTable.Version.island_version`，再筛选 `FishingActTable.Island.belonging_version`：

| 活动版本 | 岛屿版本 | 地图 ID |
|---:|---:|---|
| 1 | 1 | 1-5 |
| 2, 3 | 2 | 201-205 |
| 4, 5 | 3 | 301-305 |
| 6, 7 | 4 | 401-405 |
| 8 | 5 | 501-505 |
| 9, 11 | 6 | 601-605 |
| 10 | 7 | 701-705 |

每版 5 张岛的解锁等级条件均为 `0, 2, 3, 5, 7`。等级阈值来自 `FishingActTable.Level`，首个门槛为 1000 分，0 分时为 0 级。

## 实现

`personal-server/game/activity-read-service.mjs`：

- `110301` 校验活动版本、已解锁岛、默认鱼竿和鱼饵，持久化待收鱼；同一请求重试不重复扣饵。
- `110302` 按配置生成鱼尺寸/积分并发放渔获，记录最高尺寸；放弃时只清空待收鱼。
- `110311` 按实际鱼饵和配置上限批量生成渔获，扣饵、发奖和状态写入同一事务。
- 解析真实 protobuf 请求，拒绝非法活动、非法地图和跨版本地图。
- 按活动 `version` 选择正确岛屿版本，按当前钓鱼积分计算活动等级。
- 首次解锁时校验 `unlock_level_condition`，通过 `grantResources` 发放 `unlock_reward`，并在同一事务中写入 `fishing_activity_state.unlock_map_list_json`。
- 重复解锁不重复发奖；奖励不支持的旧版本岛屿明确返回配置错误 5，且不写解锁状态。
- 返回完整 `pb_fishing_act_data_res{data,res}`；`book_state`、`level_state`、`progress_state` 返回单位 BitBlock，避免客户端把未收到状态当成缺失。
- `have_rod_list` 初始为空，由客户端 `_EnsureDefaultRod` 补当前版本默认鱼竿。

`personal-server/storage/game-store.mjs`：

- schema v6 新增 `fishing_activity_state`，按 `(role_id,act_id)` 保存积分、鱼竿、地图、鱼获/天气、领取位和待处理鱼等字段。
- schema v7 把开服时间写入角色 metadata，迁移名为 `activity-calendar-server-open-v7`；不会覆盖既有角色、英雄、编队、资源或活动领取位。

`personal-server/config/game-tables.mjs`：

- 从 `analysis/tmp/FishingActTable.data.lua.json` 读取 `Island`、`Version`、`Level`，从现有 `ActFrameTable` 读取活动版本。

## 验证

- `node --test personal-server/test/activity-read-service.test.mjs personal-server/test/activity-calendar.test.mjs`：10/10 通过。
- `node --test personal-server/test/gameplay-gateway.test.mjs`：通过，包含临时端口 + 临时 SQLite 的第 1 天登录、免费鱼饵、岛屿解锁、甩杆、收鱼和第 8 天过期过滤。
- `node --test personal-server/test/hero-progression.test.mjs`：14/14 通过，包含登录 module 92 过滤但 SQLite 原快照哈希不变。
- `npm test --prefix personal-server`：189/189 通过。

测试覆盖：第 1 天 `1074003/201`、第 11/21/22 天排期、免费鱼饵幂等、首次岛屿奖励只发一次、重开数据库后保持、甩杆重试、收获、批量收获、活动关闭、非法活动/地图、跨版本地图、低等级拒绝、不可表示奖励回滚，以及 110308/110303/116004 回归。

## 未实现边界

- 110304 图鉴奖励、110306 换杆、110307 等级奖励、110309 排名奖励、110310 进度奖励仍未实现。
- 免费鱼饵只按每个版本首次发放 25 个；当前配置证据不足以证明每日重复发放，未实现每日补发。
- 旧版本 2-4 的第 4/5 岛奖励含英雄 ID（4040301、1040201、3040201），当前通用资源发放器不能表示，会明确拒绝；不能把它记为已解锁。
- 服务端已部署，SQLite 已升级到 v7 且原始 module 92 未被登录过滤覆写。未操作客户端、原版 APK 或 ADB reverse。
- 当前服务由 `personal-server/config/activity-calendar.json` 的 `all-open` 测试模式强制开放活动，测试钓鱼版本为 `1074011`。用户可自行进入活动，确认入口、鱼饵、岛屿、甩杆、收鱼和重登持久化。
