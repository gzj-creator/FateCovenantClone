# PLAY-MONOPOLYACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 107801-107811

## 状态键

monopoly:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

go 依据 Ver.base_use_item/high_use_item 计费（每日 free_item 免费用尽后扣费），骰子 1-6 推进行走索引并登记事件；LiveTask/TotolTask 领取、fight_help 次数、jump_fight 消耗 jump_item、finish_firm 次数上限均落库。

## 证据缺口

107802 事件结算、107804 公会任务、107806 补给因 Event 与格子映射、公会数据未取证而明确拒绝。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
