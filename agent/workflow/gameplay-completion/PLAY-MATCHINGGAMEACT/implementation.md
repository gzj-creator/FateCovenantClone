# PLAY-MATCHINGGAMEACT 实现记录（BLOCK-G2，2026-11-08）

状态：已完成。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 107501 luck
- 107502 use_card
- 107503 award

## 状态键

matching:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

抽卡从 CardType 按版本取牌，同 type 两张成对结算 Award.score/award；ScoreAward 按 need_score 领取并去重。

## 证据缺口

闪烁卡与大奖次数未取证，big_award_count 固定 0。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
