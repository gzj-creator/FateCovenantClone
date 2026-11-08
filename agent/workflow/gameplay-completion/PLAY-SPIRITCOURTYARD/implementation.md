# PLAY-SPIRITCOURTYARD 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 105001-105016

## 状态键

spirit:1（minigame_act_state 主键中的 act_key）。

## 已实现规则

种植/收取/开垦/移除/换作物/委托刷新/发布与取消/果实合成/刷新数据/亲密度任务/加速道具均落 SQLite；收取按 CropOutput -> CropOutputLib 直接发奖。

## 证据缺口

105005 任务奖励、105008 协助、105009 公会任务、105015 宴会奖励因共享任务计数或公会数据未建模而明确拒绝；亲密度经验来源未取证。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
