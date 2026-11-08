# PLAY-DIAMONDVEINACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成（含明确拒绝）。服务端命令已路由到 personal-server/game/minigame-act-service.mjs，权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 109001-109009

## 状态键

diamond:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

get_map/enter_map（行动力校验）、award（按 energy_plaque_time/num/max 累积行动力）、buy_attack（101500 x100 换 5 攻击令，日限）、guild_focus、公会排行/战报/公会数据只读均实现。

## 证据缺口

109005 购买行动力公式未取证，明确拒绝；地图建筑与公会归属未建模，map 数据只返回本人状态。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
