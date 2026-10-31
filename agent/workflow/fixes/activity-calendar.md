# 活动日历与开服排期修复

更新时间：2026-10-31（Asia/Singapore）

状态：**活动模式已改为配置文件控制，当前本地测试使用 `all-open`；组件、临时 TCP 和服务部署验证通过，APK 内用户视觉尚未验收。** 本次只改服务端，不涉及 APK，因此不需要更新 APK 快照。

## 用户问题与结论

- 钓鱼鱼饵无法获取不是异常。首轮钓鱼 `1074003` 只从开服第 1 天 05:00 开放到第 5 天的 05:00；当前的钓鱼入口和鱼饵发放都应关闭。
- 魔灵之契 `83028` 的定制时间窗在 2026-10-26 05:00（Asia/Singapore）结束，登录数据必须移除它，活动入口不应继续显示。
- 开服时间固定为 `2026-10-24 05:00:00 +08:00`，Unix 秒 `1792789200`。
- 当前阶段为了方便逐项测试，配置文件已切换为 `all-open`：原登录快照里的活动全部保留，过期时间、结束状态和暂停位不会隐藏入口。

## 配置文件

默认配置：`personal-server/config/activity-calendar.json`。可通过 `FC_ACTIVITY_CALENDAR_CONFIG` 指向另一份 JSON；`FC_SERVER_OPENED_AT` 仍可临时覆盖开服时间。

```json
{
  "mode": "all-open",
  "serverOpenedAt": "2026-10-24T05:00:00+08:00",
  "currentFishingActivityId": 1074011
}
```

- `mode: "schedule"`：正式排期模式，按开服日、世界时间、定制起止时间和暂停位过滤。
- `mode: "all-open"`：测试模式，保留 SQLite 登录快照中的所有活动，清空响应中的暂停位，把所有活动状态统一为 `cur_state_id=50`，并把定制起止时间归零。
- `currentFishingActivityId`：全开模式使用的钓鱼代际。当前为 `1074011`；不存在于登录列表时会补入，并作为免费鱼饵发放所选版本。
- 配置在服务启动时读取，修改后需重启本机服务才能生效。

## 配置证据

`ActFrameTable.Act` 中的钓鱼活动使用 `refer_day`、`refer_start_time`、`duration_day` 和 `end_time`：

| 活动 | 版本 | 开服相对日 | 开始 | 结束 |
|---|---:|---:|---|---|
| `1074003` | 3 / 岛屿 2 | 第 1 天 | 2026-10-24 05:00 | 2026-10-29 05:00 |
| `1074005` | 5 / 岛屿 3 | 第 11 天 | 2026-11-03 05:00 | 2026-11-08 05:00 |
| `1074007` | 7 / 岛屿 4 | 第 21 天 | 2026-11-13 05:00 | 2026-11-18 05:00 |
| `1074010` | 10 / 岛屿 7 | 第 22 天 | 2026-11-14 05:00 | 2026-11-18 05:00 |

第 22 天两代配置短暂重叠；免费鱼饵只按较大的 `1074010` 发放。世界服配置 `1074001/1074002/1074004/1074006/1074008/1074009/1074011` 按各自 `world_time` 判断，不套用本服开服日。

`83028` 不在 `ActFrameTable`，而由 module 92 的 `act_custom_list.start_time/end_time` 控制；旧登录快照保留该状态，因此旧服务会一直把入口发给客户端。

## 实现

- 新增 `personal-server/game/activity-calendar.mjs`，统一按 +08:00 的 05:00 日切计算开服天数和活动窗口。
- 新增 `personal-server/config/activity-calendar-config.mjs`，负责配置文件读取、模式校验和时间解析。
- 登录时过滤 `act_list`、`act_parallel_list`、`act_pause_list` 和 `act_custom_list`，补入当前有效的 `107400x` 本服钓鱼活动。
- `all-open` 模式不删除活动；只会规范登录响应的可展示状态，SQLite 原始 module 92 仍保持不改写。
- 服务端暂停位继续生效，重新登录不会把管理员暂停的活动重新开放。
- SQLite schema v7 把 `serverOpenedAt` 写入角色 metadata，迁移名为 `activity-calendar-server-open-v7`；合并魔灵商城后当前源码上限为 v8，迁移 `pet-activity-commerce-v8`。
- `FC_SERVER_OPENED_AT` 可覆盖默认开服时间，支持 Unix 秒、毫秒或 ISO 时间；默认值为 `1792789200`。
- 登录响应只使用过滤后的 module 92，不覆写 SQLite 中的原始活动快照，避免一次过期过滤永久毁坏后续活动数据。
- 福利活动和冲榜领取在执行时也会复查活动日历，不能只靠客户端隐藏入口。

## 鱼饵策略

