# CORE-BATTLE-A 实施与复核记录

记录时间：2026-11-07（续接轮）。状态：**服务端实现完成，证据待补**——通用效果已按描述接入并有生产路径证据；BUFF tid/103 回放与 `actionList` 治疗投影属 CORE-BATTLE-C 依赖，仍是缺口。

## 分支、基线与范围

- 分支 `task/CORE-BATTLE-A-20261107`，worktree `.worktree/gameplay-20261106/core-battle-a`。
- 本轮开始时 HEAD 为 WIP `ffd0ab7`（基于 `e90ef1e`，工作树干净）。已按总控要求 `git rebase main` 到 `main@9593baa`（该提交只改 wallet/acc-recharge/tools 与测试，未触及战斗），保留全部 WIP 内容；rebase 后 `git merge-base --is-ancestor main HEAD` 通过，`git diff --check` 干净。
- 只修改 `personal-server/game/battle-engine.mjs`、`game/effects/*`、本任务测试与文档。另有一处**共享回归测试 fixture** 的必然调整（见下文第 3.6 条），需总控知悉。未改 gateway、game-store、配置读取器，未扩到 CORE-BATTLE-B/C。
- 未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 变更清单

| 文件 | 变更 |
| --- | --- |
| `game/effects/effect-executor.mjs` | 新增导出 `actionScopedType(state)`：动作作用域属性只在本动作自身的效果阶段可见，触发阶段一律返回 null；`executeDamage` 的暴击率与伤害加成改为读它；`recordActionDamage` 保持"仅 action/未设相位累计"；`consumeTriggerCount` 保留 applicationId 快照语义 |
| `game/battle-engine.mjs` | fallback 伤害路径 `emitDamage` 改用同一个 `actionScopedType`，与执行器路径同源 |
| `game/effects/common-skill-rules.mjs` | 新增 `isDamageConversion`：`percent-damage-dealt` 的治疗/护盾定义稳定后置，不再依赖目录存储顺序 |
| `game/effects/effect-types.mjs` | （WIP）新增 `PERCENT_DAMAGE_DEALT` 治疗/护盾来源类型 |
| `game/effects/skill-integration.mjs` | （WIP）显式效果与被动触发器接入归一化规则 |
| `test/battle-common-effects.test.mjs` | 15 项聚焦行为测试（WIP 10 项 + 本轮 5 项） |
| `test/battle-common-effects-production.test.mjs` | 新增：服务路径 201/207、真实临时 TCP、SQLite 重开与写入失败回滚 |
| `test/skill-battle-integration.test.mjs` | 共享回归 fixture：死亡编码用例的守护者 `maxHp` 130→126（理由见 3.6） |

## 复核结论（逐条）

### 3.1 `state.actionContext` 的 phase 隔离 —— 原实现有错，已修

WIP 的 phase 只用于 `recordActionDamage` 的累计过滤（before/after/trigger 不计入"本次动作伤害"），但**暴击率与伤害加成仍直接读外层 `state.actionContext.actionType`**。触发链（`processUnitTriggers`）虽然把 phase 置为 `trigger`，actionType 仍是外层动作的类型，因此：

- `120001007`（击杀后下 1 次终结技 +25%）会作用到同一动作内由被动产生的伤害（on-kill / on-being-hit 触发）；
- `120001004`（首次终结技暴击率 +100%）会让同一动作内其他被动技能的伤害必定暴击；
- 25 个 `...174` 精通同理。

描述都是"自身**下一次**终结技伤害"或"首次释放终结技时才提升暴击"，被动技能自己的伤害不属于该终结技，故判为错误并修正：新增 `actionScopedType`，触发阶段返回 null，两条伤害路径共用。修复后 `test/battle-common-effects.test.mjs` 的"never leaks into a separately triggered hit"两项在关闭修正时必然失败（已实测 2 fail，恢复后 0 fail），证明测试非空转。

