# HERO-MASTERY：精通升级（659）与精通突破（660）实施记录

日期：2026-11-07。分支：`task/HERO-MASTERY-20261106`（worktree `.worktree/gameplay-20261106/hero-mastery`，基线 main a5300de）。

## 结论

659/660 已从「未路由」改为真实业务：请求按英雄 tid 解析，消耗取自 HeroTable 的 MasteryLevel / MasteryBreak，英雄的 `mastery_level`/`mastery_break` 写入英雄行（`heroes.payload_json`，登录模块 10 的 `pb_hero_info` 由 store 每次提交重编码），扣材料、状态更新、回包编码在同一个 `store.transaction` 内完成，编码或写库失败整体回滚。APK 内实际点击尚未验收（本轮不启停服务、不操作模拟器）。

## 协议证据

- 响应定义（`personal-server/assets/protobuf/hero_mastery.net.proto.bin`，原文 proto3）：

  ```proto
  // 专精升级返回
  message pb_hero_mastery_level_up_rsp { hero hero = 1; pb_res_to_client res = 2; }
  // 专精突破返回
  message pb_hero_mastery_break_rsp { hero hero = 1; pb_res_to_client res = 2; }
  ```

  `pb_res_to_client` = { repeated pb_res_change changes = 1; bool is_overflow = 2; }（`general/res.net.proto.txt`）。
- 英雄侧字段（`hero.db.proto.bin`）：`uint32 mastery_level = 16; // 专精技能等级`、`uint32 mastery_break = 17; // 专精突破等级`。因此进度是**等级数/突破数**，不是 MasteryLevel 的 tid。
- 请求编码：两条都是 ETF，静态目录记录 `staticInputShape = input-register 0`（登记在 `agent/workflow/interface-catalog/static-interfaces.json` 的 `tcp:c2s:659` / `tcp:c2s:660`），即调用方把整张表交给 `EncodeErl`。
- 调用方参数：`HeroMasteryMgr.lua`（`.worktree/recruit-20261101/.scratch/out/luaproject/HeroMasteryMgr.lua`，从 64_lua_project bundle 提取的 LuaJIT 字节码）中 `ReqHeroMasteryLevelUp`/`ReqHeroMasteryBreak` 的常量池顺序为 `tid | req_hero_mastery_level_up/req_hero_mastery_break | MasteryCmd | Send | base_values | CollectByHero | HeroAttrCollect | New | Seq`，即请求表只有 `tid`（英雄配置 tid）一个业务字段，回包后按 `AwardKit.Parse(res)` 刷新资源、`SetMasteryLevel/SetMasteryBreak` 更新本地英雄。字节码已 stripped，未取得可读反编译原文，因此按「tid 单字段表」实现，并兼容 ETF 列表 `[tid]`、`{tid}`、`{hero_tid}` 三种形状（`masteryRequestTid`）。
- MasteryCmd.lua 本身（`1414185985316839700-MasteryCmd.lua.bin`，sha256 eb642d34…）两个函数都只是 `EncodeErl(param)` 转发，无本地计算。

## 配置规则（HeroTable，实测解析，非推断）

新增读取的表：`Mastery`、`MasteryGroup`、`MasteryLevel`、`MasteryBreak`、`MasteryConst`、`MasteryMat`（`config/hero-tables.mjs`，与 `readGeneratedDump` 现有解释器一致，未改解释器）。

| 表 | 行数 | 关键字段 | 实测示例 |
| --- | ---: | --- | --- |
| `Mastery` | 77 | `mastery_group` | `2020601 -> mastery_group 5` |
| `MasteryGroup` | 20 | `level_range`、`break_range` | 组 5：等级行 `5001..5070`，突破行 `5001..5005` |
| `MasteryLevel` | 1400 | `chip`、`cost_res`、`attr` | `1001: chip 30, cost [[474002,10]], attr [[1,3600]]`；`1061: chip 80, cost [[476002,14]]` |
| `MasteryBreak` | 100 | `mastery_break`、`mastery_level_limit`、`chip`、`cost_res`、`attr` | `1001: break 1, limit 10, chip 60, cost [[476002,3]]`；`1005: break 5, limit 70, chip 500, cost [[476002,50]]` |
| `MasteryConst` | 1 | `unlock_star`、`cost_res` | `unlock_star 10` |
| `MasteryMat` | 3 | `max_lv`、`max_break` | `474002: 40/3`、`475002: 60/4`、`476002: 70/5` |

