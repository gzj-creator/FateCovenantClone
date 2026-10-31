# M6：登录容器、网关和推送集成

## 目标

把 M1–M5 的服务接入真实登录数据和请求路由，保持模块顺序/二进制块兼容，并实现相关推送。本模块必须串行，不能和其他 agent 同时修改共享集成文件。

## 独占文件

允许修改：

- `personal-server/game/gateway.mjs`
- `personal-server/config/game-tables.mjs`
- `personal-server/test/gameplay-gateway.test.mjs`
- 新增 `personal-server/test/relic-divine-gateway.test.mjs`
- 登录容器注册/状态模块所需的新共享文件

依赖 M1–M5 全部返回接口契约。开始前重新读取全部模块文档和实现交接，不能只根据计划猜测字段。

## 请求解码

- 按协议目录为所有 `876xx`、`101801–101806`、`98301–98308`、`88922/88924/88927–88932` 建立 request schema 表。
- `pb_draw_hero`、重复消息、`pb_fantasy_equip_id`、`pb_fantasy_equip_raw`、嵌套 `composite_req` 和二进制 `bytes` 必须正确 unpack。
- ETF 只在目录明确标注 `etf` 时解包。实际数组长度、嵌套列表和 fallback 语义必须由 schema/字节码证据确认。
- 空 payload、错误 schema、重复字段和超长列表返回业务错误，不让异常冒泡成进程崩溃。
- `supports()` 冲突要有明确优先级；`87614` ETF fallback 与普通 feature/rank 路由不能抢占同一命令。

## 登录状态

实际登录模块容器仍待静态证据确认。M6 必须用客户端登录字节码、`static-schemas.json` 和实际解包模块建立映射，并记录证据。需要包含：

- 活动入场数据
- 心愿状态
- 商城状态
- 任务与进度
- 试炼状态
- 日弹珠和大奖弹珠
- 抽卡累计、保底和轮次
- 活动倒计时/开放状态

实现要求：

- 模块顺序固定；新增模块不能替换已有模块。
- 模块 `518` 第 0 块 `pb_fantasy_equip_res`、第 1 块 `pb_fantasy_formation_list`、第 2 块 `pb_fantasy_draw` 必须逐块保留。
- 容器内 binary block 用 append/resize，不能因为某个活动没有数据就删除其它块。
- 登录 payload 与 SQLite 状态一致；重启后相同。
- 客户端缺失容器时按空状态初始化，损坏容器要拒绝并记录，不静默覆盖。

## 推送

- `7001 rev_fantasy_draw_update` → `pb_fantasy_equip_act_draw`
- `9160 rev_demigod_act_draw_update` → `pb_demigod_act_draw_back`
- `10101 rev_fantasy_draw_normal_update` → `pb_fantasy_draw`

推送由事务提交后的同一服务入口触发，payload 来自已提交状态；不得使用客户端请求里的奖励或进展。发送失败要记录日志，不能回滚已提交数据库，但客户端可通过重登录恢复。

## 测试门槛

- 每类新增命令从真实 bytes 解包并 pack 回包的往返测试。
- 空 payload、错误 schema、嵌套列表/ETf fallback。
- 登录模块数量、顺序、binary block 完整性。
- 活动空状态初始化、已存状态恢复、损坏 block 拒绝。
- 模块 518 三块与新增活动块互不覆盖。
- 提交后推送 payload 正确，事务失败不推送。
- 断开/发送异常不导致服务崩溃。
- `npm test` 全量通过。

## 完成标准

- 所有已实现业务由真实网关路由可调用，且有 response envelope。
- 登录 payload 可以让三类活动读到完整状态。
- 推送有测试和日志，明确哪些情况由登录补偿。
