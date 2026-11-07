# ITEM-MISSION 实施记录（2026-11-06）

## 范围与工作区

- worktree：`F:\projects\FateCovenantClone\.worktree\gameplay-20261106\item-mission`
- 分支：`task/ITEM-MISSION-20261106`，基线 `main` `a5300de`
- 计划条目：`docs/plans/remaining-gameplay-20261106/04-items-tasks-shops.md` 的 ITEM-MISSION 小节
- 本次补齐：504 `mission_meal`、505 `mission_energy_exchange`、509 `req_one_key_chapter`、510 `energy_energy_buy`、511 `req_mission_chapter_pass`、512 `req_mission_boss_pass_award`；保留回归 503 `mission_sweep_passed`、506 `req_inner_box_award`、508 `req_mission_custom`。
- 验收级别：组件测试 + 真实 TCP 网关测试通过（临时端口、临时库）；未部署到实时服务、未操作隔离客户端 APK，因此不构成 APK 验收。

## 静态记录 ID 与表证据

读取自 `personal-server/assets/tables/MissionTable.data.lua.json`（经 `config/mission-tables.mjs` 解析）：

| 表 | 关键列 | 本实现用途 |
| --- | --- | --- |
| `MealAward` | `tid`、`award`、`free_time` | 504 免费体力邮件：tid 1 = `[[122702,3]]`、`free_time [12,16]`；tid 2 = 同奖励、`free_time [18,23]` |
| `EnergyConst` | `tid`、`src`、`rate`、`limit`、`max`、`shop_item` | 505/510 体力来源：`100012900 {rate:50, limit:800, max:3000, src:122702, shop_item:2070101001}`；`100022900 {rate:10, limit:100, max:100, src:130402, shop_item:2070301001}` |
| `ShopTable.Item` | `2070101001` | 510 价格阶梯 `[[1,0],[2,30],[3,30],[4,50],[5,80],[6,100]]`、`currency_type 101500`、`item 122702`、`count 1`、`purchase_limit 9` |
| `ShopTable.Item` | `2070301001` | 体力二段商品，`price [[1,100]]`、`purchase_limit 1`、`item 130402` |
| `Chapter` | 350 行，含 `pass_chapter_type` | 511 章节存在性校验 |
| `Boss` | 10 行，`award`、`fight`、`open_chapter`、`open_server_day` | 512 资格与奖励；boss 1 `open_chapter 8`，boss 2..10 `open_chapter 0` + `open_server_day 2..10`，奖励均为 `[[2002,5],[25002,2],[101500,100]]` |

协议（`personal-server/assets/protobuf/mission.*.proto.bin`）：

- `pb_mission_meal_rsp { meal: pb_role_mission_meal, res_change: pb_res_to_client }`；`pb_role_mission_meal { last_refresh_stamp uint32, got_award bytes }`
- `pb_energy_manual_buy_rsp { res: pb_res_to_client, buy: pb_energy_manual_buy{tid,num,time} }`
- `pb_mission_one_key_reward_req { box_tids, common_task_tids }` / `pb_mission_one_key_reward_rsp { common_task, mission, res_change }`
- `pb_res_to_client { changes, is_overflow }`（505/512 回包）
- `pb_mission { mission_id, box_award, pass_count, difficulty, boss_bin, boss_pass_bin }`：`box_award`/`boss_bin` 都是 BitBlock，沿用 506 的 ETF 编码（`bit-block.mjs`）
- 登录模块 8（`MissionMgr`）：slot0 `pb_mission`、slot2 `pb_role_energy_res` 已由存档快照解码确认；slot1/slot3 为空，未在客户端侧确认其语义，本实现不写这两个槽位。

## 设计

新增 `personal-server/game/mission-extra-service.mjs`，构造签名 `{store, codec, missionFight, gameTables, missionTables, now, logger}`，`supports(type)` 覆盖 504/505/509/510/511/512。自建三张表，构造期与每次事务内都执行幂等 `CREATE TABLE IF NOT EXISTS`，不改 `storage/game-store.mjs`、不升 `user_version`：

- `mission_meal_claims(role_id, day_key, meal_tid, claimed_at)`：504 每日每窗口一次
- `mission_energy_exchanges(role_id, day_key, energy_tid, exchange_num, energy_num, updated_at)`：505 当日已兑换体力累计（对应 `EnergyConst.limit`）
- `mission_energy_buys(role_id, day_key, energy_tid, buy_num, updated_at)`：510 当日购买次数（对应 `ShopItem.purchase_limit`）

各命令语义：