补充事实（复核时确认、避免误判）：`executeTurn` 在进入 after 相位时立刻按快照消费 `attack/ultimate` 次数，**早于** `on-skill-use`/`on-ultimate-use` 触发器。因此 after 阶段的触发伤害本来就读不到"本次动作"的限定加成，真正会泄漏的场景是动作内部（`on-kill`、`on-being-hit`、`on-hp-threshold` 等）由同一单位打出的触发伤害——本轮的测试针对的正是这条路径。

### 3.2 快照与 applicationId 的消费机制 —— 结论正确，保留

- 快照在 `before-ultimate-use` 之后、动作效果之前建立，因此"首次终结技暴击"这类动作前施加且动作后该消费的效果**在快照内**，会在动作结束时被消费（不再残留到后续动作）。
- 行动中新获得的 buff/debuff 不在快照内，动作结束不会误消费（例如击杀瞬间获得的 +25% 会保留到下一次终结技）。
- 刷新时 `executeStatModifier`/`executeStatus` 的 `Object.assign(existing, modifier)` 会写入新的 `applicationId`，快照值不匹配 → 跳过，`remainingTriggers` 因刷新被重置为新的使用次数，不会被同一次动作吞掉。
- 消费无重复：`consumeTriggerCount(actor, ...)` 每个动作只调用一次；`damage-taken` 类按"每次命中消费一次"设计，与"下一次受到伤害"的描述一致，且计算伤害后才消费（本次命中仍受减伤保护）。

### 3.3 `recordActionDamage` 的相位与治疗/护盾取值时序 —— 正确，另加顺序归一化

- 累计仅发生在动作自身效果阶段（phase 为 `action` 或未设置），before/after/trigger 的伤害不计入"本次动作伤害"。
- `120001002` 的治疗是 `on-ultimate-use` 被动，在 after 相位触发，读的是本动作 action 相位已累计的实际 HP 损失，时序正确。新增测试"damage dealt before the ultimate is not counted as ultimate damage"证明 before-ultimate 触发的 500 伤害不会被计入 10% 治疗（去掉相位过滤后该测试与旧吸血测试同时失败）。
- `2504050123` 的"本次伤害转化为护盾"是同一技能内的后置效果，读取 action 相位累计值，正确。
- 发现隐患并修正：转换效果原先依赖 `implementation.effects` 的存储顺序，若某个技能把转换写在伤害之前会读到 0。现由 `commonSkillEffects` 稳定后置所有 `percent-damage-dealt` 定义；新增测试用"转换在前、伤害在后"的合成技能验证修复（关闭归一化后该测试失败）。

### 3.4 两条伤害路径语义 —— 已对齐，残余差异明确

- 实际 HP 损失与护盾吸收统一由 `recordActionDamage` 计算：`hpDamage = oldHp - newHp`（不含溢出、不含吸收），`absorbed` 单独记录；`damageDealt/damageTaken` 统一按**实际 HP 损失**累计，修复了执行器路径原来按 `value`（含被护盾吸收）累计的高估。
- 两条路径的 `value` 语义一致：都是吸收前的伤害值，客户端飘字口径相同；事件投影统一走 `rawDamageEvent`，公开的 `harms` 字段仍是 `value/oldHp/hp/oldShield/shield/critical`，两条路径一致（`hpDamage/absorbed` 只保留在结果对象上，未加进公开事件，避免影响既有报告契约）。
- 残余差异（既有，非本轮引入，已记录）：fallback 路径对角色职业有暴击率下限（`max(actor.critChance, behavior.critChance)`），执行器路径不带职业下限；`executeDamage` 内的命中回能上限写死 1000，与 `FIGHT_ENERGY_MAX` 当前数值相同但未引用常量。两者不改变本任务规则的取值一致性。
- kill-chain 分支一次"回合动作"会切出多个 actionId，但 `actionContext.damage` 不重置，视作同一次终结技的多次打击累计；该口径已在文档标注，未改行为。

### 3.5 上一轮遗留的第 3 条复核项 —— 已关闭

