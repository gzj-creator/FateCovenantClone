# CORE-BATTLE-C 实施与复核记录

记录时间：2026-11-08。状态：**服务端战报层完成，带证据缺口**——真实模拟结果已投影到 103/106 战报，治疗量与 BUFF 增减不再是空回包或固定值；仍未做 APK 验收。

## 任务边界

任务卡边界来自 `docs/plans/remaining-gameplay-20261106/12-shared-gaps.md`（CORE-BATTLE 表「CORE-BATTLE-C：报告」行与实施范围表）以及 `execution-status.md` 的 CORE-BATTLE 行：

- 取得真实 `FightTable.Buff` tid 后补 `pb_fat_buff_change`（proto 103）状态变化及对应生命周期回放；**不得编造 tid**。
- 统一实际模拟结果与客户端报告：伤害、治疗、护盾、能量、死亡、复活、召唤事件都要来自服务端真实计算。
- 源码入口限定在 `personal-server/game/battle-engine.mjs`、`game/effects/*`、`game/mission-fight-service.mjs`。
- 验收口径：同一输入与种子重复模拟一致；新增语义有真实战果断言；触发不自递归、不每回合永续叠加；报告反解与最终 HP/护盾/能量/生死一致。
- 本轮未启停实时服务、未读写 `runtime.local-only.data` 与运行数据库、未操作模拟器/ADB/APK、未生成 APK、未连接原服。测试只用临时 loopback TCP 与临时 SQLite。

分支 `task/CORE-BATTLE-C-20261108`，worktree `.worktree/gameplay-20261106/core-battle-c`，起点 HEAD `250a63b`（已 rebase 到 main）。
提交后主线已前进到 `85ec949`（另有 PAY-SLOTGAMEACT 等 14 个提交，均不触及战报层文件）；`git merge-tree --write-tree HEAD main` 返回 exit 0，合并无冲突。

## 协议与结构依据

全部数字都取自客户端实体，没有一处是推测：

| 依据 | 内容 | 复现 |
| --- | --- | --- |
| `core/9286154805154101000-ProtobufKey.lua.bin` | 101 `pb_fat_action_before`、102 `pb_fat_action_after`、103 `pb_fat_buff_change`、104 `pb_fat_battle_over`、105 `pb_fat_fighter_die`、106 `pb_fat_harm`、107 `pb_fat_round_ready`、109 `pb_fat_shield`、112 `pb_fat_round_over`、114 `pb_fat_fighter_relive`、116 `pb_fat_attr_sync` | 解析该 bundle 的 `ProtobufKey` 常量表（键值成对出现，如 `["pb_fat_buff_change",103]`） |
| `FightTable.Prompt`（`tools/extract-battle-tables.mjs`） | `Prompt[107]` = `FightPromptValueRecoverNode.prefab`，`type=0`（PROMPT_NUMBER）、`sign=0`（PROMPT_SIGN_POSITIVE）；`Prompt[101]` 为 `FightPromptValueNormalNode`，`sign=1` | `node tools/extract-battle-tables.mjs analysis/scratchpad/time-temple-20261108/project --types=FightTable.Prompt --rows` |
| `IFightHarm.lua.bin` | `IsRecover` = `Prompt.type == PROMPT_NUMBER and Prompt.sign == PROMPT_SIGN_POSITIVE`；`IsHarm` 用 `PROMPT_SIGN_NEGATIVE` | 反汇编该 bundle 的 `IsHarm`/`IsRecover` 原型 |
| `FightTable.Buff` | 10001 `TID_BUFF_STUN` type=3 effect=1001、11003 `TID_BUFF_POISON` type=2 effect=1013、11004 `TID_BUFF_BURNING_HOT` type=2 effect=1014；三者 dispel=true、dead_rm=true，overlay 上限 2/2/1 | `node tools/extract-battle-tables.mjs analysis/scratchpad/time-temple-20261108/project --types=FightTable.Buff --rows` |
| `fight.db.proto` | `pb_buff_obj` 字段 aim_id(1)/tid(2)/ab_tid(3)/overlay(4)/sign(5)/caster_id(6)/change_reason(7)；`sign` 注释「符号标识，true:增加，false:移除」；`change_reason` 注释「0.普通增加/移除 1.驱散 2.死亡 3.引爆」 | `personal-server/assets/protobuf/fight.db.proto.bin` 第 233–247 行 |
| `BuffChangeStep.lua.bin` `_OnStart` | 读 `self.sign`：falsy 跳转到 `FighterMgr.Get(fid):RemoveBuff(tid, overlay)` 分支，truthy 落到 `AddBuff(tid, overlay, srcId)` 分支；两分支各自触发 `FightAddStatusIcon`/`FightRemoveStatusIcon` 与对应提示 | 反汇编 `BuffChangeStep` 第 2 个原型（pc31 `TGETS sign`，pc32 `ISF` → pc33 `JMP` → RemoveBuff 块） |
| `ParseBuff.lua.bin` `DoBuff` | 只有 `sign` truthy 时才 `FightBuffEffectMgr:AddBuffObjToPromptList`，即只有「刚获得」才挂飘字 | 反汇编 `ParseBuff` 第 1 个原型 |
| `Fighter.lua.bin` `AddBuff`/`RemoveBuff` | 客户端按 tid 维护一个层数：`AddBuff` 加 `overlay`，`RemoveBuff` 减 `overlay`，减到 `<= 0` 才删除图标条目 | 反汇编 `Fighter` 第 7、9 个原型 |