`FishingActTable.Version.free_item_num=25` 是版本配置中可见的免费鱼饵数量。当前实现为每个钓鱼版本首次登录发放 25 个 `821202`，以 `reward_claims('fishing_free_bait', 'v<version>')` 幂等。配置没有证明应当每日重复发放，因此暂不按日补发；这是保守实现，后续若取得服务端或客户端每日刷新证据再调整。

## 钓鱼交互

- `110301`：校验活动、解锁岛、默认鱼竿和鱼饵，生成并持久化待收鱼；同一请求重试不重复扣饵。
- `110302`：收获时按配置确定性生成尺寸/积分，发奖并记录最高尺寸；放弃清空待收鱼且不发奖。
- `110305`：按版本解锁岛屿，等级和奖励走配置，重复请求幂等。
- `110311`：批量收获消费实际可用鱼饵，最多受配置上限约束，整批在同一事务内完成。

## 验证

- 配置、活动日历、钓鱼服务和真实网关全开定向测试：`14/14` 通过。
- 真实临时 TCP 网关：第 1 天登录出现 `1074003` 并发放 25 鱼饵；可解锁 `201`、甩杆、扣饵和收鱼。
- 同一临时网关推进到第 8 天：登录响应不含任何 `107400x`，也不含 `83028`。
- `all-open` 集成测试：即使推进到第 8 天，SQLite 中的所有活动 ID 都保留在登录响应里，包括 `83028`；暂停列表为空，活动状态统一为开启，钓鱼入口选择 `1074011`。
- `hero-progression.test.mjs`：`14/14` 通过；验证登录响应被过滤，但 SQLite 原始 module 92 哈希不变。
- 全量 `npm test --prefix personal-server`：`189/189` 通过。

## 部署与运行证据

- 部署前快照：`analysis/experiments/private-server-20261025/p3/quick-product-diagnostic-20261031-021907/game.before-restart.local-only.sqlite`，schema v6，`integrity_check=ok`，SHA256 `89ef392e4bea299dfafbb205e5419c0d8bf0c261d4b50071620c6c7063849292`。
- 部署后一致快照：`analysis/experiments/private-server-20261025/p3/activity-calendar-deploy-20261031/game.after-deploy.local-only.sqlite`，schema v7，`integrity_check=ok`，SHA256 `2e1761da2854745eabdee49f2fb893d14b6b4adb66074bd2a2bc65245ba720ca`。
- 运行实例：`PID 2364`，启动时间 `2026-10-30T18:19:08.894Z`；PID 以 `runtime.local-only.data/server.local-only.json` 为准。
- 五个端口 `18880/18881/18882/18883/19090` 均只监听 `127.0.0.1`。
- 运行库已升级到 schema v7，`integrity_check=ok`，metadata 含 `serverOpenedAt=1792789200`。
- 部署前后 module 92 的 SQLite payload SHA256 均为 `9288bf5158a373ec525db74c5a146e0c1c24309ed606ee36d96beec50f8d2bf2`，证明登录过滤未写回原始快照。
- `18:19:36Z` 的真实客户端登录日志记录 `activeFishingActivityIds=[]`、`fishingBenefitActivityId=null`，并从响应移除 `83028`。
- `all-open` 部署前快照：`analysis/experiments/private-server-20261025/p3/activity-all-open-20261031/game.before-all-open.local-only.sqlite`，schema v7，`integrity_check=ok`，SHA256 `9fbb25b8a644bc733f813090a837f73a54fdfdc83513f55effc23ae1462e2126`。
- 当前运行实例：`PID 7256`，启动时间 `2026-10-30T23:32:24.574Z`；状态文件记录 `activityMode=all-open`、`currentFishingActivityId=1074011`，五个端口均只监听 `127.0.0.1`。
- 对当前运行库的 module 92 做只读解码核对：原有 100 个活动全部保留，补入测试钓鱼活动 `1074011` 后为 101 个；`act_pause_list` 为空，全部活动状态为 `cur_state_id=50`，定制活动起止时间均为 0，未写回 SQLite。
- `all-open` 重启后尚无新的 `activity_login_calendar_applied` 事件；需要隔离客户端重新登录大厅后，才能记录真实登录响应并完成视觉验收。

## 验收边界

- 以开服时刻的 24 小时周期计数，日志在 2026-10-31 02:19 +08 为第 7 天，05:00 后进入第 8 天；两个时间点都已晚于首轮钓鱼结束时间。
- 本次实现覆盖配置可解析的通用时间窗、当前本服钓鱼代际以及 module 92 的定制到期活动；不等于所有活动玩法、榜单、奖励和商品均已实现。
- 正式 `schedule` 模式的过滤逻辑仍保留并有测试；恢复正式排期只需将 `mode` 改为 `schedule` 并重启。
- 真实客户端视觉仍需用户确认。全开模式只保证登录响应包含活动，具体榜单、商品、奖励和玩法仍按各自实现边界处理。
