# A1 CORE 剩余项：装备属性归属与接入边界（2026-11-08，修正）

分支 `task/A1-CORE-RESIDUAL-20261108`；worktree `.worktree/gameplay-20261108/a1-core-residual`。

## 结论

装备**必须逐英雄接入**。2026-11-08 早先提交 `19d4a65`（"worn equipment into shared hero attributes"）把模块 26 的装备属性按全队共享套给阵容里每个英雄，该假设已被证据证伪，已在后续修复提交中整体移除。

当前状态：**装备没有接入属性计算**。阵容战力、1316 属性查询、mission 与 elite 战斗输入都只使用 `pb_single_hero` 自身养成（等级、突破、星级、品质等既有来源），任何一件模块 26 里的装备都不会改变任何英雄的属性，因此不存在由装备产生的虚高。`assembleHeroAttributes`、`assembleLineup`、`buildLineupAttrInfo`、`reportBattle` 已恢复为 `19d4a65` 之前的行为，不再有 `extraSources` / `lineupExtraSources` 参数与 `hero-attribute-sources.mjs`。

## 证伪证据（逐英雄）

- 协议：`personal-server/assets/protobuf/lineup.db.proto.bin`，`pb_lineup_fighter { loc = 1; index = 2; hero_id = 3; repeated uint32 equip_ids = 4; ... }`。`equip_ids` 是**该 fighter 自己穿戴的装备**，不是全队共用集合。
- 客户端语义：`analysis/scratchpad/time-temple-20261108/project/13948936819641506000-EquipAttrCollect.lua.bin` 常量表含 `CollectAttrByTeam / GetFighterInLineup / hero_id / HERO_CELL_MAX_INDEX / GetCellAttrMap / ipairs fighter_list / DevelopCellEquipData / GetEquipMap / index`，即按 `fighter.index` 找到该英雄的养成格，再取该英雄自己的格属性后经 `AttributeKit.MergeAttr` 合并；每个 fighter 独立一份 attrMap，不是全队共用一份 base_values。
- `analysis/scratchpad/time-temple-20261108/project/17864697566148708000-EquipDataMgr.lua.bin` 常量表含 `lineupEquipDic / GetLineupEquipDic / GetLineupEquipData(preLineupIdx) / cellDic / cellIdx / hero_id / insert equip_ids / UpdateDesignated`，说明装备状态按“预设阵容 + 格子”分组，英雄与装备的对应来自 fighter 的 `hero_id` 和 `equip_ids`。

## 模块 26 实测不等于 `pb_role_equip`

用测试存档的真实登录快照（`personal-server/fixtures/login-modules.seed.json`，flow `game:tcp-69:s2c:103`）解析模块 26：210 字节、17 条记录，每条为 `field1 = 1001/2001/24001…`、`field2 = 1..30`（空槽没有 field1）、`field3 = 嵌套消息 { field1 = 1782533479 }`。

- `pb_role_equip` 的 `pb_equip` 定义为 `id=1, tid=2, level=3, level_exp=4, inscription=5, refine=6, refine_exp=7`；其 field 3 是 `uint32 level`（wire type 0），而实测 field 3 是 length-delimited 嵌套消息（wire type 2）。字段布局直接冲突，不能把模块 26 当作 `pb_role_equip` 解码。
- 即使按 `pb_equip` 硬解，得到的 `tid` 是 1..30 一类的槽位号；`EquipTable` 只有 80 行（10103…12003 系列），1..30 都不是有效模板。这也是旧适配器在真实存档上一个属性也算不出来的原因。
- 结论：模块 26 的真实消息与 `pb_role_equip` 不匹配，schema 尚未取证；因此当前既不能从模块 26 取得每件装备的 level/refine/inscription，也不能取得英雄归属。

## 逐英雄接入还缺什么（未实现，不猜）

1. 模块 26 的真实消息定义（字段语义、是否携带 template/等级/精炼/铭文、是否按格位索引）。
2. 每个 fighter 的 `equip_ids` 持久化来源。当前 `hero-develop-service.mjs` 新建 fighter 时写 `equip_ids: []`，1006 穿戴也没有把装备写回 `pb_lineup_fighter.equip_ids`（`agent/workflow/interface-catalog/equipment-1001-1002-1006.md` 记为未取证：“格子与编队 equip_ids 的同步”）。
3. 在这些证据到位前，装备属性来源（`Equip.attrs`、`per_level_attrs`、`Refine`、`Inscription`）即便能解析，也无法决定“给哪个英雄”。

已取证、可复用的部分（留给后续逐英雄实现）：`EquipTable` 读取与行键规则（`Equip.attrs`/`per_level_attrs` 为 `[AttrType显示属性, 数值]` 对，`Refine`/`Inscription` 行键为 `equip.type*10000 + level`）；`HeroTable.AttrType` 是唯一属性映射来源；`pb_lineup_fighter.equip_ids = 4` 是逐英雄装备列表。

## 修复内容

- 删除 `personal-server/game/hero-attribute-sources.mjs`（模块 26 到全队共享属性的适配器）。
- `personal-server/game/attribute-service.mjs`：撤销 `extraSources` 形参、`lineupExtraSources()` 与 `assembleLineup`/`buildLineupAttrInfo` 的自动收集，恢复原签名与计算路径。
- `personal-server/game/mission-fight-service.mjs`：撤销 `reportBattle` 中“收集一次、每个攻击者共用”的接线。
- 新增回归测试 `personal-server/test/equipment-attr-scope.test.mjs`，替代原 `attribute-sources.test.mjs`。

## 测试

```
cd personal-server
node --test --test-concurrency=1 test/equipment-attr-scope.test.mjs test/attribute-service.test.mjs test/mission-fight-service.test.mjs
node --test --test-concurrency=1 test/battle-engine.test.mjs test/battle-elitemission-loop.test.mjs test/elite-mission-service.test.mjs test/skill-battle-integration.test.mjs
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs test/battle-report-consistency.test.mjs test/boss-rank-services.test.mjs test/cabin-service.test.mjs test/battle-common-effects.test.mjs
```

`test/equipment-attr-scope.test.mjs` 2 项，均使用临时 SQLite 与本地真实战斗链路：

实测结果：第一批 29/29 通过（含专项 2 项），第二批 33/33、第三批 44/44 全部通过、0 fail。

1. **阵容查询不跨英雄叠加装备**：模块 26 写入一件可解析的 `EquipTable` 装备（tid 10103、Lv5、refine 2、inscription 3）后，`buildLineupAttrInfo` 的 `lineup_power` 与每个英雄的 `fight_attr_list` 必须和空装备存档完全一致。
2. **战斗与 1316 同源且不受装备虚增**：同一请求下，mission 战斗每个攻击者的 `max_hp` 等于其 1316 属性 HP，`atk_power` 等于 1316 的 `lineup_power`，并与空装备存档逐单位一致。

## 仍未接入（保持缺口）

- 装备逐英雄加成（等待模块 26 schema 与 `pb_lineup_fighter.equip_ids` 持久化证据）。
- 装备大师（`EquipTable.Master`）、装备天赋/随机词条（`talent_attrs`）：状态来源未取证。
- Relic、幻武 FantasyEquip、神器 Artifact、团长装备、图鉴：属性归属规则未取证。
- 战力权重仍是既有本地兼容公式，未恢复原版权重。

本轮未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK，无 APK 验收。
