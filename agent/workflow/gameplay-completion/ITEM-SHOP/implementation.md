# ITEM-SHOP 实施记录：普通商店、快速购买、刷新、结算与历史商品

日期：2026-11-07
分支：task/ITEM-SHOP-20261106（worktree .worktree/gameplay-20261106/item-shop）
任务卡：docs/plans/remaining-gameplay-20261106/04-items-tasks-shops.md 的 ITEM-SHOP 小节

## 范围与结论

本轮补齐 ShopCmd 的 6 条未路由命令，并把已有的 1201/1202 接到同一份权威状态：

| type | 命令 | 本轮行为 |
| ---: | --- | --- |
| 1201 | req_buy_shop_item | 保留魔灵活动店原有分支；普通商店商品改由新服务购买 |
| 1202 | req_shops_info | 普通商店返回真实货架/限购，其它 id 仍转交原活动店实现 |
| 1203 | fast_buy_item | 单件/少量商品购买（ETF 单参数） |
| 1204 | req_shop_settle | 按购买日结算并落 SQLite，重复结算为空列表 |
| 1205 | req_shop_wipe_butt | 清掉本周期已售罄货架格 |
| 1206 | req_shop_buy_history_item | 在 buy_history_turn 窗口内补买历史特殊商品 |
| 1207 | req_shop_easy_buy_item | 批量购买（同一事务，多件合并回包） |
| 1208 | req_refresh_shop | 手动刷新计数 + 重建货架 + 可选扣费 |

状态分级：服务端完成、组件与临时 TCP 通过、SQLite 重开与回滚验证通过；未做 APK/UI 验收（本轮禁止启停服务与操作模拟器）。

## 配置与协议依据

静态目录记录（agent/workflow/interface-catalog/static-interfaces.json 与 inventory.json）：

- tcp:c2s:1201:req_buy_shop_item：protobuf pb_req_buy_shop_item → pb_res_to_client
- tcp:c2s:1202:req_shops_info：ETF（单参数）→ pb_query_shops_back；tcp-commands.md 标记为实观/已解码（recording protocol-2026-10-25-r2a:game:tcp-69:c2s:2049）
- tcp:c2s:1203:fast_buy_item、tcp:c2s:1207:req_shop_easy_buy_item：ETF → pb_res_to_client
- tcp:c2s:1204:req_shop_settle：ETF → pb_shop_settle_back
- tcp:c2s:1205:req_shop_wipe_butt：ETF → pb_shop_info
- tcp:c2s:1206:req_shop_buy_history_item：protobuf pb_req_buy_history_item → pb_rev_buy_history_item
- tcp:c2s:1208:req_refresh_shop：ETF → pb_manual_refresh_shop_back（详细交接见 agent/workflow/interface-catalog/shop-1208.md）

协议原文（仓库内可直接核对）：

- personal-server/assets/protobuf/shop.net.proto.bin（SHA256 09a5ea27bfd9f1997a4807d1a2b17f642b136fbeaa3f4ec29ba3f6256b52f7ad）
    - pb_req_buy_history_item 注释“请求补买历史特殊商品”，day = 跨天秒数
    - pb_manual_refresh_shop_back 注释“随机商店手动刷新回复”，字段名是单数 res
    - pb_shop_settle_back = shop + repeated pb_period_settle_data
- personal-server/assets/protobuf/shop.db.proto.bin（SHA256 83aed13af1a575c06a0bc11429aa78ffdc362c4d8a412661d007e86e3a119712）
    - pb_shop_item_info 只有 tid(2)/buy_count(3)，格子位置由数组顺序决定（原 proto 注释：tag 1 cell_id 已移除）
    - pb_shop_auto_refresh：next_refresh_time / limit_bought_count（限购商品本周期总购买次数）/ items_history_bought
    - pb_shop_item_bought：buy_count + day（跨天时间秒数）
    - pb_shop_quick / pb_shop_quick_buy：快捷购买列表（tid + pb_count_flush）
- personal-server/assets/protobuf/flush_time.db.proto.bin：pb_count_flush{flush_time,count}

配置表（personal-server/config/game-tables.mjs 读取 ShopTable.data.lua.json）：

