# CORE-ATTR：养成属性、战力与战斗输入统一接入

- 分支：`task/CORE-ATTR-20261106`（基于 main `63b9f85`）
- worktree：`.worktree/gameplay-20261106/core-attr`
- 日期：2026-11-07
- 状态：服务端完成（属性查询/战力/普通副本战斗同源）；APK 实机验收未安排

## 1. 配置证据（HeroTable 转储中此前未被服务端读取的构造函数）

来源：`personal-server/assets/tables/HeroTable.data.lua.json(.gz)`，由 `config/hero-tables.mjs` 的 LuaJIT 生成表解释器解析。以下表在本次之前**没有任何服务端读取方**，因此此前的 `1000 + level*100 + quality*10` 只是本地估算。

| 表 | 键 | 证据字段 | 用途 |
| --- | --- | --- | --- |
| `BaseAttrNew` | `heroTid*100 + 品质(30/40/50/60/70)` | `hp/attack/physical_def/magic_def/crit/crit_harm` + `*_grow` | 基础值 + 逐级成长 |
| `StarAddAttr` | `camp*10000 + quality*100 + star(0..5)` | `hp/attack/physical_def/magic_def` + `*_sum_add` | 低星固定值 + 百分比 |
| `HighStarAddAttr` | `heroTid*100 + star(6..10)` | `hp/attack/physical_def/magic_def` | 6–10 星固定值 |
| `BreakAddAttr` | 突破等级 0..50 | `hp/attack/physical_def/magic_def` | 突破固定值 |
| `BattleAttr` | 英雄 tid | `attr=[[显示属性,值],…]` | 每英雄基础战斗属性（如 `[[1,900],[2,150],[24,45],[25,45]]`） |
| `AttrType` | 显示属性 id | `fight_attr/value_type/show_factor` | 显示属性→战斗属性键、固定/百分比 |
| `NpcAttrRatio` | NPC tid | `attr_list=[[显示属性,10000],…]` | 敌方属性比例 |
| `NpcFightCustom` | 1 | `elite_scale=1.3` | 精英怪倍率 |

关键映射（均由 `AttrType` 配置解析，不在代码里硬编码数值）：

- `1→24` 生命，`2→2` 攻击，`24→8` 物防，`25→13` 魔防；
- `5→25` 生命%、`6→3` 攻击%、`26→9` 物防%、`27→14` 魔防%；
- `11→29` 暴击、`12→30` 暴伤（面板中仅有的两个 is_show=true 百分比属性）。

状态权威：`model.heroInfo.hero_list` 持久化 `level/star/star_progress/breakthrough_level`（`pb_single_hero`）；`pb_single_hero` **没有 quality 字段**，因此品质取 `HeroTable.Hero.quality` 配置，并保留 `overrides.quality` 给后续升品系统。

## 2. 实现

### 新增

- `personal-server/config/attribute-tables.mjs`：独立读取上述属性表，带缓存；不改动总控维护的 `config/hero-tables.mjs`。
- `personal-server/game/attribute-service.mjs`：
  - `assembleHeroAttributes()`：等级/星级/突破/品质统一组装，返回 `fightAttrs`、`stats`、`sources`（每项带 `play/displayAttr/key/kind`）与 `notes`；
  - `assembleLineup()` / `buildLineupAttrInfo()`：阵容属性与 `pb_attr_lineup_all_info` 负载；
  - `npcAttributeScale()` / `applyNpcScaling()`：敌方比例与精英倍率；
  - `compatibilitySpeed()`、`POWER_WEIGHTS`：明确标注的兼容规则。

公式（集中一处，便于后续替换）：

1. 固定值：`flat[key] = Σ 配置固定值`；等级成长项 `grow * (level-1) / 10000`；
2. 百分比：`rate[key] = Σ 配置百分比（10000=100%）`；
3. 最终值：`round(flat * (1 + rate/10000))`，HP/攻击下限 1，防御下限 0；上限证据未见，不加人为上限；
4. 战力：`hp*1 + attack*10 + physicalDefense*2 + magicDefense*2`（`POWER_WEIGHTS`），**兼容公式**，非原游戏公式。

### 接线