- 504：ETF 单参数 = meal tid；空负载按当前小时命中 `free_time` 窗口选最小 tid。校验表行、窗口（服务端本地时区）、当日唯一；发放 `MealAward.award`；回包 `pb_mission_meal_rsp`，`last_refresh_stamp` = 本地零点秒，`got_award` = 当日已领 tid 位图（位索引 = meal tid）。重复领取返回 310，窗口外/未知 tid 返回 5。
- 505：ETF 参数可以是体力 tid（100012900）或源物品 tid（122702），都解析到同一条 `EnergyConst`。消耗 1 个 `src`，增加 `rate` 点体力；`limit` 作为当日兑换体力上限、`max` 作为体力上限。体力不进 `grantResources`（`100012900` 的 Item 类型是 `2900:ItemBase`，没有 item 容器 handler），改为直接写 `resources` 行并同步登录模块 8 slot2 的 `pb_role_energy_res`，因此 503 扫荡仍读到同一份余额。
- 510：ETF 参数可以是体力 tid 或 `shop_item` tid。按当日已购次数取 `ShopItem.price` 阶梯价，扣 `currency_type` 货币（首档价格 0 时免费），发放 `ShopItem.item × count`，写当日购买次数；回包 `pb_energy_manual_buy_rsp{res, buy{tid: 体力 tid, num: 当日次数, time}}`。超过 `purchase_limit` 返回 310，货币不足返回 301。
- 509：protobuf `pb_mission_one_key_reward_req`。`box_tids` 复用 506 的章节箱逻辑（`mission_box` 位图 + `reward_claims`），在**同一事务**内完成；`common_task_tids` 非空时直接以 5 拒绝，不做部分成功。
- 511：ETF 参数可选 chapter tid；完成度由 `mission` 游标推导（章节全部 Section 都在游标之前才算通关），不采信客户端自报。通过后写 `reward_claims(mission_chapter_pass, chapter)`，回包沿用精英关卡 87003 的 ETF 二元组 `[chapterId, alreadyPassed]`（协议无 schema，这是有据的最小结构）。
- 512：ETF 参数 = boss tid。资格链：`Boss` 行存在 → `open_chapter ≤` 已全通章节 → `open_server_day ≤` 服务端开服天数 → `reward_claims(mission_boss_clear, tid)` 存在 → 未领过 `mission_boss_award`。发放 `Boss.award` 并在 `pb_mission.boss_bin` 置位（位索引 = boss tid）。

事务与回滚：所有扣费、发奖、领取位、状态写入都在同一个 `store.transaction`；需要异步 ETF 编码的位图（506/509 章节箱、504 位图、512 boss_bin）在事务外预编码，事务内比对快照（`expectedModule` / 已领列表 / `boss_bin` 原值）不一致即以 1 要求重试，编码或 SQLite 异常整体 ROLLBACK。

网关接入：`gateway.mjs` 只在既有 mission 派发处集中新增 `missionExtra.supports(type)` 分支（位于 508 分支之后、`fight.supports` 之前），服务实例在既有服务装配区创建一次并注入 `now: clock`；未改动 battle-engine、effects、skill-database、fixtures。

## 复现命令

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\item-mission\personal-server
node --test test/item-mission-service.test.mjs
node --test test/mission-fight-service.test.mjs test/gameplay-gateway.test.mjs
npm test
```

## 测试证据（2026-11-06）

- `test/item-mission-service.test.mjs`：10/10 通过。覆盖：504 正常/窗口外/未知 tid/当日重复/跨日重置/重开库防重、504 编码失败回滚、504 SQLite 触发器失败回滚；505 正常（两种 tid 解析）/上限/每日 limit/资源不足/跨日重置/重开库防重、505 事务回滚；510 首档免费、阶梯价、每日 9 次上限、跨日重置、货币不足；509 一键箱与 506 位图一致、重复为空变更、跨重开幂等、`common_task_tids` 拒绝、未知箱与坏负载拒绝、编码失败回滚；511 未通关拒绝、游标推导、只记一次、重开保持；512 无通关记录拒绝、发放一次、重复 310、重开防重、章节未达标拒绝。
- `test/gameplay-gateway.test.mjs`：7/7 通过，其中新增 1 个真实 TCP 用例（握手 + `909103` 登录后依次发送 504/505/511/509 数字 type，校验回包与 310/5 错误码）。
- 全量 `npm test`：2095 项 / 2092 通过 / 3 失败。3 项失败全部是 `test/login-business-reads.test.mjs` 依赖本地证据库 `analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite` 不存在（既有环境问题，基线为 2084/2081/3，本次新增 11 项且未改变该失败集合）。

## APK 与部署边界

- 本次为纯服务端实现，未构建或修改 APK，未更新 `apk/` 快照，不构成 APK 验收。
- 未部署到实时服务、未重启服务、未操作隔离客户端；`SubDownloadFinish=1` 等 APK 前置条件不受影响。
- 新增三张表由服务自建，实时库首次加载新代码时会自动创建；未经部署验证前不要假设实时库已存在这三张表。

## 剩余缺口

- 504：登录模块 8 的 meal 槽位语义未在客户端确认，`pb_role_mission_meal` 仅随 504 回包下发，未写入登录 payload；重登后本餐次状态仍由客户端自行维护，需实测确认。
- 505：`EnergyConst.period`（360/3600）语义未确证，未实现任何冷却或自动恢复；`rate` 按“每个源物品兑换的体力”解释、`limit` 按“当日兑换体力上限”解释，均为表语义推断，需原服对照。
- 509：`common_task_tids`（`pb_common_task.receive_list`）没有本地进度来源，整请求以 5 拒绝；普通任务一键领取仍未实现。
- 510：`pb_energy_manual_buy_rsp.buy.time` 为服务器当前秒；未确认客户端是否要求与每日刷新点对齐。
- 511：协议无响应 schema，回包使用 ETF `[chapterId, alreadyPassed]`（对齐精英关卡 87003）；若客户端期望其他结构，需以抓包校正。
- 512：本地服务没有任何路径能产生 `mission_boss_clear` 记录（201 仍拒绝 `boss_tid`，Boss 战未实现），因此该命令当前对真实玩家始终返回 5“缺少通关记录”，只有在补齐 Boss 战并按真实结算写入该记录后才可领取。
- 503 扫荡与 505/510 共用 `resources` 中的体力行，但登录模块 8 slot2 只在 505 改体力时同步；503 消耗体力后登录快照仍可能偏旧，属既有问题，未在本次修改。
- 未部署、未做真实客户端/APK 联调，以上全部只到组件与临时 TCP 级别。
