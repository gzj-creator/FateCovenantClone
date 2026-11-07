# PAY-DRAGONLANDACT：龙岛日奖、试炼奖与公会数据

分支 `task/PAY-DRAGONLANDACT-20261108`。范围只包含 `DragonLandActCmd` 的 107701、107702、107703。服务端实现、临时 TCP 与 SQLite 验证已完成；真实隔离客户端（APK）尚未验收。

## 逐 type 状态

| type | 命令 | 状态 | 实现要点 |
| ---: | --- | --- | --- |
| 107701 | `req_dragon_land_daily_award` | 服务端完成，待 APK 验收 | 读取 `DragonLandAct.award_day`，按活动自然日记录领取位，资源、`pending_rewards`、登录模块 92 与回包同事务提交 |
| 107702 | `req_dragon_land_trial_award` | 服务端完成，待 APK 验收 | 按 `BossAward` 配置的 `level`/`hp_per` 档位校验公会 BOSS 进度，领取位写入 `boss_award_list`，同样事务提交 |
| 107703 | `req_dragon_land_guild_data` | 服务端完成，待 APK 验收 | 用配置的 BOSS 等级/ID 与本地 `dragon_land_guild_state`、`dragon_land_contribution` 真实行替换原来的空包 |

## 配置依据

配置来自客户端 LuaJIT 字节码重建的 `DragonLandActTable`，由 `tools/extract-dragon-land-table.mjs` 生成，读取器为 `personal-server/config/dragon-land-tables.mjs`。

| 文件 | 大小 | SHA256 |
| --- | ---: | --- |
| `personal-server/assets/tables/DragonLandActTable.data.lua.json.gz` | 4288 | `68dadd7b04798a2848299274e5a49509e5bd2b84a3e7ff82a0bdfd1c361e3e11` |
| `tools/extract-dragon-land-table.mjs` | — | `59502298d281abde6dfb1bbd278935dc4d6ff0b211a379f6acbb1c814a8dacfc` |
| `personal-server/config/dragon-land-tables.mjs` | — | `6b1da6adc8915c43297917672c2d24fa7e4d66c9abf1b5c96e9bfdf7ea1a1d77` |

子表行数固定为 Piece 46、GetWay 6、Bubble 9、Damage 16、Const 1、DragonLandAct 3、BossAward 240、Boss 60，行数不一致时读取器直接报错。

活动实例来自 `ActFrameTable.Act` 中 `type` 为 1036/1037/1044/1045/1046 的八行（`lua_module=DragonLandActMgr`，`lua_entity=DragonLandActData`）：1036001(1 期,v1)、1036002(2 期,v1)、1036003(3 期,v1)、1036004(4 期,v2)、1036005(5 期,v2)、1036006(6 期,v3)、1036007(7 期,v3)、1036008(8 期,v3)。窗口按 `refer_day`/`refer_start_time` 18000（05:00）→ `duration_day` 9 或 14 天、`end_time` 17400 计算，与 `activityWindow` 其它活动一致。

奖励事实：`DragonLandAct.award_day` 三个版本均为 `[[21002,100],[901900,300],[20002,5],[201500,50000],[414002,10],[101500,50]]`；`fight_tid` 13010001，`restore_num` 1、`restore_limit` 10；`Const` 行为 `task_num` 100、`task_reward_num` 1、`day_limit` 20。`BossAward` 每个版本 80 行 = 20 个 BOSS 等级 × `hp_per` 75/50/25/0 四档，例如 v1 等级 1 为 10101/10102/10103/10104。`Boss` 每版本 20 行，v1 等级 1 = tid 1，hp 3000。

## 服务实现

`personal-server/game/dragon-land-act-service.mjs`，由 `gateway.mjs` 构造并在登录阶段同步模块 92。

角色状态 `dragon_land_role_state(role_id, act_id, ...)` 保存 `piece`、`seize_score`、`daily_award_day`、`boss_award_list_json`、`challenge_times`、`last_challenge_time`、`max_damage`、`way_list_json`，与 `pb_dragon_land_role_data` 字段一一对应。公会状态 `dragon_land_guild_state(guild_id, act_id, ...)` 保存 BOSS `level`/`boss_id`/`lost_hp`/`piece`；贡献行 `dragon_land_contribution(guild_id, act_id, role_id, way_tid, day_index, ...)` 保存按来源与日索引聚合的鳞片与伤害。三张表在服务内 `CREATE TABLE IF NOT EXISTS` 幂等创建，未改 `storage/game-store.mjs` 的迁移版本。

107701：解析 `activity_id` → 校验是龙岛活动行且活动在窗口内（否则 309）→ 读取该版本 `award_day`（缺配置 5）→ 以 `dayZero` 08:00 重置计算活动第 N 天 → 当日已领则回空 `res.changes` 的空成功包（客户端点完即清行），否则 `partitionGrantableResources`/`grantResources` 发奖、把无 handler 的资源写入 `pending_rewards`、写入 `daily_award_day`、刷新模块 92 中该活动的 `module_login_data`，全部在同一 `store.transaction` 内并在此事务中完成 PB 编码。