- `game/mission-fight-service.mjs`：玩家单位 HP/攻击/防御/速度改由属性服务产出；`atk_power/def_power` 使用同一战力函数。战斗内核的单通道防御取物防/魔防均值（标注兼容，等待 CORE-BATTLE 拆分伤害类型）。
- `game/rank-service.mjs`：`localCombatPower` 改为 `assembleLineup().totalPower`，排行榜战力与属性查询/战斗报告同源。
- `game/gateway.mjs`：仅新增 `1316 req_role_attr_info` 分支，返回 `pb_attr_lineup_all_info`；请求可携带可选 ETF 阵容类型，缺省 1。

保留主线的 207 结算/体力、邮件推送、活动期限、module 8/90 多槽、onlineGift/rankAchieve/firstWeekGoal 登录与派发路径未改动；未改 `battle-engine.mjs`、`game/effects/*`、`game-store.mjs`。

## 3. 兼容与未复刻项（明确标注）

| 项 | 现状 | 原因 |
| --- | --- | --- |
| 逐级成长分母 10000 | `hp_grow=396000` 解释为 +39.6/级 | 量级推断；原始取整规则未取证 |
| 战力公式 | `POWER_WEIGHTS` 兼容权重 | `BaseAttrNew.power` 全为 0，未找到权重表 |
| 品质 | 取 `Hero.quality` | 存档不存在 quality 字段；升品系统未实现 |
| 星级下限 | 存储 0 按 1 星处理 | `pb_single_hero` 注释：默认 1 星 |
| 敌方基础成长 | 以最强我方单位 ×0.88 作为基线，再乘 `NpcAttrRatio`/`elite_scale` | `NpcAttr` 仅存外部文件名 `HeroTable.NpcAttr.N.data.lua`，实体未随包 |
| 速度 | 职业基准值 + index%7 | 无速度配置表 |
| 装备/团长装备/图鉴/好感/法阵/符文/圣器 | 尚未汇入 | 见第 5 节；role 级 6 槽装备属于 team 属性，进入战斗的方式未取证 |
| 1316 原始 `attr_list`（按 play_type 拆分） | 返回空数组，最终属性与战力完整 | `play_type` 枚举与 `Develop` 语义未恢复 |
| 1314 `req_role_refresh_power` | 未接入 | 响应 schema 未恢复（静态目录为 null），避免伪造回包 |

## 4. 验证

命令（`personal-server/`）：

```powershell
node --test --test-concurrency=1 test/attribute-service.test.mjs
node --test --test-concurrency=1 test/mission-fight-service.test.mjs
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs
node --test --test-concurrency=1 test/rank-service.test.mjs test/item-mission-service.test.mjs test/hero-lineup-service.test.mjs test/elite-mission-service.test.mjs test/equip-service.test.mjs
```

结果：

- `attribute-service` 4/4：等级/星级/突破/品质取配置行、品质换行、未知配置报 5、确定性；1316 经真实 TCP 握手/登录后返回，`lineup_power` 与 `assembleLineup` 一致，实体 tid=英雄 uid，HP 属性与战斗 `max_hp` 一致，`atk_power` 一致；SQLite 重开后按新等级重新组装。
- `mission-fight-service` 23/23；`gameplay-gateway` 7/7；rank/mission/lineup/elite/equip 汇总 36/36（合计 43 含 gateway）。

证据中的具体数值示例：英雄 `1040101` 1 级 1 星 → HP 7500、攻击 1050、双防 345；60 级 → HP 9836、攻击 1369；6 星 + 6 破 → HP 169436；`3040201` 品质 50/60 的 `BaseAttrNew` HP 为 3000/6000。

## 5. 剩余项 / 阻塞

1. 敌方 `NpcAttr` 外部数据未随包；取得 `HeroTable.NpcAttr.<n>.data.lua` 后可替换 `mission-fight-service` 中的兼容基线。
2. 战力原始权重、1316 `attr_list` 的 `play_type` 语义、1314 响应 schema 需客户端静态证据。
3. 装备（role 级 6 槽 team 属性）、团长装备、图鉴、好感、法阵、符文、圣器、幻武、训练、星魂卷轴等通过同一入口扩展：`assembleHeroAttributes` 增加 play 来源即可，禁止各模块自行计算战斗数值。
4. CORE-SKILL-GATES：`AbilityLevel`（星级→技能等级）已在本轮确认存在但未接入技能选择。
5. APK 实机验收：需在隔离客户端查看 1316 属性页、排行榜战力与一场普通副本，确认数值与战斗一致。

