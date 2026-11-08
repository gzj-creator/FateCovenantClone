# PLAY-PUZZLEACT 实现记录（BLOCK-G2，2026-11-08）

状态：已完成。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 102001 req_puzzle_act_finish_task
- 102002 req_puzzle_act_progress_award

## 状态键

puzzle:<Version.tid>（minigame_act_state 主键中的 act_key）。

## 已实现规则

每完成一格按 Version.award x award_cnt(8301900x50) 发放；Progress 表按已格数阈值领取并去重。

## 证据缺口

完成任务未与共享任务计数联动；act_id 按 PuzzleActTable.Version 的 tid 解释。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