上一轮记为"复核限定动作属性在触发器阶段的作用范围"，本轮已按 3.1 修正并有正反两向测试，可从遗留项删除。

### 3.6 共享回归测试的必要调整（需总控知悉）

`test/skill-battle-integration.test.mjs` 的"伤害进入死亡事件流"用例原用 130 HP 守护者 + 两次 63 伤害，其致死性依赖旧近似：`321010174` 精通在同一动作内给自己 +15% 伤害加成后再打第二次。按描述该加成只属于"下一次终结技"，修正后第二次仍是 63，130−126=4 不致死，用例前提失效。已将守护者 `maxHp` 调整为 126 并加注释说明，断言语义（被动击杀必须产生死亡事件）不变。这是本次唯一改动到的他人测试文件，请总控在合并评审时确认。

## 复现命令与测试证据

工作目录：本 worktree 的 `personal-server/`。日志位于本 worktree `analysis/test-runs/core-battle-a-20261107/`（`analysis/` 不提交 Git）。

| 命令 | 结果 | 日志 |
| --- | --- | --- |
| `node --test test/battle-common-effects.test.mjs test/battle-common-effects-production.test.mjs test/effects/ test/battle-engine.test.mjs test/skill-effect-integration.test.mjs test/skill-trigger-regression.test.mjs test/skill-battle-integration.test.mjs test/hero-skill-gates.test.mjs test/mission-fight-service.test.mjs` | 108 / 108 通过 | `focused-final.log` |
| `node --test test/hero-*.test.mjs` | 1539 / 1539 通过 | `hero-regression-final.log` |
| `node --test test/battle-*.test.mjs test/effects/ test/skill-*.test.mjs test/mission-fight-service.test.mjs test/elite-mission-service.test.mjs test/general-dungeon-service.test.mjs test/general-dungeon-gateway.test.mjs test/week-hunt-service.test.mjs` | 130 / 130 通过 | `battle-regression-final.log` |
| `node --test test/gameplay-gateway.test.mjs test/game-gateway-observer.test.mjs test/game-gateway-probe.test.mjs test/game-handshake.test.mjs test/game-framing.test.mjs test/game-packet-crypto.test.mjs test/system-integration.test.mjs test/m5-command-matrix.test.mjs` | 53 / 53 通过 | `gateway-regression-final.log` |

合计 1830 项、0 失败、0 跳过（同一代码状态）。未运行本分支全量 `npm test`，按派发要求留给总控合并后统一执行。

## 生产路径证据（服务 / 真实 TCP / SQLite）

`test/battle-common-effects-production.test.mjs`（3 项）：

1. **服务路径**：临时 SQLite fixture 上通过 `createMissionFightService` 走 201→207。解码 `pb_fight_report.battle_list[0].action_list`，断言英雄 2010201（fighter 102，目录被动 `120001002`）在自己的终结技里造成 834 点实际 HP 伤害后，其 HP 轨迹只出现一次回升，且幅度恰为 `floor(834*0.1)=83`（报告里下一次挨打事件的 `old_hp` 为 114 = 31+83）。201 只有预览，未写库；207 提交后任务游标 20205→30201、体力 120→115；重开数据库后一致、首通奖励 claim 恰好 1 条。
2. **写入失败回滚**：对 `reward_claims` 建 `RAISE(ABORT)` 触发器后 207 抛错，任务游标仍为 20205、体力仍 120、claim 0 条；删除触发器后重试 207 成功，再重开数据库仍为 30201/115。证明结算事务整体回滚且可重试。
3. **真实临时 TCP**：`createLocalGame` + 真实握手（`verify`/`parseServerChallenge`/`localAesBeforeFinal`）→ `909103` 登录 → `201` → `207`。同一份报告满足与证据 1 相同的吸血断言；结算后关闭服务、用同一 `game.sqlite` 重新拉起，任务游标/体力保持，且再次 201（重打已通关节点）产出的 action_list 与首次逐项 `deepEqual`，证明种子化模拟在生产调用链上可复现。

