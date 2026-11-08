# G1 探索与家园前半（#151-#162）实施记录

2026-11-08。分支 task/G1-EXPLORATION-20261108，worktree .worktree/gameplay-20261108/g1-exploration。

## 交付范围

98 条静态 C2S 命令全部注册到网关（12 个模块）。请求/响应 schema 直接来自 personal-server/assets/protobuf/*.proto.bin，没有使用固定空包销项：未取得规则的行为 GameError(5, 'Rule is not recovered: <card> <command>') 并以 err=5 回包。

新增：

- personal-server/game/exploration-act-service.mjs：命令注册表、SQLite 权威状态（exploration_act_state）、领取位（复用 reward_claims）、资源事务。
- personal-server/config/exploration-act-tables.mjs：读取 11 张活动表。
- tools/extract-exploration-tables.mjs：从客户端 Lua bundle 恢复表数据（行族由 LazyInit 的 <Name>_Count 常量发现），产物写入 personal-server/assets/tables/。
- 网关接线：gateway.mjs 在 protobuf/ETF 分发前优先处理 G1 命令。
- test/exploration-act-service.test.mjs：7 项测试，含真实 TCP 握手。

## 已实现（真实状态迁移）

| 卡片 | 命令 | 规则 |
| --- | --- | --- |
| PLAY-EXPERIENCEACT | 93801/93802 | 按 ExperienceActTable.Level.need_time 计时出发；到期按 award 发放，一次性领取位 |
| PLAY-RADISHFARM | 90801-90806 | 格位播种/事件/成熟收获（Activity.finish_sec、award、help_award、day_help_times）；访问与助力仅限本机单一角色；礼包选择按 exchange_award |
| PLAY-HOMEPUZZLEACT | 11408-11420 | 求助/取消、每日上限（SocialConf）、赠送扣碎片与领取 gift_get_award、开包随机碎片、按稀有度分解（DecomposeAward）、任务奖（Task.award）、进度奖（ProgressAward.need_count） |
| PLAY-MINIGAME | 83701-83704 | MiniGameTable 校验游戏；进入/处理回显 custom_bin；已配置的 settle 规则未取得时 fail closed；老虎机重试按 SlotMachine.weight 抽取并扣 retry_n |
| PLAY-GRANDTOURER | 87801 | 每日一次，按 Const.award_item/award_num_range 发放 |

## 仍为证据缺口（回包 err=5）

- PLAY-HOMELANDACT 11501-11505
- PLAY-CARNIVAL 43003-43024
- PLAY-THEMETREASURE 76501-76512
- PLAY-TREASUREHUNT 85601-85610
- PLAY-GRANDTOURER 87802-87805
- PLAY-DREAM 88001-88010
- PLAY-MAGICALJOURNEY 89901-89917
- PLAY-PETACTIVITY 90501-90507（选择/战斗/好感/治疗/活力/兑换规则未恢复）
- PLAY-MINIGAME 中 settle_bin 非 none 的结算

共同缺口：这些模块的登录同步（module 92 / 各自登录模块的 module_login_data）尚未接入，客户端当前只能从命令回包取得最新状态；社交相关命令（家园拼图好友求助/赠礼）在单人私服中只接受本机角色。

## 验证

- node --test test/exploration-act-service.test.mjs：7/7 通过（注册表 98 条、经验/萝卜农场重开持久化、家园拼图重复领取拒绝、小游戏老虎机权重、巡回者每日领取、临时 TCP 握手 83702/83703 成功与 43016 显式 err=5）。
- node --test test/gameplay-gateway.test.mjs：7/7 通过（无回归）。