实现规则：

- 行定位：`level_range[n-1]` → MasteryLevel（第 n 级），`break_range[n-1]` → MasteryBreak（第 n 次突破）。tid 形如 `group*1000 + n`。
- 等级上限：当前突破等级下，取 `MasteryBreak.mastery_break <= 当前突破` 的最大行的 `mastery_level_limit`；未突破时为 0。依据是客户端 `HeroMasteryUtil.GetCurStateMaxLimitLevel` 用 `mastery_level_limit` 计算当前状态上限，以及 `HeroMasteryUnlockTipNode` 的「HERO_MASTERY_BREAK_LIMIT_ADD」在突破界面显示上限增量。由此首次操作必然是突破 1（上限 0→10），之后 10→20→30→50→70。
- 消耗：升级消耗 = `MasteryLevel[行].chip` 数量 × 英雄自身碎片（`Hero[tid].chip`，如 22300204）+ `cost_res`；突破消耗 = `MasteryBreak[行].chip` + `cost_res`（所有 100 条突破行的材料均为 476002，数量 3/6/12/24/50）。
- 解锁：`hero.star >= MasteryConst[1].unlock_star (10)`，否则 3019。
- 属性和技能：`MasteryBreak.attr` 是突破常驻属性；`Ability[tid].mastery_ability`（如 2020601 → 323002171）是英雄的精通技能 id。`HeroMasteryUtil.GetMasteryBreakSkillId` 的取法未反编译成功，正文只声明「突破解锁上限 + 属性」，未编造技能替换规则。

## 失败码

| 码 | 场景 |
| ---: | --- |
| 1 | 请求不是合法英雄 tid / 未知命令 |
| 5 | 配置缺失或非法（无 hero 配置、消耗字段非法） |
| 301 | 材料或英雄碎片不足（不扣任何资源） |
| 3001 | 英雄不存在 |
| 3008 | 英雄没有精通配置（Mastery 无该 tid） |
| 3011 | 已达当前突破等级的等级上限 |
| 3012 | 已达最大突破次数（不能再突破，也覆盖越级突破） |
| 3014 | 等级行或英雄碎片配置缺失 |
| 3015 | 未突破时不能升级（上限 0） |
| 3019 | 英雄星级不足，精通未解锁 |

## 技能/战斗接线（CORE-SKILL-GATES）

- 权威状态进英雄行：`hero.mastery_level` / `hero.mastery_break`，随 `heroes.payload_json` 持久化，登录模块 10 `pb_hero_info` 与查询一致（测试覆盖重开数据库后逐字段比对）。
- 只读视图 `heroMasteryView(hero, heroTables)`（服务上也挂了同名方法）：返回 `{ configured, group, unlocked, unlock_star, level, break, level_limit, max_break, mastery_ability, break_attr }`，供 battle/skill-integration 判断该英雄的精通技能是否生效、属性加成多少。
- 当前战斗接入点仍不适用：`game/effects/skill-integration.mjs` 的 `getHeroSkills/resolveActionSkill/registerPassiveTriggers` 只按 `skill-database.json` 中 `type: Mastery` 整份下发，没有读取英雄养成状态，也没有 `mastery_level` 门控。按任务约束本轮未改 `game/effects/*`；剩余接线为：在构造战斗单位处用 `heroMasteryView` 计算 `mastery_ability`/`level>0` 再放行 Mastery 技能，并把 `break_attr` 合入角色属性（当前 CORE-ATTR/CORE-BATTLE 的职责）。这属于 CORE-SKILL-GATES 未闭合部分，不是本任务新增缺口。

