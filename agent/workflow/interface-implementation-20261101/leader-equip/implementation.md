# type 98401 req_leader_equip - 队长装备穿戴 实现文档

## 证据

### 配置表
- `analysis/recruitment-debug/bytecode/LeaderEquipTable.data.lua.json` -> `readLeaderEquipTables()` 提供 `LeaderEquip` (144 条, 6 种槽位类型各 24 件) 和 `Grade` (6 级) 配置。
- 配置字段: `tid`, `type` (槽位类型 1-6), `grade`, `score`, `attr`, `secondary_attr`, `icon`.

### Proto schema
- `analysis/.../leader_equip.net.proto.bin`: `pb_leader_equip_wear_req { repeated pb_leader_equip_wear wear_list }`, `pb_leader_equip_wear { int64 uid; int32 type }`, `pb_leader_equip_wear_back { repeated pb_leader_equip_slot slots; repeated pb_leader_equip add_equip_list; repeated pb_leader_equip sub_equip_list }`.
- DB proto: `pb_leader_equips_data` (slots, equip_list, max_uid, draw_info, dismiss).

### 登录模块
- Module 175 = `pb_leader_equips_data` (队长装备数据).

### 客户端
- `LeaderEquipCmd.lua` `req_leader_equip` 编码 `pb_leader_equip_wear_req`; `LeaderEquipWearMgr.lua` 处理 `sub_equip_list`/`add_equip_list`/`slots`.

## 实现

- 文件: `personal-server/game/leader-equip-service.mjs`.
- `supports(type)` = `type === 98401`.
- `execute(type, input)`:
  - 校验 wear_list 非空。
  - 在 `store.transaction` 内:
    - 读取 module 175 状态。
    - 建立 bag (equip_list) 和 slots 索引。
    - 归一化请求, 校验 UID/槽位/重复/类型匹配/已穿戴幂等。
    - 穿戴: 装备从 bag 移入槽位; 替换时旧装备回 bag。
    - 幂等: 已在目标槽位的装备不修改 bag。
    - 写回 module 175 (仅非幂等时)。
  - 返回 `pb_leader_equip_wear_back`.

### 网关路由
- `gateway.mjs` 已将 98401 接入 `leaderEquip.execute`, 使用 `pb_leader_equip_wear_req/back`, 记录 `leader_equip_wear_committed` / `leader_equip_wear_rejected`.

## 测试结果

- `node --test test/leader-equip-service.test.mjs test/gameplay-gateway.test.mjs`: 9/9 通过。
  - 单件穿戴、重启持久化
  - 替换保留槽位等级、旧装备回 bag
  - 批量穿戴、原子性、拒绝重复/非法/类型不匹配
  - 幂等重复提交
  - 编码失败回滚
  - 网关 TCP 路径穿戴与持久化

## 验收分级

- 组件测试: 通过 (9/9)
- 临时 TCP: 通过 (gateway test)
- APK 实测: 未做 (服务端-only 改动, 不需要 APK 更新)
- 可玩验收: 未做

## 已知边界

- 仅实现穿戴 (98401); 升级/升星/分解/增幅/重铸 (98402-98407) 仍为未实现。
- 未知队长装备 tid 明确拒绝 (fail 5)。
- 资源消耗: 本接口不消耗资源 (穿戴仅移动装备)。
