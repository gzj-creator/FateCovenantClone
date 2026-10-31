# 法阵／魔导时阵服务端实现

状态：服务端可证子集已实现并通过组件、真实登录 ETF、临时 SQLite 重开与临时 TCP 验证。分支：`feature/system-battle-array-20261031`。APK、游戏画面、正式服务部署和在线状态尚未验收。

## 系统对应与证据

- 客户端 module 157 名称为“魔导时阵”，项目路径 `project/magic_circle`，管理器 `MagicCircleMgr`。用户所称“法阵”按此系统实现。
- 登录负载为 `pb_magic_circle_role`，捕获到的 module 157 外层是一槽 Erlang list，槽内为 protobuf bytes。
- 命令：90401 升星、90402 升级、90403 突破、90404 激活点位、90405 重置。90401/90403/90405 使用 ETF 单 id；90402/90404 使用 protobuf。
- 响应为 `pb_magic_circle_rsp`，包含权威 `magic_circles` 和 `res_change`。
- 配置来自 `MagicCircleTable.data.lua.bin`：5 个法阵，等级 0–80，星级/突破 0–8，点位 1–4。等级行按 `法阵id * 1000 + 等级`，点位行按 `点索引 * 1000 + 当前等级 point_level`。

## 已实现规则

- 登录初始化 5 个法阵，缺省等级/星级/突破/点位为 0/0/0/空，写入 module 157 并随 SQLite 登录模块持久化。
- 升级一次只提升一级。普通点击发送的 deprecated `target_level` 接受 0 或 1；多级长按语义未证实，显式返回错误 1。费用为下一等级 `cost_num` 个 332002。等级达到 `(break_level + 1) * 10` 后继续升级需先突破。
- 突破费用取 `BreakLevel[法阵id * 1000 + 下一突破]` 的 `cost`，要求等级达到同一 10 级门槛；最高 8 次。
- 升星费用取 `Star[法阵id * 1000 + 下一星级]` 的 `cost`；最高 8 星。
- 激活点位支持一次提交 1 个或多个未激活点。费用按当前等级 `point_level` 查询 `PointLevel`，本次请求整体扣费并整体提交；重复点返回 310，非法点返回 1，材料不足返回 301。
- 重置清空点位并写入 `last_reset_time`，按配置执行 259200 秒冷却；冷却未到返回 311。`res_change` 为空，不返还未证实比例的资源。
- 所有变更在单个 SQLite 事务内完成，响应 protobuf 编码失败会回滚资源和 module 157。重复升级/升星/突破会因状态上限或突破门槛失败，重复激活点返回 310，均不会二次扣费。

## 实现文件

- `personal-server/config/magic-circle-tables.mjs`：直接从证据中的 LuaJIT 配置字节码解析并校验 5/405/40/40/32 行。
- `personal-server/game/magic-circle-service.mjs`：登录规范化、五个命令、资源事务、错误码和响应编码。
- `personal-server/game/gateway.mjs`：module 157 登录初始化及 90401–90405 路由。
- `personal-server/config/hero-tables.mjs`：复用表格解释器读取内存 LuaJIT dump，供法阵配置使用。
- `personal-server/test/magic-circle-service.test.mjs`：服务、登录 ETF、SQLite 重开、回滚和防重。
- `personal-server/test/magic-circle-gateway.test.mjs`：真实握手、登录和临时 TCP 五命令路由。

## 验证

```powershell
node --test test/magic-circle-service.test.mjs
node --test test/magic-circle-gateway.test.mjs
npm test
```

- 法阵服务专项：9/9 通过。
- 临时 TCP 专项：1/1 通过，确认 90401–90405 不落入 `LOCAL_NOT_IMPLEMENTED`，90406 仍显式拒绝。
- worktree 全量：306/306 通过（基线 295，新增加 11 项法阵测试）。
- 真实登录 ETF 已反向解码确认 module 157 为 5 条法阵状态；SQLite 关闭重开后等级与资源一致。

## 未覆盖与限制

- 未计算或应用任何战斗属性/技能加成；服务端只持久化开发状态、扣资源和回包。
- 未校验 `unlock_point`/解锁任务条件；当前由客户端入口控制，服务端没有可用的本解锁状态证据。
- 重置返还比例、按激活时等级退还的历史费用没有证据，因此当前明确不返还。
- 多级升级、满级后额外突破、跨配置迁移和未知命令均不伪造成功。
- 本轮未部署正式服务、未操作 ADB/模拟器/APK、未修改运行中 SQLite；没有 APK 或视觉验收结论。
