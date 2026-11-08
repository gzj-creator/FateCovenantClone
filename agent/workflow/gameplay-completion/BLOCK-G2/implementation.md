# BLOCK-G2 实施记录（2026-11-08）

范围：docs/plans/remaining-gameplay-20261106/15-three-work-blocks.md 的块 G2（#163–#179，17 张卡、96 条命令）。分支 task/BLOCK-G2-20261108，基于 main 8ebd5a1。

## 交付物

- personal-server/game/minigame-act-service.mjs：本块 96 条命令中 85 个 type 的统一服务（其余 11 条沿用既有 FISHINGACT 7 条与 HELPUPACT 4 条实现），权威状态写入 SQLite（minigame_act_state / minigame_act_claims / minigame_act_records），资源消耗与发放走 game/resources.mjs。
- personal-server/config/minigame-act-tables.mjs：15 张活动表的加载器，逐表校验行数，缺失或行数变化直接报错。
- personal-server/assets/tables/*.data.lua.json.gz：PuzzleAct、TileSwap、MushroomMonster、BeatGopherAct、TowerAct、SpiritCourtyard、TripleMatch、MatchingGameAct、MonopolyAct、DreamTrialAct、DiamondVeinAct、SourcePoint、Homeland、HomelandAct、BakingAct 共 15 个表资产。
- personal-server/game/gateway.mjs：新增 minigameAct 实例、模块 92 登录同步（塔/打地鼠/三消/对对碰/大富翁/梦境/钻石矿脉/烘焙）与命令派发分支。
- personal-server/test/minigame-act-service.test.mjs：16 项专项测试。
- agent/workflow/gameplay-completion/<CARD>/implementation.md：17 份逐卡记录。

## 状态分布

- 完整实现 6 卡：PLAY-PUZZLEACT、PLAY-TILESWAP、PLAY-MUSHROOMMONSTER、PLAY-GOPHERACT、PLAY-MATCHINGGAMEACT、PLAY-ALBUM。
- 服务端完成但含明确拒绝 8 卡：PLAY-TOWERACT、PLAY-SPIRITCOURTYARD、PLAY-TRIPLEMATCH、PLAY-MONOPOLYACT、PLAY-DREAMTRIALACT（只读）、PLAY-DIAMONDVEINACT、PLAY-HOMELAND、PLAY-BAKINGACT。
- 仅明确拒绝 1 卡：PLAY-SOURCEPOINT（源点实例挂在英雄上，未建模）。
- 回归确认 2 卡：PLAY-FISHINGACT、PLAY-HELPUPACT（本块未改动）。

明确拒绝一律是 GameError(5, 说明)，没有空包、固定结果或伪造进度。

## 验证

- 专项：node --test test/minigame-act-service.test.mjs → 17/17 通过（含资源不足、阈值未达、重复领取、坏负载回滚、SQLite 重开、行级表 dump 互通）。
- 分支内全量：npm test → 2560 项，pass 2558，fail 0，skipped 2（日志 analysis/test-runs/gameplay-20261106/block-g2-branch-full.log）。
- 未做 APK 实测；本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK。

## 合入 main 与跨块兼容

- 合并提交 24f90e9（父 70de346），冲突 personal-server/game/gateway.mjs 与 docs/plans/remaining-gameplay-20261106/execution-status.md 按双方内容并存解决，node --check 通过。
- 合并后在 main@24f90e9 的干净 worktree 复核全量 npm test → 2632 项，pass 2630，fail 0，skipped 2（日志 analysis/test-runs/gameplay-20261106/block-g2-main-24f90e9-full.log）。
- HomelandActTable 由本块以行级 dump（tools/extract-lua-table-rows.mjs，含 Task/Furniture/Const/Version/Happiness/RankUpAward/Module 等族）提交，而块 G1 的 config/exploration-act-tables.mjs 按原型 dump 读取同一文件。已让两种格式互通：config/hero-tables.mjs 的 readGeneratedDump 接受行级 dump，config/minigame-act-tables.mjs 的 readFamily 在缺行级 dump 时回退原型解释器，并新增专项断言。修正后全量 npm test → 2633 项，pass 2631，fail 0，skipped 2（日志 analysis/test-runs/gameplay-20261106/block-g2-main-compat-full.log）。
- 合并前主工作区存在 G1 未跟踪的旧 HomelandActTable 资产（原型 dump，SHA256 6A3D6C08…C2E07），已备份到 analysis/test-runs/gameplay-20261106/homeland-act-g1-prototype-backup.gz（同份副本 analysis/tmp/g2-tables/homeland-act-main-untracked-backup.gz） 并原路径改名为 HomelandActTable.data.lua.json.gz.g1-untracked-backup；如 G1 需要原文件可用该备份覆盖，两种格式现已都能读取。
- 最终合入状态：main 88219ca（含本块 24f90e9 合并与并行块 E1 提交）在干净 worktree 全量 npm test → 2674 项，pass 2672，fail 0，skipped 2（日志 analysis/test-runs/gameplay-20261106/block-g2-main-88219ca-full.log）。

## 未完成与风险（首轮状态，残余项见下节）

- 共享任务计数（爬塔任务、庭院任务奖励、家园每日任务、源点试炼、三消通关进度、烘焙事件/订单）未在本服务建模，相关命令明确拒绝。
- 大富翁 Event 与格子表映射、三消棋盘结算、烘焙棋盘与订单链只由客户端持有，服务端不还原结果。
- 蘑菇怪与打地鼠排名结算（rank 227/233）未建模，返回 rank 0。
- 模块 92 登录负载按客户端 Data 类的解析 schema 写入，未做 APK 端实测确认。

## 残余项补完（2026-11-08）

分支 `task/BLOCK-G2-RESIDUAL-20261108`，worktree `.worktree/gameplay-20261108/g2-residual`，基于 `main@649a903`。首轮留下的 21 条明确拒绝中，本轮把 16 条改成真实表驱动路径：

- PLAY-TOWERACT：104303，按 TaskType/共享 Task 进度校验并写 `got_task_award`。
- PLAY-SPIRITCOURTYARD：105005，按 EntrustOrder/EntrustOrderLib 扣果实并领取委托奖励。
- PLAY-MONOPOLYACT：107802 事件结算、107804 公会任务；登录补 `act_role_data`、`guild_data` 与 `guild_count_statics_send`。
- PLAY-DIAMONDVEINACT：109005，按 Const 行动力购买字段计费并校验上限。
- PLAY-SOURCEPOINT：110101 源点转移、110102 源点合成、110103 试炼领取；`hero_tasks` 使用同步 ETF BitBlock，避免事务内 Promise 被编码成空值。
- PLAY-HOMELAND：110904，逐条校验 HomelandActTable.Task 并发放完成奖励。
- PLAY-BAKINGACT：111002 交换、111003/111004 合成、111006 放弃订单、111011 事件、111012 提交订单、111013 限时订单刷新；111001/111005 同时补了等级奖励和棋盘容量边界。

仍明确拒绝 5 条：105008/105009/105015（单角色公会社交数据）、106005（三消棋盘通关自报未取证）、107806（大富翁补给由其他角色创建）。都返回 `GameError(5, 具体缺口)`。

`personal-server/game/task-service.mjs` 另补了 `progress_fun=66`（英雄最高星级）和 `progress_fun=81`（英雄最高专精突破），供 SourcePoint/同类 TaskType 复用。大富翁 `task_type=0` 用本地累计 score 与 `target_count` 比较；custom_login 统计从 `guild_count_stats[1006]` 的维度 total 读取。单角色服把本地 score 当作公会总分，属于本地部署假设，仍需多角色原服样本对照。

验证：`node --test test/minigame-act-service.test.mjs` 为 34/34 通过；全量 `npm test` 为 2702 项，pass 2692 / fail 8 / skipped 2。8 个失败全部是 `main@649a903` 已有的 schema 断言（测试期望 `user_version=16`，代码已是 17），与本轮小游戏文件无关；日志见 `analysis/test-runs/gameplay-20261106/g2-residual-20261108.log`。本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK，未生成 APK 快照。
