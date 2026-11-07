# BATTLE-GENERALDUNGEON implementation

日期：2026-11-07

分支：`task/BATTLE-GENERALDUNGEON-20261106`

基线：`main@b765657`，收尾时 rebase 到最新 `main@7713406`（BATTLE-RANK 合并提交）
状态：服务端实现完成；事件规则证据部分阻塞，待 APK 验收

## 范围与配置依据

任务卡对应 `GeneralDungeonCmd` 的 7 个数字命令。实现只处理该任务卡范围，没有新增静态模块或猜测协议号。

- 客户端命令证据：`GeneralDungeonCmd.lua` 的 7 个 `Send/New/Seq` 调用及其 PB/ETF 编码器。
- 客户端业务证据：`GeneralDungeonBaseMgr.lua` 中 `ReqDungeonData`、`ReqInitLevelData`、`ReqCloseLevel`、`ReqExecuteEvent`、`ReqActivateEvents`、`ReqSyncMapInfo`、`UseProp` 的调用与回包合并路径。
- 请求/响应协议：`personal-server/assets/protobuf/general_dungeon.net.proto.bin`、`general_dungeon.db.proto.bin`。
- 生产表：客户端 `GeneralDungeonTable.data.lua`。新增 `tools/extract-general-dungeon-table.mjs` 解释 LuaJIT 表构造字节码，保留 `Level.scene/init_pos`、`Event.next_event`、`EventBox.res_list` 等嵌套数组，生成 `personal-server/assets/tables/GeneralDungeonTable.data.lua.json.gz`。
- 配置入口：`personal-server/config/general-dungeon-tables.mjs`。事件按 `floor(event_body / 1000)` 归属关卡，事件类型取 `event_body % 1000`；例如关卡 101 与事件体 101001/101002/101008 的对应关系来自表值，不硬编码奖励。

## 命令映射

| type | 客户端方法 | 请求 | 响应 | 实现结果 |
| ---: | --- | --- | --- | --- |
| 78101 | `req_dungeon_evt_execute` | PB `pb_dungeon_event_exe` | PB `pb_dungeon_event_res` | 校验当前关卡、激活状态、事件归属和防重；宝箱事件按 `EventBox.res_list` 发奖，道具事件按 `EventPropAdd.prop` 写入关卡道具位；其他事件类型返回 code 5。 |
| 78102 | `req_dungeon_data` | ETF 单值 dungeon id | PB `pb_general_dungeon` | 从 SQLite 权威状态重建当前关卡和地图；未进入时返回空地图结构。 |
| 78103 | `req_dungeon_enter_level` | PB `pb_enter_dungeon_level` | PB `pb_dungeon_level_change` | 校验 Level 配置，按场景名、初始位置和本关卡事件创建持久化地图。 |
| 78104 | `req_dungeon_close_level` | ETF 单值 level id | PB `pb_dungeon_level_change` | 校验已初始化关卡，删除该关卡状态并返回关闭后的 level change。 |
| 78105 | `req_dungeon_evt_activate` | PB `pb_dungeon_event_active` | PB `pb_dungeon_event_list` | 只允许当前关卡配置中的事件；同一事务更新位置、迷雾和激活集合。 |
| 78106 | `req_dungeon_sync_map` | PB `pb_dungeon_sync_map` | 无 | 校验场景并持久化 fog/pos；成功不发送第二帧，避免破坏客户端流顺序。 |
| 78107 | `req_dungeon_use_prop` | ETF 单值 prop id | PB `pb_res_to_client` | 只能消耗服务端关卡背包中的道具；不足返回 301，成功返回空资源增量并持久化扣除。 |

`GeneralDungeonBaseMgr.lua` 没有 `LoginParse` 读取路径，当前状态按客户端的 `ReqDungeonData` 在打开副本时懒加载，因此没有猜测新增登录模块或登录槽位。

## 权威状态与事务

`personal-server/game/general-dungeon-service.mjs` 新增两张幂等创建的表：

- `general_dungeon_state(role_id,dungeon_id,state_json,updated_at)`：保存当前关卡、每层场景、fog/pos、激活/执行结果、buff 与关卡道具。
- `general_dungeon_claims(role_id,dungeon_id,level_tid,claim_type,claim_key,created_at)`：保存事件与宝箱执行事实，重开数据库后仍能防重。

