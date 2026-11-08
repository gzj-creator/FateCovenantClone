# PLAY-TOWERACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 104301 req_tower_act_step
- 104302 req_tower_act_switch
- 104303 req_tower_act_task

## 状态键

tower:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

step 按 step_cost=800002 与 step_ratio([[800,1],[200,2]]) 计费，落点跨过的 Award 行按 award_group 发奖；switch 依据 TurnChoose.turn_range/group_lib 校验并推进 turn。

## 证据缺口

104303 明确拒绝：爬塔任务读取共享任务计数，该计数未在本服务建模。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
