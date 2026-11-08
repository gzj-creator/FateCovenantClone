# A1 CORE 剩余项：装备属性汇入战斗（2026-11-08）

分支 `task/A1-CORE-RESIDUAL-20261108`；worktree `.worktree/gameplay-20261108/a1-core-residual`。

## 结论

普通装备（EquipTable）是本次唯一做到端到端汇入的属性来源：登录模块 26 的 `pb_role_equip` → `collectEquipmentSources` → `assembleHeroAttributes({ extraSources })` → 阵容战力 / 1316 属性查询 / mission 与 elite 战斗输入。未取证的其它养成来源保持原状。

## 证据

- 协议：`personal-server/assets/protobuf/equip.db.proto.bin`，`pb_role_equip { repeated pb_equip equips } `；`pb_equip` 携带 `id/tid/level/level_exp/inscription/refine/refine_exp`。
- 配置：`personal-server/config/equip-tables.mjs` 读取 `EquipTable`。`Equip.attrs` 与 `Equip.per_level_attrs` 是 `[AttrType显示属性, 数值]` 对；`Refine`/ `Inscription` 行键为 `equip.type*10000 + level`，`base_attrs` 随等级单调递增（累计值）。
- 客户端语义：`analysis/scratchpad/time-temple-20261108/project/13948936819641506000-EquipAttrCollect.lua.bin` 的常量表含 `EquipAttrCollect / CollectLineupAttr / CollectAttrByTeam / GetCellAttrMap / AttributeKit.MergeAttr`，说明装备格属性被合并进阵容共享的 `base_values`（全队生效，不是单英雄私有）。
- 属性映射仍只走 `HeroTable.AttrType`（`fight_attr` + `value_type`），本次没有新增自拟属性 id 或自拟公式。

## 实现

- 新增 `personal-server/game/hero-attribute-sources.mjs`
  - `ROLE_EQUIP_MODULE = 26`；`collectEquipmentSources({ model, codec, tables })` 返回 `{ sources, notes }`，每行是 `{ play, displayAttr, value }`。
  - 一件已穿戴装备贡献：`Equip.attrs` + `per_level_attrs*(level-1)` + `Refine[type*10000+refine].base_attrs` + `Inscription[type*10000+inscription].base_attrs`。
  - 模板缺失 / 模块无法解码 / 行列缺失时只写 `notes` 并跳过，绝不按其它字段推算。
  - `talent_attrs` 未实现：`pb_equip` 不持久化天赋状态，凭空套用会重复或失真。
- `personal-server/game/attribute-service.mjs`
  - `assembleHeroAttributes({ ..., extraSources })` 接受外部来源，仍用 `AttrType` 解析 flat/rate，并记录到 `sources`；完全相同的 `play|displayAttr|value` 只计一次并写 `duplicate-attribute-source-skipped:*`，避免重复收集导致叠加。
  - 新增 `lineupExtraSources()`；`assembleLineup`/`buildLineupAttrInfo` 默认按持久化装备状态收集一次，再套用到阵容每个英雄，保证属性查询、战力、战斗同源。
- `personal-server/game/mission-fight-service.mjs`：`reportBattle` 每场战斗收集一次装备来源，传给每个攻击者；elite mission 复用 `reportBattle`，自动同源。

## 测试

```
cd personal-server
node --test --test-concurrency=1 test/attribute-service.test.mjs test/attribute-sources.test.mjs test/mission-fight-service.test.mjs test/battle-engine.test.mjs test/battle-elitemission-loop.test.mjs test/elite-mission-service.test.mjs test/skill-battle-integration.test.mjs
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs test/battle-report-consistency.test.mjs test/boss-rank-services.test.mjs test/cabin-service.test.mjs test/battle-common-effects.test.mjs
```

结果：第一批 63/63 通过，第二批 44/44 通过。专项 `test/attribute-sources.test.mjs` 3 项：

1. 穿戴装备的模板/等级/精炼/铭刻四类属性按配置进入英雄属性，重复来源只计一次。
2. 模块 26 中无法解析为 EquipTable 行的历史数据被跳过（fail closed），英雄属性不变。
3. 同一存档的 mission 战斗单位 HP 与 1316 属性查询、阵容战力一致；空装备存档不回归。

均为临时 SQLite 与真实本地网关/战斗链路，未启停实时服务、未读写 `runtime.local-only.data`、未操作 ADB/APK。

## 仍需证据的缺口

- 本次抓包测试号的模块 26 存的是槽位号（tid 1..30），不能解析为 EquipTable 行，因此“真实存档装备加成”尚缺运行验收；需要一件通过 `req_equip_forge` 真实打造并穿戴的装备再复验。
- 装备大师（`EquipTable.Master`，`type*10000+masterLevel`）没有在 `pb_equip` 里持久化的等级字段，状态来源未取证，未实现。
- 装备天赋/随机词条（`talent_attrs`）状态不在 `pb_equip`，未实现。
- 未接入：Relic（状态在原服独立 depot 表，穿戴是 `hero.relic` uid 列表，StageAttr/MainAttr 组合规则未解）、幻武 FantasyEquip、神器 Artifact（module 50 的 level/break/flyUp 有 attr 列但加成归属与星/品质组合未证）、团长装备、图鉴（`HeroTable.HandbookConstant` 只有奖励字段，无属性列）。
- 战力权重仍是既有本地兼容公式，未恢复原版权重。

