# M1 ONLY_STATE 任务被误判为未完成

日期：2026-11-18（Asia/Shanghai）

分支/worktree：`main` / `F:\projects\FateCovenantClone`

基线提交：`89b410a`

状态：已修复并完成组件/全量测试；部署结果见文末更新

## 现象与触发

家园活动任务 `1085007` 的 `701` 已完成并领取过，但第一次服务端状态仍把它下发为可领。客户端再次点击“领取”时没有后续反应；实际请求为 `11502`。

服务事件记录：

```text
2026-11-17T16:14:18.699Z type=11502 seq=16
exploration_command_rejected code=311 message=Homeland task is not finished
2026-11-17T16:14:19.616Z type=11502 seq=18
exploration_command_rejected code=311 message=Homeland task is not finished
```

客户端日志同时记录 `TaskAwardCommonForm` 点击 `_ctnReceive(领取)`。这与用户看到的“已领取仍显示可领、点击无反应”一致。

## 证据

- `analysis/experiments/launch-20261115/server-data-fixed/events.jsonl`：上述两次 11502/code 311。
- 客户端任务表：`TaskType[1803]` 的 `progress_type` 为 `ONLY_STATE`，`progress_fun=0`。
- 反编译客户端对 `ONLY_STATE` 与 `progress_fun=0` 直接计算进度 1；该任务类型不以“已选英雄/宠物”或战斗计数作为进度来源。
- 家园任务 `701` 的领取表只决定奖励和领取位，不能反推额外选择条件。

## 根因

服务端把 `TaskType 1803` 当成有额外业务条件的任务：

- 家园要求先选 `selected_hero_tid`；
- 宠物挑战要求先选 `selected_pet_tid`；
- 神器试炼要求 `daily.counters.trial_fights` 增加。

这些来源都不是 `1803 ONLY_STATE` 的进度函数。服务端第一次领取校验因此失败或生成错误的登录投影；领取位和持久化本身没有问题，重新请求才碰巧通过或表现为“点击无反应”。

## 修复

- `personal-server/game/exploration-act-service.mjs`：家园 `1803` 进度固定为状态 1，宠物挑战 `1803` 同步修正。
- `personal-server/game/artifact-draw-act-service.mjs`：神器试炼 `1803` 固定为状态 1，不再读取 `trial_fights`。
- 保留原有领取位、事务、资源发放和重复领取 code 310 校验；没有放宽未知任务类型。
- 全局搜索确认服务端 `1803` 判断只剩这三处，均属于同一修复范围。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 家园组件 | 未选择家园英雄时领取 701；首次发奖；再次领取 code 310；关闭并重开 SQLite 后仍 code 310 | 通过 |
| 宠物组件 | 未选择宠物时可领取同一 ONLY_STATE 任务，之后仍可正常选择宠物 | 通过 |
| 神器组件 | 将试炼计数强制归零后仍可领取 ONLY_STATE 任务，重领不重复发奖 | 通过 |
| 定向测试 | 探索活动 14/14；神器活动 19/19 | 通过 |
| 全量测试 | `npm test --prefix personal-server` | 532 pass / 0 fail / 2 skipped |
| 部署/客户端 | 真实任务领取和第二次请求 | 提交重启后执行并补入结果 |

## 防复发

- 后续实现任务时先按任务 `type` 读取 `progress_type`/`progress_fun`，不能按任务名称或活动模块猜条件。
- `ONLY_STATE + progress_fun=0` 必须返回状态 1，并只用领取位判断是否已领取。
- 同类修复必须审计全部 `1803` 调用点；测试至少覆盖“未执行额外选择/计数仍可领”、首次发奖、重复领取和重开库。
- 上述规则已加入 `BUG-MEMORY.md`。

## 未验证项与边界

- 还没有逐条审计全部 `ONLY_STATE` 任务家族；本次只处理已由证据确认的服务端 `1803` 三处。
- 如果其他活动出现 `progress_type=ONLY_STATE`，应按同一方法核对，不应直接复用 `1803` 的业务含义。