所有状态变更均位于 `store.transaction`。奖励通过共享 `grantResources` 更新真实钱包/库存；响应 protobuf 与 claim 写入也在事务内编码和提交。编码失败或 SQLite 约束失败会整体回滚资源、状态和防重记录。

## 网关接入

`personal-server/game/gateway.mjs` 在登录后的真实数字命令路径中注册 78101–78107：

- 78102/104/107 使用现有 `decodeEtf`。
- 78101 解 `pb_dungeon_event_exe`，78103 解 `pb_enter_dungeon_level`，78105 解 `pb_dungeon_event_active`，78106 解 `pb_dungeon_sync_map`。
- 业务异常走统一 `GameError.code`；78106 的 `noReply` 分支不写帧。

## 复现与证据

专项命令：

```powershell
node --test personal-server/test/general-dungeon-service.test.mjs personal-server/test/general-dungeon-gateway.test.mjs
```

结果：7 tests / 7 pass / 0 fail。日志：`analysis/test-runs/gameplay-20261106/BATTLE-GENERALDUNGEON-specialized.log`。

专项覆盖：

- 78102 初始空状态、78103 进入关卡、78105 激活、78106 同步、78104 关闭。
- SQLite 关闭并重开后，关卡、fog/pos 与激活事件保持一致。
- 78101 宝箱奖励只发一次；未激活、未知事件、重复执行和未知事件类型均失败。
- 78101 道具事件写入关卡背包，78107 消耗；重复消耗返回资源不足。
- claim 插入失败回滚资源和事件结果；响应编码失败回滚资源、状态和 claim。
- 临时 TCP 完成真实握手、909103 登录和 78101–78107 全部七个数字命令解码；78106 后下一次响应的 seq 校验证明没有额外空帧。

完整回归：

```powershell
cd personal-server
npm test
```

结果（rebase 到 `main@7713406` 后）：2178 tests / 2178 pass / 0 fail，耗时 195331 ms。

与主线的冲突审查：分支从 `b765657` 直接创建，收尾时主线前进到 `7713406` 并合入 BATTLE-RANK，本分支已 rebase 到该提交。`gateway.mjs` 的自动合并同时保留 BATTLE-RANK 与 GeneralDungeon 的 import、服务实例和派发块；没有改写 `store schema/migrator`、任务/活动状态、邮件、207 体力或主线第一轮的既有 `gateway` 分支。

## 证据阻塞与验收边界

- `EventFight` 已有 63 行战斗 ID/门槛配置，但尚未证明共用地牢战斗入口、继承状态、租借英雄和胜负回包的完整规则；78101 对 kind 1 明确返回 code 5，不固定胜利。
- `EventDraw`、`EventBuff`、`EventTalk`、`EventCure`、条件/记录、表现与跨层 next_event 的 `extra_data`/`hero`/战斗状态语义尚未恢复；这些类型不被当成成功。跨关卡 next_event 在目标关卡尚未初始化时保持休眠，未猜造跨层激活。
- 78103 的 `extraData` 是客户端 opaque bytes，当前源没有服务器解释规则，服务端保存地图状态但不伪造额外业务。
- 78107 的客户端 `UseProp` 会触发战斗恢复逻辑；服务端已闭合关卡道具扣除和交易，但战斗内回血/增伤效果仍依赖 78101 战斗事件接线。
- 配置没有证明周期性重置或活动版本字段；当前实现将地牢状态作为角色长期进度保存，关闭关卡显式删除该次关卡状态。
- 本任务未启停实时服务、未操作模拟器/ADB、未读写 `runtime.local-only.data`、未生成 APK。实际客户端入口、视觉和战斗内表现列为待 APK 验收。

## 变更文件

- `personal-server/game/general-dungeon-service.mjs`
- `personal-server/game/gateway.mjs`
- `personal-server/config/general-dungeon-tables.mjs`
- `personal-server/assets/tables/GeneralDungeonTable.data.lua.json.gz`
- `personal-server/test/general-dungeon-service.test.mjs`
- `personal-server/test/general-dungeon-gateway.test.mjs`
- `tools/extract-general-dungeon-table.mjs`
