# 块 I 礼包/活动命令：按 schema 解码请求并校正拒绝依据

2026-11-11。分支 `fix/up-star-gift-20261111`，worktree `.worktree/up-star-gift-20261111`，基于 main `f1fed77`。
这是独立升星修复（[up-star-gift-20261111.md](up-star-gift-20261111.md)）的同类问题收尾：同一批
`benefit-commerce-service.mjs` 拒绝家族里，**请求编码与真实客户端不一致**的部分。
本轮没有启停服务、没有写运行库、没有操作客户端/ADB/APK。

## 问题

块 I 派发对 53 张卡统一用 `etfArgument` 解包。`agent/workflow/interface-catalog/tcp-commands.md`
里标为 protobuf 的命令，真实客户端发的是 protobuf，网关会在进入拒绝分支之前先抛
`Invalid benefit payload`（code 1），于是：

- 玩家侧看到的是通用参数错误，而不是家族级失败；
- 日志只有 `benefit_command_rejected` 的 code 1，没有家族、没有缺失资产、没有请求字段；
- 读取命令（104801、106101、107302 等）被当成“坏请求”，与“配置缺失”混在一起。

## 证据

- `agent/workflow/interface-catalog/tcp-commands.md` 给出每条命令的请求 schema，例如
  `104801 → pb_act_shop_info_req`、`105401 → pb_premium_free_award_req`、
  `106101 → pb_vickrey_auction_act_info_req`、`107301/107302 → pb_subscription_act_subscribe_req`、
  `35010 → pb_permit_select_award_req`、`97401 → etf`。
- `personal-server/assets/protobuf` 存在对应的 net 描述；用 `codec.root.lookupType` 逐条核对，
  28 个 protobuf schema 全部可解析（测试 1 覆盖）。
- 官方排期下这些家族确有可见入口：type 182 有 8 个开放活动、184 有 16 个、93 有 5 个、
  175 有 3 个、103 有 2 个、1016 有 4 个、1008 有 3 个、1014 有 2 个、1013 有 3 个、62 有 2 个
  （`createActivityCalendar` + `ActFrameAct`，锚点 2026-11-11）。
- 线上 `/data/disk1/game/data/events.jsonl` 里没有 `benefit_command_refused`/`benefit_command_rejected`，
  也没有上述命令号；因此这批是**静态确认**的潜在故障，尚未被真实客户端触发，没有用线上日志冒充证实。
- 拒绝原因本身也有两处与资产不符：`PAY-PREMIUMACT` 说 `PremiumActTable 未导出`，但
  `assets/tables/PremiumActTable.data.lua.json.gz` 已在仓内，且 100/104/108 版本有 Free 行；
  `PAY-PERMIT` 说“ETF 请求契约未取得”，而 35010/35011 的 protobuf schema 已经随协议资产导出。

## 修复

### `personal-server/game/benefit-commerce-service.mjs`

- 新增 `BENEFIT_PROTOBUF_REQUESTS`：28 条被拒绝命令 → 请求 schema，来源是 tcp-commands 目录与
  protobuf 资产。ETF 家族（97401、33001 等）不在此表，继续走 ETF 路径。
- `requestSchema(type)` 对外暴露，网关据此选择解码方式；`supports` 与可结算命令（87301/84602）不变。
- 拒绝日志改为记录 `card`、`encoding`、`schema`、`reason` 和脱敏后的标量请求字段
  （`summarizeRequest`，最多 8 个字段、数组最多 8 项，不写整包二进制）。
- 校正两处拒绝依据：`PAY-PREMIUMACT`（表已导出，缺的是 Free 解锁条件与 1002 版本的档位）、
  `PAY-PERMIT`（35010/35011 的 protobuf 契约已有，缺的是选奖/换期/买级规则）；
  `PAY-ACTSHOP` 补一句 104801 是读取命令、同样没有可回放的 `shop_list`。

### `personal-server/game/gateway.mjs`

