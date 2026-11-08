# 块 A1 验收记录（2026-11-08）

范围：#1–#17，战斗 PVE、战报与共享 CORE 收尾，共 17 张任务卡 / 72 条缺失命令。用户要求本块 1 小时内完成并做统一验收，本记录为一次性验收结论。

## 合入分支

| 分支 | 最终 HEAD | 合入 main | 内容 |
| --- | --- | --- | --- |
| task/BATTLE-BOSS-20261108 | c107b6f | 7ab8b81 | FameHall 91101–91111、WorldBoss 91801–91805、PitLord 92801–92804（20 条） |
| task/BATTLE-CORE-20261108 | bdc3a8d | c19e8dd | 205 空回执、211/212 通关记录与点赞、90601–90603 CommonMap、89602–89604 StarMission（9 条；89601/CommonMap fail closed） |
| task/BATTLE-DUNGEON-20261108 | 2e44581 | bd650ba | RedCliff 55001–55004、TowerDefense 97601–97605、SoulTrial 87104/87105、ScarletTrial 89101/89102、CampTower 93601–93603、DestinyPve 104701/104702（18 条，104701 fail closed） |
| task/A1-TABLES-20261108 | d4924bc | 本轮集成 | 真实 `StarMissionTable` / `CommonMapTable` 装载；StarMission 89602–89604 改走 34 个真实 version，CommonMap 90601–90603 因无地图实例保持 fail closed；schema v18 |
| task/A1-EVIDENCE-20261108 | 43aec9c | 本轮集成 | 205 可达并改空成功回执；89601 无调用点、104701 无真实敌阵，continued fail closed；证据 SHA256 与调用链落档 |
| task/A1-CORE-RESIDUAL-20261108 | 7c08a8c | 本轮集成 | 证伪全队共享装备假设并移除错误接线；Cabin 两命令证据闭合；属性/战力/副本保持原同源且不虚增 |

合并前每支均通过：工作树干净、main 为祖先、git diff --check 无输出、无删除主线文件。合并时主线有另一 session 的未提交改动（draw activities / BLOCK-F），均先 stash 保全、合并后原样恢复，未覆盖或清理对方改动；其中空文件 tools/extract-shipped-table.mjs 与本次合入同名，已移至 analysis/tmp/extract-shipped-table.empty-20261108.mjs。

## 任务卡状态

| # | 任务卡 | 状态 | 说明 |
| ---: | --- | --- | --- |
| 1 | BATTLE-FIGHT | 服务端完成（空回执，不计玩法交付） | 205 share_report 可达，校验正数参数后返回 code 0 空回执；不发奖、不落库 |
| 2 | BATTLE-REPORT | 服务端完成 | 211 真实记录、212 点赞校验与幂等，落 SQLite |
| 3 | BATTLE-PEAKTOWER | 服务端完成（既有） | 本批回归覆盖，未改动 |
| 4 | BATTLE-RANK | 服务端完成（既有） | 本批回归覆盖，未改动 |
| 5 | BATTLE-REDCLIFF | 服务端完成 | 55001–55004，真实结算与领取位 |
| 6 | BATTLE-GENERALDUNGEON | 服务端完成（既有） | 本批回归覆盖，未改动 |
| 7 | BATTLE-ELITEMISSION | 服务端完成（既有） | 201/207 回归通过 |
| 8 | BATTLE-SOULTRIAL | 服务端完成 | 87104/87105 抽取奖与每日免费次数 |
| 9 | BATTLE-SCARLETTRIAL | 服务端完成 | 89101/89102 任务奖与石头选择 |
| 10 | BATTLE-STARMISSION | 服务端完成（89601 除外） | 真实 34 版表、89602 章节奖、89603/89604 技能分配与重置；89601 参数/调用点证据不足 fail closed |
| 11 | BATTLE-COMMONMAP | fail closed | 真实表只有系统定义，无地图实例/坐标；90601–90603 返回 code 5 |
| 12 | BATTLE-FAMEHALL | 服务端完成 | 91101–91111，91104 复用 module 50 圣器权威状态 |
| 13 | BATTLE-WORLDBOSS | 服务端完成 | 91801–91805，地图进入离开、杀奖、历史榜、成就 |
| 14 | BATTLE-PITLORD | 服务端完成 | 92801–92804，排名奖/补发/免费奖幂等 |
| 15 | BATTLE-CAMPTOWER | 服务端完成 | 93601–93603，含首通列表 |
| 16 | BATTLE-TOWERDEFENSE | 服务端完成 | 97601–97605 驻守/结算/奖励 |
| 17 | BATTLE-DESTINYPVE | 部分交付 | 104702 层信息可用；104701 顶层无调用点且真实 def_team 敌阵缺失，fail closed |