## 改动文件

- `personal-server/game/hero-mastery-service.mjs`（新增，含 `masteryRequestTid`、`heroMasteryView`、`createHeroMasteryService`）。
- `personal-server/config/hero-tables.mjs`：新增读取 6 张 Mastery 表（追加表名，不改解释器）。
- `personal-server/game/gateway.mjs`：新增一个 `heroMastery.supports(type)` 派发块（位置紧跟 636/638/639/640 的 `progression` 块），导入与新服务实例化各一行。
- `personal-server/test/hero-mastery-service.test.mjs`（新增 5 个用例）。
- 本文件。

未改动：`storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*`、`config/skill-database.json`、`personal-server/fixtures/game.sqlite`（测试全部用 `os.tmpdir()` 的临时库）、`docs/plans` 状态表；未生成 APK。

## 复现与证据

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\hero-mastery\personal-server
node --test test/hero-mastery-service.test.mjs   # 5/5 通过（约 1.8s）
npm test                                         # tests 2089 / pass 2086 / fail 3
```

`npm test` 的 3 个失败全部来自 `test/login-business-reads.test.mjs`（缺 `analysis/.../handoff-game.local-only.sqlite` 本地证据库），与本任务无关，按派发说明不修。基线为 2084/2081/3，本任务新增 5 个用例全部通过。

用例覆盖：

1. 未突破时升级被拒（3015）→ 突破 1 成功并核对 chip/材料扣减与回包 `changes` → 升级到 1 级 → 连续升级到上限 10 → 第 11 级 3011 → 重开数据库后英雄行与登录模块 10 的 `mastery_level/mastery_break` 一致，`heroMasteryView` 返回 group 5、limit 10、`mastery_ability`。
2. 突破 1..5 逐级成功，第 6 次 3012；突破 5 后上限 70。
3. 材料/碎片清零后升级返回 301 且不动状态；未知英雄 3001；无精通配置英雄（9000100）3008；`{}`/`[0]` 返回 1；星级 5 时 3019。
4. 编码失败（pack 抛错）与模拟 SQLite 写失败时，英雄等级/突破与材料库存均保持原值，重开数据库后仍是原值。
5. 真实 TCP：`createLocalGame` 临时端口完成握手与 SDK 登录，`encodeEtf([2020601])` 发 660 得到 `pb_hero_mastery_break_rsp.hero.mastery_break = 1`，再发 659 得到 `mastery_level = 1`，非法 tid 回 `pb_net_err{err: 3001}` 且状态不变。

## 未闭合缺口

- 659 请求体只确认到「$ETF 表含 `tid`」，未取得可读反编译确认是否还有其它字段（如数量）；已按单 tid 实现并兼容三种形状。
- 「未突破时上限为 0、必须先突破」由 `mastery_level_limit` 与突破界面提示语义推得，未取得运行时（真实点击）证据；若实际是先升级后突破，只需改 `levelLimitOf` 的未突破默认值，并在文档更新。
- `HeroMasteryUtil.GetMasteryBreakSkillId` 未反编译成功：突破是否解锁/替换技能 id、`Ability.mastery_ability` 与 `mastery_level` 的等级关系未确认。
- `MasteryConst.cost_res = [[101500,500]]` 的用途（解锁精通时的一次性消耗或其它）未确认，本轮没有在 659/660 中扣该项。
- `MasteryMat.max_lv/max_break` 与 `MasteryLevel.cost_res` 交替使用 474002/475002/476002 的关系只按数据原样执行，没有解释为开放等级规则。
- 精通属性（MasteryBreak.attr）未进入战斗属性计算，见上文 CORE-ATTR/CORE-SKILL-GATES 剩余接线。
- APK 实测：隔离客户端里实际点击精通升级/突破、界面数值与属性变化未验收（本轮禁止操作模拟器与实时服务）。
