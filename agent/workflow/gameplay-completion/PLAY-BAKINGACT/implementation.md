# PLAY-BAKINGACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 111001-111015

## 状态键

baking:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

等级奖励、制作蛋糕（体力消耗 + cake_weight_list 权重）、使用道具、作弊道具、酵母点击、取数据、一键整理、批量模式均落库；体力按 recover_time/recover_num 恢复。

## 证据缺口

111002 swap、111003/111004 合成、111006 放弃订单、111011 事件、111012 提交订单、111013 刷新限时订单因棋盘/订单链未取证而明确拒绝。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
