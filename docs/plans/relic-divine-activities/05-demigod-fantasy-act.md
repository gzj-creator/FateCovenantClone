# M5：DemigodActCmd 与 FantasyEquipActCmd

## 目标

实现 `98301–98308` 和 `88922/88924/88927–88932`，把日弹珠、大奖弹珠、心愿、投票、试炼、穿戴、祝福、复制和抽卡任务提取成共享服务。两个活动只能有薄适配层，不能维护两套语义不一致的逻辑。

## 独占文件

建议新增：

- `personal-server/game/fantasy-act-shared-service.mjs`
- `personal-server/game/demigod-act-service.mjs`
- `personal-server/game/fantasy-equip-act-service.mjs`
- `personal-server/test/demigod-act-service.test.mjs`
- `personal-server/test/fantasy-equip-act-service.test.mjs`
- 必要时 `personal-server/test/fantasy-act-shared-service.test.mjs`

依赖 M1、M2、M3。不得修改 `gateway.mjs`；不得直接覆盖模块 518 第 0 块。

## 命令映射

### 神灵降世

| 命令 | 请求 | 响应 |
|---|---|---|
| `98301 req_demigod_get_day_marbles_award` | ETF | `pb_res_to_client` |
| `98302 req_get_big_marbles_award` | ETF | `pb_res_to_client` |
| `98303 req_demigod_act_trial_award` | `pb_demigod_act_receive_trial_req` | `pb_res_to_client` |
| `98304 req_demigod_act_trial_wear` | `pb_demigod_act_wear_equip_req` | `pb_demigod_act_wear_back` |
| `98305 req_demigod_act_trial_bless` | `pb_demigod_act_wear_bless_req` | `pb_demigod_act_wear_bless_back` |
| `98306 req_demigod_act_trial_copy` | ETF | `pb_demigod_act_trial` |
| `98307 req_demigod_act_draw_award` | ETF | `pb_demigod_act_draw_award_back` |
| `98308 req_demigod_act_choose_wish` | ETF | ETF fallback |

### 幻武活动

| 命令 | 请求 | 响应 |
|---|---|---|
| `88922 req_get_day_marbles_award` | ETF | `pb_res_to_client` |
| `88924 req_fantasy_draw_set_wish` | ETF | ETF fallback |
| `88927 req_fantasy_act_vote_award` | ETF | `pb_res_to_client` |
| `88928 req_fantasy_act_trial_award` | `pb_fantasy_act_receive_trial_req` | `pb_res_to_client` |
| `88929 req_fantasy_act_trial_wear` | `pb_fantasy_act_wear_equip_req` | `pb_fantasy_act_wear_back` |
| `88930 req_fantasy_act_trial_bless` | `pb_fantasy_act_wear_bless_req` | `pb_fantasy_act_wear_bless_back` |
| `88931 req_fantasy_act_trial_copy` | ETF | `pb_fantasy_equip_act_trial` |
| `88932 req_fantasy_act_draw_task` | `pb_fantasy_act_task_reward_req` | `pb_fantasy_act_task_reward_rev` |

## 共享服务边界

共享层负责：

- 活动实例/版本和用户状态键
- 日刷新时间戳、次数上限、奖励领取位
- 日弹珠和大奖弹珠规则
- 心愿候选/已选/命中/保底
- 试炼关卡、幻武穿戴、祝福位置、复制引用和伤害状态
- 抽卡累计映射到活动任务
- 资源/库存同事务的奖励发放

适配层只提供：

- 命令到共享函数的映射
- 两个活动不同的 Proto 包装
- 活动表 ID 和状态容器
- 对外推送事件

## 关键规则

- 活动窗口、版本和用户参与状态服务端校验。
- 每日状态按服务器时区和刷新时间计算，不能只看客户端时间。
- 日上限/终身上限分别持久化；重复领取要么幂等返回已领，要么明确拒绝。
- 981/889 的 ETF 参数先通过真实客户端/bytecode 证据确认，不得固定把一个数组元素当唯一字段。
- 试炼穿戴和祝福必须引用 M1 中真实存在且未被占用的装备；穿戴后不能在普通 876xx 中无提示复用。
- 复制是服务端同事务生成新库存实例；不能复制 UID、不能产生两个相同 UID。
- 试炼/祝福结果更新活动试炼结构，同时保留普通编队/模块 518 已有块。
- 抽卡奖励只能消费 M3 已提交的累计事件，不能让客户端另报抽数。
- 心愿选择去重、候选校验和重启恢复。

## 测试门槛

两个活动分别验证：

- 每条命令正常 PB 回包。
- 空/非法活动 tid、挑战、任务、装备 uid/tid、心愿 tid、数组和多参数 ETF。
- 客户端伪造次数、奖励、成本、伤害、复制源、任务进度。
- 资源不足、raw/装备不足、活动未开放和版本错误时全回滚。
- 每日边界、`last_refresh`、重复领取、终身上限。
- 日弹珠和大奖弹珠达到上限。
- 穿戴替换/清除、祝福槽、跨活动引用、复制 UID。
- 抽卡任务进度和领奖幂等。
- 同时请求相同活动时数据库串行、不重复发奖。
- SQLite 编码/写入异常回滚和重启持久化。
- 两个模块共享代码后的行为一致性；相同输入除活动差异外结果一致。

## 完成标准

- 16 个命令有实现和测试，没有空壳。
- 两个活动的重叠逻辑只有一套权威实现。
- 交接列出活动容器 ID、块顺序、每日刷新字段、共享函数签名和真实证据。