由此确定两条会直接决定客户端观感的语义，并纠正了上一轮中断时的实现：

1. **`sign` 是增删标志，true=增加、false=移除**。上一轮 WIP 按「sign=true 表示移除」写，与 proto 注释、`BuffChangeStep`、`ParseBuff` 三处证据都相反，本轮已改正。
2. **`overlay` 是层数增量，不是层数结果**。移除必须带上真正消失的层数；发 0 客户端会减 0，图标不会消失。

## 改动清单

| 文件 | 要点 |
| --- | --- |
| `game/effects/report-codes.mjs`（新增） | 战报层常量单一入口：`FAT_ACTION`（101–119 全部 proto id）、`PROMPT`（101–114 中本服务可论证的提示位）、`BUFF_CHANGE_REASON`、`BUFF_SIGN`、已证 `FightTable.Buff` 行（`provenBuffTid`/`provenStatusBuff`/`removesOnDeath`/`isDispellable`）。未证的 tid 一律返回 null，调用方必须 fail closed |
| `game/battle-engine.mjs` | ① 状态增删改为产出 `buff-change` 事件：`status` 结果 → 增加条目（sign=true、`overlay=stacksDelta`、`ab_tid=` 当前动作技能、`caster_id=` 施加者）；`status-expire` → 移除条目（sign=false、`overlay=` 消失层数）；`dispel` → 按 `removedDetail` 逐条移除（sign=false、`change_reason=DISPEL`）；死亡时 `dead_rm=true` 的状态 → 移除条目（sign=false、`change_reason=DEAD`）。② `heal` 结果补成战报事件（`aimId/hp/oldShield/shield/tick/status`），并保留执行器原字段。③ 新增 `state.currentAbilityId`：动作开始设置、结束清零，被动动作窗口用触发技能前缀还原 `FightTable.Ability` id，供 `ab_tid` 使用。④ `appendStandaloneResults` 把 `buff-change` 与真实治疗纳入「可见被动动作」判定，0 治疗不开窗口 |
| `game/mission-fight-service.mjs` | `actionList` 导出，新增两条投影：`heal` → `pb_fat_harm`（`type=107`、`value=实际回复`、`old_hp/hp/old_shield/shield` 取自模拟结果，0 回复不发包）；`buff-change` → `pb_fat_buff_change`（103，逐条 `pb_buff_obj`）。动作码改为引用 `FAT_ACTION`/`PROMPT` 常量 |
| `game/effects/effect-executor.mjs` | `executeStatus` 额外返回 `previousStacks`/`stacksDelta`（刷新未加层时 delta=0）；`executeDispel` 额外返回 `removedDetail`（每种被驱散状态的层数），`removed` 保留 |
| `game/effects/skill-integration.mjs` | `processBuffTicks` 的 `status-expire` 结果带上真实层数 `stacks`，供移除条目使用 |
| `test/battle-report-heal.test.mjs`（新增） | 真实治疗事件带 HP 增量；107 投影字段；0 回复不发包；生产 201 战报含吸血回复 |
| `test/battle-report-buff-change.test.mjs`（新增） | tid 映射表；sign 语义；中毒增加条目；叠层只报增量；拒绝刷新不发包；未证状态 fail closed；限时到期移除带层数；死亡 dead_rm 移除；驱散移除；103 字段往返 |
| `test/battle-report-consistency.test.mjs`（新增） | 同种子同事件流；事件回放反解与最终 HP/护盾/能量/生死一致；生产 201 战报重登后动作流一致；PB 编码失败整笔回滚；SQLite 写入被拒整笔回滚且可重试 |
| `test/battle-common-effects-production.test.mjs` | 新增治疗包断言，并把 107 提示从伤害累计中排除（同一动作里吸血回复的 old_hp/hp 不能被当成伤害） |

