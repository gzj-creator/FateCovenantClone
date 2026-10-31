# M1：模块 518 共享幻武库存

## 目标

把 `pb_fantasy_equip_res` 做成三个抽卡池、`876xx` 装备功能、圣器天池、神灵降世和幻武活动共同使用的唯一库存层。活动服务不得自行拼装或覆盖模块 518。

## 独占文件

允许修改：

- `personal-server/game/fantasy-equipment-inventory.mjs`
- `personal-server/config/game-tables.mjs`
- `personal-server/test/fantasy-equipment-inventory.test.mjs`（新建）
- 必要时新增 `personal-server/game/fantasy-equipment-types.mjs`

除非发现明确缺陷，不改 `fantasy-equipment-service.mjs`、`gateway.mjs` 或活动服务。若必须改共享文件，先向总控 agent 报告冲突。

## 当前基础

- 已实现 `read/save/ensure/validate/empty/find/findUid/create/remove/addRaw/consumeRaw/snapshot`。
- 写入第 0 块时目前会保留第 1、2 块。
- `max_equip_id` 水线已做基础校验。
- 尚未加载 `ItemTable.Chip`，也没有晶片 `point_item` 到 `need_num` 的权威映射。
- `isUnique`/`isSpGod` 当前错用品质推断，必须按配置字段判定。

## 必须完成

1. 在 `readGameTables()` 的 `ItemTable` 读取项中加入 `Chip`，生成只读索引：
   - 幻武晶片类型证据为 `type=223`
   - 映射键使用 `Chip.point_item`
   - 保存 `chip tid`、`need_num`、`point_item`，并拒绝重复映射或冲突配置
2. 严格按客户端证据定义类型：
   - `IsUnique()`：`FantasyEquip.type` 为专属幻武类型，且 `hero > 0`
   - `IsSpGod()`：`FantasyEquip.type === FantasyEquipTable.TID_FANTASY_EQUIP_SP_GOD`
   - 当前表分别对应 type 2 和 type 3；不能再以 quality 50/60/70 猜测
3. 把创建装备封装为单一服务端操作：
   - 校验 tid、Item、FantasyEquip、type、quality
   - SP 初始星按表或客户端规则确定，不在调用处散落魔法值
   - 分配 `max_equip_id`，创建完整默认字段
   - 容量、int32 溢出和 UID 水线检查
4. 把删除、raw 增减、现有实例克隆/复制放在库存层，并返回足够的变更描述供 PB 构造。
5. 提供一致的材料价值工具，供 M2、M4、M5 共用：
   - 读取 `FantasyMaterial`、`FantasyStarUp`、`FantasySpStarUp`、Item value 和晶片映射
   - 只算配置值，不扣资源
6. 提供“快照 + 修改 + 保存”的安全写模式。库存层不应自行开始嵌套 SQLite 事务；调用者必须在同一个 `store.transaction()` 内完成资源、英雄/编队和库存修改。
7. 登录初始化要兼容空模块，同时绝不覆盖已有第 0/1/2 块。

## 数据不变量

- `equips[].uid` 唯一且为正 int32。
- 非 SP 的 `quality` 必须匹配 Item 配置；SP 的成长品质按实际规则校验。
- `bless` 唯一且不含自身。
- `raw_equips[].tid` 唯一，数量必须为正或清理为不存在。
- `max_equip_id >= 所有现有 equip.uid`。
- 穿戴、试炼使用、祝福占用等引用必须能解析；损坏存档不能静默修复。

## 测试门槛

至少覆盖：

- 空模块初始化，模块 518 第 1、2 块内容逐字节不变
- 创建后 UID 水线增加，重开 SQLite 后不重复
- 非法 tid、重复 UID、负数量、水线落后、未知配置拒绝
- raw 增加/消耗到零/不足回滚
- 在同一事务中先扣资源再失败，资源与库存均回滚
- 创建时编码异常或 SQLite 写入异常，事务回滚
- 并发事务不分配同一 UID
- 重启后 `equips/raw_equips/max_equip_id` 完全恢复
- `isUnique` 与 `isSpGod` 只随配置变化，不被伪造 quality 改变

## 完成标准

- M1 专项测试通过。
- M2–M5 可以只调用 M1 完成所有库存变化，不需要直接 decode/pack 模块 518 第 0 块。
- 在交接中列出库存 API 签名和“仍由命令层负责”的资源事务边界。
