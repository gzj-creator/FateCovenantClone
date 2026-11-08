# PLAY-MUSHROOMMONSTER 实现记录（BLOCK-G2，2026-11-08）

状态：已完成。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 102601 req_mushroom_start
- 102602 req_mushroom_end
- 102603 req_mushroom_award

## 状态键

mushroom:1（minigame_act_state 主键中的 act_key）。

## 已实现规则

每日次数 fight_count=3；结束时记录最高分并按 ActAward.need_times 发 678002x300/400；奖励去重。

## 证据缺口

单局分数无表内上限证据，仅校验非负整数；rank_id 固定 0（rank 227 结算未建模）。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
