# BLOCK-G2 实施记录（2026-11-08）

范围：docs/plans/remaining-gameplay-20261106/15-three-work-blocks.md 的块 G2（#163–#179，17 张卡、96 条命令）。分支 task/BLOCK-G2-20261108，基于 main 8ebd5a1。

## 交付物

- personal-server/game/minigame-act-service.mjs：96 条命令的统一服务，权威状态写入 SQLite（minigame_act_state / minigame_act_claims / minigame_act_records），资源消耗与发放走 game/resources.mjs。
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

- 专项：node --test test/minigame-act-service.test.mjs → 16/16 通过（含资源不足、阈值未达、重复领取、坏负载回滚、SQLite 重开）。
- 全量：npm test → 2560 项，pass 2558，fail 0，skipped 2（日志 analysis/tmp/g2-tables/g2-full-test.log）。
- 未做 APK 实测；本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK。

## 未完成与风险

- 共享任务计数（爬塔任务、庭院任务奖励、家园每日任务、源点试炼、三消通关进度、烘焙事件/订单）未在本服务建模，相关命令明确拒绝。
- 大富翁 Event 与格子表映射、三消棋盘结算、烘焙棋盘与订单链只由客户端持有，服务端不还原结果。
- 蘑菇怪与打地鼠排名结算（rank 227/233）未建模，返回 rank 0。
- 模块 92 登录负载按客户端 Data 类的解析 schema 写入，未做 APK 端实测确认。
