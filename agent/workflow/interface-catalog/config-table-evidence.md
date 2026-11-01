# 商店、装备与套装箱：配置表证据（2026-11-01）

接口目录中 1203 fast_buy_item、1204 req_shop_settle、1206 req_shop_buy_history_item、1208 req_refresh_shop、1001 req_equip_level_up、1002 req_equip_forge、1006 req_equip_wear、use_selected_suit_box 之前都标注为“缺少对应配置表证据”。本轮把三类配置表从客户端产物中取出来，能接的接到本机服务配置里，并逐项记录还缺什么。

## 证据来源（全部来自当前隔离客户端产物）

字节码目录 analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/ 下：

| 文件 | 用途 |
| --- | --- |
| textassets/4378987152432345000-EquipTable.data.lua.bin | 装备表，客户端只发布字节码，没有现成 JSON |
| textassets/8988636953529905000-ShopCmd.lua.bin | 1201–1208 的请求编码器 |
| textassets/9308603914844770000-ShopMgr.lua.bin | 调用侧参数与限购判断 |
| textassets/17675057160066701000-ShopBase.lua.bin | 购买参数拼装与价格分档计算 |
| textassets/15687479523091480000-ItemCmd.lua.bin、13517926679985600000-ItemSuitBox.lua.bin、1063512598223554800-ItemSuitBoxSelectUseForm.lua.bin、13508732289462840000-ItemSuitBoxSelectNode.lua.bin | 套装箱使用链路 |
| bytecode/ItemTable.data.lua.json | 物品表（含 OptionalSuitBox、OptionalSuitRes、OptionalSuitType） |

另有协议原文 assets__Android__protobuf.bundle/textassets/4424708766097489400-shop.net.proto.bin 与 832867815760916000-shop.db.proto.bin，商店表 analysis/tmp/activity-decompiled/ShopTable.data.lua.json（prototype dump，已被 personal-server/config/game-tables.mjs 使用）。

新增工具 tools/dump-table-prototypes.mjs 把任意 .lua.bin 转成 readGeneratedTables 能读的 prototype dump，装备表 dump 已生成到 analysis/tmp/equipment-decompiled/EquipTable.data.lua.json；这不是手工抄写的数据。

重新生成命令（analysis/ 在 .git/info/exclude 中不入库，换机器需先跑一次）：

node tools/dump-table-prototypes.mjs "analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/4378987152432345000-EquipTable.data.lua.bin" "analysis/tmp/equipment-decompiled/EquipTable.data.lua.json"

## 装备表 EquipTable

已接入 personal-server/config/equip-tables.mjs，断言在 personal-server/test/equip-tables.test.mjs。

| 表 | 行数 | 关键列 |
| --- | ---: | --- |
| Equip | 80 | tid、type（1 到 4）、quality、exp、lv_max、cost、per_level_attrs、attrs、refine_limit_lv、inscription_limit_lv、unlock、unlock_args |
| Type | 4 | tid、type、show_name、def_icon |
| Level | 2000 | equip_type、level_exp、cost；行键是 type 乘 10000 加 level（类型 1 从 10001 起，类型 4 从 40001 起） |
| EQ_Forge | 20 | 打造展示与星级表现（quality、star_type、show_ 前缀列、特效 prefab） |
| EQ_Quality / EQ_Master_Quality | 6 / 5 | 品质星级展示、大师品质区间 range |
| Master | 123 | type、attrs、condition |
| Talent | 22 | 天赋文案与解锁条件 |
| Refine | 320 | cost、exp_once、exp_total、base_attrs、once_attrs、lucky_weight |
| Inscription | 520 | cost、base_attrs、talent_attrs |
| ResExchange | 9 | 熔炼兑换：value、forge_lv、condition |
| Const | 1 | cell_count 为 6、one_key_refine 为 4、strength_rate、refine_master_per、inject_open 为 5、awaken_open 为 5 |
| DevelopType | 4 | 养成页签名称与开放条件 |
| EQ_Refine_Show / EQ_Inscription_Stage | 4 / 14 | 精炼与铭刻的阶段表现 |