| 表 | 关键字段 | 用途 |
| --- | --- | --- |
| ShopItem（1408 行） | tid、item、count、price、currency_type、purchase_limit、sort_weight | 商品池、奖励、价格分档、限购 |
| ShopMain（14 行） | shop_id、group | 普通商店入口 id |
| ShopPeriod（28 行） | version、settle_client（如 PyramidMgr.ShopSettle） | 周期商店版本/结算入口 |
| ShopAutoRefresh（7 行） | refresh_type、purchase_limit、buy_history_turn、buy_history_item | 自动刷新、限购、补买窗口 |

由 ShopItem.tid 推导出的关键事实（实现直接依赖）：

- shop_id = floor(tid / 10^7)：例如 2040101001 → 商店 204，2070101001 → 商店 207。
- price 是分档列表：[[1,300]] 表示首档 1 件单价 300；[[1,0],[2,30],[3,30],[4,50],[5,80],[6,100]]（207 补买商品）表示档位越高单价越高；负单价（如 7010101001 的 [[1,-1]]）属于充值商品，服务端明确拒绝。
- purchase_limit=0 表示不限购；ShopAutoRefresh.purchase_limit 是整店限购上限。
- 仅 ShopAutoRefresh 有 buy_history_item/buy_history_turn 的店支持 1206；当前数据只有 207（补买物 2070101001、窗口 9 天）。

## 实现设计

新增 personal-server/game/shop-service.mjs（createShopService），构造期用 store.inspect(db => db.exec(...)) 幂等建表，未改 storage/game-store.mjs：

| 表 | 作用 |
| --- | --- |
| shop_cells | 当前货架格（cell_index 顺序即 pb_shop_info.items_groups[].item_list 顺序） |
| shop_shelf_state | 货架快照标记；空货架（全部售罄）与“从未生成货架”因此可区分 |
| shop_purchases | 购买流水：request_id、day、count、unit_price、currency_tid、payload_json、settled |
| shop_buy_totals | 每角色/店/商品/日的已购次数（限购与 buy_count 的权威来源） |
| shop_refresh_state | 手动刷新计数、免费次数、上次刷新时间 |
| shop_settlements | 已结算周期（（role_id,shop_id,period）主键，天然幂等） |

业务规则：

1. 购买（1201 普通店 / 1203 / 1207 / 1206）：校验商品属于该店、格子与商品一致、数量 1..999、限购、单价分档；在同一个 store.transaction 内依次完成扣货币、发物品、写流水/限购、编码回包。编码失败或 SQLite 写失败整体 ROLLBACK。
2. 防重：request_id 默认由 (type, connection, seq) 组成（同 pet-activity 约定），重复请求直接返回首次结果且不再次扣费；测试也支持显式 requestId。
3. 限购：按 (shop, item, day) 累计，day = floor(now/86400)*86400（跨天秒数，与 pb_shop_item_bought.day 同口径）。达到 purchase_limit 返回业务错误 307。
4. 库存/货架：默认按 sort_weight 读配置；1208/1205 一旦生成货架快照，后续 1201/1202/1203/1207 都读 SQLite 同一份。
5. 刷新（1208）：仅 ShopAutoRefresh 配置的商店；递增 all_refresh_count/pay_refresh_count（有免费次数时扣免费次数），并在事务内重建货架。刷新不会重置当日限购。
6. 结算（1204）：把该店 settled=0 的购买按日聚合，写入 shop_settlements 并把流水标记 settled=1；再次结算返回空 settle_list。
7. 补买历史（1206）：只接受配置了 buy_history_item 的店与商品，day 必须是跨天边界且落在 today - buy_history_turn*86400 <= day < today；购买计入该历史日的限购，回包 items_history_bought 来自 shop_purchases 聚合。
8. 1202 读取：普通商店返回真实 pb_shop_info（items_groups[0].group_data_bin 对自动刷新店编码 pb_shop_auto_refresh，与改造前行为一致）；没有普通商店 id 时返回 null 让网关走原分支。

