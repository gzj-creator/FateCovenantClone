# 商城限购礼包售罄刷新

- 日期：2026-11-10
- worktree：`F:\projects\FateCovenantClone\.worktree\store-sellout-refresh-20261110`
- 分支：`fix/store-sellout-refresh-20261110`
- 起点：`main@5a08aa7`
- 状态：服务端修复和组件回归完成；未部署实时服务，未操作 ADB/APK，待客户端视觉验收

## 用户现象

迎新礼包及其他商城限购礼包购买成功后，卡片仍可点击，没有立即显示“已售罄”。需要排查此前提交是否已修复，并覆盖商城里的全部限购礼包。

## 此前提交结论

提交 `4638bfc fix: repair all purchase event handoffs` 没有覆盖这个问题。它补齐了普通购买的非空回包、flag 73、模块 19 购买记录以及月卡/通行证等处理，但商城页面实际由 `RegularGiftMgr` 管理：登录数据是模块 26 `pb_regular_gift_info`，购买后的页面刷新依赖 `extra_ret_list` 中 flag 7 携带的完整 `pb_regular_gift_info`。旧实现没有返回 flag 7，也没有在服务端维护模块 26，因此购买事实虽然落库，当前页面仍保留旧库存状态，重登后才可能恢复。

现金礼包的 16004 回包还有第二个缺口：`RegularGiftMgr.OnRechargeOrBuySuccess` 从 `extra_params` 第一项读取购买组 ID，并据此触发 `REGULAR_GIFT_REFRESH_EVT`。旧实现统一返回日限购三元组，商城礼包无法命中该回调。

## 客户端契约

- `RegularGiftMgr.LoginParse` 解码模块 26 `pb_regular_gift_info`，按 `gift_list[].type` 建立 `regMap`。
- `RegularGiftMgr.OnRechargeOrBuySuccess` 对 flag 7 解码整包 `pb_regular_gift_info`，逐行覆盖 `regMap[type]`，随后触发 `REGULAR_GIFT_REFRESH_EVT`。不能只返回刚购买的单个商品，否则同 type 的其他商品会被局部数据覆盖。
- `NormalGiftForm` 同时监听购买事件和 `REGULAR_GIFT_REFRESH_EVT`，收到后重新执行 `_Init`。
- `ReqBuyRegularGift(groupId, rechargeId)` 把组 ID 带入购买链路；现金 16004 必须在 `res_recharge_success.extra_params` 回放该组 ID。资源礼包 16005 的客户端请求闭包已经持有组 ID，但仍需 flag 7 刷新模块。
- 卡片售罄判断读取对应购买项的 `buy_limit_info.buy_num_list[].buy_num`，并与 `RechargeTable.Recharge.can_buy_times` 比较。

## 配置覆盖

`RegularGiftTable` 共 22 个 Type、88 个 Group、11 个 RegularGift 配置行。当前有效页面为 17 个 type；88 个 Group 去重后对应 84 个 `RechargeTable` SKU，其中 83 个是限购产品，只有 `290000` 为不限购产品。

修复由统一配置驱动，不按迎新礼包或其他具体商品写白名单：

- 模块 26 始终返回 17 个有效 type 行。
- 有 `RegularGift` 配置的 type 返回该 type 下完整的 `buy_num_list`。
- 无配置的现有 type 行原样保留，避免破坏登录快照。
- 同一 type 下重复出现在多个 Group 的同一 SKU 只输出一行，避免重复计数和 UI 重复卡片。
- 日/周计数沿用项目 05:00 Asia/Shanghai 的充值周期；终身/不重置商品保持累计。
- 服务端以 `recharge_orders` 为权威数据源。启动、登录回填以及每次购买都会重建完整快照。
- 16005 批量购买先写入本次 `buy_num`，再生成快照，避免立即回包只按 1 次计数。

## 实现

- 新增 `personal-server/assets/tables/RegularGiftTable.data.lua.json.gz`。
- `personal-server/config/game-tables.mjs` 加载 `RegularGiftType`、`RegularGiftGroup`、`RegularGift` 与 `RegularGiftPriceAnchor`。
- 新增 `personal-server/game/regular-gift-service.mjs`：
  - 建立 SKU 到购买组、页面 type 的映射；
  - 从订单和商品周期重建购买次数；
  - 生成完整模块 26 快照；
  - 提供启动恢复、购买刷新、type/group 查询接口。
- `personal-server/game/wallet-service.mjs`：
  - 16004 现金购买和 16005 资源礼包购买成功后都追加 flag 7；
  - 同步更新服务端模块 26；
  - 现金商城礼包的 `extra_params` 优先返回真实购买组 ID；
  - 保留已有 flag 73 和活动礼包返回，不改变其他购买类型的优先级。

## 回归覆盖

新增 `personal-server/test/regular-gift-service.test.mjs`：

- 校验 17 个有效 type、84 个去重 SKU、83 个限购 SKU 全部映射，且每个组 ID 都来自配置。
- 为 83 个限购 SKU 分别生成达到 `can_buy_times` 的订单，验证每个都进入模块 26，并达到客户端可判定的售罄值。
- 验证日/周计数跨周期归零，终身计数保留。
- 验证资源礼包立即返回完整 flag 7，同 type 其他已购商品不被覆盖。
- 验证现金礼包返回 flag 73 和完整 flag 7，且 `extra_params` 为真实的 `22001001` 组 ID。
- 验证批量购买次数立即反映到快照，重启后模块 26 仍可从订单恢复。

扩展 `purchase-flow-regression.test.mjs` 和 `welfare-service.test.mjs`，覆盖现金 `112037` 与资源礼包 `111011` 的真实购买回包、数据库持久化和重启恢复。

## 验证结果

目标支付/钱包/商城回归：47/47 通过。

```powershell
cd F:\projects\FateCovenantClone\.worktree\store-sellout-refresh-20261110\personal-server
node --test --test-concurrency=1 test/regular-gift-service.test.mjs test/purchase-flow-regression.test.mjs test/welfare-service.test.mjs test/wallet-service.test.mjs
```

全量测试：2806 项，pass 2804、fail 0、skipped 2。日志为 `analysis/test-runs/store-sellout-refresh-20261110/full.log`。

```powershell
npm test
```

`RegularGiftTable.data.lua.json.gz` 为 2,097 字节，SHA256 `471a42b9171de367100e0196dd3cd794ff9298ae0351171640df04bc15d800e9`，与本地抽取源文件一致。

## 未做事项

- 本轮没有启动/重启实时服务，没有读写运行数据库。
- 本轮没有操作模拟器、ADB 或 APK，因此没有“购买后立即显示已售罄”的客户端视觉证据。
- 本轮范围是商城礼包购买后的模块 26/flag 7 售罄刷新；其他活动礼包只保留原有返回，不在此任务中扩大改动。
