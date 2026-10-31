# M4：ArtifactDrawActCmd `101801–101806`

## 目标

实现圣器天池的活动侧接口、状态和持久化，并与 M3 的抽卡累计、M1 的幻武库存、活动任务/轮次/翻牌联动。

## 独占文件

建议新增：

- `personal-server/game/artifact-draw-act-service.mjs`
- `personal-server/test/artifact-draw-act-service.test.mjs`
- 必要时 `personal-server/game/artifact-trial-service.mjs`
- 必要时 `personal-server/game/fragment-flip-service.mjs`

依赖 M3。不得直接修改 `gateway.mjs` 或模块 518 二进制块；通过 M1/M6 接口接入。

## 命令与 Proto

| 命令 | 请求 | 响应 |
|---|---|---|
| `101801 req_artifact_trials_claim_fight_rewards` | `pb_req_artifact_trials_daily_reward_req` | `pb_res_to_client` |
| `101802 req_artifact_draw_task_rewards` | `pb_artifact_draw_task_award_req` | `pb_artifact_draw_task_award_rsp` |
| `101803 req_artifact_fragments_draw` | `pb_artifact_fragments_draw_req` | `pb_artifact_fragments_draw_rsp` |
| `101804 req_artifact_fragments_new_turn` | `pb_artifact_fragments_new_turn_req` | `pb_fragments_draw_info` |
| `101805 req_artifact_fragments_claim` | `pb_artifact_fragments_claim_req` | `pb_artifact_fragments_claim_rsp` |
| `101806 req_artifact_fragments_synthesis` | `pb_artifact_fragments_synthesis_req` | `pb_artifact_fragments_synthesis_rsp` |

## 状态模型

先完成协议/登录证据审计，确认圣器活动的实际模块 ID、二进制块顺序和登录/入场消息。至少持久化：

- `pb_artifact_draw_player`: `act_tid/is_synthesis/daily_time/daily_award_state/period_award_state/recharge_info/fragments_draw_info/fight_record/is_get_supply`
- `pb_artifact_draw_server`: `act_tid/cur_turn/settle_turn[]`
- 抽卡累计、任务进度、心愿、普通保底和全保底（与 M3 共用或明确引用）
- 试炼伤害、每日可领状态、翻牌格子和轮次

不得用未经验证的模块 ID 占位。若客户端容器只能从字节码确定，记录具体证据和解码路径。

## 业务规则

- 活动窗口、版本、用户活动开启和 `act_tid` 必须匹配请求。
- `101801`：校验挑战、任务列表、每日状态；领取一次后幂等；资源与状态同事务。
- `101802`：同时支持每日和周期任务状态；目标、进度、领取位和奖励服务端查表；批量中任一非法则全回滚。
- `101803`：校验 `index`、当前轮、格子是否已翻、剩余次数/消耗；结果由服务端概率决定；多次重复翻同一格拒绝。
- `101804`：只有满足轮次结算条件才能开始新一轮；已结算轮不得重复结算；返回新的 `pb_fragments_draw_info`。
- `101805`：校验本轮已翻结果和可领取状态；奖励只发一次。
- `101806`：校验碎片数量/配方；通过 M1 创建幻武或发放资源；设置 `is_synthesis` 并持久化。
- 圣器试炼和碎片奖励涉及装备时不得直接写模块 518。

## 测试门槛

- 6 个命令正常 PB 回包。
- 空/非法 `act_tid`、挑战 ID、任务 ID、翻牌 index、重复 ID。
- 活动未开放、错误版本、未解锁、客户端伪造奖励/格子结果/抽数。
- 每日刷新和周期状态；跨日边界与重启。
- 批量任务领奖事务回滚；重复领取。
- 翻牌同格重复、轮次未结算、轮次重复结算、奖品只一次。
- 碎片不足、配方错误、装备 UID 并发、库存与资源回滚。
- SQLite/编码异常回滚。
- 模块 518 第 0/1/2 块与活动容器都不丢块。

## 完成标准

- 6 个命令均有业务实现和测试，不留在 `supports` 列表里返回空成功。
- 活动登录状态可序列化、可重启恢复。
- 交接中给出容器 ID、块顺序、请求/响应 schema、表行来源和未确认假设。
