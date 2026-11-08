# PLAY-TILESWAP 实现记录（BLOCK-G2，2026-11-08）

状态：已完成。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 102501 req_tile_swap_next_turn

## 状态键

tile_swap:<version>（minigame_act_state 主键中的 act_key）。

## 已实现规则

按 Turn 表顺序轮转 cur_turn，并把每轮 group 追加进 group_list；ETF 请求无参数。

## 证据缺口

棋盘消除结果由客户端计算，服务端只维护轮次与组列表。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