## 统一验收证据

- 最终 A1 集成全量：npm test，tests 2689 / pass 2687 / fail 0 / cancelled 0 / skipped 2 / todo 0，duration_ms 442972.0228，日志 `analysis/test-runs/gameplay-20261106/block-a1-residual-final-full.log`。
- A1 最终定向：79/79 通过（装备归属、属性、mission/elite、205/211/212、CommonMap、StarMission、Cabin、gateway）。
- 合并后定向回归 main-after-a1-core-boss-focused.log：39/39（老板组 7 + 核心组 20 + 网关/M5/登录回看 12）。
- 各分支专项：boss-rank-services 7/7；battle-core 52/52；dungeon 专项 26/26 + 邻接 19/19。
- 所有分支测试均使用临时 SQLite 与临时 loopback TCP，未触碰运行数据库与实时服务。

## fail closed 清单

- 89601 star_mission_award、90601–90603 CommonMap（无地图实例）、104701 destiny_pve_fight（顶层无调用点 / 无 def_team）。
- WorldBoss 无唯一 BOSS 调度时返回 5；FameHall 掉落候选缺失时返回 5；RedCliff 非整轮通关不复位；SoulTrial 超每日免费次数拒付；TowerDefense 承伤结算未实现。

## 剩余缺口（不阻塞本批交付）

- CommonMapTable 与 StarMissionTable 已入库；CommonMap 仍缺地图实例与坐标，StarMission 仍缺星级生产写入、登录模块号和租赁英雄/Attr 战斗接线。
- 各玩法战斗接缝尚未被 201/207 通用派发实际调用；ScarletTrial 活动窗口、CampTower TypeOpenDays、DestinyPve 阵容快照未接。
- 全部命令无 APK 验收：未启停实时服务、未操作模拟器/ADB、未生成 APK。

## 2026-11-08 复核与最终集成

- 205 share_report 复核为可达（FightCmd 原型 4 构造 pb_share_report，FightReportForm -> FightReportMgr.ShareReport 调用），Cmd.c2s_back 为空、回调只判 err，已改为 code 0 空回执并补 PB 编解码与临时 TCP 测试。
- 89601 req_star_mission_award 在本版客户端没有调用点（全项目仅 Cmd 与 StarMissionCmd 自身命中），保持 code 5。
- 104701 req_destiny_pve_fight 顶层同样没有调用点；命运回廊实际经 201 携带 stm 子载荷开战，结算解 pb_destiny_pve_fight_rsp，但 FightTable.Fight def_team 为空导致敌阵不可恢复，保持 code 5。详见 evidence/a1-failclosed-evidence.md。
- StarMissionTable 已确认按 activity version 组织；89602–89604 使用真实章节、9/15/24 星档位、技能成本与父技能门槛。89601 仍无调用点/参数证据。
- CommonMapTable 的 `CommonMap` 只有 `init_pb_struct`，`Node` 是节点类而非地图实例；地图网格属于独立 `RequireConfig(mapCfgFullName)`，因此 90601–90603 不再接受旧 fixture 自造坐标和奖励。
- 装备证据表明属性按英雄格位与 `pb_lineup_fighter.equip_ids` 归属；模块 26 实测字段与 `pb_role_equip` 定义冲突。早先“全队共享装备”提交已由 `8ec06ab` 整体撤回，新增 `equipment-attr-scope.test.mjs` 防止阵力、1316 与战斗属性一起虚高。
- 本版 Cabin 只有 83201/83202 两个网络命令，均已实现；任务卡、交互和加速缺口不计作未实现网络命令。
- A1 状态已写入 `execution-status.md` 和 `15-three-work-blocks.md`。CommonMap 与纯空回执按“未知业务/协议确认”不计入玩法实现数。
