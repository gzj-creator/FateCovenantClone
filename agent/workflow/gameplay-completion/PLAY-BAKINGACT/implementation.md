# PLAY-BAKINGACT 实现记录（BLOCK-G2，2026-11-08）

状态：服务端完成。2026-11-08 残余项把 111002、111003、111004、111006、111011、111012、111013 补成表驱动实现，并扩展 111001、111005 的棋盘/订单边界；权威状态落在 SQLite 的 minigame_act_state / minigame_act_claims / minigame_act_records 三张表，资源消耗与发放走 game/resources.mjs。

## 命令

- 111001-111015

## 状态键

baking:<act_id>（minigame_act_state 主键中的 act_key）。

## 已实现规则

等级奖励、制作蛋糕（体力消耗 + cake_weight_list/cake_lv_weight_list 权重）、使用道具、作弊道具、酵母点击、取数据、一键整理、批量模式均落库；体力按 recover_time/recover_num 恢复。新增棋盘交换、相邻同蛋糕同等级合成为高一级、批量合成按低等级优先并返回每步棋盘、放弃订单按 abandon_item 扣费、提交订单按 Order.cake_list 匹配并发放 add_score/award、限时订单按 order_weight_list 强制时效组刷新、事件格按 SpecialEvent.award1/award2 发放并移除格子。

## 证据缺口

棋盘坐标、订单权重、蛋糕等级上限和事件奖励均为表驱动推断，尚无原服棋盘/订单回包对照；111014 一键整理沿用既有的固定 7 列排序，未在本轮扩展。

## 验证

- personal-server/test/minigame-act-service.test.mjs 覆盖本卡的正常路径、资源不足/未达阈值、重复领取、坏负载整笔回滚与 SQLite 重开。
- 全量 npm test 记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。

## 未做

- 未做 APK 实测（本块纯服务端改动，按项目规则不生成新 APK 快照，不启停实时服务）。
