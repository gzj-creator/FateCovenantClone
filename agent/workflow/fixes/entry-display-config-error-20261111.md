# 进入游戏双错误弹窗修复（2026-11-11）

## 用户现象与日志证据

用户登录后先看到“仅显示物品不可操作”，随后看到“配置出错了”。
`fate-covenant-realm-2.service` 的日志分别记录了两组可复现原因：

- 登录初始化后客户端连续发送 `107703`，依次读取 `1036001`、`1036002`、`1036003` 和 `1036008`。前三项未开放的活动被 `requestActivity` 以 `code 309 / Dragon land activity is not running` 拒绝；随后 `1036008` 才正常返回。客户端把第一次 `309` 渲染成“仅显示物品不可操作”。
- 客户端随后发送 `10507` 进入消息频道，参数为频道类型 `12`。服务端以 `code 5 / Channel type 12 is not available on the local server` 拒绝，客户端渲染为“配置出错了”。

原始日志副本保存在 `/tmp/fc-realm2-log.jsonl`；关键事件为
`dragon_land_rejected`、`s2c_frame_sent errCode=309`、
`message_command_rejected` 和 `s2c_frame_sent errCode=5`。

## 根因

客户端进入大厅时会遍历缓存的活动行，包括尚未开放的活动。`107703` 是读取接口，关闭活动返回空状态属于正常业务语义；旧实现把运行状态检查放在解析活动之后并直接抛错，导致客户端把探测失败展示成全局操作错误。

`MsgTable.ChannelType` 的 type 12 是非跨服、非聊天频道。客户端在消息初始化时调用 `10507` 请求该频道；旧实现只识别世界、系统和私聊类型，因此拒绝了本服频道。

## 修复边界

- `personal-server/game/dragon-land-act-service.mjs` 将活动解析和运行状态判断拆开。`107703` 读取关闭活动时返回该版本首关的完整零态 `guild_info`，并记录 `dragon_land_guild_data_closed`。
- `107701` 和 `107702` 等领奖写操作仍通过 `requestActivity` 校验活动状态，关闭活动继续返回 `309`，不改变防刷与事务语义。
- `personal-server/game/message-service.mjs` 为 type 12 生成按 realm 分配的本地频道 id。server id 为 1 时是 `11200001`，server id 为 2 时是 `11200002`。
- 跨服频道、公会频道和其余尚未支持的频道类型继续明确拒绝。

## 回归覆盖

- `dragon-land-service.test.mjs`：无公会数据时，关闭活动的 `107703` 仍可返回完整零态；活跃活动缺少公会仍返回 `code 5`；领奖状态校验保持原行为。
- `message-service.test.mjs`：`10507 type 12` 返回本服频道 id、空消息列表，并持久化成员关系。
- `message-gateway.test.mjs`：通过真实临时握手和 ETF 请求验证 type 12 返回 `11200001`，且不再产生协议错误。

目标回归命令：

```bash
node --test --test-concurrency=1 \
  test/dragon-land-service.test.mjs \
  test/message-service.test.mjs \
  test/message-gateway.test.mjs
```

结果：23 项通过，0 失败。

修复重放到当前 `main` 后执行全量 `npm test`：总计 2825 项、pass 2823、fail 0、skipped 2。早先旧工作树曾因 `server.net.proto` 的 LF/CRLF 字节哈希不同而出现两个 server-list 失败；当前 main 上这两项也已通过。

## 验收状态

组件与临时 TCP 回归已完成，尚未重启线上服务、部署或操作客户端。部署后重新登录应不再出现上述两个弹窗；日志应出现三个 `dragon_land_guild_data_closed`，以及 `10507` 成功加入 type 12 本服频道的事件，不再出现对应 `errCode=309` 或 `errCode=5`。
