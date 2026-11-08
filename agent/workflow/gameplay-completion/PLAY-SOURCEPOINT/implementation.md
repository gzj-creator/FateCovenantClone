# PLAY-SOURCEPOINT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成。三条命令已从明确拒绝改为表驱动实现，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 110101 change
- 110102 combine
- 110103 task_award

## 状态键

source_point:1（minigame_act_state 主键中的 act_key）。实例 uid 水位、实例列表和试炼领取位都保存在该状态行。

## 已实现规则

110101 校验每个实例归属与重复分配，从旧英雄移除后写入 hero.source_point_list，并在回包中返回变化英雄和编队；110102 按 Elevate.cost_list 中 type=1 的普通资源和 type=2 的源点本体校验数量，扣除材料、删除实例并生成 target.tid 新实例；110103 按 TaskType/Task 共享进度校验 Trial.target_count，SourcePoint 族奖励回到实例列表，其他奖励走 grantResources，hero_tasks 以同步 ETF BitBlock 写入领取位。

## 证据缺口

实例、成本类型和领取位结构来自 SourcePoint 表与协议字段，尚缺原服操作回包对照；未做 APK 实测。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
