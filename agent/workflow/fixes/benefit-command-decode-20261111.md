# 块 I 礼包/活动命令：schema 解码、拒绝依据与资产复核

更新时间：2026-11-12（Asia/Shanghai）。分支 `fix/up-star-gift-20261111`，worktree
`.worktree/up-star-gift-20261111`，开工 HEAD `b044a0d`。`origin/main` 仍为 `3a1518f`。

本轮没有启停服务、写运行库、操作客户端/ADB/APK 或部署。

## 原始问题

块 I 原先把一批实际为 protobuf 的命令统一按 ETF 解码，客户端正常请求会先得到 code 1，
无法进入家族拒绝原因。另一类问题是拒绝文案使用旧资产结论，例如表或 protobuf 已经导出，
服务仍声称它们缺失。

## 已修复

### 请求解码

`benefit-commerce-service.mjs` 中的 `BENEFIT_PROTOBUF_REQUESTS` 现在保留 27 条命令到请求 schema 的映射。
`104801` 已从该表移除，由 `act-shop-service.mjs` 在 benefit 路由之前直接解码
`pb_act_shop_info_req` 并返回真实商店信息。

网关按下列顺序处理：

1. `31052/31053` → UpStarGift 独立 service；
2. `104801` → ActShop 独立 service；
3. 其余 benefit 命令：有 schema 时先 `unpackRequest`，无 schema 时走 ETF；
4. 解不开的坏包仍返回 code 1，不把协议错误伪装成 code 5。

拒绝日志包含 `type/card/encoding/schema/reason/request`。请求摘要最多保留 8 个标量字段和 8 个数组项，
不写完整二进制。

### 已校正的拒绝依据

| 家族 | 当前准确边界 |
| --- | --- |
| `PAY-WEEKENDBONUS` | WeekendBonusTable、模块 145 与 protobuf 已导出；缺请求 tid→WeekendBonus/Func.skip_func 映射、today/total play_count 权威来源、`reward_bin` 写回。 |
| `PAY-DIAMONDFUND` | Type/SteadyFundAward/FortuneFundAward 已可解码；缺购买周期、day_award 选择、minimum_count 保底和 day_award_history。 |
| `PAY-WEEKHUNT` | TaskType/Period/Const/Task/Progress/OldTask 已解码；缺 task_id 进度、common_progress/week_common_task 位图和 93403 领取迁移。 |
| `PAY-FLASHSALE` | ActivityTable 有 FlashSaleTaskGroup/Task/Version/Const/Gift；缺版本选择、进度源、砍价节点/暴击算法、gift_hero 和玩家领取位。 |
| `PAY-LINKGIFT` | LinkGiftTable、db proto 与完整 Lua 已导出；缺 normal_tid/choose_gift 自选约束、版本作用域和写回错误。 |
| `PAY-LEVELSPRINT` | LevelSprintTable 与 pb_level_sprint 已导出；缺等级来源、免费档领取编码和重复领取错误。 |
| `PAY-REBATESHOPACT` | RebateShopActTable 与 Lua 已导出；缺消费账本、is_global_cost、Award.cost 匹配与 got_shop_award。 |
| `PAY-APPEARANCERELEASEACT` | 表、Lua、protobuf 已导出；缺 interact_state 编码、NPC 映射、每日上限与领取持久化。 |
| `PAY-BUYSKINACT` | 表、Lua、protobuf 已导出；缺 item_id 免费条目、unlock_day/gift、时间窗与补领规则。 |
| `PAY-VICKREYAUCTIONACT` | 表、Lua、db/net 已导出；缺跨玩家密封出价、前五隐私、第二价格成交、扣款退款与全服结算。 |
| `PAY-GIFTBOXACT` | 表、Lua、protobuf 已导出；缺 Box/Gift 条件、base_recharge 与 box_bought_list/gift_get_list 迁移。 |
| `PAY-SUBSCRIPTIONACT` | 表、Lua、db/net 已导出；缺全服 round、配额抽签、winner、扣款和结算邮件。 |
| `PAY-NEWPERMITACT` | 表、Lua、db/net 已导出；缺 Tier recharge/condition/add_value、pay_list、奖励条件和邮件结算。 |
| `PAY-ACTSHOP` | 104801 已实现；104802/104803 缺购买与多层奖励状态迁移。 |
| `PAY-PREMIUMACT` | 表与 Lua 已导出；缺 Free.asserts、免费领取规则和当前 1002 版本无 Free 行的行为。 |
| `PAY-FASHION` | FashionTable、模块 110 与 protobuf 已存在；缺本轮 FashionCmd/Mgr/Data Lua 和运行样本，不能把旧“表未导出”继续当原因。 |
| `PAY-REDENVELOPE` | red_envelope db/net 已定义 `pb_red_envelope` 与复数响应；仍缺 RedEnvelopeTable、红包实例、掉落、发送者维度和领取位。 |

完整 43 个家族/83 个命令的矩阵见
[activity-asset-audit-20261112.md](activity-asset-audit-20261112.md)。

## APK/资产基线

- APK：`com.jzyx.ps v1.55.090365`，versionCode 362155，assetVersion 364110，
  SHA256 `3caa14ca150f8259f5e83d263e6a0a43f9b94df7eb9e3d3f58e0fdc494970d95`。
- `64_lua_project.bundle`：`2b1fd41f3fb40ea3d3dcd1b7d1591d3d17ffacbc6422c028de4dc02ad04ecdc7`。
- `64_lua_core.bundle`：`054c3a1d5de29f66b5f41f413ac56a473ee7b95ccf1226b343068b79cdd3be56`。
- 交付校验为 559 文件、219 TextAssets、27 UI bundles、18 tables、67 required checks，失败数 0。
- 所有 protobuf schema 均由项目 `assets/protobuf/*.proto.bin` 的 `codec.root.lookupType` 校验；
  不按命令名或数字区间猜 schema。

## 当前入口与证据等级

正式排期静态确认有开放入口的家族包括 LinkGift、AppearanceRelease、BuySkin、Vickrey、GiftBox、
Subscription、NewPermit、Permit、PremiumAct、RebateShop 和 ActShop。具体 ID 见全量审计矩阵。

`events.jsonl` 中没有当前 43 个家族/83 个命令的真实请求，因此这些修复与剩余拒绝都是**静态确认**，
不是线上证实。`benefit_command_refused` 事件也没有被用作证据。

## 回归

`benefit-command-decode.test.mjs` 覆盖：

- 27 个 protobuf 请求 schema 全部可查找；
- 已交付资产对应的拒绝原因不再声称表缺失；
- FashionTable/模块 110 与红包 protobuf 的纠正文案保持有效；
- 代表性 protobuf 命令经真实网关进入家族 code 5，而不是 code 1；
- 写命令被拒时模块 92 逐字节不变，重复请求仍拒绝；
- ETF 家族保持 ETF 解码；
- 既非 protobuf 也非 ETF 的坏包仍返回 code 1。

本轮定向套件（ActShop、UpStar、本文件、block-I gateway、activity calendar/read）68/68 通过。
最终全量 `npm run test:all` 为 2898 项、pass 2896、fail 0、skipped 2，两项跳过均因未设置
`FC_RECHARGE_CLIENT_BUNDLE`；日志 `analysis/test-runs/up-star-gift-20261112/main-merge-all.log`。

## 限制

- 表、protobuf 和 Lua 存在只证明静态契约资料，已完整证明的状态机才进入执行分支；其余继续 code 5。
- 没有真实客户端请求样本，无法确认哪些入口今天被玩家点击。
- 没有部署、重启、APK/视觉验收或运行库写入。
