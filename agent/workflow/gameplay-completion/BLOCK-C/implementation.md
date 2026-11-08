# 工作块 C（#49–#64）：装备、圣器、魔灵、精灵与后期养成

日期：2026-11-08。分支 `task/BLOCK-C-20261108`，worktree `.worktree/gameplay-20261108/block-c-20261108`。

## 覆盖情况

16 张任务卡里 EQUIP-ARTIFACT（#50）和 EQUIP-RELIC（#54）此前已经合入 main（`artifact-service.mjs` 37060–37075、`relic-service.mjs` 89701–89712），本轮只做回归，没有重写。EQUIP-MAGICCIRCLE（#55）没有新增数字命令，本轮未动 90401–90405。

其余 14 张卡共 59 条命令全部接入网关：

| 卡 | type | 服务文件 | 权威状态 |
| --- | --- | --- | --- |
| EQUIP-EQUIP | 1007/1008/1009 | `equip-service.mjs`（扩展现有 1001–1006） | 模块 26/16 的 `pb_role_equip` |
| EQUIP-WARRUNE | 83001–83007 | `war-rune-service.mjs` | `develop_module_state`（登录槽位未恢复） |
| EQUIP-MUSEUM | 85701/85702 | `museum-service.mjs` | `develop_module_state` |
| EQUIP-FANTASYHANDBOOK | 89001 | `develop-extra-service.mjs` | `develop_module_state` |
| EQUIP-PET | 90731–90748（17 条） | `pet-service.mjs` | 模块 158 `pb_pet_develop_data`；灵核 uid/灵祠槽位落在 `develop_module_state` |
| EQUIP-PETPLAY | 90901/90902 | `develop-extra-service.mjs` | `develop_module_state` |
| EQUIP-ENERGYBURST | 91001 | `develop-extra-service.mjs` | `develop_module_state` |
| EQUIP-TREASURE | 93301–93306 | `treasure-service.mjs` | 模块 534 `pb_treasure_data` |
| EQUIP-ELVES | 93701–93707 | `elves-service.mjs` | 模块 538 `pb_elves_develop` |
| EQUIP-ELVESBEAD | 93751–93755 | `elves-bead-service.mjs` | 模块 539 `pb_elves_bead_data`；穿脱槽位落 `develop_module_state` |
| EQUIP-LEADEREQUIP | 98402–98407 | `leader-equip-develop-service.mjs` | 模块 175 `pb_leader_equips_data`（98401 仍在原文件） |
| EQUIP-DIVINEEMBRYO | 102201 | `develop-extra-service.mjs` | `develop_module_state` |
| EQUIP-BADGE | 104201 | `develop-extra-service.mjs` | `develop_module_state` |

`develop_module_state` 是角色级 JSON 表（`role_id, module, payload, updated_at`），用于登录容器槽位尚未取证的模块，做法与 `bonus-draw-service` 一致。

## 配置依据

- 请求字段与编码来自客户端字节码字符串：`WarRuneCmd.lua`（`rune_tid/from_id/target_id`）、`PetCmd.lua`（`pet_tid/level_count/combine_equips/equip_uid_list/equip_up_uid/materials/list`）、`TreasureCmd.lua`（`treasure_index/draw_lib/treasure_tid_list`）、`ElvesCmd.lua`（`elves_tid/page/talent_id/up_level/skin_tid/help_slots`）、`ElvesBeadCmd.lua`（`bead_uid/up_level/use_bead_uid_list/beads_slots/slot/elves_id`）、`EquipCmd.lua`（`exchanges`）、`BadgeCmd.lua`（`tid_list`）。
- 响应 schema 全部取自 `personal-server/assets/protobuf/*.proto.bin`，并逐条用 `loadGameSchemas()` 校验存在（`pb_leader_equip_recast_back` 在客户端 proto 里确实缺失，98406 回 `pb_res_to_client`）。
- 材料族来自 `ItemTable`：`PetChip`（pet tid + 1）、`ElvesChip`（elves tid + 1）、`TreasureChip`（`'10' + treasure tid`）、`ElvesBead`、`PetMutantItem`、`ElvesMutantItem`、`MuseumCollectionItem`、`ItemWarRuneChip`、`FantasyEquipChip`。
- 1007 觉醒的解锁等级取 `EquipTable.Const.awaken_open`，1008 兑换比例取 `EquipTable.ResExchange.value`，1009 批量精炼消耗取 `EquipTable.Refine.cost`（真实表，非手写）。

## 未闭合的证据缺口

- `WarRuneTable`、`MuseumTable`、`FantasyHandbookTable`、`PetTable`、`PetPlayTable`、`EnergyBurstTable`、`TreasureTable`、`ElvesTable`、`BadgeTable`、`DivineEmbryoTable` 在本版本只以 LazyInit 形式打包（`LazyInit` + `X_List` 构造），`readGeneratedDump` 不支持该生成器（`UGET`）。因此：
  - 每级/每星的消耗数量、等级上限、星级上限是本地推定值（见各服务顶部注释）；
  - 能量爆发、宠物周期奖、博物馆人气奖、时装等**奖励物品清单未落地**，这些命令只落真实领取位并回空 `res_change`，不编奖励；
  - 兵符属性随机只产生 `pb_attr_item{key,value}`，没有对照 WarRuneTable 的属性池。
- 登录容器槽位未恢复：83001–83007、85701/85702、89001、90901/90902、91001、102201、104201 的状态不会出现在登录包里，重登后客户端需重新请求。
- 98406（`req_leader_equip_recast`）响应 schema 缺失；98404 分解、93755 灵珠分解的返还物品未取证。
- 灵核（`pb_pet_equip_container`）在登录模块 158 的哪一层没有证据，本轮把灵核 uid 放在 `develop_module_state`，与客户端真实背包未对齐。

## 验证

`cd personal-server; node --test test/endgame-develop.test.mjs`

- 9 项测试全部通过：宠物合成/升级（重开库仍在、扣费不足 301、超上限 305）、秘宝升星落模块 534、精灵升星与灵珠升级落模块 538/539、兵符激活/升星/洗属性、博物馆激活与人气奖幂等、徽章/神胚/能量爆发幂等、团长装备升星吃掉 cost uid、装备 1008 兑换比例与 1009 批量精炼。
- `node --test test/equip-service.test.mjs test/equip-tables.test.mjs`：11 项通过，1001–1006 原路径未回归。
- `node --input-type=module -e "await import('./game/gateway.mjs')"` 通过，网关可加载。
- 未做：真实 TCP 19090 数字端口联调、SQLite 重开后的全量回归（`npm test` 全量）、APK 验收。按本轮约束不清库、不启停实时服务。