网关改动（personal-server/game/gateway.mjs）只增加一个受 shop.supports(type) 保护的派发块，位置紧邻 1201/1202。该块对非普通商店（如魔灵活动店 5070005）返回 null 让原处理路径继续执行，因此 1201/1202 的既有分支保持不变。

## 改动文件

- personal-server/game/shop-service.mjs（新增）
- personal-server/game/gateway.mjs（1 处 import、1 处服务构造、1 个派发块）
- personal-server/test/item-shop-service.test.mjs（新增，15 项）
- personal-server/test/gameplay-gateway.test.mjs（1202 回归断言由“402 为空”更新为“402 返回 28 件真实商品”）
- 本文件

## 复现命令

    cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\item-shop\personal-server
    node --test test/item-shop-service.test.mjs
    node --test test/gameplay-gateway.test.mjs
    npm test

## 验证证据

- 专项服务测试：node --test test/item-shop-service.test.mjs → 15 pass / 0 fail（购买、批量购买、余额不足、非法商品、限购、重复请求、刷新计费与回滚、结算幂等、历史补买窗口、擦屁股、SQLite 失败回滚、编码失败回滚、重开数据库、1202 合并）。
- TCP：同一文件最后一个用例走现有握手（verify + AES）→ 909103 登录 → 1202（pb_query_shops_back）→ 1203（pb_res_to_client 扣 100 钻）→ 再次 1202 看到 buy_count=1，证明网关与登录/读取共享同一份 SQLite 状态。
- SQLite：shop_purchases/shop_buy_totals/shop_settlements 在重开后仍生效；DROP 表与编码异常两个用例证明整体回滚。
- 全量：npm test → 2099 tests / 2096 pass / 3 fail，失败全部来自 login-business-reads.test.mjs（缺少本地 analysis/.../handoff-game.local-only.sqlite 的既有环境缺口），与商店实现无关。

## APK 验收边界

本轮未启停实时服务、未操作模拟器、未读写 runtime.local-only.data，因此：

- 服务端业务、临时 TCP、SQLite 已验证；
- 真实 com.jzyx.ps 客户端点击商店、刷新动画、结算弹窗、补买历史 UI 尚未验收；
- 组件/TCP 通过不能当作 APK 可玩验收。

## 剩余缺口（具体、可核查）

1. ETF 请求形状未运行时取证：1202-1205/1207/1208 在 static-interfaces.json 中只有“单个输入寄存器”，shop-1208.md 明确写着“具体 ETF 元组/列表形状、字段含义和合法取值范围仍需运行时证据”。实现按标量 id、[id,count]、[shop,cell,item,count]、对象和对象列表做了容错解析；真实客户端使用哪一种仍需录制确认。
2. 1205 wipe_butt 语义未恢复：仓库只有响应 schema（pb_shop_info），无客户端调用点与字段证据。当前实现为“清掉本周期已售罄的货架格”，幂等且不产生资源变化；如真实语义不同（例如快捷购买购物车），需要录制后调整。
3. 1204 settleData 负载未知：pb_period_settle_data.settleData 的字节内容由客户端 PyramidMgr.ShopSettle 解释，仓库无该结构。当前只写 period（天序号），settleData 为空，并已在 shop_settlements 落地结算事实。
4. 刷新费用无配置表：ShopTable 没有刷新价格行，pb_shop_manual_refresh 只有计数。默认刷新免费，仅通过构造函数注入的 refreshRules.costFor 支持扣费；测试覆盖了扣费与不足回滚。
5. 随机货架未实现：ShopItem.weight/is_rare_goods 未证明是可刷新抽取池。当前刷新只重建配置货架顺序，不会随机替换商品，也不会重置当日限购。
6. 周期/截止时间 group_data_bin 未恢复：周期商店（ShopPeriod）的 pb_shop_period/pb_shop_end_time 分组负载没有证据，当前仅自动刷新店编码 pb_shop_auto_refresh。
7. 登录模块未接商店槽位：仓库未证明普通商店在登录模块中的 id/schema，因此登录包里不写商店状态；客户端通过 1202/1205/1208 回包读取。
8. 充值类商品：负单价格（如 701 店的 [[1,-1]]）需走充值链路，当前明确返回 5。