据此可确定：pb_equip.tid 指向 Equip 行，装备类型取 Equip.type；单级强化消耗按 Level 行逐级取用；pb_equip.inscription 与 refine 的上限取自该行的 inscription_limit_lv 与 refine_limit_lv；格子数量上限是 Const.cell_count 为 6。

仍未证：Equip.cost 是打造消耗还是解锁消耗，以及 Level.level_exp 与 pb_equip.level_exp 的对应关系，都要靠运行时回包确认，本轮没有把两者当成同一条公式；req_equip_wear 的 index/id/tid 三个数值字段在 proto 中没有注释，本机也没有装备穿戴状态模型，尚未实现。

## 商店表 ShopTable

| 表 | 行数 | 用途 |
| --- | ---: | --- |
| Item | 1408 | 商品行：tid、item（发放物）、count、currency_type、price（分档）、purchase_limit、weight、sort_weight、buy_condition、is_hide、need_red |
| ItemQuickBuy | 57 | 快捷购买：day_buy_limit、price（按第几次购买的单价分档）、currency_type |
| CellLib | 406 | 货架格：shop_item_lib |
| CellRefresh | 290 | 格刷新规则：refresh_type、is_show_goods、未开放与购买提示 |
| Main | 14 | 大厅商店入口：shop_id、group、text、item_show、tag_red |
| Group | 6 | 入口分组配色与标题 |
| AutoRefresh / CellAutoRefresh | 7 / 13 | 自动刷新商店：refresh_type、purchase_limit、buy_history_item、fun_open |
| Period / SwitchRefresh / ManualRefresh / EndTime / Common | 28 / 1 / 1 / 1 / 2 | 各类商店的开放版本与入口表单 |
| ManualRefreshSetting | 1 | 手动刷新：refresh_currency、max_free_refresh_count、refresh_pay_count、max_pay_count、auto_refresh_time、free_refresh_time |
| RefreshType / Const / Module / MainCarousel | 6 / 1 / 7 / 若干 | 刷新文案、通用常量、入口 Lua 模块、轮播 |

调用侧证据：

- ShopCmd 的 1202、1203、1204、1205、1207、1208 都是 EncodeErl，每个方法只转发两个位置参数；1201 与 1206 是 protobuf。
- ShopBase 第 21 个原型组装 req_buy_shop_item：shop_id 取 self.shopId，cell_index 取 item.cellIndex，shop_item_id 取 item.tid，count 取 num，groupParam 为 nil。item.tid 就是 ShopTable.Item 的行键。
- ShopBase 第 19 个原型是价格计算：price 被当作“累计购买量上限、该档单价”的数组，按当前购买次数逐档扣减数量，剩余数量再用最后一档单价结算。这同时解释了 Item.price 的 [[5,2500]] 写法和 ItemQuickBuy.price 的 15 项递增写法（后者可视为每档上限为 1 的展开）。
- ShopMgr 第 23 个原型是 fast_buy_item：先按 ShopTable.ItemQuickBuy 的 day_buy_limit 与本地当日购买数比较，超限直接 Err.ACHIEVE_LIMIT，否则发送 tid 与 count 两个参数。
- ShopMgr 第 12 个原型是 req_shops_info，只带一个位置参数；接口目录里已观察到的 1202 请求 ETF 是 6 个 shop id，说明这 6 个 id 属于同一个位置参数。

据此可落地的边界：1201 与 1203 的回包都是 pb_res_to_client（接口目录已记录），单价与限购都能从 ShopTable 直接算出，不需要猜测配置。仍未证、实现前需要补运行时证据的是：buy_count 在服务端的重置时机、pb_shop_info.version 的递增规则、group_data_bin 的二进制含义、1204 的 pb_shop_settle_back 字段、1206 的 day 参数语义。仓库当前 1202 只按请求 id 回空分组，没有商品数据，这些购买接口仍返回明确的未实现错误。

## 套装箱（use_selected_suit_box）