## fail closed 清单

以下分支没有证据，一律不发送、不猜值，服务端状态照常计算：

- 未取得真实 `FightTable.Buff` 行的状态（`frightened`/`chain`/`pursuit`/`strengthened`/`protection`/`invulnerable`/`hasted`/`energized`/`bleed`/`freeze`/`silence`/`weakened`/`slowed`/`exhausted` 等）：`provenBuffTid` 返回 null，不产生 103 条目，测试用 `frightened` 守护。
- `stat-modifier` 类属性增减：没有可核对的 buff tid，本轮不投影。
- 道具、圣器、被动光环、领地/领域层数等由 CORE-BATTLE-B 专有状态直接写入的层数：不产生 103。
- 治疗暴击（108）、治疗分摊（109）、吸血（110）等提示位：只发普治 107，不猜分支。
- `change_reason=3`（引爆）、`pb_fat_second_shield`(119)、`pb_local_fat_attr_obj`(117)、`pb_fat_cf_hp`(118) 等未使用。
- 施法者缺失时 `caster_id` 落 0，`ab_tid` 落 0（proto 注释说明该字段只在增加时有效）。

## 复现命令

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\core-battle-c\personal-server
node --test --test-concurrency=1 test/battle-report-heal.test.mjs test/battle-report-buff-change.test.mjs `
  test/battle-report-consistency.test.mjs test/battle-common-effects-production.test.mjs
node --test --test-concurrency=1 "test/battle-*.test.mjs" test/mission-fight-service.test.mjs `
  "test/skill-*.test.mjs" test/hero-skill-gates.test.mjs test/gameplay-gateway.test.mjs
npm test
```

证据复核（只读，主仓库路径）：

```powershell
cd F:\projects\FateCovenantClone
node tools/extract-battle-tables.mjs analysis/scratchpad/time-temple-20261108/project --types=FightTable.Prompt --rows
node tools/extract-battle-tables.mjs analysis/scratchpad/time-temple-20261108/project --types=FightTable.Buff --rows
```

## 测试统计与日志

日志目录 `analysis/test-runs/gameplay-20261106/`（主仓库）。

| 日志 | 范围 | 结果 |
| --- | --- | --- |
| `core-battle-c-report.log` | 四份战报专项 | tests 22、pass 22、fail 0、skipped 0 |
| `core-battle-c-regression.log` | battle-*/mission-fight/skill-*/hero-skill-gates/gameplay-gateway | tests 156、pass 156、fail 0、skipped 0 |
| `core-battle-c-full.log` | `npm test` 全量 | tests 2516、pass 2514、fail 0、skipped 2 |

## 证据缺口

- 客户端观感未验收：103 图标增减、层数飘字、107 回复飘字、死亡清除的实际画面都还没有真机截图；本轮不接触模拟器与 APK。
- 死亡时的 `change_reason=DEAD` 移除在客户端是冗余的：`Fighter:DieClearBuff` 已按 `FightTable.Buff.dead_rm` 自行清理，`RemoveBuff` 对已不存在的 tid 返回 false，不会二次扣层。保留该条目是为了让战报自洽，真实表现待真机确认。
- 1 个状态只有 1 个 tid：同类型不同来源的状态在服务端是分条目的，客户端按 tid 合并层数，二者在跨来源叠层时可能出现层数口径差异，需要真机对照。
- 未覆盖：专有事件的 proto 投影（天极值、召唤、领域、护盾摧毁仍只有引擎内部事件），`pb_fat_attr_sync(116)` 的能量同步仍沿用旧实现。

## APK 未验收声明

本轮只改服务端与测试文档，未构建、未签名、未安装、未启动任何 APK，也未对 `apk/` 目录做任何写操作；`com.jzyx.ps` 隔离包与设备状态保持原样，等后续真机回合统一验收。
