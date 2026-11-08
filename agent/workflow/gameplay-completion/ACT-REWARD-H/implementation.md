# 块 H：节日、签到、限时目标与协作活动（#180–#211）

2026-11-08。范围：docs/plans/remaining-gameplay-20261106/15-three-work-blocks.md 的 H 块，32 张任务卡、94 条缺失命令。

## 交付物

- `personal-server/game/act-reward-service.mjs`：统一的节日/签到/限时活动服务，按 type 派发 94 条命令。
- `personal-server/config/act-activity-tables.mjs`：活动表读取器（27 个客户端表族）。
- `tools/extract-act-tables.mjs`：从客户端 Lua 项目包重建上述表的原型 dump，可复现。
- `personal-server/assets/tables/<Table>.data.lua.json.gz`：27 份生成的表资产（随代码提交）。
- `personal-server/game/gateway.mjs`：新增服务实例、ETF 解码与 `act_reward_committed` / `act_reward_rejected` 派发。
- `personal-server/test/act-reward-service.test.mjs`：9 项专项测试。

## 状态模型

- 领取位复用 `activity_claims`，period 为 `v<version>` 或 `v<version>:d<day>`；重复领取返回 310。
- 各活动的进度、选择与计数器存 `act_reward_state`（role_id, act_id, module, version, data JSON），首次访问幂等建表。
- 活动解析：`ActFrameTable.Act` 或 `ActivityTable.Activity` 行给出 version；窗口由 `activityWindow` 计算，未开始返回 309；`all-open` 模式跳过窗口判定。
- 奖励来自客户端表字段，经 `grantResources` 发放；消耗经 `consumeResources`，余额不足 301，整笔事务回滚。

## 已实现真实业务（表驱动 + 权威状态）

| 卡 | type | 说明 |
| --- | --- | --- |
| ACT-SIGNACT | 37009 | SignActTable.SignAct 按 version+day 取奖励，日序校验，记录领取位 |
| ACT-LOGINREWARDACT | 90301 | LoginRewardActTable.Award 按 belong_act 与活动第 N 天取奖 |
| ACT-COMMONSIGN | 101501 | CommonSignTable.CommonSign 按版本排序解锁第 N 天 |
| ACT-FESTIVALSIGNACT | 99801 | FestivalSignActTable 按版本顺序解锁 |
| ACT-HEROSIGNACT | 110501 | HeroSignActTable.Award 按 version/day 解锁 |
| ACT-COLLECTEXCHANGEACT | 100001 | CollectExchangeAward 的 sub/add 与 limit |
| ACT-PREHEATACT | 101001/101002 | 预热按 PreheatAct 的 cost_tid/cost_num 扣费并发放 board award，divide_sec 间隔与 max_draw_cnt 上限；奖励板按 Award 的 version 与 available_sec 解锁，领取位去重 |
| ACT-CHRISTMASACT | 98610–98613 | 装扮消耗与上限、装扮奖、许愿选择、商店消耗钻石 |
| ACT-SPRINGFESTIVALACT | 99601–99603 | 春节版同上 |
| ACT-QIXIACT | 104401/104402 | 折扣选择按充值档记录、日签按 QiXiSign.day |
| ACT-VALENTINEDAYACT | 100501/100502 | 奖励领取与聊天进度保存 |
| ACT-QUESTIONACT | 103001–103003 | 题目归属校验、每日奖励、累计档奖励 |
| ACT-VOTEACT | 102901–102905/102907 | 投票扣 cost_item、进度/任务档按本地票数、竞猜保存、中奖名单 |
| ACT-FIRECRACKERACT | 106201/106202/106204 | 本地爆竹计数、使用消耗与奖励、累计档门槛 |
| ACT-ONESREWARD | 105101 | 一次性奖励 |
| ACT-CHOICESTORY | 105601 | 分支剧情奖励领取 |
| ACT-QUESTIONNAIRE | 110901 | 问卷完成记录与配置奖励 |
| ACT-ENJOYBLESSINGACT | 110701 | 按 Rebate 档位发放 back_item |
| ACT-ANNIVERSARYGAMEACT | 104403 | 按小游戏 type 取 Award 档 |
| ACT-ROLEBACK | 105301/105308 | 绑定奖励与每日资源 |
| ACT-OPENSERVERSPRINT | 79101/79102 | SprintTask 领奖与完成玩家列表 |
| ACT-ANNIVERSARYBANQUETACT | 118002 | 进度档奖励按 process_value 门槛 |
| ACT-SUMMERACT | 103711/104104/104112 | 进入记录、PVP 竞猜保存、赛季历史读接口 |
| ACT-FIVEDAYBOSSACT | 104603 | 本地排行读接口（单角色，无对手） |

## 明确 fail closed（返回 code 5，不给固定值）

79103、99401/99402、100101、102906、104601/104602、106203、106205、118001、105201/105202/105250/105251、105303/105305/105307，以及夏日活动依赖 PVP 匹配、关卡结算、水枪水珠养成与阶段进度的 30 条命令（103701–103710、103712、103813–103815、103801–103804、103901/103902、104101–104103、104105–104111、104113）。共同阻塞点是 CORE-EVENTS/统计进度源与跨角色聚合，属块外依赖。

## 验证

- 专项：`node --test test/act-reward-service.test.mjs`，9/9 通过（领取、重复 310、超期拒绝、重开数据库保持、参数非法不改状态、fail closed、ETF 类型集合、预热消耗与间隔闸门、预热奖励板解锁与版本校验）。
- 回归：`test/gameplay-gateway.test.mjs` + `test/m5-command-matrix.test.mjs` 全部通过。
- 覆盖：块内 94 条命令全部有路由；92 条走真实业务与状态，41 条按任务卡分组 fail closed，无 `LOCAL_NOT_IMPLEMENTED` 残留。

## 已知缺口

- `*_bin` 领取位按 proto3 打包 repeated uint32（字段 1）编码；客户端位图布局未与抓包对照，属推断。
- 预热表的连接方式为推断：PreheatAct 以 `act_id % 1000` 取 board（150001→1、150005→5），Award 以 `<version><1000><index>` 编码（1001101 = v1 index 101），`available_sec` 视为自活动开始需要经过的秒数。三处都未与抓包或客户端脚本逐条对照。
- 未接入登录模块 92 的活动条目同步，命令以请求携带的 act_id 解析活动。
- 全部命令未做 APK 验收。
