# ITEM-RANKACHIEVE 交付记录

日期：2026-11-07

- Worktree：`.worktree/gameplay-20261106/item-rankachieve`
- 分支：`task/ITEM-RANKACHIEVE-20261106`
- 基线：最新 `main f61b465`；实现提交 `21d40c8`
- 状态：服务端完成（部分成就事件源证据阻塞）
- 边界：未启停实时服务、未操作 ADB/模拟器、未读写 `runtime.local-only.data`、未修改 `apk/`

## 协议和配置依据

- `inventory.json` 将 `tcp:c2s:43101:req_rank_achieve_award` 归到本任务；请求为 protobuf `pb_rank_achieve_award_req{tid_list}`，响应为 `pb_rank_achieve_award_rsp{res_change,new_achieve}`。
- `rank_achieve.net.proto.bin` 同时定义推送 8601 `pb_rank_achieve_rev{tid,finish_id}`。
- `rank_achieve.db.proto.bin` 定义领取位 `pb_rank_achieve_type{type,got_award}`、角色领取状态和 `pb_rank_achieve_finish{tid,unit_id,time}`。
- `ModuleTable.data.lua.json` 明确 `AchieveMgr` 对应登录模块 **170**。登录抓包中模块 170 的槽位 1 可解码为 `pb_rank_achieve_server.finish_info`，说明登录完成信息来自该模块；实现按捕获的四槽结构写入角色领取位、服务器完成信息和两端空跨服信息。
- `RankAchieveTable.data.json.gz` 由本次提交 `252f5a8` 和 `tools/extract-rank-achieve-table.mjs` 从客户端 `RankAchieveTable.data.lua` 提取，SHA256 为 `e5e3e0ee84e7dd8f72ab680f8c7cebe1ccb82bd0824a19a89d97dc526307cc94`。
- 表读取器严格校验 `RankAchieve=84`、`EventType=59`、`EventTimeSeparate=6`、`Type=4`；奖励对必须为正整数，成就 `tid % 1000` 作为 BitBlock 位索引。

## 已实现业务

- 新增 `personal-server/config/rank-achieve-tables.mjs`，只从打包资产读取配置，不从客户端推导奖励或资格。
- 新增 `personal-server/game/rank-achieve-service.mjs`：
  - 非空、无重复、最多 200 个 tid；未知 tid 返回 code 1。
  - 未完成返回 code 5，已领取返回 code 310；同批次任一失败整体回滚。
  - 完成记录持久化后不会因后续数值下降而撤销。角色事件的 `unit_id` 使用权威角色 ID。
  - 领取奖励使用表中的 `award`，经现有 `grantResources` 进入统一资源/钱包状态。
  - `new_achieve` 从 SQLite 领取记录重建完整领取位，分组为 `floor(tid/1000)`，位为 `tid % 1000`，保持客户端 MSB-first 顺序。
  - `rank_achieve_finish` 与 `rank_achieve_claims` 使用复合主键防重；完成、领取、资源变更和响应编码在同一 `store.transaction` 中。
  - 首次由本次请求完成成就时产生 8601 推送；登录时已完成的记录由模块 170 携带，不重复推送。
- 网关精确接入 43101 protobuf 请求、响应发送和 8601 推送，并把 service 加入可测试返回对象。登录同步在构造登录包前执行，模块 170 不再回放离线 fixture 中旧账号的完成记录。

当前可证的生产完成来源：

- `event_type=6` 巅峰塔层数，读取 `peak_tower_state.max_layer`：tid `1003`（500 层）和 `1004`（1000 层）。
- `event_type=17/53` 指定英雄拥有，使用 `event_param_convert` 中的英雄昵称 ID，经打包 `HeroTable` 解析为权威 hero tid，再核对 `heroInfo.hero_list`：tid `2001`、`1002001`、`2026–2028`、`2030–2035`。

其余 71 行成就当前明确返回 code 5。它们缺少相应排行榜、赛季、跨服、公会、抽取、圣器、宠物、精灵等权威完成值来源，不能用客户端计数、固定值或空成功代替。tid `2022` 属于指定英雄类，但其 `event_param_convert=0`，没有可解析英雄 ID，因此也在证据阻塞范围。

`RankAchieve.finish_award` 已在客户端 Manager 原型中表现为完成展示奖励信息，但没有取得与 43101 领取路径同时发放的直接证据；因此本实现只发 `award`，不擅自同时发 `finish_award`。

## 验证

专项命令：

```powershell
cd personal-server
node --test --test-concurrency=1 test/item-rankachieve-service.test.mjs
```

结果：7/7 通过。覆盖：

- 43101 成功领取、配置奖励和领取位；未完成、非法/未知/重复 tid 原子拒绝。
- 多 tid 跨类型领取、BitBlock 分组和顺序，三个 8601 完成推送。
- SQLite 关闭重开后的完成与防重。
- 响应编码失败和 SQLite claim 插入失败时，完成、领取、资源整体回滚。
- 真实握手/909103 登录、43101 数字 type、响应 protobuf 解码、8601 推送解码。
- 模块 170 登录槽位及领取后重登数据：角色领取位和 `pb_rank_achieve_server.finish_info` 同源。

全量命令：

```powershell
cd personal-server
npm test
```

结果：`tests 2185 / pass 2185 / fail 0`，耗时约 198.8 秒。

## 验收层级和剩余项

- 业务、事务、SQLite 重开、异常回滚、登录模块、临时 TCP 响应和推送：本环境通过。
- APK/UI：未验收。后续需在隔离客户端实际打开排行榜成就、领取一个已达到成就并重登，确认按钮状态、完成红点、资源显示和 8601 处理。
- 71 个事件源未闭合：需要各所属系统的真实服务端值及比较语义；当前 code 5 是明确业务拒绝。
- 公会单位（`EventType.unit=1`）和跨服完成信息尚未产生，登录中的公会备份及跨服槽位保持空结构。
- `finish_award` 是否同时发放、`EventTimeSeparate` 的周期切换语义仍待原服或活动版本证据。
