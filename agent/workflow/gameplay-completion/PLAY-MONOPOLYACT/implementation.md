# PLAY-MONOPOLYACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（107802、107804 已补齐；107806 仍明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 107801-107811

## 状态键

monopoly:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

go 依据 Ver.base_use_item/high_use_item 计费（每日 free_item 免费用尽后扣费），骰子 1-6 推进行走索引并登记事件；LiveTask/TotolTask 领取、fight_help 次数、jump_fight 消耗 jump_item、finish_firm 次数上限均落库。107802 按事件 uid/tid/param 找到已登记事件，校验 EventType.must_finish，发放 Event.award，按 score_double、next_multiple 计算真实积分并置 finish_stage=2。107804 对 task_type=0 使用本角色累计 score 与 target_count 比较；其他任务使用 task_count，其中 custom_login 统计从 state.guild_count_stats[1006] 的维度 total 读取，普通任务走 task-service 的 TaskType/Task 进度。模块 92 登录回包现在同时携带 act_role_data、guild_data 和 guild_count_statics_send。

## 证据缺口

107806 补给明确拒绝：补给由其他角色创建，本单角色服没有可验证的生产方。单角色本地服把 guild_data.score 视作公会总分，属于本地服假设，需与原服多角色样本对照。事件与格子的完整随机链仍未做 APK 实测。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
