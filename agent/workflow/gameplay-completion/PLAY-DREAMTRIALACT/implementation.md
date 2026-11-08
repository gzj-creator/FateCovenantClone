# PLAY-DREAMTRIALACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（只读）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 108001 query_rob
- 108002 guild_info

## 状态键

dream:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

query_rob 查询本服其他角色的梦境数据行；guild_info 返回 Monster 表 boss 列表与本人存储数据。

## 证据缺口

单角色服无对手与公会，排行与战报为空是真实状态；boss 血量衰减未建模。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
