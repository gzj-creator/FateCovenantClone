# BATTLE-BOSS-RANK 实施记录

日期：2026-11-08
分支：`task/BATTLE-BOSS-20261108`（基于 main `8ebd5a1`）
工作树：`.worktree/gameplay-20261106/a1-boss-rank`

## 依据

- 任务卡：`docs/plans/remaining-gameplay-20261106/01-battle.md`（FAMEHALL 11、WORLDBOSS 5、PITLORD 4）。
- 客户端命令编码证据（LuaJIT 字节码，位于 `analysis/scratchpad/time-temple-20261108/project/`）：
  - `FameHallCmd.lua.bin`：91101/91102/91103/91104 为 `EncodePB`，其余为 `EncodeErl`。
  - `WorldBossCmd.lua.bin`：91801–91804 为 `EncodeErl`，91805 为 `EncodePB(pb_world_boss_achieve_reward_req)`。
  - `PitLordCmd.lua.bin`：92801–92804 全部为 `EncodeErl`。
- 表数据：`FameHallTable.data.lua.bin`、`WorldBossTable.data.lua.bin`、`PitLordTable.data.lua.bin`。使用 `tools/dump-table-prototypes.mjs` 转成 prototype dump（`personal-server/assets/tables/*.data.lua.json.gz`），再由既有 `readGeneratedTables` 解释，未手抄/猜测行值。
- 复用：`rank_entries` SQLite 权威榜（`game/rank-service.mjs` 同表同排序口径）、`grantResources`、`reward_claims`、模块 50 `pb_artifact_info`（圣器所有权）。

## 改动

### BATTLE-PITLORD（92801–92804）

- 新增 `config/pit-lord-tables.mjs`、`game/pit-lord-service.mjs` 与表资产。
- `recordDamage()` 写入 `rank_entries`（内部 rank 命名空间 990001，scope `pit-lord:<day>`，按伤害降序）；`snapshot()` 生成历史榜快照 `pit_lord_history`。
- 92802 返回 `pb_pit_lord_history_rank_list`，榜单来自快照/真实伤害行。
- 92801/92803 按 `Rank.rank_group + rank_range` 选奖，`reward_claims('pit_lord_rank_award')` 幂等；92803 对已结束未发奖结算补发，重复补发 fail closed。
- 92804 按 `Const.free_award` 发免费奖，按日一次（`pit_lord_state.freeAwardDay`）。

### BATTLE-WORLDBOSS（91801–91805）

- 新增 `config/world-boss-tables.mjs`、`game/world-boss-service.mjs` 与表资产。
- `recordDamage()` 写入 `world_boss_daily`；累计伤害达到当前 BOSS `base_hp` 时写 `world_boss_kills`（真实击杀记录，不伪造）。
- 91801 返回 `pb_world_boss_server`，HP 由真实 BOSS 配置与当日累计伤害计算；91802 仅更新会话 map 状态。
- 91803 必须有 `world_boss_kills` 行才发 `Kill.relation_boss` 对应奖励，`reward_claims('world_boss_kill')` 幂等。
- 91804 返回各 BOSS 的真实伤害累计榜（`pb_world_boss_history_rank`）。
- 91805 按 `Achievement.damage` 校验累计伤害，`reward_claims('world_boss_achievement')` 幂等。

### BATTLE-FAMEHALL（91101–91111）

- 新增 `config/fame-hall-tables.mjs`、`game/fame-hall-service.mjs` 与表资产。
- 91109 返回持久化 `pb_fame_hall_role`；91110 持久化 `client_show`（无回包）。
- 91101 校验 `Difficulty` 并进入难度；91102 选择掉落（无可用选项时 fail closed）；91106 跳过；91107 终止；状态落 `fame_hall_state`。
- 91103/91111 按 `EndPassAward.stage <= max_stage` 发奖，`reward_claims('fame_hall_stage')` 幂等。
- 91104 必须命中模块 50 `pb_artifact_info.artifact_list`（权威圣器状态），再持久化 fame hall 队伍圣器位。
- 91105 重置（受 `Const.day_reset_times` 限制）；91108 每日扫码奖励 `Difficulty.sweep_award`，按日幂等。

### 网关

- 增量新增三段派发（`fameHall` / `worldBoss` / `pitLord`），保留所有既有派发块与登录同步；未新增任何登录模块号，因为无数字模块槽位证据。

## 测试

- 新增 `test/boss-rank-services.test.mjs`，7 项全部通过：
  - PitLord 真实榜/快照/发奖/免费奖/重开持久化；缺失榜 fail closed；PB 编码失败与 SQLite 写失败整笔回滚。
  - WorldBoss 进入/离开/真实伤害与击杀/历史榜/杀奖/成就/重开；调度或击杀记录缺失 fail closed；编码失败回滚。
  - FameHall 数据/进入/选择/跳过/终止/阶段奖/圣器编辑/扫荡/重开；模块 50 缺失 fail closed；编码失败与 SQLite 写失败回滚。
  - 真实临时 loopback TCP：909103 登录后依次 92802、92804。
- 命令：`node --test --test-concurrency=1 test/boss-rank-services.test.mjs` → 7 pass / 0 fail。
- 回归：`node --test --test-concurrency=1 test/gameplay-gateway.test.mjs` → 7 pass / 0 fail。
- 日志（主仓库）：
  - `analysis/test-runs/gameplay-20261106/a1-boss-rank-services.log`
  - `analysis/test-runs/gameplay-20261106/a1-boss-rank-gateway-regression.log`

## Fail closed 与缺口

- WorldBoss 当前 BOSS 调度：`open_date` 语义（开服日窗口）未从客户端完整还原；未显式部署 `bossTid` 且当日无唯一匹配时返回 code 5（`World boss current-boss configuration is missing for this period`）。
- WorldBoss 击杀奖励档位（Kill 102/103/104）具体名次规则未确认；当前取 relation_boss 下最小 tid（最高档），已在代码注释登记。
- WorldBoss 攻击/挑战命令不在本卡范围，伤害来源由 `recordDamage()` 暴露给后续战斗块；没有伤害记录时不发击杀奖。
- PitLord 挑战/进度奖不在本卡范围；排名由 `recordDamage()` 注入真实伤害，未发任何固定结果。
- PitLord 的 RankTable 正式 rank_id 未取到证据，内部使用 990001 命名空间（只在 rank_entries 内，不下发 rank_id）。
- FameHall 掉落候选来源（DevDropHero/Artifact/Badge 与 Difficulty.fight 920xxxx 战斗引导表的映射）未还原：进入难度先落 pending 状态，无候选时 91102 fail closed，不伪造掉落。
- FameHall 敌方阵容 `FightTable.def_team` 为空、无部署注入时不得伪造；本块未接战斗，只保留状态闭环。
- FameHall 扫荡冷却与重置费用表（ResetType.stage 语义）未完全确认；当前重置使用日次数上限，扫荡按日一次并发放 Difficulty.sweep_award。
- 未操作 APK/模拟器/ADB，未起停实时服务，未读写 `runtime.local-only.data`；APK 未验收。

## 复现

```powershell
cd .worktree/gameplay-20261106/a1-boss-rank/personal-server
node --test --test-concurrency=1 test/boss-rank-services.test.mjs
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs
```