非空转验证：把 `120001002` 临时改回旧的"20% 攻击"近似后，证据 1 与 3 立即失败；恢复后通过。把 `recordActionDamage` 的相位过滤或 `actionScopedType` 的触发屏蔽临时移除，对应专项测试分别失败。

## 配置依据与推断边界

来源为仓库现有 `personal-server/config/skill-database.json`（`implementation.source = FightTable.Ability + FightTable.AbilityDes`，含原 tid、`text` 与 `show_name`）：

| 技能 | 描述证据 |
| --- | --- |
| `120001002` | 终结技造成伤害的 10% 转化为自身生命；text `601509076` |
| `120001004` | 首次释放终结技，最终暴击率提升 100%；text `601509078` |
| `120001006` | 释放终结技后，下 1 次普攻/绝招伤害提升 50%；text `601509080` |
| `120001007` | 击杀后提升自身下 1 次终结技攻击 25% 伤害加成；text `601509081` |
| `312020174` 等 11 条 | 普攻/绝招后，自身下一次终结技伤害提升 15% |
| `332030174` 等 14 条 | 自身下一次受到伤害降低 15% |
| `2504050123` | 本次造成的伤害 100% 转化为自身护盾；text `601501139` |

"实际 HP 损失"（排除护盾吸收、溢出与独立被动伤害）是本接口的明确实现约定，尚无原服运行对照，不能称作原始底层公式已还原。普攻/绝招在当前内核共用 attack 动作；`120001006` 的"普攻/绝招"因此统一映射到 attack 动作后的下一次攻击。目录里大份 JSON 的历史 `notes/requiresInvestigation` 保留不动，运行时才归一化相关效果。

## APK/客户端边界

本轮为纯服务端与测试改动，未产生新 APK，不做 APK 验收，不制造快照。真实隔离客户端的战斗表现（吸血飘字、护盾、暴击）仍待后续用户安排的设备验收。

## 缺口与依赖

1. **CORE-BATTLE-C 依赖（不在本任务伪造）**：`mission-fight-service.mjs` 的 `actionList()` 仍未投影 heal 事件——伤害、护盾、死亡/复活、能量同步会下发，治疗不会。真实 `pb_fat_harm` 的治疗 type/prompt 取值尚无权威证据（已知伤害 106/prompt 101，护盾 109），因此客户端看不到吸血回放；schema 位于 `assets/protobuf/fight.db.proto.bin`（需 `rg -a`）。本任务不编数字、不编 BUFF tid。
2. 真实 `FightTable.Buff.tid` 映射与 `pb_fat_buff_change`（proto 103）状态变化/回放仍缺，归 CORE-BATTLE-C。
3. 精通 `...174` 在生产中能否被选中取决于 CORE-SKILL-GATES（`mastery_ability` 常指向 `...171`），受控模拟通过不等于生产分支已闭合。
4. 队友行动/跨单位触发、最大生命、命中/闪避、状态命中/抵抗、反弹等结算未实施；`protection/invulnerable/strengthened/frightened/chain/pursuit` 的完整语义仍在 CORE-BATTLE-B/C 范围。
5. 原始伤害/能量公式与 project-fallback 技能精度仍是独立缺口。
6. `2504050123` 只补了"本次伤害转盾"一条，灰烬、龙甲、天极、复生等专有机制属 CORE-BATTLE-B。

## 交接

- 分支已 rebase 到 `main@9593baa`，工作树提交后保持干净；`git diff --check` 通过。
- 合并前请总控确认第 3.6 条的共享测试 fixture 调整，并在合并后执行一次 personal-server 全量 `npm test`（本分支 1830 项相关回归已通过，但不等同全量）。
- 本分支无需要保留的未提交用户改动；`analysis/scratchpad/CORE-BATTLE-A/` 下的探针脚本为只读排查用，不入 Git。
