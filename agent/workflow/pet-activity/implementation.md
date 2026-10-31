# 超凡魔灵活动、专属商城与现世礼包

更新时间：2026-10-31（Asia/Shanghai）

状态：组件测试与临时真实 TCP 网关测试通过；尚未部署到实时服务，未做 APK/用户视觉验收。

## 用户反馈与根因

- 新超凡魔灵的 `83028` 活动仍在界面中，但魔灵之契活动时间已经结束；活动入口、专属商城、礼包和购买能力没有使用同一时间状态。
- 现世礼包通过 `16005 req_buy_or_rev_gift` 购买。旧钱包只处理普通礼包 `RechargeTable.type=46`，`type=76` 的免费和资源礼包会落到“需要额外玩法处理”。
- 钱包礼包通过原生 `16004 req_recharge_by_token` 进入。旧路由把第三个 ETF 参数始终视为代金券，玩家选择正常钱包支付并传 `0` 时无法购买。
- `85901` 只回显请求中的礼包 ID，没有检查 `83028` 是否运行或该礼包是否属于当前 `GiftShop`，因此会向客户端暴露过期活动内容。

## 配置与开服日历

- 配置文件：`personal-server/config/activity-calendar.json`。
- `serverOpenedAt`：开服时间，支持 ISO 时间或 Unix 秒/毫秒时间戳。
- `mode`：`all-open` 保留全部已有活动并选择测试钓鱼版本；`schedule` 按开服日、`join_server_day` / `server_day_limit`、服务器开服时间区间和活动表时间窗口过滤。
- `currentFishingActivityId`：`all-open` 下用于测试的钓鱼活动版本，当前为 `1074011`。
- 当前阶段配置为 `all-open`，满足测试时需要所有活动开启。切回正式排期只改 `mode: "schedule"`，无需改业务代码。
- 同一日历对象同时过滤 `module 92`、钓鱼活动、超凡魔灵活动、商城和礼包，避免不同入口各自判断时间。

## 协议与配置映射

| 入口 | 协议/表 | 实现 |
|---|---|---|
| 活动登录 | module 92 `pb_act_login` | 并行组保留原组，`module_login_data` 写 ETF 包装的 `pb_pet_act_begin` |
| 魔灵玩家数据 | module 83 `pb_pet_act_player_list` | 当前活动 `83028`、宠物 `500313`、伤口 `98/99/100/97` 和礼包限购信息 |
| 专属商城读取 | 1202 `req_shops_info` | 仅活动运行时返回 `5070005` 的 11 件商品 |
| 专属商城购买 | 1201 `pb_req_buy_shop_item` | 扣货币 `6861900`、发奖、限购、请求幂等 |
| 免费/资源礼包 | 16005 | `GiftShop[28]` 白名单；`pay_type=2` 免费，`pay_type=1` 扣 `cost_item × price × buy_num` |
| 钱包礼包 | 16004 | 第三 ETF 参数为 `0` 时走本机余额；正数仍按显式代金券支付 |
| 推荐礼包状态 | 85901 | 只返回当前运行活动及 `GiftShop[28]` 内的礼包，并返回持久化购买次数 |

礼包为：`730400, 730402, 730403, 730404, 730405, 730406, 730407, 730401, 730408`。

商城商品不能只按货币或 `507` 前缀截取：同一货币下存在多期商品。实现按奖励为 `500313` 的锚点取出当前 11 件商品 `5070143001-5070153001`。

## 持久化与幂等

- SQLite schema v7 持久化开服时间，v8 新增 `activity_purchases`，按角色、活动、商城/礼包、商品和请求 ID 记录数量。
- 礼包限购读取 `activity_purchases`；16005 响应和 16004 推送 `1900` 的 `flag=65` 都携带最新 `pb_recharge_limit_info`。
- 相同连接与序号重试复用原订单，不重复扣款或发奖。JSON 存储会把 Buffer 转为 `{type:"Buffer",data":[...]}`，重放前已恢复为 Buffer，避免 protobuf 编码失败。
- 关闭活动后：登录响应没有 `module 83` 和 `83028`；1202 返回空商城组；16005/16004 拒绝；85901 不返回该活动礼包。

## 验证

通过：

```powershell
cd personal-server
node --test test/activity-calendar-config.test.mjs test/activity-calendar.test.mjs test/pet-activity.test.mjs test/welfare-service.test.mjs test/recommend-gift-count.test.mjs test/gameplay-gateway.test.mjs
node --test test/activity-read-service.test.mjs test/hero-progression.test.mjs test/task-service.test.mjs
```

`test/pet-activity.test.mjs` 使用临时 SQLite 和真实本地 TCP 握手覆盖：

- 登录同时下发 module 92 与 module 83，商城为 11 件商品。
- 免费礼包、资源礼包、钱包礼包购买和限购。
- 16005 相同请求重放不重复发奖，且 Buffer 响应可以重新编码。
- 1201 扣款、发奖、重复请求、重查购买数。
- 85901 过滤非当前活动商品并返回购买次数。
- 活动关闭后四条路径同步关闭。
- SQLite 重开后礼包和商城购买次数保持。

全量 `npm test` 中活动相关新增/回归测试通过。当前基线仍有 11 项代金券面值旧断言（测试期望 1 分/张，分支运行配置为 1 元/张）；这些失败与本轮活动改动无关。

## 证据入口

- `analysis/tmp/activity-decompiled/PetActivityTable.data.lua.json`
- `analysis/tmp/activity-decompiled/ShopTable.data.lua.json`
- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/16274460334534785000-PetActivityMgr.lua.bin`
- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/14856839158516700000-PetActivityCmd.lua.bin`
- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/9308603914844770000-ShopMgr.lua.bin`

## 未完成边界

- 魔灵抽取、挑战、治疗、养成和交换业务没有在本轮冻结规则；本轮只保证活动登录、专属商城和现世礼包购买链路。
- 没有启动、停止或重启实时服务，没有点击客户端，也没有修改实时 SQLite。
- 真实 APK 仍需在部署后验证：登录后活动与礼包同时出现、三类礼包购买、限购刷新、活动关闭后入口和内容同时消失。