先更正类型号：接口目录里 153 是 use_repeat_box，套装箱是 155。ItemCmd 的方法顺序为 use_box 151、use_selected_box 152、use_repeat_box 153、manual_convert_item 154、use_selected_suit_box 155、req_chip_compose 156、batch_use_box 157、req_one_key_chip_compose 158、req_one_key_use_item 159，与 tcp-commands.md 一致。

配置与链路：

- 物品侧：ItemTable.Item 中 8 行 type 为 83，ItemTable.Type 第 83 行的 obj_class 为 ItemSuitBox、res_type 为 1200，例如 1071200、1351200、1471200、1481200、1681200、1691200、1701200、1711200。
- 可选套装：ItemTable.OptionalSuitBox 的 range 列出可选套装 id（如 1071200 对应 201 与 202）；每个 id 指向 ItemTable.OptionalSuitRes 的一行，其 award_list 是选中后整包发放的四件套（如 201 对应 6007109、6007209、6007309、6007409 各 1 件）。OptionalSuitType 只有 1 行，仅提供 get_desc_func 用于描述文案。
- 请求：ItemSuitBox 的 Use 发 tid 与 index 两个值，ItemSuitBoxSelectUseForm 把节点 awardIndex 存进 _curSelectIndex，ItemSuitBoxSelectNode 用 range 的 awardIndex 位置取 OptionalSuitRes 行渲染，因此 index 是 range 的 1 基位置，不是 OptionalSuitRes 的行键。
- 回包：pb_res_to_client（tcp-commands.md 已记录），一次请求消耗 1 个装箱。

已实现：personal-server/game/item-box-service.mjs 新增 openSuitBox，网关把 155 的 ETF 参数（tid 与 index）转给它；非选择式开箱 151、157、159 遇到套装箱会明确拒绝，不会出现装箱被消耗却什么都不发的情况。测试见 personal-server/test/item-suit-box.test.mjs。

当前明确边界：真实配置里 award_list 全是 ItemTable.Type 第 9 行的 Relic 圣器物品，而本机 resources.mjs 还没有 9:Relic 的奖励处理器，grantResources 会以显式的“无处理器”错误回滚整笔事务。也就是说 155 的选择与消耗逻辑已闭环，真正发奖还差一层圣器背包模型，这层不能用空奖励或伪造资源绕过。

## 各接口现状

| type | 接口 | 配置表证据 | 实现状态 | 仍缺 |
| ---: | --- | --- | --- | --- |
| 1001 | req_equip_level_up | Equip、Level 已接入 equip-tables.mjs | 未实现 | 装备背包与穿戴状态模型；level_exp 与强化经验的对应 |
| 1002 | req_equip_forge | 同上，另有 EQ_Forge、ResExchange | 未实现 | 打造与熔炼的扣费分支未在回包中验证 |
| 1006 | req_equip_wear | Equip、Const.cell_count | 未实现 | index/id/tid 语义、格子与编队 equip_ids 的同步 |
| 1203 | fast_buy_item | ItemQuickBuy 的 day_buy_limit、price、currency_type | 未实现 | 当日购买计数的持久化与重置 |
| 1204 | req_shop_settle | ShopTable.Const、Period | 未实现 | pb_shop_settle_back 字段与结算规则 |
| 1206 | req_shop_buy_history_item | AutoRefresh.buy_history_item | 未实现 | day 参数语义、pb_rev_buy_history_item 结构 |
| 1208 | req_refresh_shop | CellRefresh、CellLib、ManualRefreshSetting | 未实现 | 刷新抽选算法、免费与付费次数回填、version 递增 |
| 155 | use_selected_suit_box | OptionalSuitBox、OptionalSuitRes | 已实现，受圣器处理器阻塞 | 9:Relic 奖励处理器 |

## 可执行验证

node --test personal-server/test/equip-tables.test.mjs

node --test personal-server/test/item-suit-box.test.mjs

npm test --prefix personal-server

本轮实测：定向 4 项与 5 项全部通过，全量 541/541 通过（合并完成后复跑）。

本轮没有部署服务、没有操作模拟器，也没有改动运行库；上文“已实现”只代表代码与组件测试，不代表 APK 实测或界面验收。

