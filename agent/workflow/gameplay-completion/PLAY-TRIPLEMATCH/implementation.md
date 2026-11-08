# PLAY-TRIPLEMATCH 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 106001
- 106002
- 106003
- 106004
- 106005

## 状态键

triple:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

体力按 Game.recover_time/recover_num 恢复，swap/restart/use_item 消耗与恢复体力；score_award 依据 AccAward.condition 领取并去重。

## 证据缺口

106005 通关进度明确拒绝：关卡进度由客户端棋盘结算上报，未取证。

2026-11-08 残余项复核未改变该结论：106001-106004 正常，106005 仍返回 GameError(5)，没有用客户端自报值销项。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
