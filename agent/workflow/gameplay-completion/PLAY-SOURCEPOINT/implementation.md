# PLAY-SOURCEPOINT 实现记录（BLOCK-G2，2026-11-08）

状态：明确拒绝。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 110101 change
- 110102 combine
- 110103 task_award

## 状态键

source_point（minigame_act_state 主键中的 act_key）。

## 已实现规则

三条命令均路由到服务并返回 code 5 与缺口说明：源点实例挂在英雄上、升级链与试炼任务计数均未在本服务建模。

## 证据缺口

无任何伪造结果；需要英雄源点实例模型后才能实现。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
