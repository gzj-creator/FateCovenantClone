# M2 子 agent 任务

工作目录：`F:\projects\FateCovenantClone\.worktree\relic-divine-activities`

完整阅读：`AGENTS.md`、`docs/plans/relic-divine-activities/02-fantasy-equipment.md`、`orchestrator-prompt.md`，以及 M1 的 `personal-server/game/fantasy-equipment-inventory.mjs` 和测试。禁止 reset/checkout/stash/clean。M1 已完成，专项 10/10。

只修改：

- `personal-server/game/fantasy-equipment-service.mjs`
- `personal-server/game/fantasy-draw-service.mjs`
- `personal-server/test/fantasy-equipment-service.test.mjs`（新建）
- `personal-server/test/fantasy-draw-service.test.mjs`

禁止修改 `gateway.mjs`、`config/game-tables.mjs`、M1 inventory、登录/推送及 M3–M5 文件。

## 必须先落盘实现

实现全部 16 条命令：87601、87603–87611、87613–87618，不允许空壳或静默成功。直接编辑现有服务，不要只写分析。

核心规则：

- 87601/87603/87611/87613：`hero_tid` 只按英雄 TID 匹配；校验装备、可上阵、专属英雄、品质；跨英雄替换同时清除原持有人并更新编队；重复穿戴稳定；一键编队全有或全无；`custom_attr type 4` PB 往返。
- 87604 祝福：主装备品质/星解锁槽位；材料不得为主装备、已穿戴、已被祝福或重复；支持 `composite_req` 先同事务一键合成再参与；`equips/changed_hero/res/over_value` 完整。
- 87605 突破：服务端表成本，资源不足回滚，边界拒绝。
- 87606 升级：材料配置价值/经验，上限边界，非法数量拒绝。
- 87607 普通升星：普通使用 `FantasyStarUp`；专属 q50/SP 走 `FantasySpStarUp` 或专表；不能把专属/SP 当普通材料；按计划读取 `need_mat` 档位和 `need_cost * value(need_mat)`，允许免费；所有提交材料都消费，`over_value = submittedValue - requiredValue`，每个超量价值点通过同事务创建 `1100119`；满星拒绝并转 87609。
- 87609 品质升级：只有当前行 `is_max_star` 才能执行；目标 `next_quality_item` 决定新 quality；`star=0/star_node=0`；材料与超额补偿同上。
- 87608/87616 SP/觉醒：`GetStarUpChipNum` 规则、`ur_cost_num`、晶片 `ItemTable.Chip(point_item)`、`node_num-star_node` 逐步推进、`stone_tid/stone_num`、`sp_god_stone_tid/sp_god_stone_num`、`FantasyStarStoneTid` 成本；客户端 `times=0` 视为一次服务端推进；`cost_list` 仅作一致性校验。
- 87615 SP 品质升级：服务端权威成本，`cost_list` 不一致拒绝，不得直接信任客户端。
- 87610 晶片合成：ETF 可能多个 tid；按 `Chip.need_num` 校验 raw，一次消耗 need_num 生成一个成品；批内任一失败整体回滚；最后 raw 行为零删除。
- 87617/87618 保留已有行为并审计：心愿累计/解锁/候选/去重/持久化；购买商品 `FantasyDrawNormal#1`、钻石 `101500`、券 `808002`、日限 10、终身 70、跨日刷新；不要重写回退。
- 所有资源、英雄、编队、库存、模块状态必须同一 `store.transaction()`，异常完整回滚。服务端决定成本、数量、奖励、材料价值；客户端 `cost_list/reward/over_value/times` 不信任。

## 测试

测试文件必须覆盖每条命令正常 PB 回包及：空/未知 ID、uid/tid 不一致、错误 hero UID 冒充 TID、伪造数量/cost_list/times/quality/star、资源或 raw 不足回滚、普通/专属/SP 三条升星路径、满星/升级边界、免费升星、`over_value=1100119` 入库、祝福内合成/槽位/重复/穿戴锁定、晶片 need_num 合成/批量回滚/删除最后 raw、穿戴替换/跨英雄/重复/卸下/错配/编队同步、心愿与购买上限/跨日/重启、重复/并发、SQLite/编码异常回滚、518 第 0/1/2 块互不覆盖。

运行：

```powershell
cd personal-server
node --check game/fantasy-equipment-service.mjs
node --check game/fantasy-draw-service.mjs
node --test test/fantasy-equipment-service.test.mjs
node --test test/fantasy-draw-service.test.mjs
npm test
git diff --check
```

只有在文件真正落盘、专项测试通过后结束。最终报告列改动、每命令 schema/错误码、测试实数、假设和 M6 接线。不要 commit/push/merge，不操作设备。
