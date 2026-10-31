# 商城与任务链路修复状态索引

总计划：[docs/10-store-product-flow-remediation-plan.md](../../../docs/10-store-product-flow-remediation-plan.md)

| 任务 | 状态文件 | 当前状态 |
| --- | --- | --- |
| F1 限购售罄 | [F1.md](F1.md) | 主验收通过，已合入 main；待部署 |
| F2 返利领取 | [F2.md](F2.md) | 主验收通过，已集成最新 main 基线；待合入 main 和部署 |
| F3 通行证/战令 | [F3.md](F3.md) | 主验收通过，已合入 main；待部署 |
| F4 表情包宝箱 | [F4.md](F4.md) | 主验收通过，已合入 main；待部署 |
| F5 主线任务奖励 | [F5.md](F5.md) | 主验收通过，已合入 main；待部署 |

状态值统一为：`待开始`、`调查中`、`实现中`、`组件通过`、`临时集成通过`、`主验收中`、`通过`、`阻塞`。子 agent 只更新自己的任务文件；总计划和本索引由主 agent 验收后更新。
