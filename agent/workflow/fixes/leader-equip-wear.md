# 团长装备穿戴接口

## 问题与证据

- 用户操作团长装备时，网关对 `98401 req_leader_equip` 固定返回业务码 `305`，原注释把穿戴明确列为未实现。装备抽取、背包和登录模块 175 已存在，因此问题只在该接口，不在奖励或资源链路。
- 客户端 `LeaderEquipCmd.lua` 的 `req_leader_equip` 固定编码 `pb_leader_equip_wear_req`；请求字段为 `wear_list`，每项是 `pb_leader_equip_wear { uid, type }`。
- 客户端 `LeaderEquipWearMgr.lua` 从所选装备对象构造 `uid/type` 列表。回包处理依次把 `sub_equip_list` 从背包移出、把 `add_equip_list` 放回背包，并对 `slots` 调用 `LeaderEquipSlotData.SetSlot`。
- 登录状态 `pb_leader_equips_data` 的 `equip_list` 是背包，`slots` 是已穿戴槽位。`pb_leader_equip_slot` 保存槽位类型、装备对象和槽位等级；空槽由客户端按 `LeaderEquipTable.TypeList` 初始化，默认等级 1。
- `LeaderEquipTable.LeaderEquip` 的配置 `type` 决定装备可穿槽位，当前六种槽位类型均有 24 件装备配置。

## 实现

- 工作树：`F:\projects\FateCovenantClone\.worktree\leader-equip-wear-20261031`
- 分支：`feature/leader-equip-wear-20261031`
- 基线：`main@0fb31e5`
- 新增 `personal-server/game/leader-equip-service.mjs`，实现 `98401` 的 protobuf 解码、事务校验和模块 175 持久化。
- 成功穿戴时，装备从 `equip_list` 移入目标 `slots`，回包 `sub_equip_list` 返回该装备；替换已有装备时，旧装备回到背包并进入 `add_equip_list`，槽位等级保留。
- 校验覆盖空列表、非法 UID、重复 UID、重复目标槽位、未知装备、装备类型与槽位不符、装备已在其他槽位等情况；所有改动在同一 SQLite 事务内完成。
- 相同请求重复提交按幂等成功处理，装备已在目标槽位时不再改背包，避免响应丢失后的重试报错。
- `personal-server/game/gateway.mjs` 已把 `98401` 从固定返回 `305` 改接该服务，使用 `pb_leader_equip_wear_req/back` 编解码并记录 `leader_equip_wear_committed` 或带业务码的拒绝日志。

## 验证

- 专项测试：`node --test test/leader-equip-service.test.mjs test/gameplay-gateway.test.mjs`，`8/8` 通过。
- 全量测试：`npm test`，合并最新 `main` 后 `315/315` 通过。
- 真实 TCP 用例验证 `98401` 不再返回 `305`，回包可解出槽位、移出装备，模块 175 同步保存，重新打开数据库后状态保留。
- 用当前运行库的一致性副本实测：背包 `10 -> 9`，`uid=1/tid=2005018/type=5` 进入槽位 5；重开数据库状态一致，其他登录模块哈希不变，`max_uid` 不变。副本与结果在 `analysis/experiments/private-server-20261025/p3/leader-equip-wear-20261031/`。
- 语法检查与 `git diff --check` 通过。

## 验收边界

实现已完成组件、临时 TCP 和当前存档副本验证，尚未部署到正在运行的服务，也未操作 APK 或模拟器，因此不能记为真实客户端点击验收。该改动只涉及服务端，不修改 APK，不需要更新 APK 快照。

复现命令：

```powershell
cd F:\projects\FateCovenantClone\.worktree\leader-equip-wear-20261031\personal-server
npm test
```