块 I 派发先取 `requestSchema`：有 schema 先 `unpackRequest`，解不开才回退旧的 ETF 路径；
无 schema 保持原行为。这样正常 protobuf 读请求拿到 code 5 与该家族的真实原因，
坏包仍然 code 1，已实现的 ETF 命令（87301、84602）路径不变。

## 回归

新增 `personal-server/test/benefit-command-decode.test.mjs`（5 项）：

1. 28 个 protobuf schema 全部能在协议资产里解析。
2. 7 条代表性 protobuf 命令（104801/104802/104803/105401/106101/107301/106301）经真实网关
   返回 code 5、日志里有 card/schema/请求字段，而不是 code 1。
3. 写命令 104802/104803 重复请求仍是 code 5，登录模块逐字节未变。
4. ETF 家族 97401/33001 保持 code 5，日志 encoding=etf。
5. 既非 protobuf 也非 ETF 的坏包仍是 code 1。

相关回归：`benefit-commerce-gateway`、`benefit-command-decode`、`up-star-gift-service`、
`gameplay-gateway`、`premium-act` 五个文件 33/33 通过。

全量 `npm test`（`node --test --test-concurrency=1 test/*.test.mjs`）：2857 项、2855 通过、0 失败、
2 跳过（`duration_ms` 1211208），其中包含本次新增的 5 项。

## 仍未解决：被表资产阻断的功能

这些家族的“空白/报错”不是解码问题，而是缺配置，本轮**没有**用空包或猜测奖励补齐：

| 家族 | 命令 | 缺什么 |
| --- | --- | --- |
| PAY-ACTSHOP | 104801-104803 | `ActShopTable`（商品、货币、等级奖励）；104801 的 `shop_list` 无从生成 |
| PAY-PREMIUMACT | 105401 | `PremiumActTable` 已有，但 Free 行的解锁条件 `asserts` 未解码；且 1841010 的版本 1002 没有 Free 行 |
| PAY-LINKGIFT | 97401 | `LinkGiftTable`（自选档位）；只有 db 描述、没有 net 描述 |
| PAY-BUYSKINACT | 104001 | `BuySkinActTable` |
| PAY-APPEARANCERELEASEACT | 98800 | `AppearanceReleaseActTable` |
| PAY-NEWPERMITACT | 107401 | `NewPermitActTable` |
| PAY-VICKREYAUCTIONACT | 106101-106102 | `VickreyAuctionActTable`（场次、底价、结算） |
| PAY-SUBSCRIPTIONACT | 107301-107303 | `SubscriptionActTable`（周期、奖励、入场） |
| PAY-GIFTBOXACT | 106301 | `GiftBoxActTable`（档位与领取条件） |
| PAY-PERMIT | 35003-35011 | 买级、期数调整、福利、手动结算、选奖与换期规则 |
| PAY-LEVELSPRINT | 88101 | `LevelSprintTable`（档位奖励）；67001 在官方排期内开放，命令为 ETF |
| PAY-REBATESHOPACT | 100701 | `RebateShopActTable`（返利档位）；138004 在官方排期内开放，命令为 ETF |

查找范围：`personal-server/assets/tables` 185 个表、`assets/protobuf` 656 个描述、
`rg --files` 全仓（含 `analysis/`、`docs/`、`agent/`）均无上述表；当前环境没有 APK 与解码 lua bundle。

读取命令（104801、106101、107302 等）现在会返回 code 5 与精确原因，页面仍然拿不到数据；
把它们变成可用页面需要先取得上表资产，这一点在证据补齐前不能靠服务端伪造。

## 限制

- 共享文件改动只有 `gateway.mjs` 的块 I 派发分支和 `benefit-commerce-service.mjs`；合并时注意与
  其它 agent 相邻的网关改动。
- 没有客户端请求日志，不能证明这些入口当前一定被点击；证据等级按“静态确认”记录。
- 本轮未部署、未重启、未做 APK 视觉验收。
