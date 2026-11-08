# PLAY-HOMELAND 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 110904-110913

## 状态键

homeland:1（minigame_act_state 主键中的 act_key）。

## 已实现规则

拜访/点赞（like_award 每日去重，day_support_time 上限）、升级（Level.cost_item 扣费 + prosperity_num）、打扫、家具替换落库；熟悉的人/拜访记录返回本人存储。

## 证据缺口

110904 任务奖励明确拒绝：任务计数未取证。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
