# A1 CORE 剩余项：船舱与技能等级倍率结论（2026-11-08）

分支 `task/A1-CORE-RESIDUAL-20261108`。

## CORE-CABIN：本版证据闭合，只有两条网络命令

- 客户端 bundle 中船舱（module 114，`CampsiteMgr`/`CampsiteCmd`）只注册了 `83201 req_unlock_cell`（ETF `[groupId, cellIndex]`）与 `83202 re_place_hero`（`pb_campsite_place`）。
- 现有 `personal-server/game/cabin-service.mjs` 已覆盖：登录模块 114 重建、解锁第 4 格并扣 101500×1000、上阵/替换/下阵、同批原子换位/移动、按组 camp/profession 校验、批量原子性、编码失败与 SQLite 写入失败回滚。
- 测试：`node --test test/cabin-service.test.mjs test/gameplay-gateway.test.mjs` 本次回归 10 + 1 项全部通过（含真实临时 TCP 83201/83202）。
- 寄存器中其它 832xx 没有客户端调用证据；房间/设施升级、任务、交互、产出、领奖、加速、时间窗口在本版本没有可实现的命令、请求/回包结构、配置表与持久化字段，保持未实现，不伪造命令号。

结论：CORE-CABIN 不算“缺命令来源”，按本版两命令视为证据闭合；剩余部分写成“本版本无入口”。

## AbilityLevel：无每级数值规则，保持缺口

- `HeroTable.AbilityLevel` 只有 55 行 `{ tid, level: [0/1, ...] }`，例如 `3002 -> [1,1,1,1,0,0,0,0,0]`；数组元素是 0/1 解锁标记，不是等级数值。
- `HeroTable.Ability.ability` 只列技能 id，`soul_ability`/`mastery_ability` 也只给 id。
- `config/skill-database.json` 每个技能只有一份固定倍率（如 `multiplier: 1`），没有按技能等级的系数列或函数；未发现 `CalAbilityLvCfgTid` 之后可按级取倍率的表列或可反编译公式。
- 因此 `hero-skill-loadout` 继续把 `level > 0` 当解锁开关，未实现“每级倍率”。任何线性或比例猜测都会把自拟公式写进战斗，按任务要求保留缺口。
- 后续取证方向：定位 `CalAbilityLvCfgTid` 的调用方与技能数值表（若存在 `SkillLevel`/`AbilityDes` 之类的按级列），或取得客户端显示技能面板等级的抓包对照。

## 测试与边界

- 本次未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK。
- 属性汇总的专项回归见同目录 `attributes.md`。

