# type 98401 req_leader_equip - 队长装备穿戴 证据

## 配置表位置
- `analysis/recruitment-debug/bytecode/LeaderEquipTable.data.lua.json`
- 读取函数: `readLeaderEquipTables()` in `personal-server/config/hero-tables.mjs`
- 表: `LeaderEquip` (144 条, 6 槽位类型 x 24 件), `Grade` (6 级)
- 字段: tid, type (槽位 1-6), grade, score, attr, secondary_attr, icon, second_attr_effect

## Proto schema 定义
### 请求
- `pb_leader_equip_wear_req`: repeated `pb_leader_equip_wear wear_list`
- `pb_leader_equip_wear`: int64 uid, int32 type

### 响应
- `pb_leader_equip_wear_back`: repeated `pb_leader_equip_slot slots`, repeated `pb_leader_equip add_equip_list`, repeated `pb_leader_equip sub_equip_list`

### DB
- `pb_leader_equips_data`: repeated slots, repeated equip_list, uint64 max_uid, pb_leader_equip_forge draw_info, bytes dismiss

Proto 文件: `analysis/.../lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/10177658923620858000-leader_equip.net.proto.bin`

## 登录模块证据
- Module ID 175 = `pb_leader_equips_data`
- 读取: `readLeaderEquipState()` in leader-equip-service.mjs

## 客户端证据
- `LeaderEquipCmd.lua`: `req_leader_equip` 固定编码 `pb_leader_equip_wear_req`
- `LeaderEquipWearMgr.lua`: 处理 `sub_equip_list` (从背包移出), `add_equip_list` (放回背包), `slots` (SetSlot)

## Schema 字段定义
- wear_list: [{ uid: int64, type: int32 }]
- 响应 slots: [{ type: int32, equip: pb_leader_equip, level: uint32 }]
- 响应 add_equip_list/sub_equip_list: [pb_leader_equip { tid, uid, star, level, intensify_info }]