107702：`id_list` 去重校验后逐条要求是当前版本的 `BossAward` 行；公会进度从 `dragon_land_guild_state` 读取，剩余血量百分比沿用客户端 `DragonLandActData:GetBossHpPercent` 的 `ceil((hp-lost)/hp*100)`，`level` 小于当前等级视为已通关、等于当前等级要求百分比不高于该行 `hp_per`。已领档位跳过，全部已领则回空包；否则发放并追加 `boss_award_list`，与登录刷新同事务。

107703：公会来自模块 24（`pb_res_guild_login`）；`version`/`boss_id`/`level` 来自配置与 `dragon_land_guild_state`（无行时取该版本最小等级 BOSS），`lost_hp` 来自持久化进度，`piece_list` 按 `rid` 聚合真实贡献行，`display_list` 汇总当日各来源。无公会回 5，活动未运行回 309。

公会 BOSS 进度只有 `recordBossDamage({ actId, guildId, damage, roleId, wayTid, piece })` 一个写入口：单次结算只作用于当前 BOSS，打满即推进到下一等级并清零，不会溢出到下一个 BOSS。

## 复现命令

```powershell
cd personal-server
node --test --test-concurrency=1 test/dragon-land-service.test.mjs
node --test --test-concurrency=1 test/dragon-land-gateway.test.mjs
```

## 证据

- 专项服务（`test/dragon-land-service.test.mjs`，8 项）：日奖首次发放与配置 `award_day` 一致、同日重复为空包、次日重新可领、跨 SQLite 重开仍防重；未知/非龙岛/停用活动 1/1/309；试炼档位 75 未达成 311、达标后只发本档、批量混合已领档位只发新档、击杀后开 `hp_per` 0 档并推进等级、下一 BOSS 档位仍锁定；公会数据空态与真实贡献、次日 `display_list` 清零、重开保持；无公会 5。
- 临时 TCP（`test/dragon-land-gateway.test.mjs`）：真实 `verify` 握手与 909103 登录后，模块 92 中 1036001 条目 `module_login_data` 为 ETF 二进制包裹的 `pb_dragon_land_role_data`；107703 回真实 `version/level/boss_id`；未结算战斗时 107702 回 311，结算 900 伤害后回 `[[101500,10]]`；107701 回 6 项奖励并置 `daily_award=true`，重复请求为空包；关闭并重开 SQLite 后重新登录，重复 107701/107702 均为空包，107703 仍回 `lost_hp=900`、`piece=6`。
- 事务回滚：同一文件用故意抛错的 `codec.pack('pb_dragon_land_daily_award_rsp')` 与服务内编码验证编码失败整笔回滚（资源不变、无状态行）；用 `BEFORE INSERT ON dragon_land_role_state` 的 `RAISE(ABORT)` 触发器验证 SQLite 写入失败时资源同样回滚。
- 回归：`test/gameplay-gateway.test.mjs`、`test/login-business-reads.test.mjs`、`test/help-up-act.test.mjs` 全通过（18 项），登录模块 92 的既有活动条目未受影响。

## 未验收与缺口

- APK 未验收：未启停实时服务、未操作模拟器/ADB、未生成 APK。真实客户端打开龙岛界面、点击日奖/试炼奖、观察红点与领奖后的界面刷新仍未验证，不能据此认为可玩。
- 龙岛战斗命令（`pb_dragon_land_fight_req/rsp`）未路由，`recordBossDamage` 目前没有生产调用方。因此新号在没有战斗来源时试炼奖全部按 311 拒绝，符合 fail-closed，但“挑战会真正产生伤害与鳞片”的闭环仍缺失。
- 日奖周期存在证据缺口：`pb_dragon_land_role_data` 只有单个 `daily_award` 布尔位，客户端 `CheckDailyAwardGot` 依赖基类 `GetLastUpdatePassDay`（未提取到实现），无法证明原始服务是否每日重置。本实现按活动自然日重置，并在服务端每日回写；若后续取得原服证据需复核。
- 107703 的多成员聚合口径：本地只有单角色真实数据，其它公会成员的 BOSS 伤害与贡献没有生产来源，`piece_list` 只包含真实存在的本地行，不做跨玩家推算。
- 客户端 `IsTrialAwardCanReceived` 的完整判定顺序（`CheckBossDefeated` 的调用语义）未逐条反汇编确认；本实现以配置档位 + 剩余血量百分比为权威规则。
- 挑战次数恢复（`restore_num`/`restore_limit`）、鳞片来源（`GetWay`）、Bubble/Damage 表未接入，因为没有已路由的挑战入口。
