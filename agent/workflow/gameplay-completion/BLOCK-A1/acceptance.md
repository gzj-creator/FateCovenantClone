# 块 A1 验收记录（2026-11-08）

范围：#1–#17，战斗 PVE、战报与共享 CORE 收尾，共 17 张任务卡 / 72 条缺失命令。用户要求本块 1 小时内完成并做统一验收，本记录为一次性验收结论。

## 合入分支

| 分支 | 最终 HEAD | 合入 main | 内容 |
| --- | --- | --- | --- |
| task/BATTLE-BOSS-20261108 | c107b6f | 7ab8b81 | FameHall 91101–91111、WorldBoss 91801–91805、PitLord 92801–92804（20 条） |
| task/BATTLE-CORE-20261108 | bdc3a8d | c19e8dd | 211/212 通关记录与点赞、90601–90603 CommonMap、89602–89604 StarMission（9 条，205/89601 fail closed） |
| task/BATTLE-DUNGEON-20261108 | 2e44581 | bd650ba | RedCliff 55001–55004、TowerDefense 97601–97605、SoulTrial 87104/87105、ScarletTrial 89101/89102、CampTower 93601–93603、DestinyPve 104701/104702（18 条，104701 fail closed） |

合并前每支均通过：工作树干净、main 为祖先、git diff --check 无输出、无删除主线文件。合并时主线有另一 session 的未提交改动（draw activities / BLOCK-F），均先 stash 保全、合并后原样恢复，未覆盖或清理对方改动；其中空文件 tools/extract-shipped-table.mjs 与本次合入同名，已移至 analysis/tmp/extract-shipped-table.empty-20261108.mjs。

## 任务卡状态

| # | 任务卡 | 状态 | 说明 |
| ---: | --- | --- | --- |
| 1 | BATTLE-FIGHT | fail closed | 205 share_report 无回包与分享语义证据，明确拒绝 |
| 2 | BATTLE-REPORT | 服务端完成 | 211 真实记录、212 点赞校验与幂等，落 SQLite |
| 3 | BATTLE-PEAKTOWER | 服务端完成（既有） | 本批回归覆盖，未改动 |
| 4 | BATTLE-RANK | 服务端完成（既有） | 本批回归覆盖，未改动 |
| 5 | BATTLE-REDCLIFF | 服务端完成 | 55001–55004，真实结算与领取位 |
| 6 | BATTLE-GENERALDUNGEON | 服务端完成（既有） | 本批回归覆盖，未改动 |
| 7 | BATTLE-ELITEMISSION | 服务端完成（既有） | 201/207 回归通过 |
| 8 | BATTLE-SOULTRIAL | 服务端完成 | 87104/87105 抽取奖与每日免费次数 |
| 9 | BATTLE-SCARLETTRIAL | 服务端完成 | 89101/89102 任务奖与石头选择 |
| 10 | BATTLE-STARMISSION | 服务端完成（89601 除外） | 89602 章节奖、89603/89604 技能分配与重置；89601 参数证据不足 fail closed |
| 11 | BATTLE-COMMONMAP | 服务端完成 | 90601–90603，节点触发与扫荡走真实 simulateBattle |
| 12 | BATTLE-FAMEHALL | 服务端完成 | 91101–91111，91104 复用 module 50 圣器权威状态 |
| 13 | BATTLE-WORLDBOSS | 服务端完成 | 91801–91805，地图进入离开、杀奖、历史榜、成就 |
| 14 | BATTLE-PITLORD | 服务端完成 | 92801–92804，排名奖/补发/免费奖幂等 |
| 15 | BATTLE-CAMPTOWER | 服务端完成 | 93601–93603，含首通列表 |
| 16 | BATTLE-TOWERDEFENSE | 服务端完成 | 97601–97605 驻守/结算/奖励 |
| 17 | BATTLE-DESTINYPVE | 部分交付 | 104702 层信息可用；104701 回包 schema 与 def_team 缺失，fail closed |

## 统一验收证据

- 合并后主线全量：npm test，tests 2594 / pass 2592 / fail 0 / cancelled 0 / skipped 2 / todo 0，日志 analysis/test-runs/gameplay-20261106/block-a1-acceptance-full.log。
- 合并后定向回归 main-after-a1-core-boss-focused.log：39/39（老板组 7 + 核心组 20 + 网关/M5/登录回看 12）。
- 各分支专项：boss-rank-services 7/7；battle-core 52/52；dungeon 专项 26/26 + 邻接 19/19。
- 所有分支测试均使用临时 SQLite 与临时 loopback TCP，未触碰运行数据库与实时服务。

## fail closed 清单

- 205 share_report、89601 star_mission_award、104701 destiny_pve_fight（无回包 schema / 无 def_team）。
- WorldBoss 无唯一 BOSS 调度时返回 5；FameHall 掉落候选缺失时返回 5；RedCliff 非整轮通关不复位；SoulTrial 超每日免费次数拒付；TowerDefense 承伤结算未实现。

## 剩余缺口（不阻塞本批交付）

- CommonMapTable / StarMissionTable 未入库时生产环境相关命令返回 5，放入 assets/tables 即启用。
- 各玩法战斗接缝尚未被 201/207 通用派发实际调用；ScarletTrial 活动窗口、CampTower TypeOpenDays、DestinyPve 阵容快照未接。
- 全部命令无 APK 验收：未启停实时服务、未操作模拟器/ADB、未生成 APK。

## 与看板的关系

execution-status.md 当前被另一 session 修改中，本记录先独立保存；待其提交后由总控把 A1 行状态并入看板并更新计数。

