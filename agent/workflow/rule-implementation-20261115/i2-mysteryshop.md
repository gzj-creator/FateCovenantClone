# I2 ITEM-MYSTERYSHOP 证据与实施（2026-11-15）

范围：`91501`自动刷新、`91502`手动刷新、`91503`购买。本轮只开放`91503`已能闭合的窄子域；整个配置域仍有原证据债务。

## 原证据

- 原表资产 `MysteryShopTable.data.lua.bin` SHA256：`4c575e23cb8235f43882a908ad6b3d8b3c0d8047c1d1f352bd4f6f582afd1c1c`；离线导出资产 SHA256：`808a38cba85759e0e8e9a2de4c8660eaa8415d74680840483b7402ee89cd6459`。
- 行数：`CellType=5`、`Cell=14`、`ItemLib=418`、`Const=1`、`ManualRefresh=5`、`DiscountLibType=5`、`DiscountLib=35`。
- 同版客户端[MysteryShopCmd](../../../analysis/scratchpad/command-closure-46-20261115/item-a/prototypes/9307536155876792000-MysteryShopCmd.lua.json)发送`req_mystery_shop_buy`；[MysteryShopMgr](../../../analysis/scratchpad/command-closure-46-20261115/item-a/prototypes/2978148339313972000-MysteryShopMgr.lua.json)读取`cell_id`、`is_bought`、`discount_item_tid`、`discount_price_index`，购买后触发`BuyShopItemEvt`并用`pb_res_to_client`消费返还。
- 登录模块162解码为`pb_mystery_shop`，其中`discount_items`是权威服务器持久化商品；`next_auto_refresh_time/last_manual_refresh_time/manual_refresh_count/all_times_data/buy_times`分别保存刷新时钟、次数和购买统计。
- 客户端价格算法读取`ItemLib.discount_price[DiscountLib.discount_idx]`并按`DiscountLib.discount/100`计算；原入口还读取`ItemLib.cost_item`、`item`和`count`。

## 91503 已实现边界

- ETF请求只接受一个正整数`cell_id`；响应schema为`pb_res_to_client`。
- 只从模块162当前持久化`discount_items`中选择cell，不接受客户端另付商品或价格；商品、折扣必须存在且家族一致。
- `Cell.pre_condition`或`ItemLib.pre_condition`任一存在时支付前err5。当前共3个Cell、116个ItemLib带该类未恢复字段。
- 基础价必须是安全正整数、折扣后分子必须被100整除；非整数圆整规则未取得时支付前err5。
- 成功在单事务内完成成本`ItemLib.cost_item × 计算价`、产物`ItemLib.item × ItemLib.count`、`is_bought=true`、`buy_times+1`、request幂等账本和PB编码。编码或SQLite失败会回滚全部资源、模块和账本变化。
- 同request或同cell的完成请求返回原结果，不重复扣款；登录重开保留购买位和资源结果。

## 仍失败关闭

- `91501`：原自动刷新候选池/权重、`all_times_data`、时间段和商品替换规则未取得。
- `91502`：最大5次、成本`100/100/120/120/150`货币`101500`已恢复，但候选生成、`manual_refresh_cw`消费和状态替换未取得，未在执行前扣费。
- `88401/88402`：rollback_type到8类对象及成本`500/100/100/100/100/100/100/100`货币`101500`已恢复，但原预览清单、返还公式、重置范围和`to_client`消费者未闭合。

## 验证

- `node --test --test-concurrency=1 personal-server/test/mystery-shop-service.test.mjs`：10/10。
- `node --test --test-concurrency=1 personal-server/test/mystery-shop-gateway.test.mjs`：1/1；覆盖真实临时TCP握手/登录模块162、ETF购买、重复不二次扣款、PB回包、SQLite重开和再次登录投影。
- 失败关闭专项与真实TCP代表路由另行纳入本轮全量。

边界：APK、生产TCP、生产库和部署未验收。
