# G3 海岛垂钓活动报错

更新时间：2026-10-30（Asia/Singapore）

状态：**岛屿解锁已实现，组件测试与临时 TCP 通过；尚未部署到实时服务，APK 和用户视觉未验收。**

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

- 解析真实 protobuf 请求，拒绝非法活动、非法地图和跨版本地图。
- 按活动 `version` 选择正确岛屿版本，按当前钓鱼积分计算活动等级。
- 首次解锁时校验 `unlock_level_condition`，通过 `grantResources` 发放 `unlock_reward`，并在同一事务中写入 `fishing_activity_state.unlock_map_list_json`。
- 重复解锁不重复发奖；奖励不支持的旧版本岛屿明确返回配置错误 5，且不写解锁状态。
- 返回完整 `pb_fishing_act_data_res{data,res}`；`book_state`、`level_state`、`progress_state` 返回单位 BitBlock，避免客户端把未收到状态当成缺失。
- `have_rod_list` 初始为空，由客户端 `_EnsureDefaultRod` 补当前版本默认鱼竿。

`personal-server/storage/game-store.mjs`：

- schema 从 v5 升至 v6，新增 `fishing_activity_state`，按 `(role_id,act_id)` 保存积分、鱼竿、地图、鱼获/天气、领取位和待处理鱼等字段。
- 迁移名 `fishing-activity-state-v6`；v5 运行库升级不会覆盖既有角色、英雄、编队、资源或活动领取位。

`personal-server/config/game-tables.mjs`：

- 从 `analysis/tmp/FishingActTable.data.lua.json` 读取 `Island`、`Version`、`Level`，从现有 `ActFrameTable` 读取活动版本。

## 验证

- `node --test personal-server/test/activity-read-service.test.mjs`：4/4 通过。
- `node --test personal-server/test/gameplay-gateway.test.mjs`：1/1 通过，包含临时端口 + 临时 SQLite 的 110305 首次解锁和重复幂等回包。
- `npm test --prefix personal-server`：全量组件测试通过；见 `docs/08-activity-fix-checklist.md` 和本轮提交记录。

测试覆盖：活动 1074001 地图 1、活动 1074011 地图 601、首次奖励只发一次、重开数据库后保持、非法活动/地图、跨版本地图、低等级拒绝、不可表示奖励回滚，以及 110308/110303/116004 回归。

## 未实现边界

- 110301/110302/110311（甩杆、收获、批量收获）仍未实现。
- 110304 图鉴奖励、110306 换杆、110307 等级奖励、110309 排名奖励、110310 进度奖励仍未实现。
- 活动日历是否把 `1074001-1074011` 写入 module 92 未在本修复中改变；本次只处理用户已实际触发的 110305。
- 旧版本 2-4 的第 4/5 岛奖励含英雄 ID（4040301、1040201、3040201），当前通用资源发放器不能表示，会明确拒绝；不能把它记为已解锁。
- 尚未重启服务、未点击客户端、未改动运行 SQLite/ADB reverse。部署后需用户重新进入海岛垂钓，确认首岛可进入并检查奖励与重启持久化。
